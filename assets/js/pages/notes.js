const STORAGE_KEY = "cohousing-notes-state-v1";
const ACCESS_IDENTITY_STORAGE_KEY = "cohousing-access-identity";

const defaultState = {
    activeRole: "you",
    items: [],
    users: structuredClone(DEFAULT_USERS)
};

let state = structuredClone(defaultState);

const roleSwitcher = document.querySelector("[data-role-switcher]");
const accessOverlay = document.querySelector("[data-access-overlay]");
const accessForm = document.querySelector("[data-access-form]");
const accessInput = document.querySelector("[data-access-input]");
const accessError = document.querySelector("[data-access-error]");
const roleStatus = document.querySelector("[data-role-status]");
const syncStatus = document.querySelector("[data-sync-status]");
const notesForm = document.querySelector("[data-notes-form]");
const notesInput = document.querySelector("[data-notes-input]");
const notesList = document.querySelector("[data-notes-list]");

let pageInitialized = false;
let loggedInIdentityRoleKey = null;

initializeAccessControl();

async function initialize() {
    if (pageInitialized) {
        return;
    }

    pageInitialized = true;
    await loadRemoteState();
    renderRoleButtons();
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
        activeRole: normalizeRoleKey(parsedState.activeRole || defaultState.activeRole),
        items: Array.isArray(parsedState.items) ? parsedState.items : [],
        users: Array.isArray(parsedState.users) && parsedState.users.length ? parsedState.users : structuredClone(DEFAULT_USERS)
    };
}

async function loadRemoteState() {
    state = loadLocalState();

    if (loggedInIdentityRoleKey) {
        state.activeRole = loggedInIdentityRoleKey;
    }

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

    state.items.push({
        id: generateItemId(),
        text,
        authorRole: state.activeRole,
        isDone: false,
        createdAt: Date.now()
    });

    notesInput.value = "";
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
    renderRoleButtons();
    renderNotesList();
}

function renderRoleButtons() {
    if (!roleSwitcher) {
        return;
    }

    const reminderPageUsers = (state.users || []).filter((user) => user.showOnReminderPage !== false);

    roleSwitcher.innerHTML = reminderPageUsers
        .map((user) => {
            const roleKey = getRoleKeyFromUser(user);
            const isActive = roleKey === state.activeRole;
            const label = getRoleLabel(roleKey);
            return `<button class="role-button${isActive ? " is-active" : ""}" type="button" data-role-option="${roleKey}">${label}</button>`;
        })
        .join("");

    const buttons = roleSwitcher.querySelectorAll("[data-role-option]");
    buttons.forEach((button) => {
        button.addEventListener("click", async () => {
            state.activeRole = button.getAttribute("data-role-option");
            await saveState();
            renderRoleButtons();
        });
    });

    document.body.setAttribute("data-active-role", state.activeRole);
    applyUserColorTheme(state.users, state.activeRole);
    if (roleStatus) {
        roleStatus.textContent = `Je voegt items toe als ${getRoleLabel(state.activeRole)}.`;
    }
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

    notesList.innerHTML = sortedItems
        .map((item) => {
            const authorLabel = ROLE_LABELS[item.authorRole] || item.authorRole;
            const escapedText = escapeHtml(item.text);
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
                        <p class="notes-item-meta">
                            <span class="notes-item-author-swatch is-${item.authorRole}"></span>${authorLabel}
                        </p>
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
