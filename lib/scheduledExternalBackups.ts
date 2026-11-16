import { neon } from "@neondatabase/serverless";
import { createExternalBackup, externalBackupConfigured } from "@/lib/externalBackups";
export async function backupExternalWorkspaces() {
  if (!externalBackupConfigured()) return { configured: false, verified: 0, failed: 0 };
  if (!process.env.DATABASE_URL) throw new Error("External backup schedule requires the workspace database.");
  const sql = neon(process.env.DATABASE_URL);
  const rows = await sql`SELECT email, data FROM routino_workspaces WHERE email NOT LIKE '%@example.invalid'`;
  let verified = 0, failed = 0;
  for (const row of rows) {
    try { await createExternalBackup(row.email, row.data); verified++; }
    catch { failed++; console.error("An encrypted external workspace backup failed."); }
  }
  return { configured: true, verified, failed };
}
