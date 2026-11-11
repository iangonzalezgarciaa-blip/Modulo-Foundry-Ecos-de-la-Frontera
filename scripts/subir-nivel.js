/**
 * 3.37 · Subir de nivel guiado (pedido del autor): un botón «Subir de nivel» en la cabecera de la hoja de cada PJ que
 * explica qué gana en el próximo nivel de su clase (lo lee del avance de su clase en la hoja: rasgos, puntos de golpe,
 * mejora de características, conjuros) y lo lleva al lugar correcto: el asistente de avance de D&D para aplicarlo y
 * el panel del Verbe para gastar los Trazos nuevos.
 */
const MOD = "ecos-frontera";
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const TIPO_AVANCE = { HitPoints: "Puntos de golpe: tiras tu dado de golpe (o tomas el promedio) y sumas tu CON.", AbilityScoreImprovement: "Mejora de características: +2 a una o +1 a dos, o una dote.",
  ItemGrant: "Rasgos nuevos", ItemChoice: "Eliges entre opciones", ScaleValue: "Algo de tu clase sube (dados, usos)", Subclass: "Eliges tu subclase", Trait: "Competencias nuevas", Size: "Tamaño" };

/** Qué da el siguiente nivel de una clase, a partir de su avance. Puro: recibe [{type, level, title, items:[nombres]}]. */
export function queGana(avances, nivel) {
  return (avances ?? []).filter(a => Number(a.level) === Number(nivel) || (a.type === "HitPoints" && Number(nivel) > 1))
    .map(a => ({ tipo: a.type, texto: a.items?.length ? `${a.title || TIPO_AVANCE[a.type] || a.type}: ${a.items.join(", ")}` : (a.title && a.type !== "HitPoints" ? `${a.title}` : TIPO_AVANCE[a.type] ?? a.type) }));
}
function avancesDe(cls) {
  const out = [];
  for (const adv of cls?.advancement?.byId ? Object.values(cls.advancement.byId) : (cls?.system?.advancement ?? [])) {
    const data = adv.toObject?.() ?? adv, conf = data.configuration ?? {};
    const levels = data.type === "HitPoints" ? [] : (data.level != null ? [data.level] : Object.keys(conf.choices ?? conf.scale ?? {}).map(Number));
    const items = (conf.items ?? []).map(i => { const u = i.uuid ?? i; try { return fromUuidSync(u)?.name ?? null; } catch { return null; } }).filter(Boolean);
    if (data.type === "HitPoints") out.push({ type: "HitPoints", level: 0, title: data.title });
    for (const l of levels) out.push({ type: data.type, level: l, title: data.title, items });
  }
  return out;
}
export async function abrirSubirNivel(actor) {
  if (!actor || actor.type !== "character") return;
  const clases = actor.items.filter(i => i.type === "class");
  if (!clases.length) return ui.notifications.warn("Esta hoja todavía no tiene clase: arrástrala desde el compendio de clases (o usa Plutonium).");
  const filas = clases.map(c => {
    const n = (Number(c.system.levels) || 0) + 1, g = queGana(avancesDe(c), n);
    return `<section class="ecos-subir-clase"><h3>${esc(c.name)} ${n - 1} → ${n}</h3><ul>${g.map(x => `<li>${esc(x.texto)}</li>`).join("") || "<li>Lo de siempre: puntos de golpe.</li>"}</ul><button type="button" data-subir="${c.id}"><i class="fa-solid fa-arrow-up"></i> Subir ${esc(c.name)} con el asistente</button></section>`;
  }).join("");
  const verbe = !!actor.getFlag(MOD, "verbe")?.despierto;
  const plutonium = game.modules.get("plutonium")?.active;
  const dlg = new foundry.applications.api.DialogV2({ window: { title: `Subir de nivel · ${actor.name}`, icon: "fa-solid fa-arrow-up-right-dots" }, position: { width: 480 },
    content: `<div class="ecos-subir-nivel"><p class="ecos-nota">Esto es lo que ganas. El botón abre el asistente de D&D, que te pregunta paso a paso (puntos de golpe, rasgos, mejoras, conjuros).</p>${filas}
      ${verbe ? `<p><b>Verbe:</b> subir de nivel te da <b>4 Trazos</b> nuevos y más reserva. <button type="button" data-verbe><i class="fa-solid fa-bolt"></i> Abrir el panel del Verbe</button></p>` : ""}
      ${plutonium ? `<p class="ecos-nota">También tienes Plutonium: su botón de la hoja sirve para importar una clase nueva (multiclase) o rasgos que falten.</p>` : ""}</div>`,
    buttons: [{ action: "cerrar", label: "Cerrar", default: true }] });
  await dlg.render(true);
  dlg.element?.addEventListener("click", async ev => {
    const b = ev.target.closest("button[data-subir], button[data-verbe]");
    if (!b) return;
    ev.preventDefault(); ev.stopPropagation();
    if (b.dataset.verbe !== undefined) return game.modules.get(MOD)?.api?.verbe?.abrir?.(actor) ?? actor.sheet?.render(true);
    const cls = actor.items.get(b.dataset.subir);
    try {
      const AM = globalThis.dnd5e?.applications?.advancement?.AdvancementManager;
      if (AM?.forLevelChange) { const m = AM.forLevelChange(actor, cls.id, 1); if (m.steps?.length) { m.render(true); await dlg.close(); return; } }
      await cls.update({ "system.levels": (Number(cls.system.levels) || 0) + 1 });
      await dlg.close();
    } catch (err) { console.error(`${MOD} | subir de nivel`, err); ui.notifications.error("No pude abrir el asistente: sube el nivel desde la pestaña de clases de la hoja."); }
  });
}
if (globalThis.Hooks) {
  Hooks.once("ready", () => { const api = game.modules.get(MOD)?.api; if (api) api.subirNivel = abrirSubirNivel; });
  const poner = (app) => {
    const actor = app?.document ?? app?.actor;
    if (!(actor instanceof Actor) || actor.type !== "character" || !actor.isOwner) return;
    const cab = app.element?.querySelector?.(".window-header");
    if (!cab || cab.querySelector(".ecos-subir-boton")) return;
    const b = document.createElement("button");
    b.type = "button"; b.className = "header-control ecos-subir-boton"; b.dataset.tooltip = "Subir de nivel: qué ganas y el asistente paso a paso";
    b.innerHTML = `<i class="fa-solid fa-arrow-up-right-dots"></i> Subir de nivel`;
    b.addEventListener("click", ev => { ev.preventDefault(); ev.stopPropagation(); abrirSubirNivel(actor); });
    cab.querySelector('[data-action="close"], .close')?.before(b);
  };
  Hooks.on("renderActorSheetV2", poner);
  Hooks.on("renderActorSheet", poner);
}
