import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import './helpers/foundry.mjs';
const { textoEtapa, manualReliquia, despertarReliquia } = await import('../scripts/reliquias-almacen.js');
const { decodeCatalog } = await import('../tools/catalog.mjs');

test('3.46 · cada reliquia trae aspecto, qué es y su hito propio', () => {
  const R = decodeCatalog(fs.readFileSync(new URL('../data/reliquias.txt', import.meta.url), 'utf8')).reliquias;
  assert.equal(R.length, 78);
  for (const r of R) assert.ok(r.aspecto && r.que && r.hito, `falta aspecto/qué/hito en ${r.id}`);
});
test('3.46 · el jugador ve aspecto y qué es, nunca el hito; el DM lo ve en el manual', () => {
  const r = { id: 'x', nombre: 'Clavo', grado: '2', nivel: 5, texto: '+2 CA.', canon: 'Archivo.', aspecto: 'Un clavo viejo.', que: 'Un clavo de un puesto.', hito: 'Sostener la posición mientras los demás escapan.' };
  for (const n of [1, 2, 3]) {
    const t = textoEtapa(r, n);
    assert.match(t, /Un clavo viejo/); assert.match(t, /Un clavo de un puesto/);
    assert.doesNotMatch(t, /Sostener la posición|Cómo se despierta/);
  }
  const m = manualReliquia(r);
  assert.match(m, /Sostener la posición/); assert.match(m, /Origen: Archivo/);
  assert.match(despertarReliquia(r)[3], /Sostener la posición/);
  assert.doesNotMatch(despertarReliquia({ ...r, hito: undefined })[3], /Sostener/);
});
