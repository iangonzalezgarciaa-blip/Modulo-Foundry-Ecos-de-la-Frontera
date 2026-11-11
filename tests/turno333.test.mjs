import test from 'node:test';
import assert from 'node:assert/strict';
import { turnoVacio, movimientoRestante, costoTramo, separacionPies, alAlcance, provocaOportunidad, tipoActivacion, DESENGANCHE_ADICIONAL } from '../scripts/turno-tracker.js';

const r = (cx, cy, n = 1) => ({ x: cx * 100, y: cy * 100, w: 100 * n, h: 100 * n });
test('3.33 · el movimiento se descuenta y Correr suma la velocidad', () => {
  const t = { ...turnoVacio(), usado: 20 };
  assert.equal(movimientoRestante(t, 30), 10);
  assert.equal(movimientoRestante({ ...t, extra: 30 }, 30), 40);
  assert.equal(movimientoRestante({ ...t, usado: 50 }, 30), 0);
  assert.equal(costoTramo(10, { derribado: true }), 20, 'arrastrarse cuesta el doble');
});
test('3.33 · alcance por casillas: adyacente sí, a una casilla no; criaturas grandes cuentan su tamaño', () => {
  assert.equal(separacionPies(r(0, 0), r(1, 1)), 0);
  assert.equal(separacionPies(r(0, 0), r(2, 0)), 5);
  assert.ok(alAlcance(0)); assert.ok(!alAlcance(5)); assert.ok(alAlcance(5, 10));
  assert.equal(separacionPies(r(0, 0), r(1, 0, 2)), 0);
});
test('3.33 · alejarse del alcance de un enemigo provoca; quedarse a su lado o sin reacción, no', () => {
  const enemigos = [{ id: 'a', nombre: 'Lobo', rect: r(1, 0), alcance: 5 }, { id: 'b', nombre: 'Ogro', rect: r(5, 5), alcance: 5 }];
  assert.deepEqual(provocaOportunidad(r(0, 0), r(0, 3), enemigos).map(e => e.id), ['a']);
  assert.deepEqual(provocaOportunidad(r(0, 0), r(0, 1), enemigos).map(e => e.id), [], 'sigue adyacente');
  assert.deepEqual(provocaOportunidad(r(0, 0), r(0, 3), [{ ...enemigos[0], reaccionLibre: false }]), []);
});
test('3.33 · la activación marca la acción de D&D y los rasgos de desenganche adicional se reconocen', () => {
  assert.equal(tipoActivacion('action'), 'accion'); assert.equal(tipoActivacion('bonus'), 'adicional'); assert.equal(tipoActivacion('reaction'), 'reaccion'); assert.equal(tipoActivacion('minute'), null);
  assert.ok(DESENGANCHE_ADICIONAL.test('Acción astuta')); assert.ok(DESENGANCHE_ADICIONAL.test('Nimble Escape')); assert.ok(!DESENGANCHE_ADICIONAL.test('Ataque furtivo'));
});

test("3.39 · los cambios del turno viajan por el socket (sin funciones)", async () => {
  const { aplicarCambio, turnoVacio } = await import("../scripts/turno-tracker.js");
  const v = turnoVacio(1, 0);
  const c = JSON.parse(JSON.stringify({ op: "gastar", clave: "accion", extra: 30 }));
  const t1 = aplicarCambio(v, c, v);
  assert.equal(t1.accion, true); assert.equal(t1.extra, 30);
  assert.equal(aplicarCambio(t1, { op: "alternar", clave: "accion" }, v).accion, false);
  assert.equal(aplicarCambio(v, { op: "alternar", clave: "nada" }, v).nada, undefined);
  const t2 = aplicarCambio(aplicarCambio(v, { op: "mover", pies: 10 }, v), { op: "mover", pies: 15, levantado: true }, v);
  assert.equal(t2.usado, 25); assert.deepEqual(t2.hist, [10, 15]); assert.equal(t2.levantado, true);
  const t3 = aplicarCambio(t2, { op: "devolver" }, v);
  assert.equal(t3.usado, 10); assert.deepEqual(t2.hist, [10, 15], "no muta el original");
  assert.equal(aplicarCambio(v, { op: "mas", pies: 5 }, v).extra, 5);
  assert.deepEqual(aplicarCambio(t2, { op: "reiniciar" }, v), v);
  assert.equal(aplicarCambio(v, { reaccion: true }, v).reaccion, true);
});
