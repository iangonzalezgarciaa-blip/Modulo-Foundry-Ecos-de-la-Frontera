import {dadoNatural,tablaAzar,REGLA_AZAR} from './azar-core.js';
const MOD='ecos-frontera',locks=new Map();
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const nivel=a=>Number(a.system?.details?.level)||Math.max(1,Math.ceil(Number(a.system?.details?.cr)||1));
const gm=()=>game.users.activeGM?game.users.activeGM.isSelf:game.user.isGM;
const arr=x=>Array.from(x?.contents??x??[]);
export function contextoMensaje(m,combate){
 const r=m.flags?.dnd5e?.roll??m.getFlag?.('dnd5e','roll');if(!r)return null;
 if(m.getFlag?.(MOD,'azarExcluir')||r.skillId==='cvb'||r.skill==='cvb'||r.type==='concentration'||r.type==='death'||r.type==='initiative')return null;
 return ({attack:combate?'ataque':'escena',save:combate?'salvacion':'escena',savingThrow:combate?'salvacion':'escena',skill:combate?'habilidad':'escena',ability:combate?'habilidad':'escena',tool:combate?'habilidad':'escena'})[r.type]??null;
}
/** Solo el GM principal observa mensajes ya creados; no hay sockets que acepten consecuencias del cliente. */
export async function proponerAzar(m){
 if(!game.user.isGM||!gm()||!game.settings.get(MOD,'azarActivo')||m.getFlag?.(MOD,'azar'))return false;
 const actor=ChatMessage.getSpeakerActor?.(m.speaker);if(!actor||!['character','npc'].includes(actor.type))return false;
 const autor=m.author??game.users.get(m.user?.id??m.user);if(!autor||!autor.isGM&&!actor.testUserPermission?.(autor,'OWNER'))return false;
 const contexto=contextoMensaje(m,!!game.combat?.started);if(!contexto)return false;
 const roll=arr(m.rolls)[0],natural=dadoNatural(roll);if(natural===null)return false;
 const anterior=locks.get(actor.uuid)??Promise.resolve();
 const trabajo=anterior.catch(()=>{}).then(async()=>{
  const combate=game.combat?.started?game.combat:null,turno=combate?`${combate.id}:${combate.round}:${combate.turn}`:null;
  const marca=actor.getFlag(MOD,'azarControl')??{},ahora=Number(game.time.worldTime)||0;
  if(turno&&marca.turno===turno)return false;
  // El primer d20 del turno cuenta aunque no sea un extremo: evita castigar los ataques extra.
  if(turno)await actor.setFlag(MOD,'azarControl',{...marca,turno});
  if(![1,20].includes(natural))return false;
  if(!turno&&Number.isFinite(marca.escena)&&ahora>=marca.escena&&ahora-marca.escena<600)return false;
  if(!turno)await actor.setFlag(MOD,'azarControl',{...marca,escena:ahora});
  const eleccion=await new Roll('1d8').evaluate(),indice=Math.max(1,Math.min(8,eleccion.total));
  const fila=tablaAzar(contexto,natural,nivel(actor))[indice-1];
  const datos={actorUuid:actor.uuid,contexto,natural,indice,nivel:nivel(actor),estado:'pendiente',combate:combate?.id??null,turno,creado:ahora,origen:m.id};
  const whisper=arr(m.whisper).map(x=>typeof x==='string'?x:x.id);
  await ChatMessage.create({speaker:m.speaker,whisper,blind:!!m.blind,
   content:`<section class="ecos-azar"><h3>${natural===1?'Contratiempo':'Oportunidad'} · ${esc(actor.name)} · ${natural} natural</h3><p><b>${indice}. ${esc(fila.nombre)}</b> · escala de nivel ${datos.nivel}</p><p>${esc(fila.texto)}</p><p>Propuesta pendiente del DM. Conserva el resultado normal de la tirada. No se acumula con otro efecto de esta tabla.</p><button type="button" data-ecos-azar="aprobar">Aprobar y registrar</button> <button type="button" data-ecos-azar="descartar">Descartar</button></section>`,flags:{[MOD]:{azar:datos}}});
  return datos;
 });locks.set(actor.uuid,trabajo);try{return await trabajo;}finally{if(locks.get(actor.uuid)===trabajo)locks.delete(actor.uuid);}
}
export async function resolverAzar(m,aprobar){
 if(!game.user.isGM||!gm())return false;const clave='mensaje:'+m.id;if(locks.has(clave))return false;locks.set(clave,true);
 try{return await resolverAzarInterno(m,aprobar);}finally{locks.delete(clave);}
}
async function resolverAzarInterno(m,aprobar){
 const d=m.getFlag?.(MOD,'azar');if(!d||d.estado!=='pendiente')return false;
 const actor=await fromUuid(d.actorUuid);if(!actor)return false;
 const fila=tablaAzar(d.contexto,d.natural,d.nivel)[d.indice-1];if(!fila)return false;
 const combate=game.combat?.started?game.combat:null;
 if(d.combate&&(!combate||combate.id!==d.combate||`${combate.id}:${combate.round}:${combate.turn}`!==d.turno)){
  await m.setFlag(MOD,'azar',{...d,estado:'vencido'});ui.notifications.warn('Esta propuesta de combate venció al cambiar el turno.');return false;
 }
 // Reservar la resolución antes de tocar documentos impide dobles clics.
 await m.setFlag(MOD,'azar',{...d,estado:aprobar?'registrando':'descartado'});
 if(!aprobar)return true;
 try{
  const prev=arr(actor.effects).filter(e=>e.getFlag?.(MOD,'azar'));if(prev.length)await actor.deleteEmbeddedDocuments('ActiveEffect',prev.map(e=>e.id));
  if(fila.efecto&&combate){
   const unidades=actor.system.attributes?.movement?.units==='ft'?1/0.3:1;
   const ca=fila.efecto.tipo==='ca',key=ca?'system.attributes.ac.bonus':'system.attributes.movement.walk';
   const valor=ca?fila.efecto.valor:fila.efecto.valor*unidades;
   // La reducción no puede dejar la velocidad por debajo de 1,5 m.
   const actual=Number(actor.system.attributes?.movement?.walk)||0;
   const cambio=!ca&&valor<0?Math.max(valor,Math.min(0,1.5*unidades-actual)):valor;
   await actor.createEmbeddedDocuments('ActiveEffect',[{name:`${fila.nombre} · d20`,img:'icons/svg/d20.svg',disabled:false,transfer:false,
    changes:[{key,mode:2,value:String(cambio)}],duration:{rounds:2,combat:combate.id,startRound:combate.round,startTurn:combate.turn},description:`<p>${esc(fila.texto)}</p>`,
    flags:{[MOD]:{azar:{combate:combate.id,turno:d.turno,actor:actor.uuid,tipo:fila.efecto.tipo,haLlegado:false}}}}]);
  }
  await m.setFlag(MOD,'azar',{...d,estado:'aprobado'});return true;
 }catch(err){await m.setFlag(MOD,'azar',{...d,estado:'error'});throw err;}
}
export async function caducarAzar(combate,terminado=false){
 if(!gm())return;
 const actores=new Map([...arr(game.actors),...arr(combate?.combatants).map(c=>c.actor).filter(Boolean)].map(a=>[a.uuid,a]));
 for(const actor of actores.values())for(const ef of arr(actor.effects)){
  const d=ef.getFlag?.(MOD,'azar');if(!d||d.combate!==combate?.id)continue;
  const turno=`${combate.id}:${combate.round}:${combate.turn}`,propio=combate.combatant?.actor?.uuid===actor.uuid;
  if(terminado||(d.tipo==='ca'&&propio&&turno!==d.turno)||(!propio&&d.haLlegado))await ef.delete();
  else if(propio&&turno!==d.turno&&!d.haLlegado)await ef.setFlag(MOD,'azar',{...d,haLlegado:true});
 }
}
Hooks.once('init',()=>{
 game.settings.register(MOD,'azarActivo',{name:'Contratiempos y oportunidades del d20',hint:'Propone una tabla nivelada al sacar 1 o 20 natural. Solo cuenta el primer d20 del turno. El DM aprueba cada consecuencia. Las salvaciones y habilidades conservan su resultado normal.',scope:'world',config:true,type:Boolean,default:true});
});
Hooks.on('createChatMessage',m=>{proponerAzar(m).catch(err=>console.error(`${MOD} | d20`,err));});
function decorar(m,html){const d=m.getFlag?.(MOD,'azar');if(!d)return;const el=html instanceof HTMLElement?html:html?.[0];if(!el)return;
 for(const b of el.querySelectorAll('[data-ecos-azar]')){b.hidden=!game.user.isGM||!gm()||d.estado!=='pendiente';if(b.dataset.ecosEnlazado)continue;b.dataset.ecosEnlazado='si';b.addEventListener('click',async()=>{b.disabled=true;try{await resolverAzar(m,b.dataset.ecosAzar==='aprobar');}catch(err){ui.notifications.error('No se pudo aplicar el resultado; revisa la consola.');console.error(err);}finally{b.disabled=false;}});}
 if(d.estado!=='pendiente'&&!el.querySelector('.ecos-azar-estado')){const p=document.createElement('p');p.className='ecos-azar-estado';p.textContent=`Estado: ${d.estado}. Los ajustes de tiradas y consecuencias narrativas se resuelven en mesa.`;el.append(p);}
}
Hooks.on('renderChatMessageHTML',decorar);Hooks.on('renderChatMessage',decorar);
Hooks.on('updateCombat',(c,delta)=>{if('turn'in delta||'round'in delta)caducarAzar(c,!c.started).catch(console.error);});
Hooks.on('deleteCombat',c=>caducarAzar(c,true).catch(console.error));
Hooks.once('ready',()=>{const api=(game.modules.get(MOD).api??={});api.azar={tabla:tablaAzar,regla:REGLA_AZAR};
 if(game.user.isGM&&gm())for(const actor of game.actors)for(const ef of arr(actor.effects)){const d=ef.getFlag?.(MOD,'azar');if(d&&!game.combats?.get(d.combate)?.started)ef.delete().catch(console.error);}
});
for(const nombre of ['dnd5e.preRollConcentration','dnd5e.preRollConcentrationV2'])Hooks.on(nombre,(_config,_dialog,message)=>{
 if(message){message.data??={};message.data.flags??={};message.data.flags[MOD]??={};message.data.flags[MOD].azarExcluir=true;}
});
