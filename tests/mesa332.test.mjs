import test from 'node:test';
import assert from 'node:assert/strict';
import { soloSobreSi, efectosParaUsuario } from '../scripts/mesa-propio.js';
import { explicarEstado, explicarEfecto, textoAgotamiento, ESTADOS_EXPLICADOS } from '../scripts/estados-explicados.js';

test('3.32 · lo que es solo sobre ti no toca al marcado', () => {
  assert.equal(soloSobreSi({ type: 'utility', range: { units: 'self' }, target: { affects: { type: 'self' } } }), true);
  assert.equal(soloSobreSi({ type: 'utility', range: { units: 'self' }, target: {}, item: { system: { target: { affects: { type: 'self' } } } } }), true);
  assert.equal(soloSobreSi({ type: 'save', range: { units: 'self' }, target: { template: { type: 'cone' } } }), false, 'un cono desde ti sí toca a otros');
  assert.equal(soloSobreSi({ type: 'attack', range: { units: 'self' }, target: {} }), false);
  assert.equal(soloSobreSi({ type: 'utility', range: { units: 'ft', value: 30 }, target: { affects: { type: 'creature' } } }), false);
  assert.equal(soloSobreSi(null), false);
});
test('3.32 · los efectos propios se copian para quien usa, sin repetir los que ya tiene', () => {
  const ef = { name: 'Guardia de hierro', _id: 'x', changes: [], toObject() { return { _id: 'x', name: this.name, changes: [], transfer: true, disabled: true }; } };
  const act = { effects: [{ _id: 'x' }], item: { uuid: 'Item.a', effects: new Map([['x', ef]]) } };
  const d = efectosParaUsuario(act);
  assert.equal(d.length, 1); assert.equal(d[0]._id, undefined); assert.equal(d[0].transfer, false); assert.equal(d[0].origin, 'Item.a');
  assert.equal(efectosParaUsuario(act, ['Guardia de hierro']).length, 0);
});
test('3.32 · cada estado común dice qué significa y qué hacer', () => {
  for (const id of ['prone', 'grappled', 'restrained', 'stunned', 'bloodied', 'exhaustion', 'unconscious', 'frightened'])
    assert.ok(explicarEstado(id, { agotamiento: 2 }).length > 30, id);
  assert.match(explicarEstado('prone'), /Derribado/);
  assert.match(textoAgotamiento(2), /−2 a todas sus tiradas d20.*−10 ft/);
  assert.match(textoAgotamiento(5), /Un nivel más y muere/);
  assert.equal(explicarEfecto(['loquesea']), null);
  assert.match(explicarEfecto(['bloodied']), /mitad de sus PG/);
  assert.ok(Object.keys(ESTADOS_EXPLICADOS).length >= 25);
});
