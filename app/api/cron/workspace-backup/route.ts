import { backupExternalWorkspaces } from "@/lib/scheduledExternalBackups";
import { timingSafeEqual } from "node:crypto";
import { backupAllWorkspaces } from "@/lib/workspaceBackups";
export const maxDuration = 60;
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return Response.json({ error: "Backup schedule is not configured." }, { status: 503 });
  const supplied = Buffer.from(request.headers.get("authorization") || "");
  const expected = Buffer.from(`Bearer ${secret}`);
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const created = await backupAllWorkspaces();
    const external = await backupExternalWorkspaces();
    return Response.json({ success: external.failed === 0, created, external }, { status: external.failed ? 503 : 200 });
  }
  catch { console.error("Scheduled workspace backup failed."); return Response.json({ error: "Backup failed." }, { status: 503 }); }
}
