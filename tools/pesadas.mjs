/**
 * 3.28 · Técnicas pesadas (pedido del autor). Idempotente. Son las grandes de un solo golpe: las cargadas que dañan y los
 * golpes cuerpo a cuerpo de grado 3 o más con mucho daño, más las firmas de la lista. Atraviesan cualquier defensa, pero
 * abren la guardia de quien las suelta (ataque de oportunidad), salvo que lleve un ojo abierto. Ver scripts/ruptura.js.
 */
import { readCatalog, writeCatalog, validateCatalog } from './catalog.mjs';

const FIRMAS = ['forma-esfera', 'forma-esfera-mayor', 'rayo-cielo', 'rayo-lanza-trueno', 'forma-colmillo-tormenta', 'vasija-bomba', 'vasija-gudodama-golpe'];
const TEXTO = '<p><b>Pesada.</b> Atraviesa cualquier defensa: su ataque no cuenta la Coraza del blanco, su salvación no cuenta la Fortaleza y su daño ignora resistencias. Pero abre tu guardia: al soltarla, cada enemigo a 5 ft puede hacerte un ataque de oportunidad, salvo que lleves un ojo abierto. Una Sustitución mejorada la esquiva igual.</p>';
const dadosMedios = s => { const m = String(s ?? '').match(/(\d+)d(\d+)/); return m ? Number(m[1]) * (Number(m[2]) + 1) / 2 : 0; };
const cuerpo = a => /toque|^1[.,]5 ?m|^3 ?m/.test(String(a ?? ''));
export function esPesadaCatalogo(t) {
  if (FIRMAS.includes(t.id)) return true;
  const meta = t.item?.flags?.['ecos-frontera']?.verbe ?? {};
  if (meta.cargada && t.tir && t.dmg) return true;
  return t.tir === 'ataque' && cuerpo(t.alc) && t.g >= 3 && dadosMedios(t.dmg) >= 30;
}
const D = readCatalog();
let n = 0;
for (const t of D.tecnicas) {
  const meta = t.item?.flags?.['ecos-frontera']?.verbe;
  const si = esPesadaCatalogo(t);
  t.pesada = si || undefined;
  if (meta) { if (si) meta.pesada = true; else delete meta.pesada; }
  const desc = t.item?.system?.description;
  if (desc) desc.value = String(desc.value ?? '').replace(TEXTO, '') + (si ? TEXTO : '');
  if (si) n += 1;
}
D.pesadas = { version: 1, total: n };
const errores = validateCatalog(D); if (errores.length) throw Error(errores.join('\n'));
writeCatalog(D);
console.log(`Técnicas pesadas: ${n}.`);
