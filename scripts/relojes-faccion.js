/**
 * 3.43 · Relojes de facción (aprobado por el autor, 11-nov-2026). Cada facción del mundo tiene un reloj de segmentos
 * que avanza cuando pasa lo que la mueve: solo cuando un PJ sube de nivel de fama (si la facción reacciona a la fama),
 * solo cada N días (si tiene ritmo propio) o a mano. Al llenarse, el DM recibe qué pasa. Regla del autor: todo lo
 * automático tiene al lado «Deshacer» y el DM puede poner el valor a mano. Las facciones y sus textos son de la
 * campaña: se leen de la bandera `faccionesMundo` de un diario del mundo (no están en el código).
 */
import { botonDeshacer } from "./deshacer.js";
const MOD = "ecos-frontera";
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

/** Avanza (o retrocede) un reloj; dice si se llenó en este paso. Puro. */
export function moverReloj(valor, segmentos, paso) {
  const s = Math.max(1, Math.trunc(Number(segmentos) || 6)), v0 = Math.max(0, Math.min(s, Math.trunc(Number(valor) || 0)));
  const v = Math.max(0, Math.min(s, v0 + Math.trunc(Number(paso) || 0)));
  return { valor: v, lleno: v >= s && v0 < s, segmentos: s };
}
/** ¿Le toca avanzar por días? (cada N días desde el último avance). Puro. */
export const tocaPorDias = (cadaDias, diaUltimo, diaHoy) => Number(cadaDias) > 0 && Number.isFinite(Number(diaHoy)) && (Number(diaHoy) - (Number(diaUltimo) || 0)) >= Number(cadaDias);
/** Dibujo del reloj (un círculo en segmentos). Puro. */
export function relojSVG(valor, segmentos, tam = 34) {
  const s = Math.max(1, segmentos), r = tam / 2 - 2, c = tam / 2;
  const partes = Array.from({ length: s }, (_, i) => {
    const a0 = (i / s) * 2 * Math.PI - Math.PI / 2, a1 = ((i + 1) / s) * 2 * Math.PI - Math.PI / 2;
    const p = (a) => `${(c + r * Math.cos(a)).toFixed(2)},${(c + r * Math.sin(a)).toFixed(2)}`;
    return `<path d="M${c},${c} L${p(a0)} A${r},${r} 0 ${s === 1 ? 1 : 0} 1 ${p(a1)} Z" fill="${i < valor ? "var(--ecos-reloj-lleno, #a33)" : "transparent"}" stroke="currentColor" stroke-width="1"/>`;
  }).join("");
  return `<svg class="ecos-reloj" width="${tam}" height="${tam}" viewBox="0 0 ${tam} ${tam}" aria-label="${valor} de ${s}">${partes}</svg>`;
}

/* ---------------- Foundry ---------------- */
const datos = () => game.journal?.find(j => j.getFlag(MOD, "faccionesMundo"))?.getFlag(MOD, "faccionesMundo") ?? null;
const estado = () => { try { return foundry.utils.deepClone(game.settings.get(MOD, "relojesFaccion") ?? {}); } catch { return {}; } };
const gms = () => game.users.filter(u => u.isGM).map(u => u.id);
const diaHoy = () => { try { return Number(game.settings.get(MOD, "ultimoDia")); } catch { return NaN; } };

/** Mueve el reloj de una facción, avisa al DM (con Deshacer) y avisa si se llena. */
export async function avanzar(id, paso = 1, motivo = "") {
  if (!game.user.isGM) return;
  const F = datos()?.facciones?.find(f => f.id === id);
  if (!F) return;
  const E = estado(), antes = E[id] ? { ...E[id] } : undefined;
  const m = moverReloj(E[id]?.valor ?? (Number(F.inicio) || 0), F.segmentos, paso);
  E[id] = { valor: m.valor, dia: diaHoy() };
  await game.settings.set(MOD, "relojesFaccion", E);
  const txt = `<p><b>${esc(F.nombre)}</b>: reloj ${m.valor}/${m.segmentos}${motivo ? ` (${esc(motivo)})` : ""}. ${relojSVG(m.valor, m.segmentos, 26)}</p>${m.lleno ? `<p><b>¡Se llenó!</b> ${esc(F.alLlenar ?? "")}</p>` : ""}`;
  await ChatMessage.create({ whisper: gms(), speaker: { alias: "Relojes de facción (solo DM)" }, content: txt + botonDeshacer(),
    flags: { [MOD]: { relojFaccion: id, deshacer: { cambios: [], borrar: [], reloj: { id, antes } } } } });
}
export async function abrirRelojes() {
  if (!game.user.isGM) return;
  const D = datos();
  if (!D?.facciones?.length) return ui.notifications.warn("Faltan las facciones en el mundo (bandera faccionesMundo de un diario).");
  const E = estado(), regiones = [...new Set(D.facciones.map(f => f.region))];
  // 3.45: cada facción enlaza a su página del diario de facciones y muestra quiénes son y qué la mueve.
  const diario = game.journal?.find(j => j.getFlag(MOD, "clave") === D.diario) ?? game.journal?.find(j => /Facciones del mundo/.test(j.name));
  const paginaDe = r => diario?.pages?.find(p => p.name.endsWith(r));
  const valorDe = f => E[f.id]?.valor ?? (Number(f.inicio) || 0);
  const fila = f => { const v = valorDe(f), pg = paginaDe(f.region); return `<tr data-id="${f.id}"><td>${relojSVG(v, f.segmentos, 28)}</td><td><b>${esc(f.nombre)}</b>${pg ? ` <a data-pagina="${pg.id}" title="Abrir en el diario"><i class="fa-solid fa-book-open"></i></a>` : ""}<br><small>${esc(f.meta ?? "")}</small>
    <details><summary><small>Más</small></summary><small>${esc(f.quienes ?? "")}<br><b>Avanza si:</b> ${esc(f.avanza ?? "")}<br><b>Retrocede si:</b> ${esc(f.retrocede ?? "")}<br><b>Cuando se llena:</b> ${esc(f.alLlenar ?? "")}</small></details></td>
    <td class="ecos-reloj-num">${v}/${f.segmentos}</td><td><button type="button" data-r="menos" title="Retroceder 1">−</button><button type="button" data-r="mas" title="Avanzar 1">+</button>
    <input type="number" data-r="exacto" min="0" max="${f.segmentos}" value="${v}" title="Poner a mano" style="width:3.5em"></td>
    <td><small>${f.reaccionaFama ? "Fama · " : ""}${f.cadaDias ? `cada ${f.cadaDias} días` : ""}</small></td></tr>`; };
  const html = `<div class="ecos-dialogo ecos-relojes"><p>Cada facción avanza hacia lo que quiere. Los relojes se mueven solos cuando un PJ sube de fama (si la facción reacciona a la fama) o cada cierto número de días; cada avance te llega con «Deshacer». Aquí los mueves a mano: −, +, o escribe el número.</p>
    ${regiones.map(r => `<details ${r === regiones[0] ? "open" : ""}><summary><b>${esc(r)}</b> (${D.facciones.filter(f => f.region === r).length})</summary><table class="ecos-tabla">${D.facciones.filter(f => f.region === r).map(fila).join("")}</table></details>`).join("")}
    <details><summary>Qué pasa cuando se llena cada reloj</summary><ul>${D.facciones.map(f => `<li><b>${esc(f.nombre)}</b>: ${esc(f.alLlenar ?? "")} <i>Avanza si: ${esc(f.avanza ?? "")}. Retrocede si: ${esc(f.retrocede ?? "")}.</i></li>`).join("")}</ul></details></div>`;
  const dlg = new foundry.applications.api.DialogV2({ window: { title: "Relojes de facción", icon: "fa-solid fa-clock" }, position: { width: 760, height: 640 }, content: html, buttons: [{ action: "cerrar", label: "Cerrar", default: true }] });
  await dlg.render(true);
  const el = dlg.element;
  el?.addEventListener("click", async ev => {
    const l = ev.target.closest("a[data-pagina]");
    if (l && diario) { ev.preventDefault(); return diario.sheet.render(true, { pageId: l.dataset.pagina }); }
    const b = ev.target.closest("button[data-r]"); if (!b) return;
    ev.preventDefault();
    const id = b.closest("tr")?.dataset.id;
    await avanzar(id, b.dataset.r === "mas" ? 1 : -1, "a mano");
    dlg.close(); abrirRelojes();
  });
  el?.addEventListener("change", async ev => {
    const i = ev.target.closest("input[data-r='exacto']"); if (!i) return;
    const id = i.closest("tr")?.dataset.id, f0 = D.facciones.find(f => f.id === id), v = estado()[id]?.valor ?? (Number(f0?.inicio) || 0);
    await avanzar(id, Number(i.value) - v, "puesto a mano");
    dlg.close(); abrirRelojes();
  });
}
async function deshacerReloj(msg) {
  const r = msg.getFlag(MOD, "deshacer")?.reloj;
  if (!r) return;
  const E = estado();
  if (r.antes === undefined) delete E[r.id]; else E[r.id] = r.antes;
  await game.settings.set(MOD, "relojesFaccion", E);
}
if (globalThis.Hooks) {
  Hooks.once("init", () => game.settings.register(MOD, "relojesFaccion", { scope: "world", config: false, type: Object, default: {} }));
  Hooks.once("ready", () => { const api = game.modules.get(MOD)?.api; if (api) { api.relojesFaccion = abrirRelojes; api.avanzarFaccion = avanzar; } });
  // El botón Deshacer de deshacer.js revierte los documentos; el reloj vive en un ajuste del mundo: lo revierte esto.
  Hooks.on("updateChatMessage", (msg, cambios) => {
    if (!game.user.isGM || game.users.activeGM?.isSelf === false) return;
    if (msg.getFlag(MOD, "relojFaccion") && foundry.utils.getProperty(cambios, `flags.${MOD}.deshecho`)) deshacerReloj(msg).catch(err => console.error(`${MOD} | reloj`, err));
  });
  // Fama: cuando un PJ sube de nivel, avanzan las facciones que reaccionan a la fama.
  Hooks.on("ecosSubeFama", ({ actor, nivel } = {}) => {
    if (!game.user.isGM || game.users.activeGM?.isSelf === false) return;
    for (const f of datos()?.facciones ?? []) if (f.reaccionaFama) avanzar(f.id, 1, `${actor?.name ?? "un PJ"} pasa a ${nivel}`).catch(() => null);
  });
  // Días: las facciones con ritmo propio avanzan cada N días.
  Hooks.on("ecosNuevoDia", ({ n } = {}) => {
    if (!game.user.isGM || game.users.activeGM?.isSelf === false) return;
    const E = estado(); let nuevo = false;
    for (const f of datos()?.facciones ?? []) {
      if (!f.cadaDias) continue;
      if (E[f.id]?.dia == null) { E[f.id] = { valor: E[f.id]?.valor ?? 0, dia: n }; nuevo = true; continue; } // el primer día solo empieza a contar
      if (tocaPorDias(f.cadaDias, E[f.id].dia, n)) avanzar(f.id, 1, `pasan ${f.cadaDias} días`).catch(() => null);
    }
    if (nuevo) game.settings.set(MOD, "relojesFaccion", E).catch(() => null);
  });
}
