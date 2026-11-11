/**
 * El pase del DM (3.26, pedido del autor; 3.27: también armas y conjuros, y cuando el DM mueve PNJ). Cuando un jugador usa una acción del módulo sobre otra criatura (las
 * «Acciones de …» de cualquiera y las técnicas del Verbe; o cualquier actividad si el DM lo elige en Configuración),
 * la acción no se usa todavía: al DM, y solo a él, le llega la pregunta «¿Esta acción le afecta a esta criatura?».
 * Si da el pase, la acción sigue normal, solo sobre las criaturas aprobadas; si no, no se gasta nada y el jugador
 * recibe la respuesta en privado. Así el DM decide en la ficción antes que las reglas.
 */
import { sistema } from "./sistema/index.js";
import { soloSobreSi, recuperarControl } from "./mesa-propio.js";

const MOD = "ecos-frontera", AJ = "paseDM", AJ_DM = "paseDMPropio", AJ_MIG = "paseDMMigrado";
export const MODOS_PASE = { todas: "Toda acción con objetivo (armas, conjuros, técnicas y acciones de cualquiera)", acciones: "Solo acciones de cualquiera y técnicas del Verbe", no: "Nunca (las acciones siguen solas)" };
/** 3.27: también cuando el DM mueve a alguien (PNJ contra PNJ, o un PJ que maneja el DM). */
export const MODOS_PASE_DM = { siempre: "Sí, con todo lo que yo mueva", pnj: "Solo cuando un PNJ ataca a otro PNJ", no: "No, solo los jugadores" };
const ESPERAS = new Map();
/** Pases dados hace poco: la tirada de ataque que sigue al uso no vuelve a preguntar. clave → {afectan:Set, hasta} */
const CONCEDIDOS = new Map();
const VIGENCIA_MS = 90_000;
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

/** ¿Es una acción del módulo? Puro: mira las marcas del objeto. */
export const esAccionDelModulo = flags => !!(flags?.[MOD]?.accionComun || flags?.[MOD]?.verbe);

/**
 * ¿Hay que pedir el pase? Puro.
 * @param {{esGM:boolean, modo:string, modoDM?:string, flags:object, objetivos:{propio:boolean, pj?:boolean}[], yaTienePase:boolean, hayDM:boolean, actorPJ?:boolean}} o
 */
export function debePreguntar({ esGM, modo, modoDM = "siempre", flags, objetivos, yaTienePase, hayDM, actorPJ = false }) {
  if (yaTienePase) return false;
  if (!MODOS_PASE[modo] || modo === "no") return false;
  if (modo === "acciones" && !esAccionDelModulo(flags)) return false;
  const ajenos = (objetivos ?? []).filter(t => !t.propio);
  if (!ajenos.length) return false;
  if (esGM) {
    if (modoDM === "no") return false;
    if (modoDM === "pnj") return !actorPJ && ajenos.every(t => !t.pj);
    return true;
  }
  return hayDM;
}

/** Con la respuesta del DM, qué objetivos quedan y cuáles no. Puro. */
export function repartir(objetivos, aprobados) {
  const si = new Set(aprobados ?? []);
  return { quedan: objetivos.filter(t => t.propio || si.has(t.uuid)), fuera: objetivos.filter(t => !t.propio && !si.has(t.uuid)) };
}

const leer = (clave, def) => { try { return game.settings.get(MOD, clave); } catch { return def; } };
const modo = () => leer(AJ, "todas");
const modoDM = () => leer(AJ_DM, "siempre");
const esPJ = a => a?.type === "character" || !!a?.hasPlayerOwner;
/** Los objetivos marcados. «Propio»: para un jugador, lo que es suyo; para el DM, solo quien actúa (todo lo demás es del DM). */
const objetivosDe = actor => [...(game.user.targets ?? [])].map(t => ({ id: t.id, uuid: t.document?.uuid ?? t.uuid, nombre: t.document?.name ?? t.name,
  img: t.document?.texture?.src ?? "", pj: esPJ(t.actor),
  propio: game.user.isGM ? (!!actor && t.actor === actor) : !!t.actor?.isOwner }));
const claveDe = activity => activity?.uuid ?? `${activity?.item?.uuid}.${activity?.id}`;
function concedido(activity, objetivos) {
  const c = CONCEDIDOS.get(claveDe(activity));
  if (!c || c.hasta < Date.now()) return false;
  return objetivos.filter(t => !t.propio).every(t => c.afectan.has(t.uuid));
}
const anotar = (activity, afectan) => CONCEDIDOS.set(claveDe(activity), { afectan: new Set(afectan), hasta: Date.now() + VIGENCIA_MS });

function marcar(ids) {
  try {
    if (canvas.tokens?.setTargets) return canvas.tokens.setTargets(ids, { mode: "replace" });
    if (game.user.updateTokenTargets) return game.user.updateTokenTargets(ids);
    for (const t of canvas.tokens?.placeables ?? []) t.setTarget?.(ids.includes(t.id), { releaseOthers: false, groupSelection: true });
  } catch (err) { console.warn(`${MOD} | objetivos`, err); }
}

async function avisarJugador(texto) {
  await ChatMessage.create({ content: `<div class="ecos-pase"><p>${texto}</p></div>`, whisper: [game.user.id, ...game.users.filter(u => u.isGM).map(u => u.id)],
    speaker: { alias: "El DM" }, flags: { [MOD]: { pase: true } } });
}

/** Pide el pase: el jugador al DM por el socket; el DM se pregunta a sí mismo (PNJ contra PNJ). */
async function preguntar(activity, objetivos) {
  const accion = activity.item?.name ?? activity.name, actividad = activity.name && activity.name !== accion ? activity.name : "";
  const datos = { id: foundry.utils.randomID(), de: game.user.id, usuario: game.user.name, actor: activity.actor?.name ?? "", accion, actividad,
    objetivos: objetivos.filter(t => !t.propio).map(({ uuid, nombre, img }) => ({ uuid, nombre, img })) };
  if (game.user.isGM) return { accion, respuesta: await responder(datos, { local: true }) };
  ui.notifications.info(`Esperando el pase del DM: ${accion}.`);
  const respuesta = await new Promise(res => {
    ESPERAS.set(datos.id, res);
    game.socket.emit(`module.${MOD}`, { pase: "pregunta", ...datos });
  });
  ESPERAS.delete(datos.id);
  return { accion, respuesta };
}

/** Reparte la respuesta: avisa a quién no le afecta, deja marcados los que sí y anota el pase. Devuelve si sigue. */
async function aplicarRespuesta(activity, objetivos, accion, respuesta) {
  const { quedan, fuera } = repartir(objetivos, respuesta?.afectan);
  const nota = respuesta?.nota ? ` <i>${esc(respuesta.nota)}</i>` : "";
  if (fuera.length) await avisarJugador(`<b>${esc(accion)}</b> no le afecta a ${fuera.map(t => `<b>${esc(t.nombre)}</b>`).join(", ")}.${nota}`);
  if (!quedan.some(t => !t.propio)) return false;
  if (fuera.length) marcar(quedan.map(t => t.id));
  else if (nota) await avisarJugador(`Pase para <b>${esc(accion)}</b>.${nota}`);
  anotar(activity, quedan.map(t => t.uuid));
  return true;
}

/** Antes de usar: si hay pase, vuelve a usar la actividad con los objetivos aprobados. */
async function pedirPase(activity, usage, dialog, message, objetivos) {
  const { accion, respuesta } = await preguntar(activity, objetivos);
  if (!(await aplicarRespuesta(activity, objetivos, accion, respuesta))) return;
  return activity.use({ ...(usage ?? {}), ecosPase: true }, dialog, message);
}

/** Antes de la tirada de ataque (cuando se marcó al objetivo después de usar el arma): pregunta y vuelve a tirar. */
async function pedirPaseAtaque(activity, config, objetivos) {
  const { accion, respuesta } = await preguntar(activity, objetivos);
  if (!(await aplicarRespuesta(activity, objetivos, accion, respuesta))) return;
  return activity.rollAttack({ event: config?.event, attackMode: config?.attackMode, ammunition: config?.ammunition, mastery: config?.mastery, ecosPase: true });
}

/** Del lado del DM: la pregunta. Con `local` (el DM mueve a la criatura) devuelve la respuesta en vez de mandarla. */
async function responder(d, { local = false } = {}) {
  const { DialogV2 } = foundry.applications.api;
  const lista = d.objetivos.map((t, i) => `<label class="ecos-pase-objetivo"><input type="checkbox" name="o${i}" checked> ${t.img ? `<img src="${esc(t.img)}" width="28" height="28" style="vertical-align:middle;border:0">` : ""} <b>${esc(t.nombre)}</b></label>`).join("<br>");
  const html = `<div class="ecos-pase-dm"><p><b>${esc(d.usuario)}</b>${d.actor ? ` (${esc(d.actor)})` : ""} usa <b>${esc(d.accion)}</b>${d.actividad ? ` · ${esc(d.actividad)}` : ""}.</p>
    <p><b>¿Esta acción le afecta a ${d.objetivos.length > 1 ? "estas criaturas" : "esta criatura"}?</b> Desmarca a quien no le afecte.</p><p>${lista}</p>
    <label>Nota para el jugador (opcional) <input type="text" name="nota" placeholder="Por ejemplo: no tiene mente que asustar"></label>
    <p class="ecos-nota">Si das el pase, la acción sigue normal solo sobre las marcadas. Si no, no se gasta nada${d.de === game.user.id ? "" : " y el jugador lo recibe en privado"}. La pregunta se cambia en Configuración → Ecos de la frontera → El pase del DM.</p></div>`;
  const r = await DialogV2.wait({
    window: { title: "¿Le afecta?", icon: "fa-solid fa-gavel" }, position: { width: 460 }, content: html, rejectClose: false,
    buttons: [{ action: "si", label: "Dar el pase", icon: "fa-solid fa-check", default: true, callback: (ev, btn) => new foundry.applications.ux.FormDataExtended(btn.form).object },
      { action: "no", label: "No le afecta", icon: "fa-solid fa-xmark", callback: (ev, btn) => ({ ...new foundry.applications.ux.FormDataExtended(btn.form).object, ninguno: true }) }]
  });
  // 3.32: si el diálogo se tragó el soltar del ratón, el DM no debe quedarse sin poder mover fichas.
  recuperarControl({ avisar: false }).catch(() => null);
  const afectan = !r || r.ninguno ? [] : d.objetivos.filter((t, i) => r[`o${i}`]).map(t => t.uuid);
  const respuesta = { pase: "respuesta", id: d.id, para: d.de, afectan, nota: r?.nota ?? "" };
  if (local) return respuesta;
  game.socket.emit(`module.${MOD}`, respuesta);
}

if (globalThis.Hooks) {
  Hooks.once("init", () => {
    try {
      game.settings.register(MOD, AJ, { name: "El pase del DM", hint: "Antes de que una acción toque a otra criatura, el DM decide «¿Esta acción le afecta a esta criatura?». Solo el DM ve la pregunta; si no da el pase, no se gasta nada.",
        scope: "world", config: true, type: String, choices: MODOS_PASE, default: "todas" });
      game.settings.register(MOD, AJ_DM, { name: "El pase del DM · cuando el DM mueve a alguien", hint: "Si el DM también se pregunta cuando ataca o lanza con un PNJ (o con un PJ que maneja él). Útil en peleas entre PNJ.",
        scope: "world", config: true, type: String, choices: MODOS_PASE_DM, default: "siempre" });
      game.settings.register(MOD, AJ_MIG, { scope: "world", config: false, type: Boolean, default: false });
    } catch { /* ya */ }
  });
  Hooks.once("ready", () => {
    game.socket.on(`module.${MOD}`, d => {
      if (d?.pase === "pregunta" && game.user === game.users.activeGM) responder(d).catch(err => console.error(`${MOD} | pase`, err));
      if (d?.pase === "respuesta" && d.para === game.user.id) ESPERAS.get(d.id)?.(d);
    });
    // 3.27: el pase pasa a valer para toda acción con objetivo (antes solo las del módulo), a pedido del autor.
    if (game.user === game.users.activeGM && !leer(AJ_MIG, true)) {
      Promise.resolve().then(async () => { await game.settings.set(MOD, AJ, "todas"); await game.settings.set(MOD, AJ_MIG, true); })
        .catch(err => console.warn(`${MOD} | pase`, err));
    }
  });
  const argumentos = (activity, yaTienePase) => {
    // 3.32: lo que es solo sobre ti (Guardia de hierro, un modo, un buff) no toca al marcado: no hay pase que pedir.
    const objetivos = soloSobreSi(activity) ? [] : objetivosDe(activity?.actor);
    return { objetivos, o: { esGM: game.user.isGM, modo: modo(), modoDM: modoDM(), flags: activity?.item?.flags, objetivos, yaTienePase,
      hayDM: !!game.users.activeGM, actorPJ: esPJ(activity?.actor) } };
  };
  sistema.gancho("antesDeUsar", (activity, usage, dialog, message) => {
    const { objetivos, o } = argumentos(activity, !!usage?.ecosPase);
    if (!debePreguntar(o)) return;
    if (concedido(activity, objetivos)) return;
    pedirPase(activity, usage, dialog, message, objetivos).catch(err => console.error(`${MOD} | pase`, err));
    return false;
  });
  // La tirada de ataque puede venir sola (se marcó al objetivo después de usar el arma, o desde el botón del chat).
  Hooks.on("dnd5e.preRollAttackV2", (config) => {
    const activity = config?.subject;
    if (!activity?.rollAttack) return;
    const { objetivos, o } = argumentos(activity, !!config?.ecosPase);
    if (!debePreguntar(o)) return;
    if (concedido(activity, objetivos)) return;
    pedirPaseAtaque(activity, config, objetivos).catch(err => console.error(`${MOD} | pase`, err));
    return false;
  });
}
