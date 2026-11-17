import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { readRecycleBin, restoreRecycleEntry } from "@/lib/recycleBinStore";
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
export async function GET() {
  const email = (await auth())?.user?.email;
  if (!email) return json({ error: "Sign in to view deleted records." }, 401);
  try { return json(await readRecycleBin(email)); } catch { return json({ error: "Database Recycle Bin is unavailable. Neon Postgres is required." }, 503); }
}
export async function POST(request: NextRequest) {
  const email = (await auth())?.user?.email;
  if (!email) return json({ error: "Sign in to restore records." }, 401);
  let body; try { body = await request.json(); } catch { return json({ error: "Invalid request." }, 400); }
  if (body?.action !== 'restore' || typeof body.id !== 'string' || typeof body.version !== 'string') return json({ error: "Invalid restore request." }, 400);
  try {
    const result = await restoreRecycleEntry(email, body.id, body.version);
    return result.success ? json(result) : json({ error: 'conflict' in result ? "Workspace changed. Refresh the bin before restoring." : result.error }, 409);
  } catch { return json({ error: "Restore failed. Existing data was not replaced." }, 503); }
}
