import test from 'node:test';
import assert from 'node:assert/strict';
import './helpers/foundry.mjs';
const { festejoDe, temaDe, TEMAS } = await import('../scripts/festejo-20.js');

test('3.47 · el 20 natural festeja: crítico en ataques, «se levanta» en la salvación de muerte', () => {
  assert.equal(festejoDe({ natural: 20, tipo: 'attack' }).grito, '¡CRÍTICO!');
  assert.equal(festejoDe({ natural: 20, tipo: 'death' }).grito, '¡SE LEVANTA!');
  assert.equal(festejoDe({ natural: 20, tipo: 'skill' }).grito, '¡20 NATURAL!');
  assert.equal(festejoDe({ natural: 19, tipo: 'attack' }), null);
});
test('3.47 · el 1 es Pifia salvo que se apague; iniciativa, concentración y daño no festejan', () => {
  assert.equal(festejoDe({ natural: 1, tipo: 'attack' }).grito, '¡PIFIA!');
  assert.equal(festejoDe({ natural: 1, tipo: 'attack', conUno: false }), null);
  for (const t of ['initiative', 'concentration', 'damage', null]) assert.equal(festejoDe({ natural: 20, tipo: t }), null, String(t));
});
test('3.47 · solo PJ por defecto; «solo ataques» deja fuera pruebas y salvaciones', () => {
  assert.equal(festejoDe({ natural: 20, tipo: 'attack', esPJ: false }), null);
  assert.ok(festejoDe({ natural: 20, tipo: 'attack', esPJ: false, quien: 'todos' }));
  assert.equal(festejoDe({ natural: 20, tipo: 'save', soloAtaques: true }), null);
  assert.ok(festejoDe({ natural: 20, tipo: 'death', soloAtaques: true }));
});
test('3.47 · el tema sale de la naturaleza del Verbe; el 1 siempre es rojo', () => {
  assert.equal(temaDe(20, 'fuego'), 'fuego'); assert.equal(temaDe(20, null), 'dorado'); assert.equal(temaDe(20, 'madera'), 'dorado');
  assert.equal(temaDe(1, 'agua'), 'pifia');
  for (const t of Object.values(TEMAS)) assert.match(t.c1, /^#[0-9a-f]{6}$/i);
});
