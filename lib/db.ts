import fs from "fs/promises";
import path from "path";
import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import { Task, DashboardEvent, QuickLink, Habit, KeepNote } from "@/types/dashboard";

import type { Subscription } from "@/types/subscriptions";

export type UserWorkspaceData = {
  subscriptions?: Subscription[];
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

export async function getOutlookAccount(email: string): Promise<OutlookAccountRecord | null> {
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
    } catch (err) {
      console.error("[db] Error fetching Outlook account from SQL:", err);
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
      if (res.ok) {
        const json = await res.json();
        if (json.result) {
          const record = (typeof json.result === "string" ? JSON.parse(json.result) : json.result) as OutlookAccountRecord;
          return await outlookRecordForUse(normalizedEmail, record);
        }
      }
    } catch {}
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
      if (process.env.NODE_ENV === "production") return null;
    }
  }

  const redis = getRedisConfig();

  if (redis) {
    try {
      const res = await fetch(redis.url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${redis.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(["GET", getRedisKey(normalizedEmail)]),
        cache: "no-store",
      });

      if (res.ok) {
        const json = await res.json();
        if (json.result) {
          const parsed = typeof json.result === "string" ? JSON.parse(json.result) : json.result;
          return parsed as UserWorkspaceData;
        }
      }
    } catch (err) {
      console.error("[db] Error fetching user workspace from Redis:", err);
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
  data: UserWorkspaceData
): Promise<{ success: boolean; source: string; error?: string }> {
  const normalizedEmail = email.toLowerCase().trim();
  const sql = getNeonClient();

  if (sql) {
    try {
      await sql`CREATE TABLE IF NOT EXISTS routino_workspaces (
        email TEXT PRIMARY KEY,
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`;
      await sql`INSERT INTO routino_workspaces (email, data, updated_at)
        VALUES (${normalizedEmail}, ${JSON.stringify(data)}::jsonb, NOW())
        ON CONFLICT (email) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`;
      return { success: true, source: "neon-postgres" };
    } catch (err) {
      console.error("[db] Error saving user workspace to Neon:", err);
      const message = err instanceof Error ? err.message : "Neon database error";
      return { success: false, source: "neon-postgres", error: message };
    }
  }

  const redis = getRedisConfig();

  if (redis) {
    try {
      const payloadString = JSON.stringify(data);
      const res = await fetch(redis.url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${redis.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(["SET", getRedisKey(normalizedEmail), payloadString]),
      });

      if (res.ok) {
        return {
          success: true,
          source: redis.isVercelKv ? "vercel-kv" : "upstash-redis",
        };
      }
    } catch (err) {
      console.error("[db] Error saving user workspace to Redis:", err);
    }
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
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
    return { success: true, source: "local-fs" };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Filesystem error";
    console.error("[db] Error saving to filesystem:", err);
    return { success: false, source: "none", error: message };
  }
}
