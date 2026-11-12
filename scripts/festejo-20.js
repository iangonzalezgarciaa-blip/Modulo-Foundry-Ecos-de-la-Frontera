/**
 * 3.47 · Festejo del 20 natural (pedido del autor, 12-nov-2026: «me gusta la animación de Yugen, imítala»; Yugen Criticals
 * no corre en Foundry 14.370). Corte a pantalla completa al estilo de los RPG tácticos japoneses: destello, una banda en
 * diagonal con líneas de velocidad, el retrato del personaje entrando de lado y el grito que golpea la pantalla. Lo ve todo el
 * que ve la tirada, a la vez. Código y diseño propios.
 *  - Tema por la naturaleza del Verbe (Fuego, Agua, Viento, Tierra, Rayo) o dorado; el 1 natural es «Pifia» (rojo oscuro).
 *  - Salvación de muerte con 20: «¡SE LEVANTA!». Frase propia por personaje (el dueño la pone desde el panel de acciones).
 *  - Espera a que terminen los dados 3D (Dice So Nice) si están. Un clic lo salta.
 * Regla del autor: se apaga en los ajustes, el temblor se apaga por jugador y el DM lo lanza a mano desde su menú.
 */
const MOD = "ecos-frontera";
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
export const TEMAS = {
  dorado: { c1: "#f6d365", c2: "#b8860b", c3: "#3a2a05", n: "Dorado" },
  fuego: { c1: "#ffb347", c2: "#e2361f", c3: "#3d0a02", n: "Fuego" },
  agua: { c1: "#8fd3ff", c2: "#1f6fd1", c3: "#04203f", n: "Agua" },
  viento: { c1: "#c8ffd9", c2: "#2fb57a", c3: "#06301f", n: "Viento" },
  tierra: { c1: "#e8c690", c2: "#8a5a2b", c3: "#2a1906", n: "Tierra" },
  rayo: { c1: "#fff36b", c2: "#8a4dff", c3: "#1a0b3d", n: "Rayo" },
  pifia: { c1: "#ff8a8a", c2: "#7a0b0b", c3: "#120202", n: "Pifia" }
};
/** Qué festejo toca para una tirada. Puro. null = nada. */
export function festejoDe({ natural, tipo, esPJ = true, quien = "pj", conUno = true, soloAtaques = false } = {}) {
  if (natural !== 20 && natural !== 1) return null;
  if (natural === 1 && !conUno) return null;
  if (!esPJ && quien !== "todos") return null;
  if (!tipo || ["initiative", "concentration", "damage", "healing", "hitDie", "hitPoints"].includes(tipo)) return null;
  if (soloAtaques && tipo !== "attack" && tipo !== "death") return null;
  const grito = natural === 1 ? (tipo === "death" ? "¡SE APAGA!" : "¡PIFIA!")
    : tipo === "attack" ? "¡CRÍTICO!" : tipo === "death" ? "¡SE LEVANTA!" : "¡20 NATURAL!";
  return { natural, grito, tipo };
}
/** El tema: naturaleza del Verbe si la tiene; la pifia siempre es roja. Puro. */
export const temaDe = (natural, nat) => natural === 1 ? "pifia" : (TEMAS[nat] ? nat : "dorado");

/* ---------------- Foundry ---------------- */
const leer = (k, d) => { try { return game.settings.get(MOD, k); } catch { return d; } };
const COLA = [];
let sonando = false;
function imagenDe(actor, tokenDoc) {
  const a = actor?.img ?? "", t = tokenDoc?.texture?.src ?? actor?.prototypeToken?.texture?.src ?? "";
  const pobre = s => !s || /mystery-man|\.svg$/i.test(s);
  return pobre(a) && !pobre(t) ? t : (a || t || "icons/svg/mystery-man.svg");
}
function chispas(n = 18) {
  return Array.from({ length: n }, () => {
    const ang = Math.random() * Math.PI * 2, d = 25 + Math.random() * 45;
    return `<i style="--x:${(Math.cos(ang) * d).toFixed(1)}vw;--y:${(Math.sin(ang) * d).toFixed(1)}vh;--t:${(0.5 + Math.random() * 0.7).toFixed(2)}s;--r:${Math.floor(Math.random() * 360)}deg"></i>`;
  }).join("");
}
async function mostrar(d) {
  const T = TEMAS[d.tema] ?? TEMAS.dorado;
  const el = document.createElement("div");
  el.id = "ecos-festejo";
  el.className = `ef-tema-${d.tema} ${d.natural === 1 ? "ef-uno" : "ef-veinte"}`;
  el.style.setProperty("--c1", T.c1); el.style.setProperty("--c2", T.c2); el.style.setProperty("--c3", T.c3);
  el.innerHTML = `<div class="ef-velo"></div><div class="ef-flash"></div>
    <div class="ef-banda"><div class="ef-lineas"></div></div>
    <div class="ef-retrato"><div class="ef-foto"><img src="${esc(d.img)}" alt=""></div></div>
    <div class="ef-texto"><div class="ef-grito">${esc(d.grito)}</div><div class="ef-nombre">${esc(d.nombre)}${d.detalle ? ` · <span>${esc(d.detalle)}</span>` : ""}</div></div>
    <div class="ef-chispas">${chispas()}</div>`;
  document.body.appendChild(el);
  const temblar = leer("festejoTemblor", true) && !window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  if (temblar) { document.body.classList.add("ecos-festejo-temblor"); setTimeout(() => document.body.classList.remove("ecos-festejo-temblor"), 650); }
  const sonido = leer("festejoSonido", "") || CONFIG.sounds?.combat;
  if (sonido && leer("festejoConSonido", true)) {
    try { (foundry.audio?.AudioHelper ?? globalThis.AudioHelper)?.play?.({ src: sonido, volume: 0.7, autoplay: true, loop: false }, false); } catch { /* sin sonido */ }
  }
  await new Promise(res => {
    const fin = () => { clearTimeout(t); el.classList.add("ef-sale"); setTimeout(() => { el.remove(); res(); }, 320); };
    const t = setTimeout(fin, 2700);
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
  return { natural: f.natural, tema: temaDe(f.natural, nat), grito: frase?.trim() ? frase.trim() : f.grito, nombre: tokenDoc?.name ?? actor?.name ?? "", detalle, img: imagenDe(actor, tokenDoc) };
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
    quien: leer("festejoQuien", "pj"), conUno: leer("festejoUno", true), soloAtaques: leer("festejoSoloAtaques", false) });
  if (!f) return;
  const tokenDoc = m.speaker?.token ? canvas?.scene?.tokens?.get(m.speaker.token) : null;
  const detalle = r.tipo === "attack" ? (m.flags?.dnd5e?.item?.name ?? fromUuidSync?.(m.flags?.dnd5e?.item?.uuid ?? "")?.name ?? "") : "";
  // Con dados 3D, espera a que caigan.
  if (game.dice3d?.waitFor3DAnimationByMessageID) await Promise.race([game.dice3d.waitFor3DAnimationByMessageID(m.id), new Promise(res => setTimeout(res, 6000))]).catch(() => null);
  festejar(datosFestejo(actor, f, tokenDoc, detalle));
}
/** El DM lo lanza a mano para todos (token seleccionado), o lo prueba solo para sí. */
export async function lanzarFestejo({ natural = 20, todos = true, actor = null } = {}) {
  const tok = canvas?.tokens?.controlled?.[0];
  actor ??= tok?.actor ?? game.user.character;
  if (!actor) return ui.notifications.warn("Selecciona el token de quien festeja.");
  const d = datosFestejo(actor, festejoDe({ natural, tipo: "attack", esPJ: true }), tok?.document);
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
      { action: "probar", label: "Probar (solo yo)", icon: "fa-solid fa-play" }, { action: "frase", label: "Frase del token", icon: "fa-solid fa-quote-left" }], rejectClose: false });
  const actor = canvas?.tokens?.controlled?.[0]?.actor ?? game.user.character;
  if (r === "todos20") return lanzarFestejo({ natural: 20, todos: true });
  if (r === "todos1") return lanzarFestejo({ natural: 1, todos: true });
  if (r === "probar") return lanzarFestejo({ natural: 20, todos: false });
  if (r === "frase") return actor ? fraseFestejo(actor) : ui.notifications.warn("Selecciona un token.");
}
if (globalThis.Hooks) {
  Hooks.once("init", () => {
    const reg = (k, o) => game.settings.register(MOD, k, { config: true, ...o });
    reg("festejo20", { name: "Festejo del 20 natural (pantalla completa)", hint: "Con un 20 natural sale el retrato de quien tiró con un grito, a pantalla completa, para todos los que ven la tirada. Un clic lo salta.", scope: "world", type: Boolean, default: true });
    reg("festejoQuien", { name: "Festejo: de quién", scope: "world", type: String, default: "pj", choices: { pj: "Solo los personajes de los jugadores", todos: "PJ y PNJ" } });
    reg("festejoUno", { name: "Festejo: también el 1 natural (Pifia)", scope: "world", type: Boolean, default: true });
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
