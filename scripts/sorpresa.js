/**
 * 3.57 · Sorpresa (pedido del autor, 12-nov-2026): «la esencia del ninja: un combate frontal nunca debe ser lo ideal».
 * Un botón del DM en la barra izquierda pone «Sorprendido» a los tokens elegidos (o a los marcados). Mientras dura:
 *  - tira la iniciativa con desventaja (D&D 2024);
 *  - no puede reaccionar: ni reacciones de D&D, ni las del Verbe, ni choques de técnicas, ni ataques de oportunidad;
 *  - los ataques contra él tienen ventaja (así el pícaro tiene su Ataque furtivo).
 * Se va solo al terminar su primer turno. Revertir: el mismo botón con el token elegido, o «Quitar» en el chat.
 */
const MOD = "ecos-frontera";
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
export const SORPRENDIDO = "surprised";
export const TEXTO_SORPRESA = "Sorprendido: tira la iniciativa con desventaja, no puede reaccionar (ni D&D, ni Verbe, ni choques, ni ataques de oportunidad) y los ataques contra él tienen ventaja, hasta el final de su primer turno.";
/** ¿Puede reaccionar? Puro: recibe los estados. */
export const puedeReaccionar = (estados = new Set()) => !(estados?.has?.(SORPRENDIDO));

const soyDM = () => !!game.user?.isGM && (game.users?.activeGM ? game.users.activeGM.isSelf : true);
const sorprendido = a => !!a?.statuses?.has?.(SORPRENDIDO);

/** Pone o quita la sorpresa a los tokens elegidos (o marcados); sin ninguno, deja elegir de la escena. */
export async function alternarSorpresa(tokens = null) {
  if (!game.user.isGM) return;
  let lista = tokens ?? (canvas.tokens?.controlled?.length ? canvas.tokens.controlled : [...(game.user.targets ?? [])]);
  if (!lista.length) {
    const todos = (canvas.tokens?.placeables ?? []).filter(t => t.actor);
    if (!todos.length) return ui.notifications.warn("No hay tokens en la escena.");
    const r = await foundry.applications.api.DialogV2.wait({ window: { title: "Sorpresa", icon: "fa-solid fa-eye-slash" }, position: { width: 420 },
      content: `<div class="ecos-dialogo"><p>${esc(TEXTO_SORPRESA)}</p><p>¿Quién no lo vio venir?</p>${todos.map(t => `<label class="ecos-check"><input type="checkbox" name="${t.id}" ${sorprendido(t.actor) ? "checked" : ""}> ${esc(t.name)}</label>`).join("")}</div>`,
      buttons: [{ action: "ok", label: "Aplicar", icon: "fa-solid fa-check", default: true, callback: (_e, b) => todos.filter(t => b.form.elements[t.id]?.checked !== sorprendido(t.actor)) }, { action: "no", label: "Cancelar" }], rejectClose: false });
    if (!Array.isArray(r) || !r.length) return;
    lista = r;
  }
  const poner = !lista.every(t => sorprendido(t.actor));
  const nombres = [];
  for (const t of lista) {
    const a = t.actor; if (!a) continue;
    if (poner === sorprendido(a)) continue;
    await a.toggleStatusEffect(SORPRENDIDO, { active: poner });
    if (poner && globalThis.MidiQOL?.setReactionUsed) await MidiQOL.setReactionUsed(a).catch?.(() => null);
    nombres.push(t.name);
  }
  if (!nombres.length) return;
  await ChatMessage.create({ whisper: game.users.filter(u => u.isGM).map(u => u.id), content: poner
    ? `<section class="ecos-sorpresa"><p><i class="fa-solid fa-eye-slash"></i> <b>${nombres.map(esc).join(", ")}</b>: Sorprendido${nombres.length > 1 ? "s" : ""}.</p><p><small>${esc(TEXTO_SORPRESA)}</small></p><button type="button" data-ecos-sorpresa-quitar="${lista.map(t => t.document.uuid).join(",")}">Quitar la sorpresa</button></section>`
    : `<p class="ecos-sorpresa"><b>${nombres.map(esc).join(", ")}</b> ya no está${nombres.length > 1 ? "n" : ""} Sorprendido${nombres.length > 1 ? "s" : ""}.</p>` });
}

if (globalThis.Hooks) {
  // Las reacciones de D&D (actividades de reacción) no se usan sorprendido.
  Hooks.on("dnd5e.preUseActivity", activity => {
    if (activity?.activation?.type !== "reaction" || !sorprendido(activity.actor)) return;
    ui.notifications.warn(`${activity.actor.name} está Sorprendido: no puede reaccionar hasta que termine su primer turno.`);
    return false;
  });
  // Se va al terminar su primer turno.
  Hooks.on("updateCombat", (combat, cambios) => {
    if (!soyDM() || !combat.started || !("turn" in cambios || "round" in cambios)) return;
    const prev = combat.combatants.get(combat.previous?.combatantId);
    const a = prev?.actor;
    if (a && sorprendido(a)) a.toggleStatusEffect(SORPRENDIDO, { active: false }).then(() => ChatMessage.create({ whisper: game.users.filter(u => u.isGM).map(u => u.id),
      content: `<p class="ecos-sorpresa"><b>${esc(prev.name)}</b> se repone de la sorpresa: ya puede reaccionar.</p>` })).catch(() => null);
  });
  Hooks.on("renderChatMessageHTML", (_m, html) => {
    for (const b of html.querySelectorAll?.("[data-ecos-sorpresa-quitar]") ?? []) {
      if (!game.user.isGM) { b.remove(); continue; }
      b.addEventListener("click", async ev => {
        ev.preventDefault();
        for (const u of b.dataset.ecosSorpresaQuitar.split(",")) { const d = await fromUuid(u); if (d?.actor && sorprendido(d.actor)) await d.actor.toggleStatusEffect(SORPRENDIDO, { active: false }); }
        b.disabled = true;
      });
    }
  });
  Hooks.once("ready", () => { const api = game.modules.get(MOD)?.api; if (api) api.sorpresa = alternarSorpresa; });
}
