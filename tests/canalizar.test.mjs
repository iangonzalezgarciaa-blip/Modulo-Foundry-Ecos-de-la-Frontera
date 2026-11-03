import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { MockActor, MockItem, resetEnvironment } from './helpers/foundry.mjs';
import { readCatalog } from '../tools/catalog.mjs';
import * as V from '../scripts/verbe.js';
import { cargaDe, bonoCarga, cdInterrupcion, CARGADAS } from '../scripts/verbe-canalizar.js';
const D = readCatalog();
const tec = id => D.tecnicas.find(t => t.id === id);
beforeEach(() => { resetEnvironment(); V.usarDatos(D, 'activo'); });
const actor = () => new MockActor(11, { valor: 60, nats: ['rayo', 'viento'], principal: 'cuerpo', rangos: { cuerpo: 3, forma: 3 } });
const agregar = (a, id) => { const i = new MockItem(V.datosItem(a, tec(id)), a); a.items.push(i); return i; };

test('reglas de carga: mínimo, máximo, bono por carga y CD de interrupción', () => {
  const c = cargaDe({ id: 'cuerpo-raikiri' });
  assert.deepEqual([c.min, c.max], [2, 3]);
  assert.deepEqual(bonoCarga(c, 2), { dados: 2, cd: 0, ataque: 2 });
  assert.deepEqual(bonoCarga(c, 9), { dados: 3, cd: 0, ataque: 3 });
  assert.equal(cdInterrupcion(8), 10); assert.equal(cdInterrupcion(31), 15);
  for (const id of Object.keys(CARGADAS)) assert.ok(tec(id), id);
});

test('una técnica cargada se canaliza, carga por turno, no deja reaccionar y se libera sin volver a pagar', async () => {
  const a = actor(); const item = agregar(a, 'cuerpo-chidori'); agregar(a, 'forma-sustitucion');
  assert.match(item.system.description.value, /Cargada\./);
  const antes = V.estado(a).valor;
  assert.equal(await V.canalizar(a, 'cuerpo-chidori'), true);
  assert.ok(V.estado(a).valor < antes);
  assert.ok(a.effects.some(e => e.statuses?.has?.('canalizando') || [...(e.statuses ?? [])].includes('canalizando')));
  a.statuses = new Set(['canalizando']);
  assert.equal(V.defensasDisponibles(a, { grado: 1 }).length, 0);
  await V._prueba.subirCarga(a);
  const meta = item.getFlag('ecos-frontera', 'verbe');
  await V.liberarCanalizada(a);
  assert.equal(V.estado(a).canalizada.carga, 1);
  assert.equal(V.costoUso(a, meta, meta.g), 0);
  assert.equal(a.effects.filter(e => e.flags?.['ecos-frontera']?.verbe?.canalizar).length, 0);
});

test('el daño rompe la carga si falla la salvación de Constitución', async () => {
  const a = actor(); agregar(a, 'cuerpo-raikiri');
  await V.canalizar(a, 'cuerpo-raikiri');
  a.rollSavingThrow = async () => [{ total: 4 }];
  await V._prueba.golpeCanalizando(a, 12);
  assert.equal(a.effects.filter(e => e.flags?.['ecos-frontera']?.verbe?.canalizar).length, 0);
  assert.equal(await V.liberarCanalizada(a), false);
});

test('3.4c: técnicas cargadas nuevas por naturaleza de Forma, por rama y de herencia', () => {
  const nuevas = D.tecnicas.filter(t => t.cargadaNueva);
  assert.equal(nuevas.length, 11);
  assert.deepEqual([...new Set(nuevas.filter(t => t.rama === 'forma').map(t => t.nat))].sort(), ['agua', 'fuego', 'rayo', 'tierra']);
  for (const t of nuevas) assert.ok(cargaDe(t.item.flags['ecos-frontera'].verbe), t.id);
  const ramas = new Set([...nuevas.map(t => t.rama), ...Object.keys(CARGADAS).map(id => tec(id).rama)]);
  for (const r of ['forma', 'cuerpo', 'hilo', 'quietud', 'vasija', 'umbral', 'velo', 'sello', 'pacto', 'pulso', 'rastro', 'sangre']) assert.ok(ramas.has(r), r);
});
