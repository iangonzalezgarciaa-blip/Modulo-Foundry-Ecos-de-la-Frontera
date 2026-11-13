import test from 'node:test';
import assert from 'node:assert/strict';
import './helpers/foundry.mjs';
const V = await import('../scripts/verbe.js');
const { duracionSinNulos } = await import('../scripts/compat.js');
const { updateSumar } = await import('../scripts/deshacer.js');
import { readCatalog } from '../tools/catalog.mjs';
const D = readCatalog();

test('3.71 · identificadores válidos para dnd5e 6 (prueba de uso en el mundo)', () => {
  assert.equal(V.identificadorValido('rastro-sensor-carmesí'), 'rastro-sensor-carmesi');
  assert.equal(V.identificadorValido('dm-AbC12x'), 'dm-abc12x');
  assert.equal(V.identificadorValido('  '), 'tecnica');
  const t = D.tecnicas.find(x => x.id === 'rastro-sensor-carmesí');
  assert.ok(t, 'la técnica existe');
  for (const x of D.tecnicas) assert.match(V.identificadorValido(x.item?.system?.identifier ?? x.id), /^[a-z0-9-]+$/, x.id);
});

test('3.71 · duraciones copiadas sin claves nulas (Foundry 14)', () => {
  const d = duracionSinNulos({ seconds: 6, start: null, startTime: 100, startRound: undefined, rounds: 1 });
  assert.deepEqual(d, { seconds: 6, startTime: 100, rounds: 1 });
  assert.equal(duracionSinNulos(null), null);
});

test('3.71 · Deshacer devuelve solo lo suyo (suma, no valor fijo)', () => {
  // Recibió 18 de la técnica y luego 9 de otra cosa: Deshacer devuelve 18.
  assert.deepEqual(updateSumar({ 'system.attributes.hp.value': 9972, 'system.attributes.hp.temp': 0 }, { 'system.attributes.hp.value': 18, 'system.attributes.hp.temp': 0 }, 9999),
    { 'system.attributes.hp.value': 9990, 'system.attributes.hp.temp': 0 });
  // No pasa del máximo, y una cura deshecha resta.
  assert.equal(updateSumar({ 'system.attributes.hp.value': 25 }, { 'system.attributes.hp.value': 10 }, 30)['system.attributes.hp.value'], 30);
  assert.equal(updateSumar({ 'system.attributes.hp.value': 25 }, { 'system.attributes.hp.value': -8 }, 30)['system.attributes.hp.value'], 17);
  assert.equal(updateSumar({ 'system.attributes.hp.value': 3 }, { 'system.attributes.hp.value': -8 }, 30)['system.attributes.hp.value'], 0);
});
