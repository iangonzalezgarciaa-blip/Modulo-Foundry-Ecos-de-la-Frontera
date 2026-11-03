import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { MockActor, resetEnvironment } from './helpers/foundry.mjs';
import { readCatalog } from '../tools/catalog.mjs';
import * as V from '../scripts/verbe.js';
import { reservaBase, nivelesSinTirar, simularReserva, promedioNivel, modoReserva } from '../scripts/verbe-reserva.js';
const D = readCatalog();
beforeEach(() => { resetEnvironment(); V.usarDatos(D, 'activo'); });

test('el promedio de los dados queda cerca de la tabla fija y hay variación sin mínimo', () => {
  let s = 7; const azar = () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648);
  const sim = simularReserva(2000, azar);
  for (const r of sim) assert.ok(Math.abs(r.media - r.esperado) < 2, `nivel ${r.nivel}`);
  assert.ok(Math.abs(sim[19].esperado - D.verbeMax[20]) <= 2);
  assert.ok(sim[0].p10 <= 2);
  assert.ok(sim[19].p90 - sim[19].p10 > 20);
  assert.equal(promedioNivel(1), 5.5);
});

test('fichas anteriores: promedio = tabla; al pasar a dados, lo que ya tenía queda fijo', () => {
  assert.equal(modoReserva({}), 'promedio');
  assert.equal(reservaBase({}, 10, D.verbeMax), 80);
  const e = { dadosVerbe: { modo: 'dados', fijoHasta: 5, tiradas: { 6: 9, 7: 2 } } };
  assert.equal(reservaBase(e, 7, D.verbeMax), 34 + 9 + 2);
  assert.deepEqual(nivelesSinTirar(e, 9), [8, 9]);
  assert.equal(reservaBase(e, 4, D.verbeMax), 22);
});

test('con dados, el DM tira al despertar y al subir; el máximo usa la suma más la característica', async () => {
  const a = new MockActor(3, { valor: 0, dadosVerbe: { modo: 'dados', fijoHasta: 0, tiradas: {} } });
  const conTabla = new MockActor(3, { valor: 0 });
  assert.deepEqual(await V.asegurarTiradasVerbe(a), [1, 2, 3]);
  assert.deepEqual(V.estado(a).dadosVerbe.tiradas, { 1: 3, 2: 3, 3: 3 });
  assert.equal(V.maxVerbe(a) - V.maxVerbe(conTabla), 9 - D.verbeMax[3]);
  assert.deepEqual(await V.asegurarTiradasVerbe(a), []);
  assert.equal(await V.cambiarModoReserva(conTabla, 'dados'), true);
  assert.equal(V.estado(conTabla).dadosVerbe.fijoHasta, 3);
  assert.deepEqual(await V.asegurarTiradasVerbe(conTabla), []);
});
