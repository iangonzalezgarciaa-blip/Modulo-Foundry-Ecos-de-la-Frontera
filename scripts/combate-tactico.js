/**
 * Combate táctico (3.13, pedido del autor). Un interruptor global para todos los PJ y PNJ, y uno por regla.
 * Cada regla tiene condiciones cerradas y un resultado concreto (docs/COMBATE_TACTICO.md).
 *
 *  0. Bandos: cada token pertenece a un bando. Por defecto sale de su disposición (amistoso = Aliados, hostil = Enemigos,
 *     neutral = Neutrales). Para tres o más bandos, el DM asigna bandos con nombre desde la Mesa.
 *  1. Desprevenido: estado único. Quien ataca a una criatura Desprevenida suma +2 al ataque. No se acumula.
 *  2. Rodear: cuerpo a cuerpo, con un aliado tuyo a 1,5 m del blanco y la línea entre tu centro y el suyo cruzando
 *     su espacio, el blanco está Desprevenido contra ti.
 *  3. El engaño elige el golpe: si falla Distraer o Fintar por 5 o más, tu próximo 20 natural contra él (antes del final
 *     de tu siguiente turno) no se sortea: eliges la fila.
 *  4. Plan maestro: Planear con 20 o más; al empezar el combate, quien planeó elige a un aliado que actúa primero.
 *  5. Moral: cuando cae el líder de un bando de PNJ o cae la mitad de los que empezaron, cada uno que queda salva SAB CD 10;
 *     quien falla queda Desmoralizado (huye o se rinde).
 *  6. Secuaces: un PNJ marcado como secuaz cae a 0 PG con cualquier daño; con una salvación superada para mitad, no recibe nada.
 *  7. Técnicas combinadas: dos aliados distintos dañan al mismo blanco con técnicas del Verbe de naturalezas que forman
 *     combinación, en turnos seguidos: el blanco recibe 2d6 del tipo de la combinación y sus estados.
 *  8. Interponerse: reacción en «Acciones de Destreza» (acciones-comunes.js).
 *  9. Terreno vivo: regiones de la escena llamadas «Terreno vivo: …»; «Aprovechar el terreno» las revela.
 * 10. Evaluar automático: al Evaluar a un blanco marcado, el jugador recibe lo que ganó.
 */
import { objetivosMensaje } from "./compat.js";
import { sistema } from "./sistema/index.js";
const MOD = "ecos-frontera";
const lista = x => Array.from(x?.contents ?? x ?? []);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export const REGLAS = {
  desprevenido: "Desprevenido (+2 al ataque contra quien lo esté)", rodear: "Rodear", engano: "El engaño elige el golpe", plan: "Plan maestro",
  moral: "Moral de los PNJ", secuaces: "Secuaces", combinadas: "Técnicas combinadas", interponerse: "Interponerse", terreno: "Terreno vivo", evaluar: "Evaluar automático"
};
export const AJUSTE_INICIAL = { activo: true, reglas: Object.fromEntries(Object.keys(REGLAS).map(k => [k, true])), bandos: [] };
export const DESPREVENIDO = "ecosDesprevenido", DESMORALIZADO = "ecosDesmoralizado";

/* ---------- Bandos ---------- */
const POR_DISPOSICION = { 1: "aliados", 0: "neutrales", [-1]: "enemigos", [-2]: "secretos" };
export const NOMBRE_BANDO_BASE = { aliados: "Aliados", enemigos: "Enemigos", neutrales: "Neutrales", secretos: "Secretos" };
/** Bando de un token (documento o datos): el asignado por el DM, o el que sale de su disposición. */
export function bandoDe(token) {
  const doc = token?.document ?? token;
  return doc?.flags?.[MOD]?.bando ?? doc?.getFlag?.(MOD, "bando") ?? POR_DISPOSICION[doc?.disposition ?? 0] ?? "neutrales";
}
export const mismoBando = (a, b) => !!a && !!b && bandoDe(a) === bandoDe(b);

/* ---------- 2 · Rodear (geometría pura) ---------- */
/** ¿El segmento p1→p2 cruza el rectángulo r ({x, y, w, h})? Liang-Barsky. */
export function segmentoCruza(p1, p2, r) {
  let t0 = 0, t1 = 1;
  const dx = p2.x - p1.x, dy = p2.y - p1.y;
  for (const [p, q] of [[-dx, p1.x - r.x], [dx, r.x + r.w - p1.x], [-dy, p1.y - r.y], [dy, r.y + r.h - p1.y]]) {
    if (p === 0) { if (q < 0) return false; continue; }
    const t = q / p;
    if (p < 0) { if (t > t1) return false; if (t > t0) t0 = t; } else { if (t < t0) return false; if (t < t1) t1 = t; }
  }
  return t0 < t1;
}
const centro = r => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 });
/** Distancia en casillas entre dos rectángulos (0 si se tocan). */
export function casillasEntre(a, b, casilla) {
  const dx = Math.max(0, Math.max(a.x, b.x) - Math.min(a.x + a.w, b.x + b.w));
  const dy = Math.max(0, Math.max(a.y, b.y) - Math.min(a.y + a.h, b.y + b.h));
  return Math.max(dx, dy) / casilla;
}
/**
 * ¿La línea p1→p2 cruza el rectángulo por lados opuestos (izquierda y derecha, o arriba y abajo) o por esquinas opuestas?
 * Es la regla del flanqueo de la Guía del DM.
 */
export function cruzaOpuestos(p1, p2, r) {
  let t0 = 0, t1 = 1;
  const dx = p2.x - p1.x, dy = p2.y - p1.y;
  for (const [p, q] of [[-dx, p1.x - r.x], [dx, r.x + r.w - p1.x], [-dy, p1.y - r.y], [dy, r.y + r.h - p1.y]]) {
    if (p === 0) { if (q < 0) return false; continue; }
    const t = q / p;
    if (p < 0) { if (t > t1) return false; if (t > t0) t0 = t; } else { if (t < t0) return false; if (t < t1) t1 = t; }
  }
  if (!(t0 < t1)) return false;
  const e = Math.max(r.w, r.h) * 0.02;
  const lados = t => { const x = p1.x + dx * t, y = p1.y + dy * t, l = new Set();
    if (Math.abs(x - r.x) <= e) l.add("izq"); if (Math.abs(x - r.x - r.w) <= e) l.add("der");
    if (Math.abs(y - r.y) <= e) l.add("arr"); if (Math.abs(y - r.y - r.h) <= e) l.add("aba"); return l; };
  const a = lados(t0), b = lados(t1);
  return (a.has("izq") && b.has("der")) || (a.has("der") && b.has("izq")) || (a.has("arr") && b.has("aba")) || (a.has("aba") && b.has("arr"));
}
/**
 * ¿El blanco está rodeado frente al atacante? Atacante y aliado a 1,5 m (adyacentes) del blanco, el aliado del mismo
 * bando, consciente y no incapacitado, y la línea entre sus centros cruza lados o esquinas opuestos del blanco. `rect` en píxeles.
 */
export function rodeado(atacante, blanco, aliados, casilla) {
  if (casillasEntre(atacante.rect, blanco.rect, casilla) > 0.01) return false;
  const a = centro(atacante.rect);
  return aliados.some(x => x.puede && casillasEntre(x.rect, blanco.rect, casilla) <= 0.01 && cruzaOpuestos(a, centro(x.rect), blanco.rect));
}

/* ---------- 3 · Engaño ---------- */
/** ¿La salvación falló por 5 o más? */
export const falloPorCinco = (total, cd) => Number.isFinite(Number(total)) && Number.isFinite(Number(cd)) && Number(total) <= Number(cd) - 5;

/* ---------- 5 · Moral ---------- */
/**
 * ¿Toca chequear la moral? `miembros`: [{ id, caido, lider }], `inicial`: cuántos empezaron. Devuelve el motivo o null.
 * Cada motivo se usa una vez por bando y combate (`usados`).
 */
export function motivoMoral(miembros, inicial, usados = []) {
  const caidos = miembros.filter(m => m.caido).length, enPie = miembros.length - caidos;
  if (!enPie) return null;
  if (!usados.includes("lider") && miembros.some(m => m.lider && m.caido)) return "lider";
  if (!usados.includes("mitad") && inicial >= 2 && caidos * 2 >= inicial) return "mitad";
  return null;
}
/** Tipos que no huyen: no muertos, constructos, cienos y quien es inmune a Asustado. */
export const sinMoral = ({ tipo = "", inmuneMiedo = false } = {}) => inmuneMiedo || ["undead", "construct", "ooze"].includes(String(tipo).toLowerCase());

/* ---------- 6 · Secuaces ---------- */
/** Daño que recibe un secuaz: todo su PG con cualquier daño; nada si superó una salvación para mitad. */
export function danoSecuaz(cantidad, pgActuales, multiplicador = 1) {
  if (!(cantidad > 0)) return null;
  if (multiplicador > 0 && multiplicador < 1) return 0;
  return Math.max(0, Number(pgActuales) || 0);
}

/* ---------- 7 · Técnicas combinadas ---------- */
export const BASES = ["fuego", "agua", "viento", "tierra", "rayo"];
const COMBO = { "agua+fuego": "vapor", "fuego+viento": "ceniza", "fuego+tierra": "magma", "fuego+rayo": "destello", "agua+viento": "escarcha",
  "agua+tierra": "raiz", "agua+rayo": "tormenta", "tierra+viento": "arena", "rayo+tierra": "hierro" };
export const DATOS_COMBO = { vapor: ["Vapor", "fire", ["ardiendo"]], ceniza: ["Ceniza", "fire", ["ardiendo"]], magma: ["Magma", "fire", ["ardiendo", "embarrado"]],
  destello: ["Destello", "radiant", ["cargado"]], escarcha: ["Escarcha", "cold", ["helado"]], raiz: ["Raíz", "piercing", ["embarrado"]],
  tormenta: ["Tormenta", "lightning", ["desequilibrado", "cargado"]], arena: ["Arena", "bludgeoning", ["embarrado"]], hierro: ["Hierro", "piercing", ["cargado"]] };
/** La combinación de dos naturalezas base (null si no forman una: iguales, viento y rayo, o no son base). */
export function combinacion(a, b) {
  if (!BASES.includes(a) || !BASES.includes(b) || a === b) return null;
  return COMBO[[a, b].sort().join("+")] ?? null;
}
/** ¿El turno `ahora` va justo después de `antes` en el orden de iniciativa? Turnos: { ronda, turno }, `n` combatientes. */
export function turnoSeguido(antes, ahora, n) {
  if (!antes || !ahora || !(n > 0)) return false;
  const i = antes.ronda * n + antes.turno, j = ahora.ronda * n + ahora.turno;
  return j - i === 1;
}

/* ---------- 10 · Evaluar ---------- */
const NOMBRE_CAR = { str: "Fuerza", dex: "Destreza", con: "Constitución", int: "Inteligencia", wis: "Sabiduría", cha: "Carisma" };
/** CD de Evaluar: 10 + VD (o nivel), +5 si tiene acciones legendarias o está marcada como única. */
export const cdEvaluar = ({ vd = 0, legendario = false, unica = false } = {}) => 10 + Math.max(0, Math.floor(Number(vd) || 0)) + (legendario || unica ? 5 : 0);
/**
 * Lo que se aprende, en este orden: salvación más baja, resistencias e inmunidades, vulnerabilidades, salvación más alta, CA.
 * Un dato por éxito, uno más por cada 5 que se pase. `datos`: { salvaciones: {str: 3…}, resiste: [], inmune: [], vulnerable: [], ca }.
 */
export function hechosEvaluar(datos, total, cd) {
  if (!(Number(total) >= Number(cd))) return [];
  const n = 1 + Math.floor((Number(total) - Number(cd)) / 5);
  const s = Object.entries(datos.salvaciones ?? {}).sort((a, b) => a[1] - b[1]);
  const lst = x => (x?.length ? x.join(", ") : "ninguna");
  const todos = [
    s.length ? `Su salvación más débil es ${NOMBRE_CAR[s[0][0]] ?? s[0][0]} (${s[0][1] >= 0 ? "+" : ""}${s[0][1]}).` : null,
    `Resiste: ${lst(datos.resiste)}. Inmune: ${lst(datos.inmune)}.`,
    `Le hace más daño: ${lst(datos.vulnerable)}.`,
    s.length ? `Su salvación más fuerte es ${NOMBRE_CAR[s.at(-1)[0]] ?? s.at(-1)[0]} (${s.at(-1)[1] >= 0 ? "+" : ""}${s.at(-1)[1]}).` : null,
    Number.isFinite(Number(datos.ca)) ? `Su CA es ${datos.ca}.` : null
  ].filter(Boolean);
  return todos.slice(0, n);
}

/* ---------- 9 · Terreno vivo ---------- */
/** Elementos del terreno: palabra clave en el nombre de la región → salvación, CD y resultado. */
export const TERRENO = [
  { clave: /l[aá]mpara|candelabro|antorcha|brasero/i, nombre: "Lámpara o fuego", salv: "dex", dano: [2, 6, "fire"], estados: ["ardiendo"], texto: "Cae o se vuelca: quien está dentro salva DES o recibe 2d6 fuego y queda Ardiendo." },
  { clave: /aceite|grasa|hielo|barro/i, nombre: "Suelo resbaladizo", salv: "dex", estados: ["prone"], texto: "Quien está dentro salva DES o cae Derribado." },
  { clave: /cornisa|borde|precipicio|barandilla/i, nombre: "Borde", salv: "str", dano: [2, 6, "bludgeoning"], estados: ["prone"], texto: "Lo empujas por el borde: salva FUE o cae, recibe 2d6 contundente y queda Derribado abajo." },
  { clave: /escombro|techo|viga|estanter[ií]a|derrumbe/i, nombre: "Derrumbe", salv: "dex", dano: [3, 6, "bludgeoning"], estados: ["restrained"], texto: "Lo tiras encima: quien está dentro salva DES o recibe 3d6 contundente y queda Apresado bajo los escombros." },
  { clave: /cuerda|red|cadena|telar/i, nombre: "Cuerdas", salv: "dex", estados: ["restrained"], texto: "Lo enredas: quien está dentro salva DES o queda Apresado." },
  { clave: /humo|polvo|harina|ceniza/i, nombre: "Humo o polvo", salv: "con", estados: ["blinded"], texto: "Lo levantas: quien está dentro salva CON o queda Cegado hasta el final de su próximo turno." },
  { clave: /agua|charco|r[ií]o|cubo/i, nombre: "Agua", salv: null, estados: ["empapado"], texto: "Lo empapas: queda Empapado (resiste el fuego, le hace más daño el rayo). Sin salvación." }
];
/** Qué elemento es una región por su nombre «Terreno vivo: …» (null si no es una). */
export function elementoTerreno(nombre) {
  const m = /^terreno vivo\s*:\s*(.+)$/i.exec(String(nombre ?? "").trim());
  if (!m) return null;
  const e = TERRENO.find(t => t.clave.test(m[1]));
  return e ? { ...e, etiqueta: m[1].trim() } : { nombre: m[1].trim(), etiqueta: m[1].trim(), salv: null, texto: "Lo describe el DM." };
}

/* ======================================================================== */
/* Foundry                                                                   */
/* ======================================================================== */
export function ajuste() {
  try { const a = game.settings.get(MOD, "combateTactico") ?? {}; return { ...AJUSTE_INICIAL, ...a, reglas: { ...AJUSTE_INICIAL.reglas, ...(a.reglas ?? {}) } }; }
  catch { return AJUSTE_INICIAL; }
}
export const regla = k => { const a = ajuste(); return !!a.activo && a.reglas[k] !== false; };
const soyDM = () => !!game.user?.isGM && (game.users?.activeGM ? game.users.activeGM.isSelf : true);
const tokenDe = actor => actor?.token?.object ?? actor?.getActiveTokens?.()?.[0] ?? null;
const rectDe = t => ({ x: t.document?.x ?? t.x, y: t.document?.y ?? t.y, w: t.w ?? (t.document.width * canvas.grid.size), h: t.h ?? (t.document.height * canvas.grid.size) });
const caido = actor => sistema.caido(actor);
const puedeActuar = actor => !caido(actor) && !["incapacitated", "unconscious", "paralyzed", "petrified", "stunned"].some(s => actor?.statuses?.has?.(s));
const tieneEstado = (actor, id) => !!actor?.statuses?.has?.(id);
const dmIds = () => lista(game.users).filter(u => u.isGM).map(u => u.id);
const salvacion = (a, k) => sistema.bonoSalvacion(a, k);

/* 1 y 2: +2 al ataque contra quien está Desprevenido o rodeado. */
/** ¿La mesa usa el flanqueo opcional de la Guía del DM (midi-qol)? Entonces manda ese y Rodear no suma (3.14). */
export function flanqueoDelSistema() {
  try {
    if (!game.modules?.get?.("midi-qol")?.active) return false;
    const r = game.settings.get("midi-qol", "ConfigSettings")?.optionalRules?.checkFlanking;
    return !!r && r !== "off";
  } catch { return false; }
}
function bonoDesprevenido(config) {
  const act = config?.subject, atacante = act?.actor;
  const blancos = [...(game.user?.targets ?? [])];
  if (!atacante || blancos.length !== 1) return;
  const blanco = blancos[0], tokA = tokenDe(atacante);
  let motivo = regla("desprevenido") && tieneEstado(blanco.actor, DESPREVENIDO) ? "está Desprevenido" : null;
  if (!motivo && regla("rodear") && !flanqueoDelSistema() && tokA && act.attack?.type?.value === "melee" && canvas?.grid) {
    const aliados = lista(canvas.tokens?.placeables).filter(t => t !== tokA && t !== blanco && mismoBando(t, tokA)).map(t => ({ rect: rectDe(t), puede: puedeActuar(t.actor) }));
    if (rodeado({ rect: rectDe(tokA) }, { rect: rectDe(blanco) }, aliados, canvas.grid.size)) motivo = "está rodeado";
  }
  if (!motivo) return;
  for (const r of config.rolls ?? []) { r.parts ??= []; if (!r.parts.includes("@ecosDesprevenido")) { r.parts.push("@ecosDesprevenido"); r.data ??= {}; r.data.ecosDesprevenido = 2; } }
  ui.notifications?.info?.(`${blanco.name} ${motivo}: +2 al ataque.`);
}

/* 3: guarda quién engañó a quién. 10: Evaluar automático. Se leen las tiradas que salen de una tarjeta de Ecos. */
async function alCrearMensaje(m) {
  if (!soyDM() || !ajuste().activo) return;
  const origen = m.getOriginatingMessage?.(), act = origen && origen !== m ? origen.getAssociatedActivity?.() : null;
  const accion = act?.item?.flags?.[MOD]?.accionComun?.id ? act.name : null;
  if (!accion) return;
  const roll = m.rolls?.[0], total = Number(roll?.total);
  const tirador = m.getAssociatedActor?.() ?? ChatMessage.getSpeakerActor(m.speaker);
  if (regla("engano") && ["Distraer", "Fintar"].includes(accion) && m.type === "save") {
    const cd = act.save?.dc?.value, autor = origen.getAssociatedActor?.();
    if (tirador && autor && falloPorCinco(total, cd)) {
      const c = game.combat;
      await tirador.setFlag(MOD, "engano", { autor: autor.uuid, hasta: c ? { ronda: c.round + 1, turno: c.turn } : null, worldTime: game.time.worldTime });
      ChatMessage.create({ whisper: [...dmIds(), ...lista(game.users).filter(u => autor.testUserPermission(u, "OWNER")).map(u => u.id)],
        content: `<p><b>${esc(tirador.name)}</b> cae en el engaño de <b>${esc(autor.name)}</b> (falla por 5 o más). Si su próximo ataque contra él saca un 20 natural antes del final de su siguiente turno, elige el efecto en vez de sortearlo.</p>` });
    }
  }
  if (regla("plan") && accion === "Planear" && total >= 20 && tirador) {
    await tirador.setFlag(MOD, "planMaestro", { worldTime: game.time.worldTime });
    ChatMessage.create({ whisper: dmIds(), content: `<p><b>Plan maestro</b> de ${esc(tirador.name)} (${total}). Al empezar el próximo combate, en la próxima hora, elegirá a un aliado que actúa primero.</p>` });
  }
  if (regla("evaluar") && accion === "Evaluar al enemigo" && tirador) {
    const blancoUuid = objetivosMensaje(origen)[0]?.uuid, blanco = blancoUuid ? await fromUuid(blancoUuid) : null;
    if (!blanco) return;
    const s = blanco.system ?? {}, t = s.traits ?? {};
    const cd = cdEvaluar({ vd: s.details?.cr ?? s.details?.level, legendario: !!s.resources?.legact?.max, unica: !!blanco.getFlag?.(MOD, "unica") });
    const nombres = set => [...(set?.value ?? [])].map(k => CONFIG.DND5E?.damageTypes?.[k]?.label ?? k);
    const hechos = hechosEvaluar({ salvaciones: Object.fromEntries(Object.keys(s.abilities ?? {}).map(k => [k, salvacion(blanco, k)])),
      resiste: nombres(t.dr), inmune: nombres(t.di), vulnerable: nombres(t.dv), ca: s.attributes?.ac?.value }, total, cd);
    const para = [...dmIds(), ...lista(game.users).filter(u => tirador.testUserPermission(u, "OWNER")).map(u => u.id)];
    ChatMessage.create({ whisper: para, speaker: ChatMessage.getSpeaker({ actor: tirador }),
      content: `<section class="ecos-evaluar"><h3>Evaluar · ${esc(blanco.name)}</h3><p>CD ${cd} · sacaste ${total}.</p>${hechos.length ? `<ul>${hechos.map(h => `<li>${esc(h)}</li>`).join("")}</ul>` : "<p>No recuerdas nada útil de esta criatura.</p>"}</section>` });
  }
}

/* 4: al empezar el combate, quien tiene un plan maestro elige quién va primero. */
async function alEmpezarCombate(combate) {
  if (!soyDM() || !regla("plan")) return;
  const ahora = game.time.worldTime;
  for (const c of lista(combate.combatants)) {
    const f = c.actor?.getFlag(MOD, "planMaestro");
    if (!f || ahora - (f.worldTime ?? 0) > 3600) continue;
    await c.actor.unsetFlag(MOD, "planMaestro");
    const aliados = lista(combate.combatants).filter(x => x.token && c.token && mismoBando(x.token, c.token));
    const elegido = await foundry.applications.api.DialogV2.prompt({ window: { title: `Plan maestro · ${c.name}` }, rejectClose: false,
      content: `<p>El plan de ${esc(c.name)} sale bien. ¿Quién actúa primero en la primera ronda?</p><select name="c">${aliados.map(x => `<option value="${x.id}">${esc(x.name)}</option>`).join("")}</select>`,
      ok: { label: "Primero", callback: (ev, b) => b.form.elements.c.value } });
    if (!elegido) continue;
    const max = Math.max(0, ...lista(combate.combatants).map(x => Number(x.initiative) || 0));
    await combate.setInitiative(elegido, max + 1);
  }
}

/* 5: moral. Se mira cada vez que un PNJ llega a 0 PG. */
async function revisarMoral(actor) {
  const combate = game.combat;
  if (!soyDM() || !regla("moral") || !combate?.started) return;
  const tok = tokenDe(actor);
  if (!tok) return;
  const bando = bandoDe(tok);
  const miembros = lista(combate.combatants).filter(c => c.token && bandoDe(c.token) === bando && c.actor?.type === "npc");
  if (!miembros.length) return;
  const estado = combate.getFlag(MOD, "moral") ?? {}, e = estado[bando] ?? { inicial: miembros.length, usados: [] };
  const motivo = motivoMoral(miembros.map(c => ({ id: c.id, caido: caido(c.actor), lider: !!c.token?.getFlag?.(MOD, "lider") })), e.inicial, e.usados);
  if (!motivo) { if (!estado[bando]) await combate.setFlag(MOD, "moral", { ...estado, [bando]: e }); return; }
  e.usados = [...e.usados, motivo];
  await combate.setFlag(MOD, "moral", { ...estado, [bando]: e });
  const filas = [];
  for (const c of miembros.filter(c => !caido(c.actor))) {
    const a = c.actor, ci = a.system?.traits?.ci?.value;
    if (sinMoral({ tipo: a.system?.details?.type?.value, inmuneMiedo: ci?.has?.("frightened") })) { filas.push(`${esc(c.name)}: no huye (no siente miedo).`); continue; }
    const r = await new Roll("1d20 + @s", { s: salvacion(a, "wis") }).evaluate();
    const falla = r.total < 10;
    if (falla) await a.toggleStatusEffect?.(DESMORALIZADO, { active: true });
    filas.push(`${esc(c.name)}: ${r.total} — ${falla ? "<b>Desmoralizado</b>" : "aguanta"}.`);
  }
  ChatMessage.create({ whisper: dmIds(), content: `<section class="ecos-moral"><h3>Moral · ${esc(NOMBRE_BANDO_BASE[bando] ?? bando)}</h3><p>${motivo === "lider" ? "Su líder cayó." : "Cayó la mitad de los que empezaron."} Cada uno salva SAB CD 10.</p><ul>${filas.map(f => `<li>${f}</li>`).join("")}</ul><p>Desmoralizado: en su turno usa Correr para alejarse de sus enemigos por la ruta más segura. Si no puede alejarse, se rinde: suelta lo que tiene en las manos y no ataca. Dura hasta el final del combate, o hasta que un aliado use una acción para Arengarlo.</p></section>` });
}

/* 7: técnicas combinadas. Se anota la última técnica del Verbe que dañó a cada blanco. */
async function alAplicarDano(actor, cantidad, opciones) {
  if (!soyDM() || !regla("combinadas") || !(cantidad > 0)) return;
  const combate = game.combat;
  const om = opciones?.originatingMessage, act = om?.getAssociatedActivity?.() ?? om?.getOriginatingMessage?.()?.getAssociatedActivity?.();
  const meta = act?.item?.flags?.[MOD]?.verbe, nat = meta?.infusion ?? meta?.nat;
  const autor = act?.actor, tokAutor = tokenDe(autor);
  if (!combate?.started || !meta?.id || !BASES.includes(nat) || !tokAutor) return;
  const ahora = { ronda: combate.round, turno: combate.turn }, previo = actor.getFlag(MOD, "ultimaTecnica");
  await actor.setFlag(MOD, "ultimaTecnica", { nat, autor: autor.uuid, bando: bandoDe(tokAutor), combate: combate.id, ...ahora });
  if (!previo || previo.combate !== combate.id || previo.autor === autor.uuid || previo.bando !== bandoDe(tokAutor)) return;
  if (!turnoSeguido(previo, ahora, combate.turns?.length ?? lista(combate.combatants).length)) return;
  const combo = combinacion(previo.nat, nat);
  if (!combo) return;
  const [nombre, tipo, estados] = DATOS_COMBO[combo];
  const r = await new Roll(`2d6[${tipo}]`).evaluate();
  await sistema.danar(actor, r.total, tipo);
  for (const s of estados) await actor.toggleStatusEffect?.(s, { active: true });
  await actor.unsetFlag(MOD, "ultimaTecnica");
  ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: autor }), rolls: [r], content: `<section class="ecos-combinada"><h3>Técnica combinada · ${nombre}</h3><p>${esc(autor.name)} remata la técnica de su aliado sobre <b>${esc(actor.name)}</b>: ${r.total} de daño (${esc(CONFIG.DND5E?.damageTypes?.[tipo]?.label ?? tipo)}) y queda ${estados.map(s => esc(CONFIG.statusEffects?.find?.(x => x.id === s)?.name ?? s)).join(" y ")}.</p></section>` });
}

/* 9: terreno vivo. «Aprovechar el terreno» con éxito (CD 12) revela las regiones cercanas y deja usarlas. */
async function revelarTerreno(m) {
  if (!soyDM() || !regla("terreno") || m.type !== "check") return;
  const origen = m.getOriginatingMessage?.(), act = origen && origen !== m ? origen.getAssociatedActivity?.() : null;
  if (act?.name !== "Aprovechar el terreno" || !(Number(m.rolls?.[0]?.total) >= 12)) return;
  const actor = m.getAssociatedActor?.(), tok = tokenDe(actor), escena = canvas?.scene;
  if (!tok || !escena) return;
  const mPorCasilla = (Number(escena.grid?.distance) || 1.5) * (/^(ft|pies?)$/i.test(String(escena.grid?.units ?? "")) ? 0.3048 : 1);
  const radio = 9 / mPorCasilla * canvas.grid.size;
  const cerca = lista(escena.regions).map(r => ({ r, e: elementoTerreno(r.name) })).filter(x => x.e).filter(({ r }) => {
    const b = r.object?.bounds ?? r.bounds; if (!b) return true;
    return casillasEntre(rectDe(tok), { x: b.x, y: b.y, w: b.width, h: b.height }, canvas.grid.size) * canvas.grid.size <= radio;
  });
  const para = [...dmIds(), ...lista(game.users).filter(u => actor.testUserPermission(u, "OWNER")).map(u => u.id)];
  ChatMessage.create({ whisper: para, speaker: ChatMessage.getSpeaker({ actor }), flags: { [MOD]: { terreno: { actor: actor.uuid, regiones: cerca.map(x => x.r.uuid) } } },
    content: `<section class="ecos-terreno"><h3>Aprovechar el terreno</h3>${cerca.length ? `<ul>${cerca.map(({ r, e }) => `<li><b>${esc(e.etiqueta)}</b>: ${esc(e.texto)} <button type="button" data-ecos-terreno="${r.uuid}">Usarlo (acción)</button></li>`).join("")}</ul><p>CD de la salvación: 8 + tu INT + competencia.</p>` : "<p>No ves nada que usar a 30 ft.</p>"}</section>` });
}
async function usarTerreno(uuidRegion, actor) {
  const region = await fromUuid(uuidRegion), e = elementoTerreno(region?.name);
  if (!region || !e) return;
  const cd = sistema.cdCaracteristica(actor, "int");
  const dentro = lista(region.tokens).map(t => t.actor).filter(Boolean);
  const filas = [];
  for (const a of dentro) {
    let falla = true;
    if (e.salv) { const r = await new Roll("1d20 + @s", { s: salvacion(a, e.salv) }).evaluate(); falla = r.total < cd; filas.push(`${esc(a.name)}: ${r.total} — ${falla ? "falla" : "supera"}`); }
    if (!falla) continue;
    if (e.dano) { const d = await new Roll(`${e.dano[0]}d${e.dano[1]}`).evaluate(); await sistema.danar(a, d.total, e.dano[2]); filas.push(`${esc(a.name)} recibe ${d.total}`); }
    for (const s of e.estados ?? []) await a.toggleStatusEffect?.(s, { active: true });
  }
  ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), content: `<section class="ecos-terreno"><h3>${esc(actor.name)} usa ${esc(e.etiqueta)}</h3><p>${esc(e.texto)} CD ${cd}.</p><ul>${filas.map(f => `<li>${f}</li>`).join("") || "<li>No había nadie dentro.</li>"}</ul></section>` });
}

/** «14 · Combate táctico», la regla escrita para todos. */
export function guiaTacticoHTML() {
  const fila = (n, cuando, pasa) => `<tr><td><strong>${n}</strong></td><td>${cuando}</td><td>${pasa}</td></tr>`;
  return `<section class="ecos-tactico"><h1>Combate táctico</h1>
<p><em>Reglas de la casa desde la versión 3.13, para todos por igual: PJ, PNJ y monstruos. El DM las enciende o apaga una a una en Mesa Ecos → Control. Cada regla tiene condiciones cerradas y un resultado fijo. Ninguna quita ni cambia una regla del Manual: se suman a lo que ya hay.</em></p>
<h2>Bandos</h2><p>Cada token pertenece a un bando. Sin más, los amistosos son Aliados, los hostiles Enemigos y los neutrales Neutrales. Cuando hay tres o más bandos (por ejemplo, vosotros contra unos bandidos contra la guardia), el DM los nombra y los asigna. «Aliado» quiere decir del mismo bando.</p>
<table><thead><tr><th>Regla</th><th>Cuándo, exactamente</th><th>Qué pasa</th></tr></thead><tbody>
${fila("Desprevenido", "La criatura tiene el estado Desprevenido. Lo ponen Fintar (hasta el final del turno de quien fintó) y Leer al rival (hasta el final del siguiente turno de quien leyó), si falla la salvación.", "Todo ataque contra ella suma +2. No se acumula: dos fuentes siguen siendo +2.")}
${fila("Rodear", "Atacas cuerpo a cuerpo a una criatura que está a 5 ft de ti. Un aliado tuyo, consciente y no incapacitado, también está a 5 ft de ella, y la línea entre el centro de tu casilla y el de la suya cruza su espacio por lados opuestos o por esquinas opuestas.", "Está Desprevenida contra ese ataque: +2. No se suma al Desprevenido de Fintar. Si la mesa usa el flanqueo opcional de la Guía del DM (ventaja, en midi-qol), manda ese y Rodear no suma.")}
${fila("El engaño elige el golpe", "Fallas la salvación de Distraer o de Fintar por 5 o más (tu total es la CD − 5 o menos).", "Si quien te engañó saca un 20 natural en un ataque contra ti antes del final de su siguiente turno, no se sortea el efecto del 20: lo elige él entre los ocho.")}
${fila("Plan maestro", "Sacas 20 o más en la prueba de Planear (Investigación) y el combate empieza en la hora siguiente.", "Al empezar el combate eliges a un aliado de tu bando: su iniciativa pasa a ser la más alta + 1 (actúa primero). Se gasta.")}
${fila("Moral de los PNJ", "En un combate, un bando de PNJ pierde a su líder (marcado por el DM), o cae (0 PG) la mitad de los que empezaron. Cada motivo cuenta una vez por combate.", "Cada PNJ de ese bando que sigue en pie salva Sabiduría CD 10. Si falla, queda Desmoralizado: en su turno usa Correr para alejarse de sus enemigos por la ruta más segura; si no puede alejarse, se rinde: suelta lo que tiene en las manos y no ataca. Dura hasta el final del combate o hasta que un aliado use una acción para Arengarlo. No afecta a no muertos, constructos, cienos ni a quien es inmune a Asustado.")}
${fila("Secuaces", "El DM marcó al PNJ como secuaz.", "Cualquier daño lo deja a 0 PG. Si supera una salvación contra un efecto que hace la mitad, no recibe nada.")}
${fila("Técnicas combinadas", "Dos criaturas distintas del mismo bando dañan a la misma criatura con técnicas del Verbe de naturaleza Fuego, Agua, Viento, Tierra o Rayo; la segunda en el turno justo siguiente al de la primera; y sus naturalezas forman combinación.", "La criatura recibe además 2d6 del tipo de la combinación y sus estados: Vapor y Ceniza (fuego, Ardiendo), Magma (fuego, Ardiendo y Embarrado), Destello (radiante, Cargado), Escarcha (frío, Helado), Raíz (perforante, Embarrado), Tormenta (relámpago, Desequilibrado y Cargado), Arena (contundente, Embarrado), Hierro (perforante, Cargado). Viento con Rayo no combina.")}
${fila("Interponerse", "Reacción. Una criatura que ves ataca a un aliado que está a 5 ft de ti. No estás Incapacitado, Agarrado ni con velocidad 0.", "El aliado tiene +2 a la CA contra ese ataque (estado Protegido, hasta el final de ese turno). Si aun así impacta, el DM te aplica el daño a ti en vez de a él.")}
${fila("Terreno vivo", "El DM dibujó en la escena una región llamada «Terreno vivo: …» (lámpara, aceite, cornisa, escombros, cuerdas, humo, agua). Sacas 12 o más en «Aprovechar el terreno».", "Te dice qué hay a 30 ft. Usarlo cuesta tu acción: quien está dentro salva contra 8 + tu INT + competencia, y si falla recibe lo que diga el elemento (por ejemplo, la lámpara: 2d6 fuego y Ardiendo).")}
${fila("Evaluar automático", "Usas «Evaluar al enemigo» con un blanco marcado.", "CD 10 + su VD (+5 si tiene acciones legendarias o el DM la marcó como única). Si la superas, recibes en privado un dato; uno más por cada 5 que pases, en este orden: su salvación más débil, sus resistencias e inmunidades, lo que le hace más daño, su salvación más fuerte y su CA.")}
</tbody></table></section>`;
}

/* Mesa: el panel del combate táctico. */
export function panelHTML() {
  const a = ajuste(), sel = lista(globalThis.canvas?.tokens?.controlled);
  const bandos = [...Object.entries(NOMBRE_BANDO_BASE).map(([id, n]) => [id, n]), ...a.bandos.map(b => [b.id, b.nombre])];
  return `<section class="ecos-tactico"><h3>Combate táctico</h3><p>Reglas para todos los PJ y PNJ. Detalle en «Reglas de la casa · 14 · Combate táctico».</p>
<label class="em-check"><input type="checkbox" data-tactico="activo" ${a.activo ? "checked" : ""}><b>Encendido</b> (apaga o enciende las diez a la vez)</label>
<div class="em-rejilla">${Object.entries(REGLAS).map(([k, n]) => `<label class="em-check"><input type="checkbox" data-tactico-regla="${k}" ${a.reglas[k] !== false ? "checked" : ""}>${esc(n)}</label>`).join("")}</div>
<h4>Bandos</h4><p>Por defecto: amistosos = Aliados, hostiles = Enemigos, neutrales = Neutrales. Para tres o más bandos, crea uno y asígnalo a los tokens seleccionados (${sel.length} ahora).</p>
<div class="em-fila"><label>Bando<select name="tacticoBando">${bandos.map(([id, n]) => `<option value="${id}">${esc(n)}</option>`).join("")}</select></label><button type="button" data-em="tactico" data-id="asignar">Asignar a los seleccionados</button>
<label>Nuevo bando<input name="tacticoNuevo" maxlength="40" placeholder="Bandidos, Guardia…"></label><button type="button" data-em="tactico" data-id="crear">Crear bando</button></div>
<div class="em-fila"><button type="button" data-em="tactico" data-id="lider">Marcar o quitar líder</button><button type="button" data-em="tactico" data-id="secuaz">Marcar o quitar secuaz</button><button type="button" data-em="tactico" data-id="unica">Marcar o quitar «única» (Evaluar +5)</button></div></section>`;
}
/** Acciones del panel (las llama mesa.js). */
export async function accionPanel(id, root) {
  if (!game.user.isGM) return;
  const a = ajuste(), sel = lista(globalThis.canvas?.tokens?.controlled);
  const v = n => root?.querySelector(`[name="${n}"]`)?.value ?? "";
  if (id === "crear") { const nombre = v("tacticoNuevo").trim(); if (!nombre) return; const nuevo = { id: `b${Date.now().toString(36)}`, nombre }; await game.settings.set(MOD, "combateTactico", { ...a, bandos: [...a.bandos, nuevo] }); return; }
  if (id === "asignar") { const b = v("tacticoBando"); for (const t of sel) await t.document.setFlag(MOD, "bando", b); return; }
  for (const t of sel) {
    if (id === "lider") await t.document.setFlag(MOD, "lider", !t.document.getFlag(MOD, "lider"));
    if (id === "secuaz") await t.document.setFlag(MOD, "secuaz", !t.document.getFlag(MOD, "secuaz"));
    if (id === "unica") await t.actor?.setFlag(MOD, "unica", !t.actor.getFlag(MOD, "unica"));
  }
}
export async function cambiarAjustePanel(el) {
  if (!game.user.isGM) return;
  const a = ajuste();
  if (el.dataset.tactico === "activo") a.activo = el.checked;
  if (el.dataset.tacticoRegla) a.reglas = { ...a.reglas, [el.dataset.tacticoRegla]: el.checked };
  await game.settings.set(MOD, "combateTactico", a);
}

if (globalThis.Hooks) {
  Hooks.once("init", () => {
    try { game.settings.register(MOD, "combateTactico", { scope: "world", config: false, type: Object, default: AJUSTE_INICIAL }); } catch { /* ya */ }
    const estados = {
      [DESPREVENIDO]: { name: "Desprevenido", img: "systems/dnd5e/icons/svg/statuses/surprised.svg", description: "<p>Quien lo ataca suma +2 al ataque. No se acumula con otro Desprevenido.</p>" },
      [DESMORALIZADO]: { name: "Desmoralizado", img: "systems/dnd5e/icons/svg/statuses/frightened.svg", description: "<p>Huye con Correr por la ruta más segura; si no puede, se rinde: suelta lo que tiene en las manos y no ataca.</p>" }
    };
    for (const [id, d] of Object.entries(estados)) {
      if (CONFIG.DND5E?.statusEffects && !CONFIG.DND5E.statusEffects[id]) { CONFIG.DND5E.statusEffects[id] = d; continue; }
      if (Array.isArray(CONFIG.statusEffects) && !CONFIG.statusEffects.some(s => s.id === id)) CONFIG.statusEffects.push({ id, _id: id.padEnd(16, "0").slice(0, 16), ...d });
    }
  });
  sistema.gancho("antesDeAtacar", config => { if (ajuste().activo) bonoDesprevenido(config); });
  Hooks.on("createChatMessage", m => { alCrearMensaje(m).catch(err => console.error(`${MOD} | combate táctico`, err)); revelarTerreno(m).catch(err => console.error(`${MOD} | terreno vivo`, err)); });
  Hooks.on("combatStart", c => { alEmpezarCombate(c).catch(err => console.error(`${MOD} | plan maestro`, err)); });
  Hooks.on("updateActor", (actor, cambios) => {
    if (actor.type === "npc" && foundry.utils.hasProperty(cambios, sistema.RUTAS.pg) && caido(actor)) revisarMoral(actor).catch(err => console.error(`${MOD} | moral`, err));
  });
  sistema.gancho("antesDeAplicarDano", (actor, cantidad, updates, opciones) => {
    if (!regla("secuaces") || !(tokenDe(actor)?.document?.getFlag?.(MOD, "secuaz") ?? actor.getFlag?.(MOD, "secuaz"))) return;
    const d = danoSecuaz(cantidad, sistema.pg(actor).valor, Number(opciones?.multiplier ?? 1));
    if (d === 0) return false;
    if (d != null) { updates["system.attributes.hp.value"] = 0; updates["system.attributes.hp.temp"] = 0; }
  });
  sistema.gancho("alAplicarDano", (actor, cantidad, opciones) => { alAplicarDano(actor, cantidad, opciones).catch(err => console.error(`${MOD} | técnica combinada`, err)); });
  Hooks.on("renderChatMessageHTML", (m, html) => {
    if (!m.getFlag?.(MOD, "terreno")) return;
    for (const b of html.querySelectorAll("[data-ecos-terreno]")) b.addEventListener("click", async ev => {
      ev.preventDefault();
      const actor = await fromUuid(m.getFlag(MOD, "terreno").actor);
      if (!actor?.isOwner) return;
      if (game.user.isGM) return usarTerreno(b.dataset.ecosTerreno, actor);
      game.socket.emit(`module.${MOD}`, { terrenoUsar: b.dataset.ecosTerreno, actor: actor.uuid });
    });
  });
  Hooks.once("ready", () => {
    const api = (game.modules.get(MOD).api ??= {});
    api.tactico = { ajuste, bandoDe, rodeado, accionPanel };
    if (soyDM()) import("./acciones-comunes.js").then(m => m.paginaReglas("guiaTactico", "14 · Combate táctico", guiaTacticoHTML())).catch(err => console.error(`${MOD} | guía táctica`, err));
    game.socket.on(`module.${MOD}`, async d => { if (d?.terrenoUsar && soyDM()) { const a = await fromUuid(d.actor); if (a) usarTerreno(d.terrenoUsar, a).catch(console.error); } });
  });
}
