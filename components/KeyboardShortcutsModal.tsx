"use client";

import { useEffect } from "react";
import { X, Command, Keyboard } from "lucide-react";

type KeyboardShortcutsModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

type ShortcutItem = {
  key: string;
  description: string;
  category: "Navigation" | "Actions" | "General";
};

const SHORTCUTS: ShortcutItem[] = [
  { key: "1", description: "Switch to Overview tab", category: "Navigation" },
  { key: "2", description: "Switch to Calendar tab", category: "Navigation" },
  { key: "3", description: "Switch to Inbox tab", category: "Navigation" },
  { key: "4", description: "Switch to Tasks Manager", category: "Navigation" },
  { key: "5", description: "Switch to Notes & Scratchpad", category: "Navigation" },
  { key: "F", description: "Launch Deep Work Focus Timer", category: "Actions" },
  { key: "T", description: "Create New Priority Task", category: "Actions" },
  { key: "E", description: "Schedule Calendar Event", category: "Actions" },
  { key: "H", description: "Open Micro-Habits Manager Modal", category: "Actions" },
  { key: "⌘ K", description: "Open Command Palette / Search", category: "General" },
  { key: "?", description: "Toggle this Keyboard Shortcuts sheet", category: "General" },
  { key: "Esc", description: "Close any open modal or popover", category: "General" },
];

export function KeyboardShortcutsModal({
  isOpen,
  onClose,
}: KeyboardShortcutsModalProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const categories = ["Navigation", "Actions", "General"] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-3xl border border-line bg-[#fbfcf8] p-6 sm:p-7 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line pb-4">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-forest text-accent shadow-sm">
              <Keyboard size={17} />
            </span>
            <div>
              <h3 className="text-[16px] font-bold text-ink">Keyboard Shortcuts</h3>
              <p className="text-[11px] text-muted">Navigate and trigger actions across Routino at speed</p>
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

        {/* Shortcuts List grouped by Category */}
        <div className="mt-4 space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {categories.map((category) => {
            const items = SHORTCUTS.filter((s) => s.category === category);
            return (
              <div key={category} className="rounded-2xl border border-line bg-white p-4">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#8b968d] mb-2.5">
                  {category}
                </h4>
                <div className="space-y-2">
                  {items.map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between py-1 text-[12px]"
                    >
                      <span className="text-ink font-medium">{item.description}</span>
                      <kbd className="inline-flex min-w-[24px] items-center justify-center rounded-md border border-[#d6ddd4] bg-[#f7f8f4] px-2 py-1 text-[11px] font-mono font-bold text-ink shadow-[0_1px_0_1px_rgba(0,0,0,0.06)]">
                        {item.key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-5 flex items-center justify-between border-t border-line pt-4 text-[11px] text-muted">
          <span>Press <kbd className="font-mono font-bold text-ink bg-[#f1f3ed] px-1 py-0.5 rounded">?</kbd> anytime to open</span>
          <button
            onClick={onClose}
            className="rounded-xl bg-forest px-4 py-2 text-[11px] font-semibold text-white shadow hover:bg-[#8b1116] transition"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
