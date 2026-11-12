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
  if (!alc || alc === "yo") return 0;
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
async function avisarReacciones(atacante, blancos, arma) {
  const combat = game.combat, api = game.modules.get(MOD)?.api?.verbe;
  if (!combat?.started || !api || !blancos.length) return;
  const tokA = tokenDe(atacante), yaPreguntadas = new Set(Object.keys(api.datos?.()?.defensas ?? {}));
  const encendidas = [];
  for (const c of combat.combatants) {
    const actor = c.actor, tok = c.token?.object ?? tokenDe(actor);
    if (!actor || !tok || actor === atacante || c.defeated || !api.despierto?.(actor)) continue;
    if (!api.turnoVerbe?.(actor)?.reaccionLibre) continue;
    const esBlanco = blancos.some(b => b.actor === actor);
    const mismoBando = tokA && (tok.document.disposition ?? 0) === (tokA.document.disposition ?? 0);
    if (mismoBando && !esBlanco) continue;
    const tecnicas = tecnicasDe(actor);
    if (!tecnicas.length) continue;
    const distBlanco = Math.min(...blancos.map(b => distanciaCasillas(casillas(tok), casillas(b), pasos())));
    const distAtacante = tokA ? distanciaCasillas(casillas(tok), casillas(tokA), pasos()) : null;
    const lista = reaccionesEnAlcance({ tecnicas, esBlanco, distBlanco, distAtacante, yaPreguntadas });
    if (!lista.length) continue;
    const verbe = Number(api.estado?.(actor)?.valor) || 0;
    const filas = lista.map(r => `<li><b>${esc(r.n)}</b> · ${r.pies ? `alcance ${r.pies} ft, estás a ${r.dist} ft` : "sobre ti"}${Number.isFinite(r.costo) ? ` · ${r.costo} Verbe${r.costo > verbe ? " <i>(te pasarías a negativo: sobreesfuerzo)</i>" : ""}` : ""}
      <br><small>${esc(r.texto).slice(0, 220)}</small><br><button type="button" data-ecos-reaccion="${actor.uuid}|${r.itemId}"><i class="fa-solid fa-shield-halved"></i> Usar ${esc(r.n)}</button></li>`).join("");
    const duenos = game.users.filter(u => u.isGM || actor.testUserPermission(u, "OWNER")).map(u => u.id);
    await ChatMessage.create({ whisper: duenos, speaker: { alias: `Reacción Verbe · ${actor.name}` },
      content: `<div class="ecos-reaccion-aviso"><p>⚡ <b>${esc(atacante.name)}</b> ataca a <b>${blancos.map(b => esc(b.name)).join(", ")}</b>${arma ? ` con ${esc(arma)}` : ""}. <b>${esc(actor.name)}</b> puede reaccionar (reacción Verbe libre, Verbe ${verbe}):</p><ul>${filas}</ul><p><small>Solo es un aviso: no gasta nada hasta que la uses. Caduca en 30 s o al cambiar el turno.</small></p></div>`,
      flags: { [MOD]: { reaccionVerbe: { actor: actor.uuid, hasta: Date.now() + DURA_MS } } } });
    encendidas.push(c.id);
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
    game.socket.on(`module.${MOD}`, d => { if (d?.ecosReaccionAura && d.ecosReaccionAura.combat === game.combat?.id) encenderAuras(d.ecosReaccionAura.cids ?? [], Number(d.ecosReaccionAura.hasta) || 0); });
    const api = game.modules.get(MOD)?.api; if (api) api.reaccionesEnAlcance = reaccionesEnAlcance;
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
      await (act ? act.use() : item.use?.());
      setTimeout(pintarAuras, 300);
    });
  });
}
