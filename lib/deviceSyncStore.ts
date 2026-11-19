import { neon } from "@neondatabase/serverless";
let ready: Promise<unknown> | undefined;
async function database() { if (!process.env.DATABASE_URL)
    throw new Error('Device activity requires Neon.'); const sql = neon(process.env.DATABASE_URL); if (!ready)
    ready = sql `CREATE TABLE IF NOT EXISTS routino_device_sync(email TEXT NOT NULL,device_id TEXT NOT NULL,label TEXT NOT NULL,last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),core_saved_at TIMESTAMPTZ,tracker_saved_at TIMESTAMPTZ,core_pending BOOLEAN,tracker_pending BOOLEAN,PRIMARY KEY(email,device_id))`.catch(error => { ready = undefined; throw error; }); await ready; return sql; }
export async function listDeviceSync(email: string) { const sql = await database(); return sql `SELECT device_id AS id,label,last_seen_at AS "lastSeenAt",core_saved_at AS "coreSavedAt",tracker_saved_at AS "trackerSavedAt",core_pending AS "corePending",tracker_pending AS "trackerPending" FROM routino_device_sync WHERE email=${email.trim().toLowerCase()} ORDER BY last_seen_at DESC LIMIT 50`; }
export async function reportDeviceSync(email: string, device: {
    id: string;
    label: string;
    coreSavedAt?: string;
    trackerSavedAt?: string;
    corePending: boolean | null;
    trackerPending: boolean | null;
}) { const sql = await database(); await sql `INSERT INTO routino_device_sync(email,device_id,label,core_saved_at,tracker_saved_at,core_pending,tracker_pending) VALUES(${email.trim().toLowerCase()},${device.id},${device.label},${device.coreSavedAt || null}::timestamptz,${device.trackerSavedAt || null}::timestamptz,${device.corePending},${device.trackerPending}) ON CONFLICT(email,device_id) DO UPDATE SET label=EXCLUDED.label,last_seen_at=NOW(),core_saved_at=GREATEST(EXCLUDED.core_saved_at,routino_device_sync.core_saved_at),tracker_saved_at=GREATEST(EXCLUDED.tracker_saved_at,routino_device_sync.tracker_saved_at),core_pending=EXCLUDED.core_pending,tracker_pending=EXCLUDED.tracker_pending`; }
