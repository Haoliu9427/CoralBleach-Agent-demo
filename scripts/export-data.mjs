import {generate,VERSION} from '../dist/engine.js';import fs from 'node:fs';
const seed=Number(process.argv[2]||42),data=generate(seed);fs.mkdirSync('data/synthetic',{recursive:true});
let csv='data_kind,version,seed,reef,day,heat_z,light_z,flow_proxy,sensitivity,season,bleaching_binary\n';
data.series.forEach((a,i)=>a.forEach((x,t)=>csv+=['synthetic',VERSION,seed,i,t,x.heat,x.light,x.flow,x.sensitivity,x.season,data.outcomes[i][t].y].join(',')+'\n'));
fs.writeFileSync(`data/synthetic/daily-seed${seed}.csv`,csv);console.log(`Exported ${data.n*data.days} synthetic rows.`);
