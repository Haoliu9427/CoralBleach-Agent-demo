import {benchmark} from '../dist/engine.js';
import fs from 'node:fs';
import crypto from 'node:crypto';
const result=benchmark({seed:Number(process.argv[2]||42),horizon:Number(process.argv[3]||14),budget:Number(process.argv[4]||8)});
fs.mkdirSync('results',{recursive:true});
fs.writeFileSync('results/benchmark.json',JSON.stringify(result,null,2));
fs.writeFileSync('results/run-manifest.json',JSON.stringify({version:result.version,seed:result.seed,horizon:result.horizon,budget:result.budget,engine_sha256:crypto.createHash('sha256').update(fs.readFileSync('dist/engine.js')).digest('hex'),result_sha256:crypto.createHash('sha256').update(fs.readFileSync('results/benchmark.json')).digest('hex')},null,2));
console.log(JSON.stringify({winner:result.adaptive.winner,final:result.final,controls:result.controls},null,2));
