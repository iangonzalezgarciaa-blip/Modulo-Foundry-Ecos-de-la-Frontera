/**
 * 3.51 · Estilos de hoja (pedido del autor, 12-nov-2026): adornos y letras de impacto en las hojas de PJ y PNJ, al estilo
 * del anime de acción (sin nombres ni símbolos de ninguna serie). Cada jugador elige uno de cinco estilos para su personaje
 * con el botón de la paleta en la cabecera de su hoja; los PNJ llevan el de «Tinta» (el DM lo cambia en los ajustes).
 * Se revierte: «Original» en el mismo botón, el ajuste del mundo para los PNJ y uno por usuario para no verlos.
 * Solo cambia variables de color y fondo de dnd5e y pone adornos que no reciben clics: no toca la hoja ni sus datos.
 */
const MOD = "ecos-frontera";
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
// 3.60: tonos oscuros y apagados, con textura suave (pedido del autor).
export const ESTILOS = {
  llama: { n: "Llama", c: "#c26a35", d: "Brasa y carbón: el que no se rinde." },
  marea: { n: "Marea", c: "#4a86b8", d: "Azul de profundidad: calma que golpea." },
  hoja: { n: "Hoja", c: "#6a9a5f", d: "Musgo y sombra de bosque: paciencia y raíz." },
  sombra: { n: "Sombra", c: "#8a6fbb", d: "Ciruela y humo: el que se mueve sin ser visto." },
  tormenta: { n: "Tormenta", c: "#b39a4a", d: "Pizarra y latón: rápido y sin aviso." }
};
export const ESTILO_PNJ = { tinta: { n: "Tinta", c: "#a5453a", d: "Cuero oscuro y tinta roja: el registro del DM." } };
/** El estilo que le toca a una hoja. Puro. */
export function estiloDe({ tipo, elegido, pnj = "tinta", ver = true } = {}) {
  if (!ver) return null;
  if (tipo === "character") return ESTILOS[elegido] ? elegido : null;
  if (tipo === "npc") return pnj && pnj !== "original" && (ESTILO_PNJ[pnj] || ESTILOS[pnj]) ? pnj : null;
  return null;
}

/* ---------------- Foundry ---------------- */
const leer = (k, d) => { try { return game.settings.get(MOD, k); } catch { return d; } };
const CLASES = [...Object.keys(ESTILOS), ...Object.keys(ESTILO_PNJ)].map(k => `ecos-hoja-${k}`);
function aplicar(app) {
  const actor = app?.document ?? app?.actor, el = app?.element;
  if (!(actor instanceof Actor) || !el?.classList) return;
  el.classList.remove("ecos-hoja", ...CLASES);
  const est = estiloDe({ tipo: actor.type, elegido: actor.getFlag(MOD, "estiloHoja"), pnj: leer("estiloHojaPNJ", "tinta"), ver: leer("verEstilosHoja", true) });
  // 3.60: los estilos usan el tema oscuro de dnd5e en esa hoja (y lo devuelven al quitarlos).
  const T = "ecosTemaOriginal";
  if (est) {
    el.classList.add("ecos-hoja", `ecos-hoja-${est}`);
    if (!el.dataset[T]) el.dataset[T] = el.classList.contains("theme-dark") ? "theme-dark" : el.classList.contains("theme-light") ? "theme-light" : "ninguno";
    el.classList.remove("theme-light"); el.classList.add("themed", "theme-dark");
  } else if (el.dataset[T]) {
    el.classList.remove("theme-dark"); if (el.dataset[T] !== "ninguno") el.classList.add(el.dataset[T]); delete el.dataset[T];
  }
  if (actor.type !== "character" || !actor.isOwner) return;
  const cab = el.querySelector(".window-header");
  if (!cab || cab.querySelector(".ecos-estilo-boton")) return;
  const b = document.createElement("button");
  b.type = "button"; b.className = "header-control ecos-cabecera ecos-estilo-boton icon fa-solid fa-palette"; b.dataset.tooltip = "Estilo de la hoja (elige entre cinco)";
  b.setAttribute("aria-label", "Estilo de la hoja");
  b.addEventListener("click", ev => { ev.preventDefault(); ev.stopPropagation(); elegirEstilo(actor); });
  const antes = cab.querySelector('[data-action="close"], .close');
  if (antes) antes.before(b); else cab.append(b);
}
export async function elegirEstilo(actor) {
  if (!actor?.isOwner) return;
  const actual = actor.getFlag(MOD, "estiloHoja") ?? "original";
  const op = (k, e) => `<label class="ecos-estilo-op ${actual === k ? "elegido" : ""}"><input type="radio" name="estilo" value="${k}" ${actual === k ? "checked" : ""}>
    <span class="ecos-estilo-muestra ecos-muestra-${k}" style="--ecos-acento:${e?.c ?? "#9f9275"}"></span><b>${esc(e?.n ?? "Original")}</b><small>${esc(e?.d ?? "La hoja de D&D tal como viene.")}</small></label>`;
  const r = await foundry.applications.api.DialogV2.wait({ window: { title: `Estilo de la hoja · ${actor.name}`, icon: "fa-solid fa-palette" }, position: { width: 520 },
    content: `<div class="ecos-dialogo ecos-estilos">${Object.entries(ESTILOS).map(([k, e]) => op(k, e)).join("")}${op("original", null)}</div>`,
    buttons: [{ action: "ok", label: "Usar este estilo", icon: "fa-solid fa-check", default: true, callback: (_e, b) => b.form.elements.estilo.value }, { action: "no", label: "Cancelar" }], rejectClose: false });
  if (!r || r === "no") return;
  if (r === "original") await actor.unsetFlag(MOD, "estiloHoja"); else await actor.setFlag(MOD, "estiloHoja", r);
  for (const app of Object.values(actor.apps ?? {})) aplicar(app);
}
if (globalThis.Hooks) {
  Hooks.once("init", () => {
    game.settings.register(MOD, "estiloHojaPNJ", { name: "Estilo de las hojas de PNJ", hint: "Adornos y letras para las hojas de los PNJ y criaturas. «Original» las deja como vienen.", scope: "world", config: true, type: String, default: "tinta",
      choices: { tinta: "Tinta (cuero oscuro y rojo)", ...Object.fromEntries(Object.entries(ESTILOS).map(([k, e]) => [k, e.n])), original: "Original de D&D" },
      onChange: () => { for (const a of foundry.applications.instances?.values?.() ?? []) aplicar(a); } });
    game.settings.register(MOD, "verEstilosHoja", { name: "Ver los estilos de hoja", hint: "Solo para ti: apágalo para ver todas las hojas como vienen en D&D.", scope: "client", config: true, type: Boolean, default: true,
      onChange: () => { for (const a of foundry.applications.instances?.values?.() ?? []) aplicar(a); } });
  });
  Hooks.on("renderActorSheetV2", app => aplicar(app));
  Hooks.on("renderActorSheet", app => aplicar(app));
  Hooks.on("updateActor", (actor, cambios) => {
    if (!foundry.utils.hasProperty(cambios, `flags.${MOD}.estiloHoja`) && !foundry.utils.hasProperty(cambios, `flags.${MOD}.-=estiloHoja`)) return;
    for (const app of Object.values(actor.apps ?? {})) aplicar(app);
  });
  Hooks.once("ready", () => { const api = game.modules.get(MOD)?.api; if (api) api.estiloHoja = elegirEstilo; });
}
