const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const { randomUUID } = require('node:crypto');
const { neon } = require('@neondatabase/serverless');
require('@next/env').loadEnvConfig(process.cwd(), true);
if (!process.env.DATABASE_URL && fs.existsSync('.env.database.local')) process.env.DATABASE_URL = JSON.parse(fs.readFileSync('.env.database.local', 'utf8').match(/^DATABASE_URL=(.+)$/m)[1]);
function load(file) { const module = { exports: {} }; new Function('require', 'module', 'exports', ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText)(name => name.startsWith('@/') ? load(`${name.slice(2)}.ts`) : require(name), module, module.exports); return module.exports; }
async function run() {
  assert.ok(process.env.DATABASE_URL, 'Configure DATABASE_URL');
  const a = neon(process.env.DATABASE_URL), b = neon(process.env.DATABASE_URL);
  const email = `asset-verification-${randomUUID()}@example.invalid`;
  const db = load('lib/db.ts');
  const document = { id: 'receipt', name: 'Test invoice', url: 'https://example.invalid/receipt.pdf', uploadedAt: new Date().toISOString() };
  const records = { device: { warrantyEnd: '2027-11-18', warrantyReminderDate: '2027-10-19', services: [{ id: 'repair', title: 'Test service', date: '2026-11-18', provider: 'Test shop', cost: 50, notes: '', documents: [document] }] } };
  try {
    await a`INSERT INTO routino_workspaces (email, data) VALUES (${email}, ${JSON.stringify({ tasks: [], notes: [], focusMinutes: 25, trackerRevision: 0 })}::jsonb)`;
    assert.equal((await db.saveTrackerWorkspace(email, { assetRecords: records, assetDocuments: { device: [document] } }, 0)).success, true);
    assert.equal((await db.saveTrackerWorkspace(email, { assetRecords: {} }, 0)).conflict, true);
    await db.saveUserWorkspace(email, { focusMinutes: 45 }, ['focusMinutes']);
    const [saved] = await b`SELECT data FROM routino_workspaces WHERE email = ${email}`;
    assert.deepEqual(saved.data.assetRecords, records);
    assert.deepEqual(saved.data.assetDocuments, { device: [document] });
    assert.equal(saved.data.focusMinutes, 45);
    assert.deepEqual(saved.data.tasks, []);
    assert.equal(saved.data.trackerRevision, 1);
    console.log('Passed: independent database read confirms warranty, services, receipt references, unrelated-field preservation, and stale-write rejection.');
  } finally {
    await a`DELETE FROM routino_workspace_backups WHERE email = ${email}`;
    await a`DELETE FROM routino_workspaces WHERE email = ${email}`;
    console.log('Removed only the disposable asset verification account and its snapshots.');
  }
}
run().catch(() => { console.error('Asset database verification failed; no existing user records were targeted.'); process.exitCode = 1; });
