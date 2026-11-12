import test from 'node:test';
import assert from 'node:assert/strict';
import './helpers/foundry.mjs';
const { nivelarTextoPF2e, MARCA_NIVELADO, nivelMaximoPNJ } = await import('../scripts/conjuros.js');
const { ETAPAS_RELIQUIA, textoEtapa, manualReliquia, despertarReliquia } = await import('../scripts/reliquias-almacen.js');

test('3.37 · los conjuros de PF2e se nivelan a D&D (Alzar un escudo, Golpe, bonificadores, prueba plana)', () => {
  const t = nivelarTextoPF2e('<p>Puede usar la acción Alzar un escudo para obtener un bonificador por circunstancia +2 a la CA. Haz un Golpe. Prueba plana CD 5. Dureza 4. Mantener.</p>');
  assert.doesNotMatch(t, /Alzar un escudo|por circunstancia|\bGolpe\b|Dureza/);
  assert.match(t, /levantar la guardia/); assert.match(t, /ataque con arma/); assert.match(t, /con 5 o más/); assert.match(t, /absorbe 4/);
  assert.ok(t.includes(MARCA_NIVELADO)); assert.equal(nivelarTextoPF2e(t), t, 'no se nivela dos veces');
  assert.match(nivelarTextoPF2e('<p>Golpe sin armas.</p>'), /Golpe sin armas/);
});
test('3.37 · un PNJ aprende hasta la mitad de su nivel de lanzador (o su VD)', () => {
  assert.equal(nivelMaximoPNJ(9), 5); assert.equal(nivelMaximoPNJ(0, 4), 2); assert.equal(nivelMaximoPNJ(20), 9);
});
test('3.37 · cada reliquia tiene tres etapas y un manual con cómo despertarlas', () => {
  const r = { id: 'x', nombre: 'Dosel', grado: '3', nivel: 1, texto: 'Protege de la lluvia.', canon: 'Archivo.' };
  assert.equal(ETAPAS_RELIQUIA.length, 4); // 3.62: la etapa 0 «Sin identificar»
  assert.match(textoEtapa(r, 1), /Dormida/); assert.match(textoEtapa(r, 3), /Resonante/);
  const m = manualReliquia(r); assert.match(m, /Cómo se despierta/); assert.match(m, /CD 16/);
  assert.ok(despertarReliquia(r)[2] && despertarReliquia(r)[3]);
});
test('3.37 · subir de nivel dice qué gana en el próximo nivel', async () => {
  const { queGana } = await import('../scripts/subir-nivel.js');
  const g = queGana([{ type: 'HitPoints', level: 0 }, { type: 'ItemGrant', level: 3, title: 'Rasgos', items: ['Acción astuta'] }, { type: 'AbilityScoreImprovement', level: 4 }], 3);
  assert.equal(g.length, 2); assert.match(g[1].texto, /Acción astuta/);
  assert.match(queGana([{ type: 'AbilityScoreImprovement', level: 4 }], 4)[0].texto, /\+2 a una/);
});
