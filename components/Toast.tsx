"use client";

import { CheckCircle2, Info, X } from "lucide-react";
import React from "react";

export type ToastMessage = {
  id: string;
  message: string;
  type?: "success" | "info";
};

export function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
      {toasts.map((toast, index) => (
        <div
          key={`${toast.id}-${index}`}
          className="pointer-events-auto flex items-center gap-3 rounded-xl border border-line bg-white/95 px-4 py-3 shadow-lg backdrop-blur transition-all animate-in fade-in slide-in-from-bottom-2"
        >
          {toast.type === "info" ? (
            <Info size={16} className="text-muted shrink-0" />
          ) : (
            <CheckCircle2 size={16} className="text-forest shrink-0" />
          )}
          <span className="text-[12px] font-medium text-ink">{toast.message}</span>
          <button
            onClick={() => onDismiss(toast.id)}
            className="ml-auto text-muted hover:text-ink transition p-0.5"
            aria-label="Dismiss notification"
          >
            <X size={13} />
          </button>
        </div>
      ))}
    </div>
  );
}
