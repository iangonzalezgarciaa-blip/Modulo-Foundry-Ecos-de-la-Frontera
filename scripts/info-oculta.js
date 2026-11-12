/**
 * 3.61 · Información oculta (pedido del autor, 12-nov-2026): «que la gente no pueda ver cómo se encuentran los enemigos,
 * salvo por mi relato o porque tengan la técnica». Para los jugadores:
 *  - Health Estimate deja de mostrarles cómo está cada criatura (solo el DM lo ve). Las barras y la ficha de los PNJ ya
 *    estaban ocultas (Oponentes impredecibles).
 *  - Quien tiene el estado «Escuchando los cuerpos» (la técnica Escuchar el cuerpo, o el DM a mano) ve, al pasar el ratón,
 *    los PG y los estados exactos de las criaturas a 30 ft de su token.
 * Revertir: el ajuste «Ocultar cómo están los demás». A mano: el DM pone o quita «Escuchando los cuerpos» en el token.
 */
const MOD = "ecos-frontera";
export const VER_SALUD = "ecosVerSalud";
export const ALCANCE_ESCUCHAR = 30;
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
/** Lo que ve quien escucha: PG exactos y estados. Puro. */
export function lecturaSalud({ nombre, hp = null, estados = [] } = {}) {
  const pg = hp && Number.isFinite(Number(hp.max)) ? `PG ${Math.max(0, Number(hp.value) || 0)}/${hp.max}${Number(hp.temp) ? ` (+${hp.temp} temporales)` : ""}` : "PG: no tiene";
  return `${nombre} · ${pg}${estados.length ? ` · ${estados.join(", ")}` : " · sin estados"}`;
}
/** ¿Está a su alcance? Distancia de borde a borde en casillas (regla 5-5-5). Puro. */
export function alAlcance(a, b, { casilla = 100, pies = 5, alcance = ALCANCE_ESCUCHAR } = {}) {
  const gx = Math.max(0, Math.max(a.x, b.x) - Math.min(a.x + a.w, b.x + b.w)) / casilla;
  const gy = Math.max(0, Math.max(a.y, b.y) - Math.min(a.y + a.h, b.y + b.h)) / casilla;
  return (Math.max(gx, gy) + 1) * pies <= alcance + pies;
}

/* ---------------- Foundry ---------------- */
const leer = (k, d) => { try { return game.settings.get(MOD, k); } catch { return d; } };
const escucha = actor => !!actor?.statuses?.has?.(VER_SALUD) || [...(actor?.effects ?? [])].some(e => !e.disabled && /escuchar el cuerpo|escuchando los cuerpos/i.test(e.name ?? ""));
function aplicarHealthEstimate() {
  const he = game.healthEstimate; if (!he?.settings || game.user.isGM) return;
  he.settings.showDescription = leer("ocultarSalud", true) ? 1 : Number(game.settings.get("healthEstimate", "core.showDescription") ?? 0);
  try { he.clearOverlays?.(); for (const t of canvas?.tokens?.placeables ?? []) he.refreshToken?.(t, {}); } catch { /* sin refresco */ }
}
async function ponerAlDiaEscuchar() {
  const t = game.modules.get(MOD)?.api?.verbe?.tecnica?.("pulso-escuchar"), ef = t?.item?.effects?.[0];
  if (!ef) return;
  const actores = [...(game.actors ?? []), ...(canvas?.scene?.tokens ?? []).map(x => x.actor).filter(a => a?.isToken)];
  for (const a of actores) for (const it of a.items ?? []) {
    if (it.getFlag?.(MOD, "verbe")?.id !== "pulso-escuchar" || it.effects?.get?.(ef._id)) continue;
    const s = t.item.system, ids = [...(it.system?.activities?.keys?.() ?? Object.keys(it.system?.activities ?? {}))];
    await it.update({ "system.duration": s.duration, "system.range": s.range, "system.target": s.target, "system.properties": s.properties, "system.description.value": s.description.value,
      ...Object.fromEntries(ids.map(id => [`system.activities.${id}.effects`, [{ _id: ef._id, onSave: false }]])) });
    await it.createEmbeddedDocuments("ActiveEffect", [ef], { keepId: true });
  }
}
let caja = null;
function quitarCaja() { caja?.remove(); caja = null; }
function mostrar(token) {
  const yo = canvas.tokens.controlled.find(t => t.actor?.isOwner) ?? game.user.character?.getActiveTokens?.()[0];
  if (!yo || yo === token || !escucha(yo.actor) || !token.actor) return quitarCaja();
  const rect = t => ({ x: t.document.x, y: t.document.y, w: (t.document.width ?? 1) * canvas.grid.size, h: (t.document.height ?? 1) * canvas.grid.size });
  if (!alAlcance(rect(yo), rect(token), { casilla: canvas.grid.size, pies: canvas.scene?.grid?.distance ?? 5 })) return quitarCaja();
  const nombresEstado = [...(token.actor.statuses ?? [])].map(s => CONFIG.statusEffects?.find(x => x.id === s)?.name).filter(Boolean).map(n => game.i18n.localize(n));
  const txt = lecturaSalud({ nombre: token.document.name, hp: token.actor.system?.attributes?.hp, estados: nombresEstado });
  caja ??= Object.assign(document.createElement("div"), { id: "ecos-escuchar" });
  caja.innerHTML = `<i class="fa-solid fa-heart-pulse"></i> ${esc(txt)}`;
  document.body.appendChild(caja);
  const p = canvas.clientCoordinatesFromCanvas?.({ x: token.center.x, y: token.document.y }) ?? { x: 0, y: 0 };
  Object.assign(caja.style, { left: `${Math.round(p.x)}px`, top: `${Math.round(p.y) - 30}px` });
}

if (globalThis.Hooks) {
  Hooks.once("init", () => {
    game.settings.register(MOD, "ocultarSalud", { name: "Ocultar cómo están los demás", hint: "Los jugadores no ven cómo está cada criatura (Health Estimate solo para el DM). Quien tiene «Escuchando los cuerpos» (técnica Escuchar el cuerpo) ve PG y estados exactos a 30 ft al pasar el ratón.",
      scope: "world", config: true, type: Boolean, default: true, onChange: () => aplicarHealthEstimate() });
  });
  Hooks.once("setup", () => {
    const datos = { name: "Escuchando los cuerpos", img: "systems/dnd5e/icons/svg/statuses/marked.svg", description: `<p>Siente el pulso de lo que lo rodea: ve los PG y los estados exactos de las criaturas a ${ALCANCE_ESCUCHAR} ft (al pasar el ratón sobre ellas).</p>` };
    if (CONFIG.DND5E?.statusEffects && !CONFIG.DND5E.statusEffects[VER_SALUD]) CONFIG.DND5E.statusEffects[VER_SALUD] = datos;
    else if (Array.isArray(CONFIG.statusEffects) && !CONFIG.statusEffects.some(s => s.id === VER_SALUD)) CONFIG.statusEffects.push({ id: VER_SALUD, _id: "ecosversalud0000", ...datos });
  });
  Hooks.once("ready", () => {
    aplicarHealthEstimate();
    // 3.61: las hojas que ya sabían «Escuchar el cuerpo» reciben la versión nueva (estado de 1 minuto).
    if (game.user.isGM && (!game.users.activeGM || game.users.activeGM.isSelf)) setTimeout(() => ponerAlDiaEscuchar().catch(err => console.error(`${MOD} | escuchar`, err)), 8000);
  });
  Hooks.on("canvasReady", () => setTimeout(aplicarHealthEstimate, 200));
  Hooks.on("hoverToken", (token, hovered) => {
    if (game.user.isGM || leer("ocultarSalud", true) === false) return;
    if (hovered) mostrar(token); else quitarCaja();
  });
}
