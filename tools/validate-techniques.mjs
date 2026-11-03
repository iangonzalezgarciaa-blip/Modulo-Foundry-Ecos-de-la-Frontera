/** Informe del validador de técnicas (tarea 1.1). Uso: node tools/validate-techniques.mjs [--json]. Sale con código 1 si hay errores. */
import { readCatalog } from './catalog.mjs';
import { validarTecnicas } from '../scripts/verbe-validate.js';
const D = readCatalog(), r = validarTecnicas(D.tecnicas);
if (process.argv.includes('--json')) console.log(JSON.stringify(r, null, 2));
else {
  console.log(`Técnicas revisadas: ${r.total} · errores: ${r.errores} · avisos: ${r.avisos}`);
  const porCodigo = {};
  for (const p of r.problemas) (porCodigo[`${p.nivel} · ${p.codigo}`] ??= []).push(p.id);
  for (const [k, ids] of Object.entries(porCodigo)) console.log(`\n${k} (${ids.length}): ${ids.join(', ')}`);
}
if (r.errores) process.exitCode = 1;
