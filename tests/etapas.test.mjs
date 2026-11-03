import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { MockActor, MockItem, resetEnvironment } from './helpers/foundry.mjs';
import { readCatalog } from '../tools/catalog.mjs';
import * as V from '../scripts/verbe.js';
import { ETAPAS, etapaDe, permisoEtapa, requisitoDescubrir, siguienteDescubrimiento, diasRestantes, modoNaturaleza } from '../scripts/verbe-etapas.js';
const D = readCatalog();
const tec = id => D.tecnicas.find(t => t.id === id);
beforeEach(() => { resetEnvironment(); V.usarDatos(D, 'activo'); });

test('las fichas de antes no tienen etapa ni modo: siguen sin límite y como estaban', () => {
  assert.equal(etapaDe({}), 4); assert.equal(modoNaturaleza({ nats: ['fuego'] }), 'visible');
  assert.equal(ETAPAS.length, 5);
});

test('la etapa limita cuántas ramas y qué grado se aprende', () => {
  const e = { etapa: 1, ordenRamas: ['forma'] };
  assert.equal(permisoEtapa(e, { rama: 'forma', grado: 1 }).ok, true);
  assert.match(permisoEtapa(e, { rama: 'forma', grado: 2 }).motivo, /Aprendiz.*grado 1/);
  assert.match(permisoEtapa(e, { rama: 'cuerpo', grado: 1 }).motivo, /permite 1 rama/);
  assert.equal(permisoEtapa({ etapa: 2, ordenRamas: ['forma'] }, { rama: 'cuerpo', grado: 3 }).ok, true);
  assert.equal(permisoEtapa({ etapa: 4 }, { rama: 'sello', grado: 11 }).ok, true);
});

test('descubrir la naturaleza pide nivel 5, o 3 con Entrenado en Forma, y etapa Practicante', () => {
  assert.equal(siguienteDescubrimiento({}, { conocidas: 0 }), 'primera');
  assert.equal(siguienteDescubrimiento({}, { conocidas: 1 }), 'segunda');
  assert.equal(siguienteDescubrimiento({ descubierta: true }, { conocidas: 2 }), null);
  assert.equal(requisitoDescubrir({ etapa: 1 }, { tipo: 'primera', nivel: 9 }).ok, false);
  assert.equal(requisitoDescubrir({ etapa: 2 }, { tipo: 'primera', nivel: 4 }).ok, false);
  assert.equal(requisitoDescubrir({ etapa: 2 }, { tipo: 'primera', nivel: 3, rangoForma: 1 }).ok, true);
  assert.equal(requisitoDescubrir({ etapa: 2 }, { tipo: 'primera', nivel: 5 }).cd, 12);
  assert.equal(requisitoDescubrir({ etapa: 2 }, { tipo: 'segunda', nivel: 4 }).ok, false);
  assert.equal(diasRestantes({ hasta: 3 * 86400 }, 86400), 2);
});

test('con la naturaleza oculta no ve ni aprende técnicas elementales; sí las de sin elemento', () => {
  const a = new MockActor(5, { nats: [], natModo: 'secreta', etapa: 2, principal: 'forma', ordenRamas: ['forma'], rangos: { forma: 1 } });
  assert.equal(V.naturalezaVisible(a, tec('fuego-aliento')), false);
  assert.match(V.requisitos(a, tec('fuego-aliento')).motivo, /Aún no descubriste tu naturaleza/);
  const pura = D.tecnicas.find(t => t.rama === 'forma' && !t.nat && t.g === 1 && !t.req && !t.previa && !t.incl && !t.soloDM);
  assert.equal(V.requisitos(a, pura).ok, true, V.requisitos(a, pura).motivo);
});

test('entrenar y superar la prueba descubre la naturaleza secreta y cobra sus Trazos', async () => {
  const a = new MockActor(5, { nats: [], natModo: 'secreta', etapa: 2, principal: 'forma', ordenRamas: ['forma'], rangos: { forma: 1 }, gastados: 0 });
  V.estado(a).oc1 = V._prueba.revolver('agua', a.id);
  assert.equal(V.ocultaPrimeraDe(a), 'agua');
  assert.equal(await V._prueba.iniciarEntrenoNaturaleza(a, {}, { aprobado: true }), true);
  assert.equal(V.estado(a).entrenoNat.dias, 3);
  assert.equal(await V._prueba.resolverEntreno(a, 8), false);
  assert.deepEqual(V.estado(a).nats, []); assert.equal(V.estado(a).intentosNat, 1); assert.equal(V.estado(a).gastados, 0);
  await V._prueba.iniciarEntrenoNaturaleza(a, {}, { aprobado: true });
  assert.equal(await V._prueba.resolverEntreno(a, 15), true);
  assert.deepEqual(V.estado(a).nats, ['agua']); assert.equal(V.estado(a).gastados, 2);
  assert.equal(V.naturalezaVisible(a, tec('agua-ola') ?? D.tecnicas.find(t => t.nat === 'agua')), true);
});

test('en modo «elige» el jugador elige al descubrirla; el DM abre etapas con registro', async () => {
  const a = new MockActor(5, { nats: [], natModo: 'elige', etapa: 2, principal: 'forma', ordenRamas: ['forma'], rangos: { forma: 1 } });
  await V._prueba.iniciarEntrenoNaturaleza(a, {}, { aprobado: true });
  await V._prueba.resolverEntreno(a, 20);
  assert.equal(V.estado(a).elegirNat, 'primera');
  assert.equal(await V.cambiarEtapa(a, 1, 'Maestra Ilse'), true);
  assert.equal(V.estado(a).etapa, 3); assert.equal(V.estado(a).maestros.at(-1).quien, 'Maestra Ilse');
  await V.cambiarEtapa(a, 1); await V.cambiarEtapa(a, 1);
  assert.equal(V.estado(a).etapa, 4);
});

test('Cambiar naturaleza del Verbe: 3 Trazos para aprenderla; usarla pide 7 días y CD 15', async () => {
  const t = tec('forma-cambiar-naturaleza');
  assert.equal(t.trazos, 3); assert.equal(t.nivelMin, 5);
  const a = new MockActor(6, { nats: ['fuego'], etapa: 4, principal: 'forma', ordenRamas: ['forma'], rangos: { forma: 2 } });
  a.items.push(new MockItem(V.datosItem(a, t), a));
  assert.equal(await V._prueba.iniciarEntrenoNaturaleza(a, { tipo: 'cambio', de: 'fuego', a: 'rayo' }, { aprobado: true }), true);
  assert.equal(V.estado(a).entrenoNat.cd, 15); assert.equal(V.estado(a).entrenoNat.dias, 7);
  await V._prueba.resolverEntreno(a, 16);
  assert.deepEqual(V.estado(a).nats, ['rayo']);
});
