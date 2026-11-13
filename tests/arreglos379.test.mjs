import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import './helpers/foundry.mjs';
import { decodeCatalog } from '../tools/catalog.mjs';

test('3.79: un estado de id fijo que ya está o va en camino no se crea dos veces (Inconsciente arrastra Derribado)', async () => {
  const { idFijo, idRepetido } = await import('../scripts/mesa-control.js');
  assert.equal(idFijo('dnd5eprone000000'), true);
  assert.equal(idFijo('Qyso4Dar0hEEVzqP'), false);
  assert.equal(idFijo('Qyso4Dar0hEEVzqP', true), true);
  assert.equal(idRepetido({ id: 'dnd5eprone000000', existe: true }), true);
  assert.equal(idRepetido({ id: 'dnd5eprone000000', reservado: true }), true);
  assert.equal(idRepetido({ id: 'dnd5eprone000000' }), false);
  assert.equal(idRepetido({ id: 'Qyso4Dar0hEEVzqP', existe: true }), false, 'un id al azar sin keepId no choca');
});

test('3.79: las reliquias de nivel 9+ son mágicas y piden sintonía (dnd5e 6 borra la sintonía si no lo son)', async () => {
  const { conMagia, cambiosMagia } = await import('../scripts/relics.js');
  const D = decodeCatalog(fs.readFileSync(new URL('../data/reliquias.txt', import.meta.url), 'utf8'));
  const alta = D.reliquias.find(r => r.nivel >= 9), baja = D.reliquias.find(r => r.nivel < 9);
  const it = conMagia(alta.item, alta.nivel);
  assert.equal(it.system.attunement, 'required');
  assert.ok(it.system.properties.includes('mgc'));
  assert.equal(conMagia(baja.item, baja.nivel), baja.item, 'las de nivel bajo no cambian');
  const flags = { 'ecos-frontera': { reliquia: { id: alta.id, nivel: alta.nivel } } };
  const vieja = { flags, getFlag: (m, k) => flags[m]?.[k], _source: { system: { attunement: '', properties: [] } } };
  assert.deepEqual(cambiosMagia(vieja), { 'system.properties': ['mgc'], 'system.attunement': 'required' });
  const lista = { flags, getFlag: (m, k) => flags[m]?.[k], _source: { system: { attunement: 'required', properties: ['mgc'] } } };
  assert.equal(cambiosMagia(lista), null);
});
