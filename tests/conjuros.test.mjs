import test from 'node:test';
import assert from 'node:assert/strict';
import { costeCopia, gratisMago, contarGratisMago, nivelMaximoDe, datosParaHoja, paginasListas, glosarioHTML, PACK_CONJUROS, indiceHTML, tipoConjuro } from '../scripts/conjuros.js';
import { esAfin, ramasConjuro, esConjuroNormal, datosDote, RAMA_DE_ESCUELA, naturalezaResonancia, dadosEn } from '../scripts/resonancia.js';

test('copiar al libro: 50 po y 2 horas por nivel, como en el Manual; la rareza de PF2e multiplica el oro', () => {
  assert.deepEqual(costeCopia(3), { po: 150, horas: 6 });
  assert.deepEqual(costeCopia(2, 'uncommon'), { po: 150, horas: 4 });
  assert.deepEqual(costeCopia(1, 'rare'), { po: 100, horas: 2 });
  assert.deepEqual(costeCopia(4, 'unique'), { po: 600, horas: 8 });
  assert.deepEqual(costeCopia(0), { po: 0, horas: 0 });
});

test('el mago tiene 6 gratis al nivel 1 y 2 más por nivel; los trucos y los copiados no cuentan', () => {
  assert.equal(gratisMago(1, 0), 6);
  assert.equal(gratisMago(5, 10), 4);
  assert.equal(gratisMago(5, 20), 0);
  const items = [
    { type: 'spell', system: { level: 0 } },
    { type: 'spell', system: { level: 1 } },
    { type: 'spell', system: { level: 2, sourceItem: 'class:wizard' } },
    { type: 'spell', system: { level: 1, sourceItem: 'class:wizard' }, flags: { 'ecos-frontera': { aprendido: { modo: 'copia' } } } },
    { type: 'spell', system: { level: 1, sourceItem: 'class:cleric' } },
    { type: 'weapon', system: { level: 1 } }
  ];
  assert.equal(contarGratisMago(items), 2);
});

test('nivel máximo: el espacio más alto con máximo, también el de pacto', () => {
  assert.equal(nivelMaximoDe({ spell1: { max: 4, level: 1 }, spell2: { max: 3, level: 2 }, spell3: { max: 0, level: 3 } }), 2);
  assert.equal(nivelMaximoDe({ spell1: { max: 0, level: 1 }, pact: { max: 2, level: 3 } }), 3);
  assert.equal(nivelMaximoDe({}), 0);
});

test('el conjuro entra a la hoja de la clase, sin preparar y con su origen', () => {
  const d = datosParaHoja({ _id: 'x', name: 'Explosión ácida', type: 'spell', folder: 'f', system: { level: 1 } }, 'wizard', 'copia', 'Compendium.world.ecos-conjuros-pf2e.Item.x', { po: 50, horas: 2 });
  assert.equal(d._id, undefined); assert.equal(d.folder, undefined);
  assert.equal(d.system.sourceItem, 'class:wizard'); assert.equal(d.system.prepared, 0); assert.equal(d.system.method, 'spell');
  assert.equal(d._stats.compendiumSource, 'Compendium.world.ecos-conjuros-pf2e.Item.x');
  assert.deepEqual(d.flags['ecos-frontera'].aprendido, { modo: 'copia', clase: 'wizard', coste: { po: 50, horas: 2 } });
});

test('las listas de clase son páginas de dnd5e con las UUID del compendio', () => {
  const [p] = paginasListas({ wizard: ['a1', 'b2'] });
  assert.equal(p.type, 'spells'); assert.equal(p.system.type, 'class'); assert.equal(p.system.identifier, 'wizard');
  assert.deepEqual(p.system.spells, [`Compendium.${PACK_CONJUROS}.Item.a1`, `Compendium.${PACK_CONJUROS}.Item.b2`]);
  assert.match(p.name, /^Mago/);
  const g = glosarioHTML();
  assert.match(g, /Fortaleza, Reflejos, Voluntad/); assert.match(g, /Desprevenido/); assert.doesNotMatch(g, /undefined/);
});

test('Resonancia del Verbe: +1 solo a conjuros normales afines por naturaleza o por rama', () => {
  const conjuro = (school, tipos = [], extra = {}) => ({ type: 'spell', system: { school, activities: { a: { type: tipos.length ? 'save' : 'utility', damage: { parts: tipos.map(t => ({ types: [t] })) } }, ...extra } } });
  const bola = conjuro('evo', ['fire']);
  assert.equal(esAfin(bola, { nats: new Set(['fuego']) }), true);
  assert.equal(esAfin(bola, { nats: new Set(['agua']) }), false);
  assert.equal(esAfin(bola, { ramas: new Set(['forma']) }), true);
  const ilusion = conjuro('ill');
  assert.equal(esAfin(ilusion, { nats: new Set(['fuego', 'agua']) }), false);
  assert.equal(esAfin(ilusion, { ramas: new Set(['velo']) }), true);
  const cura = { type: 'spell', system: { school: 'abj', activities: { a: { type: 'heal' } } } };
  assert.deepEqual([...ramasConjuro(cura)].sort(), ['pulso', 'sello']);
  assert.equal(esAfin(cura, { ramas: new Set(['pulso']) }), true);
  // Las técnicas del Verbe y lo que no es conjuro no cuentan.
  const tecnica = { ...bola, flags: { 'ecos-frontera': { verbe: { id: 'x' } } } };
  assert.equal(esConjuroNormal(tecnica), false); assert.equal(esAfin(tecnica, { nats: new Set(['fuego']) }), false);
  assert.equal(esAfin({ type: 'consumable', system: { school: 'evo' } }, { ramas: new Set(['forma']) }), false);
  assert.equal(Object.keys(RAMA_DE_ESCUELA).length, 8);
  assert.equal(datosDote().flags['ecos-frontera'].resonancia, true);
});

test('3.16: una curación es de Agua; los conjuros de PF2e sin daño toman su elemento; la curación afín suma 1 por dado', () => {
  const cura = { type: 'spell', system: { school: 'abj', activities: { a: { type: 'heal' } } } };
  assert.equal(naturalezaResonancia(cura), 'agua');
  assert.equal(esAfin(cura, { nats: new Set(['agua']) }), true);
  assert.equal(esAfin(cura, { nats: new Set(['tierra']) }), false);
  const niebla = { type: 'spell', system: { school: 'con', activities: { a: { type: 'utility' } } }, flags: { 'ecos-frontera': { pf2e: { rasgos: ['water', 'concentrate'] } } } };
  assert.equal(naturalezaResonancia(niebla), 'agua');
  const bola = { type: 'spell', system: { school: 'evo', activities: { a: { type: 'save', damage: { parts: [{ types: ['fire'] }] } } } } };
  assert.equal(naturalezaResonancia(bola), 'fuego');
  assert.equal(naturalezaResonancia({ type: 'spell', system: { school: 'trs', activities: {} } }), 'agua');
  assert.equal(dadosEn(['2d8', '@mod']), 2);
  assert.equal(dadosEn(['4d8 + 3', 'd6']), 5);
  assert.equal(dadosEn(['@mod']), 0);
});

test('4.2e: la biblioteca lista cada nivel por escuela, con enlace, tipo, clases y rareza', () => {
  const c = (id, name, level, school, tipo, trad, rareza = 'common') => ({ _id: id, name, system: { level, school, activities: { a: { type: tipo } } }, flags: { 'ecos-frontera': { pf2e: { tradiciones: trad, rareza } } } });
  const lista = [c('a1', 'Zeta', 1, 'evo', 'save', ['arcane']), c('b2', 'Alfa', 1, 'evo', 'attack', ['primal'], 'rare'), c('c3', 'Beta', 1, 'abj', 'heal', ['divine']), c('d4', 'Otro', 2, 'ill', 'utility', ['occult'])];
  const h = indiceHTML(lista, 1);
  assert.match(h, /Nivel 1 · 3 conjuros/);
  assert.ok(h.indexOf('Beta') < h.indexOf('Alfa') && h.indexOf('Alfa') < h.indexOf('Zeta'), 'por escuela y nombre');
  assert.match(h, /@UUID\[Compendium\.world\.ecos-conjuros-pf2e\.Item\.b2\]\{Alfa\}/);
  assert.match(h, /Druida, Explorador/); assert.match(h, /raro/); assert.doesNotMatch(h, /Otro/);
  assert.equal(tipoConjuro(lista[2]), 'Curación'); assert.equal(tipoConjuro(lista[1]), 'Ataque');
});
