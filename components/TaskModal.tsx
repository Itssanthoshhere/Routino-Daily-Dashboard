"use client";

import { RelatedNotes } from "@/components/NoteConnections";
import { useState, useEffect } from "react";
import { Plus, X, AlertCircle, CheckSquare, Trash2, Plane, Sparkles, Calendar } from "lucide-react";
import { Task, SubTask } from "@/types/dashboard";
import type { TaskRecurrence } from "@/lib/taskRecurrence";
import { taskDueDay, rescheduleTaskDate } from "@/lib/taskDates";
import { builtInTaskTemplates, templateSubtasks, type TaskTemplate } from "@/lib/taskTemplates";
import { normalizeTaskTags, taskTags } from "@/lib/taskOrganization";
import { RecordDocuments } from "@/components/SubscriptionDocuments";
import type { SavedDocument } from "@/types/documents";
import { inferTaskCategory } from "@/lib/meeting";

type TaskModalProps = {
  relatedTaskId?: string;
  templates?: TaskTemplate[];
  onTemplatesChange?: (templates: TaskTemplate[]) => void;
  editing?: boolean;
  isOpen: boolean;
  onClose: () => void;
  onAddTask: (task: Omit<Task, "id" | "checked" | "createdAt">, scope?: "occurrence" | "future") => void;
  initialTask?: Partial<Omit<Task, "id" | "checked" | "createdAt">> | null;
  availableTasks?: Task[];
};

export function TaskModal({ isOpen, onClose, onAddTask, initialTask, relatedTaskId, editing = false, availableTasks = [], templates = [], onTemplatesChange }: TaskModalProps) {
  const [organizationError, setOrganizationError] = useState("");
  const [documentSession, setDocumentSession] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [inbox, setInbox] = useState(false);
  const [tags, setTags] = useState("");
  const [projectName, setProjectName] = useState("");
  const [milestone, setMilestone] = useState("");
  const [documents, setDocuments] = useState<SavedDocument[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [templateMessage, setTemplateMessage] = useState("");
  const [editScope, setEditScope] = useState<"occurrence" | "future">("future");
  const [title, setTitle] = useState("");
  const [meta, setMeta] = useState("");
  const [priority, setPriority] = useState(false);
  const [category, setCategory] = useState<"work" | "personal" | "meeting" | "urgent" | "project" | "travel">("work");
  const [repeat, setRepeat] = useState<TaskRecurrence["frequency"] | "none">("none");
  const [repeatInterval, setRepeatInterval] = useState("1");
  const [repeatUntil, setRepeatUntil] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [hasUserPickedCategory, setHasUserPickedCategory] = useState(false);
  const [subtasks, setSubtasks] = useState<SubTask[]>([]);
  const [subtaskInput, setSubtaskInput] = useState("");
  const [dependsOn, setDependsOn] = useState<string[]>((initialTask as Task | null)?.dependsOn || []);

  useEffect(() => {
    if (isOpen) {
      setOrganizationError("");
      setUploading(false); setDocumentSession(session=>session+1);
      setInbox(initialTask?.inbox || false);
      setTags(initialTask ? taskTags({meta:initialTask.meta || "",tags:initialTask.tags}).join(", ") : "");
      setProjectName(initialTask?.projectName || ""); setMilestone(initialTask?.milestone || ""); setDocuments(initialTask?.documents || []);
      setEditScope("future"); setSelectedTemplate(""); setTemplateMessage("");
      setRepeat(initialTask?.recurrence?.frequency || "none");
      setRepeatInterval(String(initialTask?.recurrence?.interval || 1));
      setRepeatUntil(initialTask?.recurrence?.until || "");
      if (initialTask) {
        setTitle(initialTask.title || "");
        setMeta(initialTask.meta || "");
        setPriority(initialTask.priority ?? false);
        setCategory(initialTask.category || "work");
        setDueDate(taskDueDay(initialTask.dueDate) || "");
        setHasUserPickedCategory(!!initialTask.category);
        setSubtasks(initialTask.subtasks || []);
      } else {
        setTitle("");
        setMeta("");
        setPriority(false);
        setCategory("work");
        setDueDate("");
        setHasUserPickedCategory(false);
        setSubtasks([]);
      }
      setSubtaskInput("");
      setDependsOn((initialTask as Task | null)?.dependsOn || []);
    }
  }, [isOpen, initialTask]);

  if (!isOpen) return null;

  const handleAddSubtask = () => {
    if (!subtaskInput.trim()) return;
    const newSub: SubTask = {
      id: "sub-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6),
      title: subtaskInput.trim(),
      completed: false,
    };
    setSubtasks((prev) => [...prev, newSub]);
    setSubtaskInput("");
  };

  const handleRemoveSubtask = (id: string) => {
    setSubtasks((prev) => prev.filter((s) => s.id !== id));
  };

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    if (!hasUserPickedCategory && newTitle.trim().length > 0) {
      const detected = inferTaskCategory(newTitle);
      if (detected !== "work") {
        setCategory(detected);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || uploading) return;
    const tagTokens=tags.split(/[,\s]+/).filter(Boolean);
    const normalizedTokens=tagTokens.map(tag=>normalizeTaskTags([tag])[0]);
    if(normalizedTokens.some(tag=>!tag)||new Set(normalizedTokens).size>20){setOrganizationError("Use up to 20 tags with letters, numbers, hyphens, or underscores. Separate them with commas or spaces.");return;}
    const interval = Number(repeatInterval);
    if (repeat !== "none" && repeat !== "weekdays" && (!Number.isInteger(interval) || interval < 1 || interval > 365)) return;

    const finalCategory = category;
    const catLabel = finalCategory === "project" ? "Project" : finalCategory === "travel" ? "Travel" : finalCategory.charAt(0).toUpperCase() + finalCategory.slice(1);

    const todayStr = new Intl.DateTimeFormat("en-CA").format(new Date());
    let defaultMeta = `${inbox ? "Inbox" : "Today"} · ${catLabel}`;
    if (dueDate) {
      if (dueDate === todayStr) defaultMeta = `Due Today · ${catLabel}`;
      else defaultMeta = `Due ${dueDate} · ${catLabel}`;
    }

    onAddTask({
      title: title.trim(),
      inbox: inbox && !dueDate,
      tags: normalizeTaskTags(tags),
      projectName: projectName.trim() || undefined,
      milestone: projectName.trim() ? milestone.trim() || undefined : undefined,
      documents,
      meta: meta.trim() || defaultMeta,
      priority,
      category: finalCategory,
      dueDate: rescheduleTaskDate(initialTask?.dueDate, dueDate),
      recurrence: repeat === "none" ? undefined : { frequency: repeat, paused: initialTask?.recurrence?.paused, interval: repeat === "weekdays" ? 1 : interval, until: repeatUntil || undefined, anchorDate: dueDate === taskDueDay(initialTask?.dueDate) ? initialTask?.recurrence?.anchorDate || dueDate : dueDate },
      subtasks: subtasks.length > 0 ? subtasks : undefined,
      link: initialTask?.link || undefined,
      dependsOn: dependsOn.length ? dependsOn : undefined,
    }, editScope);

    setTitle("");
    setMeta("");
    setPriority(false);
    setCategory("work");
    setDueDate("");
    setHasUserPickedCategory(false);
    setSubtasks([]);
    setSubtaskInput("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div role="dialog" aria-modal="true" aria-label="Task editor" className="relative w-full max-w-md rounded-2xl border border-line bg-[#fbfcf8] p-6 shadow-2xl max-h-[90dvh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-line pb-4">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#fdf2f2] text-forest">
              <Plus size={16} />
            </span>
            <div>
              <h3 className="text-[15px] font-semibold text-ink">{editing ? "Edit Task" : "Add New Task"}</h3>
              <p className="text-[11px] text-muted">{editing ? "Update task details, checklist, and repeat settings" : "Create a priority with checklist sub-steps"}</p>
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

        <form id="task-editor-form" onSubmit={handleSubmit} className="mt-5 space-y-4">
          {!editing && <div className="rounded-xl border border-line bg-white p-3 text-xs"><label>Start from a template<select aria-label="Task template" className="mt-1 w-full rounded-lg border border-line p-2" value={selectedTemplate} onChange={event => { const id = event.target.value; setSelectedTemplate(id); const template = [...builtInTaskTemplates,...templates].find(item=>item.id===id); if (!template) return; setTitle(template.title); setCategory(template.category); setPriority(template.priority); setSubtasks(templateSubtasks(template)); setHasUserPickedCategory(true); setTemplateMessage("Template applied. Review your deadline and repeat settings before adding."); }}><option value="">Choose a template</option>{[...builtInTaskTemplates,...templates].map(template=><option key={template.id} value={template.id}>{template.name}</option>)}</select></label><p className="mt-1 text-muted">Templates fill title, category, priority, and a fresh checklist. Dates and completed history are not copied.</p>{onTemplatesChange && <div className="mt-2 flex flex-wrap gap-2"><button type="button" disabled={!title.trim() || templates.length>=100} className="btn-theme rounded border border-line p-2" onClick={()=>{onTemplatesChange([...templates,{id:crypto.randomUUID(),name:title.trim(),title:title.trim(),category,priority,steps:subtasks.map(step=>step.title)}]);setTemplateMessage("Template saved to your workspace.");}}>Save current task as template</button>{templates.some(template=>template.id===selectedTemplate) && <button type="button" className="btn-theme rounded border border-line p-2" onClick={()=>{onTemplatesChange(templates.filter(template=>template.id!==selectedTemplate));setSelectedTemplate("");setTemplateMessage("Template removed. Existing tasks are unchanged.");}}>Remove saved template</button>}</div>}{templateMessage && <p role="status" className="mt-2 text-muted">{templateMessage}</p>}</div>}
          <div>
            <label className="block text-[11px] font-semibold text-ink">Task Title</label>
            <input
              type="text"
              required
              autoFocus
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="e.g. Build a sample project / Plan a trip"
              className="mt-1.5 w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-[13px] text-ink outline-none focus:border-forest transition"
            />
          </div>

          <div className="space-y-3 rounded-xl border border-line bg-white p-3 text-xs">
            <label className="flex items-center gap-2"><input type="checkbox" checked={inbox} onChange={event => { setInbox(event.target.checked); if(event.target.checked){setDueDate("");setRepeat("none");} }} />Keep in Task inbox (no deadline)</label>
            <label className="block">Tags<input aria-label="Task tags" maxLength={900} className="mt-1 w-full rounded-lg border border-line p-2" placeholder="finance, college, family" value={tags} onChange={event=>{setTags(event.target.value);setOrganizationError("");}} /></label><p className="text-muted">Up to 20 custom tags; separate with commas or spaces. Project-category and grouped tasks also show #project automatically.</p><button type="button" className="btn-theme rounded-lg border border-line px-2 py-1 text-xs disabled:opacity-40" disabled={normalizeTaskTags(tags).includes("project") || normalizeTaskTags(tags).length>=20} onClick={()=>setTags(previous=>previous.trim()?`${previous}, project`:"project")}>Add #project tag</button>
            <label className="block">Project group<input aria-label="Project group" list="task-project-options" maxLength={100} className="mt-1 w-full rounded-lg border border-line p-2" placeholder="Optional project name" value={projectName} onChange={event=>setProjectName(event.target.value)} /></label>
            <datalist id="task-project-options">{Array.from(new Set(availableTasks.map(task=>task.projectName).filter(Boolean))).map(name=><option key={name} value={name} />)}</datalist>
            <label className="block">Milestone<input aria-label="Project milestone" maxLength={100} disabled={!projectName.trim()} className="mt-1 w-full rounded-lg border border-line p-2 disabled:opacity-40" placeholder="Optional milestone name" value={milestone} onChange={event=>setMilestone(event.target.value)} /></label>
            {organizationError && <p role="alert" className="text-red-700">{organizationError}</p>}
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
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-semibold text-ink">Category</label>
                {category === "project" && (
                  <span className="rounded bg-[#f5f3ff] px-1.5 py-0.2 text-[8.5px] font-bold text-[#7c3aed] border border-[#ddd6fe]">
                    PROJECT
                  </span>
                )}
                {category === "travel" && (
                  <span className="inline-flex items-center gap-0.5 rounded bg-[#f0f9ff] px-1.5 py-0.2 text-[8.5px] font-bold text-[#0284c7] border border-[#bae6fd]">
                    <Plane size={9} /> TRAVEL
                  </span>
                )}
              </div>
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value as "work" | "personal" | "meeting" | "urgent" | "project" | "travel");
                  setHasUserPickedCategory(true);
                }}
                className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-[12px] text-ink outline-none focus:border-forest"
              >
                <option value="work">Work</option>
                <option value="project">Project / Product</option>
                <option value="travel">Travel / Flight</option>
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

          {relatedTaskId && <RelatedNotes kind="task" id={relatedTaskId} />}
          {editing && (initialTask?.recurrence || initialTask?.recurrenceTemplate) && <label className="block text-xs font-semibold">Apply changes to<select className="mt-1 w-full rounded-lg border border-line px-3 py-2" value={editScope} onChange={event => setEditScope(event.target.value as typeof editScope)}><option value="future">This and future occurrences</option><option value="occurrence">Only this occurrence</option></select><span className="mt-1 block font-normal text-muted">Completed history is preserved. Existing future dates and checklist progress stay intact.</span></label>}
          {availableTasks.filter(task => !task.checked).length > 0 && <label className="block text-xs font-semibold">Blocked until these tasks are complete<select multiple className="mt-1 h-20 w-full rounded-lg border border-line px-3 py-2" value={dependsOn} onChange={event => setDependsOn(Array.from(event.target.selectedOptions, option => option.value))}>{availableTasks.filter(task => !task.checked).map(task => <option key={task.id} value={task.id}>{task.title}</option>)}</select><span className="mt-1 block font-normal text-muted">Dependencies stay attached to the task and are preserved across devices.</span></label>}
          <div className="rounded-xl border border-line bg-white p-3 space-y-3">
            <label className="block text-xs font-semibold">
              Repeat
              <select
                className="mt-1.5 w-full rounded-lg border border-line px-3 py-2 text-sm"
                value={repeat}
                onChange={event => {
                  setRepeat(event.target.value as typeof repeat);
                  if (event.target.value !== "none") setInbox(false);
                  if (!dueDate && event.target.value !== "none") setDueDate(new Intl.DateTimeFormat("en-CA").format(new Date()));
                }}
              >
                <option value="none">Never</option>
                <option value="daily">Daily</option>
                <option value="weekdays">Weekdays</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </label>
            {repeat !== "none" && <>
              <div className="grid grid-cols-2 gap-3">
                {repeat !== "weekdays" && <label className="text-xs">
                  Repeat every ({repeat === "daily" ? "days" : repeat === "weekly" ? "weeks" : repeat === "monthly" ? "months" : "years"})
                  <input
                    required min="1" max="365" step="1" type="number"
                    className="mt-1 w-full rounded-lg border border-line px-3 py-2"
                    value={repeatInterval}
                    onChange={event => setRepeatInterval(event.target.value)}
                  />
                </label>}
                <label className="text-xs">
                  End repeat (optional)
                  <input type="date" min={dueDate || undefined} className="mt-1 w-full rounded-lg border border-line px-3 py-2" value={repeatUntil} onChange={event => setRepeatUntil(event.target.value)} />
                </label>
              </div>
              <p className="text-xs text-muted">Completing this task creates its next scheduled occurrence. Past missed dates are skipped; completed history stays saved.</p>
            </>}
          </div>

          {/* Due Date & Presets */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="flex items-center gap-1 text-[11px] font-semibold text-ink">
                <Calendar size={12} className="text-forest" />
                <span>Due Date (Optional)</span>
              </label>
              {dueDate && (
                <button
                  type="button"
                  onClick={() => { setInbox(false); setDueDate(""); }}
                  className="btn-theme-quiet text-[10px] text-muted hover:text-[#b91c1c] transition cursor-pointer"
                >
                  Clear date
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="date"
                required={repeat !== "none"}
                value={dueDate}
                onInput={event=>{setDueDate(event.currentTarget.value);if(event.currentTarget.value)setInbox(false);}}
                onChange={(e) => { setDueDate(e.target.value); if(e.target.value) setInbox(false); }}
                className="flex-1 rounded-xl border border-line bg-white px-3 py-2 text-[12px] text-ink outline-none focus:border-forest"
              />
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    const today = new Intl.DateTimeFormat("en-CA").format(new Date());
                    setDueDate(today); setInbox(false);
                  }}
                  className={`rounded-lg px-2 py-1.5 text-[10.5px] font-semibold transition cursor-pointer ${
                    dueDate === new Intl.DateTimeFormat("en-CA").format(new Date())
                      ? "bg-forest text-white"
                      : "border border-line bg-white text-muted hover:bg-[#f1f3ed]"
                  }`}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const tomorrow = new Intl.DateTimeFormat("en-CA").format(new Date(Date.now() + 86400000));
                    setDueDate(tomorrow); setInbox(false);
                  }}
                  className={`rounded-lg px-2 py-1.5 text-[10.5px] font-semibold transition cursor-pointer ${
                    dueDate === new Intl.DateTimeFormat("en-CA").format(new Date(Date.now() + 86400000))
                      ? "bg-forest text-white"
                      : "border border-line bg-white text-muted hover:bg-[#f1f3ed]"
                  }`}
                >
                  Tomorrow
                </button>
              </div>
            </div>
          </div>

          {/* Sub-steps / Checklists */}
          <div className="rounded-xl border border-line bg-white p-3.5 space-y-2.5">
            <label className="flex items-center gap-1.5 text-[11px] font-semibold text-ink">
              <CheckSquare size={13} className="text-forest" />
              Sub-steps / Mini Checklist (Optional)
            </label>

            {subtasks.length > 0 && (
              <div className="space-y-1.5 mb-2 max-h-36 overflow-y-auto pr-1">
                {subtasks.map((st, i) => (
                  <div
                    key={st.id}
                    className="flex items-center justify-between rounded-lg bg-[#f8f9f5] px-2.5 py-1.5 text-[11px] text-ink"
                  >
                    <span className="flex items-center gap-2 truncate">
                      <span className="text-[10px] text-muted font-mono">{i + 1}.</span>
                      <span className="truncate">{st.title}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubtask(st.id)}
                      className="btn-theme-quiet p-1 text-muted hover:text-[#c05746] transition"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={subtaskInput}
                onChange={(e) => setSubtaskInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddSubtask();
                  }
                }}
                placeholder="e.g. Outline key points, check budget table..."
                className="flex-1 rounded-lg border border-line bg-[#fdfcf9] px-2.5 py-1.5 text-[11px] text-ink outline-none focus:border-forest"
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                disabled={!subtaskInput.trim()}
                className="rounded-lg bg-[#f1f3ed] px-3 py-1.5 text-[11px] font-semibold text-ink hover:bg-[#e2e6df] disabled:opacity-40 transition"
              >
                + Add
              </button>
            </div>
          </div>

        </form>
        <RecordDocuments key={documentSession} recordName={title || "Task"} label="Attachments & reference links" uploadLabel="Upload attachment" saveHint="References save with this occurrence when you save the task. Later repeating occurrences start without attachments. Canceling leaves the saved task unchanged." documents={documents} onChange={setDocuments} onBusyChange={setUploading} disabled={false} />
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
              form="task-editor-form"
              disabled={uploading}
              className="rounded-xl bg-forest px-5 py-2.5 text-[12px] font-semibold text-white shadow transition hover:bg-[#8b1116] disabled:opacity-40"
            >
              {editing ? "Save changes" : "Add Priority"}
            </button>
          </div>

      </div>
    </div>
  );
}
