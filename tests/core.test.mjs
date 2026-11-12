import test from 'node:test';
import assert from 'node:assert/strict';
import { recuperarReserva, evaluarGasto, resultadoChoque, requisitoNatural, crearCola,
  presupuestoTecnica, validarCreacion } from '../scripts/verbe-core.js';
import { readCatalog, encodeCatalog, decodeCatalog, validateCatalog } from '../tools/catalog.mjs';
const D = readCatalog();

test('la deuda conserva el punto impar entre recuperaciones', () => {
  assert.deepEqual(recuperarReserva({ valor: -2, cantidad: 1, maximo: 5 }), { valor: -2, resto: 1 });
  assert.deepEqual(recuperarReserva({ valor: -2, cantidad: 1, resto: 1, maximo: 5 }), { valor: -1, resto: 0 });
});
test('al cancelar la deuda el excedente vuelve a recuperar a razón 1:1', () => {
  assert.deepEqual(recuperarReserva({ valor: -2, cantidad: 7, maximo: 20 }), { valor: 3, resto: 0 });
  assert.deepEqual(recuperarReserva({ valor: -5, cantidad: 4, maximo: 20 }), { valor: -3, resto: 0 });
  assert.deepEqual(recuperarReserva({ valor: 19, cantidad: 9, maximo: 20 }), { valor: 20, resto: 0 });
});
test('recuperar en varios pagos equivale a recuperar todo junto', () => {
  for (let valor = -15; valor <= 15; valor++) for (let a = 0; a <= 12; a++) for (let b = 0; b <= 12; b++) {
    const uno = recuperarReserva({ valor, cantidad: a, maximo: 20 });
    const dos = recuperarReserva({ ...uno, cantidad: b, maximo: 20 });
    assert.deepEqual(dos, recuperarReserva({ valor, cantidad: a + b, maximo: 20 }));
  }
});
test('sobreesfuerzo, incapacidad, reacción y grado alto se validan juntos', () => {
  const base = { valor: 0, costo: 2, limite: -4, grado: 1, agotamiento: 3 };
  assert.equal(evaluarGasto(base).ok, true);
  for (const patch of [{ agotamiento: 4 }, { incapacitado: true }, { reaccion: true, puedeReaccionar: false },
    { costo: NaN }, { costo: -1 }, { grado: 1.5 }, { grado: 12 }, { gradoMaximo: 0 }]) {
    assert.equal(evaluarGasto({ ...base, ...patch }).ok, false, JSON.stringify(patch));
  }
  assert.equal(evaluarGasto({ ...base, grado: 6, altoGastado: true }).ok, false);
  // 3.34: sin Verbe, grado 0 cuesta 1 en negativo (se puede seguir forzando).
  const g0 = evaluarGasto({ ...base, grado: 0, costo: 0 });
  assert.equal(g0.ok, true); assert.equal(g0.despues, -1); assert.equal(g0.costo, 1); assert.equal(g0.sobreesfuerzo, true);
  assert.equal(evaluarGasto({ ...base, valor: 3, grado: 0, costo: 0 }).despues, 3, 'con Verbe, grado 0 sigue gratis');
  assert.equal(evaluarGasto({ ...base, valor: 2, agotamiento: 6 }).ok, true);
});
test('el ciclo no vence diferencias ilimitadas de potencia', () => {
  assert.equal(resultadoChoque(0, 11, 1).gana, -1);
  assert.equal(resultadoChoque(1, 2, 1).gana, 1);
  assert.equal(resultadoChoque(1, 3, 1).gana, 0);
  assert.equal(resultadoChoque(0, 11, 1, 'clasico').gana, 1);
  for (let a = 0; a <= 11; a++) for (let b = 0; b <= 11; b++) for (const ciclo of [-1, 0, 1]) {
    assert.equal(resultadoChoque(a, b, ciclo).gana || 0, -resultadoChoque(b, a, -ciclo).gana || 0);
  }
});
test('cada corazón elemental exige su naturaleza', () => {
  for (const nat of ['Fuego', 'Agua', 'Viento', 'Tierra', 'Rayo']) {
    assert.equal(requisitoNatural(`naturaleza ${nat}`, [nat.toLowerCase()]).ok, true);
    assert.equal(requisitoNatural(`naturaleza ${nat}`, []).ok, false);
  }
  assert.equal(requisitoNatural('dos naturalezas', ['fuego']).ok, false);
});
test('la cola serializa escrituras y continúa después de un error', async () => {
  const queue = crearCola(); let value = 0;
  const trabajos = Array.from({ length: 20 }, () => queue('actor', async () => {
    const antes = value;
    await Promise.resolve();
    value = antes + 1;
  }));
  await Promise.all(trabajos);
  assert.equal(value, 20);
  await assert.rejects(queue('actor', () => { throw Error('fallo simulado'); }));
  await queue('actor', () => { value++; });
  assert.equal(value, 21);
});
test('el presupuesto incluye el estado automático del elemento', () => {
  const f = { grado: 1, tiempo: 'A', rama: 'forma', areaTipo: 'ninguna', estados: 0, tirada: 'ataque', alcance: '18' };
  const sin = presupuestoTecnica(f, D.presupuesto, 0), con = presupuestoTecnica(f, D.presupuesto, 1);
  assert.ok(con.n * (con.d + 1) < sin.n * (sin.d + 1));
});
test('la creación señala daño y geometría fuera de presupuesto', () => {
  const f = { nombre: 'Prueba', grado: 1, dadosN: 20, dadosD: 12, alcance: '90', areaTipo: 'esfera', areaTam: 90, estados: 0 };
  const r = validarCreacion(f, { propuesta: { n: 2, d: 6 }, maxGrado: 1 });
  assert.equal(r.ok, false);
  assert.ok(r.errores.some(e => e.includes('alcance')));
  assert.ok(r.errores.some(e => e.includes('área')));
  assert.ok(r.errores.some(e => e.includes('daño')));
});
test('el catálogo conserva las 401 técnicas base, añade el repertorio y codifica sin pérdida', () => {
  assert.equal(D.tecnicas.length, 401 + D.shinobi.nuevas + (D.divinidad?.nuevas??0) + (D.vida?.nuevas??0) + (D.entrenamiento?.nuevas??0) + (D.contra?.nuevas??0) + (D.cargadas?.nuevas??0) + (D.clones?.tecnicas??0) + (D.ruptura?.tecnicas??0) + (D.formaPura?.nuevas??0) + (D.reglas334?.escapes??0));
  assert.equal(D.tecnicas.filter(t=>!t.item.flags['ecos-frontera'].verbe.shinobi && !t.divina && !t.vida && !t.entrenamiento && !t.contra && !t.cargadaNueva && !t.clonNuevo && !t.formaPura && !t.ruptura && !t.escape).length,401);
  assert.equal(D.dotes.length, D.progresion.dotesBase+D.progresion.dotesNuevas+(D.clones?.dotes??0)+(D.ruptura?.dotes??0)+(D.legados?.dotes??0)+(D.reglas334?.dotes??0)+(D.ajustes362?.dotes??0)+(D.ajustes365?.dotes??0)+(D.ajustes368?.dotes??0));
  assert.deepEqual(decodeCatalog(encodeCatalog(D)), D);
  assert.deepEqual(validateCatalog(D), []);
});
