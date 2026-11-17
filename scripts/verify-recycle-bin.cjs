const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const { randomUUID } = require('node:crypto');
const { neon } = require('@neondatabase/serverless');
require('@next/env').loadEnvConfig(process.cwd(), true);
function load(file) {
 const module = { exports: {} };
 new Function('require','module','exports',ts.transpileModule(fs.readFileSync(file,'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText)(name => name.startsWith('@/') ? load(`${name.slice(2)}.ts`) : require(name), module, module.exports);
 return module.exports;
}
async function run() {
 const sql = neon(process.env.DATABASE_URL), email = `routino-recycle-test-${randomUUID()}@example.invalid`;
 const owner = process.env.TRACKERS_OWNER_EMAIL.toLowerCase().trim();
 const [ownerBefore] = await sql`SELECT data FROM routino_workspaces WHERE email=${owner}`;
 const store = load('lib/recycleBinStore.ts'), db = load('lib/db.ts');
 await store.ensureRecycleBin();
 const first = { id: 'first', title: 'Deleted fixture', meta: '', checked: false, priority: false, createdAt: 1 };
 const other = { ...first, id: 'other', title: 'Preserve fixture' };
 const note = { id: 'note', title: 'Cipher fixture', content: 'encrypted-ciphertext', encrypted: true };
 const recharge = { id: 'recharge', date: '2026-11-17', amount: 100, kind: 'topup', notes: '', source: 'Fixture', paidByOther: false };
 const subscription = { id: 'service', name: 'Fixture service', amount: 10, currency: 'INR', cycle: 'monthly', renewalDate: '2026-12-17', status: 'active', category: 'Other', notes: '' };
 try {
  const fixture = { tasks: [first, other], notes: [note], habits: [], customEvents: [], quickLinks: [], subscriptions: [subscription], airtel: { records: [recharge], deletedIds: [], plan: null }, trackerRevision: 0, focusMinutes: 25, soundEnabled: true, updatedAt: new Date().toISOString() };
  await sql`INSERT INTO routino_workspaces(email,data) VALUES(${email},${JSON.stringify(fixture)}::jsonb)`;
  const save = await db.saveUserWorkspace(email, { ...fixture, tasks: [other], updatedAt: new Date().toISOString() }, ['tasks','updatedAt'], { incoming: [other], replacedIds: [], deletedIds: ['first'] });
  assert.equal(save.success, true);
  let bin = await store.readRecycleBin(email); assert.equal(bin.entries.length, 1); assert.deepEqual(bin.entries[0].record, first);
  const staleVersion = bin.version;
  const tracker = await db.saveTrackerWorkspace(email, { subscriptions: [], airtel: { records: [], deletedIds: ['recharge','journal-only'], plan: null } }, 0);
  assert.equal(tracker.success, true);
  bin = await store.readRecycleBin(email); assert.equal(bin.entries.length, 4);
  const stale = await store.restoreRecycleEntry(email, bin.entries.find(item => item.kind === 'tasks').id, staleVersion); assert.equal(stale.conflict, true);
  assert.equal((await store.readRecycleBin(owner)).entries.some(item => bin.entries.some(test => test.id === item.id)), false);
  const taskEntry = bin.entries.find(item => item.kind === 'tasks');
  const restored = await store.restoreRecycleEntry(email, taskEntry.id, bin.version); assert.equal(restored.success, true);
  let [current] = await sql`SELECT data FROM routino_workspaces WHERE email=${email}`;
  assert.deepEqual(current.data.tasks.map(task => task.id).sort(), ['first','other']); assert.deepEqual(current.data.notes, [note]);
  assert.equal(current.data.trackerRevision, 2);
  bin = await store.readRecycleBin(email);
  const journal = bin.entries.find(item => item.journalOnly);
  assert.equal((await store.restoreRecycleEntry(email, journal.id, bin.version)).success, true);
  [current] = await sql`SELECT data FROM routino_workspaces WHERE email=${email}`;
  assert.equal(current.data.airtel.deletedIds.includes('journal-only'), false); assert.equal(current.data.airtel.records.length, 0);
  bin = await store.readRecycleBin(email);
  const rechargeEntry = bin.entries.find(item => item.kind === 'airtel');
  assert.equal((await store.restoreRecycleEntry(email, rechargeEntry.id, bin.version)).success, true);
  [current] = await sql`SELECT data FROM routino_workspaces WHERE email=${email}`; assert.deepEqual(current.data.airtel.records, [recharge]);
  const notesSave = await db.saveUserWorkspace(email, { ...current.data, notes: [], updatedAt: new Date().toISOString() }, ['notes','updatedAt']); assert.equal(notesSave.success, true);
  bin = await store.readRecycleBin(email); const noteEntry = bin.entries.find(item => item.kind === 'notes');
  assert.deepEqual(noteEntry.record, note); assert.equal((await store.restoreRecycleEntry(email, noteEntry.id, bin.version)).success, true);
  [current] = await sql`SELECT data FROM routino_workspaces WHERE email=${email}`; assert.deepEqual(current.data.notes, [note]);
  const [ownerAfter] = await sql`SELECT data FROM routino_workspaces WHERE email=${owner}`; assert.deepEqual(ownerAfter.data, ownerBefore.data);
  console.log(JSON.stringify({ recycleBin: 'verified', deletionCaptureAtomic: true, individualTaskRestore: true, rechargeRestore: true, journalUnhide: true, encryptedNotePreserved: true, staleRestoreRejected: true, ownerDataUnchanged: true }));
 } finally {
  await sql`DELETE FROM routino_workspace_backups WHERE email=${email}`;
  await sql`DELETE FROM routino_workspaces WHERE email=${email}`;
 }
}
run().catch(error => { console.error('Recycle Bin verification failed:', error.name, (error.stack || '').split('\n').filter(line => line.includes('verify-recycle-bin.cjs:')).join('\n')); process.exitCode = 1; });
