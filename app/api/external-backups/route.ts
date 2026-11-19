import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUserWorkspace } from "@/lib/db";
import { createExternalBackup, externalBackupConfigured, listExternalBackups, readExternalBackup } from "@/lib/externalBackups";
export const maxDuration = 90;
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
export async function GET(request: NextRequest) {
  const email = (await auth())?.user?.email;
  if (!email) return json({ error: "Sign in to view external backups." }, 401);
  if (!externalBackupConfigured()) return json({ configured: false, backups: [] });
  try {
    const id = request.nextUrl.searchParams.get("id");
    if (id) {
      if (!/^\d{4}-\d{2}-\d{2}\.json\.enc$/.test(id)) return json({ error: "Invalid backup identifier." }, 400);
      const backup = await readExternalBackup(email, id);
      return backup ? json({ version: backup.version, data: backup.data, createdAt: backup.createdAt }) : json({ error: "Backup not found." }, 404);
    }
    return json({ configured: true, backups: await listExternalBackups(email), retentionDays: 30, maxBytes: 2 * 1024 * 1024 });
  } catch { return json({ error: "Could not read encrypted external backups." }, 503); }
}
export async function POST() {
  const email = (await auth())?.user?.email;
  if (!email) return json({ error: "Sign in to create an external backup." }, 401);
  if (!externalBackupConfigured()) return json({ error: "External backup storage and encryption are not configured." }, 503);
  try {
    const data = await getUserWorkspace(email);
    if (!data) return json({ error: "No saved workspace to back up." }, 404);
    return json({ success: true, ...await createExternalBackup(email, data) });
  } catch { return json({ error: "External backup failed. Existing database records and backups are unchanged." }, 503); }
}
