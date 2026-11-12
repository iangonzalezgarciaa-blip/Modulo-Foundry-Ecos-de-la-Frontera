/**
 * 3.63 · Armas legendarias (pedido del autor, 12-nov-2026: «las armas legendarias pueden ir a Reliquias del Abismo con
 * su historia»). Los 17 artefactos del Verbe pasan a ser objetos de verdad de D&D, con etapas como las reliquias:
 *  0 · Sin identificar: funciona como un arma (o escudo, u objeto) común de su tipo; el jugador solo ve su aspecto.
 *  1 · Dormida: +1 (mágica, sintonía).
 *  2 · Despierta: +2 y su poder propio (una actividad de la hoja, con sus usos).
 *  3 · Resonante: +3 y su poder completo.
 * Siguen contando como «artefacto equipado» para las técnicas del Verbe que lo piden. Las cifras son de esta adaptación
 * (nivel 11, legendarias); la historia de cada una vive en los diarios del mundo («Reliquias · Historias secretas · IV»).
 * Revertir: «Bajar etapa». A mano: «Subir etapa» o el «Identificar» nativo del DM.
 */
const MOD = "ecos-frontera";
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
export const NIVEL_LEGENDARIA = 11;
const ETAPA = ["Sin identificar", "Dormida", "Despierta", "Resonante"];
const EFECTO = [
  "No responde: funciona como un objeto común de su tipo. Solo se ve su aspecto.",
  "+1 a los ataques y al daño (o a la CA si es un escudo). Mágica; pide sintonía.",
  "+2 y despierta su poder propio.",
  "+3 y su poder completo."
];
/** Cada arma: base de D&D, aspecto, qué es y su poder en las etapas 2 y 3 (actividades). */
export const LEGENDARIAS = {
  samehada: { clase: "weapon", base: "greatsword", tipo: "martialM", dado: [2, 6], dano: "slashing", props: ["hvy", "two"], car: "str",
    aspecto: "Un espadón envuelto en escamas grises que se erizan solas; respira despacio y huele a mar.",
    que: "Una espada viva que come Verbe. Elige a su portador, y a veces lo deja.",
    poder: { nombre: "Devorar", tipo: "damage", dados: [[1, 6, "necrotic"], [2, 6, "necrotic"]], usos: null,
      texto: ["Una vez por turno, cuando impactas a una criatura que tiene Verbe o mantiene la concentración: +1d6 necrótico y recuperas esa misma cantidad de Verbe (o de PG temporales si no tienes Verbe).", "Como en la etapa 2 con 2d6; además, si el objetivo se concentraba, tira su salvación de concentración con desventaja."] } },
  kubikiribocho: { clase: "weapon", base: "greatsword", tipo: "martialM", dado: [2, 6], dano: "slashing", props: ["hvy", "two"], car: "str",
    aspecto: "Una hoja enorme como un cuchillo de carnicero, con un agujero redondo cerca de la punta y la otra punta mellada.",
    que: "Una cuchilla que se repara bebiendo la sangre que corta.",
    poder: { nombre: "Beber", tipo: "heal", temp: "2 * @prof", usos: null, critico: [null, 19],
      texto: ["Cuando reduces a 0 PG a una criatura con ella, la hoja se cierra y ganas PG temporales iguales al doble de tu bonificador de competencia.", "Como en la etapa 2; además, sus ataques son críticos con 19 o 20."] } },
  hiramekarei: { clase: "weapon", base: "warhammer", tipo: "martialM", dado: [1, 8], versatil: [1, 10], dano: "bludgeoning", props: ["ver"], car: "str",
    aspecto: "Un arma de dos empuñaduras unidas por una hoja ancha y vendada, que zumba cuando se aprieta.",
    que: "Guarda el Verbe que le das y lo suelta de golpe con la forma que imaginas.",
    poder: { nombre: "Descarga del Faro", tipo: "damage", dados: [[2, 6, "force"], [3, 6, "force"]], usos: [1, 2], per: "sr",
      texto: ["Acción adicional (1 por descanso corto, o 2 Verbe): tu próximo impacto este turno suma 2d6 de fuerza.", "Como en la etapa 2 con 3d6, dos veces por descanso corto, y ese golpe llega a 10 ft."] } },
  kiba: { clase: "weapon", base: "shortsword", tipo: "martialM", dado: [1, 6], dano: "piercing", props: ["fin", "lgt"], car: "dex", extra: [null, null, [1, 4, "lightning"], [1, 6, "lightning"]],
    aspecto: "Dos espadas cortas gemelas, de hoja dentada, que chisporrotean al tocarse.",
    que: "Las espadas más afiladas que se conocen: cortan con el trueno. Son un par (usa la segunda con la mano torpe: son Ligeras).",
    poder: { nombre: "Doble trueno", tipo: "utility", usos: null,
      texto: ["Sus impactos suman 1d4 de relámpago (ya va en el ataque).", "Sus impactos suman 1d6 de relámpago; si impactas con las dos a la misma criatura en un turno, no puede tomar reacciones hasta el inicio de su próximo turno."] } },
  shibuki: { clase: "weapon", base: "longsword", tipo: "martialM", dado: [1, 8], versatil: [1, 10], dano: "slashing", props: ["ver"], car: "str",
    aspecto: "Una espada larga envuelta en un rollo de papel con sellos que no se terminan nunca.",
    que: "Una espada que estalla: cada golpe puede llevar un sello encendido.",
    poder: { nombre: "Lámina que estalla", tipo: "save", salv: "dex", dados: [[3, 6, "fire"], [5, 6, "fire"]], area: ["radius", 5], usos: [1, 2], per: "sr",
      texto: ["Cuando impactas (1 por descanso corto): estalla en 5 ft alrededor del objetivo; cada criatura ahí salva DES o recibe 3d6 de fuego (mitad si la supera).", "5d6 de fuego, dos veces por descanso corto."] } },
  nuibari: { clase: "weapon", base: "rapier", tipo: "martialM", dado: [1, 8], dano: "piercing", props: ["fin"], car: "dex", alcance: [null, null, null, 10],
    aspecto: "Una espada larga y finísima como una aguja de coser, con un hilo de acero atado al pomo.",
    que: "Cose a quien atraviesa con quien atraviesa después.",
    poder: { nombre: "Coser", tipo: "save", salv: "str", usos: [1, 2], per: "sr",
      texto: ["Si impactas a dos criaturas distintas en el mismo turno (1 por descanso corto): quedan cosidas, ninguna puede alejarse a más de 10 ft de la otra (salvación de FUE al final de cada turno para soltarse).", "Dos veces por descanso corto, y tiene alcance de 10 ft (el hilo)."] } },
  kabutowari: { clase: "weapon", base: "battleaxe", tipo: "martialM", dado: [1, 8], versatil: [1, 10], dano: "slashing", props: ["ver"], car: "str",
    aspecto: "Un hacha y un martillo unidos por una cadena gruesa: con uno se golpea, con el otro se rompe.",
    que: "Rompe cualquier guardia: escudos, armaduras y defensas del Verbe.",
    poder: { nombre: "Romper guardia", tipo: "save", salv: "str", dados: [null, [1, 8, "bludgeoning"]], usos: [1, 2], per: "sr",
      texto: ["Acción adicional tras impactar (1 por descanso corto): el objetivo salva FUE o pierde el bonificador de su escudo y su Coraza del Verbe hasta el inicio de tu próximo turno. Daño doble a objetos y construcciones.", "Dos veces por descanso corto y ese golpe suma 1d8."] } },
  kusanagi: { clase: "weapon", base: "longsword", tipo: "martialM", dado: [1, 8], versatil: [1, 10], dano: "slashing", props: ["ver", "fin"], car: "dex",
    aspecto: "Una hoja recta y blanca como un junco, sin guarda, que parece más larga cuando nadie la mira.",
    que: "Una espada que se alarga hasta donde su portador quiere llegar.",
    poder: { nombre: "Estocada larga", tipo: "utility", usos: null,
      texto: ["Una vez por turno, uno de tus ataques con ella llega a 15 ft.", "Como en la etapa 2; además esa estocada ignora la media cobertura y, si impacta, puedes repetir la tirada de ataque contra otra criatura en línea recta detrás."] } },
  gunbai: { clase: "shield", base: "shield", armadura: 2,
    aspecto: "Un abanico de guerra redondo y enorme, de madera negra con tres círculos rojos.",
    que: "Un escudo que devuelve lo que recibe.",
    poder: { nombre: "Devolver", tipo: "utility", formula: "1d10 + 2 * @prof", usos: [1, 2], per: "sr",
      texto: ["Reacción (1 por descanso corto): cuando un ataque a distancia o una técnica te impacta, reduce su daño en 1d10 + el doble de tu competencia.", "Dos veces por descanso corto; si reduces el daño a 0, el atacante a 30 ft o menos recibe ese daño (salvación de DES para la mitad)."] } },
  bashosen: { clase: "weapon", base: "club", tipo: "simpleM", dado: [1, 4], dano: "bludgeoning", props: ["lgt"], car: "wis",
    aspecto: "Un abanico de hoja de palma, gastado, que se agita solo y huele a tormenta, a brasa y a hielo a la vez.",
    que: "Sopla con las cinco naturalezas: fuego, agua, viento, tierra y rayo.",
    poder: { nombre: "Viento de las cinco", tipo: "save", salv: "dex", dados: [[4, 6, ["fire", "cold", "lightning", "thunder", "acid"]], [6, 6, ["fire", "cold", "lightning", "thunder", "acid"]]], area: ["cone", 15, 30], usos: [1, 2], per: "sr",
      texto: ["Acción (1 por descanso corto): cono de 15 ft, salvación de DES, 4d6 del tipo que elijas (fuego, frío, relámpago, trueno o ácido), mitad si la supera.", "Cono de 30 ft y 6d6, dos veces por descanso corto."] } },
  totsuka: { clase: "weapon", base: "longsword", tipo: "martialM", dado: [1, 8], versatil: [1, 10], dano: "slashing", props: ["ver"], car: "str", extra: [null, null, [1, 6, "radiant"], [1, 6, "radiant"]],
    aspecto: "Una espada que no tiene hoja hasta que se desenvaina: entonces es un chorro de luz líquida.",
    que: "Una espada sin forma que sella lo que atraviesa.",
    poder: { nombre: "Sellar", tipo: "save", salv: "wis", usos: [1, 2], per: "lr",
      texto: ["Sus impactos suman 1d6 radiante. Cuando impactas a una criatura con la mitad de sus PG o menos (1 por descanso largo): salva SAB o queda Incapacitada hasta el final de su próximo turno.", "Dos veces por descanso largo; una criatura que cae a 0 PG con ella puede quedar sellada en un recipiente (ritual de 1 minuto, lo cierra el DM)."] } },
  yata: { clase: "shield", base: "shield", armadura: 2,
    aspecto: "Un espejo redondo de bronce que no refleja a quien lo sostiene, sino lo que viene hacia él.",
    que: "Un escudo que cambia de forma para recibir cualquier golpe.",
    poder: { nombre: "Reflejo", tipo: "utility", usos: [1, 1], per: ["sr", "lr"],
      texto: ["Reacción (1 por descanso corto): cuando te impacta un ataque, +4 a la CA contra ese ataque (puede convertirlo en fallo).", "Reacción (1 por descanso largo): anulas todo el daño de un ataque o una técnica que te impacta."] } },
  benihisago: { clase: "trinket", base: null, car: "wis",
    aspecto: "Una calabaza roja de licor, con un tapón de madera atado por un cordel, más pesada de lo que debería.",
    que: "Sella a quien responde a su llamada.",
    poder: { nombre: "Llamar por la palabra", tipo: "save", salv: "wis", alcance: 30, usos: [1, 1], per: ["sr", "lr"],
      texto: ["Acción (1 por descanso corto): una criatura a 30 ft que haya hablado desde tu último turno salva SAB o queda Apresada, atraída hacia la calabaza, hasta el final de su próximo turno.", "Una vez por descanso largo: si la criatura Apresada así tiene 30 PG o menos, queda sellada dentro hasta que la sueltes (o una hora)."] } },
  kokinjo: { clase: "weapon", base: "whip", tipo: "martialM", dado: [1, 4], dano: "slashing", props: ["fin", "rch"], car: "dex",
    aspecto: "Una soga dorada, gruesa, trenzada con hilos que parecen palabras escritas.",
    que: "Ata a quien habla: la soga no deja mentir a quien sujeta.",
    poder: { nombre: "Atar la palabra", tipo: "save", salv: "dex", usos: [1, 2], per: "sr",
      texto: ["Cuando impactas (1 por descanso corto): el objetivo salva DES o queda Apresado por la soga (CD de escape = la de la salvación).", "Dos veces por descanso corto; mientras está atado no puede mentir a sabiendas."] } },
  shichiseiken: { clase: "weapon", base: "longsword", tipo: "martialM", dado: [1, 8], versatil: [1, 10], dano: "slashing", props: ["ver"], car: "str",
    aspecto: "Una espada de siete ramas, como un árbol de hierro, cada rama con una promesa grabada.",
    que: "Cada rama guarda una promesa: cumplirla da fuerza, romperla la quita.",
    poder: { nombre: "Promesa", tipo: "damage", dados: [[1, 8, "necrotic"], [2, 8, "necrotic"]], usos: [7, 7], per: "lr",
      texto: ["7 cargas por descanso largo: al impactar, gasta una para sumar 1d8 necrótico.", "Suma 2d8; mientras la empuñas ves a las criaturas invisibles a 30 ft (díselo al DM)."] } },
  kohaku: { clase: "trinket", base: null, car: "wis",
    aspecto: "Un ánfora de barro con un sello de cera que lleva escrito un nombre que cambia.",
    que: "Sella a quien responde a su nombre.",
    poder: { nombre: "Nombre respondido", tipo: "save", salv: "cha", alcance: 30, usos: [1, 1], per: "lr",
      texto: ["Acción (1 por descanso largo): llamas a una criatura a 30 ft por su nombre; si te responde, salva CAR o queda Apresada 1 minuto (repite la salvación al final de cada turno).", "Si falla dos salvaciones seguidas, queda sellada dentro del ánfora hasta que la abras."] } },
  "marioneta-kazekage": { clase: "trinket", base: null, car: "wis",
    aspecto: "Una marioneta de tamaño humano, de madera negra, con las juntas llenas de arena de hierro que se mueve sola.",
    que: "Una marioneta que mueve arena de hierro magnetizada. Pide el Hilo para manejarla.",
    poder: { nombre: "Arena de hierro", tipo: "save", salv: "dex", dados: [[4, 6, "bludgeoning"], [6, 6, "bludgeoning"]], area: ["cube", 15], alcance: 60, usos: [1, 2], per: "sr",
      texto: ["Acción (1 por descanso corto): cubo de 15 ft a 60 ft o menos, salvación de DES, 4d6 contundente (mitad si la supera).", "6d6, dos veces por descanso corto; una vez por descanso largo levanta un muro de hierro de 30 ft × 10 ft (cobertura total) durante 1 minuto."] } }
};
/** Un id de actividad fijo (16 caracteres) para cada arma y uso. Puro. */
export function idFijo(s) {
  let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; }
  return (`ecosleg${h.toString(36)}${String(s).replace(/[^a-z0-9]/gi, "")}`).padEnd(16, "0").slice(0, 16);
}
const VACIAS = new Set(["y", "o", "de", "del", "con", "en", "a", "la", "el", "los", "las", "un", "una", "que", "sin", "por", "como"]);
export function nombreOculto(L) {
  let s = String(L?.aspecto ?? "").replace(/^(un|una|unos|unas|dos)\s+/i, "");
  s = s.split(/[;,:.]|\s(?:que|con|cuyo|cuya|como|sin|de un|de una|unidos|envuelt[oa])\s/i)[0].trim();
  const p = s.split(/\s+/).slice(0, 5); while (p.length > 1 && VACIAS.has(p.at(-1).toLowerCase())) p.pop();
  const b = p.join(" ");
  return `${b ? b[0].toLocaleUpperCase("es") + b.slice(1) : "Objeto extraño"} · sin identificar`;
}
export const cdLegendaria = () => 10 + Math.ceil(NIVEL_LEGENDARIA / 2);
const parte = (n, d, tipos) => ({ number: n, denomination: d, bonus: "", types: Array.isArray(tipos) ? tipos : [tipos], custom: { enabled: false, formula: "" }, scaling: { mode: "", number: null, formula: "" } });
const usosDe = (p, n) => {
  if (!p.usos) return { spent: 0, recovery: [] };
  const max = p.usos[n === 3 ? 1 : 0], per = Array.isArray(p.per) ? p.per[n === 3 ? 1 : 0] : p.per;
  return { spent: 0, max: String(max), recovery: [{ period: per, type: "recoverAll" }] };
};
/** Las actividades del arma en una etapa (el ataque y, desde la 2, su poder). Puro. */
export function actividades(id, L, n) {
  const out = {}, e = Number(n) || 0, act = { type: "action", value: 1, override: false }, nada = { targets: [], scaling: { allowed: false } };
  if (L.clase === "weapon") {
    const extra = L.extra?.[e];
    out[idFijo(`${id}:ataque`)] = { _id: idFijo(`${id}:ataque`), type: "attack", name: "", activation: act, consumption: nada, uses: { spent: 0, recovery: [] }, effects: [],
      attack: { ability: "", bonus: "", critical: { threshold: e >= 3 && L.poder.critico?.[1] ? L.poder.critico[1] : null }, flat: false, type: { value: "melee", classification: "weapon" } },
      damage: { critical: { bonus: "" }, includeBase: true, parts: extra ? [parte(...extra)] : [] } };
  }
  if (e < 2) return out;
  const p = L.poder, pid = idFijo(`${id}:poder`), dados = p.dados?.[e === 3 ? 1 : 0];
  const base = { _id: pid, name: p.nombre, activation: { ...act, type: /Reacción/.test(p.texto[0]) ? "reaction" : /Acción adicional/.test(p.texto[0]) ? "bonus" : p.tipo === "damage" || p.tipo === "heal" || /Cuando impactas|Si impactas|Cuando reduces|Sus impactos/.test(p.texto[0]) ? "special" : "action" },
    consumption: { targets: p.usos ? [{ type: "activityUses", target: "", value: "1", scaling: { mode: "", formula: "" } }] : [], scaling: { allowed: false } }, uses: usosDe(p, e), effects: [],
    description: { chatFlavor: p.texto[e === 3 ? 1 : 0] } };
  if (p.tipo === "damage") out[pid] = { ...base, type: "damage", damage: { critical: { allow: false }, parts: dados ? [parte(...dados)] : [] } };
  else if (p.tipo === "heal") out[pid] = { ...base, type: "heal", healing: { number: null, denomination: null, bonus: "", types: ["temphp"], custom: { enabled: true, formula: p.temp }, scaling: { mode: "", number: null, formula: "" } } };
  else if (p.tipo === "save") {
    const area = p.area ? { type: p.area[0], size: String(e === 3 && p.area[2] ? p.area[2] : p.area[1]), units: "ft" } : {};
    out[pid] = { ...base, type: "save", save: { ability: [p.salv], dc: { calculation: L.car ?? "str", formula: "" } },
      damage: { onSave: "half", parts: dados ? [parte(...dados)] : [] }, range: p.alcance ? { units: "ft", value: String(p.alcance), override: true } : { override: false, units: "" },
      target: { template: area, affects: { type: "creature" }, override: !!p.area, prompt: true } };
  } else out[pid] = { ...base, type: "utility", roll: { formula: p.formula ?? "", name: p.formula ? p.nombre : "", prompt: false, visible: !!p.formula } };
  return out;
}
/** Lo que ve el jugador en cada etapa (desde la 1). Puro. */
export function textoLegendaria(L, nombre, n) {
  const e = Math.max(0, Math.min(3, Number(n) || 0));
  const poder = e >= 2 ? `<p><b>${esc(L.poder.nombre)}.</b> ${esc(L.poder.texto[e === 3 ? 1 : 0])}${e === 3 ? ` <i>(Incluye lo de la etapa 2: ${esc(L.poder.texto[0])})</i>` : ""}</p>` : "";
  return `<div class="ecos-reliquia-etapa ecos-legendaria"><p><b>Aspecto.</b> ${esc(L.aspecto)}</p><p><b>Qué es.</b> ${esc(L.que)}</p>
    <p><b>Etapa ${e} · ${ETAPA[e]}.</b> ${esc(EFECTO[e])}</p>${poder}${e < 3 ? "<p><i>Hay algo más en ella. Todavía no responde del todo.</i></p>" : ""}
    <p class="ecos-nota">Arma legendaria de ${esc(nombre)} · nivel ${NIVEL_LEGENDARIA} · cuenta como su artefacto equipado para las técnicas del Verbe que lo piden.</p></div>`;
}
export function textoOcultoLegendaria(L) {
  const cd = cdLegendaria();
  return `<div class="ecos-reliquia-etapa ecos-reliquia-oculta"><p><b>Aspecto.</b> ${esc(L.aspecto)}</p><p><i>No sabes qué es. Funciona como un objeto común de su tipo, nada más… por ahora.</i></p>
    <h3>Cómo identificarla</h3><ul><li><b>Estudiarla</b> (1 hora; 10 minutos con Tacto del archivero): Arcanos, Historia o Investigación contra CD ${cd}; ventaja con <i>Detectar magia</i>. Si fallas, espera a tu próximo Descanso Largo.</li><li><b>El conjuro <i>Identificar</i></b>: la identifica sin tirada.</li><li><b>Luchar con ella</b> en un peligro real: el DM decide si despierta.</li></ul><p class="ecos-nota">Botón <b>«Estudiar»</b> en la cabecera.</p></div>`;
}
/** Todo lo que cambia en la copia al ponerla en una etapa. Puro. */
export function datosLegendaria(id, nombre, n, { embebida = false } = {}) {
  const L = LEGENDARIAS[id]; if (!L) return null;
  const e = Math.max(0, Math.min(3, Number(n) || 0)), bono = e ? String(e) : "";
  const acts = actividades(id, L, e), todas = new Set([idFijo(`${id}:ataque`), idFijo(`${id}:poder`)]);
  const u = {
    name: `${nombre} (${ETAPA[e]})`, "system.identified": !(embebida && e === 0),
    "system.unidentified.name": nombreOculto(L), "system.unidentified.description": textoOcultoLegendaria(L),
    "system.description.value": e === 0 ? `<div class="ecos-reliquia-etapa"><p><b>Etapa 0 · Sin identificar.</b> El jugador solo ve su aspecto; funciona como un objeto común.</p>${textoLegendaria(L, nombre, 1)}</div>` : textoLegendaria(L, nombre, e),
    "system.description.chat": e ? `<p><b>${esc(nombre)}</b> · ${ETAPA[e]}.</p>` : `<p>${esc(L.aspecto)} <i>Sin identificar.</i></p>`,
    "system.attunement": e ? "required" : "", "system.rarity": e ? "legendary" : "",
    [`flags.${MOD}.almacen.etapa`]: e, [`flags.${MOD}.almacen.cd`]: cdLegendaria(), [`flags.${MOD}.almacen.nivel`]: NIVEL_LEGENDARIA,
    [`flags.${MOD}.almacen.nombre`]: nombre, [`flags.${MOD}.almacen.legendaria`]: id, [`flags.${MOD}.almacen.siguiente`]: null
  };
  for (const k of todas) if (!acts[k]) u[`system.activities.-=${k}`] = null;
  for (const [k, v] of Object.entries(acts)) u[`system.activities.${k}`] = v;
  if (L.clase === "weapon") { u["system.magicalBonus"] = bono; u["system.properties"] = [...L.props, ...(e ? ["mgc"] : []), ...(e >= 3 && L.alcance?.[3] ? ["rch"] : [])]; }
  if (L.clase === "shield") { u["system.armor.magicalBonus"] = e || null; u["system.properties"] = e ? ["mgc"] : []; }
  if (L.clase === "trinket") u["system.properties"] = e ? ["mgc"] : [];
  return u;
}
/** La copia nueva entera (para el almacén). */
export function copiaLegendaria(id, nombre, etapa, { folder = null, embebida = false } = {}) {
  const L = LEGENDARIAS[id]; if (!L) return null;
  const sys = L.clase === "weapon"
    ? { type: { value: L.tipo, baseItem: L.base }, damage: { base: parte(...L.dado, L.dano), versatile: L.versatil ? parte(...L.versatil, L.dano) : { number: null, denomination: null, bonus: "", types: [], custom: { enabled: false, formula: "" }, scaling: { mode: "", number: null, formula: "" } } },
      range: { value: null, long: null, reach: null, units: "ft" }, weight: { value: L.props.includes("hvy") ? 6 : 3, units: "lb" }, proficient: null }
    : L.clase === "shield" ? { type: { value: "shield", baseItem: "shield" }, armor: { value: L.armadura, dex: null, magicalBonus: null }, weight: { value: 6, units: "lb" } }
    : { type: { value: "trinket", baseItem: "" }, weight: { value: 2, units: "lb" } };
  const base = { name: nombre, type: L.clase === "weapon" ? "weapon" : "equipment", img: L.clase === "weapon" ? "icons/svg/sword.svg" : L.clase === "shield" ? "icons/svg/shield.svg" : "icons/svg/item-bag.svg",
    folder, ownership: { default: 0 }, effects: [],
    system: { ...sys, quantity: 1, equipped: false, attuned: false, price: { value: 0, denomination: "gp" }, description: { value: "", chat: "" }, identified: true, unidentified: { name: "", description: "" }, activities: {}, source: { custom: "Ecos · Armas legendarias", book: "Nimerios" } },
    flags: { [MOD]: { almacen: { id: `leg-${id}`, tipo: "entregar", etapa, legendaria: id }, verbe: { artefacto: id } } } };
  const u = datosLegendaria(id, nombre, etapa, { embebida });
  for (const [k, v] of Object.entries(u)) { if (k.includes(".-=")) continue; foundry.utils.setProperty(base, k, v); }
  return base;
}
/** El manual del DM de un arma legendaria. Puro. */
export function manualLegendaria(id, nombre, { historia = null } = {}) {
  const L = LEGENDARIAS[id]; if (!L) return "";
  return `<div class="ecos-reliquia-manual"><h2>${esc(nombre)}</h2><p><i>Manual del DM · arma legendaria · nivel ${NIVEL_LEGENDARIA} · identificar CD ${cdLegendaria()} · solo tú lo ves</i></p>
    <p><b>Historia secreta:</b> ${historia ?? "todavía no tiene página. Botón «Historia secreta» de la cabecera."}</p>
    <h3>Qué es</h3><p>${esc(L.que)}</p><h3>Aspecto</h3><p>${esc(L.aspecto)}</p><h3>Cómo la ve el jugador sin identificar</h3><p><b>${esc(nombreOculto(L))}</b></p>
    ${[0, 1, 2, 3].map(e => `<h3>Etapa ${e} · ${ETAPA[e]}</h3><p>${esc(EFECTO[e])}${e >= 2 ? ` <b>${esc(L.poder.nombre)}:</b> ${esc(L.poder.texto[e === 3 ? 1 : 0])}` : ""}</p>`).join("")}
    <h3>Para despertarla</h3><p>De 1 a 2: tres escenas de peligro real con ella; o que alguien con el Verbe despierto la sostenga un Descanso Largo y supere Control del Verbe CD 16. De 2 a 3: un hito ligado a su historia secreta y un portador Practicante o más que la lleve un mes de juego.</p>
    <p class="ecos-nota">Arrastra a una hoja la copia de «3 · Armas legendarias»: llega sin identificar y funciona como un objeto común. Súbela con «Subir etapa». Cuenta como artefacto equipado para las técnicas del Verbe.</p></div>`;
}
