const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
const cache={};function load(file,stubs={}) {if(stubs[file])return stubs[file]; if(cache[file])return cache[file].exports;const m={exports:{}};cache[file]=m;new Function('require','module','exports',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText)(name=>name.startsWith('@/')?load(name.slice(2)+'.ts',stubs):stubs[name]||require(name),m,m.exports);return m.exports;}
async function main(){
 const {taskDueDay,localDay,calendarStart}=load('lib/taskDates.ts');
 const today=localDay(new Date(2026,10,18,16));assert.equal(taskDueDay('2026-11-18T16:00'),today);assert.equal(taskDueDay('2026-11-18'),'2026-11-18');assert.equal(taskDueDay('bad'),undefined);assert.equal(calendarStart({date:'2026-11-18'}).getDate(),18);
 const {workspaceValidationError:validate}=load('lib/workspaceValidation.ts');
 const task={id:'1',title:'Write report',meta:'Work',priority:false,checked:false,createdAt:1};
 assert.equal(validate({tasks:[task]}),null);assert.match(validate({tasks:[{id:'1'}]}),/Invalid tasks/);assert.match(validate({tasks:[task,task]}),/Invalid tasks/);assert.match(validate({notes:[{id:'n',title:'N',content:42,updatedAt:1}]}),/Invalid notes/);assert.match(validate({habits:[{id:'h',name:'Habit',streak:1,completedDates:['2026-02-30']}]}),/Invalid habits/);assert.match(validate({quickLinks:[{id:'l',title:'L',subtitle:'',url:'javascript:alert(1)',iconName:'link',available:true}]}),/Invalid quickLinks/);assert.equal(validate({notes:[],tasks:[],habits:[],customEvents:[],quickLinks:[]}),null);assert.match(validate({focusMinutes:NaN}),/Invalid focusMinutes/);
 const {calendarPages}=load('lib/calendarPages.ts');let requested=[];
 const pages=await calendarPages('https://www.googleapis.com/events',async url=>{requested.push(url);return Response.json(requested.length===1?{items:[{id:'1'}],nextPageToken:'next'}:{items:[{id:'2'}]});},'google');assert.equal(pages.length,2);assert.match(requested[1],/pageToken=next/);
 requested=[];const graph=await calendarPages('https://graph.microsoft.com/v1.0/me/calendarView',async url=>{requested.push(url);return Response.json(requested.length===1?{value:[1],'@odata.nextLink':'https://graph.microsoft.com/next'}:{value:[2]});},'outlook');assert.deepEqual(graph,[1,2]);
 await assert.rejects(calendarPages('https://graph.microsoft.com/start',async()=>Response.json({value:[],'@odata.nextLink':'https://attacker.invalid/steal'}),'outlook'),/Invalid calendar/);
 await assert.rejects(calendarPages('https://graph.microsoft.com/start',async()=>Response.json({value:[],'@odata.nextLink':'https://graph.microsoft.com/start'}),'outlook'),/incomplete/);
 await assert.rejects(calendarPages('https://www.googleapis.com/events',async()=>new Response('',{status:503}),'google'),/HTTP 503/);
 const {hasFocusConflict}=load('lib/focusAvailability.ts');const start=new Date('2026-11-18T10:00:00+05:30'),end=new Date('2026-11-18T11:00:00+05:30');
 assert.equal(hasFocusConflict([{id:'all',start:{date:'2026-11-18'},end:{date:'2026-11-19'}}],start,end,'Asia/Kolkata'),true);
 assert.equal(hasFocusConflict([{id:'time',start:{dateTime:'2026-11-18T11:00:00+05:30'},end:{dateTime:'2026-11-18T12:00:00+05:30'}}],start,end,'Asia/Kolkata'),false);
 assert.equal(hasFocusConflict([{id:'free',transparency:'transparent',start:{date:'2026-11-18'},end:{date:'2026-11-19'}}],start,end,'Asia/Kolkata'),false);
 const {validTaskTemplates,templateSubtasks}=load('lib/taskTemplates.ts');const template={id:'t',name:'Bill',title:'Pay bill',category:'personal',priority:false,steps:['Check','Pay']};assert.equal(validTaskTemplates([template]),true);const a=templateSubtasks(template),b=templateSubtasks(template);assert.notEqual(a[0].id,b[0].id);assert.equal(a[0].completed,false);assert.equal(validate({taskTemplates:[template]}),null);
 console.log('Passed: timed deadlines, local all-day dates, complete record validation, pagination/failure guards, focus conflicts, and fresh template checklists.');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
