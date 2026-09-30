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

// How often to retry when someone else changed the same count between our read and write.
const MAX_DEATH_SAVE_ATTEMPTS = 15;
const HTTP_STATUS_PRECONDITION_FAILED = 412;
// Random short pause before a retry, so simultaneous taps don't keep colliding in lockstep.
const MAX_RETRY_DELAY_MS = 250;

function waitBeforeRetry() {
    return new Promise((resolve) => setTimeout(resolve, Math.random() * MAX_RETRY_DELAY_MS));
}

// Always starts from the live count in the database, never the (possibly stale)
// number on screen:
//   1. read the current count plus its ETag (a fingerprint of that exact value)
//   2. save the new count with `if-match: <ETag>`, so Firebase only accepts it
//      if nobody changed the count in between
//   3. if someone did (status 412), start over from the new live value
// That way two people tapping at the same moment both get counted, and -1
// never takes a count below 0 even if the screen was out of date.
async function loadLiveDeaths(deathsUrl) {
    const response = await fetch(deathsUrl, { cache: 'no-store', headers: { 'X-Firebase-ETag': 'true' } });
    if (!response.ok) throw new Error(`Database gaf status ${response.status}`);
    return { count: (await response.json()) || 0, etag: response.headers.get('ETag') };
}

async function playerExists(playerId) {
    const response = await fetch(playerUrl(playerId, 'name'), { cache: 'no-store' });
    if (!response.ok) throw new Error(`Database gaf status ${response.status}`);
    return Boolean(await response.json());
}

// Taps from this phone wait in line and save one after another, so quick
// repeated tapping never collides with itself. Retries are only needed when
// another phone saves at the same moment.
let queuedDeathChanges = Promise.resolve();

function changePlayerDeaths(playerId, deathsChange) {
    const thisDeathChange = queuedDeathChanges.then(() => saveDeathChangeFromLiveCount(playerId, deathsChange));
    // Keep the line moving even if this change fails.
    queuedDeathChanges = thisDeathChange.catch(() => {});
    return thisDeathChange;
}

async function saveDeathChangeFromLiveCount(playerId, deathsChange) {
    const deathsUrl = playerUrl(playerId, 'deaths');

    for (let attempt = 1; attempt <= MAX_DEATH_SAVE_ATTEMPTS; attempt += 1) {
        const [liveDeaths, playerStillExists] = await Promise.all([
            loadLiveDeaths(deathsUrl),
            playerExists(playerId),
        ]);

        // Someone deleted this player in the meantime: nothing to count.
        if (!playerStillExists) return;

        const newDeaths = Math.max(liveDeaths.count + deathsChange, 0);
        if (newDeaths === liveDeaths.count) return;

        const saveResponse = await fetch(deathsUrl, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'if-match': liveDeaths.etag },
            body: JSON.stringify(newDeaths),
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
