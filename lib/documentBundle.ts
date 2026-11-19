import { get } from '@vercel/blob';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { ownsDocument, MAX_DOCUMENT_BYTES } from '@/lib/subscriptionDocuments';
import { readAttachmentBackup } from '@/lib/attachmentBackups';
import type { InventoryDocument } from '@/lib/documentInventory';
function tarFile(name: string, bytes: Buffer) { const header = Buffer.alloc(512); header.write(name, 0, 100, 'ascii'); const octal = (value: number, offset: number, length: number) => header.write(value.toString(8).padStart(length - 1, '0') + '\0', offset, length, 'ascii'); octal(0o600, 100, 8); octal(0, 108, 8); octal(0, 116, 8); octal(bytes.length, 124, 12); octal(0, 136, 12); header.fill(32, 148, 156); header.write('0', 156, 1, 'ascii'); header.write('ustar\0', 257, 6, 'ascii'); header.write('00', 263, 2, 'ascii'); const checksum = header.reduce((sum, n) => sum + n, 0); header.write(checksum.toString(8).padStart(6, '0') + '\0 ', 148, 8, 'ascii'); return Buffer.concat([header, bytes, Buffer.alloc((512 - bytes.length % 512) % 512)]); }
export function exportFilename(name: string, index: number) { const clean = name.normalize('NFKD').replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/\.{2,}/g, '-').replace(/^\.+/, '').slice(-75) || 'document'; return `documents/${String(index + 1).padStart(3, '0')}-${clean}`; }
async function sourceBytes(email: string, path: string) { if (!ownsDocument(email, path))
    throw new Error('Invalid owner.'); const original = await get(path, { access: 'private', useCache: false, abortSignal: AbortSignal.timeout(10000) }); if (!original || original.statusCode !== 200) {
    const backup = await readAttachmentBackup(email, path);
    if (!backup)
        throw new Error('No readable copy.');
    return { bytes: backup.bytes, source: 'encrypted-backup' };
} if (original.blob.size > MAX_DOCUMENT_BYTES)
    throw new Error('File exceeds the export limit.'); const reader = original.stream.getReader(); let size = 0; const chunks: Buffer[] = []; try {
    while (true) {
        const { done, value } = await reader.read();
        if (done)
            break;
        size += value.length;
        if (size > MAX_DOCUMENT_BYTES)
            throw new Error('File exceeds export limit.');
        chunks.push(Buffer.from(value));
    }
}
finally {
    await reader.cancel().catch(() => { });
} return { bytes: Buffer.concat(chunks), source: 'original' }; }
export async function createDocumentBundle(email: string, files: InventoryDocument[]) { if (!files.length || files.length > 25)
    throw new Error('Select 1–25 documents.'); const entries: Buffer[] = []; const index: {
    name: string;
    contexts: string[];
    uploadedAt: string;
    file?: string;
    status: string;
    sha256?: string;
    url?: string;
}[] = []; let total = 0, warnings = 0; for (let start = 0; start < files.length; start += 4) {
    const loaded = await Promise.all(files.slice(start, start + 4).map(async (row, offset) => { if (!row.document.pathname)
        return { row, status: 'external', url: row.document.url }; try {
        const file = await sourceBytes(email, row.document.pathname);
        return { row, status: file.source, bytes: file.bytes, name: exportFilename(row.name, start + offset) };
    }
    catch {
        return { row, status: 'unavailable' };
    } }));
    for (const item of loaded) {
        const meta = { name: item.row.name, contexts: item.row.contexts, uploadedAt: item.row.document.uploadedAt, status: item.status };
        if (item.bytes && item.name) {
            total += item.bytes.length;
            if (total > 20 * 1024 * 1024)
                throw new Error('Selection exceeds 20 MB. Export fewer documents.');
            entries.push(tarFile(item.name, item.bytes));
            index.push({ ...meta, file: item.name, sha256: createHash('sha256').update(item.bytes).digest('hex') });
        }
        else {
            warnings++;
            index.push({ ...meta, ...('url' in item ? { url: item.url } : {}) });
        }
    }
} entries.unshift(tarFile('index.json', Buffer.from(JSON.stringify({ format: 'routino-document-bundle-v1', createdAt: new Date().toISOString(), documents: index, note: 'External URLs were not fetched. Unavailable files are listed without contents. Keep this export private.' }, null, 2)))); entries.push(Buffer.alloc(1024)); return { bytes: gzipSync(Buffer.concat(entries)), warnings, included: index.filter(i => i.file).length }; }
