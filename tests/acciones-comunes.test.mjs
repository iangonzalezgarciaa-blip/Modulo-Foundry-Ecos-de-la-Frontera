import test from 'node:test';
import assert from 'node:assert/strict';
import { ACCIONES, ACCIONES_PLANAS, datosRasgosComunes, datosGolpe, planAcciones, dadoDeClase, tieneGolpePropio, guiaAccionesHTML, idEstable, VERSION_ACCIONES } from '../scripts/acciones-comunes.js';

test('3.12: seis rasgos, uno por característica, con todas las acciones pedidas', () => {
  assert.deepEqual(ACCIONES.map(g => g.car), ['str', 'dex', 'con', 'int', 'wis', 'cha']);
  const ids = ACCIONES_PLANAS.map(a => a.id);
  for (const id of ['presa', 'derribar', 'apartar', 'zancadilla', 'desarmar', 'esquivar', 'fintar', 'intimidar', 'evaluar', 'planear', 'distraer', 'aguantar'])
    assert.ok(ids.includes(id), id);
  assert.equal(new Set(ids).size, ids.length, 'sin repetidas');
});

test('cada actividad es válida para dnd5e: salvación con CD de quien actúa, prueba con pericia, efectos enlazados', () => {
  const rasgos = datosRasgosComunes(), vistos = new Set();
  for (const r of rasgos) {
    assert.equal(r.type, 'feat');
    const efectos = new Set(r.effects.map(e => e._id));
    for (const act of Object.values(r.system.activities)) {
      assert.match(act._id, /^[A-Za-z0-9]{16}$/); assert.ok(!vistos.has(act._id)); vistos.add(act._id);
      assert.ok(['action', 'bonus', 'reaction', 'special'].includes(act.activation.type));
      if (act.type === 'save') { assert.ok(act.save.ability.length); assert.ok(act.save.dc.calculation || act.save.dc.formula); }
      if (act.type === 'check') assert.ok(act.check.ability || act.check.associated.length);
      for (const e of act.effects) assert.ok(efectos.has(e._id), `${act.name}: efecto enlazado`);
    }
    for (const e of r.effects) { assert.match(e._id, /^[A-Za-z0-9]{16}$/); assert.equal(e.transfer, false); }
  }
  const presa = rasgos[0].system.activities[idEstable('ecos-accion-str-presa')];
  assert.deepEqual(presa.save.ability, ['str', 'dex']); assert.equal(presa.save.dc.calculation, 'str');
  assert.deepEqual(rasgos[0].effects.find(e => e._id === presa.effects[0]._id).statuses, ['grappled']);
});

test('el golpe sin armas respeta la clase: dado de monje o pugilista, y no se duplica si ya hay uno', () => {
  assert.equal(datosGolpe().system.damage.base.custom.formula, '1');
  assert.equal(dadoDeClase({ scale: { monk: { 'martial-arts': { die: '1d6' } } } }), '@scale.monk.martial-arts');
  assert.equal(dadoDeClase({ scale: { pugilist: { fisticuffs: '1d8' } } }), '@scale.pugilist.fisticuffs');
  assert.equal(dadoDeClase({ scale: { fighter: { 'second-wind': 1 } } }), null);
  const monje = planAcciones([], { scale: { monk: { 'martial-arts': {} } } }).crear[0];
  assert.equal(monje.system.damage.base.custom.formula, '@scale.monk.martial-arts'); assert.deepEqual(monje.system.properties, ['fin']);
  assert.equal(tieneGolpePropio([{ type: 'weapon', name: 'Unarmed Strike', system: {} }]), true);
  assert.equal(planAcciones([{ type: 'weapon', name: 'Golpe sin armas', system: { identifier: 'unarmed-strike' } }], {}).crear.some(d => d.type === 'weapon'), false);
});

test('una hoja que ya las tiene no recibe nada; una versión vieja se rehace', () => {
  const todas = planAcciones([], {}).crear;
  assert.equal(todas.length, 7);
  const ya = todas.map((d, i) => ({ ...d, _id: 'id' + i }));
  assert.deepEqual(planAcciones(ya, {}), { crear: [], actualizar: [] });
  const vieja = ya.map(d => ({ ...d, flags: { 'ecos-frontera': { accionComun: { ...d.flags['ecos-frontera'].accionComun, v: VERSION_ACCIONES - 1 } } } }));
  assert.equal(planAcciones(vieja, {}).actualizar.length, 7);
});

test('la guía para todos nombra cada acción y no tiene restos', () => {
  const html = guiaAccionesHTML();
  for (const a of ACCIONES_PLANAS.filter(a => a.id !== 'plan')) assert.ok(html.includes(a.nombre), a.nombre);
  assert.doesNotMatch(html, /undefined|NaN|\[object/);
  assert.match(html, /8 \+ tu total en la habilidad de la acción/);
  assert.match(html, /regla base del Manual: Presa/);
});

test('3.14: lo que ya es de D&D se resuelve como en el Manual y lo de Ecos usa la pericia', () => {
  const por = id => ACCIONES_PLANAS.find(a => a.id === id);
  assert.equal(por('presa').cd, 'str'); assert.equal(por('presa').base, 'Presa (Golpe sin armas)');
  assert.match(por('apartar').texto, /Apartas 1,5 m/); assert.doesNotMatch(por('apartar').texto, /3 m/);
  assert.deepEqual(por('fintar').cdPericia, ['dec']); assert.deepEqual(por('birlar').cdPericia, ['slt']);
  assert.deepEqual(por('desarmar').cdPericia, ['ath', 'acr']);
  const rasgos = datosRasgosComunes();
  const act = (car, nombre) => Object.values(rasgos.find(r => r.flags['ecos-frontera'].accionComun.id === car).system.activities).find(a => a.name === nombre);
  assert.equal(act('cha', 'Fintar').save.dc.formula, '8 + @skills.dec.total');
  assert.equal(act('dex', 'Desarmar').save.dc.formula, '8 + max(@skills.ath.total, @skills.acr.total)');
  assert.equal(act('str', 'Presa').save.dc.calculation, 'str');
  // Ponerse a cubierto mejora la cobertura del Manual un paso; no la repite.
  const cub = rasgos.find(r => r.flags['ecos-frontera'].accionComun.id === 'dex').effects.find(e => e.name === 'A cubierto');
  assert.deepEqual(cub.statuses, ['coverThreeQuarters']);
});
