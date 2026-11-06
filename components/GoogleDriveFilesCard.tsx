"use client";

import { useEffect, useState } from "react";
import { ExternalLink, FileText, FolderOpen, LoaderCircle } from "lucide-react";
import { connectGoogle } from "@/app/actions";

type DriveFile = {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  webViewLink?: string;
};

type DriveResponse = {
  files?: DriveFile[];
  needsConsent?: boolean;
  error?: string;
};

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

export function GoogleDriveFilesCard({ googleConnected }: { googleConnected: boolean }) {
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

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

  return (
    <section className="rounded-2xl border border-line bg-white p-5 shadow-card sm:p-6">
      <div className="mb-3 flex items-center gap-2.5">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#edf3ff] text-[#6088d1]">
          <FolderOpen size={15} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-[12px] font-semibold text-ink">Recent Drive files</h3>
          <p className="text-[10px] text-muted">Names and file details only</p>
        </div>
        {loading && <LoaderCircle size={14} className="animate-spin text-muted" aria-label="Loading Drive files" />}
      </div>

      {files.length > 0 ? (
        <div className="space-y-2">
          {files.map((file) => (
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
                <span className="mt-0.5 block truncate text-[9px] text-muted">
                  {getDriveFileType(file.mimeType)}{file.modifiedTime ? ` · ${new Date(file.modifiedTime).toLocaleDateString()}` : ""}
                </span>
              </span>
              <ExternalLink size={11} className="shrink-0 text-[#a6afa6]" />
            </a>
          ))}
        </div>
      ) : (
        <p className="rounded-xl bg-[#fafbf8] px-3 py-3 text-[10px] leading-relaxed text-muted">
          {message || "Recent files will appear here after Google Drive access is approved."}
        </p>
      )}

      {googleConnected && message.includes("reconnect Google") && (
        <form action={connectGoogle} className="mt-3">
          <button className="rounded-lg bg-forest px-3 py-2 text-[10px] font-semibold text-white hover:bg-[#8b1116]">
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
