import test from 'node:test';
import assert from 'node:assert/strict';
import { readCatalog } from '../tools/catalog.mjs';
import { nivelFama, puntosProeza, NIVELES_FAMA } from '../scripts/fama.js';
const D = readCatalog();
test('3.38 · fama: niveles y proezas (sin testigos vale la mitad)', () => {
  assert.equal(nivelFama(0).nombre, 'Desconocido'); assert.equal(nivelFama(6).nombre, 'Conocido en el valle'); assert.equal(nivelFama(99).nombre, 'Leyenda');
  assert.equal(puntosProeza('enorme'), 4); assert.equal(puntosProeza('enorme', false), 2); assert.equal(puntosProeza('pequena', false), 0);
  assert.equal(NIVELES_FAMA.length, 5);
});
test('3.38 · las dotes que hablan del Control lo explican y las automáticas lo dicen', () => {
  for (const d of D.dotes.filter(d => /\bControl\b/.test(d.texto))) assert.match(d.texto, /El Control del Verbe es/, d.id);
  assert.match(D.dotes.find(d => d.id === 'reserva-profunda').automatizacion, /^Automática/);
  for (const n of ['fuego', 'agua', 'viento', 'tierra', 'rayo']) assert.equal(D.dotes.find(d => d.id === `corazon-${n}`).requisitos.naturaleza, n);
});
