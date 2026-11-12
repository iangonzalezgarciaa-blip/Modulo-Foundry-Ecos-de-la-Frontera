/**
 * 3.28 · La defensa a pedido (pedido del autor). Cuando alguien usa contra un objetivo marcado una acción que pide una
 * salvación (Presa, Empujón, Zancadilla, Desarmar, Fintar, las «Acciones de …», el agarre de D&D, una técnica, un
 * conjuro), al dueño de la ficha objetivo le sale una ventana: «Te intentan agarrar: defiéndete con…», con un botón por
 * cada salvación que vale. Tira los dados (salen en el chat), el módulo compara con la CD y, si falla, le pone el estado
 * de la acción. A los jugadores no se les muestra la CD de un enemigo.
 *
 * Quién responde: el jugador dueño de la ficha si está conectado; si no, el DM. Ajuste «Defensa a pedido».
 */
import { sistema } from "./sistema/index.js";
import { esPesada, defensaDe, QUEBRADO } from "./ruptura.js";

const MOD = "ecos-frontera", AJ = "defensaPedida";
export const MODOS_DEFENSA = { todas: "Toda acción con salvación contra un objetivo (también técnicas y conjuros)", acciones: "Solo las Acciones de cualquiera y el agarre o empujón de D&D", no: "No (cada uno tira desde la tarjeta del chat)" };
const NOMBRE_SALV = { str: "Fuerza", dex: "Destreza", con: "Constitución", int: "Inteligencia", wis: "Sabiduría", cha: "Carisma" };
const PERICIA_SALV = { str: "Atletismo", dex: "Acrobacias", con: "aguante", int: "astucia", wis: "voluntad", cha: "presencia" };
const VERBO = { presa: "agarrar", derribar: "derribar", apartar: "apartar", lanzar: "lanzar", zancadilla: "derribar", desarmar: "desarmar",
  birlar: "robar", polvo: "cegar", fintar: "engañar", intimidar: "intimidar", provocar: "provocar", distraer: "distraer", leer: "leer", "rompe-guardia": "romper la guardia", grieta: "encontrarle la grieta" };
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

/** ¿Es una acción de cualquiera o el agarre o empujón de D&D? Puro. */
export function esAccionBasica(item, actividad) {
  if (item?.flags?.[MOD]?.accionComun) return true;
  return /grapple|shove|agarr|empuj|presa/i.test(`${actividad?.name ?? ""} ${item?.name ?? ""}`);
}
/** ¿Hay que pedir la defensa? Puro. */
export function pideDefensa({ modo, tipoActividad, basica, objetivos }) {
  if (!MODOS_DEFENSA[modo] || modo === "no" || tipoActividad !== "save") return false;
  if (modo === "acciones" && !basica) return false;
  return (objetivos ?? []).length > 0;
}
/** El texto de la ventana: qué te intentan hacer. Puro. */
export function textoAmenaza({ autor, accion, idAccion }) {
  const v = VERBO[idAccion];
  return v ? `${autor} te intenta ${v} (${accion}).` : `${autor} usa ${accion} contra ti.`;
}
/** ¿Se salvó? Puro. */
export const seSalva = (total, cd) => Number(total) >= Number(cd);

const modo = () => { try { return game.settings.get(MOD, AJ); } catch { return "todas"; } };
/** Quién responde por una ficha: su jugador conectado o el DM. */
function quienResponde(actor) {
  const jugador = game.users.find(u => u.active && !u.isGM && actor?.testUserPermission?.(u, "OWNER"));
  return jugador ?? game.users.activeGM ?? null;
}

/** Lado del que usa la acción: arma el pedido por cada responsable. */
async function alUsar(activity) {
  if (activity?.type !== "save") return;
  const item = activity.item, actor = activity.actor;
  const marcados = [...(game.user.targets ?? [])].filter(t => t.actor && t.actor !== actor);
  const objetivos = marcados.filter(t => game.user.isGM || !t.actor.isOwner);
  if (!pideDefensa({ modo: modo(), tipoActividad: activity.type, basica: esAccionBasica(item, activity), objetivos })) return;
  const cd = Number(activity.save?.dc?.value);
  const salv = [...(activity.save?.ability ?? [])].filter(a => NOMBRE_SALV[a]);
  if (!Number.isFinite(cd) || !salv.length) return;
  const idAccion = activity.item?.flags?.[MOD]?.accionComun ? Object.entries(VERBO).find(([k]) => (activity.name ?? "").toLowerCase().includes(k.split("-")[0]))?.[0] : null;
  // 3.70: con la resolución automática, el daño de una técnica se tira una vez aquí y llega con la defensa (mitad si se salva).
  let dano = null;
  if (item?.flags?.[MOD]?.verbe?.id && activity.damage?.parts?.length && resolucionActiva()) {
    const { descripcionesDano } = await import("./resolucion-auto.js");
    const dr = await activity.rollDamage({}, { configure: false }, {}).catch(err => { console.error(`${MOD} | defensa`, err); return null; });
    dano = { danos: descripcionesDano(dr).map(x => ({ ...x, properties: [...x.properties] })), onSave: activity.damage?.onSave ?? "half" };
  }
  const porUsuario = new Map();
  for (const t of objetivos) {
    const u = quienResponde(t.actor);
    if (!u) continue;
    if (!porUsuario.has(u.id)) porUsuario.set(u.id, []);
    porUsuario.get(u.id).push({ tokenUuid: t.document?.uuid, actorUuid: t.actor.uuid, nombre: t.document?.name ?? t.name });
  }
  for (const [para, lista] of porUsuario) {
    const d = { defensa: "pedir", id: foundry.utils.randomID(), para, de: game.user.id, autor: actor?.name ?? "", accion: activity.item?.name === activity.name ? activity.name : `${activity.item?.name} · ${activity.name}`,
      idAccion, actividad: activity.uuid, objetivos: lista, salv, cd, pesada: esPesada(item), dano };
    if (para === game.user.id) responder(d).catch(err => console.error(`${MOD} | defensa`, err));
    else game.socket.emit(`module.${MOD}`, d);
  }
}

/** Lado del que se defiende: la ventana con un botón por salvación y por objetivo. */
async function responder(d) {
  const { DialogV2 } = foundry.applications.api;
  const fichas = (await Promise.all(d.objetivos.map(async o => ({ ...o, actor: (await fromUuid(o.tokenUuid))?.actor ?? await fromUuid(o.actorUuid) })))).filter(o => o.actor);
  if (!fichas.length) return;
  const verCD = game.user.isGM;
  const filas = fichas.map((o, i) => `<fieldset class="ecos-defensa-objetivo"><legend><b>${esc(o.nombre)}</b></legend>
    ${d.salv.map(a => { const b = Number(o.actor.system?.abilities?.[a]?.save?.value ?? o.actor.system?.abilities?.[a]?.save ?? 0); return `<label><input type="radio" name="o${i}" value="${a}" ${a === mejor(o.actor, d.salv) ? "checked" : ""}> Salvación de ${NOMBRE_SALV[a]} (${b >= 0 ? "+" : ""}${b}) <small>· ${PERICIA_SALV[a]}</small></label>`; }).join("<br>")}</fieldset>`).join("");
  const html = `<div class="ecos-defensa"><p><b>${esc(textoAmenaza({ autor: d.autor, accion: d.accion, idAccion: d.idAccion }))}</b></p>
    <p>Elige con qué te defiendes${fichas.length > 1 ? " cada uno" : ""}. ${verCD ? `CD ${d.cd}.` : "No sabes qué tan fuerte viene."}${d.pesada ? " <i>Técnica pesada: tu Fortaleza no cuenta.</i>" : ""}</p>${filas}</div>`;
  const r = await DialogV2.wait({ window: { title: "Te defiendes", icon: "fa-solid fa-shield-halved" }, position: { width: 440 }, content: html, rejectClose: false,
    buttons: [{ action: "tirar", label: "Tirar la defensa", icon: "fa-solid fa-dice-d20", default: true, callback: (ev, btn) => new foundry.applications.ux.FormDataExtended(btn.form).object },
      { action: "nada", label: "No defenderse (falla)", icon: "fa-solid fa-xmark", callback: () => ({ nada: true }) }] });
  if (!r) return;
  const resultados = [], deshacer = { cambios: [], borrar: [] };
  for (const [i, o] of fichas.entries()) {
    let total = -Infinity, ok = false;
    if (!r.nada) {
      const ability = r[`o${i}`] ?? mejor(o.actor, d.salv);
      const fort = d.pesada ? defensaDe(o.actor) : null;
      const quitar = fort?.tipo === "fortaleza" && !o.actor.statuses?.has?.(QUEBRADO) ? fort.n : 0;
      const config = { ability, target: d.cd, ...(quitar ? { rolls: [{ parts: ["-@ecosPesada"], data: { ecosPesada: quitar } }] } : {}) };
      const tiradas = await o.actor.rollSavingThrow(config, { configure: false }, { data: { flags: { [MOD]: { defensa: d.id } } } });
      total = Number(tiradas?.[0]?.total);
      ok = seSalva(total, d.cd);
    }
    const res = { nombre: o.nombre, ok };
    const creados = await aplicarResultado(o.actor, d.actividad, ok).catch(err => { console.error(`${MOD} | defensa`, err); return []; });
    deshacer.borrar.push(...(creados ?? []).map(e => e.uuid));
    if (d.dano?.danos?.length) {
      const { multiplicadorSalvacion } = await import("./resolucion-auto.js");
      const mult = multiplicadorSalvacion(ok, d.dano.onSave);
      if (mult > 0) {
        const antes = { value: Number(o.actor.system?.attributes?.hp?.value) || 0, temp: Number(o.actor.system?.attributes?.hp?.temp) || 0 };
        await o.actor.applyDamage(d.dano.danos.map(x => ({ ...x, properties: new Set(x.properties ?? []) })), { multiplier: mult }).catch(err => console.error(`${MOD} | defensa`, err));
        const despues = Number(o.actor.system?.attributes?.hp?.value) || 0, tmp = Number(o.actor.system?.attributes?.hp?.temp) || 0;
        res.dano = (antes.value - despues) + (antes.temp - tmp);
        deshacer.cambios.push({ uuid: o.actor.uuid, antes: { "system.attributes.hp.value": antes.value, "system.attributes.hp.temp": antes.temp } });
      }
    }
    resultados.push(res);
  }
  const lineas = resultados.map(x => `<li><b>${esc(x.nombre)}</b>: ${x.ok ? "se defiende" : "no se defiende"}${x.dano ? ` · recibe ${x.dano} de daño` : ""}</li>`).join("");
  const conDeshacer = deshacer.cambios.length || deshacer.borrar.length;
  const { botonDeshacer } = await import("./deshacer.js");
  await ChatMessage.create({ speaker: { alias: "Defensa" }, content: `<section class="ecos-defensa-resultado"><p>${esc(d.accion)} de ${esc(d.autor)}:</p><ul>${lineas}</ul>${conDeshacer ? botonDeshacer() : ""}</section>`,
    flags: { [MOD]: { defensaResultado: d.id, ...(conDeshacer ? { deshacer } : {}) } } });
  if (d.de !== game.user.id) game.socket.emit(`module.${MOD}`, { defensa: "resultado", id: d.id, para: d.de, resultados });
}
const mejor = (actor, salv) => salv.reduce((m, a) => (Number(actor.system?.abilities?.[a]?.save?.value ?? 0) > Number(actor.system?.abilities?.[m]?.save?.value ?? 0) ? a : m), salv[0]);

/** Pone en la ficha los efectos de la acción que tocan: los de fallar (o los de salvarse, si la acción tiene). */
async function aplicarResultado(actor, uuidActividad, salvado) {
  const act = await fromUuid(uuidActividad);
  if (!act?.effects?.length) return [];
  const datos = act.effects.filter(e => !!e.onSave === salvado).map(e => e.effect ?? act.item?.effects?.get?.(e._id)).filter(Boolean)
    .map(ef => { const o = ef.toObject(); delete o._id; o.origin = act.item?.uuid ?? o.origin; o.transfer = false; return o; });
  return datos.length ? actor.createEmbeddedDocuments("ActiveEffect", datos) : [];
}
/** ¿Está encendida la resolución automática de técnicas (3.70)? */
const resolucionActiva = () => { try { return game.settings.get(MOD, "resolucionAuto") === "todo"; } catch { return false; } };

if (globalThis.Hooks) {
  Hooks.once("init", () => {
    try {
      game.settings.register(MOD, AJ, { name: "Defensa a pedido", hint: "Cuando alguien usa una acción con salvación contra un objetivo marcado, al dueño de la ficha objetivo le sale una ventana para elegir con qué se defiende y tirar; si falla, el módulo le pone el estado. Los PNJ los responde el DM.",
        scope: "world", config: true, type: String, choices: MODOS_DEFENSA, default: "todas" });
    } catch { /* ya */ }
  });
  Hooks.once("ready", () => {
    game.socket.on(`module.${MOD}`, d => {
      if (d?.defensa === "pedir" && d.para === game.user.id) responder(d).catch(err => console.error(`${MOD} | defensa`, err));
      if (d?.defensa === "resultado" && d.para === game.user.id) ui.notifications.info(d.resultados.map(x => `${x.nombre}: ${x.ok ? "se defiende" : "no se defiende"}`).join(" · "));
    });
  });
  sistema.gancho("alUsar", activity => { alUsar(activity).catch(err => console.error(`${MOD} | defensa`, err)); });
}
