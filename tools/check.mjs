import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { readCatalog, validateCatalog } from './catalog.mjs';
const root = fileURLToPath(new URL('..', import.meta.url));
let failed = false;
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
  if (['.git', 'releases', 'node_modules'].includes(e.name)) return [];
  const p = path.join(dir, e.name);
  return e.isDirectory() ? walk(p) : [p];
});
for (const f of walk(root)) {
  if (/\.(?:mjs|cjs|js)$/.test(f)) {
    const r = spawnSync(process.execPath, ['--check', f], { encoding: 'utf8' });
    if (r.status !== 0) { failed = true; console.error(r.stderr); }
  }
  if (f.endsWith('.json')) try { JSON.parse(fs.readFileSync(f, 'utf8')); }
  catch (e) { failed = true; console.error(path.relative(root, f), e.message); }
}
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'module.json'), 'utf8'));
for (const p of [...manifest.esmodules, ...manifest.styles]) if (!fs.existsSync(path.join(root, p))) {
  failed = true; console.error('Falta archivo del manifiesto:', p);
}
for (const f of walk(path.join(root, 'scripts')).filter(f => f.endsWith('.js'))) {
  const source = fs.readFileSync(f, 'utf8');
  for (const m of source.matchAll(/(?:from\s*|import\s*)["'](\.\.?\/[^"']+)["']/g)) {
    if (!fs.existsSync(path.resolve(path.dirname(f), m[1]))) { failed = true; console.error('Import inexistente:', f, m[1]); }
  }
}
const catalog = readCatalog(), errors = validateCatalog(catalog);
if (errors.length) { failed = true; console.error(errors.join('\n')); }
if (failed) process.exitCode = 1;
else console.log(`Sintaxis, JSON, importaciones y catálogo válidos: ${catalog.tecnicas.length} técnicas, ${catalog.dotes.length} dotes.`);
