/**
 * 3.42 · Suceso del día automático (aprobado por el autor, 11-nov-2026). Al empezar cada día de campaña, el módulo tira
 * la tabla de sucesos de la estación y se lo susurra al DM. Regla del autor para todo el módulo: lo automático trae al
 * lado un botón para revertirlo y otro para asignarlo a mano. Aquí: «Otro», «Elegir a mano», «Deshacer» y «Contar a
 * la mesa». Las tablas no están en el código (son de la campaña): las lee de la bandera `sucesosDia` de un diario.
 */
const MOD = "ecos-frontera";
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
export const NOMBRE_ESTACION = { primavera: "Primavera", verano: "Verano", otono: "Otoño", invierno: "Invierno" };

/** El suceso de una tirada (1..n) en una lista. Puro. */
export function sucesoDe(lista, tirada) {
  const l = Array.isArray(lista) ? lista : [];
  if (!l.length) return null;
  const i = Math.min(l.length, Math.max(1, Math.trunc(Number(tirada) || 1))) - 1;
  return { indice: i, texto: l[i] };
}
/** El estado nuevo al registrar, deshacer o cambiar un suceso. Guarda el historial para poder volver. Puro. */
export function registrar(estado, cambio) {
  const e = { historial: [], ...(estado ?? {}) };
  const previo = e.texto != null ? { dia: e.dia, indice: e.indice, texto: e.texto, anulado: !!e.anulado } : null;
  if (cambio?.op === "deshacer") return { ...e, anulado: true, historial: previo ? [...e.historial, previo].slice(-20) : e.historial };
  if (cambio?.op === "volver") { const h = [...e.historial]; const p = h.pop(); return p ? { ...e, ...p, historial: h } : e; }
  return { ...e, dia: cambio.dia ?? e.dia, estacion: cambio.estacion ?? e.estacion, indice: cambio.indice, texto: cambio.texto, anulado: false, manual: !!cambio.manual, publico: null,
    historial: previo ? [...e.historial, previo].slice(-20) : e.historial };
}

/* ---------------- Foundry ---------------- */
const tablas = () => game.journal?.find(j => j.getFlag(MOD, "sucesosDia"))?.getFlag(MOD, "sucesosDia") ?? null;
const leer = () => { try { return game.settings.get(MOD, "sucesoDiaEstado") ?? {}; } catch { return {}; } };
const guardar = e => game.settings.set(MOD, "sucesoDiaEstado", e);
const gms = () => game.users.filter(u => u.isGM).map(u => u.id);
function tarjeta(e) {
  const est = NOMBRE_ESTACION[e.estacion] ?? e.estacion ?? "";
  return `<div class="ecos-suceso"><p><b>Suceso del día${e.dia != null ? ` ${e.dia}` : ""}</b> · ${esc(est)}${e.manual ? " · elegido a mano" : ""}</p>
    <p class="${e.anulado ? "ecos-tachado" : ""}">${e.indice != null ? `${e.indice + 1}. ` : ""}${esc(e.texto ?? "—")}</p>${e.anulado ? "<p><i>Deshecho: hoy no pasa.</i></p>" : ""}
    <div class="ecos-botones-fila"><button type="button" data-suceso="otro"><i class="fa-solid fa-dice"></i> Otro</button><button type="button" data-suceso="mano"><i class="fa-solid fa-hand-pointer"></i> Elegir a mano</button>
    <button type="button" data-suceso="deshacer"><i class="fa-solid fa-rotate-left"></i> Deshacer</button><button type="button" data-suceso="volver"><i class="fa-solid fa-clock-rotate-left"></i> Volver al anterior</button>
    <button type="button" data-suceso="contar"><i class="fa-solid fa-bullhorn"></i> Contar a la mesa</button></div></div>`;
}
async function publicar(e) {
  const m = await ChatMessage.create({ whisper: gms(), speaker: { alias: "Suceso del día (solo DM)" }, content: tarjeta(e), flags: { [MOD]: { sucesoDia: true } } });
  return m;
}
export async function tirarSuceso({ dia = null, estacion = null, mano = null } = {}) {
  if (!game.user.isGM) return null;
  const T = tablas();
  const est = estacion ?? leer().estacion ?? globalThis.game?.modules?.get(MOD)?.api?.estacion?.() ?? "primavera";
  const lista = T?.[est];
  if (!lista?.length) { ui.notifications.warn("Faltan las tablas de sucesos en el mundo (bandera sucesosDia de un diario)."); return null; }
  const s = mano != null ? sucesoDe(lista, Number(mano) + 1) : sucesoDe(lista, (await new Roll(`1d${lista.length}`).evaluate()).total);
  const e = registrar(leer(), { dia: dia ?? leer().dia, estacion: est, indice: s.indice, texto: s.texto, manual: mano != null });
  await guardar(e); await publicar(e);
  return e;
}
async function elegirAMano() {
  const e = leer(), est = e.estacion ?? "primavera", T = tablas();
  const opts = Object.keys(NOMBRE_ESTACION).map(k => `<optgroup label="${NOMBRE_ESTACION[k]}">${(T?.[k] ?? []).map((t, i) => `<option value="${k}|${i}" ${k === est && i === e.indice ? "selected" : ""}>${i + 1}. ${esc(t)}</option>`).join("")}</optgroup>`).join("");
  const r = await foundry.applications.api.DialogV2.wait({ window: { title: "Suceso del día · elegir a mano" }, position: { width: 560 },
    content: `<div class="ecos-dialogo"><label>Suceso <select name="s">${opts}</select></label><label>O escribe el tuyo <input name="propio" placeholder="(opcional)"></label></div>`,
    buttons: [{ action: "ok", label: "Usar este", default: true, callback: (_e, b) => Object.fromEntries(new FormData(b.form)) }, { action: "no", label: "Cancelar" }], rejectClose: false });
  if (!r || r === "no") return;
  if (r.propio?.trim()) { const n = registrar(leer(), { estacion: est, indice: null, texto: r.propio.trim(), manual: true }); await guardar(n); return publicar(n); }
  const [k, i] = String(r.s).split("|");
  return tirarSuceso({ estacion: k, mano: Number(i) });
}
async function accion(op, msg) {
  if (!game.user.isGM) return;
  const e = leer();
  if (op === "otro") return tirarSuceso({ estacion: e.estacion });
  if (op === "mano") return elegirAMano();
  if (op === "deshacer" || op === "volver") {
    const n = registrar(e, { op });
    if (op === "deshacer" && e.publico) await game.messages.get(e.publico)?.delete().catch(() => null);
    await guardar(n);
    return msg?.update({ content: tarjeta(n) });
  }
  if (op === "contar" && e.texto && !e.anulado) {
    const m = await ChatMessage.create({ speaker: { alias: "Arcegris" }, content: `<p>${esc(e.texto)}</p>` });
    await guardar({ ...e, publico: m.id });
  }
}
export async function abrirSucesos() {
  if (!game.user.isGM) return;
  const e = leer();
  const r = await foundry.applications.api.DialogV2.wait({ window: { title: "Suceso del día", icon: "fa-solid fa-calendar-day" }, position: { width: 520 },
    content: `<div class="ecos-dialogo"><p>Hoy: ${e.texto ? `${e.anulado ? "<s>" : ""}${esc(e.texto)}${e.anulado ? "</s> (deshecho)" : ""}` : "todavía nada"}.</p>
      <label class="ecos-check"><input type="checkbox" name="auto" ${game.settings.get(MOD, "sucesoDiaAuto") ? "checked" : ""}> Tirarlo solo al empezar cada día</label>
      <p class="ecos-nota">Cada suceso te llega en un susurro con botones para otro, elegir a mano, deshacer, volver al anterior y contarlo a la mesa.</p></div>`,
    buttons: [{ action: "tirar", label: "Tirar ahora", icon: "fa-solid fa-dice", callback: (_e, b) => ({ op: "tirar", auto: b.form.elements.auto.checked }) },
      { action: "mano", label: "Elegir a mano", icon: "fa-solid fa-hand-pointer", callback: (_e, b) => ({ op: "mano", auto: b.form.elements.auto.checked }) },
      { action: "deshacer", label: "Deshacer el de hoy", icon: "fa-solid fa-rotate-left", callback: (_e, b) => ({ op: "deshacer", auto: b.form.elements.auto.checked }) },
      { action: "ok", label: "Guardar", default: true, callback: (_e, b) => ({ op: "ok", auto: b.form.elements.auto.checked }) }], rejectClose: false });
  if (!r || typeof r !== "object") return;
  await game.settings.set(MOD, "sucesoDiaAuto", !!r.auto);
  if (r.op === "tirar") await tirarSuceso();
  else if (r.op === "mano") await elegirAMano();
  else if (r.op === "deshacer") await accion("deshacer");
}
if (globalThis.Hooks) {
  Hooks.once("init", () => {
    game.settings.register(MOD, "sucesoDiaAuto", { name: "Suceso del día automático", hint: "Al empezar cada día de campaña, tira la tabla de sucesos de la estación y te la susurra (con botones para deshacer o elegir a mano).", scope: "world", config: true, type: Boolean, default: true });
    game.settings.register(MOD, "sucesoDiaEstado", { scope: "world", config: false, type: Object, default: {} });
  });
  Hooks.once("ready", () => { const api = game.modules.get(MOD)?.api; if (api) { api.sucesoDia = abrirSucesos; api.tirarSuceso = tirarSuceso; } });
  Hooks.on("ecosNuevoDia", ({ n, estacion } = {}) => {
    if (!game.user.isGM || game.users.activeGM?.isSelf === false || !game.settings.get(MOD, "sucesoDiaAuto") || !tablas()) return;
    tirarSuceso({ dia: n, estacion }).catch(err => console.error(`${MOD} | suceso del día`, err));
  });
  Hooks.on("renderChatMessageHTML", (msg, html) => {
    if (!msg.getFlag?.(MOD, "sucesoDia")) return;
    html.querySelectorAll?.("[data-suceso]").forEach(b => {
      if (!game.user.isGM) return b.remove();
      b.addEventListener("click", ev => { ev.preventDefault(); accion(b.dataset.suceso, msg).catch(err => console.error(`${MOD} | suceso`, err)); });
    });
  });
}
