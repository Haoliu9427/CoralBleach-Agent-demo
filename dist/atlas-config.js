export const ATLAS_URL='https://allencoralatlas.org/atlas/';
export function atlasLocation(value){
  const numbers={};for(const k of ['lat','lon','zoom']){if(value[k]==null||String(value[k]).trim()==='')throw Error('请填写纬度、经度和缩放级别。');numbers[k]=Number(value[k]);}
  if(!Number.isFinite(numbers.lat)||numbers.lat< -90||numbers.lat>90)throw Error('纬度应为 −90 到 90。');
  if(!Number.isFinite(numbers.lon)||numbers.lon< -180||numbers.lon>180)throw Error('经度应为 −180 到 180。');
  if(!Number.isFinite(numbers.zoom)||numbers.zoom<1||numbers.zoom>18)throw Error('Atlas 缩放级别应为 1 到 18。');return numbers;
}
export function atlasURL(value){const p=atlasLocation(value);return `${ATLAS_URL}#${p.zoom.toFixed(2)}/${p.lat.toFixed(4)}/${p.lon.toFixed(4)}`;}
export function parseAtlasURL(value){
  let u;try{u=new URL(value.trim());}catch{throw Error('请粘贴完整的 Allen Coral Atlas 定位链接。');}
  if(u.protocol!=='https:'||!['allencoralatlas.org','www.allencoralatlas.org'].includes(u.hostname)||u.username||u.password||u.port||u.pathname.replace(/\/$/,'')!=='/atlas')throw Error('仅接受 Allen Coral Atlas 官方 HTTPS 定位链接。');
  const p=u.hash.slice(1).split('/');if(p.length!==3)throw Error('链接中应包含 #缩放级别/纬度/经度。');return atlasLocation({zoom:p[0],lat:p[1],lon:p[2]});
}
export function setupAtlas({getSite,getView}){
  const $=id=>document.getElementById(id),key='coralbleach-atlas-v1';let saved=[];
  function fields(p){$('atlas-lat').value=p.lat;$('atlas-lon').value=p.lon;$('atlas-zoom').value=p.zoom;}
  function read(){return atlasLocation({lat:$('atlas-lat').value,lon:$('atlas-lon').value,zoom:$('atlas-zoom').value});}
  function point(){const mode=$('atlas-mode').value;if(mode==='site'){const s=getSite();return atlasLocation({lat:s?.lat??0,lon:s?.lon??0,zoom:$('atlas-zoom').value});}return read();}
  function refresh(){
    $('atlas-lat').disabled=$('atlas-lon').disabled=$('atlas-mode').value==='site';
    try{const p=point();if($('atlas-mode').value==='site')fields(p);$('atlas-link').href=atlasURL(p);$('atlas-link').removeAttribute('aria-disabled');$('atlas-link').textContent=$('atlas-mode').value==='site'?'在 Allen Coral Atlas 查看当前礁区 ↗':'在 Allen Coral Atlas 查看自定义位置 ↗';$('atlas-config-status').textContent=`定位：${p.lat.toFixed(4)}, ${p.lon.toFixed(4)} · 缩放 ${p.zoom.toFixed(2)}。仅改变外部地图入口。`;}
    catch(error){$('atlas-link').removeAttribute('href');$('atlas-link').setAttribute('aria-disabled','true');$('atlas-config-status').textContent=error.message;}
  }
  function favorites(){const sel=$('atlas-saved');sel.replaceChildren(new Option('选择已保存礁区',''));saved.forEach((s,i)=>sel.add(new Option(s.name,String(i))));}
  $('atlas-import').onclick=()=>{try{fields(parseAtlasURL($('atlas-url').value));$('atlas-mode').value='custom';refresh();}catch(error){$('atlas-config-status').textContent=error.message;}};
  $('atlas-use-view').onclick=()=>{const v=getView();fields(atlasLocation(v));$('atlas-mode').value='custom';refresh();};
  for(const id of ['atlas-mode','atlas-lat','atlas-lon','atlas-zoom'])$(id).onchange=refresh;
  $('atlas-save').onclick=()=>{try{const location=point(),name=$('atlas-name').value.trim().slice(0,60)||`${location.lat.toFixed(2)}, ${location.lon.toFixed(2)}`;saved=[...saved.filter(s=>s.name!==name),{name,...location}].slice(-10);localStorage.setItem(key,JSON.stringify({mode:$('atlas-mode').value,location,saved}));favorites();$('atlas-config-status').textContent='已保存在此浏览器；最多保留 10 个常用礁区。';}catch(error){$('atlas-config-status').textContent=error.name==='SecurityError'?'浏览器不允许保存；当前定位仍可使用。':error.message;}};
  $('atlas-saved').onchange=()=>{const item=saved[Number($('atlas-saved').value)];if($('atlas-saved').value!==''&&item){fields(item);$('atlas-name').value=item.name;$('atlas-mode').value='custom';refresh();}};
  $('atlas-clear').onclick=()=>{try{localStorage.removeItem(key);saved=[];favorites();$('atlas-mode').value='site';$('atlas-zoom').value=9;refresh();$('atlas-config-status').textContent='已恢复跟随当前礁区，并清除保存的定位。';}catch{$('atlas-config-status').textContent='浏览器存储不可用。';}};
  try{const d=JSON.parse(localStorage.getItem(key)||'null');if(d){fields(atlasLocation(d.location));$('atlas-mode').value=d.mode==='custom'?'custom':'site';saved=(d.saved||[]).slice(0,10).map(s=>({name:String(s.name).slice(0,60),...atlasLocation(s)}));}}catch{saved=[];}
  favorites();return {refresh};
}
