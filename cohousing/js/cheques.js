const STORAGE_KEY = "cohousing-cheques-state-v2";
const ACCESS_IDENTITY_STORAGE_KEY = "cohousing-access-identity";
const MONTH_QUERY_PARAM_PATTERN = /^\d{4}-\d{2}$/;
const PAYMENT_TYPE_LABELS = { maaltijd: "Maaltijdcheque", netto: "Netto" };

const defaultState = {
    selectedMonthKey: getMonthKey(new Date()),
    weeklyBudget: DEFAULT_WEEKLY_BUDGET,
    assignments: {},
    assignmentMeta: {},
    users: structuredClone(DEFAULT_USERS),
    paymentRecords: {}
};

let state = structuredClone(defaultState);

// Which payment type is currently selected in each person's "add a record" form - not part of
// the saved state, just the in-progress form choice.
const selectedFormType = { mom: "maaltijd", dad: "netto" };

const monthSelect = document.querySelector("[data-month-select]");
const accessOverlay = document.querySelector("[data-access-overlay]");
const accessForm = document.querySelector("[data-access-form]");
const accessInput = document.querySelector("[data-access-input]");
const accessError = document.querySelector("[data-access-error]");
const roleStatus = document.querySelector("[data-role-status]");
const syncStatus = document.querySelector("[data-sync-status]");
const paymentCardList = document.querySelector("[data-payment-card-list]");

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
        paymentRecords: parsedState.paymentRecords || {}
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
        const payload = buildRemotePayload(state.assignments, state.users, state.assignmentMeta, state.weeklyBudget, state.paymentRecords);
        await saveDashboardData(payload);
        await refreshRemoteState();
        updateSyncStatus("Opgeslagen in gedeelde database");
    } catch (error) {
        console.warn("Could not save payment record", error);
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
        renderPaymentCards();
    });
}

function renderAll() {
    renderActiveIdentity();
    renderMonthSelector();
    renderPaymentCards();
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

function renderPaymentCards() {
    const monthKey = state.selectedMonthKey;
    const paymentBreakdown = getPaymentBreakdown(state.assignments, monthKey, state.weeklyBudget);

    if (!paymentBreakdown.totalPaidDays) {
        paymentCardList.innerHTML = `
            <p class="payment-empty-message">
                Voor ${formatMonthLabel(monthKey)} staan er nog geen dagen bij Mama of Papa op de kalender.
                Vul dit eerst in op de kalenderpagina.
            </p>
        `;
        return;
    }

    paymentCardList.innerHTML =
        buildPersonPaymentCardHtml("mom", monthKey, paymentBreakdown) +
        buildPersonPaymentCardHtml("dad", monthKey, paymentBreakdown);

    bindPaymentCardEvents();
}

function buildPersonPaymentCardHtml(role, monthKey, paymentBreakdown) {
    const personLabel = role === "mom" ? "Mama" : "Papa";
    const dayCount = paymentBreakdown.counts[role];
    const amountOwed = role === "mom" ? paymentBreakdown.momShare : paymentBreakdown.dadShare;
    const { records, chequesPaid, nettoPaid, totalPaid } = getPaymentTotalsForRole(state.paymentRecords, monthKey, role);
    const carriedCredit = getCarriedCreditForRole(state.assignments, state.weeklyBudget, state.paymentRecords, monthKey, role);
    const amountOwedAfterCredit = roundToCents(Math.max(amountOwed - carriedCredit, 0));
    const remaining = getPaymentRemainingForRole(paymentBreakdown, state.paymentRecords, monthKey, role, carriedCredit);
    const surplusForNextMonth = roundToCents(Math.max(totalPaid - amountOwedAfterCredit, 0));
    const paymentStatus = getPaymentStatusForRole(paymentBreakdown, state.paymentRecords, monthKey, role, carriedCredit);
    const availableTypes = PAYMENT_TYPES_BY_ROLE[role];
    const dadCannotUseChequesHint = role === "dad" ? " Papa kan geen cheques gebruiken, dus dit is altijd netto." : "";

    return `
        <article class="payment-person-card is-${role}" data-payment-card data-role="${role}">
            <h3>${personLabel}</h3>
            <span class="payment-status-badge is-${paymentStatus}">${PAYMENT_STATUS_LABELS[paymentStatus]}</span>
            <p class="payment-owed-hint">
                Volgens de kalender heeft ${role === "mom" ? "ze" : "hij"} recht op ${formatCurrency(amountOwed)} voor ${formatMonthLabel(monthKey)}
                (${dayCount} dag${dayCount === 1 ? "" : "en"}).${dadCannotUseChequesHint}
            </p>
            ${carriedCredit > 0 ? `<p class="payment-carry-note">Vooruitbetaald van vorige maand: <strong>${formatCurrency(carriedCredit)}</strong> (al verrekend met deze maand)</p>` : ""}

            <div class="payment-totals">
                ${availableTypes.includes("maaltijd") ? `<p class="payment-totals-line">Cheques betaald: <strong>${formatCurrency(chequesPaid)}</strong></p>` : ""}
                <p class="payment-totals-line">Netto betaald: <strong>${formatCurrency(nettoPaid)}</strong></p>
                <p class="payment-totals-line payment-totals-line--remaining${remaining > 0 ? " is-outstanding" : ""}">
                    Nog te betalen: <strong>${formatCurrency(remaining)}</strong>
                </p>
                ${surplusForNextMonth > 0 ? `<p class="payment-totals-line payment-totals-line--surplus">Extra betaald: <strong>${formatCurrency(surplusForNextMonth)}</strong> (telt automatisch mee voor volgende maand)</p>` : ""}
            </div>

            ${buildPaymentRecordFormHtml(role, availableTypes)}
            ${buildPaymentHistoryHtml(role, records)}
        </article>
    `;
}

function buildPaymentRecordFormHtml(role, availableTypes) {
    const activeType = availableTypes.includes(selectedFormType[role]) ? selectedFormType[role] : availableTypes[0];
    selectedFormType[role] = activeType;

    const typeToggleHtml = availableTypes.length > 1
        ? `
            <div class="payment-type-toggle" role="tablist" aria-label="Kies het type betaling">
                ${availableTypes
                    .map(
                        (type) => `
                            <button type="button" class="payment-type-toggle-button${type === activeType ? " is-active" : ""}"
                                data-payment-type-button data-role="${role}" data-type="${type}" role="tab" aria-selected="${type === activeType}">
                                ${PAYMENT_TYPE_LABELS[type]}
                            </button>
                        `
                    )
                    .join("")}
            </div>
        `
        : `<p class="payment-type-fixed-label">${PAYMENT_TYPE_LABELS[activeType]}</p>`;

    return `
        <form class="payment-record-form" data-payment-record-form data-role="${role}">
            ${typeToggleHtml}
            <div class="payment-record-form-fields">
                <label class="payment-amount-field" for="payment-amount-${role}">
                    <span>Bedrag</span>
                    <div class="payment-amount-input-wrap">
                        <span aria-hidden="true">&euro;</span>
                        <input id="payment-amount-${role}" type="number" min="0" step="0.01" inputmode="decimal" placeholder="0,00" data-payment-amount-input required>
                    </div>
                </label>
                <label class="payment-description-field" for="payment-description-${role}">
                    <span>Omschrijving</span>
                    <input id="payment-description-${role}" type="text" placeholder="Bijv. boodschappen 12 maart" data-payment-description-input required>
                </label>
                <button type="submit" class="payment-add-button">Toevoegen</button>
            </div>
        </form>
    `;
}

function buildPaymentHistoryHtml(role, records) {
    if (!records.length) {
        return `<p class="payment-history-empty">Nog geen betalingen ingevoerd deze maand.</p>`;
    }

    return `
        <ul class="payment-history-list">
            ${records
                .map(
                    (record) => `
                        <li class="payment-history-item">
                            <span class="payment-history-item-badge is-${record.type}">${PAYMENT_TYPE_LABELS[record.type]}</span>
                            <span class="payment-history-item-amount">${formatCurrency(record.amount)}</span>
                            <span class="payment-history-item-description">${escapeHtml(record.description)}</span>
                            <button type="button" class="payment-history-delete-button" data-payment-delete-button data-role="${role}" data-record-id="${record.id}" aria-label="Verwijder deze betaling">&times;</button>
                        </li>
                    `
                )
                .join("")}
        </ul>
    `;
}

function escapeHtml(value) {
    const div = document.createElement("div");
    div.textContent = value || "";
    return div.innerHTML;
}

function bindPaymentCardEvents() {
    paymentCardList.querySelectorAll("[data-payment-type-button]").forEach((button) => {
        button.addEventListener("click", () => {
            const role = button.getAttribute("data-role");
            selectedFormType[role] = button.getAttribute("data-type");
            renderPaymentCards();
        });
    });

    paymentCardList.querySelectorAll("[data-payment-record-form]").forEach((form) => {
        form.addEventListener("submit", async (event) => {
            event.preventDefault();
            const role = form.getAttribute("data-role");
            const amountInput = form.querySelector("[data-payment-amount-input]");
            const descriptionInput = form.querySelector("[data-payment-description-input]");
            const amount = roundToCents(amountInput.value);

            if (!amount || !descriptionInput.value.trim()) {
                return;
            }

            await addPaymentRecord(role, selectedFormType[role], amount, descriptionInput.value.trim());
            renderPaymentCards();
        });
    });

    paymentCardList.querySelectorAll("[data-payment-delete-button]").forEach((button) => {
        button.addEventListener("click", async () => {
            await deletePaymentRecord(button.getAttribute("data-role"), button.getAttribute("data-record-id"));
            renderPaymentCards();
        });
    });
}

async function addPaymentRecord(role, type, amount, description) {
    const monthKey = state.selectedMonthKey;

    if (!state.paymentRecords[monthKey]) {
        state.paymentRecords[monthKey] = {};
    }
    if (!Array.isArray(state.paymentRecords[monthKey][role])) {
        state.paymentRecords[monthKey][role] = [];
    }

    state.paymentRecords[monthKey][role].push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        type,
        amount,
        description,
        createdAt: Date.now()
    });

    await saveState();
}

async function deletePaymentRecord(role, recordId) {
    const monthKey = state.selectedMonthKey;
    const records = state.paymentRecords?.[monthKey]?.[role];

    if (!Array.isArray(records)) {
        return;
    }

    state.paymentRecords[monthKey][role] = records.filter((record) => record.id !== recordId);
    await saveState();
}
