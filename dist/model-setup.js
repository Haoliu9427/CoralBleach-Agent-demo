import {TUTOR_SYSTEM} from './wetlab-engine.js';
import {MODEL_PRESETS,modelScopeConfig,chat,listModelScopeModels,postAPI,INTERPRET_SYSTEM} from './llm-client.js';
export function setupModels(){
  const $=id=>document.getElementById(id),selector=$('platform-model'),status=$('provider-status');
  let revision=0,verified=-1,busy=false,locked=false,serverModels=[];
  selector.replaceChildren(...MODEL_PRESETS.map(m=>new Option(m.split('/')[1],m)),new Option('其他 ModelScope 型号…','custom'));
  function model(){return selector.value==='custom'?$('custom-model').value.trim():selector.value;}
  function server(){return serverModels.find(m=>'server:'+m.id===selector.value);}
  function sync(){
    $('custom-model-label').classList.toggle('hidden',selector.value!=='custom');
    $('token-label').classList.toggle('hidden',!!server());
    $('connection-route').textContent=server()?'使用本地服务端已配置的模型；密钥由本地进程保管。':'请求发送至 api-inference.modelscope.cn；Token 仅在当前页面内存中使用，刷新后需重填。';
  }
  function invalidate(){revision++;verified=-1;status.textContent='配置已改变，请检查连接后运行。';sync();}
  function buttons(){for(const id of ['probe','load-models','clear-token','platform-model','custom-model','modelscope-token'])$(id).disabled=busy||locked;}
  selector.onchange=invalidate;$('custom-model').oninput=invalidate;$('modelscope-token').oninput=invalidate;
  $('clear-token').onclick=()=>{$('modelscope-token').value='';invalidate();status.textContent='Token 已清除；无密钥规则演示仍可运行。';};
  function active(){const s=server();return s?{transport:'server',model:s.model,modelId:s.id,connectionId:revision}:{transport:'modelscope-browser',credentials:modelScopeConfig(model(),$('modelscope-token').value),model:model(),modelId:model(),connectionId:revision};}
  $('probe').onclick=async()=>{
    busy=true;buttons();const stamp=revision;status.textContent='正在向所选模型发送小额生成请求…';
    try{const c=active();const r=c.transport==='server'?await postAPI('probe',{modelId:c.modelId}):await chat(c.credentials,[{role:'user',content:'请只回复 OK。'}],{maxTokens:256});
      if(c.transport!=='server'&&r.text.replace(/[.。]/g,'').trim()!=='OK')throw Error('模型有响应，但未通过 OK 生成检查。请重试或更换型号。');
      if(stamp===revision){verified=stamp;$('planner-mode').value='llm';status.textContent=`连接成功 · ${r.model} · 可运行自主探索${Number.isInteger(r.usage?.total_tokens)?' · 本次检查 '+r.usage.total_tokens+' Token':''}`;}
    }catch(error){verified=-1;status.textContent=error.message;}finally{busy=false;buttons();}
  };
  $('load-models').onclick=async()=>{
    busy=true;buttons();status.textContent='正在读取 ModelScope 的 Qwen / DeepSeek 型号…';
    try{const ids=await listModelScopeModels($('modelscope-token').value);const existing=new Set([...selector.options].map(o=>o.value));for(const id of ids)if(!existing.has(id))selector.add(new Option(id.split('/')[1],id),selector.querySelector('option[value="custom"]'));status.textContent=`已读取 ${ids.length} 个型号。列表不保证账号权限；选定后请检查连接。`;}
    catch(error){status.textContent=error.message;}finally{busy=false;buttons();}
  };
  $('planner-mode').onchange=()=>{if($('planner-mode').value==='llm'&&verified!==revision){$('model-config').open=true;status.textContent='先选型号、填写 ModelScope Token，再点击检查连接。';}};
  // Pages has no /api service. Only probe legacy server configuration on loopback.
  if(['localhost','127.0.0.1','[::1]'].includes(location.hostname))fetch('/api/models').then(r=>r.ok?r.json():{}).then(d=>{serverModels=d.models||[];for(const m of serverModels)selector.add(new Option('本地配置 · '+m.name,'server:'+m.id));}).catch(()=>{});
  sync();
  return {
    async prepare(budget,task='field'){
      if(busy||locked)throw Error('请等待当前模型请求或实验完成。');
      if(verified!==revision){$('model-config').open=true;$('modelscope-token').focus();throw Error('请先在上方填写 ModelScope Token，并点击“检查连接并启用”。');}
      const c=active();if(c.transport==='server'){const r=await postAPI('runs',{modelId:c.modelId,budget,task});c.runId=r.runId;}else c.runId=crypto.randomUUID();return c;
    },
    async assist(question,context){
      const c=await this.prepare(4,'wet-tutor');
      return c.transport==='server'?postAPI('tutor',{modelId:c.modelId,runId:c.runId,question,context}):chat(c.credentials,[{role:'system',content:TUTOR_SYSTEM},{role:'user',content:JSON.stringify({question:String(question).slice(0,1200),context}).slice(0,42000)}],{maxTokens:1500});
    },
    lock(value){locked=value;buttons();$('planner-mode').disabled=value;},
    async interpret(result){
      if(result.connectionId!==revision||verified!==revision)throw Error('连接配置已改变，请重新运行实验后解读。');
      const c=active();return c.transport==='server'?postAPI('interpret',{runId:result.runId,modelId:result.modelId,summary:result.llm.final}):chat(c.credentials,[{role:'system',content:INTERPRET_SYSTEM},{role:'user',content:JSON.stringify(result.llm.final).slice(0,14000)}],{maxTokens:900});
    }
  };
}
