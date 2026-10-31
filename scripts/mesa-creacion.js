/** Comprobación de creación: decisiones nativas primero, concesiones de campaña explícitas. */
import {huellaTexto} from './verbe-reading.js';
const MOD='ecos-frontera',lista=x=>Array.from(x?.contents??x??[]);
function firmaActor(a){
 const items=lista(a.items).filter(i=>['class','subclass','race','species','background'].includes(i.type)).map(i=>[i.id,i.type,i.system?.identifier,i.system?.levels,lista(i.system?.advancement).map(v=>v.toObject?.()??{id:v.id,type:v.type,level:v.level,value:v.value})]).sort((x,y)=>String(x[0]).localeCompare(String(y[0])));
 const valores=Object.fromEntries(['str','dex','con','int','wis','cha'].map(k=>[k,a._source?.system?.abilities?.[k]?.value??a.system?.abilities?.[k]?.value]));
 const base=a._source?.system??a.system,habilidades=Object.fromEntries(Object.entries(base.skills??{}).filter(([k])=>k!=='cvb').sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>[k,v.value??0]));
 const herramientas=Object.fromEntries(Object.entries(base.tools??{}).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>[k,v.value??0]));
 return huellaTexto(JSON.stringify([a.name,a.system?.details?.level,base.details?.originalClass,valores,base.attributes?.hp?.max,a.getFlag?.(MOD,'pj'),habilidades,herramientas,base.traits?.languages,items],(_k,v)=>v instanceof Set?[...v].sort():v instanceof Map?Object.fromEntries(v):v));
}
export function auditarPersonaje(a){
 const filas=[],poner=(id,estado,titulo,detalle)=>filas.push({id,estado,titulo,detalle});
 if(!a||a.type!=='character')return {filas:[{id:'tipo',estado:'error',titulo:'Elige una ficha de personaje',detalle:'Este recorrido valida personajes jugadores.'}],errores:1,avisos:0,lista:false,firma:''};
 const items=lista(a.items),clases=items.filter(i=>i.type==='class'),nivel=Number(a.system?.details?.level)||0;
 poner('nombre',a.name?.trim()?'ok':'error','Identidad',a.name?.trim()?'Nombre registrado.':'Escribe un nombre.');
 const niveles=clases.reduce((n,i)=>n+(Number(i.system?.levels)||0),0);
 poner('clase',clases.length&&niveles>=1&&niveles<=20&&niveles===nivel?'ok':'error','Clase y nivel',`Niveles de clase: ${niveles}. Nivel de ficha: ${nivel}. Deben coincidir entre 1 y 20.`);
 for(const [tipo,titulo]of [['race','Especie'],['background','Trasfondo']]){
  const n=items.filter(i=>i.type===tipo||(tipo==='race'&&i.type==='species')).length;
  poner(tipo,n===1?'ok':'error',titulo,n===1?'Una elección registrada.':n?'Hay varias elecciones: conserva la que corresponde sin duplicar sus avances.':'Falta importar o registrar la elección.');
 }
 const ids=new Set(),duplicadas=[];for(const i of clases){const id=i.system?.identifier||i.name;if(ids.has(id))duplicadas.push(i.name);ids.add(id);}
 poner('duplicadas',duplicadas.length?'error':'ok','Clases duplicadas',duplicadas.length?duplicadas.join(', '):'No hay clases repetidas. Las clases diferentes se tratan como multiclase.');
 const malas=Object.entries(a.system?.abilities??{}).filter(([k,v])=>['str','dex','con','int','wis','cha'].includes(k)&&(!Number.isInteger(Number(v.value))||v.value<1||v.value>30)).map(([k])=>k);
 const seis=['str','dex','con','int','wis','cha'].every(k=>a.system?.abilities?.[k]?.value!==undefined);
 poner('atributos',!seis||malas.length?'error':a.getFlag?.(MOD,'caracteristicasRevisadas')?'ok':'revisar','Características',!seis||malas.length?'Comprueba los seis valores base: enteros entre 1 y 30.':'Revisa el método de reparto y los aumentos de origen para evitar sumarlos dos veces.');
 const hp=a.system?.attributes?.hp??{};
 poner('vida',Number(hp.max)>0&&Number(hp.value)>=0&&Number(hp.value)<=Number(hp.max)?'ok':'error','Puntos de vida','Los PG máximos deben ser positivos y los actuales estar entre cero y el máximo. Comprueba el primer nivel y los aumentos de clase.');
 const habilidades=Object.entries(a.system?.skills??{}).filter(([,s])=>![0,.5,1,2].includes(Number(s.value??0)));
 poner('competencias',habilidades.length?'error':'revisar','Competencias y equipo','Comprueba elecciones de clase, origen, idiomas, herramientas y armaduras. Los campos inválidos se señalan; una coincidencia legítima debe resolverse en el importador.');
 poner('equipo',items.some(i=>['equipment','weapon','tool','consumable'].includes(i.type))?'ok':'revisar','Equipo inicial','Registra las compras o el equipo inicial acordados. El asistente no entrega equipo gratuito.');
 let pendientes=0,desconocidos=0;
 for(const i of items)for(const v of lista(i.system?.advancement)){
  const tope=['class','subclass'].includes(i.type)?Number(i.system?.levels??clases.find(c=>c.system?.identifier===i.system?.classIdentifier)?.system?.levels)||nivel:nivel;
  const nivelesAv=lista(v.levels??[v.level??1]).map(Number).filter(n=>n<=tope&&n>=0);
  for(const n of nivelesAv){
   if(typeof v.configuredForLevel==='function'){try{const estado=v.configuredForLevel(n);if(estado===false){pendientes++;poner(`avance-${i.id}-${v.id??v._id}-${n}`,'error',`${i.name} · avance de nivel ${n}`,v.title??v.type??'Completa este avance desde la ficha nativa.');}else if(estado!==true)desconocidos++;}catch{desconocidos++;}}
   else if(['ItemChoice','AbilityScoreImprovement','Trait','ScaleValue'].includes(v.type)&&!v.value?.chosen&&!Object.keys(v.value??{}).length)desconocidos++;
  }
 }
 poner('avances',pendientes?'error':desconocidos?'revisar':'ok','Avances nativos',pendientes?`${pendientes} elección(es) pendiente(s).`:desconocidos?`${desconocidos} avance(s) necesitan revisión en la ficha; su formato no permite confirmación automática.`:'Los avances que expone el sistema no indican elecciones pendientes.');
 const slots=Object.values(a.system?.spells??{}).filter(x=>x&&typeof x==='object'&&Number(x.max)>0),malos=slots.some(x=>Number(x.value)<0||Number(x.value)>Number(x.max)||Number(x.spent)<0||Number(x.spent)>Number(x.max));
 poner('recursos',malos?'error':slots.length?'revisar':'info','Magia y recursos',malos?'Hay espacios con valores fuera de su máximo.':slots.length?'Revisa preparación, conjuros conocidos y espacios en la ficha. No se reconstruyen automáticamente los conocimientos de cada clase.':'No se detectan espacios de conjuro activos. Comprueba los recursos propios de la clase.');
 poner('ecos',a.getFlag?.(MOD,'pj')?'ok':'revisar','Reglas de Ecos',a.getFlag?.(MOD,'pj')?'Activas para esta ficha.':'El DM debe decidir si esta ficha usa heridas, descansos y demás reglas de Ecos. Esto es independiente del Verbe.');
 poner('verbe',a.getFlag?.(MOD,'verbe')?.despierto?'ok':'info','Verbe',a.getFlag?.(MOD,'verbe')?.despierto?'Despierto. Revisa linaje, fuerza, ramas y reserva en su panel.':'No despierto. Es válido jugar sin Verbe; el DM concede el despertar cuando corresponda.');
 const firma=firmaActor(a),aprobacion=a.getFlag?.(MOD,'creacionAprobada');
 poner('aprobacion',aprobacion?.firma===firma?'ok':'revisar','Revisión del DM',aprobacion?.firma===firma?'La aprobación coincide con esta configuración.':'La ficha necesita revisión o cambió desde su última aprobación.');
 return {filas,errores:filas.filter(f=>f.estado==='error').length,avisos:filas.filter(f=>f.estado==='revisar').length,lista:!filas.some(f=>f.estado==='error'),firma};
}
export async function aprobarPersonaje(a,{activarEcos=false,revisado=false,nota=''}={}){
 if(!game.user.isGM||a?.type!=='character')return {ok:false,motivo:'Solo el DM revisa un personaje.'};
 const antes=auditarPersonaje(a);if(!antes.lista)return {ok:false,motivo:'Resuelve los errores de la revisión antes de aprobar.'};
 if(!revisado)return {ok:false,motivo:'Confirma que revisaste competencias, equipo, origen y avances con el jugador.'};
 const previo=a.getFlag(MOD,'pj');
 await a.setFlag(MOD,'pj',!!activarEcos);
 try{const firma=firmaActor(a);await a.update({[`flags.${MOD}.creacionRevisada`]:true,[`flags.${MOD}.creacionAprobada`]:{firma,fecha:Date.now(),por:game.user.id,nota:String(nota).slice(0,600),ecos:!!activarEcos}});}
 catch(e){if(previo===undefined)await a.unsetFlag(MOD,'pj');else await a.setFlag(MOD,'pj',previo);throw e;}
 return {ok:true};
}
