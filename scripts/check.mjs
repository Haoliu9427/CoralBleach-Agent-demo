import fs from 'node:fs';import {execFileSync} from 'node:child_process';
for(const file of ['index.html','style.css','icon.svg','app.js','engine.js','data.js','worker.js','planner.js','compound.js','compound-ui.js','reef-map.js','research.js','visuals.js'])if(!fs.existsSync(`dist/${file}`))throw Error(`Missing ${file}`);
for(const file of ['app.js','engine.js','data.js','worker.js','planner.js','compound.js','compound-ui.js','reef-map.js','research.js','visuals.js'])execFileSync(process.execPath,['--check',`dist/${file}`]);
const html=fs.readFileSync('dist/index.html','utf8');for(const [_,ref] of html.matchAll(/(?:src|href)="([^"#]+)"/g)){if(!ref.startsWith('https:')&&!fs.existsSync(`dist/${ref}`))throw Error(`Missing link target ${ref}`);}
console.log('Static package and JavaScript syntax checks passed.');
