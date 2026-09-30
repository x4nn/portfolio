// Shared data layer for the Death Counter pages (deathcounter.html + deathcounter/spelers.html).
//
// Players live in the same Firebase Realtime Database the rest of this site
// already uses (cohousing, luna/), under their own "deathcounter-players" key
// so nothing else is touched. Same approach as those pages: plain fetch()
// calls to Firebase's REST API, no SDK.
//
// Data shape: deathcounter-players/{playerId} → { name, deaths, deathTimestamps, active, color, createdAt }
// deathTimestamps is a list of Date.now() values, one per death, oldest first.

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
        .map(([playerId, player]) => {
            const deathTimestamps = player.deathTimestamps || [];
            return {
                ...player,
                id: playerId,
                deaths: player.deaths || 0,
                // null when there's no recorded death yet (or only deaths from before timestamps existed).
                lastDeathAt: deathTimestamps.length > 0 ? deathTimestamps[deathTimestamps.length - 1] : null,
            };
        })
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

// How often to retry when someone else changed the same count between our read and write.
const MAX_DEATH_SAVE_ATTEMPTS = 15;
const HTTP_STATUS_PRECONDITION_FAILED = 412;
// Random short pause before a retry, so simultaneous taps don't keep colliding in lockstep.
const MAX_RETRY_DELAY_MS = 250;

function waitBeforeRetry() {
    return new Promise((resolve) => setTimeout(resolve, Math.random() * MAX_RETRY_DELAY_MS));
}

// Always starts from the live player in the database, never the (possibly stale)
// number on screen:
//   1. read the current player plus its ETag
//   2. save the updated player with `if-match: <ETag>`, so Firebase only accepts
//      it if nobody changed that player in between
//   3. if someone did (status 412), start over from the new live value
// That way two people tapping at the same moment both get counted, and -1
// never takes a count below 0 even if the screen was out of date.
// Reads the full player plus its ETag (a fingerprint of that exact data).
// Returns null for the player if someone deleted it.
async function loadLivePlayer(playerId) {
    const response = await fetch(playerUrl(playerId), { cache: 'no-store', headers: { 'X-Firebase-ETag': 'true' } });
    if (!response.ok) throw new Error(`Database gaf status ${response.status}`);
    return { player: await response.json(), etag: response.headers.get('ETag') };
}

// Taps from this phone wait in line and save one after another, so quick
// repeated tapping never collides with itself. Retries are only needed when
// another phone saves at the same moment.
let queuedDeathChanges = Promise.resolve();

function changePlayerDeaths(playerId, deathsChange) {
    const thisDeathChange = queuedDeathChanges.then(() => saveDeathChangeFromLivePlayer(playerId, deathsChange));
    // Keep the line moving even if this change fails.
    queuedDeathChanges = thisDeathChange.catch(() => {});
    return thisDeathChange;
}

// Each death also stores when it happened (deathTimestamps, oldest first), so
// "time since last death" can be shown and -1 can put it back to the previous one.
function applyDeathChange(player, deathsChange) {
    const deathTimestamps = [...(player.deathTimestamps || [])];
    if (deathsChange > 0) {
        deathTimestamps.push(Date.now());
    } else {
        deathTimestamps.pop();
    }
    return {
        ...player,
        deaths: Math.max((player.deaths || 0) + deathsChange, 0),
        deathTimestamps,
    };
}

async function saveDeathChangeFromLivePlayer(playerId, deathsChange) {
    for (let attempt = 1; attempt <= MAX_DEATH_SAVE_ATTEMPTS; attempt += 1) {
        const livePlayer = await loadLivePlayer(playerId);

        // Someone deleted this player in the meantime: nothing to count.
        if (!livePlayer.player || !livePlayer.player.name) return;

        // -1 on a count that is already 0: nothing to undo.
        if (deathsChange < 0 && !livePlayer.player.deaths) return;

        const saveResponse = await fetch(playerUrl(playerId), {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'if-match': livePlayer.etag },
            body: JSON.stringify(applyDeathChange(livePlayer.player, deathsChange)),
        });
        if (saveResponse.ok) return;
        if (saveResponse.status !== HTTP_STATUS_PRECONDITION_FAILED) {
            throw new Error(`Database gaf status ${saveResponse.status}`);
        }
        await waitBeforeRetry();
    }

    throw new Error('Te veel gelijktijdige wijzigingen, probeer opnieuw.');
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
