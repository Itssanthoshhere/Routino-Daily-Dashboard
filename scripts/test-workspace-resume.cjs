const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
function load(file) {
  const module = { exports: {} };
  new Function('module', 'exports', ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText)(module, module.exports);
  return module.exports;
}
const { readWorkspacePosition: read, mayResumeSection: resume, resumeScroll: scroll } = load('lib/workspaceResume.ts');
const position = { section: 'Trackers', tracker: 'expenses', scrollY: 1200 };
assert.deepEqual(read(JSON.stringify(position)), position);
for (const invalid of [null, '{', '{}', JSON.stringify({ ...position, section: 'Unknown' }), JSON.stringify({ ...position, tracker: 'delete' }), JSON.stringify({ ...position, scrollY: -1 }), JSON.stringify({ ...position, scrollY: '1200' }), JSON.stringify({ ...position, scrollY: 1e12 })]) assert.equal(read(invalid), null);
assert(resume('', ''));
for (const query of ['?tab=notes', '?action=capture', '?action=focus', '?setup=google']) assert.equal(resume(query, ''), false);
assert.equal(resume('', '#expense-transactions'), false);
assert.equal(scroll(position, position, '?tab=trackers&sub=expenses', ''), 1200);
assert.equal(scroll(position, { ...position, tracker: 'airtel' }, '?tab=trackers&sub=airtel', ''), null);
assert.equal(scroll(position, { ...position, section: 'Notes' }, '?tab=notes', ''), null);
assert.equal(scroll(position, position, '?action=capture', ''), null);
assert.equal(scroll(position, position, '', '#target'), null);
const { accountStorageKey } = load('lib/accountStorage.ts');
assert.notEqual(accountStorageKey('routino_workspace_position', 'a@example.com'), accountStorageKey('routino_workspace_position', 'b@example.com'));
assert.notEqual(accountStorageKey('routino_workspace_position', null), accountStorageKey('routino_workspace_position', 'a@example.com'));
console.log('Passed: validated resume records, explicit-link and shortcut priority, tracker-specific scroll matching, invalid storage recovery and account/device isolation.');
