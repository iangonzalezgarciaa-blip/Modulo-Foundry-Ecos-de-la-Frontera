/**
 * 3.36 · «Acción estándar» (pedido del autor): un menú como el del Verbe, en cada hoja (PJ y PNJ), con todo lo que esa
 * ficha puede hacer en su turno, separado en Acción, Acción adicional y Reacción, y explicado para quien no sabe D&D.
 * Se arma solo con lo que tiene la hoja (clases, niveles, armas, conjuros, rasgos y las acciones de cualquiera): si la
 * hoja cambia, el menú cambia. Y para el DM: daño de caída y daños indirectos aplicados directo a los tokens elegidos.
 */
const MOD = "ecos-frontera";
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const plano = s => String(s ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

/** Las acciones que cualquiera puede hacer (D&D 2024), en español y explicadas. `auto`: lo hace el módulo. */
export const ACCIONES_BASICAS = [
  { id: "atacar", n: "Atacar", tipo: "action", que: "Un ataque con un arma o sin armas (puñetazo, agarrar o empujar). Más ataques si tu clase te da Ataque Extra.", arma: true },
  { id: "magia", n: "Magia", tipo: "action", que: "Lanzar un conjuro, usar un objeto mágico o un rasgo mágico." },
  { id: "correr", n: "Correr", tipo: "action", que: "Sumas tu velocidad otra vez este turno.", auto: "correr" },
  { id: "desenganche", n: "Desengancharse", tipo: "action", que: "Este turno tu movimiento no provoca ataques de oportunidad.", auto: "desenganche" },
  { id: "esquivar", n: "Esquivar", tipo: "action", que: "Hasta tu próximo turno, los ataques contra ti tienen desventaja y tienes ventaja en salvaciones de Destreza.", auto: "esquivar" },
  { id: "ayudar", n: "Ayudar", tipo: "action", que: "Marca (T) a un aliado: tiene ventaja en su próxima prueba o en su próximo ataque (antes de tu próximo turno). Queda «Ayudado» en su hoja.", comun: "Ayudar" },
  { id: "esconderse", n: "Esconderse", tipo: "action", que: "Prueba de Sigilo (CD 15) si nadie te ve: quedas Escondido (ventaja en tu próximo ataque; atacar te delata).", comun: "Esconderse" },
  { id: "buscar", n: "Buscar", tipo: "action", que: "Prueba de Percepción, Perspicacia, Medicina o Supervivencia para notar algo o a alguien.", comun: "Buscar" },
  { id: "estudiar", n: "Estudiar", tipo: "action", que: "Prueba de Arcanos, Historia, Naturaleza, Religión o Investigación para recordar o descifrar algo.", comun: "Evaluar al enemigo" },
  { id: "influir", n: "Influir", tipo: "action", que: "Marca (T) a quien quieres convencer, engañar o intimidar: tiras contra la CD de su actitud (Amistoso 10, Indiferente 15, Hostil 20)." },
  { id: "objeto", n: "Usar un objeto", tipo: "action", que: "Beber una poción, abrir una puerta trabada, usar una herramienta. Sacar o guardar un arma es gratis una vez por turno." },
  { id: "preparar", n: "Preparar", tipo: "action", que: "Eliges una acción y qué la dispara («si se acerca, le pego»): queda anotada y, cuando pasa, la haces con tu Reacción (botón «¡Ahora!» en el panel)." },
  { id: "oportunidad", n: "Ataque de oportunidad", tipo: "reaction", que: "Cuando un enemigo que ves sale de tu alcance, le haces un ataque cuerpo a cuerpo con tu reacción." }
];

/** Agrupa lo que tiene la hoja por tipo de acción. Puro: recibe [{id, nombre, tipo, actividad, texto}]. */
export function agruparPorTiempo(entradas) {
  const g = { action: [], bonus: [], reaction: [], otra: [] };
  for (const e of entradas ?? []) (g[e.tipo] ?? g.otra).push(e);
  for (const k of Object.keys(g)) g[k].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  return g;
}
/** 3.57 · En qué pestaña va cada actividad según su tiempo de activación. */
export const ECONOMIA = { action: "accion", bonus: "adicional", reaction: "reaccion", legendary: "legendaria", mythic: "legendaria", lair: "legendaria",
  minute: "fuera", hour: "fuera", day: "fuera", special: "fuera" };
export const NOMBRE_ECONOMIA = { accion: "Acción", adicional: "Adicional", reaccion: "Reacción", legendaria: "Legendarias", fuera: "Fuera de combate" };
/** Acciones de cualquiera que se hacen durante el movimiento (sin gastar la Acción). */
export const DURANTE_MOVIMIENTO = new Set(["Abrirse paso", "Voltereta"]);
/** Las de cualquiera que valen fuera de combate (además de las de duración larga). */
export const BASICAS_FUERA = ["buscar", "estudiar", "influir", "esconderse", "objeto"];
/**
 * Reparte lo que la hoja puede hacer por pestaña y, en la de Acción, en Atacar, Magia, De tu hoja y De cualquiera.
 * Entrada: [{ id, nombre, eco, grupo: "atacar"|"magia"|"otras", comun, mov, disponible }]. Puro.
 */
export function clasificarAcciones(entradas = []) {
  const r = { accion: { atacar: [], magia: [], otras: [], comun: [], mov: [] }, adicional: { hoja: [], comun: [] }, reaccion: { hoja: [], comun: [] }, legendaria: { hoja: [] }, fuera: { hoja: [], comun: [] } };
  const orden = (a, b) => (b.disponible !== false) - (a.disponible !== false) || a.nombre.localeCompare(b.nombre, "es");
  for (const e of entradas) {
    if (e.mov) { r.accion.mov.push(e); continue; }
    const g = r[e.eco]; if (!g) continue;
    if (e.eco === "accion") (e.comun ? g.comun : g[e.grupo] ?? g.otras).push(e);
    else (e.comun && g.comun ? g.comun : g.hoja).push(e);
  }
  for (const g of Object.values(r)) for (const l of Object.values(g)) l.sort(orden);
  return r;
}
/** Cuántas hay en cada pestaña (para los botones de arriba). Puro. */
export const cuentaPestanas = c => Object.fromEntries(Object.entries(c).map(([k, g]) => [k, Object.values(g).reduce((n, l) => n + l.length, 0)]));

/** Daño de caída: 1d6 por cada 3 m (10 ft), hasta 20d6. Puro. */
export const dadosCaida = pies => Math.min(20, Math.floor(Math.max(0, Number(pies) || 0) / 10));
/** Los daños indirectos que el DM aplica directo. */
export const DANOS_INDIRECTOS = {
  caida: { n: "Caída", tipo: "bludgeoning", texto: "1d6 por cada 3 m (10 ft), hasta 20d6. Cae Derribado." },
  derrumbe: { n: "Derrumbe o escombros", formula: "4d10", tipo: "bludgeoning", salv: "dex", cd: 15, texto: "4d10 contundente; salvación de DES CD 15 para la mitad." },
  brasas: { n: "Brasas o fuego suelto", formula: "1d10", tipo: "fire", texto: "1d10 de fuego al entrar o empezar el turno ahí." },
  lava: { n: "Lava", formula: "10d10", tipo: "fire", texto: "10d10 de fuego por estar dentro." },
  acido: { n: "Charco de ácido", formula: "2d6", tipo: "acid", texto: "2d6 de ácido." },
  descarga: { n: "Agua o metal cargado", formula: "2d8", tipo: "lightning", salv: "con", cd: 13, texto: "2d8 de rayo; salvación de CON CD 13 para la mitad." },
  pared: { n: "Contra una pared (empujado)", formula: "1d6", tipo: "bludgeoning", texto: "1d6 contundente al chocar contra algo duro." },
  frio: { n: "Frío extremo (sin abrigo)", formula: "0", tipo: "cold", salv: "con", cd: 10, agota: true, texto: "Salvación de CON CD 10 cada hora o 1 nivel de Agotamiento." },
  veneno: { n: "Gas o agua envenenada", formula: "2d6", tipo: "poison", salv: "con", cd: 12, estado: "poisoned", texto: "2d6 de veneno y Envenenado; salvación de CON CD 12 para la mitad y sin el estado." },
  libre: { n: "Otro (escribe la fórmula)", formula: "", tipo: "force", texto: "Fórmula y tipo a mano." }
};

/* ---------------- Foundry ---------------- */
const leerLS = (k, d) => { try { return JSON.parse(localStorage.getItem(`${MOD}.${k}`)) ?? d; } catch { return d; } };
const guardarLS = (k, v) => { try { localStorage.setItem(`${MOD}.${k}`, JSON.stringify(v)); } catch { /* sin almacenamiento */ } };
const actividadesDe = it => Array.from(it?.system?.activities?.values?.() ?? Object.values(it?.system?.activities ?? {}));
const UNIDAD = { minute: ["minuto", "minutos"], hour: ["hora", "horas"], day: ["día", "días"] };
/** 3.57 · Todo lo que la hoja puede usar ahora, con su pestaña, su grupo y si está disponible (usos, espacios de conjuro). */
export function entradasHoja(actor) {
  const out = [], slots = actor?.system?.spells ?? {};
  const hayEspacio = nv => Object.entries(slots).some(([k, x]) => Number(x?.value) > 0 && (k === "pact" ? Number(x.level) : Number(String(k).replace(/\D/g, ""))) >= nv);
  const quedan = u => (u?.max ? Number(u.value ?? (Number(u.max) - (Number(u.spent) || 0))) : null);
  for (const it of actor?.items ?? []) {
    if (it.flags?.[MOD]?.verbe) continue;
    const comun = it.flags?.[MOD]?.accionComun, esConjuro = it.type === "spell", nv = Number(it.system?.level) || 0;
    const metodo = it.system?.method ?? it.system?.preparation?.mode;
    const prep = Number(it.system?.prepared ?? (it.system?.preparation?.prepared ? 1 : 0));
    const props = it.system?.properties; const ritual = esConjuro && (props?.has?.("ritual") || (Array.isArray(props) && props.includes("ritual")));
    const usable = !esConjuro || nv === 0 || prep >= 1 || ["innate", "atwill", "always", "pact"].includes(metodo);
    const acts = actividadesDe(it), varias = acts.length > 1;
    for (const act of acts) {
      const tipo = act.activation?.type, eco = ECONOMIA[tipo];
      if (!eco || !usable) continue;
      let disponible = true, motivo = "";
      const qi = quedan(it.system?.uses), qa = quedan(act.uses);
      if ((qi !== null && qi <= 0) || (qa !== null && qa <= 0)) { disponible = false; motivo = "sin usos"; }
      if (esConjuro && nv > 0 && !["innate", "atwill"].includes(metodo) && act.consumption?.spellSlot !== false && !hayEspacio(nv)) { disponible = false; motivo = "sin espacios"; }
      const meta = [esConjuro ? (nv ? `Nivel ${nv}` : "Truco") : "", qi !== null ? `${qi}/${it.system.uses.max} usos` : qa !== null ? `${qa}/${act.uses.max} usos` : "",
        UNIDAD[tipo] ? `${act.activation?.value ?? 1} ${UNIDAD[tipo][Number(act.activation?.value) === 1 ? 0 : 1]}` : ""].filter(Boolean).join(" · ");
      out.push({ id: `${it.id}.${act.id}`, nombre: varias ? `${it.name}: ${act.name || act.type}` : it.name, img: it.img, eco, comun: !!comun,
        mov: !!comun && DURANTE_MOVIMIENTO.has(String(act.name ?? "").trim()),
        grupo: act.type === "attack" || it.type === "weapon" ? "atacar" : esConjuro ? "magia" : "otras",
        disponible, motivo, meta, texto: plano(it.system?.description?.value).slice(0, 240) });
    }
    if (ritual && acts[0]) out.push({ id: `${it.id}.${acts[0].id}`, nombre: `${it.name} (ritual)`, img: it.img, eco: "fuera", grupo: "magia", disponible: true, motivo: "", meta: "Ritual: 10 minutos más, sin gastar espacio", texto: plano(it.system?.description?.value).slice(0, 240) });
  }
  return out;
}
/** 3.57 · El menú de acciones (panel y ventana): pestañas Acción / Adicional / Reacción / Fuera de combate arriba, y la lista. */
export function htmlAcciones(actor, { filtro = null, turno = null, enCombate = false } = {}) {
  const ent = entradasHoja(actor);
  const comunes = new Set(ent.filter(e => e.comun).map(e => e.nombre.split(":").pop().trim()));
  const basicas = ACCIONES_BASICAS.filter(a => !["atacar", "magia"].includes(a.id) && !(a.comun && comunes.has(a.comun)));
  const c = clasificarAcciones(ent), n = cuentaPestanas(c);
  n.accion += basicas.filter(a => a.tipo === "action").length; n.reaccion += basicas.filter(a => a.tipo === "reaction").length;
  n.fuera += basicas.filter(a => BASICAS_FUERA.includes(a.id)).length + 2;
  const pestanas = ["accion", "adicional", "reaccion", ...(n.legendaria ? ["legendaria"] : []), "fuera"];
  const f = pestanas.includes(filtro) ? filtro : (enCombate ? "accion" : "fuera");
  const gastada = k => enCombate && turno?.[k];
  const chip = k => `<button type="button" class="ecos-ae-chip ${k === f ? "activo" : ""} ${gastada(k) ? "gastada" : ""}" data-eco="${k}" data-tooltip="${esc(gastada(k) ? `Ya gastaste tu ${NOMBRE_ECONOMIA[k]} este turno` : NOMBRE_ECONOMIA[k])}">${NOMBRE_ECONOMIA[k]} <small>${n[k] ?? 0}</small></button>`;
  const fila = e => `<button type="button" class="ecos-ae-e ${e.disponible ? "" : "no"}" data-usar="${esc(e.id)}" data-tooltip="${esc(e.texto || e.nombre)}"><img src="${esc(e.img)}" alt=""><span><b>${esc(e.nombre)}</b>${e.meta || e.motivo ? `<small>${esc([e.meta, e.motivo].filter(Boolean).join(" · "))}</small>` : ""}</span></button>`;
  const basica = a => `<button type="button" class="ecos-ae-e basica" data-basica="${a.id}" data-tooltip="${esc(a.que)}"><i class="fa-solid ${ICONO_BASICA[a.id] ?? "fa-circle"}"></i><span><b>${esc(a.n)}</b><small>${esc(a.que.length > 70 ? `${a.que.slice(0, 68)}…` : a.que)}</small></span></button>`;
  const sec = (t, html, vacio = "") => (html ? `<h4>${t}</h4><div class="ecos-ae-l">${html}</div>` : vacio ? `<p class="ecos-ae-vacio">${vacio}</p>` : "");
  let cuerpo = "";
  if (f === "accion") cuerpo = (gastada("accion") ? `<p class="ecos-ae-aviso">Ya gastaste tu Acción este turno.</p>` : "")
    + sec("Atacar", c.accion.atacar.map(fila).join(""), "Sin armas en la hoja: un golpe sin armas o agarrar/empujar están en «De cualquiera».")
    + sec("Magia", c.accion.magia.map(fila).join("")) + sec("De tu hoja", c.accion.otras.map(fila).join(""))
    + sec("De cualquiera", [...c.accion.comun.map(fila), ...basicas.filter(a => a.tipo === "action").map(basica)].join(""))
    + sec("Al moverte (no gasta la Acción)", c.accion.mov.map(fila).join(""));
  else if (f === "adicional") cuerpo = (gastada("adicional") ? `<p class="ecos-ae-aviso">Ya gastaste tu Acción adicional este turno.</p>` : "")
    + sec("De tu hoja", c.adicional.hoja.map(fila).join(""), "Tu hoja no te da acciones adicionales propias (las dan un rasgo de clase, un conjuro o pelear con dos armas ligeras).")
    + sec("De cualquiera", c.adicional.comun.map(fila).join(""));
  else if (f === "reaccion") cuerpo = (gastada("reaccion") ? `<p class="ecos-ae-aviso">Ya gastaste tu Reacción esta ronda.</p>` : "")
    + sec("De tu hoja", c.reaccion.hoja.map(fila).join("")) + sec("De cualquiera", [...c.reaccion.comun.map(fila), ...basicas.filter(a => a.tipo === "reaction").map(basica)].join(""));
  else if (f === "legendaria") cuerpo = sec("Legendarias y de guarida", c.legendaria.hoja.map(fila).join(""));
  else cuerpo = sec("Descansar", `<button type="button" class="ecos-ae-e basica" data-descanso="corto"><i class="fa-solid fa-mug-hot"></i><span><b>Descanso corto</b><small>1 hora: gastas Dados de Golpe y recuperas lo que sea por descanso corto.</small></span></button><button type="button" class="ecos-ae-e basica" data-descanso="largo"><i class="fa-solid fa-bed"></i><span><b>Descanso largo</b><small>8 horas: recuperas casi todo.</small></span></button>${actor.type === "character" ? `<button type="button" class="ecos-ae-e basica" data-taller><i class="fa-solid fa-hammer"></i><span><b>Taller</b><small>Fabricar con tus herramientas.</small></span></button>` : ""}`)
    + sec("De tu hoja (rituales y lo que lleva minutos u horas)", c.fuera.hoja.map(fila).join("")) + sec("De cualquiera", [...c.fuera.comun.map(fila), ...basicas.filter(a => BASICAS_FUERA.includes(a.id)).map(basica)].join(""));
  return `<nav class="ecos-ae-chips">${pestanas.map(chip).join("")}</nav><div class="ecos-ae-cuerpo">${cuerpo}</div>`;
}
const ICONO_BASICA = { correr: "fa-person-running", desenganche: "fa-person-walking-arrow-right", esquivar: "fa-shield-halved", ayudar: "fa-handshake-angle", esconderse: "fa-user-ninja",
  buscar: "fa-magnifying-glass", estudiar: "fa-book-open", influir: "fa-comments", objeto: "fa-flask", preparar: "fa-hourglass-half", oportunidad: "fa-bolt" };
/** Clic en el menú (panel o ventana). Devuelve true si cambió la pestaña (para repintar). */
export async function clicAcciones(actor, ev, { claveFiltro = "aeFiltro" } = {}) {
  const t = ev.target.closest("[data-eco], [data-usar], [data-basica], [data-descanso], [data-taller]"); if (!t) return false;
  ev.preventDefault(); ev.stopPropagation();
  if (t.dataset.eco) { guardarLS(claveFiltro, t.dataset.eco); return true; }
  try {
    if (t.dataset.usar) { const [iid, aid] = t.dataset.usar.split("."); const act = actor.items.get(iid)?.system?.activities?.get?.(aid); if (act) await act.use(); return false; }
    if (t.dataset.descanso) { await (t.dataset.descanso === "largo" ? actor.longRest?.() : actor.shortRest?.()); return false; }
    if (t.dataset.taller !== undefined) { game.modules.get(MOD)?.api?.taller?.abrir?.(actor); return false; }
    if (t.dataset.basica) await usarBasica(actor, t.dataset.basica, { adicional: ev.shiftKey });
  } catch (err) { console.error(`${MOD} | acción`, err); }
  return false;
}
export const filtroGuardado = (clave = "aeFiltro") => leerLS(clave, null);
/** Una acción de cualquiera: la hace el módulo si sabe; si no, gasta la acción (en combate) y lo anuncia. */
export async function usarBasica(actor, id, { adicional = false } = {}) {
  const a = ACCIONES_BASICAS.find(x => x.id === id); if (!a) return;
  if (a.auto) { const { accionEstandar } = await import("./turno-tracker.js"); return accionEstandar(actor, a.auto, { adicional }); }
  if (a.id === "ayudar") { const { ayudar } = await import("./ventaja-estados.js"); return ayudar(actor, { gastar: true }); }
  if (a.id === "esconderse") { const { esconderse } = await import("./ventaja-estados.js"); return esconderse(actor, { gastar: true }); }
  if (a.id === "preparar") { const { preparar } = await import("./reglas-dnd.js"); return preparar(actor); }
  if (a.id === "influir") { const { influir } = await import("./reglas-dnd.js"); return influir(actor); }
  if (a.comun) { const act = comunDe(actor, a.comun); if (act) return act.use(); }
  const { combateActivo, datosTurno, turnoVacio, cambiarTurno, ACCIONES_DND } = await import("./turno-tracker.js");
  const combat = combateActivo(), c = combat?.combatants?.find?.(x => x.actor === actor || x.actorId === actor.id), clave = a.tipo === "reaction" ? "reaccion" : (adicional ? "adicional" : "accion");
  const t = c ? (datosTurno(combat, c.id) ?? turnoVacio()) : null;
  if (t?.[clave]) return ui.notifications.warn(`${actor.name} ya gastó su ${ACCIONES_DND[clave]}.`);
  if (c) await cambiarTurno(c.id, { op: "gastar", clave });
  await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), content: `<p class="ecos-accion-estandar"><b>${esc(actor.name)}</b> usa <b>${esc(a.n)}</b>${c ? ` (${ACCIONES_DND[clave]})` : ""}: ${esc(a.que)}</p>` });
}
function entradasDe(actor) {
  const out = [];
  for (const it of actor.items ?? []) {
    if (it.flags?.[MOD]?.accionComun || it.type === "spell" && !(it.system?.prepared || it.system?.preparation?.prepared || it.system?.level === 0 || it.system?.preparation?.mode === "always" || it.system?.method === "innate")) continue;
    for (const act of it.system?.activities?.values?.() ?? Object.values(it.system?.activities ?? {})) {
      const tipo = act.activation?.type;
      if (!["action", "bonus", "reaction"].includes(tipo)) continue;
      const verbe = !!it.flags?.[MOD]?.verbe;
      out.push({ id: `${it.id}.${act.id}`, nombre: (it.system.activities.size ?? Object.keys(it.system.activities).length) > 1 ? `${it.name}: ${act.name || act.type}` : it.name,
        tipo, verbe, img: it.img, texto: plano(it.system?.description?.value).slice(0, 220) });
    }
  }
  return out;
}
function comunDe(actor, nombre) {
  for (const it of actor.items ?? []) {
    if (!it.flags?.[MOD]?.accionComun) continue;
    for (const act of it.system?.activities?.values?.() ?? []) if (act.name === nombre) return act;
  }
  return null;
}
export async function abrirAccionEstandar(actor) {
  if (!actor) return;
  const { combateActivo, datosTurno, turnoVacio } = await import("./turno-tracker.js");
  const contenido = () => {
    const combat = combateActivo(), c = combat?.combatants?.find?.(x => x.actor === actor || x.actorId === actor.id);
    const t = c ? (datosTurno(combat, c.id) ?? turnoVacio(combat.round, combat.turn)) : null;
    return `<div class="ecos-accion-estandar ecos-ae"><p class="ecos-nota">En tu turno tienes <b>una Acción</b>, <b>una Acción adicional</b> (solo si algo te la da) y <b>movimiento</b>; la <b>Reacción</b> es una por ronda, también en el turno de otros. Arriba eliges qué quieres gastar; cada cosa dice si te queda. El Verbe va aparte, en su panel.</p>
      ${htmlAcciones(actor, { filtro: filtroGuardado("aeFiltroVentana"), turno: t, enCombate: !!c })}</div>`;
  };
  const dlg = new foundry.applications.api.DialogV2({ window: { title: `Acciones · ${actor.name}`, icon: "fa-solid fa-hand-fist", resizable: true },
    position: { width: 540, height: 660 }, classes: ["ecos-accion-estandar-app"], content: contenido(), buttons: [{ action: "cerrar", label: "Cerrar", default: true }] });
  await dlg.render(true);
  dlg.element?.addEventListener("click", async ev => {
    if (await clicAcciones(actor, ev, { claveFiltro: "aeFiltroVentana" })) { const caja = dlg.element.querySelector(".ecos-accion-estandar"); if (caja) caja.outerHTML = contenido(); }
  });
  return dlg;
}

/** El DM: daño de caída o indirecto a los tokens seleccionados (o marcados). */
export async function danoIndirecto() {
  if (!game.user.isGM) return;
  const tokens = canvas.tokens?.controlled?.length ? canvas.tokens.controlled : [...(game.user.targets ?? [])];
  const opts = Object.entries(DANOS_INDIRECTOS).map(([k, d]) => `<option value="${k}">${esc(d.n)}</option>`).join("");
  const r = await foundry.applications.api.DialogV2.wait({ window: { title: "Daño de caída e indirecto", icon: "fa-solid fa-person-falling-burst" }, position: { width: 460 },
    content: `<div class="ecos-dialogo"><p>Se aplica a ${tokens.length ? `<b>${tokens.map(t => esc(t.name)).join(", ")}</b>` : "<b>nadie</b>: selecciona o marca tokens antes"}.</p>
      <label>Qué <select name="tipo">${opts}</select></label><label>Altura de la caída (ft) <input type="number" name="pies" value="20" min="0" step="5"></label>
      <label>Fórmula (si es «Otro») <input name="formula" placeholder="2d6"></label><label>Tipo de daño (si es «Otro») <input name="tipoDano" value="bludgeoning"></label>
      <details><summary>¿Qué hace cada uno?</summary><ul>${Object.values(DANOS_INDIRECTOS).map(d => `<li><b>${esc(d.n)}</b>: ${esc(d.texto)}</li>`).join("")}</ul></details></div>`,
    buttons: [{ action: "ok", label: "Aplicar", icon: "fa-solid fa-check", default: true, callback: (_e, b) => Object.fromEntries(new FormData(b.form)) }, { action: "no", label: "Cancelar" }], rejectClose: false });
  if (!r || r === "no" || !tokens.length) return;
  const d = DANOS_INDIRECTOS[r.tipo] ?? DANOS_INDIRECTOS.libre;
  const formula = r.tipo === "caida" ? (dadosCaida(r.pies) ? `${dadosCaida(r.pies)}d6` : "0") : r.tipo === "libre" ? (r.formula || "0") : d.formula;
  const tipo = r.tipo === "libre" ? (r.tipoDano || "force") : d.tipo;
  const filas = [];
  for (const t of tokens) {
    const a = t.actor; if (!a) continue;
    const roll = await new Roll(formula || "0").evaluate();
    let dano = roll.total, nota = "";
    if (d.salv) {
      const s = await a.rollSavingThrow?.({ ability: d.salv, target: d.cd }, { configure: false });
      const sr = Array.isArray(s) ? s[0] : s, ok = (sr?.total ?? 0) >= d.cd;
      nota = ` · ${d.salv.toUpperCase()} ${sr?.total ?? "?"} contra CD ${d.cd}: ${ok ? "la pasa" : "falla"}`;
      if (ok) dano = Math.floor(dano / 2);
      if (!ok && d.agota) await a.update({ "system.attributes.exhaustion": Math.min(6, (Number(a.system.attributes.exhaustion) || 0) + 1) });
      if (!ok && d.estado) await a.toggleStatusEffect?.(d.estado, { active: true });
      if (ok && d.agota) dano = 0;
    }
    if (dano > 0) await a.applyDamage?.([{ value: dano, type: tipo }]);
    if (r.tipo === "caida" && dano > 0) await a.toggleStatusEffect?.("prone", { active: true });
    filas.push(`${esc(t.name)}: <b>${dano}</b> de ${esc(tipo)}${nota}${r.tipo === "caida" && dano > 0 ? " · Derribado" : ""}`);
  }
  await ChatMessage.create({ speaker: { alias: d.n }, content: `<section class="ecos-dano-indirecto"><h3>${esc(d.n)}${r.tipo === "caida" ? ` (${Number(r.pies) || 0} ft)` : ""}</h3><p>${esc(formula)}</p><p>${filas.join("<br>")}</p></section>` });
}

if (globalThis.Hooks) {
  Hooks.once("ready", () => { const api = game.modules.get(MOD)?.api; if (api) { api.accionEstandar = abrirAccionEstandar; api.danoIndirecto = danoIndirecto; } });
  // Botón en la cabecera de cada hoja de actor.
  const poner = (app, html) => {
    const actor = app?.document ?? app?.actor;
    if (!(actor instanceof Actor) || !actor.isOwner) return;
    const raiz = html instanceof HTMLElement ? html : (html?.[0] ?? app.element);
    const cab = (app.element ?? raiz)?.querySelector?.(".window-header");
    if (!cab || cab.querySelector(".ecos-ae-boton")) return;
    const b = document.createElement("button");
    b.type = "button"; b.className = "header-control ecos-ae-boton"; b.dataset.tooltip = "Acción estándar: todo lo que esta ficha puede hacer en su turno, explicado";
    b.innerHTML = `<i class="fa-solid fa-hand-fist"></i> Acción estándar`;
    b.addEventListener("click", ev => { ev.preventDefault(); ev.stopPropagation(); abrirAccionEstandar(actor); });
    const antes = cab.querySelector('[data-action="close"], .close');
    if (antes) antes.before(b); else cab.append(b);
  };
  Hooks.on("renderActorSheetV2", poner);
  Hooks.on("renderActorSheet", poner);
}
