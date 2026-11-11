import test from 'node:test';
import assert from 'node:assert/strict';
import { cdPrecioVolver, permitidoAcechado, TEXTO_ACECHADO } from '../scripts/muerte-335.js';
import { topeDGLugar } from '../scripts/rest-core.js';

test('3.35 · el precio de volver escala con el Agotamiento', () => {
  assert.equal(cdPrecioVolver(0), 8); assert.equal(cdPrecioVolver(5), 18);
});
test('3.35 · a 0 PG: acciones básicas sí; reacciones, ataques, conjuros y técnicas no', () => {
  assert.equal(permitidoAcechado({ type: 'utility', activation: { type: 'action' }, item: { type: 'consumable', flags: {} } }).ok, true, 'tomar una poción');
  assert.equal(permitidoAcechado({ type: 'attack', activation: { type: 'action' }, item: { type: 'weapon', flags: {} } }).ok, false);
  assert.equal(permitidoAcechado({ type: 'utility', activation: { type: 'reaction' }, item: { type: 'feat', flags: {} } }).ok, false);
  assert.equal(permitidoAcechado({ type: 'utility', activation: { type: 'action' }, item: { type: 'spell', flags: {} } }).ok, false);
  assert.equal(permitidoAcechado({ type: 'utility', activation: { type: 'action' }, item: { type: 'spell', flags: { 'ecos-frontera': { verbe: { id: 'x' } } } } }).ok, false);
  assert.match(TEXTO_ACECHADO, /arrastrarse \(cada pie cuesta el doble\)/);
});
test('3.35 · el Santuario es el techo; a la intemperie el Largo deja la mitad y el Corto 1', () => {
  assert.equal(topeDGLugar(3, { santuario: true, tipo: 'long' }), 3);
  assert.equal(topeDGLugar(3, { santuario: false, tipo: 'long' }), 1);
  assert.equal(topeDGLugar(4, { santuario: false, tipo: 'long' }), 2);
  assert.equal(topeDGLugar(4, { santuario: false, tipo: 'short' }), 1);
  assert.equal(topeDGLugar(Infinity, { santuario: false }), Infinity);
});
