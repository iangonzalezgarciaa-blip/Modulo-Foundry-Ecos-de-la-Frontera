/**
 * 3.62 · Subir de nivel a un PNJ (pedido del autor, 12-nov-2026: «botón para subir de nivel a cualquier PNJ»).
 * En la cabecera de la hoja de un PNJ (solo el DM) sale «Nivel PNJ»: sube o baja su Valor de Desafío paso a paso
 * (0 → 1/8 → 1/4 → 1/2 → 1 → 2 … 30) o salta a uno elegido. En cada paso:
 *  - PG: sus dados de golpe crecen en la misma proporción que los PG típicos de su VD (al menos un dado más, como mucho
 *    el doble) y sus PG máximos se escalan igual que sus dados, así que una criatura hecha a propósito con pocos PG
 *    sigue siendo «de pocos golpes» para un grupo de su nivel. Los PG actuales guardan su proporción.
 *  - Competencia, ataques y CD suben solos con el VD (D&D lo calcula). En VD 4, 8, 12, 16 y 19, +2 a su mejor
 *    característica (como la mejora de un PJ). En VD 4, 5, 8, 10, 13 y 17, +1 CA (los saltos de la tabla de la Guía).
 *  - Su nivel de lanzador y su nivel del Verbe (si los tiene) suben uno.
 * Bajar deshace el último paso exacto (guarda una pila); si no hay pila, baja en proporción.
 * Revertir: «Deshacer» del chat (DM) o «Bajar». A mano: el VD y los PG se siguen editando en la hoja.
 */
const MOD = "ecos-frontera";
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
export const ESCALERA_VD = [0, 0.125, 0.25, 0.5, ...Array.from({ length: 30 }, (_, i) => i + 1)];
export const MEJORA_CAR = new Set([4, 8, 12, 16, 19]);
export const MEJORA_CA = new Set([4, 5, 8, 10, 13, 17]);
const CARS = ["str", "dex", "con", "int", "wis", "cha"];
const NOMBRE_CAR = { str: "FUE", dex: "DES", con: "CON", int: "INT", wis: "SAB", cha: "CAR" };
/** PG típicos de un VD (punto medio de la tabla de la Guía del DM). Puro. */
export function hpMedio(cr) {
  const c = Number(cr) || 0;
  if (c <= 0) return 3.5;
  if (c < 1) return { 0.125: 21, 0.25: 42.5, 0.5: 60 }[c] ?? 21;
  if (c <= 19) return 78 + 15 * (c - 1);
  if (c === 20) return 378;
  return 423 + 45 * (c - 21);
}
/** El VD siguiente (dir 1) o anterior (dir −1) en la escalera. Puro. */
export function siguienteVD(cr, dir = 1) {
  const c = Number(cr) || 0;
  let i = ESCALERA_VD.findIndex(x => x >= c - 1e-9); if (i < 0) i = ESCALERA_VD.length - 1;
  if (ESCALERA_VD[i] > c + 1e-9 && dir < 0) return ESCALERA_VD[Math.max(0, i - 1)];
  if (ESCALERA_VD[i] > c + 1e-9 && dir > 0) return ESCALERA_VD[i];
  return ESCALERA_VD[Math.max(0, Math.min(ESCALERA_VD.length - 1, i + Math.sign(dir)))];
}
export const textoVD = cr => ({ 0.125: "1/8", 0.25: "1/4", 0.5: "1/2" })[Number(cr)] ?? String(Number(cr) || 0);
/** «4d8 + 4» → {n:4, d:8, mod:4}. Puro. */
export function leerFormula(f) {
  const m = String(f ?? "").match(/^\s*(\d+)\s*d\s*(\d+)\s*(?:([+-])\s*(\d+))?\s*$/i);
  return m ? { n: Number(m[1]), d: Number(m[2]), mod: m[3] ? (m[3] === "-" ? -1 : 1) * Number(m[4]) : 0 } : null;
}
export function formulaPG(n, d, porDado) { const mod = n * porDado; return mod ? `${n}d${d} ${mod < 0 ? "-" : "+"} ${Math.abs(mod)}` : `${n}d${d}`; }
/** Su mejor característica (desempata FUE > DES > CON > …). Puro. */
export const mejorCar = abil => CARS.map(k => [k, Number(abil?.[k]) || 10]).sort((a, b) => b[1] - a[1] || CARS.indexOf(a[0]) - CARS.indexOf(b[0]))[0][0];
/**
 * Un paso de nivel. `e` = {cr, hpMax, hpValue, formula, con, abil, ca, verbe, spell}. Devuelve el estado nuevo (o null
 * si no hay más escalera) con `notas` de lo que cambió. Puro.
 */
export function pasoPNJ(e, dir = 1) {
  const cr = Number(e.cr) || 0, nuevo = siguienteVD(cr, dir);
  if (nuevo === cr) return null;
  const ratio = hpMedio(nuevo) / hpMedio(cr), f = leerFormula(e.formula), hp = Math.max(1, Number(e.hpMax) || 1);
  const con = Math.floor(((Number(e.abil?.con) || 10) - 10) / 2);
  const notas = [`VD ${textoVD(cr)} → ${textoVD(nuevo)}`];
  let hpMax, formula = e.formula ?? "";
  if (f && f.n > 0) {
    const n2 = dir > 0 ? Math.max(f.n + 1, Math.min(f.n * 2, Math.round(f.n * ratio))) : Math.max(1, Math.min(f.n - 1, Math.max(Math.ceil(f.n / 2), Math.round(f.n * ratio))));
    formula = formulaPG(n2, f.d, con);
    hpMax = Math.max(1, Math.round(hp * n2 / f.n));
  } else hpMax = dir > 0 ? Math.max(hp + 1, Math.min(hp * 2, Math.round(hp * ratio))) : Math.max(1, Math.min(hp - 1, Math.round(hp * ratio)));
  const hpValue = Math.max(0, Math.min(hpMax, Math.round((Number(e.hpValue ?? hp) || 0) * hpMax / hp)));
  notas.push(`PG ${hp} → ${hpMax}${formula && formula !== e.formula ? ` (${formula})` : ""}`);
  const abil = { ...(e.abil ?? {}) }; let car = null, ca = Number(e.ca) || 0;
  if (dir > 0 && MEJORA_CAR.has(nuevo)) { car = mejorCar(abil); abil[car] = Math.min(30, (Number(abil[car]) || 10) + 2); notas.push(`+2 ${NOMBRE_CAR[car]}`); }
  if (dir > 0 && MEJORA_CA.has(nuevo)) { ca += 1; notas.push("+1 CA"); }
  if (dir < 0 && MEJORA_CA.has(cr) && ca > 0) { ca -= 1; notas.push("−1 CA"); }
  const verbe = e.verbe == null ? null : Math.max(1, Math.min(20, Number(e.verbe) + Math.sign(dir)));
  const spell = !Number(e.spell) ? e.spell ?? null : Math.max(1, Math.min(20, Number(e.spell) + Math.sign(dir)));
  if (verbe != null && verbe !== e.verbe) notas.push(`Verbe nivel ${e.verbe} → ${verbe}`);
  if (spell && spell !== e.spell) notas.push(`lanzador ${e.spell} → ${spell}`);
  return { cr: nuevo, hpMax, hpValue, formula, con: e.con, abil, ca, verbe, spell, car, notas };
}

/* ---------------- Foundry ---------------- */
const ruta = (o, r) => foundry.utils.getProperty(o, r);
function estadoDe(actor) {
  const s = actor._source.system ?? {}, ae = actor.effects.find(x => x.getFlag(MOD, "nivelPNJ"));
  return { cr: Number(s.details?.cr) || 0, hpMax: Number(s.attributes?.hp?.max) || Number(actor.system.attributes?.hp?.max) || 1, hpValue: Number(s.attributes?.hp?.value) || 0,
    formula: s.attributes?.hp?.formula ?? "", abil: Object.fromEntries(CARS.map(k => [k, Number(s.abilities?.[k]?.value) || 10])),
    ca: Number(ae?.getFlag(MOD, "nivelPNJ")?.ca) || 0, verbe: ruta(actor._source, `flags.${MOD}.verbe.nivel`) ?? null, spell: s.attributes?.spell?.level ?? null };
}
const RUTAS = ["system.details.cr", "system.attributes.hp.max", "system.attributes.hp.value", "system.attributes.hp.formula", ...CARS.map(k => `system.abilities.${k}.value`),
  `flags.${MOD}.verbe.nivel`, "system.attributes.spell.level", `flags.${MOD}.nivelPNJ`];
/** Sube (dir 1) o baja (dir −1) `veces` pasos. Deja un mensaje al DM con lo que cambió y «Deshacer». */
export async function nivelPNJ(actor, dir = 1, veces = 1) {
  if (!game.user.isGM || actor?.type !== "npc") return null;
  const fuente = { ...foundry.utils.deepClone(actor._source), uuid: actor.uuid };
  const antes = {}; for (const r of RUTAS) { const v = ruta(fuente, r); if (v !== undefined || r.endsWith("nivelPNJ")) antes[r] = v; }
  const ae = actor.effects.find(x => x.getFlag(MOD, "nivelPNJ"));
  let e = estadoDe(actor);
  const pila = [...(actor.getFlag(MOD, "nivelPNJ")?.pila ?? [])], notas = [];
  for (let i = 0; i < veces; i++) {
    if (dir > 0) { const p = pasoPNJ(e, 1); if (!p) break; pila.push({ cr: e.cr, hpMax: e.hpMax, hpValue: e.hpValue, formula: e.formula, abil: e.abil, ca: e.ca, verbe: e.verbe, spell: e.spell }); notas.push(p.notas.join(", ")); e = p; }
    else {
      const prev = pila.pop();
      if (prev) { notas.push(`VD ${textoVD(e.cr)} → ${textoVD(prev.cr)} (deshace la subida: PG ${e.hpMax} → ${prev.hpMax})`); e = { ...prev, hpValue: Math.min(prev.hpMax, Math.round(e.hpValue * prev.hpMax / Math.max(1, e.hpMax))) }; }
      else { const p = pasoPNJ(e, -1); if (!p) break; notas.push(p.notas.join(", ")); e = p; }
    }
  }
  if (!notas.length) { ui.notifications.info("No hay más escalones en esa dirección."); return null; }
  const upd = { "system.details.cr": e.cr, "system.attributes.hp.max": e.hpMax, "system.attributes.hp.value": e.hpValue, "system.attributes.hp.formula": e.formula,
    ...Object.fromEntries(CARS.map(k => [`system.abilities.${k}.value`, e.abil[k]])), [`flags.${MOD}.nivelPNJ`]: { pila } };
  if (e.verbe != null) upd[`flags.${MOD}.verbe.nivel`] = e.verbe;
  if (e.spell != null) upd["system.attributes.spell.level"] = e.spell;
  await actor.update(upd);
  const datosAE = { changes: e.ca ? [{ key: "system.attributes.ac.bonus", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: `+${e.ca}` }] : [], [`flags.${MOD}.nivelPNJ`]: { ca: e.ca } };
  const cambios = [{ uuid: actor.uuid, antes }], borrar = [];
  if (ae) { cambios.push({ uuid: ae.uuid, antes: { changes: foundry.utils.deepClone(ae._source.changes), [`flags.${MOD}.nivelPNJ`]: ae.getFlag(MOD, "nivelPNJ") } }); await ae.update(datosAE); }
  else if (e.ca) {
    const [nuevo] = await actor.createEmbeddedDocuments("ActiveEffect", [{ name: "Nivel ganado (Ecos)", img: "icons/svg/upgrade.svg", transfer: false, disabled: false,
      description: "<p>Lo que el PNJ ganó al subir de nivel con «Nivel PNJ» (la CA). Lo demás está en su hoja.</p>", ...foundry.utils.expandObject(datosAE) }]);
    if (nuevo) borrar.push(nuevo.uuid);
  }
  await ChatMessage.create({ whisper: game.users.filter(u => u.isGM).map(u => u.id), speaker: { alias: "Nivel PNJ" },
    content: `<div class="ecos-dialogo"><p><b>${esc(actor.name)}</b> ${dir > 0 ? "sube" : "baja"} de nivel:</p><ul>${notas.map(n => `<li>${esc(n)}</li>`).join("")}</ul><p class="ecos-nota">Competencia, ataques, CD y PX siguen al VD solos. Revisa a mano si debe ganar un rasgo (Ataque múltiple desde VD 5 suele ser lo justo).</p><p><button type="button" data-ecos-deshacer><i class="fa-solid fa-rotate-left"></i> Deshacer</button></p></div>`,
    flags: { [MOD]: { deshacer: { cambios, borrar } } } });
  return e;
}
export async function abrirNivelPNJ(actor) {
  if (!game.user.isGM || actor?.type !== "npc") return;
  const e = estadoDe(actor), sube = pasoPNJ(e, 1), pila = actor.getFlag(MOD, "nivelPNJ")?.pila ?? [];
  const baja = pila.length ? { notas: [`VD ${textoVD(e.cr)} → ${textoVD(pila.at(-1).cr)} (deshace la última subida)`] } : pasoPNJ(e, -1);
  const opciones = ESCALERA_VD.map(c => `<option value="${c}" ${c === e.cr ? "selected" : ""}>VD ${textoVD(c)}</option>`).join("");
  const res = await foundry.applications.api.DialogV2.wait({
    window: { title: `Nivel PNJ · ${actor.name}`, icon: "fa-solid fa-arrow-up-right-dots" }, position: { width: 480 },
    content: `<div class="ecos-dialogo ecos-nivel-pnj"><p>Ahora: <b>VD ${textoVD(e.cr)}</b> · PG ${e.hpMax}${e.formula ? ` (${esc(e.formula)})` : ""}${e.ca ? ` · CA +${e.ca} ganada` : ""}${e.verbe != null ? ` · Verbe nivel ${e.verbe}` : ""}.</p>
      <p><b>Subir:</b> ${sube ? esc(sube.notas.join(", ")) : "ya está en lo más alto"}.</p><p><b>Bajar:</b> ${baja ? esc(baja.notas.join(", ")) : "ya está en lo más bajo"}.</p>
      <label>O ir directo a <select name="vd">${opciones}</select></label>
      <p class="ecos-nota">Los PG crecen en proporción a sus dados: una criatura de pocos golpes sigue siéndolo para un grupo de su nivel. Todo trae «Deshacer» en el chat.</p></div>`,
    buttons: [
      { action: "sube", label: "Subir 1", icon: "fa-solid fa-arrow-up", default: true, callback: () => ({ dir: 1, veces: 1 }) },
      { action: "baja", label: "Bajar 1", icon: "fa-solid fa-arrow-down", callback: () => ({ dir: -1, veces: 1 }) },
      { action: "ir", label: "Ir a ese VD", icon: "fa-solid fa-forward", callback: (_e, b) => {
        const meta = Number(b.form.elements.vd.value), i0 = ESCALERA_VD.indexOf(e.cr), i1 = ESCALERA_VD.indexOf(meta);
        return i0 < 0 || i1 < 0 || i0 === i1 ? null : { dir: Math.sign(i1 - i0), veces: Math.abs(i1 - i0) };
      } },
      { action: "no", label: "Cerrar", callback: () => null }
    ], rejectClose: false
  }).catch(() => null);
  if (res) await nivelPNJ(actor, res.dir, res.veces);
}
if (globalThis.Hooks) {
  Hooks.once("ready", () => { const api = game.modules.get(MOD)?.api; if (api) Object.assign(api, { nivelPNJ, abrirNivelPNJ }); });
  const poner = (app) => {
    const actor = app?.document ?? app?.actor;
    if (!game.user.isGM || !(actor instanceof Actor) || actor.type !== "npc") return;
    const cab = app.element?.querySelector?.(".window-header");
    if (!cab || cab.querySelector(".ecos-nivel-pnj-boton")) return;
    const b = document.createElement("button");
    b.type = "button"; b.className = "header-control ecos-nivel-pnj-boton"; b.dataset.tooltip = "Subir o bajar de nivel a este PNJ (VD, PG, característica, CA, Verbe), con Deshacer";
    b.innerHTML = `<i class="fa-solid fa-arrow-up-right-dots"></i> Nivel PNJ`;
    b.addEventListener("click", ev => { ev.preventDefault(); ev.stopPropagation(); abrirNivelPNJ(actor).catch(err => console.error(`${MOD} | nivel PNJ`, err)); });
    cab.querySelector('[data-action="close"], .close')?.before(b);
  };
  Hooks.on("renderActorSheetV2", poner);
  Hooks.on("renderActorSheet", poner);
}
