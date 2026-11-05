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
} from "lucide-react";
import { Task } from "@/types/dashboard";

type TasksViewProps = {
  tasks: Task[];
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onAddTask: (task: Omit<Task, "id" | "checked" | "createdAt">) => void;
  onOpenTaskModal: () => void;
};

export function TasksView({
  tasks,
  onToggleTask,
  onDeleteTask,
  onAddTask,
  onOpenTaskModal,
}: TasksViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<"all" | "active" | "completed" | "priority">("all");
  const [quickTitle, setQuickTitle] = useState("");
  const [quickCategory, setQuickCategory] = useState<"work" | "personal" | "meeting" | "urgent">("work");

  const doneCount = tasks.filter((t) => t.checked).length;
  const progressPercent = tasks.length > 0 ? (doneCount / tasks.length) * 100 : 0;

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    onAddTask({
      title: quickTitle.trim(),
      meta: `Today · ${quickCategory.charAt(0).toUpperCase() + quickCategory.slice(1)}`,
      priority: quickCategory === "urgent",
      category: quickCategory,
    });

    setQuickTitle("");
  };

  const filteredTasks = tasks.filter((t) => {
    const matchQuery = t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.meta.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchQuery) return false;

    if (selectedFilter === "active") return !t.checked;
    if (selectedFilter === "completed") return t.checked;
    if (selectedFilter === "priority") return t.priority;
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
      <form onSubmit={handleQuickAdd} className="flex gap-2 rounded-2xl border border-line bg-white p-2 shadow-sm">
        <input
          type="text"
          value={quickTitle}
          onChange={(e) => setQuickTitle(e.target.value)}
          placeholder="Add a task quickly (e.g. 'Draft quarterly report')..."
          className="min-w-0 flex-1 bg-transparent px-3 text-[13px] text-ink outline-none placeholder:text-muted"
        />
        <select
          value={quickCategory}
          onChange={(e) => setQuickCategory(e.target.value as "work" | "personal" | "meeting" | "urgent")}
          className="rounded-xl border border-line bg-[#fbfcf8] px-2.5 py-1.5 text-[11px] text-ink outline-none"
        >
          <option value="work">Work</option>
          <option value="personal">Personal</option>
          <option value="meeting">Meeting</option>
          <option value="urgent">Urgent</option>
        </select>
        <button
          type="submit"
          className="flex items-center gap-1.5 rounded-xl bg-forest px-4 py-1.5 text-[12px] font-semibold text-white hover:bg-[#8b1116] transition"
        >
          <Plus size={13} /> Add
        </button>
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

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSelectedFilter("all")}
            className={`rounded-xl px-3 py-1.5 text-[11px] font-semibold transition ${
              selectedFilter === "all"
                ? "bg-forest text-white"
                : "bg-white border border-line text-muted hover:bg-[#f1f3ed]"
            }`}
          >
            All ({tasks.length})
          </button>
          <button
            onClick={() => setSelectedFilter("active")}
            className={`rounded-xl px-3 py-1.5 text-[11px] font-semibold transition ${
              selectedFilter === "active"
                ? "bg-forest text-white"
                : "bg-white border border-line text-muted hover:bg-[#f1f3ed]"
            }`}
          >
            Active ({tasks.length - doneCount})
          </button>
          <button
            onClick={() => setSelectedFilter("completed")}
            className={`rounded-xl px-3 py-1.5 text-[11px] font-semibold transition ${
              selectedFilter === "completed"
                ? "bg-forest text-white"
                : "bg-white border border-line text-muted hover:bg-[#f1f3ed]"
            }`}
          >
            Completed ({doneCount})
          </button>
          <button
            onClick={() => setSelectedFilter("priority")}
            className={`rounded-xl px-3 py-1.5 text-[11px] font-semibold transition ${
              selectedFilter === "priority"
                ? "bg-forest text-white"
                : "bg-white border border-line text-muted hover:bg-[#f1f3ed]"
            }`}
          >
            Priority
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
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                className="group flex items-center justify-between gap-3 p-4 hover:bg-[#fbfcf9] transition"
              >
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
                    <div className="mt-0.5 flex items-center gap-2 text-[10px] text-muted">
                      <span>{task.meta}</span>
                      {task.category && (
                        <span
                          className={`rounded px-1.5 py-0.5 font-bold uppercase text-[8px] ${
                            task.category === "urgent"
                              ? "bg-[#fce8e6] text-[#c05746]"
                              : task.category === "meeting"
                              ? "bg-[#edf0ff] text-[#6d76b1]"
                              : task.category === "personal"
                              ? "bg-[#eaf3e9] text-[#648266]"
                              : "bg-[#f1f2ee] text-[#808a81]"
                          }`}
                        >
                          {task.category}
                        </span>
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
