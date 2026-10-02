// "Doden over tijd" graph on the main Death Counter screen.
//
// One step line per active player: it starts at 0 and goes up by one at the
// moment of each death (from deathTimestamps), so you can see who died when and
// who is pulling ahead. Deaths from before timestamps existed are left out.
// Plain inline SVG, no chart library, so the page stays light.
//
// Hover (or arrow keys when the graph has focus) shows a crosshair that snaps
// to the nearest death, with a tooltip listing every player's total at that moment.

const deathGraphSection = document.querySelector('[data-death-graph-section]');
const deathGraphLegend = document.querySelector('[data-death-graph-legend]');
const deathGraphCanvas = document.querySelector('[data-death-graph-canvas]');
const deathGraphTableContainer = document.querySelector('[data-death-graph-table]');

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

const GRAPH_HEIGHT_PX = 240;
const GRAPH_MARGIN_TOP_PX = 12;
const GRAPH_MARGIN_BOTTOM_PX = 28;
const GRAPH_MARGIN_LEFT_PX = 30;
// Room on the right for the "Name 9" label at the end of each line.
const GRAPH_MARGIN_RIGHT_PX = 84;
const GRAPH_TARGET_Y_TICK_COUNT = 5;
const END_LABEL_OFFSET_PX = 10;
// End labels closer than this would overlap; the lower one is dropped (legend + tooltip still name it).
const END_LABEL_MIN_SPACING_PX = 14;
const END_DOT_RADIUS_PX = 4;
const TOOLTIP_OFFSET_PX = 12;
const MILLISECONDS_PER_MINUTE = 60 * 1000;
const MILLISECONDS_PER_HOUR = 60 * MILLISECONDS_PER_MINUTE;

// Pauses longer than this between deaths are cut out of the graph, so long
// stretches without playing don't turn into long flat lines. Each remaining
// play session gets width based on how long it lasted.
const SESSION_BREAK_MS = MILLISECONDS_PER_HOUR;
// Width of the marked gap that replaces a cut-out pause.
const SESSION_GAP_PX = 14;
// Even a session with a single death stays wide enough to see.
const MIN_SESSION_WIDTH_PX = 24;
// Space inside each session before its first and after its last death, so steps don't touch the gap.
const SESSION_INNER_PADDING_PX = 4;
// Session start labels closer than this would overlap; the later one is skipped.
const X_LABEL_MIN_SPACING_PX = 78;
// The right edge is "now", so lines keep extending; redraw now and then even without new deaths.
const GRAPH_TIME_EDGE_REFRESH_MS = MILLISECONDS_PER_MINUTE;

let lastGraphedPlayers = [];

function createSvgElement(tagName, attributes = {}) {
    const svgElement = document.createElementNS(SVG_NAMESPACE, tagName);
    Object.entries(attributes).forEach(([attributeName, attributeValue]) => {
        svgElement.setAttribute(attributeName, attributeValue);
    });
    return svgElement;
}

// Rounds a rough step up to 1, 2, 5, 10, 20, 50, ... so the y-axis shows clean numbers.
function pickNiceStep(roughStep) {
    const powerOfTen = 10 ** Math.floor(Math.log10(Math.max(roughStep, 1)));
    const niceMultiplier = [1, 2, 5, 10].find((multiplier) => multiplier * powerOfTen >= roughStep);
    return niceMultiplier * powerOfTen;
}

function formatSessionStart(timestamp) {
    const date = new Date(timestamp);
    const dayLabel = date.toLocaleDateString('nl-BE', { day: 'numeric', month: 'short' });
    const timeLabel = date.toLocaleTimeString('nl-BE', { hour: '2-digit', minute: '2-digit' });
    return `${dayLabel} ${timeLabel}`;
}

function formatPauseLength(pauseMilliseconds) {
    const pauseHours = Math.round(pauseMilliseconds / MILLISECONDS_PER_HOUR);
    return pauseHours >= 24 ? `${Math.round(pauseHours / 24)}d pauze` : `${pauseHours}u pauze`;
}

// Groups the (sorted) death times into play sessions: a new session starts
// after a pause longer than SESSION_BREAK_MS. If the last death was recent,
// the current session runs on until "now".
function splitIntoPlaySessions(sortedDeathTimestamps) {
    const sessions = [];
    sortedDeathTimestamps.forEach((deathTimestamp) => {
        const currentSession = sessions[sessions.length - 1];
        if (currentSession && deathTimestamp - currentSession.end <= SESSION_BREAK_MS) {
            currentSession.end = deathTimestamp;
        } else {
            sessions.push({ start: deathTimestamp, end: deathTimestamp });
        }
    });
    const lastSession = sessions[sessions.length - 1];
    const isStillPlaying = Date.now() - lastSession.end <= SESSION_BREAK_MS;
    if (isStillPlaying) lastSession.end = Date.now();
    return { sessions, isStillPlaying };
}

// Gives every session a pixel range: a minimum width each, the rest shared by duration.
function layOutSessions(sessions, plotLeft, plotRight) {
    const totalGapWidth = SESSION_GAP_PX * (sessions.length - 1);
    const availableWidth = plotRight - plotLeft - totalGapWidth;
    const totalDuration = sessions.reduce((durationSum, session) => durationSum + (session.end - session.start), 0);
    const widthLeftAfterMinimums = availableWidth - MIN_SESSION_WIDTH_PX * sessions.length;

    let sessionLeft = plotLeft;
    return sessions.map((session) => {
        let sessionWidth;
        if (widthLeftAfterMinimums <= 0 || totalDuration === 0) {
            // Too many sessions (or all instant): just split the space evenly.
            sessionWidth = availableWidth / sessions.length;
        } else {
            sessionWidth = MIN_SESSION_WIDTH_PX + widthLeftAfterMinimums * ((session.end - session.start) / totalDuration);
        }
        const laidOutSession = { ...session, left: sessionLeft, right: sessionLeft + sessionWidth };
        sessionLeft += sessionWidth + SESSION_GAP_PX;
        return laidOutSession;
    });
}

function formatFullTime(timestamp) {
    return new Date(timestamp).toLocaleString('nl-BE', {
        weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
}

// How many deaths this player had at a given moment.
function countDeathsUpTo(deathTimestamps, timestamp) {
    return deathTimestamps.filter((deathTimestamp) => deathTimestamp <= timestamp).length;
}

function buildGraphSeries(players) {
    return players.map((player) => ({
        name: player.name,
        color: player.color,
        deathTimestamps: [...(player.deathTimestamps || [])].sort((first, second) => first - second),
    }));
}

function renderGraphLegend(series) {
    deathGraphLegend.innerHTML = '';
    series.forEach((playerSeries) => {
        const legendItem = document.createElement('li');
        legendItem.className = 'death-counter-graph-legend-item';
        const lineKey = document.createElement('span');
        lineKey.className = 'death-counter-graph-line-key';
        lineKey.style.setProperty('--player-accent-color', playerSeries.color);
        lineKey.setAttribute('aria-hidden', 'true');
        legendItem.appendChild(lineKey);
        legendItem.appendChild(document.createTextNode(playerSeries.name));
        deathGraphLegend.appendChild(legendItem);
    });
}

// Local calendar day, e.g. "2026-10-02", so deaths group by the day they happened here.
function getLocalDayKey(timestamp) {
    const date = new Date(timestamp);
    const padToTwoDigits = (number) => String(number).padStart(2, '0');
    return `${date.getFullYear()}-${padToTwoDigits(date.getMonth() + 1)}-${padToTwoDigits(date.getDate())}`;
}

function formatDayLabel(timestamp) {
    return new Date(timestamp).toLocaleDateString('nl-BE', { weekday: 'short', day: 'numeric', month: 'short' });
}

// One row per day (newest first): how many deaths each player had that day, plus the day total.
function renderGraphTable(series) {
    const deathsByDay = new Map();
    series.forEach((playerSeries, playerIndex) => {
        playerSeries.deathTimestamps.forEach((deathTimestamp) => {
            const dayKey = getLocalDayKey(deathTimestamp);
            if (!deathsByDay.has(dayKey)) {
                deathsByDay.set(dayKey, { label: formatDayLabel(deathTimestamp), deathsPerPlayer: series.map(() => 0) });
            }
            deathsByDay.get(dayKey).deathsPerPlayer[playerIndex] += 1;
        });
    });
    const days = [...deathsByDay.entries()].sort(([firstDayKey], [secondDayKey]) => secondDayKey.localeCompare(firstDayKey));

    const table = document.createElement('table');
    table.className = 'death-counter-graph-table';
    const headerRow = table.createTHead().insertRow();
    ['Dag', ...series.map((playerSeries) => playerSeries.name), 'Totaal'].forEach((headerText) => {
        const headerCell = document.createElement('th');
        headerCell.scope = 'col';
        headerCell.textContent = headerText;
        headerRow.appendChild(headerCell);
    });
    const tableBody = table.createTBody();
    days.forEach(([, day]) => {
        const row = tableBody.insertRow();
        row.insertCell().textContent = day.label;
        day.deathsPerPlayer.forEach((playerDeaths) => {
            row.insertCell().textContent = playerDeaths;
        });
        row.insertCell().textContent = day.deathsPerPlayer.reduce((dayTotal, playerDeaths) => dayTotal + playerDeaths, 0);
    });

    deathGraphTableContainer.innerHTML = '';
    deathGraphTableContainer.appendChild(table);
}

function renderDeathGraph(players) {
    lastGraphedPlayers = players;
    const series = buildGraphSeries(players);
    const allDeathTimestamps = [...new Set(series.flatMap((playerSeries) => playerSeries.deathTimestamps))].sort((first, second) => first - second);

    if (series.length === 0) {
        deathGraphSection.hidden = true;
        return;
    }
    deathGraphSection.hidden = false;
    renderGraphLegend(series);
    renderGraphTable(series);
    deathGraphCanvas.innerHTML = '';

    if (allDeathTimestamps.length === 0) {
        const emptyMessage = document.createElement('p');
        emptyMessage.className = 'death-counter-graph-empty-message';
        emptyMessage.textContent = 'Nog geen doden met een bekende tijd. Tik op een speler en de grafiek verschijnt hier.';
        deathGraphCanvas.appendChild(emptyMessage);
        return;
    }

    // ---- Scales ----
    const graphWidth = deathGraphCanvas.clientWidth;
    const plotLeft = GRAPH_MARGIN_LEFT_PX;
    const plotRight = graphWidth - GRAPH_MARGIN_RIGHT_PX;
    const plotTop = GRAPH_MARGIN_TOP_PX;
    const plotBottom = GRAPH_HEIGHT_PX - GRAPH_MARGIN_BOTTOM_PX;

    const { sessions, isStillPlaying } = splitIntoPlaySessions(allDeathTimestamps);
    const laidOutSessions = layOutSessions(sessions, plotLeft, plotRight);

    const highestCount = Math.max(...series.map((playerSeries) => playerSeries.deathTimestamps.length), 1);
    const yStep = pickNiceStep(highestCount / GRAPH_TARGET_Y_TICK_COUNT);
    const yMax = Math.ceil(highestCount / yStep) * yStep;

    // Only called with times inside a session (death times and session ends).
    const xForTime = (timestamp) => {
        const session = laidOutSessions.find((candidate) => timestamp >= candidate.start && timestamp <= candidate.end)
            || laidOutSessions[laidOutSessions.length - 1];
        const innerLeft = session.left + SESSION_INNER_PADDING_PX;
        const innerRight = session.right - SESSION_INNER_PADDING_PX;
        const sessionDuration = session.end - session.start;
        if (sessionDuration === 0) return (innerLeft + innerRight) / 2;
        return innerLeft + ((timestamp - session.start) / sessionDuration) * (innerRight - innerLeft);
    };
    const yForCount = (count) => plotBottom - (count / yMax) * (plotBottom - plotTop);

    const svg = createSvgElement('svg', {
        class: 'death-counter-graph-svg',
        viewBox: `0 0 ${graphWidth} ${GRAPH_HEIGHT_PX}`,
        role: 'img',
        tabindex: '0',
        'aria-label': `Doden over tijd: ${series.map((playerSeries) => `${playerSeries.name} ${playerSeries.deathTimestamps.length}`).join(', ')}. Gebruik de pijltjestoetsen om per dood te bekijken.`,
    });

    // ---- Gridlines + y-axis labels ----
    for (let tickCount = 0; tickCount <= yMax; tickCount += yStep) {
        const tickY = yForCount(tickCount);
        svg.appendChild(createSvgElement('line', {
            class: 'death-counter-graph-gridline', x1: plotLeft, x2: plotRight, y1: tickY, y2: tickY,
        }));
        const tickLabel = createSvgElement('text', {
            class: 'death-counter-graph-axis-label', x: plotLeft - 8, y: tickY, 'text-anchor': 'end', 'dominant-baseline': 'middle',
        });
        tickLabel.textContent = tickCount;
        svg.appendChild(tickLabel);
    }

    // ---- Cut-out pauses + x-axis labels (one per session start) ----
    laidOutSessions.slice(1).forEach((session, gapIndex) => {
        const previousSession = laidOutSessions[gapIndex];
        const pauseBand = createSvgElement('rect', {
            class: 'death-counter-graph-pause-band',
            x: previousSession.right,
            y: plotTop,
            width: SESSION_GAP_PX,
            height: plotBottom - plotTop,
        });
        const pauseTitle = createSvgElement('title');
        pauseTitle.textContent = formatPauseLength(session.start - previousSession.end);
        pauseBand.appendChild(pauseTitle);
        svg.appendChild(pauseBand);
    });

    const xLabelY = GRAPH_HEIGHT_PX - 8;
    const nowLabelX = plotRight;
    // Longest sessions get their start label first; a label too close to one
    // already placed (or to "nu") is skipped. The tooltip still shows every date.
    const placedLabelXs = isStillPlaying ? [nowLabelX] : [];
    [...laidOutSessions]
        .sort((first, second) => (second.end - second.start) - (first.end - first.start))
        .forEach((session) => {
            const labelX = session.left;
            const overlapsPlacedLabel = placedLabelXs.some((placedX) => Math.abs(placedX - labelX) < X_LABEL_MIN_SPACING_PX);
            if (overlapsPlacedLabel) return;
            placedLabelXs.push(labelX);
            const sessionLabel = createSvgElement('text', { class: 'death-counter-graph-axis-label', x: labelX, y: xLabelY, 'text-anchor': 'start' });
            sessionLabel.textContent = formatSessionStart(session.start);
            svg.appendChild(sessionLabel);
        });
    if (isStillPlaying) {
        const nowLabel = createSvgElement('text', { class: 'death-counter-graph-axis-label', x: nowLabelX, y: xLabelY, 'text-anchor': 'end' });
        nowLabel.textContent = 'nu';
        svg.appendChild(nowLabel);
    }

    // ---- Lines, end dots, end labels ----
    const endLabels = [];
    series.forEach((playerSeries) => {
        let pathData = `M ${plotLeft} ${yForCount(0)}`;
        playerSeries.deathTimestamps.forEach((deathTimestamp, deathIndex) => {
            pathData += ` H ${xForTime(deathTimestamp)} V ${yForCount(deathIndex + 1)}`;
        });
        pathData += ` H ${plotRight}`;

        const line = createSvgElement('path', { class: 'death-counter-graph-line', d: pathData });
        line.style.setProperty('--player-accent-color', playerSeries.color);
        svg.appendChild(line);

        const finalCount = playerSeries.deathTimestamps.length;
        endLabels.push({ name: playerSeries.name, count: finalCount, y: yForCount(finalCount), color: playerSeries.color });
    });

    endLabels.forEach((endLabel) => {
        const endDot = createSvgElement('circle', {
            class: 'death-counter-graph-end-dot', cx: plotRight, cy: endLabel.y, r: END_DOT_RADIUS_PX,
        });
        endDot.style.setProperty('--player-accent-color', endLabel.color);
        svg.appendChild(endDot);
    });

    // Highest totals get their label first; a label that would overlap one already placed is skipped.
    const placedLabelYs = [];
    [...endLabels].sort((first, second) => second.count - first.count).forEach((endLabel) => {
        const overlapsPlacedLabel = placedLabelYs.some((placedY) => Math.abs(placedY - endLabel.y) < END_LABEL_MIN_SPACING_PX);
        if (overlapsPlacedLabel) return;
        placedLabelYs.push(endLabel.y);
        const labelText = createSvgElement('text', {
            class: 'death-counter-graph-end-label',
            x: plotRight + END_LABEL_OFFSET_PX,
            y: endLabel.y,
            'dominant-baseline': 'middle',
        });
        labelText.textContent = `${endLabel.name} ${endLabel.count}`;
        svg.appendChild(labelText);
    });

    // ---- Crosshair + tooltip ----
    const crosshair = createSvgElement('line', {
        class: 'death-counter-graph-crosshair', y1: plotTop, y2: plotBottom, visibility: 'hidden',
    });
    svg.appendChild(crosshair);

    const tooltip = document.createElement('div');
    tooltip.className = 'death-counter-graph-tooltip';
    tooltip.hidden = true;

    let focusedDeathIndex = allDeathTimestamps.length - 1;

    function showCrosshairAt(deathIndex) {
        focusedDeathIndex = deathIndex;
        const focusedTime = allDeathTimestamps[deathIndex];
        const crosshairX = xForTime(focusedTime);
        crosshair.setAttribute('x1', crosshairX);
        crosshair.setAttribute('x2', crosshairX);
        crosshair.setAttribute('visibility', 'visible');

        tooltip.innerHTML = '';
        const timeLine = document.createElement('div');
        timeLine.className = 'death-counter-graph-tooltip-time';
        timeLine.textContent = formatFullTime(focusedTime);
        tooltip.appendChild(timeLine);

        series
            .map((playerSeries) => ({ ...playerSeries, countAtTime: countDeathsUpTo(playerSeries.deathTimestamps, focusedTime) }))
            .sort((first, second) => second.countAtTime - first.countAtTime)
            .forEach((playerSeries) => {
                const tooltipRow = document.createElement('div');
                tooltipRow.className = 'death-counter-graph-tooltip-row';
                const lineKey = document.createElement('span');
                lineKey.className = 'death-counter-graph-line-key';
                lineKey.style.setProperty('--player-accent-color', playerSeries.color);
                const value = document.createElement('span');
                value.className = 'death-counter-graph-tooltip-value';
                value.textContent = playerSeries.countAtTime;
                const name = document.createElement('span');
                name.className = 'death-counter-graph-tooltip-name';
                name.textContent = playerSeries.name;
                tooltipRow.append(lineKey, value, name);
                tooltip.appendChild(tooltipRow);
            });

        tooltip.hidden = false;
        // Keep the tooltip inside the graph: right of the crosshair, or left of it near the edge.
        const crosshairPixelX = (crosshairX / graphWidth) * deathGraphCanvas.clientWidth;
        const fitsOnRight = crosshairPixelX + TOOLTIP_OFFSET_PX + tooltip.offsetWidth <= deathGraphCanvas.clientWidth;
        tooltip.style.left = fitsOnRight
            ? `${crosshairPixelX + TOOLTIP_OFFSET_PX}px`
            : `${Math.max(crosshairPixelX - TOOLTIP_OFFSET_PX - tooltip.offsetWidth, 0)}px`;
    }

    function hideCrosshair() {
        crosshair.setAttribute('visibility', 'hidden');
        tooltip.hidden = true;
    }

    const deathXPositions = allDeathTimestamps.map(xForTime);

    function findNearestDeathIndex(pointerX) {
        let nearestIndex = 0;
        deathXPositions.forEach((deathX, deathIndex) => {
            if (Math.abs(deathX - pointerX) < Math.abs(deathXPositions[nearestIndex] - pointerX)) {
                nearestIndex = deathIndex;
            }
        });
        return nearestIndex;
    }

    svg.addEventListener('pointermove', (pointerEvent) => {
        const svgBounds = svg.getBoundingClientRect();
        const pointerX = ((pointerEvent.clientX - svgBounds.left) / svgBounds.width) * graphWidth;
        showCrosshairAt(findNearestDeathIndex(pointerX));
    });
    svg.addEventListener('pointerleave', hideCrosshair);
    svg.addEventListener('focus', () => showCrosshairAt(focusedDeathIndex));
    svg.addEventListener('blur', hideCrosshair);
    svg.addEventListener('keydown', (keyboardEvent) => {
        if (keyboardEvent.key === 'ArrowLeft') {
            keyboardEvent.preventDefault();
            showCrosshairAt(Math.max(focusedDeathIndex - 1, 0));
        } else if (keyboardEvent.key === 'ArrowRight') {
            keyboardEvent.preventDefault();
            showCrosshairAt(Math.min(focusedDeathIndex + 1, allDeathTimestamps.length - 1));
        } else if (keyboardEvent.key === 'Escape') {
            hideCrosshair();
        }
    });

    deathGraphCanvas.append(svg, tooltip);
}

// Redraw with the same data when the screen size changes or as "now" moves on,
// unless someone is reading the tooltip right now.
function redrawDeathGraphIfIdle() {
    const tooltipIsOpen = deathGraphCanvas.querySelector('.death-counter-graph-tooltip:not([hidden])');
    if (!tooltipIsOpen) renderDeathGraph(lastGraphedPlayers);
}

let resizeRedrawFrame = null;
window.addEventListener('resize', () => {
    cancelAnimationFrame(resizeRedrawFrame);
    resizeRedrawFrame = requestAnimationFrame(redrawDeathGraphIfIdle);
});
setInterval(redrawDeathGraphIfIdle, GRAPH_TIME_EDGE_REFRESH_MS);
