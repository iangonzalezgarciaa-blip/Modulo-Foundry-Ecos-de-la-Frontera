/** Adaptación de los estados del Verbe a tiradas y efectos de Foundry/dnd5e. */
const MOD = "ecos-frontera";
const F = "verbe";
const metalPendiente = new WeakMap();
const flag = ef => ef.getFlag?.(MOD, F) ?? ef.flags?.[MOD]?.[F] ?? {};
const tiene = (actor, estado) => !!actor?.statuses?.has(estado);
const efectos = (actor, estado) => actor?.effects?.filter(ef => !ef.disabled && (flag(ef).estado === estado
  || ef.statuses?.has?.(estado) || ef.statuses?.includes?.(estado))) ?? [];
const propio = actor => !!actor && (game.user.isGM || actor.isOwner);

export const metrosEnHoja = (metros, actor) => actor?.system?.attributes?.movement?.units === "ft" ? metros / 0.3 : metros;
export const actorDeTirada = config => config?.subject?.actor ?? config?.subject;

function modificarD20(config, tipo) {
  config[tipo] = true;
  config.rolls ??= [{}];
  if (!config.rolls.length) config.rolls.push({});
  for (const roll of config.rolls) (roll.options ??= {})[tipo] = true;
}

/** El marcador explícito prevalece; nunca se deduce el material solo por el nombre del arma. */
export function objetoMetalico(item) {
  if (!item) return false;
  const marcada = item.getFlag?.(MOD, "metal") ?? item.flags?.[MOD]?.metal;
  if (typeof marcada === "boolean") return marcada;
  return /\b(metal|hierro|acero|plata|cobre|bronce|oro|iron|steel|silver|bronze|copper|gold|mithral|adamantine)\b/i
    .test(String(item.system?.materials?.value ?? ""));
}
export const armaMetalica = item => item?.type === "weapon" && objetoMetalico(item);
export const llevaMetal = actor => {
  const marcado = actor?.getFlag?.(MOD, "metal") ?? actor?.flags?.[MOD]?.metal;
  if (typeof marcado === "boolean") return marcado;
  return actor?.items?.some(item => item.system?.quantity !== 0 && objetoMetalico(item)) ?? false;
};

export function configurarAtaque(config) {
  const actor = actorDeTirada(config);
  if (!actor) return;
  if (tiene(actor, "desequilibrado")) modificarD20(config, "disadvantage");
  const activity = config.subject;
  if (activity && typeof activity === "object") metalPendiente.delete(activity);
  if (!activity || !armaMetalica(activity.item)) return;
  const targets = [...(game.user.targets ?? [])];
  // No se concede ventaja a todos los blancos de una tirada múltiple por afectar a uno solo.
  if (targets.length !== 1) return;
  const target = targets[0]?.actor;
  if (!llevaMetal(target)) return;
  const disponibles = efectos(target, "cargado").filter(ef => !flag(ef).metalGastado);
  if (!disponibles.length) return;
  modificarD20(config, "advantage");
  metalPendiente.set(activity, { actor: target, atacante: actor, ids: disponibles.map(ef => ef.id ?? ef._id) });
}

export function configurarSalvacion(config) {
  const actor = actorDeTirada(config);
  const ability = config?.ability ?? config?.rolls?.[0]?.options?.ability;
  if (tiene(actor, "embarrado") && ability === "dex") modificarD20(config, "disadvantage");
}

export async function consumirMetal(actor, ids = []) {
  if (!propio(actor)) return false;
  for (const ef of efectos(actor, "cargado")) {
    if (!ids.includes(ef.id ?? ef._id)) continue;
    await ef.update({ [`flags.${MOD}.${F}.metalGastado`]: true });
  }
  return true;
}

export async function despuesAtaque(rolls, datos, enviarMetal) {
  if (!rolls?.length) return;
  const actor = datos?.subject?.actor;
  if (propio(actor)) for (const ef of efectos(actor, "desequilibrado")) await ef.delete();
  const pendiente = metalPendiente.get(datos?.subject);
  if (!pendiente) return;
  metalPendiente.delete(datos.subject);
  if (propio(pendiente.actor)) await consumirMetal(pendiente.actor, pendiente.ids);
  else await enviarMetal?.(pendiente.actor, pendiente.atacante, pendiente.ids);
}

/** Solo las aplicaciones al actor convierten las distancias; los efectos del objeto conservan metros. */
export function normalizarHielo(effect, data) {
  const actor = effect?.parent;
  const fl = data?.flags?.[MOD]?.[F];
  if (actor?.documentName !== "Actor" || fl?.estado !== "helado" || fl.unidadesConvertidas) return;
  const cambios = (data.changes ?? []).map(c => c.key === "system.attributes.movement.walk"
    ? { ...c, value: String(metrosEnHoja(-3, actor)) } : c);
  effect.updateSource({ changes: cambios, [`flags.${MOD}.${F}.unidadesConvertidas`]: true });
}

export async function revisarEstados(actor, estadoNuevo = null) {
  if (!propio(actor)) return;
  if (["empapado", "embarrado"].includes(estadoNuevo)) {
    for (const ef of efectos(actor, "ardiendo")) await ef.delete();
  }
  const congelado = actor.effects?.find(ef => flag(ef).congelado);
  const inmovil = efectos(actor, "helado").length > 0 && Number(actor.system?.attributes?.movement?.walk) <= 0;
  if (inmovil && !congelado) await actor.createEmbeddedDocuments("ActiveEffect", [{
    name: "Apresado por el hielo", img: "systems/dnd5e/icons/svg/statuses/restrained.svg", statuses: ["restrained"],
    transfer: false, changes: [], flags: { [MOD]: { [F]: { congelado: true } } }
  }]);
  else if (!inmovil && congelado) await congelado.delete();
}
