const STORAGE_KEY = "cohousing-notes-state-v1";
const ACCESS_IDENTITY_STORAGE_KEY = "cohousing-access-identity";

const defaultState = {
    items: [],
    users: structuredClone(DEFAULT_USERS)
};

let state = structuredClone(defaultState);

const accessOverlay = document.querySelector("[data-access-overlay]");
const accessForm = document.querySelector("[data-access-form]");
const accessInput = document.querySelector("[data-access-input]");
const accessError = document.querySelector("[data-access-error]");
const roleStatus = document.querySelector("[data-role-status]");
const syncStatus = document.querySelector("[data-sync-status]");
const notesForm = document.querySelector("[data-notes-form]");
const notesInput = document.querySelector("[data-notes-input]");
const notesForSelect = document.querySelector("[data-notes-for-select]");
const notesList = document.querySelector("[data-notes-list]");
const EVERYONE_FOR_ROLE_VALUE = "";

let pageInitialized = false;
let loggedInIdentityRoleKey = null;

initializeAccessControl();

async function initialize() {
    if (pageInitialized) {
        return;
    }

    pageInitialized = true;
    await loadRemoteState();
    renderActiveIdentity();
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
        console.warn("Could not read saved notes state", error);
        return structuredClone(defaultState);
    }
}

function normalizeState(parsedState) {
    return {
        items: Array.isArray(parsedState.items) ? parsedState.items : [],
        users: Array.isArray(parsedState.users) && parsedState.users.length ? parsedState.users : structuredClone(DEFAULT_USERS)
    };
}

async function loadRemoteState() {
    state = loadLocalState();
    await refreshRemoteState();
}

async function refreshRemoteState() {
    try {
        const [remoteNotesData, remoteHouseholdData] = await Promise.all([
            loadNotesData(),
            loadDashboardData()
        ]);

        if (remoteHouseholdData) {
            state.users = Array.isArray(remoteHouseholdData.users) && remoteHouseholdData.users.length
                ? remoteHouseholdData.users
                : structuredClone(DEFAULT_USERS);
        }

        if (remoteNotesData) {
            state.items = Array.isArray(remoteNotesData.items) ? remoteNotesData.items : [];
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
            updateSyncStatus("Verbonden met gedeelde database");
        } else {
            updateSyncStatus("Lokaal concept gebruikt tot je opslaat");
        }
    } catch (error) {
        console.warn("Could not load shared notes", error);
        updateSyncStatus("Alleen offline concept");
    }
}

async function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    updateSyncStatus("Opslaan…");

    try {
        await saveNotesData({ items: state.items });
        await refreshRemoteState();
        updateSyncStatus("Opgeslagen in gedeelde database");
    } catch (error) {
        console.warn("Could not save notes to database", error);
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
    notesForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        await addItem(notesInput.value);
    });
}

async function addItem(rawText) {
    const text = rawText.trim();

    if (!text) {
        return;
    }

    const selectedForRoleValue = notesForSelect?.value || EVERYONE_FOR_ROLE_VALUE;

    state.items.push({
        id: generateItemId(),
        text,
        authorRole: loggedInIdentityRoleKey,
        forRole: selectedForRoleValue === EVERYONE_FOR_ROLE_VALUE ? null : normalizeRoleKey(selectedForRoleValue),
        isDone: false,
        createdAt: Date.now()
    });

    notesInput.value = "";
    if (notesForSelect) {
        notesForSelect.value = EVERYONE_FOR_ROLE_VALUE;
    }
    await saveState();
    renderNotesList();
}

async function toggleItemDone(itemId) {
    const targetItem = state.items.find((item) => item.id === itemId);
    if (!targetItem) {
        return;
    }

    targetItem.isDone = !targetItem.isDone;
    await saveState();
    renderNotesList();
}

async function removeItem(itemId) {
    state.items = state.items.filter((item) => item.id !== itemId);
    await saveState();
    renderNotesList();
}

function generateItemId() {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }

    return `item-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function renderAll() {
    renderActiveIdentity();
    renderNotesList();
}

function getReminderPageUsers() {
    return (state.users || []).filter((user) => user.showOnReminderPage !== false);
}

const EVERYONE_SWATCH_FALLBACK_COLOR = "#cccccc";

function buildEveryoneSwatchBackground() {
    const reminderPageUsers = getReminderPageUsers();

    if (!reminderPageUsers.length) {
        return EVERYONE_SWATCH_FALLBACK_COLOR;
    }

    const sliceSizePercent = 100 / reminderPageUsers.length;
    const gradientSlices = reminderPageUsers.map((user, userIndex) => {
        const sliceStartPercent = sliceSizePercent * userIndex;
        const sliceEndPercent = sliceSizePercent * (userIndex + 1);
        const userColor = user.color || EVERYONE_SWATCH_FALLBACK_COLOR;
        return `${userColor} ${sliceStartPercent}% ${sliceEndPercent}%`;
    });

    return `conic-gradient(${gradientSlices.join(", ")})`;
}

// Who you add items as is always the identity you logged in with - there's no switcher here
// (unlike the calendar page, adding a reminder "as" someone else isn't a real use case).
function renderActiveIdentity() {
    document.body.setAttribute("data-active-role", loggedInIdentityRoleKey);
    applyUserColorTheme(state.users, loggedInIdentityRoleKey);
    if (roleStatus) {
        roleStatus.textContent = `Je voegt items toe als ${getRoleLabel(loggedInIdentityRoleKey)}.`;
    }

    renderForSelectOptions(getReminderPageUsers());
}

function renderForSelectOptions(reminderPageUsers) {
    if (!notesForSelect) {
        return;
    }

    const previouslySelectedValue = notesForSelect.value;

    const optionsHtml = [`<option value="${EVERYONE_FOR_ROLE_VALUE}">Iedereen</option>`]
        .concat(
            reminderPageUsers.map((user) => {
                const roleKey = getRoleKeyFromUser(user);
                return `<option value="${roleKey}">${getRoleLabel(roleKey)}</option>`;
            })
        )
        .join("");

    notesForSelect.innerHTML = optionsHtml;

    const previousValueStillValid = Array.from(notesForSelect.options)
        .some((option) => option.value === previouslySelectedValue);
    notesForSelect.value = previousValueStillValid ? previouslySelectedValue : EVERYONE_FOR_ROLE_VALUE;
}

function getRoleLabel(roleKey) {
    const normalizedRole = normalizeRoleKey(roleKey);
    const user = (state.users || []).find((entry) => getRoleKeyFromUser(entry) === normalizedRole);
    return ROLE_LABELS[normalizedRole] || user?.name || normalizedRole;
}

function renderNotesList() {
    if (!notesList) {
        return;
    }

    if (!state.items.length) {
        notesList.innerHTML = '<p class="notes-empty-message">Nog niets om te onthouden. Voeg hierboven iets toe.</p>';
        return;
    }

    const sortedItems = [...state.items].sort((firstItem, secondItem) => firstItem.createdAt - secondItem.createdAt);
    const everyoneSwatchBackground = buildEveryoneSwatchBackground();

    notesList.innerHTML = sortedItems
        .map((item) => {
            const authorLabel = ROLE_LABELS[item.authorRole] || item.authorRole;
            const forRoleLabel = item.forRole ? (ROLE_LABELS[item.forRole] || item.forRole) : null;
            const escapedText = escapeHtml(item.text);
            const forSwatchHtml = forRoleLabel
                ? `<span class="notes-item-author-swatch is-${item.forRole}"></span>Voor ${forRoleLabel}`
                : `<span class="notes-item-author-swatch is-everyone" style="background: ${everyoneSwatchBackground};"></span>Voor iedereen`;
            return `
                <article class="notes-item is-${item.authorRole}${item.isDone ? " is-done" : ""}">
                    <input
                        type="checkbox"
                        class="notes-item-checkbox"
                        data-notes-toggle="${item.id}"
                        ${item.isDone ? "checked" : ""}
                        aria-label="Markeer '${escapedText}' als afgehandeld"
                    >
                    <div class="notes-item-body">
                        <p class="notes-item-text">${escapedText}</p>
                        <div class="notes-item-meta-row">
                            <span class="notes-item-meta">
                                <span class="notes-item-author-swatch is-${item.authorRole}"></span>Toegevoegd door ${authorLabel}
                            </span>
                            <span class="notes-item-meta">
                                ${forSwatchHtml}
                            </span>
                        </div>
                    </div>
                    <button
                        type="button"
                        class="notes-item-remove-button"
                        data-notes-remove="${item.id}"
                        aria-label="Verwijder '${escapedText}'"
                    >&times;</button>
                </article>
            `;
        })
        .join("");

    notesList.querySelectorAll("[data-notes-toggle]").forEach((checkbox) => {
        checkbox.addEventListener("change", () => {
            void toggleItemDone(checkbox.getAttribute("data-notes-toggle"));
        });
    });

    notesList.querySelectorAll("[data-notes-remove]").forEach((button) => {
        button.addEventListener("click", () => {
            void removeItem(button.getAttribute("data-notes-remove"));
        });
    });
}

function escapeHtml(rawText) {
    return String(rawText)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}
