/** Reglas puras del Verbe. No dependen de Foundry, del DOM ni de sockets. */
export const VERSION_REGLAS = 2;
export const GRADO_MAXIMO = 11;

export const entero = (n, fallback = 0) => Number.isFinite(Number(n)) ? Math.trunc(Number(n)) : fallback;
export const limitar = (n, min, max) => Math.max(min, Math.min(max, n));

/** Todas las fuentes pagan dos puntos de recuperación por cada punto de deuda.
 * Un punto impar queda como crédito para la siguiente recuperación; nunca se pierde ni se duplica.
 */
export function recuperarReserva({ valor = 0, cantidad = 0, maximo = 0, resto = 0 } = {}) {
  let actual = Math.min(entero(valor), Math.max(0, entero(maximo)));
  let credito = Math.max(0, entero(cantidad)) + limitar(entero(resto), 0, 1);
  if (actual < 0) {
    const deudaPagada = Math.min(-actual, Math.floor(credito / 2));
    actual += deudaPagada;
    credito -= deudaPagada * 2;
    if (actual < 0) return { valor: actual, resto: credito % 2 };
  }
  return { valor: Math.min(Math.max(0, entero(maximo)), actual + credito), resto: 0 };
}

/** Único criterio para técnicas, defensas y Cerrojos. */
export function evaluarGasto({ valor, costo, limite = 0, agotamiento = 0, grado = 1,
  gradoMaximo = GRADO_MAXIMO, incapacitado = false, reaccion = false, puedeReaccionar = true,
  altoGastado = false } = {}) {
  if (!Number.isSafeInteger(costo) || costo < 0 || !Number.isSafeInteger(grado)
    || grado < 0 || grado > GRADO_MAXIMO) return { ok: false, motivo: "El grado o el coste no son válidos." };
  if (grado > gradoMaximo) return { ok: false, motivo: `Puede usar hasta grado ${gradoMaximo} en esta rama.` };
  if (incapacitado) return { ok: false, motivo: "Su estado no le permite actuar." };
  if (reaccion && !puedeReaccionar) return { ok: false, motivo: "No tiene una reacción disponible." };
  if (grado >= 6 && altoGastado) return { ok: false, motivo: "Ya usó esta técnica a grado 6 o más desde su último Descanso Largo." };
  // 3.34 (regla del autor): sin Verbe que gastar, una técnica de grado 0 cuesta 1 en negativo: puedes seguir forzándote.
  const costoReal = grado === 0 && valor < 1 ? Math.max(1, costo) : costo;
  const despues = entero(valor) - costoReal;
  if (despues < entero(limite)) return { ok: false, motivo: `No le alcanza el Verbe: no puede bajar de ${limite}.` };
  if (despues < 0 && agotamiento >= 4) return { ok: false, motivo: "Con Agotamiento 4 no puede gastar Verbe en negativo." };
  return { ok: true, despues, sobreesfuerzo: despues < 0, costo: costoReal };
}

/** Dos grados de ventaja elemental; una diferencia mayor de potencia puede vencerla. */
export function resultadoChoque(gradoA, gradoB, ciclo = 0, modo = "potencia") {
  const a = limitar(entero(gradoA), 0, GRADO_MAXIMO);
  const b = limitar(entero(gradoB), 0, GRADO_MAXIMO);
  if (modo === "clasico" && ciclo) return { gana: Math.sign(ciclo), margen: null, ciclo };
  // 3.7: sin ventaja elemental deciden los dados (Control del Verbe + grado de cada técnica).
  if (!ciclo) return { gana: 0, margen: a - b, ciclo: 0, dados: true };
  const margen = a - b + (modo === "clasico" ? 0 : 2 * Math.sign(ciclo));
  return { gana: Math.sign(margen), margen, ciclo };
}

export function requisitoNatural(texto, naturalezas = []) {
  const req = String(texto ?? "");
  const nats = new Set([...naturalezas].map(n => String(n).toLowerCase()));
  const simple = req.match(/\bnaturaleza\s+(Fuego|Agua|Viento|Tierra|Rayo)\b/i);
  if (simple && !nats.has(simple[1].toLowerCase())) return { ok: false, motivo: `Pide naturaleza ${simple[1]}.` };
  if (/\bdos naturalezas\b/i.test(req) && nats.size < 2) return { ok: false, motivo: "Pide dos naturalezas." };
  return { ok: true };
}

/** Serializa mutaciones en un cliente. Los rechazos no bloquean el trabajo siguiente. */
export function crearCola() {
  const pendientes = new Map();
  const ejecutar = (clave, trabajo) => {
    const anterior = pendientes.get(clave) ?? Promise.resolve();
    const actual = anterior.catch(() => {}).then(trabajo);
    pendientes.set(clave, actual);
    const limpiar = () => { if (pendientes.get(clave) === actual) pendientes.delete(clave); };
    actual.then(limpiar, limpiar);
    return actual;
  };
  ejecutar.ocupada = clave => pendientes.has(clave);
  return ejecutar;
}

/** Límites espaciales de referencia; el DM puede aprobar una excepción documentada. */
export const LIMITES_CREACION = [
  { alcance: 18, cono: 3, esfera: 1.5, cubo: 3, "línea": 6, cilindro: 1.5 },
  { alcance: 36, cono: 4.5, esfera: 1.5, cubo: 4.5, "línea": 9, cilindro: 1.5 },
  { alcance: 36, cono: 6, esfera: 3, cubo: 6, "línea": 18, cilindro: 3 },
  { alcance: 45, cono: 9, esfera: 6, cubo: 9, "línea": 30, cilindro: 6 },
  { alcance: 45, cono: 12, esfera: 6, cubo: 9, "línea": 45, cilindro: 6 },
  { alcance: 90, cono: 18, esfera: 9, cubo: 18, "línea": 60, cilindro: 9 },
  { alcance: 150, cono: 24, esfera: 12, cubo: 24, "línea": 90, cilindro: 12 },
  { alcance: 150, cono: 36, esfera: 18, cubo: 36, "línea": 120, cilindro: 18 },
  { alcance: 1500, cono: 60, esfera: 30, cubo: 60, "línea": 150, cilindro: 30 },
  { alcance: 1500, cono: 60, esfera: 30, cubo: 60, "línea": 150, cilindro: 30 },
  { alcance: 1500, cono: 72, esfera: 36, cubo: 72, "línea": 150, cilindro: 36 },
  { alcance: 1500, cono: 90, esfera: 45, cubo: 90, "línea": 180, cilindro: 45 }
];

export function presupuestoTecnica(formulario, filas, estadosNaturaleza = 0) {
  const g = limitar(entero(formulario.grado), 0, GRADO_MAXIMO);
  const rapida = (formulario.tiempo === "AA" && !["cuerpo", "hilo"].includes(formulario.rama)) || formulario.tiempo === "R";
  const fila = filas.find(p => p.grado === Math.max(0, g - Number(rapida)));
  const area = formulario.areaTipo && formulario.areaTipo !== "ninguna";
  const dados = [...String(area ? fila?.area : fila?.uno).matchAll(/(\d+)d(\d+)/g)];
  const estados = Math.max(entero(formulario.estados), g ? estadosNaturaleza : 0);
  const m = estados === 0 && dados.length > 1 ? dados.at(-1) : dados[0];
  const n0 = Number(m?.[1]) || 1, d0 = Number(m?.[2]) || 6;
  // Una tabla con dos cantidades ya reserva el primer estado en su cantidad menor.
  const estadosAPagar = Math.max(0, estados - (area && dados.length > 1 ? 1 : 0));
  let media = n0 * (d0 + 1) / 2 * Math.max(0.25, 1 - 0.25 * estadosAPagar);
  if (formulario.tirada === "ninguna") media /= 2;
  let n = n0;
  if (formulario.tirada === "ataque" && formulario.alcance === "toque") { media += (d0 + 1) / 2; n++; }
  if (formulario.modo === "evolucion") { media += (d0 + 1) / 2; n++; }
  if (formulario.persistente) media /= 2;
  let mejor = { n, d: d0, s: Infinity };
  for (let c = 1; c <= n + 1; c++) for (const d of [4, 6, 8, 10, 12]) {
    const s = Math.abs(c * (d + 1) / 2 - media) + 0.3 * Math.abs(c - n);
    if (s < mejor.s) mejor = { n: c, d, s };
  }
  return { n: mejor.n, d: mejor.d, estados };
}

export function validarCreacion(f, { propuesta, maxGrado = GRADO_MAXIMO } = {}) {
  const errores = [];
  const g = Number(f.grado), n = Number(f.dadosN), d = Number(f.dadosD);
  if (!Number.isInteger(g) || g < 0 || g > maxGrado) errores.push("El grado supera el nivel o dominio de su rama.");
  if (!String(f.nombre ?? "").trim() || String(f.nombre).length > 100) errores.push("El nombre debe tener entre 1 y 100 caracteres.");
  if (String(f.efecto ?? "").length > 4000) errores.push("La descripción supera 4000 caracteres.");
  if (!Number.isInteger(n) || n < 0 || n > 100 || ![4, 6, 8, 10, 12].includes(d)) errores.push("Los dados no son válidos.");
  const limites = LIMITES_CREACION[limitar(entero(g), 0, GRADO_MAXIMO)];
  if (!["yo", "toque"].includes(f.alcance)
    && (!Number.isFinite(Number(f.alcance)) || Number(f.alcance) <= 0 || Number(f.alcance) > limites.alcance)) errores.push(`El alcance de referencia es ${limites.alcance} m.`);
  if (f.areaTipo && f.areaTipo !== "ninguna") {
    const tam = Number(f.areaTam), max = limites[f.areaTipo];
    if (!max || !Number.isFinite(tam) || tam <= 0 || tam > max) errores.push(`El área de referencia para ${f.areaTipo} es ${max ?? "no válida"} m.`);
  }
  if (propuesta && n * (d + 1) / 2 > propuesta.n * (propuesta.d + 1) / 2 + 0.5) errores.push(`El daño de referencia es ${propuesta.n}d${propuesta.d}.`);
  if (f.persistente && (!f.conc || f.duracion === "inst.")) errores.push("El daño repetido requiere una duración y Concentración, o una excepción del DM.");
  if (!Number.isInteger(Number(f.estados)) || Number(f.estados) < 0 || Number(f.estados) > 3) errores.push("La cantidad de estados debe estar entre 0 y 3.");
  return { ok: errores.length === 0, errores };
}

/** Desempate de un choque con las tiradas de Control: sin ventaja elemental suma el grado de cada técnica. */
export function desempateChoque({ ta, tb, ga = 0, gb = 0, dados = false } = {}) {
  const x = (Number(ta) || 0) + (dados ? Number(ga) || 0 : 0), y = (Number(tb) || 0) + (dados ? Number(gb) || 0 : 0);
  return Math.sign(x - y);
}
