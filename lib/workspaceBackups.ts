import { neon } from "@neondatabase/serverless";
import { randomUUID } from "node:crypto";

function database() {
  if (!process.env.DATABASE_URL) throw new Error("Automatic backups require Neon Postgres.");
  return neon(process.env.DATABASE_URL);
}
async function prepare() {
  const sql = database();
  await sql`CREATE TABLE IF NOT EXISTS routino_workspace_backups (
    id TEXT PRIMARY KEY, email TEXT NOT NULL, bucket TEXT UNIQUE NOT NULL,
    data JSONB NOT NULL, reason TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await sql`CREATE INDEX IF NOT EXISTS routino_backups_account_date ON routino_workspace_backups (email, created_at DESC)`;
  return sql;
}

/** Capture the first state of each UTC day before any supported application write. */
export async function backupWorkspace(email: string, reason: "daily" | "manual" | "before-restore" = "daily") {
  const sql = await prepare();
  const normalized = email.trim().toLowerCase();
  const id = randomUUID();
  const bucket = reason === "daily" ? `${normalized}:daily:${new Date().toISOString().slice(0, 10)}` : `${normalized}:${id}`;
  const rows = await sql`INSERT INTO routino_workspace_backups (id, email, bucket, data, reason)
    SELECT ${id}, email, ${bucket}, data, ${reason} FROM routino_workspaces WHERE email = ${normalized}
    ON CONFLICT (bucket) DO NOTHING RETURNING id`;
  return rows[0]?.id as string | undefined;
}

export async function backupAllWorkspaces() {
  const sql = await prepare();
  const day = new Date().toISOString().slice(0, 10);
  const rows = await sql`INSERT INTO routino_workspace_backups (id, email, bucket, data, reason)
    SELECT 'daily:' || md5(email || ${day}), email, email || ':daily:' || ${day}, data, 'daily' FROM routino_workspaces
    ON CONFLICT (bucket) DO NOTHING RETURNING id`;
  await sql`DELETE FROM routino_workspace_backups WHERE created_at < NOW() - INTERVAL '30 days'`;
  return rows.length;
}

export async function listWorkspaceBackups(email: string) {
  const sql = await prepare();
  return sql`SELECT id, reason, created_at AS "createdAt", jsonb_array_length(COALESCE(data->'tasks', '[]'::jsonb)) AS "taskCount"
    FROM routino_workspace_backups WHERE email = ${email.trim().toLowerCase()} ORDER BY created_at DESC LIMIT 50`;
}

export async function readWorkspaceBackup(email: string, id: string) {
  const sql = await prepare();
  const rows = await sql`SELECT id, data, reason, created_at AS "createdAt" FROM routino_workspace_backups
    WHERE email = ${email.trim().toLowerCase()} AND id = ${id}`;
  return rows[0] || null;
}

export async function restoreWorkspaceBackup(email: string, id: string, expectedUpdatedAt: string) {
  const sql = await prepare();
  const normalized = email.trim().toLowerCase();
  const source = await readWorkspaceBackup(normalized, id);
  if (!source) return { success: false, missing: true };
  // Preserve the current version in the same transaction as replacement, even on concurrent restores.
  const beforeId = randomUUID();
  const updatedAt = new Date().toISOString();
  const result = await sql`WITH target AS (
      SELECT email, data FROM routino_workspaces WHERE email = ${normalized} AND data->>'updatedAt' = ${expectedUpdatedAt} FOR UPDATE
    ), saved AS (
      INSERT INTO routino_workspace_backups (id, email, bucket, data, reason)
      SELECT ${beforeId}, email, ${beforeId}, data, 'before-restore' FROM target RETURNING id
    ) UPDATE routino_workspaces SET data = ${JSON.stringify(source.data)}::jsonb || jsonb_build_object(
      'updatedAt', ${updatedAt}::text, 'trackerRevision', COALESCE((routino_workspaces.data->>'trackerRevision')::integer, 0) + 1
    ), updated_at = NOW() WHERE email IN (SELECT email FROM target) AND EXISTS (SELECT 1 FROM saved) RETURNING data`;
  return result.length ? { success: true, data: result[0].data } : { success: false, conflict: true };
}
