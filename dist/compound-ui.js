import {chemicalModels,availableModels,papers,accessLabels} from './research.js';
import {chemicalScenario,compoundCandidates} from './compound.js';
const $=id=>document.getElementById(id);
export function setupCompoundUI(){
 function draw(){
  const total=Number($('chem-total').value),heat=Number($('chem-heat').value),pollutant=Number($('chem-pollutant').value);
  $('chem-total-out').textContent=total.toFixed(1)+' μmol/L';$('chem-heat-out').textContent=heat.toFixed(1)+' °C·周';$('chem-pollutant-out').textContent=pollutant.toFixed(1)+' μg/L';
  const scenarios=[['硝酸盐占 80%',.8],['两种氮各 50%',.5],['铵盐占 80%',.2]];
  $('chem-chart').innerHTML=scenarios.map(([name,nitrateFraction])=>{const a=chemicalScenario({total,heat,nitrateFraction,pollutant:0}),b=chemicalScenario({total,heat,nitrateFraction,pollutant});return `<div class="chem-bar-row"><div><b>${name}</b><small>NO₃⁻ ${a.nitrate.toFixed(1)} / NH₄⁺ ${a.ammonium.toFixed(1)} μmol/L</small></div><div class="chem-bar-pair"><div><span style="width:${a.index}%;background:#76ad9f"></span><b>${a.index}</b></div><div><span style="width:${b.index}%;background:#e2957b"></span><b>${b.index}</b></div></div></div>`;}).join('');
 }
 ['chem-total','chem-heat','chem-pollutant'].forEach(id=>$(id).oninput=draw);draw();
 function sync(){
  const chem=$('research-track').value==='compound',access=$('data-access').value,models=availableModels(access),n=chem?compoundCandidates(access).length:24;
  $('compound-options').classList.toggle('hidden',!chem);$('model-eligibility').classList.toggle('hidden',!chem);
  $('candidate-count').textContent=n;$('track-description').innerHTML=chem?'路线：氮形态与共污染<br>环境滞后：0 / 7 / 14 / 30 天<br>共享 Logistic 拟合，比较不同变量组合':'路线：局地 / 邻域 / 方向性连接<br>环境滞后：0 / 7 / 14 / 30 天<br>模型：加性 / 含交互项 Logistic';
  $('pool-description').textContent=chem?`${models.length} 组变量方案 · 同一拟合器`:'加性 Logistic · 交互项 Logistic';
  $('model-eligibility').innerHTML=chemicalModels.map(m=>{const enabled=models.includes(m);return `<div class="model-option ${enabled?'':'unavailable'}"><span>${enabled?'可运行':'跳过'}</span><b>${m.name}</b><p>${m.role}</p><small>${enabled?'每个候选消耗 1 次拟合':m.id==='copollution'?'缺少污染物浓度':'缺少分开的氮形态数据'}</small></div>`;}).join('');
  const old=$('budget').value;$('budget').replaceChildren(...[4,8,12,16,20,24].filter(v=>v<=n).map(v=>new Option(String(v),String(v))));$('budget').value=Number(old)<=n?old:'8';
  $('budget-note').textContent=chem?`当前数据：${accessLabels[access]}。规则模式每策略最多 ${n} 次候选拟合，另计对照；LLM 模式的候选与负对照共用预算，至少留两步复核。`:'规则模式每策略预算只计候选，负对照另计；LLM 模式候选与负对照共用预算，至少留两步复核。';
 }
 $('research-track').onchange=()=>{sync();$('research-question').value=$('research-track').value==='compound'?'在热暴露已知时，区分硝酸盐和铵盐能否改善独立礁区白化排序？只使用可用字段，有污染物浓度才检验共污染，为移除化学信息和错时对照保留预算。':'相近热压力下，光照和先行环境信号能否改善白化预测？比较两种科学模型，为反向和错时对照保留预算。';};
 $('data-access').onchange=sync;sync();
 $('study-chemistry').onclick=()=>{$('research-track').value='compound';$('research-track').onchange();document.querySelector('[data-tab="lab"]').click();};
 for(const group of ['coral','prior'])$('papers-'+group).innerHTML=papers.filter(p=>p.group===group).map(p=>`<article class="paper-card"><small>${p.journal}</small><h3><a href="${p.url}" target="_blank" rel="noopener">${p.title} ↗</a></h3><p>${p.finding}</p><p><b>对应检验：</b>${p.task}</p><p class="fine">${p.boundary}</p></article>`).join('');
 return {config(){return {track:$('research-track').value,access:$('data-access').value,world:$('synthetic-world').value};}};
}
