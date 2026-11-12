/**
 * 3.37 · Almacén de reliquias del Abismo (pedido del autor): todas las reliquias como objetos en la pestaña Objetos,
 * para arrastrarlas a las hojas. Tres carpetas (solo el DM las ve):
 *  1 · Manual del DM: cada reliquia con sus tres etapas y cómo se despierta cada una.
 *  2 · Por etapa: una copia por etapa (Dormida, Despierta, Resonante), lista para entregar ya en esa etapa.
 *  3 · Para entregar: una copia que empieza Dormida y sube de etapa con un botón del DM en su hoja (se va actualizando).
 * Las imágenes las pone el DM: el almacén nunca pisa la imagen de una copia que ya existe.
 * 3.45: solo dos carpetas (Manual del DM y Para entregar); las copias «por etapa» se quitan.
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
/** Lo que ve el jugador en la copia para entregar: aspecto, lo que se cuenta y lo que hace en su etapa. Sin cómo se despierta. Puro. */
export function textoEtapa(r, n) {
  const e = ETAPAS_RELIQUIA.find(x => x.n === Number(n)) ?? ETAPAS_RELIQUIA[0];
  return `<div class="ecos-reliquia-etapa">${r.aspecto ? `<p><b>Aspecto.</b> ${esc(r.aspecto)}</p>` : ""}${r.relatoNimerios?.publico ? `<p><b>Lo que se cuenta.</b> ${esc(r.relatoNimerios.publico)}</p>` : ""}
    <p><b>Etapa ${e.n} · ${e.nombre}.</b> ${esc(e.efecto)}</p><p><b>Qué hace.</b> ${esc(r.texto)}</p>${e.n < 3 ? "<p><i>Hay algo más en ella. Todavía no responde del todo.</i></p>" : ""}</div>`;
}
/** El manual del DM: qué es, aspecto, qué hace en cada etapa y cómo se despierta (oculto al jugador). Puro. */
export function manualReliquia(r) {
  const d = despertarReliquia(r);
  return `<div class="ecos-reliquia-manual"><h2>${esc(r.nombre)}</h2><p><i>Manual del DM · grado ${esc(r.grado)} · nivel ${esc(r.nivel)} · solo tú lo ves</i></p>
    <h3>Qué es</h3><p>${esc(r.canon ?? "")}</p>${r.aspecto ? `<h3>Aspecto</h3><p>${esc(r.aspecto)}</p>` : ""}
    <h3>Qué hace</h3><p>${esc(r.texto)}</p>
    ${ETAPAS_RELIQUIA.map(e => `<h3>Etapa ${e.n} · ${e.nombre}</h3><p>${esc(e.efecto)}</p>${d[e.n] ? `<p><b>Cómo se despierta (oculto al jugador):</b> ${esc(d[e.n])}</p>` : "<p><b>Así se encuentra.</b></p>"}`).join("")}
    ${r.relatoNimerios?.publico ? `<h3>Lo que se cuenta</h3><p>${esc(r.relatoNimerios.publico)}</p>` : ""}${r.relatoNimerios?.dm ? `<h3>Gancho para el DM</h3><p>${esc(r.relatoNimerios.dm)}</p>` : ""}
    <p class="ecos-nota">Arrastra a una hoja la copia de «2 · Para entregar» y súbela de etapa con el botón de su cabecera (solo lo ves tú) cuando el jugador cumpla lo que dice aquí. El jugador ve el aspecto y lo que hace en su etapa, nunca cómo despertarla.</p></div>`;
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
  const fMan = await carpeta("1 · Manual del DM", raiz);
  // 3.45 (pedido del autor): dos carpetas, no tres. La de «Para entregar» conserva sus objetos (y su etapa) si ya existía.
  const vieja = game.folders.find(f => f.type === "Item" && f.name === "3 · Para entregar (sube de etapa)" && f.folder?.id === raiz.id);
  if (vieja) await vieja.update({ name: "2 · Para entregar" });
  const fEnt = await carpeta("2 · Para entregar", raiz);
  const porEtapa = game.items.filter(i => i.flags?.[MOD]?.almacen?.tipo === "etapa");
  if (porEtapa.length) await Item.deleteDocuments(porEtapa.map(i => i.id));
  const fEt = game.folders.find(f => f.type === "Item" && f.name === "2 · Por etapa" && f.folder?.id === raiz.id && !f.contents?.length);
  if (fEt) await fEt.delete();
  const ya = new Map(game.items.filter(i => i.flags?.[MOD]?.almacen).map(i => { const a = i.flags[MOD].almacen; return [`${a.id}|${a.tipo}`, i]; }));
  const crear = [], actualizar = [];
  for (const r of R) {
    const man = copia(r, { nombre: `${r.nombre} · manual`, desc: manualReliquia(r), tipo: "manual", manual: true, folder: fMan.id });
    const iMan = ya.get(`${r.id}|manual`);
    if (iMan) actualizar.push({ _id: iMan.id, name: man.name, "system.description.value": man.system.description.value }); else crear.push(man);
    const iEnt = ya.get(`${r.id}|entregar`);
    if (!iEnt) crear.push(copia(r, { nombre: `${r.nombre} (Dormida)`, desc: textoEtapa(r, 1), tipo: "entregar", etapa: 1, folder: fEnt.id }));
    else actualizar.push({ _id: iEnt.id, "system.description.value": textoEtapa(r, iEnt.flags[MOD].almacen.etapa ?? 1) });
  }
  for (let i = 0; i < crear.length; i += 100) await Item.createDocuments(crear.slice(i, i + 100));
  for (let i = 0; i < actualizar.length; i += 100) await Item.updateDocuments(actualizar.slice(i, i + 100));
  ui.notifications.info(`Almacén de reliquias: ${crear.length} nuevos, ${actualizar.length} al día${porEtapa.length ? `, ${porEtapa.length} copias «por etapa» quitadas` : ""}. Están en la pestaña Objetos.`);
  return { creados: crear.length, actualizados: actualizar.length, quitados: porEtapa.length };
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
    for (const [paso, txt, ic] of [[1, "Subir etapa (DM)", "fa-arrow-up"], [-1, "Bajar (DM)", "fa-arrow-down"]]) {
      const b = document.createElement("button");
      b.type = "button"; b.className = "header-control ecos-etapa-reliquia"; b.innerHTML = `<i class="fa-solid ${ic}"></i> ${txt}`;
      b.addEventListener("click", ev => { ev.preventDefault(); cambiarEtapa(item, paso).catch(err => console.error(`${MOD} | etapa`, err)); });
      cab.querySelector('[data-action="close"], .close')?.before(b);
    }
  };
  Hooks.on("renderItemSheetV2", boton);
  Hooks.on("renderItemSheet", boton);
}
