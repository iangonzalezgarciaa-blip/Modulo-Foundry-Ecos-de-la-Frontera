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
  const { veDefensa, imagenCandidata, iconoDefensa } = await import("../scripts/token-vista.js");
  assert.equal(veDefensa("todos", false), true); assert.equal(veDefensa("dm", false), false); assert.equal(veDefensa("dm", true), true); assert.equal(veDefensa("nadie", true), false);
  assert.equal(imagenCandidata("systems/dnd5e/tokens/beast/Wolf.webp"), true);
  assert.equal(imagenCandidata("modules/JB2A_DnD5e/x.webp"), true);
  assert.equal(imagenCandidata("icons/svg/mystery-man.svg"), false);
  assert.equal(imagenCandidata("worlds/mio/retratos/pip.webp"), false, "lo que puso Ian en su mundo no se toca");
  assert.equal(iconoDefensa("coraza"), "systems/dnd5e/icons/svg/statuses/marked.svg");
  assert.equal(iconoDefensa("fortaleza"), "icons/svg/holy-shield.svg");
  assert.equal(iconoDefensa("piel"), "systems/dnd5e/icons/svg/statuses/petrified.svg");
  assert.equal(iconoDefensa("inexistente"), null);
  const { tamanoIconoDefensa } = await import("../scripts/token-vista.js");
  assert.equal(tamanoIconoDefensa(80), 5, "el icono ocupa el 30 % del tamaño anterior");
  assert.equal(tamanoIconoDefensa(160), 7, "respeta el límite del icono anterior al reducirlo al 30 %");
  assert.equal(tamanoIconoDefensa(50), 4, "mantiene un mínimo visible incluso en tokens pequeños");
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


test("3.80.4 · el menú de acciones envuelve títulos y descripciones dentro de sus botones", async () => {
  const { readFileSync } = await import("node:fs");
  const css = readFileSync(new URL("../styles/ecos.css", import.meta.url), "utf8");
  const layout = css.slice(css.lastIndexOf("/* 3.80.4 · Menú de acciones:"));
  assert.match(layout, /\.ecos-ae-e\s*\{[^}]*box-sizing:\s*border-box/s);
  assert.match(layout, /\.ecos-ae-e\s*\{[^}]*min-width:\s*0/s);
  assert.match(layout, /\.ecos-ae-e b,\s*\.ecos-ae-e small\s*\{[^}]*white-space:\s*normal/s);
  assert.match(layout, /\.ecos-ae-e b,\s*\.ecos-ae-e small\s*\{[^}]*overflow-wrap:\s*anywhere/s);
  assert.match(layout, /\.ecos-ae-e small\s*\{[^}]*line-height:\s*1\.3/s);
});
