/**
 * 3.55 · Taller: fabricar objetos (pedido del autor, 12-nov-2026), con las reglas del Manual 2024 y la escala de Ecos.
 *  - Hace falta competencia con la herramienta que pide el objeto (veneno → útiles de envenenador; pociones → alquimista
 *    o herborista; armas y armaduras de metal → herrero; de cuero → curtidor; arcos y flechas → tallador; pergaminos → caligrafía…).
 *  - Materiales: la mitad del precio. Días (de 8 horas): los mundanos, precio ÷ 10 (mínimo 2); los mágicos y alquímicos,
 *    por rareza (común 5, poco común 10, raro 50, muy raro 125, legendario 250; los consumibles, la mitad).
 *  - Al empezar se tira la herramienta contra la CD: éxito crítico, la mitad de días; éxito, los días; fallo, el doble;
 *    fallo crítico, el doble y se pierde la mitad de los materiales. Cada ayudante competente divide el tiempo.
 *  - Cada día de trabajo se marca con «+1 día»; al terminar, el objeto aparece en el inventario.
 * Revertir: «Cancelar» devuelve los materiales; «Deshacer» en el chat quita el objeto terminado y reabre el proyecto.
 * A mano (DM): «Terminar ya», fabricar sin competencia o sin fórmula, y cambiar los días.
 */
import { guiaVenenosHTML } from "./venenos.js";

const MOD = "ecos-frontera";
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const lista = x => Array.from(x?.contents ?? x ?? []);

export const RAREZA = { common: { n: "común", dias: 5, oro: 50, cd: 12 }, uncommon: { n: "poco común", dias: 10, oro: 200, cd: 15 },
  rare: { n: "rara", dias: 50, oro: 2000, cd: 18 }, veryRare: { n: "muy rara", dias: 125, oro: 20000, cd: 21 }, legendary: { n: "legendaria", dias: 250, oro: 100000, cd: 25 } };
export const NOMBRE_HERRAMIENTA = { alchemist: "suministros de alquimista", herb: "útiles de herborista", pois: "útiles de envenenador", smith: "herramientas de herrero",
  leatherworker: "herramientas de curtidor", woodcarver: "herramientas de tallador", carpenter: "herramientas de carpintero", calligrapher: "útiles de caligrafía",
  jeweler: "herramientas de joyero", weaver: "herramientas de tejedor", tinker: "herramientas de chapucero", cook: "utensilios de cocina", brewer: "suministros de cervecero",
  glassblower: "herramientas de soplador de vidrio", mason: "herramientas de albañil", potter: "herramientas de alfarero", cobbler: "herramientas de zapatero" };

/** Qué herramientas sirven para fabricar este objeto. Puro. */
export function herramientasPara(item = {}) {
  const t = item.type, sub = item.system?.type?.value ?? "", nombre = String(item.name ?? "").toLowerCase(), rasgos = item.flags?.[MOD]?.pf2e?.rasgos ?? [];
  if (t === "consumable") {
    if (sub === "poison" || rasgos.includes("poison")) return ["pois", "alchemist"];
    if (sub === "potion") return ["alchemist", "herb"];
    if (sub === "scroll") return ["calligrapher"];
    if (sub === "ammo") return /flecha|virote|arrow|bolt/.test(nombre) ? ["woodcarver"] : ["smith", "woodcarver"];
    if (sub === "food") return ["cook", "brewer"];
    return rasgos.includes("alchemical") ? ["alchemist"] : ["tinker", "alchemist"];
  }
  if (t === "weapon") return /arco|ballesta|bow|honda|cerbatana|garrote|bast[oó]n|club|staff/.test(nombre) ? ["woodcarver", "carpenter"] : ["smith"];
  if (t === "equipment") {
    if (sub === "light") return ["leatherworker"];
    if (["medium", "heavy"].includes(sub)) return /cuero|leather|piel|hide/.test(nombre) ? ["leatherworker"] : ["smith"];
    if (sub === "shield") return ["smith", "woodcarver"];
    if (sub === "clothing") return ["weaver"];
    if (sub === "ring" || /anillo|amuleto|collar|ring|amulet|broche/.test(nombre)) return ["jeweler"];
    return ["tinker", "jeweler", "weaver"];
  }
  if (t === "container") return ["leatherworker", "weaver", "carpenter"];
  if (t === "tool") return ["tinker", "carpenter"];
  return ["tinker"];
}
/** CD para fabricarlo: por el nivel de PF2e, la rareza de D&D o el precio. Puro. */
export function cdFabricar({ nivel = null, rareza = "", precio = 0 } = {}) {
  if (Number(nivel) > 0) return 12 + Math.ceil(Number(nivel) / 2);
  if (RAREZA[rareza]) return RAREZA[rareza].cd;
  const p = Number(precio) || 0;
  return p < 10 ? 10 : p < 100 ? 12 : p < 1000 ? 14 : 16;
}
/** Días y materiales base. Puro. */
export function planFabricar({ precio = 0, rareza = "", consumible = false, nivel = null } = {}) {
  const p = Math.max(0, Number(precio) || 0), r = RAREZA[rareza];
  if (r) {
    const dias = Math.max(2, consumible ? Math.ceil(r.dias / 2) : r.dias);
    const coste = p > 0 ? p / 2 : (consumible ? r.oro / 2 : r.oro);
    return { dias, coste: Math.round(coste * 100) / 100, cd: cdFabricar({ nivel, rareza, precio: p }), magico: true };
  }
  return { dias: Math.max(2, Math.ceil(p / 10)), coste: Math.round(p / 2 * 100) / 100, cd: cdFabricar({ nivel, precio: p }), magico: false };
}
/** Días según la tirada (la escala de Ecos: buenos dados, la mitad; malos, el doble) y los ayudantes. Puro. */
export function diasSegunGrado(dias, grado, ayudantes = 0) {
  const d = grado === "critico" ? Math.ceil(dias / 2) : grado === "exito" ? dias : dias * 2;
  return Math.max(1, Math.ceil(d / (1 + Math.max(0, Number(ayudantes) || 0))));
}
export function gradoTirada(total, cd, natural = null) {
  const orden = ["pifia", "fallo", "exito", "critico"];
  let i = total >= cd + 10 ? 3 : total >= cd ? 2 : total <= cd - 10 ? 0 : 1;
  if (natural === 20) i = Math.min(3, i + 1); else if (natural === 1) i = Math.max(0, i - 1);
  return orden[i];
}

/* ---------------- Foundry ---------------- */
const proyectos = actor => foundry.utils.deepClone(actor?.getFlag?.(MOD, "proyectos") ?? []);
const guardar = (actor, l) => actor.setFlag(MOD, "proyectos", l);
const GRADO = { critico: "Éxito crítico", exito: "Éxito", fallo: "Fallo", pifia: "Fallo crítico" };
const aviso = (actor, html) => ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), whisper: game.users.filter(u => u.isGM || actor.testUserPermission?.(u, "OWNER")).map(u => u.id), content: html });

async function pagar(actor, po) {
  if (!po) return true;
  try { await globalThis.dnd5e.applications.CurrencyManager.deductActorCurrency(actor, po, "gp", { recursive: true, priority: "high" }); return true; }
  catch { ui.notifications.error(`No te alcanza: los materiales cuestan ${po} po.`); return false; }
}
const devolver = (actor, po) => (po ? actor.update({ "system.currency.gp": (Number(actor.system?.currency?.gp) || 0) + Math.floor(po) }) : null);

/** Nuevo proyecto: elegir el objeto en el buscador, ver días, CD y materiales, tirar y empezar. */
export async function nuevoProyecto(actor) {
  const Browser = globalThis.dnd5e?.applications?.CompendiumBrowser;
  if (!actor?.isOwner || !Browser) return;
  const sel = await Browser.select({ filters: { locked: { documentClass: "Item", exclusive: true, types: new Set(["weapon", "equipment", "consumable", "tool", "container", "loot"]) } },
    hint: "Elige qué quieres fabricar (objetos de D&D y de PF2e).", selection: { min: 1, max: 1 } });
  const uuid = sel?.first?.() ?? [...(sel ?? [])][0]; if (!uuid) return;
  const doc = await fromUuid(uuid); if (!doc) return;
  const precio = Number(doc.system?.price?.value) * ({ pp: 10, gp: 1, ep: 0.5, sp: 0.1, cp: 0.01 }[doc.system?.price?.denomination ?? "gp"] ?? 1) || 0;
  const plan = planFabricar({ precio, rareza: doc.system?.rarity ?? "", consumible: doc.type === "consumable", nivel: doc.flags?.[MOD]?.pf2e?.nivel });
  const herr = herramientasPara(doc), gm = game.user.isGM;
  const tiene = k => Number(actor.system?.tools?.[k]?.value) >= 1;
  const r = await foundry.applications.api.DialogV2.wait({ window: { title: `Fabricar · ${doc.name}`, icon: "fa-solid fa-hammer" }, position: { width: 480 },
    content: `<div class="ecos-taller-plan"><p><img src="${esc(doc.img)}" alt="" width="36" height="36" style="vertical-align:middle;border:none"> <b>${esc(doc.name)}</b>${plan.magico ? ` · ${esc(RAREZA[doc.system.rarity]?.n ?? "mágico")}` : ""}</p>
      <p>Materiales: <b>${plan.coste} po</b> · Días de trabajo: <b>${plan.dias}</b> · CD <b>${plan.cd}</b></p>
      <label>Herramienta: <select name="herr">${herr.map(k => `<option value="${k}" ${tiene(k) ? "selected" : ""}>${esc(NOMBRE_HERRAMIENTA[k] ?? k)}${tiene(k) ? " ✓" : " (sin competencia)"}</option>`).join("")}</select></label>
      <label>Ayudantes competentes: <input type="number" name="ayud" value="0" min="0" max="5" style="width:4em"></label>
      ${plan.magico ? `<label class="ecos-check"><input type="checkbox" name="formula" ${gm ? "checked" : ""}> Tengo la fórmula (o el permiso del DM)</label>` : ""}
      ${gm ? `<label class="ecos-check"><input type="checkbox" name="sinComp"> Sin competencia (lo autoriza el DM)</label>` : ""}
      <p><small>Al empezar tiras la herramienta: éxito crítico, la mitad de días; éxito, los días; fallo, el doble; fallo crítico, el doble y pierdes la mitad de los materiales.</small></p></div>`,
    buttons: [{ action: "ok", label: "Pagar, tirar y empezar", icon: "fa-solid fa-dice-d20", default: true,
      callback: (_e, b) => ({ herr: b.form.elements.herr.value, ayud: Number(b.form.elements.ayud.value) || 0, formula: b.form.elements.formula?.checked ?? true, sinComp: b.form.elements.sinComp?.checked ?? false }) },
      { action: "no", label: "Cancelar" }], rejectClose: false });
  if (!r || r === "no") return;
  if (plan.magico && !r.formula) return ui.notifications.warn("Para un objeto mágico necesitas su fórmula (o el permiso del DM).");
  if (!tiene(r.herr) && !(gm && r.sinComp)) return ui.notifications.warn(`Necesitas competencia con ${NOMBRE_HERRAMIENTA[r.herr] ?? r.herr} (o que el DM lo autorice).`);
  if (!await pagar(actor, plan.coste)) return;
  let rolls = null;
  try { rolls = await actor.rollToolCheck({ tool: r.herr, target: plan.cd }, { configure: false }, { data: { flavor: `Fabricar ${doc.name} (CD ${plan.cd})` } }); } catch (err) { console.warn(`${MOD} | taller`, err); }
  const roll = Array.isArray(rolls) ? rolls[0] : rolls;
  const natural = roll?.dice?.[0]?.results?.find(x => x.active !== false)?.result ?? null;
  const grado = roll ? gradoTirada(roll.total, plan.cd, natural) : "exito";
  const dias = diasSegunGrado(plan.dias, grado, r.ayud);
  let coste = plan.coste;
  if (grado === "pifia") { const extra = Math.round(plan.coste / 2 * 100) / 100; if (await pagar(actor, extra)) coste += extra; }
  const p = { id: foundry.utils.randomID(), uuid, nombre: doc.name, img: doc.img, dias, hechos: 0, cd: plan.cd, herramienta: r.herr, coste, grado, ayudantes: r.ayud, inicio: game.time?.worldTime ?? 0 };
  await guardar(actor, [...proyectos(actor), p]);
  await aviso(actor, `<section class="ecos-taller-chat"><h3><i class="fa-solid fa-hammer"></i> ${esc(actor.name)} empieza: ${esc(doc.name)}</h3>
    <p>${GRADO[grado]}${roll ? ` (${roll.total})` : ""} · <b>${dias} día${dias === 1 ? "" : "s"}</b> de trabajo · materiales ${coste} po${grado === "pifia" ? " (se perdió la mitad)" : ""}.</p></section>`);
  return p;
}
/** Un día (o varios) de trabajo en un proyecto; al completarlo, el objeto aparece en el inventario. */
export async function trabajar(actor, id, n = 1) {
  const l = proyectos(actor), p = l.find(x => x.id === id); if (!p) return;
  p.hechos = Math.min(p.dias, (Number(p.hechos) || 0) + Math.max(1, Number(n) || 1));
  if (p.hechos < p.dias) return guardar(actor, l);
  return terminar(actor, id);
}
export async function terminar(actor, id) {
  const l = proyectos(actor), p = l.find(x => x.id === id); if (!p) return;
  const doc = await fromUuid(p.uuid);
  if (!doc) return ui.notifications.error("No encontré el objeto en su compendio.");
  const data = game.items.fromCompendium(doc, { clearFolder: true });
  foundry.utils.setProperty(data, `flags.${MOD}.fabricado`, { por: actor.name, fecha: game.time?.worldTime ?? 0, proyecto: p });
  const [it] = await actor.createEmbeddedDocuments("Item", [data]);
  await guardar(actor, l.filter(x => x.id !== id));
  await aviso(actor, `<section class="ecos-taller-chat"><h3><i class="fa-solid fa-hammer"></i> ${esc(actor.name)} termina: ${esc(p.nombre)}</h3>
    <p>Ya está en su inventario.</p><button type="button" data-ecos-taller="deshacer" data-item="${esc(it?.uuid)}"><i class="fa-solid fa-rotate-left"></i> Deshacer</button></section>`);
  return it;
}
export async function cancelar(actor, id) {
  const l = proyectos(actor), p = l.find(x => x.id === id); if (!p) return;
  const ok = await foundry.applications.api.DialogV2.confirm({ window: { title: "Cancelar proyecto" }, content: `<p>¿Cancelar <b>${esc(p.nombre)}</b>? Se devuelven ${Math.floor(p.coste)} po de materiales.</p>`, rejectClose: false });
  if (!ok) return;
  await guardar(actor, l.filter(x => x.id !== id));
  await devolver(actor, p.coste);
}

let Taller = null;
function claseTaller() {
  if (Taller) return Taller;
  Taller = class TallerEcos extends foundry.applications.api.ApplicationV2 {
    static DEFAULT_OPTIONS = { classes: ["ecos-taller"], window: { icon: "fa-solid fa-hammer", resizable: true }, position: { width: 560, height: "auto" } };
    constructor(actor) { super({ id: `ecos-taller-${actor.id}`, window: { title: `Taller · ${actor.name}` } }); this.actor = actor; }
    async _renderHTML() {
      const l = proyectos(this.actor), gm = game.user.isGM;
      const fila = p => `<li class="ecos-taller-p" data-id="${p.id}"><img src="${esc(p.img)}" alt="">
        <div><b>${esc(p.nombre)}</b><small>${esc(NOMBRE_HERRAMIENTA[p.herramienta] ?? p.herramienta)} · CD ${p.cd} · ${GRADO[p.grado] ?? ""}${p.ayudantes ? ` · ${p.ayudantes} ayudante${p.ayudantes === 1 ? "" : "s"}` : ""}</small>
        <div class="ecos-taller-barra"><span style="width:${Math.round(100 * p.hechos / Math.max(1, p.dias))}%"></span></div><small>${p.hechos} de ${p.dias} días</small></div>
        <span class="ecos-taller-bot"><button type="button" data-t="dia" data-tooltip="Un día de trabajo (8 horas)">+1 día</button><button type="button" data-t="dias">+N</button>
        ${gm ? `<button type="button" data-t="fin" data-tooltip="Terminar ya (DM)"><i class="fa-solid fa-check"></i></button>` : ""}<button type="button" data-t="cancelar" data-tooltip="Cancelar y devolver los materiales"><i class="fa-solid fa-xmark"></i></button></span></li>`;
      return `<div class="ecos-taller-cuerpo"><p>Fabricas con la herramienta que pide el objeto. Materiales: la mitad del precio. Cada día de trabajo son 8 horas.</p>
        <ul class="ecos-taller-lista">${l.map(fila).join("") || "<li class='ecos-taller-vacio'>Sin proyectos.</li>"}</ul>
        <button type="button" data-t="nuevo"><i class="fa-solid fa-plus"></i> Nuevo proyecto</button></div>`;
    }
    _replaceHTML(html, contenido) {
      contenido.innerHTML = html;
      if (contenido.dataset.ecosEnlazado) return;
      contenido.dataset.ecosEnlazado = "1";
      contenido.addEventListener("click", async ev => {
        const b = ev.target.closest("button[data-t]"); if (!b) return;
        const id = b.closest("[data-id]")?.dataset.id, t = b.dataset.t;
        try {
          if (t === "nuevo") await nuevoProyecto(this.actor);
          else if (t === "dia") await trabajar(this.actor, id, 1);
          else if (t === "dias") {
            const n = await foundry.applications.api.DialogV2.prompt({ window: { title: "Días de trabajo" }, content: '<input type="number" name="n" value="1" min="1">', ok: { callback: (_e, bt) => Number(bt.form.elements.n.value) || 0 }, rejectClose: false });
            if (n) await trabajar(this.actor, id, n);
          } else if (t === "fin" && game.user.isGM) await terminar(this.actor, id);
          else if (t === "cancelar") await cancelar(this.actor, id);
        } catch (err) { console.error(`${MOD} | taller`, err); }
        this.render();
      });
    }
  };
  return Taller;
}
export function abrirTaller(actor) {
  if (!actor?.isOwner) return null;
  const C = claseTaller();
  return (foundry.applications.instances?.get?.(`ecos-taller-${actor.id}`) ?? new C(actor)).render({ force: true });
}

/** Guía: fabricación y venenos. Pura. */
export function guiaTallerHTML() {
  return `<section class="mcp-journal"><h1>Fabricación y venenos</h1>
<h2>Taller: fabricar objetos</h2>
<ol><li>En tu hoja, pestaña Inventario: botón <b>Taller</b> <i class="fa-solid fa-hammer"></i> → <b>Nuevo proyecto</b> y elige el objeto (de D&amp;D o de PF2e).</li>
<li>Necesitas <b>competencia con la herramienta</b> que pide (venenos: útiles de envenenador o de alquimista; pociones: alquimista o herborista; armas y armaduras de metal: herrero; de cuero: curtidor; arcos y flechas: tallador; pergaminos: caligrafía; joyas: joyero; ropa: tejedor). Los mágicos piden además su <b>fórmula</b> (o el permiso del DM).</li>
<li><b>Materiales</b>: la mitad del precio, se pagan al empezar.</li>
<li><b>Días</b> (de 8 horas): mundanos, precio ÷ 10 (mínimo 2). Mágicos y alquímicos por rareza: común 5, poco común 10, raro 50, muy raro 125, legendario 250 (los consumibles, la mitad).</li>
<li>Al empezar tiras la herramienta contra la CD (por nivel o rareza): <b>éxito crítico</b> la mitad de días; <b>éxito</b> los días; <b>fallo</b> el doble; <b>fallo crítico</b> el doble y pierdes la mitad de los materiales. Cada ayudante competente divide el tiempo.</li>
<li>Cada día que trabajas: <b>+1 día</b>. Al completar, el objeto aparece en tu inventario. <b>Cancelar</b> devuelve los materiales.</li></ol>
${guiaVenenosHTML()}
<p><em>El DM puede terminar un proyecto, autorizar sin competencia o sin fórmula, y deshacer lo fabricado.</em></p></section>`;
}

function decorar(app) {
  try {
    const actor = app?.document, el = app?.element;
    if (!(actor instanceof Actor) || actor.type !== "character" || !actor.isOwner || leer("taller", true) === false) return;
    const inv = el?.querySelector?.('.tab[data-tab="inventory"]');
    if (!inv || inv.querySelector(".ecos-taller-fila")) return;
    const n = proyectos(actor).length;
    const fila = document.createElement("div"); fila.className = "ecos-taller-fila";
    const b = document.createElement("button"); b.type = "button"; b.className = "ecos-taller-boton";
    b.innerHTML = `<i class="fa-solid fa-hammer" inert></i> Taller${n ? ` (${n})` : ""}`;
    b.dataset.tooltip = "Fabricar objetos con tus herramientas: proyectos, días y materiales.";
    b.addEventListener("click", ev => { ev.preventDefault(); abrirTaller(actor); });
    fila.append(b); inv.prepend(fila);
  } catch (err) { console.warn(`${MOD} | taller`, err); }
}
const leer = (k, d) => { try { return game.settings.get(MOD, k); } catch { return d; } };

if (globalThis.Hooks) {
  Hooks.once("init", () => game.settings.register(MOD, "taller", { name: "Taller en las hojas", hint: "Botón «Taller» en el inventario de los PJ para fabricar objetos (herramientas, días y materiales del Manual 2024).", scope: "world", config: true, type: Boolean, default: true }));
  Hooks.on("renderActorSheetV2", decorar);
  Hooks.on("renderChatMessageHTML", (_m, html) => {
    for (const b of html.querySelectorAll?.('[data-ecos-taller="deshacer"]') ?? []) b.addEventListener("click", async ev => {
      ev.preventDefault();
      const it = await fromUuid(b.dataset.item); if (!it) return ui.notifications.info("Ese objeto ya no está.");
      if (!it.isOwner) return;
      const p = it.flags?.[MOD]?.fabricado?.proyecto, actor = it.actor;
      await it.delete();
      if (p && actor) await guardar(actor, [...proyectos(actor), { ...p, hechos: Math.max(0, p.dias - 1) }]);
      ui.notifications.info("Deshecho: el proyecto vuelve al taller.");
    });
  });
  Hooks.once("ready", () => {
    const api = game.modules.get(MOD)?.api; if (api) api.taller = { abrir: abrirTaller, nuevo: nuevoProyecto, trabajar, terminar };
    if (game.user.isGM && (!game.users.activeGM || game.users.activeGM.isSelf))
      import("./acciones-comunes.js").then(m => m.paginaReglas("guiaTaller", "18 · Fabricación y venenos", guiaTallerHTML())).catch(err => console.error(`${MOD} | guía del taller`, err));
  });
}
