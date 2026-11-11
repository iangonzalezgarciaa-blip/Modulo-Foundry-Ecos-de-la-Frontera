// 3.32 · Efectos propios (pedido del autor): las técnicas solo sobre ti cuyo efecto el módulo puede aplicar solo.
// Guardia de hierro: +1 a la CA y velocidad 0 hasta el inicio de tu próximo turno. Idempotente.
import { readCatalog, writeCatalog } from './catalog.mjs';
const D = readCatalog();
const PROPIOS = {
  'cuerpo-guardia': [{ name: 'Guardia de hierro', img: 'systems/dnd5e/icons/svg/abilities/constitution.svg',
    changes: [{ key: 'system.attributes.ac.bonus', mode: 2, value: '+1' }, { key: 'system.attributes.movement.walk', mode: 5, value: '0' }],
    duration: { rounds: 1, seconds: 6 }, description: '<p>+1 a la CA y velocidad 0 hasta el inicio de tu próximo turno.</p>',
    flags: { dae: { specialDuration: ['turnStart'] } } }]
};
let n = 0;
for (const [id, efs] of Object.entries(PROPIOS)) {
  const t = D.tecnicas.find(x => x.id === id);
  if (!t) continue;
  t.item.effects = (t.item.effects ?? []).filter(e => !e.flags?.['ecos-frontera']?.verbe?.propio);
  const act = Object.values(t.item.system.activities)[0];
  act.effects = (act.effects ?? []).filter(e => !String(e._id).startsWith('propio'));
  efs.forEach((e, i) => {
    const _id = `propio${id.replace(/[^a-z]/g, '').slice(0, 7)}${i}`.padEnd(16, '0').slice(0, 16);
    t.item.effects.push({ _id, transfer: false, disabled: false, statuses: [], ...e, flags: { ...e.flags, 'ecos-frontera': { verbe: { propio: true } } } });
    act.effects.push({ _id, onSave: false });
    n++;
  });
}
writeCatalog(D);
console.log(`Efectos propios: ${n}.`);
