import test from 'node:test';
import assert from 'node:assert/strict';
import { readCatalog } from '../tools/catalog.mjs';
import { CAMPOS_TECNICA, CAMPOS_DOTE, leerCamposTecnica, leerCamposDote, diferencias, aplicarEdicionTecnica, catalogoConEdiciones } from '../scripts/verbe-ediciones.js';
import { problemasTecnica } from '../scripts/verbe-validate.js';

const D = readCatalog();
const tec = id => D.tecnicas.find(t => t.id === id);

test('solo se guardan los campos que cambian frente al original', () => {
  const orig = leerCamposTecnica(tec('fuego-aliento'));
  assert.equal(orig.areaTam, 4.5); assert.equal(orig.dadosN, 3); assert.equal(orig.tiempo, 'A');
  const r = diferencias(CAMPOS_TECNICA, orig, { ...orig, n: 'Aliento de ascuas', dadosN: '4', areaTam: '6' });
  assert.equal(r.ok, true);
  assert.deepEqual(r.cambios, { n: 'Aliento de ascuas', dadosN: 4, areaTam: 6 });
  assert.equal(diferencias(CAMPOS_TECNICA, orig, { dadosD: 7 }).ok, false);
  assert.equal(diferencias(CAMPOS_TECNICA, orig, { costo: -1 }).ok, false);
});

test('la edición cambia la técnica sin tocar el original y sigue siendo válida', () => {
  const base = tec('fuego-aliento');
  const antes = JSON.stringify(base);
  const t = aplicarEdicionTecnica(base, { n: 'Aliento de ascuas', dadosN: 4, areaTam: 6, costo: 3, texto: 'Un cono de ascuas.' });
  assert.equal(JSON.stringify(base), antes);
  assert.equal(t.n, 'Aliento de ascuas'); assert.equal(t.item.name, 'Aliento de ascuas');
  const act = Object.values(t.item.system.activities)[0];
  assert.equal(act.damage.parts[0].number, 4);
  assert.equal(t.item.system.target.template.size, 6);
  assert.equal(t.area, 'cono 20 ft', '3.27: lo que se lee va en pies (6 m)');
  assert.equal(t.item.flags['ecos-frontera'].verbe.costoBase, 3);
  assert.match(t.item.system.description.value, /<h3>Qué hace<\/h3><p>Un cono de ascuas\.<\/p>/);
  assert.match(t.item.system.description.value, /Ajustada por el DM/);
  assert.equal(problemasTecnica(t).filter(p => p.nivel === 'error').length, 0);
  // Aplicar dos veces no duplica la nota.
  const dos = aplicarEdicionTecnica(t, { n: 'Otra' });
  assert.equal((dos.item.system.description.value.match(/Ajustada por el DM/g) ?? []).length, 1);
});

test('el catálogo con ediciones solo reemplaza lo editado y restaurar es borrar la diferencia', () => {
  const base = { tecnicas: D.tecnicas, dotes: D.dotes };
  const d0 = D.dotes[0];
  const r = catalogoConEdiciones(base, { tecnicas: { 'fuego-aliento': { dadosN: 5 } }, dotes: { [d0.id]: { trazos: 9 } } });
  assert.equal(r.tecnicas.length, D.tecnicas.length);
  assert.equal(r.tecnicas.filter(t => t.editadaDM).length, 1);
  assert.equal(r.tecnicas.find(t => t.id === 'fuego-aliento').dmg, '5d6 fuego');
  assert.equal(r.dotes.find(d => d.id === d0.id).trazos, 9);
  assert.equal(r.tecnicas.find(t => t.id === 'fuego-cola'), tec('fuego-cola'));
  const sin = catalogoConEdiciones(base, { tecnicas: {}, dotes: {} });
  assert.equal(sin.tecnicas.find(t => t.id === 'fuego-aliento'), tec('fuego-aliento'));
  assert.deepEqual(diferencias(CAMPOS_DOTE, leerCamposDote(d0), leerCamposDote(d0)).cambios, {});
});
