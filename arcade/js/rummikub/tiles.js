// Rummikub tile model — generating the 106-tile set, shuffling, and the
// point values used for the initial-meld and end-of-game scoring rules.

export const TILE_COLORS = ["black", "red", "blue", "orange"];
export const MIN_TILE_NUMBER = 1;
export const MAX_TILE_NUMBER = 13;
export const COPIES_PER_NUMBER_COLOR = 2;
export const JOKER_COUNT = 2;
export const JOKER_COLOR = "joker";

export const MIN_SET_SIZE = 3;
export const MAX_GROUP_SIZE = TILE_COLORS.length;

export const INITIAL_MELD_MINIMUM_POINTS = 30;
export const JOKER_LEFTOVER_PENALTY_VALUE = 30;

export const PLAYER_HAND_SIZE = 14;

let tileIdCounter = 0;

function generateTileId(prefix) {
    tileIdCounter += 1;
    return `${prefix}-${tileIdCounter}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createFullTileSet() {
    const tiles = [];

    TILE_COLORS.forEach((color) => {
        for (let number = MIN_TILE_NUMBER; number <= MAX_TILE_NUMBER; number += 1) {
            for (let copyIndex = 0; copyIndex < COPIES_PER_NUMBER_COLOR; copyIndex += 1) {
                tiles.push({ id: generateTileId(`${color}${number}`), color, number });
            }
        }
    });

    for (let jokerIndex = 0; jokerIndex < JOKER_COUNT; jokerIndex += 1) {
        tiles.push({ id: generateTileId("joker"), color: JOKER_COLOR, number: null });
    }

    return tiles;
}

export function isJoker(tile) {
    return tile.color === JOKER_COLOR;
}

export function shuffleArray(items) {
    const shuffled = [...items];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
    }
    return shuffled;
}

export function shuffleTiles(tiles) {
    return shuffleArray(tiles);
}

export function getLeftoverHandPenalty(hand) {
    return hand.reduce(
        (total, tile) => total + (isJoker(tile) ? JOKER_LEFTOVER_PENALTY_VALUE : tile.number),
        0
    );
}
