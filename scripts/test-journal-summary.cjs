const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
const moduleValue={exports:{}};new Function('require','module','exports',ts.transpileModule(fs.readFileSync('lib/journalSummary.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText)(require,moduleValue,moduleValue.exports);
const {parseJournalSummaryRows,journalReconciliation}=moduleValue.exports;
const rows=values=>values.map(row=>({c:row.map(value=>value===null?null:{v:value})}));
const fixture=rows([['SUM of Amount',null,'Month'],['Category','Item',1,2,'Grand Total'],['Food','Lunch',10,20,30],['Food Total',null,10,20,30],['Grand Total',null,10,20,30],[],['SUM of Income',null,'Month'],['Category','Item',1,2,'Grand Total'],['Grand Total',null,100,200,300]]);
const before=JSON.stringify(fixture);const summary=parseJournalSummaryRows(fixture,'Year Summary');assert.equal(summary.totalSpent,30);assert.deepEqual(summary.months,[{month:1,amount:10},{month:2,amount:20}]);assert.deepEqual(summary.categoryTotals,[{category:'Food',amount:30}]);assert.equal(JSON.stringify(fixture),before);
assert.equal(parseJournalSummaryRows(undefined,'Missing'),undefined);assert.equal(parseJournalSummaryRows(rows([['Grand Total',30]]),'Incomplete'),undefined);
const zero=parseJournalSummaryRows(rows([['Category','Item',1,'Grand Total'],['Grand Total',null,0,0]]),'Empty');assert.equal(zero.totalSpent,0);
const journal={totalSpent:230,sheetSummary:summary,expenses:[{category:'Food',amount:30},{category:'College Fees',amount:200}]};assert.deepEqual(journalReconciliation(journal),{difference:200,outsideCategories:[{category:'College Fees',amount:200}]});assert.equal(journalReconciliation({...journal,sheetSummary:undefined}),null);
console.log('Passed: first spending pivot selection, later income/other pivot exclusion, no subtotal double count, monthly totals, zero/missing summary distinction and reconciliation without source changes.');

const typed=rows([["Category","Item",1,2,null],["Grand Total",null,10,20,30]]);assert.equal(parseJournalSummaryRows(typed,"GViz numeric headers").totalSpent,30);assert.equal(parseJournalSummaryRows(rows([["Category","Item",1,2,null],["Grand Total",null,10,20,999]]),"Mismatched"),undefined);

assert.deepEqual(journalReconciliation({...journal,sheetSummary:{...summary,categoryTotals:[]}}),{difference:200,outsideCategories:[]},"Do not infer excluded categories when the pivot has no category subtotals");
