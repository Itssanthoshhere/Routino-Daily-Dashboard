import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { gzipSync, gunzipSync } from 'node:zlib';
import { get, put } from '@vercel/blob';
import { documentReferences } from '@/lib/documentLifecycle';
import { ownsDocument, MAX_DOCUMENT_BYTES } from '@/lib/subscriptionDocuments';
const MAX_ENVELOPE = 6 * 1024 * 1024;
const account = (email: string) => email.trim().toLowerCase();
export function attachmentBackupPath(email: string, path: string) { if (!ownsDocument(email, path))
    throw new Error('Invalid attachment owner.'); return `attachment-backups/${createHash('sha256').update(account(email)).digest('hex')}/${createHash('sha256').update(path).digest('hex')}.json.enc`; }
function key() { const value = process.env.WORKSPACE_BACKUP_KEY || ''; const bytes = Buffer.from(value, 'base64'); if (bytes.length !== 32 || bytes.toString('base64') !== value)
    throw new Error('Attachment backup encryption is not configured.'); return bytes; }
export function encryptAttachment(email: string, path: string, bytes: Buffer, contentType: string) { if (!ownsDocument(email, path) || bytes.length > MAX_DOCUMENT_BYTES)
    throw new Error('Invalid attachment.'); const iv = randomBytes(12), cipher = createCipheriv('aes-256-gcm', key(), iv); cipher.setAAD(Buffer.from(`${account(email)}:attachment:${path}`)); const payload = gzipSync(Buffer.from(JSON.stringify({ path, contentType, sha256: createHash('sha256').update(bytes).digest('hex'), bytes: bytes.toString('base64') }))); return JSON.stringify({ version: 1, iv: iv.toString('base64'), tag: (() => { const encrypted = Buffer.concat([cipher.update(payload), cipher.final()]); return { value: cipher.getAuthTag().toString('base64'), ciphertext: encrypted.toString('base64') }; })() }); }
export function decryptAttachment(email: string, path: string, encrypted: string) { if (!ownsDocument(email, path) || Buffer.byteLength(encrypted) > MAX_ENVELOPE)
    throw new Error('Invalid attachment backup.'); const envelope = JSON.parse(encrypted); if (envelope.version !== 1 || typeof envelope.iv !== 'string' || typeof envelope.tag?.value !== 'string' || typeof envelope.tag?.ciphertext !== 'string')
    throw new Error('Invalid attachment backup.'); const iv = Buffer.from(envelope.iv, 'base64'), tag = Buffer.from(envelope.tag.value, 'base64'); if (iv.length !== 12 || tag.length !== 16)
    throw new Error('Invalid encryption metadata.'); const cipher = createDecipheriv('aes-256-gcm', key(), iv); cipher.setAAD(Buffer.from(`${account(email)}:attachment:${path}`)); cipher.setAuthTag(tag); const data = JSON.parse(gunzipSync(Buffer.concat([cipher.update(Buffer.from(envelope.tag.ciphertext, 'base64')), cipher.final()]), { maxOutputLength: 5 * 1024 * 1024 }).toString('utf8')); if (data.path !== path || typeof data.bytes !== 'string' || !['application/pdf', 'image/png', 'image/jpeg', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'].includes(data.contentType))
    throw new Error('Attachment metadata mismatch.'); const bytes = Buffer.from(data.bytes, 'base64'); if (bytes.length > MAX_DOCUMENT_BYTES || createHash('sha256').update(bytes).digest('hex') !== data.sha256)
    throw new Error('Attachment integrity check failed.'); return { bytes, contentType: data.contentType as string }; }
export async function readAttachmentBackup(email: string, path: string) { const result = await get(attachmentBackupPath(email, path), { access: 'private', useCache: false, abortSignal: AbortSignal.timeout(10000) }); if (!result)
    return null; if (result.statusCode !== 200 || result.blob.size > MAX_ENVELOPE)
    throw new Error('Attachment backup unavailable.'); return decryptAttachment(email, path, await new Response(result.stream).text()); }
async function boundedBytes(stream: ReadableStream<Uint8Array>) { const reader = stream.getReader(), chunks: Buffer[] = []; let size = 0; try {
    while (true) {
        const { done, value } = await reader.read();
        if (done)
            break;
        size += value.byteLength;
        if (size > MAX_DOCUMENT_BYTES)
            throw new Error('Attachment exceeds backup limit.');
        chunks.push(Buffer.from(value));
    }
    return Buffer.concat(chunks);
}
finally {
    await reader.cancel().catch(() => { });
} }
/** Immutable files get separate encrypted copies without TTL. Neither source files nor old copies are deleted. */
export async function backupAttachments(email: string, data: unknown) { const paths = Array.from(documentReferences(data)).filter(path => ownsDocument(email, path)); if (paths.length > 200)
    throw new Error('More than 200 attachments require a separate backup batch. No files were changed.'); let verified = 0, created = 0; const started = Date.now(); for (const path of paths) {
    if (Date.now() - started > 45000)
        throw new Error('Attachment backup incomplete. Retry to continue; completed copies are retained.');
    const existing = await readAttachmentBackup(email, path);
    if (existing) {
        verified++;
        continue;
    }
    const source = await get(path, { access: 'private', useCache: false, abortSignal: AbortSignal.timeout(10000) });
    if (!source || source.statusCode !== 200 || source.blob.size > MAX_DOCUMENT_BYTES)
        throw new Error('A referenced attachment could not be read. Existing copies remain unchanged.');
    const bytes = await boundedBytes(source.stream);
    const encrypted = encryptAttachment(email, path, bytes, source.blob.contentType);
    try {
        await put(attachmentBackupPath(email, path), encrypted, { access: 'private', contentType: 'application/json', addRandomSuffix: false, allowOverwrite: false, abortSignal: AbortSignal.timeout(10000) });
    }
    catch (error) {
        if (!await readAttachmentBackup(email, path))
            throw error;
    }
    if (!await readAttachmentBackup(email, path))
        throw new Error('Attachment copy could not be verified.');
    created++;
    verified++;
} return { referenced: paths.length, verified, created, complete: true as const }; }
