const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
function load(relativePath, mocks = {}) {
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(path.resolve(relativePath), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  new Function("require", "module", "exports", code)(name => name in mocks ? mocks[name] : name.startsWith("@/") ? load(`${name.slice(2)}.ts`, mocks) : require(name), module, module.exports);
  return module.exports;
}
const { monthlyCost, nextRenewal } = load("types/subscriptions.ts");
const { isSubscriptionList, isSubscriptionDate } = load("lib/subscriptionValidation.ts");
const { isAirtelData } = load("lib/airtelValidation.ts");
const { subscriptionExpenses } = load("lib/subscriptionExpenses.ts");
const { subscriptionBundleView } = load("lib/subscriptionBundles.ts");
const { airtelRecharges, airtelTotals } = load("lib/airtelRecharges.ts");
const { subscriptionsFromJournals } = load("lib/subscriptionJournal.ts");
const { nextTaskDueDate, completeRepeatingTask } = load("lib/taskRecurrence.ts");
const { mergeTaskRecords } = load("lib/taskMerge.ts");
const { queueWorkspacePatch } = load("lib/workspacePatch.ts");
const plan = { id: "manual", name: "Example", amount: 1200, currency: "INR", cycle: "yearly", renewalDate: "2024-02-29", status: "active", category: "Other", notes: "" };
assert.equal(monthlyCost(plan), 100);
assert.equal(nextRenewal(plan, "2026-11-16"), "2027-02-28");
assert.equal(nextRenewal({ ...plan, cycle: "monthly", renewalDate: "2026-01-31" }, "2026-02-01"), "2026-02-28");
for (const cycle of ["bundled", "one-time", "unknown"]) assert.equal(monthlyCost({ ...plan, cycle }), 0);
assert.equal(isSubscriptionList([plan]), true);
assert.equal(isSubscriptionList([{ ...plan, status: "completed" }]), true);
assert.equal(isSubscriptionList([plan, plan]), false);
assert.equal(isSubscriptionDate("2026-02-30"), false);
for (const invalid of [{ amount: -1 }, { payments: [null] }, { billingHistory: [{}] }, { bundlePlan: {} }, { renewalDate: "2026-02-30" }]) assert.equal(isSubscriptionList([{ ...plan, ...invalid }]), false);

const journalRow = { id: "future", item: "Airtel", amount: 500, year: 2027, month: 2, day: 3, dateStr: "3-Feb-2027", notes: "" };
const journals = { "2027": { expenses: [journalRow] } };
const original = JSON.stringify(journals);
const rechargePlan = { id: "saved-plan", provider: "Airtel", amount: 500, paymentDate: "2027-02-03", startDate: "2027-02-04", endDate: "2027-02-05", validityDays: 2 };
const saved = { records: [{ id: "2027:future", date: "2027-02-02", amount: 500, kind: "plan", source: "Saved edit", notes: "", paidByOther: false }, { id: "failed", date: "2027-02-01", amount: 500, kind: "plan", source: "Saved", notes: "", paidByOther: false, status: "failed" }], plan: rechargePlan, deletedIds: [] };
assert.equal(isAirtelData(saved), true);
assert.equal(isAirtelData({ ...saved, plan: { ...rechargePlan, validityDays: 84 } }), false);
assert.equal(isAirtelData({ ...saved, records: [null] }), false);
const history = airtelRecharges(journals, saved);
assert.equal(history.length, 2);
assert.equal(history.find(row => row.id === "2027:future").date, "2027-02-02");
assert.equal(airtelTotals(history).total, 500);
assert.equal(airtelTotals(history).failedCount, 1);
assert.equal(airtelRecharges(journals, { ...saved, deletedIds: ["2027:future"] }).length, 1);
assert.equal(JSON.stringify(journals), original);
assert.deepEqual(airtelRecharges({}), []); // No personal snapshots are injected.

const payment = { date: "2027-02-01", amount: 10, journal: "2027", rowId: "payment", notes: "" };
const bundled = { ...plan, cycle: "bundled", bundleRechargeId: rechargePlan.id, bundlePlan: rechargePlan, payments: [payment], billingHistory: [{ date: payment.date, amount: 10 }] };
const view = subscriptionBundleView([bundled], saved, "2027-02-06");
assert.equal(view[0].status, "unconfirmed");
assert.equal(bundled.status, "active");
const expenses = subscriptionExpenses([bundled, { ...plan, id: "shared", bundlePlan: rechargePlan }, { ...plan, id: "usd", currency: "USD", payments: [{ ...payment, amount: 5 }] }]);
assert.equal(expenses.rows.filter(row => row.kind === "recharge").length, 1);
assert.deepEqual(expenses.totals, [{ currency: "INR", amount: 510 }, { currency: "USD", amount: 5 }]);
const imported = subscriptionsFromJournals({ "2027": { expenses: [1, 2, 3].map(month => ({ ...journalRow, id: `music-${month}`, item: "Apple Music", amount: 69, month, day: 23 })) } }, "2027-03-24");
assert.equal(imported[0].cycle, "monthly");
assert.equal(imported[0].startDate, "2027-01-23");

const task = { id: "repeat", title: "Example", checked: false, priority: false, createdAt: 1, meta: "Custom context", dueDate: "2026-01-31", recurrence: { frequency: "monthly", interval: 1 }, subtasks: [{ id: "sub", title: "Step", completed: true }] };
assert.equal(load("lib/taskRecurrence.ts").isTaskRecurrence({ frequency: "weekly", interval: NaN }), false);
assert.equal(load("lib/taskRecurrence.ts").isTaskRecurrence({ frequency: "weekdays", interval: 7 }), false);
assert.equal(nextTaskDueDate(task, "2026-01-31"), "2026-02-28");
const completed = completeRepeatingTask([task], task.id, "2026-01-31", 2);
assert.equal(completed.length, 2); assert.equal(completed[0].checked, true); assert.equal(completed[1].subtasks[0].completed, false);
assert.equal(completed[1].meta, "Custom context");
assert.equal(nextTaskDueDate(completed[1], "2026-02-28"), "2026-03-31");
const unchecked = completeRepeatingTask(completed, task.id, "2026-01-31", 3);
assert.equal(completeRepeatingTask(unchecked, task.id, "2026-01-31", 4).length, 2);
assert.equal(nextTaskDueDate({ ...task, dueDate: "2026-11-13", recurrence: { frequency: "weekdays", interval: 1 } }, "2026-11-13"), "2026-11-16");
assert.equal(nextTaskDueDate({ ...task, recurrence: { frequency: "monthly", interval: 1, until: "2026-02-01" } }, "2026-01-31"), null);
const remote = [{ ...task, id: "remote", title: "New on another device" }, { ...task, id: "a", title: "Old" }];
const changed = mergeTaskRecords(remote, [{ ...task, id: "a", title: "Edited" }], ["a"], []);
assert.equal(changed[0].title, "New on another device"); assert.equal(changed[1].title, "Edited");
const queued = queueWorkspacePatch({ tasks: [{ ...task, id: "a", title: "First edit" }], replaceTaskIds: ["a"], deletedTaskIds: [] }, { tasks: [{ ...task, id: "a", title: "Stale" }, { ...task, id: "b", title: "Second edit" }], replaceTaskIds: ["b"], deletedTaskIds: [] });
assert.equal(queued.tasks.find(task => task.id === "a").title, "First edit");

async function routes() {
  const existing = { tasks: [{ ...task, id: "keep" }], customEvents: [{ id: "event" }], quickLinks: [{ id: "link" }], habits: [{ id: "habit" }], notes: [{ id: "note" }], focusMinutes: 75, soundEnabled: false, activeNav: "Notes", futureField: "preserve", subscriptions: [plan], airtel: saved };
  let stored;
  const mocks = { "next/server": { NextResponse: { json: (body, options) => ({ body, options }) } }, "@/lib/auth": { auth: async () => ({ user: { email: "example@example.test" } }) }, "@/lib/db": { getUserWorkspace: async () => existing, getDatabaseStatus: () => ({ configured: true }), saveUserWorkspace: async (_, value) => { stored = value; return { success: true }; }, saveTrackerWorkspace: async () => ({ success: false, conflict: true }) } };
  const api = load("app/api/user-data/route.ts", mocks);
  await api.POST({ json: async () => ({ subscriptions: [] }) });
  for (const key of Object.keys(existing).filter(key => key !== "subscriptions")) assert.deepEqual(stored[key], existing[key]);
  assert.deepEqual(stored.subscriptions, []);
  await api.POST({ json: async () => ({ focusMinutes: 90 }) }); assert.deepEqual(stored.subscriptions, [plan]);
  const trackerApi = load("app/api/tracker-workspace/route.ts", mocks);
  assert.equal((await trackerApi.PATCH({ json: async () => ({ revision: 0, patch: { subscriptions: [plan] } }) })).options.status, 409);
  assert.equal((await trackerApi.PATCH({ json: async () => ({ revision: 0, patch: { airtel: { records: [null] } } }) })).options.status, 400);
  assert.equal((await api.POST({ json: async () => ({ tasks: [{ id: "invalid", recurrenceTemplate: { title: "Bad" } }] }) })).options.status, 400);
  const externalApi = load("app/api/external-backups/route.ts", { ...mocks, "@/lib/auth": { auth: async () => null } });
  assert.equal((await externalApi.GET({ nextUrl: new URL("https://example.test/api/external-backups") })).options.status, 401);
  assert.equal((await externalApi.POST()).options.status, 401);
  const backupsApi = load("app/api/workspace-backups/route.ts", { ...mocks, "@/lib/auth": { auth: async () => null } });
  assert.equal((await backupsApi.GET({ nextUrl: new URL("https://example.test/api/workspace-backups") })).options.status, 401);
  assert.equal((await backupsApi.POST({ json: async () => ({ action: "restore", id: "private" }) })).options.status, 401);
  const cronApi = load("app/api/cron/workspace-backup/route.ts", { "@/lib/workspaceBackups": { backupAllWorkspaces: async () => { throw new Error("Unauthenticated cron must never reach storage"); } } });
  const previousSecret = process.env.CRON_SECRET;
  process.env.CRON_SECRET = "test-secret";
  try {
    assert.equal((await cronApi.GET(new Request("https://example.test/api/cron/workspace-backup"))).status, 401);
    const failedExternal = load("app/api/cron/workspace-backup/route.ts", { "@/lib/workspaceBackups": { backupAllWorkspaces: async () => 1 }, "@/lib/scheduledExternalBackups": { backupExternalWorkspaces: async () => ({ failed: 1, verified: 0 }) } });
    const cronResult = await failedExternal.GET(new Request("https://example.test/api/cron/workspace-backup", { headers: { authorization: "Bearer test-secret" } }));
    assert.equal(cronResult.status, 503); assert.equal((await cronResult.json()).success, false);
  }
  finally { if (previousSecret === undefined) delete process.env.CRON_SECRET; else process.env.CRON_SECRET = previousSecret; }
  const unauthenticated = load("app/api/tracker-workspace/route.ts", { ...mocks, "@/lib/auth": { auth: async () => null } });
  assert.equal((await unauthenticated.GET()).options.status, 401);
}
routes().then(() => console.log("Passed: tracker validation, imports, editable history, deduplication, bundle expiry, recurring tasks, stale/offline task merging, route authorization and workspace preservation."), error => { console.error(error); process.exitCode = 1; });

// Import preview must never silently add another number or count failed/duplicate payments.
const { previewAirtelImport } = load("lib/airtelImport.ts");
const csvImport = 'date,number,amount,status,kind,notes\n2026-11-10,9000000001,1729,success,plan,"84 days, included benefits"\n2026-11-10,9000000001,1729,success,plan,duplicate\n2026-11-09,9000000002,199,success,topup,other\n2026-11-08,9000000001,49,failed,topup,failed';
const importPreview = previewAirtelImport(csvImport, "9000000001", []);
assert.equal(importPreview.filter(row => !row.excluded).length, 1);
assert.equal(importPreview[0].record.notes, "84 days, included benefits");
assert.match(importPreview[1].excluded, /Duplicate/);
assert.match(importPreview[2].excluded, /Different/);
assert.match(importPreview[3].excluded, /Failed/);
assert.equal(previewAirtelImport(csvImport, "9000000001", [importPreview[0].record]).filter(row => !row.excluded).length, 0);
assert.throws(() => previewAirtelImport(csvImport, "", []));
const pasted = previewAirtelImport('Recharge · PREPAID\n9000000001\n10 Nov 2026 · 3:53 PM\nPaid via Euronet\nSuccess\n₹1,729.00', '9000000001', []);
assert.equal(pasted[0].record.date, '2026-11-10');
assert.equal(pasted[0].record.method, 'Euronet');
assert.equal(pasted[0].record.amount, 1729);
assert.equal(previewAirtelImport('[{"date":"31/2/2026","number":"9000000001","amount":49,"status":"success"}]', '9000000001', [])[0].record, undefined);

const { editTaskOccurrences } = load("lib/taskRecurrence.ts");
const originalTask = { id: 'series', title: 'Original', meta: '', checked: false, createdAt: 1, priority: false, dueDate: '2026-11-17', recurrence: { frequency: 'daily', interval: 1 } };
const originalFuture = { ...originalTask, id: 'future', recurrenceSeriesId: 'series', dueDate: '2026-11-18' };
const historyTask = { ...originalTask, id: 'history', recurrenceSeriesId: 'series', checked: true, dueDate: '2026-11-16' };
const updates = { title: 'Changed', meta: '', priority: true, dueDate: '2026-11-17', recurrence: originalTask.recurrence };
const only = editTaskOccurrences([originalTask, originalFuture, historyTask], 'series', updates, 'occurrence');
assert.equal(only[0].title, 'Changed'); assert.deepEqual(only[1], originalFuture); assert.deepEqual(only[2], historyTask);
const nextOnly = completeRepeatingTask([only[0]], 'series', '2026-11-17', 2);
assert.equal(nextOnly[1].title, 'Original'); assert.equal(nextOnly[1].recurrenceTemplate, undefined);
const future = editTaskOccurrences([originalTask, originalFuture, historyTask], 'series', updates, 'future');
assert.equal(future[1].title, 'Changed'); assert.equal(future[1].dueDate, originalFuture.dueDate); assert.deepEqual(future[2], historyTask);
const { expiryReminders } = load('lib/expiryReminders.ts');
const reminderPlan = { ...rechargePlan, endDate: '2027-02-05' };
assert.equal(expiryReminders([], { records: [], deletedIds: [], plan: reminderPlan }, '2027-02-01').length, 1);
assert.equal(expiryReminders([{ ...plan, cycle: 'bundled', bundleRechargeId: reminderPlan.id, bundleEndDate: reminderPlan.endDate }], { records: [], deletedIds: [], plan: reminderPlan }, '2027-02-01').length, 1);
assert.equal(expiryReminders([], { records: [], deletedIds: [], plan: reminderPlan }, '2026-11-17').length, 0);
console.log('Passed: Airtel import review, occurrence/future editing, completed-history preservation, and expiry reminder deduplication.');

const { workspaceNotifications } = load('lib/workspaceNotifications.ts');
const taskReminder = workspaceNotifications([{ ...originalTask, dueDate: '2026-11-16' }, { ...originalTask, id: 'done', checked: true, dueDate: '2026-11-16' }], [], { records: [], plan: null, deletedIds: [] }, '2026-11-17');
assert.equal(taskReminder.length, 1); assert.equal(taskReminder[0].taskId, originalTask.id);
const { snoozeTask } = load('lib/taskSnooze.ts');
const snoozed = snoozeTask([originalTask], originalTask.id, '2026-11-20', '2026-11-17');
assert.equal(snoozed[0].dueDate, '2026-11-20'); assert.equal(snoozed[0].recurrenceTemplate.dueDate, originalTask.dueDate);
assert.equal(completeRepeatingTask(snoozed, originalTask.id, '2026-11-20', 2)[1].dueDate, '2026-11-21');
assert.equal(snoozeTask(snoozed, originalTask.id, '2026-11-16', '2026-11-17'), snoozed);
const { recordedPayments, monthlySpending } = load('lib/monthlySpending.ts');
const paidService = { ...plan, payments: [{ date: '2026-11-01', amount: 199, journal: 'journal', rowId: 'paid', notes: '' }], billingHistory: [{ date: '2026-11-01', amount: 199 }], bundlePlan: rechargePlan };
const report = monthlySpending(recordedPayments([paidService, { ...plan, id: 'usd', currency: 'USD', payments: [{ date: '2026-11-01', amount: 2, journal: 'journal', rowId: 'usd', notes: '' }] }], { plan: null, deletedIds: [], records: [
  { id: 'paid', date: '2026-11-02', amount: 100, kind: 'plan', status: 'success' },
  { id: 'failed', date: '2026-11-02', amount: 100, kind: 'plan', status: 'failed' },
  { id: 'other', date: '2026-11-02', amount: 100, kind: 'plan', paidByOther: true },
] }), '2026-11');
assert.equal(recordedPayments([paidService, { ...paidService, id: 'duplicate-service' }], { records: [], plan: null, deletedIds: [] }).length, 1);
assert.equal(report.rows.length, 3); assert.equal(report.totals.find(item => item.currency === 'INR').amount, 299); assert.equal(report.totals.find(item => item.currency === 'USD').amount, 2);
const { renewAirtel } = load('lib/airtelRenewal.ts');
const oldPlan = { ...rechargePlan, id: 'old' };
const renewalPlan = { ...rechargePlan, benefits: [{ name: plan.name, planName: 'New tier', using: true }], id: 'new', paymentDate: '2027-02-06', startDate: '2027-02-06', endDate: '2027-02-07', validityDays: 2 };
const bundledService = { ...plan, id: 'bundle', cycle: 'bundled', bundleRechargeId: oldPlan.id };
const renewal = renewAirtel({ plan: oldPlan, records: [], deletedIds: [] }, [bundledService, paidService], renewalPlan, ['bundle'], '2027-02-06');
assert.equal(renewal.subscriptions[0].planName, 'New tier');
assert.deepEqual(renewal.airtel.planHistory, [oldPlan]); assert.equal(renewal.airtel.records.length, 1); assert.equal(renewal.subscriptions[0].bundleRechargeId, 'new'); assert.deepEqual(renewal.subscriptions[1], paidService);
assert.equal(isAirtelData(renewal.airtel), true); assert.equal(isAirtelData({ ...renewal.airtel, planHistory: [null] }), false);
assert.throws(() => renewAirtel({ plan: oldPlan, records: [], deletedIds: [] }, [bundledService], renewalPlan, ['bundle'], '2027-02-05'));
const { encryptBackup, decryptBackup, MAX_BACKUP_BYTES } = load('lib/backupEncryption.ts');
const backupKey = require('node:crypto').randomBytes(32).toString('base64');
const encryptedBackup = encryptBackup('owner@example.test', { tasks: [originalTask], privateText: 'private fixture' }, backupKey);
assert.equal(encryptedBackup.includes('private fixture'), false);
assert.equal(decryptBackup('owner@example.test', encryptedBackup, backupKey).data.tasks[0].title, originalTask.title);
assert.throws(() => decryptBackup('other@example.test', encryptedBackup, backupKey));
const tampered = JSON.parse(encryptedBackup); tampered.ciphertext = Buffer.from('tampered').toString('base64');
assert.throws(() => decryptBackup('owner@example.test', JSON.stringify(tampered), backupKey));
assert.throws(() => encryptBackup('owner@example.test', { text: 'a'.repeat(MAX_BACKUP_BYTES) }, backupKey));
console.log('Passed: notification routing, task snooze cadence, monthly actual payments, recharge renewal preservation, and encrypted-backup isolation/tamper/size checks.');

const { undoRecords, undoMembership } = load('lib/undoRecords.ts');
const taskAfterCompletion = completeRepeatingTask([originalTask], originalTask.id, '2026-11-17', 3);
const extraTask = { ...originalTask, id: 'unrelated', title: 'Later addition' };
assert.deepEqual(undoRecords([...taskAfterCompletion, extraTask], [originalTask], taskAfterCompletion), [originalTask, extraTask]);
assert.deepEqual(undoRecords([extraTask], [originalTask, extraTask], [extraTask]), [originalTask, extraTask]);
assert.equal(undoRecords([{ ...taskAfterCompletion[0], title: 'Changed later' }, taskAfterCompletion[1]], [originalTask], taskAfterCompletion), null);
assert.equal(undoRecords([taskAfterCompletion[0], { ...taskAfterCompletion[1], checked: true }], [originalTask], taskAfterCompletion), null);
assert.deepEqual(undoMembership(['removed', 'later'], [], ['removed']), ['later']);
assert.equal(undoMembership([], [], ['removed']), null);
const { filterPayments, compareMonthlySpending } = load('lib/monthlySpending.ts');
const paymentFixture = [
 { id: 'oct', name: 'Music', date: '2026-10-01', currency: 'INR', amount: 100 },
 { id: 'nov', name: 'Music', date: '2026-11-01', currency: 'INR', amount: 150 },
 { id: 'usd-nov', name: 'Hosting', date: '2026-11-02', currency: 'USD', amount: 2 },
];
assert.deepEqual(filterPayments(paymentFixture, { query: 'music', from: '2026-11-01', maximum: '150', currency: 'INR' }).map(row => row.id), ['nov']);
assert.equal(filterPayments(paymentFixture, { minimum: '200', maximum: '100' }).length, 0);
assert.equal(filterPayments(paymentFixture, { minimum: 'bad' }).length, 0);
const comparison = compareMonthlySpending(paymentFixture, '2026-11');
assert.equal(comparison.previousMonth, '2026-10');
assert.equal(comparison.currencies.find(item => item.currency === 'INR').percent, 50);
assert.equal(comparison.currencies.find(item => item.currency === 'USD').percent, null);
assert.equal(compareMonthlySpending(paymentFixture, '2027-01').previousMonth, '2026-12');
assert.deepEqual(compareMonthlySpending(paymentFixture, '').currencies, []);
async function healthRoutes() {
  const denied = load('app/api/sync-health/route.ts', { 'next/server': { NextResponse: { json: (body, options) => ({ body, options }) } }, '@/lib/auth': { auth: async () => null } });
  assert.equal((await denied.GET()).options.status, 401);
  const health = load('app/api/sync-health/route.ts', {
    'next/server': { NextResponse: { json: (body, options) => ({ body, options }) } }, '@/lib/auth': { auth: async () => ({ user: { email: 'owner@example.test' } }) },
    '@/lib/db': { getDatabaseStatus: () => ({ configured: true, provider: 'neon-postgres' }), getUserWorkspace: async () => { throw new Error('Database offline'); } },
    '@/lib/workspaceBackups': { listWorkspaceBackups: async email => { assert.equal(email, 'owner@example.test'); return [{ createdAt: '2026-11-17' }]; } },
    '@/lib/externalBackups': { externalBackupConfigured: () => true, listExternalBackups: async () => { throw new Error('Storage unavailable'); } },
  });
  const result = await health.GET();
  assert.equal(result.body.database.reachable, false); assert.equal(result.body.snapshots.latestAt, '2026-11-17'); assert.equal(result.body.external.reachable, false);
  assert.equal(result.options.headers['Cache-Control'], 'private, no-store');
}
healthRoutes().then(() => console.log('Passed: selective undo, newer-edit protection, history filters, month comparisons, and isolated sync-health failures.'), error => { console.error(error); process.exitCode = 1; });
const queuedDeletion = queueWorkspacePatch({}, { tasks: [], replaceTaskIds: [], deletedTaskIds: ['restored-task'] });
const queuedRestore = queueWorkspacePatch(queuedDeletion, { tasks: [{ ...originalTask, id: 'restored-task' }], replaceTaskIds: ['restored-task'], deletedTaskIds: [] });
assert.deepEqual(queuedRestore.deletedTaskIds, []);
assert.deepEqual(queuedRestore.replaceTaskIds, ['restored-task']);
assert.equal(queuedRestore.tasks[0].id, 'restored-task');
