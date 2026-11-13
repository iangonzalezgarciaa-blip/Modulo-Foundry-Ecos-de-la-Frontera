import test from 'node:test';
import assert from 'node:assert/strict';

const { updateSumar, aplanar } = await import('../scripts/deshacer.js');

test('3.72 · «Deshacer» lee las banderas expandidas por Foundry (claves con puntos)', () => {
  // Así vuelve del mensaje lo que se guardó como { 'system.attributes.hp.value': 21, 'system.attributes.hp.temp': 0 }.
  const guardado = { system: { attributes: { hp: { value: 21, temp: 0 } } } };
  assert.deepEqual(aplanar(guardado), { 'system.attributes.hp.value': 21, 'system.attributes.hp.temp': 0 });
  assert.deepEqual(updateSumar({ 'system.attributes.hp.value': 9978, 'system.attributes.hp.temp': 0 }, guardado, 9999),
    { 'system.attributes.hp.value': 9999, 'system.attributes.hp.temp': 0 });
  // Nunca escribe sobre algo que no es un número (antes escribía `system: 0`).
  assert.deepEqual(updateSumar({ system: { attributes: {} } }, { system: 5 }, 9999), {});
  assert.deepEqual(updateSumar({ 'system.attributes.hp.value': 10 }, { 'system.attributes.hp.value': 'x' }, 30), {});
  // Lo plano de antes sigue igual.
  assert.equal(updateSumar({ 'system.attributes.hp.value': 25 }, { 'system.attributes.hp.value': -8 }, 30)['system.attributes.hp.value'], 17);
});
