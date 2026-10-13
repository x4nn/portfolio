const NOTES_DATABASE_URL = "https://co-housing-e2c00-default-rtdb.europe-west1.firebasedatabase.app/notes.json";

async function loadNotesData() {
    const response = await fetch(NOTES_DATABASE_URL);

    if (!response.ok) {
        throw new Error(`Could not load notes data: ${response.status}`);
    }

    return response.json();
}

async function saveNotesData(payload) {
    const response = await fetch(NOTES_DATABASE_URL, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw new Error(`Could not save notes data: ${response.status}`);
    }

    return response.json();
}
