import test from 'node:test';
import assert from 'node:assert/strict';
import { readCatalog } from '../tools/catalog.mjs';
import { requisitoDote } from '../scripts/verbe-progression.js';
import { FAMILIAS, familiaDeSangre } from '../scripts/verbe-327.js';
import { explicarOpcion, familiaSugerida, etapaJugadorHTML, AYUDA_CAMPO, AYUDA_SECCION, ETAPAS_JUGADOR } from '../scripts/verbe-ayuda.js';
const D = readCatalog();

test('3.31 · cada dios del catálogo tiene su legado: Marca, tres ramas de tres escalones y Destino', () => {
  const ids = D.linajes.filter(l => l.legado).map(l => l.id);
  assert.equal(ids.length, D.legados.legados);
  for (const id of ids) {
    const propias = D.dotes.filter(d => d.cat === `legado-${id}`);
    assert.ok(propias.find(d => d.id === `legado-${id}-marca`), `${id}: sin Marca`);
    assert.ok(propias.find(d => d.id === `legado-${id}-destino`), `${id}: sin Destino`);
    assert.equal(propias.length, 11, `${id}: ${propias.length} dotes`);
    for (const d of propias) {
      assert.ok(d.legado && d.requisitos?.dm, `${d.id}: lo concede el DM`);
      assert.ok(d.requisitos.linajes?.includes(id), `${d.id}: pide la sangre`);
      assert.ok(d.requisitos.fuerzaMin, `${d.id}: pide una fuerza`);
    }
  }
});
test('3.31 · las dotes de legado no repiten ids y las de enseñar existen', () => {
  const vistos = new Set();
  for (const d of D.dotes) { assert.ok(!vistos.has(d.id), d.id); vistos.add(d.id); }
  assert.ok(D.dotes.find(d => d.id === 'despertador'));
  assert.ok(D.dotes.find(d => d.id === 'maestro-del-verbe')?.requisitos.dotes.includes('despertador'));
});
test('3.31 · requisitoDote: sangre del legado y fuerza mínima', () => {
  const req = { nivel: 1, linajes: ['ikkra'], fuerzaMin: 'media' };
  assert.equal(requisitoDote(req, { nivel: 5, estado: { linaje: 'ikkra', fuerza: 'plena' } }).ok, true);
  assert.equal(requisitoDote(req, { nivel: 5, estado: { linaje: 'ikkra', fuerza: 'debil' } }).ok, false);
  const otra = requisitoDote(req, { nivel: 5, estado: { linaje: 'maethra', fuerza: 'plena' } });
  assert.equal(otra.ok, false);
  assert.doesNotMatch(otra.motivo, /ikkra/i, 'no dice de qué dios es');
});
test('3.31 · la familia viene con la sangre de su dios (cualquier fuerza menos «sin sangre»)', () => {
  for (const [id, f] of Object.entries(FAMILIAS)) {
    assert.equal(familiaDeSangre(D.linajes, f.dios, 'rastro'), id);
    assert.equal(familiaDeSangre(D.linajes, f.dios, 'ninguna'), null);
    assert.equal(familiaSugerida(FAMILIAS, D.linajes, f.dios), id);
  }
  assert.equal(familiaDeSangre(D.linajes, 'maethra', 'plena'), null);
  assert.equal(familiaSugerida(FAMILIAS, D.linajes, 'ninguno'), 'ninguna');
});
test('3.31 · cada etapa explica qué puede y qué no puede el jugador', () => {
  for (const n of [1, 2, 3, 4]) {
    const h = etapaJugadorHTML(n);
    assert.match(h, /Puede:/); assert.match(h, /Todavía no puede:/); assert.match(h, /En la mesa:/);
  }
  assert.equal(Object.keys(ETAPAS_JUGADOR).length, 4);
});
test('3.31 · los desplegables nuevos se explican y avisan si la familia no es de su sangre', () => {
  for (const [tipo, v] of [['car', 'wis'], ['natModo', 'dado'], ['segundaModo', 'fija'], ['reservaModo', 'dados'], ['principal', ''], ['etapa', 2]])
    assert.ok(explicarOpcion(tipo, v, { ramas: D.ramas }).length > 20, `${tipo}`);
  const ctx = { familias: FAMILIAS, linajes: D.linajes, linaje: 'maethra' };
  assert.match(explicarOpcion('familia', 'sombra', ctx), /Ojo:/);
  assert.doesNotMatch(explicarOpcion('familia', 'sombra', { ...ctx, linaje: 'nocta' }), /Ojo:/);
  for (const k of ['car', 'etapa', 'linaje', 'familia', 'fuerza', 'principal', 'reservaModo']) assert.ok(AYUDA_CAMPO[k]);
  assert.ok(Object.keys(AYUDA_SECCION).length >= 12);
});
