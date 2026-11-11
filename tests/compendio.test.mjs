import test from 'node:test';
import assert from 'node:assert/strict';
import { readCatalog } from '../tools/catalog.mjs';
import { compendioJugadoresHTML, compendioDMHTML, requisitoDoteTexto } from '../scripts/verbe-compendio.js';

const D = readCatalog();
const texto = html => html.replace(/<[^>]+>/g, ' ');

test('4.5b: el compendio de jugadores trae ramas, rangos, naturalezas y todas las dotes', () => {
  const html = compendioJugadoresHTML(D);
  for (const r of D.ramas) assert.ok(html.includes(r.nombre), r.nombre);
  for (const n of D.naturalezas) assert.ok(html.includes(n.nombre), n.nombre);
  for (const c of Object.values(D.combos)) assert.ok(html.includes(c.nombre), c.nombre);
  const filas = (html.match(/<tr>/g) ?? []).length;
  assert.ok(filas >= D.dotes.filter(d => !d.legado).length + D.ramas.length + D.rangos.length, 'una fila por dote, rama y rango (los legados de las sangres, no: son secretos)');
  assert.doesNotMatch(html, /undefined|NaN|\[object/);
});

test('4.5b: el compendio de jugadores no revela dioses, linajes ni secretos del Archivo', () => {
  const t = texto(compendioJugadoresHTML(D));
  const secretos = [
    ...D.panteon.map(d => d.nombre),
    ...D.linajes.map(l => l.real).filter(Boolean),
    ...D.miradas.map(m => m.real).filter(Boolean),
    ...(D.tradicionesShinobi ?? []).map(x => x.nombre), ...(D.bestiasShinobi ?? []).map(x => x.nombre),
    ...(D.artefactosShinobi ?? []).map(x => x.nombre),
    'Ilvarn', 'Vorrh', 'Fisura', 'Durmiente', 'solo DM', 'Solo DM'
  ].filter(s => s && s.length > 3);
  const fugas = [...new Set(secretos)].filter(s => t.includes(s));
  assert.deepEqual(fugas, []);
});

test('4.5c: el compendio del DM trae Miradas, pactos, escuelas, lo que concede y el recuento por grado', () => {
  const html = compendioDMHTML(D);
  for (const m of D.miradas) assert.ok(html.includes(m.nombre), m.nombre);
  for (const p of D.pactos) assert.ok(html.includes(p.linaje), p.linaje);
  assert.ok(html.includes('Eco de los Primeros'));
  assert.ok(html.includes(`Total: ${D.tecnicas.length} técnicas`));
  assert.doesNotMatch(html, /undefined|NaN|\[object/);
});

test('requisito de una dote sin texto propio se arma con nivel, ramas, dotes y el DM', () => {
  const Dm = { ramas: [{ id: 'forma', nombre: 'Forma' }], rangos: [{ nombre: 'Novato' }, { nombre: 'Entrenado' }], dotes: [{ id: 'a', nombre: 'Primera' }] };
  assert.equal(requisitoDoteTexto({ requisitos: { nivel: 5, ramas: { forma: 1 }, dotes: ['a'], dm: true } }, Dm), 'nivel 5; Forma, Entrenado; Primera; lo concede el DM');
  assert.equal(requisitoDoteTexto({ req: 'nivel 3' }, Dm), 'nivel 3');
  assert.equal(requisitoDoteTexto({ requisitos: {} }, Dm), 'nada');
});
