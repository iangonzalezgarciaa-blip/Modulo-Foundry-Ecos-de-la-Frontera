/**
 * 3.41 · Capas del Abismo (pedido del autor): un botón del DM para poner en qué capa está la escena, cruzar umbrales
 * hacia afuera con su cobro (la salvación de cada capa, el Agotamiento, el daño, los estados y lo que se pierde) y la
 * llamada del amanecer en las capas hondas. El motor es genérico: los nombres, las CD y los cobros de cada capa NO
 * están en el código (el repositorio es público); los lee de la bandera `capasAbismo` de un diario del mundo, que
 * carga el DM. Sin esos datos, el botón lo dice y no cobra nada.
 */
import { LINAJE_BARRERA } from "./sangre-sosten.js";
const MOD = "ecos-frontera";
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

/** Los umbrales que se pagan al subir de `desde` a `hasta` (0 = tierra protegida): uno por capa que se deja. Puro. */
export function pasosResaca(desde, hasta) {
  const d = Math.trunc(Number(desde) || 0), h = Math.max(0, Math.trunc(Number(hasta) || 0)), out = [];
  for (let n = d; n > h; n--) out.push(n);
  return out;
}
/**
 * La capa que cobra de verdad al dejar `n`: por un Camino no se paga; dormir cobra como una más honda; el cristal mudo
 * cobra como una menos honda, pero de la 5 hacia adentro solo baja el daño a la mitad. Puro.
 */
export function capaQueCobra(n, { durmio = false, cristal = false, camino = false } = {}, maxCapa = 7) {
  if (camino) return null;
  let c = Math.trunc(Number(n) || 0) + (durmio ? 1 : 0), mitad = false;
  if (cristal) { if (Number(n) >= 5) mitad = true; else c -= 1; }
  if (c <= 0) return null;
  return { capa: Math.min(c, maxCapa), mitad };
}
/** Lo que cobra una capa según el resultado. `datos` es la fila de la tabla del mundo. Puro. */
export function cobro(datos, exito, { mitad = false } = {}) {
  if (!datos) return null;
  if (datos.muerte) return { muerte: true, agot: 0, dano: null, tipo: null, envenenado: null, mitadDano: false, nota: datos.notaMuerte ?? "" };
  const r = exito ? (datos.supera ?? {}) : (datos.falla ?? {});
  return { muerte: false, sonado: !exito && !!datos.sonado, agot: Number(r.agot) || 0, dano: r.dano ?? null, tipo: r.tipo ?? null,
    mitadDano: !!r.mitad || mitad, envenenado: r.envenenado ?? null, nota: r.nota ?? "" };
}
/** CD de la llamada del amanecer en una capa (null si la capa no llama). Puro. */
export const cdLlamada = (capa, llamada = { desde: 3, base: 10 }) => Number(capa) >= Number(llamada?.desde ?? 3) ? Number(llamada?.base ?? 10) + Number(capa) : null;

/* ---------------- Foundry ---------------- */
const tabla = () => game.journal?.find(j => j.getFlag(MOD, "capasAbismo"))?.getFlag(MOD, "capasAbismo") ?? null;
const capaDe = n => tabla()?.capas?.find(c => Number(c.n) === Number(n)) ?? null;
const nombreCapa = n => Number(n) === 0 ? "Tierra protegida" : (capaDe(n) ? `Capa ${n} · ${capaDe(n).nombre}` : `Capa ${n}`);
const esPortador = a => a?.getFlag?.(MOD, "verbe")?.linaje === LINAJE_BARRERA;
const susurroDM = (titulo, html) => ChatMessage.create({ whisper: game.users.filter(u => u.isGM).map(u => u.id), speaker: { alias: titulo }, content: html });
const pjsEscena = () => (canvas?.scene?.tokens ?? []).map(t => t.actor).filter(a => a?.type === "character" && a.hasPlayerOwner);

async function aplicarCobro(actor, c) {
  const partes = [];
  if (c.agot) {
    const ex = Math.min(6, (Number(actor.system?.attributes?.exhaustion) || 0) + c.agot);
    await actor.update({ "system.attributes.exhaustion": ex });
    partes.push(`+${c.agot} Agotamiento (queda en ${ex})`);
  }
  if (c.dano) {
    const r = await new Roll(String(c.dano)).evaluate();
    const v = c.mitadDano ? Math.floor(r.total / 2) : r.total;
    await actor.applyDamage([{ value: v, type: c.tipo ?? undefined }]);
    partes.push(`${v} de daño ${c.tipo ?? ""}${c.mitadDano ? " (mitad)" : ""}`);
  }
  if (c.envenenado) { await actor.toggleStatusEffect("poisoned", { active: true }).catch(() => null); partes.push(`Envenenado ${c.envenenado}`); }
  return partes;
}

/** Cruza umbrales hacia afuera: pide las opciones de cada PJ y cobra capa por capa. */
export async function cruzarHaciaAfuera() {
  if (!game.user.isGM) return;
  const T = tabla();
  if (!T?.capas?.length) return ui.notifications.warn("Faltan los datos de las capas en el mundo (bandera capasAbismo de un diario). Pídeselos a tu DM de confianza o corre la macro de carga.");
  const actual = Number(canvas?.scene?.getFlag(MOD, "capaAbismo")) || 0;
  const pjs = pjsEscena();
  if (!pjs.length) return ui.notifications.warn("No hay fichas de PJ en esta escena.");
  const filas = pjs.map(a => `<tr><td><label><input type="checkbox" name="usa-${a.id}" checked> ${esc(a.name)}</label></td>
    <td><input type="checkbox" name="durmio-${a.id}"></td><td><input type="checkbox" name="largo-${a.id}"></td><td><input type="checkbox" name="cristal-${a.id}"></td>
    <td><input type="checkbox" name="camino-${a.id}"></td><td><input type="checkbox" name="portador-${a.id}" ${esPortador(a) ? "checked" : ""}></td></tr>`).join("");
  const opts = n => Array.from({ length: 8 }, (_, i) => `<option value="${i}" ${i === n ? "selected" : ""}>${esc(nombreCapa(i))}</option>`).join("");
  const r = await foundry.applications.api.DialogV2.wait({ window: { title: "Cruzar umbrales hacia afuera", icon: "fa-solid fa-person-walking-arrow-loop-left" }, position: { width: 640 },
    content: `<div class="ecos-dialogo"><p>Bajar no cuesta nada. <b>Volver se paga</b>: cada umbral que cruzan hacia afuera cobra la capa que dejan, uno detrás de otro.</p>
      <label>Desde <select name="desde">${opts(actual)}</select></label> <label>hasta <select name="hasta">${opts(Math.max(0, actual - 1))}</select></label>
      <table class="ecos-tabla"><tr><th>PJ</th><th>Durmió en la capa</th><th>Más de un día</th><th>Cristal mudo</th><th>Por un Camino</th><th>Portador (desventaja)</th></tr>${filas}</table>
      <p class="ecos-nota">Durmió: cobra como una capa más honda. Cristal mudo: como una menos honda (de la 5 hacia adentro, solo la mitad del daño; al tercer umbral la pieza es polvo). Por un Camino: no paga. Portador: desventaja en la salvación.</p></div>`,
    buttons: [{ action: "ok", label: "Cruzar y cobrar", default: true, callback: (_e, b) => Object.fromEntries(new FormData(b.form)) }, { action: "no", label: "Cancelar" }], rejectClose: false });
  if (!r || r === "no") return;
  const pasos = pasosResaca(r.desde, r.hasta);
  if (!pasos.length) return ui.notifications.info("Eso no es subir: no se cobra nada.");
  const resumen = [];
  for (const a of pjs) {
    if (!r[`usa-${a.id}`]) continue;
    const o = { durmio: !!r[`durmio-${a.id}`], cristal: !!r[`cristal-${a.id}`], camino: !!r[`camino-${a.id}`] }, largo = !!r[`largo-${a.id}`] || o.durmio;
    let grietas = Number(a.getFlag(MOD, "cristalUmbrales")) || 0;
    for (const n of pasos) {
      const cristal = o.cristal && grietas < 3;
      const q = capaQueCobra(n, { ...o, cristal });
      if (cristal) { grietas++; await a.setFlag(MOD, "cristalUmbrales", grietas); }
      if (!q) { resumen.push(`<li><b>${esc(a.name)}</b> · ${esc(nombreCapa(n))}: no paga${o.camino ? " (por un Camino)" : ""}.</li>`); continue; }
      const d = capaDe(q.capa);
      if (!d) continue;
      if (d.soloSiLargo && !largo) { resumen.push(`<li><b>${esc(a.name)}</b> · ${esc(nombreCapa(n))}: no paga (estuvo poco y no durmió).</li>`); continue; }
      let exito = false, total = "—";
      if (!d.muerte) {
        const rolls = await a.rollSavingThrow({ ability: d.salvacion ?? "con", target: Number(d.cd), disadvantage: !!r[`portador-${a.id}`] }, { configure: false }).catch(() => null);
        total = rolls?.[0]?.total ?? "—"; exito = Number(total) >= Number(d.cd);
      }
      const c = cobro(d, exito, { mitad: q.mitad });
      const partes = c.muerte ? [] : await aplicarCobro(a, c);
      resumen.push(`<li><b>${esc(a.name)}</b> deja ${esc(nombreCapa(n))}${q.capa !== n ? ` (cobra como la ${q.capa})` : ""}: ${c.muerte ? "<b>no vuelve</b>" : `salvación ${total} contra CD ${d.cd} → ${exito ? "la supera" : "la falla"}`}. ${partes.join(" · ")}</li>`);
      const nota = [c.nota, c.sonado ? "Se vuelve un Soñado: el personaje pasa al DM." : "", c.muerte ? (c.nota || "Muere: confírmalo tú (el módulo no lo mata solo).") : ""].filter(Boolean).join(" ");
      if (nota) await susurroDM(`Resaca · ${a.name}`, `<p><b>${esc(a.name)}</b>, al dejar ${esc(nombreCapa(n))}: ${esc(nota)}</p>`);
      if (c.muerte || c.sonado) break;
    }
    if (grietas >= 3 && o.cristal) resumen.push(`<li><b>${esc(a.name)}</b>: su cristal mudo ya es polvo.</li>`);
  }
  await canvas.scene?.setFlag(MOD, "capaAbismo", Number(r.hasta));
  await ChatMessage.create({ speaker: { alias: "Lo que cobra el sueño" }, whisper: game.users.filter(u => u.isGM).map(u => u.id),
    content: `<p><b>Cruzan hacia afuera</b>: de ${esc(nombreCapa(r.desde))} a ${esc(nombreCapa(r.hasta))}.</p><ul>${resumen.join("")}</ul>` });
}

/** La llamada del amanecer: salvación de Sabiduría en las capas hondas; quien falla quiere bajar una más. */
export async function llamadaAmanecer() {
  if (!game.user.isGM) return;
  const T = tabla(), capa = Number(canvas?.scene?.getFlag(MOD, "capaAbismo")) || 0, cd = cdLlamada(capa, T?.llamada);
  if (!cd) return ui.notifications.info(`En ${nombreCapa(capa)} el sueño todavía no llama al amanecer.`);
  const filas = [];
  for (const a of pjsEscena()) {
    const rolls = await a.rollSavingThrow({ ability: "wis", target: cd, disadvantage: esPortador(a) }, { configure: false }).catch(() => null);
    const t = rolls?.[0]?.total ?? "—";
    filas.push(`<li><b>${esc(a.name)}</b>: ${t} contra CD ${cd} → ${Number(t) >= cd ? "resiste" : "<b>hoy quiere bajar una capa más</b> (lo argumenta, lo sueña, se ofrece de guía; no está hechizado)"}</li>`);
  }
  await susurroDM("La llamada del amanecer", `<p>${esc(nombreCapa(capa))}</p><ul>${filas.join("")}</ul>`);
}

/** El panel del DM: en qué capa está la escena, cómo funciona, y los dos botones. */
export async function abrirCapas() {
  if (!game.user.isGM) return;
  const T = tabla(), actual = Number(canvas?.scene?.getFlag(MOD, "capaAbismo")) || 0;
  const filas = (T?.capas ?? []).map(c => `<tr><td>${c.n}</td><td><b>${esc(c.nombre)}</b></td><td>${esc(c.umbral ?? "")}</td><td>${c.muerte ? "—" : `${(c.salvacion ?? "con").toUpperCase()} ${c.cd}${c.soloSiLargo ? " (solo si pasó más de un día o durmió)" : ""}`}</td><td>${esc(c.textoFalla ?? "")}</td><td>${esc(c.textoSupera ?? "")}</td></tr>`).join("");
  const opts = Array.from({ length: 8 }, (_, i) => `<option value="${i}" ${i === actual ? "selected" : ""}>${esc(nombreCapa(i))}</option>`).join("");
  const dlg = new foundry.applications.api.DialogV2({ window: { title: "Capas del Abismo", icon: "fa-solid fa-stairs" }, position: { width: 760 },
    content: `<div class="ecos-dialogo ecos-capas">${T ? "" : `<p class="ecos-aviso">Faltan los datos de las capas en este mundo. El motor está, pero no sabe qué cobra cada capa.</p>`}
      <label>Esta escena está en <select name="capa">${opts}</select></label> <label class="ecos-check"><input type="checkbox" name="anunciar"> Anunciarlo a los jugadores (solo el nombre de la capa)</label>
      <details open><summary><b>Cómo funciona</b></summary><ol>
        <li><b>Bajar no cuesta nada.</b> Cambia la capa de la escena cuando el grupo cruce un umbral hacia adentro.</li>
        <li><b>Volver se paga.</b> «Cruzar hacia afuera» cobra cada capa que dejan, de la más honda a la menos: una salvación por umbral y por PJ, y el Agotamiento, el daño y los estados se aplican solos. Lo que no es número (un recuerdo, un sentido, volverse Soñado) te llega en un susurro para que lo decidas tú.</li>
        <li><b>Dormir en la capa</b> cobra como una más honda. <b>Cristal mudo</b>, como una menos honda (de la 5 hacia adentro, solo la mitad del daño; se gasta en tres umbrales). <b>Por un Camino</b> no se paga. <b>Portador</b>: desventaja.</li>
        <li><b>Dentro de una Barrera no hay cobro.</b> Volver de la capa 1 a tierra protegida se paga al cruzar la Barrera.</li>
        <li><b>Al amanecer</b>, en las capas hondas, «La llamada» tira Sabiduría: quien falla quiere bajar una capa más (lo interpreta el jugador).</li>
        <li>No se lo expliques a los jugadores de entrada: que lo descubran pagando.</li></ol></details>
      ${T ? `<table class="ecos-tabla"><tr><th>Capa</th><th>Nombre</th><th>Umbral que la cierra</th><th>Salvación</th><th>Si falla</th><th>Si supera</th></tr>${filas}</table>${T.reglasHtml ?? ""}` : ""}</div>`,
    buttons: [{ action: "guardar", label: "Guardar capa", icon: "fa-solid fa-floppy-disk", callback: (_e, b) => ({ op: "guardar", ...Object.fromEntries(new FormData(b.form)) }) },
      { action: "cruzar", label: "Cruzar hacia afuera", icon: "fa-solid fa-person-walking-arrow-loop-left", callback: () => ({ op: "cruzar" }) },
      { action: "llamada", label: "Amanecer: la llamada", icon: "fa-solid fa-sun", callback: () => ({ op: "llamada" }) },
      { action: "cerrar", label: "Cerrar", default: true }],
    submit: async res => {
      if (res?.op === "guardar") {
        await canvas.scene?.setFlag(MOD, "capaAbismo", Number(res.capa));
        if (res.anunciar) await ChatMessage.create({ speaker: { alias: "El Abismo" }, content: `<p>El aire cambia: estáis en <b>${esc(nombreCapa(res.capa))}</b>.</p>` });
        ui.notifications.info(`Escena: ${nombreCapa(res.capa)}.`);
      } else if (res?.op === "cruzar") await cruzarHaciaAfuera();
      else if (res?.op === "llamada") await llamadaAmanecer();
    } });
  await dlg.render(true);
}
if (globalThis.Hooks) Hooks.once("ready", () => { const api = game.modules.get(MOD)?.api; if (api) { api.capasAbismo = abrirCapas; api.cruzarAbismo = cruzarHaciaAfuera; api.llamadaAbismo = llamadaAmanecer; } });
