/**
 * Monedas Antiguas (3.12, pedido del autor): todo lo raro o fuerte del mundo tiene precio en Monedas.
 *  - En el panel del Verbe: 1 Moneda = 1 Trazo, como mucho 2 en cada nivel (la regla de la guía del Verbe; desde 3.17).
 *  - El mercader extraño: el único que acepta Monedas. El DM sortea un surtido de 15 objetos raros o fuertes
 *    (reliquias del Archivo y objetos mágicos de los compendios) y lo muestra en el chat; los jugadores compran desde
 *    la tarjeta. También compra lo raro que le traigan: las reliquias, a precio entero; lo demás, a mitad.
 * Las cuentas son puras. Las compras las hace el DM principal por socket, para que nadie gaste lo que no tiene.
 */
import { sistema } from "./sistema/index.js";
const MOD = "ecos-frontera";
export const PRECIO = { uncommon: 1, rare: 2, veryRare: 4, legendary: 7 };
export const NOMBRE_RAREZA = { uncommon: "poco común", rare: "rara", veryRare: "muy rara", legendary: "legendaria" };
// La regla del Verbe (guía de jugadores): 1 Moneda Antigua = 1 Trazo, como mucho 2 en cada nivel. En 3.12 este botón
// cobraba 2 por Trazo con otra cuenta; desde 3.17 usa la misma regla y la misma cuenta que el panel del Verbe.
export const MONEDAS_POR_TRAZO = 1, TRAZOS_POR_NIVEL = 2, SURTIDO = 15;
const PESO = { uncommon: 4, rare: 3, veryRare: 2, legendary: 1 };

/** Lo que cuesta en Monedas (null si no se vende: común, artefacto o sin rareza). Las reliquias del Archivo, 1 más. */
export const precioMonedas = (rareza, reliquia = false) => (PRECIO[rareza] ? PRECIO[rareza] + (reliquia ? 1 : 0) : null);
/** Lo que paga el mercader: busca reliquias, así que esas las paga enteras; lo demás, a mitad (mínimo 1). */
export const pagoPorVenta = (rareza, reliquia = false) => { const p = precioMonedas(rareza, reliquia); return p == null ? null : reliquia ? p : Math.max(1, Math.floor(p / 2)); };

/** Cuántos Trazos se pueden comprar ahora: una Moneda por Trazo y como mucho 2 en el nivel actual. */
export function trazosComprables(monedas, yaEsteNivel = 0) {
  const porMonedas = Math.floor((Number(monedas) || 0) / MONEDAS_POR_TRAZO);
  return Math.max(0, Math.min(porMonedas, TRAZOS_POR_NIVEL - (Number(yaEsteNivel) || 0)));
}

/** Surtido al azar, sin repetir, con más cosas poco comunes que legendarias. `rng` devuelve [0, 1). */
export function sortearSurtido(candidatos, n = SURTIDO, rng = Math.random) {
  const bolsa = (candidatos ?? []).filter(c => PRECIO[c.rareza]).map(c => ({ ...c }));
  const fuera = [];
  while (fuera.length < n && bolsa.length) {
    const total = bolsa.reduce((t, c) => t + (PESO[c.rareza] ?? 1), 0);
    let x = rng() * total, i = 0;
    for (; i < bolsa.length - 1; i++) { x -= PESO[bolsa[i].rareza] ?? 1; if (x < 0) break; }
    const [c] = bolsa.splice(i, 1);
    fuera.push({ ...c, precio: precioMonedas(c.rareza, c.reliquia), vendido: false });
  }
  return fuera;
}

const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
/** La tarjeta del chat con el surtido. */
export function tarjetaMercaderHTML(surtido) {
  const filas = (surtido?.items ?? []).map((x, i) => `<li class="${x.vendido ? "vendido" : ""}"><img src="${esc(x.img)}" alt="" width="28" height="28">
    <span><b>${esc(x.name)}</b> <small>${esc(NOMBRE_RAREZA[x.rareza] ?? x.rareza)}${x.reliquia ? " · reliquia" : ""}</small></span>
    ${x.vendido ? `<em>Vendido${x.comprador ? ` a ${esc(x.comprador)}` : ""}</em>` : `<button type="button" data-ecos-mercader="comprar" data-i="${i}">${x.precio} Moneda${x.precio === 1 ? "" : "s"}</button>`}</li>`).join("");
  return `<section class="ecos-mercader"><h3>El mercader extraño</h3>
<p><em>Un hombre que huele a lámpara apagada. Mira tus manos antes que tu cara. «Solo acepto Monedas Antiguas. Yo sé qué hacer con estas cosas.»</em></p>
<ul class="ecos-mercader-lista">${filas || "<li>Hoy no trae nada.</li>"}</ul>
<p><button type="button" data-ecos-mercader="vender">Venderle algo raro</button> <small>Paga las reliquias enteras y lo demás a mitad.</small></p></section>`;
}

/* ---------- Foundry ---------- */
const soyDM = () => !!game.user?.isGM && (game.users?.activeGM ? game.users.activeGM.isSelf : true);
const monedas = actor => sistema.moneda(actor);
const nivelDe = actor => sistema.nivel(actor);
const esReliquia = item => !!(item?.flags?.[MOD]?.reliquia ?? item?.getFlag?.(MOD, "reliquia"));
const rarezaDe = item => item?.system?.rarity ?? null;
const personaje = () => game.user?.character ?? canvas?.tokens?.controlled?.[0]?.actor ?? null;

/** Reliquias del Archivo y objetos mágicos de los compendios de objetos, de poco comunes a legendarios. */
export async function candidatosMercader() {
  const fuera = new Map();
  for (const pack of game.packs ?? []) {
    if (pack.documentName !== "Item") continue;
    let indice;
    try { indice = await pack.getIndex({ fields: ["system.rarity", "type", "flags.ecos-frontera.reliquia"] }); } catch { continue; }
    for (const e of indice) {
      const rareza = e.system?.rarity, reliquia = !!e.flags?.[MOD]?.reliquia || pack.collection === "world.ecos-reliquias";
      if (!PRECIO[rareza] || ["spell", "feat", "class", "subclass", "background", "race"].includes(e.type)) continue;
      const clave = e.name.toLowerCase();
      if (!fuera.has(clave) || reliquia) fuera.set(clave, { uuid: e.uuid ?? `Compendium.${pack.collection}.Item.${e._id}`, name: e.name, img: e.img, rareza, reliquia });
    }
  }
  return [...fuera.values()];
}

/** El DM sortea un surtido nuevo y lo muestra en el chat. */
export async function sortearMercader() {
  if (!game.user.isGM) return null;
  const candidatos = await candidatosMercader();
  if (!candidatos.length) { ui.notifications.warn("No encuentro objetos raros en los compendios para el mercader."); return null; }
  const surtido = { fecha: Date.now(), items: sortearSurtido(candidatos) };
  const msg = await ChatMessage.create({ content: tarjetaMercaderHTML(surtido), speaker: { alias: "El mercader extraño" }, flags: { [MOD]: { mercader: surtido } } });
  return msg;
}

async function comprar(msg, i, actor, usuario) {
  const surtido = foundry.utils.deepClone(msg.getFlag(MOD, "mercader")), x = surtido?.items?.[i];
  if (!x || x.vendido) return aviso(usuario, "Ya no está: alguien lo compró antes.");
  if (monedas(actor) < x.precio) return aviso(usuario, `${actor.name} tiene ${monedas(actor)} Monedas Antiguas y cuesta ${x.precio}.`);
  const doc = await fromUuid(x.uuid);
  if (!doc) return aviso(usuario, "El mercader no encuentra ese objeto (¿se borró del compendio?).");
  await actor.update(sistema.datosMoneda(monedas(actor) - x.precio));
  await actor.createEmbeddedDocuments("Item", [{ ...doc.toObject(), _id: undefined }]);
  Object.assign(x, { vendido: true, comprador: actor.name });
  await msg.update({ content: tarjetaMercaderHTML(surtido), [`flags.${MOD}.mercader`]: surtido });
  await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), content: `<p><b>${esc(actor.name)}</b> compra <b>${esc(x.name)}</b> al mercader extraño por ${x.precio} Moneda${x.precio === 1 ? "" : "s"} Antigua${x.precio === 1 ? "" : "s"}.</p>` });
}

async function vender(actor, itemId, usuario) {
  const item = actor.items.get(itemId), pago = pagoPorVenta(rarezaDe(item), esReliquia(item));
  if (!item || pago == null) return aviso(usuario, "El mercader no quiere eso.");
  await actor.deleteEmbeddedDocuments("Item", [item.id]);
  await actor.update(sistema.datosMoneda(monedas(actor) + pago));
  await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), content: `<p><b>${esc(actor.name)}</b> le vende <b>${esc(item.name)}</b> al mercader extraño por ${pago} Moneda${pago === 1 ? "" : "s"} Antigua${pago === 1 ? "" : "s"}. «Yo sé qué hacer con esto.»</p>` });
}

async function trazos(actor, n, usuario) {
  const V = game.modules.get(MOD).api?.verbe;
  if (!V?.gastarMoneda) return aviso(usuario, "No se pudo hacer el cambio.");
  for (let i = 0; i < Math.max(0, Math.trunc(Number(n) || 0)); i++) if (await V.gastarMoneda(actor, "trazo") === false) break;
}

function aviso(usuarioId, texto) {
  if (usuarioId === game.user.id) return ui.notifications.warn(texto);
  game.socket.emit(`module.${MOD}`, { mercaderAviso: texto, para: usuarioId });
}

async function alDM(datos) {
  if (soyDM()) return procesar({ ...datos, usuario: game.user.id });
  game.socket.emit(`module.${MOD}`, { mercader: datos, usuario: game.user.id });
}
async function procesar({ op, msgId, i, actorUuid, itemId, n, usuario }) {
  const actor = await fromUuid(actorUuid), user = game.users.get(usuario);
  if (!actor || !user || !(user.isGM || actor.testUserPermission(user, "OWNER"))) return;
  if (op === "comprar") { const msg = game.messages.get(msgId); if (msg?.getFlag(MOD, "mercader")) return comprar(msg, Number(i), actor, usuario); }
  if (op === "vender") return vender(actor, itemId, usuario);
  if (op === "trazos") return trazos(actor, n, usuario);
}

async function elegirVenta(actor) {
  const opciones = actor.items.filter(it => pagoPorVenta(rarezaDe(it), esReliquia(it)) != null)
    .map(it => `<option value="${it.id}">${esc(it.name)} · ${pagoPorVenta(rarezaDe(it), esReliquia(it))} Moneda(s)</option>`).join("");
  if (!opciones) return ui.notifications.info(`${actor.name} no lleva nada raro que le interese al mercader.`);
  const id = await foundry.applications.api.DialogV2.prompt({ window: { title: `Vender al mercader · ${actor.name}` }, rejectClose: false,
    content: `<p>¿Qué le vendes? El objeto desaparece de tu hoja.</p><label>Objeto <select name="item">${opciones}</select></label>`,
    ok: { label: "Vender", callback: (ev, b) => b.form.elements.item.value } });
  if (id) await alDM({ op: "vender", actorUuid: actor.uuid, itemId: id });
}

/** Panel del Verbe: cambiar Monedas Antiguas por Trazos. */
export async function cambiarPorTrazos(actor) {
  const V = game.modules.get(MOD).api?.verbe, e = V?.estado?.(actor);
  if (!e?.despierto) return ui.notifications.info("Los Trazos son del Verbe: hace falta tenerlo despierto.");
  const ya = Number(e.monedas?.[nivelDe(actor)]) || 0, max = trazosComprables(monedas(actor), ya);
  if (!max) return ui.notifications.info(`${actor.name} tiene ${monedas(actor)} Monedas Antiguas. Cada una se vuelve 1 Trazo, como mucho ${TRAZOS_POR_NIVEL} en cada nivel (en este ya cambió ${ya}).`);
  const n = await foundry.applications.api.DialogV2.prompt({ window: { title: "Monedas Antiguas por Trazos" }, rejectClose: false,
    content: `<p>1 Moneda Antigua = 1 Trazo, como mucho ${TRAZOS_POR_NIVEL} en cada nivel. Ahora puedes cambiar hasta <b>${max}</b> (en este nivel ya cambiaste ${ya}).</p><label>Trazos <input type="number" name="n" min="1" max="${max}" value="1"></label>`,
    ok: { label: "Cambiar", callback: (ev, b) => Number(b.form.elements.n.value) } });
  if (n) await trazos(actor, Math.min(n, max), game.user.id);
}

if (globalThis.Hooks) {
  Hooks.once("ready", () => {
    const api = (game.modules.get(MOD).api ??= {});
    api.mercader = { sortear: sortearMercader, trazos: cambiarPorTrazos, candidatos: candidatosMercader };
    game.socket.on(`module.${MOD}`, d => {
      if (d?.mercaderAviso && d.para === game.user.id) ui.notifications.warn(d.mercaderAviso);
      if (d?.mercader && soyDM()) procesar({ ...d.mercader, usuario: d.usuario }).catch(err => console.error(`${MOD} | mercader`, err));
    });
  });
  Hooks.on("renderChatMessageHTML", (msg, html) => {
    if (!msg.getFlag?.(MOD, "mercader")) return;
    for (const b of html.querySelectorAll("[data-ecos-mercader]")) b.addEventListener("click", async ev => {
      ev.preventDefault();
      const actor = personaje();
      if (!actor) return ui.notifications.warn("Elige tu personaje (o selecciona su token) para tratar con el mercader.");
      if (b.dataset.ecosMercader === "comprar") return alDM({ op: "comprar", msgId: msg.id, i: Number(b.dataset.i), actorUuid: actor.uuid });
      return elegirVenta(actor);
    });
  });
}
