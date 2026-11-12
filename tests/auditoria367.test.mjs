import test from 'node:test';
import assert from 'node:assert/strict';
import { readCatalog } from '../tools/catalog.mjs';
import { textoClaro, efectoHTML, fichaLecturaHTML, funcionTecnica, queEsTexto, aspectoTexto } from '../scripts/verbe-reading.js';
import { tecnicaChocable } from '../scripts/verbe-clash.js';
import { buscarHerramienta, gastoDe, HERRAMIENTA_BUSCA } from '../scripts/herramientas-shinobi.js';
import { objetoVerbe } from '../scripts/reliquias-menores.js';

const D = readCatalog();
const activas = D.tecnicas.filter(t => !t.retirada);
const tid = id => D.tecnicas.find(t => t.id === id);

test('3.67 · las abreviaturas sueltas dicen quién tira y qué', () => {
  assert.equal(textoClaro('SAB. Si falla, queda Asustada.'), 'El objetivo hace una salvación de Sabiduría. Si falla, queda Asustada.');
  assert.equal(textoClaro('CON: un sello por contacto.'), 'El objetivo hace una salvación de Constitución: un sello por contacto.');
  assert.match(textoClaro('SAB, si falla: 1d6 psíquico.'), /^El objetivo hace una salvación de Sabiduría; si falla:/);
  assert.match(textoClaro('Después tú haces SAB CD 12: si fallas'), /haces una salvación de Sabiduría contra dificultad 12/);
  assert.match(textoClaro('Quien pasa hace DES o queda Derribado.'), /hace una salvación de Destreza o queda/);
  assert.match(textoClaro('Ataque: 4d10 fuerza.'), /^Tirada de ataque:/);
  assert.match(efectoHTML('Algo. En combate: x. Fuera de combate: y. Herramienta: z.'), /<b>En combate:<\/b> x\.<\/p><p><b>Fuera de combate:<\/b> y\.<\/p><p><b>Herramienta:<\/b> z\./);
});

test('3.67 · cada ficha dice Qué es, Aspecto, Qué hace y Cómo se usa, en ese orden, sin relleno', () => {
  for (const t of activas) {
    const h = t.item.system.description.value;
    if (!h.startsWith('<div class="ev-lectura">')) continue;
    const pos = ['Qué es', 'Aspecto', 'Qué hace', 'Cómo se usa', 'Qué cuesta'].map(x => h.indexOf(`<h3>${x}</h3>`));
    assert.ok(pos.every((p, i) => p >= 0 && (i === 0 || p > pos[i - 1])), t.id);
    assert.doesNotMatch(t.texto, /Afecta solo al objetivo o área indicados|Lo de D&D es el golpe|Una ventaja del mismo tipo no se acumula/, t.id);
  }
  const g = tid('quietud-golpe-sapo');
  assert.match(fichaLecturaHTML(g), /<dt>Tirada<\/dt><dd>Ataque<\/dd><\/div><div><dt>Daño<\/dt><dd>6d10 fuerza<\/dd>/, 'el daño sin tipo toma el de la actividad');
  assert.match(fichaLecturaHTML(tid('pulso-cerrar')), /<dt>Curación<\/dt><dd>2d8 \+ modificador<\/dd>/);
  assert.match(queEsTexto(tid('velo-miedo')), /^Técnica de Velo de grado 1: un control/);
  assert.match(aspectoTexto(tid('fuego-aliento')), /Llamas anaranjadas/);
  assert.equal(funcionTecnica(tid('sello-lanza')), 'ataque', 'un sello no es contratécnica');
});

test('3.67 · Sello no choca y lo que no hace daño se sostiene solo', () => {
  const sellos = activas.filter(t => t.rama === 'sello');
  assert.ok(sellos.length > 50 && sellos.every(t => t.sinChoque && t.item.flags['ecos-frontera'].verbe.sinChoque));
  const lanza = tid('sello-lanza');
  const item = { flags: lanza.item.flags, system: lanza.item.system, getFlag: (m, k) => lanza.item.flags?.[m]?.[k] };
  assert.equal(tecnicaChocable(item), false);
  assert.doesNotMatch(lanza.texto, /choque/);
  for (const id of ['sello-silencio', 'sello-barrera-menor', 'sello-barrera', 'sello-cauce'])
    assert.ok(!tid(id).item.system.properties.includes('concentration'), id);
  assert.equal(tid('sello-cierre').item.system.duration.units, 'day'); assert.equal(tid('sello-cierre').item.system.duration.value, 7);
  assert.match(tid('sello-alarma').texto, /8 h: sabes en qué dirección/);
  assert.equal(tid('sello-alarma').item.system.duration.value, 8);
  assert.match(tid('sello-guardar').texto, /25 kg/);
  assert.ok(tid('sello-lanza').cambios.some(c => c.startsWith('3.67')));
  // Fuera del Sello, todo sigue chocando como antes.
  const c = tid('cuerpo-golpe') ?? activas.find(t => t.rama === 'cuerpo' && t.contra && t.item.system.activation?.type === 'action');
  if (c) assert.equal(tecnicaChocable({ flags: c.item.flags, system: c.item.system, getFlag: (m, k) => c.item.flags?.[m]?.[k] }), Object.values(c.item.system.activities).some(a => ['attack', 'save', 'damage'].includes(a.type) && a.damage?.parts?.length));
});

test('3.67 · Velo: cada técnica sirve dentro y fuera de combate', () => {
  const velo = activas.filter(t => t.rama === 'velo');
  assert.ok(velo.length >= 50);
  for (const t of velo) assert.match(t.texto, /(En combate|Fuera de combate): /, t.id);
  assert.deepEqual(D.ajustes367.sinDoble, []);
});

test('3.67 · Quietud reforzada', () => {
  assert.equal(tid('quietud-mundo-cura').item.system.activation.type, 'action');
  assert.ok(!tid('quietud-raiz').item.system.properties.includes('concentration'));
  assert.match(tid('quietud-raiz').texto, /ataques de oportunidad tienen ventaja/);
  assert.match(tid('quietud-tierra').texto, /2d6 PG/);
  assert.match(tid('quietud-calma').texto, /o a una tirada de salvación/);
  assert.equal((tid('quietud-golpe').texto.match(/Si es Grande o menor/g) ?? []).length, 1, 'idempotente');
});

test('3.67 · Hilo ligado a sus herramientas', () => {
  const hilo = activas.filter(t => t.rama === 'hilo');
  for (const t of hilo) { assert.ok(t.herramienta && HERRAMIENTA_BUSCA[t.herramienta] !== undefined, t.id); assert.equal((t.texto.match(/Herramienta: /g) ?? []).length, 1, t.id); }
  const items = [{ name: 'Agujas (20)', type: 'consumable', system: { quantity: 20 } }, { name: 'Kunai (5)', type: 'weapon', system: { quantity: 5, properties: ['fin', 'lgt', 'thr'] } }];
  assert.equal(buscarHerramienta(items, 'agujas').name, 'Agujas (20)');
  assert.equal(buscarHerramienta(items, 'arrojadiza').name, 'Kunai (5)');
  assert.equal(buscarHerramienta(items, 'marioneta'), null);
  assert.equal(buscarHerramienta([], 'reliquia'), true);
  // 3.69 (prueba en el mundo): la técnica «Lluvia de agujas» no cuenta como agujas.
  assert.equal(buscarHerramienta([{ name: 'Lluvia de agujas', type: 'spell', system: {} }], 'agujas'), null);
  assert.equal(buscarHerramienta([{ name: 'Lluvia de agujas', type: 'spell', system: {} }, items[0]], 'agujas').name, 'Agujas (20)');
  assert.deepEqual(gastoDe(items[0], 'agujas'), { ruta: 'system.quantity', antes: 20, despues: 10, devuelve: 5 });
  assert.deepEqual(gastoDe({ system: { uses: { max: 10, spent: 9 } } }, 'tinta'), { ruta: 'system.uses.spent', antes: 9, despues: 10 });
  assert.equal(gastoDe(items[1], 'arrojadiza'), null, 'el kunai no se gasta');
  const k = D.equipo.find(e => /^Kunai/.test(e.objeto)); assert.ok(k);
  const o = objetoVerbe(k); assert.equal(o.type, 'weapon'); assert.equal(o.system.type.value, 'simpleM'); assert.deepEqual(o.system.damage.base.types, ['piercing']);
});

test('3.67 · cada rama declara su estilo de combate y su utilidad', () => {
  for (const r of D.ramas) { assert.ok(r.estilo?.combate && r.estilo?.utilidad, r.id); if (r.id !== 'sangre') assert.match(r.jugador, /En combate: .*Fuera de combate: /, r.id); }
  assert.match(D.ramas.find(r => r.id === 'sello').jugador, /no chocan/);
});
