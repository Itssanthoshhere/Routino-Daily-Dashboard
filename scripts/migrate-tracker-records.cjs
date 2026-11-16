// Moves a private tracker export into an existing workspace without replacing other fields.
// Usage: node scripts/migrate-tracker-records.cjs --input .data/private-export.json [--apply]
const fs = require("node:fs");
const path = require("node:path");
const { neon } = require("@neondatabase/serverless");
require("@next/env").loadEnvConfig(process.cwd());
if (!process.env.DATABASE_URL && fs.existsSync(".env.database.local")) {
  const match = fs.readFileSync(".env.database.local", "utf8").match(/^DATABASE_URL=(.+)$/m);
  if (match) process.env.DATABASE_URL = JSON.parse(match[1]);
}
const index = process.argv.indexOf("--input");
if (index < 0 || !process.argv[index + 1]) throw new Error("Provide --input with a private tracker export.");
const input = JSON.parse(fs.readFileSync(path.resolve(process.argv[index + 1]), "utf8"));
const email = (process.env.TRACKERS_OWNER_EMAIL || "").trim().toLowerCase();
if (!email || !process.env.DATABASE_URL) throw new Error("Configure the tracker owner and database before migrating.");

async function run() {
  const sql = neon(process.env.DATABASE_URL);
  const rows = await sql`SELECT data FROM routino_workspaces WHERE email = ${email}`;
  if (!rows.length) throw new Error("No existing owner workspace found; migration stopped.");
  const original = rows[0].data;
  const plan = input.airtel?.plan;
  if (plan && !plan.id) plan.id = input.airtel.records.find(row => row.amount === plan.amount && row.date === plan.paymentDate && row.status !== "failed")?.id;
  const existingAirtel = original.airtel;
  const deleted = new Set(existingAirtel?.deletedIds || []);
  const records = new Map((input.airtel?.records || []).filter(row => !deleted.has(row.id)).map(row => [row.id, row]));
  for (const row of existingAirtel?.records || []) records.set(row.id, row);
  const airtel = { records: Array.from(records.values()), deletedIds: Array.from(deleted), plan: existingAirtel?.plan ? { ...plan, ...existingAirtel.plan, ...(plan?.benefits ? { benefits: plan.benefits, dataPerDayGB: plan.dataPerDayGB, smsPerDay: plan.smsPerDay, calls: plan.calls, unlimited5G: plan.unlimited5G } : {}) } : (deleted.has(plan?.id) ? null : plan) };
  const subscriptions = original.subscriptions === undefined ? input.subscriptions : original.subscriptions;
  const patch = {
    airtel,
    ...(original.subscriptions === undefined ? { subscriptions } : {}),
    subscriptionJournalImported: original.subscriptionJournalImported ?? Array.isArray(subscriptions),
    trackerRevision: (original.trackerRevision || 0) + 1,
  };
  // Link an existing legacy bundle to its matching saved recharge without changing user edits.
  if (plan?.id && Array.isArray(subscriptions)) {
    const linked = subscriptions.map(subscription => subscription.cycle === "bundled" && !subscription.bundleRechargeId && subscription.bundlePlan?.startDate === plan.startDate && subscription.bundlePlan?.endDate === plan.endDate ? { ...subscription, bundleRechargeId: plan.id } : subscription);
    if (linked.some((subscription, index) => subscription !== subscriptions[index])) patch.subscriptions = linked;
  }
  if (Array.isArray(input.subscriptionUpdates)) {
    const updated = (patch.subscriptions || subscriptions || []).map(subscription => {
      const update = input.subscriptionUpdates.find(entry => entry.id === subscription.id);
      return update ? { ...subscription, ...update.changes } : subscription;
    });
    patch.subscriptions = updated;
  }
  if (Array.isArray(input.additionalSubscriptions)) {
    const updated = patch.subscriptions || subscriptions || [];
    const ids = new Set(updated.map(subscription => subscription.id));
    patch.subscriptions = [...updated, ...input.additionalSubscriptions.filter(subscription => !ids.has(subscription.id))];
  }
  // Validate using TypeScript's loader without requiring application boot or new dependencies.
  const ts = require("typescript");
  const modules = {};
  function load(file) {
    if (modules[file]) return modules[file].exports;
    const module = { exports: {} }; modules[file] = module;
    const code = ts.transpileModule(fs.readFileSync(file, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
    new Function("require", "module", "exports", code)(name => name.startsWith("@/") ? load(name.slice(2) + ".ts") : require(name), module, module.exports);
    return module.exports;
  }
  if (patch.airtel && !load("lib/airtelValidation.ts").isAirtelData(patch.airtel)) throw new Error("Invalid recharge export; stopped without writing.");
  if (patch.subscriptions && !load("lib/subscriptionValidation.ts").isSubscriptionList(patch.subscriptions)) throw new Error("Invalid subscription export; stopped without writing.");
  console.log(JSON.stringify({ mode: process.argv.includes("--apply") ? "apply" : "preview", existingSubscriptions: original.subscriptions?.length || 0, existingAirtelFields: original.airtel ? Object.keys(original.airtel) : [], airtelWasPresent: Object.prototype.hasOwnProperty.call(original, "airtel"), rechargeCount: patch.airtel.records.length, fieldsToUpdate: Object.keys(patch) }));
  if (!process.argv.includes("--apply")) return;
  fs.mkdirSync(".data", { recursive: true });
  const backup = `.data/workspace-before-tracker-migration-${Date.now()}.json`;
  fs.writeFileSync(backup, JSON.stringify({ email, data: original }, null, 2), { mode: 0o600 });
  const updated = await sql`UPDATE routino_workspaces SET data = data || ${JSON.stringify(patch)}::jsonb, updated_at = NOW() WHERE email = ${email} AND data = ${JSON.stringify(original)}::jsonb RETURNING data`;
  if (!updated.length) throw new Error("Workspace changed during migration. Nothing was overwritten; retry after checking the latest data.");
  for (const key of Object.keys(original).filter(key => !Object.keys(patch).includes(key))) {
    if (JSON.stringify(updated[0].data[key]) !== JSON.stringify(original[key])) throw new Error(`Preservation check failed for ${key}`);
  }
  console.log("Migration saved. Unrelated workspace fields were verified unchanged; private backup retained in .data.");
}
run().catch(error => { console.error(error.message?.startsWith("Workspace") || error.message?.startsWith("Invalid") ? error.message : "Migration failed. No credentials or private data were logged."); process.exitCode = 1; });
