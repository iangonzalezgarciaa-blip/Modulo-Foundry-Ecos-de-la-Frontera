import test from "node:test";
import assert from "node:assert/strict";
import { sucesoDe, registrar } from "../scripts/sucesos-dia.js";

test("3.42 · el suceso sale de la tirada y se puede deshacer y volver", () => {
  const l = ["a", "b", "c"];
  assert.deepEqual(sucesoDe(l, 2), { indice: 1, texto: "b" });
  assert.deepEqual(sucesoDe(l, 99), { indice: 2, texto: "c" });
  assert.equal(sucesoDe([], 1), null);
  let e = registrar({}, { dia: 5, estacion: "verano", indice: 0, texto: "a" });
  assert.equal(e.texto, "a"); assert.equal(e.anulado, false);
  e = registrar(e, { dia: 5, estacion: "verano", indice: 2, texto: "c", manual: true });
  assert.equal(e.texto, "c"); assert.equal(e.manual, true); assert.equal(e.historial.length, 1);
  const d = registrar(e, { op: "deshacer" });
  assert.equal(d.anulado, true); assert.equal(d.texto, "c");
  const v = registrar(e, { op: "volver" });
  assert.equal(v.texto, "a"); assert.equal(v.historial.length, 0);
  assert.deepEqual(registrar({}, { op: "volver" }).historial, []);
});

test("3.42 · deshacer devuelve lo que había y borra lo que no existía", async () => {
  await import("./helpers/foundry.mjs").catch(() => null);
  globalThis.foundry ??= { utils: {} };
  const { updateDeshacer } = await import("../scripts/deshacer.js");
  assert.deepEqual(updateDeshacer({ "system.attributes.exhaustion": 2, "flags.ecos-frontera.fama": undefined }),
    { "system.attributes.exhaustion": 2, "flags.ecos-frontera.-=fama": null });
  assert.deepEqual(updateDeshacer({}), {});
});
