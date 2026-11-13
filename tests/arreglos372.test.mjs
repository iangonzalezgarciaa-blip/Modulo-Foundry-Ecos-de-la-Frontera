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

test('3.72 · el inicio de un efecto va en `start` en Foundry 14 y en `duration` en 13', async () => {
  const { marcarInicio, segundosDuracion } = await import('../scripts/compat.js');
  // Copia de un efecto de técnica en Foundry 14.370 (lo que hace «Puño de piedra»).
  const copia = { name: 'Puño de piedra', start: null, duration: { value: 6, units: 'seconds', expiry: 'turnStart', expired: false } };
  marcarInicio(copia, { tiempo: 500, combate: 'c1', ronda: 2, turno: 1, generacion: 14 });
  assert.deepEqual(copia.start, { time: 500, combat: 'c1', round: 2, turn: 1 });
  assert.deepEqual(copia.duration, { value: 6, units: 'seconds', expiry: 'turnStart', expired: false });
  // Fuera de combate no inventa ronda ni turno.
  const fuera = marcarInicio({ start: null, duration: { value: 60, units: 'seconds' } }, { tiempo: 9, generacion: 14 });
  assert.deepEqual(fuera.start, { time: 9 });
  // Foundry 13: como antes, sin claves nulas.
  const v13 = marcarInicio({ duration: { seconds: 6, startTime: null, startRound: null, rounds: 1 } }, { tiempo: 7, ronda: 3, generacion: 13 });
  assert.deepEqual(v13.duration, { seconds: 6, rounds: 1, startTime: 7, startRound: 3 });
  assert.ok(!('start' in v13));
  assert.equal(segundosDuracion({ seconds: 30 }), 30);
  assert.equal(segundosDuracion({ value: 2, units: 'minutes' }), 120);
  assert.equal(segundosDuracion({ value: 3, units: 'rounds' }), 18);
  assert.equal(segundosDuracion({}), 60);
});

test('3.72 · ninguna copia de efecto vuelve a escribir duration.startTime a mano', async () => {
  const { readFileSync } = await import('node:fs');
  for (const f of ['scripts/verbe.js', 'scripts/relics.js']) {
    const s = readFileSync(f, 'utf8');
    assert.doesNotMatch(s, /duration\.startTime\s*=/, f);
    assert.doesNotMatch(s, /\.\.\.data\.duration,\s*startTime/, f);
  }
});
