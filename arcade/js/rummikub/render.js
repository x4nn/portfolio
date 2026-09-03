// DOM rendering for the Rummikub board, hand, opponents strip, and turn
// status. Pure-ish — takes a model and (re)builds the DOM from scratch each
// time. At 106 tiles max this is cheap, and it keeps the DOM always in sync
// with the model instead of risking drift from incremental patches.
//
// Movement is animated with the FLIP technique: the caller captures each
// tile's on-screen position before mutating the model, rebuilds the DOM,
// then calls playFlipAnimations with the captured positions — tiles that
// already existed slide from their old spot to the new one; tiles that
// didn't exist before (drawn, dealt) play a pop-in instead.

import { isJoker, TILE_COLORS } from "./tiles.js";
import { isValidSet, getValidRunStart } from "./validation.js";

const POP_IN_STAGGER_SECONDS = 0.025;

// A stylised jester face, drawn instead of relying on an emoji glyph (those
// render inconsistently across systems — see the 🀄 hub icon). Cap + face
// use currentColor (the tile's joker gold); eyes/mouth punch through in the
// tile's own background so they read as a face rather than a blob.
const JOKER_FACE_SVG = `
<svg viewBox="0 0 24 24" class="rummikub-tile-joker-icon" aria-hidden="true">
    <g fill="currentColor">
        <path d="M4 10 L7 3 L10 8 L12 2 L14 8 L17 3 L20 10 C17.4 9.2 14.8 9 12 9 C9.2 9 6.6 9.2 4 10 Z" />
        <circle cx="7" cy="3" r="1.5" />
        <circle cx="12" cy="2" r="1.5" />
        <circle cx="17" cy="3" r="1.5" />
        <circle cx="12" cy="15.5" r="6.5" />
    </g>
    <circle cx="9.3" cy="14.5" r="1" fill="var(--rk-tile-bg-solid)" />
    <circle cx="14.7" cy="14.5" r="1" fill="var(--rk-tile-bg-solid)" />
    <path d="M8.8 18 Q12 20.6 15.2 18" stroke="var(--rk-tile-bg-solid)" stroke-width="1.2" fill="none" stroke-linecap="round" />
</svg>`;

function sortTilesByNumber(tiles) {
    return [...tiles].sort((tileA, tileB) => {
        const numberA = isJoker(tileA) ? Infinity : tileA.number;
        const numberB = isJoker(tileB) ? Infinity : tileB.number;
        if (numberA !== numberB) return numberA - numberB;
        return TILE_COLORS.indexOf(tileA.color) - TILE_COLORS.indexOf(tileB.color);
    });
}

function sortTilesByColor(tiles) {
    return [...tiles].sort((tileA, tileB) => {
        const colorIndexA = isJoker(tileA) ? TILE_COLORS.length : TILE_COLORS.indexOf(tileA.color);
        const colorIndexB = isJoker(tileB) ? TILE_COLORS.length : TILE_COLORS.indexOf(tileB.color);
        if (colorIndexA !== colorIndexB) return colorIndexA - colorIndexB;
        const numberA = isJoker(tileA) ? Infinity : tileA.number;
        const numberB = isJoker(tileB) ? Infinity : tileB.number;
        return numberA - numberB;
    });
}

// For a set on the board: if it's a valid run, place each joker at the exact
// number it's standing in for (so a joker between 5 and 7 renders as "6"'s
// slot, not tacked on at the end) — otherwise fall back to the plain
// ascending-by-number order used everywhere else (groups, or a still
// incomplete/invalid set the player is mid-arranging).
function sortSetTilesForDisplay(tiles) {
    const runStart = getValidRunStart(tiles);
    if (runStart === null) return sortTilesByNumber(tiles);

    const tileByNumber = new Map();
    const jokers = [];
    tiles.forEach((tile) => {
        if (isJoker(tile)) jokers.push(tile);
        else tileByNumber.set(tile.number, tile);
    });

    const ordered = [];
    let jokerCursor = 0;
    for (let number = runStart; number < runStart + tiles.length; number += 1) {
        const numberedTile = tileByNumber.get(number);
        ordered.push(numberedTile || jokers[jokerCursor++]);
    }
    return ordered;
}

function createTileElement(tile, { selected }) {
    const tileElement = document.createElement("div");
    tileElement.className = "rummikub-tile";
    tileElement.dataset.tileId = tile.id;
    tileElement.dataset.color = tile.color;
    if (selected) tileElement.classList.add("rummikub-tile--selected");
    if (isJoker(tile)) {
        tileElement.classList.add("rummikub-tile--joker");
        tileElement.innerHTML = JOKER_FACE_SVG;
    } else {
        tileElement.textContent = String(tile.number);
    }
    return tileElement;
}

export function renderHand(handContainerElement, hand, { selectedTileId, sortMode }) {
    handContainerElement.innerHTML = "";
    handContainerElement.dataset.zone = "hand";
    const sortedHand = sortMode === "number" ? sortTilesByNumber(hand) : sortTilesByColor(hand);
    sortedHand.forEach((tile) => {
        handContainerElement.appendChild(createTileElement(tile, { selected: tile.id === selectedTileId }));
    });
}

export function renderBoard(boardContainerElement, board, { selectedTileId }) {
    boardContainerElement.innerHTML = "";

    board.forEach((setTiles, setIndex) => {
        const setElement = document.createElement("div");
        setElement.className = "rummikub-set";
        setElement.dataset.setIndex = String(setIndex);
        if (setTiles.length > 0 && !isValidSet(setTiles)) {
            setElement.classList.add("rummikub-set--invalid");
        }
        sortSetTilesForDisplay(setTiles).forEach((tile) => {
            setElement.appendChild(createTileElement(tile, { selected: tile.id === selectedTileId }));
        });
        boardContainerElement.appendChild(setElement);
    });

    const newSetPlaceholder = document.createElement("div");
    newSetPlaceholder.className = "rummikub-set rummikub-set--new-placeholder";
    newSetPlaceholder.dataset.zone = "new-set";
    newSetPlaceholder.textContent = "+ Nieuwe set";
    boardContainerElement.appendChild(newSetPlaceholder);
}

function getInitials(name) {
    return name.trim().slice(0, 1).toUpperCase() || "?";
}

export function renderOpponents(opponentsContainerElement, room, myPlayerId) {
    opponentsContainerElement.innerHTML = "";
    const currentTurnPlayerId = room.turnOrder[room.currentTurnIndex];

    room.turnOrder
        .filter((playerId) => playerId !== myPlayerId)
        .forEach((playerId) => {
            const player = room.players[playerId];
            const opponentElement = document.createElement("div");
            opponentElement.className = "rummikub-opponent";
            if (playerId === currentTurnPlayerId) opponentElement.classList.add("rummikub-opponent--active");
            if (!player.connected) opponentElement.classList.add("rummikub-opponent--disconnected");
            opponentElement.innerHTML = `
                <span class="rummikub-opponent-avatar" aria-hidden="true"></span>
                <span class="rummikub-opponent-info">
                    <span class="rummikub-opponent-name"></span>
                    <span class="rummikub-opponent-count">${player.handCount} stenen</span>
                </span>
            `;
            opponentElement.querySelector(".rummikub-opponent-avatar").textContent = getInitials(player.name);
            opponentElement.querySelector(".rummikub-opponent-name").textContent = player.name;
            opponentsContainerElement.appendChild(opponentElement);
        });
}

export function renderTurnStatus(statusElement, room, myPlayerId) {
    const currentTurnPlayerId = room.turnOrder[room.currentTurnIndex];
    const isMyTurn = currentTurnPlayerId === myPlayerId;
    statusElement.textContent = isMyTurn ? "Jouw beurt" : `Beurt van ${room.players[currentTurnPlayerId]?.name ?? "…"}`;
    statusElement.classList.toggle("rummikub-turn-status--mine", isMyTurn);
}

// ---------------------------------------------------------------
// FLIP movement animation
// ---------------------------------------------------------------

export function captureTilePositions(containers) {
    const positions = new Map();
    containers.forEach((container) => {
        container.querySelectorAll(".rummikub-tile[data-tile-id]").forEach((tileElement) => {
            positions.set(tileElement.dataset.tileId, tileElement.getBoundingClientRect());
        });
    });
    return positions;
}

export function playFlipAnimations(containers, previousPositions) {
    let newTileCount = 0;

    containers.forEach((container) => {
        container.querySelectorAll(".rummikub-tile[data-tile-id]").forEach((tileElement) => {
            const previousRect = previousPositions.get(tileElement.dataset.tileId);

            if (!previousRect) {
                tileElement.style.animationDelay = `${newTileCount * POP_IN_STAGGER_SECONDS}s`;
                tileElement.classList.add("rummikub-tile--pop-in");
                newTileCount += 1;
                return;
            }

            const newRect = tileElement.getBoundingClientRect();
            const deltaX = previousRect.left - newRect.left;
            const deltaY = previousRect.top - newRect.top;
            if (Math.abs(deltaX) < 0.5 && Math.abs(deltaY) < 0.5) return;

            tileElement.style.transition = "none";
            tileElement.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
            requestAnimationFrame(() => {
                tileElement.style.transition = "";
                tileElement.style.transform = "";
            });
        });
    });
}
