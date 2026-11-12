import test from 'node:test';
import assert from 'node:assert/strict';
import './helpers/foundry.mjs';
const { alcancePies, reaccionesEnAlcance } = await import('../scripts/reacciones-verbe.js');
const T = (id, alc) => ({ id, n: id, t: 'R', alc });

test('3.46 · alcance en pies: 1,5 m = 5 ft; 9 m = 30 ft; 18 m = 60 ft; «yo» = 0', () => {
  assert.equal(alcancePies('yo'), 0); assert.equal(alcancePies('9 m'), 30); assert.equal(alcancePies('18 m'), 60);
  assert.equal(alcancePies('1,5 m'), 5); assert.equal(alcancePies('150 m'), 500); assert.equal(alcancePies('toque'), null);
});
test('3.46 · las reacciones «sobre ti» solo sirven al atacado, y no repiten las defensas que ya pregunta el Verbe', () => {
  const ts = [T('palma', 'yo'), T('cortina', 'yo')];
  assert.equal(reaccionesEnAlcance({ tecnicas: ts, esBlanco: false, distBlanco: 5 }).length, 0);
  const r = reaccionesEnAlcance({ tecnicas: ts, esBlanco: true, yaPreguntadas: new Set(['cortina']) });
  assert.deepEqual(r.map(x => x.id), ['palma']);
});
test('3.46 · las de alcance sirven si estás a ese alcance del atacado o del atacante', () => {
  const ts = [T('coser', '18 m'), T('puesto', '9 m')];
  assert.deepEqual(reaccionesEnAlcance({ tecnicas: ts, distBlanco: 40, distAtacante: 80 }).map(x => x.id), ['coser']);
  assert.deepEqual(reaccionesEnAlcance({ tecnicas: ts, distBlanco: 90, distAtacante: 25 }).map(x => x.id), ['coser', 'puesto']);
  assert.equal(reaccionesEnAlcance({ tecnicas: ts, distBlanco: 90, distAtacante: 90 }).length, 0);
  assert.equal(reaccionesEnAlcance({ tecnicas: ts }).length, 0, 'sin distancias no avisa');
  assert.equal(reaccionesEnAlcance({ tecnicas: [{ ...T('x', '18 m'), t: 'A' }], distBlanco: 5 }).length, 0, 'solo reacciones');
});
