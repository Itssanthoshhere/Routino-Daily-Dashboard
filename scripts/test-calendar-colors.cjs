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
  let signedIn=false;
  const legacy=load('app/api/calendar/auto-colorize/route.ts',{'@/lib/auth':{auth:async()=>signedIn?{user:{email:'test@example.invalid'}}:null}});
  assert.equal((await legacy.POST()).status,401);
  signedIn=true;
  assert.equal((await legacy.POST()).status,409,'Older tabs must not bypass preview and exclusions');
  console.log('Passed: supplied color mappings and keywords, safe matching, local movie/game colors, and legacy auto-write prevention.');
}
run().catch(error=>{console.error(error);process.exitCode=1;});
