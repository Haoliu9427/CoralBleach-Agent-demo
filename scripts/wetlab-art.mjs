import fs from 'node:fs';
import {WET_POOL} from '../dist/wetlab-engine.js';
import {modelArt} from '../dist/wetlab-art.js';
fs.mkdirSync('dist/illustrations',{recursive:true});
for(const model of WET_POOL)fs.writeFileSync('dist/illustrations/'+model.id+'.svg',modelArt(model.family,model.view,model.index));
console.log(WET_POOL.length+' model illustrations generated.');
