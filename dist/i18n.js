import {EN} from './locales/en.js';

// Local presentation layer only. IDs, model inputs, tokens and numerical results stay unchanged.
export const LANGUAGE_KEY='coralbleach-language';
const han=/[\u3400-\u9fff]/;
const normalize=s=>s.trim().replace(/\s+/g,' ');
const exact=new Map(Object.entries(EN).map(([a,b])=>[normalize(a),b]));
const escape=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const templates=Object.entries(EN).filter(([s])=>/\{\d+\}/.test(s)).map(([s,value])=>{
 const keys=[];let cursor=0,pattern='';
 for(const m of normalize(s).matchAll(/\{(\d+)\}/g)){pattern+=escape(normalize(s).slice(cursor,m.index))+'(.*?)';keys.push(m[1]);cursor=m.index+m[0].length;}
 pattern+=escape(normalize(s).slice(cursor));
 return {re:new RegExp('^'+pattern+'$'),keys,value,weight:s.replace(/\{\d+\}/g,'').length};
}).sort((a,b)=>b.weight-a.weight);
const fragments=Object.entries(EN).filter(([s])=>!/[{}\n]/.test(s)&&s.trim().length>1).sort((a,b)=>b[0].length-a[0].length);
export function translateText(source,depth=0){
 if(typeof source!=='string')return source;
 if(!han.test(source)&&!exact.has(normalize(source)))return source;
 const key=normalize(source),direct=exact.get(key);let result=direct;
 if(result===undefined&&depth<4){
  for(const t of templates){const m=key.match(t.re);if(!m)continue;const args=Object.fromEntries(t.keys.map((k,i)=>[k,translateText(m[i+1],depth+1)]));result=t.value.replace(/\{(\d+)\}/g,(_,k)=>args[k]??'');break;}
 }
 if(result===undefined){result=key;for(const [a,b] of fragments)if(result.includes(a))result=result.split(a).join(b);}
 return source.match(/^\s*/)[0]+result+source.match(/\s*$/)[0];
}
export function getLanguage(){return typeof document==='undefined'?'zh':document.documentElement.lang==='en'?'en':'zh';}
export const localize=s=>getLanguage()==='en'?translateText(s):s;

export function initI18n(){
 if(document.getElementById('language-switch'))return;
 let selected='zh';try{selected=new URL(location.href).searchParams.get('lang')||localStorage.getItem(LANGUAGE_KEY)||'zh';}catch{}
 selected=selected==='en'?'en':'zh';
 const memory=new WeakMap(),attributes=new WeakMap();
 const skip='script,style,code,pre,[data-no-translate],.wet-message.user p';
 const switcher=document.createElement('div');switcher.id='language-switch';switcher.className='language-switch';switcher.dataset.noTranslate='';switcher.setAttribute('role','group');switcher.setAttribute('aria-label','Language / 语言');
 switcher.innerHTML='<button type="button" data-language="zh" lang="zh-CN">中文</button><button type="button" data-language="en" lang="en">EN</button>';
 document.body.append(switcher);
 function textNode(node){
  if(!node.parentElement||node.parentElement.closest(skip)||!node.data.trim())return;
  let entry=memory.get(node);if(!entry||entry.rendered!==node.data)entry={source:node.data};
  const next=selected==='en'?translateText(entry.source):entry.source;
  if(node.parentElement.tagName==='OPTION'&&!node.parentElement.hasAttribute('value'))node.parentElement.setAttribute('value',node.parentElement.value);
  if(next!==node.data)node.data=next;entry.rendered=next;memory.set(node,entry);
 }
 function element(el){
  if(el.closest(skip))return;
  const saved=attributes.get(el)||{};
  for(const name of ['aria-label','title','placeholder','alt']){
   const current=el.getAttribute(name);if(current===null)continue;
   if(!saved[name]||saved[name].rendered!==current)saved[name]={source:current};
   const next=selected==='en'?translateText(saved[name].source):saved[name].source;
   if(current!==next)el.setAttribute(name,next);saved[name].rendered=next;
  }
  attributes.set(el,saved);
 }
 function scan(root){
  if(root.nodeType===3){textNode(root);return;}
  if(root.nodeType!==1&&root.nodeType!==9)return;
  if(root.nodeType===1)element(root);
  const walk=document.createTreeWalker(root,NodeFilter.SHOW_TEXT|NodeFilter.SHOW_ELEMENT);let node;
  while((node=walk.nextNode()))node.nodeType===3?textNode(node):element(node);
 }
 function defaults(){
  // Translate only untouched default prompts. User-entered text remains verbatim.
  for(const id of ['research-question']){const el=document.getElementById(id);if(!el)continue;const source=el.dataset.originalPrompt||el.defaultValue;el.dataset.originalPrompt=source;const en=translateText(source);if(el.value===source||el.value===en)el.value=selected==='en'?en:source;}
 }
 const observer=new MutationObserver(records=>{
  observer.disconnect();
  const roots=new Set();for(const r of records){if(r.type==='characterData'||r.type==='attributes')roots.add(r.target);else r.addedNodes.forEach(n=>roots.add(n));}
  for(const root of roots)if(root.isConnected)scan(root);observe();
 });
 function observe(){observer.observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['aria-label','title','placeholder','alt']});}
 function apply(lang,save=false){
  selected=lang==='en'?'en':'zh';observer.disconnect();document.documentElement.lang=selected==='en'?'en':'zh-CN';
  scan(document.body);defaults();document.title=selected==='en'?'CoralBleach-Agent | Coral bleaching research workspace':'CoralBleach-Agent | 珊瑚白化研究工作台';
  document.querySelector('meta[name="description"]').content=selected==='en'?'A synthetic coral bleaching research demo. Separate environmental risk, bleaching evidence and ecological outcomes.':'CoralBleach-Agent：全球珊瑚白化预测预警与科学发现的合成数据演示。区分环境风险、白化证据与生态后果。';
  switcher.querySelectorAll('button').forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.language===selected));});
  if(save){try{localStorage.setItem(LANGUAGE_KEY,selected);}catch{}const u=new URL(location.href);u.searchParams.set('lang',selected);history.replaceState(null,'',u);}
  observe();document.dispatchEvent(new CustomEvent('languagechange',{detail:{language:selected}}));
 }
 switcher.querySelectorAll('button').forEach(b=>b.onclick=()=>apply(b.dataset.language,true));apply(selected);
}
