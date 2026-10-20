'use strict';
const $=id=>document.getElementById(id),{esc,parseRecipe,draw}=Recipe;
const make=(pos,depth=0)=>({screwingPos:pos,screwingHeight:21.5,screwingDepth:depth});
const example={id:'037701010570172',IsSash:true,Width:860,Height:1622,hasMullion:false,Has3DHinge:false,HasRegularHinge:true,espagnoletteType:0,espagnoletteData:{topScrews:[291,580,196.5,467,70,70,840,840,840,840].map(p=>make(p)),bottomScrews:[502,213,596.5,326,70,70].map(p=>make(p,10)),leftScrews:[20,20,20,20,20,20,1602,1602,1602,1602].map(p=>make(p)),rightScrews:[706,419,505,884,1203,970,70,1552,70,1552].map(p=>make(p))}};
let model,selected='';
function message(s){$('message').textContent=s;}
function values(g,key){return [...new Set(g.records.map(r=>r[key]))].join(' / ');}
function renderGuide(){
  const fields=[
    ['id','Recipe identifier.'],
    ['Width','Overall sash or frame width; sets the top and bottom edge length.'],
    ['Height','Overall sash or frame height; sets the left and right edge length.'],
    ['IsSash','true = sash; false = frame.'],
    ['hasMullion','Whether a mullion is present. Its geometry is not defined by this schema.'],
    ['Has3DHinge','Whether a 3D hinge is specified.'],
    ['HasRegularHinge','Whether a regular hinge is specified.'],
    ['espagnoletteType','Espagnolette model to be installed. This is a model code; code-to-model-name mappings are not supplied.']
  ];
  const display=v=>v===undefined?'Not specified':JSON.stringify(v);
  const cellRow=(key,meaning,value)=>'<tr><td><code>'+esc(key)+'</code></td><td>'+esc(meaning)+'</td><td class="loaded-value">'+esc(value)+'</td></tr>';
  $('field-guide').innerHTML=fields.map(([key,meaning])=>cellRow(key,meaning,display(model.raw[key]))).join('')+
    Object.keys(model.raw).filter(key=>key!=='espagnoletteData'&&!fields.some(([k])=>k===key)).map(key=>cellRow(key,'Additional field; meaning not defined in this viewer.',display(model.raw[key]))).join('');
  $('array-guide').innerHTML=Recipe.EDGES.map(([edge,key,color])=>'<tr><td><code style="color:'+color+'">'+key+'</code></td><td>'+edge+' · '+(edge==='Top'||edge==='Bottom'?'right end → left':'bottom end → top')+'</td><td>'+model.raw.espagnoletteData[key].length+'</td></tr>').join('');
  const parameters=[
    ['screwingPos','Screw position along the relevant edge, measured from its zero point. Top/bottom: from the right end. Left/right: from the bottom end.'],
    ['screwingHeight','Vertical screwing height referenced from the machine table, as shown in the profile cross-section.'],
    ['screwingDepth','Horizontal positioning parameter in the profile cross-section. This is not the screw penetration length.']
  ];
  $('parameter-guide').innerHTML=parameters.map(([key,meaning])=>{
    const loaded=Recipe.EDGES.map(([edge,arrayKey])=>{
      const unique=[...new Set(model.raw.espagnoletteData[arrayKey].map(r=>r[key]))];
      return edge+': '+(unique.length?unique.slice(0,8).join(', ')+(unique.length>8?' … ('+unique.length+' distinct values)':'')+' mm':'No records');
    }).join(' · ');
    return '<div class="parameter"><h3><code>'+key+'</code></h3><p>'+meaning+'</p><p class="parameter-values">'+esc(loaded)+'</p></div>';
  }).join('');
  $('raw-json').textContent=JSON.stringify(model.raw,null,2);
}
function activateTab(name,focus=false){
  for(const view of ['plan','guide']){
    const active=view===name;
    $(view+'-tab').setAttribute('aria-selected',String(active));
    $(view+'-tab').tabIndex=active?0:-1;
    $(view+'-panel').hidden=!active;
  }
  $('plan-actions').hidden=name!=='plan';
  if(focus)$(name+'-tab').focus();
}
for(const view of ['plan','guide']){
  $(view+'-tab').onclick=()=>activateTab(view);
  $(view+'-tab').onkeydown=e=>{
    if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){
      e.preventDefault();
      activateTab(e.key==='Home'?'plan':e.key==='End'?'guide':view==='plan'?'guide':'plan',true);
    }
  };
}
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
function load(raw,name){const next=parseRecipe(raw);model=next;selected='';$('filename').textContent=name;$('edge').value='all';message('');render();renderGuide();}
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
