/**
 * Oponentes impredecibles (tarea 2.3a, decisión D3): que ningún jugador lea PG ni CA exactos de un enemigo.
 * Lo que se mira y se puede corregir desde Mesa Ecos → Diagnóstico (solo el DM):
 *  - Barras de los tokens de PNJ: solo las ve su dueño (el DM). Se corrigen el prototipo y los tokens ya puestos.
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

function ajusteDnd(clave) {
  const def = game.settings?.settings?.get?.(`dnd5e.${clave}`);
  if (!def) return null;
  let valor; try { valor = game.settings.get("dnd5e", clave); } catch { valor = null; }
  return { valor, opciones: Object.keys(def.choices ?? {}) };
}
/** Qué deja ver hoy el mundo. Solo lectura. */
export function revisarOcultacion() {
  const npcs = lista(game.actors).filter(esEnemigo);
  const barras = npcs.filter(a => barrasVisibles(a.prototypeToken?.displayBars)).length;
  const tokens = lista(game.scenes).flatMap(s => lista(s.tokens)).filter(t => esEnemigo(t.actor) && barrasVisibles(t.displayBars)).length;
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
    if (fichaLegible(a.ownership?.default)) u["ownership.default"] = LIM;
    if (Object.keys(u).length) { await a.update(u); if (u["prototypeToken.displayBars"]) hecho.prototipos++; if (u["ownership.default"] !== undefined) hecho.fichas++; }
  }
  for (const s of lista(game.scenes)) {
    const cambios = lista(s.tokens).filter(t => esEnemigo(t.actor) && barrasVisibles(t.displayBars)).map(t => ({ _id: t.id, displayBars: OWNER }));
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
   <ul><li>PNJ revisados: ${r.npcs}.</li><li>Prototipos con la barra de vida visible para jugadores: <b>${r.barras}</b>; tokens ya puestos en escenas: <b>${r.tokens}</b>.</li><li>Fichas de PNJ que los jugadores pueden leer enteras: <b>${r.fichas}</b>.</li>
   <li>${r.ataque ? `dnd5e, visibilidad del ataque: «${r.ataque.valor}»${r.ataque.valor === "all" ? " (muestra la CA del objetivo)" : ""}.` : "Esta versión de dnd5e no tiene ajuste de visibilidad del ataque."}</li><li>${midiTxt}</li></ul>
   ${r.ok ? "<p>Todo oculto.</p>" : `<button type="button" data-em="ocultarEnemigos">Ocultar datos exactos de los enemigos</button>`}<p class="ecos-nota">Cambia barras a «solo dueño» y permisos a «Limitado». Los PNJ nuevos ya nacen así. No toca los ajustes de midi-qol.</p>`;
}
Hooks.on("preCreateActor", (actor, data, opciones, userId) => {
  if (userId !== game.user.id || data?.type !== "npc") return;
  const actual = data?.prototypeToken?.displayBars;
  if (actual === undefined || barrasVisibles(actual)) actor.updateSource({ "prototypeToken.displayBars": MODOS().OWNER });
});
