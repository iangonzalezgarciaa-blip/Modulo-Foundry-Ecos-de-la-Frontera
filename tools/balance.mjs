/** Escenarios deterministas con los adaptadores reales y documentos simulados. */
import fs from 'node:fs';
import { MockActor, resetEnvironment } from '../tests/helpers/foundry.mjs';
import { readCatalog } from './catalog.mjs';
import * as V from '../scripts/verbe.js';
resetEnvironment();
const D = readCatalog(); V.usarDatos(D, 'activo');
const technique = D.tecnicas.find(t => t.id === 'fuego-aliento');
const lines = ['# Escenarios de sensibilidad 2.8', '',
  'Se generan con `npm run balance` usando los cálculos del módulo y documentos de prueba. Son cálculos estáticos; no son partidas simuladas ni daño efectivo por asalto.', '',
  'Supuestos: característica de Verbe +3; rama principal Forma; naturaleza Fuego; sin dotes, cultivo, herencia, infusión ni equipo. Repartido conserva Entrenado y afinidad inicial. Especialista adquiere el rango más alto permitido por nivel y afinidad Entrenada desde 5/Maestra desde 11. La comparación no representa igualdad de Trazos invertidos.', '',
  `Técnica examinada: **${technique.n}**, grado ${technique.g}. La media incluye solamente sus dados, sin impacto, críticos, salvación, resistencias, daño de estados ni acciones adicionales de clase.`, '',
  '| Nivel | Perfil | Reserva | Rango | Afinidad | Grado máximo de rama | Dados a grado base | Media de dados | Coste base | Usos sin deuda | Usos con clima favorable | Recupera Santuario/intemperie |',
  '|---:|---|---:|---|---:|---:|---|---:|---:|---:|---:|---|'];
for (const level of [1, 3, 5, 11, 17, 20]) for (const specialist of [false, true]) {
  const rank = specialist ? D.rangos.findLastIndex(r => r.nivel <= level) : 1;
  const affinity = specialist ? (level >= 11 ? 3 : level >= 5 ? 2 : 1) : 1;
  const a = new MockActor(level, { principal: 'forma', rangos: { forma: rank }, afinidad: { fuego: affinity } });
  a.system.abilities.wis.mod = 3;
  const data = V.datosItem(a, technique), act = Object.values(data.system.activities)[0];
  const p = act.damage.parts[0], pool = V.maxVerbe(a), cost = V.costoUso(a, data.flags['ecos-frontera'].verbe, technique.g);
  lines.push(`| ${level} | ${specialist ? 'Especialista' : 'Repartido'} | ${pool} | ${D.rangos[rank].nombre} | ${affinity} | ${V.gradoUsable(a, data.flags['ecos-frontera'].verbe)} | ${p.number}d${p.denomination} | ${(p.number * (p.denomination + 1) / 2).toFixed(1)} | ${cost} | ${Math.floor(pool / cost)} | ${Math.floor(pool / Math.max(1, cost - 1))} | ${Math.floor(pool / 2)}/${Math.floor(pool / 4)} |`);
}
lines.push('', '## Lectura para el diseño', '',
  '- El clima reduce el coste de grado 1 de 2 a 1: duplica su cantidad de usos con una reserva positiva. Se conserva la regla escrita, pero su efecto relativo debe medirse en los primeros encuentros.',
  '- Los bonos de rango y afinidad mantienen competitiva una técnica baja. Su potencia por Verbe crece sin elevar el grado. Esa es una decisión de progresión conservada; no demuestra equivalencia con una clase de D&D sin Verbe.',
  '- Elevar a grado 6 o más ya no permite repetir libremente una técnica baja: cada técnica consume su oportunidad de uso alto por Descanso Largo. Distintas técnicas conservan oportunidades distintas.',
  '- Reducir costes con cultivo/dotes aumenta de nuevo la eficiencia de técnicas bajas; el mínimo general es 1, con excepciones explícitas como la reserva preparada. La deuda y sus salvaciones no se cuentan como usos seguros.',
  '- Antes de ampliar clones, invocaciones o control: registrar turnos adicionales, reacciones negadas, concentraciones, salvaciones repetidas y recursos de la clase además del Verbe. No valorar un poder solo por sus dados.', '',
  '## Prueba de mesa necesaria para cerrar el balance', '',
  'En niveles 1, 3, 5, 11, 17 y 20, comparar marcial y lanzador, uno y varios enemigos, tres encuentros antes de descansar, Santuario e intemperie. Registrar daño/curación reales, turnos de control, reacciones, Verbe neto y minutos de arbitraje. Cambiar una variable por tanda y conservar el historial de personajes. El informe identifica sensibilidades; no certifica balance perfecto del catálogo.', '');
fs.writeFileSync(new URL('../docs/ESCENARIOS_BALANCE.md', import.meta.url), lines.join('\n'));
console.log('Escenarios de balance generados con reglas reales y documentos simulados.');
