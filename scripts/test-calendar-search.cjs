const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
function load(file){const module={exports:{}};new Function('require','module','exports',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText)(name=>name.startsWith('@/')?load(`${name.slice(2)}.ts`):require(name),module,module.exports);return module.exports;}
const {searchCalendarEvents,calendarSearchDateLabel}=load('lib/calendarSearch.ts');
const events=[
 {id:'future',summary:'Movie night',start:{dateTime:new Date(2026,10,20,20).toISOString()},tag:'ENTERTAINMENT'},
 {id:'past',summary:'The Fantastic Four Movie',start:{dateTime:new Date(2026,10,4,20).toISOString()},tag:'ENTERTAINMENT'},
 {id:'all-day',summary:'Holiday',start:{date:'2026-11-18'}},
 {id:'work',summary:'Project review',start:{dateTime:new Date(2026,10,18,11).toISOString()},tag:'PROJECT'},
 {id:'accent',summary:'Café catch-up',start:{date:'2026-11-19'}},
 {id:'invalid',summary:'Unscheduled movie',start:{date:'2026-02-30'},tag:'ENTERTAINMENT'},
];
const original=JSON.stringify(events);
assert.deepEqual(searchCalendarEvents(events,'fantastic four').map(e=>e.id),['past'],'Older loaded dates must be searchable beyond the current week');
assert.deepEqual(searchCalendarEvents(events,'Entertainment November 2026').map(e=>e.id),['past','future']);
assert.deepEqual(searchCalendarEvents(events,'2026-11-18').map(e=>e.id),['all-day','work']);
assert.deepEqual(searchCalendarEvents(events,'18/11/2026').map(e=>e.id),['all-day','work']);
assert.deepEqual(searchCalendarEvents(events,'Project 18 Nov').map(e=>e.id),['work']);
assert.deepEqual(searchCalendarEvents(events,'cafe').map(e=>e.id),['accent']);
assert.equal(searchCalendarEvents([{id:'banana',summary:'MF360 Fund Disclosure',tag:'BANANA'}],'work').length,1,'Work search includes Banana work sessions');
assert.deepEqual(searchCalendarEvents(events,'[invalid]').map(e=>e.id),[],'Queries are literal text, not executable regex');
assert.deepEqual(searchCalendarEvents(events,'  '),[]);
assert.match(calendarSearchDateLabel(events[2]),/Nov.*18.*2026/);
assert.match(calendarSearchDateLabel(events[2]),/All day/);
assert.equal(calendarSearchDateLabel(events[5]),'Date unavailable');
assert.equal(JSON.stringify(events),original,'Search must never mutate saved events');
console.log('Passed: historical loaded-event search, title/category/date tokens, date formats, accent matching, all-day timezone handling, invalid dates, literal queries, ordering, and source preservation.');
