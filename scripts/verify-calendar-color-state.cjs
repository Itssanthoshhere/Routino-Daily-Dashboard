const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
const{randomUUID}=require('node:crypto');const{neon}=require('@neondatabase/serverless');
require('@next/env').loadEnvConfig(process.cwd(),true);
if(!process.env.DATABASE_URL&&fs.existsSync('.env.database.local'))process.env.DATABASE_URL=JSON.parse(fs.readFileSync('.env.database.local','utf8').match(/^DATABASE_URL=(.+)$/m)[1]);
function load(file){const module={exports:{}};new Function('require','module','exports',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText)(name=>name.startsWith('@/')?load(`${name.slice(2)}.ts`):require(name),module,module.exports);return module.exports;}
async function run(){
 assert.ok(process.env.DATABASE_URL,'Configure DATABASE_URL');
 const a=neon(process.env.DATABASE_URL),b=neon(process.env.DATABASE_URL),email=`calendar-colors-test-${randomUUID()}@example.invalid`;
 const db=load('lib/db.ts'),{emptyColorState}=load('lib/calendarColorSettings.ts');
 const fixture={tasks:[{id:'preserve-task'}],notes:[{id:'preserve-note'}],habits:[],customEvents:[],quickLinks:[],focusMinutes:25,soundEnabled:false,trackerRevision:7};
 try{
  await a`INSERT INTO routino_workspaces (email,data) VALUES (${email},${JSON.stringify(fixture)}::jsonb)`;
  let state=emptyColorState();state.settings.excludedEvents=['primary:test'];
  const first=await db.saveCalendarColorState(email,state,0);assert.equal(first.revision,1);
  assert.equal(await db.saveCalendarColorState(email,state,0),null,'Stale color state rejected');
  assert.equal((await db.saveTrackerWorkspace(email,{assetDocuments:{}},7)).success,true);
  const results=await Promise.all([db.saveCalendarColorState(email,{...first,settings:{...first.settings,excludedEvents:['primary:a']}},1),db.saveCalendarColorState(email,{...first,settings:{...first.settings,excludedEvents:['primary:b']}},1)]);
  assert.equal(results.filter(Boolean).length,1,'One concurrent color save must win');
  await db.saveUserWorkspace(email,{...fixture,focusMinutes:30},['focusMinutes']);
  const[row]=await b`SELECT data FROM routino_workspaces WHERE email=${email}`;
  assert.equal(row.data.calendarColorState.revision,2);assert.equal(row.data.trackerRevision,8);assert.equal(row.data.focusMinutes,30);
  assert.deepEqual(row.data.tasks,fixture.tasks);assert.deepEqual(row.data.notes,fixture.notes);
  assert.deepEqual(row.data.assetDocuments,{});
  const backups=load('lib/workspaceBackups.ts');
  const snapshot=await backups.backupWorkspace(email,'manual');
  const changed=await db.saveCalendarColorState(email,{...row.data.calendarColorState,pendingRunId:'interrupted',operationStartedAt:new Date().toISOString()},2);
  assert.equal(changed.revision,3);
  const[beforeRestore]=await b`SELECT data FROM routino_workspaces WHERE email=${email}`;
  const restored=await backups.restoreWorkspaceBackup(email,snapshot,beforeRestore.data.updatedAt);
  assert.equal(restored.success,true);
  assert.equal(restored.data.calendarColorState.revision,4,'Restore must advance the calendar revision');
  assert.equal(restored.data.calendarColorState.pendingRunId,undefined,'Restore cannot revive a stale operation lock');
  assert.equal(await db.saveCalendarColorState(email,changed,3),null,'A pre-restore tab must not overwrite restored rules');
  console.log('Passed: independent color-state reads, stale/concurrent save rejection, and preservation of tracker revisions, tasks, notes, and unrelated saves.');
 }finally{await a`DELETE FROM routino_workspace_backups WHERE email=${email}`;await a`DELETE FROM routino_workspaces WHERE email=${email}`;console.log('Removed only disposable calendar-color test data and snapshots.');}
}
run().catch(()=>{console.error('Calendar color-state verification failed. Existing user records were not targeted.');process.exitCode=1;});
