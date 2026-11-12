/**
 * 3.45 · Panel de acciones a la izquierda (pedido del autor). Sigue a la ficha seleccionada (cambia al seleccionar
 * otro token) y muestra el mismo control del turno que la barra de iniciativa —Acción, Adicional, Reacción y movimiento
 * que queda— con las acciones estándar de D&D al lado. Se actualiza solo. Cada marca se quita con un clic (revertir) y
 * el DM puede marcar a mano. Se arrastra desde su cabecera y se pliega; recuerda dónde lo dejaste en este navegador.
 */
import { ACCIONES_BASICAS } from "./accion-estandar.js";
import { ayudar, esconderse } from "./ventaja-estados.js";
import { ACCIONES_DND, accionEstandar, cambiarTurno, combateActivo, datosTurno, turnoVacio, movimientoRestante } from "./turno-tracker.js";
const MOD = "ecos-frontera";
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const ICONO = { atacar: "fa-hand-fist", magia: "fa-wand-sparkles", correr: "fa-person-running", desenganche: "fa-person-walking-arrow-right", esquivar: "fa-shield-halved",
  ayudar: "fa-handshake-angle", esconderse: "fa-user-ninja", buscar: "fa-magnifying-glass", estudiar: "fa-book-open", influir: "fa-comments", objeto: "fa-flask", preparar: "fa-hourglass-half", oportunidad: "fa-bolt" };
const leerLS = (k, d) => { try { return JSON.parse(localStorage.getItem(`${MOD}.${k}`)) ?? d; } catch { return d; } };
const guardarLS = (k, v) => { try { localStorage.setItem(`${MOD}.${k}`, JSON.stringify(v)); } catch { /* sin almacenamiento */ } };
const velocidad = a => Number(a?.system?.attributes?.movement?.walk) || 30;

function actorActual() {
  const t = canvas?.tokens?.controlled?.[0];
  return t?.actor ?? game.user.character ?? null;
}
function html(actor) {
  if (!actor) return `<header data-arrastre><i class="fa-solid fa-person-rays"></i> Acciones <button type="button" data-plegar title="Plegar">–</button></header><p class="ecos-pa-vacio">Selecciona un token.</p>`;
  const combat = combateActivo(), c = combat?.combatants?.find?.(x => x.actor === actor || x.actorId === actor.id);
  const t = c ? (datosTurno(combat, c.id) ?? turnoVacio(combat.round, combat.turn)) : null;
  const pip = k => `<button type="button" class="ecos-pa-pip ${t?.[k] ? "gastada" : ""}" data-pip="${k}" ${c ? "" : "disabled"} title="${ACCIONES_DND[k]}${t?.[k] ? " (gastada: clic para devolverla)" : ""}">${ACCIONES_DND[k]}</button>`;
  const mov = t ? `${movimientoRestante(t, velocidad(actor))} / ${velocidad(actor) + (Number(t.extra) || 0)} ft` : `${velocidad(actor)} ft`;
  const plegado = leerLS("panelPlegado", false);
  return `<header data-arrastre><img src="${esc(actor.img)}" alt=""><b>${esc(actor.name)}</b><button type="button" data-plegar title="${plegado ? "Desplegar" : "Plegar"}">${plegado ? "+" : "–"}</button></header>
    ${plegado ? "" : `<div class="ecos-pa-turno">${["accion", "adicional", "reaccion"].map(pip).join("")}<span class="ecos-pa-mov" title="Movimiento que queda"><i class="fa-solid fa-shoe-prints"></i> ${mov}</span></div>
    ${c ? "" : `<p class="ecos-pa-nota">Fuera de combate: las acciones se cuentan solo en un combate.</p>`}
    <div class="ecos-pa-acciones">${ACCIONES_BASICAS.map(a => `<button type="button" data-accion="${a.id}" title="${esc(a.n)} · ${a.tipo === "reaction" ? "Reacción" : "Acción"}\n${esc(a.que)}"><i class="fa-solid ${ICONO[a.id] ?? "fa-circle"}"></i><span>${esc(a.n)}</span></button>`).join("")}</div>`}`;
}
let panel = null;
function pintar() {
  if (!game.settings.get(MOD, "panelAcciones")) { panel?.remove(); panel = null; return; }
  if (!panel) {
    panel = document.createElement("section"); panel.id = "ecos-panel-acciones"; document.body.appendChild(panel);
    const pos = leerLS("panelPos", null); if (pos) { panel.style.left = `${pos.x}px`; panel.style.top = `${pos.y}px`; }
    panel.addEventListener("click", alClic);
    panel.addEventListener("pointerdown", alArrastrar);
  }
  panel.innerHTML = html(actorActual());
}
async function alClic(ev) {
  const actor = actorActual(); if (!actor) return;
  const pl = ev.target.closest("[data-plegar]"); if (pl) { guardarLS("panelPlegado", !leerLS("panelPlegado", false)); return pintar(); }
  const p = ev.target.closest("[data-pip]");
  if (p) { const combat = combateActivo(), c = combat?.combatants?.find?.(x => x.actor === actor || x.actorId === actor.id); if (c) await cambiarTurno(c.id, { op: "alternar", clave: p.dataset.pip }); return; }
  const b = ev.target.closest("[data-accion]"); if (!b) return;
  const a = ACCIONES_BASICAS.find(x => x.id === b.dataset.accion);
  if (!a) return;
  if (["atacar", "magia", "objeto"].includes(a.id)) return game.modules.get(MOD)?.api?.accionEstandar?.(actor) ?? ui.notifications.info("Usa el arma, el conjuro o el objeto desde la hoja.");
  if (a.auto) return accionEstandar(actor, a.auto, { adicional: ev.shiftKey });
  // 3.46: Ayudar pone «Ayudado» en el aliado marcado; Esconderse tira Sigilo y deja Escondido si llega a 15.
  if (a.id === "ayudar") return ayudar(actor, { gastar: true });
  if (a.id === "esconderse") return esconderse(actor, { gastar: true });
  // El resto: gasta la acción (o la reacción) y lo anuncia; la prueba la pide el DM.
  const combat = combateActivo(), c = combat?.combatants?.find?.(x => x.actor === actor || x.actorId === actor.id), clave = a.tipo === "reaction" ? "reaccion" : (ev.shiftKey ? "adicional" : "accion");
  const t = c ? (datosTurno(combat, c.id) ?? turnoVacio()) : null;
  if (t?.[clave]) return ui.notifications.warn(`${actor.name} ya gastó su ${ACCIONES_DND[clave]}.`);
  if (c) await cambiarTurno(c.id, { op: "gastar", clave });
  await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), content: `<p class="ecos-accion-estandar"><b>${esc(actor.name)}</b> usa <b>${esc(a.n)}</b> (${ACCIONES_DND[clave]}): ${esc(a.que)}</p>` });
}
function alArrastrar(ev) {
  if (!ev.target.closest("[data-arrastre]") || ev.target.closest("button")) return;
  const r = panel.getBoundingClientRect(), dx = ev.clientX - r.left, dy = ev.clientY - r.top;
  const mover = e => { panel.style.left = `${Math.max(0, e.clientX - dx)}px`; panel.style.top = `${Math.max(0, e.clientY - dy)}px`; };
  const soltar = () => { window.removeEventListener("pointermove", mover); window.removeEventListener("pointerup", soltar); const q = panel.getBoundingClientRect(); guardarLS("panelPos", { x: q.left, y: q.top }); };
  window.addEventListener("pointermove", mover); window.addEventListener("pointerup", soltar);
}
const repintar = globalThis.foundry?.utils?.debounce ? globalThis.foundry.utils.debounce(pintar, 80) : pintar;
if (globalThis.Hooks) {
  Hooks.once("init", () => game.settings.register(MOD, "panelAcciones", { name: "Panel de acciones a la izquierda", hint: "Muestra el turno (Acción, Adicional, Reacción y movimiento) y las acciones estándar de la ficha seleccionada; se arrastra desde su cabecera.", scope: "client", config: true, type: Boolean, default: true, onChange: () => pintar() }));
  Hooks.once("ready", () => {
    pintar();
    // 3.46: el botón «Acciones disponibles» de la barra izquierda lo muestra u oculta (y lo despliega si estaba plegado).
    const api = game.modules.get(MOD)?.api;
    if (api) api.panelAcciones = { alternar: async () => {
      const ver = !game.settings.get(MOD, "panelAcciones");
      if (ver) guardarLS("panelPlegado", false);
      await game.settings.set(MOD, "panelAcciones", ver);
    }, pintar };
  });
  for (const h of ["controlToken", "updateCombat", "updateCombatant", "deleteCombat", "createCombat", "updateActor", "canvasReady"]) Hooks.on(h, () => repintar());
}
