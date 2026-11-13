/**
 * 3.73 · Estilos de combate automáticos (pedido del autor, 13-nov-2026: «números solos, reacciones con aviso»; las
 * reacciones gastan la Reacción Verbe, aparte de la de D&D).
 *
 * Lo que es un número se suma solo al tirar y lo dice en el chat:
 *  - Forma que estalla / Pulso que hiere: una vez por turno, +modificador de Verbe a una tirada de daño de la rama.
 *  - Manos que cierran: la cura de Pulso suma 2 + el grado de la técnica.
 *  - Mano de lanzador: +2 al daño de las armas arrojadizas lanzadas y de las técnicas de Hilo.
 *  - Golpe salvaje: una vez por turno, los dados de daño de Cuerpo se tiran dos veces y queda el mayor.
 *  - Presa marcada (acción adicional y 1 Verbe, concentración): una vez por turno +1d6 contra la presa; con El punto
 *    débil, crítico con 19 o 20 contra ella.
 *  - Paso que golpea: tras usar una técnica de Umbral, el siguiente ataque del turno con ventaja.
 *  - Ojo que anticipa: con la Mirada abierta, + competencia a la iniciativa.
 *  - Furia de la bestia: transformado, +2 al daño cuerpo a cuerpo y ventaja en pruebas y salvaciones de Fuerza.
 *  - Aguante de la bestia: una vez por Descanso Largo, transformado, cae a 1 PG en vez de 0.
 *  - La duda que queda / Sello que corta: al fallar la salvación de tu Velo o tu Sello, −1d4 a su próxima salvación o
 *    sin reacciones hasta su siguiente turno.
 * Lo que no se puede leer de la escena (cobertura, alcance largo, ataques de oportunidad, barreras, criaturas del Pacto)
 * sale como recordatorio en el chat.
 * 3.75 · Reacciones con aviso (Reacción Verbe): Leer el golpe (el atacante repite el d20 y queda el menor; si falla, se
 * anula la resolución), Contragolpe (ataque con el arma cuerpo a cuerpo equipada) y Cambio de lugar (2 Verbe: se
 * cambian los lugares y el daño pasa a quien se interpone, con «Deshacer»). Velo que no suelta lo pide el jugador al DM.
 *
 * Revertir: cada efecto que pone trae «Deshacer» en el chat; el daño de más se devuelve con el «Deshacer» de la tarjeta
 * de resolución. A mano: ajuste «Estilos de combate» (automático · solo recordatorio · no); en recordatorio, el chat trae
 * «Aplicar» para que el DM lo ponga cuando quiera, y «A mano» de la resolución fija el daño.
 */
import { botonDeshacer, deshacer as deshacerMensaje } from "./deshacer.js";

const MOD = "ecos-frontera", F = "verbe", AJ = "estilosCombate";
export const MODOS_ESTILOS = { auto: "Automático (con Deshacer)", recordatorio: "Solo recordatorio en el chat (el DM pulsa «Aplicar»)", no: "No" };
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

/** Los estilos que se automatizan y cómo se llaman en la mesa. */
export const ESTILOS = {
  "estilo-forma": { rama: "forma", nombre: "Forma certera", recordatorio: "ignora la cobertura media y la de tres cuartos, y el alcance largo no le da desventaja" },
  "estilo-forma-2": { rama: "forma", nombre: "Forma que estalla", vez: true },
  "estilo-velo": { rama: "velo", nombre: "La duda que queda", vez: true },
  "estilo-velo-2": { rama: "velo", nombre: "Velo que no suelta", recordatorio: "si supera la salvación repetida de tu Velo, puedes gastar tu Reacción Verbe para que la repita (una vez por Velo)" },
  "estilo-cuerpo": { rama: "cuerpo", nombre: "Golpe y paso", recordatorio: "puedes moverte hasta 3 m sin provocar su ataque de oportunidad este turno" },
  "estilo-cuerpo-2": { rama: "cuerpo", nombre: "Golpe salvaje", vez: true },
  "estilo-mirada": { rama: "mirada", nombre: "Leer el golpe" },
  "estilo-mirada-2": { rama: "mirada", nombre: "Ojo que anticipa" },
  "estilo-sello": { rama: "sello", nombre: "Barrera atenta", recordatorio: "tus barreras, planos y muros de Sello tienen el doble de PG y +2 a su CA" },
  "estilo-sello-2": { rama: "sello", nombre: "Sello que corta" },
  "estilo-pacto": { rama: "pacto", nombre: "Codo a codo", recordatorio: "ventaja si una criatura de tu Pacto que no esté Incapacitada está a 1,5 m del objetivo" },
  "estilo-pacto-2": { rama: "pacto", nombre: "Llamada firme", recordatorio: "lo que llamas con tu Pacto tiene el doble de tu nivel en PG máximos de más" },
  "estilo-pulso": { rama: "pulso", nombre: "Manos que cierran" },
  "estilo-pulso-2": { rama: "pulso", nombre: "Pulso que hiere", vez: true },
  "estilo-hilo": { rama: "hilo", nombre: "Mano de lanzador" },
  "estilo-hilo-2": { rama: "hilo", nombre: "Puntería del hilo", recordatorio: "ignora la cobertura media y la de tres cuartos, y el alcance largo no le da desventaja" },
  "estilo-quietud": { rama: "quietud", nombre: "Centinela del mundo", recordatorio: "si impactas con un ataque de oportunidad, su velocidad baja a 0 el resto del turno; Destrabarse no te evita" },
  "estilo-quietud-2": { rama: "quietud", nombre: "Contragolpe" },
  "estilo-rastro": { rama: "rastro", nombre: "Presa marcada", vez: true },
  "estilo-rastro-2": { rama: "rastro", nombre: "El punto débil" },
  "estilo-umbral": { rama: "umbral", nombre: "Paso que golpea" },
  "estilo-umbral-2": { rama: "umbral", nombre: "Cambio de lugar" },
  "estilo-vasija": { rama: "vasija", nombre: "Furia de la bestia" },
  "estilo-vasija-2": { rama: "vasija", nombre: "Aguante de la bestia" }
};

/* ---------------- Reglas puras ---------------- */
/** «Golpe salvaje»: cada término de dados de la fórmula se tira dos veces y queda el mayor. Puro. */
export const dadosDobles = formula => String(formula ?? "").replace(/(\d*)d(\d+)(?![\d{])/g, (m, n, d) => `{${n || 1}d${d},${n || 1}d${d}}kh`);

/**
 * Lo que los estilos suman a una tirada de daño o de curación. Puro.
 * `ctx`: { dotes:Set, rama, grado, curacion, ataque, arrojadiza, presa, mod, usados:Set (estilos ya gastados este turno) }
 * Devuelve { partes:[], doblar:bool, usados:[], notas:[] }.
 */
export function bonoDano(ctx) {
  const d = ctx?.dotes ?? new Set(), usados = ctx?.usados ?? new Set(), r = { partes: [], doblar: false, usados: [], notas: [] };
  const libre = id => d.has(id) && (!ESTILOS[id]?.vez || !usados.has(id));
  const mod = Number(ctx?.mod) || 0;
  if (ctx?.curacion) {
    if (ctx.rama === "pulso" && d.has("estilo-pulso")) { const n = 2 + (Number(ctx.grado) || 0); r.partes.push(String(n)); r.notas.push(`${ESTILOS["estilo-pulso"].nombre}: +${n} a la curación`); }
    return r;
  }
  if (ctx?.rama === "forma" && mod > 0 && libre("estilo-forma-2")) { r.partes.push(String(mod)); r.usados.push("estilo-forma-2"); r.notas.push(`${ESTILOS["estilo-forma-2"].nombre}: +${mod} al daño`); }
  if (ctx?.rama === "pulso" && mod > 0 && libre("estilo-pulso-2")) { r.partes.push(String(mod)); r.usados.push("estilo-pulso-2"); r.notas.push(`${ESTILOS["estilo-pulso-2"].nombre}: +${mod} al daño`); }
  if ((ctx?.rama === "hilo" || ctx?.arrojadiza) && d.has("estilo-hilo")) { r.partes.push("2"); r.notas.push(`${ESTILOS["estilo-hilo"].nombre}: +2 al daño`); }
  if (ctx?.rama === "cuerpo" && libre("estilo-cuerpo-2")) { r.doblar = true; r.usados.push("estilo-cuerpo-2"); r.notas.push(`${ESTILOS["estilo-cuerpo-2"].nombre}: los dados se tiran dos veces y queda el mayor`); }
  if (ctx?.ataque && ctx?.presa && libre("estilo-rastro")) { r.partes.push("1d6"); r.usados.push("estilo-rastro"); r.notas.push(`${ESTILOS["estilo-rastro"].nombre}: +1d6 contra la presa`); }
  return r;
}
/** El número con el que el ataque es crítico. Puro. */
export const umbralCritico = ({ dotes, presa, actual = 20 } = {}) => (presa && dotes?.has?.("estilo-rastro-2") ? Math.min(Number(actual) || 20, 19) : (Number(actual) || 20));
/** ¿Cuenta como transformado (Vasija)? Puro sobre las banderas de sus efectos. */
export const transformado = banderas => (banderas ?? []).some(f => ["manto", "avatar"].includes(f?.grupoModo));
/** Clave de «una vez por turno»: el turno del combate, o nada fuera de combate (entonces vale siempre). Puro. */
export const claveTurno = combate => (combate?.started ? `${combate.id}:${combate.round}:${combate.turn}` : null);

/**
 * 3.75 · Qué reacciones de estilo despierta un ataque (todas gastan la Reacción Verbe). Puro.
 * `blanco`: { dotes:Set, miradaAbierta, reaccionLibre } del atacado; `cuerpoACuerpo`, `distAtacante` (pies), `impacta`;
 * `aliados`: [{ id, dotes:Set, reaccionLibre, dist (pies hasta el atacado), verbe }] del mismo bando que el atacado.
 */
export function reaccionesEstilo({ blanco = {}, cuerpoACuerpo = false, distAtacante = null, impacta = false, aliados = [] } = {}) {
  const out = [];
  const b = blanco.dotes ?? new Set();
  if (impacta && blanco.reaccionLibre && blanco.miradaAbierta && b.has("estilo-mirada")) out.push({ tipo: "leer", reactor: "blanco" });
  if (!impacta && blanco.reaccionLibre && cuerpoACuerpo && Number.isFinite(distAtacante) && distAtacante <= 5 && b.has("estilo-quietud-2")) out.push({ tipo: "contragolpe", reactor: "blanco" });
  if (impacta) for (const a of aliados) if (a?.dotes?.has?.("estilo-umbral-2") && a.reaccionLibre && Number(a.dist) <= 30 && (Number(a.verbe) || 0) >= 2) out.push({ tipo: "cambio", reactor: a.id });
  return out;
}
/** Leer el golpe: el atacante repite el d20 y se queda con el menor. Puro. */
export function leerElGolpe({ total, natural, nuevo, ca }) {
  const otro = Number(total) - (Number(natural) || 0) + Number(nuevo);
  const final = Math.min(Number(total), otro), nat = final === Number(total) ? Number(natural) : Number(nuevo);
  const impacta = nat === 20 ? true : nat === 1 ? false : final >= Number(ca);
  return { otro, final, natural: nat, impacta };
}

/* ---------------- Foundry ---------------- */
const modo = () => { try { return game.settings.get(MOD, AJ); } catch { return "auto"; } };
const metaDe = item => item?.flags?.[MOD]?.[F] ?? null;
let V = null; // verbe.js, cargado tarde para no crear un ciclo de importación.
const cargarV = async () => (V ??= await import("./verbe.js"));
const dotesDe = actor => {
  if (!V || !actor) return new Set();
  return new Set(Object.keys(ESTILOS).filter(id => { try { return V.estiloActivo(actor, id); } catch { return false; } }));
};
const modVerbe = actor => { const car = actor?.getFlag?.(MOD, F)?.car; return Number(actor?.system?.abilities?.[car]?.mod) || 0; };
const turnos = new Map(); // `${actor.uuid}:${estilo}` → clave del turno en que se gastó
const usadosDe = actor => { const k = claveTurno(game.combat); return new Set(Object.keys(ESTILOS).filter(id => k && turnos.get(`${actor.uuid}:${id}`) === k)); };
const gastar = (actor, ids) => { const k = claveTurno(game.combat); if (k) for (const id of ids) turnos.set(`${actor.uuid}:${id}`, k); };
const objetivos = () => [...(game.user?.targets ?? [])].map(t => t.actor).filter(Boolean);
const esPresa = (lanzador, objetivo) => !!objetivo?.effects?.some(e => !e.disabled && e.getFlag(MOD, "estilos")?.presa === lanzador.uuid);
const ejecutor = actor => (game.users.activeGM ? game.users.activeGM.isSelf : !!actor?.isOwner);
const nota = (actor, html, { deshacer = null, aplicar = null } = {}) => ChatMessage.create({
  speaker: ChatMessage.getSpeaker({ actor }),
  content: `<div class="ecos-card ecos-estilo"><p>✦ ${html}</p>${deshacer ? botonDeshacer() : ""}${aplicar ? `<p><button type="button" data-ecos-estilo-aplicar><i class="fa-solid fa-hand"></i> Aplicar</button></p>` : ""}</div>`,
  flags: { [MOD]: { ...(deshacer ? { deshacer } : {}), ...(aplicar ? { estiloAplicar: aplicar } : {}) } }
}).catch(err => console.error(`${MOD} | estilos`, err));

/** Efectos que pone un estilo (datos de Foundry). */
const EFECTOS = {
  duda: () => ({ name: "La duda que queda", img: "icons/svg/daze.svg", changes: [{ key: "system.bonuses.abilities.save", mode: 2, value: "-1d4" }], duration: { rounds: 1 }, flags: { [MOD]: { estilos: { duda: true } } }, description: "<p>−1d4 a su próxima salvación (estilo de Velo).</p>" }),
  sinReacciones: () => ({ name: "Sello que corta", img: "icons/svg/padlock.svg", changes: [], duration: { rounds: 1 }, flags: { [MOD]: { estilos: { sinReacciones: true } } }, description: "<p>No puede usar reacciones hasta el inicio de su siguiente turno (estilo de Sello).</p>" }),
  pasoGolpe: () => ({ name: "Paso que golpea", img: "icons/svg/wingfoot.svg", changes: [], duration: { rounds: 1 }, flags: { [MOD]: { estilos: { pasoGolpe: true } } }, description: "<p>Tu siguiente ataque antes del final del turno tiene ventaja (estilo de Umbral).</p>" }),
  ojo: () => ({ name: "Ojo que anticipa", img: "icons/svg/eye.svg", changes: [{ key: "system.attributes.init.bonus", mode: 2, value: "@prof" }], flags: { [MOD]: { estilos: { auto: "estilo-mirada-2" } } }, description: "<p>Con la Mirada abierta: + competencia a la iniciativa y no puedes quedar Sorprendido.</p>" }),
  furia: () => ({ name: "Furia de la bestia", img: "icons/svg/terror.svg", changes: [{ key: "system.bonuses.mwak.damage", mode: 2, value: "+2" }, { key: "system.abilities.str.check.roll.mode", mode: 2, value: "1" }, { key: "system.abilities.str.save.roll.mode", mode: 2, value: "1" }], flags: { [MOD]: { estilos: { auto: "estilo-vasija" } } }, description: "<p>Transformado: +2 al daño cuerpo a cuerpo y ventaja en pruebas y salvaciones de Fuerza.</p>" }),
  presa: (lanzador, horas = 1) => ({ name: `Presa marcada (${lanzador.name})`, img: "icons/svg/target.svg", changes: [], duration: { seconds: 3600 * horas }, flags: { [MOD]: { estilos: { presa: lanzador.uuid } } }, description: `<p>${esc(lanzador.name)} la marcó: una vez por turno +1d6 a sus ataques contra ella; ventaja en Percepción y Supervivencia para encontrarla.</p>` })
};

/**
 * Al fallar una salvación contra una técnica de Velo o de Sello: pone lo del estilo en el objetivo y devuelve los
 * efectos creados (para el «Deshacer» de quien llama). Lo llaman la resolución automática y la Defensa a pedido.
 */
export async function estilosAlFallar({ lanzador, objetivo, activity }) {
  try {
    if (modo() === "no" || !lanzador || !objetivo || !objetivo.isOwner) return [];
    await cargarV();
    const meta = metaDe(activity?.item), d = dotesDe(lanzador), creados = [];
    if (!meta?.rama) return [];
    const datos = [];
    if (meta.rama === "velo" && d.has("estilo-velo") && !usadosDe(lanzador).has("estilo-velo")) { datos.push(EFECTOS.duda()); gastar(lanzador, ["estilo-velo"]); }
    if (meta.rama === "sello" && d.has("estilo-sello-2")) datos.push(EFECTOS.sinReacciones());
    if (!datos.length) return [];
    if (modo() === "recordatorio") { await nota(lanzador, `<b>${datos.map(x => esc(x.name)).join(" y ")}</b> sobre ${esc(objetivo.name)}: ${datos.map(x => x.description.replace(/<[^>]+>/g, "")).join(" ")}`, { aplicar: { uuid: objetivo.uuid, efectos: datos } }); return []; }
    creados.push(...await objetivo.createEmbeddedDocuments("ActiveEffect", datos));
    return creados;
  } catch (err) { console.error(`${MOD} | estilos`, err); return []; }
}

/** «Presa marcada» como rasgo usable en la hoja de quien tiene el estilo de Rastro. */
function datosPresa() {
  const id = foundry.utils.randomID();
  return { name: "Presa marcada", type: "feat", img: "icons/svg/target.svg",
    system: { description: { value: "<p>Acción adicional y 1 Verbe: marcas a una criatura que ves durante 1 hora (Concentración). Una vez por turno, tus ataques contra ella hacen +1d6 de daño, y tienes ventaja en Percepción y Supervivencia para encontrarla. Estilo de combate de Rastro.</p>" },
      activities: { [id]: { _id: id, type: "utility", name: "Marcar", activation: { type: "bonus", value: 1 }, duration: { value: "1", units: "hour", concentration: true }, range: { units: "spec", special: "una criatura que ves" }, target: { affects: { type: "creature", count: "1" } } } } },
    flags: { [MOD]: { estiloAccion: "presa-marcada" } } };
}
async function asegurarPresa(actor) {
  if (!actor || actor.type !== "character" || !ejecutor(actor)) return;
  await cargarV();
  const tiene = dotesDe(actor).has("estilo-rastro"), item = actor.items.find(i => i.getFlag(MOD, "estiloAccion") === "presa-marcada");
  if (tiene && !item) await actor.createEmbeddedDocuments("Item", [datosPresa()]);
  else if (!tiene && item) await item.delete();
}
/** Efecto automático mientras se cumpla una condición (Mirada abierta, transformación). */
async function alternar(actor, clave, quiere, datos) {
  if (!ejecutor(actor)) return;
  const ya = actor.effects.find(e => e.getFlag(MOD, "estilos")?.auto === clave);
  if (quiere && !ya && modo() === "auto") await actor.createEmbeddedDocuments("ActiveEffect", [datos()]);
  else if (!quiere && ya) await ya.delete();
}
async function revisarAutomaticos(actor) {
  if (!actor || modo() === "no") return;
  await cargarV();
  const d = dotesDe(actor), banderas = actor.effects.filter(e => !e.disabled).map(e => e.getFlag(MOD, F)).filter(Boolean);
  await alternar(actor, "estilo-mirada-2", d.has("estilo-mirada-2") && banderas.some(f => f.ojo), EFECTOS.ojo);
  await alternar(actor, "estilo-vasija", d.has("estilo-vasija") && transformado(banderas), EFECTOS.furia);
}

async function marcarPresa({ lanzador, objetivo, item }) {
  const a = await fromUuid(lanzador), t = await fromUuid(objetivo); const blanco = t?.actor ?? t;
  if (!a || !blanco) return;
  const [ef] = await blanco.createEmbeddedDocuments("ActiveEffect", [EFECTOS.presa(a)]);
  const conc = a.effects.find(e => e.statuses?.has?.("concentrating") && e.getFlag("dnd5e", "item")?.id === item);
  if (conc?.addDependent) await conc.addDependent(ef).catch(() => null);
  await nota(a, `<b>Presa marcada</b>: ${esc(a.name)} marca a ${esc(blanco.name)} (1 Verbe, concentración).`, { deshacer: { borrar: [ef.uuid], sumar: [{ uuid: a.uuid, sumar: { [`flags.${MOD}.${F}.valor`]: 1 } }] } });
}

/* ---------- 3.75 · Reacciones de estilo con aviso (gastan la Reacción Verbe) ---------- */
const REACCION = {
  leer: { estilo: "estilo-mirada", texto: "el atacante repite el d20 y se queda con el menor" },
  contragolpe: { estilo: "estilo-quietud-2", texto: "le haces un ataque cuerpo a cuerpo" },
  cambio: { estilo: "estilo-umbral-2", texto: "te cambias de lugar con tu aliado (2 Verbe) y el ataque te alcanza a ti" }
};
const reaccionLibre = actor => { try { return game.modules.get(MOD)?.api?.verbe?.turnoVerbe?.(actor)?.reaccionLibre ?? true; } catch { return true; } };
const enCombateActor = actor => !!game.combat?.started && game.combat.combatants.some(c => c.actor?.uuid === actor?.uuid || c.actorId === actor?.id);
const piesEntre = (a, b) => { try { return Math.round(canvas.grid.measurePath([a.center, b.center]).distance); } catch { return null; } };
const tokenDe = actor => actor?.getActiveTokens?.()[0] ?? null;
const duenos = actor => [...new Set([...game.users.filter(u => u.isGM).map(u => u.id), ...game.users.filter(u => !u.isGM && actor.testUserPermission(u, "OWNER")).map(u => u.id)])];
async function avisarReaccionesEstilo(atacante, act, roll, blancos) {
  if (modo() === "no") return;
  await cargarV();
  const { acierta, naturalDe } = await import("./resolucion-auto.js");
  const tokA = tokenDe(atacante), cuerpo = act?.attack?.type?.value === "melee" || act?.actionType === "mwak" || act?.actionType === "msak";
  const nat = naturalDe(roll), total = Number(roll?.total);
  for (const t of blancos) {
    const b = t.actor; if (!b) continue;
    const ca = Number(b.system?.attributes?.ac?.value) || 10, { impacta } = acierta({ total, natural: nat, ca });
    const banderas = b.effects.filter(e => !e.disabled).map(e => e.getFlag(MOD, F)).filter(Boolean);
    const aliados = (canvas.tokens?.placeables ?? []).filter(x => x.actor && x !== t && x.actor !== atacante && x.document.disposition === t.document.disposition)
      .map(x => ({ id: x.actor.uuid, tok: x, dotes: dotesDe(x.actor), reaccionLibre: reaccionLibre(x.actor), dist: piesEntre(x, t), verbe: Number(x.actor.getFlag(MOD, F)?.valor) || 0 }));
    const lista = reaccionesEstilo({ blanco: { dotes: dotesDe(b), miradaAbierta: banderas.some(f => f.ojo), reaccionLibre: reaccionLibre(b) }, cuerpoACuerpo: cuerpo, distAtacante: tokA ? piesEntre(tokA, t) : null, impacta, aliados });
    for (const r of lista) {
      const reactor = r.reactor === "blanco" ? b : aliados.find(a => a.id === r.reactor)?.tok?.actor; if (!reactor) continue;
      const nombre = ESTILOS[REACCION[r.tipo].estilo].nombre;
      await ChatMessage.create({ whisper: duenos(reactor), speaker: { alias: `Reacción Verbe · ${reactor.name}` },
        content: `<div class="ecos-card ecos-estilo"><p>✦ <b>${esc(nombre)}</b>: ${esc(atacante.name)} ataca a ${esc(b.name)} (${impacta ? "impacta" : "falla"}). Con tu Reacción Verbe ${esc(REACCION[r.tipo].texto)}.</p><p><button type="button" data-ecos-estilo-reaccion="${r.tipo}"><i class="fa-solid fa-bolt"></i> Usar</button></p></div>`,
        flags: { [MOD]: { estiloReaccion: { tipo: r.tipo, reactor: reactor.uuid, atacante: atacante.uuid, blanco: b.uuid, blancoToken: t.document.uuid, actividad: act?.uuid, total, natural: nat, ca, hasta: Date.now() + 30000 } } } });
    }
  }
}
/** La tarjeta de resolución de ese ataque contra ese objetivo (la más reciente sin deshacer). */
const tarjetaDe = (actividad, uuid) => [...game.messages.contents].reverse().find(m => { const r = m.getFlag(MOD, "resolucionAuto"); return r?.actividad === actividad && (r.uuids ?? []).includes(uuid) && !m.getFlag(MOD, "deshecho"); });
async function gastarReaccion(actor, verbe = 0) {
  const e = actor.getFlag(MOD, F) ?? {}, u = {};
  if (enCombateActor(actor)) u[`flags.${MOD}.${F}.reaccionUsada`] = true;
  if (verbe) u[`flags.${MOD}.${F}.valor`] = (Number(e.valor) || 0) - verbe;
  if (Object.keys(u).length) await actor.update(u);
}
async function usarReaccionEstilo(msg) {
  const d = msg.getFlag(MOD, "estiloReaccion"); if (!d) return;
  if (Date.now() > (d.hasta ?? 0)) return ui.notifications.warn("Ese momento ya pasó: la reacción caducó.");
  if (msg.getFlag(MOD, "estiloReaccionUsada")) return ui.notifications.warn("Esa reacción ya se usó.");
  const reactor = await fromUuid(d.reactor); if (!reactor?.isOwner) return ui.notifications.warn("Solo su dueño o el DM la puede usar.");
  if (!reaccionLibre(reactor)) return ui.notifications.warn(`${reactor.name} ya gastó su Reacción Verbe.`);
  await msg.update({ [`flags.${MOD}.estiloReaccionUsada`]: true });
  if (d.tipo === "leer") {
    await gastarReaccion(reactor);
    const r = await new Roll("1d20").evaluate();
    const x = leerElGolpe({ total: d.total, natural: d.natural, nuevo: r.total, ca: d.ca });
    await nota(reactor, `<b>${ESTILOS["estilo-mirada"].nombre}</b>: el atacante repite el d20 (${r.total}) y se queda con el menor: ${x.final} contra CA ${d.ca} → ${x.impacta ? "impacta igual" : "falla"}.${x.impacta ? "" : " El golpe se anula."}`);
    if (!x.impacta) return pedirAlDM({ estilos: "anular", actividad: d.actividad, uuid: d.blanco });
  }
  if (d.tipo === "contragolpe") {
    await gastarReaccion(reactor);
    const atacante = await fromUuid(d.atacante), tokA = tokenDe(atacante);
    const arma = reactor.items.find(i => i.type === "weapon" && i.system?.equipped && [...(i.system.activities?.values?.() ?? [])].some(a => a.type === "attack" && a.attack?.type?.value === "melee"));
    if (!arma) return nota(reactor, `<b>${ESTILOS["estilo-quietud-2"].nombre}</b>: no tiene un arma cuerpo a cuerpo equipada; el DM resuelve el ataque.`);
    try { tokA?.setTarget(true, { releaseOthers: true, groupSelection: false }); } catch { /* sin lienzo */ }
    await nota(reactor, `<b>${ESTILOS["estilo-quietud-2"].nombre}</b>: ${esc(reactor.name)} contraataca a ${esc(atacante?.name)} con ${esc(arma.name)}.`);
    const act = [...arma.system.activities.values()].find(a => a.type === "attack");
    return act?.use();
  }
  if (d.tipo === "cambio") {
    if ((Number(reactor.getFlag(MOD, F)?.valor) || 0) < 2) return ui.notifications.warn("Cambio de lugar pide 2 Verbe.");
    await gastarReaccion(reactor, 2);
    return pedirAlDM({ estilos: "cambio", actividad: d.actividad, uuid: d.blanco, blancoToken: d.blancoToken, reactor: reactor.uuid });
  }
}
function pedirAlDM(datos) {
  if (game.users.activeGM?.isSelf) return alDM(datos);
  if (!game.users.activeGM) return ui.notifications.warn("Hace falta un DM conectado para resolverlo.");
  game.socket.emit(`module.${MOD}`, datos);
}
/** Lado del DM: anular el golpe (Leer el golpe) o pasárselo a quien se interpone (Cambio de lugar). */
async function alDM(d) {
  const tarjeta = tarjetaDe(d.actividad, d.uuid);
  if (d.estilos === "anular") {
    if (tarjeta) await deshacerMensaje(tarjeta);
    return;
  }
  if (d.estilos === "cambio") {
    const reactor = await fromUuid(d.reactor), tokR = tokenDe(reactor), tokB = (await fromUuid(d.blancoToken))?.object ?? null;
    const aliado = await fromUuid(d.uuid); if (!reactor || !aliado) return;
    const cambios = [];
    if (tokR && tokB) {
      const pr = { x: tokR.document.x, y: tokR.document.y }, pb = { x: tokB.document.x, y: tokB.document.y };
      await tokR.document.update(pb); await tokB.document.update(pr);
      cambios.push({ uuid: tokR.document.uuid, antes: pr }, { uuid: tokB.document.uuid, antes: pb });
    }
    const dato = (tarjeta?.getFlag(MOD, "resolucionAuto")?.danos ?? []).find(x => x.uuid === d.uuid);
    if (tarjeta) await deshacerMensaje(tarjeta);
    const sumar = [];
    if (dato?.danos?.length) {
      const antes = { v: Number(reactor.system?.attributes?.hp?.value) || 0, t: Number(reactor.system?.attributes?.hp?.temp) || 0 };
      await reactor.applyDamage(dato.danos.map(x => ({ ...x, properties: new Set(x.properties ?? []) })), { multiplier: dato.multiplicador ?? 1 });
      const v = Number(reactor.system?.attributes?.hp?.value) || 0, t = Number(reactor.system?.attributes?.hp?.temp) || 0;
      sumar.push({ uuid: reactor.uuid, sumar: { "system.attributes.hp.value": antes.v - v, "system.attributes.hp.temp": antes.t - t } });
    }
    sumar.push({ uuid: reactor.uuid, sumar: { [`flags.${MOD}.${F}.valor`]: 2 } });
    await nota(reactor, `<b>${ESTILOS["estilo-umbral-2"].nombre}</b>: ${esc(reactor.name)} se cambia de lugar con ${esc(aliado.name)} y el ataque lo alcanza a él (2 Verbe y su Reacción Verbe). Para volver atrás: «Deshacer» devuelve los lugares, los PG y el Verbe; el golpe al aliado se repone con «A mano».`,
      { deshacer: { cambios, sumar } });
  }
}

if (globalThis.Hooks) {
  Hooks.once("init", () => {
    game.settings.register(MOD, AJ, { name: "Estilos de combate", hint: "Las dotes de estilo de cada rama suman lo suyo solas al tirar (daño, curación, crítico, ventaja) y ponen sus efectos, con Deshacer en el chat. En «Solo recordatorio» lo dicen en el chat y el DM pulsa «Aplicar».",
      scope: "world", config: true, type: String, choices: MODOS_ESTILOS, default: "auto" });
  });
  Hooks.once("ready", () => {
    cargarV().then(() => { if (game.user.isGM) for (const a of game.actors.filter(x => x.type === "character")) asegurarPresa(a).catch(() => null); }).catch(() => null);
    game.socket.on(`module.${MOD}`, d => {
      if (!d?.estilos || !game.users.activeGM?.isSelf) return;
      (d.estilos === "presa" ? marcarPresa(d) : alDM(d)).catch(err => console.error(`${MOD} | estilos`, err));
    });
  });
  // Daño y curación: los números del estilo, en el cliente de quien tira.
  Hooks.on("dnd5e.preRollDamageV2", config => {
    try {
      if (modo() === "no" || !V) return;
      const act = config?.subject, actor = act?.actor; if (!actor) return;
      const d = dotesDe(actor); if (!d.size) return;
      const meta = metaDe(act.item), arma = act.item?.type === "weapon";
      const props = act.item?.system?.properties; const thr = props?.has?.("thr") || (Array.isArray(props) && props.includes("thr"));
      const presa = objetivos().some(o => esPresa(actor, o));
      const r = bonoDano({ dotes: d, rama: meta?.rama, grado: meta?.g, curacion: act.type === "heal" || config?.rolls?.[0]?.options?.type === "healing",
        ataque: act.type === "attack", arrojadiza: arma && thr && (config?.attackMode === "thrown" || config?.attackMode === "thrownOffhand"), presa, mod: modVerbe(actor), usados: usadosDe(actor) });
      if (!r.notas.length) return;
      if (modo() === "recordatorio") { nota(actor, r.notas.map(esc).join(" · ")); return; }
      const p = config.rolls?.[0]?.parts; if (!p) return;
      if (r.doblar && p.length) p[0] = dadosDobles(p[0]);
      p.push(...r.partes); gastar(actor, r.usados);
      nota(actor, r.notas.map(esc).join(" · "));
    } catch (err) { console.error(`${MOD} | estilos`, err); }
  });
  // Ataque: crítico con 19 contra la presa; ventaja tras el paso de Umbral; recordatorios de cobertura y Pacto.
  Hooks.on("dnd5e.preRollAttackV2", config => {
    try {
      if (modo() === "no" || !V) return;
      const act = config?.subject, actor = act?.actor; if (!actor) return;
      const d = dotesDe(actor); if (!d.size) return;
      const meta = metaDe(act.item), notas = [];
      const presa = objetivos().some(o => esPresa(actor, o));
      const roll = config.rolls?.[0];
      if (presa && d.has("estilo-rastro-2") && roll && modo() === "auto") { roll.options ??= {}; roll.options.criticalSuccess = umbralCritico({ dotes: d, presa, actual: roll.options.criticalSuccess }); notas.push(`${ESTILOS["estilo-rastro-2"].nombre}: crítico con 19 o 20 contra la presa`); }
      const paso = actor.effects.find(e => e.getFlag(MOD, "estilos")?.pasoGolpe);
      if (paso && modo() === "auto") { config.advantage = true; notas.push(`${ESTILOS["estilo-umbral"].nombre}: ventaja`); setTimeout(() => paso.delete().catch(() => null), 500); }
      // Los recordatorios, una vez por turno cada uno (fuera de combate, siempre).
      for (const id of ["estilo-forma", "estilo-hilo-2", "estilo-pacto"]) {
        if (!d.has(id) || !(ESTILOS[id].rama === meta?.rama || (id === "estilo-hilo-2" && act.item?.type === "weapon") || id === "estilo-pacto")) continue;
        const k = claveTurno(game.combat), clave = `${actor.uuid}:rec:${id}`;
        if (k && turnos.get(clave) === k) continue;
        if (k) turnos.set(clave, k);
        notas.push(`${ESTILOS[id].nombre}: ${ESTILOS[id].recordatorio}`);
      }
      if (notas.length) nota(actor, notas.map(esc).join(" · "));
    } catch (err) { console.error(`${MOD} | estilos`, err); }
  });
  // Al usar: Paso que golpea (Umbral), recordatorio de Golpe y paso (Cuerpo) y la Presa marcada.
  Hooks.on("dnd5e.postUseActivity", (activity) => {
    (async () => {
      if (modo() === "no") return;
      await cargarV();
      const actor = activity?.actor, item = activity?.item; if (!actor || !item) return;
      if (item.getFlag(MOD, "estiloAccion") === "presa-marcada") {
        const t = [...(game.user.targets ?? [])][0];
        if (!t) return ui.notifications.warn("Presa marcada: marca primero a la criatura (T).");
        const e = actor.getFlag(MOD, F) ?? {};
        await actor.update({ [`flags.${MOD}.${F}.valor`]: (Number(e.valor) || 0) - 1 });
        const d = { estilos: "presa", lanzador: actor.uuid, objetivo: t.document.uuid, item: item.id };
        if (game.users.activeGM?.isSelf) return marcarPresa(d);
        if (!game.users.activeGM) return ui.notifications.warn("Presa marcada: hace falta un DM conectado para marcar a la criatura.");
        return game.socket.emit(`module.${MOD}`, d);
      }
      const meta = metaDe(item); if (!meta?.rama || !actor.isOwner) return;
      const d = dotesDe(actor);
      if (meta.rama === "umbral" && d.has("estilo-umbral") && !actor.effects.some(e => e.getFlag(MOD, "estilos")?.pasoGolpe)) {
        if (modo() === "recordatorio") return nota(actor, `<b>${ESTILOS["estilo-umbral"].nombre}</b>: tu siguiente ataque este turno tiene ventaja.`, { aplicar: { uuid: actor.uuid, efectos: [EFECTOS.pasoGolpe()] } });
        const [ef] = await actor.createEmbeddedDocuments("ActiveEffect", [EFECTOS.pasoGolpe()]);
        nota(actor, `<b>${ESTILOS["estilo-umbral"].nombre}</b>: tu siguiente ataque este turno tiene ventaja.`, { deshacer: { borrar: [ef.uuid] } });
      }
      if (meta.rama === "cuerpo" && d.has("estilo-cuerpo") && activity.type === "attack") nota(actor, `<b>${ESTILOS["estilo-cuerpo"].nombre}</b>: si impactaste, ${ESTILOS["estilo-cuerpo"].recordatorio}.`);
    })().catch(err => console.error(`${MOD} | estilos`, err));
  });
  // Efectos que siguen a una condición: Mirada abierta (Ojo que anticipa) y transformación (Furia de la bestia).
  const alCambiarEfecto = ef => { const a = ef?.parent; if (a instanceof Actor && ef.getFlag?.(MOD, F)) revisarAutomaticos(a).catch(err => console.error(`${MOD} | estilos`, err)); };
  Hooks.on("createActiveEffect", alCambiarEfecto);
  Hooks.on("deleteActiveEffect", alCambiarEfecto);
  Hooks.on("updateActiveEffect", alCambiarEfecto);
  // La dote recién tomada (o quitada): la Presa marcada aparece o se va de la hoja.
  Hooks.on("updateActor", (actor, cambios) => { if (foundry.utils.hasProperty(cambios, `flags.${MOD}.${F}`)) asegurarPresa(actor).catch(() => null); });
  // La duda que queda se va con la siguiente salvación.
  Hooks.on("dnd5e.rollSavingThrow", (rolls, data) => {
    const actor = data?.subject ?? rolls?.[0]?.data?.actor; const a = actor instanceof Actor ? actor : null;
    if (!a?.isOwner || !ejecutor(a)) return;
    for (const e of a.effects.filter(x => x.getFlag(MOD, "estilos")?.duda)) setTimeout(() => e.delete().catch(() => null), 300);
  });
  // Aguante de la bestia: transformado, una vez por Descanso Largo, queda a 1 PG en vez de 0.
  Hooks.on("preUpdateActor", (actor, cambios) => {
    try {
      if (modo() !== "auto" || !V) return;
      const nuevo = foundry.utils.getProperty(cambios, "system.attributes.hp.value");
      if (nuevo === undefined || Number(nuevo) > 0 || Number(actor.system?.attributes?.hp?.value) <= 0) return;
      if (actor.getFlag(MOD, "estilos")?.aguante || !dotesDe(actor).has("estilo-vasija-2")) return;
      if (!transformado(actor.effects.filter(e => !e.disabled).map(e => e.getFlag(MOD, F)).filter(Boolean))) return;
      foundry.utils.setProperty(cambios, "system.attributes.hp.value", 1);
      foundry.utils.setProperty(cambios, `flags.${MOD}.estilos.aguante`, true);
      nota(actor, `<b>${ESTILOS["estilo-vasija-2"].nombre}</b>: ${esc(actor.name)} iba a caer a 0 PG y queda a 1 (una vez por Descanso Largo).`,
        { deshacer: { cambios: [{ uuid: actor.uuid, antes: { "system.attributes.hp.value": 0, [`flags.${MOD}.estilos.aguante`]: false } }] } });
    } catch (err) { console.error(`${MOD} | estilos`, err); }
  });
  Hooks.on("dnd5e.restCompleted", (actor, result) => { if ((result?.longRest ?? result?.type === "long") && actor?.isOwner && actor.getFlag(MOD, "estilos")?.aguante) actor.setFlag(MOD, "estilos.aguante", false).catch(() => null); });
  // 3.75: al tirar un ataque, aviso a quien puede reaccionar con su estilo (en el cliente de quien ataca).
  Hooks.on("dnd5e.rollAttackV2", (rolls, datos) => {
    const act = datos?.subject, atacante = act?.actor;
    if (!atacante?.isOwner || (game.user.isGM && atacante.hasPlayerOwner && atacante.activeOwner && !atacante.activeOwner.isSelf)) return;
    const blancos = [...(game.user.targets ?? [])].filter(t => t.actor && t.actor !== atacante);
    if (blancos.length) avisarReaccionesEstilo(atacante, act, rolls?.[0], blancos).catch(err => console.error(`${MOD} | estilos`, err));
  });
  Hooks.on("renderChatMessageHTML", (msg, html) => {
    const b = html.querySelector?.("[data-ecos-estilo-reaccion]"); if (!b) return;
    if (msg.getFlag(MOD, "estiloReaccionUsada")) return b.closest("p")?.remove();
    b.addEventListener("click", ev => { ev.preventDefault(); usarReaccionEstilo(msg).catch(err => console.error(`${MOD} | estilos`, err)); });
  });
  // «Aplicar» del modo recordatorio (solo el DM).
  Hooks.on("renderChatMessageHTML", (msg, html) => {
    const b = html.querySelector?.("[data-ecos-estilo-aplicar]"); if (!b) return;
    if (!game.user.isGM || msg.getFlag(MOD, "estiloAplicado")) return b.closest("p")?.remove();
    b.addEventListener("click", async ev => {
      ev.preventDefault();
      const a = msg.getFlag(MOD, "estiloAplicar"), doc = await fromUuid(a?.uuid).catch(() => null); if (!doc) return;
      const creados = await doc.createEmbeddedDocuments("ActiveEffect", a.efectos ?? []);
      await msg.update({ content: `${msg.content}<p><i>Aplicado por el DM.</i></p>${botonDeshacer()}`, [`flags.${MOD}.estiloAplicado`]: true, [`flags.${MOD}.deshacer`]: { borrar: creados.map(e => e.uuid) } });
    });
  });
}
