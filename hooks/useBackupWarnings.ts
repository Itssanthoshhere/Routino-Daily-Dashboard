"use client";
import { useEffect, useState } from 'react';
import { backupWarnings, type BackupHealth } from '@/lib/backupWarnings';
export function useBackupWarnings(email?: string | null) {
  const [health, setHealth] = useState<BackupHealth | null>(null); const [unavailable, setUnavailable] = useState(false); const [now, setNow] = useState(Date.now());
  useEffect(() => {
    setHealth(null); setUnavailable(false); if (!email) return;
    const key = `routino_backup_health:${email.trim().toLowerCase()}`; let active = true, busy = false, nextCheck = 0;
    try { const cached = JSON.parse(localStorage.getItem(key) || 'null'); if (cached?.snapshots && cached?.external && typeof cached.checkedAt === 'string') { setHealth(cached); nextCheck = Date.parse(cached.checkedAt) + 6 * 3600000; } } catch {}
    const check = async () => {
      setNow(Date.now()); if (busy || Date.now() < nextCheck || !navigator.onLine) return;
      busy = true;
      try { const response = await fetch('/api/sync-health', { cache: 'no-store' }); const data = await response.json(); if (!response.ok) throw new Error(); if (!active) return; setHealth(data); setUnavailable(false); nextCheck = Date.now() + 6 * 3600000; try { localStorage.setItem(key, JSON.stringify(data)); } catch {} }
      catch { if (active) { setUnavailable(true); nextCheck = Date.now() + 15 * 60000; } }
      finally { busy = false; }
    };
    void check(); const timer = setInterval(() => { if (document.visibilityState === 'visible') void check(); }, 60000);
    const visible = () => { if (document.visibilityState === 'visible') void check(); };
    const fresh = (event: Event) => { const data = (event as CustomEvent<BackupHealth>).detail; if (data?.snapshots && data?.external && data.checkedAt) { setHealth(data); setUnavailable(false); nextCheck = Date.now() + 6 * 3600000; try { localStorage.setItem(key, JSON.stringify(data)); } catch {} } };
    window.addEventListener('routino:backup-health', fresh);
    window.addEventListener('focus', visible); window.addEventListener('online', visible);
    return () => { active = false; clearInterval(timer); window.removeEventListener('routino:backup-health', fresh); window.removeEventListener('focus', visible); window.removeEventListener('online', visible); };
  }, [email]);
  return [...backupWarnings(health, now), ...(unavailable ? [{ id: 'backup:health-unavailable', title: 'Backup health check failed', detail: 'Open Database & Sync to check backup status.' }] : [])];
}
