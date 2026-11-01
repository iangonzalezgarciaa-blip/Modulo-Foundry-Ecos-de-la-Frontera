/**
 * Ecos de la frontera · Reglas de la casa (dnd5e 5.x, Foundry v13)
 *
 * - Estados nuevos: Acechado por la Muerte, Malherido, Herida No Tratada (con niveles) y Secuela.
 * - A 0 PG los PJ quedan Acechados; sus salvaciones de muerte se tiran solas al inicio del turno.
 * - 3 fallos no matan: dejan una Secuela (−1 FUE, DES o CON). Un PJ muere con Agotamiento 6
 *   o con FUE, DES o CON en 0.
 * - Volver de 0 PG cuesta +1 Agotamiento, +1 Herida No Tratada y Malherido.
 * - Botón de Santuario en los controles de Tokens: decide qué cuenta el Descanso Largo.
 * - Descanso Largo en Santuario: recupera hasta la mitad del nivel (hacia arriba) en Dados de Golpe.
 * - Agotamiento: −1 por nivel a las tiradas d20.
 * - Botón Estabilizar en el chat y despertar automático a las 1d4 horas de juego.
 * - Magia que cura heridas (Restauración Menor, Sanar, Imposición de Manos…) detectada al usarse.
 * - Página "Estado de los PJ" que se actualiza sola en el libro de reglas.
 * - Oficios por horas: encargos a destajo con plazo en días (el día termina con el Descanso Largo),
 *   ritmo, dados de suceso, fatiga, Pericia (Novato → Maestro), Prestigio por patrón editable en la hoja.
 * - Mercadillo de Arcegris con Item Piles: tiendas con stock, encargos, servicios, descuentos por
 *   Prestigio y compra/venta automática. Precios del valle (÷10) para todo objeto de compendio.
 * - Monedas Antiguas (puntos de héroe) junto a las demás monedas.
 * - Solo DM: Reloj de la Barrera con parpadeos, botón del Eco y efectos visuales.
 * Las reglas solo valen para los PJ; el resto del mundo muere normal.
 */

import { TIENDAS } from "./catalogo.js";
import { CALENDARIO, eventosDelDia, faseLunar, diaCampana, sumarDias, mesPrimerAno } from "./calendario.js";
import "./verbe.js";
import "./mesa.js";
import "./azar.js";
import { crearCola } from "./verbe-core.js";
import { recuperacionDGLarga, presupuestoCorto, ajustarRecuperacionDG } from "./rest-core.js";
import { tipoCuracionVerbe, tratarHeridaConPulso } from "./verbe-medicina.js";

const MOD = "ecos-frontera";
const RUTA = `modules/${MOD}`;
const ABREV = { str: "FUE", dex: "DES", con: "CON" };
const NOMBRE = { str: "Fuerza", dex: "Destreza", con: "Constitución" };
const MAX_HNT = 6;
const DESCANSOS_MALHERIDO = 3;
const DIAS_TRATAMIENTO = 3;
const TARIFA_TRATAMIENTO = 2; // cobres por día con Nessa
const RESISTENTES_INICIALES = ["kij3VDH2ofqyR95p", "ktHmACdpqjhNnwTS"];
const ID_REGLAS = "G0rD0J3JkpOkXM00"; // Reglas de la casa (Libro VI)

const DESC = {
  acechado: "<p>Estás a 0 PG pero consciente. Estás Derribado: puedes hablar y arrastrarte, pero no puedes tomar acciones, acciones adicionales ni reacciones.</p><p>Al inicio de cada turno tiras una salvación de muerte (la tira el módulo). Con 3 éxitos o un 20 natural te levantas con 1 PG. Con 3 fallos no mueres: sufres una Secuela y las salvaciones vuelven a 0. Recibir daño cuenta como un fallo.</p>",
  malherido: "<p>Tus PG máximos bajan en tu nivel y ninguna curación te sube del 50 % de tus PG máximos. Una vez tratado (un día de tratamiento exitoso de un sanador en un Santuario, o magia como Restauración menor), el tope sube al 75 %.</p><p>Se quita con 3 Descansos Largos en un Santuario (no hace falta que sean seguidos). No cuentan los días con combate, viaje forzado o trabajo con Agotamiento 3 o más. Fuera de un Santuario no recuperas PG descansando ni con Dados de Golpe.</p>",
  heridant: "<p>No puedes quitarte Agotamiento con Descansos Largos.</p><p>Cada nivel se cura con 3 días de tratamiento en un Santuario: el sanador hace una prueba de Medicina (CD 10 + nivel) después de cada Descanso Largo. Si falla, el día no cuenta; con un 1 natural la herida se infecta y suma un nivel. También la curan <em>Restauración Menor</em>, <em>Sanar</em> o la Imposición de Manos (5 puntos por nivel).</p><p><em>En el token: clic izquierdo +1 nivel, clic derecho −1.</em></p>",
  secuela: "<p>Daño permanente en el cuerpo. Cada día de tratamiento exitoso devuelve 1 punto. Si la Fuerza, la Destreza o la Constitución llegan a 0, el personaje muere.</p>"
};

const EXPLICA_ACECHADO = "Está Derribado: solo puede hablar y arrastrarse. Al inicio de su turno tira salvación de muerte (la tira el módulo). <b>3 fallos</b> = Secuela, no muerte. Recibir daño = 1 fallo.";

/* ------------------------------------------------------------------ */
/*  Utilidades                                                        */
/* ------------------------------------------------------------------ */

const soyGM = () => (game.users.activeGM ? game.users.activeGM.isSelf : game.user.isGM);
const idsGM = () => game.users.filter(u => u.isGM).map(u => u.id);
const enSantuario = () => game.settings.get(MOD, "santuario");
const signo = n => (n >= 0 ? `+${n}` : `${n}`);

/** Ruta de carpetas de un documento, de la raíz hacia abajo, en minúsculas. */
function rutaCarpeta(folder) {
  const nombres = [];
  for (let f = folder; f; f = f.folder) nombres.unshift((f.name ?? "").trim().toLowerCase());
  return nombres;
}

/** ¿El actor está en la carpeta de PJ de antes (o en una subcarpeta)? Solo lo usa la migración de la 2.7.2. */
function enCarpetaPJ(actor) {
  const objetivo = String(game.settings.get(MOD, "carpetaPJ") ?? "")
    .split("/").map(s => s.trim().toLowerCase()).filter(Boolean);
  if (!objetivo.length) return false;
  for (let f = actor?.folder; f; f = f.folder) {
    const ruta = rutaCarpeta(f);
    const inicio = ruta.length - objetivo.length;
    if ((inicio >= 0) && objetivo.every((n, i) => ruta[inicio + i] === n)) return true;
  }
  return false;
}

/**
 * Las reglas de PJ se encienden hoja por hoja (botón «Ecos» de la cabecera, solo el DM): bandera ecos-frontera.pj.
 * Valen para fichas de personaje y de PNJ. Una hoja nueva nace con todo apagado. La carpeta ya no cuenta
 * (solo se usó una vez, en la 2.7.2, para dejar encendidos a los PJ que ya estaban).
 */
function esPJ(actor) {
  if (!actor || !["character", "npc"].includes(actor.type)) return false;
  return actor.getFlag?.(MOD, "pj") === true;
}
/** El nivel con el que cuentan las reglas: el de su clase o, en un PNJ, su VD (mínimo 1). */
const nivelPJ = actor => ((actor?.type === "npc")
  ? Math.max(1, Math.round(Number(actor.system.details?.cr) || 1))
  : Math.max(1, Number(actor?.system?.details?.level) || 1));
const esResistente = actor => actor?.getFlag(MOD, "portador") === true;

const efectoStatus = (actor, id) => actor.effects.find(e => e.statuses.has(id));
const efectoMalherido = actor => efectoStatus(actor, "malherido");
const efectoHNT = actor => efectoStatus(actor, "heridant");
const nivelHNT = actor => {
  const ef = efectoHNT(actor);
  return ef ? (ef.getFlag(MOD, "nivel") ?? 1) : 0;
};
const diaHNT = actor => efectoHNT(actor)?.getFlag(MOD, "dia") ?? 0;
const efectoSecuela = actor => actor.effects.find(e => e.getFlag(MOD, "tipo") === "secuela");
function valoresSecuela(actor) {
  const s = efectoSecuela(actor)?.getFlag(MOD, "puntos") ?? {};
  return { str: s.str ?? 0, dex: s.dex ?? 0, con: s.con ?? 0 };
}
const totalSecuela = actor => Object.values(valoresSecuela(actor)).reduce((t, v) => t + v, 0);
const textoSecuela = v => Object.entries(v).filter(([, n]) => n > 0).map(([k, n]) => `${ABREV[k]} −${n}`).join(" · ");
const heridoGrave = actor => !!efectoMalherido(actor) || nivelHNT(actor) > 0;
const iconoHNT = n => `${RUTA}/icons/heridant-${Math.clamp(n, 1, MAX_HNT)}.svg`;
const nombreHNT = (n, d) => `Herida No Tratada ${n} (día ${d}/${DIAS_TRATAMIENTO})`;
const nombreMalherido = (d, tratado = false) => `Malherido (${d}/${DESCANSOS_MALHERIDO})${tratado ? " · tratado" : ""}`;
/** Tratado: un día de tratamiento exitoso en un Santuario, o magia que cura heridas. Sube el tope del 50 % al 75 %. */
const malTratado = actor => !!efectoMalherido(actor)?.getFlag(MOD, "tratado");
const malSinTratar = actor => !!efectoMalherido(actor) && !malTratado(actor);
const PCT_MAL = { sin: 50, tratado: 75 };
const pctMalherido = actor => (malTratado(actor) ? PCT_MAL.tratado : PCT_MAL.sin);
const topeMalherido = actor => Math.floor(actor.system.attributes.hp.effectiveMax * pctMalherido(actor) / 100);
const statusId = id => CONFIG.statusEffects.find(s => s.id === id)?._id;
const combatantesDe = actor => game.combats.contents.flatMap(c => c.combatants.filter(x => x.actor === actor || x.actorId === actor.id));
/** Monedas Antiguas del actor: una moneda más de la hoja (system.currency.soul, por compatibilidad con la v1). */
const monedas = actor => Number(actor?.system?.currency?.soul ?? 0);
const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;

/* Datos que viajan del cliente que aplica el daño o tira la salvación a la actualización del actor. */
const PENDIENTES = new Map();
function pendiente(actor) {
  let p = PENDIENTES.get(actor.uuid);
  if (!p) PENDIENTES.set(actor.uuid, p = {});
  p.t = Date.now();
  return p;
}
function tomarPendiente(actor) {
  const p = PENDIENTES.get(actor.uuid);
  if (!p) return null;
  PENDIENTES.delete(actor.uuid);
  const { t, repeticion, ...resto } = p;
  if (repeticion) PENDIENTES.set(actor.uuid, { repeticion, t });
  if (Date.now() - t > 5000) return null;
  return Object.keys(resto).length ? resto : null;
}

/* ------------------------------------------------------------------ */
/*  Chat                                                              */
/* ------------------------------------------------------------------ */

function tarjeta(titulo, lineas = [], { clase = "", extra = "" } = {}) {
  const cuerpo = lineas.filter(Boolean).map(l => `<p>${l}</p>`).join("");
  return `<div class="ecos-card ${clase}"><h3>${titulo}</h3>${cuerpo}${extra}</div>`;
}

/** Qué hacer para quitarse cada estado, con los números actuales del actor (lista de textos). */
function itemsGuia(actor, claves = []) {
  const items = [];
  const exh = actor.system.attributes.exhaustion ?? 0;
  const nh = nivelHNT(actor);
  const mal = efectoMalherido(actor);
  for (const k of new Set(claves)) {
    if ((k === "acechado") && actor.statuses.has("acechado")) {
      if (actor.statuses.has("stable")) {
        const d = actor.getFlag(MOD, "despertar");
        const h = d ? Math.max(0, Math.ceil((d.en - game.time.worldTime) / 3600)) : null;
        items.push(`<b>Estable:</b> ya no tira salvaciones. Despierta con 1 PG${h !== null ? ` en ${h === 1 ? "1 hora" : `${h} horas`} de juego` : " en 1d4 horas"}, o antes si alguien lo cura.`);
      } else {
        items.push("<b>Acechado:</b> se levanta con 1 PG si alguien lo cura, con 3 éxitos o con un 20. Un aliado puede estabilizarlo con el botón <b>Estabilizar</b> (Medicina CD 10 o kit de sanador). Una salvación fallida se puede repetir con Esfuerzo Excesivo o una Moneda Antigua.");
      }
    } else if ((k === "derribado") && actor.statuses.has("prone")) {
      items.push("<b>Derribado:</b> en su turno gasta la mitad de su movimiento para levantarse.");
    } else if ((k === "malherido") && mal) {
      const d = mal.getFlag(MOD, "descansos") ?? 0;
      const r = DESCANSOS_MALHERIDO - d;
      items.push(`<b>Malherido (${d}/${DESCANSOS_MALHERIDO}):</b> ${r === 1 ? "falta 1 Descanso Largo" : `faltan ${r} Descansos Largos`} en un Santuario, en días sin combate. Hasta entonces la curación no lo sube de ${topeMalherido(actor)} PG${malTratado(actor) ? " (ya tratado: 75 %)" : " (50 %; cuando lo traten un sanador o la magia, sube al 75 %)"}.`);
    } else if ((k === "heridant") && nh) {
      const dias = (DIAS_TRATAMIENTO - diaHNT(actor)) + (DIAS_TRATAMIENTO * (nh - 1));
      items.push(`<b>Herida No Tratada ${nh}:</b> ${dias === 1 ? "falta 1 día" : `faltan ${dias} días`} de tratamiento. Una vez por día, alguien con Medicina (o con un kit de sanador) lo trata: CD ${10 + nh}, dentro o fuera del Santuario (botón <b>Curar</b> en su hoja; Nessa cobra ${TARIFA_TRATAMIENTO} c). Sin tratamiento, al descansar tira Constitución o se agrava. <em>Restauración Menor</em> quita un nivel.`);
    } else if ((k === "agotamiento") && (exh > 0)) {
      items.push(`<b>Agotamiento ${exh}:</b> baja 1 con cada Descanso Largo en un Santuario${nh ? ", pero solo después de curar la Herida No Tratada" : ""}.`);
    } else if ((k === "secuela") && totalSecuela(actor)) {
      items.push(`<b>Secuela (${textoSecuela(valoresSecuela(actor))}):</b> cada día de tratamiento exitoso devuelve 1 punto.`);
    } else if ((k === "intemperie") && heridoGrave(actor)) {
      items.push("<b>A la intemperie</b> no se recuperan PG descansando ni con Dados de Golpe. Que alguien le trate la herida cada día (botón <b>Curar</b>, con Medicina o un kit de sanador) para que no empeore, y vuelvan a un Santuario cuanto antes.");
    }
  }
  return items;
}

/** Bloque breve "Para recuperarse" al pie de una tarjeta. */
function guia(actor, claves = []) {
  const items = itemsGuia(actor, claves);
  return items.length ? `<div class="ecos-guia"><b>Para recuperarse</b><ul>${items.map(i => `<li>${i}</li>`).join("")}</ul></div>` : "";
}

/** Botón de tarjeta. soloDM: solo lo ve el DM. */
function boton(accion, etiqueta, icono, { tipo = "", soloDM = false } = {}) {
  return `<button type="button" data-ecos-accion="${accion}"${tipo ? ` data-tipo="${tipo}"` : ""}${soloDM ? " data-solo-dm=\"1\"" : ""}><i class="fa-solid ${icono}"></i> ${etiqueta}</button>`;
}
const cajaBotones = botones => (botones.filter(Boolean).length ? `<div class="ecos-botones">${botones.filter(Boolean).join("")}</div>` : "");
const GUIA_COMPLETA = ["derribado", "malherido", "heridant", "agotamiento", "secuela"];

function publicar(actor, titulo, lineas, opciones = {}) {
  const data = { content: tarjeta(titulo, lineas, opciones) };
  data.speaker = actor ? ChatMessage.getSpeaker({ actor }) : { alias: "Ecos de la frontera" };
  if (opciones.flags) data.flags = opciones.flags;
  if (opciones.whisper) data.whisper = opciones.whisper;
  return ChatMessage.create(data);
}

function susurrarDM(titulo, lineas, { extra = "", flags } = {}) {
  const data = {
    content: tarjeta(`🜂 ${titulo}`, lineas, { clase: "ecos-secreto", extra }),
    whisper: idsGM(),
    speaker: { alias: "Ecos de la frontera (solo DM)" }
  };
  if (flags) data.flags = flags;
  return ChatMessage.create(data);
}

/* ------------------------------------------------------------------ */
/*  Comunicación con el DM                                            */
/* ------------------------------------------------------------------ */

function alDM(datos) {
  if (soyGM()) return manejarSocket(datos);
  if (!game.users.activeGM) {
    ui.notifications.warn("Ecos de la frontera: no hay un DM conectado. Avísale para que lo aplique a mano.");
    return;
  }
  game.socket.emit(`module.${MOD}`, datos);
}

async function manejarSocket(d) {
  if (!soyGM()) return;
  try {
    const actor = d.actorId ? game.actors.get(d.actorId) : null;
    if (d.accion === "despuesDescanso" && actor) await despuesDescanso(actor, d);
    else if (d.accion === "repetir") await repetirSalvacion(d.messageId, d.tipo, d.userId);
    else if (d.accion === "estabilizar" && actor) await estabilizar(actor, d);
    else if (d.accion === "despertar" && actor) await despertar(actor, d.messageId);
    else if (d.accion === "eco" && actor) await dispararEco(actor, d.messageId);
    else if (d.accion === "magiaCura" && actor) await magiaCura(actor, d);
    else if (d.accion === "tratamiento" && actor) await aplicarTratamiento(actor, d);
    else if (d.accion === "nuevoDia" && actor) await nuevoDiaPJ(actor);
    else if (d.accion === "vigilia" && actor) await resolverVigilia(actor, d);
    else if (String(d.accion).startsWith("enc")) await accionEncuentro(d.accion, d.messageId);
    else if (String(d.accion).startsWith("vorrh")) await accionVorrh(d.accion, d.messageId);
    else if (String(d.accion).startsWith("xp")) await accionXP(d.accion, d.messageId);
  } catch (err) {
    console.error(`${MOD} |`, err);
  }
}

/* ------------------------------------------------------------------ */
/*  Estados                                                           */
/* ------------------------------------------------------------------ */

async function quitarStatus(actor, id) {
  if (efectoStatus(actor, id) || actor.statuses.has(id)) await actor.toggleStatusEffect(id, { active: false });
}

async function ponerAcechado(actor) {
  if (!actor.statuses.has("acechado")) await actor.toggleStatusEffect("acechado", { active: true });
  await quitarStatus(actor, "unconscious");
  if (!actor.getFlag(MOD, "muerto")) {
    for (const c of combatantesDe(actor)) if (c.defeated) await c.update({ defeated: false });
  }
}

async function aplicarMalherido(actor) {
  const ef = efectoMalherido(actor);
  if (ef) return ef.update({ name: nombreMalherido(0), [`flags.${MOD}.descansos`]: 0, [`flags.${MOD}.tratado`]: false });
  return actor.toggleStatusEffect("malherido", { active: true });
}

async function setHNT(actor, nivel, dia = 0) {
  nivel = Math.clamp(Math.round(nivel), 0, MAX_HNT);
  dia = Math.clamp(Math.round(dia), 0, DIAS_TRATAMIENTO - 1);
  let ef = efectoHNT(actor);
  if (nivel <= 0) {
    if (ef) await ef.delete();
    return;
  }
  if (!ef) {
    await actor.toggleStatusEffect("heridant", { active: true });
    ef = efectoHNT(actor);
  }
  await ef?.update({
    name: nombreHNT(nivel, dia), img: iconoHNT(nivel),
    [`flags.${MOD}.nivel`]: nivel, [`flags.${MOD}.dia`]: dia
  });
}

async function modificarSecuela(actor, delta) {
  const v = valoresSecuela(actor);
  for (const [k, d] of Object.entries(delta)) v[k] = Math.max(0, (v[k] ?? 0) + d);
  const ef = efectoSecuela(actor);
  const activos = Object.entries(v).filter(([, n]) => n > 0);
  if (!activos.length) {
    if (ef) await ef.delete();
    return v;
  }
  const datos = {
    name: `Secuela (${textoSecuela(v)})`,
    img: `${RUTA}/icons/secuela.svg`,
    description: DESC.secuela,
    changes: activos.map(([k, n]) => ({
      key: `system.abilities.${k}.value`, mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: String(-n)
    })),
    flags: { [MOD]: { tipo: "secuela", puntos: v } }
  };
  if (ef) await ef.update(datos);
  else await actor.createEmbeddedDocuments("ActiveEffect", [datos]);
  return v;
}

/** Tira 1d6 para elegir la característica y aplica la Secuela. */
async function secuelaTirada(actor, puntos) {
  const roll = await new Roll("1d6").evaluate();
  const stat = roll.total <= 2 ? "str" : (roll.total <= 4 ? "dex" : "con");
  await roll.toMessage({
    speaker: ChatMessage.getSpeaker({ actor }),
    flavor: `Secuela de ${actor.name} (1–2 FUE · 3–4 DES · 5–6 CON)`
  });
  await modificarSecuela(actor, { [stat]: puntos });
  return { stat, tirada: roll.total, valor: actor.system.abilities[stat].value };
}

async function sumarReloj(n) {
  const v = Math.clamp((game.settings.get(MOD, "relojBarrera") ?? 0) + n, 0, 10);
  await game.settings.set(MOD, "relojBarrera", v);
  return v;
}

/* ------------------------------------------------------------------ */
/*  Muerte                                                            */
/* ------------------------------------------------------------------ */

const MURIENDO = new Set();

async function matar(actor, causa) {
  if (actor.getFlag(MOD, "muerto") || MURIENDO.has(actor.id)) return;
  MURIENDO.add(actor.id);
  try {
    await actor.setFlag(MOD, "muerto", { causa, fecha: Date.now() });
    await quitarStatus(actor, "acechado");
    if (!actor.statuses.has("dead")) await actor.toggleStatusEffect("dead", { active: true, overlay: true });
    for (const c of combatantesDe(actor)) if (!c.defeated) await c.update({ defeated: true });
    efecto(actor, "muerte");
    await publicar(actor, "☠ Muerte", [`<b>${actor.name}</b> ha muerto: ${causa}.`], { clase: "ecos-muerte" });
  } finally {
    MURIENDO.delete(actor.id);
  }
}

async function revisarCaracteristicas(actor) {
  if (!esPJ(actor) || actor.getFlag(MOD, "muerto")) return;
  for (const k of ["str", "dex", "con"]) {
    const v = actor.system.abilities?.[k]?.value;
    if (Number.isFinite(v) && (v <= 0)) return matar(actor, `su ${NOMBRE[k]} llegó a 0`);
  }
}

/* ------------------------------------------------------------------ */
/*  Lo que pasa cuando cambian los PG (lo procesa el DM)              */
/* ------------------------------------------------------------------ */

async function procesarActualizacion(actor, changes, options) {
  const ecos = options.ecos ?? {};
  const prev = options.dnd5e?.hp;
  const hp = actor.system.attributes.hp;
  const hpCambio = !!prev && foundry.utils.hasProperty(changes, "system.attributes.hp.value");
  const cae = hpCambio && (prev.value > 0) && (hp.value <= 0);
  const vuelve = hpCambio && (prev.value <= 0) && (hp.value > 0);
  const golpe = ecos.golpe;
  const salv = ecos.salvacion;
  const L = [];
  const G = [];
  let titulo = null;
  let datosTarjeta = null;

  // Daño masivo
  if (golpe?.masivo && (hp.value <= 0)) {
    if (esResistente(actor)) {
      titulo = "💥 Un golpe que debía matar";
      await laSangreSostiene(actor, golpe, L);
    } else {
      await matar(actor, "daño masivo (el daño que sobró al llegar a 0 igualó o superó sus PG máximos)");
      return;
    }
  } else if (cae) {
    titulo = "💀 Acechado por la Muerte";
    L.push(`<b>${actor.name}</b> cae a 0 PG${golpe?.brutal ? " por un golpe brutal" : ""}. No pierde el conocimiento: queda <b>Acechado por la Muerte</b>.`);
    L.push(EXPLICA_ACECHADO);
    efecto(actor, "caer");
    if (esResistente(actor) && llevaCristalMudo(actor)) {
      await susurrarDM("Un portador cae (con cristal mudo)", [
        `${actor.name} cayó a 0 PG, pero lleva <b>cristal mudo</b> encima: la sangre no responde y no hay Eco (Mundo 6 · 2). Ni lo sabe.`
      ]);
    } else if (esResistente(actor)) {
      await susurrarDM("Un portador cae", [
        `${actor.name} cayó a 0 PG. Su sangre puede responder con el <b>Eco</b> (Tramas · 3): medio segundo de tiempo detenido, aparece hasta 9 m más allá y vuelve con 1 PG.`,
        "Cuesta el precio de volver y +1 al Reloj de la Barrera. Úsalo solo si la escena lo pide."
      ], { extra: cajaBotones([boton("eco", "Disparar Eco", "fa-hourglass-half", { soloDM: true })]), flags: { [MOD]: { ref: { actorId: actor.id } } } });
    }
  }
  if ((cae || golpe?.masivo) && (hp.value <= 0)) {
    await ponerAcechado(actor);
    G.push("acechado");
    if (golpe?.masivo) G.push("secuela");
  }

  // Golpe brutal sin caer
  if (golpe?.brutal && !cae && (hp.value > 0)) {
    titulo ??= "🩸 Golpe brutal";
    const yaEstaba = !!efectoMalherido(actor);
    await aplicarMalherido(actor);
    const nivel = nivelPJ(actor);
    L.push(`Un solo golpe de <b>${golpe.alHP}</b>, la mitad o más de sus PG máximos: <b>${actor.name}</b> queda <b>Malherido</b>${yaEstaba ? " otra vez y la cuenta vuelve a 0/3" : ""}.`);
    L.push(`Sus PG máximos bajan ${nivel} y la curación no lo sube del 50 % (${topeMalherido(actor)} PG) hasta que lo traten.`);
    G.push("malherido");
  }

  // Daño estando a 0
  if (golpe?.aCero && !golpe.masivo) {
    titulo ??= "💀 Daño estando Acechado";
    L.push(golpe.tresFallos
      ? "Recibe daño estando a 0 PG: <b>tercer fallo</b>."
      : `Recibe daño estando a 0 PG: <b>+1 fallo</b> (${golpe.fallos}/3).`);
    if (actor.statuses.has("stable")) {
      await quitarStatus(actor, "stable");
      L.push("Deja de estar Estable: vuelve a tirar salvaciones de muerte.");
    }
    if (actor.getFlag(MOD, "despertar")) await actor.unsetFlag(MOD, "despertar");
    G.push("acechado");
  }

  // Salvación de muerte
  if (salv) {
    titulo ??= "🎲 Salvación de muerte";
    const d = actor.system.attributes.death;
    const marcador = `<span class="ecos-nota">(${d.success ?? 0}/3 éxitos · ${d.failure ?? 0}/3 fallos)</span>`;
    if (salv.levanta) L.push(salv.critico ? `¡20 natural! <b>${actor.name}</b> se levanta.` : `¡Tercer éxito! <b>${actor.name}</b> se levanta.`);
    else if (salv.exito) L.push(`Éxito (${salv.total}) ${marcador}`);
    else if (salv.tresFallos) L.push(`${salv.pifia ? "1 natural, " : ""}fallo (${salv.total}): <b>tercer fallo</b>.`);
    else L.push(`${salv.pifia ? "1 natural: <b>dos fallos</b>" : "Fallo"} (${salv.total}) ${marcador}`);
    if (!salv.exito) {
      datosTarjeta = {
        actorId: actor.id, antes: salv.antes, usados: salv.usados ?? [], secuela: null,
        despues: { s: d.success ?? 0, f: d.failure ?? 0 }, pifia: !!salv.pifia
      };
    }
  }

  // Tercer fallo: Secuela
  if (golpe?.tresFallos || salv?.tresFallos) {
    const s = await secuelaTirada(actor, 1);
    L.push(`<b>${actor.name}</b> no muere, pero el cuerpo paga: <b>Secuela −1 ${ABREV[s.stat]}</b> (1d6 = ${s.tirada}; queda en ${s.valor}). Las salvaciones vuelven a 0 y sigue Acechado.`);
    if (datosTarjeta && salv?.tresFallos) datosTarjeta.secuela = { stat: s.stat, puntos: 1 };
    G.push("secuela");
  }

  // Vuelve de 0 PG
  if (vuelve) {
    if (options.ecosEco) {
      titulo = "⏳ El Eco";
      L.push(textoEco(actor));
    } else if (options.ecosDespierta) {
      titulo ??= "🩹 Despierta";
      L.push(`<b>${actor.name}</b> despierta después de pasar unas horas Estable.`);
    }
    titulo ??= "🩹 Vuelve de 0 PG";
    await precioDeVolver(actor, L);
    G.push(...GUIA_COMPLETA);
  }

  if (options.ecosTope) {
    titulo ??= "🩸 Malherido";
    L.push(`Malherido: la curación se detiene en <b>${options.ecosTope.tope} PG</b> (${pctMalherido(actor)} % de sus PG máximos${malTratado(actor) ? ", ya tratado" : "; tratado, sube al 75 %"}).`);
    G.push("malherido");
  }

  const exh = foundry.utils.getProperty(changes, "system.attributes.exhaustion");
  const porAgotamiento = Number.isFinite(exh) && (exh >= CONFIG.DND5E.conditionTypes.exhaustion.levels);
  const porCaracteristica = ["str", "dex", "con"].some(k => (actor.system.abilities?.[k]?.value ?? 1) <= 0);

  if (L.length) {
    const opciones = {};
    const sigueVivo = !actor.getFlag(MOD, "muerto") && !porAgotamiento && !porCaracteristica;
    const aCero = actor.system.attributes.hp.value <= 0;
    const lista = [];
    if (datosTarjeta && sigueVivo && aCero) lista.push(...botonesRepetir(actor, datosTarjeta.usados));
    if (sigueVivo && aCero && !actor.statuses.has("stable")) lista.push(boton("estabilizar", "Estabilizar", "fa-kit-medical"));
    opciones.flags = { [MOD]: { ref: { actorId: actor.id }, ...(datosTarjeta ? { tarjeta: datosTarjeta } : {}) } };
    opciones.extra = (sigueVivo ? guia(actor, G) : "") + cajaBotones(lista);
    await publicar(actor, titulo, L, opciones);
  }

  if (porAgotamiento) await matar(actor, `Agotamiento ${exh}`);
  await revisarCaracteristicas(actor);
}

async function laSangreSostiene(actor, golpe, L) {
  const sobra = golpe.aCero ? golpe.alHP : (golpe.alHP - golpe.hpAntes);
  const s = await secuelaTirada(actor, 2);
  const reloj = await sumarReloj(1);
  const veces = (actor.getFlag(MOD, "manifestaciones") ?? 0) + 1;
  await actor.setFlag(MOD, "manifestaciones", veces);

  L.push(`Por las reglas, <b>${actor.name}</b> debería estar muerto: el daño que sobró al llegar a 0 (${sobra}) igualó o superó sus PG máximos.`);
  L.push(`No lo está. Sigue respirando, <b>Acechado por la Muerte</b>. Pero el cuerpo no sale entero: <b>Secuela −2 ${ABREV[s.stat]}</b> (1d6 = ${s.tirada}; queda en ${s.valor}).`);
  L.push(EXPLICA_ACECHADO);

  const notas = [
    `${actor.name} sobrevivió a daño masivo (${sobra} de sobra contra ${actor.system.attributes.hp.effectiveMax} PG máximos). La Sangre lo sostuvo. Es la vez número ${veces}.`,
    `Reloj de la Barrera +1 → <b>${reloj}/10</b>. Esta noche los instrumentos de Miria se disparan y ${actor.name} sueña con geometría y escaleras que bajan.`,
    "Los testigos lo vieron: alguien va a decir \"deberías estar muerto\"."
  ];
  if (veces === 1) notas.push("Es la <b>primera manifestación</b>: buen momento para el Eco (Tramas · 3) como escena.");
  notas.push("Si no querías que contara para el Reloj, bájalo en Configuración → Ecos de la frontera.");
  efecto(actor, "sangre");
  await susurrarDM("La Sangre lo sostuvo", notas, {
    extra: cajaBotones([boton("eco", "Disparar Eco", "fa-hourglass-half", { soloDM: true })]),
    flags: { [MOD]: { ref: { actorId: actor.id } } }
  });
}

async function precioDeVolver(actor, L) {
  await quitarStatus(actor, "acechado");
  await quitarStatus(actor, "stable");
  if (actor.getFlag(MOD, "despertar")) await actor.unsetFlag(MOD, "despertar");
  efecto(actor, "levantarse");
  const exh = actor.system.attributes.exhaustion ?? 0;
  const nuevoExh = Math.min(exh + 1, CONFIG.DND5E.conditionTypes.exhaustion.levels);
  await aplicarMalherido(actor);
  const n = Math.min(nivelHNT(actor) + 1, MAX_HNT);
  await setHNT(actor, n, diaHNT(actor));

  const hp = actor.system.attributes.hp;
  const tope = topeMalherido(actor);
  if (hp.value > tope) await actor.update({ "system.attributes.hp.value": tope }, { ecosInterno: true });

  L.push(`<b>${actor.name}</b> vuelve en sí con ${actor.system.attributes.hp.value} PG${actor.statuses.has("prone") ? " (sigue Derribado)" : ""}.`);
  L.push(`El precio de volver: <b>+1 Agotamiento</b> (${exh} → ${nuevoExh}), <b>Herida No Tratada ${n}</b> y <b>Malherido</b> (0/${DESCANSOS_MALHERIDO}).`);
  await actor.update({ "system.attributes.exhaustion": nuevoExh });
}

/* ------------------------------------------------------------------ */
/*  Repetir una salvación de muerte (Esfuerzo Excesivo / Moneda)      */
/* ------------------------------------------------------------------ */

function botonesRepetir(actor, usados = []) {
  const b = [];
  const exh = actor.system.attributes.exhaustion ?? 0;
  if (!usados.includes("esfuerzo") && (exh < 5)) b.push(boton("repetir", "Esfuerzo Excesivo (+1 Agot.)", "fa-fire", { tipo: "esfuerzo" }));
  // Una Moneda Antigua repite la salvación (con un 1 natural también sale el aviso Sí / No).
  if (!usados.includes("moneda") && !usados.includes("soul") && (monedas(actor) > 0)) b.push(boton("repetir", `Moneda Antigua (tienes ${monedas(actor)})`, "fa-coins", { tipo: "moneda" }));
  return b;
}

async function repetirSalvacion(messageId, tipo, userId) {
  const msg = game.messages.get(messageId);
  const t = msg?.getFlag(MOD, "tarjeta");
  if (!t || t.usada) return;
  const actor = game.actors.get(t.actorId);
  if (!actor) return;
  const user = game.users.get(userId);
  if (user && !user.isGM && !actor.testUserPermission(user, "OWNER")) return;

  const avisar = txt => ChatMessage.create({
    content: tarjeta("🎲 No se puede repetir", [txt]),
    whisper: [...new Set([userId, ...idsGM()].filter(Boolean))]
  });
  const d = actor.system.attributes.death;
  if (actor.getFlag(MOD, "muerto") || (actor.system.attributes.hp.value > 0)) return avisar(`${actor.name} ya no está a 0 PG.`);
  if (((d.success ?? 0) !== t.despues.s) || ((d.failure ?? 0) !== t.despues.f)) {
    return avisar("Ya hubo otra salvación después de esa: solo se puede repetir la última.");
  }

  if (tipo === "esfuerzo") {
    const exh = actor.system.attributes.exhaustion ?? 0;
    if (exh >= 5) return avisar("Con Agotamiento 5 no se puede usar el Esfuerzo Excesivo.");
    await actor.update({ "system.attributes.exhaustion": exh + 1 });
  } else {
    // "soul" es el nombre viejo (v1.9) de la misma moneda.
    tipo = "moneda";
    if (monedas(actor) < 1) return avisar(`${actor.name} no tiene Monedas Antiguas.`);
    await actor.update({ "system.currency.soul": monedas(actor) - 1 });
    await visionSoul(actor);
  }

  if (t.secuela) await modificarSecuela(actor, { [t.secuela.stat]: -t.secuela.puntos });
  await msg.update({ [`flags.${MOD}.tarjeta.usada`]: tipo });
  await actor.update({
    "system.attributes.death.success": t.antes.s,
    "system.attributes.death.failure": t.antes.f
  });
  await publicar(actor, "🎲 Repite la salvación", [
    (tipo === "esfuerzo")
      ? `<b>${actor.name}</b> aprieta los dientes y se fuerza más allá de sus límites: <b>+1 Agotamiento</b>.`
      : `<b>${actor.name}</b> gasta una <b>Moneda Antigua</b>.`,
    t.secuela ? "La Secuela de esa tirada se deshace." : null
  ]);
  pendiente(actor).repeticion = { usados: [...(t.usados ?? []), tipo] };
  await actor.rollDeathSave({}, { configure: false });
}

/* ------------------------------------------------------------------ */
/*  Descansos                                                         */
/* ------------------------------------------------------------------ */

function leerFormulario(boton) {
  const datos = {};
  for (const el of Array.from(boton?.form?.elements ?? [])) {
    if (!el.name) continue;
    datos[el.name] = (el.type === "checkbox") ? el.checked : el.value;
  }
  return datos;
}

async function dialogoDescansoLargo(actor, config) {
  const { DialogV2 } = foundry.applications.api;
  const hp = actor.system.attributes.hp;
  const exh = actor.system.attributes.exhaustion ?? 0;
  const mal = efectoMalherido(actor);
  const nh = nivelHNT(actor);
  const sec = totalSecuela(actor);
  const grave = !!mal || nh > 0;
  const combate = !!actor.getFlag(MOD, "huboCombate") || !!actor.getFlag(MOD, "trabajoPesado");

  if (enSantuario()) {
    const nivel = nivelPJ(actor);
    const hd = actor.system.attributes.hd;
    const gastados = Math.max(0, (hd?.max ?? 0) - (hd?.value ?? 0));
    const reglaDG = reglaDescanso(actor);
    const limite = reglaDG ? dgARecuperar(actor, "long", true) : Math.ceil(nivel / 2);
    const maxRec = Math.min(limite, gastados);
    const filas = [];
    const fila = (a, b) => filas.push(`<tr><th>${a}</th><td>${b}</td></tr>`);

    const opciones = Array.from({ length: maxRec + 1 }, (_, i) => maxRec - i)
      .map(n => `<option value="${n}">${n === 0 ? "No recuperar" : `Recuperar ${n}`}</option>`).join("");
    fila("Dados de Golpe", gastados
      ? `<select name="dg">${opciones}</select><div class="ecos-nota">Hasta ${reglaDG ? LARGO_DG[cfgDesc().largo] : "la mitad de tu nivel"}, redondeando hacia arriba: ${limite}. Tienes ${gastados} gastados de ${hd.max}.</div>`
      : 'No tienes Dados de Golpe gastados.<input type="hidden" name="dg" value="0">');
    if (reglaDG) {
      const t = topeDG(actor);
      fila("Puntos de Golpe", `<b>No vuelven solos.</b> ${cfgDesc().gastarLargo ? "Al terminar se abre una ventana para gastar" : "Puedes gastar"} ${Number.isFinite(t) ? `hasta <b>${t}</b>` : "los"} Dados de Golpe y curarte con ellos${mal ? ` (Malherido: no subes de ${topeMalherido(actor)})` : ""}. Ahora: ${hp.value} / ${hp.effectiveMax}.`);
    } else fila("Puntos de Golpe", mal ? `Hasta <b>${topeMalherido(actor)}</b> (Malherido${malTratado(actor) ? " tratado: tope del 75 %" : ": tope del 50 %; tratado, 75 %"})` : `Todos (${hp.effectiveMax})`);
    fila("Conjuros y rasgos", "Se recuperan");
    fila("Agotamiento", nh ? `No baja: tienes Herida No Tratada ${nh}` : (exh ? `${exh} → ${exh - 1}` : "—"));
    if (mal) {
      const d = mal.getFlag(MOD, "descansos") ?? 0;
      fila("Malherido", `${d}/${DESCANSOS_MALHERIDO} → ${d + 1}/${DESCANSOS_MALHERIDO} si el día cuenta`);
    }
    if (nh || sec || mal) fila("Tratamiento", `${curaDeHoy(actor)?.exito ? "Hoy ya te trataron: esta noche no empeora. " : "Hoy no te trataron: al terminar el descanso tiras Constitución (CD " + (8 + nh + (mal ? 1 : 0)) + "). "}Mañana, el DM tira la Medicina de tu sanador${nh ? ` (CD ${10 + nh})` : ""}, o te trata alguien con el botón Curar. Con Nessa cuesta ${TARIFA_TRATAMIENTO} c.`);

    const marcar = (mal || nh || sec)
      ? `<label class="ecos-check"><input type="checkbox" name="cortado" ${combate ? "checked" : ""}> Hoy hubo combate, un viaje forzado o trabajé con Agotamiento 3 o más <span class="ecos-nota">(el día no cuenta para Malherido ni para el tratamiento)</span></label>`
      : "";
    const content = `<div class="ecos-dialogo">
      <p>🏠 Estás en un <b>Santuario</b>: el descanso cuenta como <b>Descanso Largo</b>.</p>
      <table class="ecos-tabla">${filas.join("")}</table>
      ${marcar}
      <label class="ecos-check"><input type="checkbox" name="nuevoDia" ${config.newDay !== false ? "checked" : ""}> Empieza un nuevo día</label>
    </div>`;

    const r = await DialogV2.wait({
      window: { title: `Descanso Largo · ${actor.name}`, icon: "fa-solid fa-bed" },
      position: { width: 480 },
      content,
      rejectClose: false,
      buttons: [
        { action: "descansar", label: "Descansar", icon: "fa-solid fa-moon", default: true, callback: (ev, boton) => leerFormulario(boton) },
        { action: "cancelar", label: "Cancelar", icon: "fa-solid fa-xmark" }
      ]
    });
    if (!r || (typeof r === "string")) return;
    return actor.longRest({
      ...config,
      dialog: false,
      newDay: !!r.nuevoDia,
      maxHitDice: Math.clamp(Number(r.dg ?? 0) || 0, 0, maxRec),
      exhaustionDelta: nh ? 0 : config.exhaustionDelta,
      ecos: { listo: true, santuario: true, cuenta: !r.cortado }
    });
  }

  // A la intemperie: cuenta como Descanso Corto
  const dc = 10 + nh + (mal ? 1 : 0);
  const reglaDG = reglaDescanso(actor);
  const quedanDG = dgQuedan(actor);
  const lineas = [
    "🌲 <b>No estás en un Santuario.</b> Aunque duermas 8 horas, el descanso cuenta como <b>Descanso Corto</b>.",
    reglaDG ? `No recuperas espacios de conjuro. Al terminar recuperas ${plural(dgARecuperar(actor, "short", false), "Dado de Golpe", "Dados de Golpe")}.`
      : "No recuperas Dados de Golpe ni espacios de conjuro."
  ];
  if (grave) {
    const que = [mal ? "Malherido" : null, nh ? `Herida No Tratada ${nh}` : null].filter(Boolean).join(" y ");
    lineas.push(`Estás herido grave (${que}): fuera de un Santuario <b>no recuperas PG descansando ni con Dados de Golpe</b>.`);
    lineas.push(curaDeHoy(actor)?.exito
      ? `Hoy te trataron la herida (${escH(curaDeHoy(actor).por ?? "")}): esta noche <b>no tiras</b>.`
      : `Al final de la noche haces una <b>salvación de Constitución CD ${dc}</b>. Si fallas, ganas 1 nivel de Agotamiento. (Si alguien te trata hoy con el botón <b>Curar</b> y le sale, no tiras.)`);
  } else {
    lineas.push(reglaDG
      ? `Los PG no vuelven solos: al terminar se abre una ventana para gastar ${Number.isFinite(quedanDG) ? `hasta <b>${topeDG(actor)}</b>` : "los"} Dados de Golpe y curarte.`
      : "Puedes gastar Dados de Golpe para curarte: se abre la ventana del Descanso Corto.");
  }
  const content = `<div class="ecos-dialogo">${lineas.map(l => `<p>${l}</p>`).join("")}
    <label class="ecos-check"><input type="checkbox" name="nuevoDia" checked> Empieza un nuevo día</label></div>`;
  const r = await DialogV2.wait({
    window: { title: `Descanso a la intemperie · ${actor.name}`, icon: "fa-solid fa-campground" },
    position: { width: 460 },
    content,
    rejectClose: false,
    buttons: [
      { action: "descansar", label: "Descansar (cuenta como corto)", icon: "fa-solid fa-moon", default: true, callback: (ev, boton) => leerFormulario(boton) },
      { action: "cancelar", label: "Cancelar", icon: "fa-solid fa-xmark" }
    ]
  });
  if (!r || (typeof r === "string")) return;
  await actor.shortRest({ dialog: !grave, newDay: !!r.nuevoDia, request: config.request, ecos: { intemperie: true } });
  if (grave) {
    const N = await nocheHeridas(actor, { santuario: false, sinRegistro: "tirar" });
    if (N.length) await publicar(actor, "🌲 Noche a la intemperie", N, { extra: guia(actor, ["intemperie", "malherido", "heridant", "agotamiento", "secuela"]) });
  }
  if (actor.getFlag(MOD, "huboCombate")) await actor.unsetFlag(MOD, "huboCombate");
  if (actor.getFlag(MOD, "trabajoPesado")) await actor.unsetFlag(MOD, "trabajoPesado");
}

async function salvacionIntemperie(actor, dc) {
  const roll = await tiradaConSoul(actor, m => actor.rollSavingThrow({ ability: "con", target: dc }, { configure: false }, m), "salvación de Constitución a la intemperie");
  if (!roll) return;
  const exh = actor.system.attributes.exhaustion ?? 0;
  if (roll.total >= dc) {
    return publicar(actor, "🌲 Noche a la intemperie", [
      `Salvación de Constitución ${roll.total} contra CD ${dc}: <b>aguanta</b>. Las heridas no mejoran, pero tampoco empeoran.`
    ], { extra: guia(actor, ["intemperie", "malherido", "heridant", "agotamiento", "secuela"]) });
  }
  const nuevo = Math.min(exh + 1, CONFIG.DND5E.conditionTypes.exhaustion.levels);
  await actor.update({ "system.attributes.exhaustion": nuevo });
  return publicar(actor, "🌲 Noche a la intemperie", [
    `Salvación de Constitución ${roll.total} contra CD ${dc}: <b>falla</b>. Las heridas empeoran: <b>+1 Agotamiento</b> (${exh} → ${nuevo}).`
  ], { extra: guia(actor, ["intemperie", "malherido", "heridant", "agotamiento", "secuela"]) });
}

/** Después de un Descanso Largo en Santuario (lo procesa el DM). */
async function despuesDescanso(actor, { cuenta }) {
  const L = [];
  const mal = efectoMalherido(actor);
  if (mal) {
    if (cuenta) {
      const n = (mal.getFlag(MOD, "descansos") ?? 0) + 1;
      if (n >= DESCANSOS_MALHERIDO) {
        await mal.delete();
        if (reglaDescanso(actor)) {
          L.push(`<b>Malherido ${n}/${DESCANSOS_MALHERIDO}</b>: termina la convalecencia. Ya puede curarse por encima del tope (con Dados de Golpe o con magia).`);
        } else {
          await actor.update({ "system.attributes.hp.value": actor.system.attributes.hp.effectiveMax }, { ecosInterno: true });
          L.push(`<b>Malherido ${n}/${DESCANSOS_MALHERIDO}</b>: termina la convalecencia. Recupera sus PG máximos y queda con ${actor.system.attributes.hp.value} PG.`);
        }
      } else {
        await mal.update({ name: nombreMalherido(n, malTratado(actor)), [`flags.${MOD}.descansos`]: n });
        L.push(`<b>Malherido ${n}/${DESCANSOS_MALHERIDO}</b>.`);
      }
    } else {
      L.push("<b>Malherido</b>: hoy no cuenta (hubo combate, viaje forzado o trabajo pesado).");
    }
  }
  if (actor.getFlag(MOD, "huboCombate")) await actor.unsetFlag(MOD, "huboCombate");
  if (actor.getFlag(MOD, "trabajoPesado")) await actor.unsetFlag(MOD, "trabajoPesado");
  L.push(...await nocheHeridas(actor, { santuario: true }));

  const nh = nivelHNT(actor);
  if (nh && (actor.system.attributes.exhaustion ?? 0) > 0) L.push(`El Agotamiento no baja: tiene <b>Herida No Tratada ${nh}</b>.`);

  const herido = L.length > 0;
  // Nuevo día de trabajo: vencen los plazos, llegan los pedidos y cuenta la noche pagada en la posada.
  await nuevoDiaPJ(actor);
  const habraTratamiento = necesitaCuidados(actor);
  // La guía va en la última tarjeta: la del tratamiento si lo hay, si no esta.
  if (L.length) await publicar(actor, herido ? "🛏 Convalecencia" : "🛏 Noche en el Santuario", L, { extra: habraTratamiento ? "" : guia(actor, GUIA_COMPLETA) });
  if (habraTratamiento) await dialogoTratamiento(actor);
}

/* ---------- Monedas en los bolsos: se paga con lo que se lleva encima, también lo guardado en bolsas ---------- */
const VALOR_CP = { pp: 1000, gp: 100, ep: 50, sp: 10, cp: 1 };
const DENOMS = ["pp", "gp", "ep", "sp", "cp"];
const MENORES = { pp: ["gp", 10], gp: ["sp", 10], ep: ["sp", 5], sp: ["cp", 10] };
const cpDe = c => DENOMS.reduce((t, k) => t + ((Number(c?.[k]) || 0) * VALOR_CP[k]), 0);
const monedasPlanas = c => Object.fromEntries(DENOMS.map(k => [k, Math.max(0, Math.floor(Number(c?.[k]) || 0))]));
const esEmergencia = i => /emergencia/i.test(i?.name ?? "");
const monedasActor = c => Object.fromEntries(DENOMS.map(k => [`system.currency.${k}`, c[k]]));

/** Los contenedores con monedas, en el orden en que se gastan: primero los de siempre, la bolsa de «Emergencias» al final. */
function bolsosConMonedas(actor) {
  return (actor?.items?.contents ?? []).filter(i => (i.type === "container") && (cpDe(i.system?.currency) > 0))
    .sort((a, b) => (Number(esEmergencia(a)) - Number(esEmergencia(b))) || ((a.sort ?? 0) - (b.sort ?? 0)));
}

/** Quita «cp» de un montón de monedas (las pequeñas primero, con cambio). Devuelve lo que falta por pagar. */
function pagarDe(c, cp) {
  const total = cpDe(c);
  if (total <= cp) {
    for (const k of DENOMS) c[k] = 0;
    return cp - total;
  }
  let resto = cp;
  for (const k of ["cp", "sp", "ep", "gp", "pp"]) {
    if (resto <= 0) break;
    const usar = Math.min(c[k] ?? 0, Math.ceil(resto / VALOR_CP[k]));
    c[k] = (c[k] ?? 0) - usar;
    resto -= usar * VALOR_CP[k];
  }
  if (resto < 0) {
    const cambio = -resto;
    c.sp = (c.sp ?? 0) + Math.floor(cambio / 10);
    c.cp = (c.cp ?? 0) + (cambio % 10);
  }
  return 0;
}

/** Saca de «disp» monedas que sumen exactamente «cp»: primero las mismas que había («pref»); si hace falta, cambia una moneda grande. */
function tomarMonedas(disp, cp, pref = {}) {
  const r = { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 };
  let falta = Math.max(0, cp);
  const tomar = (k, n) => {
    n = Math.max(0, Math.min(n, disp[k] ?? 0));
    r[k] += n;
    disp[k] -= n;
    falta -= n * VALOR_CP[k];
  };
  for (const k of DENOMS) tomar(k, Math.min(pref[k] ?? 0, Math.floor(falta / VALOR_CP[k])));
  for (let vueltas = 0; (falta > 0) && (vueltas < 300); vueltas++) {
    for (const k of DENOMS) tomar(k, Math.floor(falta / VALOR_CP[k]));
    if (falta <= 0) break;
    const k = [...DENOMS].reverse().find(x => ((disp[x] ?? 0) > 0) && MENORES[x]);
    if (!k) break;
    disp[k] -= 1;
    disp[MENORES[k][0]] = (disp[MENORES[k][0]] ?? 0) + MENORES[k][1];
  }
  return r;
}

/** Avisos de dinero (pagar con los bolsos, abrir y cerrar una tienda): en el chat, solo para el dueño y el DM. */
function avisoDinero(actor, lineas) {
  let modo = "chat";
  try {
    modo = game.settings.get(MOD, "avisoDinero") ?? "chat";
  } catch {
    modo = "chat";
  }
  lineas = lineas.filter(Boolean);
  if ((modo === "nada") || !lineas.length) return;
  if (modo === "cartel") {
    for (const l of lineas) ui.notifications?.info(l.replace(/<[^>]+>/g, ""));
    return;
  }
  const duenos = game.users.filter(u => !u.isGM && actor.testUserPermission(u, "OWNER")).map(u => u.id);
  ChatMessage.create({
    content: tarjeta("🪙 Bolsa", lineas, { clase: "ecos-dinero" }),
    whisper: [...new Set([...duenos, ...idsGM(), game.user.id])],
    speaker: ChatMessage.getSpeaker({ actor }),
    flags: { [MOD]: { dinero: true } }
  }).catch(err => console.warn(`${MOD} | aviso de dinero`, err));
}

/** Cobra «cp» cobres: primero de la bolsa de la hoja, después de los bolsos (Emergencias al final). Falso si no le alcanza. */
async function cobrar(actor, cp) {
  cp = Math.round(Number(cp) || 0);
  if (cp <= 0) return true;
  const bolsa = monedasPlanas(actor.system.currency);
  const bolsos = bolsosConMonedas(actor).map(i => ({ item: i, c: monedasPlanas(i.system.currency), antes: cpDe(i.system.currency) }));
  if (cpDe(bolsa) + bolsos.reduce((t, b) => t + b.antes, 0) < cp) return false;
  let resto = cp;
  const antesBolsa = cpDe(bolsa);
  if (antesBolsa) resto = pagarDe(bolsa, resto);
  const tocados = [];
  for (const b of bolsos) {
    if (resto <= 0) break;
    resto = pagarDe(b.c, resto);
    tocados.push(b);
  }
  if (cpDe(bolsa) !== antesBolsa) await actor.update(monedasActor(bolsa));
  if (tocados.length) {
    await actor.updateEmbeddedDocuments("Item", tocados.map(b => ({ _id: b.item.id, "system.currency": b.c })));
    const nombres = tocados.map(b => escH(b.item.name)).join(", ");
    avisoDinero(actor, [`<b>${escH(actor.name)}</b> paga ${textoDinero(cp)} con lo que guarda en ${nombres}.`,
      tocados.some(b => esEmergencia(b.item)) ? "Tuvo que tocar su bolsa de <b>emergencias</b>." : null]);
  }
  return true;
}

/*
 * Tiendas (Item Piles): la tienda solo mira la bolsa de la hoja. Al abrir una tienda, el PJ saca a la mano lo que guarda
 * en sus bolsos; al cerrarla, lo que le queda vuelve a cada bolso. Lo gastado sale primero de lo que ya tenía en la mano,
 * después de los bolsos en su orden (Emergencias al final). La bandera «enMano» deja anotado qué había en cada bolso,
 * por si se cierra el navegador con la tienda abierta: al volver, se guarda solo.
 */
const TIENDAS_ABIERTAS = new Map();   // uuid del actor → Set de ventanas
const SACADO_AQUI = new Set();        // actores cuyo dinero sacó este cliente
const COLA_BOLSOS = new Map();
function enCola(actor, fn) {
  const antes = COLA_BOLSOS.get(actor.uuid) ?? Promise.resolve();
  const p = antes.then(fn).catch(err => console.error(`${MOD} | bolsos`, err));
  COLA_BOLSOS.set(actor.uuid, p);
  return p;
}

async function sacarDeBolsos(actor) {
  if (actor.getFlag(MOD, "enMano")) return false;
  const bolsos = bolsosConMonedas(actor);
  if (!bolsos.length) return false;
  const bolsa = monedasPlanas(actor.system.currency);
  const guardado = {};
  const suma = { ...bolsa };
  for (const b of bolsos) {
    const c = monedasPlanas(b.system.currency);
    guardado[b.id] = c;
    for (const k of DENOMS) suma[k] += c[k];
  }
  const total = cpDe(suma);
  await actor.setFlag(MOD, "enMano", { bolsa, bolsos: guardado, orden: bolsos.map(b => b.id), total, user: game.user.id, t: Date.now() });
  await actor.updateEmbeddedDocuments("Item", bolsos.map(b => ({ _id: b.id, "system.currency": { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 } })));
  await actor.update(monedasActor(suma));
  avisoDinero(actor, [`<b>${escH(actor.name)}</b> saca de sus bolsos lo que lleva (${textoDinero(cpDe(suma) - cpDe(bolsa))}). Al cerrar la tienda, lo que quede vuelve a cada bolso.`]);
  return true;
}

async function guardarEnBolsos(actor) {
  const f = actor.getFlag(MOD, "enMano");
  if (!f) return false;
  const guardado = f.bolsos ?? {};
  const orden = (f.orden ?? []).map(id => actor.items.get(id)).filter(i => i && guardado[i.id]);
  const disp = monedasPlanas(actor.system.currency);
  for (const b of orden) {
    const c = monedasPlanas(b.system.currency);
    for (const k of DENOMS) disp[k] += c[k];
  }
  const antes = cpDe(f.bolsa) + Object.values(guardado).reduce((t, c) => t + cpDe(c), 0);
  const neto = antes - cpDe(disp);
  let gasto = Math.max(0, neto);
  // Quién paga lo gastado: lo que ya tenía en la mano, después cada bolso en su orden.
  gasto -= Math.min(gasto, cpDe(f.bolsa));
  const meta = {};
  for (const b of orden) {
    const t = cpDe(guardado[b.id]);
    const paga = Math.min(gasto, t);
    gasto -= paga;
    meta[b.id] = t - paga;
  }
  // Vuelve a cada bolso lo suyo (Emergencias primero, con sus mismas monedas si se puede); el resto queda en la mano.
  const cambios = [...orden].reverse().map(b => ({ _id: b.id, "system.currency": tomarMonedas(disp, meta[b.id], guardado[b.id]) }));
  // Si no llevaba nada en la mano, lo que ganó vendiendo también va a su bolso de siempre.
  if ((cpDe(f.bolsa) === 0) && (cpDe(disp) > 0) && orden.length) {
    const destino = orden.find(b => !esEmergencia(b)) ?? orden[0];
    const c = cambios.find(x => x._id === destino.id)["system.currency"];
    for (const k of DENOMS) {
      c[k] += disp[k];
      disp[k] = 0;
    }
  }
  if (cambios.length) await actor.updateEmbeddedDocuments("Item", cambios);
  await actor.update(monedasActor(disp));
  await actor.unsetFlag(MOD, "enMano");
  const emerg = orden.filter(b => esEmergencia(b) && (meta[b.id] < cpDe(guardado[b.id])));
  avisoDinero(actor, [`<b>${escH(actor.name)}</b> cierra la tienda${neto > 0 ? ` (gastó ${textoDinero(neto)})` : (neto < 0 ? ` (ganó ${textoDinero(-neto)})` : "")} y guarda en sus bolsos lo que le queda.`,
    emerg.length ? "Tuvo que tocar su bolsa de <b>emergencias</b>." : null]);
  return true;
}

function actorDeTienda(app, recipient) {
  if (!String(app?.id ?? "").startsWith("item-pile-merchant-")) return null;
  const actor = (recipient instanceof Actor) ? recipient : (recipient?.actor ?? null);
  if (!actor?.isOwner || (actor.type !== "character")) return null;
  return actor;
}
Hooks.on("item-piles-openInterface", (app, merchant, recipient) => {
  try {
    const actor = actorDeTienda(app, recipient);
    if (!actor) return;
    const abiertas = TIENDAS_ABIERTAS.get(actor.uuid) ?? new Set();
    abiertas.add(app.id);
    TIENDAS_ABIERTAS.set(actor.uuid, abiertas);
    if (abiertas.size === 1) enCola(actor, async () => {
      if (await sacarDeBolsos(actor)) SACADO_AQUI.add(actor.uuid);
    });
  } catch (err) {
    console.error(`${MOD} | bolsos`, err);
  }
});
Hooks.on("item-piles-closeInterface", (app, merchant, recipient) => {
  try {
    const actor = actorDeTienda(app, recipient);
    if (!actor) return;
    const abiertas = TIENDAS_ABIERTAS.get(actor.uuid);
    abiertas?.delete(app.id);
    if (abiertas?.size) return;
    TIENDAS_ABIERTAS.delete(actor.uuid);
    enCola(actor, async () => {
      if (!SACADO_AQUI.has(actor.uuid)) return;
      SACADO_AQUI.delete(actor.uuid);
      await guardarEnBolsos(actor);
    });
  } catch (err) {
    console.error(`${MOD} | bolsos`, err);
  }
});
/* Si alguien cerró el navegador con una tienda abierta, su dinero vuelve a los bolsos al entrar (o lo hace el DM si esa persona no está). */
Hooks.once("ready", () => setTimeout(() => {
  for (const a of game.actors ?? []) {
    const f = a.getFlag?.(MOD, "enMano");
    if (!f || !a.isOwner) continue;
    const mio = f.user === game.user.id;
    const autorConectado = game.users.get(f.user)?.active && !mio;
    if (mio || (game.user.isGM && !autorConectado)) enCola(a, () => guardarEnBolsos(a));
  }
}, 4000));

function statMasDanada(v) {
  return ["con", "dex", "str"].reduce((mejor, k) => ((v[k] ?? 0) > (v[mejor] ?? 0) ? k : mejor), "con");
}

/** Deja el Malherido tratado (tope 75 %). Con «curar», el descanso de hoy ya lo sube hasta el tope nuevo. */
async function tratarMalherido(actor, { curar = false } = {}) {
  const mal = efectoMalherido(actor);
  if (!mal || malTratado(actor)) return false;
  const d = mal.getFlag(MOD, "descansos") ?? 0;
  await mal.update({ name: nombreMalherido(d, true), [`flags.${MOD}.tratado`]: true });
  if (curar) {
    const tope = topeMalherido(actor);
    if (actor.system.attributes.hp.value < tope) await actor.update({ "system.attributes.hp.value": tope }, { ecosInterno: true });
  }
  return true;
}

const competenteMedicina = a => (Number(a?.system?.skills?.med?.value) || 0) >= 1;
const esNessa = a => /nessa/i.test(a?.name ?? "");
const necesitaCuidados = a => !!(nivelHNT(a) || efectoMalherido(a) || totalSecuela(a));
const cdTratamiento = a => 10 + nivelHNT(a);
/** El tratamiento de hoy (entre un descanso y el siguiente): { intento, exito, por }. Sin bandera: todavía no hay registro. */
const curaDeHoy = a => a.getFlag(MOD, "cura") ?? null;

function textoEstadoHerida(actor) {
  const nh = nivelHNT(actor);
  const sec = valoresSecuela(actor);
  const mal = efectoMalherido(actor);
  return [
    nh ? `<b>Herida No Tratada ${nh}</b> · día ${diaHNT(actor)}/${DIAS_TRATAMIENTO}` : null,
    mal ? `<b>Malherido</b> ${malTratado(actor) ? "(tratado)" : "(sin tratar: con éxito queda tratado y la curación sube hasta el 75 %)"}` : null,
    totalSecuela(actor) ? `<b>Secuela</b>: ${textoSecuela(sec)} (en el Santuario, cada día exitoso devuelve 1 punto)` : null
  ].filter(Boolean);
}

/** Aplica el resultado de un tratamiento (lo hace el DM). d = { sanador, total, cd, fumble, kit, santuario, cobrar, solo }. */
async function aplicarTratamiento(actor, d) {
  const hoy = curaDeHoy(actor);
  if (hoy?.exito) return publicar(actor, "🩺 Tratamiento", [`<b>${actor.name}</b> ya tiene la herida tratada hoy (${escH(hoy.por ?? "")}). No hace falta otro.`]);
  const nh = nivelHNT(actor);
  const dia = diaHNT(actor);
  const sec = valoresSecuela(actor);
  const secTotal = totalSecuela(actor);
  const exito = Number(d.total) >= Number(d.cd);
  const cortado = !!actor.getFlag(MOD, "huboCombate") || !!actor.getFlag(MOD, "trabajoPesado");
  const L = [`<b>${escH(d.sanador)}</b> ${d.solo ? "se trata a sí mismo" : `trata a <b>${actor.name}</b>`}${d.kit ? " con un kit de sanador" : ""}${d.santuario ? "" : ", fuera del Santuario"}: `
    + (d.magico ? "<b>Tratamiento mágico con éxito.</b>" : `Medicina ${d.total} contra CD ${d.cd} → <b>${exito ? "éxito" : (d.fumble ? "1 natural" : "fallo")}</b>.`)];
  await actor.setFlag(MOD, "cura", { intento: true, exito, por: d.sanador });
  if (exito) {
    if (nh && cortado) {
      L.push(`La Herida No Tratada no avanza hoy (hubo combate, viaje forzado o trabajo pesado), pero queda limpia y vendada.`);
    } else if (nh) {
      let dd = dia + 1;
      let n = nh;
      if (dd >= DIAS_TRATAMIENTO) { n -= 1; dd = 0; }
      await setHNT(actor, n, dd);
      if (n < nh) L.push(n ? `Se cierra un nivel: queda <b>Herida No Tratada ${n}</b> (día 0/${DIAS_TRATAMIENTO}).` : "<b>Herida No Tratada curada.</b> El Agotamiento vuelve a bajar con los próximos Descansos Largos.");
      else L.push(`<b>Herida No Tratada ${n}</b>: día ${dd}/${DIAS_TRATAMIENTO}.`);
    }
    if (secTotal && d.santuario && !cortado) {
      const k = statMasDanada(sec);
      await modificarSecuela(actor, { [k]: -1 });
      L.push(`Recupera 1 punto de Secuela: ${ABREV[k]} vuelve a ${actor.system.abilities[k].value}.`);
    }
    if (await tratarMalherido(actor, { curar: !!d.santuario })) {
      L.push(`<b>Malherido tratado:</b> vendado y cosido, ya no sangra. Sigue Malherido, pero la curación lo sube hasta el 75 %${d.santuario ? `: queda con <b>${actor.system.attributes.hp.value} PG</b>` : ""}.`);
    }
    if (nivelHNT(actor) || efectoMalherido(actor)) L.push("Esta noche la herida no empeora.");
  } else if (d.fumble && nh) {
    const n = Math.min(nh + 1, MAX_HNT);
    await setHNT(actor, n, dia);
    L.push(`La herida se infecta: <b>Herida No Tratada ${n}</b>. Hoy ya no se puede volver a intentar.`);
  } else {
    L.push("Hoy no queda tratado y ya no se puede volver a intentar: al descansar, salvación de Constitución o la herida se agrava.");
  }
  if (d.cobrar) L.push((await cobrar(actor, TARIFA_TRATAMIENTO)) ? `Paga ${TARIFA_TRATAMIENTO} c.` : `No le alcanza para los ${TARIFA_TRATAMIENTO} c: queda debiendo.`);
  await publicar(actor, "🩺 Tratamiento", L, { extra: guia(actor, GUIA_COMPLETA) });
}

/** Al terminar el día (al descansar): si la herida no se trató, salvación de Constitución; si falla, +1 Agotamiento. */
async function nocheHeridas(actor, { santuario, sinRegistro = "saltar" } = {}) {
  const nh = nivelHNT(actor);
  const mal = !!efectoMalherido(actor);
  const cura = curaDeHoy(actor);
  await actor.setFlag(MOD, "cura", { intento: false, exito: false, por: "" });
  if (!nh && !mal) return [];
  if (cura?.exito) return [`<b>Cuidados:</b> ${escH(cura.por || "alguien")} le trató la herida hoy. No empeora.`];
  if (!cura && (sinRegistro === "saltar")) return [];
  const dc = 10 + nh + (mal ? 1 : 0) - (santuario ? 2 : 0);
  const roll = await tiradaConSoul(actor, m => actor.rollSavingThrow({ ability: "con", target: dc }, { configure: false }, m), "salvación de Constitución (herida sin tratar)");
  if (!roll) return [];
  if (roll.total >= dc) return [`<b>Herida sin tratar:</b> salvación de Constitución ${roll.total} contra CD ${dc}: <b>aguanta</b>. No mejora, pero tampoco empeora.`];
  const exh = actor.system.attributes.exhaustion ?? 0;
  const nuevo = Math.min(exh + 1, CONFIG.DND5E.conditionTypes.exhaustion.levels);
  await actor.update({ "system.attributes.exhaustion": nuevo });
  return [`<b>Herida sin tratar:</b> salvación de Constitución ${roll.total} contra CD ${dc}: <b>falla</b>. La herida se agrava: <b>+1 Agotamiento</b> (${exh} → ${nuevo}).`];
}

/** Tratamiento de la mañana en el Santuario (lo abre el DM después del descanso): elige sanador y tira. */
async function dialogoTratamiento(actor) {
  const { DialogV2 } = foundry.applications.api;
  const dc = cdTratamiento(actor);
  const medicina = a => a.system.skills.med.total ?? a.system.skills.med.mod ?? 0;
  const candidatos = game.actors.filter(a => (a.id !== actor.id) && a.system?.skills?.med
    && (esNessa(a) || competenteMedicina(a) || (esPJ(a) && kitDeSanador(a))))
    .sort((a, b) => (Number(esNessa(b)) - Number(esNessa(a))) || (medicina(b) - medicina(a)));
  if (!candidatos.length) return ui.notifications.warn("Ecos de la frontera: no encontré ningún sanador.");
  const opciones = candidatos.map((a, i) => `<option value="${a.id}" ${i === 0 ? "selected" : ""}>${a.name} (Medicina ${signo(medicina(a))}${competenteMedicina(a) || esNessa(a) ? "" : ", con kit"})</option>`).join("");
  const content = `<div class="ecos-dialogo">
    <p>Tratamiento de hoy para <b>${actor.name}</b> · CD ${dc}.</p>
    <p>${textoEstadoHerida(actor).join("<br>")}</p>
    <div class="form-group"><label>Sanador</label><select name="sanador">${opciones}</select></div>
    <label class="ecos-check"><input type="checkbox" name="cobrar" checked> Cobrar ${TARIFA_TRATAMIENTO} c al paciente (tarifa de Nessa)</label>
    <p class="ecos-nota">Éxito: el día cuenta y esta noche la herida no empeora. Fallo: hoy no queda tratado. 1 natural: la herida se infecta y suma un nivel. Si lo van a tratar más tarde (otro sanador, el botón Curar de su hoja), sáltalo.</p>
  </div>`;
  const r = await DialogV2.wait({
    window: { title: `Tratamiento · ${actor.name}`, icon: "fa-solid fa-kit-medical" },
    position: { width: 460 },
    content,
    rejectClose: false,
    buttons: [
      { action: "tirar", label: "Tirar Medicina", icon: "fa-solid fa-dice-d20", default: true, callback: (ev, boton) => leerFormulario(boton) },
      { action: "saltar", label: "Más tarde", icon: "fa-solid fa-clock" }
    ]
  });
  if (!r || (typeof r === "string")) {
    return publicar(actor, "🩺 Tratamiento", [`Esta mañana <b>${actor.name}</b> no recibe tratamiento. Se le puede tratar durante el día (botón <b>Curar</b> en la hoja de quien lo atienda); si nadie lo hace, al descansar tira Constitución.`], { extra: guia(actor, GUIA_COMPLETA) });
  }
  const sanador = game.actors.get(r.sanador);
  if (!sanador) return;
  const kit = (!competenteMedicina(sanador) && !esNessa(sanador)) ? kitDeSanador(sanador) : null;
  if (!competenteMedicina(sanador) && !esNessa(sanador) && !kit) return ui.notifications.warn(`${sanador.name} no tiene competencia en Medicina ni kit de sanador.`);
  const roll = await tiradaConSoul(sanador, m => sanador.rollSkill({ skill: "med", target: dc }, { configure: false }, m), "Medicina");
  if (!roll) return;
  if (kit) await gastarUso(kit);
  return aplicarTratamiento(actor, { sanador: sanador.name, total: roll.total, cd: dc, fumble: !!roll.isFumble, kit: !!kit, santuario: enSantuario(), cobrar: !!r.cobrar && esNessa(sanador) });
}

/** Botón «Curar» en la hoja de quien cura: elige al herido, con o sin kit, y tira Medicina (en el cliente de quien cura). */
async function dialogoCurar(sanador) {
  const { DialogV2 } = foundry.applications.api;
  const comp = competenteMedicina(sanador) || esNessa(sanador);
  const kit = kitDeSanador(sanador);
  if (!comp && !kit) return ui.notifications.warn(`${sanador.name} no tiene competencia en Medicina ni un kit de sanador: no puede tratar heridas.`);
  if ((sanador.system.attributes?.hp?.value ?? 1) <= 0) return ui.notifications.warn(`${sanador.name} está a 0 PG.`);
  const heridos = game.actors.filter(a => esPJ(a) && necesitaCuidados(a));
  if (!heridos.length) return ui.notifications.info("Ecos de la frontera: nadie tiene heridas que tratar.");
  const primero = heridos.find(a => !curaDeHoy(a)?.intento)?.id;
  const filas = heridos.map(a => {
    const hoy = curaDeHoy(a);
    const ya = hoy?.exito ? " · ya tratado hoy" : (hoy?.intento ? " · hoy ya se intentó" : "");
    const solo = a.id === sanador.id ? " (a sí mismo, con desventaja)" : "";
    return `<option value="${a.id}" ${a.id === primero ? "selected" : ""} ${hoy?.intento ? "disabled" : ""}>${a.name}${solo} · CD ${cdTratamiento(a)}${ya}</option>`;
  }).join("");
  const libres = heridos.filter(a => !curaDeHoy(a)?.intento);
  if (!libres.length) return ui.notifications.info("Ecos de la frontera: hoy ya se trató a todos los heridos. Vuelve a intentarlo después del próximo descanso.");
  const estados = heridos.map(a => `<p><b>${a.name}:</b> ${textoEstadoHerida(a).join(" · ")}</p>`).join("");
  const med = sanador.system.skills?.med?.total ?? 0;
  const content = `<div class="ecos-dialogo">
    <p><b>${sanador.name}</b> trata heridas (Medicina ${signo(med)}${comp ? "" : ", sin competencia"}). ${enSantuario() ? "🏠 En el Santuario." : "🌲 Fuera del Santuario: el tratamiento cuenta igual."}</p>
    <div class="form-group"><label>Herido</label><select name="paciente">${filas}</select></div>
    ${kit ? `<label class="ecos-check"><input type="checkbox" name="kit" ${comp ? "" : "checked disabled"}> Usar ${kit.name} (quedan ${usosRestantes(kit)}${comp ? "" : "; sin competencia, hace falta"})</label>` : ""}
    ${estados}
    <p class="ecos-nota">Una vez por día por herido (entre un descanso y el siguiente). Éxito: el día cuenta para la Herida No Tratada, el Malherido queda tratado y esa noche no empeora. Fallo: esa noche tira Constitución. 1 natural: la herida se infecta.</p>
  </div>`;
  const r = await DialogV2.wait({
    window: { title: `Curar · ${sanador.name}`, icon: "fa-solid fa-kit-medical" },
    position: { width: 480 },
    content,
    rejectClose: false,
    buttons: [
      { action: "tirar", label: "Tratar (Medicina)", icon: "fa-solid fa-dice-d20", default: true, callback: (ev, boton) => leerFormulario(boton) },
      { action: "cancelar", label: "Cancelar", icon: "fa-solid fa-xmark" }
    ]
  });
  if (!r || (typeof r === "string")) return;
  const paciente = game.actors.get(r.paciente);
  if (!paciente || curaDeHoy(paciente)?.intento) return;
  const usarKit = !!kit && (!comp || !!r.kit);
  const solo = paciente.id === sanador.id;
  const dc = cdTratamiento(paciente);
  const roll = await tiradaConSoul(sanador, m => sanador.rollSkill({ skill: "med", target: dc, ...(solo ? { disadvantage: true } : {}) }, { configure: false }, m), "Medicina");
  if (!roll) return;
  if (usarKit) await gastarUso(kit);
  return alDM({ accion: "tratamiento", actorId: paciente.id, sanador: sanador.name, total: roll.total, cd: dc, fumble: !!roll.isFumble,
    kit: usarKit, santuario: enSantuario(), cobrar: esNessa(sanador), solo });
}

/* ------------------------------------------------------------------ */
/*  Efectos visuales (Sequencer + JB2A)                               */
/* ------------------------------------------------------------------ */

const VFX_BASE = "modules/JB2A_DnD5e/Library/Generic/";
const VFX = {
  caer: { archivo: "Marker/MarkerSkull_01_Regular_Purple_400x400.webm", escala: 1.6 },
  levantarse: { archivo: "Healing/HealingAbility_01_Green_400x400.webm", escala: 1.8 },
  estable: { archivo: "UI/HeartbeatECG01_01_Regular_Green_400x400.webm", escala: 1.4 },
  sangre: { archivo: "Marker/EnergyStrands_01_Regular_Blue_600x600.webm", escala: 2.4 },
  eco: { archivo: "Energy/Teleport/Teleport01_01_Regular_Blue_500x300.webm", escala: 2.0 },
  muerte: { archivo: "Marker/MarkerSkull_02_Dark_Orange_400x400.webm", escala: 1.8 },
  subeRango: { archivo: "Fireworks/Firework02_01_Regular_Yellow_600x600.webm", escala: 2.2 }
};

/** Animación sobre los tokens del actor en la escena actual (la lanza el DM y la ven todos). */
function efecto(actor, tipo) {
  try {
    if (!game.settings.get(MOD, "efectosVisuales") || !game.modules.get("sequencer")?.active) return;
    const SequenceCls = globalThis.Sequence;
    const vfx = VFX[tipo];
    if (!SequenceCls || !vfx || !canvas?.ready) return;
    for (const token of actor.getActiveTokens()) {
      new SequenceCls().effect().file(VFX_BASE + vfx.archivo).atLocation(token).scaleToObject(vfx.escala)
        .fadeIn(200).fadeOut(500).play();
    }
  } catch (err) {
    console.warn(`${MOD} | efecto visual`, err);
  }
}

/* ------------------------------------------------------------------ */
/*  Estabilizar y despertar                                           */
/* ------------------------------------------------------------------ */

const ESTABILIZADO_POR = new Map();
const usosRestantes = i => {
  const u = i.system.uses;
  if (Number(u?.max)) return u.value ?? (Number(u.max) - (u.spent ?? 0));
  return i.system.quantity ?? 0;
};
const RE_KIT = /healer'?s kit|kit de sanador|equipo de sanador|kit de curandero|kit m[eé]dico|botiqu/i;
const kitDeSanador = actor => actor?.items?.find(i => (RE_KIT.test(i.name) || RE_KIT.test(i.flags?.babele?.originalName ?? "") || (i.system?.identifier === "healers-kit"))
  && (usosRestantes(i) > 0)) ?? null;
async function gastarUso(i) {
  const u = i.system.uses;
  if (Number(u?.max)) return i.update({ "system.uses.spent": (u.spent ?? 0) + 1 });
  return i.update({ "system.quantity": Math.max(0, (i.system.quantity ?? 1) - 1) });
}

/** Botón Estabilizar (en el cliente de quien ayuda). */
async function intentarEstabilizar(pacienteId) {
  const { DialogV2 } = foundry.applications.api;
  const paciente = game.actors.get(pacienteId);
  if (!paciente) return;
  if ((paciente.system.attributes.hp.value > 0) || paciente.statuses.has("stable") || paciente.getFlag(MOD, "muerto")) {
    return ui.notifications.info(`${paciente.name} ya no necesita que lo estabilicen.`);
  }
  const elegido = canvas.tokens?.controlled.map(t => t.actor).find(a => a && (a.id !== pacienteId) && a.isOwner);
  const propio = (game.user.character && (game.user.character.id !== pacienteId)) ? game.user.character : null;
  const ayudante = elegido ?? propio;
  if (!ayudante) return ui.notifications.warn("Selecciona el token de quien ayuda (no el del herido) y vuelve a apretar Estabilizar.");
  if ((ayudante.system.attributes?.hp?.value ?? 1) <= 0) return ui.notifications.warn(`${ayudante.name} está a 0 PG: no puede ayudar.`);

  const kit = kitDeSanador(ayudante);
  const med = ayudante.system.skills?.med?.total ?? 0;
  const botones = [{ action: "medicina", label: `Medicina CD 10 (${signo(med)})`, icon: "fa-solid fa-stethoscope", default: true }];
  if (kit) botones.push({ action: "kit", label: `${kit.name} (quedan ${usosRestantes(kit)})`, icon: "fa-solid fa-kit-medical" });
  botones.push({ action: "cancelar", label: "Cancelar", icon: "fa-solid fa-xmark" });
  const r = await DialogV2.wait({
    window: { title: `Estabilizar a ${paciente.name}`, icon: "fa-solid fa-kit-medical" },
    content: `<div class="ecos-dialogo"><p><b>${ayudante.name}</b> intenta estabilizar a <b>${paciente.name}</b>.</p><p class="ecos-nota">Con Medicina hay que sacar 10 o más. El kit de sanador no necesita tirada: gasta un uso.</p></div>`,
    rejectClose: false,
    buttons: botones
  });
  if (r === "medicina") {
    const roll = await tiradaConSoul(ayudante, m => ayudante.rollSkill({ skill: "med", target: 10 }, { configure: false }, m), "Medicina");
    if (!roll) return;
    if (roll.total >= 10) return alDM({ accion: "estabilizar", actorId: pacienteId, quien: ayudante.name, como: `Medicina ${roll.total}` });
    return publicar(paciente, "🩹 Estabilizar", [`<b>${ayudante.name}</b> intenta estabilizar a <b>${paciente.name}</b>: Medicina ${roll.total} contra CD 10, <b>no lo logra</b>. Puede volver a intentarlo.`]);
  }
  if (r === "kit") {
    await gastarUso(kit);
    return alDM({ accion: "estabilizar", actorId: pacienteId, quien: ayudante.name, como: kit.name });
  }
}

/** Marca Estable (lo hace el DM). El despertar se programa al crearse el estado. */
async function estabilizar(actor, d = {}) {
  if (actor.getFlag(MOD, "muerto") || (actor.system.attributes.hp.value > 0) || actor.statuses.has("stable")) return;
  ESTABILIZADO_POR.set(actor.id, { quien: d.quien ?? "Alguien", como: d.como ?? "" });
  await actor.toggleStatusEffect("stable", { active: true });
}

async function programarDespertar(actor) {
  if (actor.getFlag(MOD, "despertar")) return;
  const por = ESTABILIZADO_POR.get(actor.id);
  ESTABILIZADO_POR.delete(actor.id);
  const roll = await new Roll("1d4").evaluate();
  await roll.toMessage({ speaker: ChatMessage.getSpeaker({ actor }), flavor: `Horas hasta que ${actor.name} despierte` });
  await actor.setFlag(MOD, "despertar", { en: game.time.worldTime + (roll.total * 3600), horas: roll.total });
  efecto(actor, "estable");
  const horas = roll.total === 1 ? "1 hora" : `${roll.total} horas`;
  await publicar(actor, "🩹 Estable", [
    por ? `<b>${por.quien}</b> estabiliza a <b>${actor.name}</b>${por.como ? ` (${por.como})` : ""}.` : `<b>${actor.name}</b> queda <b>Estable</b>.`,
    "Deja de tirar salvaciones de muerte y sigue a 0 PG, Derribado.",
    `Despierta solo con 1 PG en <b>${horas}</b> de tiempo de juego, o antes si alguien lo cura. Si recibe daño, vuelve a tirar salvaciones.`
  ], {
    extra: cajaBotones([boton("despertar", "Despertar ahora", "fa-sun", { soloDM: true })]),
    flags: { [MOD]: { ref: { actorId: actor.id } } }
  });
  actualizarEstado();
}

async function marcarUsado(messageId, texto) {
  const msg = messageId ? game.messages.get(messageId) : null;
  if (msg) await msg.update({ [`flags.${MOD}.usado`]: texto });
}

/** Despierta con 1 PG (lo hace el DM): cobra el precio de volver. */
async function despertar(actor, messageId) {
  await marcarUsado(messageId, "Ya despertó.");
  if (actor.getFlag(MOD, "despertar")) await actor.unsetFlag(MOD, "despertar");
  if (actor.getFlag(MOD, "muerto") || (actor.system.attributes.hp.value > 0)) return;
  await actor.update({ "system.attributes.hp.value": 1 }, { ecosDespierta: true });
}

/* ------------------------------------------------------------------ */
/*  Magia que cura heridas                                            */
/* ------------------------------------------------------------------ */

const MAGIA_CURATIVA = [
  { tipo: "piedad", re: /moribund|spare the dying|piedad con los muertos/i },
  { tipo: "restauracion", re: /restauraci[oó]n menor|restablecimiento menor|lesser restoration/i },
  { tipo: "masa", re: /(sanaci[oó]n|curaci[oó]n) en masa|sanar en masa|mass heal/i },
  { tipo: "sanar", re: /^\s*(sanar|heal)\s*$/i },
  { tipo: "manos", re: /imposici[oó]n de manos|lay on hands/i },
  { tipo: "keoghtom", re: /keoghtom/i }
];
/** Por el nombre (como esté traducido), el nombre original (Babele) o el identificador del conjuro («lesser-restoration»). */
function tipoMagiaCurativa(x) {
  const verbe = tipoCuracionVerbe(x);
  if (verbe) return verbe;
  const nombres = (typeof x === "string") ? [x]
    : [x?.name, x?.flags?.babele?.originalName, String(x?.system?.identifier ?? "").replace(/-/g, " ")];
  for (const n of nombres.filter(Boolean)) {
    const t = MAGIA_CURATIVA.find(m => m.re.test(n))?.tipo;
    if (t) return t;
  }
  return null;
}

const colaCuraciones = crearCola();
function magiaCura(actor, d) { return colaCuraciones(actor.uuid ?? actor.id, () => magiaCuraInterna(actor, d)); }
async function magiaCuraInterna(actor, d) {
  if (d.tipo === "piedad") return estabilizar(actor, { quien: d.de, como: d.objeto });
  if (d.tipo === "pulsoTratamiento") {
    if (curaDeHoy(actor)?.exito || !necesitaCuidados(actor)) return;
    const ok = await foundry.applications.api.DialogV2.confirm({
      window: { title: `Palma que cierra · ${actor.name}` },
      content: `<p>¿Aplicar el tratamiento mágico de <b>${escH(d.de)}</b> a <b>${escH(actor.name)}</b>? Cuenta una sola vez hoy, trata Malherido y avanza un día de Herida No Tratada si pudo reposar. Los PG se resuelven con la tirada de curación.</p>`, rejectClose: false
    });
    if (!ok) return;
    return tratarHeridaConPulso(actor, { leerCura: curaDeHoy, nivel: nivelHNT, aplicar: aplicarTratamiento,
      sanador: d.de, santuario: enSantuario() });
  }
  const n = nivelHNT(actor);
  const sinTratar = malSinTratar(actor);
  if (!n && !sinTratar) return;
  const { DialogV2 } = foundry.applications.api;
  const nota = (d.tipo === "manos")
    ? "<p class=\"ecos-nota\">Cuesta 5 puntos de la reserva de Imposición de Manos por nivel. Si el uso no los descontó, descuéntalos a mano.</p>"
    : "";
  const ok = await DialogV2.confirm({
    window: { title: `Herida No Tratada · ${actor.name}`, icon: "fa-solid fa-hand-sparkles" },
    content: `<div class="ecos-dialogo"><p><b>${d.de}</b> usó <b>${d.objeto}</b> sobre <b>${actor.name}</b>.</p>${n ? `<p>¿Quitar un nivel de Herida No Tratada? Quedaría en ${n - 1}.</p>` : ""}${sinTratar ? `<p>${n ? "Y su" : "¿Su"} <b>Malherido</b> queda <b>tratado</b>${n ? "" : "?"}: la curación lo podrá subir hasta el 75 % de sus PG máximos.</p>` : ""}${nota}</div>`,
    rejectClose: false
  });
  if (!ok) return;
  const L = [];
  if (n) {
    await setHNT(actor, n - 1, (n - 1) ? diaHNT(actor) : 0);
    L.push(`<b>${d.objeto}</b> de <b>${d.de}</b> cierra un nivel de la herida de <b>${actor.name}</b>: ${(n - 1) ? `queda <b>Herida No Tratada ${n - 1}</b>` : "<b>Herida No Tratada curada</b>"}.`);
  }
  if (sinTratar && await tratarMalherido(actor)) {
    L.push(`${n ? "Y su" : `<b>${d.objeto}</b> de <b>${d.de}</b>: su`} <b>Malherido</b> queda <b>tratado</b>. Ya no sangra: la curación lo puede subir hasta <b>${topeMalherido(actor)} PG</b> (75 %).`);
  }
  if (L.length) await publicar(actor, "✨ Magia curativa", L, { extra: guia(actor, GUIA_COMPLETA) });
}

/* ------------------------------------------------------------------ */
/*  Reloj de la Barrera y Eco (solo DM)                               */
/* ------------------------------------------------------------------ */

let RELOJ_PREVIO = null;
const PARPADEOS = {
  1: "<b>Silencio.</b> Una zona del bosque queda sin sonido toda una noche. Nimeria lo nota.",
  2: "<b>Estampida.</b> Los animales del valle bajan hacia el sur en masa. Petra lo registra.",
  3: "<b>Visitante menor.</b> Una criatura de la capa externa (VD ¼–1) aparece en una granja, normalmente la de los Roan.",
  4: "<b>Sueño compartido.</b> Elira, Nimeria, Lira, Claudia y Odonata sueñan lo mismo la misma noche: una escalera que baja y una voz que llega antes que el sonido.",
  5: "<b>Agua gris.</b> El río se enturbia fuera de temporada (Tog avisa) y los instrumentos de Miria se disparan.",
  6: "<b>Raíces.</b> Un árbol despierta en el borde talado. El Guardián del Bosque se acerca.",
  7: "<b>Visitante mayor.</b> Una criatura de VD 2–4 cruza por el sector noreste.",
  8: "<b>El latido.</b> Todo el pueblo siente un pulso bajo los pies durante un minuto. Pánico en la calle y rezos en la capilla."
};
const UMBRALES = {
  5: "El Imperio manda a Edran Voss.",
  6: "Criaturas menores cruzan casi a diario. Las granjas del sureste se vacían.",
  7: "Empieza la excavación imperial.",
  8: "El pulso se oye en todo el pueblo. Los sueños pasan a ser de todos.",
  9: "Los adoptados empiezan a hablar a través de los dormidos.",
  10: "El Pilar del Oeste se apaga. Arcegris queda a la intemperie."
};

/** Al subir el Reloj: tira un parpadeo y avisa los segmentos nuevos (solo al DM). */
async function avisoReloj(v) {
  const antes = RELOJ_PREVIO ?? v;
  RELOJ_PREVIO = v;
  if (!soyGM() || !(v > antes)) return;
  const roll = await new Roll("1d8").evaluate();
  const L = [`Reloj de la Barrera: ${antes} → <b>${v}/10</b>.`, `Parpadeo de esta noche (1d8 = ${roll.total}): ${PARPADEOS[roll.total]}`];
  for (let s = antes + 1; s <= v; s++) if (UMBRALES[s]) L.push(`<b>Segmento ${s}:</b> ${UMBRALES[s]}`);
  if (v <= 4) L.push("Con 3–4 segmentos, además, tira un parpadeo por semana.");
  await susurrarDM("La Barrera parpadea", L);
}

const textoEco = actor => `⏳ El tiempo se detiene medio segundo. <b>${actor.name}</b> aparece hasta 9 m más allá, en un lugar que pueda ver (muévele el token), y puede llevarse a una criatura que esté tocando.`;

/** El Eco (Tramas · 3, Etapa 1). Lo dispara el DM desde el susurro o con la API. */
async function dispararEco(actor, messageId) {
  if (actor.getFlag(MOD, "muerto")) return;
  await marcarUsado(messageId, "Eco disparado.");
  efecto(actor, "eco");
  await actor.setFlag(MOD, "ecos", (actor.getFlag(MOD, "ecos") ?? 0) + 1);
  await sumarReloj(1);
  if (actor.system.attributes.hp.value <= 0) {
    // Vuelve con 1 PG: el precio de volver (que ya incluye +1 Agotamiento) es el costo del Eco.
    return actor.update({ "system.attributes.hp.value": 1 }, { ecosEco: true });
  }
  const exh = actor.system.attributes.exhaustion ?? 0;
  const nuevo = Math.min(exh + 1, CONFIG.DND5E.conditionTypes.exhaustion.levels);
  await actor.update({ "system.attributes.exhaustion": nuevo });
  await publicar(actor, "⏳ El Eco", [textoEco(actor), `Le cuesta <b>+1 Agotamiento</b> (${exh} → ${nuevo}).`], { extra: guia(actor, ["agotamiento"]) });
}

/* ---------- Libros encontrados: lo que el DM pone en esa carpeta lo pueden leer los jugadores ----------
 * La Biblioteca de Nimerios es solo del DM. Un libro arrastrado a «Jugadores / Libros encontrados» queda en Observador para
 * todos; si vuelve a la Biblioteca, queda solo para el DM. Las carpetas se reconocen por su clave, no por el nombre. */
const CARPETA_ENCONTRADOS = "libros-encontrados", CARPETA_BIBLIOTECA = "biblioteca";

async function libroMovido(j) {
  if (!soyGM() || (j?.documentName !== "JournalEntry")) return;
  const c = j.folder?.getFlag?.(MOD, "clave");
  const NIV = CONST.DOCUMENT_OWNERSHIP_LEVELS;
  if (c === CARPETA_ENCONTRADOS) {
    const own = permisosDiario(j.ownership, NIV.OBSERVER);
    if (JSON.stringify(own) === JSON.stringify(j.ownership ?? {})) return;
    await j.update({ ownership: own });
    ui.notifications.info(`«${j.name}»: ahora lo pueden leer los jugadores.`);
  } else if (c === CARPETA_BIBLIOTECA) {
    const u = {};
    if ((j.ownership?.default ?? 0) !== NIV.NONE) u["ownership.default"] = NIV.NONE;
    for (const [id, v] of Object.entries(j.ownership ?? {})) {
      if ((id !== "default") && !game.users.get(id)?.isGM && (v > NIV.NONE)) u[`ownership.${id}`] = NIV.NONE;
    }
    if (foundry.utils.isEmpty(u)) return;
    await j.update(u);
    ui.notifications.info(`«${j.name}»: de vuelta en la Biblioteca, solo para ti.`);
  }
}
Hooks.on("updateJournalEntry", (j, cambios) => {
  if (cambios && ("folder" in cambios)) libroMovido(j).catch(err => console.warn(`${MOD} | libros encontrados`, err));
});
Hooks.on("createJournalEntry", j => {
  libroMovido(j).catch(err => console.warn(`${MOD} | libros encontrados`, err));
});

/* ------------------------------------------------------------------ */
/*  Página "Estado de los PJ" (se reescribe sola; la escribe el DM)   */
/* ------------------------------------------------------------------ */

let ULTIMO_ESTADO = null;
const actualizarEstado = foundry.utils.debounce(() => {
  if (soyGM()) escribirEstado().catch(err => console.error(`${MOD} |`, err));
}, 1500);

async function paginaEstado() {
  let diario = game.journal.get(ID_REGLAS) ?? game.journal.find(j => /reglas de la casa/i.test(j.name));
  if (!diario) {
    const carpeta = game.folders.find(f => (f.type === "JournalEntry") && (f.name === "Reglas de campaña"));
    diario = await JournalEntry.create({
      name: "Estado de los PJ", folder: carpeta?.id ?? null,
      ownership: { default: CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER }
    });
  }
  let pagina = diario.pages.find(p => p.getFlag(MOD, "estado"));
  if (!pagina) {
    // Justo después de la página 5 (si existe), para que quede antes de la 7.
    const p5 = diario.pages.find(p => /^5\s*·/.test(p.name));
    const orden = p5 ? (p5.sort ?? 0) + 1 : Math.max(0, ...diario.pages.map(p => p.sort ?? 0)) + 100000;
    [pagina] = await diario.createEmbeddedDocuments("JournalEntryPage", [{
      name: "6 · Estado de los PJ", type: "text", sort: orden,
      text: { content: "", format: CONST.JOURNAL_ENTRY_PAGE_FORMATS.HTML },
      flags: { [MOD]: { estado: true } }
    }]);
  }
  return pagina;
}

function celdaEstado(a) {
  if (a.getFlag(MOD, "muerto") || a.statuses.has("dead")) return "☠ Muerto";
  if (a.system.attributes.hp.value <= 0) {
    if (!a.statuses.has("stable")) return "Acechado por la Muerte";
    const d = a.getFlag(MOD, "despertar");
    const h = d ? Math.max(0, Math.ceil((d.en - game.time.worldTime) / 3600)) : null;
    return `Estable${h !== null ? ` (despierta en ${h} h)` : ""}`;
  }
  return a.statuses.has("prone") ? "Derribado" : "En pie";
}

function htmlEstado() {
  const pjs = game.actors.filter(esPJ).sort((a, b) => a.name.localeCompare(b.name));
  const filas = pjs.map(a => {
    const hp = a.system.attributes.hp;
    const mal = efectoMalherido(a);
    const nh = nivelHNT(a);
    return `<tr><td><b>${a.name}</b></td><td>${hp.value}/${hp.effectiveMax}</td><td>${celdaEstado(a)}</td>`
      + `<td>${a.system.attributes.exhaustion || "—"}</td>`
      + `<td>${mal ? `${mal.getFlag(MOD, "descansos") ?? 0}/${DESCANSOS_MALHERIDO}` : "—"}</td>`
      + `<td>${nh ? `${nh} (día ${diaHNT(a)}/${DIAS_TRATAMIENTO})` : "—"}</td>`
      + `<td>${textoSecuela(valoresSecuela(a)) || "—"}</td></tr>`;
  }).join("");
  const faltas = pjs.map(a => {
    const it = itemsGuia(a, ["acechado", ...GUIA_COMPLETA]);
    return `<h3>${a.name}</h3>${it.length ? `<ul>${it.map(i => `<li>${i}</li>`).join("")}</ul>` : "<p>Nada pendiente.</p>"}`;
  }).join("");
  const trabajo = pjs.map(a => {
    const d = oficioDe(a);
    const oficios = Object.entries(d.pericia).filter(([, xp]) => xp > 0).sort((x, y) => y[1] - x[1])
      .map(([k, xp]) => {
        const of = infoOficio(d, k);
        const esp = d.especialidad[k] ? ` · ${ESPECIALIDADES[d.especialidad[k]]?.nombre ?? ""}` : "";
        const h = d.herramienta[k] ? ` · herramienta ${ESTADO_HERRAMIENTA[d.herramienta[k]]?.nombre ?? "dañada"}` : "";
        return `${of?.nombre ?? k}: ${rangoPericia(xp).nombre} (${String(redondeo(xp, 1)).replace(".", ",")})${esp}${h}`;
      }).join("<br>") || "—";
    const prestigio = Object.entries(d.prestigio).filter(([, v]) => v !== 0)
      .map(([k, v]) => `${infoPatron(d, k).nombre}: ${v} (${rangoPrestigio(v).nombre})`).join("<br>") || "—";
    const e = d.encargo;
    const of = e ? infoOficio(d, e.oficio) : null;
    const encargo = e ? `${of?.encargos?.[e.nivel] ?? ENCARGOS[e.nivel].nivel} (${of?.nombre ?? e.oficio}, ${ENCARGOS[e.nivel].nivel}) · ${fmtH(e.hecho ?? 0)} de ${e.ht ?? "?"} · vence al terminar el día ${(e.inicio ?? 1) + (e.plazo ?? 3) - 1}` : "—";
    const pedidos = d.pedidos.length ? `<br>Pedidos: ${d.pedidos.map(p => `${p.nombre} (día ${p.listo})`).join(", ")}` : "";
    const noche = d.noche ? `Pagó: ${d.noche.nombre}` : ((d.vida?.dia === d.dia) && d.vida.bono ? `Bien descansado (${signo(d.vida.bono)})` : "—");
    return `<tr><td><b>${a.name}</b><br><span style="font-size:0.85em">Día ${d.dia} · hoy ${fmtH(d.hoy.horas)}</span></td><td>${oficios}</td><td>${prestigio}</td><td>${encargo}${pedidos}</td><td>${noche}</td><td>${textoDinero(totalCobres(a))}</td><td>${d.deuda ? textoDinero(d.deuda) : "—"}</td></tr>`;
  }).join("");
  return `<h1>Estado de los PJ</h1>
<p><em>Esta página la actualiza sola el módulo. Si la editas a mano, se sobrescribe.</em></p>
<p>${enSantuario() ? "🏠 El grupo está en un <b>Santuario</b>: el Descanso Largo es completo." : "🌲 El grupo está <b>a la intemperie</b>: el Descanso Largo cuenta como corto."}</p>
<h2>Heridas</h2>
<table><thead><tr><th>PJ</th><th>PG</th><th>Estado</th><th>Agotamiento</th><th>Malherido</th><th>Herida No Tratada</th><th>Secuela</th></tr></thead><tbody>${filas}</tbody></table>
<h2>Qué le falta a cada uno</h2>
${faltas}
<h2>Oficios</h2>
<table><thead><tr><th>PJ</th><th>Oficios</th><th>Prestigio</th><th>Encargo en curso</th><th>Alojamiento</th><th>Bolsa</th><th>Deuda</th></tr></thead><tbody>${trabajo}</tbody></table>`;
}

async function escribirEstado() {
  if (!soyGM()) return;
  const html = htmlEstado();
  if (html === ULTIMO_ESTADO) return;
  const pagina = await paginaEstado();
  if (!pagina) return;
  ULTIMO_ESTADO = html;
  await pagina.update({ "text.content": html });
}

/* ------------------------------------------------------------------ */
/*  Oficios: trabajo por horas, a destajo y con plazo (Libro VI · 4)  */
/* ------------------------------------------------------------------ */

const ABREV_TODAS = { str: "FUE", dex: "DES", con: "CON", int: "INT", wis: "SAB", cha: "CAR" };
const NOMBRE_HABILIDAD = {
  acr: "Acrobacias", ani: "Trato con Animales", arc: "Arcanos", ath: "Atletismo", dec: "Engaño", his: "Historia",
  ins: "Perspicacia", itm: "Intimidación", inv: "Investigación", med: "Medicina", nat: "Naturaleza", prc: "Percepción",
  prf: "Interpretación", per: "Persuasión", rel: "Religión", slt: "Juego de Manos", ste: "Sigilo", sur: "Supervivencia"
};
const NOMBRE_HERRAMIENTA = {
  carpenter: "herramientas de carpintero", woodcarver: "herramientas de tallador", smith: "herramientas de herrero",
  weaver: "herramientas de tejedor", cook: "utensilios de cocina", brewer: "suministros de cervecero",
  herb: "útiles de herborista", alchemist: "suministros de alquimista", calligrapher: "útiles de caligrafía",
  mason: "herramientas de albañil", leatherworker: "herramientas de curtidor", cobbler: "herramientas de zapatero",
  potter: "herramientas de alfarero", jeweler: "herramientas de joyero", glassblower: "herramientas de soplador de vidrio",
  tinker: "herramientas de chapucero", painter: "útiles de pintor", cartographer: "herramientas de cartógrafo",
  navg: "herramientas de navegante", lute: "laúd", flute: "flauta", drum: "tambor", lyre: "lira", viol: "viola",
  bagpipes: "gaita", horn: "cuerno", shawm: "chirimía", panflute: "flauta de Pan", dulcimer: "dulcémele"
};

const PATRONES = {
  holt: { nombre: "Leñería y Serrería Holt", jefe: "Brennan" },
  martillo: { nombre: "Herrería Martillo Gris", jefe: "Marta Drekken" },
  kurt: { nombre: "Taller de Kurt", jefe: "Kurt" },
  lena: { nombre: "Telar de Lena", jefe: "Lena" },
  hessa: { nombre: "Panadería de Hessa", jefe: "Hessa" },
  nessa: { nombre: "Clínica de Nessa", jefe: "Nessa" },
  miria: { nombre: "Gabinete de Miria", jefe: "Miria" },
  capilla: { nombre: "Capilla de la Llama Serena", jefe: "la hermana Elira" },
  gremio: { nombre: "Gremio de cazadores", jefe: "Petra" },
  piet: { nombre: "Molinos de Piet", jefe: "Piet" },
  lysa: { nombre: "Mensajería de Lysa", jefe: "Lysa" },
  posada: { nombre: "El Último Roble", jefe: "Garrick" },
  concejo: { nombre: "Magistrado Henner", jefe: "el magistrado" },
  guardia: { nombre: "Guardia de Arcegris", jefe: "el capitán Jorik" }
};

const CATEGORIAS = {
  fisico: "Trabajo físico", artesania: "Artesanía", arcano: "Arcano",
  sanacion: "Sanación y fe", salvaje: "Lo salvaje", social: "Trato con gente"
};

/* valor: lo que se paga ese oficio respecto de un peón (1 = jornal de leñador). */
const OFICIOS = {
  tala: { nombre: "Tala", cat: "fisico", entorno: "bosque", patron: "holt", valor: 1, pruebas: ["skill:ath", "abil:con"], encargos: ["Leña para el pueblo", "Robles del ribazo", "Pinos del collado", "Borde salvaje"] },
  serreria: { nombre: "Serrería", cat: "artesania", patron: "holt", valor: 1.1, pruebas: ["tool:carpenter", "tool:woodcarver", "abil:dex"], encargos: ["Tablas de pino", "Vigas de roble", "Tablones finos", "Madera salvaje"] },
  carga: { nombre: "Molienda y carga", cat: "fisico", patron: "piet", valor: 0.9, pruebas: ["skill:ath", "abil:con"], encargos: ["Sacos al molino", "Carros del vado", "Piedras de molino", "Cosecha de otoño"] },
  guardia: { nombre: "Guardia y escolta", cat: "fisico", entorno: "camino", patron: "guardia", valor: 1.1, pruebas: ["skill:prc", "skill:ath", "skill:itm"], encargos: ["Ronda de la plaza", "Puesto del vado", "Escolta de carros", "Patrulla del borde"] },
  herreria: { nombre: "Herrería", cat: "artesania", patron: "martillo", valor: 1.3, pruebas: ["tool:smith"], encargos: ["Clavos y herraduras", "Herramientas de campo", "Armas para la guardia", "Acero de encargo"] },
  carpinteria: { nombre: "Carpintería", cat: "artesania", patron: "kurt", valor: 1.2, pruebas: ["tool:carpenter", "tool:woodcarver"], encargos: ["Arreglos y bancos", "Muebles", "Techumbres", "Obra fina"] },
  tejeduria: { nombre: "Tejeduría", cat: "artesania", patron: "lena", valor: 1, pruebas: ["tool:weaver"], encargos: ["Remiendos", "Paño común", "Mantas y capas", "Tapices"] },
  cocina: { nombre: "Cocina y horno", cat: "artesania", patron: "hessa", valor: 0.9, pruebas: ["tool:cook", "tool:brewer"], encargos: ["Pan del día", "Encargos de la posada", "Banquete del Concejo", "Recetas de feria"] },
  arcano: { nombre: "Trabajo arcano", cat: "arcano", patron: "miria", valor: 1.4, pruebas: ["skill:arc"], encargos: ["Copiar pergaminos", "Identificar curiosidades", "Calibrar instrumentos", "Investigación para Miria"] },
  alquimia: { nombre: "Alquimia", cat: "arcano", patron: "miria", valor: 1.4, pruebas: ["tool:alchemist", "skill:arc"], encargos: ["Tintas y reactivos", "Ácidos y aceites", "Elixires menores", "Experimentos de Miria"] },
  sanacion: { nombre: "Asistente de sanación", cat: "sanacion", patron: "nessa", valor: 1.1, pruebas: ["skill:med"], encargos: ["Vendajes y curas", "Fiebres y partos", "Heridos de la tala", "Casos graves"] },
  herboristeria: { nombre: "Herboristería", cat: "sanacion", patron: "nessa", valor: 1, pruebas: ["tool:herb", "skill:nat", "skill:med"], encargos: ["Secar y moler", "Ungüentos", "Remedios", "Preparados raros"] },
  capilla: { nombre: "Servicio en la capilla", cat: "sanacion", patron: "capilla", valor: 0.8, pruebas: ["skill:rel", "skill:ins"], encargos: ["Velas y limpieza", "Ritos y consuelo", "Funerales y bendiciones", "Peregrinos"] },
  caza: { nombre: "Caza", cat: "salvaje", entorno: "bosque", patron: "gremio", valor: 1.2, pruebas: ["skill:sur"], encargos: ["Liebres y perdices", "Ciervos del valle", "Jabalíes del collado", "Presas de lo salvaje"] },
  recoleccion: { nombre: "Recolección", cat: "salvaje", entorno: "bosque", patron: "nessa", valor: 0.9, pruebas: ["skill:nat", "skill:sur"], encargos: ["Bayas y leña menuda", "Hierbas comunes", "Hongos del bosque hondo", "Raíces del borde"] },
  mensajeria: { nombre: "Mensajería", cat: "social", entorno: "camino", patron: "lysa", valor: 1, pruebas: ["skill:ath", "skill:sur", "skill:prc"], encargos: ["Recados del pueblo", "Granjas del valle", "Puestos de la guardia", "Mensajes delicados"] },
  comercio: { nombre: "Comercio y atención", cat: "social", patron: "posada", valor: 0.9, pruebas: ["skill:per", "skill:ins"], encargos: ["Servir mesas", "Atender el mostrador", "Tratar con mercaderes", "Negociar con la embajada"] },
  actuacion: { nombre: "Actuación", cat: "social", patron: "posada", valor: 0.8, pruebas: ["skill:prf", "tool:lute", "tool:flute", "tool:drum", "tool:lyre", "tool:viol", "tool:bagpipes", "tool:horn", "tool:shawm", "tool:panflute", "tool:dulcimer"], encargos: ["Música de fondo", "Noche de posada", "Fiesta del pueblo", "Función para el Concejo"] },
  escriba: { nombre: "Escriba y contable", cat: "social", patron: "concejo", valor: 1.2, pruebas: ["skill:inv", "skill:his", "tool:calligrapher"], encargos: ["Copiar registros", "Cuentas de comerciantes", "Actas del Concejo", "Documentos imperiales"] }
};

/* Un encargo es una parcela de trabajo medida en horas de un trabajador normal (ht), con plazo en días.
   tarifa: cobres por hora de trabajo hecha (a destajo), antes del valor del oficio. */
const ENCARGOS = [
  { nivel: "Sencillo", cd: 10, ht: 16, plazo: 3, tarifa: 1.25, prestigio: 0, dano: "1d4", riesgo: 0 },
  { nivel: "Normal", cd: 13, ht: 24, plazo: 4, tarifa: 2, prestigio: 3, dano: "1d6", riesgo: 0 },
  { nivel: "Exigente", cd: 16, ht: 32, plazo: 5, tarifa: 3, prestigio: 8, dano: "2d6", riesgo: 1 },
  { nivel: "Maestro", cd: 19, ht: 40, plazo: 6, tarifa: 4.5, prestigio: 15, dano: "3d6", riesgo: 2 }
];
const BONO_ENTREGA = 0.2;
const BONO_ANTICIPO = 0.1;
const MAX_HORAS_DIA = 16;

const RANGOS_PERICIA = [
  { min: 0, nombre: "Novato", bono: -2, rend: 0.8, comp: 1, texto: "−2 a la prueba, rinde ×0,8 y tiene más complicaciones" },
  { min: 10, nombre: "Aprendiz", bono: 0, rend: 1, texto: "rinde normal, sin penalización" },
  { min: 30, nombre: "Oficial", bono: 1, rend: 1.1, texto: "+1 a la prueba, rinde ×1,1 y elige una especialidad" },
  { min: 60, nombre: "Experto", bono: 2, rend: 1.25, repite: true, texto: "+2 a la prueba, rinde ×1,25 y repite sola la primera jornada fallida de cada encargo" },
  { min: 100, nombre: "Maestro", bono: 3, rend: 1.4, repite: true, soloSiFalla: true, ayudante: true, texto: "+3 a la prueba, rinde ×1,4, solo tiene complicaciones si el día sale mal y puede llevar ayudante (ventaja)" }
];
const RANGOS_PRESTIGIO = [
  { min: -Infinity, nombre: "Vetado", tienda: 1.2, texto: "nadie le da encargos: una jornada de prueba sin paga bien hecha lo devuelve a 0. En su tienda le cobran +20 %" },
  { min: 0, nombre: "Conocido", texto: "encargos Sencillos" },
  { min: 3, nombre: "Confiable", texto: "también encargos Normales" },
  { min: 8, nombre: "Respetado", tienda: 0.95, texto: "también encargos Exigentes y −5 % en su tienda" },
  { min: 15, nombre: "Imprescindible", tienda: 0.9, texto: "también encargos de Maestro y −10 % en su tienda" },
  { min: 25, nombre: "Socio", mult: 1.25, tienda: 0.85, texto: "parte del negocio: cobra ×1,25 y −15 % en su tienda" }
];
const ESPECIALIDADES = {
  rapido: { nombre: "Manos rápidas", texto: "+25 % de paga en los días que salen bien." },
  cuidadoso: { nombre: "Cuidadoso", texto: "Las complicaciones solo salen con un 1 en el dado de suceso y su herramienta nunca se daña." },
  renombre: { nombre: "Buen nombre", texto: "+1 Prestigio extra en cada entrega a tiempo." }
};
const RESULTADOS = {
  desastre: { nombre: "mala jornada", mult: 0.5, exito: false },
  fallo: { nombre: "a medias", mult: 0.75, exito: false },
  exito: { nombre: "buen ritmo", mult: 1, exito: true },
  bueno: { nombre: "buena jornada", mult: 1.25, exito: true },
  excelente: { nombre: "jornada excepcional", mult: 1.5, exito: true }
};
const RITMOS = {
  tranquilo: { nombre: "Tranquilo", rend: 0.8, prueba: 2, comp: -1, cd: -2, texto: "rinde ×0,8, +2 a la prueba, menos complicaciones y menos fatiga" },
  normal: { nombre: "Normal", rend: 1, prueba: 0, comp: 0, cd: 0, texto: "sin cambios" },
  apurado: { nombre: "Apurado", rend: 1.25, prueba: -2, comp: 1, cd: 2, texto: "rinde ×1,25, −2 a la prueba, más complicaciones y más fatiga" }
};
const ESTADO_HERRAMIENTA = [
  { nombre: "en buen estado", pen: 0 },
  { nombre: "mellada", pen: -1, arreglo: 3, como: "afilarla" },
  { nombre: "rota", pen: -3, arreglo: 8, como: "repararla" }
];

const COMPLICACIONES = {
  fisico: [
    { tipo: "herramienta", texto: "Se astilla el mango o se deshilacha la cuerda." },
    { tipo: "dano", texto: "Un tronco rueda mal o una carga se suelta." },
    { tipo: "fatiga", texto: "Se exige de más levantando lo que no debía." },
    { tipo: "sinpaga", texto: "Lo hecho hoy se echa a perder: no cuenta." },
    { tipo: "prestigio", texto: "Discute con el capataz delante de todos." },
    { tipo: "escena", texto: "Algo raro en el lugar de trabajo: huellas, ruidos, alguien que mira desde lejos." }
  ],
  artesania: [
    { tipo: "herramienta", texto: "Se mella el filo o se raja el molde." },
    { tipo: "dano", texto: "Un corte o una quemadura de oficio." },
    { tipo: "sinpaga", texto: "La pieza sale defectuosa y hay que tirarla: lo de hoy no cuenta." },
    { tipo: "perdida", texto: "Rompe material caro y tiene que pagarlo." },
    { tipo: "prestigio", texto: "Un cliente devuelve una pieza con malos modos." },
    { tipo: "escena", texto: "Un cliente extraño hace un pedido muy raro." }
  ],
  arcano: [
    { tipo: "perdida", texto: "Se arruina un componente y tiene que reponerlo." },
    { tipo: "dano", texto: "Un chispazo arcano le salta a la cara." },
    { tipo: "fatiga", texto: "Fatiga arcana: la cabeza le zumba." },
    { tipo: "sinpaga", texto: "El trabajo falla sin remedio: lo de hoy no cuenta." },
    { tipo: "prestigio", texto: "Un error asusta al cliente." },
    { tipo: "escena", texto: "Algo responde a la magia desde abajo y los instrumentos de Miria vibran." }
  ],
  sanacion: [
    { tipo: "contagio", texto: "Se expone a un contagio." },
    { tipo: "prestigio", texto: "Un paciente empeora en sus manos." },
    { tipo: "perdida", texto: "Se gastan vendas y hierbas de más, y las paga." },
    { tipo: "fatiga", texto: "Un turno agotador sin pausa." },
    { tipo: "sinpaga", texto: "La familia no puede pagar: lo de hoy no cuenta." },
    { tipo: "escena", texto: "Un caso extraño, sin explicación." }
  ],
  salvaje: [
    { tipo: "herramienta", texto: "Pierde las trampas o se raja el arco o la hoz." },
    { tipo: "dano", texto: "Una mala caída o una mordida." },
    { tipo: "escena", texto: "Una bestia le sale al paso." },
    { tipo: "sinpaga", texto: "Vuelve con las manos vacías: lo de hoy no cuenta." },
    { tipo: "fatiga", texto: "Se pierde y vuelve de noche." },
    { tipo: "escena", texto: "Rastros extraños que no encajan con nada." }
  ],
  social: [
    { tipo: "sinpaga", texto: "Un mal cliente se va sin pagar: lo de hoy no cuenta." },
    { tipo: "perdida", texto: "Le roban de la bolsa." },
    { tipo: "prestigio", texto: "Corre un rumor en su contra." },
    { tipo: "dano", texto: "Se arma una pelea y le toca un golpe." },
    { tipo: "sinpaga", texto: "Se equivoca de encargo: lo de hoy no cuenta." },
    { tipo: "escena", texto: "Alguien con malas intenciones se interesa por él." }
  ]
};
const CONTRATIEMPOS = {
  fisico: ["Llueve un rato y hay que esperar bajo el alero.", "Se suelta una correa y hay que volver a atar la carga.", "El carro se atasca en el barro.", "Llega tarde el que traía las cuñas."],
  artesania: ["El fuego tarda en tomar temperatura.", "Falta material y hay que esperar a que lo traigan.", "Una pieza no encaja y hay que rehacerla.", "Un cliente entra a preguntar y no se va nunca."],
  arcano: ["Las notas de Miria están en una letra imposible.", "Una medición sale distinta cada vez.", "Hay que esperar a que se asiente un reactivo.", "Se acaba la tinta buena."],
  sanacion: ["Llega un vecino con un dolor de muelas y hay que atenderlo.", "No hay agua hervida y hay que esperar.", "Falta una hierba y hay que ir a buscarla.", "Un paciente no deja de hablar."],
  salvaje: ["La niebla baja y no se ve nada.", "Un rastro prometedor se pierde en el arroyo.", "Hay que dar un rodeo por un barranco.", "El viento cambia y la presa huele al cazador."],
  social: ["Nadie entra en toda la mañana.", "Un borracho ocupa la mesa del rincón.", "Hay que esperar a que el destinatario vuelva.", "Una discusión ajena interrumpe todo."]
};
const RACHAS = {
  fisico: ["Un compañero echa una mano sin que se lo pidan.", "El tronco cae justo donde tenía que caer.", "El sol sale y el trabajo vuela."],
  artesania: ["La madera (o el hierro) sale noble y dócil.", "Una técnica nueva le sale a la primera.", "Todo encaja a la primera."],
  arcano: ["Una intuición resuelve lo que llevaba horas atascado.", "Miria deja una nota útil.", "Las cuentas salen solas."],
  sanacion: ["Un paciente mejora más rápido de lo esperado.", "Nessa le enseña un atajo.", "Encuentra justo la hierba que faltaba."],
  salvaje: ["Encuentra un paso de animales fresco.", "El bosque está generoso hoy.", "Un claro lleno de lo que buscaba."],
  social: ["Un cliente contento deja propina.", "Alguien lo recomienda en voz alta.", "La sala está de buen humor."]
};
const ESCENAS = {
  fisico: ["Un viajero pregunta por el camino al Puesto de Korvane.", "Dos jornaleros murmuran sobre los árboles que se mueven.", "Aparece una herramienta vieja, oxidada, que nadie reconoce.", "Brennan y Milo discuten a gritos por el contrato imperial.", "Un niño (¿Pip?) anda rondando donde no debería.", "Alguien dejó una marca tallada en un tronco: una espiral."],
  artesania: ["Un soldado de la embajada pide una pieza urgente y paga en plata imperial.", "Un cliente pregunta demasiado por quién vive en la clínica.", "Aparece una moneda vieja entre la viruta.", "Llega un encargo sin firma, con un dibujo extraño.", "Kunno Drekken pasa a comparar trabajos.", "Un mercader de la caravana quiere saber cuánto produce el pueblo."],
  arcano: ["Los instrumentos de Miria marcan un pico a media tarde.", "Un pergamino viejo tiene anotaciones que no son de Miria.", "Alguien golpea la puerta y se va antes de que abran.", "Una vela se apaga sola tres veces.", "Miria pregunta, como al pasar, si ha soñado algo raro.", "Un libro se abre siempre en la misma página."],
  sanacion: ["Un paciente delira sobre una escalera bajo el pueblo.", "Llega un cazador herido que no quiere decir dónde estuvo.", "La hermana Elira pasa a preguntar por los enfermos.", "Nessa anota algo y esconde el cuaderno.", "Un niño trae flores para una paciente que no tiene familia.", "Un viajero paga con una moneda que nadie conoce."],
  salvaje: ["Huellas de babuino demasiado cerca del pueblo.", "Un ciervo con la cornamenta torcida en espiral.", "Silencio total en una parte del bosque.", "Una trampa vieja, de otro cazador, con algo dentro.", "Los hermanos Wend pasan cargando algo tapado.", "Restos de una fogata reciente donde nadie debería acampar."],
  social: ["Un forastero invita una ronda y hace muchas preguntas.", "Garrick escucha una conversación con demasiada atención.", "Alguien de la embajada pregunta por los Holt.", "Llega una carta para alguien que murió hace años.", "Dos mercaderes se pelean por un precio y piden árbitro.", "Un cliente reconoce al PJ de algún lado."]
};
const AMBIENTE = {
  fisico: ["Huele a resina y a barro.", "El hacha suena hueco en el frío de la mañana.", "Los bueyes resoplan esperando la carga.", "Se oyen los martillazos de la herrería desde lejos."],
  artesania: ["El taller huele a serrín y aceite.", "Por la ventana se ve la plaza medio vacía.", "El fuego crepita sin pausa.", "Alguien canta bajito mientras trabaja."],
  arcano: ["El gabinete zumba como un panal.", "La luz entra de lado sobre los papeles.", "Huele a tinta y a cobre.", "Los instrumentos de bronce tiemblan apenas."],
  sanacion: ["Huele a hierbas hervidas.", "Las vendas se secan al sol en el patio.", "La clínica está en silencio, solo se oye respirar.", "Nessa tararea algo mientras muele."],
  salvaje: ["El bosque gotea después de la lluvia.", "Un pájaro carpintero no se calla.", "El río suena más fuerte que ayer.", "La luz entra verde entre las ramas."],
  social: ["La posada huele a pan y a cerveza.", "La plaza se llena a media mañana.", "Alguien toca una flauta desafinada.", "Finn silba mientras limpia las mesas."]
};
const OPORTUNIDADES = [
  { tipo: "propina", texto: "Un cliente o el patrón, agradecido, deja algo extra." },
  { tipo: "recomendacion", texto: "Lo recomiendan: +1 Prestigio." },
  { tipo: "truco", texto: "Aprende un truco del oficio: +2 de Pericia." },
  { tipo: "contacto", texto: "Conoce a alguien útil (lo decide el DM)." },
  { tipo: "antiguo", texto: "Encuentra algo antiguo entre el trabajo." },
  { tipo: "ventaja", texto: "Le ofrecen un encargo especial: la próxima jornada tira con ventaja." }
];
const EVENTOS_BOSQUE = {
  1: "<b>Hallazgo:</b> un panal, hongos o un nido valioso.",
  2: "<b>Alguien pide ayuda:</b> un cazador o viajero perdido. Si ayuda, pierde media jornada y gana +1 Prestigio (lo aplica el DM).",
  3: "<b>Rastros extraños:</b> huellas, marcas o algo que no encaja.",
  4: "<b>Animal salvaje común:</b> lobos o un jabalí. Encuentro corto o huida.",
  5: "<b>Piedra tallada:</b> una ruina antigua entre las raíces.",
  6: "<b>Criatura de lo salvaje</b> (VD ¼–½).",
  7: "<b>Criatura de lo salvaje</b> (VD 1–2) o exploradores babuinos.",
  8: "<b>El bosque se mueve:</b> árboles despiertos o una sombra enorme."
};
const FRASES = {
  desastre: ["Nada sale como debía. {jefe} no dice nada, y eso es peor.", "Un día para olvidar.", "{jefe} mira lo hecho y suspira."],
  fallo: ["Le cuesta tomarle el ritmo.", "Avanza, pero a tirones.", "{jefe} anota algo en su libreta."],
  exito: ["Jornada honesta, sin sorpresas.", "Trabajo bien hecho.", "Termina cansado pero conforme."],
  bueno: ["Buen día: el trabajo fluye.", "{jefe} se fija en la calidad.", "Le sale fluido; hasta le sobra aliento."],
  excelente: ["Jornada memorable. {jefe} lo comenta con todo el que pasa.", "Trabajo de los que se recuerdan.", "Hasta los veteranos se acercan a mirar."]
};

const azar = lista => lista[Math.floor(Math.random() * lista.length)];
const rangoPericia = xp => [...RANGOS_PERICIA].reverse().find(r => xp >= r.min);
const sigRangoPericia = xp => RANGOS_PERICIA.find(r => r.min > xp) ?? null;
const rangoPrestigio = p => [...RANGOS_PRESTIGIO].reverse().find(r => p >= r.min);
const slug = s => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "oficio";
const redondeo = (n, d = 1) => Math.round(n * (10 ** d)) / (10 ** d);
const fmtH = n => `${String(redondeo(n, 1)).replace(".", ",")} h`;
/** Cobres a texto: 37 → "3 p 7 c". */
function textoDinero(c) {
  c = Math.round(Number(c) || 0);
  if (c < 10) return `${c} c`;
  const o = Math.floor(c / 100);
  const p = Math.floor((c % 100) / 10);
  const r = c % 10;
  return [o ? `${o} o` : "", p ? `${p} p` : "", r ? `${r} c` : ""].filter(Boolean).join(" ") || "0 c";
}
const barra = (h, t) => {
  const n = Math.round(Math.clamp(h / Math.max(t, 1), 0, 1) * 10);
  return `<span class="ecos-barra">${"▰".repeat(n)}${"▱".repeat(10 - n)}</span>`;
};

function oficioDe(actor) {
  const d = foundry.utils.deepClone(actor.getFlag(MOD, "oficio") ?? {});
  for (const k of ["prestigio", "pericia", "especialidad", "stats", "herramienta", "otros", "personalizados", "patronesExtra"]) d[k] ??= {};
  // Compatibilidad con la versión 1.4: herramientaRota → herramienta mellada
  for (const [k, v] of Object.entries(d.herramientaRota ?? {})) if (v && (d.herramienta[k] === undefined)) d.herramienta[k] = 1;
  delete d.herramientaRota;
  d.encargo ??= null;
  d.registro ??= [];
  d.pedidos ??= [];
  d.deuda = Number(d.deuda ?? 0);
  d.contador = Number(d.contador ?? 0);
  d.saldo = Number(d.saldo ?? 0);
  d.dia = Number(d.dia ?? 1);
  d.hoy ??= { dia: d.dia, horas: 0 };
  if (d.hoy.dia !== d.dia) d.hoy = { dia: d.dia, horas: 0 };
  d.hoy.seguidas = Number(d.hoy.seguidas ?? 0); // horas desde el último descanso (corto o largo)
  d.largas = Number(d.largas ?? 0);
  d.ventaja ??= false;
  d.ultimo ??= null;
  d.vida ??= null;
  d.noche ??= null; // alojamiento pagado para la próxima noche
  return d;
}
/** Guarda los datos de oficio (las listas se reemplazan enteras; los objetos se combinan). */
const guardarOficio = (actor, d) => actor.update({ [`flags.${MOD}.oficio`]: { ...d, herramientaRota: null } }, { ecosInterno: true });

const infoOficio = (datos, key) => OFICIOS[key] ?? datos.personalizados?.[key] ?? null;
const infoPatron = (datos, key) => PATRONES[key] ?? datos.patronesExtra?.[key] ?? { nombre: key, jefe: "el patrón" };

/** Mejor herramienta de calidad del inventario para un oficio. */
function herramientaCalidad(actor, key) {
  let mejor = null;
  for (const it of actor.items) {
    const h = it.getFlag?.(MOD, "herramienta");
    if (!h?.oficios?.includes(key)) continue;
    if (!mejor || (h.bono > mejor.bono)) mejor = { nombre: it.name, bono: Number(h.bono) || 0 };
  }
  return mejor;
}

/** La mejor prueba del personaje para un oficio: habilidad, herramienta o característica. */
function mejorPrueba(actor, of) {
  let mejor = null;
  for (const p of of.pruebas ?? []) {
    const [tipo, k] = p.split(":");
    let bono = null;
    let etiqueta = "";
    if (tipo === "skill") {
      const s = actor.system.skills?.[k];
      if (!s) continue;
      bono = s.total ?? s.mod ?? 0;
      etiqueta = NOMBRE_HABILIDAD[k] ?? CONFIG.DND5E.skills[k]?.label ?? k;
    } else if (tipo === "tool") {
      const cfg = CONFIG.DND5E.tools?.[k];
      if (!cfg) continue;
      const t = actor.system.tools?.[k];
      const habil = t?.ability ?? cfg.ability ?? "int";
      bono = t ? (t.total ?? t.mod ?? 0) : (actor.system.abilities?.[habil]?.mod ?? 0);
      etiqueta = `${NOMBRE_HERRAMIENTA[k] ?? k}${t ? "" : ` (sin competencia, ${ABREV_TODAS[habil] ?? habil})`}`;
      if (!mejor || (bono > mejor.bono)) mejor = { tipo, k, bono, etiqueta, habil, tiene: !!t };
      continue;
    } else if (tipo === "abil") {
      const a = actor.system.abilities?.[k];
      if (!a) continue;
      bono = a.mod ?? 0;
      etiqueta = `prueba de ${ABREV_TODAS[k] ?? k}`;
    } else continue;
    if (!mejor || (bono > mejor.bono)) mejor = { tipo, k, bono, etiqueta };
  }
  return mejor ?? { tipo: "abil", k: "str", bono: actor.system.abilities?.str?.mod ?? 0, etiqueta: "prueba de FUE" };
}

function resultadoJornada(total, nat, cd) {
  if (nat === 1) return "fallo";
  if ((nat === 20) || (total >= cd + 10)) return "excelente";
  if (total >= cd + 5) return "bueno";
  if (total >= cd) return "exito";
  if (total >= cd - 4) return "fallo";
  return "desastre";
}

/** Probabilidad de éxito y multiplicador medio de rendimiento para un bono contra una CD. */
function pronostico(bono, cd, ventaja = false) {
  let prob = 0;
  let mult = 0;
  for (let d = 1; d <= 20; d++) {
    const peso = ventaja ? (((2 * d) - 1) / 400) : (1 / 20);
    const r = RESULTADOS[resultadoJornada(d + bono, d, cd)];
    if (r.exito) prob += peso;
    mult += peso * r.mult;
  }
  return { prob: Math.round(prob * 100), mult };
}

/** CD de la salvación de CON por las horas trabajadas en el día. */
function cdFatiga(horas, largas = 0, ritmo = "normal") {
  if (horas <= 8) return null;
  return 10 + (horas - 8) + Math.max(0, horas - 12) + (2 * largas) + (RITMOS[ritmo]?.cd ?? 0);
}

/** Todo lo que cambia la prueba y el rendimiento de un PJ en un oficio. */
function calculoOficio(actor, datos, key, ritmo = "normal") {
  const of = infoOficio(datos, key);
  const prueba = mejorPrueba(actor, of);
  const xp = datos.pericia[key] ?? 0;
  const rango = rangoPericia(xp);
  const pres = datos.prestigio[of.patron] ?? 0;
  const rp = rangoPrestigio(pres);
  const estado = ESTADO_HERRAMIENTA[datos.herramienta[key] ?? 0] ?? ESTADO_HERRAMIENTA[0];
  const calidad = herramientaCalidad(actor, key);
  const otros = Number(datos.otros[key] ?? 0);
  const vida = (datos.vida?.dia === datos.dia) ? Number(datos.vida.bono ?? 0) : 0;
  const R = RITMOS[ritmo] ?? RITMOS.normal;
  const exh = actor.system.attributes.exhaustion ?? 0;
  const partes = { pericia: rango.bono, otros, herramienta: estado.pen, calidad: calidad?.bono ?? 0, vida, ritmo: R.prueba };
  const bono = prueba.bono + Object.values(partes).reduce((t, v) => t + v, 0);
  const valor = (of.valor ?? 1) * (rp.mult ?? 1);
  return { of, prueba, xp, rango, pres, rp, estado, calidad, otros, vida, R, exh, partes, bono, valor };
}

async function tirarOficio(actor, prueba, cd, extras, { ventaja = false, flavor = "" } = {}) {
  const parts = [];
  const data = {};
  for (const [k, v] of Object.entries(extras)) {
    if (!v) continue;
    parts.push(`@${k}`);
    data[k] = v;
  }
  const config = { target: cd, rolls: [{ parts, data }] };
  if (ventaja) config.advantage = true;
  const dialog = { configure: false };
  // sinSoul: la jornada tiene su propio aviso de Moneda Antigua (no se ofrece dos veces).
  const message = { data: { flavor, flags: { [MOD]: { sinSoul: true } } } };
  let rolls;
  if (prueba.tipo === "skill") rolls = await actor.rollSkill({ ...config, skill: prueba.k }, dialog, message);
  else if ((prueba.tipo === "tool") && prueba.tiene) rolls = await actor.rollToolCheck({ ...config, tool: prueba.k }, dialog, message);
  else rolls = await actor.rollAbilityCheck({ ...config, ability: prueba.habil ?? prueba.k }, dialog, message);
  const roll = rolls?.[0];
  if (!roll) return null;
  const nat = roll.d20?.total ?? roll.dice?.[0]?.total ?? 0;
  return { roll, total: roll.total, nat };
}

/* ---------- Monedas Antiguas: repetir una tirada que salió mal ---------- */
const soulCoins = monedas;

/** Pregunta al que tira si gasta una Moneda Antigua para repetir. Devuelve true si la gastó. */
async function ofrecerSoulCoin(actor, texto) {
  const n = soulCoins(actor);
  if ((n < 1) || !actor.isOwner) return false;
  const { DialogV2 } = foundry.applications.api;
  const ok = await DialogV2.confirm({
    window: { title: "¿Usar una Moneda Antigua?", icon: "fa-solid fa-coins" },
    content: `<div class="ecos-dialogo ecos-soul"><p>${texto}</p><p>Tienes <b>${plural(n, "Moneda Antigua", "Monedas Antiguas")}</b>. ¿Gastas una para repetir la tirada?</p></div>`,
    yes: { label: "Sí", icon: "fa-solid fa-check" },
    no: { label: "No", icon: "fa-solid fa-xmark", default: true },
    rejectClose: false
  });
  if (!ok || (soulCoins(actor) < 1)) return false;
  await actor.update({ "system.currency.soul": soulCoins(actor) - 1 });
  await visionSoul(actor);
  return true;
}

/*
 * Al gastarse, la Moneda Antigua vibra y deja ver algo fuera del tiempo (una pista breve). Solo DM: resuena con
 * la Sangre Antigua del portador (Tramas · 16). Se lo ve el dueño del personaje y el DM.
 */
const VISIONES_SOUL = [
  "Una escalera de piedra que baja más de lo que debería. Abajo, alguien cuenta hasta once y vuelve a empezar.",
  "Una mujer de pelo gris canta una nana en una cocina. La canción tiene un compás de más, como un corazón.",
  "Tres marcas en una viga, iluminadas un segundo por un fuego que se apaga.",
  "Tus propias manos, más viejas, apoyadas en una pared cubierta de escritura que se mueve.",
  "Un árbol enorme se detiene en seco, como si una línea invisible en el suelo le cerrara el paso.",
  "Agua tibia que sale de la piedra en pleno invierno. Peces blancos, sin ojos.",
  "Un niño pega la oreja a la tierra y sonríe: «está cantando otra vez».",
  "Una campana que suena sola, muy bajo, en una noche sin viento.",
  "Un rostro liso, sin rasgos, se mira en un charco y no encuentra a nadie.",
  "Un sobre lacrado con una caligrafía perfecta pasa de mano en mano. Ninguna mano es la misma dos veces.",
  "Desde muy arriba: una cúpula de luz sobre el valle que respira… y en un punto se agrieta.",
  "Un molino que gira al revés en una noche quieta.",
  "Una piedra negra que bebe la luz de una vela sin apagarla.",
  "Un pozo. Desde el fondo, una columna de luz azul sube recta hacia el cielo durante un latido.",
  "Un faro lejano, al sur, parpadea tres veces y se queda mirándote.",
  "Una jaula vacía. En el suelo, una cuchara de plata.",
  "Un rebaño de ovejas se niega a subir una ladera, todas a la vez, sin que nadie las guíe.",
  "Un mapa tallado en madera: tres puntos y una espiral.",
  "Una mano deja pan sobre un tocón al anochecer. Al amanecer, otra mano, enorme, lo recoge.",
  "Tu propia voz te contesta antes de que hayas hablado.",
  "Algo muy grande duerme bajo tus pies. Su respiración mueve el polvo de las calles.",
  "Un hombre cuenta en voz alta, «nueve, diez, once», se calla y se pone a escuchar.",
  "Una reja de bronce con una espiral. Detrás, en la oscuridad, algo respira.",
  "Las velas de una capilla se inclinan, todas a la vez, hacia una muchacha de pelo plateado.",
  "Raíces de tejo abrazando una losa, como dedos que no la dejan abrirse.",
  "Un collar de dientes y cuentas negras cae al suelo y, de golpe, el bosque vuelve a hablar.",
  "Un latido enorme y lento, muy abajo, que se salta un golpe.",
  "Una llama pequeña que el viento no consigue apagar, en una capilla de frontera.",
  "Por un instante sabes la hora exacta en que algo va a pasar. Y la olvidas.",
  "Senderos de luz se encienden entre los árboles y se apagan en cuanto los miras."
];
async function visionSoul(actor) {
  try {
    const v = VISIONES_SOUL[Math.floor(Math.random() * VISIONES_SOUL.length)];
    const duenos = game.users.filter(u => !u.isGM && actor.testUserPermission(u, "OWNER")).map(u => u.id);
    await ChatMessage.create({
      content: tarjeta("✦ La moneda vibra", [
        `La Moneda Antigua de <b>${actor.name}</b> tiembla, se calienta y se deshace en polvo entre los dedos. Por un instante, fuera del tiempo…`,
        `<i>${v}</i>`
      ], { clase: "ecos-soul" }),
      whisper: [...new Set([...duenos, ...idsGM(), game.user.id])],
      speaker: ChatMessage.getSpeaker({ actor }),
      flags: { [MOD]: { vision: true } }
    });
  } catch (err) {
    console.error(`${MOD} | visión`, err);
  }
}

/**
 * Tirada que usa el módulo para decidir algo (tratamiento, intemperie, estabilizar): si sale un 1 natural
 * y el PJ tiene Monedas Antiguas, pregunta en el momento y repite. La tirada que vale es la última.
 */
async function tiradaConSoul(actor, tirar, que) {
  const cfg = { data: { flags: { [MOD]: { sinSoul: true } } } };
  let roll = (await tirar(cfg))?.[0];
  while (roll && esPJ(actor) && esUnoNatural(roll) && (soulCoins(actor) > 0) && actor.isOwner) {
    if (!(await ofrecerSoulCoin(actor, `<b>${actor.name}</b> saca un <b>1 natural</b> (${que}).`))) break;
    roll = (await tirar(cfg))?.[0] ?? roll;
  }
  return roll;
}

/** Quién decide gastar la Moneda Antigua de un PJ: su jugador si está conectado; si no, el DM. */
function decideSoul(actor) {
  const jugador = game.users.find(u => u.active && !u.isGM && actor.testUserPermission(u, "OWNER"));
  return (jugador ?? game.users.activeGM ?? null)?.id === game.user.id;
}
const esUnoNatural = r => !!r && (r.dice?.[0]?.faces === 20) && (r.isFumble === true);
const TIPO_TIRADA = { attack: "ataque", save: "salvación", check: "prueba", skill: "prueba", tool: "prueba", ability: "prueba", concentration: "concentración", initiative: "iniciativa" };

/**
 * Cualquier 1 natural de un PJ en un d20 (ataque, salvación, prueba, iniciativa): aviso "¿Usar una Moneda Antigua?".
 * La repetición sale como una tirada nueva en el chat (vale la nueva). Las salvaciones de muerte lo ofrecen
 * en su propia tarjeta; la jornada de trabajo tiene su propio aviso.
 */
async function soulPorUno(message) {
  const f = message.flags ?? {};
  if (f[MOD]?.sinSoul || f[MOD]?.soulDe) return;
  const roll = (message.rolls ?? []).find(esUnoNatural);
  if (!roll || roll.options?.[MOD]?.soulVisto) return;
  const tipo = f.dnd5e?.roll?.type ?? (f.core?.initiativeRoll ? "initiative" : "");
  if (tipo === "death") return;
  const actor = ChatMessage.getSpeakerActor(message.speaker) ?? game.actors.get(message.speaker?.actor);
  if (!esPJ(actor) || (soulCoins(actor) < 1) || !decideSoul(actor)) return;
  const que = TIPO_TIRADA[tipo] ?? "tirada";
  if (!(await ofrecerSoulCoin(actor, `<b>${actor.name}</b> saca un <b>1 natural</b> (${que}).`))) return;
  const nueva = await roll.reroll();
  const modo = message.blind ? "blindroll" : ((message.whisper?.length) ? "gmroll" : "publicroll");
  await nueva.toMessage({
    speaker: message.speaker,
    flavor: `${message.flavor ? `${message.flavor} · ` : ""}<b>Repetida con una Moneda Antigua</b> (antes: 1 natural). Vale esta.`,
    flags: { [MOD]: { soulDe: message.id } }
  }, { rollMode: modo });
  if (tipo === "initiative") {
    const c = game.combat?.combatants.find(x => x.actorId === actor.id);
    if (c?.isOwner) await c.update({ initiative: nueva.total });
  }
}
Hooks.on("createChatMessage", message => {
  soulPorUno(message).catch(err => console.error(`${MOD} | Moneda Antigua`, err));
  // Tarjeta de salvación de muerte con un 1 natural: el aviso Sí / No para el dueño.
  const t = message.flags?.[MOD]?.tarjeta;
  if (!t?.pifia || t.usada) return;
  const actor = game.actors.get(t.actorId);
  if (!actor || (soulCoins(actor) < 1) || !decideSoul(actor)) return;
  ofrecerSoulAMuerte(actor, message).catch(err => console.error(`${MOD} | Moneda Antigua`, err));
});
async function ofrecerSoulAMuerte(actor, message) {
  const { DialogV2 } = foundry.applications.api;
  const n = soulCoins(actor);
  const ok = await DialogV2.confirm({
    window: { title: "¿Usar una Moneda Antigua?", icon: "fa-solid fa-coins" },
    content: `<div class="ecos-dialogo ecos-soul"><p><b>${actor.name}</b> saca un <b>1 natural</b> en la salvación de muerte (dos fallos).</p><p>Tienes <b>${plural(n, "Moneda Antigua", "Monedas Antiguas")}</b>. ¿Gastas una para repetir la tirada?</p></div>`,
    yes: { label: "Sí", icon: "fa-solid fa-check" },
    no: { label: "No", icon: "fa-solid fa-xmark", default: true },
    rejectClose: false
  });
  if (ok) alDM({ accion: "repetir", tipo: "moneda", messageId: message.id, userId: game.user.id });
}

/* ---------- Monedas Antiguas dentro de midi-qol: el ataque o la salvación repetida cuenta para la automatización ---------- */
const ESPERAS_SOUL = new Map();

/** Mensajes de socket de las Monedas Antiguas (los atiende cualquier cliente). true si era uno de estos. */
function manejarSoulSocket(d) {
  if (d?.accion === "preguntaSoul") {
    if (d.para === game.user.id) {
      const actor = game.actors.get(d.actorId);
      (actor ? ofrecerSoulCoin(actor, d.texto) : Promise.resolve(false))
        .catch(() => false)
        .then(si => game.socket.emit(`module.${MOD}`, { accion: "respuestaSoul", id: d.id, si: si === true, para: d.de }));
    }
    return true;
  }
  if (d?.accion === "respuestaSoul") {
    if (d.para === game.user.id) {
      ESPERAS_SOUL.get(d.id)?.(d.si === true);
      ESPERAS_SOUL.delete(d.id);
    }
    return true;
  }
  return false;
}

/** Pregunta al jugador del PJ (o al DM si no está) si gasta una Moneda Antigua; espera su respuesta. true si la gastó. */
async function preguntarSoul(actor, texto, espera = 60000) {
  if (!esPJ(actor) || (soulCoins(actor) < 1)) return false;
  if (decideSoul(actor)) return ofrecerSoulCoin(actor, texto);
  const quien = game.users.find(u => u.active && !u.isGM && actor.testUserPermission(u, "OWNER")) ?? game.users.activeGM;
  if (!quien || quien.isSelf) return false;
  const id = foundry.utils.randomID();
  return new Promise(res => {
    const t = setTimeout(() => {
      ESPERAS_SOUL.delete(id);
      res(false);
    }, espera);
    ESPERAS_SOUL.set(id, si => {
      clearTimeout(t);
      res(si);
    });
    game.socket.emit(`module.${MOD}`, { accion: "preguntaSoul", id, actorId: actor.id, texto, para: quien.id, de: game.user.id });
  });
}

async function avisoRepeticion(actor, que, roll) {
  await game.dice3d?.showForRoll?.(roll, game.user, true);
  await ChatMessage.create({
    content: tarjeta("✦ Moneda Antigua", [`<b>${actor.name}</b> gasta una Moneda Antigua y repite la ${que}: <b>${roll.total}</b> (antes: 1 natural). Vale esta.`], { clase: "ecos-soul" }),
    speaker: ChatMessage.getSpeaker({ actor }),
    flags: { [MOD]: { soulDe: "midi" } }
  });
}

/** midi-qol: un 1 natural en el ataque de un PJ se puede repetir antes de comprobar si acierta. */
Hooks.on("midi-qol.preCheckHits", async workflow => {
  try {
    const roll = workflow?.attackRoll;
    const actor = workflow?.actor;
    if (!roll || roll.options?.[MOD]?.soulVisto || !esPJ(actor) || (soulCoins(actor) < 1) || !esUnoNatural(roll)) return;
    foundry.utils.setProperty(roll, `options.${MOD}.soulVisto`, true);
    if (!(await preguntarSoul(actor, `<b>${actor.name}</b> saca un <b>1 natural</b> (ataque${workflow.item ? ` con ${workflow.item.name}` : ""}).`))) return;
    const nueva = await roll.reroll();
    foundry.utils.setProperty(nueva, `options.${MOD}`, { soulVisto: true, sinSoul: true });
    if (typeof workflow.setAttackRoll === "function") await workflow.setAttackRoll(nueva);
    else workflow.attackRoll = nueva;
    await avisoRepeticion(actor, "tirada de ataque", nueva);
  } catch (err) {
    console.error(`${MOD} | Moneda Antigua (ataque midi)`, err);
  }
});

/** midi-qol: un 1 natural en la salvación de un PJ se puede repetir antes de decidir si salva. */
function engancharMidi() {
  const proto = globalThis.MidiQOL?.Workflow?.prototype;
  if (!proto?.processTargetSaveResult || proto[`_${MOD}Soul`]) return;
  const original = proto.processTargetSaveResult;
  proto.processTargetSaveResult = async function (target, result, context) {
    try {
      const actor = target?.actor;
      const r0 = Array.isArray(result) ? result[0] : null;
      if (r0 && !r0.options?.[MOD]?.soulVisto && esPJ(actor) && (soulCoins(actor) > 0) && esUnoNatural(r0)) {
        foundry.utils.setProperty(r0, `options.${MOD}.soulVisto`, true);
        const que = (context?.rollType === "save") ? "salvación" : "prueba";
        if (await preguntarSoul(actor, `<b>${actor.name}</b> saca un <b>1 natural</b> (${que}${this.item ? ` contra ${this.item.name}` : ""}).`)) {
          const nueva = await r0.reroll();
          foundry.utils.setProperty(nueva, `options.${MOD}`, { soulVisto: true, sinSoul: true });
          result = [nueva, ...result.slice(1)];
          await avisoRepeticion(actor, que, nueva);
        }
      }
    } catch (err) {
      console.error(`${MOD} | Moneda Antigua (salvación midi)`, err);
    }
    return original.call(this, target, result, context);
  };
  proto[`_${MOD}Soul`] = true;
}

/** Salvación de Constitución que, si falla, se puede repetir gastando Monedas Antiguas. */
async function salvacionConSoul(actor, cd, motivo) {
  const tirar = async () => (await actor.rollSavingThrow({ ability: "con", target: cd }, { configure: false }, { data: { flags: { [MOD]: { sinSoul: true } } } }))?.[0];
  let sv = await tirar();
  const notas = [];
  while (sv && (sv.total < cd) && (soulCoins(actor) > 0)) {
    if (!(await ofrecerSoulCoin(actor, `${motivo}: salvación de Constitución <b>${sv.total}</b> contra CD ${cd}. Falla.`))) break;
    const antes = sv.total;
    const otra = await tirar();
    if (!otra) break;
    notas.push(`${antes} → ${otra.total}`);
    sv = otra;
  }
  return { sv, nota: notas.length ? ` (Moneda Antigua: ${notas.join(", ")})` : "" };
}

/** Una Moneda Antigua más en la bolsa (es una moneda de la hoja, no un objeto). */
async function anadirMonedaAntigua(actor, n = 1) {
  return actor.update({ "system.currency.soul": monedas(actor) + n });
}
const sumarCobres = (actor, c) => (c > 0 ? actor.update({ "system.currency.cp": (actor.system.currency?.cp ?? 0) + c }) : null);
/** Todo el dinero que lleva encima: la bolsa de la hoja y lo guardado en sus bolsos. */
const totalCobres = actor => cpDe(actor.system.currency) + bolsosConMonedas(actor).reduce((t, i) => t + cpDe(i.system.currency), 0);

/** Ítem "Oficio · X" en la hoja con el progreso y el registro de jornadas. */
async function actualizarRegistroHoja(actor, datos, key) {
  const of = infoOficio(datos, key);
  if (!of) return;
  const c = calculoOficio(actor, datos, key);
  const sig = sigRangoPericia(c.xp);
  const patron = infoPatron(datos, of.patron);
  const st = datos.stats[key] ?? {};
  const esp = datos.especialidad[key] ? ESPECIALIDADES[datos.especialidad[key]] : null;
  const enc = (datos.encargo?.oficio === key) ? datos.encargo : null;
  const filas = datos.registro.filter(r => r.oficio === key).slice(-10).reverse()
    .map(r => `<tr><td>Día ${r.dia ?? "—"}</td><td>${r.encargo}</td><td>${r.horas ? fmtH(r.horas) : "—"}</td><td>${r.total} vs ${r.cd}</td><td>${RESULTADOS[r.resultado]?.nombre ?? r.resultado}${r.comp ? " · complicación" : ""}${r.op ? " · oportunidad" : ""}</td><td>${r.avance ? fmtH(r.avance) : "—"}</td><td>${textoDinero(r.paga)}</td></tr>`).join("");
  const xpTxt = String(redondeo(c.xp, 1)).replace(".", ",");
  const porc = sig ? Math.round(((c.xp - c.rango.min) / (sig.min - c.rango.min)) * 100) : 100;
  const html = `<h2>Oficio: ${of.nombre}</h2>
<p><em>Registro automático del módulo Ecos de la frontera. Se actualiza en cada jornada.</em></p>
<table>
<tr><th>Rango</th><td><b>${c.rango.nombre}</b> (${c.rango.texto})</td></tr>
<tr><th>Pericia</th><td>${xpTxt} jornadas de práctica${sig ? ` · ${sig.nombre} a las ${sig.min} (${porc} %)` : " · rango máximo"}</td></tr>
<tr><th>Especialidad</th><td>${esp ? `<b>${esp.nombre}</b>: ${esp.texto}` : (c.xp >= 30 ? "Por elegir" : "Se elige al llegar a Oficial")}</td></tr>
<tr><th>Prueba</th><td>${c.prueba.etiqueta} (${signo(c.prueba.bono)})${c.calidad ? ` · ${c.calidad.nombre} +${c.calidad.bono}` : ""}</td></tr>
<tr><th>Patrón</th><td>${patron.nombre} · Prestigio <b>${c.pres}</b> (${c.rp.nombre}; ${c.rp.texto})</td></tr>
<tr><th>Herramienta</th><td>${c.estado.pen ? `<b>${c.estado.nombre}</b> (${c.estado.pen} hasta ${c.estado.como}, ${c.estado.arreglo} c)` : "En buen estado"}</td></tr>
<tr><th>Encargo en curso</th><td>${enc ? `${of.encargos?.[enc.nivel] ?? ENCARGOS[enc.nivel].nivel} (${ENCARGOS[enc.nivel].nivel}) · ${fmtH(enc.hecho)} de ${enc.ht} · vence al terminar el día ${enc.inicio + enc.plazo - 1}` : "—"}</td></tr>
<tr><th>Totales</th><td>${st.jornadas ?? 0} jornada(s) · ${fmtH(st.horas ?? 0)} trabajadas · ${st.entregas ?? 0} encargo(s) entregados · ${st.complicaciones ?? 0} complicación(es) · ${textoDinero(st.ganado ?? 0)} ganados</td></tr>
</table>
<h3>Últimas jornadas</h3>
${filas ? `<table><thead><tr><th>Día</th><th>Encargo</th><th>Horas</th><th>Tirada</th><th>Resultado</th><th>Avance</th><th>Paga</th></tr></thead><tbody>${filas}</tbody></table>` : "<p>Todavía no trabajó en este oficio.</p>"}`;
  const nombre = `Oficio · ${of.nombre} (${c.rango.nombre})`;
  const item = actor.items.find(i => i.getFlag(MOD, "oficio") === key);
  if (item) {
    if ((item.name !== nombre) || (item.system.description?.value !== html)) await item.update({ name: nombre, "system.description.value": html });
  } else {
    await actor.createEmbeddedDocuments("Item", [{
      name: nombre, type: "feat", img: `${RUTA}/icons/oficio.svg`,
      system: { description: { value: html } },
      flags: { [MOD]: { oficio: key } }
    }]);
  }
}

/** Botón "Trabajar": elige el PJ y abre la ventana. */
async function abrirJornada(actorDirecto = null) {
  const { DialogV2 } = foundry.applications.api;
  if (actorDirecto) return dialogoJornada(actorDirecto);
  const propios = game.actors.filter(a => esPJ(a) && a.isOwner).sort((a, b) => a.name.localeCompare(b.name));
  if (!propios.length) return ui.notifications.warn("No tienes un PJ que pueda trabajar.");
  const seleccionado = canvas.tokens?.controlled.map(t => t.actor).find(a => propios.includes(a));
  let actor = seleccionado ?? ((propios.length === 1) ? propios[0] : (propios.includes(game.user.character) ? game.user.character : null));
  if (!actor) {
    const r = await DialogV2.wait({
      window: { title: "Jornada de trabajo", icon: "fa-solid fa-hammer" },
      content: `<div class="ecos-dialogo"><div class="form-group"><label>¿Quién trabaja?</label><select name="actor">${propios.map(a => `<option value="${a.id}">${a.name}</option>`).join("")}</select></div></div>`,
      rejectClose: false,
      buttons: [
        { action: "ok", label: "Elegir", icon: "fa-solid fa-check", default: true, callback: (ev, b) => leerFormulario(b) },
        { action: "cancelar", label: "Cancelar", icon: "fa-solid fa-xmark" }
      ]
    });
    if (!r || (typeof r === "string")) return;
    actor = game.actors.get(r.actor);
  }
  if (actor) return dialogoJornada(actor);
}

function puedeTrabajar(actor, datos = oficioDe(actor)) {
  if (actor.system.attributes.hp.value <= 0) return `${actor.name} está a 0 PG: no puede trabajar.`;
  if ((actor.system.attributes.exhaustion ?? 0) >= 5) return `${actor.name} tiene Agotamiento 5: apenas se tiene en pie.`;
  if ((MAX_HORAS_DIA - datos.hoy.horas) < 1) return `${actor.name} ya trabajó ${MAX_HORAS_DIA} horas hoy. Tiene que dormir (Descanso Largo) antes de volver a trabajar.`;
  return null;
}


async function dialogoJornada(actor, preferido = null) {
  const { DialogV2 } = foundry.applications.api;
  const datos = oficioDe(actor);
  const aviso = puedeTrabajar(actor, datos);
  if (aviso) return ui.notifications.warn(aviso);
  const enc = datos.encargo;
  const todos = { ...OFICIOS, ...datos.personalizados };
  const libres = Math.floor(MAX_HORAS_DIA - datos.hoy.horas);

  // Datos de cada oficio para la vista previa (tres ritmos)
  const info = {};
  for (const k of Object.keys(todos)) {
    const base = calculoOficio(actor, datos, k);
    const ritmos = {};
    for (const rk of Object.keys(RITMOS)) {
      const c = calculoOficio(actor, datos, k, rk);
      ritmos[rk] = ENCARGOS.map(E => {
        const pr = pronostico(c.bono - c.exh, E.cd, !!datos.ventaja);
        const rendHora = c.rango.rend * pr.mult * c.R.rend;
        return { prob: pr.prob, rendHora, pagaHora: rendHora * E.tarifa * c.valor };
      });
    }
    info[k] = {
      bono: base.bono, xp: base.xp, ayudante: !!base.rango.ayudante, otros: base.otros, estado: datos.herramienta[k] ?? 0,
      cabecera: `<b>${base.of.nombre}</b> · ${base.rango.nombre} (${String(redondeo(base.xp, 1)).replace(".", ",")} jornadas de práctica)${datos.especialidad[k] ? ` · ${ESPECIALIDADES[datos.especialidad[k]].nombre}` : ""} · ${infoPatron(datos, base.of.patron).nombre}: Prestigio ${base.pres} (${base.rp.nombre})`,
      prueba: `Tira ${base.prueba.etiqueta} ${signo(base.prueba.bono)}${base.rango.bono ? ` · ${base.rango.nombre} ${signo(base.rango.bono)}` : ""}${base.calidad ? ` · ${base.calidad.nombre} +${base.calidad.bono}` : ""}${base.estado.pen ? ` · herramienta ${base.estado.nombre} ${base.estado.pen}` : ""}${base.otros ? ` · otros ${signo(base.otros)}` : ""}${base.vida ? ` · ${base.vida > 0 ? "bien descansado" : "mal comido"} ${signo(base.vida)}` : ""} = <b>${signo(base.bono)}</b>${base.exh ? ` (y Agotamiento −${base.exh})` : ""}`,
      ritmos,
      niveles: ENCARGOS.map((E, i) => {
        const ok = (base.pres < 0) ? (i === 0) : (base.pres >= E.prestigio);
        const r = ritmos.normal[i];
        const total = E.ht * E.tarifa * base.valor * (1 + BONO_ENTREGA);
        const dias = r.rendHora > 0 ? Math.ceil(E.ht / (8 * r.rendHora)) : "∞";
        const txt = (base.pres < 0)
          ? `Jornada de prueba (sin paga) · ${r.prob} % de convencer`
          : `${todos[k].encargos?.[i] ?? E.nivel} · ${E.nivel} (CD ${E.cd}) · ${E.ht} h de trabajo en ${E.plazo} días · ${r.prob} % · ~${dias} días a 8 h · ~${textoDinero(total)}`;
        return { i, ok, texto: `${txt}${ok ? "" : ` · pide Prestigio ${E.prestigio}`}` };
      })
    };
  }

  const mas = Object.keys(todos).filter(k => info[k].xp > 0).sort((a, b) => info[b].xp - info[a].xp)[0];
  const mejor = Object.keys(todos).sort((a, b) => info[b].bono - info[a].bono)[0];
  const oficioSel = [enc?.oficio, preferido, datos.ultimo?.oficio, mas, mejor, "tala"].find(k => k && todos[k]);
  const nivelSel = enc?.nivel ?? ((datos.ultimo?.oficio === oficioSel) ? datos.ultimo.nivel : 0);
  const opcionesNivel = k => (info[k]?.niveles ?? []).map(n =>
    `<option value="${n.i}" ${n.ok ? "" : "disabled"} ${(n.i === nivelSel && n.ok) ? "selected" : ""}>${n.texto}</option>`).join("");
  const opcionesOficio = Object.entries(CATEGORIAS).map(([cat, nomCat]) => {
    const opts = Object.entries(todos).filter(([, of]) => of.cat === cat)
      .map(([k, of]) => `<option value="${k}" ${k === oficioSel ? "selected" : ""}>${of.nombre} · ${rangoPericia(info[k].xp).nombre} (${signo(info[k].bono)})</option>`).join("");
    return opts ? `<optgroup label="${nomCat}">${opts}</optgroup>` : "";
  }).join("") + "<option value=\"__nuevo\">➕ Otro oficio…</option>";

  const ritmoSel = datos.ultimo?.ritmo ?? "normal";
  const horasDef = Math.min(libres, datos.ultimo?.horas ?? 8);
  const opcionesHoras = Array.from({ length: libres }, (_, i) => i + 1)
    .map(h => `<option value="${h}" ${h === horasDef ? "selected" : ""}>${h} h${(datos.hoy.horas + h) > 8 ? " (sobreesfuerzo)" : ""}${(datos.hoy.seguidas + h) > 8 ? " (sin pausa −2)" : ""}</option>`).join("");

  const partes = [];
  partes.push(`<p class="ecos-nota">Día ${datos.dia} de ${actor.name} · hoy lleva ${fmtH(datos.hoy.horas)} trabajadas${datos.hoy.seguidas ? ` (${fmtH(datos.hoy.seguidas)} seguidas desde su último descanso)` : ""}${datos.largas ? ` · ${datos.largas} día(s) largo(s) seguido(s)` : ""}${datos.deuda ? ` · debe ${textoDinero(datos.deuda)}` : ""}. El día termina con el Descanso Largo (máximo ${MAX_HORAS_DIA} h de trabajo). Más de 8 h sin un Descanso Corto: −2.</p>`);
  if (enc) {
    const of = infoOficio(datos, enc.oficio);
    const quedan = (enc.inicio + enc.plazo) - datos.dia;
    partes.push(`<p>Encargo en curso: <b>${of?.encargos?.[enc.nivel] ?? ENCARGOS[enc.nivel].nivel}</b> (${of?.nombre}, ${ENCARGOS[enc.nivel].nivel})</p>`);
    partes.push(`<p>${barra(enc.hecho, enc.ht)} ${fmtH(enc.hecho)} de ${enc.ht} · ${quedan > 1 ? `quedan <b>${quedan} días</b> (hoy incluido)` : "<b>hoy es el último día</b>"} · cobrado ${textoDinero(enc.cobrado ?? 0)}</p>`);
    partes.push(`<input type="hidden" name="oficio" value="${enc.oficio}"><input type="hidden" name="nivel" value="${enc.nivel}">`);
  } else {
    partes.push(`<div class="form-group"><label>Oficio</label><select name="oficio">${opcionesOficio}</select></div>`);
  }
  partes.push(`<p class="ecos-info-cab">${info[oficioSel].cabecera}</p><p class="ecos-info-prueba">${info[oficioSel].prueba}</p>`);
  if (!enc) partes.push(`<div class="form-group"><label>Encargo</label><select name="nivel">${opcionesNivel(oficioSel)}</select></div>`);
  partes.push(`<div class="form-group"><label>Horas hoy</label><select name="horas">${opcionesHoras}</select></div>`);
  partes.push(`<div class="form-group"><label>Ritmo</label><select name="ritmo">${Object.entries(RITMOS).map(([k, R]) => `<option value="${k}" ${k === ritmoSel ? "selected" : ""}>${R.nombre}: ${R.texto}</option>`).join("")}</select></div>`);
  partes.push("<p class=\"ecos-prevision\"></p>");
  partes.push(`<label class="ecos-check ecos-rota" ${info[oficioSel].estado ? "" : "style=\"display:none\""}><input type="checkbox" name="reparar" checked> <span class="ecos-rota-txt">Arreglar la herramienta antes de empezar</span></label>`);
  partes.push(`<label class="ecos-check ecos-ayudante" ${info[oficioSel].ayudante ? "" : "style=\"display:none\""}><input type="checkbox" name="ayudante" ${datos.ultimo?.ayudante ? "checked" : ""}> Llevo un ayudante (ventaja; le pago 4 c)</label>`);
  if (datos.ventaja) partes.push("<p class=\"ecos-nota\">⭐ Tiene un encargo especial: esta jornada tira con ventaja.</p>");
  if (monedas(actor) > 0) partes.push(`<p class="ecos-nota">Tienes <b>${plural(monedas(actor), "Moneda Antigua", "Monedas Antiguas")}</b>: si una tirada sale mal (la prueba, una complicación o la salvación de sobreesfuerzo) te preguntará si quieres gastar una para repetirla.</p>`);
  if ((actor.system.attributes.exhaustion ?? 0) >= 3) partes.push(`<p class="ecos-nota">Con Agotamiento ${actor.system.attributes.exhaustion}, trabajar hoy es trabajo pesado: el día no cuenta para Malherido ni para el tratamiento.</p>`);
  partes.push(`<details><summary class="ecos-nota">Ajustes</summary><div class="form-group"><label>Otros bonos a la prueba</label><input type="number" name="otros" value="${info[oficioSel].otros}" step="1"></div><p class="ecos-nota">Un bono fijo de este oficio (un rasgo del trasfondo, unos brazos de más). Queda guardado.</p></details>`);

  const botones = [{ action: "trabajar", label: enc ? "Trabajar" : "Tomar el encargo y trabajar", icon: "fa-solid fa-hammer", default: true, callback: (ev, b) => leerFormulario(b) }];
  if (enc) botones.push({ action: "abandonar", label: "Abandonar (−3 Prestigio)", icon: "fa-solid fa-person-walking-arrow-right" });
  botones.push({ action: "cancelar", label: "Cancelar", icon: "fa-solid fa-xmark" });

  const r = await DialogV2.wait({
    window: { title: `Jornada de trabajo · ${actor.name}`, icon: "fa-solid fa-hammer" },
    position: { width: 640 },
    content: `<div class="ecos-dialogo ecos-oficio">${partes.join("")}</div>`,
    rejectClose: false,
    buttons: botones,
    render: (event, dialog) => {
      try {
        const raiz = dialog?.element ?? event?.target?.element;
        if (!raiz?.querySelector || raiz.dataset.ecos) return;
        raiz.dataset.ecos = "1";
        const q = s => raiz.querySelector(s);
        const actualizar = () => {
          const k = q("[name=\"oficio\"]")?.value;
          const i = info[k];
          if (!i) return;
          const nivel = Number(q("[name=\"nivel\"]")?.value ?? 0);
          const horas = Number(q("[name=\"horas\"]")?.value ?? 8);
          const ritmo = q("[name=\"ritmo\"]")?.value ?? "normal";
          const p = i.ritmos[ritmo][nivel];
          const E = ENCARGOS[nivel];
          const quedan = enc ? Math.max(0, enc.ht - enc.hecho) : E.ht;
          const avance = Math.min(quedan, horas * p.rendHora);
          const horasReales = p.rendHora > 0 ? Math.min(horas, quedan / p.rendHora) : horas;
          const total = datos.hoy.horas + horasReales;
          const dc = cdFatiga(Math.ceil(total), datos.largas, ritmo);
          const sinPausa = (datos.hoy.seguidas + horas) > 8;
          q(".ecos-prevision").innerHTML = `Previsión: ${p.prob} % de que salga bien · avance ~${fmtH(avance)} de ${fmtH(quedan)} pendientes${horasReales < horas - 0.4 ? ` (terminaría en ~${fmtH(horasReales)})` : ""} · paga ~${textoDinero(avance * E.tarifa * (todos[k].valor ?? 1))}${dc ? ` · <b>salvación de CON CD ${dc}</b> al terminar o +1 Agotamiento` : " · sin sobreesfuerzo"}${sinPausa ? " · <b>−2 por trabajar más de 8 h sin un Descanso Corto</b>" : ""}.`;
        };
        const sel = q("select[name=\"oficio\"]");
        sel?.addEventListener("change", () => {
          const k = sel.value;
          const i = info[k];
          if (!i) return;
          q(".ecos-info-cab").innerHTML = i.cabecera;
          q(".ecos-info-prueba").innerHTML = i.prueba;
          q("select[name=\"nivel\"]").innerHTML = opcionesNivel(k);
          q(".ecos-rota").style.display = i.estado ? "" : "none";
          q(".ecos-ayudante").style.display = i.ayudante ? "" : "none";
          const o = q("input[name=\"otros\"]");
          if (o) o.value = i.otros;
          actualizar();
        });
        for (const n of ["nivel", "horas", "ritmo"]) q(`[name="${n}"]`)?.addEventListener("change", actualizar);
        actualizar();
      } catch (err) {
        console.warn(`${MOD} |`, err);
      }
    }
  });
  if (r === "abandonar") return abandonarEncargo(actor);
  if (!r || (typeof r === "string")) return;
  if (r.oficio === "__nuevo") {
    const nuevo = await dialogoNuevoOficio(actor);
    return dialogoJornada(actor, nuevo);
  }
  return hacerJornada(actor, r);
}

/** Crear un oficio a medida (queda guardado en el personaje). */
async function dialogoNuevoOficio(actor) {
  const { DialogV2 } = foundry.applications.api;
  const habilidades = Object.entries(NOMBRE_HABILIDAD).map(([k, n]) => `<option value="skill:${k}">${n}</option>`).join("");
  const herramientas = Object.keys(CONFIG.DND5E.tools ?? {}).map(k => `<option value="tool:${k}">${NOMBRE_HERRAMIENTA[k] ?? k}</option>`).join("");
  const caract = Object.entries(ABREV_TODAS).map(([k, n]) => `<option value="abil:${k}">Prueba de ${n}</option>`).join("");
  const cats = Object.entries(CATEGORIAS).map(([k, n]) => `<option value="${k}">${n}</option>`).join("");
  const r = await DialogV2.wait({
    window: { title: "Otro oficio", icon: "fa-solid fa-briefcase" },
    position: { width: 480 },
    content: `<div class="ecos-dialogo">
      <div class="form-group"><label>Nombre del oficio</label><input type="text" name="nombre" placeholder="Ej.: Copista de mapas"></div>
      <div class="form-group"><label>Prueba</label><select name="prueba"><optgroup label="Habilidades">${habilidades}</optgroup><optgroup label="Herramientas">${herramientas}</optgroup><optgroup label="Características">${caract}</optgroup></select></div>
      <div class="form-group"><label>Segunda prueba (opcional)</label><select name="prueba2"><option value="">—</option><optgroup label="Habilidades">${habilidades}</optgroup><optgroup label="Herramientas">${herramientas}</optgroup><optgroup label="Características">${caract}</optgroup></select></div>
      <div class="form-group"><label>Tipo de trabajo</label><select name="cat">${cats}</select></div>
      <div class="form-group"><label>Paga (1 = jornal de leñador)</label><select name="valor"><option value="0.8">Baja (×0,8)</option><option value="1" selected>Normal (×1)</option><option value="1.2">Buena (×1,2)</option><option value="1.4">Muy buena (×1,4)</option></select></div>
      <div class="form-group"><label>Patrón (quién paga)</label><input type="text" name="patron" placeholder="Ej.: Taller de Korvane"></div>
      <div class="form-group"><label>Jefe o cliente</label><input type="text" name="jefe" placeholder="Ej.: Korvane"></div>
      <p class="ecos-nota">El módulo usa la mejor de las dos pruebas. El tipo de trabajo decide las complicaciones y los sucesos. La paga la acuerda el DM.</p>
    </div>`,
    rejectClose: false,
    buttons: [
      { action: "crear", label: "Crear", icon: "fa-solid fa-plus", default: true, callback: (ev, b) => leerFormulario(b) },
      { action: "cancelar", label: "Cancelar", icon: "fa-solid fa-xmark" }
    ]
  });
  if (!r || (typeof r === "string") || !String(r.nombre ?? "").trim()) return null;
  const datos = oficioDe(actor);
  const key = `p-${slug(r.nombre)}`;
  const patronKey = `x-${slug(r.patron || r.nombre)}`;
  datos.patronesExtra[patronKey] = { nombre: r.patron?.trim() || r.nombre.trim(), jefe: r.jefe?.trim() || "el cliente" };
  datos.personalizados[key] = {
    nombre: r.nombre.trim(), cat: r.cat, patron: patronKey, valor: Number(r.valor) || 1,
    pruebas: [r.prueba, r.prueba2].filter(Boolean), encargos: ["Sencillo", "Normal", "Exigente", "Maestro"]
  };
  await guardarOficio(actor, datos);
  ui.notifications.info(`Oficio "${r.nombre.trim()}" creado.`);
  return key;
}

async function abandonarEncargo(actor) {
  const datos = oficioDe(actor);
  const enc = datos.encargo;
  if (!enc) return;
  const of = infoOficio(datos, enc.oficio);
  const antes = datos.prestigio[of.patron] ?? 0;
  datos.prestigio[of.patron] = antes - 3;
  datos.encargo = null;
  await guardarOficio(actor, datos);
  await actualizarRegistroHoja(actor, datos, enc.oficio);
  await publicar(actor, "🔨 Encargo abandonado", [`<b>${actor.name}</b> deja a medias el encargo de ${of.nombre} (${fmtH(enc.hecho)} de ${enc.ht}). Prestigio con ${infoPatron(datos, of.patron).nombre}: ${antes} → <b>${antes - 3}</b>.`], { clase: "ecos-trabajo ecos-desastre" });
}

/** Salvación de CON: si falla, +1 Agotamiento. Devuelve la línea para la tarjeta. */
async function salvacionFatiga(actor, cd, motivo) {
  const { sv, nota } = await salvacionConSoul(actor, cd, motivo);
  if (!sv) return null;
  if (sv.total >= cd) return `${motivo}: salvación de CON ${sv.total} contra CD ${cd}${nota}, <b>aguanta</b>.`;
  const exh = actor.system.attributes.exhaustion ?? 0;
  const nuevo = Math.min(exh + 1, CONFIG.DND5E.conditionTypes.exhaustion.levels);
  await actor.update({ "system.attributes.exhaustion": nuevo });
  return `${motivo}: salvación de CON ${sv.total} contra CD ${cd}${nota}, <b>falla. +1 Agotamiento</b> (${exh} → ${nuevo}).`;
}

/** Aplica una complicación. Devuelve líneas y efectos. */
async function aplicarComplicacion(actor, of, nivel, key, datos, dados, dado) {
  const tabla = COMPLICACIONES[of.cat] ?? COMPLICACIONES.fisico;
  const tr = await new Roll("1d6").evaluate();
  dados.push(tr);
  const c = tabla[tr.total - 1];
  const L = [`⚠ <b>Complicación</b> (dado de suceso ${dado}; 1d6 = ${tr.total}): ${c.texto}`];
  const efecto = { sinPaga: false, prestigio: 0, horas: 0 };
  if (c.tipo === "herramienta") {
    if (datos.especialidad[key] === "cuidadoso") {
      L.push("Pero la cuida tanto que aguanta: <b>no se daña</b> (Cuidadoso).");
    } else {
      const g = await new Roll("1d6").evaluate();
      dados.push(g);
      const antes = datos.herramienta[key] ?? 0;
      const nuevo = Math.min(2, antes + ((g.total >= 5) ? 2 : 1));
      datos.herramienta[key] = nuevo;
      const E = ESTADO_HERRAMIENTA[nuevo];
      L.push(`La herramienta queda <b>${E.nombre}</b> (1d6 = ${g.total}): ${E.pen} a este oficio hasta ${E.como} (${E.arreglo} c, en la herrería, la posada o el taller de Kurt).`);
      efecto.horas = -1;
    }
  } else if (c.tipo === "dano") {
    // Un accidente de trabajo duele, pero nunca deja a 0 PG ni cuenta como golpe brutal.
    const dr = await new Roll(ENCARGOS[nivel].dano).evaluate();
    dados.push(dr);
    const hp = actor.system.attributes.hp;
    const temp = Math.min(hp.temp ?? 0, dr.total);
    const real = Math.min(dr.total - temp, Math.max(0, hp.value - 1));
    await actor.update({ "system.attributes.hp.temp": (hp.temp ?? 0) - temp, "system.attributes.hp.value": hp.value - real }, { ecosInterno: true });
    L.push(`Recibe <b>${dr.total}</b> de daño (${ENCARGOS[nivel].dano}): queda con ${hp.value - real} PG.${(temp + real) < dr.total ? " Un accidente de trabajo no deja a nadie a 0." : ""}`);
    efecto.horas = -1;
  } else if ((c.tipo === "fatiga") || (c.tipo === "contagio")) {
    if (c.tipo === "fatiga") {
      const l = await salvacionFatiga(actor, 12, "Se resiente");
      if (l) L.push(l);
    } else {
      const { sv, nota } = await salvacionConSoul(actor, 12, "Contagio");
      if (sv && (sv.total >= 12)) L.push(`Salvación de CON ${sv.total} contra CD 12${nota}: no se contagia.`);
      else {
        L.push(`Salvación de CON ${sv?.total ?? "—"} contra CD 12${nota}: <b>se contagia</b>. El DM decide la enfermedad.`);
        susurrarDM("Contagio en el trabajo", [`${actor.name} falló la salvación contra un contagio trabajando de ${of.nombre}. Elige la enfermedad (o una fiebre leve).`]);
      }
    }
  } else if (c.tipo === "sinpaga") {
    efecto.sinPaga = true;
  } else if (c.tipo === "prestigio") {
    efecto.prestigio = -1;
    L.push("−1 Prestigio con el patrón.");
  } else if (c.tipo === "perdida") {
    const pr = await new Roll("1d6").evaluate();
    dados.push(pr);
    if (await cobrar(actor, pr.total)) L.push(`Paga <b>${pr.total} c</b> de su bolsa.`);
    else {
      datos.deuda += pr.total;
      L.push(`No le alcanza: debe <b>${pr.total} c</b> (deuda total ${textoDinero(datos.deuda)}).`);
    }
  } else if (c.tipo === "escena") {
    L.push(`<i>${azar(ESCENAS[of.cat] ?? ESCENAS.fisico)}</i> (escena del DM)`);
  }
  return { L, ...efecto };
}

async function aplicarOportunidad(actor, datos, dados, dado) {
  const tr = await new Roll("1d6").evaluate();
  dados.push(tr);
  const o = OPORTUNIDADES[tr.total - 1];
  const L = [`✨ <b>Oportunidad</b> (dado de suceso ${dado}; 1d6 = ${tr.total}): ${o.texto}`];
  const efecto = { prestigio: 0, xp: 0, cobres: 0 };
  if (o.tipo === "propina") {
    const c = await new Roll("1d6").evaluate();
    dados.push(c);
    efecto.cobres = c.total;
    L.push(`+${c.total} c.`);
  } else if (o.tipo === "recomendacion") efecto.prestigio = 1;
  else if (o.tipo === "truco") efecto.xp = 2;
  else if (o.tipo === "antiguo") {
    const c = await new Roll("1d6").evaluate();
    dados.push(c);
    if (c.total <= 2) {
      await anadirMonedaAntigua(actor);
      L.push(`Es una <b>Moneda Antigua</b> (1d6 = ${c.total}).`);
    } else L.push(`Una curiosidad sin valor (1d6 = ${c.total}).`);
  } else if (o.tipo === "ventaja") datos.ventaja = true;
  else if (o.tipo === "contacto") L.push(`<i>${azar(ESCENAS[OFICIOS[datos.ultimo?.oficio]?.cat] ?? ESCENAS.social)}</i>`);
  return { L, ...efecto };
}

async function eventoBosque(actor, nivel, dados) {
  const formula = nivel ? `1d6+${nivel}` : "1d6";
  const er = await new Roll(formula).evaluate();
  dados.push(er);
  const k = Math.clamp(er.total, 1, 8);
  const L = [`🌲 <b>Algo ocurre en el bosque</b> (${formula} = ${er.total}): ${EVENTOS_BOSQUE[k]}${k >= 2 ? " Lo resuelve el DM." : ""}`];
  const efecto = { cobres: 0 };
  if (k === 1) {
    const c = await new Roll("1d6").evaluate();
    dados.push(c);
    efecto.cobres = c.total;
    L.push(`Saca <b>${c.total} c</b> del hallazgo.`);
  } else if (k === 5) {
    const c = await new Roll("1d6").evaluate();
    dados.push(c);
    if (c.total === 1) {
      await anadirMonedaAntigua(actor);
      L.push("Entre las raíces encuentra una <b>Moneda Antigua</b> (1d6 = 1).");
    } else L.push(`No encuentra nada más (1d6 = ${c.total}).`);
  }
  return { L, ...efecto };
}

async function mostrarDados(rolls) {
  if (!game.dice3d || !rolls.length) return;
  try {
    await Promise.all(rolls.map(r => game.dice3d.showForRoll(r, game.user, true)));
  } catch (err) {
    console.warn(`${MOD} | Dice So Nice`, err);
  }
}

/** Reparte cobres con fracciones: devuelve el entero a pagar y guarda el resto. */
function cobrarFraccion(datos, cantidad) {
  const total = datos.saldo + cantidad;
  const entero = Math.floor(total);
  datos.saldo = redondeo(total - entero, 3);
  return entero;
}

/**
 * Una sesión de trabajo. f = { oficio, nivel, horas, ritmo, reparar, ayudante, otros }.
 * Devuelve un resumen (lo usan la simulación y las pruebas).
 */
async function hacerJornada(actor, f) {
  const datos = oficioDe(actor);
  const aviso = puedeTrabajar(actor, datos);
  if (aviso) return ui.notifications.warn(aviso);
  const key = datos.encargo?.oficio ?? f.oficio;
  const of = infoOficio(datos, key);
  if (!of) return ui.notifications.warn("Ese oficio no existe.");
  const patron = infoPatron(datos, of.patron);
  const presAntes = datos.prestigio[of.patron] ?? 0;
  const vetado = !datos.encargo && (presAntes < 0);
  const nivel = vetado ? 0 : Math.clamp(Number(datos.encargo?.nivel ?? f.nivel ?? 0), 0, 3);
  const E = ENCARGOS[nivel];
  if (!datos.encargo && !vetado && (presAntes < E.prestigio)) return ui.notifications.warn(`Con Prestigio ${presAntes}, ${patron.nombre} no le da encargos ${E.nivel}.`);
  const ritmo = RITMOS[f.ritmo] ? f.ritmo : "normal";
  const horasPedidas = Math.clamp(Math.round(Number(f.horas) || 8), 1, MAX_HORAS_DIA - datos.hoy.horas);
  const exhInicio = actor.system.attributes.exhaustion ?? 0;
  const xpAntes = datos.pericia[key] ?? 0;
  const rango = rangoPericia(xpAntes);
  const esp = datos.especialidad[key];
  const L = [];
  const dados = [];
  let gastos = 0;

  // Encargo nuevo
  const nombreEncargo = vetado ? "Jornada de prueba" : (of.encargos?.[nivel] ?? E.nivel);
  if (!datos.encargo && !vetado) {
    datos.encargo = { oficio: key, nivel, inicio: datos.dia, plazo: E.plazo, ht: E.ht, hecho: 0, cobrado: 0, dias: [], repetida: false };
    L.push(`Toma el encargo <b>${nombreEncargo}</b>: ${E.ht} h de trabajo para entregar antes de que termine el día ${datos.dia + E.plazo - 1}.`);
  }
  const enc = datos.encargo;

  // Arreglar la herramienta
  const est = datos.herramienta[key] ?? 0;
  if (est && f.reparar) {
    const H = ESTADO_HERRAMIENTA[est];
    if (await cobrar(actor, H.arreglo)) {
      datos.herramienta[key] = 0;
      gastos += H.arreglo;
      L.push(`Paga ${H.arreglo} c para ${H.como} antes de empezar.`);
    } else L.push(`No le alcanza para ${H.como} (${H.arreglo} c): trabaja con ella ${H.nombre}.`);
  }
  if (f.otros !== undefined) datos.otros[key] = Number(f.otros) || 0;
  const ayudante = !!f.ayudante && !!rango.ayudante;
  if (ayudante) {
    if (await cobrar(actor, 4)) gastos += 4;
    else datos.deuda += 4;
  }

  // La prueba del día
  const C = calculoOficio(actor, datos, key, ritmo);
  const extras = { ...C.partes };
  // Más de 8 horas seguidas sin un Descanso Corto (la pausa del almuerzo): −2.
  const sinPausa = (datos.hoy.seguidas + horasPedidas) > 8;
  if (sinPausa) extras.pausa = -2;
  const ventaja = !!datos.ventaja || ayudante;
  const flavor = `Jornada de trabajo · ${of.nombre} · ${nombreEncargo} (CD ${E.cd}) · ${horasPedidas} h, ritmo ${C.R.nombre.toLowerCase()}`;
  let t = await tirarOficio(actor, C.prueba, E.cd, extras, { ventaja, flavor });
  if (!t) return;
  if (datos.ventaja) {
    datos.ventaja = false;
    L.push("⭐ Usa su encargo especial: tira con ventaja.");
  }
  let res = resultadoJornada(t.total, t.nat, E.cd);
  if (!RESULTADOS[res].exito && rango.repite && enc && !enc.repetida) {
    enc.repetida = true;
    L.push(`Empieza mal (${t.total}), pero su oficio lo salva: <b>repite la tirada</b>.`);
    t = await tirarOficio(actor, C.prueba, E.cd, extras, { ventaja, flavor: `${flavor} · repetición` });
    if (!t) return;
    res = resultadoJornada(t.total, t.nat, E.cd);
  }
  // Monedas Antiguas: cada tirada mala (o con 1 natural) se puede repetir gastando una.
  while ((!RESULTADOS[res].exito || (t.nat === 1)) && (soulCoins(actor) > 0)) {
    if (!(await ofrecerSoulCoin(actor, `${C.prueba.etiqueta}: <b>${t.total}</b>${t.nat === 1 ? " (1 natural)" : ""} contra CD ${E.cd}. Sale <b>${RESULTADOS[res].nombre}</b>.`))) break;
    L.push(`Gasta una <b>Moneda Antigua</b> y repite la tirada (había sacado ${t.total}, ${RESULTADOS[res].nombre}).`);
    t = await tirarOficio(actor, C.prueba, E.cd, extras, { ventaja, flavor: `${flavor} · Moneda Antigua` });
    if (!t) return;
    res = resultadoJornada(t.total, t.nat, E.cd);
  }
  const RES = RESULTADOS[res];
  L.unshift(`<i>${azar(AMBIENTE[of.cat] ?? AMBIENTE.fisico)} ${azar(FRASES[res]).replace("{jefe}", patron.jefe)}</i>`);
  L.push(`${C.prueba.etiqueta}: <b>${t.total}</b> contra CD ${E.cd} → <b>${RES.nombre}</b>${t.nat === 20 ? " (20 natural)" : ""}${t.nat === 1 ? " (1 natural)" : ""}${sinPausa ? " · −2 por trabajar sin pausa (le hacía falta un Descanso Corto)" : ""}.`);

  // Rendimiento y horas que hacen falta
  const rendHora = C.rango.rend * RES.mult * C.R.rend;
  const pendiente = enc ? Math.max(0, enc.ht - enc.hecho) : Infinity;
  let horas = horasPedidas;
  if (enc && (rendHora > 0)) horas = Math.min(horasPedidas, Math.ceil((pendiente / rendHora) * 2) / 2);
  horas = Math.max(0.5, horas);

  // Dados de suceso: uno por cada tramo de hasta 4 horas
  let deltaPres = (res === "excelente") ? 1 : 0;
  let deltaXp = (res === "excelente") ? 1 : 0;
  let ajusteHoras = 0;
  let extraCobres = 0;
  let sinPaga = false;
  const hubo = { comp: false, op: false };
  const tramos = Math.ceil(horas / 4);
  const rangoComp = (esp === "cuidadoso") ? 1 : Math.max(1, 1 + (rango.comp ?? 0) + E.riesgo + C.R.comp);
  const sucesos = [];
  for (let i = 0; i < tramos; i++) {
    const sr = await new Roll("1d20").evaluate();
    dados.push(sr);
    let d = sr.total;
    // Monedas Antiguas: una complicación también se puede repetir.
    while ((d <= rangoComp) && !(rango.soloSiFalla && RES.exito) && (soulCoins(actor) > 0)) {
      if (!(await ofrecerSoulCoin(actor, `Dado de suceso: <b>${d}</b>. Sale una <b>complicación</b>.`))) break;
      const otra = await new Roll("1d20").evaluate();
      dados.push(otra);
      L.push(`Gasta una <b>Moneda Antigua</b> y repite el dado de suceso (${d} → ${otra.total}).`);
      d = otra.total;
    }
    sucesos.push(d);
    if (d <= rangoComp) {
      if (rango.soloSiFalla && RES.exito) {
        ajusteHoras -= 0.5;
        L.push(`⏳ Contratiempo (dado ${d}): ${azar(CONTRATIEMPOS[of.cat] ?? CONTRATIEMPOS.fisico)} Su oficio lo evita a tiempo (−½ h).`);
        continue;
      }
      const c = await aplicarComplicacion(actor, of, nivel, key, datos, dados, d);
      L.push(...c.L);
      sinPaga = sinPaga || c.sinPaga;
      deltaPres += c.prestigio;
      ajusteHoras += c.horas;
      hubo.comp = true;
    } else if (d <= rangoComp + 2) {
      ajusteHoras -= 1;
      L.push(`⏳ Contratiempo (dado ${d}): ${azar(CONTRATIEMPOS[of.cat] ?? CONTRATIEMPOS.fisico)} (−1 h de avance)`);
    } else if ((d === 17) || (d === 18)) {
      ajusteHoras += 1;
      if (of.cat === "social") {
        const p = await new Roll("1d4").evaluate();
        dados.push(p);
        extraCobres += p.total;
        L.push(`👍 Buena racha (dado ${d}): ${azar(RACHAS.social)} (+1 h de avance y ${p.total} c de propina)`);
      } else L.push(`👍 Buena racha (dado ${d}): ${azar(RACHAS[of.cat] ?? RACHAS.fisico)} (+1 h de avance)`);
    } else if (d === 19) {
      if (of.entorno === "bosque") {
        const b = await eventoBosque(actor, nivel, dados);
        L.push(...b.L);
        extraCobres += b.cobres;
      } else L.push(`👁 Escena (dado ${d}): <i>${azar(ESCENAS[of.cat] ?? ESCENAS.fisico)}</i> (escena del DM)`);
    } else if (d === 20) {
      const o = await aplicarOportunidad(actor, datos, dados, d);
      L.push(...o.L);
      deltaPres += o.prestigio;
      deltaXp += o.xp;
      extraCobres += o.cobres;
      hubo.op = true;
    }
  }

  // Avance y paga a destajo
  const horasEfectivas = Math.max(0, horas + ajusteHoras);
  let avance = sinPaga ? 0 : redondeo(horasEfectivas * rendHora, 1);
  if (enc) avance = Math.min(avance, pendiente);
  let pagaDia = 0;
  if (enc) {
    enc.hecho = redondeo(enc.hecho + avance, 1);
    let bruto = avance * E.tarifa * C.valor;
    if (RES.exito && (esp === "rapido")) bruto *= 1.25;
    pagaDia = cobrarFraccion(datos, bruto);
    enc.dias.push({ dia: datos.dia, res, horas, avance });
  }
  if (sinPaga) L.push("Lo de hoy <b>no cuenta</b>: no avanza ni cobra.");
  else if (enc) L.push(`Avance: <b>+${fmtH(avance)}</b> ${barra(enc.hecho, enc.ht)} ${fmtH(enc.hecho)} de ${enc.ht}${horas < horasPedidas ? ` · terminó en ${fmtH(horas)} de las ${horasPedidas} previstas` : ""}.`);

  // Entrega
  let entrega = null;
  if (enc && (enc.hecho >= enc.ht - 0.05)) {
    const nominal = E.ht * E.tarifa * C.valor;
    const ultimo = enc.inicio + enc.plazo - 1;
    const antes = datos.dia < ultimo;
    const buenos = enc.dias.filter(x => RESULTADOS[x.res]?.exito && (x.res !== "exito")).length;
    const calidad = buenos >= Math.ceil(enc.dias.length / 2);
    let bono = nominal * BONO_ENTREGA + (antes ? nominal * BONO_ANTICIPO : 0);
    if (calidad) bono += nominal * 0.1;
    const bonoEntero = cobrarFraccion(datos, bono);
    pagaDia += bonoEntero;
    let dp = 1 + (antes ? 1 : 0) + (calidad ? 1 : 0) + (nivel >= 2 ? 1 : 0) + ((esp === "renombre") ? 1 : 0);
    deltaPres += dp;
    entrega = { bono: bonoEntero, antes, calidad, dp, dias: datos.dia - enc.inicio + 1 };
    L.push(`📦 <b>Encargo entregado</b> en ${entrega.dias} día(s)${antes ? ", antes del plazo" : ", justo a tiempo"}${calidad ? " y con calidad" : ""}. ${patron.jefe[0].toUpperCase()}${patron.jefe.slice(1)} paga el resto: <b>+${textoDinero(bonoEntero)}</b>. Prestigio ${signo(dp)}.`);
    datos.stats[key] ??= {};
    datos.stats[key].entregas = (datos.stats[key].entregas ?? 0) + 1;
    datos.encargo = null;
  }

  // Jornada de prueba (vetado)
  if (vetado) {
    if (RES.exito) {
      datos.prestigio[of.patron] = 0;
      L.push(`Lo hace bien: ${patron.nombre} vuelve a darle trabajo (Prestigio 0). Hoy no cobra.`);
    } else L.push("Trabaja sin paga y no convence: sigue Vetado.");
  }

  // Paga, propinas y deuda
  let pago = pagaDia + extraCobres;
  let abono = 0;
  if (pago && (datos.deuda > 0)) {
    abono = Math.min(datos.deuda, pago);
    datos.deuda -= abono;
    pago -= abono;
  }
  if (pago) await sumarCobres(actor, pago);
  if (enc) enc.cobrado = (enc.cobrado ?? 0) + pagaDia;
  if (!vetado) L.push(`<b>Cobra hoy: ${textoDinero(pago + abono)}</b>${abono ? ` (${textoDinero(abono)} van a pagar su deuda; ${datos.deuda ? `aún debe ${textoDinero(datos.deuda)}` : "deuda saldada"})` : ""}${gastos ? ` · gastó ${textoDinero(gastos)}` : ""}.`);

  // Prestigio
  if (!vetado && deltaPres) {
    const nuevo = presAntes + deltaPres;
    datos.prestigio[of.patron] = nuevo;
    const rp = rangoPrestigio(presAntes);
    const rn = rangoPrestigio(nuevo);
    L.push(`Prestigio con ${patron.nombre}: ${presAntes} → <b>${nuevo}</b> (${rn.nombre})${rn.nombre !== rp.nombre ? `. <b>Nuevo trato:</b> ${rn.texto}` : ""}.`);
  }

  // Pericia
  const xpNuevo = redondeo(xpAntes + (horas / 8) + deltaXp, 3);
  datos.pericia[key] = xpNuevo;
  const rangoNuevo = rangoPericia(xpNuevo);
  const sig = sigRangoPericia(xpNuevo);
  L.push(`Pericia en ${of.nombre}: ${String(redondeo(xpNuevo, 1)).replace(".", ",")} (${rangoNuevo.nombre})${sig ? ` · faltan ${String(redondeo(sig.min - xpNuevo, 1)).replace(".", ",")} para ${sig.nombre}` : ""}.`);

  // Horas del día y fatiga
  datos.hoy.horas = redondeo(datos.hoy.horas + horas, 1);
  datos.hoy.seguidas = redondeo(datos.hoy.seguidas + horas, 1);
  if (exhInicio >= 3) {
    await actor.setFlag(MOD, "trabajoPesado", true);
    L.push(`Trabajó con Agotamiento ${exhInicio}: hoy cuenta como trabajo pesado y el día no suma a la convalecencia.`);
  }
  const dc = cdFatiga(Math.ceil(datos.hoy.horas), datos.largas, ritmo);
  if (dc) {
    const l = await salvacionFatiga(actor, dc, `Sobreesfuerzo (${fmtH(datos.hoy.horas)} hoy${datos.largas ? `, ${datos.largas} día(s) largo(s) seguido(s)` : ""})`);
    if (l) L.push(l);
  }

  // Registro y estadísticas
  datos.contador += 1;
  const st = datos.stats[key] ?? {};
  st.jornadas = (st.jornadas ?? 0) + 1;
  st.horas = redondeo((st.horas ?? 0) + horas, 1);
  if (RES.exito) st.exitos = (st.exitos ?? 0) + 1;
  if (hubo.comp) st.complicaciones = (st.complicaciones ?? 0) + 1;
  st.ganado = (st.ganado ?? 0) + pago + abono;
  datos.stats[key] = st;
  datos.registro.push({ n: datos.contador, dia: datos.dia, oficio: key, encargo: nombreEncargo, horas, ritmo, total: t.total, cd: E.cd, resultado: res, avance, paga: pago + abono, comp: hubo.comp, op: hubo.op });
  if (datos.registro.length > 40) datos.registro = datos.registro.slice(-40);
  datos.ultimo = { oficio: key, nivel, horas: horasPedidas, ritmo, ayudante: !!f.ayudante };
  await guardarOficio(actor, datos);

  await actualizarRegistroHoja(actor, datos, key);
  await mostrarDados(dados);
  const libres = MAX_HORAS_DIA - datos.hoy.horas;
  const botonSeguir = (libres >= 1) ? boton("jornada", datos.encargo ? `Seguir trabajando (${fmtH(datos.encargo.hecho)}/${datos.encargo.ht})` : "Nuevo encargo", "fa-hammer") : "";
  await publicar(actor, `🔨 ${of.nombre} · ${nombreEncargo} · día ${datos.dia} · ${fmtH(horas)}${ritmo !== "normal" ? ` (${C.R.nombre.toLowerCase()})` : ""}`, L, {
    clase: `ecos-trabajo ecos-${res}`,
    extra: cajaBotones([botonSeguir]),
    flags: { [MOD]: { ref: { actorId: actor.id } } }
  });

  if (rangoNuevo.nombre !== rango.nombre) await subirRango(actor, key, rangoNuevo);
  if ((xpNuevo >= 30) && !datos.especialidad[key]) await elegirEspecialidad(actor, key);
  return { res, horas, avance, paga: pago + abono, entrega, sucesos, comp: hubo.comp };
}

/** Aviso al subir de rango (ventana y tarjeta). */
async function subirRango(actor, key, rango) {
  const { DialogV2 } = foundry.applications.api;
  const of = infoOficio(oficioDe(actor), key);
  efecto(actor, "subeRango");
  await publicar(actor, "🏅 Sube de rango", [`<b>${actor.name}</b> ahora es <b>${rango.nombre}</b> en ${of.nombre}: ${rango.texto}.`], { clase: "ecos-trabajo ecos-excelente" });
  await DialogV2.prompt({
    window: { title: `¡${rango.nombre} en ${of.nombre}!`, icon: "fa-solid fa-medal" },
    content: `<div class="ecos-dialogo"><p><b>${actor.name}</b> sube a <b>${rango.nombre}</b> en ${of.nombre}.</p><p>${rango.texto[0].toUpperCase()}${rango.texto.slice(1)}.</p></div>`,
    ok: { label: "¡Bien!", icon: "fa-solid fa-medal" },
    rejectClose: false
  }).catch(() => null);
}

/** Al llegar a Oficial, elige una especialidad (si cierra la ventana, se le vuelve a preguntar en la próxima jornada). */
async function elegirEspecialidad(actor, key) {
  const { DialogV2 } = foundry.applications.api;
  const datos = oficioDe(actor);
  const of = infoOficio(datos, key);
  const r = await DialogV2.wait({
    window: { title: `Especialidad · ${of.nombre}`, icon: "fa-solid fa-medal" },
    position: { width: 460 },
    content: `<div class="ecos-dialogo"><p><b>${actor.name}</b> ya es Oficial en ${of.nombre}. Elige su especialidad (es para siempre):</p><ul>${Object.values(ESPECIALIDADES).map(e => `<li><b>${e.nombre}:</b> ${e.texto}</li>`).join("")}</ul></div>`,
    rejectClose: false,
    buttons: Object.entries(ESPECIALIDADES).map(([k, e], i) => ({ action: k, label: e.nombre, default: i === 0 }))
  });
  if (!r || !ESPECIALIDADES[r]) return;
  datos.especialidad[key] = r;
  await guardarOficio(actor, datos);
  await actualizarRegistroHoja(actor, datos, key);
  await publicar(actor, "🏅 Especialidad", [`<b>${actor.name}</b> se especializa en <b>${ESPECIALIDADES[r].nombre}</b> (${of.nombre}): ${ESPECIALIDADES[r].texto}`], { clase: "ecos-trabajo ecos-excelente" });
}

/** Botón de la tarjeta: abre la ventana con lo último elegido. */
async function jornadaDesdeTarjeta(message, actorId) {
  const actor = game.actors.get(actorId);
  if (!actor?.isOwner) return;
  return dialogoJornada(actor);
}

/**
 * Empieza un nuevo día para el PJ (después de cada Descanso Largo, o de dormir a la intemperie).
 * Cuenta los días largos seguidos, vence los encargos fuera de plazo y entrega los pedidos listos.
 */
async function nuevoDiaPJ(actor) {
  if (!esPJ(actor)) return;
  await marcarDurmio(actor);
  const datos = oficioDe(actor);
  const L = [];
  datos.largas = (datos.hoy.horas > 8) ? datos.largas + 1 : 0;
  datos.dia += 1;
  datos.hoy = { dia: datos.dia, horas: 0, seguidas: 0 };
  if (datos.noche) {
    // La noche comprada en El Último Roble: el bono vale para el trabajo de hoy.
    datos.vida = { dia: datos.dia, nombre: datos.noche.nombre, bono: Number(datos.noche.bono) || 0 };
    if (datos.vida.bono) L.push(`🛏 Durmió en <b>${datos.noche.nombre}</b>: hoy trabaja bien descansado (${signo(datos.vida.bono)} a la prueba de trabajo).`);
    datos.noche = null;
  }
  const enc = datos.encargo;
  if (enc && (datos.dia >= enc.inicio + enc.plazo)) {
    const of = infoOficio(datos, enc.oficio);
    const antes = datos.prestigio[of.patron] ?? 0;
    datos.prestigio[of.patron] = antes - 2;
    datos.encargo = null;
    L.push(`⌛ <b>Se venció el plazo</b> del encargo de ${of.nombre} (${fmtH(enc.hecho)} de ${enc.ht}). ${infoPatron(datos, of.patron).jefe[0].toUpperCase()}${infoPatron(datos, of.patron).jefe.slice(1)} se lo da a otro. Lo trabajado ya está cobrado, pero no hay paga de entrega. Prestigio ${antes} → <b>${antes - 2}</b>.`);
  }
  const listos = datos.pedidos.filter(p => p.listo <= datos.dia);
  datos.pedidos = datos.pedidos.filter(p => p.listo > datos.dia);
  await guardarOficio(actor, datos);
  for (const p of listos) {
    const ok = await entregarPedido(actor, p);
    L.push(ok ? `📦 Te entregan tu encargo: <b>${p.nombre}</b> (${p.tienda}).` : `No se pudo entregar ${p.nombre}: avisa al DM.`);
  }
  if (L.length) await publicar(actor, "🌅 Nuevo día", L, { clase: "ecos-trabajo" });
  if (enc && !datos.encargo) await actualizarRegistroHoja(actor, datos, enc.oficio);
  if (soyGM()) await revisarDiaMercado();
}

/* ------------------------------------------------------------------ */
/*  Mercadillo de Arcegris (tiendas con Item Piles)                   */
/* ------------------------------------------------------------------ */

const PACK_EQUIPO = "dnd5e.equipment24";
const CARPETA_MERCADILLO = "Mercadillo de Arcegris";
const ARTICULOS = new Map(TIENDAS.flatMap(t => t.items.map(i => [i.id, { ...i, tienda: t.id }])));
const apiIP = () => (game.modules.get("item-piles")?.active ? game.itempiles?.API ?? null : null);
/** Item Piles termina de cargar después que este módulo: espera a que esté listo (máximo 20 s). */
function esperarItemPiles() {
  if (!game.modules.get("item-piles")?.active) return Promise.resolve(null);
  if (game.itempiles?.API) return Promise.resolve(game.itempiles.API);
  return new Promise(resolve => {
    Hooks.once("item-piles-ready", () => setTimeout(() => resolve(game.itempiles?.API ?? null), 200));
    setTimeout(() => resolve(game.itempiles?.API ?? null), 20000);
  });
}
const tiendaDe = actor => actor?.getFlag?.(MOD, "tienda") ?? null;
const actorTienda = id => game.actors.find(a => a.getFlag(MOD, "tienda") === id) ?? null;
const infoTienda = id => TIENDAS.find(t => t.id === id) ?? null;
const textoHorario = T => T.horario.map(([a, b]) => (((a === 0) && (b === 24)) ? "siempre abierta" : `${a}–${b} h`)).join(" y ");
const abiertaA = (T, hora) => T.horario.some(([a, b]) => ((a <= b) ? ((hora >= a) && (hora < b)) : ((hora >= a) || (hora < b))));

/** Hora, día y estación del juego (Seasons & Stars si está activo; si no, el reloj del mundo). */
function ahoraMundo() {
  const t = game.time.worldTime ?? 0;
  const base = { hora: Math.floor((((t % 86400) + 86400) % 86400) / 3600), dias: Math.floor(t / 86400), estacion: null, texto: "" };
  try {
    const api = game.seasonsStars?.api;
    const d = api?.getCurrentDate?.();
    if (d?.time) {
      base.hora = d.time.hour ?? base.hora;
      const n = String(api.getSeasonInfo?.(d)?.name ?? "").toLowerCase();
      base.estacion = /spring|primav/.test(n) ? "primavera" : /summer|verano/.test(n) ? "verano" : /autumn|fall|oto/.test(n) ? "otono" : /winter|invier/.test(n) ? "invierno" : null;
      base.texto = api.formatDate?.(d) ?? "";
    }
  } catch (err) {
    console.debug(`${MOD} | fecha`, err);
  }
  const elegida = game.settings.get(MOD, "estacion");
  if (elegida && (elegida !== "auto")) base.estacion = elegida;
  return base;
}

/* ---------- Íconos: se usa el preferido si existe; si no, se busca uno parecido ---------- */
const CACHE_ICONOS = new Map();
async function existeArchivo(ruta) {
  if (!ruta) return false;
  if (CACHE_ICONOS.has(ruta)) return CACHE_ICONOS.get(ruta);
  let ok = false;
  try {
    ok = (await fetch(ruta, { method: "HEAD" })).ok;
  } catch (err) {
    ok = false;
  }
  CACHE_ICONOS.set(ruta, ok);
  return ok;
}
const LISTADOS = new Map();
async function listarIconos(dir) {
  if (LISTADOS.has(dir)) return LISTADOS.get(dir);
  let files = [];
  try {
    const FP = foundry.applications?.apps?.FilePicker?.implementation ?? globalThis.FilePicker;
    files = (await FP.browse("public", dir))?.files ?? [];
  } catch (err) {
    files = [];
  }
  LISTADOS.set(dir, files);
  return files;
}

/* ---------- Tokens de 5etools: se bajan una vez a assets/srd5e, como hace Plutonium ---------- */
const CDN_5E = "https://cdn.5e.tools/2024/img/bestiary/tokens/";
const LOCAL_5E = "assets/srd5e/img/bestiary/tokens/";
const imagenVacia = src => !src || /icons\/svg\/mystery-man\.svg$/.test(src);
const claveCDN = src => {
  try {
    return decodeURIComponent(String(src ?? "")).match(/^https:\/\/cdn\.5e\.tools\/(?:2024\/)?img\/bestiary\/tokens\/(.+)\.webp$/)?.[1] ?? null;
  } catch {
    return null;
  }
};

/** Ruta local del token «XMM/Bandit». Si no está en el disco lo baja de la CDN y lo sube a Data. null si no se pudo. */
async function token5e(clave) {
  const local = `${LOCAL_5E}${clave}.webp`;
  if (await existeArchivo(local)) return local;
  const url = `${CDN_5E}${clave.split("/").map(encodeURIComponent).join("/")}.webp`;
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    const blob = await r.blob();
    if (!blob.type.startsWith("image/")) return null;
    const FP = foundry.applications?.apps?.FilePicker?.implementation ?? globalThis.FilePicker;
    const corte = local.lastIndexOf("/");
    const dir = local.slice(0, corte);
    try {
      await FP.browse("data", dir);
    } catch {
      let acc = "";
      for (const parte of dir.split("/")) {
        acc = acc ? `${acc}/${parte}` : parte;
        try {
          await FP.createDirectory("data", acc, {});
        } catch {
          // ya existe
        }
      }
    }
    const res = await FP.upload("data", dir, new File([blob], local.slice(corte + 1), { type: blob.type }), {}, { notify: false });
    const ruta = res?.path ?? local;
    CACHE_ICONOS.delete(ruta);
    return (await existeArchivo(ruta)) ? ruta : null;
  } catch (err) {
    console.warn(`${MOD} | no pude bajar ${url}`, err);
    return null;
  }
}

/** Pasa a archivo local los tokens de actores y escenas que apuntan a la CDN de 5etools. */
async function localizarTokens() {
  const hechos = new Map();
  const local = async k => {
    if (!hechos.has(k)) hechos.set(k, await token5e(k));
    return hechos.get(k);
  };
  let n = 0;
  let fallos = 0;
  for (const a of game.actors) {
    const k = claveCDN(a.prototypeToken?.texture?.src);
    if (!k) continue;
    const ruta = await local(k);
    if (!ruta) {
      fallos++;
      continue;
    }
    await a.update({ "prototypeToken.texture.src": ruta });
    n++;
  }
  for (const s of game.scenes) {
    const cambios = [];
    for (const t of s.tokens) {
      const k = claveCDN(t.texture?.src);
      const ruta = k ? await local(k) : null;
      if (ruta) cambios.push({ _id: t.id, "texture.src": ruta });
    }
    if (cambios.length) {
      await s.updateEmbeddedDocuments("Token", cambios);
      n += cambios.length;
    }
  }
  return { n, fallos };
}

/*
 * Arte de las fichas desde el contenido (lo usa Claude para poner imágenes en lote). Cada fuente puede ser:
 *   "XMM/Bandit Captain"         token de 5etools (se baja una vez a assets/srd5e/…/tokens)
 *   "arte:XMM/Bandit Captain"    ilustración grande de 5etools (assets/srd5e/img/bestiary/…)
 *   "https://…/imagen.webp"      cualquier imagen de internet (se baja a assets/ecos-frontera/arte)
 *   "worlds/…" o "tokenizer/…"   un archivo que ya está en Data
 * Campos: token, img, tokens (lista de claves de 5etools a probar), anillo (anillo dinámico de Foundry),
 * escala, forzar (cambia aunque ya tenga imagen) y vestuario ([{nombre, token, img}]).
 */
const ARTE_5E = "https://cdn.5e.tools/2024/img/bestiary/";
const LOCAL_ARTE_5E = "assets/srd5e/img/bestiary/";
const DIR_ARTE = "assets/ecos-frontera/arte";

async function subirBlob(blob, dir, nombre) {
  const FP = foundry.applications?.apps?.FilePicker?.implementation ?? globalThis.FilePicker;
  try {
    await FP.browse("data", dir);
  } catch {
    let acc = "";
    for (const parte of dir.split("/")) {
      acc = acc ? `${acc}/${parte}` : parte;
      try {
        await FP.createDirectory("data", acc, {});
      } catch {
        // ya existe
      }
    }
  }
  const res = await FP.upload("data", dir, new File([blob], nombre, { type: blob.type }), {}, { notify: false });
  const ruta = res?.path ?? `${dir}/${nombre}`;
  CACHE_ICONOS.delete(ruta);
  return (await existeArchivo(ruta)) ? ruta : null;
}

async function bajarImagen(url, dir, nombre) {
  const local = `${dir}/${nombre}`;
  if (await existeArchivo(local)) return local;
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    const blob = await r.blob();
    if (!/^(image|video)\//.test(blob.type)) return null;
    return await subirBlob(blob, dir, nombre);
  } catch (err) {
    console.warn(`${MOD} | no pude bajar ${url}`, err);
    return null;
  }
}

/** Convierte una fuente (clave de 5etools, URL o ruta) en una ruta local. null si no se pudo. */
async function resolverArte(fuente) {
  if (!fuente || (typeof fuente !== "string")) return null;
  const f = fuente.trim();
  if (/^https?:\/\//i.test(f)) {
    const k = claveCDN(f);
    if (k) return token5e(k);
    let base = decodeURIComponent(f.split(/[?#]/)[0].split("/").pop() || "imagen");
    base = base.replace(/[^\w.\- ]+/g, "_");
    if (!/\.(webp|png|jpe?g|gif|svg|webm|mp4)$/i.test(base)) base += ".webp";
    const hash = Array.from(f).reduce((h, c) => ((h * 31) + c.charCodeAt(0)) >>> 0, 7).toString(36).slice(0, 6);
    return bajarImagen(f, DIR_ARTE, `${hash}-${base}`);
  }
  if (/^arte:/i.test(f)) {
    const k = f.slice(5).trim();
    const corte = k.lastIndexOf("/");
    return bajarImagen(`${ARTE_5E}${k.split("/").map(encodeURIComponent).join("/")}.webp`, `${LOCAL_ARTE_5E}${k.slice(0, corte)}`, `${k.slice(corte + 1)}.webp`);
  }
  if (/\.(webp|png|jpe?g|gif|svg|webm|mp4)$/i.test(f)) return (await existeArchivo(f)) ? f : null;
  if (/^[A-Za-z0-9]+\/[^/]+$/.test(f)) return token5e(f.replace(/^token:/i, ""));
  return null;
}

function buscarActorArte(r) {
  if (r.id) return game.actors.get(r.id) ?? null;
  if (r.clave) return game.actors.find(x => x.getFlag(MOD, "clave") === r.clave) ?? null;
  if (r.nombre) return game.actors.find(x => x.name === r.nombre) ?? null;
  return null;
}

/** Aplica arte a un actor (y a sus tokens en escena que tenían la imagen vieja). */
async function aplicarArte(actor, r) {
  if (!actor) return { ok: false, fallos: ["no encuentro la ficha"] };
  const fallos = [];
  const upd = {};
  const vieja = actor.prototypeToken?.texture?.src;
  let token = null;
  for (const fuente of [r.token, ...(r.tokens ?? [])].filter(Boolean)) {
    token = await resolverArte(fuente);
    if (token) break;
  }
  if ((r.token || r.tokens?.length) && !token) fallos.push("token");
  const img = r.img ? await resolverArte(r.img) : null;
  if (r.img && !img) fallos.push("retrato");
  const generico = campo => !!r.siEs && new RegExp(r.siEs).test(String(campo ?? ""));
  const puede = campo => r.forzar || imagenVacia(campo) || generico(campo);
  if (token && puede(vieja)) {
    upd["prototypeToken.texture.src"] = token;
    upd["prototypeToken.randomImg"] = false;
  }
  if (img && puede(actor.img)) upd.img = img;
  else if (token && !r.img && imagenVacia(actor.img)) upd.img = token;
  if (r.anillo !== undefined) {
    upd["prototypeToken.ring.enabled"] = !!r.anillo;
    if (r.anillo) upd["prototypeToken.ring.subject.texture"] = token ?? vieja;
  }
  if (r.escala) {
    upd["prototypeToken.texture.scaleX"] = r.escala;
    upd["prototypeToken.texture.scaleY"] = r.escala;
  }
  if (r.vestuario?.length) {
    const lista = vestuarioDe(actor);
    for (const v of r.vestuario) {
      const t = await resolverArte(v.token);
      if (!t) {
        fallos.push(`vestuario «${v.nombre}»`);
        continue;
      }
      const i = await (v.img ? resolverArte(v.img) : null);
      const ropa = { id: lista.find(x => x.nombre === v.nombre)?.id ?? foundry.utils.randomID(), nombre: v.nombre, token: t, img: i };
      const j = lista.findIndex(x => x.nombre === v.nombre);
      if (j >= 0) lista[j] = ropa;
      else lista.push(ropa);
    }
    if (!lista.some(x => x.token === (upd["prototypeToken.texture.src"] ?? vieja))) {
      lista.unshift({ id: foundry.utils.randomID(), nombre: "Original", token: upd["prototypeToken.texture.src"] ?? vieja, img: upd.img ?? actor.img });
    }
    upd[`flags.${MOD}.vestuario`] = lista;
  }
  if (!Object.keys(upd).length) return { ok: false, fallos };
  await actor.update(upd);
  const nueva = upd["prototypeToken.texture.src"];
  if (nueva || (r.anillo !== undefined)) {
    for (const s of game.scenes) {
      const cambios = s.tokens.filter(t => (t.actorId === actor.id) && (imagenVacia(t.texture?.src) || (t.texture?.src === vieja) || generico(t.texture?.src))).map(t => {
        const c = { _id: t.id };
        if (nueva) c["texture.src"] = nueva;
        if (r.anillo !== undefined) {
          c["ring.enabled"] = !!r.anillo;
          if (r.anillo) c["ring.subject.texture"] = nueva ?? vieja;
        }
        return c;
      });
      if (cambios.length) await s.updateEmbeddedDocuments("Token", cambios);
    }
  }
  return { ok: true, fallos };
}

/** Retrato provisional (token de 5etools) para un PNJ que todavía tiene la silueta gris. Prueba las claves en orden. */
async function ponerRetrato(actor, claves) {
  if (!imagenVacia(actor.prototypeToken?.texture?.src) && !imagenVacia(actor.img)) return false;
  for (const k of claves) {
    const ruta = await token5e(k);
    if (!ruta) continue;
    const upd = {};
    if (imagenVacia(actor.prototypeToken?.texture?.src)) upd["prototypeToken.texture.src"] = ruta;
    if (imagenVacia(actor.img)) upd.img = ruta;
    await actor.update(upd);
    for (const s of game.scenes) {
      const cambios = s.tokens.filter(t => (t.actorId === actor.id) && imagenVacia(t.texture?.src)).map(t => ({ _id: t.id, "texture.src": ruta }));
      if (cambios.length) await s.updateEmbeddedDocuments("Token", cambios);
    }
    return true;
  }
  return false;
}
const DIRS_ICONOS = ["icons/consumables/food", "icons/consumables/drinks", "icons/consumables/potions", "icons/tools/hand", "icons/tools/smithing", "icons/tools/laboratory", "icons/tools/fasteners", "icons/sundries/misc", "icons/sundries/lights", "icons/commodities/cloth", "icons/commodities/leather", "icons/equipment/back", "icons/equipment/feet", "icons/containers/misc", "icons/skills/trades"];
async function resolverIcono(preferido, palabras = [], respaldo = "icons/svg/item-bag.svg") {
  if (preferido && await existeArchivo(preferido)) return preferido;
  const pal = palabras.map(p => p.toLowerCase());
  if (pal.length) {
    const dirs = [preferido?.split("/").slice(0, -1).join("/"), ...DIRS_ICONOS].filter(Boolean);
    for (const dir of [...new Set(dirs)]) {
      const f = (await listarIconos(dir)).find(x => pal.some(p => x.toLowerCase().split("/").pop().includes(p)));
      if (f) return f;
    }
  }
  return respaldo;
}

/** Imagen de la tienda: el retrato del PNJ que la atiende, si existe; si no, el ícono del negocio. */
async function imagenTienda(T) {
  const npc = game.actors.find(a => (a.type === "npc" || a.type === "character") && !tiendaDe(a)
    && T.npc.some(n => a.name.toLowerCase().includes(n.toLowerCase())) && a.img && !a.img.startsWith("icons/svg"));
  if (npc) return { img: npc.img, token: npc.prototypeToken?.texture?.src || npc.img, npc: npc.name };
  const ic = await resolverIcono(T.img, T.kw, "icons/svg/item-bag.svg");
  return { img: ic, token: ic, npc: null };
}

/** Datos de Item Piles para el actor de una tienda. */
function datosMerchant(T, img, estado = "open") {
  return {
    enabled: true, type: "merchant", distance: 0, canInspectItems: true, displayItemTypes: false,
    description: `${T.descripcion}<p><b>Atiende:</b> ${T.dueno} · <b>Dónde:</b> ${T.lugar} · <b>Horario:</b> ${textoHorario(T)}</p>${T.compra.length ? "<p><i>Compra objetos a la mitad de su precio.</i></p>" : "<p><i>Aquí no se compran objetos usados.</i></p>"}`,
    merchantImage: img, infiniteCurrencies: true, infiniteQuantity: false, purchaseOnly: !T.compra.length,
    hideNewItems: false, hideItemsWithZeroCost: false, keepZeroQuantity: true, onlyAcceptBasePrice: false,
    displayQuantity: "yes", buyPriceModifier: 1, sellPriceModifier: 0.5,
    openTimes: { enabled: true, status: estado, open: { hour: T.horario[0][0] % 24, minute: 0 }, close: { hour: T.horario.at(-1)[1] % 24, minute: 0 } }
  };
}

/** Objeto (datos) de un artículo del catálogo, listo para crear en la tienda. */
async function datosArticulo(art, pack) {
  let data;
  if (art.src) {
    const doc = await pack?.getDocument(art.src).catch(() => null);
    if (!doc) return null;
    data = doc.toObject();
    delete data._id;
    delete data.folder;
    delete data.sort;
    delete data.ownership;
  } else {
    data = { name: art.n, type: art.t ?? "loot", img: await resolverIcono(art.ic, art.kw ?? []), system: {} };
    if (data.type === "consumable") data.system.type = { value: art.ct ?? "trinket" };
    if (data.type === "equipment") data.system.type = { value: "clothing" };
  }
  data.name = art.n;
  data.system ??= {};
  data.system.price = { value: art.p ?? 0, denomination: "cp" };
  data.system.quantity = art.serv ? 1 : Math.max(0, art.s ?? 0);
  if (art.peso !== undefined) data.system.weight = { value: art.peso, units: "lb" };
  // Objetos a medida con reglas: rareza, sintonía, campos del sistema y efectos (bonos mientras se lleva).
  if (art.rar) data.system.rarity = art.rar;
  if (art.sint) data.system.attunement = "required";
  for (const [k, v] of Object.entries(art.sys ?? {})) foundry.utils.setProperty(data.system, k, foundry.utils.deepClone(v));
  if (art.efectos?.length) data.effects = art.efectos.map(e => ({ img: data.img, transfer: true, disabled: false, ...foundry.utils.deepClone(e) }));
  const original = data.system.description?.value ?? "";
  const extra = [];
  if (art.enc) extra.push(`<p><b>Por encargo:</b> se paga al pedirlo y te lo entregan en unos <b>${art.enc} días</b> (al despertar el día en que esté listo).</p>`);
  if (art.d) extra.push(art.d);
  if (art.herr) extra.push(`<p><i>Herramienta de calidad: +${art.herr.bono} a las jornadas de ${art.herr.oficios.map(k => OFICIOS[k]?.nombre ?? k).join(", ")}.</i></p>`);
  if (art.temp) extra.push(`<p><i>De temporada (${{ primavera: "primavera", verano: "verano", otono: "otoño", invierno: "invierno" }[art.temp]}): cuando hay, hay.</i></p>`);
  data.system.description = { ...(data.system.description ?? {}), value: `${extra.join("")}${(art.enc || art.serv) && art.src ? "" : original}` };
  data.flags ??= {};
  data.flags[MOD] = { cat: art.id, ...(art.herr ? { herramienta: art.herr } : {}) };
  data.flags["item-piles"] = {
    item: {
      customCategory: art.cat ?? "", isService: !!art.serv, infiniteQuantity: art.serv ? "yes" : "default",
      keepZeroQuantity: !art.serv, cantBeSoldToMerchants: !!art.serv,
      ...(art.sc ? { disableNormalCost: !art.p, prices: [[precioSoul(art.sc)]] } : {})
    }
  };
  return data;
}

/* ---------- Monedas Antiguas como moneda secundaria de Item Piles (solo las aceptan algunos mercaderes) ---------- */
const MONEDA_SOUL = {
  type: "attribute", name: "Moneda Antigua", img: `${RUTA}/icons/soul-coin.svg`, abbreviation: "{#} MA",
  data: { path: "system.currency.soul" }
};
const precioSoul = n => ({ ...foundry.utils.deepClone(MONEDA_SOUL), quantity: n, fixed: true, secondary: true });
const precioSoulDe = it => Number(it?.getFlag?.("item-piles", "item")?.prices?.[0]?.[0]?.quantity ?? 0);
/** El precio guardado en el objeto todavía dice «Soul coin» (v1.9): hay que reescribirlo. */
const precioSoulViejo = it => !!it?.getFlag?.("item-piles", "item")?.prices?.[0]?.some?.(p => (p?.data?.path === MONEDA_SOUL.data.path) && (p.name !== MONEDA_SOUL.name));
async function monedaSoulItemPiles() {
  try {
    const sec = game.settings.get("item-piles", "secondaryCurrencies");
    if (!Array.isArray(sec)) return false;
    const i = sec.findIndex(c => c?.data?.path === MONEDA_SOUL.data.path);
    // Ya está con el nombre de ahora: nada que hacer. Con el nombre viejo (Soul coin), se le cambia el nombre.
    if ((i >= 0) && (sec[i].name === MONEDA_SOUL.name) && (sec[i].abbreviation === MONEDA_SOUL.abbreviation)) return false;
    const nuevas = (i >= 0)
      ? sec.map((c, j) => ((j === i) ? { ...c, name: MONEDA_SOUL.name, abbreviation: MONEDA_SOUL.abbreviation } : c))
      : [...sec, foundry.utils.deepClone(MONEDA_SOUL)];
    await game.settings.set("item-piles", "secondaryCurrencies", nuevas);
    return true;
  } catch (err) {
    console.warn(`${MOD} | Moneda Antigua en Item Piles`, err);
    return false;
  }
}

/* ---------- Tiendas ocultas (el mercado negro): los jugadores no las ven hasta que el DM las revela ---------- */
const tiendaVisible = T => !T.oculta || !!actorTienda(T.id)?.getFlag(MOD, "revelada");
async function revelarTienda(id, si = true) {
  if (!game.user.isGM) return;
  const actor = actorTienda(id);
  if (!actor) return ui.notifications.warn("Esa tienda todavía no existe: monta el mercadillo.");
  await actor.update({
    [`flags.${MOD}.revelada`]: !!si,
    "ownership.default": si ? CONST.DOCUMENT_OWNERSHIP_LEVELS.LIMITED : CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE
  });
  await escribirPaginaMercadillo();
  ui.notifications.info(`${actor.name}: ${si ? "los jugadores ya la ven" : "vuelve a estar oculta"}.`);
}

async function carpetaMercadillo() {
  return game.folders.find(f => (f.type === "Actor") && (f.name === CARPETA_MERCADILLO))
    ?? Folder.create({ name: CARPETA_MERCADILLO, type: "Actor", color: "#6b4f2a" });
}

/** Crea o actualiza los artículos de una tienda según el catálogo (sin tocar las existencias). */
async function sincronizarArticulos(actor, T, pack) {
  const crear = [];
  const actualizar = [];
  for (const art of T.items) {
    const it = actor.items.find(i => i.getFlag(MOD, "cat") === art.id);
    if (!it) {
      const data = await datosArticulo(art, pack);
      if (data) {
        data.flags[MOD].repuesto = ahoraMercado();
        crear.push(data);
      }
    } else if ((it.system.price?.value !== (art.p ?? 0)) || (it.system.price?.denomination !== "cp") || (it.name !== art.n)
      || ((art.sc ?? 0) !== precioSoulDe(it)) || (art.sc && precioSoulViejo(it))) {
      const u = { _id: it.id, name: art.n, "system.price.value": art.p ?? 0, "system.price.denomination": "cp" };
      if (art.sc) Object.assign(u, { "flags.item-piles.item.disableNormalCost": !art.p, "flags.item-piles.item.prices": [[precioSoul(art.sc)]] });
      actualizar.push(u);
    }
  }
  if (crear.length) await actor.createEmbeddedDocuments("Item", crear);
  if (actualizar.length) await actor.updateEmbeddedDocuments("Item", actualizar);
  // Artículos que ya no son de esta tienda (por ejemplo, los que pasaron a la tienda de Kunno o de Sera).
  const vigentes = new Set(T.items.map(a => a.id));
  const sobran = actor.items.filter(i => i.getFlag(MOD, "cat") && !vigentes.has(i.getFlag(MOD, "cat"))).map(i => i.id);
  if (sobran.length) await actor.deleteEmbeddedDocuments("Item", sobran);
  return { creados: crear.length, actualizados: actualizar.length, quitados: sobran.length };
}

/** Monta (o pone al día) el mercadillo: una tienda de Item Piles por negocio y la escena. */
async function montarMercadillo({ escena = true, aviso = true } = {}) {
  if (!game.user.isGM) return;
  if (!apiIP()) {
    if (aviso) ui.notifications.warn("Ecos de la frontera: activa el módulo Item Piles para usar el mercadillo.");
    return null;
  }
  const pack = game.packs.get(PACK_EQUIPO);
  const carpeta = await carpetaMercadillo();
  const version = game.modules.get("item-piles")?.version ?? "";
  const estado = ahoraMundo();
  const L = [];
  for (const T of TIENDAS) {
    const im = await imagenTienda(T);
    let actor = actorTienda(T.id);
    const status = estadoHorario(T, estado.hora, actor?.getFlag("item-piles", "data")?.openTimes?.status ?? null);
    const pile = datosMerchant(T, im.img, status);
    if (!actor) {
      actor = await Actor.create({
        name: T.nombre, type: "npc", img: im.img, folder: carpeta.id,
        ownership: { default: T.oculta ? CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE : CONST.DOCUMENT_OWNERSHIP_LEVELS.LIMITED },
        prototypeToken: {
          name: T.nombre, actorLink: true, displayName: CONST.TOKEN_DISPLAY_MODES.ALWAYS,
          disposition: CONST.TOKEN_DISPOSITIONS.NEUTRAL, width: 2, height: 2, texture: { src: im.token },
          flags: { "item-piles": { data: pile, version } }
        },
        flags: { [MOD]: { tienda: T.id }, "item-piles": { data: pile, version } }
      });
      L.push(`Creada <b>${T.nombre}</b>${im.npc ? ` (con el retrato de ${im.npc})` : ""}.`);
    } else {
      const previo = actor.getFlag("item-piles", "data") ?? {};
      await actor.update({
        [`flags.item-piles.data`]: { ...pile, actorPriceModifiers: previo.actorPriceModifiers ?? [], itemTypePriceModifiers: previo.itemTypePriceModifiers ?? [] },
        [`flags.item-piles.version`]: version
      });
    }
    const r = await sincronizarArticulos(actor, T, pack);
    if (r.creados || r.actualizados) L.push(`${T.nombre}: ${r.creados} artículo(s) nuevo(s), ${r.actualizados} precio(s) puesto(s) al día.`);
  }
  await monedasEnEspanol();
  if (TIENDAS.some(T => T.items.some(a => a.sc)) && await monedaSoulItemPiles()) L.push("Item Piles: las <b>Monedas Antiguas</b> quedan como moneda secundaria (solo las aceptan algunos mercaderes, como el mercado negro).");
  if (escena) await escenaMercadillo();
  await sincronizarDescuentos();
  await escribirPaginaMercadillo();
  return L;
}

/** Item Piles muestra las monedas como o / p / c (oro, plata, cobre). */
async function monedasEnEspanol() {
  try {
    const actuales = game.settings.get("item-piles", "currencies");
    if (!Array.isArray(actuales) || !actuales.length) return;
    const nombres = { pp: ["Platino", "{#} pt"], gp: ["Oro", "{#} o"], ep: ["Electro", "{#} el"], sp: ["Plata", "{#} p"], cp: ["Cobre", "{#} c"] };
    let cambio = false;
    const nuevas = actuales.map(c => {
      const k = String(c?.data?.path ?? "").split(".").pop();
      const n = nombres[k];
      if (!n || ((c.name === n[0]) && (c.abbreviation === n[1]))) return c;
      cambio = true;
      return { ...c, name: n[0], abbreviation: n[1] };
    });
    if (cambio) await game.settings.set("item-piles", "currencies", nuevas);
  } catch (err) {
    console.warn(`${MOD} | monedas de Item Piles`, err);
  }
}

/** Escena "Mercadillo de Arcegris" con un puesto por tienda. */
async function escenaMercadillo() {
  let escena = game.scenes.find(s => s.getFlag(MOD, "mercadillo"));
  const columnas = 4;
  const ancho = 2400;
  const PUESTOS = TIENDAS.filter(T => !T.oculta);
  const alto = Math.max(1700, 300 + (Math.ceil(PUESTOS.length / columnas) * 480));
  if (escena && (escena.height < alto)) await escena.update({ height: alto });
  if (!escena) {
    escena = await Scene.create({
      name: "Mercadillo de Arcegris", navigation: true, navName: "Mercadillo",
      width: ancho, height: alto, padding: 0, backgroundColor: "#2b2218",
      grid: { type: CONST.GRID_TYPES.SQUARE, size: 100 }, tokenVision: false,
      fog: { exploration: false }, ownership: { default: CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER },
      flags: { [MOD]: { mercadillo: true } }
    });
    await escena.createEmbeddedDocuments("Drawing", [{
      x: 100, y: 30, shape: { type: "r", width: 2200, height: 110 }, fillType: 0, strokeWidth: 0,
      text: "Mercadillo de Arcegris · doble clic en un puesto para comprar o vender", fontSize: 44, textColor: "#f0e0c0", fontFamily: "Signika"
    }]);
  }
  const tokens = [];
  const textos = [];
  // Las tiendas ocultas (mercado negro) no tienen puesto: el DM suelta su ficha donde dice su biografía.
  PUESTOS.forEach((T, i) => {
    const actor = actorTienda(T.id);
    if (!actor || escena.tokens.some(t => t.actorId === actor.id)) return;
    const x = 200 + ((i % columnas) * 550);
    const y = 220 + (Math.floor(i / columnas) * 480);
    tokens.push({ ...actor.prototypeToken.toObject(), actorId: actor.id, actorLink: true, x, y });
    textos.push({
      x: x - 100, y: y + 210, shape: { type: "r", width: 400, height: 90 }, fillType: 1, fillColor: "#000000", fillAlpha: 0.35, strokeWidth: 0,
      text: `${T.nombre}\n${textoHorario(T)}`, fontSize: 24, textColor: "#f0e0c0", fontFamily: "Signika"
    });
  });
  if (tokens.length) await escena.createEmbeddedDocuments("Token", tokens);
  if (textos.length) await escena.createEmbeddedDocuments("Drawing", textos);
  return escena;
}

/* ---------- Página "8 · Mercadillo y precios" del Libro VI (la escribe el DM desde el catálogo) ---------- */
function htmlPaginaMercadillo() {
  const temporada = { primavera: "primavera", verano: "verano", otono: "otoño", invierno: "invierno" };
  const tiendas = TIENDAS.filter(tiendaVisible).map(T => {
    const secciones = {};
    for (const it of T.items) (secciones[it.cat ?? "Varios"] ??= []).push(it);
    const filas = Object.entries(secciones).map(([sec, items]) => `<tr><th colspan="3">${sec}</th></tr>${items.map(it => {
      const notas = [
        it.enc ? `por encargo: llega en ${it.enc} días` : "",
        (it.serv && !it.enc) ? "servicio" : "",
        (!it.serv && (it.s > 0)) ? `${it.s} en stock${it.r ? `, repone cada ${it.r} días` : ""}` : "",
        it.herr ? `<b>+${it.herr.bono} al trabajo</b> (${it.herr.oficios.map(k => OFICIOS[k]?.nombre ?? k).join(", ")})` : "",
        ((it.srv === "noche") && it.bono) ? `<b>+${it.bono} al trabajo de mañana</b>` : "",
        (it.srv === "afilar") ? "arregla una herramienta mellada" : "",
        (it.srv === "reparar") ? "arregla una herramienta rota" : "",
        it.temp ? `de ${temporada[it.temp] ?? it.temp}` : ""
      ].filter(Boolean).join(" · ");
      const precio = it.sc ? `${it.p ? `${textoDinero(it.p)} o ` : ""}${plural(it.sc, "Moneda Antigua", "Monedas Antiguas")}` : textoDinero(it.p);
      return `<tr><td>${it.n}</td><td>${precio}</td><td>${notas}</td></tr>`;
    }).join("")}`).join("");
    return `<h2>${T.nombre}</h2>
<p><b>Atiende:</b> ${T.dueno} · <b>Dónde:</b> ${T.lugar} · <b>Horario:</b> ${textoHorario(T)} · <b>Compra cosas usadas:</b> ${T.compra.length ? "sí, a la mitad del precio" : "no"}${T.patron ? ` · <b>Descuento por Prestigio con:</b> ${PATRONES[T.patron]?.nombre ?? T.patron}` : ""}</p>
<table><thead><tr><th>Artículo</th><th>Precio</th><th>Notas</th></tr></thead><tbody>${filas}</tbody></table>`;
  }).join("\n");
  return `<h1>Mercadillo de Arcegris</h1>
<p><em>Esta página la escribe el módulo a partir del catálogo de las tiendas. Si la editas a mano, se sobrescribe la próxima vez que el DM ponga al día el mercadillo.</em></p>
<h2>Cómo se compra</h2>
<ol>
<li>Abre tu hoja y aprieta <b>Mercado</b> (arriba, junto a Trabajar). También sirve el botón de la tienda en los controles de Tokens, o el doble clic en un puesto de la escena <i>Mercadillo de Arcegris</i>.</li>
<li>Elige el puesto. Las tiendas cerradas aparecen apagadas: las abre y cierra el DM.</li>
<li>Dentro, elige el artículo y la cantidad y aprieta <b>Comprar</b>. El precio se descuenta solo de tu bolsa (el DM tiene que estar conectado).</li>
<li>Para <b>vender botín</b>, usa la pestaña de vender del puesto: pagan la mitad del precio y solo compran lo de su rubro. La panadería, la posada y la capilla no compran nada.</li>
</ol>
<h2>Reglas del mercado</h2>
<ul>
<li><b>Monedas:</b> 10 cobres (c) = 1 plata (p) · 100 c = 1 oro (o). En el pueblo casi todo se paga en cobre. Las <b>Monedas Antiguas</b> no se aceptan aquí: solo algunos mercaderes especiales las quieren.</li>
<li><b>Precios del valle:</b> todo lo del manual vale una décima parte (una espada larga, unos 15 días de trabajo de un peón). El metal llega por la Ruta Occidental y cuesta un poco más; la madera y el cuero del valle, un poco menos; lo importado, bastante más.</li>
<li><b>Stock:</b> cada puesto tiene existencias. Cuando se acaban, se reponen con los días (el pan cada día, las armas cada una o dos semanas).</li>
<li><b>Por encargo:</b> las piezas grandes se pagan al pedirlas y te las entregan solas al despertar el día en que están listas.</li>
<li><b>Servicios:</b> comida, bebida, baño, lavado, afilar o reparar herramientas, recados, rumores y noches en la posada. Se pagan y no entran al inventario; los que arreglan herramientas o dan alojamiento tienen efecto automático.</li>
<li><b>Alojamiento y comida:</b> no hay costo de vida automático: cada uno compra su cama y su comida. Una noche en la <b>habitación sencilla o privada</b> de El Último Roble da +1 a tu prueba de trabajo del día siguiente; la <b>mejor habitación</b>, +2.</li>
<li><b>Herramientas de calidad:</b> dan +1 a las jornadas de su oficio mientras las lleves.</li>
<li><b>De temporada:</b> algunos productos solo existen en su estación.</li>
<li><b>Prestigio:</b> con el patrón de la tienda, Respetado −5 %, Imprescindible −10 %, Socio −15 %; Vetado, +20 %. Se aplica solo.</li>
</ul>
${tiendas}`;
}

async function escribirPaginaMercadillo() {
  if (!soyGM()) return;
  const diario = game.journal.get(ID_REGLAS) ?? game.journal.find(j => /reglas de la casa/i.test(j.name));
  if (!diario) return;
  const html = htmlPaginaMercadillo();
  const pagina = diario.pages.find(p => p.getFlag(MOD, "mercadillo"));
  if (pagina) {
    if (pagina.text?.content !== html) await pagina.update({ "text.content": html });
    return;
  }
  const p7 = diario.pages.find(p => /^7\s*·/.test(p.name));
  const orden = p7 ? (p7.sort ?? 0) + 1 : Math.max(0, ...diario.pages.map(p => p.sort ?? 0)) + 100000;
  await diario.createEmbeddedDocuments("JournalEntryPage", [{
    name: "8 · Mercadillo y precios", type: "text", sort: orden,
    text: { content: html, format: CONST.JOURNAL_ENTRY_PAGE_FORMATS.HTML },
    flags: { [MOD]: { mercadillo: true } }
  }]);
}

/* ---------- Horarios ---------- */
function estadoHorario(T, hora, actual = null) {
  const modo = game.settings.get(MOD, "horarios");
  if (modo === "abiertas") return "open";
  if (modo === "cerradas") return "closed";
  if (modo === "hora") return abiertaA(T, hora) ? "open" : "closed";
  return actual ?? "open"; // a mano: el DM abre y cierra cada tienda
}
async function actualizarHorarios() {
  if (!soyGM() || !apiIP()) return;
  const { hora } = ahoraMundo();
  for (const T of TIENDAS) {
    const actor = actorTienda(T.id);
    if (!actor) continue;
    const actual = actor.getFlag("item-piles", "data")?.openTimes?.status ?? null;
    const status = estadoHorario(T, hora, actual);
    if (actual === status) continue;
    await actor.update({ "flags.item-piles.data.openTimes.status": status });
  }
}
const actualizarHorariosLuego = foundry.utils.debounce(() => actualizarHorarios().catch(err => console.error(`${MOD} |`, err)), 800);

/* ---------- Reposición: un "día de mercado" avanza con el reloj del mundo o cuando los PJ duermen ---------- */
const ahoraMercado = () => Number(game.settings.get(MOD, "mercado")?.dia ?? 0);
function diaMaxPJ() {
  return Math.max(0, ...game.actors.filter(esPJ).map(a => Number(a.getFlag(MOD, "oficio")?.dia ?? 1)));
}
async function revisarDiaMercado() {
  if (!soyGM() || !apiIP()) return;
  const m = foundry.utils.deepClone(game.settings.get(MOD, "mercado") ?? {});
  const dMundo = ahoraMundo().dias;
  const dPJ = diaMaxPJ();
  if (m.baseMundo === undefined) {
    await game.settings.set(MOD, "mercado", { dia: 0, baseMundo: dMundo, basePJ: dPJ });
    return;
  }
  const nuevo = Math.max(0, dMundo - m.baseMundo, dPJ - m.basePJ);
  if (nuevo <= (m.dia ?? 0)) return;
  m.dia = nuevo;
  await game.settings.set(MOD, "mercado", m);
  await reponerTiendas();
}

/** Repone las existencias de cada tienda según su ritmo (pan cada día, lo importado con la caravana). */
async function reponerTiendas({ forzar = false } = {}) {
  if (!soyGM() || !apiIP()) return 0;
  const hoy = ahoraMercado();
  const { estacion } = ahoraMundo();
  let n = 0;
  for (const T of TIENDAS) {
    const actor = actorTienda(T.id);
    if (!actor) continue;
    const cambios = [];
    for (const art of T.items) {
      if (art.serv || !(art.s > 0)) continue;
      const it = actor.items.find(i => i.getFlag(MOD, "cat") === art.id);
      if (!it) continue;
      const fuera = art.temp && estacion && (art.temp !== estacion);
      const ultimo = Number(it.getFlag(MOD, "repuesto") ?? 0);
      const toca = forzar || ((art.r > 0) && ((hoy - ultimo) >= art.r));
      const objetivo = fuera ? 0 : art.s;
      if (fuera && ((it.system.quantity ?? 0) > 0)) cambios.push({ _id: it.id, "system.quantity": 0 });
      else if (toca && ((it.system.quantity ?? 0) < objetivo)) cambios.push({ _id: it.id, "system.quantity": objetivo, [`flags.${MOD}.repuesto`]: hoy });
      else if (toca) cambios.push({ _id: it.id, [`flags.${MOD}.repuesto`]: hoy });
    }
    if (cambios.length) {
      await actor.updateEmbeddedDocuments("Item", cambios);
      n += cambios.filter(c => c["system.quantity"] !== undefined).length;
    }
  }
  return n;
}

/* ---------- Descuentos por Prestigio ---------- */
async function sincronizarDescuentos() {
  if (!soyGM() || !apiIP()) return;
  const pjs = game.actors.filter(esPJ);
  for (const T of TIENDAS) {
    if (!T.patron) continue;
    const actor = actorTienda(T.id);
    if (!actor) continue;
    const previo = actor.getFlag("item-piles", "data")?.actorPriceModifiers ?? [];
    const propios = new Set(pjs.map(a => a.uuid));
    const lista = previo.filter(m => !propios.has(m.actorUuid));
    for (const a of pjs) {
      const pres = Number(a.getFlag(MOD, "oficio")?.prestigio?.[T.patron] ?? 0);
      const m = rangoPrestigio(pres).tienda ?? 1;
      if (m !== 1) lista.push({ actorUuid: a.uuid, buyPriceModifier: m, sellPriceModifier: 1, override: false });
    }
    if (JSON.stringify(lista) !== JSON.stringify(previo)) await actor.update({ "flags.item-piles.data.actorPriceModifiers": lista });
  }
}
const sincronizarDescuentosLuego = foundry.utils.debounce(() => sincronizarDescuentos().catch(err => console.error(`${MOD} |`, err)), 1500);

/* ---------- Pedidos por encargo ---------- */
async function entregarPedido(actor, p) {
  try {
    const art = ARTICULOS.get(p.id);
    const pack = game.packs.get(PACK_EQUIPO);
    const data = art ? await datosArticulo({ ...art, n: p.nombre, enc: 0, serv: false, s: 1 }, pack) : null;
    if (!data) return false;
    delete data.flags["item-piles"];
    data.system.quantity = 1;
    await actor.createEmbeddedDocuments("Item", [data]);
    return true;
  } catch (err) {
    console.error(`${MOD} | pedido`, err);
    return false;
  }
}

/* ---------- Ventana del Mercadillo ---------- */
function compradorPorDefecto() {
  const propios = game.actors.filter(a => esPJ(a) && a.isOwner);
  return canvas.tokens?.controlled.map(t => t.actor).find(a => a && a.isOwner && !tiendaDe(a))
    ?? (propios.includes(game.user.character) ? game.user.character : null)
    ?? (game.user.isGM ? null : propios[0] ?? null);
}

async function abrirTienda(id, comprador = compradorPorDefecto()) {
  const api = apiIP();
  if (!api) return ui.notifications.warn("El mercadillo necesita el módulo Item Piles activo.");
  const actor = actorTienda(id);
  if (!actor || (!game.user.isGM && !tiendaVisible(infoTienda(id) ?? {}))) return ui.notifications.warn(game.user.isGM ? "Esa tienda todavía no existe: monta el mercadillo." : "Esa tienda todavía no está abierta. Avisa al DM.");
  if (!game.user.isGM && (actor.getFlag("item-piles", "data")?.openTimes?.status === "closed")) {
    return ui.notifications.warn(`${actor.name} está cerrada ahora. ${infoTienda(id)?.horario ? `Horario: ${textoHorario(infoTienda(id))}.` : ""}`);
  }
  return api.renderItemPileInterface(actor, comprador ? { inspectingTarget: comprador } : {});
}

async function abrirMercadillo(elegido = null) {
  const { DialogV2 } = foundry.applications.api;
  if (!apiIP()) return ui.notifications.warn("El mercadillo necesita el módulo Item Piles activo.");
  const comprador = elegido ?? compradorPorDefecto();
  const ahora = ahoraMundo();
  const datos = comprador ? oficioDe(comprador) : null;
  const filas = TIENDAS.filter(T => game.user.isGM || tiendaVisible(T)).map(T => {
    const actor = actorTienda(T.id);
    const estado = actor?.getFlag("item-piles", "data")?.openTimes?.status ?? estadoHorario(T, ahora.hora);
    const oculta = T.oculta && !tiendaVisible(T);
    const ojo = (game.user.isGM && actor && T.oculta)
      ? `<button type="button" class="ecos-puerta" data-revelar="${T.id}" data-tooltip="${oculta ? "Revelarla a los jugadores" : "Volver a ocultarla"}"><i class="fa-solid ${oculta ? "fa-eye-slash" : "fa-eye"}"></i></button>`
      : "";
    const pres = (datos && T.patron) ? (datos.prestigio[T.patron] ?? 0) : 0;
    const m = T.patron ? (rangoPrestigio(pres).tienda ?? 1) : 1;
    const desc = (m < 1) ? `<span class="ecos-desc ok">−${Math.round((1 - m) * 100)} %</span>` : (m > 1 ? `<span class="ecos-desc mal">+${Math.round((m - 1) * 100)} %</span>` : "");
    const puerta = (game.user.isGM && actor)
      ? `<button type="button" class="ecos-puerta" data-puerta="${T.id}" data-tooltip="${estado === "closed" ? "Abrir la tienda" : "Cerrar la tienda"}"><i class="fa-solid ${estado === "closed" ? "fa-door-closed" : "fa-door-open"}"></i></button>`
      : "";
    return `<div class="ecos-tienda ${estado === "closed" ? "cerrada" : ""}" data-tienda="${T.id}">
      <img src="${actor?.img ?? T.img}" alt="">
      <span class="ecos-tienda-txt"><b>${T.nombre}</b> ${desc}<br><span class="ecos-nota">${T.dueno} · ${textoHorario(T)} · ${estado === "closed" ? "<b>cerrada</b>" : "abierta"}${actor ? "" : " · <i>sin montar</i>"}${oculta ? " · <b>oculta</b> (los jugadores no la ven)" : ""}</span></span>
      ${ojo}${puerta}
    </div>`;
  }).join("");
  const reloj = (game.settings.get(MOD, "horarios") === "hora") ? `${ahora.texto ? `${ahora.texto} · ` : ""}Son las <b>${String(ahora.hora).padStart(2, "0")}:00</b>.` : "";
  const cabecera = `<p class="ecos-nota">${reloj}${comprador ? ` Compras como <b>${comprador.name}</b> (${textoDinero(totalCobres(comprador))} encima${datos?.deuda ? `, debe ${textoDinero(datos.deuda)}` : ""}).` : " Selecciona tu token para comprar con tu personaje."}</p>`;
  const botones = [{ action: "cerrar", label: "Cerrar", icon: "fa-solid fa-xmark", default: true }];
  if (game.user.isGM) {
    botones.unshift(
      { action: "montar", label: "Montar / actualizar", icon: "fa-solid fa-store" },
      { action: "reponer", label: "Reponer todo", icon: "fa-solid fa-boxes-stacked" },
      { action: "escena", label: "Ir a la escena", icon: "fa-solid fa-map" }
    );
  }
  const r = await DialogV2.wait({
    window: { title: "Mercadillo de Arcegris", icon: "fa-solid fa-store" },
    position: { width: 560 },
    content: `<div class="ecos-dialogo ecos-mercadillo">${cabecera}<div class="ecos-tiendas">${filas}</div><p class="ecos-nota">Clic en un puesto para entrar. Dentro: elige cantidad y <b>Comprar</b>; se descuenta solo de tu bolsa. Para vender, arrastra o usa la pestaña de vender (solo en los puestos que compran).</p></div>`,
    rejectClose: false,
    buttons: botones,
    render: (event, dialog) => {
      const raiz = dialog?.element ?? event?.target?.element;
      raiz?.querySelectorAll?.("[data-tienda]").forEach(a => a.addEventListener("click", ev => {
        ev.preventDefault();
        dialog?.close?.();
        abrirTienda(a.dataset.tienda, comprador).catch(err => console.error(`${MOD} |`, err));
      }));
      raiz?.querySelectorAll?.("[data-puerta]").forEach(b => b.addEventListener("click", async ev => {
        ev.preventDefault();
        ev.stopPropagation();
        const actor = actorTienda(b.dataset.puerta);
        if (!actor) return;
        const cerrada = actor.getFlag("item-piles", "data")?.openTimes?.status === "closed";
        await actor.update({ "flags.item-piles.data.openTimes.status": cerrada ? "open" : "closed" });
        dialog?.close?.();
        abrirMercadillo(comprador).catch(err => console.error(`${MOD} |`, err));
      }));
      raiz?.querySelectorAll?.("[data-revelar]").forEach(b => b.addEventListener("click", async ev => {
        ev.preventDefault();
        ev.stopPropagation();
        const T = infoTienda(b.dataset.revelar);
        await revelarTienda(T.id, !tiendaVisible(T));
        dialog?.close?.();
        abrirMercadillo(comprador).catch(err => console.error(`${MOD} |`, err));
      }));
    }
  });
  if (r === "montar") {
    ui.notifications.info("Montando el mercadillo…");
    const L = await montarMercadillo();
    await actualizarHorarios();
    if (L) susurrarDM("Mercadillo de Arcegris", L.length ? L : ["Todo estaba al día."]);
  } else if (r === "reponer") {
    const n = await reponerTiendas({ forzar: true });
    ui.notifications.info(`Mercadillo: ${n} artículo(s) repuestos.`);
  } else if (r === "escena") {
    const esc = game.scenes.find(s => s.getFlag(MOD, "mercadillo"));
    if (esc) esc.view();
    else ui.notifications.warn("La escena no existe: usa Montar / actualizar.");
  }
}

/* ---------- Compras y ventas (ganchos de Item Piles) ---------- */
/** Antes de cerrar un trato (lo procesa el DM): las tiendas solo compran lo que es de su rubro. */
function antesDeTratar(vendedor, cambiosVendedor, comprador, cambiosComprador, userId) {
  try {
    const T = infoTienda(tiendaDe(comprador));
    if (!T || !vendedor || tiendaDe(vendedor)) return;
    const ids = [...(cambiosVendedor?.itemsToDelete ?? []), ...(cambiosVendedor?.itemsToUpdate ?? [])].map(x => x?._id ?? x).filter(Boolean);
    const items = ids.map(id => vendedor.items.get(id)).filter(Boolean);
    const malos = items.filter(i => !T.compra.includes(i.type) || i.getFlag(MOD, "oficio"));
    if (!malos.length) return;
    ChatMessage.create({
      content: tarjeta(`🛒 ${T.nombre}`, [`${T.dueno.split(/[ ,(]/)[0]} no compra <b>${malos.map(i => i.name).join(", ")}</b>: no es de su rubro.${T.compra.length ? "" : " Aquí no se compran cosas usadas."}`], { clase: "ecos-trabajo" }),
      whisper: [userId], speaker: { alias: T.nombre }
    });
    return false;
  } catch (err) {
    console.error(`${MOD} |`, err);
  }
}

/** Después de un trato (en el cliente de quien compró o vendió): encargos, servicios y la tarjeta del chat. */
async function despuesDeTratar(vendedorUuid, compradorUuid, precios, userId) {
  if (userId !== game.user.id) return;
  try {
    const doc = x => ((typeof x === "string") ? fromUuidSync(x) : x);
    const vendedor = doc(vendedorUuid);
    const comprador = doc(compradorUuid);
    const T = infoTienda(tiendaDe(vendedor)) ?? infoTienda(tiendaDe(comprador));
    if (!T) return;
    const compra = !!tiendaDe(vendedor);
    const cliente = compra ? comprador : vendedor;
    if (!cliente) return;
    const entradas = precios?.buyerReceive ?? [];
    const L = [];
    const datos = oficioDe(cliente);
    let tocarDatos = false;
    for (const e of entradas) {
      const cat = e?.item?.flags?.[MOD]?.cat ?? (typeof e?.item?.getFlag === "function" ? e.item.getFlag(MOD, "cat") : null);
      const art = cat ? ARTICULOS.get(cat) : null;
      const q = Math.max(1, Number(e.quantity) || 1);
      L.push(`${compra ? "Compra" : "Vende"} <b>${e.name}</b>${q > 1 ? ` ×${q}` : ""}.`);
      if (!compra || !art) continue;
      if (art.enc) {
        const nombre = art.n.replace(/^Encargar:\s*/i, "");
        for (let i = 0; i < q; i++) datos.pedidos.push({ id: art.id, nombre, tienda: T.nombre, listo: datos.dia + art.enc });
        tocarDatos = true;
        L.push(`📝 Encargo apuntado: <b>${nombre}</b>. Estará listo el día ${datos.dia + art.enc} (dentro de ${art.enc} días) y te lo entregan al despertar.`);
      }
      if (art.srv === "secreto") {
        L.push("🤫 El tendero se inclina y le cuenta algo en voz muy baja.");
        await susurrarDM(`${T.nombre}: un secreto`, [`<b>${cliente.name}</b> compró «${art.n}»${q > 1 ? ` ×${q}` : ""}. Dale un secreto del valle (Tramas · 13 o 14, o la biografía de cualquier PNJ).`]);
      } else if (art.srv === "noche") {
        datos.noche = { nombre: art.n, bono: Number(art.bono) || 0, tienda: T.nombre };
        tocarDatos = true;
        L.push(`🛏 Esta noche duerme en <b>${art.n}</b>${art.bono ? `: mañana trabaja bien descansado (${signo(art.bono)} a la prueba de trabajo)` : ""}. Vale para su próximo Descanso Largo.`);
      } else if (art.srv) {
        const orden = Object.entries(datos.herramienta).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
        const objetivo = (art.srv === "reparar") ? orden[0] : orden.find(([, v]) => v === 1);
        if (objetivo) {
          datos.herramienta[objetivo[0]] = 0;
          tocarDatos = true;
          L.push(`🔧 Su herramienta de ${OFICIOS[objetivo[0]]?.nombre ?? objetivo[0]} queda <b>como nueva</b>.`);
        } else if ((art.srv === "afilar") && orden.length) {
          L.push("Su herramienta está rota: afilarla no alcanza, hay que repararla.");
        } else L.push("Sus herramientas ya estaban en buen estado.");
      }
    }
    if (tocarDatos) {
      await guardarOficio(cliente, datos);
      for (const k of Object.keys(datos.herramienta)) if (infoOficio(datos, k)) await actualizarRegistroHoja(cliente, datos, k);
    }
    const cobres = Math.round((Number(precios?.totalCurrencyCost) || 0) * 100);
    if (cobres > 0) L.push(`${compra ? "Paga" : "Recibe"} <b>${textoDinero(cobres)}</b>.`);
    L.unshift(`<i>${azar(T.saludos)}</i>`);
    await publicar(cliente, `🛒 ${T.nombre}`, L, { clase: "ecos-trabajo ecos-tienda" });
  } catch (err) {
    console.error(`${MOD} |`, err);
  }
}

/* ------------------------------------------------------------------ */
/*  Precios del valle: todos los objetos de compendio valen ÷10       */
/* ------------------------------------------------------------------ */

const TASA_CP = { pp: 1000, gp: 100, ep: 50, sp: 10, cp: 1 };
const escalaPrecios = () => Number(game.settings.get(MOD, "escalaPrecios") ?? 10) || 1;

/** ¿El objeto viene de un compendio del sistema o de un módulo (precios del manual)? Los hechos a mano no se tocan. */
function vieneDelManual(data) {
  const src = data?._stats?.compendiumSource ?? data?.flags?.core?.sourceId ?? "";
  if (typeof src === "string" && src.startsWith("Compendium.") && !src.startsWith("Compendium.world.")) return true;
  return !!data?.flags?.plutonium;
}

/** Cambios de precio para un objeto (datos en bruto) según la escala; null si no hay que tocarlo. */
function cambioPrecio(data, escala = escalaPrecios()) {
  const f = data?.flags?.[MOD] ?? {};
  if (f.cat || f.oficio) return null; // artículo del mercadillo o registro de oficio: precio propio
  const original = f.precioOriginal ?? (vieneDelManual(data) ? data.system?.price : null);
  if (!original || !(Number(original.value) > 0)) return null;
  if ((f.escala ?? 1) === escala) return null;
  const den = original.denomination || "gp";
  let price;
  if (escala > 1) {
    const cp = (Number(original.value) * (TASA_CP[den] ?? 100)) / escala;
    price = { value: Math.max(1, Math.round(cp)), denomination: "cp" };
  } else price = { value: Number(original.value), denomination: den };
  return {
    system: { price: { ...(data.system?.price ?? {}), ...price } },
    flags: { [MOD]: { escala, precioOriginal: { value: Number(original.value), denomination: den } } }
  };
}

/** Aplica la escala a todos los objetos del mundo y de los actores (lo hace el DM). Devuelve cuántos cambió. */
async function aplicarEscalaMundo() {
  if (!soyGM()) return 0;
  const escala = escalaPrecios();
  let n = 0;
  const sueltos = game.items.map(i => {
    const c = cambioPrecio(i.toObject(), escala);
    return c ? { _id: i.id, ...c } : null;
  }).filter(Boolean);
  if (sueltos.length) {
    await Item.updateDocuments(sueltos);
    n += sueltos.length;
  }
  for (const a of game.actors) {
    if (a.getFlag(MOD, "tienda")) continue;
    const cambios = a.items.map(i => {
      const c = cambioPrecio(i.toObject(), escala);
      return c ? { _id: i.id, ...c } : null;
    }).filter(Boolean);
    if (cambios.length) {
      await a.updateEmbeddedDocuments("Item", cambios);
      n += cambios.length;
    }
  }
  return n;
}

/* Los objetos nuevos (arrastrados de un compendio, importados o creados con un actor) entran con precio del valle. */
Hooks.on("preCreateItem", (item, data, options, userId) => {
  if ((userId !== game.user.id) || item.pack || (escalaPrecios() <= 1)) return;
  const c = cambioPrecio(item.toObject());
  if (c) item.updateSource(c);
});
Hooks.on("preCreateActor", (actor, data, options, userId) => {
  if ((userId !== game.user.id) || actor.pack) return;
  const cambios = {};
  if ((escalaPrecios() > 1) && actor._source.items?.length && !data.flags?.[MOD]?.tienda) {
    let toca = false;
    const items = actor._source.items.map(i => {
      const c = cambioPrecio(i);
      if (!c) return i;
      toca = true;
      return foundry.utils.mergeObject(foundry.utils.deepClone(i), c);
    });
    if (toca) cambios.items = items;
  }
  if ((actor.type === "character") && actor._source.system?.currency && !("soul" in actor._source.system.currency)) {
    cambios.system = { currency: { soul: 0 } };
  }
  if (!foundry.utils.isEmpty(cambios)) actor.updateSource(cambios);
});

/* ------------------------------------------------------------------ */
/*  Hoja del PJ: Prestigio editable y botones Trabajar / Mercado       */
/* ------------------------------------------------------------------ */

/** Fija el Prestigio de un PJ con un patrón (lo usan la hoja y las macros). */
async function fijarPrestigio(actor, patron, valor) {
  const d = oficioDe(actor);
  d.prestigio[patron] = Math.round(Number(valor) || 0);
  await guardarOficio(actor, d);
  for (const k of Object.keys(d.pericia)) if (infoOficio(d, k)?.patron === patron) await actualizarRegistroHoja(actor, d, k);
}

/** Patrones que se muestran en la hoja: los que tienen Prestigio y los de los oficios que practica. */
function patronesDeHoja(d) {
  const set = new Set(Object.keys(d.prestigio));
  for (const k of Object.keys(d.pericia)) {
    const p = infoOficio(d, k)?.patron;
    if (p) set.add(p);
  }
  return [...set];
}

function htmlPrestigioHoja(actor) {
  const d = oficioDe(actor);
  const gm = game.user.isGM;
  const filas = patronesDeHoja(d).map(k => {
    const v = d.prestigio[k] ?? 0;
    const rp = rangoPrestigio(v);
    const nombre = infoPatron(d, k).nombre;
    const valor = gm
      ? `<button type="button" class="ecos-pres-btn" data-patron="${k}" data-delta="-1" data-tooltip="−1">−</button><input type="number" class="ecos-pres-val" data-patron="${k}" value="${v}" step="1"><button type="button" class="ecos-pres-btn" data-patron="${k}" data-delta="1" data-tooltip="+1">+</button>`
      : `<b class="ecos-pres-num">${v}</b>`;
    return `<li data-tooltip="${rp.texto}"><span class="ecos-pres-nombre">${nombre}<br><small>${rp.nombre}</small></span><span class="ecos-pres-valor">${valor}</span></li>`;
  }).join("");
  const libres = Object.entries({ ...PATRONES, ...d.patronesExtra }).filter(([k]) => !patronesDeHoja(d).includes(k));
  const anadir = (gm && libres.length)
    ? `<select class="ecos-pres-nuevo"><option value="">＋ Patrón…</option>${libres.map(([k, p]) => `<option value="${k}">${p.nombre}</option>`).join("")}</select>`
    : "";
  const ofi = Object.entries(d.pericia).filter(([, xp]) => xp > 0).sort((a, b) => b[1] - a[1]).slice(0, 3)
    .map(([k, xp]) => `${infoOficio(d, k)?.nombre ?? k} · ${rangoPericia(xp).nombre}`).join("<br>");
  return `<section class="ecos-prestigio">
    <h4><i class="fa-solid fa-medal"></i> Prestigio</h4>
    ${filas ? `<ul>${filas}</ul>` : "<p class=\"ecos-nota\">Todavía nadie lo conoce en el pueblo.</p>"}
    ${anadir}
    ${ofi ? `<p class="ecos-pres-oficios">${ofi}</p>` : ""}
  </section>`;
}

/** Inserta el bloque de Prestigio en la barra lateral de la hoja y los botones en la cabecera. */
function decorarHojaPJ(app, html) {
  try {
    const actor = app?.document ?? app?.actor;
    if (!(actor instanceof Actor) || !esPJ(actor)) return;
    const raiz = (app.element instanceof HTMLElement) ? app.element : (app.element?.[0] ?? html?.[0] ?? html);
    if (!raiz?.querySelector) return;

    // Prestigio en la barra lateral (o al final de la hoja si no hay barra lateral)
    const lateral = raiz.querySelector(".sheet-body .sidebar, .sidebar");
    raiz.querySelectorAll(".ecos-prestigio").forEach(e => e.remove());
    const caja = document.createElement("div");
    caja.innerHTML = htmlPrestigioHoja(actor);
    const panel = caja.firstElementChild;
    if (lateral) lateral.insertBefore(panel, lateral.querySelector(".favorites") ?? null);
    else (raiz.querySelector(".window-content") ?? raiz).append(panel);
    if (game.user.isGM) {
      const cambiar = (k, v) => fijarPrestigio(actor, k, v).catch(err => console.error(`${MOD} |`, err));
      panel.querySelectorAll(".ecos-pres-btn").forEach(b => b.addEventListener("click", ev => {
        ev.preventDefault();
        ev.stopPropagation();
        const k = b.dataset.patron;
        cambiar(k, (oficioDe(actor).prestigio[k] ?? 0) + Number(b.dataset.delta));
      }));
      panel.querySelectorAll(".ecos-pres-val").forEach(i => {
        i.addEventListener("change", ev => {
          ev.stopPropagation();
          cambiar(i.dataset.patron, i.value);
        });
        i.addEventListener("keydown", ev => ev.stopPropagation());
      });
      panel.querySelector(".ecos-pres-nuevo")?.addEventListener("change", ev => {
        ev.stopPropagation();
        if (ev.target.value) cambiar(ev.target.value, 0);
      });
    }

    // Botones de la cabecera (solo quien maneja al PJ)
    if (!actor.isOwner) return;
    const cab = raiz.querySelector(".window-header");
    if (!cab || cab.querySelector(".ecos-trabajar")) return;
    const antes = cab.querySelector("[data-action=\"close\"], .close, [data-action=\"toggleControls\"]");
    const crear = (clase, icono, texto, ayuda, accion) => {
      const b = document.createElement((app.element instanceof HTMLElement) ? "button" : "a");
      if (b.tagName === "BUTTON") b.type = "button";
      b.className = `header-control ecos-cabecera ${clase}`;
      b.dataset.tooltip = ayuda;
      b.setAttribute("aria-label", ayuda);
      b.innerHTML = `<i class="fa-solid ${icono}"></i><span>${texto}</span>`;
      b.addEventListener("click", ev => {
        ev.preventDefault();
        ev.stopPropagation();
        accion().catch(err => console.error(`${MOD} |`, err));
      });
      b.addEventListener("pointerdown", ev => ev.stopPropagation());
      cab.insertBefore(b, antes ?? null);
    };
    crear("ecos-trabajar", "fa-hammer", "Trabajar", "Jornada de trabajo", () => dialogoJornada(actor));
    crear("ecos-mercado", "fa-store", "Mercado", "Mercadillo de Arcegris", () => abrirMercadillo(actor));
    crear("ecos-curar", "fa-kit-medical", "Curar", "Tratar heridas (Medicina, una vez por día por herido)", () => dialogoCurar(actor));
  } catch (err) {
    console.warn(`${MOD} | hoja del PJ`, err);
  }
}
Hooks.on("renderActorSheetV2", decorarHojaPJ);
Hooks.on("renderActorSheet", decorarHojaPJ);

/* El DM: «Curar» también en la hoja de los PNJ que saben (Nessa, Elira, Horton…) o llevan un kit. */
function decorarHojaPNJ(app, html) {
  try {
    const actor = app?.document ?? app?.actor;
    if (!game.user.isGM || !(actor instanceof Actor) || (actor.type !== "npc")) return;
    if (!competenteMedicina(actor) && !esNessa(actor) && !kitDeSanador(actor)) return;
    const raiz = (app.element instanceof HTMLElement) ? app.element : (app.element?.[0] ?? html?.[0] ?? html);
    const cab = raiz?.querySelector?.(".window-header");
    if (!cab || cab.querySelector(".ecos-curar")) return;
    const antes = cab.querySelector("[data-action=\"close\"], .close, [data-action=\"toggleControls\"]");
    const b = document.createElement((app.element instanceof HTMLElement) ? "button" : "a");
    if (b.tagName === "BUTTON") b.type = "button";
    b.className = "header-control ecos-cabecera ecos-curar";
    b.dataset.tooltip = "Tratar heridas (Medicina, una vez por día por herido)";
    b.innerHTML = "<i class=\"fa-solid fa-kit-medical\"></i><span>Curar</span>";
    b.addEventListener("click", ev => {
      ev.preventDefault();
      ev.stopPropagation();
      dialogoCurar(actor).catch(err => console.error(`${MOD} |`, err));
    });
    b.addEventListener("pointerdown", ev => ev.stopPropagation());
    cab.insertBefore(b, antes ?? null);
  } catch (err) {
    console.warn(`${MOD} | hoja del PNJ`, err);
  }
}
Hooks.on("renderActorSheetV2", decorarHojaPNJ);
Hooks.on("renderActorSheet", decorarHojaPNJ);

/* ------------------------------------------------------------------ */
/*  Clic en el ícono de Herida No Tratada del token (sube y baja)     */
/* ------------------------------------------------------------------ */

function clicHUD(event) {
  const el = event.target?.closest?.(".effect-control");
  if (!el || (el.dataset?.statusId !== "heridant")) return;
  const actor = canvas.hud?.token?.object?.actor;
  if (!actor) return;
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
  const n = nivelHNT(actor);
  const sube = (event.type === "click") && (event.button === 0);
  setHNT(actor, sube ? n + 1 : n - 1, diaHNT(actor)).then(() => canvas.hud?.token?.render());
}

/* ------------------------------------------------------------------ */
/*  Vestuario: el token cambia entre aspectos precargados ("ropa")      */
/*  Botón con una camisa en el HUD del token: clic = elegir, clic       */
/*  derecho = el siguiente. El DM carga los aspectos; el dueño elige.   */
/* ------------------------------------------------------------------ */
const escH = t => foundry.utils.escapeHTML ? foundry.utils.escapeHTML(String(t ?? "")) : String(t ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[c]);
const vestuarioDe = actor => foundry.utils.deepClone(actor?.getFlag(MOD, "vestuario") ?? []);

async function guardarVestuario(actor, lista) {
  await actor.update({ [`flags.${MOD}.vestuario`]: lista });
}

/** Pone un aspecto en el token (y en la ficha si el token está vinculado). */
async function ponerRopa(tokenDoc, ropa) {
  if (!tokenDoc?.isOwner || !ropa?.token) return;
  await tokenDoc.update({ "texture.src": ropa.token, [`flags.${MOD}.ropa`]: ropa.id });
  const actor = tokenDoc.actor;
  if (tokenDoc.actorLink && actor?.isOwner) {
    const upd = { "prototypeToken.texture.src": ropa.token };
    if (ropa.img) upd.img = ropa.img;
    await actor.update(upd);
  }
}

/** Añade un aspecto al vestuario de un actor (lo usan el DM y la API). La primera vez guarda también el aspecto original. */
async function anadirRopa(actor, { nombre, token, img } = {}) {
  if (!actor || !token) return null;
  const lista = vestuarioDe(actor);
  if (!lista.length) {
    const actual = actor.prototypeToken?.texture?.src;
    if (actual && (actual !== token)) lista.push({ id: foundry.utils.randomID(), nombre: "Original", token: actual, img: actor.img });
  }
  const ropa = { id: foundry.utils.randomID(), nombre: nombre || `Aspecto ${lista.length + 1}`, token, img: img || null };
  lista.push(ropa);
  await guardarVestuario(actor, lista);
  return ropa;
}

async function pedirTexto(titulo, valor = "") {
  const { DialogV2 } = foundry.applications.api;
  return DialogV2.prompt({
    window: { title: titulo },
    content: `<input type="text" name="texto" value="${escH(valor)}" autofocus style="width:100%">`,
    ok: { label: "Aceptar", callback: (ev, boton) => boton.form.elements.texto.value.trim() },
    rejectClose: false
  });
}

async function abrirVestuario(tokenDoc) {
  const actor = tokenDoc?.actor;
  if (!actor) return;
  const gm = game.user.isGM;
  const lista = vestuarioDe(actor);
  const actual = tokenDoc.getFlag(MOD, "ropa");
  const figuras = lista.map(r => `<figure class="ecos-ropa${(r.id === actual) || (!actual && (r.token === tokenDoc.texture.src)) ? " activa" : ""}" data-id="${r.id}">
    <img src="${escH(r.token)}" alt=""><figcaption>${escH(r.nombre)}</figcaption>${gm ? `<a class="ecos-ropa-quitar" data-quitar="${r.id}" data-tooltip="Quitar"><i class="fa-solid fa-xmark"></i></a>` : ""}</figure>`).join("");
  const contenido = `<div class="ecos-dialogo ecos-vestuario">
    ${lista.length ? `<div class="ecos-ropas">${figuras}</div>` : `<p class="ecos-vacio">${gm ? "Todavía no hay aspectos. Guarda el actual o añade imágenes." : "El DM todavía no le cargó aspectos a este personaje."}</p>`}
    ${gm ? `<div class="ecos-ropa-gm"><button type="button" data-ropa="actual"><i class="fa-solid fa-camera"></i> Guardar el aspecto actual</button><button type="button" data-ropa="archivo"><i class="fa-solid fa-folder-open"></i> Añadir imagen…</button></div>` : ""}
  </div>`;
  const { DialogV2 } = foundry.applications.api;
  let reabrir = false;
  await DialogV2.wait({
    window: { title: `Vestuario · ${tokenDoc.name}`, icon: "fa-solid fa-shirt" },
    content: contenido,
    buttons: [{ action: "cerrar", label: "Cerrar", default: true }],
    rejectClose: false,
    render: (event, dialogo) => {
      const raiz = dialogo.element ?? event?.target?.element;
      raiz?.querySelectorAll(".ecos-ropa").forEach(f => f.addEventListener("click", async ev => {
        if (ev.target.closest("[data-quitar]")) return;
        const ropa = lista.find(r => r.id === f.dataset.id);
        await ponerRopa(tokenDoc, ropa);
        dialogo.close();
      }));
      raiz?.querySelectorAll("[data-quitar]").forEach(a => a.addEventListener("click", async ev => {
        ev.stopPropagation();
        await guardarVestuario(actor, lista.filter(r => r.id !== a.dataset.quitar));
        reabrir = true;
        dialogo.close();
      }));
      raiz?.querySelector("[data-ropa=\"actual\"]")?.addEventListener("click", async () => {
        const nombre = await pedirTexto("Nombre del aspecto", "");
        if (nombre === null) return;
        await anadirRopa(actor, { nombre, token: tokenDoc.texture.src, img: actor.img });
        reabrir = true;
        dialogo.close();
      });
      raiz?.querySelector("[data-ropa=\"archivo\"]")?.addEventListener("click", () => {
        const FP = foundry.applications?.apps?.FilePicker?.implementation ?? globalThis.FilePicker;
        new FP({
          type: "imagevideo",
          current: tokenDoc.texture.src,
          callback: async ruta => {
            const nombre = await pedirTexto("Nombre del aspecto", ruta.split("/").pop().replace(/\.[^.]+$/, ""));
            if (nombre === null) return;
            await anadirRopa(actor, { nombre, token: ruta });
            reabrir = true;
            dialogo.close();
          }
        }).browse();
      });
    }
  });
  if (reabrir) return abrirVestuario(tokenDoc);
}

/** Clic derecho en el botón: el siguiente aspecto. */
async function siguienteRopa(tokenDoc) {
  const lista = vestuarioDe(tokenDoc?.actor);
  if (!lista.length) return abrirVestuario(tokenDoc);
  const actual = tokenDoc.getFlag(MOD, "ropa");
  let i = lista.findIndex(r => r.id === actual);
  if (i < 0) i = lista.findIndex(r => r.token === tokenDoc.texture.src);
  await ponerRopa(tokenDoc, lista[(i + 1) % lista.length]);
}

Hooks.on("renderTokenHUD", (hud, html) => {
  try {
    const raiz = (html instanceof HTMLElement) ? html : html?.[0];
    const tokenDoc = hud.document ?? hud.object?.document;
    if (!raiz || !tokenDoc?.isOwner || !tokenDoc.actor) return;
    if (!game.user.isGM && !vestuarioDe(tokenDoc.actor).length) return;
    const col = raiz.querySelector(".col.right") ?? raiz.querySelector(".right");
    if (!col || col.querySelector("[data-ecos-hud=\"vestuario\"]")) return;
    const b = document.createElement("button");
    b.type = "button";
    b.className = "control-icon";
    b.dataset.ecosHud = "vestuario";
    b.dataset.tooltip = "Vestuario (clic: elegir · clic derecho: el siguiente)";
    b.innerHTML = "<i class=\"fa-solid fa-shirt\"></i>";
    b.addEventListener("click", ev => {
      ev.preventDefault();
      ev.stopPropagation();
      abrirVestuario(tokenDoc).catch(err => console.error(`${MOD} | vestuario`, err));
    });
    b.addEventListener("contextmenu", ev => {
      ev.preventDefault();
      ev.stopPropagation();
      siguienteRopa(tokenDoc).catch(err => console.error(`${MOD} | vestuario`, err));
    });
    col.appendChild(b);
  } catch (err) {
    console.warn(`${MOD} | vestuario`, err);
  }
});

/* ------------------------------------------------------------------ */
/*  Panel de estados: los efectos del personaje arriba a la derecha     */
/*  (como Visual Active Effects, que no se puede bajar de su servidor)  */
/* ------------------------------------------------------------------ */
let PANEL_ESTADOS = null;
const textoPlano = h => String(h ?? "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();

function actorDelPanel() {
  const t = canvas?.tokens?.controlled?.[0];
  if (t?.actor?.isOwner) return t.actor;
  return game.user.isGM ? null : (game.user.character ?? null);
}

/** Distancia desde el borde derecho de la ventana hasta el borde izquierdo de la barra lateral (null si aún no está dibujada). */
function anclaPanel() {
  const sb = document.getElementById("sidebar")?.getBoundingClientRect();
  if (!sb || (sb.width < 20) || (sb.height < 50) || (sb.left > window.innerWidth - 20) || (sb.left < 100)) return null;
  return Math.max(8, Math.round(window.innerWidth - sb.left + 8));
}
let REINTENTOS_PANEL = 0;
let TIMER_PANEL = null;
function reintentarPanel() {
  if (TIMER_PANEL || (REINTENTOS_PANEL > 40)) return;
  REINTENTOS_PANEL++;
  TIMER_PANEL = setTimeout(() => {
    TIMER_PANEL = null;
    renderPanelEstados();
  }, 500);
}
let OBS_BARRA = null;
/** Si la barra lateral cambia de tamaño (se abre, se cierra o termina de cargar), el panel se vuelve a colocar. */
function vigilarBarraLateral() {
  REINTENTOS_PANEL = 0;
  const sb = document.getElementById("sidebar");
  if (!sb || (OBS_BARRA?.el === sb) || (typeof ResizeObserver !== "function")) return;
  OBS_BARRA?.obs?.disconnect();
  const obs = new ResizeObserver(() => renderPanelLuego());
  obs.observe(sb);
  OBS_BARRA = { el: sb, obs };
}

function renderPanelEstados() {
  try {
    const quitar = () => {
      PANEL_ESTADOS?.remove();
      PANEL_ESTADOS = null;
    };
    if (!game.settings.get(MOD, "panelEstados")) return quitar();
    const actor = actorDelPanel();
    const efs = actor ? [...(actor.appliedEffects ?? actor.effects ?? [])].filter(e => !e.disabled && !e.isSuppressed && e.name) : [];
    if (!efs.length) return quitar();
    if (!PANEL_ESTADOS) {
      PANEL_ESTADOS = document.createElement("div");
      PANEL_ESTADOS.id = "ecos-panel-estados";
      document.body.appendChild(PANEL_ESTADOS);
    }
    // Al conectarse la barra de la derecha todavía no tiene su tamaño: el panel espera escondido hasta que lo tenga.
    const derecha = anclaPanel();
    if (derecha === null) {
      PANEL_ESTADOS.style.visibility = "hidden";
      reintentarPanel();
    } else {
      PANEL_ESTADOS.style.visibility = "";
      PANEL_ESTADOS.style.right = `${derecha}px`;
      vigilarBarraLateral();
    }
    PANEL_ESTADOS.innerHTML = `<div class="ecos-panel-nombre">${escH(actor.name)}</div>` + efs.map(e => {
      const dur = e.duration?.label && !/^(none|ninguna?|—)$/i.test(e.duration.label) ? e.duration.label : "";
      const ayuda = [e.name, dur, textoPlano(e.description)].filter(Boolean).join(" · ");
      return `<div class="ecos-estado" data-tooltip="${escH(ayuda)}" data-tooltip-direction="LEFT">
        <img src="${escH(e.img || "icons/svg/aura.svg")}" alt=""><span>${escH(e.name)}${dur ? `<small>${escH(dur)}</small>` : ""}</span></div>`;
    }).join("");
  } catch (err) {
    console.warn(`${MOD} | panel de estados`, err);
  }
}
const renderPanelLuego = foundry.utils.debounce(renderPanelEstados, 150);
for (const h of ["controlToken", "createActiveEffect", "updateActiveEffect", "deleteActiveEffect", "updateActor", "updateWorldTime", "canvasReady", "collapseSidebar", "updateCombat",
  "renderSidebar", "changeSidebarTab"]) {
  Hooks.on(h, () => renderPanelLuego());
}
Hooks.once("ready", () => {
  for (const ms of [800, 2500, 6000]) setTimeout(() => renderPanelEstados(), ms);
});
window.addEventListener("resize", () => renderPanelLuego());

/* ------------------------------------------------------------------ */
/*  Registro                                                          */
/* ------------------------------------------------------------------ */

function registrarAjustes() {
  game.settings.register(MOD, "climaHoy", { scope: "world", config: false, type: Array, default: [] });
  game.settings.register(MOD, "santuario", {
    scope: "world", config: false, type: Boolean, default: true,
    onChange: v => {
      ui.controls?.render({ reset: true });
      if (!soyGM()) return;
      actualizarEstado();
      publicar(null, v ? "🏠 Los PJ están en un Santuario" : "🌲 Los PJ están a la intemperie", [
        (cfgDesc().regla !== "apagado")
          ? (v ? `El Descanso Largo cuenta como Descanso Largo: recupera ${LARGO_DG[cfgDesc().largo]} en Dados de Golpe (los PG vuelven gastándolos), conjuros y 1 de Agotamiento.`
            : `El Descanso Largo cuenta como Descanso Corto: no se recuperan espacios de conjuro, solo ${plural(cfgDesc().corto, "Dado de Golpe", "Dados de Golpe")}, y los heridos graves no se curan descansando.`)
          : (v ? "El Descanso Largo cuenta como Descanso Largo: recupera PG, hasta la mitad del nivel en Dados de Golpe, conjuros y 1 de Agotamiento."
            : "El Descanso Largo cuenta como Descanso Corto: no se recuperan Dados de Golpe ni espacios de conjuro, y los heridos graves no se curan descansando.")
      ], { clase: v ? "ecos-santuario" : "ecos-intemperie" });
    }
  });
  game.settings.register(MOD, "relojBarrera", {
    name: "Reloj de la Barrera", hint: "Solo para el DM. Sube solo cuando corresponde; puedes corregirlo aquí. Cada vez que sube, te susurra un parpadeo.",
    scope: "world", config: true, type: Number, default: 3, range: { min: 0, max: 10, step: 1 },
    onChange: v => avisoReloj(v)
  });
  game.settings.register(MOD, "danoManual", {
    name: "Contar el daño escrito en la hoja",
    hint: "Si está activo, bajar los PG de un PJ a mano en la hoja cuenta como golpe (golpe brutal incluido). Ojo: corregir un error a mano también contaría.",
    scope: "world", config: true, type: Boolean, default: false
  });
  game.settings.register(MOD, "efectosVisuales", {
    name: "Efectos visuales",
    hint: "Animaciones de Sequencer y JB2A al caer a 0, levantarse, quedar Estable, morir y con el Eco.",
    scope: "world", config: true, type: Boolean, default: true
  });
  game.settings.register(MOD, "autoSalvaciones", {
    name: "Salvaciones de muerte automáticas",
    hint: "Al inicio del turno de un PJ a 0 PG (y no estabilizado), el módulo tira su salvación de muerte.",
    scope: "world", config: true, type: Boolean, default: true
  });
  game.settings.register(MOD, "horarios", {
    name: "Horarios de las tiendas",
    hint: "A mano: cada tienda queda como la dejes (el DM la abre o la cierra desde la ventana del Mercadillo). Según la hora: usa el reloj del juego (Seasons & Stars).",
    scope: "world", config: true, type: String, default: "manual",
    choices: { manual: "A mano (el DM abre y cierra)", hora: "Según la hora del juego", abiertas: "Todas abiertas", cerradas: "Todas cerradas" },
    onChange: () => actualizarHorariosLuego()
  });
  game.settings.register(MOD, "estacion", {
    name: "Estación del año",
    hint: "Decide qué productos de temporada hay en las tiendas. Automática: la toma de Seasons & Stars.",
    scope: "world", config: true, type: String, default: "auto",
    choices: { auto: "Automática (calendario)", primavera: "Primavera", verano: "Verano", otono: "Otoño", invierno: "Invierno" },
    onChange: () => { if (soyGM()) reponerTiendas({ forzar: true }).catch(err => console.error(`${MOD} |`, err)); }
  });
  game.settings.register(MOD, "escalaPrecios", {
    name: "Precios del valle",
    hint: "Todo objeto que venga de un compendio (armas, armaduras, equipo, botín) vale esta fracción del precio del manual, para que la economía del pueblo y la venta de botín cuadren. Los objetos hechos a mano no se tocan. Al cambiarlo se recalcula todo.",
    scope: "world", config: true, type: Number, default: 10,
    choices: { 1: "Precio del manual", 5: "Manual ÷ 5", 10: "Manual ÷ 10 (recomendado)" },
    onChange: () => { if (soyGM()) aplicarEscalaMundo().then(n => ui.notifications.info(`Ecos de la frontera: ${n} precio(s) recalculado(s).`)).catch(err => console.error(`${MOD} |`, err)); }
  });
  game.settings.register(MOD, "mercado", { scope: "world", config: false, type: Object, default: {} });
  // Ya no se usa: las reglas de PJ van hoja por hoja (botón Ecos). Queda para la migración de la 2.7.2.
  game.settings.register(MOD, "carpetaPJ", { scope: "world", config: false, type: String, default: "Nimerios/Player" });
  game.settings.register(MOD, "hojasV272", { scope: "world", config: false, type: Boolean, default: false });
  game.settings.register(MOD, "anunciarDia", {
    name: "Aviso de cada día",
    hint: "Con el Calendario de Arcegris activo en Seasons & Stars, cada día nuevo aparece en el chat la fecha, la luna y las fiestas del día; al DM le llegan además sus notas.",
    scope: "world", config: true, type: Boolean, default: true
  });
  game.settings.register(MOD, "ultimoDia", { scope: "world", config: false, type: Number, default: -99999 });
  game.settings.register(MOD, "climaDiario", {
    name: "Clima de cada día",
    hint: "Con Simple Weather activo: cada día nuevo se genera el clima según la estación del Calendario de Arcegris (y sus efectos en la escena).",
    scope: "world", config: true, type: Boolean, default: true
  });
  game.settings.register(MOD, "panelEstados", {
    name: "Panel de estados",
    hint: "Muestra arriba a la derecha los estados de tu personaje (o del token que controlas) con su duración; al pasar el ratón, la descripción.",
    scope: "client", config: true, type: Boolean, default: true,
    onChange: () => renderPanelLuego()
  });
  game.settings.register(MOD, "tiradasOcultasPNJ", {
    name: "Tiradas ocultas de los PNJ",
    hint: "Las pruebas, salvaciones e iniciativa que tira el DM con un PNJ salen como tirada privada: los jugadores ven el dado rodar, no el número ni el bonificador. Si eliges otro modo de tirada en el chat, se respeta.",
    scope: "world", config: true, type: Boolean, default: true
  });
  game.settings.register(MOD, "migracion", { scope: "world", config: false, type: String, default: "" });
  game.settings.register(MOD, "contenido", { scope: "world", config: false, type: String, default: "" });
  // Configuración de otros módulos: qué receta (y versión) ya se aplicó, en el mundo y en cada cliente.
  game.settings.register(MOD, "modulosConfigurados", { scope: "world", config: false, type: Object, default: {} });
  game.settings.register(MOD, "clienteConfigurado", { scope: "client", config: false, type: Object, default: {} });
  game.settings.register(MOD, "conflictosIgnorados", { scope: "world", config: false, type: Array, default: [] });
  // Barra izquierda: grupos o herramientas que este usuario ocultó desde la Guía de la barra ("grupo" o "grupo.herramienta").
  game.settings.register(MOD, "barraOculta", { scope: "client", config: false, type: Array, default: [] });
  // Plantillas de combate, criaturas del sorteo y tablas por zona (las trae el contenido).
  game.settings.register(MOD, "encuentros", { scope: "world", config: false, type: Object, default: {} });
  // Copia de las fichas que el contenido rehízo (por si algo falla al crearlas de nuevo).
  game.settings.register(MOD, "respaldoFichas", { scope: "world", config: false, type: Object, default: {} });
  // Mega menú: barra compacta (solo lo fijado) y lo que cada usuario fijó ("grupo" o "grupo.herramienta").
  game.settings.register(MOD, "barraCompacta", { scope: "client", config: false, type: Boolean, default: true });
  game.settings.register(MOD, "barraFija", { scope: "client", config: false, type: Array, default: FIJOS_INICIALES });
  game.settings.register(MOD, "barraV27", { scope: "client", config: false, type: Boolean, default: false });
  game.settings.register(MOD, "barraV272", { scope: "client", config: false, type: Boolean, default: false });
  game.settings.register(MOD, "avisoDinero", {
    name: "Avisos de dinero",
    hint: "Cuando un PJ paga con lo que guarda en sus bolsos, o abre y cierra una tienda: un mensaje en el chat (solo lo ven el dueño y el DM), un cartel arriba de la pantalla o nada.",
    scope: "world", config: true, type: String, default: "chat",
    choices: { chat: "En el chat (recomendado)", cartel: "Cartel arriba de la pantalla", nada: "Sin aviso" }
  });
  game.settings.register(MOD, "descansos", {
    scope: "world", config: false, type: Object, default: { ...DESC_DEF },
    onChange: () => { for (const app of foundry.applications.instances?.values?.() ?? []) if ((app.document instanceof Actor) && app.rendered) app.render(); }
  });
  game.settings.registerMenu(MOD, "menuDescansos", {
    name: "Descansos y Dados de Golpe",
    label: "Ajustar los descansos",
    hint: "Descansar no devuelve PG: se recuperan gastando Dados de Golpe, con tope por descanso. Aquí eliges cuántos se recuperan, el tope, quién usa la regla y qué hojas la tienen.",
    icon: "fa-solid fa-bed-pulse", type: AjustesDescansos, restricted: true
  });
  game.settings.register(MOD, "climaActual", { scope: "world", config: false, type: Object, default: {} });
  game.settings.register(MOD, "climaVerbe", { scope: "world", config: false, type: Boolean, default: true });
  game.settings.register(MOD, "relojesMotivos", { scope: "world", config: false, type: Object, default: {}, onChange: () => refrescarRelojes() });
  game.settings.register(MOD, "sucesoDiario", {
    name: "Suceso del día",
    hint: "Cada día nuevo te llega en privado un suceso del valle (clima, pueblo, política o frontera) de la tabla del mes. Es color o gancho: no cambia el canon.",
    scope: "world", config: true, type: Boolean, default: true
  });
}

Hooks.once("init", () => {
  registrarAjustes();
  game.keybindings.register(MOD, "megaMenu", {
    name: "Abrir el Menú del DM (o el de los jugadores)",
    hint: "Todo el módulo y todos los botones de la barra izquierda, ordenados por uso y explicados.",
    editable: [{ key: "KeyM", modifiers: ["Shift"] }],
    onDown: () => {
      abrirMegaMenu();
      return true;
    }
  });

  const CT = CONFIG.DND5E.conditionTypes;
  CT.acechado = {
    name: "Acechado por la Muerte", img: `${RUTA}/icons/acechado.svg`,
    statuses: ["incapacitated"], riders: ["prone"], description: DESC.acechado
  };
  CT.malherido = { name: "Malherido", img: `${RUTA}/icons/malherido.svg`, description: DESC.malherido };
  CT.heridant = { name: "Herida No Tratada", img: `${RUTA}/icons/heridant.svg`, description: DESC.heridant };
  // Eco del Vorrh: cae pero se levanta en su turno; el cristal mudo lo anula.
  CT.ecosRecomponiendo = {
    name: "Eco: recomponiéndose", img: `${RUTA}/icons/vorrh.svg`, statuses: ["incapacitated"], riders: ["prone"],
    description: "<p>Cayó a 0 PG pero el Vorrh recuerda su forma: se levanta al inicio de su próximo turno con la mitad de sus PG.</p>"
  };
  CT.ecosAnulado = {
    name: "Anulado por cristal mudo", img: `${RUTA}/icons/cristal-mudo.svg`,
    description: "<p>El cristal mudo le cortó el eco: hasta el final del combate muere como cualquier criatura.</p>"
  };

  // Monedas Antiguas: una moneda más en la hoja, junto al platino, el oro, la plata y el cobre. No se cambia por otras.
  // (La clave es "soul" porque en la v1 se llamaban Soul coins: son la misma moneda.)
  if (CONFIG.DND5E.currencies) {
    CONFIG.DND5E.currencies.soul = { label: "Monedas Antiguas", abbreviation: "MA", conversion: 0, icon: `${RUTA}/icons/soul-coin.svg` };
  }
  // Idiomas: los del manual y uno propio, el Ilvarn (Mundo 4 · 6). Polyglot lo toma de aquí.
  const RAROS = CONFIG.DND5E.languages?.exotic?.children;
  if (RAROS && !RAROS.ilvarn) RAROS.ilvarn = "Ilvarn";

  // Agotamiento: −1 por nivel a las tiradas d20 y −1,5 m (5 pies) de velocidad por nivel.
  if (CT.exhaustion) CT.exhaustion.reduction = { ...(CT.exhaustion.reduction ?? {}), rolls: 1, speed: 5 };

  game.modules.get(MOD).api = {
    abrirRelojes, leerRelojes, moverReloj,
    setHNT, aplicarMalherido, tratarMalherido, modificarSecuela, sumarReloj, esPJ, abrirJornada,
    eco: actor => alDM({ accion: "eco", actorId: actor.id }),
    actualizarEstado: () => escribirEstado(),
    marcarPJ: (actor, valor = true) => actor.setFlag(MOD, "pj", valor),
    marcarResistente: (actor, valor = true) => actor.setFlag(MOD, "portador", valor),
    fijarPrestigio: (actor, patron, valor) => fijarPrestigio(actor, patron, valor),
    escalarPrecios: () => aplicarEscalaMundo(),
    paginaMercadillo: () => escribirPaginaMercadillo(),
    fijarPericia: async (actor, oficio, valor) => {
      const d = oficioDe(actor);
      if (!infoOficio(d, oficio)) return ui.notifications.warn(`No existe el oficio "${oficio}". Oficios: ${Object.keys(OFICIOS).join(", ")}.`);
      d.pericia[oficio] = Math.max(0, Number(valor) || 0);
      await guardarOficio(actor, d);
      await actualizarRegistroHoja(actor, d, oficio);
    },
    fijarDeuda: async (actor, valor) => {
      const d = oficioDe(actor);
      d.deuda = Math.max(0, Number(valor) || 0);
      await guardarOficio(actor, d);
    },
    fijarHerramienta: async (actor, oficio, estado = 0) => {
      const d = oficioDe(actor);
      d.herramienta[oficio] = Math.clamp(Number(estado) || 0, 0, 2);
      await guardarOficio(actor, d);
      await actualizarRegistroHoja(actor, d, oficio);
    },
    cancelarEncargo: async actor => {
      const d = oficioDe(actor);
      d.encargo = null;
      await guardarOficio(actor, d);
    },
    nuevoDia: actor => nuevoDiaPJ(actor),
    oficios: () => Object.fromEntries(Object.entries(OFICIOS).map(([k, o]) => [k, o.nombre])),
    patrones: () => Object.fromEntries(Object.entries(PATRONES).map(([k, o]) => [k, o.nombre])),
    mercadillo: () => abrirMercadillo(),
    abrirTienda: (id, comprador) => abrirTienda(id, comprador),
    montarMercadillo: () => montarMercadillo(),
    reponerTiendas: () => reponerTiendas({ forzar: true }),
    tiendas: () => Object.fromEntries(TIENDAS.map(t => [t.id, t.nombre])),
    aplicarContenido: (forzar = true, archivo = "contenido") => aplicarContenido({ forzar, archivo }),
    localizarTokens,
    calendario: CALENDARIO,
    activarCalendario,
    climaDelDia,
    arte: (actor, datos = {}) => aplicarArte(typeof actor === "string" ? buscarActorArte({ nombre: actor }) ?? game.actors.get(actor) : actor, { forzar: true, ...datos }),
    resolverArte,
    vestuario: actor => vestuarioDe(actor),
    anadirRopa: (actor, ropa) => anadirRopa(actor, ropa),
    abrirVestuario: tokenDoc => abrirVestuario(tokenDoc ?? canvas.tokens?.controlled?.[0]?.document),
    nombresPublicos,
    nombrePublico: a => nombrePublico(a),
    /** Vuelve a aplicar la receta de un módulo (o de todos, sin id): ecos.reconfigurar("healthEstimate") */
    reconfigurar: async id => {
      const hechos = foundry.utils.deepClone(game.settings.get(MOD, "modulosConfigurados") ?? {});
      if (id) delete hechos[id];
      await game.settings.set(MOD, "modulosConfigurados", id ? hechos : {});
      const L = await configurarModulos();
      await desactivarModulosPendientes();
      return L;
    },
    panelDM: tab => abrirPanelDM(tab),
    diaSiguiente: (confirmar = true) => diaSiguiente({ confirmar }),
    sinDormir: () => sinDormir().map(p => ({ nombre: p.actor.name, noches: p.dias, cd: p.cd })),
    rumor: () => sacarRumor(),
    encuentro: (zona, opciones = {}) => (zona ? sacarEncuentro(zona, opciones) : elegirZona().then(z => z?.zona && sacarEncuentro(z.zona, z))),
    armarPlantilla: (plantilla, zona, opciones = {}) => {
      const r = componerEncuentro({ zona, plantilla, ...opciones });
      return r ? publicarEncuentro({ zona, ...opciones, ...r }) : ui.notifications.warn("No se pudo armar esa plantilla para el grupo de hoy.");
    },
    megaMenu: () => abrirMegaMenu(),
    guiaBarra: () => abrirMegaMenu(),
    luzSegunHora: () => ponerOscuridad(oscuridadPorHora()),
    recetas: () => Object.fromEntries(CONFIG_MODULOS.map(r => [r.id, { version: r.v, activo: !!game.modules.get(r.id)?.active, ajustes: r.ajustes ?? {} }])),
    pantallaDM,
    anunciarDia: async () => {
      await game.settings.set(MOD, "ultimoDia", -99999);
      return anunciarDia();
    },
    soulCoins: actor => monedas(actor),
    monedas: actor => monedas(actor),
    darMonedas: (actor, n = 1) => anadirMonedaAntigua(actor, Number(n) || 0),
    revelarTienda: (id, si = true) => revelarTienda(id, si),
    visionSoul: actor => visionSoul(actor),
    abrirClima, fijarClima, climaVerbe, climaActual, leerClima,
    reglaDescanso, marcarDescanso, gastarDG: actor => abrirGastoDG(actor),
    abrirDescansos: () => new AjustesDescansos().render({ force: true }),
    abrirFunciones, funcionEncendida, ponerFuncion, naturalezasDelClima
  };
});

/* En la barra de Tokens, de Ecos queda un solo botón: el DM abre su menú (todo lo del módulo, explicado) y el jugador el suyo.
 * Lo demás (Santuario, clima, relojes, jornada, calendario, mercadillo, mega menú) vive dentro de esos menús. */
Hooks.on("getSceneControlButtons", controls => {
  const tokens = controls.tokens ?? controls.token;
  if (!tokens?.tools) return;
  tokens.tools.ecosPanel = {
    name: "ecosPanel",
    title: "Menú del DM: todo Ecos (día, clima, relojes, descansos, encuentros…), las hojas, toda la barra izquierda y los ajustes, cada botón explicado (Mayús+M)",
    icon: "fa-solid fa-mountain-sun",
    button: true,
    visible: game.user.isGM,
    order: 98,
    onChange: (event, active) => {
      if (active === false) return;
      abrirPanelDM();
    }
  };
  tokens.tools.ecosVerbe = {
    name: "ecosVerbe",
    title: "Verbe: usa tus técnicas sin abrir la hoja (token seleccionado o tu personaje)",
    icon: "fa-solid fa-droplet",
    button: true,
    visible: true,
    order: 97,
    onChange: (event, active) => {
      if (active === false) return;
      const actor = canvas.tokens?.controlled?.[0]?.actor ?? game.user.character;
      game.modules.get(MOD)?.api?.verbe?.usoRapido?.(actor);
    }
  };
  tokens.tools.ecosMenu = {
    name: "ecosMenu",
    title: "Ecos: jornada de trabajo, mercadillo, calendario y todos los botones de la barra, explicados (Mayús+M)",
    icon: "fa-solid fa-compass",
    button: true,
    visible: !game.user.isGM,
    order: 98,
    onChange: (event, active) => {
      if (active === false) return;
      abrirMenuJugador();
    }
  };
});

/* Datos iniciales de Malherido y Herida No Tratada; los PJ a 0 PG no quedan inconscientes ni muertos. */
Hooks.on("preCreateActiveEffect", (effect, data) => {
  const actor = effect.parent;
  if (!(actor instanceof Actor)) return;
  const st = effect.statuses;
  // Nunca dos copias del mismo estado propio.
  for (const id of ["acechado", "malherido", "heridant"]) {
    if (st.has(id) && actor.effects.some(e => (e.id !== effect.id) && e.statuses.has(id))) return false;
  }
  if (st.has("malherido") && !data.flags?.[MOD]?.init) {
    const nivel = nivelPJ(actor);
    effect.updateSource({
      name: nombreMalherido(0),
      changes: [{ key: "system.attributes.hp.tempmax", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: String(-nivel) }],
      flags: { [MOD]: { init: true, descansos: 0, nivelPJ: nivel, tratado: false } }
    });
  }
  if (st.has("heridant") && !data.flags?.[MOD]?.init) {
    effect.updateSource({ name: nombreHNT(1, 0), img: iconoHNT(1), flags: { [MOD]: { init: true, nivel: 1, dia: 0 } } });
  }
  if (!esPJ(actor) || (actor.system.attributes.hp.value > 0) || actor.getFlag(MOD, "muerto")) return;
  if ((effect.id === statusId("unconscious")) && !st.has("sleeping")) return false;
  if (effect.id === statusId("dead")) {
    if (game.user.isGM) ui.notifications.info(`Ecos de la frontera: ${actor.name} está Acechado, no muerto. Un PJ solo muere con Agotamiento 6 o con FUE, DES o CON en 0.`);
    return false;
  }
});

Hooks.on("preUpdateCombatant", (combatant, changes) => {
  const actor = combatant.actor;
  if ((changes.defeated === true) && esPJ(actor) && !actor.getFlag(MOD, "muerto")
    && (actor.system.attributes.hp.value <= 0)) delete changes.defeated;
});

/* Daño: golpe brutal, daño masivo y fallos por daño a 0 PG. */
Hooks.on("dnd5e.preApplyDamage", (actor, amount, updates) => {
  if (!esPJ(actor) || !(amount > 0)) return;
  const hp = actor.system.attributes.hp;
  const alHP = amount - Math.min(hp.temp ?? 0, amount);
  if (alHP <= 0) return;
  const max = hp.effectiveMax;
  const nuevo = updates["system.attributes.hp.value"] ?? hp.value;
  const golpe = { amount, alHP, hpAntes: hp.value };
  if (hp.value > 0) {
    golpe.brutal = (alHP * 2) >= max;
    if (nuevo <= 0) golpe.masivo = (alHP - hp.value) >= max;
  } else {
    golpe.aCero = true;
    golpe.masivo = alHP >= max;
    if (!golpe.masivo) {
      const f = (actor.system.attributes.death?.failure ?? 0) + 1;
      if (f >= 3) {
        updates["system.attributes.death.failure"] = 0;
        updates["system.attributes.death.success"] = 0;
        golpe.tresFallos = true;
      } else updates["system.attributes.death.failure"] = f;
      golpe.fallos = Math.min(f, 3);
    }
  }
  pendiente(actor).golpe = golpe;
});

/* Salvaciones de muerte: 3 éxitos levantan con 1 PG; 3 fallos dejan Secuela en vez de matar. */
Hooks.on("dnd5e.rollDeathSave", (rolls, details) => {
  const actor = details.subject;
  if (!esPJ(actor)) return;
  const death = actor.system.attributes.death;
  const roll = rolls[0];
  const exito = roll.total >= (roll.options?.target ?? 10);
  const p = pendiente(actor);
  const rep = p.repeticion;
  delete p.repeticion;
  const info = {
    antes: { s: death.success ?? 0, f: death.failure ?? 0 },
    total: roll.total, critico: !!roll.isCritical, pifia: !!roll.isFumble, exito, usados: rep?.usados ?? []
  };
  details.updates ??= {};
  if (exito) {
    if (roll.isCritical) info.levanta = true;
    else if ((death.success ?? 0) + 1 >= 3) {
      details.updates["system.attributes.hp.value"] = 1;
      info.levanta = true;
    }
  } else {
    const f = (death.failure ?? 0) + (roll.isFumble ? 2 : 1);
    if (f >= 3) {
      details.updates = { "system.attributes.death.failure": 0, "system.attributes.death.success": 0 };
      info.tresFallos = true;
    }
  }
  details.chatString = undefined;
  p.salvacion = info;
});

/* Tope de curación de Malherido y paso de datos al DM. */
Hooks.on("preUpdateActor", (actor, changes, options) => {
  if (!esPJ(actor)) return;
  const p = tomarPendiente(actor);
  if (p) options.ecos = p;
  const nuevo = foundry.utils.getProperty(changes, "system.attributes.hp.value");
  if (nuevo === undefined) return;
  const hp = actor.system.attributes.hp;

  // Daño escrito a mano en la hoja (opcional)
  if (!p?.golpe && !options.isRest && !options.ecosInterno && (hp.value > 0) && (nuevo < hp.value)
    && game.settings.get(MOD, "danoManual")) {
    const alHP = hp.value - Math.max(0, nuevo);
    options.ecos = { ...(options.ecos ?? {}), golpe: { amount: alHP, alHP, hpAntes: hp.value, brutal: (alHP * 2) >= hp.effectiveMax, manual: true } };
  }

  if (!actor.statuses.has("malherido")) return;
  const tope = topeMalherido(actor);
  if ((nuevo > hp.value) && (nuevo > tope)) {
    foundry.utils.setProperty(changes, "system.attributes.hp.value", Math.max(hp.value, tope));
    if (!options.ecosInterno) options.ecosTope = { pedido: nuevo, tope };
  }
});

Hooks.on("updateActor", (actor, changes, options) => {
  if (!soyGM() || !esPJ(actor)) return;
  actualizarEstado();
  if (foundry.utils.hasProperty(changes, `flags.${MOD}.oficio`)) sincronizarDescuentosLuego();
  procesarActualizacion(actor, changes, options).catch(err => console.error(`${MOD} |`, err));
});

for (const h of ["createActiveEffect", "updateActiveEffect", "deleteActiveEffect"]) {
  Hooks.on(h, effect => {
    const actor = effect.parent;
    if (!soyGM() || !(actor instanceof Actor) || !esPJ(actor)) return;
    actualizarEstado();
    if ((h === "deleteActiveEffect") && effect.statuses.has("dead") && actor.getFlag(MOD, "muerto")) {
      setTimeout(() => { if (!actor.statuses.has("dead")) actor.unsetFlag(MOD, "muerto"); }, 100);
      return;
    }
    if (effect.statuses.has("stable")) {
      if ((h === "createActiveEffect") && (actor.system.attributes.hp.value <= 0) && !actor.getFlag(MOD, "muerto")) {
        programarDespertar(actor).catch(err => console.error(`${MOD} |`, err));
      } else if ((h === "deleteActiveEffect") && actor.getFlag(MOD, "despertar")) {
        actor.unsetFlag(MOD, "despertar");
      }
    }
    setTimeout(() => revisarCaracteristicas(actor), 50);
  });
}

/* Descansos */
Hooks.on("dnd5e.preLongRest", (actor, config) => {
  if (!esPJ(actor) || config.ecos?.listo) return;
  dialogoDescansoLargo(actor, config).catch(err => console.error(`${MOD} |`, err));
  return false;
});

Hooks.on("dnd5e.restCompleted", (actor, result, config) => {
  if (!esPJ(actor)) return;
  // Descanso Largo en Santuario: convalecencia, tratamiento y nuevo día de trabajo (lo procesa el DM).
  if ((config?.type === "long") && config.ecos?.listo && config.ecos.santuario) {
    return alDM({ accion: "despuesDescanso", actorId: actor.id, cuenta: !!config.ecos.cuenta });
  }
  // Noche a la intemperie (cuenta como corto): también empieza un nuevo día de trabajo.
  if ((config?.type === "short") && config.ecos?.intemperie) return alDM({ accion: "nuevoDia", actorId: actor.id });
  // Descanso Corto normal: la pausa corta las horas seguidas de trabajo.
  if ((config?.type === "short") && actor.isOwner && actor.getFlag(MOD, "oficio")?.hoy?.seguidas) {
    actor.update({ [`flags.${MOD}.oficio.hoy.seguidas`]: 0 }).catch(err => console.error(`${MOD} |`, err));
  }
});

Hooks.on("dnd5e.preShortRest", (actor, config) => {
  if (!esPJ(actor) || enSantuario() || !heridoGrave(actor)) return;
  config.dialog = false;
  if (!config.ecos?.intemperie) {
    ui.notifications.warn(`${actor.name} está herido grave y fuera de un Santuario: no puede gastar Dados de Golpe.`);
  }
});

Hooks.on("dnd5e.preRollHitDieV2", config => {
  const actor = config.subject;
  if (!esPJ(actor) || enSantuario() || !heridoGrave(actor)) return;
  ui.notifications.warn(`${actor.name} está herido grave y fuera de un Santuario: no puede curarse con Dados de Golpe.`);
  return false;
});

/* Combate */
Hooks.on("createCombatant", combatant => {
  const actor = combatant.actor;
  if (soyGM() && esPJ(actor) && !actor.getFlag(MOD, "huboCombate")) actor.setFlag(MOD, "huboCombate", true);
});

Hooks.on("combatTurnChange", (combat, prior, current) => {
  if (!soyGM() || !game.settings.get(MOD, "autoSalvaciones")) return;
  const avanza = !prior || (current.round > prior.round) || ((current.round === prior.round) && (current.turn > prior.turn));
  if (!avanza) return;
  const c =(current?.combatantId ? combat.combatants.get(current.combatantId) : null) ?? combat.combatant;
  const actor = c?.actor;
  if (!esPJ(actor) || (actor.system.attributes.hp.value > 0)) return;
  if (actor.getFlag(MOD, "muerto") || actor.statuses.has("dead") || actor.statuses.has("stable")) return;
  actor.rollDeathSave({}, { configure: false }).catch(err => console.error(`${MOD} |`, err));
});

/* Botones de las tarjetas del chat */
Hooks.on("renderChatMessageHTML", (message, html) => {
  const caja = html.querySelector(".ecos-botones");
  if (!caja) return;
  const f = message.flags?.[MOD] ?? {};
  const t = f.tarjeta;
  if (t?.usada || f.usado) {
    const con = { esfuerzo: "Esfuerzo Excesivo" }[t?.usada] ?? "una Moneda Antigua";
    caja.innerHTML = `<p class="ecos-nota">${t?.usada ? `Repetida con ${con}.` : f.usado}</p>`;
    return;
  }
  const actorId = f.ref?.actorId ?? t?.actorId;
  const actor = game.actors.get(actorId);
  caja.querySelectorAll("[data-ecos-accion]").forEach(b => {
    const accion = b.dataset.ecosAccion;
    const permitido = b.dataset.soloDm ? game.user.isGM : (["repetir", "jornada", "vigilia"].includes(accion) ? !!actor?.isOwner : true);
    if (!permitido) return b.remove();
    b.addEventListener("click", ev => {
      ev.preventDefault();
      clicBotonChat(message, b, accion, actorId);
    });
  });
  if (!caja.querySelector("button")) caja.remove();
});

/* Tarjetas: [data-ecos-ficha] abre la ficha del actor (solo el DM la ve). */
Hooks.on("renderChatMessageHTML", (message, html) => {
  const links = html.querySelectorAll?.("[data-ecos-ficha]") ?? [];
  for (const el of links) {
    if (!game.user.isGM) {
      el.replaceWith(document.createTextNode(el.textContent.trim()));
      continue;
    }
    el.addEventListener("click", ev => {
      ev.preventDefault();
      ev.stopPropagation();
      fromUuid(el.dataset.ecosFicha).then(doc => {
        if (!doc) return ui.notifications.warn("Ecos de la frontera: esa ficha ya no existe.");
        return doc.sheet?.render(true);
      }).catch(err => {
        console.error(`${MOD} | abrir ficha`, err);
        ui.notifications.error("Ecos de la frontera: la ficha no se pudo abrir (detalle en la consola, F12).");
      });
    });
  }
});

function clicBotonChat(message, b, accion, actorId) {
  if (accion === "repetir") {
    b.closest(".ecos-botones")?.querySelectorAll("button[data-ecos-accion='repetir']").forEach(x => { x.disabled = true; });
    return alDM({ accion: "repetir", tipo: b.dataset.tipo, messageId: message.id, userId: game.user.id });
  }
  if (accion === "estabilizar") return intentarEstabilizar(actorId).catch(err => console.error(`${MOD} |`, err));
  if (accion === "vigilia") return tirarVigilia(message, b, actorId).catch(err => console.error(`${MOD} |`, err));
  if (accion === "jornada") {
    b.disabled = true;
    return jornadaDesdeTarjeta(message, actorId).catch(err => console.error(`${MOD} |`, err)).finally(() => { b.disabled = false; });
  }
  b.disabled = true;
  return alDM({ accion, actorId, messageId: message.id, userId: game.user.id });
}

/* Mercadillo: Item Piles avisa antes y después de cada compra o venta */
Hooks.on("item-piles-preTradeItems", (...args) => antesDeTratar(...args));
Hooks.on("item-piles-tradeItems", (vendedor, comprador, precios, userId) => {
  despuesDeTratar(vendedor, comprador, precios, userId).catch(err => console.error(`${MOD} |`, err));
});

/* ------------------------------------------------------------------ */
/*  Calendario de Arcegris (Seasons & Stars) y aviso de cada día       */
/* ------------------------------------------------------------------ */
Hooks.on("seasons-stars:registerExternalCalendars", ({ registerCalendar } = {}) => {
  try {
    registerCalendar?.(foundry.utils.deepClone(CALENDARIO), {
      type: "module", sourceName: "Ecos de la frontera", description: "Calendario del Valle de Arcegris", icon: "fa-solid fa-mountain-sun"
    });
  } catch (err) {
    console.error(`${MOD} | calendario`, err);
  }
});

/*
 * Seasons & Stars 0.26 ya no dispara «registerExternalCalendars» (solo carga sus calendarios y los paquetes
 * «seasons-and-stars-*»): sin esto el mundo volvía al gregoriano. Se carga el calendario directamente en su gestor
 * en el setup (en todos los clientes) y en el ready se activa si es el elegido. Además el DM guarda la copia
 * (activeCalendarData) que Seasons & Stars usa para activarlo solo al cargar.
 */
const FUENTE_CALENDARIO = { type: "module", sourceName: "Ecos de la frontera", description: "Calendario del Valle de Arcegris", icon: "fa-solid fa-mountain-sun" };
function cargarCalendarioSS() {
  try {
    const mgr = game.seasonsStars?.manager;
    if (!mgr?.loadCalendar || !mgr.calendars) return false;
    if (mgr.calendars.has(CALENDARIO.id)) return true;
    return !!mgr.loadCalendar(foundry.utils.deepClone(CALENDARIO), FUENTE_CALENDARIO);
  } catch (err) {
    console.error(`${MOD} | calendario`, err);
    return false;
  }
}
Hooks.once("setup", () => cargarCalendarioSS());
/**
 * Simple Weather 2.x sin un calendario que reconozca (Calendaria, Simple Calendar o Simple Calendar Reborn): su migración
 * de versiones viejas lanza un error en cada carga y el módulo no arranca. Aquí el calendario es Seasons & Stars, así que
 * se da la migración por hecha (no hay pronósticos viejos que convertir) y se apagan los pronósticos, que piden calendario.
 */
const CALENDARIOS_SW = ["calendaria", "foundryvtt-simple-calendar-reborn", "foundryvtt-simple-calendar"];
async function arreglarSimpleWeather() {
  const sw = game.modules.get("simple-weather");
  if (!sw?.active) return false;
  const gm = game.user ? game.user.isGM : ((game.data?.users ?? []).find(u => u._id === game.userId)?.role >= CONST.USER_ROLES.GAMEMASTER);
  if (!gm) return false;
  if (CALENDARIOS_SW.some(id => game.modules.get(id)?.active)) return false;
  const hay = k => game.settings.settings.has(`simple-weather.${k}`);
  let n = 0;
  if (hay("previousVersion") && (game.settings.get("simple-weather", "previousVersion") === "")) {
    await game.settings.set("simple-weather", "previousVersion", sw.version ?? "2.2.2");
    n++;
  }
  if (hay("useForecasts") && game.settings.get("simple-weather", "useForecasts")) {
    await game.settings.set("simple-weather", "useForecasts", false);
    n++;
  }
  if (n) console.log(`${MOD} | Simple Weather: migración marcada como hecha y pronósticos apagados (no hay calendario compatible).`);
  return n > 0;
}
Hooks.once("setup", () => {
  arreglarSimpleWeather().catch(err => console.warn(`${MOD} | simple-weather`, err));
});
async function asegurarCalendario() {
  if (!game.modules.get("seasons-and-stars")?.active) return false;
  for (let i = 0; (i < 40) && !cargarCalendarioSS(); i++) await new Promise(r => setTimeout(r, 250));
  const mgr = game.seasonsStars?.manager;
  if (!mgr?.calendars?.has?.(CALENDARIO.id)) return false;
  let elegido = null;
  try {
    elegido = game.settings.get("seasons-and-stars", "activeCalendar");
  } catch {
    elegido = null;
  }
  if (elegido !== CALENDARIO.id) return false;
  // Seasons & Stars termina su propio arranque en su ready: se le da un momento antes de corregirlo.
  for (let i = 0; (i < 20) && (mgr.activeCalendarId !== CALENDARIO.id); i++) await new Promise(r => setTimeout(r, 250));
  if (mgr.activeCalendarId !== CALENDARIO.id) await mgr.setActiveCalendar(CALENDARIO.id, false);
  if (game.user.isGM && (game.settings.get("seasons-and-stars", "activeCalendarData")?.id !== CALENDARIO.id)) {
    await game.settings.set("seasons-and-stars", "activeCalendarData", foundry.utils.deepClone(mgr.calendars.get(CALENDARIO.id)));
  }
  return mgr.activeCalendarId === CALENDARIO.id;
}
Hooks.on("seasons-stars:calendarChanged", d => {
  if (d?.newCalendarId === CALENDARIO.id) anunciarDiaLuego();
});

const calendarioArcegris = () => game.seasonsStars?.manager?.activeCalendarId === CALENDARIO.id;
const textoFecha = d => `${CALENDARIO.weekdays[d.weekday]?.name ?? ""} ${d.day} de ${CALENDARIO.months[d.month - 1]?.name.toLowerCase() ?? ""} del ${d.year} DF`;
const ID_TRAMAS = "SlqNI8OdXAjZZx8W"; // Tramas y secretos (el viejo Libro IV)
const paginaDM = clave => game.journal.get(ID_TRAMAS)?.pages.find(p => p.getFlag(MOD, "clave") === clave) ?? null;
/** El deshielo del valle: del 21 de marzo al 20 de abril. */
const enDeshielo = d => !!d && (((d.month === 3) && (d.day >= 21)) || ((d.month === 4) && (d.day <= 20)));
const enlace = (p, texto) => (p ? `@UUID[${p.uuid}]{${texto}}` : texto);

/** Fecha de hoy en el calendario de Arcegris ({year, month, day, weekday}) o null si no está activo. */
function hoyArcegris() {
  if (!calendarioArcegris()) return null;
  try {
    const d = game.seasonsStars?.api?.getCurrentDate?.();
    return (d && Number.isFinite(d.year)) ? { year: d.year, month: d.month, day: d.day, weekday: d.weekday } : null;
  } catch {
    return null;
  }
}

/** Cada día nuevo: la fecha y las fiestas en el chat (para todos) y las notas del DM (susurro). */
async function anunciarDia() {
  if (!soyGM() || !game.settings.get(MOD, "anunciarDia")) return;
  const d = hoyArcegris();
  if (!d) return;
  const n = diaCampana(d);
  const antes = game.settings.get(MOD, "ultimoDia");
  if (antes === n) return;
  await game.settings.set(MOD, "ultimoDia", n);
  if ((antes > -99999) && (n < antes)) return; // el DM atrasó el reloj: no se avisa
  const est = ahoraMundo().estacion;
  const luna = faseLunar(d);
  const lineas = [`Día ${n} de la campaña · ${{ primavera: "Primavera", verano: "Verano", otono: "Otoño", invierno: "Invierno" }[est] ?? ""} · ${luna.nombre}`];
  for (const { ev, dia, de } of eventosDelDia(d)) {
    lineas.push((dia === 1) ? `<b>${ev.name}</b>${de > 1 ? ` (${de} días)` : ""}. ${ev.description}` : `<b>${ev.name}</b> (día ${dia} de ${de}).`);
  }
  if (enDeshielo(d)) lineas.push("<b>Deshielo:</b> el río baja gris, los caminos son barro y el vado puede cerrarse con las crecidas.");
  if (d.weekday === 5) lineas.push("<b>Día de plaza:</b> mercado semanal en la plaza del fuerte.");
  if (d.weekday === 6) lineas.push("<b>Día de la Llama:</b> la capilla abre para todos.");
  const manana = eventosDelDia(sumarDias(d, 1)).filter(x => x.dia === 1);
  if (manana.length) lineas.push(`<i>Mañana: ${manana.map(x => x.ev.name).join(" · ")}.</i>`);
  await ChatMessage.create({
    content: tarjeta(`📅 ${textoFecha(d)}`, lineas, { clase: "ecos-dia" }),
    speaker: { alias: "Arcegris" },
    flags: { [MOD]: { dia: n } }
  });
  // Notas del DM: los detalles están en Tramas · 12 (fuera de los archivos públicos del módulo).
  const p18 = paginaDM("calendario-dm");
  const dm = [];
  if (eventosDelDia(d, { dm: true }).some(x => x.ev.visibility === "gm-only")) dm.push(`Hoy hay una fecha con secreto: ${enlace(p18, "Tramas · 12")}.`);
  if (luna.nueva) dm.push(`🌑 <b>Luna nueva</b> esta noche: mira los ganchos de la luna nueva en ${enlace(p18, "Tramas · 12")}.`);
  if (luna.llena) dm.push(`🌕 <b>Luna llena</b> esta noche: mira ${enlace(p18, "Tramas · 12")}.`);
  if ((d.day === 1) && (mesPrimerAno(d) >= 1) && (mesPrimerAno(d) <= 12)) {
    dm.push(`Empieza el <b>Mes ${mesPrimerAno(d)}</b> del ${enlace(paginaDM("calendario-ano") ?? game.journal.get(ID_TRAMAS)?.pages.get("XCGXDjuoM6m8s6FC"), "Calendario del primer año (Tramas · 11)")}.`);
  }
  if (dm.length) susurrarDM(`Notas del DM · ${textoFecha(d)}`, dm);
  await climaDelDia().catch(err => console.warn(`${MOD} | clima`, err));
  if (game.settings.get(MOD, "sucesoDiario")) await sacarSuceso()?.catch?.(err => console.warn(`${MOD} | suceso`, err));
}

/** Abre o cierra el calendario grande de Seasons & Stars (el botón suyo vive en el grupo de notas, que la barra compacta esconde). */
function abrirCalendario() {
  if (!game.modules.get("seasons-and-stars")?.active) return ui.notifications.warn("Ecos de la frontera: Seasons & Stars no está activo.");
  try {
    const SS = window.SeasonsStars;
    if (typeof SS?.widgets?.toggle === "function") return SS.widgets.toggle("main");
    if (typeof SS?.toggleWidget === "function") return SS.toggleWidget();
  } catch (err) {
    console.warn(`${MOD} | calendario`, err);
  }
  ui.notifications.warn("Ecos de la frontera: no pude abrir el calendario (prueba con el botón del calendario en Notas).");
}

/* ---------- Simple Weather: el clima del día según la estación del calendario ---------- */
const ESTACION_SW = { primavera: 0, verano: 1, otono: 2, invierno: 3 };
const appClima = () => {
  try {
    return [...(foundry.applications?.instances?.values?.() ?? [])].find(a => typeof a?.regenerateWeather === "function") ?? null;
  } catch {
    return null;
  }
};
async function climaDelDia() {
  if (!game.modules.get("simple-weather")?.active || !game.settings.get(MOD, "climaDiario")) return;
  const est = ESTACION_SW[ahoraMundo().estacion];
  const app = appClima();
  // En el deshielo el valle es frío y húmedo (nieve que se derrite, lluvia sobre nieve); el resto del año, templado.
  const [clima, humedad] = enDeshielo(hoyArcegris()) ? [0, 2] : [1, 1];
  for (const [k, v] of [["climate", clima], ["humidity", humedad]]) {
    if (game.settings.settings.has(`simple-weather.${k}`) && (game.settings.get("simple-weather", k) !== v)) await game.settings.set("simple-weather", k, v);
  }
  if (app) {
    app._currentClimate = clima;
    app._currentHumidity = humedad;
  }
  if (est !== undefined) {
    if (game.settings.get("simple-weather", "season") !== est) await game.settings.set("simple-weather", "season", est);
    if (game.settings.get("simple-weather", "seasonSync") !== false) await game.settings.set("simple-weather", "seasonSync", false);
    if (app) {
      app._currentSeason = est;
      app._currentSeasonSync = false;
    }
  }
  if (app) await app.regenerateWeather();
  else await game.keybindings?.actions?.get?.("simple-weather.regenerate")?.onDown?.({});
}
const anunciarDiaLuego = foundry.utils.debounce(() => anunciarDia().catch(err => console.error(`${MOD} | día`, err)), 1500);

/* Tiempo de juego: los PJ Estables despiertan solos */
Hooks.on("updateWorldTime", worldTime => {
  if (!soyGM()) return;
  actualizarHorariosLuego();
  anunciarDiaLuego();
  revisarDiaMercado().catch(err => console.error(`${MOD} |`, err));
  for (const a of game.actors.filter(esPJ)) {
    const d = a.getFlag(MOD, "despertar");
    if (!d) continue;
    actualizarEstado();
    if ((a.system.attributes.hp.value > 0) || !a.statuses.has("stable")) a.unsetFlag(MOD, "despertar");
    else if (worldTime >= d.en) despertar(a).catch(err => console.error(`${MOD} |`, err));
  }
});

/* Magia que cura heridas, detectada al usarse (en el cliente de quien la lanza) */
Hooks.on("dnd5e.postUseActivity", (activity, config, resultados) => {
  try {
    const item = activity?.item;
    const tipo = item ? tipoMagiaCurativa(item) : null;
    if (!tipo) return;
    let objetivos = Array.from(game.user.targets ?? []).map(t => t.actor).filter(Boolean);
    // Si no había tokens marcados, los objetivos que quedaron en la tarjeta del conjuro.
    if (!objetivos.length) {
      const enTarjeta = resultados?.message?.getFlag?.("dnd5e", "targets") ?? [];
      objetivos = enTarjeta.map(t => { try { return fromUuidSync(t.uuid); } catch { return null; } }).map(d => d?.actor ?? d).filter(d => d instanceof Actor);
    }
    if (!objetivos.length && ["manos", "keoghtom"].includes(tipo) && activity.actor) objetivos = [activity.actor];
    for (const a of objetivos) {
      if (!esPJ(a)) continue;
      const sirve = (tipo === "piedad") ? (a.system.attributes.hp.value <= 0) : ((nivelHNT(a) > 0) || malSinTratar(a));
      if (sirve) alDM({ accion: "magiaCura", actorId: a.id, tipo, de: activity.actor?.name ?? "Alguien", objeto: item.name });
    }
  } catch (err) {
    console.error(`${MOD} |`, err);
  }
});

/* ------------------------------------------------------------------ */
/* Contenido (data/contenido.txt): biografías, fichas y PNJ nuevos.    */
/* Lo aplica el DM al cargar el mundo, una vez por versión del archivo. */
/* El archivo va cifrado (gzip + xor + base64): la carpeta del módulo   */
/* la puede abrir cualquiera desde el navegador y lleva secretos.       */
/* ------------------------------------------------------------------ */
const PACK_FICHAS = "dnd5e.actors24";
const PACK_CLASES = "dnd5e.classes24";
const LLAVE_CONTENIDO = "ecos-frontera";

async function descifrarContenido(texto) {
  const bin = Uint8Array.from(atob(texto.trim()), c => c.charCodeAt(0));
  const k = new TextEncoder().encode(LLAVE_CONTENIDO);
  for (let i = 0; i < bin.length; i++) bin[i] ^= k[i % k.length] ^ (i & 0xff);
  const flujo = new Blob([bin]).stream().pipeThrough(new DecompressionStream("gzip"));
  return JSON.parse(await new Response(flujo).text());
}

/** Lee data/<archivo>.txt (cifrado); si no está, data/<archivo>.json (en claro, para pruebas). */
async function leerContenido(archivo = "contenido") {
  const r = await fetch(`${RUTA}/data/${archivo}.txt?v=${Date.now()}`, { cache: "no-store" });
  if (r.ok) return descifrarContenido(await r.text());
  const j = await fetch(`${RUTA}/data/${archivo}.json?v=${Date.now()}`, { cache: "no-store" });
  return j.ok ? j.json() : null;
}

/** Busca (o crea) una carpeta por su ruta: ["Nimerios", "NPC Valle Arcegris", "Comercio"]. Por defecto, de actores. */
async function carpetaActores(ruta, tipo = "Actor") {
  let padre = null;
  // Foundry no admite más de 4 niveles de carpetas: lo que sobre se queda en la última posible.
  for (const nombre of ruta.slice(0, CONST.FOLDER_MAX_DEPTH ?? 4)) {
    let f = game.folders.find(x => (x.type === tipo) && (x.name === nombre) && ((x.folder?.id ?? null) === (padre?.id ?? null)));
    if (!f) f = await Folder.create({ name: nombre, type: tipo, folder: padre?.id ?? null, sorting: "a" });
    padre = f;
  }
  return padre;
}

async function docCompendio(pack, id) {
  const p = game.packs.get(pack);
  if (!p || !id) return null;
  return p.getDocument(id);
}

/** Objetos que una ficha nueva no debe borrar: el registro de oficios, monedas, botín y la base del personaje. */
function objetoProtegido(it) {
  if (it.getFlag(MOD, "oficio")) return true;
  if (/monedas? antiguas?/i.test(it.name)) return true;
  return ["class", "subclass", "race", "background", "loot", "container", "backpack"].includes(it.type);
}

const sinId = d => {
  const o = (typeof d.toObject === "function") ? d.toObject() : foundry.utils.deepClone(d);
  delete o._id;
  return o;
};

/** Concede los rasgos de las mejoras "ItemGrant" de una clase, subclase o especie entre dos niveles. */
async function concederRasgos(actor, enActor, fuente, desde, hasta) {
  const datos = fuente.toObject();
  const tienen = new Set(actor.items.map(i => i._stats?.compendiumSource ?? i.flags?.core?.sourceId).filter(Boolean));
  const nombres = new Set(actor.items.map(i => i.name));
  const crear = [];
  for (const adv of datos.system?.advancement ?? []) {
    if (adv.type !== "ItemGrant") continue;
    const nivel = Number(adv.level ?? 0);
    if (!((nivel > desde) && (nivel <= hasta))) continue;
    for (const ref of adv.configuration?.items ?? []) {
      if (ref.optional || tienen.has(ref.uuid)) continue;
      const doc = await fromUuid(ref.uuid);
      if (!doc || nombres.has(doc.name)) continue;
      const d = sinId(doc);
      foundry.utils.setProperty(d, "_stats.compendiumSource", ref.uuid);
      foundry.utils.setProperty(d, "flags.dnd5e.advancementOrigin", `${enActor.id}.${adv._id}`);
      crear.push(d);
      tienen.add(ref.uuid);
    }
  }
  if (crear.length) await actor.createEmbeddedDocuments("Item", crear);
  return crear.length;
}

/** Puntos de golpe de la mejora HitPoints: máximo a nivel 1 y la media en los siguientes. */
function avancesConVida(advancement, hasta) {
  return (advancement ?? []).map(a => {
    if (a.type !== "HitPoints") return a;
    const value = { ...(a.value ?? {}) };
    for (let n = 1; n <= hasta; n++) value[n] ??= (n === 1) ? "max" : "avg";
    return { ...a, value };
  });
}

/** Da o sube una clase de un personaje: nivel, vida, rasgos, subclase, salvaciones y competencias. */
async function aplicarClase(actor, c) {
  const fuente = await docCompendio(PACK_CLASES, c.id);
  if (!fuente) return;
  const ident = fuente.system.identifier;
  let cls = actor.items.find(i => (i.type === "class") && (i.system.identifier === ident));
  const desde = Number(cls?.system.levels ?? 0);
  const hasta = Math.max(desde, Number(c.niveles) || 1);
  if (!cls) {
    const d = sinId(fuente);
    d.system.levels = hasta;
    d.system.advancement = avancesConVida(d.system.advancement, hasta);
    foundry.utils.setProperty(d, "_stats.compendiumSource", fuente.uuid);
    [cls] = await actor.createEmbeddedDocuments("Item", [d]);
    // Salvaciones y competencias del nivel 1 (las mejoras "Trait" que no tienen elección).
    const upd = {};
    const armas = new Set(actor.system.traits?.weaponProf?.value ?? []);
    const armaduras = new Set(actor.system.traits?.armorProf?.value ?? []);
    for (const adv of d.system.advancement ?? []) {
      if ((adv.type !== "Trait") || (Number(adv.level ?? 1) !== 1)) continue;
      for (const g of adv.configuration?.grants ?? []) {
        const [tipo, valor] = g.split(":");
        if (tipo === "saves") upd[`system.abilities.${valor}.proficient`] = 1;
        else if ((tipo === "weapon") && valor) armas.add(valor);
        else if ((tipo === "armor") && valor) armaduras.add(valor);
      }
    }
    upd["system.traits.weaponProf.value"] = [...armas];
    upd["system.traits.armorProf.value"] = [...armaduras];
    await actor.update(upd);
  } else if (desde < hasta) {
    await cls.update({ "system.levels": hasta, "system.advancement": avancesConVida(cls.toObject().system.advancement, hasta) });
  }
  await concederRasgos(actor, cls, fuente, desde, hasta);
  if (c.subclase && (hasta >= 3)) {
    let sub = actor.items.find(i => (i.type === "subclass") && (i.system.classIdentifier === ident));
    const fs = await docCompendio(PACK_CLASES, c.subclase);
    if (!sub && fs) {
      const d = sinId(fs);
      foundry.utils.setProperty(d, "_stats.compendiumSource", fs.uuid);
      [sub] = await actor.createEmbeddedDocuments("Item", [d]);
      await concederRasgos(actor, sub, fs, 0, hasta);
    } else if (sub && fs) await concederRasgos(actor, sub, fs, desde, hasta);
  }
}

/** Especie (raza) de un personaje que no tenía, con sus rasgos. */
async function aplicarEspecie(actor, ref) {
  const vieja = actor.items.find(i => i.type === "race");
  if (vieja && ref.reemplazar && (vieja._stats?.compendiumSource !== `Compendium.${ref.pack ?? "dnd5e.origins24"}.Item.${ref.id}`)) {
    // Quita la especie anterior y los rasgos que concedió.
    const suyos = actor.items.filter(i => String(i.getFlag("dnd5e", "advancementOrigin") ?? "").startsWith(`${vieja.id}.`)).map(i => i.id);
    await actor.deleteEmbeddedDocuments("Item", [vieja.id, ...suyos]);
  } else if (vieja) return;
  const fuente = await docCompendio(ref.pack ?? "dnd5e.origins24", ref.id);
  if (!fuente) return;
  const d = sinId(fuente);
  foundry.utils.setProperty(d, "_stats.compendiumSource", fuente.uuid);
  const [sp] = await actor.createEmbeddedDocuments("Item", [d]);
  await concederRasgos(actor, sp, fuente, -1, 20);
}

/** Objetos de compendio (armas, armaduras, herramientas, conjuros) que el actor todavía no tiene. */
async function anadirObjetos(actor, lista, { conjuros = false } = {}) {
  const tienen = new Set(actor.items.map(i => i._stats?.compendiumSource ?? i.flags?.core?.sourceId).filter(Boolean));
  const crear = [];
  for (const o of lista) {
    const pack = o.pack ?? (conjuros ? "dnd5e.spells24" : "dnd5e.equipment24");
    const doc = await docCompendio(pack, o.id);
    if (!doc || tienen.has(doc.uuid)) continue;
    const d = sinId(doc);
    foundry.utils.setProperty(d, "_stats.compendiumSource", doc.uuid);
    if (o.nombre) d.name = o.nombre;
    if (o.cantidad) d.system.quantity = o.cantidad;
    if (conjuros) {
      d.system.method = o.metodo ?? "spell";
      // Los trucos van siempre preparados (2), como los pone el sistema; el resto, preparado (1) o en el libro (0).
      d.system.prepared = (Number(d.system.level) === 0) ? 2 : (o.preparado === false ? 0 : 1);
      if (o.clase) d.system.sourceClass = o.clase;
    } else {
      if (o.equipar !== false) foundry.utils.setProperty(d, "system.equipped", true);
      if (["weapon", "equipment", "tool"].includes(d.type)) foundry.utils.setProperty(d, "system.proficient", 1);
    }
    crear.push(d);
    tienen.add(doc.uuid);
  }
  if (crear.length) await actor.createEmbeddedDocuments("Item", crear);
}

/** Cambia el nombre del actor, de su ficha de token y de los tokens vinculados que tenían el nombre viejo. */
async function renombrarActor(actor, nombre) {
  const viejo = actor.name;
  const ficha = nombrePublico(actor, nombre);
  await actor.update({ name: nombre, "prototypeToken.name": ficha });
  for (const s of game.scenes) {
    const cambios = s.tokens.filter(t => (t.actorId === actor.id) && t.actorLink && (t.name === viejo)).map(t => ({ _id: t.id, name: ficha }));
    if (cambios.length) await s.updateEmbeddedDocuments("Token", cambios);
  }
}

/*
 * Nombre que ven los jugadores en el token (al pasar el ratón, en el combate y en las tarjetas de midi).
 * El nombre del actor es para el DM y a veces lleva el secreto: "CR 2 · …", "(el intermediario)", "(falso Fat Renno)".
 */
const NOMBRE_PUBLICO = { ninguno: "Fat Renno", cambista: "Hombre del farol azul" };
const TOKEN_TIENDA_PUBLICO = { cambista: "La barcaza del farol azul" };
function nombrePublico(actor, nombre = actor.name) {
  const clave = actor.getFlag?.(MOD, "clave");
  if (clave && NOMBRE_PUBLICO[clave]) return NOMBRE_PUBLICO[clave];
  const tienda = actor.getFlag?.(MOD, "tienda");
  if (tienda && TOKEN_TIENDA_PUBLICO[tienda]) return TOKEN_TIENDA_PUBLICO[tienda];
  return String(nombre)
    .replace(/^CR\s*[^·]{1,6}·\s*/, "")
    .replace(/\s*\((plantilla|el intermediario|el escribano|prisionero|prisionera|uthodurn|mercado negro)\)\s*$/i, "")
    .trim() || nombre;
}

/** Pone a cada ficha su nombre público (sin VD ni secretos) y corrige los tokens ya puestos con el nombre viejo. */
async function nombresPublicos() {
  let n = 0;
  for (const a of game.actors) {
    if (a.hasPlayerOwner || esPJ(a)) continue;
    const viejo = a.prototypeToken?.name || a.name;
    // Se limpia el nombre que ya tiene el token (si el DM le puso uno a mano, se respeta).
    const nuevo = nombrePublico(a, viejo);
    if (!nuevo || (nuevo === viejo)) continue;
    await a.update({ "prototypeToken.name": nuevo });
    n++;
    for (const s of game.scenes) {
      const cambios = s.tokens.filter(t => (t.actorId === a.id) && ((t.name === viejo) || (t.name === a.name))).map(t => ({ _id: t.id, name: nuevo }));
      if (cambios.length) await s.updateEmbeddedDocuments("Token", cambios);
    }
  }
  return n;
}

/*
 * Tiradas ocultas de los PNJ: las pruebas, salvaciones, iniciativa y concentración que tira el DM con un PNJ
 * salen como tirada privada. Los jugadores ven el dado rodar (dado fantasma de Dice So Nice), no el número.
 * Los ataques y el daño los maneja midi-qol (ven el d20 y el total de daño, sin bonificadores).
 */
Hooks.on("dnd5e.preRollV2", (config, dialog, message) => {
  try {
    if (!game.user.isGM || !game.settings.get(MOD, "tiradasOcultasPNJ")) return;
    const tipos = config?.hookNames ?? [];
    if (tipos.includes("attack") || tipos.includes("damage") || tipos.includes("deathSave")) return;
    if (!tipos.includes("d20Test") && !tipos.includes("concentration")) return;
    const actor = (config.subject instanceof Actor) ? config.subject : config.subject?.actor;
    if (!actor || actor.hasPlayerOwner || esPJ(actor)) return;
    if (!message || (message.rollMode && (message.rollMode !== CONST.DICE_ROLL_MODES.PUBLIC))) return;
    if (game.settings.get("core", "rollMode") !== CONST.DICE_ROLL_MODES.PUBLIC) return;
    message.rollMode = CONST.DICE_ROLL_MODES.PRIVATE;
  } catch (err) {
    console.error(`${MOD} | tirada oculta`, err);
  }
});

/** Borra las carpetas de actores vacías que cuelgan de una ruta (de abajo hacia arriba). */
async function limpiarCarpetas(ruta) {
  let raiz = null;
  for (const nombre of ruta) {
    raiz = game.folders.find(x => (x.type === "Actor") && (x.name === nombre) && ((x.folder?.id ?? null) === (raiz?.id ?? null)));
    if (!raiz) return 0;
  }
  let n = 0;
  const vaciar = async f => {
    for (const h of game.folders.filter(x => (x.type === "Actor") && (x.folder?.id === f.id))) await vaciar(h);
    const conHijas = game.folders.some(x => x.folder?.id === f.id);
    if ((f !== raiz) && !conHijas && !f.contents.length) {
      await f.delete();
      n++;
    }
  };
  await vaciar(raiz);
  if (raiz.sorting !== "a") await raiz.update({ sorting: "a" });
  return n;
}

/** Un actor del archivo: lo crea o lo pone al día (ficha base, clases, objetos, ajustes y biografía). */
const SILUETA = "icons/svg/mystery-man.svg";

/**
 * Token de una ficha: campos del prototipo ({ displayName: 30, disposition: 1, … }) y, con escenas, los tokens ya puestos
 * de ese actor. Solo cambia lo que es distinto.
 */
async function aplicarPrototipo(actor, p) {
  const campos = p?.campos ?? {};
  const u = {};
  for (const [k, v] of Object.entries(campos)) {
    if (JSON.stringify(foundry.utils.getProperty(actor.prototypeToken, k)) !== JSON.stringify(v)) u[`prototypeToken.${k}`] = v;
  }
  if (!foundry.utils.isEmpty(u)) await actor.update(u);
  if (p.escenas === false) return;
  const enEscena = Object.entries(campos).filter(([k]) => !["randomImg", "actorLink"].includes(k));
  if (!enEscena.length) return;
  for (const s of game.scenes) {
    const cambios = [];
    for (const t of s.tokens) {
      if (t.actorId !== actor.id) continue;
      const c = { _id: t.id };
      for (const [k, v] of enEscena) {
        if (JSON.stringify(foundry.utils.getProperty(t, k)) !== JSON.stringify(v)) c[k] = v;
      }
      if (Object.keys(c).length > 1) cambios.push(c);
    }
    if (cambios.length) await s.updateEmbeddedDocuments("Token", cambios);
  }
}

async function aplicarActor(e, version) {
  let actor = e.id ? game.actors.get(e.id) : game.actors.find(a => a.getFlag(MOD, "clave") === e.clave);
  if (!actor && !e.clave) return null;
  const carpeta = e.carpeta ? await carpetaActores(e.carpeta) : null;
  const base = e.base ? await docCompendio(PACK_FICHAS, e.base) : null;
  let nuevo = false;
  if (!actor) {
    const data = base ? sinId(base) : { type: e.tipo ?? "npc", system: {} };
    delete data.folder;
    delete data.sort;
    Object.assign(data, { name: e.nombre, folder: carpeta?.id ?? null, ownership: { default: CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE } });
    // Sin arte propio, la silueta gris (el arte genérico del compendio trae imagen al azar y Tokenizer no la reemplaza bien).
    data.img = e.img ?? SILUETA;
    const ficha = e.token ?? e.img ?? SILUETA;
    data.prototypeToken = foundry.utils.mergeObject(data.prototypeToken ?? {}, {
      name: e.nombre, actorLink: !e.plantilla, displayName: CONST.TOKEN_DISPLAY_MODES.HOVER,
      disposition: e.disposicion ?? CONST.TOKEN_DISPOSITIONS.NEUTRAL,
      texture: { src: ficha }, randomImg: false
    }, { inplace: false });
    foundry.utils.setProperty(data, `flags.${MOD}.clave`, e.clave);
    foundry.utils.setProperty(data, "system.details.biography", { value: enlazar(e.bio ?? ""), public: "" });
    actor = await Actor.create(data);
    nuevo = true;
  } else if (base && (actor.type === "npc")) {
    const s = base.toObject().system;
    await actor.update({
      "system.abilities": s.abilities, "system.attributes": s.attributes, "system.skills": s.skills,
      "system.details.cr": s.details.cr, "system.details.type": s.details.type,
      "system.traits.size": s.traits.size, "system.traits.dr": s.traits.dr, "system.traits.di": s.traits.di,
      "system.traits.dv": s.traits.dv, "system.traits.ci": s.traits.ci,
      "system.resources": s.resources, "system.spells": s.spells, "system.bonuses": s.bonuses
    });
    const borrar = actor.items.filter(i => !objetoProtegido(i)).map(i => i.id);
    if (borrar.length) await actor.deleteEmbeddedDocuments("Item", borrar);
    const its = base.items.map(sinId);
    if (its.length) await actor.createEmbeddedDocuments("Item", its);
  }
  if (!actor) return null;
  if (carpeta && (actor.folder?.id !== carpeta.id)) await actor.update({ folder: carpeta.id });
  if (e.renombrar && (actor.name !== e.renombrar)) await renombrarActor(actor, e.renombrar);
  if (e.quitarObjetos?.length) {
    const fuera = actor.items.filter(i => e.quitarObjetos.includes(i.name) && !objetoProtegido(i)).map(i => i.id);
    if (fuera.length) await actor.deleteEmbeddedDocuments("Item", fuera);
  }
  for (const c of e.clases ?? []) await aplicarClase(actor, c);
  if (e.especie) await aplicarEspecie(actor, e.especie);
  if (e.objetos?.length) await anadirObjetos(actor, e.objetos);
  // Rasgos inventados (objetos ya armados): se agregan los que falten, por nombre.
  if (e.rasgos?.length) {
    const tienen = new Set(actor.items.map(i => i.name));
    const faltan = e.rasgos.filter(r => !tienen.has(r.name));
    if (faltan.length) await actor.createEmbeddedDocuments("Item", foundry.utils.deepClone(faltan));
  }
  if (e.conjuros?.length) await anadirObjetos(actor, e.conjuros, { conjuros: true });
  // Documentos de la campaña (cartas, sobres, registros): uno por clave, sin repetir.
  if (e.documentos?.length) {
    const tienen = new Set(actor.items.map(i => i.getFlag(MOD, "documento")).filter(Boolean));
    const faltan = e.documentos.filter(d => !tienen.has(d.flags?.[MOD]?.documento));
    if (faltan.length) await actor.createEmbeddedDocuments("Item", foundry.utils.deepClone(faltan));
    if (e.rehacerDocumentos) {
      const porClave = new Map(actor.items.filter(i => i.getFlag(MOD, "documento")).map(i => [i.getFlag(MOD, "documento"), i]));
      const cambios = e.documentos.map(d => {
        const it = porClave.get(d.flags?.[MOD]?.documento);
        const desc = d.system?.description?.value ?? "";
        if (!it || ((it.name === d.name) && ((it.system?.description?.value ?? "") === desc))) return null;
        return { _id: it.id, name: d.name, "system.description.value": desc };
      }).filter(Boolean);
      if (cambios.length) await actor.updateEmbeddedDocuments("Item", cambios);
    }
  }
  // Permisos: { idDeUsuario: nivel } — solo los sube (un PJ que conoce a alguien pasa a Limitado), nunca los baja.
  if (e.permisos && Object.keys(e.permisos).length) {
    const own = foundry.utils.deepClone(actor.ownership ?? {});
    let cambia = false;
    for (const [u, n] of Object.entries(e.permisos)) {
      if (!game.users.get(u) && (u !== "default")) continue;
      if ((own[u] ?? -1) < n) {
        own[u] = n;
        cambia = true;
      }
    }
    if (cambia) await actor.update({ ownership: own });
  }
  // Malherido tratado, una sola vez: { marca } (y lo sube hasta el tope nuevo).
  if (e.tratar?.marca && !(actor.getFlag(MOD, "sumas") ?? []).includes(e.tratar.marca)) {
    await tratarMalherido(actor, { curar: true });
    await actor.update({ [`flags.${MOD}.sumas`]: [...(actor.getFlag(MOD, "sumas") ?? []), e.tratar.marca] });
  }
  // Sumas de una sola vez (una Moneda Antigua por la sesión): { marca, sistema: { "currency.soul": 1 } }.
  if (e.sumar?.marca && !(actor.getFlag(MOD, "sumas") ?? []).includes(e.sumar.marca)) {
    const u = {};
    for (const [k, v] of Object.entries(e.sumar.sistema ?? {})) u[`system.${k}`] = (Number(foundry.utils.getProperty(actor, `system.${k}`)) || 0) + Number(v);
    u[`flags.${MOD}.sumas`] = [...(actor.getFlag(MOD, "sumas") ?? []), e.sumar.marca];
    await actor.update(u);
  }
  if (e.prepararTrucos) {
    const trucos = actor.items.filter(i => (i.type === "spell") && (Number(i.system.level) === 0) && (i.system.method === "spell") && (i.system.prepared !== 2));
    if (trucos.length) await actor.updateEmbeddedDocuments("Item", trucos.map(i => ({ _id: i.id, "system.prepared": 2 })));
  }
  if (e.enLibro?.length) {
    // Conjuros que quedan en el libro sin preparar (para no pasar del límite de preparados).
    const libro = actor.items.filter(i => (i.type === "spell") && (i.system.prepared === 1)
      && e.enLibro.some(id => String(i._stats?.compendiumSource ?? "").endsWith(`.${id}`)));
    if (libro.length) await actor.updateEmbeddedDocuments("Item", libro.map(i => ({ _id: i.id, "system.prepared": 0 })));
  }
  const upd = {};
  for (const [k, v] of Object.entries(e.sistema ?? {})) upd[`system.${k}`] = v;
  if (e.bio !== undefined) upd["system.details.biography.value"] = enlazar(e.bio);
  for (const [k, v] of Object.entries(e.banderas ?? {})) upd[`flags.${MOD}.${k}`] = v;
  upd[`flags.${MOD}.contenido`] = version;
  await actor.update(upd);
  if (e.prototipo) await aplicarPrototipo(actor, e.prototipo);
  // Cambios sueltos en la biografía que ya tiene y una sección nueva al final (una sola vez, por marca).
  if (e.bioCambios?.length || e.bioAnexo) {
    const actual = actor.system.details?.biography?.value ?? "";
    let nueva = cambiarTexto(actual, e.bioCambios ?? []);
    if (e.bioAnexo?.html && !(e.bioAnexo.marca && nueva.includes(e.bioAnexo.marca))) nueva = `${nueva}\n${enlazar(e.bioAnexo.html)}`;
    if (nueva !== actual) await actor.update({ "system.details.biography.value": nueva });
  }
  // Idiomas que se suman a los que ya sabe (claves de CONFIG.DND5E.languages: "sylvan", "ilvarn"…).
  if (e.idiomas?.length) {
    const ya = new Set(actor.system.traits?.languages?.value ?? []);
    const faltan = e.idiomas.filter(l => !ya.has(l));
    if (faltan.length) await actor.update({ "system.traits.languages.value": [...ya, ...faltan] });
  }
  return { actor, nuevo };
}

/**
 * Cambios de texto: { buscar, poner } (la primera vez que aparece; con ultima, la última; con todas, todas)
 * o { regex, flags, poner } (expresión regular; "g" por defecto).
 */
function cambiarTexto(texto, cambios) {
  let nuevo = String(texto ?? "");
  for (const c of cambios ?? []) {
    const poner = enlazar(c.poner ?? "");
    if (c.regex) {
      nuevo = nuevo.replace(new RegExp(c.regex, c.flags ?? "g"), poner);
      continue;
    }
    if (!c.buscar) continue;
    if (c.todas) {
      nuevo = nuevo.split(c.buscar).join(poner);
      continue;
    }
    const i = c.ultima ? nuevo.lastIndexOf(c.buscar) : nuevo.indexOf(c.buscar);
    if (i < 0) continue;
    nuevo = nuevo.slice(0, i) + poner + nuevo.slice(i + c.buscar.length);
  }
  return nuevo;
}

/** Diario por id o por clave del módulo ("clave:guia"). */
function diarioDe(ref) {
  const r = String(ref ?? "");
  if (r.startsWith("clave:")) return game.journal.find(j => j.getFlag(MOD, "clave") === r.slice(6)) ?? null;
  return game.journal.get(r) ?? null;
}

/** Carpeta por id o por clave del módulo ("clave:campana"). */
const carpetaPorClave = c => game.folders.find(f => f.getFlag?.(MOD, "clave") === c) ?? null;
/** La carpeta madre de una carpeta del contenido: id, «clave:x» o nada (raíz). */
const carpetaMadre = p => ((typeof p === "string") && p.startsWith("clave:")) ? (carpetaPorClave(p.slice(6))?.id ?? null) : (p ?? null);
function carpetaDe(ref) {
  const r = String(ref ?? "");
  return r.startsWith("clave:") ? carpetaPorClave(r.slice(6)) : (game.folders.get(r) ?? null);
}

/** Permisos de un diario: el nivel por defecto y, si se sube, nadie queda por debajo (salvo quien ya tenía más). */
function permisosDiario(actual, nivel) {
  const own = foundry.utils.deepClone(actual ?? {});
  own.default = nivel;
  for (const [u, v] of Object.entries(own)) {
    if ((u === "default") || game.users.get(u)?.isGM) continue;
    if ((v >= 0) && (v < nivel)) own[u] = nivel;
  }
  return own;
}

/**
 * Diarios del contenido. Con clave: se crean una vez (si ya existen, se respeta lo que el DM haya cambiado).
 * Con id: un diario que ya existe se renombra, se mueve de carpeta, se reordena o cambia de permisos.
 */
async function aplicarDiarios(lista) {
  let n = 0;
  for (const d of lista ?? []) {
    if (d.id) {
      const j = game.journal.get(d.id);
      if (!j) continue;
      const u = {};
      if (d.nombre && (j.name !== d.nombre)) u.name = d.nombre;
      if (d.carpeta !== undefined) {
        const c = d.carpeta ? carpetaDe(d.carpeta) : null;
        if ((c || !d.carpeta) && ((j.folder?.id ?? null) !== (c?.id ?? null))) u.folder = c?.id ?? null;
      }
      if ((d.orden !== undefined) && (j.sort !== d.orden)) u.sort = d.orden;
      if (d.propietario !== undefined) {
        const own = permisosDiario(j.ownership, d.propietario);
        if (JSON.stringify(own) !== JSON.stringify(j.ownership)) u.ownership = own;
      }
      if (d.clave && (j.getFlag(MOD, "clave") !== d.clave)) u[`flags.${MOD}.clave`] = d.clave;
      if (!foundry.utils.isEmpty(u)) {
        await j.update(u);
        n++;
      }
      continue;
    }
    if (diarioDe(`clave:${d.clave}`)) continue;
    const carpeta = d.carpeta ? carpetaDe(d.carpeta) : null;
    await JournalEntry.create({
      name: d.nombre, folder: carpeta?.id ?? null, sort: d.orden ?? 0,
      ownership: { default: d.propietario ?? CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE, ...(d.permisos ?? {}) },
      flags: { [MOD]: { clave: d.clave } }
    });
    n++;
  }
  return n;
}

/**
 * Orden del mundo: carpetas (renombrar, mover, crear), documentos a otra carpeta y escenas fuera o dentro
 * de la barra de navegación. Todo es reversible a mano.
 */
async function aplicarOrden(o = {}) {
  const hechos = { carpetas: 0, movidos: 0, navegacion: 0 };
  for (const f of o.carpetas ?? []) {
    let folder = f.id ? game.folders.get(f.id) : (f.clave ? carpetaPorClave(f.clave) : null);
    if (!folder && f.ruta) folder = await carpetaActores(f.ruta, f.tipo ?? "Actor");
    if (!folder && f.clave) {
      folder = await Folder.create({ name: f.nombre ?? f.clave, type: f.tipo ?? "JournalEntry", folder: carpetaMadre(f.padre),
        sorting: f.sorting ?? "a", sort: f.orden ?? 0, color: f.color ?? null, flags: { [MOD]: { clave: f.clave } } });
      hechos.carpetas++;
      continue;
    }
    if (!folder) continue;
    const u = {};
    if (f.nombre && (folder.name !== f.nombre)) u.name = f.nombre;
    if ((f.padre !== undefined) && ((folder.folder?.id ?? null) !== carpetaMadre(f.padre))) u.folder = carpetaMadre(f.padre);
    if (f.ponerClave && (folder.getFlag?.(MOD, "clave") !== f.ponerClave)) u[`flags.${MOD}.clave`] = f.ponerClave;
    if ((f.color !== undefined) && (folder.color !== f.color)) u.color = f.color;
    if ((f.orden !== undefined) && (folder.sort !== f.orden)) u.sort = f.orden;
    if (f.sorting && (folder.sorting !== f.sorting)) u.sorting = f.sorting;
    if (!foundry.utils.isEmpty(u)) {
      await folder.update(u);
      hechos.carpetas++;
    }
  }
  for (const m of o.mover ?? []) {
    const doc = fromUuidSync(m.uuid);
    if (!doc || doc.pack) continue;
    const destino = m.ruta ? await carpetaActores(m.ruta, doc.documentName) : (m.carpeta ? carpetaDe(m.carpeta) : null);
    if ((m.ruta || m.carpeta) && !destino) continue;
    if ((doc.folder?.id ?? null) === (destino?.id ?? null)) continue;
    await doc.update({ folder: destino?.id ?? null });
    hechos.movidos++;
  }
  const nav = o.navegacion ?? {};
  const cambios = [
    ...(nav.fuera ?? []).map(id => game.scenes.get(id)).filter(sc => sc?.navigation && !sc.active).map(sc => ({ _id: sc.id, navigation: false })),
    ...(nav.dentro ?? []).map(id => game.scenes.get(id)).filter(sc => sc && !sc.navigation).map(sc => ({ _id: sc.id, navigation: true }))
  ];
  if (cambios.length) {
    await Scene.updateDocuments(cambios);
    hechos.navegacion = cambios.length;
  }
  return hechos;
}

/**
 * Páginas de diario: crear, reemplazar, añadir una sección al final ("anexar") o cambiar trozos
 * ("editar": lista de { buscar, poner, ultima }). Anexar y editar se hacen una sola vez (por marca).
 */
async function aplicarPaginas(paginas) {
  let n = 0;
  for (const p of paginas) {
    const j = diarioDe(p.diario);
    if (!j) continue;
    let page = p.pagina ? j.pages.get(p.pagina) : null;
    if ((p.modo === "borrar") || (p.modo === "renombrar")) {
      page ??= p.clave ? j.pages.find(x => x.getFlag(MOD, "clave") === p.clave) : null;
      if (!page) continue;
      if (p.modo === "borrar") await page.delete();
      else {
        const u = {};
        if (p.nombre && (page.name !== p.nombre)) u.name = p.nombre;
        if ((p.orden !== undefined) && (page.sort !== p.orden)) u.sort = p.orden;
        if (foundry.utils.isEmpty(u)) continue;
        await page.update(u);
      }
      n++;
      continue;
    }
    page ??= j.pages.find(x => (p.clave && (x.getFlag(MOD, "clave") === p.clave)) || (x.name === p.nombre));
    if ((p.modo === "anexar") || (p.modo === "editar")) {
      if (!page) continue;
      const actual = page.text?.content ?? "";
      if (p.marca && actual.includes(p.marca)) continue;
      const nuevo = (p.modo === "anexar") ? `${actual}\n${enlazar(p.html)}` : cambiarTexto(actual, p.cambios);
      if (nuevo === actual) continue;
      await page.update({ "text.content": nuevo });
    } else if (page) {
      await page.update({ name: p.nombre ?? page.name, "text.content": enlazar(p.html), ...(p.orden !== undefined ? { sort: p.orden } : {}) });
    } else {
      const sort = p.orden ?? (Math.max(0, ...j.pages.map(x => x.sort)) + 100);
      await j.createEmbeddedDocuments("JournalEntryPage", [{ name: p.nombre, type: "text", text: { content: enlazar(p.html), format: 1 }, sort, flags: { [MOD]: { clave: p.clave ?? null } } }]);
    }
    n++;
  }
  return n;
}

/**
 * Referencias: cambios de texto (expresiones regulares) en todas las páginas de unos diarios y en las biografías
 * de todos los actores. Sirve para que los enlaces y los «Libro IV · 20» viejos apunten a las páginas nuevas.
 */
async function aplicarReferencias(R = {}) {
  const cambios = R.cambios ?? [];
  if (!cambios.length) return 0;
  let n = 0;
  for (const ref of R.diarios ?? []) {
    const j = diarioDe(ref);
    if (!j) continue;
    const upd = [];
    for (const p of j.pages) {
      const c = p.text?.content;
      if (!c) continue;
      const nuevo = cambiarTexto(c, cambios);
      if (nuevo !== c) upd.push({ _id: p.id, "text.content": nuevo });
    }
    if (upd.length) {
      await j.updateEmbeddedDocuments("JournalEntryPage", upd);
      n += upd.length;
    }
  }
  if (R.actores) {
    const upd = [];
    for (const a of game.actors) {
      const b = a.system?.details?.biography;
      if (!b) continue;
      const u = { _id: a.id };
      for (const campo of ["value", "public"]) {
        const c = b[campo];
        if (!c) continue;
        const nuevo = cambiarTexto(c, cambios);
        if (nuevo !== c) u[`system.details.biography.${campo}`] = nuevo;
      }
      if (Object.keys(u).length > 1) upd.push(u);
    }
    for (let i = 0; i < upd.length; i += 50) await Actor.updateDocuments(upd.slice(i, i + 50));
    n += upd.length;
  }
  return n;
}

/** Diarios y carpetas que el contenido retira (ya integrados en otro lado). Las carpetas, solo si quedan vacías. */
async function aplicarBorrado(B = {}) {
  const ids = (B.diarios ?? []).filter(id => game.journal.get(id));
  if (ids.length) await JournalEntry.deleteDocuments(ids);
  let carpetas = 0;
  // Se cuenta a mano (el árbol de carpetas de Foundry se rehace más tarde).
  const dentro = f => game.folders.filter(x => x.folder?.id === f.id).length
    + ((f.documentCollection ?? game.collections.get(f.type))?.filter(d => d.folder?.id === f.id).length ?? 1);
  for (const id of B.carpetas ?? []) {
    const f = game.folders.get(id);
    if (!f || dentro(f)) continue;
    await f.delete();
    carpetas++;
  }
  return { diarios: ids.length, carpetas };
}

/** Objetos del mundo que trae el contenido (por clave): se crean una vez en «Ecos · Objetos del valle». */
async function aplicarObjetosMundo(lista = []) {
  if (!lista.length) return 0;
  let carpeta = game.folders.find(f => (f.type === "Item") && (f.name === "Ecos · Objetos del valle"));
  carpeta ??= await Folder.create({ name: "Ecos · Objetos del valle", type: "Item", sorting: "a", color: "#2b2b2b" });
  let n = 0;
  for (const o of lista) {
    if (game.items.find(i => i.getFlag(MOD, "clave") === o.clave)) continue;
    let data = foundry.utils.deepClone(o.datos ?? {});
    if (o.base) {
      // Sobre un objeto del compendio (p. ej. la daga de dnd5e.equipment24) con los cambios del contenido encima.
      const doc = await docCompendio(o.base.pack, o.base.id);
      if (!doc) continue;
      const b = sinId(doc);
      for (const [k, v] of Object.entries(o.cambios ?? {})) foundry.utils.setProperty(b, k, v);
      data = foundry.utils.mergeObject(b, data, { inplace: false });
    }
    data.folder = carpeta.id;
    data.ownership = { default: CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE };
    foundry.utils.setProperty(data, `flags.${MOD}.clave`, o.clave);
    await Item.create(data);
    n++;
  }
  return n;
}

/**
 * PNJ hechos como ficha de personaje: se rehacen como ficha de PNJ sobre una ficha base del compendio, con el mismo
 * id (los enlaces y los tokens siguen funcionando), el mismo nombre, retrato, token, carpeta, permisos, banderas y
 * biografía. Se conservan las características, las competencias, los idiomas, el dinero y los objetos que diga el
 * contenido. La ficha vieja queda copiada en el ajuste «respaldoFichas».
 */
async function convertirPNJ(lista = []) {
  const hechos = [];
  const fallos = [];
  for (const c of lista) {
    const viejo = game.actors.get(c.id);
    if (!viejo || (viejo.type !== "character")) continue;
    const base = await docCompendio(PACK_FICHAS, c.base);
    if (!base) {
      fallos.push(`${viejo.name} (no encontré la ficha base)`);
      continue;
    }
    const v = viejo.toObject();
    const respaldo = foundry.utils.deepClone(game.settings.get(MOD, "respaldoFichas") ?? {});
    respaldo[c.id] = v;
    await game.settings.set(MOD, "respaldoFichas", respaldo);
    const b = sinId(base);
    const quitar = new Set(c.quitar ?? []);
    const conservar = new Set(c.conservar ?? []);
    const items = [
      ...(b.items ?? []).filter(i => !quitar.has(i.name)),
      ...v.items.filter(i => conservar.has(i.name)).map(i => {
        const o = foundry.utils.deepClone(i);
        delete o._id;
        return o;
      }),
      ...foundry.utils.deepClone(c.rasgos ?? [])
    ];
    const data = foundry.utils.deepClone(b);
    Object.assign(data, {
      _id: c.id, name: v.name, img: v.img, folder: v.folder, sort: v.sort, ownership: v.ownership, items, effects: b.effects ?? [],
      flags: foundry.utils.mergeObject(b.flags ?? {}, v.flags ?? {}, { inplace: false }),
      prototypeToken: { ...foundry.utils.deepClone(v.prototypeToken), name: v.name, actorLink: true }
    });
    const s = data.system;
    for (const k of Object.keys(s.abilities ?? {})) {
      const a = v.system.abilities?.[k];
      if (!a) continue;
      s.abilities[k].value = a.value;
      s.abilities[k].proficient = a.proficient ?? 0;
    }
    s.skills ??= {};
    for (const [k, sk] of Object.entries(v.system.skills ?? {})) {
      s.skills[k] ??= foundry.utils.deepClone(sk);
      s.skills[k].value = Math.max(Number(s.skills[k].value) || 0, Number(sk.value) || 0);
    }
    if (v.system.traits?.languages) s.traits.languages = foundry.utils.deepClone(v.system.traits.languages);
    if (v.system.currency) s.currency = foundry.utils.deepClone(v.system.currency);
    if (v.system.details?.alignment) s.details.alignment = v.system.details.alignment;
    const bio = cambiarTexto(v.system.details?.biography?.value ?? "", c.bioCambios ?? []);
    s.details.biography = { value: bio, public: enlazar(c.publica ?? "") };
    for (const [k, val] of Object.entries(c.sistema ?? {})) foundry.utils.setProperty(s, k, val);
    foundry.utils.setProperty(data, `flags.${MOD}.convertida`, "2.2.1");
    await viejo.delete();
    try {
      await Actor.create(data, { keepId: true });
      hechos.push(v.name);
    } catch (err) {
      console.error(`${MOD} | convertir ${v.name}`, err);
      await Actor.create(v, { keepId: true }).catch(e => console.error(`${MOD} | respaldo ${v.name}`, e));
      fallos.push(v.name);
      continue;
    }
    // Los tokens que ya estaban en escenas (vinculados) se llamaban «Player Character»: ahora, como la ficha.
    for (const sc of game.scenes) {
      const upd = sc.tokens.filter(t => (t.actorId === c.id) && (t.name !== v.name)).map(t => ({ _id: t.id, name: v.name }));
      if (upd.length) await sc.updateEmbeddedDocuments("Token", upd).catch(() => null);
    }
  }
  return { hechos, fallos };
}

/**
 * Cuadernos de los PJ: se crea un diario por PJ (dueño: su jugador, para que lo edite) con lo que tenía escrito en la
 * biografía de su hoja, y la hoja recibe la biografía que trae el contenido. Una sola vez: si el diario ya existe, no se toca.
 */
async function aplicarCuadernos(lista = []) {
  let n = 0;
  for (const c of lista) {
    if (diarioDe(`clave:${c.clave}`)) continue;
    const actor = game.actors.get(c.actor);
    if (!actor) continue;
    const vieja = actor.system.details?.biography?.value ?? "";
    const carpeta = c.carpeta ? carpetaDe(c.carpeta) : null;
    const notas = String(vieja).replace(/<[^>]+>/g, "").trim() ? vieja : "<p>(Sin notas todavía.)</p>";
    await JournalEntry.create({
      name: c.nombre, folder: carpeta?.id ?? null,
      ownership: { default: CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE, ...(c.permisos ?? {}) },
      flags: { [MOD]: { clave: c.clave } },
      pages: [{ name: "Notas", type: "text", text: { content: `${c.intro ?? ""}${notas}`, format: 1 }, flags: { [MOD]: { clave: `${c.clave}-notas` } } }]
    });
    await actor.update({ "system.details.biography.value": enlazar(c.bio ?? "") });
    n++;
  }
  return n;
}

/* ---------- Tablas aleatorias (rumores y encuentros) ---------- */
const CARPETA_TABLAS = "Ecos · Tablas del valle";

/*
 * Enlaces del contenido: {A:nombre o clave del actor|texto}, {P:clave de la página|texto}, {J:clave del diario|texto}.
 * Con pendientes = true, lo que todavía no existe queda como está (para el repaso del final); si no, queda el texto.
 */
function enlazar(html, { pendientes = true } = {}) {
  const t = String(html ?? "");
  if (!t.includes("{")) return t;
  const actor = n => game.actors.find(x => x.getFlag?.(MOD, "clave") === n) ?? game.actors.find(x => x.name === n);
  const pagina = c => {
    for (const j of game.journal) {
      const p = j.pages.find(x => x.getFlag?.(MOD, "clave") === c);
      if (p) return p;
    }
    return null;
  };
  const diario = c => game.journal.find(j => j.getFlag?.(MOD, "clave") === c);
  return t.replace(/\{([APJ]):([^|}]+)\|([^}]+)\}/g, (m, tipo, ref, texto) => {
    const doc = { A: actor, P: pagina, J: diario }[tipo](ref.trim());
    if (doc) return `@UUID[${doc.uuid}]{${texto}}`;
    return pendientes ? m : texto;
  });
}
const enlazarActores = html => enlazar(html, { pendientes: false });

/** Al terminar de aplicar el contenido: los enlaces a cosas que se crearon después ya se pueden resolver. */
async function rematarEnlaces() {
  const re = /\{[APJ]:[^|}]+\|[^}]+\}/;
  let n = 0;
  for (const j of game.journal) {
    for (const p of j.pages) {
      const c = p.text?.content ?? "";
      if (!re.test(c)) continue;
      await p.update({ "text.content": enlazar(c, { pendientes: false }) });
      n++;
    }
  }
  for (const a of game.actors) {
    const b = a.system?.details?.biography?.value ?? "";
    if (!re.test(b)) continue;
    await a.update({ "system.details.biography.value": enlazar(b, { pendientes: false }) });
    n++;
  }
  return n;
}

async function carpetaTablas() {
  let f = game.folders.find(x => (x.type === "RollTable") && (x.name === CARPETA_TABLAS));
  if (!f) f = await Folder.create({ name: CARPETA_TABLAS, type: "RollTable", sorting: "a", color: "#3b2f1e" });
  return f;
}

const tablaPorClave = clave => game.tables.find(t => t.getFlag(MOD, "clave") === clave) ?? null;

/** Crea las tablas que falten y rehace las que traen una versión de contenido distinta. Devuelve cuántas tocó. */
async function aplicarTablas(lista, version) {
  if (!lista.length) return 0;
  const carpeta = await carpetaTablas();
  let n = 0;
  for (const t of lista) {
    const results = t.resultados.map(r => ({
      type: "text", name: "", img: r.plantilla ? "icons/svg/combat.svg" : "icons/svg/d20-black.svg",
      description: enlazarActores(r.texto), range: r.rango, weight: (r.rango[1] - r.rango[0]) + 1,
      flags: r.plantilla ? { [MOD]: { plantilla: r.plantilla, dificultad: r.dificultad ?? null, indice: r.indice ?? null } } : {}
    }));
    let tabla = tablaPorClave(t.clave);
    if (tabla && (tabla.getFlag(MOD, "version") === version)) continue;
    if (tabla) {
      await tabla.deleteEmbeddedDocuments("TableResult", tabla.results.map(x => x.id));
      await tabla.update({ name: t.nombre, formula: t.formula, description: t.descripcion ?? "", [`flags.${MOD}.version`]: version });
      await tabla.createEmbeddedDocuments("TableResult", results);
    } else {
      tabla = await RollTable.create({
        name: t.nombre, formula: t.formula, description: t.descripcion ?? "", replacement: true, displayRoll: true,
        img: "icons/svg/d20-grey.svg", folder: carpeta.id, ownership: { default: CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE },
        flags: { [MOD]: { clave: t.clave, version } }, results
      });
    }
    n++;
  }
  return n;
}

/** Saca un resultado en privado (solo el DM lo ve). formula opcional, p. ej. "min(1d8 + 1, 8)". */
async function sacarDeTabla(clave, { formula } = {}) {
  const tabla = tablaPorClave(clave);
  if (!tabla) return ui.notifications.warn(`Ecos de la frontera: falta la tabla «${clave}». Vuelve a aplicar el contenido.`);
  const roll = formula ? new Roll(formula) : undefined;
  return tabla.draw({ roll, rollMode: CONST.DICE_ROLL_MODES.PRIVATE });
}

const estacionClave = () => ({ primavera: "primavera", verano: "verano", otono: "otono", invierno: "invierno" })[ahoraMundo().estacion] ?? "primavera";

/** Rumor: dos de cada tres veces de la tabla de ahora, una de la habladuría de la estación. */
function sacarRumor() {
  const deEstacion = Math.random() < (1 / 3);
  return sacarDeTabla(deEstacion ? `habladurias-${estacionClave()}` : "rumores");
}

const ZONAS_ENCUENTRO = {
  pueblo: "El pueblo, de noche", campos: "Campos y granjas", rio: "Río, vado y remanso",
  bosque: "Bosque del borde", noroeste: "Noroeste (cantera)", noreste: "Noreste (ventilación y Uhrak)",
  subsuelo: "Bajo tierra (Nivel 1 y galerías)"
};

/** Lo que se suma al dado de encuentros: +1 con la Barrera en 5 o más, +2 en 7 o más. */
const bonoEncuentro = () => {
  const b = Number(game.settings.get(MOD, "relojBarrera")) || 0;
  return (b >= 7) ? 2 : ((b >= 5) ? 1 : 0);
};

/**
 * Encuentro por zona (Tramas · 14; la tabla va de lo tranquilo a lo peligroso): si sale una plantilla, el módulo arma
 * las criaturas para el grupo de hoy (Plantillas de combate [DM]). opciones: {dificultad, aliados}.
 */
function sacarEncuentro(zona, opciones = {}) {
  return sacarEncuentroArmado(zona, opciones);
}

/* ---------- Encuentros: la tabla saca una plantilla y el módulo arma las criaturas para el grupo de hoy ---------- */
// Presupuesto de XP por personaje (reglas de 2024): nivel -> [bajo, moderado, alto]
const PRESUPUESTO_XP = {
  1: [50, 75, 100], 2: [100, 150, 200], 3: [150, 225, 400], 4: [250, 375, 500], 5: [500, 750, 1100], 6: [600, 1000, 1400],
  7: [750, 1300, 1700], 8: [1000, 1700, 2100], 9: [1300, 2000, 2600], 10: [1600, 2300, 3100], 11: [1900, 2900, 4100],
  12: [2200, 3700, 4700], 13: [2600, 4200, 5400], 14: [2900, 4900, 6200], 15: [3300, 5400, 7800], 16: [3800, 6100, 9800],
  17: [4500, 7200, 11700], 18: [5000, 8700, 14200], 19: [5500, 10700, 17200], 20: [6400, 13200, 22000]
};
const FACTOR_VORRH = 1.25;
const DIFICULTADES = ["bajo", "moderado", "alto"];
const NOMBRE_DIF = { bajo: "Bajo", moderado: "Moderado", alto: "Alto" };
const FR_VD = { 0: "0", 0.125: "⅛", 0.25: "¼", 0.5: "½" };

const XP_POR_VD = { 0: 10, 0.125: 25, 0.25: 50, 0.5: 100, 1: 200, 2: 450, 3: 700, 4: 1100, 5: 1800, 6: 2300, 7: 2900, 8: 3900, 9: 5000, 10: 5900,
  11: 7200, 12: 8400, 13: 10000, 14: 11500, 15: 13000, 16: 15000, 17: 18000, 18: 20000, 19: 22000, 20: 25000 };
const xpDeActor = a => Number(a?.system?.details?.xp?.value) || XP_POR_VD[Number(a?.system?.details?.cr ?? 0)] || 0;
/** Datos de los encuentros. Las criaturas, con el VD, la XP y el nombre que tiene su ficha hoy (no los del catálogo guardado). */
const datosEncuentros = () => {
  let D;
  try {
    D = game.settings.get(MOD, "encuentros") ?? {};
  } catch {
    return {};
  }
  const fichas = new Map();
  for (const a of game.actors) {
    const k = a.getFlag?.(MOD, "clave");
    if (k && !fichas.has(k)) fichas.set(k, a);
  }
  return { ...D, criaturas: (D.criaturas ?? []).map(c => {
    const a = fichas.get(c.clave);
    if (!a) return c;
    const vd = Number(a.system.details?.cr ?? c.vd);
    return { ...c, vd: Number.isFinite(vd) ? vd : c.vd, xp: xpDeActor(a) || c.xp, nombre: a.name, vorrh: !!(c.vorrh || a.getFlag(MOD, "vorrh")),
      golpes: Number(a.getFlag(MOD, "golpes")?.n ?? 0) || null };
  }) };
};

/** El grupo de hoy: los PJ (con su nivel) y los aliados PNJ que el DM diga, al nivel medio del grupo. */
function grupoDeHoy(aliados = 0) {
  const pjs = game.actors.filter(a => esPJ(a));
  // Quien tiene la capa V despierta cuenta como dos niveles más.
  const capaV = game.modules.get(MOD)?.api?.verbe;
  const niveles = pjs.map(a => nivelPJ(a) + (capaV?.despierto?.(a) ? 2 : 0));
  if (!niveles.length) niveles.push(2, 2);
  const medio = Math.max(1, Math.round(niveles.reduce((t, n) => t + n, 0) / niveles.length));
  for (let i = 0; i < aliados; i++) niveles.push(medio);
  return { pjs, niveles, medio };
}

function presupuestoDe(niveles) {
  const b = [0, 0, 0];
  for (const n of niveles) PRESUPUESTO_XP[Math.clamp(n, 1, 20)].forEach((x, i) => { b[i] += x; });
  return b;
}

const xpEf = c => c.xp * (c.vorrh ? FACTOR_VORRH : 1);
const pesoN = c => (((c.vd <= 0.125) || (c.golpes === 1)) ? 0.5 : ((c.golpes === 2) ? 0.75 : 1));
const entre = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const actorPorClave = clave => game.actors.find(a => a.getFlag(MOD, "clave") === clave) ?? null;

/** Arma una plantilla en una zona para unos niveles. Devuelve {comp: [{c, n}], xp, xpEf, banda} o null. */
function armarPlantilla(pl, zona, niveles, { barrera = 0, dificultad = null, estacion = "primavera", intentos = 60, aceptarPoco = false } = {}) {
  const D = datosEncuentros();
  const [bajo, mod, alto] = presupuestoDe(niveles);
  const nivel = Math.max(1, Math.round(niveles.reduce((t, n) => t + n, 0) / niveles.length));
  const topeVD = Math.max(1, nivel);
  const maxN = (2 * niveles.length) + 1;
  const dif = dificultad ?? pl.dificultad;
  const rango = { bajo: [bajo, mod], moderado: [mod, (mod + alto) / 2], alto: [(mod + alto) / 2, alto] }[dif] ?? [mod, alto];
  let pool = (D.criaturas ?? []).filter(c => c.zonas.includes(zona) && (c.barrera <= barrera) && (c.vd <= topeVD) && (c.xp <= alto)
    && (!c.tags.includes("primavera") || (estacion === "primavera")) && (!c.tags.includes("verano") || (estacion === "verano"))
    && actorPorClave(c.clave));
  if (pl.tags?.length) pool = pool.filter(c => pl.tags.some(t => c.tags.includes(t)));
  if (pl.sin_tags?.length) pool = pool.filter(c => !pl.sin_tags.some(t => c.tags.includes(t)));
  if (pl.familias?.length) pool = pool.filter(c => pl.familias.includes(c.fam));
  if (!pool.length) return null;
  let mejor = null;
  for (let k = 0; k < intentos; k++) {
    let sub = pool;
    if (pl.familias?.length && !pl.mezcla) {
      const f = azar([...new Set(pool.map(c => c.fam))]);
      sub = pool.filter(c => c.fam === f);
    }
    const objetivo = rango[0] + (Math.random() * (rango[1] - rango[0]));
    const comp = [];
    let total = 0, cuenta = 0, fallo = false;
    for (const r of pl.roles) {
      const usados = comp.map(x => x.c);
      const cands = sub.filter(c => c.roles.includes(r.rol) && (total + xpEf(c) <= alto) && !usados.includes(c) && (cuenta + pesoN(c) <= maxN));
      if (!cands.length) {
        if (r.opcional) continue;
        fallo = true;
        break;
      }
      if (r.opcional && (Math.random() < 0.4)) continue;
      const c = azar(cands);
      const [rlo, rhi] = r.n;
      const lo = (c.n[0] <= rhi) ? Math.max(rlo, c.n[0]) : rlo;
      const hi = Math.max(lo, Math.min(rhi, c.n[1]));
      let n = entre(lo, hi);
      while ((n > 0) && ((total + (n * xpEf(c)) > alto) || (cuenta + (n * pesoN(c)) > maxN))) n--;
      if (n <= 0) {
        if (r.opcional) continue;
        fallo = true;
        break;
      }
      comp.push({ c, n, max: rhi });
      total += n * xpEf(c);
      cuenta += n * pesoN(c);
    }
    if (fallo || !comp.length) continue;
    while (total < objetivo) {
      const idx = comp.map((x, i) => i).filter(i => (comp[i].n < comp[i].max) && (total + xpEf(comp[i].c) <= alto) && (cuenta + pesoN(comp[i].c) <= maxN));
      if (!idx.length) break;
      const x = comp[azar(idx)];
      x.n++;
      total += xpEf(x.c);
      cuenta += pesoN(x.c);
    }
    if ((total < bajo * 0.8) && !aceptarPoco) continue;
    let d = ((total >= rango[0]) && (total <= rango[1])) ? 0 : Math.min(Math.abs(total - rango[0]), Math.abs(total - rango[1]));
    d += Math.random();
    if (!mejor || (d < mejor.d)) mejor = { d, comp, total };
  }
  if (!mejor) return null;
  const xp = mejor.comp.reduce((t, x) => t + (x.c.xp * x.n), 0);
  const ef = Math.round(mejor.total);
  const banda = (ef >= alto * 0.9) ? "Alto" : (ef >= mod ? "Moderado" : (ef >= bajo ? "Bajo" : "Muy bajo"));
  return { comp: mejor.comp.map(x => ({ clave: x.c.clave, n: x.n })), xp, xpEf: ef, banda, presupuesto: [bajo, mod, alto] };
}

/** Busca la plantilla en la tabla de la zona; si no se puede armar, baja por la tabla hacia lo más tranquilo. */
function componerEncuentro({ zona, plantilla, dificultad = null, aliados = 0, indice = null }) {
  const D = datosEncuentros();
  const { niveles } = grupoDeHoy(aliados);
  const barrera = Number(game.settings.get(MOD, "relojBarrera")) || 0;
  const estacion = estacionClave();
  const tabla = D.tablas?.[(zona === "camino") ? `camino-${estacion}` : zona] ?? [];
  const probar = [plantilla];
  if (indice !== null) for (let i = indice - 1; i >= 0; i--) if (tabla[i]?.plantilla) probar.push(tabla[i].plantilla);
  for (const t of tabla) if (t.plantilla && !probar.includes(t.plantilla)) probar.push(t.plantilla);
  for (const [i, clave] of probar.entries()) {
    const pl = (D.plantillas ?? []).find(p => p.clave === clave);
    if (!pl || ((pl.barrera ?? 0) > barrera)) continue;
    const r = armarPlantilla(pl, zona, niveles, { barrera, dificultad, estacion });
    if (r) return { ...r, plantilla: clave, cambiada: i > 0 ? plantilla : null };
  }
  // Nada encaja en la banda: lo mejor que haya de la plantilla pedida, aunque se quede corto.
  const pl = (D.plantillas ?? []).find(p => p.clave === plantilla);
  const r = pl ? armarPlantilla(pl, zona, niveles, { barrera, dificultad, estacion, aceptarPoco: true }) : null;
  return r ? { ...r, plantilla } : null;
}

function paginaPlantilla(clave) {
  for (const j of game.journal) {
    const p = j.pages.find(x => x.getFlag(MOD, "clave") === `PC·${clave}`);
    if (p) return p;
  }
  return null;
}

/** Contenido de la tarjeta de encuentro (solo DM). */
function htmlEncuentro(e) {
  const D = datosEncuentros();
  const pl = (D.plantillas ?? []).find(p => p.clave === e.plantilla);
  const zonaNombre = D.zonas?.[e.zona] ?? e.zona;
  const { pjs, niveles } = grupoDeHoy(e.aliados ?? 0);
  const L = [];
  const fecha = hoyArcegris();
  L.push(`<b>${zonaNombre}</b>${fecha ? ` · ${textoFecha(fecha)}` : ""}${e.tirada ? ` · tirada ${e.tirada}` : ""}`);
  if (e.escena) {
    L.push(e.escena);
    return L;
  }
  if (!pl) return [...L, "No encontré la plantilla. Vuelve a aplicar el contenido."];
  const pag = paginaPlantilla(pl.clave);
  L.push(`Plantilla: <b>${pag ? enlace(pag, pl.nombre) : pl.nombre}</b> — ${pl.linea}`);
  if (e.cambiada) L.push(`<em>«${(D.plantillas.find(p => p.clave === e.cambiada) ?? {}).nombre ?? e.cambiada}» no se puede armar hoy (VD, Barrera o estación): salió esta.</em>`);
  const [bajo, mod, alto] = e.presupuesto ?? presupuestoDe(niveles);
  const grupo = pjs.map(a => `${a.name} (${nivelPJ(a)})`).join(", ") || "2 PJ de nivel 2";
  L.push(`Grupo: ${grupo}${e.aliados ? ` + ${e.aliados} aliado(s)` : ""} · presupuesto bajo ${bajo} · moderado ${mod} · alto ${alto} XP`);
  if (!e.comp?.length) {
    L.push("<b>No hay criaturas que encajen</b> con el grupo de hoy. Usa la plantilla como escena o pide otra.");
    return L;
  }
  const filas = e.comp.map(x => {
    const c = (D.criaturas ?? []).find(k => k.clave === x.clave);
    const a = actorPorClave(x.clave);
    const nom = a ? `<a class="ecos-ficha" data-ecos-ficha="${a.uuid}" data-tooltip="Abrir la ficha"><i class="fa-solid fa-id-card"></i> ${escH(a.name)}</a>` : (c?.nombre ?? x.clave);
    const v = a?.getFlag(MOD, "vorrh");
    return `<li><b>${x.n} ×</b> ${nom} <span class="ecos-nota">(VD ${FR_VD[c?.vd] ?? c?.vd}, ${c?.xp} XP c/u)</span>${v ? `<br><span class="ecos-nota">Eco del Vorrh: solo muere ${v.condicion}, o con cristal mudo.</span>` : ""}</li>`;
  }).join("");
  const cuantas = e.comp.reduce((t, x) => t + x.n, 0);
  const muchas = (cuantas >= 2 * niveles.length) ? ` · <em>${cuantas} criaturas contra ${niveles.length}: pega más de lo que dice la XP</em>` : "";
  L.push(`<b>${e.xp} XP</b> (${e.xpEf} para el presupuesto) · <b>${e.banda}</b>${e.dificultad ? ` · pedido: ${NOMBRE_DIF[e.dificultad]}` : ""}${muchas}<ul class="ecos-enc-lista">${filas}</ul>`);
  const T = pl.texto ?? {};
  for (const [k, t] of [["situacion", "Situación"], ["terreno", "Terreno"], ["tactica", "Táctica"], ["giro", "Giro (opcional)"], ["fin", "Cómo termina"], ["botin", "Botín"], ["sin_combate", "Sin pelear"]]) {
    if (T[k]) L.push(`<b>${t}:</b> ${T[k]}`);
  }
  if (e.puestos) L.push(`<em>${e.puestos}</em>`);
  return L;
}

const BOTONES_ENC = () => cajaBotones([
  boton("encOtra", "Otra composición", "fa-shuffle", { soloDM: true }),
  boton("encPlantilla", "Otra plantilla", "fa-dice-d20", { soloDM: true }),
  boton("encFacil", "Más fácil", "fa-minus", { soloDM: true }),
  boton("encDificil", "Más difícil", "fa-plus", { soloDM: true }),
  boton("encDesplegar", "Desplegar criaturas", "fa-chess-pawn", { soloDM: true }),
  boton("encEscena", "Desplegar ocultas", "fa-eye-slash", { soloDM: true })
]);

async function publicarEncuentro(e, mensaje = null) {
  const lineas = htmlEncuentro(e);
  const extra = e.escena ? cajaBotones([boton("encPlantilla", "Otra tirada", "fa-dice-d20", { soloDM: true })]) : BOTONES_ENC();
  const contenido = tarjeta("🜂 Encuentro", lineas, { clase: "ecos-secreto ecos-encuentro", extra });
  if (mensaje) return mensaje.update({ content: contenido, [`flags.${MOD}.encuentro`]: e });
  return ChatMessage.create({ content: contenido, whisper: idsGM(), speaker: { alias: "Ecos de la frontera (solo DM)" }, flags: { [MOD]: { encuentro: e } } });
}

/** Tira la tabla de la zona (con el bono de la Barrera) y devuelve la escena o la plantilla. */
async function tirarZona(zona) {
  const clave = (zona === "camino") ? `camino-${estacionClave()}` : `encuentro-${zona}`;
  const tabla = tablaPorClave(clave);
  if (!tabla) {
    ui.notifications.warn(`Ecos de la frontera: falta la tabla «${clave}». Vuelve a aplicar el contenido.`);
    return null;
  }
  const extra = (zona === "camino") ? 0 : bonoEncuentro();
  const caras = Number(String(tabla.formula ?? "1d10").match(/d(\d+)/)?.[1]) || 10;
  const roll = extra ? new Roll(`min(1d${caras} + ${extra}, ${caras})`) : new Roll(tabla.formula || `1d${caras}`);
  const draw = await tabla.draw({ roll, displayChat: false });
  const res = draw.results?.[0];
  if (!res) return null;
  const tirada = draw.roll?.total ?? null;
  const pl = res.getFlag(MOD, "plantilla");
  const indice = res.getFlag(MOD, "indice") ?? null;
  const texto = res.description ?? res.text ?? "";
  return pl ? { plantilla: pl, dificultad: res.getFlag(MOD, "dificultad") ?? null, indice, tirada, texto }
    : { escena: texto, tirada };
}

/** Encuentro completo: tabla → plantilla → criaturas. opciones: {dificultad, aliados}. */
async function sacarEncuentroArmado(zona, { dificultad = null, aliados = 0 } = {}) {
  const t = await tirarZona(zona);
  if (!t) return null;
  if (t.escena) return publicarEncuentro({ zona, escena: t.escena, tirada: t.tirada, aliados });
  const dif = (dificultad && dificultad !== "tabla") ? dificultad : t.dificultad;
  const r = componerEncuentro({ zona, plantilla: t.plantilla, dificultad: dif, aliados, indice: t.indice });
  return publicarEncuentro({ zona, tirada: t.tirada, aliados, dificultad: dif, indice: t.indice, ...(r ?? { plantilla: t.plantilla, comp: [] }) });
}

/** Botones de la tarjeta (los resuelve el DM). */
async function accionEncuentro(accion, messageId) {
  const m = game.messages.get(messageId);
  const e = m?.getFlag(MOD, "encuentro");
  if (!e) return;
  if (accion === "encPlantilla") {
    const t = await tirarZona(e.zona);
    if (!t) return;
    if (t.escena) return publicarEncuentro({ zona: e.zona, escena: t.escena, tirada: t.tirada, aliados: e.aliados }, m);
    const r = componerEncuentro({ zona: e.zona, plantilla: t.plantilla, dificultad: t.dificultad, aliados: e.aliados, indice: t.indice });
    return publicarEncuentro({ zona: e.zona, tirada: t.tirada, aliados: e.aliados, dificultad: t.dificultad, indice: t.indice, ...(r ?? { plantilla: t.plantilla, comp: [] }) }, m);
  }
  if (accion === "encEscena") return ponerEnEscena(e, m, { ocultos: true });
  if (accion === "encDesplegar") return ponerEnEscena(e, m, { ocultos: false });
  let dificultad = e.dificultad;
  if ((accion === "encFacil") || (accion === "encDificil")) {
    const actual = dificultad ?? ((e.banda === "Alto") ? "alto" : (e.banda === "Moderado" ? "moderado" : "bajo"));
    const i = DIFICULTADES.indexOf(actual);
    dificultad = DIFICULTADES[Math.clamp(i + ((accion === "encDificil") ? 1 : -1), 0, 2)];
  }
  const r = componerEncuentro({ zona: e.zona, plantilla: e.plantilla, dificultad, aliados: e.aliados, indice: e.indice });
  return publicarEncuentro({ ...e, dificultad, puestos: null, ...(r ?? { comp: [] }) }, m);
}

/** Pone los tokens en la escena que estás mirando, en un círculo alrededor del centro de la vista (ocultos o a la vista). */
async function ponerEnEscena(e, m, { ocultos = true } = {}) {
  if (!canvas?.ready || !canvas?.scene || !e.comp?.length) return ui.notifications.warn("Ecos de la frontera: no hay un tablero abierto o criaturas que poner.");
  const g = canvas.grid.size;
  const centro = { x: canvas.stage.pivot.x, y: canvas.stage.pivot.y };
  const total = e.comp.reduce((t, x) => t + x.n, 0);
  const datos = [];
  let k = 0;
  for (const x of e.comp) {
    const a = actorPorClave(x.clave);
    if (!a) continue;
    for (let i = 0; i < x.n; i++, k++) {
      const ang = (2 * Math.PI * k) / Math.max(1, total);
      const r = g * (1.5 + (total / 4));
      const p = canvas.grid.getSnappedPoint({ x: centro.x + (Math.cos(ang) * r), y: centro.y + (Math.sin(ang) * r) }, { mode: CONST.GRID_SNAPPING_MODES.TOP_LEFT_VERTEX });
      const td = await a.getTokenDocument({ x: p.x, y: p.y, hidden: ocultos });
      datos.push(td.toObject());
    }
  }
  if (!datos.length) return;
  await canvas.scene.createEmbeddedDocuments("Token", datos);
  ui.notifications.info(`Ecos de la frontera: ${datos.length} criatura(s) en «${canvas.scene.name}»${ocultos ? " (ocultas)" : ""}.`);
  return publicarEncuentro({ ...e, puestos: ocultos ? `${datos.length} token(s) puestos ocultos en «${canvas.scene.name}». Revélalos cuando quieras (clic derecho → ojo).`
    : `${datos.length} token(s) puestos en «${canvas.scene.name}», alrededor del centro de la vista.` }, m);
}

/* ---------- Eco del Vorrh: lo que el Vorrh recuerda no se queda muerto ---------- */
/*
 * Las criaturas con la flag ecos-frontera.vorrh = {condicion, pista, vueltas} no mueren al llegar a 0 PG:
 * quedan «recomponiéndose» y se levantan al inicio de su turno con la mitad de sus PG, hasta «vueltas» veces.
 * Después se hunden en la tierra (ocultas: volverán otra noche). Mueren de verdad si el DM marca que se cumplió
 * su condición o si las anula el cristal mudo.
 */
const docEstadoVorrh = actor => (actor.isToken ? actor.token : actor);
const vueltasVorrh = actor => Number(docEstadoVorrh(actor)?.getFlag(MOD, "vueltasVorrh") ?? 0);

async function quitarMuerte(actor) {
  if (actor.statuses.has("dead")) await actor.toggleStatusEffect("dead", { active: false, overlay: true }).catch(() => null);
  for (const c of game.combats.contents.flatMap(cb => cb.combatants.filter(x => x.actor === actor || x.tokenId === actor.token?.id))) {
    if (c.defeated) await c.update({ defeated: false });
  }
}

async function marcarMuerte(actor) {
  if (!actor.statuses.has("dead")) await actor.toggleStatusEffect("dead", { active: true, overlay: true }).catch(() => null);
  for (const c of game.combats.contents.flatMap(cb => cb.combatants.filter(x => x.actor === actor || x.tokenId === actor.token?.id))) {
    if (!c.defeated) await c.update({ defeated: true });
  }
}

const anuladoPorCristal = actor => actor.statuses.has("ecosAnulado");

/** Cae a 0 PG una criatura del Vorrh. */
async function vorrhCae(actor) {
  const v = actor.getFlag(MOD, "vorrh");
  if (!v || anuladoPorCristal(actor) || docEstadoVorrh(actor)?.getFlag(MOD, "vorrhMuerto")) return;
  if (actor.statuses.has("ecosRecomponiendo")) return;
  // Midi-QOL y Chris's Premades marcan «muerto» justo después: se espera un momento y se deshace.
  await new Promise(r => setTimeout(r, 400));
  const max = Number(v.vueltas ?? 2);
  const usadas = vueltasVorrh(actor);
  const tok = actor.token ?? actor.getActiveTokens()[0]?.document ?? null;
  await quitarMuerte(actor);
  if (usadas >= max) {
    if (tok) await tok.update({ hidden: true });
    await publicar(null, "🌑 Se hunde en la tierra", [`<b>${actor.name}</b> se deshace en la tierra antes de tocar el suelo. No dejó cuerpo.`]);
    await susurrarDM(`Eco del Vorrh · ${actor.name}`, [
      `Usó sus ${max} vueltas de esta noche: se retiró (el token quedó oculto). <b>No está muerto</b>: vuelve otra noche al mismo lugar.`,
      `Para matarlo de verdad: ${v.condicion}, o cristal mudo. No da XP hasta que muera de verdad; si lo echaron, tú decides si das la mitad.`
    ]);
    return;
  }
  await actor.toggleStatusEffect("ecosRecomponiendo", { active: true }).catch(() => null);
  const mitad = Math.ceil((actor.system.attributes.hp.max ?? 1) / 2);
  await susurrarDM(`Eco del Vorrh · ${actor.name}`, [
    `<b>${actor.name}</b> cae, pero no muere: el Vorrh recuerda su forma. Se levanta al inicio de su próximo turno con ${mitad} PG (vuelta ${usadas + 1} de ${max}).`,
    `<b>Solo muere</b> ${v.condicion}, o si lo hiere cristal mudo.`,
    v.pista ? `<em>Pista que pueden tener los jugadores:</em> ${v.pista}` : ""
  ], {
    extra: cajaBotones([
      boton("vorrhMuere", "Se cumplió: muere", "fa-skull", { soloDM: true }),
      boton("vorrhAnular", "Cristal mudo: anulado", "fa-gem", { soloDM: true }),
      boton("vorrhLevanta", "Se levanta ya", "fa-arrow-up", { soloDM: true })
    ]),
    flags: { [MOD]: { vorrh: { uuid: actor.uuid } } }
  });
}

/** Se levanta con la mitad de sus PG. */
async function vorrhLevanta(actor) {
  if (!actor.statuses.has("ecosRecomponiendo")) return;
  await actor.toggleStatusEffect("ecosRecomponiendo", { active: false }).catch(() => null);
  if (actor.statuses.has("prone")) await actor.toggleStatusEffect("prone", { active: false }).catch(() => null);
  await quitarMuerte(actor);
  const doc = docEstadoVorrh(actor);
  await doc.setFlag(MOD, "vueltasVorrh", vueltasVorrh(actor) + 1);
  await actor.update({ "system.attributes.hp.value": Math.ceil((actor.system.attributes.hp.max ?? 1) / 2) }, { ecosVorrh: true });
  await publicar(null, "🌑 Se vuelve a levantar", [`<b>${actor.name}</b> se levanta otra vez. Algo en el suelo late.`]);
}

async function vorrhMuere(actor, motivo) {
  await actor.toggleStatusEffect("ecosRecomponiendo", { active: false }).catch(() => null);
  await docEstadoVorrh(actor).setFlag(MOD, "vorrhMuerto", true);
  if ((actor.system.attributes.hp.value ?? 0) > 0) await actor.update({ "system.attributes.hp.value": 0 }, { ecosVorrh: true });
  await marcarMuerte(actor);
  await publicar(null, "🌑 Ya no se levanta", [`<b>${actor.name}</b> no se vuelve a levantar.${motivo ? ` ${motivo}` : ""}`]);
}

async function accionVorrh(accion, messageId) {
  const m = game.messages.get(messageId);
  const uuid = m?.getFlag(MOD, "vorrh")?.uuid;
  const actor = uuid ? await fromUuid(uuid) : null;
  if (!actor) return;
  if (accion === "vorrhMuere") {
    await marcarUsado(messageId, "Se cumplió la condición: murió de verdad.");
    return vorrhMuere(actor);
  }
  if (accion === "vorrhAnular") {
    await marcarUsado(messageId, "Lo anuló el cristal mudo.");
    await actor.toggleStatusEffect("ecosAnulado", { active: true }).catch(() => null);
    if ((actor.system.attributes.hp.value ?? 0) <= 0) return vorrhMuere(actor, "El cristal mudo le cortó el eco.");
    return null;
  }
  if (accion === "vorrhLevanta") {
    await marcarUsado(messageId, "Se levantó.");
    return vorrhLevanta(actor);
  }
  return null;
}

Hooks.on("updateActor", (actor, changes, options) => {
  if (!soyGM() || options?.ecosVorrh || esPJ(actor) || !actor.getFlag(MOD, "vorrh")) return;
  const hp = foundry.utils.getProperty(changes, "system.attributes.hp.value");
  if ((hp === undefined) || (hp > 0)) return;
  vorrhCae(actor).catch(err => console.error(`${MOD} | Eco del Vorrh`, err));
});

Hooks.on("combatTurnChange", (combat, prior, current) => {
  if (!soyGM()) return;
  const c = (current?.combatantId ? combat.combatants.get(current.combatantId) : null) ?? combat.combatant;
  const actor = c?.actor;
  if (!actor?.statuses?.has("ecosRecomponiendo")) return;
  vorrhLevanta(actor).catch(err => console.error(`${MOD} | Eco del Vorrh`, err));
});

// Al terminar un combate, lo anulado por el cristal vuelve a ser lo que era (si sigue vivo) y se olvidan las vueltas.
Hooks.on("deleteCombat", combat => {
  if (!soyGM()) return;
  for (const c of combat.combatants) {
    const a = c.actor;
    if (!a?.getFlag?.(MOD, "vorrh")) continue;
    if (a.statuses.has("ecosAnulado")) a.toggleStatusEffect("ecosAnulado", { active: false }).catch(() => null);
    const d = docEstadoVorrh(a);
    if (d?.getFlag(MOD, "vueltasVorrh")) d.unsetFlag(MOD, "vueltasVorrh").catch(() => null);
  }
});

/* ---------- Golpes que cuentan (v2.4): moral de las criaturas y jefes por etapas ---------- */
/*
 * Criaturas con la flag ecos-frontera.golpes = {n, moral, lider}: cuando les entra el primer golpe de verdad (bajan a la
 * mitad de sus PG o menos) le llega al DM en privado qué hace según su moral; si cae una que manda, que el resto tire moral.
 * Jefes con la flag ecos-frontera.jefe = {etapas: [{desde, hasta, titulo, texto}], ronda: [textos]}: al bajar de etapa le
 * llega la etapa nueva y, al empezar cada ronda, su dominio del campo. El estado va en el token (o en la ficha si está enlazada).
 */
const MORAL_GOLPES = {
  bestia: "Huye, salvo que esté acorralada, defienda a sus crías o tenga hambre de verdad.",
  gente: "Se rinde o huye. Los fanáticos y los acorralados siguen.",
  demonio: "No se rinde: sigue, salvo que vea que pierde (cayó la mitad de los suyos o le dolió de verdad). Entonces huye.",
  sueno: "Se retira hacia el bosque, el agua o la oscuridad si puede.",
  mensajero: "Se va volando y no vuelve."
};
const estadoGolpes = actor => (actor.isToken ? actor.token : actor);
const salvaSab = actor => {
  const w = actor.system.abilities?.wis ?? {};
  const v = (typeof w.save === "object") ? w.save?.value : w.save;
  return Number.isFinite(Number(v)) ? Number(v) : Number(w.mod ?? 0);
};
const etapaJefe = (jefe, hp) => {
  const et = jefe?.etapas ?? [];
  const i = et.findIndex(e => hp > Number(e.hasta ?? 0));
  return i < 0 ? Math.max(0, et.length - 1) : i;
};

async function avisoMoral(actor, hp, max) {
  const g = actor.getFlag(MOD, "golpes");
  if (!g || (g.moral === "sin_miedo")) return;
  const doc = estadoGolpes(actor);
  if (doc?.getFlag(MOD, "golpeVisto")) return;
  await doc?.setFlag(MOD, "golpeVisto", true);
  const sab = salvaSab(actor);
  await susurrarDM(`Moral · ${actor.name}`, [
    `<b>${actor.name}</b> tiene un golpe encima (${hp}/${max} PG).`,
    `${MORAL_GOLPES[g.moral] ?? MORAL_GOLPES.bestia}`,
    g.moral === "mensajero" ? "" : `Si quieres tirar: Sabiduría CD 10 (CD 13 si ya cayó el que manda o la mitad de los suyos) [[/r 1d20 ${signo(sab)} #Moral de ${actor.name}]].`
  ]);
}

async function avisoLider(actor) {
  const g = actor.getFlag(MOD, "golpes");
  if (!g?.lider) return;
  const doc = estadoGolpes(actor);
  if (doc?.getFlag(MOD, "liderCaido")) return;
  await doc?.setFlag(MOD, "liderCaido", true);
  await susurrarDM(`Cayó el que manda · ${actor.name}`, [
    `<b>${actor.name}</b> era el que mandaba. Los demás tiran moral con desventaja (Sabiduría CD 13) o huyen sin más; los que no conocen el miedo siguen.`
  ]);
}

function textoEtapa(jefe, i) {
  const e = jefe.etapas[i];
  const sig = jefe.etapas[i + 1];
  return [`<b>Etapa ${i + 1} de ${jefe.etapas.length} · ${e.titulo}.</b> ${e.texto}`,
    sig ? `<em>Pasa a la etapa ${i + 2} al bajar de ${e.hasta + 1} PG. Si aprovechan su punto débil, bájalo a ${e.hasta} PG.</em>` : "<em>Es la última etapa.</em>"];
}

async function avisoEtapa(actor, hp) {
  const jefe = actor.getFlag(MOD, "jefe");
  if (!jefe?.etapas?.length) return;
  const doc = estadoGolpes(actor);
  const antes = Number(doc?.getFlag(MOD, "etapaJefe") ?? 0);
  const ahora = hp <= 0 ? jefe.etapas.length - 1 : etapaJefe(jefe, hp);
  if (ahora === antes) return;
  await doc?.setFlag(MOD, "etapaJefe", ahora);
  if ((ahora < antes) || (hp <= 0)) return; // se curó, o cayó: no hay etapa nueva que anunciar
  for (let i = antes + 1; i <= ahora; i++) await susurrarDM(`${actor.name} · cambia de etapa`, textoEtapa(jefe, i));
}

Hooks.on("updateActor", (actor, changes) => {
  if (!soyGM() || esPJ(actor)) return;
  const hp = foundry.utils.getProperty(changes, "system.attributes.hp.value");
  if (hp === undefined) return;
  const g = actor.getFlag(MOD, "golpes");
  const jefe = actor.getFlag(MOD, "jefe");
  if (!g && !jefe) return;
  const max = Number(actor.system.attributes.hp.max ?? 0) || 1;
  (async () => {
    if (jefe) return avisoEtapa(actor, hp);
    const doc = estadoGolpes(actor);
    if ((hp > max / 2) && doc?.getFlag(MOD, "golpeVisto")) await doc.unsetFlag(MOD, "golpeVisto");
    if (hp <= 0) return avisoLider(actor);
    if (hp <= max / 2) return avisoMoral(actor, hp, max);
    return null;
  })().catch(err => console.error(`${MOD} | golpes`, err));
});

// Al empezar cada ronda (y el combate): el dominio del campo de cada jefe que siga en pie. La primera vez, también su etapa.
const DOMINIO_VISTO = new Set();
Hooks.on("updateCombat", (combat, changes) => {
  if (!soyGM() || !("round" in changes) || !combat.started) return;
  const ronda = Number(combat.round ?? 0);
  if (ronda < 1) return;
  (async () => {
    for (const c of combat.combatants) {
      const actor = c.actor;
      const jefe = actor?.getFlag?.(MOD, "jefe");
      if (!jefe || c.defeated || ((actor.system.attributes.hp.value ?? 0) <= 0)) continue;
      const k = `${combat.id}:${ronda}:${actor.uuid}`;
      if (DOMINIO_VISTO.has(k)) continue;
      DOMINIO_VISTO.add(k);
      const r = jefe.ronda ?? [];
      const lineas = [];
      if (ronda === 1) lineas.push(...textoEtapa(jefe, etapaJefe(jefe, actor.system.attributes.hp.value ?? 0)));
      if (r.length) lineas.push(`<b>Dominio del campo · ronda ${ronda}</b> (iniciativa 20): ${r[Math.min(ronda, r.length) - 1]}`);
      if (lineas.length) await susurrarDM(`${actor.name} · ronda ${ronda}`, lineas);
    }
  })().catch(err => console.error(`${MOD} | dominio del campo`, err));
});

// Al terminar el combate se olvida lo visto (moral, líder, etapa) de las criaturas que siguen en la escena.
Hooks.on("deleteCombat", combat => {
  if (!soyGM()) return;
  for (const c of combat.combatants) {
    const a = c.actor;
    if (!a?.getFlag?.(MOD, "golpes") && !a?.getFlag?.(MOD, "jefe")) continue;
    const d = estadoGolpes(a);
    for (const f of ["golpeVisto", "liderCaido", "etapaJefe"]) if (d?.getFlag(MOD, f) !== undefined) d.unsetFlag(MOD, f).catch(() => null);
  }
});


/* ---------- Experiencia al terminar un combate: el DM decide (v2.4) ---------- */
async function preguntarXP(combat) {
  const pjs = [];
  const enemigos = [];
  for (const c of combat.combatants) {
    const a = c.actor;
    if (!a) continue;
    if (esPJ(a)) {
      if (!pjs.includes(a.id)) pjs.push(a.id);
      continue;
    }
    const tok = c.token;
    if (a.hasPlayerOwner || (tok?.disposition === CONST.TOKEN_DISPOSITIONS.FRIENDLY)) continue;
    const vorrh = a.getFlag(MOD, "vorrh");
    const doc = a.isToken ? a.token : a;
    const muertoVorrh = !!doc?.getFlag(MOD, "vorrhMuerto");
    const cayo = !!c.defeated || ((a.system.attributes?.hp?.value ?? 1) <= 0) || !!a.statuses?.has("dead");
    const derrotado = cayo && (!vorrh || muertoVorrh);
    const estado = derrotado ? "derrotado" : (vorrh && cayo ? "cayó, pero el Vorrh lo levanta: cuenta como huido" : "huyó, se rindió o quedó en pie");
    enemigos.push({ nombre: tok?.name ?? a.name, xp: xpDeActor(a), derrotado, estado, tokenUuid: tok?.uuid ?? null });
  }
  if (!enemigos.length || !pjs.length) return;
  const n = pjs.length;
  const derrot = enemigos.filter(e => e.derrotado).reduce((t, e) => t + e.xp, 0);
  const todos = enemigos.reduce((t, e) => t + e.xp, 0);
  const nombres = pjs.map(id => game.actors.get(id)?.name).filter(Boolean).join(" y ");
  await susurrarDM("Experiencia del combate", [
    `Nada se reparte solo: tú decides. Para ${nombres}.`,
    enemigos.map(e => `${e.derrotado ? "✔" : "·"} <b>${escH(e.nombre)}</b>: ${e.estado} (${e.xp} XP)`).join("<br>"),
    `Derrotados: <b>${derrot} XP</b> (${Math.floor(derrot / n)} c/u). Todos: ${todos} XP (${Math.floor(todos / n)} c/u).`,
    "<em>Los rendidos y los capturados también cuentan: si alguno se rindió, da «todos» o elige a mano. Huir no da XP.</em>"
  ], {
    extra: cajaBotones([
      derrot ? boton("xpDerrotados", `Dar ${derrot} XP (derrotados)`, "fa-star", { soloDM: true }) : "",
      (todos > derrot) ? boton("xpTodos", `Dar ${todos} XP (todos)`, "fa-star-half-stroke", { soloDM: true }) : "",
      game.MonksTokenBar?.assignXP ? boton("xpMano", "Elegir a mano", "fa-list-check", { soloDM: true }) : "",
      boton("xpNada", "No dar XP", "fa-ban", { soloDM: true })
    ]),
    flags: { [MOD]: { xpCombate: { pjs, enemigos } } }
  });
}

async function accionXP(accion, messageId) {
  const m = game.messages.get(messageId);
  const d = m?.getFlag(MOD, "xpCombate");
  if (!d || m.getFlag(MOD, "usado")) return null;
  if (accion === "xpNada") return marcarUsado(messageId, "No se dio XP por este combate.");
  if (accion === "xpMano") {
    const pjsTok = d.pjs.map(id => game.actors.get(id)?.getActiveTokens?.()[0]?.document?.uuid);
    const docs = (await Promise.all([...d.enemigos.map(e => e.tokenUuid), ...pjsTok].filter(Boolean).map(u => fromUuid(u).catch(() => null)))).filter(Boolean);
    await game.MonksTokenBar?.assignXP?.(docs.length ? docs : undefined);
    return null;
  }
  const lista = (accion === "xpTodos") ? d.enemigos : d.enemigos.filter(e => e.derrotado);
  const total = lista.reduce((t, e) => t + (Number(e.xp) || 0), 0);
  const pjs = d.pjs.map(id => game.actors.get(id)).filter(Boolean);
  if (!total || !pjs.length) return null;
  const cada = Math.floor(total / pjs.length);
  await marcarUsado(messageId, `Repartidos ${total} XP: ${cada} para cada uno.`);
  for (const a of pjs) await a.update({ "system.details.xp.value": (Number(a.system.details?.xp?.value) || 0) + cada });
  await publicar(null, "⭐ Experiencia", [`${pjs.map(a => `<b>${escH(a.name)}</b>`).join(" y ")} ganan <b>${cada} XP</b> cada uno.`]);
  for (const a of pjs) {
    const x = a.system.details?.xp;
    if (x?.max && (Number(x.value) >= Number(x.max))) await susurrarDM(`${a.name} puede subir de nivel`, [`Tiene ${x.value} XP (el siguiente nivel pide ${x.max}).`]);
  }
  return null;
}

Hooks.on("deleteCombat", combat => {
  if (!soyGM() || !combat.started) return;
  preguntarXP(combat).catch(err => console.error(`${MOD} | experiencia`, err));
});

/** Una vez (lo pide el contenido): que Monk's TokenBar no abra su ventana de XP solo al terminar el combate. */
async function apagarXPAutomatica() {
  if (!game.modules.get("monks-tokenbar")?.active || !game.settings.settings.has("monks-tokenbar.show-xp-dialog")) return false;
  if (!game.settings.get("monks-tokenbar", "show-xp-dialog")) return false;
  await game.settings.set("monks-tokenbar", "show-xp-dialog", false);
  return true;
}

/** ¿Lleva cristal mudo encima? (apaga el Eco de la sangre y la magia que lo toca) */
const llevaCristalMudo = actor => !!actor?.items?.some(i => i.getFlag(MOD, "cristalMudo") && ((i.system.quantity ?? 1) > 0));

/** Suceso del día: la tabla del mes del Calendario de Arcegris (o del mes real si el calendario no está activo). */
function sacarSuceso() {
  const mes = hoyArcegris()?.month ?? (new Date().getMonth() + 1);
  return sacarDeTabla(`suceso-${mes}`);
}

/** «El año en Arcegris» para los jugadores: un diario aparte, visible para todos, junto a las reglas. */
async function anioParaJugadores() {
  if (game.journal.find(j => j.getFlag(MOD, "clave") === "anio-jugadores")) return false;
  const origen = game.journal.get("EVpdTaQjXY8MANCb")?.pages.find(p => p.getFlag(MOD, "clave") === "anio");
  if (!origen) return false;
  const reglas = game.journal.get("G0rD0J3JkpOkXM00");
  await JournalEntry.create({
    name: "El año en Arcegris", folder: reglas?.folder?.id ?? null,
    ownership: { default: CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER },
    flags: { [MOD]: { clave: "anio-jugadores" } },
    pages: [{ name: "El año en Arcegris", type: "text", text: { content: origen.text?.content ?? "", format: 1 }, flags: { [MOD]: { clave: "anio-jugadores" } } }]
  });
  return true;
}

/** Vacía el ajuste «respaldoFichas» si todas las fichas que guarda ya están convertidas a PNJ. */
async function limpiarRespaldoFichas() {
  const r = game.settings.get(MOD, "respaldoFichas") ?? {};
  const ids = Object.keys(r);
  if (!ids.length) return 0;
  if (!ids.every(id => game.actors.get(id)?.type === "npc")) return 0;
  await game.settings.set(MOD, "respaldoFichas", {});
  return ids.length;
}

async function aplicarContenido({ forzar = false, archivo = "contenido" } = {}) {
  if (!game.user.isGM) return;
  const C = await leerContenido(archivo).catch(err => {
    console.error(`${MOD} | contenido`, err);
    return null;
  });
  if (!C?.version) return;
  if (!forzar && (archivo === "contenido") && (game.settings.get(MOD, "contenido") === C.version)) return;
  ui.notifications.info("Ecos de la frontera: aplicando biografías, fichas y PNJ nuevos… (tarda un poco)");
  const nuevos = [];
  const fallos = [];
  let hechos = 0;
  if (C.convertirPNJ?.length) {
    try {
      const r = await convertirPNJ(C.convertirPNJ);
      if (r.hechos.length) (C.notas ??= []).unshift(`${r.hechos.length} PNJ que eran fichas de personaje ahora son fichas de PNJ: ${r.hechos.join(", ")}.`);
      if (r.fallos.length) fallos.push(...r.fallos.map(n => `convertir ${n}`));
    } catch (err) {
      console.error(`${MOD} | contenido: convertir PNJ`, err);
      fallos.push("convertir PNJ");
    }
  }
  for (const e of C.actores ?? []) {
    try {
      const r = await aplicarActor(e, C.version);
      if (!r) continue;
      hechos++;
      if (r.nuevo) nuevos.push(e.nombre);
    } catch (err) {
      console.error(`${MOD} | contenido: ${e.nombre}`, err);
      fallos.push(e.nombre);
    }
  }
  let carpetas = 0;
  for (const ruta of C.limpiarCarpetas ?? []) {
    try {
      carpetas += await limpiarCarpetas(ruta);
    } catch (err) {
      console.error(`${MOD} | contenido: carpetas`, err);
    }
  }
  if (carpetas) (C.notas ??= []).unshift(`${carpetas} carpeta(s) vieja(s) vacía(s) borrada(s).`);
  // Retratos provisionales: solo para PNJ que ya existen y siguen con la silueta gris.
  const retratos = [];
  const sinRetrato = [];
  for (const r of C.retratos ?? []) {
    const a = buscarActorArte(r);
    if (!a) continue;
    try {
      if (r.forzar || r.token || r.img || r.vestuario || r.anillo !== undefined) {
        const res = await aplicarArte(a, r);
        if (res.ok) retratos.push(a.name);
        if (res.fallos.length) sinRetrato.push(`${a.name} (${res.fallos.join(", ")})`);
        continue;
      }
      if (!imagenVacia(a.img) && !imagenVacia(a.prototypeToken?.texture?.src)) continue;
      if (await ponerRetrato(a, r.tokens ?? [])) retratos.push(a.name);
      else sinRetrato.push(a.name);
    } catch (err) {
      console.error(`${MOD} | retrato: ${a.name}`, err);
      sinRetrato.push(a.name);
    }
  }
  if (retratos.length) (C.notas ??= []).push(`${retratos.length} ficha(s) con imagen nueva${retratos.length <= 12 ? `: ${retratos.join(", ")}` : ""}.`);
  if (sinRetrato.length) (C.notas ??= []).push(`Sin retrato (no se pudo bajar la imagen): ${sinRetrato.join(", ")}.`);
  if (C.localizarTokens) {
    try {
      const { n, fallos } = await localizarTokens();
      if (n || fallos) (C.notas ??= []).push(`${n} token(s) pasados de la CDN de 5etools a archivo local${fallos ? `; ${fallos} no se pudieron bajar y siguen apuntando a internet` : ""}.`);
    } catch (err) {
      console.error(`${MOD} | tokens locales`, err);
    }
  }
  let paginas = 0;
  // Las carpetas de diarios van primero: los diarios nuevos las necesitan.
  if (C.orden?.carpetas?.length) {
    try {
      await aplicarOrden({ carpetas: C.orden.carpetas });
    } catch (err) {
      console.error(`${MOD} | contenido: carpetas`, err);
    }
  }
  try {
    const d = await aplicarDiarios(C.diarios ?? []);
    if (d) (C.notas ??= []).push(`${d} diario(s) nuevo(s).`);
    paginas = await aplicarPaginas(C.paginas ?? []);
    const cu = await aplicarCuadernos(C.cuadernos ?? []);
    if (cu) (C.notas ??= []).push(`${cu} cuaderno(s) de PJ creados en la Crónica.`);
  } catch (err) {
    console.error(`${MOD} | contenido: páginas`, err);
    fallos.push("páginas de diario");
  }
  try {
    const t = await aplicarTablas(C.tablas ?? [], C.version);
    if (t) (C.notas ??= []).push(`${t} tabla(s) aleatoria(s) creadas o actualizadas en la carpeta <b>${CARPETA_TABLAS}</b> (se usan desde el Panel del DM).`);
  } catch (err) {
    console.error(`${MOD} | contenido: tablas`, err);
    fallos.push("tablas aleatorias");
  }
  if (C.encuentros) {
    try {
      await game.settings.set(MOD, "encuentros", C.encuentros);
    } catch (err) {
      console.error(`${MOD} | contenido: encuentros`, err);
      fallos.push("plantillas de encuentros");
    }
  }
  if (C.relojesMotivos) {
    try {
      const n = await aplicarMotivosRelojes(C.relojesMotivos);
      if (n) (C.notas ??= []).push(`<b>Relojes:</b> ${n} con sus motivos (por qué suben, se frenan o bajan). Ábrelos en la ventana de Relojes; el lápiz los cambia.`);
    } catch (err) {
      console.error(`${MOD} | contenido: motivos de relojes`, err);
      fallos.push("motivos de los relojes");
    }
  }
  if (C.objetosMundo?.length) {
    try {
      const o = await aplicarObjetosMundo(C.objetosMundo);
      if (o) (C.notas ??= []).push(`${o} objeto(s) nuevo(s) en la carpeta de objetos «Ecos · Objetos del valle».`);
    } catch (err) {
      console.error(`${MOD} | contenido: objetos`, err);
      fallos.push("objetos del valle");
    }
  }
  try {
    if (await anioParaJugadores()) (C.notas ??= []).push("Los jugadores ya pueden abrir <b>El año en Arcegris</b> (diario nuevo junto a las reglas, con el calendario, las fiestas y las lunas).");
  } catch (err) {
    console.error(`${MOD} | contenido: año para jugadores`, err);
  }
  if (C.orden) {
    try {
      const o = await aplicarOrden({ ...C.orden, carpetas: [] });
      const partes = [o.carpetas ? `${o.carpetas} carpeta(s) renombrada(s) o movida(s)` : "", o.movidos ? `${o.movidos} documento(s) a otra carpeta` : "", o.navegacion ? `${o.navegacion} escena(s) fuera de la barra de navegación` : ""].filter(Boolean);
      if (partes.length) (C.notas ??= []).push(`<b>Orden:</b> ${partes.join(", ")}.`);
    } catch (err) {
      console.error(`${MOD} | contenido: orden`, err);
      fallos.push("orden de carpetas y escenas");
    }
  }
  if (C.referencias) {
    try {
      const r = await aplicarReferencias(C.referencias);
      if (r) (C.notas ??= []).push(`${r} página(s) y biografía(s) con las referencias a los libros viejos puestas al día.`);
    } catch (err) {
      console.error(`${MOD} | contenido: referencias`, err);
      fallos.push("referencias a los libros viejos");
    }
  }
  if (C.borrar) {
    try {
      const b = await aplicarBorrado(C.borrar);
      if (b.diarios || b.carpetas) (C.notas ??= []).push(`${b.diarios} diario(s) viejo(s) y ${b.carpetas} carpeta(s) retirados.`);
    } catch (err) {
      console.error(`${MOD} | contenido: borrar`, err);
      fallos.push("retirar diarios viejos");
    }
  }
  try {
    await rematarEnlaces();
  } catch (err) {
    console.error(`${MOD} | contenido: enlaces`, err);
  }
  if (C.limpiarRespaldo) {
    try {
      const n = await limpiarRespaldoFichas();
      if (n) (C.notas ??= []).push(`Borré el respaldo de las ${n} fichas convertidas a PNJ (estaban bien; pesaba 2 MB y lo bajaba cada jugador al entrar).`);
    } catch (err) {
      console.error(`${MOD} | contenido: respaldo`, err);
    }
  }
  if (C.xpPreguntar) {
    try {
      if (await apagarXPAutomatica()) (C.notas ??= []).push("Monk's TokenBar ya no abre solo su ventana de XP al terminar un combate: ahora te llega la cuenta y eliges tú.");
    } catch (err) {
      console.error(`${MOD} | contenido: experiencia`, err);
    }
  }
  if (archivo === "contenido") await game.settings.set(MOD, "contenido", C.version);
  susurrarDM("Ecos de la frontera · contenido", [
    `${C.titulo ?? "Contenido"} (versión ${C.version}).`,
    ...(hechos ? [`${hechos} actor(es) al día.${nuevos.length ? ` Fichas nuevas (${nuevos.length})${nuevos.length <= 12 ? `: ${nuevos.join(", ")}` : ""}.` : ""}`] : []),
    ...(paginas ? [`${paginas} página(s) de diario escritas o actualizadas.`] : []),
    ...(fallos.length ? [`<b>No se pudo con:</b> ${fallos.join(", ")} (detalle en la consola, F12).`] : []),
    ...(C.notas ?? [])
  ]);
}

/* ---------- Girar tokens: solo con Ctrl + rueda ----------
 * Foundry gira lo seleccionado con Ctrl + rueda (de a poco) y con Shift + rueda (rápido). En esta campaña solo Ctrl:
 * Shift + rueda sobre tokens seleccionados no hace nada (con Ctrl + Shift sigue girando rápido). */
function soloCtrlGira() {
  const capa = canvas?.tokens;
  if (!capa || capa._ecosGiro || (typeof capa._onMouseWheel !== "function")) return;
  const original = capa._onMouseWheel;
  capa._onMouseWheel = function (event) {
    if (!(event?.ctrlKey || event?.metaKey)) return undefined;
    return original.call(this, event);
  };
  capa._ecosGiro = true;
}
Hooks.on("canvasReady", () => {
  try {
    soloCtrlGira();
  } catch (err) {
    console.warn(`${MOD} | giro con Ctrl`, err);
  }
});

/* ---------- Clima: los efectos de Simple Weather en FXMaster 8, tenues y sin amontonarse ----------
 * FXMaster 8 guarda cada partícula como «core_<tipo>» y apaga la que ya existe si se la vuelve a pedir; Simple Weather 2.2
 * quita las suyas buscando el nombre «swr-…», que ya no existe. Por eso los climas de días distintos se amontonaban
 * (lluvia + nieve + «cielo gris» a opacidad 1 = pantalla gris) y a veces el clima nuevo apagaba el viejo en vez de ponerse.
 * Aquí las peticiones de Simple Weather se juntan y se escriben de una vez en la escena: fuera lo que puso el clima antes,
 * dentro lo nuevo, con la niebla y las nubes más tenues. Lo que el DM pone a mano en FXMaster no se toca. */
const TOPE_CLIMA = { fog: { alpha: 0.3, density: 0.06 }, clouds: { alpha: 0.6, density: 0.3 } };
const FIRMAS_CLIMA = [
  ["clouds", 1, 0.1, 2.6, 0.3, 0.5, "#ffffff", true], ["clouds", 1, 0.1, 2.6, 0.6, 1, "#776e6e", true], ["clouds", 1, 0.2, 2.6, 0.1, 0.7, "#ffffff", true],
  ["clouds", 1, 0.4, 2, 0.03, 0.7, "#000000", false], ["embers", 1.3, 1, 1, 0.9, 1, "#ffffff", false], ["fog", 1, 0.3, 1, 0.08, 1, "#c2bdbd", true],
  ["fog", 1, 0.5, 1, 0.05, 0.4, "#ffffff", false], ["fog", 1, 0.5, 1, 0.08, 0.4, "#ffffff", false], ["fog", 1, 0.5, 1, 0.12, 0.4, "#ffffff", false],
  ["fog", 1, 1, 1, 0.15, 0.9, "#8f8c61", true], ["fog", 1, 1, 1, 0.15, 0.9, "#ffffff", false], ["fog", 1, 3.5, 1, 0.08, 0.4, "#ffffff", false],
  ["leaves", 0.7, 2.8, 1, 0.1, 0.8, "#4f4040", true], ["rain", 0.4, 0.1, 0.8, 0.1, 0.7, "#000000", false], ["rain", 1, 0.1, 0.8, 0.1, 0.7, "#ffffff", false],
  ["rain", 1, 0.5, 0.8, 1, 0.7, "#ffffff", false], ["rain", 1.3, 0.5, 0.8, 1.7, 0.7, "#ffffff", false], ["rainsimple", 4, 0.2, 0.2, 0.05, 1, "#ffffff", false],
  ["snow", 0.6, 1, 1, 0.1, 1, "#1d1d1b", true], ["snow", 0.6, 2, 1, 0.1, 1, "#1d1d1b", true], ["snow", 0.6, 3, 1, 0.2, 1, "#1d1d1b", true],
  ["snow", 1, 1, 1, 0.1, 1, "#ffffff", false], ["snow", 1, 2.8, 1, 0.1, 1, "#ffffff", false], ["snowstorm", 0.5, 1.5, 1, 0.9, 1, "#8f8c61", true],
  ["snowstorm", 0.5, 1.9, 1, 0.9, 1, "#8f8c61", true], ["snowstorm", 1, 1, 1, 0.9, 1, "#ffffff", false], ["snowstorm", 1, 1.5, 1, 0.9, 1, "#ffffff", false],
  ["snowstorm", 1, 1.9, 1, 0.9, 1, "#ffffff", false]
];
const climaFX = { lote: null, timer: null };

/** Escenas bajo techo (la taberna, una casa): el clima de Simple Weather no entra. Bandera de escena «sinClima». */
const sinClima = escena => !!escena?.getFlag?.(MOD, "sinClima");

/** El clima de hoy (lo último que pidió Simple Weather), para devolvérselo a una escena con el botón. */
function guardarClimaHoy(lote) {
  try {
    if (JSON.stringify(game.settings.get(MOD, "climaHoy") ?? []) !== JSON.stringify(lote)) game.settings.set(MOD, "climaHoy", lote);
  } catch (err) {
    console.warn(`${MOD} | clima de hoy`, err);
  }
}

/** Opciones de una partícula del clima con el tope de opacidad y densidad (niebla y nubes). */
function suavizarClima(tipo, opciones) {
  const o = foundry.utils.deepClone(opciones ?? {});
  for (const [k, v] of Object.entries(TOPE_CLIMA[tipo] ?? {})) if (Number(o[k]) > v) o[k] = v;
  return o;
}

/** ¿La puso el clima? (la marca del módulo, o los valores exactos de una de las de Simple Weather). */
function esDelClima(efecto) {
  if (!efecto?.type) return false;
  if (efecto.ecosClima) return true;
  const o = efecto.options ?? {};
  return FIRMAS_CLIMA.some(([t, sc, sp, li, de, al, ti, ap]) => (t === efecto.type) && (Number(o.scale) === sc) && (Number(o.speed) === sp)
    && (Number(o.lifetime) === li) && (Number(o.density) === de) && (Number(o.alpha) === al)
    && (String(o.tint?.value ?? "").toLowerCase() === ti) && (!!o.tint?.apply === ap));
}

/** Escribe el clima en la escena: fuera lo del clima anterior, dentro lo nuevo. Devuelve cuántos cambios hubo. */
async function escribirClima(escena, lote) {
  if (!escena) return 0;
  const bajoTecho = sinClima(escena);
  if (bajoTecho) lote = [];
  const antes = escena.getFlag("fxmaster", "effects") ?? {};
  const nuevos = {};
  for (const d of lote) nuevos[`core_${d.type}`] = { type: d.type, options: suavizarClima(d.type, d.options), ecosClima: true };
  const u = {};
  for (const [k, e] of Object.entries(antes)) if (esDelClima(e) && !(k in nuevos)) u[`flags.fxmaster.effects.-=${k}`] = null;
  for (const [k, e] of Object.entries(nuevos)) if (JSON.stringify(antes[k]) !== JSON.stringify(e)) u[`flags.fxmaster.effects.${k}`] = e;
  // Bajo techo, tampoco los relámpagos (los filtros «swr-…» de las tormentas).
  if (bajoTecho) for (const k of Object.keys(escena.getFlag("fxmaster", "filters") ?? {})) if (k.startsWith("swr-")) u[`flags.fxmaster.filters.-=${k}`] = null;
  if (!foundry.utils.isEmpty(u)) await escena.update(u);
  return Object.keys(u).length;
}

/** Las peticiones que llegan juntas (un cambio de clima) se escriben de una vez. Sin nada (null): el clima se quitó. */
function pedirClima(dato) {
  if (!game.user?.isGM) return;
  climaFX.lote ??= [];
  if (dato?.type) climaFX.lote.push({ type: dato.type, options: dato.options ?? {} });
  clearTimeout(climaFX.timer);
  climaFX.timer = setTimeout(() => {
    const lote = climaFX.lote ?? [];
    climaFX.lote = null;
    guardarClimaHoy(lote);
    escribirClima(canvas?.scene, lote).catch(err => console.warn(`${MOD} | clima`, err));
  }, 400);
}

// Simple Weather le pide las partículas a FXMaster con Hooks.call("fxmaster.switchParticleEffect", { name: "swr-…", type, options }).
(() => {
  const original = Hooks.call;
  if (original.__ecosClima) return;
  const envuelto = function (hook, ...args) {
    if ((hook === "fxmaster.switchParticleEffect") && String(args[0]?.name ?? "").startsWith("swr-") && game.modules?.get("fxmaster")?.active) {
      // Las de quitar llegan sin tipo y no hacen falta: el lote nuevo reemplaza al viejo.
      if (args[0]?.type) pedirClima(args[0]);
      return true;
    }
    return original.call(this, hook, ...args);
  };
  envuelto.__ecosClima = true;
  Hooks.call = envuelto;
})();
// Cuando Simple Weather apaga su clima (día despejado, o los efectos desactivados), vacía su lista: se quita lo que había.
Hooks.on("updateSetting", s => {
  if ((s?.key !== "simple-weather.activeFXMParticleEffects") || !game.user?.isGM || !game.modules.get("fxmaster")?.active) return;
  const v = game.settings.get("simple-weather", "activeFXMParticleEffects");
  if (Array.isArray(v) && !v.length) pedirClima(null);
});

/** Botón «Clima en esta escena»: la deja sin clima (bajo techo) o le devuelve el de hoy. Queda guardado en la escena. */
async function alternarClimaEscena(escena = canvas?.scene) {
  if (!escena || !game.user?.isGM) return;
  const quitar = !sinClima(escena);
  await escena.setFlag(MOD, "sinClima", quitar);
  const hoy = quitar ? [] : (game.settings.get(MOD, "climaHoy") ?? []);
  await escribirClima(escena, hoy);
  if (quitar && escena.weather) await escena.update({ weather: "" });
  ui.notifications.info(quitar
    ? `Sin clima en «${escena.name}»: bajo techo no entra la niebla, la lluvia ni la nieve, tampoco cuando cambie el día. El mismo botón lo devuelve.`
    : `Clima de vuelta en «${escena.name}»${hoy.length ? "" : " (hoy está despejado)"}.`);
}

/* ------------------------------------------------------------------ */
/*  Descansos: los PG vuelven gastando Dados de Golpe (v2.7)          */
/* ------------------------------------------------------------------ */
/*
 * Regla de la casa (Configuración → Ecos de la frontera → «Descansos y Dados de Golpe»):
 * - Descansar no devuelve PG por sí solo: vuelven gastando Dados de Golpe. La magia, las pociones y lo que cura siguen curando.
 * - Un Corto propone 1 Dado de Golpe (2 en Santuario), limitado por un presupuesto compartido de la mitad de un Largo; un Largo en Santuario, la mitad
 *   del nivel. A la intemperie el Descanso Largo cuenta como corto.
 * - Entre un descanso y el siguiente se gastan como mucho tantos Dados de Golpe como el bonificador de competencia.
 * Usan la regla las hojas que el DM encienda con el botón Ecos de su cabecera («Descansos»), PJ o PNJ.
 */
const DESC_DEF = { v272: true, regla: "hojas", corto: 1, cortoSantuario: 2, largo: "mitad", tope: "comp", fuera: "no", gastarLargo: true };
const LARGO_DG = { cuarto: "un cuarto del nivel", mitad: "la mitad del nivel", todos: "todos" };
const TOPE_DG = { comp: "el bonificador de competencia", mitad: "la mitad del nivel", sin: "sin tope" };
const EN_DESCANSO_CORTO = new Map();   // uuid → hasta cuándo (ms) dura la ventana de un Descanso Corto en este navegador
const GASTO_LARGO = new Map();         // uuid → { n, tope }: la ventana de gastar Dados de Golpe al terminar un Descanso Largo

function cfgDesc() {
  let g = {};
  try {
    g = game.settings.get(MOD, "descansos") ?? {};
  } catch {
    g = {};
  }
  return { ...DESC_DEF, ...g };
}

/** ¿Este actor usa los descansos de la casa? Se enciende hoja por hoja (botón Ecos: «Descansos»). */
function reglaDescanso(actor) {
  if (!actor || !["character", "npc"].includes(actor.type)) return false;
  if (cfgDesc().regla === "apagado") return false;
  return actor.getFlag?.(MOD, "descansos") === true;
}

const nivelDG = actor => ((actor?.type === "npc")
  ? Math.max(1, Number(actor.system.attributes?.hd?.max) || 1)
  : Math.max(1, Number(actor?.system?.details?.level) || 1));
const dgUsados = actor => Number(actor?.getFlag?.(MOD, "dgUso")) || 0;
const dgDisponibles = actor => Math.max(0, Number(actor?.system?.attributes?.hd?.value) || 0);

/** Dados de Golpe que devuelve un descanso. */
function dgARecuperar(actor, tipo, santuario = enSantuario()) {
  const c = cfgDesc();
  const largo = recuperacionDGLarga(nivelDG(actor), c.largo);
  if (tipo === "long") return largo;
  return presupuestoCorto(largo, actor.getFlag(MOD, "dgRecCortos"), santuario ? c.cortoSantuario : c.corto).cantidad;
}

/** Cuántos Dados de Golpe se pueden gastar por descanso. */
function topeDG(actor) {
  const c = cfgDesc();
  if (c.tope === "sin") return Infinity;
  if (c.tope === "mitad") return Math.ceil(nivelDG(actor) / 2);
  return Math.max(1, Number(actor?.system?.attributes?.prof) || 2);
}

/** Lo que le queda por gastar ahora (en la ventana del Descanso Largo, o desde el último descanso). */
function dgQuedan(actor) {
  const v = GASTO_LARGO.get(actor.uuid);
  const tope = v ? v.tope : topeDG(actor);
  return Number.isFinite(tope) ? Math.max(0, tope - (v ? v.n : dgUsados(actor))) : Infinity;
}

const enDescansoCorto = actor => (EN_DESCANSO_CORTO.get(actor?.uuid) ?? 0) > Date.now();

/** La explicación de una línea que se pone en las ventanas de descanso. */
function notaReglaDG(actor, tipo) {
  const rec = dgARecuperar(actor, tipo);
  const quedan = dgQuedan(actor);
  const tope = Number.isFinite(quedan) ? ` Puedes gastar <b>${quedan}</b> más (tope: ${TOPE_DG[cfgDesc().tope]}, ${topeDG(actor)}).` : "";
  return `<b>Descansos de la casa:</b> descansar no devuelve PG; se recuperan gastando Dados de Golpe.${tope} Los cortos comparten un límite de recuperación entre largos: ${Math.floor(recuperacionDGLarga(nivelDG(actor), cfgDesc().largo) / 2)} DG en total. Al terminar recuperas <b>${plural(rec, "Dado de Golpe", "Dados de Golpe")}</b>${(tipo !== "long") && enSantuario() ? " (en Santuario)" : ""}.`;
}

/* El tope y «solo durante un descanso». */
Hooks.on("dnd5e.preRollHitDieV2", config => {
  const actor = config?.subject;
  if (!reglaDescanso(actor) || (config.modifyHitDice === false)) return;
  const v = GASTO_LARGO.get(actor.uuid);
  if (!v && (cfgDesc().fuera === "no") && !enDescansoCorto(actor)) {
    ui.notifications.warn(`${actor.name}: los Dados de Golpe se gastan durante un descanso (corto o largo).`);
    return false;
  }
  if (dgQuedan(actor) <= 0) {
    const tope = v ? v.tope : topeDG(actor);
    ui.notifications.warn(`${actor.name} ya gastó ${plural(tope, "Dado de Golpe", "Dados de Golpe")} ${v ? "en este descanso" : "desde su último descanso"}: es su tope (${TOPE_DG[cfgDesc().tope]}).`);
    return false;
  }
});

/* Cuenta cada Dado de Golpe gastado (va en la misma actualización que el dado). */
Hooks.on("dnd5e.rollHitDieV2", (rolls, datos) => {
  const actor = datos?.subject;
  const updates = datos?.updates;
  if (!updates || !reglaDescanso(actor)) return;
  const gasta = ("system.hd.spent" in (updates.class ?? {})) || ("system.attributes.hd.spent" in (updates.actor ?? {}));
  if (!gasta) return;
  const v = GASTO_LARGO.get(actor.uuid);
  if (v) v.n += 1;
  else (updates.actor ??= {})[`flags.${MOD}.dgUso`] = dgUsados(actor) + 1;
});

/* Descanso Corto con la regla: en vez de la ventana del sistema, la de la casa (recuperar y después gastar). */
Hooks.on("dnd5e.preShortRest", (actor, config) => {
  if (!reglaDescanso(actor)) return;
  EN_DESCANSO_CORTO.set(actor.uuid, Date.now() + (45 * 60 * 1000));
  if (config?.ecos?.listo) return;
  // La noche a la intemperie ya pasó por su propia ventana: se descansa y después se gastan los dados.
  if (config?.ecos?.intemperie) {
    config.dialog = false;
    return;
  }
  dialogoDescansoDG(actor, "short", config).catch(err => console.error(`${MOD} | descanso corto`, err));
  return false;
});

/* Descanso Largo con la regla de una hoja que no es PJ (los PJ tienen la suya, con Santuario y heridas). */
Hooks.on("dnd5e.preLongRest", (actor, config) => {
  if (!reglaDescanso(actor) || esPJ(actor) || config?.ecos?.listo) return;
  dialogoDescansoDG(actor, "long", config).catch(err => console.error(`${MOD} | descanso largo`, err));
  return false;
});

/** La ventana de antes de descansar: cuántos Dados de Golpe recupera y cuántos podrá gastar después. */
async function dialogoDescansoDG(actor, tipo, config = {}) {
  const largo = tipo === "long";
  const hp = actor.system.attributes.hp;
  const hd = actor.system.attributes.hd;
  const total = Number(hd?.max) || 0;
  const disp = dgDisponibles(actor);
  const gastados = Math.max(0, total - disp);
  const limite = dgARecuperar(actor, tipo);
  const maxRec = Math.min(limite, gastados);
  const tope = topeDG(actor);
  const grave = esPJ(actor) && heridoGrave(actor) && !enSantuario();
  const opciones = Array.from({ length: maxRec + 1 }, (_, i) => maxRec - i)
    .map(n => `<option value="${n}">${n === 0 ? "No recuperar" : `Recuperar ${n}`}</option>`).join("");
  const filaRec = largo
    ? (gastados ? `<select name="dg">${opciones}</select><div class="ecos-nota">Hasta ${LARGO_DG[cfgDesc().largo]}: ${limite}. Tienes ${gastados} gastados de ${total}.</div>`
      : `Ninguno: no tienes Dados de Golpe gastados.<input type="hidden" name="dg" value="0">`)
    : `${gastados ? `<b>${plural(Math.min(limite, gastados), "Dado de Golpe", "Dados de Golpe")}</b>` : "Ninguno: no tienes Dados de Golpe gastados"}${enSantuario() ? " (en Santuario)" : ""}.`;
  const despues = grave
    ? "Estás herido grave y fuera de un Santuario: no puedes curarte con Dados de Golpe."
    : (cfgDesc().gastarLargo ? `Al terminar se abre una ventana para <b>gastar</b> ${Number.isFinite(tope) ? `hasta <b>${tope}</b>` : "los"} Dados de Golpe y curarte.`
      : `Puedes gastar ${Number.isFinite(tope) ? `hasta ${tope}` : "los"} Dados de Golpe desde la hoja.`);
  const content = `<div class="ecos-dialogo">
    <p><b>Descansar no devuelve PG:</b> se recuperan gastando Dados de Golpe (y con magia, pociones o técnicas que curan).</p><p class="ecos-nota">Todos los cortos juntos reponen como máximo la mitad de los DG de un largo, redondeada hacia abajo; se renueva al completar un largo. En nivel 1 puede ser 0: aún puedes gastar tus dados disponibles.</p>
    <table class="ecos-tabla">
      <tr><th>Puntos de Golpe</th><td><b>${hp.value}</b> / ${hp.effectiveMax}</td></tr>
      <tr><th>Dados de Golpe</th><td>${disp} de ${total} disponibles</td></tr>
      <tr><th>Recuperas</th><td>${filaRec}</td></tr>
      <tr><th>Después</th><td>${despues}</td></tr>
    </table>
    ${largo ? `<label class="ecos-check"><input type="checkbox" name="nuevoDia" ${config.newDay !== false ? "checked" : ""}> Empieza un nuevo día</label>` : ""}
  </div>`;
  const r = await foundry.applications.api.DialogV2.wait({
    window: { title: `${largo ? "Descanso Largo" : "Descanso Corto"} · ${actor.name}`, icon: `fa-solid ${largo ? "fa-bed" : "fa-mug-hot"}` },
    position: { width: 460 },
    content,
    rejectClose: false,
    buttons: [
      { action: "descansar", label: "Descansar", icon: "fa-solid fa-moon", default: true, callback: (ev, boton) => leerFormulario(boton) },
      { action: "cancelar", label: "Cancelar", icon: "fa-solid fa-xmark" }
    ]
  });
  if (!r || (typeof r === "string")) return;
  const ecos = { ...(config.ecos ?? {}), listo: true };
  if (largo) {
    return actor.longRest({ ...config, dialog: false, newDay: !!r.nuevoDia, maxHitDice: Math.clamp(Number(r.dg ?? 0) || 0, 0, maxRec), ecos });
  }
  return actor.shortRest({ ...config, dialog: false, ecos });
}

/* El resultado del descanso: sin PG por descansar, y los Dados de Golpe de la casa. */
Hooks.on("dnd5e.preRestCompleted", (actor, result, config) => {
  try {
    if (!reglaDescanso(actor) || !result) return;
    const largo = config?.type === "long";
    ajustarRecuperacionDG(actor, result, { largo, limiteRec: dgARecuperar(actor, largo ? "long" : "short"), maxHitDice: config?.maxHitDice, mod: MOD });
  } catch (err) {
    console.error(`${MOD} | descansos de la casa`, err);
  }
});

Hooks.on("dnd5e.restCompleted", (actor, result, config) => {
  try {
    EN_DESCANSO_CORTO.delete(actor?.uuid);
    if (!reglaDescanso(actor) || !["long", "short"].includes(config?.type) || !cfgDesc().gastarLargo || !actor.isOwner) return;
    // Herido grave fuera de un Santuario: no se cura con Dados de Golpe.
    if (esPJ(actor) && heridoGrave(actor) && !enSantuario()) return;
    // Lo descansado solo lo ve quien descansó (el hook es local): ahí se abre la ventana para gastar los dados.
    const recuperados = Number(result?.ecosDG?.recuperados) || 0;
    const lleno = (actor.system.attributes.hp.value ?? 0) >= (actor.system.attributes.hp.effectiveMax ?? 0);
    if (lleno || !dgDisponibles(actor)) {
      if (recuperados) ui.notifications.info(`${actor.name} recuperó ${plural(recuperados, "Dado de Golpe", "Dados de Golpe")}${lleno ? " (tiene todos sus PG)" : ""}.`);
      return;
    }
    setTimeout(() => {
      try {
        Promise.resolve(abrirGastoDG(actor, { tipo: config.type, recuperados })).catch(err => {
          console.error(`${MOD} | gastar Dados de Golpe`, err);
          ui.notifications.error("Ecos de la frontera: no pude abrir la ventana para gastar Dados de Golpe (detalle en la consola, F12).");
        });
      } catch (err) {
        console.error(`${MOD} | gastar Dados de Golpe`, err);
      }
    }, 300);
  } catch (err) {
    console.warn(`${MOD} | gastar Dados de Golpe`, err);
  }
});

/* La nota de la regla dentro de las ventanas de descanso del sistema (Descanso Corto, y el Largo de las hojas sin el nuestro). */
function notaEnDescanso(app, html, tipo) {
  try {
    const actor = app?.actor ?? app?.options?.document;
    if (!reglaDescanso(actor)) return;
    const raiz = (html instanceof HTMLElement) ? html : (app.element instanceof HTMLElement ? app.element : html?.[0]);
    const cont = raiz?.querySelector?.("form") ?? raiz?.querySelector?.(".window-content");
    if (!cont) return;
    cont.querySelector(".ecos-dg-nota")?.remove();
    const p = document.createElement("p");
    p.className = "ecos-nota ecos-dg-nota";
    p.innerHTML = notaReglaDG(actor, tipo) + ((tipo === "long") && cfgDesc().gastarLargo ? " Al terminar se abre una ventana para gastarlos." : "");
    cont.prepend(p);
  } catch (err) {
    console.warn(`${MOD} | nota de descanso`, err);
  }
}
Hooks.on("renderShortRestDialog", (app, html) => notaEnDescanso(app, html, "short"));
Hooks.on("renderLongRestDialog", (app, html) => notaEnDescanso(app, html, "long"));

/* ---------- La ventana para gastar Dados de Golpe al terminar un Descanso Largo ---------- */
class GastarDG extends foundry.applications.api.ApplicationV2 {
  static DEFAULT_OPTIONS = {
    classes: ["ecos-gastar-dg"],
    window: { title: "Gastar Dados de Golpe", icon: "fa-solid fa-heart-pulse" },
    position: { width: 400, height: "auto" },
    actions: { tirar: GastarDG.#tirar, listo: GastarDG.#listo }
  };

  constructor(actor, { tipo = "long", recuperados = 0, ...opciones } = {}) {
    super({ id: `ecos-gastar-dg-${actor.id}`, ...opciones });
    this.actor = actor;
    this.tipoDescanso = tipo;
    this.recuperados = recuperados;
  }

  get title() {
    return `Gastar Dados de Golpe · ${this.actor.name}`;
  }

  static async #tirar(event, target) {
    if (this._tirando) return;
    this._tirando = true;
    try {
      if (dgQuedan(this.actor) > 0) await this.actor.rollHitDie({ denomination: target.dataset.dado });
    } finally {
      this._tirando = false;
    }
    if ((dgQuedan(this.actor) <= 0) || !dgDisponibles(this.actor)) return this.close();
    this.render();
  }

  static #listo() {
    this.close();
  }

  async _renderHTML() {
    const a = this.actor;
    const hp = a.system.attributes.hp;
    const quedan = dgQuedan(a);
    const dados = (a.type === "npc")
      ? (dgDisponibles(a) ? [[`d${a.system.attributes.hd.denomination}`, dgDisponibles(a)]] : [])
      : Object.entries(a.system.attributes.hd?.bySize ?? {}).filter(([, n]) => n > 0);
    const con = a.system.abilities?.con?.mod ?? 0;
    const tope = efectoMalherido(a) ? ` <span class="ecos-nota">(Malherido: no sube de ${topeMalherido(a)})</span>` : "";
    const botones = dados.map(([d, n]) => `<button type="button" data-action="tirar" data-dado="${d}" ${quedan <= 0 ? "disabled" : ""}>
      <i class="fa-solid fa-dice"></i> Gastar un ${d} <span class="ecos-nota">(${d} ${signo(con)}; te quedan ${n})</span></button>`).join("");
    return `<div class="ecos-dialogo">
      <p>Terminó el ${this.tipoDescanso === "short" ? "Descanso Corto" : "Descanso Largo"}${this.recuperados ? ` y recuperaste <b>${plural(this.recuperados, "Dado de Golpe", "Dados de Golpe")}</b>` : ""}. Los PG no vuelven solos: <b>gasta Dados de Golpe</b> para curarte.</p>
      <table class="ecos-tabla">
        <tr><th>Puntos de Golpe</th><td><b>${hp.value}</b> / ${hp.effectiveMax}${tope}</td></tr>
        <tr><th>Puedes gastar</th><td>${Number.isFinite(quedan) ? `<b>${quedan}</b> más en este descanso` : "los que quieras"}</td></tr>
      </table>
      <div class="ecos-dg-botones">${botones || "<p>No te quedan Dados de Golpe.</p>"}</div>
      <p class="ecos-nota">Si cierras la ventana, lo que no gastaste se guarda para otro descanso.</p>
      <div class="ecos-botones"><button type="button" data-action="listo"><i class="fa-solid fa-check"></i> Listo</button></div>
    </div>`;
  }

  _replaceHTML(result, content) {
    content.innerHTML = result;
  }

  _onClose(options) {
    GASTO_LARGO.delete(this.actor.uuid);
    return super._onClose?.(options);
  }
}

function abrirGastoDG(actor, datos = {}) {
  if (!actor?.isOwner) return null;
  const ya = foundry.applications.instances?.get?.(`ecos-gastar-dg-${actor.id}`);
  if (ya?.rendered) return ya.bringToFront?.();
  GASTO_LARGO.set(actor.uuid, { n: 0, tope: topeDG(actor) });
  return new GastarDG(actor, datos).render({ force: true });
}

/** Da (true) o quita (false o null) los descansos de la casa a una hoja. */
async function marcarDescanso(actor, valor) {
  if (!game.user.isGM || !actor) return;
  if (valor) await actor.setFlag(MOD, "descansos", true);
  else await actor.unsetFlag(MOD, "descansos");
  ajustesDescansos?.rendered && ajustesDescansos.render();
}

/* ---------- El menú: Configuración → Ecos de la frontera → Descansos y Dados de Golpe ---------- */
let ajustesDescansos = null;
class AjustesDescansos extends foundry.applications.api.ApplicationV2 {
  static DEFAULT_OPTIONS = {
    id: "ecos-ajustes-descansos",
    tag: "form",
    classes: ["ecos-ajustes-descansos"],
    window: { title: "Descansos y Dados de Golpe", icon: "fa-solid fa-bed-pulse", resizable: true },
    position: { width: 560, height: "auto" },
    form: { handler: AjustesDescansos.#guardar, submitOnChange: false, closeOnSubmit: false },
    actions: { quitar: AjustesDescansos.#quitar, anadir: AjustesDescansos.#anadir, abrir: AjustesDescansos.#abrir, defecto: AjustesDescansos.#defecto }
  };

  constructor(opciones = {}) {
    super(opciones);
    ajustesDescansos = this;
  }

  static async #guardar(event, form, formData) {
    const d = foundry.utils.expandObject(formData.object);
    const n = (v, def) => Math.clamp(Math.round(Number(v)), 0, 20) || ((Number(v) === 0) ? 0 : def);
    await game.settings.set(MOD, "descansos", {
      v272: true,
      regla: (d.regla === "apagado") ? "apagado" : "hojas",
      corto: n(d.corto, 1), cortoSantuario: n(d.cortoSantuario, 2),
      largo: LARGO_DG[d.largo] ? d.largo : "mitad", tope: TOPE_DG[d.tope] ? d.tope : "comp",
      fuera: (d.fuera === "si") ? "si" : "no", gastarLargo: !!d.gastarLargo
    });
    ui.notifications.info("Descansos: guardado.");
    for (const app of foundry.applications.instances?.values?.() ?? []) if ((app.document instanceof Actor) && app.rendered) app.render();
    this.render();
  }

  static async #quitar(event, target) {
    await marcarDescanso(game.actors.get(target.dataset.id), false);
    this.render();
  }

  static async #anadir() {
    const sel = canvas?.tokens?.controlled ?? [];
    if (!sel.length) return ui.notifications.warn("Selecciona en la escena los tokens a los que quieres darles los descansos de la casa.");
    for (const t of sel) if (t.actor) await marcarDescanso(t.actor.isToken ? (t.actor.token?.baseActor ?? t.actor) : t.actor, true);
    this.render();
  }

  static #abrir(event, target) {
    game.actors.get(target.dataset.id)?.sheet?.render(true);
  }

  static async #defecto() {
    await game.settings.set(MOD, "descansos", { ...DESC_DEF });
    this.render();
  }

  async _renderHTML() {
    const c = cfgDesc();
    const opt = (lista, v) => Object.entries(lista).map(([k, t]) => `<option value="${k}" ${k === v ? "selected" : ""}>${t}</option>`).join("");
    const num = (name, v) => `<input type="number" name="${name}" value="${v}" min="0" max="20" step="1" style="width:4.5em">`;
    const usan = game.actors.filter(a => reglaDescanso(a)).sort((a, b) => a.name.localeCompare(b.name));
    const fila = a => `<li><a data-action="abrir" data-id="${a.id}">${escH(a.name)}</a>
      <span class="ecos-nota">${a.type === "npc" ? "PNJ" : "Personaje"} · ${a.type === "npc" ? "Dados de Golpe" : "nivel"} ${nivelDG(a)} · tope ${Number.isFinite(topeDG(a)) ? topeDG(a) : "—"}</span>
      <button type="button" data-action="quitar" data-id="${a.id}" data-tooltip="Que descanse como en el manual"><i class="fa-solid fa-xmark"></i></button></li>`;
    return `<div class="ecos-dialogo">
      <p>Con los descansos de la casa, <b>descansar no devuelve PG</b>: se recuperan gastando Dados de Golpe. La magia, las pociones y lo que cura siguen curando igual.</p>
      <table class="ecos-tabla">
        <tr><th>Quién la usa</th><td><select name="regla">${opt({ hojas: "Las hojas con «Descansos» encendido (botón Ecos de cada hoja)", apagado: "Nadie: todas descansan como en el manual" }, c.regla === "apagado" ? "apagado" : "hojas")}</select></td></tr>
        <tr><th>Descanso Corto</th><td>recupera ${num("corto", c.corto)} Dado(s) de Golpe · en Santuario ${num("cortoSantuario", c.cortoSantuario)}</td></tr>
        <tr><th>Descanso Largo (Santuario)</th><td>recupera <select name="largo">${opt(LARGO_DG, c.largo)}</select> <span class="ecos-nota">(redondeando hacia arriba; a la intemperie cuenta como corto)</span></td></tr>
        <tr><th>Tope por descanso</th><td><select name="tope">${opt(TOPE_DG, c.tope)}</select></td></tr>
        <tr><th>Fuera de un descanso</th><td><select name="fuera">${opt({ no: "No se gastan Dados de Golpe", si: "Se pueden gastar (cuentan para el tope)" }, c.fuera)}</select></td></tr>
        <tr><th>Al terminar un descanso</th><td><label class="ecos-check"><input type="checkbox" name="gastarLargo" ${c.gastarLargo ? "checked" : ""}> Abrir la ventana para gastar Dados de Golpe (Corto y Largo)</label></td></tr>
      </table>
      <div class="ecos-botones">
        <button type="submit"><i class="fa-solid fa-floppy-disk"></i> Guardar</button>
        <button type="button" data-action="defecto"><i class="fa-solid fa-rotate-left"></i> Valores recomendados</button>
      </div>
      <p>Los valores del corto están limitados: todos los cortos entre largos reponen hasta la mitad de lo que repone un largo (hacia abajo). Un largo renueva ese presupuesto; no se regeneran dados repitiendo pausas.</p>
      <h3>Hojas con los descansos de la casa (${usan.length})</h3>
      <ul class="ecos-lista-desc">${usan.map(fila).join("") || "<li>Ninguna.</li>"}</ul>
      <div class="ecos-botones"><button type="button" data-action="anadir"><i class="fa-solid fa-plus"></i> Dárselos a los tokens seleccionados</button></div>
      <p class="ecos-nota">En cada hoja (PJ o PNJ), el botón <b>Ecos</b> de arriba los enciende o los apaga. También en Menú del DM → Hojas.</p>
    </div>`;
  }

  _replaceHTML(result, content) {
    content.innerHTML = result;
  }
}

/* ------------------------------------------------------------------ */
/*  Funciones de cada hoja: el botón «Ecos» de la cabecera (solo DM)   */
/*  Todo se enciende hoja por hoja, PJ o PNJ. Una hoja nueva nace con  */
/*  todo apagado. Ya no cuenta la carpeta.                             */
/* ------------------------------------------------------------------ */

const verbeApi = () => game.modules.get(MOD)?.api?.verbe ?? null;
const HOJA_TIPOS = ["character", "npc"];

const FUNCIONES_HOJA = [
  {
    k: "pj", n: "Reglas de PJ", ic: "fa-heart-pulse",
    d: "Las reglas de supervivencia de la casa para esta hoja:",
    lista: [
      "A 0 PG queda <b>Acechado por la Muerte</b> (no cae inconsciente ni muere); las salvaciones de muerte dejan Secuela en vez de matar. Muere con Agotamiento 6, con FUE, DES o CON en 0 o por daño masivo.",
      "<b>Malherido</b> por golpe brutal, heridas sin tratar y tratamientos de Medicina (botón Curar).",
      "<b>Descanso Largo</b> en Santuario o a la intemperie, el nuevo día y la vigilia (quien no duerme tira CON).",
      "<b>Monedas Antiguas</b> para repetir un 1 natural.",
      "<b>Oficio y Prestigio</b> en la hoja, y los botones <b>Trabajar</b>, <b>Mercado</b> y <b>Curar</b> (los ve su dueño).",
      "Cuenta en el <b>grupo</b>: encuentros, Día siguiente, Estado de los PJ y la Jornada de trabajo.",
      "En un PNJ, además: sus tiradas ya no se esconden y deja de avisar moral y etapas (eso es de enemigos): queda como aliado del grupo."
    ]
  },
  {
    k: "descansos", n: "Descansos con Dados de Golpe", ic: "fa-bed-pulse",
    d: "Descansar no le devuelve PG: se cura gastando Dados de Golpe, con tope por descanso. Antes de cada descanso sale una ventana con lo que recupera y, al terminar, otra para gastar los dados. Cuánto se recupera y el tope se ajustan en Menú del DM → Descansos."
  },
  {
    k: "verbe", n: "Verbe", ic: "fa-droplet",
    d: "La capa del Verbe en esta hoja. Al despertarla eliges el linaje y la naturaleza, y la hoja gana su barra y su panel. Mientras no la despiertes, nada del Verbe se ve en la hoja."
  },
  {
    k: "portador", n: "Sangre que responde (secreto)", ic: "fa-hourglass-half",
    d: "Solo lo ves tú. Un golpe de daño masivo no lo mata y, al caer a 0 PG, te avisa de que su sangre puede responder (Tramas · 3). Funciona junto con las Reglas de PJ."
  }
];

/** ¿Está encendida esa función en la hoja? */
function funcionEncendida(actor, k) {
  if (!actor) return false;
  if (k === "verbe") return !!verbeApi()?.despierto?.(actor);
  return actor.getFlag?.(MOD, k) === true;
}

/** Enciende o apaga una función de la hoja (solo DM). El Verbe se despierta con su propia ventana. */
async function ponerFuncion(actor, k, valor) {
  if (!game.user.isGM || !actor || !HOJA_TIPOS.includes(actor.type)) return;
  if (k === "verbe") {
    const v = verbeApi();
    if (!v) return ui.notifications.warn("El Verbe está apagado en este mundo (Menú del DM → Ajustes → Capa V).");
    return funcionEncendida(actor, "verbe") ? v.abrir(actor) : v.despertar(actor);
  }
  if (!FUNCIONES_HOJA.some(f => f.k === k)) return;
  if (valor) await actor.setFlag(MOD, k, true);
  else await actor.unsetFlag(MOD, k);
  if (k === "pj") {
    try {
      actualizarEstado();
    } catch {
      /* la página de estado se rehace sola después */
    }
  }
  refrescarFunciones(actor);
}

/** Vuelve a pintar las ventanas que muestran las funciones de esa hoja. */
function refrescarFunciones(actor) {
  for (const app of foundry.applications.instances?.values?.() ?? []) {
    if (!app.rendered) continue;
    if ((app instanceof FuncionesHoja) && (app.actor === actor)) app.render();
    if ((app instanceof PanelDM) && (app._tab === "hojas")) app.render();
  }
  ajustesDescansos?.rendered && ajustesDescansos.render();
}

class FuncionesHoja extends foundry.applications.api.ApplicationV2 {
  static DEFAULT_OPTIONS = {
    classes: ["ecos-funciones"],
    window: { icon: "fa-solid fa-sliders", resizable: true },
    position: { width: 560, height: "auto" },
    actions: {
      alternar: FuncionesHoja.#alternar, todo: FuncionesHoja.#todo, nada: FuncionesHoja.#nada,
      menu: () => abrirPanelDM("hojas")
    }
  };

  constructor(actor, opciones = {}) {
    super({ id: `ecos-funciones-${actor.uuid.replace(/\./g, "-")}`, window: { title: `Ecos · ${actor.name}` }, ...opciones });
    this.actor = actor;
  }

  static async #alternar(event, target) {
    const k = target.dataset.k;
    await ponerFuncion(this.actor, k, !funcionEncendida(this.actor, k));
  }

  static async #todo() {
    for (const f of FUNCIONES_HOJA) if ((f.k !== "verbe") && (f.k !== "portador")) await ponerFuncion(this.actor, f.k, true);
  }

  static async #nada() {
    for (const f of FUNCIONES_HOJA) if (f.k !== "verbe") await ponerFuncion(this.actor, f.k, false);
  }

  async _renderHTML() {
    const a = this.actor;
    const v = verbeApi();
    const filas = FUNCIONES_HOJA.map(f => {
      const si = funcionEncendida(a, f.k);
      let control;
      if (f.k === "verbe") {
        control = !v ? `<span class="ecos-nota">Apagado en el mundo</span>`
          : `<button type="button" data-action="alternar" data-k="verbe" class="ecos-fn-sw ${si ? "activo" : ""}"><i class="fa-solid ${si ? "fa-book-open" : "fa-sun"}"></i> ${si ? "Despierto · panel" : "Despertar"}</button>`;
      } else {
        control = `<button type="button" data-action="alternar" data-k="${f.k}" class="ecos-fn-sw ${si ? "activo" : ""}"><i class="fa-solid ${si ? "fa-toggle-on" : "fa-toggle-off"}"></i> ${si ? "SÍ" : "NO"}</button>`;
      }
      const lista = f.lista ? `<ul>${f.lista.map(x => `<li>${x}</li>`).join("")}</ul>` : "";
      const aviso = ((f.k === "portador") && si && !funcionEncendida(a, "pj")) ? `<p class="ecos-nota ecos-fn-aviso">Sin las Reglas de PJ no hace nada.</p>` : "";
      return `<section class="ecos-fn ${si ? "activo" : ""}">
        <div class="ecos-fn-control">${control}</div>
        <div class="ecos-fn-texto"><h4><i class="fa-solid ${f.ic}"></i> ${f.n}</h4><p>${f.d}</p>${lista}${aviso}</div>
      </section>`;
    }).join("");
    const token = a.isToken ? `<p class="ecos-nota ecos-fn-aviso">Es la copia de un token sin vincular: lo que cambies vale solo para este token. Para todas sus copias, ábrela desde la pestaña de Actores.</p>` : "";
    return `<p class="ecos-nota">Lo que enciendas aquí vale solo para esta hoja (${a.type === "npc" ? "PNJ" : "personaje"}). Una hoja nueva nace con todo apagado. Solo tú ves este botón.</p>
      ${token}${filas}
      <div class="ecos-botones">
        <button type="button" data-action="todo"><i class="fa-solid fa-toggle-on"></i> Reglas de PJ y descansos</button>
        <button type="button" data-action="nada"><i class="fa-solid fa-toggle-off"></i> Apagar todo</button>
        <button type="button" data-action="menu"><i class="fa-solid fa-users"></i> Todas las hojas</button>
      </div>`;
  }

  _replaceHTML(result, content) {
    content.innerHTML = result;
  }
}

function abrirFunciones(actor) {
  if (!game.user.isGM || !actor) return null;
  const id = `ecos-funciones-${actor.uuid.replace(/\./g, "-")}`;
  const ya = foundry.applications.instances?.get?.(id);
  if (ya) return ya.render({ force: true });
  return new FuncionesHoja(actor).render({ force: true });
}

/* El botón «Ecos» arriba de cada hoja de personaje o de PNJ (solo el DM lo ve). */
function decorarHojaEcos(app, html) {
  try {
    const actor = app?.document ?? app?.actor;
    if (!game.user.isGM || !(actor instanceof Actor) || !HOJA_TIPOS.includes(actor.type)) return;
    const raiz = (app.element instanceof HTMLElement) ? app.element : (app.element?.[0] ?? html?.[0] ?? html);
    const cab = raiz?.querySelector?.(".window-header");
    if (!cab) return;
    cab.querySelector(".ecos-funciones-cab")?.remove();
    const n = FUNCIONES_HOJA.filter(f => funcionEncendida(actor, f.k)).length;
    const antes = cab.querySelector("[data-action=\"close\"], .close, [data-action=\"toggleControls\"]");
    const b = document.createElement((app.element instanceof HTMLElement) ? "button" : "a");
    if (b.tagName === "BUTTON") b.type = "button";
    b.className = `header-control ecos-cabecera ecos-funciones-cab${n ? " activo" : ""}`;
    const ayuda = n ? `Ecos: ${FUNCIONES_HOJA.filter(f => funcionEncendida(actor, f.k)).map(f => f.n).join(", ")}. Clic para cambiarlo (solo tú lo ves).`
      : "Ecos: esta hoja no tiene nada encendido. Clic para encender reglas de PJ, descansos o Verbe (solo tú lo ves).";
    b.dataset.tooltip = ayuda;
    b.setAttribute("aria-label", ayuda);
    b.innerHTML = `<i class="fa-solid fa-sliders"></i><span>Ecos${n ? ` · ${n}` : ""}</span>`;
    b.addEventListener("click", ev => {
      ev.preventDefault();
      ev.stopPropagation();
      Promise.resolve(abrirFunciones(actor)).catch(err => console.error(`${MOD} | funciones`, err));
    });
    b.addEventListener("pointerdown", ev => ev.stopPropagation());
    cab.insertBefore(b, antes ?? null);
  } catch (err) {
    console.warn(`${MOD} | botón Ecos`, err);
  }
}
Hooks.on("renderActorSheetV2", decorarHojaEcos);

/* Al cambiar una función, la ventana de esa hoja y la lista del Menú del DM se ponen al día. */
Hooks.on("updateActor", (actor, changes) => {
  if (!game.user.isGM) return;
  const f = changes?.flags?.[MOD];
  if (f && Object.keys(f).some(k => ["pj", "descansos", "portador", "-=pj", "-=descansos", "-=portador", "verbe"].includes(k))) refrescarFunciones(actor);
});

/** Las filas de la pestaña «Hojas» del Menú del DM. */
function htmlHojas(filtro = "personajes") {
  const v = verbeApi();
  const algo = a => FUNCIONES_HOJA.some(f => funcionEncendida(a, f.k));
  const todos = game.actors.filter(a => HOJA_TIPOS.includes(a.type));
  const lista = todos.filter(a => (filtro === "todas") || ((filtro === "pnj") ? (a.type === "npc") : ((a.type === "character") || algo(a))))
    .sort((a, b) => (Number(algo(b)) - Number(algo(a))) || a.name.localeCompare(b.name));
  const nuevas = todos.filter(a => (a.type === "character") && a.hasPlayerOwner && !algo(a));
  const duenos = a => game.users.filter(u => !u.isGM && a.testUserPermission(u, "OWNER")).map(u => u.name).join(", ");
  const chip = (a, k, et) => {
    const si = funcionEncendida(a, k);
    return `<button type="button" class="ecos-chip ${si ? "activo" : ""}" data-action="fnHoja" data-id="${a.id}" data-k="${k}" data-tooltip="${escH(FUNCIONES_HOJA.find(f => f.k === k)?.n ?? et)}: ${si ? "SÍ" : "NO"}">${et}</button>`;
  };
  const filas = lista.map(a => {
    const d = duenos(a);
    const nivel = (a.type === "npc") ? `VD ${a.system.details?.cr ?? "?"}` : `nivel ${a.system.details?.level ?? 0}`;
    const vb = v ? `<button type="button" class="ecos-chip ${funcionEncendida(a, "verbe") ? "activo" : ""}" data-action="fnHoja" data-id="${a.id}" data-k="verbe">${funcionEncendida(a, "verbe") ? "Verbe" : "Despertar"}</button>` : "";
    return `<li class="ecos-hoja-fila ecos-buscable" data-texto="${escH(`${a.name} ${a.folder?.name ?? ""} ${d}`.toLowerCase())}">
      <img src="${escH(a.img)}" alt="">
      <span class="ecos-hoja-nombre"><a data-action="abrirHoja" data-id="${a.id}">${escH(a.name)}</a>
        <small>${a.type === "npc" ? "PNJ" : "Personaje"} · ${nivel}${d ? ` · de ${escH(d)}` : ""}${(a.type === "character") && a.hasPlayerOwner && !algo(a) ? ` · <b>nueva: sin nada encendido</b>` : ""}</small></span>
      <span class="ecos-hoja-chips">${chip(a, "pj", "PJ")}${chip(a, "descansos", "Descansos")}${vb}${chip(a, "portador", "Secreto")}
        <button type="button" class="ecos-chip" data-action="funcionesHoja" data-id="${a.id}" data-tooltip="Todas las funciones de esta hoja, explicadas"><i class="fa-solid fa-sliders"></i></button></span>
    </li>`;
  }).join("");
  const filtroBtn = (k, et) => `<button type="button" data-action="filtroHojas" data-f="${k}" class="${filtro === k ? "activo" : ""}">${et}</button>`;
  return `<p class="ecos-nota">Cada hoja enciende sus funciones por separado: <b>PJ</b> (reglas de supervivencia, Trabajar/Mercado/Curar, Prestigio, grupo), <b>Descansos</b> (PG solo con Dados de Golpe), <b>Verbe</b> (despertar o abrir su panel) y <b>Secreto</b> (la sangre que responde; solo tú lo ves). Lo mismo está en el botón <b>Ecos</b> arriba de cada hoja. Una hoja nueva nace con todo apagado.</p>
    ${nuevas.length ? `<p class="ecos-fn-aviso">Hojas de jugadores sin nada encendido: <b>${nuevas.map(a => escH(a.name)).join(", ")}</b>.</p>` : ""}
    <div class="ecos-botones ecos-filtros">${filtroBtn("personajes", "Personajes y lo encendido")}${filtroBtn("pnj", "PNJ")}${filtroBtn("todas", "Todas")}</div>
    <ul class="ecos-hojas">${filas || "<li>No hay hojas.</li>"}</ul>`;
}

/* ------------------------------------------------------------------ */
/*  El clima: control del DM, tarjeta en castellano y lo que cambia   */
/* ------------------------------------------------------------------ */
/*
 * El botón del clima (barra izquierda y Panel del DM) abre una ventana: el clima de hoy, elegir uno a mano (cielo, viento y
 * temperatura), ponerlo en la escena, decir si esta escena está bajo techo y anunciarlo. La tarjeta del chat dice qué cambia
 * en el juego (visión, rastreo, fuego, viajes, frío y calor). Simple Weather sigue generando el del día: su tarjeta en inglés
 * se cambia por la nuestra. Al DM le llega aparte cómo afecta el clima al Verbe (si la capa V está encendida).
 */
// Descripciones de Simple Weather → [castellano, tipo de cielo, viento 0 calma · 1 brisa · 2 fuerte · 3 vendaval]
const SW_ES = {
  "Barrel clouds": ["Nubes en rodillo", "nublado", 1], "Beautiful, clear sky": ["Cielo limpio, precioso", "despejado", 0],
  "Blizzard": ["Ventisca", "ventisca", 3], "Blue-white sky": ["Cielo blanco azulado", "despejado", 0], "Clear sky": ["Cielo despejado", "despejado", 0],
  "Clear, dry, cold, no wind": ["Despejado, seco y frío, sin viento", "despejado", 0], "Clear, dry, frigid, no wind": ["Despejado, seco y helado, sin viento", "despejado", 0],
  "Clear, dry, hot": ["Despejado, seco y caluroso", "despejado", 0], "Clear, dry, no wind": ["Despejado y seco, sin viento", "despejado", 0],
  "Clear, dry, warm": ["Despejado, seco y templado", "despejado", 0], "Cloudy": ["Nublado", "nublado", 0], "Cloudy and cold": ["Nublado y frío", "nublado", 0],
  "Cloudy and mild": ["Nublado y suave", "nublado", 0], "Cold winds, very dry": ["Viento frío, muy seco", "despejado", 2],
  "Cold, clear sky": ["Frío, cielo despejado", "despejado", 0], "Cool, clear sky": ["Fresco, cielo despejado", "despejado", 0],
  "Cooling rain": ["Lluvia que refresca", "lluvia", 0], "Cumulonimbus clouds": ["Nubarrones de tormenta", "nublado", 1], "Cyclone": ["Ciclón", "tornado", 3],
  "Dangerous winds": ["Vientos peligrosos", "despejado", 3], "Dark clouds": ["Nubes negras", "nublado", 0], "Dark storm cloud": ["Nubarrón de tormenta", "nublado", 1],
  "Downpour": ["Chaparrón", "aguacero", 1], "Drizzle": ["Llovizna", "llovizna", 0], "Drizzle, windy": ["Llovizna con viento", "llovizna", 2],
  "Dry": ["Seco", "despejado", 0], "Dry storm": ["Tormenta seca", "tormentaSeca", 2], "Dry thunderstorm": ["Tormenta eléctrica seca", "tormentaSeca", 2],
  "Dry, mild": ["Seco y suave", "despejado", 0], "Dry, warm": ["Seco y cálido", "despejado", 0], "Dust devil": ["Remolinos de polvo", "polvo", 2],
  "Dust storm": ["Tormenta de polvo", "polvo", 3], "Flash floods": ["Crecidas repentinas", "aguacero", 1], "Fleecy clouds": ["Nubes de algodón", "nublado", 0],
  "Fog banks": ["Bancos de niebla", "niebla", 0], "Gentle breeze, some clouds": ["Brisa suave, algunas nubes", "despejado", 1], "Grey sky": ["Cielo gris", "nublado", 0],
  "Grey, fast clouds": ["Gris, nubes que corren", "nublado", 2], "Grey, windy": ["Gris y ventoso", "nublado", 2], "Hail storm": ["Granizada", "granizo", 2],
  "Hard rain": ["Lluvia fuerte", "aguacero", 1], "Heavy fog": ["Niebla cerrada", "nieblaDensa", 0], "Heavy rain": ["Lluvia intensa", "aguacero", 1],
  "Heavy rain storm": ["Temporal de lluvia", "aguacero", 2], "Heavy rainstorm": ["Temporal de lluvia", "aguacero", 2], "Heavy snow": ["Nevada fuerte", "nevada", 1],
  "Humid, dark clouds, threatening rain": ["Húmedo, nubes negras, amenaza lluvia", "nublado", 0], "Humid, warm": ["Húmedo y cálido", "despejado", 0],
  "Humid, warm, clear sky": ["Húmedo y cálido, cielo despejado", "despejado", 0], "Light fog": ["Niebla ligera", "niebla", 0], "Light rain": ["Lluvia ligera", "lluvia", 0],
  "Light rain, warm": ["Lluvia ligera y tibia", "lluvia", 0], "Light rain, windy": ["Lluvia ligera con viento", "lluvia", 2], "Light snowfall": ["Nieve ligera", "nieve", 0],
  "Light snowfall, windy": ["Nieve ligera con viento", "nieve", 2], "Lightning storm": ["Tormenta de rayos", "tormenta", 2], "Mild, clear sky": ["Suave, cielo despejado", "despejado", 0],
  "Misty": ["Neblina", "niebla", 0], "Moderate rain, windy": ["Lluvia moderada con viento", "lluvia", 2], "Moderate snowfall, windy": ["Nevada moderada con viento", "nieve", 2],
  "Pouring rain": ["Lluvia a cántaros", "aguacero", 1], "Rain, windy": ["Lluvia con viento", "lluvia", 2], "Rolling fog": ["Niebla que avanza", "niebla", 1],
  "Scattered clouds, patches of light rain": ["Nubes sueltas y algún chubasco", "llovizna", 1], "Sleet, windy": ["Aguanieve con viento", "aguanieve", 2],
  "Sleet, windy, rain": ["Aguanieve y lluvia con viento", "aguanieve", 2], "Snow flurries, windy": ["Copos sueltos con viento", "nieve", 2],
  "Snow storm": ["Temporal de nieve", "ventisca", 3], "Snowing": ["Nieva", "nieve", 0], "Spitting rain": ["Cuatro gotas", "llovizna", 0],
  "Spitting rain, windy": ["Cuatro gotas y viento", "llovizna", 2], "Spitting snow, windy": ["Algún copo y viento", "nieve", 2], "Steady rain": ["Lluvia constante", "lluvia", 0],
  "Steel blue sky": ["Cielo azul acero", "despejado", 0], "Storming, rain": ["Tormenta con lluvia", "tormenta", 2], "Strong gale": ["Vendaval", "despejado", 3],
  "Sunny, breezy": ["Soleado, con brisa", "despejado", 1], "Sunny, refreshing breezes": ["Soleado, brisa fresca", "despejado", 1], "Thick snow": ["Nieve espesa", "nevada", 1],
  "Thunderstorm": ["Tormenta eléctrica", "tormenta", 2], "Thunderstorm with spitting rain": ["Tormenta eléctrica con cuatro gotas", "tormenta", 2], "Tornado": ["Tornado", "tornado", 3],
  "Warm rain": ["Lluvia tibia", "lluvia", 0], "Warm, clear sky": ["Cálido, cielo despejado", "despejado", 0], "White out": ["Todo blanco: no se ve nada", "ventisca", 3],
  "Wild fire": ["Incendio en el monte", "incendio", 1], "Wind": ["Viento", "despejado", 2], "Wind storm": ["Temporal de viento", "despejado", 3],
  "Windstorm": ["Temporal de viento", "despejado", 3], "Windy, rain": ["Ventoso, con lluvia", "lluvia", 2], "Windy, very dry": ["Ventoso y muy seco", "despejado", 2],
  "Wispy clouds": ["Nubes finas", "despejado", 0]
};

const SIN_TINTE = { apply: false, value: "#ffffff" };
const FX_BASE = {
  rain: { scale: 1, direction: 75, speed: 1, lifetime: 1, density: 0.6, alpha: 0.6, tint: SIN_TINTE },
  rainsimple: { scale: 1, direction: 75, speed: 0.6, lifetime: 1, density: 0.2, alpha: 0.5, tint: SIN_TINTE },
  snow: { scale: 1, direction: 50, speed: 1, lifetime: 1, density: 0.5, alpha: 0.9, tint: SIN_TINTE },
  snowstorm: { scale: 1, direction: 50, speed: 1.5, lifetime: 1, density: 0.9, alpha: 1, tint: SIN_TINTE },
  fog: { scale: 1, direction: 0, speed: 0.5, lifetime: 1, density: 0.05, alpha: 0.25, tint: SIN_TINTE },
  clouds: { scale: 1, direction: 0, speed: 0.3, lifetime: 2.6, density: 0.25, alpha: 0.5, tint: SIN_TINTE },
  leaves: { scale: 0.7, direction: 90, speed: 2.8, lifetime: 1, density: 0.1, alpha: 0.8, tint: SIN_TINTE },
  embers: { scale: 1.3, direction: 90, speed: 1, lifetime: 1, density: 0.4, alpha: 1, tint: SIN_TINTE }
};
const fx = (type, cambios = {}) => ({ type, options: { ...FX_BASE[type], ...cambios } });

const PRECIP_FUERTE = "Precipitación intensa: todo está <b>ligeramente oscurecido</b> y hay <b>desventaja en Percepción</b>.";
const PERDERSE = "Fuera de un camino, mantener el rumbo pide Supervivencia CD 15.";
const CIELOS = {
  despejado: { n: "Despejado", ic: "☀️", fx: [], ef: ["Buena visibilidad: el cielo no cambia nada."], favor: ["fuego"] },
  nublado: { n: "Nublado", ic: "☁️", fx: [fx("clouds")], ef: ["Luz de día apagada. De noche, sin luna ni estrellas: fuera de la luz de antorchas y faroles está muy oscuro."] },
  niebla: { n: "Niebla", ic: "🌫️", fx: [fx("fog")], ef: ["Todo está <b>ligeramente oscurecido</b>: desventaja en Percepción con la vista.", "Más allá de 18 m no se distingue nada (muy oscurecido)."], favor: ["agua"] },
  nieblaDensa: { n: "Niebla cerrada", ic: "🌫️", fx: [fx("fog", { density: 0.06, alpha: 0.3 })], ef: ["A más de 3 m todo está <b>muy oscurecido</b> (no se ve); más cerca, ligeramente oscurecido.", "Ataques a distancia: si no ves al objetivo, desventaja.", PERDERSE], favor: ["agua"] },
  llovizna: { n: "Llovizna", ic: "🌦️", fx: [fx("rainsimple")], ef: ["Las huellas se borran en unas horas: rastrear algo de hace más de 4 h, desventaja.", "Encender un fuego al descubierto lleva un minuto y yesca seca."], favor: ["agua"], contra: ["fuego"] },
  lluvia: { n: "Lluvia", ic: "🌧️", fx: [fx("rain")], ef: ["Desventaja en Percepción para oír.", "Rastrear: desventaja (las huellas se borran).", "Las llamas abiertas sin refugio se apagan; los caminos de tierra se embarran."], favor: ["agua"], contra: ["fuego"] },
  aguacero: { n: "Aguacero", ic: "🌧️", fx: [fx("rain", { density: 1.1, alpha: 0.7 })], ef: [PRECIP_FUERTE, "Apaga las llamas abiertas.", "Barro: los caminos sin empedrar son terreno difícil y los arroyos crecen."], favor: ["agua"], contra: ["fuego"] },
  tormenta: { n: "Tormenta eléctrica", ic: "⛈️", fx: [fx("rain", { density: 1.1, alpha: 0.7 }), fx("clouds", { alpha: 0.6 })], ef: [PRECIP_FUERTE, "Apaga las llamas abiertas.", "Rayos: mejor no quedarse bajo un árbol solo ni en lo alto; a campo abierto, la armadura de metal atrae problemas (a criterio del DM)."], favor: ["rayo", "agua"], contra: ["fuego"] },
  tormentaSeca: { n: "Tormenta seca", ic: "🌩️", fx: [fx("clouds", { alpha: 0.6 })], ef: ["Rayos sin lluvia: riesgo de incendio en el bosque y en los pastos.", "Los truenos tapan los ruidos: desventaja en Percepción para oír."], favor: ["rayo"] },
  aguanieve: { n: "Aguanieve", ic: "🌨️", fx: [fx("rain", { density: 0.4 }), fx("snow", { density: 0.25 })], ef: ["Suelo resbaladizo: terreno difícil. Quien corre o lucha encima tira Acrobacias CD 10 o cae Derribado (a criterio).", "Ropa mojada y frío: descansar sin fuego ni refugio es una miseria."], favor: ["agua"], contra: ["fuego"] },
  nieve: { n: "Nieve", ic: "🌨️", fx: [fx("snow")], ef: ["Mientras nieva, lo lejano está ligeramente oscurecido: desventaja en Percepción con la vista a distancia.", "Las huellas se marcan bien (ventaja para rastrear) hasta que vuelva a nevar.", "Si cuaja, fuera de los caminos es terreno difícil."], favor: ["agua"], contra: ["fuego"] },
  nevada: { n: "Nevada fuerte", ic: "❄️", fx: [fx("snow", { density: 0.8 })], ef: [PRECIP_FUERTE, "Nieve acumulada: terreno difícil.", PERDERSE], favor: ["agua"], contra: ["fuego"] },
  ventisca: { n: "Ventisca", ic: "❄️", fx: [fx("snowstorm")], ef: ["Nieve y viento: a más de 9 m todo está muy oscurecido; desventaja en Percepción.", "Nieve acumulada: terreno difícil. " + PERDERSE, "Cada hora a la intemperie sin abrigo: salvación de CON CD 10 o 1 de Agotamiento."], favor: ["viento", "agua"], contra: ["fuego"] },
  granizo: { n: "Granizo", ic: "🧊", fx: [fx("rain", { density: 0.9, speed: 1.4 })], ef: ["Al descubierto, una granizada fuerte hace daño (1 contundente por minuto, a criterio) y no deja oír: desventaja en Percepción para oír.", "Los animales se espantan: Trato con Animales CD 12 para que no se desboquen."], favor: ["agua", "viento"], contra: ["fuego"] },
  polvo: { n: "Polvo", ic: "🌪️", fx: [fx("fog", { tint: { apply: true, value: "#b59a6a" } })], ef: ["Ligeramente oscurecido: desventaja en Percepción con la vista.", "Sin taparse boca y ojos, cada hora: salvación de CON CD 10 o 1 de Agotamiento (a criterio)."], favor: ["tierra", "viento"], contra: ["agua"] },
  incendio: { n: "Humo de incendio", ic: "🔥", fx: [fx("embers"), fx("fog", { tint: { apply: true, value: "#6b625a" } })], ef: ["Humo: ligeramente oscurecido; cerca del fuego, muy oscurecido.", "Respirar humo mucho rato: salvación de CON CD 10 por hora o 1 de Agotamiento.", "Los animales huyen del fuego: el bosque está revuelto."], favor: ["fuego", "viento"], contra: ["agua"] },
  tornado: { n: "Tornado", ic: "🌪️", fx: [fx("leaves", { speed: 4, density: 0.25 }), fx("clouds", { alpha: 0.6 })], ef: ["Peligro real: hay que refugiarse. Quien quede en su camino: salvación de FUE CD 15 o sale volando (el daño, a criterio)."], favor: ["viento"] }
};
const VIENTOS = [
  { n: "Calma", ef: [] },
  { n: "Brisa", ef: [] },
  { n: "Viento fuerte", ef: ["<b>Viento fuerte:</b> desventaja en ataques con armas a distancia; apaga las llamas abiertas y deshace la niebla; quien vuela sin magia aterriza al final de su turno o cae."], favor: ["viento"] },
  { n: "Vendaval", ef: ["<b>Vendaval:</b> desventaja en ataques con armas a distancia; apaga las llamas abiertas y deshace la niebla; quien vuela sin magia aterriza al final de su turno o cae.", "Avanzar contra el viento cuesta el doble. Las criaturas Pequeñas, al empezar su turno a la intemperie: salvación de FUE CD 10 o caen Derribadas (a criterio)."], favor: ["viento"] }
];
function bandaTemp(t) {
  if (!Number.isFinite(t)) return null;
  if (t <= -18) return { n: "Frío extremo", ef: ["<b>Frío extremo:</b> cada hora a la intemperie, salvación de CON CD 10 o 1 de Agotamiento. Con ropa de abrigo, o resistencia o inmunidad al frío, se supera sola."], favor: ["agua"], contra: ["fuego"] };
  if (t <= 0) return { n: "Helada", ef: ["<b>Helada:</b> el agua al descubierto se congela; donde hay hielo es terreno difícil. Pasar la noche fuera sin fuego es muy duro."] };
  if (t <= 7) return { n: "Frío", ef: ["<b>Frío:</b> sin abrigo, mejor no pasar la noche fuera sin fuego."] };
  if (t >= 38) return { n: "Calor extremo", ef: ["<b>Calor extremo:</b> sin agua, al final de cada hora salvación de CON CD 5 (+1 por cada hora seguida) o 1 de Agotamiento; con armadura media o pesada o ropa gruesa, con desventaja."], favor: ["fuego"], contra: ["agua"] };
  if (t >= 30) return { n: "Calor", ef: ["<b>Calor:</b> viajar con armadura media o pesada cansa; quien no beba lo suficiente, salvación de CON CD 10 al final del día o 1 de Agotamiento (a criterio)."], favor: ["fuego"] };
  return null;
}

/* ---------- El clima y las naturalezas del Verbe: cada una tiene sus días (al aire libre) ---------- */
const NAT_NOMBRE = {
  fuego: "Fuego", agua: "Agua", viento: "Viento", tierra: "Tierra", rayo: "Rayo",
  escarcha: "Escarcha", raiz: "Raíz", madera: "Madera", magma: "Magma", vapor: "Vapor", ceniza: "Ceniza",
  tormenta: "Tormenta", hierro: "Hierro", corriente: "Corriente", destello: "Destello", arena: "Arena"
};
const NAT_ORDEN = Object.keys(NAT_NOMBRE);
const C_LLUEVE = ["llovizna", "lluvia", "aguacero", "tormenta", "aguanieve"];
const C_NIEVA = ["aguanieve", "nieve", "nevada", "ventisca", "granizo"];
const C_NIEBLA = ["niebla", "nieblaDensa"];
const C_SECO = ["despejado", "tormentaSeca", "polvo", "incendio"];

/**
 * Qué naturalezas favorece o estorba un clima { cielo, viento, temp }: { favor: [{ n, por }], contra: [{ n, por }] }.
 * Si algo la ayuda y algo la estorba a la vez, se anulan. Sin temperatura conocida, las reglas de temperatura no cuentan.
 */
function naturalezasDelClima(c) {
  const k = CIELOS[c?.cielo] ? c.cielo : "despejado";
  const v = Math.clamp(Number(c?.viento) || 0, 0, 3);
  const t = ((c?.temp === null) || (c?.temp === undefined) || (c?.temp === "")) ? NaN : Number(c.temp);
  const hay = Number.isFinite(t);
  const llueve = C_LLUEVE.includes(k), nieva = C_NIEVA.includes(k), niebla = C_NIEBLA.includes(k);
  const seco = C_SECO.includes(k), secoONublado = seco || (k === "nublado");
  const ventoso = (v >= 2) || ["ventisca", "tornado"].includes(k);
  const calma = (v === 0) && !["ventisca", "tornado", "polvo"].includes(k);
  const calor = hay && (t >= 30), calorExt = hay && (t >= 38), tibio = hay && (t >= 25), sol = hay && (t >= 15);
  const helada = hay && (t <= 0), hielo = hay && (t <= -5), frioExt = hay && (t <= -18);
  const mojado = ["lluvia", "aguacero", "tormenta", "aguanieve", "nevada", "ventisca"].includes(k);
  const templado = hay && (t >= 8) && (t <= 29);
  const cielo = (CIELOS[k]?.n ?? k).toLowerCase();
  const vientoN = (k === "ventisca") ? "ventisca" : ((k === "tornado") ? "tornado" : (v >= 3 ? "vendaval" : "viento fuerte"));
  const reglas = [
    // Simples
    ["fuego", +1, tibio && secoONublado, "calor seco"],
    ["fuego", +1, (v === 2) && seco && !calor, "viento seco que aviva"],
    ["fuego", +1, ["incendio", "tormentaSeca"].includes(k), cielo],
    ["fuego", -1, mojado, cielo],
    ["fuego", -1, frioExt, "frío extremo"],
    ["agua", +1, llueve, cielo],
    ["agua", -1, calor && seco, "calor seco"],
    ["agua", -1, ["polvo", "incendio"].includes(k), cielo],
    ["agua", -1, helada && !llueve, "el agua se congela"],
    ["viento", +1, ventoso, vientoN],
    ["viento", +1, k === "polvo", cielo],
    ["viento", -1, calma && (niebla || calor || (k === "nublado")), "aire quieto"],
    ["tierra", +1, k === "polvo", cielo],
    ["tierra", +1, ["despejado", "nublado"].includes(k) && hay && (t >= 20), "tierra seca y firme"],
    ["tierra", +1, helada && !llueve && !nieva, "suelo helado y firme"],
    ["tierra", -1, ["lluvia", "aguacero", "tormenta"].includes(k), "barro"],
    ["tierra", -1, ["nevada", "ventisca"].includes(k), "nieve acumulada"],
    ["rayo", +1, ["tormenta", "tormentaSeca", "granizo", "polvo"].includes(k), cielo],
    ["rayo", +1, helada && !llueve && !nieva, "aire seco y frío"],
    ["rayo", -1, (niebla || (k === "llovizna")) && (v <= 1), "humedad quieta"],
    // Combinadas
    ["escarcha", +1, helada, "helada"],
    ["escarcha", +1, nieva, cielo],
    ["escarcha", -1, calor, "calor"],
    ["escarcha", -1, k === "incendio", cielo],
    ["raiz", +1, ["llovizna", "lluvia", "aguacero", "tormenta"].includes(k) && !helada, "tierra mojada"],
    ["raiz", -1, hielo, "suelo helado"],
    ["raiz", -1, (calor && seco) || (k === "polvo"), "sequía"],
    ["madera", +1, niebla || (k === "llovizna"), "humedad"],
    ["madera", +1, (k === "lluvia") && templado, "lluvia templada"],
    ["madera", -1, ["incendio", "tormentaSeca"].includes(k), cielo],
    ["madera", -1, (v >= 3) || (k === "tornado"), vientoN],
    ["madera", -1, hielo, "la savia se congela"],
    ["magma", +1, hay && (t >= 20) && secoONublado, "roca seca y tibia"],
    ["magma", +1, k === "incendio", cielo],
    ["magma", -1, mojado, cielo],
    ["magma", -1, frioExt, "frío extremo"],
    ["vapor", +1, niebla, cielo],
    ["vapor", +1, hay && (t >= 18) && (llueve || (k === "nublado")), "calor húmedo"],
    ["vapor", -1, helada, "helada"],
    ["vapor", -1, (v >= 3) || ["ventisca", "tornado"].includes(k), "el viento lo deshace"],
    ["ceniza", +1, k === "incendio", cielo],
    ["ceniza", +1, ventoso && secoONublado && (k !== "incendio"), "viento seco"],
    ["ceniza", +1, k === "tormentaSeca", cielo],
    ["ceniza", -1, mojado, "la humedad la asienta"],
    ["tormenta", +1, ["tormenta", "tormentaSeca", "tornado", "granizo"].includes(k), cielo],
    ["tormenta", +1, (v >= 3) && !["tormenta", "tormentaSeca", "tornado", "granizo"].includes(k), "vendaval"],
    ["tormenta", +1, (v === 2) && (k === "nublado"), "nubes que corren"],
    ["tormenta", -1, calma && (niebla || calor || (k === "despejado")), "cielo quieto"],
    ["hierro", +1, ["tormenta", "tormentaSeca"].includes(k), cielo],
    ["hierro", +1, helada && !llueve && !nieva, "frío seco"],
    ["hierro", -1, niebla || ["llovizna", "aguanieve"].includes(k), "humedad que oxida"],
    ["corriente", +1, ["lluvia", "aguacero", "tormenta"].includes(k), cielo],
    ["corriente", -1, (k === "polvo") || (calor && seco), "aire seco"],
    ["corriente", -1, hielo && !llueve, "el agua se congela"],
    ["destello", +1, (k === "despejado") && sol, "sol fuerte"],
    ["destello", +1, k === "tormentaSeca", "relámpagos"],
    ["destello", -1, niebla || ["polvo", "incendio", "nevada", "ventisca"].includes(k), "no deja ver"],
    ["arena", +1, k === "polvo", cielo],
    ["arena", +1, ventoso && secoONublado && (k !== "polvo"), "viento seco"],
    ["arena", +1, calor && seco && (k !== "polvo"), "arena caliente"],
    ["arena", -1, mojado, "arena mojada"]
  ];
  const suma = {};
  for (const [n, s, si, por] of reglas) {
    if (!si) continue;
    const x = (suma[n] ??= { s: 0, por: [] });
    x.s += s;
    if (!x.por.includes(por)) x.por.push(por);
  }
  const favor = [], contra = [];
  for (const n of NAT_ORDEN) {
    const x = suma[n];
    if (!x || !x.s) continue;
    (x.s > 0 ? favor : contra).push({ n, por: x.por.join(", ") });
  }
  return { favor, contra };
}

const climaActual = () => {
  try {
    const c = game.settings.get(MOD, "climaActual");
    return c?.cielo ? c : null;
  } catch {
    return null;
  }
};

/** Todo lo que se deriva de un clima { cielo, viento, temp }: nombre, efectos en el juego y naturalezas a favor y en contra. */
function leerClima(c) {
  const cielo = CIELOS[c?.cielo] ?? CIELOS.despejado;
  const viento = VIENTOS[Math.clamp(Number(c?.viento) || 0, 0, 3)];
  const tc = ((c?.temp === null) || (c?.temp === undefined) || (c?.temp === "")) ? NaN : Number(c.temp);
  const banda = bandaTemp(tc);
  const nat = naturalezasDelClima(c);
  // Con viento fuerte la niebla no aguanta.
  let ef = [...cielo.ef];
  if ((Number(c?.viento) >= 2) && /^niebla/.test(c?.cielo ?? "")) ef = ["El viento la va deshaciendo: ligeramente oscurecido, y a ratos se abre."];
  return {
    cielo, viento, banda, nat, favor: nat.favor.map(x => x.n), contra: nat.contra.map(x => x.n), temp: tc,
    titulo: `${cielo.ic} ${c?.desc ? escH(c.desc) : cielo.n}${Number.isFinite(tc) ? ` · ${Math.round(tc)} °C` : ""}`,
    efectos: [...ef, ...viento.ef, ...(banda?.ef ?? [])]
  };
}

/** Las partículas de FXMaster para un clima (más o menos densas según la fuerza elegida). */
function fxDeClima(c, fuerza = 1) {
  const L = leerClima(c);
  const lote = L.cielo.fx.map(d => ({ type: d.type, options: { ...d.options, density: Math.round(d.options.density * fuerza * 1000) / 1000 } }));
  if ((Number(c?.viento) >= 2) && !lote.some(d => ["leaves", "snowstorm"].includes(d.type)) && ["despejado", "nublado", "tormentaSeca", "polvo"].includes(c?.cielo)) {
    lote.push({ type: "leaves", options: { ...FX_BASE.leaves, speed: (Number(c.viento) >= 3) ? 4 : 2.8 } });
  }
  return lote;
}

/** ¿Los elementos van en la tarjeta pública? Solo con la capa V activa para todos y el ajuste del clima encendido. */
function verbePublico() {
  try {
    const v = verbeApi();
    return !!v && (v.modo?.() === "activo") && !!game.settings.get(MOD, "climaVerbe");
  } catch {
    return false;
  }
}

/** Los elementos del día, para la tarjeta: lo que se fortalece, lo que se merma, o que nada cambia. */
function htmlElementosClima(L) {
  const lista = xs => xs.map(x => `<b>${NAT_NOMBRE[x.n] ?? escH(x.n)}</b> <span class="ecos-nota">(${escH(x.por)})</span>`).join(", ");
  const total = L.nat.favor.length + L.nat.contra.length;
  const cuerpo = !total ? "<p>Hoy <b>ningún elemento recibe cambios</b>: todas las técnicas cuestan lo de siempre.</p>"
    : [L.nat.favor.length ? `<p class="ecos-elem-mas">▲ <b>Se fortalecen</b> (cuestan 1 Verbe menos, mínimo 1): ${lista(L.nat.favor)}.</p>` : "",
      L.nat.contra.length ? `<p class="ecos-elem-menos">▼ <b>Se merman</b> (cuestan 1 Verbe más): ${lista(L.nat.contra)}.</p>` : "",
      (total < NAT_ORDEN.length) ? "<p class=\"ecos-nota\">Los demás elementos, sin cambios.</p>" : ""].join("");
  return `<div class="ecos-guia ecos-clima-elementos"><b>Los elementos a la intemperie</b>${cuerpo}
    <p class="ecos-nota">Solo al aire libre; bajo techo no cuenta. Las Miradas, los Sellos y los Pactos no dependen del clima.</p></div>`;
}

/** La tarjeta pública del clima: temperatura, viento, qué cambia al aire libre y (con la capa V activa) los elementos del día. */
function tarjetaClima(c) {
  const L = leerClima(c);
  const lineas = [];
  if (Number.isFinite(L.temp)) lineas.push(`Temperatura: <b>${Math.round(L.temp)} °C</b> · ${L.banda ? L.banda.n.toLowerCase() : "templado"}.`);
  lineas.push(`Viento: ${L.viento.n.toLowerCase()}.`);
  const ef = `<div class="ecos-guia"><b>Qué cambia al aire libre</b><ul>${L.efectos.length ? L.efectos.map(e => `<li>${e}</li>`).join("") : "<li>Nada: un día tranquilo.</li>"}</ul></div>`;
  const el = verbePublico() ? htmlElementosClima(L) : "";
  return tarjeta(L.titulo, lineas, { clase: "ecos-clima", extra: `${ef}${el}<p class="ecos-nota">Bajo techo no cuenta. Lo que dice «a criterio» lo decide el DM en el momento.</p>` });
}

/** Los elementos del día en una línea (ventana del clima y aviso al DM). */
function lineaVerbeClima(c) {
  const L = leerClima(c);
  if (!L.nat.favor.length && !L.nat.contra.length) return "Hoy ningún elemento recibe cambios.";
  const auto = game.settings.get(MOD, "climaVerbe");
  const lista = xs => xs.map(x => `<b>${NAT_NOMBRE[x.n] ?? escH(x.n)}</b> (${escH(x.por)})`).join(", ");
  return [L.nat.favor.length ? `se fortalecen ${lista(L.nat.favor)}${auto ? ", 1 Verbe menos" : ""}` : "",
    L.nat.contra.length ? `se merman ${lista(L.nat.contra)}${auto ? ", 1 Verbe más" : ""}` : ""].filter(Boolean).join(" · ") + ". Solo al aire libre.";
}

/** Si los elementos no van en la tarjeta pública (capa V en Prueba, o el ajuste apagado), te llegan solo a ti. */
async function avisarVerbeClima(c) {
  const v = verbeApi();
  if (!v || !game.user.isGM || verbePublico()) return;
  const auto = game.settings.get(MOD, "climaVerbe");
  await susurrarDM("Clima y elementos", [lineaVerbeClima(c),
    !auto ? "No se aplica solo (lo apagaste en la ventana del clima): úsalo como guía."
      : "La capa V está en modo Prueba: esto solo lo ves tú. Con la capa V activa sale en la tarjeta del clima, para todos."]);
}

/** Para la capa V: { favor, contra } del clima de ahora, o null (apagado, sin clima o bajo techo). */
function climaVerbe() {
  try {
    if (!game.settings.get(MOD, "climaVerbe")) return null;
    const c = climaActual();
    if (!c?.cielo || sinClima(canvas?.scene)) return null;
    const L = leerClima(c);
    return { favor: L.favor, contra: L.contra, porNat: true };
  } catch {
    return null;
  }
}

/** Fija el clima de hoy: lo guarda, lo pone en la escena (si toca) y lo anuncia (si toca). */
async function fijarClima(c, { escena = true, anunciar = true, fuerza = 1, whisper = null } = {}) {
  if (!game.user.isGM) return;
  const dato = { cielo: CIELOS[c.cielo] ? c.cielo : "despejado", viento: Math.clamp(Number(c.viento) || 0, 0, 3),
    temp: Number.isFinite(Number(c.temp)) && (c.temp !== "") && (c.temp !== null) ? Math.round(Number(c.temp)) : null,
    desc: c.desc ?? "", fuente: c.fuente ?? "dm", fuerza, t: game.time.worldTime };
  await game.settings.set(MOD, "climaActual", dato);
  if (escena) {
    const lote = fxDeClima(dato, fuerza);
    guardarClimaHoy(lote);
    await escribirClima(canvas?.scene, lote);
  }
  if (anunciar) {
    const datos = { content: tarjetaClima(dato), speaker: { alias: "El clima" }, flags: { [MOD]: { clima: dato } } };
    if (whisper) datos.whisper = whisper;
    await ChatMessage.create(datos);
  }
  await avisarVerbeClima(dato);
  climaDM?.rendered && climaDM.render();
  return dato;
}

/* La tarjeta de Simple Weather (en inglés) se cambia por la nuestra, con lo que cambia en el juego. */
Hooks.on("preCreateChatMessage", (msg, data) => {
  try {
    if (!game.user.isGM || !game.modules.get("simple-weather")?.active) return;
    const alias = String(data?.speaker?.alias ?? msg.speaker?.alias ?? "");
    const cab = [game.i18n.localize("swr.chat.header"), game.i18n.localize("swr.chat.dateHeader")].filter(t => t && !t.startsWith("swr."));
    if (!cab.some(t => alias.startsWith(t))) return;
    const html = String(data?.content ?? msg.content ?? "");
    const m = /<b>\s*(-?\d+)\s*°\s*([CF])\s*<\/b>\s*-\s*([^<]+)/.exec(html);
    if (!m) return;
    const temp = (m[2] === "F") ? Math.round((Number(m[1]) - 32) * 5 / 9) : Number(m[1]);
    const desc = m[3].trim();
    const [es, cielo, viento] = SW_ES[desc] ?? [desc, "despejado", 0];
    const dato = { cielo, viento, temp, desc: es, fuente: "sw", fuerza: 1, t: game.time.worldTime };
    // Público para todos, aunque Simple Weather lo mande solo al DM.
    msg.updateSource({ content: tarjetaClima(dato), speaker: { alias: "El clima" }, flags: { [MOD]: { clima: dato } }, whisper: [] });
    game.settings.set(MOD, "climaActual", dato).then(() => {
      avisarVerbeClima(dato);
      climaDM?.rendered && climaDM.render();
    }).catch(err => console.warn(`${MOD} | clima`, err));
  } catch (err) {
    console.warn(`${MOD} | tarjeta del clima`, err);
  }
});

/* ---------- La ventana del clima (solo DM) ---------- */
let climaDM = null;
class ClimaDM extends foundry.applications.api.ApplicationV2 {
  static DEFAULT_OPTIONS = {
    id: "ecos-clima-dm",
    classes: ["ecos-clima-dm"],
    window: { title: "El clima", icon: "fa-solid fa-cloud-sun-rain", resizable: true },
    position: { width: 520, height: "auto" },
    actions: { aplicar: ClimaDM.#aplicar, azar: ClimaDM.#azar, repetir: ClimaDM.#repetir, techo: ClimaDM.#techo, quitar: ClimaDM.#quitar }
  };

  #leer() {
    const f = this.element?.querySelector("form.ecos-clima-form");
    const v = n => f?.elements?.[n];
    return {
      cielo: v("cielo")?.value ?? "despejado", viento: Number(v("viento")?.value ?? 0), temp: v("temp")?.value ?? "",
      escena: !!v("escena")?.checked, anunciar: v("anunciar")?.value ?? "todos", fuerza: Number(v("fuerza")?.value ?? 1),
      mantener: !!v("mantener")?.checked, verbe: (v("verbe")?.type === "checkbox") ? v("verbe").checked : null
    };
  }

  async #guardarOpciones(o) {
    // Mantener el clima elegido: ni el día nuevo ni Simple Weather lo cambian solos.
    if (game.settings.get(MOD, "climaDiario") === o.mantener) await game.settings.set(MOD, "climaDiario", !o.mantener);
    if (game.settings.settings.has("simple-weather.manualPause") && (game.settings.get("simple-weather", "manualPause") !== o.mantener)) {
      await game.settings.set("simple-weather", "manualPause", o.mantener);
    }
    if ((o.verbe !== null) && (game.settings.get(MOD, "climaVerbe") !== o.verbe)) await game.settings.set(MOD, "climaVerbe", o.verbe);
  }

  static async #aplicar() {
    const o = this.#leer();
    await this.#guardarOpciones(o);
    const whisper = (o.anunciar === "dm") ? idsGM() : null;
    await fijarClima({ cielo: o.cielo, viento: o.viento, temp: o.temp, fuente: "dm" }, { escena: o.escena, anunciar: o.anunciar !== "no", fuerza: o.fuerza, whisper });
    this.render();
  }

  static async #azar() {
    const o = this.#leer();
    await this.#guardarOpciones({ ...o, mantener: false });
    if (!game.modules.get("simple-weather")?.active) return ui.notifications.warn("Para sacar el clima al azar hace falta Simple Weather activo.");
    const antes = game.settings.get(MOD, "climaDiario");
    if (!antes) await game.settings.set(MOD, "climaDiario", true);
    await climaDelDia();
  }

  static async #repetir() {
    const c = climaActual();
    if (!c) return ui.notifications.warn("Todavía no hay un clima de hoy.");
    await ChatMessage.create({ content: tarjetaClima(c), speaker: { alias: "El clima" }, flags: { [MOD]: { clima: c } } });
  }

  static async #techo() {
    await alternarClimaEscena();
    this.render();
  }

  static async #quitar() {
    guardarClimaHoy([]);
    await escribirClima(canvas?.scene, []);
    ui.notifications.info("Fuera las partículas del clima en esta escena (el clima de hoy sigue anotado).");
  }

  async _renderHTML() {
    const c = climaActual() ?? { cielo: "despejado", viento: 1, temp: 15 };
    const L = leerClima(c);
    const opt = (lista, v) => lista.map(([k, t]) => `<option value="${k}" ${String(k) === String(v) ? "selected" : ""}>${t}</option>`).join("");
    const escena = canvas?.scene;
    const techo = sinClima(escena);
    const mantener = !game.settings.get(MOD, "climaDiario");
    const hayV = !!game.modules.get(MOD)?.api?.verbe;
    const fuente = c.fuente === "sw" ? "lo sacó Simple Weather" : (c.fuente === "dm" ? "lo elegiste tú" : "");
    return `<form class="ecos-clima-form ecos-dialogo">
      <section class="ecos-clima-hoy">
        <h3>Ahora: ${L.titulo}</h3>
        <p class="ecos-nota">Viento: ${L.viento.n.toLowerCase()}${L.banda ? ` · ${L.banda.n}` : ""}${fuente ? ` · ${fuente}` : ""}.</p>
        <ul>${L.efectos.map(e => `<li>${e}</li>`).join("")}</ul>
        ${hayV ? `<p class="ecos-nota"><b>Elementos:</b> ${lineaVerbeClima(c)}${verbePublico() ? " Sale en la tarjeta, para todos." : ""}</p>` : ""}
      </section>
      <p>Escena «${escH(escena?.name ?? "—")}»: <b>${techo ? "bajo techo (sin clima)" : "al aire libre"}</b>
        <button type="button" data-action="techo"><i class="fa-solid ${techo ? "fa-cloud-sun" : "fa-house"}"></i> ${techo ? "Devolverle el clima" : "Está bajo techo"}</button>
        <button type="button" data-action="quitar" data-tooltip="Quita las partículas del clima de esta escena"><i class="fa-solid fa-eraser"></i></button></p>
      <h3>Elegir el clima</h3>
      <table class="ecos-tabla">
        <tr><th>Cielo</th><td><select name="cielo">${opt(Object.entries(CIELOS).map(([k, v]) => [k, `${v.ic} ${v.n}`]), c.cielo)}</select></td></tr>
        <tr><th>Viento</th><td><select name="viento">${opt(VIENTOS.map((v, i) => [i, v.n]), c.viento ?? 0)}</select></td></tr>
        <tr><th>Temperatura</th><td><input type="number" name="temp" value="${c.temp ?? ""}" step="1" style="width:5em"> °C <span class="ecos-nota">(vacío: sin efecto de temperatura)</span></td></tr>
        <tr><th>En la escena</th><td><label class="ecos-check"><input type="checkbox" name="escena" checked> Poner lluvia, niebla o nieve</label>
          <select name="fuerza">${opt([[0.6, "Suave"], [1, "Normal"], [1.4, "Fuerte"]], c.fuerza ?? 1)}</select></td></tr>
        <tr><th>Anunciar</th><td><select name="anunciar">${opt([["todos", "A todos en el chat"], ["dm", "Solo a mí"], ["no", "No anunciar"]], "todos")}</select></td></tr>
        <tr><th>Cada día nuevo</th><td><label class="ecos-check"><input type="checkbox" name="mantener" ${mantener ? "checked" : ""}> Mantener el clima que elijo (no sacar uno nuevo solo)</label></td></tr>
        ${hayV ? `<tr><th>Verbe</th><td><label class="ecos-check"><input type="checkbox" name="verbe" ${game.settings.get(MOD, "climaVerbe") ? "checked" : ""}> El clima cambia el costo de las técnicas (±1) y la tarjeta dice a todos qué elementos se fortalecen o se merman</label></td></tr>` : ""}
      </table>
      <div class="ecos-clima-vista"></div>
      <div class="ecos-botones">
        <button type="button" data-action="aplicar"><i class="fa-solid fa-check"></i> Poner este clima</button>
        <button type="button" data-action="azar"><i class="fa-solid fa-dice"></i> Al azar (según la estación)</button>
        <button type="button" data-action="repetir"><i class="fa-solid fa-bullhorn"></i> Volver a anunciar el de hoy</button>
      </div>
    </form>`;
  }

  _replaceHTML(result, content) {
    content.innerHTML = result;
    const f = content.querySelector("form.ecos-clima-form");
    const vista = content.querySelector(".ecos-clima-vista");
    const pintar = () => {
      const o = this.#leer();
      const L = leerClima({ cielo: o.cielo, viento: o.viento, temp: o.temp });
      const el = verbeApi() ? `<p class="ecos-nota"><b>Elementos:</b> ${lineaVerbeClima({ cielo: o.cielo, viento: o.viento, temp: o.temp })}</p>` : "";
      vista.innerHTML = `<p class="ecos-nota"><b>Vista previa:</b> ${L.titulo} · ${L.viento.n.toLowerCase()}${L.banda ? ` · ${L.banda.n}` : ""}</p><ul class="ecos-nota">${L.efectos.map(e => `<li>${e}</li>`).join("")}</ul>${el}`;
    };
    f?.addEventListener("change", pintar);
    f?.addEventListener("input", pintar);
    f?.addEventListener("submit", ev => ev.preventDefault());
    pintar();
  }
}

function abrirClima() {
  if (!game.user.isGM) return;
  climaDM ??= new ClimaDM();
  return climaDM.render({ force: true });
}

/* ------------------------------------------------------------------ */
/*  Relojes: por qué suben, por qué no y por qué bajan                */
/* ------------------------------------------------------------------ */
/* Los motivos los trae el contenido (ajuste «relojesMotivos», por nombre de reloj) y el DM los puede cambiar en la ventana. */
const motivosReloj = nombre => (game.settings.get(MOD, "relojesMotivos") ?? {})[nombre] ?? null;

function extrasCapaV(nombre) {
  if (!/^Barrera$/i.test(nombre) || !game.modules.get(MOD)?.api?.verbe) return [];
  return ["Un personaje despierto gasta Verbe en negativo (+1, una vez por día; automático).", "Termina un Despertar de linaje (+1; automático)."];
}

function htmlMotivos(nombre) {
  const m = motivosReloj(nombre) ?? {};
  const sube = [...(m.sube ?? []), ...extrasCapaV(nombre)];
  const grupos = [["sube", "▲ Sube si", sube], ["frena", "■ No sube (se frena) si", m.frena ?? []], ["baja", "▼ Baja si", m.baja ?? []]].filter(g => g[2].length);
  const total = grupos.reduce((t, g) => t + g[2].length, 0);
  const cuerpo = grupos.map(([cl, t, L]) => `<p class="ecos-motivo-${cl}"><b>${t}:</b></p><ul class="ecos-motivo-${cl}">${L.map(x => `<li>${x}</li>`).join("")}</ul>`).join("");
  return `<details class="ecos-reloj-motivos" data-reloj="${escH(nombre)}"><summary>Por qué sube o no${total ? ` (${total})` : " — sin motivos anotados"}
    <a data-action="editarMotivos" data-reloj="${escH(nombre)}" data-tooltip="Cambiar los motivos"><i class="fa-solid fa-pen"></i></a></summary>${cuerpo || "<p class=\"ecos-nota\">Anota con el lápiz qué lo hace subir, qué lo frena y qué lo baja.</p>"}</details>`;
}

async function editarMotivos(nombre) {
  const m = motivosReloj(nombre) ?? {};
  const area = (n, t, L) => `<label><b>${t}</b> <span class="ecos-nota">(uno por línea)</span><textarea name="${n}" rows="4">${escH((L ?? []).join("\n"))}</textarea></label>`;
  const r = await foundry.applications.api.DialogV2.wait({
    window: { title: `Motivos · ${nombre}`, icon: "fa-solid fa-pen" },
    position: { width: 520 },
    content: `<div class="ecos-dialogo ecos-motivos-form">${area("sube", "▲ Sube si", m.sube)}${area("frena", "■ No sube (se frena) si", m.frena)}${area("baja", "▼ Baja si", m.baja)}</div>`,
    rejectClose: false,
    buttons: [
      { action: "guardar", label: "Guardar", icon: "fa-solid fa-floppy-disk", default: true, callback: (ev, boton) => leerFormulario(boton) },
      { action: "cancelar", label: "Cancelar", icon: "fa-solid fa-xmark" }
    ]
  });
  if (!r || (typeof r === "string")) return;
  const lineas = t => String(t ?? "").split("\n").map(x => x.trim()).filter(Boolean);
  const todos = foundry.utils.deepClone(game.settings.get(MOD, "relojesMotivos") ?? {});
  todos[nombre] = { sube: lineas(r.sube), frena: lineas(r.frena), baja: lineas(r.baja), editado: true };
  await game.settings.set(MOD, "relojesMotivos", todos);
}

/** Motivos que trae el contenido: no pisa los que el DM ya cambió a mano. */
async function aplicarMotivosRelojes(M = {}) {
  const todos = foundry.utils.deepClone(game.settings.get(MOD, "relojesMotivos") ?? {});
  let n = 0;
  for (const [k, v] of Object.entries(M)) {
    if (todos[k]?.editado) continue;
    if (JSON.stringify(todos[k]) === JSON.stringify(v)) continue;
    todos[k] = v;
    n++;
  }
  if (n) await game.settings.set(MOD, "relojesMotivos", todos);
  return n;
}

/* Migración de los efectos viejos y avisos */
const VERSION_MIGRACION = 13;

/** midi-qol: lo que ven los jugadores de las tiradas del DM (sin bonificadores de los PNJ) y nombres de token en las tarjetas. */
const AJUSTES_MIDI_OCULTO = { hideRollDetails: "d20Only", autoCheckSaves: "allNoRoll", useTokenNames: true };

/** Cosas que piden recargar el mundo al terminar de cargar (se junta todo en un solo aviso). */
const RECARGA_PENDIENTE = [];

/** midi-qol con la automatización completa (los presets "automático" de midi), adaptado a la campaña. */
const AJUSTES_MIDI = {
  autoRollAttack: true, autoFastForward: ["attack", "damage"], autoRollDamage: "onHit", removeButtons: "all",
  gmAutoAttack: true, gmAutoFastForward: ["attack", "damage"], gmAutoDamage: "onHit", gmRemoveButtons: "all",
  autoCheckHit: "all", autoCheckSaves: "all", playerRollSaves: "mtb", playerSaveTimeout: 60,
  rollNPCSaves: "auto", rollNPCLinkedSaves: "auto",
  autoTarget: "wallsBlockIgnoreDefeated", rangeTarget: "alwaysIgnoreDefeated", requiresTargets: "combat",
  autoCEEffects: "itempri", autoItemEffects: "applyRemove", allowUseMacro: true,
  autoApplyDamage: "yesCard", undoWorkflow: true,
  doReactions: "all", gmDoReactions: "all", reactionTimeout: 30, showReactionAttackRoll: "all", enforceReactions: "all", recordAOO: "all",
  removeConcentration: true, singleConcentrationRoll: true,
  // Enemigos a 0 PG: muertos y derrotados (Monk's TokenBar reparte la XP). A los PJ los maneja Acechado.
  addDead: "overlay", midiDeadCondition: "dead", midiUnconsciousCondition: "none", markNonPlayerDefeated: true, markPlayerDefeated: false
};

/** Módulos que la migración apaga (se recarga el mundo al final). */
const MODULOS_A_APAGAR = [];
async function desactivarModulosPendientes() {
  if (!game.user.isGM) return;
  // Si después de la v1.8.2 se instala FXMaster, el clima pasa a usar sus efectos.
  try {
    if (game.modules.get("fxmaster")?.active && game.modules.get("simple-weather")?.active && (game.settings.get("simple-weather", "useFX") === "core")) {
      await game.settings.set("simple-weather", "useFX", "fxmaster");
      RECARGA_PENDIENTE.push("Simple Weather ahora usa los efectos de FXMaster");
    }
  } catch (err) {
    console.warn(`${MOD} | simple-weather`, err);
  }
  if (!MODULOS_A_APAGAR.length && !RECARGA_PENDIENTE.length) return;
  if (MODULOS_A_APAGAR.length) {
    const clave = "moduleConfiguration";
    const conf = foundry.utils.deepClone(game.settings.get("core", clave) ?? {});
    for (const id of MODULOS_A_APAGAR) conf[id] = false;
    await game.settings.set("core", clave, conf);
    const lineas = [...new Set(MODULOS_A_APAGAR)].map(id => `Desactivé <b>${game.modules.get(id)?.title ?? id}</b>: ${INCOMPATIBLES[id] ?? "está repetido con otro módulo"}.`);
    susurrarDM("Ecos de la frontera · módulos", [...lineas, "Hay que recargar el mundo para que se note."]);
  }
  if (RECARGA_PENDIENTE.length) susurrarDM("Ecos de la frontera · recargar", [`Hay que recargar el mundo para: ${[...new Set(RECARGA_PENDIENTE)].join("; ")}.`]);
  MODULOS_A_APAGAR.length = 0;
  RECARGA_PENDIENTE.length = 0;
  const SC = foundry.applications?.settings?.SettingsConfig ?? globalThis.SettingsConfig;
  if (SC?.reloadConfirm) await SC.reloadConfirm({ world: true });
  else foundry.utils.debouncedReload?.();
}

/* ------------------------------------------------------------------ */
/*  Panel del DM: tiempo, luz, vigilia, rumores, encuentros y atajos   */
/* ------------------------------------------------------------------ */

/** Hora del día en segundos (Seasons & Stars si está; si no, el reloj de Foundry). */
function segundosDelDia() {
  try {
    const d = game.seasonsStars?.api?.getCurrentDate?.();
    if (d?.time) return ((d.time.hour ?? 0) * 3600) + ((d.time.minute ?? 0) * 60) + (d.time.second ?? 0);
  } catch {
    /* sin calendario: se usa el reloj de Foundry */
  }
  const t = game.time.worldTime ?? 0;
  return ((t % 86400) + 86400) % 86400;
}

const HORA_MANANA = 7;
/** Segundos hasta las 7:00 del día siguiente (si es de madrugada, hasta las 7:00 de hoy). */
function segundosHastaManana() {
  const s = segundosDelDia();
  return (s < 5 * 3600) ? ((HORA_MANANA * 3600) - s) : (86400 - s + (HORA_MANANA * 3600));
}

/** Oscuridad según la hora: día 0, amanecer y atardecer 0,5, noche 0,85. */
function oscuridadPorHora(h = Math.floor(segundosDelDia() / 3600)) {
  if ((h >= 7) && (h < 19)) return 0;
  if ((h === 6) || (h === 19) || (h === 20)) return 0.5;
  return 0.85;
}

async function ponerOscuridad(nivel) {
  const escena = canvas.scene;
  if (!escena) return ui.notifications.warn("No hay una escena abierta.");
  await escena.update({ "environment.darknessLevel": nivel }, { animateDarkness: 4000 });
}

function alternarDiaNoche() {
  const actual = canvas.scene?.environment?.darknessLevel ?? 0;
  return ponerOscuridad(actual >= 0.5 ? 0 : 0.85);
}

/* Vigilia: quien no durmió entre dos «Día siguiente» tira Constitución (CD 10, +5 por noche seguida) o gana Agotamiento. */
const CD_VIGILIA = dias => 10 + (5 * Math.max(0, dias - 1));
const pjsDelGrupo = () => game.actors.filter(a => esPJ(a) && a.hasPlayerOwner);

async function marcarDurmio(actor) {
  if (!actor?.isOwner) return;
  await actor.setFlag(MOD, "vigilia", { dias: 0, durmio: true });
}

/** Quién no durmió desde el último «Día siguiente» y con qué CD le toca. */
function sinDormir() {
  return pjsDelGrupo().map(a => {
    const v = a.getFlag(MOD, "vigilia");
    if (!v || v.durmio) return null;
    const dias = (v.dias ?? 0) + 1;
    return { actor: a, dias, cd: CD_VIGILIA(dias) };
  }).filter(Boolean);
}

async function diaSiguiente({ confirmar = true } = {}) {
  if (!game.user.isGM) return;
  const pendientes = sinDormir();
  if (confirmar) {
    const lista = pendientes.length
      ? `<p>No durmieron desde el último día y tiran <b>Constitución</b> (si fallan, +1 Agotamiento):</p><ul>${pendientes.map(p => `<li><b>${escH(p.actor.name)}</b>: ${p.dias === 1 ? "1.ª noche" : `${p.dias}.ª noche seguida`} → CD ${p.cd}</li>`).join("")}</ul>`
      : "<p>Todos durmieron (Descanso Largo, en Santuario o a la intemperie): nadie tira.</p>";
    const ok = await foundry.applications.api.DialogV2.confirm({
      window: { title: "Día siguiente" },
      content: `<div class="ecos-dialogo"><p>Pasa el reloj a las <b>${HORA_MANANA}:00</b> del día siguiente.</p>${lista}</div>`,
      rejectClose: false
    }).catch(() => false);
    if (!ok) return;
  }
  for (const a of pjsDelGrupo()) {
    const p = pendientes.find(x => x.actor === a);
    await a.setFlag(MOD, "vigilia", { dias: p ? p.dias : 0, durmio: false });
    if (!p) continue;
    const exh = a.system.attributes.exhaustion ?? 0;
    await publicar(a, "🌙 Una noche sin dormir", [
      `<b>${escH(a.name)}</b> pasó ${p.dias === 1 ? "la noche" : `${p.dias} noches seguidas`} sin un Descanso Largo. El cuerpo pasa factura.`,
      `Salvación de <b>Constitución CD ${p.cd}</b>: si falla, <b>+1 Agotamiento</b> (ahora ${exh}). La CD sube 5 por cada noche seguida y vuelve a 10 al dormir.`
    ], {
      clase: "ecos-intemperie",
      extra: cajaBotones([boton("vigilia", `Tirar Constitución (CD ${p.cd})`, "fa-bed")]),
      flags: { [MOD]: { ref: { actorId: a.id }, vigilia: { cd: p.cd, dias: p.dias } } }
    });
  }
  await game.time.advance(segundosHastaManana());
  if (canvas.scene && (canvas.scene.environment?.darknessLevel ?? 0) > 0.3) await ponerOscuridad(0);
}

/** Botón de la tarjeta: tira el dueño (o el DM) y el DM aplica el resultado. */
async function tirarVigilia(message, b, actorId) {
  const actor = game.actors.get(actorId);
  const v = message.getFlag(MOD, "vigilia");
  if (!actor?.isOwner || !v) return;
  b.disabled = true;
  try {
    const rolls = await actor.rollSavingThrow({ ability: "con", target: v.cd });
    const r = Array.isArray(rolls) ? rolls[0] : rolls;
    if (!r) return;
    await alDM({ accion: "vigilia", actorId, messageId: message.id, total: r.total, userId: game.user.id });
  } finally {
    b.disabled = false;
  }
}

async function resolverVigilia(actor, d) {
  const msg = game.messages.get(d.messageId);
  const v = msg?.getFlag(MOD, "vigilia");
  if (!v || msg.getFlag(MOD, "usado")) return;
  const user = game.users.get(d.userId);
  if (user && !user.isGM && !actor.testUserPermission(user, "OWNER")) return;
  let texto;
  if (Number(d.total) >= v.cd) texto = `✔ ${actor.name} aguanta (${d.total} contra CD ${v.cd}).`;
  else {
    const exh = actor.system.attributes.exhaustion ?? 0;
    const nuevo = Math.min(exh + 1, CONFIG.DND5E.conditionTypes.exhaustion.levels);
    await actor.update({ "system.attributes.exhaustion": nuevo });
    texto = `✘ ${actor.name} no aguanta (${d.total} contra CD ${v.cd}): Agotamiento ${exh} → <b>${nuevo}</b>.`;
  }
  await msg.update({ [`flags.${MOD}.usado`]: texto });
}

/* ---------- Mega menú: todos los botones de la barra izquierda, ordenados y explicados ---------- */
/** Lo que queda en la barra izquierda: el DM, solo Seleccionar y Regla (y su menú); los jugadores, además plantillas y notas. */
const FIJOS_DM = ["tokens", "tokens.select", "tokens.ruler"];
const FIJOS_JUGADOR = ["tokens", "templates", "notes", "tokens.select", "tokens.ruler"];
const FIJOS_INICIALES = FIJOS_JUGADOR;
const fijosIniciales = () => (game.user?.isGM ? FIJOS_DM : FIJOS_JUGADOR);

/** Secciones del mega menú, en orden. Cada grupo de la barra va a una. */
const MEGA_SECCIONES = [
  ["jugar", "En la partida", "Lo que se usa con los jugadores sentados a la mesa."],
  ["mapa", "Preparar el mapa", "Para armar una escena antes de jugar: paredes, luces, teselas, dibujos, regiones y pisos."],
  ["ambiente", "Ambiente", "Sonido, clima y efectos sobre la escena."],
  ["modulos", "Herramientas de módulos", "Botones que agregan los módulos instalados."]
];
const MEGA_GRUPOS = {
  tokens: { s: "jugar", d: "Lo de la partida: seleccionar y mover tokens, y medir (apuntar: tecla T sobre un token). De Ecos hay un solo botón: el Menú del DM (la montaña) o, para los jugadores, la brújula.", c: "Siempre: es el modo normal de juego." },
  templates: { s: "jugar", d: "Plantillas de área (círculo, cono, rectángulo, línea) para conjuros, alientos y explosiones.", c: "En combate, cuando alguien pone un área a mano. Midi las pone solo al usar el conjuro desde la hoja." },
  notes: { s: "jugar", d: "Notas del mapa: chinchetas que abren un diario o una página (una casa, una tienda, una pista). Aquí están también el calendario y el clima.", c: "Para marcar lugares en mapas de exploración y del pueblo." },
  walls: { s: "mapa", d: "Paredes, puertas y ventanas: bloquean la vista, el paso, la luz y el sonido.", c: "Solo en mapas donde los tokens se mueven con visión y niebla de guerra (tableros y mazmorras). En los telones narrados no hacen falta." },
  lighting: { s: "mapa", d: "Luces fijas (fogatas, faroles, ventanas iluminadas) y el paso del día a la noche en la escena.", c: "En mapas con visión: sin luces ni paredes, la escena se ve entera o no se ve. También para pasar a noche con un clic." },
  tiles: { s: "mapa", d: "Teselas: imágenes encima del mapa (objetos, techos, carteles). Con Monk's Active Tiles pueden hacer cosas al pisarlas o clicarlas.", c: "Al preparar escenas: techos que se ocultan al entrar, objetos que se mueven, trampas." },
  drawings: { s: "mapa", d: "Dibujos y textos a mano alzada sobre el mapa: rectángulos, elipses, polígonos y etiquetas.", c: "Para marcar algo rápido en mesa (una zona, una flecha, un nombre) o escribir sobre un mapa mudo." },
  regions: { s: "mapa", d: "Regiones: zonas con comportamientos (terreno difícil, daño, teletransporte, cambiar de escena, ejecutar un macro).", c: "Al preparar escenas con reglas: una escalera que lleva a otro piso, una zona de daño, una salida a otra escena." },
  levels: { s: "mapa", d: "Levels: pisos y alturas (sótanos, segundo piso, escaleras, puentes).", c: "Solo en mapas de varios pisos, como el Veth Solaan o una torre." },
  sounds: { s: "ambiente", d: "Sonidos ambiente colocados en el mapa (río, taberna, viento, fragua) que se oyen al acercarse.", c: "Para dar vida a una escena: el agua del vado, el ruido del Roble." },
  effects: { s: "ambiente", d: "FXMaster: lluvia, nieve, niebla, hojas y filtros de color sobre la escena.", c: "Cuando quieras un clima concreto a mano. El clima de cada día ya lo pone Simple Weather solo." },
  sequencer: { s: "modulos", d: "Sequencer: buscar, probar y quitar animaciones (JB2A).", c: "Casi nunca: las animaciones las lanza el módulo solo." },
  "token-attacher": { s: "modulos", d: "Token Attacher: pegar luces, paredes o teselas a un token para que se muevan juntos.", c: "Para un carro, un barco o un farol que alguien lleva." },
  multiTokenEdit: { s: "modulos", d: "Mass Edit: editar muchos tokens, luces o paredes a la vez y guardar presets.", c: "Al preparar: cambiar de golpe la visión o el tamaño de varios tokens." },
  moulinette: { s: "modulos", d: "Moulinette: buscador de mapas, imágenes y sonidos de tu disco y de creadores.", c: "Al preparar: encontrar un mapa o un token sin salir de Foundry." },
  "monks-active-tiles": { s: "modulos", d: "Monk's Active Tiles: teselas que disparan acciones (abrir una puerta, cambiar de escena, tirar un dado).", c: "Al preparar trampas, puertas secretas y eventos." }
};
const MEGA_HERRAMIENTAS = {
  select: "Seleccionar y mover. Arrastra un rectángulo para seleccionar varios.",
  target: "Apuntar: marca objetivos para ataques y conjuros (también con T sobre un token).",
  ruler: "Medir distancias (también arrastrando con clic derecho).",
  unconstrainedMovement: "Mover sin que las paredes frenen los tokens (solo el DM).",
  ecosMenu: "Menú de Ecos para los jugadores: jornada de trabajo, mercadillo, calendario y toda la barra explicada.",
  ecosPanel: "Menú del DM: todo Ecos, las hojas, toda la barra izquierda y los ajustes, cada botón explicado.",
  ecosSantuario: "Santuario SÍ/NO: decide si el Descanso Largo es completo.",
  ecosRelojes: "Relojes del valle: todos los de Tramas · 9 en una ventana, con + y −.",
  ecosClima: "El clima: elígelo a mano (cielo, viento, temperatura) o al azar, ponlo en la escena o márcala bajo techo. La tarjeta del chat dice qué cambia en el juego.",
  ecosJornada: "Jornada de trabajo de los PJ.",
  ecosMercadillo: "Mercadillo de Arcegris (tiendas).",
  ecosCalendario: "Abre o cierra el calendario de Arcegris (Seasons & Stars).",
  diceTray: "Bandeja de dados para tirar a mano.",
  togglelootable: "Convertir enemigos derrotados en botín (Monk's TokenBar).",
  findtoken: "Centrar la cámara en tu token.",
  disabletoken: "Bloodsplats: que los derrotados no se puedan seleccionar.",
  suppressTheatre: "Ocultar un momento el teatro (los retratos de diálogo).",
  circle: "Círculo (bola de fuego, explosiones).",
  cone: "Cono (aliento, manos ardientes).",
  rect: "Rectángulo o cuadrado.",
  rect_d: "Rectángulo.",
  ray: "Línea (relámpago).",
  tile: "Colocar una tesela nueva.",
  browse: "Abrir el explorador de archivos para elegir una imagen.",
  foreground: "Editar las teselas de primer plano (techos).",
  ellipse: "Elipse o círculo.",
  polygon: "Polígono (un clic por punto).",
  freehand: "Dibujo a mano alzada.",
  text: "Texto sobre el mapa.",
  configure: "Opciones por defecto de los dibujos.",
  walls: "Pared normal: bloquea todo.",
  terrain: "Pared de terreno: deja ver a través de una, no de dos (setos, cortinas).",
  invisible: "Pared invisible: bloquea el paso pero no la vista.",
  ethereal: "Pared etérea: bloquea la vista pero no el paso (niebla, cascada).",
  doors: "Puerta: se abre y se cierra con un clic.",
  secret: "Puerta secreta: solo el DM la ve hasta que se abre.",
  window: "Ventana: deja pasar la vista y la luz de lejos, no el paso.",
  clone: "Copiar el tipo de la última pared seleccionada.",
  snap: "Ajustar a la cuadrícula.",
  closeDoors: "Cerrar todas las puertas de la escena.",
  light: "Colocar o editar luces.",
  day: "Pasar la escena a día.",
  night: "Pasar la escena a noche.",
  reset: "Volver la oscuridad a la de la configuración de la escena.",
  sound: "Colocar un sonido ambiente.",
  preview: "Escuchar los sonidos mientras editas.",
  rectangle: "Región rectangular.",
  hole: "Hacer un agujero en una región.",
  journal: "Mostrar u ocultar todas las notas del mapa.",
  toggle: "Mostrar u ocultar todas las notas del mapa.",
  "simple-weather": "Abrir el clima (Simple Weather).",
  "seasons-stars-widget": "Abrir el calendario de Arcegris.",
  clear: "Borrar todo lo de esta capa en la escena (pide confirmación)."
};

/** Lo que este módulo escondió de la barra (para poder listarlo y usarlo igual desde el mega menú). */
const OCULTO_POR_ECOS = new Set();
let MEGA_FORZADO = null; // grupo que se muestra porque se está usando
let MEGA_HERR = null; // herramienta de Tokens que se muestra porque se está usando ("tokens.x")
let MEGA_USANDO = false;

const leerAjuste = (k, d) => {
  try {
    return game.settings.get(MOD, k) ?? d;
  } catch {
    return d;
  }
};
const ocultos = () => leerAjuste("barraOculta", []);
const fijos = () => new Set(leerAjuste("barraFija", fijosIniciales()));
const compacta = () => !!leerAjuste("barraCompacta", true);

/** Esconde de la barra lo que no está fijado (barra compacta) o lo que el usuario ocultó. No borra nada: todo se puede usar desde el mega menú. */
const NUNCA_OCULTAR = new Set(["tokens.unconstrainedMovement"]);
function ocultarBarra(controls) {
  OCULTO_POR_ECOS.clear();
  const activo = MEGA_FORZADO ?? ui.controls?.control?.name;
  const herrActiva = ui.controls?.tool?.name;
  const esconder = (g, h) => {
    // En v13 lo escondido desaparece de ui.controls, y dnd5e lee «Movimiento sin restricciones» en cada arrastre del DM:
    // sin ella el token se traba (TypeError en _getDragConstrainOptions).
    if (NUNCA_OCULTAR.has(h ? `${g}.${h}` : g)) return;
    const c = controls[g];
    if (!c) return;
    const x = h ? c.tools?.[h] : c;
    if (!x || (x.visible === false)) return;
    x.visible = false;
    OCULTO_POR_ECOS.add(h ? `${g}.${h}` : g);
  };
  if (compacta()) {
    const f = fijos();
    for (const g of Object.keys(controls)) {
      if ((g === "tokens") || (g === activo) || f.has(g)) continue;
      esconder(g);
    }
    const tok = controls.tokens;
    for (const h of Object.keys(tok?.tools ?? {})) {
      if (h.startsWith("ecos") || f.has(`tokens.${h}`) || tok.tools[h]?.active) continue;
      if (((activo === "tokens") && (herrActiva === h)) || (MEGA_HERR === `tokens.${h}`)) continue;
      esconder("tokens", h);
    }
    return;
  }
  for (const clave of ocultos()) {
    const [g, h] = clave.split(".");
    if (!controls[g] || ((g === "tokens") && !h) || h?.startsWith("ecos") || (!h && (g === activo))) continue;
    esconder(g, h);
  }
}

/** v2.7.2: la barra vuelve a lo básico una vez en cada navegador. El DM: Seleccionar, Regla y su menú; todo lo demás, en el Menú del DM. */
async function barraBasicaV272() {
  if (leerAjuste("barraV272", false)) return;
  await game.settings.set(MOD, "barraFija", fijosIniciales());
  await game.settings.set(MOD, "barraCompacta", true);
  await game.settings.set(MOD, "barraV272", true);
  ui.controls?.render({ reset: true });
}
Hooks.once("ready", () => setTimeout(() => barraBasicaV272().catch(err => console.warn(`${MOD} | barra`, err)), 500));

/* 2.7.2 · Todo va hoja por hoja (botón Ecos). Lo que hoy usa cada PJ (por la carpeta de antes) queda encendido en su hoja. */
async function migrarHojas272() {
  if (!game.user.isGM || leerAjuste("hojasV272", false)) return;
  const d = game.settings.get(MOD, "descansos") ?? {};
  const regla = d.regla ?? "pj";
  const pjAntes = a => {
    const f = a.getFlag(MOD, "pj");
    if ((f === true) || (f === false)) return f;
    return (a.type === "character") && enCarpetaPJ(a) && ((a.system.details?.level ?? 0) > 0);
  };
  const descAntes = a => {
    if (regla === "apagado") return false;
    const f = a.getFlag(MOD, "descansos");
    if ((f === true) || (f === false)) return f;
    // «Todas las fichas de personaje» duró unos minutos (2.7.1): se toma como «los PJ», para no encender las fichas archivadas.
    return pjAntes(a);
  };
  const quedan = [];
  for (const a of game.actors) {
    if (!HOJA_TIPOS.includes(a.type)) continue;
    const pj = pjAntes(a);
    const de = descAntes(a);
    const u = {};
    if (pj && (a.getFlag(MOD, "pj") !== true)) u[`flags.${MOD}.pj`] = true;
    if (!pj && (a.getFlag(MOD, "pj") === false)) u[`flags.${MOD}.-=pj`] = null;
    if (de && (a.getFlag(MOD, "descansos") !== true)) u[`flags.${MOD}.descansos`] = true;
    if (!de && (a.getFlag(MOD, "descansos") === false)) u[`flags.${MOD}.-=descansos`] = null;
    if (Object.keys(u).length) await a.update(u);
    if (pj || de) quedan.push(`${escH(a.name)} (${[pj ? "PJ" : "", de ? "descansos" : ""].filter(Boolean).join(", ")})`);
  }
  await game.settings.set(MOD, "descansos", { ...DESC_DEF, ...d, v272: true, regla: (regla === "apagado") ? "apagado" : "hojas" });
  await game.settings.set(MOD, "hojasV272", true);
  susurrarDM("Ecos 2.7.2 · Todo va hoja por hoja", [
    "Ya no cuenta la carpeta. Arriba de cada hoja (PJ o PNJ) tienes el botón <b>Ecos</b>: ahí enciendes o apagas las <b>Reglas de PJ</b>, los <b>Descansos</b> con Dados de Golpe, el <b>Verbe</b> y el <b>secreto</b>. Una hoja nueva nace con todo apagado.",
    `Quedaron encendidas como estaban: <b>${quedan.join(", ") || "ninguna"}</b>.`,
    "La lista de todas las hojas está en <b>Menú del DM → Hojas</b>. El mega menú ya no va aparte: toda la barra izquierda está en las pestañas del Menú del DM."
  ]);
}
Hooks.once("ready", () => {
  migrarHojas272().catch(err => console.error(`${MOD} | hojas 2.7.2`, err));
});

/** Activa un grupo o una herramienta de la barra, aunque esté escondido. */
async function usarHerramienta(g, h) {
  const ctrl = ui.controls?.controls?.[g];
  if (!ctrl) return;
  const tool = h ? ctrl.tools?.[h] : null;
  const accion = tool && (tool.button || tool.toggle);
  MEGA_FORZADO = g;
  MEGA_HERR = (h && !accion) ? `${g}.${h}` : null;
  MEGA_USANDO = true;
  try {
    // Primero se rehace la barra con el grupo (y la herramienta) a la vista; después se activa.
    await ui.controls.render({ reset: true });
    if (accion) {
      if (ui.controls.control?.name !== g) await ui.controls.activate({ control: g });
      const t = ui.controls.controls?.[g]?.tools?.[h] ?? tool;
      if (t.toggle) {
        const nuevo = !t.active;
        t.active = nuevo;
        await t.onChange?.(new Event("click"), nuevo);
      } else await t.onChange?.(new Event("click"), true);
    } else {
      await ui.controls.activate({ control: g, ...(h ? { tool: h } : {}) });
    }
  } catch (err) {
    console.warn(`${MOD} | mega menú`, err);
  } finally {
    await ui.controls.render({ reset: true });
    MEGA_USANDO = false;
  }
}
// Si algo activa un grupo escondido (una tecla, otro módulo), se muestra mientras se usa; al dejarlo, vuelve a esconderse.
Hooks.on("renderSceneControls", app => {
  const c = app?.control;
  if (!c || MEGA_USANDO) return;
  if ((c.visible === false) && OCULTO_POR_ECOS.has(c.name)) {
    MEGA_FORZADO = c.name;
    app.render({ reset: true });
    return;
  }
  let rehacer = false;
  if (MEGA_FORZADO && (c.name !== MEGA_FORZADO)) {
    MEGA_FORZADO = null;
    rehacer = true;
  }
  if (MEGA_HERR && (`${c.name}.${app.tool?.name}` !== MEGA_HERR)) {
    MEGA_HERR = null;
    rehacer = true;
  }
  if (rehacer && compacta()) app.render({ reset: true });
});

/* ---------- La barra izquierda dentro de los menús (antes, el mega menú aparte) ---------- */

/** Las tarjetas de la barra: un grupo por tarjeta, con cada herramienta explicada y lista para usar. */
function htmlBarra(soloSeccion = null) {
  const controles = ui.controls?.controls ?? {};
  const loc = x => (x ? game.i18n.localize(x) : "");
  const f = fijos();
  const comp = compacta();
  const activo = ui.controls?.control?.name;
  const visible = (k, x) => (x?.visible !== false) || OCULTO_POR_ECOS.has(k);
  const pin = (k, puesto) => `<button type="button" class="ecos-mega-pin ${puesto ? "activo" : ""}" data-action="fijar" data-k="${escH(k)}" data-tooltip="${puesto ? "Quitar de la barra" : "Fijar en la barra"}"><i class="fa-solid fa-thumbtack"></i></button>`;
  const porSeccion = Object.fromEntries(MEGA_SECCIONES.map(([s]) => [s, []]));
  for (const g of Object.values(controles).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))) {
    if (!visible(g.name, g)) continue;
    const info = MEGA_GRUPOS[g.name] ?? { s: "modulos", d: "Añadido por un módulo.", c: "" };
    const herr = Object.values(g.tools ?? {}).filter(t => visible(`${g.name}.${t.name}`, t) && !["ecosPanel", "ecosMenu"].includes(t.name))
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const enBarra = !comp || (g.name === "tokens") || f.has(g.name);
    const filas = herr.map(t => {
      const k = `${g.name}.${t.name}`;
      const desc = MEGA_HERRAMIENTAS[((g.name === "drawings") && (t.name === "rect")) ? "rect_d" : t.name] ?? "";
      return `<li class="ecos-mega-herr" data-texto="${escH(`${loc(t.title)} ${t.name} ${desc}`.toLowerCase())}">
        <button type="button" class="ecos-mega-usar" data-action="usar" data-g="${escH(g.name)}" data-h="${escH(t.name)}" data-tooltip="Usar"><i class="${escH(t.icon ?? "fa-solid fa-circle")}"></i></button>
        <span><b>${escH(loc(t.title) || t.name)}</b>${desc ? ` <span class="ecos-nota">${escH(desc)}</span>` : ""}</span>
        ${(g.name === "tokens") ? pin(k, f.has(k)) : ""}</li>`;
    }).join("");
    porSeccion[info.s].push(`<article class="ecos-mega-tarjeta ${g.name === activo ? "activo" : ""}" data-texto="${escH(`${loc(g.title)} ${g.name} ${info.d} ${info.c}`.toLowerCase())}">
      <header>
        <button type="button" class="ecos-mega-usar grande" data-action="usar" data-g="${escH(g.name)}" data-tooltip="Abrir este grupo"><i class="${escH(g.icon ?? "fa-solid fa-circle")}"></i></button>
        <div class="ecos-mega-texto"><h4>${escH(loc(g.title) || g.name)}</h4><p>${escH(info.d)}</p>${info.c ? `<p class="ecos-nota"><b>Cuándo:</b> ${escH(info.c)}</p>` : ""}</div>
        ${(g.name === "tokens") ? "" : pin(g.name, f.has(g.name))}
      </header>
      ${enBarra ? "" : `<p class="ecos-nota ecos-mega-fuera">No está en tu barra: úsalo desde aquí (al usarlo aparece a la izquierda mientras lo uses) o fíjalo con la chincheta.</p>`}
      <ul>${filas}</ul></article>`);
  }
  return MEGA_SECCIONES.filter(([s]) => (!soloSeccion || (s === soloSeccion)) && porSeccion[s].length).map(([s, titulo, sub]) =>
    `<section class="ecos-mega-seccion" data-seccion="${s}"><h3>${titulo}</h3><p class="ecos-nota">${sub}</p><div class="ecos-mega-grilla">${porSeccion[s].join("")}</div></section>`).join("");
}

/** Las acciones de la barra, iguales en el Menú del DM y en el de los jugadores. */
const ACCIONES_BARRA = {
  async usar(event, target) {
    await usarHerramienta(target.dataset.g, target.dataset.h || null);
    this.render();
  },
  async fijar(event, target) {
    const k = target.dataset.k;
    const f = fijos();
    if (f.has(k)) f.delete(k);
    else f.add(k);
    await game.settings.set(MOD, "barraFija", [...f]);
    await ui.controls.render({ reset: true });
    this.render();
  },
  async compacta() {
    await game.settings.set(MOD, "barraCompacta", !compacta());
    await ui.controls.render({ reset: true });
    this.render();
  },
  async todo() {
    await game.settings.set(MOD, "barraFija", fijosIniciales());
    await game.settings.set(MOD, "barraOculta", []);
    await ui.controls.render({ reset: true });
    this.render();
  }
};

/** El buscador de arriba: filtra botones, tarjetas y filas de todas las pestañas a la vez. */
function engancharBuscador(app, content) {
  const input = content.querySelector(".ecos-buscar");
  if (!input) return;
  const aplicar = () => {
    const q = input.value.trim().toLowerCase();
    app._busqueda = input.value;
    content.querySelectorAll("[data-pestana]").forEach(p => {
      p.hidden = q ? false : (p.dataset.pestana !== (app._tab ?? "ecos"));
    });
    content.querySelectorAll(".ecos-mega-tarjeta").forEach(tj => {
      const enTarjeta = !q || tj.dataset.texto.includes(q);
      let alguna = false;
      tj.querySelectorAll(".ecos-mega-herr").forEach(h => {
        const si = !q || h.dataset.texto.includes(q);
        h.hidden = !si && !enTarjeta;
        alguna ||= si;
      });
      tj.hidden = !enTarjeta && !alguna;
    });
    content.querySelectorAll(".ecos-buscable").forEach(el => {
      el.hidden = !!q && !el.dataset.texto.includes(q);
    });
    content.querySelectorAll("[data-pestana] section, [data-pestana] .ecos-mega-seccion").forEach(s => {
      if (!q) {
        s.hidden = false;
        return;
      }
      const hay = [...s.querySelectorAll(".ecos-buscable, .ecos-mega-tarjeta")].some(x => !x.hidden);
      s.hidden = !hay;
    });
  };
  input.addEventListener("input", aplicar);
  input.addEventListener("keydown", ev => ev.stopPropagation());
  if (app._busqueda) {
    input.value = app._busqueda;
    aplicar();
  }
}

/** Los ajustes del módulo que antes estaban solo en Configuración: aquí, con su explicación. */
function htmlAjustesModulo() {
  const filas = [];
  for (const s of game.settings.settings.values()) {
    if ((s.namespace !== MOD) || !s.config) continue;
    if ((s.scope === "world") && !game.user.isGM) continue;
    const v = game.settings.get(MOD, s.key);
    const nombre = game.i18n.localize(s.name ?? s.key);
    const ayuda = s.hint ? game.i18n.localize(s.hint) : "";
    let control;
    if (s.choices) {
      control = `<select data-ajuste="${s.key}">${Object.entries(s.choices).map(([k, t]) => `<option value="${escH(k)}" ${String(k) === String(v) ? "selected" : ""}>${escH(game.i18n.localize(t))}</option>`).join("")}</select>`;
    } else if (s.type === Boolean) {
      control = `<label class="ecos-check"><input type="checkbox" data-ajuste="${s.key}" ${v ? "checked" : ""}> ${v ? "Sí" : "No"}</label>`;
    } else if (s.type === Number) {
      const r = s.range ?? {};
      control = `<input type="number" data-ajuste="${s.key}" value="${escH(v)}" ${Number.isFinite(r.min) ? `min="${r.min}"` : ""} ${Number.isFinite(r.max) ? `max="${r.max}"` : ""} ${r.step ? `step="${r.step}"` : ""} style="width:6em">`;
    } else {
      control = `<input type="text" data-ajuste="${s.key}" value="${escH(v)}">`;
    }
    filas.push(`<li class="ecos-ajuste ecos-buscable" data-texto="${escH(`${nombre} ${ayuda}`.toLowerCase())}">
      <div><b>${escH(nombre)}</b>${s.requiresReload ? ` <span class="ecos-nota">(al cambiarlo, F5)</span>` : ""}${ayuda ? `<p class="ecos-nota">${escH(ayuda)}</p>` : ""}</div>
      <div class="ecos-ajuste-control">${control}</div></li>`);
  }
  return `<ul class="ecos-ajustes">${filas.join("")}</ul>`;
}

function engancharAjustes(app, content) {
  content.querySelectorAll("[data-ajuste]").forEach(el => {
    el.addEventListener("keydown", ev => ev.stopPropagation());
    el.addEventListener("change", async () => {
      const k = el.dataset.ajuste;
      const s = game.settings.settings.get(`${MOD}.${k}`);
      if (!s) return;
      let v;
      if (el.type === "checkbox") v = el.checked;
      else if (s.type === Number) v = Number(el.value);
      else v = el.value;
      try {
        await game.settings.set(MOD, k, v);
        ui.notifications.info(`Ecos de la frontera: «${game.i18n.localize(s.name ?? k)}» guardado${s.requiresReload ? ". Recarga con F5 para que tome efecto" : ""}.`);
      } catch (err) {
        console.error(`${MOD} | ajuste ${k}`, err);
        ui.notifications.error(`Ecos de la frontera: no pude guardar «${k}».`);
      }
      app.render();
    });
  });
}

/* ---------- El menú de los jugadores (la brújula de la barra de Tokens) ---------- */
const OPS_JUGADOR = [
  ["jornada", "Jornada de trabajo", "fa-hammer", "Trabajar en tu oficio por horas. También está en tu hoja: Trabajar."],
  ["mercadillo", "Mercadillo", "fa-store", "Las tiendas abiertas de Arcegris. También está en tu hoja: Mercado."],
  ["calendario", "Calendario", "fa-calendar-days", "La fecha, la luna y las fiestas de Arcegris."]
];
class MenuJugador extends foundry.applications.api.ApplicationV2 {
  static DEFAULT_OPTIONS = {
    id: "ecos-menu-jugador",
    classes: ["ecos-panel-dm", "ecos-mega", "ecos-menu-jugador"],
    window: { title: "Ecos de la frontera", icon: "fa-solid fa-compass", resizable: true },
    position: { width: 640, height: 640 },
    actions: { ecos: MenuJugador.#accion, ...ACCIONES_BARRA }
  };

  static #accion(event, target) {
    const op = target.dataset.op;
    const hacer = { jornada: () => abrirJornada(), mercadillo: () => abrirMercadillo(), calendario: () => abrirCalendario() }[op];
    Promise.resolve(hacer?.()).catch(err => console.error(`${MOD} | menú`, err));
  }

  async _renderHTML() {
    const comp = compacta();
    return `<div class="ecos-mega-barra">
        <input type="search" class="ecos-buscar" placeholder="Buscar un botón (medir, apuntar, plantilla, calendario…)" autocomplete="off">
        <button type="button" data-action="compacta" class="${comp ? "activo" : ""}"><i class="fa-solid fa-compress"></i> Barra compacta: ${comp ? "SÍ" : "NO"}</button>
        <button type="button" data-action="todo"><i class="fa-solid fa-rotate-left"></i> Fijados por defecto</button>
      </div>
      <section><h3>Ecos</h3><div class="ecos-panel-botones">${OPS_JUGADOR.map(([op, et, ic, tip]) => `<button type="button" class="ecos-buscable" data-texto="${escH(`${et} ${tip}`.toLowerCase())}" data-action="ecos" data-op="${op}"><i class="fa-solid ${ic}"></i><span class="ecos-panel-et"><b>${et}</b><small>${escH(tip)}</small></span></button>`).join("")}</div></section>
      <p class="ecos-nota">Abajo, todos los botones de la barra izquierda, explicados. Haz clic en un ícono para usarlo; la chincheta lo deja fijo en tu barra.</p>
      ${htmlBarra()}`;
  }

  _replaceHTML(result, content) {
    content.innerHTML = result;
    content.querySelectorAll("[data-pestana]").forEach(p => { p.hidden = false; });
    engancharBuscador(this, content);
  }
}
let menuJugador = null;
function abrirMenuJugador() {
  menuJugador ??= new MenuJugador();
  return menuJugador.render({ force: true });
}

/** El atajo Mayús+M y el viejo «mega menú»: ahora abren el menú de cada uno, en la barra. */
function abrirMegaMenu() {
  return game.user.isGM ? abrirPanelDM("jugar") : abrirMenuJugador();
}

/* ---------- La ventana del panel ---------- */
const OPS_PANEL = [
  ["Tiempo", [
    ["diaSiguiente", "Día siguiente", "fa-sun", "Pasa a las 7:00 del día siguiente. Quien no hizo un Descanso Largo tira Constitución (CD 10, +5 por cada noche seguida sin dormir) o gana 1 de Agotamiento."],
    ["diaNoche", "Día / Noche", "fa-circle-half-stroke", "Alterna la luz de la escena actual entre día y noche."],
    ["luzHora", "Luz según la hora", "fa-clock", "Pone la oscuridad de la escena según la hora del calendario."],
    ["hora", "+1 hora", "fa-forward", "Adelanta el reloj una hora."],
    ["calendario", "Calendario", "fa-calendar-days", "Abre o cierra el calendario de Arcegris (Seasons & Stars)."]
  ]],
  ["Grupo", [
    ["santuario", "Santuario", "fa-house-chimney-medical", "Santuario SÍ/NO: en Santuario el Descanso Largo es completo (Dados de Golpe, conjuros, Agotamiento); a la intemperie cuenta como corto."],
    ["descansos", "Descansos", "fa-bed-pulse", "Descansos y Dados de Golpe: cuántos se recuperan, el tope por descanso y la lista de hojas que los usan (se encienden en cada hoja con el botón Ecos)."],
    ["estado", "Estado de los PJ", "fa-heart-pulse", "Abre la página de heridas, Malherido, Agotamiento y tratamientos de las hojas con Reglas de PJ."],
    ["tirada", "Pedir tirada", "fa-dice-d20", "Pide una prueba o salvación a los jugadores (Monk's TokenBar). Usa los tokens seleccionados o el grupo."],
    ["xp", "Repartir XP", "fa-star", "Reparte experiencia (Monk's TokenBar)."]
  ]],
  ["Mundo", [
    ["rumor", "Rumor", "fa-comments", "Saca en privado un rumor de la posada (a veces una habladuría de la estación)."],
    ["encuentro", "Encuentro", "fa-paw", "Tira la tabla de la zona: sale una escena o una plantilla, y el módulo arma las criaturas para el grupo de hoy (Plantillas de combate). Solo para ti."],
    ["relojes", "Relojes", "fa-hourglass-half", "Todos los relojes de Tramas · 9 con + y −, y los motivos por los que suben, se frenan o bajan. Al subir uno, te susurra lo que pasa."],
    ["suceso", "Suceso del día", "fa-newspaper", "Saca en privado lo que pasa hoy en el valle (clima, pueblo, política o frontera), de la tabla del mes."],
    ["clima", "Clima", "fa-cloud-sun-rain", "El clima de hoy: elegirlo a mano (cielo, viento y temperatura) o al azar según la estación, ponerlo en la escena o marcarla bajo techo. La tarjeta dice qué cambia en el juego."],
    ["anunciar", "Anunciar el día", "fa-calendar-day", "Vuelve a sacar en el chat la fecha, la luna y las fiestas de hoy."]
  ]],
  ["Mesa", [
    ["jornada", "Jornada de trabajo", "fa-hammer", "Abre la jornada de trabajo de un PJ."],
    ["mercadillo", "Mercadillo", "fa-store", "Abre el Mercadillo de Arcegris."],
    ["pantalla", "Pantalla del DM", "fa-table-columns", "Abre o cierra la Pantalla del DM (pestaña «Ecos · DM»)."]
  ]]
];

function textoEstadoPanel() {
  const d = hoyArcegris();
  const s = segundosDelDia();
  const hh = String(Math.floor(s / 3600)).padStart(2, "0"), mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const fecha = d ? textoFecha(d) : "";
  const santo = game.settings.get(MOD, "santuario") ? "en Santuario" : "a la intemperie";
  const pend = sinDormir();
  const vig = pend.length ? ` · Sin dormir: ${pend.map(p => escH(p.actor.name)).join(", ")}` : "";
  return `${fecha ? `${escH(fecha)} · ` : ""}${hh}:${mm} · ${santo} · Barrera ${Number(game.settings.get(MOD, "relojBarrera")) || 0}/10${vig}`;
}

/** Las pestañas del Menú del DM: todo lo de Ecos, las hojas, la barra izquierda entera y los ajustes. */
const PESTANAS_PANEL = [
  ["ecos", "Ecos", "fa-mountain-sun", "El día, el grupo, el mundo y la mesa."],
  ["hojas", "Hojas", "fa-users", "Qué tiene encendido cada hoja (PJ y PNJ)."],
  ["jugar", "En la partida", "fa-chess-pawn", "Tokens, plantillas y notas del mapa."],
  ["mapa", "Preparar el mapa", "fa-map", "Paredes, luces, teselas, dibujos, regiones y pisos."],
  ["ambiente", "Ambiente", "fa-cloud-sun", "Sonidos y efectos de la escena."],
  ["modulos", "Módulos", "fa-puzzle-piece", "Lo que agregan los módulos instalados."],
  ["ajustes", "Ajustes", "fa-gear", "La barra, los descansos y los ajustes del módulo."]
];

class PanelDM extends foundry.applications.api.ApplicationV2 {
  static DEFAULT_OPTIONS = {
    id: "ecos-panel-dm",
    classes: ["ecos-panel-dm", "ecos-mega"],
    window: { title: "Menú del DM · Ecos de la frontera", icon: "fa-solid fa-mountain-sun", resizable: true },
    position: { width: 900, height: 720 },
    actions: {
      ecos: PanelDM.#accion, pestanaPanel: PanelDM.#tab, ...ACCIONES_BARRA,
      fnHoja: PanelDM.#fnHoja, funcionesHoja: PanelDM.#funcionesHoja, abrirHoja: PanelDM.#abrirHoja, filtroHojas: PanelDM.#filtroHojas,
      descansosMenu: () => new AjustesDescansos().render({ force: true }),
      editorVerbe: () => game.user.isGM && verbeApi()?.editorCatalogo?.(),
      configFoundry: () => game.settings.sheet?.render(true)
    }
  };

  static #accion(event, target) {
    ejecutarPanel(target.dataset.op, this).catch(err => {
      console.error(`${MOD} | panel`, err);
      ui.notifications.error(`Ecos de la frontera: falló «${target.dataset.op}» (detalle en la consola, F12).`);
    });
  }

  // «tab» es una acción reservada de ApplicationV2 (pide data-group): por eso esta se llama pestanaPanel.
  static #tab(event, target) {
    this._tab = target.dataset.p;
    this._busqueda = "";
    this.render();
  }

  static async #fnHoja(event, target) {
    const a = game.actors.get(target.dataset.id);
    const k = target.dataset.k;
    if (!a) return;
    await ponerFuncion(a, k, !funcionEncendida(a, k));
    this.render();
  }

  static #funcionesHoja(event, target) {
    abrirFunciones(game.actors.get(target.dataset.id));
  }

  static #abrirHoja(event, target) {
    game.actors.get(target.dataset.id)?.sheet?.render(true);
  }

  static #filtroHojas(event, target) {
    this._filtroHojas = target.dataset.f;
    this.render();
  }

  async _renderHTML() {
    this._tab ??= "ecos";
    const santo = game.settings.get(MOD, "santuario");
    const boton = ([op, et, ic, tip]) => {
      const activo = (op === "santuario") && santo;
      const etiqueta = (op === "santuario") ? `Santuario: ${santo ? "SÍ" : "NO"}` : et;
      return `<button type="button" data-action="ecos" data-op="${op}" class="ecos-buscable ${activo ? "activo" : ""}" data-texto="${escH(`${et} ${tip}`.toLowerCase())}"><i class="fa-solid ${ic}"></i><span class="ecos-panel-et"><b>${etiqueta}</b><small>${escH(tip)}</small></span></button>`;
    };
    const taller = verbeApi() ? `<section><h3>Catálogo del Verbe</h3><p>Crea y publica técnicas universales sin seleccionar una hoja ni gastar sus Trazos.</p><button type="button" data-action="editorVerbe">Abrir taller del DM</button></section>` : "";
    const ecos = taller + OPS_PANEL.map(([titulo, ops]) => `<section><h3>${titulo}</h3><div class="ecos-panel-botones">${ops.map(boton).join("")}</div></section>`).join("");
    const comp = compacta();
    const ajustes = `<section><h3>La barra izquierda</h3>
        <p class="ecos-nota">Con la <b>barra compacta</b>, a la izquierda quedan solo Seleccionar, Regla y este menú; todo lo demás está en las pestañas de este menú (al usar un grupo, aparece a la izquierda mientras lo uses). La chincheta de cada tarjeta lo deja fijo. Cada usuario tiene su propia barra.</p>
        <div class="ecos-botones">
          <button type="button" data-action="compacta" class="${comp ? "activo" : ""}"><i class="fa-solid fa-compress"></i> Barra compacta: ${comp ? "SÍ" : "NO"}</button>
          <button type="button" data-action="todo"><i class="fa-solid fa-rotate-left"></i> Fijados por defecto (solo Seleccionar y Regla)</button>
        </div></section>
      <section><h3>Descansos y Dados de Golpe</h3><p class="ecos-nota">Cuánto se recupera en cada descanso, el tope por descanso, si se pueden gastar fuera de un descanso y la lista de hojas que los usan.</p>
        <div class="ecos-botones"><button type="button" data-action="descansosMenu"><i class="fa-solid fa-bed-pulse"></i> Ajustar los descansos</button></div></section>
      <section><h3>Ecos de la frontera</h3><p class="ecos-nota">Se guardan al cambiarlos.</p>${htmlAjustesModulo()}</section>
      <section><h3>Foundry</h3><p class="ecos-nota">La configuración de Foundry y de los demás módulos.</p>
        <div class="ecos-botones"><button type="button" data-action="configFoundry"><i class="fa-solid fa-gears"></i> Abrir la configuración de Foundry</button></div></section>`;
    const contenido = {
      ecos,
      hojas: `<section>${htmlHojas(this._filtroHojas ?? "personajes")}</section>`,
      jugar: htmlBarra("jugar"),
      mapa: htmlBarra("mapa"),
      ambiente: htmlBarra("ambiente"),
      modulos: htmlBarra("modulos"),
      ajustes
    };
    const nav = PESTANAS_PANEL.map(([k, et, ic, tip]) => `<button type="button" data-action="pestanaPanel" data-p="${k}" class="${this._tab === k ? "activo" : ""}" data-tooltip="${escH(tip)}"><i class="fa-solid ${ic}"></i> ${et}</button>`).join("");
    const panes = PESTANAS_PANEL.map(([k]) => `<div class="ecos-pestana" data-pestana="${k}" ${this._tab === k ? "" : "hidden"}>${contenido[k] || `<p class="ecos-nota">Nada por aquí.</p>`}</div>`).join("");
    return `<div class="ecos-mega-barra">
        <input type="search" class="ecos-buscar" placeholder="Buscar en todo el menú (puerta, luz, clima, descanso, Claudia…)" autocomplete="off">
      </div>
      <nav class="ecos-pestanas">${nav}</nav>
      <p class="ecos-panel-estado">${textoEstadoPanel()}</p>
      ${panes}`;
  }

  _replaceHTML(result, content) {
    content.innerHTML = result;
    engancharBuscador(this, content);
    engancharAjustes(this, content);
  }
}

/* ---------- Relojes del valle: todos en una ventana. La fuente es Tramas · 9 (solo DM) ----------
 * La ventana lee la sección «Relojes» de la página (cada reloj es «<h3>Nombre (v / máx)</h3>» y su lista de pasos) y, al
 * subir o bajar uno, reescribe la cuenta y el «(actual)» en la misma página. La Barrera es la de siempre (su ajuste). */
const RELOJ_ACTUAL = /\s*(<strong>)?\(actual\)(<\/strong>)?/g;
const escRe = t => String(t).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function paginaRelojes() {
  const j = diarioDe("clave:tramas");
  return j?.pages.find(p => /<h2[^>]*>Relojes<\/h2>/.test(p.text?.content ?? "")) ?? null;
}

function zonaRelojes(html) {
  const m = /<h2[^>]*>Relojes<\/h2>/.exec(html);
  if (!m) return null;
  const ini = m.index + m[0].length;
  const fin = html.indexOf("<h2", ini);
  return { ini, fin: (fin < 0) ? html.length : fin };
}

/** Los relojes de la página: { pagina, intro, relojes: [{ nombre, valor, max, pasos, notas }] }. */
function leerRelojes(pagina = paginaRelojes()) {
  const html = pagina?.text?.content ?? "";
  const z = zonaRelojes(html);
  if (!z) return { pagina, intro: "", relojes: [] };
  const trozo = html.slice(z.ini, z.fin);
  const intro = /^\s*<p>([\s\S]*?)<\/p>/.exec(trozo)?.[1] ?? "";
  const relojes = [];
  const re = /<h3>([^<]+?)\s*\((\d+)\s*\/\s*(\d+)\)<\/h3>([\s\S]*?)(?=<h3>|$)/g;
  let r;
  while ((r = re.exec(trozo))) {
    const cuerpo = r[4];
    const pasos = [...cuerpo.matchAll(/<li>([\s\S]*?)<\/li>/g)].map(x => x[1].replace(RELOJ_ACTUAL, "").trim());
    const notas = [...cuerpo.replace(/<ol>[\s\S]*?<\/ol>/g, "").matchAll(/<p>([\s\S]*?)<\/p>/g)].map(x => x[1].trim()).filter(Boolean);
    relojes.push({ nombre: r[1].trim(), valor: Number(r[2]), max: Number(r[3]), pasos, notas });
  }
  return { pagina, intro, relojes };
}

/** Escribe en la página la cuenta de un reloj y mueve el «(actual)» al paso que toca. */
async function escribirReloj(nombre, valor, pagina = paginaRelojes()) {
  const html = pagina?.text?.content ?? "";
  const z = zonaRelojes(html);
  if (!z) return false;
  const trozo = html.slice(z.ini, z.fin);
  const m = new RegExp(`<h3>(${escRe(nombre)})\\s*\\((\\d+)\\s*/\\s*(\\d+)\\)</h3>(\\s*)(<ol>[\\s\\S]*?</ol>)?`).exec(trozo);
  if (!m) return false;
  let i = 0;
  const ol = (m[5] ?? "").replace(/<li>([\s\S]*?)<\/li>/g, (x, t) => {
    i++;
    return `<li>${t.replace(RELOJ_ACTUAL, "")}${(i === valor) ? " <strong>(actual)</strong>" : ""}</li>`;
  });
  const nuevo = `<h3>${m[1]} (${valor} / ${m[3]})</h3>${m[4]}${ol}`;
  const final = html.slice(0, z.ini) + trozo.slice(0, m.index) + nuevo + trozo.slice(m.index + m[0].length) + html.slice(z.fin);
  if (final === html) return false;
  await pagina.update({ "text.content": final });
  return true;
}

const esBarrera = r => /^Barrera$/i.test(r?.nombre ?? "");

/** Sube (+1) o baja (−1) un reloj. La Barrera va por su ajuste (y su parpadeo); los demás, por la página, con aviso al DM. */
async function moverReloj(nombre, n) {
  const { pagina, relojes } = leerRelojes();
  const r = relojes.find(x => x.nombre === nombre);
  if (!r) return;
  if (esBarrera(r)) {
    await sumarReloj(n);
    return;
  }
  const v = Math.clamp(r.valor + n, 0, r.max);
  if (v === r.valor) return;
  await escribirReloj(nombre, v, pagina);
  if (v > r.valor) {
    const L = [`${r.valor} → <b>${v} / ${r.max}</b>.`, `<b>Ahora:</b> ${r.pasos[v - 1] ?? "—"}`];
    if (r.pasos[v]) L.push(`<b>Si sube otra vez:</b> ${r.pasos[v]}`);
    await susurrarDM(`Reloj · ${r.nombre}`, L);
  }
}

class RelojesDM extends foundry.applications.api.ApplicationV2 {
  static DEFAULT_OPTIONS = {
    id: "ecos-relojes",
    classes: ["ecos-relojes"],
    window: { title: "Relojes del valle", icon: "fa-solid fa-hourglass-half", resizable: true },
    position: { width: 460, height: "auto" },
    actions: { mas: RelojesDM.#mas, menos: RelojesDM.#menos, pagina: RelojesDM.#pagina, editarMotivos: RelojesDM.#editar, todos: RelojesDM.#todos }
  };

  static #editar(event, target) {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    editarMotivos(target.dataset.reloj).then(() => this.render()).catch(err => console.error(`${MOD} | motivos`, err));
  }

  static #todos() {
    const d = [...(this.element?.querySelectorAll("details.ecos-reloj-motivos") ?? [])];
    const abrir = d.some(x => !x.open);
    this._abiertos = new Set(abrir ? d.map(x => x.dataset.reloj) : []);
    for (const x of d) x.open = abrir;
  }

  static #mover(target, n) {
    moverReloj(target.dataset.reloj, n).then(() => this.render()).catch(err => {
      console.error(`${MOD} | relojes`, err);
      ui.notifications.error("Ecos de la frontera: no pude mover el reloj (detalle en la consola, F12).");
    });
  }

  static #mas(event, target) { RelojesDM.#mover.call(this, target, 1); }

  static #menos(event, target) { RelojesDM.#mover.call(this, target, -1); }

  static #pagina() {
    const p = paginaRelojes();
    p?.parent?.sheet?.render(true, { pageId: p.id });
  }

  async _renderHTML() {
    const { pagina, intro, relojes } = leerRelojes();
    if (!pagina) return `<p>No encuentro la sección «Relojes» en Tramas · 9 (diario «Tramas y secretos»).</p>`;
    const barrera = Number(game.settings.get(MOD, "relojBarrera")) || 0;
    const filas = relojes.map(r => {
      const b = esBarrera(r);
      const v = b ? barrera : r.valor;
      const max = b ? 10 : r.max;
      const casillas = Array.from({ length: max }, (_, i) => `<span class="${(i < v) ? "lleno" : ""}"></span>`).join("");
      const ahora = b ? `Segmento ${v}${UMBRALES[v] ? `: ${UMBRALES[v]}` : "."}${(v >= 3 && v <= 4) ? " Tira un parpadeo por semana." : ""}` : (r.pasos[v - 1] ?? "—");
      const sig = b ? (v < 10 ? `Parpadeo (te lo tira solo)${UMBRALES[v + 1] ? `. Segmento ${v + 1}: ${UMBRALES[v + 1]}` : "."}` : "")
        : (r.pasos[v] ?? "");
      const nombre = escH(r.nombre);
      return `<section class="ecos-reloj">
        <header><b>${nombre}</b><span class="ecos-reloj-cuenta">${v} / ${max}</span>
          <button type="button" data-action="menos" data-reloj="${nombre}" data-tooltip="Bajar 1" ${v <= 0 ? "disabled" : ""}><i class="fa-solid fa-minus"></i></button>
          <button type="button" data-action="mas" data-reloj="${nombre}" data-tooltip="Subir 1 (te susurra lo que pasa)" ${v >= max ? "disabled" : ""}><i class="fa-solid fa-plus"></i></button></header>
        <div class="ecos-casillas">${casillas}</div>
        <p><b>Ahora:</b> ${ahora}</p>
        ${sig ? `<p class="ecos-reloj-sig"><b>Si sube:</b> ${sig}</p>` : ""}
        ${b ? "" : r.notas.map(n => `<p class="ecos-reloj-nota">${n}</p>`).join("")}
        ${htmlMotivos(r.nombre)}
      </section>`;
    }).join("");
    return `<p class="ecos-nota">${intro} <a data-action="todos"><i class="fa-solid fa-list"></i> Ver u ocultar todos los motivos</a></p>${filas}
      <p class="ecos-nota">Se guardan en Tramas · 9: lo que cambies aquí queda escrito ahí. Los motivos se cambian con el lápiz. <a data-action="pagina"><i class="fa-solid fa-book-open"></i> Abrir la página</a></p>`;
  }

  _replaceHTML(result, content) {
    content.innerHTML = result;
    this._abiertos ??= new Set();
    for (const d of content.querySelectorAll("details.ecos-reloj-motivos")) {
      if (this._abiertos.has(d.dataset.reloj)) d.open = true;
      d.addEventListener("toggle", () => {
        if (d.open) this._abiertos.add(d.dataset.reloj);
        else this._abiertos.delete(d.dataset.reloj);
      });
    }
  }
}

let relojesDM = null;
function abrirRelojes() {
  if (!game.user.isGM) return;
  relojesDM ??= new RelojesDM();
  return relojesDM.render({ force: true });
}
const refrescarRelojes = foundry.utils.debounce(() => {
  if (relojesDM?.rendered) relojesDM.render();
}, 300);
Hooks.on("updateJournalEntryPage", p => {
  if (relojesDM?.rendered && /<h2[^>]*>Relojes<\/h2>/.test(p.text?.content ?? "")) refrescarRelojes();
});

let panelDM = null;
function abrirPanelDM(tab = null) {
  if (!game.user.isGM) return;
  panelDM ??= new PanelDM();
  if (typeof tab === "string") {
    panelDM._tab = tab;
    panelDM._busqueda = "";
  }
  return panelDM.render({ force: true });
}
const refrescarPanel = foundry.utils.debounce(() => {
  if (panelDM?.rendered) panelDM.render();
}, 300);

async function elegirZona() {
  const leer = (k, btn) => ({
    zona: k, dificultad: btn.form?.elements?.dificultad?.value || "tabla", aliados: Number(btn.form?.elements?.aliados?.value) || 0
  });
  const botones = [...Object.entries(ZONAS_ENCUENTRO).map(([k, n]) => ({ action: k, label: n, callback: (ev, btn) => leer(k, btn) })),
    { action: "camino", label: `Camino (${({ primavera: "primavera", verano: "verano", otono: "otoño", invierno: "invierno" })[estacionClave()]})`,
      callback: (ev, btn) => leer("camino", btn) }];
  const { pjs } = grupoDeHoy();
  const grupo = pjs.map(a => `${a.name} (${nivelPJ(a)})`).join(", ") || "ninguna hoja con Reglas de PJ (botón Ecos de cada hoja)";
  const r = await foundry.applications.api.DialogV2.wait({
    window: { title: "Encuentro: ¿dónde están?" },
    content: `<p class="ecos-nota">Grupo: ${grupo}. Sale una plantilla y el módulo arma las criaturas para el grupo (entre Moderado y Alto, salvo que pidas otra cosa). Te llega solo a ti.${bonoEncuentro() ? ` La Barrera está alta: se suma ${bonoEncuentro()} al dado.` : ""}</p>
      <div class="form-group"><label>Dificultad</label><select name="dificultad"><option value="tabla">La de la tabla</option><option value="bajo">Baja</option><option value="moderado">Moderada</option><option value="alto">Alta</option></select></div>
      <div class="form-group"><label>Aliados PNJ que pelean con ellos</label><select name="aliados"><option value="0">Ninguno</option><option value="1">1</option><option value="2">2</option><option value="3">3</option></select></div>`,
    buttons: botones, rejectClose: false, classes: ["ecos-zonas"]
  }).catch(() => null);
  return (r && typeof r === "object") ? r : (r ? { zona: r } : null);
}

async function ejecutarPanel(op) {
  const api = game.modules.get(MOD).api;
  switch (op) {
    case "diaSiguiente": await diaSiguiente(); break;
    case "diaNoche": await alternarDiaNoche(); break;
    case "luzHora": await ponerOscuridad(oscuridadPorHora()); break;
    case "hora": await game.time.advance(3600); break;
    case "calendario": abrirCalendario(); break;
    case "santuario": await game.settings.set(MOD, "santuario", !game.settings.get(MOD, "santuario")); ui.controls?.render?.({ reset: true }); break;
    case "estado": game.journal.get("G0rD0J3JkpOkXM00")?.pages.find(p => p.getFlag(MOD, "estado"))?.sheet?.render(true); break;
    case "tirada":
      if (!game.MonksTokenBar?.requestRoll) return ui.notifications.warn("Hace falta Monk's TokenBar activo.");
      await game.MonksTokenBar.requestRoll(canvas.tokens?.controlled?.length ? canvas.tokens.controlled : undefined); break;
    case "xp":
      if (!game.MonksTokenBar?.assignXP) return ui.notifications.warn("Hace falta Monk's TokenBar activo.");
      await game.MonksTokenBar.assignXP(canvas.tokens?.controlled?.length ? canvas.tokens.controlled : undefined); break;
    case "rumor": await sacarRumor(); break;
    case "encuentro": {
      const z = await elegirZona();
      if (z?.zona) await sacarEncuentro(z.zona, z);
      break;
    }
    case "clima": abrirClima(); break;
    case "anunciar": await api.anunciarDia(); break;
    case "jornada": await abrirJornada(); break;
    case "mercadillo": await abrirMercadillo(); break;
    case "pantalla": {
      const gs = game.modules.get("gm-screen");
      if (!gs?.active || !gs.api?.toggleGmScreenVisibility) return ui.notifications.warn("Hace falta GM Screen activo.");
      gs.api.toggleGmScreenVisibility();
      break;
    }
    case "relojes": abrirRelojes(); break;
    case "descansos": new AjustesDescansos().render({ force: true }); break;
    case "suceso": await sacarSuceso(); break;
    default: break;
  }
  refrescarPanel();
}

/* ---------- Configuración de los demás módulos ----------
 * Cada receta se aplica una sola vez por versión (ajuste modulosConfigurados), y solo si el módulo está activo:
 * si se activa más tarde, se configura en ese momento. Lo que el DM cambie después a mano no se vuelve a tocar.
 * Antes de poner un valor se comprueba que el ajuste exista y que el valor esté entre sus opciones. */

/** Módulos que dan problemas con esta campaña (se ofrece apagarlos al entrar). */
const INCOMPATIBLES = {
  "ready-set-roll-5e": "choca con midi-qol (lo dicen su manual y Chris's Premades): las tiradas salen dobles o el combate automático se rompe",
  "foundry-combat-focus": "es de Foundry v10 y en v13 falla al cargar (ui.sidebar._tabs ya no existe); además el dock de combate ya muestra el combate",
  "chat-images": "repite lo que hace Chat Media"
};

/** Pone un ajuste si existe, si el valor es válido y si es distinto del actual. Devuelve false, true o "recargar". */
async function ponerAjuste(mod, clave, valor) {
  const conf = game.settings.settings.get(`${mod}.${clave}`);
  if (!conf) return false;
  if (conf.choices && !(String(valor) in conf.choices)) {
    console.warn(`${MOD} | ${mod}.${clave}: «${valor}» no es una opción válida`, Object.keys(conf.choices));
    return false;
  }
  const actual = game.settings.get(mod, clave);
  if (JSON.stringify(actual) === JSON.stringify(valor)) return false;
  await game.settings.set(mod, clave, valor);
  return (conf.requiresReload || conf.reloadRequired) ? "recargar" : true;
}

/** Une un objeto de ajustes de midi-qol con su ConfigSettings. Devuelve 1 si cambió algo. */
async function unirMidi(cambios) {
  const actual = foundry.utils.deepClone(game.settings.get("midi-qol", "ConfigSettings") ?? {});
  const nuevo = foundry.utils.mergeObject(foundry.utils.deepClone(actual), cambios, { inplace: false });
  if (JSON.stringify(nuevo) === JSON.stringify(actual)) return 0;
  await game.settings.set("midi-qol", "ConfigSettings", nuevo);
  return 1;
}

/** Midi-qol v1.9: lo que pide Chris's Premades y las reglas opcionales que son RAW 2024. */
const MIDI_V19 = {
  autoCEEffects: "itempri", allowUseMacro: true, allowActorUseMacro: true, confirmAttackDamage: "none",
  waitForDamageApplication: true, autoCompleteWorkflow: true,
  optionalRulesEnabled: true,
  optionalRules: {
    invisAdvantage: "RAW2024", hiddenAdvantage: "effect", nearbyFoe: 5, removeHiddenInvis: true,
    checkRange: "longfail", incapacitated: "warn", distanceIncludesHeight: true
  }
};

/** Health Estimate: lo que se ve del token, en pocas palabras (sin chocar con los estados del módulo: «Malherido», «Acechado»). */
const ESTIMACIONES = [
  { name: "", ignoreColor: false, rule: "", estimates: [
    { value: 0, label: "En el suelo" }, { value: 25, label: "Tambalea" }, { value: 50, label: "Sangra" },
    { value: 75, label: "Golpeado" }, { value: 99, label: "Rasguñado" }, { value: 100, label: "Sin un rasguño" }
  ] },
  { name: "Personajes jugadores", ignoreColor: false, rule: "type === \"character\" && actor.hasPlayerOwner", estimates: [
    { value: 0, label: "Acechado por la Muerte" }, { value: 25, label: "Apenas en pie" }, { value: 50, label: "Sangra" },
    { value: 75, label: "Golpeado" }, { value: 99, label: "Rasguñado" }, { value: 100, label: "Sin un rasguño" }
  ] },
  { name: "No muertos", ignoreColor: false, rule: "system.details?.type?.value === \"undead\"", estimates: [
    { value: 0, label: "Deshecho" }, { value: 25, label: "Se desarma" }, { value: 50, label: "Le faltan pedazos" },
    { value: 75, label: "Agrietado" }, { value: 99, label: "Descascarado" }, { value: 100, label: "Intacto" }
  ] },
  { name: "Constructos", ignoreColor: false, rule: "system.details?.type?.value === \"construct\"", estimates: [
    { value: 0, label: "Hecho pedazos" }, { value: 25, label: "Cruje" }, { value: 50, label: "Agrietado" },
    { value: 75, label: "Abollado" }, { value: 99, label: "Rayado" }, { value: 100, label: "Intacto" }
  ] },
  { name: "Plantas", ignoreColor: false, rule: "system.details?.type?.value === \"plant\"", estimates: [
    { value: 0, label: "Derribado" }, { value: 25, label: "Partido" }, { value: 50, label: "Le cuelgan ramas" },
    { value: 75, label: "Astillado" }, { value: 99, label: "Corteza arañada" }, { value: 100, label: "Intacto" }
  ] },
  { name: "Limos", ignoreColor: false, rule: "system.details?.type?.value === \"ooze\"", estimates: [
    { value: 0, label: "Un charco" }, { value: 25, label: "Tiembla" }, { value: 50, label: "Se encoge" },
    { value: 75, label: "Pierde masa" }, { value: 99, label: "Salpicado" }, { value: 100, label: "Entero" }
  ] },
  { name: "Enjambres", ignoreColor: false, rule: "!!system.details?.type?.swarm", estimates: [
    { value: 0, label: "Disperso" }, { value: 25, label: "Quedan pocos" }, { value: 50, label: "A medias" },
    { value: 75, label: "Se adelgaza" }, { value: 99, label: "Pierde algunos" }, { value: 100, label: "Entero" }
  ] },
  { name: "Vehículos", ignoreColor: false, rule: "type === \"vehicle\"", estimates: [
    { value: 0, label: "Destrozado" }, { value: 20, label: "En llamas" }, { value: 40, label: "Humea" },
    { value: 60, label: "Machacado" }, { value: 80, label: "Rayado" }, { value: 100, label: "Intacto" }
  ] }
];

/** Pestaña «Ecos · DM» de la Pantalla del DM: las páginas que más se consultan en la mesa. */
function paginasPantallaDM() {
  const IV = game.journal.get("SlqNI8OdXAjZZx8W");
  const VI = game.journal.get("G0rD0J3JkpOkXM00");
  const porClave = (j, c) => j?.pages.find(p => p.getFlag(MOD, "clave") === c);
  return [
    IV?.pages.get("n9ydx7jDqYO7QW8x"),            // Tramas · 9 · Situación actual y relojes
    porClave(IV, "calendario-dm"),                // Tramas · 12 · Calendario del DM
    porClave(IV, "hilos"),                        // Tramas · 13 · Hilos y misiones del pueblo
    porClave(IV, "quien"),                        // Tramas · 15 · Quién es quién
    VI?.pages.find(p => p.getFlag(MOD, "estado")), // 6 · Estado de los PJ
    VI?.pages.get("LdY1gQwl0LmaXqik"),            // 1 · Santuarios, descanso y heridas
    VI?.pages.find(p => p.getFlag(MOD, "mercadillo")), // 8 · Mercadillo y precios
    porClave(IV, "peligros")                      // Tramas · 14 · Peligros dentro de la Barrera
  ].filter(Boolean);
}

async function pantallaDM() {
  const clave = "gm-screen-config";
  if (!game.settings.settings.has(`gm-screen.${clave}`)) return 0;
  const conf = foundry.utils.deepClone(game.settings.get("gm-screen", clave) ?? {});
  conf.grids ??= {};
  if (conf.grids.ecos) return 0;
  const entries = {};
  paginasPantallaDM().forEach((p, i) => {
    const x = (i % 4) + 1, y = Math.floor(i / 4) + 1;
    entries[`${x}-${y}`] = { x, y, entryId: `${x}-${y}`, entityUuid: p.uuid, type: "JournalEntryPage", isDndNpc: false, isDndNpcStatBlock: false, spanRows: 1, spanCols: 1 };
  });
  if (!Object.keys(entries).length) return 0;
  conf.grids.ecos = { name: "Ecos · DM", id: "ecos", isShared: false, columnOverride: 4, rowOverride: 2, entries };
  conf.activeGridId ??= "default";
  await game.settings.set("gm-screen", clave, conf);
  return 1;
}

/** Seasons & Stars guarda una copia del calendario activo para los clientes; si quedó la del gregoriano, se corrige. */
async function cacheCalendario() {
  if (!game.settings.settings.has("seasons-and-stars.activeCalendarData")) return 0;
  // Seasons & Stars registra los calendarios externos un poco después del ready: se espera hasta 15 s.
  const buscar = () => game.seasonsStars?.manager?.calendars?.get?.(CALENDARIO.id);
  for (let i = 0; (i < 60) && !buscar(); i++) await new Promise(r => setTimeout(r, 250));
  const cal = buscar();
  if (!cal) throw new Error("el Calendario de Arcegris todavía no está cargado en Seasons & Stars");
  if (game.settings.get("seasons-and-stars", "activeCalendar") !== CALENDARIO.id) return 0;
  if (game.settings.get("seasons-and-stars", "activeCalendarData")?.id === CALENDARIO.id) return 0;
  await game.settings.set("seasons-and-stars", "activeCalendarData", foundry.utils.deepClone(cal));
  return 1;
}

const CONFIG_MODULOS = [
  { id: "midi-qol", v: 2, aplicar: () => unirMidi(MIDI_V19),
    texto: "configurado como pide Chris's Premades (sus automatizaciones mandan sobre Convenient Effects) y con las reglas de 2024 activas: atacar sin ser visto da ventaja, un enemigo a 1,5 m da desventaja a distancia, más allá del alcance largo no se puede, la altura cuenta en las distancias y avisa si alguien incapacitado intenta actuar." },
  { id: "chris-premades", v: 1, ajustes: {
    weaponMastery: 1, heroicInspiration: true, applyConditionChanges: true, legendaryActionsPrompt: true,
    playerSelectsConjures: true, updateSummonInitiative: true, updateCompanionInitiative: true,
    groupSummonsWithOwner: true, matchSummonElevation: true, syncActorSizeToTokens: true,
    hideNames: true, effectDescriptions: "value", effectDescriptionNPC: true
  }, texto: "maestrías de armas de 2024 automáticas para los PJ (Derribar, Empujar, Ralentizar, Rozar…), Inspiración heroica, los estados ya dan su ventaja o desventaja solos (Derribado, Cegado, Envenenado…), aviso de acciones legendarias al pasar el turno, las invocaciones actúan justo después de su dueño y el jugador elige qué criatura conjura, Agrandar/Reducir cambia el token, y los diálogos no muestran el nombre de los enemigos. Los efectos de los PJ copian la descripción del objeto (la de los PNJ no, para no revelar nada)." },
  { id: "tokenmagic", v: 1, ajustes: { autoTemplateEnabled: false, defaultTemplateOnHover: false, autohideTemplateElements: false },
    texto: "plantillas de conjuro sin efectos propios de Token Magic (lo pide Chris's Premades; las animaciones las pone Automated Animations)." },
  { id: "autoanimations", v: 1, ajustes: { playonmiss: true },
    texto: "las animaciones también salen cuando el ataque falla (la flecha pasa de largo)." },
  { id: "monks-bloodsplats", v: 1, ajustes: { "show-bloodsplat": "both", "bloodsplat-opacity": 0.35 },
    aplicar: async () => {
      if (!game.settings.settings.has("monks-bloodsplats.blood-types")) return 0;
      const t = foundry.utils.deepClone(game.settings.get("monks-bloodsplats", "blood-types") ?? {});
      const extra = { construct: { type: "scorch", color: "#5a5a5a" }, plant: { type: "blob", color: "#4f6b2a" } };
      let n = 0;
      for (const [k, v] of Object.entries(extra)) if (!t[k]) { t[k] = v; n++; }
      if (n) await game.settings.set("monks-bloodsplats", "blood-types", t);
      return n ? 1 : 0;
    },
    texto: "los enemigos derrotados dejan su mancha (sangre; quemadura en elementales, demonios y constructos; baba verde en limos y plantas; gris en no muertos) y su cuerpo queda medio transparente para todos, para poder saquearlo." },
  { id: "healthEstimate", v: 2, ajustes: { "core.estimations": ESTIMACIONES, "core.deathStateName": "Muerto", "core.showDescription": 0, "core.NPCsJustDie": true,
    "core.menuSettings.fontSize": 16 },
    texto: "al pasar el ratón sobre un token se ve, en letra más chica, lo que se nota a simple vista («Sin un rasguño», «Rasguñado», «Golpeado», «Sangra», «Tambalea», «En el suelo»), con textos propios para no muertos, constructos, plantas, limos y enjambres; los PJ a 0 PG salen como «Acechado por la Muerte». No dice los PG." },
  { id: "torch", v: 1, ajustes: { gameLightSources: `${RUTA}/data/torch-es.json` },
    texto: "el botón de la llama del token reconoce antorchas, velas, lámparas, faroles y los trucos Luz, Luces danzantes y Crear llama con sus nombres en español. Las antorchas y velas se gastan del inventario." },
  { id: "polyglot", v: 3, ajustes: { comprehendLanguages: "Entender idiomas", truespeech: "Don de lenguas" },
    aplicar: async () => {
      // El Ilvarn (Mundo 4 · 6) con su propio alfabeto: rúnico y antiguo. Polyglot le pone Thorass (el común) a los idiomas nuevos.
      if (!game.settings.settings.has("polyglot.Languages")) return 0;
      const L = foundry.utils.deepClone(game.settings.get("polyglot", "Languages") ?? {});
      if (L.ilvarn?.font && !["Thorass", "default"].includes(L.ilvarn.font)) return 0;
      const alfabetos = game.settings.settings.has("polyglot.Alphabets") ? (game.settings.get("polyglot", "Alphabets") ?? {}) : {};
      L.ilvarn = { label: "Ilvarn", font: ("Thassilonian" in alfabetos) ? "Thassilonian" : "Ar Ciela", rng: "default" };
      await game.settings.set("polyglot", "Languages", L);
      return 1;
    },
    texto: "«Entender idiomas» y «Don de lenguas» dejan leer los mensajes en otros idiomas, y el <b>Ilvarn</b> (la lengua de las ruinas) tiene su propio alfabeto. Solo lo leen quienes lo saben (Mundo 4 · 6)." },
  { id: "foundry-mcp-bridge", v: 1, ajustes: { mapGenAutoStart: false },
    texto: "ya no intenta arrancar el generador de mapas con IA (ComfyUI) al cargar, así que no sale el aviso amarillo «AI Map Generation service failed to start». Si algún día lo quieres, se activa en la configuración de ese módulo." },
  { id: "simple-weather", v: 1, ajustes: {
    useCelsius: true, outputWeatherChat: true, publicChat: true, dialogDisplay: true,
    climate: 1, humidity: 1, biome: "", seasonSync: false,
    useFX: () => (game.modules.get("fxmaster")?.active ? "fxmaster" : "core")
  }, aplicar: async () => {
    climaDelDia().catch(err => console.warn(`${MOD} | clima`, err));
    return 0;
  }, texto: "el clima de cada día nuevo sale según la estación del calendario (templado, en °C, a todos en el chat), con efectos de FXMaster en la escena." },
  { id: "seasons-and-stars", v: 2, aplicar: cacheCalendario },
  { id: "gm-screen", v: 1, aplicar: pantallaDM,
    texto: "pestaña nueva <b>Ecos · DM</b> en la Pantalla del DM: Situación y relojes, Calendario del DM, Hilos, Quién es quién, Estado de los PJ, Heridas, Mercadillo y Peligros." }
];

/** Ajustes de cliente (cada jugador en su navegador, una vez). */
const CONFIG_CLIENTE = [
  // Retrato del token (respeta el Vestuario y los disfraces) y nombre del token (el público) en el chat.
  { id: "chat-portrait", v: 1, ajustes: { useTokenImage: true, useTokenName: true } }
];

/** Simple Weather guarda los °C/°F en cada navegador: aquí siempre en grados Celsius (también el clima que saca el DM al chat). */
async function climaEnCelsius() {
  if (!game.modules.get("simple-weather")?.active || !game.settings.settings.has("simple-weather.useCelsius")) return;
  if (game.settings.get("simple-weather", "useCelsius") === true) return;
  await game.settings.set("simple-weather", "useCelsius", true);
  for (const app of foundry.applications?.instances?.values?.() ?? []) {
    if (typeof app?.regenerateWeather === "function") app.render?.();
  }
  for (const app of Object.values(ui.windows ?? {})) {
    if (typeof app?.regenerateWeather === "function") app.render?.(false);
  }
}

async function aplicarReceta(r) {
  let n = 0;
  for (const [k, val] of Object.entries(r.ajustes ?? {})) {
    const res = await ponerAjuste(r.id, k, (typeof val === "function") ? val() : val);
    if (res) n++;
    if (res === "recargar") RECARGA_PENDIENTE.push(game.modules.get(r.id)?.title ?? r.id);
  }
  if (r.aplicar) n += Number(await r.aplicar()) || 0;
  return n;
}

async function configurarModulos() {
  if (!game.user.isGM) return [];
  const hechos = foundry.utils.deepClone(game.settings.get(MOD, "modulosConfigurados") ?? {});
  const L = [];
  let cambio = false;
  for (const r of CONFIG_MODULOS) {
    if (!game.modules.get(r.id)?.active || ((hechos[r.id] ?? 0) >= r.v)) continue;
    try {
      const n = await aplicarReceta(r);
      hechos[r.id] = r.v;
      cambio = true;
      if (n && r.texto) L.push(`<b>${game.modules.get(r.id)?.title ?? r.id}:</b> ${r.texto}`);
    } catch (err) {
      console.warn(`${MOD} | configurar ${r.id}`, err);
    }
  }
  if (cambio) await game.settings.set(MOD, "modulosConfigurados", hechos);
  if (L.length) susurrarDM("Ecos de la frontera · módulos configurados", L);
  return L;
}

async function configurarCliente() {
  const hechos = foundry.utils.deepClone(game.settings.get(MOD, "clienteConfigurado") ?? {});
  let cambio = false;
  for (const r of CONFIG_CLIENTE) {
    if (!game.modules.get(r.id)?.active || ((hechos[r.id] ?? 0) >= r.v)) continue;
    try {
      await aplicarReceta(r);
      hechos[r.id] = r.v;
      cambio = true;
    } catch (err) {
      console.warn(`${MOD} | cliente ${r.id}`, err);
    }
  }
  if (cambio) await game.settings.set(MOD, "clienteConfigurado", hechos);
  await climaEnCelsius().catch(err => console.warn(`${MOD} | °C`, err));
}

/** Al entrar el DM: si hay módulos incompatibles activos, pregunta si se apagan (o no volver a preguntar). */
async function revisarConflictos() {
  if (!game.user.isGM) return;
  const ignorados = game.settings.get(MOD, "conflictosIgnorados") ?? [];
  const activos = Object.keys(INCOMPATIBLES).filter(id => game.modules.get(id)?.active && !ignorados.includes(id) && !MODULOS_A_APAGAR.includes(id));
  if (!activos.length) return;
  const lista = activos.map(id => `<li><b>${escH(game.modules.get(id)?.title ?? id)}</b>: ${INCOMPATIBLES[id]}.</li>`).join("");
  const r = await foundry.applications.api.DialogV2.wait({
    window: { title: "Ecos de la frontera · módulos incompatibles" },
    content: `<div class="ecos-dialogo"><p>Estos módulos están activos y dan problemas en esta campaña:</p><ul>${lista}</ul><p>¿Los desactivo? El mundo se recarga.</p></div>`,
    buttons: [
      { action: "si", label: "Desactivar", icon: "fa-solid fa-power-off", default: true },
      { action: "no", label: "Dejarlos y no volver a preguntar", icon: "fa-solid fa-xmark" }
    ],
    rejectClose: false
  }).catch(() => null);
  if (r === "si") MODULOS_A_APAGAR.push(...activos);
  else if (r === "no") await game.settings.set(MOD, "conflictosIgnorados", [...ignorados, ...activos]);
}

/** Pone el Calendario de Arcegris como calendario activo de Seasons & Stars. */
async function activarCalendario() {
  const mgr = () => game.seasonsStars?.manager;
  for (let i = 0; (i < 40) && !mgr()?.calendars?.has?.(CALENDARIO.id); i++) await new Promise(r => setTimeout(r, 250));
  try {
    if (mgr()?.calendars?.has?.(CALENDARIO.id)) {
      if (mgr().activeCalendarId !== CALENDARIO.id) await mgr().setActiveCalendar(CALENDARIO.id);
    } else await game.settings.set("seasons-and-stars", "activeCalendar", CALENDARIO.id);
    const botones = "-60,15,60,240,480";
    if (game.settings.get("seasons-and-stars", "quickTimeButtons") !== botones) await game.settings.set("seasons-and-stars", "quickTimeButtons", botones);
    return true;
  } catch (err) {
    console.warn(`${MOD} | calendario`, err);
    return false;
  }
}

async function migrar() {
  const hecha = Number(game.settings.get(MOD, "migracion") || 0);
  if (hecha >= VERSION_MIGRACION) return;
  const L = [];

  // 1 · Efectos viejos (hechos a mano) → estados del módulo. Primero se crea el nuevo y después se borra el viejo.
  if (hecha < 1) {
    for (const id of RESISTENTES_INICIALES) {
      const a = game.actors.get(id);
      if (a && (a.getFlag(MOD, "portador") === undefined)) await a.setFlag(MOD, "portador", true);
    }
    for (const a of game.actors.filter(esPJ)) {
      const viejosM = a.effects.filter(e => e.name.startsWith("Malherido") && !e.statuses.has("malherido"));
      const viejosH = a.effects.filter(e => e.name.startsWith("Herida No Tratada") && !e.statuses.has("heridant"));
      if (viejosM.length) {
        await aplicarMalherido(a);
        await a.deleteEmbeddedDocuments("ActiveEffect", viejosM.map(e => e.id));
        L.push(`${a.name}: Malherido pasado al estado nuevo (0/${DESCANSOS_MALHERIDO}).`);
      }
      if (viejosH.length) {
        const n = Number(viejosH[0].name.match(/(\d+)/)?.[1] ?? 1);
        await setHNT(a, n, 0);
        await a.deleteEmbeddedDocuments("ActiveEffect", viejosH.map(e => e.id));
        L.push(`${a.name}: Herida No Tratada ${n} pasada al estado nuevo (día 0/${DIAS_TRATAMIENTO}).`);
      }
      if ((a.system.attributes.hp.value <= 0) && !a.statuses.has("acechado")) await a.toggleStatusEffect("acechado", { active: true });
    }
  }

  // 2 · Estados propios repetidos: se queda el del ícono del token y se borran las copias.
  if (hecha < 2) {
    for (const a of game.actors.filter(esPJ)) {
      for (const id of ["acechado", "malherido", "heridant"]) {
        const efs = a.effects.filter(e => e.statuses.has(id));
        if (efs.length < 2) continue;
        const queda = efs.find(e => e.id === statusId(id)) ?? efs[0];
        await a.deleteEmbeddedDocuments("ActiveEffect", efs.filter(e => e !== queda).map(e => e.id));
        L.push(`${a.name}: quité ${efs.length - 1} copia(s) repetida(s) de ${queda.name}.`);
      }
    }
  }

  // 3 · Prestigio inicial de los PJ (Libro VI · 5) para la Jornada de trabajo.
  if (hecha < 3) {
    const iniciales = { ktHmACdpqjhNnwTS: { prestigio: 7 }, kij3VDH2ofqyR95p: { prestigio: 1, otros: { tala: 1, serreria: 1 } } };
    for (const [id, datos] of Object.entries(iniciales)) {
      const a = game.actors.get(id);
      if (a && !a.getFlag(MOD, "trabajo")) {
        await a.setFlag(MOD, "trabajo", datos);
        L.push(`${a.name}: Prestigio ${datos.prestigio} cargado para la Jornada de trabajo.`);
      }
    }
  }

  // 4 · Oficios: el Prestigio de la Leñería Holt se conserva; la Pericia arranca según lo trabajado.
  if (hecha < 4) {
    const iniciales = {
      ktHmACdpqjhNnwTS: { prestigio: 7, pericia: { tala: 5 } },
      kij3VDH2ofqyR95p: { prestigio: 1, pericia: { serreria: 2 }, otros: { tala: 1, serreria: 1 } }
    };
    for (const a of game.actors.filter(x => esPJ(x) || iniciales[x.id])) {
      if (a.getFlag(MOD, "oficio")) continue;
      const viejo = a.getFlag(MOD, "trabajo") ?? {};
      const ini = iniciales[a.id];
      if (!ini && !Object.keys(viejo).length) continue;
      const d = oficioDe(a);
      d.prestigio.holt = Number(viejo.prestigio ?? ini?.prestigio ?? 0);
      Object.assign(d.pericia, ini?.pericia ?? {});
      Object.assign(d.otros, viejo.otros ?? ini?.otros ?? {});
      await a.setFlag(MOD, "oficio", d);
      for (const k of Object.keys(d.pericia)) await actualizarRegistroHoja(a, d, k);
      const cerrado = viejo.encargo ? " El encargo a medias del sistema viejo se cerró sin penalización." : "";
      L.push(`${a.name}: Prestigio ${d.prestigio.holt} con la Leñería Holt${Object.keys(d.pericia).length ? `; ${Object.entries(d.pericia).map(([k, v]) => `${OFICIOS[k]?.nombre ?? k} ${v} (${rangoPericia(v).nombre})`).join(", ")}` : ""}.${cerrado}`);
    }
  }

  // 5 · v1.5: encargos del sistema anterior, Soul coins, precios del valle y mercadillo.
  if (hecha < 5) {
    for (const a of game.actors.filter(esPJ)) {
      const enc = a.getFlag(MOD, "oficio")?.encargo;
      if (enc && (enc.ht === undefined)) {
        await a.update({ [`flags.${MOD}.oficio.encargo`]: null });
        L.push(`${a.name}: el encargo a medias del sistema anterior se cerró sin penalización.`);
      }
    }
    for (const a of game.actors.filter(x => x.type === "character")) {
      if (a._source.system?.currency && !("soul" in a._source.system.currency)) await a.update({ "system.currency.soul": 0 });
    }
    const n = await aplicarEscalaMundo();
    L.push(`<b>Precios del valle:</b> ${n} objeto(s) de compendio pasaron a 1/${escalaPrecios()} del precio del manual (se cambia en la configuración del módulo).`);
    if (await esperarItemPiles()) {
      const M = await montarMercadillo({ aviso: false });
      L.push(`<b>Mercadillo de Arcegris</b> montado: ${TIENDAS.length} tiendas en la carpeta de actores "${CARPETA_MERCADILLO}" y una escena con sus puestos.`);
      if (M?.length > 6) L.push(`${M.length} cambios en las tiendas (detalle en la consola, F12).`);
      else if (M?.length) L.push(...M);
      console.log(`${MOD} | mercadillo`, M);
    } else L.push("El mercadillo necesita <b>Item Piles</b> activo; después usa el botón de la tienda (controles de Tokens) → Montar / actualizar.");
  }

  // 6 · v1.6: tiendas nuevas del Mercadillo y repetición de tiradas con Soul coins.
  if ((hecha >= 5) && (hecha < 6)) {
    if (await esperarItemPiles()) {
      const M = await montarMercadillo({ aviso: false });
      L.push(`<b>Mercadillo:</b> ahora hay ${TIENDAS.length} tiendas. Kunno y Sera tienen cada uno su puesto y compiten en precio (Marta se queda con Martillo Gris), y abren el establo, la barbería, el ahumadero, la escribanía, la cerería y la huerta.${M?.length ? ` ${M.length} cambio(s).` : ""}`);
    }
    L.push("<b>Soul coins:</b> cuando una tirada de trabajo sale mal (la prueba, una complicación o una salvación), al jugador le aparece \"¿Usar una Soul coin? Sí / No\". Gastarla repite la tirada.");
  }

  // 7 · v1.7: experiencia solo por enemigos derrotados, sin cofres de botín en el mapa, Soul coins y mercado negro.
  if ((hecha >= 5) && (hecha < 7)) {
    if (game.modules.get("monks-tokenbar")?.active) {
      const ajustes = { "only-use-defeated": true, "create-canvas-object": false };
      const hechos = [];
      for (const [k, v] of Object.entries(ajustes)) {
        try {
          if (game.settings.get("monks-tokenbar", k) !== v) {
            await game.settings.set("monks-tokenbar", k, v);
            hechos.push(k);
          }
        } catch (err) {
          console.warn(`${MOD} | monks-tokenbar ${k}`, err);
        }
      }
      if (hechos.length) L.push("<b>Experiencia:</b> Monk's TokenBar ahora reparte XP <b>solo por los enemigos derrotados</b> (huir no da XP) y ya no deja cofres de botín en el mapa al convertir enemigos en botín.");
    }
    const cofre = game.scenes.get("QrMzEaeupIE1ldvR")?.notes.get("NxOYKXqYdpOUEPSm");
    if (cofre && (cofre.texture?.src === "icons/svg/chest.svg")) {
      await cofre.delete();
      L.push("Quité el cofre de botín que quedó en <b>Bosque profundo</b> (apuntaba a un diario que ya no existe).");
    }
    if (await esperarItemPiles()) {
      const M = await montarMercadillo({ aviso: false });
      L.push(`<b>Mercado negro:</b> creado y <b>oculto</b> (los jugadores no lo ven). Cuando lo encuentren, revélalo con el ojo de su fila en la ventana del Mercadillo.${M?.length ? ` ${M.length} cambio(s).` : ""}`);
    }
    L.push("<b>Soul coins:</b> cualquier 1 natural de un PJ en un d20 (ataque, salvación, prueba, iniciativa o salvación de muerte) abre el aviso \"¿Usar una Soul coin?\". Al gastarla, la moneda vibra y deja ver algo (solo lo ven el jugador y tú).");
  }

  // 8 · v1.8.1: más automatización con midi-qol (sin Ready Set Roll) y el Calendario de Arcegris.
  if ((hecha >= 5) && (hecha < 8)) {
    if (game.modules.get("midi-qol")?.active) {
      try {
        const actual = foundry.utils.deepClone(game.settings.get("midi-qol", "ConfigSettings") ?? {});
        await game.settings.set("midi-qol", "ConfigSettings", foundry.utils.mergeObject(actual, AJUSTES_MIDI, { inplace: false }));
        L.push("<b>Combate automático (midi-qol):</b> los ataques y el daño se tiran solos, se comparan con la CA, las salvaciones se piden con Monk's TokenBar (o se tiran solas a los 60 s) y el daño se aplica solo con botón de deshacer. Hay reacciones (Escudo, Esquiva asombrosa…) y los enemigos a 0 PG quedan muertos y derrotados (la XP se reparte sola). Las reglas de la casa siguen igual: los PJ a 0 PG quedan Acechados, no inconscientes. Un 1 natural de un PJ en un ataque o una salvación ofrece la Soul coin <i>antes</i> de resolver, así que la repetición cuenta.");
      } catch (err) {
        console.warn(`${MOD} | midi-qol`, err);
      }
    }
    MODULOS_A_APAGAR.push(...["ready-set-roll-5e", "chat-images"].filter(id => game.modules.get(id)?.active));
    if (game.modules.get("seasons-and-stars")?.active) {
      const ok = await activarCalendario();
      L.push(ok
        ? "<b>Calendario de Arcegris</b> activo en Seasons & Stars: hoy es <b>lunes 28 de marzo del 62 DF</b> (Día 7; el Día 1 fue el martes 22). Cada día nuevo sale en el chat con la luna y las fiestas, y a ti te llegan tus notas (Tramas · 12). Para los jugadores: el diario «El año en Arcegris»."
        : "<b>Calendario de Arcegris:</b> no pude activarlo. Elígelo a mano en Seasons & Stars (botón del calendario → Calendario de Arcegris).");
    }
  }

  // 9 · v1.8.2: tiradas de los PNJ ocultas, nombres públicos en los tokens y clima de Simple Weather.
  if ((hecha >= 5) && (hecha < 9)) {
    const hechos = [];
    const poner = async (modulo, clave, valor) => {
      try {
        if (game.modules.get(modulo)?.active && (game.settings.get(modulo, clave) !== valor)) {
          await game.settings.set(modulo, clave, valor);
          return true;
        }
      } catch (err) {
        console.warn(`${MOD} | ${modulo}.${clave}`, err);
      }
      return false;
    };
    if (game.modules.get("midi-qol")?.active) {
      try {
        const actual = foundry.utils.deepClone(game.settings.get("midi-qol", "ConfigSettings") ?? {});
        await game.settings.set("midi-qol", "ConfigSettings", foundry.utils.mergeObject(actual, AJUSTES_MIDI_OCULTO, { inplace: false }));
        hechos.push("en los ataques de los PNJ los jugadores ven el d20 y el daño total, sin bonificadores; en sus salvaciones solo si salvan o no");
      } catch (err) {
        console.warn(`${MOD} | midi-qol`, err);
      }
    }
    if (await poner("dice-so-nice", "showGhostDice", "1")) hechos.push("Dice So Nice muestra un dado sin números en las tiradas privadas");
    if (await poner("combat-tracker-dock", "hideEnemyInitiative", true)) hechos.push("el combate no muestra la iniciativa de los enemigos");
    hechos.push("las pruebas, salvaciones e iniciativa que tiras con un PNJ salen privadas (ajuste «Tiradas ocultas de los PNJ»)");
    const n = await nombresPublicos();
    L.push(`<b>Tiradas de los PNJ ocultas:</b> ${hechos.join("; ")}.`);
    if (n) L.push(`<b>Nombres en los tokens:</b> ${n} ficha(s) muestran ahora un nombre sin VD ni secretos (p. ej. «Lobo gris del valle» en vez de «CR ¼ · Lobo gris del valle», «Lucan Vey», «Fat Renno» para Ninguno, «Hombre del farol azul» para el Cambista). El nombre del actor sigue igual para ti; tira desde el token, no desde la ficha, para que el chat use ese nombre.`);
    if (game.modules.get("simple-weather")?.active) {
      const fx = game.modules.get("fxmaster")?.active ? "fxmaster" : "core";
      let recargar = false;
      for (const [k, v] of [["useCelsius", true], ["outputWeatherChat", true], ["publicChat", true], ["dialogDisplay", true], ["climate", 1], ["humidity", 1], ["biome", ""], ["seasonSync", false]]) await poner("simple-weather", k, v);
      if (await poner("simple-weather", "useFX", fx)) recargar = true;
      if (recargar) RECARGA_PENDIENTE.push("Simple Weather (efectos del clima en la escena)");
      L.push(`<b>Clima:</b> Simple Weather genera el clima de cada día nuevo según la estación del calendario (templado, en °C, a todos en el chat), con efectos ${fx === "fxmaster" ? "de FXMaster" : "del propio Foundry (lluvia y nieve; con FXMaster instalado se usan los suyos)"}.`);
    }
  }

  // 10 · v2.0: las Soul coins y las Monedas Antiguas eran la misma moneda. Queda una sola, en la bolsa de la hoja.
  if (hecha < 10) {
    const fusion = [];
    for (const a of game.actors) {
      if (!a.system?.currency) continue;
      const its = a.items.filter(i => (i.type === "loot") && /monedas? antiguas?/i.test(i.name));
      if (!its.length) continue;
      const enObjetos = its.reduce((t, i) => t + (Number(i.system.quantity) || 0), 0);
      const enBolsa = monedas(a);
      // Si ya estaban en la bolsa (puestas dos veces, una como objeto y otra como Soul coin), vale el número mayor.
      const total = Math.max(enBolsa, enObjetos);
      await a.update({ "system.currency.soul": total });
      await a.deleteEmbeddedDocuments("Item", its.map(i => i.id));
      fusion.push(`${a.name}: <b>${total}</b>${(enBolsa && enObjetos) ? ` (tenía ${enObjetos} como objeto y ${enBolsa} como Soul coins; supuse que eran las mismas. Si eran distintas, súmale ${Math.min(enBolsa, enObjetos)} en la hoja)` : ""}`);
    }
    let tiendas = false;
    if (game.modules.get("item-piles")?.active && (await esperarItemPiles())) {
      try {
        await montarMercadillo({ escena: false, aviso: false });
        tiendas = true;
      } catch (err) {
        console.warn(`${MOD} | mercadillo`, err);
      }
    }
    L.push(`<b>Monedas Antiguas:</b> las Soul coins y las Monedas Antiguas son ahora una sola moneda, en la bolsa de la hoja junto al oro (abreviatura MA). Sirven para todo lo de antes: repetir tiradas (el aviso sale solo con un 1 natural o una jornada mala), la salvación de muerte, el Comercio con mercaderes especiales y la Fuente del Fondo.${fusion.length ? ` Pasadas a la bolsa: ${fusion.join("; ")}.` : ""}${tiendas ? " Los precios del mercado negro ya dicen «Monedas Antiguas»." : ""}`);
  }

  // 11 · v2.1: fuera los tokens y retratos de 5etools que puso el módulo (no se parecían a lo que describe cada ficha).
  // Solo se tocan las fichas del bestiario de Arcegris (p-…) y los PNJ que recibieron retrato en la v1.8; el arte que pusiste tú se queda.
  if (hecha < 11) {
    const VACIO = "icons/svg/mystery-man.svg";
    const delModulo = src => /^(https?:\/\/cdn\.5e\.tools\/|assets\/srd5e\/)/i.test(String(src ?? ""));
    const CLAVES_ARTE = new Set(["edran-voss", "caelith", "cambista", "vadim-corr", "osric-tallen", "brann-hollow", "corvel-ashby", "lucan-vey",
      "ennis-hart", "soldado-imperial", "maton-cantera", "moss", "tikki", "nib", "grell", "ojos-de-hollin", "ka-ruk", "guerrero-uhrak",
      "guardian-bosque", "brida-tarn", "tibbald-crane", "tamsin-roan", "yselde-morrow", "alwen-marr", "hilde-brask", "maud-roan",
      "ottilie-fenn", "sabela-moor", "lorra", "wren", "brek", "dael", "josse", "renna-vael", "jonn-mael", "corrie-tarn", "serak"]);
    const tokensEnEscenas = async (actor, src) => {
      for (const s of game.scenes) {
        const cambios = s.tokens.filter(t => (t.actorId === actor.id) && delModulo(t.texture?.src)).map(t => ({ _id: t.id, "texture.src": src }));
        if (cambios.length) await s.updateEmbeddedDocuments("Token", cambios);
      }
    };
    let pnj = 0, bestias = 0;
    for (const a of game.actors) {
      const clave = a.getFlag(MOD, "clave") ?? "";
      // Además de las fichas con clave, las plantillas que armó el módulo (la Guardia de Arcegris).
      const plantilla = !!a.getFlag(MOD, "contenido") && /\(plantilla\)/.test(a.name);
      if (!(CLAVES_ARTE.has(clave) || clave.startsWith("p-") || plantilla)) continue;
      const u = {};
      if (delModulo(a.img)) u.img = VACIO;
      if (delModulo(a.prototypeToken?.texture?.src)) u["prototypeToken.texture.src"] = VACIO;
      const ropa = vestuarioDe(a);
      if (ropa.length) {
        const queda = ropa.filter(r => !delModulo(r.token));
        if (queda.length !== ropa.length) u[`flags.${MOD}.vestuario`] = queda;
      }
      if (foundry.utils.isEmpty(u)) continue;
      await a.update(u);
      await tokensEnEscenas(a, VACIO);
      if (clave.startsWith("p-")) bestias++;
      else pnj++;
    }
    // Las tiendas que habían tomado el retrato de su PNJ vuelven al ícono del negocio.
    let tiendas = 0;
    for (const T of TIENDAS) {
      const actor = actorTienda(T.id);
      if (!actor || !delModulo(actor.img)) continue;
      const im = await imagenTienda(T);
      await actor.update({ img: im.img, "prototypeToken.texture.src": im.token, "flags.item-piles.data.merchantImage": im.img });
      await tokensEnEscenas(actor, im.token);
      tiendas++;
    }
    if (pnj || bestias || tiendas) {
      L.push(`<b>Arte:</b> se quitaron los tokens y retratos genéricos que había puesto el módulo (no se parecían a lo que describe cada ficha): ${bestias} criatura(s) del bestiario y ${pnj} PNJ quedan con la silueta, y ${tiendas} tienda(s) vuelven al ícono del negocio. El arte que pusiste tú no se tocó.`);
    }
  }

  // 12 · v2.6: los tokens ya no giran hacia donde se mueven (se giran a mano con Ctrl + rueda del ratón).
  if (hecha < 12) {
    try {
      if (game.settings.settings.has("core.tokenAutoRotate") && game.settings.get("core", "tokenAutoRotate")) {
        await game.settings.set("core", "tokenAutoRotate", false);
        L.push("<b>Tokens:</b> ya no giran solos hacia donde los mueves. Para girarlos: selecciónalos y usa <b>Ctrl + rueda del ratón</b> (Shift + rueda ya no gira).");
      }
    } catch (err) {
      console.warn(`${MOD} | giro de tokens`, err);
    }
  }

  // 13 · v2.6.1: lo que Simple Weather dejó amontonado en las escenas (FXMaster 8). En la escena que se está viendo queda el clima
  // de hoy, más tenue; lo de días anteriores se quita. Lo que pusiste tú a mano en FXMaster se queda.
  if ((hecha < 13) && game.modules.get("fxmaster")?.active) {
    try {
      const hoy = new Set((game.settings.settings.has("simple-weather.activeFXMParticleEffects") ? (game.settings.get("simple-weather", "activeFXMParticleEffects") ?? []) : [])
        .map(n => String(n).split("-")[1]).filter(Boolean));
      let escenas = 0, quitados = 0;
      for (const s of game.scenes) {
        const ef = s.getFlag("fxmaster", "effects") ?? {};
        const vista = (s.id === canvas?.scene?.id);
        const u = {};
        for (const [k, e] of Object.entries(ef)) {
          if (!esDelClima(e)) continue;
          if (vista && hoy.has(e.type)) {
            const n = { type: e.type, options: suavizarClima(e.type, e.options), ecosClima: true };
            if (JSON.stringify(n) !== JSON.stringify(e)) u[`flags.fxmaster.effects.${k}`] = n;
          } else {
            u[`flags.fxmaster.effects.-=${k}`] = null;
            quitados++;
          }
        }
        if (!foundry.utils.isEmpty(u)) {
          await s.update(u);
          escenas++;
        }
      }
      if (escenas) L.push(`<b>Clima:</b> la niebla y las nubes de Simple Weather son más tenues y ya no se amontonan con las de días anteriores (FXMaster 8 no las quitaba). Se limpiaron ${quitados} efecto(s) viejo(s) en ${escenas} escena(s); lo que pusiste tú a mano en FXMaster no se tocó.`);
    } catch (err) {
      console.warn(`${MOD} | clima amontonado`, err);
    }
  }

  await game.settings.set(MOD, "migracion", String(VERSION_MIGRACION));
  const pjs = game.actors.filter(esPJ).map(a => a.name).join(", ") || "ninguno";
  susurrarDM("Ecos de la frontera actualizado", [
    `Usan las reglas de PJ (botón <b>Ecos</b> de cada hoja): <b>${pjs}</b>.`,
    ...L,
    "Todo lo del módulo está en el <b>Menú del DM</b> (la montaña, en la barra de Tokens).",
    "<b>v1.5:</b> trabajo por horas (el día termina con el Descanso Largo), Mercadillo de Arcegris (botón <b>Mercado</b> en la hoja), Prestigio editable en la barra lateral de la hoja (solo tú lo cambias) y <b>Monedas Antiguas</b> junto a las monedas. Ya no se cobra costo de vida al descansar: se compran la cama y la comida en las tiendas.",
    "La página <b>Estado de los PJ</b> está en las Reglas de la casa y se actualiza sola. El manual del DM está en Tramas · 17 y en el README del módulo."
  ]);
}

Hooks.once("ready", () => {
  RELOJ_PREVIO = game.settings.get(MOD, "relojBarrera");
  game.socket.on(`module.${MOD}`, d => {
    if (!manejarSoulSocket(d)) manejarSocket(d);
  });
  try {
    engancharMidi();
  } catch (err) {
    console.error(`${MOD} | midi-qol`, err);
  }
  document.addEventListener("click", clicHUD, { capture: true });
  document.addEventListener("contextmenu", clicHUD, { capture: true });
  configurarCliente().catch(err => console.warn(`${MOD} | ajustes de cliente`, err));
  arreglarSimpleWeather().catch(err => console.warn(`${MOD} | simple-weather`, err));
  asegurarCalendario().then(ok => {
    if (ok && soyGM()) anunciarDiaLuego();
  }).catch(err => console.warn(`${MOD} | calendario`, err));
  // Se engancha en ready para correr después de los demás módulos: así puede ocultar también sus botones.
  Hooks.on("getSceneControlButtons", ocultarBarra);
  if (compacta() || ocultos().length) ui.controls?.render?.({ reset: true });
  if (!soyGM()) return;
  if (game.settings.get("dnd5e", "rulesVersion") !== "modern") {
    susurrarDM("Ecos de la frontera", ["El mundo usa las reglas de 2014: el Agotamiento de −1 por nivel solo funciona con las reglas de 2024 (Configuración de dnd5e → Versión de reglas → Moderna)."]);
  }
  migrar().catch(err => console.error(`${MOD} |`, err)).finally(async () => {
    await aplicarContenido().catch(err => console.error(`${MOD} |`, err));
    const v = game.modules.get(MOD)?.version ?? "";
    console.log(`${MOD} | v${v} lista · migración ${game.settings.get(MOD, "migracion")} · contenido ${game.settings.get(MOD, "contenido")}`);
    ui.notifications.info(`Ecos de la frontera v${v} lista (migración ${game.settings.get(MOD, "migracion")}, contenido ${game.settings.get(MOD, "contenido")}).`);
    await configurarModulos().catch(err => console.error(`${MOD} | configurar módulos`, err));
    await revisarConflictos().catch(err => console.error(`${MOD} | conflictos`, err));
    await desactivarModulosPendientes().catch(err => console.error(`${MOD} | módulos`, err));
    anunciarDiaLuego();
    renderPanelLuego();
    actualizarEstado();
    if (!(await esperarItemPiles())) return;
    revisarDiaMercado().catch(err => console.error(`${MOD} |`, err));
    actualizarHorarios().catch(err => console.error(`${MOD} |`, err));
    sincronizarDescuentosLuego();
  });
});

/* El panel del DM se refresca cuando cambia la hora, el Santuario o el reloj de la Barrera. */
Hooks.on("updateWorldTime", () => refrescarPanel());
Hooks.on("updateSetting", setting => {
  if ([`${MOD}.santuario`, `${MOD}.relojBarrera`].includes(setting.key)) refrescarPanel();
  if ((setting.key === `${MOD}.relojBarrera`) && game.user?.isGM) {
    escribirReloj("Barrera", Number(game.settings.get(MOD, "relojBarrera")) || 0).catch(err => console.warn(`${MOD} | relojes`, err));
    refrescarRelojes();
  }
});
