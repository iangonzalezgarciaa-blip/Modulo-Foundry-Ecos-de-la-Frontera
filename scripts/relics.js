import {huellaTexto} from "./verbe-reading.js";
/** Catálogo de reliquias, compendio privado y control de usos nativos. */
const MOD='ecos-frontera',PACK='world.ecos-reliquias',pendientes=new Map();
let datos=null,carga=null;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const meta=item=>item?.getFlag?.(MOD,'reliquia');
const nivel=actor=>Number(actor?.system?.details?.level)||Number(actor?.getFlag?.(MOD,'verbe')?.nivel)||Math.max(1,Number(actor?.system?.details?.cr)||1);
const gmPrincipal=()=>game.users.activeGM?game.users.activeGM.isSelf:game.user.isGM;
export function usarDatosReliquias(d){datos=d;}
export async function consultarReliquias(){if(!game.user.isGM)return [];return (await cargar()).reliquias;}
async function cargar(){
 if(datos)return datos;if(carga)return carga;
 carga=(async()=>{const res=await fetch(`modules/${MOD}/data/reliquias.txt`);if(!res.ok)throw Error('No se pudo cargar el catálogo de reliquias.');
  const bin=Uint8Array.from(atob((await res.text()).trim()),c=>c.charCodeAt(0)),key=new TextEncoder().encode(MOD);
  for(let i=0;i<bin.length;i++)bin[i]^=key[i%key.length]^(i&255);
  datos=JSON.parse(await new Response(new Blob([bin]).stream().pipeThrough(new DecompressionStream('gzip'))).text());return datos;
 })().catch(err=>{carga=null;throw err;});return carga;
}
export async function asegurarCompendioReliquias(){
 if(!game.user.isGM)return null;const D=await cargar();
 let pack=game.packs.get(PACK);
 if(!pack){const C=foundry.documents.collections.CompendiumCollection;pack=await C.createCompendium({name:'ecos-reliquias',label:'Ecos · Compendio de reliquias',type:'Item',package:'world'});}
 const ownership={PLAYER:'NONE',TRUSTED:'NONE',ASSISTANT:'NONE',GAMEMASTER:'OWNER'};
 await pack.configure({ownership});await pack.getIndex();
 const nuevas=D.reliquias.map(r=>r.item).filter(i=>!pack.index.has(i._id));
 const existentes=pack.getDocuments?await pack.getDocuments():[];
 const cambios=existentes.map(i=>({item:i,cambio:cambiosTextoReliquia(i,D)})).filter(x=>x.cambio);
 if(nuevas.length||cambios.length){const bloqueado=pack.locked;await pack.configure({locked:false});try{
   if(nuevas.length)await Item.createDocuments(nuevas,{pack:pack.collection,keepId:true});
   for(const {item,cambio} of cambios)await item.update(cambio);
 }finally{await pack.configure({locked:bloqueado});}}
 return pack;
}
/** Solo sustituye una descripción generada reconocible; no toca reglas ni estado de la copia. */
export function cambiosTextoReliquia(item,D=datos){
 const m=meta(item),r=D?.reliquias.find(r=>r.id===m?.id);if(!r)return null;
 const actual=item.system?.description?.value??'',nuevo=r.item.system.description.value;
 const cambios={},compat=D.compatibilidad?.[m.id];
 if(item.name!==r.nombre&&compat?.nombre===huellaTexto(item.name))cambios.name=r.nombre;
 const conocida=huellaTexto(actual),bases=[m.textoHuella,D.textosAnteriores?.[m.id],compat?.descripcion].filter(Boolean);
 if(actual!==nuevo&&bases.includes(conocida))Object.assign(cambios,{'system.description.value':nuevo,[`flags.${MOD}.reliquia.textoVersion`]:r.item.flags[MOD].reliquia.textoVersion,[`flags.${MOD}.reliquia.textoHuella`]:huellaTexto(nuevo)});
 return Object.keys(cambios).length?cambios:null;
}
export async function actualizarTextosReliquias(){
 if(!game.user.isGM)return 0;const D=await cargar();let n=0;
 for(const a of game.actors)for(const i of a.items){const cambios=cambiosTextoReliquia(i,D);if(cambios){await i.update(cambios);n++;}}
 return n;
}
function htmlDiario(D){return `<h1>Reliquias · guía del DM</h1><p>${esc(D.alcance)}</p><p>Las cifras y efectos jugables son adaptación de Nimerios. La clasificación de archivo no es un grado del Verbe. Todas las reliquias requieren autorización del DM, equipo y el nivel de su ficha; desde nivel 9 también sintonía. Se comparte un uso de familia y uno de reliquia mayor por Descanso Largo. Un ritual requiere otro permiso para cada activación. Los consumibles no se reponen. Para entregar o preparar un ritual, abre Verbe → DM → Compendio de reliquias.</p>${D.dossiers.map(d=>`<h2>${esc(d.nombre)}</h2><p>${esc(d.texto)}</p>`).join('')}${D.reliquias.map(r=>`<details><summary>${esc(r.nombre)} · ${esc(r.origen)} · nivel ${r.nivel}</summary>${r.item.system.description.value}</details>`).join('')}`;}
export async function asegurarDiarioReliquias(){
 if(!game.user.isGM)return null;const D=await cargar();let j=game.journal.find(j=>j.getFlag(MOD,'reliquiasDM'));
 if(!j)j=await JournalEntry.create({name:'Ecos · Reliquias del Abismo y Nimerios (solo DM)',ownership:{default:0},flags:{[MOD]:{reliquiasDM:1}},pages:[]});
 const ownership={default:0};for(const u of game.users)if(!u.isGM)ownership[u.id]=0;
 await j.update({ownership},{diff:false,recursive:false});
 if(!j.pages.some(p=>p.getFlag(MOD,'reliquiasVersion')===D.version))await j.createEmbeddedDocuments('JournalEntryPage',[{name:'Cómo usar las reliquias · lectura guiada',type:'text',ownership,text:{content:htmlDiario(D),format:1},flags:{[MOD]:{reliquiasVersion:D.version}}}]);
 for(const p of j.pages)if(p.getFlag(MOD,'reliquiasVersion'))await p.update({ownership},{diff:false,recursive:false});return j;
}
export async function darReliquia(actor,id){
 if(!game.user.isGM||!actor)return false;const D=await cargar(),r=D.reliquias.find(r=>r.id===id);if(!r)return false;
 if(actor.items.some(i=>meta(i)?.id===id)){ui.notifications.warn('Ya tiene una copia; se conserva su gasto y autorización.');return false;}
 const item=foundry.utils.deepClone(r.item);delete item._id;delete item.ownership;item.flags[MOD].reliquia.autorizada=true;
 const car=actor.getFlag(MOD,'verbe')?.car??actor.system.attributes?.spellcasting??'wis';
 for(const act of Object.values(item.system.activities))if(act.attack)act.attack.ability=['str','dex','con','int','wis','cha'].includes(car)?car:'wis';
 await actor.createEmbeddedDocuments('Item',[item]);return true;
}
export async function autorizarReliquia(item,{ritual=false}={}){
 if(!game.user.isGM||!meta(item))return false;
 await item.update({[`flags.${MOD}.reliquia.${ritual?'permisoRitual':'autorizada'}`]:true});return true;
}
export function permisoReliquia(actor,item,config={}){
 const m=meta(item);if(!m)return {ok:true};
 if(!actor||(!game.user.isGM&&!actor.isOwner))return {ok:false,motivo:'No puedes usar esta hoja.'};
 if(!m.autorizada)return {ok:false,motivo:'El DM debe autorizar esta copia en el catálogo de reliquias.'};
 if(nivel(actor)<m.nivel)return {ok:false,motivo:`La reliquia pide nivel ${m.nivel}.`};
 if(!item.system.equipped)return {ok:false,motivo:'Equipa primero la reliquia.'};
 if(m.nivel>=9&&!item.system.attuned)return {ok:false,motivo:'La reliquia necesita sintonía.'};
 if(actor.statuses&&['unconscious','dead','incapacitated','paralyzed','stunned','petrified'].some(s=>actor.statuses.has(s)))return {ok:false,motivo:'No puede actuar.'};
 if(config.consume===false || (Array.isArray(config.consume?.resources)&&!config.consume.resources.includes(0)))return {ok:false,motivo:'Usa la reliquia con su consumo de cargas activo.'};
 if(m.ritual&&!m.permisoRitual)return {ok:false,motivo:'El DM debe preparar y autorizar este ritual para un solo uso.'};
 const usados=actor.getFlag(MOD,'reliquiasUsadas')??{};
 if(usados[m.familia]||(m.mayor&&usados.mayor))return {ok:false,motivo:'Ya gastó esta familia o su reliquia mayor desde el último Largo.'};
 if(Number(item.system.uses?.spent)>=Number(item.system.uses?.max??1))return {ok:false,motivo:'No quedan cargas en este ejemplar.'};
 return {ok:true};
}
export function consumirReliquia(activity,config,updates){
 const item=activity?.item,actor=activity?.actor??item?.actor,m=meta(item);if(!m)return;
 const p=permisoReliquia(actor,item,config);if(!p.ok){ui.notifications.warn(p.motivo);return false;}
 const key=actor.uuid??actor.id,antes=pendientes.get(key);
 if(antes&&antes.hasta>Date.now()&&antes.config!==config){ui.notifications.warn('Espera al uso de la reliquia anterior.');return false;}
 pendientes.set(key,{config,hasta:Date.now()+30000});
 updates.actor??={};updates.actor[`flags.${MOD}.reliquiasUsadas.${m.familia}`]=true;if(m.mayor)updates.actor[`flags.${MOD}.reliquiasUsadas.mayor`]=true;
  config.ecosReliquia={id:m.id};
}
export async function despuesReliquia(activity,config){
 const item=activity.item,actor=activity.actor??item.actor,m=meta(item);if(!m||!config?.ecosReliquia)return;
 pendientes.delete(actor.uuid??actor.id);
 // Se consume el permiso incluso si el sistema no procesa actualizaciones de flags del item.
 if(m.ritual)await item.update({[`flags.${MOD}.reliquia.permisoRitual`]:false});
 const fuentes=(item.effects??[]).filter(e=>(e.getFlag?.(MOD,'reliquiaEfecto')??e.flags?.[MOD]?.reliquiaEfecto));
 for(const fuente of fuentes){const data=fuente.toObject?fuente.toObject():foundry.utils.deepClone(fuente);delete data._id;
  for(const c of data.changes)if(/^system\.attributes\.movement\./.test(c.key)&&actor.system.attributes.movement.units==='ft')c.value=String(Number(c.value)/.3);
  const viejos=actor.effects.filter(e=>e.getFlag(MOD,'reliquiaEfecto')?.familia===m.familia);for(const ef of viejos)await ef.delete();
  data.duration={...data.duration,startTime:game.time.worldTime};data.flags[MOD].reliquiaEfecto.hasta=game.time.worldTime+(Number(data.duration.seconds)||60);
  await actor.createEmbeddedDocuments('ActiveEffect',[data]);
 }
}
export async function descansarReliquias(actor,config){
 if(config?.type==='long'&&(game.user.isGM||actor.isOwner))await actor.unsetFlag(MOD,'reliquiasUsadas');
}
export async function caducarReliquias(){
 if(!gmPrincipal())return;for(const a of game.actors)for(const e of [...a.effects]){const m=e.getFlag(MOD,'reliquiaEfecto');if(m&&Number(m.hasta)<=game.time.worldTime)await e.delete();}
}
export class CatalogoReliquias extends foundry.applications.api.ApplicationV2{
 constructor(actor=null){super({window:{title:'Compendio de reliquias · DM'}});this.actor=actor;}
 static DEFAULT_OPTIONS={classes:['ecos-verbe-panel','ecos-reliquias'],position:{width:940,height:780},window:{resizable:true},actions:{
  async entregar(ev,t){if(await darReliquia(this.actor??game.actors.get(this.element.querySelector('[name="destinoReliquia"]').value),t.dataset.id))ui.notifications.info('Reliquia entregada; equipa y sintoniza la copia para usarla.');this.render();},
  async autorizar(ev,t){const a=this.actor??game.actors.get(this.element.querySelector('[name="destinoReliquia"]').value);const it=a?.items.get(t.dataset.id);if(it)await autorizarReliquia(it,{ritual:t.dataset.ritual==='si'});this.render();},
  async textos(){if(!game.user.isGM)return;const n=await actualizarTextosReliquias();await asegurarCompendioReliquias();ui.notifications.info(`Explicaciones actualizadas en ${n} copias de hojas. Se conservan los textos personalizados y los usos gastados.`);this.render();},
  async compendio(){if(!game.user.isGM)return;const pack=await asegurarCompendioReliquias();pack?.render(true);},
  async diario(){if(!game.user.isGM)return;const j=await asegurarDiarioReliquias();j?.sheet.render({force:true});}
 }};
 async _renderHTML(){if(!game.user.isGM)return '<p>Solo DM.</p>';const D=await cargar(),actor=this.actor;
  return `<div class="ecos-verbe-cuerpo"><h2>Reliquias del Abismo y Nimerios</h2><p><b>${D.reliquias.length} objetos de consulta.</b> Elige por su función y nivel; no necesitas leerlos todos.</p><section class="ev-bienvenida"><h3>Para entregar la primera reliquia</h3><ol><li>Confirma el personaje destinatario que aparece abajo.</li><li>Busca una reliquia y abre su ficha: empieza por «Qué hace» y «Para poder usarla».</li><li>Pulsa <b>Entregar y autorizar una copia</b>. Esto la pone en su inventario; no la activa.</li><li>El jugador la equipa y cumple la sintonía si corresponde. Si es un ritual, tú autorizas cada activación desde las copias de este personaje.</li></ol></section><details><summary>Cargas, familias y reliquias mayores</summary><p>Una carga es una activación disponible en el objeto. Cada familia comparte además un límite entre copias o variantes; cambiar de copia no devuelve el uso.</p><p>Las reliquias marcadas como mayores comparten entre todas un único uso por Descanso Largo. Los consumibles no se recargan. Un permiso ritual autoriza una activación: descansar no lo renueva.</p></details><p><button type="button" data-action="compendio">Abrir compendio privado</button> <button type="button" data-action="diario">Abrir referencia del catálogo</button> <button type="button" data-action="textos">Actualizar explicaciones de mis copias</button></p>${actor?`<p>Destinatario: <b>${esc(actor.name)}</b></p>`:`<label>Destinatario<select name="destinoReliquia">${game.actors.map(a=>`<option value="${a.id}">${esc(a.name)}</option>`).join('')}</select></label>`}<label>Buscar por nombre, origen o función<input type="search" data-buscar-reliquia placeholder="Por ejemplo: curación, agua, protección"></label>${actor?`<details><summary>Autorizar copias o preparar rituales de este personaje</summary><p>Autorizar la copia permite usar el objeto cuando cumpla los demás requisitos. Preparar un ritual concede permiso para una activación y no repone cargas.</p>${actor.items.filter(i=>meta(i)).map(i=>`<p>${esc(i.name)} · ${meta(i).autorizada?'copia autorizada':'necesita autorización'} <button type="button" data-action="autorizar" data-id="${i.id}">Autorizar copia</button>${meta(i).ritual?` <button type="button" data-action="autorizar" data-id="${i.id}" data-ritual="si">Preparar una activación ritual</button>`:''}</p>`).join('')||'<p>Todavía no tiene reliquias registradas por este catálogo.</p>'}</details>`:''}${['serie','juego','propia'].map(origen=>`<details data-reliquia-grupo="${origen}" ${origen==='serie'?'open':''}><summary>${{serie:'Archivo de las Profundidades: objetos y dispositivos',juego:'Taller de las Profundidades: familias de equipo',propia:'Creaciones originales de Nimerios'}[origen]}</summary>${D.reliquias.filter(r=>r.origen===origen).map(r=>`<details data-reliquia-ficha><summary>${esc(r.nombre)} · nivel mínimo ${r.nivel}${r.mayor?' · mayor':''}</summary>${r.item.system.description.value}<button type="button" data-action="entregar" data-id="${r.id}">Entregar y autorizar una copia</button></details>`).join('')}</details>`).join('')}<details><summary>Alcance de la adaptación y sus fuentes</summary><p>${esc(D.alcance)} Las cifras de uso son reglas de Nimerios. La clasificación del archivo no equivale al grado de una técnica del Verbe. Cada ficha explica su uso en esta campaña.</p></details></div>`;
 }
 _replaceHTML(html,content){content.innerHTML=html;content.querySelector('[data-buscar-reliquia]')?.addEventListener('input',e=>{const q=e.target.value.toLocaleLowerCase();for(const ficha of content.querySelectorAll('[data-reliquia-ficha]'))ficha.hidden=!ficha.textContent.toLocaleLowerCase().includes(q);for(const g of content.querySelectorAll('[data-reliquia-grupo]'))g.open=q?[...g.querySelectorAll('[data-reliquia-ficha]')].some(f=>!f.hidden):g.dataset.reliquiaGrupo==='serie';});}
}
export function abrirReliquias(actor=null){if(game.user.isGM)return new CatalogoReliquias(actor).render({force:true});}
Hooks.on('dnd5e.activityConsumption',(activity,config,message,updates)=>consumirReliquia(activity,config,updates));
Hooks.on('dnd5e.postUseActivity',(activity,config)=>{despuesReliquia(activity,config).catch(e=>console.error(`${MOD} | reliquia`,e));});
Hooks.on('dnd5e.restCompleted',(actor,result,config)=>{descansarReliquias(actor,config).catch(e=>console.error(`${MOD} | descanso reliquia`,e));});
Hooks.on('updateWorldTime',()=>caducarReliquias().catch(e=>console.error(`${MOD} | caducidad reliquia`,e)));
Hooks.once('ready',()=>{if(gmPrincipal())Promise.all([asegurarCompendioReliquias(),asegurarDiarioReliquias(),actualizarTextosReliquias()]).catch(e=>{console.error(`${MOD} | catálogo reliquias`,e);ui.notifications.warn('El catálogo de reliquias necesita reintentar su importación desde Verbe → DM.');});});
