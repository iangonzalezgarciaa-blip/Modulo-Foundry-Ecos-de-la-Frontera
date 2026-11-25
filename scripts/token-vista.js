/**
 * 3.80.2 · Iconos de defensa reducidos: un icono pequeño en el token solo cuando el efecto está activo.
 * El interruptor del Active Effect en la pestaña Efectos de la hoja controla tanto la mecánica como el icono.
 * Los tokens a silueta conservan su funcionamiento independiente.
 */
import { DEFENSAS, defensasActivasDe } from "./ruptura.js";
const MOD = "ecos-frontera", SIL = "icons/svg/mystery-man.svg";
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
export const iconoDefensa = tipo => DEFENSAS[tipo]?.img ?? null;
/** Mantiene el tamaño anterior y lo reduce un 70 % (el 30 % restante). */
export const tamanoIconoDefensa = anchoToken => Math.max(4, Math.round(Math.min(22, Math.max(12, (Number(anchoToken) || 80) * 0.22)) * 0.3);
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
    const activos = token.actor ? defensasActivasDe(token.actor) : [];
    const tipos = activos.filter(d => iconoDefensa(d.tipo));
    let contenedor = token.ecosDefensas;
    if (!veDefensa(modo, game.user.isGM) || !token.visible || !tipos.length) {
      if (contenedor && !contenedor.destroyed) contenedor.visible = false;
      return;
    }
    if (!contenedor || contenedor.destroyed) {
      contenedor = new PIXI.Container();
      contenedor.interactive = false;
      token.ecosDefensas = contenedor;
      token.ecosDefensaSprites = new Map();
      token.addChild(contenedor);
    }
    const lado = tamanoIconoDefensa(token.w), separacion = 1;
    const sprites = token.ecosDefensaSprites ??= new Map();
    for (const sprite of sprites.values()) sprite.visible = false;
    const inicio = token.w - tipos.length * lado - (tipos.length - 1) * separacion - 2;
    tipos.forEach((d, i) => {
      const img = iconoDefensa(d.tipo);
      let sprite = sprites.get(d.tipo);
      if (!sprite || sprite.destroyed) {
        sprite = new PIXI.Sprite(PIXI.Texture.from(img));
        sprite.anchor.set(0.5);
        sprite.interactive = false;
        sprites.set(d.tipo, sprite);
        contenedor.addChild(sprite);
      } else if (sprite._ecosImg !== img) sprite.texture = PIXI.Texture.from(img);
      sprite._ecosImg = img;
      sprite.width = lado;
      sprite.height = lado;
      sprite.position.set(inicio + i * (lado + separacion) + lado / 2, lado / 2 + 2);
      sprite.visible = true;
    });
    contenedor.visible = true;
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
  Hooks.once("init", () => game.settings.register(MOD, "defensaVisible", { name: "Defensa a la vista en el token", hint: "Un icono pequeño en el token cuando su defensa está activa. Cada ficha puede activarla o desactivarla en la pestaña Efectos.", scope: "world", config: true, type: String, default: "todos",
    choices: { todos: "La ven todos", dm: "Solo el DM", nadie: "Nadie" }, onChange: () => canvas?.tokens?.placeables?.forEach(dibujar) }));
  Hooks.once("ready", () => { const api = game.modules.get(MOD)?.api; if (api) api.siluetas = abrirSiluetas; });
  Hooks.on("refreshToken", dibujar);
  Hooks.on("updateActor", actor => refrescarActor(actor));
  for (const h of ["createActiveEffect", "deleteActiveEffect", "updateActiveEffect"]) Hooks.on(h, ef => { if (ef.parent instanceof Actor) refrescarActor(ef.parent); });
}
