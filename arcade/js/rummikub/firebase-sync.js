// Realtime multiplayer sync for Rummikub, on top of the same Firebase
// Realtime Database the rest of this site's `luna/` pages already use — but
// under its own top-level key so it never touches `luna-*` data.
//
// Unlike the plain REST fetch() calls used elsewhere on the site, this uses
// the Firebase JS SDK so we get genuine push updates (onValue) over a
// websocket — turn-based play needs opponents' moves to arrive live, not
// only on page load. Loaded straight from the CDN's ESM build, so this is
// still a zero-build-step, framework-free `<script type="module">`.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import {
    getDatabase,
    ref,
    get,
    set,
    update,
    onValue,
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";

import { createFullTileSet, shuffleArray, PLAYER_HAND_SIZE } from "./tiles.js";

const FIREBASE_CONFIG = {
    databaseURL: "https://co-housing-e2c00-default-rtdb.europe-west1.firebasedatabase.app",
};

const ROOMS_ROOT_KEY = "arcade-rummikub-rooms";
const ROOM_CODE_LENGTH = 4;
const ROOM_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // no I/O — easy to misread out loud

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

    // Vanishingly unlikely to collide, but check anyway rather than silently
    // overwriting someone else's in-progress room.
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
            [playerId]: { name: hostName, connected: true, hasMelded: false, handCount: 0 },
        },
        board: [],
        pool: [],
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
        [`players/${playerId}`]: { name: playerName, connected: true, hasMelded: false, handCount: 0 },
        [`turnOrder`]: [...(room.turnOrder || []), playerId],
    });

    return { roomCode: normalizedRoomCode, playerId };
}

export function subscribeToRoom(roomCode, onRoomChanged) {
    const unsubscribe = onValue(roomRef(roomCode), (snapshot) => {
        onRoomChanged(snapshot.exists() ? snapshot.val() : null);
    });
    return unsubscribe;
}

export async function startGame(roomCode) {
    const roomSnapshot = await get(roomRef(roomCode));
    if (!roomSnapshot.exists()) throw new Error("Room niet gevonden.");
    const room = roomSnapshot.val();

    const turnOrder = shuffleArray(room.turnOrder);
    const shuffledTiles = shuffleArray(createFullTileSet());

    const hands = {};
    let tileCursor = 0;
    turnOrder.forEach((playerId) => {
        hands[playerId] = shuffledTiles.slice(tileCursor, tileCursor + PLAYER_HAND_SIZE);
        tileCursor += PLAYER_HAND_SIZE;
    });
    const pool = shuffledTiles.slice(tileCursor);

    const playerUpdates = {};
    turnOrder.forEach((playerId) => {
        playerUpdates[`players/${playerId}/hasMelded`] = false;
        playerUpdates[`players/${playerId}/handCount`] = PLAYER_HAND_SIZE;
    });

    await update(roomRef(roomCode), {
        status: "playing",
        turnOrder,
        currentTurnIndex: 0,
        board: [],
        hands,
        pool,
        winnerPlayerId: null,
        ...playerUpdates,
    });
}

function nextTurnIndex(room) {
    return (room.currentTurnIndex + 1) % room.turnOrder.length;
}

// Commits a validated turn (see validation.js#validateTurnCommit for the
// rule checks that must already have passed before this is called).
export async function commitMove(roomCode, playerId, { newBoard, newHand, becameMelded }) {
    const roomSnapshot = await get(roomRef(roomCode));
    const room = roomSnapshot.val();

    const gameFinished = newHand.length === 0;

    await update(roomRef(roomCode), {
        board: newBoard,
        [`hands/${playerId}`]: newHand,
        [`players/${playerId}/handCount`]: newHand.length,
        [`players/${playerId}/hasMelded`]: becameMelded,
        currentTurnIndex: gameFinished ? room.currentTurnIndex : nextTurnIndex(room),
        status: gameFinished ? "finished" : "playing",
        winnerPlayerId: gameFinished ? playerId : null,
    });
}

// Draws one tile from the pool into the player's hand and passes the turn —
// used when a player has no valid move (or chooses not to play one).
export async function drawTileAndPassTurn(roomCode, playerId) {
    const roomSnapshot = await get(roomRef(roomCode));
    const room = roomSnapshot.val();

    const pool = room.pool || [];
    if (pool.length === 0) {
        await update(roomRef(roomCode), { currentTurnIndex: nextTurnIndex(room) });
        return;
    }

    const [drawnTile, ...remainingPool] = pool;
    const currentHand = room.hands[playerId] || [];

    await update(roomRef(roomCode), {
        pool: remainingPool,
        [`hands/${playerId}`]: [...currentHand, drawnTile],
        [`players/${playerId}/handCount`]: currentHand.length + 1,
        currentTurnIndex: nextTurnIndex(room),
    });
}

export async function markPlayerConnection(roomCode, playerId, connected) {
    await update(roomRef(roomCode), { [`players/${playerId}/connected`]: connected });
}
