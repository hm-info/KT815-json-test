'use strict';
const $=id=>document.getElementById(id),{esc,parseRecipe,draw}=Recipe;
const make=(pos,depth=0)=>({screwingPos:pos,screwingHeight:21.5,screwingDepth:depth});
const example={id:'037701010570172',IsSash:true,Width:860,Height:1622,hasMullion:false,Has3DHinge:false,HasRegularHinge:true,espagnoletteType:0,espagnoletteData:{topScrews:[291,580,196.5,467,70,70,840,840,840,840].map(p=>make(p)),bottomScrews:[502,213,596.5,326,70,70].map(p=>make(p,10)),leftScrews:[20,20,20,20,20,20,1602,1602,1602,1602].map(p=>make(p)),rightScrews:[706,419,505,884,1203,970,70,1552,70,1552].map(p=>make(p))}};
let model,selected='';
function message(s){$('message').textContent=s;}
function values(g,key){return [...new Set(g.records.map(r=>r[key]))].join(' / ');}
function render(){
  $('drawing').innerHTML=draw(model,$('labels').checked,selected);
  $('recipe-id').textContent=model.raw.id??'Unnamed recipe';
  $('stats').innerHTML=[['Size',model.raw.Width+' × '+model.raw.Height],['Records',model.total],['Positions',model.groups.length]].map(([k,v])=>`<div class="stat"><strong style="${k==='Size'?'font-size:14px':''}">${esc(v)}</strong><small>${k}</small></div>`).join('');
  const flags=[];
  for(const [k,yes,no] of [['IsSash','Sash','Frame'],['hasMullion','Mullion present','No mullion'],['HasRegularHinge','Regular hinge',''],['Has3DHinge','3D hinge','']]){if(typeof model.raw[k]==='boolean'&&(model.raw[k]?yes:no))flags.push(model.raw[k]?yes:no);}
  $('flags').textContent=flags.join(' · ')||'No hardware flags specified';
  $('warnings').textContent=model.warnings.join(' ');
  $('rows').innerHTML=model.groups.filter(g=>$('edge').value==='all'||g.edge===$('edge').value).map(g=>`<tr data-point="${g.id}" tabindex="0" class="${g.id===selected?'selected':''}"><td style="color:${g.color}">${g.edge}</td><td>${g.pos}</td><td>×${g.records.length}</td><td>${values(g,'screwingHeight')}</td><td>${values(g,'screwingDepth')}</td></tr>`).join('');
  const g=model.groups.find(g=>g.id===selected);
  $('selection').innerHTML=g?`<h3 style="color:${g.color}">${g.edge} · ${g.pos} mm · ×${g.records.length}</h3><p>Reference: ${g.edge==='Top'||g.edge==='Bottom'?'right end':'bottom end'}. Values below are in mm.</p>`+g.records.map(r=>`<div class="record">Source record ${r.index} · Height <b>${r.screwingHeight}</b> · Depth <b>${r.screwingDepth}</b></div>`).join(''):'<p>Select a point on the drawing or a row below.</p>';
}
function load(raw,name){const next=parseRecipe(raw);model=next;selected='';$('filename').textContent=name;$('edge').value='all';message('');render();}
async function openFile(file){if(!file)return;try{if(file.size>5*1024*1024)throw Error('File exceeds the 5 MB limit.');load(JSON.parse((await file.text()).replace(/^\uFEFF/,'')),file.name);}catch(e){message('Could not open recipe: '+e.message);}}
$('file').addEventListener('change',e=>{openFile(e.target.files[0]);e.target.value='';});
$('sample').onclick=()=>load(example,'Example · 037701010570172 SCREW_EDITED.json');
$('labels').onchange=render;$('edge').onchange=render;$('print').onclick=()=>window.print();
let printFilter;
window.addEventListener('beforeprint',()=>{printFilter=$('edge').value;$('edge').value='all';render();});
window.addEventListener('afterprint',()=>{if(printFilter!==undefined){$('edge').value=printFilter;printFilter=undefined;render();}});
function selectPoint(e){const p=e.target.closest('[data-point]');if(p){selected=p.dataset.point;render();}}
document.addEventListener('click',selectPoint);
document.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.closest('[data-point]')){e.preventDefault();selectPoint(e);}});
document.addEventListener('dragover',e=>{e.preventDefault();document.body.classList.add('dragging');});
document.addEventListener('dragleave',e=>{if(!e.relatedTarget)document.body.classList.remove('dragging');});
document.addEventListener('drop',e=>{e.preventDefault();document.body.classList.remove('dragging');openFile(e.dataTransfer.files[0]);});
function save(blob,ext){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=String(model.raw.id??'recipe').replace(/[^a-zA-Z0-9_-]/g,'_')+'-screwing-plan.'+ext;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);}
$('svg-export').onclick=()=>save(new Blob([draw(model,$('labels').checked)],{type:'image/svg+xml;charset=utf-8'}),'svg');
$('png-export').onclick=async()=>{
  const button=$('png-export');button.disabled=true;
  const url=URL.createObjectURL(new Blob([draw(model,$('labels').checked)],{type:'image/svg+xml;charset=utf-8'}));
  try{const image=new Image();image.src=url;await image.decode();const canvas=document.createElement('canvas');canvas.width=image.naturalWidth*2;canvas.height=image.naturalHeight*2;canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw Error('PNG encoding failed.');save(blob,'png');message('PNG exported successfully.');}catch(e){message('PNG export failed: '+e.message);}finally{URL.revokeObjectURL(url);button.disabled=false;}
};
load(example,'Example · 037701010570172 SCREW_EDITED.json');
