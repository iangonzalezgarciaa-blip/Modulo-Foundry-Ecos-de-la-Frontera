/** Formas no elementales (4.3): 20 técnicas originales de Forma sin elemento, grados 0 a 5. Idempotente. */
import { readCatalog, writeCatalog, validateCatalog } from './catalog.mjs';
import { construirShinobi } from './build-shinobi.mjs';
import { NIVEL_GRADO, etapaGrado } from '../scripts/verbe-progression.js';
import { formaPura } from './nimerios/forma-pura.mjs';
const D = readCatalog();
for (const s of formaPura) {
  const t = construirShinobi({ rama: 'forma', t: 'A', gestos: true, ...s, origen: 'Formas puras de Nimerios', fuente: 'Creación original de la campaña.' }, D);
  const m = t.item.flags['ecos-frontera'].verbe;
  delete m.shinobi; t.formaPura = true;
  t.alias = [s.nombre]; t.origen = { obra: 'Nimerios', nombre: 'Formas puras', referencia: 'Creación original.' };
  t.item.system.source = { custom: 'Ecos · Formas puras', book: 'Nimerios' };
  t.nivelMin = NIVEL_GRADO[s.g]; t.obtencion = { nivel: t.nivelMin, etapa: etapaGrado(s.g), rama: 'forma' }; m.obtencion = t.obtencion;
  if (s.area && !s.alcance) { t.item.system.target.affects = { ...t.item.system.target.affects, type: '', special: '-self' }; t.item.system.range = { units: 'self' }; }
  const i = D.tecnicas.findIndex(x => x.id === t.id);
  if (i < 0) D.tecnicas.push(t); else D.tecnicas[i] = t;
}
D.formaPura = { version: 1, nuevas: D.tecnicas.filter(x => x.formaPura).length };
const errores = validateCatalog(D); if (errores.length) throw Error(errores.join('\n'));
writeCatalog(D);
console.log(`Formas puras: ${D.formaPura.nuevas}; total ${D.tecnicas.length}.`);
