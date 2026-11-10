import test from 'node:test';
import assert from 'node:assert/strict';
import { etiquetasGenericas, esGenerico, planNombres } from '../scripts/nombres-tokens.js';

const et = etiquetasGenericas(['Personaje jugador', '', null]);

test('3.24 · los nombres genéricos son las etiquetas del tipo, en inglés y en la traducción', () => {
  assert.ok(esGenerico('Non-Player Character', et)); assert.ok(esGenerico(' Player Character ', et)); assert.ok(esGenerico('Personaje jugador', et));
  assert.ok(!esGenerico('Mozo Finn', et)); assert.ok(!esGenerico('', et)); assert.equal(et.size, 3);
});

test('3.24 · el plan arregla prototipos y tokens genéricos y respeta los nombres puestos a mano', () => {
  const actores = [
    { id: 'claudia', protoName: 'Player Character', publico: 'Claudia' },
    { id: 'finn', protoName: 'Mozo Finn', publico: 'Mozo Finn' },
    { id: 'petra', protoName: 'Tharashk Hunter', publico: 'Cazadora Petra Vane' }, // el DM le puso otro nombre al token
    { id: 'renno', protoName: 'Non-Player Character', publico: 'Fat Renno' } // el nombre público, nunca el secreto
  ];
  const escenas = [
    { id: 'valle', tokens: [
      { id: 't1', actorId: 'claudia', name: 'Player Character' },
      { id: 't2', actorId: 'finn', name: 'Non-Player Character' },
      { id: 't3', actorId: 'finn', name: 'Mozo Finn' },
      { id: 't4', actorId: 'petra', name: 'Non-Player Character' },
      { id: 't5', actorId: 'renno', name: 'Non-Player Character' },
      { id: 't6', actorId: 'borrado', name: 'Non-Player Character' },
      { id: 't7', actorId: 'petra', name: 'La cazadora' }
    ] },
    { id: 'vacia', tokens: [{ id: 'x', actorId: 'finn', name: 'Mozo Finn' }] }
  ];
  const plan = planNombres(actores, escenas, et);
  assert.deepEqual(plan.prototipos, [{ _id: 'claudia', 'prototypeToken.name': 'Claudia' }, { _id: 'renno', 'prototypeToken.name': 'Fat Renno' }]);
  assert.deepEqual(plan.escenas, [{ id: 'valle', cambios: [
    { _id: 't1', name: 'Claudia' }, { _id: 't2', name: 'Mozo Finn' }, { _id: 't4', name: 'Tharashk Hunter' }, { _id: 't5', name: 'Fat Renno' }
  ] }]);
});

test('3.24 · si el nombre público también es genérico, no se cambia nada', () => {
  const plan = planNombres([{ id: 'a', protoName: 'Non-Player Character', publico: 'Non-Player Character' }],
    [{ id: 's', tokens: [{ id: 't', actorId: 'a', name: 'Non-Player Character' }] }], et);
  assert.deepEqual(plan, { prototipos: [], escenas: [] });
});
