import {generate,fit,predict,metrics,rng,sigmoid,SPLITS,utility} from './engine.js';
import {availableModels,worldLabels,RESEARCH_VERSION} from './research.js';

export function compoundCandidates(access='full'){
 return availableModels(access).flatMap(m=>[0,7,14,30].map(lag=>({id:`chem-${lag}-${m.id}`,route:'local',lag,model:m.id})));
}
// All chemical values are synthetic, with no claim to field calibration.
// The three worlds are software stress tests, not alternative ecological truths.
export function generateCompound(seed=42,world='interaction',access='full'){
 if(!Object.hasOwn(worldLabels,world))throw Error('未知合成场景');
 availableModels(access);
 const data=generate(seed),r=rng(seed+72641);
 data.version=RESEARCH_VERSION;data.track='compound';data.world=world;data.access=access;
 for(let i=0;i<data.n;i++){
  let n=0,a=0,p=0;
  for(const x of data.series[i]){
   n=.97*n+(r()-.5)*.8;a=.96*a+(r()-.5)*.6;p=.96*p+(r()-.5)*.6;
   x.nitrate=Math.max(.02,1.8+n+.7*Math.sin(x.day/38+i));
   x.ammonium=Math.max(.02,1.1+a+.45*Math.cos(x.day/29+i));
   x.prometryn=Math.max(0,.35+p*.35+.15*Math.sin(x.day/31));
  }
 }
 data.outcomes=data.series.map((rows,i)=>rows.map((x,t)=>{
  const c=rows[Math.max(0,t-7)];
  const nitrogen=(c.nitrate-1.8)*(.30+.45*x.heat)-(c.ammonium-1.1)*(.18+.35*x.heat);
  const pollution=.60*c.prometryn+.45*c.nitrate*c.prometryn;
  const multiplier=world==='null'?0:world==='shift'&&i>=8?-1:1;
  const probability=sigmoid(-1.7+1.1*x.heat+.55*x.light+.5*x.heat*x.light+.4*x.sensitivity+multiplier*(nitrogen+pollution));
  return {y:r()<probability?1:0};
 }));
 return data;
}
export function compoundFeatures(data,i,t,c,control='none'){
 if(!compoundCandidates(data.access).some(a=>a.id===c.id&&a.model===c.model&&a.lag===c.lag))throw Error('数据条件不支持此模型');
 if(!['none','ablate','time-shift'].includes(control))throw Error('未知化学对照');
 if(t<30||t>=data.days)throw Error('输入日期越界');
 const x=data.series[i][t],dt=Math.max(0,t-c.lag-(control==='time-shift'?31:0)),q=data.series[i][dt];
 const v=[x.heat,x.light,x.sensitivity,x.season,q.heat];
 if(control==='ablate'||c.model==='thermal')return v;
 if(c.model==='din')return [...v,q.nitrate+q.ammonium];
 v.push(q.nitrate,q.ammonium);
 if(['interactions','copollution'].includes(c.model))v.push(x.heat*q.nitrate,x.heat*q.ammonium);
 if(c.model==='copollution')v.push(q.prometryn,q.nitrate*q.prometryn);
 return v;
}
export function compoundSamples(data,horizon,split,c,control='none'){
 if(![7,14,30].includes(horizon)||!SPLITS[split])throw Error('目标日或分区无效');
 const spec=SPLITS[split];
 return spec.reefs.flatMap(i=>{const rows=[];for(let t=spec.start;t<=spec.end;t+=3)rows.push({x:compoundFeatures(data,i,t,c,control),y:data.outcomes[i][t+horizon].y,reef:i,origin:t,target:t+horizon,latestInput:t});return rows;});
}
export function compoundExperiment(data,horizon,c,split='validation',control='none'){
 const model=fit(compoundSamples(data,horizon,'train',c,control)),rows=compoundSamples(data,horizon,split,c,control);
 return {candidate:c,model,metrics:metrics(rows,rows.map(row=>predict(model,row.x)),model.prevalence)};
}
export function compoundNext(all,log,r,policy='adaptive'){
 const left=all.filter(c=>!log.some(row=>row.candidate.id===c.id));
 if(!left.length)throw Error('没有未测试候选');
 if(policy==='random')return left[Math.floor(r()*left.length)];
 // Compare model families at the same lag before allocating follow-up fits.
 const unseen=left.find(c=>c.lag===0&&!log.some(row=>row.candidate.model===c.model));
 if(unseen)return unseen;
 const best=[...log].sort((a,b)=>b.utility-a.utility)[0]?.candidate;
 const score=c=>((c.model===best?.model)?0.2:0)+.15/(1+log.filter(a=>a.candidate.lag===c.lag).length)+.1/(1+log.filter(a=>a.candidate.model===c.model).length);
 return left.sort((a,b)=>score(b)-score(a)||a.id.localeCompare(b.id))[0];
}
export function compoundSearch(data,horizon=14,budget=8,policy='adaptive'){
 const all=compoundCandidates(data.access),log=[],r=rng(data.seed+999);
 if(!Number.isInteger(budget)||budget<1||budget>all.length)throw Error(`候选预算需为 1–${all.length}`);
 for(let step=1;step<=budget;step++){
  const candidate=compoundNext(all,log,r,policy),result=compoundExperiment(data,horizon,candidate);
  log.push({step,candidate,metrics:result.metrics,utility:utility(result.metrics),remaining:budget-step});
 }
 return {policy,log,winner:[...log].sort((a,b)=>b.utility-a.utility)[0].candidate};
}
export function compoundBenchmark({seed=42,horizon=14,budget=8,world='interaction',access='full'}={}){
 const data=generateCompound(seed,world,access),adaptive=compoundSearch(data,horizon,budget),random=compoundSearch(data,horizon,budget,'random');
 const base=compoundCandidates(access).find(c=>c.id==='chem-0-thermal');
 // Both winners are frozen before reading test outcomes.
 const a=compoundExperiment(data,horizon,adaptive.winner,'test'),b=compoundExperiment(data,horizon,base,'test'),rows=compoundSamples(data,horizon,'test',base);
 const final={adaptive:a.metrics,random:compoundExperiment(data,horizon,random.winner,'test').metrics,local:b.metrics,climatology:metrics(rows,rows.map(()=>b.model.prevalence),b.model.prevalence)};
 const controls=['none','ablate','time-shift'].map(control=>({control,candidate:adaptive.winner,metrics:compoundExperiment(data,horizon,adaptive.winner,'test',control).metrics}));
 return {version:RESEARCH_VERSION,track:'compound',dataKind:'synthetic',seed,horizon,budget,world,access,splits:SPLITS,adaptive,random,final,controls,notes:['化学浓度和白化标签均为合成；未拟合真实珊瑚观测。','移除化学信息的对照保持赢家的滞后、分区和基础变量；不是因果检验。','规则模式每策略预算只计候选，负对照另计。','已冻结的同一候选在测试集评分；不得据此重新选择。']};
}

// Scenario visualization only; deliberately distinct from fitted probabilities.
export function chemicalScenario({heat=6,total=3,nitrateFraction=.7,pollutant=.4}={}){
 const nitrate=total*nitrateFraction,ammonium=total-nitrate;
 const z=-2.4+.28*heat+.12*total+.035*heat*nitrate-.025*heat*ammonium+.18*pollutant*nitrate;
 return {index:Math.round(100*sigmoid(z)),nitrate,ammonium,pollutant,kind:'synthetic-scenario-index'};
}
