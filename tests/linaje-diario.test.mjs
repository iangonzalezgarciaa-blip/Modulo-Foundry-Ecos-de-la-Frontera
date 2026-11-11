import test from 'node:test';
import assert from 'node:assert/strict';
import { buscarPaginaLinaje, linajeDeEleccion, pasosOjo, INDICE } from '../scripts/linaje-diario.js';

const D = {
  linajes: [{ id: 'a', alias: 'Sangre A', req: 'A' }, { id: 'b', alias: 'Linaje del ojo B', mirada: 'ojo-b' }],
  miradas: [{ id: 'ojo-b', nombre: 'Ojo B', linaje: 'b' }, { id: 'suelto', nombre: 'Ojo suelto' }]
};

test('3.26 · la página de un linaje se encuentra por su marca, no por el nombre', () => {
  const paginas = [
    { name: 'Otra', flags: {} },
    { name: 'Portada', flags: { 'ecos-frontera': { linaje: INDICE } } },
    { name: 'Sangre de A', flags: { 'ecos-frontera': { linaje: 'a' } } },
    { name: 'Copia vieja de A', flags: { 'ecos-frontera': { linaje: 'a' } } }
  ];
  assert.equal(buscarPaginaLinaje(paginas, 'a').name, 'Sangre de A', 'la primera marcada');
  assert.equal(buscarPaginaLinaje(paginas, INDICE).name, 'Portada');
  assert.equal(buscarPaginaLinaje(paginas, 'b'), null);
  assert.equal(buscarPaginaLinaje(paginas, ''), null);
  assert.equal(buscarPaginaLinaje(null, 'a'), null);
});

test('3.26 · elegir un linaje o un ojo apunta a la sangre correcta', () => {
  assert.equal(linajeDeEleccion('linaje', 'a', D), 'a');
  assert.equal(linajeDeEleccion('linaje', 'ninguno', D), null);
  assert.equal(linajeDeEleccion('linaje', 'no-existe', D), null);
  assert.equal(linajeDeEleccion('mirada', 'ojo-b', D), 'b', 'el ojo lleva a su linaje');
  assert.equal(linajeDeEleccion('mirada', 'suelto', D), null, 'un ojo sin linaje no abre ventana');
  assert.equal(linajeDeEleccion('fuerza', 'plena', D), null);
});

test('3.26 · los pasos de un ojo heredado dicen que no es un trasplante y que se cambia primero el linaje', () => {
  const p = pasosOjo('Linaje del ojo B', 'Ojo B').join(' ');
  assert.match(p, /Linaje del ojo B/); assert.match(p, /Ojo B/);
  assert.match(p, /no<\/b> marques «trasplantado»/); assert.match(p, /cambia primero el linaje/);
});
