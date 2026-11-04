import test from 'node:test';
import assert from 'node:assert/strict';
import { cambio, cambios, tipoDeCambio, infoTirada, objetivosMensaje, filtrarObjetivosMensaje, consumoMensaje, quitar, duracionFinita, modoNormal, opcionesModo } from '../scripts/compat.js';

test('3.10: cambios de efecto en el formato de Foundry 13 (mode) y 14 (type)', () => {
  const antes = globalThis.CONST;
  globalThis.CONST = {};
  assert.deepEqual(cambio('system.attributes.ac.bonus', 'add', 2), { key: 'system.attributes.ac.bonus', mode: 2, value: '2' });
  assert.deepEqual(cambio('x', 5, '0'), { key: 'x', mode: 5, value: '0' });
  globalThis.CONST = { ACTIVE_EFFECT_CHANGE_TYPES: { add: 20 } };
  assert.deepEqual(cambio('x', 2, -1), { key: 'x', type: 'add', value: '-1' });
  assert.deepEqual(cambios([{ key: 'y', mode: 1, value: 0.5 }]), [{ key: 'y', type: 'multiply', value: '0.5' }]);
  assert.equal(tipoDeCambio({ mode: 4 }), 'upgrade');
  assert.equal(tipoDeCambio({ type: 'override', mode: 2 }), 'override');
  globalThis.CONST = antes;
});

test('3.10: tipo de tirada desde dnd5e 5 (flags) y dnd5e 6 (type y system)', () => {
  assert.deepEqual(infoTirada({ flags: { dnd5e: { roll: { type: 'skill', skillId: 'cvb' } } } }).skill, 'cvb');
  assert.equal(infoTirada({ type: 'attack', system: {} }).tipo, 'attack');
  assert.equal(infoTirada({ type: 'check', system: { skill: 'ath', ability: 'str' } }).tipo, 'skill');
  assert.equal(infoTirada({ type: 'check', system: { type: 'initiative' } }).tipo, 'initiative');
  assert.equal(infoTirada({ type: 'save', system: { type: 'death' } }).tipo, 'death');
  assert.equal(infoTirada({ type: 'save', system: { type: 'concentration' } }).tipo, 'concentration');
  assert.equal(infoTirada({ type: 'save', system: { ability: 'dex' } }).tipo, 'save');
  assert.equal(infoTirada({ type: 'base', flags: { core: { initiativeRoll: true } } }).tipo, 'initiative');
  assert.equal(infoTirada({ type: 'base' }), null);
});

test('3.10: objetivos y consumo de la tarjeta en los dos formatos', () => {
  const nuevo = { system: { targets: [{ actor: 'Actor.a', token: 'Scene.s.Token.t', name: 'A' }, { actor: 'Actor.b', name: 'B' }], deltas: { actor: [] } } };
  const viejo = { flags: { dnd5e: { targets: [{ uuid: 'Actor.a', name: 'A' }, { uuid: 'Actor.b' }], use: { consumed: { actor: [1] } } } } };
  assert.deepEqual(objetivosMensaje(nuevo).map(o => o.uuid), ['Actor.a', 'Actor.b']);
  assert.deepEqual(objetivosMensaje(viejo).map(o => o.uuid), ['Actor.a', 'Actor.b']);
  assert.deepEqual(filtrarObjetivosMensaje(nuevo, o => o.uuid !== 'Actor.a')['system.targets'].map(t => t.actor), ['Actor.b']);
  assert.deepEqual(filtrarObjetivosMensaje(viejo, o => o.uuid !== 'Actor.b')['flags.dnd5e.targets'].map(t => t.uuid), ['Actor.a']);
  assert.equal(filtrarObjetivosMensaje(nuevo, () => true), null);
  assert.deepEqual(consumoMensaje(nuevo), { actor: [] });
  assert.deepEqual(consumoMensaje(viejo), { actor: [1] });
});

test('3.10: borrar claves, duración y modo de los mensajes', () => {
  assert.deepEqual(quitar('flags.ecos-frontera.pj'), ['flags.ecos-frontera.-=pj', null]);
  globalThis._del = { borrar: true };
  assert.deepEqual(quitar('flags.ecos-frontera.pj'), ['flags.ecos-frontera.pj', { borrar: true }]);
  delete globalThis._del;
  assert.equal(duracionFinita({ duration: { value: 2, units: 'rounds', expiry: null } }), true);
  assert.equal(duracionFinita({ duration: { value: null, units: 'seconds', expiry: null } }), false);
  assert.equal(duracionFinita({ duration: { seconds: 60 } }), true);
  assert.equal(modoNormal('gmroll'), 'gm');
  assert.equal(modoNormal('public'), 'public');
  assert.deepEqual(opcionesModo('gm'), { rollMode: 'gmroll' });
});
