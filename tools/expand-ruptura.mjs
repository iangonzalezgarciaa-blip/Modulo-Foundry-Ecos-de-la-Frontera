/** 3.28 · Técnicas y dotes de ruptura. Idempotente. */
import { readCatalog, writeCatalog, validateCatalog } from './catalog.mjs';
import { construirShinobi } from './build-shinobi.mjs';
import { NIVEL_GRADO, etapaGrado } from '../scripts/verbe-progression.js';
import { tecnicasRuptura, dotesRuptura } from './nimerios/ruptura.mjs';
const D = readCatalog();
for (const s of tecnicasRuptura) {
  const t = construirShinobi({ ...s, origen: 'Técnicas de ruptura de Nimerios', fuente: 'Creación original de la campaña.' }, D);
  const m = t.item.flags['ecos-frontera'].verbe;
  delete m.shinobi; m.ruptura = s.estados.filter(e => e.startsWith('ecos')); t.ruptura = m.ruptura;
  if (s.req) { t.req = s.req; m.req = s.req; }
  t.alias = [s.nombre]; t.origen = { obra: 'Nimerios', nombre: 'Técnicas de ruptura', referencia: 'Creación original.' };
  t.item.system.source = { custom: 'Ecos · Técnicas de ruptura', book: 'Nimerios' };
  t.item.system.description.value = t.item.system.description.value.replace(/Estudio Naruto y Shippuden|Repertorio shinobi/g, 'Nimerios');
  t.nivelMin = NIVEL_GRADO[s.g]; t.obtencion = { nivel: t.nivelMin, etapa: etapaGrado(s.g), rama: s.rama }; m.obtencion = t.obtencion;
  const i = D.tecnicas.findIndex(x => x.id === t.id);
  if (i < 0) D.tecnicas.push(t); else D.tecnicas[i] = t;
}
// Lo que ya no está en la lista (un nombre cambiado) se va.
D.dotes = D.dotes.filter(d => d.cat !== 'ruptura' || dotesRuptura.some(x => x.id === d.id));
D.tecnicas = D.tecnicas.filter(t => !t.ruptura || tecnicasRuptura.some(x => x.id === t.id));
D.categoriasDote ??= [];
const CAT = { id: 'ruptura', nombre: 'Ablandar y sinergias', texto: 'Brecha, Grieta, Quebrado y sinergias de elementos' };
D.categoriasDote = D.categoriasDote.filter(c => c.id !== 'ruptura');
D.categoriasDote.splice(D.categoriasDote.findIndex(c => c.id === 'combate') + 1, 0, CAT);
for (const d of dotesRuptura) {
  const i = D.dotes.findIndex(x => x.id === d.id);
  if (i < 0) D.dotes.push(d); else D.dotes[i] = d;
}
D.ruptura = { version: 1, tecnicas: tecnicasRuptura.length, dotes: dotesRuptura.length };
const errores = validateCatalog(D); if (errores.length) throw Error(errores.join('\n'));
writeCatalog(D);
console.log(`Ruptura: ${tecnicasRuptura.length} técnicas y ${dotesRuptura.length} dotes; total ${D.tecnicas.length} técnicas y ${D.dotes.length} dotes.`);
