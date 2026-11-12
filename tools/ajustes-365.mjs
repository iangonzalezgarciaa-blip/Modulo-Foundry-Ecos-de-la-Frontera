/**
 * 3.65 · Ajustes del catálogo pedidos por el autor (12-nov-2026). Idempotente; va al final de catalog:expand.
 *  - El Control del Verbe se tira con Inteligencia; dos dotes nuevas lo cambian: «Control por instinto» (Sabiduría,
 *    un don) y «Control por presencia» (Carisma, entrenada). No se pueden tener las dos.
 *  - El árbol de Control se ramifica con requisitos: Práctica de Control es la raíz; Control fino pide Práctica y nivel 3.
 */
import { readCatalog, writeCatalog, validateCatalog } from './catalog.mjs';
const D = readCatalog();
const NUEVAS = [
  { id: 'control-instinto', nombre: 'Control por instinto', texto: 'Sientes el Verbe antes de pensarlo: tu Control del Verbe se tira con Sabiduría en vez de Inteligencia. No se suma con Control por presencia.',
    trazos: 2, req: null, cat: 'control', mejora: [], tipo: 'don', requisitos: { nivel: 1, ramas: {}, dotes: [], tecnicas: [], dm: false },
    automatizacion: 'Automática: cambia la característica de la habilidad Control del Verbe en tu hoja.' },
  { id: 'control-presencia', nombre: 'Control por presencia', texto: 'Tu Verbe obedece a tu voluntad y a tu voz: tu Control del Verbe se tira con Carisma en vez de Inteligencia. No se suma con Control por instinto.',
    trazos: 2, req: 'Práctica de Control', cat: 'control', mejora: [], tipo: 'entrenada', requisitos: { nivel: 1, ramas: {}, dotes: ['practica-control'], tecnicas: [], dm: false },
    automatizacion: 'Automática: cambia la característica de la habilidad Control del Verbe en tu hoja.' }
];
for (const n of NUEVAS) { const i = D.dotes.findIndex(d => d.id === n.id); if (i < 0) D.dotes.push(n); else D.dotes[i] = { ...D.dotes[i], ...n }; }
/** El árbol de Control: [id, req (texto), nivel, dotes previas]. */
const ARBOL = [
  ['control-sereno', 'Práctica de Control', 1, ['practica-control']],
  ['control-fino', 'Práctica de Control; nivel 3', 3, ['practica-control']],
  ['calma-combate', 'Práctica de Control', 1, ['practica-control']],
  ['leer-flujo', 'Práctica de Control', 1, ['practica-control']],
  ['choque-perfecto', 'Leer el flujo; nivel 3', 3, ['leer-flujo']],
  ['romper-flujo', 'Choque perfecto; nivel 5', 5, ['choque-perfecto']],
  ['contencion', 'Control sereno; nivel 5', 5, ['control-sereno']],
  ['foco-principal', 'Control fino del Verbe; nivel 5', 5, ['control-fino']],
  ['punteria-verbe', 'Control fino del Verbe; nivel 5', 5, ['control-fino']],
  ['control-a-ciegas', 'Sentir el Verbe; Leer el flujo; nivel 7', 7, ['sentir-verbe', 'leer-flujo']]
];
for (const [id, req, nivel, dotes] of ARBOL) {
  const d = D.dotes.find(x => x.id === id); if (!d) continue;
  d.req = req; d.requisitos = { ...(d.requisitos ?? {}), nivel, dotes: [...dotes], ramas: d.requisitos?.ramas ?? {}, tecnicas: d.requisitos?.tecnicas ?? [], dm: !!d.requisitos?.dm };
}
// El Control ya no es de Sabiduría: se corrige la explicación que llevan las dotes que lo nombran.
const VIEJO = '(El Control del Verbe es una habilidad de tu hoja: se tira con Sabiduría para aprender técnicas, chocar, sostener una carga o un Velo.)';
const NUEVO = '(El Control del Verbe es una habilidad de tu hoja: se tira con Inteligencia —Sabiduría con Control por instinto, Carisma con Control por presencia— para aprender técnicas, chocar, sostener una carga o un Velo.)';
for (const d of D.dotes) {
  if (d.texto?.includes(VIEJO)) d.texto = d.texto.replace(VIEJO, NUEVO);
  else if (/\bControl\b/.test(d.texto ?? '') && !d.texto.includes('El Control del Verbe es')) d.texto += ` ${NUEVO}`;
}
D.ajustes365 = { dotes: NUEVAS.length, arbolControl: ARBOL.length };
const errores = validateCatalog(D); if (errores.length) throw Error(errores.join('\n'));
writeCatalog(D);
console.log(`3.65: ${NUEVAS.length} dotes de Control y ${ARBOL.length} requisitos del árbol.`);
