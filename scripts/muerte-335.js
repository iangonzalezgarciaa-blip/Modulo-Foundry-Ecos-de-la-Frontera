/**
 * 3.35 · A 0 PG y el precio de volver (pedidos del autor):
 *  - Acechado por la Muerte (0 PG): pierde sus reacciones (de D&D y del Verbe) pero puede hacer acciones básicas para
 *    sobrevivir (Esquivar, Desengancharse, arrastrarse, esconderse, tomar una poción, ayudar). No ataca, no lanza
 *    conjuros ni técnicas. Derribado, se arrastra: cada pie cuesta el doble (la mitad de su movimiento).
 *  - Además de la salvación de muerte del inicio del turno, puede gastar su acción en otra con ventaja: si falla,
 *    +1 Agotamiento.
 *  - El precio de volver ya no es siempre +1 Agotamiento: salvación de Constitución CD 8 + 2 × su Agotamiento; si falla,
 *    +1. Con un 20 natural en la salvación de muerte no tira: se quita 1 de Agotamiento y actúa ya con todo su turno.
 */
const MOD = "ecos-frontera";
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

/* ---------------- Puro ---------------- */
/** La CD del precio de volver según el Agotamiento que ya tiene. */
export const cdPrecioVolver = agotamiento => 8 + 2 * Math.max(0, Number(agotamiento) || 0);
/** ¿Qué puede hacer a 0 PG? Acciones básicas sí; atacar, conjuros, técnicas y reacciones no. */
export function permitidoAcechado(act) {
  if (!act) return true;
  const it = act.item, tipoAct = act.activation?.type ?? it?.system?.activation?.type;
  if (tipoAct === "reaction") return { ok: false, motivo: "A 0 PG no tienes reacciones (ni de D&D ni del Verbe)." };
  if (it?.flags?.[MOD]?.verbe) return { ok: false, motivo: "A 0 PG no puedes usar técnicas del Verbe: solo acciones básicas para sobrevivir." };
  if (it?.type === "spell") return { ok: false, motivo: "A 0 PG no puedes lanzar conjuros: solo acciones básicas para sobrevivir." };
  if (["attack", "save", "damage"].includes(act.type)) return { ok: false, motivo: "A 0 PG no puedes atacar: puedes Esquivar, Desengancharte, arrastrarte, esconderte o tomar una poción." };
  return { ok: true };
}
export const TEXTO_ACECHADO = "Está a 0 PG pero consciente y Derribado. No tiene reacciones (ni de D&D ni del Verbe) y no ataca, no lanza conjuros ni técnicas; sí puede hacer acciones básicas para sobrevivir: Esquivar, Desengancharse, arrastrarse (cada pie cuesta el doble), esconderse, tomar una poción, ayudar. Al inicio de su turno tira una salvación de muerte; puede gastar su acción en otra con ventaja (si falla, +1 Agotamiento). 3 fallos = Secuela, no muerte. Recibir daño = 1 fallo.";

/* ---------------- Foundry ---------------- */
const leer = (k, def) => { try { return game.settings.get(MOD, k); } catch { return def; } };
const acechado = a => !!a?.statuses?.has?.("acechado");
const duenoJugador = a => game.users.find(u => u.active && !u.isGM && a?.testUserPermission?.(u, "OWNER"));

/** Otra salvación de muerte con ventaja gastando la acción; si falla, +1 Agotamiento. */
export async function salvacionConAccion(actor) {
  if (!acechado(actor)) return;
  const combat = game.combat?.started ? game.combat : null, c = combat?.combatants?.find?.(x => x.actor === actor || x.actorId === actor.id);
  if (c) { const { cambiarTurno } = await import("./turno-tracker.js"); await cambiarTurno(c.id, { op: "gastar", clave: "accion" }); }
  const antes = actor.system?.attributes?.exhaustion ?? 0;
  const r = await actor.rollDeathSave({ advantage: true }, { configure: false });
  const roll = Array.isArray(r) ? r[0] : r;
  if (!roll) return;
  if (roll.total < 10) {
    const max = CONFIG.DND5E?.conditionTypes?.exhaustion?.levels ?? 6;
    const nuevo = Math.min(max, (Number(antes) || 0) + 1);
    await actor.update({ "system.attributes.exhaustion": nuevo });
    await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), content: `<p>${esc(actor.name)} se desangra en el intento: <b>+1 Agotamiento</b> (${antes} → ${nuevo}).</p>` });
  }
}
async function ofrecerAccion(actor) {
  const si = await foundry.applications.api.DialogV2.confirm({ window: { title: `${actor.name} · a 0 PG`, icon: "fa-solid fa-heart-pulse" },
    content: `<p>Ya tiraste tu salvación de muerte de este turno.</p><p>¿Quieres <b>gastar tu acción</b> para intentar otra con <b>ventaja</b>? Si sale 10 o más cuenta como éxito (con 20 natural te levantas). Si falla, cuenta como fallo y además ganas <b>+1 Agotamiento</b>.</p>`,
    yes: { label: "Lo intento", icon: "fa-solid fa-dice-d20" }, no: { label: "No, me quedo quieto" }, rejectClose: false });
  if (si) await salvacionConAccion(actor);
}

/** El precio de volver: salvación de CON (o, con 20 natural, se quita 1 y actúa ya). Devuelve líneas para la tarjeta. */
export async function precioVolver335(actor, { epico = false } = {}) {
  const L = [];
  const exh = Number(actor.system?.attributes?.exhaustion) || 0;
  if (epico) {
    const nuevo = Math.max(0, exh - 1);
    await actor.update({ "system.attributes.exhaustion": nuevo });
    L.push(`<b>¡20 natural!</b> ${esc(actor.name)} saca fuerzas de la nada: no paga Agotamiento, <b>se quita 1</b> (${exh} → ${nuevo}) y <b>actúa ya</b> con todo su turno.`);
    const combat = game.combat?.started ? game.combat : null;
    const c = combat?.combatants?.find?.(x => x.actor === actor || x.actorId === actor.id);
    if (c && game.user.isGM) {
      await ChatMessage.create({ whisper: game.users.filter(u => u.isGM).map(u => u.id), speaker: { alias: "Ecos" }, flags: { [MOD]: { turnoEpico: { combatId: combat.id, cid: c.id } } },
        content: `<p><b>${esc(actor.name)}</b> vuelve con un 20 natural y actúa ya.</p><button type="button" data-ecos-turno-epico="${c.id}"><i class="fa-solid fa-bolt"></i> Darle su turno ahora</button>` });
    }
    return { L, subio: false, exh: nuevo };
  }
  const cd = cdPrecioVolver(exh);
  const r = await actor.rollSavingThrow?.({ ability: "con", target: cd }, { configure: false }, { data: { flavor: `El precio de volver (CD ${cd})` } });
  const roll = Array.isArray(r) ? r[0] : r;
  const paso = !!roll && roll.total >= cd;
  const max = CONFIG.DND5E?.conditionTypes?.exhaustion?.levels ?? 6;
  const nuevo = paso ? exh : Math.min(max, exh + 1);
  if (!paso) await actor.update({ "system.attributes.exhaustion": nuevo });
  L.push(`El precio de volver: salvación de Constitución CD ${cd} → <b>${roll?.total ?? "?"}</b>: ${paso ? "<b>la pasa</b>, no gana Agotamiento" : `<b>falla</b>, +1 Agotamiento (${exh} → ${nuevo})`}.`);
  return { L, subio: !paso, exh: nuevo };
}

if (globalThis.Hooks) {
  Hooks.once("init", () => {
    try { game.settings.register(MOD, "accionMuerte", { name: "A 0 PG: ofrecer otra salvación con la acción", hint: "Después de la salvación de muerte del turno, el jugador puede gastar su acción en otra con ventaja (si falla, +1 Agotamiento).", scope: "world", config: true, type: Boolean, default: true }); } catch { /* ya */ }
  });
  // A 0 PG: sin reacciones ni ataques, conjuros o técnicas.
  Hooks.on("dnd5e.preUseActivity", (activity) => {
    const actor = activity?.actor;
    if (!acechado(actor)) return;
    const p = permitidoAcechado(activity);
    if (p.ok) return;
    ui.notifications.warn(`${actor.name}: ${p.motivo}`);
    return false;
  });
  // Después de la salvación de muerte automática, ofrecer la de la acción a su dueño.
  // dnd5e llama a este gancho con (rolls, details) y el actor en details.subject (3.39: antes no lo encontraba y nunca ofrecía).
  Hooks.on("dnd5e.rollDeathSave", (rolls, details) => {
    const actor = details?.subject;
    if (!actor || !leer("accionMuerte", true) || !game.combat?.started) return;
    const c = game.combat.combatant;
    if (!c || (c.actor !== actor && c.actorId !== actor?.id)) return;
    const roll = rolls?.[0];
    if (roll?.isCritical) return;
    const u = duenoJugador(actor);
    const yo = u ? u.isSelf : game.user.isGM && game.users.activeGM?.isSelf;
    if (!yo) return;
    // Solo la primera del turno (la automática): la de la acción ya no vuelve a ofrecer.
    const clave = `${game.combat.id}.${game.combat.round}.${game.combat.turn}`;
    if (actor.getFlag(MOD, "accionMuerteTurno") === clave) return;
    actor.setFlag(MOD, "accionMuerteTurno", clave).then(() => setTimeout(() => ofrecerAccion(actor).catch(err => console.error(`${MOD} | muerte`, err)), 600));
  });
  // El botón del DM para el turno épico.
  Hooks.on("renderChatMessageHTML", (msg, html) => {
    const b = html?.querySelector?.("[data-ecos-turno-epico]");
    if (!b) return;
    if (!game.user.isGM) { b.remove(); return; }
    b.addEventListener("click", async () => {
      const combat = game.combat, i = combat?.turns?.findIndex?.(t => t.id === b.dataset.ecosTurnoEpico);
      if (combat && i >= 0) await combat.update({ turn: i });
      b.disabled = true;
    });
  });
}
