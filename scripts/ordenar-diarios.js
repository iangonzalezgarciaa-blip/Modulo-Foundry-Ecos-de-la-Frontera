/**
 * Ordenar los diarios sueltos (3.13, pedido del autor). Los diarios del DM que crea Ecos (panteón, compendio, reliquias,
 * memoria, cuaderno, pruebas) se mueven, si están sueltos en la raíz, a la carpeta del DM que ya existe
 * («Mesa, tramas y personajes [DM]»), numerados a continuación de los que hay. Si la carpeta no existe, se crea
 * «Ecos (solo DM)». «sequencerDatabase» va a «Módulos (no tocar)» si esa carpeta existe. Nunca toca un diario que ya
 * esté en una carpeta, ni renombra uno que el DM haya renombrado.
 */
const MOD = "ecos-frontera";
export const PROPIOS = [
  ["panteonDM", "Ecos · Panteón y sangre divina"], ["compendioDM", "Ecos · Compendio del Verbe"], ["reliquiasDM", "Ecos · Archivo de reliquias"],
  ["memoriaNimerios", "Ecos · Identidad y memoria de Nimerios"], ["cuadernoMesa", "Ecos · Cuaderno privado de sesión"], ["pruebasMesa", "Ecos · Pruebas reales de mesa"]
];
const numero = n => { const m = /^(\d+)\s*·/.exec(String(n ?? "")); return m ? Number(m[1]) : null; };

/**
 * Qué mover y cómo llamarlo. Puro.
 * @param {{id, name, folder, flags, sort}[]} diarios  todos los diarios del mundo
 * @param {{id, name}[]} enCarpeta                     los que ya están en la carpeta destino
 * @returns {{_id, folder: true, name, sort}[]}  `folder: true` = a la carpeta destino
 */
export function planOrden(diarios, enCarpeta) {
  let siguiente = Math.max(-1, ...enCarpeta.map(d => numero(d.name)).filter(n => n != null)) + 1;
  let orden = Math.max(0, ...enCarpeta.map(d => Number(d.sort) || 0));
  const fuera = [];
  for (const [bandera, base] of PROPIOS) {
    const d = diarios.find(x => !x.folder && x.flags?.[MOD]?.[bandera]);
    if (!d) continue;
    const nombre = String(d.name ?? "").startsWith("Ecos · ") ? `${siguiente++} · ${base}` : d.name;
    orden += 100000;
    fuera.push({ _id: d.id, folder: true, name: nombre, sort: orden });
  }
  return fuera;
}

export async function ordenarDiarios() {
  if (!game.user?.isGM || (game.users?.activeGM && !game.users.activeGM.isSelf)) return 0;
  const todos = Array.from(game.journal ?? []);
  const sueltos = todos.filter(j => !j.folder && PROPIOS.some(([b]) => j.getFlag(MOD, b)));
  let n = 0;
  if (sueltos.length) {
    let carpeta = game.folders.find(f => f.type === "JournalEntry" && /^Mesa, tramas y personajes/i.test(f.name));
    carpeta ??= game.folders.find(f => f.type === "JournalEntry" && f.name === "Ecos (solo DM)") ?? await Folder.create({ name: "Ecos (solo DM)", type: "JournalEntry" });
    const enCarpeta = todos.filter(j => j.folder?.id === carpeta.id).map(j => ({ id: j.id, name: j.name, sort: j.sort }));
    const plan = planOrden(todos.map(j => ({ id: j.id, name: j.name, folder: j.folder?.id ?? null, flags: j.flags, sort: j.sort })), enCarpeta);
    if (plan.length) await JournalEntry.updateDocuments(plan.map(p => ({ ...p, folder: carpeta.id })));
    n += plan.length;
  }
  const seq = todos.find(j => !j.folder && j.name === "sequencerDatabase");
  const modulos = game.folders.find(f => f.type === "JournalEntry" && /^Módulos/i.test(f.name));
  if (seq && modulos) { await seq.update({ folder: modulos.id }); n++; }
  return n;
}

if (globalThis.Hooks) Hooks.once("ready", () => {
  (game.modules.get(MOD).api ??= {}).ordenarDiarios = ordenarDiarios;
  // Después de que los demás creen sus diarios.
  setTimeout(() => ordenarDiarios().catch(err => console.error(`${MOD} | ordenar diarios`, err)), 8000);
});
