// Rummikub rule validation — pure functions, no DOM/Firebase.
//
// Two board-legality checks (run/group), a scoring function that resolves
// what a joker is "standing in for" so it can be counted, and the turn-commit
// validator that enforces the real Rummikub rules:
//   - before your first meld, you may only ADD brand-new sets built entirely
//     from your own hand — you cannot touch tiles already on the table
//   - your first meld's newly-added sets must total >= 30 points
//   - once you've melded once, you may freely rearrange the whole board

import {
    TILE_COLORS,
    MIN_TILE_NUMBER,
    MAX_TILE_NUMBER,
    MIN_SET_SIZE,
    MAX_GROUP_SIZE,
    INITIAL_MELD_MINIMUM_POINTS,
    isJoker,
} from "./tiles.js";

// A run is a legal window of `tiles.length` consecutive numbers, same color,
// where jokers can fill any position in the window. Returns the window's
// start number (its lowest number) if valid, or null if not. Exported so the
// renderer can place each joker at the actual number it's standing in for,
// instead of always drawing it at the end of the set.
export function getValidRunStart(tiles) {
    if (tiles.length < MIN_SET_SIZE) return null;

    const jokers = tiles.filter(isJoker);
    const numbered = tiles.filter((tile) => !isJoker(tile));
    if (numbered.length === 0) return null;

    const color = numbered[0].color;
    if (!numbered.every((tile) => tile.color === color)) return null;

    const numbers = numbered.map((tile) => tile.number);
    if (new Set(numbers).size !== numbers.length) return null; // duplicate number in a run

    const windowLength = tiles.length;
    const minNumber = Math.min(...numbers);
    const maxNumber = Math.max(...numbers);
    const span = maxNumber - minNumber + 1;
    if (span > windowLength) return null; // gap between numbered tiles too wide even with all jokers

    const internalGapsNeeded = span - numbered.length; // missing numbers strictly inside [min, max]
    if (internalGapsNeeded > jokers.length) return null;

    // The window must contain [minNumber, maxNumber] and stay inside [1, 13].
    const lowestPossibleStart = Math.max(MIN_TILE_NUMBER, maxNumber - windowLength + 1);
    const highestPossibleStart = Math.min(minNumber, MAX_TILE_NUMBER - windowLength + 1);
    if (lowestPossibleStart > highestPossibleStart) return null;

    return lowestPossibleStart; // deterministic choice when more than one window fits
}

function isValidGroup(tiles) {
    if (tiles.length < MIN_SET_SIZE || tiles.length > MAX_GROUP_SIZE) return false;

    const numbered = tiles.filter((tile) => !isJoker(tile));
    if (numbered.length === 0) return false;

    const number = numbered[0].number;
    if (!numbered.every((tile) => tile.number === number)) return false;

    const colors = numbered.map((tile) => tile.color);
    if (new Set(colors).size !== colors.length) return false; // duplicate color in a group

    return true;
}

export function isValidRun(tiles) {
    return getValidRunStart(tiles) !== null;
}

export function isValidSet(tiles) {
    return isValidRun(tiles) || isValidGroup(tiles);
}

export function isBoardValid(board) {
    return board.every((setTiles) => isValidSet(setTiles));
}

// Point value of one set, resolving jokers to the number they represent.
// A run's total is just the arithmetic sum of its window, since every
// position in the window contributes its own value whether a real tile or
// a joker occupies it.
export function getSetPointValue(tiles) {
    const runStart = getValidRunStart(tiles);
    if (runStart !== null) {
        const windowLength = tiles.length;
        const runEnd = runStart + windowLength - 1;
        return ((runStart + runEnd) * windowLength) / 2;
    }

    if (isValidGroup(tiles)) {
        const groupNumber = tiles.find((tile) => !isJoker(tile)).number;
        return tiles.length * groupNumber;
    }

    return 0;
}

function sameTileIds(setA, setB) {
    if (setA.length !== setB.length) return false;
    const idsA = [...setA.map((tile) => tile.id)].sort();
    const idsB = [...setB.map((tile) => tile.id)].sort();
    return idsA.every((id, index) => id === idsB[index]);
}

function findMatchingSet(targetSet, otherSets) {
    return otherSets.find((candidateSet) => sameTileIds(targetSet, candidateSet));
}

function allTileIds(sets) {
    return sets.flatMap((setTiles) => setTiles.map((tile) => tile.id));
}

// Validates committing a turn's draft state and reports what changed.
// Returns { valid: true, newlyMeldedPoints, becameMelded } or
// { valid: false, reason }.
export function validateTurnCommit({ previousBoard, previousHand, newBoard, newHand, hasMelded }) {
    const previousTileIds = new Set([...allTileIds(previousBoard), ...previousHand.map((tile) => tile.id)]);
    const newTileIds = new Set([...allTileIds(newBoard), ...newHand.map((tile) => tile.id)]);
    if (previousTileIds.size !== newTileIds.size || [...previousTileIds].some((id) => !newTileIds.has(id))) {
        return { valid: false, reason: "Tellen klopt niet — stenen zijn verdwenen of verzonnen." };
    }

    if (!isBoardValid(newBoard)) {
        return { valid: false, reason: "Niet elke set op het bord is geldig (reeks of groep)." };
    }

    const previousHandIds = new Set(previousHand.map((tile) => tile.id));

    if (!hasMelded) {
        const untouchedPreviousSets = previousBoard.filter((setTiles) => findMatchingSet(setTiles, newBoard));
        if (untouchedPreviousSets.length !== previousBoard.length) {
            return {
                valid: false,
                reason: "Je mag het bord pas aanpassen na je eerste geldige zet van 30+ punten.",
            };
        }

        const newSets = newBoard.filter((setTiles) => !findMatchingSet(setTiles, previousBoard));
        if (newSets.length === 0) {
            return { valid: false, reason: "Leg eerst een geldige set neer, of trek een steen." };
        }

        const newSetsUseOnlyHandTiles = newSets.every((setTiles) =>
            setTiles.every((tile) => previousHandIds.has(tile.id))
        );
        if (!newSetsUseOnlyHandTiles) {
            return {
                valid: false,
                reason: "Je eerste zet mag alleen uit je eigen stenen bestaan.",
            };
        }

        const newlyMeldedPoints = newSets.reduce((total, setTiles) => total + getSetPointValue(setTiles), 0);
        if (newlyMeldedPoints < INITIAL_MELD_MINIMUM_POINTS) {
            return {
                valid: false,
                reason: `Je eerste zet moet minstens ${INITIAL_MELD_MINIMUM_POINTS} punten waard zijn (nu ${newlyMeldedPoints}).`,
            };
        }

        return { valid: true, newlyMeldedPoints, becameMelded: true };
    }

    const placedFromHandCount = allTileIds(newBoard).filter((id) => previousHandIds.has(id)).length;
    if (placedFromHandCount === 0) {
        return {
            valid: false,
            reason: "Je moet minstens één steen uit je hand neerleggen, of trekken in plaats van herschikken.",
        };
    }

    const newSets = newBoard.filter((setTiles) => !findMatchingSet(setTiles, previousBoard));
    const newlyMeldedPoints = newSets.reduce((total, setTiles) => total + getSetPointValue(setTiles), 0);
    return { valid: true, newlyMeldedPoints, becameMelded: true };
}

export { TILE_COLORS };
