const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

// Run the TypeScript domain helpers without introducing a test-runner dependency.
function load(relativePath, mocks = {}) {
  const filename = path.resolve(relativePath);
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  new Function("require", "module", "exports", code)(name => {
    if (name in mocks) return mocks[name];
    return name.startsWith("@/") ? load(`${name.slice(2)}.ts`, mocks) : require(name);
  }, module, module.exports);
  return module.exports;
}

const { monthlyCost, nextRenewal } = load("types/subscriptions.ts");
const { isSubscriptionList, isSubscriptionDate } = load("lib/subscriptionValidation.ts");
const { subscriptionExpenses } = load("lib/subscriptionExpenses.ts");
const { airtelRecharges, airtelTotals } = load("lib/airtelRecharges.ts");
const { subscriptionsFromJournals, applyJournalCorrections } = load("lib/subscriptionJournal.ts");
const plan = { id: "manual", name: "Example", amount: 1200, currency: "INR", cycle: "yearly", renewalDate: "2024-02-29", status: "active", category: "Other", notes: "" };

assert.equal(monthlyCost(plan), 100);
assert.equal(nextRenewal(plan, "2026-11-16"), "2027-02-28");
assert.equal(nextRenewal({ ...plan, cycle: "monthly", renewalDate: "2026-01-31" }, "2026-02-01"), "2026-02-28");
assert.equal(nextRenewal({ ...plan, cycle: "quarterly", renewalDate: "2026-11-30" }, "2026-12-01"), "2027-02-28");
for (const cycle of ["bundled", "one-time", "unknown"]) assert.equal(monthlyCost({ ...plan, cycle }), 0);
assert.equal(isSubscriptionList([plan]), true);
assert.equal(isSubscriptionList([{ ...plan, status: "completed" }]), true);
assert.equal(subscriptionExpenses([{ ...plan, status: "completed", payments: [{ date: "2026-01-01", amount: 1200 }] }]).totals[0].amount, 1200);
assert.equal(isSubscriptionList([plan, plan]), false);
assert.equal(isSubscriptionDate("2026-02-30"), false);
for (const invalid of [{ amount: -1 }, { payments: [null] }, { billingHistory: [{}] }, { bundlePlan: {} }, { renewalDate: "2026-02-30" }]) {
  assert.equal(isSubscriptionList([{ ...plan, ...invalid }]), false);
}

const journals = { "2027": { expenses: [{ id: "future", item: "Airtel", amount: 1029, year: 2027, month: 2, day: 3, dateStr: "3-Feb-2027", notes: "" }] } };
const before = JSON.stringify(journals);
const history = airtelRecharges(journals);
const totals = airtelTotals(history);
assert.equal(history.some(row => row.date === "2027-02-03"), true);
assert.equal(totals.failedCount, 1);
assert.equal(history.filter(row => row.amount === 199).length, 0);
assert.equal(totals.total, history.filter(row => row.status !== "failed").reduce((sum, row) => sum + row.amount, 0));
assert.equal(JSON.stringify(journals), before);
const currentJournal = { "2026": { expenses: [{ id: "current", item: "Airtel", amount: 1729, year: 2026, month: 11, day: 11, dateStr: "11-Nov-2026", notes: "" }] } };
const currentHistory = airtelRecharges(currentJournal);
assert.equal(currentHistory.filter(row => row.amount === 1729).length, 1);
assert.equal(currentHistory.find(row => row.amount === 1729).date, "2026-11-10");
assert.equal(currentHistory.find(row => row.amount === 1729).journalDate, "2026-11-11");

const payments = [{ date: "2026-10-25", amount: 199, journal: "2026", rowId: "netflix", notes: "" }];
const corrected = applyJournalCorrections([{ ...plan, id: "journal-subscription-netflix", payments }]);
assert.equal(corrected[0].cycle, "bundled");
assert.equal(corrected[0].bundleEndDate, "2027-02-02");
assert.equal(corrected[0].payments, payments);
assert.equal(applyJournalCorrections(corrected)[0], corrected[0]);
assert.equal(isSubscriptionList(corrected), true);
const bundle = corrected[0].bundlePlan;
const expenses = subscriptionExpenses([
  corrected[0],
  { ...plan, id: "another-bundle", bundlePlan: bundle },
  { ...plan, id: "usd", currency: "USD", payments: [{ ...payments[0], amount: 5 }] },
]);
assert.equal(expenses.rows.filter(row => row.kind === "recharge").length, 1);
assert.equal(expenses.rows.find(row => row.id === "journal-subscription-netflix").amount, 199);
assert.deepEqual(expenses.totals, [{ currency: "INR", amount: 1928 }, { currency: "USD", amount: 5 }]);
assert.deepEqual(subscriptionExpenses([]), { rows: [], totals: [] });
const imported = subscriptionsFromJournals({ "2027": { expenses: [1, 2, 3].map(month => ({ id: `music-${month}`, item: "Apple Music", amount: 69, year: 2027, month, day: 23, notes: "" })) } }, "2027-03-24");
assert.equal(imported[0].cycle, "monthly");
assert.equal(imported[0].startDate, "2027-01-23");

async function verifyWorkspacePreservation() {
  const existing = { tasks: [{ id: "task" }], customEvents: [{ id: "event" }], quickLinks: [{ id: "link" }], habits: [{ id: "habit" }], notes: [{ id: "note" }], focusMinutes: 75, soundEnabled: false, activeNav: "Notes", futureField: "preserve", subscriptions: [plan] };
  let saved;
  const api = load("app/api/user-data/route.ts", {
    "next/server": { NextResponse: { json: (body, options) => ({ body, options }) } },
    "@/lib/auth": { auth: async () => ({ user: { email: "example@example.test" } }) },
    "@/lib/db": { getUserWorkspace: async () => existing, getDatabaseStatus: () => ({}), saveUserWorkspace: async (_, value) => { saved = value; return { success: true }; } },
  });
  await api.POST({ json: async () => ({ subscriptions: [] }) });
  for (const key of Object.keys(existing).filter(key => key !== "subscriptions")) assert.deepEqual(saved[key], existing[key]);
  assert.deepEqual(saved.subscriptions, []);
  await api.POST({ json: async () => ({ focusMinutes: 90 }) });
  assert.deepEqual(saved.subscriptions, [plan]);
  const invalid = await api.POST({ json: async () => ({ subscriptions: [{ ...plan, payments: [null] }] }) });
  assert.equal(invalid.options.status, 400);
}
verifyWorkspacePreservation().then(() => console.log("Tracker regression checks passed: validation, renewal math, expenses, imports, Airtel reconciliation, and workspace preservation."), error => { console.error(error); process.exitCode = 1; });
