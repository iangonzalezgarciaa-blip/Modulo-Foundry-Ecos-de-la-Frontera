import test from 'node:test';
import assert from 'node:assert/strict';
import { readCatalog } from '../tools/catalog.mjs';
import { requisitoDote } from '../scripts/verbe-progression.js';
import { tipoDote, planDote } from '../scripts/verbe-entreno.js';

const D = readCatalog();
const estilos = D.dotes.filter(d => d.cat === 'estilos');

test('3.68 · cada rama (salvo Sangre) tiene estilo, estilo mayor y oficio, y todo copia algo de D&D', () => {
  assert.equal(estilos.length, 36); assert.equal(D.ajustes368.dotes, 36);
  assert.ok(D.categoriasDote.some(c => c.id === 'estilos'));
  for (const r of D.ramas.filter(r => r.id !== 'sangre')) {
    const de = estilos.filter(d => d.ramaEstilo === r.id);
    assert.equal(de.length, 3, r.id);
    for (const d of de) { assert.equal(tipoDote(d), 'entrenada', d.id); assert.match(d.automatizacion, /Equivale a «.+» de D&D\./, d.id); assert.ok(d.dnd, d.id); }
  }
  assert.equal(new Set(estilos.map(d => d.id)).size, 36);
  assert.equal(new Set(D.dotes.map(d => d.id)).size, D.dotes.length, 'sin ids repetidos');
});

test('3.68 · el estilo mayor pide el estilo, nivel 5 y rango Experto; el oficio y el estilo, rango Entrenado', () => {
  const est = D.dotes.find(d => d.id === 'estilo-quietud'), may = D.dotes.find(d => d.id === 'estilo-quietud-2');
  const ctx = (nivel, rango, dotes = []) => ({ nivel, estado: { rangos: { quietud: rango }, dotes } });
  assert.equal(requisitoDote(est.requisitos, ctx(1, 0)).ok, false);
  assert.equal(requisitoDote(est.requisitos, ctx(1, 1)).ok, true);
  assert.equal(requisitoDote(may.requisitos, ctx(5, 2)).ok, false, 'falta el estilo');
  assert.equal(requisitoDote(may.requisitos, ctx(4, 2, ['estilo-quietud'])).ok, false, 'falta nivel');
  assert.equal(requisitoDote(may.requisitos, ctx(5, 1, ['estilo-quietud'])).ok, false, 'falta Experto');
  assert.equal(requisitoDote(may.requisitos, ctx(5, 2, ['estilo-quietud'])).ok, true);
  assert.deepEqual(planDote(est.trazos), { unidad: 'horas', bloque: 4, exitos: 1, cd: 12 });
  assert.deepEqual(planDote(may.trazos), { unidad: 'horas', bloque: 4, exitos: 2, cd: 13 });
});

test('3.68 · los oficios con competencia la ponen en la hoja', () => {
  for (const [id, sk] of [['oficio-cuerpo', 'ath'], ['oficio-pulso', 'med'], ['oficio-quietud', 'nat'], ['oficio-rastro', 'sur']]) {
    const d = D.dotes.find(x => x.id === id);
    assert.deepEqual(d.efecto.ae, [[`system.skills.${sk}.value`, 4, '1']], id);
    assert.match(d.automatizacion, /^Automática: competencia/);
  }
});
