/**
 * 3.46 · Ventaja y desventaja por estados (auditoría pedida por el autor: «completar lo que el sistema de D&D base no da»).
 * dnd5e 6 solo aplica los estados de quien tira (Envenenado, Agotamiento, Esquivar en salvaciones de DES). No mira al blanco:
 * atacar a alguien Derribado, Cegado, Apresado, Aturdido, Paralizado, Inconsciente o que está Esquivando no cambia nada.
 * Esto lo completa con las reglas del Manual del jugador (2024):
 *  - Ataques: estados del atacante (Cegado, Derribado, Apresado, Invisible, Escondido) y del blanco (los de arriba, Invisible),
 *    Derribado a 1,5 m (ventaja) o más lejos (desventaja), ataque a distancia con un enemigo a 1,5 m o más allá del alcance normal.
 *  - Salvaciones: avisa que Paralizado, Aturdido, Inconsciente y Petrificado fallan solas las de FUE y DES.
 *  - Escondido se pierde al atacar (con «Deshacer» en el chat). Ayudar deja «Ayudado» en un aliado: ventaja en su próxima tirada.
 * Lo que pone se ve en la ventana de la tirada (se puede cambiar a mano antes de tirar) y en el chat, con el motivo.
 * Regla del autor: todo lo automático se revierte. Ajuste «ventajaEstados» para apagarlo.
 */
const MOD = "ecos-frontera";
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
export const NOMBRE_ESTADO = { blinded: "Cegado", prone: "Derribado", restrained: "Apresado", invisible: "Invisible", hiding: "Escondido", paralyzed: "Paralizado",
  petrified: "Petrificado", stunned: "Aturdido", unconscious: "Inconsciente", dodging: "Esquivando", frightened: "Asustado", grappled: "Agarrado", incapacitated: "Incapacitado" };
const tiene = (s, k) => !!s?.has?.(k);

/**
 * Qué ventajas y desventajas tiene un ataque. Puro.
 * @param {object} o
 * @param {Set<string>} o.atacante   estados de quien ataca
 * @param {Set<string>|null} o.blanco estados del blanco (null si no hay blanco marcado)
 * @param {number|null} o.distancia  pies entre los dos (null si no se sabe)
 * @param {boolean} o.aDistancia     el ataque es a distancia
 * @param {number|null} o.alcanceNormal  alcance normal en pies del arma o conjuro a distancia
 * @param {boolean} o.enemigoCerca   hay un enemigo consciente a 1,5 m de quien ataca
 * @param {boolean} o.veInvisible    quien ataca ve lo invisible (Vista verdadera, Visión ciega…)
 * @param {boolean} o.ayudado        quien ataca tiene «Ayudado»
 */
export function ventajaAtaque({ atacante = new Set(), blanco = null, distancia = null, aDistancia = false, alcanceNormal = null, enemigoCerca = false, veInvisible = false, ayudado = false } = {}) {
  const ventajas = [], desventajas = [], notas = [];
  // Quien ataca
  if (tiene(atacante, "invisible")) ventajas.push("estás Invisible");
  if (tiene(atacante, "hiding")) ventajas.push("estás Escondido (al atacar dejas de estarlo)");
  if (ayudado) ventajas.push("te Ayudaron");
  if (tiene(atacante, "blinded")) desventajas.push("estás Cegado");
  if (tiene(atacante, "prone")) desventajas.push("estás Derribado");
  if (tiene(atacante, "restrained")) desventajas.push("estás Apresado");
  if (tiene(atacante, "frightened")) notas.push("Asustado: desventaja si ves lo que te asusta (cámbialo en la ventana si es así)");
  if (tiene(atacante, "grappled")) notas.push("Agarrado: desventaja contra cualquiera que no sea quien te sujeta");
  // El blanco
  if (blanco) {
    for (const k of ["blinded", "paralyzed", "petrified", "restrained", "stunned", "unconscious"]) if (tiene(blanco, k)) ventajas.push(`el blanco está ${NOMBRE_ESTADO[k]}`);
    if (tiene(blanco, "prone") && distancia != null) {
      if (distancia <= 5) ventajas.push("el blanco está Derribado y estás a 1,5 m");
      else desventajas.push("el blanco está Derribado y estás a más de 1,5 m");
    }
    const quieto = ["paralyzed", "petrified", "stunned", "unconscious", "incapacitated", "restrained", "grappled"].some(k => tiene(blanco, k));
    if (tiene(blanco, "dodging") && !quieto) desventajas.push("el blanco está Esquivando");
    if (tiene(blanco, "invisible") && !veInvisible) desventajas.push("el blanco está Invisible");
    if ((tiene(blanco, "paralyzed") || tiene(blanco, "unconscious")) && distancia != null && distancia <= 5) notas.push("si aciertas a 1,5 m, el golpe es crítico");
  }
  // A distancia
  if (aDistancia) {
    if (enemigoCerca) desventajas.push("atacas a distancia con un enemigo a 1,5 m");
    if (alcanceNormal && distancia != null && distancia > alcanceNormal) desventajas.push(`el blanco está más allá de tu alcance normal (${alcanceNormal} ft)`);
  }
  return { ventajas, desventajas, notas, ventaja: ventajas.length > 0, desventaja: desventajas.length > 0 };
}
/** Salvaciones: las de FUE y DES fallan solas con estos estados. Puro. */
export function avisoSalvacion(estados = new Set(), habilidad = "") {
  if (!["str", "dex"].includes(habilidad)) return null;
  const k = ["paralyzed", "stunned", "unconscious", "petrified"].find(x => tiene(estados, x));
  return k ? `${NOMBRE_ESTADO[k]}: falla sola esta salvación de ${habilidad === "str" ? "Fuerza" : "Destreza"} (el DM la da por fallada).` : null;
}
/** Distancia en pies entre dos rectángulos de casillas (regla 5-5-5). Puro. */
export function distanciaCasillas(a, b, pies = 5) {
  const gx = Math.max(0, Math.max(a.x, b.x) - Math.min(a.x + a.w, b.x + b.w));
  const gy = Math.max(0, Math.max(a.y, b.y) - Math.min(a.y + a.h, b.y + b.h));
  return (Math.max(gx, gy) + 1) * pies;
}
/** Texto del chat con el porqué. Puro. */
export function explicar(r) {
  const p = [];
  if (r.ventaja && r.desventaja) p.push(`<b>Ventaja y desventaja se anulan</b> (ventaja: ${r.ventajas.join("; ")} · desventaja: ${r.desventajas.join("; ")}).`);
  else if (r.ventaja) p.push(`<b>Ventaja:</b> ${r.ventajas.join("; ")}.`);
  else if (r.desventaja) p.push(`<b>Desventaja:</b> ${r.desventajas.join("; ")}.`);
  for (const n of r.notas) p.push(`<i>${n}.</i>`);
  return p.join(" ");
}

/* ---------------- Foundry ---------------- */
const activo = () => { try { return game.settings.get(MOD, "ventajaEstados") !== false; } catch { return true; } };
const estados = a => new Set(a?.statuses ?? []);
function casillas(t) {
  const g = canvas?.grid?.size || 100, d = t.document;
  return { x: Math.round(d.x / g), y: Math.round(d.y / g), w: d.width || 1, h: d.height || 1 };
}
const pasos = () => Number(canvas?.scene?.grid?.distance) || 5;
const tokenDe = actor => canvas?.tokens?.controlled?.find(t => t.actor === actor) ?? actor?.getActiveTokens?.()[0] ?? null;
function enemigoCerca(tok) {
  const yo = tok?.document?.disposition ?? 0;
  if (!tok || !yo) return false;
  return (canvas?.tokens?.placeables ?? []).some(t => t !== tok && t.actor && !t.document.hidden && (t.document.disposition ?? 0) * yo < 0
    && !["dead", "incapacitated", "unconscious", "paralyzed", "stunned", "petrified"].some(k => t.actor.statuses?.has?.(k))
    && distanciaCasillas(casillas(tok), casillas(t), pasos()) <= 5);
}
const veInvisible = a => (Number(a?.system?.attributes?.senses?.truesight) || 0) > 0 || (Number(a?.system?.attributes?.senses?.blindsight) || 0) > 0
  || (Number(a?.system?.attributes?.senses?.ranges?.truesight) || 0) > 0 || (Number(a?.system?.attributes?.senses?.ranges?.blindsight) || 0) > 0;
const efectoAyuda = a => a?.effects?.find?.(e => e.getFlag?.(MOD, "ayudado"));
function datosAtaque(activity, config) {
  const actor = activity?.actor, item = activity?.item;
  const tipo = String(activity?.actionType ?? activity?.attack?.type?.value ?? "");
  const modo = String(config?.attackMode ?? config?.rolls?.[0]?.options?.attackMode ?? "");
  const aDistancia = tipo.startsWith("r") || tipo === "ranged" || /thrown|ranged/.test(modo);
  const alcance = Number(item?.system?.range?.value) || Number(activity?.range?.value) || null;
  const largo = Number(item?.system?.range?.long) || null;
  return { actor, aDistancia, alcanceNormal: aDistancia && largo ? alcance : null };
}
function calcularAtaque(activity, config) {
  const { actor, aDistancia, alcanceNormal } = datosAtaque(activity, config);
  const tok = tokenDe(actor), blancoTok = game.user?.targets?.size === 1 ? game.user.targets.first() : null;
  const distancia = tok && blancoTok ? distanciaCasillas(casillas(tok), casillas(blancoTok), pasos()) : null;
  return ventajaAtaque({ atacante: estados(actor), blanco: blancoTok?.actor ? estados(blancoTok.actor) : null, distancia, aDistancia, alcanceNormal,
    enemigoCerca: aDistancia ? enemigoCerca(tok) : false, veInvisible: veInvisible(actor), ayudado: !!efectoAyuda(actor) });
}
function agregarFlavor(message, html) {
  if (!html) return;
  foundry.utils.setProperty(message, "data.flavor", `${message?.data?.flavor ?? ""}<div class="ecos-ventaja-motivo">${html}</div>`);
}
async function avisarEnChat(actor, html, deshacer = null) {
  const { botonDeshacer } = await import("./deshacer.js");
  return ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), content: `<p class="ecos-ventaja-motivo">${html}</p>${deshacer ? botonDeshacer() : ""}`,
    flags: deshacer ? { [MOD]: { deshacer } } : {} });
}
/** Gasta la Acción de quien la usa (si está en combate y le queda). Devuelve false si ya la gastó. */
async function gastarAccion(actor) {
  const { combateActivo, datosTurno, turnoVacio, cambiarTurno, ACCIONES_DND } = await import("./turno-tracker.js");
  const combat = combateActivo(), c = combat?.combatants?.find?.(x => x.actor === actor || x.actorId === actor.id);
  if (!c) return true;
  const t = datosTurno(combat, c.id) ?? turnoVacio(combat.round, combat.turn);
  if (t.accion) { ui.notifications.warn(`${actor.name} ya gastó su ${ACCIONES_DND.accion} este turno.`); return false; }
  await cambiarTurno(c.id, { op: "gastar", clave: "accion" });
  return true;
}
/** Ayudar: deja «Ayudado» en el aliado marcado (ventaja en su próxima tirada de ataque o prueba, hasta tu próximo turno). */
export async function ayudar(actor, { gastar = false } = {}) {
  const aliado = game.user?.targets?.size === 1 ? game.user.targets.first()?.actor : null;
  if (!aliado || aliado === actor) { ui.notifications.warn("Marca (T) al aliado que ayudas: tendrá ventaja en su próxima tirada de ataque o prueba."); return false; }
  if (gastar && !(await gastarAccion(actor))) return false;
  const fx = await aliado.createEmbeddedDocuments("ActiveEffect", [{ name: `Ayudado por ${actor.name}`, img: "icons/svg/upgrade.svg",
    duration: { rounds: 1, turns: 1 }, description: "<p>Ventaja en tu próxima tirada de ataque o prueba de característica, antes del próximo turno de quien te ayudó. Se gasta al usarla.</p>",
    flags: { [MOD]: { ayudado: { de: actor.uuid } } } }]).catch(() => []);
  if (!fx?.length) { ui.notifications.warn(`No puedo poner «Ayudado» en ${aliado.name} (pídeselo al DM).`); return false; }
  await avisarEnChat(actor, `<b>${esc(actor.name)}</b> ayuda a <b>${esc(aliado.name)}</b>: ventaja en su próxima tirada de ataque o prueba.`, { cambios: [], borrar: [fx[0].uuid] });
  return true;
}
/** Esconderse: Sigilo CD 15; si lo supera, queda Escondido. */
export async function esconderse(actor, { gastar = false } = {}) {
  if (gastar && !(await gastarAccion(actor))) return false;
  const r = await actor.rollSkill?.({ skill: "ste" }, {}, {}).catch(() => null);
  const total = Array.isArray(r) ? r[0]?.total : r?.total;
  if (!Number.isFinite(total)) return false;
  if (total >= 15) {
    await actor.toggleStatusEffect("hiding", { active: true }).catch(() => null);
    await avisarEnChat(actor, `<b>${esc(actor.name)}</b> se esconde (Sigilo ${total} ≥ 15): queda <b>Escondido</b>. Quien lo busque usa Percepción contra ${total}. Atacar o hacer ruido lo delata.`);
  } else await avisarEnChat(actor, `<b>${esc(actor.name)}</b> no logra esconderse (Sigilo ${total}, necesita 15).`);
  return total >= 15;
}
if (globalThis.Hooks) {
  Hooks.once("init", () => game.settings.register(MOD, "ventajaEstados", { name: "Ventaja y desventaja por estados", scope: "world", config: true, type: Boolean, default: true,
    hint: "Aplica en ataques la ventaja o desventaja por los estados del blanco y de quien ataca (Derribado, Esquivando, Cegado, Apresado, Invisible…), como dice el Manual. Se ve el motivo y se puede cambiar en la ventana de la tirada." }));
  Hooks.on("dnd5e.preRollAttackV2", (config, dialog, message) => {
    if (!activo() || game.system?.id !== "dnd5e" || config?.ecosSinVentaja) return;
    const activity = config?.subject;
    if (!activity?.actor) return;
    try {
      const r = calcularAtaque(activity, config);
      if (r.ventaja) config.advantage = true;
      if (r.desventaja) config.disadvantage = true;
      agregarFlavor(message, explicar(r));
      config.ecosVentaja = r;
    } catch (err) { console.error(`${MOD} | ventaja`, err); }
  });
  // Al atacar se gastan «Escondido» y «Ayudado» (con Deshacer en el chat).
  Hooks.on("dnd5e.rollAttackV2", async (rolls, datos) => {
    if (!activo()) return;
    const actor = datos?.subject?.actor;
    if (!actor?.isOwner || (game.user.isGM && actor.hasPlayerOwner && actor.activeOwner && !actor.activeOwner.isSelf)) return;
    const quitar = [];
    if (actor.statuses?.has?.("hiding")) { await actor.toggleStatusEffect("hiding", { active: false }).catch(() => null); quitar.push("Escondido"); }
    const ay = efectoAyuda(actor);
    if (ay) { await ay.delete().catch(() => null); quitar.push("Ayudado"); }
    if (quitar.length) await avisarEnChat(actor, `<b>${esc(actor.name)}</b> ataca y deja de estar ${quitar.join(" y ")}.`);
  });
  for (const h of ["dnd5e.preRollAbilityCheckV2", "dnd5e.preRollSkillV2", "dnd5e.preRollToolV2"]) Hooks.on(h, (config, dialog, message) => {
    if (!activo()) return;
    const actor = config?.subject?.actor ?? config?.subject;
    if (efectoAyuda(actor)) { config.advantage = true; agregarFlavor(message, "<b>Ventaja:</b> te Ayudaron (se gasta con esta tirada)."); config.ecosAyudado = true; }
  });
  for (const h of ["dnd5e.rollAbilityCheckV2", "dnd5e.rollSkillV2", "dnd5e.rollToolV2"]) Hooks.on(h, async (rolls, datos) => {
    const actor = datos?.subject?.actor ?? datos?.subject;
    const ay = efectoAyuda(actor);
    if (ay && actor?.isOwner) await ay.delete().catch(() => null);
  });
  Hooks.on("dnd5e.preRollSavingThrowV2", (config, dialog, message) => {
    if (!activo()) return;
    const actor = config?.subject?.actor ?? config?.subject;
    const aviso = avisoSalvacion(estados(actor), config?.ability);
    if (aviso) agregarFlavor(message, `<b>${esc(aviso)}</b>`);
  });
  // «Ayudar» desde la hoja (Acciones de Sabiduría): pone «Ayudado» en el aliado marcado. La Acción ya la cuenta el control del turno.
  Hooks.on("dnd5e.postUseActivity", activity => {
    if (!activo() || activity?.name !== "Ayudar" || !activity?.item?.flags?.[MOD]?.accionComun || !activity.actor?.isOwner) return;
    ayudar(activity.actor).catch(err => console.error(`${MOD} | ayudar`, err));
  });
  Hooks.once("ready", () => { const api = game.modules.get(MOD)?.api; if (api) { api.ventajaAtaque = ventajaAtaque; api.ayudar = ayudar; api.esconderse = esconderse; } });
}
