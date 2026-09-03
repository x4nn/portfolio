// DOM rendering for the UNO hand, discard/draw piles, and player strip.
// Same rebuild-from-scratch-plus-FLIP approach as Rummikub's renderer, kept
// as an independent copy since each game folder is self-contained.

const POP_IN_STAGGER_SECONDS = 0.025;

const ACTION_SYMBOLS = {
    skip: "⊘",
    reverse: "⇄",
    drawTwo: "+2",
    wildDrawFour: "+4",
};

function getCardSymbol(card) {
    if (card.type === "number") return String(card.number);
    if (card.type === "wild") return "";
    return ACTION_SYMBOLS[card.type] || "";
}

function createCardElement(card, { playable, selected, faceDown } = {}) {
    const cardElement = document.createElement("div");
    cardElement.className = "uno-card";
    cardElement.dataset.cardId = card.id;

    if (faceDown) {
        cardElement.classList.add("uno-card--back");
        return cardElement;
    }

    cardElement.dataset.color = card.color || "wild";
    if (selected) cardElement.classList.add("uno-card--selected");
    if (playable === false) cardElement.classList.add("uno-card--unplayable");
    if (playable) cardElement.classList.add("uno-card--playable");

    const symbolElement = document.createElement("span");
    symbolElement.className = "uno-card-symbol";
    symbolElement.textContent = getCardSymbol(card);
    cardElement.appendChild(symbolElement);

    return cardElement;
}

export function renderHand(handContainerElement, hand, { selectedCardId, isPlayableCard }) {
    handContainerElement.innerHTML = "";
    hand.forEach((card) => {
        const playable = isPlayableCard ? isPlayableCard(card) : true;
        handContainerElement.appendChild(
            createCardElement(card, { playable, selected: card.id === selectedCardId })
        );
    });
}

export function renderDiscardTop(discardElement, topCard, activeColor) {
    discardElement.innerHTML = "";
    discardElement.dataset.activeColor = activeColor;
    if (topCard) discardElement.appendChild(createCardElement(topCard));
}

export function renderDrawPile(drawPileElement, drawPileCount) {
    drawPileElement.innerHTML = "";
    const backCard = createCardElement({ id: "draw-pile-back" }, { faceDown: true });
    drawPileElement.appendChild(backCard);
    const countBadge = document.createElement("span");
    countBadge.className = "uno-draw-pile-count";
    countBadge.textContent = drawPileCount;
    drawPileElement.appendChild(countBadge);
}

function getInitials(name) {
    return name.trim().slice(0, 1).toUpperCase() || "?";
}

export function renderPlayersStrip(stripElement, room, myPlayerId, { onCatch }) {
    stripElement.innerHTML = "";
    const currentTurnPlayerId = room.turnOrder[room.currentTurnIndex];

    room.turnOrder
        .filter((playerId) => playerId !== myPlayerId)
        .forEach((playerId) => {
            const player = room.players[playerId];
            const playerElement = document.createElement("div");
            playerElement.className = "uno-player";
            if (playerId === currentTurnPlayerId) playerElement.classList.add("uno-player--active");
            if (!player.connected) playerElement.classList.add("uno-player--disconnected");

            playerElement.innerHTML = `
                <span class="uno-player-avatar" aria-hidden="true"></span>
                <span class="uno-player-info">
                    <span class="uno-player-name"></span>
                    <span class="uno-player-count">${player.handCount} kaarten</span>
                </span>
            `;
            playerElement.querySelector(".uno-player-avatar").textContent = getInitials(player.name);
            playerElement.querySelector(".uno-player-name").textContent = player.name;

            if (player.handCount === 1 && !player.hasCalledUno) {
                const catchButton = document.createElement("button");
                catchButton.type = "button";
                catchButton.className = "uno-catch-button";
                catchButton.textContent = "Betrap! (+2)";
                catchButton.addEventListener("click", () => onCatch(playerId));
                playerElement.appendChild(catchButton);
            } else if (player.handCount === 1) {
                const unoBadge = document.createElement("span");
                unoBadge.className = "uno-badge";
                unoBadge.textContent = "UNO!";
                playerElement.appendChild(unoBadge);
            }

            stripElement.appendChild(playerElement);
        });
}

export function renderTurnStatus(statusElement, directionElement, room, myPlayerId) {
    const currentTurnPlayerId = room.turnOrder[room.currentTurnIndex];
    const isMyTurn = currentTurnPlayerId === myPlayerId;
    statusElement.textContent = isMyTurn ? "Jouw beurt" : `Beurt van ${room.players[currentTurnPlayerId]?.name ?? "…"}`;
    statusElement.classList.toggle("uno-turn-status--mine", isMyTurn);
    directionElement.textContent = room.direction === 1 ? "↻" : "↺";
}

// ---------------------------------------------------------------
// FLIP movement animation (same technique as render.js in the rummikub
// folder — kept separate since these operate on `.uno-card` elements).
// ---------------------------------------------------------------

export function captureCardPositions(containers) {
    const positions = new Map();
    containers.forEach((container) => {
        container.querySelectorAll(".uno-card[data-card-id]").forEach((cardElement) => {
            positions.set(cardElement.dataset.cardId, cardElement.getBoundingClientRect());
        });
    });
    return positions;
}

export function playFlipAnimations(containers, previousPositions) {
    let newCardCount = 0;

    containers.forEach((container) => {
        container.querySelectorAll(".uno-card[data-card-id]").forEach((cardElement) => {
            const previousRect = previousPositions.get(cardElement.dataset.cardId);

            if (!previousRect) {
                cardElement.style.animationDelay = `${newCardCount * POP_IN_STAGGER_SECONDS}s`;
                cardElement.classList.add("uno-card--pop-in");
                newCardCount += 1;
                return;
            }

            const newRect = cardElement.getBoundingClientRect();
            const deltaX = previousRect.left - newRect.left;
            const deltaY = previousRect.top - newRect.top;
            if (Math.abs(deltaX) < 0.5 && Math.abs(deltaY) < 0.5) return;

            cardElement.style.transition = "none";
            cardElement.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
            requestAnimationFrame(() => {
                cardElement.style.transition = "";
                cardElement.style.transform = "";
            });
        });
    });
}
