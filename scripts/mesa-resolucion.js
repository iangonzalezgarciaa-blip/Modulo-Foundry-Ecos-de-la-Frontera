/** Recibo sobre la tarjeta nativa. Registra hechos confirmados; no reconstruye daño ni movimiento. */
import {escTexto as esc} from './verbe-reading.js';
const MOD='ecos-frontera',colas=new Map();
const flag=m=>{const r=m?.getFlag?.(MOD,'resolucion')??m?.flags?.[MOD]?.resolucion;return r?.version===1&&Array.isArray(r.pasos)&&typeof r.nonce==='string'?r:null;};
const principal=()=>game.user.isGM&&(!game.users.activeGM||game.users.activeGM.isSelf);
const serial=(id,fn)=>{const prev=colas.get(id)??Promise.resolve(),p=prev.catch(()=>{}).then(fn);colas.set(id,p);return p.finally(()=>{if(colas.get(id)===p)colas.delete(id);});};
export function prepararRecibo(actor,item,v,e,meta){
 const complejo=v.grado>=6||v.despues<0||v.replica||meta.ritual||meta.familiaUso||meta.desgasteOjo||meta.sacrificarOjo||meta.costoPG||meta.dividirVerbe||meta.liberarReserva||meta.prestamo||e.reserva===meta.id;
 return {version:1,actorUuid:actor.uuid,itemId:item.id,nonce:v.nonce,ultimoUsoAnterior:e.ultimoUso??null,grado:v.grado,costo:v.costo,antes:v.antes,despues:v.despues,complejo:!!complejo,
  pasos:[{id:'coste',titulo:'Gasto preparado',detalle:`${v.costo} Verbe${v.control?` (incluye el derroche ${v.control.formula}: ${v.control.valor}${v.control.tope?', hasta tu límite':''})`:''}. Esperando confirmación del sistema.`}],manualResuelto:false,
  pendiente:'Comprueba objetivos, tiradas, estados y desplazamientos. Los efectos narrativos y movimientos que la ficha no automatice se resuelven en mesa.'};
}
export function mensajeWorkflow(wf){return wf?._ecosMensaje??game.messages?.get(wf?.itemCardId??wf?.messageId)??null;}
export async function registrarPaso(wf,id,titulo,detalle){
 const m=mensajeWorkflow(wf);if(!m||!flag(m)||!game.user.isGM&&!m.isOwner)return false;
 try{return await serial('m:'+m.id,async()=>{const r=flag(m);if(!r)return false;const pasos=r.pasos.filter(p=>p.id!==id);pasos.push({id,titulo,detalle:String(detalle).slice(0,1500)});await m.setFlag(MOD,'resolucion',{...r,pasos});return true;});}
 catch(err){console.warn(`${MOD} | no se pudo anotar el paso del recibo`,err);return false;}
}
export async function confirmarRecibo(activity,usage,results){
 const r=flag(results?.message);if(!r||!usage?.ecosVerbe)return;
 const e=activity.actor?.getFlag(MOD,'verbe');if(e?.ultimoUso!==r.nonce)return;
 await registrarPaso({_ecosMensaje:results.message},'coste','Verbe pagado',`${r.antes} → ${r.despues} Verbe. Coste: ${r.costo}. La actividad conserva sus acciones y usos normales.`);
}
export async function marcarMesa(m,nota=''){
 if(!game.user.isGM||!flag(m))return false;
 return serial('m:'+m.id,async()=>{const r=flag(m);await m.setFlag(MOD,'resolucion',{...r,manualResuelto:true,pasos:[...r.pasos.filter(p=>p.id!=='mesa'),{id:'mesa',titulo:'Revisión de mesa registrada',detalle:String(nota).slice(0,1000)||'El DM confirmó los estados, posiciones y consecuencias pendientes.'}]});return true;});
}
export async function corregirGasto(m){
 if(!principal()||!flag(m))return {ok:false,motivo:'Solo el GM principal corrige un gasto.'};
 return serial('m:'+m.id,async()=>{
  const r=flag(m);if(r.corregido||r.complejo)return {ok:false,motivo:'Este gasto ya se corrigió o tiene recursos especiales; revísalo desde la ficha con el DM.'};
  const actor=await fromUuid(r.actorUuid),api=game.modules.get(MOD)?.api?.verbe;
  if(!actor||!api?.corregirGastoSimple)return {ok:false,motivo:'No está disponible la corrección segura del Verbe.'};
  const resultado=await api.corregirGastoSimple(actor,r);if(!resultado.ok)return resultado;
  await m.setFlag(MOD,'resolucion',{...r,corregido:true,pasos:[...r.pasos,{id:'correccion',titulo:'Gasto de Verbe corregido por el DM',detalle:'Se restauró la reserva anterior. El daño, efectos, posiciones, reacción y resultados de la técnica deben corregirse por separado si corresponde.'}]});return resultado;
 });
}
export function reciboHTML(r){return `<section class="ecos-recibo"><h3>Resolución de esta técnica</h3><p><b>Grado ${r.grado} · ${r.costo} Verbe</b> · ${r.antes} → ${r.despues}${r.corregido?' · gasto corregido':''}</p><ol>${r.pasos.map(p=>`<li><b>${esc(p.titulo)}.</b> ${esc(p.detalle)}</li>`).join('')}</ol>${r.manualResuelto?'':`<p class="em-aviso"><b>Pendiente de revisar:</b> ${esc(r.pendiente)}</p>`}<button type="button" data-ecos-recibo="mesa">Registrar revisión de mesa</button>${!r.complejo&&!r.corregido?'<button type="button" data-ecos-recibo="corregir">Corregir solo gasto de Verbe</button>':''}<button type="button" data-ecos-recibo="devolver">Devolver Verbe (cantidad a mano)</button>${(r.devoluciones??[]).length?`<p class="ecos-nota">Devuelto: ${r.devoluciones.map(d=>`+${d.cantidad} (${esc(d.por)}${d.motivo?`: ${esc(d.motivo)}`:''})`).join(' · ')}</p>`:''}</section>`;}
/** Devolver una cantidad a mano desde la tarjeta: queda en el recibo y en el registro de la ficha. */
export async function devolverDesdeRecibo(m,cantidad,motivo){
 if(!game.user.isGM||!flag(m))return {ok:false,motivo:'Solo el DM devuelve Verbe.'};
 const r0=flag(m),actor=await fromUuid(r0.actorUuid),api=game.modules.get(MOD)?.api?.verbe;
 if(!actor||!api?.devolverVerbe)return {ok:false,motivo:'El Verbe no está disponible en este mundo.'};
 const x=await api.devolverVerbe(actor,cantidad,motivo,{mensaje:m.id});if(!x.ok)return x;
 await serial('m:'+m.id,async()=>{const r=flag(m);await m.setFlag(MOD,'resolucion',{...r,devoluciones:[...(r.devoluciones??[]),{cantidad:x.cantidad,por:x.por,motivo:x.motivo}].slice(-10),pasos:[...r.pasos.filter(p=>p.id!=='devolucion'),{id:'devolucion',titulo:'Verbe devuelto por el DM',detalle:`+${x.cantidad} (${x.antes} → ${x.despues})${x.motivo?`: ${x.motivo}`:''}. El daño, efectos y posiciones se corrigen aparte si hace falta.`}]});});
 return x;
}
function decorar(m,html){const r=flag(m);if(!r)return;const el=html instanceof HTMLElement?html:html?.[0];if(!el||el.querySelector('.ecos-recibo'))return;
 const bloque=document.createElement('div');bloque.innerHTML=reciboHTML(r);el.append(bloque);
 for(const b of bloque.querySelectorAll('[data-ecos-recibo]')){b.hidden=!game.user.isGM;b.addEventListener('click',async()=>{b.disabled=true;try{
  if(b.dataset.ecosRecibo==='mesa'){
   const nota=await foundry.applications.api.DialogV2.wait({window:{title:'Registrar revisión de mesa'},content:'<label>Qué confirmaste<textarea name="nota" maxlength="1000"></textarea></label>',buttons:[{action:'guardar',label:'Registrar',callback:(_e,button)=>({nota:button.form.elements.nota.value})},{action:'cancelar',label:'Cancelar',default:true}],rejectClose:false});
   if(nota&&typeof nota==='object')await marcarMesa(m,nota.nota);
  }else if(b.dataset.ecosRecibo==='devolver'){
   const r=flag(m),d=await foundry.applications.api.DialogV2.wait({window:{title:'Devolver Verbe'},content:`<p>Se suma a la reserva (sin pasar del máximo) y queda anotado aquí y en la ficha.</p><label>Cantidad<input name="cantidad" type="number" min="1" max="200" value="${Number(r?.costo)||1}"></label><label>Motivo<input name="motivo" maxlength="300" placeholder="Técnica mal configurada, error de mesa…"></label>`,buttons:[{action:'ok',label:'Devolver',default:true,callback:(_e,button)=>({cantidad:Number(button.form.elements.cantidad.value),motivo:button.form.elements.motivo.value})},{action:'no',label:'Cancelar'}],rejectClose:false});
   if(d&&typeof d==='object'){const x=await devolverDesdeRecibo(m,d.cantidad,d.motivo);if(!x.ok)ui.notifications.warn(x.motivo);}
  }else if(await foundry.applications.api.DialogV2.confirm({window:{title:'Corregir solo el gasto'},content:'<p>Se intenta restaurar únicamente el Verbe de este uso. No deshace daño, efectos, posiciones, acciones o reacciones. Se bloqueará si hubo otro uso o cambió la reserva.</p>',rejectClose:false})){const x=await corregirGasto(m);if(!x.ok)ui.notifications.warn(x.motivo);}
 }catch(err){console.error(`${MOD} | recibo`,err);ui.notifications.error('No se pudo completar la corrección. Revisa la ficha y la tarjeta.');}finally{b.disabled=false;}});}
}
Hooks.on('renderChatMessageHTML',decorar);
Hooks.on('dnd5e.postUseActivity',(a,u,r)=>{confirmarRecibo(a,u,r).catch(console.error);});
Hooks.on('midi-qol.RollComplete',wf=>{registrarPaso(wf,'tiradas','Flujo de tiradas completado',`${wf.hitTargets?.size??0} objetivo(s) impactado(s), ${wf.failedSaves?.size??0} salvación(es) fallida(s) según Midi-QOL. Revisa daño y efectos en las fichas; este recibo no los vuelve a aplicar.`).catch(console.error);});
Hooks.once('ready',()=>{(game.modules.get(MOD).api??={}).resolucion={registrarPaso,marcarMesa,corregirGasto,devolverDesdeRecibo};});
