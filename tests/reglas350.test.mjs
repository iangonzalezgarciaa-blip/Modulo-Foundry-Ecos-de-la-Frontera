import test from 'node:test';
import assert from 'node:assert/strict';
import './helpers/foundry.mjs';
const R = await import('../scripts/reglas-dnd.js');
const T = await import('../scripts/turno-tracker.js');

test('3.50 · salto: largo = Fuerza en pies, alto = 3 + mod; sin carrera, la mitad', () => {
  assert.deepEqual(R.salto({ fue: 16, carrera: true }), { largo: 16, alto: 6, casillas: 3 });
  assert.deepEqual(R.salto({ fue: 16, carrera: false }), { largo: 8, alto: 3, casillas: 1 });
  assert.equal(R.salto({ fue: 8 }).alto, 2);
});
test('3.50 · influir: CD por actitud (10/15/20) o la que fije el DM', () => {
  assert.deepEqual(R.resultadoInfluir(14, 'indiferente'), { cd: 15, exito: false, margen: -1 });
  assert.equal(R.resultadoInfluir(10, 'amistoso').exito, true);
  assert.equal(R.resultadoInfluir(19, 'hostil').exito, false);
  assert.equal(R.resultadoInfluir(12, 'hostil', 12).exito, true);
  assert.equal(R.resultadoInfluir(12, 'hostil', '').cd, 20);
});
test('3.50 · un conjuro con espacio por turno: los trucos, rituales y usos innatos no cuentan', () => {
  assert.equal(R.gastaEspacio({ tipo: 'spell', nivel: 1 }), true);
  assert.equal(R.gastaEspacio({ tipo: 'spell', nivel: 0 }), false);
  assert.equal(R.gastaEspacio({ tipo: 'spell', nivel: 3, ritual: true }), false);
  assert.equal(R.gastaEspacio({ tipo: 'spell', nivel: 3, consumir: false }), false);
  assert.equal(R.gastaEspacio({ tipo: 'spell', nivel: 2, metodo: 'innate' }), false);
  assert.equal(R.gastaEspacio({ tipo: 'weapon', nivel: 2 }), false);
  assert.equal(R.claveTurno(3, 1), '3-1');
});
test('3.50 · cobertura: quien ataca elige su mejor esquina; criatura en medio = media', () => {
  assert.equal(R.cobertura([{ paredes: 0 }]).nivel, 'ninguna');
  assert.equal(R.cobertura([{ paredes: 2 }]).bono, 2);
  assert.equal(R.cobertura([{ paredes: 3 }]).bono, 5);
  assert.equal(R.cobertura([{ paredes: 4 }]).nivel, 'total');
  assert.equal(R.cobertura([{ paredes: 4 }, { paredes: 1 }]).nivel, 'media');
  assert.equal(R.cobertura([{ paredes: 0, criatura: true }]).nivel, 'media');
  assert.equal(R.cobertura([]).nivel, 'ninguna');
});
test('3.50 · una línea corta o no a un rectángulo', () => {
  const r = { x: 10, y: 10, w: 10, h: 10 };
  assert.equal(R.cruzaRect({ x: 0, y: 15 }, { x: 30, y: 15 }, r), true);
  assert.equal(R.cruzaRect({ x: 0, y: 0 }, { x: 30, y: 0 }, r), false);
  assert.equal(R.cruzaRect({ x: 0, y: 0 }, { x: 5, y: 5 }, r), false);
});
test('3.50 · el movimiento cuesta lo que mide Foundry, más arrastrarse, terreno a mano y arrastrar', () => {
  assert.equal(T.costoReal({ distancia: 10 }), 10);
  assert.equal(T.costoReal({ distancia: 10, costo: 20 }), 20, 'región de terreno difícil o trepar');
  assert.equal(T.costoReal({ distancia: 10, derribado: true }), 20);
  assert.equal(T.costoReal({ distancia: 10, costo: 20, derribado: true, accion: 'crawl' }), 20, 'dnd5e ya cobra el arrastrarse');
  assert.equal(T.costoReal({ distancia: 10, terrenoManual: true }), 20);
  assert.equal(T.costoReal({ distancia: 10, costo: 20, terrenoManual: true }), 20, 'no se suma dos veces');
  assert.equal(T.costoReal({ distancia: 10, arrastra: true }), 20);
  assert.equal(T.arrastreCuesta('med', 'med'), true); assert.equal(T.arrastreCuesta('lg', 'sm'), false);
});
test('3.50 · la interacción con objeto es un pip más del turno', () => {
  assert.equal(T.turnoVacio().interaccion, false);
  assert.equal(T.aplicarCambio(T.turnoVacio(), { op: 'alternar', clave: 'interaccion' }).interaccion, true);
  assert.deepEqual(T.aplicarCambio(T.turnoVacio(), { preparada: { que: 'Atacar' } }).preparada, { que: 'Atacar' });
});
