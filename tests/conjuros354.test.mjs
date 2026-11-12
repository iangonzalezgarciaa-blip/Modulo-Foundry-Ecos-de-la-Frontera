import test from 'node:test';
import assert from 'node:assert/strict';
import './helpers/foundry.mjs';
import { MockActor } from './helpers/foundry.mjs';
const H = await import('../scripts/conjuros-huecos.js');

test('3.54 · tablas del Manual 2024 por escalones', () => {
  assert.equal(H.deTabla(H.TRUCOS_2024.wizard, 3), 3);
  assert.equal(H.deTabla(H.TRUCOS_2024.wizard, 4), 4);
  assert.equal(H.deTabla(H.TRUCOS_2024.sorcerer, 12), 6);
  assert.equal(H.deTabla(H.PREPARADOS_2024.cleric, 12), 16);
  assert.equal(H.deTabla(H.PREPARADOS_2024.paladin, 6), 6);
  assert.equal(H.deTabla(H.PREPARADOS_2024.sorcerer, 2), 4);
  assert.equal(H.deTabla(H.PREPARADOS_2024.wizard, 20), 25);
  assert.equal(H.deTabla(H.TRUCOS_2024.paladin, 5), 0);
  assert.equal(H.libroMago(1), 6); assert.equal(H.libroMago(5), 14);
});

test('3.54 · huecos del mago: trucos y libro gratis (las copias pagadas no ocupan hueco)', () => {
  const c = [{ level: 0 }, { level: 0 }, { level: 1 }, { level: 1 }, { level: 2, copia: true }];
  const h = H.huecosConjurosDe({ clase: 'wizard', nivel: 3, conjuros: c });
  assert.equal(h.trucos.max, 3); assert.equal(h.trucos.llenos.length, 2);
  assert.equal(h.conjuros.modo, 'libro'); assert.equal(h.conjuros.max, 10); assert.equal(h.conjuros.llenos.length, 2);
});

test('3.54 · huecos de los demás: preparados; los «siempre preparados» no cuentan; los sin preparar se ofrecen', () => {
  const c = [{ id: 'a', level: 1, prep: 1 }, { id: 'b', level: 1, prep: 0 }, { id: 'c', level: 2, prep: 2 }, { id: 'd', level: 1, prep: 1, metodo: 'innate' }];
  const h = H.huecosConjurosDe({ clase: 'cleric', nivel: 1, conjuros: c });
  assert.equal(h.trucos.max, 3);
  assert.equal(h.conjuros.modo, 'preparados'); assert.equal(h.conjuros.max, 4);
  assert.deepEqual(h.conjuros.llenos.map(x => x.id), ['a']);
  assert.deepEqual(h.conjuros.sinPreparar.map(x => x.id), ['b']);
  // La fórmula de la clase (si la hoja la trae) manda sobre la tabla.
  assert.equal(H.huecosConjurosDe({ clase: 'cleric', nivel: 1, preparadosMax: 6, trucosMax: 4, conjuros: [] }).conjuros.max, 6);
});

test('3.54 · desde la hoja: clase lanzadora, conjuros de esa clase y escala de trucos', () => {
  const a = new MockActor(5);
  const cls = { name: 'Mago', system: { levels: 5, spellcasting: { preparation: { max: 9 } } } };
  a.spellcastingClasses = { wizard: cls };
  a.system.scale = { wizard: { 'cantrips-known': { value: 4 } } };
  a.items.push({ id: 's1', type: 'spell', name: 'Luz', img: 'x', system: { level: 0, sourceItem: 'class:wizard' } },
    { id: 's2', type: 'spell', name: 'Escudo', img: 'x', system: { level: 1, sourceClass: 'wizard', prepared: 1 } },
    { id: 's3', type: 'spell', name: 'Proyectil', img: 'x', system: { level: 1 } });
  const [h] = H.huecosDeActor(a);
  assert.equal(h.id, 'wizard'); assert.equal(h.trucos.max, 4); assert.equal(h.trucos.llenos.length, 1);
  assert.equal(h.conjuros.max, 14); assert.equal(h.conjuros.llenos.length, 2);
});
