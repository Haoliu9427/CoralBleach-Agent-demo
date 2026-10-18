// Geographic context is independent of synthetic environmental/biological values.
const ATLAS='https://allencoralatlas.org/atlas/';
export function createReefMap({geo,onSelect}){
 const L=window.L,root=document.getElementById('map'),status=document.getElementById('atlas-status');
 if(!L){root.textContent='地图组件未加载；可从下方入口查看官方 Atlas。';return {update(){},focus(){},reset(){},resize(){}};}
 const map=L.map(root,{scrollWheelZoom:false,minZoom:0,maxZoom:12,worldCopyJump:true,zoomSnap:.25,attributionControl:true});
 const globalView=()=>map.fitBounds([[-58,-180],[75,180]],{padding:[3,6],animate:false});globalView();
 map.attributionControl.setPrefix(false);
 L.geoJSON(geo,{style:{color:'#52717a',weight:.6,fillColor:'#33535d',fillOpacity:1},interactive:false,attribution:'陆地：Natural Earth（公共领域）'}).addTo(map);
 const points=L.layerGroup().addTo(map);
 let selected=null,tiles=null,errors=0,loaded=0;
 const atlasLink=document.getElementById('atlas-link');
 function updateLink(){atlasLink.href=selected?`${ATLAS}#9.00/${selected.lat.toFixed(4)}/${selected.lon.toFixed(4)}`:ATLAS;}
 function update(sites,site,layer,risk,color){selected=site;updateLink();points.clearLayers();for(const s of sites){const c=layer==='risk'?color(risk(s)):layer==='evidence'?(s.evidence==='A'?'#67c0aa':s.evidence==='B'?'#e0c185':'#90a1aa'):(s.outcome?'#b7a2d8':'#82939c');const marker=L.circleMarker([s.lat,s.lon],{radius:s.id===site.id?8:5.5,color:s.id===site.id?'#fff':c,weight:2,fillColor:c,fillOpacity:1}).addTo(points);marker.bindTooltip(`${s.name} · 合成演示锚点`,{direction:'top'});marker.on('click',()=>onSelect(s.id));} }
 document.getElementById('atlas-toggle').onchange=e=>{
  if(!e.target.checked){if(tiles)map.removeLayer(tiles);tiles=null;status.textContent='官方图层未开启 · 合成锚点不表示全球礁区分布';return;}
  errors=0;loaded=0;status.textContent='正在请求官方礁区地貌图层…';
  tiles=L.tileLayer.wms('https://allencoralatlas.org/geoserver/wms',{layers:'coral-atlas:geomorphic_data_verbose',format:'image/png',transparent:true,version:'1.1.1',crs:L.CRS.EPSG4326,opacity:.8,maxZoom:12,bounds:[[-32,-180],[32,180]],attribution:'礁区地貌 © 2018–2023 <a href="https://allencoralatlas.org/attribution/" target="_blank" rel="noopener">Allen Coral Atlas Partnership & ASU</a> · CC BY 4.0'});
  tiles.on('tileload',()=>{loaded++;});tiles.on('tileerror',()=>{errors++;});
  tiles.on('load',()=>{status.textContent=errors?`官方图层加载${loaded?'不完整':'失败'} · 请使用 Atlas 定位入口查看；未用合成分布替代`:'官方礁区地貌图层已加载 · 放大查看浅水礁区，不表示白化状态';});
  tiles.addTo(map);
 };
 new ResizeObserver(()=>map.invalidateSize({pan:false})).observe(root);
 return {update,focus(){if(selected)map.setView([selected.lat,selected.lon],8);},reset:globalView,resize(){map.invalidateSize({pan:false});}};
}
