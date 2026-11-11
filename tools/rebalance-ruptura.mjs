/**
 * 3.30 · Re-nivelado táctico (pedido del autor): D&D es el cañón de golpe; el Verbe ablanda. Las técnicas de grado 1 o
 * más que hacen daño pierden un 30 % de sus dados y, a cambio, dejan una ruptura elegida con lógica de elementos:
 *  - Brecha (−2 CA): lo que corta, aplasta, quema o congela la coraza: tierra, arena, madera, hierro, magma, viento,
 *    fuego, escarcha; daño contundente, cortante, perforante, ácido, fuego o frío; fuerza física (Cuerpo, Hilo, Umbral…).
 *  - Grieta (−2 salvaciones): lo que entra al cuerpo o a la mente: agua, vapor, ceniza, rayo, corriente, tormenta,
 *    destello, raíz; daño psíquico, necrótico, veneno, radiante, relámpago o trueno; fuerza de Sello, Quietud, Velo…
 *  - Quebrado: las de grado 7 o más (lo enorme rompe cualquier defensa un turno).
 * Quedan como estaban: las de grado 0, las que curan, las pesadas (atraviesan todo) y las que ya son de ruptura.
 * Idempotente: guarda los dados de antes en `rupturaAuto.antes`.
 */
import { readCatalog, writeCatalog, validateCatalog } from './catalog.mjs';
import { idNativo } from './build-shinobi.mjs';
import { esPesadaCatalogo } from './pesadas.mjs';
import { fichaLecturaHTML } from '../scripts/verbe-reading.js';

export const FACTOR = 0.7;
const BRECHA = 'ecosBrecha', GRIETA = 'ecosGrieta', QUEBRADO = 'ecosQuebrado';
const POR_NAT = { tierra: BRECHA, arena: BRECHA, madera: BRECHA, hierro: BRECHA, magma: BRECHA, viento: BRECHA, fuego: BRECHA, escarcha: BRECHA,
  agua: GRIETA, vapor: GRIETA, ceniza: GRIETA, rayo: GRIETA, corriente: GRIETA, tormenta: GRIETA, destello: GRIETA, raiz: GRIETA };
const POR_TIPO = { bludgeoning: BRECHA, slashing: BRECHA, piercing: BRECHA, acid: BRECHA, fire: BRECHA, cold: BRECHA,
  psychic: GRIETA, necrotic: GRIETA, poison: GRIETA, radiant: GRIETA, lightning: GRIETA, thunder: GRIETA };
const FUERZA_GRIETA = new Set(['sello', 'quietud', 'velo', 'mirada', 'pulso', 'sangre']);
/** La ruptura que le toca a una técnica. Pura. */
export function rupturaDe({ g, nat, rama, tipos }) {
  if (Number(g) >= 7) return QUEBRADO;
  const n = String(nat ?? '').split(':')[0];
  if (POR_NAT[n]) return POR_NAT[n];
  for (const t of tipos ?? []) if (POR_TIPO[t]) return POR_TIPO[t];
  return FUERZA_GRIETA.has(rama) ? GRIETA : BRECHA;
}
const DATOS = {
  [BRECHA]: { name: 'Brecha', img: 'systems/dnd5e/icons/svg/statuses/bleeding.svg', changes: [{ key: 'system.attributes.ac.bonus', mode: 2, value: '-2' }], dura: 60, texto: 'deja Brecha (−2 a la CA durante 1 minuto; hasta 3 se acumulan)' },
  [GRIETA]: { name: 'Grieta', img: 'systems/dnd5e/icons/svg/statuses/cursed.svg', changes: [{ key: 'system.bonuses.abilities.save', mode: 2, value: '-2' }], dura: 60, texto: 'deja Grieta (−2 a todas sus salvaciones durante 1 minuto; hasta 3 se acumulan)' },
  [QUEBRADO]: { name: 'Quebrado', img: 'systems/dnd5e/icons/svg/statuses/exhaustion.svg', changes: [], dura: 6, texto: 'deja Quebrado (hasta el final de su próximo turno no cuenta su defensa y el daño ignora sus resistencias)' }
};
const MARCA = ' Ablanda: ';
/** Dados después del recorte: con 1 o 2 dados no se toca (ya es poco); desde 3, el 70 % redondeado. */
export const reducir = n => (Number(n) <= 2 ? Number(n) : Math.max(1, Math.round(Number(n) * FACTOR)));

export function rebalancear(D) {
  let n = 0;
  for (const t of D.tecnicas) {
    if (!(t.g >= 1) || t.ruptura?.length || esPesadaCatalogo(t)) continue;
    const acts = Object.values(t.item?.system?.activities ?? {});
    const a = acts.find(x => x.damage?.parts?.length && ['attack', 'save', 'damage'].includes(x.type));
    if (!a) continue;
    const tipos = a.damage.parts.flatMap(p => [...(p.types ?? [])]);
    if (tipos.includes('healing') || tipos.includes('temphp')) continue;
    const previo = t.rupturaAuto;
    const antes = previo?.antes ?? a.damage.parts.map(p => Number(p.number) || 0);
    a.damage.parts.forEach((p, i) => { if (antes[i]) p.number = reducir(antes[i]); });
    const id = rupturaDe({ g: t.g, nat: t.nat, rama: t.rama, tipos }), d = DATOS[id];
    const eid = idNativo(`${t.id}:ruptura`);
    t.item.effects = (t.item.effects ?? []).filter(e => e._id !== eid);
    t.item.effects.push({ _id: eid, name: d.name, img: d.img, statuses: [id], changes: d.changes.map(c => ({ ...c })), transfer: false, disabled: false,
      duration: { seconds: d.dura, rounds: Math.max(1, Math.round(d.dura / 6)) }, description: `<p>${d.name}: ${d.texto}.</p>`,
      flags: { 'ecos-frontera': { verbe: { estado: id, rupturaAuto: true } } } });
    a.effects = (a.effects ?? []).filter(e => e._id !== eid).concat([{ _id: eid, onSave: false }]);
    if (t.dmg) t.dmg = String(t.dmg).replace(/^(\d+)d/, (m0, k) => `${reducir(antes[0] || Number(k))}d`);
    const cuando = a.type === 'save' ? 'si falla la salvación' : a.type === 'attack' ? 'si impacta' : 'al recibir el daño';
    // El texto dice los dados nuevos (los de antes se reemplazan una vez) y cómo ablanda.
    const ajustar = txt => {
      let x = String(txt ?? '').split(MARCA)[0];
      a.damage.parts.forEach((p, i) => { if (antes[i] && antes[i] !== p.number) x = x.replace(new RegExp(`\\b${antes[i]}d${p.denomination}\\b`), `${p.number}d${p.denomination}`); });
      return x + `${MARCA}${cuando}, ${d.texto}.`;
    };
    t.texto = ajustar(t.texto);
    if (t.textoJ) t.textoJ = ajustar(t.textoJ);
    t.item.system.description.value = fichaLecturaHTML(t);
    t.rupturaAuto = { tipo: id, antes, factor: FACTOR };
    n += 1;
  }
  D.rebalance = { version: 1, tecnicas: n, factor: FACTOR };
  return n;
}
if (import.meta.url === `file://${process.argv[1]}`) {
  const D = readCatalog();
  const n = rebalancear(D);
  const errores = validateCatalog(D); if (errores.length) throw Error(errores.join('\n'));
  writeCatalog(D);
  console.log(`Re-nivelado táctico: ${n} técnicas con −30 % de dados y su ruptura.`);
}
