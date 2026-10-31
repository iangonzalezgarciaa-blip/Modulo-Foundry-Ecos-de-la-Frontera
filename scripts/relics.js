/** Catálogo de reliquias, compendio privado y control de usos nativos. */
const MOD='ecos-frontera',PACK='world.ecos-reliquias',pendientes=new Map();
let datos=null,carga=null;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const meta=item=>item?.getFlag?.(MOD,'reliquia');
const nivel=actor=>Number(actor?.system?.details?.level)||Number(actor?.getFlag?.(MOD,'verbe')?.nivel)||Math.max(1,Number(actor?.system?.details?.cr)||1);
const gmPrincipal=()=>game.users.activeGM?game.users.activeGM.isSelf:game.user.isGM;
export function usarDatosReliquias(d){datos=d;}
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
 if(nuevas.length){const bloqueado=pack.locked;await pack.configure({locked:false});try{await Item.createDocuments(nuevas,{pack:pack.collection,keepId:true});}finally{await pack.configure({locked:bloqueado});}}
 return pack;
}
function htmlDiario(D){return `<h1>Reliquias · guía del DM</h1><p>${esc(D.alcance)}</p><p>Las cifras y efectos jugables son adaptación de Nimerios. Los grados de la obra no son grados del Verbe. Todas las reliquias requieren autorización del DM, equipo y el nivel de su ficha; desde nivel 9 también sintonía. Se comparte un uso de familia y uno de reliquia mayor por Descanso Largo. Un ritual requiere otro permiso para cada activación. Los consumibles no se reponen. Para entregar o preparar un ritual, abre Verbe → DM → Compendio de reliquias.</p>${D.dossiers.map(d=>`<h2>${esc(d.nombre)}</h2><p>${esc(d.texto)}</p>`).join('')}${D.reliquias.map(r=>`<details><summary>${esc(r.nombre)} · ${esc(r.origen)} · nivel ${r.nivel}</summary>${r.item.system.description.value}</details>`).join('')}`;}
export async function asegurarDiarioReliquias(){
 if(!game.user.isGM)return null;const D=await cargar();let j=game.journal.find(j=>j.getFlag(MOD,'reliquiasDM'));
 if(!j)j=await JournalEntry.create({name:'Ecos · Reliquias del Abismo y Nimerios (solo DM)',ownership:{default:0},flags:{[MOD]:{reliquiasDM:1}},pages:[]});
 const ownership={default:0};for(const u of game.users)if(!u.isGM)ownership[u.id]=0;
 await j.update({ownership},{diff:false,recursive:false});
 if(!j.pages.some(p=>p.getFlag(MOD,'reliquiasVersion')===D.version))await j.createEmbeddedDocuments('JournalEntryPage',[{name:'Catálogo 3.2 · procedencia, acceso y límites',type:'text',ownership,text:{content:htmlDiario(D),format:1},flags:{[MOD]:{reliquiasVersion:D.version}}}]);
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
  async compendio(){if(!game.user.isGM)return;const pack=await asegurarCompendioReliquias();pack?.render(true);},
  async diario(){if(!game.user.isGM)return;const j=await asegurarDiarioReliquias();j?.sheet.render({force:true});}
 }};
 async _renderHTML(){if(!game.user.isGM)return '<p>Solo DM.</p>';const D=await cargar(),actor=this.actor;
  return `<div class="ecos-verbe-cuerpo"><h2>Reliquias del Abismo y Nimerios</h2><p>${D.reliquias.length} perfiles. ${esc(D.alcance)}</p><p>Reglas propias de mesa. El nivel controla la activación; no se aprende una técnica por recibir un objeto. Las copias comparten usos por familia y las mayores un único uso entre Largos. Los rituales deben prepararse otra vez.</p><p><button type="button" data-action="compendio">Abrir compendio privado</button> <button type="button" data-action="diario">Diario del catálogo</button></p>${actor?`<p>Entregar a <b>${esc(actor.name)}</b></p>`:`<label>Destino<select name="destinoReliquia">${game.actors.map(a=>`<option value="${a.id}">${esc(a.name)}</option>`).join('')}</select></label>`}<label>Buscar<input type="search" data-buscar-reliquia placeholder="Nombre, origen o función"></label>${actor?`<details><summary>Preparar las copias de este personaje</summary>${actor.items.filter(i=>meta(i)).map(i=>`<p>${esc(i.name)} · ${meta(i).autorizada?'autorizada':'sin autorización'} <button type="button" data-action="autorizar" data-id="${i.id}">Autorizar copia</button>${meta(i).ritual?` <button type="button" data-action="autorizar" data-id="${i.id}" data-ritual="si">Preparar un ritual</button>`:''}</p>`).join('')}</details>`:''}${['serie','juego','propia'].map(origen=>`<details open><summary>${{serie:'Serie, componentes y dispositivos',juego:'Videojuego · familias',propia:'Creaciones de Nimerios'}[origen]}</summary>${D.reliquias.filter(r=>r.origen===origen).map(r=>`<details data-reliquia-ficha><summary>${esc(r.nombre)} · nivel ${r.nivel}${r.mayor?' · mayor':''}</summary>${r.item.system.description.value}<button type="button" data-action="entregar" data-id="${r.id}">Entregar y autorizar una copia</button></details>`).join('')}</details>`).join('')}</div>`;
 }
 _replaceHTML(html,content){content.innerHTML=html;content.querySelector('[data-buscar-reliquia]')?.addEventListener('input',e=>{const q=e.target.value.toLocaleLowerCase();for(const ficha of content.querySelectorAll('[data-reliquia-ficha]'))ficha.hidden=!ficha.textContent.toLocaleLowerCase().includes(q);});}
}
export function abrirReliquias(actor=null){if(game.user.isGM)return new CatalogoReliquias(actor).render({force:true});}
Hooks.on('dnd5e.activityConsumption',(activity,config,message,updates)=>consumirReliquia(activity,config,updates));
Hooks.on('dnd5e.postUseActivity',(activity,config)=>{despuesReliquia(activity,config).catch(e=>console.error(`${MOD} | reliquia`,e));});
Hooks.on('dnd5e.restCompleted',(actor,result,config)=>{descansarReliquias(actor,config).catch(e=>console.error(`${MOD} | descanso reliquia`,e));});
Hooks.on('updateWorldTime',()=>caducarReliquias().catch(e=>console.error(`${MOD} | caducidad reliquia`,e)));
Hooks.once('ready',()=>{if(gmPrincipal())Promise.all([asegurarCompendioReliquias(),asegurarDiarioReliquias()]).catch(e=>{console.error(`${MOD} | catálogo reliquias`,e);ui.notifications.warn('El catálogo de reliquias necesita reintentar su importación desde Verbe → DM.');});});
