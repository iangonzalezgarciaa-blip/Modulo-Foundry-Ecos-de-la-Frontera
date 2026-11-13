/**
 * 3.70 · Resolución automática de las técnicas (pedido del autor, 12-nov-2026: «que al picarle a la técnica con algo o
 * alguien seleccionado se resuelva todo solo y sin errores»).
 *
 * Al usar una técnica del Verbe con objetivos marcados, quien la usa tira sus dados (con sus objetivos marcados, así
 * valen la ventaja y la desventaja de los estados) y el DM principal aplica (tiene permiso sobre todas las fichas):
 *  - Ataque: un ataque contra cada objetivo, comparado con su CA (20 natural acierta y es crítico; 1 falla); el daño si
 *    acierta, aplicado con las resistencias e inmunidades de D&D; y los efectos de la técnica.
 *  - Salvación: si la «Defensa a pedido» la cubre, el que se defiende tira y el daño llega con su resultado (mitad si se
 *    salva); si no, tira la salvación de cada objetivo y aplica daño y efectos igual.
 *  - Daño sin tirada: lo tira y lo aplica. Curación: la tira y la aplica (también PG temporales).
 * Todo deja una tarjeta «Resolución» con lo que pasó, «Deshacer» (devuelve PG y quita efectos) y «A mano» (el DM fija
 * el daño o la cura de cada objetivo). Ajuste «Técnicas: resolución automática» (todo / solo tirar / no).
 * Las reglas son puras; la parte de Foundry engancha el uso de la actividad.
 */
import { sistema } from "./sistema/index.js";
import { botonDeshacer } from "./deshacer.js";

const MOD = "ecos-frontera", AJ = "resolucionAuto";
export const MODOS_RESOLUCION = { todo: "Tirar y aplicar (con Deshacer y A mano)", tirar: "Solo tirar: el daño se aplica con un botón", no: "No: todo desde la tarjeta de D&D" };
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

/* ---------------- Reglas puras ---------------- */
/** ¿Acierta? 20 natural siempre; 1 natural nunca; si no, total contra CA. Puro. */
export function acierta({ total, natural = null, ca }) {
  if (Number(natural) === 20) return { impacta: true, critico: true };
  if (Number(natural) === 1) return { impacta: false, critico: false };
  return { impacta: Number(total) >= Number(ca), critico: false };
}
/** Cuánto del daño recibe quien hizo la salvación. `onSave`: half | none | full. Puro. */
export const multiplicadorSalvacion = (salvado, onSave = "half") => !salvado ? 1 : onSave === "full" ? 1 : onSave === "none" ? 0 : 0.5;
/** Las tiradas de daño de D&D → descripciones para `applyDamage`. Puro. */
export const descripcionesDano = rolls => (rolls ?? []).filter(r => Number.isFinite(Number(r?.total))).map(r => ({ value: Math.max(0, Number(r.total)), type: r.options?.type ?? r.type ?? "none", properties: new Set(r.options?.properties ?? r.properties ?? []) }));
/** ¿Esta actividad se resuelve sola? Puro. */
export function resolvible(activity) {
  const t = activity?.type;
  if (t === "attack") return true;
  if (t === "save") return true;
  if (t === "damage") return !!activity?.damage?.parts?.length;
  if (t === "heal") return true;
  return false;
}
/** La línea de la tarjeta para un objetivo. Puro. */
export function lineaResultado(o) {
  const partes = [`<b>${esc(o.nombre)}</b>`];
  if (o.ataque) partes.push(`ataque ${o.ataque.total}${o.ataque.natural === 20 ? " (20)" : o.ataque.natural === 1 ? " (1)" : ""} contra CA ${o.ca}: ${o.impacta ? (o.critico ? "¡crítico!" : "impacta") : "falla"}`);
  if (o.salvacion) partes.push(`salvación ${o.salvacion.total} contra CD ${o.cd}: ${o.salvado ? "se salva" : "falla"}`);
  if (o.dano) partes.push(`${o.curacion ? "recupera" : "recibe"} ${o.dano} PG (${o.pgAntes} → ${o.pgDespues})`);
  else if (o.impacta === false || (o.salvado && !o.dano)) partes.push("sin daño");
  if (o.efectos?.length) partes.push(`efectos: ${o.efectos.map(esc).join(", ")}`);
  return `<li>${partes.join(" · ")}</li>`;
}

/* ---------------- Foundry ---------------- */
const modo = () => { try { return game.settings.get(MOD, AJ); } catch { return "todo"; } };
const esTecnica = item => !!item?.flags?.[MOD]?.verbe?.id;
const gmPrincipal = () => game.user.isGM && (!game.users.activeGM || game.users.activeGM.isSelf);
const pg = a => ({ value: Number(a?.system?.attributes?.hp?.value) || 0, temp: Number(a?.system?.attributes?.hp?.temp) || 0 });
const naturalDe = r => Number(r?.dice?.[0]?.results?.find(x => x.active)?.result ?? r?.d20?.total) || null;

/** Pone en la ficha los efectos de la actividad que tocan (los de fallar, o los de salvarse). Devuelve los creados. */
async function ponerEfectos(actor, activity, salvado = false) {
  const datos = (activity?.effects ?? []).filter(e => !!e.onSave === !!salvado).map(e => e.effect ?? activity.item?.effects?.get?.(e._id)).filter(Boolean)
    .map(ef => { const o = ef.toObject(); delete o._id; o.origin = activity.item?.uuid ?? o.origin; o.transfer = false; return o; });
  return datos.length ? actor.createEmbeddedDocuments("ActiveEffect", datos) : [];
}
/** Aplica daño (o cura) y apunta lo necesario para deshacer. */
async function aplicar(actor, danos, { multiplicador = 1, curacion = false } = {}) {
  const antes = pg(actor);
  if (danos.length && multiplicador > 0) await actor.applyDamage(danos, { multiplier: multiplicador });
  const despues = pg(actor);
  const delta = curacion ? (despues.value - antes.value) + (despues.temp - antes.temp) : (antes.value - despues.value) + (antes.temp - despues.temp);
  return { antes, despues, delta };
}

/**
 * Lado de quien usa la técnica (sus dados, con sus objetivos marcados para que valgan la ventaja y la desventaja de
 * los estados): tira el ataque contra la CA de cada objetivo y el daño si acierta; o el daño o la cura una vez.
 * Lo que hay que aplicar se lo manda al DM.
 */
export async function tirarUso(activity, tokens, { escalado = null } = {}) {
  const cfgDano = { ...(escalado ? { scaling: escalado } : {}) };
  const conDano = !!activity.damage?.parts?.length || activity.type === "heal";
  const err = e => { console.error(`${MOD} | resolución`, e); return null; };
  const objetivos = [];
  if (activity.type === "attack") {
    for (const t of tokens) {
      const ca = Number(t.actor?.system?.attributes?.ac?.value) || 10;
      const rolls = await activity.rollAttack({ event: null, ecosPase: true }, { configure: false }, {}).catch(err);
      const r = Array.isArray(rolls) ? rolls[0] : rolls; if (!r) continue;
      const nat = naturalDe(r), { impacta, critico } = acierta({ total: r.total, natural: nat, ca });
      const dr = impacta && conDano ? await activity.rollDamage({ ...cfgDano, isCritical: critico }, { configure: false }, {}).catch(err) : null;
      objetivos.push({ uuid: t.document.uuid, nombre: t.document.name, ataque: { total: r.total, natural: nat }, ca, impacta, critico, efectos: impacta,
        danos: descripcionesDano(dr).map(x => ({ ...x, properties: [...x.properties] })), multiplicador: 1 });
    }
  } else {
    const dr = conDano ? await activity.rollDamage(cfgDano, { configure: false }, {}).catch(err) : null;
    const danos = descripcionesDano(dr).map(x => ({ ...x, properties: [...x.properties] }));
    const salv = activity.type === "save" ? { ability: [...(activity.save?.ability ?? [])][0] ?? "dex", cd: Number(activity.save?.dc?.value) || 10, onSave: activity.damage?.onSave ?? "half" } : null;
    for (const t of tokens) objetivos.push({ uuid: t.document.uuid, nombre: t.document.name, danos, multiplicador: 1, curacion: activity.type === "heal", salv, efectos: true });
  }
  return { autoRes: "aplicar", actividad: activity.uuid, objetivos };
}

/** Lado del DM: tira las salvaciones que falten, aplica daño, cura y efectos, y deja la tarjeta. */
export async function aplicarUso(d) {
  if (!gmPrincipal()) return;
  const activity = await fromUuid(d.actividad).catch(() => null);
  if (!activity) return;
  const solo = modo() === "tirar";
  const resultados = [], deshacer = { cambios: [], sumar: [], borrar: [] }, pendientes = [];
  for (const o of d.objetivos ?? []) {
    const tok = await fromUuid(o.uuid).catch(() => null), actor = tok?.actor; if (!actor) continue;
    const linea = { nombre: o.nombre ?? tok.name, ataque: o.ataque, ca: o.ca, impacta: o.impacta, critico: o.critico, curacion: o.curacion, efectos: [] };
    let mult = o.multiplicador ?? 1, salvado = false;
    if (o.salv) {
      const tiro = await actor.rollSavingThrow({ ability: o.salv.ability, target: o.salv.cd }, { configure: false }, {}).catch(() => null);
      const s = Array.isArray(tiro) ? tiro[0] : tiro; salvado = Number(s?.total) >= o.salv.cd;
      Object.assign(linea, { salvacion: { total: s?.total ?? "?" }, cd: o.salv.cd, salvado });
      mult = multiplicadorSalvacion(salvado, o.salv.onSave);
    }
    const danos = (o.danos ?? []).map(x => ({ ...x, properties: new Set(x.properties ?? []) }));
    if (danos.length && mult > 0 && o.impacta !== false) {
      if (solo) pendientes.push({ uuid: actor.uuid, danos: o.danos, multiplicador: mult });
      else {
        const a = await aplicar(actor, danos, { multiplicador: mult, curacion: o.curacion });
        deshacer.sumar.push({ uuid: actor.uuid, sumar: { "system.attributes.hp.value": a.antes.value - a.despues.value, "system.attributes.hp.temp": a.antes.temp - a.despues.temp } });
        Object.assign(linea, { dano: a.delta, pgAntes: a.antes.value, pgDespues: a.despues.value });
      }
    }
    if (!solo && o.efectos && o.impacta !== false) { const ef = await ponerEfectos(actor, activity, salvado); deshacer.borrar.push(...ef.map(e => e.uuid)); linea.efectos = ef.map(e => e.name); }
    resultados.push(linea);
  }
  await tarjeta(activity, resultados, deshacer, pendientes);
}

/** La tarjeta «Resolución»: al DM (los PG exactos de un enemigo no se le muestran al jugador). */
async function tarjeta(activity, resultados, deshacer, pendientes) {
  if (!resultados.length) return;
  const botones = pendientes.length
    ? `<p><button type="button" data-ecos-res="aplicar"><i class="fa-solid fa-heart-crack"></i> Aplicar el daño</button></p>`
    : `${botonDeshacer()}<p><button type="button" data-ecos-res="mano"><i class="fa-solid fa-hand"></i> A mano</button></p>`;
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: activity.actor }), whisper: game.users.filter(u => u.isGM).map(u => u.id),
    content: `<section class="ecos-resolucion"><h3>Resolución · ${esc(activity.item?.name)}</h3><ul>${resultados.map(lineaResultado).join("")}</ul>${botones}</section>`,
    flags: { [MOD]: { deshacer, resolucionAuto: { objetivos: resultados.map(r => r.nombre), uuids: [...new Set([...deshacer.cambios, ...deshacer.sumar].map(c => c.uuid))], pendientes, actividad: activity.uuid } } }
  });
}

/** «A mano»: el DM fija cuánto daño (positivo) o cura (negativo) recibe cada uno; queda en el Deshacer. */
async function aMano(msg) {
  const r = msg.getFlag(MOD, "resolucionAuto"); if (!r || !game.user.isGM) return;
  const actores = (await Promise.all((r.uuids ?? []).map(u => fromUuid(u).catch(() => null)))).filter(Boolean);
  if (!actores.length) return ui.notifications.warn("No hay a quién ajustar en esta resolución.");
  const { DialogV2 } = foundry.applications.api;
  const filas = actores.map((a, i) => `<label>${esc(a.name)} (PG ${pg(a).value}) <input type="number" name="a${i}" value="0" step="1"></label>`).join("");
  const v = await DialogV2.wait({ window: { title: "Resolución a mano" }, content: `<p>Daño a sumar (positivo) o cura (negativo) para cada uno. Lo de antes no se toca: usa «Deshacer» si quieres empezar de cero.</p>${filas}`,
    buttons: [{ action: "ok", label: "Aplicar", default: true, callback: (_e, b) => new foundry.applications.ux.FormDataExtended(b.form).object }, { action: "no", label: "Cancelar" }], rejectClose: false });
  if (!v || v === "no") return;
  const lineas = [];
  for (const [i, a] of actores.entries()) {
    const n = Math.trunc(Number(v[`a${i}`]) || 0); if (!n) continue;
    const antes = pg(a); await a.applyDamage([{ value: Math.abs(n), type: n > 0 ? "none" : "healing" }]);
    lineas.push(`${esc(a.name)}: ${n > 0 ? `${n} de daño` : `${-n} de cura`} (${antes.value} → ${pg(a).value})`);
  }
  if (lineas.length) await msg.update({ content: `${msg.content}<p><i>A mano: ${lineas.join("; ")}.</i></p>` });
}
/** «Aplicar el daño» (modo solo tirar). */
async function aplicarPendientes(msg) {
  const r = msg.getFlag(MOD, "resolucionAuto"); if (!r?.pendientes?.length || !game.user.isGM || msg.getFlag(MOD, "aplicado")) return;
  const deshacer = { cambios: [], sumar: [], borrar: [] }, lineas = [];
  for (const p of r.pendientes) {
    const a = await fromUuid(p.uuid).catch(() => null); if (!a) continue;
    const res = await aplicar(a, p.danos.map(x => ({ ...x, properties: new Set(x.properties ?? []) })), { multiplicador: p.multiplicador });
    deshacer.sumar.push({ uuid: a.uuid, sumar: { "system.attributes.hp.value": res.antes.value - res.despues.value, "system.attributes.hp.temp": res.antes.temp - res.despues.temp } });
    lineas.push(`${esc(a.name)}: ${res.delta} PG`);
  }
  await msg.update({ content: `${msg.content.replace(/<p><button type="button" data-ecos-res="aplicar">[\s\S]*?<\/p>/, "")}<p><i>Aplicado: ${lineas.join("; ")}.</i></p>${botonDeshacer()}`,
    [`flags.${MOD}.aplicado`]: true, [`flags.${MOD}.deshacer`]: deshacer, [`flags.${MOD}.resolucionAuto.uuids`]: deshacer.sumar.map(c => c.uuid) });
}

if (globalThis.Hooks) {
  Hooks.once("init", () => {
    game.settings.register(MOD, AJ, { name: "Técnicas: resolución automática", hint: "Al usar una técnica con objetivos marcados, el DM tira el ataque o las salvaciones, el daño o la cura, y lo aplica con sus efectos. Deja una tarjeta con «Deshacer» y «A mano». «Solo tirar»: el daño espera a un botón.",
      scope: "world", config: true, type: String, choices: MODOS_RESOLUCION, default: "todo" });
  });
  Hooks.once("ready", () => {
    game.socket.on(`module.${MOD}`, d => { if (d?.autoRes === "aplicar") aplicarUso(d).catch(err => console.error(`${MOD} | resolución`, err)); });
  });
  sistema.gancho("alUsar", (activity, usage, results) => {
    try {
      if (modo() === "no" || !esTecnica(activity?.item) || !resolvible(activity)) return;
      const actor = activity.actor;
      const tokens = [...(game.user.targets ?? [])].filter(t => t.actor && t.actor !== actor && t.document?.uuid);
      if (!tokens.length) return;
      // La Defensa a pedido ya cubre las salvaciones contra objetivos marcados (y trae el daño, ver defensa-pedida.js).
      if (activity.type === "save" && defensaCubre(activity)) return;
      const escalado = results?.message?.getFlag?.("dnd5e", "scaling") ?? null;
      tirarUso(activity, tokens, { escalado }).then(d => {
        if (!d.objetivos.length) return;
        if (gmPrincipal()) return aplicarUso(d);
        if (!game.users.activeGM) return ui.notifications.warn("Resolución automática: no hay DM conectado para aplicar el daño; aplícalo desde la tarjeta.");
        game.socket.emit(`module.${MOD}`, d);
      }).catch(err => console.error(`${MOD} | resolución`, err));
    } catch (err) { console.error(`${MOD} | resolución`, err); }
  });
  Hooks.on("renderChatMessageHTML", (msg, html) => {
    for (const b of html.querySelectorAll?.("[data-ecos-res]") ?? []) {
      if (!game.user.isGM) { b.closest("p")?.remove(); continue; }
      b.addEventListener("click", ev => { ev.preventDefault(); (b.dataset.ecosRes === "mano" ? aMano(msg) : aplicarPendientes(msg)).catch(err => console.error(`${MOD} | resolución`, err)); });
    }
  });
}
/** ¿La Defensa a pedido se hace cargo de esta salvación? (misma regla que defensa-pedida.js). */
function defensaCubre(activity) {
  let m = "todas"; try { m = game.settings.get(MOD, "defensaPedida"); } catch { /* sin ajuste */ }
  if (m === "no") return false;
  if (m === "acciones") return !!activity?.item?.flags?.[MOD]?.accionComun || /grapple|shove|agarr|empuj|presa/i.test(`${activity?.name ?? ""} ${activity?.item?.name ?? ""}`);
  return true;
}
