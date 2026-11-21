const assert = require('node:assert/strict'), fs = require('node:fs'), ts = require('typescript');
const cache = {};
let stored = { tasks: [], notes: [], habits: [], customEvents: [], quickLinks: [], coreRevision: 0, workspacePreferences: [{ id: 'display', textSize: 'large', reduceMotion: false, contrast: 'standard' }] };
const mocks = {
  'next/server': { NextResponse: { json: (body, options = {}) => ({ body, status: options.status || 200 }) } },
  '@/lib/auth': { auth: async () => ({ user: { email: 'owner@example.test' } }) },
  '@/lib/db': { getDatabaseStatus: () => ({ configured: true }), getUserWorkspace: async () => structuredClone(stored), saveUserWorkspace: async (email, value, fields, merge, revision) => {
    assert.equal(email, 'owner@example.test');
    if (revision !== stored.coreRevision) return { success: false, conflict: true };
    stored = { ...stored, ...Object.fromEntries(fields.filter(key => value[key] !== undefined).map(key => [key, value[key]])), coreRevision: revision + 1 };
    return { success: true, source: 'mock' };
  } }
};
function load(file) {
  if (cache[file]) return cache[file].exports;
  const m = { exports: {} }; cache[file] = m;
  new Function('require', 'module', 'exports', ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText)(name => mocks[name] || (name.startsWith('@/') ? load(name.slice(2) + '.ts') : require(name)), m, m.exports);
  return m.exports;
}
async function main() {
  const { appendTimeAuditKeywords, validTimeAuditCategories } = load('lib/timeAuditPreferences.ts');
  const { validWorkspacePreference } = load('lib/workspacePreferences.ts');
  const { collectionDiff } = load('lib/collectionChanges.ts');
  const api = load('app/api/user-data/route.ts');
  const categories = [{ id: 'social', name: 'Social Media', color: '#123456', keys: ['gaming', 'reels'] }, { id: 'games', name: 'Games / Gaming', color: '#abc', keys: ['gaming'] }];
  assert(validTimeAuditCategories(categories));
  const unchanged = JSON.stringify(categories);
  const typed = appendTimeAuditKeywords(categories, {social:'  NEW KEYWORD  ',games:'C++'});
  assert.deepEqual(typed[0].keys, ['gaming','reels','new keyword']);
  assert.deepEqual(typed[1].keys, ['gaming','c++']);
  assert.equal(JSON.stringify(categories), unchanged);
  assert.deepEqual(appendTimeAuditKeywords(typed, {social:'NEW KEYWORD',games:'   '}), typed);
  assert.throws(()=>appendTimeAuditKeywords(categories,{social:'x'.repeat(201)}),/200/);
  assert.throws(()=>appendTimeAuditKeywords([{...categories[0],keys:Array(500).fill('existing')}],{social:'new'}),/500/);
  assert(validWorkspacePreference({ id: 'time-audit', categories }));
  for (const bad of [[], [...categories, categories[0]], [{ ...categories[0], color: 'red' }], [{ ...categories[0], keys: [''] }], [{ ...categories[0], keys: Array(501).fill('x') }]]) assert(!validTimeAuditCategories(bad));
  const post = (revision, preferences, before = []) => api.POST({ json: async () => ({ expectedAccount: 'owner@example.test', expectedCoreRevision: revision, workspacePreferences: preferences, collectionChanges: { workspacePreferences: collectionDiff(before, preferences) } }) });
  const pref = { id: 'time-audit', categories: typed };
  assert.equal((await post(0, [pref])).status, 200);
  assert.equal(stored.workspacePreferences.find(row => row.id === 'display').textSize, 'large');
  const deviceB = await api.GET();
  assert.deepEqual(deviceB.body.data.workspacePreferences.find(row => row.id === 'time-audit'), pref);
  const updated = { ...pref, categories: categories.map(row => row.id === 'social' ? { ...row, keys: ['gaming', 'reels', 'routino'] } : row) };
  assert.equal((await post(1, [updated], [pref])).status, 200);
  const after = structuredClone(stored);
  assert.equal((await post(1, [pref], [updated])).status, 409);
  assert.deepEqual(stored, after);
  assert.equal((await post(2, [{ id: 'time-audit', categories: [] }])).status, 400);
  assert.deepEqual(stored, after);
  console.log('Passed: account category save/read across devices, cross-category keywords, validation, unrelated preference preservation and stale-device rejection (mock database only).');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
