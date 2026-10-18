import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {api} from '../server/api.mjs';
const root=path.resolve('dist');const port=Number(process.env.PORT||4173);
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.md':'text/markdown; charset=utf-8','.docx':'application/vnd.openxmlformats-officedocument.wordprocessingml.document'};
http.createServer(async(req,res)=>{if(await api(req,res))return;try{const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);let f=path.resolve(root,'.'+pathname);if(f!==root&&!f.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}if(f===root)f=path.join(root,'index.html');if(!fs.existsSync(f)||fs.statSync(f).isDirectory()){res.writeHead(404);res.end('Not found');return;}res.writeHead(200,{'Content-Type':types[path.extname(f)]||'application/octet-stream','Cache-Control':'no-cache'});fs.createReadStream(f).pipe(res);}catch{res.writeHead(400);res.end('Bad request');}}).listen(port,'127.0.0.1',()=>console.log(`Local: http://127.0.0.1:${port}`));
