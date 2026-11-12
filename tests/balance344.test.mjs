import test from "node:test";
import assert from "node:assert/strict";
import { xpDe, presupuestoGrupo, clasificar, letalSola, sugerir } from "../scripts/balance-encuentro.js";

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
