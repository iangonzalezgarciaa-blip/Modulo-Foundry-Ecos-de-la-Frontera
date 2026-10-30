import { readCatalog, writeCatalog, validateCatalog } from './catalog.mjs';
const D = readCatalog(), changes = [];
for (const t of D.tecnicas) {
  const meta = t.item.flags['ecos-frontera'].verbe;
  if (t.item.system.level !== t.g) {
    t.item.system.level = t.g;
    changes.push(`${t.id}: grado del objeto`);
  }
  const m = String(meta.sube ?? '').match(/^\+(\d+)d(\d+)$/);
  if (!m) continue;
  for (const a of Object.values(t.item.system.activities)) {
    const p = a.healing ?? a.damage?.parts?.[0];
    if (!p?.number || p.custom?.enabled || p.denomination !== Number(m[2])) continue;
    if (p.scaling?.mode === 'whole' && p.scaling.number === Number(m[1])) continue;
    p.scaling = { mode: 'whole', number: Number(m[1]), formula: '' };
    changes.push(t.id);
  }
}
D.version = Math.max(6, Number(D.version) || 0);
const errors = validateCatalog(D);
if (errors.length) throw new Error(errors.join('\n'));
writeCatalog(D);
console.log(JSON.stringify({ repaired: changes, techniques: D.tecnicas.length, feats: D.dotes.length }));
