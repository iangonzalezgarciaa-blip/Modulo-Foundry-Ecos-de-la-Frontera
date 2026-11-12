import test from 'node:test';
import assert from 'node:assert/strict';
import './helpers/foundry.mjs';
const A = await import('../scripts/accion-estandar.js');
const { ventajaAtaque } = await import('../scripts/ventaja-estados.js');
const { puedeReaccionar, TEXTO_SORPRESA } = await import('../scripts/sorpresa.js');

test('3.57 · el menú reparte por Acción / Adicional / Reacción / Fuera de combate y, en Acción, por Atacar, Magia, hoja y cualquiera', () => {
  const e = [
    { nombre: 'Espada larga', eco: 'accion', grupo: 'atacar', disponible: true },
    { nombre: 'Bola de fuego', eco: 'accion', grupo: 'magia', disponible: false },
    { nombre: 'Proyectil mágico', eco: 'accion', grupo: 'magia', disponible: true },
    { nombre: 'Segundo aliento', eco: 'adicional', grupo: 'otras', disponible: true },
    { nombre: 'Apuntar', eco: 'adicional', grupo: 'otras', comun: true, disponible: true },
    { nombre: 'Escudo', eco: 'reaccion', grupo: 'magia', disponible: true },
    { nombre: 'Interponerse', eco: 'reaccion', grupo: 'otras', comun: true, disponible: true },
    { nombre: 'Voltereta', eco: 'fuera', grupo: 'otras', comun: true, mov: true, disponible: true },
    { nombre: 'Detectar magia (ritual)', eco: 'fuera', grupo: 'magia', disponible: true },
    { nombre: 'Aliento', eco: 'legendaria', grupo: 'otras', disponible: true }
  ];
  const c = A.clasificarAcciones(e);
  assert.deepEqual(c.accion.atacar.map(x => x.nombre), ['Espada larga']);
  assert.deepEqual(c.accion.magia.map(x => x.nombre), ['Proyectil mágico', 'Bola de fuego'], 'lo disponible primero');
  assert.deepEqual(c.adicional.hoja.map(x => x.nombre), ['Segundo aliento']);
  assert.deepEqual(c.adicional.comun.map(x => x.nombre), ['Apuntar']);
  assert.equal(c.reaccion.comun.length, 1); assert.equal(c.accion.mov[0].nombre, 'Voltereta');
  assert.equal(c.fuera.hoja[0].nombre, 'Detectar magia (ritual)');
  assert.deepEqual(A.cuentaPestanas(c), { accion: 4, adicional: 2, reaccion: 2, legendaria: 1, fuera: 1 });
  assert.equal(A.ECONOMIA.bonus, 'adicional'); assert.equal(A.ECONOMIA.minute, 'fuera');
  assert.ok(A.BASICAS_FUERA.includes('buscar'));
});

test('3.57 · Sorprendido: sin reacciones y atacado con ventaja', () => {
  assert.equal(puedeReaccionar(new Set(['surprised'])), false);
  assert.equal(puedeReaccionar(new Set(['prone'])), true);
  const v = ventajaAtaque({ blanco: new Set(['surprised']) });
  assert.equal(v.ventaja, true); assert.match(v.ventajas[0], /Sorprendido/);
  assert.match(TEXTO_SORPRESA, /primer turno/);
});
