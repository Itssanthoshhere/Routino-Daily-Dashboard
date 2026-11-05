"use client";

import { useState, useRef } from "react";
import {
  X,
  Settings,
  Download,
  Upload,
  Volume2,
  Trash2,
  ExternalLink,
  Timer,
  Cloud,
  Database,
  RefreshCw,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  Keyboard,
} from "lucide-react";
import { appConfig } from "@/lib/config";
import { Task, DashboardEvent, QuickLink } from "@/types/dashboard";
import { LinkedInConnectionCard } from "@/components/LinkedInConnectionCard";
import { OutlookConnectionCard } from "@/components/OutlookConnectionCard";

type PreferencesModalProps = {
  isOpen: boolean;
  onClose: () => void;
  focusMinutes: number;
  onUpdateFocusMinutes: (mins: number) => void;
  tasks: Task[];
  customEvents: DashboardEvent[];
  quickLinks: QuickLink[];
  onImportData: (data: {
    tasks?: Task[];
    customEvents?: DashboardEvent[];
    quickLinks?: QuickLink[];
    focusMinutes?: number;
  }) => void;
  onClearCompletedTasks: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  userEmail?: string | null;
  onSyncDatabase?: () => Promise<void>;
  isSyncing?: boolean;
  lastSyncedAt?: string | null;
  dbSource?: string;
  onOutlookChange?: () => void;
};

export function PreferencesModal({
  isOpen,
  onClose,
  focusMinutes,
  onUpdateFocusMinutes,
  tasks,
  customEvents,
  quickLinks,
  onImportData,
  onClearCompletedTasks,
  soundEnabled,
  onToggleSound,
  userEmail,
  onSyncDatabase,
  isSyncing = false,
  lastSyncedAt,
  dbSource = "Local Cache",
  onOutlookChange,
}: PreferencesModalProps) {
  const [activeTab, setActiveTab] = useState<"general" | "data" | "shortcuts" | "about">("general");
  const [copiedStatus, setCopiedStatus] = useState(false);
  const [syncSuccessToast, setSyncSuccessToast] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Export all workspace data to a JSON file
  const handleExportData = () => {
    const exportPayload = {
      version: "1.0.0",
      exportedAt: new Date().toISOString(),
      appName: appConfig.name,
      data: {
        focusMinutes,
        tasks,
        customEvents,
        quickLinks,
      },
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `routino-workspace-backup-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setCopiedStatus(true);
    setTimeout(() => setCopiedStatus(false), 2500);
  };

  // Import workspace data from a JSON file
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.data) {
          onImportData({
            tasks: parsed.data.tasks,
            customEvents: parsed.data.customEvents,
            quickLinks: parsed.data.quickLinks,
            focusMinutes: parsed.data.focusMinutes,
          });
          onClose();
        }
      } catch {
        alert("Invalid workspace backup file. Please select a valid Routino JSON file.");
      }
    };
    reader.readAsText(file);
  };

  const handleManualSync = async () => {
    if (!onSyncDatabase) return;
    try {
      await onSyncDatabase();
      setSyncSuccessToast(true);
      setTimeout(() => setSyncSuccessToast(false), 3000);
    } catch {
      // Ignored
    }
  };

  const completedCount = tasks.filter((t) => t.checked).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-3xl border border-line bg-[#fbfcf8] p-6 sm:p-7 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line pb-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-forest text-accent shadow-sm">
              <Settings size={17} />
            </span>
            <div>
              <h3 className="text-[16px] font-bold text-ink">Preferences</h3>
              <p className="text-[11px] text-muted">Customize your daily routine and workspace</p>
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

        {/* Navigation Tabs */}
        <div className="mt-4 flex items-center gap-1.5 border-b border-line pb-3 shrink-0">
          <button
            onClick={() => setActiveTab("general")}
            className={`rounded-xl px-3.5 py-1.5 text-[11px] font-semibold transition ${
              activeTab === "general"
                ? "bg-forest text-white shadow-sm"
                : "text-muted hover:bg-[#f1f3ed] hover:text-ink"
            }`}
          >
            General & Routine
          </button>
          <button
            onClick={() => setActiveTab("data")}
            className={`rounded-xl px-3.5 py-1.5 text-[11px] font-semibold transition ${
              activeTab === "data"
                ? "bg-forest text-white shadow-sm"
                : "text-muted hover:bg-[#f1f3ed] hover:text-ink"
            }`}
          >
            Database & Sync
          </button>
          <button
            onClick={() => setActiveTab("shortcuts")}
            className={`rounded-xl px-3.5 py-1.5 text-[11px] font-semibold transition ${
              activeTab === "shortcuts"
                ? "bg-forest text-white shadow-sm"
                : "text-muted hover:bg-[#f1f3ed] hover:text-ink"
            }`}
          >
            Shortcuts
          </button>
          <button
            onClick={() => setActiveTab("about")}
            className={`rounded-xl px-3.5 py-1.5 text-[11px] font-semibold transition ${
              activeTab === "about"
                ? "bg-forest text-white shadow-sm"
                : "text-muted hover:bg-[#f1f3ed] hover:text-ink"
            }`}
          >
            About
          </button>
        </div>

        {/* Tab Content (Scrollable) */}
        <div className="mt-4 overflow-y-auto pr-1 space-y-4 flex-1">
          {/* Tab 1: General & Routine */}
          {activeTab === "general" && (
            <div className="space-y-4">
              {/* Focus Duration Setting */}
              <div className="rounded-2xl border border-line bg-white p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-[12px] font-semibold text-ink flex items-center gap-1.5">
                      <Timer size={14} className="text-forest" /> Default Focus Session
                    </h4>
                    <p className="mt-0.5 text-[11px] text-muted">Set your target deep work block length</p>
                  </div>
                  <span className="rounded-lg bg-[#fdf2f2] px-2.5 py-1 text-[11px] font-bold text-forest">
                    {focusMinutes}m
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {[25, 45, 60, 90].map((mins) => (
                    <button
                      key={mins}
                      onClick={() => onUpdateFocusMinutes(mins)}
                      className={`rounded-xl py-2 text-[11px] font-semibold transition ${
                        focusMinutes === mins
                          ? "bg-forest text-white shadow-sm"
                          : "border border-line bg-white text-muted hover:bg-[#f1f3ed]"
                      }`}
                    >
                      {mins} min
                    </button>
                  ))}
                </div>
              </div>

              {/* Audio Feedback Setting */}
              <div className="rounded-2xl border border-line bg-white p-4 flex items-center justify-between">
                <div>
                  <h4 className="text-[12px] font-semibold text-ink flex items-center gap-1.5">
                    <Volume2 size={14} className="text-forest" /> Audio Feedback
                  </h4>
                  <p className="mt-0.5 text-[11px] text-muted">Pleasant synthesized chimes on task & timer completion</p>
                </div>
                <button
                  onClick={onToggleSound}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    soundEnabled ? "bg-forest" : "bg-line"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      soundEnabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Clean Completed Tasks */}
              <div className="rounded-2xl border border-line bg-white p-4 flex items-center justify-between">
                <div>
                  <h4 className="text-[12px] font-semibold text-ink flex items-center gap-1.5">
                    <Trash2 size={14} className="text-[#a17652]" /> Clear Completed Tasks
                  </h4>
                  <p className="mt-0.5 text-[11px] text-muted">
                    {completedCount > 0
                      ? `${completedCount} completed task${completedCount > 1 ? "s" : ""} can be archived`
                      : "No completed tasks to archive"}
                  </p>
                </div>
                <button
                  onClick={onClearCompletedTasks}
                  disabled={completedCount === 0}
                  className="rounded-xl border border-line bg-white px-3 py-1.5 text-[11px] font-semibold text-[#a17652] hover:bg-[#fbefe5] disabled:opacity-40 transition"
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          {/* Tab 2: Database & Sync */}
          {activeTab === "data" && (
            <div className="space-y-4">
              {/* Account & Cloud Sync Status */}
              <div className="rounded-2xl border border-line bg-white p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#fdf2f2] text-forest">
                      <Database size={15} />
                    </span>
                    <div>
                      <h4 className="text-[12px] font-semibold text-ink">Account Database Sync</h4>
                      <p className="text-[11px] text-muted">Persist tasks & events across devices</p>
                    </div>
                  </div>
                  {userEmail ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#fdf2f2] px-2.5 py-0.5 text-[10px] font-semibold text-forest">
                      <CheckCircle2 size={11} /> Connected
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#fef3c7] px-2.5 py-0.5 text-[10px] font-semibold text-[#92400e]">
                      <AlertCircle size={11} /> Local Only
                    </span>
                  )}
                </div>

                <div className="mt-3 rounded-xl bg-[#f8f9f5] p-3 text-[11px] space-y-1.5">
                  <div className="flex items-center justify-between text-muted">
                    <span>Target Account:</span>
                    <span className="font-semibold text-ink truncate max-w-[200px]">
                      {userEmail || "Not signed in"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-muted">
                    <span>Database Engine:</span>
                    <span className="font-semibold text-ink">{dbSource}</span>
                  </div>
                  {lastSyncedAt && (
                    <div className="flex items-center justify-between text-muted">
                      <span>Last Synced:</span>
                      <span className="text-ink">
                        {new Date(lastSyncedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                      </span>
                    </div>
                  )}
                </div>

                {userEmail ? (
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      onClick={handleManualSync}
                      disabled={isSyncing}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-forest px-3.5 py-2 text-[11px] font-semibold text-white shadow-sm hover:bg-[#8b1116] disabled:opacity-50 transition"
                    >
                      <RefreshCw size={12} className={isSyncing ? "animate-spin" : ""} />
                      {isSyncing ? "Syncing..." : syncSuccessToast ? "Synced!" : "Sync with Database Now"}
                    </button>
                    <span className="text-[10px] text-muted">
                      Automatic background sync active
                    </span>
                  </div>
                ) : (
                  <p className="mt-2 text-[10px] text-[#808a81]">
                    Sign in with your Google account to automatically sync your routines across any laptop, desktop, or mobile browser.
                  </p>
                )}
              </div>

              <OutlookConnectionCard
                googleConnected={Boolean(userEmail)}
                onConnectionChange={onOutlookChange}
              />

              <LinkedInConnectionCard googleConnected={Boolean(userEmail)} />

              {/* Manual Backup Download */}
              <div className="rounded-2xl border border-line bg-white p-4">
                <h4 className="text-[12px] font-semibold text-ink flex items-center gap-1.5">
                  <Download size={14} className="text-forest" /> Download JSON Backup
                </h4>
                <p className="mt-1 text-[11px] text-muted leading-relaxed">
                  Export a portable snapshot of your priorities, scheduled custom events, and quick links.
                </p>
                <button
                  onClick={handleExportData}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-line bg-white px-3.5 py-2 text-[11px] font-semibold text-ink hover:bg-[#f1f3ed] transition"
                >
                  <Download size={13} />
                  {copiedStatus ? "Backup Downloaded!" : "Export Workspace (JSON)"}
                </button>
              </div>

              {/* Manual Backup Restore */}
              <div className="rounded-2xl border border-line bg-white p-4">
                <h4 className="text-[12px] font-semibold text-ink flex items-center gap-1.5">
                  <Upload size={14} className="text-[#6088d1]" /> Restore Workspace
                </h4>
                <p className="mt-1 text-[11px] text-muted leading-relaxed">
                  Upload a previously exported Routino JSON file to restore your tasks and setup.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-line bg-white px-3.5 py-2 text-[11px] font-semibold text-ink hover:bg-[#f1f3ed] transition"
                >
                  <Upload size={13} /> Select Backup File
                </button>
              </div>
            </div>
          )}

          {/* Tab 3: Shortcuts */}
          {activeTab === "shortcuts" && (
            <div className="space-y-3 text-[12px] text-ink leading-relaxed">
              <div className="rounded-2xl border border-line bg-white p-4">
                <h4 className="text-[12px] font-semibold text-ink flex items-center gap-1.5 mb-1">
                  <Keyboard size={14} className="text-forest" /> Quick Keyboard Cheatsheet
                </h4>
                <p className="text-[11px] text-muted">
                  Use these shortcuts anywhere across Routino to fly through your day without touching your mouse:
                </p>
                <div className="mt-3 divide-y divide-[#f1f3ed]">
                  {[
                    { key: "1 / 2 / 3 / 4", desc: "Switch views (Overview, Calendar, Inbox, Tasks)" },
                    { key: "F", desc: "Launch Deep Work Focus Timer" },
                    { key: "T", desc: "Add New Priority Task" },
                    { key: "E", desc: "Schedule Calendar Event" },
                    { key: "⌘ K / Ctrl K", desc: "Open Command Palette / Search" },
                    { key: "?", desc: "Open Floating Shortcuts Sheet" },
                    { key: "Esc", desc: "Close any open modal or popover" },
                  ].map((s) => (
                    <div key={s.key} className="flex items-center justify-between py-2 text-[11px]">
                      <span className="text-ink font-medium">{s.desc}</span>
                      <kbd className="rounded-md border border-[#d6ddd4] bg-[#f7f8f4] px-2 py-0.5 font-mono font-bold text-ink">
                        {s.key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: About */}
          {activeTab === "about" && (
            <div className="space-y-3 text-[12px] text-ink leading-relaxed">
              <div className="rounded-2xl border border-line bg-white p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[14px]">{appConfig.name}</span>
                  <span className="rounded-full bg-[#fdf2f2] px-2 py-0.5 text-[10px] font-bold text-forest">
                    v1.0.0
                  </span>
                </div>
                <p className="text-[11px] text-muted">{appConfig.tagline}</p>
                <div className="border-t border-line pt-2 text-[11px] text-[#5c6960] flex items-center justify-between">
                  <span>Architecture</span>
                  <span className="font-semibold text-ink">Next.js · Tailwind · Auth.js · Cloud DB</span>
                </div>
              </div>

              <div className="rounded-2xl border border-line bg-[#fafbf8] p-4 flex items-start gap-3">
                <ShieldCheck size={18} className="text-forest mt-0.5 shrink-0" />
                <div>
                  <h5 className="font-semibold text-[11px] text-ink">Private & Secure</h5>
                  <p className="mt-0.5 text-[10px] text-muted leading-relaxed">
                    Your routines and tasks are tied directly to your authenticated Google account session.
                    OAuth refresh tokens are securely encrypted in server-side HTTP-only cookies and never exposed.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <a
                  href="https://github.com/Itssanthoshhere/Routino-Daily-Dashboard"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-forest hover:underline"
                >
                  GitHub Repository <ExternalLink size={12} />
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-5 flex items-center justify-end border-t border-line pt-4 shrink-0">
          <button
            onClick={onClose}
            className="rounded-xl bg-forest px-4 py-2 text-[11px] font-semibold text-white shadow-sm hover:bg-[#8b1116] transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
