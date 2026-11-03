/** Plantillas en la escena (tarea 1.2): el catálogo mide en metros; si la escena mide en pies, la plantilla se convierte (1,5 m = 5 pies). */
const PIES = new Set(['ft', 'feet', 'foot', 'pies', 'pie']), METROS = new Set(['m', 'metros', 'metro', 'meters', 'meter']);
const redondear = v => Math.round(v * 100) / 100;
export function convertirMedida(valor, de, a) {
  const v = Number(valor);
  if (valor === '' || valor === null || valor === undefined || !Number.isFinite(v)) return valor;
  const d = String(de ?? '').toLowerCase(), b = String(a ?? '').toLowerCase();
  if (METROS.has(d) && PIES.has(b)) return redondear(v / 0.3);
  if (PIES.has(d) && METROS.has(b)) return redondear(v * 0.3);
  return v;
}
/** Ajusta los datos de la plantilla (los de dnd5e.preCreateActivityTemplate) a las unidades de la escena. Devuelve si cambió algo. */
export function plantillaEnEscena(data, unidades, unidadesEscena) {
  if (!data || !unidades || !unidadesEscena) return false;
  const antes = data.distance;
  data.distance = convertirMedida(data.distance, unidades, unidadesEscena);
  if (data.distance === antes) return false;
  if (data.width !== undefined) data.width = convertirMedida(data.width, unidades, unidadesEscena);
  const dim = data.flags?.dnd5e?.dimensions;
  if (dim) for (const k of ['size', 'width', 'height']) if (dim[k] !== undefined) dim[k] = convertirMedida(dim[k], unidades, unidadesEscena);
  return true;
}
