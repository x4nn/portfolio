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

// Shared month/budget constants - used by the calendar and cheques/payments pages so the
// "recent months" range and default amounts always stay in sync.
const MONTHS_TO_DISPLAY = 12;
const MONTHS_BEFORE_CURRENT = Math.floor(MONTHS_TO_DISPLAY / 2);
const WEEKLY_DAYS = 7;
const DEFAULT_WEEKLY_BUDGET = 100;
const DEFAULT_MONTHLY_CHEQUES_AMOUNT = 200;

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

function getRoleLabel(roleKey, users = DEFAULT_USERS) {
    const normalizedRole = normalizeRoleKey(roleKey);
    const user = (users || []).find((entry) => getRoleKeyFromUser(entry) === normalizedRole);
    return ROLE_LABELS[normalizedRole] || user?.name || normalizedRole;
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

function buildRemotePayload(assignments, users = DEFAULT_USERS, assignmentMeta = {}, weeklyBudget = 0, monthlyChequesAmounts = {}, singlePayerTracking = {}) {
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
        weeklyBudget: Number(weeklyBudget) || 0,
        monthlyChequesAmounts: monthlyChequesAmounts && typeof monthlyChequesAmounts === "object" ? monthlyChequesAmounts : {},
        singlePayerTracking: singlePayerTracking && typeof singlePayerTracking === "object" ? singlePayerTracking : {}
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

    nextState.monthlyChequesAmounts = remoteData?.monthlyChequesAmounts && typeof remoteData.monthlyChequesAmounts === "object"
        ? remoteData.monthlyChequesAmounts
        : {};

    nextState.singlePayerTracking = remoteData?.singlePayerTracking && typeof remoteData.singlePayerTracking === "object"
        ? remoteData.singlePayerTracking
        : {};

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

// ---------- Month helpers (shared across the calendar, cheques and payments pages) ----------

function getMonthKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
}

function parseMonthKey(monthKey) {
    const [year, month] = monthKey.split("-").map(Number);
    return new Date(year, month - 1, 1);
}

function addMonths(date, amount) {
    const nextDate = new Date(date);
    nextDate.setMonth(nextDate.getMonth() + amount);
    return nextDate;
}

function formatMonthLabel(monthKey) {
    const monthDate = parseMonthKey(monthKey);
    return monthDate.toLocaleDateString("nl", { month: "long", year: "numeric" });
}

function formatCurrency(value) {
    return `€${Number(value || 0).toFixed(2)}`;
}

// Money amounts derived from division (e.g. a weekly budget split over 7 days) can end up with
// long floating-point tails (100 / 7 = 14.285714285714286) - round those to whole cents as soon
// as they're computed, so every downstream calculation and saved value stays exact to the cent.
function roundToCents(value) {
    return Math.round((Number(value) || 0) * 100) / 100;
}

function getRecentMonthOptions() {
    const options = [];
    const startDate = new Date();

    for (let step = 0; step < MONTHS_TO_DISPLAY; step += 1) {
        const monthOffset = step - MONTHS_BEFORE_CURRENT;
        options.push(getMonthKey(addMonths(startDate, monthOffset)));
    }

    return options;
}

// ---------- Payment breakdown helpers (how many days, how much is owed, how much cheques cover) ----------

function countAssignmentsForMonth(assignments, monthKey) {
    const monthAssignments = assignments?.[monthKey] || {};
    const counts = { you: 0, mom: 0, dad: 0 };

    Object.values(monthAssignments).forEach((assignment) => {
        if (counts[assignment] !== undefined) {
            counts[assignment] += 1;
        }
    });

    return counts;
}

function getPaymentBreakdown(assignments, monthKey, weeklyBudget) {
    const counts = countAssignmentsForMonth(assignments, monthKey);
    const totalPaidDays = counts.mom + counts.dad;
    const normalizedWeeklyBudget = Number(weeklyBudget) || 0;
    const dailyRate = normalizedWeeklyBudget > 0 ? normalizedWeeklyBudget / WEEKLY_DAYS : 0;

    return {
        counts,
        totalPaidDays,
        weeklyBudget: normalizedWeeklyBudget,
        dailyRate,
        momShare: roundToCents(counts.mom * dailyRate),
        dadShare: roundToCents(counts.dad * dailyRate)
    };
}

function getMonthlyChequesAmount(monthlyChequesAmounts, monthKey) {
    const storedValue = monthlyChequesAmounts?.[monthKey];
    return Number.isFinite(Number(storedValue)) && storedValue !== undefined && storedValue !== null
        ? Number(storedValue)
        : DEFAULT_MONTHLY_CHEQUES_AMOUNT;
}

// How much of a person's amount owed for the month is covered by the cheques budget, based on
// their share of the total paid days. Used by both the cheques page and the payments page so the
// "cheques share" number always means the same thing in both places.
function getChequesShareForRole(paymentBreakdown, monthlyChequesAmount, role) {
    const { counts, totalPaidDays } = paymentBreakdown;
    const amountOwed = role === "mom" ? paymentBreakdown.momShare : paymentBreakdown.dadShare;
    const chequesShare = roundToCents(totalPaidDays > 0 ? monthlyChequesAmount * (counts[role] / totalPaidDays) : 0);
    const remaining = roundToCents(Math.max(amountOwed - chequesShare, 0));
    const coveragePercentage = amountOwed > 0 ? Math.min(Math.round((chequesShare / amountOwed) * 100), 100) : 100;

    return { role, days: counts[role], chequesShare, amountOwed, remaining, coveragePercentage };
}

// ---------- Single-payer tracking (Mama gets all the cheques and self-reports how much she has
// used and how much netto has already been paid to her and to Papa) ----------

function getSinglePayerTrackingForMonth(singlePayerTracking, monthKey) {
    const monthTracking = singlePayerTracking?.[monthKey] || {};
    const momTracking = monthTracking.mom || {};
    const dadTracking = monthTracking.dad || {};

    return {
        mom: {
            chequesUsed: roundToCents(momTracking.chequesUsed),
            nettoPaid: roundToCents(momTracking.nettoPaid)
        },
        dad: {
            nettoPaid: roundToCents(dadTracking.nettoPaid)
        }
    };
}

// A role only counts as "tracked" for a month once one of its fields has actually been saved -
// this is what lets the history badge tell "nothing filled in yet" apart from "filled in as €0",
// since both would otherwise look like a zero balance.
function isSinglePayerRoleTrackedForMonth(singlePayerTracking, monthKey, role) {
    return Boolean(singlePayerTracking?.[monthKey]?.[role]);
}

// What's still owed netto (outside the cheques) to a person for the month: their calendar share,
// minus cheques already used (Mama only - Papa can't use cheques), minus netto already paid.
function getSinglePayerNettoRemaining(paymentBreakdown, role, tracking) {
    const amountOwed = role === "mom" ? paymentBreakdown.momShare : paymentBreakdown.dadShare;
    const chequesUsed = role === "mom" ? tracking.chequesUsed : 0;
    return roundToCents(Math.max(amountOwed - chequesUsed - tracking.nettoPaid, 0));
}
