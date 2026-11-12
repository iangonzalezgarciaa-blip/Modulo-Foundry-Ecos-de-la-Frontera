/**
 * 3.62 · Ajustes del catálogo pedidos por el autor el 12-nov-2026 (idempotente; va al final de catalog:expand).
 *  - Dote nueva «Tacto del archivero» (Rastro): ayuda a identificar reliquias (ventaja y 10 minutos en vez de 1 hora).
 *    La usa el botón «Estudiar» de las reliquias sin identificar.
 */
import { readCatalog, writeCatalog, validateCatalog } from './catalog.mjs';
const D = readCatalog();
const DOTE = {
  id: 'tacto-archivero', nombre: 'Tacto del archivero',
  texto: 'Tu Verbe roza lo que tocas y oye su eco. Al estudiar un objeto sin identificar (una reliquia, por ejemplo) tiras con ventaja y te basta con 10 minutos en vez de una hora. Si tocas un objeto mágico o con Verbe, sabes que lo es (sin acción).',
  trazos: 1, req: 'rama Rastro', cat: 'ramas', mejora: [],
  requisitos: { nivel: 1, ramas: { rastro: 1 }, dotes: [], tecnicas: [], dm: false },
  automatizacion: 'Automática: el botón «Estudiar» de las reliquias sin identificar la tiene en cuenta (ventaja y 10 minutos).'
};
const i = D.dotes.findIndex(d => d.id === DOTE.id);
const nuevo = i < 0;
if (nuevo) D.dotes.push(DOTE); else D.dotes[i] = { ...D.dotes[i], ...DOTE };
D.ajustes362 = { tactoArchivero: true, dotes: 1 };
const errores = validateCatalog(D); if (errores.length) throw Error(errores.join('\n'));
writeCatalog(D);
console.log(`3.62: Tacto del archivero ${nuevo ? 'añadida' : 'al día'}.`);
