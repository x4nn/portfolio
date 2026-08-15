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
    "assets/images/luna/covers/The_Joshua_Tree.png",
    "assets/images/luna/covers/GNR.png",
    "assets/images/luna/covers/linkin-park.png",
    "assets/images/luna/covers/romeo-and-juliet.png",
];
const SCATTERED_COVER_COUNT = 36;

// ✏️ EDIT: selfies for Track 03 (the catch game). Drop image files into
// assets/images/luna/click-game/ and add their filenames here — she'll tap
// selfies instead of note emojis. Leave this empty to keep the emoji game.
const SELFIE_IMAGE_PATHS = [
    // "assets/images/luna/click-game/selfie-1.jpg",
    // "assets/images/luna/click-game/selfie-2.jpg",
];

// ---------------------------------------------------------------
// Machinery — no need to touch below this line
// ---------------------------------------------------------------

const GAME_DURATION_SECONDS = 30;
const NOTE_SPAWN_INTERVAL_MS = 650;
const NOTE_FLIGHT_DURATION_MIN_MS = 2200;
const NOTE_FLIGHT_DURATION_RANDOM_RANGE_MS = 1200;
const NOTE_TEXT_TRANSITION_DELAY_MS = 120;
const GAME_SCORE_GREAT_THRESHOLD = 25;
const GAME_SCORE_GOOD_THRESHOLD = 12;
const FLOATING_NOTE_EMOJIS = ["🎵", "🎶", "🎼", "💚", "🌿", "🎧"];
const FLOATING_NOTE_SIZE_PX = 46;

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
let lastShownNoteIndex = -1;
function playLoveNote() {
    const noteTextElement = document.getElementById("luna-note-text");
    let noteIndex;
    do {
        noteIndex = Math.floor(Math.random() * loveNotes.length);
    } while (loveNotes.length > 1 && noteIndex === lastShownNoteIndex);
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

// -- Track 3: catch-the-notes game --
let gameScore = 0;
let secondsRemaining = GAME_DURATION_SECONDS;
let gameCountdownTimer = null;
let noteSpawnTimer = null;
let gameIsRunning = false;

function startGame() {
    if (gameIsRunning) return;
    gameIsRunning = true;
    gameScore = 0;
    secondsRemaining = GAME_DURATION_SECONDS;
    document.getElementById("luna-game-score").textContent = gameScore;
    document.getElementById("luna-game-time").textContent = secondsRemaining;
    document.getElementById("luna-game-msg").classList.add("luna-game-msg--hidden");

    gameCountdownTimer = setInterval(() => {
        secondsRemaining--;
        document.getElementById("luna-game-time").textContent = secondsRemaining;
        if (secondsRemaining <= 0) endGame();
    }, 1000);

    noteSpawnTimer = setInterval(spawnFloatingNote, NOTE_SPAWN_INTERVAL_MS);
    spawnFloatingNote();
}

function spawnFloatingNote() {
    const board = document.getElementById("luna-game-board");
    const usingSelfies = SELFIE_IMAGE_PATHS.length > 0;

    const floatingNote = document.createElement(usingSelfies ? "img" : "div");
    floatingNote.className = usingSelfies ? "luna-float-note luna-float-note--selfie" : "luna-float-note";
    if (usingSelfies) {
        floatingNote.src = SELFIE_IMAGE_PATHS[Math.floor(Math.random() * SELFIE_IMAGE_PATHS.length)];
        floatingNote.alt = "";
    } else {
        floatingNote.textContent = FLOATING_NOTE_EMOJIS[Math.floor(Math.random() * FLOATING_NOTE_EMOJIS.length)];
    }

    const horizontalPosition = Math.random() * (board.clientWidth - FLOATING_NOTE_SIZE_PX);
    floatingNote.style.left = horizontalPosition + "px";
    floatingNote.style.top = board.clientHeight - FLOATING_NOTE_SIZE_PX + "px";

    const flightDuration = NOTE_FLIGHT_DURATION_MIN_MS + Math.random() * NOTE_FLIGHT_DURATION_RANDOM_RANGE_MS;
    floatingNote.style.transition = "top " + flightDuration + "ms linear, transform .1s ease";
    board.appendChild(floatingNote);
    requestAnimationFrame(() => {
        floatingNote.style.top = "-42px";
    });

    const catchNote = (event) => {
        event.stopPropagation();
        if (!gameIsRunning) return;
        gameScore++;
        document.getElementById("luna-game-score").textContent = gameScore;
        floatingNote.remove();
    };
    floatingNote.addEventListener("click", catchNote);
    floatingNote.addEventListener("touchstart", catchNote, { passive: true });

    setTimeout(() => {
        floatingNote.remove();
    }, flightDuration + 50);
}

function endGame() {
    gameIsRunning = false;
    clearInterval(gameCountdownTimer);
    clearInterval(noteSpawnTimer);
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
    gameMessageBox.querySelector("button").textContent = "Nog een keer";
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

renderCurrentReason();
reunionCountdownTimer = setInterval(tickReunionCountdown, 1000);
tickReunionCountdown();
scatterAlbumCovers();
