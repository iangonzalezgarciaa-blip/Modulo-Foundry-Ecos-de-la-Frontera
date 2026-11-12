/**
 * Conjuros (3.15, pedidos del autor).
 *
 * 1. Conjuros de PF2e (tarea 4.2d). `tools/pf2e/convertir_conjuros.py` deja en el PC del autor
 *    `Data/ecos-pf2e/conjuros-dnd5e.json`, con los 1 386 conjuros únicos de PF2e ya en formato dnd5e. El DM los lleva al
 *    compendio del mundo `world.ecos-conjuros-pf2e` (solo, al cargar el mundo, o con el botón de la Mesa). Las listas de
 *    clase van a `world.ecos-listas-pf2e` y se registran en dnd5e: el buscador de conjuros los muestra junto a los de D&D.
 *    El texto es de Paizo (ORC u OGL, citado en cada conjuro): no está en este repositorio.
 *
 * 2. La lupa: en el libro de conjuros de la hoja, un botón por nivel abre el buscador de dnd5e con tu lista de clase y
 *    los niveles que puedes lanzar, y añade los que elijas. Para el mago manda el Manual: 6 conjuros de nivel 1 al
 *    empezar y 2 por nivel, gratis; los demás se copian al libro por 50 po y 2 horas por nivel del conjuro (con la
 *    rareza de PF2e: poco común ×1,5, raro ×2, único ×3). Las demás clases añaden conjuros a su lista sin coste y
 *    preparan los que su clase diga, como en el Manual.
 */
const MOD = "ecos-frontera";
export const PACK_CONJUROS = "world.ecos-conjuros-pf2e";
export const PACK_LISTAS = "world.ecos-listas-pf2e";
export const RUTA = "ecos-pf2e/conjuros-dnd5e.json";
export const MULT_RAREZA = { common: 1, uncommon: 1.5, rare: 2, unique: 3 };
export const NOMBRE_CLASE = { wizard: "Mago", sorcerer: "Hechicero", bard: "Bardo", warlock: "Brujo", cleric: "Clérigo", paladin: "Paladín", druid: "Druida", ranger: "Explorador" };
const NIVEL = ["Truco", "Nivel 1", "Nivel 2", "Nivel 3", "Nivel 4", "Nivel 5", "Nivel 6", "Nivel 7", "Nivel 8", "Nivel 9"];
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const lista = x => Array.from(x?.contents ?? x ?? []);

/* ---------- Reglas puras ---------- */
/** Copiar un conjuro al libro del mago (Manual 2024): 50 po y 2 horas por nivel. La rareza de PF2e multiplica el oro. */
export function costeCopia(nivel, rareza = "common") {
  const n = Math.max(0, Number(nivel) || 0);
  return { po: Math.round(50 * n * (MULT_RAREZA[rareza] ?? 1)), horas: 2 * n };
}
/** Cuántos conjuros gratis le quedan al mago: 6 al nivel 1 y 2 más por nivel de mago (Manual 2024). */
export function gratisMago(nivelMago, yaGratis) {
  const total = nivelMago >= 1 ? 6 + 2 * (nivelMago - 1) : 0;
  return Math.max(0, total - (Number(yaGratis) || 0));
}
/** Conjuros de nivel 1+ del mago que no se copiaron pagando (los que ya tenía cuentan como gratis). */
export function contarGratisMago(items) {
  return lista(items).filter(i => i?.type === "spell" && Number(i.system?.level) >= 1
    && (!i.system?.sourceItem || i.system.sourceItem === "class:wizard")
    && i.flags?.[MOD]?.aprendido?.modo !== "copia").length;
}
/** El nivel más alto con espacios en una tabla de espacios de dnd5e ({spell1: {max, level}, pact: {max, level}}). */
export function nivelMaximoDe(spells) {
  return Object.values(spells ?? {}).reduce((m, s) => (s?.max ? Math.max(m, Number(s.level) || 0) : m), 0);
}
/** El conjuro como objeto de la hoja: de la clase elegida, sin preparar, y con de dónde salió. */
export function datosParaHoja(conjuro, clase, modo, uuid, coste = null) {
  const d = structuredClone(conjuro);
  delete d._id; delete d.folder; delete d.sort; delete d.ownership;
  d.system = { ...(d.system ?? {}), sourceItem: `class:${clase}`, method: d.system?.method || "spell", prepared: 0 };
  d._stats = { ...(d._stats ?? {}), compendiumSource: uuid };
  d.flags = { ...(d.flags ?? {}), [MOD]: { ...(d.flags?.[MOD] ?? {}), aprendido: { modo, clase, ...(coste ? { coste } : {}) } } };
  return d;
}
/** Las páginas de listas de clase para dnd5e (tipo «spells»), con las UUID del compendio. */
export function paginasListas(listas, pack = PACK_CONJUROS) {
  return Object.entries(listas ?? {}).map(([clase, ids]) => ({
    name: `${NOMBRE_CLASE[clase] ?? clase} · conjuros de PF2e`, type: "spells",
    system: { type: "class", identifier: clase, grouping: "level", description: { value: "<p>Conjuros de PF2e convertidos por Ecos.</p>" },
      spells: ids.map(id => `Compendium.${pack}.Item.${id}`) }
  }));
}

/* ---------- 4.2e · La biblioteca: índice por nivel, escuela y tipo ---------- */
export const VERSION_IMPORTADOR = 3; // 2: biblioteca (4.2e) · 3: textos nivelados a D&D (3.37)
const ESCUELA = { abj: "Abjuración", con: "Conjuración", div: "Adivinación", enc: "Encantamiento", evo: "Evocación", ill: "Ilusión", nec: "Nigromancia", trs: "Transmutación" };
const TIPO = { attack: "Ataque", save: "Salvación", damage: "Daño", heal: "Curación", utility: "Utilidad" };
const RAREZA = { common: "común", uncommon: "poco común", rare: "raro", unique: "único" };
const CLASES_DE = { arcane: ["wizard", "sorcerer"], occult: ["bard", "warlock"], divine: ["cleric", "paladin"], primal: ["druid", "ranger"] };
/** Tipo de un conjuro convertido: el de su primera actividad (y «Curación» si alguna cura). */
export function tipoConjuro(c) {
  const acts = Object.values(c?.system?.activities ?? {});
  if (acts.some(a => a?.type === "heal") && !acts.some(a => ["attack", "save", "damage"].includes(a?.type))) return TIPO.heal;
  return TIPO[acts[0]?.type] ?? TIPO.utility;
}
/** Una página de la biblioteca: los conjuros de un nivel, por escuela y nombre, con enlace, tipo, clases y rareza. */
export function indiceHTML(conjuros, nivel, pack = PACK_CONJUROS) {
  const de = conjuros.filter(c => Number(c.system?.level) === nivel)
    .sort((a, b) => (ESCUELA[a.system.school] ?? "").localeCompare(ESCUELA[b.system.school] ?? "", "es") || a.name.localeCompare(b.name, "es"));
  const filas = de.map(c => {
    const f = c.flags?.[MOD]?.pf2e ?? {};
    const clases = [...new Set((f.tradiciones ?? []).flatMap(t => CLASES_DE[t] ?? []))].map(k => NOMBRE_CLASE[k]).join(", ") || "—";
    return `<tr><td>@UUID[Compendium.${pack}.Item.${c._id}]{${esc(c.name)}}</td><td>${ESCUELA[c.system.school] ?? "—"}</td><td>${tipoConjuro(c)}</td><td>${esc(clases)}</td><td>${RAREZA[f.rareza] ?? "común"}</td></tr>`;
  }).join("");
  const cuenta = Object.entries(de.reduce((o, c) => { const e = ESCUELA[c.system.school] ?? "—"; o[e] = (o[e] ?? 0) + 1; return o; }, {})).map(([e, n]) => `${e} ${n}`).join(" · ");
  return `<section class="ecos-pf2e-indice"><h1>${NIVEL[nivel]} · ${de.length} conjuros</h1><p><em>${esc(cuenta)}</em></p>
<table><thead><tr><th>Conjuro</th><th>Escuela</th><th>Tipo</th><th>Clases</th><th>Rareza</th></tr></thead><tbody>${filas}</tbody></table></section>`;
}

/** «Cómo leer los conjuros de PF2e»: la equivalencia de Ecos (texto propio, sin texto de Paizo). */
export function glosarioHTML() {
  const fila = (a, b) => `<tr><td><strong>${a}</strong></td><td>${b}</td></tr>`;
  return `<section class="ecos-pf2e-glosario"><h1>Cómo leer los conjuros de PF2e</h1>
<p><em>Los conjuros vienen de Pathfinder 2e y se juegan con las reglas de D&amp;D. Lo de D&amp;D manda; esto dice cómo se traduce lo que el texto nombra de PF2e (docs/CONVERSION_PF2E.md, 4.2c).</em></p>
<h2>Lanzarlos</h2><table><tbody>
${fila("Rango", "Rango 1–2 = nivel 1; 3–4 = nivel 2; 5–6 = nivel 3; 7–8 = nivel 4; 9 = nivel 5; 10 = nivel 6. Truco = truco.")}
${fila("Acciones", "1 acción = acción adicional; 2 o 3 acciones = acción; reacción = reacción; 1 minuto o más = el mismo tiempo.")}
${fila("Concentrar, manipular", "Componente verbal y componente somático.")}
${fila("Mantener (sostenido)", "Concentración.")}
${fila("Potenciado", "Cada nivel de espacio por encima equivale a dos rangos: «Potenciado (+1)» se aplica dos veces por nivel; «(+2)», una vez; «(+3)» o «(+4)», una vez cada dos niveles.")}
</tbody></table>
<h2>Tiradas</h2><table><tbody>
${fila("Fortaleza, Reflejos, Voluntad", "Salvación de Constitución, Destreza y Sabiduría.")}
${fila("Salvación básica", "La mitad del daño si la supera.")}
${fila("CD de Fortaleza (u otra)", "10 + su bono de esa salvación.")}
${fila("Grados de éxito", "Si supera la salvación, lo de Éxito; si falla, lo de Fallo. Con un 20 natural, lo de Éxito crítico; con un 1 natural, lo de Fallo crítico. Lo mismo en un ataque de conjuro.")}
${fila("Prueba plana", "Un d20 sin bonos.")}
${fila("Recordar conocimiento", "La acción Estudiar (Evaluar al enemigo).")}
${fila("Daño persistente", "Lo recibe al final de cada uno de sus turnos; termina si, al final de su turno, saca 15 o más en un d20 sin bonos, o si alguien usa una acción para cortarlo.")}
${fila("Tipos de daño", "Electricidad = relámpago; sónico = trueno; vitalidad = radiante; vacío = necrótico; espíritu = fuerza; mental = psíquico; sangrado = necrótico persistente.")}
</tbody></table>
<h2>Estados</h2><table><tbody>
${fila("Desprevenido", "El Desprevenido de Ecos: +2 a los ataques contra él.")}
${fila("Asustado X", "Asustado de D&amp;D; el valor baja 1 al final de cada uno de sus turnos y se va al llegar a 0.")}
${fila("Debilitado X", "Desventaja en pruebas, salvaciones y ataques de Fuerza mientras dure.")}
${fila("Torpe X", "Desventaja en pruebas, salvaciones y ataques de Destreza mientras dure.")}
${fila("Anonadado X", "Desventaja en pruebas y salvaciones de Inteligencia, Sabiduría y Carisma y en ataques de conjuro.")}
${fila("Drenado X", "Sus PG máximos bajan X × su nivel hasta un descanso largo.")}
${fila("Indispuesto X", "Envenenado mientras dure.")}
${fila("Lentificado X", "Su velocidad baja a la mitad y no puede usar reacciones.")}
${fila("Aturdido X", "Aturdido hasta el final de su próximo turno.")}
${fila("Deslumbrado", "Desventaja en ataques y en pruebas de Percepción que dependan de la vista.")}
${fila("Cegado, ensordecido, paralizado, petrificado, inconsciente, invisible", "El estado de D&amp;D con el mismo nombre.")}
${fila("Agarrado, neutralizado, inmovilizado", "Agarrado, Apresado y velocidad 0.")}
${fila("Derribado", "Derribado.")}
${fila("Fascinado, controlado", "Hechizado.")}
${fila("Fatigado", "Un nivel de Agotamiento hasta un descanso largo.")}
${fila("Oculto, escondido", "Oscuridad ligera o Escondido, según el texto.")}
</tbody></table></section>`;
}

/* ---------- Foundry ---------- */
const soyDM = () => !!game.user?.isGM && (game.users?.activeGM ? game.users.activeGM.isSelf : true);
const ajuste = () => { try { return game.settings.get(MOD, "conjurosPF2e") ?? {}; } catch { return {}; } };

/** Lleva los conjuros de `Data/ecos-pf2e/conjuros-dnd5e.json` al compendio del mundo. Solo el DM principal. */
/**
 * 3.37 · Nivela a D&D lo que queda de PF2e en el texto de un conjuro (pedido del autor: «algunos tienen aún acciones de
 * PF2e como Raise Shield»). Cambia las acciones y términos de PF2e por su equivalente en D&D y deja una nota. Puro.
 */
export const MARCA_NIVELADO = "data-ecos-nivelado";
export function nivelarTextoPF2e(html) {
  let t = String(html ?? "");
  if (t.includes(MARCA_NIVELADO)) return t;
  const usados = new Set();
  const R = (re, a, nota) => { if (re.test(t)) { t = t.replace(re, a); if (nota) usados.add(nota); } re.lastIndex = 0; };
  R(/(?:la acci[oó]n )?Alzar un escudo/gi, "levantar la guardia (acción adicional)", "Levantar la guardia: +2 a la CA hasta el inicio de tu próximo turno, como con un escudo.");
  R(/Bloque(?:ar|o) con (?:el )?escudo/gi, "bloquear con tu reacción", "Bloquear: con tu reacción, cuando un golpe te impacta, el escudo absorbe el daño que diga el conjuro.");
  R(/Dureza (\d+)/g, "que absorbe $1 de daño por golpe");
  R(/bonificador (?:por circunstancia|de estatus|de objeto)/gi, "bonificador");
  R(/penalizador (?:por circunstancia|de estatus|de objeto)/gi, "penalizador");
  R(/\bun Golpe\b/g, "un ataque con arma"); R(/\bGolpes\b/g, "ataques con arma"); R(/\bGolpe\b(?! sin armas)/g, "ataque con arma");
  R(/\bZancada\b/g, "movimiento"); R(/\b(?:dar )?un Paso\b/g, "moverse 1,5 m sin provocar ataques de oportunidad");
  R(/prueba plana(?: CD| de CD)? (\d+)/gi, "tirada de 1d20 sin modificadores (con $1 o más)"); R(/prueba plana/gi, "tirada de 1d20 sin modificadores");
  R(/rango de conjuro/gi, "nivel de conjuro");
  R(/acci[oó]n gratuita/gi, "acción gratuita (no gasta acciones)");
  if (/desprevenid/i.test(t)) usados.add("Desprevenido: los ataques contra él tienen ventaja.");
  if (/\bMantener\b/.test(t)) usados.add("Mantener: con tu acción adicional, como concentrarse en D&D.");
  if (/persistente/i.test(t)) usados.add("Daño persistente: al inicio de su turno lo vuelve a recibir; termina con una acción y una tirada de 1d20 con 15 o más.");
  if (/ataque m[uú]ltiple/i.test(t)) usados.add("En D&D no hay penalizador por ataque múltiple: ignóralo.");
  const notas = [...usados];
  return `${t}<p ${MARCA_NIVELADO}><i>Nivelado a D&D (Ecos 3.37)${notas.length ? `: ${notas.join(" ")}` : "."}</i></p>`;
}
export async function importarConjuros({ forzar = false, avisar = true } = {}) {
  if (!soyDM()) return { ok: false, motivo: "Solo el DM." };
  let datos;
  try {
    const r = await fetch(foundry.utils.getRoute(RUTA), { cache: "no-store" });
    if (!r.ok) return { ok: false, motivo: `No está ${RUTA} en tu carpeta de datos.` };
    datos = await r.json();
  } catch { return { ok: false, motivo: `No se pudo leer ${RUTA}.` }; }
  const previo = ajuste();
  if (!forzar && previo.huella === datos.huella && previo.version === VERSION_IMPORTADOR && game.packs.get(PACK_CONJUROS)) return { ok: true, ya: true, total: previo.total };
  const CC = foundry.documents.collections.CompendiumCollection;
  if (avisar) ui.notifications.info(`Ecos: llevando ${datos.total} conjuros de PF2e al compendio. Tarda un minuto.`);
  const pack = game.packs.get(PACK_CONJUROS) ?? await CC.createCompendium({ type: "Item", label: "Conjuros de PF2e (Ecos)", name: "ecos-conjuros-pf2e" });
  if (pack.locked) await pack.configure({ locked: false });
  // Carpetas por nivel.
  const carpetas = {};
  const yaCarpetas = lista(pack.folders);
  for (const n of [...new Set(datos.conjuros.map(c => c.system.level))].sort((a, b) => a - b)) {
    carpetas[n] = yaCarpetas.find(f => f.name === NIVEL[n])?.id
      ?? (await Folder.implementation.create({ name: NIVEL[n], type: "Item", sorting: "a", sort: n * 100 }, { pack: pack.collection })).id;
  }
  // Se rehacen enteros: son del módulo, no se editan a mano.
  const indice = await pack.getIndex();
  const nuestros = new Set(datos.conjuros.map(c => c._id));
  const borrar = lista(indice).map(e => e._id).filter(id => nuestros.has(id));
  for (let i = 0; i < borrar.length; i += 200) await Item.implementation.deleteDocuments(borrar.slice(i, i + 200), { pack: pack.collection });
  const docs = datos.conjuros.map(c => ({ ...c, system: { ...c.system, description: { ...(c.system.description ?? {}), value: nivelarTextoPF2e(c.system.description?.value) } }, folder: carpetas[c.system.level] ?? null }));
  for (let i = 0; i < docs.length; i += 100) await Item.implementation.createDocuments(docs.slice(i, i + 100), { pack: pack.collection, keepId: true });
  // Listas de clase y glosario.
  const packL = game.packs.get(PACK_LISTAS) ?? await CC.createCompendium({ type: "JournalEntry", label: "Listas de conjuros de PF2e (Ecos)", name: "ecos-listas-pf2e" });
  if (packL.locked) await packL.configure({ locked: false });
  const viejos = lista(await packL.getIndex()).map(e => e._id);
  if (viejos.length) await JournalEntry.implementation.deleteDocuments(viejos, { pack: packL.collection });
  const niveles = [...new Set(datos.conjuros.map(c => Number(c.system.level)))].sort((a, b) => a - b);
  const [diario] = await JournalEntry.implementation.createDocuments([{ name: "Conjuros de PF2e (Ecos)",
    pages: [{ name: "Cómo leer los conjuros de PF2e", type: "text", sort: 0, text: { format: 1, content: glosarioHTML() } },
      ...niveles.map((n, i) => ({ name: `Biblioteca · ${NIVEL[n]}`, type: "text", sort: 1000 + i * 10, text: { format: 1, content: indiceHTML(datos.conjuros, n, pack.collection) } })),
      ...paginasListas(datos.listas, pack.collection).map((p, i) => ({ ...p, sort: 5000 + (i + 1) * 100 }))] }], { pack: packL.collection });
  const listas = lista(diario.pages).filter(p => p.type === "spells").map(p => p.uuid);
  await game.settings.set(MOD, "conjurosPF2e", { huella: datos.huella, version: VERSION_IMPORTADOR, total: datos.total, listas, fecha: new Date().toISOString() });
  registrarListas(listas);
  if (avisar) ui.notifications.info(`Ecos: ${datos.total} conjuros de PF2e en «Conjuros de PF2e (Ecos)», con sus listas de clase.`);
  return { ok: true, total: datos.total };
}
function registrarListas(uuids) {
  const reg = globalThis.dnd5e?.registry?.spellLists;
  if (!reg) return;
  for (const u of uuids ?? []) reg.register(u).catch?.(err => console.warn(`${MOD} | lista de conjuros`, u, err));
}

/** Nivel más alto que la clase puede lanzar, con su progresión (como hace dnd5e al subir de nivel). */
export function nivelMaximoClase(actor, cls) {
  try {
    const A = CONFIG.Actor.documentClass, sc = cls.spellcasting;
    const progresion = Object.fromEntries(Object.keys(CONFIG.DND5E.spellcasting).map(k => [k, 0]));
    const max = Object.keys(CONFIG.DND5E.spellLevels).length - 1;
    const spells = Object.fromEntries(Array.fromRange(max, 1).map(l => [`spell${l}`, {}]));
    A.computeClassProgression(progresion, cls, { spellcasting: sc });
    A.prepareSpellcastingSlots(spells, sc.type, progresion);
    const n = nivelMaximoDe(spells);
    if (n) return n;
  } catch { /* abajo */ }
  return nivelMaximoDe(actor.system?.spells);
}

async function elegirClase(actor) {
  const clases = Object.entries(actor.spellcastingClasses ?? {});
  if (clases.length <= 1) return clases[0] ?? null;
  const id = await foundry.applications.api.DialogV2.wait({ window: { title: "¿Para qué clase?" },
    content: "<p>Elige de qué lista de clase buscas conjuros.</p>",
    buttons: clases.map(([k, c], i) => ({ action: k, label: c.name, default: i === 0 })), rejectClose: false });
  return clases.find(([k]) => k === id) ?? null;
}

/** La lupa: abre el buscador de dnd5e con la lista de la clase y añade lo que se elija. */
/** 3.37 · Nivel de conjuro más alto de un PNJ por su nivel de lanzador (o su VD). Puro. */
export const nivelMaximoPNJ = (nivelLanzador, vd = 0) => Math.max(0, Math.min(9, Math.ceil((Number(nivelLanzador) || Math.max(1, Math.ceil(Number(vd) || 0))) / 2)));
/** 3.37 · Un PNJ (sin clase) elige de qué lista aprende, y si se ve su lista o todo. */
async function elegirListaPNJ(actor) {
  const r = await foundry.applications.api.DialogV2.wait({ window: { title: `¿Qué conjuros aprende ${actor.name}?` },
    content: `<p>Este PNJ no tiene clase: elige la lista que usa. Su nivel más alto sale de su nivel de lanzador (o su VD).</p><select name="lista">${Object.entries(NOMBRE_CLASE).map(([k, n]) => `<option value="${k}">${n}</option>`).join("")}</select>`,
    buttons: [{ action: "ok", label: "Buscar", default: true, callback: (_e, b) => b.form.elements.lista.value }, { action: "no", label: "Cancelar" }], rejectClose: false });
  if (!r || r === "no") return null;
  return [r, { name: NOMBRE_CLASE[r], system: { levels: Number(actor.system?.attributes?.spell?.level) || 1 }, pnj: true }];
}
export async function abrirLupa(actor, nivel = null, { todos = false, clase: claseFija = null, max = null, minimo = 0, preparar = false } = {}) {
  const Browser = globalThis.dnd5e?.applications?.CompendiumBrowser;
  if (!actor?.isOwner || !Browser) return;
  // 3.54: desde un hueco vacío la clase ya viene dada y se elige como mucho lo que falta.
  const fija = claseFija ? Object.entries(actor.spellcastingClasses ?? {}).find(([k]) => k === claseFija) ?? null : null;
  const elegida = fija ?? (await elegirClase(actor)) ?? (actor.type === "npc" ? await elegirListaPNJ(actor) : null);
  if (!elegida) return actor.type === "npc" ? null : ui.notifications.warn("Esta hoja no tiene una clase que lance conjuros.");
  const [clase, cls] = elegida;
  const maxNivel = cls.pnj ? nivelMaximoPNJ(actor.system?.attributes?.spell?.level, actor.system?.details?.cr) : nivelMaximoClase(actor, cls);
  const nv = nivel == null || nivel === "" ? null : Math.min(Number(nivel), maxNivel);
  if (nv != null && Number(nivel) > maxNivel) return ui.notifications.warn(`Todavía no lanzas conjuros de nivel ${nivel} con tu ${cls.name}.`);
  const mago = clase === "wizard", nivelClase = Number(cls.system?.levels) || 1;
  const quedan = mago ? gratisMago(nivelClase, contarGratisMago(actor.items)) : null;
  // 3.37: «todos» quita el filtro de lista: salen todos los conjuros de D&D y de PF2e de esos niveles.
  const lista_ = !todos && globalThis.dnd5e.registry.spellLists.forType("class", clase) ? { [`class:${clase}`]: 1 } : undefined;
  const filters = { locked: { documentClass: "Item", exclusive: true, types: new Set(["spell"]), additional: {
    level: nv != null ? { min: nv, max: nv } : { min: Math.min(Number(minimo) || 0, maxNivel), max: maxNivel }, ...(lista_ ? { spelllist: lista_ } : {}) } } };
  const hint = mago ? `Libro de ${esc(actor.name)}: te quedan ${quedan} conjuros gratis de nivel 1 o más (6 al nivel 1 y 2 por nivel). Los trucos no cuentan. Los demás se copian al libro por 50 po y 2 horas por nivel.`
    : `Lista de ${esc(cls.name)}: hasta nivel ${maxNivel}. Añadirlos no cuesta nada; preparas los que diga tu clase.`;
  const tope = Number(max) > 0 ? Number(max) : null;
  const sel = await Browser.select({ filters, hint: tope ? `${hint} Puedes elegir ${tope}.` : hint, selection: { min: 1, max: tope } });
  if (!sel?.size) return;
  await anadirConjuros(actor, clase, [...sel].slice(0, tope ?? undefined), { mago, quedan, preparar: preparar && !mago });
}

async function anadirConjuros(actor, clase, uuids, { mago, quedan, preparar = false }) {
  const ya = new Set(lista(actor.items).filter(i => i.type === "spell").map(i => i.system?.identifier || i.name));
  const docs = [], aPreparar = [];
  for (const u of uuids) {
    const d = await fromUuid(u); if (!d) continue;
    if (!ya.has(d.system?.identifier || d.name)) { docs.push([u, d]); continue; }
    // 3.54: si ya lo tenía sin preparar y viene de un hueco, se prepara.
    const it = preparar && Number(d.system?.level) >= 1 ? lista(actor.items).find(i => i.type === "spell" && (i.system?.identifier || i.name) === (d.system?.identifier || d.name) && !Number(i.system?.prepared)) : null;
    if (it) aPreparar.push({ _id: it.id, "system.prepared": 1 });
  }
  if (aPreparar.length) await actor.updateEmbeddedDocuments("Item", aPreparar);
  if (!docs.length) return ui.notifications.info(aPreparar.length ? "Preparados los que ya tenías." : "Ya tenías esos conjuros.");
  const trucos = docs.filter(([, d]) => Number(d.system.level) === 0);
  const nivelados = docs.filter(([, d]) => Number(d.system.level) >= 1);
  let gratis = nivelados, copias = [];
  if (mago) { gratis = nivelados.slice(0, quedan); copias = nivelados.slice(quedan); }
  const rareza = d => d.flags?.[MOD]?.pf2e?.rareza ?? "common";
  const coste = copias.reduce((a, [, d]) => { const c = costeCopia(d.system.level, rareza(d)); return { po: a.po + c.po, horas: a.horas + c.horas }; }, { po: 0, horas: 0 });
  if (copias.length) {
    const ok = await foundry.applications.api.DialogV2.confirm({ window: { title: "Copiar al libro" },
      content: `<p>Ya usaste tus conjuros gratis. Copiar ${copias.map(([, d]) => `<strong>${esc(d.name)}</strong>`).join(", ")} al libro cuesta <strong>${coste.po} po</strong> y <strong>${coste.horas} horas</strong> (Manual: 50 po y 2 horas por nivel; los raros de PF2e cuestan más).</p><p>Necesitas tenerlos escritos: un pergamino o el libro de otro mago.</p>` });
    if (!ok) copias = [];
    else {
      try { await globalThis.dnd5e.applications.CurrencyManager.deductActorCurrency(actor, coste.po, "gp", { recursive: true, priority: "high" }); }
      catch { ui.notifications.error(`No te alcanza: copiar cuesta ${coste.po} po.`); copias = []; }
    }
  }
  const crear = [
    ...trucos.map(([u, d]) => datosParaHoja(d.toObject(), clase, "truco", u)),
    ...gratis.map(([u, d]) => datosParaHoja(d.toObject(), clase, mago ? "nivel" : "lista", u)),
    ...copias.map(([u, d]) => datosParaHoja(d.toObject(), clase, "copia", u, costeCopia(d.system.level, rareza(d))))
  ];
  if (!crear.length) return;
  if (preparar) for (const c of crear) if (Number(c.system?.level) >= 1) c.system.prepared = 1;
  await actor.createEmbeddedDocuments("Item", crear);
  const nombres = crear.map(c => esc(c.name)).join(", ");
  ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), whisper: [...game.users.filter(u => u.isGM).map(u => u.id), game.user.id],
    content: `<section class="ecos-conjuros"><h3>${esc(actor.name)} suma conjuros</h3><p>${nombres}.</p>${copias.length ? `<p>Copiados al libro: ${coste.po} po y ${coste.horas} horas.</p>` : ""}</section>` });
}

/** La guía para los jugadores (3.26): cómo sumar conjuros de D&D y de PF2e a la hoja. Pura. */
export function guiaConjurosHTML() {
  return `<section class="mcp-journal"><h1>Conjuros: cómo sumarlos a tu hoja</h1>
<p><em>Para las clases que lanzan conjuros (mago, hechicero, bardo, brujo, clérigo, druida, paladín, explorador). Los conjuros de Pathfinder 2e ya están convertidos a D&D: aparecen junto a los del Manual y se usan igual.</em></p>
<h2>Paso a paso</h2>
<ol><li>Abre tu hoja y ve a la pestaña <b>Conjuros</b>. Arriba, <b>Conjuros por nivel</b> muestra los huecos que te da tu clase (trucos y preparados, o el libro del mago): cada <i class="fa-solid fa-plus"></i> vacío abre el buscador con los que puedes aprender, y si ya tienes conjuros sin preparar te ofrece prepararlos.</li>
<li>Pulsa <b>Aprender conjuros</b>, arriba, o la <b>lupa</b> <i class="fa-solid fa-magnifying-glass"></i> que hay junto al nombre de cada nivel (la lupa busca solo ese nivel).</li>
<li>Si tienes más de una clase que lanza conjuros, elige de qué lista buscas.</li>
<li>Se abre el buscador con tu lista de clase y solo los niveles que ya puedes lanzar. Los de PF2e están mezclados con los del Manual; puedes filtrar por nombre, escuela o nivel.</li>
<li>Marca los que quieras y confirma. Aparecen en tu hoja y en el chat (lo ven tú y el DM).</li>
<li>Prepáralos como diga tu clase: el círculo junto a cada conjuro marca si está preparado.</li></ol>
<h2>Cuánto cuesta</h2>
<ul><li><b>Mago</b> (Manual 2024): 6 conjuros de nivel 1 gratis al empezar y 2 gratis por cada nivel que subes. Los trucos no cuentan. Los demás se copian al libro por <b>50 po y 2 horas por nivel</b> del conjuro. Los de PF2e poco comunes cuestan ×1,5; los raros, ×2; los únicos, ×3. El panel te dice cuántos gratis te quedan.</li>
<li><b>Las demás clases:</b> sumarlos a tu lista no cuesta nada. Preparas o conoces los que diga tu clase, como en el Manual.</li></ul>
<h2>Si no ves la lupa</h2>
<ul><li>Tu hoja no tiene una clase que lance conjuros (un pícaro o un pugilista no la tienen).</li>
<li>O el DM apagó «Lupa de conjuros en las hojas» en la configuración del módulo.</li>
<li>Los conjuros de PF2e los carga el DM al abrir el mundo. Si el buscador solo muestra los del Manual, avísale.</li></ul>
<p><em>El DM tiene la última palabra sobre qué conjuros existen en Nimerios y cómo se aprenden en la historia.</em></p></section>`;
}

function botonAprender(actor) {
  const caja = document.createElement("span");
  caja.className = "ecos-aprender-conjuros-caja";
  const b = document.createElement("button");
  Object.assign(b, { type: "button", className: "ecos-aprender-conjuros", innerHTML: '<i class="fa-solid fa-book-medical" inert></i> Aprender conjuros' });
  b.dataset.tooltip = "Buscar conjuros de D&D y de PF2e de tu lista de clase y sumarlos a la hoja. Con Mayús: todos los conjuros, sin filtro de lista.";
  b.addEventListener("click", ev => { ev.preventDefault(); ev.stopPropagation(); abrirLupa(actor, null, { todos: ev.shiftKey }).catch(err => console.error(`${MOD} | lupa`, err)); });
  const q = document.createElement("button");
  Object.assign(q, { type: "button", className: "ecos-quitar-conjuros", innerHTML: '<i class="fa-solid fa-book-skull" inert></i> Quitar conjuros' });
  q.dataset.tooltip = "Quitar de la hoja los conjuros que elijas (los de D&D y los de PF2e).";
  q.addEventListener("click", ev => { ev.preventDefault(); ev.stopPropagation(); quitarConjuros(actor).catch(err => console.error(`${MOD} | quitar conjuros`, err)); });
  caja.append(b, q);
  return caja;
}
/** 3.37: quitar conjuros de la hoja eligiéndolos de una lista. */
export async function quitarConjuros(actor) {
  const sp = lista(actor.items).filter(i => i.type === "spell").sort((a, b) => (a.system.level - b.system.level) || a.name.localeCompare(b.name, "es"));
  if (!sp.length) return ui.notifications.info("No tiene conjuros.");
  const r = await foundry.applications.api.DialogV2.wait({ window: { title: `Quitar conjuros · ${actor.name}` }, position: { width: 420 },
    content: `<p>Marca los que quieres quitar de la hoja.</p><div style="max-height:420px;overflow:auto">${sp.map(i => `<label class="ecos-check"><input type="checkbox" name="${i.id}"> ${i.system.level ? `Nivel ${i.system.level}` : "Truco"} · ${esc(i.name)}${i.flags?.[MOD]?.pf2e ? " <small>(PF2e)</small>" : ""}</label>`).join("")}</div>`,
    buttons: [{ action: "ok", label: "Quitar los marcados", icon: "fa-solid fa-trash", callback: (_e, b) => sp.filter(i => b.form.elements[i.id]?.checked).map(i => i.id) }, { action: "no", label: "Cancelar", default: true }], rejectClose: false });
  if (!Array.isArray(r) || !r.length) return;
  await actor.deleteEmbeddedDocuments("Item", r);
  ui.notifications.info(`${actor.name}: ${r.length} conjuro${r.length === 1 ? "" : "s"} quitado${r.length === 1 ? "" : "s"}.`);
}

function decorarLibro(app, html) {
  try {
    const actor = app?.document ?? app?.actor;
    // 3.37: también en los PNJ (magos que aprenden conjuros nuevos): eligen su lista al abrir.
    if (!(actor instanceof Actor) || !["character", "npc"].includes(actor.type) || !actor.isOwner) return;
    try { if (game.settings.get(MOD, "lupaConjuros") === false) return; } catch { /* sigue */ }
    if (actor.type === "character" && !Object.keys(actor.spellcastingClasses ?? {}).length) return;
    const raiz = app.element instanceof HTMLElement ? app.element : html;
    for (const sec of raiz.querySelectorAll?.('.items-section[data-type="spell"]') ?? []) {
      const cab = sec.querySelector(".items-header");
      if (!cab || cab.querySelector(".ecos-lupa")) continue;
      const b = document.createElement("button");
      Object.assign(b, { type: "button", className: "unbutton ecos-lupa", innerHTML: '<i class="fa-solid fa-magnifying-glass" inert></i>' });
      b.dataset.tooltip = "Buscar conjuros de D&D y PF2e para este nivel";
      b.setAttribute("aria-label", b.dataset.tooltip);
      b.addEventListener("click", ev => { ev.preventDefault(); ev.stopPropagation(); abrirLupa(actor, sec.dataset.level).catch(err => console.error(`${MOD} | lupa`, err)); });
      cab.querySelector(".item-name")?.after(b);
    }
    // 3.26: un botón grande arriba del libro, que sirve aunque todavía no haya ningún nivel con conjuros.
    if (!raiz.querySelector?.(".ecos-aprender-conjuros")) {
      const primera = raiz.querySelector?.('.items-section[data-type="spell"]');
      const tab = raiz.querySelector?.('.tab[data-tab="spells"]');
      const caja = document.createElement("div");
      caja.className = "ecos-aprender-conjuros-fila";
      caja.style.cssText = "display:flex;justify-content:flex-end;gap:4px;margin:4px 0";
      caja.append(botonAprender(actor));
      if (primera?.parentElement) primera.parentElement.insertBefore(caja, primera);
      else tab?.prepend(caja);
    }
  } catch (err) { console.warn(`${MOD} | lupa de conjuros`, err); }
}

if (globalThis.Hooks) {
  Hooks.once("init", () => {
    try {
      game.settings.register(MOD, "conjurosPF2e", { scope: "world", config: false, type: Object, default: {} });
      game.settings.register(MOD, "lupaConjuros", { name: "Lupa de conjuros en las hojas", hint: "Un botón por nivel en el libro de conjuros para buscar conjuros de D&D y de PF2e de tu lista de clase y sumarlos. El mago sigue el Manual: gratis los de cada nivel y copiar al libro el resto.",
        scope: "world", config: true, type: Boolean, default: true });
    } catch { /* ya */ }
  });
  Hooks.once("setup", () => registrarListas(ajuste().listas));
  Hooks.once("ready", () => {
    (game.modules.get(MOD).api ??= {}).conjuros = { importar: importarConjuros, lupa: abrirLupa, guia: guiaConjurosHTML };
    if (soyDM() && game.system.id === "dnd5e" && game.settings.get(MOD, "lupaConjuros") !== false)
      import("./acciones-comunes.js").then(m => m.paginaReglas("guiaConjuros", "15 · Conjuros: cómo sumarlos a tu hoja", guiaConjurosHTML())).catch(err => console.error(`${MOD} | guía de conjuros`, err));
    // 3.37: los conjuros de PF2e que ya están en las hojas también se nivelan a D&D.
    if (soyDM()) setTimeout(async () => {
      for (const a of game.actors ?? []) {
        const cambios = lista(a.items).filter(i => i.type === "spell" && i.flags?.[MOD]?.pf2e && !String(i.system?.description?.value ?? "").includes(MARCA_NIVELADO))
          .map(i => ({ _id: i.id, "system.description.value": nivelarTextoPF2e(i.system.description.value) }));
        if (cambios.length) await a.updateEmbeddedDocuments("Item", cambios).catch(err => console.warn(`${MOD} | nivelar conjuros`, err));
      }
    }, 20000);
    if (soyDM() && game.system.id === "dnd5e") setTimeout(() => importarConjuros().then(r => { if (r?.ok === false && !/No está/.test(r.motivo)) console.warn(`${MOD} |`, r.motivo); }).catch(err => console.error(`${MOD} | conjuros de PF2e`, err)), 12000);
  });
  Hooks.on("renderActorSheetV2", decorarLibro);
}
