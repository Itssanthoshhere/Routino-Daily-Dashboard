import { ensureRecycleBin } from "@/lib/recycleBinStore";
import type { RecycleEntry } from "@/lib/recycleBin";
import { backupWorkspace } from "@/lib/workspaceBackups";
import fs from "fs/promises";
import path from "path";
import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import { Task, DashboardEvent, QuickLink, Habit, KeepNote } from "@/types/dashboard";

import type { AirtelData } from "@/types/airtel";
import type { Subscription } from "@/types/subscriptions";
import type { AssetDocuments } from "@/types/documents";

export type UserWorkspaceData = {
  calendarColorState?: import("@/lib/calendarColorSettings").ColorState;
  assetRecords?: import("@/types/assets").AssetRecords;
  assetDocuments?: AssetDocuments;
  recycleBin?: RecycleEntry[];
  subscriptions?: Subscription[];
  airtel?: AirtelData;
  trackerRevision?: number;
  coreRevision?: number;
  taskTemplates?: import("@/lib/taskTemplates").TaskTemplate[];
  subscriptionJournalImported?: boolean;
  tasks: Task[];
  customEvents: DashboardEvent[];
  quickLinks: QuickLink[];
  focusMinutes: number;
  soundEnabled: boolean;
  habits?: Habit[];
  notes?: KeepNote[];
  activeNav?: string;
  updatedAt: string;
};

export type DatabaseStatus = {
  provider: "neon-postgres" | "vercel-kv" | "upstash-redis" | "filesystem" | "none";
  configured: boolean;
  sourceLabel: string;
};

function getNeonClient() {
  const databaseUrl = process.env.DATABASE_URL;
  return databaseUrl ? neon(databaseUrl) : null;
}

export type OutlookAccountRecord = {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  email: string;
  name: string;
  connectedAt: string;
};

const OUTLOOK_TOKEN_PREFIX = "routino:v1:";

function outlookTokenKey(): Buffer {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret || secret.startsWith("your-")) {
    throw new Error("Set AUTH_SECRET or NEXTAUTH_SECRET before storing Outlook credentials.");
  }
  return Buffer.from(
    hkdfSync("sha256", secret, "routino-outlook-token-v1", "outlook-token-at-rest", 32)
  );
}

function encryptOutlookToken(token?: string): string | undefined {
  if (!token || token.startsWith(OUTLOOK_TOKEN_PREFIX)) return token;
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", outlookTokenKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${OUTLOOK_TOKEN_PREFIX}${iv.toString("base64url")}:${tag.toString("base64url")}:${ciphertext.toString("base64url")}`;
}

function decryptOutlookToken(token?: string): string | undefined {
  if (!token || !token.startsWith(OUTLOOK_TOKEN_PREFIX)) return token;
  const [ivEncoded, tagEncoded, ciphertextEncoded] = token.slice(OUTLOOK_TOKEN_PREFIX.length).split(":");
  if (!ivEncoded || !tagEncoded || !ciphertextEncoded) {
    throw new Error("Stored Outlook credential has an invalid encrypted format.");
  }
  const decipher = createDecipheriv("aes-256-gcm", outlookTokenKey(), Buffer.from(ivEncoded, "base64url"));
  decipher.setAuthTag(Buffer.from(tagEncoded, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertextEncoded, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

function outlookRecordForStorage(record: OutlookAccountRecord): OutlookAccountRecord {
  return {
    ...record,
    accessToken: encryptOutlookToken(record.accessToken)!,
    refreshToken: encryptOutlookToken(record.refreshToken),
  };
}

async function outlookRecordForUse(
  email: string,
  storedRecord: OutlookAccountRecord
): Promise<OutlookAccountRecord> {
  const needsMigration =
    (!!storedRecord.accessToken && !storedRecord.accessToken.startsWith(OUTLOOK_TOKEN_PREFIX)) ||
    (!!storedRecord.refreshToken && !storedRecord.refreshToken.startsWith(OUTLOOK_TOKEN_PREFIX));
  const record = {
    ...storedRecord,
    accessToken: decryptOutlookToken(storedRecord.accessToken)!,
    refreshToken: decryptOutlookToken(storedRecord.refreshToken),
  };
  if (needsMigration) await saveOutlookAccount(email, record);
  return record;
}

export async function getOutlookAccount(email: string, strict = false): Promise<OutlookAccountRecord | null> {
  const normalizedEmail = email.toLowerCase().trim();
  const sql = getNeonClient();

  if (sql) {
    try {
      await sql`CREATE TABLE IF NOT EXISTS routino_linked_accounts (
        google_email TEXT NOT NULL,
        provider TEXT NOT NULL,
        profile JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (google_email, provider)
      )`;
      const rows = await sql`SELECT profile FROM routino_linked_accounts
        WHERE google_email = ${normalizedEmail} AND provider = 'outlook' LIMIT 1`;
      if (rows.length > 0 && rows[0]?.profile) {
        return await outlookRecordForUse(normalizedEmail, rows[0].profile as OutlookAccountRecord);
      }
      if (strict) return null;
    } catch (err) {
      console.error("[db] Error fetching Outlook account from SQL:", err);
      if (strict) throw new Error("Could not verify the linked Outlook calendar.");
    }
  }

  // Redis fallback
  const redis = getRedisConfig();
  if (redis) {
    try {
      const res = await fetch(redis.url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${redis.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(["GET", `routino:outlook:${normalizedEmail}`]),
        cache: "no-store",
      });
      if (!res.ok && strict) throw new Error("Linked calendar credentials are unavailable.");
      if (res.ok) {
        const json = await res.json();
        if (json.error && strict) throw new Error("Linked calendar credentials are unavailable.");
        if (json.result) {
          const record = (typeof json.result === "string" ? JSON.parse(json.result) : json.result) as OutlookAccountRecord;
          return await outlookRecordForUse(normalizedEmail, record);
        }
      }
      if (strict) return null;
    } catch { if (strict) throw new Error("Could not verify the linked Outlook calendar."); }
  }

  // Filesystem fallback
  try {
    const dataDir = path.join(process.cwd(), ".data");
    const safeEmail = encodeURIComponent(normalizedEmail);
    const content = await fs.readFile(path.join(dataDir, `outlook-${safeEmail}.json`), "utf-8");
    return await outlookRecordForUse(normalizedEmail, JSON.parse(content) as OutlookAccountRecord);
  } catch {
    return null;
  }
}

export async function saveOutlookAccount(email: string, record: OutlookAccountRecord): Promise<void> {
  const normalizedEmail = email.toLowerCase().trim();
  const encryptedRecord = outlookRecordForStorage(record);
  const sql = getNeonClient();

  if (sql) {
    try {
      await sql`CREATE TABLE IF NOT EXISTS routino_linked_accounts (
        google_email TEXT NOT NULL,
        provider TEXT NOT NULL,
        profile JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (google_email, provider)
      )`;
      await sql`INSERT INTO routino_linked_accounts (google_email, provider, profile, updated_at)
        VALUES (${normalizedEmail}, 'outlook', ${JSON.stringify(encryptedRecord)}::jsonb, NOW())
        ON CONFLICT (google_email, provider) DO UPDATE
        SET profile = EXCLUDED.profile, updated_at = NOW()`;
      return;
    } catch (err) {
      console.error("[db] Error saving Outlook account to SQL:", err);
    }
  }

  // Redis fallback
  const redis = getRedisConfig();
  if (redis) {
    try {
      await fetch(redis.url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${redis.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(["SET", `routino:outlook:${normalizedEmail}`, JSON.stringify(encryptedRecord)]),
      });
      return;
    } catch {}
  }

  // Filesystem fallback
  try {
    const dataDir = path.join(process.cwd(), ".data");
    await fs.mkdir(dataDir, { recursive: true });
    const safeEmail = encodeURIComponent(normalizedEmail);
    await fs.writeFile(path.join(dataDir, `outlook-${safeEmail}.json`), JSON.stringify(encryptedRecord, null, 2), "utf-8");
  } catch {}
}

export async function deleteOutlookAccount(email: string): Promise<void> {
  const normalizedEmail = email.toLowerCase().trim();
  const sql = getNeonClient();

  if (sql) {
    try {
      await sql`DELETE FROM routino_linked_accounts
        WHERE google_email = ${normalizedEmail} AND provider = 'outlook'`;
    } catch {}
  }

  const redis = getRedisConfig();
  if (redis) {
    try {
      await fetch(redis.url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${redis.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(["DEL", `routino:outlook:${normalizedEmail}`]),
      });
    } catch {}
  }

  try {
    const dataDir = path.join(process.cwd(), ".data");
    const safeEmail = encodeURIComponent(normalizedEmail);
    await fs.unlink(path.join(dataDir, `outlook-${safeEmail}.json`));
  } catch {}
}

function getRedisConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (url && token) {
    return {
      url: url.replace(/\/$/, ""),
      token,
      isVercelKv: !!process.env.KV_REST_API_URL,
    };
  }
  return null;
}

function getRedisKey(email: string) {
  return `routino:workspace:${email.toLowerCase().trim()}`;
}

export function getDatabaseStatus(): DatabaseStatus {
  if (process.env.DATABASE_URL) {
    return {
      provider: "neon-postgres",
      configured: true,
      sourceLabel: "Neon Postgres",
    };
  }
  const redis = getRedisConfig();
  if (redis) {
    return {
      provider: redis.isVercelKv ? "vercel-kv" : "upstash-redis",
      configured: true,
      sourceLabel: redis.isVercelKv ? "Vercel KV Database" : "Upstash Redis Cloud",
    };
  }
  return {
    provider: "filesystem",
    configured: false,
    sourceLabel: "Local Database File (.data)",
  };
}

/**
 * Fetch workspace data for a given user email.
 * Checks durable Postgres first, then Redis, then local development files.
 */
export async function getUserWorkspace(email: string): Promise<UserWorkspaceData | null> {
  const normalizedEmail = email.toLowerCase().trim();
  const sql = getNeonClient();

  if (sql) {
    try {
      await sql`CREATE TABLE IF NOT EXISTS routino_workspaces (
        email TEXT PRIMARY KEY,
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`;
      const rows = await sql`SELECT data FROM routino_workspaces WHERE email = ${normalizedEmail} LIMIT 1`;
      return (rows[0]?.data as UserWorkspaceData | undefined) ?? null;
    } catch (err) {
      console.error("[db] Error fetching user workspace from Neon:", err);
      throw new Error("Workspace database is temporarily unavailable.");
    }
  }

  const redis = getRedisConfig();

  if (redis) {
    try {
      const res = await fetch(redis.url, { method: "POST", headers: { Authorization: `Bearer ${redis.token}`, "Content-Type": "application/json" }, body: JSON.stringify(["GET", getRedisKey(normalizedEmail)]), cache: "no-store" });
      if (!res.ok) throw new Error("Workspace database is temporarily unavailable.");
      const json = await res.json();
      if (json.error) throw new Error("Workspace database is temporarily unavailable.");
      return json.result ? (typeof json.result === "string" ? JSON.parse(json.result) : json.result) as UserWorkspaceData : null;
    } catch {
      throw new Error("Workspace database is temporarily unavailable.");
    }
  }

  // Filesystem fallback (works locally during dev)
  try {
    const dataDir = path.join(process.cwd(), ".data");
    const safeEmail = encodeURIComponent(normalizedEmail);
    const filePath = path.join(dataDir, `user-${safeEmail}.json`);
    const content = await fs.readFile(filePath, "utf-8");
    return JSON.parse(content) as UserWorkspaceData;
  } catch {
    return null;
  }
}

/**
 * Persist workspace data for a given user email.
 * Saves to Redis (Upstash / Vercel KV) if available, and to filesystem as local copy.
 */
export async function saveUserWorkspace(
  email: string,
  data: UserWorkspaceData,
  changedFields?: string[],
  taskMerge?: { incoming: Task[]; replacedIds: string[]; deletedIds: string[] },
  expectedCoreRevision?: number
): Promise<{ success: boolean; source: string; error?: string; conflict?: boolean }> {
  const normalizedEmail = email.toLowerCase().trim();
  const sql = getNeonClient();

  if (sql) {
    try {
      await sql`CREATE TABLE IF NOT EXISTS routino_workspaces (
        email TEXT PRIMARY KEY,
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`;
      await ensureRecycleBin();
      await backupWorkspace(normalizedEmail);
      const patch = changedFields ? Object.fromEntries(changedFields.filter(key => key in data).map(key => [key, data[key as keyof UserWorkspaceData]])) : data;
      if (expectedCoreRevision !== undefined) {
        await sql`INSERT INTO routino_workspaces (email, data) VALUES (${normalizedEmail}, '{}'::jsonb) ON CONFLICT DO NOTHING`;
        const rows = await sql`UPDATE routino_workspaces SET data = data || ${JSON.stringify(patch)}::jsonb || jsonb_build_object('coreRevision', ${expectedCoreRevision + 1}::integer), updated_at = NOW()
          WHERE email = ${normalizedEmail} AND COALESCE((data->>'coreRevision')::integer, 0) = ${expectedCoreRevision} RETURNING email`;
        return { success: rows.length > 0, conflict: rows.length === 0, source: "neon-postgres" };
      }
      if (taskMerge) {
        const untouched = { ...patch }; delete (untouched as Partial<UserWorkspaceData>).tasks;
        const excludedIds = Array.from(new Set([...taskMerge.replacedIds, ...taskMerge.deletedIds]));
        const incoming = taskMerge.incoming.filter(task => taskMerge.replacedIds.includes(task.id) && !taskMerge.deletedIds.includes(task.id));
        await sql`INSERT INTO routino_workspaces (email, data, updated_at)
          VALUES (${normalizedEmail}, ${JSON.stringify(data)}::jsonb, NOW())
          ON CONFLICT (email) DO UPDATE SET data = routino_workspaces.data || ${JSON.stringify(untouched)}::jsonb || jsonb_build_object('tasks',
            COALESCE((SELECT jsonb_agg(item) FROM jsonb_array_elements(COALESCE(routino_workspaces.data->'tasks', '[]'::jsonb)) item WHERE NOT (item->>'id' = ANY(${excludedIds}::text[]))), '[]'::jsonb) || ${JSON.stringify(incoming)}::jsonb), updated_at = NOW()`;
      } else {
        await sql`INSERT INTO routino_workspaces (email, data, updated_at)
          VALUES (${normalizedEmail}, ${JSON.stringify(data)}::jsonb, NOW())
          ON CONFLICT (email) DO UPDATE SET data = routino_workspaces.data || ${JSON.stringify(patch)}::jsonb, updated_at = NOW()`;
      }
      return { success: true, source: "neon-postgres" };
    } catch (err) {
      console.error("[db] Error saving user workspace to Neon:", err);
      const message = err instanceof Error ? err.message : "Neon database error";
      return { success: false, source: "neon-postgres", error: message };
    }
  }

  const redis = getRedisConfig();

  if (redis) {
    const source = redis.isVercelKv ? "vercel-kv" : "upstash-redis";
    try {
      const read = await fetch(redis.url, { method: "POST", headers: { Authorization: `Bearer ${redis.token}`, "Content-Type": "application/json" }, body: JSON.stringify(["GET", getRedisKey(normalizedEmail)]), cache: "no-store" });
      const snapshot = await read.json();
      if (!read.ok || snapshot.error) return { success: false, source };
      const raw = typeof snapshot.result === "string" ? snapshot.result : snapshot.result ? JSON.stringify(snapshot.result) : "";
      const existing = raw ? JSON.parse(raw) : {};
      if (expectedCoreRevision !== undefined && (existing.coreRevision || 0) !== expectedCoreRevision) return { success: false, conflict: true, source };
      const patch = changedFields ? Object.fromEntries(changedFields.filter(key => key in data).map(key => [key, data[key as keyof UserWorkspaceData]])) : data;
      if (taskMerge) {
        const replaced = new Set(taskMerge.replacedIds), removed = new Set(taskMerge.deletedIds);
        const merged = new Map<string, Task>((existing.tasks || []).filter((task: Task) => !removed.has(task.id)).map((task: Task) => [task.id, task]));
        for (const task of taskMerge.incoming) if (replaced.has(task.id) && !removed.has(task.id)) merged.set(task.id, task);
        (patch as Partial<UserWorkspaceData>).tasks = Array.from(merged.values());
      }
      if (expectedCoreRevision !== undefined) (patch as Partial<UserWorkspaceData>).coreRevision = expectedCoreRevision + 1;
      // Compare raw strings in Lua; encode JSON in JS so empty arrays remain arrays.
      const script = `local raw = redis.call('GET', KEYS[1]); if (raw or '') ~= ARGV[1] then return 0 end; redis.call('SET', KEYS[1], ARGV[2]); return 1`;
      const res = await fetch(redis.url, { method: "POST", headers: { Authorization: `Bearer ${redis.token}`, "Content-Type": "application/json" }, body: JSON.stringify(["EVAL", script, 1, getRedisKey(normalizedEmail), raw, JSON.stringify({ ...existing, ...patch })]) });
      const result = await res.json();
      return { success: res.ok && !result.error && result.result === 1, conflict: res.ok && !result.error && result.result === 0, source };
    } catch { return { success: false, source, error: "Workspace database save failed." }; }
  }

  if (process.env.NODE_ENV === "production") {
    return { success: false, source: "none", error: "No persistent database is configured." };
  }

  // Filesystem fallback
  try {
    const dataDir = path.join(process.cwd(), ".data");
    await fs.mkdir(dataDir, { recursive: true });
    const safeEmail = encodeURIComponent(normalizedEmail);
    const filePath = path.join(dataDir, `user-${safeEmail}.json`);
    if (expectedCoreRevision !== undefined) {
      const existing = await getUserWorkspace(normalizedEmail);
      if ((existing?.coreRevision || 0) !== expectedCoreRevision) return { success: false, conflict: true, source: "local-fs" };
      data = { ...data, coreRevision: expectedCoreRevision + 1 };
    }
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
    return { success: true, source: "local-fs" };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Filesystem error";
    console.error("[db] Error saving to filesystem:", err);
    return { success: false, source: "none", error: message };
  }
}

export type TrackerPatch = Pick<UserWorkspaceData, "subscriptions" | "airtel" | "subscriptionJournalImported" | "assetDocuments" | "assetRecords">;

/** Compare-and-swap tracker fields without replacing unrelated workspace data. */
export async function saveTrackerWorkspace(email: string, patch: TrackerPatch, revision: number): Promise<{ success: boolean; conflict?: boolean; data?: UserWorkspaceData }> {
  const normalized = email.toLowerCase().trim();
  const sql = getNeonClient();
  const updatedAt = new Date().toISOString();
  const payload = { ...patch, trackerRevision: revision + 1, updatedAt };
  if (sql) {
    await sql`CREATE TABLE IF NOT EXISTS routino_workspaces (email TEXT PRIMARY KEY, data JSONB NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
    await ensureRecycleBin();
    await backupWorkspace(normalized);
    // An empty document allows the first tracker save without inventing core workspace defaults.
    await sql`INSERT INTO routino_workspaces (email, data) VALUES (${normalized}, '{}'::jsonb) ON CONFLICT DO NOTHING`;
    const rows = await sql`UPDATE routino_workspaces SET data = data || ${JSON.stringify(payload)}::jsonb, updated_at = NOW()
      WHERE email = ${normalized} AND COALESCE((data->>'trackerRevision')::integer, 0) = ${revision} RETURNING data`;
    return rows.length ? { success: true, data: rows[0].data as UserWorkspaceData } : { success: false, conflict: true };
  }
  const redis = getRedisConfig();
  if (redis) {
    const headers = { Authorization: `Bearer ${redis.token}`, "Content-Type": "application/json" };
    const response = await fetch(redis.url, { method: "POST", headers, body: JSON.stringify(["GET", getRedisKey(normalized)]), cache: "no-store" });
    const snapshot = await response.json();
    if (!response.ok || snapshot.error) throw new Error("Tracker database read failed.");
    const raw = typeof snapshot.result === "string" ? snapshot.result : snapshot.result ? JSON.stringify(snapshot.result) : "";
    const existing = raw ? JSON.parse(raw) : {};
    if ((existing.trackerRevision || 0) !== revision) return { success: false, conflict: true };
    const data = { ...existing, ...payload };
    const script = `local raw = redis.call('GET', KEYS[1]); if (raw or '') ~= ARGV[1] then return 0 end; redis.call('SET', KEYS[1], ARGV[2]); return 1`;
    const save = await fetch(redis.url, { method: "POST", headers, body: JSON.stringify(["EVAL", script, 1, getRedisKey(normalized), raw, JSON.stringify(data)]) });
    const result = await save.json();
    if (!save.ok || result.error) throw new Error("Tracker database save failed.");
    return result.result === 1 ? { success: true, data } : { success: false, conflict: true };
  }
  if (process.env.NODE_ENV === "production") return { success: false };
  const existing = await getUserWorkspace(normalized);
  if ((existing?.trackerRevision || 0) !== revision) return { success: false, conflict: true };
  const data = { ...existing, ...payload } as UserWorkspaceData;
  const result = await saveUserWorkspace(normalized, data);
  return { success: result.success, data: result.success ? data : undefined };
}

/** Isolated calendar revision prevents rule/history saves replacing core or tracker fields. */
export async function saveCalendarColorState(email: string, state: import("@/lib/calendarColorSettings").ColorState, revision: number) {
  const normalized = email.toLowerCase().trim();
  const next = { ...state, revision: revision + 1 };
  const payload = { calendarColorState: next, updatedAt: new Date().toISOString() };
  const sql = getNeonClient();
  if (sql) {
    await sql`CREATE TABLE IF NOT EXISTS routino_workspaces (email TEXT PRIMARY KEY, data JSONB NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
    await sql`INSERT INTO routino_workspaces (email, data) VALUES (${normalized}, '{}'::jsonb) ON CONFLICT DO NOTHING`;
    const rows = await sql`UPDATE routino_workspaces SET data = data || ${JSON.stringify(payload)}::jsonb, updated_at = NOW() WHERE email = ${normalized} AND COALESCE((data->'calendarColorState'->>'revision')::integer, 0) = ${revision} RETURNING email`;
    return rows.length ? next : null;
  }
  const redis = getRedisConfig();
  if (redis) {
    const headers = { Authorization: `Bearer ${redis.token}`, "Content-Type": "application/json" };
    const response = await fetch(redis.url, { method: "POST", headers, body: JSON.stringify(["GET", getRedisKey(normalized)]), cache: "no-store" });
    const snapshot = await response.json();
    if (!response.ok || snapshot.error) throw new Error("Calendar settings read failed.");
    const raw = typeof snapshot.result === "string" ? snapshot.result : snapshot.result ? JSON.stringify(snapshot.result) : "";
    const existing = raw ? JSON.parse(raw) : {};
    if ((existing.calendarColorState?.revision || 0) !== revision) return null;
    const script = "local raw = redis.call('GET', KEYS[1]); if (raw or '') ~= ARGV[1] then return 0 end; redis.call('SET', KEYS[1], ARGV[2]); return 1";
    const saved = await fetch(redis.url, { method: "POST", headers, body: JSON.stringify(["EVAL", script, 1, getRedisKey(normalized), raw, JSON.stringify({ ...existing, ...payload })]) });
    const result = await saved.json();
    if (!saved.ok || result.error) throw new Error("Calendar settings save failed.");
    return result.result === 1 ? next : null;
  }
  if (process.env.NODE_ENV === "production") throw new Error("Configure durable storage before saving calendar settings.");
  const existing = await getUserWorkspace(normalized);
  if ((existing?.calendarColorState?.revision || 0) !== revision) return null;
  const saved = await saveUserWorkspace(normalized, { ...existing, ...payload } as UserWorkspaceData, ["calendarColorState", "updatedAt"]);
  return saved.success ? next : null;
}
