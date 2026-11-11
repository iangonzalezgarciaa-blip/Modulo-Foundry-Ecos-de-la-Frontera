import test from 'node:test';
import assert from 'node:assert/strict';
import { agruparPorTiempo, dadosCaida, DANOS_INDIRECTOS, ACCIONES_BASICAS } from '../scripts/accion-estandar.js';
import { bonosDeClase, planAcciones } from '../scripts/acciones-comunes.js';
import './helpers/foundry.mjs';
const { volumenEfectivo } = await import('../scripts/mesa-musica.js');

test('3.36 · la Acción estándar separa Acción, Adicional y Reacción', () => {
  const g = agruparPorTiempo([{ nombre: 'Espada', tipo: 'action' }, { nombre: 'Segunda arma', tipo: 'bonus' }, { nombre: 'Escudo', tipo: 'reaction' }, { nombre: 'Arco', tipo: 'action' }]);
  assert.deepEqual(g.action.map(x => x.nombre), ['Arco', 'Espada']); assert.equal(g.bonus.length, 1); assert.equal(g.reaction.length, 1);
  assert.ok(ACCIONES_BASICAS.find(a => a.id === 'correr').auto && ACCIONES_BASICAS.find(a => a.id === 'oportunidad').tipo === 'reaction');
});
test('3.36 · caída: 1d6 cada 10 ft hasta 20d6; los indirectos tienen texto', () => {
  assert.equal(dadosCaida(5), 0); assert.equal(dadosCaida(30), 3); assert.equal(dadosCaida(500), 20);
  for (const d of Object.values(DANOS_INDIRECTOS)) assert.ok(d.n && d.texto);
});
test('3.36 · las clases no pierden: lo que ya hacen les da +2 a la CD y se rehace al cambiar', () => {
  const b = bonosDeClase([{ type: 'feat', name: 'Maestro del escudo' }, { type: 'feat', name: 'Acción astuta' }]);
  assert.equal(b.derribar.cd, 2); assert.equal(b.apartar.cd, 2); assert.equal(b.birlar.cd, 2); assert.equal(b.presa, undefined);
  const items = [{ type: 'feat', name: 'Maestro del escudo' }];
  const { crear } = planAcciones(items, {});
  const fue = crear.find(i => i.flags?.['ecos-frontera']?.accionComun?.id === 'str');
  const der = Object.values(fue.system.activities).find(a => a.name === 'Empujón: derribar');
  assert.match(der.save.dc.formula, /\+ 2$/); assert.match(der.description.chatFlavor, /Tu clase ya lo hace/);
  const ya = crear.map(c => ({ ...c, _id: 'x' + c.flags['ecos-frontera'].accionComun.id }));
  assert.equal(planAcciones([...items, ...ya], {}).actualizar.length, 0, 'sin cambios no se rehace');
  assert.ok(planAcciones([{ type: 'feat', name: 'Luchador' }, ...ya], {}).actualizar.length >= 1, 'un rasgo nuevo lo rehace');
});
test('3.36 · el volumen del DM vale para todos: mesa × el tuyo', () => {
  assert.equal(volumenEfectivo(100, 50), 50); assert.equal(volumenEfectivo(50, 50), 25); assert.equal(volumenEfectivo(0, 80), 0);
});
