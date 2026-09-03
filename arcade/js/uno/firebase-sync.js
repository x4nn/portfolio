// Realtime multiplayer sync for UNO — same approach as Rummikub's
// firebase-sync.js (own top-level key, Firebase JS SDK for genuine push
// updates), kept as an independent copy rather than a shared module so each
// game folder stays self-contained.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getDatabase, ref, get, set, update, onValue } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";

import { CARD_COLORS, createFullDeck, shuffleArray, STARTING_HAND_SIZE, isWildType } from "./cards.js";
import { computeNextTurnState, drawCardsFromPile } from "./rules.js";

const FIREBASE_CONFIG = {
    databaseURL: "https://co-housing-e2c00-default-rtdb.europe-west1.firebasedatabase.app",
};

const ROOMS_ROOT_KEY = "arcade-uno-rooms";
const ROOM_CODE_LENGTH = 4;
const ROOM_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // no I/O — easy to misread out loud
const UNO_PENALTY_DRAW_COUNT = 2;

const firebaseApp = initializeApp(FIREBASE_CONFIG);
const database = getDatabase(firebaseApp);

function generateRoomCode() {
    let code = "";
    for (let index = 0; index < ROOM_CODE_LENGTH; index += 1) {
        code += ROOM_CODE_ALPHABET[Math.floor(Math.random() * ROOM_CODE_ALPHABET.length)];
    }
    return code;
}

function generatePlayerId() {
    return `player-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function roomRef(roomCode) {
    return ref(database, `${ROOMS_ROOT_KEY}/${roomCode}`);
}

export async function createRoom(hostName) {
    const playerId = generatePlayerId();
    let roomCode = generateRoomCode();

    for (let attempt = 0; attempt < 5; attempt += 1) {
        const existingRoomSnapshot = await get(roomRef(roomCode));
        if (!existingRoomSnapshot.exists()) break;
        roomCode = generateRoomCode();
    }

    await set(roomRef(roomCode), {
        status: "waiting",
        createdAt: Date.now(),
        turnOrder: [playerId],
        currentTurnIndex: 0,
        players: {
            [playerId]: { name: hostName, connected: true, handCount: 0, hasCalledUno: true },
        },
        hands: {},
        winnerPlayerId: null,
    });

    return { roomCode, playerId };
}

export async function joinRoom(roomCode, playerName) {
    const normalizedRoomCode = roomCode.trim().toUpperCase();
    const roomSnapshot = await get(roomRef(normalizedRoomCode));
    if (!roomSnapshot.exists()) {
        throw new Error("Deze roomcode bestaat niet.");
    }
    const room = roomSnapshot.val();
    if (room.status !== "waiting") {
        throw new Error("Dit spel is al gestart.");
    }

    const playerId = generatePlayerId();
    await update(ref(database, `${ROOMS_ROOT_KEY}/${normalizedRoomCode}`), {
        [`players/${playerId}`]: { name: playerName, connected: true, handCount: 0, hasCalledUno: true },
        turnOrder: [...(room.turnOrder || []), playerId],
    });

    return { roomCode: normalizedRoomCode, playerId };
}

export function subscribeToRoom(roomCode, onRoomChanged) {
    return onValue(roomRef(roomCode), (snapshot) => {
        onRoomChanged(snapshot.exists() ? snapshot.val() : null);
    });
}

export async function markPlayerConnection(roomCode, playerId, connected) {
    await update(roomRef(roomCode), { [`players/${playerId}/connected`]: connected });
}

export async function startGame(roomCode) {
    const roomSnapshot = await get(roomRef(roomCode));
    if (!roomSnapshot.exists()) throw new Error("Room niet gevonden.");
    const room = roomSnapshot.val();

    const turnOrder = shuffleArray(room.turnOrder);

    let deck = shuffleArray(createFullDeck());
    const hands = {};
    turnOrder.forEach((playerId) => {
        hands[playerId] = deck.slice(0, STARTING_HAND_SIZE);
        deck = deck.slice(STARTING_HAND_SIZE);
    });

    // A Wild Draw Four as the opening card gets reshuffled back in and
    // redrawn — there's no sensible "next player" to hand 4 cards to before
    // anyone's had a turn (see rules.js for this and other scoping notes).
    let startingCard = deck.pop();
    while (startingCard.type === "wildDrawFour") {
        deck = shuffleArray([...deck, startingCard]);
        startingCard = deck.pop();
    }
    const startingColor = startingCard.color || CARD_COLORS[Math.floor(Math.random() * CARD_COLORS.length)];

    const playerUpdates = {};
    turnOrder.forEach((playerId) => {
        playerUpdates[`players/${playerId}/handCount`] = STARTING_HAND_SIZE;
        playerUpdates[`players/${playerId}/hasCalledUno`] = true;
    });

    await update(roomRef(roomCode), {
        status: "playing",
        turnOrder,
        currentTurnIndex: 0,
        direction: 1,
        activeColor: startingColor,
        topCard: startingCard,
        discardPile: [startingCard],
        drawPile: deck,
        hands,
        winnerPlayerId: null,
        ...playerUpdates,
    });
}

// `chosenColor` is only used (and required) when the played card is a Wild
// or Wild Draw Four.
export async function playCard(roomCode, playerId, cardId, chosenColor) {
    const roomSnapshot = await get(roomRef(roomCode));
    const room = roomSnapshot.val();

    const hand = room.hands[playerId] || [];
    const cardIndex = hand.findIndex((card) => card.id === cardId);
    const playedCard = hand[cardIndex];
    const newHand = [...hand.slice(0, cardIndex), ...hand.slice(cardIndex + 1)];

    let drawPile = room.drawPile || [];
    let discardPile = [...(room.discardPile || []), playedCard];
    const newActiveColor = isWildType(playedCard.type) ? chosenColor : playedCard.color;

    const updates = {
        [`hands/${playerId}`]: newHand,
        [`players/${playerId}/handCount`]: newHand.length,
        [`players/${playerId}/hasCalledUno`]: newHand.length === 1 ? false : true,
        topCard: playedCard,
        activeColor: newActiveColor,
    };

    const gameFinished = newHand.length === 0;
    if (gameFinished) {
        updates.status = "finished";
        updates.winnerPlayerId = playerId;
    } else {
        const { newDirection, nextTurnIndex, forcedDrawCount, forcedDrawPlayerIndex } = computeNextTurnState(
            room.turnOrder,
            room.currentTurnIndex,
            room.direction,
            playedCard.type
        );

        if (forcedDrawCount > 0 && forcedDrawPlayerIndex !== null) {
            const victimId = room.turnOrder[forcedDrawPlayerIndex];
            const drawResult = drawCardsFromPile(drawPile, discardPile, forcedDrawCount);
            drawPile = drawResult.updatedDrawPile;
            discardPile = drawResult.updatedDiscardPile;
            const victimHand = [...(room.hands[victimId] || []), ...drawResult.drawnCards];
            updates[`hands/${victimId}`] = victimHand;
            updates[`players/${victimId}/handCount`] = victimHand.length;
            updates[`players/${victimId}/hasCalledUno`] = true; // drawing clears any uno vulnerability
        }

        updates.direction = newDirection;
        updates.currentTurnIndex = nextTurnIndex;
    }

    updates.drawPile = drawPile;
    updates.discardPile = discardPile;

    await update(roomRef(roomCode), updates);
}

export async function drawCard(roomCode, playerId) {
    const roomSnapshot = await get(roomRef(roomCode));
    const room = roomSnapshot.val();

    const { drawnCards, updatedDrawPile, updatedDiscardPile } = drawCardsFromPile(
        room.drawPile || [],
        room.discardPile || [],
        1
    );
    const newHand = [...(room.hands[playerId] || []), ...drawnCards];
    const { nextTurnIndex } = computeNextTurnState(room.turnOrder, room.currentTurnIndex, room.direction, null);

    await update(roomRef(roomCode), {
        drawPile: updatedDrawPile,
        discardPile: updatedDiscardPile,
        [`hands/${playerId}`]: newHand,
        [`players/${playerId}/handCount`]: newHand.length,
        [`players/${playerId}/hasCalledUno`]: true,
        currentTurnIndex: nextTurnIndex,
    });
}

export async function callUno(roomCode, playerId) {
    await update(roomRef(roomCode), { [`players/${playerId}/hasCalledUno`]: true });
}

// Any player can catch any other player sitting on one card who hasn't
// called UNO yet — not just the next player, matching how it's usually
// played casually.
export async function catchUno(roomCode, targetPlayerId) {
    const roomSnapshot = await get(roomRef(roomCode));
    const room = roomSnapshot.val();
    const target = room.players[targetPlayerId];
    if (!target || target.handCount !== 1 || target.hasCalledUno) return;

    const { drawnCards, updatedDrawPile, updatedDiscardPile } = drawCardsFromPile(
        room.drawPile || [],
        room.discardPile || [],
        UNO_PENALTY_DRAW_COUNT
    );
    const newHand = [...(room.hands[targetPlayerId] || []), ...drawnCards];

    await update(roomRef(roomCode), {
        drawPile: updatedDrawPile,
        discardPile: updatedDiscardPile,
        [`hands/${targetPlayerId}`]: newHand,
        [`players/${targetPlayerId}/handCount`]: newHand.length,
        [`players/${targetPlayerId}/hasCalledUno`]: true,
    });
}
