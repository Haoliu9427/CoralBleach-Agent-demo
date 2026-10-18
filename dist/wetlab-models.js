// Browser-sized reference implementations. Hyperparameters are fixed before validation.
export const EXTRA_FAMILIES=[
 {id:'lasso',name:'Lasso 稀疏回归',short:'Lasso',category:'linear',note:'L1 惩罚使部分系数为零；坐标下降 500 轮。'},
 {id:'elastic',name:'弹性网络',short:'Elastic Net',category:'linear',note:'组合 L1 与 L2 惩罚，兼顾稀疏性与相关变量。'},
 {id:'lad',name:'最小绝对偏差',short:'LAD',category:'robust',note:'平滑绝对损失的迭代加权近似；降低极端残差影响。'},
 {id:'ransac',name:'RANSAC 回归',short:'RANSAC',category:'robust',note:'40 次随机子集与共识重拟合；8 个百分点的内点阈值。'},
 {id:'pcr',name:'主成分回归',short:'PCR',category:'latent',note:'训练输入的前 3 个主成分；可能丢失低方差预测信号。'},
 {id:'pls',name:'偏最小二乘',short:'PLS',category:'latent',note:'最多 3 个监督潜变量；训练标签参与投影方向估计。'},
 {id:'spline',name:'加性样条回归',short:'Spline',category:'smooth',note:'各变量训练分位点的线性铰链基，加 L2 惩罚。'},
 {id:'kernel',name:'RBF 核岭回归',short:'Kernel Ridge',category:'kernel',note:'高斯核相似度与正则化求解；不输出不确定性区间。'},
 {id:'svr',name:'线性支持向量回归',short:'ε-SVR',category:'kernel',note:'ε 不敏感损失的次梯度近似；固定 1400 轮，未保证收敛。'},
 {id:'extra',name:'极端随机树',short:'Extra Trees',category:'ensemble',note:'20 棵树，随机特征与阈值；不做自助采样。'},
 {id:'adaboost',name:'AdaBoost.R2',short:'AdaBoost',category:'ensemble',note:'按误差更新样本权重；最多 16 棵树，预测取加权中位数。'},
 {id:'mlp',name:'多层感知机',short:'MLP',category:'neural',note:'12 个 tanh 隐单元；全批量反向传播，400 轮。'},
 {id:'elm',name:'极限学习机',short:'ELM',category:'neural',note:'24 个固定随机隐单元；仅拟合正则化输出层。'},
 {id:'rbfnet',name:'径向基网络',short:'RBF Network',category:'neural',note:'训练集 k-means 中心与高斯基函数；岭回归输出层。'},
 {id:'loess',name:'局部线性回归',short:'LOESS',category:'smooth',note:'训练近邻的三立方权重与局部岭拟合；仅适合邻域内插。'},
 {id:'omp',name:'正交匹配追踪',short:'OMP',category:'linear',note:'按残差相关性逐步选取至多 4 个变量，再联合拟合。'}
];
export const CATEGORIES=[['all','全部类别'],['linear','线性与稀疏'],['robust','稳健回归'],['latent','潜变量'],['smooth','邻域与平滑'],['kernel','核与支持向量'],['tree','单树'],['ensemble','集成学习'],['neural','神经网络']];
const mean=a=>a.reduce((s,v)=>s+v,0)/a.length,dot=(a,b)=>a.reduce((s,v,j)=>s+v*b[j],0),dist=(a,b)=>a.reduce((s,v,j)=>s+(v-b[j])**2,0);
function randomTree(X,y,depth,random){
 if(!depth||y.length<6)return {value:mean(y)};let best=null;const columns=X[0].map((_,j)=>j);
 for(let i=columns.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[columns[i],columns[j]]=[columns[j],columns[i]];}
 for(const f of columns.slice(0,Math.max(1,Math.floor(Math.sqrt(columns.length))))){const lo=Math.min(...X.map(x=>x[f])),hi=Math.max(...X.map(x=>x[f]));for(let t=0;t<8;t++){const threshold=lo+(hi-lo)*random(),left=[],right=[];X.forEach((x,i)=>(x[f]<=threshold?left:right).push(i));if(left.length<3||right.length<3)continue;const l=mean(left.map(i=>y[i])),r=mean(right.map(i=>y[i])),loss=left.reduce((s,i)=>s+(y[i]-l)**2,0)+right.reduce((s,i)=>s+(y[i]-r)**2,0);if(!best||loss<best.loss)best={f,t:threshold,left,right,loss};}}
 if(!best)return {value:mean(y)};return {f:best.f,t:best.t,left:randomTree(best.left.map(i=>X[i]),best.left.map(i=>y[i]),depth-1,random),right:randomTree(best.right.map(i=>X[i]),best.right.map(i=>y[i]),depth-1,random)};
}
export function fitExtra(family,X,y,{random,linear,solve,treeFit,treePredict}){
 const n=y.length,p=X[0].length,base=mean(y),yc=y.map(v=>v-base);
 if(family==='lasso'||family==='elastic'){
  const w=Array(p).fill(0),pred=Array(n).fill(0),l1=family==='lasso'?.6:.3,l2=family==='lasso'?0:.3;
  for(let it=0;it<500;it++){let delta=0;for(let j=0;j<p;j++){let r=0,q=0;for(let i=0;i<n;i++){r+=X[i][j]*(yc[i]-pred[i]+w[j]*X[i][j])/n;q+=X[i][j]**2/n;}const next=Math.sign(r)*Math.max(0,Math.abs(r)-l1)/(q+l2),change=next-w[j];w[j]=next;delta=Math.max(delta,Math.abs(change));for(let i=0;i<n;i++)pred[i]+=change*X[i][j];}if(delta<1e-7)break;}
  return {predict:x=>base+dot(x,w),detail:{l1,l2,coefficients:w,nonzero:w.filter(v=>Math.abs(v)>1e-6).length}};
 }
 if(family==='lad'){
  let m=linear(X,y,.01);for(let i=0;i<40;i++)m=linear(X,y,.01,X.map((x,j)=>1/Math.sqrt((y[j]-m.predict(x))**2+.25)));
  return {...m,detail:{loss:'smoothed absolute residual',smoothing:.5,ridge:.01,iterations:40}};
 }
 if(family==='ransac'){
  let best=null;for(let t=0;t<40;t++){const ids=Array.from({length:n},(_,i)=>i);for(let i=n-1;i>0;i--){const j=Math.floor(random()*(i+1));[ids[i],ids[j]]=[ids[j],ids[i]];}const sub=ids.slice(0,Math.min(n,p+3));try{const m=linear(sub.map(i=>X[i]),sub.map(i=>y[i]),.01),inside=X.map((x,i)=>Math.abs(y[i]-m.predict(x))<=8?i:-1).filter(i=>i>=0),loss=inside.reduce((s,i)=>s+(y[i]-m.predict(X[i]))**2,0);if(inside.length>=p+1&&(!best||inside.length>best.ids.length||inside.length===best.ids.length&&loss<best.loss))best={ids:inside,loss};}catch{}}
  if(!best)throw Error('RANSAC 未找到足够的共识样本。');const m=linear(best.ids.map(i=>X[i]),best.ids.map(i=>y[i]),.01);return {...m,detail:{trials:40,inlier_threshold:8,inliers:best.ids.length}};
 }
 if(family==='pcr'){
  const A=X[0].map((_,j)=>X[0].map((_,k)=>X.reduce((s,x)=>s+x[j]*x[k],0)/n)),vectors=[];
  for(let k=0;k<Math.min(3,p);k++){let v=Array.from({length:p},()=>random()-.5);for(let it=0;it<100;it++){let a=A.map(r=>dot(r,v));for(const u of vectors){const z=dot(a,u);a=a.map((q,j)=>q-z*u[j]);}const norm=Math.sqrt(dot(a,a));if(norm<1e-9)break;v=a.map(q=>q/norm);}const eigen=dot(v,A.map(r=>dot(r,v)));if(eigen<1e-8)break;vectors.push(v);}
  if(!vectors.length)throw Error('主成分投影退化。');const transform=x=>vectors.map(v=>dot(x,v)),m=linear(X.map(transform),y,.01);return {predict:x=>m.predict(transform(x)),detail:{components:vectors.length,projection:'training covariance only'}};
 }
 if(family==='pls'){
  let E=X.map(x=>[...x]),f=[...yc];const components=[];
  for(let c=0;c<Math.min(3,p);c++){let w=Array.from({length:p},(_,j)=>E.reduce((s,x,i)=>s+x[j]*f[i],0));const norm=Math.sqrt(dot(w,w));if(norm<1e-9)break;w=w.map(v=>v/norm);const t=E.map(x=>dot(x,w)),tt=dot(t,t);if(tt<1e-9)break;const loading=w.map((_,j)=>E.reduce((s,x,i)=>s+x[j]*t[i],0)/tt),q=dot(f,t)/tt;components.push({w,loading,q});E=E.map((x,i)=>x.map((v,j)=>v-t[i]*loading[j]));f=f.map((v,i)=>v-q*t[i]);}
  return {predict:x=>{let a=[...x],out=base;for(const c of components){const t=dot(a,c.w);out+=c.q*t;a=a.map((v,j)=>v-t*c.loading[j]);}return out;},detail:{components:components.length,method:'PLS1 sequential deflation'}};
 }
 if(family==='spline'){
  const knots=Array.from({length:p},(_,j)=>{const v=X.map(x=>x[j]).sort((a,b)=>a-b);return [.25,.5,.75].map(q=>v[Math.floor((n-1)*q)]);}),transform=x=>x.flatMap((v,j)=>[v,...knots[j].map(k=>Math.max(0,v-k))]),m=linear(X.map(transform),y,2);
  return {predict:x=>m.predict(transform(x)),detail:{basis:'linear truncated-power additive splines',knots,penalty:2}};
 }
 if(family==='kernel'){
  const gamma=1/(2*p),kernel=(a,b)=>Math.exp(-gamma*dist(a,b)),K=X.map((a,i)=>X.map((b,j)=>kernel(a,b)+(i===j?.8:0))),alpha=solve(K,yc);
  return {predict:x=>base+X.reduce((s,z,i)=>s+alpha[i]*kernel(x,z),0),detail:{kernel:'RBF',gamma,lambda:.8,training_centers:n}};
 }
 if(family==='svr'){
  const target=yc.map(v=>v/25),w=Array(p).fill(0);let b=0;const epsilon=.04,lambda=.01;
  for(let epoch=0;epoch<1400;epoch++){const grad=w.map(v=>lambda*v);let gb=0;for(let i=0;i<n;i++){const e=dot(w,X[i])+b-target[i],g=Math.abs(e)>epsilon?Math.sign(e):0;gb+=g/n;for(let j=0;j<p;j++)grad[j]+=g*X[i][j]/n;}const rate=.06/Math.sqrt(1+epoch/25);for(let j=0;j<p;j++)w[j]-=rate*grad[j];b-=rate*gb;}
  return {predict:x=>base+25*(dot(w,x)+b),detail:{loss:'epsilon-insensitive',epsilon_percentage_points:1,lambda,iterations:1400,solver:'approximate batch subgradient',convergence_guaranteed:false}};
 }
 if(family==='extra'){
  const trees=Array.from({length:20},()=>randomTree(X,y,5,random));return {predict:x=>mean(trees.map(t=>treePredict(t,x))),detail:{trees:20,max_depth:5,bootstrap:false,random_thresholds_per_feature:8}};
 }
 if(family==='adaboost'){
  let weights=Array(n).fill(1/n);const trees=[];
  for(let j=0;j<16;j++){const ids=Array.from({length:n},()=>{const u=random();let sum=0;for(let i=0;i<n;i++){sum+=weights[i];if(sum>=u)return i;}return n-1;}),tree=treeFit(ids.map(i=>X[i]),ids.map(i=>y[i]),3,random,false),errors=X.map((x,i)=>Math.abs(y[i]-treePredict(tree,x))),max=Math.max(...errors,1e-9),loss=errors.map(e=>e/max),error=dot(weights,loss);
   if(error>=.5){if(!trees.length)throw Error('AdaBoost.R2 首个弱学习器误差不满足条件。');break;}
   if(error<1e-8){trees.push({tree,weight:20});break;}const beta=error/(1-error);trees.push({tree,weight:Math.log(1/beta)});weights=weights.map((w,i)=>w*beta**(1-loss[i]));const total=weights.reduce((s,v)=>s+v,0);weights=weights.map(w=>w/total);
  }
  return {predict:x=>{const a=trees.map(t=>({y:treePredict(t.tree,x),w:t.weight})).sort((a,b)=>a.y-b.y),half=a.reduce((s,t)=>s+t.w,0)/2;let sum=0;for(const t of a){sum+=t.w;if(sum>=half)return t.y;}return a.at(-1).y;},detail:{estimators:trees.length,algorithm:'AdaBoost.R2',prediction:'weighted median'}};
 }
 if(family==='mlp'){
  const h=12,W=Array.from({length:h},()=>Array.from({length:p},()=>(random()-.5)*.7)),bias=Array(h).fill(0),v=Array.from({length:h},()=>(random()-.5)*.2);let b=0;
  for(let epoch=0;epoch<400;epoch++){const dW=W.map(r=>r.map(()=>0)),db=Array(h).fill(0),dv=Array(h).fill(0);let d0=0;for(let i=0;i<n;i++){const z=W.map((r,k)=>Math.tanh(dot(r,X[i])+bias[k])),e=(dot(v,z)+b-yc[i]/25)*2/n;d0+=e;for(let k=0;k<h;k++){dv[k]+=e*z[k];const dz=e*v[k]*(1-z[k]**2);db[k]+=dz;for(let j=0;j<p;j++)dW[k][j]+=dz*X[i][j];}}const rate=.025;for(let k=0;k<h;k++){v[k]-=rate*(dv[k]+.002*v[k]);bias[k]-=rate*db[k];for(let j=0;j<p;j++)W[k][j]-=rate*(dW[k][j]+.002*W[k][j]);}b-=rate*d0;}
  return {predict:x=>base+25*(dot(v,W.map((r,k)=>Math.tanh(dot(r,x)+bias[k])))+b),detail:{hidden_units:h,activation:'tanh',epochs:400,training:'full-batch backpropagation',convergence_guaranteed:false}};
 }
 if(family==='elm'){
  const W=Array.from({length:24},()=>Array.from({length:p},()=>(random()-.5)*2)),bias=W.map(()=>random()*2-1),phi=x=>W.map((r,k)=>Math.tanh(dot(r,x)+bias[k])),m=linear(X.map(phi),y,1);
  return {predict:x=>m.predict(phi(x)),detail:{random_hidden_units:24,activation:'tanh',output_ridge:1}};
 }
 if(family==='rbfnet'){
  const k=Math.min(10,Math.floor(n/3)),centers=[X[Math.floor(random()*n)].slice()];
  while(centers.length<k){const d=X.map(x=>Math.min(...centers.map(c=>dist(x,c)))),sum=d.reduce((s,v)=>s+v,0);let u=random()*sum,idx=n-1;for(let i=0;i<n;i++){u-=d[i];if(u<=0){idx=i;break;}}centers.push(X[idx].slice());}
  for(let t=0;t<12;t++){const bins=centers.map(()=>[]);X.forEach(x=>{let best=0;centers.forEach((c,j)=>{if(dist(x,c)<dist(x,centers[best]))best=j;});bins[best].push(x);});bins.forEach((bin,j)=>{if(bin.length)centers[j]=centers[j].map((_,f)=>mean(bin.map(x=>x[f])));});}
  const phi=x=>centers.map(c=>Math.exp(-dist(x,c)/(2*p))),m=linear(X.map(phi),y,.5);return {predict:x=>m.predict(phi(x)),detail:{centers:k,kmeans_iterations:12,basis:'Gaussian',output_ridge:.5}};
 }
 if(family==='loess'){
  return {predict:x=>{const ids=X.map((z,i)=>({i,d:Math.sqrt(dist(x,z))})).sort((a,b)=>a.d-b.d).slice(0,Math.min(n,Math.max(p+3,Math.ceil(n*.6)))),radius=Math.max(1e-6,ids.at(-1).d*1.001),weights=ids.map(a=>(1-(a.d/radius)**3)**3);return linear(ids.map(a=>X[a.i]),ids.map(a=>y[a.i]),.5,weights).predict(x);},detail:{span:.6,kernel:'tricube',local_ridge:.5}};
 }
 if(family==='omp'){
  const selected=[];let residual=[...yc],m;
  for(let t=0;t<Math.min(4,p);t++){let best=-1,score=0;for(let j=0;j<p;j++){if(selected.includes(j))continue;const s=Math.abs(X.reduce((a,x,i)=>a+x[j]*residual[i],0));if(s>score){best=j;score=s;}}if(best<0)break;selected.push(best);m=linear(X.map(x=>selected.map(j=>x[j])),y,1e-6);residual=y.map((v,i)=>v-m.predict(selected.map(j=>X[i][j])));}
  if(!m)throw Error('OMP 未找到与训练残差相关的变量。');return {predict:x=>m.predict(selected.map(j=>x[j])),detail:{selected_column_indices:selected,max_terms:4}};
 }
 throw Error('未知扩展算法。');
}
