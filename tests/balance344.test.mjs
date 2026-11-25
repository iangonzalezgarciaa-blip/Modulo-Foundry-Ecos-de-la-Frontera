import test from "node:test";
import assert from "node:assert/strict";
import { xpDe, presupuestoGrupo, clasificar, letalSola, sugerir, normalizarBando, bandoDeToken, disposicionDeBando, hostilesEscena, aliadosEscena, neutralesEscena } from "../scripts/balance-encuentro.js";

test("3.44 · presupuesto 2024 y clasificación", () => {
  assert.deepEqual(presupuestoGrupo([2, 2]), { bajo: 200, moderado: 300, alto: 400 });
  assert.equal(xpDe(0.5), 100); assert.equal(xpDe(5), 1800); assert.equal(xpDe(30), 155000);
  const p = presupuestoGrupo([2, 2]);
  assert.equal(clasificar(50, p), "trivial");
  assert.equal(clasificar(250, p), "bajo");
  assert.equal(clasificar(350, p), "moderado");
  assert.equal(clasificar(450, p), "alto");
  assert.equal(clasificar(1800, p), "letal");
  assert.equal(clasificar(100, { bajo: 0, moderado: 0, alto: 0 }), "sin grupo");
});
test("3.44 · letal por sí sola y recomendación interesante", () => {
  assert.equal(letalSola(5, [2, 2]), true);
  assert.equal(letalSola(4, [2, 2]), false);
  const cands = [{ id: "a", nombre: "Lobo", cr: 0.25, xp: 50 }, { id: "b", nombre: "Matón", cr: 0.5, xp: 100 }, { id: "c", nombre: "Ogro", cr: 2, xp: 450 }];
  const s = sugerir({ xpActual: 100, objetivo: 350, candidatos: cands, nPJ: 2, nEnemigos: 1, nivelMedio: 2 });
  assert.ok(s.n >= 1 && s.n <= 3, "entre 1 y 2 enemigos por PJ");
  assert.ok(Math.abs(s.xpFinal - 350) <= 70);
  assert.notEqual(s.candidato.id, "c", "no suma algo que se pasa del objetivo");
  assert.equal(sugerir({ xpActual: 500, objetivo: 350, candidatos: cands }).n, 0);
});

test("3.81 · la clasificación persistente de token separa aliados, neutrales y enemigos", () => {
  assert.equal(normalizarBando("aliado"), "aliado");
  assert.equal(normalizarBando("neutral"), "neutral");
  assert.equal(normalizarBando("enemigo"), "enemigo");
  assert.equal(normalizarBando("otro"), null);
  assert.equal(disposicionDeBando("aliado"), 1);
  assert.equal(disposicionDeBando("neutral"), 0);
  assert.equal(disposicionDeBando("enemigo"), -1);
  const make = (id, type, disposition, balanceBando = null) => ({
    id, name: id, disposition, actor: { type, hasPlayerOwner: false, flags: balanceBando ? { "ecos-frontera": { balanceBando } } : {} },
    flags: balanceBando ? { "ecos-frontera": { balanceBando } } : {}
  });
  const tokens = [
    make("a", "npc", 1, "aliado"), make("n", "npc", 0, "neutral"),
    make("e", "npc", -1, "enemigo"), make("default", "npc", -1)
  ];
  const scene = { tokens };
  assert.equal(bandoDeToken(tokens[0]), "aliado");
  assert.deepEqual(aliadosEscena(scene).map(t => t.id), ["a"]);
  assert.deepEqual(neutralesEscena(scene).map(t => t.id), ["n"]);
  assert.deepEqual(hostilesEscena(scene).map(t => t.id), ["e", "default"]);
  assert.ok(!hostilesEscena(scene).some(t => t.id === "n"), "neutral no suma XP enemiga");
  assert.ok(!aliadosEscena(scene).some(t => t.id === "n"), "neutral no suma presupuesto aliado");
});
test("3.86 · el bando persistente del Actor prevalece sobre una copia antigua del token", () => {
  const actor = { type: "npc", hasPlayerOwner: false, flags: { "ecos-frontera": { balanceBando: "neutral" } } };
  const token = { actor, disposition: -1, flags: { "ecos-frontera": { balanceBando: "enemigo" } } };
  assert.equal(bandoDeToken(token), "neutral");
  const scene = { tokens: [token] };
  assert.deepEqual(hostilesEscena(scene), []);
  assert.deepEqual(aliadosEscena(scene), []);
  assert.deepEqual(neutralesEscena(scene).map(t => t), [token]);
});
