"use client";

import { X, ShieldAlert, ExternalLink, Key, Check } from "lucide-react";
import { useState } from "react";

type GoogleSetupModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function GoogleSetupModal({ isOpen, onClose }: GoogleSetupModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const redirectUri = "http://localhost:3000/api/auth/callback/google";

  const handleCopyUri = () => {
    navigator.clipboard.writeText(redirectUri);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg rounded-2xl border border-line bg-[#fbfcf8] p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-line pb-4">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#fff2ea] text-[#d16b5b]">
              <ShieldAlert size={16} />
            </span>
            <div>
              <h3 className="text-[15px] font-semibold text-ink">Google OAuth Setup Needed</h3>
              <p className="text-[11px] text-muted">To sync real Calendar & Gmail data in local dev</p>
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

        <div className="mt-4 space-y-4 text-[12px] text-ink leading-relaxed">
          <p className="text-muted">
            You are seeing this because <code className="bg-[#f1f3ed] px-1 py-0.5 rounded text-ink font-semibold">GOOGLE_CLIENT_ID</code> and <code className="bg-[#f1f3ed] px-1 py-0.5 rounded text-ink font-semibold">GOOGLE_CLIENT_SECRET</code> are currently empty in your <code className="bg-[#f1f3ed] px-1 py-0.5 rounded text-ink font-semibold">.env.local</code> file.
          </p>

          <div className="rounded-xl border border-line bg-white p-4 space-y-3">
            <h4 className="font-semibold text-[13px] text-forest flex items-center gap-1.5">
              <Key size={14} /> Quick 3-Step Setup:
            </h4>
            <ol className="list-decimal list-inside space-y-2 text-[11px] text-[#4d5b52]">
              <li>
                Open the{" "}
                <a
                  href="https://console.cloud.google.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-forest underline inline-flex items-center gap-0.5"
                >
                  Google Cloud Console <ExternalLink size={11} />
                </a>{" "}
                and enable <strong>Calendar API</strong> & <strong>Gmail API</strong>.
              </li>
              <li>
                Under <strong>APIs & Services &gt; Credentials</strong>, create an <strong>OAuth 2.0 Client ID</strong> (Web Application).
              </li>
              <li>
                Add this exact <strong>Authorized redirect URI</strong>:
                <div className="mt-1.5 flex items-center gap-2 rounded-lg bg-[#f4f7ef] p-2 font-mono text-[11px] text-forest">
                  <span className="truncate flex-1">{redirectUri}</span>
                  <button
                    onClick={handleCopyUri}
                    className="shrink-0 rounded bg-white px-2 py-1 text-[10px] font-bold text-forest shadow-sm border border-line hover:bg-[#fdf2f2]"
                  >
                    {copied ? <Check size={12} className="inline text-forest" /> : "Copy"}
                  </button>
                </div>
              </li>
            </ol>
          </div>

          <div className="rounded-xl bg-[#faf6ed] p-3 text-[11px] text-[#90744a]">
            Paste the resulting <strong>Client ID</strong> and <strong>Client Secret</strong> into <code className="bg-white/70 px-1 py-0.5 rounded font-mono">.env.local</code> and restart your development server.
          </div>
        </div>

        <div className="mt-5 flex items-center justify-end border-t border-line pt-4">
          <button
            onClick={onClose}
            className="rounded-xl bg-forest px-4 py-2 text-[12px] font-semibold text-white shadow hover:bg-[#8b1116] transition"
          >
            Got it, use Preview Mode for now
          </button>
        </div>
      </div>
    </div>
  );
}
