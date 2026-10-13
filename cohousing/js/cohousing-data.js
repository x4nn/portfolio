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

// How many months back to walk when carrying an overpayment forward - a personal household ledger
// like this never realistically has an unbroken surplus streak longer than this, so it's a safe
// cap that keeps the calculation bounded instead of walking back indefinitely.
const MAX_CREDIT_LOOKBACK_MONTHS = 24;
const WEEKLY_DAYS = 7;
const DEFAULT_WEEKLY_BUDGET = 100;

// Which payment types each role is allowed to log - Papa can't physically use maaltijdcheques,
// so his card only ever offers "netto" and never shows the type toggle.
const PAYMENT_TYPES_BY_ROLE = {
    mom: ["maaltijd", "netto"],
    dad: ["netto"]
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

function buildRemotePayload(assignments, users = DEFAULT_USERS, assignmentMeta = {}, weeklyBudget = 0, paymentRecords = {}) {
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
        paymentRecords: paymentRecords && typeof paymentRecords === "object" ? paymentRecords : {}
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

    nextState.paymentRecords = remoteData?.paymentRecords && typeof remoteData.paymentRecords === "object"
        ? remoteData.paymentRecords
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

// ---------- Payment records (Mama and Papa each log individual maaltijdcheque/netto payments as
// they happen, instead of typing in one running total) ----------

// Newest first, so the history list on the payments page reads top-to-bottom as a timeline.
function getPaymentRecordsForMonth(paymentRecords, monthKey, role) {
    const records = paymentRecords?.[monthKey]?.[role];
    return Array.isArray(records)
        ? [...records].sort((first, second) => (second.createdAt || 0) - (first.createdAt || 0))
        : [];
}

function sumPaymentRecordsByType(records, type) {
    return roundToCents(records.filter((record) => record.type === type).reduce((total, record) => total + (Number(record.amount) || 0), 0));
}

// Totals used both by the payments page (per-card stats) and the calendar page's history badges.
function getPaymentTotalsForRole(paymentRecords, monthKey, role) {
    const records = getPaymentRecordsForMonth(paymentRecords, monthKey, role);
    const chequesPaid = sumPaymentRecordsByType(records, "maaltijd");
    const nettoPaid = sumPaymentRecordsByType(records, "netto");

    return { records, chequesPaid, nettoPaid, totalPaid: roundToCents(chequesPaid + nettoPaid) };
}

function isRoleTrackedForMonth(paymentRecords, monthKey, role) {
    return getPaymentRecordsForMonth(paymentRecords, monthKey, role).length > 0;
}

// If a person overpays in a month (more logged than they owed), the surplus automatically counts
// as already paid toward the following month instead of just disappearing - this walks forward
// from up to MAX_CREDIT_LOOKBACK_MONTHS ago, chronologically, carrying any running surplus along
// so a streak of overpayments keeps rolling forward correctly. A shortfall never goes negative
// here, so underpaying never carries a debt onto the next month - it just stays owed this month.
function getCarriedCreditForRole(assignments, weeklyBudget, paymentRecords, monthKey, role) {
    const targetMonthDate = parseMonthKey(monthKey);
    let carry = 0;

    for (let stepsBack = MAX_CREDIT_LOOKBACK_MONTHS; stepsBack >= 1; stepsBack -= 1) {
        const priorMonthKey = getMonthKey(addMonths(targetMonthDate, -stepsBack));
        const priorBreakdown = getPaymentBreakdown(assignments, priorMonthKey, weeklyBudget);
        const amountOwed = role === "mom" ? priorBreakdown.momShare : priorBreakdown.dadShare;
        const { totalPaid } = getPaymentTotalsForRole(paymentRecords, priorMonthKey, role);

        carry = roundToCents(Math.max(totalPaid + carry - amountOwed, 0));
    }

    return carry;
}

// What's still owed to a person for the month: their calendar share (minus any credit carried
// forward from an earlier overpayment), minus everything they've already logged this month
// (cheques and netto both count, since both reduce the debt).
function getPaymentRemainingForRole(paymentBreakdown, paymentRecords, monthKey, role, carriedCredit = 0) {
    const amountOwed = role === "mom" ? paymentBreakdown.momShare : paymentBreakdown.dadShare;
    const amountOwedAfterCredit = roundToCents(Math.max(amountOwed - carriedCredit, 0));
    const { totalPaid } = getPaymentTotalsForRole(paymentRecords, monthKey, role);
    return roundToCents(Math.max(amountOwedAfterCredit - totalPaid, 0));
}

// ---------- Payment status (shared by the calendar's history badges and the cheques page's cards) ----------

const PAYMENT_STATUS = {
    NOT_TRACKED: "not-tracked",
    UNPAID: "unpaid",
    PARTIAL: "partial",
    PAID: "paid"
};

const PAYMENT_STATUS_LABELS = {
    [PAYMENT_STATUS.NOT_TRACKED]: "Nog niet ingevuld",
    [PAYMENT_STATUS.UNPAID]: "Nog niet betaald",
    [PAYMENT_STATUS.PARTIAL]: "Gedeeltelijk betaald",
    [PAYMENT_STATUS.PAID]: "Volledig betaald"
};

// Nothing owed (0 days on the calendar) or the remaining amount brought down to €0 both count as
// "paid". Otherwise: no records logged yet is "not tracked", some amount already logged is
// "partial", and nothing logged yet is "unpaid".
function getPaymentStatusForRole(paymentBreakdown, paymentRecords, monthKey, role, carriedCredit = 0) {
    const amountOwed = role === "mom" ? paymentBreakdown.momShare : paymentBreakdown.dadShare;
    const remaining = getPaymentRemainingForRole(paymentBreakdown, paymentRecords, monthKey, role, carriedCredit);

    if (amountOwed <= 0 || remaining <= 0) {
        return PAYMENT_STATUS.PAID;
    }

    if (!isRoleTrackedForMonth(paymentRecords, monthKey, role)) {
        return PAYMENT_STATUS.NOT_TRACKED;
    }

    const amountAlreadyCovered = roundToCents(amountOwed - remaining);
    return amountAlreadyCovered > 0 ? PAYMENT_STATUS.PARTIAL : PAYMENT_STATUS.UNPAID;
}
