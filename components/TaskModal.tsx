"use client";

import { useState } from "react";
import { Plus, X, Tag, Calendar, AlertCircle } from "lucide-react";
import { Task } from "@/types/dashboard";

type TaskModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onAddTask: (task: Omit<Task, "id" | "checked" | "createdAt">) => void;
};

export function TaskModal({ isOpen, onClose, onAddTask }: TaskModalProps) {
  const [title, setTitle] = useState("");
  const [meta, setMeta] = useState("");
  const [priority, setPriority] = useState(false);
  const [category, setCategory] = useState<"work" | "personal" | "meeting" | "urgent">("work");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAddTask({
      title: title.trim(),
      meta: meta.trim() || `Today · ${category.charAt(0).toUpperCase() + category.slice(1)}`,
      priority,
      category,
    });

    setTitle("");
    setMeta("");
    setPriority(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md rounded-2xl border border-line bg-[#fbfcf8] p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-line pb-4">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#fdf2f2] text-forest">
              <Plus size={16} />
            </span>
            <div>
              <h3 className="text-[15px] font-semibold text-ink">Add New Task</h3>
              <p className="text-[11px] text-muted">Create a priority to keep your day intentional</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted hover:bg-[#edf0e9] hover:text-ink transition"
            aria-label="Close"
          >
            <X size={17} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-ink">Task Title</label>
            <input
              type="text"
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Finalize presentation slides"
              className="mt-1.5 w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-[13px] text-ink outline-none focus:border-forest transition"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-ink">Context / Timing</label>
            <input
              type="text"
              value={meta}
              onChange={(e) => setMeta(e.target.value)}
              placeholder="e.g. Before 2:00 PM · 45 min needed"
              className="mt-1.5 w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-[13px] text-ink outline-none focus:border-forest transition"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-ink mb-1.5">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as "work" | "personal" | "meeting" | "urgent")}
                className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-[12px] text-ink outline-none focus:border-forest"
              >
                <option value="work">Work</option>
                <option value="personal">Personal</option>
                <option value="meeting">Meeting Prep</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-ink mb-1.5">Priority</label>
              <button
                type="button"
                onClick={() => setPriority(!priority)}
                className={`flex w-full items-center justify-center gap-1.5 rounded-xl border py-2.5 text-[12px] font-semibold transition ${
                  priority
                    ? "border-[#f7c29e] bg-[#fdf0e6] text-[#b4794e]"
                    : "border-line bg-white text-muted hover:bg-[#fafbf8]"
                }`}
              >
                <AlertCircle size={14} />
                {priority ? "High Priority" : "Normal"}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-line pt-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2.5 text-[12px] font-medium text-muted hover:bg-[#f1f3ed] transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-forest px-5 py-2.5 text-[12px] font-semibold text-white shadow transition hover:bg-[#8b1116]"
            >
              Add Priority
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
