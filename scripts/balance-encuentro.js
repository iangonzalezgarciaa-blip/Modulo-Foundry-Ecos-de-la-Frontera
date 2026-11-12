/**
 * 3.44 · Balance del encuentro al arrastrar una criatura (pedido del autor, 11-nov-2026). Al poner en la escena una
 * criatura hostil, el DM ve: el presupuesto del grupo que elija (D&D 2024: bajo, moderado y alto), cuánto pesa lo que
 * ya hay en la escena, si es letal (en total o por una criatura muy por encima del grupo) y tres recomendaciones con
 * criaturas de su mundo: **interesante** (siempre: táctico, entre moderado y alto, enemigos suficientes para repartir
 * el juego), **trivial** (para ritmo o narración) y **alto**. Cada recomendación se puede colocar con un botón y
 * deshacer; el token recién puesto también se puede quitar. El criterio táctico del autor: gana quien acierta mejor o
 * crea las condiciones para acertar, no quien pega más.
 */
const MOD = "ecos-frontera";
import { ESCENARIOS } from "./escenarios-datos.js";
const ESCENARIOS_N = Object.fromEntries(Object.entries(ESCENARIOS).map(([k, e]) => [k, e.n]));
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
export const XP_VD = { 0: 10, 0.125: 25, 0.25: 50, 0.5: 100, 1: 200, 2: 450, 3: 700, 4: 1100, 5: 1800, 6: 2300, 7: 2900, 8: 3900, 9: 5000, 10: 5900, 11: 7200, 12: 8400,
  13: 10000, 14: 11500, 15: 13000, 16: 15000, 17: 18000, 18: 20000, 19: 22000, 20: 25000, 21: 33000, 22: 41000, 23: 50000, 24: 62000, 25: 75000, 26: 90000, 27: 105000, 28: 120000, 29: 135000, 30: 155000 };
/** Presupuesto de XP por PJ según su nivel (Guía del DM 2024): [bajo, moderado, alto]. */
export const PRESUPUESTO_NIVEL = { 1: [50, 75, 100], 2: [100, 150, 200], 3: [150, 225, 400], 4: [250, 375, 500], 5: [500, 750, 1100], 6: [600, 1000, 1400], 7: [750, 1300, 1700],
  8: [1000, 1700, 2100], 9: [1300, 2000, 2600], 10: [1600, 2300, 3100], 11: [1900, 2900, 4100], 12: [2200, 3700, 4700], 13: [2600, 4200, 5400], 14: [2900, 4900, 6200],
  15: [3300, 5400, 7800], 16: [3800, 6100, 9800], 17: [4500, 7200, 11700], 18: [5000, 8700, 14200], 19: [5500, 10700, 17200], 20: [6400, 13200, 22000] };
export const xpDe = cr => XP_VD[Number(cr)] ?? XP_VD[Math.min(30, Math.max(0, Math.round(Number(cr) || 0)))] ?? 0;
/** Presupuesto del grupo: suma por PJ. Puro. */
export function presupuestoGrupo(niveles) {
  const p = { bajo: 0, moderado: 0, alto: 0 };
  for (const n of niveles ?? []) { const t = PRESUPUESTO_NIVEL[Math.min(20, Math.max(1, Math.trunc(Number(n) || 1)))]; p.bajo += t[0]; p.moderado += t[1]; p.alto += t[2]; }
  return p;
}
/** Qué tan duro es: trivial, bajo, moderado, alto o letal. Puro. */
export function clasificar(xp, p) {
  if (!p?.alto) return "sin grupo";
  if (xp < p.bajo * 0.5) return "trivial";
  if (xp < p.moderado) return "bajo";
  if (xp < p.alto) return "moderado";
  if (xp <= p.alto * 1.25) return "alto";
  return "letal";
}
/** Qué aporta un aliado PNJ al presupuesto del grupo: como un PJ de nivel ≈ su VD (los de VD menor que 1, una fracción). Puro. */
export function aporteAliado(cr) {
  const c = Number(cr) || 0;
  if (c <= 0) return { bajo: 0, moderado: 0, alto: 0 };
  const t = PRESUPUESTO_NIVEL[Math.min(20, Math.max(1, Math.round(c)))], f = c >= 1 ? 1 : c * 2;
  return { bajo: Math.round(t[0] * f), moderado: Math.round(t[1] * f), alto: Math.round(t[2] * f) };
}
/** Una criatura sola puede ser letal aunque el total no lo sea: VD 3 o más por encima del nivel más alto. Puro. */
export const letalSola = (cr, niveles) => (niveles?.length ? Number(cr) >= Math.max(...niveles.map(Number)) + 3 : false);
/**
 * Cuántas de qué criatura sumar para llegar a un objetivo de XP. Prefiere VD que no pase del nivel medio del grupo y una
 * cantidad que deje a los enemigos entre 1 y 2 por PJ (economía de acciones: hay a quién acertar y qué preparar). Puro.
 */
export function sugerir({ xpActual = 0, objetivo = 0, candidatos = [], nPJ = 1, nEnemigos = 0, nivelMedio = 1 } = {}) {
  const falta = objetivo - xpActual;
  if (falta <= 0) return { falta, n: 0, candidato: null };
  const maxN = Math.max(1, Math.min(8, Math.round(nPJ * 2) - nEnemigos)), minDeseado = Math.max(0, nPJ - nEnemigos);
  let mejor = null;
  for (const c of candidatos) {
    if (!c?.xp || Number(c.cr) > nivelMedio + 1) continue;
    for (let n = 1; n <= maxN; n++) {
      const total = n * c.xp;
      if (total > falta * 1.2) break;
      const err = Math.abs(falta - total) / falta + (n < minDeseado ? 0.25 : 0) + (Number(c.cr) > nivelMedio ? 0.1 : 0);
      if (!mejor || err < mejor.err) mejor = { n, candidato: c, err, xpFinal: xpActual + total };
    }
  }
  return mejor ? { falta, n: mejor.n, candidato: mejor.candidato, xpFinal: mejor.xpFinal } : { falta, n: 0, candidato: null };
}

/* ---------------- Foundry ---------------- */
const ETIQUETA = { trivial: "Trivial", bajo: "Bajo", moderado: "Moderado", alto: "Alto", letal: "LETAL", "sin grupo": "Elige el grupo" };
const crDe = a => Number(a?.system?.details?.cr ?? 0) || 0;
const pjsMundo = () => game.actors.filter(a => a.type === "character" && a.hasPlayerOwner);
const nivelDe = a => Number(a.system?.details?.level) || 1;
const hostilesEscena = sc => (sc?.tokens ?? []).filter(t => t.actor && t.actor.type !== "character" && !t.actor.hasPlayerOwner && (t.disposition ?? 0) < 0);
function candidatosPara(actor) {
  const mismos = actor?.folder ? game.actors.filter(a => a.folder?.id === actor.folder.id) : [];
  const raiz = f => { while (f?.folder) f = f.folder; return f; };
  const r = raiz(actor?.folder);
  const otros = r ? game.actors.filter(a => raiz(a.folder)?.id === r.id) : [];
  const ver = new Set(), out = [];
  for (const a of [...mismos, ...otros]) {
    if (a.type === "character" || a.hasPlayerOwner || ver.has(a.id)) continue;
    ver.add(a.id); out.push({ id: a.id, nombre: a.name, cr: crDe(a), xp: xpDe(crDe(a)), mismaCarpeta: a.folder?.id === actor?.folder?.id });
  }
  return out.sort((x, y) => (y.mismaCarpeta - x.mismaCarpeta)).slice(0, 80);
}
async function colocar(scene, junto, actorId, n) {
  const a = game.actors.get(actorId);
  if (!a || !scene) return [];
  const g = scene.grid?.size ?? 100, base = await a.getTokenDocument({ hidden: false });
  const datos = [], pos = [[1, 0], [0, 1], [-1, 0], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1], [2, 0], [0, 2]];
  for (let i = 0; i < n; i++) { const [dx, dy] = pos[i % pos.length]; datos.push({ ...base.toObject(), x: (junto?.x ?? 0) + dx * g * (1 + Math.floor(i / pos.length)), y: (junto?.y ?? 0) + dy * g }); }
  const creados = await scene.createEmbeddedDocuments("Token", datos, { ecosSinBalance: true });
  return creados.map(t => t.id);
}
export async function abrirBalance({ token = null, scene = canvas?.scene } = {}) {
  if (!game.user.isGM || !scene) return;
  const pjs = pjsMundo(), enEscena = new Set((scene.tokens ?? []).map(t => t.actorId));
  let elegidos; try { elegidos = game.settings.get(MOD, "balanceGrupo"); } catch { elegidos = []; }
  if (!elegidos?.length) elegidos = pjs.filter(a => enEscena.has(a.id)).map(a => a.id);
  if (!elegidos?.length) elegidos = pjs.map(a => a.id);
  const actor = token?.actor ?? null, puestos = [];
  const calcular = (ids) => {
    const niveles = pjs.filter(a => ids.includes(a.id)).map(nivelDe), p = presupuestoGrupo(niveles);
    // 3.59: los aliados PNJ del tablero también suman al grupo (como un PJ de nivel ≈ su VD).
    const aliados = (scene.tokens ?? []).filter(t => t.actor && t.actor.type !== "character" && !t.actor.hasPlayerOwner && (t.disposition ?? 0) > 0);
    for (const t of aliados) { const a = aporteAliado(crDe(t.actor)); p.bajo += a.bajo; p.moderado += a.moderado; p.alto += a.alto; }
    const host = hostilesEscena(scene), xp = host.reduce((s, t) => s + xpDe(crDe(t.actor)), 0), clase = clasificar(xp, p);
    const medio = niveles.length ? Math.round(niveles.reduce((s, n) => s + n, 0) / niveles.length) : 1;
    const solas = host.filter(t => letalSola(crDe(t.actor), niveles));
    const cands = candidatosPara(actor ?? host.at(-1)?.actor);
    const base = { xpActual: xp, candidatos: cands, nPJ: niveles.length || 1, nEnemigos: host.length, nivelMedio: medio };
    return { niveles, p, host, xp, clase, solas, medio, aliados, escenario: scene.getFlag?.(MOD, "escenario") ?? null,
      interesante: sugerir({ ...base, objetivo: Math.round((p.moderado + p.alto) / 2) }),
      alto: sugerir({ ...base, objetivo: p.alto }),
      trivial: xp < p.bajo * 0.5 ? null : { quitar: true } };
  };
  const linea = (s, nombre) => !s ? "" : s.n ? `<b>${nombre}:</b> suma <b>${s.n} × ${esc(s.candidato.nombre)}</b> (VD ${s.candidato.cr}, ${s.n * s.candidato.xp} XP) → ${s.xpFinal} XP. <button type="button" data-colocar="${s.candidato.id}" data-n="${s.n}"><i class="fa-solid fa-plus"></i> Colocar</button>`
    : (s.falta <= 0 ? `<b>${nombre}:</b> ya llegas (o te pasas) con lo que hay.` : `<b>${nombre}:</b> no encuentro criaturas de su carpeta que encajen; súmalas a mano.`);
  const cuerpo = (c) => `<div class="ecos-balance">
    <p class="ecos-balance-clase ecos-balance-${c.clase.replace(" ", "-")}">${ETIQUETA[c.clase] ?? c.clase} · ${c.xp} XP en la escena (${c.host.length} hostiles) · grupo: bajo ${c.p.bajo} · moderado ${c.p.moderado} · alto ${c.p.alto}</p>
    ${c.aliados.length ? `<p>Aliados PNJ en el tablero: <b>${c.aliados.map(t => esc(t.name)).join(", ")}</b> (ya suman al presupuesto del grupo).</p>` : ""}
    ${c.escenario ? `<p><b>Escenario:</b> ${esc(ESCENARIOS_N[c.escenario] ?? c.escenario)} (consejos y sucesos en el Asistente de combate).</p>` : `<p class="ecos-nota">Esta escena no tiene etiqueta de escenario: Menú del DM → «Etiqueta de la escena».</p>`}
    ${c.clase === "letal" ? `<p class="ecos-aviso"><b>Esto es letal para este grupo.</b> Quita criaturas, divide el combate en oleadas o dales una salida (huir, negociar, un objetivo que no sea matar).</p>` : ""}
    ${c.solas.length ? `<p class="ecos-aviso"><b>Criatura letal por sí sola:</b> ${c.solas.map(t => esc(t.name)).join(", ")} (VD 3 o más por encima del nivel más alto del grupo): un solo golpe suyo puede tumbar a un PJ.</p>` : ""}
    <ul><li>${linea(c.interesante, "Interesante (recomendado)")}</li><li>${c.trivial ? "<b>Trivial:</b> para ritmo o narración, deja una o dos criaturas débiles (quita las demás) o dales una razón para no pelear a muerte." : "<b>Trivial:</b> ya lo es: sirve para ritmo, para presentar una criatura o para gastar recursos poco a poco."}</li><li>${linea(c.alto, "Alto")}</li></ul>
    <details open><summary><b>Qué lo hace interesante</b> (táctico, no de quién pega más)</summary><ul>
      <li>Entre <b>moderado y alto</b>, y entre <b>1 y 2 enemigos por PJ</b>: hay a quién acertar, a quién flanquear y qué preparar. Ahora: ${c.host.length} enemigos para ${c.niveles.length} PJ.</li>
      <li><b>Dos papeles o más</b>: alguien que aguanta adelante y alguien que molesta desde atrás o controla.</li>
      <li><b>Defensas que se abren</b>: con Coraza o Fortaleza, gana quien crea Brecha o Grieta y luego acierta.</li>
      <li><b>Terreno y un objetivo</b> además de matar: cobertura, altura, algo que proteger o un tiempo límite.</li></ul></details></div>`;
  const dlg = new foundry.applications.api.DialogV2({ window: { title: `Balance del encuentro${actor ? ` · ${actor.name}` : ""}`, icon: "fa-solid fa-scale-balanced" }, position: { width: 620 },
    content: `<div class="ecos-dialogo"><p><b>Grupo:</b> ${pjs.map(a => `<label class="ecos-check"><input type="checkbox" name="pj" value="${a.id}" ${elegidos.includes(a.id) ? "checked" : ""}> ${esc(a.name)} (nv ${nivelDe(a)})</label>`).join(" ")}</p>
      <div data-balance>${cuerpo(calcular(elegidos))}</div>
      <p><label class="ecos-check"><input type="checkbox" name="callar"> No preguntar más en esta escena</label></p></div>`,
    buttons: [...(token ? [{ action: "quitar", label: "Quitar el token que puse", icon: "fa-solid fa-rotate-left" }] : []), { action: "deshacer", label: "Deshacer lo colocado", icon: "fa-solid fa-trash-arrow-up" }, { action: "cerrar", label: "Cerrar", default: true }],
    submit: async (res) => {
      if (dlg.element?.querySelector("[name=callar]")?.checked) await scene.setFlag(MOD, "balanceCallar", true);
      if (res === "quitar" && token) await token.delete().catch(() => null);
      if (res === "deshacer" && puestos.length) await scene.deleteEmbeddedDocuments("Token", puestos.splice(0)).catch(() => null);
    } });
  await dlg.render(true);
  const el = dlg.element, ids = () => [...el.querySelectorAll("input[name=pj]:checked")].map(i => i.value);
  const refrescar = () => { el.querySelector("[data-balance]").innerHTML = cuerpo(calcular(ids())); };
  el.addEventListener("change", ev => { if (ev.target.name === "pj") { game.settings.set(MOD, "balanceGrupo", ids()).catch(() => null); refrescar(); } });
  el.addEventListener("click", async ev => {
    const b = ev.target.closest("button[data-colocar]"); if (!b) return;
    ev.preventDefault();
    puestos.push(...await colocar(scene, token ?? hostilesEscena(scene).at(-1), b.dataset.colocar, Number(b.dataset.n)));
    refrescar();
  });
}
if (globalThis.Hooks) {
  Hooks.once("init", () => {
    game.settings.register(MOD, "balanceAlArrastrar", { name: "Balance del encuentro al arrastrar criaturas", hint: "Al poner una criatura hostil en la escena, te dice si es letal para el grupo y te recomienda qué sumar para un combate interesante (o trivial, o alto).", scope: "world", config: true, type: Boolean, default: true });
    game.settings.register(MOD, "balanceGrupo", { scope: "world", config: false, type: Array, default: [] });
  });
  Hooks.once("ready", () => { const api = game.modules.get(MOD)?.api; if (api) api.balance = abrirBalance; });
  Hooks.on("createToken", (doc, opts, userId) => {
    if (userId !== game.user.id || !game.user.isGM || !game.settings.get(MOD, "balanceAlArrastrar")) return;
    const a = doc.actor;
    if (!a || a.type === "character" || a.hasPlayerOwner || (doc.disposition ?? 0) >= 0 || doc.parent?.getFlag(MOD, "balanceCallar") || opts?.ecosSinBalance) return;
    if (abrirBalance._abierto) return;
    abrirBalance._abierto = true;
    setTimeout(() => { abrirBalance({ token: doc, scene: doc.parent }).catch(err => console.error(`${MOD} | balance`, err)).finally(() => { abrirBalance._abierto = false; }); }, 150);
  });
}
