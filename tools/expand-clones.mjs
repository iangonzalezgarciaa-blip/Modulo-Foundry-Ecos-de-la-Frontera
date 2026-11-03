/** Clones del Verbe (3.5): técnica de clones de sombra (rara), clones masivos y la cadena de dotes que los abarata. Idempotente. */
import { readCatalog, writeCatalog, validateCatalog } from './catalog.mjs';
import { construirShinobi } from './build-shinobi.mjs';
import { NIVEL_GRADO, etapaGrado } from '../scripts/verbe-progression.js';
const D = readCatalog();
const tecnicas = [
  { id: 'forma-clon-sombra', nombre: 'Clon de sombra', g: 5, rara: true, texto: 'Partes tu Verbe y lo haces cuerpo: aparece una copia tuya de 1 PG, de Verbe puro, que piensa como tú y puede usar tus técnicas con el Verbe que le das. Si la destruyen, ese Verbe se pierde; si la disipas, te vuelve lo que le quede y recuerdas lo que vivió. Es una técnica rara: pocos la aprenden.' },
  { id: 'forma-clones-masivos', nombre: 'Legión de sombras', g: 8, rara: true, previa: 'forma-clon-sombra', texto: 'Igual que Clon de sombra, pero partes tu Verbe en muchas copias a la vez (hasta cinco; muchas más con la dote Legión). Cada una tiene 1 PG y el Verbe que le das. Al disiparse todas, sus recuerdos llegan juntos y pesan.' }
];
for (const s of tecnicas) {
  const t = construirShinobi({ ...s, rama: 'forma', t: 'A', tipo: 'utility', alcance: 0, duracion: 600, conc: false, gestos: true,
    origen: 'Clones del Verbe', fuente: 'Creación original de la campaña.',
    limite: 'Al usarla eliges cuántas copias y cuánto Verbe le das a cada una (lo que le das sale de tu reserva). Cada copia es una ficha con 1 PG. No da experiencia: solo recuerdos.',
    manual: 'Al usarla se abre una ventana para elegir copias y Verbe; el DM crea las fichas y los tokens junto a ti.' }, D);
  const m = t.item.flags['ecos-frontera'].verbe;
  delete m.shinobi; m.clon = { tipo: 'sombra' }; t.clonNuevo = true;
  t.alias = [s.nombre]; t.origen = { obra: 'Nimerios', nombre: 'Clones del Verbe', referencia: 'Creación original.' };
  t.item.system.source = { custom: 'Ecos · Clones del Verbe', book: 'Nimerios' };
  t.nivelMin = NIVEL_GRADO[s.g]; t.obtencion = { nivel: t.nivelMin, etapa: etapaGrado(s.g), rama: 'forma' }; m.obtencion = t.obtencion;
  const i = D.tecnicas.findIndex(x => x.id === t.id);
  if (i < 0) D.tecnicas.push(t); else D.tecnicas[i] = t;
}
const dotes = [
  { id: 'clon-economico', nombre: 'Clones económicos', trazos: 3, cat: 'tecnicas', req: 'Clon de sombra o una técnica de clones', requisitos: { nivel: 5, ramas: { forma: 2 }, dotes: [], tecnicas: [], dm: false },
    texto: 'Tus técnicas de clones cuestan 1 Verbe menos y cada clon se conforma con 1 de Verbe (en vez de 2).' },
  { id: 'clon-multiple', nombre: 'Clones múltiples', trazos: 4, cat: 'tecnicas', req: 'Clones económicos', requisitos: { nivel: 9, ramas: { forma: 3 }, dotes: ['clon-economico'], tecnicas: [], dm: false },
    texto: 'Creas una copia más de las que permite tu técnica de clones.' },
  { id: 'clon-legion', nombre: 'Legión', trazos: 6, cat: 'culminacion', req: 'Clones múltiples y Clon de sombra', requisitos: { nivel: 13, ramas: { forma: 4 }, dotes: ['clon-multiple'], tecnicas: ['forma-clon-sombra'], dm: false },
    texto: 'Con los clones de sombra puedes crear tantas copias como cuatro veces tu bonificador de competencia, cada una con al menos 1 de Verbe. Sus recuerdos llegan todos juntos al disiparse.' }
];
for (const d of dotes) {
  const n = { ...d, mejora: [], automatizacion: 'Se aplica al crear clones desde el panel del Verbe.', clonDote: true };
  const i = D.dotes.findIndex(x => x.id === n.id);
  if (i < 0) D.dotes.push(n); else D.dotes[i] = n;
}
D.clones = { version: 1, tecnicas: D.tecnicas.filter(x => x.clonNuevo).length, dotes: D.dotes.filter(x => x.clonDote).length };
const errores = validateCatalog(D); if (errores.length) throw Error(errores.join('\n'));
writeCatalog(D);
console.log(`Clones del Verbe: ${D.clones.tecnicas} técnicas y ${D.clones.dotes} dotes; total ${D.tecnicas.length} técnicas, ${D.dotes.length} dotes.`);
