// Shared data layer for the Death Counter pages (deathcounter.html + deathcounter/spelers.html).
//
// Players live in the same Firebase Realtime Database the rest of this site
// already uses (cohousing, luna/), under their own "deathcounter-players" key
// so nothing else is touched. Same approach as those pages: plain fetch()
// calls to Firebase's REST API, no SDK.
//
// Data shape: deathcounter-players/{playerId} → { name, deaths, active, color, createdAt }

const DEATH_COUNTER_DATABASE_URL = "https://co-housing-e2c00-default-rtdb.europe-west1.firebasedatabase.app/deathcounter-players";

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

function playerUrl(playerId, fieldName) {
    const fieldPath = fieldName ? `/${fieldName}` : '';
    return `${DEATH_COUNTER_DATABASE_URL}/${playerId}${fieldPath}.json`;
}

async function sendToDatabase(url, method, body) {
    const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!response.ok) throw new Error(`Database gaf status ${response.status}`);
}

// Returns players as an array, oldest first, so the order stays stable.
async function loadPlayers() {
    const response = await fetch(`${DEATH_COUNTER_DATABASE_URL}.json`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Database gaf status ${response.status}`);
    const playersById = (await response.json()) || {};

    return Object.entries(playersById)
        // Skip leftovers without a name, e.g. a tap that landed on a player someone just deleted.
        .filter(([, player]) => player && player.name)
        .map(([playerId, player]) => ({ ...player, id: playerId, deaths: player.deaths || 0 }))
        .sort((firstPlayer, secondPlayer) => firstPlayer.createdAt - secondPlayer.createdAt);
}

function addPlayer(name, existingPlayerCount) {
    return sendToDatabase(playerUrl(crypto.randomUUID()), 'PUT', {
        name,
        deaths: 0,
        active: true,
        color: PLAYER_COLOR_PALETTE[existingPlayerCount % PLAYER_COLOR_PALETTE.length],
        createdAt: Date.now(),
    });
}

// Firebase adds this on the server itself, so two people tapping at the same
// moment both get counted instead of one overwriting the other.
function changePlayerDeaths(playerId, deathsChange) {
    return sendToDatabase(playerUrl(playerId, 'deaths'), 'PUT', { '.sv': { increment: deathsChange } });
}

function setPlayerActive(playerId, isActive) {
    return sendToDatabase(playerUrl(playerId), 'PATCH', { active: isActive });
}

function deletePlayer(playerId) {
    return sendToDatabase(playerUrl(playerId), 'DELETE');
}

function escapeHtml(unsafeText) {
    const escapeElement = document.createElement('div');
    escapeElement.textContent = unsafeText;
    return escapeElement.innerHTML;
}
