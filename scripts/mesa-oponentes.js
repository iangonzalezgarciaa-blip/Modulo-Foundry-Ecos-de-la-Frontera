/**
 * Oponentes impredecibles (tarea 2.3a, decisión D3): que ningún jugador lea PG ni CA exactos de un enemigo.
 * Lo que se mira y se puede corregir desde Mesa Ecos → Diagnóstico (solo el DM):
 *  - Barras y nombres de los tokens de PNJ: solo los ve su dueño (el DM). Se corrigen el prototipo y los tokens ya puestos.
 *    Health Estimate dice «alguien» en vez del nombre.
 *  - Permiso de las fichas de PNJ: «Limitado» (en dnd5e solo muestra la descripción), nunca «Observador».
 *  - dnd5e: la visibilidad del ataque oculta la CA del objetivo («hideAC») si la versión instalada lo ofrece.
 *  - midi-qol: «ocultar detalles de tiradas» se informa (no se cambia: es su ajuste); «d20Only» o «all» ya ocultan totales.
 * Los PNJ nuevos nacen con barras ocultas para los jugadores.
 */
const MOD = "ecos-frontera";
const MODOS = () => globalThis.CONST?.TOKEN_DISPLAY_MODES ?? { NONE: 0, CONTROL: 10, OWNER_HOVER: 20, HOVER: 30, OWNER: 40, ALWAYS: 50 };
const NIVELES = () => globalThis.CONST?.DOCUMENT_OWNERSHIP_LEVELS ?? { NONE: 0, LIMITED: 1, OBSERVER: 2, OWNER: 3 };
const lista = c => Array.from(c ?? []);
const esEnemigo = a => a?.type === "npc" && !a.hasPlayerOwner;
/** ¿Esta forma de mostrar barras deja ver la vida a un jugador que no es dueño? */
export const barrasVisibles = modo => [MODOS().HOVER, MODOS().ALWAYS].includes(Number(modo));
export const fichaLegible = nivel => Number(nivel) >= NIVELES().OBSERVER;
/** ¿Esta forma de mostrar el nombre deja leerlo a un jugador? */
export const nombreVisible = modo => [MODOS().HOVER, MODOS().ALWAYS].includes(Number(modo));

function ajusteDnd(clave) {
  const def = game.settings?.settings?.get?.(`dnd5e.${clave}`);
  if (!def) return null;
  let valor; try { valor = game.settings.get("dnd5e", clave); } catch { valor = null; }
  return { valor, opciones: Object.keys(def.choices ?? {}) };
}
/** Qué deja ver hoy el mundo. Solo lectura. */
export function revisarOcultacion() {
  const npcs = lista(game.actors).filter(esEnemigo);
  const barras = npcs.filter(a => barrasVisibles(a.prototypeToken?.displayBars) || nombreVisible(a.prototypeToken?.displayName)).length;
  const tokens = lista(game.scenes).flatMap(s => lista(s.tokens)).filter(t => esEnemigo(t.actor) && (barrasVisibles(t.displayBars) || nombreVisible(t.displayName))).length;
  const fichas = npcs.filter(a => fichaLegible(a.ownership?.default)).length;
  const ataque = ajusteDnd("attackRollVisibility");
  let midi = null; try { midi = game.settings.get("midi-qol", "ConfigSettings")?.hideRollDetails ?? null; } catch { midi = null; }
  return { npcs: npcs.length, barras, tokens, fichas, ataque, midi,
    ok: !barras && !tokens && !fichas && (!ataque || ataque.valor !== "all") };
}
/** Aplica lo recomendado. Devuelve lo que cambió. */
export async function ocultarDatosEnemigos() {
  if (!game.user.isGM) return null;
  const OWNER = MODOS().OWNER, LIM = NIVELES().LIMITED, hecho = { prototipos: 0, tokens: 0, fichas: 0, ataque: null };
  for (const a of lista(game.actors).filter(esEnemigo)) {
    const u = {};
    if (barrasVisibles(a.prototypeToken?.displayBars)) u["prototypeToken.displayBars"] = OWNER;
    if (nombreVisible(a.prototypeToken?.displayName)) u["prototypeToken.displayName"] = OWNER;
    if (!a.prototypeToken?.flags?.healthEstimate?.hideName) u["prototypeToken.flags.healthEstimate.hideName"] = true;
    if (fichaLegible(a.ownership?.default)) u["ownership.default"] = LIM;
    if (Object.keys(u).length) { await a.update(u); if (u["prototypeToken.displayBars"] || u["prototypeToken.displayName"]) hecho.prototipos++; if (u["ownership.default"] !== undefined) hecho.fichas++; }
  }
  for (const s of lista(game.scenes)) {
    const cambios = lista(s.tokens).filter(t => esEnemigo(t.actor) && (barrasVisibles(t.displayBars) || nombreVisible(t.displayName) || !t.flags?.healthEstimate?.hideName))
      .map(t => ({ _id: t.id, ...(barrasVisibles(t.displayBars) ? { displayBars: OWNER } : {}), ...(nombreVisible(t.displayName) ? { displayName: OWNER } : {}), "flags.healthEstimate.hideName": true }));
    if (cambios.length) { await s.updateEmbeddedDocuments("Token", cambios); hecho.tokens += cambios.length; }
  }
  const ataque = ajusteDnd("attackRollVisibility");
  if (ataque && ataque.valor === "all" && ataque.opciones.includes("hideAC")) { await game.settings.set("dnd5e", "attackRollVisibility", "hideAC"); hecho.ataque = "hideAC"; }
  return hecho;
}
export function ocultacionHTML() {
  if (!game.user.isGM) return "";
  const r = revisarOcultacion();
  const midiTxt = r.midi === null ? "midi-qol no está activo." : ["d20Only", "all", "allNoRoll"].includes(r.midi) ? `midi-qol oculta los detalles de las tiradas de PNJ («${r.midi}»).` : `midi-qol muestra los totales de los PNJ («${r.midi}»): en sus ajustes de flujo, «Ocultar detalles de tiradas» en «Solo d20» o «Todo».`;
  return `<h3>Oponentes impredecibles</h3><p>Que ningún jugador lea PG ni CA exactos de un enemigo: solo con lectura del Verbe o lo que cuentes por rol.</p>
   <ul><li>PNJ revisados: ${r.npcs}.</li><li>Prototipos con la barra de vida o el nombre visibles para jugadores: <b>${r.barras}</b>; tokens ya puestos en escenas: <b>${r.tokens}</b>.</li><li>Fichas de PNJ que los jugadores pueden leer enteras: <b>${r.fichas}</b>.</li>
   <li>${r.ataque ? `dnd5e, visibilidad del ataque: «${r.ataque.valor}»${r.ataque.valor === "all" ? " (muestra la CA del objetivo)" : ""}.` : "Esta versión de dnd5e no tiene ajuste de visibilidad del ataque."}</li><li>${midiTxt}</li></ul>
   ${r.ok ? "<p>Todo oculto.</p>" : `<button type="button" data-em="ocultarEnemigos">Ocultar datos exactos y nombres de los enemigos</button>`}<p class="ecos-nota">Cambia barras y nombres a «solo dueño», permisos a «Limitado» y Health Estimate dice «alguien». Los PNJ nuevos ya nacen así. No toca los ajustes de midi-qol.</p>`;
}
Hooks.on("preCreateActor", (actor, data, opciones, userId) => {
  if (userId !== game.user.id || data?.type !== "npc") return;
  const u = { "prototypeToken.flags.healthEstimate.hideName": true };
  if (data?.prototypeToken?.displayBars === undefined || barrasVisibles(data.prototypeToken.displayBars)) u["prototypeToken.displayBars"] = MODOS().OWNER;
  if (data?.prototypeToken?.displayName === undefined || nombreVisible(data.prototypeToken.displayName)) u["prototypeToken.displayName"] = MODOS().OWNER;
  actor.updateSource(u);
});
/** 3.7: el autor pidió ocultar nombres y datos a los jugadores; se aplica una vez sola al cargar (luego, botón en Diagnóstico). */
Hooks.once("ready", () => {
  if (!game.user.isGM || (game.users.activeGM && !game.users.activeGM.isSelf)) return;
  let hecho = false; try { hecho = game.settings.get(MOD, "oponentesOcultos37") === true; } catch { return; }
  if (hecho) return;
  setTimeout(async () => {
    try {
      const h = await ocultarDatosEnemigos();
      await game.settings.set(MOD, "oponentesOcultos37", true);
      if (h) ChatMessage.create({ whisper: game.users.filter(u => u.isGM).map(u => u.id), content: `<div class="ecos-card"><h3>Ecos 3.7 · Enemigos sin datos ni nombres</h3><p>Barras y nombres de PNJ solo para su dueño: ${h.prototipos} prototipo(s) y ${h.tokens} token(s). ${h.fichas} ficha(s) en «Limitado». Health Estimate dice «alguien». Lo puedes revisar en Mesa Ecos → Diagnóstico.</p></div>` });
    } catch (err) { console.warn(`${MOD} | ocultar enemigos`, err); }
  }, 6000);
});
Hooks.once("init", () => { try { game.settings.register(MOD, "oponentesOcultos37", { scope: "world", config: false, type: Boolean, default: false }); } catch { /* ya */ } });
