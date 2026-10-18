// Verified sources provide hypotheses, never fitted coefficients or labels.
export const RESEARCH_VERSION='coralbleach-compound-v1.1.0';
export const papers=[
 {id:'coral-cover',group:'coral',journal:'Nature Communications · 2026',title:'局地压力与长期珊瑚覆盖变化',finding:'北部南海长期资料提示，局地人为压力与珊瑚覆盖变化的关系存在区域差异。',task:'按区域背景分层，另用有日期的白化观测验证短期预警。',boundary:'长期活珊瑚覆盖变化不是短期白化标签。',url:'https://doi.org/10.1038/s41467-026-70760-1'},
 {id:'coral-nitrogen',group:'coral',journal:'Environmental Science & Technology · 2026',title:'氮形态与热白化响应',finding:'珊瑚实验中，硝酸盐与铵盐在所测条件下对应不同的热白化响应。',task:'比较总氮信息、氮形态与热暴露交互项。',boundary:'效应依赖实验条件，不推导补加铵盐的措施。',url:'https://doi.org/10.1021/acs.est.5c13276'},
 {id:'coral-prometryn',group:'coral',journal:'Environmental Science & Technology · 2026',title:'扑草净与硝酸盐共暴露',finding:'实验支持扑草净可能增加造礁珊瑚对硝酸盐胁迫的易感性。',task:'有浓度记录时，检验硝酸盐与扑草净交互。',boundary:'该研究没有直接验证热、氮、污染物的三重交互。',url:'https://doi.org/10.1021/acs.est.6c06486'},
 {id:'gcb',group:'prior',journal:'Global Change Biology · 2025',title:'热事件的响应取决于资源背景',finding:'极地浮游植物研究为复合暴露与资源背景分析提供前期经验。',task:'在相近热暴露下检验营养盐背景差异。',boundary:'浮游植物机制不直接移植为珊瑚机制。',url:'https://doi.org/10.1111/gcb.70132'},
 {id:'est-npp',group:'prior',journal:'Environmental Science & Technology · 2026',title:'暴露热点与生态响应可能错位',finding:'净初级生产力研究提供背景分层和空间错位分析经验。',task:'检验有物理依据的先行信号与滞后。',boundary:'空间关联不等于输运路径。',url:'https://doi.org/10.1021/acs.est.6c02934'},
 {id:'est-turtle',group:'prior',journal:'Environmental Science & Technology · 2026',title:'表观状态与生态后果分别核查',finding:'海龟研究提示表观驻留与复合暴露后果需要分别判断。',task:'分开存储环境风险、白化观测和随访。',boundary:'动物行为解释不作为珊瑚白化证据。',url:'https://doi.org/10.1021/acs.est.6c02104'},
 {id:'nc-rain',group:'prior',journal:'Nature Communications · 2026 · 第二作者',title:'遗漏环境因子可能改变判断',finding:'极端降水与海气碳通量研究提供遗漏因子检验经验。',task:'比较加入与移除条件后的排序和调查命中。',boundary:'海气碳通量不等于珊瑚钙化或白化。',url:'https://doi.org/10.1038/s41467-026-69847-6'}
];
export const chemicalModels=[
 {id:'thermal',name:'热暴露与局地背景',short:'热暴露',role:'共同基线：热、光照、敏感性、季节',requires:[],cost:'1 fit'},
 {id:'din',name:'合并氮指标',short:'合并氮',role:'加入 NO₃⁻ + NH₄⁺；合成器不含 NO₂⁻',requires:['din'],cost:'1 fit'},
 {id:'forms',name:'区分氮形态',short:'氮形态',role:'分别加入 NO₃⁻ 与 NH₄⁺',requires:['forms'],cost:'1 fit'},
 {id:'interactions',name:'热暴露 × 氮形态',short:'热×氮',role:'检验两种氮形态与热暴露的交互',requires:['forms'],cost:'1 fit'},
 {id:'copollution',name:'加入共污染',short:'共污染',role:'加入扑草净及 NO₃⁻ × 扑草净；不含三重交互',requires:['forms','prometryn'],cost:'1 fit'}
];
export const accessLabels={full:'氮形态 + 扑草净浓度',nutrients:'只有氮形态，污染物未测',din:'只有合并氮指标'};
export const worldLabels={interaction:'条件交互场景',null:'无化学增量反例',shift:'区域效应改变'};
export function availableModels(access='full'){
 if(!Object.hasOwn(accessLabels,access))throw Error('未知数据条件');
 const fields=new Set(access==='full'?['din','forms','prometryn']:access==='nutrients'?['din','forms']:['din']);
 return chemicalModels.filter(m=>m.requires.every(f=>fields.has(f)));
}
export function researchContext(track='spatial',access='full'){
 return {track,data_kind:'synthetic',sources:papers.map(({id,title,task,boundary,url})=>({id,title,task,boundary,url})),data_availability:track==='compound'?accessLabels[access]:'热压力、光照、敏感性与抽象相连环境信号',rules:['文献仅提供候选依据，参数由训练数据拟合。','没有实测或模拟可用浓度时不检验共污染模型。','热应激、白化、死亡分别定义；没有观测不记为零。']};
}
