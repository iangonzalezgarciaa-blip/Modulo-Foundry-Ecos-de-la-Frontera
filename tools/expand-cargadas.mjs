/** Técnicas cargadas nuevas (3.4c). Idempotente. */
import { readCatalog, writeCatalog, validateCatalog } from './catalog.mjs';
import { construirShinobi } from './build-shinobi.mjs';
import { NIVEL_GRADO, etapaGrado } from '../scripts/verbe-progression.js';
import { cargadas } from './nimerios/cargadas.mjs';
const D = readCatalog();
for (const s of cargadas) {
  const t = construirShinobi({ ...s, t: 'A', gestos: true, origen: 'Técnicas cargadas de Nimerios', fuente: 'Creación original de la campaña.',
    limite: 'Técnica cargada: se canaliza desde el panel antes de soltarla; mientras, velocidad 0 y sin reacciones ni choques.',
    manual: 'Canalizar y liberar desde el panel del Verbe; al liberar, la tirada nativa lleva los dados de carga.' }, D);
  const m = t.item.flags['ecos-frontera'].verbe;
  delete m.shinobi; m.cargada = s.cargada; t.cargadaNueva = true;
  if (s.req) { t.req = s.req; m.req = s.req; }
  t.alias = [s.nombre]; t.origen = { obra: 'Nimerios', nombre: 'Técnicas cargadas', referencia: 'Creación original.' };
  t.item.system.source = { custom: 'Ecos · Técnicas cargadas', book: 'Nimerios' };
  t.nivelMin = NIVEL_GRADO[s.g]; t.obtencion = { nivel: t.nivelMin, etapa: etapaGrado(s.g), rama: s.rama }; m.obtencion = t.obtencion;
  if (s.area && !s.alcance) { t.item.system.target.affects = { ...t.item.system.target.affects, type: '', special: '-self' }; t.item.system.range = { units: 'self' }; }
  const i = D.tecnicas.findIndex(x => x.id === t.id);
  if (i < 0) D.tecnicas.push(t); else D.tecnicas[i] = t;
}
D.cargadas = { version: 1, nuevas: D.tecnicas.filter(x => x.cargadaNueva).length };
const errores = validateCatalog(D); if (errores.length) throw Error(errores.join('\n'));
writeCatalog(D);
console.log(`Técnicas cargadas nuevas: ${D.cargadas.nuevas}; total ${D.tecnicas.length}.`);
