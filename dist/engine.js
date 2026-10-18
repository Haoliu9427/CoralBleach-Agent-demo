// Synthetic benchmark v1. All probabilities and labels are simulated.
export const VERSION = 'coralbleach-synthetic-v1.0.0';
export const sigmoid = x => 1 / (1 + Math.exp(-Math.max(-30, Math.min(30, x))));
export const clamp = (x,a=0,b=1) => Math.max(a,Math.min(b,x));
export function rng(seed) { let s=seed>>>0; return ()=>{s+=0x6D2B79F5;let t=Math.imul(s^s>>>15,1|s);t^=t+Math.imul(t^t>>>7,61|t);return ((t^t>>>14)>>>0)/4294967296;}; }
export const candidates = () => ['local','neighbor','directional'].flatMap(route=>[0,7,14,30].flatMap(lag=>['additive','interaction'].map(model=>({route,lag,model,id:`${route}-${lag}-${model}`}))));
export function generate(seed=42) {
  const r=rng(seed), n=12, days=740, series=[];
  for(let i=0;i<n;i++){
    let heat=0, light=0, flow=0;
    const a=[];
    for(let t=0;t<days;t++){
      heat=.94*heat+(r()-.5)*1.1; light=.90*light+(r()-.5)*1.2; flow=.96*flow+(r()-.5)*1.3;
      a.push({heat:heat+.6*Math.sin(t/27+i),light,flow,sensitivity:.25+.5*r(),season:Math.sin(t*2*Math.PI/365),day:t,reef:i});
    }series.push(a);
  }
  const outcomes=series.map((a,i)=>a.map((x,t)=>{
    const up=series[(i+1)%n][Math.max(0,t-14)].flow;
    const p=sigmoid(-1.8+1.15*x.heat+.65*x.light+.8*x.heat*x.light+1.55*up+.5*x.sensitivity);
    return {y:r()<p?1:0};
  }));
  return {version:VERSION,seed,series,outcomes,days,n};
}
export function features(data,i,t,c,control='none') {
  if(t<30||t>=data.days) throw Error('Feature time out of bounds');
  const x=data.series[i][t];
  const out=[x.heat,x.light,x.sensitivity,x.season];
  let dt=t-c.lag;
  // A deterministic 31-day earlier offset is a time-misalignment control; it never reads the future.
  if(control==='time-shift')dt=Math.max(0,dt-31);
  if(c.route==='local')out.push(data.series[i][dt].heat);
  else if(c.route==='neighbor')out.push((data.series[(i+1)%data.n][dt].flow+data.series[(i+data.n-1)%data.n][dt].flow)/2);
  else out.push(data.series[(i+(control==='reverse'?data.n-1:1))%data.n][dt].flow);
  if(c.model==='interaction')out.push(x.heat*x.light,x.heat*x.sensitivity);
  return out;
}
export const SPLITS={train:{reefs:[0,1,2,3,4,5,6,7],start:90,end:360},validation:{reefs:[8,9],start:435,end:525},test:{reefs:[10,11],start:600,end:690}};
export function samples(data,horizon,split,c,control='none') {
  if(![7,14,30].includes(horizon))throw Error('Unsupported forecast horizon');
  const spec=SPLITS[split];if(!spec)throw Error('Unknown split');
  return spec.reefs.flatMap(i=>{const rows=[];for(let t=spec.start;t<=spec.end;t+=3)rows.push({x:features(data,i,t,c,control),y:data.outcomes[i][t+horizon].y,reef:i,origin:t,target:t+horizon,latestInput:t});return rows;});
}
export function fit(rows) {
  const n=rows.length,p=rows[0].x.length;
  const mean=Array(p).fill(0),sd=Array(p).fill(0);
  rows.forEach(r=>r.x.forEach((v,j)=>mean[j]+=v/n));
  rows.forEach(r=>r.x.forEach((v,j)=>sd[j]+=(v-mean[j])**2/n));sd.forEach((v,j)=>sd[j]=Math.sqrt(v)||1);
  const X=rows.map(r=>[1,...r.x.map((v,j)=>(v-mean[j])/sd[j])]),w=Array(p+1).fill(0);
  for(let k=0;k<140;k++){
    const grad=Array(p+1).fill(0);
    rows.forEach((r,i)=>{const err=sigmoid(X[i].reduce((s,v,j)=>s+v*w[j],0))-r.y;X[i].forEach((v,j)=>grad[j]+=err*v/n);});
    w.forEach((v,j)=>w[j]-=.2*(grad[j]+(j?.015*v:0)));
  }
  return {w,mean,sd,prevalence:rows.reduce((s,r)=>s+r.y,0)/n};
}
export function predict(model,x){return sigmoid(model.w[0]+x.reduce((s,v,j)=>s+(v-model.mean[j])/model.sd[j]*model.w[j+1],0));}
export function metrics(rows,p,reference=.2) {
  const n=rows.length, positives=rows.reduce((s,r)=>s+r.y,0);
  const order=p.map((v,i)=>({p:v,y:rows[i].y,i})).sort((a,b)=>b.p-a.p||a.i-b.i);
  let ap=0,tp=0,lastRecall=0;
  for(let i=0;i<n;){let j=i;while(j<n&&order[j].p===order[i].p){tp+=order[j].y;j++;}const recall=positives?tp/positives:0;ap+=(recall-lastRecall)*tp/j;lastRecall=recall;i=j;}
  const brier=p.reduce((s,v,i)=>s+(v-rows[i].y)**2,0)/n;
  const ref=rows.reduce((s,r)=>s+(reference-r.y)**2,0)/n;
  let ece=0;for(let b=0;b<5;b++){const ids=p.map((v,i)=>({v,i})).filter(o=>Math.min(4,Math.floor(o.v*5))===b);if(ids.length)ece+=Math.abs(ids.reduce((s,o)=>s+o.v-rows[o.i].y,0))/n;}
  const k=Math.ceil(n*.2),captured=order.slice(0,k).reduce((s,o)=>s+o.y,0);
  return {n,positives,ap:positives?ap:null,brier,bss:ref>0?1-brier/ref:null,ece,recall20:positives?captured/positives:null,k,captured,falseAlarms:k-captured,status:positives<10||n-positives<10?'DEFER':'EVALUATED'};
}
export function experiment(data,horizon,c,split='validation',control='none') {
  const train=samples(data,horizon,'train',c,control), model=fit(train), rows=samples(data,horizon,split,c,control),p=rows.map(r=>predict(model,r.x));
  return {candidate:c,metrics:metrics(rows,p,model.prevalence),model};
}
// Selection receives only completed validation feedback, never an evaluation oracle.
export function nextAction(all,log,random,policy='adaptive') {
  const remaining=all.filter(c=>!log.some(l=>l.candidate.id===c.id));
  if(!remaining.length)throw Error('No remaining candidates');
  if(policy==='random')return remaining[Math.floor(random()*remaining.length)];
  if(!log.length)return remaining.find(c=>c.id==='local-0-additive')||remaining[0];
  const best=[...log].sort((a,b)=>b.utility-a.utility)[0].candidate;
  const score=c=> .22/(1+log.filter(l=>l.candidate.route===c.route).length)+.13/(1+log.filter(l=>l.candidate.lag===c.lag).length)+(c.route===best.route?.12:0)+(c.lag===best.lag?.08:0)+(c.model!==best.model?.015:0);
  return remaining.sort((a,b)=>score(b)-score(a)||a.id.localeCompare(b.id))[0];
}
export const utility=m=>(m.ap??0)-.5*m.brier-.2*m.ece;
export function search(data,horizon=14,budget=8,policy='adaptive',onStep=()=>{}) {
  if(!Number.isInteger(budget)||budget<1||budget>24)throw Error('Budget must be 1..24');
  const all=candidates(),log=[],random=rng(data.seed+999);
  for(let step=1;step<=budget;step++){
    const c=nextAction(all,log,random,policy),result=experiment(data,horizon,c);
    const row={step,candidate:c,metrics:result.metrics,utility:utility(result.metrics),remaining:budget-step};log.push(row);onStep(row);
  }
  const winner=[...log].sort((a,b)=>b.utility-a.utility)[0].candidate;
  return {policy,log,winner};
}
export function benchmark({seed=42,horizon=14,budget=8}={}) {
  const data=generate(seed), adaptive=search(data,horizon,budget),random=search(data,horizon,budget,'random');
  // Freeze both winners before opening the final split.
  const base={route:'local',lag:0,model:'additive',id:'local-0-additive'};
  const a=experiment(data,horizon,adaptive.winner,'test'),b=experiment(data,horizon,base,'test');
  const testRows=samples(data,horizon,'test',base);
  const final={adaptive:a.metrics,random:experiment(data,horizon,random.winner,'test').metrics,local:b.metrics,climatology:metrics(testRows,testRows.map(()=>b.model.prevalence),b.model.prevalence)};
  const direction={route:'directional',lag:7,model:'interaction',id:'directional-7-interaction'};
  const controls=['none','reverse','time-shift'].map(control=>({control,candidate:direction,metrics:experiment(data,horizon,direction,'test',control).metrics}));
  return {version:VERSION,dataKind:'synthetic',seed,horizon,budget,splits:SPLITS,adaptive,random,final,controls,notes:['Final test is opened only after selection.','Controls are pre-registered directional-7-interaction comparisons.','Synthetic findings are not evidence of ocean transport or real forecasting skill.']};
}
export function scenarioRisk(site,horizon=14,delta={heat:0,light:0,mixing:0}) {
  const heat=clamp(site.dhw+(delta.heat||0),0,20),light=clamp(site.light+(delta.light||0),0,100),mixing=clamp(site.mixing+(delta.mixing||0),0,100);
  // Transparent arbitrary scenario index, intentionally not a fitted or calibrated probability.
  const z=-2.6+.30*heat+.012*light-.015*mixing+.012*site.sensitivity+.0015*heat*light;
  return Math.round(100*clamp(sigmoid(z)*(1+.12*Math.log(horizon/14))));
}
