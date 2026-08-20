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
const diaryMoods = ["😊", "😌", "🥰", "😴", "😕", "😢", "✨"];

// ---------------------------------------------------------------
// Firebase — reuses this site's existing Realtime Database, under its
// own "luna-dagboek" key so it never touches other data on the same
// database. Every call is wrapped so a network failure never breaks
// the page — it just quietly stops persisting for that session.
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

async function saveDiaryEntryToFirebase(dateKey, entry) {
    try {
        await fetch(`${LUNA_DIARY_DATABASE_URL}/entries/${dateKey}.json`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(entry)
        });
    } catch (error) {
        console.warn("Kon dagboek-entry niet opslaan in Firebase:", error);
    }
}

async function deleteDiaryEntryFromFirebase(dateKey) {
    try {
        await fetch(`${LUNA_DIARY_DATABASE_URL}/entries/${dateKey}.json`, { method: "DELETE" });
    } catch (error) {
        console.warn("Kon dagboek-entry niet verwijderen uit Firebase:", error);
    }
}

// ---------------------------------------------------------------
// Machinery — no need to touch below this line
// ---------------------------------------------------------------

const SAVE_STATUS_MESSAGE_DURATION_MS = 2200;

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

let diaryEntries = {};
let selectedMood = null;
let currentPromptIndex = 0;

const todayKey = getDateKey(new Date());

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
        const entry = diaryEntries[dateKey];
        const entryElement = document.createElement("article");
        entryElement.className = "diary-entry";
        entryElement.innerHTML = `
            <div class="diary-entry-top">
                <span class="diary-entry-date">${formatLongDutchDate(dateKey)}</span>
                <span class="diary-entry-mood" aria-hidden="true">${entry.mood || ""}</span>
            </div>
            <p class="diary-entry-text"></p>
            <button type="button" class="diary-entry-delete">verwijderen</button>
        `;
        entryElement.querySelector(".diary-entry-text").textContent = entry.text;
        entryElement.querySelector(".diary-entry-delete").addEventListener("click", () => deleteEntry(dateKey));
        entriesList.appendChild(entryElement);
    });
}

async function deleteEntry(dateKey) {
    delete diaryEntries[dateKey];
    renderEntriesList();
    if (dateKey === todayKey) {
        document.getElementById("diary-textarea").value = "";
        selectedMood = null;
        renderMoodRow();
    }
    await deleteDiaryEntryFromFirebase(dateKey);
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
    const text = document.getElementById("diary-textarea").value.trim();
    if (!text) {
        showSaveStatus("Schrijf eerst iets voordat je opslaat 🌿");
        return;
    }

    const entry = { date: todayKey, mood: selectedMood, text, savedAt: new Date().toISOString() };
    diaryEntries[todayKey] = entry;
    renderEntriesList();
    showSaveStatus("Opgeslagen 💚");
    await saveDiaryEntryToFirebase(todayKey, entry);
}

function downloadAllEntries() {
    const sortedDateKeys = Object.keys(diaryEntries).sort();
    const fileLines = sortedDateKeys.map((dateKey) => {
        const entry = diaryEntries[dateKey];
        return `${formatLongDutchDate(dateKey)} ${entry.mood || ""}\n${entry.text}\n`;
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

    diaryEntries = await loadDiaryEntriesFromFirebase();

    if (diaryEntries[todayKey]) {
        document.getElementById("diary-textarea").value = diaryEntries[todayKey].text || "";
        selectedMood = diaryEntries[todayKey].mood || null;
        renderMoodRow();
    }
    renderEntriesList();

    document.getElementById("diary-another-prompt-button").addEventListener("click", () => {
        currentPromptIndex = pickRandomPromptIndex();
        renderPrompt();
    });
    document.getElementById("diary-save-button").addEventListener("click", saveTodayEntry);
    document.getElementById("diary-download-button").addEventListener("click", downloadAllEntries);
}

initDiaryPage();
