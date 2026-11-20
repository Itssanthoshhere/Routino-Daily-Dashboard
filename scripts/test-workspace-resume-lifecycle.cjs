const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
function source(file, require) {
  const module = { exports: {} };
  new Function('require', 'module', 'exports', ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText)(require, module, module.exports);
  return module.exports;
}
const positions = source('lib/workspaceResume.ts');
const accountStorage = source('lib/accountStorage.ts');
function scenario(search = '', input = null, early = false) {
  const globals = ['window', 'document', 'localStorage', 'ResizeObserver', 'requestAnimationFrame', 'cancelAnimationFrame', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'];
  const original = Object.fromEntries(globals.map(key => [key, Object.getOwnPropertyDescriptor(global, key)]));
  let now = 0, sequence = 0;
  const timers = new Map(), effects = [], cleanup = [];
  const schedule = (fn, delay = 0, interval = 0) => { const id = ++sequence; timers.set(id, { fn, at: now + delay, interval }); return id; };
  const tick = milliseconds => {
    const end = now + milliseconds;
    while (true) {
      const next = [...timers.entries()].filter(([, timer]) => timer.at <= end).sort((a, b) => a[1].at - b[1].at)[0];
      if (!next) break;
      const [id, timer] = next; now = timer.at;
      if (timer.interval) timer.at += timer.interval; else timers.delete(id);
      timer.fn();
    }
    now = end;
  };
  const win = new EventTarget(); Object.assign(win, { location: { search, hash: '' }, scrollY: 0, innerHeight: 852, scrollTo({ top }) { this.scrollY = top; this.dispatchEvent(new Event('scroll')); } });
  const doc = new EventTarget(); Object.assign(doc, { body: {}, documentElement: { scrollHeight: 6000 }, visibilityState: 'visible', querySelector: () => null });
  const key = accountStorage.accountStorageKey('routino_workspace_position', 'a@example.com');
  const saved = { section: 'Trackers', tracker: 'expenses', scrollY: 1704 };
  const store = new Map([[key, JSON.stringify(saved)]]);
  const resumed = [];
  Object.assign(global, { window: win, document: doc, localStorage: { getItem: key => store.get(key) || null, setItem: (key, value) => store.set(key, value) }, ResizeObserver: class { observe() {} disconnect() {} }, requestAnimationFrame: fn => schedule(fn, 16), cancelAnimationFrame: id => timers.delete(id), setTimeout: schedule, clearTimeout: id => timers.delete(id), setInterval: (fn, delay) => schedule(fn, delay, delay), clearInterval: id => timers.delete(id) });
  try {
    const hook = source('hooks/useWorkspaceResume.ts', name => name === 'react' ? { useRef: current => ({ current }), useEffect: fn => effects.push(fn) } : name.includes('accountStorage') ? accountStorage : positions);
    hook.useWorkspaceResume({ ready: true, account: 'a@example.com', section: search.includes('tasks') ? 'Tasks' : 'Trackers', tracker: 'expenses', onResume: value => resumed.push(value) });
    effects.forEach((effect, index) => {
      const dispose = effect(); if (dispose) cleanup.push(dispose);
      if (early && index === 0) win.dispatchEvent(new Event(input));
    });
    tick(300);
    if (!search && !early) { assert.deepEqual(resumed, [saved]); assert.equal(win.scrollY, 1704); }
    else { assert.equal(resumed.length, 0); assert.equal(win.scrollY, 0); }
    if (input) {
      win.dispatchEvent(new Event(input));
      win.scrollY = 600; win.dispatchEvent(new Event('scroll'));
      tick(1000);
      assert.equal(win.scrollY, 600, `${input} stops restore retries`);
      assert.equal(JSON.parse(store.get(key)).scrollY, 600);
      win.scrollY = 720; doc.visibilityState = 'hidden'; doc.dispatchEvent(new Event('visibilitychange'));
      assert.equal(JSON.parse(store.get(key)).scrollY, 720);
    } else tick(9000);
    cleanup.reverse().forEach(fn => fn());
    assert.equal(timers.size, 0, 'effect cleanup releases all timers');
  } finally {
    for (const key of globals) {
      if (original[key]) Object.defineProperty(global, key, original[key]); else delete global[key];
    }
  }
}
for (const input of ['wheel', 'touchstart', 'pointerdown', 'keydown', 'popstate']) scenario('', input);
scenario(); scenario('?tab=tasks'); scenario('?action=capture');
for (const input of ['wheel', 'touchstart', 'popstate']) scenario('', input, true);
console.log('Passed: launch restoration, timed retry cleanup, immediate input/history cancellation, debounced saves, hide-time flushing and explicit-link/shortcut priority. Browser/storage mocked; no account writes.');
