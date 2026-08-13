const STORAGE_KEY = "cohousing-cheques-state-v1";
const ACCESS_IDENTITY_STORAGE_KEY = "cohousing-access-identity";
const MONTHS_TO_DISPLAY = 12;
const MONTHS_BEFORE_CURRENT = Math.floor(MONTHS_TO_DISPLAY / 2);
const DEFAULT_MONTHLY_CHEQUES_AMOUNT = 200;

const defaultState = {
    selectedMonthKey: getMonthKey(new Date()),
    monthlyChequesAmount: DEFAULT_MONTHLY_CHEQUES_AMOUNT,
    assignments: {},
    assignmentMeta: {},
    users: structuredClone(DEFAULT_USERS)
};

let state = structuredClone(defaultState);

const monthSelect = document.querySelector("[data-month-select]");
const accessOverlay = document.querySelector("[data-access-overlay]");
const accessForm = document.querySelector("[data-access-form]");
const accessInput = document.querySelector("[data-access-input]");
const accessError = document.querySelector("[data-access-error]");
const roleStatus = document.querySelector("[data-role-status]");
const syncStatus = document.querySelector("[data-sync-status]");
const chequesAmountInput = document.querySelector("[data-cheques-amount-input]");
const chequesShareList = document.querySelector("[data-cheques-share-list]");
const chequesExplainerText = document.querySelector("[data-cheques-explainer]");

let pageInitialized = false;
let loggedInIdentityRoleKey = null;

initializeAccessControl();

async function initialize() {
    if (pageInitialized) {
        return;
    }

    pageInitialized = true;
    await loadRemoteState();
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
        console.warn("Could not read saved cheques state", error);
        return structuredClone(defaultState);
    }
}

function normalizeState(parsedState) {
    return {
        selectedMonthKey: parsedState.selectedMonthKey || defaultState.selectedMonthKey,
        monthlyChequesAmount: Number.isFinite(Number(parsedState.monthlyChequesAmount))
            ? Number(parsedState.monthlyChequesAmount)
            : DEFAULT_MONTHLY_CHEQUES_AMOUNT,
        assignments: parsedState.assignments || {},
        assignmentMeta: parsedState.assignmentMeta || {},
        users: Array.isArray(parsedState.users) && parsedState.users.length ? parsedState.users : structuredClone(DEFAULT_USERS)
    };
}

// This page only ever reads the shared calendar - it never writes assignments back, so there's
// no saveDashboardData() call here (unlike cohousing.js). Only the local cheques amount is
// remembered, and only on this device, same as the weekly budget field on the calendar page.
async function loadRemoteState() {
    state = loadLocalState();
    await refreshRemoteState();
}

async function refreshRemoteState() {
    try {
        const remoteData = await loadDashboardData();
        if (remoteData) {
            state = hydrateStateFromRemoteData(remoteData, state);
            persistLocalState();
            updateSyncStatus("Verbonden met gedeelde database");
        } else {
            updateSyncStatus("Lokaal concept gebruikt");
        }
    } catch (error) {
        console.warn("Could not load shared data", error);
        updateSyncStatus("Kan de kalender niet ophalen, controleer je internetverbinding");
    }
}

function persistLocalState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
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

function bindEvents() {
    monthSelect.addEventListener("change", () => {
        state.selectedMonthKey = monthSelect.value;
        persistLocalState();
        renderChequesShare();
    });

    chequesAmountInput.addEventListener("input", () => {
        state.monthlyChequesAmount = Number(chequesAmountInput.value) || 0;
        persistLocalState();
        renderChequesShare();
    });
}

function renderAll() {
    renderActiveIdentity();
    renderMonthSelector();
    renderChequesShare();
}

function renderActiveIdentity() {
    document.body.setAttribute("data-active-role", loggedInIdentityRoleKey);
    applyUserColorTheme(state.users, loggedInIdentityRoleKey);
    if (roleStatus) {
        roleStatus.textContent = `Ingelogd als ${getRoleLabel(loggedInIdentityRoleKey)}.`;
    }
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

function renderChequesShare() {
    const monthKey = state.selectedMonthKey;
    const counts = countAssignmentsForMonth(monthKey);
    const totalPaidDays = counts.mom + counts.dad;
    const monthlyChequesAmount = Number(state.monthlyChequesAmount) || 0;

    if (chequesAmountInput && document.activeElement !== chequesAmountInput) {
        chequesAmountInput.value = monthlyChequesAmount;
    }

    if (!totalPaidDays) {
        chequesShareList.innerHTML = `
            <p class="cheques-empty-message">
                Voor ${formatMonthLabel(monthKey)} staan er nog geen dagen bij Mama of Papa op de kalender.
                Vul dit eerst in op de kalenderpagina.
            </p>
        `;
        chequesExplainerText.textContent = "";
        return;
    }

    const momShare = monthlyChequesAmount * (counts.mom / totalPaidDays);
    const dadShare = monthlyChequesAmount * (counts.dad / totalPaidDays);

    const shareCards = [
        { role: "mom", label: "Mama krijgt", days: counts.mom, amount: momShare },
        { role: "dad", label: "Papa krijgt", days: counts.dad, amount: dadShare }
    ];

    chequesShareList.innerHTML = shareCards
        .map(
            (entry) => `
                <article class="cheques-share-card is-${entry.role}">
                    <p class="cheques-share-name">${entry.label}</p>
                    <p class="cheques-share-amount">${formatCurrency(entry.amount)}</p>
                    <p class="cheques-share-days">${entry.days} dag${entry.days === 1 ? "" : "en"} bij ${entry.role === "mom" ? "Mama" : "Papa"}</p>
                </article>
            `
        )
        .join("");

    chequesExplainerText.textContent =
        `Van de ${formatCurrency(monthlyChequesAmount)} aan cheques voor ${formatMonthLabel(monthKey)} was je ${counts.mom} dag${counts.mom === 1 ? "" : "en"} bij Mama ` +
        `en ${counts.dad} dag${counts.dad === 1 ? "" : "en"} bij Papa, dus wordt het zo verdeeld.`;
}

function countAssignmentsForMonth(monthKey) {
    const monthAssignments = state.assignments[monthKey] || {};
    const counts = { you: 0, mom: 0, dad: 0 };

    Object.values(monthAssignments).forEach((assignment) => {
        if (counts[assignment] !== undefined) {
            counts[assignment] += 1;
        }
    });

    return counts;
}

function getRoleLabel(roleKey) {
    const normalizedRole = normalizeRoleKey(roleKey);
    const user = (state.users || []).find((entry) => getRoleKeyFromUser(entry) === normalizedRole);
    return ROLE_LABELS[normalizedRole] || user?.name || normalizedRole;
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
    return monthDate.toLocaleDateString("nl", { month: "long", year: "numeric" });
}

function formatCurrency(value) {
    return `€${Number(value || 0).toFixed(2)}`;
}
