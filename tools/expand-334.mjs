/**
 * 3.34 · Pedidos del autor: la dote obligatoria «Moneda al Verbe» (se da al despertar) y una técnica básica de escape
 * por rama, mejorable por grado (más distancia, la CD sube con el grado). Idempotente.
 */
import { readCatalog, writeCatalog, validateCatalog } from './catalog.mjs';
import { construirShinobi } from './build-shinobi.mjs';
import { NIVEL_GRADO, etapaGrado } from '../scripts/verbe-progression.js';
const D = readCatalog();
const DOTE = { id: 'moneda-al-verbe', nombre: 'Moneda al Verbe', trazos: 0, req: null, cat: 'innatos', innato: true, mejora: ['la dote Mano para las monedas'],
  texto: 'Puedes romper una Moneda Antigua para recargar tu Verbe (2 × tu competencia; 3 × con Mano para las monedas). Fuera de combate es un momento; en combate gasta tu acción Verbe. Tienes el botón junto a tu barra de Verbe.',
  requisitos: { nivel: 1, ramas: {}, dotes: [], tecnicas: [], dm: false }, automatizacion: 'Botón junto a la barra del Verbe en la hoja; en combate gasta la acción Verbe.' };
const i = D.dotes.findIndex(d => d.id === DOTE.id); if (i < 0) D.dotes.push(DOTE); else D.dotes[i] = DOTE;
D.innatos = [...new Set([...(D.innatos ?? []), DOTE.id])];
const ESCAPES = [
  ['forma', 'Paso de humo', 'Te deshaces en humo, hojas o agua y vuelves a tomar forma un poco más allá.'],
  ['velo', 'Velo que se cierra', 'Dejas tu imagen donde estabas y te deslizas por detrás de ella.'],
  ['cuerpo', 'Salto de liebre', 'Un impulso explosivo de las piernas: estás fuera antes de que te vean salir.'],
  ['mirada', 'Parpadeo ajeno', 'Miras a los ojos al que te sigue y lo haces parpadear justo cuando te mueves.'],
  ['sello', 'Sello de huida', 'Un sello pequeño que dejaste marcado tira de ti hacia él.'],
  ['pacto', 'Lo que te lleva', 'Lo que pactó contigo te saca de ahí de un tirón.'],
  ['pulso', 'Pulso que se apaga', 'Callas tu latido y tu calor: por un instante pareces no estar.'],
  ['hilo', 'Hilo de retirada', 'Un hilo que dejaste tendido te recoge de golpe.'],
  ['quietud', 'Quietud total', 'Te quedas tan quieto y tan callado que los ojos resbalan sobre ti; te mueves cuando nadie mira.'],
  ['rastro', 'Borrar la huella', 'Te mueves pisando donde no queda rastro y el olor se te va con el viento.'],
  ['sangre', 'La sangre que llama', 'Tu sangre reconoce un lugar seguro cerca y te arrastra hacia él.'],
  ['umbral', 'Puerta corta', 'Abres un umbral de un paso y sales por el otro lado.'],
  ['vasija', 'Lo que llevas dentro corre', 'Le sueltas un instante las riendas a lo que guardas: corre por ti.']
];
const arc = r => ['velo', 'sello', 'umbral', 'mirada', 'pacto', 'sangre'].includes(r);
for (const [rama, nombre, flavor] of ESCAPES) {
  const s = { id: `${rama}-escape`, nombre, rama, g: 1, tipo: 'utility', t: 'A', alcance: 0, escalado: 0,
    texto: `${flavor} Te mueves hasta 3 m (10 ft) a una casilla que eliges, sin gastar movimiento ni provocar ataques de oportunidad. Cada criatura hostil a 18 m hace una prueba de ${arc(rama) ? 'Inteligencia (Arcanos)' : 'Sabiduría (Percepción)'} contra la CD de tu Verbe: si falla, te pierde de vista hasta que te encuentre (acción Buscar). Por cada grado por encima de 1, 1,5 m (5 ft) más.`,
    limite: 'No es teletransporte salvo que la rama lo diga; necesitas un lugar donde estar. Quien te pierde de vista no te ataca hasta encontrarte.',
    manual: 'El módulo te deja elegir la casilla, te mueve y tira la prueba de cada enemigo cercano; el DM decide si hay dónde esconderse.' };
  const t = construirShinobi({ ...s, origen: 'Escapes de Nimerios', fuente: 'Creación original de la campaña.' }, D);
  const m = t.item.flags['ecos-frontera'].verbe;
  delete m.shinobi; m.escape = { rama, prueba: arc(rama) ? 'arc' : 'prc' }; m.nombre = nombre; t.escape = true;
  t.alias = [nombre]; t.origen = { obra: 'Nimerios', nombre: 'Escapes', referencia: 'Creación original.' };
  t.item.system.source = { custom: 'Ecos · Escapes', book: 'Nimerios' };
  t.item.system.description.value = t.item.system.description.value.replace(/Estudio Naruto y Shippuden|Repertorio shinobi/g, 'Nimerios');
  t.nivelMin = NIVEL_GRADO[1]; t.obtencion = { nivel: t.nivelMin, etapa: etapaGrado(1), rama }; m.obtencion = t.obtencion;
  const j = D.tecnicas.findIndex(x => x.id === t.id); if (j < 0) D.tecnicas.push(t); else D.tecnicas[j] = t;
}
D.tecnicas = D.tecnicas.filter(t => !t.escape || ESCAPES.some(([r]) => t.id === `${r}-escape`));
// Sombra bajo el salto: el desplazamiento ya no gasta movimiento y ofrece Golpe hondo (pedido del autor).
const sombra = D.tecnicas.find(t => t.id === 'cuerpo-sombra-danzante');
if (sombra) {
  const viejo = 'El desplazamiento usa tu movimiento, no es teletransporte', nuevo = 'El desplazamiento no gasta tu movimiento (eliges la casilla) y al caer puedes encadenar Golpe hondo; no es teletransporte';
  sombra.texto = sombra.texto.replace(viejo, nuevo);
  sombra.item.system.description.value = sombra.item.system.description.value.replace(viejo, nuevo);
}
D.reglas334 = { escapes: ESCAPES.length, dotes: 1 };
const errores = validateCatalog(D); if (errores.length) throw Error(errores.join('\n'));
writeCatalog(D);
console.log(`3.34: ${ESCAPES.length} escapes y la dote Moneda al Verbe; total ${D.tecnicas.length} técnicas y ${D.dotes.length} dotes.`);
