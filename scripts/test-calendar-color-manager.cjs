const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
function load(file,mocks={}){const module={exports:{}};new Function('require','module','exports','setTimeout',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText)(name=>name in mocks?mocks[name]:name.startsWith('@/')?load(`${name.slice(2)}.ts`,mocks):require(name),module,module.exports,callback=>{callback();return 0;});return module.exports;}
const {defaultColorSettings,validColorSettings,matchColorRule}=load('lib/calendarColorSettings.ts');
const settings=defaultColorSettings();
assert.equal(validColorSettings(settings),true);
assert.equal(validColorSettings({...settings,rules:[{...settings.rules[0],colorId:'99'}]}),false);
assert.equal(validColorSettings({...settings,rules:[{...settings.rules[0],colorId:4}]}),false);
assert.equal(validColorSettings({...settings,excludedEventNames:{unknown:'Example'}}),false);
assert.equal(validColorSettings({...settings,rules:[settings.rules[0],settings.rules[0]]}),false);
assert.equal(matchColorRule('Superbase and MongoDB',settings),undefined);
assert.equal(matchColorRule('S05E02',settings).colorId,'4');
assert.equal(matchColorRule('Unmatched title',{...settings,rules:[{...settings.rules[0],keywords:['  ']}]}),undefined);
assert.equal(matchColorRule('Movie',{...settings,rules:[{...settings.rules[0],keywords:[' movie ']}]}).colorId,'4');
const {validColorRange}=load('lib/calendarColorService.ts',{'@/lib/google':{}});
assert.equal(validColorRange({timeMin:'invalid',timeMax:'2026-11-20'}),false);
assert.equal(validColorRange({timeMin:'2026-01-01',timeMax:'2030-01-01'}),false);
async function run(){
 let email=null,state,patches=0,eventReads=0,calendarReads=0;
 const event={id:'movie',summary:'TEST Movie',etag:'v1',start:{dateTime:'2026-11-19T10:00:00Z'}};
 const raw=()=>JSON.parse(JSON.stringify(event));
 const google={googleFetch:async(url,options)=>{
   const parsed=new URL(url);
   if(parsed.pathname.endsWith('calendarList')){calendarReads++;return Response.json({items:[{id:'primary',summary:'Main calendar',accessRole:'owner'}]});}
   if(options?.method==='PATCH'){
     assert.deepEqual(Object.keys(JSON.parse(options.body)),['colorId']);
     if(options.headers['If-Match']!==event.etag)return new Response('{}',{status:412});
     patches++; const color=JSON.parse(options.body).colorId; if(color===null)delete event.colorId;else event.colorId=color;
     event.etag=`v${Number(event.etag.slice(1))+1}`;
     return Response.json(raw());
   }
   eventReads++;
   return Response.json(parsed.searchParams.has('pageToken')?{items:[raw(),{id:'all-day',summary:'Movie',etag:'a',start:{date:'2026-11-19'}}]}:{items:[raw()],nextPageToken:'page2'});
 }};
 const route=load('app/api/calendar/coloring/route.ts',{
   '@/lib/auth':{auth:async()=>email?{user:{email}}:null},
   '@/lib/google':google,
   '@/lib/workspaceBackups':{backupWorkspace:async()=>{}},
   '@/lib/db':{getDatabaseStatus:()=>({configured:true}),getUserWorkspace:async()=>({calendarColorState:state}),saveCalendarColorState:async(owner,next,revision)=>{assert.equal(owner,email);if((state?.revision||0)!==revision)return null;state=JSON.parse(JSON.stringify({...next,revision:revision+1}));return state;}}
 });
 const range={timeMin:'2026-11-18T00:00:00Z',timeMax:'2026-11-20T00:00:00Z'};
 const post=async(body)=>{const response=await route.POST(new Request('https://example.invalid/api/calendar/coloring',{method:'POST',body:JSON.stringify(body)}));return {status:response.status,...await response.json()};};
 assert.equal((await route.GET(new Request('https://example.invalid/api/calendar/coloring'))).status,401);
 email='test@example.invalid';
 assert.equal((await route.GET(new Request('https://example.invalid/api/calendar/coloring'))).status,200);
 const listCount=calendarReads;
 const legend=await route.GET(new Request('https://example.invalid/api/calendar/coloring?settingsOnly=1'));
 assert.equal(legend.status,200);const legendData=await legend.json();assert.deepEqual(legendData.settings,settings);assert.equal(legendData.revision,0);assert.equal(calendarReads,listCount,'Legend reads must not scan Google calendars');
 let preview=await post({mode:'preview',revision:0,settings,range});
 assert.equal(preview.preview.changes.length,1,'Pages are deduplicated and all-day events skipped');
 assert.equal(patches,0,'Preview must not write Google');assert.equal(state,undefined,'Preview must not write account settings');
 assert.equal((await post({mode:'apply',revision:0,settings,range,hash:preview.preview.hash,selectedKeys:['other:event']})).status,400);
 assert.equal(patches,0,'An arbitrary event ID cannot be applied');
 event.etag='v2';
 let applied=await post({mode:'apply',revision:0,settings,range,hash:preview.preview.hash,selectedKeys:['primary:movie']});
 assert.equal(applied.status,409);assert.equal(patches,0,'Changed events must invalidate preview');
 preview=await post({mode:'preview',revision:0,settings,range});
 applied=await post({mode:'apply',revision:0,settings,range,hash:preview.preview.hash,selectedKeys:['primary:movie']});
 assert.equal(applied.status,200);assert.equal(event.colorId,'4');assert.equal(state.runs[0].changes[0].status,'applied');assert.equal(state.pendingRunId,undefined);
 assert.equal((await post({mode:'save',revision:0,settings})).status,409,'Stale settings must be rejected');
 let undone=await post({mode:'undo',revision:state.revision,runId:state.runs[0].id});
 assert.equal(undone.status,200);assert.equal(event.colorId,undefined,'Undo restores inherited calendar color with null');assert.equal(state.runs[0].changes[0].status,'undone');
 preview=await post({mode:'preview',revision:state.revision,settings,range});
 await post({mode:'apply',revision:state.revision,settings,range,hash:preview.preview.hash,selectedKeys:['primary:movie']});
 event.etag='v99';event.summary='User edited movie title';
 undone=await post({mode:'undo',revision:state.revision,runId:state.runs[0].id});
 assert.equal(undone.status,200);assert.equal(event.colorId,'4');assert.equal(event.summary,'User edited movie title');assert.equal(state.runs[0].changes[0].status,'conflict','Undo must preserve newer edits');
 event.colorId=undefined;
 preview=await post({mode:'preview',revision:state.revision,settings:{...settings,excludedEvents:['primary:movie']},range});assert.equal(preview.preview.changes.length,0);
 const reads=eventReads;
 preview=await post({mode:'preview',revision:state.revision,settings:{...settings,excludedCalendars:['primary']},range});assert.equal(preview.preview.changes.length,0);assert.equal(reads,eventReads,'Excluded calendars must not be scanned');
 const changed=JSON.parse(JSON.stringify(settings));changed.rules[0].colorId='7';
 const saved=await post({mode:'save',revision:state.revision,settings:changed});assert.equal(saved.status,200);assert.equal(state.settings.rules[0].colorId,'7');assert.equal(event.colorId,undefined,'Saving rules must not recolor events');
 const priorPatches=patches;
 const interrupted={id:'interrupted',createdAt:new Date().toISOString(),status:'applying',changes:[{key:'primary:pending',status:'pending'}]};
 state={...state,pendingRunId:interrupted.id,operationStartedAt:new Date().toISOString(),runs:[interrupted,...state.runs]};
 assert.equal((await post({mode:'recover',revision:state.revision})).status,409,'A running operation cannot be released early');
 state.operationStartedAt=new Date(Date.now()-180000).toISOString();
 assert.equal((await post({mode:'recover',revision:state.revision})).status,200);
 assert.equal(state.runs[0].changes[0].status,'uncertain');assert.equal(state.pendingRunId,undefined);assert.equal(patches,priorPatches,'Recovery must not guess or revert event colors');
 let attempts=0;
 const retry=load('lib/calendarColorService.ts',{'@/lib/google':{googleFetch:async(url,options)=>{assert.equal(options.headers['If-Match'],'test-version');attempts++;return attempts===1?new Response('{}',{status:429}):Response.json({etag:'new-version'});}}});
 assert.equal((await retry.patchCalendarColor({etag:'test-version',calendarId:'primary',eventId:'test',after:'4'})).status,'applied');assert.equal(attempts,2);
 console.log('Passed: editable rules, range limits, account authorization, read-only previews, pagination/deduplication, stale-preview rejection, selective apply, version-safe Undo/default-color restore, saved exclusions, independent revisions, and non-writing rule saves.');
}
run().catch(error=>{console.error(error);process.exitCode=1;});
