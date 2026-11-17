import { isTaskActivity } from "@/lib/taskActivity";
import { NextRequest, NextResponse } from "next/server";
import { isTaskRecurrence } from "@/lib/taskRecurrence";
import { mergeTaskRecords } from "@/lib/taskMerge";
import { isSubscriptionDate, isSubscriptionList } from "@/lib/subscriptionValidation";
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
      replaceTaskIds,
      deletedTaskIds,
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

    if (Array.isArray(tasks) && tasks.some(task => task?.recurrenceTemplate !== undefined && (!task.recurrenceTemplate || typeof task.recurrenceTemplate !== "object" || typeof task.recurrenceTemplate.title !== "string" || typeof task.recurrenceTemplate.meta !== "string" || typeof task.recurrenceTemplate.priority !== "boolean" || !isTaskRecurrence(task.recurrenceTemplate.recurrence) || typeof task.recurrenceTemplate.dueDate !== "string" || !isSubscriptionDate(task.recurrenceTemplate.dueDate.slice(0, 10))))) {
      return NextResponse.json({ error: "Invalid recurring task template." }, { status: 400 });
    }
    if (Array.isArray(tasks) && tasks.some(task => !task || typeof task.id !== "string" || (task.dependsOn !== undefined && (!Array.isArray(task.dependsOn) || task.dependsOn.some((id: unknown) => typeof id !== "string"))) || !isTaskActivity(task.activity) || (task.skipped !== undefined && typeof task.skipped !== "boolean") || (task.recurrence !== undefined && (!isTaskRecurrence(task.recurrence) || (typeof task.dueDate !== "string" || !isSubscriptionDate(task.dueDate.slice(0, 10))))))) {
      return NextResponse.json({ error: "Invalid task records." }, { status: 400 });
    }
    const taskIds = (value: unknown) => Array.isArray(value) ? value.filter((id): id is string => typeof id === "string") : [];
    const mergingTasks = Array.isArray(tasks) && Array.isArray(replaceTaskIds) && Array.isArray(deletedTaskIds);
    const existingWorkspace = await getUserWorkspace(email);
    if (subscriptions !== undefined && existingWorkspace?.trackerRevision !== undefined) {
      return NextResponse.json({ error: "Tracker records were updated. Refresh this tab and use tracker sync to save subscriptions." }, { status: 409, headers: { "Cache-Control": "private, no-store" } });
    }
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
      tasks: mergingTasks ? mergeTaskRecords(existingWorkspace?.tasks || [], tasks, taskIds(replaceTaskIds), taskIds(deletedTaskIds)) : Array.isArray(tasks) ? tasks : existingWorkspace?.tasks ?? [],
      customEvents: Array.isArray(customEvents) ? customEvents : existingWorkspace?.customEvents ?? [],
      quickLinks: Array.isArray(quickLinks) ? quickLinks : existingWorkspace?.quickLinks ?? [],
      focusMinutes: typeof focusMinutes === "number" ? focusMinutes : existingWorkspace?.focusMinutes ?? 90,
      soundEnabled: typeof soundEnabled === "boolean" ? soundEnabled : existingWorkspace?.soundEnabled ?? true,
      habits: savedHabits ?? existingWorkspace?.habits,
      notes: Array.isArray(notes) ? notes : existingWorkspace?.notes,
      activeNav: typeof activeNav === "string" ? activeNav : existingWorkspace?.activeNav ?? "Overview",
      updatedAt: new Date().toISOString(),
    };

    const fields = ["tasks", "customEvents", "quickLinks", "focusMinutes", "soundEnabled", "habits", "notes", "activeNav", "subscriptions"].filter(key => Object.prototype.hasOwnProperty.call(body, key));
    const result = await saveUserWorkspace(email, workspaceData, [...fields, "updatedAt"], mergingTasks ? { incoming: tasks, replacedIds: taskIds(replaceTaskIds), deletedIds: taskIds(deletedTaskIds) } : undefined);

    return NextResponse.json({
      success: result.success,
      source: result.source,
      savedAt: result.success ? workspaceData.updatedAt : undefined,
      dbStatus,
      error: result.success ? undefined : "Could not save workspace data.",
    }, { status: result.success ? 200 : 503, headers: { "Cache-Control": "private, no-store" } });
  } catch (err: unknown) {
    console.error("[user-data] Workspace write failed", err);
    return NextResponse.json({ error: "Invalid workspace payload." }, { status: 400, headers: { "Cache-Control": "private, no-store" } });
  }
}
