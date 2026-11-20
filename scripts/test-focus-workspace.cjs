const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
const cache={};function load(file){if(cache[file])return cache[file].exports;const m={exports:{}};cache[file]=m;new Function('require','module','exports',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText)(name=>name.startsWith('@/')?load(name.slice(2)+'.ts'):require(name),m,m.exports);return m.exports;}
const {defaultFocusPreferences:p,validFocusRecord,bufferedFocusEvents}=load('lib/focusWorkspace.ts');
const {findFocusSlots}=load('lib/focusSlots.ts');
const {hasFocusConflict}=load('lib/focusAvailability.ts');
const {workspaceValidationError}=load('lib/workspaceValidation.ts');
const {collectionDiff,mergeCollection}=load('lib/collectionChanges.ts');
const from=new Date(2026,10,19,7); // Thursday, local timezone
const preferences={...p,days:[4],start:'09:00',end:'12:00',bufferMinutes:15,breakMinutes:20};
assert(validFocusRecord(preferences));
for(const changes of [{days:[]},{days:[7]},{start:'12:00',end:'09:00'},{breakMinutes:NaN},{bufferMinutes:121}])assert(!validFocusRecord({...preferences,...changes}));
const event={id:'meeting',start:{dateTime:new Date(2026,10,19,10).toISOString()},end:{dateTime:new Date(2026,10,19,11).toISOString()}};
const original=JSON.stringify(event);
const slots=findFocusSlots([event],from,7,45,preferences);
assert.equal(slots.length,1);assert.equal(slots[0].start.getHours(),9);assert.equal(slots[0].end.getMinutes(),45);
assert.equal(JSON.stringify(event),original,'Buffering cannot edit a saved event');
assert.equal(findFocusSlots([],from,7,45,{...preferences,days:[5]}).every(s=>s.start.getDay()===5),true);
assert.equal(findFocusSlots([],from,7,0,preferences).length,0);
for (const minutes of [15, 30]) {
  const shortSlots = findFocusSlots([], from, 7, minutes, preferences);
  assert(shortSlots.length > 0);
  assert(shortSlots.every(slot => slot.minutes === minutes && slot.end - slot.start === minutes * 60000));
}
const blocks=bufferedFocusEvents([event],preferences);
assert.equal(hasFocusConflict(blocks,new Date(2026,10,19,9,44),new Date(2026,10,19,10),Intl.DateTimeFormat().resolvedOptions().timeZone),true);
assert.equal(hasFocusConflict(blocks,new Date(2026,10,19,11,19),new Date(2026,10,19,12),Intl.DateTimeFormat().resolvedOptions().timeZone),true);
assert.equal(findFocusSlots([{...event,start:{date:'2026-11-19'},end:{date:'2026-11-20'}}],from,1,45,preferences).length,0);
assert.deepEqual(bufferedFocusEvents([{...event,transparency:'transparent'}],preferences),[]);
const session={id:'completed-1',kind:'session',taskId:'original-task',taskTitle:'Original title',minutes:25,completedAt:from.toISOString()};
assert.equal(workspaceValidationError({focusRecords:[preferences,session]}),null);
assert.match(workspaceValidationError({focusRecords:[session,session]}),/Invalid focusRecords/);
assert.match(workspaceValidationError({focusRecords:[{...session,minutes:0}]}),/Invalid focusRecords/);
const remote={...session,id:'remote-session'};
const merged=mergeCollection([remote],[session],collectionDiff([], [session]));
assert.equal(merged.length,2);assert.equal(mergeCollection(merged,[session],collectionDiff([], [session])).length,2,'Retry preserves unique completion identity');
console.log('Passed: local working days/hours, break and travel boundaries, all-day blocks, transparent events, immutable source events, session validation/idempotency and unrelated-device history preservation.');
async function checkServerBuffers(){
 const requests=[];
 const mocks={
  '@/lib/google':{googleFetch:async url=>{requests.push(url);return Response.json(url.includes('calendarList')?{items:[]}:{items:[event]});}},
  '@/lib/db':{getUserWorkspace:async()=>({focusRecords:[preferences],customEvents:[]}),getOutlookAccount:async()=>null},
  '@/lib/outlook':{}
 };
 const module={exports:{}};
 new Function('require','module','exports',ts.transpileModule(fs.readFileSync('lib/recheckFocus.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(name=>mocks[name]||(name.startsWith('@/')?load(name.slice(2)+'.ts'):require(name)),module,module.exports);
 assert.equal(await module.exports.recheckFocus('test@example.test',new Date(2026,10,19,9,30),new Date(2026,10,19,9,46),Intl.DateTimeFormat().resolvedOptions().timeZone),false,'Server rejects a slot inside the preparation buffer');
 const query=new URL(requests.find(url=>url.includes('/events?')));
 assert.equal(query.searchParams.get('timeMin'),new Date(2026,10,19,9,10).toISOString());
 assert.equal(query.searchParams.get('timeMax'),new Date(2026,10,19,10,1).toISOString());
 console.log('Passed: server recheck expands calendar queries and rejects saved travel-buffer conflicts. Provider calls mocked.');
}
checkServerBuffers().catch(error=>{console.error(error);process.exitCode=1;});
