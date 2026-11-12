import test from "node:test";
import assert from "node:assert/strict";
import { moverReloj, tocaPorDias, relojSVG } from "../scripts/relojes-faccion.js";

test("3.43 · los relojes de facción avanzan, retroceden y avisan al llenarse una sola vez", () => {
  assert.deepEqual(moverReloj(5, 6, 1), { valor: 6, lleno: true, segmentos: 6 });
  assert.deepEqual(moverReloj(6, 6, 1), { valor: 6, lleno: false, segmentos: 6 });
  assert.deepEqual(moverReloj(0, 4, -1), { valor: 0, lleno: false, segmentos: 4 });
  assert.equal(moverReloj(2, 8, 3).valor, 5);
  assert.equal(moverReloj(undefined, undefined, 1).segmentos, 6);
});
test("3.43 · ritmo por días y dibujo", () => {
  assert.equal(tocaPorDias(7, 10, 17), true);
  assert.equal(tocaPorDias(7, 10, 16), false);
  assert.equal(tocaPorDias(null, 0, 99), false);
  const svg = relojSVG(2, 4);
  assert.equal((svg.match(/<path/g) ?? []).length, 4);
  assert.match(svg, /2 de 4/);
});

test("3.43 · defensa a la vista y candidatas a silueta", async () => {
  const { veDefensa, imagenCandidata, LETRA_DEFENSA } = await import("../scripts/token-vista.js");
  assert.equal(veDefensa("todos", false), true); assert.equal(veDefensa("dm", false), false); assert.equal(veDefensa("dm", true), true); assert.equal(veDefensa("nadie", true), false);
  assert.equal(imagenCandidata("systems/dnd5e/tokens/beast/Wolf.webp"), true);
  assert.equal(imagenCandidata("modules/JB2A_DnD5e/x.webp"), true);
  assert.equal(imagenCandidata("icons/svg/mystery-man.svg"), false);
  assert.equal(imagenCandidata("worlds/mio/retratos/pip.webp"), false, "lo que puso Ian en su mundo no se toca");
  assert.equal(LETRA_DEFENSA.coraza, "C");
});

test("3.43 · viajes: el ritmo cambia el umbral de encuentro; 20 en el hallazgo encuentra un lugar", async () => {
  const { planViaje, RITMOS } = await import("../scripts/viajes.js");
  const p = planViaje({ dias: 3, ritmo: "rapido", tiradas: [14, 13, 20], hallazgos: [20, 5, 1] });
  assert.deepEqual(p.map(x => x.encuentro), [true, false, true]);
  assert.deepEqual(p.map(x => x.hallazgo), [true, false, false]);
  assert.equal(planViaje({ dias: 1, ritmo: "lento", tiradas: [17] })[0].encuentro, false);
  assert.equal(RITMOS.normal.umbral, 16);
  assert.equal(planViaje({}).length, 1);
});
