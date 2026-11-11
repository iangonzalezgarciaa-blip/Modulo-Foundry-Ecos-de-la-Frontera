import test from 'node:test';
import assert from 'node:assert/strict';
import { tramoVD, bonoDefensa, defensaSugerida, efectoDefensa, cabeRuptura, ESTADOS_RUPTURA, BRECHA, GRIETA, QUEBRADO } from '../scripts/ruptura.js';
import { pideDefensa, esAccionBasica, textoAmenaza, seSalva } from '../scripts/defensa-pedida.js';
import { ACCIONES_PLANAS, datosRasgosComunes } from '../scripts/acciones-comunes.js';

test('3.28 · las defensas suben por tramo de VD y no existen bajo VD ½', () => {
  assert.equal(tramoVD(0.25), -1); assert.equal(tramoVD(0.5), 0); assert.equal(tramoVD(4), 0); assert.equal(tramoVD(5), 1); assert.equal(tramoVD(16), 2); assert.equal(tramoVD(20), 3);
  assert.deepEqual([0.125, 1, 7, 12, 24].map(v => bonoDefensa(v)), [0, 4, 5, 6, 7]);
});

test('3.28 · la defensa sugerida: armaduras y quitina → Coraza; cuerpos o mentes duras → Fortaleza; sin carne → Cuerpo sordo', () => {
  assert.equal(defensaSugerida({ tipo: 'beast', vd: 1, ca: 14, calculo: 'natural' }), 'coraza', 'lobo terrible');
  assert.equal(defensaSugerida({ tipo: 'beast', vd: 1, ca: 11, calculo: 'default' }), 'fortaleza', 'una bestia sin armadura natural');
  assert.equal(defensaSugerida({ tipo: 'humanoid', vd: 2, ca: 13, armadura: 'medium' }), 'coraza');
  assert.equal(defensaSugerida({ tipo: 'humanoid', vd: 2, ca: 12 }), 'fortaleza');
  assert.equal(defensaSugerida({ tipo: 'undead', vd: 1 }), 'piel'); assert.equal(defensaSugerida({ tipo: 'construct', vd: 3 }), 'piel');
  assert.equal(defensaSugerida({ tipo: 'fiend', vd: 3 }), 'fortaleza');
  assert.equal(defensaSugerida({ tipo: 'beast', vd: 0.25, ca: 14, calculo: 'natural' }), null, 'bajo VD ½ son salvajes sin defensa');
  assert.equal(defensaSugerida({ tipo: 'humanoid', vd: 3, deJugador: true }), null, 'un aliado de un jugador no');
});

test('3.28 · los efectos: Coraza suma a la CA, Fortaleza a las salvaciones, Cuerpo sordo resiste armas; Brecha y Grieta restan 2', () => {
  assert.deepEqual(efectoDefensa('coraza', 4).changes, [{ key: 'system.attributes.ac.bonus', mode: 2, value: '+4' }]);
  assert.deepEqual(efectoDefensa('fortaleza', 5).changes, [{ key: 'system.bonuses.abilities.save', mode: 2, value: '+5' }]);
  assert.deepEqual(efectoDefensa('piel', 4).changes.map(c => c.value), ['bludgeoning', 'piercing', 'slashing']);
  assert.equal(efectoDefensa('nada', 1), null);
  assert.equal(ESTADOS_RUPTURA[BRECHA].changes[0].value, '-2'); assert.equal(ESTADOS_RUPTURA[GRIETA].changes[0].value, '-2');
  assert.match(ESTADOS_RUPTURA[QUEBRADO].texto, /ignora sus resistencias/);
  assert.ok(cabeRuptura(2)); assert.ok(!cabeRuptura(3), 'no más de 3');
});

test('3.28 · dos acciones de cualquiera nuevas abren defensas: Romper la guardia (Brecha) y Buscar la grieta (Grieta)', () => {
  const rg = ACCIONES_PLANAS.find(a => a.id === 'rompe-guardia'), gr = ACCIONES_PLANAS.find(a => a.id === 'grieta');
  assert.equal(rg.grupo, 'str'); assert.deepEqual(rg.efecto.statuses, ['ecosBrecha']); assert.equal(rg.efecto.segundos, 60);
  assert.equal(gr.grupo, 'int'); assert.deepEqual(gr.efecto.statuses, ['ecosGrieta']);
  const fue = datosRasgosComunes().find(r => r.system.identifier === 'ecos-acciones-str');
  const ef = fue.effects.find(e => e.statuses.includes('ecosBrecha'));
  assert.equal(ef.duration.seconds, 60); assert.equal(ef.changes[0].key, 'system.attributes.ac.bonus');
});

test('3.28 · la defensa a pedido: salvaciones con objetivo, el texto de la amenaza y la comparación con la CD', () => {
  const t = [{ nombre: 'Lobo' }];
  assert.ok(pideDefensa({ modo: 'todas', tipoActividad: 'save', basica: false, objetivos: t }));
  assert.ok(!pideDefensa({ modo: 'acciones', tipoActividad: 'save', basica: false, objetivos: t }), 'un conjuro, en «solo acciones», no');
  assert.ok(pideDefensa({ modo: 'acciones', tipoActividad: 'save', basica: true, objetivos: t }));
  assert.ok(!pideDefensa({ modo: 'todas', tipoActividad: 'attack', basica: true, objetivos: t }), 'un ataque no pide defensa');
  assert.ok(!pideDefensa({ modo: 'no', tipoActividad: 'save', basica: true, objetivos: t }));
  assert.ok(!pideDefensa({ modo: 'todas', tipoActividad: 'save', basica: true, objetivos: [] }));
  assert.ok(esAccionBasica({ flags: { 'ecos-frontera': { accionComun: { id: 'str' } } } }, { name: 'Presa' }));
  assert.ok(esAccionBasica({ name: 'Unarmed Strike' }, { name: 'Grapple' }), 'el agarre de D&D');
  assert.ok(!esAccionBasica({ name: 'Bola de fuego' }, { name: 'Lanzar' }));
  assert.equal(textoAmenaza({ autor: 'El lobo', accion: 'Presa', idAccion: 'presa' }), 'El lobo te intenta agarrar (Presa).');
  assert.equal(textoAmenaza({ autor: 'Ryu', accion: 'Mil aves', idAccion: null }), 'Ryu usa Mil aves contra ti.');
  assert.ok(seSalva(13, 13)); assert.ok(!seSalva(12, 13));
});

test('3.28 · las técnicas pesadas: las firmas y los grandes golpes, nunca una curación', async () => {
  const { readCatalog } = await import('../tools/catalog.mjs');
  const D = readCatalog(), p = D.tecnicas.filter(t => t.item?.flags?.['ecos-frontera']?.verbe?.pesada);
  assert.equal(p.length, D.pesadas.total); assert.ok(p.length >= 40);
  for (const id of ['cuerpo-chidori', 'cuerpo-raikiri', 'forma-esfera', 'forma-esfera-mayor', 'rayo-cielo']) assert.ok(p.some(t => t.id === id), id);
  assert.ok(!p.some(t => t.id === 'pulso-cauce-vida'), 'una cargada que no daña no es pesada');
  for (const t of p) assert.match(t.item.system.description.value, /<b>Pesada\.<\/b>/);
});

test('3.28 · sinergias: lo que preparó un estado lo remata otro daño (también un golpe de D&D)', async () => {
  const { sinergiasDe, efectoRuptura, QUEBRADO, BRECHA } = await import('../scripts/ruptura.js');
  assert.deepEqual(sinergiasDe(['empapado'], ['lightning']).map(s => s.pone), [QUEBRADO], 'rayo sobre mojado');
  assert.deepEqual(sinergiasDe(['helado'], ['bludgeoning']).map(s => s.pone), [QUEBRADO], 'un mazazo parte el hielo');
  assert.deepEqual(sinergiasDe(['ardiendo'], ['cold']).map(s => s.pone), [BRECHA]);
  assert.deepEqual(sinergiasDe(['embarrado'], ['fire']).map(s => s.pone), [BRECHA]);
  assert.deepEqual(sinergiasDe(['helado'], ['fire']), [], 'el fuego no parte el hielo');
  assert.deepEqual(sinergiasDe([], ['lightning']), []);
  const ef = efectoRuptura(BRECHA);
  assert.deepEqual(ef.statuses, [BRECHA]); assert.equal(ef.duration.seconds, 60); assert.equal(ef.changes[0].value, '-2');
  assert.equal(efectoRuptura('nada'), null);
});

test('3.28 · dotes de ruptura: magnitud, duración, estados que muerden y daño extra donde el Verbe abrió', async () => {
  const R = await import('../scripts/ruptura.js');
  assert.equal(R.ajustePorDotes([R.BRECHA], ['filo-que-abre']).cambio.changes[0].value, '-3');
  assert.equal(R.ajustePorDotes([R.GRIETA], ['sello-de-la-grieta']).cambio.changes[0].value, '-3');
  assert.equal(R.ajustePorDotes([R.GRIETA], ['huella-abierta']).cambio.duration.seconds, 600);
  assert.equal(R.ajustePorDotes([R.QUEBRADO], ['latido-que-rompe']).cambio.duration.seconds, 12);
  assert.deepEqual(R.ajustePorDotes(['helado'], ['muerde-elemento']).nuevos, [R.BRECHA]);
  assert.deepEqual(R.ajustePorDotes(['empapado'], ['muerde-elemento']).nuevos, [R.GRIETA]);
  assert.deepEqual(R.ajustePorDotes(['prone'], ['mordida-que-rompe']).nuevos, [R.BRECHA]);
  assert.deepEqual(R.ajustePorDotes([R.BRECHA], []), { cambio: null, nuevos: [] });
  assert.deepEqual(R.danoExtraDotes({ dotes: ['golpe-al-quiebre'], estadosBlanco: [R.BRECHA], cuerpoACuerpo: true, nivel: 3 }), [{ formula: '1d6', tipo: 'bludgeoning' }]);
  assert.deepEqual(R.danoExtraDotes({ dotes: ['golpe-al-quiebre'], estadosBlanco: [R.BRECHA], cuerpoACuerpo: false, nivel: 3 }), [], 'a distancia no');
  assert.deepEqual(R.danoExtraDotes({ dotes: ['golpe-en-el-vacio'], estadosBlanco: [R.QUEBRADO], cuerpoACuerpo: false, nivel: 12 }), [{ formula: '2d8', tipo: 'force' }]);
  const x = R.extrasPorDotes({ dotes: ['miedo-que-agrieta', 'sangre-que-hiende', 'peso-del-huesped'], estadosBlanco: ['frightened'], sinergias: [{ pone: R.QUEBRADO }], pesada: true, hayDano: true });
  assert.deepEqual(x.ids, [R.GRIETA, R.BRECHA, R.GRIETA, R.BRECHA, R.BRECHA]);
  assert.deepEqual(R.extrasPorDotes({ dotes: ['miedo-que-agrieta'], estadosBlanco: ['frightened'], hayDano: false }).ids, [], 'sin daño no');
});

test('3.28 · el catálogo trae 24 técnicas de ruptura (todas las ramas salvo Mirada y Vasija, que tienen dote) y 15 dotes', async () => {
  const { readCatalog } = await import('../tools/catalog.mjs');
  const D = readCatalog(), t = D.tecnicas.filter(x => x.ruptura?.length), d = D.dotes.filter(x => x.cat === 'ruptura');
  assert.equal(t.length, 24); assert.equal(d.length, 15);
  const ramasT = new Set(t.map(x => x.rama)), ramasD = new Set(d.flatMap(x => Object.keys(x.requisitos.ramas)));
  for (const r of D.ramas.map(x => x.id)) assert.ok(ramasT.has(r) || ramasD.has(r), r);
  assert.equal(ramasD.size, 13, 'una dote por cada rama');
  for (const x of t) { assert.ok(!/Naruto|Shippuden|shinobi/i.test(JSON.stringify(x.item.system.source) + x.item.system.description.value), x.id); assert.ok(x.item.effects[0].statuses.some(s => s.startsWith('ecos')), x.id); }
  assert.ok(D.categoriasDote.some(c => c.id === 'ruptura'));
});
