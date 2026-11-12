/**
 * 3.38 · Fama y proezas (pedido del autor): tener el Verbe vale tanto que un usuario básico puede romper la primera
 * línea de un ejército. Quien los ve en acción corre la voz: cada proeza suma fama y, al cruzar un umbral, las facciones
 * se enteran y los quieren (para usarlos, comprarlos o aprender de ellos). El DM marca las proezas; el módulo suma
 * sola una pequeña cuando alguien gana un choque de técnicas a la vista.
 */
import { botonDeshacer } from "./deshacer.js";
const MOD = "ecos-frontera";
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
export const NIVELES_FAMA = [
  { min: 0, nombre: "Desconocido", texto: "Nadie sabe lo que puede hacer." },
  { min: 3, nombre: "Rumor", texto: "En las tabernas del valle se cuenta algo raro: alguien que hace cosas que no se pueden hacer." },
  { min: 6, nombre: "Conocido en el valle", texto: "Lo reconocen por la calle. Le piden ayuda, le temen o lo siguen. La red de Garrick abre un expediente." },
  { min: 10, nombre: "Nombre en la región", texto: "Las facciones mandan a alguien a verlo: el Imperio quiere reclutarlo, la Dinastía estudiarlo, los Juramentados del Hielo saber si es aliado." },
  { min: 15, nombre: "Leyenda", texto: "Su nombre cruza el mar. Lo buscan para usarlo, comprarlo o aprender de él, y hay quien lo quiere muerto o en una granja de la Colmena." }
];
export const PROEZAS = { pequena: [1, "Pequeña (una pelea ganada a la vista)"], notable: [2, "Notable (salvar a alguien, vencer a algo que nadie vence)"], enorme: [4, "Enorme (romper una línea, matar a un jefe, algo imposible)"] };
/** El nivel de fama de unos puntos. Puro. */
export const nivelFama = puntos => [...NIVELES_FAMA].reverse().find(n => (Number(puntos) || 0) >= n.min) ?? NIVELES_FAMA[0];
/** Puntos de una proeza: sin testigos vale la mitad (redondeando hacia abajo, mínimo 0). Puro. */
export const puntosProeza = (tipo, testigos = true) => { const p = PROEZAS[tipo]?.[0] ?? 0; return testigos ? p : Math.floor(p / 2); };

export async function sumarFama(actor, puntos, motivo = "") {
  if (!game.user.isGM || !actor || !puntos) return;
  if (!Number.isFinite(Number(puntos))) return;
  const antes = Number(actor.getFlag(MOD, "fama")) || 0, despues = Math.max(0, antes + Number(puntos));
  await actor.setFlag(MOD, "fama", despues);
  const n0 = nivelFama(antes), n1 = nivelFama(despues);
  // 3.42: con «Deshacer» al lado (regla del autor); el ajuste a mano está en Menú del DM → Proeza.
  await ChatMessage.create({ speaker: { alias: "Se corre la voz" }, content: `<p><b>${esc(actor.name)}</b>: ${puntos >= 0 ? "+" : ""}${puntos} de fama${motivo ? ` (${esc(motivo)})` : ""}. Ahora: <b>${n1.nombre}</b> (${despues}).</p>${botonDeshacer()}`,
    flags: { [MOD]: { deshacer: { cambios: [{ uuid: actor.uuid, antes: { [`flags.${MOD}.fama`]: antes || undefined } }], borrar: [] } } } });
  if (n1.min > n0.min) await ChatMessage.create({ whisper: game.users.filter(u => u.isGM).map(u => u.id), speaker: { alias: "Fama · solo DM" },
    content: `<p><b>${esc(actor.name)}</b> pasa a <b>${n1.nombre}</b>. ${esc(n1.texto)}</p><p class="ecos-nota">Buen momento para que una facción mueva ficha: alguien aparece en la posada preguntando por él.</p>` });
}
export async function marcarProeza() {
  if (!game.user.isGM) return;
  const pjs = game.actors.filter(a => a.type === "character" && a.hasPlayerOwner);
  const r = await foundry.applications.api.DialogV2.wait({ window: { title: "Proeza", icon: "fa-solid fa-bullhorn" }, position: { width: 440 },
    content: `<div class="ecos-dialogo"><p>¿Quién hizo algo que la gente va a contar?</p>${pjs.map(a => `<label class="ecos-check"><input type="checkbox" name="pj-${a.id}"> ${esc(a.name)} <small>(${nivelFama(a.getFlag(MOD, "fama")).nombre}, ${Number(a.getFlag(MOD, "fama")) || 0})</small></label>`).join("")}
      <label>Proeza <select name="tipo">${Object.entries(PROEZAS).map(([k, [p, t]]) => `<option value="${k}">+${p} · ${t}</option>`).join("")}</select></label>
      <label class="ecos-check"><input type="checkbox" name="testigos" checked> Hubo testigos (sin testigos vale la mitad)</label><label>O pon la fama exacta a mano <input type="number" name="exacta" min="0" placeholder="(vacío: sumar la proeza)"></label><label>Qué hizo <input name="motivo" placeholder="rompió la carga de los bandidos"></label>
      <details><summary>Niveles de fama</summary><ul>${NIVELES_FAMA.map(n => `<li><b>${n.min}+ · ${n.nombre}</b>: ${esc(n.texto)}</li>`).join("")}</ul></details></div>`,
    buttons: [{ action: "ok", label: "Que se corra la voz", default: true, callback: (_e, b) => Object.fromEntries(new FormData(b.form)) }, { action: "no", label: "Cancelar" }], rejectClose: false });
  if (!r || r === "no") return;
  if (r.exacta !== "" && r.exacta != null) {
    for (const a of pjs) if (r[`pj-${a.id}`]) { const antes = Number(a.getFlag(MOD, "fama")) || 0; await sumarFama(a, Math.max(0, Number(r.exacta)) - antes, r.motivo || "ajuste a mano del DM"); }
    return;
  }
  const p = puntosProeza(r.tipo, !!r.testigos);
  for (const a of pjs) if (r[`pj-${a.id}`]) await sumarFama(a, p, r.motivo);
}
if (globalThis.Hooks) {
  Hooks.once("ready", () => { const api = game.modules.get(MOD)?.api; if (api) { api.proeza = marcarProeza; api.sumarFama = sumarFama; } });
  // Ganar un choque de técnicas a la vista: +1 de fama, una vez por día de juego.
  Hooks.on("createChatMessage", msg => {
    if (!game.user.isGM || game.users.activeGM?.isSelf === false || !msg.getFlag(MOD, "choqueConsecuencias")) return;
    const m = String(msg.content ?? "").match(/<b>([^<]+)<\/b> gana el choque/);
    const a = m ? game.actors.find(x => x.type === "character" && x.hasPlayerOwner && x.name === m[1]) : null;
    if (!a) return;
    const dia = Math.floor((game.time?.worldTime ?? 0) / 86400);
    if (a.getFlag(MOD, "famaChoqueDia") === dia) return;
    a.setFlag(MOD, "famaChoqueDia", dia).then(() => sumarFama(a, 1, "ganó un choque de técnicas a la vista")).catch(() => null);
  });
}
