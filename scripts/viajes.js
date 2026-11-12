/**
 * 3.43 · Viajes por zonas (aprobado por el autor, 11-nov-2026). El DM elige zona, días y ritmo: el módulo tira por cada
 * día si hay encuentro (según el ritmo), si encuentran uno de los lugares por descubrir, y si avanza el reloj del mundo
 * (lo que dispara el anuncio del día, el suceso, el clima y los relojes de facción). Todo con «Deshacer» (devuelve el
 * reloj) y con botón para armar cada encuentro a mano desde la tabla de la zona.
 */
import { botonDeshacer } from "./deshacer.js";
const MOD = "ecos-frontera";
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
/** Ritmos (D&D 2024): rápido −5 a la Percepción pasiva; lento permite sigilo. El umbral es el d20 para un encuentro. */
export const RITMOS = {
  lento: { nombre: "Lento", umbral: 18, texto: "Pueden ir con sigilo. Menos encuentros." },
  normal: { nombre: "Normal", umbral: 16, texto: "Sin cambios." },
  rapido: { nombre: "Rápido", umbral: 14, texto: "−5 a la Percepción pasiva. Más encuentros (los oyen venir)." }
};
/** El plan de un viaje a partir de los dados (d20 de encuentro y d20 de hallazgo por día). Puro. */
export function planViaje({ dias = 1, ritmo = "normal", tiradas = [], hallazgos = [] } = {}) {
  const R = RITMOS[ritmo] ?? RITMOS.normal;
  return Array.from({ length: Math.max(1, Math.trunc(Number(dias) || 1)) }, (_, i) => ({
    dia: i + 1, tirada: tiradas[i] ?? null, encuentro: Number(tiradas[i]) >= R.umbral, hallazgo: Number(hallazgos[i]) === 20 }));
}
export async function abrirViaje() {
  if (!game.user.isGM) return;
  const api = game.modules.get(MOD)?.api ?? {}, zonas = api.zonasEncuentro ?? {};
  const r = await foundry.applications.api.DialogV2.wait({ window: { title: "Viaje por zonas", icon: "fa-solid fa-route" }, position: { width: 520 },
    content: `<div class="ecos-dialogo"><label>Zona <select name="zona">${Object.entries(zonas).map(([k, n]) => `<option value="${k}">${esc(n)}</option>`).join("")}</select></label>
      <label>Días <input type="number" name="dias" min="1" max="30" value="1"></label>
      <label>Ritmo <select name="ritmo">${Object.entries(RITMOS).map(([k, x]) => `<option value="${k}" ${k === "normal" ? "selected" : ""}>${x.nombre}: ${esc(x.texto)}</option>`).join("")}</select></label>
      <label class="ecos-check"><input type="checkbox" name="reloj" checked> Avanzar el reloj del mundo un día por día de viaje (dispara el anuncio del día, el suceso, el clima y los relojes)</label>
      <p class="ecos-nota">Cada día: d20 de encuentro (${Object.values(RITMOS).map(x => `${x.nombre} ${x.umbral}+`).join(", ")}) y d20 de hallazgo (20: encuentran un lugar por descubrir). El resumen trae «Deshacer» y un botón para armar cada encuentro.</p></div>`,
    buttons: [{ action: "ok", label: "Viajar", default: true, callback: (_e, b) => Object.fromEntries(new FormData(b.form)) }, { action: "no", label: "Cancelar" }], rejectClose: false });
  if (!r || r === "no") return;
  const dias = Math.max(1, Math.min(30, Number(r.dias) || 1)), tiradas = [], hallazgos = [];
  for (let i = 0; i < dias; i++) { tiradas.push((await new Roll("1d20").evaluate()).total); hallazgos.push((await new Roll("1d20").evaluate()).total); }
  const plan = planViaje({ dias, ritmo: r.ritmo, tiradas, hallazgos });
  const lugares = game.journal?.find(j => j.getFlag(MOD, "clave") === "mundo-15")?.pages?.contents?.filter(p => !/^0 ·/.test(p.name)) ?? [];
  const tiempoAntes = game.time.worldTime;
  const filas = [];
  for (const d of plan) {
    if (r.reloj) await game.time.advance(86400);
    const lugar = d.hallazgo && lugares.length ? lugares[Math.floor(Math.random() * lugares.length)] : null;
    filas.push(`<li><b>Día ${d.dia}</b> · d20 ${d.tirada}: ${d.encuentro ? `<b>encuentro</b> <button type="button" data-viaje-encuentro="${esc(r.zona)}"><i class="fa-solid fa-dragon"></i> Armarlo</button>` : "tranquilo"}${lugar ? ` · <b>encuentran un lugar:</b> @UUID[${lugar.uuid}]{${esc(lugar.name)}}` : ""}</li>`);
  }
  const content = await TextEditor.implementation?.enrichHTML?.(`<p><b>Viaje</b> · ${esc(zonas[r.zona] ?? r.zona)} · ${dias} día${dias === 1 ? "" : "s"} · ritmo ${RITMOS[r.ritmo]?.nombre}</p><ul>${filas.join("")}</ul>${r.reloj ? botonDeshacer() : ""}`) ?? "";
  await ChatMessage.create({ whisper: game.users.filter(u => u.isGM).map(u => u.id), speaker: { alias: "Viaje (solo DM)" }, content,
    flags: { [MOD]: { viaje: true, deshacer: { cambios: [], borrar: [], tiempo: r.reloj ? tiempoAntes : null } } } });
}
if (globalThis.Hooks) {
  Hooks.once("ready", () => { const api = game.modules.get(MOD)?.api; if (api) api.viaje = abrirViaje; });
  Hooks.on("renderChatMessageHTML", (msg, html) => {
    if (!msg.getFlag?.(MOD, "viaje")) return;
    html.querySelectorAll?.("[data-viaje-encuentro]").forEach(b => {
      if (!game.user.isGM) return b.remove();
      b.addEventListener("click", ev => { ev.preventDefault(); game.modules.get(MOD)?.api?.encuentroZona?.(b.dataset.viajeEncuentro)?.catch?.(err => console.error(`${MOD} | viaje`, err)); });
    });
  });
  // Deshacer devuelve el reloj del mundo a como estaba antes del viaje.
  Hooks.on("updateChatMessage", (msg, cambios) => {
    if (!game.user.isGM || game.users.activeGM?.isSelf === false || !msg.getFlag(MOD, "viaje")) return;
    const t = msg.getFlag(MOD, "deshacer")?.tiempo;
    if (t != null && foundry.utils.getProperty(cambios, `flags.${MOD}.deshecho`)) game.time.advance(t - game.time.worldTime).catch(err => console.error(`${MOD} | viaje`, err));
  });
}
