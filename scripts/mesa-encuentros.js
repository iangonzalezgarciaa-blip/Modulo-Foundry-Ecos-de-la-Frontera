/** Lectura de capacidades importadas y estimación transparente de presión, no certificación de VD. */
import {normalizar,textoPlano,perfilNpc} from './mesa-core.js';
const lista=x=>Array.from(x?.contents??x??[]);
export const PLANTILLAS_NPC={
 civil:{nombre:'Habitante y oficio',rol:'civil',motivo:'Conservar su sustento y proteger a una persona cercana.',uso:'Conoce un oficio y una necesidad local. Negociar puede resolver la escena.'},
 guardia:{nombre:'Guardián del camino',rol:'guardian',motivo:'Mantener seguro un paso y cumplir una responsabilidad.',uso:'Defiende un lugar concreto; puede aceptar una retirada o un relevo.'},
 rastreador:{nombre:'Explorador y guía',rol:'hostigador',motivo:'Encontrar una ruta o recuperar a alguien perdido.',uso:'Conoce señales del terreno. El DM elige las competencias y sentidos adecuados.'},
 erudito:{nombre:'Investigador del Verbe',rol:'místico',motivo:'Comprender un fenómeno sin destruir sus pruebas.',uso:'Dispone de una pregunta y un límite ético. Sus técnicas se asignan desde el panel del Verbe.'},
 cuidador:{nombre:'Cuidador de comunidad',rol:'apoyo',motivo:'Mantener con vida a su comunidad con recursos limitados.',uso:'Cuenta con útiles y contactos; sus curaciones requieren acciones y recursos reales.'},
 capitan:{nombre:'Jefe de una formación',rol:'guardian',motivo:'Cumplir una misión preservando a su gente.',uso:'Coordina aliados mediante órdenes narrativas; la plantilla no regala acciones ni bonificaciones.'},
 vinculado:{nombre:'Huésped de una entidad',rol:'hostigador',motivo:'Negociar un objetivo propio con la voluntad de su vínculo.',uso:'El DM concede entidad, nivel de vínculo y técnicas por separado. La plantilla no los desbloquea.'},
 // 4.6b · Arcegris, la frontera y el borde del bosque profundo
 mercader:{nombre:'Mercader de la ruta',rol:'civil',motivo:'Cerrar el trato antes de que cierren el paso.',uso:'Tiene mercancía, deudas y rumores del camino. Pagar o regatear abre información.'},
 contrabandista:{nombre:'Contrabandista del río',rol:'hostigador',motivo:'Pasar la carga sin que la vea la guardia.',uso:'Huye antes que pelear; conoce pasos de agua y quién se deja sobornar.'},
 recaudador:{nombre:'Recaudador imperial',rol:'apoyo',motivo:'Cobrar lo que el Imperio exige sin perder su escolta.',uso:'Lleva papeles, sellos y escolta. Su autoridad pesa más que su espada.'},
 cazador:{nombre:'Cazador de recompensas',rol:'tirador',motivo:'Cobrar una presa viva antes que otro.',uso:'Sigue un cartel concreto; puede aliarse si le conviene. Ataca a distancia y pone trampas.'},
 sacerdote:{nombre:'Voz de una capilla',rol:'apoyo',motivo:'Guardar a su feligresía y los secretos de su culto.',uso:'Cura y consuela con recursos reales; sus milagros no se dan por la plantilla.'},
 desertor:{nombre:'Desertor armado',rol:'guardian',motivo:'Que nadie lo devuelva a su compañía.',uso:'Pelea bien y desconfía de todos; una oferta de amparo lo cambia todo.'},
 bandido:{nombre:'Salteador de la frontera',rol:'hostigador',motivo:'Llevarse lo que pueda y salir vivo.',uso:'Ataca en grupo y desde la emboscada; huye si cae su jefe.'},
 portador:{nombre:'Portador que se esconde',rol:'místico',motivo:'Que nadie descubra lo que lleva en la sangre.',uso:'Su Verbe es más fuerte de lo que aparenta. El DM decide su sangre y su etapa por separado.'},
 resonante:{nombre:'Resonante del bosque',rol:'místico',motivo:'Responder a una llamada que nadie más oye.',uso:'Habla a medias con algo del bosque profundo. Su conducta es extraña, no siempre hostil.'},
 vigia:{nombre:'Vigía de la Barrera',rol:'tirador',motivo:'Avisar a tiempo de lo que cruza.',uso:'Ve lejos y avisa antes que pelea; conoce las señales y los turnos de guardia.'}
};
export function mediaFormula(formula,datos={}){
 let f=String(formula??'').replace(/@([\w.]+)/g,(_m,k)=>{let n=k.split('.').reduce((o,p)=>o?.[p],datos);return n!==null&&n!==undefined&&typeof n!=='boolean'&&String(n).trim()!==''&&Number.isFinite(Number(n))?String(Number(n)):'?';}).replace(/\s/g,'');
 if(!f||f.includes('?')||!/^[\ddD+\-.]+$/.test(f))return null;
 let total=0;const partes=f.match(/[+-]?[^+-]+/g)??[];
 for(const p of partes){const m=p.match(/^([+-]?)(\d*)[dD](\d+)$/);if(m){const n=Number(m[2]||1),d=Number(m[3]);if(n>100||d<2||d>100)return null;total+=(m[1]==='-'?-1:1)*n*(d+1)/2;}else if(Number.isFinite(Number(p)))total+=Number(p);else return null;}
 return total;
}
function mediaParte(p,datos){
 if(p.custom?.enabled)return mediaFormula(p.custom.formula,datos);
 if(!Number.isFinite(Number(p.number))||!Number.isFinite(Number(p.denomination)))return null;
 const bono=p.bonus?mediaFormula(p.bonus,datos):0;return bono===null?null:Number(p.number)*(Number(p.denomination)+1)/2+bono;
}
export function auditarNpc(a){
 const alertas=[],acciones=[],traits=a.system?.traits??{},datos=a.getRollData?.()??{};
 for(const item of lista(a.items)){
  const texto=normalizar(item.name+' '+textoPlano(item.system?.description?.value??''));
  if(/multiattack|multiataque|ataques multiples/.test(texto))alertas.push({tipo:'multiataque',nombre:item.name,texto:'Comprueba cuántas acciones enlaza. La rutina de Ecos es una alternativa, nunca una suma.'});
  const actividades=lista(item.system?.activities&&!(Symbol.iterator in Object(item.system.activities))?Object.values(item.system.activities):item.system?.activities);
  for(const act of actividades){
   const partes=lista(act.damage?.parts),medias=partes.map(p=>mediaParte(p,datos)),tipo=act.type??act.constructor?.metadata?.type;
   const media=!act.damage?.includeBase&&medias.length&&medias.every(m=>m!==null)?medias.reduce((s,m)=>s+m,0):null;
   const area=!!act.target?.template?.type||!!item.system?.target?.template?.type;
   const control=lista(act.effects).length>0||/restrained|stunned|paralyzed|incapacitated|apresad|aturdid|paralizad|incapacitad|domina/.test(texto);
   const activacion=act.activation?.type??item.system?.activation?.type??'action';
   acciones.push({item:item.name,nombre:act.name??item.name,tipo,media,area,control,activacion,limitada:!!act.uses?.max||!!item.system?.uses?.max,
    cd:Number(act.save?.dc?.value??act.save?.dc?.formula)||null,alcance:act.range?.value??item.system?.range?.value??null,ecos:!!item.getFlag?.('ecos-frontera','rutinaNpc')});
   if(partes.length&&media===null)alertas.push({tipo:'formula',nombre:act.name??item.name,texto:'Fórmula dinámica no calculada: comprueba sus datos y bonificadores en la ficha.'});
   if(act.damage?.includeBase)alertas.push({tipo:'arma-base',nombre:act.name??item.name,texto:'Incluye daño base de arma y posibles modificadores u opciones nativas. Revisa el total de la actividad e introdúcelo en la rutina del encuentro.'});
   if(act.uses?.max||item.system?.uses?.max)alertas.push({tipo:'usos',nombre:act.name??item.name,texto:'Tiene usos limitados o recarga. Su media no implica que pueda repetirse cada ronda.'});
   if(area)alertas.push({tipo:'area',nombre:act.name??item.name,texto:'El daño por blanco no representa la potencia del área. Revisa cuántos personajes puede alcanzar.'});
   if(tipo==='save')alertas.push({tipo:'salvacion',nombre:act.name??item.name,texto:'Revisa la dificultad, el éxito y el daño con salvación. En Encuentros puedes introducir daño esperado ya ajustado en lugar de tratarlo como ataque.'});
   if(tipo==='utility')alertas.push({tipo:'utilidad',nombre:act.name??item.name,texto:'Esta utilidad no se cuantifica como daño. Revisa su texto, coste y efecto sobre movilidad, acciones o decisiones de la escena.'});
   if(control)alertas.push({tipo:'control',nombre:act.name??item.name,texto:'Revisa salvación, repetición, duración, Concentración e inmunidades de este control.'});
   if(['legendary','lair','special'].includes(activacion))alertas.push({tipo:'acciones-extra',nombre:act.name??item.name,texto:'Hay acciones fuera de la acción ordinaria; cuentan para la presión del encuentro.'});
  }
  if(item.type==='spell'&&!item.getFlag?.('ecos-frontera','verbe'))alertas.push({tipo:'magia',nombre:item.name,texto:'Revisa espacios, usos, preparación y combinación con las demás acciones.'});
 }
 for(const [id,nombre]of [['dr','Resistencias'],['di','Inmunidades al daño'],['ci','Inmunidades a estados']])if(lista(traits[id]?.value).length)alertas.push({tipo:id,nombre,texto:lista(traits[id].value).join(', ')});
 const r=a.getFlag?.('ecos-frontera','npcPerfil'),rutina=r?.danoMedio??0,individual=Math.max(0,...acciones.map(x=>x.media??0));
 if(rutina&&individual>rutina)alertas.push({tipo:'potencia-importada',nombre:'Actividad superior a la rutina propuesta',texto:'Al menos una actividad importada supera el daño de la rutina de Ecos. El encuentro toma el mayor valor legible hasta que ajustes su rutina real.'});
 if(a.getFlag?.('ecos-frontera','verbe')?.despierto)alertas.push({tipo:'verbe',nombre:'Verbe despierto',texto:'Revisa técnicas conocidas, reserva, defensas, choques y poderes altos. No se reduce todo su poder a daño.'});
 return {acciones,alertas,maximoIndividual:individual,rutina:rutina||null,danoRonda:Math.max(rutina,individual)||null,incertidumbre:alertas.length>0||!acciones.length||acciones.some(x=>['attack','save','damage'].includes(x.tipo)&&x.media===null),
  resumen:rutina?'Rutina de Ecos conocida; las capacidades importadas siguen disponibles como alternativas.':'La lectura muestra actividades individuales; no deduce automáticamente todas las combinaciones de turno.'};
}
export function estimarEncuentro(grupo,enemigos){
 const pj=grupo.filter(a=>a?.type==='character'),n=pj.length;
 if(!n)return {valido:false,motivo:'Añade al menos un personaje del grupo.'};
 const niveles=pj.map(a=>Math.max(1,Number(a.system?.details?.level)||1)),nivel=niveles.reduce((s,x)=>s+x,0)/n;
 const vidaGrupo=pj.reduce((s,a)=>s+Math.max(1,Number(a.system?.attributes?.hp?.max)||1),0),caGrupo=pj.reduce((s,a)=>s+(Number(a.system?.attributes?.ac?.value)||10),0)/n;
 let vidaEnemigos=0,presion=0,unidades=0,revision=0;const detalles=[];
 for(const e of enemigos){
  const a=e.actor;if(!a||a.type!=='npc')continue;
  const vd=Number(a.system?.details?.cr)||0,normal=vd>=1?Math.min(20,Math.ceil(vd)):[0,.125,.25,.5].find(n=>n>=vd)??1;
  const cantidad=Math.max(1,Math.min(30,Math.floor(Number(e.cantidad)||1))),p=a.getFlag?.('ecos-frontera','npcPerfil')??perfilNpc({vd:normal}),audit=auditarNpc(a);
  const pg=Math.max(1,Number(a.system?.attributes?.hp?.max)||p.pg),dano=e.danoRonda!==''&&e.danoRonda!==undefined&&Number.isFinite(Number(e.danoRonda))?Math.max(0,Number(e.danoRonda)):audit.danoRonda??p.danoMedio;
  const modo=e.modo??'ataque';if(modo==='ajustado'&&(e.danoRonda===''||e.danoRonda===undefined||!Number.isFinite(Number(e.danoRonda))))return {valido:false,motivo:'Indica el daño esperado por blanco para una rutina ya ajustada.'};
  const ataque=Number(e.ataque??p.ataque),impacto=modo==='ajustado'?1:Math.max(.05,Math.min(.95,(21+ataque-caGrupo)/20)),area=Math.max(1,Math.min(n,Number(e.blancos)||1));
  const valor=cantidad*dano*impacto*area;presion+=valor;vidaEnemigos+=pg*cantidad;unidades+=cantidad;if(audit.incertidumbre)revision++;
  detalles.push({nombre:a.name,cantidad,dano,impacto,modo,blancos:area,presion:valor,revisar:audit.incertidumbre});
 }
 const fraccion=presion/vidaGrupo,etiqueta=!unidades?'Sin enemigos':fraccion<.12?'Presión baja':fraccion<.25?'Presión moderada':fraccion<.4?'Presión alta':'Presión extrema';
 return {valido:true,personajes:n,nivelMedio:nivel,vidaGrupo,caGrupo,vidaEnemigos,unidades,presion,fraccion,etiqueta,revision,detalles,
  aviso:'Estimación de Nimerios basada en daño esperado por ronda sobre los PG máximos del grupo. No es el cálculo oficial de dificultad ni predice una victoria. El modo Ataque usa la CA media; para salvaciones u otros casos introduce daño esperado en modo Ajustado. No incluye automáticamente curación, críticos, cobertura, resistencias, control, choques, Verbe o recursos diarios. Ajusta las rutinas y los blancos de área tras revisar las fichas.'};
}
