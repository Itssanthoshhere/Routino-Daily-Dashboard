import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { googleFetch } from "@/lib/google";
import type { DriveFile } from "@/types/dashboard";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ connected: false, files: [] }, { status: 401 });
  }

  try {
    const params = new URLSearchParams({
      q: "trashed = false",
      pageSize: "8",
      orderBy: "modifiedTime desc",
      fields: "files(id,name,mimeType,modifiedTime,webViewLink)",
      spaces: "drive",
      includeItemsFromAllDrives: "true",
      supportsAllDrives: "true",
    });
    const response = await googleFetch(
      `https://www.googleapis.com/drive/v3/files?${params.toString()}`
    );

    if (response.status === 403) {
      try {
        const errJson = await response.json();
        const errors: any[] = errJson?.error?.errors || [];
        const msg = String(errJson?.error?.message || "").toLowerCase();
        const reasons = errors.map((e: any) => String(e?.reason || "").toLowerCase());
        const isScopeMissing =
          reasons.includes("insufficientpermissions") ||
          reasons.includes("insufficient_scope") ||
          msg.includes("insufficient authentication scopes") ||
          msg.includes("insufficientpermissions");

        if (isScopeMissing) {
          return NextResponse.json(
            { connected: true, needsConsent: true, files: [] },
            { status: 403, headers: { "Cache-Control": "private, no-store" } }
          );
        }
        return NextResponse.json(
          { connected: true, needsConsent: false, error: errJson?.error?.message || "Google Drive API is disabled or access was denied.", files: [] },
          { status: 403, headers: { "Cache-Control": "private, no-store" } }
        );
      } catch {
        return NextResponse.json(
          { connected: true, needsConsent: false, error: "Google Drive permission or access was denied.", files: [] },
          { status: 403, headers: { "Cache-Control": "private, no-store" } }
        );
      }
    }
    if (!response.ok) {
      return NextResponse.json(
        { connected: true, error: "Google Drive could not return file metadata.", files: [] },
        { status: 502, headers: { "Cache-Control": "private, no-store" } }
      );
    }

    const result = (await response.json()) as { files?: DriveFile[] };
    const files = (result.files ?? []).map(({ id, name, mimeType, modifiedTime, webViewLink }) => ({
      id,
      name,
      mimeType,
      modifiedTime,
      webViewLink,
    }));

    return NextResponse.json(
      { connected: true, files },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch {
    return NextResponse.json(
      { connected: true, error: "Connect Google again to load Drive metadata.", files: [] },
      { status: 502, headers: { "Cache-Control": "private, no-store" } }
    );
  }
}
