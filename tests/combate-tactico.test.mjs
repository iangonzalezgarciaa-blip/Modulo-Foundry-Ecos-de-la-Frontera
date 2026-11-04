import test from 'node:test';
import assert from 'node:assert/strict';
import { bandoDe, mismoBando, segmentoCruza, casillasEntre, rodeado, falloPorCinco, motivoMoral, sinMoral, danoSecuaz, combinacion, DATOS_COMBO, turnoSeguido, cdEvaluar, hechosEvaluar, elementoTerreno, guiaTacticoHTML, REGLAS } from '../scripts/combate-tactico.js';
import { ACCIONES_PLANAS } from '../scripts/acciones-comunes.js';

const C = 100, r = (x, y) => ({ x: x * C, y: y * C, w: C, h: C });

test('3.13 bandos: por disposición, o el que asigna el DM', () => {
  assert.equal(bandoDe({ disposition: 1 }), 'aliados'); assert.equal(bandoDe({ disposition: -1 }), 'enemigos'); assert.equal(bandoDe({ disposition: 0 }), 'neutrales');
  assert.equal(bandoDe({ disposition: -1, flags: { 'ecos-frontera': { bando: 'tinta' } } }), 'tinta');
  assert.equal(mismoBando({ disposition: -1, flags: { 'ecos-frontera': { bando: 'uhrak' } } }, { disposition: -1 }), false);
});

test('rodear: aliado en la casilla opuesta sí; en diagonal al lado o lejos, no', () => {
  assert.equal(segmentoCruza({ x: 50, y: 150 }, { x: 250, y: 150 }, { x: 101, y: 101, w: 98, h: 98 }), true);
  assert.equal(casillasEntre(r(0, 1), r(1, 1), C), 0); assert.equal(casillasEntre(r(0, 1), r(3, 1), C), 2);
  const blanco = { rect: r(1, 1) }, yo = { rect: r(0, 1) };
  assert.equal(rodeado(yo, blanco, [{ rect: r(2, 1), puede: true }], C), true, 'opuesto');
  assert.equal(rodeado(yo, blanco, [{ rect: r(2, 2), puede: true }], C), false, 'diagonal no opuesta');
  assert.equal(rodeado(yo, blanco, [{ rect: r(2, 1), puede: false }], C), false, 'aliado incapacitado');
  assert.equal(rodeado({ rect: r(0, 0) }, blanco, [{ rect: r(2, 2), puede: true }], C), true, 'diagonales opuestas');
  assert.equal(rodeado({ rect: r(-1, 1) }, blanco, [{ rect: r(2, 1), puede: true }], C), false, 'el atacante no está a 1,5 m');
});

test('engaño, moral y secuaces: condiciones cerradas', () => {
  assert.equal(falloPorCinco(8, 13), true); assert.equal(falloPorCinco(9, 13), false);
  assert.equal(motivoMoral([{ lider: true, caido: true }, { caido: false }], 2), 'lider');
  assert.equal(motivoMoral([{ caido: true }, { caido: true }, { caido: false }, { caido: false }], 4), 'mitad');
  assert.equal(motivoMoral([{ caido: true }, { caido: false }, { caido: false }], 3), null);
  assert.equal(motivoMoral([{ caido: true }, { caido: true }, { caido: false }, { caido: false }], 4, ['mitad']), null, 'una vez por combate');
  assert.equal(sinMoral({ tipo: 'undead' }), true); assert.equal(sinMoral({ tipo: 'humanoid' }), false);
  assert.equal(danoSecuaz(1, 30), 30); assert.equal(danoSecuaz(10, 30, 0.5), 0); assert.equal(danoSecuaz(0, 30), null);
});

test('técnicas combinadas: solo pares que combinan y en turnos seguidos', () => {
  assert.equal(combinacion('fuego', 'viento'), 'ceniza'); assert.equal(combinacion('viento', 'fuego'), 'ceniza');
  assert.equal(combinacion('viento', 'rayo'), null); assert.equal(combinacion('fuego', 'fuego'), null); assert.equal(combinacion('magma', 'agua'), null);
  for (const k of ['vapor', 'ceniza', 'magma', 'destello', 'escarcha', 'raiz', 'tormenta', 'arena', 'hierro']) assert.ok(DATOS_COMBO[k], k);
  assert.equal(turnoSeguido({ ronda: 1, turno: 2 }, { ronda: 1, turno: 3 }, 5), true);
  assert.equal(turnoSeguido({ ronda: 1, turno: 4 }, { ronda: 2, turno: 0 }, 5), true, 'cambio de ronda');
  assert.equal(turnoSeguido({ ronda: 1, turno: 2 }, { ronda: 1, turno: 4 }, 5), false);
});

test('evaluar: CD y datos en orden, uno más por cada 5', () => {
  assert.equal(cdEvaluar({ vd: 3 }), 13); assert.equal(cdEvaluar({ vd: 3, legendario: true }), 18);
  const d = { salvaciones: { str: 4, dex: -1, wis: 2 }, resiste: ['fuego'], inmune: [], vulnerable: ['radiante'], ca: 15 };
  assert.deepEqual(hechosEvaluar(d, 12, 13), []);
  assert.equal(hechosEvaluar(d, 13, 13).length, 1); assert.match(hechosEvaluar(d, 13, 13)[0], /Destreza/);
  assert.equal(hechosEvaluar(d, 23, 13).length, 3); assert.equal(hechosEvaluar(d, 40, 13).length, 5);
});

test('terreno vivo: el nombre de la región dice qué es', () => {
  assert.equal(elementoTerreno('Terreno vivo: lámpara del techo').nombre, 'Lámpara o fuego');
  assert.equal(elementoTerreno('Terreno vivo: barril de aceite').estados[0], 'prone');
  assert.equal(elementoTerreno('Puerta'), null);
  assert.equal(elementoTerreno('Terreno vivo: estatua').salv, null);
});

test('la regla escrita nombra las diez reglas; Interponerse está en las acciones y Fintar pone Desprevenido', () => {
  const h = guiaTacticoHTML();
  for (const n of ['Desprevenido', 'Rodear', 'El engaño elige el golpe', 'Plan maestro', 'Moral de los PNJ', 'Secuaces', 'Técnicas combinadas', 'Interponerse', 'Terreno vivo', 'Evaluar automático']) assert.ok(h.includes(n), n);
  assert.equal(Object.keys(REGLAS).length, 10);
  assert.ok(ACCIONES_PLANAS.some(a => a.id === 'interponerse' && a.act === 'reaction'));
  assert.deepEqual(ACCIONES_PLANAS.find(a => a.id === 'fintar').efecto.statuses, ['ecosDesprevenido']);
});

test('3.13: los diarios sueltos de Ecos se numeran tras los de la carpeta del DM; los renombrados conservan su nombre', async () => {
  const { planOrden } = await import('../scripts/ordenar-diarios.js');
  const en = [{ id: 'a', name: '0 · Mesa de hoy', sort: 100 }, { id: 'b', name: '5 · Cartas y documentos', sort: 600 }];
  const diarios = [
    { id: 'p', name: 'Ecos · Panteón y sangre divina (solo DM)', folder: null, flags: { 'ecos-frontera': { panteonDM: 1 } } },
    { id: 'r', name: 'Mis reliquias', folder: null, flags: { 'ecos-frontera': { reliquiasDM: 1 } } },
    { id: 'c', name: 'Ecos · Compendio del Verbe (solo DM)', folder: 'otra', flags: { 'ecos-frontera': { compendioDM: 1 } } }
  ];
  const plan = planOrden(diarios, en);
  assert.deepEqual(plan.map(p => [p._id, p.name]), [['p', '6 · Ecos · Panteón y sangre divina'], ['r', 'Mis reliquias']]);
  assert.ok(plan.every(p => p.sort > 600));
});
