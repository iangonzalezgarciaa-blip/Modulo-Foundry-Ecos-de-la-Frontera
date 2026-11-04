/**
 * La capa del sistema para PF2e (tarea 5.2d, en preparación). Por ahora solo las lecturas puras, con las decisiones del
 * autor (docs/PF2E_ADAPTADOR.md): Agotamiento de la casa = Fatigado + Drenado, Monedas Antiguas = Puntos de Héroe y los
 * cuatro grados de éxito de PF2e. Lo que todavía no está hecho avisa en vez de fallar en silencio.
 */
export const id = "pf2e";
const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);
const falta = nombre => () => { throw new Error(`Ecos · PF2e: «${nombre}» todavía no está hecho (tarea 5.2d).`); };

export function pg(actor) {
  const hp = actor?.system?.attributes?.hp ?? {};
  return { valor: num(hp.value), max: num(hp.max), temp: num(hp.temp) };
}
export const nivel = actor => num(actor?.system?.details?.level?.value ?? actor?.level, 1) || 1;
export const ca = actor => num(actor?.system?.attributes?.ac?.value);
export function velocidad(actor) {
  return { pie: num(actor?.system?.attributes?.speed?.value), pies: true };
}
export function resistencias(actor) {
  const a = actor?.system?.attributes ?? {};
  const de = l => new Set((l ?? []).map(x => x?.type).filter(Boolean));
  return { resiste: de(a.resistances), vulnerable: de(a.weaknesses), inmune: de(a.immunities) };
}

/** Las salvaciones de dnd5e a las tres de PF2e: CON = Fortaleza, DES = Reflejos, SAB = Voluntad; las demás, el modificador. */
const SALV = { con: "fortitude", dex: "reflex", wis: "will" };
export function bonoSalvacion(actor, clave) {
  const s = SALV[clave] ? actor?.system?.saves?.[SALV[clave]] : null;
  return s ? num(s.totalModifier ?? s.value) : num(actor?.system?.abilities?.[clave]?.mod);
}
/** CD de una característica en PF2e: 10 + modificador + competencia del nivel (entrenado: nivel + 2). */
export const cdCaracteristica = (actor, clave) => 10 + num(actor?.system?.abilities?.[clave]?.mod) + nivel(actor) + 2;
export const caido = actor => pg(actor).valor <= 0;

/* Monedas Antiguas = Puntos de Héroe (Propuesta F: las de más de 3 se guardan como objeto; eso llega con 5.2d). */
export const moneda = actor => num(actor?.system?.resources?.heroPoints?.value);
export const datosMoneda = n => ({ "system.resources.heroPoints.value": Math.max(0, Math.min(3, Math.trunc(num(n)))) });
/** Agotamiento de la casa: Fatigado cuenta 1 y cada punto de Drenado, 1 más (Drenado 4 + Fatigado = 5). */
export function agotamiento(actor) {
  const items = Array.from(actor?.items ?? []);
  const valor = slug => { const c = items.find(i => i?.type === "condition" && i?.system?.slug === slug); return c ? num(c.system?.value?.value, 1) : 0; };
  const fatigado = items.some(i => i?.type === "condition" && i?.system?.slug === "fatigued") ? 1 : 0;
  return fatigado ? fatigado + valor("drained") : 0;
}
export const datosAgotamiento = falta("datosAgotamiento");

/** Los cuatro grados de PF2e: ±10 de la CD y el 20 o el 1 natural suben o bajan un grado. */
export function gradoDeExito(total, cd, natural = null) {
  const g = ["falloCritico", "fallo", "exito", "critico"];
  let i = num(total) >= num(cd) + 10 ? 3 : num(total) >= num(cd) ? 2 : num(total) <= num(cd) - 10 ? 0 : 1;
  if (natural === 20) i = Math.min(3, i + 1);
  if (natural === 1) i = Math.max(0, i - 1);
  return g[i];
}
export const leerTirada = falta("leerTirada");
export const tirarHabilidad = falta("tirarHabilidad");
export const tirarSalvacion = falta("tirarSalvacion");
export const aplicarEstado = falta("aplicarEstado");
export const tieneEstado = (actor, estado) => Array.from(actor?.items ?? []).some(i => i?.type === "condition" && i?.system?.slug === estado);
