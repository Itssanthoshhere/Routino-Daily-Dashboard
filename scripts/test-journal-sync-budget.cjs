const assert = require('node:assert/strict'), fs = require('node:fs'), ts = require('typescript');
function loader(mocks = {}) {
  const cache = {};
  return function load(file) {
    if (cache[file]) return cache[file].exports;
    const m = { exports: {} }; cache[file] = m;
    const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX } }).outputText;
    new Function('require', 'module', 'exports', code)(name => name in mocks ? mocks[name] : name.startsWith('@/') ? load(name.slice(2) + '.ts') : require(name), m, m.exports);
    return m.exports;
  };
}
const load = loader();
const { journalBudgetUsage } = load('lib/journalBudget.ts');
const { mergeTrackerSync } = load('lib/trackerSyncState.ts');
const { SEED_TRACKERS_DATA } = load('lib/trackersSeed.ts');
const row = (id, amount, month, year = 2026) => ({ id, amount, month, year, item: id, dateStr: String(year), category: 'Food' });
const journal = { key: '2026', title: '2026 Journal', year: 2026, totalSpent: 999999, totalIncome: 3000, latestBalance: 17, journalSync: 'fresh', summarySync: 'fresh', journalUpdatedAt: '2026-11-01T00:00:00Z', summaryUpdatedAt: '2026-11-01T00:00:00Z', expenses: [row('jan', 100, 1), row('feb', 200, 2), row('credit', 0, 1), row('old', 900, 1, 2025), row('unknown', 500, undefined)], sheetSummary: { sheetName: '2026 Summary', totalSpent: 300, months: [{ month: 1, amount: 80 }, { month: 2, amount: 0 }], categoryTotals: [] } };
assert.equal(journalBudgetUsage(journal, 1, 100).spent, 80, 'monthly Summary, never annual total');
assert.equal(journalBudgetUsage(journal, 1, 100).percent, 80);
assert.equal(journalBudgetUsage(journal, 1, 100).remaining, 20);
assert.equal(journalBudgetUsage(journal, 2, 100).spent, 0, 'explicit Summary zero is authoritative');
assert.equal(journalBudgetUsage(journal, 11, 100).spent, 0, 'no month entries means no recorded spending');
assert.equal(journalBudgetUsage({ ...journal, sheetSummary: undefined }, 1, 100).spent, 100, 'fallback excludes other months, years, unknown months and credits');
assert.equal(journalBudgetUsage({ ...journal, summarySync: 'unavailable' }, 1, 100).spent, 100);
assert.equal(journalBudgetUsage(journal, 1, 0).percent, null, 'no fabricated default budget or division by zero');
assert.equal(journalBudgetUsage(journal, 1, -1).remaining, null);
assert.equal(journalBudgetUsage(journal, 13, 100).available, false);
assert.equal(journalBudgetUsage({ ...journal, journalSync: 'unavailable', sheetSummary: undefined }, 1, 100).spent, null);
assert.equal(journalBudgetUsage({ ...journal, summarySync: 'stale' }, 1, 100).stale, true);
assert.equal(journalBudgetUsage({ ...journal, sheetSummary: undefined }, 2, 100).percent, 200);
const data = j => ({ ...SEED_TRACKERS_DATA, isLive: true, syncAccount: 'owner@example.test', spreadsheetId: 'sheet-a', lastSyncedAt: '2026-11-20T00:00:00Z', journals: { '2026': j }, expenses: j.expenses, budgetSync: 'fresh', totalMonthlyBudget: 100 });
const previous = data(journal), failed = data({ ...journal, journalSync: 'unavailable', summarySync: 'unavailable', expenses: [], totalSpent: 0, totalIncome: 0, latestBalance: null, sheetSummary: undefined, journalUpdatedAt: undefined, summaryUpdatedAt: undefined });
const before = JSON.stringify([previous, failed]);
const merged = mergeTrackerSync(previous, failed);
assert.deepEqual(merged.journals['2026'].expenses, journal.expenses);
assert.equal(merged.journals['2026'].totalSpent, journal.totalSpent);
assert.equal(merged.journals['2026'].journalSync, 'stale');
assert.equal(merged.journals['2026'].summarySync, 'stale');
assert.equal(merged.journals['2026'].journalUpdatedAt, journal.journalUpdatedAt);
assert.deepEqual(merged.expenses, journal.expenses, 'legacy expense consumers receive retained rows');
assert.deepEqual(mergeTrackerSync(merged, failed).journals['2026'], merged.journals['2026'], 'repeated failure retains original success time');
assert.equal(JSON.stringify([previous, failed]), before, 'merge is immutable');
assert.equal(mergeTrackerSync(undefined, failed).journals['2026'].journalSync, 'unavailable');
for (const sourceChange of [{ syncAccount: 'other@example.test' }, { syncAccount: undefined }, { spreadsheetId: 'other-sheet' }, { isLive: false }]) {
  assert.equal(mergeTrackerSync(previous, { ...failed, ...sourceChange }).journals['2026'].expenses.length, 0, 'never retain across account/source/demo changes');
}
const cleared = data({ ...journal, expenses: [], totalSpent: 0, totalIncome: 0, latestBalance: null, sheetSummary: undefined });
assert.equal(mergeTrackerSync(previous, cleared).journals['2026'].expenses.length, 0, 'successful empty sheet clears old rows');
assert.equal(mergeTrackerSync(previous, cleared).journals['2026'].sheetSummary, undefined, 'successful empty Summary clears old pivot');
const recovered = mergeTrackerSync(merged, previous);
assert.equal(recovered.journals['2026'].journalSync, 'fresh');
assert.equal(recovered.journals['2026'].summarySync, 'fresh');
const budgetFailed = mergeTrackerSync(previous, { ...previous, budgetSync: 'unavailable', totalMonthlyBudget: 0, categoryBudgets: [] });
assert.equal(budgetFailed.totalMonthlyBudget, 100); assert.equal(budgetFailed.budgetSync, 'stale');
assert.equal(mergeTrackerSync(previous, { ...previous, totalMonthlyBudget: 0 }).totalMonthlyBudget, 0, 'successful zero budget retained');

const laterTime = '2026-11-20T12:00:00Z', earlierTime = '2026-11-20T11:00:00Z';
const newest = data({ ...journal, journalUpdatedAt: laterTime, summaryUpdatedAt: laterTime });
newest.budgetUpdatedAt = laterTime;
const olderServer = data({ ...journal, journalSync: 'stale', summarySync: 'stale', expenses: [], totalSpent: 0, journalUpdatedAt: earlierTime, summaryUpdatedAt: earlierTime, sheetSummary: { ...journal.sheetSummary, totalSpent: 1 } });
olderServer.budgetUpdatedAt = earlierTime; olderServer.budgetSync = 'stale'; olderServer.totalMonthlyBudget = 1;
const keptNewest = mergeTrackerSync(newest, olderServer);
assert.equal(keptNewest.journals['2026'].totalSpent, journal.totalSpent, 'older warm-server cache cannot erase newer client rows');
assert.equal(keptNewest.journals['2026'].sheetSummary.totalSpent, journal.sheetSummary.totalSpent);
assert.equal(keptNewest.totalMonthlyBudget, newest.totalMonthlyBudget);
const newerEmpty = data({ ...journal, expenses: [], totalSpent: 0, sheetSummary: undefined, journalUpdatedAt: laterTime, summaryUpdatedAt: laterTime });
assert.equal(mergeTrackerSync(newerEmpty, olderServer).journals['2026'].sheetSummary, undefined, 'older response cannot resurrect a successfully cleared Summary');
const successfulLater = data({ ...journal, expenses: [], totalSpent: 0, sheetSummary: undefined, journalUpdatedAt: '2026-11-21T00:00:00Z', summaryUpdatedAt: '2026-11-21T00:00:00Z' });
assert.equal(mergeTrackerSync(newest, successfulLater).journals['2026'].expenses.length, 0, 'newer legitimate clearing still wins');

(async () => {
  // Exercise real sync parsing and account-scoped API cache with mocked Google responses.
  process.env.TRACKERS_SPREADSHEET_ID = 'sheet-a'; process.env.TRACKERS_OWNER_EMAIL = 'owner@example.test';
  let failJournal = false, failSummary = false, empty = false, malformed = false;
  const originalFetch = global.fetch;
  global.fetch = async url => {
    const sheet = new URL(url).searchParams.get('sheet');
    if ((failJournal && sheet === '2026 Expense Journal') || (failSummary && sheet === '2026 Summary')) return { ok: false };
    if (malformed && sheet === '2026 Expense Journal') return { ok: true, text: async () => 'callback({"status":"error"})' };
    let values = [];
    if (!empty && sheet === '2026 Expense Journal') values = [[2026, 'Meal', 100, null, null, 1, 1, '01-Jan-2026', 'Food', '', 50]];
    if (!empty && sheet === '2026 Summary') values = [['Category', 'Item', 1, 'Grand Total'], ['Grand Total', null, 80, 80]];
    const table = { cols: [], rows: values.map(r => ({ c: r.map(v => v === null ? null : { v }) })) };
    return { ok: true, text: async () => `callback(${JSON.stringify({ table })})` };
  };
  try {
    const realSync = loader({ 'server-only': {} })('lib/trackersSync.ts');
    const fresh = await realSync.syncSpreadsheetTrackers();
    assert.equal(fresh.journals['2026'].journalSync, 'fresh'); assert.equal(fresh.journals['2026'].expenses.length, 1);
    failJournal = true; failSummary = true;
    const partial = await realSync.syncSpreadsheetTrackers();
    assert.equal(partial.journals['2026'].journalSync, 'unavailable'); assert.equal(partial.journals['2026'].summarySync, 'unavailable');
    failJournal = false; failSummary = false; malformed = true;
    assert.equal((await realSync.syncSpreadsheetTrackers()).journals['2026'].journalSync, 'unavailable', 'malformed GViz is a failure, not a valid empty journal');
    malformed = false; empty = true;
    const emptySync = await realSync.syncSpreadsheetTrackers();
    assert.equal(emptySync.journals['2026'].journalSync, 'fresh'); assert.equal(emptySync.journals['2026'].summarySync, 'fresh');
    assert.equal(emptySync.journals['2026'].expenses.length, 0);
    let email = 'owner@example.test', result = fresh;
    const route = loader({ 'next/server': { NextResponse: { json: (body, options = {}) => ({ body, status: options.status || 200 }) } }, '@/lib/auth': { auth: async () => email ? { user: { email } } : null }, '@/lib/trackersSync': { GOOGLE_SHEET_ID: 'sheet-a', syncSpreadsheetTrackers: async () => result } })('app/api/trackers/sync/route.ts');
    const request = new Request('http://localhost/api/trackers/sync?force=true');
    assert.equal((await route.GET(request)).body.data.journals['2026'].expenses.length, 1);
    result = partial;
    const apiPartial = await route.GET(request);
    assert.equal(apiPartial.body.data.journals['2026'].journalSync, 'stale'); assert.equal(apiPartial.body.data.expenses.length, 1);
    result = { ...SEED_TRACKERS_DATA, isLive: false };
    assert.equal((await route.GET(request)).status, 503, 'total failure never replaces live data with demo');
    email = 'other@example.test'; assert.equal((await route.GET(request)).status, 403);
    email = null; const demo = await route.GET(request); assert.equal(demo.body.data.isLive, false); assert.equal(demo.body.data.syncAccount, undefined);
    email = 'owner@example.test'; result = emptySync;
    assert.equal((await route.GET(request)).body.data.journals['2026'].expenses.length, 0, 'API accepts successful clearing after failures');
    let calls = 0, release;
    const concurrentRoute = loader({ 'next/server': { NextResponse: { json: body => ({ body }) } }, '@/lib/auth': { auth: async () => ({ user: { email: 'owner@example.test' } }) }, '@/lib/trackersSync': { GOOGLE_SHEET_ID: 'sheet-a', syncSpreadsheetTrackers: () => { calls++; return new Promise(resolve => { release = resolve; }); } } })('app/api/trackers/sync/route.ts');
    const a = concurrentRoute.GET(request), b = concurrentRoute.GET(request);
    await new Promise(setImmediate);
    assert.equal(calls, 1, 'overlapping Overview/Tracker refreshes share one provider fetch');
    release(fresh);
    assert.equal((await a).body.success, true); assert.equal((await b).body.success, true);
  } finally { global.fetch = originalFetch; }
  const React = require('react'), { renderToStaticMarkup } = require('react-dom/server');
  const ui = loader()('components/JournalSummaries.tsx');
  const staleMarkup = renderToStaticMarkup(React.createElement(ui.JournalSourceNotice, { journal: merged.journals['2026'] }));
  assert.match(staleMarkup, /Showing last successful data/); assert.match(staleMarkup, /role="status"/);
  const unavailableMarkup = renderToStaticMarkup(React.createElement(ui.JournalSummaries, { journals: failed.journals, isLive: true, onOpen() {} }));
  assert.match(unavailableMarkup, /No successful data is available yet/);
  assert(!unavailableMarkup.includes('Journal entries'), 'unavailable source must not present a zero entry count');
  assert(!unavailableMarkup.includes('₹0.00'), 'unavailable source must not present zero spending as verified');
  console.log('Passed: monthly Summary/fallback budgets, zero/over-limit/unknown cases, per-source retention and recovery, empty-sheet clearing, immutable merges, real GViz parsing, authenticated cache isolation, and total-failure rejection. Provider responses mocked; no real account writes.');
})().catch(error => { console.error(error); process.exitCode = 1; });
