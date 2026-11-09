"use client";

import { useState } from "react";
import {
  ListTodo,
  Plus,
  Check,
  Circle,
  X,
  Search,
  Filter,
  AlertCircle,
  Trash2,
  ChevronDown,
  ChevronUp,
  CheckSquare,
  Plane,
  Clock,
  Calendar,
} from "lucide-react";
import { Task } from "@/types/dashboard";
import { inferTaskCategory } from "@/lib/meeting";

type TasksViewProps = {
  tasks: Task[];
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onAddTask: (task: Omit<Task, "id" | "checked" | "createdAt">) => void;
  onOpenTaskModal: () => void;
  onToggleSubTask?: (taskId: string, subtaskId: string) => void;
};

export function TasksView({
  tasks,
  onToggleTask,
  onDeleteTask,
  onAddTask,
  onOpenTaskModal,
  onToggleSubTask,
}: TasksViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<"all" | "active" | "today" | "upcoming" | "priority" | "project" | "travel" | "completed">("all");
  const [quickTitle, setQuickTitle] = useState("");
  const [quickCategory, setQuickCategory] = useState<"work" | "personal" | "meeting" | "urgent" | "project" | "travel">("work");
  const [hasUserChangedCategory, setHasUserChangedCategory] = useState(false);
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({});

  const todayStr = new Intl.DateTimeFormat("en-CA").format(new Date());

  const toggleExpand = (id: string) => {
    setExpandedTasks((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const doneCount = tasks.filter((t) => t.checked).length;
  const todayTasksCount = tasks.filter((t) => !t.checked && (t.dueDate === todayStr || (!t.dueDate && t.meta.toLowerCase().includes("today")))).length;
  const upcomingTasksCount = tasks.filter((t) => !t.checked && Boolean(t.dueDate && t.dueDate > todayStr)).length;
  const projectTasksCount = tasks.filter((t) => t.category === "project").length;
  const travelTasksCount = tasks.filter((t) => t.category === "travel").length;
  const progressPercent = tasks.length > 0 ? (doneCount / tasks.length) * 100 : 0;

  const handleTitleChange = (val: string) => {
    setQuickTitle(val);
    if (!hasUserChangedCategory && val.trim().length > 0) {
      const detected = inferTaskCategory(val);
      if (detected !== "work") {
        setQuickCategory(detected);
      }
    }
  };

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) {
      // If user clicks "+ Add" without entering a quick title, open the detailed task modal
      onOpenTaskModal();
      return;
    }

    const finalCat = quickCategory;
    const catLabel =
      finalCat === "project"
        ? "Project"
        : finalCat === "travel"
        ? "Travel"
        : finalCat.charAt(0).toUpperCase() + finalCat.slice(1);

    onAddTask({
      title: quickTitle.trim(),
      meta: `Today · ${catLabel}`,
      priority: finalCat === "urgent",
      category: finalCat,
      dueDate: todayStr,
    });

    // Ensure the newly added task is visible in the filtered list
    if (
      selectedFilter === "completed" ||
      (selectedFilter === "priority" && finalCat !== "urgent") ||
      (selectedFilter === "project" && finalCat !== "project") ||
      (selectedFilter === "travel" && finalCat !== "travel")
    ) {
      setSelectedFilter("all");
    }

    setQuickTitle("");
    setQuickCategory("work");
    setHasUserChangedCategory(false);
  };

  const filteredTasks = tasks.filter((t) => {
    const matchQuery = t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.meta.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchQuery) return false;

    if (selectedFilter === "active") return !t.checked;
    if (selectedFilter === "completed") return t.checked;
    if (selectedFilter === "priority") return t.priority;
    if (selectedFilter === "today") return !t.checked && (t.dueDate === todayStr || (!t.dueDate && t.meta.toLowerCase().includes("today")));
    if (selectedFilter === "upcoming") return !t.checked && Boolean(t.dueDate && t.dueDate > todayStr);
    if (selectedFilter === "project") return t.category === "project";
    if (selectedFilter === "travel") return t.category === "travel";
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center border-b border-line pb-5">
        <div>
          <h2 className="text-[20px] font-bold text-ink">Priorities & Tasks</h2>
          <p className="text-[12px] text-muted">
            Manage your daily intentions and track what matters today.
          </p>
        </div>
        <button
          onClick={onOpenTaskModal}
          className="flex items-center gap-2 rounded-xl bg-forest px-4 py-2.5 text-[12px] font-semibold text-white shadow-sm hover:bg-[#8b1116] transition self-start sm:self-auto"
        >
          <Plus size={14} /> Add Priority
        </button>
      </div>

      {/* Progress Card */}
      <div className="rounded-2xl border border-line bg-white p-5 shadow-card">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[14px] font-semibold text-ink">Daily Progress</h3>
            <p className="mt-0.5 text-[11px] text-muted">
              {doneCount} of {tasks.length} tasks completed ({Math.round(progressPercent)}%)
            </p>
          </div>
          <span className="text-[22px] font-bold text-forest">{Math.round(progressPercent)}%</span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#f0f2ed]">
          <div
            className="h-full rounded-full bg-forest transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Quick Add Bar */}
      <form
        onSubmit={handleQuickAdd}
        className="flex flex-col sm:flex-row gap-2 rounded-2xl border border-line bg-white p-2 shadow-sm focus-within:border-forest/50 focus-within:ring-2 focus-within:ring-forest/10 transition-all"
      >
        <input
          type="text"
          value={quickTitle}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Add a task quickly (e.g. 'Building Spendo App' or 'Flight to Chennai')..."
          className="min-w-0 flex-1 bg-transparent px-3 text-[13px] text-ink outline-none placeholder:text-muted"
        />
        <div className="flex items-center gap-2">
          <select
            value={quickCategory}
            onChange={(e) => {
              setQuickCategory(e.target.value as "work" | "personal" | "meeting" | "urgent" | "project" | "travel");
              setHasUserChangedCategory(true);
            }}
            className="flex-1 sm:flex-initial rounded-xl border border-line bg-[#fbfcf8] px-2.5 py-1.5 text-[11px] text-ink outline-none cursor-pointer hover:bg-[#f1f3ed] transition"
          >
            <option value="work">Work</option>
            <option value="project">Project / Product</option>
            <option value="travel">Travel / Flight</option>
            <option value="personal">Personal</option>
            <option value="meeting">Meeting</option>
            <option value="urgent">Urgent</option>
          </select>
          <button
            type="submit"
            className="flex items-center justify-center gap-1.5 rounded-xl bg-forest px-4 py-1.5 text-[12px] font-semibold text-white hover:bg-[#8b1116] transition cursor-pointer shadow-2xs active:scale-95"
            title={quickTitle.trim() ? "Add task" : "Click to open task creation modal"}
          >
            <Plus size={13} /> Add
          </button>
        </div>
      </form>

      {/* Search and Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks..."
            className="w-full rounded-xl border border-line bg-white pl-9 pr-3.5 py-2 text-[12px] text-ink outline-none focus:border-forest transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setSelectedFilter("all")}
            className={`rounded-xl px-3 py-1.5 text-[11px] font-semibold transition cursor-pointer ${
              selectedFilter === "all"
                ? "bg-forest text-white"
                : "bg-white border border-line text-muted hover:bg-[#f1f3ed]"
            }`}
          >
            All ({tasks.length})
          </button>
          <button
            onClick={() => setSelectedFilter("active")}
            className={`rounded-xl px-3 py-1.5 text-[11px] font-semibold transition cursor-pointer ${
              selectedFilter === "active"
                ? "bg-forest text-white"
                : "bg-white border border-line text-muted hover:bg-[#f1f3ed]"
            }`}
          >
            Active ({tasks.length - doneCount})
          </button>
          <button
            onClick={() => setSelectedFilter("today")}
            className={`rounded-xl px-3 py-1.5 text-[11px] font-semibold transition cursor-pointer ${
              selectedFilter === "today"
                ? "bg-forest text-white"
                : "bg-white border border-line text-muted hover:bg-[#f1f3ed]"
            }`}
          >
            Due Today ({todayTasksCount})
          </button>
          {upcomingTasksCount > 0 && (
            <button
              onClick={() => setSelectedFilter("upcoming")}
              className={`rounded-xl px-3 py-1.5 text-[11px] font-semibold transition cursor-pointer ${
                selectedFilter === "upcoming"
                  ? "bg-forest text-white"
                  : "bg-white border border-line text-muted hover:bg-[#f1f3ed]"
              }`}
            >
              Upcoming ({upcomingTasksCount})
            </button>
          )}
          {projectTasksCount > 0 && (
            <button
              onClick={() => setSelectedFilter("project")}
              className={`rounded-xl px-3 py-1.5 text-[11px] font-semibold transition cursor-pointer ${
                selectedFilter === "project"
                  ? "bg-[#7c3aed] text-white"
                  : "bg-white border border-[#ddd6fe] text-[#7c3aed] hover:bg-[#f5f3ff]"
              }`}
            >
              Projects ({projectTasksCount})
            </button>
          )}
          {travelTasksCount > 0 && (
            <button
              onClick={() => setSelectedFilter("travel")}
              className={`inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-[11px] font-semibold transition cursor-pointer ${
                selectedFilter === "travel"
                  ? "bg-[#0284c7] text-white"
                  : "bg-white border border-[#bae6fd] text-[#0284c7] hover:bg-[#f0f9ff]"
              }`}
            >
              <Plane size={11} /> Travel ({travelTasksCount})
            </button>
          )}
          <button
            onClick={() => setSelectedFilter("priority")}
            className={`rounded-xl px-3 py-1.5 text-[11px] font-semibold transition cursor-pointer ${
              selectedFilter === "priority"
                ? "bg-forest text-white"
                : "bg-white border border-line text-muted hover:bg-[#f1f3ed]"
            }`}
          >
            Priority
          </button>
          <button
            onClick={() => setSelectedFilter("completed")}
            className={`rounded-xl px-3 py-1.5 text-[11px] font-semibold transition cursor-pointer ${
              selectedFilter === "completed"
                ? "bg-forest text-white"
                : "bg-white border border-line text-muted hover:bg-[#f1f3ed]"
            }`}
          >
            Completed ({doneCount})
          </button>
        </div>
      </div>

      {/* Task List */}
      <div className="rounded-2xl border border-line bg-white shadow-card overflow-hidden">
        {filteredTasks.length === 0 ? (
          <div className="py-16 text-center">
            <ListTodo size={32} className="mx-auto text-muted/40 mb-3" />
            <p className="text-[13px] font-semibold text-ink">No tasks match your criteria</p>
            <p className="mt-1 text-[11px] text-muted">All clear! Add a new task above to get started.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#eff1ec]">
            {filteredTasks.map((task) => {
              const hasSubtasks = Boolean(task.subtasks && task.subtasks.length > 0);
              const completedSubCount = task.subtasks?.filter((s) => s.completed).length || 0;
              const totalSubCount = task.subtasks?.length || 0;
              const isExpanded = expandedTasks[task.id];

              return (
                <div key={task.id} className="group hover:bg-[#fbfcf9] transition">
                  <div className="flex items-center justify-between gap-3 p-4">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <button
                        onClick={() => onToggleTask(task.id)}
                        className={`grid h-5 w-5 place-items-center rounded-full border transition-all ${
                          task.checked
                            ? "border-forest bg-forest text-white"
                            : "border-[#d6ddd4] text-transparent hover:border-forest/50"
                        }`}
                      >
                        {task.checked ? <Check size={12} /> : <Circle size={10} />}
                      </button>

                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-[13px] transition ${
                            task.checked ? "text-muted line-through" : "font-medium text-ink"
                          }`}
                        >
                          {task.title}
                        </p>
                        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[10px] text-muted">
                          <span>{task.meta}</span>
                          {task.category && (
                            <span
                              className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-bold uppercase text-[8px] ${
                                task.category === "urgent"
                                  ? "bg-[#fce8e6] text-[#c05746]"
                                  : task.category === "project"
                                  ? "bg-[#f5f3ff] text-[#7c3aed] border border-[#ddd6fe]"
                                  : task.category === "travel"
                                  ? "bg-[#f0f9ff] text-[#0284c7] border border-[#bae6fd]"
                                  : task.category === "meeting"
                                  ? "bg-[#edf0ff] text-[#6d76b1]"
                                  : task.category === "personal"
                                  ? "bg-[#eaf3e9] text-[#648266]"
                                  : "bg-[#f1f2ee] text-[#808a81]"
                              }`}
                            >
                              {task.category === "travel" && <Plane size={9} />}
                              {task.category}
                            </span>
                          )}
                          {task.dueDate && (
                            <span
                              className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-bold uppercase text-[8px] ${
                                task.dueDate < todayStr && !task.checked
                                  ? "bg-[#fef2f2] text-[#b91c1c] border border-[#fecaca]"
                                  : task.dueDate === todayStr
                                  ? "bg-[#fffbeb] text-[#b45309] border border-[#fde68a]"
                                  : "bg-[#f8fafc] text-[#475569] border border-[#e2e8f0]"
                              }`}
                            >
                              <Clock size={8} />
                              {task.dueDate < todayStr && !task.checked
                                ? `Overdue (${task.dueDate})`
                                : task.dueDate === todayStr
                                ? "Due Today"
                                : `Due ${task.dueDate}`}
                            </span>
                          )}
                          {hasSubtasks && (
                            <button
                              type="button"
                              onClick={() => toggleExpand(task.id)}
                              className="inline-flex items-center gap-1 rounded bg-[#f1f3ed] px-1.5 py-0.5 text-[9px] font-semibold text-[#5c6960] hover:bg-[#e2e6df] transition"
                            >
                              <CheckSquare size={10} />
                              {completedSubCount}/{totalSubCount} sub-steps
                              {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {task.priority && !task.checked && (
                        <span className="rounded-md bg-[#fcf0e7] px-2 py-0.5 text-[9px] font-bold text-[#b4794e]">
                          PRIORITY
                        </span>
                      )}
                      <button
                        onClick={() => onDeleteTask(task.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-muted hover:text-[#c05746] rounded transition"
                        aria-label="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Expandable subtasks checklist */}
                  {hasSubtasks && isExpanded && (
                    <div className="bg-[#fafbf7] border-t border-[#f0f2eb] px-4 sm:px-12 py-2.5 space-y-1.5">
                      {task.subtasks!.map((st) => (
                        <div
                          key={st.id}
                          onClick={() => onToggleSubTask?.(task.id, st.id)}
                          className="flex items-center gap-2.5 py-1 text-[11px] cursor-pointer group/sub"
                        >
                          <span
                            className={`grid h-3.5 w-3.5 place-items-center rounded border transition ${
                              st.completed
                                ? "border-forest bg-forest text-white"
                                : "border-[#cfd6cd] bg-white group-hover/sub:border-forest"
                            }`}
                          >
                            {st.completed && <Check size={9} />}
                          </span>
                          <span
                            className={`transition ${
                              st.completed ? "text-muted line-through" : "text-ink"
                            }`}
                          >
                            {st.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
