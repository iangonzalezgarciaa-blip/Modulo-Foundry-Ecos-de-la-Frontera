import test from 'node:test';
import assert from 'node:assert/strict';
import { readCatalog } from '../tools/catalog.mjs';
import { leerNombres, aplicarNombresMundo } from '../scripts/nombres-mundo.js';

test('3.12: los nombres de tu mundo cambian lo que muestra el panel, no los identificadores', () => {
  assert.deepEqual(leerNombres('Lethria=Gracefeel; Namar Sin Rostro = Cazador Sin Rostro\nmal'), [['Namar Sin Rostro', 'Cazador Sin Rostro'], ['Lethria', 'Gracefeel']]);
  const D = readCatalog();
  const n = aplicarNombresMundo(D, 'Lethria=Gracefeel');
  assert.ok(n >= 3);
  const l = D.linajes.find(x => x.id === 'gracefeel');
  assert.equal(l.nombre, 'Gracefeel'); assert.equal(l.id, 'gracefeel');
  assert.equal(D.panteon.find(d => d.id === 'gracefeel').nombre, 'Gracefeel');
  assert.ok(!JSON.stringify(D.linajes).includes('Lethria'));
  assert.equal(aplicarNombresMundo(D, ''), 0);
});
