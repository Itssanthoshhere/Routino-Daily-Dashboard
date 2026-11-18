const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
const cache={};function load(file){if(cache[file])return cache[file].exports;const m={exports:{}};cache[file]=m;new Function('require','module','exports',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText)(name=>name.startsWith('@/')?load(name.slice(2)+'.ts'):require(name),m,m.exports);return m.exports;}
const {collectionDiff,mergeCollection}=load('lib/collectionChanges.ts'),{queueWorkspacePatch}=load('lib/workspacePatch.ts');
const baseline=[{id:'a',title:'A'},{id:'b',title:'B'}];
const local=[{id:'a',title:'Edited A'},baseline[1]];
const change=collectionDiff(baseline,local);assert.deepEqual(change.replaceIds,['a']);
const cloud=[baseline[0],{id:'b',title:'Edited on other device'},{id:'remote',title:'New remote record'}];
assert.deepEqual(mergeCollection(cloud,local,change),[local[0],cloud[1],cloud[2]]);
const reordered=[baseline[1],baseline[0]],order=collectionDiff(baseline,reordered);assert.deepEqual(mergeCollection(cloud,reordered,order).map(row=>row.id),['b','a','remote']);
const first={notes:local,collectionChanges:{notes:change}},second={notes:[local[0],{id:'b',title:'Second edit'}],collectionChanges:{notes:collectionDiff(local,[local[0],{id:'b',title:'Second edit'}])}};
const queued=queueWorkspacePatch(first,second);assert.deepEqual(queued.collectionChanges.notes.replaceIds,['a','b']);assert.equal(queued.notes.find(row=>row.id==='a').title,'Edited A');
const removed=queueWorkspacePatch(queued,{notes:[],collectionChanges:{notes:{replaceIds:[],deletedIds:['a','b'],orderIds:[]}}});assert.deepEqual(removed.notes,[]);assert.deepEqual(removed.collectionChanges.notes.deletedIds,['a','b']);
assert.equal(baseline[0].title,'A');
console.log('Passed: per-record diffs, unrelated remote-record preservation, note/link reorder preservation, accumulated offline changes, and explicit deletions.');
