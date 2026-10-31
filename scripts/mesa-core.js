/** Herramientas de mesa independientes de Foundry: búsqueda, turnos y perfiles de NPC. */
export const normalizar=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
export function textoPlano(s){return String(s??'').replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi,' ').replace(/<[^>]*>/g,' ').replace(/&(?:nbsp|amp|lt|gt|quot|#39);/g,x=>({'&nbsp;':' ','&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&#39;':"'"}[x])).replace(/\s+/g,' ').trim();}
export function buscarEntradas(entradas,consulta,limite=60){
 const q=normalizar(consulta).trim().slice(0,160),palabras=q.split(/\s+/).filter(Boolean);if(!palabras.length)return [];
 return entradas.map(e=>{
  const nombre=normalizar(e.nombre),texto=normalizar(textoPlano(e.texto));if(!palabras.every(p=>nombre.includes(p)||texto.includes(p)))return null;
  const pos=texto.indexOf(palabras.find(p=>texto.includes(p))??''),inicio=Math.max(0,pos-70);
  const limpio=textoPlano(e.texto);return {...e,puntos:(nombre===q?100:0)+(nombre.includes(q)?30:0)+palabras.filter(p=>nombre.includes(p)).length*8,
   extracto:(inicio?'…':'')+limpio.slice(inicio,inicio+260)+(limpio.length>inicio+260?'…':'')};
 }).filter(Boolean).sort((a,b)=>b.puntos-a.puntos||a.nombre.localeCompare(b.nombre,'es')).slice(0,limite);
}
export function claveTurno(actorId,combate){
 if(!combate?.started)return 'fuera';const orden=Array.from(combate.turns??[]),i=orden.findIndex(c=>(c.actor?.id??c.actorId)===actorId);
 // Una reacción persiste durante los turnos ajenos y se renueva al empezar el propio.
 return `${combate.id}:${Number(combate.round)-(i>=0&&Number(combate.turn)<i?1:0)}`;
}
export const ROLES_NPC={guardian:'Guardián',hostigador:'Hostigador',tirador:'Tirador',místico:'Místico',apoyo:'Apoyo',civil:'Civil'};
const anclas=[
 [0,4,10,2,1],[0.125,7,11,3,3],[0.25,11,12,3,4],[0.5,20,12,3,6],[1,30,13,4,9],
 [2,45,13,4,14],[3,60,13,5,20],[5,90,15,6,33],[8,130,16,7,49],[11,165,17,8,65],[16,215,18,10,90],[20,270,19,11,115]
];
export function perfilNpc({vd=1,rol='guardian',nombre='Habitante de Nimerios',entorno='',motivacion='',vinculo='',arquetipo=''}={}){
 vd=Number(vd);if(!Number.isFinite(vd)||vd<0||vd>20||!Number.isInteger(vd)&&![.125,.25,.5].includes(vd))throw Error('Usa valor de desafío 0, 0,125, 0,25, 0,5 o un entero entre 1 y 20.');
 if(!Object.hasOwn(ROLES_NPC,rol))throw Error('Elige un rol válido.');
 nombre=String(nombre).trim().slice(0,100);if(!nombre)throw Error('Escribe un nombre.');
 let a=anclas[0],b=anclas.at(-1);for(let i=1;i<anclas.length;i++)if(vd<=anclas[i][0]){a=anclas[i-1];b=anclas[i];break;}
 const f=b[0]===a[0]?0:(vd-a[0])/(b[0]-a[0]),inter=k=>Math.round(a[k]+(b[k]-a[k])*f);
 let pg=inter(1),ca=inter(2),ataque=inter(3),dano=inter(4),mov=9;
 if(rol==='guardian'){pg=Math.round(pg*1.2);ca++;dano=Math.max(1,Math.round(dano*.85));}
 if(rol==='hostigador'){pg=Math.round(pg*.9);mov=12;}
 if(rol==='tirador'){pg=Math.round(pg*.8);ataque++;}
 if(rol==='místico'){pg=Math.round(pg*.75);ca--;}
 if(rol==='apoyo'){pg=Math.round(pg*.9);dano=Math.max(1,Math.round(dano*.7));}
 if(rol==='civil'){pg=Math.max(4,Math.round(pg*.5));ca=10;dano=Math.max(1,Math.round(dano*.4));}
 const ataques=vd>=11?3:vd>=5?2:1,denominacion=dano/ataques<=2?2:dano/ataques<=3?4:6,dados=Math.max(1,Math.round(dano/ataques/((denominacion+1)/2))),competencia=vd<5?2:Math.min(6,2+Math.floor((vd-1)/4));
 if(arquetipo&&!['civil','guardia','rastreador','erudito','cuidador','capitan','vinculado'].includes(arquetipo))throw Error('Plantilla de campaña desconocida.');
 return {nombre,vd,rol,arquetipo,pg,ca:Math.max(10,Math.min(21,ca)),ataque,cd:8+ataque,velocidad:mov,ataques,dados,denominacion,danoMedio:dados*(denominacion+1)/2*ataques,competencia,
  entorno:String(entorno).slice(0,300),motivacion:String(motivacion).slice(0,600),vinculo:String(vinculo).slice(0,600),
  aviso:'Perfil orientativo de campaña, no una certificación de valor de desafío. El daño por ronda supone que todos los ataques de la rutina impactan. Resistencias, control, áreas, magia, técnicas del Verbe y acciones importadas requieren revisión del DM.'};
}
export function cambiosNpc(actor,p,{curar=false}={}){
 const hp=actor.system?.attributes?.hp??{},ratio=hp.max>0?Math.max(0,Math.min(1,(Number(hp.value)||0)/hp.max)):1;
 return {name:p.nombre,'system.details.cr':p.vd,'system.attributes.hp.max':p.pg,'system.attributes.hp.value':curar?p.pg:Math.round(p.pg*ratio),
  'system.attributes.ac.calc':'flat','system.attributes.ac.flat':p.ca,'system.attributes.movement.walk':p.velocidad*(actor.system?.attributes?.movement?.units==='ft'?1/0.3:1)};
}
export function pasosPersonaje(actor,{aprobada=!!actor?.getFlag?.('ecos-frontera','creacionRevisada')}={}){
 const items=Array.from(actor?.items??[]),t=type=>items.some(i=>i.type===type);
 return [{id:'identidad',nombre:'Nombre e idea',hecho:!!actor?.name},
  {id:'class',nombre:'Clase y nivel',hecho:t('class')},{id:'race',nombre:'Especie',hecho:t('race')||t('species')},
  {id:'background',nombre:'Trasfondo',hecho:t('background')},{id:'caracteristicas',nombre:'Características',hecho:!!actor?.getFlag?.('ecos-frontera','caracteristicasRevisadas')},
  {id:'item',nombre:'Equipo inicial',hecho:items.some(i=>['weapon','equipment','consumable','tool'].includes(i.type))},
  {id:'revision',nombre:'Revisión con el DM',hecho:aprobada}];
}
