import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getUserWorkspace } from '@/lib/db';
import { head } from '@vercel/blob';
import { documentInventory } from '@/lib/documentInventory';
import { ownsDocument } from '@/lib/subscriptionDocuments';
import { readAttachmentBackup } from '@/lib/attachmentBackups';
import { externalBackupConfigured } from '@/lib/externalBackups';
export const maxDuration = 60;
const json = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: { 'Cache-Control': 'private, no-store' } });
export async function GET(request: Request) { const email = (await auth())?.user?.email; if (!email)
    return json({ error: 'Sign in to check document coverage.' }, 401); try {
    const data = await getUserWorkspace(email);
    if (!data)
        return json({ error: 'No saved workspace.' }, 404);
    const { files, inventoryId } = documentInventory(data);
    const url = new URL(request.url);
    const cursor = Number(url.searchParams.get('cursor') || 0);
    if (!Number.isInteger(cursor) || cursor < 0 || cursor > files.length)
        return json({ error: 'Invalid coverage page.' }, 400);
    if (url.searchParams.has('inventory') && url.searchParams.get('inventory') !== inventoryId)
        return json({ error: 'Document records changed. Refresh coverage before continuing.' }, 409);
    const rows = [];
    const selected = files.slice(cursor, cursor + 20);
    const started = Date.now();
    for (let i = 0; i < selected.length; i += 4) {
        if (Date.now() - started > 30000)
            break;
        rows.push(...await Promise.all(selected.slice(i, i + 4).map(async (file) => { const base = { id: file.id, name: file.name, contexts: file.contexts, uploadedAt: file.document.uploadedAt, size: file.document.size || 0 }; const path = file.document.pathname; if (!path)
            return { ...base, status: 'external', detail: 'External link only. Not fetched or backed up.' }; if (!ownsDocument(email, path))
            return { ...base, status: 'attention', detail: 'This reference does not belong to the signed-in account.' }; try {
            if (await readAttachmentBackup(email, path))
                return { ...base, status: 'protected', detail: 'Encrypted copy decrypted and verified successfully.' };
            try {
                await head(path, { abortSignal: AbortSignal.timeout(5000) });
                return { ...base, status: 'pending', detail: 'Original is available; encrypted copy has not been confirmed.' };
            }
            catch {
                return { ...base, status: 'attention', detail: 'Original availability could not be confirmed, and no encrypted copy was found.' };
            }
        }
        catch {
            return { ...base, status: 'attention', detail: 'Backup verification could not complete. This does not mean the original is missing.' };
        } })));
    }
    const next = cursor + rows.length;
    return json({ inventoryId, total: files.length, rows, nextCursor: next < files.length ? next : null, checkedAt: new Date().toISOString(), configured: externalBackupConfigured() });
}
catch {
    return json({ error: 'Coverage check unavailable. No saved files were changed.' }, 503);
} }
