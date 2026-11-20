const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const cache = {};
function load(file) {
  if (cache[file]) return cache[file].exports;
  const m = { exports: {} }; cache[file] = m;
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  new Function('require', 'module', 'exports', code)(name => name.startsWith('@/') ? load(name.slice(2) + '.ts') : require(name), m, m.exports);
  return m.exports;
}
const { encryptPayload, decryptPayload, createPassphraseVerification } = load('lib/crypto.ts');
const { verifyNoteVaultPin } = load('lib/noteVaultUnlock.ts');
(async () => {
  const pin = 'fixture-only-original-pin';
  const encrypted = await encryptPayload('fixture private note', pin);
  const before = [encrypted, 'plain note'];
  assert.equal(await verifyNoteVaultPin(pin, null, before), true, 'existing ciphertext unlocks on a fresh device');
  assert.equal(await verifyNoteVaultPin('wrong-pin', null, before), false);
  assert.equal(await verifyNoteVaultPin('', null, before), false);
  assert.equal(await verifyNoteVaultPin(pin, null, ['plain note']), false, 'plaintext is never proof of the PIN');
  assert.equal(await verifyNoteVaultPin(pin, null, []), false);
  assert.equal(await verifyNoteVaultPin(pin, null, ['aes256:broken']), false);
  assert.equal(await verifyNoteVaultPin(pin, null, ['aes256:broken', encrypted]), true, 'one corrupt note does not block recovery');
  const parts = encrypted.split(':');
  const bytes = Buffer.from(parts[3], 'base64'); bytes[0] ^= 1; parts[3] = bytes.toString('base64');
  assert.equal(await verifyNoteVaultPin(pin, null, [parts.join(':')]), false, 'tampered ciphertext cannot authenticate');
  const verifier = await createPassphraseVerification(pin);
  assert.equal(await verifyNoteVaultPin(pin, verifier, []), true, 'existing local verifier remains supported');
  assert.equal(await verifyNoteVaultPin('wrong-pin', verifier, [encrypted]), false);
  assert.deepEqual(before, [encrypted, 'plain note'], 'verification leaves saved ciphertext unchanged');
  assert.equal(await decryptPayload(encrypted, pin), 'fixture private note');
  console.log('Passed: new-device PIN verification, legacy verifier, wrong/empty PIN rejection, plaintext exclusion, corrupt/tampered ciphertext rejection and source preservation. Real Web Crypto; no account writes.');
})().catch(error => { console.error(error); process.exitCode = 1; });
