import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getUserWorkspace } from '@/lib/db';
import { documentInventory } from '@/lib/documentInventory';
import { createDocumentBundle } from '@/lib/documentBundle';
export const maxDuration = 90;
const json = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: { 'Cache-Control': 'private, no-store' } });
export async function POST(request: Request) { const email = (await auth())?.user?.email; if (!email)
    return json({ error: 'Sign in to export your documents.' }, 401); if (Number(request.headers.get('content-length')) > 16384)
    return json({ error: 'Selection is too large.' }, 413); try {
    const body = await request.json();
    if (!Array.isArray(body.ids) || !body.ids.length || body.ids.length > 25 || new Set(body.ids).size !== body.ids.length || !body.ids.every((id: unknown) => typeof id === 'string' && /^[a-f0-9]{64}$/.test(id)))
        return json({ error: 'Select 1–25 unique documents.' }, 400);
    const data = await getUserWorkspace(email);
    if (!data)
        return json({ error: 'No saved workspace.' }, 404);
    const { files, inventoryId } = documentInventory(data);
    if (body.inventoryId !== inventoryId)
        return json({ error: 'Saved documents changed. Refresh the list before exporting.' }, 409);
    const selected = files.filter(file => body.ids.includes(file.id));
    if (selected.length !== body.ids.length)
        return json({ error: 'One or more selected documents are unavailable in this account.' }, 400);
    const bundle = await createDocumentBundle(email, selected);
    let offset = 0;
    const stream = new ReadableStream<Uint8Array>({ pull(controller) { if (offset >= bundle.bytes.length) {
            controller.close();
            return;
        } controller.enqueue(new Uint8Array(bundle.bytes.subarray(offset, offset + 65536))); offset += 65536; } });
    return new Response(stream, { headers: { 'Content-Type': 'application/gzip', 'Content-Disposition': `attachment; filename="routino-documents-${new Date().toISOString().slice(0, 10)}.tar.gz"`, 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff', 'X-Routino-Included': String(bundle.included), 'X-Routino-Warnings': String(bundle.warnings) } });
}
catch (error) {
    return json({ error: error instanceof Error && error.message.startsWith('Selection exceeds') ? error.message : 'Document export could not complete. Original files remain unchanged.' }, 503);
} }
