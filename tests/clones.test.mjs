import test from 'node:test';
import assert from 'node:assert/strict';
import { readCatalog } from '../tools/catalog.mjs';
import { CLONES, clonDe, limitesClones, repartoClones } from '../scripts/verbe-clones.js';
const D = readCatalog();

test('las técnicas de clones existen y los cuerpos elementales pasan al sistema de fichas propias', () => {
  for (const id of Object.keys(CLONES)) assert.ok(D.tecnicas.find(t => t.id === id), id);
  const sombra = D.tecnicas.find(t => t.id === 'forma-clon-sombra');
  assert.equal(sombra.rara, true); assert.equal(sombra.g, 5);
  assert.equal(clonDe(sombra.item.flags['ecos-frontera'].verbe).tipo, 'sombra');
  assert.equal(clonDe({ id: 'forma-replica-solida' }), null);
  assert.deepEqual(D.dotes.filter(d => d.clonDote).map(d => d.id), ['clon-economico', 'clon-multiple', 'clon-legion']);
});

test('copias y Verbe por clon: límites por dotes y por la reserva', () => {
  const c = clonDe({ id: 'forma-clon-sombra' });
  assert.deepEqual(limitesClones(c, {}), { copias: 1, minimo: 2, descuento: 0 });
  assert.deepEqual(limitesClones(c, { dotes: ['clon-economico', 'clon-multiple'] }), { copias: 2, minimo: 1, descuento: 1 });
  assert.equal(limitesClones(c, { dotes: ['clon-legion'], competencia: 4 }).copias, 16);
  assert.equal(limitesClones(clonDe({ id: 'forma-clon-tierra' }), { dotes: ['clon-legion'], competencia: 4 }).copias, 1);
  const lim = limitesClones(c, { dotes: ['clon-multiple'] });
  assert.deepEqual(repartoClones({ copias: 2, verbe: 5 }, { disponible: 10, limites: lim }), { ok: true, copias: 2, verbe: 5, total: 10 });
  assert.match(repartoClones({ copias: 2, verbe: 6 }, { disponible: 10, limites: lim }).motivo, /pide 12/);
  assert.match(repartoClones({ copias: 3, verbe: 2 }, { disponible: 10, limites: lim }).motivo, /de 1 a 2/);
  assert.match(repartoClones({ copias: 1, verbe: 1 }, { disponible: 10, limites: lim }).motivo, /al menos 2/);
});

test('4.3: veinte formas sin elemento, grados 0 a 5, para quien no tiene naturaleza', () => {
  const fp = D.tecnicas.filter(t => t.formaPura);
  assert.equal(fp.length, 20);
  assert.ok(fp.every(t => t.rama === 'forma' && !t.nat && t.g >= 0 && t.g <= 5));
  assert.ok(new Set(fp.map(t => t.g)).size === 6);
});

test('4.7: cada técnica genérica recibe un icono claro de dnd5e y las dotes uno por categoría', async () => {
  const { iconoTecnica, iconoDote, esGenerico } = await import('../scripts/verbe-iconos.js');
  const genericas = D.tecnicas.filter(t => esGenerico(t.item.img));
  assert.ok(genericas.length > 400);
  const sin = genericas.filter(t => !iconoTecnica(t.item));
  assert.equal(sin.length, 0, sin.slice(0, 5).map(t => t.id).join(', '));
  assert.match(iconoTecnica(D.tecnicas.find(t => t.id === 'cuerpo-palma-desvia').item), /checked-shield/);
  assert.match(iconoTecnica(D.tecnicas.find(t => t.id === 'forma-pura-dardo').item), /force/);
  assert.match(iconoDote({ cat: 'defensa' }), /checked-shield/);
  assert.equal(esGenerico('systems/dnd5e/icons/svg/damage/fire.svg'), false);
});

test("3.39 · el entrenamiento de los clones cuenta días con tope diario", async () => {
  const { creditoEntrenamiento, usarBancoClones, HORAS_DIA_ENTRENO } = await import("../scripts/verbe-clones.js");
  assert.equal(HORAS_DIA_ENTRENO, 8);
  assert.deepEqual(creditoEntrenamiento({ horas: 8, tope: 2 }), { dias: 1, recortados: 0, sobranHoras: 0, hoy: 1, tope: 2 });
  // Horas sueltas se guardan y completan un día después.
  assert.equal(creditoEntrenamiento({ horas: 5, tope: 2 }).dias, 0);
  assert.equal(creditoEntrenamiento({ horas: 5, tope: 2 }).sobranHoras, 5);
  assert.equal(creditoEntrenamiento({ horas: 3, horasPrevias: 5, tope: 2 }).dias, 1);
  // Tope diario: competencia del Verbe; lo que pasa se pierde.
  const r = creditoEntrenamiento({ horas: 40, yaHoy: 1, tope: 3 });
  assert.equal(r.dias, 2); assert.equal(r.recortados, 3); assert.equal(r.hoy, 3);
  assert.equal(creditoEntrenamiento({ horas: 16, yaHoy: 3, tope: 3 }).dias, 0);
  assert.equal(creditoEntrenamiento({ horas: -4, tope: 2 }).dias, 0);
  // El banco cubre días enteros de un entrenamiento.
  assert.deepEqual(usarBancoClones(3, 2), { usa: 2, queda: 1, faltan: 0 });
  assert.deepEqual(usarBancoClones(1, 2.5), { usa: 1, queda: 0, faltan: 1.5 });
  assert.equal(usarBancoClones(0, 4).usa, 0);
});
