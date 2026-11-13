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
/**
 * 3.71 (prueba en el mundo): los PG se deshacen sumando lo que se quitó, no volviendo a un valor fijo: si entre medio
 * otra cosa cambió los PG (un estado que quema, otra técnica), «Deshacer» solo devuelve lo suyo. Puro.
 * `actual` = valores de ahora; `sumar` = { ruta: cantidad }; `max` = PG máximos (para no pasarse).
 */
/**
 * 3.72 (prueba en el mundo): Foundry guarda las banderas de un mensaje expandiendo las claves con puntos
 * («system.attributes.hp.value» llega como { system: { attributes: … } }). Sin aplanarlas, «Deshacer» escribía `system: 0`
 * y dejaba la ficha en 0 PG y CA 10. Puro.
 */
export function aplanar(obj, prefijo = "") {
  const out = {};
  for (const [k, v] of Object.entries(obj ?? {})) {
    const r = prefijo ? `${prefijo}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) Object.assign(out, aplanar(v, r));
    else out[r] = v;
  }
  return out;
}
export function updateSumar(actual, sumar, max = Infinity) {
  const u = {};
  for (const [r, n] of Object.entries(aplanar(sumar))) {
    // Solo números: nunca se escribe sobre algo que no sea un valor numérico de la ficha.
    if (!Number.isFinite(Number(n)) || (actual?.[r] !== undefined && actual?.[r] !== null && !Number.isFinite(Number(actual[r])))) continue;
    let v = (Number(actual?.[r]) || 0) + (Number(n) || 0);
    if (/hp\.value$/.test(r)) v = Math.min(Number(max) || Infinity, v);
    u[r] = /hp\.(value|temp)$/.test(r) ? Math.max(0, v) : v; // 3.73: el Verbe puede quedar en negativo; solo los PG no bajan de 0.
  }
  return u;
}
async function deshacer(msg) {
  const d = msg.getFlag(MOD, "deshacer");
  if (!game.user.isGM || !d || msg.getFlag(MOD, "deshecho")) return;
  for (const e of d.cambios ?? []) { const doc = await fromUuid(e.uuid).catch(() => null); if (doc) await doc.update(updateDeshacer(e.antes)).catch(err => console.error(`${MOD} | deshacer`, err)); }
  for (const e of d.sumar ?? []) {
    const doc = await fromUuid(e.uuid).catch(() => null); if (!doc) continue;
    const actual = Object.fromEntries(Object.keys(aplanar(e.sumar)).map(r => [r, foundry.utils.getProperty(doc, r)]));
    await doc.update(updateSumar(actual, e.sumar, doc.system?.attributes?.hp?.max)).catch(err => console.error(`${MOD} | deshacer`, err));
  }
  for (const u of d.borrar ?? []) await (await fromUuid(u).catch(() => null))?.delete().catch(() => null);
  await msg.update({ content: `${msg.content}<p><i>Deshecho por el DM.</i></p>`, [`flags.${MOD}.deshecho`]: true });
}
if (globalThis.Hooks) Hooks.on("renderChatMessageHTML", (msg, html) => {
  const b = html.querySelector?.("[data-ecos-deshacer]");
  if (!b) return;
  if (!game.user.isGM || msg.getFlag(MOD, "deshecho")) return b.closest("p")?.remove() ?? b.remove();
  b.addEventListener("click", ev => { ev.preventDefault(); deshacer(msg).catch(err => console.error(`${MOD} | deshacer`, err)); });
});
