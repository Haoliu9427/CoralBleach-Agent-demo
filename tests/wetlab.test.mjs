import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {defaults,validateDesign,simulateWet,wetSummary,WET_POOL,WetTools,wetRule,wetAgent,wetMetrics} from '../dist/wetlab-engine.js';
const design=()=>({groups:defaults(),seed:42,replicates:12});
test('wet simulation is deterministic, uses independent tank splits and responds to treatment edits',()=>{
 const a=simulateWet(design());assert.deepEqual(a,simulateWet(design()));assert.equal(a.rows.length,72);assert.equal(new Set(a.rows.map(r=>r.id)).size,72);assert.ok(a.rows.every(r=>r.fragments.length===3&&r.y>=0&&r.y<=100));
 const changed=design();changed.groups[1].temp=28;const b=simulateWet(changed);assert.notEqual(a.rows.find(r=>r.group===1).y,b.rows.find(r=>r.group===1).y);
 const summary=wetSummary(a);assert.equal(summary.n,42);assert.deepEqual(summary.splitCounts,{train:42,validation:12,test:18});
});
test('invalid design and under-replication are rejected before generating labels',()=>{
 for(const change of [{replicates:3},{seed:NaN},{replicates:8.5},{groups:defaults().slice(0,2)}])assert.throws(()=>validateDesign({...design(),...change}));const d=design();d.groups[0].temp=100;assert.throws(()=>simulateWet(d));
});
test('all 32 scientific model schemes fit default design and have unique illustration assets',()=>{
 const data=simulateWet(design()),art=[];assert.equal(WET_POOL.length,32);assert.equal(new Set(WET_POOL.map(m=>m.family)).size,8);
 for(const m of WET_POOL){const r=new WetTools(data).evaluate(m.id);assert.equal(r.status,'evaluated',m.id);assert.ok(Number.isFinite(r.validation.rmse));assert.ok(r.features.length>0);art.push(fs.readFileSync(new URL('../dist/illustrations/'+m.id+'.svg',import.meta.url),'utf8'));}assert.equal(new Set(art).size,32);
});
test('sealed wet test values cannot change training summaries, validation or selected winner',()=>{
 const a=simulateWet(design()),b=structuredClone(a);for(const r of b.rows)if(r.split==='test'){r.y=100-r.y;r.x.temp=999;r.time.forEach(t=>t.bleaching=999);}
 assert.deepEqual(wetSummary(a),wetSummary(b));const ra=wetRule(a),rb=wetRule(b);assert.deepEqual(ra.models,rb.models);assert.equal(ra.final.winner.id,rb.final.winner.id);assert.notDeepEqual(ra.final.test,rb.final.test);
});
test('wet tool budget, model whitelist, negative controls and freeze gate are enforced',()=>{
 const t=new WetTools(simulateWet(design()),4);assert.throws(()=>t.finalize());assert.throws(()=>t.evaluate('fake-model'));assert.equal(t.used,0);
 t.evaluate('ridge-compound');assert.throws(()=>t.finish('ridge-compound'));assert.throws(()=>t.evaluate('ridge-compound'));t.evaluate('tree-nutrients');t.evaluate('ridge-compound','drop-chemistry');assert.throws(()=>t.finish('ridge-compound'));t.evaluate('ridge-compound','shuffle-labels');assert.throws(()=>t.evaluate('forest-interactions'));t.finish('ridge-compound');assert.equal(t.used,4);assert.equal(t.finalize(),t.finalize());assert.throws(()=>t.evaluate('knn-thermal'));
 const thermal=new WetTools(simulateWet(design()),4),original=thermal.evaluate('ridge-thermal'),control=thermal.evaluate('ridge-thermal','drop-chemistry');assert.equal(original.validation.rmse,control.validation.rmse);assert.match(control.control_note,/不能检验化学增量/);
});
test('wet planner consumes real tool feedback and records failed plans without fallback',async()=>{
 const call=(tool,args)=>({tool,arguments:args,rationale:'比较两类算法并保留复核预算'}),queue=[call('inspect',{}),call('evaluate',{id:'ridge-compound'}),call('evaluate',{id:'forest-interactions'}),call('control',{id:'forest-interactions',kind:'drop-chemistry'}),call('control',{id:'forest-interactions',kind:'shuffle-labels'}),call('finish',{id:'forest-interactions'})];let calls=0;
 const r=await wetAgent(simulateWet(design()),4,async messages=>{calls++;assert.ok(!JSON.stringify(messages).includes('predictions'));return {text:JSON.stringify(queue.shift()),usage:{total_tokens:5}};});assert.equal(r.status,'completed');assert.equal(r.used,4);assert.equal(calls,6);assert.equal(r.known_tokens,30);assert.equal(r.final.test.n,18);
 const bad=await wetAgent(simulateWet(design()),4,async()=>({text:'{}'}));assert.equal(bad.status,'invalid_planning_stopped');assert.equal(bad.final,null);assert.equal(bad.used,0);
});
test('regression metrics have correct units and handle constant outcome',()=>{
 assert.equal(wetMetrics([0,10],[0,10]).rmse,0);assert.equal(wetMetrics([0,10],[10,0]).rmse,10);assert.equal(wetMetrics([5,5],[5,5]).r2,null);
});
