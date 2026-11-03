/**
 * Lectura del Verbe por tramos (tarea 2.3c, decisión D3): las técnicas y dotes de lectura dicen «lleno, a medias, poco»
 * o «más débil, parejo, más fuerte», nunca cifras exactas de reserva, PG o CA. Reglas puras.
 */
export function tramoReserva(valor, max) {
  const v = Number(valor) || 0, m = Math.max(1, Number(max) || 1);
  if (v < 0) return "en deuda: gastó más de lo que tenía";
  const p = v / m;
  return p >= 0.75 ? "llena o casi llena" : p >= 0.35 ? "a medias" : p > 0 ? "baja" : "vacía";
}
export function tramoFuerza(gradoLector, gradoOtro) {
  const d = (Number(gradoOtro) || 0) - (Number(gradoLector) || 0);
  return d <= -3 ? "mucho más débil que tú" : d < 0 ? "más débil que tú" : d === 0 ? "parejo contigo" : d <= 2 ? "más fuerte que tú" : "mucho más fuerte que tú";
}
export function tramoVida(valor, max) {
  const m = Math.max(1, Number(max) || 1), p = (Number(valor) || 0) / m;
  return p >= 1 ? "ileso" : p > 0.5 ? "herido" : p > 0.25 ? "malherido" : p > 0 ? "a punto de caer" : "caído";
}
/** Técnicas que dejan leer a otros, de menos a más. Cada una dice qué tramos ve. */
export const LECTORES = [
  { id: "rastro-cerca", ve: ["usa"] },
  { id: "rastro-lejos", ve: ["usa", "fuerza"] },
  { id: "rastro-ver-todo", ve: ["usa", "fuerza", "reserva", "naturaleza", "vida"] },
  { id: "rastro-hilo-vida", ve: ["usa", "fuerza", "vida"] }
];
export function queVe(conocidas = []) {
  const s = new Set(conocidas);
  return new Set(LECTORES.filter(l => s.has(l.id)).flatMap(l => l.ve));
}
