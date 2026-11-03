import test from 'node:test';
import assert from 'node:assert/strict';
import { readCatalog } from '../tools/catalog.mjs';
import { CLONES, clonDe, limitesClones, repartoClones } from '../scripts/verbe-clones.js';
const D = readCatalog();

test('las técnicas de clones existen y los cuerpos elementales pasan al sistema de fichas propias', () => {
  for (const id of Object.keys(CLONES)) assert.ok(D.tecnicas.find(t => t.id === id), id);
  const sombra = D.tecnicas.find(t => t.id === 'forma-clon-sombra');
  assert.equal(sombra.rara, true); assert.equal(sombra.g, 5);
  assert.equal(clonDe(sombra.item.flags['ecos-frontera'].verbe).tipo, 'sombra');
  assert.equal(clonDe({ id: 'forma-replica-solida' }), null);
  assert.deepEqual(D.dotes.filter(d => d.clonDote).map(d => d.id), ['clon-economico', 'clon-multiple', 'clon-legion']);
});

test('copias y Verbe por clon: límites por dotes y por la reserva', () => {
  const c = clonDe({ id: 'forma-clon-sombra' });
  assert.deepEqual(limitesClones(c, {}), { copias: 1, minimo: 2, descuento: 0 });
  assert.deepEqual(limitesClones(c, { dotes: ['clon-economico', 'clon-multiple'] }), { copias: 2, minimo: 1, descuento: 1 });
  assert.equal(limitesClones(c, { dotes: ['clon-legion'], competencia: 4 }).copias, 16);
  assert.equal(limitesClones(clonDe({ id: 'forma-clon-tierra' }), { dotes: ['clon-legion'], competencia: 4 }).copias, 1);
  const lim = limitesClones(c, { dotes: ['clon-multiple'] });
  assert.deepEqual(repartoClones({ copias: 2, verbe: 5 }, { disponible: 10, limites: lim }), { ok: true, copias: 2, verbe: 5, total: 10 });
  assert.match(repartoClones({ copias: 2, verbe: 6 }, { disponible: 10, limites: lim }).motivo, /pide 12/);
  assert.match(repartoClones({ copias: 3, verbe: 2 }, { disponible: 10, limites: lim }).motivo, /de 1 a 2/);
  assert.match(repartoClones({ copias: 1, verbe: 1 }, { disponible: 10, limites: lim }).motivo, /al menos 2/);
});
