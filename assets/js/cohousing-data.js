const DATABASE_URL = "https://co-housing-e2c00-default-rtdb.europe-west1.firebasedatabase.app/co-housing.json";
const ROLE_INDEX_BY_ROLE = {
    dad: 1,
    mom: 2
};
const ROLE_TO_USER_NAME = {
    you: "xan",
    mom: "mom",
    dad: "dad"
};

const ROLE_LABELS = {
    you: "Xan",
    mom: "Mama",
    dad: "Papa",
    luna: "Luna"
};

// Placeholder shown only before the app has ever successfully reached the shared database
// (very first load, or the database being unreachable) - real names/colors/flags/passwords
// always come from the database once it's reachable. Deliberately has no `password` field:
// login must succeed against the real database, never silently fall back to a stale local guess.
const DEFAULT_USERS = [
    { name: "xan", color: "#3498db", showOnCalendarPage: true, showOnReminderPage: true },
    { name: "dad", color: "#e74c3c", showOnCalendarPage: true, showOnReminderPage: true },
    { name: "mom", color: "#2ecc71", showOnCalendarPage: true, showOnReminderPage: true },
    { name: "luna", color: "#caa6f5", showOnCalendarPage: false, showOnReminderPage: true }
];

function normalizeRoleKey(roleKey) {
    const normalizedRole = String(roleKey || "").toLowerCase();

    if (normalizedRole === "xan" || normalizedRole === "jij" || normalizedRole === "you") {
        return "you";
    }

    if (normalizedRole === "mama" || normalizedRole === "mom") {
        return "mom";
    }

    if (normalizedRole === "papa" || normalizedRole === "dad") {
        return "dad";
    }

    return normalizedRole;
}

function getRoleKeyFromUser(user) {
    return normalizeRoleKey(user?.name || user?.role || "");
}

function getRoleIndex(role, users = DEFAULT_USERS) {
    const normalizedRole = role === "xan" ? "you" : role;
    const userName = ROLE_TO_USER_NAME[normalizedRole];
    const index = (users || []).findIndex((user) => user?.name === userName);

    if (index >= 0) {
        return index;
    }

    if (role === "dad") {
        return ROLE_INDEX_BY_ROLE.dad;
    }

    if (role === "mom") {
        return ROLE_INDEX_BY_ROLE.mom;
    }

    return 0;
}

function getRoleFromIndex(index) {
    if (Number(index) === ROLE_INDEX_BY_ROLE.dad) {
        return "dad";
    }

    if (Number(index) === ROLE_INDEX_BY_ROLE.mom) {
        return "mom";
    }

    return "you";
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

async function loadUsersForLogin() {
    const remoteData = await loadDashboardData();

    if (!Array.isArray(remoteData?.users) || !remoteData.users.length) {
        throw new Error("No users found in the shared database");
    }

    return remoteData.users;
}

function buildRemotePayload(assignments, users = DEFAULT_USERS, assignmentMeta = {}, weeklyBudget = 0) {
    const selectedDays = {};

    Object.entries(assignments || {}).forEach(([monthKey, monthAssignments]) => {
        const monthDays = {};
        const monthMeta = assignmentMeta[monthKey] || {};

        Object.entries(monthAssignments || {}).forEach(([dayNumber, role]) => {
            if (!role) {
                return;
            }

            const dayMeta = monthMeta[dayNumber];
            const dayPayload = { u: getRoleIndex(role, users) };

            if (dayMeta?.lastChangedByRole) {
                dayPayload.changedBy = getRoleIndex(dayMeta.lastChangedByRole, users);
                dayPayload.changedAt = dayMeta.lastChangedAt || null;
            }

            monthDays[`d${dayNumber}`] = dayPayload;
        });

        if (Object.keys(monthDays).length) {
            selectedDays[monthKey] = monthDays;
        }
    });

    return {
        selectedDays,
        users: Array.isArray(users) && users.length ? users : DEFAULT_USERS,
        weeklyBudget: Number(weeklyBudget) || 0
    };
}

function hydrateStateFromRemoteData(remoteData, localState) {
    const nextState = structuredClone(localState);
    const assignments = {};
    const assignmentMeta = {};
    const users = Array.isArray(remoteData?.users) && remoteData.users.length ? remoteData.users : DEFAULT_USERS;

    nextState.users = users;

    if (Number.isFinite(Number(remoteData?.weeklyBudget))) {
        nextState.weeklyBudget = Number(remoteData.weeklyBudget);
    }

    const selectedDays = remoteData?.selectedDays || {};

    Object.entries(selectedDays).forEach(([monthKey, monthDays]) => {
        if (!assignments[monthKey]) {
            assignments[monthKey] = {};
        }

        if (!assignmentMeta[monthKey]) {
            assignmentMeta[monthKey] = {};
        }

        Object.entries(monthDays || {}).forEach(([dayKey, dayValue]) => {
            const dayNumber = Number(dayKey.replace(/^d/, ""));

            if (!Number.isFinite(dayNumber)) {
                return;
            }

            // Older records stored the day as a bare role index; newer ones store
            // { u, changedBy, changedAt } so we can also show who changed it last.
            const isLegacyDayFormat = typeof dayValue === "number";
            const userIndex = isLegacyDayFormat ? dayValue : dayValue?.u;
            const role = getRoleFromIndex(userIndex);

            if (!role) {
                return;
            }

            assignments[monthKey][dayNumber] = role;

            if (!isLegacyDayFormat && typeof dayValue?.changedBy === "number") {
                assignmentMeta[monthKey][dayNumber] = {
                    lastChangedByRole: getRoleFromIndex(dayValue.changedBy),
                    lastChangedAt: dayValue.changedAt || null
                };
            }
        });
    });

    nextState.assignments = assignments;
    nextState.assignmentMeta = assignmentMeta;
    return nextState;
}
