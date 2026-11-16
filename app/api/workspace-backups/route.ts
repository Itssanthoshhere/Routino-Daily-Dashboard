import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDatabaseStatus, getUserWorkspace } from "@/lib/db";
import { backupWorkspace, listWorkspaceBackups, readWorkspaceBackup, restoreWorkspaceBackup } from "@/lib/workspaceBackups";
const json = (value: unknown, status = 200) => NextResponse.json(value, { status, headers: { "Cache-Control": "private, no-store" } });
export async function GET(request: NextRequest) {
  const session = await auth(); const email = session?.user?.email;
  if (!email) return json({ error: "Sign in to view backups." }, 401);
  if (getDatabaseStatus().provider !== "neon-postgres") return json({ error: "Server backup history requires Neon Postgres." }, 503);
  try {
    const id = request.nextUrl.searchParams.get("id");
    if (id) { const backup = await readWorkspaceBackup(email, id); return backup ? json({ version: "1.0.0", data: backup.data, createdAt: backup.createdAt }) : json({ error: "Backup not found." }, 404); }
    const [backups, workspace] = await Promise.all([listWorkspaceBackups(email), getUserWorkspace(email)]);
    return json({ backups, updatedAt: workspace?.updatedAt, retentionDays: 30, scheduled: !!process.env.CRON_SECRET, storage: "Same Neon database, separate snapshot table" });
  } catch { return json({ error: "Could not load backups." }, 503); }
}
export async function POST(request: NextRequest) {
  const session = await auth(); const email = session?.user?.email;
  if (!email) return json({ error: "Sign in to manage backups." }, 401);
  try {
    const body = await request.json();
    if (body?.action === "create") { const id = await backupWorkspace(email, "manual"); return id ? json({ success: true, id }) : json({ error: "No saved workspace to back up yet." }, 404); }
    if (body?.action !== "restore" || typeof body.id !== "string" || typeof body.expectedUpdatedAt !== "string") return json({ error: "Invalid backup action." }, 400);
    const result = await restoreWorkspaceBackup(email, body.id, body.expectedUpdatedAt);
    return result.success ? json({ success: true }) : json({ error: result.missing ? "Backup not found." : "Workspace changed since preview. Refresh the backup list before restoring." }, result.missing ? 404 : 409);
  } catch { return json({ error: "Backup operation failed; no success was reported." }, 503); }
}
