import {buscarEntradas,textoPlano,claveTurno,perfilNpc,cambiosNpc,pasosPersonaje,ROLES_NPC,variacionNpc} from './mesa-core.js';
import {tablaAzar,CONTEXTOS_AZAR,REGLA_AZAR} from './azar-core.js';
import {escTexto as esc} from './verbe-reading.js';
import {consultarReliquias} from './relics.js';
import {auditarPersonaje,aprobarPersonaje} from './mesa-creacion.js';
import {revisionHTML,intencionesHTML,npcHTML,encuentrosHTML,diagnosticoHTML} from './mesa-vistas.js';
import {relacionadas} from './mesa-intenciones.js';
import {PLANTILLAS_NPC,auditarNpc,estimarEncuentro} from './mesa-encuentros.js';
import {diagnosticoMesa,anotarIncidencia,exportarDiagnostico,cuadernoPruebas,registrarPrueba} from './mesa-diagnostico.js';
import {memoriaHTML,cuadernoMemoria,adoptarMemoria} from './mesa-memoria.js';
import * as Musica from './mesa-musica.js';
const MOD='ecos-frontera',A=()=>game.modules.get(MOD)?.api?.verbe;
const lista=x=>Array.from(x?.contents??x??[]),dueno=a=>!!a&&(game.user.isGM||a.isOwner);
const observable=d=>!!d&&(game.user.isGM||d.testUserPermission?.(game.user,'OBSERVER')===true);
const opciones=(pares,elegido)=>pares.map(([id,n])=>`<option value="${esc(id)}" ${id===elegido?'selected':''}>${esc(n)}</option>`).join('');
const personajes=()=>lista(game.actors).filter(a=>dueno(a)&&['character','npc'].includes(a.type));
const seleccionado=()=>globalThis.canvas?.tokens?.controlled?.find(t=>dueno(t.actor))?.actor??game.user.character??personajes()[0]??null;
const aviso=msg=>ui.notifications.warn(msg);
const tipoImportador={class:'classes-subclasses',race:'races-and-subraces',background:'backgrounds',item:'items',spell:'spells',creature:'creatures'};
export async function abrirPlutonium(actor,tipo){
 if(actor&&!dueno(actor))return false;if(tipo==='creature'&&!game.user.isGM)return false;
 const mod=game.modules.get('plutonium');if(!mod?.active||typeof mod.api?.importer?.pOpen!=='function'){
  aviso('Plutonium no está activo o no expone el importador compatible. Usa el importador de tu ficha o los compendios del sistema.');return false;
 }
 try{await mod.api.importer.pOpen({actor:tipo==='creature'?null:actor,modeId:tipoImportador[tipo]??null});return true;}
 catch(err){console.error(`${MOD} | Plutonium`,err);aviso('Plutonium no pudo abrir ese importador. Revisa su permiso de importación, versión y configuración; puedes seguir desde su botón nativo.');return false;}
}
/** Búsqueda local: ningún contenido privado se copia a un índice de jugadores. */
export async function entradasCampana({compendios=false}={}){
 const out=[],poner=(d,tipo,texto)=>{if(observable(d))out.push({nombre:d.name,uuid:d.uuid,tipo,texto:textoPlano(texto)});};
 for(const j of lista(game.journal)){
  if(!observable(j))continue;
  for(const p of lista(j.pages))if(observable(p))out.push({nombre:`${j.name} · ${p.name}`,uuid:p.uuid,tipo:'Diario',texto:textoPlano(p.text?.content??'')});
 }
 for(const a of lista(game.actors)){const p=a.getFlag?.(MOD,'npcPerfil');poner(a,'Personaje',(a.system?.details?.biography?.value??'')+(p?` Entorno: ${p.entorno}. Motivación: ${p.motivacion}. Vínculo: ${p.vinculo}.`:''));
  if(observable(a))for(const i of lista(a.items))if(observable(i))poner(i,'Ficha · '+a.name,i.system?.description?.value??'');
 }
 for(const i of lista(game.items))poner(i,'Objeto',i.system?.description?.value??'');
 const D=A()?.datos?.();
 if(D){
  for(const r of D.ramas??[])out.push({nombre:r.nombre,tipo:'Guía de rama',texto:r.jugador??r.lead??'',catalogo:'rama:'+r.id});
  // Solo el DM busca en el repertorio completo; un jugador encuentra las técnicas que posee.
  if(game.user.isGM)for(const t of D.tecnicas)out.push({nombre:t.n,tipo:'Técnica · '+(D.ramas.find(r=>r.id===t.rama)?.nombre??t.rama),texto:t.texto+' '+(t.intenciones??[]).join(' '),catalogo:t.id});
 }
 if(game.user.isGM)for(const e of D?.memoriaNimerios?.entradas??[])out.push({nombre:e.nombre,tipo:'Memoria · '+e.tipo,texto:e.publico+' '+e.dm,catalogo:'memoria:'+e.id});
 if(game.user.isGM)for(const r of await consultarReliquias())out.push({nombre:r.nombre,tipo:'Reliquia · Nimerios',texto:r.texto,catalogo:'reliquia:'+r.id});
 let packsOmitidos=0;
 if(compendios){
  const packs=lista(game.packs).filter(p=>p.visible&&observable(p));packsOmitidos=Math.max(0,packs.length-40);
  for(const p of packs.slice(0,40)){
   try{const index=await p.getIndex();for(const e of lista(index))out.push({nombre:e.name,uuid:e.uuid??`Compendium.${p.collection}.${e._id}`,tipo:'Compendio · '+p.metadata.label,texto:'Búsqueda por nombre; abre la ficha para leerla.'});}
   catch(err){console.warn(`${MOD} | índice no disponible`,p.collection,err);packsOmitidos++;}
  }
 }
 return {entradas:out,packsOmitidos};
}
function rutinaNpc(p){
 const id=foundry.utils.randomID(),aid='ecosRutinaBase01',dist=p.rol==='tirador'||p.rol==='místico';
 return {name:'Rutina de campaña · '+ROLES_NPC[p.rol],type:'feat',img:'icons/svg/sword.svg',flags:{[MOD]:{rutinaNpc:true}},
  system:{type:{value:'monster'},description:{value:`<p>Alternativa de combate: realiza como máximo ${p.ataques} ataque${p.ataques>1?'s':''} de esta rutina al dedicarle tu acción completa. Pulsa el ataque una vez por cada ataque permitido; no se lanza una multiacción automática. Cada impacto causa ${p.dados}d${p.denominacion}. No se suma a Multiataque, acciones importadas u otra rutina en esa misma acción. Las acciones legendarias o adicionales no se conceden por este perfil.</p>`},
   activities:{[aid]:{_id:aid,name:'Ataque de la rutina',type:'attack',activation:{override:true,type:'action',value:1,condition:'Parte de la rutina; el DM lleva el número de ataques.'},
    duration:{override:true,units:'inst'},range:{override:true,units:'m',value:dist?18:1.5},target:{override:true,prompt:true,affects:{type:'creature',count:'1'},template:{}},
    attack:{ability:'',bonus:String(p.ataque),flat:true,type:{value:dist?'ranged':'melee',classification:p.rol==='místico'?'spell':'weapon'},critical:{threshold:null}},
    damage:{includeBase:false,critical:{bonus:''},parts:[{number:p.dados,denomination:p.denominacion,bonus:'',types:[p.rol==='místico'?'force':'bludgeoning'],custom:{enabled:false,formula:''},scaling:{mode:'',number:1,formula:''}}]},
    consumption:{spellSlot:false,targets:[],scaling:{allowed:false}},uses:{spent:0,recovery:[]},effects:[]}},identifier:'ecos-rutina-campana'},_id:id};
}
export async function guardarNpc(base,p,{copiar=true,curar=false}={}){
 if(!game.user.isGM||base&&base.type!=='npc')return null;
 p=perfilNpc(p);
 let actor=base;
 if(!base||copiar){
  const datos=base?base.toObject():{type:'npc',system:{attributes:{movement:{units:'m'}}}};
  delete datos._id;delete datos._stats;delete datos.folder;delete datos.ownership;delete datos.sort;
  datos.name=p.nombre;datos.ownership={default:0};
  if(datos.prototypeToken){datos.prototypeToken.name=p.nombre;datos.prototypeToken.actorLink=false;delete datos.prototypeToken.actorId;}
  // Copia los objetos reales de Plutonium sin reimportarlos ni reescribir sus vínculos de avance.
  actor=await Actor.create(datos);if(!actor)return null;
 }
 const campos=['name','system.details.cr','system.attributes.hp.max','system.attributes.hp.value','system.attributes.ac.calc','system.attributes.ac.flat','system.attributes.movement.walk'];
 const anterior=Object.fromEntries(campos.map(k=>[k,foundry.utils.getProperty(actor,k)??null]));
 const rutina=lista(actor.items).find(i=>i.getFlag?.(MOD,'rutinaNpc')),datos=rutinaNpc(p);
 const previo=actor.getFlag(MOD,'npcPerfil');
 const perfilAnterior=previo?structuredClone(previo):null;
 if(perfilAnterior)for(const k of ['anterior','rutinaAnterior','perfilAnterior','rutinaActual'])delete perfilAnterior[k];
 const rutinaAnterior=rutina?.toObject()??null;let nueva=null;
 try{
  await actor.update(cambiosNpc(actor,p,{curar:curar||!base}));
  if(rutina){delete datos._id;await rutina.update(datos);}else [nueva]=await actor.createEmbeddedDocuments('Item',[datos]);
  await actor.setFlag(MOD,'npcPerfil',{version:1,...p,creado:Date.now(),origen:base?.uuid??null,anterior:!copiar&&base?anterior:null,
   rutinaAnterior:!copiar&&base?rutinaAnterior:null,perfilAnterior:!copiar&&base?perfilAnterior:null,rutinaActual:datos,
   aplicado:Object.fromEntries(campos.map(k=>[k,foundry.utils.getProperty(actor,k)??null])),textoAplicado:(rutina??nueva)?.system?.description?.value??''});
 }catch(err){
  if(!base||copiar)await actor.delete();
  else {await actor.update(anterior);if(nueva)await nueva.delete();if(rutina&&rutinaAnterior){delete rutinaAnterior._id;await rutina.update(rutinaAnterior);}}
  throw err;
 }
 return actor;
}
export async function deshacerNpc(actor){
 if(!game.user.isGM||actor?.type!=='npc')return false;const p=actor.getFlag(MOD,'npcPerfil');if(!p?.anterior)return false;
 const i=lista(actor.items).find(i=>i.getFlag?.(MOD,'rutinaNpc'));
 if(p.aplicado&&(Object.entries(p.aplicado).some(([k,v])=>(foundry.utils.getProperty(actor,k)??null)!==v)||(i?.system?.description?.value??'')!==p.textoAplicado)){
  aviso('La ficha cambió después de adaptarla. Revisa el respaldo de npcPerfil y ajusta manualmente para conservar daño y notas posteriores.');return false;
 }
 await actor.update(p.anterior);
 if(i&&p.rutinaAnterior){const d=structuredClone(p.rutinaAnterior);delete d._id;await i.update(d);}else if(i)await i.delete();
 if(p.perfilAnterior)await actor.setFlag(MOD,'npcPerfil',p.perfilAnterior);else await actor.unsetFlag(MOD,'npcPerfil');return true;
}
export async function crearPersonaje(nombre){
 if(!Actor.canUserCreate?.(game.user)){aviso('Tu usuario no tiene permiso para crear actores. El DM puede crear la ficha y darte propiedad.');return null;}
 nombre=String(nombre??'').trim().slice(0,100);if(!nombre)return null;
 return Actor.create({name:nombre,type:'character',ownership:{default:0,[game.user.id]:3},flags:{[MOD]:{creacionEcos:true}}});
}
export class MesaEcos extends foundry.applications.api.ApplicationV2{
 static DEFAULT_OPTIONS={id:'ecos-mesa',classes:['ecos-mesa'],tag:'div',window:{title:'Ecos · Mesa de campaña',resizable:true},position:{width:920,height:760},actions:{}};
 constructor({actor=null,pestana='turno',...options}={}){super(options);this.actor=actor??seleccionado();this.pestana=pestana;this.resultados=[];this.consulta='';this.plan=null;this.informe='';this.ocupado=false;}
 _prepareContext(){return {};}
 async _renderHTML(){
  if(this.actor&&!dueno(this.actor))this.actor=null;
  const tabs=[['turno','Mi turno'],['intenciones','Qué quiero hacer'],['crear','Crear personaje'],['buscar','Buscar información'],['azar','Dados 1 y 20'],['diagnostico','Diagnóstico y pruebas'],...(game.user.isGM?[['dm','Dirección'],['npc','Taller de NPC'],['encuentros','Encuentros'],['memoria','Identidad de Nimerios']]:[])];
  const contenido=await({turno:()=>this.turno(),intenciones:()=>intencionesHTML(this),diagnostico:()=>diagnosticoHTML(this),encuentros:()=>encuentrosHTML(this),memoria:()=>memoriaHTML(this),crear:()=>this.crear(),buscar:()=>this.buscar(),azar:()=>this.azar(),dm:()=>game.user.isGM?this.dm():'',npc:()=>game.user.isGM?this.npc():''}[this.pestana]??(()=>this.turno()))();
  return `<div class="em-marco"><header class="em-cabecera"><div><h1>Tu mesa, a mano</h1><p>Elige una tarea. Cada herramienta explica qué hace y qué debes confirmar en mesa.</p></div><label>Ficha activa<select name="actor"><option value="">Sin ficha</option>${opciones(personajes().map(a=>[a.uuid,a.name]),this.actor?.uuid)}</select></label></header><nav class="em-tabs" aria-label="Herramientas de campaña">${tabs.map(([id,n])=>`<button type="button" data-em="tab" data-id="${id}" ${id===this.pestana?'aria-current="page"':''}>${n}</button>`).join('')}</nav><main class="em-contenido">${this.informe?`<p role="status" class="em-aviso">${esc(this.informe)}</p>`:''}${contenido}</main><footer class="em-pie">Ecos · Foundry 13 · D&D 5e. Las fichas y las reglas del sistema siguen resolviendo las tiradas.</footer></div>`;
 }
 _replaceHTML(html,content){content.innerHTML=html;content.querySelector('[name="actor"]')?.addEventListener('change',async e=>{this.actor=await fromUuid(e.target.value);this.plan=null;this.render();});
  content.querySelectorAll('[data-em]').forEach(b=>b.addEventListener('click',async ev=>{ev.preventDefault();if(this.ocupado)return;this.ocupado=true;b.disabled=true;try{await this.accion(b.dataset.em,b.dataset.id,content);}catch(err){anotarIncidencia('mesa:'+b.dataset.em);console.error(`${MOD} | mesa`,err);this.informe=err.message??'No se pudo completar la tarea.';}finally{this.ocupado=false;b.disabled=false;this.render();}}));
  content.querySelector('[data-form-buscar]')?.addEventListener('submit',e=>{e.preventDefault();content.querySelector('[data-em="buscar"]')?.click();});
 }
 turno(){
  const a=this.actor;if(!a)return '<h2>Empieza por una ficha</h2><p>Selecciona tu personaje arriba o abre «Crear personaje». El DM puede darte propiedad sobre una ficha existente.</p>';
  const hp=a.system.attributes?.hp??{},v=A()?.estado?.(a),key=claveTurno(a.id,game.combat),marcas=a.getFlag(MOD,'mesaTurno')??{},hecho=marcas.clave===key?marcas:{};
  const favoritos=a.getFlag(MOD,'mesaFavoritos')??[],items=lista(a.items),estados=lista(a.statuses).join(', ')||'Sin estados registrados';
  return `<h2>${esc(a.name)} · lo esencial</h2><div class="em-resumen"><div><b>${hp.value??'—'} / ${hp.max??'—'}</b><span>Puntos de vida${hp.temp?` · ${hp.temp} temporales`:''}</span></div><div><b>${a.system.attributes?.ac?.value??'—'}</b><span>Clase de armadura</span></div><div><b>${a.system.attributes?.movement?.walk??'—'} ${esc(a.system.attributes?.movement?.units??'m')}</b><span>Movimiento</span></div>${v?.despierto?`<div><b>${v.valor} / ${A()?.maxVerbe?.(a)??'—'}</b><span>Verbe disponible</span></div>`:''}</div><p><b>Estados:</b> ${esc(estados)}. <b>Concentración:</b> ${esc(lista(a.effects).filter(e=>!e.disabled&&(e.statuses?.has?.('concentrating')||e.flags?.dnd5e?.concentration)).map(e=>e.name).join(', ')||'Revisa los efectos de tu ficha si mantienes un poder.')}</p>
   <section><h3>Mi lista del turno</h3><p>Recordatorio personal; no concede ni consume acciones del sistema. Se renueva al comenzar tu turno propio; fuera de combate puedes limpiarlo.</p><div class="em-fila">${[['accion','Acción'],['adicional','Acción adicional'],['reaccion','Reacción'],['movimiento','Movimiento']].map(([id,n])=>`<button type="button" data-em="marcar" data-id="${id}" aria-pressed="${!!hecho[id]}">${hecho[id]?'✓ ':''}${n}</button>`).join('')}<button type="button" data-em="limpiar">Limpiar lista</button></div></section>
   <section><h3>Tus accesos frecuentes</h3><div class="em-fila"><button type="button" data-em="hoja">Abrir ficha</button>${v?.despierto?'<button type="button" data-em="verbe">Abrir Verbe</button>':''}<button type="button" data-em="compendios">Abrir compendios</button></div>${favoritos.map(id=>items.find(i=>i.id===id)).filter(Boolean).map(i=>`<article class="em-tarjeta"><b>${esc(i.name)}</b><div><button type="button" data-em="usar" data-id="${i.id}">Usar desde el sistema</button><button type="button" data-em="item" data-id="${i.id}">Consultar</button><button type="button" data-em="favorito" data-id="${i.id}">Quitar acceso</button></div></article>`).join('')||'<p>Añade hasta ocho técnicas, conjuros, armas o rasgos para encontrarlos sin recorrer toda la ficha.</p>'}<label>Añadir acceso<select name="favorito">${opciones(items.filter(i=>!favoritos.includes(i.id)).map(i=>[i.id,i.name]),'')}</select></label><button type="button" data-em="favorito">Añadir a mis accesos</button></section>
   <section><h3>Tirada rápida</h3><p>El sistema abre su diálogo normal con tus bonificadores, ventaja y visibilidad.</p><div class="em-fila"><label>Habilidad<select name="habilidad">${opciones(Object.entries(CONFIG.DND5E.skills??{}).map(([id,s])=>[id,game.i18n.localize(s.label??s)]),'')}</select></label><button type="button" data-em="skill">Tirar habilidad</button><label>Característica<select name="caracteristica">${opciones(Object.entries(CONFIG.DND5E.abilities??{}).map(([id,s])=>[id,game.i18n.localize(s.label??s)]),'wis')}</select></label><button type="button" data-em="save">Salvación</button><button type="button" data-em="ability">Prueba de característica</button></div></section>
   <section><h3>Mi siguiente paso</h3><label>Recordatorio de la ficha<textarea name="nota" maxlength="2000">${esc(a.getFlag(MOD,'mesaNota')??'')}</textarea></label><p>Lo pueden leer quienes tengan acceso a esta ficha. Guarda aquí objetivos o recordatorios que quieras compartir.</p><button type="button" data-em="nota">Guardar recordatorio</button></section>`;
 }
 crear(){
  const a=this.actor,r=auditarPersonaje(a),pasos=pasosPersonaje(a,{aprobada:r.filas.find(f=>f.id==='aprobacion')?.estado==='ok'}),plut=game.modules.get('plutonium')?.active;
  return `<h2>Un personaje, paso a paso</h2><p>Importa una elección cada vez y termina sus diálogos nativos de avance. Después revisa la ficha y decide con el DM si se activan Ecos y, por separado, el Verbe.</p><div class="em-fila"><label>Nombre de una ficha nueva<input name="nombrePj" maxlength="100" placeholder="Liria del Vado"></label><button type="button" data-em="crearPj">Crear ficha vacía</button></div>${a?.type==='character'?`<ol class="em-pasos">${pasos.map(p=>`<li><b>${p.hecho?'✓ ':''}${p.nombre}</b>${tipoImportador[p.id]?`<button type="button" data-em="importar" data-id="${p.id}">${plut?'Elegir con Plutonium':'Consultar compendios'}</button>`:''}${p.id==='caracteristicas'?'<p>Usa el reparto estándar antes de los aumentos de origen, o revísalos después con el DM. No los sumes dos veces.</p><button type="button" data-em="caracteristicas">Repartir valores estándar</button><button type="button" data-em="caracteristicasRevisadas">Confirmar reparto revisado</button>':''}</li>`).join('')}</ol><button type="button" data-em="hoja">Abrir ficha y avances</button>${revisionHTML(a)}`:'<p>Elige una ficha de personaje para continuar.</p>'}<p>Plutonium conserva sus fuentes, permisos y avances. El asistente abre su importador existente y no desbloquea funciones de suscripción. Los compendios del sistema siguen disponibles.</p><button type="button" data-em="refrescar">Revisar progreso</button>`;
 }
 buscar(){
  this.fuentesRelacionadas=[];
  const tarjetas=this.resultados.map((r,i)=>{
   const fuentes=i<12?relacionadas(this.entradasBusqueda??[],r,3):[];
   return `<article class="em-tarjeta"><h3>${esc(r.nombre)}</h3><p class="em-etiqueta">${esc(r.tipo)}</p><p>${esc(r.extracto)}</p><button type="button" data-em="resultado" data-id="${i}">Abrir fuente</button>${fuentes.length?`<details><summary>Fuentes con nombres o temas coincidentes</summary><p>Estas coincidencias ayudan a investigar; no prueban una relación de canon.</p>${fuentes.map(f=>{const id=this.fuentesRelacionadas.push(f)-1;return `<p>${esc(f.nombre)} · ${esc(f.tipo)} <button type="button" data-em="relacionada" data-id="${id}">Abrir fuente relacionada</button></p>`;}).join('')}</details>`:''}</article>`;
  }).join('');
  return `<h2>Asistente de consulta de campaña</h2><p>Busca palabras, nombres y fragmentos en fuentes que puedas leer. El DM consulta también repertorio, reliquias y memoria de Nimerios. Los resultados citan su fuente; este buscador local no inventa respuestas.</p><form data-form-buscar><label>Qué buscas<input name="consulta" value="${esc(this.consulta)}" maxlength="160" placeholder="Descanso santuario, transporte, una persona o un lugar"></label><label class="em-check"><input type="checkbox" name="packs" ${this.incluirCompendios?'checked':''}>Incluir nombres de compendios visibles (hasta 40 por búsqueda)</label><button type="submit" data-em="buscar">Buscar en la campaña</button></form><p>${esc(this.resumenBusqueda??'Cada palabra debe aparecer en el nombre o el texto. La búsqueda ignora tildes y mayúsculas.')}</p>${tarjetas}`;
 }
 azar(){const n=Number(this.actor?.system?.details?.level)||1;return `<h2>Qué pasa con un 1 o un 20</h2><p>${esc(REGLA_AZAR)}</p><p>Se propone una fila aleatoria de 1d8 en el chat. El DM puede aprobarla o descartarla. Solo los cambios de CA o velocidad se aplican como efectos; los ajustes a una prueba concreta y los resultados narrativos se acuerdan y anotan en mesa. No hay daño, curaciones, Verbe gratis o pérdida de acciones.</p><p><b>Escala actual:</b> nivel ${n}. Bonificación o penalización breve máxima: ${Math.min(3,Math.ceil((2+Math.floor((Math.max(1,n)-1)/4))/2))}. Velocidad: 1,5 m. Un resultado sustituye al anterior de estas tablas.</p>${Object.entries(CONTEXTOS_AZAR).map(([id,nombre])=>`<details><summary>${nombre}</summary>${[1,20].map(d=>`<h3>${d===1?'1 · Contratiempos':'20 · Oportunidades'}</h3><ol>${tablaAzar(id,d,n).map(f=>`<li><b>${esc(f.nombre)}.</b> ${esc(f.texto)}</li>`).join('')}</ol>`).join('')}</details>`).join('')}`;}
 dm(){
  if(!game.user.isGM)return '';const grupo=lista(game.actors).filter(a=>a.type==='character'&&a.hasPlayerOwner);
  return `<h2>Control de la sesión</h2><p>Consulta el grupo sin abrir cada ficha. Los valores son los que el sistema ha calculado, incluidos sus efectos activos.</p><div class="em-tabla"><table><thead><tr><th>Personaje</th><th>PG</th><th>CA</th><th>Percepción pasiva</th><th>Agotamiento</th><th>Verbe</th></tr></thead><tbody>${grupo.map(a=>{const v=A()?.estado?.(a);return `<tr><th><button type="button" data-em="actorDM" data-id="${a.id}">${esc(a.name)}</button></th><td>${a.system.attributes?.hp?.value??'—'}/${a.system.attributes?.hp?.max??'—'}</td><td>${a.system.attributes?.ac?.value??'—'}</td><td>${a.system.skills?.prc?.passive??'—'}</td><td>${a.system.attributes?.exhaustion??0}</td><td>${v?.despierto?v.valor:'—'}</td></tr>`;}).join('')}</tbody></table></div><section><h3>Cuaderno privado del DM</h3><p>Guarda objetivos de escena, pistas pendientes, voces y vínculos. Se crea un diario con acceso exclusivo del DM. No se publica en ajustes que reciban los jugadores.</p><button type="button" data-em="cuaderno">Abrir o crear cuaderno privado</button></section><section><h3>Revisar efectos del módulo</h3><p>Selecciona una ficha y consulta sus efectos de Ecos. Puedes retirar un efecto que haya quedado pendiente; la ficha conserva sus demás efectos, cargas y estados del sistema.</p>${this.actor?lista(this.actor.effects).filter(e=>e.flags?.[MOD]).map(e=>`<article class="em-tarjeta"><b>${esc(e.name)}</b><span>${e.disabled?'Inactivo':'Activo'}</span><button type="button" data-em="quitarEfecto" data-id="${e.id}">Retirar de ${esc(this.actor.name)}</button></article>`).join('')||'<p>Sin efectos de Ecos en la ficha elegida.</p>':'<p>Elige una ficha arriba.</p>'}</section>${Musica.musicaHTML()}<section><h3>Devolver Verbe</h3><p>Si un uso no debió cobrarse (o se cobró de más), devuelve la cantidad a mano. No pasa del máximo de la ficha y queda anotado con tu nombre, la cantidad y el motivo. Para un uso simple también tienes «Corregir solo el gasto» en la tarjeta del chat.</p>${(()=>{const api=A(),vivos=grupo.filter(a=>api?.estado?.(a)?.despierto);if(!vivos.length)return '<p>Ningún personaje del grupo tiene el Verbe despierto.</p>';const reg=vivos.flatMap(a=>(api.estado(a).devoluciones??[]).map(r=>({...r,quien:a.name}))).sort((x,y)=>String(y.fecha).localeCompare(String(x.fecha))).slice(0,8);return `<div class="em-fila"><label>Ficha<select name="devolverActor">${opciones(vivos.map(a=>[a.id,`${a.name} · ${api.estado(a).valor}/${api.maxVerbe?.(a)??'?'}`]),this.actor?.id??'')}</select></label><label>Cantidad<input name="devolverCantidad" type="number" min="1" max="200" value="1"></label><label>Motivo<input name="devolverMotivo" maxlength="300" placeholder="Técnica mal configurada, error de mesa…"></label><button type="button" data-em="devolverVerbe">Devolver Verbe</button></div>${reg.length?`<details><summary>Últimas devoluciones</summary><ul>${reg.map(r=>`<li>${esc(new Date(r.fecha).toLocaleString())} · ${esc(r.quien)}: +${r.cantidad} (${r.antes} → ${r.despues}) · ${esc(r.por)}${r.motivo?` · ${esc(r.motivo)}`:''}</li>`).join('')}</ul></details>`:''}`;})()}</section><section><h3>Editar técnicas</h3><p>Taller del DM: crea, edita o borra técnicas del mundo y técnicas propias de cada ficha; cambia el texto o los números de cualquier técnica o dote del módulo (se guarda solo la diferencia y puedes restaurar el original); abre reliquias y hechizos en su editor.</p><button type="button" data-em="editarTecnicas">Editar técnicas</button></section><section><h3>Preparar una variante de NPC</h3><p>El taller crea perfiles por rol, conserva los objetos importados y muestra los cambios antes de guardarlos.</p><button type="button" data-em="tab" data-id="npc">Abrir taller de NPC</button></section>`;
 }
 npc(){return game.user.isGM?npcHTML(this):'';}
 previaNpc(){const p=this.plan.perfil,b=game.actors.get(this.plan.base);return `<section class="em-previa"><h3>Antes de guardar · ${esc(p.nombre)}</h3><div class="em-tabla"><table><thead><tr><th>Campo</th><th>Base</th><th>Propuesta</th></tr></thead><tbody>${[['PG máximos',b?.system.attributes?.hp?.max??'Nueva ficha',p.pg],['CA fija',b?.system.attributes?.ac?.value??'—',p.ca],['Velocidad',b?.system.attributes?.movement?.walk??'—',p.velocidad+' m'],['Rutina alternativa','Acciones importadas conservadas',p.ataques+' ataque(s), +'+p.ataque+', '+p.dados+'d'+p.denominacion+' por impacto'],...(p.variacion?[['Verbe variable','—',`PG ${p.variacion.pg>=0?'+':''}${Math.round(p.variacion.pg*100)} %, CA ${p.variacion.ca>=0?'+':''}${p.variacion.ca}, daño ${p.variacion.dano>=0?'+':''}${Math.round(p.variacion.dano*100)} %, reserva ${p.variacion.reserva>=0?'+':''}${Math.round(p.variacion.reserva*100)} % (si tiene Verbe)`]]:[])].map(([k,a,n])=>`<tr><th>${k}</th><td>${esc(a)}</td><td>${esc(n)}</td></tr>`).join('')}</tbody></table></div><p>${esc(p.aviso)}</p><p><b>Destino:</b> ${this.plan.copiar||!b?'copia nueva privada':'actualización de '+esc(b.name)}. <b>Motivación:</b> ${esc(p.motivacion)||'Por definir'}. <b>Vínculo:</b> ${esc(p.vinculo)||'Por definir'}.</p><button type="button" data-em="guardarNpc">Guardar esta propuesta</button></section>`;}
 async accion(op,id,root){
  const v=n=>root.querySelector(`[name="${n}"]`)?.value??'',check=n=>!!root.querySelector(`[name="${n}"]`)?.checked,a=this.actor;
  this.informe='';
  if(this.pestana==='npc')this.borradorNpc={base:v('npcBase'),nombre:v('npcNombre'),vd:v('npcVd'),rol:v('npcRol'),entorno:v('npcEntorno'),motivacion:v('npcMotivacion'),vinculo:v('npcVinculo'),arquetipo:v('npcArquetipo'),copiar:v('npcCopiar')!=='no',curar:check('npcCurar'),variable:check('npcVariable')};
  if(op==='intencion'){this.intencion=v('intencion');return;}
  if(op==='opcionIntencion'){const t=this.ofertasIntencion?.[Number(id)];if(t&&dueno(a)){A()?.abrirOferta?.(a,t.id);this.informe=`Se abrió el Verbe filtrado por «${t.nombre}». Confirma sus requisitos y coste antes de aprenderla o usarla.`;}return;}
  if(op==='exportarDiagnostico'){exportarDiagnostico();return;}
  if(op==='pruebasCuaderno'){const j=await cuadernoPruebas();j?.sheet?.render(true);return;}
  if(op==='pruebaGuardar'){if(await registrarPrueba(id,v('prueba-'+id),v('nota-'+id)))this.informe='Resultado guardado en el cuaderno privado.';return;}
  if(op==='memoriaEnlace'){if(!game.user.isGM)return;const j=await cuadernoMemoria();j.pages.find(p=>p.getFlag(MOD,'memoriaId')===id)?.sheet?.render(true);return;}
  if(op==='memoriaBuscar'){this.filtroMemoria=v('memoriaFiltro').slice(0,150);return;}
  if(op==='memoriaCuaderno'){const j=await cuadernoMemoria();j?.sheet?.render(true);return;}
  if(['memoriaFuente','memoriaAdoptar','memoriaDescartar'].includes(op)){
   if(!game.user.isGM)return;const e=this.entradasMemoria?.[Number(id)];if(!e)return;
   if(op==='memoriaFuente'){const j=await cuadernoMemoria();j.pages.find(p=>p.getFlag(MOD,'memoriaId')===e.id)?.sheet?.render(true);}
   else await adoptarMemoria(e.id,op==='memoriaAdoptar'?'adoptado':'descartado');return;
  }
  if(op==='plantillaNpc'){
   if(!game.user.isGM)return;const t=PLANTILLAS_NPC[v('npcArquetipo')];if(!t)return;this.borradorNpc={...this.borradorNpc,rol:t.rol,motivacion:t.motivo,vinculo:t.uso};this.plan=null;return;
  }
  if(['encAgregar','encQuitar','encCalcular'].includes(op)){
   if(!game.user.isGM)return;this.grupoEncuentro=[...root.querySelectorAll('[name="encGrupo"]:checked')].map(x=>x.value);this.enemigosEncuentro??=[];
   if(op==='encQuitar'){this.enemigosEncuentro.splice(Number(id),1);return;}
   if(op==='encAgregar'){
    const actor=game.actors.get(v('encActor')),cantidad=Number(v('encCantidad')),blancos=Number(v('encBlancos'));
    if(actor?.type!=='npc'||!Number.isInteger(cantidad)||cantidad<1||cantidad>30||!Number.isInteger(blancos)||blancos<1||blancos>30)throw Error('Elige un NPC, cantidad y número de blancos entre 1 y 30.');
    if(v('encModo')==='ajustado'&&v('encDano')==='')throw Error('Indica el daño esperado por blanco después de las salvaciones o ajustes pertinentes.');
    for(const [n,min,max]of [['encDano',0,10000],['encAtaque',-10,40]])if(v(n)!==''&&(!Number.isFinite(Number(v(n)))||Number(v(n))<min||Number(v(n))>max))throw Error('Revisa el daño de rutina y el bonificador de ataque.');
    this.enemigosEncuentro.push({actor,cantidad,blancos,modo:v('encModo')==='ajustado'?'ajustado':'ataque',...(v('encDano')!==''?{danoRonda:Number(v('encDano'))}:{}),...(v('encAtaque')!==''?{ataque:Number(v('encAtaque'))}:{})});
   }return;
  }
  if(op==='tab'){this.pestana=id;return;}
  if(op==='refrescar')return;
  if(op==='compendios'){ui.sidebar?.changeTab?.('compendium');return;}
  if(op==='importar'){await abrirPlutonium(id==='creature'?null:a,id);return;}
  if(op==='crearPj'){this.actor=await crearPersonaje(v('nombrePj'));return;}
  if(op==='buscar'){
   this.consulta=v('consulta').trim();const d=await entradasCampana({compendios:check('packs')});this.resultados=buscarEntradas(d.entradas,this.consulta);this.entradasBusqueda=d.entradas.filter(e=>!e.tipo.startsWith('Compendio')).slice(0,2000);this.incluirCompendios=check('packs');
   this.resumenBusqueda=`${this.resultados.length} resultado(s), máximo 60. ${d.packsOmitidos?d.packsOmitidos+' compendio(s) omitidos o no disponibles.':'Los compendios se buscan por nombre cuando los incluyes.'}`;return;
  }
  if(op==='resultado'||op==='relacionada'){
   const r=(op==='resultado'?this.resultados:this.fuentesRelacionadas)[Number(id)];if(!r)return;
   if(r.uuid){const d=await fromUuid(r.uuid);if(!observable(d))return aviso('Ya no tienes acceso a esta fuente.');d.sheet?.render(true);return;}
   if(r.catalogo?.startsWith('memoria:')){
    if(!game.user.isGM)return;const j=await cuadernoMemoria();j.pages.find(p=>p.getFlag(MOD,'memoriaId')===r.catalogo.slice(8))?.sheet?.render(true);return;
   }
   if(r.catalogo){const D=A()?.datos?.(),t=D?.tecnicas.find(t=>t.id===r.catalogo),rama=D?.ramas.find(x=>'rama:'+x.id===r.catalogo),reliquia=game.user.isGM&&r.catalogo.startsWith('reliquia:')?(await consultarReliquias()).find(x=>'reliquia:'+x.id===r.catalogo):null;
    if(r.catalogo.startsWith('reliquia:')&&!reliquia)return;
    if(t&&!game.user.isGM)return;
    await foundry.applications.api.DialogV2.wait({window:{title:r.nombre,resizable:true},position:{width:720},content:`<div class="ecos-dialogo">${t?t.item.system.description.value:reliquia?reliquia.item.system.description.value:`<p>${esc(rama?.jugador??rama?.lead??'')}</p>`}</div>`,buttons:[{action:'cerrar',label:'Cerrar',default:true}],rejectClose:false});return;
   }return;
  }
  if(op==='preverNpc'){
   if(!game.user.isGM)return;const base=v('npcBase');if(base&&game.actors.get(base)?.type!=='npc')throw Error('La base debe ser un NPC.');
   const rangos=Object.values(A()?.estado?.(game.actors.get(base))?.rangos??{}).reduce((t,n)=>t+(Number(n)||0),0);
   const variacion=check('npcVariable')?variacionNpc({rangos}):null;
   const perfil=perfilNpc({nombre:v('npcNombre'),vd:v('npcVd'),rol:v('npcRol'),entorno:v('npcEntorno'),motivacion:v('npcMotivacion'),vinculo:v('npcVinculo'),arquetipo:v('npcArquetipo'),variacion});
   this.plan={base,perfil,copiar:v('npcCopiar')!=='no',curar:check('npcCurar')};return;
  }
  if(op==='guardarNpc'){
   if(!game.user.isGM||!this.plan)return;const p=this.plan;
    const actual=perfilNpc({nombre:v('npcNombre'),vd:v('npcVd'),rol:v('npcRol'),entorno:v('npcEntorno'),motivacion:v('npcMotivacion'),vinculo:v('npcVinculo'),arquetipo:v('npcArquetipo'),variacion:check('npcVariable')?p.perfil.variacion:null});
    if(JSON.stringify(actual)!==JSON.stringify(p.perfil)||v('npcBase')!==p.base||(v('npcCopiar')!=='no')!==p.copiar||check('npcCurar')!==p.curar)throw Error('Cambiaste las opciones. Prepara otra vista previa antes de guardar.');
   // Se guarda exactamente la vista previa, nunca campos que se hayan cambiado sin revisar.
   const guardado=await guardarNpc(game.actors.get(p.base)??null,p.perfil,p);if(guardado&&p.perfil.variacion?.reserva&&A()?.despierto?.(guardado))await A().variarReservaNpc?.(guardado,p.perfil.variacion.reserva);if(guardado){this.actor=guardado;this.plan=null;this.borradorNpc=null;this.informe='NPC guardado. Revisa sus poderes importados y prueba la rutina antes de usarlo en un encuentro.';}return;
  }
  if(op==='musica'){if(!game.user.isGM)return;const f={reproducir:()=>Musica.reproducir(v('musicaUrl')),encolar:()=>Musica.encolar(v('musicaUrl')),pausar:Musica.pausar,seguir:Musica.seguir,siguiente:Musica.siguiente,detener:Musica.detener}[id];if(f)await f();return;}
  if(op==='ocultarEnemigos'){if(!game.user.isGM)return;const {ocultarDatosEnemigos}=await import('./mesa-oponentes.js');const h=await ocultarDatosEnemigos();this.informe=h?`Ocultado: ${h.prototipos} prototipo(s) y ${h.tokens} token(s) con barras solo para su dueño, ${h.fichas} ficha(s) en «Limitado»${h.ataque?', la CA del objetivo ya no se muestra en los ataques':''}.`:'Solo el DM.';return;}
  if(op==='devolverVerbe'){if(!game.user.isGM)return;const api=A(),a=game.actors.get(v('devolverActor'));const r=await api?.devolverVerbe?.(a,Number(v('devolverCantidad')),v('devolverMotivo'));this.informe=r?.ok?`${a.name}: +${r.cantidad} Verbe (${r.antes} → ${r.despues}). Anotado.`:(r?.motivo??'El Verbe está apagado en este mundo.');return;}
  if(op==='editarTecnicas'){if(!game.user.isGM)return;const ed=game.modules.get(MOD)?.api?.verbe?.editorCatalogo;if(!ed){this.informe='El Verbe está apagado en este mundo: enciéndelo en Ajustes para editar técnicas.';return;}ed();return;}
  if(op==='cuaderno'){
   if(!game.user.isGM)return;let j=lista(game.journal).find(j=>j.getFlag(MOD,'cuadernoMesa'));
   if(!j)j=await JournalEntry.create({name:'Ecos · Cuaderno privado de sesión',ownership:{default:0},flags:{[MOD]:{cuadernoMesa:true}},pages:[{name:'Preparar la próxima escena',type:'text',text:{format:1,content:'<h1>Preparar la próxima escena</h1><h2>Objetivo y riesgos</h2><p>¿Qué quieren conseguir? ¿Qué puede cambiar si tardan?</p><h2>Pistas</h2><p>Qué pueden descubrir, dónde y por qué medios.</p><h2>NPC y voces</h2><p>Motivo, vínculo, actitud y un detalle que se pueda interpretar.</p><h2>Consecuencias y pendientes</h2><p>Qué cambió en la sesión y qué sigue abierto.</p>'}}]});
   await j.update({ownership:{default:0,...Object.fromEntries(lista(game.users).filter(u=>!u.isGM).map(u=>[u.id,0]))}});j.sheet.render(true);return;
  }
  if(op==='actorDM'){if(game.user.isGM)game.actors.get(id)?.sheet?.render(true);return;}
  if(!dueno(a))return aviso('Selecciona una ficha que puedas controlar.');
  if(op==='hoja'){a.sheet?.render(true);return;}
  if(op==='verbe'){A()?.abrir?.(a);return;}
  if(op==='despertar'){if(game.user.isGM)A()?.despertar?.(a);return;}
  if(op==='marcar'||op==='limpiar'){
   const clave=claveTurno(a.id,game.combat),prev=a.getFlag(MOD,'mesaTurno')??{},c=prev.clave===clave?{...prev}:{clave};
   if(op==='marcar'&&['accion','adicional','reaccion','movimiento'].includes(id))c[id]=!c[id];
   await a.setFlag(MOD,'mesaTurno',op==='limpiar'?{clave}:c);return;
  }
  if(op==='favorito'){id||=v('favorito');if(!a.items.get(id))return;const f=a.getFlag(MOD,'mesaFavoritos')??[];
   if(!f.includes(id)&&f.length>=8)return aviso('Ya tienes ocho accesos; quita uno para añadir otro.');await a.setFlag(MOD,'mesaFavoritos',f.includes(id)?f.filter(x=>x!==id):[...f,id]);return;
  }
  if(op==='item'||op==='usar'){const i=a.items.get(id);if(!i)return;if(op==='usar'&&typeof i.use==='function')await i.use();else i.sheet?.render(true);return;}
  if(op==='skill'){await a.rollSkill({skill:v('habilidad')});return;}
  if(op==='save'){await a.rollSavingThrow({ability:v('caracteristica')});return;}
  if(op==='ability'){await a.rollAbilityCheck({ability:v('caracteristica')});return;}
  if(op==='nota'){await a.setFlag(MOD,'mesaNota',v('nota').slice(0,2000));this.informe='Recordatorio guardado en la ficha.';return;}
  if(op==='caracteristicasRevisadas'){await a.setFlag(MOD,'caracteristicasRevisadas',true);return;}
  if(op==='caracteristicas'){
   if(a.type!=='character')return;
   const keys=['str','dex','con','int','wis','cha'],valores=[15,14,13,12,10,8];
   const result=await foundry.applications.api.DialogV2.wait({window:{title:'Repartir valores estándar',resizable:true},content:`<div class="ecos-dialogo"><p>Esto cambia los seis valores base de la ficha elegida. Hazlo antes de añadir mejoras de especie o trasfondo, o incorpora sus ajustes después con el DM. No conserva automáticamente esos aumentos.</p>${keys.map((k,i)=>`<label>${esc(game.i18n.localize(CONFIG.DND5E.abilities[k]?.label??k))}<select name="${k}">${opciones(valores.map(n=>[String(n),String(n)]),String(valores[i]))}</select></label>`).join('')}</div>`,buttons:[{action:'guardar',label:'Aplicar a '+a.name,callback:(_ev,button)=>Object.fromEntries(keys.map(k=>[k,Number(button.form.elements[k].value)]))},{action:'cancelar',label:'Cancelar',default:true}],rejectClose:false});
   if(!result||typeof result!=='object')return;if(new Set(Object.values(result)).size!==6||Object.values(result).some(n=>!valores.includes(n)))throw Error('Usa cada valor estándar exactamente una vez.');
   await a.update(Object.fromEntries(keys.map(k=>[`system.abilities.${k}.value`,result[k]])));await a.setFlag(MOD,'caracteristicasRevisadas',true);return;
  }
  if(op==='revision'){const r=await aprobarPersonaje(a,{activarEcos:check('aprobarEcos'),revisado:check('aprobarRevision'),nota:v('aprobarNota')});if(!r.ok)throw Error(r.motivo);this.informe='Configuración aprobada. El Verbe conserva su estado independiente.';return;}
  if(op==='quitarEfecto'){
   if(!game.user.isGM)return;const e=a.effects.get(id);if(!e?.flags?.[MOD])return;
   if(await foundry.applications.api.DialogV2.confirm({window:{title:'Retirar efecto de Ecos'},content:`<p>Retirar «${esc(e.name)}» de ${esc(a.name)}. Las cargas gastadas no se recuperan.</p>`,rejectClose:false}))await e.delete();return;
  }
  if(op==='deshacerNpc'){if(await deshacerNpc(a))this.informe='Última adaptación deshecha; el resto de la ficha se conserva.';}
 }
}
let instanciaMesa=null;
export function abrirMesa(actor=null,pestana='turno'){
 if(!instanciaMesa?.rendered)instanciaMesa=new MesaEcos({actor:actor??seleccionado(),pestana});
 else {if(actor)instanciaMesa.actor=actor;instanciaMesa.pestana=pestana;}
 instanciaMesa.render({force:true});instanciaMesa.bringToFront?.();return instanciaMesa;
}
function botonMesa(app,html){const el=html instanceof HTMLElement?html:html?.[0];if(!el||el.querySelector('[data-ecos-mesa]'))return;
 const a=app.document??app.actor;if(a&&!dueno(a))return;const sitio=el.closest?.('.application')?.querySelector('.window-header')??el.querySelector('.window-header')??el.querySelector('.directory-header')??el.querySelector('header');if(!sitio)return;
 const b=document.createElement('button');b.type='button';b.dataset.ecosMesa='si';b.className='ecos-mesa-acceso';b.textContent='Mesa Ecos';b.title='Turno, creación de personajes, búsqueda y herramientas de campaña';b.addEventListener('click',()=>abrirMesa(a?.documentName==='Actor'?a:null));sitio.append(b);
}
Hooks.once('init',()=>{
 game.settings.registerMenu(MOD,'mesaEcos',{name:'Mesa de campaña de Ecos',label:'Abrir mesa de campaña',hint:'Accesos del jugador, creación por pasos, consulta y taller del DM.',icon:'fas fa-compass',type:MesaEcos,restricted:false});
 game.keybindings?.register(MOD,'mesaEcos',{name:'Abrir mesa de Ecos',editable:[{key:'KeyM',modifiers:['CONTROL']}],onDown:()=>{abrirMesa();return true;}});
});
Hooks.once('ready',()=>{const api=(game.modules.get(MOD).api??={});api.mesa={diagnostico:diagnosticoMesa,auditarPersonaje:a=>dueno(a)?auditarPersonaje(a):null,aprobarPersonaje,inspeccionarNpc:a=>game.user.isGM?auditarNpc(a):null,encuentro:(g,e)=>game.user.isGM?estimarEncuentro(g,e):null,prueba:registrarPrueba,memoria:cuadernoMemoria,abrir:abrirMesa,buscar:entradasCampana,plutonium:abrirPlutonium,perfilNpc,guardarNpc,deshacerNpc};});
Hooks.on('renderActorSheetV2',botonMesa);Hooks.on('renderActorDirectory',botonMesa);
Hooks.on('dnd5e.postUseActivity',(activity)=>{
 const a=activity.actor;if(!dueno(a)||!game.combat?.started)return;const tipo=activity.activation?.type??activity.system?.activation?.type??activity.item?.system?.activation?.type;
 const campo={action:'accion',bonus:'adicional',reaction:'reaccion'}[tipo];if(!campo)return;
 const clave=claveTurno(a.id,game.combat),p=a.getFlag(MOD,'mesaTurno')??{};
 a.setFlag(MOD,'mesaTurno',{...(p.clave===clave?p:{}),clave,[campo]:true}).catch(console.error);
});
