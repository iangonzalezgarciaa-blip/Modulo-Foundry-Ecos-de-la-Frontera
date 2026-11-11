/** Presupuestos de descanso. No dependen de Foundry ni del estado del navegador. */
const natural = n => Math.max(0, Math.floor(Number(n) || 0));
export function recuperacionDGLarga(nivel, modo = "mitad") {
  const n = Math.max(1, natural(nivel));
  return ({ cuarto: Math.ceil(n / 4), mitad: Math.ceil(n / 2), todos: n })[modo] ?? Math.ceil(n / 2);
}
/** Todos los cortos juntos reponen como máximo la mitad de un largo. */
export function presupuestoCorto(recuperacionLarga, usado = 0, solicitado = Infinity, fraccion = 0.5) {
  const largo = natural(recuperacionLarga);
  const limite = Math.max(0, Math.min(largo - 1, Math.floor(largo * fraccion)));
  const gastado = natural(usado);
  const restante = Math.max(0, limite - gastado);
  const cantidad = Math.min(restante, solicitado === Infinity ? restante : natural(solicitado));
  return { limite, restante, cantidad, usado: gastado + cantidad };
}

/** Ajusta el resultado nativo antes de que dnd5e lo guarde. No escribe documentos. */
export function ajustarRecuperacionDG(actor, result, { largo = false, limiteRec = 0, maxHitDice, mod = "ecos-frontera" } = {}) {
    const ud = (result.updateData ??= {});
    result.updateItems ??= [];
    result.deltas ??= { hitPoints: 0, hitDice: 0 };
    // 1 · Los PG no vuelven solos (lo curado con Dados de Golpe en un Descanso Corto ya está en la hoja).
    if ("system.attributes.hp.value" in ud) delete ud["system.attributes.hp.value"];
    // 3.32: dnd5e 5–6 puede traerlos anidados; tampoco vuelven por ahí.
    if (ud.system?.attributes?.hp && "value" in ud.system.attributes.hp) delete ud.system.attributes.hp.value;
    if (largo) result.deltas.hitPoints = 0;
    // 2 · Fuera la recuperación de Dados de Golpe del sistema; dentro la de la casa.
    const clases = new Set(Array.from(actor.system.attributes?.hd?.classes ?? []).map(c => c.id));
    for (const u of result.updateItems) if (clases.has(u._id)) delete u["system.hd.spent"];
    result.updateItems = result.updateItems.filter(u => Object.keys(u).some(k => k !== "_id"));
    delete ud["system.attributes.hd.spent"];
    const base = largo ? 0 : (Number(result.dhd) || 0);
    const n = largo && Number.isInteger(maxHitDice) ? Math.max(0, Math.min(maxHitDice, limiteRec)) : limiteRec;
    let recuperados = 0;
    if (n > 0) {
      const hd = actor.system.attributes?.hd;
      if (actor.type === "npc") {
        recuperados = Math.min(n, Number(hd?.spent) || 0);
        if (recuperados) ud["system.attributes.hd.spent"] = hd.spent - recuperados;
      } else if (typeof hd?.createHitDiceUpdates === "function") {
        const tmp = { deltas: { hitDice: 0 }, updateItems: [] };
        hd.createHitDiceUpdates({ maxHitDice: n }, tmp);
        recuperados = tmp.deltas.hitDice;
        for (const u of tmp.updateItems) {
          const ya = result.updateItems.find(x => x._id === u._id);
          if (ya) Object.assign(ya, u);
          else result.updateItems.push(u);
        }
      }
    }
    result.deltas.hitDice = base + recuperados;
    result.dhd = result.deltas.hitDice;
    result.dhp = result.deltas.hitPoints;
    // 3 · Empieza la cuenta del tope para lo que venga.
    ud[`flags.${mod}.dgUso`] = 0;
    ud[`flags.${mod}.dgRecCortos`] = largo ? 0 : (Number(actor.getFlag(mod, "dgRecCortos")) || 0) + Math.max(0, recuperados);
    result.ecosDG = { recuperados };
  return result;
}

/** 3.35 · El tope de Dados de Golpe por descanso según dónde se descansa: el Santuario es el techo; a la intemperie un
 * Descanso Largo deja gastar la mitad (mínimo 1) y un Corto, como mucho 1. Puro. */
export function topeDGLugar(base, { santuario = true, tipo = "long" } = {}) {
  if (!Number.isFinite(base)) return base;
  if (santuario) return base;
  return tipo === "short" ? Math.min(1, base) : Math.max(1, Math.floor(base / 2));
}
