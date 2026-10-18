import test from 'node:test';import assert from 'node:assert/strict';
import {CulturePlayback} from '../dist/wetlab-playback.js';
import {simulateWet,defaults,WET_POOL,WetTools,fitWet,wetMetrics} from '../dist/wetlab-engine.js';
test('playback takes 45 seconds at 1x, pause and seek are independent of data',()=>{
 const clock=new CulturePlayback();clock.start();clock.advance(2500);assert.ok(clock.day<1);clock.advance(20000);assert.ok(Math.abs(clock.day-7)<1e-10);clock.pause();clock.advance(50000);assert.ok(Math.abs(clock.day-7)<1e-10);clock.setRate(.5);clock.start();clock.advance(45000);assert.equal(clock.day,14);assert.equal(clock.playing,false);clock.seek(3);clock.setRate(2);clock.start();clock.advance(22500);assert.equal(clock.day,14);clock.reset(21);assert.equal(clock.day,0);assert.equal(clock.playing,false);assert.throws(()=>clock.setRate(7));
});
test('new algorithm families learn a known relationship and react to training labels',()=>{
 const rows=Array.from({length:60},(_,i)=>{const t=26+(i%15)*.45,l=60+Math.floor(i/15)*30;return {x:{temp:t,light:l,days:14,coral:'branch',nitrate:0,ammonium:0,prometryn:0},y:20+6*(t-26)+.12*(l-60)};});
 const train=rows.filter((_,i)=>i%4),testRows=rows.filter((_,i)=>i%4===0);
 for(const family of ['lasso','elastic','lad','ransac','pcr','pls','spline','kernel','svr','extra','adaboost','mlp','elm','rbfnet','loess','omp']){
  const c=WET_POOL.find(m=>m.id===family+'-thermal'),m=fitWet(train,c),pred=testRows.map(m.predict),metric=wetMetrics(testRows.map(r=>r.y),pred);assert.ok(metric.rmse<12,`${family} failed learning fixture: ${metric.rmse}`);
  const shifted=fitWet(train.map(r=>({...r,y:r.y+10})),c);assert.ok(Math.abs(shifted.predict(testRows[0])-m.predict(testRows[0]))>2,family+' ignores labels');assert.deepEqual(pred,testRows.map(fitWet(train,c).predict));
 }
});
test('added estimators never see held-out labels during candidate fitting',()=>{
 const a=simulateWet({groups:defaults(),replicates:12,seed:42}),b=structuredClone(a);b.rows.filter(r=>r.split==='test').forEach(r=>{r.y=999;r.x.temp=-999;});
 for(const family of ['pcr','pls','kernel','mlp','extra','adaboost','rbfnet']){const id=family+'-compound',r1=new WetTools(a).evaluate(id),r2=new WetTools(b).evaluate(id);assert.deepEqual(r1,r2,id);}
});

