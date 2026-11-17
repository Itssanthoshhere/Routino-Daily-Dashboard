import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDatabaseStatus, getUserWorkspace } from "@/lib/db";
import { listWorkspaceBackups } from "@/lib/workspaceBackups";
import { externalBackupConfigured, listExternalBackups } from "@/lib/externalBackups";
export async function GET() {
  const email = (await auth())?.user?.email;
  const headers = { "Cache-Control": "private, no-store" };
  if (!email) return NextResponse.json({ error: "Sign in to check sync health." }, { status: 401, headers });
  const status = getDatabaseStatus(); const externalConfigured = externalBackupConfigured();
  const [workspace, databaseBackups, externalBackups] = await Promise.allSettled([
    getUserWorkspace(email),
    status.provider === "neon-postgres" ? listWorkspaceBackups(email) : Promise.resolve(null),
    externalConfigured ? listExternalBackups(email) : Promise.resolve(null),
  ]);
  return NextResponse.json({
    database: { configured: status.configured, provider: status.provider, reachable: workspace.status === "fulfilled", updatedAt: workspace.status === "fulfilled" ? workspace.value?.updatedAt || null : null },
    snapshots: { supported: status.provider === "neon-postgres", reachable: databaseBackups.status === "fulfilled", latestAt: databaseBackups.status === "fulfilled" ? databaseBackups.value?.[0]?.createdAt || null : null },
    external: { configured: externalConfigured, reachable: externalBackups.status === "fulfilled", latestAt: externalBackups.status === "fulfilled" ? externalBackups.value?.[0]?.date || null : null },
    checkedAt: new Date().toISOString(),
  }, { headers });
}
