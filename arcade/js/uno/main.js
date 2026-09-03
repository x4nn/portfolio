import { isWildType, getHandPenalty } from "./cards.js";
import { isCardPlayable } from "./rules.js";
import {
    renderHand,
    renderDiscardTop,
    renderDrawPile,
    renderPlayersStrip,
    renderTurnStatus,
    captureCardPositions,
    playFlipAnimations,
} from "./render.js";
import {
    createRoom,
    joinRoom,
    subscribeToRoom,
    startGame,
    playCard,
    drawCard,
    callUno,
    catchUno,
    markPlayerConnection,
} from "./firebase-sync.js";
import {
    playCardPlay,
    playDraw,
    playSkipOrReverse,
    playDrawPenalty,
    playInvalid,
    playUnoCall,
    playYourTurn,
    playWin,
    isSoundMuted,
    setSoundMuted,
} from "./sound.js";

const SESSION_STORAGE_KEY = "arcade-uno-session";
const LEADERBOARD_STORAGE_KEY = "arcade-uno-leaderboard-player-name";
const LEADERBOARD_DATABASE_URL =
    "https://co-housing-e2c00-default-rtdb.europe-west1.firebasedatabase.app/arcade-uno-leaderboard";
const LEADERBOARD_MAX_ENTRIES_SHOWN = 10;
const MINIMUM_PLAYERS_TO_START = 2;
const TURN_CHANGING_CARD_TYPES = ["skip", "reverse"];

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
    directionIndicator: document.getElementById("direction-indicator"),
    actionMessage: document.getElementById("action-message"),
    playersStrip: document.getElementById("players-strip"),
    drawPile: document.getElementById("draw-pile"),
    discardPile: document.getElementById("discard-pile"),
    handZone: document.getElementById("hand-zone"),
    unoCallButton: document.getElementById("uno-call-button"),
    muteToggleButton: document.getElementById("mute-toggle-button"),

    colorPickerOverlay: document.getElementById("color-picker-overlay"),
    colorPickerCancelButton: document.getElementById("color-picker-cancel-button"),

    gameOverSummary: document.getElementById("game-over-summary"),
    leaderboardList: document.getElementById("leaderboard-list"),
};

let session = null; // { roomCode, playerId }
let latestRoom = null;
let unsubscribeFromRoom = null;
let wasMyTurnLastRender = false;
let hasRenderedGameViewOnce = false;
let hasPlayedGameOverSound = false;
let pendingWildCardId = null;

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

    const previousRoom = latestRoom;
    latestRoom = room;

    if (room.status === "waiting") {
        renderWaitingRoom(room);
        showView("waitingRoom");
        return;
    }

    if (room.status === "playing") {
        hasPlayedGameOverSound = false;
        playTurnChangeSoundIfNeeded(previousRoom, room);
        renderGameView(room);
        showView("game");
        return;
    }

    if (room.status === "finished") {
        renderGameOver(room);
        showView("gameOver");
    }
}

function playTurnChangeSoundIfNeeded(previousRoom, room) {
    if (previousRoom && previousRoom.topCard && room.topCard && previousRoom.topCard.id !== room.topCard.id) {
        if (TURN_CHANGING_CARD_TYPES.includes(room.topCard.type) || room.topCard.type === "drawTwo" || room.topCard.type === "wildDrawFour") {
            playSkipOrReverse();
        }
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
// Game view
// ---------------------------------------------------------------

function renderGameView(room) {
    const myTurnNow = isMyTurn(room);
    const hand = room.hands[session.playerId] || [];

    const previousPositions = captureCardPositions([elements.handZone, elements.discardPile, elements.drawPile]);

    renderTurnStatus(elements.turnStatus, elements.directionIndicator, room, session.playerId);
    renderPlayersStrip(elements.playersStrip, room, session.playerId, {
        onCatch: async (targetPlayerId) => {
            playDrawPenalty();
            await catchUno(session.roomCode, targetPlayerId);
        },
    });
    renderDiscardTop(elements.discardPile, room.topCard, room.activeColor);
    renderDrawPile(elements.drawPile, (room.drawPile || []).length);
    renderHand(elements.handZone, hand, {
        isPlayableCard: (card) => myTurnNow && isCardPlayable(card, room.topCard, room.activeColor),
    });

    playFlipAnimations([elements.handZone, elements.discardPile, elements.drawPile], previousPositions);

    elements.drawPile.disabled = !myTurnNow;

    const myPlayer = room.players[session.playerId];
    elements.unoCallButton.hidden = !(myPlayer.handCount === 1 && !myPlayer.hasCalledUno);

    if (myTurnNow) {
        setActionMessage("Tik een kaart om te spelen, of trek een kaart.");
    } else {
        setActionMessage("");
    }

    if (myTurnNow && !wasMyTurnLastRender && hasRenderedGameViewOnce) {
        playYourTurn();
    }
    wasMyTurnLastRender = myTurnNow;
    hasRenderedGameViewOnce = true;
}

async function handlePlayCard(cardId) {
    const room = latestRoom;
    const hand = room.hands[session.playerId] || [];
    const card = hand.find((handCard) => handCard.id === cardId);
    if (!card) return;

    if (!isCardPlayable(card, room.topCard, room.activeColor)) {
        playInvalid();
        setActionMessage("Deze kaart past niet op de stapel.");
        return;
    }

    if (isWildType(card.type)) {
        pendingWildCardId = cardId;
        elements.colorPickerOverlay.hidden = false;
        return;
    }

    playCardPlay();
    await playCard(session.roomCode, session.playerId, cardId);
}

elements.handZone.addEventListener("click", (event) => {
    const cardElement = event.target.closest(".uno-card[data-card-id]");
    if (!cardElement || !latestRoom || !isMyTurn(latestRoom)) return;
    handlePlayCard(cardElement.dataset.cardId);
});

elements.drawPile.addEventListener("click", async () => {
    if (!latestRoom || !isMyTurn(latestRoom)) return;
    playDraw();
    await drawCard(session.roomCode, session.playerId);
});

elements.unoCallButton.addEventListener("click", async () => {
    playUnoCall();
    await callUno(session.roomCode, session.playerId);
});

elements.colorPickerOverlay.querySelectorAll(".uno-color-swatch").forEach((swatchButton) => {
    swatchButton.addEventListener("click", async () => {
        const chosenColor = swatchButton.dataset.color;
        elements.colorPickerOverlay.hidden = true;
        if (!pendingWildCardId) return;
        playCardPlay();
        await playCard(session.roomCode, session.playerId, pendingWildCardId, chosenColor);
        pendingWildCardId = null;
    });
});

elements.colorPickerCancelButton.addEventListener("click", () => {
    elements.colorPickerOverlay.hidden = true;
    pendingWildCardId = null;
});

function updateMuteButtonLabel() {
    const muted = isSoundMuted();
    elements.muteToggleButton.textContent = muted ? "🔇" : "🔊";
    elements.muteToggleButton.setAttribute("aria-label", muted ? "Geluid aanzetten" : "Geluid uitzetten");
}

elements.muteToggleButton.addEventListener("click", () => {
    setSoundMuted(!isSoundMuted());
    updateMuteButtonLabel();
});

// ---------------------------------------------------------------
// Game over + leaderboard
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
        elements.leaderboardList.innerHTML = '<li class="uno-leaderboard-empty">Nog geen winnaars — wees de eerste!</li>';
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
            penalty: playerId === room.winnerPlayerId ? 0 : getHandPenalty(room.hands[playerId] || []),
            isWinner: playerId === room.winnerPlayerId,
        }))
        .sort((a, b) => a.penalty - b.penalty);

    elements.gameOverSummary.innerHTML = "";
    const winnerHeading = document.createElement("p");
    winnerHeading.className = "rk-game-over-winner";
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
