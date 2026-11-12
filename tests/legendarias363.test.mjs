import test from 'node:test';
import assert from 'node:assert/strict';
import './helpers/foundry.mjs';
const L = await import('../scripts/reliquias-legendarias.js');
const A = await import('../scripts/reliquias-almacen.js');
const M = await import('../scripts/reliquias-menores.js');
import { readCatalog } from '../tools/catalog.mjs';
const D = readCatalog();

test('3.63 · las 17 armas legendarias del catálogo tienen su objeto de D&D', () => {
  const ids = D.artefactosShinobi.map(a => a.id).sort();
  assert.deepEqual(Object.keys(L.LEGENDARIAS).sort(), ids);
  for (const [id, x] of Object.entries(L.LEGENDARIAS)) {
    assert.ok(x.aspecto && x.que && x.poder?.nombre && x.poder.texto.length === 2, id);
    const nombre = D.artefactosShinobi.find(a => a.id === id).nombre;
    assert.ok(!L.nombreOculto(x).includes(nombre), `${id}: el nombre oculto no lo revela`);
    assert.match(L.nombreOculto(x), / · sin identificar$/);
  }
  assert.match(L.idFijo('samehada:ataque'), /^[a-zA-Z0-9]{16}$/);
  assert.notEqual(L.idFijo('samehada:ataque'), L.idFijo('samehada:poder'));
});

test('3.63 · etapas: 0 común, 1 +1, 2 +2 con su poder, 3 +3 con el poder completo', () => {
  const s0 = L.datosLegendaria('shibuki', 'Trueno en Láminas', 0, { embebida: true });
  assert.equal(s0['system.identified'], false); assert.equal(s0['system.magicalBonus'], ''); assert.ok(!s0['system.properties'].includes('mgc'));
  assert.equal(s0['system.attunement'], ''); assert.equal(s0[`system.activities.-=${L.idFijo('shibuki:poder')}`], null);
  const s1 = L.datosLegendaria('shibuki', 'Trueno en Láminas', 1);
  assert.equal(s1['system.magicalBonus'], '1'); assert.ok(s1['system.properties'].includes('mgc')); assert.equal(s1['system.attunement'], 'required');
  const s2 = L.datosLegendaria('shibuki', 'Trueno en Láminas', 2), poder = s2[`system.activities.${L.idFijo('shibuki:poder')}`];
  assert.equal(poder.type, 'save'); assert.equal(poder.damage.parts[0].number, 3); assert.equal(poder.uses.max, '1'); assert.equal(poder.uses.recovery[0].period, 'sr');
  const s3 = L.datosLegendaria('shibuki', 'Trueno en Láminas', 3), p3 = s3[`system.activities.${L.idFijo('shibuki:poder')}`];
  assert.equal(s3['system.magicalBonus'], '3'); assert.equal(p3.damage.parts[0].number, 5); assert.equal(p3.uses.max, '2');
  const k3 = L.datosLegendaria('kubikiribocho', 'Segadora del Vado', 3);
  assert.equal(k3[`system.activities.${L.idFijo('kubikiribocho:ataque')}`].attack.critical.threshold, 19);
  const kiba2 = L.datosLegendaria('kiba', 'Gemelas', 2)[`system.activities.${L.idFijo('kiba:ataque')}`];
  assert.equal(kiba2.damage.parts[0].types[0], 'lightning');
  const yata = L.datosLegendaria('yata', 'Espejo', 2); assert.equal(yata['system.armor.magicalBonus'], 2);
  const nui3 = L.datosLegendaria('nuibari', 'Aguja', 3); assert.ok(nui3['system.properties'].includes('rch'));
  const bash = L.datosLegendaria('bashosen', 'Abanico', 3)[`system.activities.${L.idFijo('bashosen:poder')}`];
  assert.equal(bash.target.template.size, '30'); assert.equal(bash.damage.parts[0].types.length, 5);
  for (const id of Object.keys(L.LEGENDARIAS)) for (const e of [0, 1, 2, 3]) {
    const u = L.datosLegendaria(id, id, e); assert.ok(u, id);
    assert.doesNotMatch(JSON.stringify(u), /undefined|NaN/, `${id} etapa ${e}`);
  }
});

test('3.63 · la copia para entregar cuenta como artefacto del Verbe e identificarla la pasa a Dormida', () => {
  const c = L.copiaLegendaria('samehada', 'Fauces de la Marea', 0, { embebida: true });
  assert.equal(c.type, 'weapon'); assert.equal(c.system.type.baseItem, 'greatsword'); assert.equal(c.system.damage.base.denomination, 6);
  assert.equal(c.flags['ecos-frontera'].verbe.artefacto, 'samehada'); assert.equal(c.flags['ecos-frontera'].almacen.legendaria, 'samehada');
  assert.equal(c.system.identified, false); assert.equal(Object.keys(c.system.activities).length, 1);
  const u = A.identificacion({ legendaria: 'samehada', nombre: 'Fauces de la Marea' });
  assert.equal(u['system.identified'], true); assert.equal(u['flags.ecos-frontera.almacen.etapa'], 1); assert.equal(u['system.magicalBonus'], '1');
  assert.equal(L.copiaLegendaria('yata', 'Espejo', 1).system.armor.value, 2);
  assert.equal(L.copiaLegendaria('benihisago', 'Calabaza', 2).type, 'equipment');
  assert.match(L.manualLegendaria('samehada', 'Fauces de la Marea'), /Devorar/);
});

test('3.63 · reliquias menores: hasta muy raras, una por nombre, la de 2024 primero', () => {
  const e = [
    { pack: 'dnd5e.items', id: 'a', nombre: 'Bolsa de contención', tipo: 'container', rareza: 'uncommon' },
    { pack: 'dnd5e.equipment24', id: 'b', nombre: 'Bolsa de contención', tipo: 'container', rareza: 'uncommon' },
    { pack: 'dnd5e.items', id: 'c', nombre: 'Espada vorpal', tipo: 'weapon', rareza: 'legendary' },
    { pack: 'dnd5e.items', id: 'd', nombre: 'Espada larga', tipo: 'weapon', rareza: '' },
    { pack: 'dnd5e.items', id: 'e', nombre: 'Poción de curación', tipo: 'consumable', rareza: 'common' },
    { pack: 'dnd5e.items', id: 'f', nombre: 'Bola de fuego', tipo: 'spell', rareza: 'rare' }
  ];
  const r = M.elegirMenores(e);
  assert.deepEqual(r.map(x => [x.nombre, x.pack, x.nivel]), [['Poción de curación', 'dnd5e.items', 1], ['Bolsa de contención', 'dnd5e.equipment24', 3]]);
  assert.equal(M.nivelMenor('veryRare'), 11); assert.equal(M.nivelMenor('legendary'), null);
  assert.match(M.notaMenor(5), /desde nivel 5/);
});

test('3.63 · objetos del Verbe con tipo de D&D, precio y nivel', () => {
  for (const e of D.equipo) {
    const o = M.objetoVerbe(e);
    assert.ok(o.name && o.type && o.flags['ecos-frontera'].objetoVerbe.nivel >= 1, e.objeto);
    assert.doesNotMatch(JSON.stringify(o), /undefined|NaN/, e.objeto);
  }
  const est = M.objetoVerbe(D.equipo.find(e => /Estrellas/.test(e.objeto)));
  assert.equal(est.type, 'weapon'); assert.equal(est.system.range.value, 20); assert.equal(est.system.range.long, 60); assert.equal(est.system.quantity, 5);
  assert.equal(M.objetoVerbe(D.equipo.find(e => /Tinta/.test(e.objeto))).system.uses.max, '10');
});
