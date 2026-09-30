const activePlayersGrid = document.querySelector('[data-active-players-grid]');
const emptyStateMessage = document.querySelector('[data-empty-state]');
const refreshButton = document.querySelector('[data-refresh-button]');
const syncStatusMessage = document.querySelector('[data-sync-status]');

function showSyncStatus(message, isError = false) {
    syncStatusMessage.textContent = message;
    syncStatusMessage.classList.toggle('death-counter-sync-status--error', isError);
}

// How often the page checks the database on its own, so deaths tapped on
// other phones (and their "last death" time) show up without pressing refresh.
const AUTO_REFRESH_INTERVAL_MS = 5000;

// What's currently on screen, so an auto-refresh with no changes doesn't redraw
// the cards (a redraw mid-tap could swallow that tap).
let renderedPlayersJson = '';

// Fetches the latest counts from the database and redraws, without a page reload.
// Automatic checks leave the refresh button alone so it doesn't flicker.
async function refreshPlayers({ isAutomatic = false } = {}) {
    if (!isAutomatic) refreshButton.disabled = true;
    try {
        const players = await loadPlayers();
        const playersJson = JSON.stringify(players);
        if (playersJson !== renderedPlayersJson) {
            renderActivePlayers(players);
            renderedPlayersJson = playersJson;
        }
        const refreshedTime = new Date().toLocaleTimeString('nl-BE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        showSyncStatus(`Bijgewerkt om ${refreshedTime}`);
    } catch (error) {
        console.error('Kon spelers niet laden uit de database', error);
        showSyncStatus('Kon niet laden. Probeer opnieuw.', true);
    } finally {
        if (!isAutomatic) refreshButton.disabled = false;
    }
}

// Saves the change, then reloads so the count also includes other people's taps.
async function changeDeathsAndRefresh(playerId, deathsChange) {
    try {
        await changePlayerDeaths(playerId, deathsChange);
    } catch (error) {
        console.error('Kon de dood niet opslaan', error);
        showSyncStatus('Opslaan mislukt. Probeer opnieuw.', true);
        return;
    }
    await refreshPlayers();
}

const MILLISECONDS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 60 * SECONDS_PER_MINUTE;
const SECONDS_PER_DAY = 24 * SECONDS_PER_HOUR;

// e.g. "45s", "12m 03s", "2u 05m", "3d 4u"
function formatDuration(totalSeconds) {
    const days = Math.floor(totalSeconds / SECONDS_PER_DAY);
    const hours = Math.floor((totalSeconds % SECONDS_PER_DAY) / SECONDS_PER_HOUR);
    const minutes = Math.floor((totalSeconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE);
    const seconds = totalSeconds % SECONDS_PER_MINUTE;
    const padToTwoDigits = (number) => String(number).padStart(2, '0');

    if (days > 0) return `${days}d ${hours}u`;
    if (hours > 0) return `${hours}u ${padToTwoDigits(minutes)}m`;
    if (minutes > 0) return `${minutes}m ${padToTwoDigits(seconds)}s`;
    return `${seconds}s`;
}

function describeTimeSinceLastDeath(lastDeathAt) {
    // Phones' clocks can differ a little; never show a negative time.
    const secondsSinceLastDeath = Math.max(Math.floor((Date.now() - lastDeathAt) / MILLISECONDS_PER_SECOND), 0);
    return `Laatste dood: ${formatDuration(secondsSinceLastDeath)} geleden`;
}

// Only labels with a known time get data-last-death-at, so the ticker leaves the others alone.
function renderLastDeathLabel(player) {
    if (player.lastDeathAt) {
        return `<span class="death-counter-player-last-death" data-last-death-at="${player.lastDeathAt}">${describeTimeSinceLastDeath(player.lastDeathAt)}</span>`;
    }
    // Deaths counted before timestamps existed have no known time.
    const labelText = player.deaths > 0 ? 'Laatste dood: onbekend' : 'Nog geen dood';
    return `<span class="death-counter-player-last-death">${labelText}</span>`;
}

// Ticks every "time since last death" label on screen once per second, without re-fetching.
function updateTimeSinceLastDeathLabels() {
    document.querySelectorAll('[data-last-death-at]').forEach((lastDeathLabel) => {
        lastDeathLabel.textContent = describeTimeSinceLastDeath(Number(lastDeathLabel.dataset.lastDeathAt));
    });
}

function renderActivePlayers(players) {
    const activePlayers = players.filter((player) => player.active);

    activePlayersGrid.innerHTML = '';

    if (activePlayers.length === 0) {
        emptyStateMessage.hidden = false;
        return;
    }
    emptyStateMessage.hidden = true;

    activePlayers.forEach((player) => {
        const playerCard = document.createElement('div');
        playerCard.className = 'death-counter-player-card';
        playerCard.style.setProperty('--player-accent-color', player.color);

        const incrementButton = document.createElement('button');
        incrementButton.type = 'button';
        incrementButton.className = 'death-counter-increment-button';
        incrementButton.setAttribute('aria-label', `${player.name}: ${player.deaths} doden. Tik om een dood bij te tellen.`);
        incrementButton.innerHTML = `
            <span class="death-counter-player-name">${escapeHtml(player.name)}</span>
            <span class="death-counter-player-death-count">${player.deaths}</span>
            <span class="death-counter-player-death-label">doden</span>
            ${renderLastDeathLabel(player)}
        `;
        incrementButton.addEventListener('click', () => changeDeathsAndRefresh(player.id, 1));

        const undoButton = document.createElement('button');
        undoButton.type = 'button';
        undoButton.className = 'death-counter-undo-button';
        undoButton.textContent = '-1';
        undoButton.setAttribute('aria-label', `Laatste dood van ${player.name} ongedaan maken`);
        undoButton.addEventListener('click', () => changeDeathsAndRefresh(player.id, -1));

        playerCard.appendChild(incrementButton);
        playerCard.appendChild(undoButton);
        activePlayersGrid.appendChild(playerCard);
    });
}

refreshButton.addEventListener('click', () => refreshPlayers());
setInterval(updateTimeSinceLastDeathLabels, MILLISECONDS_PER_SECOND);

// Only check while the page is actually open on screen, and catch up right
// away when someone switches back to it.
setInterval(() => {
    if (document.visibilityState === 'visible') refreshPlayers({ isAutomatic: true });
}, AUTO_REFRESH_INTERVAL_MS);
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') refreshPlayers({ isAutomatic: true });
});

refreshPlayers();
