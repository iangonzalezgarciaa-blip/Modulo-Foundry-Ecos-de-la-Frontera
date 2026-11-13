import test from 'node:test';
import assert from 'node:assert/strict';
import './helpers/foundry.mjs';
const E = await import('../scripts/verbe-entreno.js');
import { readCatalog } from '../tools/catalog.mjs';
const D = readCatalog();

test('3.64 · dado de control según la etapa (Aprendiz 1d4 … Pleno 1d2−1)', () => {
  assert.equal(E.dadoControl(1).formula, '1d4'); assert.equal(E.dadoControl(2).formula, '1d3'); assert.equal(E.dadoControl(3).formula, '1d2'); assert.equal(E.dadoControl(4).formula, '1d2−1');
  assert.equal(E.dadoControl(0).formula, '1d4'); assert.equal(E.dadoControl(9).formula, '1d2−1');
  assert.deepEqual(E.tirarControl(1, () => 0.99), { formula: '1d4', dado: 4, valor: 4 });
  assert.deepEqual(E.tirarControl(1, () => 0), { formula: '1d4', dado: 1, valor: 1 });
  assert.equal(E.tirarControl(4, () => 0).valor, 0); assert.equal(E.tirarControl(4, () => 0.9).valor, 1);
  for (let i = 0; i < 200; i++) { const r = E.tirarControl(2); assert.ok(r.valor >= 1 && r.valor <= 3); }
  assert.equal(E.textoCostoControl(2, 1), '2 + 1d4'); assert.equal(E.textoCostoControl(2, 1, false), '2');
});

test('3.64 · dones y dotes entrenadas', () => {
  const de = id => D.dotes.find(d => d.id === id);
  assert.equal(E.tipoDote(de('innato-cuerpo')), 'don');
  assert.equal(E.tipoDote(de('legado-ignis-marca')), 'don');
  assert.equal(E.tipoDote(de('corazon-fuego')), 'don');
  assert.equal(E.tipoDote(de('control-fino')), 'entrenada');
  assert.equal(E.tipoDote(de('reserva-profunda')), 'entrenada');
  assert.equal(E.tipoDote(de('senda-forma-1')), 'entrenada');
  assert.equal(E.tipoDote(de('control-fino'), { 'control-fino': 'don' }), 'don', 'el DM manda');
  for (const d of D.dotes) assert.ok(['don', 'entrenada'].includes(d.tipo), d.id);
  assert.ok(D.ajustes364.dones > 200 && D.ajustes364.entrenadas > 150);
});

test('3.64 · entrenar una dote: horas o días; un 20 al instante, un 1 pierde un bloque', () => {
  assert.deepEqual(E.planDote(1), { unidad: 'horas', bloque: 2, exitos: 1, cd: 11 });
  assert.equal(E.planDote(3).exitos, 2); assert.equal(E.planDote(4).unidad, 'dias'); assert.equal(E.planDote(8).exitos, 4);
  const ent = { ...E.planDote(5), progreso: 1 };
  const veinte = E.practicarDote(ent, { total: 3, natural: 20, dia: 10 });
  assert.equal(veinte.terminado, true); assert.equal(veinte.instante, true);
  const uno = E.practicarDote(ent, { total: 30, natural: 1, dia: 10 });
  assert.equal(uno.progreso, 0); assert.equal(uno.exito, false);
  const ok = E.practicarDote(ent, { total: 15, natural: 9, dia: 10 });
  assert.equal(ok.progreso, 2); assert.equal(ok.terminado, false);
  assert.equal(E.practicarDote(ok.entreno, { total: 20, natural: 12, dia: 10 }).ok, false, 'las de días: una por día');
  const horas = { ...E.planDote(3), progreso: 0, ultimoDia: 10 };
  assert.equal(E.practicarDote(horas, { total: 20, natural: 12, dia: 10 }).ok, true, 'las de horas: varias en el día');
  assert.match(E.textoPlan(E.planDote(3)), /2 bloques buenos de 4 h/);
});

test('3.64 · crecer entrenando o meditando: puntos, Trazo y tope por nivel', () => {
  assert.equal(E.puntosPorTrazo({}), 5); assert.equal(E.puntosPorTrazo({ companero: true }), 4); assert.equal(E.puntosPorTrazo({ sensei: true, companero: true }), 3);
  let c = {}; let r;
  for (let d = 1; d <= 5; d++) { r = E.diaCrecimiento(c, { total: 16, natural: 10, dia: d, nivel: 3 }); c = r.estado; }
  assert.equal(r.trazo, 1); assert.equal(c.puntos, 0); assert.equal(c.ganados[3], 1);
  assert.equal(E.diaCrecimiento(c, { total: 16, natural: 10, dia: 5, nivel: 3 }).ok, false, 'uno por día');
  const s = E.diaCrecimiento({ puntos: 1 }, { total: 2, natural: 20, dia: 9, nivel: 3, sensei: true });
  assert.equal(s.trazo, 1, 'con maestro bastan 3: 1 + 2 del 20');
  const tope = E.diaCrecimiento({ ganados: { 3: E.TOPE_CRECIMIENTO_NIVEL } }, { total: 20, natural: 15, dia: 1, nivel: 3 });
  assert.equal(tope.ok, false); assert.match(tope.motivo, /Trazos entrenando en este nivel/);
});

test('3.64 · Guardia de Verbe: +1 a la CA y +1 a todas las salvaciones', () => {
  const g = D.tecnicas.find(t => t.id === 'forma-pura-guardia');
  assert.deepEqual(g.item.effects[0].changes.map(c => c.key).sort(), ['system.attributes.ac.bonus', 'system.bonuses.abilities.save']);
  assert.match(g.texto, /todas tus tiradas de salvación/); assert.ok(g.cambios.length);
});

test('3.64 · al usar una técnica se suma el dado de control y nunca impide usarla', async () => {
  const H = await import('./helpers/foundry.mjs');
  const V = await import('../scripts/verbe.js');
  H.resetEnvironment(); V.usarDatos(D, 'activo'); game.user = game.users.get('player');
  H.settings.set('dadoControl', true);
  const tecnica = D.tecnicas.find(t => t.id === 'fuego-aliento');
  const a = new H.MockActor(5, { valor: 20, etapa: 1 });
  const item = new H.MockItem(V.datosItem(a, tecnica), a); a.items.push(item);
  const base = V.previsualizarUso(a, item.getFlag('ecos-frontera', 'verbe')).costo;
  globalThis.CONFIG.Dice = { randomUniform: () => 0.99 };   // 1d4 → 4
  const usage = {}, updates = {};
  V.alConsumir({ actor: a, item }, usage, {}, updates);
  assert.equal(usage.ecosVerbe.control.formula, '1d4'); assert.equal(usage.ecosVerbe.control.valor, 4);
  assert.equal(usage.ecosVerbe.costo, base + 4);
  assert.equal(updates.actor['flags.ecos-frontera.verbe.valor'], 20 - base - 4);
  // Al límite: el dado se lleva lo que quede, pero la técnica sale.
  const b = new H.MockActor(5, { valor: 0, etapa: 1 }); const ib = new H.MockItem(V.datosItem(b, tecnica), b); b.items.push(ib);
  const u2 = {}, up2 = {};
  assert.notEqual(V.alConsumir({ actor: b, item: ib }, u2, {}, up2), false);
  assert.ok(u2.ecosVerbe.control.valor <= 4);
  delete globalThis.CONFIG.Dice;
});

test('3.64 · panel: pestaña Entrenando, dotes separadas en dones y entrenadas, filtro por activación', async () => {
  const H = await import('./helpers/foundry.mjs');
  const V = await import('../scripts/verbe.js');
  H.resetEnvironment(); V.usarDatos(D, 'activo'); game.user = game.users.get('player');
  H.settings.set('dotesEntrenadas', true);
  const a = new H.MockActor(5, { valor: 10, etapa: 2 });
  const p = new V.PanelVerbe(a);
  p.pestana = 'entreno'; let html = await p._renderHTML();
  assert.match(html, /Entrenar o meditar para ganar Trazos/); assert.match(html, /data-action="crecer"/);
  p.pestana = 'dotes'; html = await p._renderHTML();
  assert.match(html, /<h3 class="ev-tipo-dote">Dones/); assert.match(html, /<h3 class="ev-tipo-dote">Dotes entrenadas/);
  assert.match(html, /data-filtro-dote="tipo"/);
  p.pestana = 'jugar'; html = await p._renderHTML();
  assert.match(html, /ev-chips-act|Mis técnicas|Tu primera técnica/);
  // Comprar una dote entrenada la deja entrenando y cobra los Trazos.
  const antes = V.trazos(a).libres;
  await V.comprarDote(a, 'practica-control');
  assert.ok(V.estado(a).entrenosDote?.['practica-control']); assert.equal(V.tieneDote(a, 'practica-control'), false);
  assert.equal(V.trazos(a).libres, antes - 2);
  p.pestana = 'entreno'; html = await p._renderHTML();
  assert.match(html, /Práctica de Control/); assert.match(html, /data-action="entrenarDote"/);
  await V.cancelarEntrenoDote(a, 'practica-control');
  assert.equal(V.trazos(a).libres, antes); assert.ok(!V.estado(a).entrenosDote?.['practica-control']);
});

test('3.64 · plan de estudios del sensei y cómo subir de etapa', async () => {
  const P = await import('../scripts/plan-sensei.js');
  const html = P.planSenseiHTML();
  for (const t of ['Fase 0', 'Fase 1', 'Fase 2', 'Fase 3', 'Fase 4', 'Práctica de Control', 'Control fino del Verbe', 'Maestro del Verbe', 'dado de derroche', 'Ejercicio de control', 'Control del Verbe CD 13', 'CD 15', 'CD 18']) assert.ok(html.includes(t), t);
  assert.match(P.comoSubirHTML(1), /Practicante.*CD 13/); assert.match(P.comoSubirHTML(3), /Pleno.*CD 18/);
  assert.match(P.comoSubirHTML(4), /sendas/); assert.match(P.comoSubirHTML(0), /no despertó/);
});

test('3.65 · Control con INT, dotes de instinto y presencia, y el árbol de Control', async () => {
  const D2 = readCatalog();
  const de = id => D2.dotes.find(d => d.id === id);
  assert.equal(de('control-instinto').tipo, 'don'); assert.equal(E.tipoDote(de('control-instinto')), 'don');
  assert.equal(de('control-presencia').tipo, 'entrenada'); assert.deepEqual(de('control-presencia').requisitos.dotes, ['practica-control']);
  assert.deepEqual(de('control-fino').requisitos.dotes, ['practica-control']); assert.equal(de('control-fino').requisitos.nivel, 3);
  assert.deepEqual(de('choque-perfecto').requisitos.dotes, ['leer-flujo']);
  const S = await import('../scripts/sistema/dnd5e.js');
  assert.deepEqual(S.datosControl({ ability: 'wis' }), { 'system.skills.cvb.ability': 'wis' });
  assert.deepEqual(S.datosControl({ ability: 'xyz' }), {});
});

test('3.65 · las ramas no se abren solas; abrir una rama entrenando', async () => {
  const H = await import('./helpers/foundry.mjs');
  const V = await import('../scripts/verbe.js');
  H.resetEnvironment(); V.usarDatos(D, 'activo'); game.user = game.users.get('gm');
  H.settings.set('ramasCerradas', true);
  const a = new H.MockActor(5, { valor: 10, etapa: 2, principal: 'forma', ordenRamas: ['forma'], rangos: { forma: 1 } });
  assert.equal(V.ramaAbierta(a, 'forma'), true);
  assert.equal(V.ramaAbierta(a, 'velo'), false);
  H.settings.set('ramasCerradas', false); assert.equal(V.ramaAbierta(a, 'velo'), true); H.settings.set('ramasCerradas', true);
  const antes = V.trazos(a).libres;
  await V.abrirRama(a, 'velo');
  assert.ok(V.estado(a).entrenosDote['rama:velo']); assert.equal(V.trazos(a).libres, antes - 2);
  assert.equal(V.ramaAbierta(a, 'velo'), false, 'hasta terminar el entrenamiento');
  await V.terminarDoteYa(a, 'rama:velo');
  assert.equal(V.ramaAbierta(a, 'velo'), true); assert.ok(V.estado(a).abiertas.includes('velo'));
  assert.equal(await V.abrirRama(a, 'pulso'), false, 'Pulso se abre con su dote');
});

test('3.66 · subir un rango y el Control también se entrena', async () => {
  const H = await import('./helpers/foundry.mjs');
  const V = await import('../scripts/verbe.js');
  H.resetEnvironment(); V.usarDatos(D, 'activo'); game.user = game.users.get('gm');
  H.settings.set('trazosConEntreno', true);
  const a = new H.MockActor(5, { valor: 10, etapa: 2, principal: 'forma', ordenRamas: ['forma'], rangos: { forma: 1 } });
  const antes = V.trazos(a).libres, r0 = V.rangoDe(a, 'forma');
  await V.subirRango(a, 'forma');
  assert.equal(V.rangoDe(a, 'forma'), r0, 'no sube hasta entrenar');
  assert.ok(V.estado(a).entrenosDote['rango:forma']); assert.ok(V.trazos(a).libres < antes);
  await V.terminarDoteYa(a, 'rango:forma');
  assert.equal(V.rangoDe(a, 'forma'), r0 + 1);
  assert.deepEqual(V.planRango(2), { unidad: 'dias', bloque: 1, exitos: 2, cd: 13 }); assert.equal(V.planControl(2).cd, 15);
  await V.comprarControl(a);
  assert.ok(V.estado(a).entrenosDote['control:cvb']);
  await V.terminarDoteYa(a, 'control:cvb');
  assert.equal(a.system.skills.cvb.value, 1);
});

test('3.66 · técnicas mundanas retiradas, Papel que estalla, Liberar el Velo y mejoras de 0 Verbe', async () => {
  const D3 = readCatalog();
  const tid = id => D3.tecnicas.find(t => t.id === id);
  assert.equal(tid('vida-pulso-higiene-manos').retirada, true); assert.ok(tid('vida-pulso-higiene-manos').cambios.length);
  assert.ok(!tid('vida-velo-cartel-luminoso').retirada, 'las místicas siguen');
  assert.equal(D3.ajustes366.retiradas, 32);
  const pe = tid('sello-estalla'); assert.equal(pe.t, 'AA'); assert.equal(pe.item.system.activation.type, 'bonus'); assert.match(pe.e, /interacción con un objeto/);
  const lv = tid('velo-romper'); assert.equal(lv.n, 'Liberar el Velo'); assert.equal(lv.t, 'R'); assert.equal(lv.item.system.activation.type, 'reaction');
  const H = await import('./helpers/foundry.mjs');
  const V = await import('../scripts/verbe.js');
  H.resetEnvironment(); V.usarDatos(D3, 'activo'); game.user = game.users.get('gm');
  const g0 = D3.tecnicas.find(t => t.g === 0 && !t.retirada && !t.costoBase && !Object.values(t.item.system.activities).some(a => a.damage?.parts?.length || a.healing));
  const a = new H.MockActor(5, { valor: 10 });
  const meta = g0.item.flags['ecos-frontera'].verbe;
  const base = V.costoUso(a, meta, 0);
  V.estado(a).cultivos = { [g0.id]: { nivel: 2, mejoras: ['dado', 'cd'] } };
  assert.equal(V.costoUso(a, meta, 0), base + 2, 'cada mejora de una técnica de 0 Verbe cuesta 1');
});
