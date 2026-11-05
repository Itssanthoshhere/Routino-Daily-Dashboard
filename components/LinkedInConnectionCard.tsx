"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Linkedin, LoaderCircle, ShieldCheck, Unlink } from "lucide-react";

type Profile = {
  name: string;
  email?: string;
  picture?: string;
};

type ProfileResponse = {
  configured?: boolean;
  profile?: Profile | null;
};

export function LinkedInConnectionCard({ googleConnected }: { googleConnected: boolean }) {
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [configured, setConfigured] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    try {
      const response = await fetch("/api/linkedin/profile", { cache: "no-store" });
      if (!response.ok) throw new Error("Unable to load connection status");
      const data = (await response.json()) as ProfileResponse;
      setConfigured(Boolean(data.configured));
      setProfile(data.profile ?? null);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const disconnect = async () => {
    setBusy(true);
    try {
      const response = await fetch("/api/linkedin/profile", { method: "DELETE" });
      if (!response.ok) throw new Error("Could not disconnect");
      setProfile(null);
    } catch {
      setStatus("error");
    } finally {
      setBusy(false);
    }
  };

  const callbackUri = typeof window === "undefined"
    ? "https://routino-daily-dashboard.vercel.app/api/linkedin/callback"
    : `${window.location.origin}/api/linkedin/callback`;

  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#e8f3fc] text-[#0a66c2]">
            <Linkedin size={15} />
          </span>
          <div>
            <h4 className="text-[12px] font-semibold text-ink">LinkedIn profile</h4>
            <p className="text-[11px] text-muted">Connect basic profile details</p>
          </div>
        </div>
        {profile && (
          <span className="rounded-full bg-[#e8f3fc] px-2.5 py-0.5 text-[10px] font-semibold text-[#0a66c2]">
            Connected
          </span>
        )}
      </div>

      {profile ? (
        <div className="mt-3 flex items-center gap-3 rounded-xl bg-[#f8f9f5] p-3">
          {profile.picture ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.picture} alt="" className="h-9 w-9 rounded-full object-cover" />
          ) : (
            <span className="grid h-9 w-9 place-items-center rounded-full bg-[#e8f3fc] text-sm font-semibold text-[#0a66c2]">
              {profile.name.slice(0, 1).toUpperCase()}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-semibold text-ink">{profile.name}</p>
            {profile.email && <p className="truncate text-[10px] text-muted">{profile.email}</p>}
          </div>
          <button
            onClick={disconnect}
            disabled={busy}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-[10px] font-medium text-muted hover:bg-[#f1f3ed] disabled:opacity-50"
          >
            {busy ? <LoaderCircle size={12} className="animate-spin" /> : <Unlink size={12} />}
            Remove from Routino
          </button>
        </div>
      ) : (
        <div className="mt-3">
          {!googleConnected ? (
            <p className="text-[10px] text-muted">Connect Google first so Routino can associate this profile with your private workspace.</p>
          ) : status === "loading" ? (
            <p className="flex items-center gap-2 text-[10px] text-muted"><LoaderCircle size={12} className="animate-spin" /> Checking connection…</p>
          ) : status === "error" ? (
            <p className="text-[10px] text-[#a44738]">Couldn’t load LinkedIn connection status. Refresh and try again.</p>
          ) : configured ? (
            <a
              href="/api/linkedin/connect"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#0a66c2] px-3 py-2 text-[11px] font-semibold text-white hover:bg-[#084f96]"
            >
              <ShieldCheck size={13} /> Connect LinkedIn <ExternalLink size={11} />
            </a>
          ) : (
            <div className="rounded-xl bg-[#f8f9f5] p-3 text-[10px] leading-relaxed text-muted">
              <p className="font-semibold text-ink">LinkedIn app credentials are needed first.</p>
              <p className="mt-1">Create an app in the LinkedIn Developer Portal, add “Sign In with LinkedIn using OpenID Connect”, and set this redirect URI:</p>
              <code className="mt-1 block break-all rounded bg-white p-2 text-[9px] text-ink">{callbackUri}</code>
              <p className="mt-1">Then add <code>LINKEDIN_CLIENT_ID</code>, <code>LINKEDIN_CLIENT_SECRET</code>, and <code>LINKEDIN_REDIRECT_URI</code> to local and Vercel Development/Production environments.</p>
            </div>
          )}
        </div>
      )}

      <p className="mt-3 text-[10px] leading-relaxed text-muted">
        Read-only profile connection: Routino stores your name, email, and photo with your Google workspace. It does not store LinkedIn access tokens or access messages and feed activity. Remove Routino from LinkedIn&apos;s permitted services too if you want to revoke its authorization.
      </p>
    </div>
  );
}
