"use client";

import { useState, useRef, useEffect } from "react";
import { X, Zap, CheckSquare, StickyNote, PenTool, Sparkles, Check } from "lucide-react";
import type { Task, KeepNote } from "@/types/dashboard";

type CaptureType = "task" | "note" | "scratchpad";

type QuickCaptureModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onAddTask: (task: Task) => void;
  onAddNote: (note: Omit<KeepNote, "id" | "createdAt" | "updatedAt">) => void;
  onAppendScratchpad: (text: string) => void;
};

export function QuickCaptureModal({
  isOpen,
  onClose,
  onAddTask,
  onAddNote,
  onAppendScratchpad,
}: QuickCaptureModalProps) {
  const [type, setType] = useState<CaptureType>("task");
  const [text, setText] = useState("");
  const [isPriority, setIsPriority] = useState(false);
  const [noteColor, setNoteColor] = useState<KeepNote["color"]>("default");
  const [savedSuccess, setSavedSuccess] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setText("");
      setIsPriority(false);
      setSavedSuccess(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCapture = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    if (type === "task") {
      onAddTask({
        id: "task-quick-" + Date.now(),
        title: text.trim(),
        meta: isPriority ? "High Priority · Quick Capture" : "Captured via Quick Hotkey (Q)",
        checked: false,
        priority: isPriority,
        category: isPriority ? "urgent" : "work",
        createdAt: Date.now(),
      });
    } else if (type === "note") {
      onAddNote({
        title: text.trim().slice(0, 50),
        content: text.trim(),
        color: noteColor,
      });
    } else if (type === "scratchpad") {
      onAppendScratchpad(text.trim());
    }

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm p-4 pt-24 sm:pt-32 animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-2xl border border-line bg-[#fbfcf8] p-5 shadow-2xl animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-line">
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-forest/10 text-forest">
              <Zap size={15} />
            </span>
            <div>
              <h3 className="text-[13px] font-bold text-ink">Quick Capture (Q)</h3>
              <p className="text-[10px] text-muted">Instantly dump thoughts to task, note, or scratchpad</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-muted hover:bg-black/5 hover:text-ink transition cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Destination Type Switcher */}
        <div className="mt-3.5 flex rounded-xl bg-black/5 p-1 border border-black/5 text-[11px] font-bold">
          <button
            type="button"
            onClick={() => setType("task")}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1.5 transition cursor-pointer ${
              type === "task" ? "bg-white text-ink shadow-2xs" : "text-muted hover:text-ink"
            }`}
          >
            <CheckSquare size={13} className="text-forest" />
            <span>Task</span>
          </button>
          <button
            type="button"
            onClick={() => setType("note")}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1.5 transition cursor-pointer ${
              type === "note" ? "bg-white text-ink shadow-2xs" : "text-muted hover:text-ink"
            }`}
          >
            <StickyNote size={13} className="text-[#ca8a04]" />
            <span>Note</span>
          </button>
          <button
            type="button"
            onClick={() => setType("scratchpad")}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1.5 transition cursor-pointer ${
              type === "scratchpad" ? "bg-white text-ink shadow-2xs" : "text-muted hover:text-ink"
            }`}
          >
            <PenTool size={13} className="text-[#2563eb]" />
            <span>Scratchpad</span>
          </button>
        </div>

        {/* Input Form */}
        <form onSubmit={handleCapture} className="mt-3.5 space-y-3">
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              type === "task"
                ? "What needs to get done? (Press Enter to save)..."
                : type === "note"
                ? "Jot note idea or snippet..."
                : "Append to quick scratchpad..."
            }
            className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-[13px] text-ink placeholder:text-muted/60 outline-none focus:border-forest shadow-2xs"
            autoFocus
          />

          {/* Contextual Options */}
          <div className="flex items-center justify-between pt-1">
            {type === "task" ? (
              <label className="flex items-center gap-2 cursor-pointer text-[11px] font-medium text-ink">
                <input
                  type="checkbox"
                  checked={isPriority}
                  onChange={(e) => setIsPriority(e.target.checked)}
                  className="rounded border-line text-forest focus:ring-forest cursor-pointer"
                />
                <span>Mark as High Priority</span>
              </label>
            ) : type === "note" ? (
              <div className="flex items-center gap-1.5">
                {(["default", "yellow", "green", "blue", "peach", "purple"] as const).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNoteColor(c)}
                    className={`h-4 w-4 rounded-full border transition cursor-pointer ${
                      c === "yellow" ? "bg-[#fef9c3]" : c === "green" ? "bg-[#ecfdf5]" : c === "blue" ? "bg-[#eff6ff]" : c === "peach" ? "bg-[#fff7ed]" : c === "purple" ? "bg-[#faf5ff]" : "bg-white"
                    } ${noteColor === c ? "ring-2 ring-forest scale-110" : ""}`}
                  />
                ))}
              </div>
            ) : (
              <span className="text-[10px] text-muted">Will append to your Overview Scratchpad</span>
            )}

            <button
              type="submit"
              disabled={!text.trim()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-forest px-4 py-1.5 text-[11px] font-bold text-white shadow-2xs hover:bg-[#8b1116] transition disabled:opacity-40 cursor-pointer"
            >
              {savedSuccess ? (
                <>
                  <Check size={12} />
                  <span>Captured!</span>
                </>
              ) : (
                <>
                  <Sparkles size={12} />
                  <span>Capture (Enter)</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
