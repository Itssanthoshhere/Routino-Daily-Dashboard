const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
function loader(mocks){const cache={};return function load(file){if(cache[file])return cache[file].exports;const m={exports:{}};cache[file]=m;new Function('require','module','exports',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText)(name=>mocks[name]||(name.startsWith('@/')?load(name.slice(2)+'.ts'):require(name)),m,m.exports);return m.exports;};}
async function main(){let live=[],backups=[],fail=false,deleted=[];const old=process.env.DATABASE_URL;process.env.DATABASE_URL='mock-only';try{
 const sql=async parts=>{if(fail)throw new Error('unavailable');return parts.join('').includes('workspace_backups')?backups:live;};let blobs=[];
 const load=loader({'@neondatabase/serverless':{neon:()=>sql},'@vercel/blob':{list:async()=>({blobs,hasMore:false}),del:async paths=>{deleted.push(...paths);}}});
 const {documentPath}=load('lib/subscriptionDocuments.ts'),{unusedDocuments,removeUnusedDocuments,documentReferences}=load('lib/documentLifecycle.ts');
 const email='owner@example.test',used=documentPath(email),recycled=documentPath(email),backup=documentPath(email),unused=documentPath(email),fresh=documentPath(email),foreign=documentPath('other@example.test');
 const blob=(pathname,days)=>({pathname,size:123,uploadedAt:new Date(Date.now()-days*86400000)});blobs=[blob(used,7300),blob(recycled,100),blob(backup,100),blob(unused,100),blob(fresh,5),blob(foreign,100)];
 live=[{data:{assetDocuments:{macbook:[{pathname:used}]},documents:[],recycleBin:[{record:{documents:[{pathname:recycled}]}}]}}];backups=[{data:{old:[{pathname:backup}]}}];
 assert.deepEqual((await unusedDocuments(email)).map(file=>file.pathname),[unused],'A referenced asset upload remains protected even after 20 years without reads');assert.equal(documentReferences(live).has(recycled),true);
 await assert.rejects(removeUnusedDocuments(email,[used]),/references changed/);assert.deepEqual(deleted,[]);
 live[0].data.documents.push({pathname:unused});await assert.rejects(removeUnusedDocuments(email,[unused]),/references changed/);assert.deepEqual(deleted,[]);
 live[0].data.documents.pop();assert.equal(await removeUnusedDocuments(email,[unused]),1);assert.deepEqual(deleted,[unused]);
 fail=true;await assert.rejects(unusedDocuments(email),/unavailable/);assert.equal(deleted.length,1);
 console.log('Passed: 20-year inactive asset retention, live/recycled/backup reference protection, 75-day grace, account isolation, recheck before deletion, and fail-closed retention review. All storage calls were mocked.');
 }finally{if(old===undefined)delete process.env.DATABASE_URL;else process.env.DATABASE_URL=old;}}
main().catch(e=>{console.error(e);process.exitCode=1;});
