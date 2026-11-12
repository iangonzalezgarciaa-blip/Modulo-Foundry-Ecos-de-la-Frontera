/**
 * 3.47 · Festejo del 20 natural (pedido del autor, 12-nov-2026; Yugen Criticals no corre en Foundry 14.370). 3.49: estilo
 * anime de acción (pedido del autor): líneas de foco, trazo de tinta, panel de manga con aura y letras de impacto (Bangers, OFL). Lo ve todo el
 * que ve la tirada, a la vez. Código y diseño propios.
 *  - Tema por la naturaleza del Verbe (Fuego, Agua, Viento, Tierra, Rayo) o dorado; el 1 natural es «Pifia» (rojo oscuro).
 *  - Salvación de muerte con 20: «¡SE LEVANTA!». Frase propia por personaje (el dueño la pone desde el panel de acciones).
 *  - Espera a que terminen los dados 3D (Dice So Nice) si están. Un clic lo salta.
 * Regla del autor: se apaga en los ajustes, el temblor se apaga por jugador y el DM lo lanza a mano desde su menú.
 * 3.58 (pedido del autor): el 20 de un PNJ es **terror** para los jugadores (oscuridad, latido, grietas y un retumbe
 * sintetizado); su 1 es **burla** (un duendecillo original se ríe, con trombón triste sintetizado). Sin archivos de sonido.
 */
const MOD = "ecos-frontera";
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
// 3.49: estilo anime de acción, naranja y negro por defecto; la naturaleza del Verbe tiñe el aura y las letras.
export const TEMAS = {
  naranja: { c1: "#ffd23f", c2: "#ff6a00", c3: "#111111", n: "Naranja" },
  fuego: { c1: "#ffcf3a", c2: "#ff2d00", c3: "#111111", n: "Fuego" },
  agua: { c1: "#9fe3ff", c2: "#1a7bff", c3: "#111111", n: "Agua" },
  viento: { c1: "#d8ffe6", c2: "#19c27a", c3: "#111111", n: "Viento" },
  tierra: { c1: "#ffd9a0", c2: "#b5651d", c3: "#111111", n: "Tierra" },
  rayo: { c1: "#fff8a0", c2: "#7a5cff", c3: "#111111", n: "Rayo" },
  pifia: { c1: "#ff8f8f", c2: "#b3001b", c3: "#111111", n: "Pifia" },
  terror: { c1: "#ff3b3b", c2: "#4a0000", c3: "#000000", n: "Terror" },
  burla: { c1: "#fff27a", c2: "#ff5fa2", c3: "#2a1640", n: "Burla" }
};
const GRITOS_TERROR = { attack: "¡GOLPE MORTAL!", save: "¡NO CEDE!", death: "¡SE NIEGA A CAER!", otro: "¡20 DEL ENEMIGO!" };
const GRITOS_BURLA = ["¡JA, JA, JA!", "¡QUÉ TORPE!", "¡PIFIA ENEMIGA!", "¡SE LE CAYÓ!", "¡NI CERCA!"];
/** Qué festejo toca para una tirada. Puro. null = nada. */
export function festejoDe({ natural, tipo, esPJ = true, quien = "pj", conUno = true, soloAtaques = false, enemigo = true, azar = Math.random } = {}) {
  if (natural !== 20 && natural !== 1) return null;
  if (!tipo || ["initiative", "concentration", "damage", "healing", "hitDie", "hitPoints"].includes(tipo)) return null;
  if (soloAtaques && tipo !== "attack" && tipo !== "death") return null;
  // 3.58: el PNJ asusta con su 20 y hace reír con su 1 (a los jugadores).
  if (!esPJ && quien !== "todos") {
    if (!enemigo) return null;
    if (natural === 20) return { natural, tipo, modo: "terror", grito: GRITOS_TERROR[tipo] ?? GRITOS_TERROR.otro };
    return { natural, tipo, modo: "burla", grito: tipo === "death" ? "¡SE APAGA!" : "¡FALLÓ!", burla: GRITOS_BURLA[Math.floor(azar() * GRITOS_BURLA.length) % GRITOS_BURLA.length] };
  }
  if (natural === 1 && !conUno) return null;
  const grito = natural === 1 ? (tipo === "death" ? "¡SE APAGA!" : "¡PIFIA!")
    : tipo === "attack" ? "¡CRÍTICO!" : tipo === "death" ? "¡SE LEVANTA!" : "¡20 NATURAL!";
  return { natural, grito, tipo, modo: "pj" };
}
/** El tema: naturaleza del Verbe si la tiene; la pifia siempre es roja. Puro. */
export const temaDe = (natural, nat, modo = "pj") => modo === "terror" ? "terror" : modo === "burla" ? "burla" : natural === 1 ? "pifia" : (TEMAS[nat] ? nat : "naranja");

/* ---------------- Foundry ---------------- */
const leer = (k, d) => { try { return game.settings.get(MOD, k); } catch { return d; } };
const COLA = [];
let sonando = false;
function imagenDe(actor, tokenDoc) {
  const a = actor?.img ?? "", t = tokenDoc?.texture?.src ?? actor?.prototypeToken?.texture?.src ?? "";
  const pobre = s => !s || /mystery-man|\.svg$/i.test(s);
  return pobre(a) && !pobre(t) ? t : (a || t || "icons/svg/mystery-man.svg");
}
function manchas() {
  // Salpicaduras de tinta alrededor del grito.
  return Array.from({ length: 7 }, (_, i) => {
    const t = 14 + Math.random() * 70, x = 2 + Math.random() * 58, y = 22 + Math.random() * 56;
    return `<i style="left:${x.toFixed(1)}vw;top:${y.toFixed(1)}vh;width:${t.toFixed(0)}px;height:${(t * (0.6 + Math.random() * 0.6)).toFixed(0)}px;--d:${(0.15 + i * 0.03).toFixed(2)}s"></i>`;
  }).join("");
}
function chispas(n = 18) {
  return Array.from({ length: n }, () => {
    const ang = Math.random() * Math.PI * 2, d = 25 + Math.random() * 45;
    return `<i style="--x:${(Math.cos(ang) * d).toFixed(1)}vw;--y:${(Math.sin(ang) * d).toFixed(1)}vh;--t:${(0.5 + Math.random() * 0.7).toFixed(2)}s;--r:${Math.floor(Math.random() * 360)}deg"></i>`;
  }).join("");
}
/* 3.58 · Sonidos sintetizados (Web Audio): sin archivos ni derechos de terceros. */
function audio() {
  const AC = globalThis.AudioContext ?? globalThis.webkitAudioContext; if (!AC) return null;
  const ac = new AC(), out = ac.createGain();
  let vol = 0.55; try { vol *= Number(game.settings.get("core", "globalInterfaceVolume") ?? 1) || 1; } catch { /* sin ajuste */ }
  out.gain.value = vol; out.connect(ac.destination);
  setTimeout(() => ac.close().catch(() => null), 4000);
  return { ac, out, t0: ac.currentTime + 0.02 };
}
function sonidoTerror() {
  const a = audio(); if (!a) return; const { ac, out, t0 } = a;
  const lp = ac.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.setValueAtTime(160, t0); lp.frequency.linearRampToValueAtTime(1100, t0 + 1.3); lp.frequency.linearRampToValueAtTime(220, t0 + 2.8); lp.connect(out);
  for (const f of [41.2, 43.65, 61.7, 87.3]) { // grave, disonante (tritono y segunda menor)
    const o = ac.createOscillator(), g = ac.createGain(); o.type = "sawtooth"; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.16, t0 + 0.5); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 2.9);
    o.connect(g).connect(lp); o.start(t0); o.stop(t0 + 3);
  }
  for (const t of [0.0, 0.26, 1.0, 1.26, 2.0, 2.26]) { // latido
    const o = ac.createOscillator(), g = ac.createGain(); o.type = "sine";
    o.frequency.setValueAtTime(75, t0 + t); o.frequency.exponentialRampToValueAtTime(38, t0 + t + 0.18);
    g.gain.setValueAtTime(0.0001, t0 + t); g.gain.exponentialRampToValueAtTime(t % 1 ? 0.6 : 0.95, t0 + t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t0 + t + 0.26);
    o.connect(g).connect(out); o.start(t0 + t); o.stop(t0 + t + 0.3);
  }
  const ch = ac.createOscillator(), gc = ac.createGain(); ch.type = "triangle"; // chirrido que sube
  ch.frequency.setValueAtTime(700, t0 + 0.4); ch.frequency.exponentialRampToValueAtTime(1490, t0 + 1.6);
  gc.gain.setValueAtTime(0.0001, t0 + 0.4); gc.gain.exponentialRampToValueAtTime(0.05, t0 + 1.2); gc.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.9);
  ch.connect(gc).connect(out); ch.start(t0 + 0.4); ch.stop(t0 + 2);
}
function sonidoBurla() {
  const a = audio(); if (!a) return; const { ac, out, t0 } = a;
  const lp = ac.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 1400; lp.Q.value = 6; lp.connect(out);
  const notas = [[466.2, 0, 0.34], [440, 0.38, 0.34], [415.3, 0.76, 0.34], [392, 1.14, 1.1]]; // trombón triste
  for (const [f, t, d] of notas) {
    const o = ac.createOscillator(), g = ac.createGain(); o.type = "sawtooth"; o.frequency.setValueAtTime(f, t0 + t);
    if (d > 1) { const lfo = ac.createOscillator(), lg = ac.createGain(); lfo.frequency.value = 6; lg.gain.value = 9; lfo.connect(lg).connect(o.frequency); lfo.start(t0 + t + 0.15); lfo.stop(t0 + t + d); o.frequency.linearRampToValueAtTime(f * 0.94, t0 + t + d); }
    g.gain.setValueAtTime(0.0001, t0 + t); g.gain.exponentialRampToValueAtTime(0.28, t0 + t + 0.04); g.gain.setValueAtTime(0.28, t0 + t + d - 0.08); g.gain.exponentialRampToValueAtTime(0.0001, t0 + t + d);
    o.connect(g).connect(lp); o.start(t0 + t); o.stop(t0 + t + d + 0.02);
  }
}
/** Duendecillo original (dibujado aquí) que se ríe: cabeza grande, orejas de punta, ojos cerrados de risa, lengua afuera y dedo que señala. */
export const DUENDE_SVG = `<svg class="ef-duende" viewBox="0 0 220 260" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <g class="ef-duende-cuerpo"><path d="M70 180 Q110 160 150 180 L160 250 Q110 262 60 250 Z" fill="#5b3fa0" stroke="#24123f" stroke-width="5"/>
  <path d="M150 196 Q190 186 205 160" fill="none" stroke="#24123f" stroke-width="14" stroke-linecap="round"/><path d="M150 196 Q190 186 205 160" fill="none" stroke="#ffd2a8" stroke-width="8" stroke-linecap="round"/>
  <circle cx="207" cy="156" r="9" fill="#ffd2a8" stroke="#24123f" stroke-width="4"/>
  <path d="M72 200 Q40 215 32 236" fill="none" stroke="#24123f" stroke-width="14" stroke-linecap="round"/><path d="M72 200 Q40 215 32 236" fill="none" stroke="#ffd2a8" stroke-width="8" stroke-linecap="round"/></g>
  <g class="ef-duende-cabeza"><path d="M38 70 L6 34 L52 52 Z M182 70 L214 34 L168 52 Z" fill="#ffd2a8" stroke="#24123f" stroke-width="5" stroke-linejoin="round"/>
  <circle cx="110" cy="100" r="78" fill="#ffd2a8" stroke="#24123f" stroke-width="6"/>
  <path d="M40 74 Q60 14 110 18 Q164 16 182 76 Q150 52 110 56 Q70 52 40 74 Z" fill="#7a5cff" stroke="#24123f" stroke-width="5"/>
  <path d="M66 96 Q78 82 90 96 M130 96 Q142 82 154 96" fill="none" stroke="#24123f" stroke-width="7" stroke-linecap="round"/>
  <ellipse cx="62" cy="122" rx="13" ry="8" fill="#ff8fb1" opacity=".8"/><ellipse cx="158" cy="122" rx="13" ry="8" fill="#ff8fb1" opacity=".8"/>
  <path d="M74 124 Q110 186 146 124 Z" fill="#7a1030" stroke="#24123f" stroke-width="5" stroke-linejoin="round"/>
  <path d="M96 146 Q110 178 124 146 Q110 156 96 146 Z" fill="#ff6f8e" stroke="#24123f" stroke-width="3"/></g></svg>`;
async function mostrar(d) {
  const T = TEMAS[d.tema] ?? TEMAS.naranja;
  const el = document.createElement("div");
  el.id = "ecos-festejo";
  el.className = `ef-tema-${d.tema} ${d.modo === "terror" ? "ef-terror" : d.modo === "burla" ? "ef-burla" : d.natural === 1 ? "ef-uno" : "ef-veinte"}`;
  el.style.setProperty("--c1", T.c1); el.style.setProperty("--c2", T.c2); el.style.setProperty("--c3", T.c3);
  el.innerHTML = `<div class="ef-velo"></div><div class="ef-rayos"></div><div class="ef-flash"></div>
    <div class="ef-tinta">${manchas()}</div>
    <div class="ef-banda"><div class="ef-lineas"></div></div>
    <div class="ef-aura"></div>
    <div class="ef-retrato"><div class="ef-foto"><img src="${esc(d.img)}" alt=""></div></div>
    <div class="ef-texto"><div class="ef-grito">${esc(d.grito)}</div><div class="ef-nombre">${esc(d.nombre)}${d.detalle ? ` · <span>${esc(d.detalle)}</span>` : ""}</div></div>
    <div class="ef-chispas">${chispas()}</div>
    ${d.modo === "terror" ? `<div class="ef-grietas"></div><div class="ef-latido"></div><div class="ef-gotas">${Array.from({ length: 14 }, (_, i) => `<i style="left:${(i * 7.3 + Math.random() * 4).toFixed(1)}%;--d:${(Math.random() * 0.9).toFixed(2)}s;--h:${(8 + Math.random() * 22).toFixed(0)}vh"></i>`).join("")}</div><div class="ef-amenaza">Prepárense…</div>` : ""}
    ${d.modo === "burla" ? `<div class="ef-burla-caja">${DUENDE_SVG}<div class="ef-globo">${esc(d.burla ?? "¡JA, JA, JA!")}</div></div>` : ""}`;
  document.body.appendChild(el);
  const temblar = leer("festejoTemblor", true) && !window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  if (temblar) { document.body.classList.add("ecos-festejo-temblor"); setTimeout(() => document.body.classList.remove("ecos-festejo-temblor"), 650); }
  const sonido = leer("festejoSonido", "") || CONFIG.sounds?.combat;
  if (d.modo === "terror" || d.modo === "burla") { if (leer("festejoConSonido", true)) try { (d.modo === "terror" ? sonidoTerror : sonidoBurla)(); } catch { /* sin audio */ } }
  else if (sonido && leer("festejoConSonido", true)) {
    try { (foundry.audio?.AudioHelper ?? globalThis.AudioHelper)?.play?.({ src: sonido, volume: 0.7, autoplay: true, loop: false }, false); } catch { /* sin sonido */ }
  }
  await new Promise(res => {
    const fin = () => { clearTimeout(t); el.classList.add("ef-sale"); setTimeout(() => { el.remove(); res(); }, 320); };
    const t = setTimeout(fin, d.modo === "terror" ? 3100 : 2700);
    el.addEventListener("click", fin, { once: true });
  });
}
async function siguiente() {
  if (sonando) return;
  sonando = true;
  try { while (COLA.length) await mostrar(COLA.shift()); } finally { sonando = false; }
}
/** Pone un festejo en la cola de este cliente. */
export function festejar(d) {
  if (COLA.length > 3) return; // una lluvia de 20 no bloquea la mesa
  COLA.push(d);
  siguiente();
}
function datosFestejo(actor, f, tokenDoc = null, detalle = "") {
  const v = actor ? game.modules.get(MOD)?.api?.verbe : null;
  const nat = v?.despierto?.(actor) ? (v.estado?.(actor)?.nats?.[0] ?? null) : null;
  const propia = actor?.getFlag?.(MOD, "festejo") ?? {};
  const frase = f.natural === 1 ? propia.frase1 : propia.frase20;
  const propio = f.modo === "pj" || !f.modo;
  return { natural: f.natural, modo: f.modo ?? "pj", burla: f.burla ?? null, tema: temaDe(f.natural, nat, f.modo), grito: propio && frase?.trim() ? frase.trim() : f.grito,
    nombre: tokenDoc?.name ?? actor?.name ?? "", detalle, img: imagenDe(actor, tokenDoc) };
}
async function alMensaje(m) {
  if (!leer("festejo20", true)) return;
  const { infoTirada } = await import("./compat.js");
  const { dadoNatural } = await import("./azar-core.js");
  const r = infoTirada(m), roll = Array.from(m.rolls ?? [])[0];
  if (!r || !roll) return;
  const actor = ChatMessage.getSpeakerActor?.(m.speaker);
  if (!actor) return;
  const f = festejoDe({ natural: dadoNatural(roll), tipo: r.tipo, esPJ: actor.type === "character" || actor.hasPlayerOwner,
    quien: leer("festejoQuien", "pj"), conUno: leer("festejoUno", true), soloAtaques: leer("festejoSoloAtaques", false), enemigo: leer("festejoEnemigo", true) });
  if (!f) return;
  const tokenDoc = m.speaker?.token ? canvas?.scene?.tokens?.get(m.speaker.token) : null;
  const detalle = r.tipo === "attack" ? (m.getAssociatedItem?.()?.name ?? m.flags?.dnd5e?.item?.name ?? fromUuidSync?.(m.flags?.dnd5e?.item?.uuid ?? "")?.name ?? "") : "";
  // Con dados 3D, espera a que caigan.
  if (game.dice3d?.waitFor3DAnimationByMessageID) await Promise.race([game.dice3d.waitFor3DAnimationByMessageID(m.id), new Promise(res => setTimeout(res, 6000))]).catch(() => null);
  festejar(datosFestejo(actor, f, tokenDoc, detalle));
}
/** El DM lo lanza a mano para todos (token seleccionado), o lo prueba solo para sí. */
export async function lanzarFestejo({ natural = 20, todos = true, actor = null, enemigo = false } = {}) {
  const tok = canvas?.tokens?.controlled?.[0];
  actor ??= tok?.actor ?? game.user.character;
  if (!actor) return ui.notifications.warn("Selecciona el token de quien festeja.");
  const d = datosFestejo(actor, festejoDe({ natural, tipo: "attack", esPJ: !enemigo, enemigo: true }), tok?.document);
  if (todos && game.user.isGM) game.socket.emit(`module.${MOD}`, { ecosFestejo: d });
  festejar(d);
}
/** El dueño de la ficha elige su frase para el 20 y para el 1. */
export async function fraseFestejo(actor) {
  if (!actor?.isOwner) return ui.notifications.warn("Solo su dueño o el DM pone la frase.");
  const p = actor.getFlag(MOD, "festejo") ?? {};
  const r = await foundry.applications.api.DialogV2.wait({ window: { title: `Festejo de ${actor.name}`, icon: "fa-solid fa-star" }, position: { width: 440 },
    content: `<div class="ecos-dialogo"><p>Lo que grita en pantalla cuando saca un 20 o un 1 natural. Vacío = el grito de siempre («¡CRÍTICO!», «¡PIFIA!»).</p>
      <label>Con un 20 <input name="frase20" maxlength="40" value="${esc(p.frase20 ?? "")}" placeholder="¡CRÍTICO!"></label>
      <label>Con un 1 <input name="frase1" maxlength="40" value="${esc(p.frase1 ?? "")}" placeholder="¡PIFIA!"></label></div>`,
    buttons: [{ action: "ok", label: "Guardar", icon: "fa-solid fa-check", default: true, callback: (_e, b) => Object.fromEntries(new FormData(b.form)) },
      { action: "probar", label: "Probar (solo tú)", icon: "fa-solid fa-play", callback: (_e, b) => ({ ...Object.fromEntries(new FormData(b.form)), probar: true }) },
      { action: "no", label: "Cancelar" }], rejectClose: false });
  if (!r || r === "no") return;
  await actor.setFlag(MOD, "festejo", { frase20: String(r.frase20 ?? "").slice(0, 40), frase1: String(r.frase1 ?? "").slice(0, 40) });
  if (r.probar) await lanzarFestejo({ natural: 20, todos: false, actor });
}
/** Ventana del DM: probar, lanzar a todos y la frase del token seleccionado. */
export async function abrirFestejo() {
  const r = await foundry.applications.api.DialogV2.wait({ window: { title: "Festejo del 20 natural", icon: "fa-solid fa-star" }, position: { width: 460 },
    content: `<div class="ecos-dialogo"><p>Con un 20 natural sale a pantalla completa el retrato de quien tiró, con un grito. Lo ven todos los que ven la tirada. Se apaga en los ajustes del módulo («Festejo del 20 natural»); cada jugador apaga el temblor en los suyos.</p>
      <p>Usa el token seleccionado. «Lanzar a todos» lo pone a mano en la pantalla de todos.</p></div>`,
    buttons: [{ action: "todos20", label: "Lanzar un 20 a todos", icon: "fa-solid fa-star" }, { action: "todos1", label: "Lanzar un 1 a todos", icon: "fa-solid fa-skull" },
      { action: "terror", label: "20 de enemigo (terror)", icon: "fa-solid fa-ghost" }, { action: "burla", label: "1 de enemigo (burla)", icon: "fa-solid fa-face-grin-squint-tears" },
      { action: "probar", label: "Probar (solo yo)", icon: "fa-solid fa-play" }, { action: "frase", label: "Frase del token", icon: "fa-solid fa-quote-left" }], rejectClose: false });
  const actor = canvas?.tokens?.controlled?.[0]?.actor ?? game.user.character;
  if (r === "todos20") return lanzarFestejo({ natural: 20, todos: true });
  if (r === "todos1") return lanzarFestejo({ natural: 1, todos: true });
  if (r === "terror") return lanzarFestejo({ natural: 20, todos: true, enemigo: true });
  if (r === "burla") return lanzarFestejo({ natural: 1, todos: true, enemigo: true });
  if (r === "probar") return lanzarFestejo({ natural: 20, todos: false });
  if (r === "frase") return actor ? fraseFestejo(actor) : ui.notifications.warn("Selecciona un token.");
}
if (globalThis.Hooks) {
  Hooks.once("init", () => {
    const reg = (k, o) => game.settings.register(MOD, k, { config: true, ...o });
    reg("festejo20", { name: "Festejo del 20 natural (pantalla completa)", hint: "Con un 20 natural sale el retrato de quien tiró con un grito, a pantalla completa, para todos los que ven la tirada. Un clic lo salta.", scope: "world", type: Boolean, default: true });
    reg("festejoQuien", { name: "Festejo: de quién", scope: "world", type: String, default: "pj", choices: { pj: "Solo los personajes de los jugadores", todos: "PJ y PNJ" } });
    reg("festejoUno", { name: "Festejo: también el 1 natural (Pifia)", scope: "world", type: Boolean, default: true });
    reg("festejoEnemigo", { name: "Festejo del enemigo: terror y burla", hint: "Con «Solo los personajes de los jugadores»: el 20 natural de un PNJ sale como terror (oscuridad, latido y retumbe) y su 1 como burla (un duendecillo se ríe). Solo lo ve quien ve la tirada.", scope: "world", type: Boolean, default: true });
    reg("festejoSoloAtaques", { name: "Festejo: solo ataques y salvaciones de muerte", hint: "Apagado, también salvaciones y pruebas de característica.", scope: "world", type: Boolean, default: false });
    reg("festejoConSonido", { name: "Festejo: con sonido", scope: "world", type: Boolean, default: true });
    reg("festejoSonido", { name: "Festejo: sonido", hint: "Vacío = el tambor de inicio de combate de Foundry.", scope: "world", type: String, default: "", filePicker: "audio" });
    reg("festejoTemblor", { name: "Festejo: temblor de pantalla", hint: "Solo para ti. Apágalo si te marea.", scope: "client", type: Boolean, default: true });
  });
  Hooks.on("createChatMessage", m => { alMensaje(m).catch(err => console.error(`${MOD} | festejo`, err)); });
  Hooks.once("ready", () => {
    game.socket.on(`module.${MOD}`, d => { if (d?.ecosFestejo && leer("festejo20", true)) festejar(d.ecosFestejo); });
    const api = game.modules.get(MOD)?.api;
    if (api) api.festejo = { abrir: abrirFestejo, lanzar: lanzarFestejo, frase: fraseFestejo };
  });
}
