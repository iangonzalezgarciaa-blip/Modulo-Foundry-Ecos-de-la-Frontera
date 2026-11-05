/**
 * Control del jugador en la tirada (tareas 1.5 y 1.6).
 * 1.5 · Cada ataque pregunta Normal, Ventaja o Desventaja con la ventana nativa de dnd5e, aunque midi-qol la salte.
 *       Si el sistema ya detecta ventaja o desventaja, la ventana lo dice y pregunta si la usa.
 * 1.6 · Antes de que un ataque, salvación o técnica ponga un estado en otra criatura, quien ataca decide:
 *       «¿Aplicar Derribado? Qué provoca…». Si ataca un PNJ, el jugador que defiende recibe el aviso.
 * Cada cosa tiene su ajuste de mundo para apagarla.
 */
import { sistema } from "./sistema/index.js";
const MOD = "ecos-frontera";
const AJ = { ventaja: "preguntarVentaja", estados: "preguntarEstados", moneda: "pausaMoneda" };
const ajuste = k => { try { return game.settings.get(MOD, k); } catch { return null; } };
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[c]);
const sinEtiquetas = s => String(s ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

/** Qué provoca cada estado del sistema, en una línea (los del Verbe traen su propio texto). */
export const QUE_PROVOCA = {
  prone: "Derribado: se mueve gateando, desventaja en sus ataques; los ataques cuerpo a cuerpo contra él tienen ventaja.",
  stunned: "Aturdido: incapacitado, no se mueve, falla salvaciones de FUE y DES, y los ataques contra él tienen ventaja.",
  grappled: "Agarrado: su velocidad es 0.",
  restrained: "Apresado: velocidad 0, desventaja en sus ataques y salvaciones de DES; los ataques contra él tienen ventaja.",
  frightened: "Asustado: desventaja en pruebas y ataques mientras vea la fuente; no puede acercarse a ella.",
  charmed: "Hechizado: no puede atacar a quien lo hechizó, que tiene ventaja en tratos sociales con él.",
  blinded: "Cegado: falla lo que pide ver; desventaja en sus ataques y ventaja en los ataques contra él.",
  deafened: "Ensordecido: falla lo que pide oír.",
  poisoned: "Envenenado: desventaja en ataques y pruebas de característica.",
  paralyzed: "Paralizado: incapacitado, falla FUE y DES, y un golpe cuerpo a cuerpo cercano es crítico.",
  incapacitated: "Incapacitado: no puede hacer acciones ni reacciones.",
  petrified: "Petrificado: convertido en piedra, incapacitado y con resistencia a todo el daño.",
  unconscious: "Inconsciente: incapacitado, cae, falla FUE y DES; un golpe cuerpo a cuerpo cercano es crítico.",
  invisible: "Invisible: no se le ve sin ayuda; ventaja en sus ataques y desventaja en los ataques contra él.",
  exhaustion: "Agotamiento: un nivel más."
};
const NO_PREGUNTAR = new Set(["concentrating", "dead", "bleeding", "burrowing", "flying", "hovering", "marked", "surprised", "transformed", "ethereal", "silenced", "sleeping", "cursed", "dodging", "hiding"]);

export function nombreEstado(id) {
  const s = (globalThis.CONFIG?.statusEffects ?? []).find(x => x.id === id);
  const n = s?.name ? (game.i18n?.localize?.(s.name) ?? s.name) : null;
  return n || id;
}
export function queProvoca(id) {
  const s = (globalThis.CONFIG?.statusEffects ?? []).find(x => x.id === id);
  return QUE_PROVOCA[id] ?? (sinEtiquetas(s?.description) || "Revisa su texto en la ficha.");
}

/** ¿Hay que preguntar por este efecto? Solo estados que una criatura pone a OTRA (por origen). */
export function pideConfirmacion(efecto, objetivo, atacante) {
  const st = [...(efecto?.statuses ?? [])].filter(s => !NO_PREGUNTAR.has(s));
  if (!st.length || !atacante || !objetivo) return [];
  if (atacante === objetivo || (atacante.uuid && atacante.uuid === objetivo.uuid)) return [];
  if (efecto?.flags?.[MOD]?.sinPregunta) return [];
  return st;
}

/** El actor que pone el efecto, a partir de su origen (objeto, actividad o actor). */
function actorDeOrigen(origen) {
  if (!origen) return null;
  let doc = null;
  try { doc = fromUuidSync(origen, { strict: false }); } catch { doc = null; }
  if (!doc) return null;
  if (doc instanceof Actor) return doc;
  return doc.actor ?? doc.parent?.actor ?? (doc.parent instanceof Actor ? doc.parent : null) ?? doc.item?.actor ?? null;
}

/* ---------- 1.7 · Pausa para la Moneda Antigua ---------- */
const esUnoNatural = r => !!r && (r.dice?.[0]?.faces === 20) && (r.isFumble === true);
/** ¿Se ofrece repetir con una Moneda Antigua? Devuelve el motivo para el aviso, o null. `objetivo` es la CA o la CD. */
export function motivoPausaMoneda(roll, { objetivo = null, modo = "fallo" } = {}) {
  if (!roll || modo === "apagado") return null;
  if (esUnoNatural(roll)) return "saca un <b>1 natural</b>";
  if (modo !== "fallo" || roll.isCritical || !Number.isFinite(objetivo)) return null;
  return roll.total < objetivo ? `falla (<b>${roll.total}</b> contra ${objetivo})` : null;
}

/* ---------- 1.5 · Normal, ventaja o desventaja ---------- */
export function forzarPreguntaAtaque(config, dialog) {
  if (!dialog || dialog.configure === true && dialog.options?.ecosPregunta) return false;
  dialog.configure = true;
  dialog.options ??= {};
  dialog.options.ecosPregunta = { ventaja: !!config?.advantage, desventaja: !!config?.disadvantage };
  return true;
}
export function avisoVentaja(p) {
  if (!p) return "";
  const det = p.ventaja && !p.desventaja ? "El sistema detecta <b>ventaja</b> (por estados o efectos). ¿La usas? Pulsa «Ventaja»; si no, «Normal»."
    : p.desventaja && !p.ventaja ? "El sistema detecta <b>desventaja</b> (por estados o efectos). Si de verdad la tienes, pulsa «Desventaja»; si el DM dice que no, «Normal»."
      : p.ventaja && p.desventaja ? "Hay ventaja y desventaja a la vez: se anulan. Lo normal es «Normal»." : "";
  return `<p class="ecos-nota ecos-pregunta-ventaja"><b>Ecos:</b> elige cómo tiras: Normal, Ventaja o Desventaja.${det ? ` ${det}` : ""}</p>`;
}

/* ---------- 1.6 · Preguntar antes de poner un estado ---------- */
const cola = new Map(); // clave → { atacante, fuente, nombre, estados, data, objetivos: [{actor, data}], t }
const ESPERAS = new Map();

function encolar(atacante, fuenteNombre, estados, objetivo, data) {
  const clave = `${atacante.uuid}|${data.name}|${estados.join(",")}`;
  let g = cola.get(clave);
  if (!g) { g = { atacante, fuenteNombre, estados, nombre: data.name, objetivos: [] }; cola.set(clave, g); }
  g.objetivos.push({ actor: objetivo, data });
  clearTimeout(g.t);
  g.t = setTimeout(() => { cola.delete(clave); resolverGrupo(g).catch(err => console.error(`${MOD} | preguntar estados`, err)); }, 250);
}

function quienDecide(atacante) {
  return game.users.find(u => u.active && !u.isGM && atacante.testUserPermission(u, "OWNER")) ?? game.users.activeGM ?? null;
}
function textoPregunta(g) {
  const lineas = g.estados.map(st => `<li><b>${esc(nombreEstado(st))}</b>: ${esc(queProvoca(st))}</li>`).join("");
  return `<p><b>${esc(g.atacante.name)}</b>${g.fuenteNombre ? ` con <b>${esc(g.fuenteNombre)}</b>` : ""} va a poner <b>${esc(g.nombre)}</b>.</p><ul>${lineas}</ul>`;
}
async function dialogoEstados(info) {
  const filas = info.objetivos.map((o, i) => `<label class="ecos-check"><input type="checkbox" name="o${i}" checked> ${esc(o.nombre)}</label>`).join("");
  const r = await foundry.applications.api.DialogV2.wait({
    window: { title: `¿Aplicar ${info.nombre}?`, icon: "fa-solid fa-circle-exclamation" },
    content: `<div class="ecos-dialogo">${info.html}<p>¿A quién se lo aplicas?</p>${filas}</div>`,
    rejectClose: false,
    buttons: [
      { action: "si", label: "Sí, aplicar", icon: "fa-solid fa-check", default: true, callback: (_e, b) => info.objetivos.map((_, i) => !!b.form.elements[`o${i}`]?.checked) },
      { action: "no", label: "No", icon: "fa-solid fa-xmark", callback: () => info.objetivos.map(() => false) }
    ]
  });
  return Array.isArray(r) ? r : null;
}
async function preguntar(atacante, info) {
  const quien = quienDecide(atacante);
  if (!quien) return null;
  if (quien.isSelf) return dialogoEstados(info);
  const id = foundry.utils.randomID();
  const r = await new Promise(res => {
    const t = setTimeout(() => { ESPERAS.delete(id); res(null); }, 30000);
    ESPERAS.set(id, v => { clearTimeout(t); res(v); });
    game.socket.emit(`module.${MOD}`, { ctl: true, accion: "ctlEstados", id, para: quien.id, de: game.user.id, info });
  });
  // Sin respuesta del jugador: decide el DM.
  if (r === null && game.user.isGM) return dialogoEstados({ ...info, html: `${info.html}<p class="ecos-nota">El jugador no respondió a tiempo.</p>` });
  return r;
}
async function resolverGrupo(g) {
  const info = { nombre: g.nombre, html: textoPregunta(g), objetivos: g.objetivos.map(o => ({ nombre: o.actor.name, uuid: o.actor.uuid })) };
  // Si ataca un PNJ, el jugador que defiende se entera de qué le quieren poner.
  if (!g.atacante.hasPlayerOwner) for (const o of g.objetivos) {
    const jugadores = game.users.filter(u => !u.isGM && o.actor.testUserPermission(u, "OWNER")).map(u => u.id);
    if (jugadores.length) ChatMessage.create({ whisper: [...jugadores, ...game.users.filter(u => u.isGM).map(u => u.id)], speaker: ChatMessage.getSpeaker({ actor: g.atacante }),
      content: `<div class="ecos-card"><h3>✦ ${esc(g.nombre)}</h3>${textoPregunta(g)}<p>${esc(o.actor.name)}: el DM decide si se aplica.</p></div>` }).catch(() => null);
  }
  const si = await preguntar(g.atacante, info);
  const aplicados = [], negados = [];
  for (const [i, o] of g.objetivos.entries()) {
    if (si?.[i]) { await o.actor.createEmbeddedDocuments("ActiveEffect", [o.data], { ecosAprobado: true }); aplicados.push(o.actor.name); }
    else negados.push(o.actor.name);
  }
  if (negados.length && !si) ChatMessage.create({ whisper: game.users.filter(u => u.isGM).map(u => u.id), content: `<div class="ecos-card"><p>${esc(g.nombre)} no se aplicó a ${negados.map(esc).join(", ")}: nadie respondió. Si correspondía, ponlo a mano.</p></div>` }).catch(() => null);
  return { aplicados, negados };
}

function preCrearEfecto(efecto, data, opciones, userId) {
  if (userId !== game.user.id || opciones?.ecosAprobado || ajuste(AJ.estados) === false) return;
  const objetivo = efecto.parent;
  if (!(objetivo instanceof Actor)) return;
  const atacante = actorDeOrigen(efecto.origin ?? data?.origin);
  const estados = pideConfirmacion({ statuses: efecto.statuses ?? new Set(data?.statuses ?? []), flags: efecto.flags ?? data?.flags }, objetivo, atacante);
  if (!estados.length) return;
  let fuente = null;
  try { fuente = fromUuidSync(efecto.origin, { strict: false }); } catch { fuente = null; }
  const datos = efecto.toObject();
  delete datos._id;
  encolar(atacante, fuente?.item?.name ?? fuente?.name ?? "", estados, objetivo, datos);
  return false;
}

function socketControl(d) {
  if (!d?.ctl) return false;
  if (d.accion === "ctlEstados" && d.para === game.user.id) {
    dialogoEstados(d.info).catch(() => null).then(v => game.socket.emit(`module.${MOD}`, { ctl: true, accion: "ctlEstadosR", id: d.id, para: d.de, v: v ?? null }));
  } else if (d.accion === "ctlEstadosR" && d.para === game.user.id) {
    ESPERAS.get(d.id)?.(Array.isArray(d.v) ? d.v : null);
    ESPERAS.delete(d.id);
  }
  return true;
}

Hooks.once("init", () => {
  game.settings.register(MOD, AJ.ventaja, {
    name: "Preguntar ventaja en cada ataque",
    hint: "Cada ataque abre la ventana de dnd5e para elegir Normal, Ventaja o Desventaja (aunque midi-qol tire rápido). Si el sistema detecta ventaja o desventaja, la ventana lo avisa.",
    scope: "world", config: true, type: Boolean, default: true
  });
  game.settings.register(MOD, AJ.estados, {
    name: "Preguntar antes de aplicar estados",
    hint: "Cuando un ataque, salvación o técnica va a poner un estado (Derribado, Aturdido, Ardiendo…) en otra criatura, quien ataca decide si se aplica. Si ataca un PNJ, el jugador que defiende recibe el aviso.",
    scope: "world", config: true, type: Boolean, default: true
  });
  game.settings.register(MOD, AJ.moneda, {
    name: "Pausa para la Moneda Antigua",
    hint: "Después de tirar y antes de aplicar el resultado, un PJ con Monedas Antiguas puede gastar una para repetir.",
    scope: "world", config: true, type: String, default: "fallo",
    choices: { fallo: "Cuando falla un ataque o una salvación, o saca un 1", uno: "Solo con un 1 natural", apagado: "Nunca" }
  });
});
Hooks.once("ready", () => {
  // Después de midi-qol: así esta pregunta gana a su tirada rápida.
  sistema.gancho("antesDeAtacar", (config, dialog) => { if (ajuste(AJ.ventaja)) forzarPreguntaAtaque(config, dialog); });
  Hooks.on("renderAttackRollConfigurationDialog", (app, html) => {
    const p = app.options?.ecosPregunta;
    const el = html instanceof HTMLElement ? html : html?.[0];
    if (!p || !el || el.querySelector(".ecos-pregunta-ventaja")) return;
    const caja = document.createElement("div");
    caja.innerHTML = avisoVentaja(p);
    (el.querySelector(".window-content") ?? el).prepend(caja.firstElementChild);
  });
  Hooks.on("preCreateActiveEffect", preCrearEfecto);
  game.socket.on(`module.${MOD}`, socketControl);
  (game.modules.get(MOD).api ??= {}).control = { pideConfirmacion, queProvoca, nombreEstado };
});

export const _prueba = { encolar, resolverGrupo, preCrearEfecto, socketControl, actorDeOrigen };
