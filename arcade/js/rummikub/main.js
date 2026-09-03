import { INITIAL_MELD_MINIMUM_POINTS, getLeftoverHandPenalty } from "./tiles.js";
import { validateTurnCommit } from "./validation.js";
import {
    renderHand,
    renderBoard,
    renderOpponents,
    renderTurnStatus,
    captureTilePositions,
    playFlipAnimations,
} from "./render.js";
import { initDragAndDrop } from "./drag-drop.js";
import {
    createRoom,
    joinRoom,
    subscribeToRoom,
    startGame,
    commitMove,
    drawTileAndPassTurn,
    markPlayerConnection,
} from "./firebase-sync.js";
import {
    playPickup,
    playDrop,
    playInvalid,
    playDraw,
    playEndTurnSuccess,
    playYourTurn,
    playWin,
    isSoundMuted,
    setSoundMuted,
} from "./sound.js";

const SESSION_STORAGE_KEY = "arcade-rummikub-session";
const LEADERBOARD_STORAGE_KEY = "arcade-rummikub-leaderboard-player-name";
const HAND_SORT_MODE_STORAGE_KEY = "arcade-rummikub-hand-sort-mode";
const LEADERBOARD_DATABASE_URL =
    "https://co-housing-e2c00-default-rtdb.europe-west1.firebasedatabase.app/arcade-rummikub-leaderboard";
const LEADERBOARD_MAX_ENTRIES_SHOWN = 10;
const MINIMUM_PLAYERS_TO_START = 2;
const INVALID_MOVE_SHAKE_DURATION_MS = 400;

const views = {
    landing: document.getElementById("view-landing"),
    waitingRoom: document.getElementById("view-waiting-room"),
    game: document.getElementById("view-game"),
    gameOver: document.getElementById("view-game-over"),
};

const elements = {
    createSection: document.getElementById("landing-create-section"),
    joinSection: document.getElementById("landing-join-section"),
    createNameInput: document.getElementById("create-name-input"),
    createRoomButton: document.getElementById("create-room-button"),
    showJoinFormButton: document.getElementById("show-join-form-button"),
    showCreateFormButton: document.getElementById("show-create-form-button"),
    joinNameInput: document.getElementById("join-name-input"),
    joinCodeInput: document.getElementById("join-code-input"),
    joinRoomButton: document.getElementById("join-room-button"),
    landingErrorMessage: document.getElementById("landing-error-message"),

    waitingRoomCode: document.getElementById("waiting-room-code"),
    waitingPlayerList: document.getElementById("waiting-player-list"),
    startGameButton: document.getElementById("start-game-button"),
    waitingHint: document.getElementById("waiting-hint"),
    copyRoomCodeButton: document.getElementById("copy-room-code-button"),

    turnStatus: document.getElementById("turn-status"),
    opponentsStrip: document.getElementById("opponents-strip"),
    poolCount: document.getElementById("pool-count"),
    boardZone: document.getElementById("board-zone"),
    handZone: document.getElementById("hand-zone"),
    actionMessage: document.getElementById("action-message"),
    actionBar: document.getElementById("action-bar"),
    drawButton: document.getElementById("draw-button"),
    endTurnButton: document.getElementById("end-turn-button"),
    resetTurnButton: document.getElementById("reset-turn-button"),
    gameRoot: document.getElementById("game-root"),
    sortByColorButton: document.getElementById("sort-by-color-button"),
    sortByNumberButton: document.getElementById("sort-by-number-button"),
    muteToggleButton: document.getElementById("mute-toggle-button"),

    gameOverSummary: document.getElementById("game-over-summary"),
    leaderboardList: document.getElementById("leaderboard-list"),
};

let session = null; // { roomCode, playerId }
let latestRoom = null;
let unsubscribeFromRoom = null;

let draftBoard = [];
let draftHand = [];
let turnStartBoard = [];
let turnStartHand = [];
let draftInitializedForTurnIndex = null;
let selectedTileId = null;
let handSortMode = "color"; // "color" | "number"
let wasMyTurnLastRender = false;
let hasRenderedGameViewOnce = false;
let hasPlayedGameOverSound = false;

function showView(viewName) {
    Object.entries(views).forEach(([name, element]) => {
        element.hidden = name !== viewName;
    });
}

function loadSession() {
    try {
        const raw = localStorage.getItem(SESSION_STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch (error) {
        return null;
    }
}

function saveSession(newSession) {
    session = newSession;
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(newSession));
}

function clearSession() {
    session = null;
    localStorage.removeItem(SESSION_STORAGE_KEY);
}

function cloneModel(value) {
    return JSON.parse(JSON.stringify(value));
}

function isMyTurn(room) {
    return room && room.turnOrder[room.currentTurnIndex] === session.playerId;
}

function setActionMessage(message) {
    elements.actionMessage.textContent = message || "";
}

// ---------------------------------------------------------------
// Landing / lobby
// ---------------------------------------------------------------

elements.showJoinFormButton.addEventListener("click", () => {
    elements.createSection.hidden = true;
    elements.joinSection.hidden = false;
    elements.landingErrorMessage.textContent = "";
});

elements.showCreateFormButton.addEventListener("click", () => {
    elements.joinSection.hidden = true;
    elements.createSection.hidden = false;
    elements.landingErrorMessage.textContent = "";
});

elements.createRoomButton.addEventListener("click", async () => {
    const name = elements.createNameInput.value.trim();
    if (!name) {
        elements.landingErrorMessage.textContent = "Vul eerst je naam in.";
        return;
    }
    elements.createRoomButton.disabled = true;
    try {
        const { roomCode, playerId } = await createRoom(name);
        saveSession({ roomCode, playerId });
        attachRoomSubscription(roomCode);
    } catch (error) {
        elements.landingErrorMessage.textContent = "Kon geen room aanmaken. Probeer opnieuw.";
    } finally {
        elements.createRoomButton.disabled = false;
    }
});

elements.joinRoomButton.addEventListener("click", async () => {
    const name = elements.joinNameInput.value.trim();
    const code = elements.joinCodeInput.value.trim();
    if (!name || !code) {
        elements.landingErrorMessage.textContent = "Vul je naam en de roomcode in.";
        return;
    }
    elements.joinRoomButton.disabled = true;
    try {
        const { roomCode, playerId } = await joinRoom(code, name);
        saveSession({ roomCode, playerId });
        attachRoomSubscription(roomCode);
    } catch (error) {
        elements.landingErrorMessage.textContent = error.message || "Kon niet bij deze room aansluiten.";
    } finally {
        elements.joinRoomButton.disabled = false;
    }
});

elements.copyRoomCodeButton.addEventListener("click", async () => {
    const originalLabel = elements.copyRoomCodeButton.textContent;
    try {
        await navigator.clipboard.writeText(session.roomCode);
        elements.copyRoomCodeButton.textContent = "Gekopieerd!";
    } catch (error) {
        elements.copyRoomCodeButton.textContent = "Kopiëren mislukt";
    }
    setTimeout(() => {
        elements.copyRoomCodeButton.textContent = originalLabel;
    }, 1500);
});

elements.startGameButton.addEventListener("click", async () => {
    elements.startGameButton.disabled = true;
    try {
        await startGame(session.roomCode);
    } finally {
        elements.startGameButton.disabled = false;
    }
});

// ---------------------------------------------------------------
// Room subscription — drives which view is shown and re-renders it
// ---------------------------------------------------------------

function attachRoomSubscription(roomCode) {
    if (unsubscribeFromRoom) unsubscribeFromRoom();
    unsubscribeFromRoom = subscribeToRoom(roomCode, onRoomChanged);
    markPlayerConnection(roomCode, session.playerId, true);
    window.addEventListener("beforeunload", () => {
        markPlayerConnection(roomCode, session.playerId, false);
    });
}

function onRoomChanged(room) {
    if (!room || !room.players[session.playerId]) {
        clearSession();
        showView("landing");
        return;
    }

    latestRoom = room;

    if (room.status === "waiting") {
        renderWaitingRoom(room);
        showView("waitingRoom");
        return;
    }

    if (room.status === "playing") {
        hasPlayedGameOverSound = false;
        syncDraftForTurn(room);
        renderGameView(room);
        showView("game");
        return;
    }

    if (room.status === "finished") {
        renderGameOver(room);
        showView("gameOver");
    }
}

function renderWaitingRoom(room) {
    elements.waitingRoomCode.textContent = session.roomCode;
    elements.waitingPlayerList.innerHTML = "";
    room.turnOrder.forEach((playerId) => {
        const listItem = document.createElement("li");
        listItem.textContent = room.players[playerId].name;
        elements.waitingPlayerList.appendChild(listItem);
    });

    const isHost = room.turnOrder[0] === session.playerId;
    const canStart = room.turnOrder.length >= MINIMUM_PLAYERS_TO_START;
    elements.startGameButton.hidden = !isHost;
    elements.startGameButton.disabled = !canStart;
    elements.waitingHint.textContent = isHost
        ? canStart
            ? "Iedereen erbij? Start het spel."
            : `Wacht op nog minstens ${MINIMUM_PLAYERS_TO_START - room.turnOrder.length} speler(s).`
        : "Wachten tot de host het spel start…";
}

// ---------------------------------------------------------------
// Game view — draft state, drag/drop wiring, actions
// ---------------------------------------------------------------

function syncDraftForTurn(room) {
    const myTurnNow = isMyTurn(room);
    const turnChanged = draftInitializedForTurnIndex !== room.currentTurnIndex;

    if (myTurnNow && turnChanged) {
        turnStartBoard = cloneModel(room.board || []);
        turnStartHand = cloneModel(room.hands[session.playerId] || []);
        draftBoard = cloneModel(turnStartBoard);
        draftHand = cloneModel(turnStartHand);
        draftInitializedForTurnIndex = room.currentTurnIndex;
        selectedTileId = null;
    } else if (!myTurnNow) {
        draftInitializedForTurnIndex = null;
    }
}

function currentDisplayModel(room) {
    if (isMyTurn(room)) return { board: draftBoard, hand: draftHand };
    return { board: room.board || [], hand: room.hands[session.playerId] || [] };
}

function findTileLocation(tileId) {
    if (draftHand.some((tile) => tile.id === tileId)) return { type: "hand" };
    for (let setIndex = 0; setIndex < draftBoard.length; setIndex += 1) {
        if (draftBoard[setIndex].some((tile) => tile.id === tileId)) return { type: "set", index: setIndex };
    }
    return null;
}

// Note: does NOT drop now-empty sets from draftBoard — that happens once, at
// the end of moveTile, so a destination set index captured before this call
// still points at the right array even if removing the dragged tile emptied
// an earlier-indexed set.
function removeTileFromDraft(tileId) {
    const location = findTileLocation(tileId);
    if (!location) return null;

    if (location.type === "hand") {
        const tileIndex = draftHand.findIndex((tile) => tile.id === tileId);
        const [removedTile] = draftHand.splice(tileIndex, 1);
        return removedTile;
    }

    const setTiles = draftBoard[location.index];
    const tileIndex = setTiles.findIndex((tile) => tile.id === tileId);
    const [removedTile] = setTiles.splice(tileIndex, 1);
    return removedTile;
}

function moveTile(tileId, destination) {
    const tile = removeTileFromDraft(tileId);
    if (!tile) return;

    if (destination.type === "hand") {
        draftHand.push(tile);
    } else if (destination.type === "newSet") {
        draftBoard.push([tile]);
    } else if (destination.type === "set") {
        const targetSet = draftBoard[destination.index];
        if (targetSet) targetSet.push(tile);
        else draftBoard.push([tile]);
    }

    draftBoard = draftBoard.filter((setTiles) => setTiles.length > 0);
}

function triggerInvalidMoveShake() {
    elements.actionBar.classList.remove("rk-action-bar--shake");
    // Force a reflow so re-adding the class restarts the animation even if
    // the previous shake hasn't finished yet.
    void elements.actionBar.offsetWidth;
    elements.actionBar.classList.add("rk-action-bar--shake");
    setTimeout(() => elements.actionBar.classList.remove("rk-action-bar--shake"), INVALID_MOVE_SHAKE_DURATION_MS);
}

function renderGameView(room) {
    const { board, hand } = currentDisplayModel(room);
    const myTurnNow = isMyTurn(room);

    const previousPositions = captureTilePositions([elements.boardZone, elements.handZone]);

    renderTurnStatus(elements.turnStatus, room, session.playerId);
    renderOpponents(elements.opponentsStrip, room, session.playerId);
    elements.poolCount.textContent = `${(room.pool || []).length} in de pot`;

    renderBoard(elements.boardZone, board, { selectedTileId });
    renderHand(elements.handZone, hand, { selectedTileId, sortMode: handSortMode });
    playFlipAnimations([elements.boardZone, elements.handZone], previousPositions);

    elements.sortByColorButton.classList.toggle("rk-sort-button--active", handSortMode === "color");
    elements.sortByNumberButton.classList.toggle("rk-sort-button--active", handSortMode === "number");

    const hasUnsavedChanges =
        JSON.stringify(draftBoard) !== JSON.stringify(turnStartBoard) ||
        JSON.stringify(draftHand) !== JSON.stringify(turnStartHand);

    elements.drawButton.hidden = !myTurnNow;
    elements.endTurnButton.hidden = !myTurnNow;
    elements.resetTurnButton.hidden = !myTurnNow;
    elements.drawButton.disabled = !myTurnNow || hasUnsavedChanges;
    elements.endTurnButton.disabled = !myTurnNow || !hasUnsavedChanges;
    elements.resetTurnButton.disabled = !myTurnNow || !hasUnsavedChanges;

    const hasMelded = room.players[session.playerId]?.hasMelded;
    if (myTurnNow && !hasMelded) {
        setActionMessage(`Eerste zet moet minstens ${INITIAL_MELD_MINIMUM_POINTS} punten waard zijn.`);
    } else if (!myTurnNow) {
        setActionMessage("");
    }

    if (myTurnNow && !wasMyTurnLastRender && hasRenderedGameViewOnce) {
        playYourTurn();
    }
    wasMyTurnLastRender = myTurnNow;
    hasRenderedGameViewOnce = true;
}

initDragAndDrop(elements.gameRoot, {
    isInteractive: () => latestRoom && isMyTurn(latestRoom),
    onDragStart: () => playPickup(),
    onDrop: (tileId, destination) => {
        const actualTileId = tileId || selectedTileId;
        if (!actualTileId) return;
        moveTile(actualTileId, destination);
        selectedTileId = null;
        playDrop();
        renderGameView(latestRoom);
    },
    onTap: (tileId) => {
        const wasSelected = selectedTileId === tileId;
        selectedTileId = wasSelected ? null : tileId;
        if (!wasSelected) playPickup();
        renderGameView(latestRoom);
    },
});

elements.sortByColorButton.addEventListener("click", () => setHandSortMode("color"));
elements.sortByNumberButton.addEventListener("click", () => setHandSortMode("number"));

function setHandSortMode(mode) {
    if (handSortMode === mode) return;
    handSortMode = mode;
    try {
        localStorage.setItem(HAND_SORT_MODE_STORAGE_KEY, mode);
    } catch (error) {
        // ignore — sort preference just won't persist
    }
    if (latestRoom) renderGameView(latestRoom);
}

function updateMuteButtonLabel() {
    const muted = isSoundMuted();
    elements.muteToggleButton.textContent = muted ? "🔇" : "🔊";
    elements.muteToggleButton.setAttribute("aria-label", muted ? "Geluid aanzetten" : "Geluid uitzetten");
}

elements.muteToggleButton.addEventListener("click", () => {
    setSoundMuted(!isSoundMuted());
    updateMuteButtonLabel();
});

elements.drawButton.addEventListener("click", async () => {
    elements.drawButton.disabled = true;
    playDraw();
    await drawTileAndPassTurn(session.roomCode, session.playerId);
});

elements.resetTurnButton.addEventListener("click", () => {
    draftBoard = cloneModel(turnStartBoard);
    draftHand = cloneModel(turnStartHand);
    selectedTileId = null;
    setActionMessage("");
    renderGameView(latestRoom);
});

elements.endTurnButton.addEventListener("click", async () => {
    const hasMelded = latestRoom.players[session.playerId]?.hasMelded;
    const result = validateTurnCommit({
        previousBoard: turnStartBoard,
        previousHand: turnStartHand,
        newBoard: draftBoard,
        newHand: draftHand,
        hasMelded,
    });

    if (!result.valid) {
        setActionMessage(result.reason);
        playInvalid();
        triggerInvalidMoveShake();
        return;
    }

    elements.endTurnButton.disabled = true;
    playEndTurnSuccess();
    await commitMove(session.roomCode, session.playerId, {
        newBoard: draftBoard,
        newHand: draftHand,
        becameMelded: result.becameMelded,
    });
});

// ---------------------------------------------------------------
// Game over + leaderboard (same pattern as luna/js/mixtape.js)
// ---------------------------------------------------------------

function getSavedLeaderboardName() {
    try {
        return localStorage.getItem(LEADERBOARD_STORAGE_KEY) || "";
    } catch (error) {
        return "";
    }
}

function normalizeLeaderboardNameKey(name) {
    return name.trim().toLowerCase().replace(/[.#$/[\]]/g, "_");
}

async function loadLeaderboard() {
    try {
        const response = await fetch(`${LEADERBOARD_DATABASE_URL}/scores.json`);
        if (!response.ok) return {};
        return (await response.json()) || {};
    } catch (error) {
        return {};
    }
}

async function recordWin(playerName) {
    try {
        const entryKey = normalizeLeaderboardNameKey(playerName);
        const scores = await loadLeaderboard();
        const previousWins = scores[entryKey]?.wins || 0;
        await fetch(`${LEADERBOARD_DATABASE_URL}/scores/${entryKey}.json`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: playerName, wins: previousWins + 1 }),
        });
    } catch (error) {
        // Leaderboard is a nice-to-have — a failed write shouldn't block the game-over screen.
    }
}

function renderLeaderboard(scores) {
    const rankedEntries = Object.values(scores)
        .filter((entry) => entry && typeof entry.wins === "number")
        .sort((a, b) => b.wins - a.wins)
        .slice(0, LEADERBOARD_MAX_ENTRIES_SHOWN);

    elements.leaderboardList.innerHTML = "";
    if (rankedEntries.length === 0) {
        elements.leaderboardList.innerHTML = '<li class="rummikub-leaderboard-empty">Nog geen winnaars — wees de eerste!</li>';
        return;
    }

    rankedEntries.forEach((entry, index) => {
        const listItem = document.createElement("li");
        listItem.innerHTML = `<span></span><span>${entry.wins} gewonnen</span>`;
        listItem.querySelector("span").textContent = `${index + 1}. ${entry.name}`;
        elements.leaderboardList.appendChild(listItem);
    });
}

async function renderGameOver(room) {
    const winner = room.players[room.winnerPlayerId];
    const standings = room.turnOrder
        .map((playerId) => ({
            name: room.players[playerId].name,
            penalty: playerId === room.winnerPlayerId ? 0 : getLeftoverHandPenalty(room.hands[playerId] || []),
            isWinner: playerId === room.winnerPlayerId,
        }))
        .sort((a, b) => a.penalty - b.penalty);

    elements.gameOverSummary.innerHTML = "";
    const winnerHeading = document.createElement("p");
    winnerHeading.className = "rummikub-game-over-winner";
    winnerHeading.textContent = `${winner.name} wint! 🎉`;
    elements.gameOverSummary.appendChild(winnerHeading);

    const standingsList = document.createElement("ul");
    standings.forEach((entry) => {
        const listItem = document.createElement("li");
        listItem.textContent = entry.isWinner ? `${entry.name} — 0 punten over` : `${entry.name} — ${entry.penalty} punten over`;
        standingsList.appendChild(listItem);
    });
    elements.gameOverSummary.appendChild(standingsList);
    if (!hasPlayedGameOverSound) {
        hasPlayedGameOverSound = true;
        playWin();
    }

    if (room.winnerPlayerId === session.playerId) {
        await recordWin(room.players[session.playerId].name);
    }
    renderLeaderboard(await loadLeaderboard());
}

// ---------------------------------------------------------------
// Boot
// ---------------------------------------------------------------

function init() {
    try {
        const savedSortMode = localStorage.getItem(HAND_SORT_MODE_STORAGE_KEY);
        if (savedSortMode === "color" || savedSortMode === "number") handSortMode = savedSortMode;
    } catch (error) {
        // ignore — falls back to the default sort mode
    }
    updateMuteButtonLabel();

    elements.joinNameInput.value = getSavedLeaderboardName();
    elements.createNameInput.value = getSavedLeaderboardName();
    [elements.createNameInput, elements.joinNameInput].forEach((input) => {
        input.addEventListener("change", () => {
            try {
                localStorage.setItem(LEADERBOARD_STORAGE_KEY, input.value.trim());
            } catch (error) {
                // ignore — name just won't be pre-filled next time
            }
        });
    });

    const savedSession = loadSession();
    if (savedSession) {
        session = savedSession;
        attachRoomSubscription(savedSession.roomCode);
    } else {
        showView("landing");
    }
}

init();
