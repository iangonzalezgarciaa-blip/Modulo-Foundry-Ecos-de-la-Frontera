import test from 'node:test';
import assert from 'node:assert/strict';
import { sostenDeSangre } from '../scripts/sangre-sosten.js';

test('3.26 · la sangre de la Barrera y la del ojo de vidrio sostienen ante el daño masivo; solo la primera toca la Barrera', () => {
  assert.equal(sostenDeSangre({ linaje: 'maethra', fuerza: 'plena' }), 'barrera');
  assert.equal(sostenDeSangre({ linaje: 'ikkra', fuerza: 'plena' }), 'ala');
  assert.equal(sostenDeSangre({ linaje: 'ikkra', fuerza: 'debil' }), 'ala', 'cualquier fuerza activa');
  assert.equal(sostenDeSangre({ linaje: 'ikkra', fuerza: 'ninguna' }), null, 'sin sangre activa no sostiene');
  assert.equal(sostenDeSangre({ linaje: 'thalos', fuerza: 'plena' }), null, 'las demás sangres no sostienen');
  assert.equal(sostenDeSangre({ linaje: 'maethra' }), null, 'sin fuerza no sostiene');
  assert.equal(sostenDeSangre(null, true), 'barrera', 'sin linaje vale la marca vieja de portador');
  assert.equal(sostenDeSangre(undefined, false), null);
  assert.equal(sostenDeSangre({ linaje: 'thalos', fuerza: 'plena' }, true), null, 'con linaje manda el linaje, no la marca');
});

test('3.26 · un portador sin Verbe despertado usa la marca de su sangre', async () => {
  const { linajePortador } = await import('../scripts/sangre-sosten.js');
  assert.equal(sostenDeSangre(null, true, 'ala'), 'ala', 'marcado con la sangre del ala');
  assert.equal(sostenDeSangre(null, true, 'barrera'), 'barrera');
  assert.equal(sostenDeSangre(null, true, 'otra'), 'barrera', 'una marca desconocida vale como la vieja');
  assert.equal(sostenDeSangre(null, false, 'ala'), null, 'sin marca de portador no sostiene');
  assert.equal(sostenDeSangre({ linaje: 'maethra', fuerza: 'plena' }, true, 'ala'), 'barrera', 'con linaje manda el linaje');
  assert.equal(linajePortador('ala', 'maethra'), 'ikkra'); assert.equal(linajePortador(undefined, 'maethra'), 'maethra');
});

test('3.26.1 · la ventana del linaje del ojo de vidrio dice que su sangre sostiene, sin Barrera ni Eco', async () => {
  const { resetEnvironment } = await import('./helpers/foundry.mjs');
  const { readCatalog } = await import('../tools/catalog.mjs');
  const V = await import('../scripts/verbe.js');
  resetEnvironment(); V.usarDatos(readCatalog(), 'activo'); game.user.isGM = true;
  const ikkra = V.describir('linaje', 'ikkra');
  assert.match(ikkra, /Su sangre también sostiene/); assert.match(ikkra, /No desgasta la Barrera/);
  assert.doesNotMatch(ikkra, /no abre una herencia/);
  assert.doesNotMatch(V.describir('linaje', 'thalos'), /Su sangre también sostiene/);
});
