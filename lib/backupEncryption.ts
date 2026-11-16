import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { gzipSync, gunzipSync } from "node:zlib";
export const MAX_BACKUP_BYTES = 2 * 1024 * 1024;
function key(value: string): Buffer {
  const result = Buffer.from(value, "base64");
  if (result.length !== 32 || result.toString("base64") !== value) throw new Error("Backup encryption key must be 32 random bytes encoded as base64.");
  return result;
}
export function encryptBackup(email: string, data: unknown, secret: string): string {
  const serialized = JSON.stringify({ version: "1.0.0", email: email.toLowerCase().trim(), data, createdAt: new Date().toISOString() });
  if (Buffer.byteLength(serialized) > MAX_BACKUP_BYTES) throw new Error("Workspace exceeds the 2 MB external-backup limit. Database backups remain available.");
  const iv = randomBytes(12); const cipher = createCipheriv("aes-256-gcm", key(secret), iv);
  cipher.setAAD(Buffer.from(email.toLowerCase().trim()));
  const ciphertext = Buffer.concat([cipher.update(gzipSync(serialized)), cipher.final()]);
  const envelope = JSON.stringify({ version: 1, algorithm: "AES-256-GCM", compression: "gzip", iv: iv.toString("base64"), tag: cipher.getAuthTag().toString("base64"), ciphertext: ciphertext.toString("base64") });
  if (Buffer.byteLength(envelope) > MAX_BACKUP_BYTES) throw new Error("Encrypted backup exceeds the 2 MB external-backup limit.");
  return envelope;
}
export function decryptBackup(email: string, encrypted: string, secret: string): { version: string; email: string; data: Record<string, unknown>; createdAt: string } {
  if (Buffer.byteLength(encrypted) > MAX_BACKUP_BYTES) throw new Error("Backup exceeds the size limit.");
  const value = JSON.parse(encrypted);
  if (value.version !== 1 || value.algorithm !== "AES-256-GCM" || value.compression !== "gzip" || typeof value.iv !== "string" || typeof value.tag !== "string" || typeof value.ciphertext !== "string") throw new Error("Invalid backup format.");
  const iv = Buffer.from(value.iv, "base64"), tag = Buffer.from(value.tag, "base64");
  if (iv.length !== 12 || tag.length !== 16) throw new Error("Invalid backup encryption metadata.");
  const decipher = createDecipheriv("aes-256-gcm", key(secret), iv); decipher.setAAD(Buffer.from(email.toLowerCase().trim())); decipher.setAuthTag(tag);
  const data = JSON.parse(gunzipSync(Buffer.concat([decipher.update(Buffer.from(value.ciphertext, "base64")), decipher.final()]), { maxOutputLength: MAX_BACKUP_BYTES }).toString("utf8"));
  if (data.email !== email.toLowerCase().trim() || data.version !== "1.0.0" || !data.data || typeof data.data !== "object") throw new Error("Backup account or format mismatch.");
  return data;
}
