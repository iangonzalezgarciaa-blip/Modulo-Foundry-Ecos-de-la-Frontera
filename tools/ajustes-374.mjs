/**
 * 3.74 · Lectura clara (pedido del autor, 13-nov-2026: «dotes con texto claro y Aspecto propio por técnica»).
 * Idempotente; va al final de catalog:expand.
 *  1. Cada técnica rehace su ficha de lectura con el Aspecto nuevo (forma en la escena, lo que hace a la vista y su
 *     nombre), así cada una tiene el suyo.
 *  2. Las dotes con una nota de automatización vaga («Beneficio de mesa: el DM lo confirma…», «Requisitos y beneficio
 *     registrados…») dicen ahora cómo se usa de verdad: automática (el módulo la aplica: tiene efecto o el código la
 *     mira), uso activo (tiene botón) o en la mesa (el DM la aplica cuando se cumple).
 */
import { readFileSync, readdirSync } from 'node:fs';
import { readCatalog, writeCatalog, validateCatalog } from './catalog.mjs';
import { fichaLecturaHTML } from '../scripts/verbe-reading.js';

const D = readCatalog();

/* ---------- 1. Fichas de técnica con su Aspecto ---------- */
const CIERRE = '</details></div>';
let fichas = 0;
for (const t of D.tecnicas) {
  const html = String(t.item?.system?.description?.value ?? '');
  if (!html.startsWith('<div class="ev-lectura">')) continue;
  const i = html.indexOf(CIERRE); if (i < 0) continue;
  const nuevo = fichaLecturaHTML(t) + html.slice(i + CIERRE.length);
  if (nuevo !== html) { t.item.system.description.value = nuevo; fichas++; }
}

/* ---------- 2. Dotes: cómo se usa ---------- */
const VAGAS = [
  'Beneficio de mesa: el DM lo confirma al concederla.',
  'Beneficio de mesa salvo integración específica indicada en el panel.',
  'Requisitos y beneficio registrados en el módulo.',
  'Beneficios registrados; confirma en mesa las condiciones descritas.',
  'Actividad nativa, coste, uso diario y efecto registrados. La recuperación consume el presupuesto breve cuando lo indica.'
];
export const COMO = {
  auto: 'Automática: el módulo la aplica sola en tu hoja, en tus tiradas o al usar tus técnicas; no tienes que hacer nada.',
  poder: 'Uso activo: tiene su botón en el panel del Verbe y en los rasgos de tu hoja; lo gastas cuando se cumpla lo que dice y vuelve con un Descanso Largo.',
  mesa: 'En la mesa: el módulo no lo puede ver solo. Cuando se cumpla lo que dice, avísale al DM y él lo aplica.'
};
const codigo = readdirSync('scripts').filter(f => f.endsWith('.js')).map(f => readFileSync(`scripts/${f}`, 'utf8')).join('\n');
const enCodigo = id => codigo.includes(`"${id}"`) || codigo.includes(`'${id}'`);
const base = a => String(a ?? '').replace(/\s*Equivale a «[^»]*» de D&D\.\s*$/, '').trim();
let dotes = 0;
for (const d of D.dotes) {
  const actual = base(d.automatizacion);
  if (d.automatizacion && !VAGAS.includes(actual) && !Object.values(COMO).includes(actual)) continue;
  const tipo = d.poder ? 'poder' : (d.efecto && Object.keys(d.efecto).length) || enCodigo(d.id) ? 'auto' : 'mesa';
  const nueva = `${COMO[tipo]}${d.dnd ? ` Equivale a «${d.dnd}» de D&D.` : ''}`;
  if (d.automatizacion !== nueva) { d.automatizacion = nueva; dotes++; }
}

const cuenta = Object.fromEntries(Object.entries(COMO).map(([k, v]) => [k, D.dotes.filter(d => base(d.automatizacion) === v).length]));
D.ajustes374 = { aspectos: D.tecnicas.filter(t => !t.retirada).length, dotes: cuenta };
const errores = validateCatalog(D); if (errores.length) throw Error(errores.join('\n'));
writeCatalog(D);
console.log(`3.74: ${fichas} fichas con su Aspecto rehechas; ${dotes} notas de dote reescritas ahora (${JSON.stringify(cuenta)}).`);
