const activePlayersGrid = document.querySelector('[data-active-players-grid]');
const emptyStateMessage = document.querySelector('[data-empty-state]');
const refreshButton = document.querySelector('[data-refresh-button]');
const syncStatusMessage = document.querySelector('[data-sync-status]');

function showSyncStatus(message, isError = false) {
    syncStatusMessage.textContent = message;
    syncStatusMessage.classList.toggle('death-counter-sync-status--error', isError);
}

// Fetches the latest counts from the database and redraws, without a page reload.
async function refreshPlayers() {
    refreshButton.disabled = true;
    try {
        const players = await loadPlayers();
        renderActivePlayers(players);
        const refreshedTime = new Date().toLocaleTimeString('nl-BE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        showSyncStatus(`Bijgewerkt om ${refreshedTime}`);
    } catch (error) {
        console.error('Kon spelers niet laden uit de database', error);
        showSyncStatus('Kon niet laden. Probeer opnieuw.', true);
    } finally {
        refreshButton.disabled = false;
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

refreshButton.addEventListener('click', refreshPlayers);

refreshPlayers();
