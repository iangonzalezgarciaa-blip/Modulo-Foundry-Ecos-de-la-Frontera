/**
 * Compatibilidad entre Foundry 13 y 14 y entre dnd5e 5 y 6 (3.10.0). Reglas puras: sin efectos al importarse.
 *
 * Qué cambió y aquí se resuelve:
 *  - Foundry 14: los cambios de un efecto activo usan `type` (texto: "add", "override"…) en vez de `mode` numérico;
 *    `CONST.DICE_ROLL_MODES` y el ajuste `core.rollMode` dan paso a `core.messageMode` ("public", "gm", "blind", "self");
 *    borrar una clave con "-=" se reemplaza por el operador `_del` (ForcedDeletion).
 *  - dnd5e 6: los mensajes del chat tienen tipo y datos propios (`message.type` y `message.system`) en vez de
 *    `flags.dnd5e.roll`, `flags.dnd5e.targets` y `flags.dnd5e.use.consumed`.
 * Cada función acepta los dos formatos, así el módulo sigue funcionando en Foundry 13 con dnd5e 5.2.
 * 3.11: `puenteRitmoViaje` devuelve a dnd5e 6 una función que otros módulos todavía buscan en su sitio viejo.
 */
const TIPOS = { 0: "custom", 1: "multiply", 2: "add", 3: "downgrade", 4: "upgrade", 5: "override" };
const NUMEROS = Object.fromEntries(Object.entries(TIPOS).map(([n, t]) => [t, Number(n)]));

/** ¿Los cambios de los efectos usan `type` (Foundry 14)? */
export const cambiosConTipo = () => !!globalThis.CONST?.ACTIVE_EFFECT_CHANGE_TYPES;

/** Un cambio de efecto en el formato del Foundry instalado. `modo` puede ser número (2) o texto ("add"). */
export function cambio(key, modo, value) {
  const tipo = typeof modo === "string" && Number.isNaN(Number(modo)) ? modo : (TIPOS[Number(modo)] ?? "add");
  return cambiosConTipo() ? { key, type: tipo, value: String(value) } : { key, mode: NUMEROS[tipo] ?? 2, value: String(value) };
}
/** Convierte una lista de cambios (con `mode` o `type`) al formato del Foundry instalado. */
export const cambios = (lista = []) => (lista ?? []).map(c => cambio(c.key, c.type ?? c.mode, c.value));
/** Tipo de un cambio ya existente, en texto, sin leer `mode` cuando hay `type` (leer `mode` avisa en Foundry 14). */
export const tipoDeCambio = c => (typeof c?.type === "string" ? c.type : TIPOS[Number(c?.mode)] ?? "add");

/* ---------- Modo de los mensajes (quién ve una tirada) ---------- */
const VIEJO_A_NUEVO = { publicroll: "public", gmroll: "gm", blindroll: "blind", selfroll: "self", roll: "public" };
const NUEVO_A_VIEJO = { public: "publicroll", gm: "gmroll", blind: "blindroll", self: "selfroll", ic: "publicroll" };
/** ¿Foundry 14, con modos de mensaje en texto? */
export const modosNuevos = () => !!globalThis.CONFIG?.ChatMessage?.modes || !!globalThis.game?.settings?.settings?.has?.("core.messageMode");
/** Modo de mensaje actual del usuario, siempre en el vocabulario nuevo ("public", "gm", "blind", "self"). */
export function modoActual() {
  try {
    if (modosNuevos()) { const m = game.settings.get("core", "messageMode"); return m === "ic" ? "public" : (m || "public"); }
    return VIEJO_A_NUEVO[game.settings.get("core", "rollMode")] ?? "public";
  } catch { return "public"; }
}
/** Normaliza un modo (viejo o nuevo) al vocabulario nuevo. */
export const modoNormal = m => VIEJO_A_NUEVO[m] ?? (NUEVO_A_VIEJO[m] ? (m === "ic" ? "public" : m) : m ?? null);
/** Modo en el formato que espera el Foundry instalado (texto nuevo en 14, "gmroll"… en 13). */
export const modoParaFoundry = m => (modosNuevos() ? modoNormal(m) : (NUEVO_A_VIEJO[modoNormal(m)] ?? m));
/** Opciones para Roll#toMessage o RollTable#draw con el modo pedido, sin avisos de obsolescencia. */
export const opcionesModo = m => (modosNuevos() ? { messageMode: modoNormal(m) } : { rollMode: modoParaFoundry(m) });
/** Modo de un mensaje ya creado. */
export const modoDeMensaje = m => (m?.blind ? "blind" : (m?.whisper?.length ? "gm" : "public"));

/* ---------- Mensajes de dnd5e ---------- */
/**
 * Qué tirada lleva un mensaje: { tipo, skill, tool, ability }, con tipo attack, damage, healing, save, skill, ability,
 * tool, death, concentration, initiative, hitDie o hitPoints. null si no es una tirada de dnd5e.
 */
export function infoTirada(m) {
  const viejo = m?.flags?.dnd5e?.roll;
  if (viejo?.type) return { tipo: viejo.type, skill: viejo.skillId ?? viejo.skill ?? null, tool: viejo.toolId ?? null, ability: viejo.ability ?? null };
  const s = m?.system ?? {};
  switch (m?.type) {
    case "attack": return { tipo: "attack", skill: null, tool: null, ability: s.ability ?? null };
    case "check":
      if (s.type === "initiative") return { tipo: "initiative", skill: null, tool: null, ability: s.ability ?? null };
      return { tipo: s.skill ? "skill" : s.tool ? "tool" : "ability", skill: s.skill ?? null, tool: s.tool ?? null, ability: s.ability ?? null };
    case "save": return { tipo: s.type === "death" ? "death" : s.type === "concentration" ? "concentration" : "save", skill: null, tool: null, ability: s.ability ?? null };
    case "damage": case "healing": case "hitDie": case "hitPoints": return { tipo: m.type, skill: null, tool: null, ability: null };
    default: break;
  }
  if (m?.flags?.core?.initiativeRoll) return { tipo: "initiative", skill: null, tool: null, ability: null };
  return null;
}
/** Objetivos guardados en la tarjeta: [{ uuid (actor), token, name, ac }]. */
export function objetivosMensaje(m) {
  const lista = Array.isArray(m?.system?.targets) ? m.system.targets : (m?.flags?.dnd5e?.targets ?? []);
  return (Array.isArray(lista) ? lista : []).map(t => ({ uuid: t?.actor ?? t?.uuid ?? t?.actorUuid ?? null, token: t?.token ?? t?.tokenUuid ?? null, name: t?.name ?? "", ac: t?.ac ?? null }));
}
/** Actualización que deja en la tarjeta solo los objetivos que cumplen `seguir(objetivo)`. null si no hay nada que cambiar. */
export function filtrarObjetivosMensaje(m, seguir) {
  if (Array.isArray(m?.system?.targets)) {
    const quedan = m.system.targets.filter(t => seguir({ uuid: t?.actor ?? null, token: t?.token ?? null }));
    return quedan.length === m.system.targets.length ? null : { "system.targets": quedan.map(t => (typeof t?.toObject === "function" ? t.toObject() : { ...t })) };
  }
  const viejos = m?.flags?.dnd5e?.targets;
  if (!Array.isArray(viejos)) return null;
  const quedan = viejos.filter(t => seguir({ uuid: t?.uuid ?? t?.actorUuid ?? null, token: t?.tokenUuid ?? null }));
  return quedan.length === viejos.length ? null : { "flags.dnd5e.targets": quedan };
}
/** 3.56: la actividad de una tarjeta (dnd5e 6: system.activity; dnd5e 5: flags.dnd5e.activity). */
export const actividadMensaje = m => m?.system?.activity?.uuid ?? m?.flags?.dnd5e?.activity?.uuid ?? null;
/** ¿Es la tarjeta de uso de una actividad (no una tirada)? */
export const esTarjetaUso = m => m?.type === "usage" || m?.flags?.dnd5e?.messageType === "usage" || (!!m?.flags?.dnd5e?.activity && !m?.flags?.dnd5e?.roll);
/** Lo consumido al usar una actividad (dnd5e 6: system.deltas; dnd5e 5: flags.dnd5e.use.consumed). */
export const consumoMensaje = m => m?.system?.deltas ?? m?.flags?.dnd5e?.use?.consumed ?? null;

/* ---------- Borrar claves en una actualización ---------- */
/**
 * Par [ruta, valor] que borra `ruta` en un update: `_del` en Foundry 14, "-=clave": null antes.
 * Ej.: Object.fromEntries([quitar("flags.ecos-frontera.pj")]).
 */
export function quitar(ruta) {
  const op = globalThis._del ?? (globalThis.foundry?.data?.operators?.ForcedDeletion ? new foundry.data.operators.ForcedDeletion() : null);
  if (op) return [ruta, op];
  const i = ruta.lastIndexOf(".");
  return [i < 0 ? `-=${ruta}` : `${ruta.slice(0, i)}.-=${ruta.slice(i + 1)}`, null];
}
/** ¿Esta clave de un cambio de actualización borra `nombre`? (sirve para "-=nombre" y para `_del`). */
export const borraClave = (cambios, nombre) => Object.prototype.hasOwnProperty.call(cambios ?? {}, `-=${nombre}`)
  || (globalThis.foundry?.data?.operators?.ForcedDeletion && cambios?.[nombre] instanceof foundry.data.operators.ForcedDeletion);

/* ---------- Duración de efectos ---------- */
/** ¿El efecto tiene una duración finita? (Foundry 14: value y units; antes: seconds, rounds y turns). */
export function duracionFinita(ef) {
  const d = ef?.duration ?? {};
  if ("units" in d || "expiry" in d) return Number(d.value) > 0; // Foundry 14: no se leen las claves viejas (avisan)
  return Number(d.seconds) > 0 || Number(d.rounds) > 0 || Number(d.turns) > 0;
}

/* ---------- Puentes para módulos de terceros escritos para dnd5e 5 ---------- */
/**
 * adv-reminder 5.1.2 llama a `dnd5e.dataModels.shared.MovementField.getTravelPaceMode`, que en dnd5e 6 pasó a
 * `dnd5e.dataModels.actor.TravelField`. Sin el alias, cada prueba de habilidad lanza un error en su gancho
 * (la tirada sale igual, pero sin sus recordatorios). Solo añade el alias si falta y si existe la función nueva.
 * Devuelve true si lo añadió.
 */
export function puenteRitmoViaje(sistema = globalThis.dnd5e) {
  const mov = sistema?.dataModels?.shared?.MovementField, viaje = sistema?.dataModels?.actor?.TravelField;
  if (!mov || typeof mov.getTravelPaceMode === "function" || typeof viaje?.getTravelPaceMode !== "function") return false;
  Object.defineProperty(mov, "getTravelPaceMode", { value: (...args) => viaje.getTravelPaceMode(...args), configurable: true, writable: true });
  return true;
}

/** 3.71 (prueba en el mundo): una duración copiada de un efecto trae `start: null` en Foundry 14; junto a `startTime` hacía fallar la creación («'time' in null»). Quita las claves nulas. Puro. */
export function duracionSinNulos(d) {
  if (!d || typeof d !== "object") return d;
  for (const k of Object.keys(d)) if (d[k] === null || d[k] === undefined) delete d[k];
  return d;
}
