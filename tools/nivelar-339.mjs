/**
 * 3.39 · Nivelado (pedido del autor: «nivela y audita el mod completo»). Idempotente; va al final de catalog:expand.
 *  - Regla del autor (3.34): toda técnica que hace daño cuesta al menos 1 Verbe. El panel ya lo cobraba; ahora el
 *    catálogo y su informe dicen lo mismo (los trucos de daño de grado 0 pasan de 0 a 1).
 */
import { readCatalog, writeCatalog, validateCatalog } from './catalog.mjs';
const D = readCatalog();
const hazDano = t => /\d+d\d+/.test(String(t.dmg ?? '')) && !/^cura|cura\b|PG temporales/i.test(String(t.dmg ?? ''));
let n = 0;
for (const t of D.tecnicas) if (Number(t.g) === 0 && hazDano(t) && !(Number(t.costo) >= 1)) { t.costo = 1; n++; }
D.nivelado339 = { trucosDano: D.tecnicas.filter(t => Number(t.g) === 0 && hazDano(t)).length };
const errores = validateCatalog(D); if (errores.length) throw Error(errores.join('\n'));
writeCatalog(D);
console.log(`3.39: ${D.nivelado339.trucosDano} técnicas de grado 0 con daño cuestan 1 Verbe (${n} cambiadas ahora).`);
