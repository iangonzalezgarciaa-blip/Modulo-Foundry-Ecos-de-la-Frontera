/**
 * 3.64 · Reglas del autor (12-nov-2026) sobre el entrenamiento del Verbe. Reglas puras: no dependen de Foundry.
 *  - Dado de control: «a los costos de Verbe de todo se le suma un dado: refleja el nivel de control de su Verbe».
 *    Baja con la etapa: Aprendiz +1d4 · Practicante +1d3 · Iniciado +1d2 · Pleno +1d2−1 (0 o 1).
 *  - Dotes entrenadas: las dotes que no son dones (de nacimiento, de sangre) se entrenan como las técnicas, pero en
 *    horas o pocos días: una tirada por bloque de tiempo; un 20 natural la aprende al instante.
 *  - Crecimiento: entrenar o meditar un día da puntos; con los puntos se gana un Trazo más (con maestro, antes).
 */
export const DADO_CONTROL = {
  1: { formula: "1d4", caras: 4, resta: 0 },
  2: { formula: "1d3", caras: 3, resta: 0 },
  3: { formula: "1d2", caras: 2, resta: 0 },
  4: { formula: "1d2−1", caras: 2, resta: 1 }
};
/** El dado de control de una etapa (0 = dormido: se trata como Aprendiz si llega a usar). Puro. */
export const dadoControl = etapa => DADO_CONTROL[Math.max(1, Math.min(4, Number(etapa) || 1))];
/**
 * 3.79 (regla del autor, 13-nov-2026: «que tengan que entrenar para no desperdiciar»): el derroche sale del bono de tu
 * Control del Verbe, no de la etapa. Mucha reserva y poco control derrocha; poca reserva y buen control gasta lo justo.
 *   +2 o menos: +1d6 · +3–4: +1d4 · +5–6: +1d3 · +7–8: +1d2 · +9–10: +1d2−1 · +11 o más: nada.
 */
export const DERROCHE = [
  { hasta: 2, formula: "1d6", caras: 6, resta: 0 }, { hasta: 4, formula: "1d4", caras: 4, resta: 0 }, { hasta: 6, formula: "1d3", caras: 3, resta: 0 },
  { hasta: 8, formula: "1d2", caras: 2, resta: 0 }, { hasta: 10, formula: "1d2−1", caras: 2, resta: 1 }, { hasta: Infinity, formula: "0", caras: 0, resta: 0 }
];
/** El dado de derroche según el bono total de Control del Verbe. Puro. */
export const dadoDerroche = bono => DERROCHE.find(d => (Number(bono) || 0) <= d.hasta);
const comoDado = x => (x && typeof x === "object" ? x : dadoControl(x));
/** Tira el dado de derroche (o el de una etapa, para lo antiguo). `azar` devuelve [0, 1). Puro salvo el azar. */
export function tirarControl(etapaODado, azar = Math.random) {
  const d = comoDado(etapaODado);
  if (!d.caras) return { formula: d.formula, dado: 0, valor: 0 };
  const dado = Math.min(d.caras, Math.floor(azar() * d.caras) + 1);
  return { formula: d.formula, dado, valor: Math.max(0, dado - d.resta) };
}
/** Texto del coste con su dado: «2 + 1d4» (o solo «2» si ya no derrocha). Puro. */
export const textoCostoControl = (costo, etapaODado, activo = true) => { const d = comoDado(etapaODado); return activo && d.caras ? `${costo} + ${d.formula}` : `${costo}`; };

/* ---------- 3.79 · Ejercicio de control (pedido del autor) ---------- */
/** Ejercicio de goteo: llenar un cuenco gota a gota con el Verbe. Cada nivel dominado da +1 a Control del Verbe (hasta +3). */
export const TOPE_EJERCICIO = 3;
export const CD_EJERCICIO = nivel => 12 + 2 * (Number(nivel) || 0);
export const diasEjercicio = ({ sensei = false } = {}) => (sensei ? 3 : 5);
/** Un día de ejercicio. Éxito +1 día bueno (20 natural, 2); al juntar los días, +1 nivel. Puro: `c` = {nivel, puntos, ultimoDia}. */
export function diaEjercicio(c = {}, { total, natural = null, dia, sensei = false }) {
  const s = { nivel: Number(c.nivel) || 0, puntos: Number(c.puntos) || 0, ultimoDia: c.ultimoDia ?? null };
  if (s.nivel >= TOPE_EJERCICIO) return { ok: false, motivo: `Ya domina el ejercicio de control (+${TOPE_EJERCICIO} a Control del Verbe).`, estado: s };
  if (s.ultimoDia === dia) return { ok: false, motivo: "Hoy ya hizo el ejercicio de control: mañana puede seguir.", estado: s };
  const cd = CD_EJERCICIO(s.nivel), exito = natural === 20 || (natural !== 1 && Number(total) >= cd);
  s.puntos += exito ? (natural === 20 ? 2 : 1) : 0;
  s.ultimoDia = dia;
  const meta = diasEjercicio({ sensei });
  let sube = false;
  if (s.puntos >= meta) { s.nivel += 1; s.puntos = 0; sube = true; }
  return { ok: true, exito, natural, cd, meta, sube, estado: s };
}

/* ---------- Dotes entrenadas ---------- */
/** Las categorías y dotes que son dones (de nacimiento, de sangre, de la naturaleza o concedidos por el DM). */
export const CATS_DON = new Set(["innatos"]);
export const DOTES_DON = new Set(["eco-sangre", "hijo-santuario", "piel-naturaleza", "corazon-fuego", "corazon-agua", "corazon-viento", "corazon-tierra", "corazon-rayo",
  "tercera-naturaleza", "afinidad-natural", "control-instinto", "injerto-aceptado", "sangre-callada", "heredero-arte", "ascension-mitica", "ascension-trascendente"]);
/** ¿Don o entrenada? Primero lo que marcó el DM a mano. Puro. */
export function tipoDote(d, manual = {}) {
  if (!d) return "don";
  if (manual?.[d.id] === "don" || manual?.[d.id] === "entrenada") return manual[d.id];
  if (d.tipo === "don" || d.tipo === "entrenada") return d.tipo;
  if (CATS_DON.has(d.cat) || String(d.cat ?? "").startsWith("legado-") || d.legado || d.innato || DOTES_DON.has(d.id)) return "don";
  return "entrenada";
}
/** Cuánto se entrena una dote según sus Trazos: horas para las pequeñas, días para las grandes. Puro. */
export function planDote(trazos) {
  const t = Math.max(0, Number(trazos) || 0);
  if (t <= 1) return { unidad: "horas", bloque: 2, exitos: 1, cd: 11 };
  if (t === 2) return { unidad: "horas", bloque: 4, exitos: 1, cd: 12 };
  if (t === 3) return { unidad: "horas", bloque: 4, exitos: 2, cd: 13 };
  if (t === 4) return { unidad: "dias", bloque: 1, exitos: 2, cd: 14 };
  if (t === 5) return { unidad: "dias", bloque: 1, exitos: 3, cd: 15 };
  return { unidad: "dias", bloque: 1, exitos: 4, cd: 16 };
}
export const textoPlan = p => p.unidad === "horas"
  ? `${p.exitos} bloque${p.exitos === 1 ? "" : "s"} bueno${p.exitos === 1 ? "" : "s"} de ${p.bloque} h (unas ${p.exitos * p.bloque} h)`
  : `${p.exitos} día${p.exitos === 1 ? "" : "s"} bueno${p.exitos === 1 ? "" : "s"}`;
/**
 * Una tirada de entrenamiento de dote. Un 20 natural la termina al instante; un 1 natural pierde un bloque.
 * Las de días: una por día del mundo. Puro.
 */
export function practicarDote(entreno, { total, natural = null, dia }) {
  const e = { ...entreno };
  if (e.unidad === "dias" && e.ultimoDia === dia) return { ok: false, motivo: "Hoy ya entrenó esta dote. Mañana puede seguir.", entreno: e };
  const exito = natural === 20 || (natural !== 1 && Number(total) >= Number(e.cd));
  let progreso = Number(e.progreso) || 0;
  if (natural === 20) progreso = Number(e.exitos) || 1;
  else if (exito) progreso += 1;
  else if (natural === 1) progreso = Math.max(0, progreso - 1);
  e.progreso = Math.min(Number(e.exitos) || 1, progreso);
  e.intentos = (Number(e.intentos) || 0) + 1;
  if (e.unidad === "dias") e.ultimoDia = dia;
  return { ok: true, exito, natural, progreso: e.progreso, terminado: e.progreso >= (Number(e.exitos) || 1), instante: natural === 20, entreno: e };
}

/* ---------- Crecimiento: ganar Trazos entrenando o meditando ---------- */
export const ACTIVIDADES_CRECIMIENTO = {
  meditar: { nombre: "Meditar", car: "wis", texto: "Calma, respiración y escuchar tu Verbe." },
  cuerpo: { nombre: "Entrenar el cuerpo", car: "con", texto: "Ejercicios hasta el agotamiento, con el Verbe circulando." },
  forma: { nombre: "Practicar la forma", car: "dex", texto: "Repetir gestos y movimientos hasta que salgan solos." },
  estudio: { nombre: "Estudiar", car: "int", texto: "Pergaminos, notas de un maestro, teoría del Verbe." },
  combate: { nombre: "Combatir en práctica", car: "str", texto: "Combates de práctica con un compañero o contra muñecos." }
};
export const CD_CRECIMIENTO = 15;
/** Puntos para ganar un Trazo: 5 solo; 4 con un compañero que entrena contigo; 3 con un maestro (sensei). Puro. */
export const puntosPorTrazo = ({ sensei = false, companero = false } = {}) => sensei ? 3 : companero ? 4 : 5;
/** Trazos de más que se pueden ganar así por nivel (los demás los da el DM). */
export const TOPE_CRECIMIENTO_NIVEL = 2;
/**
 * Un día de crecimiento. Éxito +1 punto (20 natural +2). Al juntar los puntos, +1 Trazo (hasta el tope del nivel).
 * Puro: `c` = {puntos, ultimoDia, ganados: {nivel: n}}.
 */
export function diaCrecimiento(c = {}, { total, natural = null, dia, nivel = 1, sensei = false, companero = false, cd = CD_CRECIMIENTO }) {
  const s = { puntos: Number(c.puntos) || 0, ultimoDia: c.ultimoDia ?? null, ganados: { ...(c.ganados ?? {}) } };
  if (s.ultimoDia === dia) return { ok: false, motivo: "Hoy ya entrenó o meditó: mañana puede seguir.", estado: s };
  const ya = Number(s.ganados[nivel]) || 0;
  if (ya >= TOPE_CRECIMIENTO_NIVEL) return { ok: false, motivo: `Ya ganó ${TOPE_CRECIMIENTO_NIVEL} Trazos entrenando en este nivel: el resto llega al subir de nivel o lo da el DM.`, estado: s };
  const exito = natural === 20 || (natural !== 1 && Number(total) >= cd);
  s.puntos += exito ? (natural === 20 ? 2 : 1) : 0;
  s.ultimoDia = dia;
  const meta = puntosPorTrazo({ sensei, companero });
  let trazo = 0;
  if (s.puntos >= meta) { s.puntos -= meta; trazo = 1; s.ganados[nivel] = ya + 1; }
  return { ok: true, exito, natural, puntos: s.puntos, meta, trazo, estado: s };
}
