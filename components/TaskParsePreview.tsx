"use client";
import type { ParsedTask, TaskDetection } from "@/lib/taskQuickParse";
export function TaskParsePreview({ text, parsed, onDismiss, onRestore, dismissed = false }: { text: string; parsed: ParsedTask; onDismiss: (kind: TaskDetection) => void; onRestore: () => void; dismissed?: boolean }) {
  if (!parsed.matches.length && !dismissed) return <p className="text-[11px] text-muted">Try “Submit return tomorrow at 3pm !high #work”. Dates use your local timezone.</p>;
  const parts = []; let cursor = 0;
  for (const match of parsed.matches) { parts.push(text.slice(cursor, match.start)); parts.push(<mark key={match.start} className="rounded bg-forest/10 px-0.5 text-forest">{text.slice(match.start, match.end)}</mark>); cursor = match.end; }
  parts.push(text.slice(cursor));
  return <div className="space-y-1.5 text-[11px]" aria-live="polite"><p className="break-words text-muted">{parts}</p><div className="flex flex-wrap gap-1">{([
    ["date", parsed.dueDate && `Due ${parsed.dueDate}`],
    ["time", parsed.time && `Time ${parsed.time}`],
    ["priority", parsed.priority !== undefined && (parsed.priority ? "High priority" : "Normal priority")],
    ["category", parsed.category && `Category: ${parsed.category}`],
    ...parsed.tags.map(tag => [`tag:${tag}`, `Tag: #${tag}`]),
  ] as [TaskDetection, string | false | undefined][]).filter(([, label]) => label).map(([kind, label]) => <button type="button" key={kind} aria-label={`Dismiss ${label}`} onClick={() => onDismiss(kind)} className="rounded-full border border-line bg-white px-2 py-1 text-forest hover:bg-forest/10">{label} <span aria-hidden="true">×</span></button>)}{dismissed && <button type="button" className="text-forest underline" onClick={onRestore}>Restore detections</button>}</div><p className="text-muted">Task title: {parsed.title || "Add a task title"}. Custom tags are saved in context. Dismissed phrases stay in the title. Manual category and priority choices take precedence.</p></div>;
}
