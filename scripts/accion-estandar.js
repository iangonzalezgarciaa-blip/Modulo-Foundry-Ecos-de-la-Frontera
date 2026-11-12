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
  { id: "influir", n: "Influir", tipo: "action", que: "Convencer, engañar o intimidar a alguien (Persuasión, Engaño, Intimidación, Interpretación o Trato con animales)." },
  { id: "objeto", n: "Usar un objeto", tipo: "action", que: "Beber una poción, abrir una puerta trabada, usar una herramienta. Sacar o guardar un arma es gratis una vez por turno." },
  { id: "preparar", n: "Preparar", tipo: "action", que: "Eliges una acción y qué la dispara («si se acerca, le pego»): cuando pasa, la haces con tu reacción." },
  { id: "oportunidad", n: "Ataque de oportunidad", tipo: "reaction", que: "Cuando un enemigo que ves sale de tu alcance, le haces un ataque cuerpo a cuerpo con tu reacción." }
];

/** Agrupa lo que tiene la hoja por tipo de acción. Puro: recibe [{id, nombre, tipo, actividad, texto}]. */
export function agruparPorTiempo(entradas) {
  const g = { action: [], bonus: [], reaction: [], otra: [] };
  for (const e of entradas ?? []) (g[e.tipo] ?? g.otra).push(e);
  for (const k of Object.keys(g)) g[k].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  return g;
}
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
  const g = agruparPorTiempo(entradasDe(actor).filter(e => !e.verbe));
  const fila = e => `<li><button type="button" data-ae-usar="${esc(e.id)}" data-tooltip="${esc(e.texto || e.nombre)}"><img src="${esc(e.img)}" alt=""> ${esc(e.nombre)}</button></li>`;
  const basica = a => `<li><button type="button" data-ae-basica="${a.id}" data-tooltip="${esc(a.que)}"><b>${esc(a.n)}</b></button> <small>${esc(a.que)}</small></li>`;
  const sec = (t, ayuda, lista) => `<details open class="ae-sec"><summary>${t}</summary><p class="ecos-nota">${ayuda}</p><ul class="ae-lista">${lista || "<li><i>No tiene.</i></li>"}</ul></details>`;
  const content = `<div class="ecos-accion-estandar">
    <p class="ecos-nota">En tu turno tienes <b>una Acción</b>, <b>una Acción adicional</b> (solo si algo te la da) y <b>movimiento</b>. La <b>Reacción</b> es una por ronda, incluso en el turno de otros. El Verbe va aparte: su menú tiene sus propias acciones.</p>
    ${sec("Acciones de cualquiera", "Lo que cualquier personaje puede hacer, sea de la clase que sea. Pasa el ratón para ver qué hace.", ACCIONES_BASICAS.filter(a => a.tipo === "action").map(basica).join(""))}
    ${sec("Tu Acción", "Lo que tu hoja deja hacer con tu Acción: armas, conjuros preparados, rasgos de clase. Se actualiza solo al subir de nivel o al cambiar la hoja.", g.action.map(fila).join(""))}
    ${sec("Tu Acción adicional", "Solo lo que algo te da: un rasgo de clase, un conjuro o la segunda arma.", g.bonus.map(fila).join(""))}
    ${sec("Tu Reacción", "Una por ronda, cuando pasa lo que dice.", [basica(ACCIONES_BASICAS.find(a => a.id === "oportunidad")), ...g.reaction.map(fila)].join(""))}
  </div>`;
  const dlg = new foundry.applications.api.DialogV2({ window: { title: `Acción estándar · ${actor.name}`, icon: "fa-solid fa-hand-fist", resizable: true },
    position: { width: 520, height: 640 }, classes: ["ecos-accion-estandar-app"], content, buttons: [{ action: "cerrar", label: "Cerrar", default: true }] });
  await dlg.render(true);
  dlg.element?.addEventListener("click", async ev => {
    const b = ev.target.closest("button[data-ae-usar], button[data-ae-basica]");
    if (!b) return;
    ev.preventDefault(); ev.stopPropagation();
    try {
      if (b.dataset.aeUsar) {
        const [iid, aid] = b.dataset.aeUsar.split(".");
        const act = actor.items.get(iid)?.system?.activities?.get?.(aid);
        if (act) await act.use();
        return;
      }
      const a = ACCIONES_BASICAS.find(x => x.id === b.dataset.aeBasica);
      if (a?.auto) { const { accionEstandar } = await import("./turno-tracker.js"); await accionEstandar(actor, a.auto); return; }
      if (a?.id === "esconderse") { const { esconderse } = await import("./ventaja-estados.js"); await esconderse(actor, { gastar: true }); return; }
      if (a?.comun) { const act = comunDe(actor, a.comun); if (act) return act.use(); }
      if (a?.arma) { const arma = actor.items.find(i => i.type === "weapon" && (i.system?.equipped ?? true)); if (arma) return arma.system.activities?.contents?.[0]?.use?.(); }
      await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), content: `<p class="ecos-accion-estandar"><b>${esc(actor.name)}</b> usa <b>${esc(a.n)}</b>: ${esc(a.que)}</p>` });
    } catch (err) { console.error(`${MOD} | acción estándar`, err); }
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
