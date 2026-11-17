const assert = require("node:assert/strict");
const fs = require("node:fs");
const { randomUUID } = require("node:crypto");
const ts = require("typescript");
const { neon } = require("@neondatabase/serverless");
require("@next/env").loadEnvConfig(process.cwd(), true);
function load(file) {
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(file, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  new Function("require", "module", "exports", code)(name => name.startsWith("@/") ? load(`${name.slice(2)}.ts`) : require(name), module, module.exports);
  return module.exports;
}
async function run() {
  assert.ok(process.env.DATABASE_URL, "Configure DATABASE_URL before database verification");
  const sql = neon(process.env.DATABASE_URL);
  const owner = process.env.TRACKERS_OWNER_EMAIL?.trim().toLowerCase();
  assert.ok(owner, "Configure TRACKERS_OWNER_EMAIL for preservation checks");
  const [ownerBefore] = await sql`SELECT data FROM routino_workspaces WHERE email = ${owner}`;
  assert.ok(ownerBefore, "Owner workspace must exist");
  const email = `workspace-features-test-${randomUUID()}@example.invalid`;
  const db = load("lib/db.ts");
  const backups = load("lib/workspaceBackups.ts");
  const activity = [{ at: 1, action: "Created" }, { at: 2, action: "Snoozed" }];
  const task = { id: "task", title: "Disposable activity check", meta: "Test", checked: false, priority: false, createdAt: 1, activity };
  const subscription = { id: "plan", name: "Disposable plan", amount: 150, currency: "INR", cycle: "monthly", renewalDate: "2026-12-01", status: "active", category: "Test", notes: "", renewalDecision: "cancel", priceHistory: [{ date: "2026-11-17", amount: 100, currency: "INR", cycle: "monthly" }, { date: "2026-11-17", amount: 150, currency: "INR", cycle: "monthly" }] };
  try {
    await sql`INSERT INTO routino_workspaces (email, data) VALUES (${email}, ${JSON.stringify({ tasks: [task], notes: [{ id: "preserve-note", content: "ciphertext", isEncrypted: true }], habits: [], quickLinks: [], customEvents: [], trackerRevision: 0, updatedAt: "fixture" })}::jsonb)`;
    assert.equal((await db.saveTrackerWorkspace(email, { subscriptions: [subscription] }, 0)).success, true);
    const first = await db.getUserWorkspace(email);
    assert.deepEqual(first.subscriptions[0], subscription);
    assert.deepEqual(first.tasks[0].activity, activity);
    const edited = { ...task, activity: [...activity, { at: 3, action: "Edited" }] };
    await db.saveUserWorkspace(email, { ...first, tasks: [edited] }, ["tasks"], { incoming: [edited], replacedIds: [edited.id], deletedIds: [] });
    const second = await db.getUserWorkspace(email);
    assert.deepEqual(second.tasks[0].activity, edited.activity);
    assert.deepEqual(second.subscriptions[0], subscription);
    assert.deepEqual(second.notes, first.notes);
    assert.equal((await db.saveTrackerWorkspace(email, { subscriptions: [] }, 0)).conflict, true);
    const id = await backups.backupWorkspace(email, "manual");
    const snapshot = await backups.readWorkspaceBackup(email, id);
    assert.ok(snapshot);
    // Backup reader returns the full workspace snapshot without dropping metadata.
    const serialized = JSON.stringify(snapshot);
    assert.ok(serialized.includes('"renewalDecision":"cancel"'));
    assert.ok(serialized.includes('"priceHistory"'));
    assert.ok(serialized.includes('"Snoozed"'));
    const [ownerAfter] = await sql`SELECT data FROM routino_workspaces WHERE email = ${owner}`;
    assert.deepEqual(ownerAfter.data, ownerBefore.data, "Owner workspace changed during verification");
    console.log("Passed: database round-trip for task activity, price history and renewal decisions; unrelated encrypted notes preserved; stale tracker writes rejected; backup metadata retained; owner workspace unchanged.");
  } finally {
    await sql`DELETE FROM routino_workspace_backups WHERE email = ${email}`;
    await sql`DELETE FROM routino_workspaces WHERE email = ${email}`;
  }
}
run().catch(error => { console.error("Workspace feature verification failed:", error.name, String(error.message).replace(/postgres(?:ql)?:\/\/[^\s]+/g, "[redacted database URL]")); process.exitCode = 1; });
