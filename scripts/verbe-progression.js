/** Progresión y límites compartidos. Reglas de mesa; no representan rangos canónicos E–S. */
export const VERSION_PROGRESION=1;
export const NIVEL_GRADO=[1,1,3,5,7,9,11,13,16,18,19,20];
export const maximoPorNivel=n=>NIVEL_GRADO.findLastIndex(v=>v<=Math.max(1,Number(n)||1));
export const etapaGrado=g=>g>=11?4:g>=10?3:g>=9?2:g>=6?1:0;
export const doteMaestria=rama=>`senda-${rama}-3`;
export const doteLeyenda=rama=>`senda-${rama}-4`;
export const limiteDadosExtra=g=>Math.min(6,Math.max(1,(Number(g)||0)+1));
export const gradoReplicas=dotes=>dotes.includes('formacion-disciplinada')?3:2;
export function limiteEscalado(meta,{nivel=1,rangoMax=0,profundo=false}={}){
  const base=Number(meta.g)||0;
  if(base===0||!/^\+\d+d\d+$/.test(meta.sube??''))return Math.min(base,maximoPorNivel(nivel));
  return Math.min(maximoPorNivel(nivel),Math.max(base,Math.min(rangoMax,base+3+Math.min(2,Number(profundo)||0))));
}
export function accesoObtencion(meta,{dotes=[],nivel=1}={}){
  const g=Number(meta.g)||0;
  if(nivel<NIVEL_GRADO[g])return {ok:false,motivo:`Grado ${g}: pide nivel ${NIVEL_GRADO[g]}.`};
  const requiere=[];
  if(g>=6)requiere.push(doteMaestria(meta.rama));
  if(g>=9)requiere.push(doteLeyenda(meta.rama));
  if(g>=10)requiere.push('ascension-mitica');
  if(g>=11)requiere.push('ascension-trascendente');
  const falta=requiere.find(id=>!dotes.includes(id));
  return falta?{ok:false,motivo:`Primero completa ${falta.startsWith('senda-')?`la senda de ${meta.rama}, etapa ${falta.endsWith('-4')?'4 (Leyenda)':'3 (Maestría)'}`:({'ascension-mitica':'la dote «Ascensión mítica» (la da el DM tras la prueba mítica)','ascension-trascendente':'la dote «Ascensión trascendente» (la da el DM tras la prueba trascendente)'})[falta]??falta.replaceAll('-',' ')}.`}:{ok:true};
}
export function cuotasPoder(nivel,dotes=[]){
  return {mayores:nivel>=11?(nivel>=16?4:nivel>=13?3:2)+Number(dotes.some(d=>/^senda-.+-4$/.test(d))):0,
    culminaciones:nivel>=18?(nivel>=20?3:2):0,trascendentes:nivel>=20?1:0};
}
export function permisoCuota(grado,{nivel=1,dotes=[],usados={}}={}){
  const limites=cuotasPoder(nivel,dotes),grupo=grado>=9?'culminaciones':grado>=6?'mayores':null;
  if(!grupo)return {ok:true,cambios:{}};
  if((Number(usados[grupo])||0)>=limites[grupo])return {ok:false,motivo:`Agotó sus ${limites[grupo]} usos compartidos de ${grupo} hasta el próximo Descanso Largo.`};
  if(grado===11&&(Number(usados.trascendentes)||0)>=limites.trascendentes)return {ok:false,motivo:'Ya gastó su culminación trascendente de este Descanso Largo.'};
  return {ok:true,cambios:{[grupo]:(Number(usados[grupo])||0)+1,...(grado===11?{trascendentes:(Number(usados.trascendentes)||0)+1}:{})}};
}
export function pisoCosto(grado,costos){return grado>0?Math.max(1,Math.ceil((Number(costos[grado])||0)*(grado>=6?.7:.5))):0;}
/** Acciones Verbe por turno (3.27): una; desde el nivel 11, dos (la excepción de nivel). Aparte de las acciones de D&D. */
export const accionesVerbePorTurno=(nivel,extra=0)=>1+(Number(nivel)>=11?1:0)+Math.max(0,Number(extra)||0);
/**
 * El turno del Verbe (3.27): una acción Verbe (dos desde el nivel 11) y una acción adicional Verbe, aparte de las de
 * D&D. `adicional` dice si la técnica es de Acción adicional. Una sola técnica de grado 6 o más por turno.
 */
export function permisoTurno(grado,{combate=null,estado={},reaccion=false,replica=false,maximo=2,adicional=false,maximoAdicional=1}={}){
  if(!combate||reaccion||replica)return {ok:true,cambios:null};
  const e=estado.combate===combate?estado:{},acciones=Number(e.acciones)||0,adicionales=Number(e.adicionales)||0,mayores=Number(e.mayores)||0;
  if(adicional&&adicionales>=maximoAdicional)return {ok:false,motivo:'Ya gastaste tu acción adicional Verbe de este turno (tu Acción adicional de D&D sigue libre).'};
  if(!adicional&&acciones>=maximo)return {ok:false,motivo:maximo===1?'Ya gastaste tu acción Verbe de este turno (tu Acción de D&D sigue libre).':`Ya gastaste tus ${maximo} acciones Verbe de este turno (tu Acción de D&D sigue libre).`};
  if(grado>=6&&mayores>=1)return {ok:false,motivo:'Solo una técnica de grado 6 o más por turno. Las reacciones conservan su propio límite.'};
  return {ok:true,cambios:{combate,acciones:acciones+Number(!adicional),adicionales:adicionales+Number(adicional),mayores:mayores+Number(grado>=6)}};
}
export const ORDEN_FUERZA={ninguna:0,rastro:1,debil:2,media:3,plena:4};
const NOMBRE_FUERZA={rastro:'Rastro',debil:'Débil',media:'Media',plena:'Plena'};
export function requisitoDote(req={},ctx={}){
  const e=ctx.estado??{},dotes=e.dotes??[];
  if(ctx.nivel<(req.nivel??1))return {ok:false,motivo:`Pide nivel ${req.nivel}.`};
  for(const [rama,min]of Object.entries(req.ramas??{}))if((Number(e.rangos?.[rama])||0)<min)return {ok:false,motivo:`Pide ${rama}, rango ${min}.`};
  for(const id of req.dotes??[])if(!dotes.includes(id))return {ok:false,motivo:`Pide la dote ${ctx.nombreDote?.(id)??id}.`};
  if(req.algunaDote?.length&&!req.algunaDote.some(id=>dotes.includes(id)))return {ok:false,motivo:'Pide completar una de las sendas indicadas.'};
  for(const id of req.tecnicas??[])if(!ctx.conocidas?.includes(id))return {ok:false,motivo:`Primero aprende ${ctx.nombreTecnica?.(id)??id}.`};
  if(req.hito&&!e.hitosShinobi?.includes(req.hito))return {ok:false,motivo:`Pide el hito ${req.hito.replaceAll('-',' ')} concedido por el DM.`};
  if(req.ojo&&!Object.values(e.miradas??{}).some(n=>Number(n)>=req.ojo))return {ok:false,motivo:`Pide una Mirada en etapa ${req.ojo}.`};
  if(req.naturaleza&&!ctx.naturalezas?.includes(req.naturaleza))return {ok:false,motivo:`Pide naturaleza ${req.naturaleza}.`};
  if(req.minNaturalezas&&(ctx.naturalezas?.length??0)<req.minNaturalezas)return {ok:false,motivo:'Pide dominar dos naturalezas.'};
  if(req.herencia&&!ctx.herencia)return {ok:false,motivo:'Pide una herencia.'};
  if(req.fuerzas&&!req.fuerzas.includes(e.fuerza))return {ok:false,motivo:'Pide sangre plena o media.'};
  // 3.31: legados de las sangres. El linaje (o uno de los que el legado reúne) y la fuerza mínima, sin decir de qué dios.
  if(req.linajes&&!req.linajes.includes(e.linaje))return {ok:false,motivo:'Pide la sangre de este legado.'};
  if(req.fuerzaMin&&(ORDEN_FUERZA[e.fuerza]??0)<(ORDEN_FUERZA[req.fuerzaMin]??0))return {ok:false,motivo:`Pide sangre ${NOMBRE_FUERZA[req.fuerzaMin]??req.fuerzaMin} o más.`};
  if(req.trasplante&&!e.trasplantes?.length)return {ok:false,motivo:'Pide una Mirada trasplantada.'};
  if(req.cerrojo&&(Number(e.cerrojos)||0)<req.cerrojo)return {ok:false,motivo:'Primero aprende un Cerrojo.'};
  if(req.propia&&!Object.values(e.cultivos??{}).some(c=>c.nivel>=3))return {ok:false,motivo:'Pide una técnica Propia.'};
  if(req.afinidad&&!Object.values(e.afinidad??{}).some(n=>Number(n)>=req.afinidad))return {ok:false,motivo:'Pide afinidad Entrenada.'};
  return {ok:true,pideDM:!!req.dm};
}
export function validarConcentraciones({existentes=[],terminar=[],grado,nivel,doble=false}={}){
  const quedan=existentes.filter(x=>!terminar.includes(x.id));
  if(!quedan.length)return {ok:true};
  if(!doble||quedan.length>=2)return {ok:false,motivo:'Elige qué Concentración anterior termina antes de usar otra.'};
  const menor=Math.min(Number(grado),...quedan.map(x=>Number(x.grado)||0)),cap=nivel>=17?5:3;
  return menor<=cap?{ok:true}:{ok:false,motivo:`Dos hilos solo admite una segunda Concentración de grado ${cap} o menos.`};
}
