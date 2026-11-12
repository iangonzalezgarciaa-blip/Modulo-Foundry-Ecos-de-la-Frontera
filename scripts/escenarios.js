/**
 * 3.59 · Asistente de combate y escenario cambiante (pedido del autor, 12-nov-2026).
 *  - Cada escena lleva una etiqueta de escenario (bosque, cueva, taberna…): se elige al crear la escena, en su
 *    configuración o desde el asistente. El balance del encuentro y el asistente la usan.
 *  - Al empezar un combate, el asistente pregunta el escenario, quién es aliado, neutral u hostil (todas las fichas del
 *    tablero, no solo los protagonistas), calcula el balance contando a los aliados PNJ y recomienda qué hacer.
 *  - Durante el combate, en cada turno se tira 1d20: con el umbral elegido pasa un suceso del escenario (compendio de
 *    19 escenarios × 10 sucesos + comunes), nivelado al grupo (CD y dados). El DM lo narra y lo resuelve con un botón.
 * Revertir: «Deshacer» en la tarjeta del suceso (PG y estados), los bandos vuelven con «Deshacer bandos», y el asistente
 * se apaga en los ajustes o con «Sin asistente». A mano: «Otro suceso», «Suceso ahora» en el Menú del DM y elegir los bandos.
 */
import { ESCENARIOS, SUCESOS_COMUNES } from "./escenarios-datos.js";
import { presupuestoGrupo, clasificar, xpDe, letalSola, aporteAliado } from "./balance-encuentro.js";
export { aporteAliado };

const MOD = "ecos-frontera";
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const lista = x => Array.from(x?.contents ?? x ?? []);
export { ESCENARIOS };

/* ---------------- Reglas puras ---------------- */
export const UMBRALES = { apagado: { n: "Sin sucesos", u: 99 }, calmo: { n: "Calmo (20)", u: 20 }, normal: { n: "Normal (18+)", u: 18 }, agitado: { n: "Agitado (16+)", u: 16 }, caotico: { n: "Caótico (14+)", u: 14 } };
export const SALV = { str: "Fuerza", dex: "Destreza", con: "Constitución", int: "Inteligencia", wis: "Sabiduría", cha: "Carisma" };
const DANO = { bajo: ["1d6", "2d6", "3d6", "4d6"], medio: ["2d6", "3d6", "5d6", "7d6"], alto: ["3d6", "5d6", "8d6", "11d6"] };
/** CD de un suceso según el nivel medio del grupo. Puro. */
export const cdEscenario = nivel => 10 + Math.ceil(Math.max(1, Math.min(20, Number(nivel) || 1)) / 2);
/** Dados de daño de un suceso (bajo, medio o alto) según el nivel. Puro. */
export function dadosEscenario(grado, nivel) {
  const n = Math.max(1, Number(nivel) || 1), t = n <= 4 ? 0 : n <= 10 ? 1 : n <= 16 ? 2 : 3;
  return DANO[grado]?.[t] ?? null;
}
/** Elige un suceso: los del escenario y, de vez en cuando (1 de 6), uno común. `tirar(n)` da 0..n-1. Puro. */
export function elegirSuceso(id, tirar = n => Math.floor(Math.random() * n)) {
  const e = ESCENARIOS[id];
  const comun = !e || tirar(6) === 0;
  const l = comun ? SUCESOS_COMUNES : e.eventos;
  return { ...l[tirar(l.length) % l.length], escenario: e?.n ?? "Cualquiera" };
}
/** El suceso con su CD y sus dados para este grupo. Puro. */
export function nivelar(ev, nivel) {
  return { ...ev, cd: ev.salv ? cdEscenario(nivel) : null, formula: ev.dano ? dadosEscenario(ev.dano, nivel) : null };
}
/** Balance con aliados: presupuesto de los PJ + aliados PNJ contra la XP de los hostiles. Puro. */
export function balanceBandos({ nivelesPJ = [], crAliados = [], crHostiles = [] } = {}) {
  const p = presupuestoGrupo(nivelesPJ);
  for (const c of crAliados) { const a = aporteAliado(c); p.bajo += a.bajo; p.moderado += a.moderado; p.alto += a.alto; }
  const xp = crHostiles.reduce((s, c) => s + xpDe(c), 0);
  return { p, xp, clase: clasificar(xp, p), solas: crHostiles.filter(c => letalSola(c, nivelesPJ)).length };
}
/** Consejos del asistente según el balance, los números y el escenario. Puro. */
export function recomendaciones({ clase, nPJ = 0, nAliados = 0, nHostiles = 0, solas = 0, escenario = null } = {}) {
  const r = [];
  if (clase === "letal") r.push("Letal: divide en oleadas, quita a alguien o dales una salida (huir, negociar, un objetivo que no sea matar).");
  if (clase === "alto") r.push("Alto: bien para un clímax. Ten a mano una ayuda del terreno o un PNJ que cambie de bando.");
  if (clase === "moderado") r.push("Moderado: el punto justo para un combate táctico.");
  if (clase === "bajo" || clase === "trivial") r.push(`${clase === "trivial" ? "Trivial" : "Bajo"}: sirve para ritmo; súbelo con un objetivo (proteger, escapar, tiempo límite) o con refuerzos a mitad del combate.`);
  if (solas) r.push(`${solas} criatura${solas === 1 ? "" : "s"} muy por encima del grupo: un golpe suyo puede tumbar a un PJ. Avisa con la narración antes de que ataque.`);
  const total = nPJ + nAliados;
  if (nHostiles === 1 && total >= 3) r.push("Un solo enemigo contra muchos: la economía de acciones lo aplasta. Súmale secuaces, acciones de guarida o reacciones.");
  if (total && nHostiles > total * 2) r.push("Muchos enemigos por PJ: los turnos se alargan. Agrupa a los iguales o usa secuaces (mueren de un golpe).");
  if (nAliados) r.push(`Hay ${nAliados} aliado${nAliados === 1 ? "" : "s"} PNJ: que tengan una meta propia (huir, proteger a alguien) para que no roben el protagonismo.`);
  if (escenario?.tactica) r.push(...escenario.tactica.map(t => `${escenario.n}: ${t}`));
  return r;
}

/* ---------------- Foundry ---------------- */
const leer = (k, d) => { try { return game.settings.get(MOD, k); } catch { return d; } };
const soyDM = () => !!game.user?.isGM && (game.users?.activeGM ? game.users.activeGM.isSelf : true);
const crDe = a => Number(a?.system?.details?.cr ?? 0) || 0;
const esPJ = a => a?.type === "character" && a.hasPlayerOwner;
const nivelDe = a => Number(a?.system?.details?.level) || 1;
const escenarioDe = scene => scene?.getFlag?.(MOD, "escenario") ?? null;
const opcionesEscenario = sel => `<option value="">— Sin etiqueta —</option>${Object.entries(ESCENARIOS).map(([k, e]) => `<option value="${k}" ${k === sel ? "selected" : ""}>${esc(e.n)}</option>`).join("")}`;
const BANDO = { 1: "aliado", 0: "neutral", [-1]: "hostil", [-2]: "hostil" };
const DISP = { aliado: 1, neutral: 0, hostil: -1 };
const nivelMedio = tokens => { const n = tokens.filter(t => esPJ(t.actor)).map(t => nivelDe(t.actor)); return n.length ? Math.round(n.reduce((a, b) => a + b, 0) / n.length) : 1; };

/** Pide la etiqueta de una escena. */
export async function etiquetarEscena(scene = canvas?.scene) {
  if (!game.user.isGM || !scene) return null;
  const r = await foundry.applications.api.DialogV2.wait({ window: { title: `Escenario · ${scene.name}`, icon: "fa-solid fa-mountain-sun" }, position: { width: 420 },
    content: `<div class="ecos-dialogo"><p>¿Qué lugar es esta escena? El balance del encuentro y el asistente de combate usan la etiqueta (consejos tácticos y sucesos).</p><select name="esc">${opcionesEscenario(escenarioDe(scene))}</select></div>`,
    buttons: [{ action: "ok", label: "Guardar", icon: "fa-solid fa-check", default: true, callback: (_e, b) => b.form.elements.esc.value }, { action: "no", label: "Ahora no" }], rejectClose: false });
  if (r == null || r === "no") return null;
  if (r) await scene.setFlag(MOD, "escenario", r); else await scene.unsetFlag(MOD, "escenario");
  return r;
}

/** El asistente al empezar (o cuando el DM quiera): escenario, bandos, balance y sucesos. */
export async function asistenteCombate(combat = game.combat) {
  if (!game.user.isGM) return;
  const scene = combat?.scene ?? canvas?.scene;
  if (!scene) return ui.notifications.warn("No hay escena.");
  const tokens = lista(scene.tokens).filter(t => t.actor);
  const enCombate = new Set(lista(combat?.combatants).map(c => c.tokenId));
  const previo = combat?.getFlag?.(MOD, "escenario") ?? {};
  const fila = t => `<tr><td>${esc(t.name)}${esPJ(t.actor) ? " <small>(PJ)</small>" : ` <small>VD ${crDe(t.actor)}</small>`}</td>
    <td><select name="b-${t.id}">${["aliado", "neutral", "hostil"].map(b => `<option value="${b}" ${BANDO[t.disposition ?? 0] === b ? "selected" : ""}>${b[0].toUpperCase() + b.slice(1)}</option>`).join("")}</select></td>
    <td>${combat ? `<input type="checkbox" name="c-${t.id}" ${enCombate.has(t.id) ? "checked" : ""}>` : ""}</td></tr>`;
  const calcular = raiz => {
    const campo = n => raiz?.querySelector?.(`[name="${n}"]`) ?? null;
    const bando = t => campo(`b-${t.id}`)?.value ?? BANDO[t.disposition ?? 0];
    const dentro = t => !combat || (campo(`c-${t.id}`)?.checked ?? enCombate.has(t.id));
    const vivos = tokens.filter(t => dentro(t) && !t.actor.statuses?.has?.("dead"));
    const pjs = vivos.filter(t => esPJ(t.actor)), aliados = vivos.filter(t => !esPJ(t.actor) && bando(t) === "aliado"), hostiles = vivos.filter(t => bando(t) === "hostil" && !esPJ(t.actor));
    const id = campo("esc")?.value ?? previo.id ?? escenarioDe(scene);
    const b = balanceBandos({ nivelesPJ: pjs.map(t => nivelDe(t.actor)), crAliados: aliados.map(t => crDe(t.actor)), crHostiles: hostiles.map(t => crDe(t.actor)) });
    const rec = recomendaciones({ clase: b.clase, nPJ: pjs.length, nAliados: aliados.length, nHostiles: hostiles.length, solas: b.solas, escenario: ESCENARIOS[id] });
    return `<p class="ecos-balance-clase ecos-balance-${String(b.clase).replace(" ", "-")}"><b>${esc(b.clase.toUpperCase())}</b> · ${b.xp} XP hostil · presupuesto (PJ${aliados.length ? " + aliados" : ""}): bajo ${b.p.bajo} · moderado ${b.p.moderado} · alto ${b.p.alto}</p>
      <p>${pjs.length} PJ · ${aliados.length} aliado${aliados.length === 1 ? "" : "s"} · ${hostiles.length} hostil${hostiles.length === 1 ? "" : "es"} · nivel medio ${nivelMedio(vivos)}</p>
      <ul class="ecos-asis-rec">${rec.map(x => `<li>${esc(x)}</li>`).join("")}</ul>`;
  };
  const dlg = new foundry.applications.api.DialogV2({ window: { title: "Asistente de combate", icon: "fa-solid fa-chess-knight", resizable: true }, position: { width: 680, height: 700 },
    content: `<div class="ecos-dialogo ecos-asistente">
      <div class="ecos-asis-cab"><label>Escenario <select name="esc">${opcionesEscenario(previo.id ?? escenarioDe(scene))}</select></label>
        <label class="ecos-check"><input type="checkbox" name="guardar" ${escenarioDe(scene) ? "" : "checked"}> Guardarlo como etiqueta de la escena</label></div>
      <div class="ecos-asis-cab"><label>Sucesos por turno <select name="umbral">${Object.entries(UMBRALES).map(([k, u]) => `<option value="${k}" ${(previo.umbral ?? "normal") === k ? "selected" : ""}>${u.n}</option>`).join("")}</select></label>
        <label class="ecos-check"><input type="checkbox" name="mecanica" ${previo.mecanica === false ? "" : "checked"}> Con mecánica (CD y daño nivelados)</label>
        <label class="ecos-check"><input type="checkbox" name="publico" ${previo.publico ? "checked" : ""}> Que los vean los jugadores</label></div>
      <h3>Quién es quién</h3><p class="ecos-nota">Todas las fichas del tablero. Lo que marques cambia su disposición (con «Deshacer bandos» en el chat).${combat ? " La casilla suma o saca del combate." : ""}</p>
      <table class="ecos-asis-bandos"><thead><tr><th>Ficha</th><th>Bando</th><th>${combat ? "En combate" : ""}</th></tr></thead><tbody>${tokens.map(fila).join("")}</tbody></table>
      <h3>Balance y consejos</h3><div data-asis>${calcular(null)}</div></div>`,
    buttons: [{ action: "ok", label: "Empezar con esto", icon: "fa-solid fa-check", default: true, callback: (_e, b) => b.form }, { action: "no", label: "Sin asistente" }],
    submit: async (form) => { if (form && form !== "no") await aplicarAsistente(combat, scene, tokens, enCombate, form).catch(err => console.error(`${MOD} | asistente`, err)); } });
  await dlg.render(true);
  dlg.element?.addEventListener("change", () => { const caja = dlg.element.querySelector("[data-asis]"); if (caja) caja.innerHTML = calcular(dlg.element); });
}
async function aplicarAsistente(combat, scene, tokens, enCombate, form) {
  const id = form.elements.esc.value || null;
  if (form.elements.guardar?.checked && id) await scene.setFlag(MOD, "escenario", id);
  const antes = [], cambios = [];
  for (const t of tokens) {
    const v = DISP[form.elements[`b-${t.id}`]?.value];
    if (v !== undefined && v !== (t.disposition ?? 0) && !(v === -1 && t.disposition === -2)) { antes.push({ _id: t.id, disposition: t.disposition }); cambios.push({ _id: t.id, disposition: v }); }
  }
  if (cambios.length) {
    await scene.updateEmbeddedDocuments("Token", cambios);
    await ChatMessage.create({ whisper: game.users.filter(u => u.isGM).map(u => u.id), flags: { [MOD]: { bandosAntes: { scene: scene.id, antes } } },
      content: `<p class="ecos-asis-chat">Bandos: ${cambios.length} ficha${cambios.length === 1 ? "" : "s"} cambiada${cambios.length === 1 ? "" : "s"}.</p><button type="button" data-ecos-bandos-deshacer>Deshacer bandos</button>` });
  }
  if (combat) {
    const sumar = tokens.filter(t => form.elements[`c-${t.id}`]?.checked && !enCombate.has(t.id)).map(t => ({ tokenId: t.id, sceneId: scene.id, actorId: t.actorId, hidden: t.hidden }));
    const sacar = lista(combat.combatants).filter(c => form.elements[`c-${c.tokenId}`] && !form.elements[`c-${c.tokenId}`].checked).map(c => c.id);
    if (sumar.length) await combat.createEmbeddedDocuments("Combatant", sumar);
    if (sacar.length) await combat.deleteEmbeddedDocuments("Combatant", sacar);
    await combat.setFlag(MOD, "escenario", { id, umbral: form.elements.umbral.value, mecanica: !!form.elements.mecanica.checked, publico: !!form.elements.publico.checked });
  }
  ui.notifications.info(`Asistente: ${id ? ESCENARIOS[id].n : "sin escenario"}${combat ? ` · sucesos ${UMBRALES[form.elements.umbral.value]?.n ?? ""}` : ""}.`);
}

/** Objetivos de un suceso. */
function objetivosDe(ev, combat) {
  const vivos = lista(combat?.combatants).filter(c => c.actor && !c.defeated && !c.actor.statuses?.has?.("dead"));
  const actual = combat?.combatant;
  if (ev.a === "actua") return actual?.actor ? [actual] : [];
  if (ev.a === "azar") return vivos.length ? [vivos[Math.floor(Math.random() * vivos.length)]] : [];
  if (ev.a === "todos") return vivos;
  if (ev.a === "cerca") {
    const t0 = actual?.token?.object; if (!t0) return actual ? [actual] : [];
    const g = canvas.grid.size, cerca = c => { const t = c.token?.object; if (!t) return false; return Math.max(Math.abs(t.center.x - t0.center.x), Math.abs(t.center.y - t0.center.y)) <= g * 2.5; };
    return vivos.filter(cerca);
  }
  return [];
}
/** Saca un suceso y lo deja en el chat (al DM o a todos), con «Resolver», «Otro suceso» e «Ignorar». */
export async function sucesoAhora(combat = game.combat, { id = null, forzado = false } = {}) {
  if (!game.user.isGM) return;
  const cfg = combat?.getFlag?.(MOD, "escenario") ?? {};
  const esc_ = id ?? cfg.id ?? escenarioDe(combat?.scene ?? canvas?.scene);
  const ev = nivelar(elegirSuceso(esc_), nivelMedio(lista(combat?.scene?.tokens ?? canvas?.scene?.tokens)));
  const objs = objetivosDe(ev, combat);
  const mec = cfg.mecanica !== false;
  const lineaMec = !mec ? "" : ev.salv ? `<p class="ecos-suceso-mec">Salvación de <b>${SALV[ev.salv]} CD ${ev.cd}</b>${ev.formula ? ` · si falla <b>${ev.formula}</b> de ${esc(ev.dt ?? "daño")} (mitad si la pasa)` : ""}${ev.estado ? ` · si falla queda <b>${esc(nombreEstado(ev.estado))}</b>` : ""}${ev.ef ? `. ${esc(ev.ef)}` : ""}</p>` : ev.ef ? `<p class="ecos-suceso-mec">${esc(ev.ef)}</p>` : "";
  const quienes = objs.length ? `<p><small>Afecta a: <b>${objs.map(c => esc(c.name)).join(", ")}</b></small></p>` : "";
  await ChatMessage.create({ speaker: { alias: `Escenario · ${ev.escenario}` }, whisper: cfg.publico ? [] : game.users.filter(u => u.isGM).map(u => u.id),
    flags: { [MOD]: { suceso: { ev, objetivos: objs.map(c => c.actor?.uuid).filter(Boolean), combate: combat?.id ?? null } } },
    content: `<section class="ecos-suceso"><h3><i class="fa-solid fa-dice-d20"></i> ${forzado ? "Suceso" : "¡Pasa algo!"}</h3><p class="ecos-suceso-t">${esc(ev.t)}</p>${lineaMec}${quienes}
      <div class="ecos-suceso-bot" data-solo-dm>${mec && ev.salv && objs.length ? '<button type="button" data-ecos-suceso="resolver"><i class="fa-solid fa-gavel"></i> Resolver</button>' : ""}<button type="button" data-ecos-suceso="otro"><i class="fa-solid fa-shuffle"></i> Otro suceso</button></div></section>` });
}
const nombreEstado = k => ({ prone: "Derribado", restrained: "Apresado", grappled: "Agarrado", poisoned: "Envenenado", blinded: "Cegado", deafened: "Ensordecido", frightened: "Asustado", stunned: "Aturdido" })[k] ?? k;
async function resolverSuceso(msg) {
  const s = msg.flags?.[MOD]?.suceso; if (!s || s.resuelto || !game.user.isGM) return;
  const ev = s.ev, filas = [], antes = [];
  for (const u of s.objetivos ?? []) {
    const a = await fromUuid(u); if (!a) continue;
    const hp = a.system?.attributes?.hp; antes.push({ uuid: a.uuid, hp: hp ? { value: hp.value, temp: hp.temp ?? 0 } : null, estado: ev.estado && !a.statuses?.has?.(ev.estado) ? ev.estado : null });
    const rolls = await a.rollSavingThrow?.({ ability: ev.salv, target: ev.cd }, { configure: false }, { data: { flavor: `${ev.t} (${SALV[ev.salv]} CD ${ev.cd})` } }).catch(() => null);
    const r = Array.isArray(rolls) ? rolls[0] : rolls, ok = (r?.total ?? 0) >= ev.cd;
    let dano = 0;
    if (ev.formula) { dano = (await new Roll(ev.formula).evaluate()).total; if (ok) dano = Math.floor(dano / 2); if (dano > 0) await a.applyDamage?.([{ value: dano, type: ev.dt }]); }
    if (!ok && ev.estado) await a.toggleStatusEffect?.(ev.estado, { active: true }).catch(() => null);
    if (ok && antes.at(-1)) antes.at(-1).estado = null;
    filas.push(`${esc(a.name)}: ${r?.total ?? "?"} → ${ok ? "la pasa" : "falla"}${dano ? ` · ${dano} de daño` : ""}${!ok && ev.estado ? ` · ${esc(nombreEstado(ev.estado))}` : ""}`);
  }
  await msg.update({ [`flags.${MOD}.suceso.resuelto`]: true, [`flags.${MOD}.suceso.antes`]: antes,
    content: `${msg.content}<p class="ecos-suceso-res">${filas.join("<br>") || "Nadie a quien afectar."}</p><button type="button" data-ecos-suceso="deshacer" data-solo-dm><i class="fa-solid fa-rotate-left"></i> Deshacer</button>` });
}
async function deshacerSuceso(msg) {
  const s = msg.flags?.[MOD]?.suceso; if (!s?.antes || s.deshecho || !game.user.isGM) return;
  for (const x of s.antes) {
    const a = await fromUuid(x.uuid); if (!a) continue;
    if (x.hp) await a.update({ "system.attributes.hp.value": x.hp.value, "system.attributes.hp.temp": x.hp.temp });
    if (x.estado) await a.toggleStatusEffect?.(x.estado, { active: false }).catch(() => null);
  }
  await msg.update({ [`flags.${MOD}.suceso.deshecho`]: true, content: `${msg.content}<p><i>Deshecho.</i></p>` });
}

if (globalThis.Hooks) {
  Hooks.once("init", () => {
    game.settings.register(MOD, "asistenteCombate", { name: "Asistente al empezar un combate", hint: "Al empezar un combate: escenario, quién es aliado/neutral/hostil (todas las fichas del tablero), balance con aliados, consejos y sucesos del escenario por turno.", scope: "world", config: true, type: Boolean, default: true });
    game.settings.register(MOD, "etiquetarEscenas", { name: "Etiquetar cada escena nueva", hint: "Al crear una escena, pregunta qué escenario es (bosque, cueva, taberna…).", scope: "world", config: true, type: Boolean, default: true });
  });
  Hooks.on("combatStart", combat => { if (soyDM() && leer("asistenteCombate", true)) asistenteCombate(combat).catch(err => console.error(`${MOD} | asistente`, err)); });
  Hooks.on("createScene", (scene, _o, userId) => { if (userId === game.user.id && game.user.isGM && leer("etiquetarEscenas", true)) setTimeout(() => etiquetarEscena(scene).catch(() => null), 400); });
  // En cada turno: 1d20 contra el umbral; si sale, un suceso.
  Hooks.on("updateCombat", (combat, cambios) => {
    if (!soyDM() || !combat.started || !("turn" in cambios || "round" in cambios)) return;
    const cfg = combat.getFlag(MOD, "escenario"); const u = UMBRALES[cfg?.umbral]?.u ?? 99;
    if (!cfg || u > 20) return;
    const d = Math.ceil(Math.random() * 20);
    if (d >= u) sucesoAhora(combat).catch(err => console.error(`${MOD} | suceso`, err));
  });
  // Etiqueta en la configuración de la escena.
  Hooks.on("renderSceneConfig", (app, html) => {
    try {
      const raiz = html instanceof HTMLElement ? html : (html?.[0] ?? app.element);
      if (!game.user.isGM || raiz.querySelector?.(".ecos-escenario-campo")) return;
      const doc = app.document ?? app.object;
      const grupo = document.createElement("div");
      grupo.className = "form-group ecos-escenario-campo";
      grupo.innerHTML = `<label>Escenario (Ecos)</label><div class="form-fields"><select name="flags.${MOD}.escenario">${opcionesEscenario(escenarioDe(doc))}</select></div><p class="hint">Para el balance del encuentro y los sucesos del asistente de combate.</p>`;
      const ancla = raiz.querySelector('[name="name"]')?.closest(".form-group");
      if (ancla) ancla.after(grupo); else raiz.querySelector("form, .window-content")?.prepend(grupo);
    } catch { /* sin campo */ }
  });
  Hooks.on("renderChatMessageHTML", (msg, html) => {
    if (!html.querySelector?.("[data-ecos-suceso], [data-ecos-bandos-deshacer]")) return;
    if (!game.user.isGM) { for (const x of html.querySelectorAll("[data-solo-dm], [data-ecos-bandos-deshacer]")) x.remove(); return; }
    const s = msg.flags?.[MOD]?.suceso;
    if (s?.resuelto) html.querySelector('[data-ecos-suceso="resolver"]')?.remove();
    if (s?.deshecho) html.querySelector('[data-ecos-suceso="deshacer"]')?.remove();
    html.addEventListener("click", async ev => {
      const b = ev.target.closest("[data-ecos-suceso], [data-ecos-bandos-deshacer]"); if (!b) return;
      ev.preventDefault();
      try {
        if (b.dataset.ecosSuceso === "resolver") return await resolverSuceso(msg);
        if (b.dataset.ecosSuceso === "deshacer") return await deshacerSuceso(msg);
        if (b.dataset.ecosSuceso === "otro") return await sucesoAhora(game.combats.get(s?.combate) ?? game.combat, { forzado: true });
        if (b.dataset.ecosBandosDeshacer !== undefined) { const d = msg.flags?.[MOD]?.bandosAntes; const sc = game.scenes.get(d?.scene); if (sc) await sc.updateEmbeddedDocuments("Token", d.antes); b.disabled = true; }
      } catch (err) { console.error(`${MOD} | suceso`, err); }
    });
  });
  Hooks.once("ready", () => { const api = game.modules.get(MOD)?.api; if (api) api.escenario = { asistente: asistenteCombate, suceso: sucesoAhora, etiquetar: etiquetarEscena }; });
}
