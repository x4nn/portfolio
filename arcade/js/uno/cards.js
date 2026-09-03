// UNO card model — the standard 108-card deck, shuffling, and the point
// values used for end-of-game loser scoring.

export const CARD_COLORS = ["red", "yellow", "green", "blue"];
export const MIN_NUMBER = 0;
export const MAX_NUMBER = 9;
export const COPIES_PER_NUMBER_ABOVE_ZERO = 2;
export const COPIES_OF_ZERO = 1;
export const COPIES_PER_ACTION_CARD = 2;
export const COPIES_OF_EACH_WILD = 4;

export const ACTION_CARD_POINT_VALUE = 20;
export const WILD_CARD_POINT_VALUE = 50;

export const STARTING_HAND_SIZE = 7;

let cardIdCounter = 0;

function generateCardId(prefix) {
    cardIdCounter += 1;
    return `${prefix}-${cardIdCounter}-${Math.random().toString(36).slice(2, 8)}`;
}

export function isWildType(type) {
    return type === "wild" || type === "wildDrawFour";
}

export function createFullDeck() {
    const cards = [];

    CARD_COLORS.forEach((color) => {
        cards.push({ id: generateCardId(`${color}0`), color, type: "number", number: 0 });
        for (let number = 1; number <= MAX_NUMBER; number += 1) {
            for (let copyIndex = 0; copyIndex < COPIES_PER_NUMBER_ABOVE_ZERO; copyIndex += 1) {
                cards.push({ id: generateCardId(`${color}${number}`), color, type: "number", number });
            }
        }
        ["skip", "reverse", "drawTwo"].forEach((type) => {
            for (let copyIndex = 0; copyIndex < COPIES_PER_ACTION_CARD; copyIndex += 1) {
                cards.push({ id: generateCardId(`${color}-${type}`), color, type, number: null });
            }
        });
    });

    ["wild", "wildDrawFour"].forEach((type) => {
        for (let copyIndex = 0; copyIndex < COPIES_OF_EACH_WILD; copyIndex += 1) {
            cards.push({ id: generateCardId(type), color: null, type, number: null });
        }
    });

    return cards;
}

export function shuffleArray(items) {
    const shuffled = [...items];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
    }
    return shuffled;
}

export function getCardPointValue(card) {
    if (card.type === "number") return card.number;
    if (isWildType(card.type)) return WILD_CARD_POINT_VALUE;
    return ACTION_CARD_POINT_VALUE;
}

export function getHandPenalty(hand) {
    return hand.reduce((total, card) => total + getCardPointValue(card), 0);
}
