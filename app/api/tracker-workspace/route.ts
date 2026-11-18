import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDatabaseStatus, getUserWorkspace, saveTrackerWorkspace, type TrackerPatch } from "@/lib/db";
import { isSubscriptionList } from "@/lib/subscriptionValidation";
import { isAirtelData } from "@/lib/airtelValidation";
import { isAssetDocuments } from "@/lib/assetDocuments";

const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
export async function GET() {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return json({ error: "Sign in to sync trackers." }, 401);
  try {
    const data = await getUserWorkspace(email);
    return json({ data: { subscriptions: data?.subscriptions, airtel: data?.airtel, subscriptionJournalImported: data?.subscriptionJournalImported || false, assetDocuments: data?.assetDocuments || {} }, revision: data?.trackerRevision || 0, dbStatus: getDatabaseStatus() });
  } catch {
    return json({ error: "Could not read saved trackers. Your local copy is preserved." }, 503);
  }
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return json({ error: "Sign in to sync trackers." }, 401);
  let body;
  try { body = await request.json(); } catch { return json({ error: "Invalid request." }, 400); }
  if (!body || typeof body !== "object" || Array.isArray(body) || !Number.isInteger(body.revision) || body.revision < 0 || !body.patch || typeof body.patch !== "object" || Array.isArray(body.patch)) return json({ error: "Invalid tracker update." }, 400);
  const patch = body.patch as TrackerPatch;
  if (Object.keys(patch).some(key => !["subscriptions", "airtel", "subscriptionJournalImported", "assetDocuments"].includes(key)) || (patch.assetDocuments !== undefined && !isAssetDocuments(patch.assetDocuments)) || (patch.subscriptions !== undefined && !isSubscriptionList(patch.subscriptions)) || (patch.airtel !== undefined && !isAirtelData(patch.airtel)) || (patch.subscriptionJournalImported !== undefined && typeof patch.subscriptionJournalImported !== "boolean")) return json({ error: "Invalid tracker records." }, 400);
  try {
    const result = await saveTrackerWorkspace(email, patch, body.revision);
    if (result.conflict) return json({ error: "Another device changed these records. Reload the saved version before retrying; your local draft is preserved." }, 409);
    if (!result.success) return json({ error: "Database save unavailable. Your local copy is preserved." }, 503);
    return json({ success: true, revision: result.data?.trackerRevision, savedAt: result.data?.updatedAt, dbStatus: getDatabaseStatus() });
  } catch {
    return json({ error: "Database save failed. Your local copy is preserved." }, 503);
  }
}
