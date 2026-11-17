"use client";

import { useEffect, useRef, useState } from "react";
import type { NotificationItem, Task } from "@/types/dashboard";
import type { Subscription } from "@/types/subscriptions";
import type { AirtelData } from "@/types/airtel";
import { deliverBrowserReminder } from "@/lib/browserReminderDelivery";
import { browserReminderCandidates } from "@/lib/browserReminderCandidates";

const key = (email: string) => `routino_browser_reminders:${email}`;
const supported = () => typeof window !== "undefined" && "Notification" in window && window.isSecureContext;

export function BrowserReminderSettings({ email }: { email?: string | null }) {
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const account = useRef(email);
  const [message, setMessage] = useState("");
  useEffect(() => {
    account.current = email;
    setMessage("");
    try { setEnabled(!!email && localStorage.getItem(key(email)) === "true"); } catch { setEnabled(false); }
  }, [email]);
  const toggle = async () => {
    if (!email || busy) return;
    setBusy(true);
    try {
      if (!enabled) {
        if (!supported()) { setMessage("Browser notifications are unavailable here. Use a supported browser over HTTPS."); return; }
        const permission = await Notification.requestPermission();
        if (account.current !== email) return;
        if (permission !== "granted") { setMessage("Permission was not granted. You can change it in your browser's site settings."); return; }
      }
      localStorage.setItem(key(email), String(!enabled));
      setEnabled(!enabled);
      setMessage("");
      window.dispatchEvent(new Event("routino:reminder-settings"));
    } catch { setMessage("Could not update reminders. Check browser permissions and storage settings."); }
    finally { setBusy(false); }
  };
  return <section className="rounded-2xl border border-line bg-white p-4 text-xs">
    <h4 className="font-semibold">Browser reminders</h4>
    <p className="mt-2 text-muted">Optional task and renewal alerts on this browser. Keep Routino open; alerts do not run when the tab is closed. Titles may appear on your lock screen. This preference is device-specific.</p>
    <button type="button" disabled={!email || busy} onClick={() => void toggle()} className="btn-theme mt-3 rounded-lg border border-line px-3 py-2 disabled:opacity-50">{busy ? "Checking permission…" : enabled ? "Turn off browser reminders" : "Enable browser reminders"}</button>
    {message && <p role="status" className="mt-2 text-muted">{message}</p>}
  </section>;
}

export function BrowserReminders({ email, tasks, subscriptions, airtel, onOpenNotification }: { email?: string | null; tasks: Task[]; subscriptions: Subscription[]; airtel: AirtelData; onOpenNotification: (item: NotificationItem) => void }) {
  const sent = useRef(new Set<string>());
  const latest = useRef({ tasks, subscriptions, airtel, onOpenNotification });
  useEffect(() => { latest.current = { tasks, subscriptions, airtel, onOpenNotification }; }, [tasks, subscriptions, airtel, onOpenNotification]);
  useEffect(() => {
    if (!email || !supported()) return;
    sent.current = new Set();
    let lastDelivery = 0;
    const visibleNotifications = new Set<Notification>();
    const check = () => {
      try {
        if (Date.now() - lastDelivery < 60000) return;
        if (Notification.permission !== "granted" || localStorage.getItem(key(email)) !== "true") return;
        const today = new Intl.DateTimeFormat("en-CA").format(new Date());
        const storageKey = `${key(email)}:sent:${today}`;
        const saved: unknown = JSON.parse(localStorage.getItem(storageKey) || "[]");
        const delivered = new Set(Array.isArray(saved) ? saved.filter((id): id is string => typeof id === "string") : []);
        const { tasks, subscriptions, airtel } = latest.current;
        const items = browserReminderCandidates(tasks, subscriptions, airtel, today, Date.now());
        const item = items.find(item => !delivered.has(item.id) && !sent.current.has(`${today}:${item.id}`));
        if (!item) return;
        // Persist before delivery to avoid repeated alerts across refreshes/tabs.
        const notification = deliverBrowserReminder(item.id, delivered,
          ids => localStorage.setItem(storageKey, JSON.stringify(ids)),
          () => new Notification("Routino reminder", { body: item.title, tag: `${email}:${today}:${item.id}` }),
        );
        visibleNotifications.add(notification);
        notification.onclose = () => visibleNotifications.delete(notification);
        sent.current.add(`${today}:${item.id}`);
        lastDelivery = Date.now();
        notification.onclick = () => { window.focus(); latest.current.onOpenNotification(item); notification.close(); };
      } catch { /* Browser/OS restrictions must never interrupt workspace saves. */ }
    };
    // Wait for initial workspace hydration; deliver at most one alert each minute.
    const first = window.setTimeout(check, 10000);
    const timer = window.setInterval(check, 60000);
    window.addEventListener("routino:reminder-settings", check);
    return () => { clearTimeout(first); clearInterval(timer); window.removeEventListener("routino:reminder-settings", check); visibleNotifications.forEach(notification => notification.close()); };
  }, [email]);
  return null;
}
