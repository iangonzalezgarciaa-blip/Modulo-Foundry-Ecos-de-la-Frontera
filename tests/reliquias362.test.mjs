import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import './helpers/foundry.mjs';
const A = await import('../scripts/reliquias-almacen.js');
const P = await import('../scripts/subir-pnj.js');
const { decodeCatalog, readCatalog } = await import('../tools/catalog.mjs');
const R = decodeCatalog(fs.readFileSync(new URL('../data/reliquias.txt', import.meta.url), 'utf8')).reliquias;

test('3.62 · etapa 0: nombre sin identificar sacado del aspecto, corto y sin palabras colgando', () => {
  for (const r of R) {
    const n = A.nombreSinIdentificar(r);
    assert.match(n, / · sin identificar$/, r.id);
    const base = n.replace(/ · sin identificar$/, '');
    assert.ok(base.length >= 4 && base.split(' ').length <= 6, `${r.id}: «${base}»`);
    assert.doesNotMatch(base, /\s(y|de|con|del|la|el)$/i, r.id);
    assert.ok(!base.includes(r.nombre), `${r.id}: el nombre sin identificar no revela el real`);
  }
  assert.equal(A.nombreSinIdentificar(R.find(r => r.id === 'mia-curse-steel')), 'Barra de acero negro mate · sin identificar');
  assert.equal(A.nombreSinIdentificar({}), 'Objeto extraño · sin identificar');
});

test('3.62 · CD para identificar, métodos y textos (el jugador no ve qué hace)', () => {
  assert.equal(A.cdIdentificar({ nivel: 1 }), 11); assert.equal(A.cdIdentificar({ nivel: 11 }), 16); assert.equal(A.cdIdentificar({ nivel: 20 }), 20);
  const r = R.find(x => x.id === 'mia-curse-steel');
  const sin = A.textoSinIdentificar(r);
  assert.match(sin, /barra de acero negro/i); assert.match(sin, /CD 16/); assert.match(sin, /Identificar/); assert.match(sin, /Descanso Largo/);
  assert.ok(!sin.includes(r.texto) && !sin.includes(r.nombre), 'no revela qué hace ni cómo se llama');
  assert.match(A.chatReliquia(r, 0), /Sin identificar/); assert.ok(!A.chatReliquia(r, 0).includes(r.nombre));
  assert.match(A.chatReliquia(r, 2), /Despierta/); assert.ok(A.chatReliquia(r, 2).includes(r.nombre));
  assert.equal(A.ETAPAS_RELIQUIA[0].nombre, 'Sin identificar'); assert.equal(A.ETAPA_MAX, 3);
  assert.match(A.despertarReliquia(r)[1], /CD 16/);
  assert.equal(A.exitoEstudio({ total: 15, cd: 16 }), false); assert.equal(A.exitoEstudio({ total: 16, cd: 16 }), true); assert.equal(A.exitoEstudio({ total: 9, cd: 16, natural: 20 }), true);
});

test('3.62 · datos de cada etapa y lo que cambia al identificarla', () => {
  const r = R.find(x => x.id === 'mia-curse-steel');
  const e0 = A.datosEtapa(r, 0, { embebida: true });
  assert.equal(e0['system.identified'], false); assert.equal(e0.name, 'Acero del Velo Herido (Sin identificar)');
  assert.equal(e0['flags.ecos-frontera.almacen.etapa'], 0); assert.equal(e0['flags.ecos-frontera.reliquia.autorizada'], false);
  assert.ok(e0['system.unidentified.description'] && e0['system.description.chat'] && e0['flags.ecos-frontera.almacen.siguiente']);
  assert.equal(A.datosEtapa(r, 0)['system.identified'], true, 'en la carpeta del DM se ve con su nombre');
  const e2 = A.datosEtapa(r, 2, { embebida: true });
  assert.equal(e2['system.identified'], true); assert.equal(e2['flags.ecos-frontera.reliquia.autorizada'], true); assert.equal(e2['flags.ecos-frontera.almacen.siguiente'], null);
  assert.equal(A.datosEtapa(r, 9)['flags.ecos-frontera.almacen.etapa'], 3);
  const u = A.updateIdentificada({ nombre: r.nombre, siguiente: '<p>x</p>', siguienteChat: '<p>c</p>' });
  assert.equal(u.name, 'Acero del Velo Herido (Dormida)'); assert.equal(u['system.identified'], true); assert.equal(u['system.description.value'], '<p>x</p>');
  assert.equal(u['flags.ecos-frontera.almacen.etapa'], 1); assert.equal(u['flags.ecos-frontera.almacen.estudioFallido'], false);
  const m = A.manualReliquia(r, { historia: '@UUID[JournalEntry.a.JournalEntryPage.b]{Acero del Velo Herido}' });
  assert.match(m, /Historia secreta:<\/b> @UUID/); assert.match(m, /identificar CD 16/); assert.match(m, /Barra de acero negro mate/);
  assert.match(A.manualReliquia(r), /todavía no tiene página/);
});

test('3.62 · historias secretas: se encuentran por nombre aunque lleven numeración o etapa', () => {
  assert.equal(A.normalizarNombre('12 · Acero del Velo Herido'), 'acero del velo herido');
  assert.equal(A.normalizarNombre('Acero del Velo Herido (Dormida)'), 'acero del velo herido');
  assert.equal(A.normalizarNombre('Cápsula del Estrépito'), 'capsula del estrepito');
});

test('3.62 · Tacto del archivero está en el catálogo', () => {
  const d = readCatalog().dotes.find(x => x.id === 'tacto-archivero');
  assert.ok(d); assert.equal(d.trazos, 1); assert.equal(d.requisitos.ramas.rastro, 1);
});

test('3.62 · Nivel PNJ: escalera de VD, PG proporcionales, mejora y CA', () => {
  assert.equal(P.siguienteVD(0), 0.125); assert.equal(P.siguienteVD(0.5), 1); assert.equal(P.siguienteVD(1, -1), 0.5); assert.equal(P.siguienteVD(30), 30); assert.equal(P.siguienteVD(0, -1), 0);
  assert.equal(P.siguienteVD(2.5), 3); assert.equal(P.siguienteVD(2.5, -1), 2);
  assert.equal(P.textoVD(0.25), '1/4'); assert.equal(P.textoVD(7), '7');
  assert.deepEqual(P.leerFormula('4d8 + 4'), { n: 4, d: 8, mod: 4 }); assert.deepEqual(P.leerFormula('2d6-2'), { n: 2, d: 6, mod: -2 }); assert.equal(P.leerFormula('5'), null);
  assert.equal(P.formulaPG(5, 8, 1), '5d8 + 5'); assert.equal(P.formulaPG(3, 6, -1), '3d6 - 3'); assert.equal(P.formulaPG(3, 6, 0), '3d6');
  const bandido = { cr: 3, hpMax: 14, hpValue: 14, formula: '4d8 + 4', abil: { str: 14, dex: 16, con: 12, int: 10, wis: 10, cha: 10 }, ca: 0, verbe: null, spell: null };
  const p = P.pasoPNJ(bandido, 1);
  assert.equal(p.cr, 4); assert.equal(p.formula, '5d8 + 5'); assert.equal(p.hpMax, Math.round(14 * 5 / 4)); assert.equal(p.hpValue, p.hpMax);
  assert.equal(p.abil.dex, 18); assert.equal(p.car, 'dex'); assert.equal(p.ca, 1);
  assert.ok(p.notas.some(n => /\+2 DES/.test(n)) && p.notas.some(n => /\+1 CA/.test(n)));
  // Pocos PG a propósito: siguen siendo pocos (proporción de sus dados, no la tabla de la Guía).
  assert.ok(p.hpMax < 30);
  const sinFormula = P.pasoPNJ({ cr: 1, hpMax: 10, hpValue: 5, formula: '', abil: {}, ca: 0 }, 1);
  assert.equal(sinFormula.cr, 2); assert.ok(sinFormula.hpMax > 10 && sinFormula.hpMax <= 20); assert.equal(sinFormula.hpValue, Math.round(5 * sinFormula.hpMax / 10));
  const conVerbe = P.pasoPNJ({ cr: 7, hpMax: 40, formula: '6d10 + 12', abil: { con: 14 }, verbe: 7, spell: 7 }, 1);
  assert.equal(conVerbe.verbe, 8); assert.equal(conVerbe.spell, 8); assert.equal(conVerbe.ca, 1, 'VD 8 sube la CA');
  const baja = P.pasoPNJ({ cr: 5, hpMax: 40, formula: '6d8 + 6', abil: { con: 12 }, ca: 2 }, -1);
  assert.equal(baja.cr, 4); assert.equal(baja.ca, 1); assert.ok(baja.hpMax < 40);
  assert.equal(P.pasoPNJ({ cr: 30, hpMax: 500, formula: '' }, 1), null);
  assert.equal(P.mejorCar({ str: 16, dex: 16 }), 'str');
});
