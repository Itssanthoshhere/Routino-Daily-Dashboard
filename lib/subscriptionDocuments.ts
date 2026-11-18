import { createHash, randomUUID } from "node:crypto";
export const MAX_DOCUMENT_BYTES = 3 * 1024 * 1024;
export function documentPrefix(email: string): string { return `subscription-documents/${createHash("sha256").update(email.trim().toLowerCase()).digest("hex")}/`; }
export function documentPath(email: string): string { return `${documentPrefix(email)}${randomUUID()}`; }
export function ownsDocument(email: string, path: string): boolean { return path.startsWith(documentPrefix(email)) && /^[0-9a-f-]{36}$/.test(path.slice(documentPrefix(email).length)); }
export function documentType(name: string, bytes: Uint8Array): string | null {
  if (bytes.length === 0 || bytes.length > MAX_DOCUMENT_BYTES) return null;
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext === "pdf" && Buffer.from(bytes.subarray(0, 5)).toString() === "%PDF-") return "application/pdf";
  if (ext === "png" && Buffer.from(bytes.subarray(0, 8)).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return "image/png";
  if (["jpg", "jpeg"].includes(ext || "") && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return "image/jpeg";
  if (ext === "docx" && bytes[0] === 80 && bytes[1] === 75 && bytes[2] === 3 && bytes[3] === 4) return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  if (ext === "txt" && !bytes.includes(0)) return "text/plain";
  return null;
}
