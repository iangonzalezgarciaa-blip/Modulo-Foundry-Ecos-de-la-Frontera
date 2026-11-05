import test from 'node:test';
import assert from 'node:assert/strict';
import * as D from '../scripts/sistema/dnd5e.js';
import * as P from '../scripts/sistema/pf2e.js';
import { elegir, sistema } from '../scripts/sistema/index.js';

const pj5 = { system: { attributes: { hp: { value: 12, max: 30, temp: 3 }, ac: { value: 15 }, exhaustion: 2, movement: { speeds: { walk: 9 }, units: 'm' } },
  details: { level: 4 }, currency: { soul: 5 }, traits: { dr: { value: ['fire'] }, dv: { value: [] }, di: { value: ['poison'] } } } };
const pnj5 = { system: { attributes: { hp: { value: 7, max: 7 }, movement: { walk: 30, units: 'ft' } }, details: { cr: 0.5 } } };

test('5.2c · dnd5e: la capa lee la ficha igual que antes', () => {
  assert.deepEqual(D.pg(pj5), { valor: 12, max: 30, maxEfectivo: 30, temp: 3, hay: true });
  assert.equal(D.pg({ system: { attributes: { hp: { value: 5, max: 20, effectiveMax: 15 } } } }).maxEfectivo, 15);
  assert.equal(D.pg({ system: { attributes: {} } }).hay, false);
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

test('5.2c · verbe.js: PG, Control, competencia, nivel y rutas pasan por la capa igual que antes', () => {
  assert.deepEqual(D.datosPg(-3), { 'system.attributes.hp.value': 0 });
  assert.deepEqual(D.datosPg(8, { max: 8, temp: 0 }), { 'system.attributes.hp.value': 8, 'system.attributes.hp.max': 8, 'system.attributes.hp.temp': 0 });
  assert.deepEqual(D.datosCaFija(14), { 'system.attributes.ac.calc': 'flat', 'system.attributes.ac.flat': 14 });
  assert.deepEqual(D.datosControl({ rango: 3 }), { 'system.skills.cvb.value': 2 });
  assert.deepEqual(D.datosControl({ rango: 0, bono: 0 }), { 'system.skills.cvb.value': 0, 'system.skills.cvb.bonuses.check': '' });
  assert.deepEqual(D.datosControl({ bono: 3 }), { 'system.skills.cvb.bonuses.check': '+ 3' });
  assert.equal(D.control({ system: { skills: { cvb: { value: 1 } } } }), 1); assert.equal(D.control({}), 0);
  assert.equal(D.competencia({ system: { attributes: { prof: 3 } } }), 3); assert.equal(D.competencia({}), 0);
  assert.equal(D.vd(pnj5), 0.5); assert.equal(D.vd({}), 0);
  assert.equal(D.mod({ system: { abilities: { wis: { mod: 2 } } } }, 'wis'), 2);
  assert.equal(D.caracteristicaConjuros({ system: { attributes: { spellcasting: 'int' } } }), 'int'); assert.equal(D.caracteristicaConjuros({}), null);
  assert.deepEqual(D.RUTAS, { pg: 'system.attributes.hp.value', nivel: 'system.details.level', moneda: 'system.currency.soul', caracteristicas: 'system.abilities', agotamiento: 'system.attributes.exhaustion' });
  assert.equal(D.agotamientoMax(), 6); assert.equal(D.totalHabilidad({ system: { skills: { med: { total: 5, mod: 2 } } } }, 'med'), 5); assert.equal(D.totalHabilidad({}, 'med'), 0);
  assert.equal(P.RUTAS.agotamiento, null); assert.equal(P.agotamientoMax(), 6); assert.deepEqual(Object.keys(D.RUTAS).sort(), Object.keys(P.RUTAS).sort());
  // PF2e: lo mismo con sus rutas; el Control del Verbe (Saber del Verbe) llega con 5.2d.
  assert.equal(P.RUTAS.moneda, 'system.resources.heroPoints.value'); assert.equal(P.competencia({}), 0);
  assert.equal(P.caracteristicaConjuros({ items: [{ type: 'spellcastingEntry', system: { ability: { value: 'cha' } } }] }), 'cha');
  assert.throws(() => P.control({}), /5\.2d/); assert.throws(() => P.curar({}, 3), /5\.2d/);
  // Las dos capas exponen las mismas funciones, para que ningún archivo dependa de una sola.
  assert.deepEqual(Object.keys(D).sort(), Object.keys(P).sort());
});

test('5.2c · PG temporales y Percepción pasiva (Mesa y azar)', () => {
  assert.deepEqual(D.datosPgTemp(4.7), { 'system.attributes.hp.temp': 4 }); assert.deepEqual(D.datosPgTemp(-1), { 'system.attributes.hp.temp': 0 });
  assert.equal(D.percepcionPasiva({ system: { skills: { prc: { passive: 14 } } } }), 14); assert.equal(D.percepcionPasiva({}), null);
  assert.equal(P.percepcionPasiva({ system: { perception: { mod: 7 } } }), 17); assert.equal(P.percepcionPasiva({}), null);
  assert.deepEqual(P.datosPgTemp(3), { 'system.attributes.hp.temp': 3 });
});

test('5.2c · salvaciones y CD de característica en los dos sistemas', () => {
  const a = { system: { abilities: { con: { mod: 2, save: { value: 5 } }, int: { mod: 3 } }, attributes: { prof: 2, hp: { value: 0 } } } };
  assert.equal(D.bonoSalvacion(a, 'con'), 5); assert.equal(D.bonoSalvacion(a, 'int'), 3);
  assert.equal(D.cdCaracteristica(a, 'int'), 13); assert.equal(D.caido(a), true);
  const p = { system: { abilities: { int: { mod: 4 }, con: { mod: 1 } }, saves: { fortitude: { totalModifier: 9 } }, details: { level: { value: 5 } }, attributes: { hp: { value: 3 } } } };
  assert.equal(P.bonoSalvacion(p, 'con'), 9); assert.equal(P.bonoSalvacion(p, 'int'), 4);
  assert.equal(P.cdCaracteristica(p, 'int'), 21); assert.equal(P.caido(p), false);
});
