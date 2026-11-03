import test from 'node:test';
import assert from 'node:assert/strict';
import './helpers/foundry.mjs';
import { forzarPreguntaAtaque, avisoVentaja, pideConfirmacion, queProvoca, motivoPausaMoneda } from '../scripts/mesa-control.js';

test('cada ataque abre la ventana de dnd5e aunque midi-qol la salte, y avisa lo detectado', () => {
  const dialog = { configure: false };
  assert.equal(forzarPreguntaAtaque({ advantage: true }, dialog), true);
  assert.equal(dialog.configure, true);
  assert.deepEqual(dialog.options.ecosPregunta, { ventaja: true, desventaja: false });
  assert.match(avisoVentaja(dialog.options.ecosPregunta), /detecta <b>ventaja<\/b>.*¿La usas\?/);
  assert.doesNotMatch(avisoVentaja({ ventaja: false, desventaja: false }), /detecta/);
  assert.match(avisoVentaja({ ventaja: true, desventaja: true }), /se anulan/);
});

test('solo se pregunta por estados que una criatura pone a otra', () => {
  const a = { uuid: 'A' }, b = { uuid: 'B' };
  assert.deepEqual(pideConfirmacion({ statuses: new Set(['prone']) }, b, a), ['prone']);
  assert.deepEqual(pideConfirmacion({ statuses: new Set(['prone']) }, a, a), []);
  assert.deepEqual(pideConfirmacion({ statuses: new Set(['concentrating']) }, b, a), []);
  assert.deepEqual(pideConfirmacion({ statuses: new Set() }, b, a), []);
  assert.deepEqual(pideConfirmacion({ statuses: new Set(['stunned']) }, b, null), []);
  assert.deepEqual(pideConfirmacion({ statuses: new Set(['stunned']), flags: { 'ecos-frontera': { sinPregunta: true } } }, b, a), []);
  assert.match(queProvoca('prone'), /Derribado/);
});

test('la Moneda Antigua se ofrece con un 1 o al fallar, según el ajuste', () => {
  const d20 = (total, nat = 10) => ({ total, isCritical: nat === 20, isFumble: nat === 1, dice: [{ faces: 20 }] });
  assert.match(motivoPausaMoneda(d20(5, 1), { objetivo: 12, modo: 'uno' }), /1 natural/);
  assert.equal(motivoPausaMoneda(d20(11), { objetivo: 12, modo: 'uno' }), null);
  assert.match(motivoPausaMoneda(d20(11), { objetivo: 12, modo: 'fallo' }), /falla \(<b>11<\/b> contra 12\)/);
  assert.equal(motivoPausaMoneda(d20(12), { objetivo: 12, modo: 'fallo' }), null);
  assert.equal(motivoPausaMoneda(d20(5, 1), { objetivo: 12, modo: 'apagado' }), null);
  assert.equal(motivoPausaMoneda(d20(11), { objetivo: null, modo: 'fallo' }), null);
});
