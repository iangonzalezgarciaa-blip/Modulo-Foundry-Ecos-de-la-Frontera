/** Técnica «Cambiar naturaleza del Verbe» (decisión 7 del autor, tarea 2.1): 3 Trazos, 7 días, Control CD 15. Idempotente. */
import { readCatalog, writeCatalog, validateCatalog } from './catalog.mjs';
import { construirShinobi } from './build-shinobi.mjs';
const D = readCatalog();
const t = construirShinobi({
  id: 'forma-cambiar-naturaleza', nombre: 'Cambiar naturaleza del Verbe', rama: 'forma', g: 2, t: '1 h', tipo: 'ritual', alcance: 0, duracion: 0, conc: false, gestos: true,
  texto: 'Con siete días de entrenamiento guiado cambias una de tus naturalezas por otra que no tengas. Se pide desde el panel (Mejorar → Tus elementos): el DM aprueba, pasan 7 días del calendario del mundo y haces una prueba de Control del Verbe CD 15. Si la superas, la naturaleza cambia; si fallas, puedes volver a entrenar.',
  limite: 'No da una naturaleza de más: cambia una por otra. Las técnicas de la naturaleza anterior siguen en tu ficha, pero no se pueden aprender más de ella; el DM decide si las cambias por otras. Las combinaciones que dependían de esa naturaleza se revisan con el DM.',
  manual: 'Se resuelve desde el panel del Verbe con aprobación del DM; la tarjeta no cambia nada por sí sola.',
  origen: 'Entrenamiento de Nimerios', fuente: 'Creación original de la campaña.'
}, D);
const m = t.item.flags['ecos-frontera'].verbe;
delete m.shinobi;
m.cambiarNaturaleza = true;
t.trazos = 3; t.nivelMin = 5; t.obtencion = { nivel: 5, etapa: 0, rama: 'forma' }; m.obtencion = t.obtencion;
t.alias = [t.n]; t.entrenamiento = true; m.entrenamiento = true; t.origen = { obra: 'Nimerios', nombre: 'Entrenamiento', referencia: 'Creación original.' };
t.item.system.source = { custom: 'Ecos · Entrenamiento del Verbe', book: 'Nimerios' };
const i = D.tecnicas.findIndex(x => x.id === t.id);
if (i < 0) D.tecnicas.push(t); else D.tecnicas[i] = t;
D.entrenamiento = { version: 1, nuevas: D.tecnicas.filter(x => x.entrenamiento).length };
const errores = validateCatalog(D); if (errores.length) throw Error(errores.join('\n'));
writeCatalog(D);
console.log(`Cambiar naturaleza del Verbe: lista (total ${D.tecnicas.length}).`);
