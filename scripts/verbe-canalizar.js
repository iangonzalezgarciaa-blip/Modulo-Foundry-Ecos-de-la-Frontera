/**
 * Técnicas cargadas y el estado «Canalizando» (tareas 3.3 y 3.4, decisión D10). Reglas puras.
 *
 * Una técnica cargada se prepara antes de soltarla: mientras tanto quien la usa está «Canalizando»
 * (velocidad 0, sin reacciones ni choques). Paga su Verbe al empezar. Al comienzo de cada uno de sus turnos
 * suma 1 de carga. Desde la carga mínima puede liberarla (con su acción, sin volver a pagar): cada punto de carga
 * suma lo que diga la técnica (dados, +1 a la CD o al ataque). Se pierde la carga (y el Verbe pagado) si:
 *  - recibe daño y falla una salvación de Constitución (CD 10 o la mitad del daño, la mayor),
 *  - queda incapacitado, o
 *  - lo mueven a la fuerza (lo resuelve el DM con «Interrumpir»).
 * «Cargado» es otro estado (el del Rayo): no tiene nada que ver.
 */
export const CANALIZAR_BASE = { min: 2, max: 3, porCarga: { dados: 1 } };

/** Técnicas del catálogo que pasan a cargadas sin tocar sus datos (3.4b). Lo que cada carga suma. */
export const CARGADAS = {
  "cuerpo-chidori": { min: 1, max: 3, porCarga: { dados: 1, ataque: 1 } },
  "cuerpo-raikiri": { min: 2, max: 3, porCarga: { dados: 1, ataque: 1 } },
  "forma-esfera-viento": { min: 1, max: 3, porCarga: { dados: 1 } },
  "forma-estrella-viento": { min: 2, max: 4, porCarga: { dados: 2 } },
  "forma-esfera-colosal": { min: 2, max: 4, porCarga: { dados: 2 } },
  "quietud-esfera-sabia": { min: 1, max: 3, porCarga: { dados: 1 } },
  "quietud-esfera-sabia-mayor": { min: 2, max: 4, porCarga: { dados: 2 } },
  "quietud-esfera-sabia-colosal": { min: 2, max: 4, porCarga: { dados: 2 } },
  "quietud-estrella-sabia": { min: 2, max: 4, porCarga: { dados: 2, cd: 1 } },
  "quietud-estrella-colosal": { min: 3, max: 5, porCarga: { dados: 3, cd: 1 } },
  "quietud-tsuchigumo": { min: 3, max: 5, porCarga: { dados: 3, cd: 1 } },
  "hilo-esferas-orbitales": { min: 2, max: 3, porCarga: { dados: 1 } },
  "vasija-esfera-bestia": { min: 2, max: 4, porCarga: { dados: 2 } },
  "vasija-esfera-magnetica": { min: 2, max: 4, porCarga: { dados: 2 } },
  "vasija-estrella-lava": { min: 3, max: 5, porCarga: { dados: 3, cd: 1 } },
  "vasija-nueve-estrellas": { min: 3, max: 5, porCarga: { dados: 3, cd: 1 } }
};
/** Cómo se carga una técnica: la del catálogo (meta.cargada) o la lista de conversiones. null si no es cargada. */
export function cargaDe(meta) {
  const c = meta?.cargada ?? CARGADAS[meta?.id];
  if (!c) return null;
  const min = Math.max(1, Math.trunc(Number(c.min) || CANALIZAR_BASE.min));
  return { min, max: Math.max(min, Math.trunc(Number(c.max) || CANALIZAR_BASE.max)), porCarga: { ...CANALIZAR_BASE.porCarga, ...(c.porCarga ?? {}) } };
}
/** Lo que suma la carga al liberar. */
export function bonoCarga(c, carga) {
  const n = Math.max(0, Math.min(Number(carga) || 0, c?.max ?? 0));
  const p = c?.porCarga ?? {};
  return { dados: n * (Number(p.dados) || 0), cd: n * (Number(p.cd) || 0), ataque: n * (Number(p.ataque) || 0) };
}
export const cdInterrupcion = dano => Math.max(10, Math.floor((Number(dano) || 0) / 2));
export function textoCarga(c) {
  if (!c) return "";
  const p = c.porCarga, por = [p.dados ? `+${p.dados} dado${p.dados > 1 ? "s" : ""} de daño` : "", p.cd ? `+${p.cd} a la CD` : "", p.ataque ? `+${p.ataque} al ataque` : ""].filter(Boolean).join(", ");
  return `Técnica cargada: se prepara al menos ${c.min} turno${c.min > 1 ? "s" : ""} (hasta ${c.max}) mientras estás Canalizando: velocidad 0, sin reacciones ni choques. Pagas al empezar; cada turno de carga suma ${por}. Si recibes daño, salvación de Constitución (CD 10 o la mitad del daño, la mayor) o la pierdes; también si quedas incapacitado o te mueven a la fuerza.`;
}
