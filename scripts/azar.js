import {dadoNatural,tablaAzar,tablaAzarGuia,CONTEXTOS_AZAR,REGLA_AZAR} from './azar-core.js';
import {paginaReglas} from './acciones-comunes.js';
import {regla} from './combate-tactico.js';
import {infoTirada,cambio,objetivosMensaje} from './compat.js';
const MOD='ecos-frontera',locks=new Map();
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const nivel=a=>Number(a.system?.details?.level)||Math.max(1,Math.ceil(Number(a.system?.details?.cr)||1));
const gm=()=>game.users.activeGM?game.users.activeGM.isSelf:game.user.isGM;
const arr=x=>Array.from(x?.contents??x??[]);
export function contextoMensaje(m,combate){
 const r=infoTirada(m);if(!r)return null;
 if(m.getFlag?.(MOD,'azarExcluir')||r.skill==='cvb'||r.tipo==='concentration'||r.tipo==='death'||r.tipo==='initiative')return null;
 return ({attack:combate?'ataque':'escena',save:combate?'salvacion':'escena',savingThrow:combate?'salvacion':'escena',skill:combate?'habilidad':'escena',ability:combate?'habilidad':'escena',tool:combate?'habilidad':'escena'})[r.tipo]??null;
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
  // El primer d20 del turno cuenta aunque no sea un extremo. Cada 20 de ataque cuenta (desde 3.12);
  // lo demás, solo el primer d20 de la criatura en el turno (un área con varias tiradas cuenta una vez y los ataques extra no castigan).
  const primero=!(turno&&marca.turno===turno);
  if(turno&&primero)await actor.setFlag(MOD,'azarControl',{...marca,turno});
  if(![1,20].includes(natural))return false;
  if(turno&&!primero&&!(natural===20&&contexto==='ataque'))return false;
  if(!turno&&Number.isFinite(marca.escena)&&ahora>=marca.escena&&ahora-marca.escena<600)return false;
  if(!turno)await actor.setFlag(MOD,'azarControl',{...marca,escena:ahora});
  const eleccion=await new Roll('1d8').evaluate(),indice=Math.max(1,Math.min(8,eleccion.total));
  const fila=tablaAzar(contexto,natural,nivel(actor))[indice-1];
  const datos={actorUuid:actor.uuid,contexto,natural,indice,nivel:nivel(actor),estado:'pendiente',combate:combate?.id??null,turno,creado:ahora,origen:m.id,
   objetivo:objetivosMensaje(m)[0]?.uuid??null};
  // 3.13 · El engaño elige el golpe: si el blanco cayó en su Distraer o Fintar por 5 o más, el 20 no se sortea.
  if(contexto==='ataque'&&natural===20&&datos.objetivo&&regla('engano')){
   const blanco=await fromUuid(datos.objetivo),f=blanco?.getFlag?.(MOD,'engano'),c=game.combat;
   const vigente=f?.autor===actor.uuid&&(!f.hasta||!c?.started||c.round<f.hasta.ronda||(c.round===f.hasta.ronda&&c.turn<=f.hasta.turno));
   if(vigente){datos.elegir=true;await blanco.unsetFlag(MOD,'engano');}
  }
  const whisper=arr(m.whisper).map(x=>typeof x==='string'?x:x.id);
  const opciones=datos.elegir?`<p><b>Engaño:</b> ${esc(actor.name)} elige el efecto.</p><ol>${tablaAzar(contexto,natural,nivel(actor)).map(f=>`<li><b>${esc(f.nombre)}</b>: ${esc(f.texto)} <button type="button" data-ecos-azar="aprobar" data-fila="${f.indice}">Elegir</button></li>`).join('')}</ol>`:`<p><b>${indice}. ${esc(fila.nombre)}</b> · escala de nivel ${datos.nivel}</p><p>${esc(fila.texto)}</p>`;
  await ChatMessage.create({speaker:m.speaker,whisper,blind:!!m.blind,
   content:`<section class="ecos-azar"><h3>${natural===1?'Contratiempo':'Oportunidad'} · ${esc(actor.name)} · ${natural} natural</h3>${opciones}<p>Propuesta pendiente del DM. Conserva el resultado normal de la tirada. No se acumula con otro efecto de esta tabla.</p>${datos.elegir?'':'<button type="button" data-ecos-azar="aprobar">Aprobar y registrar</button> '}<button type="button" data-ecos-azar="descartar">Descartar</button></section>`,flags:{[MOD]:{azar:datos}}});
  return datos;
 });locks.set(actor.uuid,trabajo);try{return await trabajo;}finally{if(locks.get(actor.uuid)===trabajo)locks.delete(actor.uuid);}
}
export async function resolverAzar(m,aprobar,fila=null){
 if(!game.user.isGM||!gm())return false;const clave='mensaje:'+m.id;if(locks.has(clave))return false;locks.set(clave,true);
 try{return await resolverAzarInterno(m,aprobar,fila);}finally{locks.delete(clave);}
}
async function resolverAzarInterno(m,aprobar,elegida=null){
 const d0=m.getFlag?.(MOD,'azar');if(!d0||d0.estado!=='pendiente')return false;
 const d=d0.elegir&&Number(elegida)>=1&&Number(elegida)<=8?{...d0,indice:Number(elegida)}:d0;
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
  // 3.12: estados y PG temporales, para quien tiró o para su blanco.
  if(fila.efecto&&['estado','pgTemp'].includes(fila.efecto.tipo)){
   const quien=fila.efecto.quien==='objetivo'?(d.objetivo?await fromUuid(d.objetivo):null):actor;
   const destino=quien?.actor??quien;
   if(destino&&fila.efecto.tipo==='estado')await destino.toggleStatusEffect?.(fila.efecto.valor,{active:true});
   if(destino&&fila.efecto.tipo==='pgTemp'){const hp=destino.system?.attributes?.hp;if(hp)await destino.update({'system.attributes.hp.temp':Math.max(Number(hp.temp)||0,Number(fila.efecto.valor)||0)});}
  }
  else if(fila.efecto&&combate){
   const unidades=actor.system.attributes?.movement?.units==='ft'?1/0.3:1;
   const ca=fila.efecto.tipo==='ca',key=ca?'system.attributes.ac.bonus':'system.attributes.movement.walk';
   const valor=ca?fila.efecto.valor:fila.efecto.valor*unidades;
   // La reducción no puede dejar la velocidad por debajo de 1,5 m.
   const actual=Number(actor.system.attributes?.movement?.walk)||0;
   const delta=!ca&&valor<0?Math.max(valor,Math.min(0,1.5*unidades-actual)):valor;
   await actor.createEmbeddedDocuments('ActiveEffect',[{name:`${fila.nombre} · d20`,img:'icons/svg/d20.svg',disabled:false,transfer:false,
    changes:[cambio(key,'add',delta)],duration:{rounds:2,combat:combate.id,startRound:combate.round,startTurn:combate.turn},description:`<p>${esc(fila.texto)}</p>`,
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
 game.settings.register(MOD,'azarActivo',{name:'Contratiempos y oportunidades del d20',hint:'Propone una consecuencia al sacar 1 o 20 natural en ataques, salvaciones y pruebas, para PJ y PNJ. En combate cuenta cada 20 de ataque; lo demás, solo el primer d20 de la criatura en el turno. El DM aprueba cada una. La tirada conserva su resultado normal.',scope:'world',config:true,type:Boolean,default:true});
});
Hooks.on('createChatMessage',m=>{proponerAzar(m).catch(err=>console.error(`${MOD} | d20`,err));});
function decorar(m,html){const d=m.getFlag?.(MOD,'azar');if(!d)return;const el=html instanceof HTMLElement?html:html?.[0];if(!el)return;
 for(const b of el.querySelectorAll('[data-ecos-azar]')){b.hidden=!game.user.isGM||!gm()||d.estado!=='pendiente';if(b.dataset.ecosEnlazado)continue;b.dataset.ecosEnlazado='si';b.addEventListener('click',async()=>{b.disabled=true;try{await resolverAzar(m,b.dataset.ecosAzar==='aprobar',b.dataset.fila?Number(b.dataset.fila):null);}catch(err){ui.notifications.error('No se pudo aplicar el resultado; revisa la consola.');console.error(err);}finally{b.disabled=false;}});}
 if(d.estado!=='pendiente'&&!el.querySelector('.ecos-azar-estado')){const p=document.createElement('p');p.className='ecos-azar-estado';p.textContent=`Estado: ${d.estado}. Los ajustes de tiradas y consecuencias narrativas se resuelven en mesa.`;el.append(p);}
}
Hooks.on('renderChatMessageHTML',decorar);
Hooks.on('updateCombat',(c,delta)=>{if('turn'in delta||'round'in delta)caducarAzar(c,!c.started).catch(console.error);});
Hooks.on('deleteCombat',c=>caducarAzar(c,true).catch(console.error));
Hooks.once('ready',()=>{const api=(game.modules.get(MOD).api??={});api.azar={tabla:tablaAzar,regla:REGLA_AZAR};
 if(game.user.isGM&&gm())for(const actor of game.actors)for(const ef of arr(actor.effects)){const d=ef.getFlag?.(MOD,'azar');if(d&&!game.combats?.get(d.combate)?.started)ef.delete().catch(console.error);}
});
for(const nombre of ['dnd5e.preRollConcentration','dnd5e.preRollConcentrationV2'])Hooks.on(nombre,(_config,_dialog,message)=>{
 if(message){message.data??={};message.data.flags??={};message.data.flags[MOD]??={};message.data.flags[MOD].azarExcluir=true;}
});

/* 3.12 quitó el daño doble del 20. 3.14 lo devuelve (pedido del autor: respetar D&D base): el 20 es el crítico del Manual
   y además trae el efecto de la tabla. Queda el ajuste, apagado, para quien quiera la regla vieja. */
const sinDoble=()=>{try{return game.settings.get(MOD,'criticoSinDoble')===true;}catch{return false;}};
export function quitarCriticoDano(config){
 if(!config||!sinDoble())return config;
 config.isCritical=false;config.critical={...(config.critical??{}),allow:false};
 for(const r of config.rolls??[]){r.options??={};r.options.isCritical=false;}
 return config;
}
Hooks.on('dnd5e.preRollDamageV2',config=>{quitarCriticoDano(config);});
Hooks.once('init',()=>{try{game.settings.register(MOD,'criticoSinDoble',{name:'Un 20 natural no duplica el daño (regla vieja)',hint:'Apagado, el 20 es el crítico del Manual (dados de daño dobles) y además saca su efecto de la tabla del d20. Encendido, solo saca el efecto (como en 3.12 y 3.13).',scope:'world',config:true,type:Boolean,default:false});
 game.settings.register(MOD,'criticoRevisado314',{scope:'world',config:false,type:Boolean,default:false});}catch{}});
Hooks.once('ready',async()=>{if(!game.user.isGM||!gm())return;try{if(!game.settings.get(MOD,'criticoRevisado314')){await game.settings.set(MOD,'criticoSinDoble',false);await game.settings.set(MOD,'criticoRevisado314',true);}}catch(err){console.error(`${MOD} | crítico`,err);}});

/** «13 · El 20 y el 1», la regla escrita para todos (3.12). */
export function guiaD20HTML(){
 const tabla=(c,n)=>`<table><thead><tr><th>d8</th><th>${n===20?'Éxito tremendo':'Fracaso tremendo'}</th><th>Qué pasa</th></tr></thead><tbody>${tablaAzarGuia(c,n).map(f=>`<tr><td>${f.indice}</td><td><strong>${esc(f.nombre)}</strong>${f.auto?' <small>(se aplica solo)</small>':''}</td><td>${esc(f.texto)}</td></tr>`).join('')}</tbody></table>`;
 return `<section class="ecos-d20"><h1>El 20 y el 1</h1>
<p><strong>Regla de la casa desde la versión 3.12 (con el crítico del Manual desde la 3.14).</strong> ${esc(REGLA_AZAR)}</p>
<ul><li><strong>Un 20 en un ataque es el crítico del Manual:</strong> impacta siempre y tira los dados de daño dos veces. Además, saca uno de ocho efectos de golpe tremendo.</li>
<li><strong>Para todos por igual:</strong> PJ, PNJ y monstruos usan las mismas tablas.</li>
<li><strong>B</strong> es 1 en los niveles 1 a 4, 2 en los niveles 5 a 12 y 3 desde el nivel 13. <strong>C</strong> es tu bono de competencia (2 a 6).</li>
<li><strong>Nada del Manual se pierde:</strong> el 1 en un ataque sigue fallando siempre; en salvaciones y pruebas el 1 y el 20 no cambian el éxito ni el fracaso, como en el Manual. Las tablas solo añaden una consecuencia.</li></ul>
${Object.entries(CONTEXTOS_AZAR).map(([c,n])=>`<h2>${esc(n)}</h2><h3>Con un 20</h3>${tabla(c,20)}<h3>Con un 1</h3>${tabla(c,1)}`).join('\n')}
</section>`;
}
Hooks.once('ready',()=>{if(game.user.isGM&&gm()&&game.settings.get(MOD,'azarActivo'))paginaReglas('guiaD20','13 · El 20 y el 1',guiaD20HTML()).catch(err=>console.error(`${MOD} | regla del d20`,err));});
