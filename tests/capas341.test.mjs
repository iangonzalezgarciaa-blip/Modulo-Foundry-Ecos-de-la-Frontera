import test from "node:test";
import assert from "node:assert/strict";
import { pasosResaca, capaQueCobra, cobro, cdLlamada } from "../scripts/capas-abismo.js";

test("3.41 · volver se paga capa por capa; bajar no cuesta", () => {
  assert.deepEqual(pasosResaca(5, 0), [5, 4, 3, 2, 1]);
  assert.deepEqual(pasosResaca(3, 2), [3]);
  assert.deepEqual(pasosResaca(2, 4), []);
});
test("3.41 · dormir, cristal mudo y Camino cambian la capa que cobra", () => {
  assert.deepEqual(capaQueCobra(2), { capa: 2, mitad: false });
  assert.deepEqual(capaQueCobra(2, { durmio: true }), { capa: 3, mitad: false });
  assert.deepEqual(capaQueCobra(3, { cristal: true }), { capa: 2, mitad: false });
  assert.equal(capaQueCobra(1, { cristal: true }), null);
  assert.deepEqual(capaQueCobra(5, { cristal: true }), { capa: 5, mitad: true }, "de la 5 hacia adentro solo baja el daño");
  assert.equal(capaQueCobra(6, { camino: true }), null);
  assert.deepEqual(capaQueCobra(7, { durmio: true }), { capa: 7, mitad: false });
});
test("3.41 · el cobro sale de la tabla del mundo", () => {
  const capa = { n: 4, cd: 15, falla: { agot: 2, dano: "4d10", tipo: "necrotic", nota: "pierde un recuerdo" }, supera: { mitad: true, dano: "4d10", tipo: "necrotic" } };
  assert.deepEqual(cobro(capa, false), { muerte: false, sonado: false, agot: 2, dano: "4d10", tipo: "necrotic", mitadDano: false, envenenado: null, nota: "pierde un recuerdo" });
  assert.equal(cobro(capa, true).mitadDano, true);
  assert.equal(cobro(capa, false, { mitad: true }).mitadDano, true);
  assert.equal(cobro({ n: 7, muerte: true }, false).muerte, true);
  assert.equal(cobro({ n: 6, sonado: true, falla: {}, supera: { agot: 4 } }, false).sonado, true);
  assert.equal(cobro({ n: 6, sonado: true, falla: {}, supera: { agot: 4 } }, true).agot, 4);
  assert.equal(cobro(null, true), null);
});
test("3.41 · la llamada del amanecer", () => {
  assert.equal(cdLlamada(2), null);
  assert.equal(cdLlamada(3), 13);
  assert.equal(cdLlamada(5, { desde: 3, base: 10 }), 15);
});

test("3.41 · traducir fichas: copia nombre, descripción y actividades distintos", async () => {
  const { cambiosTraduccion, esFuenteDnd } = await import("../scripts/traducir-fichas.js");
  const item = { _id: "a1", name: "Second Wind", system: { description: { value: "<p>EN</p>" }, activities: { x: { name: "Heal" } } } };
  const fuente = { name: "Tomar aliento", system: { description: { value: "<p>ES</p>" }, activities: { x: { name: "Curar" }, y: { name: "Otra" } } } };
  assert.deepEqual(cambiosTraduccion(item, fuente), { _id: "a1", name: "Tomar aliento", "system.description.value": "<p>ES</p>", "system.activities.x.name": "Curar" });
  assert.equal(cambiosTraduccion({ ...item, name: "Tomar aliento", system: fuente.system }, fuente), null);
  assert.equal(cambiosTraduccion(item, null), null);
  assert.equal(esFuenteDnd("Compendium.dnd5e.classes24.Item.x"), true);
  assert.equal(esFuenteDnd("Compendium.world.algo.Item.x"), false);
});
test("3.51 · traducir solo lo que sigue en inglés: un nombre propio o ya en español no se toca", async () => {
  const { cambiosTraduccion, esEspanol } = await import("../scripts/traducir-fichas.js");
  const fuente = { name: "Armadura de bandas", flags: { babele: { originalName: "Splint Armor" } }, system: { description: { value: "<p>ES</p>" } } };
  assert.equal(cambiosTraduccion({ _id: "a", name: "Splint Armor", system: { description: { value: "<p>EN</p>" } } }, fuente).name, "Armadura de bandas");
  assert.equal(cambiosTraduccion({ _id: "a", name: "Armadura de placas", system: { description: { value: "<p>x</p>" } } }, fuente), null);
  assert.equal(cambiosTraduccion({ _id: "a", name: "Martillo de forja", system: {} }, { name: "Martillo de guerra", system: {} }), null, "sin Babele: ya está en español");
  assert.equal(esEspanol("Relámpago"), true); assert.equal(esEspanol("Bless"), false);
});
