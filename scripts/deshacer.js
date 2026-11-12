/**
 * 3.42 · Deshacer (regla del autor para todo el módulo: lo automático trae al lado un botón para revertirlo). Un mensaje
 * del chat puede llevar en su bandera `deshacer` lo que había antes de un cambio automático; el DM ve un botón
 * «Deshacer» que lo devuelve tal cual. Sirve para el cobro de las capas, la fama y el entrenamiento de los clones.
 */
const MOD = "ecos-frontera";
/** Lo que hay que guardar de un documento antes de cambiarlo (rutas con puntos). Puro salvo la lectura. */
export function fotografia(doc, rutas) {
  const antes = {};
  for (const r of rutas) antes[r] = foundry.utils.getProperty(doc, r);
  return { uuid: doc.uuid, antes };
}
/** Convierte lo guardado en un update de Foundry: lo que no existía se borra con «-=». Puro. */
export function updateDeshacer(antes) {
  const u = {};
  for (const [r, v] of Object.entries(antes ?? {})) {
    if (v === undefined) { const i = r.lastIndexOf("."); u[`${r.slice(0, i)}.-=${r.slice(i + 1)}`] = null; }
    else u[r] = v;
  }
  return u;
}
export const botonDeshacer = () => `<p><button type="button" data-ecos-deshacer><i class="fa-solid fa-rotate-left"></i> Deshacer</button></p>`;
async function deshacer(msg) {
  const d = msg.getFlag(MOD, "deshacer");
  if (!game.user.isGM || !d || msg.getFlag(MOD, "deshecho")) return;
  for (const e of d.cambios ?? []) { const doc = await fromUuid(e.uuid).catch(() => null); if (doc) await doc.update(updateDeshacer(e.antes)).catch(err => console.error(`${MOD} | deshacer`, err)); }
  for (const u of d.borrar ?? []) await (await fromUuid(u).catch(() => null))?.delete().catch(() => null);
  await msg.update({ content: `${msg.content}<p><i>Deshecho por el DM.</i></p>`, [`flags.${MOD}.deshecho`]: true });
}
if (globalThis.Hooks) Hooks.on("renderChatMessageHTML", (msg, html) => {
  const b = html.querySelector?.("[data-ecos-deshacer]");
  if (!b) return;
  if (!game.user.isGM || msg.getFlag(MOD, "deshecho")) return b.closest("p")?.remove() ?? b.remove();
  b.addEventListener("click", ev => { ev.preventDefault(); deshacer(msg).catch(err => console.error(`${MOD} | deshacer`, err)); });
});
