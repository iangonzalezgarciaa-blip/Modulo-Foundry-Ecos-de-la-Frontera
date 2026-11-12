import test from 'node:test';
import assert from 'node:assert/strict';
import './helpers/foundry.mjs';
const E = await import('../scripts/escenarios.js');
const { ESCENARIOS, SUCESOS_COMUNES } = await import('../scripts/escenarios-datos.js');

test('3.59 · compendio: 19 escenarios con 10 sucesos cada uno, todos con lo necesario', () => {
  assert.equal(Object.keys(ESCENARIOS).length, 19);
  const SAL = new Set(['str', 'dex', 'con', 'int', 'wis', 'cha']), A = new Set(['actua', 'azar', 'cerca', 'todos', 'ninguno']);
  for (const [k, e] of Object.entries(ESCENARIOS)) {
    assert.equal(e.eventos.length, 10, k); assert.ok(e.n && e.d && e.tactica.length >= 2, k);
    for (const ev of e.eventos) {
      assert.ok(ev.t && ['salv', 'terreno', 'ventaja', 'narrativo'].includes(ev.tipo) && A.has(ev.a), `${k}: ${ev.t}`);
      if (ev.tipo === 'salv') assert.ok(SAL.has(ev.salv), `${k}: ${ev.t}`);
      if (ev.dano) assert.ok(['bajo', 'medio', 'alto'].includes(ev.dano) && ev.dt, `${k}: ${ev.t}`);
      if (ev.tipo !== 'salv') assert.ok(ev.ef, `${k}: ${ev.t} necesita efecto`);
      assert.ok(!/naruto|abyss|nimerios|arcegris/i.test(ev.t + (ev.ef ?? '')));
    }
  }
  assert.ok(SUCESOS_COMUNES.length >= 5);
});

test('3.59 · nivelado: CD y dados según el nivel del grupo', () => {
  assert.equal(E.cdEscenario(1), 11); assert.equal(E.cdEscenario(5), 13); assert.equal(E.cdEscenario(20), 20);
  assert.equal(E.dadosEscenario('bajo', 3), '1d6'); assert.equal(E.dadosEscenario('medio', 7), '3d6'); assert.equal(E.dadosEscenario('alto', 18), '11d6');
  const ev = E.nivelar({ t: 'x', tipo: 'salv', salv: 'dex', dano: 'medio', dt: 'fire', a: 'cerca' }, 6);
  assert.equal(ev.cd, 13); assert.equal(ev.formula, '3d6');
  assert.equal(E.nivelar({ t: 'x', tipo: 'narrativo', ef: 'y', a: 'ninguno' }, 6).cd, null);
  const s = E.elegirSuceso('cueva', n => (n === 6 ? 1 : 0)); assert.equal(s.escenario, 'Cueva o túnel'); assert.equal(s.t, ESCENARIOS.cueva.eventos[0].t);
  assert.equal(E.elegirSuceso('cueva', () => 0).escenario, 'Cueva o túnel'.length ? E.elegirSuceso('cueva', () => 0).escenario : '');
  assert.equal(E.elegirSuceso('nada', () => 0).escenario, 'Cualquiera');
});

test('3.59 · balance con aliados PNJ y consejos', () => {
  assert.deepEqual(E.aporteAliado(0), { bajo: 0, moderado: 0, alto: 0 });
  assert.deepEqual(E.aporteAliado(0.5), { bajo: 50, moderado: 75, alto: 100 });
  assert.equal(E.aporteAliado(3).alto, 400);
  const solo = E.balanceBandos({ nivelesPJ: [3, 3], crHostiles: [2, 2, 1] });
  const con = E.balanceBandos({ nivelesPJ: [3, 3], crAliados: [2], crHostiles: [2, 2, 1] });
  assert.ok(con.p.alto > solo.p.alto); assert.equal(solo.xp, con.xp);
  const r = E.recomendaciones({ clase: 'letal', nPJ: 3, nAliados: 1, nHostiles: 1, solas: 1, escenario: ESCENARIOS.cueva });
  assert.ok(r.some(x => /oleadas/.test(x)) && r.some(x => /economía de acciones/.test(x)) && r.some(x => /^Cueva/.test(x)) && r.some(x => /aliado/.test(x)));
  assert.equal(E.UMBRALES.normal.u, 18);
});
