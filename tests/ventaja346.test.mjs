import test from 'node:test';
import assert from 'node:assert/strict';
import './helpers/foundry.mjs';
const { ventajaAtaque, avisoSalvacion, distanciaCasillas, explicar } = await import('../scripts/ventaja-estados.js');
const S = (...k) => new Set(k);

test('3.46 · atacar a quien está Esquivando da desventaja; si está Aturdido, no esquiva y da ventaja', () => {
  assert.equal(ventajaAtaque({ blanco: S('dodging') }).desventaja, true);
  const r = ventajaAtaque({ blanco: S('dodging', 'stunned') });
  assert.equal(r.desventaja, false); assert.equal(r.ventaja, true);
});
test('3.46 · Derribado: ventaja a 1,5 m, desventaja más lejos; sin distancia no se decide', () => {
  assert.equal(ventajaAtaque({ blanco: S('prone'), distancia: 5 }).ventaja, true);
  const lejos = ventajaAtaque({ blanco: S('prone'), distancia: 30, aDistancia: true });
  assert.equal(lejos.desventaja, true); assert.equal(lejos.ventaja, false);
  const r = ventajaAtaque({ blanco: S('prone'), distancia: null });
  assert.equal(r.ventaja || r.desventaja, false);
});
test('3.46 · estados de quien ataca: Cegado, Derribado y Apresado restan; Invisible, Escondido y Ayudado suman', () => {
  for (const k of ['blinded', 'prone', 'restrained']) assert.equal(ventajaAtaque({ atacante: S(k) }).desventaja, true, k);
  for (const k of ['invisible', 'hiding']) assert.equal(ventajaAtaque({ atacante: S(k) }).ventaja, true, k);
  assert.equal(ventajaAtaque({ ayudado: true }).ventaja, true);
  assert.match(ventajaAtaque({ atacante: S('frightened') }).notas[0], /Asustado/);
});
test('3.46 · blanco Invisible da desventaja salvo que veas lo invisible; Paralizado a 1,5 m avisa del crítico', () => {
  assert.equal(ventajaAtaque({ blanco: S('invisible') }).desventaja, true);
  assert.equal(ventajaAtaque({ blanco: S('invisible'), veInvisible: true }).desventaja, false);
  const p = ventajaAtaque({ blanco: S('paralyzed'), distancia: 5 });
  assert.equal(p.ventaja, true); assert.match(p.notas.join(), /crítico/);
});
test('3.46 · a distancia: enemigo a 1,5 m o más allá del alcance normal da desventaja', () => {
  assert.equal(ventajaAtaque({ aDistancia: true, enemigoCerca: true }).desventaja, true);
  assert.equal(ventajaAtaque({ aDistancia: true, alcanceNormal: 80, distancia: 100 }).desventaja, true);
  assert.equal(ventajaAtaque({ aDistancia: true, alcanceNormal: 80, distancia: 60 }).desventaja, false);
  assert.equal(ventajaAtaque({ aDistancia: false, enemigoCerca: true }).desventaja, false);
});
test('3.46 · ventaja y desventaja juntas se anulan y el chat lo dice', () => {
  const r = ventajaAtaque({ atacante: S('blinded'), blanco: S('restrained') });
  assert.equal(r.ventaja && r.desventaja, true); assert.match(explicar(r), /se anulan/);
  assert.equal(explicar(ventajaAtaque({})), '');
});
test('3.46 · salvaciones de FUE y DES de Paralizado/Aturdido/Inconsciente/Petrificado fallan solas', () => {
  assert.match(avisoSalvacion(S('paralyzed'), 'dex'), /falla sola/);
  assert.equal(avisoSalvacion(S('paralyzed'), 'wis'), null);
  assert.equal(avisoSalvacion(S(), 'str'), null);
});
test('3.46 · distancia por casillas (5-5-5): pegados 5 ft, en diagonal 5 ft, uno de por medio 10 ft, grandes cuentan su borde', () => {
  const t = (x, y, w = 1) => ({ x, y, w, h: w });
  assert.equal(distanciaCasillas(t(0, 0), t(1, 0)), 5);
  assert.equal(distanciaCasillas(t(0, 0), t(1, 1)), 5);
  assert.equal(distanciaCasillas(t(0, 0), t(2, 0)), 10);
  assert.equal(distanciaCasillas(t(0, 0, 2), t(2, 0)), 5);
});
