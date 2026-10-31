import fs from 'node:fs';
import { readCatalog } from './catalog.mjs';
const D = readCatalog();
const esc = s => String(s ?? '—').replaceAll('|', '\\|').replaceAll('\n', ' ');
const version=JSON.parse(fs.readFileSync(new URL('../package.json',import.meta.url),'utf8')).version;
const lines = [`# Cobertura declarada del catálogo ${version}`, '',
  'Generado con `npm run docs:catalog`. Inventario estático completo: no certifica que el texto de cada poder esté automatizado.', '',
  'Una actividad proporciona tiradas o una tarjeta; un efecto declarado aporta solo sus cambios y estados. La geometría, los objetivos válidos, las repeticiones de salvación, las decisiones narrativas y las reglas especiales requieren revisión en mesa salvo automatización explícita.', '',
  `El catálogo reúne **${D.tecnicas.length} técnicas y ${D.dotes.length} dotes**.`, '',
  '| Rama | Técnicas | Solo utilidad, sin efectos |', '|---|---:|---:|'];
const utility = t => !t.item.effects?.length && Object.values(t.item.system.activities).every(a => a.type === 'utility');
for (const r of D.ramas) {
  const ts = D.tecnicas.filter(t => t.rama === r.id);
  lines.push(`| ${r.nombre} | ${ts.length} | ${ts.filter(utility).length} |`);
}
lines.push('', '## Técnicas', '', '| ID | Nombre | Grado | Rama | Actividades nativas | Efectos declarados |', '|---|---|---:|---|---|---:|');
for (const t of D.tecnicas) lines.push(`| \`${t.id}\` | ${esc(t.n)} | ${t.g} | ${t.rama} | ${[...new Set(Object.values(t.item.system.activities).map(a => a.type))].join(', ')} | ${t.item.effects?.length ?? 0} |`);
lines.push('', '## Dotes', '',
  'Campos mecánicos registrados: se consumen por distintos adaptadores del módulo. Su presencia no implica que todos los beneficios del texto se resuelvan automáticamente. «Texto/mesa» significa que no tiene un objeto `efecto` declarado.', '',
  '| ID | Nombre | Trazos | Requisitos | Campos de efecto |', '|---|---|---:|---|---|');
for (const d of D.dotes) lines.push(`| \`${d.id}\` | ${esc(d.nombre ?? d.n)} | ${d.trazos} | ${esc(d.req)} | ${esc(Object.keys(d.efecto ?? {}).join(', ') || 'Texto/mesa')} |`);
lines.push('', '## Automatización y alcance actual', '',
  '- Reserva, deuda, reacciones, grados, compras y aprobaciones: adaptador del Verbe y reglas puras.',
  '- Cuerpo templado: CA y movimiento condicionados a la armadura.',
  '- Desequilibrado, Embarrado, Cargado y Helado: adaptadores de tiradas y estados. Metal requiere material declarado o marcador explícito y un único objetivo.',
  '- Agua/tierra apagan Ardiendo al aplicar sus estados; vencimiento temporal al inicio del turno.',
  '- Palma que cierra: tratamiento diario confirmado por el DM. Restaurar, Aliento para muchos, Rehacer y Mano que cierra todo: enlace con heridas. Mano que sostiene: estabilización.',
  '- Repertorio shinobi: 353 incorporaciones con origen y página; tradiciones, herencias, ojos, modos, bestias y rituales con comprobaciones de acceso y consumo.',
  '- Clones físicos: reserva dividida y acción conjunta; Sello del centenar: depósito real; familias de usos, desgaste ocular y permisos rituales persistentes. Los modos propios aplican sus efectos y la regeneración marcada usa curación nativa por turno.',
  '- Invocaciones y títeres: perfiles y órdenes en mesa; no se crean actores ni tokens. Ilusiones, resurrección, cirugía, trasplantes, sacrificios, posiciones y beneficios condicionales conservan resolución del DM según su ficha.',
  '- Defensas con midi-qol: integración existente, pendiente de comprobar en Foundry con la versión instalada; críticos, áreas y posición de Sustitución requieren especial atención.', '');
fs.writeFileSync(new URL('../docs/COBERTURA_CATALOGO.md', import.meta.url), lines.join('\n'));
console.log(`Inventario generado: ${D.tecnicas.length} técnicas, ${D.dotes.length} dotes.`);
