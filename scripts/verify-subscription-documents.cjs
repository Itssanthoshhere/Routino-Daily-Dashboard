const assert = require('node:assert/strict');
const { createHash, randomUUID } = require('node:crypto');
const { put, get, del } = require('@vercel/blob');
require('@next/env').loadEnvConfig(process.cwd(), true);
async function run() {
  assert.ok(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID, 'Private Blob storage must be configured');
  const email = `document-test-${randomUUID()}@example.invalid`;
  const prefix = createHash('sha256').update(email).digest('hex');
  const path = `subscription-documents/${prefix}/${randomUUID()}`;
  const content = Buffer.from('Disposable Routino document storage verification. No personal data.');
  let created = false;
  try {
    await put(path, content, { access: 'private', contentType: 'text/plain', addRandomSuffix: false, allowOverwrite: false });
    created = true;
    const result = await get(path, { access: 'private', useCache: false });
    assert.equal(result?.statusCode, 200);
    assert.equal(await new Response(result.stream).text(), content.toString());
    console.log('Passed: private Blob upload and independent exact-content read using a disposable test account.');
  } finally {
    if (created) { await del(path); console.log('Removed only the disposable test upload.'); }
  }
}
run().catch(() => { console.error('Private document roundtrip failed; inspect Blob configuration. No user files were modified.'); process.exitCode = 1; });
