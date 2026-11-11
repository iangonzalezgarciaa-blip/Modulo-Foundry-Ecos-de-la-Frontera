/**
 * 3.34 · Reglas del Verbe (pedidos del autor):
 *  - Forzarse: si una técnica te deja en Verbe negativo, primero pregunta «¿Quieres forzarte más allá de tus límites?»;
 *    si dices que sí, un susurro (solo para ti y el DM) explica qué haces, qué arriesgas y cómo recuperarte.
 *  - Manos y movimiento ocupados: mientras canalizas una técnica (las de recarga de más de un turno), lo de D&D que usa
 *    las manos o moverte se frena con un aviso: «¿Cancelas la canalización y recuperas tu Verbe?».
 *  - Movimiento libre: Sustitución te deja en una casilla adyacente que eliges (más lejos con mejoras) y «Sombra bajo
 *    el salto» te mueve sin gastar movimiento y ofrece Golpe hondo.
 *  - Escapes: una técnica básica de escape por rama: te mueves, te pierden de vista si fallan su prueba.
 *  - Monedas Antiguas: botón junto a la barra del Verbe; en combate gasta tu acción Verbe.
 */
import { sistema } from "./sistema/index.js";
import * as V from "./verbe.js";

const MOD = "ecos-frontera", F = "verbe";
const leer = (k, def) => { try { return game.settings.get(MOD, k); } catch { return def; } };
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const metaDe = item => item?.getFlag?.(MOD, F) ?? item?.flags?.[MOD]?.[F] ?? null;

/* ---------------- Puro ---------------- */
/** Lo que dice el aviso de forzarse. */
export function textoForzarse({ nombre, valor, despues, limite, grado, agotamiento = 0, recDia = null }) {
  const cd = 10 + (Number(grado) || 0);
  return {
    pregunta: `Te quedan <b>${valor}</b> de Verbe y <b>${esc(nombre)}</b> te deja en <b>${despues}</b> (tu límite es ${limite}). ¿Quieres forzarte más allá de tus límites?`,
    riesgo: `Tiras una salvación de Constitución CD ${cd}: si fallas, ganas 1 nivel de Agotamiento (irías a ${agotamiento + 1}). Con Agotamiento 4 ya no puedes forzarte.`,
    recuperar: `Mientras estés en negativo, cada punto que recuperas paga solo la mitad de la deuda. Descansa en un Santuario${recDia ? ` (un Descanso Largo te devuelve unos ${recDia})` : ""}; las Monedas Antiguas ayudan. Hasta volver a 0 estás al límite: otro golpe de Verbe puede tumbarte.`
  };
}
/** Hasta dónde mueve la Sustitución: 5 ft, +5 por mejora cultivada, 30 ft con Sustitución lejana. */
export function alcanceSustitucion({ mejoras = 0, lejana = false } = {}) {
  return lejana ? 30 : 5 + 5 * Math.max(0, Number(mejoras) || 0);
}
/** Distancia del escape según el grado al que se usa: 10 ft y 5 más por grado sobre 1. */
export const piesEscape = grado => 10 + 5 * Math.max(0, (Number(grado) || 1) - 1);
/** ¿Qué prueba hacen los que te buscan? Las ramas de engaño y sello se ven con Arcanos; el resto, con Percepción. */
export const pruebaEscape = rama => (["velo", "sello", "umbral", "mirada", "pacto", "sangre"].includes(rama) ? "arc" : "prc");
/** ¿Esta actividad de D&D usa las manos o pide moverse? (armas, conjuros con gestos, objetos, herramientas). */
export function usaManos(act) {
  const it = act?.item;
  if (!it || metaDe(it)) return false;
  if (["weapon", "consumable", "tool", "equipment", "loot"].includes(it.type)) return true;
  if (it.type === "spell") return !!(it.system?.properties?.has?.("somatic") || it.system?.properties?.includes?.("somatic") || it.system?.components?.somatic);
  return act?.type === "attack";
}

/* ---------------- Foundry ---------------- */
/** Elige una casilla con el ratón a no más de `maxPies` del token. */
export function elegirCasilla(token, maxPies, titulo = "Elige a dónde vas") {
  return new Promise(resolve => {
    if (!canvas?.ready || !token) return resolve(null);
    const g = canvas.grid.size, porPie = g / (canvas.scene?.grid?.distance || 5);
    ui.notifications.info(`${titulo}: haz clic en la casilla (hasta ${maxPies} ft). Escape cancela.`);
    const fin = r => { canvas.stage.off("pointerdown", clic); window.removeEventListener("keydown", tecla); resolve(r); };
    const tecla = ev => { if (ev.key === "Escape") fin(null); };
    const clic = ev => {
      const p = ev.getLocalPosition?.(canvas.stage) ?? ev.data?.getLocalPosition?.(canvas.stage);
      if (!p) return;
      const tl = canvas.grid.getTopLeftPoint?.(p) ?? { x: Math.floor(p.x / g) * g, y: Math.floor(p.y / g) * g };
      const dx = Math.abs(tl.x - token.document.x), dy = Math.abs(tl.y - token.document.y);
      const pies = Math.round(Math.max(dx, dy) / porPie);
      if (pies > maxPies) return ui.notifications.warn(`Esa casilla está a ${pies} ft: el máximo es ${maxPies} ft.`);
      fin(tl);
    };
    canvas.stage.on("pointerdown", clic);
    window.addEventListener("keydown", tecla);
  });
}
/** Mueve sin gastar movimiento ni provocar ataques de oportunidad. */
export async function moverLibre(actor, maxPies, motivo) {
  const token = actor?.getActiveTokens?.()[0];
  if (!token) return false;
  const dest = await elegirCasilla(token, maxPies, motivo);
  if (!dest) return false;
  const g = canvas.grid.size, porPie = g / (canvas.scene?.grid?.distance || 5);
  const pies = Math.round(Math.max(Math.abs(dest.x - token.document.x), Math.abs(dest.y - token.document.y)) / porPie);
  await token.document.update({ x: dest.x, y: dest.y }, { ecosMovOk: true });
  // El turno lo cuenta solo si es el combatiente activo: se lo devuelvo para que no gaste movimiento.
  const combat = game.combat?.started ? game.combat : null, c = combat?.combatant;
  if (c && c.tokenId === token.id) {
    const { cambiarTurno } = await import("./turno-tracker.js");
    await cambiarTurno(c.id, { op: "mas", pies });
  }
  return true;
}

/** El aviso de forzarse. */
async function confirmarForzarse(actor, item, p) {
  const e = V.estado(actor) ?? {}, valor = Number(e.valor) || 0;
  let recDia = null; try { recDia = V.recuperacionLargaVerbe?.(actor); } catch { recDia = null; }
  const t = textoForzarse({ nombre: item.name, valor, despues: p.despues, limite: V.limiteNegativo(actor), grado: Number(metaDe(item)?.g) || 0, agotamiento: sistema.agotamiento(actor), recDia });
  const si = await foundry.applications.api.DialogV2.confirm({ window: { title: "Forzarte más allá de tus límites", icon: "fa-solid fa-heart-crack" },
    content: `<div class="ecos-dialogo"><p>${t.pregunta}</p><p>${t.riesgo}</p><details><summary>¿Y después?</summary><p>${t.recuperar}</p></details></div>`,
    yes: { label: "Sí, me fuerzo", icon: "fa-solid fa-fire" }, no: { label: "No" }, rejectClose: false });
  if (!si) return false;
  const para = game.users.filter(u => u.isGM || actor.testUserPermission(u, "OWNER")).map(u => u.id);
  await ChatMessage.create({ whisper: para, speaker: ChatMessage.getSpeaker({ actor }), flags: { [MOD]: { forzarse: true } },
    content: `<section class="ecos-forzarse"><h3>⚠ ${esc(actor.name)} se fuerza</h3><p>${t.pregunta.replace("¿Quieres forzarte más allá de tus límites?", "Decide forzarse.")}</p><p><b>Lo que arriesga:</b> ${t.riesgo}</p><p><b>Para recuperarse (si sobrevive):</b> ${t.recuperar}</p></section>` });
  return true;
}

/** Al usar algo: forzarse, y manos ocupadas mientras canaliza. */
function antesDeUsar(activity, usage, dialog, message) {
  const actor = activity?.actor, item = activity?.item;
  if (!actor || !item || !(actor.isOwner)) return;
  const meta = metaDe(item);
  // Manos ocupadas: lo de D&D que usa las manos se frena mientras canalizas.
  if (!meta && !usage?.ecosManosOk && usaManos(activity) && V.estado(actor)?.despierto) {
    const canal = actor.effects?.find?.(x => x.getFlag?.(MOD, F)?.canalizar && !x.disabled);
    if (canal) {
      preguntarCancelar(actor, canal, `No puedes usar <b>${esc(item.name)}</b>: tus manos están concentradas en <b>${esc(canal.name.replace(/^Canalizando:\s*/, ""))}</b>.`)
        .then(ok => ok && activity.use({ ...(usage ?? {}), ecosManosOk: true }, dialog, message)).catch(err => console.error(`${MOD} | manos ocupadas`, err));
      return false;
    }
  }
  // Forzarse: preguntar antes de bajar a negativo.
  if (meta && !usage?.ecosSobreOk && leer("confirmarForzarse", true)) {
    let p = null; try { p = V.previsualizarUso(actor, meta, Number(meta.g) || 0); } catch { p = null; }
    if (p?.ok && p.despues < 0) {
      confirmarForzarse(actor, item, p).then(ok => ok && activity.use({ ...(usage ?? {}), ecosSobreOk: true }, dialog, message)).catch(err => console.error(`${MOD} | forzarse`, err));
      return false;
    }
  }
}
/** Cancelar la canalización devolviendo el Verbe pagado. */
async function preguntarCancelar(actor, canal, motivo) {
  const fl = canal.getFlag(MOD, F)?.canalizar ?? {};
  const si = await foundry.applications.api.DialogV2.confirm({ window: { title: "Estás canalizando", icon: "fa-solid fa-hands" },
    content: `<p>${motivo}</p><p>¿Quieres cancelar la canalización y recuperar tu Verbe${fl.pagado ? ` (${fl.pagado})` : ""} para hacer la acción que elegiste?</p>`,
    yes: { label: "Cancelar y recuperar mi Verbe", icon: "fa-solid fa-rotate-left" }, no: { label: "Sigo canalizando" }, rejectClose: false });
  if (!si) return false;
  await canal.delete();
  if (fl.pagado) { const e = V.estado(actor) ?? {}; await V.guardar(actor, { valor: (Number(e.valor) || 0) + Number(fl.pagado) }); }
  await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), content: `<p>${esc(actor.name)} suelta la técnica que canalizaba${fl.pagado ? ` y recupera ${fl.pagado} de Verbe` : ""}.</p>` });
  return true;
}

/** Después de usar: Sombra bajo el salto, escapes. */
async function despuesDeUsar(activity) {
  const actor = activity?.actor, meta = metaDe(activity?.item);
  if (!actor || !meta || !actor.isOwner) return;
  if (meta.id === "cuerpo-sombra-danzante") {
    const movio = await moverLibre(actor, 10, "Sombra bajo el salto");
    const hondo = actor.items.find(i => metaDe(i)?.id === "cuerpo-golpe-hondo");
    if (movio && hondo) {
      const si = await foundry.applications.api.DialogV2.confirm({ window: { title: "Sombra bajo el salto" }, content: `<p>Caes junto a tu blanco. ¿Usas <b>Golpe hondo</b> ahora?</p>`, rejectClose: false });
      if (si) await V.usarTecnica(actor, "cuerpo-golpe-hondo");
    }
  }
  if (meta.escape) await resolverEscape(actor, meta);
}
/** Escape: te mueves y quien te busca prueba Percepción (o Arcanos) contra tu CD de Verbe. */
export async function resolverEscape(actor, meta) {
  const e = V.estado(actor) ?? {}, cd = 8 + V.competencia(actor) + V.modDe(actor, e.car);
  const pies = piesEscape(meta.gUso ?? meta.g);
  await moverLibre(actor, pies, meta.nombre ?? "Escape");
  await actor.toggleStatusEffect?.("ecosDesenganche", { active: true }).catch(() => null);
  const yo = actor.getActiveTokens()[0], prueba = pruebaEscape(meta.rama);
  const lejos = (canvas.tokens?.placeables ?? []).filter(t => t.actor && t !== yo && (t.document.disposition ?? 0) * (yo?.document.disposition ?? 0) < 0
    && Math.hypot(t.center.x - (yo?.center.x ?? 0), t.center.y - (yo?.center.y ?? 0)) <= canvas.grid.size * 12);
  const filas = [];
  for (const t of lejos) {
    const mod = Number(t.actor.system?.skills?.[prueba]?.total ?? t.actor.system?.skills?.[prueba]?.mod ?? 0) || 0;
    const r = await new Roll("1d20 + @m", { m: mod }).evaluate();
    filas.push(`${esc(t.name)}: ${r.total} — ${r.total >= cd ? "te sigue" : "<b>te pierde de vista</b>"}`);
  }
  await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), whisper: game.users.filter(u => u.isGM || actor.testUserPermission(u, "OWNER")).map(u => u.id),
    content: `<section class="ecos-escape"><h3>${esc(actor.name)} escapa</h3><p>Se mueve hasta ${pies} ft sin provocar ataques de oportunidad. Quien lo buscaba prueba ${prueba === "arc" ? "Arcanos" : "Percepción"} contra CD ${cd}.</p><p>${filas.join("<br>") || "No había enemigos cerca."}</p><p class="ecos-nota">Quien te pierde de vista no puede atacarte hasta encontrarte (acción Buscar).</p></section>` });
}

/** Moneda Antigua desde la barra: en combate gasta la acción Verbe. */
export async function recargarConMoneda(actor) {
  if (!V.tieneDote(actor, "moneda-al-verbe")) return ui.notifications.warn("Para recargar con una Moneda Antigua hace falta la dote «Moneda al Verbe» (se da al despertar).");
  if (sistema.moneda(actor) < 1) return ui.notifications.warn(`${actor.name} no tiene Monedas Antiguas.`);
  const combat = game.combat?.started ? game.combat : null;
  if (combat?.combatants?.some?.(c => c.actor === actor || c.actorId === actor.id)) {
    const tv = V.turnoVerbe?.(actor);
    if (tv && !tv.accionLibre) return ui.notifications.warn("En combate, recargar con una Moneda gasta tu acción Verbe, y ya la usaste este turno.");
    await V.gastarAccionVerbe?.(actor);
  }
  return V.gastarMoneda(actor, "verbe");
}

if (globalThis.Hooks) {
  Hooks.once("init", () => {
    try { game.settings.register(MOD, "confirmarForzarse", { name: "Preguntar antes de forzarse", hint: "Si una técnica te deja en Verbe negativo, primero pregunta y explica el riesgo y cómo recuperarse (en un susurro).", scope: "world", config: true, type: Boolean, default: true }); } catch { /* ya */ }
  });
  sistema.gancho("antesDeUsar", antesDeUsar);
  Hooks.on("dnd5e.postUseActivity", activity => { despuesDeUsar(activity).catch(err => console.error(`${MOD} | 3.34`, err)); });
  // Moverte mientras canalizas: aviso con la opción de cancelar.
  Hooks.on("preMoveToken", (doc, movement, operation) => {
    const actor = doc?.actor;
    if (!actor?.isOwner || operation?.ecosMovOk || movement?.updateOptions?.ecosMovOk) return;
    const canal = actor.effects?.find?.(x => x.getFlag?.(MOD, F)?.canalizar && !x.disabled);
    if (!canal) return;
    const dest = movement?.destination ?? {};
    preguntarCancelar(actor, canal, `Tu movimiento está tomado: estás canalizando <b>${esc(canal.name.replace(/^Canalizando:\s*/, ""))}</b> y no puedes moverte.`)
      .then(ok => ok && doc.update({ x: dest.x, y: dest.y }, { ecosMovOk: true })).catch(err => console.error(`${MOD} | canalizando`, err));
    return false;
  });
  Hooks.once("ready", () => { const api = game.modules.get(MOD)?.api; if (api?.verbe) api.verbe.recargarConMoneda = recargarConMoneda; });
}
