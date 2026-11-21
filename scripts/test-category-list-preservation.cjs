const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
const cache={};function load(file){if(cache[file])return cache[file].exports;const module={exports:{}};cache[file]=module;new Function('require','module','exports',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText)(name=>name.startsWith('@/')?load(name.slice(2)+'.ts'):require(name),module,module.exports);return module.exports;}
const audit=load('lib/timeAudit.ts'),{DEFAULT_TIME_AUDIT_CATEGORIES:required,combineTimeAuditCategories:combine}=audit;
const snapshot=JSON.stringify(required);
for(const [title,category,keyword] of [['Building Routino','study_work','routino'],['BGMI with friends','social','bgmi'],['An unmatched activity','other',null]]) {
  const preview=audit.previewCategoryMatch(title,required);
  assert.equal(preview.category.id,category);assert.equal(preview.keyword,keyword);
  assert.equal(audit.categorizeEventTitle(title,required).id,category);
}
const draft=required.map(c=>({...c,keys:c.id==='other'?c.keys:['custom activity',...c.keys]}));
assert.equal(audit.previewCategoryMatch('Custom activity',draft).category.id,'sleep');
assert.equal(JSON.stringify(required),snapshot,'Previews never mutate rules');
assert.deepEqual(required.map(c=>[c.name,c.keys.length]),[['Sleep',3],['Typing / Journaling',3],['Social Media',15],['Study / Work',27],['Entertainment',7],['Daily Routine',24],['Travel / Outings',15],['Games / Gaming',18],['Other',0]]);
const local=required.map(c=>({...c,keys:c.keys.filter(k=>!['routino','building','candy crush'].includes(k))}));local[0].keys.push('my custom sleep');local[0].color='#123456';local.splice(2,0,{id:'custom',name:'Custom',color:'#fff',keys:['keep me']});
const before=JSON.stringify(local),merged=combine(local);assert.equal(JSON.stringify(local),before);assert.deepEqual(merged.map(c=>c.id),local.map(c=>c.id));assert.equal(merged[0].color,'#123456');assert(merged[0].keys.includes('my custom sleep'));assert.deepEqual(merged.find(c=>c.id==='custom').keys,['keep me']);
for(const category of required)for(const keyword of category.keys)assert(merged.find(c=>c.id===category.id).keys.includes(keyword),`${category.name}: ${keyword}`);
assert(merged.find(c=>c.id==='social').keys.includes('candy crush'));assert(merged.find(c=>c.id==='gaming').keys.includes('candy crush'));assert.deepEqual(combine(merged),merged);
for(const keyword of ['c++','[','a.b']) {
  const literalRules=[{id:'literal',name:'Literal',color:'#fff',keys:[keyword]},{id:'other',name:'Other',color:'#000',keys:[]}];
  assert.equal(audit.categorizeEventTitle(`Learn ${keyword} today`,literalRules).id,'literal');
  assert.equal(audit.categorizeEventTitle('Unrelated acb today',literalRules).id,'other');
}
const descriptors={window:Object.getOwnPropertyDescriptor(global,'window'),localStorage:Object.getOwnPropertyDescriptor(global,'localStorage')};
try{const values=new Map();Object.defineProperty(global,'window',{configurable:true,value:new EventTarget()});Object.defineProperty(global,'localStorage',{configurable:true,value:{getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v)}});const key='routino_time_audit_categories_v2:account:owner@test';values.set(key,before);const loaded=audit.loadSavedCategories('owner@test');assert.deepEqual(loaded,merged);assert.equal(values.get(`${key}:combined-lists-v1:original`),before);assert.equal(values.get(key),JSON.stringify(merged));const edited=merged.map(c=>({...c,keys:c.keys.filter(k=>k!=='building')}));audit.saveCategories(edited,'owner@test');assert.deepEqual(audit.loadSavedCategories('owner@test'),edited,'Explicit later edits are not forcibly overwritten');assert.equal(values.get(`${key}:combined-lists-v1:original`),before);
values.delete(`${key}:combined-lists-v1`);values.set(key,before);global.localStorage.setItem=()=>{throw Object.assign(new Error('full'),{name:'QuotaExceededError'});};assert.deepEqual(audit.loadSavedCategories('owner@test'),merged);assert.equal(values.get(key),before,'Failed migration retains original storage');
}finally{for(const [key,descriptor] of Object.entries(descriptors))if(descriptor)Object.defineProperty(global,key,descriptor);else delete global[key];}
console.log('Passed: exact combined list counts, cross-category duplicates, custom keys/colours/order, immutable idempotent union, original backup retention, one-time migration and explicit later edits. Browser storage mocked.');
