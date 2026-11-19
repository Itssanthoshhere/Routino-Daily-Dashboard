import { neon } from "@neondatabase/serverless";
import { randomUUID } from "node:crypto";
import { listWorkspaceBackups } from "@/lib/workspaceBackups";
import { restoreSelectedRecord, type RecoverySelection } from "@/lib/selectiveRecovery";
const database = () => { if (!process.env.DATABASE_URL)
    throw new Error('Neon Postgres is required for selective recovery.'); return neon(process.env.DATABASE_URL); };
export async function readRecoveryWorkspace(email: string) { const sql = database(); const [row] = await sql `SELECT data, updated_at::text AS version FROM routino_workspaces WHERE email=${email.trim().toLowerCase()}`; return row || null; }
export async function recoverWorkspaceRecord(email: string, selection: RecoverySelection, record: unknown, version: string) {
    const sql = database(), account = email.trim().toLowerCase();
    const row = await readRecoveryWorkspace(account);
    if (!row || row.version !== version)
        return { success: false, conflict: true };
    const next = { ...restoreSelectedRecord(row.data, selection, record), coreRevision: (row.data.coreRevision || 0) + 1, trackerRevision: (row.data.trackerRevision || 0) + 1, updatedAt: new Date().toISOString() };
    await listWorkspaceBackups(account); // Ensure the existing snapshot table is ready before the transaction.
    const backupId = randomUUID();
    const result = await sql `WITH target AS (SELECT email,data FROM routino_workspaces WHERE email=${account} AND updated_at::text=${version} FOR UPDATE), saved AS (INSERT INTO routino_workspace_backups(id,email,bucket,data,reason) SELECT ${backupId},email,${backupId},data,'before-restore' FROM target RETURNING id) UPDATE routino_workspaces SET data=${JSON.stringify(next)}::jsonb,updated_at=NOW() WHERE email IN (SELECT email FROM target) AND EXISTS(SELECT 1 FROM saved) RETURNING email`;
    return result.length ? { success: true } : { success: false, conflict: true };
}
