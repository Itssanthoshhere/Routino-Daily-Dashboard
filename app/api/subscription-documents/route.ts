import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { put, get } from "@vercel/blob";
import { documentPath, documentType, ownsDocument, MAX_DOCUMENT_BYTES } from "@/lib/subscriptionDocuments";

const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
export async function POST(request: Request) {
  const email = (await auth())?.user?.email;
  if (!email) return json({ error: "Sign in before uploading documents." }, 401);
  if (!process.env.BLOB_READ_WRITE_TOKEN && !process.env.BLOB_STORE_ID) return json({ error: "Private file storage is not configured." }, 503);
  if (Number(request.headers.get("content-length")) > MAX_DOCUMENT_BYTES + 65536) return json({ error: "Maximum file size is 3 MB." }, 413);
  try {
    const form = await request.formData(); const file = form.get("file");
    if (!(file instanceof File) || file.size > MAX_DOCUMENT_BYTES) return json({ error: "Choose a file no larger than 3 MB." }, 400);
    const bytes = new Uint8Array(await file.arrayBuffer()); const type = documentType(file.name, bytes);
    if (!type) return json({ error: "Supported files: PDF, PNG, JPG, DOCX, and plain text. Check the file format and size." }, 400);
    const path = documentPath(email);
    await put(path, Buffer.from(bytes), { access: "private", contentType: type, addRandomSuffix: false, allowOverwrite: false });
    return json({ document: { id: path.split("/").pop(), name: file.name.slice(0, 180), pathname: path, contentType: type, size: file.size, uploadedAt: new Date().toISOString() } });
  } catch { return json({ error: "Upload failed. Your existing documents are unchanged." }, 503); }
}
export async function GET(request: Request) {
  const email = (await auth())?.user?.email;
  if (!email) return json({ error: "Sign in to download documents." }, 401);
  const path = new URL(request.url).searchParams.get("path") || "";
  if (!ownsDocument(email, path)) return json({ error: "Document not found." }, 404);
  try {
    const result = await get(path, { access: "private" });
    if (!result || result.statusCode !== 200) return json({ error: "Document not found." }, 404);
    const name = (new URL(request.url).searchParams.get("name") || "document").replace(/[\r\n]/g, "").slice(0, 180);
    return new Response(result.stream, { headers: { "Content-Type": "application/octet-stream", "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(name)}`, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
  } catch { return json({ error: "Document download unavailable." }, 503); }
}
