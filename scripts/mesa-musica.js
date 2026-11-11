/**
 * Música de YouTube sincronizada (tareas 5.1b y 5.1c). Usa solo el reproductor oficial incrustado de YouTube
 * (visible, 200 × 200 como mínimo; desde 3.25 cada uno lo mueve y le cambia el tamaño): no descarga ni separa el audio. El DM pone un enlace o una cola; cada jugador
 * lo oye en su cliente, a la vez, y elige su volumen.
 */
const MOD = "ecos-frontera", AJ = "musicaYT", VOL = "musicaVolumen", CAJA = "musicaCaja";
let reproductor = null, cargandoApi = null, ultimo = null;
/* El recuadro se mueve y cambia de tamaño (3.25), cada uno en su equipo. El video nunca baja de 200 × 200,
 * el mínimo que pide el reproductor de YouTube; la barra de arriba suma 28 px. */
export const BARRA = 28, MIN_ANCHO = 200, MIN_ALTO = 200 + BARRA, CAJA_GRANDE = { w: 480, h: 270 + BARRA };
const num = (v, d) => (Number.isFinite(Number(v)) && (v !== null) && (v !== "") ? Number(v) : d);
/** Deja el recuadro dentro de la ventana y nunca menor que el mínimo. Sin datos, va abajo a la izquierda. Puro. */
export function ajustarCaja(c, vw, vh) {
  const w = Math.round(Math.min(Math.max(num(c?.w, MIN_ANCHO), MIN_ANCHO), Math.max(MIN_ANCHO, vw)));
  const h = Math.round(Math.min(Math.max(num(c?.h, MIN_ALTO), MIN_ALTO), Math.max(MIN_ALTO, vh)));
  const x = Math.round(Math.min(Math.max(num(c?.x, 8), 0), Math.max(0, vw - w)));
  const y = Math.round(Math.min(Math.max(num(c?.y, vh - h - 8), 0), Math.max(0, vh - h)));
  return { x, y, w, h };
}
/** Achicar (signo −1) o agrandar (+1) un 25 %, en proporción de video y sin moverse de su esquina de abajo. Puro. */
export function pasoCaja(c, signo, vw, vh) {
  const k = ajustarCaja(c, vw, vh);
  const w = k.w * (signo > 0 ? 1.25 : 0.8);
  const h = Math.max(MIN_ALTO, Math.round(w * 9 / 16) + BARRA);
  return ajustarCaja({ x: k.x, y: k.y + k.h - h, w, h }, vw, vh);
}
/** Doble clic en la barra: de chico a grande y de grande a chico, sin salirse de la ventana. Puro. */
export function alternarCaja(c, vw, vh) {
  const k = ajustarCaja(c, vw, vh);
  const grande = (k.w >= CAJA_GRANDE.w) || (k.h >= CAJA_GRANDE.h);
  const t = grande ? { w: MIN_ANCHO, h: MIN_ALTO } : CAJA_GRANDE;
  return ajustarCaja({ x: k.x, y: k.y + k.h - t.h, ...t }, vw, vh);
}
const cajaGuardada = () => { try { return game.settings.get(MOD, CAJA) || null; } catch { return null; } };
let cajaActual = null;
function pintarCaja(c, k) {
  cajaActual = k;
  Object.assign(c.style, { left: `${k.x}px`, top: `${k.y}px`, width: `${k.w}px`, height: `${k.h}px`, bottom: "auto" });
}
function guardarCaja(k) { try { game.settings.set(MOD, CAJA, k); } catch { /* sin ajuste registrado (pruebas) */ } }
/** Mover (desde la barra) o cambiar el tamaño (desde la esquina). Durante el arrastre el video no recibe el ratón,
 *  para que el puntero no se pierda dentro del reproductor. */
function arrastrar(ev, c, modo) {
  if ((ev.button !== 0) || ev.target.closest("button")) return;
  ev.preventDefault();
  const ini = cajaActual ?? ajustarCaja(cajaGuardada(), innerWidth, innerHeight), x0 = ev.clientX, y0 = ev.clientY;
  const video = c.querySelector("iframe");
  if (video) video.style.pointerEvents = "none";
  c.style.zIndex = "100";
  const mover = e => {
    const dx = e.clientX - x0, dy = e.clientY - y0;
    pintarCaja(c, ajustarCaja(modo === "mover" ? { ...ini, x: ini.x + dx, y: ini.y + dy } : { ...ini, w: ini.w + dx, h: ini.h + dy }, innerWidth, innerHeight));
  };
  const soltar = () => {
    window.removeEventListener("pointermove", mover); window.removeEventListener("pointerup", soltar);
    if (video) video.style.pointerEvents = "";
    c.style.zIndex = "70";
    guardarCaja(cajaActual);
  };
  window.addEventListener("pointermove", mover); window.addEventListener("pointerup", soltar);
}
function estiloCaja() {
  if (document.getElementById("ecos-musica-css")) return;
  const s = document.createElement("style");
  s.id = "ecos-musica-css";
  s.textContent = `#ecos-musica{position:fixed;z-index:70;box-sizing:border-box;padding:0;background:#111;border:0;outline:1px solid #444;border-radius:6px;overflow:hidden;box-shadow:0 2px 8px #0008}
#ecos-musica .em-barra{height:${BARRA}px;display:flex;align-items:center;gap:3px;padding:0 4px 0 6px;color:#ddd;font-size:12px;cursor:move;user-select:none}
#ecos-musica .em-vol{flex:0 1 70px;width:70px;min-width:40px;height:14px;margin:0 2px;cursor:pointer}
#ecos-musica .em-barra span{flex:1 1 auto;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#ecos-musica .em-barra button{flex:0 0 auto;width:auto;min-width:0;height:20px;line-height:18px;padding:0 5px;margin:0;font-size:12px;cursor:pointer}
#ecos-musica iframe{position:absolute;left:0;top:${BARRA}px;width:100%!important;height:calc(100% - ${BARRA}px)!important;border:0;display:block}
#ecos-musica .em-esquina{position:absolute;right:0;bottom:0;width:16px;height:16px;cursor:nwse-resize;z-index:2;background:linear-gradient(135deg,transparent 50%,#bbb 50%,#bbb 60%,transparent 60%,transparent 70%,#bbb 70%,#bbb 80%,transparent 80%)}`;
  document.head.append(s);
}
globalThis.addEventListener?.("resize", () => {
  const c = document.getElementById("ecos-musica");
  if (c && cajaActual) pintarCaja(c, ajustarCaja(cajaActual, innerWidth, innerHeight));
});
const estadoMusica = () => { try { return game.settings.get(MOD, AJ) ?? { cola: [], actual: null }; } catch { return { cola: [], actual: null }; } };
/** Saca el id de un enlace de YouTube (watch, youtu.be, shorts, embed) o acepta el id suelto. */
export function idYoutube(texto) {
  const s = String(texto ?? "").trim();
  if (/^[\w-]{11}$/.test(s)) return s;
  const m = s.match(/(?:youtu\.be\/|v=|\/embed\/|\/shorts\/)([\w-]{11})/);
  return m ? m[1] : null;
}
/** Segundos desde que empezó, contando las pausas. */
export function segundoActual(actual, ahora = Date.now()) {
  if (!actual) return 0;
  if (Number.isFinite(actual.pausadoEn)) return Math.max(0, actual.pausadoEn);
  return Math.max(0, (ahora - Number(actual.desde || ahora)) / 1000);
}
function api() {
  if (globalThis.YT?.Player) return Promise.resolve(globalThis.YT);
  if (cargandoApi) return cargandoApi;
  cargandoApi = new Promise(res => {
    const previo = globalThis.onYouTubeIframeAPIReady;
    globalThis.onYouTubeIframeAPIReady = () => { previo?.(); res(globalThis.YT); };
    const s = document.createElement("script"); s.src = "https://www.youtube.com/iframe_api"; document.head.append(s);
  });
  return cargandoApi;
}
function caja() {
  let c = document.getElementById("ecos-musica");
  if (c) return c;
  estiloCaja();
  c = document.createElement("div");
  c.id = "ecos-musica";
  c.innerHTML = `<div class="em-barra" title="Arrastra para mover · doble clic: grande o chico"><span>♪ Música</span><input type="range" class="em-vol" min="0" max="100" step="5" value="${game.user.isGM ? volumenMesa() : volumenLocal()}" title="${game.user.isGM ? "Volumen para todos (la mesa)" : "Tu volumen"}"><button type="button" data-caja="menos" title="Achicar">−</button><button type="button" data-caja="mas" title="Agrandar">+</button><button type="button" data-caja="esquina" title="Volver abajo a la izquierda, tamaño chico">⟲</button><button type="button" data-cerrar title="Solo en tu equipo; la música sigue para los demás">Silenciar</button></div><div id="ecos-musica-yt"></div><div class="em-esquina" title="Arrastra para cambiar el tamaño"></div>`;
  pintarCaja(c, ajustarCaja(cajaGuardada(), innerWidth, innerHeight));
  const barra = c.querySelector(".em-barra");
  barra.addEventListener("pointerdown", e => arrastrar(e, c, "mover"));
  barra.addEventListener("dblclick", e => { if (e.target.closest("button")) return; pintarCaja(c, alternarCaja(cajaActual, innerWidth, innerHeight)); guardarCaja(cajaActual); });
  c.querySelector(".em-esquina").addEventListener("pointerdown", e => arrastrar(e, c, "tamano"));
  c.querySelectorAll("[data-caja]").forEach(b => b.addEventListener("click", () => {
    const k = b.dataset.caja === "esquina" ? ajustarCaja(null, innerWidth, innerHeight) : pasoCaja(cajaActual, b.dataset.caja === "mas" ? 1 : -1, innerWidth, innerHeight);
    pintarCaja(c, k); guardarCaja(k);
  }));
  // 3.36 (pedido del autor): el volumen va en la barra y no desaparece al pasar el ratón; el del DM vale para todos.
  const vol = c.querySelector(".em-vol");
  vol.addEventListener("pointerdown", e => e.stopPropagation());
  vol.addEventListener("dblclick", e => e.stopPropagation());
  vol.addEventListener("input", () => { reproductor?.setVolume?.(game.user.isGM ? Math.round(Number(vol.value) * volumenLocal() / 100) : Math.round(volumenMesa() * Number(vol.value) / 100)); });
  vol.addEventListener("change", () => {
    if (game.user.isGM) { const e = estadoMusica(); guardar({ ...e, volumen: Number(vol.value) }).catch(() => null); }
    else game.settings.set(MOD, VOL, Number(vol.value)).catch(() => null);
  });
  const boton = c.querySelector("[data-cerrar]");
  boton.addEventListener("click", () => {
    if (!reproductor) return;
    if (reproductor.isMuted?.()) { reproductor.unMute(); boton.textContent = "Silenciar"; c.style.opacity = "1"; }
    else { reproductor.mute(); boton.textContent = "Oír"; c.style.opacity = "0.5"; }
  });
  document.body.append(c);
  return c;
}
const volumenLocal = () => { try { return Number(game.settings.get(MOD, VOL)); } catch { return 50; } };
const volumenMesa = () => { const v = Number(estadoMusica().volumen); return Number.isFinite(v) ? v : 100; };
/** El volumen que suena: el de la mesa (lo pone el DM para todos) por el tuyo. Puro. */
export const volumenEfectivo = (mesa, propio) => Math.round(Math.max(0, Math.min(100, Number(mesa) || 0)) * Math.max(0, Math.min(100, Number(propio) || 0)) / 100);
async function aplicar() {
  const { actual } = estadoMusica();
  if (!actual?.id) { reproductor?.stopVideo?.(); document.getElementById("ecos-musica")?.remove(); reproductor = null; ultimo = null; return; }
  caja();
  const YT = await api();
  const volumen = volumenEfectivo(volumenMesa(), volumenLocal());
  const sl = document.querySelector("#ecos-musica .em-vol"); if (sl && document.activeElement !== sl) sl.value = String(game.user.isGM ? volumenMesa() : volumenLocal());
  const seg = segundoActual(actual);
  if (!reproductor) {
    reproductor = await new Promise(res => {
      const p = new YT.Player("ecos-musica-yt", { width: 200, height: 200, videoId: actual.id, playerVars: { start: Math.floor(seg), autoplay: 1, playsinline: 1 },
        events: { onReady: e => { e.target.setVolume(volumen); res(p); }, onStateChange: e => { if (e.data === 0 && game.user.isGM && (!game.users.activeGM || game.users.activeGM.isSelf)) alTerminar().catch(() => null); } } });
    });
    ultimo = actual.id;
  } else if (ultimo !== actual.id) { reproductor.loadVideoById({ videoId: actual.id, startSeconds: seg }); ultimo = actual.id; }
  else if (!Number.isFinite(actual.pausadoEn)) { reproductor.seekTo(seg, true); reproductor.playVideo(); }
  reproductor.setVolume?.(volumen);
  if (Number.isFinite(actual.pausadoEn)) reproductor.pauseVideo?.();
}
async function guardar(estado) { if (game.user.isGM) await game.settings.set(MOD, AJ, estado); }
export async function reproducir(texto) {
  const id = idYoutube(texto); if (!id) { ui.notifications.warn("Ese enlace no es de un video de YouTube."); return false; }
  const e = estadoMusica(); await guardar({ ...e, actual: { id, desde: Date.now(), pausadoEn: null } }); return true;
}
export async function encolar(texto) {
  const id = idYoutube(texto); if (!id) { ui.notifications.warn("Ese enlace no es de un video de YouTube."); return false; }
  const e = estadoMusica(); await guardar({ ...e, cola: [...(e.cola ?? []), { id }].slice(0, 50) }); return true;
}
export async function pausar() { const e = estadoMusica(); if (e.actual) await guardar({ ...e, actual: { ...e.actual, pausadoEn: segundoActual(e.actual) } }); }
export async function seguir() { const e = estadoMusica(); if (e.actual && Number.isFinite(e.actual.pausadoEn)) await guardar({ ...e, actual: { id: e.actual.id, desde: Date.now() - e.actual.pausadoEn * 1000, pausadoEn: null } }); }
export async function detener() { const e = estadoMusica(); await guardar({ ...e, actual: null }); }
/** Al terminar un video: si «Repetir» está activo vuelve a empezar (para todos a la vez); si no, pasa al siguiente de la cola. */
export async function alTerminar() { const e = estadoMusica(); if (e.repetir && e.actual?.id) return guardar({ ...e, actual: { id: e.actual.id, desde: Date.now(), pausadoEn: null } }); return siguiente(); }
/** Repetir la canción actual: se activa o desactiva y vale hasta que se cambie. */
export async function alternarRepetir() { const e = estadoMusica(); await guardar({ ...e, repetir: !e.repetir }); }
export async function siguiente() { const e = estadoMusica(), [prox, ...resto] = e.cola ?? []; await guardar({ ...e, cola: resto, actual: prox ? { id: prox.id, desde: Date.now(), pausadoEn: null } : null }); }
export function musicaHTML() {
  if (!game.user.isGM) return "";
  const e = estadoMusica(), esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[c]);
  return `<section><h3>Música de YouTube</h3><p>Pega un enlace: suena para todos a la vez, cada uno con su volumen (Ajustes del módulo). Se usa el reproductor oficial de YouTube, abajo a la izquierda: cada uno puede moverlo desde su barra y cambiarle el tamaño desde la esquina o con − y +.</p>
    <div class="em-fila"><label>Enlace<input name="musicaUrl" placeholder="https://www.youtube.com/watch?v=…"></label><button type="button" data-em="musica" data-id="reproducir">Reproducir</button><button type="button" data-em="musica" data-id="encolar">Añadir a la cola</button></div>
    <div class="em-fila"><button type="button" data-em="musica" data-id="pausar">Pausa</button><button type="button" data-em="musica" data-id="seguir">Seguir</button><button type="button" data-em="musica" data-id="siguiente">Siguiente</button><button type="button" data-em="musica" data-id="repetir" aria-pressed="${e.repetir ? "true" : "false"}" title="Vuelve a empezar la canción al terminar, para todos">${e.repetir ? "🔁 Repetir: sí" : "🔁 Repetir: no"}</button><button type="button" data-em="musica" data-id="detener">Detener</button></div>
    <p class="ecos-nota">${e.actual ? `Suena: ${esc(e.actual.id)}${Number.isFinite(e.actual.pausadoEn) ? " (en pausa)" : ""}${e.repetir ? " · se repite" : ""}.` : "No suena nada."} En cola: ${(e.cola ?? []).length}.</p></section>`;
}
Hooks.once("init", () => {
  game.settings.register(MOD, AJ, { scope: "world", config: false, type: Object, default: { cola: [], actual: null } });
  game.settings.register(MOD, CAJA, { scope: "client", config: false, type: Object, default: null });
  game.settings.register(MOD, VOL, { name: "Volumen de la música de YouTube", hint: "Solo en tu equipo. La música la elige el DM.", scope: "client", config: true, type: Number, range: { min: 0, max: 100, step: 5 }, default: 50, onChange: v => reproductor?.setVolume?.(volumenEfectivo(volumenMesa(), Number(v))) });
});
Hooks.once("ready", () => { if (estadoMusica().actual) aplicar().catch(err => console.warn(`${MOD} | música`, err)); });
const alCambiar = s => { if (s.key === `${MOD}.${AJ}`) aplicar().catch(err => console.warn(`${MOD} | música`, err)); };
Hooks.on("updateSetting", alCambiar);
Hooks.on("createSetting", alCambiar);
