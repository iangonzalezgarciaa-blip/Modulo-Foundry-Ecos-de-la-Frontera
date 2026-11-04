import test from 'node:test';
import assert from 'node:assert/strict';
import { cifrasActividad, pasosUso, chipsCifras, tipoUso, actividadDe } from '../scripts/verbe-cifras.js';

const item = (act, effects = [], props = ['mgc']) => ({ system: { activities: { a1: act }, properties: new Set(props) }, effects });

test('3.10: ataque con los números de la ficha y el estado que deja', () => {
  const c = cifrasActividad(item({ type: 'attack', labels: { toHit: '+4', damage: [{ formula: '2d6', damageType: 'bludgeoning' }] }, duration: { units: 'inst' } }, [{ name: 'Codazo', statuses: ['prone'] }]));
  assert.deepEqual(chipsCifras(c), ['Ataque +4', '2d6 contundente']);
  const p = pasosUso(c, { costo: 2, despues: 5 });
  assert.match(p[0], /Pagas 2 de Verbe y te quedan 5/);
  assert.match(p[1], /1d20 \+4 contra la Clase de Armadura/);
  assert.match(p[2], /Si impacta: 2d6 contundente/);
  assert.match(p[3], /Derribado/);
  assert.match(c.estados[0].texto, /arrastrándose/);
});

test('3.10: salvación con CD, mitad o nada, y curación con modificador', () => {
  const s = cifrasActividad(item({ type: 'save', save: { ability: new Set(['dex']), dc: { value: 13 } }, damage: { onSave: 'half', parts: [{ number: 3, denomination: 6, types: ['fire'] }] }, duration: { units: 'inst' } }));
  assert.deepEqual(chipsCifras(s), ['CD 13 DES', '3d6 fuego']);
  assert.match(pasosUso(s, { costo: 0 }).join(' '), /tira Destreza contra CD 13.*Si falla: 3d6 fuego\. Si la supera, recibe la mitad/);
  const h = cifrasActividad(item({ type: 'heal', healing: { number: 2, denomination: 8, bonus: '@mod' }, duration: { units: 'inst' } }));
  assert.equal(h.curacion, '2d8 + modificador');
  assert.equal(tipoUso(actividadDe(item({ type: 'heal' }))), 'curacion');
  assert.equal(tipoUso({ type: 'attack' }, { cargada: true }), 'cargada');
});

test('3.10: duración, concentración y deuda de Verbe', () => {
  const c = cifrasActividad(item({ type: 'utility', duration: { units: 'minute', value: 10, concentration: true } }));
  assert.equal(c.duracion, '10 minutos'); assert.equal(c.concentracion, true);
  const p = pasosUso(c, { costo: 4, despues: -2 });
  assert.match(p[0], /deuda/); assert.match(p.join(' '), /Dura 10 minutos, con concentración/);
  assert.equal(cifrasActividad({ system: { activities: {} } }), null);
});
