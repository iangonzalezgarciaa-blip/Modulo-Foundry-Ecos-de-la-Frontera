import test from 'node:test';
import assert from 'node:assert/strict';
import './helpers/foundry.mjs';
import { MockActor } from './helpers/foundry.mjs';
const D = await import('../scripts/dotes-nivel.js');

test('3.53 · un hueco en cada nivel sin Mejora de característica, abiertos según el nivel', () => {
  assert.deepEqual(D.HUECOS_DOTE.map(h => h.nivel), [2, 3, 5, 6, 7, 9, 10, 11, 13, 14, 15, 17, 18, 20]);
  for (const n of [4, 8, 12, 16, 19]) assert.ok(!D.HUECOS_DOTE.some(h => h.nivel === n), `nivel ${n} es de Mejora`);
  const h6 = D.huecosDe({ nivel: 6 });
  assert.equal(h6.filter(h => h.abierto).length, 4); // 2, 3, 5, 6: una hoja de nivel 6 recibe sus 4 huecos pendientes
  assert.equal(D.huecosDe({ nivel: 1, herencia: true })[0].clave, 'herencia');
  assert.deepEqual(D.huecosNuevos(5, 7).map(h => h.nivel), [6, 7]);
  assert.deepEqual(D.huecosNuevos(3, 4), []);
});

test('3.53 · especies de D&D y de PF2e → ascendencias de PF2e', () => {
  assert.deepEqual(D.slugsAscendencia({ raza: { identifier: 'elf', name: 'Elf' } }), ['elf']);
  assert.deepEqual(D.slugsAscendencia({ raza: { identifier: 'high-elf', name: 'Elfo alto' } }), ['elf']);
  assert.deepEqual(D.slugsAscendencia({ raza: { identifier: '', name: 'Enano de las colinas' } }), ['dwarf']);
  assert.deepEqual(D.slugsAscendencia({ raza: { identifier: 'tiefling', name: 'Tiflin' } }), ['nephilim']);
  assert.deepEqual(D.slugsAscendencia({ raza: { identifier: 'half-elf', name: 'Semielfo' } }), ['human', 'elf', 'aiuvarin']);
  assert.deepEqual(D.slugsAscendencia({ raza: { pf2e: 'kobold', name: 'Kóbold' }, herencias: [{ versatil: true, nombre: 'Changeling' }] }), ['kobold', 'changeling']);
  assert.deepEqual(D.slugsAscendencia({ raza: { identifier: 'xyz', name: 'Especie propia' }, manual: 'goblin' }), ['goblin']);
  assert.deepEqual(D.slugsAscendencia({ raza: { identifier: 'xyz', name: 'Especie propia' } }), []);
});

test('3.53 · requisitos: competencia, pericia, nivel, característica y dotes previas', () => {
  const ctx = { nivel: 6, pericias: { ath: 1, ste: 2 }, car: { str: 14 }, arte: 1,
    conocidas: new Map([['lesser enhance venom', 'Veneno mejorado menor']]), dotesTomadas: new Set() };
  assert.deepEqual(D.revisarRequisitos({ pericias: [{ skill: 'ath', rango: 1 }] }, ctx).faltan, []);
  assert.match(D.revisarRequisitos({ pericias: [{ skill: 'ath', rango: 2 }] }, ctx).faltan[0], /pericia en Atletismo/);
  assert.match(D.revisarRequisitos({ pericias: [{ skill: 'ste', rango: 3 }] }, ctx).faltan[0], /nivel 7/);
  assert.deepEqual(D.revisarRequisitos({ pericias: [{ skill: 'crafting', rango: 1 }] }, ctx).faltan, []);
  assert.match(D.revisarRequisitos({ car: { str: 16 } }, ctx).faltan[0], /Fuerza 16/);
  assert.match(D.revisarRequisitos({ otros: ['Lesser Enhance Venom'] }, ctx).faltan[0], /Veneno mejorado menor/);
  ctx.dotesTomadas.add('lesser enhance venom');
  assert.deepEqual(D.revisarRequisitos({ otros: ['Lesser Enhance Venom'] }, ctx).faltan, []);
  assert.deepEqual(D.revisarRequisitos({ otros: ['spirit instinct'] }, ctx).dudas, ['spirit instinct']);
});

test('3.53 · cada hueco filtra por categoría, clase, ascendencia y nivel', () => {
  const ctx = { nivel: 6, clases: { fighter: 6 }, ascendencias: ['elf'], tomadas: new Set(['ya']), pericias: {}, car: {} };
  const clase = { id: 'a', categoria: 'class', clase: ['fighter'], nivel: 4, req: {} };
  assert.equal(D.evaluarDote(clase, { cat: 'class', nivel: 6 }, ctx).ok, true);
  assert.match(D.evaluarDote({ ...clase, nivel: 8 }, { cat: 'class', nivel: 6 }, ctx).motivos[0], /nivel 8/);
  assert.equal(D.evaluarDote({ ...clase, clase: ['wizard'] }, { cat: 'class', nivel: 6 }, ctx).fuera, true);
  assert.equal(D.evaluarDote(clase, { cat: 'ancestry', nivel: 5 }, ctx).fuera, true);
  assert.equal(D.evaluarDote({ id: 'b', categoria: 'ancestry', ascendencia: ['elf'], nivel: 5, req: {} }, { cat: 'ancestry', nivel: 5 }, ctx).ok, true);
  assert.equal(D.evaluarDote({ id: 'c', categoria: 'ancestry', ascendencia: ['dwarf'], nivel: 1, req: {} }, { cat: 'ancestry', nivel: 5 }, ctx).fuera, true);
  assert.equal(D.evaluarDote({ id: 'd', categoria: 'skill', nivel: 1, req: {} }, { cat: 'general', nivel: 3 }, ctx).ok, true);
  assert.equal(D.evaluarDote({ id: 'ya', categoria: 'skill', nivel: 1, req: {} }, { cat: 'skill', nivel: 7 }, ctx).fuera, true);
  assert.match(D.evaluarDote({ id: 'e', categoria: 'skill', nivel: 1, rareza: 'rare', req: {} }, { cat: 'skill', nivel: 7 }, ctx).motivos[0], /rara/);
  assert.equal(D.evaluarDote({ id: 'e', categoria: 'skill', nivel: 1, rareza: 'rare', req: {} }, { cat: 'skill', nivel: 7 }, { ...ctx, raras: true }).ok, true);
  // Sin clase o especie con dotes de PF2e: el hueco admite generales y de habilidad.
  assert.equal(D.evaluarDote({ id: 'f', categoria: 'general', nivel: 1, req: {} }, { cat: 'class', nivel: 2 }, { ...ctx, sinClase: true }).ok, true);
  assert.equal(D.evaluarDote({ id: 'g', categoria: 'skill', nivel: 1, req: {} }, { cat: 'ancestry', nivel: 5 }, { ...ctx, sinAscendencia: true }).ok, true);
  assert.equal(D.evaluarHerencia({ id: 'h', versatil: true }, ctx).ok, true);
  assert.equal(D.evaluarHerencia({ id: 'i', ascendencia: 'elf' }, ctx).ok, true);
  assert.equal(D.evaluarHerencia({ id: 'j', ascendencia: 'kobold' }, ctx).fuera, true);
});

test('3.53 · el contexto sale de la hoja y los huecos llenos de sus objetos', () => {
  const a = new MockActor(7);
  a.system.skills = { ath: { value: 1 }, ste: { value: 2 } };
  a.system.abilities.str.value = 15;
  a.system.tools = { smith: { value: 1 }, dice: { value: 1 } };
  a.items.push({ id: 'c1', type: 'class', name: 'Guerrero', system: { identifier: 'fighter', levels: 5 } },
    { id: 'c2', type: 'class', name: 'Pícaro', system: { identifier: 'rogue', levels: 2 } },
    { id: 'r', type: 'race', name: 'Kóbold', system: { identifier: 'kobold' }, flags: { 'ecos-frontera': { pf2e: { tipo: 'raza', slug: 'kobold' } } } },
    { id: 'd1', type: 'feat', name: 'Paso ágil', flags: { 'ecos-frontera': { huecoDote: '2', pf2e: { id: 'p1', nombre: 'Nimble Step' } } } });
  const ctx = D.contextoDe(a);
  assert.equal(ctx.nivel, 7);
  assert.deepEqual(ctx.clases, { fighter: 5, rogue: 2 });
  assert.equal(ctx.arte, 1);
  assert.equal(ctx.car.str, 15);
  assert.deepEqual(ctx.ascendencias, ['kobold']);
  assert.ok(ctx.tomadas.has('p1') && ctx.dotesTomadas.has('nimble step'));
  assert.equal(ctx.sinClase, false);
  assert.equal(D.tieneHuecoHerencia(a), true);
  assert.equal(D.itemsPorHueco(a).get('2').id, 'd1');
  a.flags['ecos-frontera'].dotesClase = 'wizard';
  assert.equal(D.contextoDe(a).clases.wizard, 7);
});

test('3.53 · la guía nombra los huecos y cómo revertir', () => {
  const g = D.guiaDotesHTML();
  for (const t of ['Dotes', 'Herencia', 'Deshacer', 'Pericia', 'Lo confirma el DM']) assert.ok(g.includes(t), t);
  assert.ok(!/naruto|abyss|pathfinder society/i.test(g));
});
