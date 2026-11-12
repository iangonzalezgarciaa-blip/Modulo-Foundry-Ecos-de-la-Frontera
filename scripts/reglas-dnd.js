/**
 * 3.50 · Lo que D&D base no hace (auditoría de 3.46; el autor aprobó las 10 propuestas el 12-nov-2026). Cada cosa trae su
 * control del DM para revertirla (regla del autor para todo el módulo):
 *  1. Cobertura automática al atacar (paredes y criaturas en medio): −2 o −5 al ataque, visible y editable en la ventana.
 *  2–3. Terreno difícil, trepar, nadar y arrastrarse: el movimiento cuenta lo que mide Foundry/dnd5e (regiones de terreno
 *     difícil, velocidad de trepar o nadar); el DM marca «En terreno difícil» a mano y devuelve movimiento. (turno-tracker.js)
 *  4. Saltar: calcula el salto largo y alto (con o sin carrera) y pone el token en modo salto.
 *  5. Interacción con un objeto: una gratis por turno, marcada en la barra y en el panel (clic para devolverla).
 *  6. Un solo conjuro con espacio por turno (Manual 2024): aviso antes del segundo, con «Lanzar igual».
 *  7. Preparar: guarda qué acción y qué la dispara; al cumplirse gasta la Reacción; se borra al empezar su turno.
 *  8. Influir: CD según la actitud del PNJ (Amistoso 10, Indiferente 15, Hostil 20); el DM cambia la actitud con botones.
 *  9. Inspiración heroica: «Repetir con Inspiración» en las tiradas de quien la tiene (con Deshacer); el DM la da o la quita.
 * 10. Arrastrar a quien sujetas: cada pie cuesta uno más y el agarrado viene contigo (con Deshacer). (turno-tracker.js)
 */
import { combateActivo, datosTurno, turnoVacio, cambiarTurno, ACCIONES_DND } from "./turno-tracker.js";
import { botonDeshacer, fotografia } from "./deshacer.js";
const MOD = "ecos-frontera";
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

/* ---------------- Puro ---------------- */
/** Salto (Manual 2024): largo = tu Fuerza en pies; alto = 3 + mod. de FUE; sin 10 ft de carrera, la mitad. */
export function salto({ fue = 10, carrera = true } = {}) {
  const f = Math.max(1, Number(fue) || 10), mod = Math.floor((f - 10) / 2), k = carrera ? 1 : 0.5;
  return { largo: Math.floor(f * k), alto: Math.max(0, Math.floor((3 + mod) * k * 2) / 2), casillas: Math.floor((f * k) / 5) };
}
export const CD_ACTITUD = { amistoso: 10, indiferente: 15, hostil: 20 };
export const NOMBRE_ACTITUD = { amistoso: "Amistoso", indiferente: "Indiferente", hostil: "Hostil" };
/** Influir: contra la CD de la actitud (o la que fije el DM). */
export function resultadoInfluir(total, actitud = "indiferente", cd = null) {
  const c = Number.isFinite(Number(cd)) && cd !== null && cd !== "" ? Number(cd) : (CD_ACTITUD[actitud] ?? 15);
  return { cd: c, exito: Number(total) >= c, margen: Number(total) - c };
}
/** Clave del turno en curso: el espacio de conjuro se cuenta por turno, sea de quien sea (también con reacciones). */
export const claveTurno = (ronda, turno) => `${Number(ronda) || 0}-${Number(turno) || 0}`;
/** ¿Esta lanzada gasta un espacio? Conjuro de nivel 1+, no como ritual ni sin gastar espacio. */
export function gastaEspacio({ tipo, nivel, consumir = true, ritual = false, metodo = "" } = {}) {
  return tipo === "spell" && Number(nivel) > 0 && consumir !== false && !ritual && !["innate", "atwill", "pact-free"].includes(metodo);
}
/**
 * Cobertura según cuántas líneas (de la esquina de quien ataca a las cuatro esquinas del blanco) cruzan una pared,
 * y si hay una criatura en medio. Quien ataca elige su mejor esquina. Puro.
 * `puntos`: [{paredes: n de 0 a 4, criatura: bool}] (uno por esquina o centro de quien ataca).
 */
export function cobertura(puntos = []) {
  if (!puntos.length) return { nivel: "ninguna", bono: 0 };
  const grado = p => { const n = Number(p.paredes) || 0; const g = n >= 4 ? 3 : n === 3 ? 2 : n >= 1 ? 1 : 0; return Math.max(g, p.criatura ? 1 : 0); };
  const mejor = Math.min(...puntos.map(grado));
  return [{ nivel: "ninguna", bono: 0 }, { nivel: "media", bono: 2 }, { nivel: "tresCuartos", bono: 5 }, { nivel: "total", bono: null }][mejor];
}
export const NOMBRE_COBERTURA = { ninguna: "sin cobertura", media: "cobertura media", tresCuartos: "cobertura de tres cuartos", total: "cobertura total" };
/** ¿Corta el segmento a este rectángulo? (Liang–Barsky). Puro. */
export function cruzaRect(a, b, r) {
  let t0 = 0, t1 = 1;
  const dx = b.x - a.x, dy = b.y - a.y;
  for (const [p, q] of [[-dx, a.x - r.x], [dx, r.x + r.w - a.x], [-dy, a.y - r.y], [dy, r.y + r.h - a.y]]) {
    if (p === 0) { if (q < 0) return false; continue; }
    const t = q / p;
    if (p < 0) { if (t > t1) return false; if (t > t0) t0 = t; } else { if (t < t0) return false; if (t < t1) t1 = t; }
  }
  return t0 < t1;
}

/* ---------------- Foundry ---------------- */
const leer = (k, d) => { try { return game.settings.get(MOD, k); } catch { return d; } };
const combatienteDe = actor => combateActivo()?.combatants?.find?.(x => x.actor === actor || x.actorId === actor?.id) ?? null;
const turnoDe = c => { const combat = combateActivo(); return c ? (datosTurno(combat, c.id) ?? turnoVacio(combat.round, combat.turn)) : null; };
const objetivo = () => (game.user?.targets?.size === 1 ? game.user.targets.first() : null);
async function decir(actor, html, { whisper = null, flags = {} } = {}) {
  return ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), content: html, ...(whisper ? { whisper } : {}), flags });
}
const gms = () => game.users.filter(u => u.isGM).map(u => u.id);

/* 1 · Cobertura */
function rectTok(t) { return { x: t.document.x, y: t.document.y, w: t.document.width * canvas.grid.size, h: t.document.height * canvas.grid.size }; }
function esquinas(r, dentro = 0) {
  const d = dentro * Math.min(r.w, r.h);
  return [{ x: r.x + d, y: r.y + d }, { x: r.x + r.w - d, y: r.y + d }, { x: r.x + d, y: r.y + r.h - d }, { x: r.x + r.w - d, y: r.y + r.h - d }];
}
function choca(a, b) {
  try {
    const be = CONFIG.Canvas.polygonBackends?.move ?? foundry.canvas?.geometry?.ClockwiseSweepPolygon;
    return !!be?.testCollision?.(a, b, { type: "move", mode: "any" });
  } catch { return false; }
}
/** Cobertura del blanco frente a quien ataca, en la escena. */
export function coberturaEnEscena(tokA, tokB) {
  if (!tokA || !tokB || !canvas?.ready) return { nivel: "ninguna", bono: 0 };
  const rA = rectTok(tokA), rB = rectTok(tokB);
  const otros = (canvas.tokens?.placeables ?? []).filter(t => t !== tokA && t !== tokB && t.actor && !t.document.hidden
    && !["dead", "defeated"].some(k => t.actor.statuses?.has?.(k))).map(rectTok);
  const origenes = [...esquinas(rA, 0.02), { x: rA.x + rA.w / 2, y: rA.y + rA.h / 2 }];
  const destinos = esquinas(rB, 0.1);
  const puntos = origenes.map(o => ({
    paredes: destinos.filter(d => choca(o, d)).length,
    criatura: otros.some(r => cruzaRect(o, { x: rB.x + rB.w / 2, y: rB.y + rB.h / 2 }, r))
  }));
  return cobertura(puntos);
}

/* 4 · Saltar */
export async function saltar(actor) {
  const fue = Number(actor?.system?.abilities?.str?.value) || 10;
  const con = salto({ fue, carrera: true }), sin = salto({ fue, carrera: false });
  const tok = canvas.tokens?.controlled?.find(t => t.actor === actor) ?? actor?.getActiveTokens?.()[0];
  const r = await foundry.applications.api.DialogV2.wait({ window: { title: `Saltar · ${actor.name}`, icon: "fa-solid fa-person-running" }, position: { width: 440 },
    content: `<div class="ecos-dialogo"><p>Con Fuerza ${fue}:</p><table class="ecos-tabla"><tr><th></th><th>Con 10 ft de carrera</th><th>Sin carrera</th></tr>
      <tr><td><b>Largo</b></td><td>${con.largo} ft (${con.casillas} casillas)</td><td>${sin.largo} ft (${sin.casillas} casillas)</td></tr>
      <tr><td><b>Alto</b></td><td>${con.alto} ft</td><td>${sin.alto} ft</td></tr></table>
      <p><small>Cada pie saltado gasta un pie de movimiento. Más que eso, o caer en mal sitio, pide Atletismo o Acrobacias (lo dice el DM).</small></p></div>`,
    buttons: [{ action: "saltar", label: "Mover el token en modo salto", icon: "fa-solid fa-person-running", default: true }, { action: "no", label: "Cerrar" }], rejectClose: false });
  if (r === "saltar" && tok?.document?.isOwner) await tok.document.update({ movementAction: "jump" }).catch(() => null);
}

/* 5 · Interacción con objeto: es un pip más del turno (ACCIONES_DND.interaccion). */

/* 6 · Un conjuro con espacio por turno */
function usoGastaEspacio(activity, usage = {}) {
  const item = activity?.item;
  return gastaEspacio({ tipo: item?.type, nivel: item?.system?.level, consumir: usage?.consume?.spellSlot ?? true,
    ritual: !!(usage?.spell?.ritual ?? usage?.cast?.ritual), metodo: item?.system?.method ?? item?.system?.preparation?.mode ?? "" });
}
async function preguntarEspacio(activity, usage, dialog, message) {
  const r = await foundry.applications.api.DialogV2.wait({ window: { title: "Un conjuro con espacio por turno", icon: "fa-solid fa-wand-sparkles" }, position: { width: 440 },
    content: `<div class="ecos-dialogo"><p><b>${esc(activity.actor?.name)}</b> ya gastó un espacio de conjuro en este turno.</p><p>Manual 2024: en un mismo turno solo se gasta <b>un</b> espacio de conjuro (los trucos y lo que no gasta espacio sí se pueden lanzar).</p></div>`,
    buttons: [{ action: "igual", label: "Lanzar igual (lo permite el DM)", icon: "fa-solid fa-check" }, { action: "no", label: "No lo lanzo", default: true }], rejectClose: false });
  if (r === "igual") return activity.use({ ...(usage ?? {}), ecosEspacioOk: true }, dialog, message);
}

/* 7 · Preparar */
export async function preparar(actor) {
  const c = combatienteDe(actor), t = turnoDe(c);
  if (t?.accion) return ui.notifications.warn(`${actor.name} ya gastó su ${ACCIONES_DND.accion}.`);
  const r = await foundry.applications.api.DialogV2.wait({ window: { title: `Preparar · ${actor.name}`, icon: "fa-solid fa-hourglass-half" }, position: { width: 460 },
    content: `<div class="ecos-dialogo"><p>Eliges una acción y lo que la dispara. Cuando pasa, la haces con tu <b>Reacción</b> (antes de tu próximo turno). Un conjuro preparado se lanza ahora (gasta el espacio) y pide concentración hasta soltarlo.</p>
      <label>Qué preparas <select name="que"><option>Atacar</option><option>Lanzar un conjuro</option><option>Correr hacia…</option><option>Desengancharme y alejarme</option><option>Usar un objeto</option><option>Otra cosa</option></select></label>
      <label>Cuando… <input name="cuando" placeholder="si el ogro cruza la puerta"></label></div>`,
    buttons: [{ action: "ok", label: "Preparar (gasta tu Acción)", icon: "fa-solid fa-hourglass-half", default: true, callback: (_e, b) => Object.fromEntries(new FormData(b.form)) }, { action: "no", label: "Cancelar" }], rejectClose: false });
  if (!r || r === "no") return;
  if (c) await cambiarTurno(c.id, { op: "gastar", clave: "accion" });
  if (c) await cambiarTurno(c.id, { preparada: { que: String(r.que ?? ""), cuando: String(r.cuando ?? "").slice(0, 120) } });
  await decir(actor, `<p class="ecos-accion-estandar"><b>${esc(actor.name)}</b> prepara <b>${esc(r.que)}</b>${r.cuando ? ` cuando ${esc(r.cuando)}` : ""} (gasta su Acción; la hará con su Reacción).</p>`);
}
export async function dispararPreparada(actor, { cancelar = false } = {}) {
  const c = combatienteDe(actor), t = turnoDe(c);
  if (!c || !t?.preparada) return;
  if (!cancelar && t.reaccion) return ui.notifications.warn(`${actor.name} ya gastó su Reacción.`);
  await cambiarTurno(c.id, cancelar ? { preparada: null } : { preparada: null, reaccion: true });
  await decir(actor, cancelar ? `<p class="ecos-accion-estandar"><b>${esc(actor.name)}</b> suelta lo que tenía preparado.</p>`
    : `<p class="ecos-accion-estandar">⚡ <b>${esc(actor.name)}</b>: ¡se cumple! Hace <b>${esc(t.preparada.que)}</b> con su Reacción.</p>`);
}

/* 8 · Influir */
const actitudDe = a => a?.getFlag?.(MOD, "actitud") ?? "indiferente";
export async function ponerActitud(actor, actitud) {
  if (!game.user.isGM || !actor || !CD_ACTITUD[actitud]) return;
  const antes = actitudDe(actor);
  await actor.setFlag(MOD, "actitud", actitud);
  await decir(actor, `<p><b>${esc(actor.name)}</b>: actitud ${NOMBRE_ACTITUD[antes]} → <b>${NOMBRE_ACTITUD[actitud]}</b>.</p>${botonDeshacer()}`,
    { whisper: gms(), flags: { [MOD]: { deshacer: { cambios: [{ uuid: actor.uuid, antes: { [`flags.${MOD}.actitud`]: antes } }], borrar: [] } } } });
}
export async function influir(actor) {
  const tok = objetivo(), npc = tok?.actor;
  if (!npc || npc === actor) return ui.notifications.warn("Marca (T) a quien quieres convencer.");
  const c = combatienteDe(actor), t = turnoDe(c);
  if (t?.accion) return ui.notifications.warn(`${actor.name} ya gastó su ${ACCIONES_DND.accion}.`);
  const act = actitudDe(npc);
  const r = await foundry.applications.api.DialogV2.wait({ window: { title: `Influir en ${tok.name}`, icon: "fa-solid fa-comments" }, position: { width: 440 },
    content: `<div class="ecos-dialogo"><p>Pides algo a <b>${esc(tok.name)}</b>. ${game.user.isGM ? `Actitud: <b>${NOMBRE_ACTITUD[act]}</b> (CD ${CD_ACTITUD[act]}).` : "El DM sabe qué tan dispuesto está."}</p>
      <label>Cómo <select name="skill"><option value="per">Persuasión (convencer)</option><option value="dec">Engaño (mentir)</option><option value="itm">Intimidación (amenazar)</option><option value="prf">Interpretación (impresionar)</option><option value="ani">Trato con animales</option></select></label>
      ${game.user.isGM ? `<label>CD (vacío = la de su actitud) <input type="number" name="cd" min="0" max="40"></label>` : ""}</div>`,
    buttons: [{ action: "ok", label: "Tirar", icon: "fa-solid fa-dice-d20", default: true, callback: (_e, b) => Object.fromEntries(new FormData(b.form)) }, { action: "no", label: "Cancelar" }], rejectClose: false });
  if (!r || r === "no") return;
  if (c) await cambiarTurno(c.id, { op: "gastar", clave: "accion" });
  const rolls = await actor.rollSkill?.({ skill: r.skill }, {}, {}).catch(() => null);
  const total = Array.isArray(rolls) ? rolls[0]?.total : rolls?.total;
  if (!Number.isFinite(total)) return;
  const res = resultadoInfluir(total, act, r.cd);
  await decir(actor, `<div class="ecos-influir"><p><b>${esc(actor.name)}</b> intenta influir en <b>${esc(tok.name)}</b>: ${total} contra CD ${res.cd} (actitud ${NOMBRE_ACTITUD[act]}) → <b>${res.exito ? "lo logra" : "no lo logra"}</b>${res.exito ? "" : res.margen <= -5 ? " y puede empeorar su actitud" : ""}.</p>
    <p>Cambiar la actitud: ${Object.keys(CD_ACTITUD).map(k => `<button type="button" data-ecos-actitud="${npc.uuid}|${k}">${NOMBRE_ACTITUD[k]}</button>`).join(" ")}</p></div>`, { whisper: gms() });
}

/* 9 · Inspiración heroica */
export async function alternarInspiracion(actor) {
  if (!game.user.isGM || actor?.type !== "character") return;
  const antes = !!actor.system?.attributes?.inspiration;
  await actor.update({ "system.attributes.inspiration": !antes });
  await decir(actor, `<p><b>${esc(actor.name)}</b> ${antes ? "pierde" : "gana"} <b>Inspiración heroica</b>${antes ? "" : ": puede repetir un dado justo después de tirarlo"}.</p>`);
}
async function repetirConInspiracion(msg) {
  const actor = ChatMessage.getSpeakerActor?.(msg.speaker), roll = Array.from(msg.rolls ?? [])[0];
  if (!actor?.isOwner || !roll || !actor.system?.attributes?.inspiration || msg.getFlag(MOD, "inspiracionUsada")) return;
  const foto = fotografia(actor, ["system.attributes.inspiration"]);
  await actor.update({ "system.attributes.inspiration": false });
  const nueva = await roll.reroll();
  const m = await nueva.toMessage({ speaker: msg.speaker, flavor: `${msg.flavor ?? ""} · <b>repetida con Inspiración heroica</b>`, flags: { [MOD]: { inspiracionRepetida: msg.id } } });
  if (msg.isOwner) await msg.setFlag(MOD, "inspiracionUsada", true).catch(() => null);
  await decir(actor, `<p><b>${esc(actor.name)}</b> gasta su Inspiración heroica y repite la tirada (${roll.total} → <b>${nueva.total}</b>). Vale la nueva.</p>${botonDeshacer()}`,
    { flags: { [MOD]: { deshacer: { cambios: [foto], borrar: m?.uuid ? [m.uuid] : [] } } } });
}

if (globalThis.Hooks) {
  Hooks.once("init", () => {
    const reg = (k, o) => game.settings.register(MOD, k, { scope: "world", config: true, type: Boolean, default: true, ...o });
    reg("coberturaAuto", { name: "Cobertura automática al atacar", hint: "Mira paredes y criaturas entre quien ataca y el blanco: −2 (media) o −5 (tres cuartos) al ataque. Se ve en la ventana de la tirada y se puede quitar." });
    reg("unConjuroPorTurno", { name: "Un conjuro con espacio por turno (aviso)", hint: "Manual 2024: avisa antes de gastar un segundo espacio de conjuro en el mismo turno, con «Lanzar igual»." });
    reg("inspiracionBoton", { name: "Inspiración heroica: botón «Repetir»", hint: "En las tiradas de quien tiene Inspiración heroica aparece «Repetir con Inspiración» (con Deshacer para el DM)." });
  });
  // 1 · Cobertura: en la tirada de ataque (después de la ventaja por estados).
  Hooks.on("dnd5e.preRollAttackV2", (config, dialog, message) => {
    if (!leer("coberturaAuto", true) || config?.ecosSinCobertura) return;
    const actor = config?.subject?.actor, tokB = objetivo();
    const tokA = canvas.tokens?.controlled?.find(t => t.actor === actor) ?? actor?.getActiveTokens?.()[0];
    if (!actor || !tokA || !tokB) return;
    try {
      const cob = coberturaEnEscena(tokA, tokB);
      const ya = ["coverThreeQuarters", "coverHalf"].find(k => tokB.actor?.statuses?.has?.(k));
      const yaBono = ya === "coverThreeQuarters" ? 5 : ya === "coverHalf" ? 2 : 0;
      if (cob.nivel === "ninguna") return;
      let nota;
      if (cob.nivel === "total") nota = `<b>Cobertura total</b>: no hay línea libre hasta ${esc(tokB.name)}; no se le puede atacar directamente (el DM decide).`;
      else if (cob.bono <= yaBono) nota = `<i>${esc(tokB.name)} ya está a cubierto (${yaBono === 5 ? "tres cuartos" : "media"}); no se suma otra cobertura.</i>`;
      else {
        const parte = String(-(cob.bono - yaBono));
        config.rolls?.[0] && (config.rolls[0].parts = [...(config.rolls[0].parts ?? []), parte]);
        nota = `<b>${NOMBRE_COBERTURA[cob.nivel][0].toUpperCase()}${NOMBRE_COBERTURA[cob.nivel].slice(1)}</b> (paredes o criaturas en medio): ${parte} al ataque (es lo mismo que +${cob.bono} a su CA). Si no corresponde, bórralo en la ventana de la tirada.`;
      }
      foundry.utils.setProperty(message, "data.flavor", `${message?.data?.flavor ?? ""}<div class="ecos-ventaja-motivo">${nota}</div>`);
    } catch (err) { console.error(`${MOD} | cobertura`, err); }
  });
  // 6 · Un conjuro con espacio por turno
  Hooks.on("dnd5e.preUseActivity", (activity, usage, dialog, message) => {
    if (!leer("unConjuroPorTurno", true) || usage?.ecosEspacioOk) return;
    const combat = combateActivo(), c = combatienteDe(activity?.actor), t = turnoDe(c);
    if (!combat || !t || !usoGastaEspacio(activity, usage)) return;
    if (t.espacio !== claveTurno(combat.round, combat.turn)) return;
    preguntarEspacio(activity, usage, dialog, message).catch(err => console.error(`${MOD} | espacio`, err));
    return false;
  });
  Hooks.on("dnd5e.postUseActivity", (activity, usage) => {
    const combat = combateActivo(), c = combatienteDe(activity?.actor);
    if (!combat || !c || !usoGastaEspacio(activity, usage) || !activity.actor?.isOwner) return;
    cambiarTurno(c.id, { espacio: claveTurno(combat.round, combat.turn) }).catch(() => null);
  });
  // 8 y 9 · Botones del chat
  Hooks.on("renderChatMessageHTML", (msg, html) => {
    const raiz = html instanceof HTMLElement ? html : html?.[0];
    if (!raiz) return;
    for (const b of raiz.querySelectorAll("button[data-ecos-actitud]")) {
      if (!game.user.isGM) { b.remove(); continue; }
      b.addEventListener("click", async ev => { ev.preventDefault(); const [uuid, k] = b.dataset.ecosActitud.split("|"); await ponerActitud(await fromUuid(uuid), k); });
    }
    if (!leer("inspiracionBoton", true) || msg.getFlag(MOD, "inspiracionUsada") || msg.getFlag(MOD, "inspiracionRepetida")) return;
    const actor = ChatMessage.getSpeakerActor?.(msg.speaker), roll = Array.from(msg.rolls ?? [])[0];
    if (!actor?.isOwner || actor.type !== "character" || !actor.system?.attributes?.inspiration || !roll?.dice?.some?.(d => d.faces === 20)) return;
    if (Date.now() - (msg.timestamp ?? 0) > 5 * 60 * 1000) return; // solo justo después de tirar
    const p = document.createElement("p");
    p.innerHTML = `<button type="button" class="ecos-inspiracion"><i class="fa-solid fa-star"></i> Repetir con Inspiración heroica</button>`;
    p.querySelector("button").addEventListener("click", ev => { ev.preventDefault(); repetirConInspiracion(msg).catch(err => console.error(`${MOD} | inspiración`, err)); });
    (raiz.querySelector(".message-content") ?? raiz).appendChild(p);
  });
  Hooks.once("ready", () => {
    const api = game.modules.get(MOD)?.api;
    if (api) Object.assign(api, { saltar, preparar, dispararPreparada, influir, ponerActitud, alternarInspiracion, coberturaEnEscena });
  });
}
