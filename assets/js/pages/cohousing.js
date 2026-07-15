const STORAGE_KEY = "cohousing-dashboard-state-v1";
const ACCESS_PASSWORD = "xxx";
const ACCESS_STORAGE_KEY = "cohousing-access-granted";
const DAYS_IN_WEEK = 7;
const MONTHS_TO_DISPLAY = 12;
const MONTHS_BEFORE_CURRENT = Math.floor(MONTHS_TO_DISPLAY / 2);
const HISTORY_MONTH_COUNT = 4;
const WEEKLY_DAYS = 7;
const DEFAULT_WEEKLY_BUDGET = 100;
const ROLE_LABELS = {
    you: "xan",
    mom: "Mom",
    dad: "Dad"
};

const defaultState = {
    activeRole: "you",
    selectedMonthKey: getMonthKey(new Date()),
    weeklyBudget: DEFAULT_WEEKLY_BUDGET,
    assignments: {},
    users: structuredClone(DEFAULT_USERS)
};

let state = structuredClone(defaultState);

const monthSelect = document.querySelector("[data-month-select]");
const roleSwitcher = document.querySelector("[data-role-switcher]");
const accessOverlay = document.querySelector("[data-access-overlay]");
const accessForm = document.querySelector("[data-access-form]");
const accessInput = document.querySelector("[data-access-input]");
const accessError = document.querySelector("[data-access-error]");
const roleStatus = document.querySelector("[data-role-status]");
const syncStatus = document.querySelector("[data-sync-status]");
const calendarGrid = document.querySelector("[data-calendar-grid]");
const summaryList = document.querySelector("[data-summary-list]");
const historyList = document.querySelector("[data-history-list]");
const amountInputs = document.querySelectorAll("[data-budget-input]");

let pageInitialized = false;

initializeAccessControl();

async function initialize() {
    if (pageInitialized) {
        return;
    }

    pageInitialized = true;
    await loadRemoteState();
    ensureStateHasData();
    renderRoleButtons();
    renderMonthSelector();
    bindEvents();
    renderAll();
}

function loadLocalState() {
    try {
        const item = localStorage.getItem(STORAGE_KEY);
        if (!item) {
            return structuredClone(defaultState);
        }

        const parsed = JSON.parse(item);
        return normalizeState(parsed);
    } catch (error) {
        console.warn("Could not read saved state", error);
        return structuredClone(defaultState);
    }
}

function normalizeState(parsedState) {
    return {
        activeRole: normalizeRoleKey(parsedState.activeRole || defaultState.activeRole),
        selectedMonthKey: parsedState.selectedMonthKey || defaultState.selectedMonthKey,
        weeklyBudget: Number(parsedState.weeklyBudget) || Number(defaultState.weeklyBudget) || 0,
        assignments: parsedState.assignments || {},
        users: Array.isArray(parsedState.users) && parsedState.users.length ? parsedState.users : structuredClone(DEFAULT_USERS)
    };
}

function normalizeRoleKey(roleKey) {
    if (roleKey === "xan") {
        return "you";
    }

    return roleKey;
}

async function loadRemoteState() {
    const localState = loadLocalState();
    state = localState;

    await refreshRemoteState();
}

async function refreshRemoteState() {
    try {
        const remoteData = await loadDashboardData();
        if (remoteData) {
            state = hydrateStateFromRemoteData(remoteData, state);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
            updateSyncStatus("Connected to shared database");
        } else {
            updateSyncStatus("Using local draft until you save");
        }
    } catch (error) {
        console.warn("Could not load shared data", error);
        updateSyncStatus("Offline draft only");
    }
}

async function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    updateSyncStatus("Saving…");

    try {
        const payload = buildRemotePayload(state.assignments, state.users);
        await saveDashboardData(payload);
        await refreshRemoteState();
        updateSyncStatus("Saved to shared database");
    } catch (error) {
        console.warn("Could not save to database", error);
        updateSyncStatus("Saved locally, sync pending");
    }
}

function updateSyncStatus(message) {
    if (syncStatus) {
        syncStatus.textContent = message;
    }
}

function initializeAccessControl() {
    if (isAccessGranted()) {
        hideAccessOverlay();
        void initialize();
        return;
    }

    if (!accessForm) {
        return;
    }

    accessForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const enteredPassword = accessInput?.value?.trim() || "";

        if (enteredPassword !== ACCESS_PASSWORD) {
            if (accessError) {
                accessError.textContent = "Wrong password. Try again.";
            }
            return;
        }

        grantAccess();
        if (accessError) {
            accessError.textContent = "";
        }
        hideAccessOverlay();
        await initialize();
    });
}

function isAccessGranted() {
    return sessionStorage.getItem(ACCESS_STORAGE_KEY) === "true" || localStorage.getItem(ACCESS_STORAGE_KEY) === "true";
}

function grantAccess() {
    sessionStorage.setItem(ACCESS_STORAGE_KEY, "true");
    localStorage.setItem(ACCESS_STORAGE_KEY, "true");
}

function hideAccessOverlay() {
    accessOverlay?.classList.add("is-hidden");
}

function ensureStateHasData() {
    if (!state.assignments) {
        state.assignments = {};
    }

    if (!state.selectedMonthKey) {
        state.selectedMonthKey = getMonthKey(new Date());
    }
}

function bindEvents() {
    monthSelect.addEventListener("change", async (event) => {
        state.selectedMonthKey = event.target.value;
        await saveState();
        renderAll();
    });

    amountInputs.forEach((input) => {
        input.addEventListener("change", async () => {
            state.weeklyBudget = Number(input.value) || 0;
            await saveState();
            renderSummary();
            renderHistory();
        });
    });

}

function bindCalendarInteractions(monthKey) {
    calendarGrid.querySelectorAll("[data-calendar-day]").forEach((button) => {
        button.addEventListener("click", () => {
            const dayNumber = Number(button.getAttribute("data-calendar-day"));
            void toggleAssignment(monthKey, dayNumber);
        });
    });
}

function renderAll() {
    renderRoleButtons();
    renderMonthSelector();
    renderCalendar();
    renderSummary();
    renderHistory();
}

function renderRoleButtons() {
    if (!roleSwitcher) {
        return;
    }

    roleSwitcher.innerHTML = state.users
        .map((user) => {
            const roleKey = getRoleKeyFromUser(user);
            const isActive = roleKey === state.activeRole;
            const label = user?.name || roleKey;
            return `<button class="role-button${isActive ? " is-active" : ""}" type="button" data-role-option="${roleKey}">${label}</button>`;
        })
        .join("");

    const buttons = roleSwitcher.querySelectorAll("[data-role-option]");
    buttons.forEach((button) => {
        button.addEventListener("click", async () => {
            state.activeRole = button.getAttribute("data-role-option");
            await saveState();
            renderRoleButtons();
            renderAll();
        });
    });

    document.body.setAttribute("data-active-role", state.activeRole);
    roleStatus.textContent = `Currently editing as ${getRoleLabel(state.activeRole)}.`;
}

function renderMonthSelector() {
    const monthOptions = getRecentMonthOptions();

    monthSelect.innerHTML = monthOptions
        .map((monthKey) => {
            const label = formatMonthLabel(monthKey);
            const isSelected = monthKey === state.selectedMonthKey;
            return `<option value="${monthKey}" ${isSelected ? "selected" : ""}>${label}</option>`;
        })
        .join("");
}

function renderCalendar() {
    const monthKey = state.selectedMonthKey;
    const monthDate = parseMonthKey(monthKey);
    const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
    const startingOffset = (firstDay.getDay() + DAYS_IN_WEEK - 1) % DAYS_IN_WEEK;

    const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    const html = [];

    dayNames.forEach((dayName) => {
        html.push(`<div class="calendar-day-name">${dayName}</div>`);
    });

    for (let index = 0; index < startingOffset; index += 1) {
        html.push(`<div class="calendar-day is-muted" aria-hidden="true"></div>`);
    }

    const today = new Date();
    const isCurrentMonth = monthDate.getFullYear() === today.getFullYear() && monthDate.getMonth() === today.getMonth();

    for (let dayNumber = 1; dayNumber <= daysInMonth; dayNumber += 1) {
        const assignment = getAssignment(monthKey, dayNumber);
        const label = assignment ? ROLE_LABELS[assignment] : "Open";

        const classes = ["calendar-day"];
        if (assignment) {
            classes.push(`is-${assignment}`);
        }
        if (isCurrentMonth && dayNumber === today.getDate()) {
            classes.push("is-today");
        }

        const buttonLabel = assignment
            ? `${ROLE_LABELS[assignment]} stay on ${formatMonthLabel(monthKey)} ${dayNumber}`
            : `Mark ${ROLE_LABELS[state.activeRole]} stay on ${formatMonthLabel(monthKey)} ${dayNumber}`;

        html.push(`
            <button
                class="${classes.join(" ")}"
                type="button"
                data-calendar-day="${dayNumber}"
                aria-label="${buttonLabel}"
            >
                <span class="calendar-day-number">${dayNumber}</span>
                <span class="calendar-day-label">${label}</span>
            </button>
        `);
    }

    calendarGrid.innerHTML = html.join("");
    bindCalendarInteractions(monthKey);
}

async function toggleAssignment(monthKey, dayNumber, shouldPersist = true) {
    const assignment = getAssignment(monthKey, dayNumber);

    if (assignment === state.activeRole) {
        removeAssignment(monthKey, dayNumber);
    } else {
        setAssignment(monthKey, dayNumber, state.activeRole);
    }

    if (!shouldPersist) {
        renderCalendar();
        return;
    }

    await saveState();
    renderAll();
}

function setAssignment(monthKey, dayNumber, role) {
    const assignments = getAssignmentsForMonth(monthKey);
    assignments[dayNumber] = role;
}

function removeAssignment(monthKey, dayNumber) {
    const assignments = getAssignmentsForMonth(monthKey);
    delete assignments[dayNumber];
}

function getAssignment(monthKey, dayNumber) {
    return getAssignmentsForMonth(monthKey)[dayNumber];
}

function getAssignmentsForMonth(monthKey) {
    if (!state.assignments[monthKey]) {
        state.assignments[monthKey] = {};
    }
    return state.assignments[monthKey];
}

function renderSummary() {
    const monthKey = state.selectedMonthKey;
    const monthDate = parseMonthKey(monthKey);
    const paymentBreakdown = getPaymentBreakdown(monthKey);
    const weeklyBudget = paymentBreakdown.weeklyBudget;

    const summaryCards = [
        {
            title: "Per-day rate",
            value: formatCurrency(paymentBreakdown.dailyRate),
            copy: `${paymentBreakdown.totalPaidDays} paid day${paymentBreakdown.totalPaidDays === 1 ? "" : "s"} • €${weeklyBudget} weekly budget`
        },
        {
            title: "Mom share",
            value: formatCurrency(paymentBreakdown.momShare),
            copy: `${paymentBreakdown.counts.mom} day${paymentBreakdown.counts.mom === 1 ? "" : "s"} × ${formatCurrency(paymentBreakdown.dailyRate)}`
        },
        {
            title: "Dad share",
            value: formatCurrency(paymentBreakdown.dadShare),
            copy: `${paymentBreakdown.counts.dad} day${paymentBreakdown.counts.dad === 1 ? "" : "s"} × ${formatCurrency(paymentBreakdown.dailyRate)}`
        },
        {
            title: "Weekly budget",
            value: formatCurrency(weeklyBudget),
            copy: `${formatMonthLabel(monthKey)} for ${monthDate.toLocaleDateString("en", { month: "long", year: "numeric" })}`
        }
    ];

    summaryList.innerHTML = summaryCards
        .map(
            (card) => `
                <article class="summary-card">
                    <p class="summary-title">${card.title}</p>
                    <p class="summary-value">${card.value}</p>
                    <p class="summary-copy">${card.copy}</p>
                </article>
            `
        )
        .join("");
}

function renderHistory() {
    const historyMonths = getRecentMonthOptions().slice(0, HISTORY_MONTH_COUNT);

    if (!historyMonths.length) {
        historyList.innerHTML = '<p class="summary-copy">No history yet.</p>';
        return;
    }

    historyList.innerHTML = historyMonths
        .map((monthKey) => {
            const paymentBreakdown = getPaymentBreakdown(monthKey);
            return `
                <article class="history-item">
                    <div>
                        <strong>${formatMonthLabel(monthKey)}</strong>
                        <div class="history-meta">Mom: ${paymentBreakdown.counts.mom} • Dad: ${paymentBreakdown.counts.dad} • You: ${paymentBreakdown.counts.you}</div>
                    </div>
                    <div class="history-meta">Mom ${formatCurrency(paymentBreakdown.momShare)} • Dad ${formatCurrency(paymentBreakdown.dadShare)}</div>
                </article>
            `;
        })
        .join("");
}

function countAssignmentsForMonth(monthKey) {
    const monthAssignments = getAssignmentsForMonth(monthKey);
    const counts = { you: 0, mom: 0, dad: 0 };

    Object.values(monthAssignments).forEach((assignment) => {
        if (counts[assignment] !== undefined) {
            counts[assignment] += 1;
        }
    });

    return counts;
}

function getPaymentBreakdown(monthKey) {
    const counts = countAssignmentsForMonth(monthKey);
    const billableDays = counts.mom + counts.dad;
    const weeklyBudget = Number(state.weeklyBudget) || 0;
    const dailyRate = weeklyBudget > 0 ? weeklyBudget / WEEKLY_DAYS : 0;

    return {
        counts,
        totalPaidDays: billableDays,
        weeklyBudget,
        dailyRate,
        momShare: counts.mom * dailyRate,
        dadShare: counts.dad * dailyRate
    };
}

function formatCurrency(value) {
    return `€${Number(value || 0).toFixed(2)}`;
}

function getRoleKeyFromUser(user) {
    const name = String(user?.name || "").toLowerCase();

    if (name === "xan") {
        return "you";
    }

    if (name === "mom") {
        return "mom";
    }

    if (name === "dad") {
        return "dad";
    }

    return name;
}

function getRoleLabel(roleKey) {
    const user = (state.users || []).find((entry) => getRoleKeyFromUser(entry) === roleKey);
    return user?.name || ROLE_LABELS[roleKey] || roleKey;
}

function getRecentMonthOptions() {
    const options = [];
    const startDate = new Date();

    for (let step = 0; step < MONTHS_TO_DISPLAY; step += 1) {
        const monthOffset = step - MONTHS_BEFORE_CURRENT;
        options.push(getMonthKey(addMonths(startDate, monthOffset)));
    }

    return options;
}

function getMonthKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
}

function parseMonthKey(monthKey) {
    const [year, month] = monthKey.split("-").map(Number);
    return new Date(year, month - 1, 1);
}

function addMonths(date, amount) {
    const nextDate = new Date(date);
    nextDate.setMonth(nextDate.getMonth() + amount);
    return nextDate;
}

function formatMonthLabel(monthKey) {
    const monthDate = parseMonthKey(monthKey);
    return monthDate.toLocaleDateString("en", { month: "long", year: "numeric" });
}
