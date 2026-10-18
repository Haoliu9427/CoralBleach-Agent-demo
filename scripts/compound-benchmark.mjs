import fs from 'node:fs';
import {compoundBenchmark} from '../dist/compound.js';
const runs=['interaction','null','shift'].map(world=>compoundBenchmark({seed:42,horizon:14,budget:8,world,access:'full'}));
fs.mkdirSync('results',{recursive:true});
fs.writeFileSync('results/compound-scenarios.json',JSON.stringify({purpose:'Software scenarios, not empirical performance or causal estimates',runs},null,2)+'\n');
for(const r of runs)console.log(`${r.world}: adaptive AP ${r.final.adaptive.ap.toFixed(3)} | random ${r.final.random.ap.toFixed(3)} | thermal ${r.final.local.ap.toFixed(3)}`);
