import test from 'node:test';
import assert from 'node:assert/strict';
import { precioMonedas, pagoPorVenta, trazosComprables, sortearSurtido, tarjetaMercaderHTML, SURTIDO } from '../scripts/mercader.js';

test('3.12: precios en Monedas Antiguas por rareza; las reliquias valen una más y el mercader las paga enteras', () => {
  assert.equal(precioMonedas('uncommon'), 1); assert.equal(precioMonedas('legendary'), 7); assert.equal(precioMonedas('rare', true), 3);
  assert.equal(precioMonedas('common'), null); assert.equal(precioMonedas('artifact'), null);
  assert.equal(pagoPorVenta('veryRare'), 2); assert.equal(pagoPorVenta('veryRare', true), 5); assert.equal(pagoPorVenta('uncommon'), 1);
});

test('3.17: Trazos por Monedas como en la guía del Verbe: 1 por Trazo y como mucho 2 en cada nivel', () => {
  assert.equal(trazosComprables(8, 0), 2);
  assert.equal(trazosComprables(8, 1), 1);
  assert.equal(trazosComprables(8, 2), 0);
  assert.equal(trazosComprables(1, 0), 1);
  assert.equal(trazosComprables(0, 0), 0);
});

test('el surtido sale sin repetir, con precio, y solo con cosas que se venden', () => {
  const cands = Array.from({ length: 60 }, (_, i) => ({ uuid: 'u' + i, name: 'Obj ' + i, img: '', rareza: ['uncommon', 'rare', 'veryRare', 'legendary', 'common'][i % 5], reliquia: i % 7 === 0 }));
  let semilla = 1; const rng = () => ((semilla = (semilla * 16807) % 2147483647) / 2147483647);
  const s = sortearSurtido(cands, SURTIDO, rng);
  assert.equal(s.length, 15); assert.equal(new Set(s.map(x => x.uuid)).size, 15);
  assert.ok(s.every(x => x.rareza !== 'common' && x.precio >= 1 && x.vendido === false));
  const html = tarjetaMercaderHTML({ items: s });
  assert.equal((html.match(/data-ecos-mercader="comprar"/g) ?? []).length, 15);
  assert.match(html, /Venderle algo raro/); assert.doesNotMatch(html, /undefined/);
});
