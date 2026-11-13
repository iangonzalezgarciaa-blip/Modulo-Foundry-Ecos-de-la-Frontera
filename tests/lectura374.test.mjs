import test from 'node:test';
import assert from 'node:assert/strict';
import { readCatalog } from '../tools/catalog.mjs';
import { aspectoTexto, formaArea, formaAlcance } from '../scripts/verbe-reading.js';

const D = readCatalog();
const activas = D.tecnicas.filter(t => !t.retirada);

test('3.74 · cada técnica tiene su propio Aspecto', () => {
  const vistos = new Map();
  for (const t of activas) { const a = aspectoTexto(t); assert.ok(!vistos.has(a), `${t.id} repite el aspecto de ${vistos.get(a)}`); vistos.set(a, t.id); }
  assert.equal(formaArea('esfera 4,5 m'), 'Estalla en un círculo de 4,5 m de radio.');
  assert.equal(formaArea('cono 9 m'), 'Sale en abanico desde ti hasta 9 m.');
  assert.equal(formaAlcance('yo', 'ataque'), 'Sale de tu propio cuerpo, a quemarropa.');
  assert.equal(formaAlcance('yo', 'refuerzo'), 'Nace y se queda en tu cuerpo.');
  for (const t of activas.slice(0, 50)) assert.match(t.item.system.description.value, new RegExp(`Se la reconoce por lo que dice su nombre: «${t.n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}»`), t.id);
});

test('3.74 · ninguna dote se queda con una nota vaga de cómo se usa', () => {
  const vagas = /Beneficio de mesa: el DM lo confirma al concederla|integración específica indicada|Requisitos y beneficio registrados|Beneficios registrados; confirma|Actividad nativa, coste/;
  for (const d of D.dotes) {
    assert.ok(d.automatizacion, d.id);
    assert.doesNotMatch(d.automatizacion, vagas, d.id);
  }
  const cuenta = D.ajustes374.dotes;
  assert.ok(cuenta.auto > 50 && cuenta.mesa > 100 && cuenta.poder > 10);
});
