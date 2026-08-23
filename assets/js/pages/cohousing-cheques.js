const STORAGE_KEY = "cohousing-cheques-state-v1";
const ACCESS_IDENTITY_STORAGE_KEY = "cohousing-access-identity";
const MODE_TAB_STORAGE_KEY = "cohousing-cheques-active-mode-tab";
const DEFAULT_MODE_TAB = "single-payer";
const MONTH_QUERY_PARAM_PATTERN = /^\d{4}-\d{2}$/;

const defaultState = {
    selectedMonthKey: getMonthKey(new Date()),
    weeklyBudget: DEFAULT_WEEKLY_BUDGET,
    assignments: {},
    assignmentMeta: {},
    users: structuredClone(DEFAULT_USERS),
    monthlyChequesAmounts: {},
    singlePayerTracking: {}
};

let state = structuredClone(defaultState);
let activeModeTab = localStorage.getItem(MODE_TAB_STORAGE_KEY) || DEFAULT_MODE_TAB;

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
const modeTabButtons = document.querySelectorAll("[data-mode-tab]");
const modeTabPanels = document.querySelectorAll("[data-mode-panel]");
const singlePayerCardList = document.querySelector("[data-single-payer-card-list]");

let pageInitialized = false;
let loggedInIdentityRoleKey = null;

initializeAccessControl();

async function initialize() {
    if (pageInitialized) {
        return;
    }

    pageInitialized = true;
    await loadRemoteState();
    applyMonthFromQueryParam();
    bindEvents();
    renderAll();
}

// Lets the "Bewerk →" link on the calendar's history section jump straight to the right month.
function applyMonthFromQueryParam() {
    const monthParam = new URLSearchParams(window.location.search).get("month");
    if (monthParam && MONTH_QUERY_PARAM_PATTERN.test(monthParam)) {
        state.selectedMonthKey = monthParam;
        persistLocalState();
    }
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
        weeklyBudget: Number.isFinite(Number(parsedState.weeklyBudget))
            ? Number(parsedState.weeklyBudget)
            : DEFAULT_WEEKLY_BUDGET,
        assignments: parsedState.assignments || {},
        assignmentMeta: parsedState.assignmentMeta || {},
        users: Array.isArray(parsedState.users) && parsedState.users.length ? parsedState.users : structuredClone(DEFAULT_USERS),
        monthlyChequesAmounts: parsedState.monthlyChequesAmounts || {},
        singlePayerTracking: parsedState.singlePayerTracking || {}
    };
}

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

// assignments/users/weeklyBudget are only ever read here and passed straight back through
// unchanged, since saveDashboardData() overwrites the whole shared record - dropping any of
// them from the payload would silently wipe that data for the calendar page.
async function saveState() {
    persistLocalState();
    updateSyncStatus("Opslaan…");

    try {
        const payload = buildRemotePayload(state.assignments, state.users, state.assignmentMeta, state.weeklyBudget, state.monthlyChequesAmounts, state.singlePayerTracking);
        await saveDashboardData(payload);
        await refreshRemoteState();
        updateSyncStatus("Opgeslagen in gedeelde database");
    } catch (error) {
        console.warn("Could not save cheques amount", error);
        updateSyncStatus("Lokaal opgeslagen, synchronisatie in behandeling");
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
        renderSinglePayerCards();
        renderChequesShare();
    });

    chequesAmountInput.addEventListener("input", () => {
        state.monthlyChequesAmounts[state.selectedMonthKey] = Number(chequesAmountInput.value) || 0;
        persistLocalState();
        renderSinglePayerCards();
        renderChequesShare();
    });

    chequesAmountInput.addEventListener("change", async () => {
        await saveState();
    });

    modeTabButtons.forEach((button) => {
        button.addEventListener("click", () => {
            activeModeTab = button.getAttribute("data-mode-tab");
            localStorage.setItem(MODE_TAB_STORAGE_KEY, activeModeTab);
            renderModeTabs();
        });
    });
}

function renderAll() {
    renderActiveIdentity();
    renderMonthSelector();
    renderModeTabs();
    renderSinglePayerCards();
    renderChequesShare();
}

function renderModeTabs() {
    modeTabButtons.forEach((button) => {
        const isActive = button.getAttribute("data-mode-tab") === activeModeTab;
        button.classList.toggle("is-active", isActive);
        button.setAttribute("aria-selected", isActive ? "true" : "false");
    });

    modeTabPanels.forEach((panel) => {
        panel.classList.toggle("is-hidden", panel.getAttribute("data-mode-panel") !== activeModeTab);
    });
}

function renderActiveIdentity() {
    document.body.setAttribute("data-active-role", loggedInIdentityRoleKey);
    applyUserColorTheme(state.users, loggedInIdentityRoleKey);
    if (roleStatus) {
        roleStatus.textContent = `Ingelogd als ${getRoleLabel(loggedInIdentityRoleKey, state.users)}.`;
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
    const paymentBreakdown = getPaymentBreakdown(state.assignments, monthKey, state.weeklyBudget);
    const monthlyChequesAmount = getMonthlyChequesAmount(state.monthlyChequesAmounts, monthKey);

    if (chequesAmountInput && document.activeElement !== chequesAmountInput) {
        chequesAmountInput.value = monthlyChequesAmount;
    }

    if (!paymentBreakdown.totalPaidDays) {
        chequesShareList.innerHTML = `
            <p class="cheques-empty-message">
                Voor ${formatMonthLabel(monthKey)} staan er nog geen dagen bij Mama of Papa op de kalender.
                Vul dit eerst in op de kalenderpagina.
            </p>
        `;
        chequesExplainerText.textContent = "";
        return;
    }

    const momBreakdown = getChequesShareForRole(paymentBreakdown, monthlyChequesAmount, "mom");
    const dadBreakdown = getChequesShareForRole(paymentBreakdown, monthlyChequesAmount, "dad");

    chequesShareList.innerHTML = [momBreakdown, dadBreakdown].map(buildChequesShareCardHtml).join("");

    const totalAmountOwed = momBreakdown.amountOwed + dadBreakdown.amountOwed;
    const totalRemaining = Math.max(totalAmountOwed - monthlyChequesAmount, 0);

    chequesExplainerText.textContent =
        `Van de ${formatCurrency(monthlyChequesAmount)} aan cheques voor ${formatMonthLabel(monthKey)} was je ${paymentBreakdown.counts.mom} dag${paymentBreakdown.counts.mom === 1 ? "" : "en"} bij Mama ` +
        `en ${paymentBreakdown.counts.dad} dag${paymentBreakdown.counts.dad === 1 ? "" : "en"} bij Papa, dus wordt het zo verdeeld. In totaal is er ${formatCurrency(totalAmountOwed)} verschuldigd op basis ` +
        `van het wekelijks budget${totalRemaining > 0 ? `, dus blijft er ${formatCurrency(totalRemaining)} over om buiten de cheques te betalen.` : ", en de cheques dekken dit volledig."}`;
}

function renderSinglePayerCards() {
    const monthKey = state.selectedMonthKey;
    const paymentBreakdown = getPaymentBreakdown(state.assignments, monthKey, state.weeklyBudget);
    const monthlyChequesAmount = getMonthlyChequesAmount(state.monthlyChequesAmounts, monthKey);
    const tracking = getSinglePayerTrackingForMonth(state.singlePayerTracking, monthKey);
    const isMomTracked = isSinglePayerRoleTrackedForMonth(state.singlePayerTracking, monthKey, "mom");
    const isDadTracked = isSinglePayerRoleTrackedForMonth(state.singlePayerTracking, monthKey, "dad");

    singlePayerCardList.innerHTML =
        buildMomSinglePayerCardHtml(monthKey, paymentBreakdown, monthlyChequesAmount, tracking.mom, isMomTracked) +
        buildDadSinglePayerCardHtml(monthKey, paymentBreakdown, tracking.dad, isDadTracked);

    bindSinglePayerInputEvents();
}

function buildMomSinglePayerCardHtml(monthKey, paymentBreakdown, monthlyChequesAmount, momTracking, isMomTracked) {
    const dayCount = paymentBreakdown.counts.mom;
    const chequesLeft = roundToCents(Math.max(monthlyChequesAmount - momTracking.chequesUsed, 0));
    const nettoRemaining = getSinglePayerNettoRemaining(paymentBreakdown, "mom", momTracking);
    const paymentStatus = getSinglePayerPaymentStatus(paymentBreakdown, "mom", momTracking, isMomTracked);

    return `
        <article class="single-payer-card is-mom">
            <h3>Mama</h3>
            <span class="single-payer-status-badge is-${paymentStatus}">${PAYMENT_STATUS_LABELS[paymentStatus]}</span>
            <p class="single-payer-owed-hint">
                Volgens de kalender heeft ze recht op ${formatCurrency(paymentBreakdown.momShare)} voor ${formatMonthLabel(monthKey)}
                (${dayCount} dag${dayCount === 1 ? "" : "en"}).
            </p>
            ${buildSinglePayerFieldHtml("mom", "chequesUsed", "Cheques al gebruikt", momTracking.chequesUsed, {
                markPaidLabel: "Volledig gebruikt",
                markPaidValue: roundToCents(Math.min(monthlyChequesAmount, paymentBreakdown.momShare))
            })}
            <p class="single-payer-computed-stat">Cheques nog te gebruiken: <strong>${formatCurrency(chequesLeft)}</strong></p>
            ${buildSinglePayerFieldHtml("mom", "nettoPaid", "Netto al betaald", momTracking.nettoPaid, {
                markPaidLabel: "Volledig betaald",
                markPaidValue: roundToCents(momTracking.nettoPaid + nettoRemaining),
                isEmphasized: true
            })}
            <p class="single-payer-computed-stat single-payer-computed-stat--netto">Netto nog te betalen: <strong>${formatCurrency(nettoRemaining)}</strong></p>
        </article>
    `;
}

function buildDadSinglePayerCardHtml(monthKey, paymentBreakdown, dadTracking, isDadTracked) {
    const dayCount = paymentBreakdown.counts.dad;
    const nettoRemaining = getSinglePayerNettoRemaining(paymentBreakdown, "dad", dadTracking);
    const paymentStatus = getSinglePayerPaymentStatus(paymentBreakdown, "dad", dadTracking, isDadTracked);

    return `
        <article class="single-payer-card is-dad">
            <h3>Papa</h3>
            <span class="single-payer-status-badge is-${paymentStatus}">${PAYMENT_STATUS_LABELS[paymentStatus]}</span>
            <p class="single-payer-owed-hint">
                Volgens de kalender heeft hij recht op ${formatCurrency(paymentBreakdown.dadShare)} voor ${formatMonthLabel(monthKey)}
                (${dayCount} dag${dayCount === 1 ? "" : "en"}). Papa kan geen cheques gebruiken, dus dit is volledig netto.
            </p>
            ${buildSinglePayerFieldHtml("dad", "nettoPaid", "Netto al betaald", dadTracking.nettoPaid, {
                markPaidLabel: "Volledig betaald",
                markPaidValue: roundToCents(dadTracking.nettoPaid + nettoRemaining),
                isEmphasized: true
            })}
            <p class="single-payer-computed-stat single-payer-computed-stat--netto">Netto nog te betalen: <strong>${formatCurrency(nettoRemaining)}</strong></p>
        </article>
    `;
}

// Shows the running total as read-only and lets the user enter just the amount of a new payment
// (added to the running total on submit) - so nobody has to add up past payments by hand before
// typing in a new grand total. A negative amount can be entered to correct a mistake.
function buildSinglePayerFieldHtml(role, field, label, currentTotal, options = {}) {
    const { markPaidLabel, markPaidValue, isEmphasized = false } = options;

    return `
        <div class="single-payer-field${isEmphasized ? " single-payer-field--netto" : ""}">
            <p class="single-payer-field-total-row">
                <span>${label}</span>
                <span class="single-payer-field-total-value">${formatCurrency(currentTotal)}</span>
            </p>
            <p class="single-payer-add-payment-caption">Bedrag toevoegen</p>
            <div class="single-payer-field-input-wrap">
                <span aria-hidden="true">&euro;</span>
                <button type="button" class="single-payer-sign-toggle" data-single-payer-sign-toggle data-role="${role}" data-field="${field}" data-sign="1" aria-pressed="false" aria-label="Wissel naar aftrekken (voor het corrigeren van een fout)">+</button>
                <input type="number" step="1" inputmode="numeric" placeholder="0" aria-label="Bedrag toevoegen aan ${label.toLowerCase()}" data-single-payer-add-input data-role="${role}" data-field="${field}">
                <button type="button" class="single-payer-add-button" data-single-payer-add-button data-role="${role}" data-field="${field}">Toevoegen</button>
            </div>
            ${markPaidLabel
                ? `<button type="button" class="single-payer-mark-paid-button" data-single-payer-mark-paid data-role="${role}" data-field="${field}" data-value="${markPaidValue}">${markPaidLabel}</button>`
                : ""}
        </div>
    `;
}

function bindSinglePayerInputEvents() {
    singlePayerCardList.querySelectorAll("[data-single-payer-add-button]").forEach((button) => {
        button.addEventListener("click", async () => {
            await addSinglePayerPayment(button.getAttribute("data-role"), button.getAttribute("data-field"));
        });
    });

    // Mobile number keypads generally don't offer a "-" key, so typing a negative
    // correction amount (see comment on buildSinglePayerFieldHtml) isn't possible
    // there. This toggle lets any device switch the add-input to subtract instead.
    singlePayerCardList.querySelectorAll("[data-single-payer-sign-toggle]").forEach((toggleButton) => {
        toggleButton.addEventListener("click", () => {
            const isNowNegative = toggleButton.getAttribute("data-sign") !== "-1";
            toggleButton.setAttribute("data-sign", isNowNegative ? "-1" : "1");
            toggleButton.setAttribute("aria-pressed", String(isNowNegative));
            toggleButton.textContent = isNowNegative ? "−" : "+";
            toggleButton.classList.toggle("is-negative", isNowNegative);
        });
    });

    singlePayerCardList.querySelectorAll("[data-single-payer-add-input]").forEach((input) => {
        input.addEventListener("keydown", async (event) => {
            if (event.key !== "Enter") {
                return;
            }

            event.preventDefault();
            await addSinglePayerPayment(input.getAttribute("data-role"), input.getAttribute("data-field"));
        });
    });

    singlePayerCardList.querySelectorAll("[data-single-payer-mark-paid]").forEach((button) => {
        button.addEventListener("click", async () => {
            await updateSinglePayerField(button.getAttribute("data-role"), button.getAttribute("data-field"), Number(button.getAttribute("data-value")) || 0);
            renderSinglePayerCards();
        });
    });
}

async function addSinglePayerPayment(role, field) {
    const input = singlePayerCardList.querySelector(`[data-single-payer-add-input][data-role="${role}"][data-field="${field}"]`);
    const signToggle = singlePayerCardList.querySelector(`[data-single-payer-sign-toggle][data-role="${role}"][data-field="${field}"]`);
    const sign = signToggle?.getAttribute("data-sign") === "-1" ? -1 : 1;
    const addedAmount = (Math.abs(Number(input?.value)) || 0) * sign;

    if (!addedAmount) {
        return;
    }

    const monthKey = state.selectedMonthKey;
    const currentTotal = getSinglePayerTrackingForMonth(state.singlePayerTracking, monthKey)[role]?.[field] || 0;

    await updateSinglePayerField(role, field, currentTotal + addedAmount);
    renderSinglePayerCards();
}

async function updateSinglePayerField(role, field, value) {
    const monthKey = state.selectedMonthKey;

    if (!state.singlePayerTracking[monthKey]) {
        state.singlePayerTracking[monthKey] = {};
    }
    if (!state.singlePayerTracking[monthKey][role]) {
        state.singlePayerTracking[monthKey][role] = {};
    }

    state.singlePayerTracking[monthKey][role][field] = roundToCents(value);
    await saveState();
}

function buildChequesShareCardHtml(entry) {
    const personLabel = entry.role === "mom" ? "Mama" : "Papa";

    return `
        <article class="cheques-share-card is-${entry.role}">
            <p class="cheques-share-name">${personLabel} krijgt</p>
            <p class="cheques-share-amount">${formatCurrency(entry.chequesShare)}</p>
            <p class="cheques-share-days">${entry.days} dag${entry.days === 1 ? "" : "en"} bij ${personLabel}</p>
            <div class="cheques-coverage-bar" role="img" aria-label="${entry.coveragePercentage}% van het verschuldigde bedrag gedekt door de cheques">
                <div class="cheques-coverage-bar-fill" style="width: ${entry.coveragePercentage}%"></div>
            </div>
            <p class="cheques-coverage-label">${entry.coveragePercentage}% gedekt door cheques</p>
            <p class="cheques-remaining-amount${entry.remaining > 0 ? " is-outstanding" : ""}">
                ${entry.remaining > 0 ? `Nog ${formatCurrency(entry.remaining)} te betalen buiten de cheques` : "Volledig gedekt door de cheques"}
            </p>
        </article>
    `;
}
