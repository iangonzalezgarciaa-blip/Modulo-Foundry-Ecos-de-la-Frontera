import test from 'node:test';
import assert from 'node:assert/strict';
import { readCatalog } from '../tools/catalog.mjs';
import { pideArma, manosQuePide, pidePreparacion, manosOcupadas, armasPara, caracteristicaArma, revisionUso, aplicarArma } from '../scripts/tecnica-arma.js';

const D = readCatalog();
const tec = id => D.tecnicas.find(t => t.id === id).item;
const arma = (nombre, extra = {}) => ({ type: 'weapon', name: nombre, system: { equipped: true, quantity: 1, type: { value: 'martialM' }, properties: [], magicalBonus: 0, ...extra } });
const escudo = { type: 'equipment', name: 'Escudo', system: { equipped: true, type: { value: 'shield' } } };

test('3.12: las técnicas que atacan como un arma lo piden; las de Verbe a distancia no', () => {
  const conArma = D.tecnicas.filter(t => pideArma(t.item));
  assert.ok(conArma.length >= 25, `${conArma.length} técnicas con arma`);
  assert.ok(conArma.every(t => ['cuerpo', 'hilo'].includes(t.rama)));
  assert.equal(pideArma(tec('fuego-brasa')), null);
  assert.equal(pideArma({ type: 'weapon', system: {} }), null, 'un arma normal no es una técnica');
});

test('manos: sellos con espada y escudo piden soltar algo; con una mano libre, no; Conjurador de guerra lo evita', () => {
  const sellos = D.tecnicas.find(t => !pideArma(t.item) && manosQuePide(t.item) === 1).item;
  assert.equal(manosOcupadas([arma('Espada'), escudo]), 2);
  assert.equal(revisionUso(sellos, [arma('Espada'), escudo]).faltanManos, 1);
  assert.equal(revisionUso(sellos, [arma('Espada')]).faltanManos, 0);
  assert.equal(revisionUso(sellos, [arma('Mandoble', { properties: ['two'] })]).faltanManos, 1);
  assert.equal(revisionUso(sellos, [arma('Espada'), escudo, { type: 'feat', name: 'Conjurador de guerra', system: {} }]).faltanManos, 0);
  assert.equal(manosQuePide(tec('cuerpo-dos-esferas')), 2);
});

test('elegir arma: cuerpo a cuerpo con el golpe sin armas; a distancia con arcos y arrojadizas', () => {
  const items = [arma('Espada'), arma('Arco', { type: { value: 'martialR' } }), arma('Daga', { type: { value: 'simpleM' }, properties: ['fin', 'thr'] }), { type: 'weapon', name: 'Golpe sin armas', system: { equipped: true, type: { value: 'natural' }, properties: [] } }];
  assert.deepEqual(armasPara(items, 'melee').map(i => i.name).sort(), ['Daga', 'Espada', 'Golpe sin armas']);
  assert.deepEqual(armasPara(items, 'ranged').map(i => i.name).sort(), ['Arco', 'Daga']);
  const ab = { str: { mod: 1 }, dex: { mod: 4 } };
  assert.equal(caracteristicaArma(items[1], ab), 'dex'); assert.equal(caracteristicaArma(items[2], ab), 'dex'); assert.equal(caracteristicaArma(items[0], ab), 'str');
});

test('el arma enlazada cambia la característica del ataque y suma su bono mágico al ataque y al daño', () => {
  const ab = { str: { mod: 3 }, dex: { mod: 1 } }, espada = arma('Espada +1', { magicalBonus: 1 });
  const at = aplicarArma({ rolls: [{ parts: ['@mod', '@prof'], data: { mod: 5 } }] }, espada, ab);
  assert.equal(at.rolls[0].data.mod, 3); assert.ok(at.rolls[0].parts.includes('@ecosArmaMagia')); assert.equal(at.rolls[0].data.ecosArmaMagia, 1);
  const dn = aplicarArma({ rolls: [{ parts: ['2d6'], data: {} }] }, espada, ab, { ataque: false });
  assert.equal(dn.rolls[0].data.mod, undefined); assert.deepEqual(dn.rolls[0].parts, ['2d6', '@ecosArmaMagia']);
});

test('preparación: solo las técnicas cuyo texto pide un turno o asalto de preparación', () => {
  assert.equal(pidePreparacion(tec('quietud-modo-sapo')), true);
  assert.equal(pidePreparacion(tec('fuego-brasa')), false);
  assert.equal(revisionUso(tec('quietud-modo-sapo'), [], { preparada: true }).preparar, false);
});
