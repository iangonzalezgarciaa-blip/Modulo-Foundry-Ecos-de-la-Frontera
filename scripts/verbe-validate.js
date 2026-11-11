/**
 * Validador de técnicas (tarea 1.1). Busca configuraciones que romperían la mesa: áreas sin plantilla, plantillas que apuntan
 * al lanzador, daño que recae en quien la usa y fichas sin acción, alcance o duración. Es puro: sirve en Node y en Foundry.
 */
export const TIPOS_PLANTILLA = new Set(['cone', 'sphere', 'cube', 'line', 'cylinder', 'square', 'radius', 'wall', 'circle', 'rect', 'ray']);
/** Palabra del texto → tipo de plantilla de dnd5e. */
export const FORMA_AREA = { cono: 'cone', 'línea': 'line', linea: 'line', franja: 'line', esfera: 'sphere', semiesfera: 'sphere', cubo: 'cube', cilindro: 'cylinder', cuadrado: 'square', muro: 'wall', aura: 'radius' };
const AREA_EN_TEXTO = /\b(?:un|una|en un|en una|de un|de una)\s+(cono|línea|linea|franja|esfera|semiesfera|cubo|cilindro|cuadrado|muro)\s+de\s+(\d+(?:[,.]\d+)?)\s*(?:m|ft)\b/i;
const MEDIDA_AREA = /^(cono|línea|linea|franja|esfera|semiesfera|cubo|cilindro|cuadrado|muro|aura)\s+(\d+(?:[,.]\d+)?)/i;
export const CODIGOS = {
  'area-sin-plantilla': 'El texto describe un área, pero la ficha no tiene plantilla: no se puede colocar en la escena.',
  'plantilla-tipo': 'La plantilla tiene un tipo que dnd5e no conoce.',
  'plantilla-tamano': 'La plantilla no tiene tamaño.',
  'area-sobre-ti': 'La plantilla apunta al lanzador: con midi-qol el daño o la salvación recaen en quien la usa.',
  'dano-a-ti': 'El daño o la salvación tienen como objetivo al propio lanzador.',
  'area-te-alcanza': 'El área sale de quien la usa y puede alcanzarlo: falta excluir al lanzador (-self).',
  'sin-actividad': 'No tiene actividad: no se puede usar desde la hoja.',
  'sin-accion': 'No dice qué acción cuesta.',
  'sin-alcance': 'No tiene alcance.',
  'sin-duracion': 'No tiene duración.'
};
/** Lee «cono 4,5 m» (o el área que describe el texto) → { type, size } o null. */
export function areaDeTexto(t) {
  const m = String(t?.area ?? '').match(MEDIDA_AREA) ?? String(t?.texto ?? t?.e ?? '').match(AREA_EN_TEXTO);
  if (!m) return null;
  return { type: FORMA_AREA[m[1].toLowerCase()], size: Number(m[2].replace(',', '.')) };
}
const exclusiones = aff => String(aff?.special ?? '').split(';').map(x => x.trim());
/** Problemas de una técnica: [{ id, nombre, nivel: 'error'|'aviso', codigo, texto }]. */
export function problemasTecnica(t) {
  const out = [], item = t?.item ?? {}, s = item.system ?? {}, tpl = s.target?.template ?? {}, aff = s.target?.affects ?? {};
  const meta = item.flags?.['ecos-frontera']?.verbe ?? {};
  const acts = Object.values(s.activities ?? {});
  const dana = acts.some(a => a.type !== 'heal' && a.damage?.parts?.length);
  const salva = acts.some(a => a.type === 'save');
  const add = (nivel, codigo) => out.push({ id: t.id, nombre: t.n ?? item.name, nivel, codigo, texto: CODIGOS[codigo] });
  if (!acts.length) add('error', 'sin-actividad');
  if (!tpl.type && areaDeTexto(t)) add('error', 'area-sin-plantilla');
  if (tpl.type && !TIPOS_PLANTILLA.has(tpl.type)) add('error', 'plantilla-tipo');
  if (tpl.type && !(Number(tpl.size) > 0)) add('error', 'plantilla-tamano');
  if (tpl.type && aff.type === 'self' && (dana || salva) && !meta.autodano) add('error', 'area-sobre-ti');
  else if (aff.type === 'self' && (dana || salva) && !meta.autodano) add('aviso', 'dano-a-ti');
  if (tpl.type && s.range?.units === 'self' && aff.type !== 'self' && (dana || salva) && !meta.autodano && !exclusiones(aff).includes('-self')) add('aviso', 'area-te-alcanza');
  if (!s.activation?.type) add('aviso', 'sin-accion');
  if (!s.range?.units) add('aviso', 'sin-alcance');
  if (!s.duration?.units) add('aviso', 'sin-duracion');
  return out;
}
/** Informe sobre una lista de técnicas. */
export function validarTecnicas(lista) {
  const problemas = (lista ?? []).flatMap(problemasTecnica);
  return { total: (lista ?? []).length, errores: problemas.filter(p => p.nivel === 'error').length, avisos: problemas.filter(p => p.nivel === 'aviso').length, problemas };
}
