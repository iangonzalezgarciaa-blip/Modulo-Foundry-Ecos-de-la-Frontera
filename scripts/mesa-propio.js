/**
 * 3.32 · Arreglos de mesa (pedidos del autor):
 *  - Una técnica o acción que solo es sobre ti (alcance «Yo», sin área) nunca toca al objetivo marcado: no pide el pase
 *    del DM por él y, sin midi-qol, sus efectos se ponen en quien la usa aunque haya otro token marcado.
 *  - «Recuperar el control»: lo que hacía F5 cuando el DM se quedaba sin poder mover fichas (un diálogo que se tragó el
 *    soltar del ratón), sin recargar.
 */
const MOD = "ecos-frontera";

/** ¿La actividad es solo sobre quien la usa? Puro: mira alcance, objetivo y plantilla (y los del objeto si no los cambia). */
export function soloSobreSi(act) {
  if (!act) return false;
  const it = act.item?.system ?? {};
  const t = act.target ?? {}, r = act.range ?? {};
  const tpl = t.template?.type || (t.override ? "" : it.target?.template?.type);
  if (tpl) return false;
  const afecta = t.affects?.type || (t.override ? "" : it.target?.affects?.type);
  if (afecta === "self") return true;
  if (afecta) return false;
  const unidad = r.units || (r.override ? "" : it.range?.units);
  return unidad === "self" && !["attack", "save"].includes(act.type);
}

/** Los efectos que la actividad pone, como datos listos para crear en quien la usa. Puro salvo `toObject`. */
export function efectosParaUsuario(act, yaTiene = []) {
  const ids = (act?.effects ?? []).map(e => e?._id ?? e?.effect?.id).filter(Boolean);
  const nombres = new Set(yaTiene);
  const out = [];
  for (const id of ids) {
    const ef = act.item?.effects?.get?.(id);
    if (!ef || nombres.has(ef.name)) continue;
    const d = typeof ef.toObject === "function" ? ef.toObject() : foundry.utils.deepClone(ef);
    delete d._id; d.transfer = false; d.disabled = false; d.origin = act.item?.uuid ?? null;
    out.push(d); nombres.add(ef.name);
  }
  return out;
}

/** Pone en quien la usa los efectos de una actividad solo sobre sí (sin midi-qol, que ya lo hace). */
export async function aplicarEnUsuario(act) {
  const actor = act?.actor;
  if (!actor || !soloSobreSi(act) || game.modules.get("midi-qol")?.active) return 0;
  if (!(game.user.isGM || actor.isOwner)) return 0;
  const ya = actor.effects.filter(e => e.origin === act.item?.uuid && !e.disabled).map(e => e.name);
  const datos = efectosParaUsuario(act, ya);
  if (datos.length) await actor.createEmbeddedDocuments("ActiveEffect", datos);
  return datos.length;
}

/** Devuelve el control de las fichas sin recargar: suelta arrastres colgados, vuelve a la capa de tokens y a «Seleccionar». */
export async function recuperarControl({ avisar = true } = {}) {
  const hechos = [];
  const intentar = (txt, fn) => { try { fn(); hechos.push(txt); } catch { /* no aplica en esta versión */ } };
  intentar("ratón del lienzo", () => canvas.mouseInteractionManager?.reset?.({ interactionData: true, state: true }));
  intentar("arrastre en curso", () => { canvas.currentMouseManager?.cancel?.(); });
  for (const t of canvas.tokens?.placeables ?? []) { try { t.mouseInteractionManager?.reset?.({ interactionData: true, state: true }); } catch { /* sigue */ } }
  intentar("capa de tokens", () => canvas.tokens?.activate?.());
  try { await ui.controls?.activate?.({ control: "tokens", tool: "select" }); hechos.push("herramienta Seleccionar"); } catch { /* sigue */ }
  try { document.activeElement?.blur?.(); } catch { /* sigue */ }
  if (avisar) ui.notifications.info("Control recuperado: ya puedes seleccionar y mover fichas. Si no, recién ahí F5.");
  return hechos;
}

if (globalThis.Hooks) {
  Hooks.once("ready", () => {
    const api = game.modules.get(MOD)?.api;
    if (api) api.recuperarControl = recuperarControl;
  });
}
