import test from 'node:test';
import assert from 'node:assert/strict';
import './helpers/foundry.mjs';
const E = await import('../scripts/estados-enlaces.js');
const O = await import('../scripts/info-oculta.js');
import { readCatalog } from '../tools/catalog.mjs';

test('3.61 · formas y patrón de los estados (con mayúscula y palabra entera)', () => {
  assert.deepEqual(E.formas('Derribado'), ['Derribado', 'Derribada', 'Derribados', 'Derribadas']);
  assert.deepEqual(E.formas('Grieta'), ['Grieta', 'Grietas']);
  assert.deepEqual(E.formas('Herida No Tratada'), ['Herida No Tratada']);
  const re = E.patronEstados(['Derribado', 'Grieta', 'Empapado']);
  const t = 'Queda Derribada y con dos Grietas; empapado no cuenta; Empapados sí. GrietaX no.';
  assert.deepEqual([...t.matchAll(re)].map(m => m[1]), ['Derribada', 'Grietas', 'Empapados']);
  const mapa = { prone: { n: 'Derribado' }, ecosGrieta: { n: 'Grieta' } };
  assert.equal(E.idDe('Derribadas', mapa), 'prone'); assert.equal(E.idDe('Grieta', mapa), 'ecosGrieta'); assert.equal(E.idDe('Nada', mapa), null);
});

test('3.61 · quien escucha ve PG y estados exactos a 30 ft', () => {
  assert.equal(O.lecturaSalud({ nombre: 'Bandido', hp: { value: 7, max: 22, temp: 0 }, estados: ['Envenenado'] }), 'Bandido · PG 7/22 · Envenenado');
  assert.equal(O.lecturaSalud({ nombre: 'Muro', hp: null }), 'Muro · PG: no tiene · sin estados');
  const a = { x: 0, y: 0, w: 100, h: 100 };
  assert.equal(O.alAlcance(a, { x: 600, y: 0, w: 100, h: 100 }), true);   // 5 casillas de hueco → 30 ft
  assert.equal(O.alAlcance(a, { x: 800, y: 0, w: 100, h: 100 }), false);
  const t = readCatalog().tecnicas.find(x => x.id === 'pulso-escuchar');
  assert.equal(t.item.effects[0].statuses[0], O.VER_SALUD); assert.equal(t.item.system.duration.units, 'minute'); assert.ok(t.cambios.length);
});
