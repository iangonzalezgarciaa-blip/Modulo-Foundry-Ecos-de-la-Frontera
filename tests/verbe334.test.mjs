import test from 'node:test';
import assert from 'node:assert/strict';
import { readCatalog } from '../tools/catalog.mjs';
import './helpers/foundry.mjs';
import { textoForzarse, alcanceSustitucion, piesEscape, pruebaEscape, usaManos } from '../scripts/verbe-334.js';
const D = readCatalog();

test('3.34 · forzarse explica la CD, el Agotamiento y cómo recuperarse', () => {
  const t = textoForzarse({ nombre: 'Golpe hondo', valor: 1, despues: -2, limite: -6, grado: 2, agotamiento: 1, recDia: 4 });
  assert.match(t.pregunta, /quedan <b>1<\/b>.*<b>-2<\/b>.*límite es -6/);
  assert.match(t.riesgo, /CD 12/); assert.match(t.riesgo, /irías a 2/);
  assert.match(t.recuperar, /mitad de la deuda/); assert.match(t.recuperar, /unos 4/);
});
test('3.34 · Sustitución: adyacente, +5 ft por mejora, 30 ft con Sustitución lejana; escapes crecen con el grado', () => {
  assert.equal(alcanceSustitucion(), 5); assert.equal(alcanceSustitucion({ mejoras: 2 }), 15); assert.equal(alcanceSustitucion({ lejana: true }), 30);
  assert.equal(piesEscape(1), 10); assert.equal(piesEscape(3), 20);
  assert.equal(pruebaEscape('velo'), 'arc'); assert.equal(pruebaEscape('cuerpo'), 'prc');
});
test('3.34 · lo de D&D que usa las manos se reconoce; las técnicas del Verbe no', () => {
  assert.equal(usaManos({ type: 'attack', item: { type: 'weapon', flags: {} } }), true);
  assert.equal(usaManos({ type: 'utility', item: { type: 'spell', flags: {}, system: { properties: new Set(['somatic']) } } }), true);
  assert.equal(usaManos({ type: 'utility', item: { type: 'spell', flags: {}, system: { properties: new Set(['vocal']) } } }), false);
  assert.equal(usaManos({ type: 'attack', item: { type: 'spell', flags: { 'ecos-frontera': { verbe: { id: 'x' } } } } }), false);
});
test('3.34 · catálogo: un escape por rama, la Moneda al Verbe es innata, lo que daña cuesta y Sombra bajo el salto no gasta movimiento', () => {
  for (const r of D.ramas) assert.ok(D.tecnicas.find(t => t.id === `${r.id}-escape` && t.item.flags['ecos-frontera'].verbe.escape), r.id);
  assert.ok(D.innatos.includes('moneda-al-verbe'));
  assert.equal(D.dotes.find(d => d.id === 'moneda-al-verbe').trazos, 0);
  assert.match(D.tecnicas.find(t => t.id === 'cuerpo-sombra-danzante').texto, /no gasta tu movimiento/);
});
