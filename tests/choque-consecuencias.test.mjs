import test from 'node:test';
import assert from 'node:assert/strict';
import { consecuenciasChoque, textoConsecuencias, TERRENO_CHOQUE } from '../scripts/choque-consecuencias.js';
import { elementoTerreno } from '../scripts/combate-tactico.js';

test('3.29 · un choque chico no deja nada; uno grande estalla, marca el terreno y rebota en quien pierde por mucho', () => {
  assert.deepEqual(consecuenciasChoque({ ga: 1, gb: 1, gana: 1 }), { explosion: null, terreno: null, contragolpe: null });
  const c = consecuenciasChoque({ ga: 6, gb: 2, gana: 1, natA: 'fuego', natB: 'viento', ciclo: 1 });
  assert.deepEqual(c.explosion, { radioPies: 15, dados: '4d6', tipo: 'fire', cd: 16 });
  assert.equal(c.terreno.nombre, TERRENO_CHOQUE.fuego.nombre);
  assert.deepEqual(c.contragolpe, { quien: 'B', dados: '6d6', mano: true }, 'pierde por 6 (4 de grado + 2 del elemento): la mano revienta');
  const e = consecuenciasChoque({ ga: 5, gb: 5, gana: 0, natA: 'rayo', natB: null });
  assert.equal(e.contragolpe.quien, 'ambos'); assert.equal(e.contragolpe.dados, '2d6'); assert.equal(e.explosion.tipo, 'lightning');
  assert.equal(consecuenciasChoque({ ga: 20, gb: 20, gana: 0 }).explosion.radioPies, 30, 'nunca más de 30 ft');
  assert.ok(textoConsecuencias(c).length === 3);
});

test('3.29 · el terreno que deja un choque lo reconoce «Aprovechar el terreno»', () => {
  assert.equal(elementoTerreno(TERRENO_CHOQUE.fuego.nombre).nombre, 'Lámpara o fuego');
  assert.equal(elementoTerreno(TERRENO_CHOQUE.agua.nombre).nombre, 'Agua');
  assert.equal(elementoTerreno(TERRENO_CHOQUE.tierra.nombre).nombre, 'Derrumbe');
  assert.equal(elementoTerreno(TERRENO_CHOQUE.viento.nombre).nombre, 'Humo o polvo');
  assert.equal(elementoTerreno(TERRENO_CHOQUE.rayo.nombre).nombre, 'Chispas');
  assert.equal(elementoTerreno(TERRENO_CHOQUE.nada.nombre).nombre, 'Derrumbe');
});
