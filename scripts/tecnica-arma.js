/**
 * Técnicas con arma, manos libres y preparación (3.12, pedido del autor).
 *  - Una técnica que ataca «como un arma» (Cuerpo, Hilo…) pregunta «¿Con qué atacas?» y enlaza el arma elegida:
 *    el ataque usa la característica del arma (Fuerza, o Destreza si es sutil o a distancia) y su bonificador mágico.
 *    El daño sigue siendo el de la técnica, más ese bonificador. La elección se recuerda en la técnica.
 *  - Una técnica con Gestos (sellos) pide una mano libre, o dos si su texto lo dice. Si las manos están ocupadas,
 *    ofrece guardar el arma, seguir igual (lo permite el DM) o cancelar. Conjurador de guerra lo evita.
 *  - Una técnica que pide un turno de preparación se prepara primero y se usa en el turno siguiente.
 * Las reglas son puras; la parte de Foundry engancha `dnd5e.preUseActivity`, `preRollAttackV2` y `preRollDamageV2`.
 */
const MOD = "ecos-frontera";
const lista = x => Array.from(x?.contents ?? x ?? []);
const metaDe = item => item?.flags?.[MOD]?.verbe ?? item?.getFlag?.(MOD, "verbe") ?? null;
const actividades = item => { const a = item?.system?.activities; return a?.contents ?? (typeof a?.values === "function" ? [...a.values()] : Object.values(a ?? {})); };
const textoDe = item => String(item?.system?.description?.value ?? "").replace(/<[^>]+>/g, " ");
const props = item => new Set(Array.from(item?.system?.properties ?? []));

/** ¿Pide un arma? «melee», «ranged» o null. Solo técnicas del Verbe con ataque de clase «arma». */
export function pideArma(item) {
  if (!metaDe(item)?.id) return null;
  const a = actividades(item).find(x => x?.type === "attack" && x.attack?.type?.classification === "weapon");
  return a ? (a.attack.type.value === "ranged" ? "ranged" : "melee") : null;
}

/** Cuántas manos de sellos pide: 0 sin Gestos, 2 si dice «dos manos» o «ambas manos», si no 1. */
export function manosQuePide(item) {
  if (!props(item).has("somatic")) return 0;
  return /dos manos|ambas manos|las dos manos/i.test(textoDe(item)) ? 2 : 1;
}

/** ¿Pide un turno (o un asalto) de preparación antes de usarse? */
export const pidePreparacion = item => !!metaDe(item)?.id && /(asalto|turno)( entero| completo)?( inm[oó]vil)? de preparaci[oó]n|prepararla durante un (turno|asalto)|un (turno|asalto) antes/i.test(textoDe(item));

const esArma = i => i?.type === "weapon";
const esEscudo = i => i?.type === "equipment" && (i.system?.type?.value === "shield" || i.system?.armor?.type === "shield");
const dosManos = i => props(i).has("two");
/** Manos ocupadas por armas y escudo equipados (máximo 2). */
export function manosOcupadas(items) {
  let n = 0;
  for (const i of lista(items)) {
    if (!i?.system?.equipped) continue;
    if (esEscudo(i)) n += 1;
    else if (esArma(i) && !["natural"].includes(i.system?.type?.value)) n += dosManos(i) ? 2 : 1;
  }
  return Math.min(2, n);
}

/** Armas que sirven para una técnica: cuerpo a cuerpo (y el golpe sin armas) o a distancia (y las arrojadizas). */
export function armasPara(items, tipo) {
  return lista(items).filter(i => esArma(i) && (i.system?.quantity ?? 1) > 0).filter(i => {
    const rango = String(i.system?.type?.value ?? "");
    const distancia = /R$/.test(rango) || i.system?.actionType === "rwak";
    const arrojadiza = props(i).has("thr");
    return tipo === "ranged" ? (distancia || arrojadiza) : !distancia;
  }).sort((a, b) => Number(!!b.system?.equipped) - Number(!!a.system?.equipped) || String(a.name).localeCompare(String(b.name), "es"));
}

/** Característica con la que ataca un arma: Destreza a distancia, la mejor si es sutil, si no Fuerza. */
export function caracteristicaArma(arma, abilities = {}) {
  const rango = String(arma?.system?.type?.value ?? "");
  if (/R$/.test(rango)) return "dex";
  if (props(arma).has("fin")) return (Number(abilities.dex?.mod) || 0) > (Number(abilities.str?.mod) || 0) ? "dex" : "str";
  return "str";
}
const bonoMagico = arma => (arma?.system?.magicAvailable === false ? 0 : Number(arma?.system?.magicalBonus) || 0);
const tieneConjuradorGuerra = items => lista(items).some(i => /war caster|conjurador de guerra|lanzador de guerra|lanzaconjuros de guerra/i.test(i?.name ?? ""));

/**
 * Qué hay que preguntar antes de usar la técnica. Puro.
 * @returns {{ arma: "melee"|"ranged"|null, faltanManos: number, preparar: boolean }}
 */
export function revisionUso(item, items, { enlazada = null, preparada = false } = {}) {
  const arma = pideArma(item);
  const necesita = arma ? 0 : manosQuePide(item);
  const ocupadas = manosOcupadas(items);
  const faltanManos = tieneConjuradorGuerra(items) ? 0 : Math.max(0, necesita - (2 - ocupadas));
  return { arma, faltanManos, preparar: pidePreparacion(item) && !preparada, enlazada };
}

/** Ajusta una tirada de ataque o daño a un arma enlazada: característica del arma y bonificador mágico. Puro sobre `config`. */
export function aplicarArma(config, arma, abilities, { ataque = true } = {}) {
  if (!config || !arma) return config;
  const ab = caracteristicaArma(arma, abilities), magia = bonoMagico(arma);
  for (const r of config.rolls ?? []) {
    r.data ??= {}; r.parts ??= [];
    if (ataque) r.data.mod = Number(abilities?.[ab]?.mod) || 0;
    if (magia && !r.parts.includes("@ecosArmaMagia")) { r.parts.push("@ecosArmaMagia"); r.data.ecosArmaMagia = magia; }
  }
  return config;
}

/* ---------- Foundry ---------- */
const ajuste = () => { try { return game.settings.get(MOD, "tecnicaArma") !== false; } catch { return true; } };
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const armaEnlazada = item => { const id = item?.getFlag?.(MOD, "armaEnlazada"); return id ? item.actor?.items?.get(id) ?? null : null; };
const efectoPreparado = (actor, item) => lista(actor?.effects).find(e => e.getFlag?.(MOD, "preparando") === item.id);

async function elegirArma(actor, item, tipo) {
  const armas = armasPara(actor.items, tipo), previa = armaEnlazada(item);
  if (!armas.length) { ui.notifications.warn(`${actor.name} no tiene un arma ${tipo === "ranged" ? "a distancia" : "cuerpo a cuerpo"} para ${item.name}. Se usa la técnica sola.`); return { id: null }; }
  if (previa && item.getFlag(MOD, "armaSinPreguntar")) return { id: previa.id };
  const opciones = armas.map(a => `<option value="${a.id}" ${a.id === (previa?.id ?? armas[0].id) ? "selected" : ""}>${esc(a.name)}${a.system?.equipped ? "" : " (sin equipar)"}</option>`).join("");
  const r = await foundry.applications.api.DialogV2.wait({
    window: { title: `¿Con qué atacas? · ${item.name}` }, rejectClose: false,
    content: `<p>${esc(item.name)} ataca como un arma. El ataque usa la característica del arma y su bonificador mágico; el daño es el de la técnica.</p>
      <label>Arma <select name="arma">${opciones}</select></label>
      <label><input type="checkbox" name="fijar"> No volver a preguntar con esta técnica</label>`,
    buttons: [{ action: "si", label: "Atacar", default: true, callback: (ev, b) => ({ id: b.form.elements.arma.value, fijar: b.form.elements.fijar.checked }) },
      { action: "sola", label: "Sin arma (solo la técnica)", callback: () => ({ id: null }) }, { action: "no", label: "Cancelar", callback: () => null }]
  });
  if (!r) return null;
  await item.update({ [`flags.${MOD}.armaEnlazada`]: r.id ?? null, [`flags.${MOD}.armaSinPreguntar`]: !!r.fijar });
  return r;
}

async function liberarManos(actor, item, faltan) {
  const ocupadas = lista(actor.items).filter(i => i.system?.equipped && (esEscudo(i) || (esArma(i) && i.system?.type?.value !== "natural")));
  const r = await foundry.applications.api.DialogV2.wait({
    window: { title: `Manos ocupadas · ${item.name}` }, rejectClose: false,
    content: `<p>${esc(item.name)} pide sellos con ${manosQuePide(item) === 2 ? "las dos manos" : "una mano"} libre${manosQuePide(item) === 2 ? "s" : ""}. Ahora llevas: ${ocupadas.map(i => esc(i.name)).join(", ") || "nada"}.</p><p>Soltar o guardar un arma es tu interacción con un objeto del turno.</p>`,
    buttons: [{ action: "guardar", label: `Guardar ${esc(ocupadas.at(-1)?.name ?? "el arma")} y seguir`, default: true }, { action: "seguir", label: "Seguir igual (lo permite el DM)" }, { action: "no", label: "Cancelar" }]
  });
  if (r === "guardar") { for (const i of ocupadas.slice(-faltan)) await i.update({ "system.equipped": false }); return true; }
  return r === "seguir";
}

async function preparar(actor, item) {
  const r = await foundry.applications.api.DialogV2.wait({
    window: { title: `Preparación · ${item.name}` }, rejectClose: false,
    content: `<p>${esc(item.name)} pide un turno de preparación antes de usarla.</p>`,
    buttons: [{ action: "preparar", label: "Prepararla ahora (la usas en tu próximo turno)", default: true }, { action: "seguir", label: "Ya la preparé: usarla" }, { action: "no", label: "Cancelar" }]
  });
  if (r === "preparar") {
    await actor.createEmbeddedDocuments("ActiveEffect", [{ name: `Preparando: ${item.name}`, img: item.img, duration: { rounds: 2 }, transfer: false,
      description: `<p>Preparas ${esc(item.name)}. Úsala antes del final de tu próximo turno.</p>`, flags: { [MOD]: { preparando: item.id } } }]);
    await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), content: `<p><b>${esc(actor.name)}</b> prepara <b>${esc(item.name)}</b>: la podrá usar en su próximo turno.</p>` });
    return false;
  }
  return r === "seguir";
}

/** Revisa y, si hace falta, pregunta; luego vuelve a usar la actividad con todo resuelto. */
async function revisarYUsar(activity, usage, dialog, message) {
  const actor = activity.actor, item = actor?.items?.get(activity.item.id), original = item?.system?.activities?.get(activity.id);
  if (!original) return;
  const prep = efectoPreparado(actor, item);
  const r = revisionUso(item, actor.items, { preparada: !!prep });
  if (r.preparar && !(await preparar(actor, item))) return;
  if (prep) await prep.delete();
  if (r.arma && !(await elegirArma(actor, item, r.arma))) return;
  if (r.faltanManos && !(await liberarManos(actor, item, r.faltanManos))) return;
  return original.use({ ...usage, ecosRevisado: true }, dialog, message);
}

if (globalThis.Hooks) {
  Hooks.once("init", () => {
    try {
      game.settings.register(MOD, "tecnicaArma", { name: "Técnicas: arma, manos libres y preparación", hint: "Antes de usar una técnica pregunta con qué arma ataca (si ataca como un arma), avisa si sus sellos piden manos libres y pide el turno de preparación cuando la técnica lo dice.",
        scope: "world", config: true, type: Boolean, default: true });
    } catch { /* ya */ }
  });
  Hooks.on("dnd5e.preUseActivity", (activity, usage, dialog, message) => {
    if (!ajuste() || usage?.ecosRevisado || !metaDe(activity?.item)?.id || !activity.actor?.isOwner) return;
    const item = activity.actor.items.get(activity.item.id);
    const r = revisionUso(item, activity.actor.items, { preparada: !!efectoPreparado(activity.actor, item) });
    if (!r.arma && !r.faltanManos && !r.preparar) return;
    revisarYUsar(activity, usage, dialog, message).catch(err => console.error(`${MOD} | técnica con arma`, err));
    return false;
  });
  const conArma = config => {
    const act = config?.subject, arma = act?.item ? armaEnlazada(act.actor?.items?.get(act.item.id) ?? act.item) : null;
    return arma && pideArma(act.item) ? { arma, abilities: act.actor?.system?.abilities ?? {} } : null;
  };
  Hooks.on("dnd5e.preRollAttackV2", config => { const x = conArma(config); if (x && ajuste()) aplicarArma(config, x.arma, x.abilities, { ataque: true }); });
  Hooks.on("dnd5e.preRollDamageV2", config => { const x = conArma(config); if (x && ajuste()) aplicarArma(config, x.arma, x.abilities, { ataque: false }); });
}
