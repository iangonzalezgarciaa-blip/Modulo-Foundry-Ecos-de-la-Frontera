/**
 * Música de YouTube sincronizada (tareas 5.1b y 5.1c). Usa solo el reproductor oficial incrustado de YouTube
 * (visible, 200 × 200 como mínimo): no descarga ni separa el audio. El DM pone un enlace o una cola; cada jugador
 * lo oye en su cliente, a la vez, y elige su volumen.
 */
const MOD = "ecos-frontera", AJ = "musicaYT", VOL = "musicaVolumen";
let reproductor = null, cargandoApi = null, ultimo = null;
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
  c = document.createElement("div");
  c.id = "ecos-musica";
  c.style.cssText = "position:fixed;left:8px;bottom:8px;width:200px;height:228px;z-index:70;background:#111;border:1px solid #444;border-radius:6px;overflow:hidden";
  c.innerHTML = `<div style="height:28px;display:flex;align-items:center;justify-content:space-between;padding:0 6px;color:#ddd;font-size:12px"><span>♪ Música de la mesa</span><button type="button" data-cerrar style="width:auto;line-height:18px;padding:0 6px" title="Solo en tu equipo; la música sigue para los demás">Silenciar</button></div><div id="ecos-musica-yt"></div>`;
  const boton = c.querySelector("[data-cerrar]");
  boton.addEventListener("click", () => {
    if (!reproductor) return;
    if (reproductor.isMuted?.()) { reproductor.unMute(); boton.textContent = "Silenciar"; c.style.opacity = "1"; }
    else { reproductor.mute(); boton.textContent = "Volver a oír"; c.style.opacity = "0.5"; }
  });
  document.body.append(c);
  return c;
}
async function aplicar() {
  const { actual } = estadoMusica();
  if (!actual?.id) { reproductor?.stopVideo?.(); document.getElementById("ecos-musica")?.remove(); reproductor = null; ultimo = null; return; }
  caja();
  const YT = await api();
  const volumen = (() => { try { return Number(game.settings.get(MOD, VOL)); } catch { return 50; } })();
  const seg = segundoActual(actual);
  if (!reproductor) {
    reproductor = await new Promise(res => {
      const p = new YT.Player("ecos-musica-yt", { width: 200, height: 200, videoId: actual.id, playerVars: { start: Math.floor(seg), autoplay: 1, playsinline: 1 },
        events: { onReady: e => { e.target.setVolume(volumen); res(p); }, onStateChange: e => { if (e.data === 0 && game.user.isGM && (!game.users.activeGM || game.users.activeGM.isSelf)) siguiente().catch(() => null); } } });
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
export async function siguiente() { const e = estadoMusica(), [prox, ...resto] = e.cola ?? []; await guardar({ cola: resto, actual: prox ? { id: prox.id, desde: Date.now(), pausadoEn: null } : null }); }
export function musicaHTML() {
  if (!game.user.isGM) return "";
  const e = estadoMusica(), esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[c]);
  return `<section><h3>Música de YouTube</h3><p>Pega un enlace: suena para todos a la vez, cada uno con su volumen (Ajustes del módulo). Se usa el reproductor oficial de YouTube, visible abajo a la izquierda.</p>
    <div class="em-fila"><label>Enlace<input name="musicaUrl" placeholder="https://www.youtube.com/watch?v=…"></label><button type="button" data-em="musica" data-id="reproducir">Reproducir</button><button type="button" data-em="musica" data-id="encolar">Añadir a la cola</button></div>
    <div class="em-fila"><button type="button" data-em="musica" data-id="pausar">Pausa</button><button type="button" data-em="musica" data-id="seguir">Seguir</button><button type="button" data-em="musica" data-id="siguiente">Siguiente</button><button type="button" data-em="musica" data-id="detener">Detener</button></div>
    <p class="ecos-nota">${e.actual ? `Suena: ${esc(e.actual.id)}${Number.isFinite(e.actual.pausadoEn) ? " (en pausa)" : ""}.` : "No suena nada."} En cola: ${(e.cola ?? []).length}.</p></section>`;
}
Hooks.once("init", () => {
  game.settings.register(MOD, AJ, { scope: "world", config: false, type: Object, default: { cola: [], actual: null } });
  game.settings.register(MOD, VOL, { name: "Volumen de la música de YouTube", hint: "Solo en tu equipo. La música la elige el DM.", scope: "client", config: true, type: Number, range: { min: 0, max: 100, step: 5 }, default: 50, onChange: v => reproductor?.setVolume?.(Number(v)) });
});
Hooks.once("ready", () => { if (estadoMusica().actual) aplicar().catch(err => console.warn(`${MOD} | música`, err)); });
const alCambiar = s => { if (s.key === `${MOD}.${AJ}`) aplicar().catch(err => console.warn(`${MOD} | música`, err)); };
Hooks.on("updateSetting", alCambiar);
Hooks.on("createSetting", alCambiar);
