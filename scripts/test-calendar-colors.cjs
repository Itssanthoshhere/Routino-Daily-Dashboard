const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
function load(file, mocks = {}) {
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  new Function('require','module','exports','setTimeout',code)(name => name in mocks ? mocks[name] : name.startsWith('@/') ? load(`${name.slice(2)}.ts`, mocks) : require(name), module, module.exports, callback => { callback(); return 0; });
  return module.exports;
}
const { calendarColorRule } = load('lib/calendarColors.ts');
for (const [color, keywords] of Object.entries({
  2: ['breakfast','lunch','dinner','maggi','yippee','biryani','soup','snacks','cooking'],
  9: ['sleep','instaa','insta','bath','freshup','youtube','chit'],
  4: ['netflix','movie','series','cinema','latent','s01','s02','s03','s04','s05','show','super','doraemon'],
  11: ['subway','bgmi','games','coc'],
  8: ['typing'],
})) for (const keyword of keywords) assert.equal(calendarColorRule(keyword.toUpperCase()).colorId, color, keyword);
assert.equal(calendarColorRule('The Fantastic Four: First Steps Movie').colorId, '4');
assert.equal(calendarColorRule('Series S01E03').colorId, '4');
assert.equal(calendarColorRule('Dinner in America Movie').colorId, '4');
assert.equal(calendarColorRule('Superbase & MongoDB resuming'), undefined);
assert.equal(calendarColorRule('Showcase review'), undefined);
assert.equal(calendarColorRule('Time series analysis'), undefined);
assert.equal(calendarColorRule('Homework'), undefined);
const { inferEventCategory } = load('lib/meeting.ts');
assert.deepEqual(inferEventCategory({ summary: 'The Fantastic Four: First Steps Movie' }), { tag: 'ENTERTAINMENT', color: '#e67c73' });
assert.equal(inferEventCategory({ summary: 'BGMI' }).color, '#ef4444');

async function run() {
  let signedIn = false, deny = false, attempts = 0;
  const patches = [];
  const timed = { dateTime: '2026-11-18T20:00:00+05:30' };
  const movie = { id: 'movie', summary: 'Movie', start: timed };
  const route = load('app/api/calendar/auto-colorize/route.ts', {
    '@/lib/auth': { auth: async () => signedIn ? { user: { email: 'test@example.invalid' } } : null },
    '@/lib/google': { googleFetch: async (url, options) => {
      if (deny) return new Response('{}', { status: 403 });
      const parsed = new URL(url);
      if (parsed.pathname.endsWith('calendarList')) return Response.json(parsed.searchParams.has('pageToken') ? { items: [{ id: 'fourth', accessRole: 'writer' }] } : { items: ['one','two','three'].map(id => ({ id, accessRole: 'owner' })), nextPageToken: 'calendar-next' });
      if (options?.method === 'PATCH') {
        assert.deepEqual(Object.keys(JSON.parse(options.body)), ['colorId']);
        if (url.includes('/movie') && ++attempts === 1) return new Response('{}', { status: 429 });
        patches.push({ url, color: JSON.parse(options.body).colorId });
        return Response.json({});
      }
      if (parsed.pathname.includes('/one/')) return Response.json(parsed.searchParams.has('pageToken') ? { items: [movie, { id: 'series', summary: 'S02E01', start: timed }] } : { items: [movie, { id: 'already', summary: 'Movie', colorId: '4', start: timed }, { id: 'all-day', summary: 'Movie', start: { date: '2026-11-18' } }], nextPageToken: 'event-next' });
      return Response.json({ items: parsed.pathname.includes('/fourth/') ? [{ id: 'game', summary: 'Subway', start: timed }] : [] });
    } },
  });
  assert.equal((await route.POST()).status, 401);
  signedIn = true;
  const result = await (await route.POST()).json();
  assert.equal(result.success, true);
  assert.equal(result.updatedCount, 3);
  assert.equal(result.skippedCount, 1);
  assert.equal(attempts, 2, 'Throttled update should retry once');
  assert.equal(patches.filter(patch => patch.url.endsWith('/movie')).length, 1, 'Duplicate page item must not be recolored');
  assert.equal(patches.find(patch => patch.url.endsWith('/game')).color, '11', 'Calendars after the first three must be scanned');
  deny = true;
  const denied = await (await route.POST()).json();
  assert.equal(denied.success, false);
  assert.equal(denied.needsReauth, true);
  console.log('Passed: supplied Apps Script color mappings/keywords, local movie/game colors, safe title matching, authentication, pagination, deduplication, throttling retry, color-only patches, all-day exclusion, and partial-failure reporting.');
}
run().catch(error => { console.error(error); process.exitCode = 1; });
