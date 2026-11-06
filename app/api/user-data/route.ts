import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUserWorkspace, saveUserWorkspace, getDatabaseStatus } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    const email = session?.user?.email;
    const dbStatus = getDatabaseStatus();

    if (!email) {
      return NextResponse.json(
        {
          authenticated: false,
          dbStatus,
          message: "Sign in with Google to sync your workspace with the database.",
        },
        { status: 401 }
      );
    }

    const data = await getUserWorkspace(email);
    return NextResponse.json({
      authenticated: true,
      email,
      exists: !!data,
      data,
      dbStatus,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const email = session?.user?.email;
    const dbStatus = getDatabaseStatus();

    if (!email) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in to sync workspace." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { tasks, customEvents, quickLinks, focusMinutes, soundEnabled, habits, notes, activeNav } = body;

    const workspaceData = {
      tasks: Array.isArray(tasks) ? tasks : [],
      customEvents: Array.isArray(customEvents) ? customEvents : [],
      quickLinks: Array.isArray(quickLinks) ? quickLinks : [],
      focusMinutes: typeof focusMinutes === "number" ? focusMinutes : 90,
      soundEnabled: typeof soundEnabled === "boolean" ? soundEnabled : true,
      habits: Array.isArray(habits) ? habits : undefined,
      notes: Array.isArray(notes) ? notes : undefined,
      activeNav: typeof activeNav === "string" ? activeNav : "Overview",
      updatedAt: new Date().toISOString(),
    };

    const result = await saveUserWorkspace(email, workspaceData);

    return NextResponse.json({
      success: result.success,
      source: result.source,
      savedAt: workspaceData.updatedAt,
      dbStatus,
      error: result.error,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Invalid payload";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
