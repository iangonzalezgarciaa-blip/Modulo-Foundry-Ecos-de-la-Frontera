/**
 * 3.55 · Venenos por etapas (pedido del autor, 12-nov-2026: «D&D es muy malo en la mecánica de venenos»).
 * Las aflicciones de PF2e niveladas a D&D. Un veneno tiene CD (Constitución), a veces incubación, duración máxima y etapas;
 * cada etapa trae su texto, su intervalo, su daño (ya escalado a D&D) y sus estados de D&D.
 *  - Exposición: salvación de CON. Éxito: nada. Fallo: etapa 1. Fallo crítico (por 10 o un 1 natural): etapa 2.
 *  - Al final de cada intervalo, otra salvación: crítico −2 etapas, éxito −1, fallo +1, fallo crítico +2. Etapa 0: curado.
 *  - Exponerse otra vez al mismo veneno: fallo +1, fallo crítico +2; un éxito no cambia nada.
 *  - Termina al pasar la duración máxima.
 * Se usa desde el objeto (cabecera «Usar veneno»): untar un arma (el próximo golpe lo inyecta) o exponer a los objetivos.
 * Corre solo con el tiempo del mundo (en combate, 6 s por asalto). Los PNJ tiran solos si el DM quiere; los PJ con un botón.
 * Revertir: «Deshacer daño», «Bajar etapa» y «Curar» en el chat y en Menú del DM → «Venenos activos».
 * A mano (DM): «Superó» / «Falló» en vez de tirar, «Subir etapa», y exponer a cualquiera desde el mismo objeto.
 */
const MOD = "ecos-frontera";
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const lista = x => Array.from(x?.contents ?? x ?? []);

/* ---------------- Reglas puras ---------------- */
export const GRADOS = { critico: "Éxito crítico", exito: "Éxito", fallo: "Fallo", pifia: "Fallo crítico" };
/** Grado de una salvación: por 10 o más arriba o abajo de la CD; el 20 natural sube un grado y el 1 natural lo baja. Puro. */
export function gradoSalvacion(total, cd, natural = null) {
  const orden = ["pifia", "fallo", "exito", "critico"];
  let i = total >= cd + 10 ? 3 : total >= cd ? 2 : total <= cd - 10 ? 0 : 1;
  if (natural === 20) i = Math.min(3, i + 1); else if (natural === 1) i = Math.max(0, i - 1);
  return orden[i];
}
/** Etapa tras la primera exposición. Puro. */
export const etapaInicial = grado => (grado === "pifia" ? 2 : grado === "fallo" ? 1 : 0);
/** Etapa tras la salvación del intervalo (0 = curado; no pasa de la última). Puro. */
export function etapaSiguiente(etapa, grado, max) {
  const d = { critico: -2, exito: -1, fallo: 1, pifia: 2 }[grado] ?? 0;
  return Math.max(0, Math.min(Number(max) || 1, (Number(etapa) || 0) + d));
}
/** Otra exposición al mismo veneno mientras dura. Puro. */
export function etapaRepetida(etapa, grado, max) {
  const d = grado === "pifia" ? 2 : grado === "fallo" ? 1 : 0;
  return Math.max(1, Math.min(Number(max) || 1, (Number(etapa) || 1) + d));
}
const SEG = { round: 6, minute: 60, hour: 3600, day: 86400, week: 604800 };
const NOMBRE_U = { round: ["asalto", "asaltos"], minute: ["minuto", "minutos"], hour: ["hora", "horas"], day: ["día", "días"], week: ["semana", "semanas"] };
/** Segundos de una duración ({n: "1d4", u: "hour"}); `tirar` resuelve los dados (por defecto, su promedio). Puro. */
export function segundos(dur, tirar = null) {
  if (!dur?.u || !SEG[dur.u]) return null;
  const m = String(dur.n ?? "1").match(/^(\d+)d(\d+)$/);
  const n = m ? (tirar ? tirar(dur.n) : Math.round(Number(m[1]) * (Number(m[2]) + 1) / 2)) : Number(dur.n) || 1;
  return n * SEG[dur.u];
}
export const textoDuracion = dur => (dur?.u ? `${dur.n} ${NOMBRE_U[dur.u]?.[String(dur.n) === "1" ? 0 : 1] ?? dur.u}` : "—");
/** La etapa n de un veneno, o la última si se pasa. Puro. */
export const etapaDe = (v, n) => (v?.etapas ?? []).find(e => e.n === n) ?? (v?.etapas ?? []).at(-1) ?? null;
/** ¿El veneno se puede automatizar (tiene CD y etapas)? Puro. */
export const automatizable = v => !!(v?.cd && v?.etapas?.length);

/* ---------------- Foundry ---------------- */
const leer = (k, d) => { try { return game.settings.get(MOD, k); } catch { return d; } };
const soyDM = () => !!game.user?.isGM && (game.users?.activeGM ? game.users.activeGM.isSelf : true);
const ahora = () => Number(game.time?.worldTime) || 0;
const ESTADOS_OK = () => new Set((CONFIG.statusEffects ?? []).map(s => s.id));
const tieneJugador = actor => game.users.some(u => !u.isGM && actor?.testUserPermission?.(u, "OWNER"));
const destinatarios = actor => game.users.filter(u => u.isGM || actor?.testUserPermission?.(u, "OWNER")).map(u => u.id);
const efectosVeneno = actor => lista(actor?.effects).filter(e => e.flags?.[MOD]?.veneno);
const tirarDados = f => { try { return new Roll(String(f)).evaluateSync({ strict: false }).total; } catch { return 1; } };

function descripcionEfecto(v) {
  const e = etapaDe(v, v.etapa);
  return `<p><b>${esc(v.nombre)}</b> · ${v.incubando ? "incubando" : `etapa ${v.etapa} de ${v.max}`} · salvación de Constitución CD ${v.cd}.</p>
    ${e ? `<p>${esc(e.texto)}</p>` : ""}<p><em>Al final de cada intervalo se repite la salvación: éxito baja una etapa (crítico, dos), fallo sube una (fallo crítico, dos). Con 0 se cura.</em></p>`;
}
function datosEfecto(v) {
  const e = v.incubando ? null : etapaDe(v, v.etapa), ok = ESTADOS_OK();
  return { name: `Veneno: ${v.nombre}${v.incubando ? " (incubando)" : ` · etapa ${v.etapa}`}`, img: v.img || "icons/consumables/potions/bottle-round-corked-green.webp",
    statuses: (e?.estados ?? []).filter(s => ok.has(s) && s !== "exhaustion"), description: descripcionEfecto(v), flags: { [MOD]: { veneno: v } } };
}

/** Aplica el daño de la etapa (si tiene) y deja en el chat «Deshacer daño». */
async function danoEtapa(actor, v) {
  const e = etapaDe(v, v.etapa);
  if (!e?.dano?.length || leer("venenoDanoAuto", true) === false) return null;
  const partes = e.dano.map(d => ({ f: d.f, t: d.t || "", v: tirarDados(d.f) }));
  const hp = actor.system?.attributes?.hp; if (!hp) return null;
  const antes = { value: hp.value, temp: hp.temp ?? 0 };
  await actor.applyDamage(partes.map(p => ({ value: p.v, type: p.t || undefined })));
  const real = antes.value + antes.temp - ((actor.system.attributes.hp.value ?? 0) + (actor.system.attributes.hp.temp ?? 0));
  const tipos = { poison: "veneno", acid: "ácido", fire: "fuego", cold: "frío", lightning: "relámpago", thunder: "trueno", psychic: "psíquico", necrotic: "necrótico", radiant: "radiante", force: "fuerza" };
  await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), whisper: destinatarios(actor),
    content: `<section class="ecos-veneno-chat"><p><i class="fa-solid fa-skull-crossbones"></i> <b>${esc(actor.name)}</b>: ${partes.map(p => `${p.f} → ${p.v}${p.t ? ` de ${tipos[p.t] ?? p.t}` : ""}`).join(" + ")} (${esc(v.nombre)}, etapa ${v.etapa}). Pierde <b>${Math.max(0, real)}</b> PG.</p>
      <button type="button" data-ecos-veneno="deshacerDano" data-actor="${esc(actor.uuid)}" data-hp="${antes.value}" data-temp="${antes.temp}"><i class="fa-solid fa-rotate-left"></i> Deshacer daño</button></section>` });
  return real;
}

/** Pone o cambia la etapa del veneno en una criatura (crea, actualiza o quita el efecto). */
export async function ponerEtapa(actor, v, etapa, { motivo = "", aplicar = true } = {}) {
  const ef = efectosVeneno(actor).find(e => e.flags[MOD].veneno.id === v.id);
  if (etapa <= 0) {
    if (ef) await ef.delete();
    await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), whisper: destinatarios(actor), content: `<p class="ecos-veneno-chat"><i class="fa-solid fa-heart-pulse"></i> <b>${esc(actor.name)}</b> se libra de ${esc(v.nombre)}${motivo ? ` (${esc(motivo)})` : ""}.</p>` });
    return null;
  }
  const t = ahora(), e = etapaDe(v, etapa);
  const nuevo = { ...v, etapa: Math.min(etapa, v.max), incubando: false, pendiente: null, proxima: t + (segundos(e?.dur, tirarDados) ?? 60) };
  if (ef) await ef.update(datosEfecto(nuevo)); else await actor.createEmbeddedDocuments("ActiveEffect", [datosEfecto(nuevo)]);
  await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), whisper: destinatarios(actor),
    content: `<section class="ecos-veneno-chat"><p><i class="fa-solid fa-flask"></i> <b>${esc(actor.name)}</b> · ${esc(v.nombre)}: <b>etapa ${nuevo.etapa}</b>${motivo ? ` (${esc(motivo)})` : ""}. ${esc(e?.texto ?? "")}</p>
      <p><small>Próxima salvación (CON CD ${v.cd}) en ${textoDuracion(e?.dur)}.</small></p>${botonesDM(actor, v)}</section>` });
  if (aplicar) await danoEtapa(actor, nuevo);
  return nuevo;
}
const botonesDM = (actor, v) => `<div class="ecos-veneno-dm" data-solo-dm><button type="button" data-ecos-veneno="bajar" data-actor="${esc(actor.uuid)}" data-id="${esc(v.id)}">Bajar etapa</button>
  <button type="button" data-ecos-veneno="subir" data-actor="${esc(actor.uuid)}" data-id="${esc(v.id)}">Subir etapa</button>
  <button type="button" data-ecos-veneno="curar" data-actor="${esc(actor.uuid)}" data-id="${esc(v.id)}">Curar</button></div>`;

/** Datos del veneno a partir de un objeto (las banderas de PF2e, o los mínimos que el DM escriba). */
export function venenoDeObjeto(item) {
  const f = item?.flags?.[MOD]?.pf2e?.veneno;
  if (!automatizable(f)) return null;
  return { id: item.flags[MOD].pf2e.id ?? item.id, nombre: item.name, img: item.img, cd: Number(f.cd), etapas: f.etapas, max: Math.max(...f.etapas.map(e => e.n)),
    inicio: f.inicio ?? null, duracionMax: f.duracionMax ?? null };
}

/** Pide la salvación: un mensaje con «Tirar» (dueño o DM) y «Superó/Falló» (DM). Los PNJ pueden tirar solos. */
export async function pedirSalvacion(actor, v, tipo, extra = {}) {
  const msg = await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), whisper: destinatarios(actor),
    flags: { [MOD]: { venenoPedido: { actor: actor.uuid, v, tipo, ...extra } } },
    content: `<section class="ecos-veneno-chat"><p><i class="fa-solid fa-flask-vial"></i> <b>${esc(actor.name)}</b> · ${esc(v.nombre)}: salvación de <b>Constitución CD ${v.cd}</b> ${tipo === "intervalo" ? `(etapa ${v.etapa})` : "(exposición)"}.</p>
      <div class="ecos-veneno-botones"><button type="button" data-ecos-veneno="tirar"><i class="fa-solid fa-dice-d20"></i> Tirar</button>
      <span data-solo-dm><button type="button" data-ecos-veneno="grado" data-grado="exito">Superó</button><button type="button" data-ecos-veneno="grado" data-grado="fallo">Falló</button><button type="button" data-ecos-veneno="grado" data-grado="pifia">Fallo crítico</button></span></div></section>` });
  if (soyDM() && !tieneJugador(actor) && leer("venenoTiradaAuto", true) !== false) await tirarPedido(msg);
  return msg;
}
async function tirarPedido(msg) {
  const p = msg?.flags?.[MOD]?.venenoPedido; if (!p || p.resuelto) return;
  const actor = await fromUuid(p.actor); if (!actor?.isOwner) return ui.notifications.warn("Solo el dueño de la ficha o el DM.");
  const rolls = await actor.rollSavingThrow({ ability: "con", target: p.v.cd }, { configure: false }, { data: { flavor: `${p.v.nombre} (CD ${p.v.cd})` } }).catch(() => null);
  const r = Array.isArray(rolls) ? rolls[0] : rolls; if (!r) return;
  const natural = r.dice?.[0]?.results?.find(x => x.active !== false)?.result ?? null;
  const grado = gradoSalvacion(r.total, p.v.cd, natural);
  if (game.user.isGM) return resolverPedido(msg, grado, r.total);
  game.socket.emit(`module.${MOD}`, { venenoResultado: { msg: msg.id, grado, total: r.total } });
}
/** El DM aplica el resultado de una salvación pedida (una sola vez por mensaje). */
export async function resolverPedido(msg, grado, total = null) {
  const p = msg?.flags?.[MOD]?.venenoPedido; if (!p || p.resuelto || !game.user.isGM) return;
  await msg.update({ [`flags.${MOD}.venenoPedido.resuelto`]: grado, content: `${msg.content}<p class="ecos-veneno-res"><b>${GRADOS[grado]}</b>${total != null ? ` (${total})` : ""}.</p>` });
  const actor = await fromUuid(p.actor); if (!actor) return;
  const ef = efectosVeneno(actor).find(e => e.flags[MOD].veneno.id === p.v.id), actual = ef?.flags[MOD].veneno;
  if (p.tipo === "exposicion") {
    if (actual) {
      const n = etapaRepetida(actual.etapa, grado, actual.max);
      if (n !== actual.etapa) await ponerEtapa(actor, actual, n, { motivo: "otra dosis" });
      return;
    }
    const n = etapaInicial(grado);
    if (!n) return ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), whisper: destinatarios(actor), content: `<p class="ecos-veneno-chat"><b>${esc(actor.name)}</b> resiste ${esc(p.v.nombre)}.</p>` });
    const t = ahora(), fin = segundos(p.v.duracionMax, tirarDados);
    const v = { ...p.v, etapa: n, inicioEn: t, fin: fin ? t + fin : null };
    if (p.v.inicio) {
      const inc = { ...v, incubando: true, pendiente: null, proxima: t + (segundos(p.v.inicio, tirarDados) ?? 60) };
      await actor.createEmbeddedDocuments("ActiveEffect", [datosEfecto(inc)]);
      return ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), whisper: game.users.filter(u => u.isGM).map(u => u.id),
        content: `<section class="ecos-veneno-chat"><p><b>${esc(actor.name)}</b> fue envenenado con ${esc(p.v.nombre)}: hará efecto en ${textoDuracion(p.v.inicio)} (etapa ${n}).</p>${botonesDM(actor, inc)}</section>` });
    }
    return ponerEtapa(actor, v, n, { motivo: GRADOS[grado].toLowerCase() });
  }
  if (!actual) return;
  return ponerEtapa(actor, actual, etapaSiguiente(actual.etapa, grado, actual.max), { motivo: GRADOS[grado].toLowerCase() });
}

/** Exponer a una criatura (dosis, golpe con arma untada, nube, bebida). */
export async function exponer(actor, v) {
  if (!actor || !automatizable(v)) return null;
  if (!game.user.isGM) { game.socket.emit(`module.${MOD}`, { venenoExponer: { actor: actor.uuid, v } }); return null; }
  return pedirSalvacion(actor, v, "exposicion");
}

/** El paso del tiempo: incubación, salvaciones de intervalo y duración máxima. Solo el DM activo. */
export async function revisarVenenos() {
  if (!soyDM() || leer("venenosEtapas", true) === false) return;
  const t = ahora(), vistos = new Set(), actores = [...lista(game.actors), ...lista(canvas?.scene?.tokens).map(x => x.actor).filter(Boolean)];
  for (const actor of actores) {
    if (!actor || vistos.has(actor.uuid)) continue; vistos.add(actor.uuid);
    for (const ef of efectosVeneno(actor)) {
      const v = ef.flags[MOD].veneno;
      if (v.fin && t >= v.fin) { await ponerEtapa(actor, v, 0, { motivo: "pasó su duración" }); continue; }
      if (!v.proxima || t < v.proxima || v.pendiente) continue;
      if (v.incubando) { await ponerEtapa(actor, { ...v, incubando: false }, v.etapa, { motivo: "hace efecto" }); continue; }
      await ef.update({ [`flags.${MOD}.veneno.pendiente`]: t });
      await pedirSalvacion(actor, { ...v, pendiente: t }, "intervalo");
    }
  }
}

/** Usar un veneno desde su objeto: untar un arma o exponer a los objetivos marcados. */
export async function usarVeneno(item) {
  const v = venenoDeObjeto(item), actor = item?.actor;
  if (!v) return ui.notifications.warn("Este veneno no tiene etapas que el módulo pueda llevar: úsalo a mano.");
  const armas = lista(actor?.items).filter(i => i.type === "weapon");
  const objetivos = [...(game.user.targets ?? [])].map(t => t.actor).filter(Boolean);
  const via = item.system?.type?.subtype;
  const VIA = { injury: "herida (en un arma)", contact: "contacto", ingested: "ingerido", inhaled: "inhalado" };
  const r = await foundry.applications.api.DialogV2.wait({ window: { title: `Usar veneno · ${item.name}` }, position: { width: 460 },
    content: `<p><b>${esc(item.name)}</b> · ${esc(VIA[via] ?? "veneno")} · CD ${v.cd}${v.inicio ? ` · incubación ${textoDuracion(v.inicio)}` : ""}${v.duracionMax ? ` · dura hasta ${textoDuracion(v.duracionMax)}` : ""}.</p>
      ${armas.length ? `<p>Untar un arma (el próximo golpe que haga daño lo inyecta; dura 10 minutos):</p><select name="arma"><option value="">—</option>${armas.map(a => `<option value="${a.id}">${esc(a.name)}</option>`).join("")}</select>` : ""}
      <p>O exponer a ${objetivos.length ? `los objetivos marcados: <b>${objetivos.map(a => esc(a.name)).join(", ")}</b>` : "tus objetivos (marca primero con T)"}.</p>
      <label class="ecos-check"><input type="checkbox" name="gastar" checked> Gastar una dosis</label>`,
    buttons: [{ action: "untar", label: "Untar el arma", icon: "fa-solid fa-droplet", callback: (_e, b) => ({ a: "untar", arma: b.form.elements.arma?.value, gastar: b.form.elements.gastar.checked }) },
      { action: "exponer", label: "Exponer a los objetivos", icon: "fa-solid fa-flask-vial", default: true, callback: (_e, b) => ({ a: "exponer", gastar: b.form.elements.gastar.checked }) },
      { action: "no", label: "Cancelar" }], rejectClose: false });
  if (!r || r === "no") return;
  if (r.a === "untar") {
    const arma = actor.items.get(r.arma); if (!arma) return ui.notifications.warn("Elige un arma.");
    await arma.setFlag(MOD, "venenoUntado", { v, hasta: ahora() + 600 });
    ui.notifications.info(`${arma.name}: untada con ${item.name}.`);
  } else {
    if (!objetivos.length) return ui.notifications.warn("Marca primero a quién expones (tecla T sobre su ficha).");
    for (const a of objetivos) await exponer(a, v);
  }
  if (r.gastar) { const q = Number(item.system?.quantity) || 1; if (q > 1) await item.update({ "system.quantity": q - 1 }); else await item.delete(); }
}

/** Panel del DM: venenos activos en la escena y en el mundo, con subir, bajar, curar y forzar la salvación. */
export async function panelVenenos() {
  if (!game.user.isGM) return;
  const filas = [];
  const vistos = new Set();
  for (const actor of [...lista(game.actors), ...lista(canvas?.scene?.tokens).map(x => x.actor)]) {
    if (!actor || vistos.has(actor.uuid)) continue; vistos.add(actor.uuid);
    for (const ef of efectosVeneno(actor)) { const v = ef.flags[MOD].veneno; filas.push(`<tr><td>${esc(actor.name)}</td><td>${esc(v.nombre)}</td><td>${v.incubando ? "incubando" : `${v.etapa}/${v.max}`}</td><td>${botonesDM(actor, v)}</td></tr>`); }
  }
  await foundry.applications.api.DialogV2.wait({ window: { title: "Venenos activos", icon: "fa-solid fa-skull-crossbones" }, position: { width: 640 },
    content: filas.length ? `<table class="ecos-tabla"><thead><tr><th>Quién</th><th>Veneno</th><th>Etapa</th><th></th></tr></thead><tbody>${filas.join("")}</tbody></table>` : "<p>Nadie está envenenado.</p>",
    buttons: [{ action: "ok", label: "Cerrar", default: true }], rejectClose: false,
    render: (_e, dlg) => dlg.element?.addEventListener("click", ev => clicVeneno(ev, null)) });
}

async function clicVeneno(ev, msg) {
  const b = ev.target.closest("[data-ecos-veneno]"); if (!b) return;
  ev.preventDefault(); ev.stopPropagation();
  const accion = b.dataset.ecosVeneno;
  if (accion === "tirar") return tirarPedido(msg);
  if (accion === "grado") { if (game.user.isGM) return resolverPedido(msg, b.dataset.grado); return; }
  if (accion === "deshacerDano") {
    const a = await fromUuid(b.dataset.actor); if (!a?.isOwner) return;
    await a.update({ "system.attributes.hp.value": Number(b.dataset.hp), "system.attributes.hp.temp": Number(b.dataset.temp) });
    b.disabled = true; return ui.notifications.info(`${a.name}: daño del veneno deshecho.`);
  }
  if (!game.user.isGM) return;
  const a = await fromUuid(b.dataset.actor), ef = efectosVeneno(a).find(e => e.flags[MOD].veneno.id === b.dataset.id);
  if (!ef) return ui.notifications.info("Ese veneno ya no está.");
  const v = ef.flags[MOD].veneno;
  if (accion === "curar") return ponerEtapa(a, v, 0, { motivo: "el DM" });
  if (accion === "bajar") return ponerEtapa(a, v, v.etapa - 1, { motivo: "el DM", aplicar: false });
  if (accion === "subir") return ponerEtapa(a, v, Math.min(v.max, v.etapa + 1), { motivo: "el DM" });
}

/** Guía para los jugadores. Pura. */
export function guiaVenenosHTML() {
  return `<h2>Venenos por etapas</h2>
<p>Los venenos (y algunas drogas) avanzan por <b>etapas</b>. Cada etapa dice qué te hace y cada cuánto vuelves a tirar.</p>
<ol><li><b>Exposición</b>: salvación de Constitución contra la CD del veneno. Éxito: nada. Fallo: etapa 1. Fallo crítico (fallar por 10 o más, o un 1 natural): etapa 2. Algunos tardan en hacer efecto (<i>incubación</i>).</li>
<li><b>Cada intervalo</b> (lo dice la etapa: un asalto, un minuto, una hora…): otra salvación. Éxito: bajas una etapa (éxito crítico —por 10 o más, o un 20 natural—: dos). Fallo: subes una (fallo crítico: dos). En la última etapa, fallar repite sus efectos.</li>
<li><b>Etapa 0</b>: estás curado. También se acaba al pasar su <b>duración máxima</b>.</li>
<li>Otra dosis del mismo veneno mientras te dura: si fallas, subes una etapa (dos con fallo crítico).</li></ol>
<p><b>Cómo se usa</b>: en la hoja del veneno, botón <i class="fa-solid fa-flask-vial"></i> <b>Usar veneno</b>: untar un arma (el próximo golpe que haga daño lo inyecta; dura 10 minutos) o exponer a los objetivos marcados. El daño de cada etapa ya está nivelado a D&amp;D y se aplica solo; el chat deja «Deshacer daño». Los estados (Envenenado, Inconsciente, Asustado…) se ponen y se quitan con la etapa.</p>
<p><em>El DM puede subir, bajar o curar cualquier veneno, y decidir «Superó/Falló» sin tirar.</em></p>`;
}

if (globalThis.Hooks) {
  Hooks.once("init", () => {
    game.settings.register(MOD, "venenosEtapas", { name: "Venenos por etapas", hint: "Los venenos de PF2e avanzan solos con el tiempo del mundo: incubación, salvación en cada intervalo, daño y estados por etapa.", scope: "world", config: true, type: Boolean, default: true });
    game.settings.register(MOD, "venenoTiradaAuto", { name: "Los PNJ tiran solos contra venenos", hint: "Si está apagado, el DM tira o decide a mano también por los PNJ.", scope: "world", config: true, type: Boolean, default: true });
    game.settings.register(MOD, "venenoDanoAuto", { name: "Daño de veneno automático", hint: "El daño de cada etapa se tira y se aplica solo (con «Deshacer daño» en el chat).", scope: "world", config: true, type: Boolean, default: true });
  });
  Hooks.on("updateWorldTime", () => { revisarVenenos().catch(err => console.error(`${MOD} | venenos`, err)); });
  Hooks.on("dnd5e.rollDamageV2", (_rolls, data) => {
    const arma = data?.subject?.item; const u = arma?.flags?.[MOD]?.venenoUntado;
    if (!u || !arma.isOwner) return;
    arma.unsetFlag(MOD, "venenoUntado");
    if (ahora() > (u.hasta ?? 0)) return ui.notifications.info(`El veneno de ${arma.name} ya se secó.`);
    const blancos = [...(game.user.targets ?? [])].map(t => t.actor).filter(Boolean);
    if (!blancos.length) return ui.notifications.warn(`${arma.name}: el veneno se gastó, pero no había objetivo marcado.`);
    for (const a of blancos) exponer(a, u.v).catch(err => console.error(`${MOD} | veneno`, err));
  });
  Hooks.on("renderChatMessageHTML", (msg, html) => {
    if (!html.querySelector?.("[data-ecos-veneno]")) return;
    if (!game.user.isGM) for (const x of html.querySelectorAll("[data-solo-dm]")) x.remove();
    if (msg.flags?.[MOD]?.venenoPedido?.resuelto) for (const x of html.querySelectorAll(".ecos-veneno-botones")) x.remove();
    html.addEventListener("click", ev => clicVeneno(ev, msg).catch(err => console.error(`${MOD} | veneno`, err)));
  });
  const boton = app => {
    const item = app?.document ?? app?.item;
    if (!(item instanceof Item) || !item.isOwner || !item.actor || !venenoDeObjeto(item)) return;
    const cab = app.element?.querySelector?.(".window-header");
    if (!cab || cab.querySelector(".ecos-usar-veneno")) return;
    const b = document.createElement("button");
    b.type = "button"; b.className = "header-control ecos-usar-veneno"; b.innerHTML = '<i class="fa-solid fa-flask-vial"></i> Usar veneno';
    b.addEventListener("click", ev => { ev.preventDefault(); usarVeneno(item).catch(err => console.error(`${MOD} | veneno`, err)); });
    cab.querySelector('[data-action="close"], .close')?.before(b);
  };
  Hooks.on("renderItemSheetV2", boton);
  Hooks.on("renderItemSheet", boton);
  Hooks.once("ready", () => {
    game.socket.on(`module.${MOD}`, async d => {
      if (!soyDM()) return;
      if (d?.venenoResultado) { const m = game.messages.get(d.venenoResultado.msg); if (m) resolverPedido(m, d.venenoResultado.grado, d.venenoResultado.total).catch(console.error); }
      if (d?.venenoExponer) { const a = await fromUuid(d.venenoExponer.actor); if (a) exponer(a, d.venenoExponer.v).catch(console.error); }
    });
    const api = game.modules.get(MOD)?.api; if (api) api.venenos = { usar: usarVeneno, exponer, panel: panelVenenos, revisar: revisarVenenos, ponerEtapa };
  });
}
