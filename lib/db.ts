import fs from "fs/promises";
import path from "path";
import { Task, DashboardEvent, QuickLink } from "@/types/dashboard";

export type UserWorkspaceData = {
  tasks: Task[];
  customEvents: DashboardEvent[];
  quickLinks: QuickLink[];
  focusMinutes: number;
  soundEnabled: boolean;
  activeNav?: string;
  updatedAt: string;
};

export type DatabaseStatus = {
  provider: "vercel-kv" | "upstash-redis" | "filesystem" | "none";
  configured: boolean;
  sourceLabel: string;
};

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
 * Checks Redis (Upstash / Vercel KV) first, then falls back to filesystem (.data/).
 */
export async function getUserWorkspace(email: string): Promise<UserWorkspaceData | null> {
  const normalizedEmail = email.toLowerCase().trim();
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
