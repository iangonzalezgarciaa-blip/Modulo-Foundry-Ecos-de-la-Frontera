/**
 * 3.31 · Legados de las sangres: un árbol por dios (Marca, tres ramas de tres escalones por fuerza de sangre y un
 * Destino), las sangres no divinas y las familias dentro del legado de su dios, y dos dotes para enseñar el Verbe.
 * Idempotente. Ver tools/nimerios/legados.mjs.
 */
import { readCatalog, writeCatalog, validateCatalog } from './catalog.mjs';
import { LEGADOS, DOTES_MAESTRO } from './nimerios/legados.mjs';

const NIVEL = [3, 7, 13], FUERZA = ['debil', 'media', 'plena'], TRAZOS = [2, 3, 4], ESCALON = ['Débil', 'Media', 'Plena'];
export function dotesDeLegado([id, alias, familia, subs, cosechado, marca, ramas, destino]) {
  const linajes = [id, ...subs], base = { cat: `legado-${id}`, mejora: [], legado: id, automatizacion: 'Beneficio de mesa: el DM lo confirma al concederla.' };
  const out = [{ ...base, id: `legado-${id}-marca`, nombre: marca[0], texto: marca[1], trazos: 1, req: 'sangre Rastro o más de este legado; lo concede el DM',
    requisitos: { nivel: 1, ramas: {}, dotes: [], tecnicas: [], dm: true, linajes, fuerzaMin: 'rastro' }, escalon: 0 }];
  ramas.forEach(([rama, ...esc], r) => esc.forEach(([n, t], k) => out.push({ ...base, id: `legado-${id}-${r + 1}-${k + 1}`, nombre: n, texto: t, trazos: TRAZOS[k], rama,
    req: `nivel ${NIVEL[k]}; sangre ${ESCALON[k]} o más; ${k ? 'el escalón anterior de la rama' : 'la Marca del legado'}; lo concede el DM`,
    requisitos: { nivel: NIVEL[k], ramas: {}, dotes: [k ? `legado-${id}-${r + 1}-${k}` : `legado-${id}-marca`], tecnicas: [], dm: true, linajes, fuerzaMin: FUERZA[k] }, escalon: k + 1 })));
  out.push({ ...base, id: `legado-${id}-destino`, nombre: destino[0], texto: destino[1], trazos: 6, destino: true, cosechado: !!cosechado,
    req: 'nivel 17; sangre Plena; el último escalón de una rama; lo concede el DM',
    requisitos: { nivel: 17, ramas: {}, dotes: [], algunaDote: [1, 2, 3].map(r => `legado-${id}-${r}-3`), tecnicas: [], dm: true, linajes, fuerzaMin: 'plena' }, escalon: 4 });
  return out;
}
if (import.meta.url === `file://${process.argv[1]}`) {
  const D = readCatalog();
  D.dotes = D.dotes.filter(d => !d.legado && !DOTES_MAESTRO.some(x => x.id === d.id));
  D.categoriasDote = (D.categoriasDote ?? []).filter(c => !String(c.id).startsWith('legado-') && c.id !== 'ensenar');
  for (const L of LEGADOS) {
    const [id, alias, familia, subs] = L;
    const lin = D.linajes.find(l => l.id === id);
    if (!lin) throw Error(`Linaje inexistente: ${id}`);
    lin.legado = `legado-${id}`; lin.familia = familia ?? null;
    for (const s of subs) { const x = D.linajes.find(l => l.id === s); if (!x) throw Error(`Sublinaje inexistente: ${s}`); x.dios = id; }
    D.categoriasDote.push({ id: `legado-${id}`, nombre: alias, texto: 'el árbol que tu sangre abre: Marca, tres ramas por fuerza de sangre y un Destino', legado: id });
    D.dotes.push(...dotesDeLegado(L));
  }
  D.categoriasDote.push({ id: 'ensenar', nombre: 'Enseñar y despertar', texto: 'para quien ya puede abrirle el Verbe a otros' });
  D.dotes.push(...DOTES_MAESTRO.map(d => ({ ...d, cat: 'ensenar', mejora: [], automatizacion: 'Beneficio de mesa: el DM decide qué despierta y cuándo.' })));
  D.legados = { version: 1, legados: LEGADOS.length, dotes: D.dotes.filter(d => d.legado).length + DOTES_MAESTRO.length };
  const errores = validateCatalog(D); if (errores.length) throw Error(errores.join('\n'));
  writeCatalog(D);
  console.log(`Legados: ${LEGADOS.length} árboles, ${D.legados.dotes} dotes; total ${D.dotes.length} dotes.`);
}
