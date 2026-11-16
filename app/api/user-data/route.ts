import { NextRequest, NextResponse } from "next/server";
import { isSubscriptionList } from "@/lib/subscriptionValidation";
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
        { status: 401, headers: { "Cache-Control": "private, no-store" } }
      );
    }

    const data = await getUserWorkspace(email);
    return NextResponse.json({
      authenticated: true,
      email,
      exists: !!data,
      data,
      dbStatus,
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (err: unknown) {
    console.error("[user-data] Workspace read failed", err);
    return NextResponse.json({ error: "Could not load workspace data." }, { status: 500, headers: { "Cache-Control": "private, no-store" } });
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
        { status: 401, headers: { "Cache-Control": "private, no-store" } }
      );
    }

    const body = await req.json();
    const {
      subscriptions,
      tasks,
      customEvents,
      quickLinks,
      focusMinutes,
      soundEnabled,
      habits,
      notes,
      activeNav,
      deletedHabitIds,
      replaceHabitIds,
      replaceAllHabits,
    } = body;

    const existingWorkspace = await getUserWorkspace(email);
    let savedHabits = existingWorkspace?.habits;
    if (Array.isArray(habits)) {
      if (replaceAllHabits === true) {
        savedHabits = habits;
      } else {
        const deletedIds = new Set(
          Array.isArray(deletedHabitIds)
            ? deletedHabitIds.filter((id: unknown): id is string => typeof id === "string")
            : []
        );
        const replacedIds = new Set(
          Array.isArray(replaceHabitIds)
            ? replaceHabitIds.filter((id: unknown): id is string => typeof id === "string")
            : []
        );
        const merged = new Map(
          (existingWorkspace?.habits ?? [])
            .filter((habit) => !deletedIds.has(habit.id))
            .map((habit) => [habit.id, habit])
        );

        for (const habit of habits) {
          if (!habit || typeof habit.id !== "string" || deletedIds.has(habit.id)) continue;
          const existing = merged.get(habit.id);
          if (!existing || replacedIds.has(habit.id)) {
            merged.set(habit.id, habit);
            continue;
          }

          const completedDates = Array.from(
            new Set([
              ...(Array.isArray(existing.completedDates) ? existing.completedDates : []),
              ...(Array.isArray(habit.completedDates) ? habit.completedDates : []),
            ])
          ).sort();

          merged.set(habit.id, {
            ...existing,
            ...habit,
            completedDates,
            streak: Math.max(existing.streak || 0, habit.streak || 0),
          });
        }

        savedHabits = Array.from(merged.values());
      }
    }

    if (subscriptions !== undefined && !isSubscriptionList(subscriptions)) {
      return NextResponse.json({ error: "Invalid subscriptions." }, { status: 400 });
    }

    const workspaceData = {
      ...existingWorkspace,
      subscriptions: Array.isArray(subscriptions) ? subscriptions : existingWorkspace?.subscriptions,
      // Omitted fields mean "leave as-is". Explicit empty arrays remain valid
      // user choices and must not be replaced with defaults or sample data.
      tasks: Array.isArray(tasks) ? tasks : existingWorkspace?.tasks ?? [],
      customEvents: Array.isArray(customEvents) ? customEvents : existingWorkspace?.customEvents ?? [],
      quickLinks: Array.isArray(quickLinks) ? quickLinks : existingWorkspace?.quickLinks ?? [],
      focusMinutes: typeof focusMinutes === "number" ? focusMinutes : existingWorkspace?.focusMinutes ?? 90,
      soundEnabled: typeof soundEnabled === "boolean" ? soundEnabled : existingWorkspace?.soundEnabled ?? true,
      habits: savedHabits ?? existingWorkspace?.habits,
      notes: Array.isArray(notes) ? notes : existingWorkspace?.notes,
      activeNav: typeof activeNav === "string" ? activeNav : existingWorkspace?.activeNav ?? "Overview",
      updatedAt: new Date().toISOString(),
    };

    const result = await saveUserWorkspace(email, workspaceData);

    return NextResponse.json({
      success: result.success,
      source: result.source,
      savedAt: workspaceData.updatedAt,
      dbStatus,
      error: result.success ? undefined : "Could not save workspace data.",
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (err: unknown) {
    console.error("[user-data] Workspace write failed", err);
    return NextResponse.json({ error: "Invalid workspace payload." }, { status: 400, headers: { "Cache-Control": "private, no-store" } });
  }
}
