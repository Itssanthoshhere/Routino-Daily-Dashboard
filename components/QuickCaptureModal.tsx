"use client";

import { useState, useRef, useEffect } from "react";
import { X, Zap, CheckSquare, StickyNote, PenTool, Sparkles, Check, Plane, Mic } from "lucide-react";
import type { Task, KeepNote } from "@/types/dashboard";
import { normalizeTaskTags } from "@/lib/taskOrganization";
import { inferTaskCategory } from "@/lib/meeting";

import { parseTaskQuickAdd, quickTaskContext, type TaskDetection } from "@/lib/taskQuickParse";
import { findTaskDuplicates, duplicateWarningKey } from "@/lib/taskDuplicates";
import { TaskDuplicateWarning } from "@/components/TaskDuplicateWarning";
import { TaskParsePreview } from "@/components/TaskParsePreview";

type CaptureType = "task" | "note" | "scratchpad";
type Recognition = { start: () => void; stop: () => void; abort: () => void; lang: string; continuous: boolean; interimResults: boolean; onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null; onerror: (() => void) | null; onend: (() => void) | null };

type QuickCaptureModalProps = {
  tasks: Task[];
  isOpen: boolean;
  onClose: () => void;
  onOpenTask: (id: string) => void;
  onAddTask: (task: Task) => void;
  onAddNote: (note: Omit<KeepNote, "id" | "createdAt" | "updatedAt">) => void;
  onAppendScratchpad: (text: string) => void;
};

export function QuickCaptureModal({
  tasks,
  isOpen,
  onClose,
  onOpenTask,
  onAddTask,
  onAddNote,
  onAppendScratchpad,
}: QuickCaptureModalProps) {
  const [allowedDuplicate, setAllowedDuplicate] = useState<string | null>(null);
  const [captureInbox, setCaptureInbox] = useState(true);
  const [type, setType] = useState<CaptureType>("task");
  const [ignoredDetections, setIgnoredDetections] = useState<TaskDetection[]>([]);
  const [text, setText] = useState("");
  const [isPriority, setIsPriority] = useState<boolean | null>(null);
  const [manualCategory, setManualCategory] = useState<Task["category"] | null>(null);
  const [noteColor, setNoteColor] = useState<KeepNote["color"]>("default");
  const [savedSuccess, setSavedSuccess] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<Recognition | null>(null);
  const [listening, setListening] = useState(false);
  const [voiceMessage, setVoiceMessage] = useState("");
  useEffect(() => {
    if (!isOpen) { recognitionRef.current?.abort(); setListening(false); }
    return () => { recognitionRef.current?.abort(); };
  }, [isOpen]);
  const startVoice = () => {
    if (listening) { recognitionRef.current?.stop(); return; }
    const browser = window as typeof window & { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
    const Constructor = browser.SpeechRecognition || browser.webkitSpeechRecognition;
    if (!Constructor) { setVoiceMessage("Speech recognition is unavailable in this browser. You can still type your thought."); return; }
    const recognition = new Constructor();
    recognitionRef.current = recognition;
    recognition.lang = navigator.language || "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = event => { const transcript = Array.from(event.results).map(result => result[0].transcript).join(" ").trim(); setText(previous => [previous.trim(), transcript].filter(Boolean).join(" ")); };
    recognition.onerror = () => { setListening(false); setVoiceMessage("Could not hear you. Check microphone permission and try again."); };
    recognition.onend = () => setListening(false);
    try { recognition.start(); setListening(true); setVoiceMessage(""); } catch { setVoiceMessage("Microphone could not start. Please try again."); }
  };

  useEffect(() => {
    if (isOpen) {
      setText("");
      setIgnoredDetections([]);
      setIsPriority(null);
      setManualCategory(null);
      setSavedSuccess(false);
      setAllowedDuplicate(null);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const parsed = parseTaskQuickAdd(text, new Date(), ignoredDetections);
  const duplicates = findTaskDuplicates(parsed.title, tasks);
  const warningKey = duplicateWarningKey(JSON.stringify([text, parsed.title]), duplicates);
  const duplicateAllowed = allowedDuplicate === warningKey;
  const effectivePriority = isPriority ?? parsed.priority ?? false;
  const currentCategory: NonNullable<Task["category"]> = manualCategory || parsed.category || (text.trim() ? (ignoredDetections.includes("category") ? "work" : inferTaskCategory(text.trim())) : (isPriority ? "urgent" : "work"));

  const handleCapture = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || (type === "task" && !parsed.title)) return;
    recognitionRef.current?.abort();

    if (type === "task") {
      if (duplicates.length && !duplicateAllowed) return;
      const catLabel = currentCategory === "project" ? "Project" : currentCategory === "travel" ? "Travel" : currentCategory.charAt(0).toUpperCase() + currentCategory.slice(1);
      onAddTask({
        id: "task-quick-" + Date.now(),
        title: parsed.title,
        meta: quickTaskContext(parsed, catLabel, captureInbox ? "Inbox" : "Today"),
        inbox: captureInbox && !parsed.dueDate,
        tags: normalizeTaskTags(parsed.tags),
        dueDate: parsed.dueDate,
        checked: false,
        priority: effectivePriority,
        category: currentCategory,
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
      setAllowedDuplicate(null);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm p-4 pt-4 sm:pt-32 animate-in fade-in duration-150">
      <div role="dialog" aria-modal="true" aria-label="Quick capture" className="relative max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-9rem)] overflow-y-auto w-full max-w-lg rounded-2xl border border-line bg-[#fbfcf8] p-5 shadow-2xl animate-in zoom-in-95 duration-150">
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
            aria-label="Close quick capture"
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
          <button type="button" onClick={startVoice} aria-pressed={listening} className="flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-xs text-forest hover:bg-forest hover:text-white"><Mic size={14} />{listening ? "Stop listening" : "Speak your thought"}</button>
          <p role="status" className="text-[10px] text-muted">{voiceMessage || (listening ? "Listening… your words will appear below." : "Review your transcript before saving. Your browser may use its speech service to process audio.")}</p>
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => { setText(e.target.value); setAllowedDuplicate(null); setIgnoredDetections([]); }}
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

          {type === "task" && <TaskParsePreview text={text} parsed={parsed} dismissed={!!ignoredDetections.length} onDismiss={kind => setIgnoredDetections(previous => [...previous, kind])} onRestore={() => setIgnoredDetections([])} />}

          {type === "task" && <TaskDuplicateWarning onOpenTask={id => { recognitionRef.current?.abort(); onClose(); onOpenTask(id); }} tasks={duplicates} allowed={duplicateAllowed} onAllow={allowed => setAllowedDuplicate(allowed ? warningKey : null)} />}

          {type === "task" && <label className="flex items-center gap-2 text-xs text-muted"><input type="checkbox" checked={captureInbox} onChange={event=>setCaptureInbox(event.target.checked)} />Keep undated captures in Task inbox</label>}

          {/* Contextual Options */}
          <div className="flex items-center justify-between pt-1">
            {type === "task" ? (
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-medium text-ink">
                  <input
                    type="checkbox"
                    checked={effectivePriority}
                    onChange={(e) => setIsPriority(e.target.checked)}
                    className="rounded border-line text-forest focus:ring-forest cursor-pointer"
                  />
                  <span>High Priority</span>
                </label>
                <div className="flex flex-wrap items-center gap-1">
                  {(["work", "personal", "project", "travel", "urgent"] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setManualCategory(cat)}
                      className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase transition cursor-pointer ${
                        currentCategory === cat
                          ? cat === "project"
                            ? "bg-[#7c3aed] text-white"
                            : cat === "travel"
                            ? "bg-[#0284c7] text-white"
                            : cat === "urgent"
                            ? "bg-[#c05746] text-white"
                            : "bg-forest text-white"
                          : "bg-black/5 text-muted hover:text-ink"
                      }`}
                    >
                      {cat === "travel" && <Plane size={9} />}
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
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
              disabled={!text.trim() || (type === "task" && (!parsed.title || (!!duplicates.length && !duplicateAllowed)))}
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
