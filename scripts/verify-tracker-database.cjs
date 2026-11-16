const assert = require("node:assert/strict");
const fs = require("node:fs");
const { randomUUID } = require("node:crypto");
const ts = require("typescript");
const { neon } = require("@neondatabase/serverless");
require("@next/env").loadEnvConfig(process.cwd(), true);
if (!process.env.DATABASE_URL && fs.existsSync(".env.database.local")) process.env.DATABASE_URL = JSON.parse(fs.readFileSync(".env.database.local", "utf8").match(/^DATABASE_URL=(.+)$/m)[1]);
function load(file) { const module = { exports: {} }; new Function("require", "module", "exports", ts.transpileModule(fs.readFileSync(file, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText)(name => name.startsWith("@/") ? load(`${name.slice(2)}.ts`) : require(name), module, module.exports); return module.exports; }
async function run() {
  const clientA = neon(process.env.DATABASE_URL), clientB = neon(process.env.DATABASE_URL);
  const owner = process.env.TRACKERS_OWNER_EMAIL.toLowerCase().trim();
  const [before] = await clientA`SELECT data FROM routino_workspaces WHERE email = ${owner}`;
  const [second] = await clientB`SELECT data FROM routino_workspaces WHERE email = ${owner}`;
  assert.deepEqual(before.data, second.data);
  const backup = JSON.parse(fs.readFileSync(".data/cloud-workspace-backup-before-trackers.json", "utf8"));
  for (const key of ["tasks", "notes", "habits", "customEvents", "quickLinks"]) {
    for (const record of backup.data[key] || []) assert.ok((before.data[key] || []).some(current => current.id === record.id), `Missing pre-existing ${key} record`);
  }
  for (const key of ["focusMinutes", "soundEnabled"]) assert.deepEqual(before.data[key], backup.data[key]);
  assert.equal(before.data.tasks.some(task => task.title === "Verification only — recurring task"), false, "Disposable browser-test tasks must be cleaned up");
  assert.ok(before.data.airtel.plan);
  const { airtelTotals } = (() => { const m = { exports: {} }; new Function("require", "module", "exports", ts.transpileModule(fs.readFileSync("lib/airtelRecharges.ts", "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText)(require, m, m.exports); return m.exports; })();
  const totals = airtelTotals(before.data.airtel.records);
  const email = `routino-sync-test-${randomUUID()}@example.invalid`;
  const db = load("lib/db.ts");
  try {
    const fixture = { tasks: [{ id: "keep-task" }], notes: [{ id: "keep-note" }], habits: [], customEvents: [], quickLinks: [], focusMinutes: 45, soundEnabled: false, updatedAt: "test", trackerRevision: 0 };
    await clientA`INSERT INTO routino_workspaces (email, data) VALUES (${email}, ${JSON.stringify(fixture)}::jsonb)`;
    const saved = await db.saveTrackerWorkspace(email, { airtel: { records: [], plan: null, deletedIds: [] } }, 0);
    assert.equal(saved.success, true);
    const stale = await db.saveTrackerWorkspace(email, { airtel: { records: [], plan: null, deletedIds: ["stale"] } }, 0);
    assert.equal(stale.conflict, true);
    await db.saveUserWorkspace(email, { ...fixture, focusMinutes: 60 }, ["focusMinutes"]);
    const [latest] = await clientB`SELECT data FROM routino_workspaces WHERE email = ${email}`;
    assert.equal(latest.data.trackerRevision, 1);
    assert.equal(latest.data.focusMinutes, 60);
    assert.deepEqual(latest.data.airtel.deletedIds, []);
    assert.deepEqual(latest.data.tasks, fixture.tasks);
    await Promise.all([
      db.saveUserWorkspace(email, { ...fixture, tasks: [{ id: "device-a", title: "Device A" }] }, ["tasks"], { incoming: [{ id: "device-a", title: "Device A" }], replacedIds: ["device-a"], deletedIds: [] }),
      db.saveUserWorkspace(email, { ...fixture, tasks: [{ id: "device-b", title: "Device B" }] }, ["tasks"], { incoming: [{ id: "device-b", title: "Device B" }], replacedIds: ["device-b"], deletedIds: [] }),
    ]);
    const [concurrent] = await clientB`SELECT data FROM routino_workspaces WHERE email = ${email}`;
    assert.deepEqual(concurrent.data.tasks.map(task => task.id).sort(), ["device-a", "device-b", "keep-task"]);
    assert.equal(concurrent.data.trackerRevision, 1);
    const backups = load("lib/workspaceBackups.ts");
    const snapshotId = await backups.backupWorkspace(email, "manual");
    assert.ok(snapshotId);
    assert.equal(await backups.readWorkspaceBackup(owner, snapshotId), null);
    await db.saveUserWorkspace(email, { ...fixture, focusMinutes: 90 }, ["focusMinutes"]);
    const [changed] = await clientA`SELECT data FROM routino_workspaces WHERE email = ${email}`;
    const staleRestore = await backups.restoreWorkspaceBackup(email, snapshotId, "stale-version");
    assert.equal(staleRestore.conflict, true);
    const restored = await backups.restoreWorkspaceBackup(email, snapshotId, changed.data.updatedAt);
    assert.equal(restored.success, true);
    assert.equal(restored.data.focusMinutes, concurrent.data.focusMinutes);
    assert.equal(restored.data.trackerRevision, concurrent.data.trackerRevision + 1);
    assert.deepEqual(restored.data.tasks, concurrent.data.tasks);
    const history = await backups.listWorkspaceBackups(email);
    assert.ok(history.some(row => row.reason === "before-restore"));
    const ownerSnapshot = await backups.backupWorkspace(owner, "daily");
    assert.ok((await backups.listWorkspaceBackups(owner)).length > 0);
    const [ownerAfter] = await clientB`SELECT data FROM routino_workspaces WHERE email = ${owner}`;
    assert.deepEqual(ownerAfter.data, before.data);
    console.log(JSON.stringify({ database: "verified", independentConnectionsAgree: true, ownerCoreDataPreserved: true, staleTrackerWriteRejected: true, unrelatedSavePreservesTrackers: true, concurrentTaskChangesPreserved: true, backupRestoreVerified: true, restoreRejectsStaleVersion: true, backupOwnershipEnforced: true, ownerBackupAvailable: true, activeBenefits: before.data.airtel.plan.benefits?.filter(benefit => benefit.using).map(benefit => `${benefit.name} ${benefit.planName}`), savedRechargeCount: before.data.airtel.records.length, successfulPayments: totals.count, total: totals.total, currentPlan: { amount: before.data.airtel.plan.amount, startDate: before.data.airtel.plan.startDate, endDate: before.data.airtel.plan.endDate } }));
  } finally { await clientA`DELETE FROM routino_workspace_backups WHERE email = ${email}`; await clientA`DELETE FROM routino_workspaces WHERE email = ${email}`; }
}
run().catch(error => { console.error("Database verification failed:", error.name, String(error.message).replace(/postgres(?:ql)?:\/\/[^\s]+/g, "[database URL redacted]"), (error.stack || "").split("\n").filter(line => line.includes("verify-tracker-database.cjs:")).join("\n")); process.exitCode = 1; });
