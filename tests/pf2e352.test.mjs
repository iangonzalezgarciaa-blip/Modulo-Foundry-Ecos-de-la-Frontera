import test from 'node:test';
import assert from 'node:assert/strict';
import './helpers/foundry.mjs';
const { carpetaDe, PACKS } = await import('../scripts/pf2e-dotes.js');
const f = x => ({ flags: { 'ecos-frontera': { pf2e: x } } });

test('3.52 · cada dote, especie y objeto de PF2e va a su carpeta', () => {
  assert.deepEqual(carpetaDe('dotes', f({ categoria: 'class', clase: ['fighter'] })), ['De clase', 'Guerrero']);
  assert.deepEqual(carpetaDe('dotes', f({ categoria: 'ancestry', ascendencia: ['kobold'] })), ['De ascendencia', 'Kobold']);
  assert.deepEqual(carpetaDe('dotes', f({ categoria: 'skill', nivel: 4 })), ['De habilidad', 'Nivel 4']);
  assert.deepEqual(carpetaDe('razas', f({ tipo: 'herencia', versatil: true })), ['Herencias versátiles']);
  assert.deepEqual(carpetaDe('razas', f({ tipo: 'raza' })), ['Especies']);
  assert.deepEqual(carpetaDe('objetos', f({ grupo: 'Venenos' })), ['Venenos']);
  assert.equal(Object.keys(PACKS).length, 3);
});
