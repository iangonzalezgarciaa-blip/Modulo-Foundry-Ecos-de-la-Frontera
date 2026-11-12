/**
 * 3.43 · Lo que se ve en el token (aprobado por el autor, 11-nov-2026).
 *  1) Defensa a la vista: un anillo de color y una letra en el token según su defensa (Coraza azul «C», Fortaleza
 *     dorada «F», Cuerpo sordo violeta «S»). Ajuste: lo ven todos, solo el DM o nadie.
 *  2) Tokens a silueta: el DM elige qué criaturas y PNJ vuelven a la silueta (las que tienen imagen del sistema o de
 *     un módulo que no calza). Guarda la imagen anterior y se puede deshacer.
 */
import { defensaDe } from "./ruptura.js";
const MOD = "ecos-frontera", SIL = "icons/svg/mystery-man.svg";
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
export const COLOR_DEFENSA = { coraza: 0x4a7fb5, fortaleza: 0xd4a017, piel: 0x8e5bb5 };
export const LETRA_DEFENSA = { coraza: "C", fortaleza: "F", piel: "S" };
/** ¿Lo ve este usuario? Puro. */
export const veDefensa = (modo, esGM) => modo === "todos" || (modo === "dm" && !!esGM);
/** ¿Esta imagen es candidata a volver a silueta? (del sistema, de módulos de arte o del propio módulo). Puro. */
export function imagenCandidata(src) {
  const s = String(src ?? "");
  if (!s || s === SIL || s.startsWith("icons/svg/")) return false;
  return /^(systems\/dnd5e\/|modules\/(ecos-frontera|JB2A_DnD5e|plutonium|dnd5e-)|https?:)/i.test(s);
}

function dibujar(token) {
  try {
    const modo = game.settings.get(MOD, "defensaVisible");
    const d = token.actor ? defensaDe(token.actor) : null;
    let g = token.ecosDefensa;
    if (!d || !veDefensa(modo, game.user.isGM) || !token.visible) { if (g && !g.destroyed) g.visible = false; return; }
    if (!g || g.destroyed) { g = new PIXI.Container(); g.addChild(new PIXI.Graphics()); token.ecosDefensa = g; token.addChild(g); }
    const [ring] = g.children, w = token.w, h = token.h, color = COLOR_DEFENSA[d.tipo] ?? 0xffffff;
    ring.clear(); ring.lineStyle(Math.max(2, w * 0.035), color, 0.9); ring.drawEllipse(w / 2, h / 2, w / 2 + 1, h / 2 + 1);
    let t = g.children[1];
    if (!t) { t = new PIXI.Text("", { fontFamily: "Signika, sans-serif", fontWeight: "bold", fontSize: Math.max(12, w * 0.2), fill: color, stroke: 0x000000, strokeThickness: 3 }); g.addChild(t); }
    t.text = `${LETRA_DEFENSA[d.tipo] ?? "?"}${d.n ? `+${d.n}` : ""}`; t.style.fill = color; t.position.set(w - t.width, 0);
    g.visible = true;
  } catch (err) { console.debug(`${MOD} | defensa visible`, err); }
}
const refrescarActor = actor => { for (const t of canvas?.tokens?.placeables ?? []) if (t.actor === actor || t.actor?.id === actor?.id) dibujar(t); };

/** Tokens a silueta, con la imagen anterior guardada para deshacer. */
export async function abrirSiluetas() {
  if (!game.user.isGM) return;
  const lista = game.actors.filter(a => a.type !== "character" && !a.hasPlayerOwner && (imagenCandidata(a.img) || imagenCandidata(a.prototypeToken?.texture?.src)));
  const deshacibles = game.actors.filter(a => a.getFlag(MOD, "imgAnterior"));
  const r = await foundry.applications.api.DialogV2.wait({ window: { title: "Tokens a silueta", icon: "fa-solid fa-user-secret" }, position: { width: 620, height: 600 },
    content: `<div class="ecos-dialogo"><p>Criaturas y PNJ con una imagen del sistema o de un módulo de arte (puede no calzar con lo que son en tu mundo). Marca las que vuelven a la silueta. La imagen anterior se guarda: «Deshacer» la devuelve.</p>
      <p><label class="ecos-check"><input type="checkbox" data-todas> Marcar todas (${lista.length})</label></p>
      <div style="max-height:360px;overflow:auto">${lista.map(a => `<label class="ecos-check"><input type="checkbox" name="a-${a.id}"> <img src="${esc(a.img)}" width="24" height="24" style="vertical-align:middle"> ${esc(a.name)} <small>${esc(a.folder?.name ?? "")}</small></label>`).join("") || "<p>No hay ninguna.</p>"}</div>
      ${deshacibles.length ? `<p class="ecos-nota">${deshacibles.length} fichas ya pasadas a silueta se pueden devolver con «Deshacer todas».</p>` : ""}</div>`,
    render: (_ev, dlg) => dlg.element?.querySelector("[data-todas]")?.addEventListener("change", ev => dlg.element.querySelectorAll("input[name^='a-']").forEach(i => { i.checked = ev.target.checked; })),
    buttons: [{ action: "ok", label: "A silueta", default: true, callback: (_e, b) => Object.fromEntries(new FormData(b.form)) }, { action: "deshacer", label: "Deshacer todas" }, { action: "no", label: "Cancelar" }], rejectClose: false });
  if (!r || r === "no") return;
  if (r === "deshacer") {
    for (const a of deshacibles) {
      const p = a.getFlag(MOD, "imgAnterior");
      await a.update({ img: p.img, "prototypeToken.texture.src": p.token, [`flags.${MOD}.-=imgAnterior`]: null });
      for (const sc of game.scenes) { const ts = sc.tokens.filter(t => t.actorId === a.id && t.texture.src === SIL).map(t => ({ _id: t.id, "texture.src": p.token })); if (ts.length) await sc.updateEmbeddedDocuments("Token", ts); }
    }
    return ui.notifications.info(`Devueltas ${deshacibles.length} imágenes.`);
  }
  let n = 0;
  for (const a of lista) {
    if (!r[`a-${a.id}`]) continue;
    await a.update({ img: SIL, "prototypeToken.texture.src": SIL, [`flags.${MOD}.imgAnterior`]: { img: a.img, token: a.prototypeToken?.texture?.src } });
    for (const sc of game.scenes) { const ts = sc.tokens.filter(t => t.actorId === a.id).map(t => ({ _id: t.id, "texture.src": SIL })); if (ts.length) await sc.updateEmbeddedDocuments("Token", ts); }
    n++;
  }
  ui.notifications.info(`${n} fichas a silueta. «Deshacer todas» las devuelve.`);
}
if (globalThis.Hooks) {
  Hooks.once("init", () => game.settings.register(MOD, "defensaVisible", { name: "Defensa a la vista en el token", hint: "Un anillo y una letra en el token según su defensa: Coraza (C, azul), Fortaleza (F, dorada), Cuerpo sordo (S, violeta).", scope: "world", config: true, type: String, default: "todos",
    choices: { todos: "La ven todos", dm: "Solo el DM", nadie: "Nadie" }, onChange: () => canvas?.tokens?.placeables?.forEach(dibujar) }));
  Hooks.once("ready", () => { const api = game.modules.get(MOD)?.api; if (api) api.siluetas = abrirSiluetas; });
  Hooks.on("refreshToken", dibujar);
  Hooks.on("updateActor", actor => refrescarActor(actor));
  for (const h of ["createActiveEffect", "deleteActiveEffect", "updateActiveEffect"]) Hooks.on(h, ef => { if (ef.parent instanceof Actor) refrescarActor(ef.parent); });
}
