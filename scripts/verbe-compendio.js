/**
 * Compendios del Verbe para los diarios (tareas 4.5b y 4.5c, versión 3.11). Reglas puras: reciben el catálogo y
 * devuelven HTML; quién lo ve y dónde se guarda lo decide verbe.js (asegurarCompendios).
 *
 * - compendioJugadoresHTML: lo que el panel ya enseña a quien despertó (ramas, rangos, naturalezas y dotes). Nada de
 *   dioses, linajes, Miradas con su origen, pactos, tradiciones, bestias, artefactos ni reliquias: eso se descubre jugando.
 * - compendioDMHTML: lo secreto, con notas de uso. Miradas y de quién vienen, pactos, escuelas, tradiciones, hitos,
 *   bestias, artefactos, dotes que concede el DM y cuántas técnicas hay por rama y grado.
 */
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const lista = x => (Array.isArray(x) ? x : []);
const tabla = (cab, filas) => `<table><thead><tr>${cab.map(c => `<th>${c}</th>`).join("")}</tr></thead><tbody>${filas.map(f => `<tr>${f.map(c => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
const nombreRama = (D, id) => lista(D.ramas).find(r => r.id === id)?.nombre ?? id;
const nombreRango = (D, n) => lista(D.rangos)[Number(n)]?.nombre ?? `rango ${n}`;
const metaDe = t => t?.item?.flags?.["ecos-frontera"]?.verbe ?? {};

/** Lo que pide una dote, en una línea. */
export function requisitoDoteTexto(d, D) {
  if (d?.req) return String(d.req);
  const r = d?.requisitos ?? {}, partes = [];
  if (Number(r.nivel) > 1) partes.push(`nivel ${r.nivel}`);
  for (const [rama, n] of Object.entries(r.ramas ?? {})) partes.push(`${nombreRama(D, rama)}, ${nombreRango(D, n)}`);
  for (const id of lista(r.dotes)) partes.push(lista(D.dotes).find(x => x.id === id)?.nombre ?? id);
  if (r.dm) partes.push("lo concede el DM");
  return partes.join("; ") || "nada";
}

function dotesPorCategoria(D, texto, incluir = () => true) {
  const cats = lista(D.categoriasDote), grupos = new Map();
  for (const d of lista(D.dotes).filter(incluir)) { const c = d.cat ?? "otras"; if (!grupos.has(c)) grupos.set(c, []); grupos.get(c).push(d); }
  const orden = c => { const i = cats.findIndex(x => x.id === c); return i < 0 ? 99 : i; };
  return [...grupos.entries()].sort((a, b) => orden(a[0]) - orden(b[0])).map(([c, ds]) => {
    const cat = cats.find(x => x.id === c);
    ds.sort((a, b) => (a.trazos ?? 0) - (b.trazos ?? 0) || String(a.nombre).localeCompare(String(b.nombre), "es"));
    return `<h3>${esc(cat?.nombre ?? "Otras")} <small>(${ds.length})</small></h3>${cat?.texto ? `<p><em>${esc(cat.texto)}</em></p>` : ""}
      ${tabla(["Dote", "Trazos", "Pide", "Qué da"], ds.map(d => [`<strong>${esc(d.nombre)}</strong>`, esc(d.trazos ?? 0), esc(requisitoDoteTexto(d, D)), esc(texto(d))]))}`;
  }).join("");
}

/** Página para jugadores: sin secretos de campaña. */
export function compendioJugadoresHTML(D) {
  const ramas = lista(D.ramas), nats = lista(D.naturalezas), combos = Object.values(D.combos ?? {});
  const nombreNat = id => nats.find(n => n.id === id)?.nombre ?? id;
  return `<section class="ecos-compendio"><h1>Compendio del Verbe</h1>
<p><em>Para consultar fuera de la mesa. El panel del Verbe manda: lo que dice tu panel es lo que vale para tu personaje. Lo que todavía no sabes no aparece aquí.</em></p>
<h2>Ramas</h2>
<p>Cada técnica pertenece a una rama. Subir de rango en una rama abre técnicas de más grado.</p>
${tabla(["Rama", "Qué es"], ramas.map(r => [`<strong>${esc(r.nombre)}</strong>`, esc(r.jugador ?? "")]))}
<h2>Rangos</h2>
${tabla(["Rango", "Hasta el grado", "Desde el nivel", "Cuesta (Trazos)"], lista(D.rangos).map(r => [`<strong>${esc(r.nombre)}</strong>`, esc(r.grado), esc(r.nivel), esc(r.trazos)]))}
<h2>Naturalezas</h2>
<p>Las cinco naturalezas son ${nats.map(n => `<strong>${esc(n.nombre)}</strong>`).join(", ").replace(/, ([^,]*)$/, " y $1")}. Dos naturalezas juntas forman una combinación, que se aprende con la dote «Naturaleza combinada» y un maestro.</p>
${combos.length ? tabla(["Combinación", "Se forma con"], combos.map(c => [`<strong>${esc(c.nombre)}</strong>`, esc(lista(c.de).map(nombreNat).join(" + "))])) : ""}
<h2>Dotes</h2>
<p>Mejoras permanentes. Cada una se paga una vez con Trazos y queda como rasgo en tu hoja. Las que dicen «lo concede el DM» o piden un maestro se piden en la mesa.</p>
${dotesPorCategoria(D, d => d.textoJ ?? d.texto ?? "", d => !d.legado)}
<p>Cada sangre tiene además su <b>legado</b>: un árbol que abre la fuerza de la sangre. Lo ves en tu panel cuando conoces tu linaje.</p>
</section>`;
}

/** Cuántas técnicas abre cada requisito secreto (tradición, hito, bestia, artefacto). */
function cuentaAcceso(D, campo) {
  const n = new Map();
  for (const t of lista(D.tecnicas)) { const v = metaDe(t).acceso?.[campo]; if (v) n.set(v, (n.get(v) ?? 0) + 1); }
  return n;
}

/** Diario del DM: lo secreto y cómo darlo. */
export function compendioDMHTML(D) {
  const ramas = lista(D.ramas), grados = [...Array(12).keys()];
  const porRama = ramas.map(r => {
    const ts = lista(D.tecnicas).filter(t => t.rama === r.id);
    return [`<strong>${esc(r.nombre)}</strong>`, ...grados.map(g => { const c = ts.filter(t => t.g === g).length; return c ? String(c) : "·"; }), `<strong>${ts.length}</strong>`];
  });
  const linaje = id => lista(D.linajes).find(l => l.id === id || l.id === String(id ?? "").replace(/-/g, ""));
  const miradas = lista(D.miradas).map(m => [`<strong>${esc(m.nombre)}</strong>`, esc(m.real ?? ""), esc(linaje(m.linaje)?.real ?? linaje(m.linaje)?.nombre ?? "— (no viene de un dios)"), esc(lista(m.etapas).length)]);
  const sec = (titulo, nota, mapa, filas) => filas.length ? `<h3>${titulo} <small>(${filas.length})</small></h3><p>${nota}</p>${tabla(["Nombre", "Técnicas que abre"], filas.map(x => [esc(x.nombre ?? x.id), esc(mapa.get(x.id) ?? 0)]))}` : "";
  const dotesDM = lista(D.dotes).filter(d => d.requisitos?.dm);
  return `<section class="ecos-compendio-dm"><h1>Compendio del Verbe (solo DM)</h1>
<p><em>Solo DM. Lo que los jugadores no ven en su compendio. Las herencias de dios, con su nombre verdadero, están en el diario «Mundo 10 · El Verbe por dentro» si tu mundo lo tiene; si no, en la pestaña DM del panel de cada personaje.</em></p>
<h2>Cómo se da cada cosa</h2>
<ul><li><strong>Sangre o herencia:</strong> una por personaje, con su fuerza (rastro, débil, media o plena). Pestaña DM → linaje.</li><li><strong>Mirada:</strong> heredada (es su sangre) o trasplantada (no lo es). Despierta etapa a etapa; cada etapa se paga en un hito.</li><li><strong>Pacto:</strong> un contrato con un linaje de criaturas que se gana en una misión.</li><li><strong>Tradición, hito, bestia o artefacto:</strong> los concedes tú en el «Archivo del Verbe» de la pestaña DM cuando pasen en la historia. Sin eso, sus técnicas no aparecen.</li><li><strong>Naturaleza secreta:</strong> si la primera naturaleza es secreta, la fijas tú y el jugador la descubre entrenando.</li></ul>
<h2>Miradas</h2>
${tabla(["Lo que ve el jugador", "De verdad", "Linaje", "Etapas"], miradas)}
<h2>Pactos</h2>
${tabla(["Linaje de criaturas", "Tamaño", "Movimiento", "Daño", "Rasgo"], lista(D.pactos).map(p => [`<strong>${esc(p.linaje)}</strong>`, esc(p.tamano), esc(p.mov), esc(p.dano), esc(p.rasgo)]))}
<h2>Escuelas</h2>
${tabla(["Escuela", "Rama", "Su don"], lista(D.escuelas).map(e => [`<strong>${esc(e.nombre)}</strong>`, esc(e.rama), esc(e.don)]))}
<h2>Lo que concedes tú</h2>
${sec("Tradiciones", "Aprendizajes secretos. Algunas traen un pacto.", cuentaAcceso(D, "tradicion"), lista(D.tradicionesShinobi))}
${sec("Hitos", "Momentos de la historia que abren técnicas. «Eco de los Primeros» y «Memoria de la Madre» son los de la sangre divina.", cuentaAcceso(D, "hito"), lista(D.hitosShinobi))}
${sec("Bestias", "Lo que lleva dentro un huésped (rama Vasija).", cuentaAcceso(D, "bestia"), lista(D.bestiasShinobi))}
${sec("Artefactos", "Reliquias excepcionales con técnicas propias. Las reliquias comunes están en el «Archivo de reliquias».", cuentaAcceso(D, "artefacto"), lista(D.artefactosShinobi))}
<h2>Dotes que pide el DM <small>(${dotesDM.length})</small></h2>
${tabla(["Dote", "Trazos", "Pide", "Qué da"], dotesDM.map(d => [`<strong>${esc(d.nombre)}</strong>`, esc(d.trazos ?? 0), esc(requisitoDoteTexto(d, D)), esc(d.texto ?? "")]))}
<h2>Técnicas por rama y grado</h2>
${tabla(["Rama", ...grados.map(String), "Total"], porRama)}
<p>Total: ${lista(D.tecnicas).length} técnicas y ${lista(D.dotes).length} dotes.</p>
</section>`;
}
