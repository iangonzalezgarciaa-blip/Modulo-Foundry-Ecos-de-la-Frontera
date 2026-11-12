/**
 * 3.61 · Ajustes del catálogo pedidos por el autor el 12-nov-2026 (idempotente; va al final de catalog:expand).
 *  - Escuchar el cuerpo (Pulso): deja de ser un toque instantáneo y pasa a ser un estado de 1 minuto (concentración):
 *    «Escuchando los cuerpos» deja ver los PG y los estados exactos de las criaturas a 30 ft (9 m); al tocar a una, además,
 *    sus heridas, venenos, enfermedades y si lleva Verbe. Es la excepción a la información oculta.
 */
import { readCatalog, writeCatalog, validateCatalog } from './catalog.mjs';
const D = readCatalog();
const t = D.tecnicas.find(x => x.id === 'pulso-escuchar');
const TEXTO = 'Durante 1 minuto (concentración) sientes el pulso de lo que te rodea: ves los PG y los estados exactos de las criaturas a 9 m (30 ft) al mirarlas. Si tocas a una (sin acción), sabes además sus heridas (Malherido, Herida No Tratada, Secuelas), sus venenos y enfermedades, y si lleva Verbe.';
let cambio = false;
if (t && t.e !== TEXTO) {
  cambio = true;
  Object.assign(t, { alc: 'yo', dur: '1 min. (conc.)', e: TEXTO, texto: TEXTO, uso: 'A · yo · 1 min. (conc.) · —', usoL: 'Acción · sobre ti · dura: 1 minuto, concentración · sin gestos ni voz' });
  const it = t.item, s = it.system;
  s.duration = { units: 'minute', value: '1', special: '' };
  s.range = { units: 'self', value: null, special: '' };
  s.target = { affects: { choice: false, count: '', type: 'self', special: '' }, template: { units: 'm' } };
  s.properties = [...new Set([...(s.properties ?? []), 'concentration'])];
  const efId = 'ecosVerSalud0361';
  it.effects = [{ _id: efId, name: 'Escuchando los cuerpos', img: 'systems/dnd5e/icons/svg/statuses/marked.svg', statuses: ['ecosVerSalud'], changes: [],
    duration: { seconds: 60, rounds: 10 }, transfer: false, disabled: false,
    description: '<p>Ves los PG y los estados exactos de las criaturas a 30 ft (al pasar el ratón sobre ellas).</p>', flags: { 'ecos-frontera': { verbe: { estado: 'ecosVerSalud' } } } }];
  for (const a of Object.values(s.activities ?? {})) a.effects = [{ _id: efId, onSave: false }];
  s.description.value = s.description.value
    .replace(/<h3>Qué hace<\/h3><p>[\s\S]*?<\/p>/, `<h3>Qué hace</h3><p>${TEXTO}</p>`)
    .replace(/<dt>Alcance<\/dt><dd>[^<]*<\/dd>/, '<dt>Alcance</dt><dd>Sobre ti (ves a 9 m / 30 ft)</dd>')
    .replace(/<dt>Duración<\/dt><dd>[^<]*<\/dd>/, '<dt>Duración</dt><dd>1 minuto (concentración)</dd>');
}
if (t) t.cambios = [...new Set([...(t.cambios ?? []), '3.61: Escuchar el cuerpo pasa a estado de 1 minuto (pedido del autor, información oculta)'])];
D.ajustes361 = { escucharCuerpo: !!t };
const errores = validateCatalog(D); if (errores.length) throw Error(errores.join('\n'));
writeCatalog(D);
console.log(`3.61: Escuchar el cuerpo ${cambio ? 'ajustada' : 'ya estaba ajustada'}.`);
