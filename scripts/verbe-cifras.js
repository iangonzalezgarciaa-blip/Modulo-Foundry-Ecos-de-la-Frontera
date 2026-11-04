/**
 * «Así se resuelve» (3.10, pedido del autor): lo que hace cada técnica con los números reales de la ficha.
 * Lee la actividad de dnd5e (5.x y 6.x): ataque, salvación y su CD, daño, curación, duración, concentración y estados
 * que deja. Reglas puras: recibe objetos y devuelve datos y frases; el HTML lo arma verbe-ui.js.
 */
const lista = x => (x == null ? [] : Array.isArray(x) ? x : typeof x === "string" ? [x]
  : (x.contents || typeof x.values === "function" || typeof x[Symbol.iterator] === "function") ? Array.from(x?.contents ?? x.values?.() ?? x) : Object.values(x));
const ABREV = { str: "Fuerza", dex: "Destreza", con: "Constitución", int: "Inteligencia", wis: "Sabiduría", cha: "Carisma" };
const TIPOS_DANO = { acid: "ácido", bludgeoning: "contundente", cold: "frío", fire: "fuego", force: "fuerza", lightning: "relámpago",
  necrotic: "necrótico", piercing: "perforante", poison: "veneno", psychic: "psíquico", radiant: "radiante", slashing: "cortante",
  thunder: "trueno", healing: "curación", temphp: "PG temporales" };
const ESTADOS_ES = { prone: "Derribado", grappled: "Agarrado", restrained: "Apresado", stunned: "Aturdido", paralyzed: "Paralizado",
  blinded: "Cegado", deafened: "Ensordecido", frightened: "Asustado", charmed: "Hechizado", poisoned: "Envenenado", incapacitated: "Incapacitado",
  unconscious: "Inconsciente", invisible: "Invisible", petrified: "Petrificado", burning: "Ardiendo", bleeding: "Sangrando", slowed: "Ralentizado" };
const TEXTOS_ES = {
  prone: "Se mueve arrastrándose. Los ataques cuerpo a cuerpo contra él tienen ventaja; los de lejos, desventaja. Levantarse cuesta la mitad de su velocidad.",
  grappled: "Su velocidad es 0 hasta que se suelte (prueba de Atletismo o Acrobacias contra quien lo sujeta).",
  restrained: "Velocidad 0. Sus ataques y sus salvaciones de Destreza tienen desventaja; los ataques contra él, ventaja.",
  stunned: "No puede actuar ni reaccionar y apenas habla. Falla las salvaciones de Fuerza y Destreza; los ataques contra él tienen ventaja.",
  paralyzed: "No puede moverse ni actuar. Falla Fuerza y Destreza; un golpe a 1,5 m que lo alcance es crítico.",
  blinded: "No ve. Sus ataques tienen desventaja y los ataques contra él, ventaja.",
  frightened: "Desventaja en pruebas y ataques mientras vea la fuente del miedo; no puede acercarse a ella.",
  charmed: "No puede atacar a quien lo hechizó, que tiene ventaja en las pruebas sociales contra él.",
  poisoned: "Desventaja en ataques y pruebas de característica.",
  incapacitated: "No puede tomar acciones, acciones adicionales ni reacciones.",
  deafened: "No oye; falla lo que dependa del oído.",
  unconscious: "Cae Derribado e Incapacitado; no se entera de nada. Un golpe a 1,5 m que lo alcance es crítico.",
  invisible: "No se le ve sin magia o sentidos especiales. Sus ataques tienen ventaja y los ataques contra él, desventaja."
};
const nombreCaracteristica = k => globalThis.CONFIG?.DND5E?.abilities?.[k]?.label ?? ABREV[k] ?? k;
const nombreDano = k => TIPOS_DANO[k] ?? globalThis.CONFIG?.DND5E?.damageTypes?.[k]?.label ?? k ?? "";

/** Clasificación para los filtros del panel. */
export const TIPOS_USO = [["todas", "Todas"], ["fav", "★ Favoritas"], ["ataque", "Ataque"], ["salvacion", "Salvación"],
  ["curacion", "Curación"], ["apoyo", "Apoyo y utilidad"], ["defensa", "Defensa"], ["cargada", "Cargadas"]];
export function tipoUso(actividad, { defensa = false, cargada = false } = {}) {
  if (defensa) return "defensa";
  if (cargada) return "cargada";
  return ({ attack: "ataque", save: "salvacion", heal: "curacion" })[actividad?.type] ?? "apoyo";
}

/** Primera actividad de un objeto (las técnicas tienen una). */
export const actividadDe = item => lista(item?.system?.activities)[0] ?? null;

/** Fórmula de una parte de daño o curación guardada (número de dados, dado y bono). */
function formulaParte(p) {
  if (!p) return "";
  if (p.custom?.enabled && p.custom.formula) return String(p.custom.formula);
  const dados = p.number && p.denomination ? `${p.number}d${p.denomination}` : "";
  const bono = String(p.bonus ?? "").trim().replace(/^\+\s*/, "").replace(/@mod\b/g, "modificador");
  return [dados, bono].filter(Boolean).join(" + ");
}
/** Fórmula legible de una parte de daño o curación (con lo que dnd5e haya calculado si está). */
function textoParte(p) {
  if (!p) return "";
  const f = String(p.formula ?? formulaParte(p)).trim();
  const tipos = lista(p.damageType ?? p.types).filter(t => t && t !== "healing");
  return [f, tipos.map(nombreDano).join(" o ")].filter(Boolean).join(" ").trim();
}
const UNIDADES = { round: ["asalto", "asaltos"], turn: ["turno", "turnos"], minute: ["minuto", "minutos"], hour: ["hora", "horas"],
  day: ["día", "días"], month: ["mes", "meses"], year: ["año", "años"] };
/** Duración en castellano a partir de la actividad (null si es instantánea). */
function duracionDe(act) {
  const d = act?.duration ?? {};
  if (!d.units || ["inst", "instantaneous"].includes(d.units)) return null;
  if (d.units === "perm") return "permanente";
  if (d.units === "spec") return d.special ? String(d.special) : "especial";
  const [uno, varios] = UNIDADES[d.units] ?? [d.units, d.units];
  const n = Number(d.value) || 1;
  return `${n} ${n === 1 ? uno : varios}`;
}

/** Los números de la técnica. Sin actividad, devuelve null. */
export function cifrasActividad(item, { estados = {} } = {}) {
  const act = actividadDe(item);
  if (!act) return null;
  const l = act.labels ?? {};
  const c = { tipo: act.type ?? "utility", ataque: null, salvacion: null, dano: [], curacion: null, alSuperar: null, duracion: null,
    concentracion: false, estados: [], alcance: l.range ?? null, objetivo: l.target ?? null };
  c.esAtaque = act.type === "attack";
  if (c.esAtaque) c.ataque = String(l.toHit ?? "").trim() || null;
  if (act.type === "save" || act.save) {
    const hab = lista(act.save?.ability).filter(Boolean);
    const cd = Number(act.save?.dc?.value) || Number(l.save?.match?.(/\d+/)?.[0]) || null;
    if (hab.length || cd) c.salvacion = { habilidades: hab.map(nombreCaracteristica), cd };
    const onSave = act.damage?.onSave;
    c.alSuperar = onSave === "half" ? "mitad" : onSave === "none" ? "nada" : onSave === "full" ? "todo" : null;
  }
  const CURA = new Set(["healing", "temphp"]);
  const danos = lista(l.damage ?? l.damages);
  c.dano = danos.filter(d => !CURA.has(d?.damageType)).map(textoParte).filter(Boolean);
  if (!c.dano.length && act.type !== "heal") c.dano = lista(act.damage?.parts).map(textoParte).filter(Boolean);
  if (act.type === "heal") {
    const bono = String(act.healing?.bonus ?? "").includes("@mod") ? " + modificador" : "";
    const desdeEtiqueta = danos.filter(d => CURA.has(d?.damageType)).map(d => d.formula).filter(Boolean).join(" + ");
    c.curacion = desdeEtiqueta ? `${desdeEtiqueta}${bono && !/mod/.test(desdeEtiqueta) ? bono : ""}` : (formulaParte(act.healing) || null);
  }
  c.duracion = duracionDe(act);
  const props = item?.system?.properties;
  c.concentracion = !!(props?.has?.("concentration") || (Array.isArray(props) && props.includes("concentration")) || act.duration?.concentration);
  for (const ef of lista(item?.effects)) for (const st of lista(ef.statuses)) {
    if (c.estados.some(e => e.id === st)) continue;
    const info = estados[st];
    const cfg = lista(globalThis.CONFIG?.statusEffects).find(s => s.id === st);
    const local = cfg?.name ? (globalThis.game?.i18n?.localize?.(cfg.name) ?? cfg.name) : null;
    c.estados.push({ id: st, nombre: info?.name ?? (local && !/^[A-Z0-9]+\.[A-Za-z.]+$/.test(local) ? local : null) ?? ESTADOS_ES[st] ?? ef.name ?? st, texto: info?.texto ?? TEXTOS_ES[st] ?? "" });
  }
  return c;
}

/** El paso a paso, en frases cortas. `uso` es lo que devuelve previsualizarUso (costo, despues, ok, motivo). */
export function pasosUso(c, uso = {}) {
  if (!c) return [];
  const pasos = [];
  const costo = Number(uso.costo) || 0;
  if (costo) pasos.push(`Pagas ${costo} de Verbe${Number.isFinite(Number(uso.despues)) ? ` y te quedan ${uso.despues}` : ""}${Number(uso.despues) < 0 ? " (entras en deuda: salvación de Constitución)" : ""}.`);
  else pasos.push("No gasta Verbe en su grado base.");
  const dano = c.dano.join(" + ");
  if (c.esAtaque || c.ataque) {
    pasos.push(`Tiras 1d20 ${c.ataque ?? "+ tu bono de ataque"} contra la Clase de Armadura del objetivo.`);
    if (dano) pasos.push(`Si impacta: ${dano}.`);
  } else if (c.salvacion) {
    const hab = c.salvacion.habilidades.join(" o ") || "la característica indicada";
    pasos.push(`El objetivo tira ${hab}${c.salvacion.cd ? ` contra CD ${c.salvacion.cd}` : ""}.`);
    if (dano) pasos.push(`Si falla: ${dano}.${c.alSuperar === "mitad" ? " Si la supera, recibe la mitad." : c.alSuperar === "nada" ? " Si la supera, no le pasa nada." : ""}`);
  } else if (dano) pasos.push(`Daño: ${dano}.`);
  if (c.curacion) pasos.push(`Recupera ${c.curacion} puntos de vida.`);
  if (c.estados.length) pasos.push(`Deja: ${c.estados.map(e => e.nombre).join(", ")}.`);
  if (c.duracion) pasos.push(`Dura ${c.duracion}${c.concentracion ? ", con concentración: si te dañan, salvación de Constitución para mantenerla" : ""}.`);
  else if (c.concentracion) pasos.push("Requiere concentración.");
  if (c.tipo === "utility" && !c.estados.length && !dano && !c.curacion) pasos.push("Su efecto se aplica según el texto; al usarla se abre una ventana con lo que quedó activo.");
  return pasos;
}

/** Etiquetas cortas para la cabecera de la tarjeta: ["Ataque +5", "2d6 contundente", "CD 13 DES"]. */
export function chipsCifras(c) {
  if (!c) return [];
  const out = [];
  if (c.ataque) out.push(`Ataque ${c.ataque}`);
  if (c.salvacion) out.push(`${c.salvacion.cd ? `CD ${c.salvacion.cd} ` : ""}${c.salvacion.habilidades.map(h => h.slice(0, 3).toUpperCase()).join("/")}`.trim());
  if (c.dano.length) out.push(c.dano.join(" + "));
  if (c.curacion) out.push(`Cura ${c.curacion}`);
  if (c.concentracion) out.push("Concentración");
  return out.filter(Boolean);
}
