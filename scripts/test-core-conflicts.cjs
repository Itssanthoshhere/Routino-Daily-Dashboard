const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
const cache={};function load(file,mocks){if(cache[file])return cache[file].exports;const m={exports:{}};cache[file]=m;new Function('require','module','exports',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText)(name=>mocks[name]||(name.startsWith('@/')?load(name.slice(2)+'.ts',mocks):require(name)),m,m.exports);return m.exports;}
async function main(){
 const original={tasks:[],notes:[{id:'n',title:'Original',content:'Keep me',updatedAt:1}],habits:[],quickLinks:[],customEvents:[],focusMinutes:45,soundEnabled:true,updatedAt:'old',futureField:{keep:true}};
 let stored=structuredClone(original),race=false,writes=0;
 const mocks={'next/server':{NextResponse:{json:(body,options={})=>({body,status:options.status||200})}},'@/lib/auth':{auth:async()=>({user:{email:'owner@example.test'}})},'@/lib/db':{getDatabaseStatus:()=>({configured:true}),getUserWorkspace:async()=>structuredClone(stored),saveUserWorkspace:async(email,value,fields,merge,revision)=>{assert.equal(email,'owner@example.test');if(race)stored.coreRevision=(stored.coreRevision||0)+1;if((stored.coreRevision||0)!==revision)return {success:false,conflict:true};stored={...stored,...Object.fromEntries(fields.filter(k=>value[k]!==undefined).map(k=>[k,value[k]])),coreRevision:revision+1};writes++;return {success:true,source:'mock'};}}};
 const api=load('app/api/user-data/route.ts',mocks);const post=body=>api.POST({json:async()=>({expectedAccount:"owner@example.test",...body})});
 const denied=await post({expectedAccount:"other@example.test",expectedCoreRevision:0,notes:[]});assert.equal(denied.status,409);assert.equal(writes,0);
 let result=await post({expectedCoreRevision:0,notes:[{...original.notes[0],content:'Device A'}]});assert.equal(result.status,200);assert.equal(stored.coreRevision,1);assert.deepEqual(stored.futureField,original.futureField);
 const before=structuredClone(stored);result=await post({expectedCoreRevision:0,notes:[{...original.notes[0],content:'Device B'}]});assert.equal(result.status,409);assert.deepEqual(stored,before);assert.equal(writes,1);
 result=await post({focusMinutes:90});assert.equal(result.status,409);assert.equal(writes,1);
 result=await post({expectedCoreRevision:1,notes:[{id:'bad'}]});assert.equal(result.status,400);assert.deepEqual(stored,before);
 race=true;result=await post({expectedCoreRevision:1,focusMinutes:90});assert.equal(result.status,409);assert.equal(stored.focusMinutes,45);race=false;
 result=await post({expectedCoreRevision:2,notes:[]});assert.equal(result.status,200);assert.deepEqual(stored.notes,[]);assert.equal(stored.focusMinutes,45);
 const beforeFocus=structuredClone(stored);
 const focus={id:'session-1',kind:'session',taskId:'task-1',taskTitle:'Focus test',minutes:25,completedAt:'2026-11-19T09:00:00Z'};
 result=await post({expectedCoreRevision:3,focusRecords:[focus]});assert.equal(result.status,200);assert.deepEqual(stored.focusRecords,[focus]);
 for(const field of Object.keys(beforeFocus).filter(k=>!['updatedAt','coreRevision'].includes(k)))assert.deepEqual(stored[field],beforeFocus[field],`Focus save preserved ${field}`);
 result=await post({expectedCoreRevision:4,soundEnabled:false});assert.equal(result.status,200);assert.deepEqual(stored.focusRecords,[focus],'Unrelated saves preserve focus history');
 const beforeBudget=structuredClone(stored);
 result=await post({expectedCoreRevision:5,subscriptionBudgets:[{id:'INR',monthlyLimit:1500}]});assert.equal(result.status,200);assert.deepEqual(stored.subscriptionBudgets,[{id:'INR',monthlyLimit:1500}]);
 for(const field of Object.keys(beforeBudget).filter(k=>!['updatedAt','coreRevision'].includes(k)))assert.deepEqual(stored[field],beforeBudget[field],`Budget save preserved ${field}`);
 const beforeLinks=structuredClone(stored);
 const referencedNote={...original.notes[0],references:[{kind:'task',id:'task-1',label:'Task title'}]};
 result=await post({expectedCoreRevision:6,notes:[referencedNote]});assert.equal(result.status,200);assert.deepEqual(stored.notes,[referencedNote]);
 for(const field of Object.keys(beforeLinks).filter(k=>!['notes','updatedAt','coreRevision'].includes(k)))assert.deepEqual(stored[field],beforeLinks[field],`Note link save preserved ${field}`);
 const beforePreferences=structuredClone(stored);
 result=await post({expectedCoreRevision:7,workspacePreferences:[{id:'display',textSize:'large',reduceMotion:true,contrast:'strong'}]});assert.equal(result.status,200);assert.equal(stored.workspacePreferences[0].textSize,'large');
 for(const field of Object.keys(beforePreferences).filter(k=>!['updatedAt','coreRevision'].includes(k)))assert.deepEqual(stored[field],beforePreferences[field],`Display save preserved ${field}`);
 assert.equal(original.notes[0].content,'Keep me');
 console.log('Passed: stale-device rejection, write-time race rejection, legacy-client protection, complete validation, explicit empty-array intent, authenticated ownership, and unrelated-field preservation.');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
