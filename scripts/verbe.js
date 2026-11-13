/**
 * Ecos de la frontera · capa V (v1.1)
 * Técnicas, reserva, ramas, naturalezas, dotes, cultivo y creación de técnicas, sobre dnd5e 5.2.
 * Lo carga main.js. Con el ajuste «Capa V» en Apagado no registra nada: para los jugadores no existe.
 *   apagado · nada.
 *   prueba  · solo en el cliente del DM (para probar con un actor de prueba).
 *   activo  · para todos.
 * Los datos (técnicas, dotes, linajes, reglas) vienen de data/verbe.txt, cifrado como el contenido.
 * Las fichas y el panteón vienen de los datos; las reglas de crecimiento se calculan con sus identificadores.
 */

import { VERSION_PROGRESION, NIVEL_GRADO, limiteEscalado, accesoObtencion, permisoCuota, cuotasPoder, pisoCosto, limiteDadosExtra, requisitoDote, validarConcentraciones, accionesVerbePorTurno, permisoTurno, gradoReplicas } from "./verbe-progression.js";
import { abrirReliquias } from "./relics.js";
import { actoresPresentes } from './mesa-actores.js';
import { prepararRecibo, registrarPaso } from "./mesa-resolucion.js";
import {avanceTexto,efectoHTML,textoClaro,resolucionTexto,duracionTexto,referenciaHTML,glosarioHTML,escTexto,tablaSangreHTML,huellaTexto} from "./verbe-reading.js";
import { tecnicaChocable, AYUDA_CHOQUE, PASOS_CHOQUE, reaccionDefensiva, conjuroChocable, naturalezaConjuro } from "./verbe-clash.js";
import { donDivino, asegurarNotaPanteon } from "./verbe-divinity.js";
import { VERSION_SHINOBI, accesoShinobi, dividirReserva, depositoReserva } from "./verbe-shinobi.js";
import { FORMULARIO_UNIVERSAL, validarUniversal } from "./verbe-authoring.js";
import { plantillaEnEscena } from "./verbe-plantillas.js";
import { objetivosMensaje, filtrarObjetivosMensaje, consumoMensaje, duracionFinita, quitar, marcarInicio } from "./compat.js";
import { cifrasActividad, pasosUso, chipsCifras, tipoUso, actividadDe, TIPOS_USO } from "./verbe-cifras.js";
import { problemasTecnica } from "./verbe-validate.js";
import { compendioJugadoresHTML, compendioDMHTML } from "./verbe-compendio.js";
import { aplicarNombresMundo, nombresDelMundo } from "./nombres-mundo.js";
import { tramoReserva, tramoFuerza, tramoVida, queVe } from "./verbe-lectura.js";
import { cargaDe, bonoCarga, cdInterrupcion, textoCarga } from "./verbe-canalizar.js";
import { botonDeshacer } from "./deshacer.js";
import { clonDe, limitesClones, repartoClones, creditoEntrenamiento, usarBancoClones, HORAS_DIA_ENTRENO } from "./verbe-clones.js";
import { iconoTecnica, iconoDote, esGenerico } from "./verbe-iconos.js";
import { ventanaLinaje, linajeDeEleccion, pasosOjo } from "./linaje-diario.js";
import { linajePortador, LINAJE_ALA } from "./sangre-sosten.js";
import { ESTADO_MANO_ROTA, ESTADO_IMPETU, consecuenciasDelChoque } from "./choque-consecuencias.js";
import { ESTADOS_RUPTURA, DEFENSAS, defensaDe, ponerDefensa, bonoDefensa, defensaSugerida } from "./ruptura.js";
import { DADOS_VERBE, dadoNivel, modoReserva, reservaBase, nivelesSinTirar } from "./verbe-reserva.js";
import { ETAPAS, ETAPA_MAX, etapaDe, datosEtapa, permisoEtapa, DESCUBRIR, MODOS_NATURALEZA, MODOS_SEGUNDA, modoSegunda, modoNaturaleza, siguienteDescubrimiento, requisitoDescubrir, diasRestantes } from "./verbe-etapas.js";
import { CAMPOS_TECNICA, CAMPOS_DOTE, leerCamposTecnica, leerCamposDote, diferencias, aplicarEdicionTecnica, catalogoConEdiciones } from "./verbe-ediciones.js";
import { MEJORAS, opcionesCultivo, aplicarCultivoUtilidad } from "./verbe-training.js";
import { comoSubirHTML } from "./plan-sensei.js";
import { tirarControl, textoCostoControl, tipoDote as tipoDotePuro, planDote, textoPlan, practicarDote, ACTIVIDADES_CRECIMIENTO, CD_CRECIMIENTO, puntosPorTrazo, diaCrecimiento, TOPE_CRECIMIENTO_NIVEL } from "./verbe-entreno.js";
import { presupuestoCorto } from "./rest-core.js";
import { sistema } from "./sistema/index.js";
import { aplicarEnUsuario } from "./mesa-propio.js";
import { ESTADO_DESENGANCHE } from "./turno-tracker.js";
import { ayudaCampoHTML, ayudaSeccionHTML, explicarOpcion, etapaJugadorHTML, familiaSugerida, RAMAS_PRIMERO } from "./verbe-ayuda.js";
import { MONEDAS_POR_TRAZO, TRAZOS_POR_NIVEL } from "./mercader.js";
import { VERSION_REGLAS, recuperarReserva, evaluarGasto, requisitoNatural, crearCola,
  resultadoChoque, desempateChoque, presupuestoTecnica, validarCreacion, LIMITES_CREACION } from "./verbe-core.js";
import { configurarAtaque, configurarSalvacion, despuesAtaque, normalizarHielo,
  revisarEstados, consumirMetal, metrosEnHoja } from "./verbe-effects.js";
import { pasoInicial, progresoHTML, estadoUsoHTML, tarjetaHTML, avisosJugadorHTML, ROLES_RAMA } from "./verbe-ui.js";
import { FAMILIAS, esFamilia, familiaDeSangre, marcarFamilias, familiaDeTecnica, aPiesTexto, textosAPies, piesAMetros, planEstudio, practicar, naturalezaPorDado,
  reservaPorCon, recuperacionLargaCon, golpeDeTexto, dadosGolpe, armaSirve, diasParaLlenar, gastoVerbe, economiaVerbe, TIEMPOS_EXPLICADOS } from "./verbe-327.js";

const MOD = "ecos-frontera";
const F = "verbe";
const RUTA = `modules/${MOD}`;
const LLAVE = "ecos-frontera";
const AJ = { modo: "capaV", pend: "capaVPendientes", extra: "capaVExtra", ediciones: "capaVEdiciones" };
const enSerie = crearCola();
const consumosPendientes = new Map();
const consumosChoque = new WeakSet();
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
const RAMAS_LINAJE = ["mirada", "sangre", "pacto", "pulso", "vasija"];
const NIVEL_CULTIVO = ["Sin cultivar", "Pulida", "Dominada", "Propia"];


/** Estados de naturaleza (se registran en init, antes de leer los datos). */
export const ESTADOS = {
  empapado: { name: "Empapado", img: "systems/dnd5e/icons/svg/statuses/suffocation.svg", dura: 60,
    changes: [{ key: "system.traits.dr.value", mode: 2, value: "fire" }, { key: "system.traits.dv.value", mode: 2, value: "lightning" }],
    texto: "Resistencia al fuego y vulnerabilidad al relámpago." },
  ardiendo: { name: "Ardiendo", img: "systems/dnd5e/icons/svg/statuses/burning.svg", dura: 0,
    texto: "1d6 de fuego al inicio de cada turno. Lo apagan una acción, el agua o la tierra." },
  desequilibrado: { name: "Desequilibrado", img: "systems/dnd5e/icons/svg/statuses/falling.svg", dura: 6,
    changes: [{ key: "flags.midi-qol.disadvantage.attack.all", mode: 5, value: "1" },
      ...["str", "dex", "con", "int", "wis", "cha"].map(a => ({ key: `system.abilities.${a}.attack.roll.mode`, mode: 2, value: "-1" }))],
    texto: "Desventaja en su próximo ataque; si lo empujan, va el doble de lejos." },
  embarrado: { name: "Embarrado", img: "systems/dnd5e/icons/svg/statuses/encumbered.svg", dura: 60,
    changes: [{ key: "system.attributes.movement.walk", mode: 1, value: "0.5" },
      { key: "flags.midi-qol.disadvantage.ability.save.dex", mode: 5, value: "1" },
      { key: "system.abilities.dex.save.roll.mode", mode: 2, value: "-1" }],
    texto: "Velocidad a la mitad y desventaja en las salvaciones de DES." },
  cargado: { name: "Cargado", img: "systems/dnd5e/icons/svg/statuses/marked.svg", dura: 6,
    texto: "No usa reacciones; si lleva metal, el próximo ataque con arma de metal contra él tiene ventaja." },
  canalizando: { name: "Canalizando", img: "systems/dnd5e/icons/svg/statuses/concentrating.svg", dura: 0,
    changes: [{ key: "system.attributes.movement.walk", mode: 5, value: "0" }, { key: "system.attributes.movement.fly", mode: 5, value: "0" }],
    texto: "Prepara una técnica cargada: velocidad 0, sin reacciones ni choques. Si recibe daño, salvación de Constitución (CD 10 o la mitad del daño, la mayor) o la pierde; también si queda incapacitado o lo mueven a la fuerza." },
  helado: { name: "Helado", img: "systems/dnd5e/icons/svg/statuses/restrained.svg", dura: 60,
    changes: [{ key: "system.attributes.movement.walk", mode: 2, value: "-3" }],
    texto: "−10 ft de velocidad cada vez; con velocidad 0, queda Apresado por el hielo." },
  // 3.28: la ruptura (Brecha, Grieta, Quebrado). Las técnicas y las acciones de cualquiera las imponen.
  ...ESTADOS_RUPTURA,
  // 3.29: el contragolpe de un choque puede reventar la mano.
  ...ESTADO_MANO_ROTA,
  ...ESTADO_DESENGANCHE,
  ...ESTADO_IMPETU
};
const TIPO_NAT = { fuego: "fire", agua: "bludgeoning", viento: "slashing", tierra: "bludgeoning", rayo: "lightning", escarcha: "cold",
  raiz: "piercing", magma: "fire", vapor: "fire", ceniza: "fire", tormenta: "lightning", hierro: "piercing", corriente: "lightning",
  destello: "radiant", arena: "bludgeoning", madera: "piercing" };
const ESTADO_NAT = { fuego: ["ardiendo"], agua: ["empapado"], viento: ["desequilibrado"], tierra: ["embarrado"], rayo: ["cargado"],
  escarcha: ["helado"], raiz: ["embarrado"], magma: ["ardiendo", "embarrado"], vapor: ["ardiendo"], ceniza: ["ardiendo"],
  tormenta: ["desequilibrado", "cargado"], hierro: ["cargado"], corriente: ["empapado", "cargado"], destello: ["cargado"],
  arena: ["embarrado"], madera: ["embarrado"] };
/** Ocho Cerrojos: lo que suma cada uno a la hoja (se acumulan). */
const CERROJO_FX = {
  1: [["system.bonuses.mwak.damage", 2, "+ 2"]],
  2: [["system.attributes.movement.walk", 2, "@paso"]],
  3: [["system.bonuses.mwak.attack", 2, "+ 1"], ["system.attributes.ac.bonus", 2, "+ 1"]],
  4: [["system.traits.dr.value", 2, "bludgeoning"], ["system.traits.dr.value", 2, "slashing"], ["system.traits.dr.value", 2, "piercing"],
    ["system.bonuses.mwak.damage", 2, "+ 1d6"]],
  5: [["system.attributes.movement.walk", 1, "2"]],
  6: [["system.bonuses.mwak.damage", 2, "+ 2d6"]],
  7: [["system.bonuses.mwak.damage", 2, "+ 4d6"], ["flags.dnd5e.meleeCriticalThreshold", 5, "18"]],
  8: [["system.bonuses.mwak.damage", 2, "+ 4d6"]]
};

let D = null; // datos de data/verbe.txt
let BASE = null; // técnicas y dotes tal como vienen en el módulo, antes de las ediciones del DM
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
/** 3.27: familias por nacimiento y todo en pies, antes de guardar la base del catálogo. */
function prepararDatos327(datos) {
  if (!datos || datos.prep327) return datos;
  marcarFamilias(datos); textosAPies(datos);
  // La recuperación es lenta (15 % + CON por cada dos niveles, 3.28): las dotes de reserva dicen su proporción nueva.
  const dote = id => datos.dotes?.find(d => d.id === id);
  if (dote("hijo-santuario")) dote("hijo-santuario").texto = "El Descanso Largo en el Santuario te devuelve la mitad más: el 22 % de tu Verbe en vez del 15 % (más tu Constitución).";
  if (dote("sueno-reparador")) dote("sueno-reparador").texto = String(dote("sueno-reparador").texto).replace("A la intemperie recuperas un tercio de tu Verbe en vez de un cuarto.", "A la intemperie, Respiro y Aliento recuperan hasta dos tercios de tu recuperación larga en vez de la mitad.");
  // Técnicas de golpe: con tu arma, o el próximo golpe (lo que pide la técnica, leído de su texto).
  for (const t of datos.tecnicas ?? []) {
    const g = golpeDeTexto(t.texto);
    if (!g) continue;
    const efs = t.item?.effects ?? [];
    g.yaTiene = efs.some(e => e.flags?.[MOD]?.[F]?.golpeSiguiente || (e.changes ?? []).some(c => /bonuses\.(mwak|rwak|msak|rsak)\.damage/.test(c.key)));
    for (const e of efs) if (e.flags?.[MOD]?.[F]?.golpeSiguiente) e.flags[MOD][F].consumir = true;
    t.golpe327 = g;
    const meta = t.item?.flags?.[MOD]?.[F];
    if (meta) meta.golpe327 = g;
  }
  datos.prep327 = true;
  return datos;
}
export function usarDatos(datos, modo = null) { prepararDatos327(datos); D = datos; BASE = datos ? { tecnicas: datos.tecnicas, dotes: datos.dotes } : null; if (modo) MODO = modo; }
const edicionesMundo = () => { try { return game.settings.get(MOD, AJ.ediciones) ?? {}; } catch { return {}; } };
/** Vuelve a montar técnicas y dotes desde el módulo con las diferencias que guardó el DM en el mundo. */
export function aplicarEdicionesMundo(ediciones = edicionesMundo()) {
  if (!D || !BASE) return;
  const r = catalogoConEdiciones(BASE, ediciones);
  D.tecnicas = r.tecnicas;
  D.dotes = r.dotes;
}
export const tecnicaOriginal = id => BASE?.tecnicas?.find(t => t.id === id) ?? null;
export const doteOriginal = id => BASE?.dotes?.find(d => d.id === id) ?? null;
/** Guarda (o borra, si no queda ninguna diferencia) la edición de una técnica o dote del catálogo base. */
export function guardarEdicionBase(tipo, id, propuesto) {
  if (!game.user.isGM) return Promise.resolve(false);
  return enSerie("catalogo", async () => {
    const tecnica = tipo === "tecnica", orig = tecnica ? tecnicaOriginal(id) : doteOriginal(id);
    if (!orig) return rechazar("No encuentro ese original en el catálogo del módulo.");
    const r = diferencias(tecnica ? CAMPOS_TECNICA : CAMPOS_DOTE, tecnica ? leerCamposTecnica(orig) : leerCamposDote(orig), propuesto);
    if (!r.ok) return rechazar(r.errores.join(" "));
    if (tecnica) {
      const errores = problemasTecnica(aplicarEdicionTecnica(orig, r.cambios)).filter(p => p.nivel === "error");
      if (errores.length) return rechazar(`No se guardó: ${errores.map(p => p.texto).join(" ")}`);
    }
    const ed = foundry.utils.deepClone(edicionesMundo()), clave = tecnica ? "tecnicas" : "dotes";
    ed[clave] ??= {};
    if (Object.keys(r.cambios).length) ed[clave][id] = r.cambios; else delete ed[clave][id];
    await game.settings.set(MOD, AJ.ediciones, ed);
    return { cambios: r.cambios };
  });
}
export function restaurarOriginal(tipo, id) { return guardarEdicionBase(tipo, id, {}); }
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

export function aLaMesa(actor, titulo, html, { soloDueno = false, flags = null } = {}) {
  const data = { content: `<div class="ecos-card ecos-verbe-chat"><h3>${titulo}</h3>${html}</div>`, speaker: ChatMessage.getSpeaker({ actor }) };
  if (flags) data.flags = flags;
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
/** La primera naturaleza cuando está oculta (modo «secreta»): la fijó el DM y se descubre entrenando. */
export const ocultaPrimeraDe = actor => desrevolver(estado(actor)?.oc1, actor.id);
const veLinaje = actor => dm() || !!estado(actor)?.linajeVisible;
/**
 * La sangre del personaje (D5, tarea 2.5): sangre, familia y herencia son lo mismo, y hay una sola por nacimiento.
 * Una Mirada heredada es esa sangre; un ojo trasplantado no cuenta. El Pacto va aparte (se gana en la historia).
 */
export function sangreDe(actor) {
  const e = estado(actor) ?? {}, lin = linajeDe(actor);
  const heredadas = Object.keys(e.miradas ?? {}).filter(o => Number(e.miradas[o]) > 0 && !(e.trasplantes ?? []).includes(o));
  return { linaje: lin, fuerza: e.fuerza ?? "ninguna", visible: !!e.linajeVisible, heredadas, activa: !!e.familiaActiva,
    tipo: lin?.mirada ? "mirada" : lin?.req ? "herencia" : heredadas.length ? "mirada" : null };
}
/** ¿Darle este linaje u ojo heredado le pondría una segunda sangre? Devuelve el motivo o null. */
export function conflictoSangre(actor, { linaje = undefined, ojo = null } = {}) {
  const s = sangreDe(actor);
  const lin = linaje === undefined ? s.linaje : (D?.linajes?.find(l => l.id === linaje) ?? null);
  if (ojo) {
    if (lin && lin.mirada !== ojo) return `Ya tiene una sangre (${lin.alias ?? lin.nombre}). Una Mirada heredada sería otra: dásela como trasplante.`;
    const otra = s.heredadas.find(o => o !== ojo);
    if (otra) return `Ya tiene otra Mirada heredada (${D.miradas.find(m => m.id === otra)?.nombre ?? otra}). Solo hay una sangre por nacimiento.`;
    return null;
  }
  const otra = s.heredadas.find(o => !lin || lin.mirada !== o);
  if (lin && otra) return `Tiene una Mirada heredada (${D.miradas.find(m => m.id === otra)?.nombre ?? otra}), que ya es su sangre. Quítasela o márcala como trasplante antes de darle otro linaje.`;
  return null;
}
/** Activar las técnicas familiares (2.5c): el jugador descubre su sangre por rol y desde ahora la ve y la aprende. */
/**
 * Migración de 3.6 (2.5a): una Mirada heredada sin linaje pasa a ser su sangre; si alguien tiene dos sangres
 * (un linaje y otra Mirada heredada), se avisa al DM una vez con la lista para que decida. No se borra nada.
 */
/**
 * Tira los dados de reserva que falten (2.2b): al despertar y al subir de nivel. Solo el DM. Sin mínimo.
 * El resultado sale en el chat para el DM y el dueño, y queda en el historial.
 */
export function asegurarTiradasVerbe(actor) { return serializarActor(actor, async () => {
  if (!soyGM() || !despierto(actor)) return [];
  const e = estado(actor), faltan = nivelesSinTirar(e, nivelDe(actor));
  if (!faltan.length) return [];
  const tiradas = { ...(e.dadosVerbe.tiradas ?? {}) }, filas = [];
  for (const k of faltan) {
    const t = dadoNivel(k), r = await new Roll(t.formula).evaluate();
    tiradas[k] = Number(r.total) || 0;
    filas.push(`nivel ${k}: ${t.formula} = <b>${tiradas[k]}</b>`);
  }
  await guardar(actor, { dadosVerbe: { ...e.dadosVerbe, tiradas }, historial: hist(e, `Reserva por dados: ${faltan.map(k => `nivel ${k} +${tiradas[k]}`).join(", ")}`) });
  aLaMesa(actor, "✦ Reserva de Verbe", `<p>${escH(actor.name)} tira su reserva: ${filas.join(" · ")}. Máximo ahora: <b>${maxVerbe(actor)}</b>. Sin mínimo: si falta, se compensa con dotes o con Trazos que dé el DM por rol.</p>`, { soloDueno: true });
  refrescarPanel(actor.id);
  return faltan;
}); }
/** El DM cambia el modo de reserva. Pasar a dados deja fijos (con la tabla) los niveles que ya tenía. */
export async function cambiarModoReserva(actor, modo) {
  if (!game.user.isGM || !despierto(actor)) return false;
  const e = estado(actor), n = nivelDe(actor);
  if (modo === modoReserva(e)) return false;
  if (modo === "dados") await guardar(actor, { dadosVerbe: { modo: "dados", fijoHasta: n, tiradas: {}, version: 1 }, historial: hist(e, `Reserva por dados desde el nivel ${n + 1} (hasta el ${n}, la tabla)`) });
  else await guardar(actor, { dadosVerbe: { modo: "promedio", version: 1 }, historial: hist(e, "Reserva con la tabla fija") });
  refrescarPanel(actor.id);
  return true;
}
/** Taller de NPC, «Verbe variable» (2.3b): mueve su reserva un porcentaje acotado (±25 % como mucho). */
export async function variarReservaNpc(actor, pct) {
  if (!game.user.isGM || !despierto(actor)) return false;
  const p = Math.max(-0.25, Math.min(0.25, Number(pct) || 0));
  const e = estado(actor), base = maxVerbe(actor) - (Number(e.maxVariable) || 0), d = Math.round(base * p);
  await guardar(actor, { maxVariable: d, valor: Math.min(Number(e.valor) || 0, base + d), historial: hist(e, `Verbe variable: ${d >= 0 ? "+" : ""}${d} de reserva`) });
  return d;
}
/* ---------- Técnicas cargadas: Canalizando (3.3) ---------- */
const efectoCanal = actor => actor?.effects?.find(x => x.getFlag?.(MOD, F)?.canalizar && !x.disabled) ?? null;
/** Empieza a canalizar: paga su Verbe y queda Canalizando (sin reacciones ni choques, quieto). */
export function canalizar(actor, id) { return serializarActor(actor, async () => {
  const item = itemsDe(actor, id)[0], meta = item?.getFlag(MOD, F), c = cargaDe(meta);
  if (!c) return rechazar("No es una técnica cargada.");
  if (efectoCanal(actor)) return rechazar("Ya estás canalizando otra técnica: libérala o déjala.", "warn");
  if (noPuedeActuar(actor)) return rechazar("Su estado no le permite canalizar.", "warn");
  const e = estado(actor), costo = costoUso(actor, meta, Number(meta.g) || 0);
  const permiso = evaluarGasto({ valor: Number(e.valor) || 0, costo, limite: limiteNegativo(actor), grado: Number(meta.g) || 0, agotamiento: sistema.agotamiento(actor) });
  if (!permiso.ok) return rechazar(permiso.motivo, "warn");
  // 3.34: lo que se carga más de un turno empieza con tu acción Verbe.
  const turno = permisoTurno(Number(meta.g) || 0, { combate: game.combat?.started ? (game.combat.id ?? "combate") : null, estado: e.turnoTecnicas, maximo: maxAccionesVerbe(actor) });
  if (!turno.ok) return rechazar(turno.motivo, "warn");
  const ef = efectoEstado("canalizando", foundry.utils.randomID());
  ef.flags[MOD][F].canalizar = { id, carga: 0, min: c.min, max: c.max, pagado: Number(e.valor || 0) - permiso.despues };
  ef.name = `Canalizando: ${item.name}`;
  await actor.createEmbeddedDocuments("ActiveEffect", [ef]);
  await guardar(actor, { valor: permiso.despues, canalizada: null, ...(turno.cambios ? { turnoTecnicas: turno.cambios } : {}), historial: hist(e, `Canaliza ${item.name} (${costo} Verbe)`) });
  aLaMesa(actor, `✦ Canaliza ${escH(item.name)}`, `<p>${escH(actor.name)} empieza a cargar <b>${escH(item.name)}</b> (${costo} Verbe). Queda quieto, sin reacciones ni choques. Puede liberarla desde el turno ${c.min}; cada turno suma carga (hasta ${c.max}).</p>`);
  if (permiso.despues < 0) await sobreesfuerzo(actor, Number(meta.g) || 0, permiso.despues);
  refrescarPanel(actor.id);
  return true;
}); }
/** Al empezar su turno, la carga sube 1 (hasta el máximo). */
async function subirCarga(actor) {
  const ef = efectoCanal(actor); if (!ef) return;
  const fl = ef.getFlag(MOD, F).canalizar, carga = Math.min(fl.max, (Number(fl.carga) || 0) + 1);
  await ef.setFlag(MOD, F, { ...ef.getFlag(MOD, F), canalizar: { ...fl, carga } });
  aLaMesa(actor, "✦ Carga", `<p>${escH(actor.name)}: carga <b>${carga}/${fl.max}</b>${carga >= fl.min ? " · ya puede liberarla" : ` · puede liberarla con ${fl.min}`}.</p>`);
  refrescarPanel(actor.id);
}
/** Libera la técnica: sin volver a pagar y con lo que sume la carga. */
export function liberarCanalizada(actor) { return serializarActor(actor, async () => {
  const ef = efectoCanal(actor); if (!ef) return rechazar("No está canalizando.");
  const fl = ef.getFlag(MOD, F).canalizar, meta = itemsDe(actor, fl.id)[0]?.getFlag(MOD, F), c = cargaDe(meta);
  if ((Number(fl.carga) || 0) < fl.min) return rechazar(`Le falta carga: tiene ${fl.carga} y necesita ${fl.min}.`, "warn");
  const bono = bonoCarga(c, fl.carga);
  await guardar(actor, { canalizada: { id: fl.id, carga: fl.carga, bono, lista: true } });
  await ef.delete();
  aLaMesa(actor, "✦ Libera la carga", `<p>${escH(actor.name)} libera <b>${escH(itemsDe(actor, fl.id)[0]?.name ?? fl.id)}</b> con carga ${fl.carga}: ${[bono.dados ? `+${bono.dados} dados de daño` : "", bono.cd ? `+${bono.cd} a la CD (súmala en la salvación)` : "", bono.ataque ? `+${bono.ataque} al ataque (súmalo en la tirada)` : ""].filter(Boolean).join(", ") || "sin extras"}.</p>`);
  return "liberada";
}).then(r => (r === "liberada" ? usarTecnica(actor, estado(actor).canalizada.id) : r)); }
/** Se interrumpe: se pierde la carga y el Verbe pagado. */
export async function interrumpirCanal(actor, motivo = "") {
  const ef = efectoCanal(actor); if (!ef) return false;
  const nombre = itemsDe(actor, ef.getFlag(MOD, F).canalizar.id)[0]?.name ?? "la técnica";
  await ef.delete();
  aLaMesa(actor, "✦ Se rompe la carga", `<p>${escH(actor.name)} pierde ${escH(nombre)}${motivo ? `: ${escH(motivo)}` : ""}. El Verbe pagado se pierde.</p>`);
  refrescarPanel(actor.id);
  return true;
}
/** Daño mientras canaliza: salvación de Constitución (CD 10 o la mitad del daño, la mayor). */
async function golpeCanalizando(actor, dano) {
  if (!efectoCanal(actor) || dano <= 0) return;
  const cd = cdInterrupcion(dano);
  const r = await sistema.tirarSalvacion(actor, "con", { target: cd }, { configure: false }, { data: { flavor: `Mantener la carga (CD ${cd})` } });
  const roll = Array.isArray(r) ? r[0] : r;
  if (!roll || roll.total < cd) await interrumpirCanal(actor, `recibe ${dano} de daño y falla la salvación (CD ${cd})`);
}
/** Rearma las técnicas de todas las fichas despiertas (también tokens no vinculados) si cambió su ficha base. */
export async function rearmarMundo() {
  if (!soyGM()) return 0;
  const actores = [...(game.actors ?? [])];
  for (const sc of game.scenes ?? []) for (const t of sc.tokens ?? []) if (!t.actorLink && t.actor) actores.push(t.actor);
  let n = 0;
  for (const a of actores) {
    if (!despierto(a) || !itemsTecnica(a).length) continue;
    try { await refrescar(a); n++; } catch (err) { console.warn(`${MOD} | rearmar ${a.name}`, err); }
  }
  return n;
}
/* ---------- Clones del Verbe (3.5) ---------- */
const esClon = a => !!a?.getFlag?.(MOD, F)?.clon;
/** Al usar una técnica de clones: pregunta (si quiere) cuántas copias y cuánto Verbe le da a cada una. */
async function pedirClones(actor, item, meta) {
  if (!actor?.isOwner) return;
  const c = clonDe(meta), lim = limitesClones(c, { dotes: dotesActivas(actor), competencia: competencia(actor) });
  const disp = Math.max(0, Number(estado(actor)?.valor) || 0);
  const sugerido = Math.max(lim.minimo, Math.min(disp, Math.floor(disp / (lim.copias + 1)) || lim.minimo));
  const r = await foundry.applications.api.DialogV2.wait({
    window: { title: `${item.name} · clones`, icon: "fa-solid fa-people-group" },
    content: `<div class="ecos-dialogo"><p>Cada copia es una ficha nueva <b>«Clon de ${escH(actor.name)}»</b> junto a ti, con ${c.pg} PG${c.ca ? ` y CA ${c.ca}` : ""} y el Verbe que le des (sale de tu reserva: tienes ${disp}). Puede usar tus técnicas. Si la destruyen, ese Verbe se pierde; si la disipas, te vuelve lo que le quede y recuerdas lo que vivió (sin experiencia).</p>
      <label>Copias (1 a ${lim.copias}) <input name="copias" type="number" min="1" max="${lim.copias}" value="1"></label>
      <label>Verbe para cada una (mínimo ${lim.minimo}) <input name="verbe" type="number" min="${lim.minimo}" value="${sugerido}"></label></div>`,
    rejectClose: false,
    buttons: [{ action: "crear", label: "Crear los clones", icon: "fa-solid fa-check", default: true, callback: (_e, b) => ({ copias: Number(b.form.elements.copias.value), verbe: Number(b.form.elements.verbe.value) }) },
      { action: "no", label: "Ninguno", icon: "fa-solid fa-xmark" }]
  });
  if (!r || typeof r !== "object") return;
  const ok = repartoClones(r, { disponible: disp, limites: lim });
  if (!ok.ok) return avisoUso(ok.motivo);
  alDM({ accion: "capaVClones", actorUuid: actor.uuid, tecnica: meta.id, copias: ok.copias, verbe: ok.verbe });
}
/** Lo hace el DM: descuenta el Verbe y crea las fichas y los tokens junto al creador. */
async function crearClones(creador, d) {
  if (!soyGM()) return false;
  const meta = itemsDe(creador, d.tecnica)[0]?.getFlag(MOD, F) ?? tecnicaPorId(d.tecnica, creador)?.item?.flags?.[MOD]?.[F];
  const c = clonDe(meta); if (!c) return false;
  const lim = limitesClones(c, { dotes: dotesActivas(creador), competencia: competencia(creador) }), e = estado(creador);
  const ok = repartoClones(d, { disponible: Math.max(0, Number(e.valor) || 0), limites: lim });
  if (!ok.ok) { await susurrarDM("Clones", `<p>${escH(creador.name)}: ${escH(ok.motivo)}</p>`); return false; }
  await guardar(creador, { valor: (Number(e.valor) || 0) - ok.total, historial: hist(e, `Crea ${ok.copias} clon${ok.copias > 1 ? "es" : ""} (${ok.verbe} Verbe cada uno)`) });
  let carpeta = game.folders?.find?.(f => f.type === "Actor" && f.name === "Clones del Verbe");
  if (!carpeta && globalThis.Folder?.create) carpeta = await Folder.create({ name: "Clones del Verbe", type: "Actor" });
  const base = creador.toObject();
  for (const k of ["_id", "_stats", "sort", "folder"]) delete base[k];
  base.ownership = foundry.utils.deepClone(creador.ownership ?? creador.baseActor?.ownership ?? { default: 0 });
  base.folder = carpeta?.id ?? null;
  const nonce = foundry.utils.randomID();
  const datos = Array.from({ length: ok.copias }, (_, i) => {
    const x = foundry.utils.deepClone(base);
    x.name = `Clon de ${creador.name}${ok.copias > 1 ? ` ${i + 1}` : ""}`;
    for (const [k, v] of Object.entries({ ...sistema.datosPg(c.pg, { max: c.pg, temp: 0 }), ...(c.ca ? sistema.datosCaFija(c.ca) : {}) })) foundry.utils.setProperty(x, k, v);
    const v = foundry.utils.deepClone(x.flags?.[MOD]?.[F] ?? {});
    Object.assign(v, { valor: ok.verbe, compras: [], historial: [`Clon de ${creador.name}`], clon: { de: creador.uuid, deNombre: creador.name, tecnica: d.tecnica, verbe: ok.verbe, nonce, creado: Date.now(), creadoMundo: Number(game.time?.worldTime) || 0, registro: [] } });
    foundry.utils.setProperty(x, `flags.${MOD}.${F}`, v);
    foundry.utils.setProperty(x, `flags.${MOD}.pj`, false);
    if (x.prototypeToken) { x.prototypeToken.name = x.name; x.prototypeToken.actorLink = true; delete x.prototypeToken.actorId; }
    return x;
  });
  const creados = await Actor.createDocuments(datos);
  const tok = creador.getActiveTokens?.()[0]?.document ?? creador.token ?? null, escena = tok?.parent ?? canvas?.scene;
  if (escena && tok) {
    const g = escena.grid?.size ?? 100, pasos = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]];
    const tokens = [];
    for (const [i, a] of creados.entries()) {
      const [dx, dy] = pasos[i % pasos.length], vuelta = Math.floor(i / pasos.length) + 1;
      const t = (await a.getTokenDocument({ x: tok.x + dx * g * vuelta, y: tok.y + dy * g * vuelta })).toObject();
      tokens.push(t);
    }
    await escena.createEmbeddedDocuments("Token", tokens);
  }
  aLaMesa(creador, "✦ Clones", `<p>${escH(creador.name)} crea <b>${ok.copias}</b> clon${ok.copias > 1 ? "es" : ""} con <b>${ok.verbe} Verbe</b> cada uno (${ok.total} en total). Cada uno tiene ${c.pg} PG. Si los destruyen, ese Verbe se pierde.</p>`);
  return creados;
}
/** 3.39: usa los días que entrenaron sus clones para cubrir un entrenamiento. */
async function gastarBancoClones(actor, dias) {
  const ent = estado(actor)?.entrenoClon;
  if (!ent?.banco) return null;
  const r = usarBancoClones(ent.banco, dias);
  if (r.usa) await guardar(actor, { entrenoClon: { ...ent, banco: r.queda } });
  return r;
}
/** Disipar (o destruir) un clon: si lo disipa su creador le vuelve el Verbe que le quede; siempre deja recuerdos. */
export async function disiparClon(clon, { destruido = false } = {}) {
  if (!soyGM() || !esClon(clon)) return false;
  const info = estado(clon).clon, resto = Math.max(0, Number(estado(clon).valor) || 0);
  let creador = null; try { creador = fromUuidSync(info.de); } catch { creador = null; }
  creador = creador instanceof Actor ? creador : creador?.actor ?? null;
  if (creador && !destruido && resto) {
    const ec = estado(creador); await guardar(creador, { valor: Math.min(maxVerbe(creador), (Number(ec.valor) || 0) + resto), historial: hist(ec, `Disipa un clon: recupera ${resto} Verbe`) });
  }
  const vivido = (info.registro ?? []).join(" · ");
  // 3.39: lo que entrenó cuenta para su creador (8 h = 1 día, tope diario = competencia del Verbe).
  const ahora = Number(game.time?.worldTime) || 0, sugeridas = info.creadoMundo != null ? Math.max(0, Math.floor((ahora - Number(info.creadoMundo)) / 3600)) : 0;
  const ecInicial = creador ? estado(creador) : null, dia = Math.floor(ahora / 86400), ent = ecInicial?.entrenoClon ?? {};
  const yaHoy = ent.dia === dia ? Number(ent.hoy) || 0 : 0, tope = creador ? competencia(creador) : 0;
  let recuerdos = vivido, horas = 0;
  try {
    const r = await foundry.applications.api.DialogV2.wait({ window: { title: `Recuerdos de ${clon.name}` },
      content: `<div class="ecos-dialogo"><p>${destruido ? "Lo destruyeron: su Verbe se pierde." : `Su creador lo disipa: recupera ${resto} Verbe.`} Escribe o aprueba lo que su creador recuerda (lo que vio, oyó, sintió y aprendió). No da experiencia.</p><textarea name="r" rows="6" maxlength="2000">${escH(vivido)}</textarea>
        ${creador ? `<label>Horas que pasó entrenando <input type="number" name="horas" min="0" max="240" step="1" value="${sugeridas}"></label><p class="ecos-nota">Cada ${HORAS_DIA_ENTRENO} h cuentan como 1 día de entrenamiento para ${escH(creador.name)}. Hoy sus clones ya le dieron ${yaHoy} de ${tope} días (tope diario: su competencia del Verbe). Si estaba entrenando una naturaleza, se le acorta; si no, quedan guardados para su próxima técnica o cultivo. Pon 0 si no entrenó.</p>` : ""}</div>`,
      rejectClose: false, buttons: [{ action: "ok", label: "Enviar recuerdos", default: true, callback: (_e, b) => ({ r: b.form.elements.r.value, horas: b.form.elements.horas?.value ?? 0 }) }, { action: "no", label: "Sin recuerdos" }] });
    if (r && typeof r === "object") { recuerdos = r.r; horas = Number(r.horas) || 0; }
    else recuerdos = r === "no" ? "" : vivido;
  } catch { /* sin ventana */ }
  let notaEntreno = "", antesClon = null;
  if (creador && horas > 0) {
    const ec = estado(creador), cr = creditoEntrenamiento({ horas, horasPrevias: ent.horas, yaHoy, tope });
    const cambios = { entrenoClon: { dia, hoy: cr.hoy, horas: cr.sobranHoras, banco: Number(ent.banco) || 0 } };
    if (cr.dias) {
      if (ec.entrenoNat) { cambios.entrenoNat = { ...ec.entrenoNat, hasta: Math.max(ahora, Number(ec.entrenoNat.hasta) - cr.dias * 86400) }; notaEntreno = ` Sus clones entrenaron por él: el entrenamiento de su naturaleza se acorta <b>${cr.dias} día${cr.dias === 1 ? "" : "s"}</b>.`; }
      else { cambios.entrenoClon.banco += cr.dias; notaEntreno = ` Sus clones entrenaron por él: <b>+${cr.dias} día${cr.dias === 1 ? "" : "s"}</b> de entrenamiento guardados (${cambios.entrenoClon.banco} en total) para su próxima técnica o cultivo.`; }
      cambios.historial = hist(ec, `Sus clones le acreditan ${cr.dias} día(s) de entrenamiento`);
    }
    if (cr.recortados) notaEntreno += ` ${cr.recortados} día${cr.recortados === 1 ? "" : "s"} más se pierden: hoy ya llegó al tope (${cr.tope}).`;
    else if (!cr.dias) notaEntreno = ` Entrenó ${horas} h: se guardan hasta completar un día (${cr.sobranHoras} de ${HORAS_DIA_ENTRENO} h).`;
    antesClon = { cambios: [{ uuid: creador.uuid, antes: { [`flags.${MOD}.verbe.entrenoClon`]: ec.entrenoClon, [`flags.${MOD}.verbe.entrenoNat`]: ec.entrenoNat } }], borrar: [] };
    await guardar(creador, cambios);
  }
  if (creador) aLaMesa(creador, `✦ Recuerdos del clon`, `<p>${escH(clon.name)} ${destruido ? "se deshace al recibir el golpe" : "se disipa"}${!destruido && resto ? ` y devuelve ${resto} Verbe` : ""}.${recuerdos ? ` ${escH(creador.name)} recuerda: <i>${escH(recuerdos)}</i>` : ""}${notaEntreno}</p><p class="ecos-nota">Los recuerdos no dan experiencia.</p>${antesClon ? botonDeshacer() : ""}`, { soloDueno: true, flags: antesClon ? { [MOD]: { deshacer: antesClon } } : null });
  for (const sc of game.scenes ?? []) { const ids = (sc.tokens ?? []).filter(t => t.actorId === clon.id).map(t => t.id); if (ids.length) await sc.deleteEmbeddedDocuments("Token", ids); }
  await clon.delete();
  return true;
}
export async function revisarSangres() {
  if (!soyGM() || !D) return [];
  const conflictos = [];
  for (const a of game.actors ?? []) {
    const e = estado(a);
    if (!e?.despierto) continue;
    const s = sangreDe(a);
    if (!s.linaje && s.heredadas.length === 1) {
      const m = D.miradas.find(x => x.id === s.heredadas[0]);
      if (m?.linaje && D.linajes.some(l => l.id === m.linaje)) await guardar(a, { linaje: m.linaje, historial: hist(e, `Su Mirada heredada (${m.nombre}) queda como su sangre`) });
      continue;
    }
    const c = conflictoSangre(a) ?? (s.heredadas.length > 1 ? `Tiene ${s.heredadas.length} Miradas heredadas.` : null);
    if (c) conflictos.push(`${escH(a.name)}: ${escH(c)}`);
  }
  let visto = "";
  try { visto = game.settings.get(MOD, "capaVSangre") ?? ""; } catch { visto = ""; }
  const firmaC = conflictos.join("|");
  if (conflictos.length && firmaC !== visto) await susurrarDM("Una sola sangre por personaje", `<p>Desde 3.6, sangre, familia y herencia son lo mismo y hay una por nacimiento (una Mirada heredada cuenta; un trasplante no). Revisa:</p><ul>${conflictos.map(x => `<li>${x}</li>`).join("")}</ul><p>No se cambió nada: decide en Herramientas del DM de cada ficha.</p>`);
  try { await game.settings.set(MOD, "capaVSangre", firmaC); } catch { /* sin ajuste */ }
  return conflictos;
}
export async function activarFamilia(actor, nota = "") {
  if (!game.user.isGM) return false;
  const e = estado(actor), s = sangreDe(actor);
  if (!s.linaje && !s.heredadas.length) return rechazar("No tiene sangre que activar.", "warn");
  const n = String(nota ?? "").trim().slice(0, 200);
  await guardar(actor, { linajeVisible: true, familiaActiva: { fecha: new Date().toISOString(), por: game.user.name, nota: n },
    historial: hist(e, `Descubre su sangre${s.linaje ? `: ${s.linaje.alias ?? s.linaje.nombre}` : ""}${n ? ` (${n})` : ""}`) });
  aLaMesa(actor, "✦ Tu sangre despierta", `<p>${escH(actor.name)} descubre de dónde viene: <b>${escH(s.linaje?.alias ?? s.linaje?.nombre ?? "su Mirada")}</b>. Desde ahora sus técnicas familiares aparecen en Aprender, con sus requisitos.</p>`, { soloDueno: true });
  await asegurarRasgos(actor);
  await refrescar(actor);
  return true;
}

export function nivelDe(actor) {
  if (actor?.type === "character") return Math.clamp(sistema.nivel(actor), 1, 20);
  const e = estado(actor);
  return Math.clamp(Number(e?.nivel) || Math.round(sistema.vd(actor) || 1) || 1, 1, 20);
}
export const competencia = actor => sistema.competencia(actor) || Math.floor((nivelDe(actor) + 7) / 4);
export const modDe = (actor, car) => sistema.mod(actor, car);
/** Hasta el grado 9 (nivel 17), (nivel + 1) ÷ 2; el nivel 19 llega al grado 10 y el 20 al 11. Lo dicen los datos (gradoMax). */
export const GRADO_TOPE = 11;
const gradoDeNivel = n => Math.min(GRADO_TOPE, Number(D?.gradoMax?.[Math.clamp(n, 1, 20)]) || Math.min(9, Math.floor((n + 1) / 2)));
export const gradoMax = actor => gradoDeNivel(nivelDe(actor));
/** Las técnicas concedidas a mano siguen utilizándose a su grado base; elevarlas exige dominio de rama. */
export const gradoUsable = (actor, meta) => {
  if(!meta.id&&!meta.sube)return topeRama(actor,meta.rama);
  const activas=dotesActivas(actor),nivel=nivelDe(actor);
  let max=limiteEscalado(meta,{nivel,rangoMax:rangoGrado(rangoDe(actor,meta.rama)),profundo:Number(activas.includes('escalado-profundo'))+Number(efectosDotes(actor).some(e=>e.escaladoRama?.[meta.rama]))});
  while(max>meta.g&&!accesoObtencion({...meta,g:max},{nivel,dotes:activas}).ok)max--;
  return max;
};
const topeRama = (actor,rama) => Math.min(gradoMax(actor),rangoGrado(rangoDe(actor,rama)));
const contextoDote = actor => ({estado:estado(actor),nivel:nivelDe(actor),conocidas:itemsTecnica(actor).map(i=>i.getFlag(MOD,F).id),naturalezas:[...natsDe(actor)],herencia:!!herenciaDe(actor),nombreDote:id=>D.dotes.find(d=>d.id===id)?.nombre,nombreTecnica:id=>tecnicaPorId(id,actor)?.n});
const cacheBeneficios=new WeakMap(),indicesDote=new WeakMap();
function beneficiosDotes(actor){
  if(!D?.dotes||!actor)return {activas:[],efectos:[]};
  const e=estado(actor)??{},ctx=contextoDote(actor),propias=Object.keys(e.cultivos??{}).filter(id=>e.cultivos[id].nivel>=3);
  const clave=JSON.stringify([e.dotes,e.rangos,e.hitosShinobi,e.miradas,e.afinidad,e.trasplantes,e.cerrojos,e.fuerza,e.pactos,ctx.nivel,ctx.conocidas,ctx.naturalezas,ctx.herencia,propias]);
  const cache=cacheBeneficios.get(actor);if(cache?.catalogo===D.dotes&&cache.clave===clave)return cache;
  let indice=indicesDote.get(D.dotes);if(!indice){indice=new Map(D.dotes.map(d=>[d.id,d]));indicesDote.set(D.dotes,indice);}
  const poseidas=new Set(e.dotes??[]),memo=new Map();
  const probar=(id,camino=new Set())=>{
    if(!poseidas.has(id)||camino.has(id))return false;if(memo.has(id))return memo.get(id);
    const d=indice.get(id),r=d?.requisitos??{},visitadas=new Set([...camino,id]);
    const ok=!!d&&requisitoDote(r,ctx).ok&&Object.keys(r.ramas??{}).every(rama=>ramaAbierta(actor,rama))&&(r.dotes??[]).every(p=>probar(p,visitadas))&&(!r.algunaDote?.length||r.algunaDote.some(p=>probar(p,visitadas)));
    memo.set(id,ok);return ok;
  };
  const activas=[...poseidas].filter(id=>probar(id)),efectos=activas.map(id=>indice.get(id)?.efecto).filter(Boolean);
  const resultado={catalogo:D.dotes,clave,activas,efectos};cacheBeneficios.set(actor,resultado);return resultado;
}
const doteActiva=(actor,d)=>beneficiosDotes(actor).activas.includes(d?.id);
const dotesActivas=actor=>beneficiosDotes(actor).activas;
/** 3.73: ¿tiene esta dote y cumple lo que pide (rango, nivel, dote previa)? Para los estilos de combate automáticos. */
export const estiloActivo=(actor,id)=>dotesActivas(actor).includes(id);
const capacidadReplicas=actor=>gradoReplicas(dotesActivas(actor));
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
export const efectosDotes = actor => beneficiosDotes(actor).efectos;
const sumaEf = (actor, f) => efectosDotes(actor).reduce((t, ef) => t + (Number(f(ef)) || 0), 0);

export function maxVerbe(actor) {
  const e = estado(actor);
  if (!e?.despierto) return 0;
  const n = nivelDe(actor);
  // 3.27: toda la cantidad de Verbe va ligada a la Constitución: su modificador se suma una vez por nivel, como los PG.
  const conNivel = reservaPorCon(modDe(actor, "con"), n);
  const baseDivina = Math.max(0, Number(D.verbeMax[n]) + conNivel);
  // Reserva base: la tabla fija («promedio») o la suma de sus dados por nivel («dados», 2.2). La sangre divina sigue usando la tabla.
  let max = reservaBase(e, n, D.verbeMax) + conNivel;
  if (tieneDote(actor, "reserva-profunda")) max += n;
  max += sumaEf(actor, ef => (Number(ef.max?.plano) || 0) + (n >= 10 ? Number(ef.max?.desde10) || 0 : 0) + ((Number(ef.max?.nivel) || 0) * n));
  if (tieneDote(actor, "eco-sangre") && ["plena", "media"].includes(e.fuerza)) max += (n >= 11 ? 2 : 1) * n;
  const h = herenciaDe(actor);
  if (h?.maxMult) max = Math.floor(max * h.maxMult);
  return Math.max(1, max + Math.floor(baseDivina * donDivino(linajeDe(actor), e.fuerza, n).reserva) + (Number(e.maxExtra) || 0) + (Number(e.maxVariable) || 0));
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
/**
 * Devolver Verbe (solo DM, tarea 1.8): suma una cantidad a la reserva, sin pasar del máximo, y lo deja anotado
 * con quién, cuánto y por qué. Sirve para recursos complejos que la corrección automática del recibo no cubre.
 */
export async function devolverVerbe(actor, cantidad, motivo = "", { mensaje = null } = {}) {
  if (!game.user.isGM) return { ok: false, motivo: "Solo el DM devuelve Verbe." };
  const n = Math.trunc(Number(cantidad));
  if (!actor || !despierto(actor)) return { ok: false, motivo: "Esa ficha no tiene el Verbe despierto." };
  if (!Number.isFinite(n) || n < 1 || n > 200) return { ok: false, motivo: "La cantidad va de 1 a 200." };
  return serializarActor(actor, async () => {
    const e = estado(actor), antes = Number(e.valor) || 0, despues = Math.min(maxVerbe(actor), antes + n);
    if (despues <= antes) return { ok: false, motivo: `${actor.name} ya tiene su reserva llena (${antes}/${maxVerbe(actor)}).` };
    const nota = String(motivo ?? "").trim().slice(0, 300);
    const registro = { fecha: new Date().toISOString(), por: game.user.name, cantidad: despues - antes, pedido: n, antes, despues, motivo: nota, mensaje: mensaje ?? null };
    await guardar(actor, { valor: despues, devoluciones: [...(e.devoluciones ?? []), registro].slice(-50),
      historial: hist(e, `El DM devuelve ${despues - antes} Verbe${nota ? `: ${nota}` : ""}`) });
    aLaMesa(actor, "✦ Verbe devuelto", `<p>El DM devuelve <b>${despues - antes} Verbe</b> a ${escH(actor.name)} (${antes} → ${despues})${nota ? `: ${escH(nota)}` : ""}.${despues - antes < n ? ` No pasa de su máximo (${maxVerbe(actor)}).` : ""}</p>`, { soloDueno: true });
    return { ok: true, ...registro };
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
  if (rama === "sangre") return !!herenciaDe(actor) || (D.hitosShinobi ?? []).some(h => h.abreSangre && estado(actor)?.hitosShinobi?.includes(h.id));
  if (rama === "vasija") return !!e.vasija?.bestia || (e.hitosShinobi ?? []).some(h => ["seis-caminos", "sangre-primordial", "creacion-primordial", "sol-y-luna", "dominio-dimensional"].includes(h));
  if (rama === "pacto") return (e.pactos ?? []).length > 0;
  // 3.65 (regla del autor): las demás ramas no se abren solas por la etapa: la principal, las que ya empezó (o de las que
  // sabe técnicas), las que abrió entrenando («Abrir rama») y las que abre el DM o un maestro.
  if (!e.despierto || !ajuste("ramasCerradas", true)) return true;
  if (e.principal === rama || (e.ordenRamas ?? []).includes(rama) || Number(e.rangos?.[rama]) > 0) return true;
  return itemsTecnica(actor).some(i => i.getFlag?.(MOD, F)?.rama === rama);
}
/** 3.66 (regla del autor: «todo lo que se compra con Trazos lleva días de entrenamiento»): rangos de rama y Control. */
export const planRango = n => ({ unidad: "dias", bloque: 1, exitos: Math.max(1, Number(n) || 1), cd: 11 + Math.max(1, Number(n) || 1) });
export const planControl = v => ({ unidad: "dias", bloque: 1, exitos: Number(v) >= 2 ? 3 : 2, cd: Number(v) >= 2 ? 15 : 13 });
const entrenarConTrazos = () => ajuste("trazosConEntreno", true);
async function empezarEntreno(actor, id, { nombre, plan, trazos: t, extra = {}, texto, mesa }) {
  const e = estado(actor);
  await guardar(actor, { gastados: (Number(e.gastados) || 0) + t, entrenosDote: { [id]: { id, nombre, ...plan, trazos: t, progreso: 0, intentos: 0, desde: Number(game.time?.worldTime) || 0, ...extra } },
    historial: hist(e, texto), compras: compra(e, id.split(":")[0], { id, ...extra }, t, texto) });
  aLaMesa(actor, "✦ Empieza a entrenar", `<p>${escH(actor.name)} ${escH(mesa)}: ${escH(textoPlan(plan))}, CD ${plan.cd}. Un 20 natural lo termina al instante. Sigue en «Entrenando».</p>`);
  refrescarPanel(actor.id);
  return true;
}
/** 3.65: abrir una rama entrenando: 2 Trazos y 2 días buenos (Control del Verbe, CD 13). Respeta las ramas de su etapa. */
export const PLAN_RAMA = { unidad: "dias", bloque: 1, exitos: 2, cd: 13, trazos: 2 };
export function abrirRama(actor, rama) { return serializarActor(actor, async () => {
  const e = estado(actor), r = D.ramas.find(x => x.id === rama);
  if (!r || ramaAbierta(actor, rama)) return rechazar("Esa rama ya está abierta.", "warn");
  if (["pulso", "mirada", "sangre", "vasija", "pacto"].includes(rama)) return rechazar("Esa rama se abre por su camino propio (dote, ojo, herencia o pacto).", "warn");
  const id = `rama:${rama}`;
  if (e.entrenosDote?.[id]) return rechazar("Ya estás entrenando para abrirla: sigue en «Entrenando».", "warn");
  const pe = permisoEtapa(e, { rama, grado: 0, ramasDeTecnicas: itemsTecnica(actor).map(i => i.getFlag(MOD, F)?.rama) });
  if (!pe.ok) return rechazar(pe.motivo, "warn");
  if (trazos(actor).libres < PLAN_RAMA.trazos) return rechazar(`Abrir una rama cuesta ${PLAN_RAMA.trazos} Trazos.`, "warn");
  const texto = `Empieza a entrenar para abrir la rama ${r.nombre} (${PLAN_RAMA.trazos} Trazos)`;
  await guardar(actor, { gastados: (Number(e.gastados) || 0) + PLAN_RAMA.trazos, entrenosDote: { [id]: { id, nombre: `Abrir la rama ${r.nombre}`, rama, ...PLAN_RAMA, progreso: 0, intentos: 0, desde: Number(game.time?.worldTime) || 0 } },
    historial: hist(e, texto), compras: compra(e, "rama", { rama }, PLAN_RAMA.trazos, texto) });
  aLaMesa(actor, "✦ Abre una rama", `<p>${escH(actor.name)} paga ${PLAN_RAMA.trazos} Trazos y empieza a entrenar para abrir <b>${escH(r.nombre)}</b>: 2 días buenos, Control del Verbe CD 13. Un 20 natural la abre al instante.</p>`);
  refrescarPanel(actor.id);
  return true;
}); }

/** Posición de una rama entre las entrenadas (0 = la primera). Una rama nueva va al final. */
function ordenRama(actor, rama) {
  const orden = estado(actor)?.ordenRamas ?? [];
  const i = orden.indexOf(rama);
  return i < 0 ? orden.length : i;
}

/**
 * Repartirse cuesta (D4, tarea 2.4): cada rango de una rama que no es la principal paga de más según en qué
 * puesto la empezaste a entrenar. Posición 0 = la primera rama. Cambiar aquí la fórmula cambia panel y ayuda.
 */
export const RECARGO_RAMAS = [{ desde: 2, extra: 1 }, { desde: 4, extra: 2 }];
export function recargoRama(orden) {
  return RECARGO_RAMAS.reduce((c, r) => (orden >= r.desde ? r.extra : c), 0);
}
export function costoRango(actor, rama, nuevo) {
  const e = estado(actor) ?? {};
  let c = D.rangos[nuevo]?.trazos ?? 99;
  if (e.principal === rama || (tieneDote(actor, "rama-segunda") && e.segunda === rama)) c -= 1;
  if (rama === "sangre") c += FUERZA[e.fuerza ?? "plena"]?.extra ?? 0;
  // Repartirse cuesta: +1 Trazo por rango desde la tercera rama y +2 desde la quinta (la dote que lo permite perdona la tercera).
  const orden = ordenRama(actor, rama);
  if (e.principal !== rama && !(orden === 2 && efectosDotes(actor).some(ef => ef.repartirse))) c += recargoRama(orden);
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
/** La naturaleza de nacimiento: la primera que despertó. Sus técnicas cuestan 1 Verbe menos (mínimo 1). */
export const naturalezaPropia = actor => (estado(actor)?.nats ?? [])[0] ?? null;
/** Las combinaciones que puede usar (las da el DM con la dote). */
export const combosDe = actor => new Set(estado(actor)?.combos ?? []);

function contextoShinobi(actor) {
  const activas=(actor?.effects??[]).filter(e=>!e.disabled).map(e=>e.getFlag(MOD,F)).filter(Boolean);
  return {etiquetas:D?.etiquetas??{},estado:estado(actor)??{},linaje:linajeDe(actor)?.id,familiasSangre:[familiaDeSangre(D?.linajes,estado(actor)?.linaje,estado(actor)?.fuerza)].filter(Boolean),nivel:nivelDe(actor),rangoSangre:rangoDon(actor,"sangre"),herencia:herenciaDe(actor)?.req,cerrojoActivo:Math.max(0,...activas.map(e=>Number(e.cerrojo)||0)),
    ojosAbiertos:activas.map(e=>e.ojo).filter(Boolean),modos:activas.flatMap(e=>[e.modo,...(e.modosConcedidos??[])]).filter(Boolean),
    limiteDesgaste:6+sumaEf(actor,ef=>ef.desgasteExtra),artefactos:(actor?.items??[]).filter(i=>i.system?.equipped).map(i=>i.getFlag(MOD,F)?.artefacto).filter(Boolean)};
}
function permisoAprendido(actor,meta){
  const e=estado(actor);
  return Number(e.progresionVersion)>=VERSION_PROGRESION&&meta.g>=6&&!e.poderesLegados?.includes(meta.id)?accesoObtencion(meta,{nivel:nivelDe(actor),dotes:dotesActivas(actor)}):{ok:true};
}
async function efectosShinobi(actor,item,uso) {
  const meta=item.getFlag(MOD,F), fuentes=(item.effects??[]).map(e=>e.toObject?e.toObject():foundry.utils.deepClone(e)).filter(e=>e.flags?.[MOD]?.[F]?.aplicarUsuario);
  if (meta.dividirVerbe && !clonDe(meta)) {
    const dur=item.system.duration, segundos=Math.max(6,(Number(dur?.value)||1)*({round:6,minute:60,hour:3600,day:86400}[dur?.units]||60));
    fuentes.push({name:'Formación de réplicas',duration:{seconds:segundos,rounds:Math.ceil(segundos/6)},changes:[],statuses:[],flags:{[MOD]:{[F]:{replicas:true,grupoModo:'replicas',nonce:uso.nonce}}},description:'Energía realmente repartida. Una acción ofensiva conjunta por turno; el saldo no gastado se pierde al disiparlas. No duplica depósitos, inventario ni progresión.'});
  }
  for(const f of fuentes){
    const fl=f.flags[MOD][F], grupo=fl.grupoModo;
    if(grupo)for(const vieja of actor.effects.filter(e=>e.getFlag(MOD,F)?.grupoModo===grupo))await vieja.delete({ecosSinCierre:true});
    if(fl.golpeSiguiente){const g=fl.golpeSiguiente,n=(Number(g.nBase??g.n)||1)+Math.max(0,(Number(uso?.grado)||Number(meta.g)||0)-(Number(meta.g)||0))*(Number(g.sube)||0);
      f.changes=(f.changes??[]).map(c=>/\.damage$/.test(c.key)?{...c,value:`${n}d${g.d}[${g.tipo}]`}:c);}
    delete f._id;f.origin=item.uuid;
    // 3.72: el inicio va donde lo pide cada Foundry (en 14, en `start`); antes 31 técnicas fallaban al poner su efecto.
    marcarInicio(f,{tiempo:game.time.worldTime,combate:game.combat?.id??null,ronda:game.combat?.round,turno:game.combat?.turn,generacion:game.release?.generation??0});
    const concentraciones=actor.effects.filter(e=>e.statuses?.has('concentrating'));
    const concentracion=concentraciones.find(e=>e.getFlag('dnd5e','item')?.id===item.id)??concentraciones.at(-1);
    if(item.system.properties?.has?.('concentration')||item.system.properties?.includes?.('concentration'))fl.deConcentracion=concentracion?.uuid??concentracion?.id??null;
    const [creado]=await actor.createEmbeddedDocuments('ActiveEffect',[f]);
    if(fl.deConcentracion&&concentracion?.addDependent)await concentracion.addDependent(creado);
  }
  if(meta.liberarReserva||meta.prestamo)await serializarActor(actor,async()=>{
    const e=estado(actor), cantidad=meta.liberarReserva?(meta.consumirReserva?0:Number(e.reservaSellada)||0):2*competencia(actor);
    await guardar(actor,{...cambiosRecuperacion(actor,cantidad),...(meta.liberarReserva?{reservaSellada:0}:{})});
  });
}
export function almacenarVerbe(actor,cantidad) {
  return serializarActor(actor,async()=>{
    if(!conoce(actor,'pulso-centenar-sello'))return rechazar('Primero aprende Sello del centenar.');
    const e=estado(actor),r=depositoReserva({valor:e.valor,almacenado:e.reservaSellada,cantidad,nivel:nivelDe(actor),extra:sumaEf(actor,ef=>ef.depositoExtra?competencia(actor):0)});
    if(!r.ok)return rechazar(r.motivo);
    await guardar(actor,{valor:r.valor,reservaSellada:r.almacenado});return true;
  });
}
/** Los poderes que necesitan preparación no se autorizan desde el cliente del jugador. */
export function concederShinobi(actor,campo,valor,extra=null) {
  if(!game.user.isGM)return Promise.resolve(false);
  return serializarActor(actor,async()=>{
    const e=estado(actor);if(!e?.despierto)return false;
    if(campo==='familia'||(campo==='tradicion'&&esFamilia(valor))){
      // 3.27: la familia es de nacimiento y hay una sola. «ninguna» la quita.
      const sinFam=(e.tradiciones??[]).filter(x=>!esFamilia(x));
      const nueva=esFamilia(valor)?valor:null;
      const t=nueva?D.tradicionesShinobi?.find(x=>x.id===nueva):null;
      await guardar(actor,{tradiciones:nueva?[...sinFam,nueva]:sinFam,familiaNacimiento:nueva,...(t?.pacto?{pactos:[...new Set([...(e.pactos??[]),t.pacto])]}:{}),
        historial:hist(e,nueva?`Familia de nacimiento: ${FAMILIAS[nueva].nombre}`:"Sin familia de nacimiento")});
    }else if(campo==='tradicion'){
      const t=D.tradicionesShinobi?.find(t=>t.id===valor);if(!t)return false;
      const tiene=e.tradiciones?.includes(valor);await guardar(actor,{tradiciones:tiene?e.tradiciones.filter(x=>x!==valor):[...(e.tradiciones??[]),valor],...(!tiene&&t.pacto?{pactos:[...new Set([...(e.pactos??[]),t.pacto])]}:{})});
    }else if(campo==='hito'){
      if(!D.hitosShinobi?.some(h=>h.id===valor))return false;
      await guardar(actor,{hitosShinobi:e.hitosShinobi?.includes(valor)?e.hitosShinobi.filter(x=>x!==valor):[...(e.hitosShinobi??[]),valor]});
    }else if(campo==='vasija'){
      if(valor&&!D.bestiasShinobi?.some(b=>b.id===valor))return false;
      await guardar(actor,{vasija:{bestia:valor||null,vinculo:Math.clamp(Number(extra)||1,1,3)}});
    }else if(campo==='ritual'){
      const t=tecnicaPorId(valor,actor);if(!t?.item.flags[MOD][F].ritual||!conoce(actor,valor))return false;
      await guardar(actor,{permisosRituales:{[valor]:true}});
    }else if(campo==='ocular'){
      if(!D.miradas.some(m=>m.id===valor))return false;
      await guardar(actor,{desgasteOcular:{[valor]:0},ojosSacrificados:{[valor]:0}});
    }else return false;
    await asegurarRasgos(actor);await refrescar(actor);return true;
  });
}
export function transferirVerbe(origen,destino,cantidad) {
  if(!game.user.isGM||origen===destino||!despierto(origen)||!despierto(destino))return Promise.resolve(false);
  const orden=[origen,destino].sort((a,b)=>claveActor(a).localeCompare(claveActor(b)));
  return enSerie(claveActor(orden[0]),()=>enSerie(claveActor(orden[1]),async()=>{
    if(consumoPendiente(origen)||consumoPendiente(destino))return rechazar('Espera a que termine el uso de las técnicas antes de transferir energía.');
    const n=Number(cantidad),e=estado(origen);
    if(!Number.isSafeInteger(n)||n<1||n>Number(e.valor))return rechazar('La transferencia usa solo energía positiva existente.');
    const cambios=cambiosRecuperacion(destino,n),antes=Number(e.valor);
    await guardar(origen,{valor:antes-n});
    try{await guardar(destino,cambios);}catch(err){await guardar(origen,{valor:antes});throw err;}
    return true;
  }));
}
export function concederArtefacto(actor,id){
  if(!game.user.isGM)return Promise.resolve(false);
  return serializarActor(actor,async()=>{
    const a=D.artefactosShinobi?.find(a=>a.id===id);if(!a||actor.items.some(i=>i.getFlag(MOD,F)?.artefacto===id))return false;
    await actor.createEmbeddedDocuments('Item',[{name:a.nombre,type:'equipment',img:'systems/dnd5e/icons/svg/items/loot.svg',system:{description:{value:`<p>${escH(a.texto)}</p><p>Reliquia de campaña. Sus técnicas se aprenden y pagan aparte; equiparla no otorga todas sus capacidades.</p>`},equipped:true,quantity:1,rarity:'legendary'},flags:{[MOD]:{[F]:{artefacto:id}}}}]);return true;
  });
}

/** La herencia y los regalos del DM se conservan aunque excedan el límite ordinario. */
export function naturalezaVisible(actor, tec) {
  if (!tec.nat || (!NATS[tec.nat] && !D.combos[tec.nat]) || conoce(actor, tec.id)) return true;
  if (D.combos[tec.nat]) return combosDe(actor).has(tec.nat);
  // Las técnicas de una naturaleza que no conoce no se ven hasta descubrirla (D1).
  return natsDe(actor).has(tec.nat);
}
export function opcionesNaturaleza(actor, tipo) {
  const nats = natsDe(actor), e = estado(actor);
  if (tipo === "tercera") return tieneDote(actor, "tercera-naturaleza") && !e.terceraElegida && nats.size < 3
    ? Object.keys(NATS).filter(n => !nats.has(n)) : [];
  const cupos = tieneDote(actor, "naturaleza-combinada") ? (tieneDote(actor, "elemento-complejo") ? 2 : 1) : 0;
  if (combosDe(actor).size >= cupos) return [];
  return Object.entries(D.combos).filter(([id,c]) => !combosDe(actor).has(id) && c.de.every(n => nats.has(n))).map(([id]) => id);
}
export function elegirNaturalezaAdicional(actor, tipo, valor) {
  return serializarActor(actor, async () => {
    if (!["tercera", "combo"].includes(tipo) || !opcionesNaturaleza(actor, tipo).includes(valor)) return rechazar("Esa elección no está disponible.");
    const e = estado(actor);
    await guardar(actor, tipo === "tercera"
      ? { terceraElegida: valor, natsExtra: [...new Set([...(e.natsExtra ?? []), valor])], historial: hist(e, `Tercera naturaleza: ${nombreNat(valor)}`) }
      : { combos: [...combosDe(actor), valor], combosElegidas: [...(e.combosElegidas ?? []), valor], historial: hist(e, `Naturaleza combinada: ${nombreNat(valor)}`) });
    await asegurarRasgos(actor); await refrescar(actor); return true;
  });
}

/**
 * ¿Puede aprender esta técnica? → { ok, motivo, pideDM, probar }
 * probar: es de una naturaleza que no tiene; al intentarla se descubre si es su oculta.
 */
export function requisitos(actor, tec) {
  if (!tec?.id) return { ok: false, motivo: "La técnica no existe." };
  const e = estado(actor);
  if (!e?.despierto) return { ok: false, motivo: "No despertó." };
  if (conoce(actor, tec.id)) return { ok: false, motivo: "Ya la sabe." };
  if (e.estudios?.[tec.id]) return { ok: false, estudio: true, motivo: "La está estudiando: practica un día más desde Aprender." };
  const etapa = permisoEtapa(e, { rama: tec.rama, grado: Number(tec.g) || 0, ramasDeTecnicas: itemsTecnica(actor).map(i => i.getFlag(MOD, F)?.rama) });
  if (!etapa.ok) return etapa;
  const acceso = accesoShinobi(tec.item?.flags?.[MOD]?.[F] ?? tec, contextoShinobi(actor), false);
  if (!acceso.ok) return acceso;
  const obtencion=accesoObtencion(tec.item.flags[MOD][F],{nivel:nivelDe(actor),dotes:dotesActivas(actor)});
  if(!obtencion.ok)return obtencion;
  if (tec.retirada) return { ok: false, motivo: "El DM retiró esta técnica del aprendizaje nuevo." };
  if (tec.nivelMin && nivelDe(actor) < tec.nivelMin) return { ok: false, motivo: `Pide nivel ${tec.nivelMin}.` };
  if (tec.previa && !conoce(actor, tec.previa)) return { ok: false, motivo: `Primero aprende ${tecnicaPorId(tec.previa,actor)?.n ?? tec.previa}.` };
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
  if (tec.sec === "sangre" && conSangre(actor) && (rangoDon(actor, "sangre") < 5) && tec.g > (FUERZA[e.fuerza ?? "plena"]?.grado ?? 9)) return { ok: false, motivo: `Su sangre llega hasta el grado ${FUERZA[e.fuerza].grado}.` };
  // Pactos de un linaje de criaturas
  if (/^pacto con /.test(tec.req ?? "")) {
    const p = tec.req.replace(/^pacto con (las |los |el |la )?/, "").split(" ")[0].toLowerCase();
    if (!(e.pactos ?? []).some(x => x.toLowerCase().includes(p))) return { ok: false, motivo: `Pide ${tec.req}.` };
  }
  // Otra técnica antes
  const previa = tec.req ? porNombre(tec.req) : null;
  if (previa && !conoce(actor, previa.id)) return { ok: false, motivo: `Pide saber ${previa.n}.` };
  // Naturaleza
  // Naturaleza (D1): las técnicas elementales se abren al descubrir la naturaleza entrenando, no probando.
  const probar = false;
  if (tec.nat && NATS[tec.nat] && !natsDe(actor).has(tec.nat)) {
    if (natsDe(actor).size >= 2) return { ok: false, motivo: "Ya conoce dos naturalezas. Una naturaleza adicional exige su dote y elección en Mejorar." };
    return { ok: false, motivo: natsDe(actor).size
      ? `Es de ${NATS[tec.nat]}, que no es tu naturaleza. Tu segunda naturaleza se descubre entrenando (Mejorar → Tus elementos).`
      : "Aún no descubriste tu naturaleza: se descubre entrenando (Mejorar → Tus elementos). Mientras tanto, aprende técnicas sin elemento." };
  }
  if (D.combos[tec.nat] && !combosDe(actor).has(tec.nat)) return { ok: false, motivo: `Pide la combinación ${nombreNat(tec.nat)}.` };
  const pideDM = /maestro/.test(tec.req ?? "");
  const { libres } = trazos(actor);
  if (libres < tec.trazos) return { ok: false, motivo: `Cuesta ${tec.trazos} Trazos y tiene ${libres}.`, probar };
  return { ok: true, probar, pideDM };
}

export function habilidadTecnica(actor, meta) {
  const e = estado(actor) ?? {};
  if (meta.usa === "fisica") return modDe(actor, "dex") > modDe(actor, "str") ? "dex" : "str";
  if (CARS[meta.usa]) return meta.usa;
  return e.car || "wis";
}

export const afinidadDe = (actor, nat) => {
  const a = estado(actor)?.afinidad ?? {};
  const partes = deNats(nat);
  if (!partes.length) return 1;
  return Math.min(...partes.map(n => Number(a[n]) || 1));
};

/** Dados de más que lleva una técnica en este actor (dominio de rama, afinidad, cultivo, dotes). */
export function dadosExtraBrutos(actor, meta, infusion = null) {
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
const bonoCDRama=(actor,meta)=>sumaEf(actor,ef=>(meta.rama===estado(actor)?.principal?Number(ef.cd?.principal)||0:0)+(Number(ef.cd?.[meta.rama])||0));
const cdCultivo=(actor,t,cul)=>Math.min(2,(cul?.mejoras??[]).filter(m=>m==="cd").length+(Object.values(t.item.system.activities).some(a=>a.type==="save")?bonoCDRama(actor,t.item.flags[MOD][F]):0));
export const dadosExtra=(actor,meta,infusion=null)=>Math.min(limiteDadosExtra(meta.g),dadosExtraBrutos(actor,meta,infusion));

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

const DANO_CACHE = new Map();
/** ¿La técnica hace daño? (alguna actividad con partes de daño). */
export function hazDanoMeta(meta, actor = null) {
  if (!meta?.id) return false;
  if (DANO_CACHE.has(meta.id)) return DANO_CACHE.get(meta.id);
  let t = null; try { t = tecnicaPorId(meta.id, actor); } catch { t = null; }
  const si = !!t && Object.values(t.item?.system?.activities ?? {}).some(a => a?.damage?.parts?.length);
  if (t) DANO_CACHE.set(meta.id, si);
  return si;
}
export function costoUso(actor, meta, grado, { infusion = null } = {}) {
  const e = estado(actor) ?? {};
  let c = meta.costoBase === undefined ? costoGrado(grado) : Number(meta.costoBase) + costoGrado(grado) - costoGrado(meta.g);
  const cul = e.cultivos?.[meta.id];
  if (cul) c -= (cul.mejoras ?? []).filter(m => m === "verbe").length;
  // 3.66 (regla del autor): una técnica de 0 Verbe mejorada cuesta 1 Verbe por cada mejora (lo que gana, lo paga).
  if (cul && Number(meta.g) === 0 && costoGrado(grado) === 0) c += (cul.mejoras ?? []).filter(m => m !== "verbe").length;
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
  // Tu naturaleza de nacimiento (la primera) te sale más natural: 1 Verbe menos, mínimo 1.
  if (nat && nat === naturalezaPropia(actor) && c > 1) c -= 1;
  if (clonDe(meta) && tieneDote(actor, "clon-economico")) c -= 1;
  if (grado > 0) c = Math.max(pisoCosto(grado,D.costo), c);
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
  // 3.34 (regla del autor): si la técnica hace daño, cuesta al menos 1 Verbe.
  if (hazDanoMeta(meta, actor)) c = Math.max(1, c);
  if (e.reserva === meta.id && !e.reservaUsada && grado === meta.g) c = 0;
  // La técnica cargada ya se pagó al empezar a canalizarla.
  if (e.canalizada?.id === meta.id && e.canalizada?.lista) c = 0;
  return Math.max(0, c);
}

/** La interfaz consulta exactamente los costes y bloqueos del uso nativo, sin gastar nada. */
export function previsualizarUso(actor, meta, grado = Number(meta?.g) || 0, {replica=false,choque=false} = {}) {
  const e = estado(actor) ?? {};
  const extra = meta?.fuerte ? extraContraFuerte(actor).extra : 0;
  const costo = costoUso(actor, meta, grado, { infusion: meta.infusion }) + extra;
  const acceso = accesoShinobi(meta, contextoShinobi(actor), true);
  if (!acceso.ok) return { ...acceso, costo };
  const aprendido=permisoAprendido(actor,meta);if(!aprendido.ok)return {...aprendido,costo};
  if(grado>meta.g){const accesoElevado=accesoObtencion({...meta,g:grado},{nivel:nivelDe(actor),dotes:dotesActivas(actor)});if(!accesoElevado.ok)return {...accesoElevado,costo};}
  const cuota=permisoCuota(grado,{nivel:nivelDe(actor),dotes:dotesActivas(actor),usados:e.cuotasPoder});
  if(!cuota.ok)return {...cuota,costo};
  if (replica && (grado>capacidadReplicas(actor) || !efectoV(actor,"replicas") || e.accionReplicaUsada)) return {ok:false,costo,motivo:"No hay acción de réplicas disponible o supera el grado permitido."};
  const item = itemsDe(actor, meta.id)[0];
  const turno=choque?{ok:true}:permisoTurno(grado,{combate:game.combat?.started?(game.combat.id??"combate"):null,estado:e.turnoTecnicas,reaccion:item?.system.activation?.type==="reaction",replica,maximo:maxAccionesVerbe(actor),adicional:gastoVerbe(tecnicaPorId(meta.id,actor)?.t??item?.system?.activation?.type)==="adicional"});if(!turno.ok)return {...turno,costo};
  const permiso = evaluarGasto({ valor: Number(replica?e.reservaReplicas:e.valor) || 0, costo, limite: replica?0:limiteNegativo(actor), grado,
    gradoMaximo: gradoUsable(actor, meta), agotamiento: sistema.agotamiento(actor),
    incapacitado: noPuedeActuar(actor), reaccion: item?.system?.activation?.type === "reaction" || tecnicaPorId(meta.id, actor)?.t === "R",
    puedeReaccionar: reaccionDisponible(actor), altoGastado: !!e.usosAltos?.[meta.id] });
  return { ...permiso, costo, extra };
}

/** Conserva el diálogo, las tiradas y el consumo de dnd5e. No lanza desde una copia del catálogo. */
export async function usarTecnica(actor, id, { replica = false } = {}) {
  if (!editarActor(actor) || !despierto(actor)) return false;
  const item = itemsDe(actor, id)[0];
  if (!item) return rechazar("Primero debes aprender esa técnica.");
  if (D.defensas?.[id]) return rechazar("Esta defensa se ofrece cuando recibes un ataque con midi-qol. Sin esa integración, acuerda el uso y el coste con el DM antes de resolver el golpe.");
  const meta = item.getFlag(MOD, F);
  const estadoUso = previsualizarUso(actor, meta,Number(meta.g)||0,{replica});
  if (!estadoUso.ok) return rechazar(estadoUso.motivo);
  const fuente = item.system?.activities;
  const actividades = fuente?.values ? [...fuente.values()] : Object.values(fuente ?? {});
  if (actividades.length === 1 && typeof actividades[0].use === "function") return replica ? actividades[0].use({ ecosReplica: true, consume: { action: false } }) : actividades[0].use();
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

/**
 * El catálogo mide en metros. En un mundo en pies (dnd5e sin «unidades métricas»), el alcance y las plantillas de la
 * ficha se pasan a pies (1,5 m = 5 pies): midi-qol compara el alcance sin convertir y un golpe de 1,5 m quedaba
 * «fuera de alcance» contra un objetivo al lado, así que no se tiraba nada (3.7.0, técnicas de Cuerpo).
 */
const metricoMundo = () => { try { return !!game.settings.get("dnd5e", "metricLengthUnits"); } catch { return false; } };
const aPies = v => (Number.isFinite(Number(v)) && v !== "" && v !== null ? Math.round(Number(v) / 0.3 * 100) / 100 : v);
export function medidasDelMundo(data, metrico = false) { // 3.27: todo en pies, como D&D y PF2e
  if (metrico || !data?.system) return data;
  const r = data.system.range;
  if (r?.units === "m") Object.assign(r, { units: "ft", value: aPies(r.value), ...(r.long ? { long: aPies(r.long) } : {}), ...(r.reach ? { reach: aPies(r.reach) } : {}) });
  const tpl = data.system.target?.template;
  if (tpl?.units === "m") Object.assign(tpl, { units: "ft", size: aPies(tpl.size), width: aPies(tpl.width), height: aPies(tpl.height) });
  for (const act of Object.values(data.system.activities ?? {})) {
    if (act.range?.override && act.range.units === "m") Object.assign(act.range, { units: "ft", value: aPies(act.range.value) });
    const t2 = act.target?.template;
    if (act.target?.override && t2?.units === "m") Object.assign(t2, { units: "ft", size: aPies(t2.size), width: aPies(t2.width), height: aPies(t2.height) });
  }
  return data;
}
/** Si una técnica no se puede usar, además del aviso sale una ventana: que el jugador sepa qué pasa (3.7). */
function avisoUso(texto) {
  aviso(texto, "warn");
  try { foundry.applications.api.DialogV2.prompt?.({ window: { title: "No se usó la técnica", icon: "fa-solid fa-circle-info" }, content: `<p>${escH(texto)}</p>`, rejectClose: false })?.catch?.(() => null); } catch { /* sin ventanas */ }
}
/** Después de usar una técnica que no tira dados (utilidad o refuerzo), una ventana explica qué quedó activo. */
async function explicarUso(actor, item, meta) {
  const acts = Object.values(item.system?.activities?.contents ?? item.system?.activities ?? {});
  if (acts.some(a => ["attack", "save", "damage", "heal"].includes(a.type))) return;
  if (!game.user || !actor?.isOwner) return;
  const efectos = actor.effects.filter(x => x.origin === item.uuid && !x.disabled).map(x => x.name);
  const tec = tecnicaPorId(meta.id, actor);
  const html = `<p><b>${escH(item.name)}</b>: ${escH(String(tec?.texto ?? "").split(/(?<=\.)\s/)[0])}</p>
    <p>${efectos.length ? `Queda activo sobre ti: <b>${efectos.map(escH).join(", ")}</b>. No tira dados ahora: se suma a lo que hagas mientras dure.` : "No tira dados: es una utilidad. El DM resuelve su efecto en la mesa."}</p>`;
  try { await foundry.applications.api.DialogV2.prompt({ window: { title: "Qué pasó", icon: "fa-solid fa-circle-info" }, content: html, rejectClose: false }); } catch { /* sin ventanas */ }
}
/** Párrafo de la ficha para las técnicas cargadas (3.3). */
const fichaCarga = meta => { const c = cargaDe(meta); return c ? `<p class="ev-nota"><b>Cargada.</b> ${escH(textoCarga(c))}</p>` : ""; };
/** Arma los datos del objeto para este actor a partir de la técnica base. */
/** 3.71 (prueba en el mundo): dnd5e 6 solo acepta identificadores con a-z, 0-9 y guiones; «rastro-sensor-carmesí» y las técnicas del DM («dm-AbC…») no se podían aprender. Puro. */
export const identificadorValido = id => String(id ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "") || "tecnica";
export function datosItem(actor, tec) {
  const data = foundry.utils.deepClone(tec.item);
  if (data.system) data.system.identifier = identificadorValido(data.system.identifier ?? tec.id);
  const meta = data.flags[MOD][F];
  const e = estado(actor) ?? {};
  const inf = e.infusiones?.[tec.id] ?? null;
  const cul = e.cultivos?.[tec.id] ?? null;
  data.system.ability = habilidadTecnica(actor, meta);
  const extra = Math.floor(dadosExtra(actor, meta, inf) / (Number(meta.divisorDados) || 1));
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
    const ataqueCultivo=Math.min(2,mej.filter(m=>m==="cd").length);
    const cd = Math.min(2,ataqueCultivo + bonoCDRama(actor,meta));
    if (tec.g === 0 && partes[0]?.number && !act.healing && efectosDotes(actor).some(ef => ef.dano0)) partes[0].bonus = [partes[0].bonus, "@mod"].filter(Boolean).join(" + ");
    const cura = efectosDotes(actor).map(ef => ef.cura?.[meta.rama]).filter(Boolean);
    if (act.healing && cura.length) act.healing.bonus = [act.healing.bonus, ...cura.map(v=>Number(meta.divisorDados)>1?`floor((${v}) / ${meta.divisorDados})`:v)].filter(Boolean).join(" + ");
    if (cd) {
      if (act.type === "save") act.save.dc = { calculation: "", formula: `8 + @prof + @abilities.${data.system.ability}.mod + ${cd}` };
      if (act.type === "attack") act.attack.bonus = String(ataqueCultivo);
    }
  }
  if (mej.includes("rapida")) {
    const a = data.system.activation;
    if (!meta.ritual&&["minute","hour"].includes(a.type)&&a.value>1) a.value=Math.ceil(a.value/2);
    else if (!meta.ritual&&tec.g<=5&&a.type === "action") Object.assign(a, { type: "bonus", value: 1 });
  }
  aplicarCultivoUtilidad(data, mej);
  // Dotes de alcance y área
  const r0 = data.system.range;
  if (r0?.units === "m" && Number(r0.value) >= 9) {
    const x = efectosDotes(actor).reduce((t, ef) => t * (Number(ef.alcance) || 1), 1);
    const factorRama=efectosDotes(actor).reduce((n,ef)=>Math.max(n,Number(ef.alcanceFactorRama?.[meta.rama])||1),1);
    r0.value = Math.round(Number(r0.value) * x * factorRama) + sumaEf(actor, ef => ef.alcanceRama?.[meta.rama]);
  }
  const masArea = sumaEf(actor, ef => ef.area);
  if (masArea && data.system.target?.template?.size) data.system.target.template.size = Number(data.system.target.template.size) + masArea;
  const grande = mej.filter(m => m === "area").length;
  if (grande) {
    const tpl = data.system.target?.template;
    if (tpl?.size) tpl.size = Math.round(Number(tpl.size) * (1.5 ** grande) * 10) / 10;
    else if (data.system.range?.value) data.system.range.value = Math.round(Number(data.system.range.value) * (1.5 ** grande));
  }
  const alcanceBase=Number(tec.item.system.range?.value)||0,areaBase=Number(tec.item.system.target?.template?.size)||0;
  if(alcanceBase>0&&data.system.range?.units==='m')data.system.range.value=Math.min(data.system.range.value,Math.min(1500,alcanceBase*3));
  if(areaBase>0)data.system.target.template.size=Math.min(data.system.target.template.size,areaBase*2);
  const segundos=sys=>Number(sys?.duration?.value)*({round:6,minute:60,hour:3600,day:86400}[sys?.duration?.units]||0);
  const originalSeg=segundos(tec.item.system),durSeg=segundos(data.system);
  const extraSeg=originalSeg>=60?sumaEf(actor,ef=>ef.duracionRama?.[meta.rama]):0;
  if(durSeg&&extraSeg){data.system.duration.units='minute';data.system.duration.value=(durSeg+extraSeg)/60;}
  const finalSeg=segundos(data.system);
  if(originalSeg>0&&finalSeg!==originalSeg)for(const ef of data.effects??[])if(Number(ef.duration?.seconds)===originalSeg)Object.assign(ef.duration,{seconds:finalSeg,rounds:Math.ceil(finalSeg/6)});
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
  if (meta.shinobi && sistema.velocidad(actor).pies) for (const ef of data.effects ?? []) for (const c of ef.changes ?? []) if (/^system\.attributes\.movement\./.test(c.key) && Number.isFinite(Number(c.value))) c.value = String(Number(c.value) / 0.3);
  data.effects = (data.effects ?? []).map(ef => {
    if (!ESTADOS[ef.statuses?.[0]]) return ef;
    const normal = efectoEstado(ef.statuses[0], ef._id, doble);
    if (meta.universal && ef.duration?.seconds) normal.duration = { ...ef.duration, seconds: ef.duration.seconds * (doble ? 2 : 1) };
    return normal;
  });
  // «Tu próximo golpe suma…»: el efecto lleva los dados de más por rango, afinidad o cultivo.
  for (const ef of data.effects ?? []) {
    const g = ef.flags?.[MOD]?.[F]?.golpeSiguiente;
    if (!g) continue;
    g.nBase = (Number(g.n) || 1) + extra;
    ef.changes = (ef.changes ?? []).map(c => /\.damage$/.test(c.key) ? { ...c, value: `${g.nBase}d${g.d}[${g.tipo}]` } : c);
  }
  meta.infusion = inf;
  meta.cultivo = cul?.nivel ?? 0;
  data.system.description.value = (data.system.description.value ?? "") + fichaCarga(meta) + notaPersonal(actor, tec, extra, inf, cul);
  medidasDelMundo(data);
  textosAPies(data.system); textosAPies(data.effects ?? []); // 3.27: lo que se lee, en pies
  if (esGenerico(data.img)) data.img = iconoTecnica(data) ?? data.img;
  const {firma:anteriorFirma,...metadatos}=meta;
  meta.firma = firma(JSON.stringify([data.name, data.system, data.effects,metadatos]));
  return data;
}
const idFijo = s => `${s.replace(/[^A-Za-z0-9]/g, "")}0000000000000000`.slice(0, 16);
const firma = s => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); };

function notaPersonal(actor, tec, extra, inf, cul) {
  const p = [];
  if (extra) p.push(`+${extra} dado${extra > 1 ? "s" : ""} por rango, afinidad o cultivo, dentro del tope de su grado`);
  if(tec.id&&dadosExtraBrutos(actor,tec,inf)>limiteDadosExtra(tec.g))p.push("los dados adicionales exceden el tope; el DM puede reorientar el último cultivo sin volver a cobrar");
  if (inf) p.push(`infundida con ${nombreNat(inf)}`);
  if (cul?.nivel) p.push(`cultivada: ${NIVEL_CULTIVO[cul.nivel]}${cul.mejoras?.length ? ` (${cul.mejoras.map(m => MEJORAS[m] ?? `infusión fija: ${nombreNat(cul.infusionFija)}`).join(", ")})` : ""}`);
  p.push(`cuesta ${textoCostoControl(costoUso(actor, tec, tec.g, { infusion: inf }), etapaDe(estado(actor)), ajuste("dadoControl", true))} Verbe`);
  return `<p class="ecos-verbe-nota"><em>${p.join(" · ")}.</em></p>`;
}

/** Actualiza las técnicas existentes sin reemplazar sus documentos ni reiniciar usos. */
export async function refrescar(actor) {
  if (!actor?.isOwner) return;
  const datos = [];
  for(const it of actor.items){const id=it.getFlag(MOD,F)?.artefacto,a=D.artefactosShinobi?.find(a=>a.id===id),c=D.identidad?.artefactos?.[id];
    if(!a||!c)continue;const cambio={_id:it.id};
    if(it.name!==a.nombre&&huellaTexto(it.name)===c.nombre)cambio.name=a.nombre;
    if(huellaTexto(it.system?.description?.value??'')===c.descripcion)cambio['system.description.value']=`<p>${escH(a.texto)}</p><p>Reliquia de campaña. Sus técnicas se aprenden y pagan aparte; equiparla no otorga todas sus capacidades.</p>`;
    if(Object.keys(cambio).length>1)datos.push(cambio);
  }
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

export function ofertasActor(actor){
  if(!actor||!editarActor(actor)||!D)return [];
  const e=estado(actor)??{};
  return [...D.tecnicas,...extraMundo(),...(e.propias??[]).filter(t=>!t.modo)].filter(t=>{
    if(t.retirada||!naturalezaVisible(actor,t))return false;if(game.user.isGM)return true;
    if(t.soloDM)return false;
    const sangre=t.sec==='sangre'||D.linajes.some(l=>l.req&&l.req===t.req);
    if(sangre&&!t.item.flags[MOD][F].shinobi&&(!veLinaje(actor)||!herenciaDe(actor)||(t.req!=='una herencia'&&herenciaDe(actor).req!==t.req)))return false;
    if(t.rama==='mirada'&&!(e.miradas??{})[t.id.split('-')[1]])return false;
    return true;
  });
}
export async function corregirGastoSimple(actor,recibo){
  if(!game.user.isGM||!soyGM())return {ok:false,motivo:'Solo el GM principal corrige un gasto.'};
  const resultado=await serializarActor(actor,async()=>{
    const e=estado(actor),r=e?.ultimoRecibo;
    if(!r||r.complejo||r.nonce!==recibo.nonce||r.itemId!==recibo.itemId||r.grado>5||r.despues<0||!Number.isSafeInteger(r.antes)||!Number.isSafeInteger(r.despues)||r.antes-r.despues!==r.costo)return {ok:false,motivo:'Este uso tiene recursos especiales o no conserva un recibo simple verificable.'};
    if(e.ultimoUso!==r.nonce||Number(e.valor)!==r.despues)return {ok:false,motivo:'Hubo otro uso o cambió la reserva. Revisa y ajusta el gasto manualmente.'};
    await guardar(actor,{valor:r.antes,ultimoUso:r.ultimoUsoAnterior,ultimoRecibo:null});return {ok:true};
  });return resultado||{ok:false,motivo:'Espera a que termine la actividad pendiente.'};
}

export function aprender(actor, ...args) { return serializarActor(actor, () => aprenderInterno(actor, ...args)); }
async function aprenderInterno(actor, tec, { gratis = false, nota = null, aprobado = false, instantaneo = false } = {}) {
  if (!editarActor(actor) || !tec || conoce(actor, tec.id)) return false;
  if (gratis && !game.user.isGM) return rechazar("Solo el DM puede conceder una técnica gratis.", "warn");
  const conocida = tecnicaPorId(tec.id, actor);
  if (!conocida) return rechazar("La técnica no pertenece al catálogo ni a sus técnicas propias.", "warn");
  tec = conocida;
  if (!gratis) {
    const r = requisitos(actor, tec);
    if (!r.ok || r.probar) { aviso(r.motivo ?? "Primero debe descubrir esa naturaleza.", "warn"); return false; }
    if (r.pideDM && !game.user.isGM) {
      return pedirAlDM(actor, "tecnica", { id: tec.id }, tec.n, `Pide: ${tec.req ?? ""}.`);
    }
  }
  if (!gratis && !instantaneo && aprenderPorDias(actor)) {
    // 3.27: pagar los Trazos es el primer paso; después, días de práctica con una tirada diaria.
    const e0 = estado(actor), costo0 = Number(tec.trazos) || 0, plan = planEstudio(tec.g);
    const est = { id: tec.id, g: tec.g, ...plan, progreso: 0, dias: 0, desde: Number(game.time?.worldTime) || 0, trazos: costo0 };
    const texto0 = `Empieza a estudiar ${tec.n} (${costo0} Trazos)${nota ? ` · ${nota}` : ""}`;
    await guardar(actor, { gastados: (Number(e0.gastados) || 0) + costo0, estudios: { [tec.id]: est }, historial: hist(e0, texto0),
      compras: compra(e0, "tecnica", { id: tec.id }, costo0, texto0) });
    aLaMesa(actor, "✦ Empieza a estudiar", `<p>${escH(actor.name)} paga ${costo0} Trazos y empieza a estudiar <b>${escH(tec.n)}</b>: necesita <b>${plan.exitos} día${plan.exitos === 1 ? "" : "s"} bueno${plan.exitos === 1 ? "" : "s"}</b> de práctica. Cada día del calendario puede tirar Control del Verbe CD ${plan.cd} desde su panel (Aprender). Un 20 natural cuenta doble; un 1 natural le hace perder un día de avance.</p>`, { soloDueno: true });
    return true;
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

const caracteristicaSugerida = actor => (CARS[sistema.caracteristicaConjuros(actor)] ? sistema.caracteristicaConjuros(actor) : "wis");
const opciones = (pares, sel) => pares.map(([k, v]) => `<option value="${escH(k)}" ${String(k) === String(sel) ? "selected" : ""}>${escH(v)}</option>`).join("");
/** Nombre de un linaje: el jugador ve el camuflado; el DM, los dos. */
const nombreLinaje = l => (!l ? "" : dm() ? `${l.alias ?? l.nombre} · ${l.real ?? l.nombre}` : (l.alias ?? l.nombre));
const paresLinaje = () => [["ninguno", "Sin linaje"], ...D.linajes.map(l => [l.id, `${nombreLinaje(l)}${l.herencia ? ` · ${l.herencia}` : ""}`])];
/** 3.27: las sangres de guion (la de la Barrera, la del portador) no salen al azar: se dan por historia. */
const opcionesLinaje = sel => paresLinaje().map(([k, v]) => `<option value="${escH(k)}" ${String(k) === String(sel) ? "selected" : ""} ${D.linajes.find(l => l.id === k)?.portador ? "data-no-azar" : ""}>${escH(v)}</option>`).join("");
const ramasLibres = () => D.ramas.filter(r => !RAMAS_LINAJE.includes(r.id)).map(r => [r.id, r.nombre]);
/** 3.26: al elegir un linaje o un ojo, el DM ve la ventana de esa sangre con el enlace a su diario. */
function abrirSangre(campo, valor, actor = null) {
  if (!game.user.isGM) return;
  const id = linajeDeEleccion(campo, valor, D);
  if (!id) return;
  const l = D.linajes.find(x => x.id === id);
  const ojo = campo === "mirada" ? D.miradas.find(m => m.id === valor) : (l?.mirada ? D.miradas.find(m => m.id === l.mirada) : null);
  const pasos = ojo ? pasosOjo(nombreLinaje(l), ojo.nombre)
    : [`En «Naturalezas y linaje», elige <b>${escH(nombreLinaje(l))}</b> y la fuerza de la sangre. Marca «el jugador lo sabe» solo cuando lo descubra. Pulsa <b>Guardar</b>.`,
       "Sus técnicas de sangre aparecen en Aprender cuando la sangre está activa y el jugador la conoce; sus etapas llegan con la historia."];
  return ventanaLinaje(id, { D, resumen: describir("linaje", id, actor), pasos, actor });
}
const otraNat = n => { const o = Object.keys(NATS).filter(x => x !== n); return o[Math.floor(Math.random() * o.length)]; };

/* ---------- 3.27: azar del DM en todo lo elegible y el diario de las familias ---------- */
/**
 * Pone un 🎲 al lado de cada lista marcada con `data-azar`. Al pulsarlo tira 1dN (N = opciones que entran), lo deja en
 * el chat solo para el DM y elige ese resultado en la lista (dispara «change», así se ve qué es antes de guardar).
 * `data-azar="sin-ninguno"` no sortea «Sin linaje», «Sin familia» ni «Sin sangre»; una opción con `data-no-azar` tampoco.
 */
export function ponerAzar(raiz) {
  if (!raiz?.querySelectorAll || !game.user.isGM) return;
  for (const sel of raiz.querySelectorAll("select[data-azar]")) {
    if (sel.dataset.azarListo) continue;
    sel.dataset.azarListo = "1";
    const b = document.createElement("button");
    b.type = "button"; b.className = "ecos-azar"; b.textContent = "🎲";
    b.dataset.tooltip = "Tirar al azar (solo DM): sale en el chat y queda elegido; todavía no se guarda.";
    b.setAttribute("aria-label", `Tirar ${sel.dataset.azarNombre ?? "al azar"}`);
    b.addEventListener("click", async ev => {
      ev.preventDefault(); ev.stopPropagation();
      const sinNinguno = sel.dataset.azar === "sin-ninguno";
      const ops = [...sel.options].filter(o => o.value !== "" && !o.disabled && !o.hasAttribute("data-no-azar") && !(sinNinguno && ["ninguno", "ninguna"].includes(o.value)));
      if (!ops.length) return;
      const r = await new Roll(`1d${ops.length}`).evaluate();
      const op = ops[Math.max(0, Math.min(ops.length - 1, r.total - 1))];
      sel.value = op.value;
      sel.dispatchEvent(new Event("change", { bubbles: true }));
      await r.toMessage({ flavor: `🎲 Azar del DM · ${escH(sel.dataset.azarNombre ?? "elección")}: <b>${escH(op.text)}</b> (1d${ops.length} = ${r.total})`, speaker: { alias: "Ecos · azar del DM" } },
        { rollMode: CONST.DICE_ROLL_MODES?.PRIVATE ?? "gmroll" }).catch(() => null);
    });
    sel.after(b);
  }
}
const VERSION_FAMILIAS = 1;
const NOMBRE_DIARIO_FAMILIAS = "Mundo 12 · Las familias del Verbe";
const paginaFamilia = id => { for (const j of game.journal ?? []) for (const p of j.pages ?? []) if (p.getFlag?.(MOD, "familia") === id) return p; return null; };
/** El texto de una familia: cómo se hereda y sus artes por nivel, con lo que hace cada una (sacado del catálogo). */
function familiaHTML(id) {
  const f = FAMILIAS[id];
  const tecs = D.tecnicas.filter(t => t.familia === id).sort((a, b) => ((a.obtencion?.nivel ?? a.nivelMin ?? 1) - (b.obtencion?.nivel ?? b.nivelMin ?? 1)) || (a.g - b.g) || a.n.localeCompare(b.n, "es"));
  const porNivel = new Map();
  for (const t of tecs) { const n = Number(t.obtencion?.nivel ?? t.nivelMin ?? 1) || 1; if (!porNivel.has(n)) porNivel.set(n, []); porNivel.get(n).push(t); }
  const filas = [...porNivel.entries()].map(([n, ts]) => `<h3>Desde el nivel ${n}</h3><ul>${ts.map(t => `<li><b>${escH(t.n)}</b> · grado ${t.g} · ${escH(nombreRama(t.rama))} · ${escH(t.usoL ?? t.uso ?? "")}<br>${escH(textoDe(t))}</li>`).join("")}</ul>`).join("");
  return `<h1>${escH(f.nombre)}</h1><p><em>Solo DM. Arte de familia: solo se tiene por nacimiento. No se gana subiendo una rama ni con un maestro.</em></p>
    <h2>Cómo se da</h2><ul><li>Familia y linaje son lo mismo (3.65): la da la sangre. Al despertar a alguien (o después, en su panel → DM → «Naturalezas y linaje»), elige el linaje de su dios y la familia viene con él.</li><li>Una sola familia por persona. Sin ella, sus artes no aparecen en la tienda del jugador.</li></ul>
    <h2>Sus artes, nivel a nivel (${tecs.length})</h2>${filas || "<p>Esta familia todavía no tiene artes en el catálogo.</p>"}
    <p class="ecos-nota">Cada técnica sigue pidiendo además su rama, su rango y su grado, como cualquier otra.</p>`;
}
/** Crea o pone al día el diario de las familias (solo el DM principal). */
export async function asegurarDiarioFamilias() {
  if (!soyGM() || !D) return null;
  let j = game.journal.find(x => x.getFlag(MOD, "familias") !== undefined) ?? game.journal.getName?.(NOMBRE_DIARIO_FAMILIAS);
  const paginas = [{ name: "0 · Cómo se usa", type: "text", flags: { [MOD]: { familia: "_indice" } }, text: { format: 1, content: `<h1>Las familias del Verbe</h1><p><em>Solo DM.</em> Las seis artes de familia se heredan por nacimiento: ${Object.values(FAMILIAS).map(f => `<b>${escH(f.nombre)}</b>`).join(", ")}. Desde 3.27 nadie las aprende sin haber nacido en la familia, aunque suba la rama o tenga un maestro.</p><p>Al elegir una familia en el panel (o al despertar a alguien), el botón «Su diario» trae aquí.</p>` } },
    ...Object.keys(FAMILIAS).map((id, i) => ({ name: `${i + 1} · ${FAMILIAS[id].nombre}`, type: "text", flags: { [MOD]: { familia: id } }, text: { format: 1, content: familiaHTML(id) } }))];
  if (!j) {
    j = await JournalEntry.create({ name: NOMBRE_DIARIO_FAMILIAS, ownership: { default: CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE }, flags: { [MOD]: { familias: VERSION_FAMILIAS } }, pages: paginas });
    return j;
  }
  if (j.getFlag(MOD, "familias") === VERSION_FAMILIAS && j.pages.size >= paginas.length) return j;
  for (const p of paginas) {
    const ya = j.pages.find(x => x.getFlag(MOD, "familia") === p.flags[MOD].familia);
    if (ya) await ya.update({ "text.content": p.text.content });
    else await j.createEmbeddedDocuments("JournalEntryPage", [p]);
  }
  await j.setFlag(MOD, "familias", VERSION_FAMILIAS);
  return j;
}
/** Abre la página de una familia (o la portada). */
export async function abrirFamilia(id) {
  if (!game.user.isGM) return;
  if (!esFamilia(id)) return aviso("Elige una familia en la lista para leer su diario.", "info");
  let p = paginaFamilia(id);
  if (!p) { await asegurarDiarioFamilias(); p = paginaFamilia(id); }
  if (!p) return aviso("No encuentro el diario de las familias.", "warn");
  return p.parent.sheet.render(true, { pageId: p.id });
}

/** 3.38 · Tutorial del panel: lo que alguien nuevo pregunta al ver la interfaz por primera vez. */
const TUTORIAL = [
  ["¿Qué es el Control del Verbe?", "<p>El <b>Control</b> es una habilidad nueva de tu hoja (aparece junto a las de D&D como «Control del Verbe»). Mide qué tan bien dominas tu energía: se tira con <b>Inteligencia</b> (con la dote Control por instinto, con Sabiduría; con Control por presencia, con Carisma) más tu competencia si eres competente en Control. Se tira para aprender técnicas (cada día de práctica), para resistir un choque, para no perder una técnica que cargas y para cosas finas (frenar un golpe, sostener una forma). Dotes como <b>Práctica de control</b> te hacen competente o lo suben; tu rango en una rama no lo cambia.</p>"],
  ["¿Qué es un choque de técnicas?", "<p>Cuando una técnica que cuesta Verbe va contra ti y tú tienes otra técnica que la pueda enfrentar, puedes <b>chocarla</b> con tu <b>reacción Verbe</b>: las dos se encuentran en el aire. Gana la de más grado; el elemento que vence al otro suma; con empate, tu Control decide. Quien gana sale con <b>Ímpetu</b> (+2 a atacar) y quien pierde, con <b>Brecha</b> (−2 CA). Un choque grande estalla y deja el terreno marcado; quien pierde por mucho se lleva el contragolpe.</p><p>En <b>Aprender técnicas</b> cada técnica dice <b>⚔ Choca</b> o <b>No choca</b>.</p>"],
  ["Mi acción de D&D y mi acción Verbe", "<p>Son aparte: en tu turno tienes tu Acción, tu Acción adicional y tu Reacción de D&D, y <b>además</b> tu Acción Verbe, tu Adicional Verbe y tu Reacción Verbe. Las técnicas gastan las del Verbe; atacar con tu espada gasta la de D&D. La barra del turno (bajo la iniciativa) muestra las seis.</p>"],
  ["¿Qué pasa si me quedo sin Verbe?", "<p>Puedes <b>forzarte</b>: usar la técnica igual y quedar en negativo. Antes te pregunta y te dice qué arriesgas (una salvación de Constitución o 1 nivel de Agotamiento). Mientras estés en negativo te recuperas más lento. Con Agotamiento 4 ya no puedes forzarte.</p>"],
  ["Brecha, Grieta y Quebrado", "<p>Las criaturas de este mundo tienen defensas altísimas (Coraza, Fortaleza o Cuerpo sordo). D&D pega fuerte; el Verbe <b>ablanda</b>: <b>Brecha</b> −2 a la CA, <b>Grieta</b> −2 a sus salvaciones, <b>Quebrado</b> sin defensa ni resistencias un turno. Se acumulan hasta 3.</p>"],
  ["¿Cómo escapo?", "<p>Cada rama tiene una técnica de <b>escape</b>: te mueves sin provocar ataques y los enemigos tiran Percepción (o Arcanos) para no perderte. También sirven Desengancharse (tu Acción de D&D) y la Sustitución (tu Reacción Verbe).</p>"],
  ["¿Dónde leo más?", "<p>En los diarios: <b>Reglas de la casa</b> (el Verbe, Ablandar, las acciones de cualquiera) y la página del jugador nuevo. El DM te dice cuál abrir.</p>"]
];
/** El nombre del legado de un dios (alias del linaje), sin nombres reales. */
const nombreLegado = dios => { const l = D?.linajes?.find(x => x.id === dios); return D?.categoriasDote?.find(c => c.id === l?.legado)?.nombre ?? l?.alias ?? l?.nombre ?? dios; };
export async function dialogoDespertar(actor) {
  if (!game.user.isGM) return;
  const { DialogV2 } = foundry.applications.api;
  const oculta = Object.keys(NATS)[Math.floor(Math.random() * 5)];
  const portador = actor.getFlag(MOD, "portador") === true;
  const linPortador = linajePortador(actor.getFlag(MOD, "portadorSangre"), D.linajes.find(l => l.portador)?.id ?? "ninguno");
  const fam0 = portador ? familiaSugerida(FAMILIAS, D.linajes, linPortador) : "ninguna";
  const caja = (campo, tipo, valor) => `${ayudaCampoHTML(campo, escH)}<div class="ecos-verbe-desc" data-de="${campo}">${describir(tipo, valor, actor, { linaje: portador ? linPortador : "ninguno" })}</div>`;
  const html = `<div class="ecos-verbe-form">
    <p>Despierta a <b>${escH(actor.name)}</b>. Desde ahí su hoja muestra la barra, la habilidad Control y el panel. Cada campo tiene su «¿Qué es esto?» y, debajo, lo que significa la opción elegida para el jugador.</p>
    <label>Característica <select name="car" data-desc="car">${opciones(Object.entries(CARS), caracteristicaSugerida(actor))}</select></label>${caja("car", "car", caracteristicaSugerida(actor))}
    <label>Etapa del Verbe <select name="etapa" data-desc="etapa">${opciones(ETAPAS.filter(x => x.n > 0).map(x => [x.n, `${x.n} · ${x.nombre}`]), 1)}</select> <small>quién le enseña decide cuánto se abre; luego subes la etapa con «Abrir la siguiente etapa»</small></label>${caja("etapa", "etapa", 1)}
    <label>Primera naturaleza <select name="natModo" data-desc="natModo">${opciones(Object.entries(MODOS_NATURALEZA).filter(([k]) => k !== "secreta"), "dado")}</select></label>${caja("natModo", "natModo", "dado")}
    <p class="ecos-nota"><b>Segunda naturaleza:</b> sale con su dado cuando la descubra entrenando (3.65: sin naturaleza oculta).</p>
    <label>Cuál <select name="nat" data-desc="nat"><option value="">La tira el jugador entrenando (o la elige, según el modo)</option>${opciones(Object.entries(NATS), "")}</select> <small>solo la ves tú si es secreta</small></label>${ayudaCampoHTML("nat", escH)}<div class="ecos-verbe-desc" data-de="nat"></div>
    <label>Linaje <select name="linaje" data-desc="linaje" data-azar="sin-ninguno" data-azar-nombre="Linaje">${opcionesLinaje(portador ? linPortador : "ninguno")}</select> <button type="button" data-ecos-leer-linaje title="Leer su diario antes de dárselo"><i class="fa-solid fa-book-open"></i> Su diario</button></label>${caja("linaje", "linaje", portador ? linPortador : "ninguno")}
    <p class="ecos-nota"><b>Familia:</b> la familia y el linaje son lo mismo (3.65): la da su sangre. Elige el linaje y la familia de su dios viene con él.</p>
    <label>Fuerza de la sangre <select name="fuerza" data-desc="fuerza" data-azar="sin-ninguno" data-azar-nombre="Fuerza de la sangre">${opciones(Object.entries(FUERZA).map(([k, v]) => [k, v.nombre]), portador ? "plena" : "ninguna")}</select></label>${caja("fuerza", "fuerza", portador ? "plena" : "ninguna")}
    <label><input type="checkbox" name="linajeVisible" ${portador ? "" : "checked"}> El jugador sabe su linaje <small>(si no, no ve la rama Sangre ni su linaje)</small></label>${ayudaCampoHTML("linajeVisible", escH)}
    <details><summary>Consultar linajes y fuerzas antes de asignar</summary><div class="ecos-verbe-consulta" role="region" aria-label="Consulta de linajes y fuerzas" tabindex="0">${Object.entries(FUERZA).map(([k])=>describir("fuerza",k,actor)).join("")}${D.linajes.map(l=>describir("linaje",l.id,actor)).join("")}</div></details>
    <label>Rama principal <select name="principal" data-desc="principal" data-azar data-azar-nombre="Rama principal"><option value="">Que la elija el jugador</option>${opciones(ramasLibres(), "")}</select></label>${caja("principal", "principal", "")}
    ${actor.type !== "character" ? `<label>Nivel (PNJ) <input type="number" name="nivel" min="1" max="20" value="${nivelDe(actor)}"></label>` : ""}
    <label>Reserva de Verbe <select name="reservaModo" data-desc="reservaModo">${opciones([["dados", `Tirar dados por nivel (${DADOS_VERBE.map(t => `${t.desde}–${t.hasta}: ${t.formula}`).join(" · ")})`], ["promedio", "Usar el promedio (la tabla fija)"]], "dados")}</select></label>${caja("reservaModo", "reservaModo", "dados")}
    <label><input type="checkbox" name="lleno" checked> Empieza con la reserva llena</label>${ayudaCampoHTML("lleno", escH)}
  </div>`;
  const r = await DialogV2.wait({
    classes: ["ecos-verbe-despertar"],
    window: { title: `Despertar · ${actor.name}`, icon: "fa-solid fa-droplet", resizable: true },
    position: { width: 680, height: "auto" },
    content: html,
    render: (ev, dialogo) => {
      const el = dialogo?.element ?? ev?.target?.element;
      el?.querySelector?.('select[name="linaje"]')?.addEventListener("change", e => abrirSangre("linaje", e.target.value, actor));
      // 3.31: cada desplegable explica la opción elegida; al cambiar el linaje se pone la familia de su dios.
      const explicar = sel => { const c = el.querySelector(`.ecos-verbe-desc[data-de="${sel.name}"]`); if (c) c.innerHTML = describir(sel.dataset.desc, sel.value, actor, { linaje: el.querySelector('select[name="linaje"]')?.value }); };
      el?.querySelectorAll?.("select[data-desc]").forEach(sel => sel.addEventListener("change", () => {
        explicar(sel);
        if (sel.name === "linaje") { const fam = el.querySelector('select[name="familia"]'); if (fam) { fam.value = familiaSugerida(FAMILIAS, D.linajes, sel.value); explicar(fam); } }
      }));
      el?.querySelector?.("[data-ecos-leer-linaje]")?.addEventListener("click", ev2 => { ev2.preventDefault(); abrirSangre("linaje", el.querySelector('select[name="linaje"]')?.value, actor); });
      el?.querySelector?.("[data-ecos-leer-familia]")?.addEventListener("click", ev2 => { ev2.preventDefault(); abrirFamilia(el.querySelector('select[name="familia"]')?.value); });
      ponerAzar(el);
    },
    buttons: [{ action: "ok", label: "Despertar", default: true, callback: (ev, btn) => new foundry.applications.ux.FormDataExtended(btn.form).object },
      { action: "no", label: "Cancelar" }],
    rejectClose: false
  });
  if (!r || r === "no") return;
  return despertar(actor, r);
}

export async function despertar(actor, o) {
  if (!game.user.isGM) return false;
  // Cómo se conoce la primera naturaleza (2.1c): secreta (la fija el DM), la elige el jugador al descubrirla, o visible desde el principio.
  const natModo = MODOS_NATURALEZA[o.natModo] ? o.natModo : (o.nat ? "visible" : "elige");
  const nat = o.nat || (natModo === "secreta" ? Object.keys(NATS)[Math.floor(Math.random() * 5)] : null);
  let oculta = o.oculta || null;
  if (oculta && oculta === nat) oculta = otraNat(nat);
  const etapa = Math.max(1, Math.min(ETAPA_MAX, Math.trunc(Number(o.etapa)) || 1));
  const e = {
    despierto: true, car: o.car || caracteristicaSugerida(actor), nats: natModo === "visible" && nat ? [nat] : [], oc: revolver(oculta, actor.id), descubierta: false,
    natModo, oc1: natModo === "secreta" ? revolver(nat, actor.id) : null, etapa, maestros: [], segundaModo: o.segundaModo === "fija" ? "fija" : "dado", estudios: {},
    dadosVerbe: o.reservaModo === "promedio" ? { modo: "promedio", version: 1 } : { modo: "dados", fijoHasta: 0, tiradas: {}, version: 1 },
    tradiciones: esFamilia(o.familia) ? [o.familia] : [], familiaNacimiento: esFamilia(o.familia) ? o.familia : null,
    probadas: [], linaje: o.linaje || "ninguno", fuerza: o.fuerza || "ninguna", linajeVisible: !!o.linajeVisible, principal: o.principal || null,
    segunda: null, maestria: null, escuela: null, rangos: {}, ordenRamas: [], abiertas: [], afinidad: {}, trazosExtra: 0, gastados: 0,
    dotes: [...(D.innatos ?? [])], natsExtra: [], combos: [], miradas: {}, trasplantes: [], pactos: [], cerrojos: 0, cultivos: {}, infusiones: {}, propias: [],
    monedas: {}, reserva: null, reservaUsada: false, despertarLibre: false, nivel: o.nivel ? Number(o.nivel) : null, valor: 0,
    historial: [`Despierta en el nivel ${nivelDe(actor)} · etapa ${datosEtapa(etapa).nombre}`]
  };
  if (e.principal) { e.rangos[e.principal] = 1; e.ordenRamas.push(e.principal); }
  await actor.update({ [`flags.${MOD}.${F}`]: e });
  await asegurarTiradasVerbe(actor);
  if (o.lleno) await actor.update({ [`flags.${MOD}.${F}.valor`]: maxVerbe(actor) });
  await asegurarRasgos(actor);
  const lin = linajeDe(actor);
  await susurrarDM(`${escH(actor.name)} despierta`, `<p>Etapa <b>${datosEtapa(etapa).nombre}</b> · ${CARS[e.car]} · naturaleza ${NATS[nat] ?? "por elegir"} (${{ secreta: "secreta: la descubre entrenando", elige: "la elige al descubrirla", visible: "la sabe" }[natModo]}) · oculta <b>${NATS[oculta] ?? "—"}</b> · linaje ${escH(lin ? `${lin.alias ?? lin.nombre} (${lin.real ?? lin.nombre})` : "ninguno")} (${FUERZA[e.fuerza].nombre}${e.linajeVisible ? "" : ", no lo sabe"}) · rama principal ${e.principal ? nombreRama(e.principal) : "por elegir"}.</p><p>Reserva ${maxVerbe(actor)} · ${trazos(actor).libres} Trazos para gastar en su panel.</p>`);
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
  if (D.shinobi && (Number(e.shinobiVersion) || 0) < VERSION_SHINOBI && soyGM()) {
    const antiguaFatal=Number(e.cerrojos)===7;
    await guardar(actor,{shinobiVersion:VERSION_SHINOBI,...(antiguaFatal?{cerrojos:8,compras:(e.compras??[]).map(c=>c.tipo==="cerrojo"&&c.datos?.n===7?{...c,datos:{...c.datos,n:8}}:c)}:{}),historial:hist(e,"Repertorio shinobi: compras conservadas; la antigua puerta fatal pasa a la octava.")});
    e=estado(actor);
  }
  if(D.progresion&&(Number(e.progresionVersion)||0)<VERSION_PROGRESION&&soyGM()){
    const usados={mayores:0,culminaciones:0,trascendentes:0};
    for(const[id,gastado]of Object.entries(e.usosAltos??{}))if(gastado){const g=tecnicaPorId(id,actor)?.g??6;usados[g>=9?'culminaciones':'mayores']++;if(g===11)usados.trascendentes++;}
    for(const k of Object.keys(usados))usados[k]=Math.max(usados[k],Number(e.cuotasPoder?.[k])||0);
    await guardar(actor,{progresionVersion:VERSION_PROGRESION,poderesLegados:itemsTecnica(actor).filter(i=>i.getFlag(MOD,F)?.g>=6).map(i=>i.getFlag(MOD,F).id),cuotasPoder:usados,historial:hist(e,"Progresión 3.1: compras conservadas; nuevos aprendizajes altos requieren su senda. Usos altos previos cuentan hasta el siguiente largo.")});e=estado(actor);
  }
  // Los dones del despertar: si falta alguno (despertó antes de la v1.2), se lo pone sin cobrar.
  const faltan = (D.innatos ?? []).filter(id => !(e.dotes ?? []).includes(id));
  if (faltan.length) {
    await guardar(actor, { dotes: [...(e.dotes ?? []), ...faltan] });
    e = estado(actor);
  }
  // Actualiza el texto y la actividad del rasgo sin reponer los usos ya gastados.
  for (const id of e.dotes ?? []) {
    const dote = D.dotes.find(x => x.id === id);
    if (dote) await rasgoDote(actor, dote);
  }
  await asegurarAEDotes(actor);
  const lin = linajeDe(actor);
  const html = `<p>El Verbe corre por ti. Tu reserva sube con el nivel y con tu Constitución, y se recupera despacio: tarda varios días en llenarse (el 15 % más tu Constitución por cada dos niveles en un Descanso Largo en el Santuario; a la intemperie, la mitad de eso). Las noches, Respiro y Aliento comparten un presupuesto limitado entre largos.</p>
    <p><b>Característica:</b> ${CARS[e.car]} · <b>Naturaleza:</b> ${[...natsDe(actor)].map(n => NATS[n] ?? n).join(", ") || "por elegir"} · <b>Rama principal:</b> ${e.principal ? nombreRama(e.principal) : "por elegir"}${e.linajeVisible && lin ? ` · <b>Linaje:</b> ${escH(lin.alias ?? lin.nombre)} (${FUERZA[e.fuerza]?.nombre})` : ""}</p>
    <p>Las técnicas están en la pestaña de conjuros, en «Técnicas del Verbe». Lo demás, en el panel (botón «Verbe» en la cabecera de la hoja).</p>`;
  const it = actor.items.find(i => i.getFlag(MOD, F)?.rasgo);
  if (it) await it.update({ "system.description.value": html });
  else await actor.createEmbeddedDocuments("Item", [{ name: "El Verbe", type: "feat", img: "systems/dnd5e/icons/svg/damage/force.svg",
    system: { description: { value: html } }, flags: { [MOD]: { [F]: { rasgo: true } } } }]);
  // El pasivo de la herencia (resistencias), como efecto del actor.
  const pasivo = actor.effects.find(x => x.getFlag(MOD, F)?.herencia);
  const her = herenciaDe(actor);
  const divino = donDivino(lin, e.fuerza, nivelDe(actor));
  const cambios = [...(divino.ac ? [{key:"system.attributes.ac.bonus",mode:2,value:String(divino.ac)}] : []), ...(her?.rasgo?.dr ?? []).map(t => ({ key: "system.traits.dr.value", mode: 2, value: t })),
    ...(her?.rasgo?.ae ?? []).map(([key, mode, value]) => ({ key, mode, value }))];
  for (const c of cambios) if (/^system\.attributes\.movement\./.test(c.key) && Number(c.mode)!==1) c.value=String(metrosEnHoja(Number(c.value),actor));
  if (pasivo && (!cambios.length || pasivo.getFlag(MOD, F).herencia !== her?.id)) await pasivo.delete();
  else if (pasivo) {
    const name = e.linajeVisible ? her.herencia : "Resistencia innata";
    if (JSON.stringify(pasivo.changes)!==JSON.stringify(cambios) || pasivo.name!==name) await pasivo.update({changes:cambios,name});
    return;
  }
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
    if (sistema.velocidad(actor).pies) c.value = String(Number(c.value) / 0.3);
  }
  const ef = actor.effects.find(x => x.getFlag(MOD, F)?.dotesAE);
  if (!changes.length) { if (ef) await ef.delete(); return; }
  if (ef) { if (JSON.stringify(ef.changes) !== JSON.stringify(changes)) await ef.update({ changes }); return; }
  await actor.createEmbeddedDocuments("ActiveEffect", [{ name: "Beneficios del Verbe", img: "systems/dnd5e/icons/svg/items/feature.svg", changes,
    transfer: false, flags: { [MOD]: { [F]: { dotesAE: true } } } }]);
}

/** 3.74: «Qué es» de una dote: su tipo (don o entrenada) y para qué sirve su categoría. */
function queEsDoteHTML(dote){
  const cat=(D?.categoriasDote??[]).find(c=>c.id===dote.cat);
  const tipo=dote.tipo==='entrenada'?'Dote entrenada':dote.tipo==='don'?'Don':'Dote';
  return `<h3>Qué es</h3><p>${escH(`${tipo}${cat?` de ${cat.nombre}: ${cat.texto}`:''}.`)}</p>`;
}
/** Una dote es también un rasgo en la hoja (las de nacimiento lo dicen). */
async function rasgoDote(actor, dote) {
  const actual=actor.items.find(i=>i.getFlag(MOD,F)?.dote===dote.id);
  const nace = (D.innatos ?? []).includes(dote.id);
  const p=dote.poder,aid=idFijo(`d${firma(dote.id)}actividad`),eid=idFijo(`d${firma(dote.id)}efecto`);
  const data={ name:dote.nombre,type:'feat',img:iconoDote(dote),effects:[],
    system:{description:{value:`${queEsDoteHTML(dote)}<h3>Qué ganas</h3>${efectoHTML(dote.textoJ??dote.texto)}<h3>Cómo se usa</h3><p>${escH(dote.automatizacion??'Consulta las condiciones en mesa.')}</p><p><b>Para aprender esta dote:</b> ${escH(requisitosDoteTexto(dote))}</p>${nace?'<p>Del despertar, sin coste de Trazos.</p>':''}`}},flags:{[MOD]:{[F]:{dote:dote.id}}}};
  if(p){
    const act={_id:aid,name:dote.nombre,type:p.curacion?'heal':'utility',activation:{type:p.tiempo??'bonus',value:1,override:true},duration:{units:p.duracion?'round':'inst',value:p.duracion?p.duracion/6:null,override:true},range:{units:'self',override:true},target:{affects:{type:'self',count:'1'},template:{},override:true},effects:[],uses:{spent:0,recovery:[]},consumption:{targets:[{type:'itemUses',target:'',value:'1',scaling:{mode:'',formula:''}}],scaling:{allowed:false},spellSlot:false}};
    if(p.curacion)act.healing={number:1,denomination:6,bonus:'',types:['healing'],custom:{enabled:false,formula:''},scaling:{mode:'',number:0,formula:''}};
    else act.roll={formula:'',name:'',prompt:false,visible:false};
    Object.assign(data.system,{uses:{max:'1',spent:Number(actual?.system.uses?.spent)||0,recovery:[{period:'lr',type:'recoverAll'}]},activities:{[aid]:act}});
    if(p.ae?.length)data.effects=[{_id:eid,name:dote.nombre,transfer:false,disabled:false,duration:{seconds:p.duracion,rounds:p.duracion/6},changes:p.ae.map(([key,mode,value])=>({key,mode,value:String(value)})),flags:{[MOD]:{[F]:{shinobi:true,aplicarUsuario:true,grupoModo:`dote:${dote.id}`}}}}];
    if(sistema.velocidad(actor).pies)for(const ef of data.effects)for(const c of ef.changes)if(/^system\.attributes\.movement\./.test(c.key))c.value=String(Number(c.value)/.3);
  }
  const sig=firma(JSON.stringify([data.name,data.system.description,data.effects,dote.poder]));data.flags[MOD][F].firma=sig;
  if(actual){if(actual.getFlag(MOD,F)?.firma!==sig){data._id=actual.id;await actor.updateEmbeddedDocuments('Item',[data],{diff:false});}}
  else await actor.createEmbeddedDocuments('Item',[data]);
}

function requisitosDoteTexto(d){
  if(!d.evolucion)return d.req||'Ninguno';
  const r=d.requisitos??{},alguna=r.algunaDote?.length?(r.algunaDote.every(id=>id.endsWith('-4'))?'Leyenda de una rama':r.algunaDote.every(id=>id.endsWith('-3'))?'Maestría de una rama':'Una de las sendas previas'):null;
  return [`nivel ${r.nivel??1}`,...Object.entries(r.ramas??{}).map(([id,n])=>`${nombreRama(id)} ${nombreRango(n)}`),...(r.dotes??[]).map(id=>D.dotes.find(x=>x.id===id)?.nombre??id),...(r.tecnicas??[]).map(id=>tecnicaPorId(id)?.n??id),r.hito?`Hito: ${r.hito.replaceAll('-',' ')}`:null,r.ojo?`Mirada, etapa ${r.ojo}`:null,alguna].filter(Boolean).join(' · ');
}
export async function usarDote(actor,id){
  if(!editarActor(actor)||!tieneDote(actor,id))return false;
  const item=actor.items.find(i=>i.getFlag(MOD,F)?.dote===id),acts=item?.system.activities;
  const act=acts?.values?[...acts.values()][0]:Object.values(acts??{})[0];
  if(!act?.use)return rechazar('Abre la actividad de la dote en tu hoja después de actualizar el mundo.');
  return act.use();
}
function consumirDote(activity,usage,message,updates){
  const item=activity.item,actor=item.actor,id=item.getFlag(MOD,F)?.dote,d=D.dotes.find(d=>d.id===id),e=estado(actor);
  if(!d?.poder)return;
  if(!editarActor(actor)||!e?.despierto||!tieneDote(actor,id)||!doteActiva(actor,d)||noPuedeActuar(actor))return false;
  if(enSerie.ocupada(claveActor(actor))||(consumoPendiente(actor)&&consumoPendiente(actor).config!==usage))return false;
  if(e.usosDote?.[id])return rechazar('Esa dote ya se usó desde el último Descanso Largo.','warn');
  const p=d.poder,costo=Number(p.costo)||0;
  if((p.soloVacio&&e.valor>0)||(p.combate&&!game.combat?.started)||(p.mitad&&e.valor>=maxVerbe(actor)/2))return rechazar('Todavía no se cumple el disparador de esa dote.','warn');
  if(costo>0&&costo>Number(e.valor))return rechazar('La dote necesita energía positiva para pagar su coste.','warn');
  if(usage.consume===false)return rechazar('Las dotes activables requieren registrar su consumo.','warn');
  if(p.curacion&&sistema.pg(actor).valor<=0)return false;
  if(p.breve&&presupuestoBreveVerbe(actor,e.recCortos,1).cantidad===0)return rechazar('Agotó el presupuesto de recuperación breve hasta el próximo largo.','warn');
  const nonce=foundry.utils.randomID();consumosPendientes.set(claveActor(actor),{config:usage,nonce,hasta:Date.now()+30000});
  updates.actor??={};updates.actor[`flags.${MOD}.${F}.valor`]=(Number(e.valor)||0)-costo;
  updates.actor[`flags.${MOD}.${F}.usosDote.${id}`]=true;updates.actor[`flags.${MOD}.${F}.ultimoUso`]=nonce;
  usage.ecosDote={id,nonce,costo};return;
}
async function despuesDeDote(activity,usage){
  const actor=activity.item.actor,v=usage.ecosDote,d=D.dotes.find(d=>d.id===v.id);
  if(consumoPendiente(actor)?.nonce===v.nonce)consumosPendientes.delete(claveActor(actor));
  if(d.poder.recupera)await serializarActor(actor,async()=>{
    const datos=actor.getRollData?.()??{abilities:actor.system.abilities,details:actor.system.details,prof:competencia(actor)};datos.mod=modDe(actor,estado(actor).car);
    const roll=await new Roll(d.poder.recupera,datos).evaluate(),r=recuperacionBreve(actor,Math.max(0,roll.total));
    await guardar(actor,{valor:r.valor,recResto:r.recResto,recCortos:r.recCortos});
    await roll.toMessage({speaker:ChatMessage.getSpeaker({actor}),flavor:`${d.nombre}: ${r.cantidad} puntos de recuperación; deuda a 2:1.`});
  });
  await efectosShinobi(actor,activity.item,{nonce:v.nonce});
}
function permisoConcentracion(actor,item,usage,grado){
  if(!(item.system.properties?.has?.('concentration')||item.system.properties?.includes?.('concentration'))||usage.concentration?.begin===false)return {ok:true};
  const terminar=Array.isArray(usage.concentration?.end)?usage.concentration.end:usage.concentration?.end?[usage.concentration.end]:[];
  const existentes=actor.effects.filter(e=>!e.disabled&&e.statuses?.has('concentrating')).map(e=>{
    const data=e.getFlag('dnd5e','item'),it=actor.items.get(data?.id),scaling=Number(e.getFlag('dnd5e','scaling'))||0;
    return {id:e.id,grado:Number(it?.getFlag(MOD,F)?.g??it?.system.level??data?.data?.system?.level??11)+scaling};
  });
  return validarConcentraciones({existentes,terminar,grado,nivel:nivelDe(actor),doble:tieneDote(actor,'dos-hilos')});
}

/* ------------------------------------------------------------------ */
/*  Gasto al usar una técnica                                         */
/* ------------------------------------------------------------------ */

/** El grado de una criatura: el de su Verbe si despertó, si no la mitad de su nivel o VD (hacia arriba). */
/**
 * Leer el Verbe de los objetivos marcados (2.3c): solo tramos, nunca cifras. Lo ve quien lee (y el DM).
 * Qué se ve depende de las técnicas de Rastro que sabe (Sentir cerca, Sentir lejos, Ver todo el Verbe, El hilo de cada vida).
 */
export function lecturaDe(lector, otro) {
  const ve = queVe(itemsTecnica(lector).map(i => i.getFlag(MOD, F)?.id));
  if (!ve.size || !otro) return null;
  const usa = despierto(otro), lin = [];
  lin.push(usa ? "usa Verbe" : "no notas Verbe en su interior");
  if (usa && ve.has("fuerza")) lin.push(`su Verbe es ${tramoFuerza(gradoMax(lector), gradoCriatura(otro))}`);
  if (usa && ve.has("reserva")) lin.push(`su reserva está ${tramoReserva(estado(otro)?.valor, maxVerbe(otro))}`);
  if (usa && ve.has("naturaleza")) { const n = [...natsDe(otro)].map(x => NATS[x] ?? x); if (n.length) lin.push(`responde a ${n.join(" y ")}`); }
  if (ve.has("vida")) { const hp = sistema.pg(otro); if (hp.hay) lin.push(`su cuerpo está ${tramoVida(hp.valor, hp.maxEfectivo)}`); }
  return lin;
}
export async function leerObjetivos(lector) {
  const objetivos = [...(game.user?.targets ?? [])].map(t => t.actor).filter(a => a && a !== lector);
  if (!queVe(itemsTecnica(lector).map(i => i.getFlag(MOD, F)?.id)).size) return rechazar("Para leer el Verbe de otros necesitas una técnica de Rastro de lectura (Sentir cerca, Sentir lejos…).", "warn");
  if (!objetivos.length) return rechazar("Marca primero los tokens que quieres leer.", "warn");
  const filas = objetivos.map(o => `<li><b>${escH(o.token?.name ?? o.prototypeToken?.name ?? o.name)}</b>: ${escH(lecturaDe(lector, o).join("; "))}.</li>`).join("");
  aLaMesa(lector, "✦ Lees el Verbe", `<ul>${filas}</ul><p class="ecos-nota">Son impresiones, no cifras. Recuerda pagar la técnica que usas para leer si la mesa lo pide.</p>`, { soloDueno: true });
  return true;
}
export function gradoCriatura(a) {
  if (!a) return 0;
  if (despierto(a)) return gradoMax(a);
  const n = (a.type === "character") ? sistema.nivel(a) : sistema.vd(a);
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
    if(meta?.dote)return consumirDote(activity,usageConfig,messageConfig,updates);
    if (!meta?.id) return;
    const actor = item.actor;
    if (!editarActor(actor)) return false;
    if (enSerie.ocupada(claveActor(actor)) || (consumoPendiente(actor) && consumoPendiente(actor).config !== usageConfig)) {
      avisoUso("Ya hay una operación de Verbe en curso para este personaje.");
      return false;
    }
    const e = estado(actor);
    if (!e?.despierto) { avisoUso(`${actor?.name ?? "Este actor"} no tiene el Verbe despierto.`); return false; }
    if (usageConfig?.consume === false) {
      if (game.user.isGM) return;
      avisoUso("Solo el DM puede omitir el gasto de una técnica.");
      return false;
    }
    const acceso = accesoShinobi(meta, contextoShinobi(actor), true);
    if (!acceso.ok) { avisoUso(acceso.motivo); return false; }
    if (cargaDe(meta) && !(e.canalizada?.id === meta.id && e.canalizada?.lista)) { avisoUso("Es una técnica cargada: primero canalízala desde el panel (Mis técnicas → Canalizar) y libérala cuando tenga carga."); return false; }
    const aprendido=permisoAprendido(actor,meta);if(!aprendido.ok){avisoUso(aprendido.motivo);return false;}
    const grado = meta.g + (Number(usageConfig?.scaling) || 0);
    if(grado>meta.g){const accesoElevado=accesoObtencion({...meta,g:grado},{nivel:nivelDe(actor),dotes:dotesActivas(actor)});if(!accesoElevado.ok){avisoUso(accesoElevado.motivo);return false;}}
    const cuota=permisoCuota(grado,{nivel:nivelDe(actor),dotes:dotesActivas(actor),usados:e.cuotasPoder});
    if(!cuota.ok){avisoUso(cuota.motivo);return false;}
    const concentracion=permisoConcentracion(actor,item,usageConfig,grado);
    if(!concentracion.ok){avisoUso(concentracion.motivo);return false;}
    const fuerte = meta.fuerte ? extraContraFuerte(actor) : { extra: 0, quien: null };
    const costoBase = costoUso(actor, meta, grado, { infusion: meta.infusion }) + fuerte.extra;
    // 3.64 (regla del autor): a todo costo de Verbe se le suma el dado de control de su etapa.
    const control = ajuste("dadoControl", true) ? tirarControl(etapaDe(e), () => (CONFIG.Dice?.randomUniform ?? Math.random)()) : null;
    let costo = costoBase + (control?.valor ?? 0);
    const replica = usageConfig?.ecosReplica === true;
    if (replica && (grado > capacidadReplicas(actor) || meta.dividirVerbe || meta.ritual || meta.liberarReserva || meta.prestamo || e.accionReplicaUsada || !efectoV(actor,"replicas") || Object.values(item.system.activities ?? {}).some(a=>a.type === "utility"))) { avisoUso("Las réplicas comparten una acción ofensiva, respetan su límite de grado y no duplican poderes o recursos especiales."); return false; }
    const valor = Number(replica ? e.reservaReplicas : e.valor) || 0;
    const reaccion = item.system?.activation?.type === "reaction" || tecnicaPorId(meta.id, actor)?.t === "R";
    const turno=consumosChoque.has(usageConfig)?{ok:true}:permisoTurno(grado,{combate:game.combat?.started?(game.combat.id??"combate"):null,estado:e.turnoTecnicas,reaccion,maximo:maxAccionesVerbe(actor),adicional:gastoVerbe(tecnicaPorId(meta.id,actor)?.t??item.system?.activation?.type)==="adicional",replica});if(!turno.ok){avisoUso(turno.motivo);return false;}
    const evalua = c => evaluarGasto({ valor, costo: c, limite: replica ? 0 : limiteNegativo(actor), grado, gradoMaximo: replica ? Math.min(capacidadReplicas(actor),gradoUsable(actor,meta)) : gradoUsable(actor, meta),
      agotamiento: sistema.agotamiento(actor), incapacitado: noPuedeActuar(actor),
      reaccion, puedeReaccionar: reaccionDisponible(actor), altoGastado: !!e.usosAltos?.[meta.id] });
    let permiso = evalua(costo);
    // El dado nunca impide usarla: si con él no alcanza, se lleva lo que quede hasta el límite.
    if (!permiso.ok && control?.valor) {
      const base = evalua(costoBase);
      if (base.ok) { const cabe = Math.max(0, base.despues - (replica ? 0 : limiteNegativo(actor))); control.valor = Math.min(control.valor, cabe); control.tope = true; costo = costoBase + control.valor; permiso = evalua(costo); }
    }
    if (!permiso.ok) { avisoUso(permiso.motivo); return false; }
    let nuevo = permiso.despues;
    const pg = meta.costoPG?Math.max(1,Number(meta.costoPG)-sumaEf(actor,ef=>ef.costoPGMenos)):0;
    if (pg && sistema.pg(actor).valor <= pg) { avisoUso(`Necesita más de ${pg} PG para pagar este esfuerzo sin caer.`); return false; }
    const reparto = meta.dividirVerbe && !clonDe(meta) ? dividirReserva(valor,costo,Math.min(competencia(actor),Number(meta.copias)||1)) : null;
    if (reparto && reparto.porCuerpo < 1) { avisoUso("No queda energía positiva suficiente para repartir entre todos los cuerpos."); return false; }
    if (reparto) nuevo = reparto.original;
    const nonce = foundry.utils.randomID();
    consumosPendientes.set(claveActor(actor), { config: usageConfig, nonce, hasta: Date.now() + 30000 });
    updates.actor ??= {};
    if(turno.cambios)updates.actor[`flags.${MOD}.${F}.turnoTecnicas`]=turno.cambios;
    for(const[k,v]of Object.entries(cuota.cambios))updates.actor[`flags.${MOD}.${F}.cuotasPoder.${k}`]=v;
    updates.actor[`flags.${MOD}.${F}.${replica ? "reservaReplicas" : "valor"}`] = nuevo;
    if (replica && game.combat?.started) updates.actor[`flags.${MOD}.${F}.accionReplicaUsada`] = true;
    if (reparto) { updates.actor[`flags.${MOD}.${F}.reservaReplicas`] = reparto.comprometido; updates.actor[`flags.${MOD}.${F}.lazoReplica`] = nonce; }
    if (meta.ritual) updates.actor[`flags.${MOD}.${F}.permisosRituales.${meta.id}`] = false;
    if (meta.familiaUso) updates.actor[`flags.${MOD}.${F}.usosFamilia.${meta.familiaUso}`] = true;
    if (meta.desgasteOjo && (Number(e.miradas?.[meta.desgasteOjo]) || 0) < 5) updates.actor[`flags.${MOD}.${F}.desgasteOcular.${meta.desgasteOjo}`] = (Number(e.desgasteOcular?.[meta.desgasteOjo]) || 0) + 1;
    if (meta.sacrificarOjo) updates.actor[`flags.${MOD}.${F}.ojosSacrificados.${meta.sacrificarOjo}`] = (Number(e.ojosSacrificados?.[meta.sacrificarOjo]) || 0) + 1;
    if (pg) Object.assign(updates.actor, sistema.datosPg(sistema.pg(actor).valor - pg));
    updates.actor[`flags.${MOD}.${F}.ultimoUso`] = nonce;
    if (grado >= 6) updates.actor[`flags.${MOD}.${F}.usosAltos.${meta.id}`] = true;
    if (reaccion && game.combat?.started) updates.actor[`flags.${MOD}.${F}.reaccionUsada`] = true;
    if (e.reserva === meta.id && !e.reservaUsada && grado === meta.g) updates.actor[`flags.${MOD}.${F}.reservaUsada`] = true;
    usageConfig.ecosVerbe = { grado, costo, antes: valor, despues: nuevo, nonce, fuerte: fuerte.extra ? fuerte : null, replica, reparto, control };
    foundry.utils.setProperty(messageConfig, `data.flags.${MOD}.${F}`, { grado, costo, despues: nuevo, extraFuerte: fuerte.extra || 0, control });
    const recibo=prepararRecibo(actor,item,usageConfig.ecosVerbe,e,meta);
    updates.actor[`flags.${MOD}.${F}.ultimoRecibo`]=recibo;
    foundry.utils.setProperty(messageConfig, `data.flags.${MOD}.resolucion`, recibo);
  } catch (err) {
    console.error(`${MOD} | capa V: consumo`, err);
    aviso("No se pudo comprobar el gasto de Verbe. La técnica no se ha autorizado.", "error");
    return false;
  }
}

async function despuesDeUsar(activity, usageConfig) {
  if(usageConfig?.ecosDote)return despuesDeDote(activity,usageConfig);
  const v = usageConfig?.ecosVerbe;
  if (!v) return;
  const item = activity.item;
  const actor = item.actor;
  if (estado(actor)?.canalizada?.id === item.getFlag(MOD, F)?.id) await guardar(actor, { canalizada: null });
  if (consumoPendiente(actor)?.nonce === v.nonce) consumosPendientes.delete(claveActor(actor));
  const meta = item.getFlag(MOD, F);
  if (v.fuerte?.extra) aLaMesa(actor, "Contra alguien más fuerte", `<p>${escH(actor.name)} paga <b>${v.fuerte.extra} Verbe más</b>: ${escH(v.fuerte.quien ?? "su objetivo")} es más fuerte que su grado.</p>`, { soloDueno: true });
  if (!v.replica && v.despues < 0) await sobreesfuerzo(actor, v.grado, v.despues);
  // 3.27: cada uso en combate dice qué gastó de la economía del Verbe, aparte de la de D&D.
  if (!v.replica && enCombate(actor)) {
    const reac = item.system?.activation?.type === "reaction" || tecnicaPorId(meta.id, actor)?.t === "R";
    const tipo = reac ? "reaccion" : gastoVerbe(tecnicaPorId(meta.id, actor)?.t ?? item.system?.activation?.type);
    const t = turnoVerbe(actor);
    const nombre = { accion: "acción Verbe", adicional: "acción adicional Verbe", reaccion: "reacción Verbe" }[tipo];
    const dnd = { accion: "Su Acción de D&D sigue libre", adicional: "Su Acción adicional de D&D sigue libre", reaccion: "Su Reacción de D&D sigue libre" }[tipo];
    if (nombre) aLaMesa(actor, nombre.charAt(0).toUpperCase() + nombre.slice(1),
      `<p class="ecos-gasto-verbe">✦ Se gastó la <b>${nombre}</b> de ${escH(actor.name)}${tipo === "accion" && t.max > 1 ? ` (${t.usadas}/${t.max} este turno)` : ""}. ${dnd}.</p>`);
  }
  await efectosShinobi(actor,item,v);
  // 3.32: lo que es solo sobre ti se pone en ti, aunque tengas a otro marcado (sin midi-qol; con midi lo hace midi).
  if (!v.replica) await aplicarEnUsuario(activity).catch(err => console.warn(`${MOD} | efectos propios`, err));
  if (meta.golpe327 && !v.replica) await golpeConArma(actor, item, meta, v).catch(err => console.error(`${MOD} | golpe con arma`, err));
  if (clonDe(meta)) await pedirClones(actor, item, meta);
  else explicarUso(actor, item, meta).catch(() => null);
  // Estados de poder que se ponen al usar su técnica.
  if (meta.id === "sangre-despertar") await ponerDespertar(actor);
  else if (meta.rama === "mirada" && /-abrir$/.test(meta.id)) await ponerOjo(actor, meta.id.split("-")[1]);
}

/* ---------- 3.27: echar un vistazo a los grados de más arriba ---------- */
/**
 * Todas las técnicas de una rama que se ganan subiéndola (sin las de familia, linaje, sangre, Mirada ni las del DM),
 * por grado, con lo que pide cada una. Así el jugador sabe qué le espera antes de gastar Trazos en un rango.
 */
export async function vistazoRama(actor, rama) {
  const r = D.ramas.find(x => x.id === rama);
  if (!r) return;
  COMO_JUGADOR = game.user.isGM; // se ve como lo vería el jugador
  let html;
  try {
    const tecs = D.tecnicas.filter(t => t.rama === rama && !t.retirada && !t.soloDM && !t.familia && visibleJugador(t) && naturalezaVisible(actor, t) && !t.item?.flags?.[MOD]?.[F]?.acceso?.tradicion);
    const porGrado = new Map();
    for (const t of tecs) { if (!porGrado.has(t.g)) porGrado.set(t.g, []); porGrado.get(t.g).push(t); }
    const rg = rangoDe(actor, rama), alcanza = Math.min(gradoMax(actor), rangoGrado(rg));
    const rangoPara = g => D.rangos.find(x => x.grado >= g)?.nombre ?? "—";
    html = `<div class="ecos-vistazo"><p>Rama <b>${escH(r.nombre)}</b> · tu rango: <b>${nombreRango(rg)}</b> · hoy llegas hasta <b>grado ${alcanza}</b>. Abajo, todas sus técnicas, también las que todavía no alcanzas. No incluye artes de familia ni de linaje.</p>
      ${[...porGrado.entries()].sort((a, b) => a[0] - b[0]).map(([g, ts]) => `<details ${g === alcanza + 1 ? "open" : ""}><summary><b>Grado ${g}</b> · pide nivel ${nivelParaGrado(g)} y rango ${escH(rangoPara(g))} ${g <= alcanza ? "· <i>ya a tu alcance</i>" : ""} (${ts.length})</summary>
        <ul>${ts.sort((x, y) => x.n.localeCompare(y.n, "es")).map(t => `<li class="${conoce(actor, t.id) ? "sabe" : ""}"><b>${escH(t.n)}</b>${conoce(actor, t.id) ? " ✓" : ""} · ${escH(TIEMPO_L[t.t] ?? t.t)}${t.alc ? ` · ${escH(alcanceL(t.alc, t.area))}` : ""}${t.nat && NATS[t.nat] ? ` · ${escH(NATS[t.nat])}` : ""} · ${t.trazos} Trazo${t.trazos === 1 ? "" : "s"}<br><small>${escH(avanceTexto(textoDe(t)))}</small></li>`).join("")}</ul></details>`).join("")}</div>`;
  } finally { COMO_JUGADOR = false; }
  return foundry.applications.api.DialogV2.wait({ window: { title: `Vistazo · ${r.nombre}`, icon: "fa-solid fa-binoculars", resizable: true }, position: { width: 680, height: 640 },
    content: html, buttons: [{ action: "cerrar", label: "Cerrar", default: true }], rejectClose: false });
}

/* ---------- 3.27: técnicas de golpe ---------- */
const NOMBRE_ARMA = { cac: "un arma cuerpo a cuerpo o un golpe sin armas", cacLigera: "un golpe cuerpo a cuerpo o un arma ligera", arma: "un arma", arrojadiza: "un arma arrojadiza", sinArmas: "un golpe sin armas" };
/** Qué es cada arma de la hoja: cuerpo a cuerpo, a distancia, arrojadiza, ligera, sin armas. */
function rasgosArma(i) {
  const tipo = String(i.system?.type?.value ?? ""), props = new Set(Array.from(i.system?.properties ?? []));
  const unarmed = tipo === "natural" || i.system?.identifier === "unarmed-strike" || i.system?.identifier === "ecos-golpe-sin-armas" || /sin armas|unarmed/i.test(i.name);
  return { melee: /M$/.test(tipo) || tipo === "improv" || unarmed, ranged: /R$/.test(tipo), thrown: props.has("thr"), light: props.has("lgt"), unarmed };
}
/** Las armas de la hoja que sirven para el golpe, las equipadas primero. */
const armasPara = (actor, req) => actor.items.filter(i => i.type === "weapon" && armaSirve(req, rasgosArma(i)))
  .sort((a, b) => (Number(!!b.system?.equipped) - Number(!!a.system?.equipped)) || a.name.localeCompare(b.name, "es"));
/** Elige con qué atacar (ventana del dueño). Devuelve el objeto o null. */
async function elegirArma(actor, req, titulo) {
  const armas = armasPara(actor, req);
  if (!armas.length) { avisoUso(`${actor.name} no tiene ${NOMBRE_ARMA[req] ?? "un arma"} para este golpe. Ponlo en la hoja y vuelve a usarlo.`); return null; }
  if (armas.length === 1) return armas[0];
  const r = await foundry.applications.api.DialogV2.wait({ window: { title: `¿Con qué atacas? · ${titulo}`, icon: "fa-solid fa-hand-fist" }, position: { width: 420 },
    content: `<div class="ecos-verbe-form"><p>Elige ${escH(NOMBRE_ARMA[req] ?? "un arma")}. El ataque usa su característica y su bonificador, y suma lo de la técnica.</p>
      <select name="arma">${armas.map(i => `<option value="${i.id}">${escH(i.name)}${i.system?.equipped ? "" : " (no equipada)"}</option>`).join("")}</select></div>`,
    buttons: [{ action: "ok", label: "Atacar", icon: "fa-solid fa-dice-d20", default: true, callback: (ev, b) => b.form.elements.arma.value }, { action: "no", label: "Cancelar" }], rejectClose: false });
  return r && r !== "no" ? actor.items.get(r) : null;
}
/**
 * Una técnica de golpe, al usarse: pone en la hoja el bono de daño (el próximo golpe, o mientras dure) y, si la técnica
 * ataca con un arma, pide cuál y tira ese ataque con su característica. El bono del próximo golpe se gasta al tirar el daño.
 */
async function golpeConArma(actor, item, meta, v) {
  const g = meta.golpe327;
  if (!g || !actor.isOwner) return;
  const dados = g.yaTiene ? null : dadosGolpe(g, { nivel: nivelDe(actor), gradosExtra: (Number(v?.grado) || meta.g) - meta.g, extra: dadosExtra(actor, meta) });
  const claves = ["cac", "sinArmas", "cacLigera"].includes(g.arma) ? ["mwak"] : ["mwak", "rwak"];
  const dur = item.system?.duration ?? {};
  const segundos = g.turno ? 6 : Math.max(6, (Number(dur.value) || 1) * ({ round: 6, turn: 6, minute: 60, hour: 3600 }[dur.units] ?? 60));
  if ((dados || g.nota) && !g.yaTiene) {
    await actor.createEmbeddedDocuments("ActiveEffect", [{
      name: `${g.modo === "durante" ? "Golpes" : "Próximo golpe"} · ${item.name}`, img: item.img, origin: item.uuid, transfer: false,
      changes: dados ? claves.map(k => ({ key: `system.bonuses.${k}.damage`, mode: 2, value: `+ ${dados.formula}` })) : [],
      duration: { seconds: segundos, rounds: Math.ceil(segundos / 6), startTime: game.time?.worldTime ?? 0, startRound: game.combat?.round ?? null, startTurn: game.combat?.turn ?? null },
      description: `<p>${dados ? `Tus golpes con ${escH(NOMBRE_ARMA[g.arma])} suman ${dados.n}d${dados.d} de ${escH(DANO_ES[dados.tipo] ?? dados.tipo)}. ` : ""}${g.modo === "durante" ? "Mientras dure la técnica." : `Se gasta al tirar el daño del próximo golpe${g.modo === "ataque" && g.veces > 1 ? ` (${g.veces} golpes)` : ""}.`}${g.nota ? ` Además: ${escH(g.nota)}` : ""}</p>`,
      flags: { [MOD]: { [F]: { golpe327: { tec: meta.id, nombre: item.name, nota: g.nota, arma: g.arma, consumir: g.modo !== "durante", restantes: g.modo === "ataque" ? g.veces : 1 } } } }
    }]);
  }
  if (g.modo !== "ataque") {
    aLaMesa(actor, `✦ ${escH(item.name)}`, `<p>${g.modo === "durante" ? "Mientras dure, los golpes" : "El próximo golpe"} de ${escH(actor.name)} con ${escH(NOMBRE_ARMA[g.arma])}${dados ? ` suma <b>${dados.n}d${dados.d}</b> de ${escH(DANO_ES[dados.tipo] ?? dados.tipo)}` : ""}${g.nota ? `; además, ${escH(g.nota)}` : ""}.${g.modo === "durante" ? "" : " Se gasta al tirar el daño."}</p>`, { soloDueno: false });
    return;
  }
  const arma = await elegirArma(actor, g.arma, item.name);
  if (!arma) return;
  for (let i = 0; i < (Number(g.veces) || 1); i++) {
    const act = (arma.system?.activities?.contents ?? [...(arma.system?.activities?.values?.() ?? [])]).find(a => a.type === "attack");
    if (!act) { avisoUso(`${arma.name} no tiene una actividad de ataque.`); break; }
    await act.use({ ecosGolpe: meta.id }, {}, {});
  }
}
/** Al tirar el daño de un ataque con arma: se gasta el bono del próximo golpe y se recuerda lo que además hace. */
async function gastarProximoGolpe(activity) {
  const actor = activity?.actor;
  if (!actor?.isOwner || activity?.type !== "attack" || activity.item?.type !== "weapon") return;
  const r = rasgosArma(activity.item);
  for (const ef of actor.effects.filter(x => x.getFlag?.(MOD, F)?.golpe327?.consumir || (x.getFlag?.(MOD, F)?.golpeSiguiente && x.getFlag?.(MOD, F)?.consumir))) {
    const gl = ef.getFlag(MOD, F).golpe327 ?? { nombre: ef.name, arma: "arma", restantes: 1, nota: "" };
    if (!armaSirve(gl.arma, r)) continue;
    const quedan = (Number(gl.restantes) || 1) - 1;
    if (quedan > 0) await ef.setFlag(MOD, F, { ...ef.getFlag(MOD, F), golpe327: { ...gl, restantes: quedan } });
    else await ef.delete();
    if (gl.nota) aLaMesa(actor, `✦ ${escH(gl.nombre)}`, `<p>El golpe de ${escH(actor.name)} con ${escH(activity.item.name)}: ${escH(gl.nota)}</p>`);
  }
}
Hooks.on("dnd5e.rollDamageV2", (rolls, datos) => { if (activo()) gastarProximoGolpe(datos?.subject).catch(err => console.error(`${MOD} | próximo golpe`, err)); });

/** Gastar en negativo: CON (CD 10 + grado) o 1 Agotamiento; y la Barrera lo siente si su sangre la toca. */
async function sobreesfuerzo(actor, grado, despues) {
  {
    const dc = 10 + grado + sumaEf(actor, ef => ef.sobreCD);
    const rolls = await sistema.tirarSalvacion(actor, "con", { target: dc, advantage: tieneDote(actor, "aguante-verbe") }, { configure: false });
    const roll = Array.isArray(rolls) ? rolls[0] : rolls;
    if (roll && roll.total < dc) {
      const ag = Math.min(6, sistema.agotamiento(actor) + 1);
      await actor.update(sistema.datosAgotamiento(ag));
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
  const divino=donDivino(her,estado(actor).fuerza,nivelDe(actor));
  if (d.ac || divino.despertarAC) changes.push({ key: "system.attributes.ac.bonus", mode: 2, value: `+ ${(d.ac||0)+divino.despertarAC}` });
  if (d.nado) changes.push({ key: "system.attributes.movement.swim", mode: 4, value: String(metrosEnHoja(d.nado, actor)) });
  if (d.vuelo) changes.push({ key: "system.attributes.movement.fly", mode: 4, value: String(metrosEnHoja(d.vuelo, actor)) });
  for (const t of new Set([...(d.dr ?? []),...divino.resistencias])) changes.push({ key: "system.traits.dr.value", mode: 2, value: t });
  const min = rangoDon(actor, "sangre") >= 2 ? 10 : 1;
  const texto = D.herencias.find(h => h.nombre === her.herencia)?.despertar ?? "";
  const viejo = efectoV(actor, "despertar");
  if (viejo) await viejo.delete({ ecosSinCierre: true });
  await actor.createEmbeddedDocuments("ActiveEffect", [{ name: "Despertar del linaje", img: "systems/dnd5e/icons/svg/damage/radiant.svg",
    changes, duration: { seconds: min * 60, rounds: min * 10 }, description: `<p>${escH(texto)}</p>${resumenDivino(actor)}<p>Al terminar, 1 Agotamiento.</p>`,
    flags: { [MOD]: { [F]: { despertar: her.id } } } }]);
}

async function ponerOjo(actor, ojo) {
  const viejo = actor.effects.find(x => x.getFlag(MOD, F)?.ojo === ojo);
  if (viejo) await viejo.delete();
  const m = D.miradas.find(x => x.id === ojo);
  const etapa = Number(estado(actor).miradas?.[ojo]) || 1;
  const da = (m?.etapas ?? []).slice(0, etapa).map((t, i) => `<p><b>Etapa ${i + 1}:</b> ${escH(t)}</p>`).join("");
  await actor.createEmbeddedDocuments("ActiveEffect", [{ name: `${m?.nombre ?? "Ojo"} · abierto`, img: "systems/dnd5e/icons/svg/schools/divination.svg",
    duration: { seconds: (tieneDote(actor,"parpado-firme")||efectosDotes(actor).some(ef=>ef.ojoMinutos)?120:60), rounds: (tieneDote(actor,"parpado-firme")||efectosDotes(actor).some(ef=>ef.ojoMinutos)?20:10) }, description: `${da}<p>Mantenerlo abierto exige volver a usar «Abrir» al vencer su duración.</p>`,
    flags: { [MOD]: { [F]: { ojo,shinobi:!!D.shinobi } } } }]);
}

/** Dado extra del Despertar del linaje (técnicas de sus naturalezas). */
export function antesDelDano(config) {
  try {
    const act = config?.subject;
    const meta = act?.item?.getFlag?.(MOD, F);
    if (!meta?.id) return;
    const actor = act.actor;
    const can = estado(actor)?.canalizada;
    if (can?.id === meta.id && can.lista && can.bono?.dados) {
      const p = config.rolls?.[0]?.parts ?? [], m = String(p[0] ?? "").match(/d(\d+)/);
      p.push(`${can.bono.dados}d${m?.[1] ?? 6}`);
    }
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

/** La recuperación larga es la referencia común para Respiro y Aliento. */
export function recuperacionLargaVerbe(actor) {
  // 3.28: la reserva tarda varios días en llenarse. Base: el 15 % de la reserva más la Constitución (su modificador por
  // cada 4 niveles). Las dotes que antes subían «la mitad» a otra fracción suben en la misma proporción desde el cuarto.
  const fracDote = efectosDotes(actor).reduce((t, ef) => Math.max(t, Number(ef.rec?.largo) || 0), 0.5);
  const frac = 0.15 * (fracDote / 0.5);
  const base = recuperacionLargaCon(maxVerbe(actor), modDe(actor, "con"), nivelDe(actor), frac) + (tieneDote(actor, "aliento-soldado") ? competencia(actor) : 0)+sumaEf(actor,ef=>ef.recLargoPlano);
  return Math.floor(base * (Number(herenciaDe(actor)?.recMult) || 1));
}
export const presupuestoBreveVerbe = (actor, usado = 0, cantidad = Infinity) => presupuestoCorto(Math.min(maxVerbe(actor), recuperacionLargaVerbe(actor)), usado, cantidad, tieneDote(actor, "sueno-reparador") ? 2 / 3 : 0.5);
export function recuperacionBreve(actor, cantidad, actual = estado(actor)) {
  const valor = Number(actual?.valor) || 0;
  const falta = valor < 0 ? maxVerbe(actor) - 2 * valor - (Number(actual?.recResto) || 0) : maxVerbe(actor) - valor;
  const p = presupuestoBreveVerbe(actor, actual?.recCortos, Math.min(Math.max(0, falta), cantidad));
  return { ...cambiosRecuperacion(actor, p.cantidad, actual), recCortos: p.usado, cantidad: p.cantidad, limite: p.limite };
}
export function alDescansar(actor, ...args) { return serializarActor(actor, () => alDescansarInterno(actor, ...args)); }
async function alDescansarInterno(actor, result, config) {
  try {
    if (!despierto(actor) || !actor.isOwner) return;
    const largo = config?.type === "long";
    const intemperie = config?.type === "short" && config?.ecos?.intemperie;
    const e = estado(actor), max = maxVerbe(actor);
    // No se renuevan los poderes diarios ni los usos altos mediante una pausa corta.
    if (config?.type === "short" || largo) await guardar(actor, { reflejaUsada: false, reaccionUsada: false });
    if (!largo && !intemperie) {
      if (config?.type === "short" && efectosDotes(actor).some(ef => ef.corto) && !e.respiroUsado) {
        const { cantidad, limite, ...cambios } = recuperacionBreve(actor, competencia(actor));
        await guardar(actor, { ...cambios, respiroUsado: cantidad > 0 ? true : !!e.respiroUsado });
        aLaMesa(actor, "Respiro", `<p>${escH(actor.name)} recupera ${cantidad} Verbe: <b>${cambios.valor} / ${max}</b>. Respiro y Aliento comparten ${limite} puntos de recuperación entre largos.</p>`, { soloDueno: true });
      }
      return;
    }
    // La noche a la intemperie conserva su cuarto de reserva, dentro del mismo presupuesto breve.
    const frac = efectosDotes(actor).reduce((t, ef) => Math.max(t, Number(ef.rec?.intemperie) || 0), 0.25) / 2; // 3.27: la mitad que antes
    const rec = largo ? recuperacionLargaVerbe(actor) : Math.floor(max * frac * (Number(herenciaDe(actor)?.recMult) || 1));
    const breve = !largo ? recuperacionBreve(actor, rec) : null;
    const cambios = largo ? cambiosRecuperacion(actor, rec) : { valor: breve.valor, recResto: breve.recResto, recCortos: breve.recCortos };
    Object.assign(cambios, { reflejaUsada: false, reaccionUsada: false });
    if (largo) Object.assign(cambios, { cuotasPoder:{mayores:0,culminaciones:0,trascendentes:0},usosDote:Object.fromEntries(Object.keys(e.usosDote??{}).map(k=>[k,false])),usosFamilia: Object.fromEntries(Object.keys(e.usosFamilia ?? {}).map(id => [id,false])), recCortos: 0, reservaUsada: false, despertarLibre: false, respiroUsado: false,
      usosAltos: Object.fromEntries(Object.keys(e.usosAltos ?? {}).map(id => [id, false])),
      cerrojosHoy: { ciclo: (Number(e.cerrojosHoy?.ciclo) || 0) + 1, veces: 0 } });
    await guardar(actor, cambios);
    aLaMesa(actor, "Verbe", `<p>${escH(actor.name)} recupera Verbe ${largo ? "en el Santuario" : "a la intemperie (presupuesto breve)"}: <b>${cambios.valor} / ${max}</b>.</p>`, { soloDueno: true });
  } catch (err) { console.error(`${MOD} | capa V: descanso`, err); }
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
    if (!interno && !["capaVPedir", "capaVMetal", "capaVClones", "capaVDisipar"].includes(d.accion)) return;
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
    } else if (d.accion === "capaVClones" || d.accion === "capaVDisipar") {
      // El que pide debe ser dueño del creador (o del clon que disipa).
      let doc = null; try { doc = fromUuidSync(String(d.actorUuid ?? "")); } catch { doc = null; }
      const objetivo = doc instanceof Actor ? doc : doc?.actor ?? null;
      if (!objetivo || (!interno && !(remitente && objetivo.testUserPermission(remitente, "OWNER")))) return;
      if (d.accion === "capaVClones") await crearClones(objetivo, d);
      else await disiparClon(objetivo, { destruido: false });
    } else if (d.accion === "capaVPedir" && actor) {
      if (!["tecnica", "crear", "dote", "afinidad", "naturaleza"].includes(d.tipo) || !d.datos || typeof d.datos !== "object") return;
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
  else if (p.tipo === "naturaleza") resultado = await iniciarEntrenoNaturaleza(actor, d, { aprobado: true });
  if (resultado !== true) return false;
  await game.settings.set(MOD, AJ.pend, pend.filter(x => x.id !== pid));
  aLaMesa(actor, "Aprobado", `<p>El DM aprobó: ${escH(p.titulo ?? p.tipo)}.</p>`, { soloDueno: true });
  return true;
}

/* ------------------------------------------------------------------ */
/*  Compras: rangos, dotes, afinidad, Control, naturaleza, cultivo    */
/* ------------------------------------------------------------------ */

export function subirRango(actor, ...args) { return serializarActor(actor, () => subirRangoInterno(actor, ...args)); }
async function subirRangoInterno(actor, rama, { aprobadoYa = false } = {}) {
  if (!D.ramas.some(r => r.id === rama)) return false;
  const r = rangoDe(actor, rama);
  if (r >= ultimoRango()) return rechazar(`Ya es ${nombreRango(r)}: es el rango más alto.`);
  if (!ramaAbierta(actor, rama)) return rechazar("Esa rama está cerrada.", "warn");
  const sig = D.rangos[r + 1];
  if (nivelDe(actor) < sig.nivel) return rechazar(`${sig.nombre} pide nivel ${sig.nivel}.`, "warn");
  const c = costoRango(actor, rama, r + 1);
  const { libres } = trazos(actor);
  if (libres < c) return rechazar(`Cuesta ${c} Trazos y tiene ${libres}.`, "warn");
  if (estado(actor)?.entrenosDote?.[`rango:${rama}`]) return rechazar("Ya está entrenando ese rango: sigue en «Entrenando».", "warn");
  if (entrenarConTrazos() && !aprobadoYa) return empezarEntreno(actor, `rango:${rama}`, { nombre: `${nombreRama(rama)}: ${sig.nombre}`, plan: planRango(r + 1), trazos: c, extra: { rama, a: r + 1 },
    texto: `Empieza a entrenar ${nombreRama(rama)} ${sig.nombre} (${c} Trazos)`, mesa: `paga ${c} Trazos y empieza a entrenar el rango ${sig.nombre} en ${nombreRama(rama)}` });
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
  const declarado=requisitoDote(dote.requisitos,contextoDote(actor));if(!declarado.ok)return declarado;
  const inactiva=(dote.requisitos?.dotes??[]).find(id=>!doteActiva(actor,D.dotes.find(x=>x.id===id)));if(inactiva)return {ok:false,motivo:`Primero activa todos los requisitos de ${D.dotes.find(x=>x.id===inactiva)?.nombre??inactiva}.`};
  if(dote.requisitos?.algunaDote?.length&&!dote.requisitos.algunaDote.some(id=>tieneDote(actor,id)&&doteActiva(actor,D.dotes.find(x=>x.id===id))))return {ok:false,motivo:"Primero completa una de las sendas previas."};
  const natural = requisitoNatural(req, natsDe(actor));
  if (!natural.ok) return natural;
  if (!req) return declarado;
  const m = req.match(/nivel (\d+)/);
  if (m && nivelDe(actor) < Number(m[1])) return { ok: false, motivo: `Pide nivel ${m[1]}.` };
  if (/Control fino/.test(req) && !tieneDote(actor, "control-fino")) return { ok: false, motivo: "Pide Control fino del Verbe." };
  if (/Maestría del Control/.test(req) && !tieneDote(actor, "maestria-control")) return { ok: false, motivo: "Pide Maestría del Control." };
  if (/Naturaleza combinada/.test(req) && !tieneDote(actor, "naturaleza-combinada")) return { ok: false, motivo: "Pide Naturaleza combinada." };
  const rama = req.match(/rama ([A-Za-zÁÉÍÓÚáéíóúñ]+)(?:, (Entrenado|Experto|Maestro|Legendario|Mítico))?/);
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
  if (["control-instinto", "control-presencia"].includes(dote.id) && (tieneDote(actor, "control-instinto") || tieneDote(actor, "control-presencia"))) return { ok: false, motivo: "Ya cambió la característica de su Control del Verbe." };
  if (dote.id === "tercera-naturaleza" && natsDe(actor).size >= 3) return { ok: false, motivo: "Ya tiene tres o más naturalezas; el DM puede gestionar sus dones adicionales." };
  if (["naturaleza-combinada", "tercera-naturaleza"].includes(dote.id) && natsDe(actor).size < 2) return { ok: false, motivo: "Primero debe dominar dos naturalezas." };
  for (const parte of req.split(/[;,]/).map(x => x.trim().toLowerCase()).filter(Boolean)) {
    const previa = D.dotes.find(x => x.id !== dote.id && x.nombre.toLowerCase() === parte);
    if (previa && !tieneDote(actor, previa.id)) return { ok: false, motivo: `Pide la dote ${previa.nombre}.` };
  }
  return { ok: true, pideDM: declarado.pideDM || /maestro|brazos|trasplantada|escuela|arte de familia/.test(req) };
}

export function comprarDote(actor, ...args) { return serializarActor(actor, () => comprarDoteInterno(actor, ...args)); }
async function comprarDoteInterno(actor, id, { aprobado = false, instante = false } = {}) {
  const dote = D.dotes.find(x => x.id === id);
  if (!dote || tieneDote(actor, id)) return;
  if (estado(actor)?.entrenosDote?.[id]) return rechazar("Ya la está entrenando: sigue en la pestaña «Entrenando».", "warn");
  const req = cumpleReqDote(actor, dote);
  if (!req.ok) { aviso(req.motivo, "warn"); return false; }
  const { libres } = trazos(actor);
  if (libres < dote.trazos) return rechazar(`Cuesta ${dote.trazos} Trazos y tiene ${libres}.`, "warn");
  if (req.pideDM && !game.user.isGM) return pedirAlDM(actor, "dote", { id }, `la dote ${dote.nombre}`, `${escH(dote.nombre)} (${dote.trazos} Trazos). Pide: ${escH(dote.req)}.`);
  // 3.64 (regla del autor): las dotes que no son dones se entrenan (horas o días); un 20 natural las da al instante.
  if (!instante && ajuste("dotesEntrenadas", true) && tipoDoteDe(dote) === "entrenada") {
    const e0 = estado(actor), plan = planDote(dote.trazos), texto0 = `Empieza a entrenar la dote ${dote.nombre} (${dote.trazos} Trazos)`;
    await guardar(actor, { gastados: (Number(e0.gastados) || 0) + dote.trazos, entrenosDote: { [id]: { id, ...plan, progreso: 0, intentos: 0, trazos: dote.trazos, desde: Number(game.time?.worldTime) || 0 } },
      historial: hist(e0, texto0), compras: compra(e0, "dote", { id, entreno: true }, dote.trazos, texto0) });
    aLaMesa(actor, "✦ Empieza a entrenar", `<p>${escH(actor.name)} paga ${dote.trazos} Trazos y empieza a entrenar <b>${escH(dote.nombre)}</b>: ${escH(textoPlan(plan))}, CD ${plan.cd}. Cada bloque es una tirada; un 20 natural la aprende al instante. Sigue en la pestaña «Entrenando».</p>`);
    refrescarPanel(actor.id);
    return true;
  }
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

/** 3.64: ¿don o entrenada? (el DM puede cambiarlo a mano en el panel). */
export const tipoDoteDe = dote => tipoDotePuro(dote, ajuste("dotesTipoManual", {}) ?? {});
export async function marcarTipoDote(id, tipo) {
  if (!game.user.isGM) return false;
  const m = { ...(ajuste("dotesTipoManual", {}) ?? {}) };
  if (tipo === "auto") delete m[id]; else m[id] = tipo === "don" ? "don" : "entrenada";
  await game.settings.set(MOD, "dotesTipoManual", m);
  return true;
}
const CARS_ENTRENO = { cvb: "Control del Verbe", wis: "Sabiduría (por instinto)", str: "Fuerza", dex: "Destreza", con: "Constitución", int: "Inteligencia", cha: "Carisma" };
/** Tirada para entrenar o practicar: Control del Verbe, Sabiduría por instinto o, con guía, la característica que elija. */
async function tiradaEntreno(actor, { modo = "cvb", cd, flavor }) {
  let res;
  if (modo === "cvb") res = await sistema.tirarHabilidad(actor, "cvb", { target: cd }, {}, { data: { flavor } });
  else res = await actor.rollAbilityCheck?.({ ability: modo, target: cd }, { configure: false }, { data: { flavor } }).catch(() => null);
  const roll = Array.isArray(res) ? res[0] : res;
  if (!roll) return null;
  const natural = Number(roll.dice?.[0]?.results?.find(x => x.active)?.result ?? roll.d20?.total) || null;
  return { total: roll.total, natural };
}
async function elegirModoEntreno(titulo, texto) {
  if (!foundry.applications?.api?.DialogV2?.wait) return "cvb";
  return foundry.applications.api.DialogV2.wait({ window: { title: titulo, icon: "fa-solid fa-dumbbell" }, position: { width: 440 },
    content: `<div class="ecos-dialogo"><p>${texto}</p><label>Con qué tiras <select name="modo">${Object.entries(CARS_ENTRENO).map(([k, n]) => `<option value="${k}">${n}${["str", "dex", "con", "int", "cha"].includes(k) ? " · con guía" : ""}</option>`).join("")}</select></label>
      <p class="ecos-nota">Solo: Control del Verbe o Sabiduría (por instinto). Con un maestro o un compañero que te guía, puedes elegir otra característica.</p></div>`,
    buttons: [{ action: "ok", label: "Tirar", icon: "fa-solid fa-dice-d20", default: true, callback: (_e, b) => b.form.elements.modo.value }, { action: "no", label: "Cancelar", callback: () => null }], rejectClose: false }).catch(() => null);
}
const doteOEntreno = (actor, id) => {
  const d = D.dotes.find(x => x.id === id); if (d) return d;
  const ent = estado(actor)?.entrenosDote?.[id], [tipo, cual] = String(id).split(":");
  if (tipo === "rama") return { id, tipo, nombre: ent?.nombre ?? `Abrir la rama ${nombreRama(cual)}`, rama: cual };
  if (tipo === "rango") return { id, tipo, nombre: ent?.nombre ?? `Rango en ${nombreRama(cual)}`, rama: cual, a: ent?.a };
  if (tipo === "control") return { id, tipo, nombre: ent?.nombre ?? "Control del Verbe", v: ent?.v };
  return null;
};
export function entrenarDote(actor, id, { modo = null } = {}) { return serializarActor(actor, async () => {
  const ent = estado(actor)?.entrenosDote?.[id], dote = doteOEntreno(actor, id);
  if (!ent || !dote) return rechazar("No está entrenando esa dote.", "warn");
  const dia = diaMundo();
  if (ent.unidad === "dias" && ent.ultimoDia === dia) return rechazar("Hoy ya entrenó esta dote: mañana (en el calendario del mundo) puede seguir.", "warn");
  modo ??= await elegirModoEntreno(`Entrenar · ${dote.nombre}`, `${escH(textoPlan(ent))}, CD ${ent.cd}. Lleva ${ent.progreso}/${ent.exitos}.`);
  if (!modo) return false;
  const t = await tiradaEntreno(actor, { modo, cd: ent.cd, flavor: `Entrenar ${dote.nombre} · ${CARS_ENTRENO[modo] ?? modo} (CD ${ent.cd})` });
  if (!t) return false;
  const r = practicarDote(ent, { ...t, dia });
  if (!r.ok) return rechazar(r.motivo, "warn");
  await guardar(actor, { entrenosDote: { [id]: r.entreno } });
  aLaMesa(actor, `Entrenamiento · ${escH(dote.nombre)}`, `<p>${escH(actor.name)} saca <b>${t.total}</b> contra CD ${ent.cd}${r.instante ? " (20 natural: ¡la aprende al instante!)" : t.natural === 1 ? " (1 natural: pierde un bloque de avance)" : ""}. ${r.exito ? "Cuenta." : "No sale."} Lleva <b>${r.progreso}/${ent.exitos}</b>.</p>`, { soloDueno: true });
  if (r.terminado) await terminarEntrenoDote(actor, id, r.instante ? "20 natural" : "");
  else refrescarPanel(actor.id);
  return r;
}); }
async function terminarEntrenoDote(actor, id, nota = "") {
  const dote = doteOEntreno(actor, id), e = estado(actor);
  if (!dote || !e?.entrenosDote?.[id]) return false;
  await actor.update(Object.fromEntries([quitar(`flags.${MOD}.${F}.entrenosDote.${id}`)]));
  const e2 = estado(actor);
  if (dote.tipo === "rango") {
    const e3 = estado(actor), orden = [...new Set([...(e3.ordenRamas ?? []), dote.rama])];
    await guardar(actor, { rangos: { [dote.rama]: Math.max(rangoDe(actor, dote.rama), Number(dote.a) || 1) }, ordenRamas: orden, historial: hist(e3, `${dote.nombre}${nota ? ` · ${nota}` : ""}`) });
    await refrescar(actor); await asegurarAEDotes(actor);
    aLaMesa(actor, "✦ Rango ganado", `<p>${escH(actor.name)}: <b>${escH(dote.nombre)}</b>${nota ? ` (${escH(nota)})` : ""}.</p>`, { soloDueno: true });
    refrescarPanel(actor.id); return true;
  }
  if (dote.tipo === "control") {
    await actor.update(sistema.datosControl({ rango: Math.max(sistema.control(actor), Number(dote.v) || 1) }));
    await guardar(actor, { historial: hist(estado(actor), `${dote.nombre}${nota ? ` · ${nota}` : ""}`) });
    aLaMesa(actor, "✦ Control entrenado", `<p>${escH(actor.name)}: <b>${escH(dote.nombre)}</b>${nota ? ` (${escH(nota)})` : ""}.</p>`, { soloDueno: true });
    refrescarPanel(actor.id); return true;
  }
  if (dote.rama && !D.dotes.some(x => x.id === id)) {
    await guardar(actor, { abiertas: [...new Set([...(e2.abiertas ?? []), dote.rama])], ordenRamas: [...new Set([...(e2.ordenRamas ?? []), dote.rama])], historial: hist(e2, `Abre la rama ${nombreRama(dote.rama)}${nota ? ` · ${nota}` : ""}`) });
    aLaMesa(actor, "✦ Rama abierta", `<p>${escH(actor.name)} abre la rama <b>${escH(nombreRama(dote.rama))}</b>${nota ? ` (${escH(nota)})` : ""}: ya puede aprender sus técnicas según su rango.</p>`, { soloDueno: true });
    refrescarPanel(actor.id);
    return true;
  }
  await guardar(actor, { dotes: [...new Set([...(e2.dotes ?? []), id])], historial: hist(e2, `Termina de entrenar la dote ${dote.nombre}${nota ? ` · ${nota}` : ""}`) });
  await rasgoDote(actor, dote);
  await ajustarControl(actor);
  await asegurarAEDotes(actor);
  await refrescar(actor);
  aLaMesa(actor, "✦ Dote aprendida", `<p>${escH(actor.name)} ya domina <b>${escH(dote.nombre)}</b>${nota ? ` (${escH(nota)})` : ""}.</p>`, { soloDueno: true });
  refrescarPanel(actor.id);
  return true;
}
/** El DM la da por aprendida (un maestro, o creación de personajes). */
export function terminarDoteYa(actor, id) { if (!game.user.isGM) return Promise.resolve(false); return serializarActor(actor, () => terminarEntrenoDote(actor, id, "el DM la da por aprendida")); }
/** Dejar el entrenamiento: devuelve los Trazos. */
export function cancelarEntrenoDote(actor, id) { return serializarActor(actor, async () => {
  const e = estado(actor), ent = e?.entrenosDote?.[id], dote = doteOEntreno(actor, id);
  if (!ent) return false;
  await actor.update(Object.fromEntries([quitar(`flags.${MOD}.${F}.entrenosDote.${id}`)]));
  const e2 = estado(actor);
  await guardar(actor, { gastados: Math.max(0, (Number(e2.gastados) || 0) - (Number(ent.trazos) || 0)), historial: hist(e2, `Deja de entrenar ${dote?.nombre ?? id} (devuelve ${ent.trazos} Trazos)`) });
  refrescarPanel(actor.id);
  return true;
}); }
/** 3.64: un día de crecimiento (meditar o entrenar) para ganar Trazos. */
export function diaDeCrecimiento(actor, { actividad = "meditar", sensei = false, companero = false } = {}) { return serializarActor(actor, async () => {
  const e = estado(actor), act = ACTIVIDADES_CRECIMIENTO[actividad] ?? ACTIVIDADES_CRECIMIENTO.meditar;
  if (!e?.despierto) return rechazar("Su Verbe todavía no despertó.", "warn");
  const dia = diaMundo(), c = e.crecimiento ?? {};
  if (c.ultimoDia === dia) return rechazar("Hoy ya entrenó o meditó: mañana puede seguir.", "warn");
  const t = await tiradaEntreno(actor, { modo: act.car, cd: CD_CRECIMIENTO, flavor: `${act.nombre} · crecer en el Verbe (CD ${CD_CRECIMIENTO})` });
  if (!t) return false;
  const r = diaCrecimiento(c, { ...t, dia, nivel: nivelDe(actor), sensei, companero });
  if (!r.ok) return rechazar(r.motivo, "warn");
  await guardar(actor, { crecimiento: r.estado, ...(r.trazo ? { trazosExtra: (Number(e.trazosExtra) || 0) + 1 } : {}),
    historial: hist(e, `${act.nombre}: ${r.exito ? "avanza" : "no avanza"}${r.trazo ? " · gana 1 Trazo" : ""}`) });
  aLaMesa(actor, `${act.nombre}`, `<p>${escH(actor.name)} saca <b>${t.total}</b> contra CD ${CD_CRECIMIENTO}${t.natural === 20 ? " (20 natural: cuenta doble)" : ""}. ${r.exito ? "El día cuenta." : "Hoy no avanza."} ${r.trazo ? "<b>¡Gana 1 Trazo!</b>" : `Lleva <b>${r.puntos}/${r.meta}</b> para el próximo Trazo.`}</p>`, { soloDueno: true });
  refrescarPanel(actor.id);
  return r;
}); }

export async function ajustarControl(actor) {
  const b = (tieneDote(actor, "control-fino") ? 1 : 0) + (tieneDote(actor, "control-legendario") ? 4 : tieneDote(actor, "maestria-control") ? 2 : 0)
    + sumaEf(actor, ef => ef.control);
  const ability = tieneDote(actor, "control-instinto") ? "wis" : tieneDote(actor, "control-presencia") ? "cha" : null;
  await actor.update(sistema.datosControl({ bono: b, ability }));
}
/** 3.65: el DM fija a mano con qué característica se tira el Control del Verbe (revertir o asignar). */
export async function caracteristicaControl(actor, ability) {
  if (!game.user.isGM || !["int", "wis", "cha"].includes(ability)) return false;
  await actor.update(sistema.datosControl({ ability }));
  return true;
}

export function comprarControl(actor, ...args) { return serializarActor(actor, () => comprarControlInterno(actor, ...args)); }
async function comprarControlInterno(actor) {
  const v = sistema.control(actor);
  if (v >= 2) return rechazar("Ya tiene pericia en Control.");
  const costo = v === 0 ? 2 : 3;
  if (v === 1 && nivelDe(actor) < 5) return rechazar("La pericia en Control pide nivel 5.", "warn");
  const { libres } = trazos(actor);
  if (libres < costo) return rechazar(`Cuesta ${costo} Trazos y tiene ${libres}.`, "warn");
  if (estado(actor)?.entrenosDote?.["control:cvb"]) return rechazar("Ya está entrenando su Control: sigue en «Entrenando».", "warn");
  if (entrenarConTrazos()) return empezarEntreno(actor, "control:cvb", { nombre: `Control del Verbe: ${v === 0 ? "competencia" : "pericia"}`, plan: planControl(v + 1), trazos: costo, extra: { v: v + 1 },
    texto: `Empieza a entrenar el Control (${v === 0 ? "competencia" : "pericia"}, ${costo} Trazos)`, mesa: `paga ${costo} Trazos y empieza a entrenar su Control del Verbe (${v === 0 ? "competencia" : "pericia"})` });
  const e = estado(actor);
  const texto = `Control: ${v === 0 ? "competencia" : "pericia"} (${costo} Trazos)`;
  await guardar(actor, { gastados: (Number(e.gastados) || 0) + costo, historial: hist(e, texto), compras: compra(e, "control", { v: v + 1 }, costo, texto) },
    sistema.datosControl({ rango: v + 1 }));
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
  if (!game.user.isGM) return pedirAlDM(actor, "afinidad", { nat }, `afinidad ${a === 1 ? "Entrenada" : "Maestra"} en ${NATS[nat]}`, `Pide un maestro de ${NATS[nat]}. Cuesta ${costo} Trazos.`);
  const texto = `Afinidad ${NATS[nat]} ${a === 1 ? "Entrenada" : "Maestra"} (${costo} Trazos)`;
  await guardar(actor, { afinidad: { [nat]: a + 1 }, gastados: (Number(e.gastados) || 0) + costo, historial: hist(e, texto),
    compras: compra(e, "afinidad", { nat, a: a + 1 }, costo, texto) });
  await refrescar(actor);
  return true;
}

/** Probar una técnica de una naturaleza que no tiene: si es su oculta, la descubre. No gasta nada. */
/* ---------- Etapas del Verbe y descubrimiento de la naturaleza (2.1) ---------- */
/** El DM abre la siguiente etapa (o vuelve a una anterior) cuando el personaje encuentra quién le enseñe. */
export function cambiarEtapa(actor, delta = 1, quien = "") { return serializarActor(actor, () => cambiarEtapaInterno(actor, delta, quien)); }
async function cambiarEtapaInterno(actor, delta, quien) {
  if (!game.user.isGM || !despierto(actor)) return false;
  const e = estado(actor), antes = etapaDe(e), despues = Math.max(1, Math.min(ETAPA_MAX, antes + Math.sign(Number(delta) || 0)));
  if (despues === antes) return rechazar(antes >= ETAPA_MAX ? "Ya está en la última etapa." : "Ya está en la primera etapa.", "warn");
  const nota = String(quien ?? "").trim().slice(0, 120);
  const et = datosEtapa(despues);
  await guardar(actor, { etapa: despues, maestros: [...(e.maestros ?? []), { etapa: despues, quien: nota, fecha: new Date().toISOString() }].slice(-20),
    historial: hist(e, `Etapa ${et.nombre}${nota ? ` (le enseña ${nota})` : ""}`) });
  aLaMesa(actor, `✦ ${despues > antes ? "Se abre una etapa" : "Vuelve a una etapa"} del Verbe`, `<p>${nota && despues > antes ? `Con la guía de <b>${escH(nota)}</b>, el` : "El"} Verbe de ${escH(actor.name)} llega a la etapa <b>${et.nombre}</b>. ${escH(et.texto)}</p>`, { soloDueno: true });
  refrescarPanel(actor.id);
  return true;
}
/** Estado del descubrimiento de naturaleza para el panel. */
export function estadoDescubrimiento(actor) {
  const e = estado(actor) ?? {};
  // En modo visible la primera se elige en Inicio; solo la segunda se descubre entrenando.
  const tipo = modoNaturaleza(e) === "visible" && !natsDe(actor).size ? null : siguienteDescubrimiento(e, { conocidas: natsDe(actor).size });
  const req = requisitoDescubrir(e, { tipo, nivel: nivelDe(actor), rangoForma: rangoDe(actor, "forma") });
  const entreno = e.entrenoNat ?? null;
  return { tipo, req, entreno, faltan: diasRestantes(entreno, game.time?.worldTime ?? 0), elegir: e.elegirNat ?? null, modo: modoNaturaleza(e) };
}
/** Empieza el entrenamiento (lo aprueba el DM): días de reloj del mundo y luego una prueba de Control del Verbe. */
async function iniciarEntrenoNaturaleza(actor, d = {}, { aprobado = false } = {}) {
  const e = estado(actor);
  const tipo = d.tipo === "cambio" ? "cambio" : siguienteDescubrimiento(e, { conocidas: natsDe(actor).size });
  const base = tipo === "cambio" ? { ok: conoce(actor, "forma-cambiar-naturaleza") && !e.entrenoNat, motivo: "Pide saber «Cambiar naturaleza del Verbe» y no estar entrenando.", ...DESCUBRIR.cambio }
    : requisitoDescubrir(e, { tipo, nivel: nivelDe(actor), rangoForma: rangoDe(actor, "forma") });
  if (!base.ok) return rechazar(base.motivo, "warn");
  if (base.trazos && trazos(actor).libres < base.trazos) return rechazar(`Cuesta ${base.trazos} Trazos y tiene ${trazos(actor).libres}.`, "warn");
  if (tipo === "cambio" && !(natsDe(actor).has(d.de) && NATS[d.a] && !natsDe(actor).has(d.a))) return rechazar("Elige una naturaleza tuya y otra que no tengas.", "warn");
  if (!game.user.isGM || !aprobado) return pedirAlDM(actor, "naturaleza", { tipo, de: d.de ?? null, a: d.a ?? null },
    tipo === "cambio" ? `cambiar ${NATS[d.de]} por ${NATS[d.a]}` : `entrenar para descubrir ${DESCUBRIR[tipo].nombre}`,
    `${base.dias} días de entrenamiento y una prueba de Control del Verbe CD ${base.cd}${base.trazos ? `. Si la supera, paga ${base.trazos} Trazos` : ""}.`);
  const ahora = Number(game.time?.worldTime) || 0;
  await guardar(actor, { entrenoNat: { tipo, cd: base.cd, trazos: base.trazos, dias: base.dias, desde: ahora, hasta: ahora + base.dias * 86400, de: d.de ?? null, a: d.a ?? null },
    historial: hist(e, `Empieza a entrenar: ${tipo === "cambio" ? "cambiar de naturaleza" : DESCUBRIR[tipo].nombre} (${base.dias} días)`) });
  aLaMesa(actor, "✦ Entrenamiento del Verbe", `<p>${escH(actor.name)} empieza a entrenar ${tipo === "cambio" ? "para cambiar su naturaleza" : `para descubrir ${DESCUBRIR[tipo].nombre}`}: <b>${base.dias} días</b> (avanzan con el calendario del mundo). Después, una prueba de Control del Verbe CD ${base.cd}.</p>`, { soloDueno: true });
  refrescarPanel(actor.id);
  return true;
}
export function pedirDescubrimiento(actor, d = {}) { return serializarActor(actor, () => iniciarEntrenoNaturaleza(actor, d, { aprobado: game.user.isGM })); }
/** El DM da por terminados los días (si no se usa el calendario). */
export async function terminarEntrenoYa(actor) {
  if (!game.user.isGM) return false;
  const e = estado(actor); if (!e?.entrenoNat) return false;
  await guardar(actor, { entrenoNat: { ...e.entrenoNat, hasta: Number(game.time?.worldTime) || 0 } });
  refrescarPanel(actor.id);
  return true;
}
/** Resuelve un resultado de la prueba. Pura en lo posible: la usa la prueba y el DM. */
async function resolverEntreno(actor, total) {
  const e = estado(actor), en = e.entrenoNat;
  if (!en) return false;
  const exito = Number(total) >= Number(en.cd);
  if (!exito) {
    await guardar(actor, { entrenoNat: null, intentosNat: (Number(e.intentosNat) || 0) + 1, historial: hist(e, `No supera la prueba (${total} contra CD ${en.cd})`) });
    aLaMesa(actor, "El Verbe no responde todavía", `<p>${escH(actor.name)} saca ${total} contra CD ${en.cd}. No gasta Trazos; puede volver a entrenar cuando el DM lo apruebe.</p>`, { soloDueno: true });
    refrescarPanel(actor.id);
    return false;
  }
  const cambios = { entrenoNat: null, gastados: (Number(e.gastados) || 0) + (Number(en.trazos) || 0) };
  let texto;
  if (en.tipo === "cambio") {
    cambios.nats = (e.nats ?? []).map(n => (n === en.de ? en.a : n));
    cambios.natsExtra = (e.natsExtra ?? []).map(n => (n === en.de ? en.a : n));
    if (ocultaDe(actor) === en.de && e.descubierta) cambios.oc = revolver(en.a, actor.id);
    texto = `Cambia su naturaleza: ${NATS[en.de]} por ${NATS[en.a]}`;
  } else if ((en.tipo === "primera" && modoNaturaleza(e) === "dado") || (en.tipo === "segunda" && modoSegunda(e) === "dado")) {
    // 3.27: la naturaleza la decide un dado que tira el jugador.
    cambios.tirarNat = en.tipo;
    texto = `Descubre ${DESCUBRIR[en.tipo].nombre}: la tira con un dado`;
  } else if (modoNaturaleza(e) === "elige") {
    cambios.elegirNat = en.tipo;
    texto = `Descubre ${DESCUBRIR[en.tipo].nombre}: la elige`;
  } else if (en.tipo === "primera") {
    const nat = ocultaPrimeraDe(actor) ?? Object.keys(NATS)[Math.floor(Math.random() * 5)];
    cambios.nats = [nat];
    if (ocultaDe(actor) === nat) cambios.oc = revolver(otraNat(nat), actor.id);
    texto = `Descubre su naturaleza: ${NATS[nat]}`;
  } else {
    cambios.descubierta = true;
    texto = `Descubre su segunda naturaleza: ${NATS[ocultaDe(actor)] ?? "—"}`;
  }
  cambios.historial = hist(e, `${texto} (${total} contra CD ${en.cd}${en.trazos ? `, ${en.trazos} Trazos` : ""})`);
  if (en.trazos) cambios.compras = compra(e, "naturaleza", { tipo: en.tipo }, en.trazos, texto);
  await guardar(actor, cambios);
  aLaMesa(actor, "✦ El Verbe responde", `<p>${escH(actor.name)} saca ${total} contra CD ${en.cd}. ${cambios.tirarNat ? "Su Verbe se abre a un elemento: <b>tira tu dado de naturaleza en tu panel</b> (Inicio)." : cambios.elegirNat ? "Su Verbe se abre a un elemento: <b>elígelo en su panel</b> (Mejorar → Tus elementos)." : escH(texto) + "."}</p>`, { soloDueno: true });
  await asegurarRasgos(actor);
  await refrescar(actor);
  return true;
}
/** Al terminar los días: tira Control del Verbe (con la ventana nativa) y resuelve. */
export function pruebaEntreno(actor) { return serializarActor(actor, async () => {
  const e = estado(actor), en = e?.entrenoNat;
  if (!en) return false;
  if (diasRestantes(en, game.time?.worldTime ?? 0) > 0) return rechazar(`Faltan ${diasRestantes(en, game.time?.worldTime ?? 0)} días de entrenamiento.`, "warn");
  const r = await sistema.tirarHabilidad(actor, "cvb", { target: en.cd }, {}, { data: { flavor: `Control del Verbe · entrenamiento (CD ${en.cd})` } });
  const roll = Array.isArray(r) ? r[0] : r;
  if (!roll) return false;
  return resolverEntreno(actor, roll.total);
}); }
/**
 * 3.27: el jugador tira su naturaleza. Un dado con tantas caras como naturalezas le quedan (d5 la primera, d4 la
 * segunda); el chat muestra qué número es cada una. Solo vale si el entrenamiento lo dejó pendiente (o lo da el DM).
 */
export function tirarNaturaleza(actor) { return serializarActor(actor, async () => {
  const e = estado(actor), tipo = e?.tirarNat;
  if (!tipo) return rechazar("No hay ninguna naturaleza pendiente de tirar.", "warn");
  const lista = Object.keys(NATS).filter(n => !natsDe(actor).has(n));
  if (!lista.length) return false;
  const r = await new Roll(`1d${lista.length}`).evaluate();
  const nat = naturalezaPorDado(lista, r.total);
  await r.toMessage({ speaker: ChatMessage.getSpeaker({ actor }), flavor: `<b>${tipo === "primera" ? "Naturaleza del Verbe" : "Segunda naturaleza"}</b> · 1d${lista.length}: ${lista.map((n, i) => `${i + 1} ${NATS[n]}`).join(" · ")} → <b>${NATS[nat]}</b>` });
  const cambios = { tirarNat: null };
  if (tipo === "primera") {
    cambios.nats = [nat];
    if (ocultaDe(actor) === nat) cambios.oc = revolver(otraNat(nat), actor.id);
  } else { cambios.oc = revolver(nat, actor.id); cambios.descubierta = true; }
  cambios.historial = hist(e, `Tira su ${tipo === "primera" ? "naturaleza" : "segunda naturaleza"}: ${NATS[nat]} (1d${lista.length} = ${r.total})`);
  await guardar(actor, cambios);
  aLaMesa(actor, "✦ El Verbe responde", `<p>El Verbe de ${escH(actor.name)} se abre a <b>${NATS[nat]}</b>.</p>`, { soloDueno: true });
  await asegurarRasgos(actor);
  await refrescar(actor);
  return nat;
}); }
/** El DM deja pendiente la tirada de naturaleza (sin entrenamiento), o la quita. */
export async function pedirTiradaNaturaleza(actor, tipo = null) {
  if (!game.user.isGM || !despierto(actor)) return false;
  const t = tipo ?? (natsDe(actor).size ? "segunda" : "primera");
  await guardar(actor, { tirarNat: t });
  aLaMesa(actor, "✦ Tu naturaleza", `<p>${escH(actor.name)}: tira tu ${t === "primera" ? "naturaleza" : "segunda naturaleza"} en tu panel del Verbe (Inicio).</p>`, { soloDueno: true });
  refrescarPanel(actor.id);
  return true;
}

/* ---------- 3.27: aprender por días ---------- */
/** Ajuste del mundo: ¿se aprende por días? (si no, al pagar como antes). Y por personaje, el DM puede ponerlo «al instante». */
const aprenderPorDias = actor => ajuste("verbeAprenderDias", true) && !estado(actor)?.aprenderAlInstante;
export const estudioDe = (actor, id) => estado(actor)?.estudios?.[id] ?? null;
/** Termina un estudio: la técnica pasa a «Mis técnicas» (los Trazos ya se pagaron al empezar). */
async function terminarEstudio(actor, id, nota = "") {
  const e = estado(actor), est = e.estudios?.[id];
  const tec = tecnicaPorId(id, actor);
  if (!est || !tec) return false;
  const data = datosItem(actor, tec);
  data.sort = (tec.g * 100000) + (itemsTecnica(actor).length * 10);
  await actor.createEmbeddedDocuments("Item", [data], { keepEmbeddedIds: true });
  await actor.update(Object.fromEntries([quitar(`flags.${MOD}.${F}.estudios.${id}`)]));
  await guardar(actor, { historial: hist(estado(actor), `Termina de aprender ${tec.n}${nota ? ` · ${nota}` : ""}`) });
  aLaMesa(actor, "✦ Técnica aprendida", `<p>${escH(actor.name)} ya domina <b>${escH(tec.n)}</b>${nota ? ` (${escH(nota)})` : ""}. Está en «Mis técnicas».</p>`, { soloDueno: true });
  refrescarPanel(actor.id);
  return true;
}
/** La práctica del día: Control del Verbe contra la CD del estudio. Una por técnica y por día del mundo. */
export function practicarEstudio(actor, id, { modo = null } = {}) { return serializarActor(actor, async () => {
  const est = estudioDe(actor, id), tec = tecnicaPorId(id, actor);
  if (!est || !tec) return rechazar("No está estudiando esa técnica.", "warn");
  const dia = diaMundo();
  if (est.ultimoDia === dia) return rechazar("Hoy ya practicó esta técnica: mañana (en el calendario del mundo) puede seguir.", "warn");
  // 3.65 (regla del autor): se aprende con Control, con Sabiduría por instinto o, con guía, con la característica elegida.
  modo ??= game.user ? await elegirModoEntreno(`Practicar · ${tec.n}`, `CD ${est.cd}. Lleva ${est.progreso}/${est.exitos} días buenos.`) : "cvb";
  if (!modo) return false;
  const tir = await tiradaEntreno(actor, { modo, cd: est.cd, flavor: `Practicar ${tec.n} · ${CARS_ENTRENO[modo] ?? modo} (CD ${est.cd}) · día ${(Number(est.dias) || 0) + 1}` });
  if (!tir) return false;
  const roll = { total: tir.total }, natural = tir.natural;
  const r = practicar(est, { total: roll.total, natural, dia });
  if (!r.ok) return rechazar(r.motivo, "warn");
  await guardar(actor, { estudios: { [id]: r.estudio } });
  const cuenta = `${r.progreso}/${est.exitos} días buenos`;
  aLaMesa(actor, `Práctica · ${escH(tec.n)}`, `<p>${escH(actor.name)} saca <b>${roll.total}</b> contra CD ${est.cd}${natural === 20 ? " (20 natural: cuenta doble)" : natural === 1 ? " (1 natural: pierde un día de avance)" : ""}. ${r.exito ? "El día cuenta." : "Hoy no sale."} Lleva <b>${cuenta}</b>.</p>`, { soloDueno: true });
  if (r.terminado) await terminarEstudio(actor, id);
  else refrescarPanel(actor.id);
  return r;
}); }
/** El DM la da por aprendida ya (creación de personajes de más nivel, o un maestro que acelera). */
export function aprenderYa(actor, id) {
  if (!game.user.isGM) return Promise.resolve(false);
  return serializarActor(actor, () => terminarEstudio(actor, id, "el DM la da por aprendida"));
}

/** Abre un diario del mundo (y una de sus páginas) por su nombre; avisa si no existe en este mundo. */
function abrirDiarioPorNombre(nombre, pagina = null) {
  const j = game.journal?.getName?.(nombre) ?? game.journal?.find?.(x => x.name === nombre);
  if (!j) return aviso(`No encuentro el diario «${nombre}» en este mundo.`, "warn");
  const p = pagina ? j.pages?.getName?.(pagina) ?? j.pages?.find?.(x => x.name === pagina) : null;
  return j.sheet?.render(true, p ? { pageId: p.id } : {});
}
export function probarNaturaleza(actor, tec) { return serializarActor(actor, () => probarNaturalezaInterno(actor, tec)); }
async function probarNaturalezaInterno(actor, tec) {
  const e = estado(actor);
  if (!e || !NATS[tec?.nat] || natsDe(actor).size >= 2 || natsDe(actor).has(tec.nat)) return false;
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
  const opcion = opcionesCultivo(base, cul, costoUso(actor, base, base.g),{dados: dadosExtra(actor,base.item.flags[MOD][F]),tope:limiteDadosExtra(base.g),minimo:pisoCosto(base.g,D.costo),cdUsada:cdCultivo(actor,base,cul)}).find(o => o.id === mejora);
  if (!opcion?.ok) return rechazar(opcion?.motivo ?? "Esta mejora no tiene efecto en la técnica.");
  if (cul.nivel >= 3 && !gratis) return rechazar("Ya es Propia.");
  const cultivadas = Object.entries(e.cultivos ?? {}).filter(([id, c]) => c.nivel > 0 && !esDerivada(actor, id)).length;
  if (cul.nivel === 0 && !esDerivada(actor, tecId) && cultivadas >= competencia(actor)+sumaEf(actor,ef=>ef.cultivosExtra)) return rechazar(`Cultiva tantas técnicas como su competencia (${competencia(actor)}).`, "warn");
  if (mejora === "rapida" && cul.mejoras.includes("rapida")) return rechazar("La mejora de tiempo va una sola vez.", "warn");
  if (mejora === "infusion" && !infusionFija) return rechazar("Elige la naturaleza de la infusión fija.", "warn");
  const costo = opcion.costo;
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
  const banco = costo ? await gastarBancoClones(actor, dias) : null;
  aLaMesa(actor, "Cultivo", `<p>${escH(actor.name)} cultiva <b>${escH(tec?.n ?? tecId)}</b>: ${NIVEL_CULTIVO[cul.nivel]}${costo ? `. El DM debe haber resuelto ${dias} día${dias === 1 ? "" : "s"} de entrenamiento; el panel no adelanta el calendario` : ""}.${banco?.usa ? ` ${banco.usa} de esos días ya los entrenaron sus clones (le quedan ${banco.queda} guardados).` : ""}</p>`, { soloDueno: true });
}

export async function infundir(actor, tecId, nat) {
  const tec = tecnicaPorId(tecId, actor);
  if (!editarActor(actor) || !tec || !conoce(actor, tecId) || !INFUNDIBLES.has(tec.sec)) return false;
  if (nat && !natsDe(actor).has(nat) && !combosDe(actor).has(nat)) return rechazar("No tiene esa naturaleza.", "warn");
  await actor.update(nat ? { [`flags.${MOD}.${F}.infusiones.${tecId}`]: nat } : Object.fromEntries([quitar(`flags.${MOD}.${F}.infusiones.${tecId}`)]));
  await refrescar(actor);
}

export function reorientarCultivo(actor,tecId,mejora){
  if(!game.user.isGM)return Promise.resolve(false);
  return serializarActor(actor,async()=>{
    const e=estado(actor),t=tecnicaPorId(tecId,actor),cul=foundry.utils.deepClone(e.cultivos?.[tecId]);
    if(!t||!cul?.mejoras?.length||!MEJORAS[mejora])return false;
    const compras=foundry.utils.deepClone(e.compras??[]),c=[...compras].reverse().find(c=>c.tipo==='cultivo'&&c.datos?.tecId===tecId);
    if(!c)return rechazar('Falta el registro original del cultivo; revísalo en el historial antes de cambiarlo.');
    const desde=cul.mejoras.lastIndexOf(c.datos.mejora);if(desde<0)return false;
    cul.mejoras.splice(desde,1);
    const meta=t.item.flags[MOD][F];
    const brutos=dadosExtraBrutos(actor,meta)-Number(c.datos.mejora==='dado');
    const opcion=opcionesCultivo(t,cul,costoUso(actor,meta,t.g),{dados:Math.min(limiteDadosExtra(t.g),brutos),tope:limiteDadosExtra(t.g),minimo:pisoCosto(t.g,D.costo),cdUsada:cdCultivo(actor,t,cul)}).find(o=>o.id===mejora);
    if(!opcion?.ok)return rechazar(opcion?.motivo??'La mejora no es compatible.');
    cul.mejoras.splice(desde,0,mejora);if(c.datos.mejora==='infusion')delete cul.infusionFija;
    c.datos.mejora=mejora;c.texto=`Cultivo reorientado: ${t.n}, ${MEJORAS[mejora]} (${c.trazos} Trazos originales)`;
    await guardar(actor,{cultivos:{[tecId]:cul},compras,historial:hist(e,`Reorienta ${t.n}: ${MEJORAS[mejora]}; sin nuevo cargo.`)});
    await refrescar(actor);return true;
  });
}

/** Monedas Antiguas: recuperar Verbe o volverlas Trazos (como mucho 2 por nivel). */
export function gastarMoneda(actor, ...args) { return serializarActor(actor, () => gastarMonedaInterno(actor, ...args)); }
async function gastarMonedaInterno(actor, uso) {
  const n = sistema.moneda(actor);
  if (n < 1) return rechazar("No tiene Monedas Antiguas.", "warn");
  const e = estado(actor);
  if (uso === "trazo") {
    const nivel = nivelDe(actor);
    const ya = Number(e.monedas?.[nivel]) || 0;
    if (ya >= TRAZOS_POR_NIVEL) return rechazar(`En este nivel ya volvió Trazos ${TRAZOS_POR_NIVEL} Monedas.`, "warn");
    await guardar(actor, { trazosExtra: (Number(e.trazosExtra) || 0) + 1, monedas: { [nivel]: ya + 1 }, historial: hist(e, "Una Moneda Antigua se vuelve 1 Trazo"),
      compras: compra(e, "moneda", { nivel }, 0, "Una Moneda Antigua se vuelve 1 Trazo") }, sistema.datosMoneda(n - 1));
    return aLaMesa(actor, "Moneda Antigua", `<p>${escH(actor.name)} vuelve Trazo una Moneda Antigua.</p>`, { soloDueno: true });
  }
  const max = maxVerbe(actor);
  const mult = efectosDotes(actor).reduce((t, ef) => Math.max(t, Number(ef.moneda) || 0), 2);
  const cambios = cambiosRecuperacion(actor, mult * competencia(actor));
  const { valor } = cambios;
  await guardar(actor, { ...cambios, historial: hist(e, `Una Moneda Antigua aporta ${mult * competencia(actor)} de recuperación de Verbe`) }, sistema.datosMoneda(n - 1));
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
const ESCUELA = { umbral: "vum", vasija: "vva", forma: "vfo", velo: "vve", cuerpo: "vcu", mirada: "vmi", sello: "vse", pacto: "vpa", pulso: "vpu", hilo: "vhi",
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
    max = Math.min(topeRama(actor,f.rama), (base?.g ?? 0) + (f.modo === "evolucion" ? 3 : 2));
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
  if (Number(f.dadosN) > 0) partes.push({ number: Number(f.dadosN), denomination: Number(f.dadosD) || 6, bonus: Number(f.bono) ? String(Number(f.bono)) : "", types: [DANO[f.tipoDano] ?? "force"],
    custom: { enabled: false, formula: "" }, scaling: { mode: Number(f.escaladoDados ?? 1) ? "whole" : "", number: Number(f.escaladoDados ?? 1), formula: "" } });
  const act = { _id: aid, sort: 0, name: "", activation: { override: false }, duration: { override: false }, range: { override: false },
    target: { override: false, prompt: true }, effects: [], uses: { spent: 0, recovery: [] }, description: { chatFlavor: "" },
    consumption: { targets: [], scaling: { allowed: g > 0, max: "" }, spellSlot: false } };
  if (f.tipoActividad === "healing") Object.assign(act, { type: "heal", healing: { ...(partes[0] ?? { number: 0, denomination: 6, bonus: "", custom: { enabled: false, formula: "" }, scaling: { mode: "", number: 0 } }), types: ["healing"] } });
  else if (f.tirada === "ataque") Object.assign(act, { type: "attack", attack: { ability: "", bonus: "", critical: { threshold: null }, flat: false,
    type: { value: (f.alcance === "toque") ? "melee" : "ranged", classification: "spell" } }, damage: { critical: { bonus: "" }, includeBase: false, parts: partes } });
  else if (SALV[f.tirada]) Object.assign(act, { type: "save", save: { ability: [SALV[f.tirada]], dc: { calculation: "spellcasting", formula: "" } },
    damage: { onSave: f.mitad ? "half" : "none", parts: partes } });
  else if (partes.length) Object.assign(act, { type: "damage", damage: { critical: { allow: false }, parts: partes } });
  else Object.assign(act, { type: "utility", roll: { formula: "", name: "", prompt: false, visible: false } });
  const nat = f.nat || null;
  const rango = f.alcance === "yo" ? { units: "self" } : f.alcance === "toque" ? { units: "touch" } : { units: "m", value: Number(f.alcance) || 9 };
  const tplTipo = { cono: "cone", esfera: "sphere", cubo: "cube", línea: "line", cilindro: "cylinder" }[f.areaTipo];
  const efs = [];
  for (const st of (nat && partes.length && g >= 1 && f.tipoActividad !== "healing") ? (ESTADO_NAT[nat] ?? []) : []) {
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
    usa: { cuerpo: "fisica", hilo: "fisica", quietud: "wis", rastro: "wis" }[f.rama] ?? "verbe", propia: true, autor: actor.id, ...(f.usa ? { usa: f.usa } : {}) };
  const item = {
    name: f.nombre || "Técnica sin nombre", type: "spell", img: base?.item?.img ?? "systems/dnd5e/icons/svg/items/spell.svg", effects: efs,
    system: {
      description: { value: `<p><em>Grado ${g} · ${nombreRama(f.rama)}${nat ? ` · ${nombreNat(nat)}` : ""} · ${escH(origen)}, de ${escH(actor.name)}</em></p><p>${escH(texto)}</p>`, chat: "" },
      level: g, school: ESCUELA[f.rama] ?? "vfo", method: "verbe", prepared: 2, activation: { type: at, value: av, condition: String(f.disparador ?? "") },
      duration: { units: du, value: dv }, range: rango, properties: props,
      target: tplTipo ? { template: { type: tplTipo, size: Number(f.areaTam) || 3, units: "m" }, affects: { type: "creature" } } : { affects: { count: String(Number(f.blancos) || 1), type: f.alcance === "yo" ? "self" : "creature" }, template: {} },
      uses: g >= 6 ? { max: "1", spent: 0, recovery: [{ period: "lr", type: "recoverAll" }] } : { max: "", spent: 0, recovery: [] },
      activities: { [aid]: act }, identifier: id, source: { custom: "El Verbe · técnica propia" }
    },
    flags: { [MOD]: { [F]: meta } }
  };
  const alc = f.alcance === "yo" ? "yo" : f.alcance === "toque" ? "toque" : aPiesTexto(`${f.alcance} m`);
  const uso = [f.tiempo, alc, tplTipo ? `${f.areaTipo} ${f.areaTam} m` : null, f.duracion].filter(Boolean).join(" · ");
  return { id, n: item.name, rama: f.rama, sec, g, nat, rara: combo, req: null, incl: false, grupo: null, trazos: trazosN, costo: costoGrado(g),
    t: f.tiempo, alc, dur: `${f.conc ? "C " : ""}${f.duracion || "inst."}`, comp: [f.voz ? "V" : "", f.gestos ? "G" : ""].filter(Boolean).join(""), area: tplTipo ? `${f.areaTipo} ${f.areaTam} m` : null,
    tir: f.tirada === "ninguna" ? null : f.tirada, dmg: partes.length ? `${f.dadosN}d${f.dadosD}${Number(f.bono) ? ` + ${Number(f.bono)}` : ""}` : null, mitad: !!f.mitad, sube: Number(f.escaladoDados ?? 1) ? `+${f.escaladoDados ?? 1}d` : null, veces: 1,
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
    const aprendida = await aprender(actor, tec, { nota: tec.modo ?? "creada", aprobado: true, instantaneo: true });
    if (aprendida !== true) { await retirar(); return false; }
  } catch (error) {
    await retirar();
    throw error;
  }
  if (tec.modo === "evolucion") await guardar(actor, { cultivos: { [tec.id]: { nivel: 1, mejoras: [], pendiente: 1 } } });
  const dias = Math.max(0.5, tec.g) * (tec.modo === "variante" ? 0.5 : 1);
  const banco = await gastarBancoClones(actor, dias);
  aLaMesa(actor, "✦ Técnica nueva", `<p>${escH(actor.name)} aprende <b>${escH(tec.n)}</b> (grado ${tec.g}). El DM confirma ${dias} día${dias === 1 ? "" : "s"} de entrenamiento${tec.modo ? "" : ` y ${Math.max(1, tec.g) * 25} o de materiales`} resueltos en la mesa. El panel no descuenta ese oro ni adelanta el calendario.${banco?.usa ? ` ${banco.usa} de esos días ya los entrenaron sus clones (le quedan ${banco.queda} guardados).` : ""}${tec.modo === "evolucion" ? " Nace Pulida: elige su mejora en Cultivo." : ""}</p>`, { soloDueno: true });
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
    <label>Alcance <select name="alcance">${opciones([["yo", "Yo"], ["toque", "Toque"], ["9", "30 ft"], ["18", "60 ft"], ["36", "120 ft"], ["45", "150 ft"], ["90", "300 ft"], ["150", "500 ft"], ["1500", "1,5 km"]], "18")}</select></label>
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

/** Estados que el editor puede enlazar a una actividad nativa. */
const estadosEditor = () => [...new Set([...Object.keys(ESTADOS), ...((CONFIG.statusEffects ?? []).map(e => e.id).filter(Boolean))])];
export function revisarUniversal(datos) {
  const f = { ...FORMULARIO_UNIVERSAL, ...datos };
  f.estados = Array.isArray(f.estadosElegidos) ? new Set([...f.estadosElegidos, ...((Number(f.dadosN)>0 && f.tipoActividad !== "healing") ? ESTADO_NAT[f.nat] ?? [] : [])]).size : 0;
  return validarUniversal(f, { ramas: D.ramas.map(r=>r.id), naturalezas: [...Object.keys(NATS),...Object.keys(D.combos)],
    estados: estadosEditor(), propuesta: presupuesto(f), validarBalance: validarCreacion });
}
export function publicarTecnicaUniversal(datos, id = null) {
  if (!game.user.isGM) return Promise.resolve(false);
  return enSerie("catalogo", async () => {
    const f = { ...FORMULARIO_UNIVERSAL, ...foundry.utils.deepClone(datos) };
    f.estados = new Set([...(f.estadosElegidos ?? []), ...((Number(f.dadosN)>0 && f.tipoActividad !== "healing") ? ESTADO_NAT[f.nat] ?? [] : [])]).size;
    const revision = revisarUniversal(f);
    if (!Object.hasOwn(DANO, f.tipoDano)) revision.errores.push("Tipo de daño no válido.");
    if (f.previa && !tecnicaPorId(f.previa)) revision.errores.push("La técnica previa no existe.");
    if (f.previa && f.previa === id) revision.errores.push("Una técnica no puede ser su propio requisito.");
    if (revision.errores.length) return rechazar(revision.errores.join(" "));
    const anterior = id ? extraMundo().find(t=>t.id===id) : null;
    if (id && !anterior) return rechazar("Solo se editan técnicas adicionales. Duplica una del catálogo original para crear otra.");
    const t = tecnicaNueva({ id: "catalogo-dm", name: "Catálogo del DM" }, f);
    t.id = anterior?.id ?? `dm-${foundry.utils.randomID(12)}`;
    t.item.system.identifier = t.id;
    t.propia = false; t.universal = true; t.autor = game.user.id;
    t.trazos = Number(f.trazos); t.nivelMin = Number(f.nivelMin); t.previa = f.previa || null;
    t.req = f.req || null; t.retirada = anterior?.retirada ?? false;
    t.definicionUniversal = f;
    const meta = t.item.flags[MOD][F];
    Object.assign(meta, { id: t.id, propia: false, universal: true, autor: game.user.id, req: t.req });
    if (f.costoBase !== "") { meta.costoBase = Number(f.costoBase); t.costoBase = meta.costoBase; t.costo = meta.costoBase; }
    const viejoAct = Object.values(anterior?.item?.system?.activities ?? {})[0];
    const act = Object.values(t.item.system.activities)[0];
    if (viejoAct?._id) { act._id = viejoAct._id; t.item.system.activities = { [act._id]: act }; }
    for (const st of f.estadosElegidos) {
      if (t.item.effects.some(e=>e.statuses?.includes(st))) continue;
      const anteriorEf = anterior?.item?.effects?.find(e=>e.statuses?.includes(st));
      const eid = anteriorEf?._id ?? foundry.utils.randomID();
      const cfg = CONFIG.statusEffects?.find(e=>e.id===st);
      const ef = ESTADOS[st] ? efectoEstado(st,eid) : { _id:eid, name:cfg?.name ?? st, img:cfg?.img ?? t.item.img,
        statuses:[st], transfer:false, disabled:false, changes:[], duration:{} };
      t.item.effects.push(ef); act.effects.push({ _id:eid, onSave:false });
    }
    if (f.duracionValor !== "") {
      t.item.system.duration = { value:Number(f.duracionValor), units:f.duracionUnidad };
      t.dur = `${f.conc ? "C " : ""}${f.duracionValor} ${{round:"asaltos",minute:"min",hour:"h"}[f.duracionUnidad]}`;
    }
    if (f.material) {
      t.item.system.properties.push("material");
      t.item.system.materials = { value:f.material, consumed:!!f.materialConsumido, cost:Number(f.materialCosto), supply:0 };
    }
    const segundos = Number(t.item.system.duration.value) * ({round:6,minute:60,hour:3600})[t.item.system.duration.units];
    if (segundos>0) for (const ef of t.item.effects) ef.duration = { seconds:segundos, rounds:Math.ceil(segundos/6) };
    t.revision = (Number(anterior?.revision)||0)+1;
    t.historialEdicion = [...(anterior?.historialEdicion ?? []),{ revision:t.revision, por:game.user.id, fecha:new Date().toISOString() }].slice(-30);
    t.item.system.description.value += `<p><b>Aprender:</b> ${t.trazos} Trazos · nivel ${t.nivelMin}${t.req ? ` · ${escH(t.req)}` : ""}${t.previa ? ` · primero ${escH(tecnicaPorId(t.previa)?.n)}` : ""}.</p><p>El texto explica la resolución especial; las repeticiones de daño y condiciones narrativas las resuelve el DM.</p>`;
    const malas = problemasTecnica(t).filter(p => p.nivel === "error");
    if (malas.length) return rechazar(`No se publicó: ${malas.map(p => p.texto).join(" ")}`);
    await game.settings.set(MOD,AJ.extra,[...extraMundo().filter(x=>x.id!==t.id),t]);
    for (const a of game.actors ?? []) if (a?.isOwner && conoce(a,t.id)) {
      try { await refrescar(a); } catch (err) { console.error(`${MOD} | refrescar técnica universal`,err); aviso(`Publicado; abre la hoja de ${a.name} y usa «Rearmar» para refrescarla.`,"warn"); }
    }
    for (const a of game.actors ?? []) refrescarPanel(a.id);
    return t;
  });
}
export function retirarTecnicaUniversal(id, retirada = true) {
  if (!game.user.isGM) return Promise.resolve(false);
  return enSerie("catalogo", async () => {
    const t = extraMundo().find(t=>t.id===id); if (!t) return false;
    await game.settings.set(MOD,AJ.extra,extraMundo().map(t=>t.id===id ? {...t,retirada:!!retirada}:t));
    for (const a of game.actors ?? []) refrescarPanel(a.id);
    return true;
  });
}
/** Borra una técnica del mundo (Taller del DM). Con `deFichas`, también la quita de las fichas que la aprendieron. */
export function borrarTecnicaMundo(id, { deFichas = false } = {}) {
  if (!game.user.isGM) return Promise.resolve(false);
  return enSerie("catalogo", async () => {
    const t = extraMundo().find(x => x.id === id); if (!t) return false;
    await game.settings.set(MOD, AJ.extra, extraMundo().filter(x => x.id !== id));
    let fichas = 0;
    if (deFichas) for (const a of game.actors ?? []) {
      const ids = itemsDe(a, id).map(i => i.id);
      if (!ids.length) continue;
      await a.deleteEmbeddedDocuments("Item", ids); fichas += 1;
    }
    for (const a of game.actors ?? []) refrescarPanel(a.id);
    return { nombre: t.n, fichas };
  });
}
/** Borra una técnica propia (firmada, variante o evolución) de una ficha, y su objeto si lo tiene. */
export async function borrarPropia(actor, id) {
  if (!game.user.isGM || !actor) return false;
  const e = estado(actor); if (!(e?.propias ?? []).some(t => t.id === id)) return false;
  const ids = itemsDe(actor, id).map(i => i.id);
  if (ids.length) await actor.deleteEmbeddedDocuments("Item", ids);
  await guardar(actor, { propias: (e.propias ?? []).filter(t => t.id !== id) });
  return true;
}
export function formularioUniversalDe(t) {
  if (t?.definicionUniversal) return foundry.utils.deepClone(t.definicionUniversal);
  const sys=t?.item?.system, act=Object.values(sys?.activities ?? {})[0], p=act?.healing ?? act?.damage?.parts?.[0];
  return { ...FORMULARIO_UNIVERSAL, ...(t ? { nombre:t.n,rama:t.rama,nat:t.nat||"",grado:t.g,efecto:t.texto||"",
    tiempo:TIEMPO_ACT[t.t] ? t.t : "A", alcance:sys.range?.units==="self"?"yo":sys.range?.units==="touch"?"toque":String(sys.range?.value||18),
    dadosN:p?.number||0,dadosD:p?.denomination||6,bono:Number(p?.bonus)||0, trazos:t.trazos,
    tipoActividad:act?.healing?"healing":"normal", tirada:act?.type==="attack"?"ataque":act?.type==="save"?(Object.entries(SALV).find(([,v])=>act.save.ability.includes(v))?.[0]||"DES"):"ninguna",
    gestos:sys.properties?.includes("somatic")??false,voz:sys.properties?.includes("vocal")??false,conc:sys.properties?.includes("concentration")??false,
    disparador:sys.activation?.condition||"",material:sys.materials?.value||"",materialCosto:sys.materials?.cost||0,materialConsumido:!!sys.materials?.consumed,
    areaTipo:({cone:"cono",sphere:"esfera",cube:"cubo",line:"línea",cylinder:"cilindro"})[sys.target?.template?.type]||"ninguna",areaTam:sys.target?.template?.size||3,
    blancos:Number(sys.target?.affects?.count)||1,escaladoDados:p?.scaling?.number??1,
    duracion:sys.duration?.units==="inst"?"inst.":"1 min",duracionValor:["round","minute","hour"].includes(sys.duration?.units)?sys.duration.value:"",duracionUnidad:sys.duration?.units||"minute",
    estadosElegidos:[...new Set((t.item.effects??[]).flatMap(e=>e.statuses??[]))].filter(s=>estadosEditor().includes(s)),req:t.req||"",previa:t.previa||"",nivelMin:t.nivelMin||1 } : {}) };
}
export function abrirEditorCatalogo() { if (game.user.isGM && activo()) return new EditorCatalogoVerbe().render({force:true}); }
export class EditorCatalogoVerbe extends foundry.applications.api.ApplicationV2 {
  constructor() { super({window:{title:"Taller del DM · Catálogo universal",icon:"fa-solid fa-pen-nib"}}); this.formulario={...FORMULARIO_UNIVERSAL}; this.idTecnica=null; }
  static DEFAULT_OPTIONS = { classes:["ecos-verbe-panel","ecos-editor-catalogo"], position:{width:940,height:820}, window:{resizable:true}, actions:{
    nuevo() { if(!game.user.isGM)return; this.formulario={...FORMULARIO_UNIVERSAL};this.idTecnica=null;this.render(); },
    editar(ev,t) { if(!game.user.isGM)return;const tec=extraMundo().find(x=>x.id===t.dataset.id);if(!tec)return;this.formulario=formularioUniversalDe(tec);this.idTecnica=tec.id;this.render(); },
    duplicar(ev,t) { if(!game.user.isGM)return;const tec=tecnicaPorId(t.dataset.id || this.element.querySelector('[name="duplicarBase"]')?.value);if(!tec)return;this.formulario=formularioUniversalDe(tec);this.formulario.nombre+=' · copia';this.idTecnica=null;this.render(); },
    async guardar() { if(!game.user.isGM)return;this.leer();const t=await publicarTecnicaUniversal(this.formulario,this.idTecnica);if(t){this.idTecnica=t.id;aviso(`Publicada ${t.n}: aparece en Aprender con sus requisitos.`);this.render();} },
    async retirar(ev,t) { if(!game.user.isGM)return;const tec=extraMundo().find(x=>x.id===t.dataset.id);if(!tec)return;if(await confirmar(tec.retirada?"Volver a publicar":"Retirar del aprendizaje",`<p>${escH(tec.n)}: las técnicas ya aprendidas se conservan.</p>`)){await retirarTecnicaUniversal(tec.id,!tec.retirada);this.render();} },
    async borrar(ev,t) {
      if(!game.user.isGM)return;const tec=extraMundo().find(x=>x.id===t.dataset.id);if(!tec)return;
      const saben=(game.actors??[]).filter(a=>conoce(a,tec.id)).map(a=>a.name);
      const r=await foundry.applications.api.DialogV2.wait({window:{title:`Borrar ${tec.n}`},content:`<p>Se borra <b>${escH(tec.n)}</b> del catálogo de este mundo. No se puede deshacer.</p><p>${saben.length?`La saben: ${saben.map(escH).join(", ")}.`:"Ninguna ficha la aprendió."}</p>`,rejectClose:false,
        buttons:[...(saben.length?[{action:"todo",label:"Borrar y quitarla de las fichas"}]:[]),{action:"catalogo",label:saben.length?"Borrar solo del catálogo":"Borrar",default:!saben.length},{action:"no",label:"Cancelar",default:!!saben.length}]});
      if(!r||r==="no")return;const hecho=await borrarTecnicaMundo(tec.id,{deFichas:r==="todo"});
      if(hecho){aviso(`Borrada ${hecho.nombre}${hecho.fichas?` (y de ${hecho.fichas} ficha${hecho.fichas===1?"":"s"})`:""}.`);if(this.idTecnica===tec.id){this.idTecnica=null;this.formulario={...FORMULARIO_UNIVERSAL};}this.render();}
    },
    async borrarPropia(ev,t) {
      if(!game.user.isGM)return;const a=game.actors.get(t.dataset.actor),tec=(estado(a)?.propias??[]).find(x=>x.id===t.dataset.id);if(!a||!tec)return;
      if(await confirmar(`Borrar ${tec.n}`,`<p>Se borra la técnica propia <b>${escH(tec.n)}</b> de <b>${escH(a.name)}</b> (y su objeto en la ficha). No se puede deshacer.</p>`)){if(await borrarPropia(a,tec.id))aviso(`Borrada ${tec.n} de ${a.name}.`);this.render();}
    },
    elegirBase(ev,t) { if(!game.user.isGM)return;const tipo=t.dataset.tipo,id=this.element.querySelector(`[name="base-${tipo}"]`)?.value;if(!id)return;this.base={tipo,id};this.render(); },
    async guardarBase() {
      if(!game.user.isGM||!this.base)return;const prop={};
      for(const el of this.element.querySelectorAll('[data-base]'))prop[el.name]=el.value;
      const r=await guardarEdicionBase(this.base.tipo,this.base.id,prop);
      if(r)aviso(Object.keys(r.cambios).length?`Guardado: ${Object.keys(r.cambios).length} cambio(s). Las fichas que la saben se rearman solas.`:"Sin diferencias con el original: queda como en el módulo.");
      this.render();
    },
    async restaurarBase() {
      if(!game.user.isGM||!this.base)return;
      if(await confirmar("Restaurar original","<p>Se borran tus cambios y vuelve el texto y los números del módulo.</p>")){await restaurarOriginal(this.base.tipo,this.base.id);aviso("Restaurado el original.");this.render();}
    },
    abrirReliquias() { if(!game.user.isGM)return;const pack=game.packs.get("world.ecos-reliquias");if(!pack)return aviso("No encuentro el compendio de reliquias de este mundo.","warn");pack.render(true); },
    abrirHechizo() { if(!game.user.isGM)return;const it=game.items.get(this.element.querySelector('[name="hechizo"]')?.value);if(!it)return aviso("Elige un hechizo del mundo.","warn");it.sheet.render(true); }
  }};
  leer() {
    for(const el of this.element.querySelectorAll('[data-editor]')) this.formulario[el.name]=el.type==="checkbox"?el.checked:el.value;
    this.formulario.estadosElegidos=[...this.element.querySelectorAll('[data-estado]:checked')].map(el=>el.dataset.estado);
    this.formulario.estados=this.formulario.estadosElegidos.length;
    return this.formulario;
  }
  async _renderHTML() {
    if(!game.user.isGM)return "<p>Solo el DM puede abrir este taller.</p>";
    const f=this.formulario;
    const input=(k,n,t="text",extra="")=>`<label>${n}<input data-editor name="${k}" type="${t}" value="${escH(f[k])}" ${extra}></label>`;
    const select=(k,n,pares)=>`<label>${n}<select data-editor name="${k}">${opciones(pares,String(f[k]))}</select></label>`;
    const check=(k,n)=>`<label class="ecos-check"><input data-editor name="${k}" type="checkbox" ${f[k]?"checked":""}>${n}</label>`;
    const lista=extraMundo().map(t=>`<li><b>${escH(t.n)}</b> · grado ${t.g}${t.retirada?" · retirada":""} <button type="button" data-action="editar" data-id="${t.id}">Editar</button> <button type="button" data-action="duplicar" data-id="${t.id}">Duplicar</button> <button type="button" data-action="retirar" data-id="${t.id}">${t.retirada?"Republicar":"Retirar"}</button> <button type="button" data-action="borrar" data-id="${t.id}"><i class="fa-solid fa-trash"></i> Borrar</button></li>`).join("");
    const propias=Array.from(game.actors??[]).flatMap(a=>(estado(a)?.propias??[]).map(t=>`<li><b>${escH(t.n)}</b> · ${escH(a.name)} · grado ${t.g}${t.modo?` · ${escH(t.modo)}`:t.firmada?" · firmada":""} <button type="button" data-action="duplicar" data-id="${t.id}">Copiar al catálogo para editar</button> <button type="button" data-action="borrarPropia" data-actor="${a.id}" data-id="${t.id}"><i class="fa-solid fa-trash"></i> Borrar</button></li>`)).join("");
    const ed=edicionesMundo(),nEd=Object.keys(ed.tecnicas??{}).length+Object.keys(ed.dotes??{}).length;
    const campoBase=([k,n,tipo,min,max],valor,original)=>{
      const v=escH(valor??""),cambia=String(valor??"")!==String(original??""),orig=cambia?`<small class="ecos-nota">Original: ${escH(String(original??"—")).slice(0,160)}</small>`:"";
      if(tipo==="area")return `<label>${n}<textarea data-base name="${k}" rows="4" maxlength="4000">${v}</textarea>${orig}</label>`;
      if(tipo==="tiempo")return `<label>${n}<select data-base name="${k}">${opciones([["A","Acción"],["AA","Acción adicional"],["R","Reacción"]],String(valor))}</select>${orig}</label>`;
      if(tipo==="dado")return valor===""?"":`<label>${n}<select data-base name="${k}">${opciones([4,6,8,10,12].map(x=>[x,`d${x}`]),String(valor))}</select>${orig}</label>`;
      if(valor==="")return "";
      return `<label>${n}<input data-base name="${k}" type="${tipo==="texto"?"text":"number"}" value="${v}" ${tipo==="texto"?'maxlength="100"':`min="${min}" max="${max}" step="${tipo==="entero"?1:0.5}"`}>${orig}</label>`;
    };
    let base="";
    if(this.base){
      const tec=this.base.tipo==="tecnica",orig=tec?tecnicaOriginal(this.base.id):doteOriginal(this.base.id);
      if(orig){
        const campos=tec?CAMPOS_TECNICA:CAMPOS_DOTE,o=tec?leerCamposTecnica(orig):leerCamposDote(orig);
        const cambios=(tec?ed.tecnicas:ed.dotes)?.[this.base.id]??{},actual={...o,...cambios};
        base=`<h4>${escH(tec?orig.n:orig.nombre)}${Object.keys(cambios).length?` · <i>${Object.keys(cambios).length} cambio(s) guardado(s)</i>`:""}</h4><div class="ev-editor-grid">${campos.map(c=>campoBase(c,actual[c[0]],o[c[0]])).join("")}</div>
        <div class="ecos-botones"><button type="button" data-action="guardarBase"><i class="fa-solid fa-floppy-disk"></i> Guardar cambios en este mundo</button>${Object.keys(cambios).length?`<button type="button" data-action="restaurarBase"><i class="fa-solid fa-rotate-left"></i> Restaurar original</button>`:""}</div>
        ${tec?`<p class="ecos-nota">Al guardar se revisa la técnica: si quedara un área sin plantilla o un daño que te alcanza, no se guarda.</p>`:""}`;
      }
    }
    const hechizos=(game.items??[]).filter(i=>i.type==="spell"&&!i.getFlag?.(MOD,F)).map(i=>[i.id,i.name]).sort((a,b)=>a[1].localeCompare(b[1]));
    return `<div class="ecos-verbe-cuerpo"><h2>Taller del DM</h2><p>Publica técnicas para el catálogo de todos los jugadores. Cada personaje tendrá que cumplir sus requisitos y aprenderlas con Trazos. Crear aquí no cobra ni enseña nada al personaje seleccionado.</p>
      <details><summary>Técnicas adicionales (${extraMundo().length})</summary><ul>${lista||"<li>No hay técnicas adicionales.</li>"}</ul></details>
      <details><summary>Técnicas propias de las fichas (firmadas, variantes, evoluciones)</summary><ul>${propias||"<li>Ninguna ficha tiene técnicas propias.</li>"}</ul></details>
      <details ${this.base?"open":""}><summary>Cambiar el catálogo del módulo (${nEd} edición${nEd===1?"":"es"} guardada${nEd===1?"":"s"})</summary>
        <p>Cambia el nombre, el texto o los números de cualquier técnica o dote del módulo. Se guarda <b>solo lo que cambias</b>, en este mundo: si actualizas o reinstalas el módulo, tus cambios siguen. «Restaurar original» los borra.</p>
        <div class="ecos-botones"><select name="base-tecnica">${opciones(BASE?.tecnicas?.map(t=>[t.id,`${(ed.tecnicas??{})[t.id]?"✎ ":""}${t.n} · grado ${t.g}`])??[],this.base?.tipo==="tecnica"?this.base.id:"")}</select><button type="button" data-action="elegirBase" data-tipo="tecnica">Editar técnica</button>
        <select name="base-dote">${opciones(BASE?.dotes?.map(d=>[d.id,`${(ed.dotes??{})[d.id]?"✎ ":""}${d.nombre}`])??[],this.base?.tipo==="dote"?this.base.id:"")}</select><button type="button" data-action="elegirBase" data-tipo="dote">Editar dote</button></div>
        ${base}
        <h4>Reliquias y hechizos</h4><p>Las reliquias viven en el compendio del mundo «Reliquias»: ábrelo, desbloquéalo y edita cada una con el editor de dnd5e. Tus cambios de texto se conservan al actualizar el módulo. Los hechizos se editan con el editor nativo de dnd5e.</p>
        <div class="ecos-botones"><button type="button" data-action="abrirReliquias"><i class="fa-solid fa-gem"></i> Abrir compendio de reliquias</button><select name="hechizo">${opciones(hechizos,"")}</select><button type="button" data-action="abrirHechizo"><i class="fa-solid fa-wand-sparkles"></i> Abrir hechizo en su editor</button></div>
      </details>
      <div class="ecos-botones"><button type="button" data-action="nuevo">Nueva técnica</button><select name="duplicarBase">${opciones(D.tecnicas.map(t=>[t.id,`${t.n} · grado ${t.g}`]),"")}</select><button type="button" data-action="duplicar">Usar como punto de partida</button></div>
      <h3>${this.idTecnica?"Editar publicación":"Nueva publicación"}</h3><div class="ev-editor-grid">
      <fieldset><legend>Identidad y aprendizaje</legend>${input("nombre","Nombre","text",'maxlength="100"')}${select("rama","Especialidad",D.ramas.map(r=>[r.id,r.nombre]))}${select("nat","Elemento",[["","Sin elemento"],...Object.keys(NATS).map(n=>[n,nombreNat(n)]),...Object.keys(D.combos).map(n=>[n,nombreNat(n)])])}${input("grado","Grado (0–11)","number",'min="0" max="11"')}${input("trazos","Trazos para aprender","number",'min="0" max="100"')}${input("nivelMin","Nivel mínimo adicional","number",'min="1" max="20"')}${select("previa","Técnica previa",[["","Ninguna"],...[...D.tecnicas,...extraMundo()].filter(t=>t.id!==this.idTecnica).map(t=>[t.id,t.n])])}${input("req","Requisito narrativo o maestro","text",'maxlength="500"')}</fieldset>
      <fieldset><legend>Uso y recursos</legend>${select("tiempo","Tiempo",[["A","Acción"],["AA","Acción adicional"],["R","Reacción"],["1 min","1 minuto"],["10 min","10 minutos"]])}${input("disparador","Disparador (obligatorio en reacciones)","text",'maxlength="500"')}${input("costoBase","Verbe base (vacío: tabla por grado)","number",'min="0" max="100"')}${select("usa","Característica",[["verbe","La del Verbe"],["fisica","Mejor de Fuerza/Destreza"],...Object.entries(CARS)])}${select("tipoActividad","Actividad",[["normal","Daño, ataque, salvación o utilidad"],["healing","Curación"]])}${select("tirada","Resolución",[["ninguna","Ninguna"],["ataque","Ataque"],...Object.keys(SALV).map(k=>[k,`Salvación de ${k}`])])}${check("mitad","Mitad del daño si supera la salvación")}</fieldset>
      <fieldset><legend>Daño, curación y escalado</legend>${input("dadosN","Cantidad de dados (0: utilidad)","number",'min="0" max="100"')}${select("dadosD","Dado",[4,6,8,10,12].map(n=>[n,`d${n}`]))}${input("bono","Bonificación fija","number",'min="-20" max="100"')}${select("tipoDano","Tipo de daño",Object.keys(DANO).map(k=>[k,k]))}${input("escaladoDados","Dados por grado adicional (0: sin dados extra)","number",'min="0" max="10"')}${check("persistente","Daño repetido: resolver disparadores en mesa")}</fieldset>
      <fieldset><legend>Alcance, blancos y duración</legend>${input("alcance","Alcance: yo, toque o metros (1,5 m = 5 ft en la mesa)")}${select("areaTipo","Área",["ninguna","cono","esfera","cubo","línea","cilindro"].map(k=>[k,k]))}${input("areaTam","Tamaño de área (m; 3 m = 10 ft)","number",'min="0.1" max="180" step="0.1"')}${input("blancos","Blancos sin área","number",'min="1" max="100"')}${select("duracion","Duración",Object.keys(DUR).map(k=>[k,k]))}${input("duracionValor","Duración personalizada (vacío: la anterior)","number",'min="1" max="1440"')}${select("duracionUnidad","Unidad personalizada",[["round","Asaltos"],["minute","Minutos"],["hour","Horas"]])}${check("conc","Requiere Concentración")}</fieldset>
      <fieldset><legend>Componentes</legend>${check("voz","Voz")}${check("gestos","Gestos")}${input("material","Material requerido","text",'maxlength="500"')}${input("materialCosto","Valor del material (oro)","number",'min="0" step="0.01"')}${check("materialConsumido","El material se consume (gestionar inventario en mesa)")}</fieldset>
      <fieldset><legend>Estados aplicables</legend><p>Hasta tres estados registrados. El daño elemental añade también su estado. La actividad enlaza los efectos nativos; el DM confirma condiciones y finalización especiales.</p>${estadosEditor().map(st=>`<label class="ecos-check"><input type="checkbox" data-estado="${escH(st)}" ${(f.estadosElegidos??[]).includes(st)?"checked":""}>${escH(ESTADOS[st]?.name ?? CONFIG.statusEffects?.find(e=>e.id===st)?.name ?? st)}</label>`).join("")}</fieldset></div>
      <label>Qué hace y cómo termina<textarea data-editor name="efecto" rows="6" maxlength="4000">${escH(f.efecto)}</textarea></label>
      <details><summary>Excepción de balance</summary>${check("excepcionDM","Aprobar una excepción al presupuesto")}${input("motivoExcepcion","Motivo y límites de la excepción","text",'maxlength="500"')}</details>
      <div class="ev-editor-preview" aria-live="polite"></div><button type="button" data-action="guardar">${this.idTecnica?"Guardar y actualizar publicación":"Publicar para todos los jugadores"}</button></div>`;
  }
  _replaceHTML(html,content) {
    content.innerHTML=html;
    const revisar=()=>{const f=this.leer(),r=revisarUniversal(f);const caja=content.querySelector('.ev-editor-preview');if(caja)caja.innerHTML=`<p><b>Referencia: ${r.propuesta.n}d${r.propuesta.d}</b> · ${f.trazos} Trazos al aprender · ${f.costoBase===""?costoGrado(f.grado):escH(f.costoBase)} Verbe por uso base.</p>${[...r.errores,...r.excede].map(e=>`<p>${escH(e)}</p>`).join("")}<p>Los estados, acciones, alcance, curación, tiradas, Concentración y escalado se guardan en la actividad. El texto libre y los disparadores de daño repetido se resuelven en mesa.</p>`;};
    content.querySelectorAll('[data-editor],[data-estado]').forEach(el=>el.addEventListener('change',revisar));
    if(game.user.isGM) revisar();
  }
}

/* ------------------------------------------------------------------ */
/*  Miradas, Cerrojos, choques y herramientas del DM                  */
/* ------------------------------------------------------------------ */

export async function despertarOjo(actor, ojo, etapa, trasplante = false) {
  if (!game.user.isGM) return false;
  const e = estado(actor);
  const m = D.miradas.find(x => x.id === ojo);
  if (!m || !Number.isInteger(etapa) || etapa<1 || etapa>m.etapas.length) return rechazar("La etapa de Mirada no existe.");
  if (nivelDe(actor)<(m.niveles?.[etapa-1]||1)) return rechazar(`Esta etapa pide nivel ${m.niveles[etapa-1]}.`);
  const antes = Number(e.miradas?.[ojo]) || 0;
  if (etapa <= antes) return rechazar(`Ya tiene ese ojo en la etapa ${antes}.`);
  const yaTrasplante = (e.trasplantes ?? []).includes(ojo);
  if (!trasplante && !yaTrasplante) { const c = conflictoSangre(actor, { ojo }); if (c) return rechazar(c, "warn"); }
  const sangreOjo = !trasplante && !yaTrasplante && !linajeDe(actor) && m.linaje && D.linajes.some(l => l.id === m.linaje) ? { linaje: m.linaje } : {};
  const costo = (m?.trazos ?? [3, 5, 8]).slice(antes, etapa).reduce((t, n) => t + n, 0);
  const texto = `${m?.nombre ?? ojo}: etapa ${etapa} (${costo} Trazos)`;
  await guardar(actor, { ...sangreOjo, miradas: { [ojo]: etapa }, trasplantes: trasplante ? [...new Set([...(e.trasplantes ?? []), ojo])] : (e.trasplantes ?? []),
    gastados: (Number(e.gastados) || 0) + costo, historial: hist(e, texto), compras: compra(e, "ojo", { ojo, antes, etapa }, costo, texto) });
  for (const t of D.tecnicas.filter(x => x.rama === "mirada" && x.incl && x.id.startsWith(`mirada-${ojo}-`))) {
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
  if (!c) return rechazar("Ya sabe los ocho.");
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
  if (n === 8 && !await confirmar("Abrir la Puerta de la Muerte", "<p>El cuerpo original morirá al terminar. Solo una intervención excepcional del DM puede cambiarlo. ¿Abrirla?</p>")) return false;
  const abiertos = Number(efectoV(actor, "cerrojo")?.getFlag(MOD, F)?.cerrojo) || 0;
  const cuantos = rangoDe(actor, "cuerpo") >= 3 ? 3 : 2;
  if (n <= abiertos) return rechazar(`Ya tiene abierto hasta el cerrojo ${abiertos}.`);
  if (n > abiertos + cuantos) return rechazar(`Los Cerrojos se abren en orden: ahora puede abrir hasta el ${abiertos + cuantos} (${cuantos} más por acción adicional${cuantos === 2 ? "; 3 con Maestro en Cuerpo" : ""}).`, "warn");
  const costo = costoGrado(c.grado);
  const v = Number(e.valor) || 0;
  const permiso = evaluarGasto({ valor: v, costo, limite: limiteNegativo(actor), grado: c.grado,
    gradoMaximo: gradoMax(actor), agotamiento: sistema.agotamiento(actor),
    incapacitado: noPuedeActuar(actor) });
  if (!permiso.ok) return rechazar(permiso.motivo, "warn");
  const libre = n === 1 && esCerrojero(actor);
  const sinPrueba = libre || (n === 1 && efectosDotes(actor).some(ef => ef.cerrojoLibre));
  if (!sinPrueba) {
    const dc = 10 + (2 * n);
    const rolls = await sistema.tirarHabilidad(actor, "cvb", { target: dc }, { configure: false });
    const roll = Array.isArray(rolls) ? rolls[0] : rolls;
    if (!roll || roll.total < dc) return aLaMesa(actor, "Los Cerrojos no ceden", `<p>${escH(actor.name)} no logra abrir el cerrojo ${n} (Control ${roll?.total ?? "?"} contra CD ${dc}).</p>`);
  }
  const viejo = efectoV(actor, "cerrojo");
  const paso = sistema.velocidad(actor).pies ? "10" : "3";
  const changes = [];
  for (let i = 1; i <= n; i++) for (const [key, mode, value] of CERROJO_FX[i] ?? []) changes.push({ key, mode, value: value === "@paso" ? paso : value });
  const da = D.cerrojos.filter(x => x.n <= n).map(x => `<li><b>${x.n} · ${escH(x.nombre)}:</b> ${escH(x.da)}</li>`).join("");
  const min = esCerrojero(actor) ? 2 : 1;
  const pg = libre ? 0 : (rangoDon(actor, "cuerpo") >= 4 ? Math.ceil((Number(c.pg) || 0) / 2) : Number(c.pg) || 0);
  const datos = { name: `Ocho Cerrojos · ${n}`, img: "systems/dnd5e/icons/svg/abilities/strength.svg",
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
  aLaMesa(actor, "✦ Ocho Cerrojos", `<p>${escH(actor.name)} abre hasta el cerrojo ${n}, ${escH(c.nombre)}${pg ? `: paga ${pg} PG por turno` : ""}.</p>`);
}

/** Al cerrar los Cerrojos o terminar el Despertar (lo hace el DM, una sola vez). */
async function alQuitarEfecto(ef, opciones) {
  if (!soyGM() || opciones?.ecosSinCierre) return;
  const actor = ef.parent;
  if (!(actor instanceof Actor)) return;
  const fl = ef.getFlag(MOD, F);
  if (ef.statuses?.has("concentrating")) for(const ligado of actor.effects.filter(e=>e.getFlag(MOD,F)?.deConcentracion && [ef.uuid,ef.id].includes(e.getFlag(MOD,F).deConcentracion))) await ligado.delete();
  if (fl?.replicas && fl.nonce === estado(actor)?.lazoReplica) await guardar(actor,{reservaReplicas:0});
  if (fl?.cerrojo) {
    const c = D.cerrojos.find(x => x.n === fl.cerrojo);
    if (fl.cerrojo === 8) {
      await actor.update(sistema.datosPg(0));
      await susurrarDM("La Octava Puerta", `<p>${escH(actor.name)} agotó la Puerta de la Muerte. El precio es la vida del cuerpo original: registra la muerte o una intervención excepcional ganada en la historia. Una cura ordinaria, un clon o un descanso no la evitan.</p>`);
      return;
    }
    if (fl.cerrojo === 7 && D.cerrojos.length === 7) {
      const cd7 = rangoDon(actor, "cuerpo") >= 5 ? 10 : (rangoDon(actor, "cuerpo") >= 4 ? 15 : 20);
      const rolls = await sistema.tirarSalvacion(actor, "con", { target: cd7 }, { configure: false });
      const roll = Array.isArray(rolls) ? rolls[0] : rolls;
      if (roll && roll.total >= cd7) {
        await actor.update({ ...sistema.datosPg(0), ...sistema.datosAgotamiento(Math.max(4, sistema.agotamiento(actor))) });
        aLaMesa(actor, "Se cierra el séptimo", `<p>${escH(actor.name)} sobrevive: cae a 0 PG con 4 de Agotamiento.</p>`);
      } else {
        await actor.update(sistema.datosPg(0));
        await susurrarDM("El séptimo cerrojo", `<p>${escH(actor.name)} falla la salvación (${roll?.total ?? "?"} contra ${cd7}): según la regla, muere. Lo dejé a 0 PG; la muerte la marcas tú.</p>`);
      }
      return;
    }
    const repetido = (Number(estado(actor)?.cerrojosHoy?.veces) || 0) >= 2;
    const ag = (Number(String(c?.cierre ?? "").match(/(\d+) Agotamiento/)?.[1]) || 0) + (repetido ? 1 : 0);
    if (ag) {
      const v = Math.min(6, sistema.agotamiento(actor) + ag);
      await actor.update(sistema.datosAgotamiento(v));
      aLaMesa(actor, "Se cierran los Cerrojos", `<p>${escH(actor.name)}: +${ag} Agotamiento (${v}).</p>`);
    }
  } else if (fl?.despertar) {
    const e = estado(actor);
    if (rangoDon(actor, "sangre") >= 4 && !e?.despertarLibre) await guardar(actor, { despertarLibre: true });
    else {
      const v = Math.min(6, sistema.agotamiento(actor) + 1);
      await actor.update(sistema.datosAgotamiento(v));
      aLaMesa(actor, "Termina el Despertar", `<p>${escH(actor.name)} vuelve a su forma: +1 Agotamiento (${v}).</p>`);
    }
    if (herenciaDe(actor)?.barrera) await manejar({ accion: "capaVReloj", actorId: actor.id }, { interno: true });
  }
}

/** Inicio de turno: efectos vencidos, Cerrojos (PG), Ardiendo y Verbe por turno del Despertar. */
async function inicioDeTurno(combat) {
  const actor = combat?.combatant?.actor;
  if (!actor) return;
  if (efectoCanal(actor)) await subirCarga(actor);
  if (despierto(actor)) await guardar(actor, { reaccionUsada: false, accionReplicaUsada:false,turnoTecnicas:{combate:game.combat?.id??"combate",acciones:0,adicionales:0,mayores:0} });
  for (const ef of actor.effects.filter(x => { const fl = x.getFlag(MOD, F);
    return fl && !fl.herencia && !fl.dotesAE && duracionFinita(x); })) {
    const r = ef.duration?.remaining;
    if (Number.isFinite(r) && r <= 0) await ef.delete();
  }
  const cerr = efectoV(actor, "cerrojo");
  const pg = Number(cerr?.getFlag(MOD, F)?.pg) || 0;
  if (cerr && pg) {
    await actor.update(sistema.datosPg(Math.max(0, sistema.pg(actor).valor - pg)));
    aLaMesa(actor, "Ocho Cerrojos", `<p>${escH(actor.name)} paga ${pg} PG por los Cerrojos abiertos.</p>`);
  }
  if (actor.statuses?.has("ardiendo")) {
    const roll = await new Roll("1d6").evaluate();
    await sistema.danar(actor, roll.total, "fire");
    await roll.toMessage({ speaker: ChatMessage.getSpeaker({ actor }), flavor: `${escH(actor.name)} arde: ${roll.total} de fuego` });
  }
  for (const ef of actor.effects) { const rg = ef.getFlag(MOD,F)?.regenera; if (ef.disabled || !rg || sistema.pg(actor).valor <= 0) continue; const roll = await new Roll(rg).evaluate(); await sistema.curar(actor, roll.total); }
  const regen = efectoV(actor, "despertar") ? herenciaDe(actor)?.despertar?.regen : null;
  if (regen && despierto(actor)) {
    const roll = await new Roll(regen).evaluate();
    const breve = recuperacionBreve(actor,roll.total);
    await guardar(actor,{valor:breve.valor,recResto:breve.recResto,recCortos:breve.recCortos});
    const valor = breve.valor;
    aLaMesa(actor, "Verbe", `<p>${escH(actor.name)} obtiene ${breve.cantidad} puntos de recuperación de Verbe (${valor}); consume presupuesto breve.</p>`, { soloDueno: true });
  }
  if(tieneDote(actor,'respirar-mundo')&&(contextoShinobi(actor).modos.includes('sabio')||efectoV(actor,'quietud'))){
    const breve=recuperacionBreve(actor,1);if(breve.cantidad)await guardar(actor,{valor:breve.valor,recResto:breve.recResto,recCortos:breve.recCortos});
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

export async function resolverChoque(A, B, {automatico=false} = {}) {
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
        const rolls = await sistema.tirarHabilidad(x.actor, "cvb", { advantage: ventajaChoque(x.actor) }, { configure: false }, { create: false });
        return (Array.isArray(rolls) ? rolls[0] : rolls)?.total ?? 0;
      }
      return (await new Roll("1d20").evaluate()).total;
    };
    const ta = await tirar(A);
    const tb = await tirar(B);
    gana = desempateChoque({ ta, tb, ga: A.g, gb: B.g, dados: !!resultado.dados });
    L.push(resultado.dados ? `Sin ventaja elemental deciden los dados: Control ${ta} + grado ${A.g} contra Control ${tb} + grado ${B.g}.` : `Potencia efectiva igualada: Control ${ta} contra ${tb}.`);
  }
  L.push(gana ? `<b>Gana ${escH(gana > 0 ? A.nombre : B.nombre)}</b>: la otra se deshace y la ganadora sigue.` : "<b>Empate</b>: las dos se anulan.");
  consecuenciasDelChoque(A, B, gana, ciclo).catch(err => console.error(`${MOD} | lo que deja el choque`, err));
  if(automatico) await aLaMesa(A.actor,"Choque de técnicas",`<p>${L.slice(0,-1).join("<br>")}</p><p>${gana>0?"La atacante supera la intercepción y continúa contra este objetivo.":gana<0?"La contratécnica intercepta el lanzamiento contra su defensor.":"Empate: las técnicas se anulan contra este objetivo."} El choque no concede un ataque adicional.</p>`);
  else await susurrarDM("Choque", `<p>${L.join("<br>")}</p>`);
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
  await actor.update({ ...Object.fromEntries([quitar(`flags.${MOD}.${F}`)]), ...sistema.datosControl({ rango: 0, bono: 0 }) });
  paneles.get(actor.id)?.close();
  await asegurarGuia();
  aviso(`${actor.name} ya no tiene el Verbe.`);
}

/* ------------------------------------------------------------------ */
/*  Herramientas del DM: deshacer, rehacer y ajustes directos         */
/* ------------------------------------------------------------------ */

/** Borra una clave del estado (guardar mezcla y no borra). */
const borrarClave = (actor, ruta) => actor.update(Object.fromEntries([quitar(`flags.${MOD}.${F}.${ruta}`)]));
/** Reemplaza el estado entero. */
async function reemplazar(actor, e) {
  await actor.update(Object.fromEntries([quitar(`flags.${MOD}.${F}`)]), { render: false });
  await actor.update({ [`flags.${MOD}.${F}`]: e });
}
const quitarItems = (actor, prueba) => {
  const ids = actor.items.filter(prueba).map(i => i.id);
  return ids.length ? actor.deleteEmbeddedDocuments("Item", ids) : null;
};
const itemsDe = (actor, id) => itemsTecnica(actor).filter(i => i.getFlag(MOD, F).id === id);

/** Una elección de dote no se convierte en un regalo permanente al devolver sus Trazos. */
function retirarEleccionesDote(e,id) {
  if (id === "tercera-naturaleza" && e.terceraElegida) return { natsExtra:(e.natsExtra??[]).filter(n=>n!==e.terceraElegida),terceraElegida:null };
  if (!["naturaleza-combinada","elemento-complejo"].includes(id)) return {};
  const elegidas=[...(e.combosElegidas??[])], combos=[...(e.combos??[])];
  const cupos=id === "naturaleza-combinada" ? 0 : 1;
  while (elegidas.length && (cupos === 0 || combos.length>cupos)) { const n=elegidas.pop();const i=combos.indexOf(n);if(i>=0)combos.splice(i,1); }
  return {combos,combosElegidas:elegidas};
}

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
    cambios.poderesLegados=(e.poderesLegados??[]).filter(id=>id!==d.id);
    await quitarItems(actor, i => i.getFlag(MOD, F)?.id === d.id);
    if (e.cultivos?.[d.id]) borrar.push(`cultivos.${d.id}`);
    if (e.infusiones?.[d.id]) borrar.push(`infusiones.${d.id}`);
    if (e.estudios?.[d.id]) borrar.push(`estudios.${d.id}`);
  } else if (c.tipo === "rango") {
    if (rangoDe(actor, d.rama) !== d.a && no(`Primero deshaz el rango más alto de ${nombreRama(d.rama)}.`)) return;
    cambios.rangos = { [d.rama]: d.a - 1 };
    if (d.a - 1 <= 0 && e.principal !== d.rama) cambios.ordenRamas = (e.ordenRamas ?? []).filter(x => x !== d.rama);
  } else if (c.tipo === "dote") {
    cambios.dotes = (e.dotes ?? []).filter(x => x !== d.id);
    Object.assign(cambios,retirarEleccionesDote(e,d.id));
    await quitarItems(actor, i => i.getFlag(MOD, F)?.dote === d.id);
    if (d.id === "maestria-control") cambios.maestria = null;
    if (d.id === "rama-segunda") cambios.segunda = null;
    if (d.id === "tecnica-reserva") cambios.reserva = null;
  } else if (c.tipo === "control") {
    const v = sistema.control(actor);
    if (v !== d.v && no("Primero deshaz la pericia en Control.")) return;
    await actor.update(sistema.datosControl({ rango: Math.max(0, d.v - 1) }));
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
    await actor.update(sistema.datosMoneda(sistema.moneda(actor) + 1));
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
  e.poderesLegados=(e.poderesLegados??[]).filter(id=>conoce(actor,id));
  const quedan = (e.compras ?? []).filter(c => ["ojo", "moneda"].includes(c.tipo));
  const pr = principal ? null : e.principal;
  Object.assign(e, { rangos: pr ? { [pr]: 1 } : {}, ordenRamas: pr ? [pr] : [], principal: pr, dotes: [], afinidad: {}, cultivos: {}, infusiones: {},
    cerrojos: 0, maestria: null, segunda: null, reserva: null, reservaUsada: false, compras: quedan,
    gastados: quedan.reduce((t, c) => t + c.trazos, 0), nats: nat ? [] : e.nats,
    historial: hist(e, `El DM rehace desde cero${nat ? ", con naturaleza nueva" : ""}${principal ? ", con rama principal nueva" : ""}`) });
  await reemplazar(actor, e);
  await actor.update(sistema.datosControl({ rango: 0, bono: 0 }));
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
    await actor.update(sistema.datosControl({ rango: Number(valor) || 0 }));
    await guardar(actor, { historial: nota(`Control ${["sin competencia", "competente", "pericia"][Number(valor) || 0]}`) });
  } else if (campo === "cerrojos") await guardar(actor, { cerrojos: Math.clamp(Number(valor) || 0, 0, D.cerrojos.length), historial: nota(`sabe ${valor} cerrojos`) });
  else if (campo === "dote") {
    const dote = D.dotes.find(x => x.id === valor);
    if (!dote) return;
    if (tieneDote(actor, valor)) {
      await guardar(actor, { ...retirarEleccionesDote(e,valor), dotes: (e.dotes ?? []).filter(x => x !== valor), historial: nota(`quita la dote ${dote.nombre}`) });
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
const ORDEN_SEC = ["pura", "fuego", "agua", "viento", "tierra", "rayo", "combo", "velo", "cuerpo", "mirada", "sello", "pacto", "pulso", "hilo", "quietud", "rastro", "sangre", "umbral", "vasija", "familia"];
const TIEMPO_L = { A: "Acción", AA: "Acción adicional", R: "Reacción", "1 min": "1 minuto", "10 min": "10 minutos", "1 h": "1 hora", "8 h": "8 horas", "3 días": "ritual de 3 días" };
const COMP_L = { GV: "gestos y voz", G: "gestos", V: "voz", "—": "sin gestos ni voz" };
/** Con un área, «yo» es el origen de la plantilla (sale de ti y no te alcanza), no «sobre ti». */
const alcanceL = (a, area = null) => ({ yo: area ? "desde ti" : "sobre ti", toque: "toque", vista: "a la vista" }[a] ?? a);
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

function resumenDivino(actor) {
  if (!actor || !veLinaje(actor)) return "";
  const l=linajeDe(actor),e=estado(actor),d=donDivino(l,e?.fuerza,nivelDe(actor));
  if(!d.etapa)return "";
  const extra=Math.floor(Math.max(0,Number(D.verbeMax[nivelDe(actor)])+modDe(actor,e.car))*d.reserva);
  return `<p><b>Dones de tu sangre · umbral de nivel ${d.etapa}:</b> +${extra} de reserva máxima (no rellena energía), +${d.ac} CA pasiva. Durante Despertar: +${d.despertarAC} CA adicional${d.resistencias.length?", resistencia al necrótico y veneno":""}. Tus técnicas se aprenden con Trazos; los hitos los concede el DM.</p>`;
}

/** 3.28: la defensa de un PNJ en la pestaña DM, con lo que significa cada una para la mesa. */
function defensaDMHTML(a) {
  const d = defensaDe(a), vd = Number(a.system?.details?.cr ?? 0), n = d?.n ?? bonoDefensa(vd);
  const sug = defensaSugerida({ tipo: a.system?.details?.type?.value, vd, ca: Number(a.system?.attributes?.ac?.value) || 10, calculo: a.system?.attributes?.ac?.calc ?? "" });
  const elegido = d?.tipo ?? (a.getFlag(MOD, "defensa")?.tipo === "ninguna" ? "ninguna" : "");
  const op = [["coraza", "Coraza: CA altísima"], ["fortaleza", "Fortaleza: salvaciones altísimas"], ["piel", "Cuerpo sordo: resiste los golpes de armas"], ["ninguna", "Ninguna"]];
  return `<p>En la campaña, D&D pega y el Verbe ablanda. Cada criatura de VD ½ o más lleva <b>una</b> defensa altísima; las de menos VD son salvajes, sin ella (igual de letales).</p>
    <ul>${Object.entries(DEFENSAS).map(([k, x]) => `<li><b>${escH(x.nombre)}</b>: ${escH(x.texto)}</li>`).join("")}</ul>
    <p>Ahora: <b>${d ? `${escH(DEFENSAS[d.tipo].nombre)}${d.tipo === "piel" ? "" : ` +${d.n}`}` : "ninguna"}</b>.${sug ? ` Para su tipo y su CA, el módulo sugiere <b>${escH(DEFENSAS[sug].nombre)}</b>.` : " Con VD menor que ½ no lleva."} La tabla: +4 (VD ½–4), +5 (5–10), +6 (11–16), +7 (17 o más).</p>
    <p><select name="defensa">${opciones(op, elegido || sug || "ninguna")}</select> <label>bono <input type="number" name="defensaN" min="0" max="12" value="${n}" style="width:4em"></label> <button type="button" data-action="defensa">Guardar defensa</button></p>
    <p class="ecos-nota">Los jugadores no ven el número: ven que «la coraza se agrieta» cuando le ponen Brecha. Brecha (−2 CA), Grieta (−2 salvaciones) y Quebrado (sin defensa ni resistencias un turno) las ponen técnicas del Verbe y las acciones «Romper la guardia» y «Buscar la grieta».</p>`;
}

export function describir(tipo, v, actor = null, extra = {}) {
  if (["etapa", "car", "natModo", "segundaModo", "reservaModo", "familia", "principal"].includes(tipo))
    return explicarOpcion(tipo, v, { familias: FAMILIAS, linajes: D?.linajes, ramas: D?.ramas, linaje: extra?.linaje, nombreLegado }, escH);
  if (!v) return "<p class=\"ecos-nota\">Cambia la opción de arriba para ver qué es. No se elige hasta que pulses el botón.</p>";
  if (tipo === "fuerza") {
    const f = FUERZA[v]; if (!f) return "";
    return `<p><b>Sangre ${escH(f.nombre)}.</b> ${v === "ninguna" ? "No activa una herencia, sus dones ni sus naturalezas. Elegir un linaje sin sangre no concede esos beneficios." : `Esta fuerza permite técnicas de Sangre hasta grado ${f.grado}; tu nivel, rango y los requisitos de cada técnica pueden poner un límite menor. Cada subida de rango de Sangre cuesta ${f.extra ? `${f.extra} Trazo${f.extra > 1 ? "s" : ""} adicional${f.extra > 1 ? "es" : ""}` : "lo habitual, sin recargo"}. El don Mítico de Sangre puede superar este tope ordinario de grado; no supera tu nivel, el rango de rama ni los requisitos expresos de sangre Plena de una culminación.`}</p><p><b>Si el linaje es primigenio:</b> la fuerza también limita sus dones nuevos. Rastro usa el 25% de intensidad y crece solo hasta el umbral de nivel 1; Débil, el 50% hasta 5; Media, el 75% hasta 11; Plena, el 100% hasta 20. Estos umbrales no son etapas de Mirada. El don Mítico no convierte la sangre en Plena.</p>`;
  }
  if (tipo === "linaje") {
    if (!game.user.isGM) return "";
    const l = D.linajes.find(x=>x.id===v); if (!l) return "<p><b>Sin linaje:</b> no concede una herencia de sangre.</p>";
    const h = D.herencias?.find(x=>x.nombre===l.herencia);
    return `<p><b>${escH(l.alias ?? l.nombre)} · ${escH(l.real ?? l.nombre)}</b>${l.herencia ? ` — ${escH(l.herencia)}` : ""}</p>
      ${l.jerarquia ? `<p><b>Jerarquía:</b> ${l.id==="maethra"?"La mayor de los Primigenios":({primordial:"Primigenio",menor:"Dios menor",sueno:"Sueño divinizado"})[l.jerarquia]}. ${escH(D.panteon?.find(d=>d.id===l.id)?.texto)}${l.propuesto?" <b>Ampliación propuesta: pendiente del lore.</b>":""}</p>`:""}
      ${l.jerarquia==="primordial"?tablaSangreHTML(l):""}
      <p>${escH(h?.rasgo ?? (typeof l.rasgo === "string" ? l.rasgo : "Sus facultades dependen de los dones indicados en su ficha y de la historia."))}</p>
      <p>${l.nats?.length ? `Naturalezas concedidas: ${l.nats.map(nombreNat).join(", ")}. ` : ""}${l.maxMult ? `Reserva ×${l.maxMult}. ` : ""}${l.recMult ? `Recuperación ×${l.recMult} (también respeta el presupuesto de los cortos). ` : ""}${l.req ? `Abre Sangre con fuerza distinta de «Sin sangre» y permite técnicas que piden ${escH(l.req)}.` : l.id === LINAJE_ALA ? "<b>Su sangre también sostiene:</b> con cualquier fuerza distinta de «Sin sangre», el daño masivo no lo mata; queda Acechado por la Muerte con una Secuela −2. No desgasta la Barrera, no suma al Reloj y no tiene Eco." : "Este linaje no abre una herencia de Sangre por sí solo."}</p>
      ${h?.despertar ? `<p><b>Despertar:</b> ${escH(h.despertar)}</p>` : ""}`;
  }
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
  verbe: "Tu reserva. Cada técnica gasta Verbe al usarla. Crece con tu nivel y tu Constitución (su modificador por nivel). Tarda varios días en llenarse: cada Descanso Largo en el Santuario devuelve el 15 % de la reserva más tu modificador de Constitución por cada dos niveles (sin dotes, de 3 a 7 días). Respiro, Aliento y noches a la intemperie comparten un presupuesto breve de hasta la mitad de esa recuperación larga, renovado solo por un largo (Sueño reparador lo eleva hasta dos tercios). Sube sola con tu nivel.",
  trazos: "Tus puntos para crecer. Con ellos aprendes técnicas, subes rangos, compras dotes y cultivas. Ganas 4 por nivel, y a veces más por hitos de la historia o Monedas Antiguas. Lo que compras es para siempre.",
  car: "La característica con la que usas el Verbe. Da la CD de tus técnicas (8 + competencia + modificador) y su bonificador de ataque. La cantidad de Verbe (reserva y recuperación) va siempre con la Constitución.",
  grado: "Potencia de una técnica, de 0 a 11. Es distinto de tu nivel de personaje y de tu rango en una rama. Tu grado máximo sube con tu nivel: grado 1 al nivel 1, 2 al 3, 3 al 5, 6 al 11, 8 al 16, 9 al 18, 10 al 19 y 11 al 20. En cada rama, además, llegas solo hasta lo que deja tu rango.",
  sobre: "Puedes gastar Verbe que no tienes hasta el límite negativo que indique tu barra. Normalmente es la mitad de tu reserva; algunas dotes lo amplían. Cada técnica que usas en negativo te pide una salvación de CON (CD 10 + su grado); si fallas, ganas 1 Agotamiento. Lo que quede en negativo cuesta el doble de recuperar.",
  control: "Una habilidad de tu hoja basada en Inteligencia (Sabiduría o Carisma con su dote). Decide un choque cuando las potencias empatan entre dos técnicas, romper un Velo, abrir los Cerrojos y no perderse en la Quietud. Se compra en Mejorar → Especialidades."
};
const ayuda = k => `<i class="ecos-verbe-ayuda fa-solid fa-circle-question" tabindex="0" role="img" aria-label="${escH(AYUDA[k])}" data-tooltip="${escH(AYUDA[k])}"></i>`;
/** Una línea para entender la pestaña; lo largo, plegado; y el enlace a su parte de la guía escrita. */
const intro = (titulo, texto, mas = "", seccion = "") => `<div class="ecos-verbe-intro"><p><b>${titulo}</b> ${texto}${seccion ? ` <a class="ecos-verbe-guia" data-action="guia" data-s="${seccion}" data-tooltip="Abre la guía escrita en esa parte"><i class="fa-solid fa-book-open"></i> Guía</a>` : ""}</p>${mas ? `<details><summary>Saber más</summary>${mas}</details>` : ""}</div>`;

/* ------------------------------------------------------------------ */
/*  Guía escrita: Reglas de la casa · 10 · El Verbe                   */
/*  Solo la ven el DM y los dueños de un actor que despertó.          */
/* ------------------------------------------------------------------ */

const ID_REGLAS = "G0rD0J3JkpOkXM00";
const diarioReglas = () => game.journal.get(ID_REGLAS) ?? game.journal.find(j => /reglas de la casa/i.test(j.name));
const paginaGuia = () => diarioReglas()?.pages.find(p => p.getFlag(MOD, F)?.guiaRevision===3) ?? diarioReglas()?.pages.find(p => p.getFlag(MOD, F)?.guia) ?? null;
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
<li>Abre <b>Mis técnicas</b> para usarlas. También están en la sección «Técnicas del Verbe» de tu hoja. La ventana de uso comprueba el gasto al confirmar.</li>
<li>Si te equivocaste al comprar, pídeselo al DM: puede deshacerlo y devolverte los Trazos.</li></ol>
${h2("verbe-y-descansos", "Verbe y descansos")}
<ul><li>Tu reserva sube con tu nivel y suma tu modificador de <b>Constitución por cada nivel</b>, como los PG (3.27).</li>
<li>Tarda <b>varios días</b> en llenarse: en un Descanso Largo en el Santuario recuperas el <b>15 %</b> de la reserva más tu modificador de <b>Constitución por cada dos niveles</b> (con CON +0, de 5 a 7 días; con CON +3, unos 3); en una noche a la intemperie, hasta <b>la mitad de eso</b>. Noches, Aliento y Respiro comparten un presupuesto breve que solo se renueva con un largo.</li>
<li>Una <b>Moneda Antigua</b> devuelve 2 × tu competencia de Verbe, o se vuelve 1 Trazo (como mucho 2 por nivel).</li></ul>
${tablaG(["Nivel", ...[1, 2, 3, 5, 7, 9, 11, 13, 15, 17, 20].map(String)], [["Reserva base", ...[1, 2, 3, 5, 7, 9, 11, 13, 15, 17, 20].map(n => D.verbeMax[n] ?? D.verbeMax[String(n)])]])}
${h2("trazos", "Trazos")}
<p>Ganas 4 por nivel; quien despierta en el nivel N recibe 4 × N + 4 de una vez. El DM da más por hitos de la historia. Lo que compras es para siempre.</p>
${tablaG(["Qué", "Trazos"], [["Técnica de grado 0", "1"], ["Técnica de grado 1 a 11", "su grado"], ["Técnica rara o combinada", "+1"],
    ["Rango: Entrenado, Experto, Maestro, Legendario, Mítico", "1, 3, 5, 8 y 10 (1 menos en la rama principal; 1 más desde la tercera rama y 2 más desde la quinta)"],
    ["Dote", "2 a 4"], ["Control del Verbe: competencia y pericia", "2 y 3"], ["Afinidad: Entrenada y Maestra", "2 y 4"],
    ["Cultivo: Pulida, Dominada, Propia", "1, 2 y 3"], ["Cerrojo", "su grado"], ["Crear una técnica", "grado + 1"]])}
${h2("tecnicas-y-grados", "Técnicas y grados")}
<ul><li>Una técnica se usa como un conjuro: tiene acción, alcance, duración, ataque o salvación. Gasta Verbe en vez de un espacio.</li>
<li>El <b>grado</b> (0 a 11) es como el nivel de un conjuro, con dos grados más arriba del 9. El grado 6 llega al nivel 11; el 8 al 16, el 9 al 18, el 10 al 19 y el 11 al 20. Los aprendizajes altos también piden su senda de dotes y las ascensiones pertinentes. En cada rama llegas hasta lo que deja tu rango.</li>
<li>Puedes usar una técnica a un grado mayor pagando el Verbe de ese grado, hasta el límite de tu nivel y rango de rama. Una técnica concedida por la historia conserva su grado base.</li>
<li>Las de grado 0 casi no gastan, pero piden tener al menos 1 de Verbe. Las técnicas lanzadas a grado 6 o más tienen un uso alto por Descanso Largo y comparten los cupos de mayores (6–8) o culminaciones (9–11). Grado 11: uno en total por largo. Elevar consume el mismo cupo; no copia poderes, blancos ni área.</li>
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
<ul>${D.mejoras.map(m => `<li>${escH(textoClaro(m))}</li>`).join("")}</ul>
${h2("crear-tecnicas", "Crear técnicas")}
<p>Con Entrenado en una rama puedes inventar técnicas de esa rama, en Mejorar → Inventar una técnica. El menú propone un presupuesto según acción, alcance, área, estados y daño repetido. El DM aprueba; una excepción de balance queda registrada con su motivo. Cuesta grado + 1 Trazos (más combinaciones), días de entrenamiento y 25 o por grado. El oro y los días de creación o cultivo se resuelven en mesa antes de confirmar: el panel cobra los Trazos.</p>
${h2("control-y-sobreesfuerzo", "Control, choques y sobreesfuerzo")}
<ul><li><b>Control del Verbe</b> es una habilidad con Inteligencia (Sabiduría o Carisma con su dote): choques de técnicas, romper Velos, abrir Cerrojos, la Quietud.</li>
<li><b>Choque</b>: se resuelve en este orden.<ol>${PASOS_CHOQUE.map(([t,d])=>`<li><b>${escH(t)}.</b> ${escH(d)}</li>`).join("")}</ol>El DM puede elegir la regla clásica de prioridad elemental en los ajustes.</li>
<li><b>Sobreesfuerzo</b>: puedes gastar Verbe que no tienes, hasta la mitad de tu reserva en negativo. Cada gasto en negativo, incluidas defensas y Cerrojos, pide CON (CD 10 + grado, antes de dones) o 1 Agotamiento. Con Agotamiento 4 no se permite. Todas las fuentes recuperan la deuda a razón de 2 por punto; un punto impar se guarda para la próxima recuperación.</li></ul>
${h2("siete-cerrojos", "Ocho Cerrojos")}
<p>Un estado de Cuerpo. Se abre con una acción adicional y una prueba de Control (CD 10 + 2 × el cerrojo que abres) y dura 1 minuto. Lo que dan se acumula; los PG por turno y el Agotamiento al cerrar son los del más alto.</p>
<ul><li><b>En orden:</b> cada acción adicional abre hasta 2 cerrojos más de los que tienes abiertos (3 con Maestro en Cuerpo), y cada vez pagas el Verbe del nuevo.</li>
<li><b>El mismo día:</b> si los abres por segunda vez entre dos Descansos Largos, al cerrar sumas 1 Agotamiento más.</li>
<li><b>Séptimo:</b> conmoción, con 16 PG por turno y 3 de Agotamiento al cerrar. <b>Octavo:</b> muerte del cuerpo original al terminar; solo una intervención excepcional del DM puede evitar ese precio. Debes confirmarlo antes de abrirla.</li>
<li><b>Se mejoran con:</b> los dones de Cuerpo (Legendario: los PG por turno a la mitad), la escuela de los Cerrojeros (el primero sin prueba ni PG, y duran 2 minutos) y la dote Cerrojo temprano.</li></ul>
${tablaG(["Cerrojo", "Grado", "Da", "PG por turno", "Al cerrar"], D.cerrojos.map(c => [`${c.n} · ${escH(c.nombre)}`, c.grado, escH(c.da), c.pg || "—", escH(c.cierre)]))}
${h2("defensas", "Sustitución y otras defensas")}
<p>Con midi-qol, cuando un ataque te va a impactar aparece un aviso con las defensas que sabes y su costo exacto (Sustitución, Cortina de agua, Escudo de piedra, Paso falso, Leer el golpe y otras). Usar una gasta tu reacción. Sin esa integración se resuelven en mesa; el DM debe comprobar también los críticos y la posición del objeto de Sustitución.</p>
<ul><li><b>Sustitución</b>: el ataque falla y golpea un objeto. Cuesta 2 Verbe, y 2 más por cada grado que el ataque supere tu grado máximo. El grado de un ataque es el de su técnica o conjuro; si es un arma o una criatura, la mitad de su nivel o VD. Pide un objeto de tu tamaño o menor a 10 ft. No sirve contra áreas ni salvaciones, salvo con la dote Sustitución amplia.</li>
<li>Las demás suben tu CA contra ese ataque o le dan desventaja.</li></ul>
${h2("dones-despertar", "Dones del despertar")}
<p>Todo el que despierta tiene cuatro dones desde el primer día (Mejorar → Dotes, «Dones del despertar»). No cuestan nada y se mejoran con Trazos:</p>
<ul><li><b>Sentido del Verbe:</b> al tocar a alguien sabes si despertó, y notas el Verbe que se usa a 5 ft. Crece con Sentir el Verbe (30 ft) y Sentir más lejos (120 ft).</li>
<li><b>Cuerpo despierto:</b> el sobreesfuerzo te cuesta menos (CD 9 + grado). II y III: más PG máximos.</li>
<li><b>Aliento del Verbe:</b> cada Dado de Golpe que gastas al descansar te devuelve 1 de Verbe (2 con el II); con el III, además cura tu modificador de Verbe.</li>
<li><b>Paso del Verbe:</b> con al menos 1 de Verbe andas un turno por paredes o sobre agua quieta. II: +10 ft de velocidad y el agua movida también te sostiene. III: saltos triples y caídas sin daño.</li></ul>
${h2("titeres-y-medicina", "Títeres y medicina")}
<p>Dos artes finas de Control, con dotes en tres pasos (Mejorar → Dotes, «Títeres y medicina»):</p>
<ul><li><b>Títeres (rama Hilo):</b> Titiritero, Titiritero de oficio y Maestro titiritero. Las marionetas se compran y se mejoran con oro (Equipo): blindaje, muelles, depósitos y ojos de vidrio.</li>
<li><b>Medicina (rama Pulso, con Control fino):</b> Médico del Verbe, Médico de oficio y Cirujano del Verbe. Con el maletín de cirujano, cuentas como si llevaras un kit de sanador.</li></ul>
${h2("lo-mas-fuerte", "Lo más fuerte crece contigo")}
<ul><li>Las técnicas más fuertes tienen una <b>escalera</b>: una versión chica que se aprende temprano y otras más grandes después. La ficha de cada técnica dice «Crece» con su escalera.</li>
<li>Las que atan, duermen, sellan o mandan sobre otro, como la Sustitución, <b>cuestan más contra alguien más fuerte que tú</b>: 2 Verbe más por cada grado que su grado (la mitad de su nivel o VD) pase de tu grado máximo. Contra lo chico sirven desde el principio.</li>
<li>Cada técnica y cada dote dicen al final <b>«Se mejora con»</b>: el grado, el rango de su rama, la afinidad, el cultivo, las dotes y la escuela que la hacen crecer.</li></ul>
${h2("cargadas", "Técnicas cargadas y Canalizando")}
<p>Algunas técnicas se <b>cargan</b> antes de soltarlas (su ficha dice «Cargada»). En Mis técnicas pulsa <b>Canalizar</b>: pagas su Verbe y quedas <b>Canalizando</b> (velocidad 0, sin reacciones ni choques). Cada uno de tus turnos suma 1 de carga hasta su máximo; desde la carga mínima pulsas <b>Liberar</b> y la técnica sale con lo que sume la carga (dados, ataque o CD). Si recibes daño, salvación de Constitución (CD 10 o la mitad del daño, la mayor) o pierdes la carga y el Verbe pagado; también si quedas incapacitado o te mueven a la fuerza. No es lo mismo que «Cargado», el estado del Rayo.</p>
${h2("etapas", "Etapas del Verbe y tu naturaleza")}
<p>Nadie usa el Verbe solo. Cuando encuentras a alguien que te enseñe (un maestro o un aprendiz), el DM abre tu siguiente <b>etapa</b>: ${ETAPAS.filter(x => x.n > 0).map(x => `<b>${x.nombre}</b> (${Number.isFinite(x.ramas) ? `${x.ramas} rama${x.ramas === 1 ? "" : "s"}, hasta grado ${x.grado}` : "sin límite"})`).join(", ")}.</p>
<p>Tu <b>naturaleza</b> (tu elemento) y la segunda están ocultas hasta que las descubres <b>entrenando</b>: desde nivel 5, o nivel 3 con Entrenado en Forma, y en etapa Practicante. La primera pide ${DESCUBRIR.primera.dias} días y una prueba de Control del Verbe CD ${DESCUBRIR.primera.cd} (${DESCUBRIR.primera.trazos} Trazos si la superas); la segunda, ${DESCUBRIR.segunda.dias} días y CD ${DESCUBRIR.segunda.cd} (${DESCUBRIR.segunda.trazos} Trazos). Hasta entonces aprendes técnicas sin elemento. La técnica <b>Cambiar naturaleza del Verbe</b> (3 Trazos) cambia una naturaleza por otra con 7 días y CD 15.</p>
${h2("naturaleza-propia", "Tu naturaleza de nacimiento")}
<p>La primera naturaleza que despertó en ti es la tuya: sus técnicas (y las que infundes con ella) cuestan <b>1 Verbe menos</b>, nunca menos de 1. La segunda naturaleza y las combinaciones cuestan lo normal.</p>
${h2("el-clima", "El clima")}
<p>Al aire libre el clima del día fortalece o merma los elementos. <b>Se fortalece</b>: sus técnicas cuestan 1 Verbe menos (mínimo 1). <b>Se merma</b>: cuestan 1 Verbe más. Si algo lo ayuda y algo lo estorba a la vez, se anulan. La tarjeta del clima dice cada día, a todos, qué elementos cambian (o que ninguno cambia). Bajo techo no cuenta, y las Miradas, los Sellos y los Pactos no dependen del clima.</p>
<table><tr><th>Elemento</th><th>Se fortalece con</th><th>Se merma con</th></tr><tr><td><b>Fuego</b></td><td>calor seco (25 °C o más, sin lluvia ni niebla), viento fuerte con cielo seco, tormenta seca, incendio</td><td>lluvia, aguacero, tormenta, aguanieve, nevada, ventisca, frío extremo (−18 °C o menos)</td></tr><tr><td><b>Agua</b></td><td>llovizna, lluvia, aguacero, tormenta, aguanieve</td><td>calor seco (30 °C o más con cielo seco), polvo, humo de incendio, helada sin lluvia (el agua se congela)</td></tr><tr><td><b>Viento</b></td><td>viento fuerte, vendaval, ventisca, tornado, polvo</td><td>aire quieto: calma con niebla, con nubes o con 30 °C o más</td></tr><tr><td><b>Tierra</b></td><td>polvo, tierra seca y firme (despejado o nublado con 20 °C o más), suelo helado sin nieve</td><td>barro (lluvia, aguacero, tormenta), nieve acumulada (nevada, ventisca)</td></tr><tr><td><b>Rayo</b></td><td>tormenta, tormenta seca, granizo, polvo, aire seco y frío (0 °C o menos sin lluvia ni nieve)</td><td>humedad quieta: niebla o llovizna sin viento fuerte</td></tr><tr><td><b>Escarcha</b></td><td>helada (0 °C o menos), aguanieve, nieve, nevada, ventisca, granizo</td><td>calor (30 °C o más), incendio</td></tr><tr><td><b>Raíz</b></td><td>tierra mojada: llovizna, lluvia, aguacero o tormenta sin helada</td><td>suelo helado (−5 °C o menos), sequía (calor seco), polvo</td></tr><tr><td><b>Madera</b></td><td>humedad (niebla, llovizna), lluvia templada (8 a 29 °C)</td><td>incendio, tormenta seca, vendaval, tornado, savia congelada (−5 °C o menos)</td></tr><tr><td><b>Magma</b></td><td>roca seca y tibia (20 °C o más, sin lluvia ni niebla), incendio</td><td>lluvia, aguacero, tormenta, aguanieve, nevada, ventisca, frío extremo</td></tr><tr><td><b>Vapor</b></td><td>niebla, calor húmedo (18 °C o más con lluvia o nubes)</td><td>helada (0 °C o menos), vendaval, ventisca, tornado</td></tr><tr><td><b>Ceniza</b></td><td>incendio, tormenta seca, viento fuerte con cielo seco o nublado</td><td>lluvia, aguacero, tormenta, aguanieve, nevada, ventisca</td></tr><tr><td><b>Tormenta</b></td><td>tormenta, tormenta seca, tornado, granizo, vendaval, nubes que corren (nublado con viento fuerte)</td><td>cielo quieto: calma con niebla, cielo despejado o 30 °C o más</td></tr><tr><td><b>Hierro</b></td><td>tormenta, tormenta seca, frío seco (0 °C o menos sin lluvia ni nieve)</td><td>humedad que oxida: niebla, llovizna, aguanieve</td></tr><tr><td><b>Corriente</b></td><td>lluvia, aguacero, tormenta</td><td>aire seco (polvo, calor seco), agua congelada (−5 °C o menos sin lluvia)</td></tr><tr><td><b>Destello</b></td><td>sol fuerte (despejado con 15 °C o más), tormenta seca</td><td>lo que no deja ver: niebla, polvo, humo, nevada, ventisca</td></tr><tr><td><b>Arena</b></td><td>polvo, viento fuerte con cielo seco o nublado, arena caliente (30 °C o más con cielo seco)</td><td>arena mojada: lluvia, aguacero, tormenta, aguanieve, nevada, ventisca</td></tr></table>
${h2("linajes-y-miradas", "Herencias y Miradas")}
<p>Algunas sangres traen poderes que no se compran ni se enseñan: <b>herencias</b> y <b>ojos</b> (Miradas). Si tienes una, lo sabrás jugando, y desde ese día su rama se abre en tu panel con todo explicado. Quién la tiene y de dónde viene no tienes manera de saberlo: lo decide la historia.</p>
<ul><li><b>Una herencia</b> trae un rasgo que siempre está (una resistencia, más reserva, una naturaleza de más…), sus técnicas propias (se pagan con Trazos como las demás) y el <b>Despertar del linaje</b>: durante 1 minuto tomas otra forma con lo que da tu sangre, y al terminar ganas 1 Agotamiento. La <b>fuerza</b> de la sangre dice hasta qué grado llegan sus técnicas: plena 9, media 5, débil 3, rastro 1.</li>
<li><b>Una Mirada</b> progresa por etapas. Su panel muestra cuántas tiene, sus precios y niveles; no todas las Miradas avanzan igual. El DM concede los hitos necesarios. Las técnicas marcadas como incluidas llegan con su etapa; las demás se aprenden por separado. Se abre con una acción adicional y mantenerla cuesta 1 Verbe por minuto. Un ojo trasplantado cuesta el doble, salvo con Injerto aceptado.</li>
<li>Las técnicas de los ojos que mandan, duermen o atan también cuestan más contra alguien más fuerte que tú.</li></ul>
${h2("lo-que-no-sabes", "Lo que no sabes")}
<p>Hay cosas que no tienes manera de saber todavía: de dónde viene tu sangre, si tu Verbe responde a otra naturaleza, qué despierta en ti con el tiempo. Si existen, aparecen jugando.</p>`;
}

/** Quién ve la guía y el compendio: el DM y los dueños de un actor que despertó. */
function quienVeGuia() {
  const ownership = { default: CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE };
  for (const u of game.users.filter(x => !x.isGM)) {
    const ve = (MODO === "activo") && game.actors.some(a => despierto(a) && a.testUserPermission(u, "OWNER"));
    ownership[u.id] = ve ? CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER : CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE;
  }
  return ownership;
}

/** Crea o pone al día la guía, los dos compendios (3.11) y quién los ve. */
export async function asegurarGuia() {
  await asegurarGuiaPagina();
  await asegurarCompendios().catch(err => console.error(`${MOD} | compendios del Verbe`, err));
}

/**
 * 4.5b y 4.5c (3.11): «11 · Compendio del Verbe» en las reglas de la casa, con los mismos permisos que la guía, y un
 * diario aparte «Ecos · Compendio del Verbe (solo DM)». Se crean una vez; solo se reescriben si nadie los editó.
 */
export async function asegurarCompendios() {
  // Con la capa del Verbe apagada no se crea nada: los compendios solo sirven si se juega con el Verbe.
  if (!soyGM() || !D || !globalThis.JournalEntry || MODO !== "activo") return null;
  const HTML = CONST.JOURNAL_ENTRY_PAGE_FORMATS.HTML;
  const poner = async (diario, bandera, nombre, html, ownership, orden) => {
    const pag = diario.pages.find(p => p.getFlag(MOD, F)?.[bandera]);
    if (!pag) {
      const [nueva] = await diario.createEmbeddedDocuments("JournalEntryPage", [{ name: nombre, type: "text", ...(orden != null ? { sort: orden } : {}), ownership,
        text: { content: html, format: HTML }, flags: { [MOD]: { [F]: { [bandera]: 1, [`${bandera}Huella`]: huellaTexto(html) } } } }]);
      return nueva;
    }
    const cambios = {};
    const intacta = huellaTexto(pag.text?.content ?? "") === pag.getFlag(MOD, F)?.[`${bandera}Huella`];
    if (pag.text?.content !== html && intacta) { cambios["text.content"] = html; cambios[`flags.${MOD}.${F}.${bandera}Huella`] = huellaTexto(html); }
    if (Object.entries(ownership).some(([k, v]) => (pag.ownership?.[k] ?? CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE) !== v)) cambios.ownership = ownership;
    if (Object.keys(cambios).length) await pag.update(cambios);
    return pag;
  };
  const reglas = diarioReglas();
  const jugadores = reglas ? await poner(reglas, "compendio", "11 · Compendio del Verbe", compendioJugadoresHTML(D), quienVeGuia(),
    Math.max(0, ...reglas.pages.map(p => p.sort ?? 0)) + 100000) : null;
  const nadie = { default: CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE };
  for (const u of game.users.filter(x => !x.isGM)) nadie[u.id] = CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE;
  let diarioDM = game.journal.find(j => j.getFlag(MOD, "compendioDM"));
  if (!diarioDM) diarioDM = await JournalEntry.create({ name: "Ecos · Compendio del Verbe (solo DM)", ownership: nadie, flags: { [MOD]: { compendioDM: 1 } }, pages: [] });
  else if (Object.entries(nadie).some(([k, v]) => (diarioDM.ownership?.[k] ?? 0) !== v)) await diarioDM.update({ ownership: nadie }, { diff: false, recursive: false });
  const dm = await poner(diarioDM, "compendioDM", "Compendio del Verbe (solo DM)", compendioDMHTML(D), nadie, null);
  return { jugadores, dm };
}

async function asegurarGuiaPagina() {
  if (!soyGM() || !D) return;
  const diario = diarioReglas();
  if (!diario) return;
  const ownership = quienVeGuia();
  const html = htmlGuia();
  const pag = paginaGuia();
  if (!pag || pag.getFlag(MOD,F)?.guiaRevision!==3) {
    const orden = Math.max(0, ...diario.pages.map(p => p.sort ?? 0)) + 100000;
    await diario.createEmbeddedDocuments("JournalEntryPage", [{ name: "10 · El Verbe · guía revisada", type: "text", sort: orden, ownership,
      text: { content: html, format: CONST.JOURNAL_ENTRY_PAGE_FORMATS.HTML }, flags: { [MOD]: { [F]: { guia: 1,guiaRevision:3,guiaHuella:huellaTexto(html) } } } }]);
    return;
  }
  const cambios = {};
  if (pag.text?.content !== html && huellaTexto(pag.text?.content??'')===pag.getFlag(MOD,F)?.guiaHuella) {cambios["text.content"] = html;cambios[`flags.${MOD}.${F}.guiaHuella`]=huellaTexto(html);}
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
export const clavePanelVerbe=actor=>actor.uuid??actor.id;
export function abrirPanel(actor, pestana) {
  if (!activo()) return;
  const clave=clavePanelVerbe(actor);let p = paneles.get(clave);
  if (!p) { p = new PanelVerbe(actor); paneles.set(clave, p); }
  if (pestana) p.pestana = pestana;
  return p.render({ force: true });
}
/** Uso rápido: lista las técnicas aprendidas y las usa sin abrir la hoja ni el panel (botón «Verbe» de la barra izquierda). */
export async function usoRapido(actor) {
  if (!activo()) return;
  if (!actor || !despierto(actor) || !actor.isOwner) return aviso("Selecciona un token propio con el Verbe despierto, o elige tu personaje.", "warn");
  const filas = itemsTecnica(actor).map(i => ({ i, m: i.getFlag(MOD, F) })).sort((x, y) => (x.m.g - y.m.g) || x.i.name.localeCompare(y.i.name, "es"));
  if (!filas.length) return aviso(`${actor.name} aún no tiene técnicas aprendidas.`, "info");
  // 3.27: cada fila dice qué gasta (acción Verbe, reacción Verbe o tiempo fuera de combate), su alcance, cuánto dura y para qué sirve.
  const DUR = { inst: "instantánea", round: "asalto", minute: "min", hour: "h", day: "día", perm: "permanente", spec: "especial" };
  const fila = ({ i, m }) => {
    let costo = "?"; try { costo = previsualizarUso(actor, m).costo; } catch { /* sin vista previa */ }
    const tec = tecnicaPorId(m.id, actor), tKey = tec?.t ?? ({ action: "A", bonus: "AA", reaction: "R" }[i.system?.activation?.type] ?? "A");
    const [tiempo, expl] = TIEMPOS_EXPLICADOS[tKey] ?? [TIEMPO_L[tKey] ?? tKey, ""];
    const r = i.system?.range ?? {}, alc = r.units === "self" ? "sobre ti" : r.units === "touch" ? "toque" : r.value ? `${r.value} ${r.units === "ft" ? "ft" : r.units}` : "";
    const d = i.system?.duration ?? {}, dur = d.units === "inst" ? "instantánea" : d.value ? `${d.value} ${DUR[d.units] ?? d.units}${Number(d.value) > 1 && ["round", "day"].includes(d.units) ? "s" : ""}` : (DUR[d.units] ?? "");
    const conc = (i.system?.properties?.has?.("concentration") || i.system?.properties?.includes?.("concentration")) ? " · concentración" : "";
    const resumen = String(textoDe(tec ?? { texto: "" }) ?? "").split(/(?<=\.)\s/)[0].slice(0, 160);
    return `<li><button type="button" data-id="${escH(m.id)}" class="ecos-uso-${gastoVerbe(tKey) ?? "largo"}">
      <span class="nom">${escH(i.name)}</span>
      <small class="gasto"><b>${escH(tiempo)}</b> · ${costo} Verbe · grado ${m.g}${alc ? ` · ${escH(alc)}` : ""}${dur ? ` · dura ${escH(dur)}` : ""}${conc}</small>
      ${expl ? `<small class="expl">${escH(expl)}</small>` : ""}
      ${resumen ? `<small class="res">${escH(resumen)}</small>` : ""}</button></li>`;
  };
  const grupos = [["accion", `Con tu acción Verbe (${maxAccionesVerbe(actor) === 1 ? "una" : maxAccionesVerbe(actor)} por turno)`, f => gastoVerbe(tecnicaPorId(f.m.id, actor)?.t ?? "A") === "accion"],
    ["adicional", "Con tu acción adicional Verbe (una por turno)", f => gastoVerbe(tecnicaPorId(f.m.id, actor)?.t ?? "A") === "adicional"],
    ["reaccion", "Con tu reacción Verbe (una por ronda)", f => gastoVerbe(tecnicaPorId(f.m.id, actor)?.t ?? "") === "reaccion"],
    ["largo", "Fuera del turno (minutos, horas o rituales)", f => !gastoVerbe(tecnicaPorId(f.m.id, actor)?.t ?? "A")]];
  const lista = grupos.map(([k, titulo, prueba]) => { const fs = filas.filter(prueba); return fs.length ? `<li class="ecos-uso-grupo"><b>${titulo}</b></li>${fs.map(fila).join("")}` : ""; }).join("");
  const cabecera = () => `<p><b>Reserva:</b> <span data-ecos-reserva>${Number(estado(actor)?.valor) || 0} / ${maxVerbe(actor)}</span></p>${turnoVerbeHTML(actor)}
    <details class="ecos-uso-ayuda"><summary>¿Cómo funcionan las acciones del Verbe?</summary><ul>
      <li><b>Acción Verbe:</b> cada turno tienes ${maxAccionesVerbe(actor) === 1 ? "una" : maxAccionesVerbe(actor)} para las técnicas de Acción. No gasta tu Acción de D&D: puedes atacar y además usar una técnica.</li>
      <li><b>Acción adicional Verbe:</b> una por turno para las técnicas de Acción adicional. No gasta tu Acción adicional de D&D ni tu acción Verbe.</li>
      <li><b>Reacción Verbe:</b> una por ronda, aparte de tu Reacción de D&D (ataque de oportunidad, Escudo…). La gastan las técnicas de reacción (Sustitución, Liberar el Velo), las defensas y el <b>Choque</b>: con la reacción Verbe transformas en reacción una técnica tuya de acción o de acción adicional y la lanzas contra la que viene, generando un choque de técnicas.</li>
      <li><b>El orden del turno no cambia:</b> la iniciativa es la de siempre. Las tres se renuevan al empezar tu turno. Desde el nivel 11 tienes dos acciones Verbe por turno.</li>
      <li><b>Gratuito:</b> pagar Verbe, mantener una técnica activa o una concentración, y leer tu panel. Moverte e interactuar con un objeto siguen siendo de D&D.</li>
      <li><b>Más de un turno</b> (1 minuto o más): no caben en un combate; úsalas antes o después.</li></ul></details>`;
  const { DialogV2 } = foundry.applications.api;
  await DialogV2.wait({
    window: { title: `Verbe · ${actor.name}`, resizable: true }, position: { width: 460 },
    content: `<div class="ecos-uso-cab">${cabecera()}</div><ul class="ecos-uso-rapido" style="list-style:none;margin:0;padding:0;display:grid;gap:4px">${lista}</ul>`,
    buttons: [{ action: "cerrar", label: "Cerrar", default: true }],
    render: (ev, dialog) => {
      const el = dialog.element;
      el.querySelectorAll(".ecos-uso-rapido button").forEach(b => b.addEventListener("click", async e => {
        e.preventDefault(); b.disabled = true;
        try { await usarTecnica(actor, b.dataset.id); } catch (err) { console.error(`${MOD} | uso rápido`, err); aviso("No se pudo usar la técnica. Puedes intentarlo desde tu hoja.", "error"); }
        finally { b.disabled = false; const c = el.querySelector(".ecos-uso-cab"); if (c) setTimeout(() => { c.innerHTML = cabecera(); }, 600); }
      }));
    },
    rejectClose: false
  });
}
const esperaPanel = {};
function refrescarPanel(id) {
  clearTimeout(esperaPanel[id]);
  esperaPanel[id] = setTimeout(() => { for(const [clave,p]of paneles)if((clave===id||p.actor.id===id)&&p.rendered)p.render(); }, 150);
}
export function abrirOferta(actor,id){
  if(!editarActor(actor)||!despierto(actor)||!ofertasActor(actor).some(t=>t.id===id))return aviso('Esta ficha no tiene acceso a esa técnica. Revisa su despertar con el DM.','warn');
  const clave=clavePanelVerbe(actor);let p=paneles.get(clave);if(!p){p=new PanelVerbe(actor);paneles.set(clave,p);}
  const t=tecnicaPorId(id,actor);p.pestana=conoce(actor,id)?'jugar':'tienda';
  p.filtro={rama:'',grado:'',nat:'',texto:t.n,solo:false,agrupar:'rama'};p.filtroUso={texto:t.n,solo:false};p.abiertos=null;
  return p.render({force:true});
}

const correr = (app, promesa) => Promise.resolve(promesa).then(() => app.render())
  .catch(err => { console.error(`${MOD} | capa V`, err); aviso("Algo falló (el detalle está en la consola, F12).", "error"); });
const valorDe = (app, nombre) => app.element.querySelector(`[name="${nombre}"]`)?.value ?? "";
const marcado = (app, nombre) => !!app.element.querySelector(`[name="${nombre}"]`)?.checked;
const cuentaEntreno = a => { const e = estado(a) ?? {}; return Object.keys(e.estudios ?? {}).length + Object.keys(e.entrenosDote ?? {}).length + (e.entrenoNat ? 1 : 0); };
const confirmar = (titulo, html) => foundry.applications.api.DialogV2.confirm({ window: { title: titulo }, content: html, rejectClose: false });
const ELECCION = {
  nat: { titulo: "naturaleza", pares: () => Object.entries(NATS) },
  principal: { titulo: "rama principal", pares: () => ramasLibres() }
};

export class PanelVerbe extends foundry.applications.api.ApplicationV2 {
  constructor(actor) {
    super({ id: `ecos-verbe-${clavePanelVerbe(actor).replace(/[^A-Za-z0-9_-]/g,'-')}`, window: { title: `El Verbe · ${actor.name}`, icon: "fa-solid fa-droplet" } });
    this.actor = actor;
    this.pestana = "resumen";
    this.comoJugador = false;
    this.filtro = { rama: "", grado: "", nat: "", texto: "", solo: true, agrupar: "rama" };
    this.filtroDote = { texto: "", solo: true };
    this.filtroUso = { texto: "", solo: false, tipo: "todas" };
    this.abiertos = null; // grupos desplegados (null: los que tienen algo para aprender)
  }

  static DEFAULT_OPTIONS = {
    classes: ["ecos-verbe-panel"],
    window: { resizable: true },
    position: { width: 940, height: 790 },
    actions: {
      pestana(ev, t) { this.pestana = t.dataset.p; this.abiertos = null; this.render(); },
      tipoUso(ev, t) { this.filtroUso.tipo = t.dataset.t || "todas"; this.render(); },
      actUso(ev, t) { this.filtroUso.act = t.dataset.t || "todas"; this.render(); },
      monedasTrazos(ev) { ev?.preventDefault?.(); Promise.resolve(game.modules.get(MOD).api?.mercader?.trazos?.(this.actor)).catch(err => console.error(`${MOD} | monedas por Trazos`, err)).finally(() => setTimeout(() => this.render(), 800)); },
      favorita(ev, t) {
        ev?.preventDefault?.();
        const id = t.dataset.id, favs = new Set(estado(this.actor)?.favoritas ?? []);
        if (favs.has(id)) favs.delete(id); else favs.add(id);
        Promise.resolve(guardar(this.actor, { favoritas: [...favs] })).catch(err => console.error(`${MOD} | favoritas`, err)).finally(() => this.render());
      },
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
      usarDote(ev,t) { correr(this,usarDote(this.actor,t.dataset.id)); },
      reorientarDM() { correr(this,reorientarCultivo(this.actor,valorDe(this,"reorientarTecnica"),valorDe(this,"reorientarMejora"))); },
      usarReplica(ev,t) { correr(this,usarTecnica(this.actor,t.dataset.id,{replica:true})); },
      almacenar() { correr(this,almacenarVerbe(this.actor,Number(valorDe(this,"depositarVerbe")))); },
      cerrarReplicas() { const ef=efectoV(this.actor,"replicas");if(ef)correr(this,ef.delete()); },
      shinobiDM(ev,t) { correr(this,concederShinobi(this.actor,t.dataset.campo,valorDe(this,t.dataset.de),valorDe(this,"shinobiVinculo"))); },
      artefactoDM() { correr(this,concederArtefacto(this.actor,valorDe(this,"shinobiArtefacto"))); },
      transferirDM() { correr(this,transferirVerbe(this.actor,game.actors.get(valorDe(this,"shinobiDestino")),Number(valorDe(this,"shinobiCantidad")))); },
      aprender(ev, t) {
        ev?.preventDefault?.();
        const tec = tecnicaPorId(t.dataset.id, this.actor);
        const r = requisitos(this.actor, tec);
        if (!r.ok) return rechazar(r.motivo, "warn");
        if (r.pideDM && !game.user.isGM) return pedirAlDM(this.actor, "tecnica", { id: tec.id }, tec.n, `${escH(tec.n)} (${tec.trazos} Trazos). Pide: ${escH(tec.req ?? "")}.`);
        correr(this, aprender(this.actor, tec));
      },
      practicar(ev, t) { ev?.preventDefault?.(); correr(this, practicarEstudio(this.actor, t.dataset.id)); },
      vistazo(ev, t) { ev?.preventDefault?.(); vistazoRama(this.actor, t.dataset.rama); },
      aprenderYa(ev, t) { ev?.preventDefault?.(); correr(this, aprenderYa(this.actor, t.dataset.id)); },
      tirarNat(ev) { ev?.preventDefault?.(); correr(this, tirarNaturaleza(this.actor)); },
      pedirTiradaNat() { correr(this, pedirTiradaNaturaleza(this.actor)); },
      segundaModo() { correr(this, guardar(this.actor, { segundaModo: valorDe(this, "segundaModo") === "fija" ? "fija" : "dado" })); },
      async defensa() { const sel = this.element.querySelector('select[name="defensa"]'), n = this.element.querySelector('input[name="defensaN"]'); await ponerDefensa(this.actor, sel?.value ?? "ninguna", Number(n?.value) || null); this.render(); },
      alInstante() { const e = estado(this.actor); correr(this, guardar(this.actor, { aprenderAlInstante: !e.aprenderAlInstante, historial: hist(e, e.aprenderAlInstante ? "Vuelve a aprender por días" : "Aprende al instante (creación de personaje)") })); },
      probar(ev, t) {
        ev?.preventDefault?.();
        const tec = tecnicaPorId(t.dataset.id, this.actor);
        correr(this, probarNaturaleza(this.actor, tec).then(ok => (ok && requisitos(this.actor, tec).ok ? aprender(this.actor, tec) : null)));
      },
      dote(ev, t) { ev?.preventDefault?.(); correr(this, comprarDote(this.actor, t.dataset.id)); },
      entrenarDote(ev, t) { ev?.preventDefault?.(); correr(this, entrenarDote(this.actor, t.dataset.id)); },
      terminarDote(ev, t) { ev?.preventDefault?.(); correr(this, terminarDoteYa(this.actor, t.dataset.id)); },
      cancelarDote(ev, t) { ev?.preventDefault?.(); confirmar("Dejar de entrenar", "<p>Se devuelven los Trazos y se pierde el avance.</p>").then(ok => ok && correr(this, cancelarEntrenoDote(this.actor, t.dataset.id))); },
      async tipoDote(ev, t) { ev?.preventDefault?.(); ev?.stopPropagation?.(); if (await marcarTipoDote(t.dataset.id, t.dataset.tipo)) this.render(); },
      abrirRama(ev, t) { ev?.preventDefault?.(); correr(this, abrirRama(this.actor, t.dataset.rama)); },
      async ctlCar(ev, t) { ev?.preventDefault?.(); if (await caracteristicaControl(this.actor, t.dataset.car)) this.render(); },
      crecer(ev, t) { ev?.preventDefault?.(); correr(this, diaDeCrecimiento(this.actor, { actividad: valorDe(this, "crecerActividad") || "meditar", sensei: !!this.element.querySelector('[name="crecerSensei"]')?.checked, companero: !!this.element.querySelector('[name="crecerCompanero"]')?.checked })); },
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
            if (!(modoNaturaleza(e) === "visible" && !(e.nats ?? []).length) && !e.elegirNat) { rechazar("Tu naturaleza se descubre entrenando (Mejorar → Tus elementos).", "warn"); return null; }
            if (e.elegirNat === "segunda") {
              if (natsDe(this.actor).has(v)) { rechazar("Esa ya es tu naturaleza.", "warn"); return null; }
              return { oc: revolver(v, this.actor.id), elegirNat: null, descubierta: true, historial: hist(e, `Descubre su segunda naturaleza: ${NATS[v]}`) };
            }
            let oc = ocultaDe(this.actor);
            if (oc === v) oc = otraNat(v);
            return { nats: [v], oc: revolver(oc, this.actor.id), elegirNat: null, historial: hist(e, `Elige su naturaleza: ${NATS[v]}${t.dataset.destino ? " (el destino)" : ""}`) };
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
      naturalezaExtra(ev, t) { correr(this, elegirNaturalezaAdicional(this.actor, t.dataset.tipo, valorDe(this, t.dataset.tipo === "tercera" ? "terceraElegir" : "comboElegir"))); },
      moneda(ev, t) { correr(this, gastarMoneda(this.actor, t.dataset.uso)); },
      cerrojo(ev, t) { correr(this, abrirCerrojo(this.actor, Number(t.dataset.n))); },
      cerrar() { const ef = efectoV(this.actor, "cerrojo"); if (ef) correr(this, ef.delete()); },
      aprenderCerrojo() { correr(this, aprenderCerrojo(this.actor)); },
      rearmar() { correr(this, refrescar(this.actor).then(() => asegurarRasgos(this.actor))); },
      // DM
      editorCatalogo() { abrirEditorCatalogo(); },
      reliquiasDM() { abrirReliquias(this.actor); },
      async panteonDM() { if(!game.user.isGM)return; const nota=await asegurarNotaPanteon(D);if(nota)nota.diario.sheet.render({force:true,pageId:nota.pagina.id}); },
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
      diarioLinaje() { abrirSangre("linaje", valorDe(this, "linaje"), this.actor); },
      diarioFamilia(ev, t) { abrirFamilia(t?.dataset?.familia || valorDe(this, "familia")); },
      familia() { correr(this, concederShinobi(this.actor, "familia", valorDe(this, "familia"))); },
      linaje() {
        const c = conflictoSangre(this.actor, { linaje: valorDe(this, "linaje") });
        if (c) return rechazar(c, "warn");
        correr(this, guardar(this.actor, { linaje: valorDe(this, "linaje"), fuerza: valorDe(this, "fuerza"), linajeVisible: marcado(this, "linajeVisible") })
          .then(() => asegurarRasgos(this.actor)).then(() => refrescar(this.actor)));
      },
      oculta() { correr(this, guardar(this.actor, { oc: revolver(valorDe(this, "oculta"), this.actor.id), descubierta: false, segundaModo: "fija" })); },
      descubrirNat() { correr(this, pedirDescubrimiento(this.actor)); },
      activarFamilia() { correr(this, activarFamilia(this.actor, valorDe(this, "notaFamilia"))); },
      leerObjetivos() { correr(this, leerObjetivos(this.actor)); },
      disiparClon(ev, t) { const id = t.dataset.uuid || this.actor.uuid; alDM({ accion: "capaVDisipar", actorUuid: id }); },
      canalizar(ev, t) { correr(this, canalizar(this.actor, t.dataset.id)); },
      liberar() { correr(this, liberarCanalizada(this.actor)); },
      interrumpirCanal() { correr(this, interrumpirCanal(this.actor, game.user.isGM ? "el DM la interrumpe (movimiento forzado u otra causa)" : "la deja")); },
      modoReserva() { correr(this, cambiarModoReserva(this.actor, valorDe(this, "modoReserva")).then(() => asegurarTiradasVerbe(this.actor))); },
      abrirDiario(ev, t) { abrirDiarioPorNombre(t.dataset.diario, t.dataset.pagina); },
      cambiarNat() { correr(this, pedirDescubrimiento(this.actor, { tipo: "cambio", de: valorDe(this, "cambioDe"), a: valorDe(this, "cambioA") })); },
      pruebaEntreno() { correr(this, pruebaEntreno(this.actor)); },
      terminarEntreno() { correr(this, terminarEntrenoYa(this.actor)); },
      etapaMas() { correr(this, cambiarEtapa(this.actor, 1, valorDe(this, "maestro"))); },
      etapaMenos() { correr(this, cambiarEtapa(this.actor, -1, "")); },
      natModo() { correr(this, guardar(this.actor, { natModo: valorDe(this, "natModo") })); },
      ocultaPrimera() { correr(this, guardar(this.actor, { oc1: revolver(valorDe(this, "ocultaPrimera"), this.actor.id) })); },
      revelarNat() {
        const a = this.actor, e = estado(a);
        if (!natsDe(a).size) { const n = ocultaPrimeraDe(a) ?? valorDe(this, "ocultaPrimera"); if (n) correr(this, guardar(a, { nats: [n], entrenoNat: null, historial: hist(e, `El DM revela su naturaleza: ${NATS[n]}`) }).then(() => refrescar(a))); }
        else if (!e.descubierta && ocultaDe(a)) correr(this, guardar(a, { descubierta: true, entrenoNat: null, historial: hist(e, `El DM revela su segunda naturaleza: ${NATS[ocultaDe(a)]}`) }).then(() => refrescar(a)));
      },
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
      // 3.31: la rama va antes que las técnicas (pedido del autor): primero se sube la rama, después se aprende.
      const pest = [["resumen", "Inicio", "house"], ["jugar", "Mis técnicas", "bolt"], ["ramas", "Mejorar: ramas y dotes", "seedling"],
        ["tienda", "Aprender técnicas", "book-open"], ["entreno", `Entrenando${cuentaEntreno(a) ? ` (${cuentaEntreno(a)})` : ""}`, "dumbbell"], ["guia", "Ayuda rápida", "circle-question"], ...(dm() ? [["dm", "DM", "sliders"]] : [])];
      if (this.pestana === "dm" && !dm()) this.pestana = "resumen";
      const tabs = pest.map(([k, n, icon]) => {
        const activa = this.pestana === k || (k === "ramas" && mejora);
        return `<button type="button" class="${activa ? "activa" : ""} ${k === "dm" ? "dm" : ""}" ${activa ? 'aria-current="page"' : ""} data-action="pestana" data-p="${k}"><i class="fa-solid fa-${icon}" aria-hidden="true"></i> ${n}</button>`;
      }).join("");
      const subnav = mejora ? `<nav class="ev-subnav" aria-label="Cómo quieres mejorar">${[["ramas", "Especialidades"], ["dotes", "Dotes"], ["cultivo", "Entrenar técnicas"], ["crear", "Inventar una técnica"]].map(([k, n]) => `<button type="button" data-action="pestana" data-p="${k}" ${this.pestana === k ? 'aria-current="page"' : ""}>${n}</button>`).join("")}</nav>` : "";
      const cuerpo = ({ guia: () => this.#guia(), resumen: () => this.#resumen(), jugar: () => this.#jugar(), ramas: () => this.#ramas(), tienda: () => this.#tienda(), dotes: () => this.#dotes(),
        cultivo: () => this.#cultivo(), crear: () => this.#crear(), entreno: () => this.#entreno(), dm: () => this.#dm() })[this.pestana]?.() ?? "";
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
    const ojoSelect=content.querySelector('[name="mirada"]'), etapaSelect=content.querySelector('[name="etapa"]');
    const etapas=()=>{const m=D.miradas.find(m=>m.id===ojoSelect?.value);if(m&&etapaSelect)etapaSelect.innerHTML=opciones(m.etapas.map((_,i)=>[i+1,`Etapa ${i+1} · ${m.trazos[i]} Trazos${m.niveles?.[i]?` · nivel ${m.niveles[i]}`:""}`]),1);};
    ojoSelect?.addEventListener("change",etapas);if(ojoSelect)etapas();
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
    if (game.user.isGM) for (const nombre of ["linaje", "mirada"]) content.querySelectorAll(`select[name="${nombre}"]`)
      .forEach(sel => sel.addEventListener("change", () => { if (!this.comoJugador) abrirSangre(nombre, sel.value, this.actor); }));
    if (game.user.isGM && !this.comoJugador) ponerAzar(content);
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
      <div class="ecos-verbe-trazos ${t.libres > 0 ? "hay" : ""}"><span class="n">${t.libres}</span><span class="t"><b>Trazos</b> para aprender</span><small>Se gastan una vez por compra</small>${sistema.moneda(a) >= MONEDAS_POR_TRAZO ? `<button type="button" data-action="monedasTrazos" class="ev-monedas" data-tooltip="${MONEDAS_POR_TRAZO} Moneda${MONEDAS_POR_TRAZO > 1 ? "s" : ""} Antigua${MONEDAS_POR_TRAZO > 1 ? "s" : ""} = 1 Trazo (hasta ${TRAZOS_POR_NIVEL} Trazos por nivel)"><i class="fa-solid fa-coins" aria-hidden="true"></i> Cambiar Monedas</button>` : ""}</div>
    </header>${turnoVerbeHTML(a)}${barraDM}`;
  }

  #tarjeta(t, { aprender: compra = false, item = null, fav = null, tipo = null } = {}) {
    const a = this.actor, e = estado(a);
    const meta = item?.getFlag(MOD, F) ?? { ...t.item.flags[MOD][F], infusion: estado(a)?.infusiones?.[t.id] ?? null };
    const uso = previsualizarUso(a, meta);
    let cif = null; try { cif = cifrasActividad(item ?? t.item, { estados: ESTADOS }); } catch (err) { console.warn(`${MOD} | cifras de ${t.id}`, err); }
    const tipoK = tipo ?? tipoUso(actividadDe(item ?? t.item), { defensa: !!D.defensas?.[t.id], cargada: !!cargaDe(meta) });
    const r = compra ? requisitos(a, t) : null;
    const defensa = !compra && !!D.defensas?.[t.id];
    const carga = !compra && cargaDe(meta), canal = carga ? efectoCanal(a) : null, flc = canal?.getFlag(MOD, F)?.canalizar;
    const mia = flc?.id === t.id, otraCanal = !!canal && !mia;
    return tarjetaHTML({ id: t.id, nombre: item?.name ?? t.n, texto: textoDe(t), resolucion:resolucionTexto(t), grado: t.g, rama: nombreRama(t.rama),
      fav: compra ? null : !!fav, tipoUso: tipoK, tipoNombre: TIPOS_USO.find(([k]) => k === tipoK)?.[1] ?? null,
      chips: chipsCifras(cif), pasos: pasosUso(cif, compra ? { costo: uso.costo } : uso), estadosInfo: (cif?.estados ?? []).filter(x => x.texto),
      naturaleza: meta.infusion || t.nat ? nombreNat(meta.infusion || t.nat) : null,
      tiempo: TIEMPO_L[t.t] ?? t.t ?? "Ver ficha", alcance: t.alc ? alcanceL(t.alc, t.area) : "Ver ficha", area: t.area,
      referencia:t.divina&&!dm()?null:t.origen?.nombre,
      accionesExtra:!compra && Number(meta.g)<=capacidadReplicas(a) && efectoV(a,"replicas") && Object.values(t.item.system.activities).some(x=>["attack","save","damage","heal"].includes(x.type)) ? `<button type="button" data-action="usarReplica" data-id="${escH(t.id)}" ${Number(e.reservaReplicas)<uso.costo||e.accionReplicaUsada?"disabled":""}>Usar desde réplica</button>`:"",
      costo: uso.costo, trazos: compra ? t.trazos : null,
      accion: compra ? "aprender" : defensa ? "ficha" : carga ? (mia ? "liberar" : "canalizar") : "usar", boton: compra ? `${r.pideDM && !game.user.isGM ? "Pedir al DM" : "Aprender"} · ${t.trazos} ${t.trazos === 1 ? "Trazo" : "Trazos"}` : defensa ? "Cómo usar esta defensa"
        : carga ? (mia ? `Liberar · carga ${flc.carga}/${flc.max}` : "Canalizar (empieza a cargar)") : "Usar técnica",
      bloqueada: compra ? !r.ok || r.probar : carga ? (mia ? flc.carga < flc.min : otraCanal || !uso.costo && !uso.ok && !/cargada/.test(uso.motivo ?? "")) : !defensa && !uso.ok,
      riesgo: !compra && uso.ok && uso.despues < 0,
      estado: compra ? `<p class="ev-disponibilidad">${r.ok ? `Te quedarán ${trazos(a).libres - t.trazos} Trazos después de aprenderla.` : escH(r.motivo)}</p>` : estadoUsoHTML(uso),
      nota: compra ? (r.pideDM ? "Requiere aprobación del DM antes de aprenderla." : "Aprender no gasta Verbe. Lo gastarás al usarla.")
        : defensa ? (game.modules?.get?.("midi-qol")?.active ? "Se ofrece sola al recibir un ataque. El coste final depende del ataque." : "Se ofrece sola cuando te atacan con una técnica del Verbe. Contra un arma o un conjuro, avísale al DM y pulsa «Cómo usar esta defensa». El coste final depende del ataque.")
          : (uso.extra ? `Incluye ${uso.extra} Verbe extra por el objetivo marcado.` : t.g > 0 && gradoUsable(a, meta) > t.g ? "Puedes elevar el grado en la ventana de uso; el coste aumentará." : "Marca el objetivo si afecta a otra criatura.") });
  }

  /** Etapa del Verbe y descubrimiento de la naturaleza, explicado para el jugador (2.1). */
  #etapaYNaturaleza() {
    const a = this.actor, e = estado(a), et = datosEtapa(etapaDe(e)), sig = ETAPAS[et.n + 1];
    const d = estadoDescubrimiento(a), nat = DESCUBRIR[d.entreno?.tipo ?? d.tipo] ?? null;
    let natHTML = "";
    if (e.tirarNat) natHTML = `<p><b>Tu Verbe se abrió a un elemento.</b> Tira tu dado: ${Object.keys(NATS).filter(n => !natsDe(a).has(n)).map((n, i) => `${i + 1} ${NATS[n]}`).join(" · ")}. Es para siempre (solo el DM puede cambiarlo).</p><p><button type="button" data-action="tirarNat"><i class="fa-solid fa-dice"></i> Tirar mi naturaleza</button></p>`;
    else if (d.elegir) natHTML = `<p><b>Tu Verbe se abrió a un elemento.</b> Elígelo: es para siempre (solo el DM puede cambiarlo).</p><p><select name="nat">${opciones(Object.entries(NATS).filter(([n]) => !natsDe(a).has(n)), "")}</select> <button type="button" data-action="elegir" data-campo="nat">Elegir</button></p>`;
    else if (d.entreno) natHTML = d.faltan > 0
      ? `<p><b>Entrenando</b> ${d.entreno.tipo === "cambio" ? `para cambiar ${escH(NATS[d.entreno.de])} por ${escH(NATS[d.entreno.a])}` : `para descubrir ${nat.nombre}`}: faltan <b>${d.faltan} día${d.faltan === 1 ? "" : "s"}</b> del calendario del mundo. Después harás una prueba de Control del Verbe CD ${d.entreno.cd}.</p>${dm() ? `<p><button type="button" data-action="terminarEntreno">DM: dar por terminados los días</button></p>` : ""}`
      : `<p><b>Terminaste el entrenamiento.</b> Haz la prueba de Control del Verbe CD ${d.entreno.cd}${d.entreno.trazos ? `; si la superas, pagas ${d.entreno.trazos} Trazos` : ""}. Si fallas, no pierdes Trazos y puedes volver a entrenar.</p><p><button type="button" data-action="pruebaEntreno"><i class="fa-solid fa-dice-d20"></i> Hacer la prueba</button></p>`;
    else if (d.tipo) natHTML = d.req.ok
      ? `<p><b>Puedes descubrir ${nat.nombre}.</b> Necesitas a alguien que te guíe: ${nat.dias} días de entrenamiento y una prueba de Control del Verbe CD ${nat.cd}. Si la superas, pagas ${nat.trazos} Trazos.</p><p><button type="button" data-action="descubrirNat">Pedir el entrenamiento al DM</button></p>`
      : `<p><b>${d.tipo === "primera" ? "Tu naturaleza" : "Tu segunda naturaleza"} está oculta.</b> ${escH(d.req.motivo)} Mientras tanto, aprende técnicas sin elemento.</p>`;
    const cambio = conoce(a, "forma-cambiar-naturaleza") && !d.entreno && natsDe(a).size
      ? `<p><b>Cambiar naturaleza del Verbe:</b> <select name="cambioDe">${opciones([...natsDe(a)].map(n => [n, NATS[n] ?? n]), "")}</select> por <select name="cambioA">${opciones(Object.entries(NATS).filter(([n]) => !natsDe(a).has(n)), "")}</select> <button type="button" data-action="cambiarNat">Pedir el entrenamiento (7 días, CD 15)</button></p>` : "";
    return `<section class="ev-naturalezas"><h3>Tu etapa del Verbe: ${et.nombre}</h3><p>${escH(et.texto)}</p>${sig ? `<p class="ecos-nota">Siguiente: <b>${sig.nombre}</b> (${Number.isFinite(sig.ramas) ? `hasta ${sig.ramas} ramas y grado ${sig.grado}` : "sin límite de etapa"}). La abre el DM cuando encuentres por rol a un maestro o a un aprendiz que te enseñe.</p>` : ""}${natHTML}${cambio}</section>`;
  }

  #inicio() {
    const a = this.actor, e = estado(a), tecnicas = itemsTecnica(a).length;
    const paso = pasoInicial({ naturalezas: [...natsDe(a)], principal: e.principal, tecnicas, natOculta: modoNaturaleza(e) !== "visible" });
    const titulos = ["", "¿Qué elemento responde a ti?", "¿Cómo quieres usar tu poder?", "Aprende tu primera técnica", "Ya puedes entrar en acción"];
    let contenido;
    if (paso === 1) contenido = `<p>Elige el primer elemento que manejará tu personaje. Aquí «naturaleza» significa elemento. Funciona con cualquier especialidad y no te enseña técnicas por sí solo. Verás una confirmación antes de guardarlo.</p><div class="ev-elecciones">${Object.entries(NATS).map(([n, nombre]) => `<button type="button" class="ev-eleccion ${n}" data-action="elegir" data-campo="nat" data-valor="${n}"><span class="ev-elemento" aria-hidden="true">${({ fuego: "✦", agua: "≈", viento: "≋", tierra: "◆", rayo: "ϟ" })[n]}</span><strong>${nombre}</strong><small>${escH(ESTADOS[ESTADO_NAT[n][0]].texto)}</small><span>Elegir ${nombre} →</span></button>`).join("")}</div>`;
    else if (paso === 2) contenido = `<p>Tu especialidad se llama <b>rama principal</b>. Empiezas con el rango Entrenado sin gastar Trazos. Este rango amplía qué técnicas puedes aprender; las técnicas se compran por separado. Puedes aprender otras ramas después.</p><div class="ev-elecciones ramas">${ramasLibres().map(([id, nombre]) => {
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
      <div class="ev-mini-pasos"><span><b>1</b> Marca el objetivo, si hace falta</span><span><b>2</b> Pulsa «Usar técnica»</span><span><b>3</b> Confirma el uso y resuelve la tirada</span></div><p class="ev-nota">El gasto se comprueba al confirmar el uso. La posición, la visibilidad y los efectos narrativos se resuelven con el DM.</p>`;
    return `${avisosJugadorHTML(a)}${progresoHTML(paso)}<section class="ev-bienvenida"><span class="ev-kicker">${paso < 4 ? `TU SIGUIENTE PASO · ${paso} DE 3` : "TU REPERTORIO ESTÁ PREPARADO"}</span><h2>${titulos[paso]}</h2>${contenido}</section>`;
  }

  #jugar() {
    const a = this.actor, f = this.filtroUso;
    const conocidas = itemsTecnica(a).map(item => ({ item, t: tecnicaPorId(item.getFlag(MOD, F).id, a) })).filter(x => x.t);
    const favs = new Set(estado(a)?.favoritas ?? []);
    for (const x of conocidas) x.tipo = tipoUso(actividadDe(x.item), { defensa: !!D.defensas?.[x.t.id], cargada: !!cargaDe(x.item.getFlag(MOD, F)) });
    const cuenta = k => k === "todas" ? conocidas.length : k === "fav" ? conocidas.filter(x => favs.has(x.t.id)).length : conocidas.filter(x => x.tipo === k).length;
    const tipoSel = f.tipo ?? "todas";
    const chipsTipo = `<div class="ev-chips-tipo" role="group" aria-label="Ver por tipo">${TIPOS_USO.filter(([k]) => k === "todas" || cuenta(k) > 0 || k === tipoSel).map(([k, n]) =>
      `<button type="button" data-action="tipoUso" data-t="${k}" aria-pressed="${tipoSel === k ? "true" : "false"}" class="${tipoSel === k ? "activa" : ""}">${n} <span>${cuenta(k)}</span></button>`).join("")}</div>`;
    // 3.64 (pedido del autor): ver por activación: acción Verbe, acción adicional Verbe, reacción Verbe o fuera de combate.
    const activ = x => gastoVerbe(x.t.t) ?? "fuera";
    const actSel = f.act ?? "todas", cuentaAct = k => k === "todas" ? conocidas.length : conocidas.filter(x => activ(x) === k).length;
    const chipsAct = `<div class="ev-chips-tipo ev-chips-act" role="group" aria-label="Ver por activación">${[["todas", "Cualquier tiempo"], ["accion", "Acción Verbe"], ["adicional", "Adicional Verbe"], ["reaccion", "Reacción Verbe"], ["fuera", "Fuera de combate"]]
      .filter(([k]) => k === "todas" || cuentaAct(k) > 0 || k === actSel).map(([k, n]) => `<button type="button" data-action="actUso" data-t="${k}" aria-pressed="${actSel === k}" class="${actSel === k ? "activa" : ""}">${n} <span>${cuentaAct(k)}</span></button>`).join("")}</div>`;
    const lista = conocidas.filter(({ item, t }) => !f.texto || `${item.name} ${(t.alias ?? []).join(" ")} ${textoDe(t)}`.toLowerCase().includes(f.texto.toLowerCase()))
      .filter(x => actSel === "todas" || activ(x) === actSel)
      .filter(({ item }) => !f.solo || previsualizarUso(a, item.getFlag(MOD, F)).ok)
      .filter(x => tipoSel === "todas" ? true : tipoSel === "fav" ? favs.has(x.t.id) : x.tipo === tipoSel)
      .sort((x, y) => Number(favs.has(y.t.id)) - Number(favs.has(x.t.id)));
    const cupos=cuotasPoder(nivelDe(a),dotesActivas(a)),gastados=estado(a).cuotasPoder??{};
    return `${cupos.mayores?`<details class="ev-limites-poder"><summary>Usos altos que te quedan hasta el próximo Descanso Largo</summary><ul><li>Grados 6–8: <b>${Math.max(0,cupos.mayores-(gastados.mayores||0))} de ${cupos.mayores}</b> usos compartidos.</li><li>Grados 9–11: <b>${Math.max(0,cupos.culminaciones-(gastados.culminaciones||0))} de ${cupos.culminaciones}</b> usos compartidos.</li>${cupos.trascendentes?`<li>Dentro de los anteriores, grado 11: <b>${Math.max(0,cupos.trascendentes-(gastados.trascendentes||0))} de ${cupos.trascendentes}</b>.</li>`:""}</ul><p>También cuenta el grado elegido al elevar una técnica. Cada técnica alta conserva su propio uso por Largo. Cambiar de técnica no devuelve usos compartidos.</p></details>`:""}${efectoV(a,"replicas")?`<div class="ev-instruccion"><span><b>Reserva repartida en réplicas: ${Number(estado(a).reservaReplicas)||0} Verbe</b>Una acción ofensiva conjunta por turno. «Usar desde réplica» gasta ese saldo y solo admite grado 0–${capacidadReplicas(a)}. Al disipar, se pierde el saldo restante.</span><button type="button" data-action="cerrarReplicas">Disipar réplicas</button></div>`:""}${avisosJugadorHTML(a)}<div class="ev-titulo-pagina"><div><span class="ev-kicker">TU REPERTORIO</span><h2>¿Qué quieres hacer?</h2><p>Usa una técnica desde aquí. Se abrirá la ventana de uso. Comprueba el grado y el gasto antes de confirmar.</p></div><span class="ev-contador">${conocidas.length} conocidas</span></div>
      <div class="ev-instruccion"><i class="fa-solid fa-crosshairs" aria-hidden="true"></i><span><b>Si afecta a otro, marca su token antes de usarla.</b> El alcance y las condiciones de cada técnica siguen contando.</span></div>
      ${esClon(a) ? `<p class="ev-aviso">Eres <b>un clon de ${escH(estado(a).clon.deNombre)}</b>: ${sistema.pg(a).valor} PG y ${estado(a).valor} Verbe. Si te destruyen, ese Verbe se pierde. <button type="button" data-action="disiparClon">Disiparme (vuelve mi Verbe)</button></p>` : ""}
      ${(() => { const mios = (game.actors ?? []).filter(x => esClon(x) && estado(x).clon.de === a.uuid); return mios.length ? `<p class="ev-aviso">Tienes ${mios.length} clon${mios.length > 1 ? "es" : ""}: ${mios.map(x => `${escH(x.name)} (${estado(x).valor} Verbe) <button type="button" data-action="disiparClon" data-uuid="${x.uuid}">Disipar</button>`).join(" · ")}</p>` : ""; })()}
      ${(() => { const ec = estado(a)?.entrenoClon; return ec?.banco || ec?.horas ? `<p class="ecos-nota">Entrenamiento de tus clones: <b>${Number(ec.banco) || 0} día${Number(ec.banco) === 1 ? "" : "s"}</b> guardados${ec.horas ? ` y ${ec.horas} h sueltas` : ""}. Se gastan solos en tu próxima técnica o cultivo.</p>` : ""; })()}
      ${efectoCanal(a) ? `<p class="ev-aviso"><b>Canalizando ${escH(itemsDe(a, efectoCanal(a).getFlag(MOD, F).canalizar.id)[0]?.name ?? "")}</b> · carga ${efectoCanal(a).getFlag(MOD, F).canalizar.carga}/${efectoCanal(a).getFlag(MOD, F).canalizar.max}. Velocidad 0, sin reacciones ni choques. <button type="button" data-action="interrumpirCanal">Dejar de canalizar</button></p>` : ""}
      ${queVe(itemsTecnica(a).map(i => i.getFlag(MOD, F)?.id)).size ? `<p><button type="button" data-action="leerObjetivos" data-tooltip="Marca tokens y lee su Verbe por tramos (lleno, a medias, poco; más débil o más fuerte), nunca cifras"><i class="fa-solid fa-eye"></i> Leer el Verbe de los marcados</button></p>` : ""}
      <div class="ecos-verbe-filtros"><label class="ev-busqueda"><span>Buscar en mis técnicas</span><input type="search" data-filtro-uso="texto" placeholder="Nombre o efecto…" value="${escH(f.texto)}"></label><label><input type="checkbox" data-filtro-uso="solo" ${f.solo ? "checked" : ""}> Ocultar las bloqueadas por recursos o estado</label></div>
      ${chipsTipo}${chipsAct}
      ${lista.length ? `<div class="ev-tarjetas">${lista.map(({ t, item, tipo }) => this.#tarjeta(t, { item, fav: favs.has(t.id), tipo })).join("")}</div>` : `<div class="ev-vacio"><h3>${conocidas.length ? "Ninguna coincide con ese filtro" : "Tu primera técnica te espera"}</h3><p>${conocidas.length ? "Quita el filtro para ver los bloqueos y sus motivos." : "Aprende una técnica con Trazos. Después aparecerá aquí lista para usarla."}</p><button type="button" data-action="pestana" data-p="tienda">Ir a Aprender</button></div>`}`;
  }

  #guia() {
    const a=this.actor,e=estado(a),v=Number(e.valor)||0,largo=recuperacionLargaVerbe(a),limite=presupuestoBreveVerbe(a),breve=presupuestoBreveVerbe(a,e.recCortos);
    const santuario=cambiosRecuperacion(a,largo),fracNoche=efectosDotes(a).reduce((t,ef)=>Math.max(t,Number(ef.rec?.intemperie)||0),.25)/2,noche=recuperacionBreve(a,Math.floor(maxVerbe(a)*fracNoche*(Number(herenciaDe(a)?.recMult)||1)));
    const pregunta=(q,html)=>`<details><summary>${q}</summary>${html}</details>`;
    // 3.38 (pedido del autor): un tutorial para quien mira la interfaz por primera vez.
    const tutorial=`<section class="ev-tutorial"><h3>Tutorial</h3>${TUTORIAL.map(([q,h])=>pregunta(q,h)).join("")}</section>`;
    return `<div class="ev-titulo-pagina"><div><span class="ev-kicker">EMPIEZA POR LO QUE QUIERES HACER</span><h2>Lo necesario para jugar</h2><p>No necesitas memorizar el catálogo. Abre una pregunta cuando aparezca esa situación.</p></div></div>
      <section class="ev-bienvenida"><h3>Para tu primera escena</h3><ol><li>Abre <b>Inicio</b> y completa las elecciones que te falten.</li><li>Aprende una técnica con <b>Trazos</b>. Puedes guardar los puntos restantes.</li><li>En <b>Mis técnicas</b>, lee qué hace, marca el objetivo si hace falta y pulsa <b>Usar técnica</b>.</li><li>Comprueba el coste en <b>Verbe</b>, confirma el uso y resuelve la tirada o el efecto con el DM.</li></ol><div class="ev-acciones"><button type="button" data-action="pestana" data-p="resumen">Ir a Inicio</button><button type="button" data-action="pestana" data-p="jugar">Ir a Mis técnicas</button><button type="button" data-action="pestana" data-p="tienda">Aprender una técnica</button></div></section>
      <div class="ev-contraste-recursos"><div><b>Verbe = energía para actuar</b><span>Se gasta al usar una técnica. Descansar puede recuperarlo.</span></div><div><b>Trazos = puntos para aprender</b><span>Pagas una vez por compra. Una técnica aprendida queda en tu repertorio.</span></div></div>
      <div class="ev-preguntas">
      ${pregunta('¿Qué diferencia hay entre nivel, grado y rango?',`<p><b>Nivel:</b> el de tu personaje. <b>Grado:</b> la potencia de una técnica. <b>Rango:</b> tu entrenamiento en una rama, como Forma.</p><p>Ejemplo: un personaje de nivel 5 tiene un techo general de grado 3. Si en Velo solo tiene rango Novato, allí sigue limitado a grado 1. Subir su rango a Entrenado permite llegar a grado 3, pero todavía tiene que aprender la técnica que quiera.</p><p><b>Importante:</b> Maestro es un rango; Maestría es una dote de senda. Son compras distintas. Para técnicas de grado 6 o más también cuenta la senda, además de nivel y rango.</p>`)}
      ${pregunta('¿Cómo sé si debo tirar un ataque o una salvación?',`<p><b>Ataque:</b> tú tiras y comparas el resultado con la Clase de Armadura del objetivo. <b>Salvación:</b> tira el objetivo y compara con la dificultad de tu técnica. La ficha indica qué ocurre si tiene éxito.</p><p><b>Curación:</b> tiras los dados indicados y aplicas las reglas de heridas. <b>Utilidad:</b> sigues las instrucciones del efecto; abrir su tarjeta no garantiza por sí solo que todo se aplique automáticamente.</p>`)}
      ${pregunta('¿Por qué está bloqueado un botón?',`<p>Lee el motivo junto a la opción. El aviso muestra <b>el primer requisito pendiente</b>; al resolverlo puede aparecer otro.</p><ul><li><b>Para aprender:</b> revisa nivel, rango, Trazos, elemento y requisitos de historia.</li><li><b>Para usar:</b> además necesitas la técnica aprendida, Verbe, el tiempo de acción correspondiente y los usos que queden.</li><li><b>Pedir al DM:</b> envía una solicitud; no concede el poder al instante. Un hito o ritual se concede cuando ocurre en la historia.</li></ul><p>La ficha separa el estado del aprendizaje y el estado del uso para ayudarte a saber qué te falta.</p>`)}
      ${pregunta('¿Cómo funcionan mis acciones y reacciones?',`<p><b>Acción</b> y <b>acción adicional</b> son tiempos distintos de tu turno. Una <b>reacción</b> se usa cuando ocurre su disparador. La ficha indica cuál necesita; el botón no te regala acciones.</p><p>Si ya gastaste la reacción o estás Cargado, las defensas de reacción quedan bloqueadas hasta recuperarla. <b>El choque es una excepción:</b> no gasta reacción ni tu acción normal, aunque sí paga energía y usos limitados.</p><p>En combate el módulo limita a dos técnicas de acción o acción adicional por turno y a una de grado 6 o más. Estos topes no conceden acciones que tu personaje no tenga.</p>`)}
      ${pregunta('¿Cómo chocan dos técnicas?',`<ol class="ev-pasos-lectura">${PASOS_CHOQUE.map(([t,d])=>`<li><b>${escH(t)}.</b> ${escH(d)}</li>`).join('')}</ol><details><summary>Qué resuelve el módulo</summary><p>Con midi-qol se retiran los objetivos protegidos antes del daño. En el flujo sin midi se pausa la continuación y se indica qué objetivos siguen afectados; el daño o los movimientos manuales se resuelven siguiendo esa tarjeta con el DM.</p></details>`)}
      ${pregunta('¿Qué ocurre si no me alcanza el Verbe?',`<p>Tu saldo actual es <b>${v}</b>. Tu límite de sobreesfuerzo ahora es <b>${limiteNegativo(a)}</b>. Si una técnica te deja por debajo de cero, entras en deuda y haces la salvación de Constitución que indique el uso. Fallarla añade Agotamiento.</p><p>Con Agotamiento 4 no puedes gastar en negativo. Recuperar un punto de deuda cuesta dos puntos de recuperación; el sobrante impar se guarda. Las técnicas de grado 0 necesitan al menos 1 de Verbe aunque su coste sea cero.</p><p>Ejemplo: pasar de −2 a 0 requiere 4 puntos de recuperación.</p>`)}
      ${pregunta('¿Cuánto recupero al descansar?',`<dl class="ev-lectura-datos"><div><dt>Largo en Santuario</dt><dd>Ahora ofrece hasta ${largo} puntos de recuperación. Con tu saldo actual quedarías en ${santuario.valor} de Verbe.</dd></div><div><dt>Noche a la intemperie</dt><dd>Usa el presupuesto breve. Con tu saldo y los límites actuales quedarías en ${noche.valor} de Verbe.</dd></div><div><dt>Presupuesto breve compartido</dt><dd>Te quedan ${breve.restante} de ${limite.limite} puntos entre Descansos Largos. Lo comparten noches, Respiro, Aliento y recuperaciones que lo indiquen.</dd></div></dl><p>Las cifras anteriores ya tienen en cuenta tu personaje. Los puntos de recuperación pagan la deuda al doble: no siempre se convierten uno a uno en saldo.</p><p>Solo el Largo renueva este presupuesto y los poderes diarios. <b>Excepción concreta:</b> Sustitución refleja vuelve tras un Corto; eso no devuelve las técnicas altas ni todos los usos del personaje. Otras excepciones deben estar expresamente indicadas en su ficha.</p>`)}
      ${pregunta('¿Qué mejora me conviene buscar?',`<ul><li><b>Quiero otra herramienta:</b> busca una técnica en Aprender.</li><li><b>Quiero técnicas de mayor grado:</b> revisa nivel, rango y, desde grado 6, las dotes de senda.</li><li><b>Quiero mejorar una que ya conozco:</b> abre Mejorar → Entrenar técnicas. Ese entrenamiento también se llama cultivo.</li><li><b>Quiero un beneficio permanente:</b> revisa Mejorar → Dotes.</li><li><b>Quiero inventar algo:</b> Crear una técnica es opcional y requiere la aprobación del DM.</li></ul><p>Mira qué ganarás y cuántos Trazos quedarían. Puedes ahorrar puntos; no tienes que usar todas las opciones. Si compras algo por error, el DM puede deshacer la compra.</p>`)}
      ${pregunta('¿Qué son las sendas y las ascensiones?',`<p>Las sendas son cadenas de dotes de una especialidad. Se compran por orden: <b>Disciplina</b> desde nivel 3, <b>Especialista</b> desde 7, <b>Maestría</b> desde 11 y <b>Leyenda</b> desde 18. Los números son niveles de personaje, no precios ni rangos.</p><p>Grado 10 exige Ascensión mítica y grado 11 Ascensión trascendente. También requieren sus hitos de historia del DM. Alcanzar el nivel no entrega esas dotes ni las técnicas gratuitamente.</p>`)}
      ${pregunta('¿Dónde están las herramientas nuevas de campaña?','<p>Pulsa Mesa Ecos en la cabecera de tu ficha o Ctrl + M. En Mi turno tienes accesos y recordatorios; Qué quiero hacer propone técnicas para una intención; Crear personaje verifica elecciones y avances. Buscar información consulta fuentes legibles. Diagnóstico y pruebas prepara tu revisión de mesa. El DM dispone también de Dirección, Taller de NPC, Encuentros e Identidad de Nimerios.</p>')}
      ${pregunta('¿Qué hago con una reliquia?',`<ol><li>El DM entrega y autoriza una copia de la reliquia.</li><li>Revisa su nivel mínimo y equípala. Las reliquias de nivel mínimo 9 o más también exigen sintonía.</li><li>Ábrela en el inventario y usa su actividad. Normalmente gasta un cargo, no Verbe.</li><li>Si es un ritual, el DM debe preparar un permiso para esa activación.</li></ol><p>Las copias de una familia comparten su límite; las mayores también comparten un único uso por Largo. Un consumible no vuelve por descansar. La clasificación de Made in Abyss no es un grado de técnica del Verbe.</p><p><b>Objetos que habilitan técnicas:</b> algunos poderes piden una reliquia concreta como requisito. Recibir ese objeto no enseña sus técnicas: se aprenden con Trazos y se usan con Verbe. Revisa la ficha para distinguirlos de los objetos con actividad propia del compendio.</p>`)}
      ${pregunta('¿Por qué sigo herido después de recuperar vida?',`<p>Recuperar puntos de vida no borra automáticamente Malherido ni Herida No Tratada. Necesitas el tratamiento y el reposo que indiquen sus reglas.</p><p>Si estás Acechado por la Muerte, no puedes tomar acciones, acciones adicionales ni reacciones. Pide ayuda y sigue las indicaciones del estado. El Santuario mejora el descanso; una noche fuera no equivale a un Largo en Santuario.</p>`)}
      ${pregunta('¿Qué significan las palabras y abreviaturas de la hoja?',glosarioHTML())}
      </div>${tutorial}<p class="ev-nota">La referencia completa queda disponible para excepciones o consultas del DM.</p><button type="button" data-action="guia" data-s="">Abrir referencia completa</button>`;
  }

  /** Bloque solo para el DM (2.5b): la sangre del personaje en lenguaje simple, qué puede aprender y dónde leer más. */
  #sangreDM() {
    if (!dm()) return "";
    const a = this.actor, s = sangreDe(a), lin = s.linaje;
    const deSangre = t => t.rama === "sangre" || t.sec === "sangre" || (lin?.req && t.req === lin.req) || (t.rama === "mirada" && s.heredadas.some(o => t.id.startsWith(`mirada-${o}-`)));
    const lista = [...D.tecnicas, ...extraMundo()].filter(t => !t.retirada && deSangre(t) && !conoce(a, t.id));
    const ya = lista.filter(t => requisitos(a, t).ok), motivos = {};
    for (const t of lista) { const r = requisitos(a, t); if (!r.ok) motivos[r.motivo] = (motivos[r.motivo] ?? 0) + 1; }
    const top = Object.entries(motivos).sort((x, y) => y[1] - x[1]).slice(0, 3);
    const quien = lin ? `<b>${escH(lin.alias ?? lin.nombre)}</b>${lin.real && lin.real !== lin.alias ? ` (${escH(lin.real)})` : ""} · fuerza ${escH(FUERZA[s.fuerza]?.nombre ?? s.fuerza)}` : s.heredadas.length ? `una Mirada heredada (${s.heredadas.map(o => escH(D.miradas.find(m => m.id === o)?.nombre ?? o)).join(", ")})` : "ninguna";
    const estadoTxt = !lin && !s.heredadas.length ? "No tiene sangre: su camino es el de las ramas comunes. Puedes darle un linaje en Herramientas del DM."
      : !s.visible ? `<b>Es un secreto:</b> el jugador no sabe de dónde viene y no ve sus técnicas familiares. Cuando lo descubra por rol, pulsa «Activar técnicas familiares».`
        : ya.length ? `<b>Este jugador puede comenzar a aprender técnicas de su sangre:</b> ${ya.length} disponibles ahora (${ya.slice(0, 4).map(t => escH(t.n)).join(", ")}${ya.length > 4 ? "…" : ""}).`
          : "Conoce su sangre, pero ahora no tiene técnicas familiares que pueda aprender.";
    const diario = (n, p, txt) => `<button type="button" data-action="abrirDiario" data-diario="${escH(n)}" ${p ? `data-pagina="${escH(p)}"` : ""}>${txt}</button>`;
    return `<section class="ev-naturalezas ecos-sangre-dm"><h3>Sangre de ${escH(a.name)} <small>(solo la ves tú)</small></h3>
      <p>Su sangre: ${quien}${s.tipo === "mirada" ? " · cuenta como su única sangre" : ""}. Solo hay <b>una</b> por nacimiento; un ojo trasplantado y un Pacto no cuentan.</p>
      <p>${estadoTxt}</p>${top.length && s.visible ? `<p class="ecos-nota">Todavía bloqueado: ${top.map(([m, n]) => `${n} por «${escH(m)}»`).join(" · ")}.</p>` : ""}
      ${(lin || s.heredadas.length) && !s.visible ? `<p><label>Cómo lo descubrió <input name="notaFamilia" maxlength="200" placeholder="Una carta, un sueño, alguien de su familia…"></label> <button type="button" data-action="activarFamilia"><i class="fa-solid fa-key"></i> Activar técnicas familiares</button></p>` : s.activa ? `<p class="ecos-nota">Activadas el ${escH(new Date(estado(a).familiaActiva.fecha).toLocaleDateString())}${estado(a).familiaActiva.nota ? `: ${escH(estado(a).familiaActiva.nota)}` : ""}.</p>` : ""}
      <p>Para leer más: ${diario("Mundo 10 · El Verbe por dentro", "", "El Verbe por dentro")} ${diario("Tramas y secretos", "16 · Reglas ocultas de la Sangre", "Reglas ocultas de la Sangre")} ${diario("Tramas y secretos", "17 · Manual del DM del módulo", "Manual del DM del módulo")}</p></section>`;
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
      : `Puede que tu Verbe responda a otra naturaleza que no conoces. Se descubre entrenando (Mejorar → Tus elementos): días con guía y una prueba de Control del Verbe.${dm() && oc ? ` <i>Oculta: ${NATS[oc]}</i>` : ""}`;
    const cerrAbierto = efectoV(a, "cerrojo");
    const cerr = (Number(e.cerrojos) || 0) ? `<h3>Ocho Cerrojos</h3><p>${D.cerrojos.filter(c => c.n <= e.cerrojos).map(c =>
      `<button type="button" data-action="cerrojo" data-n="${c.n}" data-tooltip="${escH(c.da)} · cuesta ${costoGrado(c.grado)} Verbe y una prueba de Control CD ${10 + (2 * c.n)} · ${c.pg ? `${c.pg} PG por turno` : "sin PG"}">Abrir hasta el ${c.n} · ${escH(c.nombre)}</button>`).join(" ")}
      ${cerrAbierto ? ` <button type="button" data-action="cerrar">Cerrar (${escH(cerrAbierto.name)})</button>` : ""}</p>` : "";
    const monedas = sistema.moneda(a);
    const recMoneda = cambiosRecuperacion(a, 2 * competencia(a));
    const monedasNivel = Number(e.monedas?.[nivelDe(a)]) || 0;
    const mon = monedas ? `<section class="ev-reponer"><div><span class="ev-kicker">RECURSO OPCIONAL</span><h3>${monedas} ${monedas === 1 ? "Moneda Antigua" : "Monedas Antiguas"}</h3><p>Gastas una moneda por botón. Elige energía para ahora o un Trazo para aprender.</p></div><div><button type="button" data-action="moneda" data-uso="verbe">Gastar 1 moneda → quedar en ${recMoneda.valor} Verbe${recMoneda.recResto ? " + 1 punto guardado" : ""}</button>
      <button type="button" data-action="moneda" data-uso="trazo" ${monedasNivel >= 2 ? "disabled" : ""}>Gastar 1 moneda → +1 Trazo</button><small>${monedasNivel} de 2 conversiones a Trazo usadas en este nivel.</small></div></section>` : "";
    const ctl = sistema.control(a);
    return `${this.#sangreDM()}${pasos}${el.join("")}
      <div class="ev-estadisticas"><div><small>Dificultad base (CD)</small><b>${cd}</b><span>Para técnicas con tu característica de Verbe; la actividad aplica sus mejoras.</span></div><div><small>Ataque base con Verbe</small><b>${competencia(a) + modDe(a, e.car) >= 0 ? "+" : ""}${competencia(a) + modDe(a, e.car)}</b><span>La técnica puede usar otra característica.</span></div><div><small>Grado máximo por nivel</small><b>${gradoMax(a)}</b><span>Cada rama también tiene su propio límite.</span></div></div>
      ${mon}${resumenDivino(a)}<details class="ev-ficha-personal"><summary>Mi personaje: afinidades, linaje y otros detalles</summary>
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
      ${cerr ? `<details class="ev-ficha-personal"><summary>Ocho Cerrojos · poder con coste de PG y Agotamiento</summary>${cerr}</details>` : ""}
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
        pacto: "Se abre con un pacto que se gana en la historia.", sangre: "Se abre con una herencia de sangre. No tienes manera de saber si la tienes; si es así, la historia lo dirá." }[r.id]
        ?? (e.entrenosDote?.[`rama:${r.id}`] ? "Estás entrenando para abrirla: sigue en «Entrenando»." : `Se abre entrenando (2 Trazos, 2 días buenos, CD 13), con una dote o con un maestro. <button type="button" data-action="abrirRama" data-rama="${r.id}" ${trazos(a).libres < PLAN_RAMA.trazos ? "disabled" : ""}>Abrir · ${PLAN_RAMA.trazos} Trazos</button>`);
      const rec = (c !== null && !principal) ? recargoRama(ordenRama(a, r.id)) : 0;
      const extra = rec ? ` (incluye ${rec} de más por ser tu ${ordenRama(a, r.id) >= 4 ? "quinta" : "tercera"} rama o más)` : "";
      const ahora = abierta
        ? `Rango <b>${nombreRango(rg)}</b> · por nivel y rango llegas hasta <b>grado ${Math.min(gradoMax(a), rangoGrado(rg))}</b>${rg >= 2 ? ` · +${rg - 1} dado${rg > 2 ? "s" : ""} al dañar o curar` : ""}.`
        : "<b>Cerrada</b>.";
      const ayudaSig = sig ? `${sig.nombre}: aprendes hasta grado ${sig.grado}${rg + 1 >= 2 ? `, sus técnicas que dañan o curan tiran ${rg} dado${rg > 1 ? "s" : ""} más` : ""}. Pide nivel ${sig.nivel}. Cuesta ${c} Trazo${c === 1 ? "" : "s"}${extra}.` : "";
      const entR = e.entrenosDote?.[`rango:${r.id}`];
      const boton = entR ? `<span class="ecos-verbe-pill">Entrenando ${escH(entR.nombre ?? "")} ${entR.progreso}/${entR.exitos}</span> <button type="button" data-action="entrenarDote" data-id="rango:${r.id}">Entrenar</button>`
        : (sig && abierta) ? `<button type="button" data-action="rango" data-rama="${r.id}" ${puede ? "" : "disabled"} data-tooltip="${escH(ayudaSig)}">Subir a ${sig.nombre} · ${c} Trazo${c === 1 ? "" : "s"}</button>${faltaNivel ? ` <span class="ecos-nota">Necesitas nivel ${sig.nivel}.</span>` : faltanTrazos ? ` <span class="ecos-nota">Te faltan ${faltanTrazos} Trazos.</span>` : ""}`
        : (abierta ? `<span class="ecos-nota">Es el rango más alto.</span>` : "");
      return `<section class="ecos-verbe-rama ${abierta ? "" : "cerrada"}">
        <header><b>${r.nombre}</b>${principal ? " <span class='ecos-verbe-pill'>principal</span>" : ""}${e.segunda === r.id ? " <span class='ecos-verbe-pill'>segunda</span>" : ""}
          <span>${ahora}</span>${boton}</header><p class="ecos-nota">${abierta?"El rango abre un límite de aprendizaje; no enseña automáticamente las técnicas. Desde grado 6 también necesitas las dotes de senda indicadas en cada ficha.":""}</p>
        <p class="ecos-nota">${abierta || r.id !== "sangre" ? escH(leadDe(r)) : ""} ${abierta ? "" : `<b>${cerradaPor}</b>`}</p>${vePropia && !["sangre", "mirada"].includes(r.id) ? `<p><button type="button" data-action="vistazo" data-rama="${r.id}" data-tooltip="Mira todas las técnicas de la rama, también las de grados que todavía no alcanzas (sin las de familia ni de linaje)"><i class="fa-solid fa-binoculars"></i> Echa un vistazo a niveles superiores</button></p>` : ""}${dones ? `<details class="ev-dones"><summary>Qué dones gano en esta rama</summary><ul class="ecos-verbe-dones">${dones}</ul></details>` : ""}</section>`;
    }).join("");
    const af = [...natsDe(a)].map(n => {
      const v = Number(e.afinidad?.[n]) || 1;
      return `<li><b>${NATS[n] ?? n}</b>: ${["", "Despierta", "Entrenada", "Maestra"][v]} ${v < 3 ? `<button type="button" data-action="afinidad" data-nat="${n}" data-tooltip="${v === 1 ? "+1 dado a sus técnicas e infusiones, y sus estados duran el doble" : "+2 dados en vez de +1, y quien falla contra ella no resiste su daño"}">Subir a ${v === 1 ? "Entrenada" : "Maestra"} · ${v === 1 ? 2 : 4} Trazos (nivel ${v === 1 ? 5 : 11}, pide un maestro)</button>` : ""}</li>`;
    }).join("");
    const ctl = sistema.control(a);
    const cerr = Number(e.cerrojos) || 0;
    const sigC = D.cerrojos[cerr];
    return `${intro("Cada rama es un tipo de técnica (Forma, Velo, Cuerpo…).", "Tu rango en una rama dice hasta qué grado puedes aprender técnicas de ella. Se sube con Trazos; desde Experto, sus técnicas que dañan o curan tiran dados de más y ganas los dones de la rama.",
      `<p>Tu <b>rama principal</b> empieza en Entrenado gratis, cada rango le cuesta 1 Trazo menos y sus dones llegan un rango antes. Desde la <b>tercera rama</b> que entrenes, cada rango cuesta 1 Trazo más, y desde la <b>quinta</b>, 2 más: conviene especializarse.</p>${tabla}`, "ramas-y-rangos")}
      ${filas}
      ${this.#etapaYNaturaleza()}
      <section class="ev-naturalezas"><h3>Tus elementos</h3><p>${[...natsDe(a)].map(nombreNat).join(", ") || (modoNaturaleza(e) === "visible" ? "Elige tu primera naturaleza en Inicio" : "Aún no descubriste tu naturaleza")}. ${natsDe(a).size >= 2 ? "Las otras naturalezas se cierran en Aprender." : "Tu naturaleza (y la segunda) se descubre entrenando: mira arriba qué te pide."}</p>
      ${opcionesNaturaleza(a, "tercera").length ? `<p>Tu dote abre una elección adicional: <select name="terceraElegir">${opciones(opcionesNaturaleza(a,"tercera").map(n=>[n,nombreNat(n)]), "")}</select> <button type="button" data-action="naturalezaExtra" data-tipo="tercera">Elegir tercera naturaleza</button></p>` : ""}
      ${opcionesNaturaleza(a,"combo").length ? `<p>Combina dos elementos conocidos: <select name="comboElegir">${opciones(opcionesNaturaleza(a,"combo").map(n=>[n,`${nombreNat(n)} (${D.combos[n].de.map(nombreNat).join(" + ")})`]), "")}</select> <button type="button" data-action="naturalezaExtra" data-tipo="combo">Abrir combinación</button></p>` : ""}
      <p>${combosDe(a).size ? `Combinaciones abiertas: ${[...combosDe(a)].map(nombreNat).join(", ")}. Todas sus técnicas aparecen en Aprender; las de mayor grado muestran sus requisitos.` : "Naturaleza combinada abre una combinación desde nivel 9 con maestro; Tercera naturaleza abre otro elemento desde nivel 7 con maestro. Una tercera naturaleza no concede por sí sola una combinación."}</p></section>
      <h3>Afinidad con tu naturaleza</h3><p class="ecos-nota">Qué tan bien manejas tu elemento. Entrenada: sus técnicas tiran 1 dado más y sus estados duran el doble. Maestra: 2 dados más, y quien falla contra ella no resiste su daño.</p><ul>${af || "<li>Primero elige tu naturaleza (Inicio).</li>"}</ul>
      <section class="ev-naturalezas"><h3>Tradiciones y vínculos</h3><p>${(e.tradiciones??[]).map(id=>escH(D.tradicionesShinobi?.find(t=>t.id===id)?.nombre??id)).join(", ")||"El DM concede los aprendizajes secretos cuando los ganas en la historia."}</p>${e.vasija?.bestia?`<p>Bestia: ${escH(D.bestiasShinobi?.find(b=>b.id===e.vasija.bestia)?.nombre??e.vasija.bestia)} · vínculo ${e.vasija.vinculo}.</p>`:""}${conoce(a,"pulso-centenar-sello")?`<p>Sello del centenar: ${Number(e.reservaSellada)||0}/${2*nivelDe(a)+sumaEf(a,ef=>ef.depositoExtra?competencia(a):0)} almacenados. <input name="depositarVerbe" type="number" min="1" value="1" style="width:5em"><button type="button" data-action="almacenar">Almacenar desde mi Verbe</button></p>`:""}</section>
      <h3>Control del Verbe ${ayuda("control")}</h3><p>${["Sin competencia", "Competente", "Pericia"][Math.min(2, ctl)]}. ${estado(this.actor)?.entrenosDote?.["control:cvb"] ? `<span class="ecos-verbe-pill">Entrenando ${estado(this.actor).entrenosDote["control:cvb"].progreso}/${estado(this.actor).entrenosDote["control:cvb"].exitos}</span> <button type="button" data-action="entrenarDote" data-id="control:cvb">Entrenar</button>` : ctl < 2 ? `<button type="button" data-action="control" data-tooltip="${ctl === 0 ? "Sumas tu competencia a las pruebas de Control" : "Sumas el doble de tu competencia"}">${ctl === 0 ? "Volverte competente · 2 Trazos" : "Pericia · 3 Trazos (nivel 5)"}</button>` : ""}</p>
      <h3>Ocho Cerrojos</h3><p class="ecos-nota">Un estado de Cuerpo: pegas más fuerte y más rápido, pagando PG cada turno y Agotamiento al cerrar. <a class="ecos-verbe-guia" data-action="guia" data-s="siete-cerrojos"><i class="fa-solid fa-book-open"></i> Guía</a></p>
      <p>${cerr ? `Sabes hasta el ${cerr}.` : "No sabes ninguno."} ${sigC ? `<button type="button" data-action="aprenderCerrojo" data-tooltip="${escH(`${sigC.nombre}: ${sigC.da}. Grado ${sigC.grado}.`)}">Aprender el ${sigC.n} · ${escH(sigC.nombre)} · ${sigC.grado} Trazo${sigC.grado === 1 ? "" : "s"}</button>` : ""}</p>`;
  }

  #tienda() {
    const a = this.actor;
    const e = estado(a);
    const f = this.filtro;
    const ve = veLinaje(a);
    if (f.nat && !naturalezaVisible(a,{id:"filtro-naturaleza",nat:f.nat})) f.nat="";
    const lista = [...D.tecnicas, ...extraMundo(), ...(e.propias ?? []).filter(t => !t.modo)].filter(t => {
      if (!naturalezaVisible(a, t) || t.retirada) return false;
      if (f.rama && t.rama !== f.rama) return false;
      if (f.grado !== "" && String(t.g) !== String(f.grado)) return false;
      if (f.nat && t.nat !== f.nat) return false;
      if (f.estudiando && !e.estudios?.[t.id]) return false;
      if (f.texto && !`${t.n} ${(t.alias ?? []).join(" ")} ${textoDe(t)}`.toLowerCase().includes(f.texto.toLowerCase())) return false;
      if (!dm()) {
        if (t.soloDM) return false;
        if (t.familia && !(e.tradiciones ?? []).includes(t.familia) && familiaDeSangre(D.linajes, e.linaje, e.fuerza) !== t.familia) return false; // 3.27/3.31: artes de familia: de nacimiento, es decir, de la sangre de su dios
        const esSangre = t.sec === "sangre" || D.linajes.some(l => l.req && l.req === t.req);
        if (esSangre && !t.item.flags[MOD][F].shinobi && (!ve || !herenciaDe(a) || (t.req !== "una herencia" && herenciaDe(a).req !== t.req))) return false;
        if (t.rama === "mirada" && !(e.miradas ?? {})[t.id.split("-")[1]]) return false;
      }
      return true;
    });
    const porGrupo = new Map();
    let ocultas = 0;
    for (const t of lista) {
      const r = requisitos(a, t);
      const sabe = conoce(a, t.id);
      if (f.solo && !r.ok && !r.estudio && !sabe && !combosDe(a).has(t.nat)) { ocultas += 1; continue; }
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
    const natsF = [...Object.entries(NATS).filter(([n]) => natsDe(a).has(n) || natsDe(a).size < 2), ...Object.entries(D.combos).filter(([n]) => combosDe(a).has(n)).map(([k, v]) => [k, v.nombre])];
    const ramasF = D.ramas.filter(r => r.id !== "sangre" || ve).map(r => [r.id, r.nombre]);
    const misRamas = D.ramas.filter(r => (r.id !== "sangre" || ve) && ramaAbierta(a, r.id)).map(r => { const rg = rangoDe(a, r.id); return `<li><b>${escH(r.nombre)}</b>${e.principal === r.id ? " (principal)" : ""}: ${escH(nombreRango(rg))} · aprendes hasta <b>grado ${Math.min(gradoMax(a), rangoGrado(rg))}</b></li>`; }).join("");
    const ramasPrimero = `<details class="ev-ramas-primero" ${(e.compras ?? []).length < 3 ? "open" : ""}><summary><b>${escH(RAMAS_PRIMERO.titulo)}</b></summary><ol>${RAMAS_PRIMERO.texto.map(x => `<li>${escH(x)}</li>`).join("")}</ol>
      ${misRamas ? `<p><b>Tus ramas hoy:</b></p><ul class="ecos-verbe-lista">${misRamas}</ul>` : ""}<div class="ev-acciones"><button type="button" data-action="pestana" data-p="ramas"><i class="fa-solid fa-seedling" aria-hidden="true"></i> Subir mis ramas</button><button type="button" data-action="pestana" data-p="dotes"><i class="fa-solid fa-star" aria-hidden="true"></i> Ver dotes que potencian técnicas</button></div></details>`;
    return `${ramasPrimero}${intro("Aquí aprendes técnicas.", "Haz clic en una para ver su ficha completa. El botón «Aprender» paga Trazos y la añade a tu repertorio; no la activa. Después la usas desde «Mis técnicas», pagando el Verbe indicado.",
      `<ul class="ecos-verbe-lista"><li><b>G</b> es el grado: qué tan fuerte es. Puedes aprender hasta tu grado máximo (${gradoMax(a)}) y, en cada rama, hasta lo que deja tu rango en ella (Mejorar → Especialidades).</li>
        <li><b>Verbe</b> es lo que gasta cada uso; el botón dice cuántos <b>Trazos</b> cuesta aprenderla.</li>
        <li><b>Probar</b>: es de una naturaleza que no tienes. Si tu Verbe responde, la aprendes; si no, no pierdes nada.</li>
        <li><b>Pedir al DM</b>: pide un maestro; el DM la aprueba.</li></ul>`, "tecnicas-y-grados")}
      ${Object.keys(e.estudios ?? {}).length ? `<div class="ecos-verbe-estudios"><b>Estudiando ahora:</b> ${Object.values(e.estudios).map(x => `${escH(tecnicaPorId(x.id, a)?.n ?? x.id)} (${x.progreso}/${x.exitos})`).join(" · ")}. Busca cada una en la lista para practicar hoy.</div>` : ""}
      ${aprenderPorDias(a) ? `<p class="ecos-nota"><b>Aprender lleva días (3.27).</b> Pagas los Trazos y empiezas a estudiar. Cada día del calendario tiras Control del Verbe (CD 10 + grado); necesitas tantos días buenos como su grado + 1. Un 20 natural cuenta doble; un 1 natural te hace perder un día de avance.</p>` : ""}
      <div class="ev-contraste-recursos"><div><b>Aprender = pagar Trazos una vez</b><span>Lo aprendido pasa a «Mis técnicas».</span></div><div><b>Usar = gastar Verbe cada vez</b><span>El coste tiene en cuenta tus mejoras y el contexto actual.</span></div></div>
      <div class="ecos-verbe-filtros"><label class="ev-busqueda"><span>Buscar una técnica</span><input type="search" data-filtro="texto" placeholder="Nombre o efecto…" value="${escH(f.texto)}"></label>
      <label><input type="checkbox" data-filtro="solo" ${f.solo ? "checked" : ""}> Solo disponibles y aprendidas</label><label><input type="checkbox" data-filtro="estudiando" ${f.estudiando ? "checked" : ""}> Solo las que estoy entrenando</label><button type="button" data-action="limpiarFiltros">Restablecer</button></div>
      <details class="ev-filtros-extra" ${f.rama || f.grado !== "" || f.nat ? "open" : ""}><summary>Filtrar por especialidad, grado o elemento</summary><div class="ecos-verbe-filtros">
      <label>Especialidad <select data-filtro="rama"><option value="">Todas las ramas</option>${opciones(ramasF, f.rama)}</select></label>
      <label>Potencia <select data-filtro="grado"><option value="">Todos los grados</option>${opciones([...Array(GRADO_TOPE + 1).keys()].map(g => [g, `Grado ${g}`]), String(f.grado))}</select></label>
      <label>Elemento <select data-filtro="nat"><option value="">Todos los elementos</option>${opciones(natsF, f.nat)}</select></label>
      <label>Agrupar <select data-filtro="agrupar">${opciones([["rama", "Por especialidad"], ["grado", "Por grado"]], f.agrupar ?? "rama")}</select></label></div></details>
      ${f.solo && ocultas ? `<p class="ecos-nota">Hay ${ocultas} técnicas más que todavía no puedes aprender: desmarca la casilla para verlas y saber qué piden.</p>` : ""}
      ${grupos || '<div class="ev-vacio"><h3>No hay técnicas con esos filtros</h3><p>Restablece la búsqueda o desmarca «Solo disponibles y aprendidas» para ver qué te falta.</p><button type="button" data-action="limpiarFiltros">Restablecer filtros</button></div>'}`;
  }

  #filaTec(t, r, sabe) {
    const chocaTec = x => { try { return tecnicaChocable({ getFlag: (m, k) => x.item?.flags?.[m]?.[k], flags: x.item?.flags, system: x.item?.system, name: x.n, type: x.item?.type, actor: this.actor }); } catch { return false; } };
    const est = r.estudio ? estudioDe(this.actor, t.id) : null;
    const hoy = diaMundo();
    const btn = est ? `<span class="ecos-verbe-estudio"><b>Estudiando:</b> ${est.progreso}/${est.exitos} días buenos · CD ${est.cd}</span>
        ${est.ultimoDia === hoy ? `<small>Hoy ya practicó: mañana sigue.</small>` : `<button type="button" data-action="practicar" data-id="${t.id}" data-tooltip="Una tirada de Control del Verbe por día del calendario"><i class="fa-solid fa-dice-d20"></i> Practicar hoy</button>`}
        ${dm() ? `<button type="button" data-action="aprenderYa" data-id="${t.id}" data-tooltip="DM: darla por aprendida ya">DM: aprender ya</button>` : ""}`
      : sabe ? '<button type="button" data-action="pestana" data-p="jugar">Aprendida · ir a Mis técnicas</button>'
      : r.ok && r.probar ? `<button type="button" data-action="probar" data-id="${t.id}" data-tooltip="Si tu Verbe responde, la descubres y aprendes. Si no, no pierdes Trazos">Probar · ${t.trazos} ${t.trazos === 1 ? "Trazo" : "Trazos"} si responde</button>`
        : r.ok ? `<button type="button" data-action="aprender" data-id="${t.id}" data-tooltip="${aprenderPorDias(this.actor) ? `Pagas los Trazos y empiezas a estudiarla: ${planEstudio(t.g).exitos} día(s) bueno(s) de práctica, Control CD ${planEstudio(t.g).cd}` : "Pagas los Trazos y la sabes ya"}">${r.pideDM && !game.user.isGM ? "Pedir al DM" : aprenderPorDias(this.actor) ? "Estudiar" : "Aprender"} · ${t.trazos} Trazo${t.trazos === 1 ? "" : "s"}</button>`
          : `<span class="ecos-verbe-no" data-tooltip="${escH(r.motivo)}">${escH(textoClaro(r.motivo))}</span>`;
    const tiempo = TIEMPO_L[t.t] ?? t.t ?? "";
    const meta = itemsDe(this.actor, t.id)[0]?.getFlag(MOD, F) ?? { ...t.item.flags[MOD][F], infusion: estado(this.actor)?.infusiones?.[t.id] ?? null };
    const costo = previsualizarUso(this.actor, meta).costo;
    return `<details class="ecos-verbe-tec ${sabe ? "sabe" : est ? "puede estudia" : r.ok ? "puede" : "no"}" data-id="${t.id}" data-tipo="tec"><summary>
      <span class="gr">Grado ${t.g}</span><span class="nom"><b>${escH(t.n)}</b><small>${escH((t.alias??[]).slice(0,2).join(" · "))}</small><small>${escH([tiempo, t.alc ? alcanceL(t.alc, t.area) : null, t.area].filter(Boolean).join(" · "))}</small><small class="ev-efecto-breve">${escH(avanceTexto(textoDe(t)))}</small><small>${chocaTec(t) ? '<span class="ev-choca" data-tooltip="Si otra técnica la enfrenta, se puede abrir un choque de técnicas (Ayuda rápida → Tutorial: choques).">⚔ Choca</span>' : '<span class="ev-nochoca" data-tooltip="No abre choques de técnicas: no cuesta Verbe o no se dirige contra otra técnica.">No choca</span>'} · Abre la ficha para leer todas sus condiciones.</small></span>
      <span class="vb"><b>${costo} Verbe</b><small>por uso base</small></span><span class="acc">${btn}${!sabe && r.ok && !r.probar ? `<small>Te quedarían ${trazos(this.actor).libres - t.trazos} Trazos</small>` : ""}</span></summary><div class="ecos-verbe-ficha-cont"></div></details>`;
  }

  #fichaTec(id) {
    const a = this.actor;
    const t = tecnicaPorId(id, a);
    if (!t) return "";
    const r = requisitos(a, t);
    const it = t.item;
    const act = Object.values(it?.system?.activities ?? {})[0];
    const nivel = Math.max(nivelParaGrado(t.g),Number(t.nivelMin)||1);
    const rangoN = D.rangos.findIndex(x => x.grado >= t.g);
    const durTxt = duracionTexto(t);
    const tirada = t.tir === "ataque" ? `Ataque${t.veces > 1 ? ` (${t.veces} ataques)` : ""}` : t.tir ? `Salvación de ${textoClaro(t.tir)}${t.dmg ? (t.mitad ? ", mitad si la supera" : ", nada si la supera") : ""}` : "Ninguna";
    const extra = it ? Math.floor(dadosExtra(a, it.flags?.[MOD]?.[F] ?? t, null)/(Number(it.flags?.[MOD]?.[F]?.divisorDados)||1)) : 0;
    const dano = t.dmg ? `${t.veces > 1 ? `${t.veces} × ` : ""}${escH(t.dmg)}${extra ? ` <b>(+${extra} dado${extra > 1 ? "s" : ""} tuyo${extra > 1 ? "s" : ""})</b>` : ""}` : "—";
    const deja = (it?.effects ?? []).map(ef => (ESTADOS[ef.statuses?.[0]] ? `<span data-tooltip="${escH(ESTADOS[ef.statuses[0]].texto)}">${escH(ef.name)}</span>` : escH(ef.name))).join(", ") || "—";
    const sube = t.sube === "truco" ? "más dados en los niveles 5, 11 y 17" : t.sube ? `${escH(t.sube)} por cada grado de más` : (t.g > 0 ? "—" : "—");
    const meta = itemsDe(a, id)[0]?.getFlag(MOD, F) ?? { ...it.flags[MOD][F], infusion: estado(a)?.infusiones?.[id] ?? null };
    const verbes = t.g > 0 ? Array.from({ length: Math.max(0, gradoUsable(a, meta) - t.g) + 1 }, (_, i) => `grado ${t.g + i}: ${costoUso(a, meta, t.g + i, { infusion: meta.infusion })} Verbe`).join(" · ") : `${costoUso(a, meta, 0, { infusion: meta.infusion })} Verbe (pide tener al menos 1)`;
    const ac=meta.acceso??{}, requeridos=[t.previa?`Primero aprende: ${tecnicaPorId(t.previa,a)?.n??t.previa}`:null,ac.fuerzas?.length?`Fuerza de sangre: ${ac.fuerzas.map(f=>FUERZA[f]?.nombre??f).join(" o ")}`:null,...(ac.modos??[]).map(m=>`Modo activo: ${m.replaceAll("-"," ")}`),ac.tradicion?`Tradición: ${D.tradicionesShinobi?.find(x=>x.id===ac.tradicion)?.nombre??ac.tradicion}`:null,ac.herencia?`Herencia: ${ac.herencia}`:null,ac.ojo?`${D.miradas.find(x=>x.id===ac.ojo.id)?.nombre??ac.ojo.id}, etapa ${ac.ojo.etapa}; abrir para usar`:null,ac.hito?`Hito: ${D.hitosShinobi?.find(x=>x.id===ac.hito)?.nombre??ac.hito}`:null,ac.bestia?`Bestia: ${D.bestiasShinobi?.find(x=>x.id===ac.bestia)?.nombre??ac.bestia}`:ac.vasija?'Una bestia vinculada':null,ac.vinculo?`Vínculo ${ac.vinculo}`:null,ac.cerrojo?`Cerrojo ${ac.cerrojo} aprendido y abierto para usar`:null,ac.artefacto?`${D.artefactosShinobi?.find(x=>x.id===ac.artefacto)?.nombre??ac.artefacto} equipado para usar`:null,ac.modo?`Modo activo: ${ac.modo.replaceAll('-',' ')}`:null,meta.ritual?'Preparativos y permiso del DM para cada uso':null,meta.familiaUso?'Comparte un uso por largo con sus variantes':null].filter(Boolean).map(escH);
    const pide = [t.g ? `nivel ${nivel}` : null, rangoN > 0 ? `${nombreRango(rangoN)} en ${nombreRama(t.rama)}` : null, t.nat ? `naturaleza ${nombreNat(t.nat)}` : null,...requeridos,
      t.req && !(t.sec === "sangre" && !dm()) ? escH(t.req) : null].filter(Boolean).join(" · ") || "—";
    const f = (k, v) => `<th>${k}</th><td>${v}</td>`;
    const conocida=conoce(a,t.id),uso=previsualizarUso(a,meta);
    return `<div class="ev-contraste-recursos"><div><b>${t.incl?"Incluida con su Mirada":`Aprender · ${t.trazos} Trazos`}</b><p>${conocida?"Ya está en tu repertorio.":r.ok?(r.probar?"Primero prueba si tu elemento responde.":r.pideDM?"Necesita aprobación del DM.":"Cumples los requisitos de aprendizaje."):escH(textoClaro(r.motivo))}</p></div><div><b>Usar · ${textoCostoControl(uso.costo, etapaDe(estado(a)), ajuste("dadoControl", true))} Verbe al grado base</b>${!conocida?'<p>Primero debes aprenderla. Este precio corresponde a su uso posterior.</p>':D.defensas?.[id]?'<p>Es una defensa: espera su disparador. El coste definitivo depende del ataque recibido.</p>':estadoUsoHTML(uso)}</div></div>
      <h3>Qué hace</h3>${efectoHTML(textoDe(t))}
      <h3>Cómo se usa</h3><p>${escH(resolucionTexto(t))}</p>${D.defensas?.[id]?'<p><b>Defensa reactiva:</b> se elige cuando se ofrece contra una amenaza válida, antes del choque. Conserva los requisitos de objeto, visibilidad y reacción de su ficha. El DM resuelve las posiciones que no se muevan automáticamente.</p>':""}
      <details class="ev-datos-avanzados" open><summary>Qué cuesta y qué necesitas</summary>
      <table class="ecos-verbe-ficha">
        <tr>${f("Rama", `${nombreRama(t.rama)}${t.nat ? ` · ${escH(nombreNat(t.nat))}` : ""}`)}${f("Grado", `${t.g}${t.g >= 6 ? " · una vez por Descanso Largo" : ""}`)}</tr>
        <tr>${f("Tiempo", escH(TIEMPO_L[t.t] ?? t.t ?? "—"))}${f("Alcance", escH(t.alc ? alcanceL(t.alc, t.area) : "—"))}</tr>
        <tr>${f("Área", escH(t.area ?? "—"))}${f("Duración", escH(durTxt))}</tr>
        <tr>${f("Componentes", escH(COMP_L[t.comp] ?? t.comp ?? "—"))}${f("Tirada", tirada)}</tr>
        <tr>${f("Daño o curación", dano)}${f("Efectos registrados", deja)}</tr>
        <tr>${f("Usa", USA_TXT[(it?.flags?.[MOD]?.[F]?.usa) ?? "verbe"] ?? "")}${f("Al elegir un grado mayor", sube)}</tr>
        <tr>${f("Verbe por uso", verbes)}${f("Para aprender", t.incl?"Incluida en su etapa de Mirada":`${t.trazos} Trazo${t.trazos === 1 ? "" : "s"}${t.rara ? " (rara: +1 ya incluido)" : ""}`)}</tr>
        <tr>${f("Pide", pide+(t.g>=6?` · ${t.g>=9?"Leyenda":"Maestría"} de ${nombreRama(t.rama)} para aprender${t.g>=10?" · Ascensión mítica":""}${t.g===11?" · Ascensión trascendente":""}`:""))}${f("Aprendizaje", conoce(a, t.id) ? "ya la sabes" : r.ok ? (r.probar ? "probarla" : "sí") : escH(r.motivo))}</tr>
      </table><p class="ev-nota">La cifra de daño o curación anterior es la base y muestra por separado los dados extra. La tirada de tu actividad ya incluye las mejoras calculadas: no las sumes otra vez.</p></details>${referenciaHTML(t,{dm:dm()})}${t.automatizacion?`<details><summary>Qué se aplica en la hoja y qué resuelve el DM</summary><p>${escH(textoClaro(t.automatizacion))}</p></details>`:""}${act && act.type === "save" && t.g > 0 ? `<p class="ecos-nota">La dificultad definitiva aparece en la actividad de uso e incluye las mejoras que correspondan.</p>` : ""}
      ${t.fuerte ? `<p class="ecos-verbe-fuerte"><b>Contra alguien más fuerte:</b> ${escH(D.textoFuerte ?? "")}</p>` : ""}
      ${t.prog?.length ? `<div class="ecos-verbe-crece"><details><summary>Progresión y excepciones de esta técnica</summary><ul>${t.prog.map(x => `<li>${escH(textoClaro(x))}</li>`).join("")}</ul></details></div>` : ""}
      ${t.mejora?.length ? `<div class="ecos-verbe-mejora"><details><summary>Opciones para mejorarla más adelante</summary><p>Estas son posibilidades, no beneficios que ya tengas. Debes comprar o conseguir cada mejora y respetar sus límites.</p><ul>${t.mejora.map(x => `<li>${escH(textoClaro(x))}</li>`).join("")}</ul></details></div>` : ""}`;
  }

  /** 3.64: todo lo que está entrenando (técnicas, dotes, naturaleza) y el entrenamiento para ganar Trazos. */
  #entreno() {
    const a = this.actor, e = estado(a), hoy = diaMundo();
    const tecs = Object.values(e.estudios ?? {}).map(x => {
      const t = tecnicaPorId(x.id, a);
      return `<li><b>${escH(t?.n ?? x.id)}</b> · técnica · ${x.progreso}/${x.exitos} días buenos · CD ${x.cd}
        ${x.ultimoDia === hoy ? "<small>Hoy ya practicó.</small>" : `<button type="button" data-action="practicar" data-id="${escH(x.id)}"><i class="fa-solid fa-dice-d20"></i> Practicar hoy</button>`}
        ${dm() ? `<button type="button" data-action="aprenderYa" data-id="${escH(x.id)}">Dar por aprendida (DM)</button>` : ""}</li>`;
    }).join("");
    const dts = Object.values(e.entrenosDote ?? {}).map(x => {
      const d = D.dotes.find(y => y.id === x.id);
      const bloqueado = x.unidad === "dias" && x.ultimoDia === hoy;
      const clase = d ? "dote entrenada" : { rama: "abrir rama", rango: "rango de rama", control: "Control del Verbe" }[String(x.id).split(":")[0]] ?? "entrenamiento";
      return `<li><b>${escH(d?.nombre ?? x.nombre ?? x.id)}</b> · ${clase} · ${x.progreso}/${x.exitos} · ${escH(textoPlan(x))} · CD ${x.cd}
        ${bloqueado ? "<small>Hoy ya entrenó.</small>" : `<button type="button" data-action="entrenarDote" data-id="${escH(x.id)}"><i class="fa-solid fa-dice-d20"></i> Entrenar ${x.unidad === "horas" ? `(${x.bloque} h)` : "hoy"}</button>`}
        <button type="button" data-action="cancelarDote" data-id="${escH(x.id)}">Dejar</button>${dm() ? ` <button type="button" data-action="terminarDote" data-id="${escH(x.id)}">Dar por aprendida (DM)</button>` : ""}</li>`;
    }).join("");
    const nat = e.entrenoNat ? `<li><b>Naturaleza</b> · ${escH(e.entrenoNat.nombre ?? "entrenando")} · sigue en Mejorar → Tus elementos.</li>` : "";
    const c = e.crecimiento ?? {}, meta = puntosPorTrazo({}), ganadas = Number(c.ganados?.[nivelDe(a)]) || 0;
    const crecer = `<section class="ev-bienvenida"><h3>Entrenar o meditar para ganar Trazos</h3>
      <p>Un día de entrenamiento o meditación: tirada contra CD ${CD_CRECIMIENTO}. Cada día bueno da 1 punto (un 20 natural, 2). Con <b>${meta}</b> puntos ganas <b>1 Trazo</b>; con un compañero que entrena contigo bastan 4, y con un maestro (sensei), 3. Hasta ${TOPE_CRECIMIENTO_NIVEL} Trazos así por nivel.</p>
      <p>Llevas <b>${Number(c.puntos) || 0}</b> puntos · ${ganadas}/${TOPE_CRECIMIENTO_NIVEL} Trazos ganados en este nivel.</p>
      <label>Qué haces <select name="crecerActividad">${Object.entries(ACTIVIDADES_CRECIMIENTO).map(([k, v]) => `<option value="${k}">${escH(v.nombre)} (${CARS[v.car] ?? v.car})</option>`).join("")}</select></label>
      <label class="ecos-check"><input type="checkbox" name="crecerSensei"> Con un maestro (sensei)</label> <label class="ecos-check"><input type="checkbox" name="crecerCompanero"> Con un compañero</label>
      <p>${c.ultimoDia === hoy ? "<small>Hoy ya entrenó o meditó: mañana puede seguir.</small>" : `<button type="button" data-action="crecer"><i class="fa-solid fa-person-praying"></i> Entrenar o meditar hoy</button>`}</p></section>`;
    const et = datosEtapa(etapaDe(e));
    const etapaHTML = `<section class="ev-bienvenida"><h3>Tu etapa: ${escH(et.nombre)}</h3><p>${escH(et.texto)}</p>${comoSubirHTML(et.n, escH)}<p class="ecos-nota">El plan completo está en «Reglas de la casa» → 19 · Plan de estudios del sensei.</p></section>`;
    return `${intro("Lo que estás entrenando.", "Las técnicas se practican un día del calendario cada una. Las dotes entrenadas, por bloques de horas o por días. Un 20 natural las da al instante.", "", "tecnicas-y-grados")}${etapaHTML}
      ${tecs || dts || nat ? `<ul class="ecos-verbe-lista">${tecs}${dts}${nat}</ul>` : "<p>No estás entrenando nada. Elige una técnica en «Aprender técnicas» o una dote entrenada en «Mejorar → Dotes».</p>"}${crecer}`;
  }

  #dotes() {
    const a = this.actor;
    const f = this.filtroDote ??= { texto: "", solo: false };
    const porCat = new Map();
    const eSangre = estado(a) ?? {}, natsConocidas = natsDe(a);
    let ocultasElemento = 0;
    for (const d of D.dotes) {
      if (d.legado && !dm() && (!d.requisitos?.linajes?.includes(eSangre.linaje) || !eSangre.linajeVisible)) continue;
      // 3.38: las dotes de un elemento no aparecen hasta descubrir ese elemento (el DM las ve igual).
      if (d.requisitos?.naturaleza && !natsConocidas.has(d.requisitos.naturaleza) && !dm() && !(estado(a)?.dotes ?? []).includes(d.id)) { ocultasElemento++; continue; } // 3.31: solo el legado de su sangre, y solo si la conoce
      if (f.texto && !`${d.nombre} ${dotTexto(d)}`.toLowerCase().includes(f.texto.toLowerCase())) continue;
      const tiene = tieneDote(a, d.id);
      const r = cumpleReqDote(a, d);
      if (f.solo && !tiene && !(r.ok && trazos(a).libres >= d.trazos)) continue;
      // 3.64: dones (de nacimiento, de sangre) y dotes entrenadas, separados.
      const tipo = tipoDoteDe(d), entrenando = !!estado(a)?.entrenosDote?.[d.id];
      if (f.tipo === "entrenando" ? !entrenando : f.tipo && f.tipo !== tipo) continue;
      const c = `${tipo}:${d.cat ?? "otras"}`;
      if (!porCat.has(c)) porCat.set(c, []);
      porCat.get(c).push({ d, tiene, r });
    }
    const cats = D.categoriasDote ?? [];
    const orden = c => { const [tipo, cat] = c.split(":"); const i = cats.findIndex(x => x.id === cat); return (tipo === "don" ? 0 : 100) + (i < 0 ? 99 : i); };
    let tipoAnterior = null;
    const html = [...porCat.entries()].sort((x, y) => orden(x[0]) - orden(y[0])).map(([c, ds]) => {
      ds.sort((x, y) => x.d.trazos - y.d.trazos || x.d.nombre.localeCompare(y.d.nombre));
      const [tipo, idCat] = c.split(":");
      const cat = cats.find(x => x.id === idCat);
      const k = `dote-${c}`;
      const abierto = this.abiertos ? this.abiertos.has(k) : !!f.texto;
      const cabecera = tipo !== tipoAnterior ? (tipoAnterior = tipo, tipo === "don"
        ? `<h3 class="ev-tipo-dote">Dones <small>De nacimiento, de tu sangre o de tu naturaleza: se tienen al comprarlos (o los concede el DM).</small></h3>`
        : `<h3 class="ev-tipo-dote">Dotes entrenadas <small>Se entrenan: horas las pequeñas, días las grandes, una tirada por bloque; un 20 natural las da al instante.</small></h3>`) : "";
      return `${cabecera}<details class="ecos-verbe-grupo" data-g="${k}" ${abierto ? "open" : ""}><summary><b>${escH(cat?.nombre ?? "Otras")}</b> <span>${escH(cat?.texto ?? "")} · ${ds.length}</span></summary>
        ${ds.map(({ d, tiene, r }) => {
          const faltan = Math.max(0, d.trazos - trazos(a).libres);
          const ent = estado(a)?.entrenosDote?.[d.id], esEnt = tipoDoteDe(d) === "entrenada" && ajuste("dotesEntrenadas", true);
          const marcar = dm() ? ` <button type="button" class="ev-mini" data-action="tipoDote" data-id="${escH(d.id)}" data-tipo="${tipoDoteDe(d) === "don" ? "entrenada" : "don"}" data-tooltip="DM: pasarla a ${tipoDoteDe(d) === "don" ? "entrenada" : "don"}">↔</button>` : "";
          const btn = tiene ? `<span class='ecos-verbe-pill'>${d.innato ? "de nacimiento" : "la tienes"}</span>${d.poder?`<button type="button" data-action="usarDote" data-id="${escH(d.id)}" ${estado(a).usosDote?.[d.id]||!doteActiva(a,d)?"disabled":""}>${estado(a).usosDote?.[d.id]?"Usada hasta el largo":"Activar"}</button>`:""}`
            : ent ? `<span class='ecos-verbe-pill'>Entrenando ${ent.progreso}/${ent.exitos}</span><button type="button" data-action="entrenarDote" data-id="${escH(d.id)}">Entrenar</button>`
            : r.ok ? `<button type="button" data-action="dote" data-id="${d.id}" ${faltan ? "disabled" : ""}>${r.pideDM && !game.user.isGM ? "Pedir al DM" : esEnt ? "Entrenar" : "Comprar"} · ${d.trazos} Trazos</button><small>${faltan ? `Te faltan ${faltan} Trazos` : esEnt ? escH(textoPlan(planDote(d.trazos))) : `Te quedarían ${trazos(a).libres - d.trazos} Trazos`}</small>`
              : `<span class="ecos-verbe-no">${escH(textoClaro(r.motivo))}</span>`;
          return `<details class="ecos-verbe-tec ${tiene ? "sabe" : r.ok ? "puede" : "no"}" data-id="${d.id}" data-tipo="dote"><summary>
            <span class="gr" data-tooltip="Coste de compra en Trazos">${d.trazos}<small>Trazos</small></span><span class="nom"><b>${escH(d.nombre)}</b><small>${escH(avanceTexto(dotTexto(d),120))}</small></span>
            <span class="acc">${btn}${marcar}</span></summary><div class="ecos-verbe-ficha-cont"></div></details>`;
        }).join("")}</details>`;
    }).join("");
    return `${intro("Mejoras permanentes del Verbe.", "Abre una categoría según el beneficio que buscas o usa el buscador. Cada dote se paga una vez con Trazos y queda como rasgo en tu hoja; las que piden un maestro requieren al DM.", "", "dotes")}${ocultasElemento ? `<p class="ecos-nota">Hay ${ocultasElemento} dotes de elemento más: aparecen cuando descubras tu naturaleza (fuego, agua, viento, tierra o rayo).</p>` : ""}
      <div class="ev-instruccion"><span><b>Sendas:</b> Disciplina (nivel 3) → Especialista (nivel 7) → Maestría (nivel 11) → Leyenda (nivel 18). Son dotes que se compran por orden; Maestro es un rango distinto. Grado 10 pide Ascensión mítica y 11 Ascensión trascendente; el DM concede sus pruebas de historia.</span></div>
      <div class="ecos-verbe-filtros"><label class="ev-busqueda"><span>Buscar una mejora</span><input type="search" data-filtro-dote="texto" placeholder="Nombre o beneficio…" value="${escH(f.texto)}"></label>
        <label><input type="checkbox" data-filtro-dote="solo" ${f.solo ? "checked" : ""}> Solo las que puedo comprar ahora</label>
        <label>Tipo <select data-filtro-dote="tipo">${[["", "Todas"], ["don", "Dones"], ["entrenada", "Entrenadas"], ["entrenando", "Entrenando ahora"]].map(([k, n]) => `<option value="${k}" ${(f.tipo ?? "") === k ? "selected" : ""}>${n}</option>`).join("")}</select></label></div>
      ${html || "<p>Nada con ese filtro.</p>"}`;
  }

  #fichaDote(id) {
    const a = this.actor;
    const d = D.dotes.find(x => x.id === id);
    if (!d) return "";
    const r = cumpleReqDote(a, d);
    const cat = (D.categoriasDote ?? []).find(x => x.id === d.cat);
    return `${queEsDoteHTML(d)}<h3>Qué ganas</h3>${efectoHTML(dotTexto(d))}${d.poder?`<p><b>Uso activo:</b> ${d.poder.costo??0} Verbe. ${estado(a).usosDote?.[d.id]?"Ya lo usaste; vuelve tras un Descanso Largo.":"Actívalo desde su botón cuando cumplas las condiciones."} Comprar esta dote y activar su poder son pasos distintos.</p>`:"<p>La dote queda aprendida. Su beneficio se aplica solo en las condiciones descritas; no siempre está activo.</p>"}<p class="ecos-nota"><b>Cómo se usa:</b> ${escH(d.automatizacion??"Revisa con el DM las condiciones del beneficio.")}</p>
      <table class="ecos-verbe-ficha"><tr><th>Precio</th><td>${d.trazos} Trazos</td><th>Pide</th><td>${escH(textoClaro(requisitosDoteTexto(d)))}</td></tr>
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
      const opcionesEntrenar = opcionesCultivo(tec, cul, costoUso(a, meta, tec.g),{dados:dadosExtra(a,meta),tope:limiteDadosExtra(tec.g),minimo:pisoCosto(tec.g,D.costo),cdUsada:cdCultivo(a,tec,cul)});
      const activas = opcionesEntrenar.filter(o=>o.ok);
      const opc = activas.filter(o=>o.id !== "infusion").map(o=>[o.id,`${o.nombre} · ${o.costo} Trazos`]);
      if (activas.some(o=>o.id === "infusion")) for (const n of [...nats, ...combosDe(a)]) opc.push([`infusion:${n}`,`Infusión fija: ${nombreNat(n)} · ${activas.find(o=>o.id === "infusion").costo} Trazos`]);
      const conDano = activas.some(o=>o.id === "infusion") || Object.values(tec.item?.system?.activities ?? {}).some(x=>!x.healing && x.damage?.parts?.length);
      const infSel = INFUNDIBLES.has(tec.sec) && conDano ? `<select name="inf-${meta.id}"><option value="">Sin infusión</option>${opciones([...nats.map(n => [n, NATS[n] ?? n]), ...[...combosDe(a)].map(c => [c, nombreNat(c)])], e.infusiones?.[meta.id] ?? "")}</select>
        <button type="button" data-action="infundir" data-id="${meta.id}" data-tooltip="Su daño pasa a ser de ese elemento y deja su estado. Cada uso cuesta 2 Verbe más (4 con una combinación). Se cambia cuando quieras">Infundir</button>` : "<small>No se infunde</small>";
      const pend = Number(cul.pendiente) > 0;
      const acc = (cul.nivel < 3 || pend) ? (opc.length?`<select name="mejora-${meta.id}" aria-label="Mejora para ${escH(it.name)}">${opciones(opc, "dado")}</select> <button type="button" data-action="cultivar" data-id="${meta.id}">${pend ? "Elegir mejora ya pagada" : `Entrenar: ${NIVEL_CULTIVO[cul.nivel + 1]}`}</button>`:"No quedan mejoras compatibles con esta técnica y sus límites actuales.") : "Entrenamiento completo: Propia";
      const der = [cul.nivel >= 2 ? `<button type="button" data-action="crear" data-base="${meta.id}" data-modo="variante" data-tooltip="Una técnica hermana con otra forma: lanzada, más grande, contra dos blancos">Sacar una variante</button>` : "",
        cul.nivel >= 3 ? `<button type="button" data-action="crear" data-base="${meta.id}" data-modo="evolucion" data-tooltip="Una técnica nueva, hasta tres grados más, con tu firma">Evolucionarla</button>` : ""].join(" ").trim();
      return `<tr><td><b>${escH(it.name)}</b><br><small>Grado ${tec.g} · ${NIVEL_CULTIVO[cul.nivel]}${cul.mejoras.length ? ` · ${cul.mejoras.map(m => MEJORAS[m] ?? "infusión fija").join(", ")}` : ""}${tec.base ? " · derivada" : ""}</small></td>
        <td>${acc}${der ? `<br>${der}` : ""}</td><td>${infSel}</td></tr>`;
    }).join("");
    return `${intro("Entrena una técnica que ya sabes para que crezca.", `Este entrenamiento se llama cultivo. Elige una técnica, selecciona una mejora y revisa sus Trazos antes de pulsar Entrenar. Cada opción muestra su coste completo. Has entrenado ${usadas} de las ${competencia(a)+sumaEf(a,ef=>ef.cultivosExtra)} técnicas distintas que puedes tener en cultivo.`,
      `<p>El entrenamiento avanza por Pulida → Dominada → Propia. El menú oculta mejoras que no afectan a esa técnica o que ya alcanzaron su tope. El coste combina el paso nuevo (1, 2 o 3 Trazos) y el recargo de la mejora; el precio de la opción ya incluye ambas cosas.</p><ul class="ecos-verbe-lista">${D.mejoras.map(m => `<li>${escH(m)}</li>`).join("")}</ul>
      <p>Desde Dominada puedes proponer una variante; desde Propia puedes proponer una evolución. Crear esas técnicas requiere aprobación del DM y su propio coste.</p><p><b>Infundir es otra elección:</b> añade tu elemento a una técnica compatible. No cuesta Trazos; añade 2 Verbe por uso, o 4 si es una combinación, antes de los descuentos que procedan. Una infusión fija comprada como mejora tiene sus propias condiciones.</p>`, "cultivo")}
      <table class="ecos-verbe-tabla"><thead><tr><th>Técnica</th><th>Elegir mejora y entrenar</th><th>Infusión</th></tr></thead><tbody>${filas || "<tr><td colspan=\"3\">Todavía no sabes técnicas: apréndelas en Aprender.</td></tr>"}</tbody></table>
      <p class="ecos-nota"><button type="button" data-action="rearmar">Actualizar mis fichas</button> vuelve a preparar sus datos después de subir de nivel o rango; no compra mejoras nuevas.</p>`;
  }

  #crear() {
    const a = this.actor;
    const ramas = D.ramas.filter(r => rangoDe(a, r.id) >= 1 && ramaAbierta(a, r.id) && r.id !== "sangre");
    return `${intro("Inventa tus propias técnicas.", "Desde Entrenado en una rama puedes crear técnicas de esa rama. El menú ayuda a preparar una propuesta para el DM. Él revisa el efecto, sus límites y su coste antes de aprobarla.",
      `<p>Cuesta su grado + 1 en Trazos (+1 si mezcla dos naturalezas), tantos días de trabajo como su grado y 25 de oro por grado. Llega hasta el grado que te deja tu rango en la rama menos uno; desde Maestro, hasta ese grado entero.</p>`, "crear-tecnicas")}
      <p>${ramas.length ? `Puedes crear en: ${ramas.map(r => `<b>${r.nombre}</b> (hasta grado ${gradoCrear(a, r.id)})`).join(", ")}.` : "Todavía no tienes Entrenado en ninguna rama."}</p>
      <p><button type="button" data-action="crear" ${ramas.length ? "" : "disabled"}><i class="fa-solid fa-pen-nib"></i> Preparar una propuesta de técnica</button></p>
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
    const todas = [...D.tecnicas,...extraMundo()].filter(x => !x.retirada && !conoce(a, x.id)).map(x => [x.id, `${nombreRama(x.rama)} · grado ${x.g} · ${x.n}`]);
    const cerradas = D.ramas.filter(r => !ramaAbierta(a, r.id)).map(r => [r.id, r.nombre]);
    const sec = (titulo, html, abierto = false) => `<details class="ecos-verbe-dmsec" ${abierto ? "open" : ""}><summary>${titulo}</summary>${ayudaSeccionHTML(titulo, escH)}${html}</details>`;
    return `<p><button type="button" data-action="editorCatalogo"><i class="fa-solid fa-pen-nib"></i> Taller del DM · crear y publicar técnicas universales</button> <button type="button" data-action="panteonDM">Panteón y nota de lore (solo DM)</button> <button type="button" data-action="reliquiasDM">Compendio de reliquias</button></p>${intro("Solo tú ves esta pestaña.", "Para preparar una hoja: elige linaje y fuerza, decide si el jugador conoce ese origen y revisa el resultado con «Ver como el jugador». Ese botón oculta tus controles de administración. Las opciones de más abajo permiten conceder recursos, enseñar técnicas o deshacer compras.")}
      ${sec("Reorientar un cultivo sin volver a cobrar",`<p>Tras cambiar el balance, puedes sustituir la última mejora registrada de una técnica conservando sus Trazos y nivel de cultivo.</p><select name="reorientarTecnica">${opciones(itemsTecnica(a).filter(i=>e.cultivos?.[i.getFlag(MOD,F)?.id]?.mejoras?.length).map(i=>[i.getFlag(MOD,F).id,i.name]),"")}</select><select name="reorientarMejora">${opciones(Object.entries(MEJORAS),"")}</select><button type="button" data-action="reorientarDM">Sustituir última mejora</button>`)}
      ${D.shinobi?sec("Archivo del Verbe: tradiciones, bestias y rituales",`
        <p>Tradición: <select name="shinobiTradicion">${opciones((D.tradicionesShinobi??[]).filter(t=>!esFamilia(t.id)).map(t=>[t.id,`${e.tradiciones?.includes(t.id)?"✓ ":""}${t.nombre}`]),"")}</select><button type="button" data-action="shinobiDM" data-campo="tradicion" data-de="shinobiTradicion">Conceder / retirar</button></p>
        <p>Hito: <select name="shinobiHito">${opciones((D.hitosShinobi??[]).map(h=>[h.id,`${e.hitosShinobi?.includes(h.id)?"✓ ":""}${h.nombre}`]),"")}</select><button type="button" data-action="shinobiDM" data-campo="hito" data-de="shinobiHito">Conceder / retirar</button></p>
        <p>Bestia: <select name="shinobiBestia"><option value="">Sin vínculo</option>${opciones((D.bestiasShinobi??[]).map(b=>[b.id,b.nombre]),e.vasija?.bestia??"")}</select> Vínculo <select name="shinobiVinculo">${opciones([[1,"1 · inestable"],[2,"2 · control"],[3,"3 · cooperación"]],e.vasija?.vinculo??1)}</select><button type="button" data-action="shinobiDM" data-campo="vasija" data-de="shinobiBestia">Guardar vínculo</button></p>
        <p>Ritual preparado: <select name="shinobiRitual">${opciones(itemsTecnica(a).filter(i=>i.getFlag(MOD,F)?.ritual).map(i=>[i.getFlag(MOD,F).id,i.name]),"")}</select><button type="button" data-action="shinobiDM" data-campo="ritual" data-de="shinobiRitual">Autorizar un uso</button></p><p class="ecos-nota">Confirma antes preparación, participantes, precio, salvación y resultado. El permiso se consume al usarlo; un descanso no lo repone.</p>
        <p>Desgaste ocular: <select name="shinobiOjo">${opciones(D.miradas.map(m=>[m.id,`${m.nombre}: ${Number(e.desgasteOcular?.[m.id])||0}/6 · ${Number(e.ojosSacrificados?.[m.id])||0} sacrificados`]),"")}</select><button type="button" data-action="shinobiDM" data-campo="ocular" data-de="shinobiOjo">Restaurar tras resolver la historia</button></p>
        <p>Reliquia: <select name="shinobiArtefacto">${opciones((D.artefactosShinobi??[]).map(x=>[x.id,x.nombre]),"")}</select><button type="button" data-action="artefactoDM">Dar objeto equipado</button></p>
        <p>Transferir energía positiva a: <select name="shinobiDestino">${opciones(game.actors.filter(x=>x.id!==a.id&&despierto(x)).map(x=>[x.id,x.name]),"")}</select><input name="shinobiCantidad" type="number" min="1" value="1" style="width:5em"><button type="button" data-action="transferirDM">Transferir Verbe</button></p><p class="ecos-nota">Descuenta al origen; el receptor paga deuda a 2:1 y respeta su máximo. Úsalo solo después de resolver contacto, absorción y salvación.</p>`,false):""}
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
        <p>Característica: <select name="aj-car" data-desc="car">${opciones(Object.entries(CARS), e.car)}</select> <button type="button" data-action="ajustar" data-campo="car" data-de="aj-car">Cambiar</button>
          · Naturaleza principal: <select name="aj-nat">${opciones(Object.entries(NATS), e.nats?.[0] ?? "")}</select> <button type="button" data-action="ajustar" data-campo="nat" data-de="aj-nat">Cambiar</button></p><div class="ecos-verbe-desc" data-de="aj-car">${describir("car", e.car, a)}</div>
        <p>Rama principal: <select name="aj-principal" data-desc="principal">${opciones(ramasLibres(), e.principal ?? "")}</select> <button type="button" data-action="ajustar" data-campo="principal" data-de="aj-principal">Cambiar</button> <small>(no cambia los rangos: ajústalos abajo)</small></p><div class="ecos-verbe-desc" data-de="aj-principal">${describir("principal", e.principal ?? "", a)}</div>
        <p>Rango: <select name="aj-rama">${opciones(D.ramas.map(r => [r.id, `${r.nombre} (${nombreRango(rangoDe(a, r.id))})`]), "")}</select> a <select name="aj-rango">${opciones(D.rangos.map((r, i) => [i, r.nombre]), 1)}</select> <button type="button" data-action="ajustar" data-campo="rango" data-de="aj-rango" data-clave="aj-rama">Fijar</button></p>
        <p>Afinidad: <select name="aj-afnat">${opciones([...natsDe(a)].map(n => [n, NATS[n] ?? n]), "")}</select> a <select name="aj-af">${opciones([[1, "Despierta"], [2, "Entrenada"], [3, "Maestra"]], 1)}</select> <button type="button" data-action="ajustar" data-campo="afinidad" data-de="aj-af" data-clave="aj-afnat">Fijar</button>
          · Control: <select name="aj-control">${opciones([[0, "Sin competencia"], [1, "Competente"], [2, "Pericia"]], sistema.control(a))}</select> <button type="button" data-action="ajustar" data-campo="control" data-de="aj-control">Fijar</button>
          · Cerrojos que sabe: <input type="number" name="aj-cerrojos" min="0" max="${D.cerrojos.length}" value="${Number(e.cerrojos) || 0}" style="width:4em"> <button type="button" data-action="ajustar" data-campo="cerrojos" data-de="aj-cerrojos">Fijar</button></p>
        <p>Dote: <select name="aj-dote" data-desc="dote">${opciones(D.dotes.map(d => [d.id, `${tieneDote(a, d.id) ? "✓ " : ""}${d.nombre}`]), "")}</select> <button type="button" data-action="ajustar" data-campo="dote" data-de="aj-dote">Dar o quitar (gratis)</button></p>
        <div class="ecos-verbe-desc" data-de="aj-dote"></div>
        <p>Enseñar una técnica gratis: <select name="darTecnica" data-desc="tec">${opciones(todas, "")}</select> <button type="button" data-action="darTecnica">Enseñar</button></p>
        <div class="ecos-verbe-desc" data-de="darTecnica"></div>
        <p>Técnicas que sabe:</p><ul>${sabe || "<li>Ninguna.</li>"}</ul>`)}
      ${sec("Reserva de Verbe: dados o promedio", `<p>Modo: <b>${modoReserva(e) === "dados" ? "dados por nivel" : "promedio (tabla fija)"}</b> · máximo ahora <b>${maxVerbe(a)}</b>.</p>
        <p>Con dados, cada nivel suma ${DADOS_VERBE.map(t => `${t.formula} (niveles ${t.desde}–${t.hasta})`).join(", ")}; el promedio queda cerca de la tabla (167 al nivel 20) pero dos personajes iguales salen distintos. Sin mínimo: si a alguien no le alcanza, compénsalo con dotes o con Trazos por rol. Al pasar a dados, los niveles que ya tenía quedan con la tabla.</p>
        <p><select name="modoReserva" data-desc="reservaModo">${opciones([["dados", "Tirar dados"], ["promedio", "Usar el promedio"]], modoReserva(e))}</select> <button type="button" data-action="modoReserva">Guardar modo</button></p><div class="ecos-verbe-desc" data-de="modoReserva">${describir("reservaModo", modoReserva(e), a)}</div>
        ${modoReserva(e) === "dados" ? `<p class="ecos-nota">Tiradas: ${Object.entries(e.dadosVerbe?.tiradas ?? {}).map(([k, v]) => `nivel ${k}: ${v}`).join(" · ") || "ninguna todavía"}${e.dadosVerbe?.fijoHasta ? ` · hasta el nivel ${e.dadosVerbe.fijoHasta}, la tabla` : ""}.</p>` : ""}`)}
      ${sec("Etapa del Verbe (quién le enseña)", `<p>Está en la etapa <b>${datosEtapa(etapaDe(e)).nombre}</b> (${etapaDe(e)} de ${ETAPA_MAX}). ${escH(datosEtapa(etapaDe(e)).texto)}</p>
        <p>Cuando encuentre por rol a un maestro o a un aprendiz que le enseñe, ábrele la siguiente: más ramas y más grado. El jugador lo ve en su panel y en el chat.</p>
        <p><label>Quién le enseña <input name="maestro" maxlength="120" placeholder="Nombre del maestro o del aprendiz"></label> <button type="button" data-action="etapaMas" ${etapaDe(e) >= ETAPA_MAX ? "disabled" : ""}><i class="fa-solid fa-unlock"></i> Abrir la siguiente etapa</button> <button type="button" data-action="etapaMenos" ${etapaDe(e) <= 1 ? "disabled" : ""}>Volver una etapa</button></p>
        <table class="ecos-tabla">${ETAPAS.filter(x => x.n > 0).map(x => `<tr${x.n === etapaDe(e) ? ' class="activa"' : ""}><th>${x.n} · ${x.nombre}${x.n === etapaDe(e) ? "<br><small>(la suya)</small>" : ""}</th><td><details${x.n === etapaDe(e) ? " open" : ""}><summary>${escH(x.texto)}</summary>${etapaJugadorHTML(x.n, escH)}</details></td></tr>`).join("")}</table>
        ${(e.maestros ?? []).length ? `<p class="ecos-nota">Registro: ${(e.maestros ?? []).map(m => `${datosEtapa(m.etapa).nombre}${m.quien ? ` (${escH(m.quien)})` : ""}`).join(" · ")}</p>` : ""}`)}
      ${sec("Naturaleza secreta", `<p>Modo: <select name="natModo" data-desc="natModo">${opciones(Object.entries(MODOS_NATURALEZA), modoNaturaleza(e))}</select> <button type="button" data-action="natModo">Guardar modo</button></p><div class="ecos-verbe-desc" data-de="natModo">${describir("natModo", modoNaturaleza(e), a)}</div>
        <p>Primera naturaleza ${natsDe(a).size ? `ya descubierta: <b>${[...natsDe(a)].map(n => NATS[n] ?? n).join(", ")}</b>` : `oculta: <select name="ocultaPrimera">${opciones(Object.entries(NATS), ocultaPrimeraDe(a) ?? "")}</select> <button type="button" data-action="ocultaPrimera">Fijar en secreto</button>`}</p>
        <p>Se descubre entrenando: ${DESCUBRIR.primera.dias} días y Control CD ${DESCUBRIR.primera.cd} (${DESCUBRIR.primera.trazos} Trazos) desde nivel 5 o nivel 3 con Entrenado en Forma, y en etapa Practicante o más. La segunda: ${DESCUBRIR.segunda.dias} días, CD ${DESCUBRIR.segunda.cd}, ${DESCUBRIR.segunda.trazos} Trazos, desde nivel 5.</p>
        <p>Segunda naturaleza: <select name="segundaModo" data-desc="segundaModo">${opciones(Object.entries(MODOS_SEGUNDA), modoSegunda(e))}</select> <button type="button" data-action="segundaModo">Guardar</button> <small>Al azar: la tira el jugador al terminar su entrenamiento. Fija: sale la oculta que pusiste.</small></p><div class="ecos-verbe-desc" data-de="segundaModo">${describir("segundaModo", modoSegunda(e), a)}</div>
        <p><button type="button" data-action="pedirTiradaNat"><i class="fa-solid fa-dice"></i> Que tire ya su ${natsDe(a).size ? "segunda " : ""}naturaleza (sin entrenamiento)</button>${e.tirarNat ? ` <i>Tiene pendiente tirar su ${e.tirarNat === "primera" ? "naturaleza" : "segunda naturaleza"}.</i>` : ""}</p>
        <p><button type="button" data-action="revelarNat">Revelar ya, sin entrenamiento</button>${estado(a)?.entrenoNat ? ` <button type="button" data-action="terminarEntreno">Dar por terminados los días</button>` : ""}</p>`)}
      ${sec("Naturalezas y linaje", `<p>Oculta: <select name="oculta">${opciones(Object.entries(NATS), ocultaDe(a))}</select> <button type="button" data-action="oculta">Cambiar</button> ${e.descubierta ? "(ya la descubrió)" : ""} · probadas sin suerte: ${(e.probadas ?? []).map(n => NATS[n]).join(", ") || "ninguna"}</p>
        <p>Dar una naturaleza: <select name="natsExtra">${opciones(Object.entries(NATS).filter(([k]) => !natsDe(a).has(k)), "")}</select> <button type="button" data-action="lista" data-campo="natsExtra" data-texto="naturaleza">Dar</button>
          · combinación: <select name="combos">${opciones(Object.entries(D.combos).filter(([k]) => !combosDe(a).has(k)).map(([k, v]) => [k, `${v.nombre} (${v.de.map(n => NATS[n]).join(" + ")})`]), "")}</select> <button type="button" data-action="lista" data-campo="combos" data-texto="combinación">Dar</button></p>
        <p>Linaje: <select name="linaje" data-desc="linaje" data-azar="sin-ninguno" data-azar-nombre="Linaje">${opcionesLinaje(e.linaje)}</select> <select name="fuerza" data-desc="fuerza" data-azar="sin-ninguno" data-azar-nombre="Fuerza de la sangre">${opciones(Object.entries(FUERZA).map(([k, v]) => [k, v.nombre]), e.fuerza)}</select>
          <label><input type="checkbox" name="linajeVisible" ${e.linajeVisible ? "checked" : ""}> el jugador lo sabe</label> <button type="button" data-action="linaje">Guardar</button> <button type="button" data-action="diarioLinaje" title="Ver la sangre elegida y abrir su diario"><i class="fa-solid fa-book-open"></i> Su diario</button></p>
        <div class="ecos-verbe-desc" data-de="linaje">${describir("linaje", e.linaje, a)}</div><div class="ecos-verbe-desc" data-de="fuerza">${describir("fuerza", e.fuerza, a)}</div>
        <p class="ecos-nota">El linaje lo eliges siempre tú (o lo tiras con 🎲): el jugador nunca lo elige. Si no lo sabe, en su panel dice «Desconocido», igual que para quien no tiene ninguno. Antes de guardar, «Su diario» abre la página que cuenta su dios y lo que hereda su línea nivel a nivel.</p>
        <p><b>Familia:</b> ${escH(FAMILIAS[familiaDeSangre(D.linajes, e.linaje, e.fuerza)]?.nombre ?? (e.tradiciones ?? []).filter(esFamilia).map(f => FAMILIAS[f]?.nombre).join(", ") ?? "")}${familiaDeSangre(D.linajes, e.linaje, e.fuerza) || (e.tradiciones ?? []).some(esFamilia) ? "" : "ninguna"} <button type="button" data-action="diarioFamilia" data-familia="${escH(familiaDeSangre(D.linajes, e.linaje, e.fuerza) ?? "")}" title="Leer esa familia y sus artes nivel a nivel"><i class="fa-solid fa-book-open"></i> Su diario</button></p>
        <p class="ecos-nota">3.65 (pedido del autor): familia y linaje son lo mismo. La familia sale del linaje: cámbialo arriba. Las familias dadas antes por historia se conservan.</p>
        <p><b>Control del Verbe</b> se tira con <b>${escH(CARS[a.system?.skills?.cvb?.ability] ?? "Inteligencia")}</b> (3.65: Inteligencia; Sabiduría con «Control por instinto», Carisma con «Control por presencia»). A mano: ${[["int", "INT"], ["wis", "SAB"], ["cha", "CAR"]].map(([k, n]) => `<button type="button" data-action="ctlCar" data-car="${k}">${n}</button>`).join(" ")}</p>`)}
      ${sec("Ramas, ojos, pactos y escuela", `${cerradas.length ? `<p>Abrir una rama: <select name="abiertas">${opciones(cerradas, "")}</select> <button type="button" data-action="lista" data-campo="abiertas" data-texto="rama">Abrir</button></p>` : ""}
        <p>Despertar un ojo: <select name="mirada">${opciones(D.miradas.map(m => [m.id, `${m.nombre}${m.real && m.real !== m.nombre ? ` (${m.real})` : ""}`]), "")}</select> <select name="etapa">${opciones([[1, "Etapa 1 · 3 Trazos"], [2, "Etapa 2 · 5"], [3, "Etapa 3 · 8"]], 1)}</select>
          <label><input type="checkbox" name="trasplante"> trasplantado</label> <button type="button" data-action="mirada">Despertar o subir</button></p>
        <p>Pacto: <select name="pactos">${opciones(D.pactos.map(p => [p.linaje, p.linaje]), "")}</select> <button type="button" data-action="lista" data-campo="pactos" data-texto="pacto">Dar</button>
          · escuela: <select name="escuela"><option value="">Ninguna</option>${opciones(D.escuelas.map(s => [s.nombre, `${s.nombre} (${s.rama})`]), e.escuela ?? "")}</select> <button type="button" data-action="escuela">Guardar</button></p>`)}
      ${sec("Aprender al instante (creación de personaje)", `<p>Ahora aprende <b>${e.aprenderAlInstante ? "al instante, al pagar" : aprenderPorDias(a) ? "por días de práctica" : "al instante (el ajuste del mundo está apagado)"}</b>. Para armar una ficha de más nivel, ponlo al instante, compra lo que necesite y vuelve a ponerlo por días.</p>
        <p><button type="button" data-action="alInstante">${e.aprenderAlInstante ? "Volver a aprender por días" : "Aprender al instante"}</button>${Object.keys(e.estudios ?? {}).length ? ` · Estudiando: ${Object.values(e.estudios).map(x => `${escH(tecnicaPorId(x.id, a)?.n ?? x.id)} (${x.progreso}/${x.exitos}) <button type="button" data-action="aprenderYa" data-id="${escH(x.id)}">Aprender ya</button>`).join(" · ")}` : ""}</p>`, !!Object.keys(e.estudios ?? {}).length)}
      ${a.type === "npc" ? sec("Defensa de la campaña (Coraza, Fortaleza o Cuerpo sordo)", defensaDMHTML(a)) : ""}
      ${sec("Herramientas", `<p><button type="button" data-action="choque"><i class="fa-solid fa-burst"></i> Choque de técnicas</button> <button type="button" data-action="olvidar"><i class="fa-solid fa-eraser"></i> Quitar el Verbe a este actor</button></p>`)}`;
  }
}

/* ------------------------------------------------------------------ */
/*  Defensas: el aviso antes de resolver un ataque (midi-qol)         */
/* ------------------------------------------------------------------ */

const ESPERAS = new Map();
const INCAPAZ = ["incapacitated", "paralyzed", "stunned", "unconscious", "petrified", "dead", "acechado"];
const noPuedeActuar = actor => INCAPAZ.some(st => actor?.statuses?.has(st));
/** ¿Está en un combate empezado? Fuera de combate las reacciones no se agotan: la marca de midi-qol no caduca sin turnos. */
const enCombate = actor => !!game.combat?.started && !!game.combat.combatants?.some?.(c => c.actor === actor || (c.actor?.uuid && c.actor.uuid === actor?.uuid) || (c.actorId && c.actorId === actor?.id));
/** 3.27: la reacción Verbe va aparte de la de D&D (un velo de separación): una por ronda, se renueva al empezar tu turno. */
function reaccionDisponible(actor) {
  if (noPuedeActuar(actor) || actor?.statuses?.has("cargado") || actor?.statuses?.has("canalizando") || actor?.statuses?.has("surprised")) return false; // 3.57: Sorprendido no reacciona
  if (!enCombate(actor)) return true;
  return !estado(actor)?.reaccionUsada;
}
/** Acciones Verbe que tiene por turno: una; desde el nivel 11, dos. */
const maxAccionesVerbe = actor => accionesVerbePorTurno(nivelDe(actor), sumaEf(actor, ef => ef.accionesVerbe));
/** El estado del turno para mostrarlo arriba: acciones Verbe gastadas y si le queda la reacción Verbe. */
export function turnoVerbe(actor) {
  const e = estado(actor) ?? {}, comb = game.combat?.started ? (game.combat.id ?? "combate") : null;
  const t = comb && e.turnoTecnicas?.combate === comb ? e.turnoTecnicas : {};
  const max = maxAccionesVerbe(actor), usadas = Math.min(max, Number(t.acciones) || 0);
  return { enCombate: !!comb && enCombate(actor), max, usadas, accionLibre: usadas < max, adicionalLibre: !(Number(t.adicionales) >= 1), reaccionLibre: reaccionDisponible(actor) };
}
/** 3.34: gasta la acción Verbe de este turno (recargar con una Moneda Antigua en combate). */
export async function gastarAccionVerbe(actor) {
  const e = estado(actor) ?? {}, comb = game.combat?.started ? (game.combat.id ?? "combate") : null;
  const turno = permisoTurno(0, { combate: comb, estado: e.turnoTecnicas, maximo: maxAccionesVerbe(actor) });
  if (!turno.ok) { ui.notifications.warn(turno.motivo); return false; }
  if (turno.cambios) await guardar(actor, { turnoTecnicas: turno.cambios });
  return true;
}
/** La línea de arriba: «Acción Verbe ◆ libre · Reacción Verbe ◆ gastada». */
export function turnoVerbeHTML(actor) {
  const t = turnoVerbe(actor);
  if (!t.enCombate) return `<div class="ecos-turno-verbe fuera"><span><i class="fa-solid fa-bolt"></i> Acción Verbe</span><span><i class="fa-solid fa-forward"></i> Acción adicional Verbe</span><span><i class="fa-solid fa-shield-halved"></i> Reacción Verbe</span><small>Fuera de combate no se gastan. En combate tienes ${t.max === 1 ? "una acción Verbe" : `${t.max} acciones Verbe`} y una acción adicional Verbe por turno, y una reacción Verbe por ronda, aparte de las de D&D.</small></div>`;
  return `<div class="ecos-turno-verbe"><span class="${t.accionLibre ? "libre" : "gastada"}" data-tooltip="No gasta tu Acción de D&D"><i class="fa-solid fa-bolt"></i> Acción Verbe: <b>${t.accionLibre ? (t.max > 1 ? `${t.max - t.usadas} libre${t.max - t.usadas === 1 ? "" : "s"}` : "libre") : "gastada"}</b></span><span class="${t.adicionalLibre ? "libre" : "gastada"}" data-tooltip="Técnicas de Acción adicional. No gasta tu Acción adicional de D&D"><i class="fa-solid fa-forward"></i> Acción adicional Verbe: <b>${t.adicionalLibre ? "libre" : "gastada"}</b></span><span class="${t.reaccionLibre ? "libre" : "gastada"}" data-tooltip="Sustitución, defensas y Choque. No gasta tu Reacción de D&D"><i class="fa-solid fa-shield-halved"></i> Reacción Verbe: <b>${t.reaccionLibre ? "libre" : "gastada"}</b></span><small>Se renuevan al empezar tu turno.</small></div>`;
}

/** Grado de un ataque: el de su técnica o conjuro; si es un arma o una criatura, la mitad de su nivel o VD. */
export function gradoAtaque(wf) {
  const meta = wf?.item?.getFlag?.(MOD, F);
  if (meta?.id) return (Number(meta.g) || 0) + (Number(wf.item?.flags?.dnd5e?.scaling) || 0);
  if (wf?.item?.type === "spell") return Number(wf.castData?.castLevel ?? wf.itemLevel ?? wf.item.system?.level) || 0;
  const a = wf?.actor;
  const n = a?.type === "character" ? sistema.nivel(a) : (despierto(a) ? nivelDe(a) : sistema.vd(a));
  return Math.ceil(n / 2);
}

const ojoAbierto = (actor, ojo) => actor?.effects?.some(x => x.getFlag?.(MOD, F)?.ojo === ojo && !x.disabled);

/** Las defensas que puede usar ahora contra un ataque de ese grado (con su costo exacto). */
export function defensasDisponibles(actor, { grado = 0, area = false, bloqueadas = null } = {}) {
  if (!despierto(actor) || !D?.defensas) return [];
  if (!reaccionDisponible(actor)) {
    if (bloqueadas) for (const id of Object.keys(D.defensas)) if (conoce(actor, id)) bloqueadas.push({ id, nombre: itemsDe(actor, id)[0]?.name ?? tecnicaPorId(id, actor)?.n ?? id, motivo: noPuedeActuar(actor) ? "Su estado no le permite reaccionar." : "Ya usó su reacción en esta ronda." });
    return [];
  }
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
      extra = Math.max(0, (Number(def.extraPorGrado) || 2) * Math.max(0, grado - gradoMax(actor)) - ((e.cultivos?.[id]?.mejoras ?? []).includes("sust-control") ? 1 : 0));
      costo += extra + (area ? 2 : 0);
    }
    const permiso = evaluarGasto({ valor: Number(e.valor) || 0, costo, limite: limiteNegativo(actor), grado: tec.g,
      agotamiento: sistema.agotamiento(actor), reaccion: true, puedeReaccionar: reaccionDisponible(actor) });
    if (!permiso.ok) { bloqueadas?.push({ id, nombre: itemsDe(actor, id)[0]?.name ?? tec.n, costo, extra, motivo: permiso.motivo }); continue; }
    const aviso = def.aviso ?? (id === "forma-sustitucion" ? `si hay un objeto de tu tamaño o menor a ${Math.max(tieneDote(actor, "sustitucion-lejana") ? 9 : 3, 3 + 1.5 * (e.cultivos?.[id]?.mejoras ?? []).filter(m=>m === "sust-distancia").length)} m` : "");
    lista.push({ id, nombre: itemsDe(actor, id)[0]?.name ?? tec.n, costo, extra, refleja, area, texto: area ? "sales del área a un objeto fuera de ella y no recibes nada" : def.texto, aviso, g: tec.g });
  }
  // 3.1c: cualquier otra reacción defensiva que sepa (por su disparador en el catálogo), no solo las de la lista fija.
  if (!area) for (const item of itemsTecnica(actor)) {
    const meta = item.getFlag(MOD, F), id = meta?.id;
    if (!id || D.defensas[id] || lista.some(o => o.id === id)) continue;
    const tec = tecnicaPorId(id, actor);
    if (!reaccionDefensiva(tec)) continue;
    const costo = costoUso(actor, meta, tec.g);
    const permiso = evaluarGasto({ valor: Number(e.valor) || 0, costo, limite: limiteNegativo(actor), grado: tec.g,
      agotamiento: sistema.agotamiento(actor), reaccion: true, puedeReaccionar: reaccionDisponible(actor) });
    if (!permiso.ok) { bloqueadas?.push({ id, nombre: item.name, costo, extra: 0, motivo: permiso.motivo }); continue; }
    const texto = String(tec.texto ?? "").split(/(?<=\.)\s/)[0].slice(0, 220);
    lista.push({ id, nombre: item.name, costo, extra: 0, refleja: false, area: false, texto, aviso: tec.item.system.activation?.condition ?? "", g: tec.g, generica: true });
  }
  return lista;
}

/** Pregunta al dueño (o al DM) qué defensa usa; espera hasta 30 s. Devuelve el id o null. */
async function preguntarDefensa(actor, info) {
  if(info.choque) info={...info,hasta:Date.now()+28000};
  const jugador = MODO === "prueba" ? null : game.users.find(u => u.active && !u.isGM && actor.testUserPermission(u, "OWNER"));
  const quien = jugador ?? game.users.activeGM;
  if (!quien) return null;
  if (quien.isSelf) return info.choque ? elegirContraTecnica(actor,info) : elegirDefensa(actor, info);
  const id = foundry.utils.randomID();
  return new Promise(res => {
    const t = setTimeout(() => { ESPERAS.delete(id); res(null); }, 32000);
    ESPERAS.set(id, {res:v=>{clearTimeout(t);res(v);},quien:quien.id});
    game.socket.emit(`module.${MOD}`, { capaV: true, accion: "capaVDefensa", id, para: quien.id, de: game.user.id, actorId: actor.id, info });
  });
}

/** Mensajes de defensa por socket: los atiende quien corresponde, sea DM o jugador. true si era uno de estos. */
function socketDefensa(d) {
  if (d?.accion === "capaVDefensa") {
    if (d.para !== game.user.id) return true;
    const actor = game.actors.get(d.actorId);
    (actor && editarActor(actor) ? (d.info?.choque ? elegirContraTecnica(actor,d.info) : elegirDefensa(actor, d.info)) : Promise.resolve(null)).catch(() => null)
      .then(v => game.socket.emit(`module.${MOD}`, { capaV: true, accion: "capaVDefensaR", id: d.id, para: d.de, de:game.user.id, v }));
    return true;
  }
  if (d?.accion === "capaVDefensaR") {
    if (d.para === game.user.id) { const espera=ESPERAS.get(d.id);if(espera&&d.de===espera.quien){espera.res(d.v??null);ESPERAS.delete(d.id);} }
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
  const cab = info.previo ? `<p><b>${escH(info.quien)}</b> dirige <b>${escH(info.con)}</b> contra ti. Elige tu defensa antes del choque y de la tirada nativa.</p>` : info.area
    ? `<p><b>${escH(info.quien)}</b> usa <b>${escH(info.con)}</b>: un área que pide salvación de Destreza.</p>`
    : `<p><b>${escH(info.quien)}</b> te ataca con <b>${escH(info.con)}</b>: <b>${info.total}</b> contra tu CA ${info.ca}${info.critico ? " (crítico)" : ""}. Va a impactar.</p>`;
  const html = `<div class="ecos-verbe-form">${cab}
    ${opciones.some(o => (Number(e.valor) || 0) - o.costo < 0) ? `<p class="ecos-aviso">⚠ Algunas defensas te dejan en Verbe negativo: puedes usarlas, pero te fuerzas (salvación de CON o 1 nivel de Agotamiento). Con Agotamiento 4 no puedes.</p>` : ""}
    <p class="ecos-nota">Tienes ${Number(e.valor) || 0} de Verbe y tu <b>reacción Verbe</b> libre (defenderte la gasta; tu Reacción de D&D no se toca). Grado del ataque: ${info.grado}; el tuyo: ${gradoMax(actor)}.</p>
    <ul class="ecos-verbe-lista">${opciones.map(o => `<li><b>${escH(o.nombre)}</b> · ${o.costo} Verbe${o.extra ? ` (incluye ${o.extra} por ser un ataque más grande que tú)` : ""}${o.refleja ? " · gratis por Sustitución refleja" : ""}: ${escH(o.texto)}${o.aviso ? ` <i>(${escH(o.aviso)})</i>` : ""}.</li>`).join("")}</ul></div>`;
  let dlg = null;
  const r = await DialogV2.wait({
    window: { title: `¿Te defiendes? · ${actor.name}`, icon: "fa-solid fa-shield-halved" },
    content: html,
    // 3.34: también se puede reaccionar forzándose; el botón lo avisa.
    buttons: [...opciones.map((o, i) => ({ action: o.id, label: `${o.nombre} · ${o.costo} Verbe${(Number(e.valor) || 0) - o.costo < 0 ? " ⚠ te fuerzas (CON o Agotamiento)" : ""}`, default: i === 0 })), { action: "no", label: "No hacer nada" }],
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
  if (op.generica) {
    // Reacción del catálogo sin automatización propia: se paga, gasta la reacción y la tarjeta dice qué hace; el DM la resuelve.
    const e0 = estado(actor), valor0 = (Number(e0.valor) || 0) - op.costo;
    // Si la técnica trae un efecto sobre quien la usa (un bono de CA, por ejemplo), se pone ahora y se va con ese ataque.
    const tec = tecnicaPorId(id, actor);
    const propios = (tec?.item?.effects ?? []).filter(x => x.flags?.[MOD]?.[F]?.aplicarUsuario).map(x => {
      const f = foundry.utils.deepClone(x); delete f._id; f.origin = itemsDe(actor, id)[0]?.uuid ?? null; f.transfer = false;
      f.duration = { rounds: 1, seconds: 6, startTime: game.time?.worldTime ?? 0 }; (f.flags.dae ??= {}).specialDuration = ["isAttacked"];
      return f;
    });
    if (propios.length) await actor.createEmbeddedDocuments("ActiveEffect", propios);
    await guardar(actor, { valor: valor0, ...(enCombate(actor) ? { reaccionUsada: true } : {}) });
    aLaMesa(actor, `✦ ${escH(op.nombre)}`, `<p>${escH(actor.name)} reacciona con <b>${escH(op.nombre)}</b> (${op.costo} Verbe): ${escH(op.texto)}</p><p class="ecos-nota">${propios.length ? "El bono se aplica a este ataque." : "Esta reacción no se automatiza: el DM resuelve su efecto sobre el ataque."}</p>${enCombate(actor) ? `<p class="ecos-gasto-verbe">✦ Se gastó la <b>reacción Verbe</b>. Su Reacción de D&D sigue libre.</p>` : ""}`);
    if (valor0 < 0) await sobreesfuerzo(actor, op.g, valor0);
    return true;
  }
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
  if (info.nativo && !info.area && def.hasta !== "turno") changes.length = 0; // 3.27: la tirada ya está hecha; lo dice el chat
  if (changes.length) {
    efectos.push({ name: op.nombre, img: "systems/dnd5e/icons/svg/abilities/dexterity.svg", changes,
      duration: { rounds: 1, seconds: 6 }, transfer: false,
      flags: { dae: { specialDuration: especial }, [MOD]: { [F]: { defensa: id, especial } } } });
  }
  if (def.estado && ESTADOS[def.estado]) efectos.push(efectoEstado(def.estado, foundry.utils.randomID()));
  const creados = efectos.length ? await actor.createEmbeddedDocuments("ActiveEffect", efectos) : [];
  try {
    await guardar(actor, { valor, ...(enCombate(actor) ? { reaccionUsada: true } : {}), ...(op.refleja ? { reflejaUsada: true } : {}) });
  } catch (error) {
    for (const ef of creados) await ef.delete();
    throw error;
  }
  const que = info.area ? "sale del área a un objeto fuera de ella" : ({ falla: "se cambia por un objeto: el ataque golpea eso", ca: "levanta la guardia", desventaja: "se corre justo a tiempo" }[def.tipo] ?? "se defiende");
  const nativo = info.nativo ? ({ falla: " <b>El ataque no le hace nada: no apliques su daño.</b>", ca: ` Su CA sube +${def.ca} contra este ataque${Number.isFinite(Number(info.total)) ? `: ${Number(info.total) >= Number(info.ca) + Number(def.ca) ? `${info.total} sigue impactando` : `${info.total} ya no alcanza (CA ${Number(info.ca) + Number(def.ca)}), no apliques el daño`}` : ""}.`, desventaja: " El atacante repite el d20 y se queda con el menor." }[def.tipo] ?? "") : "";
  aLaMesa(actor, `✦ ${escH(op.nombre)}`, `<p>${escH(actor.name)} ${que} (${op.costo} Verbe${op.refleja ? ", gratis por Sustitución refleja" : ""}).${nativo}</p>${enCombate(actor) ? `<p class="ecos-gasto-verbe">✦ Se gastó la <b>reacción Verbe</b>. Su Reacción de D&D sigue libre.</p>` : ""}`);
  if (valor < 0) await sobreesfuerzo(actor, op.g, valor);
  // 3.34: la Sustitución te deja en la casilla que eliges (adyacente; más lejos con mejoras o Sustitución lejana).
  if (id === "forma-sustitucion") {
    const pies = (await import("./verbe-334.js")).alcanceSustitucion({ mejoras: (estado(actor)?.cultivos?.[id]?.mejoras ?? []).length, lejana: tieneDote(actor, "sustitucion-lejana") });
    import("./verbe-334.js").then(m => m.moverLibre(actor, pies, "Sustitución")).catch(err => console.warn(`${MOD} | sustitución`, err));
  }
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
    // La reacción (dentro o fuera de combate) la revisa defensasDisponibles.
    const ca = sistema.ca(actor) || 10;
    const critico = !!roll.isCritical;
    if (roll.total < ca && !critico) continue; // va a fallar igual
    const bloqueadas = [];
    if (!defensasDisponibles(actor, { grado, bloqueadas }).length) { avisarDefensaBloqueada(actor, wf, grado, bloqueadas); continue; }
    const v = await preguntarDefensa(actor, { quien: wf.token?.name ?? wf.actor?.name ?? "Alguien", con: wf.item?.name ?? "un ataque", total: roll.total, ca, critico, grado });
    if (v && D.defensas[v]?.tipo === "desventaja") await aplicarDesventaja(wf, roll);
    if (v && (D.defensas[v]?.tipo === "falla" || (!roll.isCritical && roll.total < sistema.ca(actor)))) excluirBlanco(wf,tok);
  }
}

/** Conoce una defensa pero no puede usarla ahora: se le dice por qué y cuánto costaría (a su dueño y al DM). */
function avisarDefensaBloqueada(actor, wf, grado, bloqueadas) {
  if (!bloqueadas?.length) return null;
  const mio = gradoMax(actor);
  const filas = bloqueadas.map(b => `<li><b>${escH(b.nombre)}</b>${Number.isFinite(b.costo) ? ` · costaría ${b.costo} Verbe${b.extra ? ` (incluye ${b.extra} porque el ataque es de grado ${grado} y el tuyo ${mio}: 2 por grado de diferencia)` : ""}` : ""}: ${escH(b.motivo)}</li>`).join("");
  return aLaMesa(actor, "✦ Defensa no disponible", `<p>${escH(wf?.token?.name ?? wf?.actor?.name ?? "Alguien")} golpea a ${escH(actor.name)} con ${escH(wf?.item?.name ?? "un ataque")}. Tiene Verbe ${Number(estado(actor)?.valor) || 0}.</p><ul>${filas}</ul>`, { soloDueno: true });
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
    // La reacción (dentro o fuera de combate) la revisa defensasDisponibles.
    if (!defensasDisponibles(actor, { grado, area: true }).length) continue;
    const v=await preguntarDefensa(actor, { quien: wf.token?.name ?? wf.actor?.name ?? "Alguien", con: wf.item?.name ?? "un área", grado, area: true });
    if(v)excluirBlanco(wf,tok);
  }
}

/** Excluye solo al defensor; un área no desaparece para los demás. */
function excluirBlanco(wf,tok) {
  (wf.ecosExcluidos??=new Set()).add(tok);
  for(const k of ['targets','hitTargets','hitTargetsEC','failedSaves','saves','applicationTargets'])wf[k]?.delete?.(tok);
}

/** 3.12: solo choca lo que cuesta Verbe. Una técnica de coste 0 es demasiado débil para un choque, en los dos lados. */
export function cuestaVerbe(actor, meta, grado) {
  try { return costoUso(actor, meta, Number(grado ?? meta?.g) || 0) > 0; } catch { return true; }
}

function opcionesChoque(actor) {
  if (!reaccionDisponible(actor)) return []; // 3.27: el choque gasta la reacción Verbe
  return itemsTecnica(actor).filter(i=>tecnicaChocable(i)).flatMap(item=>{
    const meta=item.getFlag(MOD,F),lista=[];
    for(let grado=meta.g;grado<=gradoUsable(actor,meta);grado++){
      const r=previsualizarUso(actor,meta,grado,{choque:true});
      if(r.ok&&Number(r.costo)>0)lista.push({item,id:meta.id,grado,costo:r.costo});
    }
    return lista;
  });
}

async function pagarContraTecnica(actor,id,grado) {
  const op=opcionesChoque(actor).find(o=>o.id===id&&o.grado===grado);
  if(!op || !editarActor(actor))return null;
  const config={scaling:grado-op.item.getFlag(MOD,F).g},updates={};consumosChoque.add(config);
  try {
    if(alConsumir({item:op.item,actor},config,{},updates)===false)return null;
    await actor.update(updates.actor);
    // Los efectos de objetivo no se aplican: la energía se emplea en interceptar.
    if(config.ecosVerbe.despues<0)await sobreesfuerzo(actor,grado,config.ecosVerbe.despues);
    if(op.item.system?.uses?.max && grado>=6)await op.item.update({'system.uses.spent':(Number(op.item.system.uses.spent)||0)+1});
    if(enCombate(actor))await guardar(actor,{reaccionUsada:true});
    await aLaMesa(actor,'Contratécnica',`<p>${escH(actor.name)} enfrenta ${escH(op.item.name)} a grado ${grado} y paga ${config.ecosVerbe.costo} Verbe. No concede un ataque adicional.</p>${enCombate(actor)?'<p class="ecos-gasto-verbe">✦ Se gastó la <b>reacción Verbe</b> (choque). Su Reacción de D&D sigue libre.</p>':''}`);
    return {id,grado,nonce:config.ecosVerbe.nonce,nombre:op.item.name,nat:op.item.getFlag(MOD,F).infusion||op.item.getFlag(MOD,F).nat,costo:config.ecosVerbe.costo};
  } finally {consumosChoque.delete(config);if(consumoPendiente(actor)?.nonce===config.ecosVerbe?.nonce)consumosPendientes.delete(claveActor(actor));}
}

async function elegirContraTecnica(actor,info) {
  if(info.hasta&&Date.now()>info.hasta)return null;
  const opciones=opcionesChoque(actor);
  const seleccion=await foundry.applications.api.DialogV2.wait({window:{title:`Choque de técnicas · ${actor.name}`,resizable:true},position:{width:640},
    content:`<div class="ecos-verbe-form"><p><b>${escH(info.quien)}</b> dirige ${escH(info.con)} (grado ${info.grado}) contra ti. Las defensas anteriores ya se resolvieron.</p><p>El choque gasta tu <b>reacción Verbe</b> (no la de D&D). Tu técnica paga su Verbe y usos diarios; solo intercepta este lanzamiento contra ti.</p>${opciones.length?`<label>Contratécnica y grado<select name="contra">${opciones.map(o=>`<option value="${escH(o.id)}|${o.grado}">${escH(o.item.name)} · grado ${o.grado} · ${o.costo} Verbe</option>`).join('')}</select></label>`:'<p>No tienes una técnica ofensiva válida y utilizable para enfrentarla.</p>'}</div>`,
    buttons:[...(opciones.length?[{action:'chocar',label:'Enfrentar técnicas',callback:(ev,b)=>b.form.elements.contra.value}]:[]),{action:'recibir',label:'Recibir la técnica',default:true}],render:(ev,d)=>{if(info.hasta)setTimeout(()=>{try{(d??ev?.target)?.close?.();}catch{}},Math.max(0,info.hasta-Date.now()));},rejectClose:false});
  if(!seleccion||seleccion==='recibir'||(info.hasta&&Date.now()>info.hasta))return null;
  const[id,g]=String(seleccion).split('|');return pagarContraTecnica(actor,id,Number(g));
}

const choquesWorkflow=new WeakMap(),oposicionesWorkflow=new WeakMap();
async function choqueAutomatico(wf) {
  // 4.1c: un conjuro de D&D también se puede interceptar (potencia = nivel del espacio; naturaleza según su daño).
  const conjuro=!!wf&&conjuroChocable(wf.item,wf.activity);
  if(!wf||(!conjuro&&(!despierto(wf.actor)||!tecnicaChocable(wf.item,wf.activity))))return;
  if(!conjuro){const metaAtaque=wf.item?.getFlag?.(MOD,F);if(metaAtaque?.id&&!cuestaVerbe(wf.actor,metaAtaque,gradoAtaque(wf)))return;}
  if(choquesWorkflow.has(wf))return choquesWorkflow.get(wf);
  const trabajo=(async()=>{
    const vistos=new Set();
    for(const tok of [...(wf.targets??[])]){
      const actor=tok?.actor;if(!actor||actor===wf.actor||!despierto(actor)||vistos.has(actor.uuid??actor.id)||noPuedeActuar(actor)||actor.statuses?.has("canalizando")||!reaccionDisponible(actor))continue;
      vistos.add(actor.uuid??actor.id);
      const respuesta=await preguntarDefensa(actor,{choque:true,quien:wf.actor.name,con:wf.item.name,grado:gradoAtaque(wf)});
      if(!respuesta)continue;
      const item=itemsDe(actor,respuesta.id)[0],m=item?.getFlag(MOD,F);
      if(respuesta.nonce!==estado(actor)?.ultimoUso||!tecnicaChocable(item)||!Number.isInteger(respuesta.grado)||respuesta.grado<m.g||respuesta.grado>gradoUsable(actor,m))continue;
      const mA=wf.item.getFlag?.(MOD,F),natA=conjuro?naturalezaConjuro(wf.item):(mA?.infusion||mA?.nat);
      const ganador=await resolverChoque({actor:wf.actor,nombre:wf.item.name,nat:natA,g:gradoAtaque(wf)},
        {actor,nombre:item.name,nat:m.infusion||m.nat,g:respuesta.grado},{automatico:true});
      if(ganador<=0)for(const token of [...wf.targets])if(token.actor===actor||token.actor?.uuid===actor.uuid)excluirBlanco(wf,token);
      await registrarPaso(wf,'choque-'+actor.id,'Choque de técnicas',`${actor.name}: ${respuesta.nombre??item.name}, grado ${respuesta.grado}, ${respuesta.costo??'consulta la contratécnica'} Verbe. ${ganador<=0?'Intercepta contra este defensor.':'La amenaza continúa contra este defensor.'}`);
    }
  })();choquesWorkflow.set(wf,trabajo);return trabajo;
}
async function enfrentamientoAutomatico(wf){
  if(!wf)return;if(oposicionesWorkflow.has(wf))return oposicionesWorkflow.get(wf);
  const trabajo=(async()=>{const antes=wf.targets?.size??0;await defenderAtaque(wf);await defenderArea(wf);await registrarPaso(wf,'defensas','Defensas previas resueltas',`${antes-(wf.targets?.size??0)} objetivo(s) protegido(s) antes del choque. Las reacciones y sus costes conservan sus reglas.`);await choqueAutomatico(wf);})();
  oposicionesWorkflow.set(wf,trabajo);return trabajo;
}

/** En el flujo nativo se pausa la continuación síncrona después de pagar una sola vez. */
async function choqueNativo(activity,usage,results){
  const wf={actor:activity.actor,item:activity.item,activity,_ecosMensaje:results?.message,targets:new Set(game.user.targets??[]),castData:{castLevel:activity.item.system.level}};
  for(const tok of [...wf.targets]){
    if(!despierto(tok.actor)||tok.actor===wf.actor)continue;
    const area=!!activity.target?.template?.type;
    if(!defensasDisponibles(tok.actor,{grado:gradoAtaque(wf),area}).length)continue;
    const defensa=await preguntarDefensa(tok.actor,{quien:wf.actor.name,con:wf.item.name,grado:gradoAtaque(wf),previo:true,area});
    if(defensa&&(area||D.defensas[defensa]?.tipo==='falla'))excluirBlanco(wf,tok);
  }
  await registrarPaso(wf,'defensas','Defensas previas resueltas',`${wf.ecosExcluidos?.size??0} objetivo(s) protegido(s) antes del choque.`);
  await choqueAutomatico(wf);
  await registrarPaso(wf,'continuacion','Lanzamiento después del enfrentamiento',`${wf.targets.size} objetivo(s) restante(s). La tarjeta y la ficha resuelven las tiradas y el daño; revisa las consecuencias de mesa.`);
  if(results?.message && wf.ecosExcluidos?.size){
    const protegidos=new Set([...wf.ecosExcluidos].flatMap(t=>[t.document?.uuid,t.uuid,t.actor?.uuid]));
    const cambioObjetivos=filtrarObjetivosMensaje(results.message,o=>!protegidos.has(o.uuid)&&!protegidos.has(o.token));
    if(cambioObjetivos)await results.message.update(cambioObjetivos);
    await aLaMesa(wf.actor,'Objetivos tras el enfrentamiento',`<p>Protegidos: ${[...wf.ecosExcluidos].map(t=>escH(t.name??t.actor.name)).join(', ')}. ${wf.targets.size?'La técnica continúa solo contra los demás objetivos.':'El lanzamiento ha sido interceptado; no continúa.'}</p>`);
  }
  try{
    if(wf.targets.size && usage.subsequentActions!==false){
      const consumed=activity.createConsumedFlag?.(activity.actor,consumoMensaje(results?.message));
      if(consumed)activity.item.updateSource?.({'flags.dnd5e.consumed':consumed});
      await activity._triggerSubsequentActions?.(usage,results);
    }
  }finally{await limpiarDefensas(wf);}
}

/** Lo que quede de una defensa al terminar la tirada (si DAE no lo quitó solo), lo borra el DM. */
async function limpiarDefensas(wf) {
  if (!soyGM()) return;
  for (const tok of new Set([...(wf?.targets??[]),...(wf?.ecosExcluidos??[])])) {
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
      const mon = tieneDote(actor, "moneda-al-verbe") ? sistema.moneda(actor) : 0;
      bloque.innerHTML = `<div class="ecos-verbe-barra ${v < 0 ? "negativo" : ""}"><div style="width:${pct * 100}%"></div><span>Verbe ${v} / ${max}</span></div>${tieneDote(actor, "moneda-al-verbe") ? `<button type="button" class="ecos-verbe-moneda" data-ecos-moneda ${mon ? "" : "disabled"} data-tooltip="Gastar 1 Moneda Antigua para recargar el Verbe (en combate gasta tu acción Verbe). Te quedan ${mon}."><i class="fa-solid fa-coins"></i> ${mon}</button>` : ""}`;
      bloque.addEventListener("click", ev => {
        ev.preventDefault();
        // 3.34: el botón de la Moneda recarga; el resto de la barra abre el panel.
        if (ev.target.closest("[data-ecos-moneda]")) return import("./verbe-334.js").then(m => m.recargarConMoneda(actor)).catch(err => console.error(`${MOD} | moneda`, err));
        abrirPanel(actor);
      });
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
  // Ediciones del DM sobre el catálogo del módulo: solo las diferencias, para que una actualización no las borre.
  game.settings.register(MOD, "capaVSangre", { scope: "world", config: false, type: String, default: "" });
  game.settings.register(MOD, AJ.ediciones, { scope: "world", config: false, type: Object, default: { tecnicas: {}, dotes: {} } });
  game.settings.register(MOD, "dadoControl", { name: "Verbe: dado de control", hint: "A todo costo de Verbe se le suma el dado de control de su etapa: Aprendiz +1d4, Practicante +1d3, Iniciado +1d2, Pleno +1d2−1. El dado nunca impide usar la técnica: si no alcanza, se lleva hasta el límite.", scope: "world", config: true, type: Boolean, default: true });
  game.settings.register(MOD, "dotesEntrenadas", { name: "Verbe: dotes entrenadas", hint: "Las dotes que no son dones se entrenan (horas o días, una tirada por bloque; un 20 natural las da al instante). Apagado: se compran y se tienen ya.", scope: "world", config: true, type: Boolean, default: true });
  game.settings.register(MOD, "dotesTipoManual", { scope: "world", config: false, type: Object, default: {} });
  game.settings.register(MOD, "trazosConEntreno", { name: "Verbe: rangos y Control se entrenan", hint: "Subir un rango de rama o el Control del Verbe se paga con Trazos y se entrena días (una tirada por día; un 20 natural lo termina). Apagado: se tiene al pagar.", scope: "world", config: true, type: Boolean, default: true });
  game.settings.register(MOD, "aviso365", { scope: "world", config: false, type: Boolean, default: false });
  game.settings.register(MOD, "selloSinChoque", { name: "Verbe: los sellos no chocan", hint: "Las técnicas de Sello no interceptan técnicas en un choque ni se las intercepta (pedido del autor, 3.67). Apagado: chocan como las demás.", scope: "world", config: true, type: Boolean, default: true });
  game.settings.register(MOD, "ramasCerradas", { name: "Verbe: las ramas no se abren solas", hint: "Además de la principal, una rama se abre entrenando («Abrir rama»: 2 Trazos y 2 días), con una dote, o la abre el DM o un maestro. Las que ya empezó siguen abiertas. Apagado: toda rama queda abierta en Novato.", scope: "world", config: true, type: Boolean, default: true });
  game.settings.register(MOD, "verbeAprenderDias", {
    name: "Verbe · aprender por días", hint: "3.27: pagar los Trazos es el primer paso; después hay días de práctica con una tirada diaria de Control del Verbe (CD 10 + grado, tantos días buenos como grado + 1). Apagado: se aprende al pagar, como antes. El DM puede dar una técnica por aprendida o poner a un personaje «al instante» (creación de personajes de más nivel).",
    scope: "world", config: true, type: Boolean, default: true
  });
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
  const ramas = { vum: "Umbral", vva: "Vasija", vfo: "Forma", vve: "Velo", vcu: "Cuerpo", vmi: "Mirada", vse: "Sello", vpa: "Pacto", vpu: "Pulso", vhi: "Hilo", vqu: "Quietud", vra: "Rastro", vsa: "Sangre" };
  const iconos = { vum: "conjuration", vva: "evocation", vfo: "evocation", vve: "illusion", vcu: "transmutation", vmi: "divination", vse: "abjuration", vpa: "conjuration",
    vpu: "necromancy", vhi: "enchantment", vqu: "abjuration", vra: "divination", vsa: "transmutation" };
  for (const [k, n] of Object.entries(ramas)) CONFIG.DND5E.spellSchools[k] = { label: n, icon: `systems/dnd5e/icons/svg/schools/${iconos[k]}.svg`, fullKey: `verbe${n}`, reference: "" };
  // 3.65 (regla del autor): el Control del Verbe se tira con Inteligencia; las dotes Control por instinto (SAB) y Control por presencia (CAR) lo cambian.
  CONFIG.DND5E.skills.cvb = { label: "Control del Verbe", ability: "int", fullKey: "controlVerbe", reference: "", icon: "systems/dnd5e/icons/svg/abilities/intelligence.svg" };
  // dnd5e 6 rehace CONFIG.statusEffects en i18nInit a partir de CONFIG.DND5E.statusEffects: los estados se registran ahí
  // (también vale para dnd5e 5.2). Sin dnd5e, se añaden a la lista del núcleo como antes.
  for (const [id, c] of Object.entries(ESTADOS)) {
    const datos = { name: c.name, img: c.img, changes: c.changes ?? [], description: `<p>${c.texto}</p>`, flags: { [MOD]: { [F]: { estado: id } } } };
    if (CONFIG.DND5E?.statusEffects && !CONFIG.DND5E.statusEffects[id]) { CONFIG.DND5E.statusEffects[id] = datos; continue; }
    if (!Array.isArray(CONFIG.statusEffects) || CONFIG.statusEffects.some(s => s.id === id)) continue;
    CONFIG.statusEffects.push({ id, _id: `ecosv${id}`.padEnd(16, "0").slice(0, 16), ...datos });
  }
  parcheEspacios();
});

Hooks.once("ready", async () => {
  if (!((MODO === "activo") || ((MODO === "prueba") && game.user.isGM))) return;
  try {
    D = await cargarDatos();
    if (!D) return console.warn(`${MOD} | capa V: no encuentro sus datos`);
    aplicarNombresMundo(D, nombresDelMundo());
    prepararDatos327(D);
    BASE = { tecnicas: D.tecnicas, dotes: D.dotes };
    aplicarEdicionesMundo();
    if (soyGM()) setTimeout(() => revisarSangres().catch(err => console.warn(`${MOD} | sangre`, err)), 3000);
    if (soyGM()) setTimeout(() => rearmarMundo().catch(err => console.warn(`${MOD} | rearmar`, err)), 5000);
    // 3.65: aviso único al DM: el Control del Verbe pasa a Inteligencia; las fichas que ya lo tiraban con Sabiduría se respetan.
    if (soyGM() && !ajuste("aviso365", false)) setTimeout(async () => {
      const con = (game.actors ?? []).filter(x => despierto(x) && x.system?.skills?.cvb?.ability === "wis" && !tieneDote(x, "control-instinto")).map(x => escH(x.name));
      if (con.length) await susurrarDM("El Control del Verbe ahora es de Inteligencia", `<p>Regla 3.65: el Control del Verbe se tira con Inteligencia; con la dote <b>Control por instinto</b>, con Sabiduría; con <b>Control por presencia</b>, con Carisma.</p><p>Estas fichas lo tiraban con Sabiduría y se respetó: <b>${con.join(", ")}</b>. Para cambiarlas: su panel del Verbe → DM → «Control del Verbe» (INT / SAB / CAR), o dales la dote Control por instinto.</p>`);
      await game.settings.set(MOD, "aviso365", true).catch(() => null);
    }, 7000);
    console.log(`${MOD} | capa V ${D.version}: ${D.tecnicas.length} técnicas (${MODO})`);
  } catch (err) {
    return console.error(`${MOD} | capa V: no pude leer sus datos`, err);
  }
  const api = (game.modules.get(MOD).api ??= {});
  api.verbe = { turnoVerbe, ofertasActor, corregirGastoSimple, gastarMoneda, usarDote, reorientarCultivo, concederShinobi, concederArtefacto, almacenarVerbe, transferirVerbe, editorCatalogo: abrirEditorCatalogo, publicarTecnicaUniversal, despertar: a => dialogoDespertar(a), abrir: a => abrirPanel(a), usoRapido, despierto, estado, maxVerbe, trazos, refrescar, aprender,
    tecnica: id => tecnicaPorId(id), datos: () => D, aprobar, despertarOjo, costoUso, requisitos, choque: dialogoChoque, olvidar,
    deshacer, rehacer, ajustar, darTrazos, recuperar: recuperarVerbe, devolverVerbe, disiparClon, canalizar, liberarCanalizada, interrumpirCanal, rangoDe, tieneDote, lecturaDe, leerObjetivos, variarReservaNpc, asegurarTiradasVerbe, cambiarModoReserva, sangreDe, conflictoSangre, activarFamilia, cambiarEtapa, estadoDescubrimiento, pedirDescubrimiento, pruebaEntreno, terminarEntrenoYa, guia: abrirGuia, asegurarGuia, asegurarCompendios, modo: () => MODO, ajusteClima, gradoCriatura, extraContraFuerte,
    marcarMetal: (documento, metal = true) => game.user.isGM && ["Item", "Actor"].includes(documento?.documentName)
      ? documento.setFlag(MOD, "metal", !!metal) : false };
  game.socket.on(`module.${MOD}`, d => { if (d?.capaV && !socketDefensa(d)) manejar(d); });
  if (soyGM()) asegurarNotaPanteon(D).catch(err=>console.error(`${MOD} | panteón DM`,err));
  if (soyGM()) asegurarDiarioFamilias().catch(err => console.error(`${MOD} | familias`, err));
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
sistema.gancho("consumoDeUso", (activity, usageConfig, messageConfig, updates) => {
  if (!activo()) return;
  return alConsumir(activity, usageConfig, messageConfig, updates);
});
sistema.gancho("alUsar", (activity, usageConfig, results) => {
  if (!activo()) return;
  const final=despuesDeUsar(activity, usageConfig);
  if (!game.modules.get("midi-qol")?.active && tecnicaChocable(activity.item,activity) && despierto(activity.actor)
    && [...(game.user.targets??[])].some(t=>despierto(t.actor)&&t.actor!==activity.actor)) {
    final.then(()=>choqueNativo(activity,usageConfig,results)).catch(err=>{console.error(`${MOD} | choque nativo`,err);aviso("El enfrentamiento se detuvo: resuélvelo con el DM desde la tarjeta.","error");});
    return false; // Foundry no espera promesas en este hook; la continuación se reanuda después.
  }
  final.catch(err=>console.error(`${MOD} | capa V`,err));
});
sistema.gancho("antesDelDano", config => { if (activo()) antesDelDano(config); });
// El catálogo mide las áreas en metros: si la escena está en pies, la plantilla se convierte (1,5 m = 5 pies) para poder colocarla.
// Vale para cualquier actividad (también conjuros en pies sobre una escena en metros). Una línea sin ancho ocupa una casilla.
sistema.gancho("antesDePlantilla", (activity, data) => {
  try {
    plantillaEnEscena(data, activity?.target?.template?.units, canvas?.scene?.grid?.units);
    if (data?.t === "ray" && !(Number(data.width) > 0)) data.width = canvas?.dimensions?.distance ?? data.width;
  } catch (err) { console.warn(`${MOD} | plantilla`, err); }
});
// Defensas antes de resolver (midi-qol): las espera la tirada.
Hooks.on("midi-qol.preCheckHits", async wf => { if (activo()) await enfrentamientoAutomatico(wf).catch(err => console.error(`${MOD} | capa V: defensas`, err)); });
Hooks.on("midi-qol.preCheckSaves", async wf => { if (activo()) await enfrentamientoAutomatico(wf).catch(err => console.error(`${MOD} | capa V: defensas`, err)); });
Hooks.on("midi-qol.preDamageRoll", async wf => { if(activo())await enfrentamientoAutomatico(wf); });
Hooks.on("midi-qol.RollComplete", wf => { if (activo()) limpiarDefensas(wf).catch(() => null); });
sistema.gancho("alTerminarDescanso", (actor, result, config) => { if (activo()) alDescansar(actor, result, config); });
sistema.gancho("antesDadoDeGolpe", config => {
  try {
    const actor = config?.subject;
    if (!activo() || !despierto(actor) || !efectosDotes(actor).some(ef => ef.alientoCura)) return;
    const mod = modDe(actor, estado(actor).car);
    if (mod > 0) config.rolls?.[0]?.parts?.push(String(mod));
  } catch (err) {
    console.warn(`${MOD} | capa V: aliento`, err);
  }
});
sistema.gancho("alTirarDadoDeGolpe", (rolls, datos) => {
  try {
    const actor = datos?.subject;
    if (!activo() || !despierto(actor) || !actor.isOwner) return;
    const n = Math.max(0, ...efectosDotes(actor).map(ef => Number(ef.aliento) || 0));
    if (!n) return;
    // Se suma a la actualización nativa del dado: no se escribe fuera de su transacción.
    if (!datos.updates || !("system.hd.spent" in (datos.updates.class ?? {}) || "system.attributes.hd.spent" in (datos.updates.actor ?? {}))) return;
    const update = (datos.updates.actor ??= {});
    const actual = { ...estado(actor) };
    for (const k of ["valor", "recResto", "recCortos"]) if (`flags.${MOD}.${F}.${k}` in update) actual[k] = update[`flags.${MOD}.${F}.${k}`];
    const cambios = recuperacionBreve(actor, n, actual);
    for (const k of ["valor", "recResto", "recCortos"]) update[`flags.${MOD}.${F}.${k}`] = cambios[k];
  } catch (err) {
    console.warn(`${MOD} | capa V: aliento`, err);
  }
});
Hooks.on("updateWorldTime", () => {
  if (!activo() || !soyGM()) return;
  for (const a of actoresPresentes()) for (const ef of a.effects) { const fl=ef.getFlag(MOD,F); if ((fl?.shinobi||fl?.replicas) && Number.isFinite(ef.duration?.remaining) && ef.duration.remaining<=0) ef.delete().catch(err=>console.error(`${MOD} | caducidad shinobi`,err)); }
});
Hooks.on("updateSetting", setting => {
  if (activo() && setting.key === `${MOD}.${AJ.extra}`) for (const id of paneles.keys()) refrescarPanel(id);
  if (activo() && setting.key === `${MOD}.${AJ.ediciones}`) {
    const antes = new Set(D.tecnicas.filter(t => t.editadaDM).map(t => t.id));
    aplicarEdicionesMundo();
    const tocadas = new Set([...antes, ...D.tecnicas.filter(t => t.editadaDM).map(t => t.id)]);
    // Las fichas que ya la saben se rearman con la versión nueva (o la original, si se restauró).
    if (soyGM()) for (const a of game.actors ?? []) if (itemsTecnica(a).some(i => tocadas.has(i.getFlag(MOD, F).id))) refrescar(a).catch(err => console.error(`${MOD} | edición del catálogo`, err));
    for (const id of paneles.keys()) refrescarPanel(id);
  }
});
Hooks.on("refreshToken", token => { if (activo()) barraToken(token); });
Hooks.on("deleteActiveEffect", (ef, opciones) => { if (activo()) alQuitarEfecto(ef, opciones).catch(err => console.error(`${MOD} | capa V`, err)); });
Hooks.on("preUpdateActor", (actor, cambios, opciones) => {
  if (!activo()) return;
  const nuevo = foundry.utils.getProperty(cambios, sistema.RUTAS.pg);
  if (nuevo !== undefined && efectoCanal(actor)) opciones.ecosDanoCanal = Math.max(0, sistema.pg(actor).valor - Number(nuevo));
});
Hooks.on("updateActor", (actor, cambios, opciones) => {
  if (!activo()) return;
  if (soyGM() && esClon(actor) && Number(foundry.utils.getProperty(cambios, sistema.RUTAS.pg)) <= 0) disiparClon(actor, { destruido: true }).catch(err => console.error(`${MOD} | clon`, err));
  if (soyGM() && opciones?.ecosDanoCanal > 0) golpeCanalizando(actor, opciones.ecosDanoCanal).catch(err => console.error(`${MOD} | canalizar`, err));
  if (soyGM() && modoReserva(estado(actor)) === "dados" && (foundry.utils.hasProperty(cambios, sistema.RUTAS.nivel) || foundry.utils.hasProperty(cambios, `flags.${MOD}.${F}.nivel`)))
    asegurarTiradasVerbe(actor).catch(err => console.error(`${MOD} | reserva por dados`, err));
  if (consumoPendiente(actor)?.nonce === estado(actor)?.ultimoUso) consumosPendientes.delete(claveActor(actor));
  if (soyGM() && Number(foundry.utils.getProperty(cambios, `flags.${MOD}.${F}.valor`)) < 0 && herenciaDe(actor)?.barrera) {
    manejar({ accion: "capaVBarrera", actorId: actor.id }, { interno: true });
  }
  if (foundry.utils.hasProperty(cambios, `flags.${MOD}.${F}`) || foundry.utils.hasProperty(cambios, sistema.RUTAS.caracteristicas)
    || foundry.utils.hasProperty(cambios, sistema.RUTAS.moneda)) {
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
    return asegurarRasgos(actor);
  }).catch(err => console.error(`${MOD} | capa V`, err));
});

sistema.gancho("antesDeAtacar", config => { if (activo()) configurarAtaque(config); });
sistema.gancho("antesDeSalvacion", config => { if (activo()) configurarSalvacion(config); });
sistema.gancho("alAtacar", (rolls, datos) => {
  if (!activo()) return;
  despuesAtaque(rolls, datos, (actor, atacante, ids) => alDM({ accion: "capaVMetal", actorId: actor.id,
    atacanteId: atacante.id, efectoIds: ids })).catch(err => console.error(`${MOD} | estados`, err));
});
Hooks.on("preCreateActiveEffect", (effect, data) => { if (activo()) normalizarHielo(effect, data); });
Hooks.on("createChatMessage", m => {
  if (!activo() || !soyGM()) return;
  const a = game.actors?.get?.(m.speaker?.actor);
  if (!esClon(a)) return;
  const texto = String(m.flavor || m.content || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 120);
  if (!texto) return;
  const info = estado(a).clon;
  guardar(a, { clon: { ...info, registro: [...(info.registro ?? []), texto].slice(-20) } }).catch(() => null);
});
Hooks.on("createActiveEffect", effect => {
  const actor = effect?.parent;
  if (!activo() || !soyGM() || !(actor instanceof Actor) || !efectoCanal(actor)) return;
  if (INCAPAZ.some(st => effect.statuses?.has?.(st))) interrumpirCanal(actor, "queda incapacitado").catch(() => null);
});
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
/**
 * 3.27: Sustitución y las defensas también contra ataques normales sin midi-qol (dnd5e 6). Después de la tirada de
 * ataque, a cada objetivo despierto al que el ataque alcanzaría se le ofrece su defensa (gasta la reacción Verbe) y el
 * chat dice cómo queda el ataque. Las técnicas que ya pasaron por el enfrentamiento previo no preguntan dos veces.
 */
async function defensaNativa(rolls, activity) {
  const roll = rolls?.[0], atacante = activity?.actor;
  if (!roll || !atacante || game.modules.get("midi-qol")?.active) return;
  const meta = activity.item?.getFlag?.(MOD, F);
  if (meta?.id && tecnicaChocable(activity.item, activity)) return;
  const grado = gradoAtaque({ actor: atacante, item: activity.item, activity });
  for (const tok of [...(game.user.targets ?? [])]) {
    const actor = tok.actor;
    if (!actor || actor === atacante || !despierto(actor)) continue;
    const ca = sistema.ca(actor), critico = !!roll.isCritical, impacta = critico || (!roll.isFumble && Number(roll.total) >= ca);
    if (!impacta || !defensasDisponibles(actor, { grado, area: false }).length) continue;
    await preguntarDefensa(actor, { quien: atacante.name, con: activity.item?.name ?? "un ataque", grado, total: roll.total, ca, critico, nativo: true });
  }
}
Hooks.on("dnd5e.rollAttackV2", (rolls, datos) => { if (activo()) defensaNativa(rolls, datos?.subject).catch(err => console.error(`${MOD} | defensa`, err)); });

/** Para las pruebas fuera de Foundry. */
export const _prueba = { crearClones, pedirClones, subirCarga, golpeCanalizando, revolver, resolverEntreno, iniciarEntrenoNaturaleza, aplicarDesventaja, defenderAtaque, despuesDeUsar, ponerDespertar, ponerOjo, alQuitarEfecto, inicioDeTurno, manejar, crearAprobada, asegurarRasgos, choqueAutomatico, choqueNativo, elegirContraTecnica, pagarContraTecnica, opcionesChoque, excluirBlanco, enfrentamientoAutomatico };
