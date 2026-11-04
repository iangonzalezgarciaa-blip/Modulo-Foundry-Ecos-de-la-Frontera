/**
 * Acciones de cualquiera (3.12, pedido del autor): lo que una persona común puede intentar, dentro y fuera del combate,
 * con las seis características. Todas las hojas reciben «Golpe sin armas» y seis rasgos («Acciones de Fuerza»,
 * «… de Destreza», etc.), cada uno con sus actividades de dnd5e. Si la clase ya trae algo mejor (un monje o un
 * pugilista con su golpe sin armas), manda lo de la clase.
 *
 * Las CD salen de la característica de quien actúa: 8 + modificador + competencia. Así, quien tiene 20 de Fuerza
 * derriba a más gente que quien tiene 10: son súper criaturas y las estadísticas pesan.
 *
 * Las definiciones y el HTML son puros (se prueban sin Foundry). `asegurarAccionesComunes` y los ganchos corren en Foundry.
 */
import { cambio } from "./compat.js";

const MOD = "ecos-frontera";
export const VERSION_ACCIONES = 3;
const DESPREVENIDO = "ecosDesprevenido";
const S = "systems/dnd5e/icons/svg/";
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const ACT = { action: "Acción", bonus: "Acción adicional", reaction: "Reacción", special: "Durante tu movimiento o fuera de combate" };
const NOMBRE_CAR = { str: "Fuerza", dex: "Destreza", con: "Constitución", int: "Inteligencia", wis: "Sabiduría", cha: "Carisma" };
const CORTO = { str: "FUE", dex: "DES", con: "CON", int: "INT", wis: "SAB", cha: "CAR" };

/** Id estable de 16 caracteres a partir de un texto (actividades y efectos no cambian de id entre versiones). */
export function idEstable(texto) {
  const abc = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let h = 2166136261 >>> 0;
  for (const c of String(texto)) { h ^= c.codePointAt(0); h = Math.imul(h, 16777619) >>> 0; }
  let out = "";
  for (let i = 0; i < 16; i++) { h ^= h << 13; h >>>= 0; h ^= h >>> 17; h ^= h << 5; h >>>= 0; out += abc[h % 62]; }
  return out;
}

/**
 * Las acciones. Cada una es una actividad de dnd5e:
 *  - save: el objetivo salva `salv` contra 8 + `cd` + competencia de quien actúa (las de D&D base), o contra 8 + el bono
 *    de la pericia `cdPericia` de quien actúa (la mejor si hay varias; 3.14): así cuentan la competencia y la Pericia doble.
 *  - check: quien actúa hace una prueba (`car` y `pericias`), con `cdFija` si la hay.
 *  - utility: se aplica `efecto` a uno mismo o a quien se marque.
 *  - heal: PG temporales.
 * `pf2e` es la acción equivalente de Pathfinder 2e (o null si en PF2e es una acción propia de Ecos).
 * `base` es el nombre de la regla del Manual del jugador (2024) cuando la acción ya existe en D&D: se resuelve igual que en
 * el Manual y Ecos solo le pone el botón. Sin `base`, la acción es de Ecos y se suma a lo del Manual sin quitar nada (3.14).
 */
export const ACCIONES = [
  { car: "str", acciones: [
    { id: "presa", nombre: "Presa", act: "action", tipo: "save", salv: ["str", "dex"], cd: "str", estado: "grappled", alcance: 5, pf2e: "Grapple", base: "Presa (Golpe sin armas)",
      texto: "Sujetas a una criatura a 1,5 m, de hasta una categoría de tamaño más que tú, con una mano libre. Va en lugar de uno de tus ataques. Si falla, queda Agarrada (velocidad 0). Puedes moverte arrastrándola a mitad de velocidad. Se suelta con su acción: Atletismo o Acrobacias contra la misma CD." },
    { id: "derribar", nombre: "Empujón: derribar", act: "action", tipo: "save", salv: ["str", "dex"], cd: "str", estado: "prone", alcance: 5, pf2e: "Trip", base: "Empujón (Golpe sin armas)",
      texto: "Empujas al suelo a una criatura a 1,5 m, de hasta una categoría de tamaño más que tú. Va en lugar de uno de tus ataques. Si falla, queda Derribado." },
    { id: "apartar", nombre: "Empujón: apartar", act: "action", tipo: "save", salv: ["str", "dex"], cd: "str", alcance: 5, pf2e: "Shove", base: "Empujón (Golpe sin armas)",
      texto: "Apartas 1,5 m a una criatura a 1,5 m, de hasta una categoría de tamaño más que tú. Va en lugar de uno de tus ataques. Sirve para tirarla por un borde, a un fuego o fuera de una puerta." },
    { id: "lanzar", nombre: "Lanzar a quien sujetas", act: "action", tipo: "save", salv: ["str"], cd: "str", estado: "prone", dano: [1, 6, "bludgeoning"], alcance: 5, pf2e: null,
      texto: "Arrojas a quien tienes Agarrado hasta 3 m (4,5 m con Fuerza 18 o más). Si falla, cae Derribado y recibe 1d6 contundente. La presa termina." },
    { id: "abrirse-paso", nombre: "Abrirse paso", act: "special", tipo: "save", salv: ["str"], cdPericia: ["ath"], alcance: 5, pf2e: null,
      texto: "Una vez por turno, durante tu movimiento, intentas cruzar el espacio de un enemigo. Si falla, pasas (cuenta como terreno difícil). Si es dos tamaños más pequeño que tú, además cae Derribado." },
    { id: "escapar", nombre: "Escapar o forzar", act: "action", tipo: "check", pericias: ["ath", "acr"], pf2e: "Escape / Force Open", base: "Escapar de una presa",
      texto: "Te sueltas de una presa (contra la CD de quien te sujeta, como en el Manual) o fuerzas algo: puerta de madera CD 15, reforzada 20, grilletes 20, barrotes 25." }
  ] },
  { car: "dex", acciones: [
    { id: "zancadilla", nombre: "Zancadilla", act: "action", tipo: "save", salv: ["dex"], cdPericia: ["acr"], estado: "prone", alcance: 5, pf2e: "Trip",
      texto: "Con el pie, un arma de asta o un látigo. Va en lugar de uno de tus ataques. Si falla, queda Derribado. Es el derribo de quien no tiene fuerza pero sí maña." },
    { id: "desarmar", nombre: "Desarmar", act: "action", tipo: "save", salv: ["str", "dex"], cdPericia: ["ath", "acr"], alcance: 5, pf2e: "Disarm",
      texto: "Usa tu Atletismo o tus Acrobacias, el mejor. Va en lugar de uno de tus ataques. Si falla, suelta un objeto que sostiene: cae a sus pies, o a tu mano si la tienes libre. Con dos manos en el arma, salva con ventaja." },
    { id: "esquivar", nombre: "Esquivar", act: "action", tipo: "utility", efecto: { nombre: "Esquivando", statuses: ["dodging"], img: `${S}statuses/dodging.svg` }, pf2e: null, base: "Esquivar",
      texto: "Hasta el inicio de tu siguiente turno, los ataques contra ti tienen desventaja si ves al atacante y tus salvaciones de Destreza tienen ventaja. Se pierde si quedas incapacitado o con velocidad 0." },
    { id: "cubrirse", nombre: "Ponerse a cubierto", act: "bonus", tipo: "utility", efecto: { nombre: "A cubierto", statuses: ["coverThreeQuarters"], img: `${S}statuses/cover-three-quarters.svg` }, pf2e: "Take Cover",
      texto: "La cobertura del Manual sigue igual y no cuesta nada: detrás de una mesa o una esquina ya tienes cobertura media (+2 a la CA y a las salvaciones de Destreza). Esta acción es para cuando ya la tienes: te agachas y la pegas a ti, y pasa a cobertura de tres cuartos (+5) hasta el inicio de tu siguiente turno. El movimiento que te quede se reduce a la mitad. No suma con otra cobertura: vale la mejor." },
    { id: "voltereta", nombre: "Voltereta", act: "special", tipo: "save", salv: ["dex"], cdPericia: ["acr"], alcance: 5, pf2e: "Tumble Through",
      texto: "Una vez por turno, durante tu movimiento, cruzas por el espacio de un enemigo rodando o saltando. Si falla, pasas, y cruzar su espacio no le da un ataque de oportunidad. Salir de su alcance después sí se lo da, como en el Manual; para eso está Destrabarse." },
    { id: "birlar", nombre: "Birlar", act: "action", tipo: "save", salv: ["wis"], cdPericia: ["slt"], alcance: 5, pf2e: "Steal / Palm an Object",
      texto: "Le quitas o le dejas un objeto pequeño que no tenga en la mano: una bolsa, una llave, una carta. Si falla, no se da cuenta. Si supera por 5 o más, te pilla." },
    { id: "polvo", nombre: "Polvo en los ojos", act: "action", tipo: "save", salv: ["con"], cd: "dex", alcance: 5,
      efecto: { nombre: "Polvo en los ojos", statuses: ["blinded"], img: `${S}statuses/blinded.svg` }, pf2e: null,
      texto: "Arena, ceniza o sal a la cara. Si falla, queda Cegado hasta el final de su próximo turno. Una vez por combate contra la misma criatura: después ya se cuida. Se quita con «Sacudirse»." },
    { id: "apuntar", nombre: "Apuntar", act: "bonus", tipo: "utility", efecto: { nombre: "Apuntando", img: `${S}abilities/dexterity.svg`, cambios: [["system.bonuses.rwak.attack", "add", "2"]] }, pf2e: null,
      texto: "Solo si no te has movido este turno: +2 a tus ataques a distancia hasta el final del turno. Después tu velocidad es 0 hasta el final del turno. Si tu clase tiene Apuntar con firmeza (pícaro), esa es mejor: da ventaja." },
    { id: "interponerse", nombre: "Interponerse", act: "reaction", tipo: "utility", alcance: 5,
      efecto: { nombre: "Protegido", img: "systems/dnd5e/icons/svg/checked-shield.svg", cambios: [["system.attributes.ac.bonus", "add", "2"]], turnos: 1 }, pf2e: null,
      texto: "Cuando una criatura que ves ataca a un aliado que está a 1,5 m de ti: el aliado tiene +2 a la CA contra ese ataque (pon este efecto en él). Si aun así impacta, el daño lo recibes tú en vez de él. No puedes si estás Incapacitado, Agarrado o con velocidad 0. Si tienes el estilo de combate Protección o Intercepción, puedes usar ese en su lugar: es la misma reacción." },
    { id: "esconderse", nombre: "Esconderse", act: "action", tipo: "check", pericias: ["ste"], cdFija: 15, pf2e: "Hide / Sneak", base: "Esconderse",
      texto: "Como en el Manual: muy oscuro o tras cobertura de tres cuartos o total, y fuera de la vista de los enemigos. Sigilo CD 15. Si lo logras, ponte el estado Escondido: los demás te buscan con su Percepción contra tu tirada." }
  ] },
  { car: "con", acciones: [
    { id: "aguantar", nombre: "Aguantar", act: "bonus", tipo: "utility",
      efecto: { nombre: "Aguantando", img: `${S}abilities/constitution.svg`, cambios: [["system.abilities.str.bonuses.save", "add", "2"], ["system.abilities.con.bonuses.save", "add", "2"]] }, pf2e: null,
      texto: "Te plantas y aprietas los dientes: +2 a las salvaciones de Fuerza y Constitución hasta el inicio de tu siguiente turno. Sirve contra Presa, Empujón, venenos y para no perder la concentración." },
    { id: "sacudirse", nombre: "Sacudirse", act: "action", tipo: "check", car: "con", pf2e: null,
      texto: "Terminas un efecto no mágico que te ciega, te ensordece o te envenena (polvo en los ojos, humo, un veneno leve) si superas su CD: la que te pidieron al salvar." },
    { id: "resistir", nombre: "Resistir", act: "special", tipo: "check", car: "con", pf2e: null,
      texto: "Fuera de combate, lo que el Manual ya pide: aguantar la respiración (1 + tu CON minutos, mínimo 30 segundos), una marcha forzada (salvación de CON CD 10 + 1 por hora de más), el frío, el hambre o una noche en vela. Las consecuencias son las del Manual. Para lo que el Manual no cubre, el DM pone la CD." }
  ] },
  { car: "int", acciones: [
    { id: "evaluar", nombre: "Evaluar al enemigo", act: "action", tipo: "check", pericias: ["arc", "his", "nat", "rel"], pf2e: "Recall Knowledge", base: "Estudiar",
      texto: "La acción Estudiar del Manual aplicada a una criatura que ves. Arcanos (constructos, elementales, aberraciones), Historia (humanoides y órdenes), Naturaleza (bestias, plantas, monstruosidades) o Religión (no muertos, infernales, celestiales). CD 10 + su VD; +5 si es única o rara. Si lo logras, el DM te dice una cosa: su salvación más débil, una resistencia, vulnerabilidad o inmunidad, o qué hace mejor. Una más por cada 5 que pases. Lo que no tienes manera de saber, no te lo dice." },
    { id: "planear", nombre: "Planear", act: "special", tipo: "check", pericias: ["inv"], cdFija: 15, pf2e: null,
      texto: "Un minuto fuera de combate (o una acción en combate) para explicar un plan. Con Investigación CD 15, tú y tantos aliados que te escucharon como tu INT (mínimo 1) tienen «Según el plan»: una vez, +1d4 a una tirada que siga el plan. Si el plan se rompe, se pierde. Un fallo por 5 o más: el plan tiene un agujero que el DM conoce." },
    { id: "plan", nombre: "Según el plan", act: "special", tipo: "utility", efecto: { nombre: "Según el plan", img: `${S}abilities/intelligence.svg`, horas: 1 }, pf2e: null,
      texto: "Pon este efecto en quienes escucharon el plan (marca sus tokens). Cada uno, una vez, suma 1d4 a una tirada que siga el plan y luego se lo quita." },
    { id: "terreno", nombre: "Aprovechar el terreno", act: "action", tipo: "check", pericias: ["inv", "sur"], cdFija: 12, pf2e: null,
      texto: "Buscas algo que usar: una lámpara que colgar, una cuesta, un tablón suelto, una cuerda. Con CD 12, el DM te dice qué hay y te da una de dos: +2 a tu próximo ataque, o que tu próxima Presa, Empujón o Zancadilla se salve con desventaja." }
  ] },
  { car: "wis", acciones: [
    { id: "buscar", nombre: "Buscar", act: "action", tipo: "check", pericias: ["prc", "ins", "med", "sur"], pf2e: "Seek", base: "Buscar",
      texto: "Como en el Manual: buscas a alguien escondido (Percepción contra su Sigilo), algo oculto, una huella (Supervivencia), una mentira (Perspicacia) o qué le pasa a un herido (Medicina). Examinar algo con cuidado o deducir es Investigación, con la acción Estudiar." },
    { id: "leer", nombre: "Leer al rival", act: "action", tipo: "save", salv: ["cha"], cdPericia: ["ins"], alcance: 30,
      efecto: { nombre: "Desprevenido", img: "systems/dnd5e/icons/svg/statuses/surprised.svg", statuses: [DESPREVENIDO] }, pf2e: null,
      texto: "Le miras los hombros, los pies, la respiración. Si falla, queda Desprevenido hasta el final de tu siguiente turno (todo ataque contra él suma +2) y el DM te dice qué piensa hacer en su próximo turno." },
    { id: "ayudar", nombre: "Ayudar", act: "action", tipo: "utility", alcance: 5, pf2e: "Aid", base: "Ayudar",
      texto: "Das ventaja al próximo ataque de un aliado contra una criatura a 1,5 m de ti, o a su próxima prueba si sabes ayudar con eso. Antes de tu siguiente turno." },
    { id: "serenarse", nombre: "Serenarse", act: "action", tipo: "check", car: "wis", pf2e: null,
      texto: "Respiras hondo: repites ahora la salvación contra estar Asustado o Hechizado, con +2, en vez de esperar al final de tu turno." }
  ] },
  { car: "cha", acciones: [
    { id: "fintar", nombre: "Fintar", act: "bonus", tipo: "save", salv: ["wis"], cdPericia: ["dec"], alcance: 5,
      efecto: { nombre: "Desprevenido", img: "systems/dnd5e/icons/svg/statuses/surprised.svg", statuses: [DESPREVENIDO], turnos: 1 }, pf2e: "Feint",
      texto: "Un amago antes de golpear. Si falla, queda Desprevenido hasta el final de tu turno: todo ataque contra él suma +2. Si falla por 5 o más, tu próximo 20 contra él elige el efecto." },
    { id: "intimidar", nombre: "Intimidar", act: "action", tipo: "save", salv: ["wis"], cdPericia: ["itm"], alcance: 30,
      efecto: { nombre: "Intimidado", statuses: ["frightened"], img: `${S}statuses/frightened.svg` }, pf2e: "Demoralize",
      texto: "Una amenaza que se cree. Si falla, queda Asustado de ti hasta el final de su próximo turno. Si la supera, no vuelve a caer en todo el combate." },
    { id: "provocar", nombre: "Provocar", act: "bonus", tipo: "save", salv: ["wis"], cdPericia: ["itm"], alcance: 30,
      efecto: { nombre: "Provocado", img: `${S}abilities/charisma.svg` }, pf2e: null,
      texto: "Te haces el blanco. Si falla, hasta el final de su próximo turno tiene desventaja en los ataques contra cualquiera que no seas tú." },
    { id: "distraer", nombre: "Distraer", act: "action", tipo: "save", salv: ["wis"], cdPericia: ["dec"], alcance: 30,
      efecto: { nombre: "Distraído", img: `${S}statuses/hiding.svg` }, pf2e: "Create a Diversion",
      texto: "Un ruido, un señuelo, un clon, un grito al otro lado. Si falla, no te ve venir: tu próximo ataque contra él, antes del final de tu siguiente turno, tiene ventaja. Con clones, ilusiones o humo que lo confundan, salva con desventaja." },
    { id: "arengar", nombre: "Arengar", act: "action", tipo: "heal", temp: "1d4 + @abilities.cha.mod", alcance: 30, pf2e: null,
      texto: "Un grito que levanta a un aliado que te oye: gana 1d4 + tu CAR en PG temporales. Una vez por combate por aliado." },
    { id: "parlamentar", nombre: "Parlamentar", act: "action", tipo: "check", pericias: ["per", "dec", "itm", "prf"], pf2e: null, base: "Influir",
      texto: "La acción Influir del Manual en mitad de la pelea: propones algo (rendirse, negociar, que se vaya) con Persuasión, Engaño, Intimidación o Interpretación. La CD es la del Manual: 15 o su Inteligencia, la mayor. El DM decide si escucha. Ecos añade: si lo logras, duda y no te ataca en su próximo turno si tú tampoco." }
  ] }
];

const NOMBRE_ITEM = Object.fromEntries(ACCIONES.map(g => [g.car, `Acciones de ${NOMBRE_CAR[g.car]}`]));
export const ACCIONES_PLANAS = ACCIONES.flatMap(g => g.acciones.map(a => ({ ...a, grupo: g.car })));

/** Lo que se lee de una acción en una línea: «Acción · el objetivo salva FUE o DES contra tu CD de FUE». */
export function resumenAccion(a, grupo = a.grupo) {
  const partes = [ACT[a.act] ?? a.act];
  if (a.tipo === "save") partes.push(`salva ${a.salv.map(x => CORTO[x]).join(" o ")} contra ${a.cdPericia ? `8 + tu ${a.cdPericia.map(p => PERICIAS[p] ?? p).join(" o tus ")}${a.cdPericia.length > 1 ? " (el mejor)" : ""}` : `8 + competencia + tu ${CORTO[a.cd]}`}`);
  if (a.tipo === "check") partes.push(`prueba de ${a.pericias?.length ? a.pericias.map(p => PERICIAS[p] ?? p).join(", ") : NOMBRE_CAR[a.car ?? grupo]}${a.cdFija ? ` CD ${a.cdFija}` : ""}`);
  partes.push(a.base ? `regla base del Manual: ${a.base}` : "de Ecos, se suma al Manual");
  return partes.join(" · ");
}
const PERICIAS = { ath: "Atletismo", acr: "Acrobacias", ste: "Sigilo", arc: "Arcanos", his: "Historia", nat: "Naturaleza", rel: "Religión", inv: "Investigación",
  sur: "Supervivencia", prc: "Percepción", per: "Persuasión", dec: "Engaño", itm: "Intimidación", ins: "Perspicacia", slt: "Juego de manos", med: "Medicina", prf: "Interpretación", ani: "Trato con animales" };
/** CD de una acción por pericia: 8 + el bono total de la pericia (competencia, Pericia doble y bonos incluidos). */
export const formulaCdPericia = ps => ps.length === 1 ? `8 + @skills.${ps[0]}.total` : `8 + max(${ps.map(p => `@skills.${p}.total`).join(", ")})`;

function efectoDe(grupo, a) {
  const e = a.efecto ?? (a.estado ? { nombre: { grappled: "Agarrado", prone: "Derribado" }[a.estado] ?? a.estado, statuses: [a.estado], img: `${S}statuses/${a.estado}.svg` } : null);
  if (!e) return null;
  const duracion = e.horas ? { seconds: e.horas * 3600 } : e.turnos ? { turns: e.turnos } : { rounds: 1, seconds: 6 };
  return { _id: idEstable(`ecos-accion-efecto-${grupo}-${a.id}`), name: e.nombre, img: e.img ?? `${S}abilities/${({ str: "strength", dex: "dexterity", con: "constitution", int: "intelligence", wis: "wisdom", cha: "charisma" })[grupo]}.svg`,
    statuses: e.statuses ?? [], changes: (e.cambios ?? []).map(([k, t, v]) => cambio(k, t, v)), duration: duracion, transfer: false, disabled: false,
    description: `<p>${esc(a.texto)}</p>`, flags: { [MOD]: { accionComunEfecto: a.id } } };
}

function actividadDe(grupo, a) {
  const _id = idEstable(`ecos-accion-${grupo}-${a.id}`);
  const ef = efectoDe(grupo, a);
  const base = { _id, sort: 0, name: a.nombre, type: a.tipo === "heal" ? "heal" : a.tipo,
    activation: { type: a.act, value: a.act === "special" ? null : 1, condition: "", override: true },
    description: { chatFlavor: a.texto },
    range: a.alcance ? { override: true, units: "ft", value: String(a.alcance), special: "" } : { override: false },
    target: a.tipo === "utility" && !a.alcance ? { override: false } : { override: true, affects: { count: "1", type: "creature", choice: false, special: "" }, prompt: false },
    effects: ef ? [{ _id: ef._id, onSave: false }] : [] };
  if (a.tipo === "save") Object.assign(base, {
    save: { ability: a.salv, dc: a.cdPericia ? { calculation: "", formula: formulaCdPericia(a.cdPericia) } : { calculation: a.cd, formula: "" } },
    damage: { onSave: "none", parts: a.dano ? [{ number: a.dano[0], denomination: a.dano[1], bonus: "", types: [a.dano[2]], custom: { enabled: false, formula: "" }, scaling: { mode: "", number: null, formula: "" } }] : [] } });
  if (a.tipo === "check") Object.assign(base, { check: { ability: a.car ?? (a.pericias?.length ? "" : grupo), associated: a.pericias ?? [], dc: { calculation: "", formula: a.cdFija ? String(a.cdFija) : "" } } });
  if (a.tipo === "utility") Object.assign(base, { roll: { formula: "", name: "", prompt: false, visible: false } });
  if (a.tipo === "heal") Object.assign(base, { healing: { number: null, denomination: null, bonus: "", types: ["temphp"], custom: { enabled: true, formula: a.temp }, scaling: { mode: "", number: null, formula: "" } } });
  return { actividad: base, efecto: ef };
}

/** Descripción de un rasgo de características: cada acción con lo que pide y lo que hace. */
export function descripcionGrupoHTML(g) {
  return `<p><em>Lo que cualquiera puede intentar con su ${NOMBRE_CAR[g.car]}. Las que ya están en el Manual se resuelven como en el Manual; las de Ecos se suman sin quitar nada. Las CD salen de tus números.</em></p>
<ul>${g.acciones.filter(a => a.id !== "plan").map(a => `<li><strong>${esc(a.nombre)}</strong> <small>(${esc(resumenAccion(a, g.car))})</small>. ${esc(a.texto)}</li>`).join("")}</ul>`;
}

/** Los seis rasgos («Acciones de Fuerza»…) como datos de objeto de dnd5e. */
export function datosRasgosComunes() {
  return ACCIONES.map(g => {
    const activities = {}, effects = [];
    g.acciones.forEach((a, i) => { const { actividad, efecto } = actividadDe(g.car, a); actividad.sort = (i + 1) * 100; activities[actividad._id] = actividad; if (efecto) effects.push(efecto); });
    return { name: NOMBRE_ITEM[g.car], type: "feat", img: `${S}abilities/${({ str: "strength", dex: "dexterity", con: "constitution", int: "intelligence", wis: "wisdom", cha: "charisma" })[g.car]}.svg`,
      system: { description: { value: descripcionGrupoHTML(g), chat: "" }, type: { value: "", subtype: "" }, identifier: `ecos-acciones-${g.car}`, activities, source: { custom: "Ecos · Acciones de cualquiera" } },
      effects, flags: { [MOD]: { accionComun: { id: g.car, v: VERSION_ACCIONES } } } };
  });
}

/**
 * El golpe sin armas de la clase, si existe: un dado de escala de monje, pugilista o artes marciales.
 * Devuelve la fórmula («@scale.monk.martial-arts») o null.
 */
export function dadoDeClase(datosTirada) {
  const escala = datosTirada?.scale ?? {};
  for (const [clase, valores] of Object.entries(escala)) for (const clave of Object.keys(valores ?? {}))
    if (/martial-arts|artes-marciales|fisticuffs|punos|puños|unarmed/i.test(clave)) return `@scale.${clase}.${clave}`;
  return null;
}
/** ¿Ya tiene un golpe sin armas propio (de su clase, de la importación o hecho a mano)? */
export const tieneGolpePropio = items => (items ?? []).some(i => i?.type === "weapon" && !i?.flags?.[MOD]?.accionComun
  && (i.system?.identifier === "unarmed-strike" || /golpe sin armas|ataque sin armas|unarmed strike|puñetazo/i.test(i.name ?? "")));

/** «Golpe sin armas»: 1 + Fuerza contundente; con un dado de clase, ese dado y Fuerza o Destreza. */
export function datosGolpe(dado = null) {
  const id = idEstable("ecos-accion-golpe");
  return { name: "Golpe sin armas", type: "weapon", img: `${S}damage/bludgeoning.svg`,
    system: { description: { value: `<p>Puños, codos, rodillas, cabeza. Ataque cuerpo a cuerpo a 1,5 m: ${dado ? "el dado de tu clase" : "1"} + tu ${dado ? "Fuerza o Destreza" : "Fuerza"} contundente. Lo tiene todo el mundo. Las técnicas de Cuerpo que piden un golpe pueden usarlo.</p>`, chat: "" },
      type: { value: "natural", baseItem: "" }, identifier: "ecos-golpe-sin-armas", quantity: 1, equipped: true, proficient: 1, properties: dado ? ["fin"] : [],
      damage: { base: { number: null, denomination: null, bonus: "", types: ["bludgeoning"], custom: { enabled: true, formula: dado ?? "1" }, scaling: { mode: "", number: null, formula: "" } } },
      activities: { [id]: { _id: id, sort: 0, name: "Golpe sin armas", type: "attack", activation: { type: "action", value: 1, override: false },
        attack: { ability: "", bonus: "", flat: false, type: { value: "melee", classification: "unarmed" }, critical: { threshold: null } },
        damage: { includeBase: true, parts: [], critical: { bonus: "" } } } },
      source: { custom: "Ecos · Acciones de cualquiera" } },
    flags: { [MOD]: { accionComun: { id: "golpe", v: VERSION_ACCIONES, dado: dado ?? null } } } };
}

/** Qué objetos crear o actualizar en una hoja: compara con lo que ya tiene. Puro. */
export function planAcciones(items, datosTirada) {
  const propios = new Map((items ?? []).filter(i => i?.flags?.[MOD]?.accionComun).map(i => [i.flags[MOD].accionComun.id, i]));
  const crear = [], actualizar = [];
  const deseados = datosRasgosComunes();
  if (!tieneGolpePropio(items)) deseados.unshift(datosGolpe(dadoDeClase(datosTirada)));
  for (const d of deseados) {
    const id = d.flags[MOD].accionComun.id, ya = propios.get(id);
    if (!ya) crear.push(d);
    else if ((ya.flags[MOD].accionComun.v ?? 0) < VERSION_ACCIONES || (id === "golpe" && (ya.flags[MOD].accionComun.dado ?? null) !== (d.flags[MOD].accionComun.dado ?? null)))
      actualizar.push({ _id: ya._id ?? ya.id, ...d });
  }
  return { crear, actualizar };
}

/* ---------- La página para todos ---------- */
const FUERA = [
  ["Fuerza", "Levantar o arrastrar algo pesado (Atletismo), trepar sin cuerda, romper una cadena, sostener una puerta que empujan."],
  ["Destreza", "Abrir una cerradura con ganzúa (herramientas de ladrón), caminar por una cornisa (Acrobacias), escabullirse (Sigilo), hacer un truco de manos."],
  ["Constitución", "Aguantar la respiración, una marcha forzada, una noche en vela, el frío, una borrachera: «Resistir»."],
  ["Inteligencia", "Recordar algo (Historia, Arcanos, Naturaleza, Religión), deducir quién estuvo aquí (Investigación), descifrar una nota, preparar un plan: «Planear»."],
  ["Sabiduría", "Seguir un rastro (Supervivencia), notar una mentira (Perspicacia), oír a alguien detrás de la puerta (Percepción), calmar a un animal (Trato con animales), estabilizar a un herido (Medicina)."],
  ["Carisma", "Convencer (Persuasión), mentir (Engaño), asustar (Intimidación), regatear con un mercader, actuar o cantar por unas monedas (Interpretación)."]
];

/** «12 · Lo que cualquiera puede intentar», para «Reglas de la casa». Sin secretos: la ven todos. */
export function guiaAccionesHTML() {
  return `<section class="ecos-acciones"><h1>Lo que cualquiera puede intentar</h1>
<p><em>Desde la versión 3.12, todas las hojas traen «Golpe sin armas» y seis rasgos: «Acciones de Fuerza», «de Destreza», «de Constitución», «de Inteligencia», «de Sabiduría» y «de Carisma». Úsalos como cualquier otro rasgo: el sistema pide la tirada o la salvación y pone el estado si falla.</em></p>
<h2>Cómo funcionan</h2>
<ul><li><strong>Primero, D&amp;D:</strong> Presa, Empujón, Escapar, Esquivar, Esconderse, Buscar, Ayudar, Estudiar (Evaluar) e Influir (Parlamentar) ya están en el Manual del jugador y se resuelven exactamente igual: Ecos solo les pone un botón en la hoja. Las demás son de Ecos y se suman a lo del Manual sin quitar ni cambiar nada. Cada fila dice cuál es cuál.</li>
<li><strong>La CD es tuya:</strong> en las del Manual, la del Manual (Presa y Empujón: 8 + Fuerza + competencia). En las de Ecos, 8 + el bono de la pericia que se usa (Fintar: Engaño; Intimidar: Intimidación; Birlar: Juego de manos…): la competencia y la Pericia doble cuentan. Quien tiene 20 de Fuerza derriba a más gente que quien tiene 10, y un pícaro experto finta mejor que un guerrero. En este mundo hay súper criaturas: las estadísticas pesan.</li>
<li><strong>En lugar de un ataque:</strong> Presa, los dos Empujones, Zancadilla y Desarmar ocupan uno de tus ataques. Si tienes Ataque Extra, puedes golpear y derribar en la misma acción.</li>
<li><strong>Tu clase manda:</strong> si tu clase te da un golpe sin armas mejor (monje, pugilista), se usa el de tu clase. Si tu clase ya tiene algo parecido (Apuntar con firmeza del pícaro, las maniobras del Maestro de batalla, el estilo Protección, Defensa paciente del monje), lo de tu clase sigue igual y suele ser mejor. Cuestan la misma acción, así que no se suman en el mismo turno.</li>
<li><strong>La ventaja la pides tú:</strong> cuando algo te dé ventaja (Distraer, Ayudar, el plan), elígela en la ventana Normal / Ventaja / Desventaja antes de tirar.</li>
<li><strong>El 20 y el 1:</strong> sacar 20 o 1 en estas tiradas también saca un efecto de la tabla del d20 («13 · El 20 y el 1»).</li></ul>
${ACCIONES.map(g => `<h2>${NOMBRE_CAR[g.car]}</h2><table><thead><tr><th>Acción</th><th>Cuándo y contra qué</th><th>Qué pasa</th></tr></thead><tbody>${g.acciones.filter(a => a.id !== "plan").map(a => `<tr><td><strong>${esc(a.nombre)}</strong></td><td>${esc(resumenAccion(a, g.car))}</td><td>${esc(a.texto)}</td></tr>`).join("")}</tbody></table>`).join("\n")}
<h2>Fuera de combate</h2>
<p>Todo lo de arriba sirve también fuera de combate. Además, cualquiera puede intentar:</p>
<table><thead><tr><th>Característica</th><th>Ejemplos</th></tr></thead><tbody>${FUERA.map(([c, t]) => `<tr><td><strong>${c}</strong></td><td>${esc(t)}</td></tr>`).join("")}</tbody></table>
<p>CD de referencia: fácil 10, media 15, difícil 20, casi imposible 25. Si ayudas a alguien que sabe, tiene ventaja.</p>
<h2>Ideas para jugar con cabeza</h2>
<ul><li><strong>Engañar:</strong> mézclate entre clones, humo o gente y usa «Distraer»: el enemigo salva con desventaja y tu próximo ataque tiene ventaja.</li>
<li><strong>Planear:</strong> un minuto de plan antes de entrar da a todo el grupo un +1d4 que se gana siguiéndolo.</li>
<li><strong>Saber antes de pegar:</strong> «Evaluar al enemigo» te dice su salvación más débil o qué lo daña. «Leer al rival» te dice qué va a hacer.</li>
<li><strong>Usar el sitio:</strong> «Aprovechar el terreno» convierte una lámpara, una cuesta o un barril en ventaja.</li></ul>
</section>`;
}

/* ---------- Foundry ---------- */
const ajusteActivo = () => { try { return game.settings.get(MOD, "accionesComunes") !== false; } catch { return true; } };
const soyDM = () => !!game.user?.isGM && (game.users?.activeGM ? game.users.activeGM.isSelf : true);
const colas = new Map();

/** Pone o actualiza las acciones en una hoja (solo el DM principal). Devuelve cuántos objetos tocó. */
export async function asegurarAccionesComunes(actor) {
  if (!actor || !["character", "npc"].includes(actor.type) || !soyDM() || !ajusteActivo() || !actor.isOwner) return 0;
  const clave = actor.uuid ?? actor.id;
  const previo = colas.get(clave) ?? Promise.resolve(0);
  const trabajo = previo.catch(() => 0).then(async () => {
    const items = actor.items.contents ?? Array.from(actor.items);
    const { crear, actualizar } = planAcciones(items.map(i => i.toObject?.() ?? i), actor.getRollData?.() ?? {});
    if (crear.length) await actor.createEmbeddedDocuments("Item", crear, { ecosAcciones: true });
    // Los rasgos los genera el módulo: al cambiar de versión se rehacen enteros (con sus efectos), no se parchean.
    if (actualizar.length) {
      await actor.deleteEmbeddedDocuments("Item", actualizar.map(x => x._id), { ecosAcciones: true });
      await actor.createEmbeddedDocuments("Item", actualizar.map(({ _id, ...x }) => x), { ecosAcciones: true });
    }
    return crear.length + actualizar.length;
  });
  colas.set(clave, trabajo);
  try { return await trabajo; } finally { if (colas.get(clave) === trabajo) colas.delete(clave); }
}

/** Todas las hojas del mundo, también los PNJ (botón del DM y API). */
export async function accionesEnTodas({ npcs = true } = {}) {
  let n = 0;
  for (const a of game.actors ?? []) if (a.type === "character" || (npcs && a.type === "npc")) n += await asegurarAccionesComunes(a);
  return n;
}

const huellaHTML = s => { let h = 2166136261; for (const c of String(s ?? "")) { h ^= c.codePointAt(0); h = Math.imul(h, 16777619); } return `${String(s ?? "").length}:${(h >>> 0).toString(16)}`; };
/**
 * Una página de reglas para todos en «Reglas de la casa», marcada con `bandera`. Se crea una vez y se pone al día
 * mientras nadie la edite. La ven todos (hereda el permiso del diario).
 */
export async function paginaReglas(bandera, nombre, html) {
  if (!soyDM() || !globalThis.JournalEntry) return null;
  const diario = game.journal.get("G0rD0J3JkpOkXM00") ?? game.journal.find(j => /reglas de la casa/i.test(j.name));
  if (!diario) return null;
  const pag = diario.pages.find(p => p.getFlag(MOD, bandera));
  if (!pag) {
    const orden = Math.max(0, ...diario.pages.map(p => p.sort ?? 0)) + 100000;
    const [nueva] = await diario.createEmbeddedDocuments("JournalEntryPage", [{ name: nombre, type: "text", sort: orden,
      text: { content: html, format: 1 }, flags: { [MOD]: { [bandera]: { huella: huellaHTML(html) } } } }]);
    return nueva;
  }
  if (pag.text?.content !== html && huellaHTML(pag.text?.content) === pag.getFlag(MOD, bandera)?.huella)
    await pag.update({ "text.content": html, [`flags.${MOD}.${bandera}`]: { huella: huellaHTML(html) } });
  return pag;
}
/** «12 · Lo que cualquiera puede intentar». */
export const asegurarGuiaAcciones = () => (ajusteActivo() ? paginaReglas("guiaAcciones", "12 · Lo que cualquiera puede intentar", guiaAccionesHTML()) : null);

if (globalThis.Hooks) {
  Hooks.once("init", () => {
    try {
      game.settings.register(MOD, "accionesComunes", { name: "Acciones de cualquiera en las hojas", hint: "Golpe sin armas, Presa, Empujón, Zancadilla, Fintar, Esquivar, Evaluar y el resto: se añaden a cada hoja nueva o importada, a los PJ al cargar el mundo y a los PNJ al entrar en combate o en una escena.",
        scope: "world", config: true, type: Boolean, default: true });
    } catch { /* ya registrado */ }
  });
  Hooks.once("ready", async () => {
    const api = (game.modules.get(MOD).api ??= {});
    api.acciones = { enHoja: asegurarAccionesComunes, enTodas: accionesEnTodas, guia: asegurarGuiaAcciones };
    if (!soyDM()) return;
    try { await asegurarGuiaAcciones(); for (const a of game.actors ?? []) if (a.type === "character") await asegurarAccionesComunes(a); }
    catch (err) { console.error(`${MOD} | acciones de cualquiera`, err); }
  });
  Hooks.on("createActor", actor => { asegurarAccionesComunes(actor).catch(err => console.error(`${MOD} | acciones de cualquiera`, err)); });
  Hooks.on("createCombatant", c => { if (c.actor) asegurarAccionesComunes(c.actor).catch(err => console.error(`${MOD} | acciones de cualquiera`, err)); });
  Hooks.on("createToken", t => { if (t.actor) asegurarAccionesComunes(t.actor).catch(err => console.error(`${MOD} | acciones de cualquiera`, err)); });
}
