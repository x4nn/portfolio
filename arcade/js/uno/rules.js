// UNO rule logic — pure functions, no DOM/Firebase.
//
// Scoping notes (deliberate simplifications, mirroring how the Rummikub
// rules were scoped down in a few places):
//   - The official "Wild Draw Four is only legal if you have no card
//     matching the active color" restriction isn't enforced — most casual
//     digital versions don't either.
//   - The very first flipped card's own effect (if it happens to be an
//     action card) is ignored — player one just takes a normal first turn.
//     A first-flip Wild Draw Four is reshuffled back in and redrawn, since
//     there's no sensible "next player" to hand 4 cards to before anyone's
//     played.
//   - Drawing a card always ends your turn — there's no "play it
//     immediately if it happens to be legal" house rule here.

import { isWildType, shuffleArray } from "./cards.js";

export function isCardPlayable(card, topCard, activeColor) {
    if (isWildType(card.type)) return true;
    if (card.color === activeColor) return true;
    if (topCard.type === "number") return card.type === "number" && card.number === topCard.number;
    return card.type === topCard.type; // same action type (any color) matches
}

function mod(value, modulus) {
    return ((value % modulus) + modulus) % modulus;
}

// Resolves whose turn is next, which way play is heading, and whether
// someone has to draw and lose their turn — for the card that was just
// played (or "number"/no-op type for a plain draw-and-pass).
export function computeNextTurnState(turnOrder, currentTurnIndex, direction, playedCardType) {
    let newDirection = direction;
    if (playedCardType === "reverse" && turnOrder.length > 2) {
        newDirection = direction * -1;
    }

    const reverseActsAsSkip = playedCardType === "reverse" && turnOrder.length === 2;
    const isSkip = playedCardType === "skip" || reverseActsAsSkip;
    const isDrawTwo = playedCardType === "drawTwo";
    const isWildDrawFour = playedCardType === "wildDrawFour";

    const steps = isSkip || isDrawTwo || isWildDrawFour ? 2 : 1;
    const forcedDrawCount = isDrawTwo ? 2 : isWildDrawFour ? 4 : 0;
    const forcedDrawPlayerIndex = forcedDrawCount > 0 ? mod(currentTurnIndex + newDirection, turnOrder.length) : null;
    const nextTurnIndex = mod(currentTurnIndex + newDirection * steps, turnOrder.length);

    return { newDirection, nextTurnIndex, forcedDrawCount, forcedDrawPlayerIndex };
}

// Draws `count` cards from the pile, reshuffling the discard pile (minus its
// top card, which stays in play) back into the draw pile if it runs short.
// Pure — returns the updated piles rather than touching Firebase directly.
export function drawCardsFromPile(drawPile, discardPile, count) {
    let pile = [...drawPile];
    let discard = [...discardPile];
    const drawnCards = [];

    for (let index = 0; index < count; index += 1) {
        if (pile.length === 0) {
            const topCard = discard[discard.length - 1];
            const restOfDiscard = discard.slice(0, -1);
            if (restOfDiscard.length === 0) break; // nothing left anywhere — deal what we have
            pile = shuffleArray(restOfDiscard);
            discard = [topCard];
        }
        drawnCards.push(pile.pop());
    }

    return { drawnCards, updatedDrawPile: pile, updatedDiscardPile: discard };
}
