// Shared data layer for the Death Counter pages (deathcounter.html + deathcounter/spelers.html).
// Players are stored in localStorage, so both pages stay in sync on the same device/browser.

const DEATH_COUNTER_STORAGE_KEY = 'deathcounter-players-v1';

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

function loadPlayers() {
    try {
        const storedPlayersJson = localStorage.getItem(DEATH_COUNTER_STORAGE_KEY);
        return storedPlayersJson ? JSON.parse(storedPlayersJson) : [];
    } catch (error) {
        console.error('Kon spelers niet laden uit localStorage', error);
        return [];
    }
}

function savePlayers(players) {
    localStorage.setItem(DEATH_COUNTER_STORAGE_KEY, JSON.stringify(players));
}

function createPlayer(name, existingPlayerCount) {
    return {
        id: crypto.randomUUID(),
        name,
        deaths: 0,
        active: true,
        color: PLAYER_COLOR_PALETTE[existingPlayerCount % PLAYER_COLOR_PALETTE.length],
    };
}

function escapeHtml(unsafeText) {
    const escapeElement = document.createElement('div');
    escapeElement.textContent = unsafeText;
    return escapeElement.innerHTML;
}
