/**
 * 3.31 · Explicaciones para el DM que no conoce el módulo (pedido del autor): cada desplegable del despertar y de la
 * pestaña DM dice qué es y qué significa la opción elegida para el jugador. Puro: solo textos, sin Foundry.
 */
export const ETAPAS_JUGADOR = {
  1: { titulo: "Aprendiz", resumen: "Recién despertado: siente el Verbe y aprende con alguien al lado.",
    puede: ["Ve su barra de Verbe, la habilidad Control y el panel del Verbe en su hoja.",
      "Aprende técnicas de una sola rama, de grado 0 y 1 (las más simples: un golpe reforzado, un salto, un sentido).",
      "Gasta Trazos para aprender y Verbe para usar. Su reserva al despertar es su dado más su modificador de CON."],
    noPuede: ["Abrir una segunda rama.", "Descubrir su naturaleza (fuego, agua, viento, tierra o rayo): eso empieza en Practicante.", "Técnicas de grado 2 o más."],
    mesa: "En combate tiene 1 o 2 trucos por pelea; el resto lo hace con D&D. Es la etapa para un personaje que recién empieza a entrenar." },
  2: { titulo: "Practicante", resumen: "Entrena con guía y empieza a encontrar su forma.",
    puede: ["Hasta dos ramas.", "Técnicas hasta grado 3.", "Entrenar para descubrir su naturaleza (desde nivel 5, o nivel 3 con rango Entrenado en Forma): cuesta Trazos, días y una prueba de Control."],
    noPuede: ["Una tercera rama.", "Técnicas de grado 4 o más."],
    mesa: "Ya cambia peleas: ablanda defensas con Brecha o Grieta, se escapa con Sustitución y usa su elemento." },
  3: { titulo: "Iniciado", resumen: "Domina lo básico y elige su camino.",
    puede: ["Hasta cuatro ramas.", "Técnicas hasta grado 6 (las de grado 6 piden además Maestría en su rama)."],
    noPuede: ["Las técnicas de grado 7 o más."],
    mesa: "Es un usuario serio del Verbe: un ejército normal no puede con él. Las facciones empiezan a quererlo." },
  4: { titulo: "Pleno", resumen: "Sin techo de etapa.",
    puede: ["Todas las ramas que abra.", "Cualquier grado que permitan su nivel, su rango en cada rama y sus dotes."],
    noPuede: ["Nada por la etapa; lo limita su nivel, sus rangos y la historia."],
    mesa: "La etapa de los maestros. Solo dásela a quien ya entrenó con alguien que la tenga, o por un hito enorme." }
};

/** Qué es cada campo. */
export const AYUDA_CAMPO = {
  car: "La característica con la que maneja el Verbe. Se suma a la dificultad (CD) de sus técnicas, a su ataque con técnicas y a sus pruebas de Control del Verbe. No cambia cuánto Verbe tiene: eso sale del dado y de la CON. Elige la característica alta del personaje que mejor le pegue a cómo pelea.",
  etapa: "Cuánto le abrió el Verbe quien le enseña: cuántas ramas puede usar y hasta qué grado de técnica. Es el freno de la historia: aunque suba de nivel, no pasa de su etapa hasta que alguien le enseñe más (tú lo abres con «Abrir la siguiente etapa»).",
  natModo: "Cómo conoce su primera naturaleza (el elemento de su Verbe: fuego, agua, viento, tierra o rayo). Las técnicas de un elemento solo funcionan del todo si es suyo.",
  segundaModo: "Más adelante puede descubrir una segunda naturaleza. Aquí decides si saldrá al azar con su dado o si la fijas tú (la «naturaleza oculta» de abajo).",
  nat: "Si la fijas, la primera naturaleza ya queda decidida. Déjala en blanco para que salga al azar o la elija el jugador, según el modo de arriba.",
  oculta: "La segunda naturaleza que tiene escondida. Solo la ves tú. Si el modo de la segunda es «la fijas tú», esta es la que descubrirá.",
  linaje: "La sangre de un dios que lleva (o ninguna). Le da una herencia, abre la rama Sangre y, desde 3.31, el legado de ese dios: un árbol de dotes propias que solo tú concedes. Lo eliges siempre tú; el jugador nunca lo elige.",
  familia: "Las artes de familia (Crecer, Sombra, Mente, Enjambre, Colmillo, Tinta). Desde 3.31 cada familia es parte del legado de un dios: quien lleva esa sangre con cualquier fuerza ya tiene su familia. Este desplegable sirve para dar una familia sin la sangre (por adopción, un pacto o la historia).",
  fuerza: "Cuánto de esa sangre lleva. Rastro, Débil, Media o Plena: más fuerza abre técnicas de Sangre más altas, más dones y más escalones de su legado.",
  linajeVisible: "Si el jugador sabe de qué sangre viene. Si no lo sabe, en su panel dice «Desconocido»: no ve la rama Sangre ni su legado hasta que se lo reveles.",
  principal: "Su especialidad de partida. En su rama principal cada rango cuesta 1 Trazo menos y los dones llegan un rango antes. Déjala en blanco si quieres que la elija el jugador.",
  reservaModo: "Cómo crece su Verbe al subir de nivel. «Tirar dados» es como los PG: cada nivel tira su dado. «Promedio» usa la tabla fija. En los dos casos suma su modificador de CON por nivel.",
  lleno: "Si empieza con la barra llena. Desmárcalo si despierta herido o agotado: entonces empieza vacía y la recupera descansando (lleva varios días)."
};

const MODOS_TXT = {
  dado: "La descubre entrenando y la tira con un dado: ni tú ni el jugador saben cuál será. Lo más emocionante en mesa.",
  secreta: "Tú la fijas ahora y él la descubre entrenando. Útil si la historia ya decidió su elemento.",
  elige: "Cuando la descubra entrenando, el jugador elige cuál. Útil para jugadores que ya tienen una idea.",
  visible: "La sabe desde el principio: puede usar técnicas de su elemento de inmediato. Úsalo para PNJ o personajes ya formados."
};
const SEGUNDA_TXT = {
  dado: "Cuando le toque descubrirla, la tira con un dado (no repite la primera).",
  fija: "La que elegiste en «Naturaleza oculta» es la que descubrirá."
};
const CARS_TXT = {
  int: "Inteligencia: para quien piensa sus técnicas, usa sellos y lee al rival.",
  wis: "Sabiduría: para quien siente el Verbe, percibe, cura y engaña los sentidos.",
  cha: "Carisma: para quien impone, ilusiona o usa la voz.",
  con: "Constitución: para quien aguanta; su Verbe es tan duro como su cuerpo.",
  str: "Fuerza: para quien pelea con el cuerpo y golpea con el Verbe.",
  dex: "Destreza: para quien es rápido y preciso."
};
const RESERVA_TXT = {
  dados: "Cada nivel tira su dado: algunos tendrán más Verbe, otros menos. Siempre suma la CON.",
  promedio: "Todos los del mismo nivel tienen lo mismo (la tabla), más su CON."
};

/** HTML de la ayuda de un campo (un desplegable cerrado). */
export function ayudaCampoHTML(clave, esc = s => s) {
  const t = AYUDA_CAMPO[clave];
  return t ? `<details class="ecos-ayuda-campo"><summary>¿Qué es esto?</summary><p>${esc(t)}</p></details>` : "";
}
/** Lo que significa la etapa elegida para el jugador. */
export function etapaJugadorHTML(n, esc = s => s) {
  const e = ETAPAS_JUGADOR[Number(n)];
  if (!e) return "";
  return `<p><b>${esc(e.titulo)}:</b> ${esc(e.resumen)}</p><p><b>Puede:</b></p><ul>${e.puede.map(x => `<li>${esc(x)}</li>`).join("")}</ul>`
    + `<p><b>Todavía no puede:</b></p><ul>${e.noPuede.map(x => `<li>${esc(x)}</li>`).join("")}</ul><p><b>En la mesa:</b> ${esc(e.mesa)}</p>`;
}
/**
 * La explicación de una opción de los desplegables nuevos. `ctx` puede traer `familias` ({id: {nombre, dios}}),
 * `linajes` (lista del catálogo) y `ramas` (lista) para nombrar el dios o la rama.
 */
export function explicarOpcion(tipo, valor, ctx = {}, esc = s => s) {
  if (tipo === "etapa") return etapaJugadorHTML(valor, esc);
  if (tipo === "car") return CARS_TXT[valor] ? `<p>${esc(CARS_TXT[valor])}</p>` : "";
  if (tipo === "natModo") return MODOS_TXT[valor] ? `<p>${esc(MODOS_TXT[valor])}</p>` : "";
  if (tipo === "segundaModo") return SEGUNDA_TXT[valor] ? `<p>${esc(SEGUNDA_TXT[valor])}</p>` : "";
  if (tipo === "reservaModo") return RESERVA_TXT[valor] ? `<p>${esc(RESERVA_TXT[valor])}</p>` : "";
  if (tipo === "familia") {
    if (!valor || valor === "ninguna") return `<p>Sin familia por historia. Si su linaje es el de un dios con familia, igual la tendrá por la sangre.</p>`;
    const f = ctx.familias?.[valor];
    if (!f) return "";
    const l = (ctx.linajes ?? []).find(x => x.id === f.dios);
    const dueno = ctx.nombreLegado?.(f.dios) ?? (l ? (l.alias ?? l.nombre) : f.dios);
    const aviso = ctx.linaje && ctx.linaje !== "ninguno" && f.dios && ctx.linaje !== f.dios
      ? `<p class="ecos-aviso"><b>Ojo:</b> esta familia es parte del ${esc(dueno)}, y el linaje elegido es otro. Está bien si la historia lo explica (adopción, pacto); si no, elige «Sin familia» y deja que la sangre decida.</p>` : "";
    return `<p><b>${esc(f.nombre)}</b> · parte del <b>${esc(dueno)}</b>. Sus artes solo las aprende quien nace en ella.</p>${aviso}`;
  }
  if (tipo === "principal") {
    if (!valor) return `<p>El jugador la elegirá en su panel la primera vez que lo abra.</p>`;
    const r = (ctx.ramas ?? []).find(x => x.id === valor);
    return r ? `<p><b>${esc(r.nombre)}</b> será su especialidad: rangos 1 Trazo más baratos y dones un rango antes.</p>` : "";
  }
  return "";
}
/** Qué familia trae una sangre al despertar (para precargar el desplegable). Puro. */
export function familiaSugerida(familias, linajes, linajeId) {
  if (!linajeId || linajeId === "ninguno") return "ninguna";
  const l = (linajes ?? []).find(x => x.id === linajeId), dios = l?.dios ?? l?.id ?? linajeId;
  return Object.entries(familias ?? {}).find(([, f]) => f.dios === dios)?.[0] ?? "ninguna";
}
/** Explicación de las ramas antes de aprender técnicas (panel Aprender). */
export const RAMAS_PRIMERO = {
  titulo: "Antes de elegir técnicas: tu rama manda",
  texto: [
    "Una rama es una especialidad del Verbe (Cuerpo, Forma, Velo, Sello, Pulso…). Cada técnica pertenece a una rama.",
    "Tu rango en una rama decide hasta qué grado puedes aprender sus técnicas. Sin subir la rama, sus técnicas fuertes quedan cerradas.",
    "Desde Experto, cada rango que subes suma un dado a todas las técnicas de esa rama que dañan o curan y te da un don de la rama: subir la rama potencia todo lo que ya sabes, no solo lo nuevo.",
    "Por eso el orden es: primero sube tu rama (Mejorar → Especialidades), después aprende aquí las técnicas que esa rama abre.",
    "Las dotes (Mejorar → Dotes) son el otro camino: potencian técnicas y acciones (más alcance, menos coste, más ruptura, sinergias)."
  ]
};

/** Qué hace cada sección de la pestaña DM del panel (para quien no conoce el módulo). */
export const AYUDA_SECCION = {
  "Reorientar un cultivo sin volver a cobrar": "Si cambiaste cómo funciona una técnica y el jugador ya la había mejorado en «Entrenar técnicas», aquí cambias su última mejora por otra sin cobrarle de nuevo.",
  "Archivo del Verbe: tradiciones, bestias y rituales": "Lo que se gana solo por historia y nunca con Trazos: tradiciones secretas (escuelas cerradas), hitos (logros que abren técnicas), una bestia vinculada, rituales preparados, el desgaste de los ojos y reliquias equipadas. Lo das tú cuando la historia lo justifique.",
  "Trazos": "Los Trazos son los puntos para aprender: técnicas, rangos de rama y dotes. Se ganan 4 por nivel (más 4 al despertar). Aquí das o quitas Trazos extra: premios, Monedas Antiguas o correcciones.",
  "Deshacer compras": "Si el jugador se equivocó al comprar algo, deshazlo aquí: vuelven los Trazos que pagó.",
  "Cambiar a mano (no toca los Trazos)": "Arreglos directos y gratis: característica del Verbe, naturaleza, rama principal, rango en una rama, afinidad, Control, dotes y técnicas. Úsalo para armar PNJ o corregir errores; al jugador no le cuesta nada.",
  "Reserva de Verbe: dados o promedio": AYUDA_CAMPO.reservaModo,
  "Etapa del Verbe (quién le enseña)": AYUDA_CAMPO.etapa + " Debajo, cada etapa dice qué puede y qué no puede hacer el jugador.",
  "Naturaleza secreta": "Los elementos de su Verbe (fuego, agua, viento, tierra, rayo). Nadie los sabe al despertar: se descubren entrenando. Aquí decides cómo se descubre la primera y la segunda, y cuál está escondida.",
  "Naturalezas y linaje": AYUDA_CAMPO.linaje + " " + AYUDA_CAMPO.familia,
  "Ramas, ojos, pactos y escuela": "Abrir una rama que está cerrada (Sangre, Mirada y otras solo se abren por historia), despertar un ojo y subir su etapa, dar un pacto o una escuela (técnicas propias de un maestro o un lugar).",
  "Aprender al instante (creación de personaje)": "Aprender una técnica normalmente lleva días de práctica con tiradas. Para un personaje que ya llega formado, o para un PNJ, actívalo: aprende al pagar.",
  "Defensa de la campaña (Coraza, Fortaleza o Cuerpo sordo)": "Las criaturas de VD ½ o más llevan una defensa alta: Coraza (sube la CA), Fortaleza (sube las salvaciones) o Cuerpo sordo (resiste el daño). D&D pega fuerte; el Verbe ablanda esa defensa con Brecha (−2 CA), Grieta (−2 salvaciones) y Quebrado (sin defensa ni resistencias).",
  "Herramientas": "Atajos del DM: abrir un choque de técnicas, quitar el Verbe o revisar la ficha."
};
export const ayudaSeccionHTML = (titulo, esc = s => s) => AYUDA_SECCION[titulo] ? `<p class="ecos-ayuda-sec">${esc(AYUDA_SECCION[titulo])}</p>` : "";
