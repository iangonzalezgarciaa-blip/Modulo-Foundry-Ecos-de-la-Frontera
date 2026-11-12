/**
 * 3.41 · Traducir fichas (pedido del autor: «pasa D&D a español en todas sus clases y acciones»). Las fichas que se
 * armaron antes de activar la traducción de los compendios guardan los textos en inglés. Esto vuelve a leer cada objeto
 * de su compendio de origen (ya traducido por Babele) y le copia el nombre, la descripción y el nombre de sus
 * actividades. Solo toca objetos que vienen de un compendio del sistema D&D, y solo si su texto es distinto.
 */
const MOD = "ecos-frontera";
/** Los cambios para un objeto a partir de su fuente traducida. Puro: recibe datos planos.
 * 3.51: solo traduce lo que sigue en inglés (su nombre es el original del compendio, que Babele guarda en
 * flags.babele.originalName). Un nombre propio o ya en español («Martillo de forja», «Relámpago») no se toca. */
export function cambiosTraduccion(item, fuente) {
  if (!item || !fuente) return null;
  const original = fuente.flags?.babele?.originalName;
  if (original && item.name !== original) return null;
  if (!original && esEspanol(item.name)) return null;
  const c = {};
  if (fuente.name && fuente.name !== item.name) c.name = fuente.name;
  const dF = fuente.system?.description?.value, dI = item.system?.description?.value;
  if (dF && dF !== dI) c["system.description.value"] = dF;
  for (const [id, act] of Object.entries(fuente.system?.activities ?? {})) {
    const mia = item.system?.activities?.[id];
    if (mia && act?.name && act.name !== mia.name) c[`system.activities.${id}.name`] = act.name;
  }
  return Object.keys(c).length ? { _id: item._id ?? item.id, ...c } : null;
}
export const esFuenteDnd = src => typeof src === "string" && src.startsWith("Compendium.dnd5e.");
/** ¿Ya está en español? (tildes, ñ o palabras de enlace). Puro. */
export const esEspanol = n => /[áéíóúñü¿¡]/i.test(String(n ?? "")) || /\b(de|del|la|el|los|las|con|sin|para|y)\b/i.test(String(n ?? ""));
const plano = d => d?.toObject?.() ?? d;

export async function traducirFichas({ soloPJ = true, soloInforme = false } = {}) {
  if (!game.user.isGM) return null;
  const actores = game.actors.filter(a => soloPJ ? (a.type === "character" || a.hasPlayerOwner) : true);
  const cache = new Map(), informe = { actores: 0, objetos: 0, ejemplos: [] }, respaldo = [];
  for (const a of actores) {
    const cambios = [];
    for (const it of a.items) {
      const src = it._stats?.compendiumSource ?? it.flags?.core?.sourceId;
      if (!esFuenteDnd(src)) continue;
      if (!cache.has(src)) cache.set(src, plano(await fromUuid(src).catch(() => null)));
      const c = cambiosTraduccion(plano(it), cache.get(src));
      if (c) {
        cambios.push(c);
        const antes = {}; for (const k of Object.keys(c)) if (k !== "_id") antes[k] = foundry.utils.getProperty(it, k);
        respaldo.push({ actor: a.uuid, item: it.id, antes });
        if (informe.ejemplos.length < 12 && c.name) informe.ejemplos.push(`${a.name}: ${it.name} → ${c.name}`);
      }
    }
    if (!cambios.length) continue;
    informe.actores++; informe.objetos += cambios.length;
    if (!soloInforme) await a.updateEmbeddedDocuments("Item", cambios).catch(err => console.error(`${MOD} | traducir ${a.name}`, err));
  }
  // 3.51: respaldo para «Deshacer la última traducción» (regla del autor: todo lo automático se revierte).
  if (!soloInforme && respaldo.length) {
    try {
      const FP = foundry.applications?.apps?.FilePicker?.implementation ?? FilePicker;
      await FP.createDirectory("data", "ecos-respaldos").catch(() => null);
      const nombre = `traduccion-${Date.now()}.json`;
      await FP.upload("data", "ecos-respaldos", new File([JSON.stringify(respaldo)], nombre, { type: "application/json" }), {}, { notify: false });
      await game.settings.set(MOD, "traduccionRespaldo", `ecos-respaldos/${nombre}`);
    } catch (err) { console.error(`${MOD} | respaldo de la traducción`, err); }
  }
  return informe;
}
/** Devuelve los nombres y textos que había antes de la última traducción. */
export async function deshacerTraduccion() {
  if (!game.user.isGM) return;
  const ruta = game.settings.get(MOD, "traduccionRespaldo");
  if (!ruta) return ui.notifications.warn("No hay una traducción que deshacer.");
  const resp = await (await fetch(`/${ruta}?v=${Date.now()}`, { cache: "no-store" })).json().catch(() => null);
  if (!Array.isArray(resp)) return ui.notifications.warn("No encuentro el respaldo de la traducción.");
  const porActor = new Map();
  for (const r of resp) {
    const actor = await fromUuid(r.actor).catch(() => null);
    if (!actor?.items?.get(r.item)) continue;
    (porActor.get(actor) ?? porActor.set(actor, []).get(actor)).push({ _id: r.item, ...r.antes });
  }
  let n = 0;
  for (const [actor, us] of porActor) { await actor.updateEmbeddedDocuments("Item", us).catch(err => console.error(`${MOD} | deshacer traducción`, err)); n += us.length; }
  await game.settings.set(MOD, "traduccionRespaldo", "");
  ui.notifications.info(`Deshecha la traducción de ${n} objetos.`);
}
export async function abrirTraducir() {
  if (!game.user.isGM) return;
  const babele = game.modules.get("babele")?.active, trad = game.modules.get("translate-dnd5e-sdr2-es")?.active;
  const r = await foundry.applications.api.DialogV2.wait({ window: { title: "Traducir fichas al español", icon: "fa-solid fa-language" }, position: { width: 520 },
    content: `<div class="ecos-dialogo"><p>Copia a cada ficha el nombre y la descripción en español de sus rasgos, clases, conjuros y objetos, leyéndolos de su compendio de D&D ya traducido. Sirve para las fichas que se armaron antes de activar la traducción.</p>
      <p>${babele && trad ? "✓ Babele y la traducción de los compendios están activos." : `<b>Falta activar ${babele ? "" : "Babele "}${trad ? "" : "y «translate-dnd5e-sdr2-es»"}</b> en Configuración → Módulos; si no, no hay de dónde copiar el español.`}</p>
      <label><input type="radio" name="alcance" value="pj" checked> Solo las fichas de los jugadores</label><br><label><input type="radio" name="alcance" value="todo"> Todas las fichas del mundo (tarda más)</label>
      <p class="ecos-nota">Primero sale un informe con lo que cambiaría; después confirmas.</p></div>`,
    buttons: [{ action: "ok", label: "Ver qué cambiaría", default: true, callback: (_e, b) => Object.fromEntries(new FormData(b.form)) },
      ...(game.settings.get(MOD, "traduccionRespaldo") ? [{ action: "deshacer", label: "Deshacer la última traducción", icon: "fa-solid fa-rotate-left" }] : []),
      { action: "no", label: "Cancelar" }], rejectClose: false });
  if (r === "deshacer") return deshacerTraduccion();
  if (!r || r === "no") return;
  const soloPJ = r.alcance !== "todo";
  const inf = await traducirFichas({ soloPJ, soloInforme: true });
  if (!inf?.objetos) return ui.notifications.info("No hay nada que traducir: las fichas ya están como sus compendios.");
  const ok = await foundry.applications.api.DialogV2.confirm({ window: { title: "Traducir fichas" },
    content: `<p>${inf.objetos} objetos en ${inf.actores} fichas cambiarían. Por ejemplo:</p><ul>${inf.ejemplos.map(x => `<li>${foundry.utils.escapeHTML?.(x) ?? x}</li>`).join("")}</ul><p>¿Los traduzco? (Lo que escribiste a mano en una descripción se reemplaza por la del compendio.)</p>` });
  if (!ok) return;
  const fin = await traducirFichas({ soloPJ });
  ui.notifications.info(`Traducidos ${fin.objetos} objetos en ${fin.actores} fichas.`);
}
if (globalThis.Hooks) {
  Hooks.once("init", () => game.settings.register(MOD, "traduccionRespaldo", { scope: "world", config: false, type: String, default: "" }));
  Hooks.once("ready", () => { const api = game.modules.get(MOD)?.api; if (api) { api.traducirFichas = traducirFichas; api.abrirTraducir = abrirTraducir; api.deshacerTraduccion = deshacerTraduccion; } });
}
