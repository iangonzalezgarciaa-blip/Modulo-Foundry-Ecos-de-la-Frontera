/**
 * 3.63 · Reliquias menores y objetos del Verbe (pedido del autor, 12-nov-2026).
 *  - «Reliquias menores»: los objetos mágicos de siempre de D&D (los compendios del sistema, ya traducidos), sin etapas y
 *    más débiles que las reliquias del Abismo, en una carpeta aparte de Objetos (solo DM) ordenada por el nivel desde el
 *    que conviene darlos: común → nivel 1, poco común → 3, raro → 5, muy raro → 11. Los legendarios y artefactos no
 *    entran (para eso están las reliquias del Abismo y las armas legendarias).
 *  - «Objetos del Verbe»: lo mundano del Verbe (tinta, pergaminos, sellos, agujas, estrellas arrojadizas, hilo, marionetas,
 *    maletín de cirujano) como objetos de verdad, con su precio y el nivel desde el que se suelen tener.
 * Nada se pisa: lo que ya está en la carpeta se salta. Revertir: «Quitar las reliquias menores» (borra solo lo creado).
 */
const MOD = "ecos-frontera";
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
export const NIVEL_RAREZA = { common: 1, uncommon: 3, rare: 5, veryRare: 11 };
export const CARPETA_NIVEL = { 1: "Nivel 1 · comunes", 3: "Nivel 3 · poco comunes", 5: "Nivel 5 · raras", 11: "Nivel 11 · muy raras" };
const TIPOS = new Set(["weapon", "equipment", "consumable", "loot", "container", "tool"]);
export const nivelMenor = rareza => NIVEL_RAREZA[rareza] ?? null;
const norm = s => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
/** De las entradas de los compendios, las que van (mágicas hasta muy raras), una por nombre, la 2024 primero. Puro. */
export function elegirMenores(entradas) {
  const vistos = new Set(), out = [];
  const orden = [...entradas].sort((a, b) => Number(/24/.test(b.pack)) - Number(/24/.test(a.pack)));
  for (const e of orden) {
    const nivel = nivelMenor(e.rareza);
    if (!nivel || !TIPOS.has(e.tipo) || vistos.has(norm(e.nombre))) continue;
    vistos.add(norm(e.nombre)); out.push({ ...e, nivel });
  }
  return out.sort((a, b) => a.nivel - b.nivel || a.nombre.localeCompare(b.nombre, "es"));
}
export const notaMenor = nivel => `<p class="ecos-nota"><b>Reliquia menor</b> · desde nivel ${nivel} · sin etapas. Un objeto mágico de los de siempre: más débil que una reliquia del Abismo.</p>`;
/** Los objetos del Verbe (de la tabla de equipo del catálogo) con su tipo de D&D, precio y nivel. Puro. */
const PERFIL_VERBE = [
  [/^Tinta de Verbe/i, { tipo: "consumable", sub: "trinket", usos: 10, nivel: 1 }],
  [/^Pergamino de técnica/i, { tipo: "consumable", sub: "scroll", nivel: 3 }],
  [/^Sellos de papel/i, { tipo: "consumable", sub: "trinket", cantidad: 5, nivel: 1 }],
  [/^Agujas/i, { tipo: "consumable", sub: "ammo", cantidad: 20, nivel: 1 }],
  [/^Estrellas arrojadizas/i, { tipo: "weapon", cantidad: 5, nivel: 1 }],
  [/^Kunai/i, { tipo: "weapon", cantidad: 5, nivel: 1, dano: "piercing", clase: "simpleM" }],
  [/^Hilo de Verbe/i, { tipo: "loot", nivel: 1 }],
  [/^Pergamino de armas/i, { tipo: "consumable", sub: "scroll", nivel: 3 }],
  [/^Marioneta \(Mediana\)/i, { tipo: "loot", nivel: 3 }],
  [/^Marioneta de guerra/i, { tipo: "loot", nivel: 5 }],
  [/^Blindaje de marioneta/i, { tipo: "loot", nivel: 3 }],
  [/^Muelles de marioneta/i, { tipo: "loot", nivel: 3 }],
  [/^Depósito de marioneta/i, { tipo: "loot", nivel: 5 }],
  [/^Ojos de vidrio/i, { tipo: "loot", nivel: 7 }],
  [/^Maletín de cirujano/i, { tipo: "loot", usos: 10, nivel: 1 }]
];
export function objetoVerbe(e) {
  const p = PERFIL_VERBE.find(([re]) => re.test(e?.objeto ?? ""))?.[1] ?? { tipo: "loot", nivel: 1 };
  const precio = Number(String(e?.precio ?? "").match(/\d+/)?.[0]) || 0;
  const desc = `<p><b>Para qué sirve.</b> ${esc(e.para)}</p><p><b>De dónde sale.</b> ${esc(e.origen)}</p><p class="ecos-nota">Objeto del Verbe · desde nivel ${p.nivel} · precio ${esc(e.precio)}.</p>`;
  const sistema = { description: { value: desc }, quantity: p.cantidad ?? 1, price: { value: precio, denomination: "gp" }, weight: { value: p.tipo === "loot" && /Marioneta/i.test(e.objeto) ? 30 : 0.5, units: "lb" } };
  if (p.usos) sistema.uses = { max: String(p.usos), spent: 0, recovery: [] };
  if (p.tipo === "consumable") sistema.type = { value: p.sub ?? "trinket", subtype: "" };
  if (p.tipo === "weapon") Object.assign(sistema, { type: { value: p.clase ?? "simpleR", baseItem: "" }, damage: { base: { number: 1, denomination: 4, bonus: "", types: [p.dano ?? "slashing"], custom: { enabled: false, formula: "" }, scaling: { mode: "", number: null, formula: "" } } },
    range: { value: 20, long: 60, reach: null, units: "ft" }, properties: ["fin", "lgt", "thr"] });
  return { name: e.objeto, type: p.tipo, img: p.tipo === "weapon" ? "icons/svg/sword.svg" : "icons/svg/item-bag.svg", system: sistema, flags: { [MOD]: { objetoVerbe: { nivel: p.nivel } } } };
}

/* ---------------- Foundry ---------------- */
async function carpeta(nombre, padre = null) {
  return game.folders.find(f => f.type === "Item" && f.name === nombre && (f.folder?.id ?? null) === (padre?.id ?? null))
    ?? Folder.create({ name: nombre, type: "Item", folder: padre?.id ?? null, sorting: "a" });
}
export async function crearReliquiasMenores() {
  if (!game.user.isGM) return null;
  ui.notifications.info("Reliquias menores: leyendo los compendios de objetos de D&D…");
  const packs = [...game.packs].filter(p => p.documentName === "Item" && (p.metadata.packageName === "dnd5e" || p.metadata.system === "dnd5e") && /items|equipment/i.test(p.metadata.name));
  const entradas = [];
  for (const p of packs) {
    const idx = await p.getIndex({ fields: ["system.rarity", "type"] });
    for (const i of idx) entradas.push({ pack: p.collection, id: i._id, nombre: i.name, tipo: i.type, rareza: i.system?.rarity });
  }
  const elegidas = elegirMenores(entradas);
  const raiz = await carpeta("Reliquias menores (solo DM)"), sub = {};
  for (const [n, nombre] of Object.entries(CARPETA_NIVEL)) sub[n] = await carpeta(nombre, raiz);
  const ya = new Set(game.items.filter(i => i.flags?.[MOD]?.menor).map(i => i.flags[MOD].menor.uuid));
  const crear = [], porPack = new Map();
  for (const e of elegidas) { const uuid = `Compendium.${e.pack}.Item.${e.id}`; if (!ya.has(uuid)) (porPack.get(e.pack) ?? porPack.set(e.pack, []).get(e.pack)).push(e); }
  const docs = new Map();
  for (const [col, lista] of porPack) {
    const p = game.packs.get(col);
    const got = await p.getDocuments({ _id__in: lista.map(e => e.id) }).catch(async () => Promise.all(lista.map(e => p.getDocument(e.id))));
    for (const d of got) if (d) docs.set(`${col}|${d.id}`, d);
  }
  for (const e of elegidas) {
    const uuid = `Compendium.${e.pack}.Item.${e.id}`, doc = docs.get(`${e.pack}|${e.id}`); if (!doc || ya.has(uuid)) continue;
    const d = game.items.fromCompendium ? game.items.fromCompendium(doc) : doc.toObject();
    d.folder = sub[e.nivel].id; d.ownership = { default: 0 };
    foundry.utils.setProperty(d, "system.description.value", notaMenor(e.nivel) + (d.system?.description?.value ?? ""));
    foundry.utils.setProperty(d, `flags.${MOD}.menor`, { nivel: e.nivel, uuid });
    crear.push(d);
  }
  for (let i = 0; i < crear.length; i += 100) await Item.createDocuments(crear.slice(i, i + 100));
  // Objetos del Verbe
  const D = game.modules.get(MOD)?.api?.verbe?.datos?.();
  const fVerbe = await carpeta("Objetos del Verbe");
  const yaV = new Set(game.items.filter(i => i.flags?.[MOD]?.objetoVerbe).map(i => i.name));
  const verbe = (D?.equipo ?? []).filter(e => !yaV.has(e.objeto)).map(e => ({ ...objetoVerbe(e), folder: fVerbe.id }));
  if (verbe.length) await Item.createDocuments(verbe);
  ui.notifications.info(`Reliquias menores: ${crear.length} nuevas (de ${elegidas.length}). Objetos del Verbe: ${verbe.length} nuevos. Están en Objetos.`);
  return { menores: crear.length, verbe: verbe.length };
}
/** Revertir: borra solo lo que creó esta herramienta (y sus carpetas si quedan vacías). */
export async function quitarReliquiasMenores() {
  if (!game.user.isGM) return 0;
  const ok = await foundry.applications.api.DialogV2.confirm({ window: { title: "Quitar las reliquias menores" }, content: "<p>Se borran de Objetos las reliquias menores y los objetos del Verbe que creó el módulo (las copias que ya están en hojas no se tocan). ¿Seguro?</p>" });
  if (!ok) return 0;
  const ids = game.items.filter(i => i.flags?.[MOD]?.menor || i.flags?.[MOD]?.objetoVerbe).map(i => i.id);
  for (let i = 0; i < ids.length; i += 100) await Item.deleteDocuments(ids.slice(i, i + 100));
  for (const nombre of ["Reliquias menores (solo DM)", "Objetos del Verbe"]) {
    const f = game.folders.find(x => x.type === "Item" && x.name === nombre && !x.folder);
    if (f && !game.items.some(i => i.folder?.id === f.id || i.folder?.folder?.id === f.id)) await f.delete({ deleteSubfolders: true, deleteContents: false }).catch(() => null);
  }
  ui.notifications.info(`Quitados ${ids.length} objetos.`);
  return ids.length;
}
if (globalThis.Hooks) Hooks.once("ready", () => { const api = game.modules.get(MOD)?.api; if (api) Object.assign(api, { reliquiasMenores: crearReliquiasMenores, quitarReliquiasMenores }); });
