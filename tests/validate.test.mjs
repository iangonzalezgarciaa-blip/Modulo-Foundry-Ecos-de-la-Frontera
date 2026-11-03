import test from 'node:test';
import assert from 'node:assert/strict';
import { readCatalog } from '../tools/catalog.mjs';
import { problemasTecnica, validarTecnicas, areaDeTexto } from '../scripts/verbe-validate.js';
const D = readCatalog();
const base = (sys = {}, extra = {}) => ({ id: 'prueba', n: 'Prueba', texto: '', ...extra, item: { name: 'Prueba', flags: { 'ecos-frontera': { verbe: {} } }, system: {
  activation: { type: 'action' }, range: { units: 'm', value: 18 }, duration: { units: 'inst' }, target: { affects: {}, template: {} },
  activities: { a: { type: 'save', damage: { parts: [{ number: 2, denomination: 6 }] } } }, ...sys } } });
const codigos = t => problemasTecnica(t).map(p => `${p.nivel}:${p.codigo}`);

test('el validador corre sobre las 860 técnicas y no quedan errores ni avisos', () => {
  const r = validarTecnicas(D.tecnicas);
  assert.equal(r.total, 860);
  assert.equal(r.errores, 0, JSON.stringify(r.problemas.slice(0, 5)));
  assert.equal(r.avisos, 0, JSON.stringify(r.problemas.slice(0, 5)));
});

test('detecta áreas sin plantilla, plantillas sobre el lanzador y fichas incompletas', () => {
  assert.deepEqual(codigos(base({}, { texto: 'Lanza fuego en un cono de 4,5 m.' })), ['error:area-sin-plantilla']);
  assert.deepEqual(codigos(base({}, { area: 'esfera 6 m' })), ['error:area-sin-plantilla']);
  assert.deepEqual(codigos(base({ range: { units: 'self' }, target: { affects: { type: 'self' }, template: { type: 'cone', size: 4.5 } } })), ['error:area-sobre-ti']);
  assert.deepEqual(codigos(base({ range: { units: 'self' }, target: { affects: { type: '' }, template: { type: 'cone', size: 4.5 } } })), ['aviso:area-te-alcanza']);
  assert.deepEqual(codigos(base({ range: { units: 'self' }, target: { affects: { type: '', special: '-self' }, template: { type: 'cone', size: 4.5 } } })), []);
  assert.deepEqual(codigos(base({ range: { units: 'self' }, target: { affects: { type: 'self' }, template: {} } })), ['aviso:dano-a-ti']);
  assert.deepEqual(codigos(base({ target: { affects: {}, template: { type: 'hexagono', size: 3 } } })), ['error:plantilla-tipo']);
  assert.deepEqual(codigos(base({ target: { affects: {}, template: { type: 'sphere' } } })), ['error:plantilla-tamano']);
  assert.deepEqual(codigos(base({ activation: {}, range: {}, duration: {} })), ['aviso:sin-accion', 'aviso:sin-alcance', 'aviso:sin-duracion']);
  assert.deepEqual(codigos(base({ activities: {} })), ['error:sin-actividad']);
  // Una esfera que es un objeto (no un área medida) no es un error.
  assert.deepEqual(codigos(base({}, { texto: 'Una esfera de agua atrapa a una criatura.' })), []);
});

test('el área se lee de la ficha o del texto con su medida', () => {
  assert.deepEqual(areaDeTexto({ area: 'cono 4,5 m' }), { type: 'cone', size: 4.5 });
  assert.deepEqual(areaDeTexto({ texto: 'Mueves la tierra de un cubo de 1,5 m.' }), { type: 'cube', size: 1.5 });
  assert.equal(areaDeTexto({ texto: 'Una esfera girante al contacto.' }), null);
});

test('Aliento de brasa y las áreas que salen de ti ya no alcanzan al lanzador', () => {
  const t = D.tecnicas.find(t => t.id === 'fuego-aliento'), s = t.item.system;
  assert.equal(s.target.template.type, 'cone');
  assert.equal(s.target.template.size, 4.5);
  assert.ok(s.target.affects.special.split(';').includes('-self'));
  assert.notEqual(s.target.affects.type, 'self');
  for (const id of ['pacto-mandara', 'hilo-espada-explosiva', 'quietud-agujas-cabello']) {
    const x = D.tecnicas.find(t => t.id === id).item.system.target;
    assert.notEqual(x.affects.type, 'self', id); assert.ok(x.affects.special.includes('-self'), id);
  }
  const barro = D.tecnicas.find(t => t.id === 'tierra-barro').item.system.target.template;
  assert.deepEqual([barro.type, barro.size], ['cube', 1.5]);
});

test('«tu próximo golpe suma el daño» es un efecto sobre ti, no daño al lanzador', () => {
  for (const id of ['fuego-cola', 'tierra-puno', 'rayo-colmillo', 'magma-puno', 'familia-mano-gigante', 'cuerpo-parte-montanas']) {
    const t = D.tecnicas.find(t => t.id === id), acts = Object.values(t.item.system.activities);
    assert.ok(acts.every(a => !a.damage?.parts?.length), id);
    const ef = t.item.effects.find(e => e.flags['ecos-frontera']?.verbe?.golpeSiguiente);
    assert.ok(ef?.flags['ecos-frontera'].verbe.aplicarUsuario, id);
    assert.match(ef.changes[0].value, /^\d+d\d+\[\w+\]$/, id);
    assert.equal(ef.changes[0].key, 'system.bonuses.mwak.damage', id);
    assert.deepEqual(ef.flags.dae.specialDuration, ['1Hit'], id);
  }
  assert.equal(D.tecnicas.find(t => t.id === 'cuerpo-parte-montanas').item.effects.find(e => e.flags['ecos-frontera']?.verbe?.golpeSiguiente).duration.seconds, 60);
  const cien = D.tecnicas.find(t => t.id === 'cuerpo-cien-pasos').item.system.target.affects;
  assert.deepEqual([cien.type, cien.count], ['creature', '5']);
});

test('las plantillas en metros se convierten a pies de la escena (1,5 m = 5 pies) y al revés', async () => {
  const { convertirMedida, plantillaEnEscena } = await import('../scripts/verbe-plantillas.js');
  assert.equal(convertirMedida(4.5, 'm', 'ft'), 15);
  assert.equal(convertirMedida(15, 'ft', 'm'), 4.5);
  assert.equal(convertirMedida(4.5, 'm', 'm'), 4.5);
  assert.equal(convertirMedida('', 'm', 'ft'), '');
  const data = { t: 'cone', distance: 4.5, flags: { dnd5e: { dimensions: { size: 4.5, width: '', height: '' } } } };
  assert.equal(plantillaEnEscena(data, 'm', 'ft'), true);
  assert.equal(data.distance, 15); assert.equal(data.flags.dnd5e.dimensions.size, 15);
  assert.equal(plantillaEnEscena({ distance: 6 }, 'm', 'm'), false);
});
