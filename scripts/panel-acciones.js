/**
 * 3.45 · Panel de acciones a la izquierda (pedido del autor). Sigue a la ficha seleccionada (cambia al seleccionar
 * otro token) y muestra el mismo control del turno que la barra de iniciativa —Acción, Adicional, Reacción y movimiento
 * que queda— con las acciones estándar de D&D al lado. Se actualiza solo. Cada marca se quita con un clic (revertir) y
 * el DM puede marcar a mano. Se arrastra desde su cabecera y se pliega; recuerda dónde lo dejaste en este navegador.
 */
import { htmlAcciones, clicAcciones, filtroGuardado } from "./accion-estandar.js";
import { saltar, dispararPreparada, ponerActitud, actitudDe, alternarInspiracion, NOMBRE_ACTITUD } from "./reglas-dnd.js";
import { ACCIONES_DND, cambiarTurno, combateActivo, datosTurno, turnoVacio, movimientoRestante } from "./turno-tracker.js";
const MOD = "ecos-frontera";
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const ICONO = { atacar: "fa-hand-fist", magia: "fa-wand-sparkles", correr: "fa-person-running", desenganche: "fa-person-walking-arrow-right", esquivar: "fa-shield-halved",
  saltar: "fa-person-running", ayudar: "fa-handshake-angle", esconderse: "fa-user-ninja", buscar: "fa-magnifying-glass", estudiar: "fa-book-open", influir: "fa-comments", objeto: "fa-flask", preparar: "fa-hourglass-half", oportunidad: "fa-bolt" };
const leerLS = (k, d) => { try { return JSON.parse(localStorage.getItem(`${MOD}.${k}`)) ?? d; } catch { return d; } };
const guardarLS = (k, v) => { try { localStorage.setItem(`${MOD}.${k}`, JSON.stringify(v)); } catch { /* sin almacenamiento */ } };
const velocidad = a => Number(a?.system?.attributes?.movement?.walk) || 30;

function tokenActual() { return canvas?.tokens?.controlled?.[0] ?? null; }
function actorActual() {
  const t = tokenActual();
  return t?.actor ?? game.user.character ?? null;
}
function html(actor) {
  if (!actor) return `<header data-arrastre><i class="fa-solid fa-person-rays"></i> Acciones <button type="button" data-plegar title="Plegar">–</button></header><p class="ecos-pa-vacio">Selecciona un token.</p>`;
  const combat = combateActivo(), c = combat?.combatants?.find?.(x => x.actor === actor || x.actorId === actor.id);
  const t = c ? (datosTurno(combat, c.id) ?? turnoVacio(combat.round, combat.turn)) : null;
  const pip = k => `<button type="button" class="ecos-pa-pip ${t?.[k] ? "gastada" : ""}" data-pip="${k}" ${c ? "" : "disabled"} title="${ACCIONES_DND[k]}${t?.[k] ? " (gastada: clic para devolverla)" : ""}">${ACCIONES_DND[k]}</button>`;
  const mov = t ? `${movimientoRestante(t, velocidad(actor))} / ${velocidad(actor) + (Number(t.extra) || 0)} ft` : `${velocidad(actor)} ft`;
  const plegado = leerLS("panelPlegado", false);
  return `<header data-arrastre><img src="${esc(actor.img)}" alt=""><b>${esc(actor.name)}</b>${actor.isOwner ? `<button type="button" data-festejo title="Tu frase del 20 y del 1 natural (festejo a pantalla completa)"><i class="fa-solid fa-star"></i></button>` : ""}<button type="button" data-plegar title="${plegado ? "Desplegar" : "Plegar"}">${plegado ? "+" : "–"}</button></header>
    ${plegado ? "" : `<div class="ecos-pa-turno">${["accion", "adicional", "reaccion", "interaccion"].map(pip).join("")}<span class="ecos-pa-mov" title="Movimiento que queda"><i class="fa-solid fa-shoe-prints"></i> ${mov}</span></div>
    ${t?.preparada ? `<div class="ecos-pa-preparada">⏳ <b>${esc(t.preparada.que)}</b>${t.preparada.cuando ? ` cuando ${esc(t.preparada.cuando)}` : ""}<br><button type="button" data-preparada="si" title="Se cumplió: gasta tu Reacción">¡Ahora!</button><button type="button" data-preparada="no" title="Soltar lo preparado">Soltar</button></div>` : ""}
    ${game.user.isGM ? `<div class="ecos-pa-dm">${actor.type === "character" ? `<button type="button" data-inspiracion title="Dar o quitar Inspiración heroica">${actor.system?.attributes?.inspiration ? "★ Inspiración" : "☆ Inspiración"}</button>` : `<span title="Su actitud hacia los PJ: la CD de Influir">Actitud:</span>${Object.keys(NOMBRE_ACTITUD).map(k => `<button type="button" data-actitud="${k}" class="${actitudDe(actor, tokenActual()) === k ? "activa" : ""}">${NOMBRE_ACTITUD[k]}</button>`).join("")}`}</div>` : ""}
    ${c ? "" : `<p class="ecos-pa-nota">Fuera de combate: las acciones se cuentan solo en un combate.</p>`}
    <div class="ecos-pa-saltar"><button type="button" data-accion="saltar" title="Saltar · movimiento\nCalcula tu salto largo y alto (con y sin carrera) y pone el token en modo salto."><i class="fa-solid ${ICONO.saltar}"></i> Saltar</button></div>
    <div class="ecos-pa-menu">${htmlAcciones(actor, { filtro: filtroGuardado("panelFiltro"), turno: t, enCombate: !!c })}</div>`}`;
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
  if (ev.target.closest("[data-festejo]")) return game.modules.get(MOD)?.api?.festejo?.frase?.(actor);
  const pl = ev.target.closest("[data-plegar]"); if (pl) { guardarLS("panelPlegado", !leerLS("panelPlegado", false)); return pintar(); }
  const p = ev.target.closest("[data-pip]");
  if (p) { const combat = combateActivo(), c = combat?.combatants?.find?.(x => x.actor === actor || x.actorId === actor.id); if (c) await cambiarTurno(c.id, { op: "alternar", clave: p.dataset.pip }); return; }
  const pr = ev.target.closest("[data-preparada]"); if (pr) return dispararPreparada(actor, { cancelar: pr.dataset.preparada === "no" });
  if (ev.target.closest("[data-inspiracion]")) return alternarInspiracion(actor);
  const ac = ev.target.closest("[data-actitud]"); if (ac) return ponerActitud(actor, ac.dataset.actitud, tokenActual());
  const b = ev.target.closest("[data-accion]");
  if (b?.dataset.accion === "saltar") return saltar(actor);
  // 3.57: el menú de acciones (pestañas Acción / Adicional / Reacción / Fuera de combate y lo de la hoja).
  if (await clicAcciones(actor, ev, { claveFiltro: "panelFiltro" })) return pintar();
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
  for (const h of ["controlToken", "updateCombat", "updateCombatant", "deleteCombat", "createCombat", "updateActor", "updateToken", "canvasReady"]) Hooks.on(h, () => repintar());
}
