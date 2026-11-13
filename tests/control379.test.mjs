import test from 'node:test';
import assert from 'node:assert/strict';
import { dadoDerroche, tirarControl, textoCostoControl, diaEjercicio, CD_EJERCICIO, diasEjercicio, TOPE_EJERCICIO } from '../scripts/verbe-entreno.js';

test('3.79 · el derroche sale del Control del Verbe, no de la etapa', () => {
  assert.equal(dadoDerroche(-1).formula, '1d6');
  assert.equal(dadoDerroche(2).formula, '1d6');
  assert.equal(dadoDerroche(3).formula, '1d4');
  assert.equal(dadoDerroche(6).formula, '1d3');
  assert.equal(dadoDerroche(8).formula, '1d2');
  assert.equal(dadoDerroche(10).formula, '1d2−1');
  assert.equal(dadoDerroche(11).caras, 0, 'con +11 ya no derrocha');
  // Mucha reserva y poco control (+1): hasta 6 de derroche. Control fino (+11): nada.
  assert.equal(tirarControl(dadoDerroche(1), () => 0.999).valor, 6);
  assert.equal(tirarControl(dadoDerroche(11), () => 0.999).valor, 0);
  assert.equal(textoCostoControl(3, dadoDerroche(4)), '3 + 1d4');
  assert.equal(textoCostoControl(3, dadoDerroche(12)), '3');
  // Lo antiguo (por etapa) sigue sirviendo donde no hay hoja.
  assert.equal(textoCostoControl(2, 1), '2 + 1d4');
});

test('3.79 · ejercicio de control: días buenos, sensei, tope y un día por vez', () => {
  assert.deepEqual([0, 1, 2].map(CD_EJERCICIO), [12, 14, 16]);
  assert.equal(diasEjercicio(), 5); assert.equal(diasEjercicio({ sensei: true }), 3);
  let c = {};
  for (let d = 1; d <= 4; d++) { const r = diaEjercicio(c, { total: 15, natural: 10, dia: d }); assert.ok(r.ok && r.exito && !r.sube); c = r.estado; }
  const r5 = diaEjercicio(c, { total: 15, natural: 10, dia: 5 }); assert.ok(r5.sube); assert.equal(r5.estado.nivel, 1);
  assert.equal(diaEjercicio(r5.estado, { total: 30, natural: 10, dia: 5 }).ok, false, 'un ejercicio por día');
  assert.equal(diaEjercicio({ nivel: 1 }, { total: 13, natural: 10, dia: 9 }).exito, false, 'el nivel 1 pide CD 14');
  assert.equal(diaEjercicio({ nivel: 0, puntos: 1 }, { total: 2, natural: 20, dia: 9, sensei: true }).sube, true, 'un 20 cuenta doble y con sensei bastan 3');
  assert.equal(diaEjercicio({ nivel: TOPE_EJERCICIO }, { total: 30, natural: 15, dia: 9 }).ok, false);
});
