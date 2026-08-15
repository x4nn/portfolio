const STORAGE_KEY = "cohousing-dashboard-state-v1";
const ACCESS_IDENTITY_STORAGE_KEY = "cohousing-access-identity";
const DAYS_IN_WEEK = 7;
const HISTORY_MONTH_COUNT = 4;

const defaultState = {
    activeRole: "you",
    selectedMonthKey: getMonthKey(new Date()),
    weeklyBudget: DEFAULT_WEEKLY_BUDGET,
    assignments: {},
    assignmentMeta: {},
    users: structuredClone(DEFAULT_USERS),
    monthlyChequesAmounts: {},
    singlePayerTracking: {}
};

let state = structuredClone(defaultState);

const monthSelect = document.querySelector("[data-month-select]");
const roleSwitcher = document.querySelector("[data-role-switcher]");
const accessOverlay = document.querySelector("[data-access-overlay]");
const accessForm = document.querySelector("[data-access-form]");
const accessInput = document.querySelector("[data-access-input]");
const accessError = document.querySelector("[data-access-error]");
const accessDeniedCard = document.querySelector("[data-access-denied]");
const roleStatus = document.querySelector("[data-role-status]");
const syncStatus = document.querySelector("[data-sync-status]");
const calendarGrid = document.querySelector("[data-calendar-grid]");
const summaryList = document.querySelector("[data-summary-list]");
const historyList = document.querySelector("[data-history-list]");
const amountInputs = document.querySelectorAll("[data-budget-input]");

let pageInitialized = false;
let loggedInIdentityRoleKey = null;

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
        assignmentMeta: parsedState.assignmentMeta || {},
        users: Array.isArray(parsedState.users) && parsedState.users.length ? parsedState.users : structuredClone(DEFAULT_USERS),
        monthlyChequesAmounts: parsedState.monthlyChequesAmounts || {},
        singlePayerTracking: parsedState.singlePayerTracking || {}
    };
}

async function loadRemoteState() {
    const localState = loadLocalState();
    state = localState;

    if (loggedInIdentityRoleKey) {
        state.activeRole = loggedInIdentityRoleKey;
    }

    await refreshRemoteState();
}

async function refreshRemoteState() {
    try {
        const remoteData = await loadDashboardData();
        if (remoteData) {
            state = hydrateStateFromRemoteData(remoteData, state);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
            updateSyncStatus("Verbonden met gedeelde database");
        } else {
            updateSyncStatus("Lokaal concept gebruikt tot je opslaat");
        }
    } catch (error) {
        console.warn("Could not load shared data", error);
        updateSyncStatus("Alleen offline concept");
    }
}

async function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    updateSyncStatus("Opslaan…");

    try {
        const payload = buildRemotePayload(state.assignments, state.users, state.assignmentMeta, state.weeklyBudget, state.monthlyChequesAmounts, state.singlePayerTracking);
        await saveDashboardData(payload);
        await refreshRemoteState();
        updateSyncStatus("Opgeslagen in gedeelde database");
    } catch (error) {
        console.warn("Could not save to database", error);
        updateSyncStatus("Lokaal opgeslagen, synchronisatie in behandeling");
    }
}

function updateSyncStatus(message) {
    if (syncStatus) {
        syncStatus.textContent = message;
    }
}

function initializeAccessControl() {
    const storedIdentityRoleKey = getStoredIdentityRoleKey();

    if (storedIdentityRoleKey) {
        loggedInIdentityRoleKey = storedIdentityRoleKey;
        void proceedIfCalendarAccessAllowed();
        return;
    }

    if (!accessForm) {
        return;
    }

    accessForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const enteredPassword = accessInput?.value?.trim() || "";

        if (!enteredPassword) {
            return;
        }

        if (accessError) {
            accessError.textContent = "";
        }
        setAccessFormBusy(true);

        try {
            const candidateUsers = await loadUsersForLogin();
            const matchedUser = candidateUsers.find((user) => user.password === enteredPassword);

            if (!matchedUser) {
                if (accessError) {
                    accessError.textContent = "Wachtwoord ongeldig. Probeer opnieuw.";
                }
                return;
            }

            loggedInIdentityRoleKey = getRoleKeyFromUser(matchedUser);
            grantAccess(loggedInIdentityRoleKey);

            if (matchedUser.showOnCalendarPage === false) {
                showCalendarAccessDenied();
                return;
            }

            hideAccessOverlay();
            await initialize();
        } catch (error) {
            console.warn("Could not verify password", error);
            if (accessError) {
                accessError.textContent = "Kon niet inloggen, controleer je internetverbinding.";
            }
        } finally {
            setAccessFormBusy(false);
        }
    });
}

// Runs for a device that's already logged in from a previous visit. The logged-in identity
// (not whatever role the switcher happens to show) decides calendar access, so this always
// re-checks the person's showOnCalendarPage flag before rendering anything.
async function proceedIfCalendarAccessAllowed() {
    try {
        const candidateUsers = await getUsersForAccessCheck();
        const matchedUser = candidateUsers.find((user) => getRoleKeyFromUser(user) === loggedInIdentityRoleKey);

        if (matchedUser?.showOnCalendarPage === false) {
            showCalendarAccessDenied();
            return;
        }

        hideAccessOverlay();
        await initialize();
    } catch (error) {
        // Can't verify the flag at all (offline, no cache) - fail open rather than locking out
        // an already-approved device over a connectivity hiccup.
        console.warn("Could not verify calendar access, allowing through", error);
        hideAccessOverlay();
        await initialize();
    }
}

async function getUsersForAccessCheck() {
    try {
        return await loadUsersForLogin();
    } catch (error) {
        const cachedState = loadLocalState();
        if (Array.isArray(cachedState.users) && cachedState.users.length) {
            return cachedState.users;
        }
        throw error;
    }
}

function showCalendarAccessDenied() {
    accessOverlay?.classList.remove("is-hidden");
    accessForm?.classList.add("is-hidden");
    accessDeniedCard?.classList.remove("is-hidden");
}

function setAccessFormBusy(isBusy) {
    const submitButton = accessForm?.querySelector("button[type=submit]");
    if (submitButton) {
        submitButton.disabled = isBusy;
    }
    if (accessInput) {
        accessInput.disabled = isBusy;
    }
}

function getStoredIdentityRoleKey() {
    const storedValue = sessionStorage.getItem(ACCESS_IDENTITY_STORAGE_KEY) || localStorage.getItem(ACCESS_IDENTITY_STORAGE_KEY);
    return storedValue ? normalizeRoleKey(storedValue) : null;
}

function grantAccess(identityRoleKey) {
    sessionStorage.setItem(ACCESS_IDENTITY_STORAGE_KEY, identityRoleKey);
    localStorage.setItem(ACCESS_IDENTITY_STORAGE_KEY, identityRoleKey);
}

function hideAccessOverlay() {
    accessOverlay?.classList.add("is-hidden");
}

function ensureStateHasData() {
    if (!state.assignments) {
        state.assignments = {};
    }

    if (!state.assignmentMeta) {
        state.assignmentMeta = {};
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

    const calendarPageUsers = (state.users || []).filter((user) => user.showOnCalendarPage !== false);

    roleSwitcher.innerHTML = calendarPageUsers
        .map((user) => {
            const roleKey = getRoleKeyFromUser(user);
            const isActive = roleKey === state.activeRole;
            const label = getRoleLabel(roleKey, state.users);
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
    applyUserColorTheme(state.users, state.activeRole);
    roleStatus.textContent = `Je bewerkt nu als ${getRoleLabel(state.activeRole, state.users)}.`;
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

    const dayNames = ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"];

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
        const label = assignment ? ROLE_LABELS[assignment] : "Vrij";

        const classes = ["calendar-day"];
        if (assignment) {
            classes.push(`is-${assignment}`);
        }
        if (isCurrentMonth && dayNumber === today.getDate()) {
            classes.push("is-today");
        }

        const assignmentMeta = assignment ? getAssignmentMeta(monthKey, dayNumber) : null;
        const lastChangedTitle = assignmentMeta
            ? `Laatst gewijzigd door ${getRoleLabel(assignmentMeta.lastChangedByRole, state.users)} op ${formatDateTime(assignmentMeta.lastChangedAt)}`
            : "";

        const buttonLabel = assignment
            ? `${ROLE_LABELS[assignment]} verblijf op ${formatMonthLabel(monthKey)} ${dayNumber}${lastChangedTitle ? `, ${lastChangedTitle.toLowerCase()}` : ""}`
            : `Markeer ${ROLE_LABELS[state.activeRole]} voor ${formatMonthLabel(monthKey)} ${dayNumber}`;

        html.push(`
            <button
                class="${classes.join(" ")}"
                type="button"
                data-calendar-day="${dayNumber}"
                aria-label="${buttonLabel}"
                ${lastChangedTitle ? `title="${lastChangedTitle}"` : ""}
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

    const assignmentMetaForMonth = getAssignmentMetaForMonth(monthKey);
    assignmentMetaForMonth[dayNumber] = {
        lastChangedByRole: loggedInIdentityRoleKey || state.activeRole,
        lastChangedAt: Date.now()
    };
}

function removeAssignment(monthKey, dayNumber) {
    const assignments = getAssignmentsForMonth(monthKey);
    delete assignments[dayNumber];

    const assignmentMetaForMonth = getAssignmentMetaForMonth(monthKey);
    delete assignmentMetaForMonth[dayNumber];
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

function getAssignmentMeta(monthKey, dayNumber) {
    return getAssignmentMetaForMonth(monthKey)[dayNumber];
}

function getAssignmentMetaForMonth(monthKey) {
    if (!state.assignmentMeta[monthKey]) {
        state.assignmentMeta[monthKey] = {};
    }
    return state.assignmentMeta[monthKey];
}

function renderSummary() {
    const monthKey = state.selectedMonthKey;
    const monthDate = parseMonthKey(monthKey);
    const paymentBreakdown = getPaymentBreakdown(state.assignments, monthKey, state.weeklyBudget);
    const weeklyBudget = paymentBreakdown.weeklyBudget;

    const summaryCards = [
        {
            title: "Prijs per dag",
            value: formatCurrency(paymentBreakdown.dailyRate),
            copy: `${paymentBreakdown.totalPaidDays} betaalde dag${paymentBreakdown.totalPaidDays === 1 ? "" : "en"} • €${weeklyBudget} per week`
        },
        {
            title: "Aandeel Mama",
            value: formatCurrency(paymentBreakdown.momShare),
            copy: `${paymentBreakdown.counts.mom} dag${paymentBreakdown.counts.mom === 1 ? "" : "en"} × ${formatCurrency(paymentBreakdown.dailyRate)}`
        },
        {
            title: "Aandeel Papa",
            value: formatCurrency(paymentBreakdown.dadShare),
            copy: `${paymentBreakdown.counts.dad} dag${paymentBreakdown.counts.dad === 1 ? "" : "en"} × ${formatCurrency(paymentBreakdown.dailyRate)}`
        },
        {
            title: "Wekelijks budget",
            value: formatCurrency(weeklyBudget),
            copy: `${formatMonthLabel(monthKey)} voor ${monthDate.toLocaleDateString("nl", { month: "long", year: "numeric" })}`
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
    const historyMonths = getHistoryMonthOptions();

    if (!historyMonths.length) {
        historyList.innerHTML = '<p class="summary-copy">Nog geen geschiedenis beschikbaar.</p>';
        return;
    }

    historyList.innerHTML = historyMonths
        .map((monthKey) => {
            const paymentBreakdown = getPaymentBreakdown(state.assignments, monthKey, state.weeklyBudget);

            return `
                <article class="history-item">
                    <div class="history-item-info">
                        <strong>${formatMonthLabel(monthKey)}</strong>
                        <div class="history-meta">Mama: ${paymentBreakdown.counts.mom} • Papa: ${paymentBreakdown.counts.dad} • Jij: ${paymentBreakdown.counts.you}</div>
                        <div class="history-meta">Mama ${formatCurrency(paymentBreakdown.momShare)} • Papa ${formatCurrency(paymentBreakdown.dadShare)}</div>
                    </div>
                    <div class="history-payment-status">
                        ${buildPaymentStatusBadgeHtml("mom", monthKey)}
                        ${buildPaymentStatusBadgeHtml("dad", monthKey)}
                        <a class="history-payment-edit-link" href="${buildPaymentsPageUrl(monthKey)}">Bewerk &rarr;</a>
                    </div>
                </article>
            `;
        })
        .join("");
}

// A gray dot means "still owed"; green means either nothing was ever owed for that month (0
// days on the calendar) or the netto amount has actually been brought down to €0 on the
// cheques/betalingen page.
function buildPaymentStatusBadgeHtml(role, monthKey) {
    const personLabel = getRoleLabel(role, state.users);
    const isTracked = isSinglePayerRoleTrackedForMonth(state.singlePayerTracking, monthKey, role);
    const paymentBreakdown = getPaymentBreakdown(state.assignments, monthKey, state.weeklyBudget);
    const tracking = getSinglePayerTrackingForMonth(state.singlePayerTracking, monthKey)[role];
    const nettoRemaining = getSinglePayerNettoRemaining(paymentBreakdown, role, tracking);
    const isPaid = nettoRemaining <= 0;
    const detailLabel = isPaid
        ? "Volledig betaald"
        : !isTracked
            ? "Nog niet ingevuld"
            : `Nog ${formatCurrency(nettoRemaining)} netto te betalen`;

    return `
        <div class="payment-status-badge" title="${personLabel}: ${detailLabel}">
            <span class="payment-status-dot${isPaid ? " is-paid" : ""}" aria-hidden="true"></span>
            <span class="payment-status-badge-label">${personLabel}</span>
        </div>
    `;
}

function buildPaymentsPageUrl(monthKey) {
    return `cohousing-cheques.html?month=${encodeURIComponent(monthKey)}`;
}

function formatDateTime(timestampMs) {
    if (!timestampMs) {
        return "onbekend tijdstip";
    }

    return new Date(timestampMs).toLocaleDateString("nl", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit"
    });
}

// Always anchored to today's real date, not state.selectedMonthKey - otherwise browsing the
// calendar to check a different month would shift "recent months" along with it.
function getHistoryMonthOptions() {
    const referenceMonth = parseMonthKey(getMonthKey(new Date()));
    const historyMonths = [];

    for (let step = 1; step <= HISTORY_MONTH_COUNT; step += 1) {
        const previousMonthDate = addMonths(referenceMonth, -step);
        historyMonths.push(getMonthKey(previousMonthDate));
    }

    return historyMonths;
}
