import { neon } from "@neondatabase/serverless";
import { backupWorkspace } from "@/lib/workspaceBackups";
import { restoreDeletedRecord, type RecycleEntry } from "@/lib/recycleBin";
let installation: Promise<void> | undefined;
const captureFunction = `CREATE OR REPLACE FUNCTION routino_capture_deletions() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE field text; item jsonb; entries jsonb := CASE WHEN jsonb_typeof(NEW.data->'recycleBin')='array' THEN NEW.data->'recycleBin' WHEN jsonb_typeof(OLD.data->'recycleBin')='array' THEN OLD.data->'recycleBin' ELSE '[]'::jsonb END; hidden text;
BEGIN
  FOREACH field IN ARRAY ARRAY['tasks','notes','habits','customEvents','quickLinks','subscriptions'] LOOP
    IF (OLD.data->field) IS DISTINCT FROM (NEW.data->field) THEN
      FOR item IN SELECT value FROM jsonb_array_elements((CASE WHEN jsonb_typeof(OLD.data->field)='array' THEN OLD.data->field ELSE '[]'::jsonb END)) WHERE value ? 'id' LOOP
        IF NOT EXISTS (SELECT 1 FROM jsonb_array_elements((CASE WHEN jsonb_typeof(NEW.data->field)='array' THEN NEW.data->field ELSE '[]'::jsonb END)) n WHERE n->>'id' = item->>'id') THEN
          entries := entries || jsonb_build_array(jsonb_build_object('id',gen_random_uuid()::text,'kind',field,'record',item,'deletedAt',to_char(clock_timestamp() AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')));
        END IF;
      END LOOP;
    END IF;
  END LOOP;
  IF (OLD.data->'airtel') IS DISTINCT FROM (NEW.data->'airtel') THEN
    FOR item IN SELECT value FROM jsonb_array_elements((CASE WHEN jsonb_typeof(OLD.data->'airtel'->'records')='array' THEN OLD.data->'airtel'->'records' ELSE '[]'::jsonb END)) WHERE value ? 'id' LOOP
      IF NOT EXISTS (SELECT 1 FROM jsonb_array_elements((CASE WHEN jsonb_typeof(NEW.data->'airtel'->'records')='array' THEN NEW.data->'airtel'->'records' ELSE '[]'::jsonb END)) n WHERE n->>'id'=item->>'id') THEN
        entries := entries || jsonb_build_array(jsonb_build_object('id',gen_random_uuid()::text,'kind','airtel','record',item,'deletedAt',to_char(clock_timestamp() AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')));
      END IF;
    END LOOP;
    FOR hidden IN SELECT jsonb_array_elements_text((CASE WHEN jsonb_typeof(NEW.data->'airtel'->'deletedIds')='array' THEN NEW.data->'airtel'->'deletedIds' ELSE '[]'::jsonb END)) LOOP
      IF NOT ((CASE WHEN jsonb_typeof(OLD.data->'airtel'->'deletedIds')='array' THEN OLD.data->'airtel'->'deletedIds' ELSE '[]'::jsonb END) ? hidden) AND NOT EXISTS (SELECT 1 FROM jsonb_array_elements((CASE WHEN jsonb_typeof(OLD.data->'airtel'->'records')='array' THEN OLD.data->'airtel'->'records' ELSE '[]'::jsonb END)) r WHERE r->>'id'=hidden) THEN
        entries := entries || jsonb_build_array(jsonb_build_object('id',gen_random_uuid()::text,'kind','airtel','record',jsonb_build_object('id',hidden),'journalOnly',true,'deletedAt',to_char(clock_timestamp() AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')));
      END IF;
    END LOOP;
  END IF;
  IF entries <> '[]'::jsonb OR NEW.data ? 'recycleBin' THEN NEW.data := jsonb_set(NEW.data,'{recycleBin}',entries); END IF;
  RETURN NEW;
END $$`;
export async function ensureRecycleBin() {
  if (!process.env.DATABASE_URL) throw new Error("Database Recycle Bin requires Neon Postgres.");
  if (!installation) installation = (async () => {
    const sql = neon(process.env.DATABASE_URL!);
    await sql`CREATE TABLE IF NOT EXISTS routino_workspaces (email TEXT PRIMARY KEY, data JSONB NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
    await sql.query(captureFunction, []);
    await sql.query("CREATE OR REPLACE TRIGGER routino_capture_deletions_trigger BEFORE UPDATE OF data ON routino_workspaces FOR EACH ROW EXECUTE FUNCTION routino_capture_deletions()", []);
  })().catch(error => { installation = undefined; throw error; });
  await installation;
}
export async function readRecycleBin(email: string) {
  await ensureRecycleBin(); const sql = neon(process.env.DATABASE_URL!);
  const [row] = await sql`SELECT COALESCE(data->'recycleBin','[]'::jsonb) AS entries, updated_at::text AS version FROM routino_workspaces WHERE email=${email.trim().toLowerCase()}`;
  return { entries: (row?.entries || []) as RecycleEntry[], version: row?.version || "" };
}
export async function restoreRecycleEntry(email: string, id: string, version: string): Promise<{ success: true } | { success: false; conflict: true } | { success: false; error: string }> {
  await ensureRecycleBin(); const sql = neon(process.env.DATABASE_URL!); const account = email.trim().toLowerCase();
  const [row] = await sql`SELECT data, updated_at::text AS version FROM routino_workspaces WHERE email=${account}`;
  if (!row || row.version !== version) return { success: false, conflict: true };
  const restored = restoreDeletedRecord(row.data, id);
  if (!restored.success) return restored;
  await backupWorkspace(account);
  const next = { ...restored.data, updatedAt: new Date().toISOString(), trackerRevision: (row.data.trackerRevision || 0) + 1 };
  const result = await sql`UPDATE routino_workspaces SET data=${JSON.stringify(next)}::jsonb, updated_at=NOW() WHERE email=${account} AND updated_at::text=${version} RETURNING email`;
  return result.length ? { success: true } : { success: false, conflict: true };
}
