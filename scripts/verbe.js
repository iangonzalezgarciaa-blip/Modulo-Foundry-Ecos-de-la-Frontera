/**
 * Ecos de la frontera · capa V (v1.1)
 * Técnicas, reserva, ramas, naturalezas, dotes, cultivo y creación de técnicas, sobre dnd5e 5.2.
 * Lo carga main.js. Con el ajuste «Capa V» en Apagado no registra nada: para los jugadores no existe.
 *   apagado · nada.
 *   prueba  · solo en el cliente del DM (para probar con un actor de prueba).
 *   activo  · para todos.
 * Los datos (técnicas, dotes, linajes, reglas) vienen de data/verbe.txt, cifrado como el contenido.
 * Ningún nombre de linaje vive en este archivo: todo lo que depende del linaje sale de los datos.
 */

import { VERSION_REGLAS, recuperarReserva, evaluarGasto, requisitoNatural, crearCola,
  resultadoChoque, presupuestoTecnica, validarCreacion, LIMITES_CREACION } from "./verbe-core.js";
import { configurarAtaque, configurarSalvacion, despuesAtaque, normalizarHielo,
  revisarEstados, consumirMetal, metrosEnHoja } from "./verbe-effects.js";
import { pasoInicial, progresoHTML, estadoUsoHTML, tarjetaHTML, avisosJugadorHTML, ROLES_RAMA } from "./verbe-ui.js";

const MOD = "ecos-frontera";
const F = "verbe";
const RUTA = `modules/${MOD}`;
const LLAVE = "ecos-frontera";
const AJ = { modo: "capaV", pend: "capaVPendientes", extra: "capaVExtra" };
const enSerie = crearCola();
const consumosPendientes = new Map();
const claveActor = actor => actor?.uuid ?? actor?.id;
const consumoPendiente = actor => {
  const p = consumosPendientes.get(claveActor(actor));
  if (p && p.hasta <= Date.now()) { consumosPendientes.delete(claveActor(actor)); return null; }
  return p;
};
const editarActor = actor => !!actor && (game.user.isGM || actor.isOwner);
const serializarActor = (actor, trabajo) => editarActor(actor)
  ? enSerie(claveActor(actor), () => {
    if (consumoPendiente(actor)) { aviso("Espera a que termine el uso de su técnica.", "warn"); return false; }
    return trabajo();
  }) : Promise.resolve(false);
const ajuste = (clave, defecto) => { try { return game.settings.get(MOD, clave) ?? defecto; } catch { return defecto; } };

export const FUERZA = {
  plena: { nombre: "Plena", grado: 9, extra: 0 },
  media: { nombre: "Media", grado: 5, extra: 0 },
  debil: { nombre: "Débil", grado: 3, extra: 1 },
  rastro: { nombre: "Rastro", grado: 1, extra: 2 },
  ninguna: { nombre: "Sin sangre", grado: 0, extra: 2 }
};
const CARS = { int: "Inteligencia", wis: "Sabiduría", cha: "Carisma", con: "Constitución", str: "Fuerza", dex: "Destreza" };
const NATS = { fuego: "Fuego", agua: "Agua", viento: "Viento", tierra: "Tierra", rayo: "Rayo" };
const INFUNDIBLES = new Set(["pura", "cuerpo", "hilo", "quietud", "velo"]);
const RAMAS_LINAJE = ["mirada", "sangre", "pacto", "pulso"];
const NIVEL_CULTIVO = ["Sin cultivar", "Pulida", "Dominada", "Propia"];
const MEJORAS = { dado: "+1 dado", verbe: "1 Verbe menos", cd: "+1 a la CD o al ataque", area: "Área o alcance ×1,5", rapida: "Más rápida" };

/** Estados de naturaleza (se registran en init, antes de leer los datos). */
export const ESTADOS = {
  empapado: { name: "Empapado", img: "systems/dnd5e/icons/svg/statuses/suffocation.svg", dura: 60,
    changes: [{ key: "system.traits.dr.value", mode: 2, value: "fire" }, { key: "system.traits.dv.value", mode: 2, value: "lightning" }],
    texto: "Resistencia al fuego y vulnerabilidad al relámpago." },
  ardiendo: { name: "Ardiendo", img: "systems/dnd5e/icons/svg/statuses/burning.svg", dura: 0,
    texto: "1d6 de fuego al inicio de cada turno. Lo apagan una acción, el agua o la tierra." },
  desequilibrado: { name: "Desequilibrado", img: "systems/dnd5e/icons/svg/statuses/falling.svg", dura: 6,
    changes: [{ key: "flags.midi-qol.disadvantage.attack.all", mode: 5, value: "1" }],
    texto: "Desventaja en su próximo ataque; si lo empujan, va el doble de lejos." },
  embarrado: { name: "Embarrado", img: "systems/dnd5e/icons/svg/statuses/encumbered.svg", dura: 60,
    changes: [{ key: "system.attributes.movement.walk", mode: 1, value: "0.5" },
      { key: "flags.midi-qol.disadvantage.ability.save.dex", mode: 5, value: "1" }],
    texto: "Velocidad a la mitad y desventaja en las salvaciones de DES." },
  cargado: { name: "Cargado", img: "systems/dnd5e/icons/svg/statuses/marked.svg", dura: 6,
    texto: "No usa reacciones; si lleva metal, el próximo ataque con arma de metal contra él tiene ventaja." },
  helado: { name: "Helado", img: "systems/dnd5e/icons/svg/statuses/restrained.svg", dura: 60,
    changes: [{ key: "system.attributes.movement.walk", mode: 2, value: "-3" }],
    texto: "−3 m de velocidad cada vez; con velocidad 0, queda Apresado por el hielo." }
};
const TIPO_NAT = { fuego: "fire", agua: "bludgeoning", viento: "slashing", tierra: "bludgeoning", rayo: "lightning", escarcha: "cold",
  raiz: "piercing", magma: "fire", vapor: "fire", ceniza: "fire", tormenta: "lightning", hierro: "piercing", corriente: "lightning",
  destello: "radiant", arena: "bludgeoning", madera: "piercing" };
const ESTADO_NAT = { fuego: ["ardiendo"], agua: ["empapado"], viento: ["desequilibrado"], tierra: ["embarrado"], rayo: ["cargado"],
  escarcha: ["helado"], raiz: ["embarrado"], magma: ["ardiendo", "embarrado"], vapor: ["ardiendo"], ceniza: ["ardiendo"],
  tormenta: ["desequilibrado", "cargado"], hierro: ["cargado"], corriente: ["empapado", "cargado"], destello: ["cargado"],
  arena: ["embarrado"], madera: ["embarrado"] };
/** Siete Cerrojos: lo que suma cada uno a la hoja (se acumulan). */
const CERROJO_FX = {
  1: [["system.bonuses.mwak.damage", 2, "+ 2"]],
  2: [["system.attributes.movement.walk", 2, "@paso"]],
  3: [["system.bonuses.mwak.attack", 2, "+ 1"], ["system.attributes.ac.bonus", 2, "+ 1"]],
  4: [["system.traits.dr.value", 2, "bludgeoning"], ["system.traits.dr.value", 2, "slashing"], ["system.traits.dr.value", 2, "piercing"],
    ["system.bonuses.mwak.damage", 2, "+ 1d6"]],
  5: [["system.attributes.movement.walk", 1, "2"]],
  6: [["system.bonuses.mwak.damage", 2, "+ 2d6"]],
  7: [["system.bonuses.mwak.damage", 2, "+ 4d6"], ["flags.dnd5e.meleeCriticalThreshold", 5, "18"]]
};

let D = null; // datos de data/verbe.txt
let MODO = "apagado";
let COMO_JUGADOR = false; // el DM mira el panel como lo ve el jugador
/** ¿Se muestra lo del DM? (falso para el DM cuando mira «como el jugador»). */
const dm = () => game.user.isGM && !COMO_JUGADOR;

/* ------------------------------------------------------------------ */
/*  Utilidades                                                        */
/* ------------------------------------------------------------------ */

const soyGM = () => (game.users.activeGM ? game.users.activeGM.isSelf : game.user.isGM);
const idsGM = () => game.users.filter(u => u.isGM).map(u => u.id);
const escH = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[c]);
const aviso = (m, tipo = "info") => ui.notifications?.[tipo]?.(m);
const rechazar = (m, tipo = "warn") => { aviso(m, tipo); return false; };
export const activo = () => !!D && ((MODO === "activo") || ((MODO === "prueba") && game.user?.isGM));
const hist = (e, txt) => [...(e.historial ?? []), txt].slice(-80);
/** Cada compra queda anotada para que el DM pueda deshacerla y devolver los Trazos. */
const compra = (e, tipo, datos, trazos, texto) => [...(e.compras ?? []), { id: foundry.utils.randomID(), tipo, datos, trazos: Number(trazos) || 0, texto }].slice(-300);
const costoGrado = g => Number(D?.costo?.[Math.clamp(Number(g) || 0, 0, GRADO_TOPE)] ?? 0);
const nombreNat = n => NATS[n] ?? D?.combos?.[n]?.nombre ?? n ?? "";
const nombreRama = r => D?.ramas?.find(x => x.id === r)?.nombre ?? r;
const deNats = n => (D?.combos?.[n]?.de ?? (NATS[n] ? [n] : []));

async function descifrar(texto) {
  const bin = Uint8Array.from(atob(texto.trim()), c => c.charCodeAt(0));
  const k = new TextEncoder().encode(LLAVE);
  for (let i = 0; i < bin.length; i++) bin[i] ^= k[i % k.length] ^ (i & 0xff);
  const flujo = new Blob([bin]).stream().pipeThrough(new DecompressionStream("gzip"));
  return JSON.parse(await new Response(flujo).text());
}

async function cargarDatos() {
  const r = await fetch(`${RUTA}/data/verbe.txt?v=${Date.now()}`, { cache: "no-store" });
  return r.ok ? descifrar(await r.text()) : null;
}
export function usarDatos(datos, modo = null) { D = datos; if (modo) MODO = modo; }
export { descifrar };

/** La naturaleza oculta se guarda revuelta, para que no se lea a simple vista en los datos del actor. */
const revolver = (s, id) => (s ? btoa([...String(s)].map((c, i) => String.fromCharCode(c.charCodeAt(0) ^ (id.charCodeAt(i % id.length) & 31))).join("")) : null);
const desrevolver = (s, id) => {
  if (!s) return null;
  try { return [...atob(s)].map((c, i) => String.fromCharCode(c.charCodeAt(0) ^ (id.charCodeAt(i % id.length) & 31))).join(""); } catch { return null; }
};

function susurrarDM(titulo, html) {
  return ChatMessage.create({
    content: `<div class="ecos-card ecos-secreto ecos-verbe-chat"><h3>${titulo}</h3>${html}</div>`,
    whisper: idsGM(), speaker: { alias: "Capa V (solo DM)" }
  });
}

function aLaMesa(actor, titulo, html, { soloDueno = false } = {}) {
  const data = { content: `<div class="ecos-card ecos-verbe-chat"><h3>${titulo}</h3>${html}</div>`, speaker: ChatMessage.getSpeaker({ actor }) };
  if (soloDueno) data.whisper = [...new Set([...idsGM(), ...game.users.filter(u => !u.isGM && actor.testUserPermission(u, "OWNER")).map(u => u.id)])];
  return ChatMessage.create(data);
}

/** Lo que solo puede hacer el DM (ajustes del mundo, otros actores) va por socket. */
function alDM(datos) {
  if (soyGM()) return manejar({ ...datos, de: game.user.id }, { interno: true });
  if (!game.users.activeGM) return rechazar("No hay un DM conectado.", "warn");
  game.socket.emit(`module.${MOD}`, { ...datos, capaV: true, de: game.user.id });
}

/* ------------------------------------------------------------------ */
/*  Estado del actor                                                  */
/* ------------------------------------------------------------------ */

export const estado = actor => actor?.getFlag?.(MOD, F) ?? null;
export const despierto = actor => !!estado(actor)?.despierto;
export const linajeDe = actor => D?.linajes?.find(l => l.id === estado(actor)?.linaje) ?? null;
const conSangre = actor => { const e = estado(actor); return !!(linajeDe(actor) && e?.fuerza && e.fuerza !== "ninguna"); };
const herenciaDe = actor => (conSangre(actor) && linajeDe(actor)?.req ? linajeDe(actor) : null);
export const ocultaDe = actor => desrevolver(estado(actor)?.oc, actor.id);
const veLinaje = actor => dm() || !!estado(actor)?.linajeVisible;

export function nivelDe(actor) {
  if (actor?.type === "character") return Math.clamp(Number(actor.system?.details?.level) || 1, 1, 20);
  const e = estado(actor);
  return Math.clamp(Number(e?.nivel) || Math.round(Number(actor?.system?.details?.cr) || 1) || 1, 1, 20);
}
export const competencia = actor => Number(actor?.system?.attributes?.prof) || Math.floor((nivelDe(actor) + 7) / 4);
export const modDe = (actor, car) => Number(actor?.system?.abilities?.[car]?.mod) || 0;
/** Hasta el grado 9 (nivel 17), (nivel + 1) ÷ 2; el nivel 19 llega al grado 10 y el 20 al 11. Lo dicen los datos (gradoMax). */
export const GRADO_TOPE = 11;
const gradoDeNivel = n => Math.min(GRADO_TOPE, Number(D?.gradoMax?.[Math.clamp(n, 1, 20)]) || Math.min(9, Math.floor((n + 1) / 2)));
export const gradoMax = actor => gradoDeNivel(nivelDe(actor));
/** Las técnicas concedidas a mano siguen utilizándose a su grado base; elevarlas exige dominio de rama. */
export const gradoUsable = (actor, meta) => Math.max(Number(meta.g) || 0,
  Math.min(gradoMax(actor), rangoGrado(rangoDe(actor, meta.rama))));
/** El nivel de personaje que pide un grado de técnica. */
export function nivelParaGrado(g) {
  for (let n = 1; n <= 20; n++) if (gradoDeNivel(n) >= g) return n;
  return 20;
}
export const tieneDote = (actor, id) => (estado(actor)?.dotes ?? []).includes(id);
export const rangoDe = (actor, rama) => Number(estado(actor)?.rangos?.[rama]) || 0;
/** Los dones de rango llegan un rango antes en la rama principal. */
export const rangoDon = (actor, rama) => rangoDe(actor, rama) + (estado(actor)?.principal === rama ? 1 : 0);
const ultimoRango = () => (D?.rangos?.length ?? 5) - 1;
const rangoGrado = r => D.rangos[Math.clamp(r, 0, ultimoRango())].grado;
const nombreRango = r => D.rangos[Math.clamp(r, 0, ultimoRango())].nombre;
/** Los dones de rango: llegan con Experto, Maestro, Legendario y Mítico (en la rama principal, un rango antes). */
const DONES_K = ["experto", "maestro", "legendario", "mitico"];
const ORD_DON = ["Primer", "Segundo", "Tercer", "Cuarto"];
/** «Nombre: qué hace» → [nombre, Qué hace]. */
function partirDon(txt) {
  const t = String(txt ?? "");
  const i = t.indexOf(": ");
  if (i < 0) return ["", t];
  const resto = t.slice(i + 2);
  return [t.slice(0, i), resto.charAt(0).toUpperCase() + resto.slice(1)];
}

/** Los efectos automáticos de las dotes que tiene (vienen en los datos). */
export const efectosDotes = actor => (estado(actor)?.dotes ?? []).map(id => D?.dotes?.find(d => d.id === id)?.efecto).filter(Boolean);
const sumaEf = (actor, f) => efectosDotes(actor).reduce((t, ef) => t + (Number(f(ef)) || 0), 0);

export function maxVerbe(actor) {
  const e = estado(actor);
  if (!e?.despierto) return 0;
  const n = nivelDe(actor);
  let max = Number(D.verbeMax[n] ?? D.verbeMax[String(n)]) + modDe(actor, e.car);
  if (tieneDote(actor, "reserva-profunda")) max += n;
  max += sumaEf(actor, ef => (Number(ef.max?.plano) || 0) + (n >= 10 ? Number(ef.max?.desde10) || 0 : 0) + ((Number(ef.max?.nivel) || 0) * n));
  if (tieneDote(actor, "eco-sangre") && ["plena", "media"].includes(e.fuerza)) max += (n >= 11 ? 2 : 1) * n;
  const h = herenciaDe(actor);
  if (h?.maxMult) max = Math.floor(max * h.maxMult);
  return Math.max(1, max + (Number(e.maxExtra) || 0));
}
export const limiteNegativo = actor => -Math.floor(maxVerbe(actor) * (tieneDote(actor, "aguante-verbe") ? 0.75 : 0.5));
const cambiosRecuperacion = (actor, cantidad, estadoActual = estado(actor)) => {
  const r = recuperarReserva({ valor: estadoActual?.valor, cantidad, maximo: maxVerbe(actor), resto: estadoActual?.recResto });
  return { valor: r.valor, recResto: r.resto };
};
export async function recuperarVerbe(actor, cantidad) {
  return serializarActor(actor, async () => {
    const cambios = cambiosRecuperacion(actor, cantidad);
    await guardar(actor, cambios);
    return cambios.valor;
  });
}
export function trazos(actor) {
  const e = estado(actor) ?? {};
  // 4 por nivel, y quien despierta en el nivel N los recibe todos: 4 × N + 4 (el doble del diseño original, por pedido del DM).
  const total = (4 * nivelDe(actor)) + 4 + (Number(e.trazosExtra) || 0);
  const gastados = Number(e.gastados) || 0;
  return { total, gastados, libres: total - gastados };
}

/** Ramas que piden algo para tener siquiera el Novato. */
export function ramaAbierta(actor, rama) {
  const e = estado(actor) ?? {};
  if ((e.abiertas ?? []).includes(rama)) return true;
  if (rama === "pulso") return tieneDote(actor, "control-fino");
  if (rama === "mirada") return Object.values(e.miradas ?? {}).some(v => Number(v) > 0);
  if (rama === "sangre") return !!herenciaDe(actor);
  if (rama === "pacto") return (e.pactos ?? []).length > 0;
  return true;
}

/** Posición de una rama entre las entrenadas (0 = la primera). Una rama nueva va al final. */
function ordenRama(actor, rama) {
  const orden = estado(actor)?.ordenRamas ?? [];
  const i = orden.indexOf(rama);
  return i < 0 ? orden.length : i;
}

export function costoRango(actor, rama, nuevo) {
  const e = estado(actor) ?? {};
  let c = D.rangos[nuevo]?.trazos ?? 99;
  if (e.principal === rama || (tieneDote(actor, "rama-segunda") && e.segunda === rama)) c -= 1;
  if (rama === "sangre") c += FUERZA[e.fuerza ?? "plena"]?.extra ?? 0;
  // Repartirse cuesta: desde la tercera rama con Entrenado o más, cada rango cuesta 1 Trazo más.
  const orden = ordenRama(actor, rama);
  if (e.principal !== rama && orden >= 2 && !(orden === 2 && efectosDotes(actor).some(ef => ef.repartirse))) c += 1;
  return Math.max(0, c);
}

/* ------------------------------------------------------------------ */
/*  Técnicas: requisitos, compra y armado                             */
/* ------------------------------------------------------------------ */

const extraMundo = () => { try { return game.settings.get(MOD, AJ.extra) ?? []; } catch { return []; } };
export function tecnicaPorId(id, actor = null) {
  return D?.tecnicas?.find(t => t.id === id) ?? extraMundo().find(t => t.id === id)
    ?? (estado(actor)?.propias ?? []).find(t => t.id === id) ?? null;
}
export const itemsTecnica = actor => actor?.items?.filter(i => i.getFlag(MOD, F)?.id) ?? [];
export const conoce = (actor, id) => itemsTecnica(actor).some(i => i.getFlag(MOD, F).id === id);
const porNombre = n => D?.tecnicas?.find(t => t.n === n) ?? null;

export function natsDe(actor) {
  const e = estado(actor) ?? {};
  const n = new Set(e.nats ?? []);
  if (e.descubierta) { const o = ocultaDe(actor); if (o) n.add(o); }
  for (const x of herenciaDe(actor)?.nats ?? []) n.add(x);
  for (const x of e.natsExtra ?? []) n.add(x);
  return n;
}
/** Las combinaciones que puede usar (las da el DM con la dote). */
export const combosDe = actor => new Set(estado(actor)?.combos ?? []);

/**
 * ¿Puede aprender esta técnica? → { ok, motivo, pideDM, probar }
 * probar: es de una naturaleza que no tiene; al intentarla se descubre si es su oculta.
 */
export function requisitos(actor, tec) {
  if (!tec?.id) return { ok: false, motivo: "La técnica no existe." };
  const e = estado(actor);
  if (!e?.despierto) return { ok: false, motivo: "No despertó." };
  if (conoce(actor, tec.id)) return { ok: false, motivo: "Ya la sabe." };
  if (tec.incl) return { ok: false, motivo: "Viene con su etapa de Mirada." };
  if (tec.soloDM && !dm()) return { ok: false, motivo: "La da el DM." };
  if (tec.g > gradoMax(actor)) return { ok: false, motivo: `Pide nivel ${nivelParaGrado(tec.g)}.` };
  if (!ramaAbierta(actor, tec.rama)) {
    const por = { pulso: "la dote Control fino del Verbe", mirada: "una Mirada", sangre: "una herencia", pacto: "un pacto" }[tec.rama] ?? "que el DM la abra";
    return { ok: false, motivo: `La rama ${nombreRama(tec.rama)} pide ${por}.` };
  }
  const r = rangoDe(actor, tec.rama);
  if (tec.g > rangoGrado(r)) return { ok: false, motivo: `Pide ${nombreRango(D.rangos.findIndex(x => x.grado >= tec.g))} en ${nombreRama(tec.rama)}.` };
  // Herencias
  const her = herenciaDe(actor);
  if (D.linajes.some(l => l.req && l.req === tec.req) && her?.req !== tec.req) return { ok: false, motivo: "Es de otra sangre." };
  if (tec.req === "una herencia" && !her) return { ok: false, motivo: "Pide una herencia." };
  if (tec.sec === "sangre" && (rangoDon(actor, "sangre") < 5) && tec.g > (FUERZA[e.fuerza ?? "plena"]?.grado ?? 9)) return { ok: false, motivo: `Su sangre llega hasta el grado ${FUERZA[e.fuerza].grado}.` };
  // Pactos de un linaje de criaturas
  if (/^pacto con /.test(tec.req ?? "")) {
    const p = tec.req.replace(/^pacto con (las |los |el |la )?/, "").split(" ")[0].toLowerCase();
    if (!(e.pactos ?? []).some(x => x.toLowerCase().includes(p))) return { ok: false, motivo: `Pide ${tec.req}.` };
  }
  // Otra técnica antes
  const previa = tec.req ? porNombre(tec.req) : null;
  if (previa && !conoce(actor, previa.id)) return { ok: false, motivo: `Pide saber ${previa.n}.` };
  // Naturaleza
  let probar = false;
  if (tec.nat && NATS[tec.nat] && !natsDe(actor).has(tec.nat)) {
    if ((e.probadas ?? []).includes(tec.nat)) return { ok: false, motivo: `Su Verbe no responde a ${NATS[tec.nat]}.` };
    probar = true;
  }
  if (tec.sec === "combo" && !combosDe(actor).has(tec.nat)) return { ok: false, motivo: `Pide la combinación ${nombreNat(tec.nat)}.` };
  const pideDM = /maestro/.test(tec.req ?? "");
  const { libres } = trazos(actor);
  if (libres < tec.trazos) return { ok: false, motivo: `Cuesta ${tec.trazos} Trazos y tiene ${libres}.`, probar };
  return { ok: true, probar, pideDM };
}

export function habilidadTecnica(actor, meta) {
  const e = estado(actor) ?? {};
  if (meta.usa === "fisica") return modDe(actor, "dex") > modDe(actor, "str") ? "dex" : "str";
  if (meta.usa === "wis") return "wis";
  return e.car || "wis";
}

export const afinidadDe = (actor, nat) => {
  const a = estado(actor)?.afinidad ?? {};
  const partes = deNats(nat);
  if (!partes.length) return 1;
  return Math.min(...partes.map(n => Number(a[n]) || 1));
};

/** Dados de más que lleva una técnica en este actor (dominio de rama, afinidad, cultivo, dotes). */
export function dadosExtra(actor, meta, infusion = null) {
  const e = estado(actor) ?? {};
  let n = Math.max(0, rangoDe(actor, meta.rama) - 1); // Experto +1, Maestro +2, Legendario +3, Mítico +4
  const nat = infusion || meta.nat;
  if (nat && deNats(nat).length) n += Math.max(0, afinidadDe(actor, nat) - 1); // Entrenada +1, Maestra +2
  if (D?.combos?.[nat] && tieneDote(actor, "combinacion-dominada") && combosDe(actor).has(nat)) n += 1;
  const cul = e.cultivos?.[meta.id];
  if (cul) n += (cul.mejoras ?? []).filter(m => m === "dado").length;
  n += sumaEf(actor, ef => (Number(ef.dados?.[meta.sec]) || 0) + (meta.sec !== meta.rama ? Number(ef.dados?.[meta.rama]) || 0 : 0));
  return n;
}

/** Efecto de Foundry puesto por la capa V (Despertar, Cerrojos, Ojo). */
const efectoV = (actor, clave) => actor?.effects?.find(x => x.getFlag?.(MOD, F)?.[clave] !== undefined && !x.disabled) ?? null;

/** Costo en Verbe de usar la técnica a un grado. */
/** El clima del día (al aire libre): −1 si favorece a la naturaleza de la técnica, +1 si la estorba. Lo decide main.js. */
export function ajusteClima(nat, meta = {}) {
  if (!nat || ["mirada", "sello", "pacto"].includes(meta.rama)) return 0;
  let cl = null;
  try {
    cl = game.modules.get(MOD)?.api?.climaVerbe?.() ?? null;
  } catch {
    cl = null;
  }
  if (!cl) return 0;
  // Cada naturaleza (simple o combinada) tiene sus propios días; los datos viejos traían solo las cinco simples.
  const de = cl.porNat ? [nat] : deNats(nat);
  const fav = de.some(n => cl.favor?.includes(n));
  const con = de.some(n => cl.contra?.includes(n));
  return (fav && !con) ? -1 : ((con && !fav) ? 1 : 0);
}

export function costoUso(actor, meta, grado, { infusion = null } = {}) {
  const e = estado(actor) ?? {};
  let c = costoGrado(grado);
  const cul = e.cultivos?.[meta.id];
  if (cul) c -= (cul.mejoras ?? []).filter(m => m === "verbe").length;
  if (tieneDote(actor, "maestria-control") && e.maestria === meta.rama) c -= 1;
  if (meta.rama === "sangre" && rangoDon(actor, "sangre") >= 3) c -= 1;
  const her = herenciaDe(actor);
  c += Number(her?.costoRama?.[meta.rama]) || 0;
  const nat = infusion || meta.nat;
  if (efectoV(actor, "despertar") && her?.despertar?.costoNat?.[nat]) c += Number(her.despertar.costoNat[nat]) || 0;
  for (const ef of efectosDotes(actor)) {
    for (const [k, v] of Object.entries(ef.costo ?? {})) {
      if (k === "tec") c += Number(v?.[meta.id]) || 0;
      else if (k === "combo") c += meta.sec === "combo" ? Number(v) || 0 : 0;
      else if (k === "principal") c += meta.rama === e.principal ? Number(v) || 0 : 0;
      else if (k === meta.rama) c += Number(v) || 0;
    }
  }
  c += ajusteClima(nat, meta);
  if (grado > 0) c = Math.max(1, c);
  // Abrir un ojo cuesta 1 por minuto; quien lo lleva trasplantado paga el doble.
  if (meta.rama === "mirada") {
    if (/-abrir$/.test(meta.id)) c = Math.max(c, 1);
    if ((e.trasplantes ?? []).includes(meta.id.split("-")[1]) && !tieneDote(actor, "injerto-aceptado")) c *= 2;
  }
  if (infusion) {
    let extra = D?.combos?.[infusion] ? 4 : 2;
    if (tieneDote(actor, "infusion-rapida")) extra -= 1;
    if (D?.combos?.[infusion] && tieneDote(actor, "combinacion-dominada")) extra -= 1;
    if (cul?.infusionFija !== infusion) c += Math.max(0, extra);
  }
  if (e.reserva === meta.id && !e.reservaUsada && grado === meta.g) c = 0;
  return Math.max(0, c);
}

/** La interfaz consulta exactamente los costes y bloqueos del uso nativo, sin gastar nada. */
export function previsualizarUso(actor, meta, grado = Number(meta?.g) || 0) {
  const e = estado(actor) ?? {};
  const extra = meta?.fuerte ? extraContraFuerte(actor).extra : 0;
  const costo = costoUso(actor, meta, grado, { infusion: meta.infusion }) + extra;
  const item = itemsDe(actor, meta.id)[0];
  const permiso = evaluarGasto({ valor: Number(e.valor) || 0, costo, limite: limiteNegativo(actor), grado,
    gradoMaximo: gradoUsable(actor, meta), agotamiento: Number(actor.system?.attributes?.exhaustion) || 0,
    incapacitado: noPuedeActuar(actor), reaccion: item?.system?.activation?.type === "reaction" || tecnicaPorId(meta.id, actor)?.t === "R",
    puedeReaccionar: reaccionDisponible(actor), altoGastado: !!e.usosAltos?.[meta.id] });
  return { ...permiso, costo, extra };
}

/** Conserva el diálogo, las tiradas y el consumo de dnd5e. No lanza desde una copia del catálogo. */
export async function usarTecnica(actor, id) {
  if (!editarActor(actor) || !despierto(actor)) return false;
  const item = itemsDe(actor, id)[0];
  if (!item) return rechazar("Primero debes aprender esa técnica.");
  if (D.defensas?.[id]) return rechazar("Esta defensa se ofrece cuando recibes un ataque con midi-qol. Sin esa integración, acuerda el uso y el coste con el DM antes de resolver el golpe.");
  const meta = item.getFlag(MOD, F);
  const estadoUso = previsualizarUso(actor, meta);
  if (!estadoUso.ok) return rechazar(estadoUso.motivo);
  const fuente = item.system?.activities;
  const actividades = fuente?.values ? [...fuente.values()] : Object.values(fuente ?? {});
  if (actividades.length === 1 && typeof actividades[0].use === "function") return actividades[0].use();
  if (item.sheet?.render) {
    aviso(actividades.length > 1 ? "Elige la actividad que quieres usar en la ficha de tu técnica." : "Usa la actividad desde la ficha de tu técnica.");
    return item.sheet.render({ force: true });
  }
  return rechazar("Abre la sección Técnicas del Verbe de tu hoja para usarla.");
}

function efectoEstado(st, id, doble = false) {
  const c = ESTADOS[st];
  const s = (c.dura || 6) * (doble ? 2 : 1);
  return { _id: id, name: c.name, img: c.img, statuses: [st], transfer: false, disabled: false, description: `<p>${c.texto}</p>`,
    changes: foundry.utils.deepClone(c.changes ?? []), duration: c.dura === 0 ? {} : { seconds: s, rounds: Math.max(1, Math.round(s / 6)) },
    flags: { [MOD]: { [F]: { estado: st } } } };
}

/** Arma los datos del objeto para este actor a partir de la técnica base. */
export function datosItem(actor, tec) {
  const data = foundry.utils.deepClone(tec.item);
  const meta = data.flags[MOD][F];
  const e = estado(actor) ?? {};
  const inf = e.infusiones?.[tec.id] ?? null;
  const cul = e.cultivos?.[tec.id] ?? null;
  data.system.ability = habilidadTecnica(actor, meta);
  const extra = dadosExtra(actor, meta, inf);
  const mej = cul?.mejoras ?? [];
  const max = Math.max(0, gradoUsable(actor, meta) - tec.g);
  for (const act of Object.values(data.system.activities)) {
    act.consumption ??= { targets: [], scaling: {}, spellSlot: false };
    act.consumption.scaling = { allowed: (tec.g > 0) && (max > 0), max: String(max + 1) };
    act.consumption.spellSlot = false;
    if (tec.g >= 6) act.consumption.targets = [{ type: "itemUses", target: "", value: "1", scaling: { mode: "", formula: "" } }];
    const partes = act.damage?.parts ?? (act.healing ? [act.healing] : []);
    partes.forEach((p, i) => {
      if (i === 0 && p.number && !p.custom?.enabled) p.number += extra;
      if (inf && (meta.rama !== "velo") && !act.healing) p.types = [TIPO_NAT[inf] ?? "force"];
    });
    if (partes[0]?.number && tieneDote(actor, "naturaleza-afilada") && e.nats?.[0] && deNats(inf || meta.nat).includes(e.nats[0])) {
      partes[0].bonus = [partes[0].bonus, nivelDe(actor) >= 5 ? "@mod" : "max(1, floor(@mod / 2))"].filter(Boolean).join(" + ");
    }
    const cd = mej.filter(m => m === "cd").length + sumaEf(actor, ef => (meta.rama === e.principal ? Number(ef.cd?.principal) || 0 : 0) + (Number(ef.cd?.[meta.rama]) || 0));
    if (tec.g === 0 && partes[0]?.number && !act.healing && efectosDotes(actor).some(ef => ef.dano0)) partes[0].bonus = [partes[0].bonus, "@mod"].filter(Boolean).join(" + ");
    const cura = efectosDotes(actor).map(ef => ef.cura?.[meta.rama]).filter(Boolean);
    if (act.healing && cura.length) act.healing.bonus = [act.healing.bonus, ...cura].filter(Boolean).join(" + ");
    if (cd) {
      if (act.type === "save") act.save.dc = { calculation: "", formula: `8 + @prof + @abilities.${data.system.ability}.mod + ${cd}` };
      if (act.type === "attack") act.attack.bonus = String(cd);
    }
  }
  if (mej.includes("rapida")) {
    const a = data.system.activation;
    if (a.type === "minute" || a.type === "hour") Object.assign(a, { type: "action", value: 1 });
    else if (a.type === "action") Object.assign(a, { type: "bonus", value: 1 });
  }
  // Dotes de alcance y área
  const r0 = data.system.range;
  if (r0?.units === "m" && Number(r0.value) >= 9) {
    const x = efectosDotes(actor).reduce((t, ef) => t * (Number(ef.alcance) || 1), 1);
    r0.value = Math.round(Number(r0.value) * x) + sumaEf(actor, ef => ef.alcanceRama?.[meta.rama]);
  }
  const masArea = sumaEf(actor, ef => ef.area);
  if (masArea && data.system.target?.template?.size) data.system.target.template.size = Number(data.system.target.template.size) + masArea;
  const grande = mej.filter(m => m === "area").length;
  if (grande) {
    const tpl = data.system.target?.template;
    if (tpl?.size) tpl.size = Math.round(Number(tpl.size) * (1.5 ** grande) * 10) / 10;
    else if (data.system.range?.value) data.system.range.value = Math.round(Number(data.system.range.value) * (1.5 ** grande));
  }
  if (inf) {
    data.name = `${tec.n} · ${nombreNat(inf)}`;
    for (const st of ESTADO_NAT[inf] ?? []) {
      const eid = idFijo(`${st}${tec.id}`);
      data.effects = [...(data.effects ?? []).filter(x => !x.statuses?.includes(st)), efectoEstado(st, eid)];
      for (const act of Object.values(data.system.activities)) act.effects = [...(act.effects ?? []), { _id: eid, onSave: false }];
    }
  }
  // Los estados de naturaleza llevan su mecánica, y con afinidad Entrenada duran el doble.
  const doble = afinidadDe(actor, inf || meta.nat) >= 2;
  data.effects = (data.effects ?? []).map(ef => (ESTADOS[ef.statuses?.[0]] ? efectoEstado(ef.statuses[0], ef._id, doble) : ef));
  meta.infusion = inf;
  meta.cultivo = cul?.nivel ?? 0;
  data.system.description.value = (data.system.description.value ?? "") + notaPersonal(actor, tec, extra, inf, cul);
  meta.firma = firma(JSON.stringify([data.name, data.system, data.effects]));
  return data;
}
const idFijo = s => `${s.replace(/[^A-Za-z0-9]/g, "")}0000000000000000`.slice(0, 16);
const firma = s => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); };

function notaPersonal(actor, tec, extra, inf, cul) {
  const p = [];
  if (extra) p.push(`+${extra} dado${extra > 1 ? "s" : ""} por rango, afinidad o cultivo`);
  if (inf) p.push(`infundida con ${nombreNat(inf)}`);
  if (cul?.nivel) p.push(`cultivada: ${NIVEL_CULTIVO[cul.nivel]}${cul.mejoras?.length ? ` (${cul.mejoras.map(m => MEJORAS[m] ?? `infusión fija: ${nombreNat(cul.infusionFija)}`).join(", ")})` : ""}`);
  p.push(`cuesta ${costoUso(actor, tec, tec.g, { infusion: inf })} Verbe`);
  return `<p class="ecos-verbe-nota"><em>${p.join(" · ")}.</em></p>`;
}

/** Actualiza las técnicas existentes sin reemplazar sus documentos ni reiniciar usos. */
export async function refrescar(actor) {
  if (!actor?.isOwner) return;
  const datos = [];
  for (const it of itemsTecnica(actor)) {
    const tec = tecnicaPorId(it.getFlag(MOD, F).id, actor);
    if (!tec) continue;
    const d = datosItem(actor, tec);
    if (d.flags[MOD][F].firma === it.getFlag(MOD, F).firma) continue; // no cambió nada
    d._id = it.id;
    d.sort = it.sort;
    if (d.system.uses) d.system.uses.spent = Number(it.system?.uses?.spent) || 0;
    for (const [id, act] of Object.entries(d.system.activities ?? {})) {
      const anterior = it.system?.activities?.get?.(id) ?? it.system?.activities?.[id];
      if (act.uses && anterior?.uses) act.uses.spent = Number(anterior.uses.spent) || 0;
    }
    datos.push(d);
  }
  if (!datos.length) return;
  await actor.updateEmbeddedDocuments("Item", datos, { diff: false });
}

export async function guardar(actor, cambios, otrosCambios = {}) {
  const e = foundry.utils.mergeObject(foundry.utils.deepClone(estado(actor) ?? {}), cambios, { inplace: false });
  await actor.update({ ...otrosCambios, [`flags.${MOD}.${F}`]: e });
  return e;
}

export function aprender(actor, ...args) { return serializarActor(actor, () => aprenderInterno(actor, ...args)); }
async function aprenderInterno(actor, tec, { gratis = false, nota = null, aprobado = false } = {}) {
  if (!editarActor(actor) || !tec || conoce(actor, tec.id)) return false;
  if (gratis && !game.user.isGM) return rechazar("Solo el DM puede conceder una técnica gratis.", "warn");
  const conocida = tecnicaPorId(tec.id, actor);
  if (!conocida) return rechazar("La técnica no pertenece al catálogo ni a sus técnicas propias.", "warn");
  tec = conocida;
  if (!gratis) {
    const r = requisitos(actor, tec);
    if (!r.ok || r.probar) { aviso(r.motivo ?? "Primero debe descubrir esa naturaleza.", "warn"); return false; }
    if (r.pideDM && !aprobado && !game.user.isGM) {
      return pedirAlDM(actor, "tecnica", { id: tec.id }, tec.n, `Pide: ${tec.req ?? ""}.`);
    }
  }
  const data = datosItem(actor, tec);
  data.sort = (tec.g * 100000) + (itemsTecnica(actor).length * 10);
  const creados = await actor.createEmbeddedDocuments("Item", [data], { keepEmbeddedIds: true });
  const e = estado(actor);
  const costo = gratis ? 0 : (Number(tec.trazos) || 0);
  const texto = `Aprende ${tec.n}${costo ? ` (${costo} Trazos)` : " (gratis)"}${nota ? ` · ${nota}` : ""}`;
  try {
    await guardar(actor, { gastados: (Number(e.gastados) || 0) + costo, historial: hist(e, texto),
      ...(gratis ? { regalos: [...new Set([...(e.regalos ?? []), tec.id])] } : { compras: compra(e, "tecnica", { id: tec.id }, costo, texto) }) });
  } catch (err) {
    await actor.deleteEmbeddedDocuments("Item", creados.map(i => i.id));
    throw err;
  }
  return true;
}

/* ------------------------------------------------------------------ */
/*  Despertar                                                         */
/* ------------------------------------------------------------------ */

const caracteristicaSugerida = actor => (CARS[actor.system?.attributes?.spellcasting] ? actor.system.attributes.spellcasting : "wis");
const opciones = (pares, sel) => pares.map(([k, v]) => `<option value="${escH(k)}" ${String(k) === String(sel) ? "selected" : ""}>${escH(v)}</option>`).join("");
/** Nombre de un linaje: el jugador ve el camuflado; el DM, los dos. */
const nombreLinaje = l => (!l ? "" : dm() ? `${l.alias ?? l.nombre} · ${l.real ?? l.nombre}` : (l.alias ?? l.nombre));
const paresLinaje = () => [["ninguno", "Sin linaje"], ...D.linajes.map(l => [l.id, `${nombreLinaje(l)}${l.herencia ? ` · ${l.herencia}` : ""}`])];
const ramasLibres = () => D.ramas.filter(r => !RAMAS_LINAJE.includes(r.id)).map(r => [r.id, r.nombre]);
const otraNat = n => { const o = Object.keys(NATS).filter(x => x !== n); return o[Math.floor(Math.random() * o.length)]; };

export async function dialogoDespertar(actor) {
  if (!game.user.isGM) return;
  const { DialogV2 } = foundry.applications.api;
  const oculta = Object.keys(NATS)[Math.floor(Math.random() * 5)];
  const portador = actor.getFlag(MOD, "portador") === true;
  const linPortador = D.linajes.find(l => l.portador)?.id ?? "ninguno";
  const html = `<div class="ecos-verbe-form">
    <p>Despierta a <b>${escH(actor.name)}</b>. Desde ahí su hoja muestra la barra, la habilidad Control y el panel.</p>
    <label>Característica <select name="car">${opciones(Object.entries(CARS), caracteristicaSugerida(actor))}</select></label>
    <label>Primera naturaleza <select name="nat"><option value="">Que la elija el jugador</option>${opciones(Object.entries(NATS), "")}</select></label>
    <label>Naturaleza oculta <select name="oculta">${opciones(Object.entries(NATS), oculta)}</select> <small>sorteada; solo la ves tú</small></label>
    <label>Linaje <select name="linaje">${opciones(paresLinaje(), portador ? linPortador : "ninguno")}</select></label>
    <label>Fuerza de la sangre <select name="fuerza">${opciones(Object.entries(FUERZA).map(([k, v]) => [k, v.nombre]), portador ? "plena" : "ninguna")}</select></label>
    <label><input type="checkbox" name="linajeVisible" ${portador ? "" : "checked"}> El jugador sabe su linaje <small>(si no, no ve la rama Sangre ni su linaje)</small></label>
    <label>Rama principal <select name="principal"><option value="">Que la elija el jugador</option>${opciones(ramasLibres(), "")}</select></label>
    ${actor.type !== "character" ? `<label>Nivel (PNJ) <input type="number" name="nivel" min="1" max="20" value="${nivelDe(actor)}"></label>` : ""}
    <label><input type="checkbox" name="lleno" checked> Empieza con la reserva llena</label>
  </div>`;
  const r = await DialogV2.wait({
    window: { title: `Despertar · ${actor.name}`, icon: "fa-solid fa-droplet" },
    content: html,
    buttons: [{ action: "ok", label: "Despertar", default: true, callback: (ev, btn) => new foundry.applications.ux.FormDataExtended(btn.form).object },
      { action: "no", label: "Cancelar" }],
    rejectClose: false
  });
  if (!r || r === "no") return;
  return despertar(actor, r);
}

export async function despertar(actor, o) {
  if (!game.user.isGM) return false;
  const nat = o.nat || null;
  let oculta = o.oculta || null;
  if (oculta && oculta === nat) oculta = otraNat(nat);
  const e = {
    despierto: true, car: o.car || caracteristicaSugerida(actor), nats: nat ? [nat] : [], oc: revolver(oculta, actor.id), descubierta: false,
    probadas: [], linaje: o.linaje || "ninguno", fuerza: o.fuerza || "ninguna", linajeVisible: !!o.linajeVisible, principal: o.principal || null,
    segunda: null, maestria: null, escuela: null, rangos: {}, ordenRamas: [], abiertas: [], afinidad: {}, trazosExtra: 0, gastados: 0,
    dotes: [...(D.innatos ?? [])], natsExtra: [], combos: [], miradas: {}, trasplantes: [], pactos: [], cerrojos: 0, cultivos: {}, infusiones: {}, propias: [],
    monedas: {}, reserva: null, reservaUsada: false, despertarLibre: false, nivel: o.nivel ? Number(o.nivel) : null, valor: 0,
    historial: [`Despierta en el nivel ${nivelDe(actor)}`]
  };
  if (e.principal) { e.rangos[e.principal] = 1; e.ordenRamas.push(e.principal); }
  await actor.update({ [`flags.${MOD}.${F}`]: e });
  if (o.lleno) await actor.update({ [`flags.${MOD}.${F}.valor`]: maxVerbe(actor) });
  await asegurarRasgos(actor);
  const lin = linajeDe(actor);
  await susurrarDM(`${escH(actor.name)} despierta`, `<p>${CARS[e.car]} · naturaleza ${NATS[nat] ?? "por elegir"} · oculta <b>${NATS[oculta] ?? "—"}</b> · linaje ${escH(lin ? `${lin.alias ?? lin.nombre} (${lin.real ?? lin.nombre})` : "ninguno")} (${FUERZA[e.fuerza].nombre}${e.linajeVisible ? "" : ", no lo sabe"}) · rama principal ${e.principal ? nombreRama(e.principal) : "por elegir"}.</p><p>Reserva ${maxVerbe(actor)} · ${trazos(actor).libres} Trazos para gastar en su panel.</p>`);
  if (MODO === "activo") aLaMesa(actor, `✦ ${escH(actor.name)}`, "<p>Algo se abre por dentro y empieza a correr. Su hoja tiene ahora el panel del Verbe (botón «Verbe» arriba de la hoja).</p>", { soloDueno: true });
  await asegurarGuia();
  return e;
}

/** El rasgo «El Verbe» y el pasivo de la herencia, en la hoja. */
async function asegurarRasgos(actor) {
  let e = estado(actor);
  if ((Number(e.reglasVersion) || 0) < VERSION_REGLAS && soyGM()) {
    await guardar(actor, { reglasVersion: VERSION_REGLAS, recResto: 0, reaccionUsada: false,
      cerrojosHoy: { ciclo: 0, veces: 0 }, historial: hist(e, "Base estable 2.8: deuda unificada y Cerrojos por Descanso Largo; compras conservadas.") });
    e = estado(actor);
  }
  // Los dones del despertar: si falta alguno (despertó antes de la v1.2), se lo pone sin cobrar.
  const faltan = (D.innatos ?? []).filter(id => !(e.dotes ?? []).includes(id));
  if (faltan.length) {
    await guardar(actor, { dotes: [...(e.dotes ?? []), ...faltan] });
    e = estado(actor);
  }
  // Cada dote que tiene (las de nacimiento y las compradas) va como rasgo en la hoja: si falta alguno, se pone.
  const conRasgo = new Set(actor.items.map(i => i.getFlag(MOD, F)?.dote).filter(Boolean));
  const sinRasgo = (e.dotes ?? []).filter(id => !conRasgo.has(id));
  for (const id of sinRasgo) {
    const dote = D.dotes.find(x => x.id === id);
    if (dote) await rasgoDote(actor, dote);
  }
  await asegurarAEDotes(actor);
  const lin = linajeDe(actor);
  const html = `<p>El Verbe corre por ti. Tu reserva sube con el nivel y se recupera poco a poco: la mitad en un Descanso Largo en el Santuario, un cuarto en una noche a la intemperie.</p>
    <p><b>Característica:</b> ${CARS[e.car]} · <b>Naturaleza:</b> ${[...natsDe(actor)].map(n => NATS[n] ?? n).join(", ") || "por elegir"} · <b>Rama principal:</b> ${e.principal ? nombreRama(e.principal) : "por elegir"}${e.linajeVisible && lin ? ` · <b>Linaje:</b> ${escH(lin.alias ?? lin.nombre)} (${FUERZA[e.fuerza]?.nombre})` : ""}</p>
    <p>Las técnicas están en la pestaña de conjuros, en «Técnicas del Verbe». Lo demás, en el panel (botón «Verbe» en la cabecera de la hoja).</p>`;
  const it = actor.items.find(i => i.getFlag(MOD, F)?.rasgo);
  if (it) await it.update({ "system.description.value": html });
  else await actor.createEmbeddedDocuments("Item", [{ name: "El Verbe", type: "feat", img: "systems/dnd5e/icons/svg/damage/force.svg",
    system: { description: { value: html } }, flags: { [MOD]: { [F]: { rasgo: true } } } }]);
  // El pasivo de la herencia (resistencias), como efecto del actor.
  const pasivo = actor.effects.find(x => x.getFlag(MOD, F)?.herencia);
  const her = herenciaDe(actor);
  const cambios = [...(her?.rasgo?.dr ?? []).map(t => ({ key: "system.traits.dr.value", mode: 2, value: t })),
    ...(her?.rasgo?.ae ?? []).map(([key, mode, value]) => ({ key, mode, value }))];
  if (pasivo && (!cambios.length || pasivo.getFlag(MOD, F).herencia !== her?.id)) await pasivo.delete();
  else if (pasivo) return;
  if (cambios.length) await actor.createEmbeddedDocuments("ActiveEffect", [{ name: e.linajeVisible ? her.herencia : "Resistencia innata", img: "systems/dnd5e/icons/svg/damage/radiant.svg",
    changes: cambios, transfer: false, flags: { [MOD]: { [F]: { herencia: her.id } } } }]);
}

/** Lo que las dotes suman a la hoja (CA, ataques, velocidad...), en un solo efecto del actor. */
export async function asegurarAEDotes(actor) {
  const changes = efectosDotes(actor).flatMap(ef => (ef.ae ?? []).map(([key, mode, value]) => ({ key, mode, value })));
  const pesada = actor.items.some(i => i.system?.equipped && (i.system?.armor?.type === "heavy" || i.system?.type?.value === "heavy"));
  if (rangoDon(actor, "cuerpo") >= 2 && !pesada) changes.push(
    { key: "system.attributes.ac.bonus", mode: 2, value: "+ 1" },
    { key: "system.attributes.movement.walk", mode: 2, value: "3" });
  for (const c of changes) if (/system\.attributes\.movement\./.test(c.key) && Number(c.mode) !== 1 && Number.isFinite(Number(c.value))) {
    // Los datos del módulo expresan distancias en metros; las hojas pueden usar pies.
    if (actor.system?.attributes?.movement?.units === "ft") c.value = String(Number(c.value) / 0.3);
  }
  const ef = actor.effects.find(x => x.getFlag(MOD, F)?.dotesAE);
  if (!changes.length) { if (ef) await ef.delete(); return; }
  if (ef) { if (JSON.stringify(ef.changes) !== JSON.stringify(changes)) await ef.update({ changes }); return; }
  await actor.createEmbeddedDocuments("ActiveEffect", [{ name: "Beneficios del Verbe", img: "systems/dnd5e/icons/svg/items/feature.svg", changes,
    transfer: false, flags: { [MOD]: { [F]: { dotesAE: true } } } }]);
}

/** Una dote es también un rasgo en la hoja (las de nacimiento lo dicen). */
async function rasgoDote(actor, dote) {
  if (actor.items.some(i => i.getFlag(MOD, F)?.dote === dote.id)) return;
  const nace = (D.innatos ?? []).includes(dote.id);
  await actor.createEmbeddedDocuments("Item", [{ name: dote.nombre, type: "feat", img: "systems/dnd5e/icons/svg/items/feature.svg",
    system: { description: { value: `<p>${escH(dote.texto)}</p>${nace ? "<p><em>Del Verbe, de nacimiento: lo tiene todo el que despierta. Se mejora con Trazos en el panel (Mejorar → Dotes).</em></p>" : "<p><em>Dote del Verbe.</em></p>"}` } },
    flags: { [MOD]: { [F]: { dote: dote.id } } } }]);
}

/* ------------------------------------------------------------------ */
/*  Gasto al usar una técnica                                         */
/* ------------------------------------------------------------------ */

/** El grado de una criatura: el de su Verbe si despertó, si no la mitad de su nivel o VD (hacia arriba). */
export function gradoCriatura(a) {
  if (!a) return 0;
  if (despierto(a)) return gradoMax(a);
  const n = (a.type === "character") ? Number(a.system?.details?.level) || 1 : Number(a.system?.details?.cr) || 0;
  return Math.ceil(n / 2);
}

/** Lo que cuesta de más una técnica fuerte contra el más fuerte de sus objetivos: 2 Verbe por grado sobre tu grado máximo. */
export function extraContraFuerte(actor, objetivos = null) {
  const lista = objetivos ?? [...(game.user?.targets ?? [])].map(t => t.actor).filter(Boolean);
  let extra = 0;
  let quien = null;
  for (const a of lista) {
    if (a === actor) continue;
    const x = 2 * Math.max(0, gradoCriatura(a) - gradoMax(actor));
    if (x > extra) { extra = x; quien = a.name; }
  }
  return { extra, quien };
}

export function alConsumir(activity, usageConfig, messageConfig, updates) {
  try {
    const item = activity?.item;
    const meta = item?.getFlag?.(MOD, F);
    if (!meta?.id) return;
    const actor = item.actor;
    if (!editarActor(actor)) return false;
    if (enSerie.ocupada(claveActor(actor)) || (consumoPendiente(actor) && consumoPendiente(actor).config !== usageConfig)) {
      aviso("Ya hay una operación de Verbe en curso para este personaje.", "warn");
      return false;
    }
    const e = estado(actor);
    if (!e?.despierto) { aviso(`${actor?.name ?? "Este actor"} no tiene el Verbe despierto.`, "warn"); return false; }
    if (usageConfig?.consume === false) {
      if (game.user.isGM) return;
      aviso("Solo el DM puede omitir el gasto de una técnica.", "warn");
      return false;
    }
    const grado = meta.g + (Number(usageConfig?.scaling) || 0);
    const fuerte = meta.fuerte ? extraContraFuerte(actor) : { extra: 0, quien: null };
    const costo = costoUso(actor, meta, grado, { infusion: meta.infusion }) + fuerte.extra;
    const valor = Number(e.valor) || 0;
    const reaccion = item.system?.activation?.type === "reaction" || tecnicaPorId(meta.id, actor)?.t === "R";
    const permiso = evaluarGasto({ valor, costo, limite: limiteNegativo(actor), grado, gradoMaximo: gradoUsable(actor, meta),
      agotamiento: Number(actor.system?.attributes?.exhaustion) || 0, incapacitado: noPuedeActuar(actor),
      reaccion, puedeReaccionar: reaccionDisponible(actor), altoGastado: !!e.usosAltos?.[meta.id] });
    if (!permiso.ok) { aviso(permiso.motivo, "warn"); return false; }
    const nuevo = permiso.despues;
    const nonce = foundry.utils.randomID();
    consumosPendientes.set(claveActor(actor), { config: usageConfig, nonce, hasta: Date.now() + 30000 });
    updates.actor ??= {};
    updates.actor[`flags.${MOD}.${F}.valor`] = nuevo;
    updates.actor[`flags.${MOD}.${F}.ultimoUso`] = nonce;
    if (grado >= 6) updates.actor[`flags.${MOD}.${F}.usosAltos.${meta.id}`] = true;
    if (reaccion && game.combat?.started) updates.actor[`flags.${MOD}.${F}.reaccionUsada`] = true;
    if (e.reserva === meta.id && !e.reservaUsada && grado === meta.g) updates.actor[`flags.${MOD}.${F}.reservaUsada`] = true;
    usageConfig.ecosVerbe = { grado, costo, antes: valor, despues: nuevo, nonce, fuerte: fuerte.extra ? fuerte : null };
    foundry.utils.setProperty(messageConfig, `data.flags.${MOD}.${F}`, { grado, costo, despues: nuevo, extraFuerte: fuerte.extra || 0 });
  } catch (err) {
    console.error(`${MOD} | capa V: consumo`, err);
    aviso("No se pudo comprobar el gasto de Verbe. La técnica no se ha autorizado.", "error");
    return false;
  }
}

async function despuesDeUsar(activity, usageConfig) {
  const v = usageConfig?.ecosVerbe;
  if (!v) return;
  const item = activity.item;
  const actor = item.actor;
  if (consumoPendiente(actor)?.nonce === v.nonce) consumosPendientes.delete(claveActor(actor));
  const meta = item.getFlag(MOD, F);
  if (v.fuerte?.extra) aLaMesa(actor, "Contra alguien más fuerte", `<p>${escH(actor.name)} paga <b>${v.fuerte.extra} Verbe más</b>: ${escH(v.fuerte.quien ?? "su objetivo")} es más fuerte que su grado.</p>`, { soloDueno: true });
  if (v.despues < 0) await sobreesfuerzo(actor, v.grado, v.despues);
  // Estados de poder que se ponen al usar su técnica.
  if (meta.id === "sangre-despertar") await ponerDespertar(actor);
  else if (meta.rama === "mirada" && /-abrir$/.test(meta.id)) await ponerOjo(actor, meta.id.split("-")[1]);
}

/** Gastar en negativo: CON (CD 10 + grado) o 1 Agotamiento; y la Barrera lo siente si su sangre la toca. */
async function sobreesfuerzo(actor, grado, despues) {
  {
    const dc = 10 + grado + sumaEf(actor, ef => ef.sobreCD);
    const rolls = await actor.rollSavingThrow({ ability: "con", target: dc, advantage: tieneDote(actor, "aguante-verbe") }, { configure: false });
    const roll = Array.isArray(rolls) ? rolls[0] : rolls;
    if (roll && roll.total < dc) {
      const ag = Math.min(6, (Number(actor.system.attributes.exhaustion) || 0) + 1);
      await actor.update({ "system.attributes.exhaustion": ag });
      aLaMesa(actor, "Sobreesfuerzo", `<p>${escH(actor.name)} gasta lo que no tiene (${despues}) y no lo aguanta: <b>+1 Agotamiento</b> (${ag}).</p>`);
    }
    if (herenciaDe(actor)?.barrera) alDM({ accion: "capaVBarrera", actorId: actor.id });
  }
}

async function ponerDespertar(actor) {
  const her = herenciaDe(actor);
  if (!her) return;
  const d = her.despertar ?? {};
  const changes = [];
  if (d.ac) changes.push({ key: "system.attributes.ac.bonus", mode: 2, value: `+ ${d.ac}` });
  if (d.nado) changes.push({ key: "system.attributes.movement.swim", mode: 4, value: String(metrosEnHoja(d.nado, actor)) });
  if (d.vuelo) changes.push({ key: "system.attributes.movement.fly", mode: 4, value: String(metrosEnHoja(d.vuelo, actor)) });
  for (const t of d.dr ?? []) changes.push({ key: "system.traits.dr.value", mode: 2, value: t });
  const min = rangoDon(actor, "sangre") >= 2 ? 10 : 1;
  const texto = D.herencias.find(h => h.nombre === her.herencia)?.despertar ?? "";
  const viejo = efectoV(actor, "despertar");
  if (viejo) await viejo.delete({ ecosSinCierre: true });
  await actor.createEmbeddedDocuments("ActiveEffect", [{ name: "Despertar del linaje", img: "systems/dnd5e/icons/svg/damage/radiant.svg",
    changes, duration: { seconds: min * 60, rounds: min * 10 }, description: `<p>${escH(texto)}</p><p>Al terminar, 1 Agotamiento.</p>`,
    flags: { [MOD]: { [F]: { despertar: her.id } } } }]);
}

async function ponerOjo(actor, ojo) {
  const viejo = actor.effects.find(x => x.getFlag(MOD, F)?.ojo === ojo);
  if (viejo) await viejo.delete();
  const m = D.miradas.find(x => x.id === ojo);
  const etapa = Number(estado(actor).miradas?.[ojo]) || 1;
  const da = (m?.etapas ?? []).slice(0, etapa).map((t, i) => `<p><b>Etapa ${i + 1}:</b> ${escH(t)}</p>`).join("");
  await actor.createEmbeddedDocuments("ActiveEffect", [{ name: `${m?.nombre ?? "Ojo"} · abierto`, img: "systems/dnd5e/icons/svg/schools/divination.svg",
    duration: { seconds: 60, rounds: 10 }, description: `${da}<p>Mantenerlo abierto cuesta 1 Verbe por minuto: vuelve a usar «Abrir».</p>`,
    flags: { [MOD]: { [F]: { ojo } } } }]);
}

/** Dado extra del Despertar del linaje (técnicas de sus naturalezas). */
export function antesDelDano(config) {
  try {
    const act = config?.subject;
    const meta = act?.item?.getFlag?.(MOD, F);
    if (!meta?.id) return;
    const actor = act.actor;
    const dado = herenciaDe(actor)?.despertar?.dado;
    if (!dado || !efectoV(actor, "despertar")) return;
    if (!deNats(meta.infusion || meta.nat).some(n => dado.nats.includes(n))) return;
    config.rolls?.[0]?.parts?.push(dado.formula);
  } catch (err) {
    console.warn(`${MOD} | capa V: daño`, err);
  }
}

/* ------------------------------------------------------------------ */
/*  Descansos                                                         */
/* ------------------------------------------------------------------ */

export function alDescansar(actor, ...args) { return serializarActor(actor, () => alDescansarInterno(actor, ...args)); }
async function alDescansarInterno(actor, result, config) {
  try {
    if (!despierto(actor) || !actor.isOwner) return;
    const largo = config?.type === "long";
    const intemperie = (config?.type === "short") && config?.ecos?.intemperie;
    const e = estado(actor);
    const max = maxVerbe(actor);
    // Lo que se renueva en cualquier descanso: Sustitución refleja.
    if (config?.type === "short" || largo) await guardar(actor, { reflejaUsada: false, reaccionUsada: false });
    if (!largo && !intemperie) {
      // Respiro: un Descanso Corto bajo techo devuelve tu competencia de Verbe, una vez por Descanso Largo.
      if (config?.type === "short" && efectosDotes(actor).some(ef => ef.corto) && !e.respiroUsado) {
        const cambios = cambiosRecuperacion(actor, competencia(actor));
        const { valor } = cambios;
        await guardar(actor, { ...cambios, respiroUsado: true });
        aLaMesa(actor, "Verbe", `<p>${escH(actor.name)} toma aire: Verbe <b>${valor} / ${max}</b>.</p>`, { soloDueno: true });
      }
      return;
    }
    const frac = efectosDotes(actor).reduce((t, ef) => Math.max(t, Number(ef.rec?.[largo ? "largo" : "intemperie"]) || 0), largo ? 0.5 : 0.25);
    let rec = Math.floor(max * frac);
    if (largo && tieneDote(actor, "aliento-soldado")) rec += competencia(actor);
    rec = Math.floor(rec * (Number(herenciaDe(actor)?.recMult) || 1));
    const cambios = cambiosRecuperacion(actor, rec);
    const { valor } = cambios;
    Object.assign(cambios, { reflejaUsada: false, reaccionUsada: false });
    if (largo) Object.assign(cambios, { reservaUsada: false, despertarLibre: false, respiroUsado: false,
      usosAltos: Object.fromEntries(Object.keys(e.usosAltos ?? {}).map(id => [id, false])),
      cerrojosHoy: { ciclo: (Number(e.cerrojosHoy?.ciclo) || 0) + 1, veces: 0 } });
    await guardar(actor, cambios);
    aLaMesa(actor, "Verbe", `<p>${escH(actor.name)} recupera Verbe ${largo ? "en el Santuario" : "a la intemperie"}: <b>${valor} / ${max}</b>.</p>`, { soloDueno: true });
  } catch (err) {
    console.error(`${MOD} | capa V: descanso`, err);
  }
}

/* ------------------------------------------------------------------ */
/*  Socket del DM y pedidos                                           */
/* ------------------------------------------------------------------ */

const diaMundo = () => Math.floor((Number(game.time?.worldTime) || 0) / 86400);

function manejar(d, ...args) { return enSerie("pedidos", () => manejarInterno(d, ...args)); }
async function manejarInterno(d, { interno = false } = {}) {
  if (!soyGM()) return;
  try {
    const actor = d.actorId ? game.actors.get(d.actorId) : null;
    const remitente = game.users.get?.(d.de) ?? game.users.find(u => u.id === d.de);
    const propio = remitente && actor?.testUserPermission(remitente, "OWNER");
    if (!interno && !["capaVPedir", "capaVMetal"].includes(d.accion)) return;
    if (!interno && d.accion === "capaVPedir" && !propio) return;
    const api = game.modules.get(MOD)?.api;
    if (d.accion === "capaVBarrera" && actor) {
      if (!herenciaDe(actor)?.barrera || Number(estado(actor)?.valor) >= 0) return;
      // Gastar en negativo con esa sangre hace parpadear la Barrera: +1 al Reloj, una vez por día.
      if (actor.getFlag(MOD, "verbeParpadeo") === diaMundo()) return;
      await actor.setFlag(MOD, "verbeParpadeo", diaMundo());
      const v = api?.sumarReloj ? await api.sumarReloj(1) : null;
      await susurrarDM("La Barrera lo siente", `<p>${escH(actor.name)} gastó Verbe en negativo.${v !== null ? ` Reloj de la Barrera → <b>${v}/10</b>.` : ""}</p>`);
    } else if (d.accion === "capaVReloj" && actor) {
      const v = api?.sumarReloj ? await api.sumarReloj(1) : null;
      await susurrarDM("La Barrera lo siente", `<p>Termina el Despertar del linaje de ${escH(actor.name)}.${v !== null ? ` Reloj de la Barrera → <b>${v}/10</b>.` : ""}</p>`);
    } else if (d.accion === "capaVMetal" && actor) {
      const atacante = game.actors.get(d.atacanteId);
      if (!remitente || !atacante?.testUserPermission(remitente, "OWNER")) return;
      await consumirMetal(actor, Array.isArray(d.efectoIds) ? d.efectoIds.slice(0, 20).map(String) : []);
    } else if (d.accion === "capaVPedir" && actor) {
      if (!["tecnica", "crear", "dote", "afinidad"].includes(d.tipo) || !d.datos || typeof d.datos !== "object") return;
      if (JSON.stringify(d.datos).length > 16000) return;
      const pend = foundry.utils.deepClone(game.settings.get(MOD, AJ.pend) ?? []);
      const clave = firma(JSON.stringify([actor.id, d.tipo, d.datos]));
      if (pend.some(p => p.clave === clave)) return;
      if (pend.filter(p => p.actorId === actor.id).length >= 20) return;
      pend.push({ id: foundry.utils.randomID(), clave, actorId: actor.id, tipo: d.tipo, datos: d.datos,
        titulo: String(d.titulo ?? d.tipo).slice(0, 150), de: d.de, cuando: Date.now() });
      await game.settings.set(MOD, AJ.pend, pend);
      await susurrarDM(`${escH(actor.name)} pide ${escH(String(d.titulo ?? d.tipo).slice(0, 150))}`,
        `<p>${escH(String(d.resumen ?? "").replace(/<[^>]*>/g, "").slice(0, 2000))}</p><p>Revísalo en su panel, sección DM.</p>`);
      refrescarPanel(actor.id);
    }
  } catch (err) {
    console.error(`${MOD} | capa V: socket`, err);
  }
}

function pedirAlDM(actor, tipo, datos, titulo, resumen) {
  alDM({ accion: "capaVPedir", actorId: actor.id, tipo, datos, titulo, resumen });
  aviso("Se lo mandé al DM para que lo apruebe.");
}

/** El DM aprueba (o devuelve) un pedido. */
export function aprobar(pid, ...args) { return enSerie("pedidos", () => aprobarInterno(pid, ...args)); }
async function aprobarInterno(pid, si = true) {
  if (!game.user.isGM) return;
  const pend = foundry.utils.deepClone(game.settings.get(MOD, AJ.pend) ?? []);
  const p = pend.find(x => x.id === pid);
  if (!p) return;
  const actor = game.actors.get(p.actorId);
  if (!actor) return false;
  if (!si) {
    await game.settings.set(MOD, AJ.pend, pend.filter(x => x.id !== pid));
    return aLaMesa(actor, "Pedido devuelto", `<p>El DM devolvió: ${escH(p.titulo ?? p.tipo)}.</p>`, { soloDueno: true });
  }
  const d = p.datos ?? {};
  let resultado = false;
  if (p.tipo === "tecnica") {
    const tec = tecnicaPorId(d.id, actor);
    if (tec) resultado = await aprender(actor, tec, { nota: "aprobada", aprobado: true });
  } else if (p.tipo === "crear") {
    const revision = validarFormularioTecnica(actor, d);
    if (revision.duros.length) { aviso(revision.duros.join(" "), "warn"); return false; }
    if (!revision.ok) {
      const ok = await foundry.applications.api.DialogV2.confirm({ window: { title: "Excepción al presupuesto" },
        content: `<p>${escH(revision.excesos.join(" "))}</p><p>¿Aprobar esta excepción? Se guardará en la técnica. Confirma también que el entrenamiento y los materiales se resolvieron en la mesa.</p>`, rejectClose: false });
      if (!ok) return false;
      d.excepcionDM = true; d.motivoExcepcion = `Excepción aprobada por el DM: ${revision.excesos.join(" ")}`;
    }
    resultado = await crearAprobada(actor, d);
  }
  else if (p.tipo === "dote") resultado = await comprarDote(actor, d.id, { aprobado: true });
  else if (p.tipo === "afinidad") resultado = await subirAfinidad(actor, d.nat, { aprobado: true });
  if (resultado !== true) return false;
  await game.settings.set(MOD, AJ.pend, pend.filter(x => x.id !== pid));
  aLaMesa(actor, "Aprobado", `<p>El DM aprobó: ${escH(p.titulo ?? p.tipo)}.</p>`, { soloDueno: true });
  return true;
}

/* ------------------------------------------------------------------ */
/*  Compras: rangos, dotes, afinidad, Control, naturaleza, cultivo    */
/* ------------------------------------------------------------------ */

export function subirRango(actor, ...args) { return serializarActor(actor, () => subirRangoInterno(actor, ...args)); }
async function subirRangoInterno(actor, rama) {
  if (!D.ramas.some(r => r.id === rama)) return false;
  const r = rangoDe(actor, rama);
  if (r >= ultimoRango()) return rechazar(`Ya es ${nombreRango(r)}: es el rango más alto.`);
  if (!ramaAbierta(actor, rama)) return rechazar("Esa rama está cerrada.", "warn");
  const sig = D.rangos[r + 1];
  if (nivelDe(actor) < sig.nivel) return rechazar(`${sig.nombre} pide nivel ${sig.nivel}.`, "warn");
  const c = costoRango(actor, rama, r + 1);
  const { libres } = trazos(actor);
  if (libres < c) return rechazar(`Cuesta ${c} Trazos y tiene ${libres}.`, "warn");
  const e = estado(actor);
  const orden = [...(e.ordenRamas ?? [])];
  if (!orden.includes(rama)) orden.push(rama);
  const texto = `${nombreRama(rama)} ${sig.nombre} (${c} Trazos)`;
  await guardar(actor, { rangos: { [rama]: r + 1 }, ordenRamas: orden, gastados: (Number(e.gastados) || 0) + c,
    historial: hist(e, texto), compras: compra(e, "rango", { rama, a: r + 1 }, c, texto) });
  await refrescar(actor);
  await asegurarAEDotes(actor);
}

export function cumpleReqDote(actor, dote) {
  if (!dote?.id) return { ok: false, motivo: "La dote no existe." };
  const req = dote.req ?? "";
  const e = estado(actor) ?? {};
  const natural = requisitoNatural(req, natsDe(actor));
  if (!natural.ok) return natural;
  if (!req) return { ok: true };
  const m = req.match(/nivel (\d+)/);
  if (m && nivelDe(actor) < Number(m[1])) return { ok: false, motivo: `Pide nivel ${m[1]}.` };
  if (/Control fino/.test(req) && !tieneDote(actor, "control-fino")) return { ok: false, motivo: "Pide Control fino del Verbe." };
  if (/Maestría del Control/.test(req) && !tieneDote(actor, "maestria-control")) return { ok: false, motivo: "Pide Maestría del Control." };
  if (/Naturaleza combinada/.test(req) && !tieneDote(actor, "naturaleza-combinada")) return { ok: false, motivo: "Pide Naturaleza combinada." };
  const rama = req.match(/rama ([A-Za-zÁÉÍÓÚáéíóúñ]+)(?:, (Entrenado|Experto|Maestro))?/);
  if (rama) {
    const id = D.ramas.find(x => x.nombre.toLowerCase() === rama[1].toLowerCase())?.id;
    const min = rama[2] ? D.rangos.findIndex(x => x.nombre === rama[2]) : 1;
    if (id && rangoDe(actor, id) < min) return { ok: false, motivo: `Pide ${rama[1]} ${nombreRango(min)}.` };
  }
  if (/afinidad Entrenada/.test(req) && !Object.values(e.afinidad ?? {}).some(v => Number(v) >= 2)) return { ok: false, motivo: "Pide una afinidad Entrenada." };
  if (/^Sustitución/.test(req) && !conoce(actor, "forma-sustitucion")) return { ok: false, motivo: "Pide saber Sustitución." };
  if (/Andar por muros/.test(req) && !conoce(actor, "forma-andar")) return { ok: false, motivo: "Pide saber Andar por muros." };
  if (/sangre plena o media/.test(req) && !["plena", "media"].includes(e.fuerza)) return { ok: false, motivo: "Pide sangre plena o media." };
  if (/sabe un cerrojo/.test(req) && !(Number(e.cerrojos) > 0)) return { ok: false, motivo: "Primero debe aprender un Cerrojo." };
  if (/una Mirada/.test(req) && !Object.values(e.miradas ?? {}).some(n => Number(n) > 0)) return { ok: false, motivo: "Pide una Mirada despierta." };
  if (/Mirada trasplantada/.test(req) && !e.trasplantes?.length) return { ok: false, motivo: "Pide una Mirada trasplantada." };
  if (/una herencia/.test(req) && !herenciaDe(actor)) return { ok: false, motivo: "Pide una herencia." };
  if (/una técnica Propia/.test(req) && !Object.values(e.cultivos ?? {}).some(c => c.nivel >= 3)) return { ok: false, motivo: "Pide una técnica cultivada hasta Propia." };
  if (["naturaleza-combinada", "tercera-naturaleza"].includes(dote.id) && natsDe(actor).size < 2) return { ok: false, motivo: "Primero debe dominar dos naturalezas." };
  for (const parte of req.split(/[;,]/).map(x => x.trim().toLowerCase()).filter(Boolean)) {
    const previa = D.dotes.find(x => x.id !== dote.id && x.nombre.toLowerCase() === parte);
    if (previa && !tieneDote(actor, previa.id)) return { ok: false, motivo: `Pide la dote ${previa.nombre}.` };
  }
  return { ok: true, pideDM: /maestro|brazos|trasplantada|escuela|arte de familia/.test(req) };
}

export function comprarDote(actor, ...args) { return serializarActor(actor, () => comprarDoteInterno(actor, ...args)); }
async function comprarDoteInterno(actor, id, { aprobado = false } = {}) {
  const dote = D.dotes.find(x => x.id === id);
  if (!dote || tieneDote(actor, id)) return;
  const req = cumpleReqDote(actor, dote);
  if (!req.ok) { aviso(req.motivo, "warn"); return false; }
  const { libres } = trazos(actor);
  if (libres < dote.trazos) return rechazar(`Cuesta ${dote.trazos} Trazos y tiene ${libres}.`, "warn");
  if (req.pideDM && !aprobado && !game.user.isGM) return pedirAlDM(actor, "dote", { id }, `la dote ${dote.nombre}`, `${escH(dote.nombre)} (${dote.trazos} Trazos). Pide: ${escH(dote.req)}.`);
  const e = estado(actor);
  const texto = `Dote ${dote.nombre} (${dote.trazos} Trazos)`;
  await guardar(actor, { dotes: [...(e.dotes ?? []), id], gastados: (Number(e.gastados) || 0) + dote.trazos, historial: hist(e, texto),
    compras: compra(e, "dote", { id }, dote.trazos, texto) });
  await rasgoDote(actor, dote);
  await ajustarControl(actor);
  await asegurarAEDotes(actor);
  await refrescar(actor);
  if (["naturaleza-combinada", "elemento-complejo", "tercera-naturaleza", "juramento-casa"].includes(id)) {
    await susurrarDM(`${escH(actor.name)}: ${escH(dote.nombre)}`, "<p>Dale la combinación, la naturaleza o la escuela en su panel, sección DM.</p>");
  }
  return true;
}

export async function ajustarControl(actor) {
  const b = (tieneDote(actor, "control-fino") ? 1 : 0) + (tieneDote(actor, "control-legendario") ? 4 : tieneDote(actor, "maestria-control") ? 2 : 0)
    + sumaEf(actor, ef => ef.control);
  await actor.update({ "system.skills.cvb.bonuses.check": b ? `+ ${b}` : "" });
}

export function comprarControl(actor, ...args) { return serializarActor(actor, () => comprarControlInterno(actor, ...args)); }
async function comprarControlInterno(actor) {
  const v = Number(actor.system?.skills?.cvb?.value) || 0;
  if (v >= 2) return rechazar("Ya tiene pericia en Control.");
  const costo = v === 0 ? 2 : 3;
  if (v === 1 && nivelDe(actor) < 5) return rechazar("La pericia en Control pide nivel 5.", "warn");
  const { libres } = trazos(actor);
  if (libres < costo) return rechazar(`Cuesta ${costo} Trazos y tiene ${libres}.`, "warn");
  const e = estado(actor);
  const texto = `Control: ${v === 0 ? "competencia" : "pericia"} (${costo} Trazos)`;
  await guardar(actor, { gastados: (Number(e.gastados) || 0) + costo, historial: hist(e, texto), compras: compra(e, "control", { v: v + 1 }, costo, texto) },
    { "system.skills.cvb.value": v + 1 });
}

export function subirAfinidad(actor, ...args) { return serializarActor(actor, () => subirAfinidadInterno(actor, ...args)); }
async function subirAfinidadInterno(actor, nat, { aprobado = false } = {}) {
  const e = estado(actor);
  if (!natsDe(actor).has(nat)) return rechazar("No tiene esa naturaleza.", "warn");
  const a = Number(e.afinidad?.[nat]) || 1;
  if (a >= 3) return rechazar("Ya es Maestra.");
  const nivelMin = a === 1 ? 5 : 11;
  const costo = a === 1 ? 2 : 4;
  if (nivelDe(actor) < nivelMin) return rechazar(`Pide nivel ${nivelMin}.`, "warn");
  const { libres } = trazos(actor);
  if (libres < costo) return rechazar(`Cuesta ${costo} Trazos y tiene ${libres}.`, "warn");
  if (!aprobado && !game.user.isGM) return pedirAlDM(actor, "afinidad", { nat }, `afinidad ${a === 1 ? "Entrenada" : "Maestra"} en ${NATS[nat]}`, `Pide un maestro de ${NATS[nat]}. Cuesta ${costo} Trazos.`);
  const texto = `Afinidad ${NATS[nat]} ${a === 1 ? "Entrenada" : "Maestra"} (${costo} Trazos)`;
  await guardar(actor, { afinidad: { [nat]: a + 1 }, gastados: (Number(e.gastados) || 0) + costo, historial: hist(e, texto),
    compras: compra(e, "afinidad", { nat, a: a + 1 }, costo, texto) });
  await refrescar(actor);
  return true;
}

/** Probar una técnica de una naturaleza que no tiene: si es su oculta, la descubre. No gasta nada. */
export async function probarNaturaleza(actor, tec) {
  const e = estado(actor);
  if (ocultaDe(actor) === tec.nat && !e.descubierta) {
    await guardar(actor, { descubierta: true, historial: hist(e, `Descubre su segunda naturaleza: ${NATS[tec.nat]}`) });
    aLaMesa(actor, "✦ Una segunda naturaleza", `<p>El Verbe de ${escH(actor.name)} responde a <b>${NATS[tec.nat]}</b>. Era suya y no lo sabía.</p>`, { soloDueno: true });
    await asegurarRasgos(actor);
    return true;
  }
  await guardar(actor, { probadas: [...new Set([...(e.probadas ?? []), tec.nat])] });
  aLaMesa(actor, "El Verbe no responde", `<p>${escH(actor.name)} intenta ${escH(tec.n)}: su Verbe no reacciona a ${NATS[tec.nat]}. No gastó Trazos.</p>`, { soloDueno: true });
  return false;
}

const esDerivada = (actor, id) => !!tecnicaPorId(id, actor)?.base;
export function cultivar(actor, ...args) { return serializarActor(actor, () => cultivarInterno(actor, ...args)); }
async function cultivarInterno(actor, tecId, mejora, infusionFija = null) {
  const base = tecnicaPorId(tecId, actor);
  if (!base || !conoce(actor, tecId)) return rechazar("Primero debe aprender esa técnica.", "warn");
  if (![...Object.keys(MEJORAS), "infusion"].includes(mejora)) return rechazar("La mejora no es válida.", "warn");
  if (mejora === "infusion" && (!INFUNDIBLES.has(base.sec) || (!natsDe(actor).has(infusionFija) && !combosDe(actor).has(infusionFija)))) return rechazar("No puede fijar esa infusión en esta técnica.", "warn");
  const e = estado(actor);
  const cul = foundry.utils.deepClone(e.cultivos?.[tecId] ?? { nivel: 0, mejoras: [] });
  const gratis = Number(cul.pendiente) > 0;
  if (cul.nivel >= 3 && !gratis) return rechazar("Ya es Propia.");
  const cultivadas = Object.entries(e.cultivos ?? {}).filter(([id, c]) => c.nivel > 0 && !esDerivada(actor, id)).length;
  if (cul.nivel === 0 && !esDerivada(actor, tecId) && cultivadas >= competencia(actor)) return rechazar(`Cultiva tantas técnicas como su competencia (${competencia(actor)}).`, "warn");
  if (mejora === "rapida" && cul.mejoras.includes("rapida")) return rechazar("La mejora de tiempo va una sola vez.", "warn");
  if (mejora === "infusion" && !infusionFija) return rechazar("Elige la naturaleza de la infusión fija.", "warn");
  const costo = gratis ? 0 : cul.nivel + 1;
  const { libres } = trazos(actor);
  if (libres < costo) return rechazar(`Cuesta ${costo} Trazos y tiene ${libres}.`, "warn");
  if (gratis) cul.pendiente -= 1;
  else cul.nivel += 1;
  cul.mejoras.push(mejora);
  if (mejora === "infusion") cul.infusionFija = infusionFija;
  const tec = tecnicaPorId(tecId, actor);
  const dias = Math.max(0.5, tec?.g || 0.5) * cul.nivel;
  const texto = `Cultiva ${tec?.n ?? tecId}: ${NIVEL_CULTIVO[cul.nivel]}, ${MEJORAS[mejora] ?? `infusión fija (${nombreNat(infusionFija)})`}${costo ? ` (${costo} Trazos, ${dias} días)` : ""}`;
  await guardar(actor, { cultivos: { [tecId]: cul }, gastados: (Number(e.gastados) || 0) + costo, historial: hist(e, texto),
    compras: compra(e, "cultivo", { tecId, nivel: cul.nivel, mejora, gratis }, costo, texto) });
  await refrescar(actor);
  aLaMesa(actor, "Cultivo", `<p>${escH(actor.name)} cultiva <b>${escH(tec?.n ?? tecId)}</b>: ${NIVEL_CULTIVO[cul.nivel]}${costo ? `. El DM debe haber resuelto ${dias} día${dias === 1 ? "" : "s"} de entrenamiento; el panel no adelanta el calendario` : ""}.</p>`, { soloDueno: true });
}

export async function infundir(actor, tecId, nat) {
  const tec = tecnicaPorId(tecId, actor);
  if (!editarActor(actor) || !tec || !conoce(actor, tecId) || !INFUNDIBLES.has(tec.sec)) return false;
  if (nat && !natsDe(actor).has(nat) && !combosDe(actor).has(nat)) return rechazar("No tiene esa naturaleza.", "warn");
  await actor.update(nat ? { [`flags.${MOD}.${F}.infusiones.${tecId}`]: nat } : { [`flags.${MOD}.${F}.infusiones.-=${tecId}`]: null });
  await refrescar(actor);
}

/** Monedas Antiguas: recuperar Verbe o volverlas Trazos (como mucho 2 por nivel). */
export function gastarMoneda(actor, ...args) { return serializarActor(actor, () => gastarMonedaInterno(actor, ...args)); }
async function gastarMonedaInterno(actor, uso) {
  const n = Number(actor.system?.currency?.soul) || 0;
  if (n < 1) return rechazar("No tiene Monedas Antiguas.", "warn");
  const e = estado(actor);
  if (uso === "trazo") {
    const nivel = nivelDe(actor);
    const ya = Number(e.monedas?.[nivel]) || 0;
    if (ya >= 2) return rechazar("En este nivel ya volvió Trazos 2 Monedas.", "warn");
    await guardar(actor, { trazosExtra: (Number(e.trazosExtra) || 0) + 1, monedas: { [nivel]: ya + 1 }, historial: hist(e, "Una Moneda Antigua se vuelve 1 Trazo"),
      compras: compra(e, "moneda", { nivel }, 0, "Una Moneda Antigua se vuelve 1 Trazo") }, { "system.currency.soul": n - 1 });
    return aLaMesa(actor, "Moneda Antigua", `<p>${escH(actor.name)} vuelve Trazo una Moneda Antigua.</p>`, { soloDueno: true });
  }
  const max = maxVerbe(actor);
  const mult = efectosDotes(actor).reduce((t, ef) => Math.max(t, Number(ef.moneda) || 0), 2);
  const cambios = cambiosRecuperacion(actor, mult * competencia(actor));
  const { valor } = cambios;
  await guardar(actor, { ...cambios, historial: hist(e, `Una Moneda Antigua aporta ${mult * competencia(actor)} de recuperación de Verbe`) }, { "system.currency.soul": n - 1 });
  aLaMesa(actor, "Moneda Antigua", `<p>${escH(actor.name)} gasta una Moneda Antigua: Verbe <b>${valor} / ${max}</b>.</p>`, { soloDueno: true });
}

/* ------------------------------------------------------------------ */
/*  Crear técnicas, variantes y evoluciones (el DM las aprueba)       */
/* ------------------------------------------------------------------ */

const TIEMPO_ACT = { A: ["action", 1], AA: ["bonus", 1], R: ["reaction", 1], "1 min": ["minute", 1], "10 min": ["minute", 10] };
const DUR = { "inst.": ["inst", null], "1 asalto": ["round", 1], "1 min": ["minute", 1], "10 min": ["minute", 10], "1 h": ["hour", 1] };
const SALV = { FUE: "str", DES: "dex", CON: "con", INT: "int", SAB: "wis", CAR: "cha" };
const DANO = { fuerza: "force", fuego: "fire", frío: "cold", relámpago: "lightning", trueno: "thunder", contundente: "bludgeoning",
  cortante: "slashing", perforante: "piercing", psíquico: "psychic", radiante: "radiant", necrótico: "necrotic", veneno: "poison", ácido: "acid" };
const ESCUELA = { forma: "vfo", velo: "vve", cuerpo: "vcu", mirada: "vmi", sello: "vse", pacto: "vpa", pulso: "vpu", hilo: "vhi",
  quietud: "vqu", rastro: "vra", sangre: "vsa" };

/** Grado máximo que puede crear en una rama: su máximo menos uno; Maestro o Legendario, su máximo. */
export const gradoCrear = (actor, rama) => Math.max(0, Math.min(gradoMax(actor), rangoGrado(rangoDe(actor, rama)) - (rangoDe(actor, rama) >= 3 ? 0 : 1)));

/** Daño que propone el presupuesto: { n, d }. */
export function presupuesto(f) {
  return presupuestoTecnica(f, D.presupuesto, ESTADO_NAT[f.nat]?.length ?? 0);
}

export function validarFormularioTecnica(actor, f) {
  const duros = [];
  if (typeof f.nombre !== "string" || !f.nombre.trim() || f.nombre.length > 100
    || typeof f.efecto !== "string" || f.efecto.length > 4000) duros.push("Nombre o descripción no válidos.");
  if (!["yo", "toque"].includes(f.alcance) && (!Number.isFinite(Number(f.alcance)) || Number(f.alcance) <= 0)) duros.push("El alcance debe ser una distancia positiva.");
  if (f.areaTipo && f.areaTipo !== "ninguna" && (!Object.hasOwn(LIMITES_CREACION[0], f.areaTipo)
    || f.areaTipo === "alcance" || !Number.isFinite(Number(f.areaTam)) || Number(f.areaTam) <= 0)) duros.push("El área no es válida.");
  if (!Number.isInteger(Number(f.estados)) || Number(f.estados) < 0 || Number(f.estados) > 3) duros.push("La cantidad de estados no es válida.");
  const rama = D.ramas.find(r => r.id === f.rama);
  if (!rama || !ramaAbierta(actor, f.rama) || rangoDe(actor, f.rama) < 1 || f.rama === "sangre") duros.push("La rama no está disponible para crear técnicas.");
  if (f.nat && !natsDe(actor).has(f.nat) && !combosDe(actor).has(f.nat)) duros.push("No domina esa naturaleza o combinación.");
  if (!TIEMPO_ACT[f.tiempo] || !DUR[f.duracion || "inst."] || !DANO[f.tipoDano]) duros.push("Tiempo, duración o daño no válidos.");
  if (!["ninguna", "ataque", ...Object.keys(SALV)].includes(f.tirada)) duros.push("La tirada no es válida.");
  let max = gradoCrear(actor, f.rama);
  if (f.modo) {
    const base = tecnicaPorId(f.base, actor);
    const nivel = Number(estado(actor)?.cultivos?.[f.base]?.nivel) || 0;
    if (!base || !conoce(actor, f.base) || base.rama !== f.rama || nivel < (f.modo === "evolucion" ? 3 : 2)) duros.push("La técnica base no tiene el cultivo necesario.");
    if (!["variante", "evolucion"].includes(f.modo)) duros.push("El tipo de creación no es válido.");
    max = Math.min(gradoUsable(actor, { rama: f.rama, g: 0 }), (base?.g ?? 0) + (f.modo === "evolucion" ? 3 : 2));
    if (Number(f.grado) < (base?.g ?? 0) + (f.modo === "evolucion" ? 1 : 0)) duros.push("El grado no corresponde a esa variante o evolución.");
  }
  if (!Number.isInteger(Number(f.grado)) || Number(f.grado) < 0 || Number(f.grado) > max) duros.push(`Puede crear hasta grado ${max}.`);
  if (!Number.isInteger(Number(f.dadosN)) || Number(f.dadosN) < 0 || Number(f.dadosN) > 100
    || ![4, 6, 8, 10, 12].includes(Number(f.dadosD))) duros.push("Los dados introducidos no son válidos.");
  if (f.firmada && !f.modo && !tieneDote(actor, "tecnica-firmada")) duros.push("Firmarla pide Técnica firmada.");
  const propuesta = presupuesto(f);
  const balance = validarCreacion(f, { propuesta, maxGrado: max });
  return { ok: !duros.length && balance.ok, duros: [...new Set(duros)], excesos: balance.errores, propuesta };
}

/** Arma una técnica nueva (formato del catálogo) a partir del formulario. */
export function tecnicaNueva(actor, f) {
  const id = `propia-${foundry.utils.randomID(8)}`;
  const g = Math.clamp(Number(f.grado) || 0, 0, GRADO_TOPE);
  const [at, av] = TIEMPO_ACT[f.tiempo] ?? ["action", 1];
  const [du, dv] = DUR[f.duracion || "inst."] ?? ["inst", null];
  const props = [];
  if (f.voz) props.push("vocal");
  if (f.gestos) props.push("somatic");
  if (f.conc) props.push("concentration");
  const aid = foundry.utils.randomID();
  const partes = [];
  if (Number(f.dadosN) > 0) partes.push({ number: Number(f.dadosN), denomination: Number(f.dadosD) || 6, bonus: "", types: [DANO[f.tipoDano] ?? "force"],
    custom: { enabled: false, formula: "" }, scaling: { mode: "whole", number: 1, formula: "" } });
  const act = { _id: aid, sort: 0, name: "", activation: { override: false }, duration: { override: false }, range: { override: false },
    target: { override: false, prompt: true }, effects: [], uses: { spent: 0, recovery: [] }, description: { chatFlavor: "" },
    consumption: { targets: [], scaling: { allowed: g > 0, max: "" }, spellSlot: false } };
  if (f.tirada === "ataque") Object.assign(act, { type: "attack", attack: { ability: "", bonus: "", critical: { threshold: null }, flat: false,
    type: { value: (f.alcance === "toque") ? "melee" : "ranged", classification: "spell" } }, damage: { critical: { bonus: "" }, includeBase: false, parts: partes } });
  else if (SALV[f.tirada]) Object.assign(act, { type: "save", save: { ability: [SALV[f.tirada]], dc: { calculation: "spellcasting", formula: "" } },
    damage: { onSave: f.mitad ? "half" : "none", parts: partes } });
  else if (partes.length) Object.assign(act, { type: "damage", damage: { critical: { allow: false }, parts: partes } });
  else Object.assign(act, { type: "utility", roll: { formula: "", name: "", prompt: false, visible: false } });
  const nat = f.nat || null;
  const rango = f.alcance === "yo" ? { units: "self" } : f.alcance === "toque" ? { units: "touch" } : { units: "m", value: Number(f.alcance) || 9 };
  const tplTipo = { cono: "cone", esfera: "sphere", cubo: "cube", línea: "line", cilindro: "cylinder" }[f.areaTipo];
  const efs = [];
  for (const st of (nat && partes.length && g >= 1) ? (ESTADO_NAT[nat] ?? []) : []) {
    const eid = foundry.utils.randomID();
    efs.push(efectoEstado(st, eid));
    act.effects.push({ _id: eid, onSave: false });
  }
  const combo = !!D.combos?.[nat];
  const sec = f.rama === "forma" ? (nat ? (combo ? "combo" : nat) : "pura") : f.rama;
  const texto = String(f.efecto ?? "").trim();
  const base = f.base ? tecnicaPorId(f.base, actor) : null;
  const origen = f.modo === "variante" ? `variante de ${base?.n}` : f.modo === "evolucion" ? `evolución de ${base?.n}` : "técnica propia";
  const trazosN = f.modo === "variante" ? Math.max(1, g) : f.modo === "evolucion" ? Math.max(1, g + (combo ? 1 : 0)) : g + 1 + (combo ? 1 : 0);
  const meta = { id, rama: f.rama, sec, g, nat, rara: combo, req: null, incl: false, grupo: null, sube: "+1d", veces: 1,
    ...(f.excepcionDM ? { excepcionBalance: { motivo: String(f.motivoExcepcion || "Aprobada por el DM").slice(0, 500),
      aprobadaPor: game.user.id } } : {}),
    usa: { cuerpo: "fisica", hilo: "fisica", quietud: "wis", rastro: "wis" }[f.rama] ?? "verbe", propia: true, autor: actor.id };
  const item = {
    name: f.nombre || "Técnica sin nombre", type: "spell", img: base?.item?.img ?? "systems/dnd5e/icons/svg/items/spell.svg", effects: efs,
    system: {
      description: { value: `<p><em>Grado ${g} · ${nombreRama(f.rama)}${nat ? ` · ${nombreNat(nat)}` : ""} · ${escH(origen)}, de ${escH(actor.name)}</em></p><p>${escH(texto)}</p>`, chat: "" },
      level: g, school: ESCUELA[f.rama] ?? "vfo", method: "verbe", prepared: 2, activation: { type: at, value: av, condition: "" },
      duration: { units: du, value: dv }, range: rango, properties: props,
      target: tplTipo ? { template: { type: tplTipo, size: Number(f.areaTam) || 3, units: "m" }, affects: {} } : { affects: { count: "1", type: "creature" }, template: {} },
      uses: g >= 6 ? { max: "1", spent: 0, recovery: [{ period: "lr", type: "recoverAll" }] } : { max: "", spent: 0, recovery: [] },
      activities: { [aid]: act }, identifier: id, source: { custom: "El Verbe · técnica propia" }
    },
    flags: { [MOD]: { [F]: meta } }
  };
  const alc = f.alcance === "yo" ? "yo" : f.alcance === "toque" ? "toque" : `${f.alcance} m`;
  const uso = [f.tiempo, alc, tplTipo ? `${f.areaTipo} ${f.areaTam} m` : null, f.duracion].filter(Boolean).join(" · ");
  return { id, n: item.name, rama: f.rama, sec, g, nat, rara: combo, req: null, incl: false, grupo: null, trazos: trazosN, costo: costoGrado(g),
    texto, uso, item, propia: true, autor: actor.id, base: f.base || null, modo: f.modo || null, firmada: !!f.firmada };
}

function crearAprobada(actor, ...args) { return enSerie("catalogo", () => crearAprobadaInterno(actor, ...args)); }
async function crearAprobadaInterno(actor, d) {
  if (!game.user.isGM) return false;
  const revision = validarFormularioTecnica(actor, d);
  if (revision.duros.length) { aviso(revision.duros.join(" "), "warn"); return false; }
  if (!revision.ok && (!d.excepcionDM || !String(d.motivoExcepcion ?? "").trim())) {
    aviso(`Fuera del presupuesto: ${revision.excesos.join(" ")} El DM debe confirmar una excepción y su motivo.`, "warn");
    return false;
  }
  const tec = tecnicaNueva(actor, d);
  const req = requisitos(actor, tec);
  if (!req.ok || req.probar) { aviso(req.motivo ?? "No domina su naturaleza.", "warn"); return false; }
  if (tec.firmada || tec.modo) await guardar(actor, { propias: [...(estado(actor).propias ?? []), tec] });
  else await game.settings.set(MOD, AJ.extra, [...extraMundo(), tec]);
  const retirar = async () => {
    if (tec.firmada || tec.modo) await guardar(actor, { propias: (estado(actor).propias ?? []).filter(x => x.id !== tec.id) });
    else await game.settings.set(MOD, AJ.extra, extraMundo().filter(x => x.id !== tec.id));
  };
  try {
    const aprendida = await aprender(actor, tec, { nota: tec.modo ?? "creada", aprobado: true });
    if (aprendida !== true) { await retirar(); return false; }
  } catch (error) {
    await retirar();
    throw error;
  }
  if (tec.modo === "evolucion") await guardar(actor, { cultivos: { [tec.id]: { nivel: 1, mejoras: [], pendiente: 1 } } });
  const dias = Math.max(0.5, tec.g) * (tec.modo === "variante" ? 0.5 : 1);
  aLaMesa(actor, "✦ Técnica nueva", `<p>${escH(actor.name)} aprende <b>${escH(tec.n)}</b> (grado ${tec.g}). El DM confirma ${dias} día${dias === 1 ? "" : "s"} de entrenamiento${tec.modo ? "" : ` y ${Math.max(1, tec.g) * 25} o de materiales`} resueltos en la mesa. El panel no descuenta ese oro ni adelanta el calendario.${tec.modo === "evolucion" ? " Nace Pulida: elige su mejora en Cultivo." : ""}</p>`, { soloDueno: true });
  return true;
}

export async function dialogoCrear(actor, { base = null, modo = null } = {}) {
  const tb = base ? tecnicaPorId(base, actor) : null;
  const ramas = tb ? D.ramas.filter(r => r.id === tb.rama) : D.ramas.filter(r => rangoDe(actor, r.id) >= 1 && ramaAbierta(actor, r.id) && r.id !== "sangre");
  if (!ramas.length) return rechazar("Crear técnicas pide Entrenado en una rama.", "warn");
  const gs = modo === "variante" ? [tb.g, tb.g + 1, tb.g + 2].filter(g => g <= gradoMax(actor))
    : modo === "evolucion" ? [tb.g + 1, tb.g + 2, tb.g + 3].filter(g => g <= gradoMax(actor))
      : [...Array(Math.max(...ramas.map(r => gradoCrear(actor, r.id))) + 1).keys()];
  if (!gs.length) return rechazar("Todavía no le alcanza el nivel para un grado más.", "warn");
  const nats = [...natsDe(actor)].map(n => [n, NATS[n]]);
  const combos = [...combosDe(actor)].map(c => [c, nombreNat(c)]);
  const act0 = tb ? Object.values(tb.item.system.activities)[0] : null;
  const p0 = act0?.damage?.parts?.[0];
  const tir0 = act0?.type === "attack" ? "ataque" : act0?.type === "save" ? Object.entries(SALV).find(([, v]) => v === act0.save.ability?.[0])?.[0] : "ninguna";
  const { DialogV2 } = foundry.applications.api;
  const titulo = modo === "variante" ? "Variante" : modo === "evolucion" ? "Evolución" : "Crear técnica";
  const html = `<div class="ecos-verbe-form">
    ${tb ? `<p>${titulo} de <b>${escH(tb.n)}</b>. ${modo === "variante" ? "Mismo grado, o uno o dos más si crece. Cuesta su grado en Trazos y medio entrenamiento." : "Hasta tres grados más, con un dado más que el presupuesto. Cuesta 1 Trazo menos y nace Pulida."}</p>` : ""}
    <label>Nombre <input name="nombre" required maxlength="100" value="${tb ? escH(`${tb.n} · `) : ""}"></label>
    <label>Rama <select name="rama">${opciones(ramas.map(r => [r.id, `${r.nombre} (${nombreRango(rangoDe(actor, r.id))}, hasta grado ${gradoCrear(actor, r.id)})`]), tb?.rama)}</select></label>
    <label>Naturaleza <select name="nat"><option value="">Ninguna</option>${opciones([...nats, ...combos], tb?.nat ?? "")}</select></label>
    <label>Grado <select name="grado">${opciones(gs.map(g => [g, `Grado ${g} · ${costoGrado(g)} Verbe`]), gs[0])}</select></label>
    <label>Tiempo <select name="tiempo">${opciones([["A", "Acción"], ["AA", "Acción adicional"], ["R", "Reacción"], ["1 min", "1 minuto"]], "A")}</select></label>
    <label>Alcance <select name="alcance">${opciones([["yo", "Yo"], ["toque", "Toque"], ["9", "9 m"], ["18", "18 m"], ["36", "36 m"], ["45", "45 m"], ["90", "90 m"], ["150", "150 m"], ["1500", "1,5 km"]], "18")}</select></label>
    <label>Área <select name="areaTipo">${opciones([["ninguna", "Un blanco"], ["cono", "Cono"], ["esfera", "Esfera"], ["cubo", "Cubo"], ["línea", "Línea"], ["cilindro", "Cilindro"]], "ninguna")}</select> <input type="number" name="areaTam" step="1.5" min="1.5" value="4.5"> m</label>
    <label>Duración <select name="duracion">${opciones([["inst.", "Instantánea"], ["1 asalto", "1 asalto"], ["1 min", "1 minuto"], ["10 min", "10 minutos"], ["1 h", "1 hora"]], "inst.")}</select> <input type="checkbox" name="conc"> Concentración</label>
    <label><input type="checkbox" name="persistente"> El daño se repite durante la duración <small>(reduce el daño propuesto; la descripción debe indicar cuándo se repite)</small></label>
    <label>Componentes <input type="checkbox" name="gestos" checked> Gestos <input type="checkbox" name="voz"> Voz</label>
    <label>Tirada <select name="tirada">${opciones([["ninguna", "Ninguna (no falla: la mitad del daño)"], ["ataque", "Ataque"], ...Object.keys(SALV).map(k => [k, `Salvación de ${k}`])], tir0 ?? "ninguna")}</select> <input type="checkbox" name="mitad"> mitad si la supera</label>
    <label>Estados que deja <input type="number" name="estados" min="0" max="3" value="0"> <small>cada uno le quita un cuarto del daño</small></label>
    <label>Daño <input type="number" name="dadosN" min="0" value="${p0?.number ?? 2}" style="width:4em">d<input type="number" name="dadosD" min="4" max="12" step="2" value="${p0?.denomination ?? 10}" style="width:4em">
      <select name="tipoDano">${opciones(Object.keys(DANO).map(k => [k, k]), Object.entries(DANO).find(([, v]) => v === p0?.types?.[0])?.[0] ?? "fuerza")}</select>
      <button type="button" class="ecos-verbe-proponer">Proponer</button></label>
    <label>Qué hace <textarea name="efecto" rows="3" maxlength="4000" placeholder="Qué pasa si falla, qué estado deja, cuánto dura">${escH(tb?.texto ?? "")}</textarea></label>
    ${game.user.isGM ? '<label><input type="checkbox" name="excepcionDM"> Aprobar una excepción al presupuesto</label><label>Motivo de la excepción <input name="motivoExcepcion" maxlength="500"></label>' : ''}
    <label><input type="checkbox" name="firmada" ${tieneDote(actor, "tecnica-firmada") || modo ? "" : "disabled"} ${modo ? "checked disabled" : ""}> Firmada: solo para ${escH(actor.name)} <small>${modo ? "(las variantes y evoluciones siempre)" : "(pide la dote Técnica firmada)"}</small></label>
    <p class="ecos-nota">Tiene ${trazos(actor).libres} Trazos. Una creada cuesta grado + 1 (+1 si es combinada). El DM debe resolver el entrenamiento y los materiales antes de aprobar: el panel solo cobra los Trazos.</p>
  </div>`;
  const r = await DialogV2.wait({
    window: { title: `${titulo} · ${actor.name}`, icon: "fa-solid fa-pen-nib" },
    position: { width: 580 },
    content: html,
    render: (ev, dlg) => {
      const raiz = dlg?.element ?? ev?.target?.element;
      const f = raiz?.querySelector("form") ?? raiz;
      const val = k => f?.querySelector(`[name=${k}]`)?.value;
      raiz?.querySelector(".ecos-verbe-proponer")?.addEventListener("click", () => {
        const p = presupuesto({ grado: val("grado"), rama: val("rama"), nat: val("nat"), tiempo: val("tiempo"), areaTipo: val("areaTipo"), estados: val("estados"),
          tirada: val("tirada"), alcance: val("alcance"), persistente: !!f.querySelector('[name=persistente]')?.checked, modo });
        f.querySelector("[name=dadosN]").value = p.n;
        f.querySelector("[name=dadosD]").value = p.d;
      });
    },
    buttons: [{ action: "ok", label: game.user.isGM ? "Crear" : "Mandar al DM", default: true,
      callback: (ev, btn) => new foundry.applications.ux.FormDataExtended(btn.form).object },
    { action: "no", label: "Cancelar" }],
    rejectClose: false
  });
  if (!r || r === "no") return;
  const g = Number(r.grado) || 0;
  if (!modo && g > gradoCrear(actor, r.rama)) return rechazar(`En ${nombreRama(r.rama)} crea hasta el grado ${gradoCrear(actor, r.rama)}.`, "warn");
  const datos = { ...r, rama: r.rama || tb?.rama, grado: g, base, modo, firmada: modo ? true : !!r.firmada };
  const revision = validarFormularioTecnica(actor, datos);
  if (revision.duros.length) return rechazar(revision.duros.join(" "), "warn");
  const costo = tecnicaNueva(actor, datos).trazos;
  if (trazos(actor).libres < costo) return rechazar(`Cuesta ${costo} Trazos y tiene ${trazos(actor).libres}.`, "warn");
  if (game.user.isGM) return crearAprobada(actor, datos);
  const resumen = `<b>${escH(r.nombre)}</b> · grado ${g} · ${nombreRama(datos.rama)}${r.nat ? ` · ${nombreNat(r.nat)}` : ""} · ${escH(r.tirada)} · ${r.dadosN}d${r.dadosD} ${escH(r.tipoDano)} · ${costo} Trazos<br>${escH(r.efecto)}`;
  return pedirAlDM(actor, "crear", datos, `${titulo.toLowerCase()}: ${r.nombre}`, resumen);
}

/* ------------------------------------------------------------------ */
/*  Miradas, Cerrojos, choques y herramientas del DM                  */
/* ------------------------------------------------------------------ */

export async function despertarOjo(actor, ojo, etapa, trasplante = false) {
  if (!game.user.isGM) return false;
  const e = estado(actor);
  const m = D.miradas.find(x => x.id === ojo);
  const antes = Number(e.miradas?.[ojo]) || 0;
  if (etapa <= antes) return rechazar(`Ya tiene ese ojo en la etapa ${antes}.`);
  const costo = (m?.trazos ?? [3, 5, 8]).slice(antes, etapa).reduce((t, n) => t + n, 0);
  const texto = `${m?.nombre ?? ojo}: etapa ${etapa} (${costo} Trazos)`;
  await guardar(actor, { miradas: { [ojo]: etapa }, trasplantes: trasplante ? [...new Set([...(e.trasplantes ?? []), ojo])] : (e.trasplantes ?? []),
    gastados: (Number(e.gastados) || 0) + costo, historial: hist(e, texto), compras: compra(e, "ojo", { ojo, antes, etapa }, costo, texto) });
  for (const t of D.tecnicas.filter(x => x.rama === "mirada" && x.id.startsWith(`mirada-${ojo}-`))) {
    const n = Number(String(t.req ?? "").match(/etapa (\d)/)?.[1]) || 1;
    if (n <= etapa && !conoce(actor, t.id)) await aprender(actor, t, { gratis: true, nota: "con la Mirada" });
  }
  const libres = trazos(actor).libres;
  await susurrarDM(`${escH(actor.name)}: ${escH(m?.nombre ?? ojo)}`, `<p>Etapa ${etapa}. Pagó ${costo} Trazos${libres < 0 ? ` y queda debiendo ${-libres} (los paga con los próximos)` : ""}.</p>`);
  aLaMesa(actor, "✦ Un ojo se abre", `<p>${escH(actor.name)}: ${escH(m?.nombre ?? ojo)}, etapa ${etapa}.</p>`, { soloDueno: true });
}

export function aprenderCerrojo(actor, ...args) { return serializarActor(actor, () => aprenderCerrojoInterno(actor, ...args)); }
async function aprenderCerrojoInterno(actor) {
  const e = estado(actor);
  const sig = (Number(e.cerrojos) || 0) + 1;
  const c = D.cerrojos.find(x => x.n === sig);
  if (!c) return rechazar("Ya sabe los siete.");
  if (c.grado > rangoGrado(rangoDe(actor, "cuerpo")) || c.grado > gradoMax(actor)) return rechazar(`El cerrojo ${sig} es de grado ${c.grado}: pide más rango de Cuerpo o más nivel.`, "warn");
  const { libres } = trazos(actor);
  if (libres < c.grado) return rechazar(`Cuesta ${c.grado} Trazos y tiene ${libres}.`, "warn");
  const texto = `Cerrojo ${sig}, ${c.nombre} (${c.grado} Trazos)`;
  await guardar(actor, { cerrojos: sig, gastados: (Number(e.gastados) || 0) + c.grado, historial: hist(e, texto), compras: compra(e, "cerrojo", { n: sig }, c.grado, texto) });
}

const escuelaDe = actor => D.escuelas.find(x => x.nombre === estado(actor)?.escuela) ?? null;
const esCerrojero = actor => /primer cerrojo sin prueba/.test(escuelaDe(actor)?.don ?? "");

export function abrirCerrojo(actor, ...args) { return serializarActor(actor, () => abrirCerrojoInterno(actor, ...args)); }
async function abrirCerrojoInterno(actor, n) {
  const e = estado(actor);
  const c = D.cerrojos.find(x => x.n === n);
  if (!c || n > (Number(e.cerrojos) || 0)) return;
  const abiertos = Number(efectoV(actor, "cerrojo")?.getFlag(MOD, F)?.cerrojo) || 0;
  const cuantos = rangoDe(actor, "cuerpo") >= 3 ? 3 : 2;
  if (n <= abiertos) return rechazar(`Ya tiene abierto hasta el cerrojo ${abiertos}.`);
  if (n > abiertos + cuantos) return rechazar(`Los Cerrojos se abren en orden: ahora puede abrir hasta el ${abiertos + cuantos} (${cuantos} más por acción adicional${cuantos === 2 ? "; 3 con Maestro en Cuerpo" : ""}).`, "warn");
  const costo = costoGrado(c.grado);
  const v = Number(e.valor) || 0;
  const permiso = evaluarGasto({ valor: v, costo, limite: limiteNegativo(actor), grado: c.grado,
    gradoMaximo: gradoMax(actor), agotamiento: Number(actor.system?.attributes?.exhaustion) || 0,
    incapacitado: noPuedeActuar(actor) });
  if (!permiso.ok) return rechazar(permiso.motivo, "warn");
  const libre = n === 1 && esCerrojero(actor);
  const sinPrueba = libre || (n === 1 && efectosDotes(actor).some(ef => ef.cerrojoLibre));
  if (!sinPrueba) {
    const dc = 10 + (2 * n);
    const rolls = await actor.rollSkill({ skill: "cvb", target: dc }, { configure: false });
    const roll = Array.isArray(rolls) ? rolls[0] : rolls;
    if (!roll || roll.total < dc) return aLaMesa(actor, "Los Cerrojos no ceden", `<p>${escH(actor.name)} no logra abrir el cerrojo ${n} (Control ${roll?.total ?? "?"} contra CD ${dc}).</p>`);
  }
  const viejo = efectoV(actor, "cerrojo");
  const paso = (actor.system?.attributes?.movement?.units === "ft") ? "10" : "3";
  const changes = [];
  for (let i = 1; i <= n; i++) for (const [key, mode, value] of CERROJO_FX[i] ?? []) changes.push({ key, mode, value: value === "@paso" ? paso : value });
  const da = D.cerrojos.filter(x => x.n <= n).map(x => `<li><b>${x.n} · ${escH(x.nombre)}:</b> ${escH(x.da)}</li>`).join("");
  const min = esCerrojero(actor) ? 2 : 1;
  const pg = libre ? 0 : (rangoDon(actor, "cuerpo") >= 4 ? Math.ceil((Number(c.pg) || 0) / 2) : Number(c.pg) || 0);
  const datos = { name: `Siete Cerrojos · ${n}`, img: "systems/dnd5e/icons/svg/abilities/strength.svg",
    changes, duration: { seconds: min * 60, rounds: min * 10, startTime: game.time.worldTime,
      startRound: game.combat?.round ?? null, startTurn: game.combat?.turn ?? null },
    description: `<ul>${da}</ul><p>Paga ${pg || "—"} PG al inicio de cada turno. Al cerrar: ${escH(c.cierre)}.</p>`,
    flags: { [MOD]: { [F]: { cerrojo: n, pg } } } };
  const anterior = viejo?.toObject();
  let nuevo;
  if (viejo) await viejo.update(datos);
  else [nuevo] = await actor.createEmbeddedDocuments("ActiveEffect", [datos]);
  try {
    await guardar(actor, { valor: permiso.despues, ...(!abiertos ? { cerrojosHoy: {
      ciclo: Number(e.cerrojosHoy?.ciclo) || 0, veces: (Number(e.cerrojosHoy?.veces) || 0) + 1 } } : {}) });
  } catch (error) {
    if (viejo) await viejo.update(anterior);
    else await nuevo?.delete({ ecosSinCierre: true });
    throw error;
  }
  if (permiso.sobreesfuerzo) await sobreesfuerzo(actor, c.grado, permiso.despues);
  aLaMesa(actor, "✦ Siete Cerrojos", `<p>${escH(actor.name)} abre hasta el cerrojo ${n}, ${escH(c.nombre)}${pg ? `: paga ${pg} PG por turno` : ""}.</p>`);
}

/** Al cerrar los Cerrojos o terminar el Despertar (lo hace el DM, una sola vez). */
async function alQuitarEfecto(ef, opciones) {
  if (!soyGM() || opciones?.ecosSinCierre) return;
  const actor = ef.parent;
  if (!(actor instanceof Actor)) return;
  const fl = ef.getFlag(MOD, F);
  if (fl?.cerrojo) {
    const c = D.cerrojos.find(x => x.n === fl.cerrojo);
    if (fl.cerrojo === 7) {
      const cd7 = rangoDon(actor, "cuerpo") >= 5 ? 10 : (rangoDon(actor, "cuerpo") >= 4 ? 15 : 20);
      const rolls = await actor.rollSavingThrow({ ability: "con", target: cd7 }, { configure: false });
      const roll = Array.isArray(rolls) ? rolls[0] : rolls;
      if (roll && roll.total >= cd7) {
        await actor.update({ "system.attributes.hp.value": 0, "system.attributes.exhaustion": Math.max(4, Number(actor.system.attributes.exhaustion) || 0) });
        aLaMesa(actor, "Se cierra el séptimo", `<p>${escH(actor.name)} sobrevive: cae a 0 PG con 4 de Agotamiento.</p>`);
      } else {
        await actor.update({ "system.attributes.hp.value": 0 });
        await susurrarDM("El séptimo cerrojo", `<p>${escH(actor.name)} falla la salvación (${roll?.total ?? "?"} contra ${cd7}): según la regla, muere. Lo dejé a 0 PG; la muerte la marcas tú.</p>`);
      }
      return;
    }
    const repetido = (Number(estado(actor)?.cerrojosHoy?.veces) || 0) >= 2;
    const ag = (Number(String(c?.cierre ?? "").match(/(\d+) Agotamiento/)?.[1]) || 0) + (repetido ? 1 : 0);
    if (ag) {
      const v = Math.min(6, (Number(actor.system.attributes.exhaustion) || 0) + ag);
      await actor.update({ "system.attributes.exhaustion": v });
      aLaMesa(actor, "Se cierran los Cerrojos", `<p>${escH(actor.name)}: +${ag} Agotamiento (${v}).</p>`);
    }
  } else if (fl?.despertar) {
    const e = estado(actor);
    if (rangoDon(actor, "sangre") >= 4 && !e?.despertarLibre) await guardar(actor, { despertarLibre: true });
    else {
      const v = Math.min(6, (Number(actor.system.attributes.exhaustion) || 0) + 1);
      await actor.update({ "system.attributes.exhaustion": v });
      aLaMesa(actor, "Termina el Despertar", `<p>${escH(actor.name)} vuelve a su forma: +1 Agotamiento (${v}).</p>`);
    }
    if (herenciaDe(actor)?.barrera) await manejar({ accion: "capaVReloj", actorId: actor.id }, { interno: true });
  }
}

/** Inicio de turno: efectos vencidos, Cerrojos (PG), Ardiendo y Verbe por turno del Despertar. */
async function inicioDeTurno(combat) {
  const actor = combat?.combatant?.actor;
  if (!actor) return;
  if (despierto(actor) && estado(actor).reaccionUsada) await guardar(actor, { reaccionUsada: false });
  for (const ef of actor.effects.filter(x => { const fl = x.getFlag(MOD, F);
    return fl && !fl.herencia && !fl.dotesAE && (Number(x.duration?.seconds) > 0 || Number(x.duration?.rounds) > 0); })) {
    const r = ef.duration?.remaining;
    if (Number.isFinite(r) && r <= 0) await ef.delete();
  }
  const cerr = efectoV(actor, "cerrojo");
  const pg = Number(cerr?.getFlag(MOD, F)?.pg) || 0;
  if (cerr && pg) {
    await actor.update({ "system.attributes.hp.value": Math.max(0, actor.system.attributes.hp.value - pg) });
    aLaMesa(actor, "Siete Cerrojos", `<p>${escH(actor.name)} paga ${pg} PG por los Cerrojos abiertos.</p>`);
  }
  if (actor.statuses?.has("ardiendo")) {
    const roll = await new Roll("1d6").evaluate();
    await actor.applyDamage([{ value: roll.total, type: "fire" }]);
    await roll.toMessage({ speaker: ChatMessage.getSpeaker({ actor }), flavor: `${escH(actor.name)} arde: ${roll.total} de fuego` });
  }
  const regen = efectoV(actor, "despertar") ? herenciaDe(actor)?.despertar?.regen : null;
  if (regen && despierto(actor)) {
    const roll = await new Roll(regen).evaluate();
    const valor = await recuperarVerbe(actor, roll.total);
    aLaMesa(actor, "Verbe", `<p>${escH(actor.name)} recupera ${roll.total} de Verbe (${valor}).</p>`, { soloDueno: true });
  }
}

/** Choque de técnicas: gana la que vence en el ciclo; si no se tocan, el grado; si empatan, Control contra Control. */
export function ganaCiclo(a, b) {
  const A = deNats(a);
  const B = deNats(b);
  const aGana = A.some(x => B.some(y => D.ciclo[x] === y));
  const bGana = B.some(y => A.some(x => D.ciclo[y] === x));
  if (aGana && !bGana) return 1;
  if (bGana && !aGana) return -1;
  return 0;
}
/** Ventaja en Control en los choques: la dote, o una Mirada cuya etapa lo diga. */
const ventajaChoque = actor => !!actor && (tieneDote(actor, "choque-perfecto")
  || Object.entries(estado(actor)?.miradas ?? {}).some(([ojo, n]) => (D.miradas.find(m => m.id === ojo)?.etapas ?? []).slice(0, Number(n)).some(t => /choques/.test(t))));

export async function dialogoChoque() {
  if (!game.user.isGM) return;
  const tecs = game.actors.filter(a => despierto(a)).flatMap(a => itemsTecnica(a).map(i => [`${a.id}|${i.id}`, `${a.name} · ${i.name}`]));
  const nats = [...Object.entries(NATS), ...Object.entries(D.combos).map(([k, v]) => [k, v.nombre])];
  const lado = k => `<fieldset><legend>${k}</legend>
    <label>Técnica <select name="t${k}"><option value="">Otra (abajo)</option>${opciones(tecs, "")}</select></label>
    <label>Naturaleza <select name="n${k}"><option value="">Ninguna</option>${opciones(nats, "")}</select> <small>si es otra</small></label>
    <label>Grado usado <input type="number" name="g${k}" min="0" max="${GRADO_TOPE}" placeholder="el suyo"></label></fieldset>`;
  const { DialogV2 } = foundry.applications.api;
  const r = await DialogV2.wait({
    window: { title: "Choque de técnicas", icon: "fa-solid fa-burst" },
    content: `<div class="ecos-verbe-form">${lado("A")}${lado("B")}</div>`,
    buttons: [{ action: "ok", label: "Resolver", default: true, callback: (ev, btn) => new foundry.applications.ux.FormDataExtended(btn.form).object },
      { action: "no", label: "Cancelar" }],
    rejectClose: false
  });
  if (!r || r === "no") return;
  const leer = k => {
    const [aid, iid] = String(r[`t${k}`] || "").split("|");
    const actor = aid ? game.actors.get(aid) : null;
    const it = actor?.items.get(iid);
    const meta = it?.getFlag(MOD, F);
    const crudo = r[`g${k}`];
    const g = (crudo !== "" && crudo !== null && crudo !== undefined) ? Number(crudo) : (meta?.g ?? 0);
    return { actor, nombre: it ? `${actor.name} · ${it.name}` : `Técnica ${k}`, nat: meta ? (meta.infusion || meta.nat) : (r[`n${k}`] || null), g };
  };
  return resolverChoque(leer("A"), leer("B"));
}

export async function resolverChoque(A, B) {
  const L = [`<b>${escH(A.nombre)}</b> (${nombreNat(A.nat) || "sin naturaleza"}, grado ${A.g}) contra <b>${escH(B.nombre)}</b> (${nombreNat(B.nat) || "sin naturaleza"}, grado ${B.g}).`];
  const ciclo = ganaCiclo(A.nat, B.nat);
  const modo = ajuste("verbeChoques", "potencia");
  const resultado = resultadoChoque(A.g, B.g, ciclo, modo);
  let gana = resultado.gana;
  if (modo === "clasico" && ciclo) L.push(`El ciclo clásico decide: ${nombreNat(ciclo > 0 ? A.nat : B.nat)} vence a ${nombreNat(ciclo > 0 ? B.nat : A.nat)}.`);
  else if (gana) L.push(`Gana la potencia efectiva${ciclo ? " (el elemento favorable aporta 2 grados)" : ""}.`);
  if (!gana) {
    const tirar = async x => {
      if (x.actor && despierto(x.actor)) {
        const rolls = await x.actor.rollSkill({ skill: "cvb", advantage: ventajaChoque(x.actor) }, { configure: false }, { create: false });
        return (Array.isArray(rolls) ? rolls[0] : rolls)?.total ?? 0;
      }
      return (await new Roll("1d20").evaluate()).total;
    };
    const ta = await tirar(A);
    const tb = await tirar(B);
    gana = ta === tb ? 0 : (ta > tb ? 1 : -1);
    L.push(`Potencia efectiva igualada: Control ${ta} contra ${tb}.`);
  }
  L.push(gana ? `<b>Gana ${escH(gana > 0 ? A.nombre : B.nombre)}</b>: la otra se deshace y la ganadora sigue.` : "<b>Empate</b>: las dos se anulan.");
  await susurrarDM("Choque", `<p>${L.join("<br>")}</p>`);
  return gana;
}

/** Quita todo lo de la capa V de un actor (para el actor de prueba). */
export async function olvidar(actor) {
  if (!game.user.isGM) return;
  const ok = await foundry.applications.api.DialogV2.confirm({ window: { title: `Quitar el Verbe · ${actor.name}` },
    content: `<p>Borra el estado, las técnicas, las dotes y los efectos del Verbe de <b>${escH(actor.name)}</b>. No se puede deshacer.</p>` });
  if (!ok) return;
  const its = actor.items.filter(i => i.getFlag(MOD, F)).map(i => i.id);
  if (its.length) await actor.deleteEmbeddedDocuments("Item", its);
  const efs = actor.effects.filter(x => x.getFlag(MOD, F)).map(x => x.id);
  if (efs.length) await actor.deleteEmbeddedDocuments("ActiveEffect", efs, { ecosSinCierre: true });
  await actor.update({ [`flags.${MOD}.-=${F}`]: null, "system.skills.cvb.bonuses.check": "", "system.skills.cvb.value": 0 });
  paneles.get(actor.id)?.close();
  await asegurarGuia();
  aviso(`${actor.name} ya no tiene el Verbe.`);
}

/* ------------------------------------------------------------------ */
/*  Herramientas del DM: deshacer, rehacer y ajustes directos         */
/* ------------------------------------------------------------------ */

/** Borra una clave del estado (guardar mezcla y no borra). */
const borrarClave = (actor, ruta) => actor.update({ [`flags.${MOD}.${F}.${ruta.replace(/\.([^.]+)$/, ".-=$1")}`]: null });
/** Reemplaza el estado entero. */
async function reemplazar(actor, e) {
  await actor.update({ [`flags.${MOD}.-=${F}`]: null }, { render: false });
  await actor.update({ [`flags.${MOD}.${F}`]: e });
}
const quitarItems = (actor, prueba) => {
  const ids = actor.items.filter(prueba).map(i => i.id);
  return ids.length ? actor.deleteEmbeddedDocuments("Item", ids) : null;
};
const itemsDe = (actor, id) => itemsTecnica(actor).filter(i => i.getFlag(MOD, F).id === id);

/** Deshace una compra y devuelve sus Trazos. */
export async function deshacer(actor, cid, { forzar = false } = {}) {
  if (!game.user.isGM) return false;
  const e = estado(actor);
  const c = (e.compras ?? []).find(x => x.id === cid);
  if (!c) return;
  const d = c.datos ?? {};
  const no = m => { if (!forzar) aviso(m, "warn"); return !forzar; };
  const borrar = [];
  const cambios = {};
  if (c.tipo === "tecnica") {
    await quitarItems(actor, i => i.getFlag(MOD, F)?.id === d.id);
    if (e.cultivos?.[d.id]) borrar.push(`cultivos.${d.id}`);
    if (e.infusiones?.[d.id]) borrar.push(`infusiones.${d.id}`);
  } else if (c.tipo === "rango") {
    if (rangoDe(actor, d.rama) !== d.a && no(`Primero deshaz el rango más alto de ${nombreRama(d.rama)}.`)) return;
    cambios.rangos = { [d.rama]: d.a - 1 };
    if (d.a - 1 <= 0 && e.principal !== d.rama) cambios.ordenRamas = (e.ordenRamas ?? []).filter(x => x !== d.rama);
  } else if (c.tipo === "dote") {
    cambios.dotes = (e.dotes ?? []).filter(x => x !== d.id);
    await quitarItems(actor, i => i.getFlag(MOD, F)?.dote === d.id);
    if (d.id === "maestria-control") cambios.maestria = null;
    if (d.id === "rama-segunda") cambios.segunda = null;
    if (d.id === "tecnica-reserva") cambios.reserva = null;
  } else if (c.tipo === "control") {
    const v = Number(actor.system?.skills?.cvb?.value) || 0;
    if (v !== d.v && no("Primero deshaz la pericia en Control.")) return;
    await actor.update({ "system.skills.cvb.value": Math.max(0, d.v - 1) });
  } else if (c.tipo === "afinidad") {
    if ((Number(e.afinidad?.[d.nat]) || 1) !== d.a && no("Primero deshaz la afinidad más alta.")) return;
    cambios.afinidad = { [d.nat]: d.a - 1 };
  } else if (c.tipo === "cultivo") {
    const cul = foundry.utils.deepClone(e.cultivos?.[d.tecId]);
    if (!cul) return;
    if (!d.gratis && cul.nivel !== d.nivel && no("Primero deshaz el cultivo más alto de esa técnica.")) return;
    const i = cul.mejoras.lastIndexOf(d.mejora);
    if (i >= 0) cul.mejoras.splice(i, 1);
    if (d.gratis) cul.pendiente = (Number(cul.pendiente) || 0) + 1;
    else cul.nivel = Math.max(0, cul.nivel - 1);
    if (d.mejora === "infusion") delete cul.infusionFija;
    borrar.push(`cultivos.${d.tecId}`);
    if (cul.nivel > 0 || cul.pendiente) cambios.cultivosNuevo = cul;
  } else if (c.tipo === "ojo") {
    if ((Number(e.miradas?.[d.ojo]) || 0) !== d.etapa && no("Primero deshaz la etapa más alta de ese ojo.")) return;
    if (d.antes) cambios.miradas = { [d.ojo]: d.antes };
    else borrar.push(`miradas.${d.ojo}`);
    await quitarItems(actor, i => {
      const id = i.getFlag(MOD, F)?.id ?? "";
      const t = id.startsWith(`mirada-${d.ojo}-`) ? tecnicaPorId(id) : null;
      return t && (Number(String(t.req ?? "").match(/etapa (\d)/)?.[1]) || 1) > (d.antes || 0);
    });
  } else if (c.tipo === "cerrojo") {
    if ((Number(e.cerrojos) || 0) !== d.n && no("Primero deshaz el cerrojo más alto.")) return;
    cambios.cerrojos = d.n - 1;
  } else if (c.tipo === "moneda") {
    await actor.update({ "system.currency.soul": (Number(actor.system?.currency?.soul) || 0) + 1 });
    cambios.trazosExtra = (Number(e.trazosExtra) || 0) - 1;
    cambios.monedas = { [d.nivel]: Math.max(0, (Number(e.monedas?.[d.nivel]) || 0) - 1) };
  }
  const cul = cambios.cultivosNuevo;
  delete cambios.cultivosNuevo;
  const actual = estado(actor);
  await guardar(actor, { ...cambios, gastados: Math.max(0, (Number(actual.gastados) || 0) - c.trazos), compras: (actual.compras ?? []).filter(x => x.id !== cid),
    historial: hist(actual, `El DM deshace: ${c.texto}${c.trazos ? ` (devuelve ${c.trazos} Trazos)` : ""}`) });
  for (const r of borrar) await borrarClave(actor, r);
  if (cul) await guardar(actor, { cultivos: { [d.tecId]: cul } });
  if (c.tipo === "dote") { await ajustarControl(actor); await asegurarAEDotes(actor); }
  await refrescar(actor);
}

/** Vuelve a empezar: devuelve todo lo comprado. Quedan el linaje, la oculta, los ojos, los pactos y lo que dio el DM. */
export async function rehacer(actor, { nat = false, principal = false } = {}) {
  if (!game.user.isGM) return false;
  const e = foundry.utils.deepClone(estado(actor));
  const regalos = new Set(e.regalos ?? []);
  await quitarItems(actor, i => {
    const fl = i.getFlag(MOD, F);
    if (fl?.dote) return true;
    if (!fl?.id) return false;
    return !regalos.has(fl.id) && tecnicaPorId(fl.id, actor)?.rama !== "mirada";
  });
  const quedan = (e.compras ?? []).filter(c => ["ojo", "moneda"].includes(c.tipo));
  const pr = principal ? null : e.principal;
  Object.assign(e, { rangos: pr ? { [pr]: 1 } : {}, ordenRamas: pr ? [pr] : [], principal: pr, dotes: [], afinidad: {}, cultivos: {}, infusiones: {},
    cerrojos: 0, maestria: null, segunda: null, reserva: null, reservaUsada: false, compras: quedan,
    gastados: quedan.reduce((t, c) => t + c.trazos, 0), nats: nat ? [] : e.nats,
    historial: hist(e, `El DM rehace desde cero${nat ? ", con naturaleza nueva" : ""}${principal ? ", con rama principal nueva" : ""}`) });
  await reemplazar(actor, e);
  await actor.update({ "system.skills.cvb.value": 0, "system.skills.cvb.bonuses.check": "" });
  await asegurarAEDotes(actor);
  await refrescar(actor);
  await asegurarRasgos(actor);
  aLaMesa(actor, "Verbe", `<p>El DM le devolvió a ${escH(actor.name)} todo lo que había comprado: tiene <b>${trazos(actor).libres} Trazos</b> para volver a elegir.</p>`, { soloDueno: true });
}

/** Cambios directos del DM: no tocan los Trazos. */
export async function ajustar(actor, campo, valor, clave = null) {
  if (!game.user.isGM) return false;
  const e = estado(actor);
  const nota = t => hist(e, `El DM ajusta: ${t}`);
  if (campo === "car") await guardar(actor, { car: valor, historial: nota(`característica ${CARS[valor]}`) });
  else if (campo === "nat") {
    let oc = ocultaDe(actor);
    if (oc === valor) oc = otraNat(valor);
    await guardar(actor, { nats: [valor, ...(e.nats ?? []).slice(1).filter(n => n !== valor)], oc: revolver(oc, actor.id), historial: nota(`naturaleza ${NATS[valor]}`) });
  } else if (campo === "principal") {
    await guardar(actor, { principal: valor, rangos: { [valor]: Math.max(1, rangoDe(actor, valor)) },
      ordenRamas: [valor, ...(e.ordenRamas ?? []).filter(x => x !== valor)], historial: nota(`rama principal ${nombreRama(valor)}`) });
  } else if (campo === "rango") {
    const n = Math.clamp(Number(valor) || 0, 0, ultimoRango());
    const orden = (e.ordenRamas ?? []).filter(x => x !== clave);
    await guardar(actor, { rangos: { [clave]: n }, ordenRamas: (n > 0 || e.principal === clave) ? [...orden, clave] : orden, historial: nota(`${nombreRama(clave)} ${nombreRango(n)}`) });
  } else if (campo === "afinidad") await guardar(actor, { afinidad: { [clave]: Math.clamp(Number(valor) || 1, 1, 3) }, historial: nota(`afinidad ${NATS[clave]} ${valor}`) });
  else if (campo === "control") {
    await actor.update({ "system.skills.cvb.value": Math.clamp(Number(valor) || 0, 0, 2) });
    await guardar(actor, { historial: nota(`Control ${["sin competencia", "competente", "pericia"][Number(valor) || 0]}`) });
  } else if (campo === "cerrojos") await guardar(actor, { cerrojos: Math.clamp(Number(valor) || 0, 0, 7), historial: nota(`sabe ${valor} cerrojos`) });
  else if (campo === "dote") {
    const dote = D.dotes.find(x => x.id === valor);
    if (!dote) return;
    if (tieneDote(actor, valor)) {
      await guardar(actor, { dotes: (e.dotes ?? []).filter(x => x !== valor), historial: nota(`quita la dote ${dote.nombre}`) });
      await quitarItems(actor, i => i.getFlag(MOD, F)?.dote === valor);
    } else {
      await guardar(actor, { dotes: [...(e.dotes ?? []), valor], historial: nota(`da la dote ${dote.nombre}`) });
      await rasgoDote(actor, dote);
    }
    await ajustarControl(actor);
    await asegurarAEDotes(actor);
  } else if (campo === "quitarTecnica") {
    const c = [...(e.compras ?? [])].reverse().find(x => x.tipo === "tecnica" && x.datos?.id === valor);
    if (c && clave === "devolver") return deshacer(actor, c.id, { forzar: true });
    await quitarItems(actor, i => i.getFlag(MOD, F)?.id === valor);
    await guardar(actor, { historial: nota(`quita ${tecnicaPorId(valor, actor)?.n ?? valor} sin devolver Trazos`) });
  }
  await refrescar(actor);
  await asegurarRasgos(actor);
}

export async function darTrazos(actor, n, { fijarLibres = false } = {}) {
  if (!game.user.isGM) return false;
  const e = estado(actor);
  const delta = fijarLibres ? Number(n) - trazos(actor).libres : Number(n);
  if (!delta) return;
  await guardar(actor, { trazosExtra: (Number(e.trazosExtra) || 0) + delta, historial: hist(e, `El DM ${delta > 0 ? "da" : "quita"} ${Math.abs(delta)} Trazo${Math.abs(delta) === 1 ? "" : "s"}`) });
  if (delta > 0) aLaMesa(actor, "Trazos", `<p>${escH(actor.name)} recibe <b>${delta} Trazo${delta === 1 ? "" : "s"}</b>. Tiene ${trazos(actor).libres} para gastar en su panel.</p>`, { soloDueno: true });
}

/* ------------------------------------------------------------------ */
/*  Textos que explican (sin destripar nada)                          */
/* ------------------------------------------------------------------ */

const DANO_ES = { fire: "fuego", bludgeoning: "contundente", slashing: "cortante", lightning: "relámpago", cold: "frío", piercing: "perforante", radiant: "radiante", force: "fuerza" };
const textoDe = t => (dm() ? t.texto : (t.textoJ ?? t.texto));
const usoDe = t => t.usoL ?? t.uso ?? "";
const visibleJugador = t => !t.soloDM && t.sec !== "sangre" && !D.linajes.some(l => l.req && l.req === t.req) && t.rama !== "mirada";
const leadDe = r => (dm() ? (r.lead || r.jugador) : r.jugador) ?? "";
const donDe = (don, k) => (dm() ? don[k] : (don.jugador?.[k] ?? don[k]));
const dotTexto = d => (dm() ? d.texto : (d.textoJ ?? d.texto));
const nombrePacto = p => (dm() ? p : String(p).replace(/\s*\(.*?\)\s*/g, ""));
const ORDEN_SEC = ["pura", "fuego", "agua", "viento", "tierra", "rayo", "combo", "velo", "cuerpo", "mirada", "sello", "pacto", "pulso", "hilo", "quietud", "rastro", "sangre", "familia"];
const TIEMPO_L = { A: "Acción", AA: "Acción adicional", R: "Reacción", "1 min": "1 minuto", "10 min": "10 minutos", "1 h": "1 hora", "8 h": "8 horas", "3 días": "ritual de 3 días" };
const COMP_L = { GV: "gestos y voz", G: "gestos", V: "voz", "—": "sin gestos ni voz" };
const alcanceL = a => ({ yo: "sobre ti", toque: "toque", vista: "a la vista" }[a] ?? a);
const ordenRamaG = t => D.ramas.findIndex(r => r.id === t.rama) * 100 + Math.max(0, ORDEN_SEC.indexOf(t.sec));
/** Grupo de la tienda: [clave, título, orden]. */
function grupoDe(t) {
  const i = Math.max(0, ORDEN_SEC.indexOf(t.sec));
  const titulo = { pura: "Forma · Verbe puro", fuego: "Forma · Fuego", agua: "Forma · Agua", viento: "Forma · Viento", tierra: "Forma · Tierra", rayo: "Forma · Rayo",
    combo: "Forma · Combinadas", familia: "Artes de familia" }[t.sec] ?? nombreRama(t.rama);
  return [t.propia && !ORDEN_SEC.includes(t.sec) ? `r-${t.rama}` : `s-${t.sec}`, titulo, i];
}
const USA_TXT = { verbe: "usa tu característica de Verbe", fisica: "ataca con Fuerza o Destreza, como un arma", wis: "usa Sabiduría" };

function listaTecnicas(filtro) {
  const tecs = D.tecnicas.filter(t => filtro(t) && visibleJugador(t));
  const porGrado = {};
  for (const t of tecs) (porGrado[t.g] ??= []).push(t);
  return Object.entries(porGrado).map(([g, ts]) => `<li><b>Grado ${g}:</b> ${ts.map(t => `<span data-tooltip="${escH(t.textoJ ?? t.texto)}">${escH(t.n)}</span>`).join(", ")}</li>`).join("");
}

export function describir(tipo, v, actor = null) {
  if (!v) return "<p class=\"ecos-nota\">Cambia la opción de arriba para ver qué es. No se elige hasta que pulses el botón.</p>";
  if (tipo === "nat") {
    const st = ESTADOS[ESTADO_NAT[v]?.[0]];
    const pierde = Object.keys(D.ciclo).find(k => D.ciclo[k] === v);
    const combos = Object.values(D.combos).filter(c => c.de.includes(v)).map(c => `${NATS[c.de.find(x => x !== v)] ?? NATS[v]} → <b>${c.nombre}</b>`);
    const tecs = D.tecnicas.filter(t => t.sec === v);
    return `<p><b>${NATS[v]}.</b> Su daño suele ser de ${DANO_ES[TIPO_NAT[v]]}. Cuando hiere deja <b>${st?.name}</b>: ${st?.texto.charAt(0).toLowerCase()}${st?.texto.slice(1)}</p>
      <p>En un choque de técnicas tiene ventaja frente a <b>${NATS[D.ciclo[v]]}</b> y desventaja frente a <b>${NATS[pierde]}</b>. Con la dote Naturaleza combinada (nivel 9) se mezcla: ${combos.join(" · ")}.</p>
      <p>Tiene ${tecs.length} técnicas propias en la rama Forma, como ${tecs.slice(0, 3).map(t => `${escH(t.n)} (grado ${t.g})`).join(", ")}.</p>
      <details><summary>Ver todas sus técnicas</summary><ul>${listaTecnicas(t => t.sec === v)}</ul><p class="ecos-nota">Pasa el ratón sobre un nombre para leer qué hace.</p></details>`;
  }
  if (tipo === "rama") {
    const r = D.ramas.find(x => x.id === v);
    if (!r) return "";
    const don = D.dones.find(x => x.rama === r.nombre);
    const n = D.tecnicas.filter(t => t.rama === v && visibleJugador(t)).length;
    return `<p><b>${r.nombre}.</b> ${escH(leadDe(r))} En esta rama ${USA_TXT[r.usa] ?? USA_TXT.verbe}.</p>
      ${don ? `<p>Sus dones, que llegan al subir de rango en la rama (en tu rama principal, un rango antes):</p><ul class="ecos-verbe-dones">${DONES_K.map((k, i) => {
        const [nombre, texto] = partirDon(donDe(don, k));
        return `<li class="tiene"><b>${D.rangos[i + 2]?.nombre ?? ""}${nombre ? ` · ${escH(nombre)}` : ""}:</b> ${escH(texto)}</li>`;
      }).join("")}</ul>` : ""}
      <details><summary>Ver sus ${n} técnicas</summary><ul>${listaTecnicas(t => t.rama === v)}</ul><p class="ecos-nota">Pasa el ratón sobre un nombre para leer qué hace.</p></details>`;
  }
  if (tipo === "tec") { const t = tecnicaPorId(v, actor); return t ? `<p><b>${escH(t.n)}</b> (grado ${t.g}): ${escH(textoDe(t))}</p>` : ""; }
  if (tipo === "dote") { const d = D.dotes.find(x => x.id === v); return d ? `<p><b>${escH(d.nombre)}:</b> ${escH(dotTexto(d))}</p>` : ""; }
  return "";
}

const AYUDA = {
  verbe: "Tu reserva. Cada técnica gasta Verbe al usarla. Se recupera la mitad en un Descanso Largo en el Santuario y un cuarto en una noche a la intemperie. Sube sola con tu nivel.",
  trazos: "Tus puntos para crecer. Con ellos aprendes técnicas, subes rangos, compras dotes y cultivas. Ganas 4 por nivel, y a veces más por hitos de la historia o Monedas Antiguas. Lo que compras es para siempre.",
  car: "La característica con la que usas el Verbe. Da la CD de tus técnicas (8 + competencia + modificador), su bonificador de ataque y suma a tu reserva.",
  grado: "Qué tan fuerte es una técnica, de 0 a 11 (como el nivel de un conjuro, con dos grados más arriba del 9). Tu grado máximo sube con tu nivel: grado 1 en el nivel 1, 2 en el 3, 3 en el 5… 9 en el 17, 10 en el 19 y 11 en el 20. En cada rama, además, llegas solo hasta lo que deja tu rango.",
  sobre: "Puedes gastar Verbe que no tienes: tu barra baja de 0 hasta la mitad de tu reserva en negativo. Cada técnica que usas en negativo te pide una salvación de CON (CD 10 + su grado); si fallas, ganas 1 Agotamiento. Lo que quede en negativo cuesta el doble de recuperar.",
  control: "Una habilidad nueva de tu hoja (con Sabiduría). Se tira para ganar un choque entre dos técnicas, romper un Velo, abrir los Cerrojos y no perderse en la Quietud. Se compra en Mejorar → Especialidades."
};
const ayuda = k => `<i class="ecos-verbe-ayuda fa-solid fa-circle-question" data-tooltip="${escH(AYUDA[k])}"></i>`;
/** Una línea para entender la pestaña; lo largo, plegado; y el enlace a su parte de la guía escrita. */
const intro = (titulo, texto, mas = "", seccion = "") => `<div class="ecos-verbe-intro"><p><b>${titulo}</b> ${texto}${seccion ? ` <a class="ecos-verbe-guia" data-action="guia" data-s="${seccion}" data-tooltip="Abre la guía escrita en esa parte"><i class="fa-solid fa-book-open"></i> Guía</a>` : ""}</p>${mas ? `<details><summary>Saber más</summary>${mas}</details>` : ""}</div>`;

/* ------------------------------------------------------------------ */
/*  Guía escrita: Reglas de la casa · 10 · El Verbe                   */
/*  Solo la ven el DM y los dueños de un actor que despertó.          */
/* ------------------------------------------------------------------ */

const ID_REGLAS = "G0rD0J3JkpOkXM00";
const diarioReglas = () => game.journal.get(ID_REGLAS) ?? game.journal.find(j => /reglas de la casa/i.test(j.name));
const paginaGuia = () => diarioReglas()?.pages.find(p => p.getFlag(MOD, F)?.guia) ?? null;
const h2 = (anchor, texto) => `<h2 data-anchor="${anchor}">${texto}</h2>`;
const fila = celdas => `<tr>${celdas.map(c => `<td>${c}</td>`).join("")}</tr>`;
const tablaG = (cab, filas) => `<table><thead><tr>${cab.map(c => `<th>${c}</th>`).join("")}</tr></thead><tbody>${filas.map(fila).join("")}</tbody></table>`;

export function htmlGuia() {
  const pierde = n => NATS[Object.keys(D.ciclo).find(k => D.ciclo[k] === n)];
  const ramasJ = D.ramas.map(r => `<li><b>${r.nombre}</b>: ${escH(r.jugador ?? "")}</li>`).join("");
  return `<h1>El Verbe</h1>
<p><em>Para quien despertó. El panel del Verbe (botón «Verbe» en la cabecera de tu hoja) administra técnicas y recursos. Los efectos narrativos, las condiciones del entorno y el entrenamiento los resuelve el DM.</em></p>
${h2("primeros-pasos", "Primeros pasos")}
<ol><li>En <b>Inicio</b>, elige tu <b>naturaleza</b> y tu <b>rama principal</b> con las tarjetas. Cada elección pide confirmación antes de guardarse.</li>
<li>En <b>Aprender</b> compras técnicas con Trazos. En <b>Mejorar</b> subes rangos, compras dotes o entrenas técnicas. Puedes guardar puntos para después.</li>
<li>Abre <b>Mis técnicas</b> para usarlas. También están en la sección «Técnicas del Verbe» de tu hoja. La ventana de dnd5e comprueba el gasto al confirmar.</li>
<li>Si te equivocaste al comprar, pídeselo al DM: puede deshacerlo y devolverte los Trazos.</li></ol>
${h2("verbe-y-descansos", "Verbe y descansos")}
<ul><li>Tu reserva sube con tu nivel y suma el modificador de tu característica de Verbe.</li>
<li>Recuperas la <b>mitad</b> en un Descanso Largo en el Santuario y un <b>cuarto</b> en una noche a la intemperie.</li>
<li>Una <b>Moneda Antigua</b> devuelve 2 × tu competencia de Verbe, o se vuelve 1 Trazo (como mucho 2 por nivel).</li></ul>
${tablaG(["Nivel", ...[1, 2, 3, 5, 7, 9, 11, 13, 15, 17, 20].map(String)], [["Reserva base", ...[1, 2, 3, 5, 7, 9, 11, 13, 15, 17, 20].map(n => D.verbeMax[n] ?? D.verbeMax[String(n)])]])}
${h2("trazos", "Trazos")}
<p>Ganas 4 por nivel; quien despierta en el nivel N recibe 4 × N + 4 de una vez. El DM da más por hitos de la historia. Lo que compras es para siempre.</p>
${tablaG(["Qué", "Trazos"], [["Técnica de grado 0", "1"], ["Técnica de grado 1 a 11", "su grado"], ["Técnica rara o combinada", "+1"],
    ["Rango: Entrenado, Experto, Maestro, Legendario, Mítico", "1, 3, 5, 8 y 10 (1 menos en la rama principal; 1 más desde la tercera rama)"],
    ["Dote", "2 a 4"], ["Control del Verbe: competencia y pericia", "2 y 3"], ["Afinidad: Entrenada y Maestra", "2 y 4"],
    ["Cultivo: Pulida, Dominada, Propia", "1, 2 y 3"], ["Cerrojo", "su grado"], ["Crear una técnica", "grado + 1"]])}
${h2("tecnicas-y-grados", "Técnicas y grados")}
<ul><li>Una técnica se usa como un conjuro: tiene acción, alcance, duración, ataque o salvación. Gasta Verbe en vez de un espacio.</li>
<li>El <b>grado</b> (0 a 11) es como el nivel de un conjuro, con dos grados más arriba del 9. Tu grado máximo es (nivel + 1) ÷ 2 hasta el grado 9 (nivel 17); el nivel 19 llega al grado 10 y el 20 al 11. En cada rama llegas hasta lo que deja tu rango.</li>
<li>Puedes usar una técnica a un grado mayor pagando el Verbe de ese grado, hasta el límite de tu nivel y rango de rama. Una técnica concedida por la historia conserva su grado base.</li>
<li>Las de grado 0 casi no gastan, pero piden tener al menos 1 de Verbe. Cada técnica tiene un uso a grado 6 o más por Descanso Largo, incluido elevar una técnica de grado menor.</li>
<li>Componentes: <b>gestos</b> (una mano libre), <b>voz</b> (el silencio la impide) y <b>Concentración</b> (como en los conjuros).</li></ul>
${tablaG(["Grado", ...Array.from({ length: GRADO_TOPE + 1 }, (_, g) => String(g))], [["Verbe", ...Array.from({ length: GRADO_TOPE + 1 }, (_, g) => costoGrado(g))],
    ["Nivel", ...Array.from({ length: GRADO_TOPE + 1 }, (_, g) => String(nivelParaGrado(g)))]])}
${h2("ramas-y-rangos", "Ramas y rangos")}
<p>Cada rama es un tipo de técnica. Todas empiezan en Novato y tu rama principal en Entrenado. Tu rango en una rama dice hasta qué grado puedes aprender ahí. Desde Experto, cada rango hace que las técnicas de esa rama que dañan o curan tiren un dado más, y te da un don de la rama (en la principal, un rango antes).</p>
${tablaG(["Rango", "Aprendes hasta", "Desde el nivel", "Cuesta", "Te da"], D.rangos.map((r, i) => [r.nombre, `grado ${r.grado}`, String(r.nivel), i ? `${r.trazos} Trazos` : "gratis", i >= 2 ? `${i - 1} dado${i > 2 ? "s" : ""} más y su ${ORD_DON[i - 2].toLowerCase()} don` : "—"]))}
<ul>${ramasJ}</ul>
${h2("dones-de-rango", "Los dones de cada rama")}
${D.dones.filter(d => d.rama !== "Sangre").map(d => `<h3>${escH(d.rama)}</h3><ul>${DONES_K.map((k, i) => { const [n, t] = partirDon(d.jugador?.[k] ?? d[k]); return `<li><b>${D.rangos[i + 2]?.nombre ?? ""} · ${escH(n)}:</b> ${escH(t)}</li>`; }).join("")}</ul>`).join("")}
${h2("naturalezas", "Naturalezas")}
<p>Tu naturaleza es el elemento al que responde tu Verbe. Te da sus técnicas (en la rama Forma) y puedes ponérsela a otras técnicas. Puede que tu Verbe responda a otra que no conoces: en Aprender, «Probar» intenta descubrirla. Si responde, aprender la técnica cuesta los Trazos indicados; si no responde, no los gastas.</p>
${tablaG(["Naturaleza", "Deja", "Vence a", "Pierde contra"], Object.keys(NATS).map(n => [NATS[n], `${ESTADOS[ESTADO_NAT[n][0]].name}: ${ESTADOS[ESTADO_NAT[n][0]].texto}`, NATS[D.ciclo[n]], pierde(n)]))}
<p>Con la dote Naturaleza combinada (nivel 9 y un maestro) dos naturalezas se mezclan: ${Object.values(D.combos).map(c => `${c.nombre} (${c.de.map(x => NATS[x]).join(" + ")})`).join(", ")}.</p>
${h2("afinidad-e-infusion", "Afinidad e infusión")}
<ul><li><b>Afinidad</b>: Despierta al tenerla; Entrenada (nivel 5, un maestro) suma 1 dado y sus estados duran el doble; Maestra (nivel 11) suma 2.</li>
<li><b>Infundir</b> le pone tu elemento a una técnica de Forma pura, Cuerpo, Hilo, Quietud o Velo que hace daño: el daño pasa a ese elemento y deja su estado. Cuesta 2 Verbe más por uso (4 con una combinación). Se cambia en Cultivo cuando quieras.</li></ul>
${h2("dotes", "Dotes")}
<p>Mejoras permanentes: más reserva, más Control, abrir Pulso, combinar elementos. La lista, con lo que pide cada una, está en el panel. Las que piden un maestro o algo de la historia van al DM.</p>
${h2("cultivo", "Cultivo")}
<p>Una técnica que te gusta se entrena: Pulida (1 Trazo), Dominada (2) y Propia (3). Cada nivel da una mejora y pide días de entrenamiento. Dominada saca variantes; Propia evoluciona en una técnica nueva con tu firma. Cultivas tantas como tu competencia.</p>
<ul>${D.mejoras.map(m => `<li>${escH(m)}</li>`).join("")}</ul>
${h2("crear-tecnicas", "Crear técnicas")}
<p>Con Entrenado en una rama puedes inventar técnicas de esa rama, en Mejorar → Inventar una técnica. El menú propone un presupuesto según acción, alcance, área, estados y daño repetido. El DM aprueba; una excepción de balance queda registrada con su motivo. Cuesta grado + 1 Trazos (más combinaciones), días de entrenamiento y 25 o por grado. El oro y los días de creación o cultivo se resuelven en mesa antes de confirmar: el panel cobra los Trazos.</p>
${h2("control-y-sobreesfuerzo", "Control, choques y sobreesfuerzo")}
<ul><li><b>Control del Verbe</b> es una habilidad con Sabiduría: choques de técnicas, romper Velos, abrir Cerrojos, la Quietud.</li>
<li><b>Choque</b>: la ventaja en el ciclo suma 2 al grado al comparar potencia; gana la potencia mayor y un empate se resuelve con Control contra Control. El DM puede elegir la regla clásica de prioridad elemental en los ajustes.</li>
<li><b>Sobreesfuerzo</b>: puedes gastar Verbe que no tienes, hasta la mitad de tu reserva en negativo. Cada gasto en negativo, incluidas defensas y Cerrojos, pide CON (CD 10 + grado, antes de dones) o 1 Agotamiento. Con Agotamiento 4 no se permite. Todas las fuentes recuperan la deuda a razón de 2 por punto; un punto impar se guarda para la próxima recuperación.</li></ul>
${h2("siete-cerrojos", "Siete Cerrojos")}
<p>Un estado de Cuerpo. Se abre con una acción adicional y una prueba de Control (CD 10 + 2 × el cerrojo que abres) y dura 1 minuto. Lo que dan se acumula; los PG por turno y el Agotamiento al cerrar son los del más alto.</p>
<ul><li><b>En orden:</b> cada acción adicional abre hasta 2 cerrojos más de los que tienes abiertos (3 con Maestro en Cuerpo), y cada vez pagas el Verbe del nuevo.</li>
<li><b>El mismo día:</b> si los abres por segunda vez entre dos Descansos Largos, al cerrar sumas 1 Agotamiento más.</li>
<li><b>El séptimo:</b> al cerrarlo, CON CD 20 (15 con el don Legendario de Cuerpo). Si fallas, mueres; si la superas, caes a 0 PG con 4 de Agotamiento.</li>
<li><b>Se mejoran con:</b> los dones de Cuerpo (Legendario: los PG por turno a la mitad), la escuela de los Cerrojeros (el primero sin prueba ni PG, y duran 2 minutos) y la dote Cerrojo temprano.</li></ul>
${tablaG(["Cerrojo", "Grado", "Da", "PG por turno", "Al cerrar"], D.cerrojos.map(c => [`${c.n} · ${escH(c.nombre)}`, c.grado, escH(c.da), c.pg || "—", escH(c.cierre)]))}
${h2("defensas", "Sustitución y otras defensas")}
<p>Con midi-qol, cuando un ataque te va a impactar aparece un aviso con las defensas que sabes y su costo exacto (Sustitución, Cortina de agua, Escudo de piedra, Paso falso, Leer el golpe y otras). Usar una gasta tu reacción. Sin esa integración se resuelven en mesa; el DM debe comprobar también los críticos y la posición del objeto de Sustitución.</p>
<ul><li><b>Sustitución</b>: el ataque falla y golpea un objeto. Cuesta 2 Verbe, y 2 más por cada grado que el ataque supere tu grado máximo. El grado de un ataque es el de su técnica o conjuro; si es un arma o una criatura, la mitad de su nivel o VD. Pide un objeto de tu tamaño o menor a 3 m. No sirve contra áreas ni salvaciones, salvo con la dote Sustitución amplia.</li>
<li>Las demás suben tu CA contra ese ataque o le dan desventaja.</li></ul>
${h2("dones-despertar", "Dones del despertar")}
<p>Todo el que despierta tiene cuatro dones desde el primer día (Mejorar → Dotes, «Dones del despertar»). No cuestan nada y se mejoran con Trazos:</p>
<ul><li><b>Sentido del Verbe:</b> al tocar a alguien sabes si despertó, y notas el Verbe que se usa a 1,5 m. Crece con Sentir el Verbe (9 m) y Sentir más lejos (36 m).</li>
<li><b>Cuerpo despierto:</b> el sobreesfuerzo te cuesta menos (CD 9 + grado). II y III: más PG máximos.</li>
<li><b>Aliento del Verbe:</b> cada Dado de Golpe que gastas al descansar te devuelve 1 de Verbe (2 con el II); con el III, además cura tu modificador de Verbe.</li>
<li><b>Paso del Verbe:</b> con al menos 1 de Verbe andas un turno por paredes o sobre agua quieta. II: +3 m de velocidad y el agua movida también te sostiene. III: saltos triples y caídas sin daño.</li></ul>
${h2("titeres-y-medicina", "Títeres y medicina")}
<p>Dos artes finas de Control, con dotes en tres pasos (Mejorar → Dotes, «Títeres y medicina»):</p>
<ul><li><b>Títeres (rama Hilo):</b> Titiritero, Titiritero de oficio y Maestro titiritero. Las marionetas se compran y se mejoran con oro (Equipo): blindaje, muelles, depósitos y ojos de vidrio.</li>
<li><b>Medicina (rama Pulso, con Control fino):</b> Médico del Verbe, Médico de oficio y Cirujano del Verbe. Con el maletín de cirujano, cuentas como si llevaras un kit de sanador.</li></ul>
${h2("lo-mas-fuerte", "Lo más fuerte crece contigo")}
<ul><li>Las técnicas más fuertes tienen una <b>escalera</b>: una versión chica que se aprende temprano y otras más grandes después. La ficha de cada técnica dice «Crece» con su escalera.</li>
<li>Las que atan, duermen, sellan o mandan sobre otro, como la Sustitución, <b>cuestan más contra alguien más fuerte que tú</b>: 2 Verbe más por cada grado que su grado (la mitad de su nivel o VD) pase de tu grado máximo. Contra lo chico sirven desde el principio.</li>
<li>Cada técnica y cada dote dicen al final <b>«Se mejora con»</b>: el grado, el rango de su rama, la afinidad, el cultivo, las dotes y la escuela que la hacen crecer.</li></ul>
${h2("el-clima", "El clima")}
<p>Al aire libre el clima del día fortalece o merma los elementos. <b>Se fortalece</b>: sus técnicas cuestan 1 Verbe menos (mínimo 1). <b>Se merma</b>: cuestan 1 Verbe más. Si algo lo ayuda y algo lo estorba a la vez, se anulan. La tarjeta del clima dice cada día, a todos, qué elementos cambian (o que ninguno cambia). Bajo techo no cuenta, y las Miradas, los Sellos y los Pactos no dependen del clima.</p>
<table><tr><th>Elemento</th><th>Se fortalece con</th><th>Se merma con</th></tr><tr><td><b>Fuego</b></td><td>calor seco (25 °C o más, sin lluvia ni niebla), viento fuerte con cielo seco, tormenta seca, incendio</td><td>lluvia, aguacero, tormenta, aguanieve, nevada, ventisca, frío extremo (−18 °C o menos)</td></tr><tr><td><b>Agua</b></td><td>llovizna, lluvia, aguacero, tormenta, aguanieve</td><td>calor seco (30 °C o más con cielo seco), polvo, humo de incendio, helada sin lluvia (el agua se congela)</td></tr><tr><td><b>Viento</b></td><td>viento fuerte, vendaval, ventisca, tornado, polvo</td><td>aire quieto: calma con niebla, con nubes o con 30 °C o más</td></tr><tr><td><b>Tierra</b></td><td>polvo, tierra seca y firme (despejado o nublado con 20 °C o más), suelo helado sin nieve</td><td>barro (lluvia, aguacero, tormenta), nieve acumulada (nevada, ventisca)</td></tr><tr><td><b>Rayo</b></td><td>tormenta, tormenta seca, granizo, polvo, aire seco y frío (0 °C o menos sin lluvia ni nieve)</td><td>humedad quieta: niebla o llovizna sin viento fuerte</td></tr><tr><td><b>Escarcha</b></td><td>helada (0 °C o menos), aguanieve, nieve, nevada, ventisca, granizo</td><td>calor (30 °C o más), incendio</td></tr><tr><td><b>Raíz</b></td><td>tierra mojada: llovizna, lluvia, aguacero o tormenta sin helada</td><td>suelo helado (−5 °C o menos), sequía (calor seco), polvo</td></tr><tr><td><b>Madera</b></td><td>humedad (niebla, llovizna), lluvia templada (8 a 29 °C)</td><td>incendio, tormenta seca, vendaval, tornado, savia congelada (−5 °C o menos)</td></tr><tr><td><b>Magma</b></td><td>roca seca y tibia (20 °C o más, sin lluvia ni niebla), incendio</td><td>lluvia, aguacero, tormenta, aguanieve, nevada, ventisca, frío extremo</td></tr><tr><td><b>Vapor</b></td><td>niebla, calor húmedo (18 °C o más con lluvia o nubes)</td><td>helada (0 °C o menos), vendaval, ventisca, tornado</td></tr><tr><td><b>Ceniza</b></td><td>incendio, tormenta seca, viento fuerte con cielo seco o nublado</td><td>lluvia, aguacero, tormenta, aguanieve, nevada, ventisca</td></tr><tr><td><b>Tormenta</b></td><td>tormenta, tormenta seca, tornado, granizo, vendaval, nubes que corren (nublado con viento fuerte)</td><td>cielo quieto: calma con niebla, cielo despejado o 30 °C o más</td></tr><tr><td><b>Hierro</b></td><td>tormenta, tormenta seca, frío seco (0 °C o menos sin lluvia ni nieve)</td><td>humedad que oxida: niebla, llovizna, aguanieve</td></tr><tr><td><b>Corriente</b></td><td>lluvia, aguacero, tormenta</td><td>aire seco (polvo, calor seco), agua congelada (−5 °C o menos sin lluvia)</td></tr><tr><td><b>Destello</b></td><td>sol fuerte (despejado con 15 °C o más), tormenta seca</td><td>lo que no deja ver: niebla, polvo, humo, nevada, ventisca</td></tr><tr><td><b>Arena</b></td><td>polvo, viento fuerte con cielo seco o nublado, arena caliente (30 °C o más con cielo seco)</td><td>arena mojada: lluvia, aguacero, tormenta, aguanieve, nevada, ventisca</td></tr></table>
${h2("linajes-y-miradas", "Herencias y Miradas")}
<p>Algunas sangres traen poderes que no se compran ni se enseñan: <b>herencias</b> y <b>ojos</b> (Miradas). Si tienes una, lo sabrás jugando, y desde ese día su rama se abre en tu panel con todo explicado. Quién la tiene y de dónde viene no tienes manera de saberlo: lo decide la historia.</p>
<ul><li><b>Una herencia</b> trae un rasgo que siempre está (una resistencia, más reserva, una naturaleza de más…), sus técnicas propias (se pagan con Trazos como las demás) y el <b>Despertar del linaje</b>: durante 1 minuto tomas otra forma con lo que da tu sangre, y al terminar ganas 1 Agotamiento. La <b>fuerza</b> de la sangre dice hasta qué grado llegan sus técnicas: plena 9, media 5, débil 3, rastro 1.</li>
<li><b>Un ojo</b> tiene tres <b>etapas</b>. Cada una despierta en un hito de la historia y se paga entonces (3, 5 y 8 Trazos); sus técnicas vienen con la etapa. Se abre con una acción adicional y mantenerlo abierto cuesta 1 Verbe por minuto. Un ojo trasplantado cuesta el doble, salvo con la dote Injerto aceptado.</li>
<li>Las técnicas de los ojos que mandan, duermen o atan también cuestan más contra alguien más fuerte que tú.</li></ul>
${h2("lo-que-no-sabes", "Lo que no sabes")}
<p>Hay cosas que no tienes manera de saber todavía: de dónde viene tu sangre, si tu Verbe responde a otra naturaleza, qué despierta en ti con el tiempo. Si existen, aparecen jugando.</p>`;
}

/** Crea o pone al día la página de la guía y quién la ve. */
export async function asegurarGuia() {
  if (!soyGM() || !D) return;
  const diario = diarioReglas();
  if (!diario) return;
  const ownership = { default: CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE };
  for (const u of game.users.filter(x => !x.isGM)) {
    const ve = (MODO === "activo") && game.actors.some(a => despierto(a) && a.testUserPermission(u, "OWNER"));
    ownership[u.id] = ve ? CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER : CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE;
  }
  const html = htmlGuia();
  const pag = paginaGuia();
  if (!pag) {
    const orden = Math.max(0, ...diario.pages.map(p => p.sort ?? 0)) + 100000;
    await diario.createEmbeddedDocuments("JournalEntryPage", [{ name: "10 · El Verbe", type: "text", sort: orden, ownership,
      text: { content: html, format: CONST.JOURNAL_ENTRY_PAGE_FORMATS.HTML }, flags: { [MOD]: { [F]: { guia: 1 } } } }]);
    return;
  }
  const cambios = {};
  if (pag.text?.content !== html) cambios["text.content"] = html;
  if (Object.entries(ownership).some(([k, v]) => (pag.ownership?.[k] ?? CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE) !== v)) cambios.ownership = ownership;
  if (Object.keys(cambios).length) await pag.update(cambios);
}

export function abrirGuia(seccion = "") {
  const pag = paginaGuia();
  if (!pag || !pag.testUserPermission(game.user, "OBSERVER")) return rechazar("La guía escrita todavía no está disponible: pídesela al DM.", "warn");
  return pag.parent.sheet.render({ force: true, pageId: pag.id, ...(seccion ? { anchor: seccion } : {}) });
}

/* ------------------------------------------------------------------ */
/*  Panel                                                             */
/* ------------------------------------------------------------------ */

const paneles = new Map();
export function abrirPanel(actor, pestana) {
  if (!activo()) return;
  let p = paneles.get(actor.id);
  if (!p) { p = new PanelVerbe(actor); paneles.set(actor.id, p); }
  if (pestana) p.pestana = pestana;
  return p.render({ force: true });
}
const esperaPanel = {};
function refrescarPanel(id) {
  clearTimeout(esperaPanel[id]);
  esperaPanel[id] = setTimeout(() => { const p = paneles.get(id); if (p?.rendered) p.render(); }, 150);
}

const correr = (app, promesa) => Promise.resolve(promesa).then(() => app.render())
  .catch(err => { console.error(`${MOD} | capa V`, err); aviso("Algo falló (el detalle está en la consola, F12).", "error"); });
const valorDe = (app, nombre) => app.element.querySelector(`[name="${nombre}"]`)?.value ?? "";
const marcado = (app, nombre) => !!app.element.querySelector(`[name="${nombre}"]`)?.checked;
const confirmar = (titulo, html) => foundry.applications.api.DialogV2.confirm({ window: { title: titulo }, content: html, rejectClose: false });
const ELECCION = {
  nat: { titulo: "naturaleza", pares: () => Object.entries(NATS) },
  principal: { titulo: "rama principal", pares: () => ramasLibres() }
};

export class PanelVerbe extends foundry.applications.api.ApplicationV2 {
  constructor(actor) {
    super({ id: `ecos-verbe-${actor.id}`, window: { title: `El Verbe · ${actor.name}`, icon: "fa-solid fa-droplet" } });
    this.actor = actor;
    this.pestana = "resumen";
    this.comoJugador = false;
    this.filtro = { rama: "", grado: "", nat: "", texto: "", solo: true, agrupar: "rama" };
    this.filtroDote = { texto: "", solo: true };
    this.filtroUso = { texto: "", solo: false };
    this.abiertos = null; // grupos desplegados (null: los que tienen algo para aprender)
  }

  static DEFAULT_OPTIONS = {
    classes: ["ecos-verbe-panel"],
    window: { resizable: true },
    position: { width: 940, height: 790 },
    actions: {
      pestana(ev, t) { this.pestana = t.dataset.p; this.abiertos = null; this.render(); },
      usar(ev, t) {
        ev?.preventDefault?.();
        if (this._usoEnCurso) return;
        this._usoEnCurso = true; t.disabled = true;
        Promise.resolve(usarTecnica(this.actor, t.dataset.id))
          .catch(err => { console.error(`${MOD} | uso desde panel`, err); aviso("No se pudo abrir el uso. Puedes intentarlo desde tu hoja.", "error"); })
          .finally(() => { this._usoEnCurso = false; this.render(); });
      },
      ficha(ev, t) {
        ev?.preventDefault?.();
        COMO_JUGADOR = game.user.isGM && this.comoJugador;
        let html;
        try { html = this.#fichaTec(t.dataset.id); } finally { COMO_JUGADOR = false; }
        if (!html) return;
        const tec = tecnicaPorId(t.dataset.id, this.actor);
        foundry.applications.api.DialogV2.wait({ window: { title: tec.n, resizable: true }, position: { width: 760 }, content: `<div class="ecos-dialogo">${html}</div>`,
          buttons: [{ action: "cerrar", label: "Cerrar", default: true }], rejectClose: false });
      },
      limpiarFiltros() { this.filtro = { rama: "", grado: "", nat: "", texto: "", solo: true, agrupar: "rama" }; this.abiertos = null; this.render(); },
      comoJugador() { this.comoJugador = !this.comoJugador; this.render(); },
      rango(ev, t) { correr(this, subirRango(this.actor, t.dataset.rama)); },
      aprender(ev, t) {
        ev?.preventDefault?.();
        const tec = tecnicaPorId(t.dataset.id, this.actor);
        const r = requisitos(this.actor, tec);
        if (!r.ok) return rechazar(r.motivo, "warn");
        if (r.pideDM && !game.user.isGM) return pedirAlDM(this.actor, "tecnica", { id: tec.id }, tec.n, `${escH(tec.n)} (${tec.trazos} Trazos). Pide: ${escH(tec.req ?? "")}.`);
        correr(this, aprender(this.actor, tec));
      },
      probar(ev, t) {
        ev?.preventDefault?.();
        const tec = tecnicaPorId(t.dataset.id, this.actor);
        correr(this, probarNaturaleza(this.actor, tec).then(ok => (ok && requisitos(this.actor, tec).ok ? aprender(this.actor, tec) : null)));
      },
      dote(ev, t) { ev?.preventDefault?.(); correr(this, comprarDote(this.actor, t.dataset.id)); },
      afinidad(ev, t) { correr(this, subirAfinidad(this.actor, t.dataset.nat)); },
      control() { correr(this, comprarControl(this.actor)); },
      cultivar(ev, t) {
        const [mejora, nat] = (valorDe(this, `mejora-${t.dataset.id}`) || "dado").split(":");
        correr(this, cultivar(this.actor, t.dataset.id, mejora, nat ?? null));
      },
      infundir(ev, t) { correr(this, infundir(this.actor, t.dataset.id, valorDe(this, `inf-${t.dataset.id}`) || null)); },
      crear(ev, t) { correr(this, dialogoCrear(this.actor, { base: t.dataset.base || null, modo: t.dataset.modo || null })); },
      async elegir(ev, t) {
        const campo = t.dataset.campo;
        let v = t.dataset.valor || valorDe(this, campo);
        if (t.dataset.destino) {
          const pares = (ELECCION[campo]?.pares() ?? []);
          if (!pares.length) return;
          if (!await confirmar("Que decida el destino", `<p>El destino elige tu ${ELECCION[campo].titulo} al azar. Es para siempre: solo el DM puede cambiarla después.</p>`)) return;
          v = pares[Math.floor(Math.random() * pares.length)][0];
        } else if (!v) return rechazar("Primero elige una opción en la lista.", "warn");
        else if (ELECCION[campo] && !await confirmar(`Elegir ${ELECCION[campo].titulo}`, `<p>Vas a elegir <b>${escH(Object.fromEntries(ELECCION[campo].pares())[v])}</b> como tu ${ELECCION[campo].titulo}. Es para siempre: solo el DM puede cambiarla después.</p>`)) return;
        const e = estado(this.actor);
        const cambios = {
          nat: () => {
            let oc = ocultaDe(this.actor);
            if (oc === v) oc = otraNat(v);
            return { nats: [v], oc: revolver(oc, this.actor.id), historial: hist(e, `Elige su naturaleza: ${NATS[v]}${t.dataset.destino ? " (el destino)" : ""}`) };
          },
          principal: () => ({ principal: v, rangos: { [v]: Math.max(1, rangoDe(this.actor, v)) }, ordenRamas: [...new Set([v, ...(e.ordenRamas ?? [])])],
            historial: hist(e, `Elige su rama principal: ${nombreRama(v)}${t.dataset.destino ? " (el destino)" : ""}`) }),
          segunda: () => ({ segunda: v }),
          maestria: () => ({ maestria: v }),
          reserva: () => ({ reserva: v })
        }[campo]?.();
        if (t.dataset.destino) aLaMesa(this.actor, "El destino elige", `<p>${escH(this.actor.name)}: ${ELECCION[campo].titulo} <b>${escH(campo === "nat" ? NATS[v] : nombreRama(v))}</b>.</p>`, { soloDueno: true });
        if (cambios) correr(this, guardar(this.actor, cambios).then(() => asegurarRasgos(this.actor)).then(() => refrescar(this.actor)));
      },
      moneda(ev, t) { correr(this, gastarMoneda(this.actor, t.dataset.uso)); },
      cerrojo(ev, t) { correr(this, abrirCerrojo(this.actor, Number(t.dataset.n))); },
      cerrar() { const ef = efectoV(this.actor, "cerrojo"); if (ef) correr(this, ef.delete()); },
      aprenderCerrojo() { correr(this, aprenderCerrojo(this.actor)); },
      rearmar() { correr(this, refrescar(this.actor).then(() => asegurarRasgos(this.actor))); },
      // DM
      trazosDM(ev, t) {
        const n = t.dataset.n === "campo" ? Number(valorDe(this, "trazosN")) : Number(t.dataset.n);
        if (n) correr(this, darTrazos(this.actor, n));
      },
      fijarTrazos() { const v = valorDe(this, "trazosFijar"); if (v !== "") correr(this, darTrazos(this.actor, Number(v), { fijarLibres: true })); },
      verbeDM(ev, t) {
        const v = Number(estado(this.actor).valor) || 0;
        const n = t.dataset.n === "lleno" ? maxVerbe(this.actor) - v : Number(t.dataset.n) || 0;
        correr(this, this.actor.update({ [`flags.${MOD}.${F}.valor`]: v + n }));
      },
      aprobar(ev, t) { correr(this, aprobar(t.dataset.id, true)); },
      rechazar(ev, t) { correr(this, aprobar(t.dataset.id, false)); },
      deshacer(ev, t) { correr(this, deshacer(this.actor, t.dataset.id)); },
      async rehacer() {
        const nat = marcado(this, "rehacerNat");
        const principal = marcado(this, "rehacerPrincipal");
        if (!await confirmar("Rehacer desde cero", `<p>Le devuelve a ${escH(this.actor.name)} todos los Trazos de lo que compró (técnicas, rangos, dotes, Control, afinidad, cultivo y Cerrojos)${nat ? ", y vuelve a elegir su naturaleza" : ""}${principal ? ", y su rama principal" : ""}. Se quedan el linaje, la naturaleza oculta, los ojos, los pactos y lo que le diste tú.</p>`)) return;
        correr(this, rehacer(this.actor, { nat, principal }));
      },
      ajustar(ev, t) {
        const campo = t.dataset.campo;
        const valor = valorDe(this, t.dataset.de ?? campo);
        if (valor === "") return rechazar("Elige un valor.", "warn");
        correr(this, ajustar(this.actor, campo, valor, t.dataset.clave ? valorDe(this, t.dataset.clave) : (t.dataset.fijo ?? null)));
      },
      quitarTecnica(ev, t) { correr(this, ajustar(this.actor, "quitarTecnica", t.dataset.id, t.dataset.modo)); },
      mirada() { correr(this, despertarOjo(this.actor, valorDe(this, "mirada"), Number(valorDe(this, "etapa")) || 1, marcado(this, "trasplante"))); },
      lista(ev, t) {
        const v = valorDe(this, t.dataset.campo);
        if (!v) return;
        const e = estado(this.actor);
        correr(this, guardar(this.actor, { [t.dataset.campo]: [...new Set([...(e[t.dataset.campo] ?? []), v])], historial: hist(e, `El DM da: ${t.dataset.texto} ${v}`) })
          .then(() => asegurarRasgos(this.actor)).then(() => refrescar(this.actor)));
      },
      linaje() {
        correr(this, guardar(this.actor, { linaje: valorDe(this, "linaje"), fuerza: valorDe(this, "fuerza"), linajeVisible: marcado(this, "linajeVisible") })
          .then(() => asegurarRasgos(this.actor)).then(() => refrescar(this.actor)));
      },
      oculta() { correr(this, guardar(this.actor, { oc: revolver(valorDe(this, "oculta"), this.actor.id), descubierta: false })); },
      escuela() { correr(this, guardar(this.actor, { escuela: valorDe(this, "escuela") || null })); },
      darTecnica() {
        const tec = tecnicaPorId(valorDe(this, "darTecnica"), this.actor);
        if (tec && !conoce(this.actor, tec.id)) correr(this, aprender(this.actor, tec, { gratis: true, nota: "se la enseña el DM" }));
      },
      guia(ev, t) { abrirGuia(t.dataset.s); },
      choque() { dialogoChoque(); },
      olvidar() { olvidar(this.actor); }
    }
  };

  async _renderHTML() {
    COMO_JUGADOR = game.user.isGM && this.comoJugador;
    try {
      const a = this.actor;
      const e = estado(a);
      if (!e?.despierto) return `<p>${escH(a.name)} no despertó.</p>`;
      const mejora = ["ramas", "dotes", "cultivo", "crear"].includes(this.pestana);
      const pest = [["resumen", "Inicio", "house"], ["jugar", "Mis técnicas", "bolt"], ["tienda", "Aprender", "book-open"],
        ["ramas", "Mejorar", "seedling"], ["guia", "Ayuda rápida", "circle-question"], ...(dm() ? [["dm", "DM", "sliders"]] : [])];
      if (this.pestana === "dm" && !dm()) this.pestana = "resumen";
      const tabs = pest.map(([k, n, icon]) => {
        const activa = this.pestana === k || (k === "ramas" && mejora);
        return `<button type="button" class="${activa ? "activa" : ""} ${k === "dm" ? "dm" : ""}" ${activa ? 'aria-current="page"' : ""} data-action="pestana" data-p="${k}"><i class="fa-solid fa-${icon}" aria-hidden="true"></i> ${n}</button>`;
      }).join("");
      const subnav = mejora ? `<nav class="ev-subnav" aria-label="Cómo quieres mejorar">${[["ramas", "Especialidades"], ["dotes", "Dotes"], ["cultivo", "Entrenar técnicas"], ["crear", "Inventar una técnica"]].map(([k, n]) => `<button type="button" data-action="pestana" data-p="${k}" ${this.pestana === k ? 'aria-current="page"' : ""}>${n}</button>`).join("")}</nav>` : "";
      const cuerpo = ({ guia: () => this.#guia(), resumen: () => this.#resumen(), jugar: () => this.#jugar(), ramas: () => this.#ramas(), tienda: () => this.#tienda(), dotes: () => this.#dotes(),
        cultivo: () => this.#cultivo(), crear: () => this.#crear(), dm: () => this.#dm() })[this.pestana]?.() ?? "";
      return `${this.#cabecera()}<nav class="ecos-verbe-tabs" aria-label="Panel del Verbe">${tabs}</nav><section class="ecos-verbe-cuerpo" aria-label="${escH(pest.find(([k]) => k === this.pestana)?.[1] ?? "Mejorar")}">${subnav}${cuerpo}</section>`;
    } finally {
      COMO_JUGADOR = false;
    }
  }

  _replaceHTML(result, content) {
    const anterior = content.querySelector(".ecos-verbe-cuerpo");
    const scroll = this._paginaAnterior === this.pestana ? anterior?.scrollTop ?? 0 : 0;
    const activo = content.contains(document.activeElement) ? document.activeElement : null;
    const foco = activo?.matches?.('input[type="search"]') ? { filtro: activo.dataset.filtro ?? activo.dataset.filtroDote ?? activo.dataset.filtroUso,
      atributo: activo.hasAttribute("data-filtro") ? "data-filtro" : activo.hasAttribute("data-filtro-dote") ? "data-filtro-dote" : "data-filtro-uso",
      inicio: activo.selectionStart, fin: activo.selectionEnd } : null;
    content.innerHTML = result;
    this._paginaAnterior = this.pestana;
    const cuerpo = content.querySelector(".ecos-verbe-cuerpo");
    if (cuerpo) cuerpo.scrollTop = scroll;
    if (foco) {
      const siguiente = content.querySelector(`[${foco.atributo}="${foco.filtro}"]`);
      siguiente?.focus({ preventScroll: true }); siguiente?.setSelectionRange(foco.inicio, foco.fin);
    }
    content.querySelectorAll("[data-filtro]").forEach(i => i.addEventListener("change", ev => {
      const k = ev.target.dataset.filtro;
      this.filtro[k] = ev.target.type === "checkbox" ? ev.target.checked : ev.target.value;
      if (k !== "solo") this.abiertos = null;
      this.render();
    }));
    content.querySelectorAll("[data-filtro-dote]").forEach(i => i.addEventListener("change", ev => {
      this.filtroDote[ev.target.dataset.filtroDote] = ev.target.type === "checkbox" ? ev.target.checked : ev.target.value;
      this.render();
    }));
    content.querySelectorAll("[data-filtro-uso]").forEach(i => i.addEventListener("change", ev => {
      this.filtroUso[ev.target.dataset.filtroUso] = ev.target.type === "checkbox" ? ev.target.checked : ev.target.value;
      this.render();
    }));
    // Grupos que el jugador abre o cierra: se recuerdan mientras el panel esté abierto.
    content.querySelectorAll("details.ecos-verbe-grupo").forEach(d => d.addEventListener("toggle", () => {
      this.abiertos ??= new Set([...content.querySelectorAll("details.ecos-verbe-grupo[open]")].map(x => x.dataset.g));
      if (d.open) this.abiertos.add(d.dataset.g); else this.abiertos.delete(d.dataset.g);
    }));
    // La ficha completa se arma al desplegar (así la tienda carga rápido).
    content.querySelectorAll("details.ecos-verbe-tec").forEach(d => d.addEventListener("toggle", () => {
      if (!d.open || d.dataset.lleno) return;
      COMO_JUGADOR = game.user.isGM && this.comoJugador;
      try { d.querySelector(".ecos-verbe-ficha-cont").innerHTML = d.dataset.tipo === "dote" ? this.#fichaDote(d.dataset.id) : this.#fichaTec(d.dataset.id); }
      finally { COMO_JUGADOR = false; }
      d.dataset.lleno = "1";
    }));
    // Al cambiar una lista, se explica lo que se está mirando (sin elegirlo todavía).
    content.querySelectorAll("select[data-desc]").forEach(sel => sel.addEventListener("change", () => {
      const caja = content.querySelector(`.ecos-verbe-desc[data-de="${sel.name}"]`);
      if (!caja) return;
      COMO_JUGADOR = game.user.isGM && this.comoJugador;
      try { caja.innerHTML = describir(sel.dataset.desc, sel.value, this.actor); } finally { COMO_JUGADOR = false; }
    }));
  }

  #cabecera() {
    const a = this.actor;
    const e = estado(a);
    const max = maxVerbe(a);
    const v = Number(e.valor) || 0;
    const t = trazos(a);
    const pct = max ? Math.clamp(Math.abs(v) / max, 0, 1) : 0;
    const barraDM = game.user.isGM ? `<details class="ecos-verbe-dmbar"><summary><i class="fa-solid fa-sliders" aria-hidden="true"></i> Herramientas del DM ${this.comoJugador ? "· vista del jugador" : ""}</summary><div><b>Trazos:</b>
        ${[-1, 1, 2, 5].map(n => `<button type="button" data-action="trazosDM" data-n="${n}">${n > 0 ? "+" : ""}${n}</button>`).join("")}
        · <button type="button" data-action="verbeDM" data-n="lleno">Llenar Verbe</button>
        · <button type="button" data-action="comoJugador" class="${this.comoJugador ? "activo" : ""}"><i class="fa-solid fa-eye"></i> ${this.comoJugador ? "Viendo como el jugador" : "Ver como el jugador"}</button></div></details>` : "";
    return `<header class="ecos-verbe-cabpanel">
      <div class="ev-identidad"><span class="ev-kicker">EL VERBE · NIVEL ${nivelDe(a)}</span><strong>${escH(a.name)}</strong><small>${e.principal ? nombreRama(e.principal) : "Tu aventura empieza aquí"}${e.nats?.length ? ` · ${[...natsDe(a)].map(n => escH(nombreNat(n))).join(" + ")}` : ""}</small></div>
      <div class="ecos-verbe-res"><div class="ev-recurso-titulo"><b><i class="fa-solid fa-droplet" aria-hidden="true"></i> Verbe <span>${v} / ${max}</span></b><small>ENERGÍA PARA USAR</small></div><div class="ecos-verbe-barra grande ${v < 0 ? "negativo" : ""}" role="meter" aria-label="${v < 0 ? "Deuda de Verbe" : "Reserva de Verbe"}" aria-valuemin="${v < 0 ? limiteNegativo(a) : 0}" aria-valuemax="${max}" aria-valuenow="${v}" aria-valuetext="${v} de ${max} de Verbe"><div style="width:${pct * 100}%"></div></div>
        <small>${v < 0 ? "Estás en deuda: recuperarla cuesta el doble." : "Se gasta al usar técnicas; vuelve al descansar."}</small></div>
      <div class="ecos-verbe-trazos ${t.libres > 0 ? "hay" : ""}"><span class="n">${t.libres}</span><span class="t"><b>Trazos</b> para aprender</span><small>Se gastan una vez por compra</small></div>
    </header>${barraDM}`;
  }

  #tarjeta(t, { aprender: compra = false, item = null } = {}) {
    const a = this.actor;
    const meta = item?.getFlag(MOD, F) ?? { ...t.item.flags[MOD][F], infusion: estado(a)?.infusiones?.[t.id] ?? null };
    const uso = previsualizarUso(a, meta);
    const r = compra ? requisitos(a, t) : null;
    const defensa = !compra && !!D.defensas?.[t.id];
    return tarjetaHTML({ id: t.id, nombre: item?.name ?? t.n, texto: textoDe(t), grado: t.g, rama: nombreRama(t.rama),
      naturaleza: meta.infusion || t.nat ? nombreNat(meta.infusion || t.nat) : null,
      tiempo: TIEMPO_L[t.t] ?? t.t ?? "Ver ficha", alcance: t.alc ? alcanceL(t.alc) : "Ver ficha", area: t.area,
      costo: uso.costo, trazos: compra ? t.trazos : null,
      accion: compra ? "aprender" : defensa ? "ficha" : "usar", boton: compra ? `${r.pideDM && !game.user.isGM ? "Pedir al DM" : "Aprender"} · ${t.trazos} ${t.trazos === 1 ? "Trazo" : "Trazos"}` : defensa ? "Cómo usar esta defensa" : "Usar técnica",
      bloqueada: compra ? !r.ok || r.probar : !defensa && !uso.ok,
      riesgo: !compra && uso.ok && uso.despues < 0,
      estado: compra ? `<p class="ev-disponibilidad">${r.ok ? `Te quedarán ${trazos(a).libres - t.trazos} Trazos después de aprenderla.` : escH(r.motivo)}</p>` : estadoUsoHTML(uso),
      nota: compra ? (r.pideDM ? "Requiere aprobación del DM antes de aprenderla." : "Aprender no gasta Verbe. Lo gastarás al usarla.")
        : defensa ? "Con midi-qol, se ofrece al recibir un ataque. Sin esa integración, resuélvela con el DM. El coste final depende del ataque."
          : (uso.extra ? `Incluye ${uso.extra} Verbe extra por el objetivo marcado.` : t.g > 0 && gradoUsable(a, meta) > t.g ? "Puedes elevar el grado en la ventana de uso; el coste aumentará." : "Marca el objetivo si afecta a otra criatura.") });
  }

  #inicio() {
    const a = this.actor, e = estado(a), tecnicas = itemsTecnica(a).length;
    const paso = pasoInicial({ naturalezas: [...natsDe(a)], principal: e.principal, tecnicas });
    const titulos = ["", "¿Qué elemento responde a ti?", "¿Cómo quieres usar tu poder?", "Aprende tu primera técnica", "Ya puedes entrar en acción"];
    let contenido;
    if (paso === 1) contenido = `<p>Elige un elemento por su estilo. Funciona con cualquier especialidad. Verás una confirmación antes de guardarlo.</p><div class="ev-elecciones">${Object.entries(NATS).map(([n, nombre]) => `<button type="button" class="ev-eleccion ${n}" data-action="elegir" data-campo="nat" data-valor="${n}"><span class="ev-elemento" aria-hidden="true">${({ fuego: "✦", agua: "≈", viento: "≋", tierra: "◆", rayo: "ϟ" })[n]}</span><strong>${nombre}</strong><small>${escH(ESTADOS[ESTADO_NAT[n][0]].texto)}</small><span>Elegir ${nombre} →</span></button>`).join("")}</div>`;
    else if (paso === 2) contenido = `<p>Tu especialidad se llama <b>rama principal</b>. Empiezas Entrenado gratis; puedes aprender otras ramas después.</p><div class="ev-elecciones ramas">${ramasLibres().map(([id, nombre]) => {
      const [icon, rol, desc] = ROLES_RAMA[id] ?? ["sparkles", nombre, "Explora sus técnicas."];
      return `<button type="button" class="ev-eleccion" data-action="elegir" data-campo="principal" data-valor="${id}"><i class="fa-solid fa-${icon}" aria-hidden="true"></i><strong>${nombre}</strong><b>${rol}</b><small>${desc}</small><span>Elegir ${nombre} →</span></button>`;
    }).join("")}</div>`;
    else if (paso === 3) {
      const candidatos = [...D.tecnicas, ...extraMundo()].filter(t => visibleJugador(t) && t.g <= 1 && !conoce(a, t.id))
        .filter(t => { const r = requisitos(a, t); return r.ok && !r.probar && !r.pideDM; })
        .sort((x, y) => Number(y.rama === e.principal) - Number(x.rama === e.principal) || Number(!!y.nat) - Number(!!x.nat) || x.g - y.g).slice(0, 3);
      contenido = `<p>Aprender cuesta <b>Trazos</b> una sola vez. Usar después la técnica cuesta <b>Verbe</b>. Estas opciones encajan con tus elecciones; tú decides.</p>
        ${candidatos.length ? `<div class="ev-tarjetas">${candidatos.map(t => this.#tarjeta(t, { aprender: true })).join("")}</div>` : `<p class="ev-vacio">Ahora no hay una opción disponible con tus Trazos y requisitos. Puedes revisar el catálogo y ver qué te falta.</p>`}
        <p><button type="button" data-action="pestana" data-p="tienda">Explorar todas las técnicas</button> <small>Puedes guardar Trazos para más adelante.</small></p>`;
    } else contenido = `<p>Conoces <b>${tecnicas} ${tecnicas === 1 ? "técnica" : "técnicas"}</b>. Abre tu repertorio, elige qué hacer y usa el botón de la técnica.</p><div class="ev-acciones"><button type="button" class="ev-principal" data-action="pestana" data-p="jugar"><i class="fa-solid fa-bolt" aria-hidden="true"></i> Usar mis técnicas</button><button type="button" data-action="pestana" data-p="tienda">Aprender algo nuevo</button></div>
      <div class="ev-mini-pasos"><span><b>1</b> Marca el objetivo, si hace falta</span><span><b>2</b> Pulsa «Usar técnica»</span><span><b>3</b> Resuelve la ventana de dnd5e</span></div><p class="ev-nota">El gasto se comprueba al confirmar el uso. La posición, la visibilidad y los efectos narrativos se resuelven con el DM.</p>`;
    return `${avisosJugadorHTML(a)}${progresoHTML(paso)}<section class="ev-bienvenida"><span class="ev-kicker">${paso < 4 ? `TU SIGUIENTE PASO · ${paso} DE 3` : "TU REPERTORIO ESTÁ PREPARADO"}</span><h2>${titulos[paso]}</h2>${contenido}</section>`;
  }

  #jugar() {
    const a = this.actor, f = this.filtroUso;
    const conocidas = itemsTecnica(a).map(item => ({ item, t: tecnicaPorId(item.getFlag(MOD, F).id, a) })).filter(x => x.t);
    const lista = conocidas.filter(({ item, t }) => !f.texto || `${item.name} ${textoDe(t)}`.toLowerCase().includes(f.texto.toLowerCase()))
      .filter(({ item }) => !f.solo || previsualizarUso(a, item.getFlag(MOD, F)).ok);
    return `${avisosJugadorHTML(a)}<div class="ev-titulo-pagina"><div><span class="ev-kicker">TU REPERTORIO</span><h2>¿Qué quieres hacer?</h2><p>Usa una técnica desde aquí. Se abrirá la ventana habitual de dnd5e para confirmar el uso.</p></div><span class="ev-contador">${conocidas.length} conocidas</span></div>
      <div class="ev-instruccion"><i class="fa-solid fa-crosshairs" aria-hidden="true"></i><span><b>Si afecta a otro, marca su token antes de usarla.</b> El alcance y las condiciones de cada técnica siguen contando.</span></div>
      <div class="ecos-verbe-filtros"><label class="ev-busqueda"><span>Buscar en mis técnicas</span><input type="search" data-filtro-uso="texto" placeholder="Nombre o efecto…" value="${escH(f.texto)}"></label><label><input type="checkbox" data-filtro-uso="solo" ${f.solo ? "checked" : ""}> Ocultar las bloqueadas por recursos o estado</label></div>
      ${lista.length ? `<div class="ev-tarjetas">${lista.map(({ t, item }) => this.#tarjeta(t, { item })).join("")}</div>` : `<div class="ev-vacio"><h3>${conocidas.length ? "Ninguna coincide con ese filtro" : "Tu primera técnica te espera"}</h3><p>${conocidas.length ? "Quita el filtro para ver los bloqueos y sus motivos." : "Aprende una técnica con Trazos. Después aparecerá aquí lista para usarla."}</p><button type="button" data-action="pestana" data-p="tienda">Ir a Aprender</button></div>`}`;
  }

  #guia() {
    const a = this.actor, e = estado(a), v = Number(e.valor) || 0;
    const max = maxVerbe(a), santuario = cambiosRecuperacion(a, Math.floor(max / 2));
    const intemperie = cambiosRecuperacion(a, Math.floor(max / 4));
    const preguntas = [
      ["¿Qué hago para usar una técnica?", "Abre Mis técnicas. Si afecta a otro, marca su token. Pulsa Usar técnica y resuelve la ventana de dnd5e. El Verbe se comprueba y descuenta al confirmar. Respeta la acción, el alcance y las condiciones de la ficha. También puedes usarla desde Técnicas del Verbe en tu hoja."],
      ["¿Qué diferencia hay entre Verbe y Trazos?", "Verbe es energía: la gastas al actuar y vuelve al descansar. Trazos son puntos para aprender técnicas y comprar mejoras: pagas una vez y lo aprendido permanece. No se cambian automáticamente entre sí. Puedes guardar Trazos."],
      ["¿Qué significa grado, rango o afinidad?", "Grado es la potencia de una técnica. Rango es tu formación en una rama y limita qué técnicas aprendes o elevas. Afinidad es lo bien que manejas tu elemento. En Mejorar verás qué te aporta la siguiente compra y sus requisitos."],
      ["¿Por qué no puedo aprender o usar algo?", "Cada opción muestra el motivo: Trazos insuficientes, nivel, rango, naturaleza, energía, reacción ocupada o un estado. Aprender y usar tienen requisitos distintos. Si pide maestro o un permiso de la historia, el botón envía la solicitud al DM; no concede el poder al instante."],
      ["¿Qué pasa si no me queda energía?", `Puedes entrar en sobreesfuerzo hasta ${limiteNegativo(a)} de Verbe. Cada gasto que queda en negativo exige Constitución o gana Agotamiento. Con Agotamiento 4 no puedes gastar en negativo. Recuperar cada punto de deuda cuesta dos; los puntos impares se guardan. Las técnicas de grado 0 necesitan al menos 1 de Verbe.`],
      ["¿Cuánto recupero al descansar?", `Sin mejoras, un Descanso Largo en Santuario recupera ${Math.floor(max / 2)} puntos de recuperación y una noche a la intemperie ${Math.floor(max / 4)}. Con tu reserva actual (${v}), quedarías en ${santuario.valor} o ${intemperie.valor}, respectivamente. Las dotes pueden modificar esas cantidades; el descanso real aplica tus mejoras. La deuda siempre se paga al doble.`],
      ["¿Cómo funcionan mis acciones y reacciones?", "La ficha indica Acción, Acción adicional, Reacción o un tiempo más largo. Usar la técnica no te regala una acción extra. Si ya gastaste tu reacción o estás Cargado, las defensas y técnicas de reacción quedan bloqueadas hasta recuperarla."],
      ["¿Qué pasa con las heridas?", "Recuperar PG no borra Malherido ni Herida No Tratada. Busca tratamiento y reposo. Si estás Acechado por la Muerte, no puedes tomar acciones, acciones adicionales ni reacciones: pide ayuda y sigue las indicaciones de tu estado. El Santuario mejora el descanso; fuera de él recuperas menos."],
      ["¿Cómo mejoro sin equivocarme?", "En Mejorar puedes subir tu especialidad, comprar una dote o entrenar una técnica conocida. Mira el coste y lo que ganas antes de elegir. Inventar técnicas es opcional y requiere al DM; el oro y los días de entrenamiento se resuelven en mesa. Si compras algo por error, el DM puede deshacerlo."],
      ["¿Qué hace automáticamente el módulo?", "Administra compras, energía, tiradas y varios estados. El DM decide objetivos válidos, posición, ilusiones, invocaciones y efectos narrativos. Las defensas automáticas requieren midi-qol y pueden necesitar ajustes de mesa en críticos o áreas. Una descripción no significa que todo su efecto ocurra solo."]
    ];
    return `<div class="ev-titulo-pagina"><div><span class="ev-kicker">UNA DUDA, UNA RESPUESTA</span><h2>Lo necesario para jugar</h2><p>Abre solo la pregunta que tengas ahora. Puedes aprender jugando desde el panel.</p></div></div>
      <div class="ev-contraste-recursos"><div><i class="fa-solid fa-droplet" aria-hidden="true"></i><b>Verbe = actuar</b><span>Se gasta por uso. Se recupera descansando.</span></div><div><i class="fa-solid fa-pen-nib" aria-hidden="true"></i><b>Trazos = aprender</b><span>Compras una mejora y la conservas.</span></div></div>
      <div class="ev-preguntas">${preguntas.map(([q, r]) => `<details><summary>${q}</summary><p>${escH(r)}</p></details>`).join("")}</div>
      <p class="ev-nota">Para consultar una excepción o profundizar, tienes la guía de referencia.</p><button type="button" data-action="guia" data-s="">Abrir referencia completa</button>`;
  }

  #resumen() {
    const a = this.actor;
    const e = estado(a);
    const t = trazos(a);
    const cd = 8 + competencia(a) + modDe(a, e.car);
    const lin = linajeDe(a);
    const natsTxt = [...natsDe(a)].map(n => `${NATS[n] ?? n}${afinidadDe(a, n) > 1 ? ` (${["", "", "Entrenada", "Maestra"][afinidadDe(a, n)]})` : ""}`).join(", ");
    const pasos = this.#inicio();
    const el = [];
    if (tieneDote(a, "rama-segunda") && !e.segunda) el.push(this.#elegirSimple("segunda", "Rama segunda: elige tu segunda rama principal (sus rangos cuestan 1 Trazo menos).", ramasLibres().filter(([k]) => k !== e.principal), "rama"));
    if (tieneDote(a, "maestria-control") && !e.maestria) el.push(this.#elegirSimple("maestria", "Maestría del Control: elige la rama cuyas técnicas te cuestan 1 Verbe menos.", D.ramas.filter(r => ramaAbierta(a, r.id)).map(r => [r.id, r.nombre]), "rama"));
    if (tieneDote(a, "tecnica-reserva") && !e.reserva) {
      const topeR = nivelDe(a) >= 9 ? 3 : (nivelDe(a) >= 5 ? 2 : 1);
      const ops = itemsTecnica(a).map(i => tecnicaPorId(i.getFlag(MOD, F).id, a)).filter(x => x && x.g >= 1 && x.g <= topeR).map(x => [x.id, x.n]);
      if (ops.length) el.push(this.#elegirSimple("reserva", `Técnica de reserva: una técnica de grado ${topeR} o menos; una vez por Descanso Largo la usas sin gastar Verbe.`, ops, "tec"));
    }
    const linFila = (lin && veLinaje(a))
      ? `${escH(nombreLinaje(lin))} (${FUERZA[e.fuerza]?.nombre ?? "—"})${dm() && !e.linajeVisible ? " · <i>el jugador no lo sabe</i>" : ""}`
      : "Desconocido. Hay cosas de tu sangre que no tienes manera de saber; si las hay, aparecen jugando.";
    const oc = ocultaDe(a);
    const ocFila = e.descubierta ? `Descubriste una segunda naturaleza: ${NATS[oc] ?? ""}.`
      : `Puede que tu Verbe responda a otra naturaleza que no conoces. Se intenta descubrir con «Probar» en Aprender; si responde, aprender la técnica cuesta los Trazos indicados.${dm() && oc ? ` <i>Oculta: ${NATS[oc]}</i>` : ""}`;
    const cerrAbierto = efectoV(a, "cerrojo");
    const cerr = (Number(e.cerrojos) || 0) ? `<h3>Siete Cerrojos</h3><p>${D.cerrojos.filter(c => c.n <= e.cerrojos).map(c =>
      `<button type="button" data-action="cerrojo" data-n="${c.n}" data-tooltip="${escH(c.da)} · cuesta ${costoGrado(c.grado)} Verbe y una prueba de Control CD ${10 + (2 * c.n)} · ${c.pg ? `${c.pg} PG por turno` : "sin PG"}">Abrir hasta el ${c.n} · ${escH(c.nombre)}</button>`).join(" ")}
      ${cerrAbierto ? ` <button type="button" data-action="cerrar">Cerrar (${escH(cerrAbierto.name)})</button>` : ""}</p>` : "";
    const monedas = Number(a.system?.currency?.soul) || 0;
    const recMoneda = cambiosRecuperacion(a, 2 * competencia(a));
    const monedasNivel = Number(e.monedas?.[nivelDe(a)]) || 0;
    const mon = monedas ? `<section class="ev-reponer"><div><span class="ev-kicker">RECURSO OPCIONAL</span><h3>${monedas} ${monedas === 1 ? "Moneda Antigua" : "Monedas Antiguas"}</h3><p>Gastas una moneda por botón. Elige energía para ahora o un Trazo para aprender.</p></div><div><button type="button" data-action="moneda" data-uso="verbe">Gastar 1 moneda → quedar en ${recMoneda.valor} Verbe${recMoneda.recResto ? " + 1 punto guardado" : ""}</button>
      <button type="button" data-action="moneda" data-uso="trazo" ${monedasNivel >= 2 ? "disabled" : ""}>Gastar 1 moneda → +1 Trazo</button><small>${monedasNivel} de 2 conversiones a Trazo usadas en este nivel.</small></div></section>` : "";
    const ctl = Number(a.system?.skills?.cvb?.value) || 0;
    return `${pasos}${el.join("")}
      <div class="ev-estadisticas"><div><small>CD de tus técnicas</small><b>${cd}</b><span>El rival debe igualar o superar esta dificultad.</span></div><div><small>Ataque con Verbe</small><b>${competencia(a) + modDe(a, e.car) >= 0 ? "+" : ""}${competencia(a) + modDe(a, e.car)}</b><span>La técnica puede usar otra característica.</span></div><div><small>Grado máximo por nivel</small><b>${gradoMax(a)}</b><span>Cada rama también tiene su propio límite.</span></div></div>
      ${mon}<details class="ev-ficha-personal"><summary>Mi personaje: afinidades, linaje y otros detalles</summary>
      <table class="ecos-verbe-datos">
        <tr><th>Característica ${ayuda("car")}</th><td>${CARS[e.car]} · CD de tus técnicas <b>${cd}</b> · ataque <b>+${competencia(a) + modDe(a, e.car)}</b></td></tr>
        <tr><th>Naturaleza</th><td>${natsTxt || "por elegir"}</td></tr>
        <tr><th>Otra naturaleza</th><td>${ocFila}</td></tr>
        ${(e.combos ?? []).length ? `<tr><th>Combinaciones</th><td>${e.combos.map(nombreNat).join(", ")}</td></tr>` : ""}
        <tr><th>Linaje</th><td>${linFila}</td></tr>
        <tr><th>Rama principal</th><td>${e.principal ? nombreRama(e.principal) : "por elegir"}${e.segunda ? ` · segunda: ${nombreRama(e.segunda)}` : ""}${e.escuela ? ` · ${escH(e.escuela)}` : ""}</td></tr>
        <tr><th>Grado máximo ${ayuda("grado")}</th><td>${gradoMax(a)} (eres nivel ${nivelDe(a)}) · ${gradoMax(a) < GRADO_TOPE ? `el grado ${gradoMax(a) + 1} llega en el nivel ${nivelParaGrado(gradoMax(a) + 1)}` : "es el grado más alto"}</td></tr>
        <tr><th>Control del Verbe ${ayuda("control")}</th><td>${["Sin competencia", "Competente", "Pericia"][Math.min(2, ctl)]} (se compra en Ramas)</td></tr>
        <tr><th>Sobreesfuerzo ${ayuda("sobre")}</th><td>Puedes gastar Verbe que no tienes hasta llegar a ${limiteNegativo(a)}.</td></tr>
        ${Object.keys(e.miradas ?? {}).length ? `<tr><th>Ojos</th><td>${Object.entries(e.miradas).map(([k, n]) => `${escH(D.miradas.find(m => m.id === k)?.nombre ?? k)}, etapa ${n}${(e.trasplantes ?? []).includes(k) ? " (trasplantado)" : ""}`).join("; ")}</td></tr>` : ""}
        ${(e.pactos ?? []).length ? `<tr><th>Pactos</th><td>${e.pactos.map(p => escH(nombrePacto(p))).join(", ")}</td></tr>` : ""}
      </table></details>
      ${cerr ? `<details class="ev-ficha-personal"><summary>Siete Cerrojos · poder con coste de PG y Agotamiento</summary>${cerr}</details>` : ""}
      <details><summary>Historial</summary><ul>${(e.historial ?? []).slice().reverse().map(h => `<li>${escH(h)}</li>`).join("")}</ul></details>`;
  }

  #elegirSimple(campo, texto, pares, tipoDesc) {
    return `<div class="ecos-verbe-eleccion"><p>${texto}</p><p><select name="${campo}" data-desc="${tipoDesc}"><option value="">— Mira las opciones —</option>${opciones(pares, "")}</select>
      <button type="button" data-action="elegir" data-campo="${campo}">Elegir</button></p><div class="ecos-verbe-desc" data-de="${campo}">${describir(tipoDesc, "")}</div></div>`;
  }

  #ramas() {
    const a = this.actor;
    const e = estado(a);
    const ultimo = ultimoRango();
    const tabla = `<table class="ecos-verbe-tabla"><tr><th>Rango</th><th>Aprendes técnicas de la rama hasta</th><th>Pide</th><th>Cuesta</th><th>Te da</th></tr>
      ${D.rangos.map((r, i) => `<tr><td><b>${r.nombre}</b></td><td>grado ${r.grado}</td><td>${r.nivel > 1 ? `nivel ${r.nivel}` : "—"}</td>
        <td>${i ? `${r.trazos} Trazo${r.trazos === 1 ? "" : "s"} (${Math.max(0, r.trazos - 1)} en tu rama principal)` : "gratis: toda rama abierta empieza aquí"}</td>
        <td>${i >= 2 ? `${i - 1} dado${i > 2 ? "s" : ""} más en sus técnicas que dañan o curan, y su ${ORD_DON[i - 2].toLowerCase()} don` : "—"}</td></tr>`).join("")}</table>`;
    const filas = D.ramas.map(r => {
      const vePropia = r.id !== "sangre" || veLinaje(a);
      const abierta = vePropia && ramaAbierta(a, r.id);
      const rg = rangoDe(a, r.id);
      const principal = e.principal === r.id;
      const sig = rg < ultimo ? D.rangos[rg + 1] : null;
      const c = sig ? costoRango(a, r.id, rg + 1) : null;
      const faltaNivel = !!sig && nivelDe(a) < sig.nivel;
      const faltanTrazos = sig ? Math.max(0, c - trazos(a).libres) : 0;
      const puede = abierta && sig && !faltaNivel && !faltanTrazos;
      const don = D.dones.find(x => x.rama === r.nombre);
      const dones = (don && vePropia) ? DONES_K.map((k, i) => {
        const tiene = rangoDon(a, r.id) >= i + 2;
        const [nombre, texto] = partirDon(donDe(don, k));
        const llega = principal ? D.rangos[i + 1]?.nombre : D.rangos[i + 2]?.nombre;
        const cuando = tiene ? "ya lo tienes" : `llega cuando subas a ${llega}${principal ? " (un rango antes, por ser tu rama principal)" : ""}`;
        return `<li class="${tiene ? "tiene" : ""}"><b>${ORD_DON[i]} don · ${escH(nombre)}</b> <span class="ecos-nota">${cuando}</span><br>${escH(texto)}</li>`;
      }).join("") : "";
      const cerradaPor = { pulso: "Se abre con la dote Control fino del Verbe (Mejorar → Dotes).", mirada: "Se abre si despierta un ojo, en la historia.",
        pacto: "Se abre con un pacto que se gana en la historia.", sangre: "Se abre con una herencia de sangre. No tienes manera de saber si la tienes; si es así, la historia lo dirá." }[r.id] ?? "La abre el DM.";
      const extra = (c !== null && !principal && ordenRama(a, r.id) >= 2) ? " (incluye 1 de más por ser tu tercera rama o más)" : "";
      const ahora = abierta
        ? `Rango <b>${nombreRango(rg)}</b> · tu límite ahora es <b>grado ${Math.min(gradoMax(a), rangoGrado(rg))}</b>${rg >= 2 ? ` · +${rg - 1} dado${rg > 2 ? "s" : ""} al dañar o curar` : ""}.`
        : "<b>Cerrada</b>.";
      const ayudaSig = sig ? `${sig.nombre}: aprendes hasta grado ${sig.grado}${rg + 1 >= 2 ? `, sus técnicas que dañan o curan tiran ${rg} dado${rg > 1 ? "s" : ""} más` : ""}. Pide nivel ${sig.nivel}. Cuesta ${c} Trazo${c === 1 ? "" : "s"}${extra}.` : "";
      const boton = (sig && abierta) ? `<button type="button" data-action="rango" data-rama="${r.id}" ${puede ? "" : "disabled"} data-tooltip="${escH(ayudaSig)}">Subir a ${sig.nombre} · ${c} Trazo${c === 1 ? "" : "s"}</button>${faltaNivel ? ` <span class="ecos-nota">Necesitas nivel ${sig.nivel}.</span>` : faltanTrazos ? ` <span class="ecos-nota">Te faltan ${faltanTrazos} Trazos.</span>` : ""}`
        : (abierta ? `<span class="ecos-nota">Es el rango más alto.</span>` : "");
      return `<section class="ecos-verbe-rama ${abierta ? "" : "cerrada"}">
        <header><b>${r.nombre}</b>${principal ? " <span class='ecos-verbe-pill'>principal</span>" : ""}${e.segunda === r.id ? " <span class='ecos-verbe-pill'>segunda</span>" : ""}
          <span>${ahora}</span>${boton}</header>
        <p class="ecos-nota">${abierta || r.id !== "sangre" ? escH(leadDe(r)) : ""} ${abierta ? "" : `<b>${cerradaPor}</b>`}</p>${dones ? `<details class="ev-dones"><summary>Qué dones gano en esta rama</summary><ul class="ecos-verbe-dones">${dones}</ul></details>` : ""}</section>`;
    }).join("");
    const af = [...natsDe(a)].map(n => {
      const v = Number(e.afinidad?.[n]) || 1;
      return `<li><b>${NATS[n] ?? n}</b>: ${["", "Despierta", "Entrenada", "Maestra"][v]} ${v < 3 ? `<button type="button" data-action="afinidad" data-nat="${n}" data-tooltip="${v === 1 ? "+1 dado a sus técnicas e infusiones, y sus estados duran el doble" : "+2 dados en vez de +1, y quien falla contra ella no resiste su daño"}">Subir a ${v === 1 ? "Entrenada" : "Maestra"} · ${v === 1 ? 2 : 4} Trazos (nivel ${v === 1 ? 5 : 11}, pide un maestro)</button>` : ""}</li>`;
    }).join("");
    const ctl = Number(a.system?.skills?.cvb?.value) || 0;
    const cerr = Number(e.cerrojos) || 0;
    const sigC = D.cerrojos[cerr];
    return `${intro("Cada rama es un tipo de técnica (Forma, Velo, Cuerpo…).", "Tu rango en una rama dice hasta qué grado puedes aprender técnicas de ella. Se sube con Trazos; desde Experto, sus técnicas que dañan o curan tiran dados de más y ganas los dones de la rama.",
      `<p>Tu <b>rama principal</b> empieza en Entrenado gratis, cada rango le cuesta 1 Trazo menos y sus dones llegan un rango antes. Desde la <b>tercera rama</b> que entrenes, cada rango cuesta 1 Trazo más: conviene especializarse.</p>${tabla}`, "ramas-y-rangos")}
      ${filas}
      <h3>Afinidad con tu naturaleza</h3><p class="ecos-nota">Qué tan bien manejas tu elemento. Entrenada: sus técnicas tiran 1 dado más y sus estados duran el doble. Maestra: 2 dados más, y quien falla contra ella no resiste su daño.</p><ul>${af || "<li>Primero elige tu naturaleza (Inicio).</li>"}</ul>
      <h3>Control del Verbe ${ayuda("control")}</h3><p>${["Sin competencia", "Competente", "Pericia"][Math.min(2, ctl)]}. ${ctl < 2 ? `<button type="button" data-action="control" data-tooltip="${ctl === 0 ? "Sumas tu competencia a las pruebas de Control" : "Sumas el doble de tu competencia"}">${ctl === 0 ? "Volverte competente · 2 Trazos" : "Pericia · 3 Trazos (nivel 5)"}</button>` : ""}</p>
      <h3>Siete Cerrojos</h3><p class="ecos-nota">Un estado de Cuerpo: pegas más fuerte y más rápido, pagando PG cada turno y Agotamiento al cerrar. <a class="ecos-verbe-guia" data-action="guia" data-s="siete-cerrojos"><i class="fa-solid fa-book-open"></i> Guía</a></p>
      <p>${cerr ? `Sabes hasta el ${cerr}.` : "No sabes ninguno."} ${sigC ? `<button type="button" data-action="aprenderCerrojo" data-tooltip="${escH(`${sigC.nombre}: ${sigC.da}. Grado ${sigC.grado}.`)}">Aprender el ${sigC.n} · ${escH(sigC.nombre)} · ${sigC.grado} Trazo${sigC.grado === 1 ? "" : "s"}</button>` : ""}</p>`;
  }

  #tienda() {
    const a = this.actor;
    const e = estado(a);
    const f = this.filtro;
    const ve = veLinaje(a);
    const lista = [...D.tecnicas, ...extraMundo(), ...(e.propias ?? []).filter(t => !t.modo)].filter(t => {
      if (f.rama && t.rama !== f.rama) return false;
      if (f.grado !== "" && String(t.g) !== String(f.grado)) return false;
      if (f.nat && t.nat !== f.nat) return false;
      if (f.texto && !`${t.n} ${textoDe(t)}`.toLowerCase().includes(f.texto.toLowerCase())) return false;
      if (!dm()) {
        if (t.soloDM) return false;
        const esSangre = t.sec === "sangre" || D.linajes.some(l => l.req && l.req === t.req);
        if (esSangre && (!ve || !herenciaDe(a) || (t.req !== "una herencia" && herenciaDe(a).req !== t.req))) return false;
        if (t.rama === "mirada" && !(e.miradas ?? {})[t.id.split("-")[1]]) return false;
      }
      return true;
    });
    const porGrupo = new Map();
    let ocultas = 0;
    for (const t of lista) {
      const r = requisitos(a, t);
      const sabe = conoce(a, t.id);
      if (f.solo && !r.ok && !sabe) { ocultas += 1; continue; }
      const g = f.agrupar === "grado" ? [`g${t.g}`, `Grado ${t.g} · pide nivel ${nivelParaGrado(t.g)}`, t.g] : grupoDe(t);
      if (!porGrupo.has(g[0])) porGrupo.set(g[0], { titulo: g[1], orden: g[2], filas: [], pueden: 0 });
      const gr = porGrupo.get(g[0]);
      gr.filas.push({ t, r, sabe });
      if (r.ok) gr.pueden += 1;
    }
    const grupos = [...porGrupo.entries()].sort((x, y) => x[1].orden - y[1].orden).map(([k, gr]) => {
      gr.filas.sort((x, y) => (f.agrupar === "grado" ? (ordenRamaG(x.t) - ordenRamaG(y.t)) : (x.t.g - y.t.g)) || x.t.n.localeCompare(y.t.n));
      const abierto = this.abiertos ? this.abiertos.has(k) : (gr.pueden > 0 && (f.solo || porGrupo.size <= 3));
      return `<details class="ecos-verbe-grupo" data-g="${k}" ${abierto ? "open" : ""}><summary><b>${escH(gr.titulo)}</b> <span>${gr.filas.length} técnica${gr.filas.length === 1 ? "" : "s"}${gr.pueden ? ` · puedes aprender ${gr.pueden}` : ""}</span></summary>
        ${gr.filas.map(({ t, r, sabe }) => this.#filaTec(t, r, sabe)).join("")}</details>`;
    }).join("");
    const natsF = [...Object.entries(NATS), ...Object.entries(D.combos).map(([k, v]) => [k, v.nombre])];
    const ramasF = D.ramas.filter(r => r.id !== "sangre" || ve).map(r => [r.id, r.nombre]);
    return `${intro("Aquí aprendes técnicas.", "Haz clic en una para ver su ficha completa. Se aprende una vez, pagando Trazos; después, cada vez que la usas desde tu hoja gasta Verbe.",
      `<ul class="ecos-verbe-lista"><li><b>G</b> es el grado: qué tan fuerte es. Puedes aprender hasta tu grado máximo (${gradoMax(a)}) y, en cada rama, hasta lo que deja tu rango en ella (Mejorar → Especialidades).</li>
        <li><b>Verbe</b> es lo que gasta cada uso; el botón dice cuántos <b>Trazos</b> cuesta aprenderla.</li>
        <li><b>Probar</b>: es de una naturaleza que no tienes. Si tu Verbe responde, la aprendes; si no, no pierdes nada.</li>
        <li><b>Pedir al DM</b>: pide un maestro; el DM la aprueba.</li></ul>`, "tecnicas-y-grados")}
      <div class="ev-contraste-recursos"><div><b>Aprender = pagar Trazos una vez</b><span>Lo aprendido pasa a «Mis técnicas».</span></div><div><b>Usar = gastar Verbe cada vez</b><span>El coste tiene en cuenta tus mejoras y el contexto actual.</span></div></div>
      <div class="ecos-verbe-filtros"><label class="ev-busqueda"><span>Buscar una técnica</span><input type="search" data-filtro="texto" placeholder="Nombre o efecto…" value="${escH(f.texto)}"></label>
      <label><input type="checkbox" data-filtro="solo" ${f.solo ? "checked" : ""}> Solo disponibles y aprendidas</label><button type="button" data-action="limpiarFiltros">Restablecer</button></div>
      <details class="ev-filtros-extra" ${f.rama || f.grado !== "" || f.nat ? "open" : ""}><summary>Filtrar por especialidad, grado o elemento</summary><div class="ecos-verbe-filtros">
      <label>Especialidad <select data-filtro="rama"><option value="">Todas las ramas</option>${opciones(ramasF, f.rama)}</select></label>
      <label>Potencia <select data-filtro="grado"><option value="">Todos los grados</option>${opciones([...Array(GRADO_TOPE + 1).keys()].map(g => [g, `Grado ${g}`]), String(f.grado))}</select></label>
      <label>Elemento <select data-filtro="nat"><option value="">Todos los elementos</option>${opciones(natsF, f.nat)}</select></label>
      <label>Agrupar <select data-filtro="agrupar">${opciones([["rama", "Por especialidad"], ["grado", "Por grado"]], f.agrupar ?? "rama")}</select></label></div></details>
      ${f.solo && ocultas ? `<p class="ecos-nota">Hay ${ocultas} técnicas más que todavía no puedes aprender: desmarca la casilla para verlas y saber qué piden.</p>` : ""}
      ${grupos || '<div class="ev-vacio"><h3>No hay técnicas con esos filtros</h3><p>Restablece la búsqueda o desmarca «Solo disponibles y aprendidas» para ver qué te falta.</p><button type="button" data-action="limpiarFiltros">Restablecer filtros</button></div>'}`;
  }

  #filaTec(t, r, sabe) {
    const btn = sabe ? '<button type="button" data-action="pestana" data-p="jugar">Aprendida · ir a Mis técnicas</button>'
      : r.ok && r.probar ? `<button type="button" data-action="probar" data-id="${t.id}" data-tooltip="Si tu Verbe responde, la descubres y aprendes. Si no, no pierdes Trazos">Probar · ${t.trazos} ${t.trazos === 1 ? "Trazo" : "Trazos"} si responde</button>`
        : r.ok ? `<button type="button" data-action="aprender" data-id="${t.id}">${r.pideDM && !game.user.isGM ? "Pedir al DM" : "Aprender"} · ${t.trazos} Trazo${t.trazos === 1 ? "" : "s"}</button>`
          : `<span class="ecos-verbe-no" data-tooltip="${escH(r.motivo)}">${escH(r.motivo)}</span>`;
    const tiempo = TIEMPO_L[t.t] ?? t.t ?? "";
    const meta = itemsDe(this.actor, t.id)[0]?.getFlag(MOD, F) ?? { ...t.item.flags[MOD][F], infusion: estado(this.actor)?.infusiones?.[t.id] ?? null };
    const costo = previsualizarUso(this.actor, meta).costo;
    return `<details class="ecos-verbe-tec ${sabe ? "sabe" : r.ok ? "puede" : "no"}" data-id="${t.id}" data-tipo="tec"><summary>
      <span class="gr">Grado ${t.g}</span><span class="nom"><b>${escH(t.n)}</b><small>${escH([tiempo, t.alc ? alcanceL(t.alc) : null, t.area].filter(Boolean).join(" · "))}</small><small class="ev-efecto-breve">${escH(textoDe(t))}</small></span>
      <span class="vb"><b>${costo} Verbe</b><small>por uso base</small></span><span class="acc">${btn}${!sabe && r.ok && !r.probar ? `<small>Te quedarían ${trazos(this.actor).libres - t.trazos} Trazos</small>` : ""}</span></summary><div class="ecos-verbe-ficha-cont"></div></details>`;
  }

  #fichaTec(id) {
    const a = this.actor;
    const t = tecnicaPorId(id, a);
    if (!t) return "";
    const r = requisitos(a, t);
    const it = t.item;
    const act = Object.values(it?.system?.activities ?? {})[0];
    const nivel = nivelParaGrado(t.g);
    const rangoN = D.rangos.findIndex(x => x.grado >= t.g);
    const durTxt = t.dur ? (t.dur === "inst." ? "instantánea" : t.dur.startsWith("C ") ? `Concentración, ${t.dur.slice(2)}` : t.dur) : (it?.system?.duration?.units ?? "—");
    const tirada = t.tir === "ataque" ? `Ataque${t.veces > 1 ? ` (${t.veces} ataques)` : ""}` : t.tir ? `Salvación de ${t.tir}${t.dmg ? (t.mitad ? ", mitad si la supera" : ", nada si la supera") : ""}` : "Ninguna";
    const extra = it ? dadosExtra(a, it.flags?.[MOD]?.[F] ?? t, null) : 0;
    const dano = t.dmg ? `${t.veces > 1 ? `${t.veces} × ` : ""}${escH(t.dmg)}${extra ? ` <b>(+${extra} dado${extra > 1 ? "s" : ""} tuyo${extra > 1 ? "s" : ""})</b>` : ""}` : "—";
    const deja = (it?.effects ?? []).map(ef => (ESTADOS[ef.statuses?.[0]] ? `<span data-tooltip="${escH(ESTADOS[ef.statuses[0]].texto)}">${escH(ef.name)}</span>` : escH(ef.name))).join(", ") || "—";
    const sube = t.sube === "truco" ? "más dados en los niveles 5, 11 y 17" : t.sube ? `${escH(t.sube)} por cada grado de más` : (t.g > 0 ? "—" : "—");
    const meta = itemsDe(a, id)[0]?.getFlag(MOD, F) ?? { ...it.flags[MOD][F], infusion: estado(a)?.infusiones?.[id] ?? null };
    const verbes = t.g > 0 ? Array.from({ length: Math.max(0, gradoUsable(a, meta) - t.g) + 1 }, (_, i) => `grado ${t.g + i}: ${costoUso(a, meta, t.g + i, { infusion: meta.infusion })} Verbe`).join(" · ") : `${costoUso(a, meta, 0, { infusion: meta.infusion })} Verbe (pide tener al menos 1)`;
    const pide = [t.g ? `nivel ${nivel}` : null, rangoN > 0 ? `${nombreRango(rangoN)} en ${nombreRama(t.rama)}` : null, t.nat ? `naturaleza ${nombreNat(t.nat)}` : null,
      t.req && !(t.sec === "sangre" && !dm()) ? escH(t.req) : null].filter(Boolean).join(" · ") || "—";
    const f = (k, v) => `<th>${k}</th><td>${v}</td>`;
    return `${D.defensas?.[id] ? '<p class="ecos-verbe-intro"><b>Es una defensa reactiva.</b> Con midi-qol se ofrece cuando un ataque va a impactarte; el aviso muestra el coste según el ataque. No la lances como una técnica normal antes del golpe. Sin esa integración, el DM resuelve la reacción, el objeto y el coste en mesa.</p>' : ''}<p class="texto">${escH(textoDe(t))}</p>
      <table class="ecos-verbe-ficha">
        <tr>${f("Rama", `${nombreRama(t.rama)}${t.nat ? ` · ${escH(nombreNat(t.nat))}` : ""}`)}${f("Grado", `${t.g}${t.g >= 6 ? " · una vez por Descanso Largo" : ""}`)}</tr>
        <tr>${f("Tiempo", escH(TIEMPO_L[t.t] ?? t.t ?? "—"))}${f("Alcance", escH(t.alc ? alcanceL(t.alc) : "—"))}</tr>
        <tr>${f("Área", escH(t.area ?? "—"))}${f("Duración", escH(durTxt))}</tr>
        <tr>${f("Componentes", escH(COMP_L[t.comp] ?? t.comp ?? "—"))}${f("Tirada", tirada)}</tr>
        <tr>${f("Daño o curación", dano)}${f("Deja", deja)}</tr>
        <tr>${f("Usa", USA_TXT[(it?.flags?.[MOD]?.[F]?.usa) ?? "verbe"] ?? "")}${f("Sube", sube)}</tr>
        <tr>${f("Verbe por uso", verbes)}${f("Para aprender", `${t.trazos} Trazo${t.trazos === 1 ? "" : "s"}${t.rara ? " (rara: +1)" : ""}`)}</tr>
        <tr>${f("Pide", pide)}${f("Puedes", conoce(a, t.id) ? "ya la sabes" : r.ok ? (r.probar ? "probarla" : "sí") : escH(r.motivo))}</tr>
      </table>${act && act.type === "save" && t.g > 0 ? `<p class="ecos-nota">CD con tu Verbe: ${8 + competencia(a) + modDe(a, habilidadTecnica(a, it.flags?.[MOD]?.[F] ?? {}))}.</p>` : ""}
      ${t.fuerte ? `<p class="ecos-verbe-fuerte"><b>Contra alguien más fuerte:</b> ${escH(D.textoFuerte ?? "")}</p>` : ""}
      ${t.prog?.length ? `<div class="ecos-verbe-crece"><b>Crece</b><ul>${t.prog.map(x => `<li>${escH(x)}</li>`).join("")}</ul></div>` : ""}
      ${t.mejora?.length ? `<div class="ecos-verbe-mejora"><b>Se mejora con</b><ul>${t.mejora.map(x => `<li>${escH(x)}</li>`).join("")}</ul></div>` : ""}`;
  }

  #dotes() {
    const a = this.actor;
    const f = this.filtroDote ??= { texto: "", solo: false };
    const porCat = new Map();
    for (const d of D.dotes) {
      if (f.texto && !`${d.nombre} ${dotTexto(d)}`.toLowerCase().includes(f.texto.toLowerCase())) continue;
      const tiene = tieneDote(a, d.id);
      const r = cumpleReqDote(a, d);
      if (f.solo && !tiene && !(r.ok && trazos(a).libres >= d.trazos)) continue;
      const c = d.cat ?? "otras";
      if (!porCat.has(c)) porCat.set(c, []);
      porCat.get(c).push({ d, tiene, r });
    }
    const cats = D.categoriasDote ?? [];
    const orden = c => { const i = cats.findIndex(x => x.id === c); return i < 0 ? 99 : i; };
    const html = [...porCat.entries()].sort((x, y) => orden(x[0]) - orden(y[0])).map(([c, ds]) => {
      ds.sort((x, y) => x.d.trazos - y.d.trazos || x.d.nombre.localeCompare(y.d.nombre));
      const cat = cats.find(x => x.id === c);
      const k = `dote-${c}`;
      const abierto = this.abiertos ? this.abiertos.has(k) : true;
      return `<details class="ecos-verbe-grupo" data-g="${k}" ${abierto ? "open" : ""}><summary><b>${escH(cat?.nombre ?? "Otras")}</b> <span>${escH(cat?.texto ?? "")} · ${ds.length}</span></summary>
        ${ds.map(({ d, tiene, r }) => {
          const faltan = Math.max(0, d.trazos - trazos(a).libres);
          const btn = tiene ? `<span class='ecos-verbe-pill'>${d.innato ? "de nacimiento" : "la tienes"}</span>`
            : r.ok ? `<button type="button" data-action="dote" data-id="${d.id}" ${faltan ? "disabled" : ""}>${r.pideDM && !game.user.isGM ? "Pedir al DM" : "Comprar"} · ${d.trazos} Trazos</button><small>${faltan ? `Te faltan ${faltan} Trazos` : `Te quedarían ${trazos(a).libres - d.trazos} Trazos`}</small>`
              : `<span class="ecos-verbe-no">${escH(r.motivo)}</span>`;
          return `<details class="ecos-verbe-tec ${tiene ? "sabe" : r.ok ? "puede" : "no"}" data-id="${d.id}" data-tipo="dote"><summary>
            <span class="gr" data-tooltip="Trazos">${d.trazos}</span><span class="nom"><b>${escH(d.nombre)}</b><small>${escH(dotTexto(d)).slice(0, 90)}${dotTexto(d).length > 90 ? "…" : ""}</small></span>
            <span class="acc">${btn}</span></summary><div class="ecos-verbe-ficha-cont"></div></details>`;
        }).join("")}</details>`;
    }).join("");
    return `${intro("Mejoras permanentes del Verbe.", "Haz clic en una para verla entera. Se pagan una vez con Trazos y quedan como rasgos en tu hoja; las que piden un maestro van al DM.", "", "dotes")}
      <div class="ecos-verbe-filtros"><label class="ev-busqueda"><span>Buscar una mejora</span><input type="search" data-filtro-dote="texto" placeholder="Nombre o beneficio…" value="${escH(f.texto)}"></label>
        <label><input type="checkbox" data-filtro-dote="solo" ${f.solo ? "checked" : ""}> Solo las que puedo comprar ahora</label></div>
      ${html || "<p>Nada con ese filtro.</p>"}`;
  }

  #fichaDote(id) {
    const a = this.actor;
    const d = D.dotes.find(x => x.id === id);
    if (!d) return "";
    const r = cumpleReqDote(a, d);
    const cat = (D.categoriasDote ?? []).find(x => x.id === d.cat);
    return `<p class="texto">${escH(dotTexto(d))}</p>
      <table class="ecos-verbe-ficha"><tr><th>Precio</th><td>${d.trazos} Trazos</td><th>Pide</th><td>${escH(d.req ?? "nada")}</td></tr>
        <tr><th>Tipo</th><td>${escH(cat?.nombre ?? "—")}</td><th>Puedes</th><td>${tieneDote(a, d.id) ? (d.innato ? "la tienes desde que despertaste" : "ya la tienes") : r.ok ? (r.pideDM ? "pedirla al DM" : "sí") : escH(r.motivo)}</td></tr></table>
      ${d.mejora?.length ? `<div class="ecos-verbe-mejora"><b>Se mejora con</b><ul>${d.mejora.map(x => `<li>${escH(x)}</li>`).join("")}</ul></div>` : ""}`;
  }

  #cultivo() {
    const a = this.actor;
    const e = estado(a);
    const nats = [...natsDe(a)];
    const usadas = Object.entries(e.cultivos ?? {}).filter(([id, c]) => c.nivel > 0 && !esDerivada(a, id)).length;
    const filas = itemsTecnica(a).map(it => {
      const meta = it.getFlag(MOD, F);
      const tec = tecnicaPorId(meta.id, a);
      if (!tec) return "";
      const cul = e.cultivos?.[meta.id] ?? { nivel: 0, mejoras: [] };
      const opc = [...Object.entries(MEJORAS).filter(([k]) => k !== "rapida" || !cul.mejoras.includes("rapida")), ...nats.map(n => [`infusion:${n}`, `Infusión fija: ${NATS[n] ?? n}`])];
      const conDano = Object.values(tec.item?.system?.activities ?? {})[0]?.damage?.parts?.length;
      const infSel = INFUNDIBLES.has(tec.sec) && conDano ? `<select name="inf-${meta.id}"><option value="">Sin infusión</option>${opciones([...nats.map(n => [n, NATS[n] ?? n]), ...[...combosDe(a)].map(c => [c, nombreNat(c)])], e.infusiones?.[meta.id] ?? "")}</select>
        <button type="button" data-action="infundir" data-id="${meta.id}" data-tooltip="Su daño pasa a ser de ese elemento y deja su estado. Cada uso cuesta 2 Verbe más (4 con una combinación). Se cambia cuando quieras">Infundir</button>` : "<small>No se infunde</small>";
      const pend = Number(cul.pendiente) > 0;
      const acc = (cul.nivel < 3 || pend) ? `<select name="mejora-${meta.id}">${opciones(opc, "dado")}</select> <button type="button" data-action="cultivar" data-id="${meta.id}">${pend ? "Mejora gratis" : `Hacerla ${NIVEL_CULTIVO[cul.nivel + 1]} · ${cul.nivel + 1} Trazo${cul.nivel ? "s" : ""}`}</button>` : "Ya es Propia";
      const der = [cul.nivel >= 2 ? `<button type="button" data-action="crear" data-base="${meta.id}" data-modo="variante" data-tooltip="Una técnica hermana con otra forma: lanzada, más grande, contra dos blancos">Sacar una variante</button>` : "",
        cul.nivel >= 3 ? `<button type="button" data-action="crear" data-base="${meta.id}" data-modo="evolucion" data-tooltip="Una técnica nueva, hasta tres grados más, con tu firma">Evolucionarla</button>` : ""].join(" ").trim();
      return `<tr><td><b>${escH(it.name)}</b><br><small>Grado ${tec.g} · ${NIVEL_CULTIVO[cul.nivel]}${cul.mejoras.length ? ` · ${cul.mejoras.map(m => MEJORAS[m] ?? "infusión fija").join(", ")}` : ""}${tec.base ? " · derivada" : ""}</small></td>
        <td>${acc}${der ? `<br>${der}` : ""}</td><td>${infSel}</td></tr>`;
    }).join("");
    return `${intro("Entrena una técnica que ya sabes para que crezca.", `Cada técnica cultivada pasa por tres niveles (Pulida, Dominada y Propia) y cada nivel le da una mejora que eliges. Puedes cultivar tantas técnicas como tu bonificador de competencia: ${competencia(a)} (llevas ${usadas}).`,
      `<ul class="ecos-verbe-lista">${D.mejoras.map(m => `<li>${escH(m)}</li>`).join("")}</ul>
      <p>Dominada saca variantes; Propia evoluciona. <b>Infundir</b> le pone tu elemento a una técnica que hace daño: +2 Verbe por uso, sin Trazos.</p>`, "cultivo")}
      <table class="ecos-verbe-tabla"><thead><tr><th>Técnica</th><th>Cultivar</th><th>Infusión</th></tr></thead><tbody>${filas || "<tr><td colspan=\"3\">Todavía no sabes técnicas: apréndelas en Aprender.</td></tr>"}</tbody></table>
      <p class="ecos-nota"><button type="button" data-action="rearmar">Rearmar mis técnicas</button> si algo de la hoja no se actualizó después de subir de nivel o de rango.</p>`;
  }

  #crear() {
    const a = this.actor;
    const ramas = D.ramas.filter(r => rangoDe(a, r.id) >= 1 && ramaAbierta(a, r.id) && r.id !== "sangre");
    return `${intro("Inventa tus propias técnicas.", "Desde Entrenado en una rama puedes crear técnicas de esa rama. El menú te propone el daño justo para su grado y el DM la aprueba.",
      `<p>Cuesta su grado + 1 en Trazos (+1 si mezcla dos naturalezas), tantos días de trabajo como su grado y 25 de oro por grado. Llega hasta el grado que te deja tu rango en la rama menos uno; desde Maestro, hasta ese grado entero.</p>`, "crear-tecnicas")}
      <p>${ramas.length ? `Puedes crear en: ${ramas.map(r => `<b>${r.nombre}</b> (hasta grado ${gradoCrear(a, r.id)})`).join(", ")}.` : "Todavía no tienes Entrenado en ninguna rama."}</p>
      <p><button type="button" data-action="crear" ${ramas.length ? "" : "disabled"}><i class="fa-solid fa-pen-nib"></i> Crear una técnica</button></p>
      <details><summary>Presupuesto por grado</summary><table class="ecos-verbe-tabla"><tr><th>Grado</th><th>Un blanco</th><th>Área</th><th>Área hasta</th><th>Alcance</th><th>Estados</th></tr>
      ${D.presupuesto.map(p => `<tr><td>${p.grado}</td><td>${p.uno}</td><td>${escH(p.area)}</td><td>${escH(p.areaHasta)}</td><td>${p.alcance}</td><td>${escH(p.estados)}</td></tr>`).join("")}</table></details>`;
  }

  #dm() {
    const a = this.actor;
    const e = estado(a);
    const t = trazos(a);
    const pend = (game.settings.get(MOD, AJ.pend) ?? []).filter(p => p.actorId === a.id);
    const pendHTML = pend.map(p => `<li>${escH(p.titulo ?? p.tipo)} <button type="button" data-action="aprobar" data-id="${p.id}">Aprobar</button> <button type="button" data-action="rechazar" data-id="${p.id}">Devolver</button></li>`).join("");
    const compras = [...(e.compras ?? [])].reverse().map(c => `<li>${escH(c.texto)} <button type="button" data-action="deshacer" data-id="${c.id}" data-tooltip="Lo quita y devuelve sus Trazos">Deshacer${c.trazos ? ` (+${c.trazos})` : ""}</button></li>`).join("");
    const sabe = itemsTecnica(a).map(i => {
      const id = i.getFlag(MOD, F).id;
      const pagada = (e.compras ?? []).some(c => c.tipo === "tecnica" && c.datos?.id === id);
      return `<li>${escH(i.name)} ${pagada ? `<button type="button" data-action="quitarTecnica" data-id="${id}" data-modo="devolver">Quitar y devolver Trazos</button>` : ""} <button type="button" data-action="quitarTecnica" data-id="${id}" data-modo="no">Quitar${pagada ? " sin devolver" : ""}</button></li>`;
    }).join("");
    const todas = D.tecnicas.filter(x => !conoce(a, x.id)).map(x => [x.id, `${nombreRama(x.rama)} · grado ${x.g} · ${x.n}`]);
    const cerradas = D.ramas.filter(r => !ramaAbierta(a, r.id)).map(r => [r.id, r.nombre]);
    const sec = (titulo, html, abierto = false) => `<details class="ecos-verbe-dmsec" ${abierto ? "open" : ""}><summary>${titulo}</summary>${html}</details>`;
    return `${intro("Solo tú ves esta pestaña.", "Pedidos, Trazos, deshacer compras y cambios a mano. «Ver como el jugador» (arriba) muestra el panel tal como lo ve él.")}
      ${sec(`Pedidos (${pend.length})`, `<ul>${pendHTML || "<li>Nada pendiente.</li>"}</ul>`, pend.length > 0)}
      ${sec("Trazos", `<p>Tiene <b>${t.libres}</b> libres · ${t.gastados} gastados · ${t.total} en total (${4 * nivelDe(a) + 4} por nivel y ${Number(e.trazosExtra) || 0} dados por ti o por Monedas).</p>
        <p>Dar o quitar: <input type="number" name="trazosN" value="1" style="width:5em"> <button type="button" data-action="trazosDM" data-n="campo">Aplicar</button> <small>(un número negativo los quita)</small></p>
        <p>Dejarle exactamente <input type="number" name="trazosFijar" min="0" value="${Math.max(0, t.libres)}" style="width:5em"> libres <button type="button" data-action="fijarTrazos">Fijar</button></p>
        <p>Verbe: ${[-5, -1, 1, 5].map(n => `<button type="button" data-action="verbeDM" data-n="${n}">${n > 0 ? "+" : ""}${n}</button>`).join(" ")} <button type="button" data-action="verbeDM" data-n="lleno">Llenar</button></p>`, true)}
      ${sec("Deshacer compras", `<p class="ecos-nota">«DM, no me gustó esto»: deshaz la compra y vuelven sus Trazos. Las de un mismo camino se deshacen de la más alta a la más baja.</p>
        <ul>${compras || "<li>No ha comprado nada todavía.</li>"}</ul>
        <p><b>Rehacer desde cero</b>: devuelve todo lo comprado. <label><input type="checkbox" name="rehacerNat"> y que vuelva a elegir naturaleza</label> <label><input type="checkbox" name="rehacerPrincipal"> y rama principal</label>
          <button type="button" data-action="rehacer"><i class="fa-solid fa-rotate-left"></i> Rehacer</button></p>`, (e.compras ?? []).length > 0)}
      ${sec("Cambiar a mano (no toca los Trazos)", `
        <p>Característica: <select name="aj-car">${opciones(Object.entries(CARS), e.car)}</select> <button type="button" data-action="ajustar" data-campo="car" data-de="aj-car">Cambiar</button>
          · Naturaleza principal: <select name="aj-nat">${opciones(Object.entries(NATS), e.nats?.[0] ?? "")}</select> <button type="button" data-action="ajustar" data-campo="nat" data-de="aj-nat">Cambiar</button></p>
        <p>Rama principal: <select name="aj-principal">${opciones(ramasLibres(), e.principal ?? "")}</select> <button type="button" data-action="ajustar" data-campo="principal" data-de="aj-principal">Cambiar</button> <small>(no cambia los rangos: ajústalos abajo)</small></p>
        <p>Rango: <select name="aj-rama">${opciones(D.ramas.map(r => [r.id, `${r.nombre} (${nombreRango(rangoDe(a, r.id))})`]), "")}</select> a <select name="aj-rango">${opciones(D.rangos.map((r, i) => [i, r.nombre]), 1)}</select> <button type="button" data-action="ajustar" data-campo="rango" data-de="aj-rango" data-clave="aj-rama">Fijar</button></p>
        <p>Afinidad: <select name="aj-afnat">${opciones([...natsDe(a)].map(n => [n, NATS[n] ?? n]), "")}</select> a <select name="aj-af">${opciones([[1, "Despierta"], [2, "Entrenada"], [3, "Maestra"]], 1)}</select> <button type="button" data-action="ajustar" data-campo="afinidad" data-de="aj-af" data-clave="aj-afnat">Fijar</button>
          · Control: <select name="aj-control">${opciones([[0, "Sin competencia"], [1, "Competente"], [2, "Pericia"]], Number(a.system?.skills?.cvb?.value) || 0)}</select> <button type="button" data-action="ajustar" data-campo="control" data-de="aj-control">Fijar</button>
          · Cerrojos que sabe: <input type="number" name="aj-cerrojos" min="0" max="7" value="${Number(e.cerrojos) || 0}" style="width:4em"> <button type="button" data-action="ajustar" data-campo="cerrojos" data-de="aj-cerrojos">Fijar</button></p>
        <p>Dote: <select name="aj-dote" data-desc="dote">${opciones(D.dotes.map(d => [d.id, `${tieneDote(a, d.id) ? "✓ " : ""}${d.nombre}`]), "")}</select> <button type="button" data-action="ajustar" data-campo="dote" data-de="aj-dote">Dar o quitar (gratis)</button></p>
        <div class="ecos-verbe-desc" data-de="aj-dote"></div>
        <p>Enseñar una técnica gratis: <select name="darTecnica" data-desc="tec">${opciones(todas, "")}</select> <button type="button" data-action="darTecnica">Enseñar</button></p>
        <div class="ecos-verbe-desc" data-de="darTecnica"></div>
        <p>Técnicas que sabe:</p><ul>${sabe || "<li>Ninguna.</li>"}</ul>`)}
      ${sec("Naturalezas y linaje", `<p>Oculta: <select name="oculta">${opciones(Object.entries(NATS), ocultaDe(a))}</select> <button type="button" data-action="oculta">Cambiar</button> ${e.descubierta ? "(ya la descubrió)" : ""} · probadas sin suerte: ${(e.probadas ?? []).map(n => NATS[n]).join(", ") || "ninguna"}</p>
        <p>Dar una naturaleza: <select name="natsExtra">${opciones(Object.entries(NATS).filter(([k]) => !natsDe(a).has(k)), "")}</select> <button type="button" data-action="lista" data-campo="natsExtra" data-texto="naturaleza">Dar</button>
          · combinación: <select name="combos">${opciones(Object.entries(D.combos).filter(([k]) => !combosDe(a).has(k)).map(([k, v]) => [k, `${v.nombre} (${v.de.map(n => NATS[n]).join(" + ")})`]), "")}</select> <button type="button" data-action="lista" data-campo="combos" data-texto="combinación">Dar</button></p>
        <p>Linaje: <select name="linaje">${opciones(paresLinaje(), e.linaje)}</select> <select name="fuerza">${opciones(Object.entries(FUERZA).map(([k, v]) => [k, v.nombre]), e.fuerza)}</select>
          <label><input type="checkbox" name="linajeVisible" ${e.linajeVisible ? "checked" : ""}> el jugador lo sabe</label> <button type="button" data-action="linaje">Guardar</button></p>
        <p class="ecos-nota">El linaje lo eliges siempre tú: el jugador nunca lo elige. Si no lo sabe, en su panel dice «Desconocido», igual que para quien no tiene ninguno.</p>`)}
      ${sec("Ramas, ojos, pactos y escuela", `${cerradas.length ? `<p>Abrir una rama: <select name="abiertas">${opciones(cerradas, "")}</select> <button type="button" data-action="lista" data-campo="abiertas" data-texto="rama">Abrir</button></p>` : ""}
        <p>Despertar un ojo: <select name="mirada">${opciones(D.miradas.map(m => [m.id, `${m.nombre}${m.real && m.real !== m.nombre ? ` (${m.real})` : ""}`]), "")}</select> <select name="etapa">${opciones([[1, "Etapa 1 · 3 Trazos"], [2, "Etapa 2 · 5"], [3, "Etapa 3 · 8"]], 1)}</select>
          <label><input type="checkbox" name="trasplante"> trasplantado</label> <button type="button" data-action="mirada">Despertar o subir</button></p>
        <p>Pacto: <select name="pactos">${opciones(D.pactos.map(p => [p.linaje, p.linaje]), "")}</select> <button type="button" data-action="lista" data-campo="pactos" data-texto="pacto">Dar</button>
          · escuela: <select name="escuela"><option value="">Ninguna</option>${opciones(D.escuelas.map(s => [s.nombre, `${s.nombre} (${s.rama})`]), e.escuela ?? "")}</select> <button type="button" data-action="escuela">Guardar</button></p>`)}
      ${sec("Herramientas", `<p><button type="button" data-action="choque"><i class="fa-solid fa-burst"></i> Choque de técnicas</button> <button type="button" data-action="olvidar"><i class="fa-solid fa-eraser"></i> Quitar el Verbe a este actor</button></p>`)}`;
  }
}

/* ------------------------------------------------------------------ */
/*  Defensas: el aviso antes de resolver un ataque (midi-qol)         */
/* ------------------------------------------------------------------ */

const ESPERAS = new Map();
const INCAPAZ = ["incapacitated", "paralyzed", "stunned", "unconscious", "petrified", "dead", "acechado"];
const noPuedeActuar = actor => INCAPAZ.some(st => actor?.statuses?.has(st));
function reaccionDisponible(actor) {
  if (noPuedeActuar(actor) || actor?.statuses?.has("cargado")) return false;
  if (game.combat?.started && estado(actor)?.reaccionUsada) return false;
  try { return !globalThis.MidiQOL?.hasUsedReaction?.(actor); } catch { return true; }
}

/** Grado de un ataque: el de su técnica o conjuro; si es un arma o una criatura, la mitad de su nivel o VD. */
export function gradoAtaque(wf) {
  const meta = wf?.item?.getFlag?.(MOD, F);
  if (meta?.id) return (Number(meta.g) || 0) + (Number(wf.item?.flags?.dnd5e?.scaling) || 0);
  if (wf?.item?.type === "spell") return Number(wf.castData?.castLevel ?? wf.itemLevel ?? wf.item.system?.level) || 0;
  const a = wf?.actor;
  const n = a?.type === "character" ? Number(a.system?.details?.level) || 1 : (despierto(a) ? nivelDe(a) : Number(a?.system?.details?.cr) || 0);
  return Math.ceil(n / 2);
}

const ojoAbierto = (actor, ojo) => actor?.effects?.some(x => x.getFlag?.(MOD, F)?.ojo === ojo && !x.disabled);

/** Las defensas que puede usar ahora contra un ataque de ese grado (con su costo exacto). */
export function defensasDisponibles(actor, { grado = 0, area = false } = {}) {
  if (!despierto(actor) || !D?.defensas) return [];
  if (!reaccionDisponible(actor)) return [];
  const e = estado(actor);
  const lista = [];
  for (const [id, def] of Object.entries(D.defensas)) {
    if (!conoce(actor, id)) continue;
    if (area && !(id === "forma-sustitucion" && tieneDote(actor, "sustitucion-amplia"))) continue;
    if (def.pide === "ojo" && !ojoAbierto(actor, id.split("-")[1])) continue;
    const tec = tecnicaPorId(id, actor);
    if (!tec) continue;
    const meta = itemsDe(actor, id)[0]?.getFlag(MOD, F) ?? tec.item.flags[MOD][F];
    let costo = costoUso(actor, meta, tec.g);
    let refleja = false;
    let extra = 0;
    if (id === "forma-sustitucion") {
      if (tieneDote(actor, "sustitucion-refleja") && !e.reflejaUsada) { costo = 0; refleja = true; }
      extra = (Number(def.extraPorGrado) || 2) * Math.max(0, grado - gradoMax(actor));
      costo += extra + (area ? 2 : 0);
    }
    const permiso = evaluarGasto({ valor: Number(e.valor) || 0, costo, limite: limiteNegativo(actor), grado: tec.g,
      agotamiento: Number(actor.system?.attributes?.exhaustion) || 0, reaccion: true, puedeReaccionar: reaccionDisponible(actor) });
    if (!permiso.ok) continue;
    const aviso = def.aviso ?? (id === "forma-sustitucion" ? (tieneDote(actor, "sustitucion-lejana") ? "si hay un objeto de tu tamaño o menor a 9 m" : "si hay un objeto de tu tamaño o menor a 3 m") : "");
    lista.push({ id, nombre: itemsDe(actor, id)[0]?.name ?? tec.n, costo, extra, refleja, area, texto: area ? "sales del área a un objeto fuera de ella y no recibes nada" : def.texto, aviso, g: tec.g });
  }
  return lista;
}

/** Pregunta al dueño (o al DM) qué defensa usa; espera hasta 30 s. Devuelve el id o null. */
async function preguntarDefensa(actor, info) {
  const jugador = game.users.find(u => u.active && !u.isGM && actor.testUserPermission(u, "OWNER"));
  const quien = jugador ?? game.users.activeGM;
  if (!quien) return null;
  if (quien.isSelf) return elegirDefensa(actor, info);
  const id = foundry.utils.randomID();
  return new Promise(res => {
    const t = setTimeout(() => { ESPERAS.delete(id); res(null); }, 32000);
    ESPERAS.set(id, v => { clearTimeout(t); res(v); });
    game.socket.emit(`module.${MOD}`, { capaV: true, accion: "capaVDefensa", id, para: quien.id, de: game.user.id, actorId: actor.id, info });
  });
}

/** Mensajes de defensa por socket: los atiende quien corresponde, sea DM o jugador. true si era uno de estos. */
function socketDefensa(d) {
  if (d?.accion === "capaVDefensa") {
    if (d.para !== game.user.id) return true;
    const actor = game.actors.get(d.actorId);
    (actor ? elegirDefensa(actor, d.info) : Promise.resolve(null)).catch(() => null)
      .then(v => game.socket.emit(`module.${MOD}`, { capaV: true, accion: "capaVDefensaR", id: d.id, para: d.de, v }));
    return true;
  }
  if (d?.accion === "capaVDefensaR") {
    if (d.para === game.user.id) { ESPERAS.get(d.id)?.(d.v ?? null); ESPERAS.delete(d.id); }
    return true;
  }
  return false;
}

/** El aviso: botones con cada defensa y su costo. Quien elige, paga y pone el efecto en su propio actor. */
async function elegirDefensa(actor, info) {
  const opciones = defensasDisponibles(actor, { grado: info.grado, area: info.area });
  if (!opciones.length) return null;
  const { DialogV2 } = foundry.applications.api;
  const e = estado(actor);
  const cab = info.area
    ? `<p><b>${escH(info.quien)}</b> usa <b>${escH(info.con)}</b>: un área que pide salvación de Destreza.</p>`
    : `<p><b>${escH(info.quien)}</b> te ataca con <b>${escH(info.con)}</b>: <b>${info.total}</b> contra tu CA ${info.ca}${info.critico ? " (crítico)" : ""}. Va a impactar.</p>`;
  const html = `<div class="ecos-verbe-form">${cab}
    <p class="ecos-nota">Tienes ${Number(e.valor) || 0} de Verbe y tu reacción libre. Grado del ataque: ${info.grado}; el tuyo: ${gradoMax(actor)}.</p>
    <ul class="ecos-verbe-lista">${opciones.map(o => `<li><b>${escH(o.nombre)}</b> · ${o.costo} Verbe${o.extra ? ` (incluye ${o.extra} por ser un ataque más grande que tú)` : ""}${o.refleja ? " · gratis por Sustitución refleja" : ""}: ${escH(o.texto)}${o.aviso ? ` <i>(${escH(o.aviso)})</i>` : ""}.</li>`).join("")}</ul></div>`;
  let dlg = null;
  const r = await DialogV2.wait({
    window: { title: `¿Te defiendes? · ${actor.name}`, icon: "fa-solid fa-shield-halved" },
    content: html,
    buttons: [...opciones.map((o, i) => ({ action: o.id, label: `${o.nombre} · ${o.costo} Verbe`, default: i === 0 })), { action: "no", label: "No hacer nada" }],
    render: (ev, d) => { dlg = d ?? ev?.target; setTimeout(() => { try { dlg?.close?.(); } catch { /* ya cerró */ } }, 28000); },
    rejectClose: false
  });
  if (!r || r === "no") return null;
  return (await usarDefensa(actor, r, info)) ? r : null;
}

/** Paga la defensa y pone su efecto (en el actor de quien se defiende). */
export function usarDefensa(actor, ...args) { return serializarActor(actor, () => usarDefensaInterno(actor, ...args)); }
async function usarDefensaInterno(actor, id, info = {}) {
  const op = defensasDisponibles(actor, { grado: info.grado ?? 0, area: !!info.area }).find(o => o.id === id);
  if (!op) return false;
  const def = D.defensas[id];
  const e = estado(actor);
  const valor = (Number(e.valor) || 0) - op.costo;
  const changes = [];
  const efectos = [];
  let especial = ["isAttacked"];
  if (info.area) {
    changes.push({ key: "flags.midi-qol.min.ability.save.all", mode: 5, value: "99" }, { key: "flags.midi-qol.superSaver.all", mode: 5, value: "1" });
    especial = ["isSave"];
  } else if (def.tipo === "falla") changes.push({ key: "system.attributes.ac.bonus", mode: 2, value: "+ 99" });
  else if (def.tipo === "ca") changes.push({ key: "system.attributes.ac.bonus", mode: 2, value: `+ ${def.ca}` });
  if (def.hasta === "turno") especial = ["turnStart"];
  if (def.velocidad0) changes.push({ key: "system.attributes.movement.walk", mode: 5, value: "0" });
  if (def.tipo === "desventaja" && def.hasta === "turno") changes.push({ key: "flags.midi-qol.grants.disadvantage.attack.all", mode: 5, value: "1" });
  if (changes.length) {
    efectos.push({ name: op.nombre, img: "systems/dnd5e/icons/svg/abilities/dexterity.svg", changes,
      duration: { rounds: 1, seconds: 6 }, transfer: false,
      flags: { dae: { specialDuration: especial }, [MOD]: { [F]: { defensa: id, especial } } } });
  }
  if (def.estado && ESTADOS[def.estado]) efectos.push(efectoEstado(def.estado, foundry.utils.randomID()));
  const creados = efectos.length ? await actor.createEmbeddedDocuments("ActiveEffect", efectos) : [];
  try {
    await guardar(actor, { valor, ...(game.combat?.started ? { reaccionUsada: true } : {}), ...(op.refleja ? { reflejaUsada: true } : {}) });
  } catch (error) {
    for (const ef of creados) await ef.delete();
    throw error;
  }
  try { await globalThis.MidiQOL?.setReactionUsed?.(actor); } catch { /* sin midi */ }
  const que = info.area ? "sale del área a un objeto fuera de ella" : ({ falla: "se cambia por un objeto: el ataque golpea eso", ca: "levanta la guardia", desventaja: "se corre justo a tiempo" }[def.tipo] ?? "se defiende");
  aLaMesa(actor, `✦ ${escH(op.nombre)}`, `<p>${escH(actor.name)} ${que} (${op.costo} Verbe${op.refleja ? ", gratis por Sustitución refleja" : ""}).</p>`);
  if (valor < 0) await sobreesfuerzo(actor, op.g, valor);
  return true;
}

/** Desventaja después de la tirada: un d20 más y queda el más bajo. */
async function aplicarDesventaja(wf, roll) {
  const die = roll?.dice?.[0];
  if (!die || die.faces !== 20) return;
  const activo0 = die.results.find(x => x.active);
  if (!activo0) return;
  const otro = (await new Roll("1d20").evaluate()).total;
  die.results.push({ result: otro, active: false, discarded: true });
  if (otro < activo0.result) {
    activo0.active = false; activo0.discarded = true;
    const nuevo = die.results.at(-1); nuevo.active = true; nuevo.discarded = false;
  }
  roll._total = roll._evaluateTotal?.() ?? roll._total;
  if (typeof wf.setAttackRoll === "function") await wf.setAttackRoll(roll);
  else wf.attackRoll = roll;
}

/** midi-qol, antes de ver si impacta: a cada blanco con defensas que va a recibir el golpe, se le pregunta. */
async function defenderAtaque(wf) {
  const roll = wf?.attackRoll;
  if (!roll) return;
  const grado = gradoAtaque(wf);
  for (const tok of wf.targets ?? []) {
    const actor = tok?.actor;
    if (!actor || !despierto(actor) || actor === wf.actor) continue;
    if (globalThis.MidiQOL?.hasUsedReaction?.(actor)) continue;
    const ca = Number(actor.system?.attributes?.ac?.value) || 10;
    const critico = !!roll.isCritical;
    if (roll.total < ca && !critico) continue; // va a fallar igual
    if (!defensasDisponibles(actor, { grado }).length) continue;
    const v = await preguntarDefensa(actor, { quien: wf.token?.name ?? wf.actor?.name ?? "Alguien", con: wf.item?.name ?? "un ataque", total: roll.total, ca, critico, grado });
    if (v && D.defensas[v]?.tipo === "desventaja") await aplicarDesventaja(wf, roll);
  }
}

/** midi-qol, antes de las salvaciones de un área: Sustitución amplia. */
async function defenderArea(wf) {
  const act = wf?.activity;
  const habs = act?.save?.ability;
  const esDes = habs instanceof Set ? habs.has("dex") : Array.isArray(habs) ? habs.includes("dex") : false;
  if (!esDes || !(act?.target?.template?.type || wf.templateUuid || wf.template)) return;
  const grado = gradoAtaque(wf);
  for (const tok of wf.targets ?? []) {
    const actor = tok?.actor;
    if (!actor || !despierto(actor) || actor === wf.actor || !tieneDote(actor, "sustitucion-amplia")) continue;
    if (globalThis.MidiQOL?.hasUsedReaction?.(actor)) continue;
    if (!defensasDisponibles(actor, { grado, area: true }).length) continue;
    await preguntarDefensa(actor, { quien: wf.token?.name ?? wf.actor?.name ?? "Alguien", con: wf.item?.name ?? "un área", grado, area: true });
  }
}

/** Lo que quede de una defensa al terminar la tirada (si DAE no lo quitó solo), lo borra el DM. */
async function limpiarDefensas(wf) {
  if (!soyGM()) return;
  for (const tok of wf?.targets ?? []) {
    const efs = tok?.actor?.effects?.filter(x => { const fl = x.getFlag?.(MOD, F); return fl?.defensa && (fl.especial ?? []).some(s => s === "isAttacked" || s === "isSave"); }) ?? [];
    if (efs.length) await tok.actor.deleteEmbeddedDocuments("ActiveEffect", efs.map(x => x.id), { ecosSinCierre: true });
  }
}

/* ------------------------------------------------------------------ */
/*  Hoja del actor y token                                            */
/* ------------------------------------------------------------------ */

export function decorarHoja(app, html) {
  try {
    const actor = app?.document ?? app?.actor;
    if (!(actor instanceof Actor)) return;
    const raiz = (app.element instanceof HTMLElement) ? app.element : (app.element?.[0] ?? html?.[0] ?? html);
    if (!raiz?.querySelector) return;
    const e = estado(actor);
    // La habilidad Control del Verbe solo en quien despertó.
    if (!e?.despierto) raiz.querySelectorAll('[data-key="cvb"], [data-skill="cvb"]').forEach(n => n.remove());
    raiz.querySelectorAll(".ecos-verbe-bloque").forEach(n => n.remove());
    if (e?.despierto && (actor.isOwner || game.user.isGM)) {
      const max = maxVerbe(actor);
      const v = Number(e.valor) || 0;
      const pct = max ? Math.clamp(Math.abs(v) / max, 0, 1) : 0;
      const bloque = document.createElement("div");
      bloque.className = "ecos-verbe-bloque";
      bloque.dataset.tooltip = "Verbe · clic para abrir el panel";
      bloque.innerHTML = `<div class="ecos-verbe-barra ${v < 0 ? "negativo" : ""}"><div style="width:${pct * 100}%"></div><span>Verbe ${v} / ${max}</span></div>`;
      bloque.addEventListener("click", ev => { ev.preventDefault(); abrirPanel(actor); });
      const hp = raiz.querySelector(".sidebar .meter-group, .meter-group, .attributes .hit-points");
      if (hp) hp.after(bloque);
      else (raiz.querySelector(".window-content") ?? raiz).prepend(bloque);
    }
    const cab = raiz.querySelector(".window-header");
    if (!cab || cab.querySelector(".ecos-verbe-cab")) return;
    const antes = cab.querySelector("[data-action=\"close\"], .close, [data-action=\"toggleControls\"]");
    const boton = (icono, texto, ayuda, accion) => {
      const b = document.createElement((app.element instanceof HTMLElement) ? "button" : "a");
      if (b.tagName === "BUTTON") b.type = "button";
      b.className = "header-control ecos-cabecera ecos-verbe-cab";
      b.dataset.tooltip = ayuda;
      b.setAttribute("aria-label", ayuda);
      b.innerHTML = `<i class="fa-solid ${icono}"></i><span>${texto}</span>`;
      b.addEventListener("click", ev => { ev.preventDefault(); ev.stopPropagation(); Promise.resolve(accion()).catch(err => console.error(`${MOD} | capa V`, err)); });
      b.addEventListener("pointerdown", ev => ev.stopPropagation());
      cab.insertBefore(b, antes ?? null);
    };
    if (e?.despierto && actor.isOwner) boton("fa-droplet", "Verbe", "Panel del Verbe", () => abrirPanel(actor));
    else if (!e?.despierto && game.user.isGM) boton("fa-droplet", "Despertar", "Despertar el Verbe (solo DM)", () => dialogoDespertar(actor));
  } catch (err) {
    console.warn(`${MOD} | capa V: hoja`, err);
  }
}

function barraToken(token) {
  try {
    const actor = token?.actor;
    let g = token?.ecosVerbe;
    const e = estado(actor);
    const ver = e?.despierto && (game.user.isGM || actor.isOwner);
    if (!ver) { if (g && !g.destroyed) g.destroy(); if (token) token.ecosVerbe = null; return; }
    if (!g || g.destroyed) { g = new PIXI.Graphics(); token.ecosVerbe = g; token.addChild(g); }
    const max = maxVerbe(actor) || 1;
    const v = Number(e.valor) || 0;
    const w = token.w;
    const h = Math.max(4, Math.round(token.h * 0.05));
    g.clear();
    g.beginFill(0x000000, 0.6).drawRoundedRect(0, 0, w, h, 2).endFill();
    g.beginFill(v < 0 ? 0x8a1f3b : 0x2d7be0, 0.95).drawRoundedRect(1, 1, Math.max(0, (w - 2) * Math.clamp(Math.abs(v) / max, 0, 1)), h - 2, 2).endFill();
    g.position.set(0, -h - 1);
  } catch (err) {
    /* el token puede no estar listo */
  }
}

/** dnd5e pide espacio de conjuro a toda técnica que escala: las del Verbe escalan con su propio selector y pagan Verbe. */
export function parcheEspacios() {
  for (const t of Object.values(CONFIG.DND5E.activityTypes ?? {})) {
    let p = t.documentClass?.prototype;
    while (p && p !== Object.prototype) {
      const d = Object.getOwnPropertyDescriptor(p, "requiresSpellSlot");
      if (d?.get) {
        if (!d.get.ecosV) {
          const orig = d.get;
          const nuevo = function () { return (this.item?.system?.method === "verbe") ? false : orig.call(this); };
          nuevo.ecosV = true;
          Object.defineProperty(p, "requiresSpellSlot", { ...d, get: nuevo });
        }
        break;
      }
      p = Object.getPrototypeOf(p);
    }
  }
}

/* ------------------------------------------------------------------ */
/*  Registro                                                          */
/* ------------------------------------------------------------------ */

Hooks.once("init", () => {
  game.settings.register(MOD, AJ.modo, {
    name: "Capa V (solo DM)",
    hint: "Apagado: no existe para nadie. Prueba: solo en tu cliente de DM, para probar con un actor de prueba. Activo: para todos. Al cambiarlo, recarga (F5).",
    scope: "world", config: true, type: String, default: "apagado", choices: { apagado: "Apagado", prueba: "Prueba (solo el DM)", activo: "Activo" },
    requiresReload: true
  });
  game.settings.register(MOD, AJ.pend, { scope: "world", config: false, type: Array, default: [] });
  game.settings.register(MOD, AJ.extra, { scope: "world", config: false, type: Array, default: [] });
  game.settings.register(MOD, "verbeChoques", {
    name: "Choques del Verbe", hint: "Potencia: el elemento favorable aporta 2 grados; si empatan, Control. Clásico: el ciclo elemental decide antes que el grado.",
    scope: "world", config: true, type: String, default: "potencia",
    choices: { potencia: "Potencia y ventaja elemental (2 grados)", clasico: "Ciclo clásico" }
  });
  try { MODO = game.settings.get(MOD, AJ.modo); } catch { MODO = "apagado"; }
  const yo = (game.data?.users ?? []).find(u => u._id === game.userId);
  const esGM = (yo?.role ?? 0) >= CONST.USER_ROLES.ASSISTANT;
  if (!((MODO === "activo") || ((MODO === "prueba") && esGM))) { if (MODO === "prueba") MODO = "prueba-fuera"; return; }
  // Método propio: sección «Técnicas del Verbe» en la pestaña de conjuros, sin espacios.
  CONFIG.DND5E.spellcasting.verbe = { label: "Técnicas del Verbe", order: 25 };
  CONFIG.DND5E.spellLevels[10] = "Grado 10 del Verbe";
  CONFIG.DND5E.spellLevels[11] = "Grado 11 del Verbe";
  const ramas = { vfo: "Forma", vve: "Velo", vcu: "Cuerpo", vmi: "Mirada", vse: "Sello", vpa: "Pacto", vpu: "Pulso", vhi: "Hilo", vqu: "Quietud", vra: "Rastro", vsa: "Sangre" };
  const iconos = { vfo: "evocation", vve: "illusion", vcu: "transmutation", vmi: "divination", vse: "abjuration", vpa: "conjuration",
    vpu: "necromancy", vhi: "enchantment", vqu: "abjuration", vra: "divination", vsa: "transmutation" };
  for (const [k, n] of Object.entries(ramas)) CONFIG.DND5E.spellSchools[k] = { label: n, icon: `systems/dnd5e/icons/svg/schools/${iconos[k]}.svg`, fullKey: `verbe${n}`, reference: "" };
  CONFIG.DND5E.skills.cvb = { label: "Control del Verbe", ability: "wis", fullKey: "controlVerbe", reference: "", icon: "systems/dnd5e/icons/svg/abilities/wisdom.svg" };
  for (const [id, c] of Object.entries(ESTADOS)) {
    if (CONFIG.statusEffects.some(s => s.id === id)) continue;
    CONFIG.statusEffects.push({ id, _id: `ecosv${id}`.padEnd(16, "0").slice(0, 16), name: c.name, img: c.img, changes: c.changes ?? [],
      description: `<p>${c.texto}</p>`, flags: { [MOD]: { [F]: { estado: id } } } });
  }
  parcheEspacios();
});

Hooks.once("ready", async () => {
  if (!((MODO === "activo") || ((MODO === "prueba") && game.user.isGM))) return;
  try {
    D = await cargarDatos();
    if (!D) return console.warn(`${MOD} | capa V: no encuentro sus datos`);
    console.log(`${MOD} | capa V ${D.version}: ${D.tecnicas.length} técnicas (${MODO})`);
  } catch (err) {
    return console.error(`${MOD} | capa V: no pude leer sus datos`, err);
  }
  const api = (game.modules.get(MOD).api ??= {});
  api.verbe = { despertar: a => dialogoDespertar(a), abrir: a => abrirPanel(a), despierto, estado, maxVerbe, trazos, refrescar, aprender,
    tecnica: id => tecnicaPorId(id), datos: () => D, aprobar, despertarOjo, costoUso, requisitos, choque: dialogoChoque, olvidar,
    deshacer, rehacer, ajustar, darTrazos, recuperar: recuperarVerbe, guia: abrirGuia, asegurarGuia, modo: () => MODO, ajusteClima, gradoCriatura, extraContraFuerte,
    marcarMetal: (documento, metal = true) => game.user.isGM && ["Item", "Actor"].includes(documento?.documentName)
      ? documento.setFlag(MOD, "metal", !!metal) : false };
  game.socket.on(`module.${MOD}`, d => { if (d?.capaV && !socketDefensa(d)) manejar(d); });
  asegurarGuia().catch(err => console.error(`${MOD} | capa V: guía`, err));
  // Las hojas que ya despertaron reciben los rasgos que les falten (los dones de nacimiento, por ejemplo).
  if (soyGM()) {
    (async () => {
      for (const a of game.actors) if (despierto(a)) { await asegurarRasgos(a); await refrescar(a); }
    })().catch(err => console.error(`${MOD} | capa V: rasgos`, err));
  }
  // Las hojas que ya estaban abiertas, otra vez con la barra y el botón.
  for (const app of foundry.applications.instances?.values?.() ?? []) if ((app.document instanceof Actor) && app.rendered) app.render();
});

Hooks.on("renderActorSheetV2", (app, html) => { if (activo()) decorarHoja(app, html); });
Hooks.on("dnd5e.activityConsumption", (activity, usageConfig, messageConfig, updates) => {
  if (!activo()) return;
  return alConsumir(activity, usageConfig, messageConfig, updates);
});
Hooks.on("dnd5e.postUseActivity", (activity, usageConfig) => {
  if (activo()) despuesDeUsar(activity, usageConfig).catch(err => console.error(`${MOD} | capa V`, err));
});
Hooks.on("dnd5e.preRollDamageV2", config => { if (activo()) antesDelDano(config); });
// Defensas antes de resolver (midi-qol): las espera la tirada.
Hooks.on("midi-qol.preCheckHits", async wf => { if (activo()) await defenderAtaque(wf).catch(err => console.error(`${MOD} | capa V: defensas`, err)); });
Hooks.on("midi-qol.preCheckSaves", async wf => { if (activo()) await defenderArea(wf).catch(err => console.error(`${MOD} | capa V: defensas`, err)); });
Hooks.on("midi-qol.RollComplete", wf => { if (activo()) limpiarDefensas(wf).catch(() => null); });
Hooks.on("dnd5e.restCompleted", (actor, result, config) => { if (activo()) alDescansar(actor, result, config); });
Hooks.on("dnd5e.preRollHitDieV2", config => {
  try {
    const actor = config?.subject;
    if (!activo() || !despierto(actor) || !efectosDotes(actor).some(ef => ef.alientoCura)) return;
    const mod = modDe(actor, estado(actor).car);
    if (mod > 0) config.rolls?.[0]?.parts?.push(String(mod));
  } catch (err) {
    console.warn(`${MOD} | capa V: aliento`, err);
  }
});
Hooks.on("dnd5e.rollHitDieV2", (rolls, datos) => {
  try {
    const actor = datos?.subject;
    if (!activo() || !despierto(actor) || !actor.isOwner) return;
    const n = Math.max(0, ...efectosDotes(actor).map(ef => Number(ef.aliento) || 0));
    if (!n) return;
    const cambios = cambiosRecuperacion(actor, n);
    const update = (datos.updates.actor ??= {});
    update[`flags.${MOD}.${F}.valor`] = cambios.valor;
    update[`flags.${MOD}.${F}.recResto`] = cambios.recResto;
  } catch (err) {
    console.warn(`${MOD} | capa V: aliento`, err);
  }
});
Hooks.on("refreshToken", token => { if (activo()) barraToken(token); });
Hooks.on("deleteActiveEffect", (ef, opciones) => { if (activo()) alQuitarEfecto(ef, opciones).catch(err => console.error(`${MOD} | capa V`, err)); });
Hooks.on("updateActor", (actor, cambios) => {
  if (!activo()) return;
  if (consumoPendiente(actor)?.nonce === estado(actor)?.ultimoUso) consumosPendientes.delete(claveActor(actor));
  if (soyGM() && Number(foundry.utils.getProperty(cambios, `flags.${MOD}.${F}.valor`)) < 0 && herenciaDe(actor)?.barrera) {
    manejar({ accion: "capaVBarrera", actorId: actor.id }, { interno: true });
  }
  if (foundry.utils.hasProperty(cambios, `flags.${MOD}.${F}`) || foundry.utils.hasProperty(cambios, "system.abilities")
    || foundry.utils.hasProperty(cambios, "system.currency")) {
    refrescarPanel(actor.id);
    for (const t of actor.getActiveTokens()) barraToken(t);
  }
});
Hooks.on("updateItem", (item, cambios) => {
  if (!activo() || item.type !== "class" || !foundry.utils.hasProperty(cambios, "system.levels")) return;
  const actor = item.actor;
  if (!despierto(actor) || !actor.isOwner) return;
  // Lo rearma un solo cliente: el jugador dueño si está conectado; si no, el DM.
  const jugador = game.users.find(u => u.active && !u.isGM && actor.testUserPermission(u, "OWNER"));
  if (jugador ? !jugador.isSelf : !soyGM()) return;
  refrescar(actor).then(() => {
    const t = trazos(actor);
    aLaMesa(actor, "Verbe", `<p>${escH(actor.name)} sube de nivel: reserva ${maxVerbe(actor)}, grado ${gradoMax(actor)}, y tiene <b>${t.libres} Trazos</b> para gastar en su panel.</p>`, { soloDueno: true });
    return asegurarAEDotes(actor);
  }).catch(err => console.error(`${MOD} | capa V`, err));
});

Hooks.on("dnd5e.preRollAttackV2", config => { if (activo()) configurarAtaque(config); });
Hooks.on("dnd5e.preRollSavingThrowV2", config => { if (activo()) configurarSalvacion(config); });
Hooks.on("dnd5e.postRollAttack", (rolls, datos) => {
  if (!activo()) return;
  despuesAtaque(rolls, datos, (actor, atacante, ids) => alDM({ accion: "capaVMetal", actorId: actor.id,
    atacanteId: atacante.id, efectoIds: ids })).catch(err => console.error(`${MOD} | estados`, err));
});
Hooks.on("preCreateActiveEffect", (effect, data) => { if (activo()) normalizarHielo(effect, data); });
for (const evento of ["createActiveEffect", "deleteActiveEffect", "updateActiveEffect"]) Hooks.on(evento, effect => {
  const actor = effect.parent;
  if (!activo() || !soyGM() || !(actor instanceof Actor)) return;
  revisarEstados(actor, evento === "createActiveEffect" ? effect.getFlag(MOD, F)?.estado : null)
    .catch(err => console.error(`${MOD} | estados`, err));
});
Hooks.on("updateItem", (item, cambios) => {
  if (!activo() || !item.actor?.isOwner || item.type !== "equipment" || !despierto(item.actor)) return;
  if (foundry.utils.hasProperty(cambios, "system.equipped")) asegurarAEDotes(item.actor).catch(err => console.error(`${MOD} | beneficios`, err));
});
Hooks.on("updateCombat", (combat, cambios) => {
  if (!activo() || !soyGM() || !combat.started || !("turn" in cambios || "round" in cambios)) return;
  inicioDeTurno(combat).catch(err => console.error(`${MOD} | capa V`, err));
});

/** Para las pruebas fuera de Foundry. */
export const _prueba = { aplicarDesventaja, defenderAtaque, despuesDeUsar, ponerDespertar, ponerOjo, alQuitarEfecto, inicioDeTurno, manejar, crearAprobada, asegurarRasgos };
