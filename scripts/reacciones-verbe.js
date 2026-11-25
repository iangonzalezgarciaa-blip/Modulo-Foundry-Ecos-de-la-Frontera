/**
 * 3.46 · Reacciones del Verbe a la vista (pedido del autor, 12-nov-2026). Cuando alguien ataca en combate, el módulo calcula
 * quién puede reaccionar con una técnica de reacción del Verbe y si está a su alcance:
 *  - Las de alcance «sobre ti» solo le sirven al atacado (las defensas que ya pregunta el Verbe no se repiten aquí).
 *  - Las de alcance (9 m, 18 m…) sirven si quien reacciona está a ese alcance del atacado o del atacante.
 *  - Quien reacciona debe tener el Verbe despierto y la reacción Verbe libre, y no ser del bando del atacante (salvo el atacado).
 * A cada uno le llega un mensaje (a su jugador, o al DM si es un PNJ) con sus reacciones, la distancia y el costo, y un botón
 * para usarla; su retrato del carrusel de iniciativa brilla mientras puede (30 s, o hasta que la gaste o cambie el turno).
 * Solo avisa: no gasta nada. Ajuste «reaccionesVerbeAviso» para apagarlo.
 */
import { distanciaCasillas } from "./ventaja-estados.js";
const MOD = "ecos-frontera";
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const DURA_MS = 30000;

/** «18 m» → 60 ft; «yo» → 0; desconocido → null. 1,5 m = 5 ft. Puro. */
export function alcancePies(alc) {
  if (!alc || /^(yo|tú|sobre ti|propio)$/i.test(String(alc).trim())) return 0;
  // 3.77 (prueba con jugadores conectados): el catálogo ya da los alcances en pies («60 ft»); solo se leían metros y
  // ninguna reacción de alcance avisaba.
  const ft = String(alc).match(/([\d]+(?:[.,]\d+)?)\s*(?:ft|pies?)\b/i);
  if (ft) return Math.round(Number(ft[1].replace(",", ".")));
  const m = String(alc).match(/([\d]+(?:[.,]\d+)?)\s*m\b/);
  return m ? Math.round(Number(m[1].replace(",", ".")) * 5 / 1.5) : null;
}
/**
 * Qué reacciones puede usar alguien ante un ataque. Puro.
 * @param {object} o
 * @param {{id:string,n:string,t:string,alc:string,costo?:number}[]} o.tecnicas  técnicas que conoce (del catálogo)
 * @param {boolean} o.esBlanco      es el atacado
 * @param {number|null} o.distBlanco  pies hasta el atacado
 * @param {number|null} o.distAtacante pies hasta el atacante
 * @param {Set<string>} [o.yaPreguntadas] defensas que el Verbe ya le pregunta al atacado
 */
export function reaccionesEnAlcance({ tecnicas = [], esBlanco = false, distBlanco = null, distAtacante = null, yaPreguntadas = new Set() } = {}) {
  const out = [];
  for (const t of tecnicas) {
    if (t?.t !== "R") continue;
    const pies = alcancePies(t.alc);
    if (pies === 0) { if (esBlanco && !yaPreguntadas.has(t.id)) out.push({ ...t, pies: 0, dist: 0 }); continue; }
    if (pies == null) continue;
    const ds = [distBlanco, distAtacante].filter(d => Number.isFinite(d));
    if (!ds.length) continue;
    const d = Math.min(...ds);
    if (d <= pies) out.push({ ...t, pies, dist: d });
  }
  return out;
}

/* ---------------- Foundry ---------------- */
const activo = () => { try { return game.settings.get(MOD, "reaccionesVerbeAviso") !== false; } catch { return true; } };
const casillas = t => { const g = canvas?.grid?.size || 100, d = t.document; return { x: Math.round(d.x / g), y: Math.round(d.y / g), w: d.width || 1, h: d.height || 1 }; };
const pasos = () => Number(canvas?.scene?.grid?.distance) || 5;
const tokenDe = actor => actor?.getActiveTokens?.()[0] ?? null;
const AURAS = new Map(); // combatantId → hasta (ms)
let reloj = null;

function pintarAuras() {
  const ahora = Date.now(), combat = game.combat;
  for (const [cid, hasta] of AURAS) {
    const c = combat?.combatants?.get(cid);
    const vale = hasta > ahora && c && !c.defeated && (game.modules.get(MOD)?.api?.verbe?.turnoVerbe?.(c.actor)?.reaccionLibre ?? true);
    if (!vale) AURAS.delete(cid);
  }
  for (const el of document.querySelectorAll(".ecos-puede-reaccionar")) if (!AURAS.has(el.dataset.combatantId)) { el.classList.remove("ecos-puede-reaccionar"); el.removeAttribute("data-ecos-reaccion-tip"); }
  for (const cid of AURAS.keys()) for (const el of document.querySelectorAll(`#combat-dock [data-combatant-id="${cid}"], #combat [data-combatant-id="${cid}"]`)) {
    el.classList.add("ecos-puede-reaccionar");
    el.dataset.tooltip = "Puede usar una reacción del Verbe ahora (mira su mensaje en el chat)";
  }
  if (!AURAS.size && reloj) { clearInterval(reloj); reloj = null; }
}
function encenderAuras(cids, hasta) {
  const combat = game.combat;
  for (const cid of cids) {
    const c = combat?.combatants?.get(cid);
    if (!c || !(game.user.isGM || c.actor?.isOwner)) continue; // solo lo ve su dueño y el DM
    AURAS.set(cid, hasta);
  }
  pintarAuras();
  if (AURAS.size && !reloj) reloj = setInterval(pintarAuras, 1000);
}
function tecnicasDe(actor) {
  const api = game.modules.get(MOD)?.api?.verbe;
  const vistas = new Set(), out = [];
  for (const item of actor.items ?? []) {
    const meta = item.getFlag?.(MOD, "verbe");
    if (!meta?.id || vistas.has(meta.id)) continue;
    vistas.add(meta.id);
    const t = api?.tecnica?.(meta.id);
    if (!t || t.t !== "R") continue;
    let costo = null;
    try { costo = api.costoUso(actor, meta, Number(meta.g) || 0); } catch { costo = null; }
    out.push({ id: meta.id, n: item.name, t: t.t, alc: t.alc, texto: t.e ?? t.texto ?? "", itemId: item.id, costo });
  }
  return out;
}
/** Reacciones nativas de D&D5e (actividades originales, sin duplicar sus reglas). */
export function reaccionesDndDe(actor) {
  const out = [];
  for (const item of actor?.items ?? []) {
    for (const act of item.system?.activities?.values?.() ?? Object.values(item.system?.activities ?? {})) {
      if (act.activation?.type !== "reaction" || act.canUse === false || act.isHidden) continue;
      const condicion = act.activation?.condition || act.description?.chatFlavor || item.system?.description?.value || "";
      out.push({ id: `${item.id}.${act.id}`, itemId: item.id, activityId: act.id, n: item.system?.activities?.size > 1 ? `${item.name}: ${act.name || act.type}` : item.name,
        texto: String(condicion).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 260), tipo: "dnd", actividad: act });
    }
  }
  return out;
}
const POPUPS = new Set();
const REACCIONES_EN_COLA = new Map();

const tokenPorUuid = async uuid => { try { const d = await fromUuid(uuid); return d?.object ?? d ?? null; } catch { return null; } };
function usuarioPuedeElegir(actor) {
  if (!actor?.hasPlayerOwner) return game.user.isGM;
  const activo = actor.activeOwner;
  return game.user.isGM ? !activo : (activo ? activo.id === game.user.id : actor.isOwner);
}
/** Ataques de oportunidad desde el mismo selector, usando el ataque cuerpo a cuerpo original de D&D. */
export function pedirAtaqueOportunidad(combatantIds = [], objetivoUuid) {
  if (!objetivoUuid || !combatantIds.length) return;
  game.socket.emit(`module.${MOD}`, { ecosOportunidad: { combatantIds, objetivoUuid } });
}
async function ejecutarOportunidad(datos) {
  const combat = game.combat;
  const objetivo = await fromUuid(datos.objetivoUuid);
  const objetivoActor = objetivo?.actor ?? objetivo?.parent?.actor;
  if (!combat || !objetivoActor) return;
  const candidatos = (datos.combatantIds ?? []).map(id => combat.combatants.find(c => c.tokenId === id || c.token?.id === id)).filter(Boolean);
  for (const c of candidatos) {
    const actor = c.actor;
    if (!actor || !usuarioPuedeElegir(actor)) continue;
    const { datosTurno, turnoVacio } = await import("./turno-tracker.js");
    if ((datosTurno(combat, c.id) ?? turnoVacio()).reaccion) continue;
    const armas = [];
    for (const item of actor.items ?? []) for (const act of item.system?.activities?.values?.() ?? Object.values(item.system?.activities ?? {})) {
      if (act.activation?.type !== "action" || act.type !== "attack" || act.attack?.type?.value !== "melee" || act.canUse === false) continue;
      armas.push({ itemId: item.id, activityId: act.id, n: `${item.name}: ${act.name || "Ataque"}`, tipo: "dnd", texto: "Ataque de oportunidad: ataque cuerpo a cuerpo al salir del alcance." });
    }
    if (!armas.length) continue;
    const DialogV2 = foundry.applications.api.DialogV2;
    const botones = armas.map((a, i) => ({ action: `a${i}`, label: a.n, callback: () => i }));
    botones.push({ action: "pasar", label: "No atacar" });
    const elegido = await DialogV2.wait({ window: { title: `Ataque de oportunidad · ${actor.name}`, icon: "fa-solid fa-hand-fist" },
      content: `<p><b>${esc(objetivoActor.name)}</b> sale de tu alcance. Elige el ataque cuerpo a cuerpo que harás con tu reacción.</p>`,
      buttons: botones, rejectClose: false });
    if (!Number.isInteger(elegido) || !armas[elegido]) continue;
    const anterior = new Set(game.user.targets ?? []);
    try {
      const token = objetivo.object ?? objetivo;
      if (token?.document) { game.user.updateTokenTargets([token.id]); }
      const item = actor.items.get(armas[elegido].itemId), act = item?.system?.activities?.get?.(armas[elegido].activityId);
      if (act) {
        const { cambiarTurno } = await import("./turno-tracker.js");
        const resultado = await act.use({ consume: { action: false } }, { configure: true }, { data: { flags: { [MOD]: { ataqueOportunidad: true } } } });
        if (resultado) await cambiarTurno(c.id, { op: "gastar", clave: "reaccion" });
      }
    } finally {
      game.user.updateTokenTargets([...anterior].map(t => t.id));
    }
  }
}
async function ejecutarReaccion(actor, opcion) {
  if (!actor?.isOwner) return ui.notifications.warn("No tienes permiso para usar esta reacción.");
  if (opcion.tipo === "dnd") {
    const actividad = actor.items.get(opcion.itemId)?.system?.activities?.get?.(opcion.activityId);
    if (!actividad || actividad.canUse === false) return ui.notifications.warn("Esa reacción ya no está disponible.");
    return actividad.use({}, { configure: true });
  }
  const item = actor.items.get(opcion.itemId);
  const actividad = item?.system?.activities?.contents?.[0];
  if (!item || !actividad) return ui.notifications.warn("La técnica ya no está disponible.");
  return actividad.use({}, { configure: true });
}
async function mostrarPopupReaccion(datos) {
  const actor = await fromUuid(datos.actorUuid);
  if (!actor || !usuarioPuedeElegir(actor)) return;
  const combat = game.combat;
  const combatant = combat?.combatants?.find(c => c.actor === actor || c.actorId === actor.id);
  if (!combatant || combatant.defeated) return;
  const api = game.modules.get(MOD)?.api?.verbe;
  const turno = game.modules.get(MOD)?.api?.turnoVerbe?.(actor) ?? api?.turnoVerbe?.(actor);
  const { datosTurno, turnoVacio } = await import("./turno-tracker.js");
  const economía = datosTurno(combat, combatant.id) ?? turnoVacio();
  if (economía.reaccion) return;
  const targets = await Promise.all((datos.targets ?? []).map(tokenPorUuid));
  const validoTargets = targets.filter(t => t?.actor);
  const tokenActor = combatant.token?.object ?? tokenDe(actor);
  const tokenAtacante = await tokenPorUuid(datos.attackerTokenUuid);
  const distBlanco = tokenActor && validoTargets.length ? Math.min(...validoTargets.map(t => distanciaCasillas(casillas(tokenActor), casillas(t), pasos()))) : null;
  const distAtacante = tokenActor && tokenAtacante?.document ? distanciaCasillas(casillas(tokenActor), casillas(tokenAtacante), pasos()) : null;
  const esBlanco = validoTargets.some(t => t.actor === actor);
  const dnd = reaccionesDndDe(actor);
  const verbe = api?.despierto?.(actor) && (turno?.reaccionLibre ?? true) ? tecnicasDe(actor) : [];
  const verbeEnRango = reaccionesEnAlcance({ tecnicas: verbe, esBlanco, distBlanco, distAtacante,
    yaPreguntadas: new Set(Object.keys(api?.datos?.()?.defensas ?? {})) });
  const opciones = [
    ...dnd,
    ...verbeEnRango.map(v => ({ ...v, tipo: "verbe" }))
  ];
  if (!opciones.length) return;
  if (POPUPS.has(actor.uuid)) return;
  POPUPS.add(actor.uuid);
  try {
    const DialogV2 = foundry.applications.api.DialogV2;
    const filas = opciones.map((o, i) => `<li><b>${esc(o.n)}</b> <small>${o.tipo === "dnd" ? "D&D 5e" : "Verbe"}${o.alc ? ` · alcance ${esc(o.alc)}` : ""}${Number.isFinite(o.costo) ? ` · ${o.costo} Verbe` : ""}</small>${o.texto ? `<p>${esc(o.texto)}</p>` : ""}</li>`).join("");
    const botones = opciones.map((o, i) => ({ action: `r${i}`, label: `Usar: ${o.n}`, icon: o.tipo === "dnd" ? "fa-solid fa-shield-halved" : "fa-solid fa-bolt",
      callback: async () => i }));
    botones.push({ action: "pasar", label: "No reaccionar", icon: "fa-solid fa-xmark" });
    const seleccion = await DialogV2.wait({ window: { title: `Reacción disponible · ${actor.name}`, icon: "fa-solid fa-shield-halved" }, position: { width: 520 },
      content: `<div class="ecos-dialogo ecos-reacciones-popup"><p><b>${esc(datos.attackerName ?? "Un enemigo")}</b> ${esc(datos.weapon ? `ataca con ${datos.weapon}` : "realiza un ataque")} a ${esc((datos.targetNames ?? []).join(", ") || "un aliado")}. Elige una opción solo si se cumple su condición.</p><ol>${filas}</ol><p><small>Las reacciones de D&D conservan sus propias reglas, recursos, alcance y ventanas de configuración. Las del Verbe conservan su coste.</small></p></div>`,
      buttons: botones, rejectClose: false });
    if (Number.isInteger(seleccion) && opciones[seleccion]) await ejecutarReaccion(actor, opciones[seleccion]);
  } finally { POPUPS.delete(actor.uuid); }
}
function solicitarPopup(actor, datos) {
  if (!actor) return;
  game.socket.emit(`module.${MOD}`, { ecosReaccionPopup: { ...datos, actorUuid: actor.uuid } });
}
async function avisarReacciones(atacante, blancos, arma) {
  const combat = game.combat;
  if (!combat?.started || !blancos.length) return;
  const tokA = tokenDe(atacante), encendidas = [], candidatos = new Map();
  for (const c of combat.combatants) {
    const actor = c.actor, tok = c.token?.object ?? tokenDe(actor);
    if (!actor || !tok || actor === atacante || c.defeated) continue;
    const esBlanco = blancos.some(b => b.actor === actor);
    const mismoBando = tokA && (tok.document.disposition ?? 0) === (tokA.document.disposition ?? 0);
    if (mismoBando && !esBlanco) continue;
    const distBlanco = Math.min(...blancos.map(b => distanciaCasillas(casillas(tok), casillas(b), pasos())));
    const distAtacante = tokA ? distanciaCasillas(casillas(tok), casillas(tokA), pasos()) : null;
    if (!esBlanco && distBlanco > 5) continue; // protección/interposición: aliado a 5 ft del blanco, no a cualquier distancia
    const nativas = reaccionesDndDe(actor);
    const verbe = game.modules.get(MOD)?.api?.verbe;
    const tecnicas = verbe?.despierto?.(actor) && verbe?.turnoVerbe?.(actor)?.reaccionLibre ? tecnicasDe(actor) : [];
    const rVerbe = reaccionesEnAlcance({ tecnicas, esBlanco, distBlanco, distAtacante,
      yaPreguntadas: new Set(Object.keys(verbe?.datos?.()?.defensas ?? {})) });
    if (!nativas.length && !rVerbe.length) continue;
    candidatos.set(actor.uuid, { actor, c, nativas, rVerbe });
    encendidas.push(c.id);
  }
  for (const { actor } of candidatos.values()) {
    const data = { attackerName: atacante.name, weapon: arma ?? "", targetNames: blancos.map(b => b.name),
      targets: blancos.map(b => b.document.uuid), attackerTokenUuid: tokA?.document?.uuid };
    solicitarPopup(actor, data);
  }
  if (encendidas.length) {
    const hasta = Date.now() + DURA_MS;
    encenderAuras(encendidas, hasta);
    game.socket.emit(`module.${MOD}`, { ecosReaccionAura: { cids: encendidas, hasta, combat: combat.id } });
  }
}

if (globalThis.Hooks) {
  Hooks.once("init", () => game.settings.register(MOD, "reaccionesVerbeAviso", { name: "Avisar reacciones del Verbe en alcance", scope: "world", config: true, type: Boolean, default: true,
    hint: "En combate, cuando alguien ataca, avisa a quien puede reaccionar con una técnica del Verbe a su alcance (con la distancia y el costo) y hace brillar su retrato en el carrusel." }));
  Hooks.once("ready", () => {
    game.socket.on(`module.${MOD}`, d => {
      if (d?.ecosReaccionAura && d.ecosReaccionAura.combat === game.combat?.id) encenderAuras(d.ecosReaccionAura.cids ?? [], Number(d.ecosReaccionAura.hasta) || 0);
      if (d?.ecosReaccionPopup?.actorUuid) mostrarPopupReaccion(d.ecosReaccionPopup).catch(err => console.error(`${MOD} | popup reacción`, err));
      if (d?.ecosOportunidad) ejecutarOportunidad(d.ecosOportunidad).catch(err => console.error(`${MOD} | oportunidad`, err));
    });
    const api = game.modules.get(MOD)?.api; if (api) {
      api.reaccionesEnAlcance = reaccionesEnAlcance;
      api.reaccionesDndDe = reaccionesDndDe;
      api.pedirAtaqueOportunidad = pedirAtaqueOportunidad;
    }
  });
  Hooks.on("dnd5e.rollAttackV2", (rolls, datos) => {
    if (!activo()) return;
    const act = datos?.subject, atacante = act?.actor;
    if (!atacante || !(atacante.isOwner) || (game.user.isGM && atacante.hasPlayerOwner && atacante.activeOwner && !atacante.activeOwner.isSelf)) return;
    const blancos = [...(game.user.targets ?? [])].filter(t => t.actor && t.actor !== atacante);
    avisarReacciones(atacante, blancos, act?.item?.name).catch(err => console.error(`${MOD} | reacciones`, err));
  });
  for (const h of ["renderCombatDock", "renderCombatTracker", "updateCombat"]) Hooks.on(h, (app, _x, _y) => {
    if (h === "updateCombat") { const cambios = _x; if (cambios && ("turn" in cambios || "round" in cambios)) AURAS.clear(); }
    setTimeout(pintarAuras, 50);
  });
  Hooks.on("renderChatMessageHTML", (msg, html) => {
    const raiz = html instanceof HTMLElement ? html : html?.[0];
    for (const b of raiz?.querySelectorAll?.("button[data-ecos-reaccion]") ?? []) b.addEventListener("click", async ev => {
      ev.preventDefault();
      const [uuid, itemId] = b.dataset.ecosReaccion.split("|");
      const hasta = msg.getFlag(MOD, "reaccionVerbe")?.hasta ?? 0;
      if (Date.now() > hasta) return ui.notifications.warn("Ese momento ya pasó: la reacción caducó.");
      const actor = await fromUuid(uuid), item = actor?.items?.get(itemId);
      if (!item?.isOwner) return ui.notifications.warn("Solo su dueño o el DM la puede usar.");
      const act = item.system?.activities?.contents?.[0];
      await (act ? act.use({}, { configure: true }) : item.use?.());
      setTimeout(pintarAuras, 300);
    });
  });
}
