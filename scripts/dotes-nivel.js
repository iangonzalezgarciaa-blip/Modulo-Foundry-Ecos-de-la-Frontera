/**
 * 3.53 · Dotes menores por nivel (pedido del autor, 12-nov-2026): el sistema de dotes de PF2e fundido con D&D.
 * En los niveles sin Mejora de característica cada PJ tiene un hueco de «dote menor» (de clase, de ascendencia, de habilidad
 * o general) en la pestaña «Dotes» de su hoja. Al tocar un hueco vacío se abre la lista de las dotes que puede tomar
 * según su nivel, su clase, su especie y los requisitos. Las hojas que ya pasaron esos niveles reciben sus huecos vacíos.
 * Las especies de PF2e tienen además un hueco de herencia al nivel 1. Los PNJ suman dotes con un botón en Rasgos.
 * Se revierte: «Quitar» en cada hueco o «Deshacer» en el chat; el ajuste del mundo apaga la pestaña.
 * El DM asigna a mano: «Sin filtros», «Asignar una dote a mano» y la clase/ascendencia/herencia para las dotes de cada PJ.
 */
import { PACKS } from "./pf2e-dotes.js";

const MOD = "ecos-frontera";
export const PESTANA = "ecosDotes";
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const lista = x => Array.from(x?.contents ?? x ?? []);
const sinTildes = s => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
export const slug = s => sinTildes(s).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Los huecos: uno en cada nivel sin Mejora de característica, repartidos como en PF2e (clase, ascendencia, habilidad, general). */
export const HUECOS_DOTE = Object.freeze([
  { nivel: 2, cat: "class" }, { nivel: 3, cat: "general" }, { nivel: 5, cat: "ancestry" }, { nivel: 6, cat: "class" },
  { nivel: 7, cat: "skill" }, { nivel: 9, cat: "ancestry" }, { nivel: 10, cat: "class" }, { nivel: 11, cat: "general" },
  { nivel: 13, cat: "ancestry" }, { nivel: 14, cat: "class" }, { nivel: 15, cat: "skill" }, { nivel: 17, cat: "ancestry" },
  { nivel: 18, cat: "class" }, { nivel: 20, cat: "skill" }
]);
export const NOMBRE_CAT = { class: "De clase", ancestry: "De ascendencia", skill: "De habilidad", general: "General", herencia: "Herencia" };
/** Qué categorías de PF2e entran en cada hueco (un hueco general admite también las de habilidad, como en PF2e). */
export const CATS_HUECO = { class: ["class"], ancestry: ["ancestry"], skill: ["skill"], general: ["general", "skill"] };
export const CLASE_ES = { barbarian: "Bárbaro", bard: "Bardo", paladin: "Paladín", cleric: "Clérigo", druid: "Druida", fighter: "Guerrero", monk: "Monje",
  ranger: "Explorador", rogue: "Pícaro", sorcerer: "Hechicero", wizard: "Mago", warlock: "Brujo" };
const NOMBRE_PERICIA = { acr: "Acrobacias", arc: "Arcanos", ath: "Atletismo", dec: "Engaño", per: "Persuasión", itm: "Intimidación", med: "Medicina",
  nat: "Naturaleza", prf: "Interpretación", rel: "Religión", his: "Historia", ste: "Sigilo", sur: "Supervivencia", slt: "Juego de manos",
  prc: "Percepción", ins: "Perspicacia", inv: "Investigación", ani: "Trato con animales", crafting: "herramientas de artesano" };
const CAR_ES = { str: "Fuerza", dex: "Destreza", con: "Constitución", int: "Inteligencia", wis: "Sabiduría", cha: "Carisma" };
const ARTE = new Set(["alchemist", "brewer", "calligrapher", "carpenter", "cartographer", "cobbler", "cook", "glassblower", "jeweler",
  "leatherworker", "mason", "painter", "potter", "smith", "tinker", "weaver", "woodcarver"]);

/** Los huecos de una hoja de nivel `nivel`; `abierto` si ya llegó a ese nivel. Puro. */
export function huecosDe({ nivel = 1, herencia = false } = {}) {
  const l = HUECOS_DOTE.map(h => ({ clave: String(h.nivel), nivel: h.nivel, cat: h.cat, abierto: nivel >= h.nivel }));
  if (herencia) l.unshift({ clave: "herencia", nivel: 1, cat: "herencia", abierto: true });
  return l;
}
/** Los huecos que se abren al pasar de `antes` a `ahora`. Puro. */
export const huecosNuevos = (antes, ahora) => HUECOS_DOTE.filter(h => h.nivel > (Number(antes) || 0) && h.nivel <= (Number(ahora) || 0));

/** Especie de D&D → ascendencias de PF2e cuyas dotes puede tomar. */
export const ASC_DND = {
  dwarf: ["dwarf"], elf: ["elf"], gnome: ["gnome"], halfling: ["halfling"], human: ["human"], orc: ["orc"], dragonborn: ["dragonblood"],
  aasimar: ["nephilim"], tiefling: ["nephilim"], goliath: ["jotunborn"], "half-elf": ["human", "elf", "aiuvarin"], "half-orc": ["human", "orc", "dromaar"],
  goblin: ["goblin"], kobold: ["kobold"], hobgoblin: ["hobgoblin"], bugbear: ["bugbear"], lizardfolk: ["lizardfolk"], tabaxi: ["catfolk"], kenku: ["tengu"],
  centaur: ["centaur"], minotaur: ["minotaur"], changeling: ["changeling"], warforged: ["automaton"], triton: ["azarketi"], owlin: ["strix"], shifter: ["beastkin"],
  fairy: ["sprite"], genasi: ["sylph", "oread", "naari", "undine"]
};
const ASC_ES = { enano: "dwarf", elfo: "elf", gnomo: "gnome", mediano: "halfling", humano: "human", orco: "orc", draconido: "dragonborn", aasimar: "aasimar",
  tiefling: "tiefling", tiflin: "tiefling", goliat: "goliath", semielfo: "half-elf", semiorco: "half-orc", goblin: "goblin", kobold: "kobold", hobgoblin: "hobgoblin",
  osgo: "bugbear", tabaxi: "tabaxi", kenku: "kenku", centauro: "centaur", minotauro: "minotaur", cambiante: "changeling", forjado: "warforged", triton: "triton", genasi: "genasi" };
export const NOMBRE_ASC = { dwarf: "Enano", elf: "Elfo", gnome: "Gnomo", halfling: "Mediano", human: "Humano", orc: "Orco", dragonblood: "Sangre de dragón",
  nephilim: "Nefilim (aasimar y tiefling)", jotunborn: "Nacido de los gigantes (goliat)", aiuvarin: "Aiuvarin (semielfo)", dromaar: "Dromaar (semiorco)" };

/** Las ascendencias de PF2e de un personaje: su especie, sus herencias versátiles y la que puso el DM a mano. Puro. */
export function slugsAscendencia({ raza = null, herencias = [], manual = null } = {}) {
  const s = new Set();
  for (const m of [manual].flat()) if (m) s.add(String(m));
  if (raza?.pf2e) s.add(String(raza.pf2e));
  else if (raza) {
    const id = slug(raza.identifier ?? "");
    let clave = ASC_DND[id] ? id : id.split("-").reverse().find(p => ASC_DND[p]);
    if (!clave) {
      const n = sinTildes(raza.name ?? "");
      const e = ASC_ES[n] ?? ASC_ES[n.split(/[\s(,-]/)[0]];
      clave = e ?? (ASC_DND[slug(n)] ? slug(n) : null);
    }
    for (const x of ASC_DND[clave] ?? []) s.add(x);
  }
  for (const h of herencias) if (h?.versatil && h.nombre) s.add(slug(h.nombre));
  return [...s];
}

/** Requisitos de una dote contra un personaje. `faltan`: lo que no cumple; `dudas`: lo que decide el DM. Puro. */
export function revisarRequisitos(req = {}, ctx = {}) {
  const faltan = [], dudas = [];
  for (const p of req.pericias ?? []) {
    const tiene = p.skill === "crafting" ? (ctx.arte ?? 0) : (ctx.pericias?.[p.skill] ?? 0);
    const pide = p.rango >= 2 ? 2 : 1, nivelMin = p.rango === 3 ? 7 : p.rango >= 4 ? 15 : 0;
    if (tiene < pide || (ctx.nivel ?? 1) < nivelMin)
      faltan.push(`${pide === 2 ? "pericia" : "competencia"} en ${NOMBRE_PERICIA[p.skill] ?? p.skill}${nivelMin ? ` y nivel ${nivelMin}` : ""}`);
  }
  for (const [c, v] of Object.entries(req.car ?? {})) if ((ctx.car?.[c] ?? 10) < v) faltan.push(`${CAR_ES[c] ?? c} ${v}`);
  for (const o of req.otros ?? []) {
    const k = String(o).toLowerCase().replace(/\s+heritage$/, "").trim();
    if (ctx.conocidas?.has?.(k)) { if (!ctx.dotesTomadas?.has?.(k)) faltan.push(`«${ctx.conocidas.get(k)}»`); }
    else dudas.push(String(o));
  }
  return { faltan, dudas };
}

/** ¿Puede tomar esta dote en este hueco? `fuera`: no corresponde a este hueco; `motivos`: por qué todavía no. Puro. */
export function evaluarDote(f = {}, hueco = null, ctx = {}) {
  if (ctx.tomadas?.has?.(f.id)) return { ok: false, fuera: true, motivos: ["ya la tienes"], dudas: [] };
  const motivos = [], nivel = Number(f.nivel) || 1;
  if (hueco) {
    let cats = CATS_HUECO[hueco.cat] ?? [];
    if ((hueco.cat === "class" && ctx.sinClase) || (hueco.cat === "ancestry" && ctx.sinAscendencia)) cats = ["general", "skill"];
    if (!cats.includes(f.categoria)) return { ok: false, fuera: true, motivos: [], dudas: [] };
    if (f.categoria === "class") {
      const nc = Math.max(0, ...(f.clase ?? []).map(c => Number(ctx.clases?.[c]) || 0));
      if (!nc) return { ok: false, fuera: true, motivos: [], dudas: [] };
      const tope = Math.min(hueco.nivel, nc);
      if (nivel > tope) motivos.push(`es de nivel ${nivel}; aquí entran hasta nivel ${tope}`);
    } else if (nivel > hueco.nivel) motivos.push(`es de nivel ${nivel}; este hueco es de nivel ${hueco.nivel}`);
    if (f.categoria === "ancestry" && !(f.ascendencia ?? []).some(a => (ctx.ascendencias ?? []).includes(a))) return { ok: false, fuera: true, motivos: [], dudas: [] };
  } else if (nivel > (Number(ctx.nivel) || 20)) motivos.push(`es de nivel ${nivel}`);
  if (f.rareza && f.rareza !== "common" && !ctx.raras) motivos.push(f.rareza === "rare" ? "rara: con permiso del DM" : "poco común: con permiso del DM");
  const r = revisarRequisitos(f.req, ctx);
  motivos.push(...r.faltan.map(x => `te falta ${x}`));
  return { ok: !motivos.length, fuera: false, motivos, dudas: r.dudas };
}
/** Herencias: las de su especie y las versátiles. Puro. */
export function evaluarHerencia(f = {}, ctx = {}) {
  if (ctx.tomadas?.has?.(f.id)) return { ok: false, fuera: true, motivos: [], dudas: [] };
  if (f.versatil || (ctx.ascendencias ?? []).includes(f.ascendencia)) return { ok: true, fuera: false, motivos: [], dudas: [] };
  return { ok: false, fuera: true, motivos: [], dudas: [] };
}

/** Lo que la hoja aporta para elegir: nivel, clases, pericias, características, especie, dotes ya tomadas. */
export function contextoDe(actor, { conocidas = new Map(), raras = false } = {}) {
  const sys = actor?.system ?? {}, items = lista(actor?.items), fl = actor?.flags?.[MOD] ?? {};
  const nivel = Number(sys.details?.level) || Math.max(1, Math.ceil(Number(sys.details?.cr) || 1));
  const clases = {};
  for (const it of items) if (it.type === "class") { const id = it.system?.identifier || slug(it.name); clases[id] = (clases[id] ?? 0) + (Number(it.system?.levels) || 0); }
  if (fl.dotesClase) clases[fl.dotesClase] = Math.max(clases[fl.dotesClase] ?? 0, nivel);
  const pericias = {};
  for (const [k, s] of Object.entries(sys.skills ?? {})) pericias[k] = Number(s?.value ?? s?.proficient ?? 0) || 0;
  let arte = 0;
  for (const [k, t] of Object.entries(sys.tools ?? {})) if (ARTE.has(k)) arte = Math.max(arte, Number(t?.value ?? 0) || 0);
  const car = {};
  for (const [k, a] of Object.entries(sys.abilities ?? {})) car[k] = Number(a?.value) || 10;
  const raza = items.find(i => i.type === "race");
  const herencias = items.map(i => i.flags?.[MOD]?.pf2e).filter(p => p?.tipo === "herencia");
  const ascendencias = slugsAscendencia({ raza: raza ? { identifier: raza.system?.identifier, name: raza.name, pf2e: raza.flags?.[MOD]?.pf2e?.slug } : null,
    herencias: herencias.map(h => ({ versatil: h.versatil, nombre: h.nombre })), manual: fl.dotesAscendencia });
  const tomadas = new Set(items.map(i => i.flags?.[MOD]?.pf2e?.id).filter(Boolean));
  const dotesTomadas = new Set(items.flatMap(i => [i.flags?.[MOD]?.pf2e?.nombre, i.flags?.babele?.originalName, i.name]).filter(Boolean).map(s => String(s).toLowerCase().trim()));
  return { nivel, clases, pericias, arte, car, ascendencias, sinClase: !Object.keys(clases).some(c => c in CLASE_ES), sinAscendencia: !ascendencias.length,
    tomadas, dotesTomadas, conocidas, raras };
}
/** ¿Esta hoja tiene hueco de herencia? Las especies de PF2e sí; las demás si el DM se lo da. */
export const tieneHuecoHerencia = actor => !!(lista(actor?.items).find(i => i.type === "race")?.flags?.[MOD]?.pf2e?.tipo === "raza" || actor?.flags?.[MOD]?.dotesHuecoHerencia);
/** Las dotes de cada hueco. */
export function itemsPorHueco(actor) {
  const m = new Map();
  for (const i of lista(actor?.items)) { const c = i.flags?.[MOD]?.huecoDote; if (c != null && !m.has(String(c))) m.set(String(c), i); }
  return m;
}

/* ---------------- Foundry ---------------- */
const leer = (k, d) => { try { return game.settings.get(MOD, k); } catch { return d; } };
const activo = () => leer("dotesPorNivel", true) !== false && game.system?.id === "dnd5e";
const CACHE = {};
/** El índice de un compendio de PF2e (dotes o razas), con sus banderas. */
export async function indicePF2e(tipo) {
  const pack = game.packs.get(`world.${PACKS[tipo].name}`);
  if (!pack) return null;
  const c = CACHE[tipo];
  if (c?.pack === pack && c.hora > Date.now() - 5 * 60e3) return c.lista;
  const idx = await pack.getIndex({ fields: [`flags.${MOD}.pf2e`, "system.requirements"] });
  const l = lista(idx).map(e => ({ _id: e._id, name: e.name, img: e.img, req: e.system?.requirements ?? "", f: e.flags?.[MOD]?.pf2e ?? {} }));
  CACHE[tipo] = { pack, hora: Date.now(), lista: l };
  return l;
}
async function conocidasPF2e() {
  const m = new Map();
  for (const t of ["dotes", "razas"]) for (const e of (await indicePF2e(t).catch(() => null)) ?? []) if (e.f?.nombre) m.set(String(e.f.nombre).toLowerCase().trim(), e.name);
  return m;
}
const SIN_DATOS = "Las dotes de PF2e todavía no están en el mundo: el DM las carga en Menú del DM → «PF2e: dotes, especies y objetos».";

function metaDote(f) {
  const p = [`Nivel ${f.nivel ?? 1}`, NOMBRE_CAT[f.categoria] ?? ""];
  if (f.clase?.length) p.push(f.clase.map(c => CLASE_ES[c] ?? c).join(" / "));
  if (f.categoria === "ancestry" && f.ascendencia?.length) p.push(f.ascendencia.slice(0, 2).map(a => NOMBRE_ASC[a] ?? a.replace(/^./, x => x.toUpperCase())).join(" / "));
  if (f.tipo === "herencia") p.splice(0, 2, f.versatil ? "Herencia versátil" : `Herencia · ${NOMBRE_ASC[f.ascendencia] ?? f.ascendencia ?? ""}`);
  if (f.rareza === "uncommon") p.push("Poco común"); else if (f.rareza === "rare") p.push("Rara");
  return p.filter(Boolean).join(" · ");
}
function textoHueco(actor, hueco) {
  if (!hueco) return `Asignar a mano a <b>${esc(actor.name)}</b>: cualquier dote de PF2e, sin hueco.`;
  if (hueco.cat === "herencia") return `<b>Herencia</b> de ${esc(actor.name)} (nivel 1): las de su especie y las versátiles.`;
  return `Hueco de <b>nivel ${hueco.nivel}</b> · <b>${NOMBRE_CAT[hueco.cat]}</b> de ${esc(actor.name)}.`;
}

let Selector = null;
function claseSelector() {
  if (Selector) return Selector;
  Selector = class SelectorDotes extends foundry.applications.api.ApplicationV2 {
    static DEFAULT_OPTIONS = { classes: ["ecos-selector-dotes"], window: { icon: "fa-solid fa-medal", resizable: true }, position: { width: 880, height: 680 } };
    constructor(actor, hueco, datos) {
      super({ id: `ecos-dotes-${actor.id}-${hueco?.clave ?? "libre"}`, window: { title: hueco ? `Elegir ${hueco.cat === "herencia" ? "herencia" : "dote"} · ${actor.name}` : `Sumar dotes de PF2e · ${actor.name}` } });
      this.actor = actor; this.hueco = hueco; this.datos = datos;
      this.f = { texto: "", todas: false, sinFiltros: false, cat: "", nivel: hueco ? "" : String(contextoDe(actor).nivel) };
      this.sel = null;
    }
    filas() {
      const ctx = contextoDe(this.actor, { conocidas: this.datos.conocidas, raras: leer("dotesRaras", false) || game.user.isGM });
      const herencia = this.hueco?.cat === "herencia", libre = !this.hueco || this.f.sinFiltros;
      const out = [];
      for (const e of this.datos.indice) {
        if (herencia !== (e.f.tipo === "herencia")) continue;
        let ev;
        if (herencia) ev = this.f.sinFiltros ? { ok: true, motivos: [], dudas: [] } : evaluarHerencia(e.f, ctx);
        else if (libre) {
          if (this.f.cat && e.f.categoria !== this.f.cat) continue;
          if (this.f.nivel && (Number(e.f.nivel) || 1) > Number(this.f.nivel)) continue;
          ev = evaluarDote(e.f, null, { ...ctx, nivel: 20 });
        } else ev = evaluarDote(e.f, this.hueco, ctx);
        if (ev.fuera) continue;
        if (!ev.ok && !this.f.todas && !libre) continue;
        out.push({ e, ev });
      }
      return out.sort((a, b) => (b.ev.ok - a.ev.ok) || ((Number(b.e.f.nivel) || 0) - (Number(a.e.f.nivel) || 0)) || a.e.name.localeCompare(b.e.name, "es"));
    }
    async _prepareContext() { return { filas: this.filas() }; }
    async _renderHTML({ filas }) {
      const gm = game.user.isGM, libre = !this.hueco;
      const fila = ({ e, ev }) => `<li class="ecos-sd-fila ${ev.ok ? "ok" : "no"} ${this.sel === e._id ? "sel" : ""}" data-id="${e._id}" data-texto="${esc(sinTildes(`${e.name} ${e.f.nombre ?? ""} ${e.req}`))}">
        <img src="${esc(e.img || "icons/svg/book.svg")}" loading="lazy" alt="">
        <div class="ecos-sd-info" data-sd="ver"><b>${esc(e.name)}</b><span class="ecos-sd-meta">${esc(metaDote(e.f))}</span>
          ${e.req ? `<small>Requisitos: ${esc(e.req)}</small>` : ""}${ev.motivos.length ? `<small class="ecos-sd-falta">${esc(ev.motivos.join(" · "))}</small>` : ""}
          ${ev.dudas.length ? `<small class="ecos-sd-duda">Lo confirma el DM: ${esc(e.req || ev.dudas.join("; "))}</small>` : ""}</div>
        <button type="button" data-sd="tomar" ${ev.ok || gm ? "" : "disabled"}>${ev.ok ? "Tomar" : gm ? "Tomar igual" : "No aún"}</button></li>`;
      const cats = `<select name="cat"><option value="">Todas las categorías</option>${["class", "ancestry", "skill", "general"].map(c => `<option value="${c}" ${this.f.cat === c ? "selected" : ""}>${NOMBRE_CAT[c]}</option>`).join("")}</select>
        <label>Hasta nivel <input type="number" name="nivel" min="1" max="20" value="${esc(this.f.nivel)}" style="width:4em"></label>`;
      return `<div class="ecos-sd">
        <header class="ecos-sd-cab"><p class="ecos-sd-hueco">${textoHueco(this.actor, this.hueco)}</p>
          <div class="ecos-sd-filtros"><input type="search" name="texto" value="${esc(this.f.texto)}" placeholder="Buscar por nombre o requisito…">
            ${libre ? cats : `<label><input type="checkbox" name="todas" ${this.f.todas ? "checked" : ""}> Ver también las que todavía no puedes tomar</label>`}
            ${gm && !libre ? `<label class="ecos-sd-dm"><input type="checkbox" name="sinFiltros" ${this.f.sinFiltros ? "checked" : ""}> Sin filtros (DM)</label>` : ""}</div>
          <p class="ecos-sd-cuenta"></p></header>
        <div class="ecos-sd-cuerpo"><ol class="ecos-sd-lista">${filas.map(fila).join("") || `<li class="ecos-sd-vacio">No hay ${this.hueco?.cat === "herencia" ? "herencias" : "dotes"} para este hueco con estos filtros.</li>`}</ol>
          <aside class="ecos-sd-detalle"><p class="ecos-sd-vacio">Toca una ${this.hueco?.cat === "herencia" ? "herencia" : "dote"} para leerla entera.</p></aside></div></div>`;
    }
    _replaceHTML(html, contenido) {
      contenido.innerHTML = html;
      const buscar = contenido.querySelector('input[name="texto"]');
      const filtrar = () => {
        const q = sinTildes(buscar.value); this.f.texto = buscar.value;
        let n = 0;
        for (const li of contenido.querySelectorAll(".ecos-sd-fila")) { const ve = !q || li.dataset.texto.includes(q); li.hidden = !ve; if (ve) n++; }
        const c = contenido.querySelector(".ecos-sd-cuenta"); if (c) c.textContent = `${n} ${n === 1 ? "opción" : "opciones"}`;
      };
      buscar?.addEventListener("input", filtrar);
      filtrar();
      for (const inp of contenido.querySelectorAll('input[type="checkbox"], select, input[type="number"]'))
        inp.addEventListener("change", () => { this.f[inp.name] = inp.type === "checkbox" ? inp.checked : inp.value; this.render(); });
      contenido.querySelector(".ecos-sd-lista")?.addEventListener("click", ev => {
        const li = ev.target.closest(".ecos-sd-fila"); if (!li) return;
        const e = this.datos.indice.find(x => x._id === li.dataset.id); if (!e) return;
        if (ev.target.closest('[data-sd="tomar"]')) { ev.preventDefault(); this.tomar(e); return; }
        this.ver(e, li);
      });
      if (this.sel) { const li = contenido.querySelector(`.ecos-sd-fila[data-id="${this.sel}"]`); const e = this.datos.indice.find(x => x._id === this.sel); if (li && e) this.ver(e, li); }
      buscar?.focus();
    }
    async ver(e, li) {
      this.sel = e._id;
      this.element.querySelectorAll(".ecos-sd-fila.sel").forEach(x => x.classList.remove("sel")); li.classList.add("sel");
      const aside = this.element.querySelector(".ecos-sd-detalle"); if (!aside) return;
      const doc = await game.packs.get(`world.${PACKS[this.datos.tipo].name}`)?.getDocument(e._id);
      const TE = foundry.applications?.ux?.TextEditor?.implementation ?? globalThis.TextEditor;
      const html = await TE.enrichHTML(doc?.system?.description?.value ?? "", { relativeTo: doc });
      if (this.sel !== e._id) return;
      aside.innerHTML = `<h3><img src="${esc(e.img)}" alt=""> ${esc(e.name)}</h3><p class="ecos-sd-meta">${esc(metaDote(e.f))}</p>${html}`;
    }
    async tomar(e) {
      const it = await tomarDote(this.actor, this.hueco, e, { tipo: this.datos.tipo });
      if (it && this.hueco) this.close(); else if (it) this.render();
    }
  };
  return Selector;
}

/** Abre la lista de dotes (o de herencias) para un hueco; sin hueco, para sumar libremente (PNJ o el DM). */
export async function abrirSelector(actor, hueco = null) {
  if (!actor?.isOwner) return null;
  const tipo = hueco?.cat === "herencia" ? "razas" : "dotes";
  const indice = await indicePF2e(tipo);
  if (!indice) { ui.notifications.warn(SIN_DATOS); return null; }
  const datos = { tipo, indice, conocidas: await conocidasPF2e() };
  const C = claseSelector();
  const ya = foundry.applications.instances?.get?.(`ecos-dotes-${actor.id}-${hueco?.clave ?? "libre"}`);
  if (ya) { ya.datos = datos; return ya.render({ force: true }); }
  return new C(actor, hueco, datos).render({ force: true });
}

/** Copia la dote del compendio a la hoja, marcada con su hueco, y lo avisa en el chat con «Deshacer». */
export async function tomarDote(actor, hueco, entrada, { tipo = "dotes" } = {}) {
  if (!actor?.isOwner) return null;
  if (hueco && itemsPorHueco(actor).has(hueco.clave)) { ui.notifications.warn("Ese hueco ya tiene una dote: quítala primero."); return null; }
  const doc = await game.packs.get(`world.${PACKS[tipo].name}`)?.getDocument(entrada._id);
  if (!doc) { ui.notifications.warn("No encontré esa dote en el compendio."); return null; }
  const data = game.items.fromCompendium(doc, { clearFolder: true });
  foundry.utils.setProperty(data, `flags.${MOD}.huecoDote`, hueco?.clave ?? null);
  foundry.utils.setProperty(data, `flags.${MOD}.dotePF2e`, { por: game.user.id, fecha: Date.now() });
  const [it] = await actor.createEmbeddedDocuments("Item", [data]);
  if (!it) return null;
  const donde = hueco ? (hueco.cat === "herencia" ? "herencia" : `hueco de nivel ${hueco.nivel} · ${NOMBRE_CAT[hueco.cat]}`) : "asignada a mano";
  await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), whisper: [...new Set([...game.users.filter(u => u.isGM).map(u => u.id), game.user.id])],
    content: `<section class="ecos-dote-chat"><h3><i class="fa-solid fa-medal"></i> ${esc(actor.name)} toma ${hueco?.cat === "herencia" ? "una herencia" : "una dote"}</h3>
      <p><b>${esc(it.name)}</b> · ${esc(donde)}</p><button type="button" data-ecos-dote-deshacer="${esc(it.uuid)}"><i class="fa-solid fa-rotate-left"></i> Deshacer</button></section>` });
  ui.notifications.info(`${actor.name}: ${it.name}.`);
  return it;
}
export async function quitarDote(actor, item) {
  if (!actor?.isOwner || !item) return false;
  const DV = foundry.applications.api.DialogV2;
  const ok = await DV.confirm({ window: { title: "Quitar dote" }, content: `<p>¿Quitar <b>${esc(item.name)}</b> de la hoja? El hueco queda libre para elegir otra.</p>`, rejectClose: false });
  if (!ok) return false;
  await item.delete();
  if (!game.user.isGM) ChatMessage.create({ whisper: game.users.filter(u => u.isGM).map(u => u.id), content: `<p>${esc(actor.name)} quitó la dote <b>${esc(item.name)}</b>.</p>` });
  return true;
}
export async function abrirPestana(actor) {
  const s = actor?.sheet; if (!s) return;
  await s.render({ force: true });
  try { s.changeTab(PESTANA, "primary"); } catch { /* otra hoja */ }
}

/* -------- La pestaña -------- */
function htmlPestana(actor) {
  const nivel = Number(actor.system?.details?.level) || 1, gm = game.user.isGM, duenio = actor.isOwner;
  const huecos = huecosDe({ nivel, herencia: tieneHuecoHerencia(actor) }), llenos = itemsPorHueco(actor);
  const pend = huecos.filter(h => h.abierto && !llenos.has(h.clave)).length;
  const carta = h => {
    const it = llenos.get(h.clave), vacio = !it && h.abierto && duenio;
    const estado = it ? "lleno" : h.abierto ? "vacio pendiente" : "cerrado";
    return `<div class="ecos-hueco ${estado} cat-${h.cat}" data-clave="${h.clave}" ${vacio ? 'data-ecos-dotes="elegir" role="button" tabindex="0"' : ""}
      data-tooltip="${esc(it ? "Tu dote de este hueco" : h.abierto ? "Toca para elegir" : `Se abre al nivel ${h.nivel}`)}">
      <span class="ecos-hueco-nv">${h.nivel}</span>
      <span class="ecos-hueco-txt"><small>${NOMBRE_CAT[h.cat]}</small><b>${it ? esc(it.name) : h.abierto ? (duenio ? "Elegir…" : "Vacío") : `Nivel ${h.nivel}`}</b></span>
      ${it ? `<img src="${esc(it.img)}" alt=""><a data-ecos-dotes="ver" data-id="${it.id}" data-tooltip="Leer la dote"><i class="fa-solid fa-eye"></i></a>${duenio ? `<a data-ecos-dotes="quitar" data-id="${it.id}" data-tooltip="Quitar (deja el hueco libre)"><i class="fa-solid fa-xmark"></i></a>` : ""}` : ""}</div>`;
  };
  const sueltas = lista(actor.items).filter(i => i.flags?.[MOD]?.dotePF2e && i.flags?.[MOD]?.huecoDote == null);
  const fl = actor.flags?.[MOD] ?? {};
  return `<header class="ecos-dotes-cab"><h3><i class="fa-solid fa-medal"></i> Dotes menores</h3>
    <p>En cada nivel sin Mejora de característica eliges una dote menor de PF2e, ya nivelada a D&amp;D. Toca un hueco vacío para ver las que puedes tomar según tu nivel, tu clase, tu especie y sus requisitos.</p>
    ${pend ? `<p class="ecos-dotes-pend"><i class="fa-solid fa-circle-exclamation"></i> ${pend} hueco${pend === 1 ? "" : "s"} por llenar.</p>` : ""}</header>
    <div class="ecos-dotes-huecos">${huecos.map(carta).join("")}</div>
    ${sueltas.length ? `<div class="ecos-dotes-sueltas"><h4>Dotes de PF2e sin hueco (las dio el DM)</h4><ul>${sueltas.map(i => `<li><img src="${esc(i.img)}" alt=""> ${esc(i.name)} <a data-ecos-dotes="ver" data-id="${i.id}"><i class="fa-solid fa-eye"></i></a>${duenio ? ` <a data-ecos-dotes="quitar" data-id="${i.id}"><i class="fa-solid fa-xmark"></i></a>` : ""}</li>`).join("")}</ul></div>` : ""}
    ${gm ? `<div class="ecos-dotes-dm"><b><i class="fa-solid fa-crown"></i> DM</b>
      <button type="button" data-ecos-dotes="libre"><i class="fa-solid fa-hand-holding-medical"></i> Asignar una dote a mano</button>
      <button type="button" data-ecos-dotes="clase">Clase para las dotes: ${esc(fl.dotesClase ? CLASE_ES[fl.dotesClase] ?? fl.dotesClase : "la de su hoja")}</button>
      <button type="button" data-ecos-dotes="ascendencia">Ascendencia: ${esc(fl.dotesAscendencia ? NOMBRE_ASC[fl.dotesAscendencia] ?? fl.dotesAscendencia : "la de su especie")}</button>
      <button type="button" data-ecos-dotes="herencia">Hueco de herencia: ${tieneHuecoHerencia(actor) ? "sí" : "no"}</button></div>` : ""}`;
}
async function clicPestana(ev, app) {
  const b = ev.target.closest("[data-ecos-dotes]"); if (!b) return;
  ev.preventDefault(); ev.stopPropagation();
  const actor = app.document, accion = b.dataset.ecosDotes;
  if (accion === "elegir") { const h = huecosDe({ nivel: Number(actor.system?.details?.level) || 1, herencia: tieneHuecoHerencia(actor) }).find(x => x.clave === b.dataset.clave); return abrirSelector(actor, h); }
  if (accion === "ver") return actor.items.get(b.dataset.id)?.sheet?.render({ force: true });
  if (accion === "quitar") return quitarDote(actor, actor.items.get(b.dataset.id));
  if (!game.user.isGM) return;
  if (accion === "libre") return abrirSelector(actor, null);
  if (accion === "herencia") return actor.setFlag(MOD, "dotesHuecoHerencia", !actor.getFlag(MOD, "dotesHuecoHerencia"));
  if (accion === "clase") {
    const op = `<option value="">La de su hoja</option>${Object.entries(CLASE_ES).map(([k, n]) => `<option value="${k}" ${actor.getFlag(MOD, "dotesClase") === k ? "selected" : ""}>${n}</option>`).join("")}`;
    const r = await foundry.applications.api.DialogV2.prompt({ window: { title: `Clase para las dotes · ${actor.name}` }, rejectClose: false,
      content: `<p>Para clases propias o que PF2e no tiene: elige de qué clase salen sus dotes de clase.</p><select name="v">${op}</select>`, ok: { label: "Guardar", callback: (_e, bt) => bt.form.elements.v.value } });
    if (r == null) return;
    return r ? actor.setFlag(MOD, "dotesClase", r) : actor.unsetFlag(MOD, "dotesClase");
  }
  if (accion === "ascendencia") {
    const nombres = { ...NOMBRE_ASC };
    for (const e of (await indicePF2e("razas")) ?? []) {
      if (e.f.tipo === "raza" && e.f.slug) nombres[e.f.slug] ??= e.name;
      if (e.f.tipo === "herencia" && e.f.versatil && e.f.nombre) nombres[slug(e.f.nombre)] ??= `${e.name} (herencia versátil)`;
    }
    const op = `<option value="">La de su especie</option>${Object.entries(nombres).sort((a, b) => a[1].localeCompare(b[1], "es")).map(([k, n]) => `<option value="${esc(k)}" ${actor.getFlag(MOD, "dotesAscendencia") === k ? "selected" : ""}>${esc(n)}</option>`).join("")}`;
    const r = await foundry.applications.api.DialogV2.prompt({ window: { title: `Ascendencia para las dotes · ${actor.name}` }, rejectClose: false,
      content: `<p>Para especies propias del mundo: elige de qué ascendencia de PF2e salen sus dotes de ascendencia (se suma a la de su especie).</p><select name="v">${op}</select>`, ok: { label: "Guardar", callback: (_e, bt) => bt.form.elements.v.value } });
    if (r == null) return;
    return r ? actor.setFlag(MOD, "dotesAscendencia", r) : actor.unsetFlag(MOD, "dotesAscendencia");
  }
}
function decorar(app) {
  try {
    const actor = app?.document, el = app?.element;
    if (!(actor instanceof Actor) || !el?.querySelector || !activo()) return;
    if (actor.type === "character") {
      const nivel = Number(actor.system?.details?.level) || 1, llenos = itemsPorHueco(actor);
      const pend = huecosDe({ nivel, herencia: tieneHuecoHerencia(actor) }).filter(h => h.abierto && !llenos.has(h.clave)).length;
      const nav = el.querySelector(`[data-action="tab"][data-tab="${PESTANA}"], nav [data-tab="${PESTANA}"]`);
      if (nav) { if (pend && actor.isOwner) nav.dataset.ecosPendientes = String(pend); else delete nav.dataset.ecosPendientes; }
      const cuerpo = el.querySelector(`.tab[data-tab="${PESTANA}"] .ecos-dotes-cuerpo`);
      if (cuerpo) {
        cuerpo.innerHTML = htmlPestana(actor);
        if (!cuerpo.dataset.ecosEnlazado) {
          cuerpo.dataset.ecosEnlazado = "1";
          cuerpo.addEventListener("click", ev => clicPestana(ev, app).catch(err => console.error(`${MOD} | dotes`, err)));
          cuerpo.addEventListener("keydown", ev => { if ((ev.key === "Enter" || ev.key === " ") && ev.target.matches?.('[data-ecos-dotes="elegir"]')) clicPestana(ev, app); });
        }
      }
    }
    if (!actor.isOwner || !["character", "npc"].includes(actor.type)) return;
    const rasgos = el.querySelector('.tab[data-tab="features"]');
    if (!rasgos || rasgos.querySelector(".ecos-dotes-fila")) return;
    const fila = document.createElement("div");
    fila.className = "ecos-dotes-fila";
    const b = document.createElement("button");
    b.type = "button"; b.className = "ecos-dotes-boton";
    if (actor.type === "npc") {
      b.innerHTML = '<i class="fa-solid fa-medal" inert></i> Sumar dotes de PF2e';
      b.dataset.tooltip = "Buscar dotes de PF2e niveladas a D&D (de clase, ascendencia, habilidad o generales) y sumarlas a este PNJ.";
      b.addEventListener("click", ev => { ev.preventDefault(); abrirSelector(actor, null).catch(err => console.error(`${MOD} | dotes`, err)); });
    } else {
      b.innerHTML = '<i class="fa-solid fa-medal" inert></i> Dotes menores';
      b.dataset.tooltip = "Ir a la pestaña Dotes: tus huecos por nivel.";
      b.addEventListener("click", ev => { ev.preventDefault(); try { app.changeTab(PESTANA, "primary"); } catch { abrirSelector(actor, null); } });
    }
    fila.append(b);
    rasgos.prepend(fila);
  } catch (err) { console.warn(`${MOD} | pestaña de dotes`, err); }
}

/* -------- Aviso al subir de nivel -------- */
async function avisarNivel(actor, antes, ahora) {
  if (!activo() || leer("dotesAvisoNivel", true) === false || actor?.type !== "character") return;
  const nuevos = huecosNuevos(antes, ahora);
  if (!nuevos.length) return;
  const duenos = game.users.filter(u => u.isGM || actor.testUserPermission?.(u, "OWNER")).map(u => u.id);
  await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), whisper: duenos,
    content: `<section class="ecos-dote-chat"><h3><i class="fa-solid fa-medal"></i> ${esc(actor.name)} · nivel ${ahora}</h3>
      <p>Hueco${nuevos.length === 1 ? "" : "s"} de dote menor: ${nuevos.map(h => `<b>${NOMBRE_CAT[h.cat]}</b> (nivel ${h.nivel})`).join(", ")}.</p>
      <button type="button" data-ecos-dotes-abrir="${esc(actor.uuid)}"><i class="fa-solid fa-medal"></i> Elegir en la pestaña Dotes</button></section>` });
}

/** Guía para los jugadores (página de las reglas de la casa). Pura. */
export function guiaDotesHTML() {
  const fila = h => `<tr><td>${h.nivel}</td><td>${NOMBRE_CAT[h.cat]}</td></tr>`;
  return `<section class="mcp-journal"><h1>Dotes menores: cómo tomarlas</h1>
<p><em>Las dotes de Pathfinder 2e, niveladas a D&amp;D. Son más chicas que una dote de D&amp;D: dan una opción táctica, un uso nuevo de una habilidad o un rasgo de tu especie.</em></p>
<h2>Cuándo</h2><p>En cada nivel <b>sin</b> Mejora de característica tienes un hueco. Si tu hoja ya pasó esos niveles, los huecos ya están ahí, vacíos.</p>
<table><thead><tr><th>Nivel</th><th>Hueco</th></tr></thead><tbody>${HUECOS_DOTE.map(fila).join("")}</tbody></table>
<ul><li><b>De clase</b>: de tu clase (si tienes varias, de cualquiera) y de nivel igual o menor que tus niveles en ella.</li>
<li><b>De ascendencia</b>: de tu especie o de tu herencia versátil.</li><li><b>De habilidad</b>: piden competencia o pericia en una habilidad.</li>
<li><b>General</b>: generales o de habilidad.</li>
<li><b>Herencia</b> (nivel 1): solo si tu especie viene de PF2e (o si el DM te la da).</li></ul>
<p>Si tu clase o tu especie no tienen dotes de PF2e, ese hueco admite una general o de habilidad (o el DM elige de dónde salen).</p>
<h2>Paso a paso</h2><ol><li>Abre tu hoja: pestaña <b>Dotes</b> <i class="fa-solid fa-medal"></i> (el número rojo dice cuántos huecos tienes por llenar).</li>
<li>Toca un hueco vacío. Se abre la lista de las que puedes tomar; toca una para leerla entera.</li>
<li><b>Tomar</b>: la dote pasa a tu hoja (también la ves en Rasgos) y queda en el chat con <b>Deshacer</b>.</li>
<li>Para cambiarla, la <b>×</b> del hueco la quita y el hueco queda libre.</li></ol>
<h2>Requisitos</h2><p>«Competente en X» = tu competencia de D&amp;D en esa habilidad. «Pericia en X» = Pericia de D&amp;D (doble competencia); con «nivel 7» o «nivel 15» se pide además ese nivel. Lo que el módulo no puede comprobar dice «Lo confirma el DM». Las poco comunes y raras, con permiso del DM.</p>
<p><em>El DM tiene la última palabra: puede asignar cualquier dote a mano o quitarla.</em></p></section>`;
}

if (globalThis.Hooks) {
  Hooks.once("init", () => {
    const rehacer = () => { for (const a of foundry.applications.instances?.values?.() ?? []) if (a.document instanceof Actor && a.rendered) a.render(); };
    game.settings.register(MOD, "dotesPorNivel", { name: "Dotes menores por nivel (PF2e)", hint: "Pestaña «Dotes» en las hojas de PJ con un hueco de dote menor en cada nivel sin Mejora de característica. Apágalo para quitar la pestaña (las dotes ya tomadas se quedan en la hoja).",
      scope: "world", config: true, type: Boolean, default: true, onChange: rehacer });
    game.settings.register(MOD, "dotesRaras", { name: "Dotes poco comunes y raras sin pedirlas", hint: "Si está apagado, los jugadores ven las dotes poco comunes y raras pero no las pueden tomar solos: el DM las asigna.",
      scope: "world", config: true, type: Boolean, default: false });
    game.settings.register(MOD, "dotesAvisoNivel", { name: "Aviso de huecos de dote al subir de nivel", hint: "Al subir de nivel, un mensaje al jugador con un botón a la pestaña Dotes.", scope: "world", config: true, type: Boolean, default: true });
  });
  Hooks.once("setup", () => {
    const C = globalThis.dnd5e?.applications?.actor?.CharacterActorSheet;
    if (!C?.TABS || !C.PARTS || C.TABS.some(t => t.tab === PESTANA)) return;
    const i = C.TABS.findIndex(t => t.tab === "features");
    C.TABS.splice(i >= 0 ? i + 1 : C.TABS.length, 0, { tab: PESTANA, label: "Dotes", icon: "fa-solid fa-medal", condition: () => activo() });
    C.PARTS[PESTANA] = { container: { classes: ["tab-body"], id: "tabs" }, template: `modules/${MOD}/templates/dotes-pestana.hbs`, scrollable: [""] };
  });
  Hooks.on("renderActorSheetV2", decorar);
  Hooks.on("preUpdateItem", (item, cambios, opciones) => {
    if (item.type === "class" && item.parent?.type === "character" && foundry.utils.hasProperty(cambios, "system.levels"))
      opciones.ecosNivelAntes = { total: Number(item.parent.system?.details?.level) || 0, clase: Number(item.system?.levels) || 0 };
  });
  Hooks.on("updateItem", (item, cambios, opciones, userId) => {
    const a = opciones.ecosNivelAntes; if (!a || userId !== game.user.id) return;
    const ahora = a.total + (Number(foundry.utils.getProperty(cambios, "system.levels")) - a.clase);
    if (ahora > a.total) avisarNivel(item.parent, a.total, ahora).catch(err => console.error(`${MOD} | aviso de dotes`, err));
  });
  Hooks.on("createItem", (item, _o, userId) => {
    if (userId !== game.user.id || item.type !== "class" || item.parent?.type !== "character") return;
    const ahora = Number(item.parent.system?.details?.level) || 0;
    avisarNivel(item.parent, ahora - (Number(item.system?.levels) || 0), ahora).catch(err => console.error(`${MOD} | aviso de dotes`, err));
  });
  Hooks.on("renderChatMessageHTML", (_msg, html) => {
    for (const b of html.querySelectorAll?.("[data-ecos-dotes-abrir]") ?? []) b.addEventListener("click", async ev => {
      ev.preventDefault(); const a = await fromUuid(b.dataset.ecosDotesAbrir); if (a?.isOwner) abrirPestana(a);
    });
    for (const b of html.querySelectorAll?.("[data-ecos-dote-deshacer]") ?? []) b.addEventListener("click", async ev => {
      ev.preventDefault();
      const it = await fromUuid(b.dataset.ecosDoteDeshacer);
      if (!it) return ui.notifications.info("Esa dote ya no está en la hoja.");
      if (!it.isOwner) return ui.notifications.warn("Solo el dueño de la hoja o el DM.");
      await it.delete(); ui.notifications.info(`Quitada: ${it.name}.`);
    });
  });
  Hooks.once("ready", () => {
    const api = game.modules.get(MOD)?.api; if (api) api.dotesNivel = { selector: abrirSelector, pestana: abrirPestana, tomar: tomarDote, guia: guiaDotesHTML };
    if (game.user.isGM && (!game.users.activeGM || game.users.activeGM.isSelf) && activo())
      import("./acciones-comunes.js").then(m => m.paginaReglas("guiaDotes", "17 · Dotes menores: cómo tomarlas", guiaDotesHTML())).catch(err => console.error(`${MOD} | guía de dotes`, err));
  });
}
