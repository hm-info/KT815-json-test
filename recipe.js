(function(root){
  'use strict';
  const EDGES=[['Top','topScrews','#1670d6'],['Bottom','bottomScrews','#d87512'],['Left','leftScrews','#863ac5'],['Right','rightScrews','#098b95']];
  const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
  function parseRecipe(raw){
    if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('Recipe must be a JSON object.');
    for(const key of ['Width','Height'])if(typeof raw[key]!=='number'||!Number.isFinite(raw[key])||raw[key]<=0)throw Error(key+' must be a positive number.');
    if(!raw.espagnoletteData||typeof raw.espagnoletteData!=='object'||Array.isArray(raw.espagnoletteData))throw Error('espagnoletteData must contain the screw arrays.');
    const groups=[],warnings=[];let total=0;
    for(const [edge,key,color] of EDGES){
      const records=raw.espagnoletteData[key];
      if(!Array.isArray(records))throw Error(key+' must be an array (use [] for an empty edge).');
      const byPosition=new Map(),limit=edge==='Top'||edge==='Bottom'?raw.Width:raw.Height;
      records.forEach((r,i)=>{
        for(const k of ['screwingPos','screwingHeight','screwingDepth'])if(!r||typeof r[k]!=='number'||!Number.isFinite(r[k]))throw Error(key+'['+i+'].'+k+' must be a finite number.');
        if(r.screwingPos<0||r.screwingPos>limit)throw Error(edge+' position '+r.screwingPos+' is outside 0–'+limit+' mm.');
        if(!byPosition.has(r.screwingPos))byPosition.set(r.screwingPos,{id:edge+'-'+byPosition.size,edge,color,pos:r.screwingPos,records:[]});
        byPosition.get(r.screwingPos).records.push({...r,index:i+1});total++;
      });
      groups.push(...[...byPosition.values()].sort((a,b)=>a.pos-b.pos));
    }
    if(total>10000)throw Error('Recipe exceeds the 10,000-record viewer limit.');
    if(raw.hasMullion===true)warnings.push('Mullion is enabled but its geometry is not defined in this schema; only the perimeter is drawn.');
    if(total===0)warnings.push('This recipe contains no screw records.');
    warnings.push('Opening direction is not inferred. Profile section is schematic.');
    return {raw,groups,total,warnings};
  }
  function spread(values,min,max,gap){
    if(!values.length)return [];
    gap=Math.min(gap,(max-min)/Math.max(1,values.length-1));
    const out=values.map(v=>Math.max(min,Math.min(max,v)));
    for(let i=1;i<out.length;i++)out[i]=Math.max(out[i],out[i-1]+gap);
    if(out.at(-1)>max){out[out.length-1]=max;for(let i=out.length-2;i>=0;i--)out[i]=Math.min(out[i],out[i+1]-gap);}
    return out;
  }
  function geometry(model){
    const scale=Math.min(560/model.raw.Width,650/model.raw.Height),w=model.raw.Width*scale,h=model.raw.Height*scale;
    const x=(1100-w)/2,y=240;
    return {x,y,w,h,scale,points:model.groups.map(g=>({...g,x:g.edge==='Left'?x:g.edge==='Right'?x+w:x+w-g.pos*scale,y:g.edge==='Top'?y:g.edge==='Bottom'?y+h:y+h-g.pos*scale}))};
  }
  function draw(model,labels=true,selected=''){
    const {raw,groups,total}=model,{x,y,w,h,points}=geometry(model),bottom=y+h,svgH=bottom+200;
    const text=(px,py,s,size=16,color='#17334c',anchor='middle')=>`<text x="${px}" y="${py}" font-size="${size}" fill="${color}" text-anchor="${anchor}">${esc(s)}</text>`;
    const line=(a,b,c,d,color='#a4b6c3',extra='')=>`<path d="M${a} ${b}L${c} ${d}" stroke="${color}" fill="none" ${extra}/>`;
    let out=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1100 ${svgH}" width="1100" height="${svgH}" role="img" aria-label="Screwing plan for recipe ${esc(raw.id??'unnamed')}"><defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto-start-reverse"><path d="M0 0L8 4L0 8" fill="none" stroke="#17334c"/></marker></defs><rect width="1100" height="${svgH}" fill="white"/><g font-family="Segoe UI,Arial,sans-serif">`;
    out+=text(550,49,'SASH SCREWING PLAN',27)+text(550,80,'Recipe: '+String(raw.id??'Unnamed').slice(0,90),16)+text(550,110,`${total} records  /  ${groups.length} unique edge positions`,14,'#617585');
    out+=line(x,150,x+w,150,'#17334c','marker-start="url(#arrow)" marker-end="url(#arrow)"')+text(550,142,raw.Width+' mm',17)+line(x,156,x,y-18)+line(x+w,156,x+w,y-18);
    out+=line(90,y,90,bottom,'#17334c','marker-start="url(#arrow)" marker-end="url(#arrow)"')+text(53,(y+bottom)/2,raw.Height+' mm',16)+line(100,y,x-20,y)+line(100,bottom,x-20,bottom);
    const t=Math.min(25,w/5,h/5);
    out+=`<path d="M${x} ${y}H${x+w}V${bottom}H${x}Z M${x+t} ${y+t}V${bottom-t}H${x+w-t}V${y+t}Z" fill="#e5ebef" fill-rule="evenodd" stroke="#9baebb" stroke-width="1.5"/>`;
    for(const [edge,,color] of EDGES){
      const ps=points.filter(p=>p.edge===edge).sort((a,b)=>(edge==='Top'||edge==='Bottom')?a.x-b.x:a.y-b.y);
      const horizontal=edge==='Top'||edge==='Bottom';
      const positions=spread(ps.map(p=>horizontal?p.x:p.y),horizontal?x-20:y+8,horizontal?x+w+20:bottom-8,horizontal?80:27);
      if(horizontal)out+=line(x,edge==='Top'?y:bottom,x+w,edge==='Top'?y:bottom,color,'stroke-width="3"');
      else out+=line(edge==='Left'?x:x+w,y,edge==='Left'?x:x+w,bottom,color,'stroke-width="3"');
      ps.forEach((p,i)=>{
        if(labels){
          const lx=horizontal?positions[i]:edge==='Left'?x-45:x+w+45,ly=horizontal?edge==='Top'?y-35-(i%2)*27:bottom+38+(i%2)*27:positions[i];
          out+=line(p.x,p.y,lx,ly-5,color)+text(lx,ly,`${p.pos}${p.records.length>1?' ×'+p.records.length:''}`,14,color,horizontal?'middle':edge==='Left'?'end':'start');
        }
        out+=`<g data-point="${p.id}" tabindex="0" role="button" aria-label="${esc(p.edge+' position '+p.pos+', '+p.records.length+' records')}"><title>${esc(p.edge+' | Position '+p.pos+' mm | '+p.records.map(r=>'H '+r.screwingHeight+' / D '+r.screwingDepth).join('; '))}</title><circle cx="${p.x}" cy="${p.y}" r="${selected===p.id?12:8}" fill="${color}" stroke="${selected===p.id?'#17334c':'white'}" stroke-width="2"/><path d="M${p.x-4} ${p.y}h8 M${p.x} ${p.y-4}v8" stroke="white" stroke-width="1.5"/></g>`;
      });
    }
    out+=`<circle cx="${x+w}" cy="${bottom}" r="6" fill="white" stroke="#df4646" stroke-width="2"/>`+text(x+w+20,bottom+25,'(0,0)',14,'#df4646','start');
    out+=line(x+w-8,bottom+90,x+8,bottom+90,'#17334c','marker-end="url(#arrow)"')+text(550,bottom+115,'X · right to left',14);
    out+=line(x+w+180,bottom-5,x+w+180,y+5,'#17334c','marker-end="url(#arrow)"')+text(x+w+180,y-13,'Y ↑',14);
    if(w>230&&h>430){
      const cy=y+h*.28;
      out+=text(550,cy,'POSITION REFERENCE',15)+text(550,cy+29,'Top / Bottom: right → left',13)+text(550,cy+52,'Left / Right: bottom → top',13)+text(550,cy+84,'×n = records at one position',12,'#617585');
      out+=text(550,cy+130,'EDGE PARAMETERS · mm',14)+text(550,cy+152,'H = height / D = depth',12,'#617585');
      EDGES.forEach(([edge,,color],i)=>{
        const records=groups.filter(g=>g.edge===edge).flatMap(g=>g.records);
        const pairs=[...new Set(records.map(r=>'H '+r.screwingHeight+' / D '+r.screwingDepth))];
        const summary=pairs.length===0?'No records':pairs.length===1?pairs[0]:'Mixed values — see record details';
        out+=text(550,cy+184+i*27,edge+': '+summary,12,color);
      });
    }
    out+=text(550,svgH-42,'Units assumed to be mm. Coordinate arrows do not indicate operation order.',13,'#617585')+text(550,svgH-20,'Perimeter geometry only · Opening direction not specified',12,'#617585');
    return out+'</g></svg>';
  }
  const api={EDGES,esc,parseRecipe,geometry,draw};
  if(typeof module!=='undefined')module.exports=api;else root.Recipe=api;
})(typeof globalThis!=='undefined'?globalThis:this);
