// Shared data layer for the Death Counter pages (deathcounter.html + deathcounter/spelers.html).
//
// Players live in the same Firebase Realtime Database the rest of this site
// already uses (luna/, arcade/, cohousing), under their own top-level key so
// nothing else is touched. Everyone who opens the page sees the same players
// and counts, and changes arrive live over a websocket via onValue.
//
// Loaded straight from the CDN's ESM build, so this stays a zero-build-step,
// framework-free `<script type="module">`.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import {
    getDatabase,
    ref,
    set,
    update,
    remove,
    onValue,
    runTransaction,
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";

const FIREBASE_CONFIG = {
    databaseURL: "https://co-housing-e2c00-default-rtdb.europe-west1.firebasedatabase.app",
};

const DEATH_COUNTER_PLAYERS_ROOT_KEY = "deathcounter-players";

const PLAYER_COLOR_PALETTE = [
    '#ff5c5c', // red
    '#ff9f43', // orange
    '#ffd93d', // yellow
    '#6bcb77', // green
    '#22e6c8', // teal
    '#4d96ff', // blue
    '#9b6bff', // purple
    '#ff6bcb', // pink
];

const firebaseApp = initializeApp(FIREBASE_CONFIG);
const database = getDatabase(firebaseApp);

function playerRef(playerId) {
    return ref(database, `${DEATH_COUNTER_PLAYERS_ROOT_KEY}/${playerId}`);
}

// Calls `onPlayersChanged(players)` now and every time anyone changes the data.
// Players come back as an array, oldest first, so the order stays stable.
export function subscribeToPlayers(onPlayersChanged) {
    return onValue(ref(database, DEATH_COUNTER_PLAYERS_ROOT_KEY), (snapshot) => {
        const playersById = snapshot.val() || {};
        const players = Object.entries(playersById)
            .map(([playerId, player]) => ({ ...player, id: playerId }))
            .sort((firstPlayer, secondPlayer) => firstPlayer.createdAt - secondPlayer.createdAt);
        onPlayersChanged(players);
    });
}

export function addPlayer(name, existingPlayerCount) {
    const playerId = crypto.randomUUID();
    return set(playerRef(playerId), {
        name,
        deaths: 0,
        active: true,
        color: PLAYER_COLOR_PALETTE[existingPlayerCount % PLAYER_COLOR_PALETTE.length],
        createdAt: Date.now(),
    });
}

// Transactions instead of read-then-write, so two people tapping at the same
// moment both get counted instead of one overwriting the other. Returning
// undefined aborts, so tapping a player someone else just deleted doesn't
// bring back a nameless leftover record.
function changePlayerDeaths(playerId, deathsChange) {
    return runTransaction(playerRef(playerId), (currentPlayer) => {
        if (!currentPlayer) return undefined;
        currentPlayer.deaths = Math.max((currentPlayer.deaths || 0) + deathsChange, 0);
        return currentPlayer;
    });
}

export function incrementPlayerDeaths(playerId) {
    return changePlayerDeaths(playerId, 1);
}

export function decrementPlayerDeaths(playerId) {
    return changePlayerDeaths(playerId, -1);
}

export function setPlayerActive(playerId, isActive) {
    return update(playerRef(playerId), { active: isActive });
}

export function deletePlayer(playerId) {
    return remove(playerRef(playerId));
}

export function escapeHtml(unsafeText) {
    const escapeElement = document.createElement('div');
    escapeElement.textContent = unsafeText;
    return escapeElement.innerHTML;
}
