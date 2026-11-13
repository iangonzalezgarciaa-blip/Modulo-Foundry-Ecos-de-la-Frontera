import test from 'node:test';
import assert from 'node:assert/strict';
import { readCatalog } from '../tools/catalog.mjs';
import { ESTILOS, bonoDano, dadosDobles, umbralCritico, transformado, claveTurno } from '../scripts/estilos-auto.js';
import { updateSumar } from '../scripts/deshacer.js';

const D = readCatalog();
const S = (...ids) => new Set(ids);

test('3.73 · los 24 estilos existen en el catálogo y dicen cómo se automatizan', () => {
  for (const id of Object.keys(ESTILOS)) {
    const d = D.dotes.find(x => x.id === id);
    assert.ok(d, id);
    assert.match(d.automatizacion, /^(Automática|Recordatorio|Reacción Verbe)/, id);
    assert.doesNotMatch(d.texto, /usar tu reacción/, `${id}: las reacciones de estilo gastan la Reacción Verbe`);
  }
  assert.equal(Object.keys(ESTILOS).length, 24);
});

test('3.73 · los números de cada estilo', () => {
  // Forma que estalla: + modificador una vez por turno.
  let r = bonoDano({ dotes: S('estilo-forma-2'), rama: 'forma', mod: 3 });
  assert.deepEqual(r.partes, ['3']); assert.deepEqual(r.usados, ['estilo-forma-2']);
  assert.deepEqual(bonoDano({ dotes: S('estilo-forma-2'), rama: 'forma', mod: 3, usados: S('estilo-forma-2') }).partes, [], 'ya lo gastó este turno');
  assert.deepEqual(bonoDano({ dotes: S('estilo-forma-2'), rama: 'velo', mod: 3 }).partes, [], 'solo su rama');
  // Manos que cierran: 2 + grado a la curación; Pulso que hiere al daño.
  assert.deepEqual(bonoDano({ dotes: S('estilo-pulso', 'estilo-pulso-2'), rama: 'pulso', grado: 3, curacion: true, mod: 4 }).partes, ['5']);
  assert.deepEqual(bonoDano({ dotes: S('estilo-pulso', 'estilo-pulso-2'), rama: 'pulso', grado: 3, mod: 4 }).partes, ['4']);
  // Mano de lanzador: Hilo o arma arrojadiza lanzada.
  assert.deepEqual(bonoDano({ dotes: S('estilo-hilo'), rama: 'hilo' }).partes, ['2']);
  assert.deepEqual(bonoDano({ dotes: S('estilo-hilo'), arrojadiza: true }).partes, ['2']);
  assert.deepEqual(bonoDano({ dotes: S('estilo-hilo') }).partes, []);
  // Golpe salvaje: dobla los dados de Cuerpo una vez por turno.
  r = bonoDano({ dotes: S('estilo-cuerpo-2'), rama: 'cuerpo' }); assert.equal(r.doblar, true);
  assert.equal(dadosDobles('2d6 + @mod'), '{2d6,2d6}kh + @mod');
  assert.equal(dadosDobles('d8 + 1d4[fire]'), '{1d8,1d8}kh + {1d4,1d4}kh[fire]');
  // Presa marcada: +1d6 al atacar a la presa; crítico con 19 con El punto débil.
  assert.deepEqual(bonoDano({ dotes: S('estilo-rastro'), ataque: true, presa: true }).partes, ['1d6']);
  assert.deepEqual(bonoDano({ dotes: S('estilo-rastro'), ataque: true, presa: false }).partes, []);
  assert.equal(umbralCritico({ dotes: S('estilo-rastro-2'), presa: true }), 19);
  assert.equal(umbralCritico({ dotes: S('estilo-rastro-2'), presa: false }), 20);
  assert.equal(umbralCritico({ dotes: S('estilo-rastro-2'), presa: true, actual: 18 }), 18, 'no empeora un crítico mejor');
  // Vasija: transformado con manto o avatar.
  assert.equal(transformado([{ grupoModo: 'manto' }]), true);
  assert.equal(transformado([{ grupoModo: 'guardia' }]), false);
  // Una vez por turno solo cuenta en combate.
  assert.equal(claveTurno(null), null);
  assert.equal(claveTurno({ started: true, id: 'c', round: 2, turn: 1 }), 'c:2:1');
});

test('3.73 · Deshacer devuelve Verbe aunque quede en negativo', () => {
  assert.deepEqual(updateSumar({ 'flags.ecos-frontera.verbe.valor': -3 }, { 'flags.ecos-frontera.verbe.valor': 1 }), { 'flags.ecos-frontera.verbe.valor': -2 });
  assert.equal(updateSumar({ 'system.attributes.hp.value': 2 }, { 'system.attributes.hp.value': -8 }, 30)['system.attributes.hp.value'], 0);
});
