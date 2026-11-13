"use client";

import { useState } from "react";
import { Link2, X, Plus } from "lucide-react";
import { QuickLink } from "@/types/dashboard";

type QuickLinkModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onAddLink: (link: QuickLink) => void;
};

export function QuickLinkModal({ isOpen, onClose, onAddLink }: QuickLinkModalProps) {
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [url, setUrl] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) return;

    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
      formattedUrl = "https://" + formattedUrl;
    }

    const lower = formattedUrl.toLowerCase();
    const detectedIcon = lower.includes("github.com")
      ? "github"
      : lower.includes("drive.google.com") || lower.includes("docs.google.com")
      ? "drive"
      : lower.includes("outlook") || lower.includes("microsoft") || lower.includes("live.com") || lower.includes("office.com")
      ? "outlook"
      : lower.includes("portfolio") || lower.includes("vercel.app")
      ? "globe"
      : "link";

    onAddLink({
      id: "link-" + Date.now(),
      title: title.trim(),
      subtitle: subtitle.trim() || "Custom link",
      url: formattedUrl,
      iconName: detectedIcon,
      available: true,
    });

    setTitle("");
    setSubtitle("");
    setUrl("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md rounded-2xl border border-line bg-[#fbfcf8] p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-line pb-4">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#fdf2f2] text-forest">
              <Link2 size={16} />
            </span>
            <div>
              <h3 className="text-[15px] font-semibold text-ink">Add Quick Link</h3>
              <p className="text-[11px] text-muted">Save your most frequent daily destinations</p>
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

        {/* Quick Presets */}
        <div className="mt-4">
          <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted mb-1.5">
            Quick Presets
          </label>
          <div className="flex flex-wrap gap-1.5">
            {[
              { label: "Google Drive", sub: "Cloud files & storage", url: "https://drive.google.com/drive/my-drive" },
              { label: "Google Docs", sub: "Documents & drafts", url: "https://docs.google.com" },
              { label: "Google Sheets", sub: "Spreadsheets & data", url: "https://sheets.google.com" },
              { label: "GitHub", sub: "Repositories & code", url: "https://github.com" },
              { label: "Notion", sub: "Workspace & docs", url: "https://notion.so" },
            ].map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  setTitle(preset.label);
                  setSubtitle(preset.sub);
                  setUrl(preset.url);
                }}
                className="rounded-lg border border-line bg-white px-2.5 py-1 text-[11px] font-medium text-ink hover:border-forest/40 hover:bg-[#fbfcf8] transition cursor-pointer"
              >
                + {preset.label}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-ink">Title</label>
            <input
              type="text"
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Notion Workspace or GitHub"
              className="mt-1.5 w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-[13px] text-ink outline-none focus:border-forest transition"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-ink">Subtitle / Description</label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="e.g. Project roadmaps & sprint docs"
              className="mt-1.5 w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-[13px] text-ink outline-none focus:border-forest transition"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-ink">URL</label>
            <input
              type="text"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              className="mt-1.5 w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-[13px] text-ink outline-none focus:border-forest transition"
            />
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
              Add Link
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
