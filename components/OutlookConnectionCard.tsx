"use client";

import { useEffect, useState } from "react";
import { ExternalLink, LoaderCircle, ShieldCheck, Unlink, Mail } from "lucide-react";

type OutlookProfile = {
  name?: string;
  email: string;
  connectedAt?: string;
};

type StatusResponse = {
  authenticated: boolean;
  configured: boolean;
  connected: boolean;
  profile: OutlookProfile | null;
};

export function OutlookConnectionCard({
  googleConnected,
  onConnectionChange,
}: {
  googleConnected: boolean;
  onConnectionChange?: () => void;
}) {
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [configured, setConfigured] = useState(false);
  const [connected, setConnected] = useState(false);
  const [profile, setProfile] = useState<OutlookProfile | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    try {
      const response = await fetch("/api/outlook/status", { cache: "no-store" });
      if (!response.ok) {
        if (response.status === 401) {
          setStatus("ready");
          setConfigured(false);
          setConnected(false);
          return;
        }
        throw new Error("Unable to load Outlook connection status");
      }
      const data = (await response.json()) as StatusResponse;
      setConfigured(Boolean(data.configured));
      setConnected(Boolean(data.connected));
      setProfile(data.profile ?? null);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  };

  useEffect(() => {
    void refresh();
  }, [googleConnected]);

  const disconnect = async () => {
    setBusy(true);
    try {
      const response = await fetch("/api/outlook/status", { method: "DELETE" });
      if (!response.ok) throw new Error("Could not disconnect Outlook");
      setConnected(false);
      setProfile(null);
      onConnectionChange?.();
    } catch {
      setStatus("error");
    } finally {
      setBusy(false);
    }
  };

  const callbackUri =
    typeof window === "undefined"
      ? "https://routino-daily-dashboard.vercel.app/api/outlook/callback"
      : `${window.location.origin}/api/outlook/callback`;

  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#ebf3fc] text-[#0078d4]">
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M19.5 3h-15A1.5 1.5 0 003 4.5v15A1.5 1.5 0 004.5 21h15a1.5 1.5 0 001.5-1.5v-15A1.5 1.5 0 0019.5 3zm-9.75 13.5H7.5V7.5h2.25v9zm6.75 0h-2.25V11.25c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v5.25H9.75V7.5H12v1.2a3 3 0 013-1.2c1.66 0 3 1.34 3 3v5.5z" />
            </svg>
          </span>
          <div>
            <h4 className="text-[12px] font-semibold text-ink">Microsoft Outlook</h4>
            <p className="text-[11px] text-muted">Outlook Calendar & Mail integration</p>
          </div>
        </div>
        {connected && (
          <span className="rounded-full bg-[#ebf3fc] px-2.5 py-0.5 text-[10px] font-semibold text-[#0078d4]">
            Connected
          </span>
        )}
      </div>

      {connected && profile ? (
        <div className="mt-3 flex items-center gap-3 rounded-xl bg-[#f8f9f5] p-3">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-[#0078d4] text-sm font-semibold text-white">
            {(profile.name || profile.email).slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-semibold text-ink">
              {profile.name || "Outlook Account"}
            </p>
            <p className="truncate text-[10px] text-muted">{profile.email}</p>
          </div>
          <button
            onClick={disconnect}
            disabled={busy}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-[10px] font-medium text-muted hover:bg-[#f1f3ed] disabled:opacity-50"
          >
            {busy ? <LoaderCircle size={12} className="animate-spin" /> : <Unlink size={12} />}
            Disconnect
          </button>
        </div>
      ) : (
        <div className="mt-3">
          {!googleConnected ? (
            <p className="text-[10px] text-muted">
              Sign in to Routino first so your Outlook integration is linked to your workspace.
            </p>
          ) : status === "loading" ? (
            <p className="flex items-center gap-2 text-[10px] text-muted">
              <LoaderCircle size={12} className="animate-spin" /> Checking Outlook connection…
            </p>
          ) : status === "error" ? (
            <p className="text-[10px] text-[#a44738]">
              Couldn’t load Outlook status. Refresh and try again.
            </p>
          ) : configured ? (
            <a
              href="/api/outlook/connect"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#0078d4] px-3 py-2 text-[11px] font-semibold text-white hover:bg-[#0062ad]"
            >
              <ShieldCheck size={13} /> Connect Outlook <ExternalLink size={11} />
            </a>
          ) : (
            <div className="rounded-xl bg-[#f8f9f5] p-3 text-[10px] leading-relaxed text-muted">
              <p className="font-semibold text-ink">Microsoft Azure credentials needed.</p>
              <p className="mt-1">
                Register an app in the Azure Portal (Microsoft Entra ID), add redirect URI:
              </p>
              <code className="mt-1 block break-all rounded bg-white p-2 text-[9px] text-ink">
                {callbackUri}
              </code>
              <p className="mt-1">
                Set <code>AZURE_AD_CLIENT_ID</code> and <code>AZURE_AD_CLIENT_SECRET</code> in your <code>.env.local</code> / Vercel project settings.
              </p>
            </div>
          )}
        </div>
      )}

      <p className="mt-3 text-[10px] leading-relaxed text-muted">
        Syncs upcoming meetings to your Daily Schedule and unread messages to your Inbox. Data stays private to your workspace.
      </p>
    </div>
  );
}
