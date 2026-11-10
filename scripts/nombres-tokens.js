/**
 * Nombres genéricos de token (3.24). Tras la migración a dnd5e 6 quedaron 93 tokens en 12 escenas y 21 prototipos
 * llamados «Non-Player Character» o «Player Character» (la etiqueta del tipo de ficha), aunque las fichas tenían su
 * nombre. Aquí está el plan puro: solo toca nombres que son exactamente esa etiqueta, y los cambia por el nombre
 * público de la ficha (sin VD ni secretos). Un nombre que el DM puso a mano no se toca nunca.
 */

/** Las etiquetas en inglés de dnd5e; las de la traducción activa se suman en Foundry. */
export const GENERICOS_EN = ["Player Character", "Non-Player Character"];

/** El conjunto de nombres genéricos: los de inglés y los que se le pasen (las etiquetas traducidas). */
export function etiquetasGenericas(localizadas = []) {
  return new Set([...GENERICOS_EN, ...localizadas].map(s => String(s ?? "").trim()).filter(Boolean));
}

export const esGenerico = (nombre, etiquetas) => etiquetas.has(String(nombre ?? "").trim());

/**
 * Qué arreglar. Puro.
 * @param {{id, protoName, publico}[]} actores  `publico`: el nombre público ya calculado
 * @param {{id, tokens: {id, actorId, name}[]}[]} escenas
 * @param {Set<string>} etiquetas
 * @returns {{prototipos: {_id, "prototypeToken.name"}[], escenas: {id, cambios: {_id, name}[]}[]}}
 */
export function planNombres(actores, escenas, etiquetas) {
  const prototipos = [];
  const destino = new Map();
  for (const a of actores) {
    const publico = String(a.publico ?? "").trim();
    const proto = String(a.protoName ?? "").trim();
    if (esGenerico(proto, etiquetas) || !proto) {
      if (publico && !esGenerico(publico, etiquetas)) {
        prototipos.push({ _id: a.id, "prototypeToken.name": publico });
        destino.set(a.id, publico);
      }
    } else destino.set(a.id, proto);
  }
  const salida = [];
  for (const s of escenas) {
    const cambios = [];
    for (const t of s.tokens ?? []) {
      if (!esGenerico(t.name, etiquetas)) continue;
      const nombre = destino.get(t.actorId);
      if (nombre) cambios.push({ _id: t.id, name: nombre });
    }
    if (cambios.length) salida.push({ id: s.id, cambios });
  }
  return { prototipos, escenas: salida };
}
