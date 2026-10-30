import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { MockActor, MockEffect, MockItem, resetEnvironment, settings, events, messages, notices } from './helpers/foundry.mjs';
import { readCatalog } from '../tools/catalog.mjs';
import * as V from '../scripts/verbe.js';
import * as FX from '../scripts/verbe-effects.js';
import { tipoCuracionVerbe, tratarHeridaConPulso } from '../scripts/verbe-medicina.js';
const D = readCatalog();
beforeEach(() => { resetEnvironment(); V.usarDatos(D, 'activo'); });
const tec = id => D.tecnicas.find(t => t.id === id);
const dote = id => D.dotes.find(d => d.id === id);
function activity(a, id) {
  const item = new MockItem(V.datosItem(a, tec(id)), a);
  return { actor: a, item };
}
async function usar(a, id, scaling = 0) {
  const act = activity(a, id), usage = { scaling }, updates = {}, message = {};
  const r = V.alConsumir(act, usage, message, updates);
  if (r === false) return false;
  await a.update(updates.actor);
  await V._prueba.despuesDeUsar(act, usage);
  return usage.ecosVerbe;
}

test('ningún corazón se compra sin su naturaleza, ni por aprobación obsoleta', async () => {
  const a = new MockActor(5, { nats: ['agua'] });
  assert.equal(V.cumpleReqDote(a, dote('corazon-fuego')).ok, false);
  await V.comprarDote(a, 'corazon-fuego', { aprobado: true });
  assert.equal(V.estado(a).gastados, 0);
  assert.ok(!V.estado(a).dotes.includes('corazon-fuego'));
});
test('los requisitos de Mirada, herencia y Cerrojo son efectivos', () => {
  const a = new MockActor(20);
  for (const id of ['injerto-aceptado','parpado-firme','sangre-callada','cerrojo-temprano','maestro-tecnica']) {
    assert.equal(V.cumpleReqDote(a, dote(id)).ok, false, id);
  }
});
test('un doble clic de compra cobra una dote una sola vez', async () => {
  const a = new MockActor(5);
  await Promise.all([V.comprarDote(a, 'reserva-profunda'), V.comprarDote(a, 'reserva-profunda')]);
  assert.equal(V.estado(a).gastados, 2);
  assert.equal(a.items.filter(i => i.getFlag('ecos-frontera','verbe')?.dote === 'reserva-profunda').length, 1);
});
test('dos compras distintas conservan ambos cambios y cobran sus Trazos', async () => {
  const a = new MockActor(5);
  await Promise.all([V.comprarDote(a, 'reserva-profunda'), V.comprarDote(a, 'caudal-firme')]);
  assert.equal(V.estado(a).gastados, 4);
  assert.ok(V.estado(a).dotes.includes('reserva-profunda'));
  assert.ok(V.estado(a).dotes.includes('caudal-firme'));
});
test('aprender dos veces no duplica objetos ni gasto', async () => {
  const a = new MockActor();
  await Promise.all([V.aprender(a, tec('fuego-aliento')), V.aprender(a, tec('fuego-aliento'))]);
  assert.equal(a.items.length, 1); assert.equal(V.estado(a).gastados, 1);
});
test('si falla el cargo de Trazos, se retira el objeto recién creado', async () => {
  const a = new MockActor(); a.failNextUpdate = true;
  await assert.rejects(V.aprender(a, tec('fuego-aliento')));
  assert.equal(a.items.length, 0); assert.equal(V.estado(a).gastados, 0);
});
test('un propietario no puede concederse Trazos por la API de DM', async () => {
  const a = new MockActor(); game.user = game.users.get('player');
  await V.darTrazos(a, 100); await V.ajustar(a, 'rango', 5, 'forma');
  assert.equal(V.estado(a).trazosExtra, undefined); assert.equal(V.estado(a).rangos.forma, 1);
});
test('las monedas pagan la deuda al doble con una sola actualización del actor', async () => {
  const a = new MockActor(3, { valor: -5 });
  await V.gastarMoneda(a, 'verbe');
  assert.equal(V.estado(a).valor, -3); assert.equal(a.system.currency.soul, 0);
  assert.equal(a.updates.length, 1);
});
test('descansos consecutivos conservan el crédito impar de recuperación', async () => {
  const a = new MockActor(1, { valor: -2 });
  await V.alDescansar(a, {}, { type: 'short', ecos: { intemperie: true } });
  assert.equal(V.estado(a).valor, -2); assert.equal(V.estado(a).recResto, 1);
  await V.alDescansar(a, {}, { type: 'short', ecos: { intemperie: true } });
  assert.equal(V.estado(a).valor, -1); assert.equal(V.estado(a).recResto, 0);
});
test('Agotamiento 4 bloquea por igual técnica, defensa y Cerrojo en negativo', async () => {
  const a = new MockActor(3, { valor: 0, cerrojos: 1 }); a.system.attributes.exhaustion = 4;
  a.items.push(new MockItem(V.datosItem(a, tec('forma-sustitucion')), a));
  assert.deepEqual(V.defensasDisponibles(a, { grado: 1 }), []);
  assert.equal(await usar(a, 'fuego-aliento'), false);
  await V.abrirCerrojo(a, 1);
  assert.equal(V.estado(a).valor, 0); assert.equal(a.effects.length, 0);
});
test('abrir un Cerrojo en negativo exige la tirada de sobreesfuerzo', async () => {
  const a = new MockActor(3, { valor: 0, cerrojos: 1 });
  await V.abrirCerrojo(a, 1);
  assert.equal(V.estado(a).valor, -2); assert.equal(a.savingThrows, 1);
  assert.equal(a.effects.length, 1);
});
test('los Cerrojos se reinician por descanso, no al cruzar medianoche', async () => {
  const a = new MockActor(3, { valor: 18, cerrojos: 2, cerrojosHoy: { ciclo: 0, veces: 1 } });
  game.time.worldTime = 90000;
  await V.abrirCerrojo(a, 2);
  assert.equal(V.estado(a).cerrojosHoy.veces, 2);
  a.effects.length = 0;
  await V.alDescansar(a, {}, { type: 'long' });
  await V.abrirCerrojo(a, 2);
  assert.equal(V.estado(a).cerrojosHoy.veces, 1);
});
test('Cargado impide ofrecer y usar reacciones', async () => {
  const a = new MockActor(); a.statuses.add('cargado');
  a.items.push(new MockItem(V.datosItem(a, tec('forma-sustitucion')), a));
  assert.deepEqual(V.defensasDisponibles(a), []);
  assert.equal(await V.usarDefensa(a, 'forma-sustitucion'), false);
});
test('una reacción se consume una vez y vuelve al comienzo del turno', async () => {
  game.combat = { started: true };
  const a = new MockActor(3, { valor: 18 });
  a.items.push(new MockItem(V.datosItem(a, tec('forma-sustitucion')), a));
  assert.equal(await V.usarDefensa(a, 'forma-sustitucion'), true);
  assert.equal(await V.usarDefensa(a, 'forma-sustitucion'), false);
  await V._prueba.inicioDeTurno({ combatant: { actor: a } });
  assert.ok(V.defensasDisponibles(a).length);
});
test('la técnica baja elevada a grado 6 consume su uso alto, pero sigue disponible a grado 1', async () => {
  const a = new MockActor(11, { valor: 50, rangos: { forma: 3 } });
  assert.ok(await usar(a, 'fuego-aliento', 5));
  assert.equal(V.estado(a).valor, 41);
  assert.equal(await usar(a, 'fuego-aliento', 5), false);
  assert.ok(await usar(a, 'fuego-aliento', 0));
  await V.alDescansar(a, {}, { type: 'long' });
  assert.ok(await usar(a, 'fuego-aliento', 5));
});
test('el escalado respeta el dominio de rama y rechaza valores fraccionarios', async () => {
  const a = new MockActor(11, { valor: 50, rangos: { forma: 0 }, principal: 'cuerpo' });
  assert.equal(await usar(a, 'fuego-aliento', 1), false);
  assert.equal(await usar(a, 'fuego-aliento', 0.5), false);
  assert.equal(Object.values(V.datosItem(a, tec('fuego-aliento')).system.activities)[0].consumption.scaling.allowed, false);
});
test('dos activaciones simultáneas no reservan el mismo Verbe', async () => {
  const a = new MockActor(3, { valor: 10 });
  const act = activity(a, 'fuego-aliento'), usage = {}, updates = {};
  assert.notEqual(V.alConsumir(act, usage, {}, updates), false);
  assert.equal(V.alConsumir(act, {}, {}, {}), false);
  await a.update(updates.actor); await V._prueba.despuesDeUsar(act, usage);
  assert.equal(V.estado(a).valor, 8);
  assert.ok(await usar(a, 'fuego-aliento'));
  assert.equal(V.estado(a).valor, 6);
});
test('Palma que cierra tiene +2d8 configurados por grado adicional', () => {
  const item = V.datosItem(new MockActor(3), tec('pulso-cerrar'));
  assert.deepEqual(Object.values(item.system.activities)[0].healing.scaling, { mode: 'whole', number: 2, formula: '' });
});
test('los objetos de grado 10 y 11 conservan su grado real', () => {
  for (const t of D.tecnicas.filter(t => t.g >= 10)) assert.equal(t.item.system.level, t.g);
});
test('refrescar actualiza el objeto existente y conserva usos gastados', async () => {
  const a = new MockActor(11, { rangos: { forma: 3 } });
  const item = new MockItem(tec('fuego-aliento').item, a); item.system.uses.spent = 1; a.items.push(item);
  await V.refrescar(a);
  assert.equal(a.items[0].id, item.id); assert.equal(a.items[0].system.uses.spent, 1);
  assert.equal(a.deletedItems.length, 0); assert.equal(a.updatedItems.length, 1);
});
const formulario = () => ({ nombre: 'Técnica de prueba local', grado: 1, rama: 'forma', nat: 'fuego', tiempo: 'A',
  alcance: '18', areaTipo: 'ninguna', areaTam: 4.5, duracion: 'inst.', tirada: 'ataque', estados: 0,
  dadosN: 20, dadosD: 12, tipoDano: 'fuego', efecto: 'Solo prueba local.', gestos: true });
test('crear fuera del presupuesto requiere una excepción del DM y no publica nada por error', async () => {
  const a = new MockActor(), f = formulario();
  assert.equal(await V._prueba.crearAprobada(a, f), false);
  assert.equal(settings.get('capaVExtra').length, 0); assert.equal(a.items.length, 0);
  assert.equal(await V._prueba.crearAprobada(a, { ...f, excepcionDM: true, motivoExcepcion: 'Prueba aislada aprobada' }), true);
  assert.equal(a.items.length, 1); assert.equal(V.estado(a).gastados, 2);
  assert.equal(a.items[0].getFlag('ecos-frontera','verbe').excepcionBalance.motivo, 'Prueba aislada aprobada');
});
test('no publica una creación si ya no hay Trazos para aprenderla', async () => {
  const a = new MockActor(1, { gastados: 8 }), f = formulario();
  Object.assign(f, { dadosN: 1, dadosD: 4 });
  assert.equal(await V._prueba.crearAprobada(a, f), false);
  assert.equal(settings.get('capaVExtra').length, 0);
});
test('las peticiones duplicadas se conservan una vez y el HTML del cliente no se ejecuta', async () => {
  const a = new MockActor(), d = { accion: 'capaVPedir', actorId: a.id, de: 'player', tipo: 'dote', datos: { id: 'reserva-profunda' },
    titulo: 'Prueba', resumen: '<img src=x onerror=alert(1)>Prueba' };
  await Promise.all([V._prueba.manejar(d), V._prueba.manejar(d)]);
  assert.equal(settings.get('capaVPendientes').length, 1);
  assert.ok(!messages.at(-1).content.includes('<img'));
});
test('una petición rechazada por falta de Trazos no desaparece al aprobarla', async () => {
  const a = new MockActor(1, { gastados: 8 });
  settings.set('capaVPendientes', [{ id: 'pedido', actorId: a.id, tipo: 'dote', datos: { id: 'reserva-profunda' } }]);
  assert.equal(await V.aprobar('pedido'), false);
  assert.equal(settings.get('capaVPendientes').length, 1);
});
test('una petición remota no puede mover directamente el reloj de la Barrera', async () => {
  const a = new MockActor(); let reloj = 0;
  game.modules.set('ecos-frontera', { api: { sumarReloj: async () => ++reloj } });
  await V._prueba.manejar({ accion: 'capaVReloj', actorId: a.id, de: 'player' });
  assert.equal(reloj, 0);
});
test('el choque ponderado respeta la potencia y el modo clásico sigue disponible', async () => {
  const a = { nombre: 'Fuego', nat: 'fuego', g: 0 }, b = { nombre: 'Viento', nat: 'viento', g: 11 };
  assert.equal(await V.resolverChoque(a, b), -1);
  settings.set('verbeChoques', 'clasico');
  assert.equal(await V.resolverChoque(a, b), 1);
});
test('Cuerpo templado se aplica y convierte sus metros a pies', async () => {
  const a = new MockActor(1, { principal: 'cuerpo', rangos: { cuerpo: 1 } });
  a.system.attributes.movement.units = 'ft';
  await V.asegurarAEDotes(a);
  assert.ok(a.effects[0].changes.some(c => c.key === 'system.attributes.ac.bonus' && c.value === '+ 1'));
  assert.ok(a.effects[0].changes.some(c => c.key === 'system.attributes.movement.walk' && Number(c.value) === 10));
});
test('Cuerpo templado se retira al llevar armadura pesada', async () => {
  const a = new MockActor(1, { principal: 'cuerpo', rangos: { cuerpo: 1 } });
  await V.asegurarAEDotes(a);
  a.items.push(new MockItem({ type: 'equipment', system: { equipped: true, armor: { type: 'heavy' } } }, a));
  await V.asegurarAEDotes(a); assert.equal(a.effects.length, 0);
});
test('los estados temporales vencidos se retiran al iniciar el turno', async () => {
  const a = new MockActor();
  await a.createEmbeddedDocuments('ActiveEffect', [{ name: 'Empapado', statuses: ['empapado'], duration: { seconds: 60, remaining: 0 }, flags: { 'ecos-frontera': { verbe: { estado: 'empapado' } } } }]);
  await V._prueba.inicioDeTurno({ combatant: { actor: a } });
  assert.equal(a.effects.length, 0);
});
test('desequilibrio afecta la siguiente tirada y se consume después del ataque', async () => {
  const a = new MockActor();
  await a.createEmbeddedDocuments('ActiveEffect', [{ statuses: ['desequilibrado'], flags: { 'ecos-frontera': { verbe: { estado: 'desequilibrado' } } } }]);
  const subject = { actor: a }, config = { subject, rolls: [{ options: {} }] };
  FX.configurarAtaque(config); assert.equal(config.rolls[0].options.disadvantage, true);
  await FX.despuesAtaque([{}], { subject }); assert.equal(a.effects.length, 0);
});
test('Embarrado da desventaja a DES y no a CON', () => {
  const a = new MockActor(); a.statuses.add('embarrado');
  const dex = { subject: a, ability: 'dex', rolls: [{}] }, con = { subject: a, ability: 'con', rolls: [{}] };
  FX.configurarSalvacion(dex); FX.configurarSalvacion(con);
  assert.equal(dex.disadvantage, true); assert.equal(con.disadvantage, undefined);
});
test('la ventaja metálica se consume sin quitar la prohibición de reacciones de Cargado', async () => {
  const a = new MockActor(), target = new MockActor();
  await target.setFlag('ecos-frontera', 'metal', true);
  await target.createEmbeddedDocuments('ActiveEffect', [{ statuses: ['cargado'], flags: { 'ecos-frontera': { verbe: { estado: 'cargado' } } } }]);
  game.user.targets = new Set([{ actor: target }]);
  const item = new MockItem({ type: 'weapon', flags: { 'ecos-frontera': { metal: true } }, system: {} }, a);
  const subject = { actor: a, item }, config = { subject, rolls: [{}] };
  FX.configurarAtaque(config); assert.equal(config.advantage, true);
  await FX.despuesAtaque([{}], { subject });
  assert.ok(target.statuses.has('cargado'));
  const next = { subject, rolls: [{}] }; FX.configurarAtaque(next); assert.equal(next.advantage, undefined);
});
test('agua o tierra apagan Ardiendo sin eliminar otros estados', async () => {
  const a = new MockActor();
  await a.createEmbeddedDocuments('ActiveEffect', [{ statuses: ['ardiendo'], flags: { 'ecos-frontera': { verbe: { estado: 'ardiendo' } } } }]);
  await FX.revisarEstados(a, 'empapado'); assert.equal(a.effects.length, 0);
});
test('el hielo convierte metros a pies y solo retira su propia inmovilización', async () => {
  const a = new MockActor(); a.system.attributes.movement.units = 'ft';
  const data = { changes: [{ key: 'system.attributes.movement.walk', value: '-3' }], flags: { 'ecos-frontera': { verbe: { estado: 'helado' } } } };
  const fx = new MockEffect(data, a); FX.normalizarHielo(fx, data);
  assert.equal(Number(fx.changes[0].value), -10);
  a.effects.push(fx); a.system.attributes.movement.walk = 0;
  await FX.revisarEstados(a); assert.ok(a.effects.some(e => e.getFlag('ecos-frontera','verbe')?.congelado));
  a.system.attributes.movement.walk = 10;
  await FX.revisarEstados(a); assert.ok(!a.effects.some(e => e.getFlag('ecos-frontera','verbe')?.congelado));
});

test('Pulso se identifica por su técnica registrada y no por su nombre visible', () => {
  for (const [id, tipo] of [['pulso-cerrar','pulsoTratamiento'], ['pulso-sostener','piedad'],
    ['pulso-restaurar','sanar'], ['pulso-muchos','masa'], ['pulso-rehacer','sanar'], ['pulso-cierra-todo','masa']]) {
    assert.equal(tipoCuracionVerbe({ flags: { 'ecos-frontera': { verbe: { id } } }, name: 'Renombrada' }), tipo);
  }
  assert.equal(tipoCuracionVerbe({ name: 'Palma que cierra' }), null);
  assert.equal(tipoCuracionVerbe({ flags: { 'ecos-frontera': { verbe: { id: 'pulso-cura-lejos' } } } }), null);
});
test('Palma cuenta un tratamiento exitoso, no elimina niveles de herida directamente', async () => {
  const a = new MockActor(); let cura, llamadas = [];
  const deps = { leerCura: () => cura, nivel: () => 3, sanador: 'Médica', santuario: false,
    aplicar: async (actor, datos) => { assert.equal(actor, a); llamadas.push(datos); cura = { exito: true }; } };
  assert.equal(await tratarHeridaConPulso(a, deps), true);
  assert.deepEqual(llamadas, [{ sanador: 'Médica', total: 13, cd: 13, santuario: false, magico: true }]);
  assert.equal(await tratarHeridaConPulso(a, deps), false); assert.equal(llamadas.length, 1);
});
test('un tratamiento mágico puede sustituir un intento diario fallido', async () => {
  let aplicado = false;
  await tratarHeridaConPulso({}, { leerCura: () => ({ intento: true, exito: false }), nivel: () => 1,
    aplicar: async () => { aplicado = true; }, sanador: 'Médica', santuario: true });
  assert.equal(aplicado, true);
});
test('si falla guardar un Cerrojo, no queda su efecto ni se cobra Verbe', async () => {
  const a = new MockActor(3, { valor: 10, cerrojos: 1 }); a.failNextUpdate = true;
  await assert.rejects(V.abrirCerrojo(a, 1));
  assert.equal(a.effects.length, 0); assert.equal(V.estado(a).valor, 10); assert.equal(a.savingThrows, 0);
});
test('si falla guardar una defensa, no queda protección gratuita ni reacción gastada', async () => {
  const a = new MockActor(3, { valor: 10 });
  a.items.push(new MockItem(V.datosItem(a, tec('forma-sustitucion')), a)); a.failNextUpdate = true;
  await assert.rejects(V.usarDefensa(a, 'forma-sustitucion', { grado: 1 }));
  assert.equal(a.effects.length, 0); assert.equal(V.estado(a).valor, 10); assert.ok(!V.estado(a).reaccionUsada);
});
test('las excepciones de balance no permiten formularios malformados', () => {
  const a = new MockActor();
  for (const patch of [{ nombre: '' }, { alcance: 'NaN' }, { areaTipo: 'alcance', areaTam: 5 }, { estados: 99 }]) {
    assert.ok(V.validarFormularioTecnica(a, { ...formulario(), ...patch, excepcionDM: true }).duros.length);
  }
});
test('actualizar la versión de reglas conserva compras, deuda y objetos existentes', async () => {
  const a = new MockActor(5, { reglasVersion: 0, gastados: 7, valor: -2, cerrojosHoy: { dia: 9, veces: 3 } });
  const item = new MockItem(V.datosItem(a, tec('fuego-aliento')), a); a.items.push(item);
  await V._prueba.asegurarRasgos(a); await V.refrescar(a);
  assert.equal(V.estado(a).reglasVersion, 2); assert.equal(V.estado(a).gastados, 7);
  assert.equal(V.estado(a).valor, -2); assert.equal(V.estado(a).cerrojosHoy.veces, 0);
  assert.equal(a.items.get(item.id), item);
});
test('las 401 técnicas generan datos y costes válidos en los seis niveles de control', () => {
  for (const level of [1, 3, 5, 11, 17, 20]) {
    const a = new MockActor(level);
    for (const t of D.tecnicas) {
      const data = V.datosItem(a, t);
      assert.equal(data.system.level, t.g, t.id);
      assert.ok(Object.keys(data.system.activities).length > 0, t.id);
      const c = V.costoUso(a, data.flags['ecos-frontera'].verbe, t.g);
      assert.ok(Number.isSafeInteger(c) && c >= 0, `${t.id}: ${c}`);
    }
  }
});
test('Cargado no concede ventaja metálica contra quien no lleva metal', async () => {
  const a = new MockActor(), target = new MockActor(); target.statuses.add('cargado');
  game.user.targets = new Set([{ actor: target }]);
  const item = new MockItem({ type: 'weapon', flags: { 'ecos-frontera': { metal: true } }, system: {} }, a);
  const config = { subject: { actor: a, item }, rolls: [{}] };
  FX.configurarAtaque(config); assert.equal(config.advantage, undefined);
});
test('un error al aprender una creación también retira su publicación', async () => {
  const a = new MockActor(); a.failNextUpdate = true;
  await assert.rejects(V._prueba.crearAprobada(a, { ...formulario(), excepcionDM: true, motivoExcepcion: 'Prueba' }));
  assert.equal(a.items.length, 0); assert.equal(settings.get('capaVExtra').length, 0);
});
test('Control y sus Trazos se guardan juntos y un fallo no concede competencia gratuita', async () => {
  const a = new MockActor(); a.failNextUpdate = true;
  await assert.rejects(V.comprarControl(a));
  assert.equal(a.system.skills.cvb, undefined); assert.equal(V.estado(a).gastados, 0);
  await V.comprarControl(a);
  assert.equal(a.system.skills.cvb.value, 1); assert.equal(V.estado(a).gastados, 2);
  assert.equal(a.updates.length, 1);
});
