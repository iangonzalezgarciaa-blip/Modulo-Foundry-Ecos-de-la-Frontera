/**
 * 3.37 · Almacén de reliquias del Abismo (pedido del autor): todas las reliquias como objetos en la pestaña Objetos,
 * para arrastrarlas a las hojas. Tres carpetas (solo el DM las ve):
 *  1 · Manual del DM: cada reliquia con sus tres etapas y cómo se despierta cada una.
 *  2 · Por etapa: una copia por etapa (Dormida, Despierta, Resonante), lista para entregar ya en esa etapa.
 *  3 · Para entregar: una copia que empieza Dormida y sube de etapa con un botón del DM en su hoja (se va actualizando).
 * Las imágenes las pone el DM: el almacén nunca pisa la imagen de una copia que ya existe.
 */
const MOD = "ecos-frontera";
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
export const ETAPAS_RELIQUIA = [
  { n: 1, nombre: "Dormida", efecto: "Responde a medias: la mitad de su duración o su alcance y 1 uso por Descanso Largo. El DM puede pedir una prueba de Control del Verbe (o de Arcanos) para que responda." },
  { n: 2, nombre: "Despierta", efecto: "Funciona como dice su texto." },
  { n: 3, nombre: "Resonante", efecto: "1 uso más por Descanso Largo y el doble de duración o alcance. Quien tenga el Verbe despierto puede pagar 2 Verbe en lugar de gastar un uso." }
];
const gradoNum = g => { const n = Number(String(g ?? "").split("/")[0]); return Number.isFinite(n) && n > 0 ? n : 2; };
/** Cómo pasa a cada etapa. Puro. */
export function despertarReliquia(r) {
  const cd = 10 + gradoNum(r?.grado) * 2;
  return {
    2: `De Dormida a Despierta: que su portador la use en tres escenas de peligro real; o un ritual de una noche en un Santuario con 1 Moneda Antigua; o que alguien con el Verbe despierto la sostenga durante un Descanso Largo y supere Control del Verbe CD ${cd}.`,
    3: `De Despierta a Resonante: un hito ligado a su origen (lo marca su relato o el DM) y un portador con el Verbe en etapa Practicante o más que la lleve un mes de juego; o tocar con ella un Eco del Vorrh y sobrevivir.`
  };
}
/** El texto de una etapa. Puro. */
export function textoEtapa(r, n) {
  const e = ETAPAS_RELIQUIA.find(x => x.n === Number(n)) ?? ETAPAS_RELIQUIA[0];
  return `<div class="ecos-reliquia-etapa"><p><b>Etapa ${e.n} · ${e.nombre}.</b> ${esc(e.efecto)}</p><p>${esc(r.texto)}</p></div>`;
}
/** El manual del DM: las tres etapas y cómo despertarlas. Puro. */
export function manualReliquia(r) {
  const d = despertarReliquia(r);
  return `<div class="ecos-reliquia-manual"><h2>${esc(r.nombre)}</h2><p><i>Manual del DM · grado ${esc(r.grado)} · nivel ${esc(r.nivel)}</i></p><p>${esc(r.texto)}</p>
    ${ETAPAS_RELIQUIA.map(e => `<h3>Etapa ${e.n} · ${e.nombre}</h3><p>${esc(e.efecto)}</p>${d[e.n] ? `<p><b>Cómo se despierta:</b> ${esc(d[e.n])}</p>` : "<p><b>Así se encuentra.</b></p>"}`).join("")}
    ${r.canon ? `<h3>Origen</h3><p>${esc(r.canon)}</p>` : ""}<p class="ecos-nota">Arrastra a una hoja la copia «Para entregar» y súbela de etapa con el botón de su cabecera cuando el jugador cumpla lo que dice aquí.</p></div>`;
}

/* ---------------- Foundry ---------------- */
async function carpeta(nombre, padre = null) {
  return game.folders.find(f => f.type === "Item" && f.name === nombre && (f.folder?.id ?? null) === (padre?.id ?? null))
    ?? Folder.create({ name: nombre, type: "Item", folder: padre?.id ?? null, sorting: "a" });
}
function copia(r, { nombre, desc, etapa = null, tipo, manual = false, folder }) {
  const base = foundry.utils.deepClone(r.item);
  delete base._id; delete base.folder; delete base.sort;
  base.name = nombre; base.folder = folder; base.ownership = { default: 0 };
  base.system ??= {}; base.system.description = { ...(base.system.description ?? {}), value: desc };
  if (manual) { base.type = "loot"; delete base.system.activities; base.effects = []; }
  base.flags = { ...(base.flags ?? {}), [MOD]: { ...(base.flags?.[MOD] ?? {}), almacen: { id: r.id, tipo, etapa } } };
  if (manual) delete base.flags[MOD].reliquia;
  return base;
}
export async function crearAlmacenReliquias() {
  if (!game.user.isGM) return;
  const { consultarReliquias } = await import("./relics.js");
  const R = await consultarReliquias();
  const raiz = await carpeta("Reliquias del Abismo (solo DM)");
  const fMan = await carpeta("1 · Manual del DM", raiz), fEt = await carpeta("2 · Por etapa", raiz), fEnt = await carpeta("3 · Para entregar (sube de etapa)", raiz);
  const ya = new Map(game.items.filter(i => i.flags?.[MOD]?.almacen).map(i => { const a = i.flags[MOD].almacen; return [`${a.id}|${a.tipo}|${a.etapa ?? ""}`, i]; }));
  const crear = [], actualizar = [];
  const poner = (clave, datos) => { const i = ya.get(clave); if (!i) crear.push(datos); else actualizar.push({ _id: i.id, name: datos.name, "system.description.value": datos.system.description.value }); };
  for (const r of R) {
    poner(`${r.id}|manual|`, copia(r, { nombre: `${r.nombre} · manual`, desc: manualReliquia(r), tipo: "manual", manual: true, folder: fMan.id }));
    for (const e of ETAPAS_RELIQUIA) poner(`${r.id}|etapa|${e.n}`, copia(r, { nombre: `${r.nombre} · ${e.nombre}`, desc: textoEtapa(r, e.n), tipo: "etapa", etapa: e.n, folder: fEt.id }));
    if (!ya.has(`${r.id}|entregar|`)) crear.push(copia(r, { nombre: `${r.nombre} (Dormida)`, desc: textoEtapa(r, 1), tipo: "entregar", folder: fEnt.id }));
  }
  for (let i = 0; i < crear.length; i += 100) await Item.createDocuments(crear.slice(i, i + 100));
  for (let i = 0; i < actualizar.length; i += 100) await Item.updateDocuments(actualizar.slice(i, i + 100));
  ui.notifications.info(`Almacén de reliquias: ${crear.length} objetos nuevos, ${actualizar.length} al día. Están en la pestaña Objetos.`);
  return { creados: crear.length, actualizados: actualizar.length };
}
/** Sube (o baja) de etapa una copia «Para entregar»: cambia su nombre y su texto. */
export async function cambiarEtapa(item, paso = 1) {
  const a = item?.flags?.[MOD]?.almacen;
  if (!a || a.tipo !== "entregar" || !game.user.isGM) return;
  const { consultarReliquias } = await import("./relics.js");
  const r = (await consultarReliquias()).find(x => x.id === a.id);
  if (!r) return;
  const n = Math.max(1, Math.min(3, (Number(a.etapa) || 1) + paso)), e = ETAPAS_RELIQUIA.find(x => x.n === n);
  await item.update({ name: `${r.nombre} (${e.nombre})`, "system.description.value": textoEtapa(r, n), [`flags.${MOD}.almacen.etapa`]: n });
  ui.notifications.info(`${r.nombre}: ahora está ${e.nombre}.`);
}
if (globalThis.Hooks) {
  Hooks.once("ready", () => { const api = game.modules.get(MOD)?.api; if (api) { api.almacenReliquias = crearAlmacenReliquias; api.etapaReliquia = cambiarEtapa; } });
  const boton = (app) => {
    const item = app?.document ?? app?.item;
    if (!game.user.isGM || !(item instanceof Item) || item.flags?.[MOD]?.almacen?.tipo !== "entregar") return;
    const cab = app.element?.querySelector?.(".window-header");
    if (!cab || cab.querySelector(".ecos-etapa-reliquia")) return;
    for (const [paso, txt, ic] of [[1, "Subir etapa", "fa-arrow-up"], [-1, "Bajar", "fa-arrow-down"]]) {
      const b = document.createElement("button");
      b.type = "button"; b.className = "header-control ecos-etapa-reliquia"; b.innerHTML = `<i class="fa-solid ${ic}"></i> ${txt}`;
      b.addEventListener("click", ev => { ev.preventDefault(); cambiarEtapa(item, paso).catch(err => console.error(`${MOD} | etapa`, err)); });
      cab.querySelector('[data-action="close"], .close')?.before(b);
    }
  };
  Hooks.on("renderItemSheetV2", boton);
  Hooks.on("renderItemSheet", boton);
}
