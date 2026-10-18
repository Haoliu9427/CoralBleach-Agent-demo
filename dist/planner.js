import {generate,candidates,experiment,utility,VERSION,samples} from './engine.js';
import {generateCompound,compoundCandidates,compoundExperiment,compoundSamples} from './compound.js';
import {availableModels,researchContext,RESEARCH_VERSION} from './research.js';
export const inventory=[{id:'additive',name:'Logistic · 加性',role:'局地与空间信号的低容量基线',cost:'1 fit'},{id:'interaction',name:'Logistic · 交互项',role:'检验热压力×光照及敏感性交互',cost:'1 fit'}];
export function trainingSummary(data,horizon){const chem=data.track==='compound',base=chem?{id:'chem-0-thermal',route:'local',lag:0,model:'thermal'}:{route:'local',lag:0,model:'additive'},rows=(chem?compoundSamples:samples)(data,horizon,'train',base),names=['heat','light','sensitivity','season','local_heat'];return {n:rows.length,positive_fraction:rows.reduce((s,r)=>s+r.y,0)/rows.length,features:Object.fromEntries(names.map((name,j)=>{const a=rows.map(r=>r.x[j]);return [name,{min:Math.min(...a),max:Math.max(...a),mean:a.reduce((s,v)=>s+v,0)/a.length}];})),units:'合成无量纲基础变量；不与首页DHW情景量混用'};}
// This whitelist, not the LLM, owns the experiment state and holdout lifecycle.
export class ScientificTools{
  constructor({seed=42,horizon=14,budget=8,track='spatial',access='full',world='interaction'}={}){if(!Number.isInteger(budget)||budget<4||budget>24)throw Error('Budget must be 4..24');if(!['spatial','compound'].includes(track))throw Error('未知研究路线');this.config={seed,horizon,budget,track,access,world};const chem=track==='compound';this.data=chem?generateCompound(seed,world,access):generate(seed);this.inventory=chem?availableModels(access):inventory;this.candidates=chem?compoundCandidates(access):candidates();this.experiment=chem?compoundExperiment:experiment;this.controlKinds=chem?['ablate','time-shift']:['reverse','time-shift'];this.used=0;this.selected=new Set();this.results=new Map();this.controls=new Map();this.frozen=null;this.final=null;}
  describe(){return {data:'synthetic',target:`目标日 t+${this.config.horizon} 的二元白化状态`,training:{reefs:'01–08',origins:[90,360],n:728},validation:{reefs:'09–10',origins:[435,525],n:62},research_context:researchContext(this.config.track,this.config.access),sealed_test:'不可访问；冻结后一次评估',budget_remaining:this.config.budget-this.used,model_inventory:this.inventory,allowed_controls:this.controlKinds,selected_models:[...this.selected],actions:this.candidates.filter(c=>this.selected.has(c.model)).map(c=>c.id),completed:[...this.results].map(([id,r])=>({action_id:id,metrics:r.metrics})),controls:[...this.controls].map(([key,r])=>({key,metrics:r.metrics}))};}
  execute(call){
    if(this.frozen)throw Error('候选已冻结');
    if(!call||typeof call.tool!=='string'||typeof call.rationale!=='string'||call.rationale.length>600||!call.arguments||Array.isArray(call.arguments))throw Error('工具调用格式错误');
    const {tool,arguments:a}=call,keys=Object.keys(a).sort().join(',');
    if(tool==='inspect_data'&&keys==='')return this.describe();
    if(tool==='select_models'){if(keys!=='model_ids'||!Array.isArray(a.model_ids)||new Set(a.model_ids).size<2||a.model_ids.some(m=>!this.inventory.some(e=>e.id===m)))throw Error('请选择当前数据支持的至少两种模型');a.model_ids.forEach(m=>this.selected.add(m));return this.describe();}
    if(!['evaluate_hypothesis','negative_control','finish'].includes(tool))throw Error('不允许的工具');
    if(keys!==(tool==='negative_control'?'action_id,kind':'action_id'))throw Error('不允许的参数');
    const c=this.candidates.find(c=>c.id===a.action_id);if(!c||!this.selected.has(c.model))throw Error('候选未知或模型未选择');
    if(tool==='finish'){if(!this.results.has(c.id)||new Set([...this.results.values()].map(r=>r.candidate.model)).size<2||!this.controlKinds.every(k=>this.controls.has(c.id+':'+k)))throw Error('冻结前需比较两种模型，并完成该候选的两种负对照');this.frozen=c;return {status:'frozen',candidate:c};}
    if(this.used>=this.config.budget)throw Error('实验预算已耗尽');
    if(tool==='evaluate_hypothesis'&&this.results.has(c.id))throw Error('拒绝重复候选');
    if(tool==='negative_control'&&(!this.results.has(c.id)||!this.controlKinds.includes(a.kind)||this.controls.has(c.id+':'+a.kind)))throw Error('负对照未获允许或重复');
    this.used++;const result=this.experiment(this.data,this.config.horizon,c,'validation',tool==='negative_control'?a.kind:'none');
    if(tool==='negative_control')this.controls.set(c.id+':'+a.kind,result);else this.results.set(c.id,result);
    return {scope:'validation',candidate:c,control:a.kind||null,metrics:result.metrics,utility:utility(result.metrics),budget_remaining:this.config.budget-this.used};
  }
  finalize(){if(!this.frozen)throw Error('未冻结，不能读取测试集');if(this.final)return this.final;const c=this.frozen,h=this.config.horizon,base=this.config.track==='compound'?{route:'local',lag:0,model:'thermal',id:'chem-0-thermal'}:{route:'local',lag:0,model:'additive',id:'local-0-additive'};this.final={candidate:c,metrics:this.experiment(this.data,h,c,'test').metrics,local:this.experiment(this.data,h,base,'test').metrics,controls:this.controlKinds.map(kind=>({kind,metrics:this.experiment(this.data,h,c,'test',kind).metrics}))};return this.final;}
}
export function parseCall(text){let t=text.trim();if(t.startsWith('```'))t=t.replace(/^```(?:json)?\s*/,'').replace(/\s*```$/,'');const c=JSON.parse(t);if(Object.keys(c).sort().join(',')!=='arguments,rationale,tool')throw Error('必须只返回tool、arguments、rationale');return c;}
export async function runLLM(config,request,notify=()=>{}){
  config=Object.fromEntries(['seed','horizon','budget','mode','question','track','access','world','model','modelId','runId','transport'].filter(k=>config[k]!==undefined).map(k=>[k,config[k]]));
  const tools=new ScientificTools(config),audit=[],messages=[{role:'user',content:JSON.stringify({research_goal:String(config.question||'分析局地与先行环境条件，选择模型并检验珊瑚白化候选；为负对照预留两步预算。').slice(0,1200),training_summary:trainingSummary(tools.data,config.horizon),evidence:tools.describe()})}];let rejects=0,tokens=0,complete=true,status='planning_limit';const started=Date.now();
  for(let step=1;step<=config.budget+5;step++){
    if(Date.now()-started>240000){status='time_budget';break;}notify({step,used:tools.used,budget:config.budget});
    let reply;try{reply=await request(messages);}catch(error){audit.push({step,status:'model_service_error',error:error.message});status='model_service_error';complete=false;break;}
    if(Number.isInteger(reply.usage?.total_tokens))tokens+=reply.usage.total_tokens;else complete=false;
    let observation;try{const call=parseCall(reply.text);observation=tools.execute(call);audit.push({step,status:'executed',...call,result:observation});messages.push({role:'assistant',content:JSON.stringify(call)});rejects=0;}catch(error){observation={error:error.message,budget_remaining:config.budget-tools.used};audit.push({step,status:'rejected',result:observation});rejects++;}
    messages.push({role:'user',content:JSON.stringify({tool_observation:observation})});
    if(tools.frozen){status='completed';break;}if(rejects>=3){status='invalid_planning_stopped';break;}
  }
  return {version:config.track==='compound'?RESEARCH_VERSION:VERSION,controller:'llm_json_tool_planner',model:config.model,config,status,audit,experiments_executed:tools.used,planning_calls:audit.length,known_total_tokens:tokens,token_usage_complete:complete,elapsed_seconds:(Date.now()-started)/1000,final:tools.frozen?tools.finalize():null,limits:'只验证合成软件流程；真实模型性能需要独立观测。失败不会静默切换为规则规划。'};
}
