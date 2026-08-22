/* ================================================================
   Dagboek — Luna's diary page
   Content to personalise lives in the CONTENT block below, marked
   with ✏️ EDIT. Everything past that is the machinery and shouldn't
   need to change.
   ================================================================ */

// ---------------------------------------------------------------
// ✏️ EDIT ZONE — real content goes here
// ---------------------------------------------------------------

// ✏️ EDIT: rotating diary prompts. Add or change lines any time.
const diaryPrompts = [
    "Wat maakte je vandaag aan het lachen?",
    "Waar verlang je nu het meest naar?",
    "Wat was het fijnste moment van vandaag?",
    "Waar denk je aan, net voor het slapengaan?",
    "Wat zou je me nu het liefst vertellen?",
    "Wat heeft je vandaag verrast?",
    "Waar ben je vandaag dankbaar voor?",
    "Wat mis je het meest op dit moment?",
];

// ✏️ EDIT: mood options she can pick from.
const diaryMoods = ["😊", "😌", "🥰", "😴", "😠", "😕", "😢", "✨"];

// ---------------------------------------------------------------
// Firebase — reuses this site's existing Realtime Database, under its
// own "luna-dagboek" key so it never touches other data on the same
// database. Every call is wrapped so a network failure never breaks
// the page — it just quietly stops persisting for that session.
//
// Data shape: entries/{dateKey}/{entryId} → { mood, text, savedAt }
// This allows several entries on the same day. Any day still stored
// under the older one-entry-per-day shape (entries/{dateKey} →
// { date, mood, text, savedAt } directly) is migrated automatically
// the first time the page loads it — see migrateLegacyEntriesIfNeeded.
// ---------------------------------------------------------------

const LUNA_DIARY_DATABASE_URL = "https://co-housing-e2c00-default-rtdb.europe-west1.firebasedatabase.app/luna-dagboek";

async function loadDiaryEntriesFromFirebase() {
    try {
        const response = await fetch(`${LUNA_DIARY_DATABASE_URL}/entries.json`);
        if (!response.ok) return {};
        const data = await response.json();
        return data || {};
    } catch (error) {
        console.warn("Kon dagboek niet laden uit Firebase:", error);
        return {};
    }
}

async function saveDiaryEntryToFirebase(dateKey, entryId, entry) {
    try {
        await fetch(`${LUNA_DIARY_DATABASE_URL}/entries/${dateKey}/${entryId}.json`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(entry)
        });
    } catch (error) {
        console.warn("Kon dagboek-entry niet opslaan in Firebase:", error);
    }
}

async function saveDayEntriesToFirebase(dateKey, dayEntries) {
    try {
        await fetch(`${LUNA_DIARY_DATABASE_URL}/entries/${dateKey}.json`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dayEntries)
        });
    } catch (error) {
        console.warn("Kon oude dagboek-structuur niet migreren in Firebase:", error);
    }
}

async function deleteDiaryEntryFromFirebase(dateKey, entryId) {
    try {
        await fetch(`${LUNA_DIARY_DATABASE_URL}/entries/${dateKey}/${entryId}.json`, { method: "DELETE" });
    } catch (error) {
        console.warn("Kon dagboek-entry niet verwijderen uit Firebase:", error);
    }
}

// ---------------------------------------------------------------
// Machinery — no need to touch below this line
// ---------------------------------------------------------------

const SAVE_STATUS_MESSAGE_DURATION_MS = 2200;
const SAVE_BUTTON_TEXT_READY = "Opslaan";
const SAVE_BUTTON_TEXT_NEEDS_MOOD = "Kies eerst een emoji";

function getDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function formatLongDutchDate(dateKey) {
    const [year, month, day] = dateKey.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function formatEntryTime(savedAtIso) {
    if (!savedAtIso) return "";
    const savedDate = new Date(savedAtIso);
    if (Number.isNaN(savedDate.getTime())) return "";
    return savedDate.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" });
}

function generateEntryId() {
    const randomSuffix = Math.random().toString(36).slice(2, 8);
    return `entry-${Date.now()}-${randomSuffix}`;
}

function isLegacyFlatEntry(dayValue) {
    return Boolean(dayValue) && typeof dayValue.text === "string";
}

// Converts any days still stored in the old one-entry-per-day shape
// into the new { entryId: entry } shape, and writes the converted
// days back to Firebase so the migration only has to happen once.
async function migrateLegacyEntriesIfNeeded(rawEntries) {
    const migratedEntries = {};
    const dateKeysToPersist = [];

    Object.keys(rawEntries).forEach((dateKey) => {
        const dayValue = rawEntries[dateKey];
        if (isLegacyFlatEntry(dayValue)) {
            const entryId = generateEntryId();
            migratedEntries[dateKey] = {
                [entryId]: {
                    mood: dayValue.mood || null,
                    text: dayValue.text,
                    savedAt: dayValue.savedAt || new Date().toISOString()
                }
            };
            dateKeysToPersist.push(dateKey);
        } else {
            migratedEntries[dateKey] = dayValue || {};
        }
    });

    for (const dateKey of dateKeysToPersist) {
        await saveDayEntriesToFirebase(dateKey, migratedEntries[dateKey]);
    }

    return migratedEntries;
}

let diaryEntries = {};
let selectedMood = null;
let currentPromptIndex = 0;
let editingEntryKey = null;

const todayKey = getDateKey(new Date());

function makeEntryKey(dateKey, entryId) {
    return `${dateKey}::${entryId}`;
}

function pickRandomPromptIndex() {
    if (diaryPrompts.length <= 1) return 0;
    let nextIndex = Math.floor(Math.random() * diaryPrompts.length);
    while (nextIndex === currentPromptIndex) {
        nextIndex = Math.floor(Math.random() * diaryPrompts.length);
    }
    return nextIndex;
}

function renderPrompt() {
    document.getElementById("diary-prompt-text").textContent = diaryPrompts[currentPromptIndex];
}

function updateSaveButtonState() {
    const saveButton = document.getElementById("diary-save-button");
    const moodIsSelected = Boolean(selectedMood);
    saveButton.disabled = !moodIsSelected;
    saveButton.textContent = moodIsSelected ? SAVE_BUTTON_TEXT_READY : SAVE_BUTTON_TEXT_NEEDS_MOOD;
}

function renderMoodRow() {
    const moodRow = document.getElementById("diary-mood-row");
    moodRow.innerHTML = "";
    diaryMoods.forEach((mood) => {
        const moodButton = document.createElement("button");
        moodButton.type = "button";
        moodButton.className = "diary-mood-button";
        moodButton.textContent = mood;
        moodButton.setAttribute("aria-pressed", String(mood === selectedMood));
        if (mood === selectedMood) {
            moodButton.classList.add("diary-mood-button--selected");
        }
        moodButton.addEventListener("click", () => {
            selectedMood = mood;
            renderMoodRow();
        });
        moodRow.appendChild(moodButton);
    });
    updateSaveButtonState();
}

function renderEntriesList() {
    const entriesList = document.getElementById("diary-entries-list");
    const sortedDateKeys = Object.keys(diaryEntries).sort((a, b) => (a < b ? 1 : -1));

    if (sortedDateKeys.length === 0) {
        entriesList.innerHTML = '<p class="diary-empty-state">Nog geen eerdere dagen — begin hierboven met schrijven.</p>';
        return;
    }

    entriesList.innerHTML = "";
    sortedDateKeys.forEach((dateKey) => {
        const dayEntries = diaryEntries[dateKey] || {};
        const sortedEntryIds = Object.keys(dayEntries).sort((a, b) => {
            const savedAtA = dayEntries[a].savedAt || "";
            const savedAtB = dayEntries[b].savedAt || "";
            return savedAtA < savedAtB ? -1 : savedAtA > savedAtB ? 1 : 0;
        });
        if (sortedEntryIds.length === 0) return;

        const dayElement = document.createElement("div");
        dayElement.className = "diary-entry-day";

        const dayHeading = document.createElement("h3");
        dayHeading.className = "diary-entry-day-date";
        dayHeading.textContent = formatLongDutchDate(dateKey);
        dayElement.appendChild(dayHeading);

        sortedEntryIds.forEach((entryId) => {
            const entry = dayEntries[entryId];
            const entryElement = document.createElement("article");
            entryElement.className = "diary-entry";

            if (editingEntryKey === makeEntryKey(dateKey, entryId)) {
                renderEntryEditForm(entryElement, dateKey, entryId, entry);
            } else {
                renderEntryDisplay(entryElement, dateKey, entryId, entry);
            }

            dayElement.appendChild(entryElement);
        });

        entriesList.appendChild(dayElement);
    });
}

function renderEntryDisplay(entryElement, dateKey, entryId, entry) {
    entryElement.innerHTML = `
        <div class="diary-entry-top">
            <span class="diary-entry-time">${formatEntryTime(entry.savedAt)}</span>
            <span class="diary-entry-mood" aria-hidden="true">${entry.mood || ""}</span>
        </div>
        <p class="diary-entry-text"></p>
        <div class="diary-entry-buttons">
            <button type="button" class="diary-entry-edit">bewerken</button>
            <button type="button" class="diary-entry-delete">verwijderen</button>
        </div>
    `;
    entryElement.querySelector(".diary-entry-text").textContent = entry.text;
    entryElement.querySelector(".diary-entry-delete").addEventListener("click", () => deleteEntry(dateKey, entryId));
    entryElement.querySelector(".diary-entry-edit").addEventListener("click", () => {
        editingEntryKey = makeEntryKey(dateKey, entryId);
        renderEntriesList();
    });
}

function renderEntryEditForm(entryElement, dateKey, entryId, entry) {
    entryElement.innerHTML = `
        <div class="diary-entry-top">
            <span class="diary-entry-time">${formatEntryTime(entry.savedAt)}</span>
        </div>
        <p class="diary-mood-label">Kies eerst een stemming <span aria-hidden="true">*</span></p>
        <div class="diary-mood-row diary-entry-edit-mood-row" role="group" aria-label="Kies je stemming (verplicht)"></div>
        <label class="visually-hidden" style="position:absolute; left:-9999px;">Dagboektekst bewerken</label>
        <textarea class="diary-textarea diary-entry-edit-textarea"></textarea>
        <div class="diary-entry-edit-actions">
            <button type="button" class="btn btn--soft diary-entry-edit-cancel">Annuleren</button>
            <button type="button" class="btn btn--primary diary-entry-edit-save"></button>
        </div>
    `;

    const editTextarea = entryElement.querySelector(".diary-entry-edit-textarea");
    editTextarea.value = entry.text;

    const editMoodRow = entryElement.querySelector(".diary-entry-edit-mood-row");
    const editSaveButton = entryElement.querySelector(".diary-entry-edit-save");
    const editCancelButton = entryElement.querySelector(".diary-entry-edit-cancel");
    let editSelectedMood = entry.mood || null;

    function updateEditSaveButtonState() {
        const moodIsSelected = Boolean(editSelectedMood);
        editSaveButton.disabled = !moodIsSelected;
        editSaveButton.textContent = moodIsSelected ? SAVE_BUTTON_TEXT_READY : SAVE_BUTTON_TEXT_NEEDS_MOOD;
    }

    function renderEditMoodRow() {
        editMoodRow.innerHTML = "";
        diaryMoods.forEach((mood) => {
            const moodButton = document.createElement("button");
            moodButton.type = "button";
            moodButton.className = "diary-mood-button";
            moodButton.textContent = mood;
            moodButton.setAttribute("aria-pressed", String(mood === editSelectedMood));
            if (mood === editSelectedMood) {
                moodButton.classList.add("diary-mood-button--selected");
            }
            moodButton.addEventListener("click", () => {
                editSelectedMood = mood;
                renderEditMoodRow();
            });
            editMoodRow.appendChild(moodButton);
        });
        updateEditSaveButtonState();
    }
    renderEditMoodRow();

    editCancelButton.addEventListener("click", () => {
        editingEntryKey = null;
        renderEntriesList();
    });

    editSaveButton.addEventListener("click", async () => {
        if (!editSelectedMood) return;
        const updatedText = editTextarea.value.trim();
        if (!updatedText) return;

        const updatedEntry = { mood: editSelectedMood, text: updatedText, savedAt: entry.savedAt || new Date().toISOString() };
        diaryEntries[dateKey][entryId] = updatedEntry;
        editingEntryKey = null;
        renderEntriesList();
        showSaveStatus("Opgeslagen 💚");

        await saveDiaryEntryToFirebase(dateKey, entryId, updatedEntry);
    });
}

async function deleteEntry(dateKey, entryId) {
    if (diaryEntries[dateKey]) {
        delete diaryEntries[dateKey][entryId];
        if (Object.keys(diaryEntries[dateKey]).length === 0) {
            delete diaryEntries[dateKey];
        }
    }
    if (editingEntryKey === makeEntryKey(dateKey, entryId)) {
        editingEntryKey = null;
    }
    renderEntriesList();
    await deleteDiaryEntryFromFirebase(dateKey, entryId);
}

function showSaveStatus(message) {
    const statusElement = document.getElementById("diary-save-status");
    statusElement.textContent = message;
    setTimeout(() => {
        if (statusElement.textContent === message) {
            statusElement.textContent = "";
        }
    }, SAVE_STATUS_MESSAGE_DURATION_MS);
}

async function saveTodayEntry() {
    if (!selectedMood) {
        showSaveStatus("Kies eerst een stemming hierboven 🌿");
        return;
    }

    const text = document.getElementById("diary-textarea").value.trim();
    if (!text) {
        showSaveStatus("Schrijf eerst iets voordat je opslaat 🌿");
        return;
    }

    const entryId = generateEntryId();
    const entry = { mood: selectedMood, text, savedAt: new Date().toISOString() };

    if (!diaryEntries[todayKey]) {
        diaryEntries[todayKey] = {};
    }
    diaryEntries[todayKey][entryId] = entry;

    renderEntriesList();
    showSaveStatus("Opgeslagen 💚");

    document.getElementById("diary-textarea").value = "";
    selectedMood = null;
    renderMoodRow();

    await saveDiaryEntryToFirebase(todayKey, entryId, entry);
}

function downloadAllEntries() {
    const sortedDateKeys = Object.keys(diaryEntries).sort();
    const fileLines = [];

    sortedDateKeys.forEach((dateKey) => {
        const dayEntries = diaryEntries[dateKey] || {};
        const sortedEntryIds = Object.keys(dayEntries).sort((a, b) => {
            const savedAtA = dayEntries[a].savedAt || "";
            const savedAtB = dayEntries[b].savedAt || "";
            return savedAtA < savedAtB ? -1 : savedAtA > savedAtB ? 1 : 0;
        });
        sortedEntryIds.forEach((entryId) => {
            const entry = dayEntries[entryId];
            fileLines.push(`${formatLongDutchDate(dateKey)} ${entry.mood || ""}\n${entry.text}\n`);
        });
    });

    const fileContent = fileLines.length ? fileLines.join("\n---\n\n") : "Nog geen dagboekjes geschreven.";

    const downloadBlob = new Blob([fileContent], { type: "text/plain;charset=utf-8" });
    const downloadUrl = URL.createObjectURL(downloadBlob);
    const downloadLink = document.createElement("a");
    downloadLink.href = downloadUrl;
    downloadLink.download = "luna-dagboek.txt";
    document.body.appendChild(downloadLink);
    downloadLink.click();
    downloadLink.remove();
    URL.revokeObjectURL(downloadUrl);
}

async function initDiaryPage() {
    document.getElementById("diary-today-date").textContent = formatLongDutchDate(todayKey);
    currentPromptIndex = Math.floor(Math.random() * diaryPrompts.length);
    renderPrompt();
    renderMoodRow();
    renderEntriesList();

    const rawEntries = await loadDiaryEntriesFromFirebase();
    diaryEntries = await migrateLegacyEntriesIfNeeded(rawEntries);
    renderEntriesList();

    document.getElementById("diary-another-prompt-button").addEventListener("click", () => {
        currentPromptIndex = pickRandomPromptIndex();
        renderPrompt();
    });
    document.getElementById("diary-save-button").addEventListener("click", saveTodayEntry);
    document.getElementById("diary-download-button").addEventListener("click", downloadAllEntries);
}

initDiaryPage();
