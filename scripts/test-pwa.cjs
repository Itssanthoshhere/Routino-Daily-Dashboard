const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
async function main() {
  const base = 'http://localhost:3100';
  const manifest = await (await fetch(`${base}/manifest.webmanifest`)).json();
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.start_url, '/dashboard');
  assert.deepEqual(manifest.shortcuts.map(shortcut => shortcut.url), ['/dashboard?action=capture', '/dashboard?tab=tasks', '/dashboard?action=focus']);
  for (const icon of manifest.icons) {
    const response = await fetch(base + icon.src);
    assert.equal(response.status, 200);
    const bytes = Buffer.from(await response.arrayBuffer());
    assert.equal(bytes.readUInt32BE(16), Number(icon.sizes.split('x')[0]));
    assert.equal(bytes.readUInt32BE(20), Number(icon.sizes.split('x')[1]));
  }
  const handlers = {};
  const saved = new Map();
  let offline = false;
  const network = request => offline ? Promise.reject(new Error('Offline')) : fetch(new URL(typeof request === 'string' ? request : request.url, base));
  const cache = {
    async addAll(urls) { for (const url of urls) { const response = await network(url); assert.equal(response.ok, true); saved.set(new URL(url, base).pathname, response.clone()); } },
    async match(url) { return saved.get(new URL(typeof url === 'string' ? url : url.url, base).pathname)?.clone(); },
    async put(url, response) { saved.set(new URL(typeof url === 'string' ? url : url.url, base).pathname, response.clone()); },
  };
  vm.runInNewContext(fs.readFileSync('public/sw.js', 'utf8'), {
    self: { location: { origin: base }, clients: { claim: async () => {} }, addEventListener: (name, handler) => { handlers[name] = handler; } },
    caches: { open: async () => cache, match: cache.match, keys: async () => [], delete: async () => true },
    fetch: network, URL, Response, Set, Promise,
  });
  let pending;
  handlers.install({ waitUntil: promise => { pending = promise; } }); await pending;
  assert.ok([...saved.keys()].some(key => key.startsWith('/_next/static/')), 'App assets must be precached');
  offline = true;
  let result;
  handlers.fetch({ request: { method: 'GET', url: `${base}/dashboard?tab=tasks`, mode: 'navigate' }, respondWith: promise => { result = promise; } });
  assert.equal((await result).status, 200);
  handlers.fetch({ request: { method: 'GET', url: `${base}/`, mode: 'navigate' }, respondWith: promise => { result = promise; } });
  assert.equal((await result).status, 200, 'Root navigation must fall back to dashboard');
  for (const action of ['capture', 'focus']) { handlers.fetch({ request: { method: 'GET', url: `${base}/dashboard?action=${action}`, mode: 'navigate' }, respondWith: promise => { result = promise; } }); assert.equal((await result).status, 200, 'Shortcut must retain offline dashboard fallback'); }
  let intercepted = false;
  handlers.fetch({ request: { method: 'GET', url: `${base}/api/user-data` }, respondWith: () => { intercepted = true; } });
  assert.equal(intercepted, false, 'Private API responses must not be cached');
  console.log(`Passed: production manifest, PNG dimensions, ${saved.size} cached shell/assets, offline navigation fallback, API cache exclusion.`);
}
main().catch(error => { console.error(error); process.exitCode = 1; });
