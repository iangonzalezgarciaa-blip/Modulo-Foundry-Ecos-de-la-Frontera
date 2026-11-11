/**
 * 3.27 (pedidos del autor), la parte de Foundry:
 *  - Todo en pies: el chat del módulo (y lo que se escriba en metros) sale en pies; una migración pone las escenas en
 *    pies (1,5 m → 5 ft por casilla) y dnd5e sin unidades métricas.
 *  - Quitar plantillas: en Foundry 14 las plantillas son regiones. Un botón del DM en la barra de Tokens (y en su menú)
 *    lista las de la escena y quita las marcadas, sin entrar a la capa de Regiones.
 *  - La economía del Verbe en el rastreador de combate: acción y reacción Verbe de cada uno, libres o gastadas.
 */
import { aPiesTexto } from "./verbe-327.js";
import { despierto, turnoVerbe } from "./verbe.js";

const MOD = "ecos-frontera";
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const leer = (clave, def) => { try { return game.settings.get(MOD, clave); } catch { return def; } };

/* ---------- Todo en pies ---------- */
Hooks.on("preCreateChatMessage", (msg, data) => {
  try {
    const antes = data?.content ?? msg.content;
    if (typeof antes !== "string") return;
    const despues = aPiesTexto(antes);
    if (despues !== antes) msg.updateSource({ content: despues });
  } catch { /* el mensaje sigue igual */ }
});

/** Una escena en metros pasa a pies con la misma casilla: 1,5 m → 5 ft (cualquier tamaño, en la misma proporción). */
export function escenaAPies(grid) {
  const u = String(grid?.units ?? "").toLowerCase();
  if (!["m", "metros", "metro", "meters", "meter"].includes(u)) return null;
  const d = Number(grid.distance) || 1.5;
  return { "grid.units": "ft", "grid.distance": Math.round((d / 0.3) * 100) / 100 };
}
async function migrarPies() {
  if (!game.user.isGM || game.users.activeGM?.isSelf === false || leer("migracion327Pies", false)) return;
  const hechas = [];
  try { if (game.settings.get("dnd5e", "metricLengthUnits")) { await game.settings.set("dnd5e", "metricLengthUnits", false); hechas.push("dnd5e ya no usa unidades métricas"); } } catch { /* sin ese ajuste */ }
  let n = 0;
  for (const s of game.scenes ?? []) {
    const cambio = escenaAPies(s.grid);
    if (cambio) { await s.update(cambio); n += 1; }
  }
  if (n) hechas.push(`${n} escena(s) en metros pasaron a pies (1,5 m → 5 ft por casilla)`);
  await game.settings.set(MOD, "migracion327Pies", true);
  if (hechas.length) ChatMessage.create({ content: `<div class="ecos-card ecos-secreto"><h3>Ecos 3.27 · todo en pies</h3><p>${hechas.join(". ")}. Las técnicas, el chat y las guías del módulo ya hablan en pies.</p></div>`,
    whisper: game.users.filter(u => u.isGM).map(u => u.id), speaker: { alias: "Ecos (solo DM)" } });
}

/* ---------- Quitar plantillas (Foundry 14: regiones) ---------- */
/** ¿Es una plantilla puesta al usar algo? dnd5e la marca con la actividad; Ecos, con su bandera. Pura. */
export const esPlantilla = (r, usuarios = globalThis.game?.users ?? []) => !!(r?.flags?.dnd5e?.activity || r?.flags?.dnd5e?.item || r?.flags?.[MOD]?.plantilla
  || [...usuarios].some(u => String(r?.name ?? "").endsWith(`[${u.name}]`)));
export async function quitarPlantillas() {
  if (!game.user.isGM) return;
  const escena = canvas?.scene;
  if (!escena) return ui.notifications.warn("No hay una escena abierta.");
  const regiones = [...(escena.regions ?? [])];
  const plantillas = regiones.filter(esPlantilla);
  if (!regiones.length) return ui.notifications.info(`«${escena.name}» no tiene plantillas ni regiones.`);
  const fila = (r, marcada) => `<label class="ecos-plantilla"><input type="checkbox" name="r-${r.id}" ${marcada ? "checked" : ""}> <b>${esc(r.name)}</b>
    <small>${esPlantilla(r) ? "plantilla de un uso" : `región de la escena${(r.behaviors?.size ?? r.behaviors?.length ?? 0) ? " con comportamientos" : ""}`}</small></label>`;
  const otras = regiones.filter(r => !esPlantilla(r));
  const html = `<div class="ecos-quitar-plantillas"><p>En Foundry 14 las plantillas de área son <b>regiones</b>. Marca las que quieres quitar de <b>${esc(escena.name)}</b>.</p>
    ${plantillas.length ? `<h4>Plantillas (${plantillas.length})</h4>${plantillas.map(r => fila(r, true)).join("<br>")}` : "<p><i>No hay plantillas puestas al usar conjuros o técnicas.</i></p>"}
    ${otras.length ? `<details ${plantillas.length ? "" : "open"}><summary>Otras regiones de la escena (${otras.length}) · no vienen marcadas</summary>${otras.map(r => fila(r, false)).join("<br>")}</details>` : ""}</div>`;
  const { DialogV2 } = foundry.applications.api;
  const r = await DialogV2.wait({
    window: { title: "Quitar plantillas", icon: "fa-solid fa-eraser" }, position: { width: 460 }, content: html, rejectClose: false,
    buttons: [{ action: "marcadas", label: "Quitar las marcadas", icon: "fa-solid fa-eraser", default: true, callback: (ev, b) => new foundry.applications.ux.FormDataExtended(b.form).object },
      { action: "todas", label: "Quitar todas las plantillas", icon: "fa-solid fa-broom", callback: () => ({ todas: true }) },
      { action: "no", label: "Cancelar" }]
  });
  if (!r || r === "no") return;
  const ids = r.todas ? plantillas.map(x => x.id) : regiones.filter(x => r[`r-${x.id}`]).map(x => x.id);
  if (!ids.length) return ui.notifications.info("No marcaste nada.");
  await escena.deleteEmbeddedDocuments("Region", ids);
  ui.notifications.info(`Quitadas ${ids.length} plantilla(s) o región(es) de ${escena.name}.`);
}

Hooks.on("getSceneControlButtons", controls => {
  const tokens = controls.tokens ?? controls.token;
  if (!tokens?.tools || !game.user.isGM) return;
  tokens.tools.ecosPlantillas = {
    name: "ecosPlantillas",
    title: "Quitar plantillas de la escena (en Foundry 14 son regiones): elige cuáles o quítalas todas",
    icon: "fa-solid fa-eraser",
    button: true, visible: true, order: 96,
    onChange: (event, active) => { if (active !== false) quitarPlantillas().catch(err => console.error(`${MOD} | plantillas`, err)); }
  };
});

/* ---------- La economía del Verbe en el rastreador de combate ---------- */
Hooks.on("renderCombatTracker", (app, html) => {
  try {
    const raiz = html instanceof HTMLElement ? html : html?.[0];
    if (!raiz || !game.combat?.started) return;
    for (const li of raiz.querySelectorAll("[data-combatant-id]")) {
      const c = game.combat.combatants.get(li.dataset.combatantId), actor = c?.actor;
      li.querySelector(".ecos-turno-mini")?.remove();
      if (!actor || !despierto(actor) || !(game.user.isGM || actor.isOwner)) continue;
      const t = turnoVerbe(actor);
      const span = document.createElement("span");
      span.className = "ecos-turno-mini";
      span.innerHTML = `<i class="fa-solid fa-bolt ${t.accionLibre ? "libre" : "gastada"}" data-tooltip="Acción Verbe: ${t.accionLibre ? "libre" : "gastada"}"></i><i class="fa-solid fa-forward ${t.adicionalLibre ? "libre" : "gastada"}" data-tooltip="Acción adicional Verbe: ${t.adicionalLibre ? "libre" : "gastada"}"></i><i class="fa-solid fa-shield-halved ${t.reaccionLibre ? "libre" : "gastada"}" data-tooltip="Reacción Verbe: ${t.reaccionLibre ? "libre" : "gastada"}"></i>`;
      (li.querySelector(".token-name, .name, h4") ?? li).append(span);
    }
  } catch (err) { console.warn(`${MOD} | rastreador`, err); }
});
// Cuando cambia el estado del Verbe de alguien en combate, se repinta el rastreador.
Hooks.on("updateActor", (actor, cambios) => {
  if (!game.combat?.started || !foundry.utils.hasProperty(cambios, `flags.${MOD}.verbe`)) return;
  if (game.combat.combatants.some(c => c.actor === actor)) ui.combat?.render?.();
});

Hooks.once("init", () => {
  game.settings.register(MOD, "migracion327Pies", { scope: "world", config: false, type: Boolean, default: false });
});
Hooks.once("ready", () => { migrarPies().catch(err => console.error(`${MOD} | pies`, err)); });
