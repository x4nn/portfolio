const addPlayerForm = document.querySelector('[data-add-player-form]');
const newPlayerNameInput = document.querySelector('[data-new-player-name-input]');
const playerListContainer = document.querySelector('[data-player-list]');
const emptyPlayerListMessage = document.querySelector('[data-empty-player-list]');
const refreshButton = document.querySelector('[data-refresh-button]');
const syncStatusMessage = document.querySelector('[data-sync-status]');

// Latest players from the database, used to pick the next player's color.
let currentPlayers = [];

function showSyncStatus(message, isError = false) {
    syncStatusMessage.textContent = message;
    syncStatusMessage.classList.toggle('death-counter-sync-status--error', isError);
}

// Fetches the latest players from the database and redraws, without a page reload.
async function refreshPlayerList() {
    refreshButton.disabled = true;
    try {
        renderPlayerList(await loadPlayers());
        const refreshedTime = new Date().toLocaleTimeString('nl-BE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        showSyncStatus(`Bijgewerkt om ${refreshedTime}`);
    } catch (error) {
        console.error('Kon spelers niet laden uit de database', error);
        showSyncStatus('Kon niet laden. Probeer opnieuw.', true);
    } finally {
        refreshButton.disabled = false;
    }
}

// Runs a database change, then reloads the list so it matches what everyone sees.
async function saveAndRefresh(databaseChange) {
    try {
        await databaseChange();
    } catch (error) {
        console.error('Kon wijziging niet opslaan', error);
        showSyncStatus('Opslaan mislukt. Probeer opnieuw.', true);
        return;
    }
    await refreshPlayerList();
}

function renderPlayerList(players) {
    currentPlayers = players;
    playerListContainer.innerHTML = '';

    if (players.length === 0) {
        emptyPlayerListMessage.hidden = false;
        return;
    }
    emptyPlayerListMessage.hidden = true;

    players.forEach((player) => {
        const playerRow = document.createElement('div');
        playerRow.className = 'player-management-row';
        playerRow.style.setProperty('--player-accent-color', player.color);

        playerRow.innerHTML = `
            <span class="player-management-color-dot" aria-hidden="true"></span>
            <span class="player-management-name">${escapeHtml(player.name)}</span>
            <span class="player-management-death-count">${player.deaths} doden</span>
            <label class="player-management-toggle">
                <input type="checkbox" data-active-toggle ${player.active ? 'checked' : ''}>
                <span>Actief</span>
            </label>
            <button type="button" class="player-management-delete-button" data-delete-button>Verwijderen</button>
        `;

        playerRow.querySelector('[data-active-toggle]').addEventListener('change', (changeEvent) => {
            saveAndRefresh(() => setPlayerActive(player.id, changeEvent.target.checked));
        });

        playerRow.querySelector('[data-delete-button]').addEventListener('click', () => {
            const confirmedDeletion = confirm(`Weet je zeker dat je ${player.name} wil verwijderen? Dit kan niet ongedaan gemaakt worden.`);
            if (confirmedDeletion) saveAndRefresh(() => deletePlayer(player.id));
        });

        playerListContainer.appendChild(playerRow);
    });
}

addPlayerForm.addEventListener('submit', (submitEvent) => {
    submitEvent.preventDefault();
    const trimmedName = newPlayerNameInput.value.trim();
    if (!trimmedName) return;
    saveAndRefresh(() => addPlayer(trimmedName, currentPlayers.length));
    newPlayerNameInput.value = '';
    newPlayerNameInput.focus();
});

refreshButton.addEventListener('click', refreshPlayerList);

refreshPlayerList();
