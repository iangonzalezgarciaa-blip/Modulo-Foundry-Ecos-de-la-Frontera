/**
 * 3.28 · La ruptura (pedido del autor). En la campaña, las criaturas de VD ½ o más tienen una defensa altísima de un tipo:
 *  - Coraza: CA muy alta. La baja la Brecha (−2 CA cada una, hasta 3).
 *  - Fortaleza: salvaciones muy altas. La baja la Grieta (−2 a sus salvaciones cada una, hasta 3).
 *  - Cuerpo sordo: resistencia a los golpes de armas (contundente, cortante y perforante). La anula Quebrado.
 * D&D es el cañón de golpe; el Verbe (y algunas acciones de cualquiera) ablandan: ponen Brecha, Grieta o Quebrado.
 * Quebrado (hasta el final del turno siguiente): la defensa de la criatura no cuenta y sus resistencias se ignoran.
 *
 * Técnicas pesadas: atraviesan cualquier defensa (su ataque no cuenta la Coraza; su salvación pedida no cuenta la
 * Fortaleza; su daño ignora resistencias), pero abren la guardia de quien las suelta: cada enemigo a 5 ft puede hacerle
 * un ataque de oportunidad, salvo que lleve un ojo abierto. Una Sustitución mejorada las esquiva igual.
 *
 * Lo puro (tablas, sugerencias, datos de efectos) se prueba sin Foundry; los ganchos corren en Foundry.
 */
import { sistema } from "./sistema/index.js";

const MOD = "ecos-frontera";
export const BRECHA = "ecosBrecha", GRIETA = "ecosGrieta", QUEBRADO = "ecosQuebrado";
export const TOPE_RUPTURA = 3;
const S = "systems/dnd5e/icons/svg/";

/** Los estados de ruptura (se registran con los del Verbe y las técnicas los pueden imponer). */
export const ESTADOS_RUPTURA = {
  [BRECHA]: { name: "Brecha", img: `${S}statuses/bleeding.svg`, dura: 60,
    changes: [{ key: "system.attributes.ac.bonus", mode: 2, value: "-2" }],
    texto: "Su guardia cedió: −2 a la CA por cada Brecha, hasta 3 (−6). Dura 1 minuto. Si gasta su acción en recomponerse, se quita una." },
  [GRIETA]: { name: "Grieta", img: `${S}statuses/cursed.svg`, dura: 60,
    changes: [{ key: "system.bonuses.abilities.save", mode: 2, value: "-2" }],
    texto: "Le encontraron la grieta: −2 a todas sus salvaciones por cada Grieta, hasta 3 (−6). Dura 1 minuto. Si gasta su acción en recomponerse, se quita una." },
  [QUEBRADO]: { name: "Quebrado", img: `${S}statuses/exhaustion.svg`, dura: 6,
    texto: "Su defensa se rompió hasta el final de su próximo turno: no cuenta su Coraza ni su Fortaleza, y el daño que recibe ignora sus resistencias." }
};

/** Las defensas de la campaña. `n` sale de la tabla por VD. */
export const DEFENSAS = {
  coraza: { nombre: "Coraza", img: `${S}statuses/marked.svg`, quiebra: "Brecha",
    texto: "CA altísima: quitina, escamas, placas o una guardia de hierro. La Brecha (−2 CA cada una) la ablanda; Quebrado la anula un turno." },
  fortaleza: { nombre: "Fortaleza", img: `${S}statuses/blessed.svg`, quiebra: "Grieta",
    texto: "Salvaciones altísimas: un cuerpo o una voluntad que no ceden. La Grieta (−2 a sus salvaciones cada una) la ablanda; Quebrado la anula un turno." },
  piel: { nombre: "Cuerpo sordo", img: `${S}statuses/petrified.svg`, quiebra: "Quebrado",
    texto: "Resistencia a los golpes de armas (contundente, cortante y perforante). El Verbe con elemento entra entero; Quebrado le quita las resistencias un turno." }
};
export const TIPOS_DEFENSA = ["coraza", "fortaleza", "piel", "ninguna"];

/** Bono de Coraza y Fortaleza por tramo de VD: ½–4, 5–10, 11–16, 17 o más. Bajo ½ no hay defensa. */
export const TABLA_DEFENSA = [4, 5, 6, 7];
export function tramoVD(vd) {
  const v = Number(vd);
  if (!Number.isFinite(v) || v < 0.5) return -1;
  return v <= 4 ? 0 : v <= 10 ? 1 : v <= 16 ? 2 : 3;
}
export const bonoDefensa = (vd, tabla = TABLA_DEFENSA) => { const i = tramoVD(vd); return i < 0 ? 0 : Number(tabla[i]) || 0; };

/**
 * La defensa que le toca a una criatura si el DM no eligió otra. Pura.
 * @param {{tipo:string, vd:number, ca:number, calculo:string, armadura:string, deJugador:boolean}} c
 *   `calculo`: el cálculo de CA de dnd5e (natural, flat, default…); `armadura`: tipo de la armadura equipada (heavy, medium…).
 */
export function defensaSugerida({ tipo, vd, ca = 10, calculo = "", armadura = "", deJugador = false } = {}) {
  if (deJugador || tramoVD(vd) < 0) return null;
  const t = String(tipo ?? "").toLowerCase();
  if (["undead", "construct", "ooze"].includes(t)) return "piel";
  if (["beast", "monstrosity", "dragon"].includes(t)) return (["natural", "flat"].includes(calculo) && Number(ca) >= 13) || Number(ca) >= 15 ? "coraza" : "fortaleza";
  if (t === "humanoid") return ["heavy", "medium", "shield"].includes(armadura) || Number(ca) >= 15 ? "coraza" : "fortaleza";
  return "fortaleza";
}

/** El efecto activo de una defensa. Puro. */
export function efectoDefensa(tipo, n) {
  const d = DEFENSAS[tipo];
  if (!d) return null;
  const changes = tipo === "coraza" ? [{ key: "system.attributes.ac.bonus", mode: 2, value: `+${n}` }]
    : tipo === "fortaleza" ? [{ key: "system.bonuses.abilities.save", mode: 2, value: `+${n}` }]
    : ["bludgeoning", "piercing", "slashing"].map(v => ({ key: "system.traits.dr.value", mode: 2, value: v }));
  const nombre = tipo === "piel" ? d.nombre : `${d.nombre} +${n}`;
  return { name: nombre, img: d.img, transfer: false, disabled: false, changes, duration: {},
    description: `<p>${d.texto}</p>`, flags: { [MOD]: { defensa: { tipo, n } } } };
}

/** Cuántas de cada ruptura tiene y si una nueva cabe. Puro. */
export const cabeRuptura = (actuales, tope = TOPE_RUPTURA) => Number(actuales) < tope;

/** La página de reglas para todos: qué es ablandar y cómo se hace. Pura. */
export function guiaRupturaHTML() {
  return `<h1>Ablandar a las criaturas</h1>
<p>En este mundo, D&amp;D es el cañón de golpe y el Verbe es lo que abre el camino. Las criaturas de VD ½ o más tienen una defensa altísima de un tipo. Las de menos son salvajes casi sin Verbe, igual de letales.</p>
<h2>Las tres defensas</h2>
<ul><li><b>Coraza.</b> CA altísima: quitina, escamas, placas, una guardia de hierro. Cuesta acertarle.</li>
<li><b>Fortaleza.</b> Salvaciones altísimas: un cuerpo o una voluntad que no ceden. Resiste lo que pide salvación.</li>
<li><b>Cuerpo sordo.</b> Resiste los golpes de armas (contundente, cortante, perforante). El Verbe con elemento entra entero.</li></ul>
<p>No sabes de antemano cuál tiene ni cuánto: lo vas viendo (o lo descubres con <b>Evaluar al enemigo</b> y <b>Buscar la grieta</b>).</p>
<h2>Cómo se ablanda</h2>
<ul><li><b>Brecha</b>: −2 a su CA. Se acumulan hasta 3 (−6). Dura 1 minuto.</li>
<li><b>Grieta</b>: −2 a todas sus salvaciones. Hasta 3 (−6). Dura 1 minuto.</li>
<li><b>Quebrado</b>: hasta el final de su próximo turno, su defensa no cuenta y el daño ignora sus resistencias.</li></ul>
<p>Las ponen muchas técnicas del Verbe (cada una a su manera: el hielo vuelve quebradiza la coraza, el rayo afloja la guardia…) y dos acciones de cualquiera: <b>Romper la guardia</b> (Fuerza, Atletismo: Brecha) y <b>Buscar la grieta</b> (Inteligencia, la mejor de Investigación, Naturaleza, Arcanos o Medicina: Grieta). Si la criatura gasta su acción en recomponerse, se quita una.</p>
<h2>Sinergias: un estado más un golpe</h2>
<p>Lo que deja una técnica lo remata otra, o un arma. Sale solo al aplicar el daño:</p>
<ul>${SINERGIAS.map(x => `<li><b>${NOMBRE_ESTADO[x.si] ?? x.si}</b> + daño de ${x.con.map(c => TIPOS_ES[c] ?? c).join(" o ")}: ${x.texto}</li>`).join("")}</ul>
<h2>Técnicas pesadas</h2>
<p>Las grandes de un solo golpe (las esferas, la palma de las mil aves, el corte del relámpago, las cargadas que dañan…) <b>atraviesan cualquier defensa</b>. Pero al soltarlas abres tu guardia: cada enemigo a 5 ft puede hacerte un ataque de oportunidad, salvo que lleves un ojo abierto. Una Sustitución mejorada las esquiva igual.</p>
<h2>Cuando te toca defenderte</h2>
<p>Si alguien usa contra ti algo que pide salvación (una Presa, un Empujón, una técnica), te sale una ventana para elegir con qué te defiendes. Tiras y el módulo aplica lo que toque.</p>`;
}

const NOMBRE_ESTADO = { empapado: "Empapado", helado: "Helado", ardiendo: "Ardiendo", embarrado: "Embarrado", cargado: "Cargado", desequilibrado: "Desequilibrado" };
const TIPOS_ES = { lightning: "relámpago", bludgeoning: "contundente (un mazo, un puño)", thunder: "trueno", force: "fuerza", cold: "frío", fire: "fuego" };

/* ---------------- Foundry ---------------- */
const leer = (k, def) => { try { return game.settings.get(MOD, k); } catch { return def; } };
const tieneEstado = (actor, id) => !!actor?.statuses?.has?.(id);
const esNPC = a => a?.type === "npc";
const vdDe = a => Number(a?.system?.details?.cr ?? NaN);
const datosCriatura = a => ({
  tipo: a.system?.details?.type?.value, vd: vdDe(a), ca: Number(a.system?.attributes?.ac?.value) || 10,
  calculo: a.system?.attributes?.ac?.calc ?? "", deJugador: !!a.hasPlayerOwner,
  armadura: a.items?.find?.(i => i.type === "equipment" && i.system?.equipped && ["heavy", "medium", "shield"].includes(i.system?.type?.value))?.system?.type?.value ?? ""
});
/** La defensa que tiene: la que eligió el DM o, si no eligió, la sugerida. */
export function defensaDe(actor) {
  const f = actor?.getFlag?.(MOD, "defensa");
  if (f?.tipo === "ninguna") return null;
  const tipo = DEFENSAS[f?.tipo] ? f.tipo : null;
  if (!tipo) return null;
  return { tipo, n: Number(f.n) || bonoDefensa(vdDe(actor)) };
}
const efectoActual = actor => actor?.effects?.find?.(e => e.getFlag?.(MOD, "defensa"));

/** Deja la ficha con el efecto que corresponde a su defensa (o sin él). Solo el DM. */
export async function sincronizarDefensa(actor) {
  if (!game.user.isGM || !actor) return;
  const d = defensaDe(actor), ef = efectoActual(actor);
  if (!d) { if (ef) await ef.delete(); return; }
  const datos = efectoDefensa(d.tipo, d.n);
  datos.disabled = tieneEstado(actor, QUEBRADO);
  if (!ef) return actor.createEmbeddedDocuments("ActiveEffect", [datos]);
  const igual = ef.name === datos.name && !!ef.disabled === datos.disabled && JSON.stringify(ef.changes) === JSON.stringify(datos.changes);
  if (!igual) await ef.update({ name: datos.name, img: datos.img, changes: datos.changes, disabled: datos.disabled, description: datos.description, flags: datos.flags });
}

/** Elige (o quita) la defensa de una ficha. `tipo` es coraza, fortaleza, piel o ninguna; `n` opcional. */
export async function ponerDefensa(actor, tipo, n = null) {
  if (!game.user.isGM || !actor || !TIPOS_DEFENSA.includes(tipo)) return false;
  await actor.setFlag(MOD, "defensa", { tipo, n: tipo === "ninguna" ? 0 : (Number(n) || bonoDefensa(vdDe(actor))), elegida: true });
  await sincronizarDefensa(actor);
  return true;
}

/** A las fichas de PNJ de VD ½ o más que no tienen defensa, les pone la sugerida. Devuelve cuántas cambió. */
export async function defensasAutomaticas({ forzar = false } = {}) {
  if (!game.user.isGM) return 0;
  let n = 0;
  for (const a of game.actors ?? []) {
    if (!esNPC(a) || a.hasPlayerOwner) continue;
    const f = a.getFlag(MOD, "defensa");
    if (f && !forzar) continue;
    if (f?.elegida) continue;
    const tipo = defensaSugerida(datosCriatura(a));
    if (!tipo) continue;
    await a.setFlag(MOD, "defensa", { tipo, n: bonoDefensa(vdDe(a)), elegida: false });
    await sincronizarDefensa(a);
    n += 1;
  }
  return n;
}

const ojoAbierto = actor => !!actor?.effects?.some?.(e => !e.disabled && e.getFlag?.(MOD, "verbe")?.ojo);
export const esPesada = item => !!(item?.getFlag?.(MOD, "verbe")?.pesada ?? item?.flags?.[MOD]?.verbe?.pesada);

/** Una técnica pesada no cuenta la Coraza del blanco: suma a su ataque lo que la Coraza le suma a la CA. */
function pesadaAtraviesaCoraza(config) {
  const act = config?.subject;
  if (!esPesada(act?.item)) return;
  const blancos = [...(game.user?.targets ?? [])];
  if (blancos.length !== 1) return;
  const d = defensaDe(blancos[0].actor);
  if (d?.tipo !== "coraza" || tieneEstado(blancos[0].actor, QUEBRADO)) return;
  for (const r of config.rolls ?? []) { r.parts ??= []; if (!r.parts.includes("@ecosPesada")) { r.parts.push("@ecosPesada"); r.data ??= {}; r.data.ecosPesada = d.n; } }
}

/** Dotes del atacante al tirar el ataque: ventaja con 2 Brechas, y con un ojo abierto no cuenta la Coraza. */
function dotesAlAtacar(config) {
  const act = config?.subject, atacante = act?.actor, blancos = [...(game.user?.targets ?? [])];
  if (!atacante || blancos.length !== 1) return;
  const d = new Set(dotesDe(atacante)), b = blancos[0].actor;
  if (d.has("paso-por-la-herida") && (b?.effects?.filter?.(e => e.statuses?.has?.(BRECHA)).length ?? 0) >= 2) {
    config.advantage = true;
    for (const r of config.rolls ?? []) (r.options ??= {}).advantage = true;
  }
  const cor = defensaDe(b);
  if (d.has("ver-la-grieta") && ojoAbierto(atacante) && cor?.tipo === "coraza" && !esPesada(act.item) && !tieneEstado(b, QUEBRADO))
    for (const r of config.rolls ?? []) { r.parts ??= []; if (!r.parts.includes("@ecosVerGrieta")) { r.parts.push("@ecosVerGrieta"); r.data ??= {}; r.data.ecosVerGrieta = cor.n; } }
}
/** Daño extra de las dotes: Golpe al quiebre (contra Brecha, cuerpo a cuerpo) y Golpe en el vacío (contra Quebrado). Puro. */
export function danoExtraDotes({ dotes, estadosBlanco, cuerpoACuerpo, nivel }) {
  const d = new Set(dotes ?? []), e = new Set(estadosBlanco ?? []), n = Number(nivel) >= 11 ? 2 : 1, extra = [];
  if (d.has("golpe-al-quiebre") && cuerpoACuerpo && e.has(BRECHA)) extra.push({ formula: `${n}d6`, tipo: "bludgeoning" });
  if (d.has("golpe-en-el-vacio") && e.has(QUEBRADO)) extra.push({ formula: `${n}d8`, tipo: "force" });
  return extra;
}
function dotesAlDanar(config) {
  const act = config?.subject, atacante = act?.actor, blancos = [...(game.user?.targets ?? [])];
  if (!atacante || blancos.length !== 1 || act?.type !== "attack") return;
  const extra = danoExtraDotes({ dotes: dotesDe(atacante), estadosBlanco: [...(blancos[0].actor?.statuses ?? [])],
    cuerpoACuerpo: act.attack?.type?.value === "melee", nivel: atacante.system?.details?.level ?? atacante.system?.details?.cr ?? 1 });
  for (const x of extra) (config.rolls ??= []).push({ parts: [x.formula], data: {}, options: { type: x.tipo, types: [x.tipo] } });
}

async function avisoPesada(activity) {
  const actor = activity?.actor;
  if (!actor || !esPesada(activity.item)) return;
  const ojo = ojoAbierto(actor);
  await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), flags: { [MOD]: { pesada: true } },
    content: `<section class="ecos-pesada"><h3>Técnica pesada · ${foundry.utils.escapeHTML?.(activity.item.name) ?? activity.item.name}</h3>
      <p>Atraviesa cualquier defensa: no cuenta la Coraza ni la Fortaleza del blanco y su daño ignora resistencias.</p>
      <p>${ojo ? "<b>Lleva un ojo abierto:</b> ve venir el contragolpe y no abre su guardia." : "<b>Abre su guardia:</b> cada enemigo a 5 ft puede hacerle ahora un ataque de oportunidad (con su reacción)."} Una Sustitución mejorada puede esquivarla igual.</p></section>` });
}

/** Quebrado: la defensa no cuenta (su efecto queda apagado) y el daño ignora resistencias. */
function ignorarResistencias(actor, damages, options) {
  let ignorar = tieneEstado(actor, QUEBRADO);
  if (!ignorar) {
    const item = options?.originatingMessage?.getAssociatedItem?.();
    ignorar = esPesada(item);
  }
  if (!ignorar || options.ignore === true) return;
  options.ignore = { ...(options.ignore ?? {}), resistance: true };
}

/**
 * Sinergias (lógica de elementos): un estado que ya tiene el blanco más un daño que le cae encima lo ablanda. Así un
 * golpe de D&D (un mazazo) remata lo que preparó el Verbe (el hielo), y una técnica remata otra. Puro.
 * `si`: estado del blanco; `con`: tipos de daño de dnd5e; `pone`: ruptura; `ignora`: ese golpe ya ignora resistencias;
 * `gasta`: el estado de antes se consume.
 */
export const SINERGIAS = [
  { si: "empapado", con: ["lightning"], pone: QUEBRADO, ignora: true, gasta: true, texto: "La descarga corre por el agua y lo atraviesa entero: queda Quebrado." },
  { si: "helado", con: ["bludgeoning", "thunder", "force"], pone: QUEBRADO, ignora: true, gasta: true, texto: "El golpe parte el hielo y la coraza con él: queda Quebrado." },
  { si: "ardiendo", con: ["cold"], pone: BRECHA, gasta: true, texto: "Choque de calor y frío: la coraza se agrieta (Brecha) y se apaga el fuego." },
  { si: "embarrado", con: ["fire"], pone: BRECHA, gasta: true, texto: "El barro se cuece sobre su cuerpo y se resquebraja con él (Brecha)." },
  { si: "cargado", con: ["thunder"], pone: GRIETA, texto: "El trueno sacude un cuerpo ya tenso por el rayo (Grieta)." },
  { si: "desequilibrado", con: ["bludgeoning", "force"], pone: BRECHA, texto: "Lo golpean justo cuando pierde el pie: la guardia se abre (Brecha)." }
];
export function sinergiasDe(estados, tipos) {
  const e = new Set(estados ?? []), t = new Set(tipos ?? []);
  return SINERGIAS.filter(s => e.has(s.si) && s.con.some(c => t.has(c)));
}
/** El efecto activo de una ruptura (Brecha, Grieta o Quebrado). Puro. */
export function efectoRuptura(id, origen = null) {
  const c = ESTADOS_RUPTURA[id];
  if (!c) return null;
  return { name: c.name, img: c.img, statuses: [id], changes: (c.changes ?? []).map(x => ({ ...x })), transfer: false, disabled: false,
    duration: { seconds: c.dura, rounds: Math.max(1, Math.round(c.dura / 6)) }, description: `<p>${c.texto}</p>`, origin: origen ?? undefined,
    flags: { [MOD]: { verbe: { estado: id } } } };
}

/**
 * Lo que suman las dotes de quien hace el daño (3.28). Puro.
 * @returns {{ids:string[], textos:string[]}} rupturas extra y por qué.
 */
export function extrasPorDotes({ dotes, estadosBlanco, sinergias, pesada, hayDano }) {
  const d = new Set(dotes ?? []), e = new Set(estadosBlanco ?? []), ids = [], textos = [];
  if (!hayDano) return { ids, textos };
  if (d.has("miedo-que-agrieta") && (e.has("frightened") || e.has("charmed"))) { ids.push(GRIETA); textos.push("Miedo que agrieta: el miedo abre una Grieta."); }
  if (d.has("sangre-que-hiende") && (sinergias ?? []).some(s => s.pone === QUEBRADO)) { ids.push(BRECHA, GRIETA); textos.push("Sangre que hiende: además, una Brecha y una Grieta."); }
  if (d.has("peso-del-huesped") && pesada) { ids.push(BRECHA, BRECHA); textos.push("Peso del huésped: la técnica pesada deja dos Brechas."); }
  return { ids, textos };
}
const dotesDe = actor => actor?.getFlag?.(MOD, "verbe")?.dotes ?? actor?.flags?.[MOD]?.verbe?.dotes ?? [];
const autorDe = options => { const m = options?.originatingMessage; return m?.getAssociatedActor?.() ?? (m?.speaker?.actor ? game.actors?.get(m.speaker.actor) : null); };

function prepararSinergias(actor, damages, options) {
  const tipos = (damages ?? []).filter(d => Number(d.value) > 0).map(d => d.type);
  const hay = sinergiasDe([...(actor?.statuses ?? [])], tipos);
  const autor = autorDe(options);
  const extra = autor ? extrasPorDotes({ dotes: dotesDe(autor), estadosBlanco: [...(actor?.statuses ?? [])], sinergias: hay, pesada: esPesada(options?.originatingMessage?.getAssociatedItem?.()), hayDano: tipos.length > 0 }) : { ids: [], textos: [] };
  if (!hay.length && !extra.ids.length) return;
  options.ecosSinergias = hay.map(s => SINERGIAS.indexOf(s));
  options.ecosExtras = extra;
  if (hay.some(s => s.ignora) && options.ignore !== true) options.ignore = { ...(options.ignore ?? {}), resistance: true };
}
async function aplicarSinergias(actor, options) {
  const idx = options?.ecosSinergias ?? [], extra = options?.ecosExtras ?? { ids: [], textos: [] };
  if ((!idx.length && !extra.ids?.length) || !actor?.isOwner) return;
  const hay = idx.map(i => SINERGIAS[i]).filter(Boolean);
  const datos = [...hay.map(s => s.pone), ...(extra.ids ?? [])].map(id => efectoRuptura(id)).filter(Boolean);
  if (datos.length) await actor.createEmbeddedDocuments("ActiveEffect", datos);
  const gastar = actor.effects.filter(e => hay.some(s => s.gasta && e.statuses?.has?.(s.si))).map(e => e.id);
  if (gastar.length) await actor.deleteEmbeddedDocuments("ActiveEffect", gastar);
  await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), flags: { [MOD]: { sinergia: true } },
    content: `<section class="ecos-sinergia"><h3>${foundry.utils.escapeHTML?.(actor.name) ?? actor.name}</h3>${[...hay.map(s => s.texto), ...(extra.textos ?? [])].map(t => `<p>${t}</p>`).join("")}</section>` });
}

/** Estados de naturaleza que, con «Elemento que muerde», ablandan: cuál ruptura dejan. */
export const MUERDE = { ardiendo: BRECHA, helado: BRECHA, embarrado: BRECHA, desequilibrado: BRECHA, empapado: GRIETA, cargado: GRIETA };
/**
 * Lo que cambia un efecto recién puesto según las dotes de quien lo puso (3.28). Puro.
 * @returns {{cambio:object|null, nuevos:string[]}} `cambio`: actualización del efecto; `nuevos`: rupturas que se suman.
 */
export function ajustePorDotes(statuses, dotes) {
  const s = new Set(statuses ?? []), d = new Set(dotes ?? []), nuevos = [];
  let cambio = null;
  if (s.has(BRECHA) && d.has("filo-que-abre")) cambio = { ...(cambio ?? {}), changes: [{ key: "system.attributes.ac.bonus", mode: 2, value: "-3" }] };
  if (s.has(GRIETA) && d.has("sello-de-la-grieta")) cambio = { ...(cambio ?? {}), changes: [{ key: "system.bonuses.abilities.save", mode: 2, value: "-3" }] };
  if ((s.has(BRECHA) || s.has(GRIETA)) && d.has("huella-abierta")) cambio = { ...(cambio ?? {}), duration: { seconds: 600, rounds: 100 } };
  if (s.has(QUEBRADO) && d.has("latido-que-rompe")) cambio = { ...(cambio ?? {}), duration: { seconds: 12, rounds: 2 } };
  if (d.has("muerde-elemento")) for (const [st, r] of Object.entries(MUERDE)) if (s.has(st)) nuevos.push(r);
  if (d.has("mordida-que-rompe") && (s.has("prone") || s.has("grappled"))) nuevos.push(BRECHA);
  return { cambio, nuevos };
}
const autorEfecto = efecto => {
  try { const o = efecto?.origin ? fromUuidSync(efecto.origin) : null; return o instanceof Actor ? o : (o?.actor ?? o?.parent ?? null); } catch { return null; }
};

/** No más de 3 Brechas ni 3 Grietas: la cuarta no entra (se renueva la más vieja). Y las dotes de quien lo puso. */
async function topeAlCrear(efecto) {
  if (!game.user.isGM || game.users.activeGM?.isSelf === false) return;
  const actor = efecto.parent;
  if (!(actor instanceof Actor)) return;
  const autor = autorEfecto(efecto), dotes = autor && autor !== actor ? dotesDe(autor) : [];
  if (dotes.length) {
    const { cambio, nuevos } = ajustePorDotes([...(efecto.statuses ?? [])], dotes);
    if (cambio) await efecto.update(cambio);
    if (nuevos.length) await actor.createEmbeddedDocuments("ActiveEffect", nuevos.map(id => efectoRuptura(id, efecto.origin)));
  }
  for (const id of [BRECHA, GRIETA]) {
    if (!efecto.statuses?.has?.(id)) continue;
    const todas = actor.effects.filter(e => e.statuses?.has?.(id)).sort((a, b) => (a._stats?.createdTime ?? 0) - (b._stats?.createdTime ?? 0));
    if (todas.length > TOPE_RUPTURA) {
      const sobra = todas.slice(0, todas.length - TOPE_RUPTURA);
      await actor.deleteEmbeddedDocuments("ActiveEffect", sobra.map(e => e.id));
    }
  }
  if (dotes.includes("cadena-de-ruptura") && [BRECHA, GRIETA].some(id => efecto.statuses?.has?.(id) && actor.effects.filter(e => e.statuses?.has?.(id)).length === TOPE_RUPTURA) && !tieneEstado(actor, QUEBRADO))
    await actor.createEmbeddedDocuments("ActiveEffect", [efectoRuptura(QUEBRADO, efecto.origin)]);
  if (efecto.statuses?.has?.(QUEBRADO)) await sincronizarDefensa(actor);
}

if (globalThis.Hooks) {
  Hooks.once("init", () => {
    try {
      game.settings.register(MOD, "defensasCampana", { name: "Defensas de la campaña (VD ½ o más)",
        hint: "Cada criatura de VD ½ o más lleva una defensa altísima: Coraza (CA), Fortaleza (salvaciones) o Cuerpo sordo (resistencia a las armas). «Automáticas» se la pone a las fichas que no tienen una elegida por ti; puedes cambiarla en el panel del Verbe de cada PNJ (pestaña DM).",
        scope: "world", config: true, type: String, default: "auto",
        choices: { auto: "Automáticas en las fichas sin elegir (recomendado)", manual: "Solo las que yo elija", no: "Apagadas" } });
    } catch { /* ya */ }
  });
  Hooks.once("ready", async () => {
    if (!game.user.isGM || game.users.activeGM?.isSelf === false) return;
    import("./acciones-comunes.js").then(m => m.paginaReglas("guiaRuptura", "16 · Ablandar: Coraza, Fortaleza, Brecha y Grieta", guiaRupturaHTML())).catch(err => console.error(`${MOD} | guía de ruptura`, err));
    try {
      if (leer("defensasCampana", "auto") === "no") { for (const a of game.actors) if (efectoActual(a)) await efectoActual(a).delete(); return; }
      if (leer("defensasCampana", "auto") === "auto") {
        const n = await defensasAutomaticas();
        if (n) ChatMessage.create({ whisper: game.users.filter(u => u.isGM).map(u => u.id), speaker: { alias: "Ecos" },
          content: `<p><b>Defensas de la campaña:</b> ${n} ficha${n === 1 ? "" : "s"} de VD ½ o más recibieron su Coraza, Fortaleza o Cuerpo sordo. Puedes cambiar cada una en su panel del Verbe (pestaña DM).</p>` });
      }
    } catch (err) { console.error(`${MOD} | defensas`, err); }
  });
  Hooks.on("createActor", actor => {
    if (!game.user.isGM || game.users.activeGM?.isSelf === false || leer("defensasCampana", "auto") !== "auto" || !esNPC(actor) || actor.getFlag(MOD, "defensa")) return;
    const tipo = defensaSugerida(datosCriatura(actor));
    if (tipo) actor.setFlag(MOD, "defensa", { tipo, n: bonoDefensa(vdDe(actor)), elegida: false }).then(() => sincronizarDefensa(actor)).catch(err => console.error(`${MOD} | defensas`, err));
  });
  Hooks.on("updateActor", (actor, cambios) => {
    if (!game.user.isGM || game.users.activeGM?.isSelf === false) return;
    if (foundry.utils.hasProperty(cambios, `flags.${MOD}.defensa`) || foundry.utils.hasProperty(cambios, `flags.${MOD}.-=defensa`)) sincronizarDefensa(actor).catch(err => console.error(`${MOD} | defensas`, err));
  });
  Hooks.on("createActiveEffect", ef => { topeAlCrear(ef).catch(err => console.error(`${MOD} | ruptura`, err)); });
  Hooks.on("deleteActiveEffect", ef => {
    if (ef.statuses?.has?.(QUEBRADO) && ef.parent instanceof Actor && game.user.isGM && game.users.activeGM?.isSelf !== false) sincronizarDefensa(ef.parent).catch(() => {});
  });
  Hooks.on("dnd5e.preCalculateDamage", (actor, damages, options) => { try { prepararSinergias(actor, damages, options); ignorarResistencias(actor, damages, options); } catch (err) { console.error(`${MOD} | ruptura`, err); } });
  Hooks.on("dnd5e.preApplyDamage", (actor, amount, updates, options) => { aplicarSinergias(actor, options).catch(err => console.error(`${MOD} | sinergias`, err)); });
  sistema.gancho("antesDeAtacar", config => { try { pesadaAtraviesaCoraza(config); dotesAlAtacar(config); } catch (err) { console.error(`${MOD} | pesada`, err); } });
  sistema.gancho("antesDelDano", config => { try { dotesAlDanar(config); } catch (err) { console.error(`${MOD} | dotes de ruptura`, err); } });
  sistema.gancho("alUsar", activity => { avisoPesada(activity).catch(err => console.error(`${MOD} | pesada`, err)); });
}
