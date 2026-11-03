/**
 * 3.5.0 · Tarea 1.2: corrige lo que marca el validador sin tocar el resto de la técnica. Idempotente (fija valores, no suma).
 * - Áreas descritas sin plantilla → plantilla desde el texto.
 * - Plantillas que apuntaban al lanzador → apuntan al área; las que salen de ti excluyen al lanzador (-self, convención de midi-qol).
 * - «Tu próximo golpe suma…» → efecto sobre ti que suma el daño a tu próximo golpe cuerpo a cuerpo (y se va al impactar).
 * - Ataques que recorren el campo con objetivo «uno mismo» → objetivo: criaturas.
 */
import fs from 'node:fs';
import { readCatalog, writeCatalog, validateCatalog } from './catalog.mjs';
import { idNativo } from './build-shinobi.mjs';
import { areaDeTexto, problemasTecnica } from '../scripts/verbe-validate.js';
const RUTA = new URL('./nimerios/correcciones-3.5.0.json', import.meta.url);
// Registro acumulado de lo corregido (las pruebas de potencia lo usan para separar arreglos intencionales de cambios accidentales).
const D = readCatalog(), cambios = fs.existsSync(RUTA) ? JSON.parse(fs.readFileSync(RUTA, 'utf8')) : {};
const anotar = (id, que) => (cambios[id] ??= []).includes(que) || cambios[id].push(que);
const NOMBRES_DANO = { fire: 'fuego', bludgeoning: 'contundente', lightning: 'relámpago', force: 'fuerza', cold: 'frío', thunder: 'trueno', acid: 'ácido', poison: 'veneno', piercing: 'perforante', slashing: 'cortante', radiant: 'radiante', necrotic: 'necrótico', psychic: 'psíquico' };
const cuantos = texto => ({ dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6 })[String(texto).match(/hasta (dos|tres|cuatro|cinco|seis)\b/i)?.[1]?.toLowerCase()] ?? 1;
for (const t of D.tecnicas) {
  const s = t.item.system, meta = t.item.flags['ecos-frontera'].verbe;
  s.target ??= {}; s.target.affects ??= {}; s.target.template ??= {};
  const aff = s.target.affects, tpl = s.target.template;
  const acts = Object.values(s.activities ?? {});
  const danoAct = acts.find(a => a.type !== 'heal' && a.damage?.parts?.length);
  const salva = acts.some(a => a.type === 'save');
  // 1 · Área sin plantilla.
  const area = !tpl.type && areaDeTexto(t);
  if (area) { Object.assign(tpl, { type: area.type, size: area.size, units: 'm', count: '', contiguous: false, width: '', height: '' }); anotar(t.id, 'plantilla desde el texto'); }
  // 2 · Plantilla que apuntaba al lanzador.
  if (tpl.type && aff.type === 'self' && (danoAct || salva) && !meta.autodano) { aff.type = ''; aff.count = ''; anotar(t.id, 'la plantilla ya no apunta al lanzador'); }
  // 3 · Área que sale de ti: no te alcanza.
  if (tpl.type && s.range?.units === 'self' && (danoAct || salva) && !meta.autodano) {
    const esp = String(aff.special ?? '').split(';').map(x => x.trim()).filter(Boolean);
    if (!esp.includes('-self')) { aff.special = [...esp, '-self'].join(';'); anotar(t.id, 'el área excluye al lanzador'); }
  }
  // 4 · «Tu próximo golpe suma el daño»: efecto sobre ti.
  if (!tpl.type && aff.type === 'self' && danoAct && /pr[oó]ximo golpe/i.test(t.texto ?? '')) {
    const p = danoAct.damage.parts[0], tipo = p.types?.[0] ?? 'force', minuto = /pr[oó]ximo minuto|en el pr[oó]ximo minuto/i.test(t.texto);
    const eid = idNativo(`${t.id}:golpe-siguiente`), sube = String(meta.sube ?? '').match(/^\+(\d+)d(\d+)$/);
    const efecto = { _id: eid, name: `${t.n} · próximo golpe`, img: t.item.img, statuses: [], transfer: false, disabled: false,
      changes: [{ key: 'system.bonuses.mwak.damage', mode: 2, value: `${p.number}d${p.denomination}[${tipo}]` }],
      duration: minuto ? { seconds: 60, rounds: 10 } : { seconds: 6, rounds: 1 },
      description: `<p>Tu próximo golpe cuerpo a cuerpo ${minuto ? 'en el próximo minuto' : 'de este turno'} suma ${p.number}d${p.denomination} de ${NOMBRES_DANO[tipo] ?? tipo}. Se va al impactar (con midi-qol y DAE); si no, quítalo tú después del golpe.</p>`,
      flags: { 'ecos-frontera': { verbe: { aplicarUsuario: true, golpeSiguiente: { n: p.number, d: p.denomination, tipo, sube: sube ? Number(sube[1]) : 0 } } }, dae: { specialDuration: ['1Hit'] } } };
    for (const k of ['damage']) delete danoAct[k];
    Object.assign(danoAct, { type: 'utility', roll: { formula: '', name: '', prompt: false, visible: false } });
    t.item.effects = [...(t.item.effects ?? []).filter(e => e._id !== eid), efecto];
    meta.golpeSiguiente = true;
    anotar(t.id, 'el daño va a tu próximo golpe, no a ti');
  } else if (!tpl.type && aff.type === 'self' && (danoAct || salva) && !meta.autodano) {
    // 5 · Recorre el campo y golpea a otros: objetivo criaturas.
    aff.type = 'creature'; aff.count = String(cuantos(t.texto)); anotar(t.id, 'objetivo: criaturas, no el lanzador');
    // Misma regla que evolve-catalog: varios blancos sin plantilla reparten los dados de más.
    if (Number(aff.count) > 1) meta.divisorDados = Math.max(Number(meta.divisorDados) || 1, Number(aff.count));
  }
}
D.correccionesPlantillas = { version: 1, tecnicas: Object.keys(cambios).length };
const errores = validateCatalog(D);
if (errores.length) throw Error(errores.join('\n'));
const restantes = D.tecnicas.flatMap(problemasTecnica).filter(p => p.nivel === 'error');
if (restantes.length) throw Error('Quedan errores del validador:\n' + restantes.map(p => `${p.id}: ${p.codigo}`).join('\n'));
writeCatalog(D);
const orden = Object.fromEntries(Object.keys(cambios).sort().map(k => [k, cambios[k]]));
fs.writeFileSync(RUTA, JSON.stringify(orden, null, 1) + '\n');
console.log(`Plantillas y objetivos corregidos: ${Object.keys(cambios).length} técnicas.`);
