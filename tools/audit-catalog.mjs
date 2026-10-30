import { readCatalog, validateCatalog } from './catalog.mjs';
const D = readCatalog();
const branches = Object.fromEntries(D.ramas.map(r => [r.nombre, D.tecnicas.filter(t => t.rama === r.id).length]));
const utility = D.tecnicas.filter(t => !t.item.effects?.length && Object.values(t.item.system.activities).every(a => a.type === 'utility'));
console.log(JSON.stringify({ techniques: D.tecnicas.length, feats: D.dotes.length, branches,
  validationErrors: validateCatalog(D), utilityWithoutEffects: utility.map(t => ({ id: t.id, name: t.n })) }, null, 2));
