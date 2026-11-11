/**
 * Ajustes de 3.27 (pedidos del autor). Reglas puras, sin Foundry: se prueban con node.
 *
 * 1. Familias por nacimiento. Las «Artes de familia» (Crecer, Atadura de sombra, Cambio de mente, Enjambre,
 *    Compañero de colmillo y Tinta viva) pedían «un maestro»: cualquiera podía aprenderlas con el visto bueno del DM.
 *    Ahora piden la familia (la tradición del mismo nombre), y esa tradición solo se tiene por nacimiento: el DM la da
 *    por historia o la tira al azar. Nadie la gana subiendo una rama.
 * 2. Todo en pies. El catálogo mide en metros; lo que se lee (textos, alcances, fichas, chat) pasa a pies
 *    (1,5 m = 5 ft). Las cuentas internas siguen en metros y las hojas reciben pies.
 * 3. Aprender por días. Pagar los Trazos es el primer paso: después hay días de práctica con una tirada diaria.
 * 4. La reserva y su recuperación, ligadas a la Constitución.
 * 5. La economía del Verbe: una acción Verbe y una reacción Verbe por turno, aparte de las de D&D.
 */

/* ---------- 1. Familias ---------- */
/** Las seis familias. `req` reconoce el texto viejo («un maestro de Crecer»). */
export const FAMILIAS = {
  sombra: { nombre: "Atadura de sombra", req: /atadura de sombra/i },
  expansion: { nombre: "Expansión corporal (Crecer)", req: /crecer|expansi[oó]n corporal/i },
  mente: { nombre: "Cambio de mente", req: /cambio de mente/i },
  enjambre: { nombre: "Colonia de insectos", req: /enjambre|colonia de insectos/i },
  colmillo: { nombre: "Manada de colmillos", req: /colmillo/i },
  tinta: { nombre: "Tinta viva", req: /tinta viva/i }
};
export const esFamilia = id => Object.prototype.hasOwnProperty.call(FAMILIAS, id);
/** La familia de una técnica de «Artes de familia» (por su requisito o por su id). Null si no es de familia. */
export function familiaDeTecnica(t) {
  if (!t) return null;
  const acc = t.acceso?.tradicion ?? t.item?.flags?.["ecos-frontera"]?.verbe?.acceso?.tradicion;
  if (esFamilia(acc)) return acc;
  if (t.sec !== "familia") return null;
  const texto = `${t.req ?? ""} ${t.id ?? ""}`;
  for (const [id, f] of Object.entries(FAMILIAS)) if (f.req.test(texto)) return id;
  const porId = String(t.id ?? "").match(/^familia-(sombra|mente|enjambre|colmillo|tinta)/)?.[1];
  if (porId) return porId;
  if (/^familia-(crecer|gigante|mano-gigante)/.test(String(t.id ?? ""))) return "expansion";
  return null;
}
/**
 * Marca en el catálogo qué técnicas son de familia y que su tradición es de nacimiento. Cambia `D` en su sitio y
 * devuelve cuántas técnicas marcó. Las técnicas guardan la marca en `acceso.tradicion` (la que mira accesoShinobi).
 */
export function marcarFamilias(D) {
  let n = 0;
  for (const t of D?.tecnicas ?? []) {
    const fam = familiaDeTecnica(t);
    if (!fam) continue;
    t.familia = fam;
    t.acceso = { ...(t.acceso ?? {}), tradicion: fam };
    const meta = t.item?.flags?.["ecos-frontera"]?.verbe;
    if (meta) { meta.acceso = { ...(meta.acceso ?? {}), tradicion: fam }; meta.familia = fam; }
    if (/maestro/i.test(t.req ?? "")) t.req = null;
    n += 1;
  }
  for (const tr of D?.tradicionesShinobi ?? []) if (esFamilia(tr.id)) tr.familia = true;
  return n;
}
/** Lo que el jugador puede ver de una técnica de familia: solo si es de su familia. */
export const familiaVisible = (t, tradiciones = []) => { const f = familiaDeTecnica(t); return !f || tradiciones.includes(f); };

/* ---------- 2. Pies ---------- */
const NUM = "(\\d+(?:[.,]\\d+)?)";
/** Metros → pies a la manera de D&D: 1,5 m = 5 ft; de 5 ft para arriba, al múltiplo de 5 más cercano. */
export function metrosAPies(m) {
  const v = Number(String(m).replace(",", "."));
  if (!Number.isFinite(v)) return m;
  const ft = v / 0.3, de5 = Math.round(ft / 5) * 5;
  return (ft >= 5 && Math.abs(ft - de5) <= 0.5) ? de5 : Math.max(1, Math.round(ft));
}
const RE_CON_PIES = new RegExp(`${NUM}\\s?(?:m|metros?)\\s*\\(\\s*${NUM}\\s*(?:pies|ft)\\s*\\)`, "g");
const RE_M = new RegExp(`(^|[^\\w.,])${NUM}\\s?(?:m|metros?)(?![\\wáéíóúñ²³])`, "g");
/** Cambia las distancias de un texto de metros a pies. Lo que ya decía pies entre paréntesis queda solo en pies. */
export function aPiesTexto(s) {
  if (typeof s !== "string" || !/\d\s?(?:m|metros?)(?![\wáéíóúñ²³])/.test(s)) return s;
  return s.replace(RE_CON_PIES, (_, __, pies) => `${pies} ft`)
    .replace(RE_M, (_, antes, n) => `${antes}${metrosAPies(n)} ft`);
}
/** Recorre un objeto y pasa a pies todos los textos (no toca números, unidades ni claves). Devuelve cuántos cambió. */
export function textosAPies(obj, vistos = new WeakSet()) {
  let n = 0;
  if (!obj || typeof obj !== "object" || vistos.has(obj)) return 0;
  vistos.add(obj);
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    if (typeof v === "string") {
      if (k === "units" || k === "img" || k === "id" || k === "_id" || k === "uuid") continue;
      const nuevo = aPiesTexto(v);
      if (nuevo !== v) { obj[k] = nuevo; n += 1; }
    } else if (v && typeof v === "object") n += textosAPies(v, vistos);
  }
  return n;
}
/** Lo que el usuario escribe en pies, en metros para el catálogo (5 ft = 1,5 m). */
export const piesAMetros = ft => Math.round(Number(ft) * 0.3 * 100) / 100;

/* ---------- 3. Aprender por días ---------- */
/** Días de práctica y CD de la tirada diaria para aprender una técnica de ese grado. */
export function planEstudio(grado) {
  const g = Math.max(0, Number(grado) || 0);
  return { exitos: g + 1, cd: 10 + g };
}
/**
 * Resultado de una práctica diaria. `natural` es el d20. Puro.
 * Éxito: +1 día de avance (un 20 natural, +2). Fallo: el día no cuenta. Un 1 natural: además se pierde 1 día de avance.
 */
export function practicar(estudio, { total, natural = null, dia }) {
  const e = { ...estudio };
  if (e.ultimoDia === dia) return { ok: false, motivo: "Hoy ya practicó esta técnica. Mañana puede seguir.", estudio: e };
  const exito = natural === 20 || (natural !== 1 && Number(total) >= Number(e.cd));
  const antes = Number(e.progreso) || 0;
  let progreso = antes;
  if (exito) progreso += natural === 20 ? 2 : 1;
  else if (natural === 1) progreso = Math.max(0, progreso - 1);
  e.progreso = Math.min(Number(e.exitos) || 1, progreso);
  e.ultimoDia = dia;
  e.dias = (Number(e.dias) || 0) + 1;
  return { ok: true, exito, natural, progreso: e.progreso, antes, terminado: e.progreso >= (Number(e.exitos) || 1), estudio: e };
}

/* ---------- Naturaleza por dado ---------- */
/** La naturaleza que sale con un dado sobre la lista de las que quedan. `tirada` va de 1 a lista.length. */
export function naturalezaPorDado(lista, tirada) {
  const i = Math.trunc(Number(tirada)) - 1;
  return lista[Math.max(0, Math.min(lista.length - 1, i))] ?? null;
}

/* ---------- 4. Reserva y Constitución ---------- */
/** Lo que la Constitución suma a la reserva: su modificador por nivel, como los PG (sin bajar de 0 en total). */
export const reservaPorCon = (modCon, nivel) => Math.trunc(Number(modCon) || 0) * Math.max(1, Math.trunc(Number(nivel) || 1));
/**
 * Recuperación en un Descanso Largo (3.28, pedido del autor: la Constitución pesa más y llenarse tarda varios días):
 * el 15 % de la reserva más el modificador de Constitución por cada dos niveles (la mitad del nivel, hacia arriba).
 * Con CON +0 tarda de 5 a 7 días en llenarse; con CON +3, unos 3. Nunca menos de 1.
 */
export function recuperacionLargaCon(max, modCon, nivel, frac = 0.15) {
  const tramos = Math.max(1, Math.ceil((Math.max(1, Number(nivel) || 1)) / 2));
  return Math.max(1, Math.floor(Math.max(0, Number(max) || 0) * frac) + Math.trunc(Number(modCon) || 0) * tramos);
}
/** Cuántos descansos largos tarda en llenarse desde 0. */
export const diasParaLlenar = (max, rec) => (rec > 0 ? Math.ceil(Math.max(0, max) / rec) : Infinity);

/* ---------- 5. Acción Verbe ---------- */
/** Qué gasta una técnica según su tiempo: la acción Verbe, la reacción Verbe o nada (más de un turno). */
export function gastoVerbe(tiempo) {
  if (["R", "reaction"].includes(tiempo)) return "reaccion";
  if (["AA", "bonus"].includes(tiempo)) return "adicional";
  if (["A", "action"].includes(tiempo)) return "accion";
  return null;
}
/** El estado de la acción y la reacción Verbe en el turno. `combate` es {id, ronda, turno, actorEnTurno}. Puro. */
export function economiaVerbe(e, combate) {
  const t = e?.turnoVerbe ?? {};
  const mismo = !!combate && t.combate === combate.id && t.ronda === combate.ronda;
  const mismoTurno = mismo && t.turno === combate.turno;
  return { accion: !!(mismoTurno && t.accion), reaccion: !!(mismo && t.reaccion), enCombate: !!combate };
}
export const TIEMPOS_EXPLICADOS = {
  A: ["Acción Verbe", "Usa tu acción Verbe del turno: no gasta tu Acción de D&D. Una por turno."],
  AA: ["Acción adicional Verbe", "Usa tu acción adicional Verbe del turno: no gasta tu Acción adicional de D&D ni tu acción Verbe. Una por turno."],
  R: ["Reacción Verbe", "Usa tu reacción Verbe (una por ronda): no gasta tu Reacción de D&D. Sustitución y Choque la usan."],
  "1 min": ["1 minuto", "Fuera del turno: no cabe en un combate de 6 segundos."],
  "10 min": ["10 minutos", "Fuera de combate."],
  "1 h": ["1 hora", "Fuera de combate."],
  "8 h": ["8 horas", "Ritual largo."],
  "3 días": ["Ritual de 3 días", "Ritual: pide preparación y permiso del DM."]
};

/* ---------- 6. Técnicas de golpe: con tu arma, o el próximo golpe ---------- */
export const TIPO_DANO = { fuerza: "force", contundente: "bludgeoning", cortante: "slashing", perforante: "piercing", fuego: "fire", "frío": "cold", frio: "cold",
  rayo: "lightning", "relámpago": "lightning", relampago: "lightning", trueno: "thunder", "ácido": "acid", acido: "acid", veneno: "poison",
  "necrótico": "necrotic", necrotico: "necrotic", radiante: "radiant", "psíquico": "psychic", psiquico: "psychic" };
const DADO = "(\\d+)d(\\d+)";
const TIPO = `(${Object.keys(TIPO_DANO).join("|")})`;
/**
 * Lee del texto de una técnica si es un golpe con arma («Haces un ataque con un arma…») o si carga el próximo golpe
 * («Tu próximo golpe… suma 2d6 de fuerza»). Devuelve null si no es ninguna. Pura.
 * { modo: "ataque"|"siguiente", veces, arma: "cac"|"arma"|"arrojadiza"|"sinArmas"|"cacLigera", dado: {n,d,tipo}|null, niveles: [5,11,17]|null, sube: {n,d}|null, nota }
 */
export function golpeDeTexto(texto) {
  const t = String(texto ?? "");
  const sube = t.match(new RegExp(`Sube: \\+${DADO}`, "i"));
  const niveles = /Sube un dado en los niveles 5, 11 y 17|en el nivel 5, \d+d\d+ en el 11 y \d+d\d+ en el 17/i.test(t) ? [5, 11, 17] : null;
  const ataque = t.match(/^Haces (un|dos|tres) (?:ataques?|golpes?) (con un arma cuerpo a cuerpo o un golpe sin armas|con un arma arrojadiza|con un arma|sin armas|cuerpo a cuerpo)?/i)
    ?? t.match(/^Lanzas un arma (arrojadiza)[^:]*: haces (dos|tres) ataques/i)?.slice?.(0)?.map?.((x, i, a) => (i === 1 ? a[2] : i === 2 ? "con un arma arrojadiza" : x));
  if (ataque) {
    const veces = { un: 1, dos: 2, tres: 3 }[ataque[1].toLowerCase()] ?? 1;
    const como = (ataque[2] ?? "").toLowerCase();
    const arma = /arrojadiza/.test(como) ? "arrojadiza" : /golpe sin armas/.test(como) ? "cac" : /sin armas/.test(como) || /golpes sin armas/i.test(t) ? "sinArmas" : /cuerpo a cuerpo/.test(como) ? "cac" : "arma";
    const m = t.match(new RegExp(`Si impacta, suma ${DADO} de ${TIPO}`, "i"));
    return { modo: "ataque", veces, arma, dado: m ? { n: Number(m[1]), d: Number(m[2]), tipo: TIPO_DANO[m[3].toLowerCase()] } : null, niveles, sube: sube ? { n: Number(sube[1]), d: Number(sube[2]) } : null, nota: "" };
  }
  const sig = t.match(/Tu próximo (golpe|ataque)( cuerpo a cuerpo o con arma ligera| cuerpo a cuerpo| con arma)?( que impacte)?( este turno| en el próximo minuto)?/i);
  if (!sig) {
    // Mientras dure la técnica: «tus golpes cuerpo a cuerpo suman 4d10 de fuerza».
    const dur = t.match(new RegExp(`tus (golpes|ataques)( cuerpo a cuerpo| con arma)? suman ${DADO} de ${TIPO}`, "i"));
    if (!dur) return null;
    return { modo: "durante", veces: 1, arma: /cuerpo a cuerpo/i.test(dur[2] ?? "") ? "cac" : "arma", dado: { n: Number(dur[3]), d: Number(dur[4]), tipo: TIPO_DANO[dur[5].toLowerCase()] }, niveles, sube: sube ? { n: Number(sube[1]), d: Number(sube[2]) } : null, nota: "" };
  }
  const como = (sig[2] ?? "").toLowerCase();
  const arma = /ligera/.test(como) ? "cacLigera" : /cuerpo a cuerpo/.test(como) ? "cac" : "arma";
  let dado = null;
  const suma = t.match(new RegExp(`suma ${DADO} de ${TIPO}`, "i"));
  if (suma) dado = { n: Number(suma[1]), d: Number(suma[2]), tipo: TIPO_DANO[suma[3].toLowerCase()] };
  else if (/suma (este|el) daño/i.test(t)) {
    const ini = t.match(new RegExp(`^${DADO} ${TIPO}`, "i"));
    if (ini) dado = { n: Number(ini[1]), d: Number(ini[2]), tipo: TIPO_DANO[ini[3].toLowerCase()] };
  }
  const resto = t.slice(sig.index + sig[0].length).replace(new RegExp(`^\\s*suma ${DADO} de ${TIPO}`, "i"), "").replace(/^\s*suma (este|el) daño( de \w+)?/i, "")
    .replace(/\s*Sube:.*$/i, "").replace(/\s*Sube un dado.*$/i, "").replace(/\s*Pide:.*$/i, "").replace(/^[\s,.:y]+/, "").trim();
  return { modo: "siguiente", veces: 1, arma, dado, niveles, sube: sube ? { n: Number(sube[1]), d: Number(sube[2]) } : null, turno: /este turno/i.test(sig[4] ?? "") || /este turno/i.test(t), nota: resto };
}
/** Los dados del golpe para este uso: los de nivel (5, 11, 17), los de grado usado por encima del base y los de más. Pura. */
export function dadosGolpe(g, { nivel = 1, gradosExtra = 0, extra = 0 } = {}) {
  if (!g?.dado) return null;
  let n = g.dado.n + (g.niveles ? g.niveles.filter(x => nivel >= x).length : 0) + Math.max(0, Number(extra) || 0);
  if (g.sube && g.sube.d === g.dado.d) n += Math.max(0, Number(gradosExtra) || 0) * g.sube.n;
  return { n, d: g.dado.d, tipo: g.dado.tipo, formula: `${n}d${g.dado.d}[${g.dado.tipo}]` };
}
/** ¿Esa arma sirve para el golpe? `arma` es un objeto con {melee, ranged, thrown, light, unarmed}. Pura. */
export function armaSirve(req, a) {
  if (req === "sinArmas") return !!a.unarmed;
  if (req === "cac") return !!(a.melee || a.unarmed);
  if (req === "cacLigera") return !!(a.melee || a.unarmed || a.light);
  if (req === "arrojadiza") return !!a.thrown;
  return true;
}
