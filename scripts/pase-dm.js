/**
 * El pase del DM (3.26, pedido del autor). Cuando un jugador usa una acción del módulo sobre otra criatura (las
 * «Acciones de …» de cualquiera y las técnicas del Verbe; o cualquier actividad si el DM lo elige en Configuración),
 * la acción no se usa todavía: al DM, y solo a él, le llega la pregunta «¿Esta acción le afecta a esta criatura?».
 * Si da el pase, la acción sigue normal, solo sobre las criaturas aprobadas; si no, no se gasta nada y el jugador
 * recibe la respuesta en privado. Así el DM decide en la ficción antes que las reglas.
 */
import { sistema } from "./sistema/index.js";

const MOD = "ecos-frontera", AJ = "paseDM";
export const MODOS_PASE = { acciones: "Acciones de cualquiera y técnicas del Verbe", todas: "Toda acción con objetivo (también armas y conjuros)", no: "Nunca (las acciones siguen solas)" };
const ESPERAS = new Map();
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

/** ¿Es una acción del módulo? Puro: mira las marcas del objeto. */
export const esAccionDelModulo = flags => !!(flags?.[MOD]?.accionComun || flags?.[MOD]?.verbe);

/**
 * ¿Hay que pedir el pase? Puro.
 * @param {{esGM:boolean, modo:string, flags:object, objetivos:{propio:boolean}[], yaTienePase:boolean, hayDM:boolean}} o
 */
export function debePreguntar({ esGM, modo, flags, objetivos, yaTienePase, hayDM }) {
  if (esGM || yaTienePase || !hayDM) return false;
  if (!MODOS_PASE[modo] || modo === "no") return false;
  if (modo === "acciones" && !esAccionDelModulo(flags)) return false;
  return (objetivos ?? []).some(t => !t.propio);
}

/** Con la respuesta del DM, qué objetivos quedan y cuáles no. Puro. */
export function repartir(objetivos, aprobados) {
  const si = new Set(aprobados ?? []);
  return { quedan: objetivos.filter(t => t.propio || si.has(t.uuid)), fuera: objetivos.filter(t => !t.propio && !si.has(t.uuid)) };
}

const modo = () => { try { return game.settings.get(MOD, AJ); } catch { return "acciones"; } };
const objetivosDe = () => [...(game.user.targets ?? [])].map(t => ({ id: t.id, uuid: t.document?.uuid ?? t.uuid, nombre: t.document?.name ?? t.name,
  img: t.document?.texture?.src ?? "", propio: !!t.actor?.isOwner }));

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

/** Del lado del jugador: pide el pase y, si llega, vuelve a usar la actividad con los objetivos aprobados. */
async function pedirPase(activity, usage, dialog, message, objetivos) {
  const id = foundry.utils.randomID();
  const accion = activity.item?.name ?? activity.name, actividad = activity.name && activity.name !== accion ? activity.name : "";
  ui.notifications.info(`Esperando el pase del DM: ${accion}.`);
  const respuesta = await new Promise(res => {
    ESPERAS.set(id, res);
    game.socket.emit(`module.${MOD}`, { pase: "pregunta", id, de: game.user.id, usuario: game.user.name, actor: activity.actor?.name ?? "", accion, actividad,
      objetivos: objetivos.filter(t => !t.propio).map(({ uuid, nombre, img }) => ({ uuid, nombre, img })) });
  });
  ESPERAS.delete(id);
  const { quedan, fuera } = repartir(objetivos, respuesta?.afectan);
  const nota = respuesta?.nota ? ` <i>${esc(respuesta.nota)}</i>` : "";
  if (fuera.length) await avisarJugador(`<b>${esc(accion)}</b> no le afecta a ${fuera.map(t => `<b>${esc(t.nombre)}</b>`).join(", ")}.${nota}`);
  if (!quedan.some(t => !t.propio)) return;
  if (fuera.length) marcar(quedan.map(t => t.id));
  else if (nota) await avisarJugador(`Pase para <b>${esc(accion)}</b>.${nota}`);
  return activity.use({ ...(usage ?? {}), ecosPase: true }, dialog, message);
}

/** Del lado del DM: la pregunta. */
async function responder(d) {
  const { DialogV2 } = foundry.applications.api;
  const lista = d.objetivos.map((t, i) => `<label class="ecos-pase-objetivo"><input type="checkbox" name="o${i}" checked> ${t.img ? `<img src="${esc(t.img)}" width="28" height="28" style="vertical-align:middle;border:0">` : ""} <b>${esc(t.nombre)}</b></label>`).join("<br>");
  const html = `<div class="ecos-pase-dm"><p><b>${esc(d.usuario)}</b>${d.actor ? ` (${esc(d.actor)})` : ""} usa <b>${esc(d.accion)}</b>${d.actividad ? ` · ${esc(d.actividad)}` : ""}.</p>
    <p><b>¿Esta acción le afecta a ${d.objetivos.length > 1 ? "estas criaturas" : "esta criatura"}?</b> Desmarca a quien no le afecte.</p><p>${lista}</p>
    <label>Nota para el jugador (opcional) <input type="text" name="nota" placeholder="Por ejemplo: no tiene mente que asustar"></label>
    <p class="ecos-nota">Si das el pase, la acción sigue normal solo sobre las marcadas. Si no, no se gasta nada y el jugador lo recibe en privado.</p></div>`;
  const r = await DialogV2.wait({
    window: { title: "¿Le afecta?", icon: "fa-solid fa-gavel" }, position: { width: 460 }, content: html, rejectClose: false,
    buttons: [{ action: "si", label: "Dar el pase", icon: "fa-solid fa-check", default: true, callback: (ev, btn) => new foundry.applications.ux.FormDataExtended(btn.form).object },
      { action: "no", label: "No le afecta", icon: "fa-solid fa-xmark", callback: (ev, btn) => ({ ...new foundry.applications.ux.FormDataExtended(btn.form).object, ninguno: true }) }]
  });
  const afectan = !r || r.ninguno ? [] : d.objetivos.filter((t, i) => r[`o${i}`]).map(t => t.uuid);
  game.socket.emit(`module.${MOD}`, { pase: "respuesta", id: d.id, para: d.de, afectan, nota: r?.nota ?? "" });
}

if (globalThis.Hooks) {
  Hooks.once("init", () => {
    try {
      game.settings.register(MOD, AJ, { name: "El pase del DM", hint: "Cuando un jugador usa una acción sobre otra criatura, primero te pregunta a ti «¿Esta acción le afecta a esta criatura?». Solo tú ves la pregunta; si no das el pase, no se gasta nada.",
        scope: "world", config: true, type: String, choices: MODOS_PASE, default: "acciones" });
    } catch { /* ya */ }
  });
  Hooks.once("ready", () => {
    game.socket.on(`module.${MOD}`, d => {
      if (d?.pase === "pregunta" && game.user === game.users.activeGM) responder(d).catch(err => console.error(`${MOD} | pase`, err));
      if (d?.pase === "respuesta" && d.para === game.user.id) ESPERAS.get(d.id)?.(d);
    });
  });
  sistema.gancho("antesDeUsar", (activity, usage, dialog, message) => {
    const objetivos = objetivosDe();
    if (!debePreguntar({ esGM: game.user.isGM, modo: modo(), flags: activity?.item?.flags, objetivos, yaTienePase: !!usage?.ecosPase, hayDM: !!game.users.activeGM })) return;
    pedirPase(activity, usage, dialog, message, objetivos).catch(err => console.error(`${MOD} | pase`, err));
    return false;
  });
}
