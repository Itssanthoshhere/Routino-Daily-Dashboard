"use client";

import { useState, useEffect } from "react";
import { StickyNote, Copy, Check, Plus, Trash2, ArrowRight, ListTodo, ChevronDown, ChevronUp } from "lucide-react";
import type { Task, KeepNote } from "@/types/dashboard";
import { inferTaskCategory } from "@/lib/meeting";

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
  const [showLineExtractor, setShowLineExtractor] = useState(false);

  const lines = content
    .split("\n")
    .map((l) => l.replace(/^[-*•\d.]+\s*/, "").trim())
    .filter((l) => l.length > 0);

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
    const rawLines = content.trim().split("\n");
    const firstLine = rawLines[0].replace(/^#+\s*/, "").slice(0, 45);
    onSaveAsNote({
      title: firstLine || "Quick Scratchpad",
      content: content.trim(),
      color: "yellow",
    });
    setSavedStatus("Saved to Notes!");
    setTimeout(() => setSavedStatus(null), 2500);
  };

  const handleCreateTaskFromLine = (lineText: string, lineIndex: number) => {
    const inferred = inferTaskCategory(lineText);
    const catLabel = inferred === "project" ? "Project" : inferred === "travel" ? "Travel" : inferred.charAt(0).toUpperCase() + inferred.slice(1);
    onAddTask({
      id: "task-scratch-" + Date.now() + "-" + lineIndex,
      title: lineText.slice(0, 80),
      meta: `From Scratchpad · ${catLabel}`,
      checked: false,
      priority: inferred === "urgent",
      category: inferred,
      createdAt: Date.now(),
    });
    setSavedStatus(`Added "${lineText.slice(0, 20)}..."!`);
    setTimeout(() => setSavedStatus(null), 2500);
  };

  const handleCreateAllTasks = () => {
    if (lines.length === 0) return;
    lines.forEach((lineText, idx) => {
      const inferred = inferTaskCategory(lineText);
      const catLabel = inferred === "project" ? "Project" : inferred === "travel" ? "Travel" : inferred.charAt(0).toUpperCase() + inferred.slice(1);
      onAddTask({
        id: "task-scratch-" + Date.now() + "-" + idx,
        title: lineText.slice(0, 80),
        meta: `From Scratchpad · ${catLabel}`,
        checked: false,
        priority: inferred === "urgent",
        category: inferred,
        createdAt: Date.now() + idx,
      });
    });
    setSavedStatus(`Added ${lines.length} tasks!`);
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
            rows={4}
            className="w-full rounded-xl border border-line bg-[#fffdfa] p-3 text-[12px] text-ink placeholder:text-muted/60 outline-none focus:border-forest/60 focus:bg-white transition resize-none leading-relaxed"
          />
        </div>

        {/* 1-Click Line Extractor Preview */}
        {lines.length > 1 && (
          <div className="mt-2">
            <button
              type="button"
              onClick={() => setShowLineExtractor((prev) => !prev)}
              className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-[#0284c7] hover:text-[#0369a1] transition cursor-pointer"
            >
              <ListTodo size={12} />
              <span>Convert Lines to Tasks ({lines.length})</span>
              {showLineExtractor ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            </button>

            {showLineExtractor && (
              <div className="mt-1.5 space-y-1 max-h-36 overflow-y-auto rounded-xl border border-line bg-[#fbfcf8] p-2 animate-in fade-in duration-150">
                {lines.map((l, idx) => {
                  const cat = inferTaskCategory(l);
                  return (
                    <div
                      key={`line-${idx}`}
                      className="flex items-center justify-between gap-2 rounded-lg bg-white p-1.5 text-[11px] border border-black/5 hover:border-black/10 transition"
                    >
                      <span className="truncate flex-1 font-medium text-ink">{l}</span>
                      <span className="rounded bg-black/5 px-1 py-0.2 text-[8px] font-bold uppercase text-muted">
                        {cat}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCreateTaskFromLine(l, idx)}
                        className="inline-flex items-center gap-0.5 rounded bg-forest/10 px-2 py-0.5 text-[10px] font-bold text-forest hover:bg-forest hover:text-white transition cursor-pointer shrink-0"
                      >
                        <Plus size={10} /> Task
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-black/[0.04] pt-3">
        <span className="text-[10px] font-medium text-muted">
          {savedStatus ? (
            <span className="text-forest font-semibold">{savedStatus}</span>
          ) : (
            `${lines.length} ${lines.length === 1 ? "line" : "lines"} · Auto-saved`
          )}
        </span>

        <div className="flex items-center gap-1.5">
          {lines.length > 1 ? (
            <button
              type="button"
              onClick={handleCreateAllTasks}
              className="inline-flex items-center gap-1 rounded-lg border border-line bg-white px-2.5 py-1 text-[10.5px] font-semibold text-ink hover:bg-[#f4f6f1] transition cursor-pointer"
              title="Convert all lines to separate tasks"
            >
              <ListTodo size={11} />
              <span>All to Tasks ({lines.length})</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => lines[0] && handleCreateTaskFromLine(lines[0], 0)}
              disabled={lines.length === 0}
              className="inline-flex items-center gap-1 rounded-lg border border-line bg-white px-2.5 py-1 text-[10.5px] font-semibold text-ink hover:bg-[#f4f6f1] transition disabled:opacity-40 cursor-pointer"
              title="Create task from text"
            >
              <Plus size={11} />
              <span>To Task</span>
            </button>
          )}

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
