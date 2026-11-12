/**
 * 3.67 · Hilo ligado a las herramientas shinobi (pedido del autor, 12-nov-2026). Cada técnica de Hilo dice qué
 * herramienta usa (agujas, kunai, rollo de Hilo de Verbe, marioneta, sellos de papel, pergamino de armas, tinta…).
 *  - Al usarla, si la herramienta es de gasto (agujas, sellos de papel, tinta) y la hoja la tiene, se descuenta y el
 *    chat trae «Deshacer» (DM). Si no la tiene, avisa: el DM decide si la técnica sale igual (no se bloquea).
 *  - Ajuste «herramientasShinobi» (DM) para apagarlo: entonces solo queda el texto de la ficha.
 * Las reglas son puras; la parte de Foundry engancha `dnd5e.postUseActivity`.
 */
const MOD = "ecos-frontera";
export const HERRAMIENTA_NOMBRE = {
  arrojadiza: "un arma arrojadiza (kunai, estrellas o agujas)", agujas: "Agujas", hilo: "un rollo de Hilo de Verbe", pergamino: "un Pergamino de armas",
  marioneta: "una Marioneta", sellos: "Sellos de papel", arma: "un arma", reliquia: "su reliquia", tinta: "Tinta de Verbe"
};
/** Qué objeto de la hoja cuenta como la herramienta. `null` = no se comprueba. */
export const HERRAMIENTA_BUSCA = {
  arrojadiza: i => i?.type === "weapon" && (Array.from(i.system?.properties ?? []).includes("thr") || /kunai|estrella|aguja|dardo|daga/i.test(i.name ?? "")),
  agujas: i => /\bagujas?\b/i.test(i?.name ?? "") && !/marioneta|cirujano/i.test(i?.name ?? ""),
  hilo: i => /hilo de verbe/i.test(i?.name ?? ""),
  pergamino: i => /pergamino de armas/i.test(i?.name ?? ""),
  marioneta: i => /marioneta/i.test(i?.name ?? "") && !/blindaje|muelles|dep[oó]sito|ojos de vidrio/i.test(i?.name ?? ""),
  sellos: i => /sellos? de papel/i.test(i?.name ?? ""),
  tinta: i => /tinta de verbe/i.test(i?.name ?? ""),
  arma: i => i?.type === "weapon",
  reliquia: null
};
/** Cuánto gasta cada uso: `cantidad` (unidades) o `usos` (cargas del objeto). */
export const GASTO_HERRAMIENTA = { agujas: { cantidad: 10, devuelve: 5 }, sellos: { cantidad: 1 }, tinta: { usos: 1 } };
const lista = x => Array.from(x?.contents ?? x ?? []);
/** La herramienta que tiene la hoja para esa clave; `true` si no se comprueba; `null` si falta. Puro. */
export function buscarHerramienta(items, clave) {
  const f = HERRAMIENTA_BUSCA[clave];
  if (f === null || f === undefined) return true;
  return lista(items).find(i => f(i) && (Number(i.system?.quantity ?? 1) > 0)) ?? null;
}
/**
 * Lo que hay que cambiar en la herramienta al usar la técnica: { ruta, antes, despues } o null. Puro.
 * Las agujas: 10 por uso (se recupera la mitad al terminar: lo apunta el chat).
 */
export function gastoDe(item, clave) {
  const g = GASTO_HERRAMIENTA[clave];
  if (!g || !item || item === true) return null;
  if (g.cantidad) {
    const antes = Number(item.system?.quantity ?? 0);
    return { ruta: "system.quantity", antes, despues: Math.max(0, antes - g.cantidad), devuelve: g.devuelve ?? 0 };
  }
  if (g.usos) {
    const max = Number(item.system?.uses?.max) || 0, antes = Number(item.system?.uses?.spent ?? 0);
    if (!max) return null;
    return { ruta: "system.uses.spent", antes, despues: Math.min(max, antes + g.usos) };
  }
  return null;
}

/* ---------------- Foundry ---------------- */
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
async function alUsar(activity) {
  const item = activity?.item, actor = activity?.actor ?? item?.actor;
  const clave = item?.flags?.[MOD]?.verbe?.herramienta;
  if (!clave || !actor || !game.settings.get(MOD, "herramientasShinobi")) return;
  if (!actor.isOwner) return; // postUseActivity solo corre en quien usó la técnica.
  const h = buscarHerramienta(actor.items, clave);
  const quien = { speaker: ChatMessage.getSpeaker({ actor }), whisper: [game.user.id, ...game.users.filter(u => u.isGM).map(u => u.id)] };
  if (!h) {
    return ChatMessage.create({ ...quien, content: `<div class="ecos-dialogo"><p><b>${esc(item.name)}</b>: ${esc(actor.name)} no lleva ${esc(HERRAMIENTA_NOMBRE[clave] ?? clave)}.</p><p class="ecos-nota">Lo que pasa sin ella lo dice la ficha («Herramienta»); el DM decide si la técnica sale igual.</p></div>` });
  }
  const g = gastoDe(h, clave);
  if (!g || g.antes === g.despues) return;
  await h.update({ [g.ruta]: g.despues });
  const { botonDeshacer } = await import("./deshacer.js");
  await ChatMessage.create({ ...quien, flags: { [MOD]: { deshacer: { cambios: [{ uuid: h.uuid, antes: { [g.ruta]: g.antes } }] } } },
    content: `<div class="ecos-dialogo"><p><b>${esc(item.name)}</b> gasta ${g.ruta === "system.quantity" ? `${g.antes - g.despues} ${esc(h.name)} (quedan ${g.despues})` : `un uso de ${esc(h.name)}`}.${g.devuelve ? ` Al terminar la pelea se recuperan ${g.devuelve} (súmalas a mano si las recogéis).` : ""}</p>${botonDeshacer()}</div>` });
}
if (globalThis.Hooks) {
  Hooks.once("init", () => {
    game.settings.register(MOD, "herramientasShinobi", { name: "Hilo: herramientas del Verbe", hint: "Al usar una técnica de Hilo, descuenta su herramienta de gasto (agujas, sellos de papel, tinta) con «Deshacer», o avisa si la hoja no la lleva. Apagado: solo queda el texto de la ficha.", scope: "world", config: true, type: Boolean, default: true });
  });
  Hooks.on("dnd5e.postUseActivity", activity => { alUsar(activity).catch(err => console.error(`${MOD} | herramientas shinobi`, err)); });
}
