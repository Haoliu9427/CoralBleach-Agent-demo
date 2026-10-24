import test from 'node:test';
import assert from 'node:assert/strict';
import {translateText} from '../dist/i18n.js';
import {EN} from '../dist/locales/en.js';
import {chatPayload,SYSTEM} from '../dist/llm-client.js';
import {WET_POOL} from '../dist/wetlab-engine.js';

test('English model names cover all 96 configurations without changing their IDs',()=>{
 for(const model of WET_POOL){const id=model.id,name=model.name;assert.doesNotMatch(translateText(name),/[\u3400-\u9fff]/);assert.equal(model.id,id);assert.equal(model.name,name);}
});
test('nested messages preserve all scientific quantities and distinguish outcomes',()=>{
 assert.equal(translateText('2026-06-10 · 80 个样本'),'2026-06-10 · 80 samples');
 assert.equal(translateText('本轮完成：6 个候选，合计 8/8 次拟合（含负对照）。运行的是固定顺序基线。'),'Run complete: 6 candidates, 8/8 total fits including negative controls. This run used the fixed-order baseline.');
 assert.equal(translateText('模拟白化 ≠ 真实观测 ≠ 珊瑚死亡'),'Synthetic bleaching ≠ real observation ≠ coral mortality');
 assert.equal(translateText('。'),'.');
});
test('dictionary translations have no missing template parameters or untranslated Chinese',()=>{
 for(const [source,en] of Object.entries(EN)){
  assert.doesNotMatch(en,/[\u3400-\u9fff]/,source);
  const params=s=>[...new Set([...s.matchAll(/\{(\d+)\}/g)].map(x=>x[1]))].sort();
  assert.deepEqual(params(en),params(source),source);
 }
});
test('English LLM output instruction leaves tools, original messages and numerical inputs intact',()=>{
 const config={model:'Qwen/Qwen3.5-35B-A3B',base_url:'https://api-inference.modelscope.cn/v1',language:'en'};
 const messages=[{role:'system',content:SYSTEM},{role:'user',content:'{"budget":8,"model_id":"ridge-compound"}'}];
 const before=structuredClone(messages);const p=chatPayload(config,messages,1200);
 assert.deepEqual(messages,before);assert.equal(p.messages[1].content,before[1].content);
 assert.ok(p.messages[0].content.startsWith(SYSTEM));assert.match(p.messages[0].content,/Response language: English/);
 assert.equal(chatPayload({...config,language:'zh'},messages,1200).messages[0].content,SYSTEM);
});
