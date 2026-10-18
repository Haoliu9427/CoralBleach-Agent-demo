import test from 'node:test';import assert from 'node:assert/strict';
import {modelScopeConfig,MODEL_PRESETS,chat,chatPayload,listModelScopeModels,SYSTEM} from '../dist/llm-client.js';
import {atlasURL,parseAtlasURL,atlasLocation} from '../dist/atlas-config.js';
import {runLLM} from '../dist/planner.js';
test('ModelScope presets share one endpoint and reject invalid credentials or model IDs',()=>{
  for(const model of MODEL_PRESETS)assert.equal(modelScopeConfig(model,'test-token').base_url,'https://api-inference.modelscope.cn/v1');
  for(const id of ['https://evil.test/x','Qwen/x?token=x','foo/bar',''])assert.throws(()=>modelScopeConfig(id,'test-token'));
  assert.throws(()=>modelScopeConfig(MODEL_PRESETS[0],''));
  assert.equal(chatPayload(modelScopeConfig('deepseek-ai/DeepSeek-V3.2','test-token'),[],1200).enable_thinking,false);
});
test('browser adapter sends token only in Authorization and keeps provider metadata out of result',async()=>{
  let captured;const r=await chat(modelScopeConfig(MODEL_PRESETS[0],'test-only-token'),[{role:'user',content:'OK'}],{fetchFn:async(url,options)=>{captured={url,options};return {ok:true,json:async()=>({choices:[{message:{content:'OK',reasoning_content:'private'}}],usage:{total_tokens:3,debug:'test-only-token'},debug:'test-only-token'})};}});
  assert.equal(captured.options.headers.Authorization,'Bearer test-only-token');assert.equal(captured.options.credentials,'omit');assert.ok(!captured.options.body.includes('test-only-token'));assert.ok(!captured.url.includes('test-only-token'));assert.deepEqual(r.usage,{total_tokens:3});assert.ok(!JSON.stringify(r).includes('test-only-token'));
});
test('provider failures are explicit and never echo tokens or response bodies',async()=>{
  for(const code of [401,403,404,429,500])await assert.rejects(chat(modelScopeConfig(MODEL_PRESETS[0],'secret'),[],{fetchFn:async()=>({ok:false,status:code,json:async()=>({error:'secret'})})}),e=>e.message.includes(String(code))&&!e.message.includes('secret'));
  await assert.rejects(chat(modelScopeConfig(MODEL_PRESETS[0],'secret'),[],{fetchFn:async()=>{throw Error('secret');}}),e=>!e.message.includes('secret'));
  await assert.rejects(chat(modelScopeConfig(MODEL_PRESETS[0],'secret'),[],{fetchFn:async()=>({ok:true,json:async()=>({choices:[{message:{reasoning_content:'hidden'}}]})})}));
});
test('platform model list is restricted to requested model families',async()=>{
  const result=await listModelScopeModels('test-token',{fetchFn:async()=>({ok:true,json:async()=>({data:[{id:MODEL_PRESETS[0]},{id:MODEL_PRESETS[0]},{id:'deepseek-ai/DeepSeek-V3.2'},{id:'other/model'},{id:'Qwen/x?bad'}]})})});assert.equal(result.length,2);
});
test('direct adapter runs the complete bounded planner with no credentials in exported config',async()=>{
  const call=(tool,args)=>({tool,arguments:args,rationale:'检验候选'});
  const queue=[call('select_models',{model_ids:['additive','interaction']}),call('evaluate_hypothesis',{action_id:'local-0-additive'}),call('evaluate_hypothesis',{action_id:'directional-7-interaction'}),call('negative_control',{action_id:'directional-7-interaction',kind:'reverse'}),call('negative_control',{action_id:'directional-7-interaction',kind:'time-shift'}),call('finish',{action_id:'directional-7-interaction'})];
  const credentials=modelScopeConfig(MODEL_PRESETS[0],'never-export-this-token');let count=0;
  const result=await runLLM({seed:42,horizon:14,budget:4,model:credentials.model,api_key:credentials.api_key,credentials},messages=>chat(credentials,[{role:'system',content:SYSTEM},...messages],{fetchFn:async(url,args)=>{count++;const payload=JSON.parse(args.body);assert.equal(payload.messages[0].role,'system');return {ok:true,json:async()=>({choices:[{message:{content:JSON.stringify(queue.shift())}}],usage:{total_tokens:7}})};}}));
  assert.equal(result.status,'completed');assert.equal(count,6);assert.equal(result.experiments_executed,4);assert.ok(!JSON.stringify(result).includes('never-export-this-token'));assert.equal(result.known_total_tokens,42);
});
test('Atlas round trip accepts official URL and rejects invalid coordinates or foreign hosts',()=>{
  const p={lat:-14.7,lon:145.5,zoom:9};assert.deepEqual(parseAtlasURL(atlasURL(p)),p);assert.deepEqual(parseAtlasURL('https://www.allencoralatlas.org/atlas/#1.00/0.0000/-145.0000'),{lat:0,lon:-145,zoom:1});
  for(const v of [{...p,lat:91},{...p,lon:-181},{...p,zoom:0},{...p,lat:''},{...p,zoom:NaN}])assert.throws(()=>atlasLocation(v));
  for(const u of ['https://evil.test/atlas/#9/0/0','javascript:alert(1)','https://allencoralatlas.org.evil.test/atlas/#9/0/0','https://user:pass@allencoralatlas.org/atlas/#9/0/0','https://allencoralatlas.org/atlas/#9/0'])assert.throws(()=>parseAtlasURL(u));
});
