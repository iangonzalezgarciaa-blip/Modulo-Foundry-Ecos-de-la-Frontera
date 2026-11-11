/**
 * 3.33 · El turno a la vista (pedidos del autor, para una mesa que aprende D&D jugando):
 *  - Bajo el carrusel de iniciativa, una barra con el turno de quien actúa: el movimiento que le queda (se descuenta solo
 *    al mover el token) y sus acciones: Acción, Acción adicional y Reacción de D&D, y Acción, Acción adicional y Reacción
 *    del Verbe. Al pasar el turno se borra y empieza de nuevo. El DM devuelve movimiento si alguien se movió mal.
 *  - Antes de mover: si te alejas de un enemigo que te tiene al alcance, aviso de ataque de oportunidad con un menú
 *    (moverte igual, desengancharte con tu acción o con tu acción adicional si tu clase puede, o no moverte); si el
 *    movimiento es más largo que lo que te queda, ofrece Correr.
 *  - Al empezar tu turno Derribado, pregunta si te levantas (cuesta la mitad de tu movimiento); si no, arrastrarse
 *    cuesta el doble.
 *  - Iniciativa: a cada jugador le pregunta si tira con ventaja, normal o desventaja.
 * Lo puro se prueba sin Foundry.
 */
const MOD = "ecos-frontera";
export const DESENGANCHE = "ecosDesenganche";
export const ESTADO_DESENGANCHE = { [DESENGANCHE]: { name: "Desenganchado", img: "icons/svg/wingfoot.svg", dura: 1,
  texto: "Se desenganchó: su movimiento no provoca ataques de oportunidad hasta el final de su turno." } };
export const ACCIONES_DND = { accion: "Acción", adicional: "Acción adicional", reaccion: "Reacción" };
export const ACCIONES_VERBE = { vAccion: "Acción Verbe", vAdicional: "Adicional Verbe", vReaccion: "Reacción Verbe" };
/** Rasgos que dejan desengancharse como acción adicional (Acción astuta, Escape ágil, Paso del viento…). */
export const DESENGANCHE_ADICIONAL = /acci[oó]n astuta|cunning action|escape [aá]gil|nimble escape|paso del viento|step of the wind|desenganche r[aá]pido/i;

/* ---------------- Puro ---------------- */
export const turnoVacio = (ronda = 0, turno = 0) => ({ ronda, turno, usado: 0, extra: 0, hist: [], accion: false, adicional: false, reaccion: false, levantado: false });
/** Lo que le queda de movimiento. */
export function movimientoRestante(t, velocidad) {
  return Math.max(0, (Number(velocidad) || 0) + (Number(t?.extra) || 0) - (Number(t?.usado) || 0));
}
/** Lo que cuesta un tramo: el doble arrastrándose (Derribado sin levantarse). */
export const costoTramo = (pies, { derribado = false } = {}) => Math.max(0, Number(pies) || 0) * (derribado ? 2 : 1);
/** Separación entre dos tokens en pies (la casilla más cercana, como mide D&D en cuadrícula). Rectángulos en píxeles. */
export function separacionPies(a, b, gridPx = 100, gridPies = 5) {
  const dx = Math.max(0, Math.abs((a.x + a.w / 2) - (b.x + b.w / 2)) - (a.w + b.w) / 2);
  const dy = Math.max(0, Math.abs((a.y + a.h / 2) - (b.y + b.h / 2)) - (a.h + b.h) / 2);
  return Math.round(Math.max(dx, dy) / gridPx) * gridPies;
}
/** ¿Lo tiene al alcance? (alcance 5 ft = casillas adyacentes). */
export const alAlcance = (sep, alcance = 5) => sep < Math.max(5, Number(alcance) || 5);
/**
 * A quién le das la espalda: los enemigos que te tenían al alcance en el origen y ya no en el destino. Puro.
 * `enemigos`: [{id, nombre, rect, alcance, reaccionLibre}]. `antes`/`despues`: rectángulo del que se mueve.
 */
export function provocaOportunidad(antes, despues, enemigos, { gridPx = 100, gridPies = 5 } = {}) {
  return (enemigos ?? []).filter(e => e.reaccionLibre !== false
    && alAlcance(separacionPies(antes, e.rect, gridPx, gridPies), e.alcance)
    && !alAlcance(separacionPies(despues, e.rect, gridPx, gridPies), e.alcance));
}
/** El tipo de acción de D&D de una activación de dnd5e. */
export const tipoActivacion = t => ({ action: "accion", bonus: "adicional", reaction: "reaccion" })[t] ?? null;

/* ---------------- Foundry ---------------- */
const leer = (k, def) => { try { return game.settings.get(MOD, k); } catch { return def; } };
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const gmActivo = () => game.user === game.users.activeGM;
const velocidadDe = actor => Number(actor?.system?.attributes?.movement?.walk) || 0;
const derribado = actor => !!actor?.statuses?.has?.("prone");
const combateActivo = () => (game.combat?.started ? game.combat : null);
const combatienteDe = (combat, tokenDoc) => combat?.combatants?.find?.(c => c.tokenId === tokenDoc?.id) ?? null;
const datosTurno = (combat, cid) => {
  // Se reinicia al empezar su turno: la reacción gastada fuera de su turno sigue gastada hasta entonces.
  return combat?.getFlag?.(MOD, "turnoDnD")?.[cid] ?? null;
};
/** El dueño jugador de un actor (o el DM). */
const duenoDe = actor => game.users.find(u => u.active && !u.isGM && actor?.testUserPermission?.(u, "OWNER")) ?? game.users.activeGM;

/** Escribe el turno de un combatiente (solo el DM activo; los demás se lo piden). */
export async function cambiarTurno(cid, cambio) {
  const combat = combateActivo();
  if (!combat || !cid) return;
  if (!gmActivo()) return game.socket.emit(`module.${MOD}`, { turno: "cambiar", combatId: combat.id, cid, cambio });
  const actual = datosTurno(combat, cid) ?? turnoVacio(combat.round, combat.turn);
  const nuevo = typeof cambio === "function" ? cambio(foundry.utils.deepClone(actual)) : { ...actual, ...cambio };
  await combat.setFlag(MOD, "turnoDnD", { [cid]: nuevo });
}

/* ---------- La barra del turno ---------- */
let BARRA = null;
function quitarBarra() { BARRA?.remove(); BARRA = null; }
function pip(clave, nombre, gastado, puede, titulo) {
  return `<button type="button" class="ecos-pip ${gastado ? "gastado" : "libre"}" data-pip="${clave}" ${puede ? "" : "disabled"} data-tooltip="${esc(titulo)}">${gastado ? "◇" : "◆"} ${esc(nombre)}</button>`;
}
export function renderBarra() {
  try {
    const combat = combateActivo();
    if (!leer("trackerTurno", true) || !combat?.combatant?.actor) return quitarBarra();
    const c = combat.combatant, actor = c.actor;
    const ve = game.user.isGM || actor.isOwner || actor.hasPlayerOwner;
    if (!ve || (c.hidden && !game.user.isGM)) return quitarBarra();
    const t = datosTurno(combat, c.id) ?? turnoVacio(combat.round, combat.turn);
    const vel = velocidadDe(actor), queda = movimientoRestante(t, vel), total = vel + (Number(t.extra) || 0);
    const puede = game.user.isGM || actor.isOwner;
    let v = null;
    try { v = game.modules.get(MOD)?.api?.verbe?.turnoVerbe?.(actor) ?? null; } catch { v = null; }
    const despierto = !!game.modules.get(MOD)?.api?.verbe?.despierto?.(actor);
    if (!BARRA) { BARRA = document.createElement("div"); BARRA.id = "ecos-turno"; document.body.appendChild(BARRA); BARRA.addEventListener("click", clicBarra); }
    const dock = document.querySelector("#combat-dock");
    const abajo = dock ? Math.round(dock.getBoundingClientRect().bottom) + 6 : 8;
    BARRA.style.top = `${abajo}px`;
    const pct = total ? Math.round(100 * queda / total) : 0;
    BARRA.innerHTML = `<div class="ecos-turno-cab"><b>Turno de ${esc(c.name)}</b>${derribado(actor) ? ' <span class="ecos-turno-aviso">Derribado: arrastrarse cuesta el doble</span>' : ""}</div>
      <div class="ecos-turno-mov" data-tooltip="Se descuenta solo al mover el token. Correr (Dash) suma tu velocidad otra vez."><div style="width:${pct}%"></div><span>Movimiento: ${queda} de ${total} ft</span></div>
      <div class="ecos-turno-pips">${pip("accion", "Acción", t.accion, puede, "Atacar, lanzar un conjuro, Correr, Desengancharse, Esquivar, Ayudar, Esconderse, usar un objeto…")}${pip("adicional", "Adicional", t.adicional, puede, "Solo si algo te da una acción adicional: un conjuro, un rasgo de clase, la segunda arma…")}${pip("reaccion", actor.statuses?.has?.("acechado") ? "Sin reacción (0 PG)" : "Reacción", t.reaccion || actor.statuses?.has?.("acechado"), puede, "Una por ronda: el ataque de oportunidad, un conjuro de reacción… Se recupera al empezar tu turno. A 0 PG no hay reacciones.")}</div>
      ${despierto && v ? `<div class="ecos-turno-pips verbe">${pip("vAccion", `Acción Verbe ${v.usadas}/${v.max}`, !v.accionLibre, false, "La acción Verbe va aparte de las de D&D: la gastan las técnicas.")}${pip("vAdicional", "Adicional Verbe", !v.adicionalLibre, false, "La gastan las técnicas de acción adicional.")}${pip("vReaccion", "Reacción Verbe", !v.reaccionLibre, false, "Sustitución, las defensas y los choques.")}</div>` : ""}
      ${puede ? `<div class="ecos-turno-botones"><button type="button" data-turno="correr" data-tooltip="Gasta tu Acción: sumas tu velocidad otra vez este turno.">Correr</button><button type="button" data-turno="desenganche" data-tooltip="Gasta tu Acción: este turno tu movimiento no provoca ataques de oportunidad.">Desengancharse</button><button type="button" data-turno="esquivar" data-tooltip="Gasta tu Acción: hasta tu próximo turno los ataques contra ti tienen desventaja y tienes ventaja en salvaciones de DES.">Esquivar</button>${game.user.isGM ? `<button type="button" data-turno="devolver" data-tooltip="Deshace el último movimiento contado (no mueve el token).">↶ Devolver movimiento</button><button type="button" data-turno="mas5" data-tooltip="Le da 5 ft más.">+5 ft</button><button type="button" data-turno="reiniciar" data-tooltip="Vuelve a empezar el turno: todo el movimiento y las acciones.">Reiniciar</button>` : ""}</div>` : ""}`;
  } catch (err) { console.warn(`${MOD} | barra del turno`, err); }
}
const renderLuego = globalThis.foundry?.utils?.debounce ? foundry.utils.debounce(renderBarra, 100) : renderBarra;

async function clicBarra(ev) {
  const b = ev.target.closest("button");
  const combat = combateActivo(), c = combat?.combatant, actor = c?.actor;
  if (!b || !actor || !(game.user.isGM || actor.isOwner)) return;
  const pipK = b.dataset.pip, acc = b.dataset.turno;
  if (pipK && pipK in ACCIONES_DND) return cambiarTurno(c.id, t => ({ ...t, [pipK]: !t[pipK] }));
  if (acc === "correr") return accionEstandar(actor, "correr");
  if (acc === "desenganche") return accionEstandar(actor, "desenganche");
  if (acc === "esquivar") return accionEstandar(actor, "esquivar");
  if (!game.user.isGM) return;
  if (acc === "devolver") return cambiarTurno(c.id, t => { const u = t.hist.pop() ?? 0; return { ...t, usado: Math.max(0, t.usado - u) }; });
  if (acc === "mas5") return cambiarTurno(c.id, t => ({ ...t, extra: (Number(t.extra) || 0) + 5 }));
  if (acc === "reiniciar") return cambiarTurno(c.id, () => turnoVacio(combat.round, combat.turn));
}

/** Correr, Desengancharse o Esquivar desde la barra o el menú: marca la acción y pone su efecto. */
export async function accionEstandar(actor, cual, { adicional = false } = {}) {
  const combat = combateActivo(), c = combat?.combatants?.find?.(x => x.actor === actor || x.actorId === actor.id);
  const gasto = adicional ? "adicional" : "accion";
  const t = c ? (datosTurno(combat, c.id) ?? turnoVacio(combat.round, combat.turn)) : null;
  if (t?.[gasto]) { ui.notifications.warn(`${actor.name} ya gastó su ${ACCIONES_DND[gasto]} este turno.`); return false; }
  if (c) await cambiarTurno(c.id, x => ({ ...x, [gasto]: true, ...(cual === "correr" ? { extra: (Number(x.extra) || 0) + velocidadDe(actor) } : {}) }));
  if (cual === "desenganche") await actor.toggleStatusEffect?.(DESENGANCHE, { active: true });
  if (cual === "esquivar") { try { await actor.toggleStatusEffect?.("dodging", { active: true }); } catch { /* sin ese estado */ } }
  const txt = { correr: `corre: suma ${velocidadDe(actor)} ft de movimiento este turno`, desenganche: "se desengancha: este turno su movimiento no provoca ataques de oportunidad",
    esquivar: "esquiva: hasta su próximo turno los ataques contra él tienen desventaja y tiene ventaja en salvaciones de DES" }[cual];
  await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), content: `<p class="ecos-accion-estandar"><b>${esc(actor.name)}</b> ${txt} (${ACCIONES_DND[gasto]}).</p>`, flags: { [MOD]: { accionEstandar: cual } } });
  return true;
}

/* ---------- Antes de mover: ataques de oportunidad y movimiento que no alcanza ---------- */
const rectDe = (doc, pos = {}) => {
  const g = canvas?.grid?.size ?? 100;
  return { x: pos.x ?? doc.x, y: pos.y ?? doc.y, w: (doc.width ?? 1) * g, h: (doc.height ?? 1) * g };
};
function enemigosDe(doc) {
  const yo = doc.disposition ?? 0, combat = combateActivo();
  return (canvas?.tokens?.placeables ?? []).filter(t => t.document !== doc && t.actor && !t.document.hidden && (t.document.disposition ?? 0) * yo < 0
    && !t.actor.statuses?.has?.("dead") && !t.actor.statuses?.has?.("incapacitated") && !t.actor.statuses?.has?.("unconscious"))
    .map(t => {
      const cid = combatienteDe(combat, t.document)?.id;
      const tt = cid ? datosTurno(combat, cid) : null;
      return { id: t.id, nombre: t.document.name, rect: rectDe(t.document), alcance: Number(t.actor.getFlag?.(MOD, "alcance")) || 5, reaccionLibre: !tt?.reaccion };
    });
}
function puedeDesengancheAdicional(actor) { return (actor?.items ?? []).some(i => DESENGANCHE_ADICIONAL.test(i.name ?? "")); }

async function preguntarMovimiento(doc, destino, { oportunidad = [], falta = 0, queda = 0, costo = 0 }) {
  const actor = doc.actor, { DialogV2 } = foundry.applications.api;
  const lineas = [];
  if (oportunidad.length) lineas.push(`<p>⚠ Si te alejas, <b>${oportunidad.map(e => esc(e.nombre)).join(", ")}</b> ${oportunidad.length > 1 ? "pueden" : "puede"} hacerte un <b>ataque de oportunidad</b> (usa su reacción y te ataca una vez antes de que salgas).</p>`);
  if (falta > 0) lineas.push(`<p>⚠ Este movimiento cuesta <b>${costo} ft</b> y te quedan <b>${queda} ft</b>.</p>`);
  const botones = [];
  if (oportunidad.length) {
    botones.push({ action: "desenganche", label: "Desengancharme (Acción)", icon: "fa-solid fa-person-running" });
    if (puedeDesengancheAdicional(actor)) botones.push({ action: "desengancheAd", label: "Desengancharme (Adicional)", icon: "fa-solid fa-wind" });
  }
  if (falta > 0) botones.push({ action: "correr", label: "Correr (Acción) y moverme", icon: "fa-solid fa-person-running" });
  botones.push({ action: "igual", label: oportunidad.length ? "Moverme igual" : "Moverme igual (el DM decide)", icon: "fa-solid fa-shoe-prints" });
  botones.push({ action: "no", label: "No me muevo", icon: "fa-solid fa-xmark", default: true });
  const r = await DialogV2.wait({ window: { title: `Antes de mover · ${doc.name}`, icon: "fa-solid fa-triangle-exclamation" }, position: { width: 460 },
    content: `<div class="ecos-dialogo ecos-antes-mover">${lineas.join("")}<details><summary>¿Qué es cada opción?</summary><ul><li><b>Desengancharte</b>: gastas tu acción (o tu adicional si tu clase puede) y este turno nadie te ataca por alejarte.</li><li><b>Correr</b>: gastas tu acción y sumas tu velocidad otra vez.</li><li><b>Moverte igual</b>: te mueves y los enemigos pueden usar su reacción contra ti.</li></ul></details></div>`,
    buttons: botones, rejectClose: false });
  if (!r || r === "no") return false;
  if (r === "desenganche") await accionEstandar(actor, "desenganche");
  if (r === "desengancheAd") await accionEstandar(actor, "desenganche", { adicional: true });
  if (r === "correr") await accionEstandar(actor, "correr");
  if (r === "igual" && oportunidad.length) await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }),
    content: `<p class="ecos-oportunidad">⚔ <b>${esc(doc.name)}</b> se aleja de ${oportunidad.map(e => `<b>${esc(e.nombre)}</b>`).join(", ")}: ${oportunidad.length > 1 ? "pueden" : "puede"} hacerle un <b>ataque de oportunidad</b> con su reacción.</p>` });
  await doc.update({ x: destino.x, y: destino.y }, { ecosMovOk: true });
  return true;
}
/** Decide si hay que preguntar. Devuelve false para frenar el movimiento mientras se pregunta. */
function revisarMovimiento(doc, destino, opciones = {}) {
  if (opciones?.ecosMovOk || !leer("avisosMovimiento", true)) return;
  const combat = combateActivo(), actor = doc?.actor;
  if (!combat || !actor || !destino || (destino.x === undefined && destino.y === undefined)) return;
  if (!(actor.isOwner) || (game.user.isGM && !leer("avisosMovimientoDM", false) && !actor.hasPlayerOwner)) return;
  const antes = rectDe(doc), despues = rectDe(doc, destino);
  if (antes.x === despues.x && antes.y === despues.y) return;
  const desenganchado = actor.statuses?.has?.(DESENGANCHE);
  const g = { gridPx: canvas.grid.size, gridPies: canvas.scene?.grid?.distance ?? 5 };
  const oportunidad = desenganchado ? [] : provocaOportunidad(antes, despues, enemigosDe(doc), g);
  const c = combatienteDe(combat, doc);
  let falta = 0, queda = 0, costo = 0;
  if (c && combat.combatant?.id === c.id) {
    const t = datosTurno(combat, c.id) ?? turnoVacio(combat.round, combat.turn);
    queda = movimientoRestante(t, velocidadDe(actor));
    const pies = Math.round(Math.max(Math.abs(despues.x - antes.x), Math.abs(despues.y - antes.y)) / g.gridPx) * g.gridPies;
    costo = costoTramo(pies, { derribado: derribado(actor) });
    falta = costo - queda;
  }
  if (!oportunidad.length && falta <= 0) return;
  preguntarMovimiento(doc, destino, { oportunidad, falta, queda, costo }).catch(err => console.error(`${MOD} | antes de mover`, err));
  return false;
}

/* ---------- Al mover: se descuenta ---------- */
const DESDE = new Map();
async function contarMovimiento(doc, pies) {
  const combat = combateActivo(), c = combatienteDe(combat, doc);
  if (!c || combat.combatant?.id !== c.id || !pies) return;
  const costo = costoTramo(pies, { derribado: derribado(doc.actor) });
  await cambiarTurno(c.id, t => ({ ...t, usado: (Number(t.usado) || 0) + costo, hist: [...(t.hist ?? []), costo].slice(-10) }));
}

/* ---------- Al empezar el turno ---------- */
async function inicioTurno(combat) {
  const c = combat.combatant, actor = c?.actor;
  if (!c || !actor) return;
  await combat.setFlag(MOD, "turnoDnD", { [c.id]: turnoVacio(combat.round, combat.turn) });
  for (const x of combat.combatants) if (x.actor?.statuses?.has?.(DESENGANCHE) && x.id !== c.id) await x.actor.toggleStatusEffect(DESENGANCHE, { active: false }).catch(() => null);
  if (actor.statuses?.has?.(DESENGANCHE)) await actor.toggleStatusEffect(DESENGANCHE, { active: false }).catch(() => null);
  if (actor.statuses?.has?.("dodging")) await actor.toggleStatusEffect("dodging", { active: false }).catch(() => null); // Esquivar dura hasta tu turno
  // 3.35: a 0 PG (Acechado) no se levanta: se arrastra; y no tiene reacción.
  if (actor.statuses?.has?.("acechado")) await combat.setFlag(MOD, "turnoDnD", { [c.id]: { ...turnoVacio(combat.round, combat.turn), reaccion: true } });
  else if (derribado(actor) && leer("preguntarLevantarse", true)) {
    const u = duenoDe(actor);
    if (u?.isSelf) preguntarLevantarse(actor, c.id).catch(err => console.error(`${MOD} | levantarse`, err));
    else if (u) game.socket.emit(`module.${MOD}`, { turno: "levantarse", para: u.id, actorUuid: actor.uuid, cid: c.id });
  }
}
async function preguntarLevantarse(actor, cid) {
  const mitad = Math.floor(velocidadDe(actor) / 2);
  const r = await foundry.applications.api.DialogV2.confirm({ window: { title: `${actor.name} está Derribado`, icon: "fa-solid fa-person-falling" },
    content: `<p><b>${esc(actor.name)}</b> empieza su turno en el suelo.</p><p>¿Te levantas? Cuesta <b>la mitad de tu movimiento (${mitad} ft)</b>. Si no, puedes arrastrarte, pero cada pie cuesta el doble, tus ataques tienen desventaja y los de cerca contra ti, ventaja.</p>`,
    yes: { label: "Me levanto", icon: "fa-solid fa-person" }, no: { label: "Me quedo en el suelo" }, rejectClose: false });
  if (!r) return;
  await actor.toggleStatusEffect("prone", { active: false });
  await cambiarTurno(cid, t => ({ ...t, usado: (Number(t.usado) || 0) + mitad, hist: [...(t.hist ?? []), mitad], levantado: true }));
}

/* ---------- La iniciativa: ventaja, normal o desventaja ---------- */
async function preguntarIniciativa(combatant) {
  const actor = combatant?.actor;
  if (!actor) return;
  const r = await foundry.applications.api.DialogV2.wait({ window: { title: `Iniciativa · ${actor.name}`, icon: "fa-solid fa-dice-d20" },
    content: `<p>Empieza un combate. ¿Cómo tira <b>${esc(actor.name)}</b> su iniciativa?</p><p class="ecos-nota">Ventaja si algo te ayuda a reaccionar antes (un rasgo, el DM, haber visto venir el peligro). Desventaja si te sorprendieron o estás aturdido. Si no sabes, Normal.</p>`,
    buttons: [{ action: "ventaja", label: "Con ventaja", icon: "fa-solid fa-angles-up" }, { action: "normal", label: "Normal", default: true }, { action: "desventaja", label: "Con desventaja", icon: "fa-solid fa-angles-down" }],
    rejectClose: false });
  if (r && combatant.isOwner) await combatant.setFlag(MOD, "iniciativa", r);
}

/* ---------------- Ganchos ---------------- */
if (globalThis.Hooks) {
  Hooks.once("init", () => {
    const reg = (k, name, hint, def = true, scope = "world") => { try { game.settings.register(MOD, k, { name, hint, scope, config: true, type: Boolean, default: def, onChange: () => renderLuego() }); } catch { /* ya */ } };
    reg("trackerTurno", "Turno a la vista", "Bajo el carrusel de iniciativa: el movimiento que le queda a quien actúa y sus acciones de D&D y del Verbe. El DM devuelve movimiento.");
    reg("avisosMovimiento", "Avisos antes de mover", "Ataque de oportunidad al alejarte de un enemigo (con el menú para desengancharte) y aviso si el movimiento no te alcanza.");
    reg("avisosMovimientoDM", "Avisos antes de mover · también al DM", "Que los avisos salgan también cuando el DM mueve a sus PNJ.", false);
    reg("preguntarLevantarse", "Preguntar si se levanta", "Al empezar el turno Derribado, el dueño elige si se levanta (mitad del movimiento).");
    reg("iniciativaPregunta", "Preguntar ventaja en la iniciativa", "Al entrar a un combate, cada jugador elige si su iniciativa va con ventaja, normal o desventaja.");
  });
  Hooks.once("ready", () => {
    game.socket.on(`module.${MOD}`, async d => {
      if (!d?.turno) return;
      if (d.turno === "cambiar" && gmActivo() && game.combat?.id === d.combatId) await cambiarTurno(d.cid, d.cambio);
      if (d.turno === "levantarse" && d.para === game.user.id) { const a = await fromUuid(d.actorUuid); if (a) preguntarLevantarse(a, d.cid); }
      if (d.turno === "iniciativa" && d.para === game.user.id) { const c = game.combats.get(d.combatId)?.combatants.get(d.cid); if (c) preguntarIniciativa(c); }
    });
    renderLuego();
  });
  for (const h of ["updateCombat", "deleteCombat", "createCombat", "combatStart", "updateCombatant", "updateActor", "createActiveEffect", "deleteActiveEffect", "canvasReady", "renderCombatDock"]) Hooks.on(h, () => renderLuego());
  globalThis.window?.addEventListener?.("resize", () => renderLuego());
  Hooks.on("updateCombat", (combat, cambios) => {
    if (!gmActivo() || !combat.started || !("turn" in cambios || "round" in cambios)) return;
    inicioTurno(combat).catch(err => console.error(`${MOD} | inicio del turno`, err));
  });
  // Antes de mover (Foundry 13+: preMoveToken; si no, preUpdateToken con x/y).
  let hayPreMove = false;
  Hooks.on("preMoveToken", (doc, movement, operation) => {
    hayPreMove = true;
    const dest = movement?.destination ?? {};
    return revisarMovimiento(doc, dest, { ecosMovOk: operation?.ecosMovOk || movement?.updateOptions?.ecosMovOk });
  });
  Hooks.on("preUpdateToken", (doc, cambios, opciones) => {
    if (!("x" in cambios || "y" in cambios)) return;
    DESDE.set(doc.uuid, { x: doc.x, y: doc.y });
    if (hayPreMove) return;
    return revisarMovimiento(doc, { x: cambios.x ?? doc.x, y: cambios.y ?? doc.y }, opciones);
  });
  // Al mover: lo cuenta el DM activo.
  let hayMove = false;
  Hooks.on("moveToken", (doc, movement) => {
    hayMove = true;
    if (!gmActivo()) return;
    const pies = Number(movement?.passed?.distance ?? movement?.passed?.cost) || 0;
    contarMovimiento(doc, pies).catch(err => console.error(`${MOD} | movimiento`, err));
  });
  Hooks.on("updateToken", (doc, cambios) => {
    if (hayMove || !gmActivo() || !("x" in cambios || "y" in cambios)) return;
    const d = DESDE.get(doc.uuid); DESDE.delete(doc.uuid);
    if (!d) return;
    const g = canvas.grid.size, pies = Math.round(Math.max(Math.abs(doc.x - d.x), Math.abs(doc.y - d.y)) / g) * (canvas.scene?.grid?.distance ?? 5);
    contarMovimiento(doc, pies).catch(err => console.error(`${MOD} | movimiento`, err));
  });
  // Lo que se usa marca la acción de D&D (las técnicas del Verbe gastan su propia economía).
  Hooks.on("createChatMessage", msg => {
    if (!gmActivo()) return;
    const combat = combateActivo(), dact = msg.flags?.dnd5e?.activity;
    if (!combat || !dact?.uuid) return;
    let act = null; try { act = fromUuidSync(dact.uuid); } catch { act = null; }
    if (!act || act.item?.flags?.[MOD]?.verbe) return;
    const k = tipoActivacion(act.activation?.type ?? act.item?.system?.activation?.type);
    const c = combat.combatants.find(x => x.actor === act.actor || x.actorId === act.actor?.id);
    if (k && c) cambiarTurno(c.id, t => ({ ...t, [k]: true })).catch(() => null);
  });
  // Iniciativa: preguntar al jugador al entrar al combate y aplicarlo al tirar.
  Hooks.on("createCombatant", (combatant, opciones, userId) => {
    if (!gmActivo() || !leer("iniciativaPregunta", true)) return;
    const actor = combatant.actor, u = actor?.hasPlayerOwner ? duenoDe(actor) : null;
    if (!u || u.isGM) return;
    game.socket.emit(`module.${MOD}`, { turno: "iniciativa", para: u.id, combatId: combatant.parent?.id, cid: combatant.id });
  });
  Hooks.on("dnd5e.preConfigureInitiative", (actor, cfg) => {
    const c = game.combat?.combatants?.find?.(x => x.actor === actor || x.actorId === actor?.id);
    const m = c?.getFlag?.(MOD, "iniciativa");
    if (!m || !cfg?.options) return;
    cfg.options.advantage = m === "ventaja"; cfg.options.disadvantage = m === "desventaja";
  });
  // Tirada desde la hoja: la ventana de dnd5e (Normal / Ventaja / Desventaja) siempre sale.
  Hooks.on("dnd5e.preRollInitiativeDialogV2", (config, dialog) => { if (leer("iniciativaPregunta", true) && dialog) dialog.configure = true; });
}
