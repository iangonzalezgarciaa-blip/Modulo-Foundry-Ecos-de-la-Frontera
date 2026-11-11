import test from 'node:test';
import assert from 'node:assert/strict';
import { metrosAPies, aPiesTexto, piesAMetros, planEstudio, practicar, naturalezaPorDado, reservaPorCon, recuperacionLargaCon, diasParaLlenar,
  gastoVerbe, economiaVerbe, esFamilia, familiaVisible } from '../scripts/verbe-327.js';
import { resetEnvironment } from './helpers/foundry.mjs';

test('3.27 · todo en pies: 1,5 m = 5 ft, el texto cambia y lo que ya decía pies queda solo en pies', async () => {
  resetEnvironment(); const { escenaAPies } = await import('../scripts/ecos-327.js');
  assert.equal(metrosAPies(1.5), 5); assert.equal(metrosAPies('18'), 60); assert.equal(metrosAPies('4,5'), 15); assert.equal(metrosAPies(6), 20);
  assert.equal(aPiesTexto('Alcance 18 m, cono de 4,5 m.'), 'Alcance 60 ft, cono de 15 ft.');
  assert.equal(aPiesTexto('a 9 m (30 pies)'), 'a 30 ft');
  assert.equal(aPiesTexto('3 monedas y 2 manos'), '3 monedas y 2 manos', 'no toca palabras que empiezan con m');
  assert.equal(piesAMetros(5), 1.5);
  assert.deepEqual(escenaAPies({ units: 'm', distance: 1.5 }), { 'grid.units': 'ft', 'grid.distance': 5 });
  assert.equal(escenaAPies({ units: 'ft', distance: 5 }), null, 'una escena en pies no se toca');
});

test('3.27 · aprender por días: grado + 1 días buenos, CD 10 + grado, un día por vez', () => {
  assert.deepEqual(planEstudio(1), { exitos: 2, cd: 11 });
  let e = { ...planEstudio(1), progreso: 0 };
  let r = practicar(e, { total: 12, natural: 9, dia: 1 }); assert.ok(r.exito); assert.equal(r.progreso, 1); e = r.estudio;
  assert.equal(practicar(e, { total: 20, natural: 15, dia: 1 }).ok, false, 'hoy ya practicó');
  r = practicar(e, { total: 3, natural: 1, dia: 2 }); assert.equal(r.progreso, 0, 'un 1 natural pierde un día'); e = r.estudio;
  r = practicar(e, { total: 5, natural: 20, dia: 3 }); assert.equal(r.progreso, 2, 'un 20 natural cuenta doble'); assert.ok(r.terminado);
});

test('3.27 · naturaleza por dado, reserva con Constitución y la acción Verbe', () => {
  assert.equal(naturalezaPorDado(['Fuego', 'Agua', 'Tierra', 'Viento', 'Rayo'], 5), 'Rayo');
  assert.equal(naturalezaPorDado(['Fuego', 'Agua'], 9), 'Agua', 'una tirada fuera de rango no rompe');
  assert.equal(reservaPorCon(2, 5), 10); assert.equal(reservaPorCon(-1, 3), -3);
  assert.equal(recuperacionLargaCon(44, 2, 5), 15, 'el ejemplo de la guía: CON +2 a nivel 5, 15 de 44');
  assert.equal(diasParaLlenar(44, 15), 3); assert.equal(diasParaLlenar(10, 0), Infinity);
  assert.equal(gastoVerbe('A'), 'accion'); assert.equal(gastoVerbe('bonus'), 'adicional'); assert.equal(gastoVerbe('R'), 'reaccion'); assert.equal(gastoVerbe('1 min'), null);
  const c = { id: 'c1', ronda: 2, turno: 1 };
  assert.deepEqual(economiaVerbe({ turnoVerbe: { combate: 'c1', ronda: 2, turno: 1, accion: true, reaccion: true } }, c), { accion: true, reaccion: true, enCombate: true });
  assert.deepEqual(economiaVerbe({ turnoVerbe: { combate: 'c1', ronda: 2, turno: 0, accion: true, reaccion: true } }, c), { accion: false, reaccion: true, enCombate: true }, 'la acción vuelve en otro turno; la reacción dura la ronda');
  assert.deepEqual(economiaVerbe({}, null), { accion: false, reaccion: false, enCombate: false });
});

test('3.27 · las artes de familia se ven solo con la familia de nacimiento', () => {
  assert.ok(esFamilia('sombra')); assert.ok(!esFamilia('fuego')); assert.ok(!esFamilia('toString'));
  const arte = { sec: 'familia', req: 'un maestro de Atadura de sombra' };
  assert.equal(familiaVisible(arte, []), false); assert.equal(familiaVisible(arte, ['sombra']), true);
  assert.equal(familiaVisible({ req: 'un maestro de Atadura de sombra' }, []), true, 'fuera de las Artes de familia no se esconde');
  assert.equal(familiaVisible({ acceso: { tradicion: 'tinta' } }, ['sombra']), false, 'la marca del catálogo manda');
});
