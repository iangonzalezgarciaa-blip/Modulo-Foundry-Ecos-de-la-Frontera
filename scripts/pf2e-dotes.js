/**
 * 3.52 · Dotes, razas y objetos de PF2e nivelados a D&D (pedido del autor, 12-nov-2026).
 * `tools/pf2e/convertir_dotes.py` deja en el PC del autor, en `Data/ecos-pf2e/`, tres archivos ya en formato dnd5e:
 *   dotes-dnd5e.json   dotes menores (generales, de habilidad, de ascendencia y de clase), con nivel y requisitos en flags
 *   razas-dnd5e.json   especies nuevas (las de D&D se omiten) y sus herencias
 *   objetos-dnd5e.json objetos nuevos: venenos por etapas, alquímicos, pociones, armas, armaduras, equipo y tesoros
 * El DM los lleva a tres compendios del mundo (solo, al cargar, si cambiaron; o con el botón de la Mesa).
 * El texto es de Paizo (ORC u OGL, citado en cada objeto): no está en este repositorio.
 */
const MOD = "ecos-frontera";
export const PACKS = {
  dotes: { name: "ecos-dotes-pf2e", label: "Dotes de PF2e (Ecos)", ruta: "ecos-pf2e/dotes-dnd5e.json", clave: "dotes" },
  razas: { name: "ecos-razas-pf2e", label: "Especies y herencias de PF2e (Ecos)", ruta: "ecos-pf2e/razas-dnd5e.json", clave: "razas" },
  objetos: { name: "ecos-objetos-pf2e", label: "Objetos de PF2e (Ecos)", ruta: "ecos-pf2e/objetos-dnd5e.json", clave: "objetos" }
};
const VERSION_IMPORTADOR = 1;
const CATEGORIA = { general: "Generales", skill: "De habilidad", ancestry: "De ascendencia", class: "De clase" };
const CLASE_ES = { barbarian: "Bárbaro", bard: "Bardo", paladin: "Paladín", cleric: "Clérigo", druid: "Druida", fighter: "Guerrero", monk: "Monje",
  ranger: "Explorador", rogue: "Pícaro", sorcerer: "Hechicero", wizard: "Mago", warlock: "Brujo" };
const lista = x => Array.from(x?.contents ?? x ?? []);
const soyDM = () => game.users.activeGM ? game.users.activeGM.isSelf : game.user.isGM;

/** La carpeta de cada documento dentro de su compendio. Puro. */
export function carpetaDe(tipo, doc) {
  const f = doc?.flags?.[MOD]?.pf2e ?? {};
  if (tipo === "dotes") {
    const c = CATEGORIA[f.categoria] ?? "Otras";
    if (f.categoria === "class") return [c, CLASE_ES[f.clase?.[0]] ?? "Varias"];
    if (f.categoria === "ancestry") return [c, (f.ascendencia?.[0] ?? "varias").replace(/^./, x => x.toUpperCase())];
    return [c, `Nivel ${f.nivel ?? 1}`];
  }
  if (tipo === "razas") return [f.tipo === "herencia" ? (f.versatil ? "Herencias versátiles" : "Herencias") : "Especies"];
  return [f.grupo ?? "Otros"];
}

async function carpeta(pack, ruta, cache) {
  let padre = null;
  for (const nombre of ruta) {
    const k = `${padre ?? ""}/${nombre}`;
    if (!cache.has(k)) {
      const ya = lista(pack.folders).find(f => f.name === nombre && (f.folder?.id ?? null) === padre);
      cache.set(k, ya?.id ?? (await Folder.implementation.create({ name: nombre, type: "Item", sorting: "a", folder: padre }, { pack: pack.collection })).id);
    }
    padre = cache.get(k);
  }
  return padre;
}
/** Lleva un archivo a su compendio (rehace lo del módulo; lo que el DM agregó a mano en ese compendio se queda). */
export async function importarPF2e(tipo, { forzar = false, avisar = true } = {}) {
  if (!soyDM()) return { ok: false, motivo: "Solo el DM." };
  const P = PACKS[tipo];
  let datos;
  try {
    const r = await fetch(foundry.utils.getRoute(P.ruta), { cache: "no-store" });
    if (!r.ok) return { ok: false, motivo: `No está ${P.ruta} en tu carpeta de datos.` };
    datos = await r.json();
  } catch { return { ok: false, motivo: `No se pudo leer ${P.ruta}.` }; }
  const previo = (game.settings.get(MOD, "pf2eImportado") ?? {})[tipo] ?? {};
  if (!forzar && previo.huella === datos.huella && previo.version === VERSION_IMPORTADOR && game.packs.get(`world.${P.name}`)) return { ok: true, ya: true, total: previo.total };
  const CC = foundry.documents.collections.CompendiumCollection;
  if (avisar) ui.notifications.info(`Ecos: llevando ${datos.total} ${P.label.toLowerCase()} al compendio. Tarda unos minutos; no cierres Foundry.`);
  const pack = game.packs.get(`world.${P.name}`) ?? await CC.createCompendium({ type: "Item", label: P.label, name: P.name });
  if (pack.locked) await pack.configure({ locked: false });
  const docs = datos[P.clave] ?? [];
  const nuestros = new Set(docs.map(d => d._id));
  const borrar = lista(await pack.getIndex()).map(e => e._id).filter(id => nuestros.has(id));
  for (let i = 0; i < borrar.length; i += 250) await Item.implementation.deleteDocuments(borrar.slice(i, i + 250), { pack: pack.collection });
  const cache = new Map(), listos = [];
  for (const d of docs) listos.push({ ...d, folder: await carpeta(pack, carpetaDe(tipo, d), cache) });
  for (let i = 0; i < listos.length; i += 100) await Item.implementation.createDocuments(listos.slice(i, i + 100), { pack: pack.collection, keepId: true });
  const todo = foundry.utils.deepClone(game.settings.get(MOD, "pf2eImportado") ?? {});
  todo[tipo] = { huella: datos.huella, version: VERSION_IMPORTADOR, total: datos.total, fecha: new Date().toISOString() };
  await game.settings.set(MOD, "pf2eImportado", todo);
  if (avisar) ui.notifications.info(`Ecos: ${datos.total} en «${P.label}».`);
  return { ok: true, total: datos.total };
}
export async function importarTodoPF2e(opciones = {}) {
  const r = {};
  for (const t of Object.keys(PACKS)) r[t] = await importarPF2e(t, opciones).catch(err => ({ ok: false, motivo: err.message }));
  return r;
}
if (globalThis.Hooks) {
  Hooks.once("init", () => game.settings.register(MOD, "pf2eImportado", { scope: "world", config: false, type: Object, default: {} }));
  Hooks.once("ready", () => {
    const api = game.modules.get(MOD)?.api; if (api) api.pf2eDotes = { importar: importarPF2e, importarTodo: importarTodoPF2e, packs: PACKS };
    if (soyDM() && game.system.id === "dnd5e") setTimeout(() => importarTodoPF2e({ avisar: true }).then(r => {
      for (const [t, x] of Object.entries(r)) if (x?.ok === false && !/No está/.test(x.motivo)) console.warn(`${MOD} | PF2e ${t}:`, x.motivo);
    }).catch(err => console.error(`${MOD} | dotes de PF2e`, err)), 20000);
  });
}
