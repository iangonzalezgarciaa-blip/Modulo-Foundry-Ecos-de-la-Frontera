import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { MockActor, MockItem, resetEnvironment, collection } from './helpers/foundry.mjs';
import { readCatalog } from '../tools/catalog.mjs';
import * as V from '../scripts/verbe.js';
import { tramoReserva, tramoFuerza, tramoVida, queVe } from '../scripts/verbe-lectura.js';
import { perfilNpc, variacionNpc } from '../scripts/mesa-core.js';
import { barrasVisibles, fichaLegible, revisarOcultacion, ocultarDatosEnemigos } from '../scripts/mesa-oponentes.js';
const D = readCatalog();
const tec = id => D.tecnicas.find(t => t.id === id);
beforeEach(() => { resetEnvironment(); V.usarDatos(D, 'activo'); });

test('la lectura del Verbe da tramos, nunca cifras', () => {
  assert.equal(tramoReserva(30, 34), 'llena o casi llena');
  assert.equal(tramoReserva(15, 34), 'a medias');
  assert.equal(tramoReserva(3, 34), 'baja');
  assert.match(tramoReserva(-2, 34), /deuda/);
  assert.equal(tramoFuerza(3, 6), 'mucho más fuerte que tú');
  assert.equal(tramoFuerza(3, 3), 'parejo contigo');
  assert.equal(tramoVida(10, 40), 'a punto de caer');
  assert.deepEqual([...queVe(['rastro-cerca'])], ['usa']);
  const lector = new MockActor(10, { valor: 10 }), otro = new MockActor(3, { valor: 2 });
  lector.items.push(new MockItem(V.datosItem(lector, tec('rastro-ver-todo')), lector));
  const l = V.lecturaDe(lector, otro).join(' ');
  assert.match(l, /usa Verbe/); assert.match(l, /más débil/); assert.match(l, /reserva está/);
  assert.doesNotMatch(l, /\d/);
});

test('Verbe variable: dos NPC iguales salen distintos dentro de los límites', () => {
  let s = 3; const azar = () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648);
  const base = perfilNpc({ vd: 5, rol: 'guardian', nombre: 'Guardia' });
  const pgs = new Set();
  for (let i = 0; i < 20; i++) {
    const v = variacionNpc({ rangos: 3, azar });
    assert.ok(Math.abs(v.pg) <= 0.16 && Math.abs(v.reserva) <= 0.16 && v.ca >= -1 && v.ca <= 2);
    const p = perfilNpc({ vd: 5, rol: 'guardian', nombre: 'Guardia', variacion: v });
    assert.ok(Math.abs(p.pg - base.pg) <= Math.ceil(base.pg * 0.16));
    assert.deepEqual(perfilNpc(p), p);
    pgs.add(p.pg);
  }
  assert.ok(pgs.size > 3);
  assert.equal(variacionNpc({ rangos: 50, azar }).margen, 0.25);
});

test('oponentes: detecta barras y fichas legibles de PNJ y las oculta', async () => {
  const npc = { type: 'npc', hasPlayerOwner: false, prototypeToken: { displayBars: 50 }, ownership: { default: 2 }, updates: [], async update(u) { this.updates.push(u); Object.assign(this.ownership, { default: u['ownership.default'] ?? this.ownership.default }); this.prototypeToken.displayBars = u['prototypeToken.displayBars'] ?? this.prototypeToken.displayBars; } };
  const tok = { id: 't1', actor: npc, displayBars: 30 };
  const escena = { tokens: [tok], async updateEmbeddedDocuments(_, c) { for (const x of c) tok.displayBars = x.displayBars; } };
  game.actors = collection([npc]); game.scenes = [escena];
  game.settings.settings = new Map();
  assert.equal(barrasVisibles(50), true); assert.equal(barrasVisibles(40), false); assert.equal(fichaLegible(1), false);
  const r = revisarOcultacion();
  assert.equal(r.barras, 1); assert.equal(r.tokens, 1); assert.equal(r.fichas, 1); assert.equal(r.ok, false);
  const h = await ocultarDatosEnemigos();
  assert.deepEqual({ ...h }, { prototipos: 1, tokens: 1, fichas: 1, ataque: null });
  assert.equal(revisarOcultacion().ok, true);
});

test('5.1: enlaces de YouTube y el segundo actual con pausa', async () => {
  const { idYoutube, segundoActual } = await import('../scripts/mesa-musica.js');
  assert.equal(idYoutube('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10'), 'dQw4w9WgXcQ');
  assert.equal(idYoutube('https://youtu.be/dQw4w9WgXcQ'), 'dQw4w9WgXcQ');
  assert.equal(idYoutube('dQw4w9WgXcQ'), 'dQw4w9WgXcQ');
  assert.equal(idYoutube('https://example.com/x'), null);
  assert.equal(segundoActual({ desde: 1000, pausadoEn: null }, 11000), 10);
  assert.equal(segundoActual({ desde: 1000, pausadoEn: 42 }, 99000), 42);
});

test('3.10: repetir canción vuelve a empezar la misma para todos; sin repetir pasa a la cola', async () => {
  const M = await import('../scripts/mesa-musica.js');
  const antes = globalThis.game;
  let valor = { cola: [{ id: 'bbbbbbbbbbb' }], actual: { id: 'aaaaaaaaaaa', desde: 1, pausadoEn: null } };
  globalThis.game = { user: { isGM: true }, settings: { get: () => valor, set: async (_m, _k, v) => { valor = v; } } };
  try {
    await M.alternarRepetir();
    assert.equal(valor.repetir, true);
    await M.alTerminar();
    assert.equal(valor.actual.id, 'aaaaaaaaaaa'); assert.ok(valor.actual.desde > 1); assert.equal(valor.cola.length, 1);
    await M.alternarRepetir();
    await M.alTerminar();
    assert.equal(valor.actual.id, 'bbbbbbbbbbb'); assert.equal(valor.cola.length, 0); assert.equal(valor.repetir, false);
  } finally { globalThis.game = antes; }
});

test('3.25: el recuadro de la música se mueve y cambia de tamaño sin salirse de la ventana ni bajar de 200 × 200', async () => {
  const { ajustarCaja, pasoCaja, alternarCaja, MIN_ANCHO, MIN_ALTO, CAJA_GRANDE } = await import('../scripts/mesa-musica.js');
  const W = 1280, H = 720;
  assert.deepEqual(ajustarCaja(null, W, H), { x: 8, y: H - MIN_ALTO - 8, w: MIN_ANCHO, h: MIN_ALTO }, 'sin datos: abajo a la izquierda, chico');
  assert.deepEqual(ajustarCaja({ x: 5000, y: -40, w: 10, h: 99999 }, W, H), { x: W - MIN_ANCHO, y: 0, w: MIN_ANCHO, h: H }, 'nunca fuera de la ventana ni menor que el mínimo');
  assert.deepEqual(ajustarCaja({ x: 'a', y: null, w: undefined, h: '' }, W, H), ajustarCaja(null, W, H), 'datos rotos: posición de siempre');
  const chica = ajustarCaja(null, W, H), mayor = pasoCaja(chica, 1, W, H);
  assert.ok(mayor.w > chica.w); assert.equal(mayor.y + mayor.h, chica.y + chica.h, 'crece hacia arriba, sin moverse de su borde de abajo');
  assert.deepEqual(pasoCaja(chica, -1, W, H), chica, 'achicar no baja del mínimo');
  const grande = alternarCaja(chica, W, H);
  assert.equal(grande.w, CAJA_GRANDE.w); assert.equal(grande.h, CAJA_GRANDE.h);
  assert.deepEqual(alternarCaja(grande, W, H), chica, 'el doble clic vuelve a chico');
  const enchica = ajustarCaja({ x: 10, y: 10, w: 300, h: 300 }, 150, 150);
  assert.deepEqual(enchica, { x: 0, y: 0, w: MIN_ANCHO, h: MIN_ALTO }, 'en una ventana más chica que el mínimo, se queda en el mínimo arriba a la izquierda');
});
