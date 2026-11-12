import test from 'node:test';
import assert from 'node:assert/strict';
import './helpers/foundry.mjs';
const { estiloDe, ESTILOS, ESTILO_PNJ } = await import('../scripts/hoja-estilos.js');

test('3.51 · cinco estilos para los PJ a elección; sin elegir, la hoja original', () => {
  assert.equal(Object.keys(ESTILOS).length, 5);
  assert.equal(estiloDe({ tipo: 'character', elegido: 'marea' }), 'marea');
  assert.equal(estiloDe({ tipo: 'character', elegido: undefined }), null);
  assert.equal(estiloDe({ tipo: 'character', elegido: 'inventado' }), null);
});
test('3.51 · los PNJ llevan «Tinta» salvo que el DM elija otro u «Original»; cada usuario puede no verlos', () => {
  assert.equal(estiloDe({ tipo: 'npc' }), 'tinta');
  assert.equal(estiloDe({ tipo: 'npc', pnj: 'sombra' }), 'sombra');
  assert.equal(estiloDe({ tipo: 'npc', pnj: 'original' }), null);
  assert.equal(estiloDe({ tipo: 'character', elegido: 'llama', ver: false }), null);
  assert.equal(estiloDe({ tipo: 'vehicle' }), null);
  assert.ok(ESTILO_PNJ.tinta);
});
