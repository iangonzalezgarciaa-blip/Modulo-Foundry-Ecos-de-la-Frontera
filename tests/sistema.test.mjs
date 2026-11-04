import test from 'node:test';
import assert from 'node:assert/strict';
import * as D from '../scripts/sistema/dnd5e.js';
import * as P from '../scripts/sistema/pf2e.js';
import { elegir, sistema } from '../scripts/sistema/index.js';

const pj5 = { system: { attributes: { hp: { value: 12, max: 30, temp: 3 }, ac: { value: 15 }, exhaustion: 2, movement: { speeds: { walk: 9 }, units: 'm' } },
  details: { level: 4 }, currency: { soul: 5 }, traits: { dr: { value: ['fire'] }, dv: { value: [] }, di: { value: ['poison'] } } } };
const pnj5 = { system: { attributes: { hp: { value: 7, max: 7 }, movement: { walk: 30, units: 'ft' } }, details: { cr: 0.5 } } };

test('5.2c · dnd5e: la capa lee la ficha igual que antes', () => {
  assert.deepEqual(D.pg(pj5), { valor: 12, max: 30, temp: 3 });
  assert.equal(D.nivel(pj5), 4); assert.equal(D.nivel(pnj5), 1); assert.equal(D.nivel({ system: { details: { cr: 3 } } }), 3);
  assert.equal(D.ca(pj5), 15);
  assert.deepEqual(D.velocidad(pj5), { pie: 9, pies: false }); assert.deepEqual(D.velocidad(pnj5), { pie: 30, pies: true });
  const r = D.resistencias(pj5); assert.ok(r.resiste.has('fire')); assert.ok(r.inmune.has('poison')); assert.equal(r.vulnerable.size, 0);
  assert.equal(D.moneda(pj5), 5); assert.deepEqual(D.datosMoneda(-2), { 'system.currency.soul': 0 }); assert.deepEqual(D.datosMoneda(7.9), { 'system.currency.soul': 7 });
  assert.equal(D.agotamiento(pj5), 2); assert.deepEqual(D.datosAgotamiento(9), { 'system.attributes.exhaustion': 6 });
  assert.equal(D.gradoDeExito(15, 15), 'exito'); assert.equal(D.gradoDeExito(14, 15), 'fallo'); assert.equal(D.gradoDeExito(5, 15, 20), 'critico');
});

test('5.2d · PF2e: lecturas con las decisiones del autor; lo que falta avisa', () => {
  const pj = { system: { attributes: { hp: { value: 20, max: 25, temp: 0 }, ac: { value: 18 }, speed: { value: 25 },
    resistances: [{ type: 'fire', value: 5 }], weaknesses: [], immunities: [{ type: 'poison' }] }, details: { level: { value: 3 } }, resources: { heroPoints: { value: 2 } } },
    items: [{ type: 'condition', system: { slug: 'fatigued' } }, { type: 'condition', system: { slug: 'drained', value: { value: 2 } } }] };
  assert.equal(P.nivel(pj), 3); assert.equal(P.ca(pj), 18); assert.deepEqual(P.velocidad(pj), { pie: 25, pies: true });
  assert.ok(P.resistencias(pj).resiste.has('fire')); assert.ok(P.resistencias(pj).inmune.has('poison'));
  assert.equal(P.moneda(pj), 2); assert.deepEqual(P.datosMoneda(5), { 'system.resources.heroPoints.value': 3 });
  assert.equal(P.agotamiento(pj), 3); assert.equal(P.agotamiento({ items: [] }), 0);
  assert.equal(P.gradoDeExito(25, 15), 'critico'); assert.equal(P.gradoDeExito(15, 15), 'exito'); assert.equal(P.gradoDeExito(14, 15), 'fallo'); assert.equal(P.gradoDeExito(5, 15), 'falloCritico');
  assert.equal(P.gradoDeExito(14, 15, 20), 'exito'); assert.equal(P.gradoDeExito(15, 15, 1), 'fallo');
  assert.equal(P.tieneEstado(pj, 'fatigued'), true);
  assert.throws(() => P.tirarHabilidad(pj, 'med'), /5\.2d/);
});

test('la capa elige el sistema del mundo y, sin Foundry, usa dnd5e', () => {
  assert.equal(elegir('pf2e').id, 'pf2e'); assert.equal(elegir('otro').id, 'dnd5e');
  const antes = globalThis.game; try { globalThis.game = { ...(antes ?? {}), system: { id: 'pf2e' } }; assert.equal(sistema.id, 'pf2e'); }
  finally { globalThis.game = antes; }
  assert.equal(sistema.moneda(pj5), 5);
});

test('5.2c · salvaciones y CD de característica en los dos sistemas', () => {
  const a = { system: { abilities: { con: { mod: 2, save: { value: 5 } }, int: { mod: 3 } }, attributes: { prof: 2, hp: { value: 0 } } } };
  assert.equal(D.bonoSalvacion(a, 'con'), 5); assert.equal(D.bonoSalvacion(a, 'int'), 3);
  assert.equal(D.cdCaracteristica(a, 'int'), 13); assert.equal(D.caido(a), true);
  const p = { system: { abilities: { int: { mod: 4 }, con: { mod: 1 } }, saves: { fortitude: { totalModifier: 9 } }, details: { level: { value: 5 } }, attributes: { hp: { value: 3 } } } };
  assert.equal(P.bonoSalvacion(p, 'con'), 9); assert.equal(P.bonoSalvacion(p, 'int'), 4);
  assert.equal(P.cdCaracteristica(p, 'int'), 21); assert.equal(P.caido(p), false);
});
