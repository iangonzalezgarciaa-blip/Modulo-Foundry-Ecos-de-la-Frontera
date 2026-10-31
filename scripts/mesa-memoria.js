import {escTexto as esc} from './verbe-reading.js';
const MOD='ecos-frontera';
export async function cuadernoMemoria(){
 if(!game.user.isGM)return null;const entradas=game.modules.get(MOD)?.api?.verbe?.datos?.()?.memoriaNimerios?.entradas??[];
 let j=game.journal?.find(x=>x.getFlag(MOD,'memoriaNimerios'));
 const ownership={default:0,...Object.fromEntries(Array.from(game.users).filter(u=>!u.isGM).map(u=>[u.id,0]))};
 if(!j)j=await JournalEntry.create({name:'Ecos · Identidad y memoria de Nimerios (DM)',ownership,flags:{[MOD]:{memoriaNimerios:true}},pages:[]});
 await j.update({ownership},{diff:false,recursive:false});
 const faltantes=entradas.filter(e=>!j.pages.find(p=>p.getFlag(MOD,'memoriaId')===e.id));
 if(faltantes.length)await j.createEmbeddedDocuments('JournalEntryPage',faltantes.map(e=>({name:`${e.nombre} · ${e.tipo}`,type:'text',ownership,flags:{[MOD]:{memoriaId:e.id}},text:{format:1,content:`<h1>${esc(e.nombre)}</h1><p><b>${e.estado==='referencia'?'Referencia del panteón existente':'Propuesta para adoptar, editar o descartar'}</b></p><p>${esc(e.publico)}</p><h2>Trabajo del DM</h2><p>${esc(e.dm)}</p><p>Situar en la región que corresponda. Conservar las reglas de la ficha y los diarios de lore del autor.</p>`}})));
 // Las páginas existentes son material editable del autor. Solo se reparan permisos.
 for(const p of j.pages)if(p.getFlag(MOD,'memoriaId')){
  if(Object.entries(ownership).some(([id,n])=>(p.ownership?.[id]??0)!==n))await p.update({ownership},{diff:false,recursive:false});
 }
 return j;
}
export async function adoptarMemoria(id,estado){
 if(!game.user.isGM||!['adoptado','propuesta','descartado'].includes(estado))return false;
 const datos=game.modules.get(MOD)?.api?.verbe?.datos?.()?.memoriaNimerios?.entradas??[];
 const e=datos.find(e=>e.id===id);if(!e||e.estado==='referencia')return false;
 const j=await cuadernoMemoria(),prev=j.getFlag(MOD,'memoriaEstado')??{};
 await j.setFlag(MOD,'memoriaEstado',{...prev,[id]:{estado,fecha:Date.now(),por:game.user.id}});return true;
}
export function memoriaHTML(m){
 if(!game.user.isGM)return '';const D=game.modules.get(MOD)?.api?.verbe?.datos?.(),todo=D?.memoriaNimerios?.entradas??[],j=game.journal?.find(x=>x.getFlag(MOD,'memoriaNimerios')),estados=j?.getFlag(MOD,'memoriaEstado')??{};
 const filtro=m.filtroMemoria??'',q=filtro.toLocaleLowerCase(),entradas=todo.filter(e=>(e.nombre+' '+e.tipo+' '+e.publico).toLocaleLowerCase().includes(q));m.entradasMemoria=entradas;
 return `<h2>Identidad de Nimerios</h2><p>El panteón de referencia conserva su jerarquía. Las historias nuevas de escuelas, entidades y reliquias son propuestas que puedes adoptar, editar o descartar. No sustituyen tus diarios ni conceden facultades.</p><p>Las tradiciones se pueden situar en cualquier región del mundo. La custodia, el consentimiento, los costes y las necesidades de una comunidad conectan las propuestas con las reglas existentes.</p><label>Buscar nombre, grupo o tema<input name="memoriaFiltro" value="${esc(filtro)}"></label><button type="button" data-em="memoriaBuscar">Filtrar</button> <button type="button" data-em="memoriaCuaderno">Crear o abrir cuaderno privado</button><p>${entradas.length} entradas. Abrir una fuente crea las páginas que falten; las páginas ya escritas se conservan.</p>${entradas.map((e,i)=>`<details><summary>${esc(e.nombre)} · ${esc(e.tipo)} · ${esc(estados[e.id]?.estado??e.estado)}</summary><p>${esc(e.publico)}</p><p><b>Para el DM:</b> ${esc(e.dm)}</p>${e.relaciones.length?`<p>Conecta con: ${e.relaciones.map(id=>{const r=todo.find(x=>x.id===id);return r?`<button type="button" data-em="memoriaEnlace" data-id="${esc(id)}">${esc(r.nombre)}</button>`:'';}).join(' ')}</p>`:''}<button type="button" data-em="memoriaFuente" data-id="${i}">Abrir página editable</button>${e.estado!=='referencia'?`<button type="button" data-em="memoriaAdoptar" data-id="${i}">Adoptar propuesta</button><button type="button" data-em="memoriaDescartar" data-id="${i}">Descartar propuesta</button>`:''}</details>`).join('')}`;
}
