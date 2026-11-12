/**
 * 3.61 · Estados enlazados (pedido del autor, 12-nov-2026): «donde diga Grieta o cualquier estado alterado, que enlace al
 * diario que lo explica; para todo el texto del módulo». El DM tiene un diario «Ecos · Estados alterados» (los jugadores
 * lo pueden leer) con una página por estado: los de D&D, los del Verbe (Empapado, Ardiendo…), la ruptura (Brecha, Grieta,
 * Quebrado), las defensas (Coraza, Fortaleza, Cuerpo sordo) y los del módulo (Desprevenido, Sorprendido…).
 * Cada nombre de estado con mayúscula en una descripción, un diario o el chat pasa a ser un enlace que abre su página.
 * Se apaga en los ajustes («Estados enlazados»).
 */
import { ESTADOS_EXPLICADOS } from "./estados-explicados.js";
import { DEFENSAS } from "./ruptura.js";

const MOD = "ecos-frontera";
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const lista = x => Array.from(x?.contents ?? x ?? []);
/** Nombres demasiado comunes para enlazar solos en una frase. */
const COMUNES = new Set(["Muerto", "Volando", "Estable", "Marcado", "Transformado", "Invisible", "Esquivando", "Concentrándose", "Enfermo", "Cargado (peso)"]);

/** Las formas de un nombre: Derribado → Derribado, Derribada, Derribados, Derribadas; Grieta → Grieta, Grietas. Puro. */
export function formas(nombre) {
  const n = String(nombre ?? "").trim();
  if (!n || n.includes(" ")) return n ? [n] : [];
  if (/o$/.test(n)) { const b = n.slice(0, -1); return [n, `${b}a`, `${n}s`, `${b}as`]; }
  if (/a$/.test(n)) return [n, `${n}s`];
  return [n];
}
const escRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/** Una expresión que encuentra cualquiera de los nombres (con mayúscula, palabra entera). Puro. */
export function patronEstados(nombres) {
  const todas = [...new Set(nombres.flatMap(formas))].sort((a, b) => b.length - a.length);
  if (!todas.length) return null;
  return new RegExp(`(?<![\\p{L}\\p{N}])(${todas.map(escRe).join("|")})(?![\\p{L}\\p{N}])`, "gu");
}
/** De qué estado es una palabra encontrada. Puro. */
export function idDe(palabra, mapa) {
  for (const [id, e] of Object.entries(mapa)) if (formas(e.n).includes(palabra)) return id;
  return null;
}

/* ---------------- Foundry ---------------- */
const leer = (k, d) => { try { return game.settings.get(MOD, k); } catch { return d; } };
let MAPA = {}, PATRON = null;
/** Todos los estados que conoce la mesa, con su texto. */
export function diccionario() {
  const m = {};
  for (const [id, e] of Object.entries(ESTADOS_EXPLICADOS)) m[id] = { n: e.n, html: `<p>${esc(e.que)}</p>${e.hacer ? `<p><b>Qué hacer:</b> ${esc(e.hacer)}</p>` : ""}` };
  for (const s of CONFIG.statusEffects ?? []) {
    if (!s?.id || m[s.id] || !s.name) continue;
    const n = game.i18n?.localize?.(s.name) ?? s.name;
    m[s.id] = { n, html: s.description ?? "" };
  }
  const D = game.modules.get(MOD)?.api?.verbe?.datos?.();
  for (const e of D?.estados ?? []) {
    m[e.id] = { n: e.nombre, html: `<p><b>${esc(e.nat)}</b> · dura ${esc(e.dura)}.</p><p>${esc(e.hace)}</p>${e.cruce ? `<p><b>Si se cruza con otro elemento:</b> ${esc(e.cruce)}</p>` : ""}` };
  }
  for (const [k, d] of Object.entries(DEFENSAS ?? {})) if (d?.nombre && !Object.values(m).some(x => x.n === d.nombre)) m[`defensa-${k}`] = { n: d.nombre, html: `<p>${esc(d.texto)}</p>` };
  if (m.encumbered) m.encumbered.n = "Cargado (peso)"; // «Cargado» en el módulo es el estado del Rayo
  for (const k of Object.keys(m)) if (COMUNES.has(m[k].n)) m[k].comun = true;
  return m;
}
function preparar() {
  MAPA = diccionario();
  PATRON = patronEstados(Object.values(MAPA).filter(e => !e.comun).map(e => e.n));
}
const diarioEstados = () => game.journal?.find(j => j.getFlag?.(MOD, "estadosAlterados"));
/** El DM crea o pone al día el diario de estados (una página por estado). */
export async function asegurarDiarioEstados() {
  if (!game.user.isGM || (game.users.activeGM && !game.users.activeGM.isSelf)) return null;
  const m = diccionario();
  let j = diarioEstados();
  const OBS = CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER;
  if (!j) j = await JournalEntry.create({ name: "Ecos · Estados alterados", ownership: { default: OBS }, flags: { [MOD]: { estadosAlterados: true } } });
  const ya = new Map(lista(j.pages).map(p => [p.getFlag(MOD, "estado"), p]));
  const crear = [], cambiar = [];
  const orden = Object.entries(m).sort((a, b) => a[1].n.localeCompare(b[1].n, "es"));
  orden.forEach(([id, e], i) => {
    const html = `<h1>${esc(e.n)}</h1>${e.html || "<p>Lee la tarjeta o la ficha para ver qué hace.</p>"}`;
    const p = ya.get(id);
    if (!p) crear.push({ name: e.n, type: "text", sort: (i + 1) * 1000, text: { content: html, format: 1 }, flags: { [MOD]: { estado: id } } });
    else if (p.text?.content !== html) cambiar.push({ _id: p.id, name: e.n, "text.content": html });
  });
  if (crear.length) await j.createEmbeddedDocuments("JournalEntryPage", crear);
  if (cambiar.length) await j.updateEmbeddedDocuments("JournalEntryPage", cambiar);
  return j;
}
/** Abre la página de un estado. */
export async function abrirEstado(id) {
  const j = diarioEstados();
  const p = lista(j?.pages).find(x => x.getFlag(MOD, "estado") === id);
  if (!j || !p) return ui.notifications.info(`${MAPA[id]?.n ?? id}: el DM todavía no creó el diario de estados.`);
  return j.sheet.render({ force: true, pageId: p.id });
}
function enlace(palabra) {
  const id = idDe(palabra, MAPA); if (!id) return null;
  const a = document.createElement("a");
  a.className = "ecos-estado-link"; a.dataset.estado = id; a.textContent = palabra;
  a.dataset.tooltip = String(MAPA[id]?.html ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 220) || MAPA[id]?.n;
  return a;
}
/** Enlaza los estados dentro de un elemento ya pintado (textos del módulo que no pasan por el enriquecedor). */
export function enlazarEn(raiz) {
  if (!PATRON || !raiz || leer("enlacesEstados", true) === false) return;
  const w = document.createTreeWalker(raiz, globalThis.NodeFilter.SHOW_TEXT, { acceptNode: n => (n.parentElement?.closest("a, button, input, textarea, select, [contenteditable='true'], .ecos-estado-link, code, h1, h2") ? globalThis.NodeFilter.FILTER_REJECT : globalThis.NodeFilter.FILTER_ACCEPT) });
  const nodos = []; while (w.nextNode()) nodos.push(w.currentNode);
  for (const n of nodos) {
    const t = n.nodeValue; PATRON.lastIndex = 0;
    if (!PATRON.test(t)) continue;
    PATRON.lastIndex = 0;
    const frag = document.createDocumentFragment(); let i = 0, m;
    while ((m = PATRON.exec(t))) {
      const a = enlace(m[1]); if (!a) continue;
      frag.append(t.slice(i, m.index), a); i = m.index + m[1].length;
    }
    if (!i) continue;
    frag.append(t.slice(i)); n.replaceWith(frag);
  }
}

if (globalThis.Hooks) {
  Hooks.once("init", () => game.settings.register(MOD, "enlacesEstados", { name: "Estados enlazados", hint: "Cada estado alterado nombrado en descripciones, diarios y chat (Derribado, Grieta, Empapado, Coraza…) enlaza a su página del diario «Ecos · Estados alterados».", scope: "world", config: true, type: Boolean, default: true }));
  Hooks.once("ready", () => {
    preparar();
    // Lo que Foundry enriquece (descripciones, diarios, chat): el enriquecedor de texto.
    if (PATRON && leer("enlacesEstados", true) !== false) CONFIG.TextEditor.enrichers.push({ id: "ecosEstados", pattern: new RegExp(PATRON.source, "gu"), enricher: async m => enlace(m[1]) ?? document.createTextNode(m[0]) });
    document.addEventListener("click", ev => {
      const a = ev.target.closest?.(".ecos-estado-link"); if (!a) return;
      ev.preventDefault(); ev.stopPropagation(); abrirEstado(a.dataset.estado);
    }, true);
    setTimeout(() => { asegurarDiarioEstados().then(() => preparar()).catch(err => console.error(`${MOD} | estados`, err)); }, 6000);
    const api = game.modules.get(MOD)?.api; if (api) api.estados = { abrir: abrirEstado, enlazar: enlazarEn, diario: asegurarDiarioEstados };
  });
  // Lo que pinta el módulo (panel del Verbe, ventanas de técnicas y dotes): se enlaza después de pintar.
  Hooks.on("renderApplicationV2", (app, el) => {
    const raiz = el instanceof HTMLElement ? el : app?.element;
    if (!raiz?.classList || !/ecos-/.test(raiz.className)) return;
    for (const x of raiz.querySelectorAll(".ev-lectura, .ecos-dialogo p, .ecos-dialogo li, .ecos-sd-detalle")) enlazarEn(x);
  });
}
