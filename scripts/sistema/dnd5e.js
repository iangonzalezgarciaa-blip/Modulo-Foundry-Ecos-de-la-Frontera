/**
 * La capa del sistema para dnd5e (tarea 5.2c, docs/PF2E_ADAPTADOR.md). El resto del módulo deja de leer `system.*` de
 * dnd5e directamente y pasa por aquí, archivo por archivo, sin cambiar el comportamiento. Las lecturas y los datos de
 * actualización son puros (se prueban con dobles); las tiradas y los estados llaman a la API de dnd5e.
 */
import { infoTirada } from "../compat.js";

export const id = "dnd5e";
const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);

/** Las rutas que vigilan los ganchos de actualización (updateActor) para saber qué cambió. */
export const RUTAS = { pg: "system.attributes.hp.value", nivel: "system.details.level", moneda: "system.currency.soul", caracteristicas: "system.abilities", agotamiento: "system.attributes.exhaustion" };

/* ---------- Ficha ---------- */
/** PG actuales, máximos, máximos con el máximo temporal y temporales; `hay` es falso si la ficha no tiene PG. */
export function pg(actor) {
  const hp = actor?.system?.attributes?.hp;
  const h = hp ?? {};
  return { valor: num(h.value), max: num(h.max), maxEfectivo: num(h.effectiveMax ?? h.max), temp: num(h.temp), hay: hp != null };
}
/** Datos de actualización de los PG (nunca negativos); `max` y `temp` solo si se dan. */
export const datosPg = (n, { max, temp } = {}) => ({ [RUTAS.pg]: Math.max(0, Math.trunc(num(n))),
  ...(max != null ? { "system.attributes.hp.max": Math.max(0, Math.trunc(num(max))) } : {}),
  ...(temp != null ? { "system.attributes.hp.temp": Math.max(0, Math.trunc(num(temp))) } : {}) });
/** Curar `n` PG, o hacer `n` de daño de un tipo de dnd5e, con la API de dnd5e. */
export const curar = (actor, n) => actor.applyDamage([{ value: num(n), type: "healing" }]);
export const danar = (actor, n, tipo) => actor.applyDamage([{ value: num(n), type: tipo }]);

/* ---------- Control del Verbe ---------- */
/** Rango en Control del Verbe (la habilidad `cvb` que Ecos añade): 0 sin competencia, 1 competente, 2 pericia. */
export const control = actor => num(actor?.system?.skills?.cvb?.value);
/** Datos de actualización del Control: `rango` (0 a 2) y `bono` (bono fijo a la prueba; 0 lo quita). Solo los que se dan. */
export const datosControl = ({ rango, bono } = {}) => ({
  ...(rango != null ? { "system.skills.cvb.value": Math.min(2, Math.max(0, Math.trunc(num(rango)))) } : {}),
  ...(bono != null ? { "system.skills.cvb.bonuses.check": num(bono) ? `+ ${num(bono)}` : "" } : {}) });
/** Nivel del PJ, o el VD redondeado hacia arriba (mínimo 1) si es un PNJ. */
export function nivel(actor) {
  return num(actor?.system?.details?.level) || Math.max(1, Math.ceil(num(actor?.system?.details?.cr, 1)));
}
/** El VD tal cual (0 si no tiene). */
export const vd = actor => num(actor?.system?.details?.cr);
/** Bonificador por competencia de la ficha (0 si no lo tiene; quien llama decide el respaldo). */
export const competencia = actor => num(actor?.system?.attributes?.prof);
export const mod = (actor, clave) => num(actor?.system?.abilities?.[clave]?.mod);
/** La característica de lanzamiento de conjuros de la ficha, o null. */
export const caracteristicaConjuros = actor => actor?.system?.attributes?.spellcasting || null;
export const ca = actor => num(actor?.system?.attributes?.ac?.value);
/** Datos de actualización para dejar la CA fija en `n`. */
export const datosCaFija = n => ({ "system.attributes.ac.calc": "flat", "system.attributes.ac.flat": num(n) });
/** Velocidad a pie en las unidades de la ficha y si son pies. dnd5e 6 la guarda en movement.speeds, dnd5e 5 en movement. */
export function velocidad(actor) {
  const m = actor?.system?.attributes?.movement ?? {};
  return { pie: num(m.speeds?.walk ?? m.walk), pies: m.units === "ft" };
}
/** Resistencias, vulnerabilidades e inmunidades a daño, con las claves de dnd5e. */
export function resistencias(actor) {
  const t = actor?.system?.traits ?? {};
  const de = x => new Set(Array.from(x?.value ?? []));
  return { resiste: de(t.dr), vulnerable: de(t.dv), inmune: de(t.di) };
}

/** Bono de salvación de una característica (str, dex, con, int, wis, cha). */
export function bonoSalvacion(actor, clave) {
  const x = actor?.system?.abilities?.[clave];
  return num(x?.save?.value ?? (typeof x?.save === "number" ? x.save : null) ?? x?.mod);
}
/** CD de una característica a la manera de dnd5e: 8 + modificador + competencia. */
export const cdCaracteristica = (actor, clave) => 8 + num(actor?.system?.abilities?.[clave]?.mod) + num(actor?.system?.attributes?.prof);
export const caido = actor => pg(actor).valor <= 0;

/* ---------- Recursos de la casa ---------- */
export const moneda = actor => num(actor?.system?.currency?.soul);
/** Datos de actualización para dejar las Monedas Antiguas en `n` (nunca negativas). */
export const datosMoneda = n => ({ "system.currency.soul": Math.max(0, Math.trunc(num(n))) });
export const agotamiento = actor => num(actor?.system?.attributes?.exhaustion);
export const datosAgotamiento = n => ({ "system.attributes.exhaustion": Math.min(6, Math.max(0, Math.trunc(num(n)))) });
/** El nivel de Agotamiento que mata (6 en dnd5e, o lo que diga su configuración). */
export const agotamientoMax = () => num(globalThis.CONFIG?.DND5E?.conditionTypes?.exhaustion?.levels, 6) || 6;
/** Total de una habilidad (med, prc…) con todos sus bonos. */
export const totalHabilidad = (actor, clave) => { const s = actor?.system?.skills?.[clave]; return num(s?.total ?? s?.mod); };

/* ---------- Tiradas ---------- */
/** Grado de éxito. dnd5e solo tiene éxito y fallo; el 20 y el 1 naturales se marcan como crítico para el azar de Ecos. */
export function gradoDeExito(total, cd, natural = null) {
  if (natural === 20) return "critico";
  if (natural === 1) return "falloCritico";
  return num(total) >= num(cd) ? "exito" : "fallo";
}
export const leerTirada = m => infoTirada(m);
export const tirarHabilidad = (actor, clave, op = {}, dialogo = { configure: false }, mensaje = {}) => actor.rollSkill?.({ skill: clave, ...op }, dialogo, mensaje);
export const tirarSalvacion = (actor, clave, op = {}, dialogo = { configure: false }, mensaje = {}) => actor.rollSavingThrow?.({ ability: clave, ...op }, dialogo, mensaje);

/* ---------- Estados ---------- */
export const aplicarEstado = (actor, estado, activo = true) => actor.toggleStatusEffect?.(estado, { active: activo });
export const tieneEstado = (actor, estado) => !!actor?.statuses?.has?.(estado);
