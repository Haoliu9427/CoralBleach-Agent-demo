import {scenarioRisk} from './engine.js';
export function comparisonVisuals(sites,horizon){
 const heat=sites.map(s=>`<div class="matrix-row"><span>${s.name}</span>${[7,14,30].map(h=>{const v=scenarioRisk(s,h),c=v>=70?'#f4c4b3':v>=40?'#f4e3bd':'#c7e3d8';return `<span class="matrix-cell ${h===horizon?'current':''}" style="background:${c}" title="${s.name} 未来第${h}天：${v}/100">${v}</span>`;}).join('')}</div>`).join('');
 document.getElementById('horizon-matrix').innerHTML='<div class="matrix-row matrix-head"><span>礁区</span><span>+7 天</span><span>+14 天</span><span>+30 天</span></div>'+heat;
 const points=sites.filter(s=>s.evidence==='A'),x=v=>50+v/12*380,y=v=>230-v/60*200;let svg='<svg viewBox="0 0 470 280" role="img" aria-label="合成DHW与模拟白化比例散点图">';
 for(let v=0;v<=60;v+=20)svg+=`<path d="M50 ${y(v)}H430" stroke="#e2eaea" stroke-dasharray="3 4"/><text x="39" y="${y(v)+4}" text-anchor="end" fill="#7a959c" font-size="10">${v}%</text>`;
 for(let v=0;v<=12;v+=4)svg+=`<text x="${x(v)}" y="250" text-anchor="middle" fill="#7a959c" font-size="10">${v}</text>`;
 for(const s of points)svg+=`<g><circle cx="${x(s.dhw)}" cy="${y(s.bleaching)}" r="7" fill="#69ae9d" stroke="#fff" stroke-width="2"/><title>${s.name}：DHW ${s.dhw}，模拟调查 ${s.bleaching}%</title><text x="${x(s.dhw)+10}" y="${y(s.bleaching)-9}" fill="#5d7c81" font-size="10">${s.name.split(' · ')[0]}</text></g>`;
 svg+='<text x="50" y="15" fill="#718a90" font-size="10">模拟白化比例</text><text x="240" y="276" text-anchor="middle" fill="#718a90" font-size="10">合成热压力 DHW / °C·周</text></svg>';
 document.getElementById('evidence-scatter').innerHTML=svg+`<div class="scatter-note">${points.length} 个定量调查点 · ${sites.length-points.length} 个未绘制（报告或未知）</div>`;
}
export function budgetVisual(result){
 const series=[result.adaptive.log,result.random.log].map(log=>{let best=-Infinity;return log.map(l=>best=Math.max(best,l.utility));}),flat=series.flat(),min=Math.min(...flat)-.03,max=Math.max(...flat)+.03,x=i=>55+i/(result.budget-1)*720,y=v=>195-(v-min)/(max-min)*165;
 let s='<svg viewBox="0 0 820 240" role="img" aria-label="自适应与随机搜索的最佳验证效用随实验步数变化">';
 for(let k=0;k<4;k++){const v=min+(max-min)*k/3;s+=`<path d="M55 ${y(v)}H775" stroke="#e3eaea"/><text x="40" y="${y(v)+4}" text-anchor="end" font-size="10" fill="#7d969b">${v.toFixed(2)}</text>`;}
 series.forEach((a,i)=>{const c=i?'#8b9bba':'#db947c';s+=`<polyline points="${a.map((v,j)=>`${x(j)},${y(v)}`).join(' ')}" stroke="${c}" fill="none" stroke-width="2.5"/>`;a.forEach((v,j)=>s+=`<circle cx="${x(j)}" cy="${y(v)}" r="3.5" fill="${c}"><title>${i?'随机':'自适应'} · 第${j+1}步 · 效用${v.toFixed(4)}</title></circle>`);});
 for(let i=0;i<result.budget;i++)s+=`<text x="${x(i)}" y="216" text-anchor="middle" fill="#7d969b" font-size="10">${i+1}</text>`;
 s+='<text x="420" y="237" text-anchor="middle" fill="#7d969b" font-size="10">已执行实验次数</text></svg><div class="chart-caption"><span><i class="dot" style="background:#db947c"></i>自适应</span><span><i class="dot" style="background:#8b9bba"></i>同预算随机搜索</span></div>';
 document.getElementById('budget-chart').innerHTML=s;
}
