"use client";
import { useEffect, useState } from "react";
type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
export function PwaSupport() {
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    if (window.location.pathname === "/auth/signout") {
      try { localStorage.removeItem("routino_verified_workspace_account"); } catch {}
    }
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) void navigator.serviceWorker.register("/sw.js").catch(() => {});
    const install = (event: Event) => { event.preventDefault(); setPrompt(event as InstallPrompt); };
    const connectivity = () => setOffline(!navigator.onLine);
    const installed = () => setPrompt(null);
    connectivity();
    window.addEventListener("beforeinstallprompt", install); window.addEventListener("appinstalled", installed); window.addEventListener("online", connectivity); window.addEventListener("offline", connectivity);
    return () => { window.removeEventListener("beforeinstallprompt", install); window.removeEventListener("appinstalled", installed); window.removeEventListener("online", connectivity); window.removeEventListener("offline", connectivity); };
  }, []);
  return <>{offline && <div role="status" className="fixed bottom-3 left-3 z-[100] max-w-xs rounded-xl border border-line bg-white p-3 text-xs shadow-lg">Offline · using this device’s saved workspace. Google services and cloud sync need a connection.</div>}{prompt && <button className="fixed bottom-3 right-3 z-40 rounded-xl bg-forest px-4 py-2 text-xs font-semibold text-white shadow-lg" onClick={async () => { await prompt.prompt(); await prompt.userChoice; setPrompt(null); }}>Install Routino</button>}</>;
}
