/**
 * Clones del Verbe (tarea 3.5, decisiones D2 y 3 del autor). Reglas puras.
 *
 * Al usar una técnica de clones, quien la usa elige (si quiere) cuántas copias crea y cuánto Verbe le da a cada una.
 * Cada copia es una ficha nueva «Clon de <nombre>» en el campo, con 1 PG (o los PG que diga su técnica) y el Verbe
 * transferido; puede usar sus técnicas. Si la destruyen, ese Verbe se pierde. Si su creador la disipa a voluntad,
 * le vuelve el Verbe que le quede. Al desaparecer, deja una tarjeta de recuerdos (lo que vio, oyó, sintió y aprendió),
 * que el DM redacta o aprueba. Nunca da experiencia.
 * Los clones sólidos se pueden infundir con una naturaleza; el de sombras es Verbe puro y es raro.
 * «Réplica sólida» y «Doble perfecto» siguen siendo réplicas (saldo dividido y una acción compartida, con sus dotes);
 * los cuerpos elementales duplicados y los de sombra son clones con ficha propia.
 */
export const CLONES = {
  "forma-clon-sombra": { copias: 1, pg: 1, tipo: "sombra" },
  "forma-clones-masivos": { copias: 5, pg: 1, tipo: "sombra" },
  "forma-clon-agua": { copias: 1, pg: 1, tipo: "solido", nat: "agua" },
  "forma-clon-rayo": { copias: 1, pg: 1, tipo: "solido", nat: "rayo" },
  "forma-clon-tierra": { copias: 1, pg: 10, ca: 13, tipo: "solido", nat: "tierra" },
  "forma-clon-arena": { copias: 1, pg: 10, ca: 13, tipo: "solido" },
  "forma-clon-madera": { copias: 1, pg: 15, ca: 14, tipo: "solido", nat: "madera" }
};
/** Dotes que abaratan los clones (3.5d), en cadena. */
export const DOTES_CLON = ["clon-economico", "clon-multiple", "clon-legion"];
export const clonDe = meta => CLONES[meta?.id] ?? (meta?.clon ? { copias: 1, pg: 1, tipo: "solido", ...meta.clon } : null);

/** Cuántas copias puede crear como mucho y el Verbe mínimo por copia, según sus dotes y su competencia. */
export function limitesClones(c, { dotes = [], competencia = 2 } = {}) {
  if (!c) return null;
  const d = new Set(dotes);
  let copias = c.copias;
  if (d.has("clon-multiple")) copias += 1;
  if (d.has("clon-legion") && c.tipo === "sombra") copias = Math.max(copias, competencia * 4);
  return { copias: Math.max(1, copias), minimo: d.has("clon-economico") ? 1 : 2, descuento: d.has("clon-economico") ? 1 : 0 };
}
/** Valida el reparto pedido. */
export function repartoClones({ copias, verbe }, { disponible, limites }) {
  const n = Math.trunc(Number(copias)), v = Math.trunc(Number(verbe));
  if (!limites) return { ok: false, motivo: "No es una técnica de clones." };
  if (!Number.isFinite(n) || n < 1 || n > limites.copias) return { ok: false, motivo: `Puedes crear de 1 a ${limites.copias} copia${limites.copias === 1 ? "" : "s"}.` };
  if (!Number.isFinite(v) || v < limites.minimo) return { ok: false, motivo: `Cada clon necesita al menos ${limites.minimo} de Verbe.` };
  if (n * v > disponible) return { ok: false, motivo: `Repartir ${n} × ${v} pide ${n * v} de Verbe y tienes ${disponible}.` };
  return { ok: true, copias: n, verbe: v, total: n * v };
}
