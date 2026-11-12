/**
 * 3.54 · Conjuros por huecos (pedido del autor, 12-nov-2026): como las dotes, el libro de conjuros muestra los huecos que
 * la clase da en cada nivel (Manual 2024): trucos, y conjuros preparados (o el libro gratis del mago). Un hueco vacío se
 * toca y abre el buscador con los conjuros de D&D y de PF2e (en español) de esa lista y de los niveles que ya lanza; si ya
 * tienes conjuros sin preparar, primero te ofrece prepararlos.
 * Se revierte: «Quitar conjuros» (lupa) o despreparar en la hoja; el ajuste del mundo quita los huecos.
 * A mano (DM): «Aprender conjuros» con Mayús busca sin filtro de lista, y el DM puede sumar lo que quiera.
 */
import { abrirLupa, NOMBRE_CLASE } from "./conjuros.js";

const MOD = "ecos-frontera";
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const lista = x => Array.from(x?.contents ?? x ?? []);

/** Tablas del Manual 2024 (las mismas que traen las clases de dnd5e), por si la clase de la hoja no las tiene. */
export const TRUCOS_2024 = { bard: { 1: 2, 4: 3, 10: 4 }, cleric: { 1: 3, 4: 4, 10: 5 }, druid: { 1: 2, 4: 3, 10: 4 },
  sorcerer: { 1: 4, 4: 5, 10: 6 }, warlock: { 1: 2, 4: 3, 10: 4 }, wizard: { 1: 3, 4: 4, 10: 5 } };
const COMPLETO = { 1: 4, 2: 5, 3: 6, 4: 7, 5: 9, 6: 10, 7: 11, 8: 12, 9: 14, 10: 15, 11: 16, 13: 17, 15: 18, 17: 19, 18: 20, 19: 21, 20: 22 };
const MEDIO = { 1: 2, 2: 3, 3: 4, 4: 5, 5: 6, 7: 7, 9: 9, 11: 10, 13: 11, 15: 12, 17: 14, 19: 15 };
export const PREPARADOS_2024 = { bard: COMPLETO, cleric: COMPLETO, druid: COMPLETO, paladin: MEDIO, ranger: MEDIO,
  sorcerer: { ...COMPLETO, 1: 2, 2: 4 }, warlock: { 1: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 7, 7: 8, 8: 9, 9: 10, 11: 11, 13: 12, 15: 13, 17: 14, 19: 15 },
  wizard: { ...COMPLETO, 14: 18, 15: 19, 16: 21, 17: 22, 18: 23, 19: 24, 20: 25 } };
/** El valor de una tabla por escalones (el último nivel ≤ n). Puro. */
export function deTabla(tabla, n) {
  let v = 0;
  for (const [k, x] of Object.entries(tabla ?? {}).sort((a, b) => Number(a[0]) - Number(b[0]))) if (Number(k) <= n) v = Number(x) || 0;
  return v;
}
/** Libro del mago: 6 conjuros gratis al nivel 1 y 2 más por nivel (Manual 2024). */
export const libroMago = n => (n >= 1 ? 6 + 2 * (n - 1) : 0);

/**
 * Los huecos de una clase. `conjuros`: los de la hoja de esa clase ({id, name, img, level, prep, metodo, copia}).
 * Devuelve { trucos: {max, llenos}, conjuros: {modo, max, llenos, sinPreparar} }. Puro.
 */
export function huecosConjurosDe({ clase, nivel, trucosMax = null, preparadosMax = null, conjuros = [] }) {
  const tMax = trucosMax ?? deTabla(TRUCOS_2024[clase], nivel);
  const trucos = conjuros.filter(c => Number(c.level) === 0);
  const nivelados = conjuros.filter(c => Number(c.level) >= 1 && c.metodo !== "innate" && c.metodo !== "atwill");
  if (clase === "wizard") {
    const libro = nivelados.filter(c => !c.copia);
    return { trucos: { max: tMax, llenos: trucos }, conjuros: { modo: "libro", max: libroMago(nivel), llenos: libro, sinPreparar: [] } };
  }
  const siempre = c => Number(c.prep) === 2 || c.metodo === "always";
  const preparados = nivelados.filter(c => !siempre(c) && Number(c.prep) === 1);
  const sinPreparar = nivelados.filter(c => !siempre(c) && !Number(c.prep));
  return { trucos: { max: tMax, llenos: trucos },
    conjuros: { modo: "preparados", max: Number(preparadosMax) || deTabla(PREPARADOS_2024[clase], nivel), llenos: preparados, sinPreparar } };
}

/* ---------------- Foundry ---------------- */
const leer = (k, d) => { try { return game.settings.get(MOD, k); } catch { return d; } };
const activo = () => leer("huecosConjuros", true) !== false && game.system?.id === "dnd5e";

/** Los huecos de cada clase lanzadora de la hoja. */
export function huecosDeActor(actor) {
  const clases = Object.entries(actor?.spellcastingClasses ?? {});
  const hechizos = lista(actor?.items).filter(i => i.type === "spell");
  const deClase = (i, id) => {
    const src = i.system?.sourceClass ?? String(i.system?.sourceItem ?? "").split(":")[1];
    return src ? src === id : clases.length === 1;
  };
  return clases.map(([id, cls]) => {
    const nivel = Number(cls.system?.levels) || 1, sub = cls.subclass;
    const scale = actor.system?.scale ?? {};
    const trucosMax = scale[id]?.["cantrips-known"]?.value ?? scale[sub?.identifier]?.["cantrips-known"]?.value ?? null;
    const preparadosMax = Number(cls.system?.spellcasting?.preparation?.max) || Number(sub?.system?.spellcasting?.preparation?.max) || null;
    const conjuros = hechizos.filter(i => deClase(i, id)).map(i => ({ id: i.id, name: i.name, img: i.img, level: i.system?.level,
      prep: i.system?.prepared ?? (i.system?.preparation?.prepared ? 1 : 0), metodo: i.system?.method ?? i.system?.preparation?.mode, copia: i.flags?.[MOD]?.aprendido?.modo === "copia" }));
    return { id, nombre: cls.name ?? NOMBRE_CLASE[id] ?? id, nivel, ...huecosConjurosDe({ clase: id, nivel, trucosMax, preparadosMax, conjuros }) };
  }).filter(h => h.trucos.max || h.conjuros.max);
}
const vaciosDe = h => Math.max(0, h.trucos.max - h.trucos.llenos.length) + Math.max(0, h.conjuros.max - h.conjuros.llenos.length);

function htmlPanel(actor) {
  const hs = huecosDeActor(actor);
  if (!hs.length) return "";
  const duenio = actor.isOwner;
  const fila = (h, tipo) => {
    const g = h[tipo], vacios = Math.max(0, g.max - g.llenos.length), extra = Math.max(0, g.llenos.length - g.max);
    const titulo = tipo === "trucos" ? "Trucos" : g.modo === "libro" ? "Libro (gratis)" : "Preparados";
    const chips = g.llenos.map(c => `<a class="ecos-hc-chip lleno" data-ecos-hc="ver" data-id="${c.id}" data-tooltip="${esc(c.name)}"><img src="${esc(c.img)}" alt=""></a>`).join("")
      + Array.from({ length: vacios }, () => `<a class="ecos-hc-chip vacio" ${duenio ? `data-ecos-hc="elegir" data-clase="${h.id}" data-tipo="${tipo}"` : ""} data-tooltip="${esc(duenio ? "Hueco libre: toca para elegir" : "Hueco libre")}"><i class="fa-solid fa-plus" inert></i></a>`).join("");
    return g.max ? `<div class="ecos-hc-fila"><span class="ecos-hc-et">${titulo} <b>${g.llenos.length}/${g.max}</b>${extra ? ` <em class="ecos-hc-extra" data-tooltip="Más de los que tu clase permite: quita o despreparar ${extra}.">+${extra}</em>` : ""}</span><span class="ecos-hc-chips">${chips}</span></div>` : "";
  };
  const total = hs.reduce((a, h) => a + vaciosDe(h), 0);
  return `<div class="ecos-hc-cab"><b><i class="fa-solid fa-wand-sparkles"></i> Conjuros por nivel</b>${total ? ` <span class="ecos-hc-pend">${total} por elegir</span>` : ""}
    <small>Los huecos que te da tu clase. Toca un <i class="fa-solid fa-plus"></i> para ver los conjuros de D&amp;D y de PF2e que puedes aprender.</small></div>
    ${hs.map(h => `<div class="ecos-hc-clase"><span class="ecos-hc-nombre">${esc(h.nombre)} ${h.nivel}</span>${fila(h, "trucos")}${fila(h, "conjuros")}</div>`).join("")}`;
}

/** Tocar un hueco vacío: si hay conjuros sin preparar de esa clase, ofrece prepararlos; si no, abre el buscador. */
export async function elegirEnHueco(actor, clase, tipo) {
  const h = huecosDeActor(actor).find(x => x.id === clase); if (!h) return;
  const g = h[tipo], vacios = Math.max(0, g.max - g.llenos.length);
  if (!vacios) return ui.notifications.info("No te quedan huecos libres de ese tipo.");
  if (tipo === "trucos") return abrirLupa(actor, 0, { clase, max: vacios });
  if (g.modo === "libro") return abrirLupa(actor, null, { clase, max: vacios, minimo: 1 });
  if (g.sinPreparar.length) {
    const r = await foundry.applications.api.DialogV2.wait({ window: { title: `Preparar · ${h.nombre}` }, position: { width: 440 },
      content: `<p>Te quedan <b>${vacios}</b> por preparar. Ya tienes en la hoja estos sin preparar: márcalos, o busca uno nuevo.</p>
        <div style="max-height:320px;overflow:auto">${g.sinPreparar.map(c => `<label class="ecos-check"><input type="checkbox" name="${c.id}"> Nivel ${c.level} · ${esc(c.name)}</label>`).join("")}</div>`,
      buttons: [{ action: "preparar", label: "Preparar los marcados", icon: "fa-solid fa-check", default: true, callback: (_e, b) => g.sinPreparar.filter(c => b.form.elements[c.id]?.checked).map(c => c.id) },
        { action: "buscar", label: "Buscar uno nuevo", icon: "fa-solid fa-magnifying-glass" }, { action: "no", label: "Cancelar" }], rejectClose: false });
    if (r === "buscar") return abrirLupa(actor, null, { clase, max: vacios, minimo: 1, preparar: true });
    if (!Array.isArray(r) || !r.length) return;
    return actor.updateEmbeddedDocuments("Item", r.slice(0, vacios).map(_id => ({ _id, "system.prepared": 1 })));
  }
  return abrirLupa(actor, null, { clase, max: vacios, minimo: 1, preparar: true });
}

function decorar(app) {
  try {
    const actor = app?.document, el = app?.element;
    if (!(actor instanceof Actor) || actor.type !== "character" || !el?.querySelector || !activo()) return;
    const tab = el.querySelector('.tab[data-tab="spells"]');
    if (!tab) return;
    let panel = tab.querySelector(".ecos-huecos-conjuros");
    const html = htmlPanel(actor);
    if (!html) { panel?.remove(); return; }
    if (!panel) {
      panel = document.createElement("div");
      panel.className = "ecos-huecos-conjuros";
      panel.addEventListener("click", ev => {
        const b = ev.target.closest("[data-ecos-hc]"); if (!b) return;
        ev.preventDefault(); ev.stopPropagation();
        if (b.dataset.ecosHc === "ver") return actor.items.get(b.dataset.id)?.sheet?.render({ force: true });
        elegirEnHueco(actor, b.dataset.clase, b.dataset.tipo).catch(err => console.error(`${MOD} | huecos de conjuros`, err));
      });
      const ancla = tab.querySelector(".ecos-aprender-conjuros-fila") ?? tab.querySelector('.items-section[data-type="spell"]');
      if (ancla?.parentElement) ancla.parentElement.insertBefore(panel, ancla.classList.contains("ecos-aprender-conjuros-fila") ? ancla.nextSibling : ancla);
      else tab.prepend(panel);
    }
    panel.innerHTML = html;
  } catch (err) { console.warn(`${MOD} | huecos de conjuros`, err); }
}

if (globalThis.Hooks) {
  Hooks.once("init", () => {
    game.settings.register(MOD, "huecosConjuros", { name: "Conjuros por huecos en las hojas", hint: "En el libro de conjuros de los PJ, los huecos de trucos y conjuros preparados (o el libro del mago) que da la clase en cada nivel; un hueco vacío abre el buscador de D&D y PF2e.",
      scope: "world", config: true, type: Boolean, default: true, onChange: () => { for (const a of foundry.applications.instances?.values?.() ?? []) if (a.document instanceof Actor && a.rendered) a.render(); } });
  });
  Hooks.on("renderActorSheetV2", decorar);
  Hooks.on("preUpdateItem", (item, cambios, opciones) => {
    if (item.type === "class" && item.parent?.type === "character" && foundry.utils.hasProperty(cambios, "system.levels")
      && Number(foundry.utils.getProperty(cambios, "system.levels")) > (Number(item.system?.levels) || 0)) opciones.ecosConjurosSube = true;
  });
  Hooks.on("updateItem", (item, _c, opciones, userId) => {
    if (!opciones.ecosConjurosSube || userId !== game.user.id || !activo()) return;
    const actor = item.parent;
    setTimeout(() => {
      const hs = huecosDeActor(actor).filter(h => vaciosDe(h));
      if (!hs.length) return;
      const txt = hs.map(h => { const t = Math.max(0, h.trucos.max - h.trucos.llenos.length), c = Math.max(0, h.conjuros.max - h.conjuros.llenos.length);
        return `${esc(h.nombre)}: ${[t ? `${t} truco${t === 1 ? "" : "s"}` : "", c ? `${c} ${h.conjuros.modo === "libro" ? "para el libro" : "por preparar"}` : ""].filter(Boolean).join(" y ")}`; }).join("; ");
      ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), whisper: game.users.filter(u => u.isGM || actor.testUserPermission?.(u, "OWNER")).map(u => u.id),
        content: `<section class="ecos-dote-chat"><h3><i class="fa-solid fa-wand-sparkles"></i> ${esc(actor.name)} · conjuros por elegir</h3><p>${txt}.</p>
          <button type="button" data-ecos-conjuros-abrir="${esc(actor.uuid)}"><i class="fa-solid fa-book"></i> Abrir el libro de conjuros</button></section>` });
    }, 400);
  });
  Hooks.on("renderChatMessageHTML", (_m, html) => {
    for (const b of html.querySelectorAll?.("[data-ecos-conjuros-abrir]") ?? []) b.addEventListener("click", async ev => {
      ev.preventDefault();
      const a = await fromUuid(b.dataset.ecosConjurosAbrir); if (!a?.isOwner) return;
      await a.sheet.render({ force: true }); try { a.sheet.changeTab("spells", "primary"); } catch { /* otra hoja */ }
    });
  });
  Hooks.once("ready", () => { const api = game.modules.get(MOD)?.api; if (api) api.huecosConjuros = { de: huecosDeActor, elegir: elegirEnHueco }; });
}
