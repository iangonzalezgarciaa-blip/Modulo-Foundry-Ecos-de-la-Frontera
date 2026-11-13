import test from 'node:test';
import assert from 'node:assert/strict';
import { datosTarjeta, tarjetaHTML, tarjetaBasica, ACCIONES_BASICAS, htmlAcciones } from '../scripts/accion-estandar.js';
import { ACCIONES_PLANAS } from '../scripts/acciones-comunes.js';

const mapa = o => ({ get: k => o[k], values: () => Object.values(o)[Symbol.iterator](), size: Object.keys(o).length });

test('3.76 · la tarjeta de una acción de cualquiera habla solo de esa acción', () => {
  const def = ACCIONES_PLANAS.find(a => a.nombre === 'Arengar') ?? ACCIONES_PLANAS.find(a => a.grupo === 'cha' && a.tipo !== 'check');
  const item = { type: 'feat', flags: { 'ecos-frontera': { accionComun: true } }, system: { description: { value: '<p>Lo que cualquiera puede intentar con su Carisma. Las que ya están…</p>' } }, effects: mapa({}) };
  const act = { name: def.nombre, type: def.tipo === 'heal' ? 'heal' : def.tipo, activation: { type: def.act }, description: { chatFlavor: def.texto }, save: { ability: new Set(def.salv ?? []), dc: { value: 13 } }, healing: { custom: { formula: def.temp ?? '' } }, effects: [] };
  const d = datosTarjeta({}, item, act, `Acciones de Carisma: ${def.nombre}`);
  assert.match(d.quees, /Acción de cualquiera \(Carisma\)/);
  assert.equal(d.hace.startsWith(def.texto.slice(0, 30)), true, 'el texto es el de esa acción, no el del grupo');
  assert.doesNotMatch(d.hace, /Lo que cualquiera puede intentar/);
  assert.ok(d.pulsar.length > 10 && d.gasta.length > 3);
});

test('3.76 · arma: ataque contra CA, daño en español y lo que gasta', () => {
  const item = { type: 'weapon', name: 'Espada larga', system: { description: { value: '<p>Una espada.</p>' } }, effects: mapa({}) };
  const act = { type: 'attack', activation: { type: 'action', value: 1 }, attack: { type: { value: 'melee' } }, labels: { toHit: '+5', damage: [{ formula: '1d8 + 3', damageType: 'slashing' }] }, range: { value: '5', units: 'ft' }, target: { affects: { count: '1', type: 'creature' } } };
  const d = datosTarjeta({}, item, act, 'Espada larga');
  assert.equal(d.quees, 'Arma cuerpo a cuerpo');
  assert.equal(d.pulsar, 'Tirada de ataque +5 contra la CA del objetivo; si impacta: 1d8 + 3 cortante.');
  assert.equal(d.gasta, 'tu Acción');
  assert.equal(d.alcance, '5 ft · 1 criatura');
});

test('3.76 · conjuro con salvación: característica, CD, daño, espacio y estado que pone', () => {
  const item = { type: 'spell', system: { level: 1, method: 'spell', description: { value: '<p>Una ola de fuerza. SAB.</p>' } }, effects: mapa({ e1: { name: 'Derribado' } }) };
  const act = { type: 'save', activation: { type: 'action' }, save: { ability: new Set(['con']), dc: { value: 14 } }, damage: { onSave: 'half' }, labels: { damage: [{ formula: '2d8', damageType: 'thunder' }] }, effects: [{ _id: 'e1' }], consumption: {} };
  const d = datosTarjeta({}, item, act, 'Onda atronadora');
  assert.equal(d.quees, 'Conjuro de nivel 1');
  assert.equal(d.pulsar, 'El objetivo hace una salvación de Constitución contra CD 14; si falla: 2d8 trueno (la mitad si la pasa). Si le afecta, queda: Derribado.');
  assert.match(d.gasta, /tu Acción · un espacio de conjuro de nivel 1 o más/);
  assert.match(d.hace, /Sabiduría/, 'las abreviaturas se leen enteras');
});

test('3.76 · las acciones de D&D también tienen tarjeta y el menú usa data-tooltip-html', () => {
  for (const a of ACCIONES_BASICAS) { const h = tarjetaBasica(a); assert.match(h, /Al pulsar:/, a.id); assert.match(h, /Gasta:/, a.id); }
  assert.match(tarjetaHTML({ nombre: 'X', hace: '<script>' }), /&lt;script&gt;/, 'escapa el texto');
  const actor = { items: [], system: { spells: {} } };
  const h = htmlAcciones(actor, { filtro: 'accion' });
  assert.match(h, /data-tooltip-html="&lt;div class=&quot;ecos-tt&quot;/);
  assert.doesNotMatch(h, /data-basica="[^"]+" data-tooltip="/);
});
