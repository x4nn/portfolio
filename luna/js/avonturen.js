/* ================================================================
   Avonturen — Luna's choose-your-own-adventure page
   Content to personalise lives in the CONTENT block below, marked
   with ✏️ EDIT. Everything past that is the machinery and shouldn't
   need to change.
   ================================================================ */

// ---------------------------------------------------------------
// ✏️ EDIT ZONE — real content goes here
// ---------------------------------------------------------------

// ✏️ EDIT: the three stories. Each story has a start node and a set of
// nodes keyed by id. A node is either a choice node ({ text, choices })
// or an ending node ({ text, ending: true, endingId }). Add nodes and
// choices freely — just make sure every "next" points at a real node id.
const adventureStories = [
    {
        id: "avond-samen",
        icon: "🌸",
        title: "Een Avond Samen",
        description: "Een rustige, knusse avond — helemaal jullie stijl.",
        startNodeId: "start",
        nodes: {
            start: {
                text: "Het regent zachtjes tegen het raam. Jullie zitten samen op de bank, een deken over jullie benen, en de avond ligt helemaal open.",
                choices: [
                    { label: "Steek een kaars aan", next: "kaars" },
                    { label: "Open de gordijnen om de regen te zien", next: "vensters" }
                ]
            },
            kaars: {
                text: "Het kaarslicht flakkert zacht en tekent schaduwen op de muur. Het voelt meteen wat intiemer, wat rustiger.",
                choices: [
                    { label: "Lees haar iets voor uit een boek", next: "ending_boek" },
                    { label: "Vraag haar naar haar mooiste herinnering", next: "ending_gesprek" }
                ]
            },
            vensters: {
                text: "De regen tikt tegen het glas, een rustig ritme. Ergens beneden begint iemand zachte muziek te spelen.",
                choices: [
                    { label: "Trek haar overeind om te dansen", next: "ending_dans" },
                    { label: "Maak twee warme chocolademelk", next: "ending_gesprek" }
                ]
            },
            ending_boek: {
                text: "Je leest voor, zachtjes, terwijl de regen buiten blijft tikken. Ze legt haar hoofd op je schouder en luistert niet eens meer naar de woorden — alleen naar jouw stem. Dit is genoeg. Dit is alles.",
                ending: true,
                endingId: "ending_boek"
            },
            ending_gesprek: {
                text: "Jullie praten uren, over kleine dingen en grote dromen, tot de kaars bijna is opgebrand. Geen enkele stilte voelt ongemakkelijk. Sommige avonden hoeven nergens heen te leiden om perfect te zijn.",
                ending: true,
                endingId: "ending_gesprek"
            },
            ending_dans: {
                text: "Jullie dansen midden in de woonkamer, onhandig en lachend, op muziek die eigenlijk van de buren komt. De regen buiten, jullie twee binnen — meer heeft deze avond niet nodig.",
                ending: true,
                endingId: "ending_dans"
            }
        }
    },
    {
        id: "snackroof",
        icon: "🍪",
        title: "De Grote Snackroof",
        description: "Middernacht, honger, en een keuken vol verleidingen.",
        startNodeId: "start",
        nodes: {
            start: {
                text: "Het is middernacht. Iedereen slaapt, behalve jullie twee — en de koelkast lonkt vanuit de donkere keuken.",
                choices: [
                    { label: "Sluip stilletjes de trap af", next: "stilletjes" },
                    { label: "Loop gewoon rechtstreeks naar beneden, wie let er nog op", next: "rechtstreeks" }
                ]
            },
            stilletjes: {
                text: "Jullie sluipen op tenen door de gang, onderdrukte giechels en al. De keuken is bereikt — de missie kan beginnen.",
                choices: [
                    { label: "Pak de chocolade uit het geheime vak", next: "ending_chocolade" },
                    { label: "Ga voor de chips bovenop de kast", next: "ending_knal" }
                ]
            },
            rechtstreeks: {
                text: "Jullie lopen gewoon rechtdoor, alsof het huis van jullie is — wat het natuurlijk ook is. Subtiliteit was toch overschat.",
                choices: [
                    { label: "Zet zachtjes muziek op, net een geheim feestje", next: "ending_feestje" },
                    { label: "Doe alsof je slaapwandelt, voor de lol", next: "ending_knal" }
                ]
            },
            ending_chocolade: {
                text: "Je vindt de chocolade precies waar je hem verstopt had. Jullie zitten op het aanrecht, in het donker, en delen de hele reep zonder ook maar één woord. Het beste soort stelen: van jezelf, samen.",
                ending: true,
                endingId: "ending_chocolade"
            },
            ending_knal: {
                text: "De chipszak knalt open met een geluid alsof er een vuurwerkbom afgaat. Jullie verstijven, wachten op voetstappen — die niet komen — en barsten dan in lachen uit, chips overal op de vloer.",
                ending: true,
                endingId: "ending_knal"
            },
            ending_feestje: {
                text: "De zachte muziek wordt een spontaan middernachtfeestje voor twee, dansend tussen het aanrecht en de koelkast, snacks in de hand. Het beste soort feestje: onaangekondigd, en helemaal van jullie.",
                ending: true,
                endingId: "ending_feestje"
            }
        }
    },
    {
        id: "maanrijk",
        icon: "🌙",
        title: "Het Maanrijk",
        description: "Een sprookje waarin jij de enige echte maanprinses bent.",
        startNodeId: "start",
        nodes: {
            start: {
                text: "Welkom in het Maanrijk, Luna — het enige rijk waar jij van nature de kroon draagt. Een pad van sterrenstof leidt één kant op, muziek uit een verborgen bos de andere.",
                choices: [
                    { label: "Volg het pad van sterrenstof", next: "sterrenstof" },
                    { label: "Volg het geluid van muziek in het bos", next: "muziek" }
                ]
            },
            sterrenstof: {
                text: "Het pad glinstert onder je voeten. Al snel voegen zich vossen met zilveren vacht bij je, alsof ze je al kennen. Verderop rijst een berg op, hoog genoeg om de sterren aan te raken.",
                choices: [
                    { label: "Blijf even praten met de vossen", next: "ending_vossen" },
                    { label: "Klim de zilveren berg op", next: "ending_kroon" }
                ]
            },
            muziek: {
                text: "De muziek blijkt van de sterren zelf te komen, die zachtjes zingen terwijl ze om je heen draaien. Verderop, tussen de bomen, lijkt de bron van het geluid te liggen.",
                choices: [
                    { label: "Dans mee met de sterren", next: "ending_sterrendans" },
                    { label: "Volg de muziek tot aan de bron", next: "ending_kroon" }
                ]
            },
            ending_vossen: {
                text: "De vossen vertellen je in fluisterende stemmen de geheimen van het rijk, en noemen je bij een naam die ouder is dan de sterren zelf: hun maanprinses. Je loopt verder, omringd door nieuwe vrienden die je nooit meer alleen laten.",
                ending: true,
                endingId: "ending_vossen"
            },
            ending_kroon: {
                text: "Aan de top van de zilveren berg — of aan de bron van de muziek, het pad maakt niet uit — ligt een kroon van maanlicht op je te wachten, alsof hij al die tijd al wist dat jij zou komen. Je zet hem op. Het past precies.",
                ending: true,
                endingId: "ending_kroon"
            },
            ending_sterrendans: {
                text: "Je danst met de sterren tot je niet meer weet waar de hemel eindigt en jij begint. Voor even ben je geen prinses, geen mens, gewoon licht dat meebeweegt met ander licht. Het Maanrijk onthoudt deze dans voor altijd.",
                ending: true,
                endingId: "ending_sterrendans"
            }
        }
    }
];

// ---------------------------------------------------------------
// Firebase — reuses this site's existing Realtime Database, under its
// own "luna-avonturen" key so it never touches other data on the same
// database. Every call is wrapped so a network failure never breaks
// the page — it just quietly stops persisting for that session.
// ---------------------------------------------------------------

const LUNA_ADVENTURES_DATABASE_URL = "https://co-housing-e2c00-default-rtdb.europe-west1.firebasedatabase.app/luna-avonturen";

async function loadAdventureStateFromFirebase() {
    try {
        const response = await fetch(`${LUNA_ADVENTURES_DATABASE_URL}.json`);
        if (!response.ok) return { discoveredEndings: {}, progress: {} };
        const data = await response.json();
        return {
            discoveredEndings: data?.discoveredEndings || {},
            progress: data?.progress || {}
        };
    } catch (error) {
        console.warn("Kon avonturenstatus niet laden uit Firebase:", error);
        return { discoveredEndings: {}, progress: {} };
    }
}

async function saveAdventureProgressToFirebase(storyId, nodeId) {
    try {
        await fetch(`${LUNA_ADVENTURES_DATABASE_URL}/progress/${storyId}.json`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nodeId, updatedAt: new Date().toISOString() })
        });
    } catch (error) {
        console.warn("Kon voortgang niet opslaan in Firebase:", error);
    }
}

async function clearAdventureProgressInFirebase(storyId) {
    try {
        await fetch(`${LUNA_ADVENTURES_DATABASE_URL}/progress/${storyId}.json`, { method: "DELETE" });
    } catch (error) {
        console.warn("Kon voortgang niet wissen in Firebase:", error);
    }
}

async function recordAdventureEndingInFirebase(storyId, endingId) {
    try {
        await fetch(`${LUNA_ADVENTURES_DATABASE_URL}/discoveredEndings/${storyId}/${endingId}.json`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(true)
        });
    } catch (error) {
        console.warn("Kon ontdekt einde niet opslaan in Firebase:", error);
    }
}

// ---------------------------------------------------------------
// Machinery — no need to touch below this line
// ---------------------------------------------------------------

let discoveredEndingsByStory = {};
let progressByStory = {};
let activeStory = null;
let activeNodeId = null;

function getTotalEndingCountForStory(story) {
    const endingIds = new Set();
    Object.values(story.nodes).forEach((node) => {
        if (node.ending) endingIds.add(node.endingId);
    });
    return endingIds.size;
}

function getDiscoveredEndingCountForStory(story) {
    const discovered = discoveredEndingsByStory[story.id] || {};
    return Object.keys(discovered).length;
}

function renderStoryCards() {
    const list = document.getElementById("story-cards-list");
    list.innerHTML = "";

    adventureStories.forEach((story) => {
        const totalEndings = getTotalEndingCountForStory(story);
        const discoveredCount = getDiscoveredEndingCountForStory(story);
        const isFullyExplored = discoveredCount >= totalEndings && totalEndings > 0;

        const card = document.createElement("button");
        card.type = "button";
        card.className = "story-card";
        card.innerHTML = `
            <span class="story-card-icon" aria-hidden="true">${story.icon}</span>
            <span class="story-card-body">
                <span class="story-card-title-row">
                    <span class="story-card-title">${story.title}</span>
                    ${isFullyExplored ? '<span class="story-card-star" aria-label="Alle eindes ontdekt">⭐</span>' : ""}
                </span>
                <span class="story-card-description">${story.description}</span>
                <span class="story-card-progress">${discoveredCount} van ${totalEndings} eindes ontdekt</span>
            </span>
        `;
        card.addEventListener("click", () => handleStoryCardClick(story));
        list.appendChild(card);
    });
}

function handleStoryCardClick(story) {
    activeStory = story;
    const savedProgress = progressByStory[story.id];

    if (savedProgress && savedProgress.nodeId && story.nodes[savedProgress.nodeId] && !story.nodes[savedProgress.nodeId].ending) {
        openResumeModal(story, savedProgress.nodeId);
        return;
    }

    startStory(story);
}

function openResumeModal(story, savedNodeId) {
    const overlay = document.getElementById("resume-modal-overlay");
    overlay.classList.add("resume-modal-overlay--visible");

    const continueButton = document.getElementById("resume-continue-button");
    const restartButton = document.getElementById("resume-restart-button");

    const onContinue = () => {
        overlay.classList.remove("resume-modal-overlay--visible");
        showReaderNode(story, savedNodeId);
        cleanup();
    };
    const onRestart = () => {
        overlay.classList.remove("resume-modal-overlay--visible");
        startStory(story);
        cleanup();
    };
    function cleanup() {
        continueButton.removeEventListener("click", onContinue);
        restartButton.removeEventListener("click", onRestart);
    }

    continueButton.addEventListener("click", onContinue);
    restartButton.addEventListener("click", onRestart);
}

function startStory(story) {
    showReaderNode(story, story.startNodeId);
}

function showReaderNode(story, nodeId) {
    activeStory = story;
    activeNodeId = nodeId;
    const node = story.nodes[nodeId];

    document.getElementById("adventures-picker").classList.add("adventures-picker--hidden");
    document.getElementById("adventures-reader").classList.add("adventures-reader--visible");
    document.getElementById("reader-story-title").textContent = `${story.icon} ${story.title}`;
    document.getElementById("reader-scene-text").textContent = node.text;

    const choicesContainer = document.getElementById("reader-choices");
    const endingArea = document.getElementById("reader-ending-area");
    choicesContainer.innerHTML = "";
    endingArea.innerHTML = "";

    if (node.ending) {
        endingArea.innerHTML = `
            <div class="reader-ending-badge">einde ontdekt 🌙</div>
            <div class="reader-ending-actions">
                <button type="button" class="btn btn--primary" id="reader-play-again-button">Speel opnieuw</button>
                <button type="button" class="btn btn--soft" id="reader-other-story-button">Kies een ander verhaal</button>
            </div>
        `;
        document.getElementById("reader-play-again-button").addEventListener("click", () => startStory(story));
        document.getElementById("reader-other-story-button").addEventListener("click", returnToPicker);

        if (!discoveredEndingsByStory[story.id]) discoveredEndingsByStory[story.id] = {};
        if (!discoveredEndingsByStory[story.id][node.endingId]) {
            discoveredEndingsByStory[story.id][node.endingId] = true;
            recordAdventureEndingInFirebase(story.id, node.endingId);
        }
        delete progressByStory[story.id];
        clearAdventureProgressInFirebase(story.id);
        return;
    }

    node.choices.forEach((choice) => {
        const choiceButton = document.createElement("button");
        choiceButton.type = "button";
        choiceButton.className = "reader-choice-button";
        choiceButton.textContent = choice.label;
        choiceButton.addEventListener("click", () => showReaderNode(story, choice.next));
        choicesContainer.appendChild(choiceButton);
    });

    progressByStory[story.id] = { nodeId, updatedAt: new Date().toISOString() };
    saveAdventureProgressToFirebase(story.id, nodeId);
}

function returnToPicker() {
    document.getElementById("adventures-reader").classList.remove("adventures-reader--visible");
    document.getElementById("adventures-picker").classList.remove("adventures-picker--hidden");
    activeStory = null;
    activeNodeId = null;
    renderStoryCards();
}

async function initAdventuresPage() {
    document.getElementById("reader-back-button").addEventListener("click", returnToPicker);

    renderStoryCards();
    const state = await loadAdventureStateFromFirebase();
    discoveredEndingsByStory = state.discoveredEndings;
    progressByStory = state.progress;
    renderStoryCards();
}

initAdventuresPage();
