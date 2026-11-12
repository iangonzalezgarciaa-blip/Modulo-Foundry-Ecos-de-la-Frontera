import test from 'node:test';
import assert from 'node:assert/strict';
import { acierta, multiplicadorSalvacion, descripcionesDano, resolvible, lineaResultado, MODOS_RESOLUCION } from '../scripts/resolucion-auto.js';

test('3.70 · el ataque acierta contra la CA; 20 natural es crítico y 1 natural falla', () => {
  assert.deepEqual(acierta({ total: 15, natural: 10, ca: 15 }), { impacta: true, critico: false });
  assert.deepEqual(acierta({ total: 14, natural: 9, ca: 15 }), { impacta: false, critico: false });
  assert.deepEqual(acierta({ total: 8, natural: 20, ca: 25 }), { impacta: true, critico: true });
  assert.deepEqual(acierta({ total: 30, natural: 1, ca: 10 }), { impacta: false, critico: false });
});

test('3.70 · la salvación: mitad, nada o todo según la técnica', () => {
  assert.equal(multiplicadorSalvacion(false, 'half'), 1);
  assert.equal(multiplicadorSalvacion(true, 'half'), 0.5);
  assert.equal(multiplicadorSalvacion(true, 'none'), 0);
  assert.equal(multiplicadorSalvacion(true, 'full'), 1);
  assert.equal(multiplicadorSalvacion(true), 0.5);
});

test('3.70 · las tiradas de daño pasan a D&D con su tipo', () => {
  const d = descripcionesDano([{ total: 12, options: { type: 'fire', properties: ['mgc'] } }, { total: -3, options: { type: 'cold' } }, { total: NaN }]);
  assert.equal(d.length, 2);
  assert.equal(d[0].value, 12); assert.equal(d[0].type, 'fire'); assert.ok(d[0].properties.has('mgc'));
  assert.equal(d[1].value, 0, 'nunca negativo');
});

test('3.70 · qué se resuelve solo y cómo se lee', () => {
  assert.equal(resolvible({ type: 'attack' }), true);
  assert.equal(resolvible({ type: 'save' }), true);
  assert.equal(resolvible({ type: 'heal' }), true);
  assert.equal(resolvible({ type: 'damage', damage: { parts: [] } }), false);
  assert.equal(resolvible({ type: 'damage', damage: { parts: [{}] } }), true);
  assert.equal(resolvible({ type: 'utility' }), false);
  assert.match(lineaResultado({ nombre: 'Lobo', ataque: { total: 17, natural: 20 }, ca: 13, impacta: true, critico: true, dano: 14, pgAntes: 30, pgDespues: 16, efectos: ['Derribado'] }), /Lobo.*ataque 17 \(20\) contra CA 13: ¡crítico!.*recibe 14 PG \(30 → 16\).*efectos: Derribado/);
  assert.match(lineaResultado({ nombre: 'Orco', salvacion: { total: 16 }, cd: 15, salvado: true, dano: 0 }), /se salva · sin daño/);
  assert.deepEqual(Object.keys(MODOS_RESOLUCION), ['todo', 'tirar', 'no']);
});
