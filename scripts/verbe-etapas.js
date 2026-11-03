/**
 * Etapas del aprendizaje del Verbe y descubrimiento de la naturaleza (tarea 2.1, decisiones D1 y 7 del autor).
 * Reglas puras: no dependen de Foundry.
 *
 * - Nadie usa el Verbe al empezar. Cuando un personaje encuentra por rol a un maestro (o a un aprendiz) que le enseña,
 *   el DM pulsa «Abrir la siguiente etapa» y se le abren más ramas y grados.
 * - La naturaleza (la primera y la segunda) está oculta hasta descubrirla entrenando: desde nivel 5 (como un chunin),
 *   o nivel 3 con rango Entrenado en Forma (un genin muy entrenado). Cuesta Trazos, días y una prueba de Control del Verbe.
 * - «Cambiar naturaleza del Verbe» es una técnica aparte: 3 Trazos para aprenderla; usarla pide 7 días y Control CD 15.
 */
export const ETAPAS = [
  { n: 0, nombre: "Dormido", ramas: 0, grado: -1, texto: "Su Verbe no despertó. Lo abre el DM cuando la historia lo pida." },
  { n: 1, nombre: "Aprendiz", ramas: 1, grado: 1, texto: "Alguien le enseñó a sentir el Verbe. Entrena una sola rama y técnicas de grado 0 y 1." },
  { n: 2, nombre: "Practicante", ramas: 2, grado: 3, texto: "Practica con guía. Hasta dos ramas y grado 3. Ya puede entrenar para descubrir su naturaleza (si su nivel lo permite)." },
  { n: 3, nombre: "Iniciado", ramas: 4, grado: 6, texto: "Domina lo básico. Hasta cuatro ramas y grado 6." },
  { n: 4, nombre: "Pleno", ramas: Infinity, grado: Infinity, texto: "Sin límite de etapa: solo cuentan su nivel, sus rangos y sus dotes." }
];
export const ETAPA_MAX = ETAPAS.length - 1;
/** Las fichas de antes de 3.6 no tenían etapas: siguen sin límite. */
export const etapaDe = e => (Number.isInteger(e?.etapa) ? Math.max(0, Math.min(ETAPA_MAX, e.etapa)) : ETAPA_MAX);
export const datosEtapa = n => ETAPAS[Math.max(0, Math.min(ETAPA_MAX, Number(n) || 0))];

/** Ramas en las que ya empezó a aprender: las entrenadas y las de sus técnicas. */
export function ramasEmpezadas(e, ramasDeTecnicas = []) {
  return new Set([...(e?.ordenRamas ?? []), ...ramasDeTecnicas].filter(Boolean));
}
/** ¿Su etapa le deja aprender una técnica de esta rama y este grado? */
export function permisoEtapa(e, { rama, grado, ramasDeTecnicas = [] } = {}) {
  const et = datosEtapa(etapaDe(e));
  if (et.n === 0) return { ok: false, motivo: "Su Verbe todavía no despertó." };
  if (Number(grado) > et.grado) return { ok: false, motivo: `Su etapa del Verbe (${et.nombre}) llega hasta grado ${et.grado}. Para más, busca quien te enseñe: el DM abre la siguiente etapa.` };
  const ya = ramasEmpezadas(e, ramasDeTecnicas);
  if (rama && !ya.has(rama) && ya.size >= et.ramas) return { ok: false, motivo: `Su etapa del Verbe (${et.nombre}) permite ${et.ramas} rama${et.ramas === 1 ? "" : "s"}. Para otra, busca quien te enseñe: el DM abre la siguiente etapa.` };
  return { ok: true };
}

/* ---------- Naturaleza ---------- */
export const DESCUBRIR = {
  primera: { trazos: 2, dias: 3, cd: 12, nombre: "tu naturaleza" },
  segunda: { trazos: 3, dias: 5, cd: 14, nombre: "tu segunda naturaleza" },
  cambio: { trazos: 0, dias: 7, cd: 15, nombre: "un cambio de naturaleza" }
};
/** Cómo se descubre la primera naturaleza: «secreta» (la fijó el DM), «elige» (la elige el jugador al descubrirla) o «visible» (la sabe desde el principio). */
export const MODOS_NATURALEZA = { secreta: "Secreta: la fijas tú y la descubre entrenando", elige: "La elige el jugador cuando la descubra entrenando", visible: "La sabe desde el principio" };
/** Las fichas de antes de 3.6 no tienen modo: siguen como estaban (la naturaleza se elige o ya se sabe). */
export const modoNaturaleza = e => e?.natModo ?? "visible";

/** Qué le toca descubrir ahora: «primera», «segunda» o null. */
export function siguienteDescubrimiento(e, { conocidas = 0 } = {}) {
  if (conocidas === 0) return "primera";
  if (conocidas === 1 && !e?.descubierta) return "segunda";
  return null;
}
/** ¿Puede empezar a entrenar para descubrirla? */
export function requisitoDescubrir(e, { tipo, nivel, rangoForma = 0 } = {}) {
  if (!tipo) return { ok: false, motivo: "Ya conoce sus naturalezas." };
  if (etapaDe(e) < 2) return { ok: false, motivo: "Pide la etapa Practicante: primero necesita quien le enseñe." };
  if (tipo === "primera" && !(nivel >= 5 || (nivel >= 3 && rangoForma >= 1))) return { ok: false, motivo: "Se descubre desde nivel 5, o desde nivel 3 con rango Entrenado en Forma." };
  if (tipo === "segunda" && nivel < 5) return { ok: false, motivo: "La segunda naturaleza se descubre desde nivel 5." };
  if (e?.entrenoNat) return { ok: false, motivo: "Ya está entrenando." };
  return { ok: true, ...DESCUBRIR[tipo] };
}
/** Días que le faltan al entrenamiento (con el reloj del mundo). */
export function diasRestantes(entreno, ahora) {
  if (!entreno) return null;
  return Math.max(0, Math.ceil((Number(entreno.hasta) - Number(ahora)) / 86400));
}
