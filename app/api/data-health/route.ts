import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getUserWorkspace } from '@/lib/db';
import { head } from '@vercel/blob';
import { workspaceHealth, type HealthIssue } from '@/lib/dataHealth';
import { ownsDocument } from '@/lib/subscriptionDocuments';
import { readAttachmentBackup } from '@/lib/attachmentBackups';
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } });
export async function GET() {
    const email = (await auth())?.user?.email;
    if (!email)
        return json({ error: 'Sign in to inspect your saved workspace.' }, 401);
    try {
        const data = await getUserWorkspace(email);
        if (!data)
            return json({ error: 'No saved workspace found.' }, 404);
        const { issues, documents } = workspaceHealth(data);
        const unique = new Map(documents.filter(d => d.document.pathname).map(d => [d.document.pathname!, d.document]));
        let checked = 0, available = 0, backedUp = 0, unavailable = 0;
        const started = Date.now();
        for (const [path, doc] of Array.from(unique).slice(0, 50)) {
            if (Date.now() - started > 30000)
                break;
            if (!ownsDocument(email, path)) {
                issues.push({ id: `owner:${doc.id}`, level: 'warning', title: doc.name, detail: 'File reference does not belong to the signed-in account. No file was accessed.' });
                continue;
            }
            checked++;
            try {
                await head(path, { abortSignal: AbortSignal.timeout(5000) });
                available++;
            }
            catch (error) {
                const missing = error instanceof Error && error.name === 'BlobNotFoundError';
                if (missing) {
                    try {
                        if (await readAttachmentBackup(email, path)) {
                            backedUp++;
                            issues.push({ id: `backup:${doc.id}`, level: 'review', title: doc.name, detail: 'Original file is missing; a verified encrypted copy is available for download.' });
                            continue;
                        }
                    }
                    catch { }
                    issues.push({ id: `missing:${doc.id}`, level: 'warning', title: doc.name, detail: 'Original file is missing and no readable backup was confirmed. Existing references were preserved.' });
                }
                else
                    issues.push({ id: `unavailable:${doc.id}`, level: 'review', title: doc.name, detail: 'File availability could not be checked. This does not mean the file is missing.' });
                unavailable++;
            }
        }
        return json({ checkedAt: new Date().toISOString(), issues, files: { total: unique.size, checked, available, backedUp, unavailable, unchecked: Math.max(0, unique.size - checked) }, readOnly: true });
    }
    catch {
        return json({ error: 'Health check could not complete. No saved data was changed.' }, 503);
    }
}
