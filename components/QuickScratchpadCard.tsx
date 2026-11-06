"use client";

import { useState, useEffect } from "react";
import { StickyNote, Copy, Check, Plus, Trash2, ArrowRight } from "lucide-react";
import type { Task, KeepNote } from "@/types/dashboard";

type QuickScratchpadCardProps = {
  onSaveAsNote: (note: Omit<KeepNote, "id" | "createdAt" | "updatedAt">) => void;
  onAddTask: (task: Task) => void;
  onNavigateToNotes: () => void;
};

export function QuickScratchpadCard({
  onSaveAsNote,
  onAddTask,
  onNavigateToNotes,
}: QuickScratchpadCardProps) {
  const [content, setContent] = useState("");
  const [copied, setCopied] = useState(false);
  const [savedStatus, setSavedStatus] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("routino_scratchpad");
      if (stored) setContent(stored);
    } catch {}
  }, []);

  const handleChange = (val: string) => {
    setContent(val);
    try {
      localStorage.setItem("routino_scratchpad", val);
    } catch {}
  };

  const handleCopy = () => {
    if (!content.trim()) return;
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    if (!content.trim()) return;
    if (window.confirm("Clear this scratchpad?")) {
      handleChange("");
    }
  };

  const handleSaveToNotes = () => {
    if (!content.trim()) return;
    const lines = content.trim().split("\n");
    const firstLine = lines[0].replace(/^#+\s*/, "").slice(0, 45);
    onSaveAsNote({
      title: firstLine || "Quick Scratchpad",
      content: content.trim(),
      color: "yellow",
    });
    setSavedStatus("Saved to Notes!");
    setTimeout(() => setSavedStatus(null), 2500);
  };

  const handleCreateTask = () => {
    if (!content.trim()) return;
    const lines = content.trim().split("\n").filter((l) => l.trim().length > 0);
    const mainTitle = lines[0].slice(0, 80);
    onAddTask({
      id: "task-scratch-" + Date.now(),
      title: mainTitle,
      meta: "From Scratchpad",
      checked: false,
      priority: false,
      createdAt: Date.now(),
    });
    setSavedStatus("Added as Task!");
    setTimeout(() => setSavedStatus(null), 2500);
  };

  return (
    <section className="rounded-2xl border border-line bg-white p-5 shadow-card sm:p-6 flex flex-col justify-between">
      <div>
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#fefce8] text-[#ca8a04]">
              <StickyNote size={15} />
            </span>
            <div>
              <h3 className="text-[12px] font-semibold text-ink">Quick Scratchpad</h3>
              <p className="text-[10px] text-muted">Jot thoughts, ideas, or temporary text</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {content.trim() && (
              <>
                <button
                  type="button"
                  onClick={handleCopy}
                  title="Copy text"
                  className="rounded-lg p-1.5 text-muted hover:bg-black/5 hover:text-ink transition cursor-pointer"
                >
                  {copied ? <Check size={13} className="text-forest" /> : <Copy size={13} />}
                </button>
                <button
                  type="button"
                  onClick={handleClear}
                  title="Clear scratchpad"
                  className="rounded-lg p-1.5 text-muted hover:bg-black/5 hover:text-[#b91c1c] transition cursor-pointer"
                >
                  <Trash2 size={13} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Textarea */}
        <div className="relative">
          <textarea
            value={content}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Write a quick thought, paste a link, or scratch ideas here... Auto-saved locally."
            rows={5}
            className="w-full rounded-xl border border-line bg-[#fffdfa] p-3 text-[12px] text-ink placeholder:text-muted/60 outline-none focus:border-forest/60 focus:bg-white transition resize-none leading-relaxed"
          />
        </div>
      </div>

      {/* Footer Actions */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-black/[0.04] pt-3">
        <span className="text-[10px] font-medium text-muted">
          {savedStatus ? (
            <span className="text-forest font-semibold">{savedStatus}</span>
          ) : (
            `${content.trim().length} chars · Auto-saved`
          )}
        </span>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleCreateTask}
            disabled={!content.trim()}
            className="inline-flex items-center gap-1 rounded-lg border border-line bg-white px-2.5 py-1 text-[10.5px] font-semibold text-ink hover:bg-[#f4f6f1] transition disabled:opacity-40 cursor-pointer"
            title="Create task from first line"
          >
            <Plus size={11} />
            <span>To Task</span>
          </button>
          <button
            type="button"
            onClick={handleSaveToNotes}
            disabled={!content.trim()}
            className="inline-flex items-center gap-1 rounded-lg bg-forest px-3 py-1 text-[10.5px] font-semibold text-white shadow-2xs hover:bg-[#8b1116] transition disabled:opacity-40 cursor-pointer"
            title="Save permanently to Notes"
          >
            <StickyNote size={11} />
            <span>Save to Notes</span>
          </button>
        </div>
      </div>
    </section>
  );
}
