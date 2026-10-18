import {benchmark} from '../dist/engine.js';import fs from 'node:fs';
const runs=Array.from({length:20},(_,i)=>benchmark({seed:i+1,horizon:14,budget:8}));
const rows=runs.map(r=>({seed:r.seed,adaptive_ap:r.final.adaptive.ap,random_ap:r.final.random.ap,local_ap:r.final.local.ap,adaptive_brier:r.final.adaptive.brier,random_brier:r.final.random.brier,local_brier:r.final.local.brier,winner:r.adaptive.winner.id,quality:r.final.adaptive.status}));
const mean=k=>rows.reduce((s,r)=>s+r[k],0)/rows.length;
const summary={seeds:'1..20',horizon:14,budget:8,n:20,adaptive_ap:mean('adaptive_ap'),random_ap:mean('random_ap'),local_ap:mean('local_ap'),adaptive_wins_random:rows.filter(r=>r.adaptive_ap>r.random_ap).length,adaptive_wins_local:rows.filter(r=>r.adaptive_ap>r.local_ap).length,deferred:rows.filter(r=>r.quality==='DEFER').length,notes:'Descriptive results across generator seeds. Not a significance test; not real-world skill.'};
fs.mkdirSync('results',{recursive:true});fs.writeFileSync('results/multi-seed.json',JSON.stringify({summary,rows},null,2));console.log(JSON.stringify(summary,null,2));
