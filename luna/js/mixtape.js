/* ================================================================
   Luna — personal gift page
   Content to personalise lives in the CONTENT block below, marked
   with ✏️ EDIT. Everything past that is the machinery and shouldn't
   need to change.
   ================================================================ */

// ---------------------------------------------------------------
// ✏️ EDIT ZONE — real content goes here
// ---------------------------------------------------------------

// ✏️ EDIT: love notes (Track 01). A random one shows on each tap.
// Add more any time — just add another line to the array, same format.
const loveNotes = [
    "Waar je ook bent, jij bent mijn favoriete plekje.",
    "Als ik mijn ogen dichtdoe, ben jij het eerste waar ik aan denk.",
    "Op mijn slechtste dagen denk ik aan jou, en dan voelt alles weer een beetje lichter. Jij bent het beste wat me ooit is overkomen.",
    "Jij bent mijn mooiste sterretje, mooier dan die we die avond samen zagen. En ik ben harder voor jou gevallen dan die ster ooit gevallen is.",
    "Als je ooit weer zin hebt in een strandwandeling met muziek, IK BEN DAAR",
    "Het is oke als het even niet oke is. ik ben er sowieso, wat er ook gebeurt",
    "Als ik alle sterren die we ooit gaan zien zou moeten ruilen voor jou, zou ik zonder nadenken kiezen. jij bent het enige licht dat ik nodig heb",
    "Elk nummer dat je opzet wordt automatisch mijn nieuwe favoriet, gewoon omdat jij het koos",
    "Rotdag? kom hier, virtuele knuffel. ik hou nog steeds evenveel van je",
    "Jij bent mijn favogrietje",
    "Ik hou van je, en ik ben zo blij dat jij van mij houdt",
    "Ik denk nog heel vaak aan ons vaart 'afspraakje'",
    "Ik zou nooit de tijd stilzetten. Ik kies liever voor elke seconde met jou.",
    "Waar je nu ook bent, jij bent mijn favoriete plek.",
    "Ik mis je vandaag meer dan normaal, en dat wil wat zeggen.",
    "Jij maakt van gewone dagen iets om te onthouden.",
    "Kom snel terug. Mijn armen missen precies jouw vorm.",
    "Ik voel me thuis overal jij bent.",
    "Ik hou van je, en ik ben zo blij dat jij van mij houdt.",
    "Ik wil je gewoon even laten weten dat ik aan je denk, en dat ik van je hou.",
    "Jij bent de mooiste... oprecht... de aller mooiste enzo.... !!!!",
    "Jij bent de knapste!!",
    "<3",
    "Je t'aimes",
    "Ik mis jouw geur, je ruikt zo lekker altijd",
    "Ik mis je lach, je maakt me altijd zo blij",
    "Ik mis je stem, ik kan er uren naar luisteren",
    "Ik mis je ogen, ik kan er uren in staren",
    "Ik kan super goed zwemmen, maar in jouw ogen verdrink ik altijd",
    "Ik HOU HOU HOU HOU HOU van onze auto ritjes en jou overal te komen halen of afzetten of whatever IK LOEV HET!",
    "Ik smelte toen je me 'Piano man' zong toen ik met de fiets reed. Ik wil meer naar jouw gezang luistern pls",
    "Ik smelt als je met puppy ogen naar me kijkt en daar na in men armen smelt.",
    "KAN NIET WACHTEN TOT JE WEER HIER BENT. IK MIS JE <3",
    "Ik mis je zo erg. Ik wil je knuffelen en nooit meer loslaten.",
    
];

// ✏️ EDIT: reasons you love her (Track 02). She flips through these.
const reasonsList = [
    "Je bent de liefste",
    "Je bent de knapste",
    "Je bent de slimste",
    "Je bent de grappigste",
    "Je bent de mooiste",
    "Bij jou voel ik me veilig, gewoon door in je buurt te zijn",
    "Je houdt van muziek en strandwandelingen net zoveel als ik van jou",
    "Je onthoudt de kleine dingen die ik al lang vergeten was",
    "Je maakt me een betere versie van mezelf, zonder dat je het zelf doorhebt",
    "Jij voelt als thuis",
    "Bij jou hoef ik nooit iets te bewijzen, ik mag gewoon mezelf zijn",
    "Bij jou voelt elke gewone dag een beetje speciaal",
    "Je bent mijn favoriete persoon om mee te praten, lachen, huilen en gewoon te zijn",
    "Je zorgt ZO FKNG goed voor me",
    "Je ben zo geduldig met me",
    "Je maakt me altijd aan het lachen, ookal probeer je niet",
    "Jij bent echt de schattigste en liefste persoon die ik ken",
    "JE BENT MIJN FAVORIET",
    "Jouw muziekkeuze is altijd perfect, en ik hou van hoe je me nieuwe dingen laat ontdekken",
    "Je dingen onthoud voor me hihi (i try)",
    "Je maakt me altijd blij, zelfs als ik me rot voel",
    "Je wilt vrijwillig eten voor me maken, je weet wat ik daar van vind",
    "Je bent de beste passenger princess",
    "Ik HOU HOU HOU HOU HOU van jouw zoentjes",
    "Ik HOU HOU HOU HOU HOU van jouw knuffels",
    "Jouw stem is muziek in mijn oren",
    "Je bent de liefste, knapste, slimste, grappigste en mooiste persoon die ik ken",
    "Je bent mijn favoriete persoon om mee te praten, lachen, huilen en gewoon te zijn",
];

// ✏️ EDIT: reunion date & time. Months start at 0, so August = 7.
const REUNION_YEAR = 2026;
const REUNION_MONTH_ZERO_INDEXED = 7; // August
const REUNION_DAY = 27;
const REUNION_HOUR = 18; // ✏️ EDIT: exact time still to confirm
const REUNION_MINUTE = 0;
const reunionDate = new Date(REUNION_YEAR, REUNION_MONTH_ZERO_INDEXED, REUNION_DAY, REUNION_HOUR, REUNION_MINUTE);

// ✏️ EDIT: message shown once the countdown reaches zero.
const reunionReachedMessage = "Ik ben er. Kom hier. 💚";

// ✏️ EDIT: album covers scattered as background decoration (see Track 04
// for the actual playlist). Add/remove image paths here — scatterAlbumCovers()
// below generates as many scattered copies as SCATTERED_COVER_COUNT, cycling
// through this list, instead of one hardcoded element per copy.
const ALBUM_COVER_IMAGE_PATHS = [
    "/assets/images/luna/covers/The_Joshua_Tree.png",
    "/assets/images/luna/covers/GNR.png",
    "/assets/images/luna/covers/linkin-park.png",
    "/assets/images/luna/covers/romeo-and-juliet.png",
];
const SCATTERED_COVER_COUNT = 36;

// ✏️ EDIT: selfies for Track 03 (the catch game). Drop more image files into
// assets/images/luna/click-game/ and add their filenames here any time — she
// taps a mix of these and the note emojis below. Leave this empty to fall
// back to emoji-only.
const SELFIE_IMAGE_PATHS = [
    "/assets/images/luna/click-game/selfie-1.jpeg",
    "/assets/images/luna/click-game/selfie-2.jpeg",
    "/assets/images/luna/click-game/selfie-3.jpeg",
    "/assets/images/luna/click-game/selfie-4.jpeg",
    "/assets/images/luna/click-game/selfie-5.jpeg",
    "/assets/images/luna/click-game/selfie-6.jpeg",
    "/assets/images/luna/click-game/selfie-7.jpeg",
    "/assets/images/luna/click-game/selfie-8.jpeg",
];

// ---------------------------------------------------------------
// Machinery — no need to touch below this line
// ---------------------------------------------------------------

const GAME_DURATION_SECONDS = 30;
// Difficulty ramps up over the round: notes spawn faster and fly past
// quicker near the end, so a skilled player has to keep speeding up too —
// the score ceiling isn't just "how many notes spawned" anymore.
const NOTE_SPAWN_INTERVAL_START_MS = 650;
const NOTE_SPAWN_INTERVAL_END_MS = 280;
const NOTE_FLIGHT_DURATION_START_MIN_MS = 2200;
const NOTE_FLIGHT_DURATION_START_RANDOM_RANGE_MS = 1200;
const NOTE_FLIGHT_DURATION_END_MIN_MS = 1000;
const NOTE_FLIGHT_DURATION_END_RANDOM_RANGE_MS = 500;
const NOTE_TEXT_TRANSITION_DELAY_MS = 120;
// Catching notes back-to-back without missing builds a combo: every
// STREAK_CATCHES_PER_COMBO_STEP consecutive catches, each catch is worth one
// point more, up to MAX_COMBO_BONUS_POINTS extra — missing a note resets it.
const STREAK_CATCHES_PER_COMBO_STEP = 4;
const MAX_COMBO_BONUS_POINTS = 4;
const GAME_SCORE_GREAT_THRESHOLD = 150;
const GAME_SCORE_GOOD_THRESHOLD = 60;
const FLOATING_NOTE_EMOJIS = ["🎵", "🎶", "🎼", "💚", "🌿", "🎧"];
const FLOATING_NOTE_SIZE_PX = 46;

// ✏️ EDIT: chance a spawned note is an emoji vs. a selfie — 1/3 emoji, 2/3
// selfie. A fixed ratio (not just pooling both arrays together) so it stays
// 1/3 - 2/3 no matter how many selfies end up in SELFIE_IMAGE_PATHS.
const EMOJI_SPAWN_PROBABILITY = 1 / 3;

// -- Scattered album covers --
const COVER_WIDTH_MIN_PX = 50;
const COVER_WIDTH_MAX_PX = 95;
const COVER_ROTATION_MAX_DEG = 22;
const COVER_OPACITY_MIN = 0.85;
const COVER_OPACITY_MAX = 0.92;
const COVER_TOP_JITTER_PERCENT = 1.5;
const COVER_LEFT_HALF_MIN_PERCENT = 0;
const COVER_LEFT_HALF_MAX_PERCENT = 44;
const COVER_RIGHT_HALF_MIN_PERCENT = 56;
const COVER_RIGHT_HALF_MAX_PERCENT = 92;

function randomBetween(min, max) {
    return min + Math.random() * (max - min);
}

function scatterAlbumCovers() {
    const coverLayer = document.getElementById("luna-cover-layer");
    for (let coverIndex = 0; coverIndex < SCATTERED_COVER_COUNT; coverIndex++) {
        const cover = document.createElement("img");
        cover.className = "luna-cover";
        cover.src = ALBUM_COVER_IMAGE_PATHS[coverIndex % ALBUM_COVER_IMAGE_PATHS.length];
        cover.alt = "";
        cover.draggable = false;

        const evenlySpacedTopPercent = (coverIndex / SCATTERED_COVER_COUNT) * 100;
        cover.style.top = evenlySpacedTopPercent + randomBetween(-COVER_TOP_JITTER_PERCENT, COVER_TOP_JITTER_PERCENT) + "%";
        cover.style.left =
            coverIndex % 2 === 0
                ? randomBetween(COVER_LEFT_HALF_MIN_PERCENT, COVER_LEFT_HALF_MAX_PERCENT) + "%"
                : randomBetween(COVER_RIGHT_HALF_MIN_PERCENT, COVER_RIGHT_HALF_MAX_PERCENT) + "%";
        cover.style.width = randomBetween(COVER_WIDTH_MIN_PX, COVER_WIDTH_MAX_PX) + "px";
        cover.style.transform = "rotate(" + randomBetween(-COVER_ROTATION_MAX_DEG, COVER_ROTATION_MAX_DEG) + "deg)";
        cover.style.opacity = randomBetween(COVER_OPACITY_MIN, COVER_OPACITY_MAX);

        coverLayer.appendChild(cover);
    }
}

// -- Track 1: love notes --
// Shuffle-bag: shows every note once, in random order, before reshuffling
// and going again — never repeats a note until she's seen all the others.
function shuffleArray(array) {
    const shuffled = array.slice();
    for (let indexToFill = shuffled.length - 1; indexToFill > 0; indexToFill--) {
        const randomIndex = Math.floor(Math.random() * (indexToFill + 1));
        [shuffled[indexToFill], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[indexToFill]];
    }
    return shuffled;
}

let noteShuffleQueue = [];
let lastShownNoteIndex = -1;
function playLoveNote() {
    const noteTextElement = document.getElementById("luna-note-text");

    if (noteShuffleQueue.length === 0) {
        noteShuffleQueue = shuffleArray(loveNotes.map((_note, index) => index));
        // avoid the freshly reshuffled bag starting with the note we just showed
        if (noteShuffleQueue.length > 1 && noteShuffleQueue[0] === lastShownNoteIndex) {
            [noteShuffleQueue[0], noteShuffleQueue[1]] = [noteShuffleQueue[1], noteShuffleQueue[0]];
        }
    }
    const noteIndex = noteShuffleQueue.shift();
    lastShownNoteIndex = noteIndex;

    noteTextElement.classList.remove("luna-note-text--show");
    setTimeout(() => {
        noteTextElement.textContent = loveNotes[noteIndex];
        noteTextElement.classList.add("luna-note-text--show");
    }, NOTE_TEXT_TRANSITION_DELAY_MS);
}

// -- Track 2: reasons --
let currentReasonIndex = 0;
function renderCurrentReason() {
    document.getElementById("luna-reason-count").textContent =
        "Reden " + (currentReasonIndex + 1) + " van " + reasonsList.length;
    document.getElementById("luna-reason-text").textContent = reasonsList[currentReasonIndex];
}
function showNextReason() {
    currentReasonIndex = (currentReasonIndex + 1) % reasonsList.length;
    renderCurrentReason();
}
function showPreviousReason() {
    currentReasonIndex = (currentReasonIndex - 1 + reasonsList.length) % reasonsList.length;
    renderCurrentReason();
}

// -- Track 3: catch-the-notes game leaderboard --
// Reuses this site's existing Firebase Realtime Database, under its own
// "luna-mixtape-leaderboard" key so it never touches other data on the
// same database (see dagboek.js for the same pattern). Wrapped so a
// network failure never breaks the game — it just quietly stops
// persisting for that session.
const LUNA_LEADERBOARD_DATABASE_URL = "https://co-housing-e2c00-default-rtdb.europe-west1.firebasedatabase.app/luna-mixtape-leaderboard";
const LEADERBOARD_MAX_ENTRIES_SHOWN = 10;
const LEADERBOARD_NAME_MAX_LENGTH = 20;

async function loadLeaderboardFromFirebase() {
    try {
        const response = await fetch(`${LUNA_LEADERBOARD_DATABASE_URL}/scores.json`);
        if (!response.ok) return {};
        const data = await response.json();
        return data || {};
    } catch (error) {
        console.warn("Kon scorebord niet laden uit Firebase:", error);
        return {};
    }
}

async function saveLeaderboardEntryToFirebase(entry) {
    try {
        await fetch(`${LUNA_LEADERBOARD_DATABASE_URL}/scores.json`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(entry)
        });
    } catch (error) {
        console.warn("Kon score niet opslaan in Firebase:", error);
    }
}

function renderLeaderboard(scores) {
    const leaderboardList = document.getElementById("luna-leaderboard-list");
    const rankedEntries = Object.values(scores)
        .filter((entry) => entry && typeof entry.score === "number" && typeof entry.name === "string")
        .sort((a, b) => b.score - a.score)
        .slice(0, LEADERBOARD_MAX_ENTRIES_SHOWN);

    if (rankedEntries.length === 0) {
        leaderboardList.innerHTML = '<li class="luna-leaderboard-empty">Nog geen scores — wees de eerste! 🎶</li>';
        return;
    }

    leaderboardList.innerHTML = "";
    rankedEntries.forEach((entry, entryIndex) => {
        const listItem = document.createElement("li");
        listItem.className = "luna-leaderboard-entry";
        listItem.innerHTML = `
            <span class="luna-leaderboard-entry-rank">${entryIndex + 1}.</span>
            <span class="luna-leaderboard-entry-name"></span>
            <span class="luna-leaderboard-entry-score">${entry.score}</span>
        `;
        listItem.querySelector(".luna-leaderboard-entry-name").textContent = entry.name;
        leaderboardList.appendChild(listItem);
    });
}

// -- Track 3: catch-the-notes game --
let gameScore = 0;
let secondsRemaining = GAME_DURATION_SECONDS;
let gameCountdownTimer = null;
let noteSpawnTimer = null;
let gameIsRunning = false;
let gameStartedAtMs = 0;
let currentCatchStreak = 0;

function getGameProgress() {
    const elapsedMs = Date.now() - gameStartedAtMs;
    return Math.min(1, Math.max(0, elapsedMs / (GAME_DURATION_SECONDS * 1000)));
}

function interpolate(startValue, endValue, progress) {
    return startValue + (endValue - startValue) * progress;
}

function updateComboDisplay() {
    const comboMultiplier = 1 + Math.min(Math.floor(currentCatchStreak / STREAK_CATCHES_PER_COMBO_STEP), MAX_COMBO_BONUS_POINTS);
    document.getElementById("luna-game-combo").textContent = "x" + comboMultiplier;
}

function startGame() {
    if (gameIsRunning) return;
    gameIsRunning = true;
    gameScore = 0;
    currentCatchStreak = 0;
    secondsRemaining = GAME_DURATION_SECONDS;
    gameStartedAtMs = Date.now();
    document.getElementById("luna-game-score").textContent = gameScore;
    document.getElementById("luna-game-time").textContent = secondsRemaining;
    document.getElementById("luna-game-msg").classList.add("luna-game-msg--hidden");
    updateComboDisplay();

    gameCountdownTimer = setInterval(() => {
        secondsRemaining--;
        document.getElementById("luna-game-time").textContent = secondsRemaining;
        if (secondsRemaining <= 0) endGame();
    }, 1000);

    scheduleNextNoteSpawn();
}

function scheduleNextNoteSpawn() {
    if (!gameIsRunning) return;
    spawnFloatingNote();
    const nextSpawnInterval = interpolate(NOTE_SPAWN_INTERVAL_START_MS, NOTE_SPAWN_INTERVAL_END_MS, getGameProgress());
    noteSpawnTimer = setTimeout(scheduleNextNoteSpawn, nextSpawnInterval);
}

function spawnFloatingNote() {
    const board = document.getElementById("luna-game-board");
    const isSelfie = SELFIE_IMAGE_PATHS.length > 0 && Math.random() >= EMOJI_SPAWN_PROBABILITY;

    const floatingNote = document.createElement(isSelfie ? "img" : "div");
    floatingNote.className = isSelfie ? "luna-float-note luna-float-note--selfie" : "luna-float-note";
    floatingNote.draggable = false;
    if (isSelfie) {
        floatingNote.src = SELFIE_IMAGE_PATHS[Math.floor(Math.random() * SELFIE_IMAGE_PATHS.length)];
        floatingNote.alt = "";
    } else {
        floatingNote.textContent = FLOATING_NOTE_EMOJIS[Math.floor(Math.random() * FLOATING_NOTE_EMOJIS.length)];
    }

    const horizontalPosition = Math.random() * (board.clientWidth - FLOATING_NOTE_SIZE_PX);
    floatingNote.style.left = horizontalPosition + "px";
    floatingNote.style.top = board.clientHeight - FLOATING_NOTE_SIZE_PX + "px";

    const progress = getGameProgress();
    const flightDurationMin = interpolate(NOTE_FLIGHT_DURATION_START_MIN_MS, NOTE_FLIGHT_DURATION_END_MIN_MS, progress);
    const flightDurationRandomRange = interpolate(NOTE_FLIGHT_DURATION_START_RANDOM_RANGE_MS, NOTE_FLIGHT_DURATION_END_RANDOM_RANGE_MS, progress);
    const flightDuration = flightDurationMin + Math.random() * flightDurationRandomRange;
    floatingNote.style.transition = "top " + flightDuration + "ms linear, transform .1s ease";
    board.appendChild(floatingNote);
    // Force the browser to commit the starting "top" (bottom of board) to layout
    // before changing it, instead of relying on requestAnimationFrame timing —
    // an <img> that's still loading over the network can eat that timing
    // window, so the transition gets skipped and the photo just appears at
    // its end position (the top) instead of floating up.
    void floatingNote.offsetHeight;
    floatingNote.style.top = -FLOATING_NOTE_SIZE_PX + "px";

    let wasCaught = false;
    const catchNote = (event) => {
        event.stopPropagation();
        if (!gameIsRunning || wasCaught) return;
        wasCaught = true;
        const comboMultiplier = 1 + Math.min(Math.floor(currentCatchStreak / STREAK_CATCHES_PER_COMBO_STEP), MAX_COMBO_BONUS_POINTS);
        gameScore += comboMultiplier;
        currentCatchStreak++;
        document.getElementById("luna-game-score").textContent = gameScore;
        updateComboDisplay();
        floatingNote.remove();
    };
    floatingNote.addEventListener("click", catchNote);
    floatingNote.addEventListener("touchstart", catchNote, { passive: true });

    setTimeout(() => {
        if (!wasCaught && gameIsRunning) {
            currentCatchStreak = 0;
            updateComboDisplay();
        }
        floatingNote.remove();
    }, flightDuration + 50);
}

function endGame() {
    gameIsRunning = false;
    clearInterval(gameCountdownTimer);
    clearTimeout(noteSpawnTimer);
    document.querySelectorAll(".luna-float-note").forEach((note) => note.remove());

    const resultMessage =
        gameScore >= GAME_SCORE_GREAT_THRESHOLD
            ? "Ongelooflijk. Jij bent een natuurtalent 🌟"
            : gameScore >= GAME_SCORE_GOOD_THRESHOLD
              ? "Zo goed! Nog een keer? 💚"
              : "Aww. Probeer nog eens, dit lukt je 🎶";

    const gameMessageBox = document.getElementById("luna-game-msg");
    document.getElementById("luna-game-msg-text").textContent =
        "Je hebt " + gameScore + " nootjes gevangen! " + resultMessage;
    gameMessageBox.classList.remove("luna-game-msg--hidden");

    const startButton = document.getElementById("luna-start-game-button");
    startButton.textContent = "Nog een keer";
    startButton.classList.add("luna-start-button--hidden");

    document.getElementById("luna-leaderboard-form").classList.add("luna-leaderboard-form--hidden");
    document.getElementById("luna-leaderboard-name-input").value = "";
    document.getElementById("luna-leaderboard-prompt").classList.remove("luna-leaderboard-prompt--hidden");
}

// -- Track 5: reunion countdown --
let reunionCountdownTimer = null;
function tickReunionCountdown() {
    const now = new Date();
    let remainingSeconds = Math.floor((reunionDate - now) / 1000);
    if (remainingSeconds <= 0) {
        document.getElementById("luna-count-grid").style.display = "none";
        document.getElementById("luna-count-msg").textContent = reunionReachedMessage;
        clearInterval(reunionCountdownTimer);
        return;
    }
    const days = Math.floor(remainingSeconds / 86400);
    remainingSeconds -= days * 86400;
    const hours = Math.floor(remainingSeconds / 3600);
    remainingSeconds -= hours * 3600;
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds - minutes * 60;

    document.getElementById("luna-count-days").textContent = days;
    document.getElementById("luna-count-hours").textContent = String(hours).padStart(2, "0");
    document.getElementById("luna-count-minutes").textContent = String(minutes).padStart(2, "0");
    document.getElementById("luna-count-seconds").textContent = String(seconds).padStart(2, "0");
}

// -- Hero: cassette "play" button --
const CASSETTE_PRESSED_CLASS_DURATION_MS = 1500;
function playCassette() {
    const cassetteTrigger = document.getElementById("luna-cassette-trigger");
    cassetteTrigger.classList.add("luna-cassette-trigger--pressed");
    setTimeout(() => {
        cassetteTrigger.classList.remove("luna-cassette-trigger--pressed");
    }, CASSETTE_PRESSED_CLASS_DURATION_MS);

    playLoveNote();
    document.getElementById("luna-track-01").scrollIntoView({ behavior: "smooth", block: "start" });
}

// -- Wire up buttons + start timers --
document.getElementById("luna-cassette-trigger").addEventListener("click", playCassette);
document.getElementById("luna-play-note-button").addEventListener("click", playLoveNote);
document.getElementById("luna-prev-reason-button").addEventListener("click", showPreviousReason);
document.getElementById("luna-next-reason-button").addEventListener("click", showNextReason);
document.getElementById("luna-start-game-button").addEventListener("click", startGame);

document.getElementById("luna-leaderboard-yes-button").addEventListener("click", () => {
    document.getElementById("luna-leaderboard-prompt").classList.add("luna-leaderboard-prompt--hidden");
    document.getElementById("luna-leaderboard-form").classList.remove("luna-leaderboard-form--hidden");
    document.getElementById("luna-leaderboard-name-input").focus();
});

document.getElementById("luna-leaderboard-no-button").addEventListener("click", () => {
    document.getElementById("luna-leaderboard-prompt").classList.add("luna-leaderboard-prompt--hidden");
    document.getElementById("luna-start-game-button").classList.remove("luna-start-button--hidden");
});

document.getElementById("luna-leaderboard-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const nameInput = document.getElementById("luna-leaderboard-name-input");
    const playerName = nameInput.value.trim();
    if (!playerName) {
        nameInput.focus();
        return;
    }

    const entry = {
        name: playerName.slice(0, LEADERBOARD_NAME_MAX_LENGTH),
        score: gameScore,
        savedAt: new Date().toISOString()
    };

    document.getElementById("luna-leaderboard-form").classList.add("luna-leaderboard-form--hidden");
    document.getElementById("luna-start-game-button").classList.remove("luna-start-button--hidden");

    await saveLeaderboardEntryToFirebase(entry);
    renderLeaderboard(await loadLeaderboardFromFirebase());
});

renderCurrentReason();
reunionCountdownTimer = setInterval(tickReunionCountdown, 1000);
tickReunionCountdown();
scatterAlbumCovers();
loadLeaderboardFromFirebase().then(renderLeaderboard);
