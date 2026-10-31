/** Requisitos explícitos del repertorio shinobi. No depende de Foundry. */
import {accesoDivino} from "./verbe-divinity.js";
export const VERSION_SHINOBI = 1;
export function accesoShinobi(meta, contexto, usar = false) {
  const a = meta.acceso ?? {}, e = contexto.estado ?? {};
  const etiqueta=id=>contexto.etiquetas?.[id]??String(id).replaceAll("-"," ");
  const divino=accesoDivino(meta,{...contexto,fuerza:e.fuerza});if(!divino.ok)return divino;
  if (a.tradicion && !(e.tradiciones ?? []).includes(a.tradicion)) return { ok:false, motivo:`Pide la tradición ${etiqueta(a.tradicion)}, concedida por el DM.` };
  if (a.herencia && contexto.herencia !== a.herencia) return { ok:false, motivo:`Pide la herencia ${a.herencia}.` };
  if (a.ojo && (Number(e.miradas?.[a.ojo.id]) || 0) < a.ojo.etapa) return { ok:false, motivo:`Pide ${etiqueta(a.ojo.id)}, etapa ${a.ojo.etapa}.` };
  if (a.hito && !(e.hitosShinobi ?? []).includes(a.hito)) return { ok:false, motivo:`Pide el hito de historia «${etiqueta(a.hito)}».` };
  if (a.vasija && !e.vasija?.bestia) return { ok:false, motivo:"Pide una bestia vinculada por el DM." };
  if (a.bestia && e.vasija?.bestia !== a.bestia) return { ok:false, motivo:`Pide vínculo con ${etiqueta(a.bestia)}.` };
  if (a.vinculo && (Number(e.vasija?.vinculo) || 0) < a.vinculo) return { ok:false, motivo:`Pide vínculo de bestia ${a.vinculo}.` };
  if (a.cerrojo && (Number(e.cerrojos) || 0) < a.cerrojo) return { ok:false, motivo:`Primero aprende el Cerrojo ${a.cerrojo}.` };
  if (!usar) return { ok:true };
  const ojo=a.ojo?.id;
  if (ojo && (Number(e.ojosSacrificados?.[ojo])||0)>=2) return {ok:false,motivo:"Ese par de ojos ya fue sacrificado. Solo un tratamiento o trasplante de historia autorizado por el DM lo restaura."};
  if (meta.desgasteOjo && (Number(e.miradas?.[meta.desgasteOjo])||0)<5 && (Number(e.desgasteOcular?.[meta.desgasteOjo])||0)>=(contexto.limiteDesgaste??6)) return {ok:false,motivo:"El ojo alcanzó su límite de desgaste. Requiere intervención del DM o su etapa eterna."};
  if (a.cerrojo && (contexto.cerrojoActivo || 0) < a.cerrojo) return { ok:false, motivo:`Activa el Cerrojo ${a.cerrojo} antes de esta técnica.` };
  if (a.ojo && !meta.abrirOjo && !contexto.ojosAbiertos?.includes(a.ojo.id)) return { ok:false, motivo:"Primero abre la Mirada que utiliza esta técnica." };
  if (a.modo && !contexto.modos?.includes(a.modo)) return { ok:false, motivo:`Primero activa el modo ${etiqueta(a.modo)}.` };
  for(const modo of a.modos??[])if(!contexto.modos?.includes(modo))return {ok:false,motivo:`Primero activa el modo ${etiqueta(modo)}.`};
  if (a.artefacto && !contexto.artefactos?.includes(a.artefacto)) return { ok:false, motivo:`Pide el artefacto equipado ${etiqueta(a.artefacto)}.` };
  if (meta.ritual && !e.permisosRituales?.[meta.id]) return { ok:false, motivo:"El DM debe verificar los preparativos y autorizar este ritual una vez." };
  if (meta.familiaUso && e.usosFamilia?.[meta.familiaUso]) return { ok:false, motivo:"Ya gastó este poder o una de sus variantes desde el último largo." };
  if (meta.liberarReserva && !(Number(e.reservaSellada) > 0)) return { ok:false, motivo:"No tiene Verbe almacenado en el sello." };
  if(meta.reservaMin&&Number(e.reservaSellada)<meta.reservaMin)return {ok:false,motivo:`Necesita ${meta.reservaMin} Verbe almacenados; esta regeneración los consume.`};
  if (meta.dividirVerbe && !(Number(e.valor) > 0)) return { ok:false, motivo:"Los clones físicos necesitan energía positiva para dividirla; no se crean con deuda." };
  return { ok:true };
}
export function dividirReserva(valor, costo, copias) {
  const n = Math.max(1, Math.floor(Number(copias) || 1));
  const resto = Math.max(0, Math.floor(Number(valor) || 0) - Math.max(0, Math.floor(Number(costo) || 0)));
  const porCuerpo = Math.floor(resto / (n + 1));
  return { original: resto - porCuerpo * n, copias:n, porCuerpo, comprometido:porCuerpo*n };
}
export function depositoReserva({ valor, almacenado = 0, cantidad, nivel,extra=0 }) {
  const n=Number(cantidad), cap=2*Math.max(1,Number(nivel)||1)+Math.max(0,Number(extra)||0);
  if (!Number.isSafeInteger(n) || n<1 || n>Number(valor) || Number(almacenado)+n>cap) return {ok:false,motivo:`Deposita energía positiva, hasta ${cap} almacenados. No admite deuda.`};
  return {ok:true,valor:Number(valor)-n,almacenado:Number(almacenado)+n};
}
