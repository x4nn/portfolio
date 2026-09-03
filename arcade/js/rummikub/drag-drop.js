// Pointer-events-based drag and drop — works for mouse AND touch, unlike the
// native HTML5 DnD API which touch devices don't support well. Also doubles
// as a tap-to-select-then-tap-to-place interaction, since distinguishing a
// tap from a drag-start on touch needs the same "did it move far enough"
// threshold anyway.
//
// This module only resolves gestures into { tileId, destination } — it does
// not touch the game model. main.js owns moving tiles between the draft
// board/hand and re-rendering.

const DRAG_START_DISTANCE_THRESHOLD_PX = 6;
const DRAGGED_TILE_GHOST_OPACITY = 0.85;

function resolveDropZoneFromElement(element) {
    if (!element) return null;

    const handZoneElement = element.closest("[data-zone='hand']");
    if (handZoneElement) return { type: "hand" };

    const newSetZoneElement = element.closest("[data-zone='new-set']");
    if (newSetZoneElement) return { type: "newSet" };

    const setZoneElement = element.closest("[data-set-index]");
    if (setZoneElement) return { type: "set", index: Number(setZoneElement.dataset.setIndex) };

    return null;
}

function createDragGhost(tileElement) {
    const ghost = tileElement.cloneNode(true);
    ghost.classList.add("rummikub-tile--ghost");
    ghost.style.opacity = String(DRAGGED_TILE_GHOST_OPACITY);
    document.body.appendChild(ghost);
    return ghost;
}

function positionGhostAtPointer(ghost, tileElement, clientX, clientY) {
    const tileRect = tileElement.getBoundingClientRect();
    ghost.style.left = `${clientX - tileRect.width / 2}px`;
    ghost.style.top = `${clientY - tileRect.height / 2}px`;
}

// `rootElement` should contain both the hand zone and the board zones, so a
// single set of listeners can handle drags between them.
export function initDragAndDrop(rootElement, { isInteractive, onDrop, onTap, onDragStart }) {
    let activePointerId = null;
    let draggedTileElement = null;
    let dragGhost = null;
    let dragStartX = 0;
    let dragStartY = 0;
    let hasCrossedDragThreshold = false;

    function cleanupDrag() {
        if (dragGhost) {
            dragGhost.remove();
            dragGhost = null;
        }
        if (draggedTileElement) {
            draggedTileElement.classList.remove("rummikub-tile--dragging");
        }
        draggedTileElement = null;
        activePointerId = null;
        hasCrossedDragThreshold = false;
    }

    rootElement.addEventListener("pointerdown", (event) => {
        if (!isInteractive()) return;
        const tileElement = event.target.closest(".rummikub-tile[data-tile-id]");
        if (!tileElement) return;

        activePointerId = event.pointerId;
        draggedTileElement = tileElement;
        dragStartX = event.clientX;
        dragStartY = event.clientY;
        hasCrossedDragThreshold = false;
    });

    rootElement.addEventListener("pointermove", (event) => {
        if (event.pointerId !== activePointerId || !draggedTileElement) return;

        const distanceMoved = Math.hypot(event.clientX - dragStartX, event.clientY - dragStartY);
        if (!hasCrossedDragThreshold && distanceMoved > DRAG_START_DISTANCE_THRESHOLD_PX) {
            hasCrossedDragThreshold = true;
            draggedTileElement.classList.add("rummikub-tile--dragging");
            dragGhost = createDragGhost(draggedTileElement);
            if (onDragStart) onDragStart(draggedTileElement.dataset.tileId);
        }

        if (hasCrossedDragThreshold && dragGhost) {
            positionGhostAtPointer(dragGhost, draggedTileElement, event.clientX, event.clientY);
        }
    });

    rootElement.addEventListener("pointerup", (event) => {
        if (event.pointerId !== activePointerId || !draggedTileElement) return;
        const tileId = draggedTileElement.dataset.tileId;

        if (!hasCrossedDragThreshold) {
            cleanupDrag();
            onTap(tileId);
            return;
        }

        const elementUnderPointer = document.elementFromPoint(event.clientX, event.clientY);
        const destination = resolveDropZoneFromElement(elementUnderPointer);
        cleanupDrag();
        if (destination) {
            onDrop(tileId, destination);
        }
    });

    rootElement.addEventListener("pointercancel", cleanupDrag);

    // Tapping an empty zone (not a tile) while a tile is selected places it
    // there — the complement to tap-to-select for players who'd rather tap
    // than drag.
    rootElement.addEventListener("click", (event) => {
        if (!isInteractive()) return;
        if (event.target.closest(".rummikub-tile[data-tile-id]")) return; // handled by tap-to-select above
        const destination = resolveDropZoneFromElement(event.target);
        if (destination) onDrop(null, destination);
    });
}
