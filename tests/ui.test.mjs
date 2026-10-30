import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { MockActor, MockItem, resetEnvironment } from './helpers/foundry.mjs';
import { readCatalog } from '../tools/catalog.mjs';
import * as V from '../scripts/verbe.js';
import { pasoInicial, tarjetaHTML } from '../scripts/verbe-ui.js';
const D = readCatalog();
const tec = id => D.tecnicas.find(t => t.id === id);
beforeEach(() => { resetEnvironment(); V.usarDatos(D, 'activo'); game.user = game.users.get('player'); });
const panel = a => new V.PanelVerbe(a);
const agregar = (a, id) => { const item = new MockItem(V.datosItem(a, tec(id)), a); a.items.push(item); return item; };

test('el inicio avanza por elecciones y técnicas conocidas, también si fueron regalos', async () => {
  const a = new MockActor(1, { nats: [], principal: null });
  let html = await panel(a)._renderHTML();
  assert.match(html, /¿Qué elemento responde a ti\?/); assert.doesNotMatch(html, /data-campo="principal"/);
  V.estado(a).nats = ['fuego'];
  html = await panel(a)._renderHTML(); assert.match(html, /¿Cómo quieres usar tu poder\?/);
  V.estado(a).principal = 'forma';
  html = await panel(a)._renderHTML(); assert.match(html, /Aprende tu primera técnica/);
  agregar(a, 'fuego-aliento');
  html = await panel(a)._renderHTML(); assert.match(html, /Ya puedes entrar en acción/);
  assert.equal(V.estado(a).gastados, 0); assert.equal(pasoInicial({ naturalezas: ['fuego'], principal: 'forma', tecnicas: 1 }), 4);
});
test('las sugerencias no revelan técnicas del DM ni naturalezas ajenas', async () => {
  const a = new MockActor(), html = await panel(a)._renderHTML();
  const ids = [...html.matchAll(/data-action="aprender" data-id="([^"]+)"/g)].map(m => m[1]);
  assert.ok(ids.length > 0 && ids.length <= 3);
  for (const id of ids) {
    const t = tec(id), r = V.requisitos(a, t);
    assert.ok(!t.soloDM && !r.probar && !r.pideDM && r.ok, id);
  }
  assert.doesNotMatch(html, /data-p="dm"|data-action="trazosDM"|Oculta:/);
});
test('la vista de jugador del DM conserva secretos y oculta la pestaña de administración', async () => {
  game.user = game.users.get('gm');
  const a = new MockActor(), p = panel(a); p.comoJugador = true;
  const html = await p._renderHTML();
  assert.doesNotMatch(html, /data-p="dm"|Oculta:/);
  assert.match(html, /Herramientas del DM/);
});
test('vista de uso y consumo real coinciden con deuda', async () => {
  const a = new MockActor(5, { valor: 1 });
  const item = agregar(a, 'fuego-aliento'), meta = item.getFlag('ecos-frontera', 'verbe');
  const vista = V.previsualizarUso(a, meta), updates = {}, usage = {};
  assert.equal(V.alConsumir({ actor: a, item }, usage, {}, updates), undefined);
  assert.equal(vista.costo, usage.ecosVerbe.costo);
  assert.equal(vista.despues, updates.actor['flags.ecos-frontera.verbe.valor']);
  const p = panel(a); p.pestana = 'jugar'; const html = await p._renderHTML();
  assert.match(html, /Sobreesfuerzo: quedarías en -1/); assert.match(html, /data-action="usar"/);
});
test('la ficha de uso explica el bloqueo por agotamiento y desactiva el botón', async () => {
  const a = new MockActor(5, { valor: 0 }); a.system.attributes.exhaustion = 4; agregar(a, 'fuego-aliento');
  const p = panel(a); p.pestana = 'jugar'; const html = await p._renderHTML();
  assert.match(html, /Con Agotamiento 4/); assert.match(html, /data-action="usar" data-id="fuego-aliento" disabled/);
});
test('usar desde el panel delega en la actividad aprendida sin descontar por fuera', async () => {
  const a = new MockActor(5, { valor: 10 }), item = agregar(a, 'fuego-aliento'); let usos = 0;
  Object.values(item.system.activities)[0].use = async () => { usos++; return 'nativo'; };
  assert.equal(await V.usarTecnica(a, 'fuego-aliento'), 'nativo');
  assert.equal(usos, 1); assert.equal(V.estado(a).valor, 10); assert.equal(a.updates.length, 0);
  assert.equal(await V.usarTecnica(a, 'no-aprendida'), false);
});
test('usar desde el panel no salta Cargado ni la propiedad del actor', async () => {
  const a = new MockActor(5, { valor: 10 }), item = agregar(a, 'cuerpo-aguantar'); let usos = 0;
  Object.values(item.system.activities)[0].use = async () => { usos++; };
  a.statuses.add('cargado'); assert.equal(await V.usarTecnica(a, 'cuerpo-aguantar'), false);
  a.statuses.clear(); a.isOwner = false; assert.equal(await V.usarTecnica(a, 'cuerpo-aguantar'), false);
  assert.equal(usos, 0);
});
test('una defensa no se lanza como utilidad ni cobra energía antes de su disparador', async () => {
  const a = new MockActor(5, { valor: 10 }), item = agregar(a, 'forma-sustitucion'); let usos = 0;
  Object.values(item.system.activities)[0].use = async () => { usos++; };
  assert.equal(await V.usarTecnica(a, 'forma-sustitucion'), false);
  assert.equal(usos, 0); assert.equal(V.estado(a).valor, 10);
  const p = panel(a); p.pestana = 'jugar'; const html = await p._renderHTML();
  assert.match(html, /Cómo usar esta defensa/);
  assert.doesNotMatch(html, /data-action="usar" data-id="forma-sustitucion"/);
});
test('varias actividades se eligen en la ficha; el panel no ejecuta una arbitrariamente', async () => {
  const a = new MockActor(), item = agregar(a, 'fuego-aliento'); let usos = 0, apertura = 0;
  Object.values(item.system.activities)[0].use = async () => { usos++; };
  item.system.activities.otro = { type: 'utility', use: async () => { usos++; } };
  item.sheet = { render: () => { apertura++; return 'ficha'; } };
  assert.equal(await V.usarTecnica(a, 'fuego-aliento'), 'ficha'); assert.equal(apertura, 1); assert.equal(usos, 0);
});
test('texto y nombres de usuario se escapan en tarjetas e interfaz', async () => {
  const a = new MockActor(); a.name = '<img src=x onerror=alert(1)>';
  const html = await panel(a)._renderHTML();
  assert.ok(html.includes('&lt;img')); assert.ok(!html.includes('<img src=x'));
  const card = tarjetaHTML({ id: '\" onclick=\"alert(1)', nombre: '<script>x</script>', texto: '<b>poder</b>',
    grado: 1, rama: 'Forma', tiempo: 'Acción', alcance: 'Toque', costo: 2, accion: 'usar', boton: 'Usar' });
  assert.ok(!card.includes('<script>')); assert.match(card, /&lt;b&gt;poder&lt;\/b&gt;/);
});
test('todas las secciones del jugador se renderizan sin permisos de DM', async () => {
  const a = new MockActor(5); agregar(a, 'fuego-aliento'); const p = panel(a);
  for (const tab of ['resumen','jugar','tienda','ramas','dotes','cultivo','crear','guia']) {
    p.pestana = tab; const html = await p._renderHTML();
    assert.ok(html.length > 500, tab); assert.doesNotMatch(html, /data-p="dm"/, tab);
    assert.match(html, /aria-current="page"/, tab);
  }
});
