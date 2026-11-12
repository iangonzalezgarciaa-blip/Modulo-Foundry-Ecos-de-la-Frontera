import test from 'node:test';
import assert from 'node:assert/strict';
import './helpers/foundry.mjs';
const V = await import('../scripts/venenos.js');
const T = await import('../scripts/taller.js');

test('3.55 · grados de la salvación: por 10, y el 20/1 natural mueve un grado', () => {
  assert.equal(V.gradoSalvacion(25, 15), 'critico');
  assert.equal(V.gradoSalvacion(15, 15), 'exito');
  assert.equal(V.gradoSalvacion(14, 15), 'fallo');
  assert.equal(V.gradoSalvacion(5, 15), 'pifia');
  assert.equal(V.gradoSalvacion(14, 15, 20), 'exito');
  assert.equal(V.gradoSalvacion(16, 15, 1), 'fallo');
});

test('3.55 · etapas: exposición, intervalo y otra dosis', () => {
  assert.equal(V.etapaInicial('exito'), 0); assert.equal(V.etapaInicial('fallo'), 1); assert.equal(V.etapaInicial('pifia'), 2);
  assert.equal(V.etapaSiguiente(2, 'exito', 3), 1);
  assert.equal(V.etapaSiguiente(2, 'critico', 3), 0);
  assert.equal(V.etapaSiguiente(2, 'pifia', 3), 3);
  assert.equal(V.etapaSiguiente(3, 'fallo', 3), 3);
  assert.equal(V.etapaRepetida(1, 'exito', 3), 1);
  assert.equal(V.etapaRepetida(1, 'fallo', 3), 2);
  assert.equal(V.etapaRepetida(2, 'pifia', 3), 3);
});

test('3.55 · duraciones e intervalos', () => {
  assert.equal(V.segundos({ n: '1', u: 'round' }), 6);
  assert.equal(V.segundos({ n: '10', u: 'minute' }), 600);
  assert.equal(V.segundos({ n: '1d4', u: 'hour' }), 3 * 3600);
  assert.equal(V.segundos({ n: '1d4', u: 'hour' }, () => 1), 3600);
  assert.equal(V.segundos(null), null);
  assert.equal(V.textoDuracion({ n: '2', u: 'day' }), '2 días');
  const v = { cd: 15, etapas: [{ n: 1 }, { n: 2 }] };
  assert.equal(V.automatizable(v), true); assert.equal(V.etapaDe(v, 5).n, 2);
  assert.equal(V.automatizable({ cd: 14, etapas: [] }), false);
});

test('3.55 · el veneno sale de las banderas del objeto convertido', () => {
  const item = { id: 'x', name: 'Dram nocaut', img: 'i', flags: { 'ecos-frontera': { pf2e: { id: 'p', veneno: { cd: 15, inicio: { n: '1', u: 'minute' }, duracionMax: { n: '10', u: 'hour' },
    etapas: [{ n: 1, texto: 'caes Inconsciente', estados: ['unconscious'], dano: [] }, { n: 2, texto: 'duermes', estados: [], dano: [] }] } } } } };
  const v = V.venenoDeObjeto(item);
  assert.equal(v.cd, 15); assert.equal(v.max, 2); assert.equal(v.id, 'p'); assert.equal(v.inicio.u, 'minute');
  assert.equal(V.venenoDeObjeto({ flags: {} }), null);
});

test('3.55 · taller: herramientas, CD, días y materiales', () => {
  assert.deepEqual(T.herramientasPara({ type: 'consumable', system: { type: { value: 'poison' } } }), ['pois', 'alchemist']);
  assert.deepEqual(T.herramientasPara({ type: 'consumable', system: { type: { value: 'potion' } } }), ['alchemist', 'herb']);
  assert.deepEqual(T.herramientasPara({ type: 'weapon', name: 'Arco largo', system: {} }), ['woodcarver', 'carpenter']);
  assert.deepEqual(T.herramientasPara({ type: 'weapon', name: 'Espada larga', system: {} }), ['smith']);
  assert.deepEqual(T.herramientasPara({ type: 'equipment', name: 'Armadura de cuero', system: { type: { value: 'light' } } }), ['leatherworker']);
  assert.equal(T.cdFabricar({ nivel: 7 }), 16);
  assert.equal(T.cdFabricar({ rareza: 'rare' }), 18);
  assert.equal(T.cdFabricar({ precio: 15 }), 12);
  assert.deepEqual(T.planFabricar({ precio: 15 }), { dias: 2, coste: 7.5, cd: 12, magico: false });
  assert.equal(T.planFabricar({ precio: 1500 }).dias, 150);
  const pocion = T.planFabricar({ precio: 0, rareza: 'uncommon', consumible: true });
  assert.equal(pocion.dias, 5); assert.equal(pocion.coste, 100); assert.equal(pocion.magico, true);
  assert.equal(T.planFabricar({ precio: 700, rareza: 'rare', consumible: true, nivel: 7 }).coste, 350);
});

test('3.55 · la tirada cambia los días (la mitad, igual o el doble) y los ayudantes los reparten', () => {
  assert.equal(T.diasSegunGrado(10, 'critico'), 5);
  assert.equal(T.diasSegunGrado(10, 'exito'), 10);
  assert.equal(T.diasSegunGrado(10, 'fallo'), 20);
  assert.equal(T.diasSegunGrado(10, 'pifia'), 20);
  assert.equal(T.diasSegunGrado(10, 'exito', 1), 5);
  assert.equal(T.diasSegunGrado(1, 'critico'), 1);
  assert.equal(T.gradoTirada(9, 10, 20), 'exito');
});

test('3.55 · la guía explica taller y venenos, y cómo revertir', () => {
  const g = T.guiaTallerHTML();
  for (const t of ['Taller', 'herramienta', 'Materiales', 'etapa', 'Deshacer daño', 'Cancelar']) assert.ok(g.includes(t), t);
});
