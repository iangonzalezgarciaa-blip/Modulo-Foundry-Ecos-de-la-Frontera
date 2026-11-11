import test from 'node:test';
import assert from 'node:assert/strict';
import { debePreguntar, repartir, esAccionDelModulo, MODOS_PASE } from '../scripts/pase-dm.js';

const accion = { 'ecos-frontera': { accionComun: { id: 'cha' } } }, tecnica = { 'ecos-frontera': { verbe: { id: 'x' } } }, espada = {};
const otro = { uuid: 'Scene.a.Token.1', nombre: 'Lobo', propio: false }, mio = { uuid: 'Scene.a.Token.2', nombre: 'Claudia', propio: true };
const base = { esGM: false, modo: 'acciones', objetivos: [otro], yaTienePase: false, hayDM: true };

test('3.26 · el pase del DM se pide solo cuando un jugador usa una acción del módulo sobre otra criatura', () => {
  assert.ok(esAccionDelModulo(accion)); assert.ok(esAccionDelModulo(tecnica)); assert.ok(!esAccionDelModulo(espada)); assert.ok(!esAccionDelModulo(undefined));
  assert.ok(debePreguntar({ ...base, flags: accion }));
  assert.ok(debePreguntar({ ...base, flags: tecnica }));
  assert.ok(!debePreguntar({ ...base, flags: espada }), 'un arma común no, en el modo por defecto');
  assert.ok(debePreguntar({ ...base, flags: espada, modo: 'todas' }), 'en «todas», también un arma');
  assert.ok(!debePreguntar({ ...base, flags: accion, modo: 'no' }));
  assert.ok(!debePreguntar({ ...base, flags: accion, esGM: true }), 'el DM no se pide permiso a sí mismo');
  assert.ok(!debePreguntar({ ...base, flags: accion, yaTienePase: true }), 'con el pase dado no vuelve a preguntar');
  assert.ok(!debePreguntar({ ...base, flags: accion, hayDM: false }), 'sin DM conectado la acción sigue sola');
  assert.ok(!debePreguntar({ ...base, flags: accion, objetivos: [] }), 'sin objetivo no hay a quién afectar');
  assert.ok(!debePreguntar({ ...base, flags: accion, objetivos: [mio] }), 'sobre uno mismo o un aliado propio no pregunta');
  assert.ok(!debePreguntar({ ...base, flags: accion, modo: 'inventado' }));
  assert.deepEqual(Object.keys(MODOS_PASE), ['acciones', 'todas', 'no']);
});

test('3.26 · la respuesta del DM deja solo a las criaturas aprobadas (y a las propias)', () => {
  const lobo2 = { uuid: 'Scene.a.Token.3', nombre: 'Lobo 2', propio: false };
  const r = repartir([otro, mio, lobo2], ['Scene.a.Token.3']);
  assert.deepEqual(r.quedan.map(t => t.nombre), ['Claudia', 'Lobo 2']);
  assert.deepEqual(r.fuera.map(t => t.nombre), ['Lobo']);
  assert.deepEqual(repartir([otro], []).quedan, []);
  assert.deepEqual(repartir([otro], undefined).fuera.map(t => t.nombre), ['Lobo'], 'sin respuesta no afecta a nadie');
});
