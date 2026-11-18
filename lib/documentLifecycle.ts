import { neon } from "@neondatabase/serverless";
import { list, del } from "@vercel/blob";
import { documentPrefix, ownsDocument } from "@/lib/subscriptionDocuments";
export function documentReferences(data: unknown): Set<string> {
  const paths = new Set<string>(); const pending = [data];
  while (pending.length) {
    const item = pending.pop();
    if (typeof item === "string" && item.startsWith("subscription-documents/")) paths.add(item);
    else if (item && typeof item === "object") pending.push(...Object.values(item));
  }
  return paths;
}
/** Conservative retention: retain references from live/recycled records and database backups,
 * plus every file younger than 75 days (longer than the external-backup retention). */
export async function unusedDocuments(email: string) {
  if (!process.env.DATABASE_URL) throw new Error("Document retention review requires the workspace database.");
  const sql = neon(process.env.DATABASE_URL);
  const account = email.trim().toLowerCase();
  const live = await sql`SELECT data FROM routino_workspaces WHERE email=${account}`;
  // An absent/unreadable backup table must fail closed, never turn protected files into candidates.
  const backups = await sql`SELECT data FROM routino_workspace_backups WHERE email=${account}`;
  const references = documentReferences([...live, ...backups]);
  let cursor: string | undefined; const candidates: { pathname: string; size: number; uploadedAt: string }[] = [];
  do {
    const page = await list({ prefix: documentPrefix(account), cursor, limit: 1000 });
    for (const blob of page.blobs) if (ownsDocument(account, blob.pathname) && !references.has(blob.pathname) && blob.uploadedAt.getTime() < Date.now() - 75 * 86400000) candidates.push({ pathname: blob.pathname, size: blob.size, uploadedAt: blob.uploadedAt.toISOString() });
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return candidates;
}
export async function removeUnusedDocuments(email: string, paths: string[]) {
  const safe = new Set((await unusedDocuments(email)).map(file => file.pathname));
  if (paths.some(path => !safe.has(path))) throw new Error("File references changed. Review unused files again; nothing was deleted.");
  if (paths.length) await del(paths);
  return paths.length;
}
