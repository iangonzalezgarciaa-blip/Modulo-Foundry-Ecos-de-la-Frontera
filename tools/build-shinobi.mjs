import { createHash } from 'node:crypto';
import { presupuestoTecnica } from '../scripts/verbe-core.js';
export const idNativo = s => createHash('sha256').update(s).digest('hex').slice(0,16);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const tiempos={A:['action',1],AA:['bonus',1],R:['reaction',1],'1 min':['minute',1],'10 min':['minute',10],'1 h':['hour',1],'8 h':['hour',8]};
const formas={cono:'cone',esfera:'sphere',cubo:'cube','línea':'line',cilindro:'cylinder'};
const estados={prone:'Derribado',restrained:'Apresado',frightened:'Asustado',blinded:'Cegado',deafened:'Ensordecido',poisoned:'Envenenado',stunned:'Aturdido',incapacitated:'Incapacitado',charmed:'Hechizado',unconscious:'Inconsciente',invisible:'Invisible'};
export function construirShinobi(s,D) {
  const g=s.g, rama=D.ramas.find(r=>r.id===s.rama);if(!rama)throw Error(`Rama inválida: ${s.id}`);
  const t=s.t??(s.tipo==='buff'?'AA':s.tipo==='ritual'?'1 h':'A'), [at,av]=tiempos[t];
  const dur=s.duracion??(s.tipo==='control'||s.tipo==='buff'||s.tipo==='summon'?60:0);
  const conc=s.conc??(['control','summon'].includes(s.tipo));
  const autoEstados=s.estados??[];
  const act={_id:idNativo(s.id+':actividad'),sort:0,name:s.nombre,activation:{override:false},duration:{override:false},range:{override:false},target:{override:false,prompt:true},
    effects:[],uses:{spent:0,recovery:[]},description:{chatFlavor:''},consumption:{targets:[],scaling:{allowed:g>0,max:''},spellSlot:false}};
  const presupuesto=presupuestoTecnica({grado:g,rama:s.rama,nat:s.nat,tiempo:t,areaTipo:s.area?'esfera':'ninguna',estados:autoEstados.length+(s.reducir??0),tirada:s.tipo==='attack'?'ataque':s.tipo==='damage'||s.tipo==='heal'?'ninguna':(s.salv??'SAB'),alcance:s.alcance===1.5?'toque':'18',persistente:false},D.presupuesto,0);
  const divisor = ['attack','save','damage','heal'].includes(s.tipo) ? Math.max(1,Number(s.blancos)||1) : 1;
  const dados=s.dados??[Math.max(1,Math.floor(presupuesto.n/divisor)),presupuesto.d];
  const p={number:dados[0],denomination:dados[1],bonus:'',types:[s.dano??'force'],custom:{enabled:false,formula:''},scaling:{mode:s.escalado===0?'':'whole',number:s.escalado??1,formula:''}};
  if(s.tipo==='attack')Object.assign(act,{type:'attack',attack:{ability:'',bonus:'',critical:{threshold:null},flat:false,type:{value:(s.alcance??1.5)<=3?'melee':'ranged',classification:s.arma||rama.usa==='fisica'?'weapon':'spell'}},damage:{critical:{bonus:''},includeBase:false,parts:[p]}});
  else if(s.tipo==='heal')Object.assign(act,{type:'heal',healing:{...p,types:['healing']}});
  else if(s.tipo==='save'||s.tipo==='control')Object.assign(act,{type:'save',save:{ability:[s.salv??'wis'],dc:{calculation:'spellcasting',formula:''}},damage:{onSave:s.mitad?'half':'none',parts:s.tipo==='save'?[p]:[]}});
  else if(s.tipo==='damage')Object.assign(act,{type:'damage',damage:{critical:{allow:false},parts:[p]}});
  else Object.assign(act,{type:'utility',roll:{formula:'',name:'',prompt:false,visible:false}});
  const efectos=[];
  if(autoEstados.length||s.cambios?.length||s.modo||s.tipo==='summon'){
    const eid=idNativo(s.id+':efecto'),self=['buff','summon'].includes(s.tipo)||!!s.self;
    const cambios=(s.cambios??[]).map(([key,mode,value])=>({key,mode,value:String(value)}));
    efectos.push({_id:eid,name:s.nombre,img:'systems/dnd5e/icons/svg/items/feature.svg',statuses:autoEstados,changes:cambios,
      duration:dur?{seconds:dur,rounds:Math.ceil(dur/6)}:{seconds:6,rounds:1},transfer:false,disabled:false,
      description:`<p>${esc(s.texto)}</p><p>${esc(s.fin??'Termina al vencer su duración o perder Concentración, cuando proceda.')}</p>`,
      flags:{'ecos-frontera':{verbe:{shinobi:true,aplicarUsuario:self,...(s.regenera?{regenera:s.regenera}:{}),modo:s.modo??null,grupoModo:s.grupoModo??s.modo??(s.tipo==='summon'?'manifestaciones':null),
        ...(s.tipo==='control'?{salvacionRepetida:s.salv??'wis'}:{}),...(s.tipo==='summon'?{manifestacion:{max:s.cantidad??1,perfil:s.perfil??'apoyo',sinRecursosPropios:true}}:{})}}}});
    if(!self)act.effects.push({_id:eid,onSave:false});
  }
  const alcance=s.alcance??(s.tipo==='buff'||s.tipo==='summon'?0:18);
  const activacion=t==='R'?'Reacción':t==='AA'?'Acción adicional':t==='A'?'Acción':t;
  const limites=s.limite??(s.tipo==='control'?'El objetivo repite la salvación al final de cada turno; el éxito termina el efecto. No impone conductas suicidas.':s.tipo==='summon'?'Una sola formación activa; dar órdenes cuesta tu acción adicional. La formación comparte una acción ofensiva y reacción en conjunto, nunca una por cada figura. Sus técnicas se pagan desde el original.':s.tipo==='buff'?'No se acumula con otra transformación de su mismo grupo. No concede turnos, descansos ni reservas adicionales.':'Afecta solo al objetivo o área indicados; no ignora cobertura total, inmunidades ni requisitos de la técnica.');
  const manual=s.manual??(['utility','ritual','summon'].includes(s.tipo)?'El DM resuelve desplazamientos, información, cuerpos o preparativos; la tarjeta no crea tokens ni cambia el escenario automáticamente.':'Ataque/salvación y dados nativos; confirma los estados en los objetivos. Repeticiones de salvación, empujes y condiciones del terreno se resuelven con el DM.');
  const texto=`${s.texto} Límites: ${limites}${s.fin?' Final: '+s.fin:''}`;
  const html=`<p><em>Grado ${g} · ${esc(rama.nombre)} · ${esc(s.origen)}${s.anime?' · exclusivo/ampliado en anime':''}</em></p><p>${esc(s.texto)}</p><p><b>Uso:</b> ${activacion} · ${alcance?alcance+' m':'sobre ti'} · ${dur?dur+' s':'instantánea'}${conc?' · Concentración':''} · ${D.costo[g]} Verbe.</p><p><b>Límites:</b> ${esc(limites)}</p>${s.fin?`<p><b>Final:</b> ${esc(s.fin)}</p>`:''}<p><b>En Foundry:</b> ${esc(manual)}</p><p><b>Referencia:</b> ${s.fuente?esc(s.fuente):`${esc(s.origen)} · estudio, p. ${s.pagina}. Adaptación de reglas de mesa; el grado no es el rango E–S.`}</p>`;
  if (['totsuka','yata'].includes(s.acceso?.artefacto)) s.acceso.modo='susanoo';
  const sec=s.rama==='forma'?(s.nat?(D.combos[s.nat]?'combo':s.nat):'pura'):s.rama;
  const req=s.previa?(D.tecnicas.find(t=>t.id===s.previa)?.n??s.previa):null;
  const meta={id:s.id,rama:s.rama,sec,g,nat:s.nat??null,rara:!!s.rara,req,incl:!!s.incl,grupo:null,sube:['attack','save','damage','heal'].includes(s.tipo)&&s.escalado!==0?`+${s.escalado??1}d${dados[1]}`:null,veces:1,usa:rama.usa,
    shinobi:true,acceso:s.acceso??{},...(s.rama==='mirada'&&s.id.endsWith('-abrir')?{abrirOjo:true}:{}),...(divisor>1?{divisorDados:divisor}:{}),...(s.desgasteOjo?{desgasteOjo:s.desgasteOjo}:{}),...(s.sacrificarOjo?{sacrificarOjo:s.sacrificarOjo}:{}),...(s.ritual||s.tipo==='ritual'?{ritual:true}:{}),...(s.familiaUso?{familiaUso:s.familiaUso}:{}),
    ...(s.dividirVerbe?{dividirVerbe:true,copias:s.cantidad??1}:{}),...(s.liberarReserva?{liberarReserva:true}:{}),...(s.prestamo?{prestamo:true}:{}),
    ...(s.costoPG?{costoPG:s.costoPG}:{}),...(s.curacionCasa?{curacionCasa:s.curacionCasa}:{}),...(s.soloDM?{soloDM:true}:{})};
  const item={name:s.nombre,type:'spell',img:`systems/dnd5e/icons/svg/schools/${({velo:'illusion',sello:'abjuration',pulso:'necromancy',pacto:'conjuration',umbral:'conjuration',rastro:'divination',mirada:'divination',cuerpo:'transmutation',sangre:'transmutation',vasija:'evocation'})[s.rama]??'evocation'}.svg`,effects:efectos,
    system:{description:{value:html,chat:''},level:g,school:rama.escuela,method:'verbe',prepared:2,activation:{type:at,value:av,condition:s.disparador??''},
      duration:{units:dur?(dur<60&&dur%6===0?'round':'minute'):'inst',value:dur?(dur<60&&dur%6===0?dur/6:dur/60):null},range:alcance?{units:'m',value:alcance}:{units:'self'},properties:[...(s.gestos===false?[]:['somatic']),...(conc?['concentration']:[])],
      materials:{value:s.material??'',consumed:false,cost:0,supply:0},target:{affects:{type:alcance?'creature':'self',count:s.area?'':String(s.blancos??1)},template:s.area?{type:formas[s.formaArea??'esfera'],size:s.area,units:'m'}:{}},
      uses:g>=6?{max:'1',spent:0,recovery:[{period:'lr',type:'recoverAll'}]}:{max:'',spent:0,recovery:[]},activities:{[act._id]:act},identifier:s.id,source:{custom:'El Verbe · Repertorio shinobi',book:'Estudio Naruto y Shippuden'}},flags:{'ecos-frontera':{verbe:meta}}};
  return {id:s.id,n:s.nombre,rama:s.rama,sec,g,t,alc:alcance?`${alcance} m`:'yo',dur:dur?`${conc?'C ':''}${dur} s`:'inst.',comp:s.gestos===false?'—':'G',nat:s.nat??null,area:s.area?`${s.formaArea??'esfera'} ${s.area} m`:null,
    tir:s.tipo==='attack'?'ataque':['save','control'].includes(s.tipo)?({str:'FUE',dex:'DES',con:'CON',int:'INT',wis:'SAB',cha:'CAR'})[s.salv??'wis']:null,
    dmg:['attack','save','damage','heal'].includes(s.tipo)?`${dados[0]}d${dados[1]}`:null,mitad:!!s.mitad,sube:meta.sube,veces:1,rara:!!s.rara,req,incl:!!s.incl,grupo:null,trazos:Math.max(1,g)+(s.rara?1:0),costo:D.costo[g],
    texto,uso:`${activacion} · ${alcance?alcance+' m':'yo'}`,item,alias:[s.origen,...(s.alias??[])],origen:{obra:s.anime?'anime':'manga/anime',nombre:s.origen,pagina:s.pagina},acceso:meta.acceso,previa:s.previa??null,soloDM:!!s.soloDM,automatizacion:manual};
}
