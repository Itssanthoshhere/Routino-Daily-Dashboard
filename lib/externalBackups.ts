import {backupAttachments} from "@/lib/attachmentBackups";
import { createHash } from "node:crypto";
import { put, list, get, del } from "@vercel/blob";
import { encryptBackup, decryptBackup, MAX_BACKUP_BYTES } from "@/lib/backupEncryption";
export function externalBackupConfigured() {
  return !!process.env.WORKSPACE_BACKUP_KEY && !!(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);
}
function prefix(email: string) { return `workspace-backups/${createHash("sha256").update(email.trim().toLowerCase()).digest("hex")}/`; }
export async function listExternalBackups(email: string) {
  const result = await list({ prefix: prefix(email), limit: 1000, abortSignal: AbortSignal.timeout(10000) });
  return result.blobs.map(blob => ({ id: blob.pathname.slice(prefix(email).length), date: blob.uploadedAt.toISOString(), size: blob.size })).sort((a, b) => b.date.localeCompare(a.date));
}
export async function readExternalBackup(email: string, id: string) {
  if (!/^\d{4}-\d{2}-\d{2}\.json\.enc$/.test(id)) throw new Error("Invalid backup identifier.");
  const result = await get(`${prefix(email)}${id}`, { access: "private", useCache: false, abortSignal: AbortSignal.timeout(10000) });
  if (!result || result.statusCode !== 200) return null;
  if (result.blob.size > MAX_BACKUP_BYTES) throw new Error("Backup exceeds the size limit.");
  const encrypted = await new Response(result.stream).text();
  return decryptBackup(email, encrypted, process.env.WORKSPACE_BACKUP_KEY || "");
}
export async function createExternalBackup(email: string, data: unknown) {
  if (!externalBackupConfigured()) throw new Error("Encrypted external backups are not configured.");
  const attachments=await backupAttachments(email,data).catch(()=>({verified:0,created:0,complete:false,error:"Attachment copying did not complete. Existing copies are retained; retry to continue."}));
  const today = new Date().toISOString().slice(0, 10); const id = `${today}.json.enc`;
  const backups = await listExternalBackups(email);
  if (backups.some(item => item.id === id)) {
    // Verify even an existing daily copy before reporting it as healthy.
    const existing = await readExternalBackup(email, id);
    if (!existing) throw new Error("Today's external backup could not be read.");
    return { id, created: false, verified: true, attachments };
  }
  const encrypted = encryptBackup(email, data, process.env.WORKSPACE_BACKUP_KEY!);
  try { await put(`${prefix(email)}${id}`, encrypted, { access: "private", contentType: "application/octet-stream", addRandomSuffix: false, allowOverwrite: false, ttlDays: 30 }); }
  catch (error) {
    // A concurrent manual/cron request may have written this same immutable daily slot.
    if (!await readExternalBackup(email, id)) throw error;
  }
  const verified = await readExternalBackup(email, id);
  if (!verified) throw new Error("Uploaded backup could not be verified. Existing backups were retained.");
  const cutoff = Date.now() - 30 * 86400000;
  const expired = backups.filter(item => Date.parse(item.date) < cutoff).map(item => `${prefix(email)}${item.id}`);
  if (expired.length) await del(expired);
  return { id, created: true, verified: true, attachments };
}
