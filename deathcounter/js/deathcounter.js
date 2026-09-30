import {
    subscribeToPlayers,
    incrementPlayerDeaths,
    decrementPlayerDeaths,
    escapeHtml,
} from './deathcounter-data.js';

const activePlayersGrid = document.querySelector('[data-active-players-grid]');
const emptyStateMessage = document.querySelector('[data-empty-state]');

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
        incrementButton.addEventListener('click', () => incrementPlayerDeaths(player.id));

        const undoButton = document.createElement('button');
        undoButton.type = 'button';
        undoButton.className = 'death-counter-undo-button';
        undoButton.textContent = '-1';
        undoButton.setAttribute('aria-label', `Laatste dood van ${player.name} ongedaan maken`);
        undoButton.addEventListener('click', () => decrementPlayerDeaths(player.id));

        playerCard.appendChild(incrementButton);
        playerCard.appendChild(undoButton);
        activePlayersGrid.appendChild(playerCard);
    });
}

// Re-renders for every change, including taps from other people's phones.
subscribeToPlayers(renderActivePlayers);
