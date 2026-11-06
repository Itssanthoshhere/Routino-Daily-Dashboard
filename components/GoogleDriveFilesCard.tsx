"use client";

import { useEffect, useMemo, useState } from "react";
import { ExternalLink, FileText, FolderOpen, LoaderCircle, Plus, FileSpreadsheet, Presentation } from "lucide-react";
import { connectGoogle } from "@/app/actions";
import type { DriveFile } from "@/types/dashboard";

type DriveResponse = {
  files?: DriveFile[];
  needsConsent?: boolean;
  error?: string;
};

type FileTypeFilter = "all" | "docs" | "sheets" | "slides" | "pdfs";

function getDriveFileType(mimeType: string) {
  const googleTypes: Record<string, string> = {
    "application/vnd.google-apps.document": "Google Doc",
    "application/vnd.google-apps.spreadsheet": "Google Sheet",
    "application/vnd.google-apps.presentation": "Google Slides",
    "application/vnd.google-apps.folder": "Folder",
    "application/pdf": "PDF",
  };
  return googleTypes[mimeType] ?? mimeType.split("/").pop()?.replaceAll("-", " ") ?? "Drive file";
}

function formatDriveTimestamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function GoogleDriveFilesCard({ googleConnected }: { googleConnected: boolean }) {
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [activeFilter, setActiveFilter] = useState<FileTypeFilter>("all");

  useEffect(() => {
    if (!googleConnected) {
      setFiles([]);
      setMessage("Connect Google to see recent Drive files.");
      return;
    }

    let cancelled = false;
    setLoading(true);
    setMessage("");
    fetch("/api/drive/files", { cache: "no-store" })
      .then(async (response) => {
        const result = (await response.json()) as DriveResponse;
        if (cancelled) return;
        if (response.ok) {
          setFiles(result.files ?? []);
          setMessage(result.files?.length ? "" : "No recent Drive files found.");
        } else if (result.needsConsent) {
          setMessage("Drive access is unavailable. Enable the Google Drive API and approve read-only file metadata access, then reconnect Google.");
        } else {
          setMessage(result.error ?? "Drive metadata is unavailable right now.");
        }
      })
      .catch(() => {
        if (!cancelled) setMessage("Could not load Drive metadata. Try again shortly.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [googleConnected]);

  const filteredFiles = useMemo(() => {
    if (activeFilter === "all") return files;
    return files.filter((f) => {
      if (activeFilter === "docs") return f.mimeType.includes("document");
      if (activeFilter === "sheets") return f.mimeType.includes("spreadsheet");
      if (activeFilter === "slides") return f.mimeType.includes("presentation");
      if (activeFilter === "pdfs") return f.mimeType.includes("pdf");
      return true;
    });
  }, [files, activeFilter]);

  return (
    <section className="rounded-2xl border border-line bg-white p-5 shadow-card sm:p-6">
      <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#edf3ff] text-[#6088d1]">
            <FolderOpen size={15} />
          </span>
          <div>
            <h3 className="text-[12px] font-semibold text-ink">Recent Drive files</h3>
            <p className="text-[10px] text-muted">Names and file details only</p>
          </div>
        </div>

        {/* Instant Google Creation Actions */}
        <div className="flex items-center gap-1.5">
          <a
            href="https://docs.new"
            target="_blank"
            rel="noreferrer"
            title="Create new Google Doc"
            className="inline-flex items-center gap-1 rounded-lg border border-[#e1e9f8] bg-[#f5f8fd] px-2 py-1 text-[10px] font-medium text-[#2563eb] hover:bg-[#e9f0fc] transition shadow-2xs"
          >
            <Plus size={11} />
            <span>Doc</span>
          </a>
          <a
            href="https://sheets.new"
            target="_blank"
            rel="noreferrer"
            title="Create new Google Sheet"
            className="inline-flex items-center gap-1 rounded-lg border border-[#dcfce7] bg-[#f0fdf4] px-2 py-1 text-[10px] font-medium text-[#16a34a] hover:bg-[#dcfce7] transition shadow-2xs"
          >
            <Plus size={11} />
            <span>Sheet</span>
          </a>
          <a
            href="https://slides.new"
            target="_blank"
            rel="noreferrer"
            title="Create new Google Slides"
            className="inline-flex items-center gap-1 rounded-lg border border-[#fef3c7] bg-[#fffbeb] px-2 py-1 text-[10px] font-medium text-[#d97706] hover:bg-[#fef3c7] transition shadow-2xs"
          >
            <Plus size={11} />
            <span>Slide</span>
          </a>
          {loading && <LoaderCircle size={14} className="ml-1 animate-spin text-muted" aria-label="Loading Drive files" />}
        </div>
      </div>

      {/* Filter Pills */}
      {files.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1 border-b border-black/[0.04] pb-2.5">
          {(
            [
              { id: "all", label: "All" },
              { id: "docs", label: "Docs" },
              { id: "sheets", label: "Sheets" },
              { id: "slides", label: "Slides" },
              { id: "pdfs", label: "PDFs" },
            ] as const
          ).map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setActiveFilter(filter.id)}
              className={`rounded-lg px-2.5 py-1 text-[10px] font-medium transition cursor-pointer ${
                activeFilter === filter.id
                  ? "bg-forest text-white shadow-2xs"
                  : "bg-[#f4f6f1] text-[#6b776e] hover:bg-[#eaece5] hover:text-ink"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      )}

      {files.length > 0 ? (
        filteredFiles.length > 0 ? (
          <div className="space-y-2">
            {filteredFiles.map((file) => (
              <a
                key={file.id}
                href={file.webViewLink ?? "https://drive.google.com/drive/my-drive"}
                target="_blank"
                rel="noreferrer"
                className="flex min-w-0 items-center gap-2.5 rounded-xl border border-[#edf0e9] p-2.5 transition hover:border-forest/20 hover:bg-[#fafbf8]"
              >
                <FileText size={14} className="shrink-0 text-[#6088d1]" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[10px] font-semibold text-ink">{file.name}</span>
                  <span className="mt-0.5 block text-[9px] text-muted">
                    <span>{getDriveFileType(file.mimeType)}</span>
                    {file.modifiedTime && formatDriveTimestamp(file.modifiedTime) && (
                      <time className="ml-1.5" dateTime={file.modifiedTime} title={new Date(file.modifiedTime).toISOString()}>
                        · Modified {formatDriveTimestamp(file.modifiedTime)}
                      </time>
                    )}
                  </span>
                </span>
                <ExternalLink size={11} className="shrink-0 text-[#a6afa6]" />
              </a>
            ))}
          </div>
        ) : (
          <p className="rounded-xl bg-[#fafbf8] px-3 py-3 text-[10px] text-muted">
            No files match the &quot;{activeFilter}&quot; filter.
          </p>
        )
      ) : (
        <p className="rounded-xl bg-[#fafbf8] px-3 py-3 text-[10px] leading-relaxed text-muted">
          {message || "Recent files will appear here after Google Drive access is approved."}
        </p>
      )}

      {googleConnected && message.includes("reconnect Google") && (
        <form action={connectGoogle} className="mt-3">
          <button className="rounded-lg bg-forest px-3 py-2 text-[10px] font-semibold text-white hover:bg-[#8b1116] cursor-pointer">
            Reconnect Google
          </button>
        </form>
      )}

      <p className="mt-3 text-[9px] leading-relaxed text-muted">
        Routino reads file names, types, dates, and Drive links. It does not read or download file contents.
      </p>
    </section>
  );
}
