/* ================================================================
   Brieven — Luna's "open when…" letters page
   Content to personalise lives in the CONTENT block below, marked
   with ✏️ EDIT. Everything past that is the machinery and shouldn't
   need to change.
   ================================================================ */

// ---------------------------------------------------------------
// ✏️ EDIT ZONE — real content goes here
// ---------------------------------------------------------------

// ✏️ EDIT: the letters themselves. Add, remove or rewrite freely —
// each needs a unique id, a short situation label, the letter text,
// and a sign-off.
const letters = [
    {
        id: "je-me-mist",
        situation: "je me mist",
        text: "Als je dit leest, mis je me waarschijnlijk net zo erg als ik jou mis. Weet dat de afstand niets verandert aan hoe ik over je denk — jij bent er altijd, in alles wat ik doe. Sluit je ogen even, ik ben er zo goed als bij je.",
        signoff: "Tot snel, mijn liefste.\n— xan 💚"
    },
    {
        id: "je-niet-kunt-slapen",
        situation: "je niet kunt slapen",
        text: "Lig je nog wakker? Denk maar even aan iets doms dat we ooit samen deden, en de glimlach die daarbij hoort. Adem rustig in en uit. Ik waak virtueel over je tot je wegdroomt.",
        signoff: "Slaap zacht, ik hou van je.\n— xan 💚"
    },
    {
        id: "je-gestrest-bent",
        situation: "je gestrest bent",
        text: "Even pauze. Wat er ook aan de hand is, het is oké om het even niet te weten. Je hoeft het niet allemaal in één keer op te lossen. Adem diep in, en dan nog een keer. Ik ben trots op je, ook al zeg ik dat niet vaak genoeg.",
        signoff: "Je doet het zo goed.\n— xan 💚"
    },
    {
        id: "je-blij-bent",
        situation: "je blij bent",
        text: "Als je dit leest omdat je blij bent, dan ben ik dat nu ook — gewoon door het idee dat jij ergens lacht. Vier het lekker, geniet ervan, en vertel het me straks helemaal.",
        signoff: "Jouw blijdschap is mijn favoriete ding.\n— xan 💚"
    },
    {
        id: "we-ruzie-hebben-gehad",
        situation: "we ruzie hebben gehad",
        text: "Ruzie hoort erbij, en het verandert niets aan hoe ik over ons denk. Ik hou nog steeds evenveel van je als daarvoor, misschien wel meer — omdat ik weet dat we er altijd weer samen uitkomen. Laten we straks gewoon praten.",
        signoff: "Nog steeds helemaal van jou.\n— xan 💚"
    },
    {
        id: "je-moet-lachen",
        situation: "je moet lachen",
        text: "Oké, noodgeval: denk aan die keer dat we allebei de slappe lach kregen om iets wat achteraf helemaal niet zo grappig was. Of aan mijn belachelijke dansmoves. Werkt altijd.",
        signoff: "Blij dat ik je aan het lachen kan maken, zelfs van ver.\n— xan 💚"
    }
];

// ---------------------------------------------------------------
// Firebase — reuses this site's existing Realtime Database, under its
// own "luna-brieven" key so it never touches other data on the same
// database. Every call is wrapped so a network failure never breaks
// the page — it just quietly stops persisting for that session.
// ---------------------------------------------------------------

const LUNA_LETTERS_DATABASE_URL = "https://co-housing-e2c00-default-rtdb.europe-west1.firebasedatabase.app/luna-brieven";

async function loadOpenedLettersFromFirebase() {
    try {
        const response = await fetch(`${LUNA_LETTERS_DATABASE_URL}/opened.json`);
        if (!response.ok) return {};
        const data = await response.json();
        return data || {};
    } catch (error) {
        console.warn("Kon geopende brieven niet laden uit Firebase:", error);
        return {};
    }
}

async function markLetterOpenedInFirebase(letterId) {
    try {
        await fetch(`${LUNA_LETTERS_DATABASE_URL}/opened/${letterId}.json`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(true)
        });
    } catch (error) {
        console.warn("Kon geopende brief niet opslaan in Firebase:", error);
    }
}

// ---------------------------------------------------------------
// Machinery — no need to touch below this line
// ---------------------------------------------------------------

let openedLetterIds = {};

function renderLettersGrid() {
    const grid = document.getElementById("letters-grid");
    grid.innerHTML = "";
    letters.forEach((letter) => {
        const isOpened = Boolean(openedLetterIds[letter.id]);
        const envelopeButton = document.createElement("button");
        envelopeButton.type = "button";
        envelopeButton.className = "envelope-button" + (isOpened ? " envelope-button--opened" : "");
        envelopeButton.innerHTML = `
            <span class="envelope-icon" aria-hidden="true">💌</span>
            <span class="envelope-label">Open wanneer ${letter.situation}</span>
            ${isOpened ? '<span class="envelope-opened-tag">gelezen</span>' : ""}
        `;
        envelopeButton.addEventListener("click", () => openLetter(letter));
        grid.appendChild(envelopeButton);
    });
}

function openLetter(letter) {
    document.getElementById("letter-modal-title").textContent = `Open wanneer ${letter.situation}`;
    document.getElementById("letter-modal-body").textContent = letter.text;
    document.getElementById("letter-modal-signoff").textContent = letter.signoff;
    document.getElementById("letter-modal-overlay").classList.add("letter-modal-overlay--visible");
    document.getElementById("letter-modal-close").focus();

    if (!openedLetterIds[letter.id]) {
        openedLetterIds[letter.id] = true;
        renderLettersGrid();
        markLetterOpenedInFirebase(letter.id);
    }
}

function closeLetterModal() {
    document.getElementById("letter-modal-overlay").classList.remove("letter-modal-overlay--visible");
}

async function initLettersPage() {
    document.getElementById("letter-modal-close").addEventListener("click", closeLetterModal);
    document.getElementById("letter-modal-overlay").addEventListener("click", (event) => {
        if (event.target === event.currentTarget) closeLetterModal();
    });
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") closeLetterModal();
    });

    renderLettersGrid();
    openedLetterIds = await loadOpenedLettersFromFirebase();
    renderLettersGrid();
}

initLettersPage();
