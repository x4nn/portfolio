const DATABASE_URL = "https://co-housing-e2c00-default-rtdb.europe-west1.firebasedatabase.app/co-housing.json";
const ROLE_TO_USER_NAME = {
    you: "xan",
    mom: "mom",
    dad: "dad"
};

const DEFAULT_USERS = [
    { name: "xan", color: "#3498db" },
    { name: "dad", color: "#e74c3c" },
    { name: "mom", color: "#2ecc71" }
];

function getRoleIndex(role, users = DEFAULT_USERS) {
    const userName = ROLE_TO_USER_NAME[role];
    const index = (users || []).findIndex((user) => user?.name === userName);

    if (index >= 0) {
        return index;
    }

    if (role === "dad") {
        return 1;
    }

    if (role === "mom") {
        return 2;
    }

    return 0;
}

function getRoleFromIndex(index) {
    if (Number(index) === 1) {
        return "dad";
    }

    if (Number(index) === 2) {
        return "mom";
    }

    return "xan";
}

async function loadDashboardData() {
    const response = await fetch(DATABASE_URL);

    if (!response.ok) {
        throw new Error(`Could not load dashboard data: ${response.status}`);
    }

    return response.json();
}

async function saveDashboardData(payload) {
    const response = await fetch(DATABASE_URL, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw new Error(`Could not save dashboard data: ${response.status}`);
    }

    return response.json();
}

function buildRemotePayload(assignments, users = DEFAULT_USERS) {
    const selectedDays = {};

    Object.entries(assignments || {}).forEach(([monthKey, monthAssignments]) => {
        const monthDays = {};

        Object.entries(monthAssignments || {}).forEach(([dayNumber, role]) => {
            if (!role) {
                return;
            }

            monthDays[`d${dayNumber}`] = getRoleIndex(role, users);
        });

        if (Object.keys(monthDays).length) {
            selectedDays[monthKey] = monthDays;
        }
    });

    return {
        selectedDays,
        users: Array.isArray(users) && users.length ? users : DEFAULT_USERS
    };
}

function hydrateStateFromRemoteData(remoteData, localState) {
    const nextState = structuredClone(localState);
    const assignments = {};
    const users = Array.isArray(remoteData?.users) && remoteData.users.length ? remoteData.users : DEFAULT_USERS;

    nextState.users = users;

    const selectedDays = remoteData?.selectedDays || {};

    Object.entries(selectedDays).forEach(([monthKey, monthDays]) => {
        if (!assignments[monthKey]) {
            assignments[monthKey] = {};
        }

        Object.entries(monthDays || {}).forEach(([dayKey, userIndex]) => {
            const dayNumber = Number(dayKey.replace(/^d/, ""));
            const role = getRoleFromIndex(userIndex);

            if (Number.isFinite(dayNumber) && role) {
                assignments[monthKey][dayNumber] = role;
            }
        });
    });

    nextState.assignments = assignments;
    return nextState;
}
