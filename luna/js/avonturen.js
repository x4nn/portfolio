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
        description: "Een rustige, knusse avond.",
        startNodeId: "start",
        nodes: {
            start: {
                text: "Het regent zachtjes tegen het raam, een rustig ritme dat de wereld buiten even stil lijkt te zetten. Jullie zitten samen op de bank, een deken over jullie benen, zijn hoofd tegen jouw schouder en zijn hand losjes in de jouwe. Er is nergens dat jullie moeten zijn, niets dat gedaan moet worden — alleen deze kamer, dit licht, en elkaar. De avond ligt helemaal open, en hij voelt precies zoals hij hoort te voelen.",
                choices: [
                    { label: "Steek een kaars aan", next: "kaars" },
                    { label: "Open de gordijnen om de regen te zien", next: "vensters" }
                ]
            },
            kaars: {
                text: "Het kaarslicht flakkert zacht en tekent bewegende schaduwen op de muur. Je ziet hoe het gouden licht over zijn gezicht speelt, hoe zijn ogen er zachter door lijken. Hij schuift dichterbij, zijn hand vindt de jouwe onder de deken, en voor een moment zeggen jullie geen van beiden iets — het is niet nodig. De stilte tussen jullie voelt warm, geladen met iets dat groeit naarmate het licht dichter bij jullie beiden komt.",
                choices: [
                    { label: "Lees hem iets voor uit een boek", next: "ending_boek" },
                    { label: "Vraag hem naar zijn mooiste herinnering", next: "ending_gesprek" }
                ]
            },
            vensters: {
                text: "De regen tikt tegen het glas, een rustig ritme, terwijl jullie samen naar buiten kijken. Ergens beneden begint iemand zachte muziek te spelen, nauwelijks hoorbaar door de muren, maar genoeg om de kamer een beetje magisch te maken. Hij leunt tegen je aan, zijn adem warm tegen je nek, en je voelt hem glimlachen zonder dat je hoeft te kijken.",
                choices: [
                    { label: "Trek hem overeind om te dansen", next: "ending_dans" },
                    { label: "Maak twee warme chocolademelk", next: "ending_chocomelk" }
                ]
            },
            ending_boek: {
                text: "Je leest voor, zachtjes, terwijl de regen buiten blijft tikken en het kaarslicht warm over jullie beiden valt. Hij legt zijn hoofd op jouw schouder, dichter dan eerst, zijn hand rustend op jouw borst waar hij jouw hart kan voelen kloppen. Langzaam luistert hij niet meer naar de woorden, alleen naar jouw stem, naar de warmte die tussen jullie hangt. Het boek zakt vergeten op de bank terwijl hij zijn gezicht optilt naar het jouwe, zijn ogen donker en zacht in het kaarslicht, en de afstand tussen jullie kleiner wordt tot hij er niet meer is. De rest van de avond hebben jullie geen boek meer nodig — alleen elkaar, de kaars die langzaam opbrandt, en een stilte die alles zegt wat woorden niet konden.",
                ending: true,
                endingId: "ending_boek"
            },
            ending_gesprek: {
                text: "Jullie praten uren, over kleine dingen en grote dromen, over herinneringen die je nog nooit hardop had uitgesproken. Het kaarslicht wordt kleiner en zachter, maar de ruimte tussen jullie wordt juist kleiner op een andere manier — zijn knieën tegen de jouwe, zijn hand die blijft liggen waar jij hem neerlegt. Ergens tussen een zin over vroeger en een stilte die net iets te lang duurt, kijken jullie elkaar aan op een manier die niets meer met praten te maken heeft. Geen enkele stilte voelt ongemakkelijk. Sommige avonden hoeven nergens heen te leiden om perfect te zijn — en deze eindigt met zijn hoofd tegen jouw schouder, jouw arm om hem heen, en het gevoel dat jullie precies zijn waar jullie moeten zijn.",
                ending: true,
                endingId: "ending_gesprek"
            },
            ending_dans: {
                text: "Jullie dansen midden in de woonkamer, onhandig en lachend eerst, op muziek die eigenlijk van de buren komt en veel te snel is voor het moment. Maar dan vertraagt het, of vertragen jullie, en ineens is het niet meer grappig maar zacht — zijn armen om jouw nek, jouw handen op zijn rug, zijn wang tegen de jouwe. De regen buiten, jullie twee binnen, dichter bij elkaar dan het dansen eigenlijk vereist. Niemand zegt iets. Niemand hoeft iets te zeggen. Meer heeft deze avond niet nodig — alleen dit, alleen jullie, tot de muziek allang gestopt is en jullie nog steeds bewegen.",
                ending: true,
                endingId: "ending_dans"
            },
            ending_chocomelk: {
                text: "De chocolademelk dampt zacht in jullie handen terwijl de regen buiten aanhoudt, een rustig ritme tegen het glas. Hij schuift dichter naar je toe op de bank, zijn schouder tegen de jouwe, en jullie praten over niets en alles tegelijk terwijl de warme mokken langzaam afkoelen. Op een gegeven moment stopt het gesprek vanzelf — niet omdat er niets meer te zeggen is, maar omdat er even niets gezegd hoeft te worden. Zijn hand vindt de jouwe rond de warme mok, zijn duim die zachtjes over je knokkels streelt, en jullie kijken samen naar de regen tot de mokken allang leeg zijn en het niet meer uitmaakt hoe laat het is.",
                ending: true,
                endingId: "ending_chocomelk"
            }
        }
    },
    {
        id: "everest",
        icon: "🏔️",
        title: "Het Dak van de Wereld",
        description: "Een gevaarlijke klim naar het hoogste punt op aarde — samen, stap voor stap.",
        startNodeId: "start",
        nodes: {
            start: {
                text: "Basiskamp op 5.364 meter voelt als een andere planeet — ijl, kil, en indrukwekkend stil, op het geluid van wapperende tentdoeken en het gekraak van het ijs onder jullie voeten na. Boven jullie torent de Khumbu-icefall, een chaotische wirwar van torenhoge ijsblokken die jullie de komende dagen moeten doorkruisen. De gids waarschuwt: dit is geen berg die fouten vergeeft. Hij pakt jouw hand vast. 'Klaar?'",
                choices: [
                    { label: "Vertrek meteen, vol adrenaline", next: "vroege-start" },
                    { label: "Wacht eerst een dag om te acclimatiseren", next: "acclimatiseren" }
                ]
            },
            "vroege-start": {
                text: "Jullie zetten door, sneller dan de gids had aangeraden, de ijzeren ladders over de spleten in de icefall balancerend terwijl de zon nog laag staat. Halverwege begint de wind aan te wakkeren — eerst zacht, dan fel genoeg om sneeuw in scherpe vlagen tegen jullie gezichten te blazen. Een sneeuwstorm trekt sneller op dan voorspeld, en de route naar Kamp 1 verdwijnt in wit.",
                choices: [
                    { label: "Zoek dekking en wacht de storm uit", next: "ending_storm_wachten" },
                    { label: "Zet door, probeer de storm voorbij te komen", next: "ending_storm_door" }
                ]
            },
            acclimatiseren: {
                text: "Jullie wachten een dag in basiskamp, zoals geadviseerd, en gebruiken de tijd om te wandelen naar een uitkijkpunt boven het kamp. De lucht is helder, ijl, en de aanblik van de top in de verte — nog dagen ver weg — laat een steek van ontzag en angst tegelijk door je heen gaan. De volgende ochtend, uitgerust en scherp, bereiken jullie de rand van de icefall, waar een lange ladder over een bodemloze spleet ligt.",
                choices: [
                    { label: "Steun op elkaar en loop samen over de ladder", next: "ending_ladder_samen" },
                    { label: "Laat hem eerst gaan en volg zodra hij veilig is", next: "ending_col_stilte" }
                ]
            },
            ending_storm_wachten: {
                text: "Jullie duiken achter een rotsblok, dicht tegen elkaar aan, terwijl de storm om jullie heen raast. Zichtbaarheid nul, wind die aan je jas rukt, sneeuw die in je nek kruipt — maar zijn arm om je heen, zijn stem die 'we redden het wel' blijft herhalen, is het enige dat telt. Na wat een eeuwigheid lijkt, luwt de storm, en de lucht klaart op tot een verbluffend heldere hemel vol sterren, de top van Everest een silhouet tegen de maan. Jullie bereiken die dag Kamp 1 niet, maar jullie hebben elkaar, en op dit moment is dat meer dan genoeg. Morgen proberen jullie het opnieuw — samen, zoals het hoort.",
                ending: true,
                endingId: "ending_storm_wachten"
            },
            ending_storm_door: {
                text: "Jullie zetten door, hoofd gebogen tegen de wind, elkaars hand een houvast in het niets. De route is amper zichtbaar, maar hij kent elk baken, elke vlag, en na wat voelt als uren van pure vastberadenheid doemt Kamp 1 op uit de sneeuwjacht als een baken van oranje tenten. Uitgeput, doorweekt, maar levend vallen jullie naar binnen, lachend om de absurditeit van wat jullie net hebben doorstaan. Dagen later, wanneer jullie eindelijk de top bereiken, is het deze storm die jullie je zullen herinneren als het moment dat jullie wisten: samen overleven jullie alles. Het uitzicht vanaf de top, boven de wolken, is adembenemend — maar niet mooier dan het moment dat jullie elkaar door die storm heen vasthielden.",
                ending: true,
                endingId: "ending_storm_door"
            },
            ending_ladder_samen: {
                text: "Jullie zetten samen een stap op de wiebelende ladder, zijn hand stevig om de jouwe, jullie ogen gericht op elkaar in plaats van op de duizelingwekkende diepte onder jullie voeten. Stap voor stap, ademhaling voor ademhaling, bereiken jullie de overkant — en pas dan durf je terug te kijken naar de afgrond die jullie zojuist overwonnen. De dagen erna verlopen soepel: acclimatisatie, geduld, en een groeiend vertrouwen in elkaar en in de berg. Wanneer jullie uiteindelijk, weken later, samen op de top staan — het dak van de wereld onder jullie voeten, de wolken ver beneden — is er geen twijfel dat jullie dit alleen zo ver hadden gehaald omdat jullie het samen deden.",
                ending: true,
                endingId: "ending_ladder_samen"
            },
            ending_col_stilte: {
                text: "Je laat hem voorgaan over de ladder, je hart in je keel tot hij veilig aan de overkant staat en naar je terugknikt. Wanneer jij oversteekt, voel je zijn ogen op je, zijn stem die je rustig door elke stap praat. Aan de overkant, boven de icefall, ligt een stille col waar de wind voor even gaat liggen. Jullie staan daar samen, uitgeput en stil, terwijl de zon achter de bergketen zakt en de sneeuw goud kleurt. Geen van jullie zegt iets — de stilte, de hoogte, en elkaars aanwezigheid zijn genoeg. Het is niet de top, maar het is een van die momenten die je voor altijd bijblijft: alleen jullie twee, boven de wolken, precies waar jullie moeten zijn.",
                ending: true,
                endingId: "ending_col_stilte"
            }
        }
    },
    {
        id: "maanrijk",
        icon: "🌠",
        title: "Vijf Vallende Sterren",
        description: "Een stil bankje in een klein bos, een hemel vol sterren, en jullie samen.",
        startNodeId: "start",
        nodes: {
            start: {
                text: "Jullie lopen het kleine bos in, de bladeren zacht knisperend onder je voeten, tot jullie het bankje bereiken — half verscholen tussen de bomen, met net genoeg opening in de takken om de hemel te zien. Het is stil, op het geritsel van blaadjes en het zachte gezoem van de nacht na. Hij gaat zitten en klopt op de plek naast zich. Boven jullie strekt de hemel zich uit, helder en vol sterren, wachtend tot jullie omhoog kijken.",
                choices: [
                    { label: "Leg je hoofd op zijn schouder", next: "schouder" },
                    { label: "Wijs meteen naar de helderste ster die je ziet", next: "eerste-ster" }
                ]
            },
            schouder: {
                text: "Je legt je hoofd op zijn schouder en hij slaat een arm om je heen, alsof het de gewoonste beweging ter wereld is. Jullie zeggen niets, kijken gewoon omhoog, terwijl je ogen langzaam wennen aan het donker en er steeds meer sterren tevoorschijn komen — eerst tientallen, dan honderden. De nacht voelt groot en jullie voelen klein, maar op de goede manier. Dan, zonder waarschuwing, schiet er een streep licht over de hemel.",
                choices: [
                    { label: "Doe je ogen dicht en maak een wens", next: "ending_wens" },
                    { label: "Vertel hem zachtjes wat je voelt", next: "ending_woorden" }
                ]
            },
            "eerste-ster": {
                text: "Je wijst enthousiast naar de helderste ster die je ziet, en hij lacht — die lach die je al zo lang kent en nog steeds elke keer verrast. 'Die is er altijd,' zegt hij, 'dat is geen vallende ster, dat is gewoon een planeet.' Jullie liggen allebei achterover op de bank, hoofden dicht bij elkaar, en beginnen de sterren hardop te tellen, steeds sneller, steeds lacherig, tot het tellen zelf niet meer belangrijk is. Dan valt de eerste echte ster.",
                choices: [
                    { label: "Blijf hardop tellen, bij elke ster die valt", next: "ending_tellen" },
                    { label: "Draai je hoofd naar hem toe en kus hem", next: "ending_kus" }
                ]
            },
            ending_wens: {
                text: "De eerste ster valt, dan de tweede, dan de derde — elke keer hou je je adem in, maak je in gedachten een wens die je nooit hardop zou durven zeggen. Bij de vierde ster lach je al, ongelovig dat dit echt gebeurt, dat de hemel vanavond zo vrijgevig is. Dan, na een lange stilte, valt de vijfde — langzamer dan de rest, langer, feller, een streep licht die de hele hemel lijkt te doorklieven voor hij dooft. Je ademt niet. Er is geen woord voor wat je voelt, alleen de zekerheid dat je dit nooit meer zult vergeten, en dat je hem, hier, op dit bankje, nooit meer wilt loslaten.",
                ending: true,
                endingId: "ending_wens"
            },
            ending_woorden: {
                text: "Je fluistert wat je voelt, zachtjes, bijna bang dat de woorden te groot zijn voor de stilte om jullie heen. Hij zegt niets terug, maar zijn arm trekt je dichter, en dat is antwoord genoeg. De sterren blijven vallen — één, twee, drie, vier — elke keer een streep licht die jullie allebei zien en waar geen van beiden iets over zegt. Dan valt de vijfde, en die is anders: trager, helderder, alsof hij expres langer blijft hangen. Je voelt zijn adem stokken naast je. Geen van jullie zegt iets. Er is niets te zeggen — alleen dit bankje, dit bos, deze hemel, en het gevoel dat dit precies is hoe het hoort te voelen.",
                ending: true,
                endingId: "ending_woorden"
            },
            ending_tellen: {
                text: "Je blijft hardop tellen, bij elke ster die valt — 'één... twee...' — je stem steeds zachter na elke nieuwe streep licht. Bij de derde ster lachen jullie geen van beiden meer, alleen nog stil ademhalen, ogen wijd open naar boven. De vierde ster valt langzamer dan de rest, en jullie grijpen elkaars hand zonder het te beseffen. Dan komt de vijfde — en die is zo mooi dat het tellen vanzelf stopt, dat er geen woorden meer zijn, alleen een gevoel dat groter is dan alles wat je ooit hebt meegemaakt. Je kijkt naar hem, hij kijkt naar jou, en jullie weten geen van beiden hoelang jullie daarna nog stil zijn blijven zitten.",
                ending: true,
                endingId: "ending_tellen"
            },
            ending_kus: {
                text: "Je draait je hoofd naar hem toe en kust hem, zomaar, midden in de stilte van het bos. Hij kust je terug alsof hij daar de hele avond op gewacht had. Als jullie eindelijk weer omhoog kijken, valt precies op dat moment een ster — dan nog een, en nog een. Bij de vierde liggen jullie allebei achterover, handen ineen, lachend om niets. Dan valt de vijfde, langzaam en fel, en voor een paar seconden bestaat er niets anders dan die streep licht, zijn hand in de jouwe, en het gevoel dat dit — precies dit — het mooiste moment is dat je ooit hebt meegemaakt.",
                ending: true,
                endingId: "ending_kus"
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
