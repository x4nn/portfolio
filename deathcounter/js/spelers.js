import {
    subscribeToPlayers,
    addPlayer,
    setPlayerActive,
    deletePlayer,
    escapeHtml,
} from './deathcounter-data.js';

const addPlayerForm = document.querySelector('[data-add-player-form]');
const newPlayerNameInput = document.querySelector('[data-new-player-name-input]');
const playerListContainer = document.querySelector('[data-player-list]');
const emptyPlayerListMessage = document.querySelector('[data-empty-player-list]');

// Latest players from the database, used to pick the next player's color.
let currentPlayers = [];

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
            setPlayerActive(player.id, changeEvent.target.checked);
        });

        playerRow.querySelector('[data-delete-button]').addEventListener('click', () => {
            const confirmedDeletion = confirm(`Weet je zeker dat je ${player.name} wil verwijderen? Dit kan niet ongedaan gemaakt worden.`);
            if (confirmedDeletion) deletePlayer(player.id);
        });

        playerListContainer.appendChild(playerRow);
    });
}

addPlayerForm.addEventListener('submit', (submitEvent) => {
    submitEvent.preventDefault();
    const trimmedName = newPlayerNameInput.value.trim();
    if (!trimmedName) return;
    addPlayer(trimmedName, currentPlayers.length);
    newPlayerNameInput.value = '';
    newPlayerNameInput.focus();
});

subscribeToPlayers(renderPlayerList);
