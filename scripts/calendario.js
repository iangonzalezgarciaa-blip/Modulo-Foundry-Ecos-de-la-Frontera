/*
 * Calendario de Arcegris para Seasons & Stars: el año del valle con sus fiestas, mercados y días de guardar.
 * Año 62 desde la Fundación (DF). El Día 1 de la campaña es el martes 22 de marzo del 62.
 * Las fechas que solo sabe el DM no van aquí (este archivo se puede leer desde el navegador): están en el
 * Libro IV · 18, y el aviso del día se las susurra al DM.
 */

const M = (name, abbreviation, days, description) => ({ name, abbreviation, days, description });
const E = (id, name, recurrence, description, extra = {}) => ({
  id, name, recurrence, description, visibility: "player-visible", color: "#c8813a", icon: "fa-solid fa-calendar-day", ...extra
});
const fija = (month, day) => ({ type: "fixed", month, day });
const enesimo = (month, occurrence, weekday) => ({ type: "ordinal", month, occurrence, weekday });
const LUN = 0;
const DOM = 6;

/** Caravana de Oswin: cada seis semanas desde que llega para el Mercado de Primavera (solo el año 62). */
const CARAVANA = [[4, 16], [5, 28], [7, 9], [8, 20], [10, 1], [11, 12]];

export const CALENDARIO = {
  id: "arcegris",
  translations: {
    es: {
      label: "Calendario de Arcegris",
      description: "El año del Valle de Arcegris: doce meses, siete días, una luna y las fiestas del pueblo. Los años se cuentan desde la Fundación (DF).",
      setting: "Nimerios · Valle de Arcegris"
    },
    en: {
      label: "Arcegris Calendar",
      description: "The year of the Arcegris Valley (years since the Founding, DF).",
      setting: "Nimerios · Arcegris Valley"
    }
  },
  year: { epoch: 0, currentYear: 62, prefix: "", suffix: " DF", startDay: 6 },
  // El reloj del mundo ya corría: el día 29280 del reloj es el Día 1 de la campaña (22 de marzo del 62).
  worldTime: { interpretation: "real-time-based", epochYear: 19, currentYear: 1 },
  leapYear: { rule: "none" },
  months: [
    M("Enero", "Ene", 31, "Mes de la Brasa. Empieza el año con el Día de la Fundación y el fuego nuevo de la torre. Nieve en las laderas; se vive de reservas."),
    M("Febrero", "Feb", 28, "Mes del Hambre. Lo más duro del invierno: la leña escasea y se cuentan los sacos. Dos veces en sesenta años hubo hambre de verdad."),
    M("Marzo", "Mar", 31, "Mes del Barro. Deshielo, caminos imposibles y el río que empieza a bajar gris. Vuelve la tala a las parcelas bajas."),
    M("Abril", "Abr", 30, "Mes del Río Gris. Bendición del Río y Mercado de Primavera con la caravana de Oswin."),
    M("Mayo", "May", 31, "Mes de la Siembra. Todo el valle en los campos: la ventana de cultivo es de unos cinco meses."),
    M("Junio", "Jun", 30, "Mes de las Hogueras. Días largos, caminos secos y la noche más corta del año."),
    M("Julio", "Jul", 31, "Mes del Polvo. Calor corto y sequía justo cuando los cultivos más agua piden."),
    M("Agosto", "Ago", 31, "Mes de la Hoz. Empieza la siega; trabajan hasta los niños mayores y los ancianos."),
    M("Septiembre", "Sep", 30, "Mes de la Gavilla. Fin de la cosecha, primera molienda y el censo imperial."),
    M("Octubre", "Oct", 31, "Mes de las Provisiones. Feria de Otoño, Asamblea de Vecinos y la preparación para el invierno, lo más importante del año."),
    M("Noviembre", "Nov", 30, "Mes de la Nieve Alta. La nieve cierra las parcelas altas; matanza y ahumadero."),
    M("Diciembre", "Dic", 31, "Mes de la Larga Noche. El pueblo se junta alrededor del fuego de El Último Roble.")
  ],
  weekdays: [
    { name: "Lunes", abbreviation: "Lu", description: "Día del Concejo: los ancianos se reúnen en la sala del fuerte y atienden pleitos." },
    { name: "Martes", abbreviation: "Ma", description: "Día de trabajo." },
    { name: "Miércoles", abbreviation: "Mi", description: "Día de trabajo." },
    { name: "Jueves", abbreviation: "Ju", description: "Día de trabajo. La guardia cambia los turnos de la semana." },
    { name: "Viernes", abbreviation: "Vi", description: "Día de trabajo. Hessa hornea el pan dulce para el sábado." },
    { name: "Sábado", abbreviation: "Sá", description: "Día de plaza: mercado semanal en la plaza del fuerte." },
    { name: "Domingo", abbreviation: "Do", description: "Día de la Llama: la capilla abre para todos y muchos descansan." }
  ],
  intercalary: [],
  seasons: [
    { name: "Invierno", startMonth: 11, startDay: 1, endMonth: 3, endDay: 20, icon: "winter", description: "De noviembre a marzo: nieve en las laderas y cuatro meses viviendo de reservas. La leña vale oro.", sunrise: "07:30", sunset: "17:10" },
    { name: "Primavera", startMonth: 3, startDay: 21, endMonth: 6, endDay: 20, icon: "spring", description: "Deshielo, río gris y caminos de barro. Mercado de Primavera con la caravana de Oswin.", sunrise: "06:50", sunset: "19:00" },
    { name: "Verano", startMonth: 6, startDay: 21, endMonth: 8, endDay: 31, icon: "summer", description: "Corto y cálido, con sequía justo cuando los cultivos más necesitan agua.", sunrise: "05:25", sunset: "21:10" },
    { name: "Otoño", startMonth: 9, startDay: 1, endMonth: 10, endDay: 31, icon: "fall", description: "Cosecha y preparación para el invierno: lo más importante del año.", sunrise: "06:40", sunset: "19:40" }
  ],
  solarAnchors: [
    { id: "solsticio-invierno", label: "La Larga Noche", type: "solstice", subtype: "winter", month: 12, day: 21, sunrise: "08:05", sunset: "16:50" },
    { id: "equinoccio-primavera", label: "Fiesta del Deshielo", type: "equinox", subtype: "vernal", month: 3, day: 21, sunrise: "06:50", sunset: "19:00" },
    { id: "solsticio-verano", label: "Noche de las Hogueras", type: "solstice", subtype: "summer", month: 6, day: 21, sunrise: "05:20", sunset: "21:15" },
    { id: "equinoccio-otono", label: "Equinoccio de otoño", type: "equinox", subtype: "autumnal", month: 9, day: 22, sunrise: "06:35", sunset: "18:45" }
  ],
  time: { hoursInDay: 24, minutesInHour: 60, secondsInMinute: 60 },
  moons: [{
    name: "La Luna",
    cycleLength: 29.53059,
    firstNewMoon: { year: 62, month: 4, day: 4 },
    color: "#d8dde8",
    phases: [
      { name: "Luna nueva", length: 1, singleDay: true, icon: "new" },
      { name: "Creciente", length: 6.3826475, singleDay: false, icon: "waxing-crescent" },
      { name: "Cuarto creciente", length: 1, singleDay: true, icon: "first-quarter" },
      { name: "Gibosa creciente", length: 6.3826475, singleDay: false, icon: "waxing-gibbous" },
      { name: "Luna llena", length: 1, singleDay: true, icon: "full" },
      { name: "Gibosa menguante", length: 6.3826475, singleDay: false, icon: "waning-gibbous" },
      { name: "Cuarto menguante", length: 1, singleDay: true, icon: "last-quarter" },
      { name: "Menguante", length: 6.3826475, singleDay: false, icon: "waning-crescent" }
    ]
  }],
  dateFormats: {
    short: "{{ss-day}} {{ss-month format='abbr'}} {{year}}",
    long: "{{ss-weekday format='name'}} {{ss-day}} de {{ss-month format='name'}} del {{year}} DF",
    widgets: {
      mini: "{{ss-day}} {{ss-month format='abbr'}}",
      main: "{{ss-weekday format='name'}} {{ss-day}} de {{ss-month format='name'}}, año {{year}} DF",
      grid: "{{ss-month format='name'}} del {{year}} DF"
    }
  },
  events: [
    E("fundacion", "Día de la Fundación (Año Nuevo)", fija(1, 1),
      "Hace 62 años el Imperio retiró la guarnición y doce colonos se quedaron en las piedras del fuerte. Al mediodía se leen en la plaza los nombres de Los Doce; Orlan, el último fundador vivo, enciende el fuego nuevo en la torre y cada casa se lleva una brasa. Se cuenta un año más.",
      { color: "#d9822b", icon: "fa-solid fa-fire-flame-curved" }),
    E("apertura-tala", "Vuelve la tala", fija(3, 1),
      "La Leñería Holt sube otra vez a las parcelas bajas en cuanto el barro lo deja. Brennan paga una ronda en El Último Roble y se reparten las cuadrillas.",
      { color: "#7a5b3a", icon: "fa-solid fa-tree" }),
    E("deshielo", "Fiesta del Deshielo", fija(3, 21),
      "Primer día de la primavera del valle. Cuando el río baja gris, los niños echan barcos de corteza desde el Puente de Piedra y el primero que llega al vado «se lleva el invierno». Se queman en la plaza las esteras de paja del invierno.",
      { color: "#7fb3c8", icon: "fa-solid fa-water" }),
    E("bendicion-rio", "Bendición del Río", enesimo(4, 2, DOM),
      "Rito de la Llama Serena en el vado. La hermana Elira bendice el río, el puente y a los que van a viajar (carreteros, cazadores, la caravana que llega). Cada uno suelta una vela río abajo por los que no volvieron. Después, comida en la plaza.",
      { color: "#e8c35a", icon: "fa-solid fa-fire" }),
    E("mercado-primavera", "Mercado de Primavera", fija(4, 17),
      "El mercado grande del año. Llega la caravana de Oswin con telas, herramientas y libros; bajan granjeros de los valles vecinos y buhoneros del Imperio. Puestos en la plaza y en el vado, música, pulsos y carrera de sacos. Es cuando se pagan las deudas del invierno y se cobran los favores.",
      { duration: "3d", color: "#4caf50", icon: "fa-solid fa-store" }),
    E("siembra", "Semana de la Siembra", fija(5, 2),
      "Todo el valle a los campos. No hay sesión del Concejo; la panadería abre antes y la posada cierra temprano. Quien no tiene tierra se alquila por jornal.",
      { duration: "7d", color: "#8bc34a", icon: "fa-solid fa-seedling" }),
    E("hogueras", "Noche de las Hogueras", fija(6, 23),
      "La noche más corta. Hogueras en el vado y en la plaza: se salta el fuego para tener suerte y se queman papeles con lo que uno quiere dejar atrás. Los mozos se declaran y los viejos cuentan cómo era el fuerte.",
      { startTime: "20:00", duration: "10h", color: "#ff7043", icon: "fa-solid fa-fire-burner" }),
    E("caminantes", "Día de los Caminantes", fija(7, 1),
      "Con los caminos secos, la Llama Serena bendice a los que salen de viaje: pan y sal en la puerta oeste y una oración por el camino a Castrum Ignis.",
      { color: "#e8c35a", icon: "fa-solid fa-person-walking" }),
    E("siega", "Empieza la siega", fija(8, 22),
      "Se afilan las hoces en la herrería de Marta y empiezan los días más largos del año para los granjeros. Durante la siega trabaja todo el que puede.",
      { color: "#d4a017", icon: "fa-solid fa-wheat-awn" }),
    E("censo", "Censo y tributo imperial", fija(9, 1),
      "Primer censo desde que hay Embajada: un escribano de Zaraki recorre las casas y anota bocas, tierras y oficios. Nadie sabe todavía cuánto se va a cobrar.",
      { startYear: 62, color: "#8e2a2a", icon: "fa-solid fa-scroll" }),
    E("ultima-gavilla", "Fiesta de la Última Gavilla", fija(9, 20),
      "Fin de la cosecha. La última gavilla de trigo se ata con cintas y se cuelga en la capilla. Baile en el granero de los Voss; Aldric paga la cerveza y se encarga de que se note.",
      { color: "#d4a017", icon: "fa-solid fa-wheat-awn-circle-exclamation" }),
    E("primera-molienda", "Primera Molienda", fija(9, 27),
      "El molino de Piet muele el primer grano del año. Sara reparte en la puerta el primer pan de harina nueva.",
      { color: "#b0a080", icon: "fa-solid fa-bread-slice" }),
    E("asamblea", "Asamblea de Vecinos", enesimo(10, 1, LUN),
      "Una vez al año, después de la cosecha, el Concejo de los siete rinde cuentas ante los vecinos en el patio del fuerte. Si hay un asiento vacío, se vota allí mismo, por méritos y a mano alzada. Cualquiera puede hablar; casi nadie lo hace.",
      { color: "#5c6bc0", icon: "fa-solid fa-landmark" }),
    E("feria-otono", "Feria de Otoño", fija(10, 8),
      "El último mercado antes del invierno: sal, aceite, mechas, lana y herraduras. La caravana hace su último viaje largo y se fija el precio de la leña del invierno.",
      { duration: "3d", color: "#a1662f", icon: "fa-solid fa-basket-shopping" }),
    E("primera-helada", "Día de la Primera Helada", fija(10, 20),
      "Por costumbre, el día en que se espera la primera helada: se tapan las huertas, se baja el ganado de los pastos altos y el Concejo reparte leña a las viudas.",
      { color: "#90caf9", icon: "fa-solid fa-snowflake" }),
    E("umbrales", "Noche de los Umbrales", fija(10, 31),
      "La víspera del invierno. La Llama Serena enseña que esa noche los umbrales están abiertos: se deja una vela en cada puerta por los que se fueron y no se cruza el umbral de una casa ajena sin permiso. Misa de difuntos en la capilla; Sorin toca la campana a medianoche.",
      { startTime: "18:00", duration: "12h", color: "#6a5acd", icon: "fa-solid fa-door-open" }),
    E("matanza", "Día de la Matanza", fija(11, 11),
      "Se matan los cerdos del año y el ahumadero de los Tarn trabaja día y noche. Caldo y morcilla para todos en la plaza.",
      { color: "#8d4e3a", icon: "fa-solid fa-drumstick-bite" }),
    E("cierre-tala", "Cierre de la tala", fija(11, 15),
      "La nieve cierra las parcelas altas. La Leñería Holt hace cuentas, paga lo que debe y despide a los jornaleros de temporada.",
      { color: "#7a5b3a", icon: "fa-solid fa-tree" }),
    E("larga-noche", "La Larga Noche", fija(12, 21),
      "La noche más larga. Todo el pueblo junto al fuego de El Último Roble: Garrick sirve caldo gratis y se cuentan las historias de Los Doce hasta el alba. Dicen que quien se duerme antes del amanecer sueña con el fuerte.",
      { startTime: "17:00", duration: "15h", color: "#3949ab", icon: "fa-solid fa-moon" }),
    ...[3, 6, 9, 12].map(m => E(`concejo-${m}`, "Concejo abierto", enesimo(m, 1, LUN),
      "Sesión del Concejo abierta a los vecinos en la sala del fuerte: pleitos de linderos, peajes, licencias y quejas. Se pide la palabra al presidente.",
      { color: "#5c6bc0", icon: "fa-solid fa-gavel" })),
    ...CARAVANA.map(([m, d], i) => E(`caravana-${i + 1}`, "Llega la caravana de Oswin", fija(m, d),
      "La caravana de Oswin cruza el vado (pasa cada seis semanas): telas, herramientas, libros y noticias del Imperio. Repone las tiendas que venden cosas de fuera.",
      { startYear: 62, endYear: 62, color: "#26a69a", icon: "fa-solid fa-horse" })),
    // Fechas del DM: el contenido está en el Libro IV · 18 (este archivo lo puede leer cualquiera).
    ...[[3, 22], [4, 17], [9, 28], [10, 20]].map(([m, d]) => E(`dm-${m}-${d}`, "Nota del DM (Libro IV · 18)", fija(m, d),
      "Mira el Libro IV · 18.", { visibility: "gm-only", color: "#555555", icon: "fa-solid fa-eye-slash" }))
  ]
};

/* ---------------------------------------------------------------------- */
/*  Cálculos propios (para el aviso de cada día)                           */
/* ---------------------------------------------------------------------- */
const LARGO_MES = CALENDARIO.months.map(m => m.days);
const diaDelAno = (mes, dia) => LARGO_MES.slice(0, mes - 1).reduce((a, b) => a + b, 0) + dia;
const LARGO_ANO = LARGO_MES.reduce((a, b) => a + b, 0);
const absoluto = d => (d.year * LARGO_ANO) + diaDelAno(d.month, d.day);
const horas = s => {
  const m = String(s ?? "1d").match(/^(\d+)([smhdw])$/);
  if (!m) return 24;
  return Number(m[1]) * { s: 1 / 3600, m: 1 / 60, h: 1, d: 24, w: 168 }[m[2]];
};

/** Día del mes en que cae una fecha ordinal (1.er lunes, último domingo…) dado un día conocido del mismo mes. */
function diaOrdinal(r, d) {
  const n = CALENDARIO.weekdays.length;
  const sem1 = (((d.weekday - (d.day - 1)) % n) + n) % n;
  const primero = 1 + ((((r.weekday - sem1) % n) + n) % n);
  if (r.occurrence > 0) return primero + (7 * (r.occurrence - 1));
  let ultimo = primero;
  while (ultimo + 7 <= LARGO_MES[d.month - 1]) ultimo += 7;
  return ultimo;
}

/** Eventos que tocan una fecha {year, month, day, weekday}. Devuelve [{ev, dia, de}] (día n de m si dura varios). */
export function eventosDelDia(d, { dm = false } = {}) {
  const out = [];
  const hoy = absoluto(d);
  for (const ev of CALENDARIO.events) {
    if (!dm && (ev.visibility === "gm-only")) continue;
    if (ev.startYear && (d.year < ev.startYear)) continue;
    if (ev.endYear && (d.year > ev.endYear)) continue;
    const r = ev.recurrence;
    let ini = null;
    if (r.type === "fixed") ini = absoluto({ year: d.year, month: r.month, day: r.day });
    else if ((r.type === "ordinal") && (r.month === d.month)) ini = absoluto({ year: d.year, month: r.month, day: diaOrdinal(r, d) });
    if (ini === null) continue;
    const dias = Math.max(1, Math.ceil(horas(ev.duration) / 24));
    if ((hoy >= ini) && (hoy < ini + dias)) out.push({ ev, dia: hoy - ini + 1, de: dias });
  }
  return out;
}

/** Fase de la luna para una fecha: { nombre, nueva, llena }. */
export function faseLunar(d) {
  const luna = CALENDARIO.moons[0];
  const ref = absoluto({ year: luna.firstNewMoon.year, month: luna.firstNewMoon.month, day: luna.firstNewMoon.day });
  const pos = ((((absoluto(d) - ref) % luna.cycleLength) + luna.cycleLength) % luna.cycleLength);
  let acc = 0;
  for (const f of luna.phases) {
    if (pos < acc + f.length - 1e-6) return { nombre: f.name, nueva: f.icon === "new", llena: f.icon === "full" };
    acc += f.length;
  }
  return { nombre: luna.phases.at(-1).name, nueva: false, llena: false };
}

/** El Día de la campaña (Día 1 = 22 de marzo del 62). */
export const diaCampana = d => absoluto(d) - absoluto({ year: 62, month: 3, day: 22 }) + 1;

/** La fecha k días después (o antes) de d, con su día de la semana. */
export function sumarDias(d, k) {
  let { year, month, day } = d;
  day += k;
  while (day > LARGO_MES[month - 1]) {
    day -= LARGO_MES[month - 1];
    month++;
    if (month > 12) {
      month = 1;
      year++;
    }
  }
  while (day < 1) {
    month--;
    if (month < 1) {
      month = 12;
      year--;
    }
    day += LARGO_MES[month - 1];
  }
  const n = CALENDARIO.weekdays.length;
  return { year, month, day, weekday: ((((d.weekday ?? 0) + k) % n) + n) % n };
}

/** Mes del «Calendario del primer año» (Libro IV · 12): el Mes 1 es lo que queda de marzo del 62. */
export const mesPrimerAno = d => ((d.year - 62) * 12) + d.month - 2;
