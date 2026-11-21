const assert = require('node:assert/strict'), fs = require('node:fs'), ts = require('typescript');
const cache = {};
function load(file) {
  if (cache[file]) return cache[file].exports;
  const module = { exports: {} }; cache[file] = module;
  new Function('require', 'module', 'exports', ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText)(name => name.startsWith('@/') ? load(name.slice(2) + '.ts') : require(name), module, module.exports);
  return module.exports;
}
const { classifyEmail } = load('lib/email-classifier.ts');
for (const subject of ['stupid', 'groupie', 'flaws', 'laws', 'draws', 'jaws', 'atmosphere', 'atmospheric', 'revival', 'vivacious']) assert.equal(classifyEmail({ subject }), null, subject);
for (const [subject, variant] of [['UPI payment', 'finance'], ['ATM withdrawal', 'finance'], ['AWS: service update', 'infra'], ['Viva tomorrow', 'career'], ['Your invoice', 'finance'], ['Security alert from AWS', 'security']]) assert.equal(classifyEmail({ subject }).variant, variant);
const { findScheduleConflicts, getTodayTravelInfo } = load('lib/meeting.ts');
const event = (id, start, end, summary = 'Meeting') => ({ id, summary, start: { dateTime: start }, end: { dateTime: end } });
for (const zone of ['Asia/Kolkata', 'America/Los_Angeles']) {
  process.env.TZ = zone;
  const a = event('a', new Date(2026, 10, 20, 23, 30).toISOString(), new Date(2026, 10, 21, 2).toISOString(), 'Flight to Delhi');
  const b = event('b', new Date(2026, 10, 21, 0, 30).toISOString(), new Date(2026, 10, 21, 1).toISOString());
  const c = findScheduleConflicts([a, b], '2026-11-21');
  assert.equal(c.length, 1, zone); assert.equal(c[0].overlapMinutes, 30);
  assert.equal(getTodayTravelInfo([a], '2026-11-21').event.id, 'a');
  assert.equal(findScheduleConflicts([a, b], '2026-11-20').length, 0);
  const midnight = event('midnight', new Date(2026, 10, 20, 22).toISOString(), new Date(2026, 10, 21).toISOString(), 'Flight to Delhi');
  assert.equal(getTodayTravelInfo([midnight], '2026-11-21'), null);
  assert.equal(findScheduleConflicts([a, event('bad', 'invalid', 'invalid')], '2026-11-21').length, 0);
  assert.equal(getTodayTravelInfo([a], '2026-02-30'), null);
  const long = event('long', new Date(2026, 10, 20, 22).toISOString(), new Date(2026, 10, 22, 2).toISOString());
  assert.equal(findScheduleConflicts([a, long], '2026-11-21')[0].overlapMinutes, 120);
  const allDay = { id: 'all', summary: 'Flight trip', start: { date: '2026-11-20' }, end: { date: '2026-11-22' } };
  assert.equal(getTodayTravelInfo([allDay], '2026-11-21').departureDate.getHours(), 0);
  assert.equal(findScheduleConflicts([allDay, a], '2026-11-21').length, 0);
}
process.env.TZ = 'America/Los_Angeles';
const dst = event('dst', '2026-03-08T00:00:00-08:00', '2026-03-09T00:00:00-07:00');
assert.equal(findScheduleConflicts([dst, { ...dst, id: 'dst2' }], '2026-03-08')[0].overlapMinutes, 23 * 60);
const originalStorage = Object.getOwnPropertyDescriptor(global, 'localStorage');
const originalWindow = Object.getOwnPropertyDescriptor(global, 'window');
try {
  const win = new EventTarget(); let notices = 0; win.addEventListener('routino:storage-failure', () => notices++);
  Object.defineProperty(global, 'window', { configurable: true, value: win });
  const { writeBrowserStorage, getBrowserStorageFailure } = load('lib/accountStorage.ts');
  let saved;
  Object.defineProperty(global, 'localStorage', { configurable: true, value: { setItem: (key, value) => { saved = [key, value]; } } });
  writeBrowserStorage('test', 'value'); assert.deepEqual(saved, ['test', 'value']); assert.equal(notices, 0);
  for (const [name, kind] of [['QuotaExceededError', 'quota'], ['NS_ERROR_DOM_QUOTA_REACHED', 'quota'], ['SecurityError', 'unavailable']]) {
    const error = Object.assign(new Error('blocked'), { name });
    global.localStorage.setItem = () => { throw error; };
    assert.throws(() => writeBrowserStorage('test', 'private'), value => value === error);
    assert.equal(getBrowserStorageFailure(), kind);
  }
  assert.equal(notices, 3);
} finally {
  for (const [key, descriptor] of [['localStorage', originalStorage], ['window', originalWindow]]) if (descriptor) Object.defineProperty(global, key, descriptor); else delete global[key];
}
console.log('Passed: acronym boundaries, classification priority, timezone/overnight/day-boundary/DST detection, invalid dates, all-day travel, and observable storage failures preserving thrown errors.');
