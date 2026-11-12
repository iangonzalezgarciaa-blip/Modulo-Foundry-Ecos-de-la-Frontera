/**
 * 3.37 · Almacén de reliquias del Abismo (pedido del autor): todas las reliquias como objetos en la pestaña Objetos,
 * para arrastrarlas a las hojas. Dos carpetas (solo el DM las ve):
 *  1 · Manual del DM: cada reliquia con sus etapas, cómo se identifica, cómo se despierta y su historia secreta.
 *  2 · Para entregar: una copia que sube de etapa con un botón del DM en su hoja (se va actualizando).
 * Las imágenes las pone el DM: el almacén nunca pisa la imagen de una copia que ya existe.
 * 3.45: solo dos carpetas (Manual del DM y Para entregar); las copias «por etapa» se quitan.
 * 3.62 (pedido del autor, 12-nov-2026): las reliquias se entregan en la etapa 0 «Sin identificar»: el jugador solo ve su
 *  aspecto (nombre y descripción «sin identificar» de D&D) y la descubre estudiándola (Arcanos, Historia o Investigación
 *  contra su CD, con ventaja por Detectar magia o la dote Tacto del archivero), con el conjuro Identificar o porque el DM
 *  la sube. La copia lleva rellenas sus descripciones «sin identificar» y «para el chat». Cada reliquia enlaza a su
 *  historia secreta (diarios del mundo «Reliquias · Historias secretas…», solo DM; el texto no está en el código).
 *  Revertir: «Bajar etapa» (DM) o «Deshacer» del chat. A mano: «Subir etapa» o el «Identificar» nativo del DM.
 */
import { LEGENDARIAS, datosLegendaria, copiaLegendaria, manualLegendaria } from "./reliquias-legendarias.js";
const MOD = "ecos-frontera";
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
export const ETAPAS_RELIQUIA = [
  { n: 0, nombre: "Sin identificar", efecto: "No responde y nadie sabe qué es: solo se ve su aspecto. Hay que identificarla antes de poder usarla." },
  { n: 1, nombre: "Dormida", efecto: "Responde a medias: la mitad de su duración o su alcance y 1 uso por Descanso Largo. El DM puede pedir una prueba de Control del Verbe (o de Arcanos) para que responda." },
  { n: 2, nombre: "Despierta", efecto: "Funciona como dice su texto." },
  { n: 3, nombre: "Resonante", efecto: "1 uso más por Descanso Largo y el doble de duración o alcance. Quien tenga el Verbe despierto puede pagar 2 Verbe en lugar de gastar un uso." }
];
export const ETAPA_MAX = 3;
const etapaN = n => ETAPAS_RELIQUIA.find(x => x.n === Number(n)) ?? ETAPAS_RELIQUIA[1];
const gradoNum = g => { const n = Number(String(g ?? "").split("/")[0]); return Number.isFinite(n) && n > 0 ? n : 2; };
/** Cómo pasa a cada etapa. Puro. */
export function despertarReliquia(r) {
  const cd = 10 + gradoNum(r?.grado) * 2;
  return {
    1: `De Sin identificar a Dormida: estudiarla una hora y superar Arcanos, Historia o Investigación CD ${cdIdentificar(r)} (con ventaja si le lanzaron Detectar magia o con la dote Tacto del archivero; si falla, no hay otro intento hasta el siguiente Descanso Largo); o el conjuro Identificar; o que responda al usarla a ciegas en un peligro real (lo decide el DM).`,
    2: `De Dormida a Despierta: que su portador la use en tres escenas de peligro real; o un ritual de una noche en un Santuario con 1 Moneda Antigua; o que alguien con el Verbe despierto la sostenga durante un Descanso Largo y supere Control del Verbe CD ${cd}.`,
    3: r?.hito
      ? `De Despierta a Resonante: ${r.hito} Además, un portador con el Verbe en etapa Practicante o más que la lleve un mes de juego; o, en lugar de todo eso, tocar con ella un Eco del Vorrh y sobrevivir.`
      : `De Despierta a Resonante: un hito ligado a su origen (lo marca su relato o el DM) y un portador con el Verbe en etapa Practicante o más que la lleve un mes de juego; o tocar con ella un Eco del Vorrh y sobrevivir.`
  };
}
/** CD para identificarla estudiándola: 10 + la mitad de su nivel (hacia arriba). Nivel 1 → 11 · nivel 20 → 20. Puro. */
export const cdIdentificar = r => 10 + Math.ceil((Number(r?.nivel) || 1) / 2);
const VACIAS = new Set(["y", "o", "de", "del", "con", "en", "a", "la", "el", "los", "las", "un", "una", "que", "sin", "por"]);
/** Un nombre «sin identificar» sacado de su aspecto: «Barra de acero negro mate · sin identificar». Puro. */
export function nombreSinIdentificar(r) {
  let s = String(r?.aspecto ?? "").trim().replace(/^(un|una|unos|unas|el|la|los|las)\s+/i, "");
  s = s.split(/[;,:.]|\s(?:que|con|cuyo|cuya|donde|del tamaño|sin|como|tan|de un|de una|en forma)\s/i)[0].trim();
  const p = s.split(/\s+/).filter(Boolean).slice(0, 6);
  while (p.length > 1 && VACIAS.has(p[p.length - 1].toLowerCase())) p.pop();
  const base = p.join(" ");
  return `${base ? base[0].toLocaleUpperCase("es") + base.slice(1) : "Objeto extraño"} · sin identificar`;
}
/** Las formas de identificarla, para el jugador (sin decir qué es). Puro. */
export function metodosIdentificar(cd) {
  return [
    `<b>Estudiarla</b> (1 hora; 10 minutos con la dote Tacto del archivero): Arcanos, Historia o Investigación contra CD ${cd}. Con ventaja si alguien le lanzó <i>Detectar magia</i> o la miró con el Verbe, o con Tacto del archivero. Si fallas, no puedes volver a intentarlo hasta tu próximo Descanso Largo.`,
    "<b>El conjuro <i>Identificar</i></b> (o un ritual parecido): la identifica sin tirada.",
    "<b>A ciegas</b>: usarla en un peligro real y ver si responde. Lo decide el DM."
  ];
}
/** Lo que ve el jugador mientras no la identifica (la descripción «sin identificar» de D&D). Puro. */
export function textoSinIdentificar(r) {
  const cd = cdIdentificar(r);
  return `<div class="ecos-reliquia-etapa ecos-reliquia-oculta"><p><b>Aspecto.</b> ${esc(r?.aspecto ?? "Un objeto extraño, más antiguo de lo que parece.")}</p>
    <p><i>No sabes qué es ni qué hace, y no responde. Viene de las capas hondas: algo en ella no es de este mundo.</i></p>
    <h3>Cómo identificarla</h3><ul>${metodosIdentificar(cd).map(m => `<li>${m}</li>`).join("")}</ul>
    <p class="ecos-nota">Botón <b>«Estudiar»</b> en la cabecera de esta ventana.</p></div>`;
}
/** Lo que ve el jugador en la copia para entregar: aspecto, qué es, lo que se cuenta y lo que hace en su etapa. Sin cómo se despierta. Puro. */
export function textoEtapa(r, n) {
  const e = etapaN(n);
  if (e.n === 0) return `<div class="ecos-reliquia-etapa"><p><b>Etapa 0 · Sin identificar.</b> El jugador solo ve el aspecto y cómo identificarla (descripción «sin identificar»). Al identificarla pasa a Dormida.</p>${textoEtapa(r, 1)}</div>`;
  return `<div class="ecos-reliquia-etapa">${r.aspecto ? `<p><b>Aspecto.</b> ${esc(r.aspecto)}</p>` : ""}${r.que ? `<p><b>Qué es.</b> ${esc(r.que)}</p>` : ""}${r.relatoNimerios?.publico ? `<p><b>Lo que se cuenta.</b> ${esc(r.relatoNimerios.publico)}</p>` : ""}
    <p><b>Etapa ${e.n} · ${e.nombre}.</b> ${esc(e.efecto)}</p><p><b>Qué hace.</b> ${esc(r.texto)}</p>${e.n < ETAPA_MAX ? "<p><i>Hay algo más en ella. Todavía no responde del todo.</i></p>" : ""}</div>`;
}
/** La descripción corta para el chat. Puro. */
export function chatReliquia(r, n) {
  const e = etapaN(n);
  if (e.n === 0) return `<p>${esc(r?.aspecto ?? "Un objeto extraño.")} <i>Sin identificar.</i></p>`;
  return `<p><b>${esc(r.nombre)}</b> · ${e.nombre}. ${esc(r.texto)}</p>`;
}
/** Todo lo que cambia en la copia al ponerla en una etapa. `embebida`: está en una hoja (si no, el DM la ve con su nombre). Puro. */
export function datosEtapa(r, n, { embebida = false } = {}) {
  const e = etapaN(Math.max(0, Math.min(ETAPA_MAX, Number(n) || 0)));
  return {
    name: `${r.nombre} (${e.nombre})`,
    "system.identified": !(embebida && e.n === 0),
    "system.unidentified.name": nombreSinIdentificar(r),
    "system.unidentified.description": textoSinIdentificar(r),
    "system.description.value": textoEtapa(r, e.n),
    "system.description.chat": chatReliquia(r, e.n),
    [`flags.${MOD}.almacen.etapa`]: e.n,
    [`flags.${MOD}.almacen.cd`]: cdIdentificar(r),
    [`flags.${MOD}.almacen.nivel`]: Number(r.nivel) || 1,
    [`flags.${MOD}.almacen.nombre`]: r.nombre,
    [`flags.${MOD}.almacen.siguiente`]: e.n === 0 ? textoEtapa(r, 1) : null,
    [`flags.${MOD}.almacen.siguienteChat`]: e.n === 0 ? chatReliquia(r, 1) : null,
    [`flags.${MOD}.reliquia.autorizada`]: e.n >= 1
  };
}
/** Lo que cambia al identificarla (sin necesitar el catálogo: lo lee de sus banderas). Puro. */
export function updateIdentificada(a) {
  return {
    name: `${a?.nombre ?? "Reliquia"} (Dormida)`, "system.identified": true,
    ...(a?.siguiente ? { "system.description.value": a.siguiente } : {}), ...(a?.siguienteChat ? { "system.description.chat": a.siguienteChat } : {}),
    [`flags.${MOD}.almacen.etapa`]: 1, [`flags.${MOD}.almacen.estudioFallido`]: false, [`flags.${MOD}.reliquia.autorizada`]: true
  };
}
/** Lo que cambia al identificarla, sea reliquia o arma legendaria. Puro. */
export function identificacion(a) {
  if (a?.legendaria && LEGENDARIAS[a.legendaria]) return { ...datosLegendaria(a.legendaria, a.nombre, 1, { embebida: true }), [`flags.${MOD}.almacen.estudioFallido`]: false, [`flags.${MOD}.reliquia.autorizada`]: true };
  return updateIdentificada(a);
}
/** Resultado de un estudio: un 20 natural siempre la identifica. Puro. */
export const exitoEstudio = ({ total, cd, natural = 0 }) => Number(natural) === 20 || Number(total) >= Number(cd);
/** El manual del DM: qué es, aspecto, qué hace en cada etapa y cómo se despierta (oculto al jugador). Puro. */
export function manualReliquia(r, { historia = null } = {}) {
  const d = despertarReliquia(r);
  return `<div class="ecos-reliquia-manual"><h2>${esc(r.nombre)}</h2><p><i>Manual del DM · grado ${esc(r.grado)} · nivel ${esc(r.nivel)} · identificar CD ${cdIdentificar(r)} · solo tú lo ves</i></p>
    ${historia ? `<p><b>Historia secreta:</b> ${historia}</p>` : `<p><b>Historia secreta:</b> todavía no tiene página. Botón «Historia secreta» de la cabecera para abrirla o empezarla.</p>`}
    <h3>Qué es</h3><p>${esc(r.que ?? r.canon ?? "")}</p>${r.que && r.canon ? `<p><small>Origen: ${esc(r.canon)}</small></p>` : ""}${r.aspecto ? `<h3>Aspecto</h3><p>${esc(r.aspecto)}</p>` : ""}
    <h3>Qué hace</h3><p>${esc(r.texto)}</p>
    <h3>Cómo la ve el jugador sin identificar</h3><p><b>${esc(nombreSinIdentificar(r))}</b>. ${esc(r.aspecto ?? "")}</p>
    ${ETAPAS_RELIQUIA.map(e => `<h3>Etapa ${e.n} · ${e.nombre}</h3><p>${esc(e.efecto)}</p>${d[e.n] ? `<p><b>Cómo se despierta (oculto al jugador):</b> ${esc(d[e.n])}</p>` : "<p><b>Así se entrega.</b></p>"}`).join("")}
    ${r.relatoNimerios?.publico ? `<h3>Lo que se cuenta</h3><p>${esc(r.relatoNimerios.publico)}</p>` : ""}${r.relatoNimerios?.dm ? `<h3>Gancho para el DM</h3><p>${esc(r.relatoNimerios.dm)}</p>` : ""}
    <p class="ecos-nota">Arrastra a una hoja la copia de «2 · Para entregar»: llega sin identificar (el jugador ve «${esc(nombreSinIdentificar(r))}» y su aspecto). Súbela de etapa con el botón de su cabecera (solo lo ves tú) cuando el jugador cumpla lo que dice aquí. El jugador nunca ve cómo despertarla.</p></div>`;
}

/* ---------------- Historias secretas (diarios del mundo, solo DM) ---------------- */
export const PREFIJO_HISTORIAS = "Reliquias · Historias secretas";
/** Para comparar nombres de página: sin tildes, sin numeración delante, en minúsculas. Puro. */
export const normalizarNombre = s => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/^\s*\d+\s*[·.\-–]\s*/, "").replace(/\s*\((?:dormida|despierta|resonante|sin identificar)\)\s*$/i, "").trim().toLowerCase();
const lista = x => Array.from(x?.contents ?? x ?? []);
const esDiarioHistorias = j => !!j?.getFlag?.(MOD, "reliquiasHistorias") || String(j?.name ?? "").startsWith(PREFIJO_HISTORIAS);
/** La página de la historia secreta de una reliquia (por bandera o por nombre). */
export function paginaHistoria(id, nombre) {
  const diarios = lista(game.journal).filter(esDiarioHistorias);
  for (const j of diarios) { const p = lista(j.pages).find(p => p.getFlag?.(MOD, "reliquiaHistoria") === id); if (p) return p; }
  const n = normalizarNombre(nombre);
  for (const j of diarios) { const p = lista(j.pages).find(p => normalizarNombre(p.name) === n); if (p) return p; }
  return null;
}
/** El DM: los diarios de historias quedan solo para el DM y cada página con la bandera de su reliquia. */
export async function asegurarHistorias(R = null) {
  if (!game.user.isGM || (game.users.activeGM && !game.users.activeGM.isSelf)) return 0;
  const NONE = CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE;
  let n = 0;
  for (const j of lista(game.journal).filter(esDiarioHistorias)) {
    const ownership = { default: NONE };
    const abierto = Object.entries(j.ownership ?? {}).some(([k, v]) => k !== "default" ? !game.users.get(k)?.isGM && v > NONE : v > NONE);
    if (abierto) await j.update({ ownership }, { diff: false, recursive: false });
    if (!j.getFlag(MOD, "reliquiasHistorias")) await j.setFlag(MOD, "reliquiasHistorias", true);
    for (const p of lista(j.pages)) {
      if (p.ownership?.default > NONE) await p.update({ "ownership.default": -1 }).catch(() => null);
      if (p.getFlag(MOD, "reliquiaHistoria") || !R) continue;
      const r = R.find(x => normalizarNombre(x.nombre) === normalizarNombre(p.name));
      if (r) { await p.setFlag(MOD, "reliquiaHistoria", r.id); n++; }
    }
  }
  return n;
}
/** Abre la historia secreta; si no existe, ofrece empezarla en blanco (asignar a mano). */
export async function abrirHistoria(item) {
  if (!game.user.isGM) return;
  const a = item?.flags?.[MOD]?.almacen ?? {}, id = a.id ?? item?.flags?.[MOD]?.reliquia?.id, nombre = a.nombre ?? item?._source?.name ?? item?.name;
  const p = paginaHistoria(id, nombre);
  if (p) return p.parent.sheet.render({ force: true, pageId: p.id });
  const ok = await foundry.applications.api.DialogV2.confirm({ window: { title: "Historia secreta" }, content: `<p><b>${esc(nombre)}</b> todavía no tiene historia secreta en los diarios «${PREFIJO_HISTORIAS}…».</p><p>¿Empiezo una página en blanco para que la escribas?</p>` });
  if (!ok) return;
  let j = lista(game.journal).find(x => x.getFlag(MOD, "reliquiasHistorias") && x.getFlag(MOD, "historiasPropias"));
  if (!j) j = await JournalEntry.create({ name: `${PREFIJO_HISTORIAS} · propias (solo DM)`, ownership: { default: 0 }, flags: { [MOD]: { reliquiasHistorias: true, historiasPropias: true } } });
  const html = `<h1>${esc(nombre)}</h1><h2>Origen verdadero</h2><p></p><h2>Dónde yace</h2><p>Capa …, …</p><h2>La misión para conseguirla</h2><p></p><h2>Quién más la busca</h2><p></p><h2>Al identificarla</h2><p></p><h2>Para despertarla</h2><p></p>`;
  const [pg] = await j.createEmbeddedDocuments("JournalEntryPage", [{ name: nombre, type: "text", text: { content: html, format: 1 }, flags: { [MOD]: { reliquiaHistoria: id } } }]);
  return j.sheet.render({ force: true, pageId: pg.id });
}

/* ---------------- Foundry ---------------- */
const leer = (k, d) => { try { return game.settings.get(MOD, k); } catch { return d; } };
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
/** Una copia para entregar ya armada en su etapa (la usan el almacén y el catálogo de reliquias). */
export function copiaEntregar(r, etapa = null, { folder = null, embebida = false } = {}) {
  const n = etapa ?? (leer("reliquiaEtapaCero", true) ? 0 : 1);
  const it = copia(r, { nombre: r.nombre, desc: "", tipo: "entregar", etapa: n, folder });
  return foundry.utils.mergeObject(it, foundry.utils.expandObject(datosEtapa(r, n, { embebida })));
}
const enlaceHistoria = r => { const p = paginaHistoria(r.id, r.nombre); return p ? `@UUID[${p.uuid}]{${r.nombre}}` : null; };
export async function crearAlmacenReliquias() {
  if (!game.user.isGM) return;
  const { consultarReliquias } = await import("./relics.js");
  const R = await consultarReliquias();
  await asegurarHistorias(R);
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
    const man = copia(r, { nombre: `${r.nombre} · manual`, desc: manualReliquia(r, { historia: enlaceHistoria(r) }), tipo: "manual", manual: true, folder: fMan.id });
    const iMan = ya.get(`${r.id}|manual`);
    if (iMan) actualizar.push({ _id: iMan.id, name: man.name, "system.description.value": man.system.description.value }); else crear.push(man);
    const iEnt = ya.get(`${r.id}|entregar`);
    if (!iEnt) crear.push(copiaEntregar(r, null, { folder: fEnt.id }));
    else actualizar.push({ _id: iEnt.id, ...datosEtapa(r, iEnt.flags[MOD].almacen.etapa ?? 1) });
  }
  // 3.63: las armas legendarias del Verbe, con sus etapas (carpeta propia).
  const nombresLeg = new Map((game.modules.get(MOD)?.api?.verbe?.datos?.()?.artefactosShinobi ?? []).map(x => [x.id, x.nombre]));
  const fLeg = await carpeta("3 · Armas legendarias", raiz);
  for (const id of Object.keys(LEGENDARIAS)) {
    const nombre = nombresLeg.get(id) ?? id;
    const pag = paginaHistoria(`leg-${id}`, nombre), historia = pag ? `@UUID[${pag.uuid}]{${nombre}}` : null;
    const iMan = ya.get(`leg-${id}|manual`), desc = manualLegendaria(id, nombre, { historia });
    if (iMan) actualizar.push({ _id: iMan.id, name: `${nombre} · manual`, "system.description.value": desc });
    else crear.push({ name: `${nombre} · manual`, type: "loot", img: "icons/svg/book.svg", folder: fMan.id, ownership: { default: 0 }, system: { description: { value: desc } }, flags: { [MOD]: { almacen: { id: `leg-${id}`, tipo: "manual", legendaria: id } } } });
    const iEnt = ya.get(`leg-${id}|entregar`);
    if (!iEnt) crear.push(copiaLegendaria(id, nombre, leer("reliquiaEtapaCero", true) ? 0 : 1, { folder: fLeg.id }));
    else actualizar.push({ _id: iEnt.id, ...datosLegendaria(id, nombre, iEnt.flags[MOD].almacen.etapa ?? 0) });
  }
  for (let i = 0; i < crear.length; i += 100) await Item.createDocuments(crear.slice(i, i + 100));
  for (let i = 0; i < actualizar.length; i += 100) await Item.updateDocuments(actualizar.slice(i, i + 100));
  ui.notifications.info(`Almacén de reliquias: ${crear.length} nuevos, ${actualizar.length} al día${porEtapa.length ? `, ${porEtapa.length} copias «por etapa» quitadas` : ""}. Están en la pestaña Objetos.`);
  return { creados: crear.length, actualizados: actualizar.length, quitados: porEtapa.length };
}
/** 3.62: las copias que ya existían reciben sus descripciones «sin identificar» y «para el chat», y su CD. Las del almacén que estaban Dormidas por defecto pasan a Sin identificar (una sola vez). */
export async function ponerAlDia362() {
  if (!game.user.isGM || (game.users.activeGM && !game.users.activeGM.isSelf)) return 0;
  const { consultarReliquias } = await import("./relics.js");
  const R = await consultarReliquias(); if (!R.length) return 0;
  await asegurarHistorias(R);
  const primera = !leer("reliquias362", false), etapa0 = leer("reliquiaEtapaCero", true);
  const porId = new Map(R.map(r => [r.id, r]));
  let n = 0;
  const revisar = async (it, embebida) => {
    const a = it.flags?.[MOD]?.almacen, rel = it.flags?.[MOD]?.reliquia;
    if (a?.tipo === "entregar") {
      const r = porId.get(a.id); if (!r || a.cd || a.legendaria) return;
      const e = !embebida && primera && etapa0 && Number(a.etapa ?? 1) === 1 ? 0 : Number(a.etapa ?? 1);
      await it.update(datosEtapa(r, e, { embebida })); n++;
    } else if (rel && !a) {
      const r = porId.get(rel.id); if (!r || it.system?.unidentified?.description) return;
      await it.update({ "system.unidentified.name": nombreSinIdentificar(r), "system.unidentified.description": textoSinIdentificar(r), "system.description.chat": chatReliquia(r, 2) }); n++;
    }
  };
  for (const it of game.items) await revisar(it, false).catch(err => console.warn(`${MOD} | reliquia 3.62`, err));
  for (const ac of game.actors) for (const it of ac.items) await revisar(it, true).catch(err => console.warn(`${MOD} | reliquia 3.62`, err));
  if (primera) await game.settings.set(MOD, "reliquias362", true).catch(() => null);
  return n;
}
/** Sube (o baja) de etapa una copia «Para entregar»: cambia su nombre, su texto y si está identificada. */
export async function cambiarEtapa(item, paso = 1) {
  const a = item?.flags?.[MOD]?.almacen;
  if (!a || a.tipo !== "entregar" || !game.user.isGM) return;
  const n = Math.max(0, Math.min(ETAPA_MAX, (Number(a.etapa) || 0) + paso)), e = etapaN(n);
  if (a.legendaria) {
    await item.update(datosLegendaria(a.legendaria, a.nombre ?? item._source.name, n, { embebida: !!item.parent }), { ecosIdentificar: true });
    return ui.notifications.info(`${a.nombre}: ahora está ${e.nombre}.`);
  }
  const { consultarReliquias } = await import("./relics.js");
  const r = (await consultarReliquias()).find(x => x.id === a.id);
  if (!r) return;
  await item.update(datosEtapa(r, n, { embebida: !!item.parent }), { ecosIdentificar: true });
  ui.notifications.info(`${r.nombre}: ahora está ${e.nombre}.`);
}

/* ---------------- Estudiar (el jugador) ---------------- */
const tieneTacto = actor => { try { return !!game.modules.get(MOD)?.api?.verbe?.tieneDote?.(actor, "tacto-archivero"); } catch { return false; } };
const tieneIdentificar = actor => (actor?.items ?? []).some(i => i.type === "spell" && /^(identif|identify)/i.test(i.name ?? ""));
const HAB = [["arc", "Arcanos"], ["his", "Historia"], ["inv", "Investigación"]];
/** El jugador estudia su reliquia sin identificar. */
export async function estudiarReliquia(item) {
  const a = item?.flags?.[MOD]?.almacen, actor = item?.actor;
  if (a?.tipo !== "entregar") return;
  if (!actor) return ui.notifications.warn("Ponla primero en la hoja de quien la va a estudiar.");
  if (Number(a.etapa) !== 0) return ui.notifications.info("Ya sabéis qué es.");
  if (a.estudioFallido && !game.user.isGM) return ui.notifications.warn("Ya la estudiaste sin suerte: tendrás que esperar a tu próximo Descanso Largo.");
  const cd = Number(a.cd) || 15, tacto = tieneTacto(actor), conjuro = tieneIdentificar(actor);
  const mod = k => { const v = Number(actor.system?.skills?.[k]?.total ?? actor.system?.skills?.[k]?.mod ?? 0); return v >= 0 ? `+${v}` : `${v}`; };
  const res = await foundry.applications.api.DialogV2.wait({
    window: { title: `Estudiar · ${item.name}`, icon: "fa-solid fa-magnifying-glass" }, position: { width: 460 },
    content: `<div class="ecos-dialogo ecos-estudiar"><p>Estudiarla lleva <b>${tacto ? "10 minutos" : "1 hora"}</b>. CD <b>${cd}</b>. Si fallas, hasta tu próximo Descanso Largo no puedes volver a intentarlo. Un 20 natural siempre la identifica.</p>
      <label>Con qué la estudias <select name="hab">${HAB.map(([k, n]) => `<option value="${k}">${n} (${mod(k)})</option>`).join("")}</select></label>
      <label class="ecos-check"><input type="checkbox" name="magia"> Alguien le lanzó <i>Detectar magia</i> o la miró con el Verbe (ventaja)</label>
      ${tacto ? `<p class="ecos-nota"><b>Tacto del archivero:</b> tiras con ventaja.</p>` : ""}
      ${conjuro ? `<p class="ecos-nota">Tienes <i>Identificar</i>: si la lanzas sobre ella, la identifica sin tirada.</p>` : ""}</div>`,
    buttons: [
      { action: "tirar", label: "Estudiar (tirar)", icon: "fa-solid fa-dice-d20", default: true, callback: (ev, b) => ({ modo: "tirar", hab: b.form.elements.hab.value, magia: b.form.elements.magia.checked }) },
      ...(conjuro ? [{ action: "conjuro", label: "Lancé Identificar", icon: "fa-solid fa-wand-sparkles", callback: () => ({ modo: "conjuro" }) }] : []),
      { action: "cancelar", label: "Cancelar", callback: () => null }
    ], rejectClose: false
  }).catch(() => null);
  if (!res) return;
  let ok = false, detalle = "";
  if (res.modo === "conjuro") { ok = true; detalle = "con el conjuro <i>Identificar</i>"; }
  else {
    const ventaja = tacto || res.magia;
    let rolls = null;
    try { rolls = await actor.rollSkill({ skill: res.hab, advantage: ventaja, target: cd }, { configure: false }, { data: { flavor: `Estudiar un objeto extraño (CD ${cd})` } }); } catch (err) { console.warn(`${MOD} | estudiar`, err); }
    const roll = Array.isArray(rolls) ? rolls[0] : rolls;
    if (!roll) return;
    const natural = roll.isCritical ? 20 : Number(roll.d20?.total ?? 0);
    ok = exitoEstudio({ total: roll.total, cd, natural });
    detalle = `${HAB.find(h => h[0] === res.hab)?.[1] ?? res.hab} ${roll.total} contra CD ${cd}${ventaja ? " (con ventaja)" : ""}`;
  }
  const quien = { speaker: ChatMessage.getSpeaker({ actor }) };
  if (!ok) {
    await item.update({ [`flags.${MOD}.almacen.estudioFallido`]: true });
    return ChatMessage.create({ ...quien, content: `<div class="ecos-dialogo"><p><b>${esc(actor.name)}</b> estudia <b>${esc(item.name)}</b> (${detalle}) y no saca nada en claro. Hasta su próximo Descanso Largo no puede volver a intentarlo.</p></div>` });
  }
  if (leer("reliquiaIdentificarAuto", true)) {
    const antes = { name: item._source.name, "system.identified": false, "system.description.value": item._source.system?.description?.value ?? "", "system.description.chat": item._source.system?.description?.chat ?? "",
      [`flags.${MOD}.almacen.etapa`]: 0, [`flags.${MOD}.reliquia.autorizada`]: false };
    if (a.legendaria) Object.assign(antes, { "system.magicalBonus": item._source.system?.magicalBonus, "system.properties": [...(item._source.system?.properties ?? [])], "system.attunement": item._source.system?.attunement ?? "", "system.rarity": item._source.system?.rarity ?? "", "system.armor.magicalBonus": item._source.system?.armor?.magicalBonus ?? null });
    for (const k of Object.keys(antes)) if (antes[k] === undefined) delete antes[k];
    await item.update(identificacion(a), { ecosIdentificar: true });
    return ChatMessage.create({ ...quien, content: `<div class="ecos-dialogo"><p><b>${esc(actor.name)}</b> identifica la reliquia (${detalle}): es <b>${esc(a.nombre ?? item.name)}</b>. Está Dormida.</p><p><button type="button" data-ecos-deshacer><i class="fa-solid fa-rotate-left"></i> Deshacer</button></p></div>`,
      flags: { [MOD]: { deshacer: { cambios: [{ uuid: item.uuid, antes }] } } } });
  }
  return ChatMessage.create({ ...quien, content: `<div class="ecos-dialogo"><p><b>${esc(actor.name)}</b> estudia <b>${esc(item.name)}</b> (${detalle}) y cree entenderla. El DM lo confirma.</p><p><button type="button" data-ecos-revelar="${item.uuid}"><i class="fa-solid fa-eye"></i> Revelar (DM)</button></p></div>` });
}

if (globalThis.Hooks) {
  Hooks.once("init", () => {
    game.settings.register(MOD, "reliquiaEtapaCero", { name: "Reliquias: se entregan sin identificar", hint: "Las copias nuevas de «2 · Para entregar» (y las del catálogo) llegan en la etapa 0: el jugador solo ve su aspecto y tiene que identificarlas. Apagado: llegan Dormidas.", scope: "world", config: true, type: Boolean, default: true });
    game.settings.register(MOD, "reliquiaIdentificarAuto", { name: "Reliquias: identificar al superar el estudio", hint: "Si el jugador supera el estudio (o lanza Identificar), la reliquia pasa sola a Dormida y el chat trae «Deshacer». Apagado: el chat muestra «Revelar» y lo decides tú.", scope: "world", config: true, type: Boolean, default: true });
    game.settings.register(MOD, "reliquias362", { scope: "world", config: false, type: Boolean, default: false });
  });
  Hooks.once("ready", () => {
    const api = game.modules.get(MOD)?.api;
    if (api) Object.assign(api, { almacenReliquias: crearAlmacenReliquias, etapaReliquia: cambiarEtapa, estudiarReliquia, historiaReliquia: abrirHistoria });
    if (game.user.isGM && (!game.users.activeGM || game.users.activeGM.isSelf)) setTimeout(() => ponerAlDia362().catch(err => console.error(`${MOD} | reliquias 3.62`, err)), 9000);
  });
  // Al soltar una copia en una hoja, si está en la etapa 0 queda sin identificar para su dueño.
  Hooks.on("preCreateItem", (item) => {
    const a = item.flags?.[MOD]?.almacen;
    if (a?.tipo === "entregar" && item.parent instanceof Actor && Number(a.etapa) === 0) item.updateSource({ "system.identified": false, [`flags.${MOD}.almacen.estudioFallido`]: false });
  });
  // El «Identificar» de D&D no sirve para las reliquias (salvo el DM, que cuenta como subirla a mano).
  Hooks.on("preUpdateItem", (item, cambios, opciones) => {
    const a = item.flags?.[MOD]?.almacen;
    if (a?.tipo !== "entregar" || Number(a.etapa) !== 0 || !item.parent || opciones?.ecosIdentificar) return;
    if (foundry.utils.getProperty(cambios, "system.identified") !== true) return;
    if (!game.user.isGM) { ui.notifications.warn("Una reliquia no se identifica con un clic: pulsa «Estudiar» en su cabecera (o pídeselo al DM)."); return false; }
    foundry.utils.mergeObject(cambios, foundry.utils.expandObject(identificacion(a)));
  });
  Hooks.on("dnd5e.restCompleted", (actor, resultado, config) => {
    if (config?.type !== "long" || !(game.user.isGM || actor.isOwner)) return;
    const fallidas = actor.items.filter(i => i.flags?.[MOD]?.almacen?.estudioFallido);
    if (fallidas.length) actor.updateEmbeddedDocuments("Item", fallidas.map(i => ({ _id: i.id, [`flags.${MOD}.almacen.estudioFallido`]: false }))).catch(() => null);
  });
  Hooks.on("renderChatMessageHTML", (msg, html) => {
    const b = html.querySelector?.("[data-ecos-revelar]"); if (!b) return;
    if (!game.user.isGM) return b.closest("p")?.remove();
    b.addEventListener("click", async ev => {
      ev.preventDefault();
      const it = await fromUuid(b.dataset.ecosRevelar).catch(() => null);
      const a = it?.flags?.[MOD]?.almacen; if (!it || Number(a?.etapa) !== 0) return;
      await it.update(identificacion(a), { ecosIdentificar: true });
      ui.notifications.info(`${a.nombre}: identificada (Dormida).`);
    });
  });
  const boton = (cab, clase, icono, texto, tip, fn) => {
    if (cab.querySelector(`.${clase}`)) return;
    const b = document.createElement("button");
    b.type = "button"; b.className = `header-control ${clase}`; b.innerHTML = `<i class="fa-solid ${icono}"></i> ${texto}`; if (tip) b.dataset.tooltip = tip;
    b.addEventListener("click", ev => { ev.preventDefault(); ev.stopPropagation(); Promise.resolve(fn()).catch(err => console.error(`${MOD} | reliquia`, err)); });
    cab.querySelector('[data-action="close"], .close')?.before(b);
  };
  const botones = (app) => {
    const item = app?.document ?? app?.item;
    if (!(item instanceof Item)) return;
    const a = item.flags?.[MOD]?.almacen, rel = item.flags?.[MOD]?.reliquia;
    if (!a && !rel) return;
    const cab = app.element?.querySelector?.(".window-header"); if (!cab) return;
    if (game.user.isGM) {
      if (a?.tipo === "entregar") {
        const e = etapaN(a.etapa ?? 1);
        boton(cab, "ecos-etapa-reliquia-sube", "fa-arrow-up", "Subir etapa", `Etapa ${e.n} · ${e.nombre}. Sube a la siguiente (solo DM).`, () => cambiarEtapa(item, 1));
        boton(cab, "ecos-etapa-reliquia-baja", "fa-arrow-down", "Bajar", "Baja una etapa (revertir).", () => cambiarEtapa(item, -1));
      }
      boton(cab, "ecos-historia-reliquia", "fa-book-skull", "Historia secreta", "Su historia secreta, dónde yace y su misión (diario solo DM).", () => abrirHistoria(item));
    }
    if (a?.tipo === "entregar" && Number(a.etapa) === 0 && item.parent && item.isOwner)
      boton(cab, "ecos-estudiar-reliquia", "fa-magnifying-glass", "Estudiar", "Intenta identificarla (Arcanos, Historia o Investigación).", () => estudiarReliquia(item));
  };
  Hooks.on("renderItemSheetV2", botones);
  Hooks.on("renderItemSheet", botones);
}
