/**
 * 3.28 · Técnicas y dotes de ruptura (pedido del autor): ablandan en vez de pegar más. Cada técnica deja Brecha
 * (−2 CA), Grieta (−2 salvaciones) o Quebrado (sin defensa ni resistencias un turno); su daño baja por el presupuesto
 * (cada estado cuesta dados). Las dotes potencian la ruptura y las sinergias, una por rama y dos generales.
 * Creación original de la campaña.
 */
const BR = { estados: ['ecosBrecha'], cambios: [['system.attributes.ac.bonus', 2, '-2']], duracion: 60 };
const FI = { estados: ['ecosGrieta'], cambios: [['system.bonuses.abilities.save', 2, '-2']], duracion: 60 };
const QU = { estados: ['ecosQuebrado'], cambios: [], duracion: 6 };
const fin = { [BR.estados[0]]: 'Brecha: −2 a la CA durante 1 minuto; hasta 3 se acumulan.', [FI.estados[0]]: 'Grieta: −2 a todas sus salvaciones durante 1 minuto; hasta 3 se acumulan.', [QU.estados[0]]: 'Quebrado: hasta el final de su próximo turno no cuenta su Coraza ni su Fortaleza y el daño ignora sus resistencias.' };
// El daño es poco a propósito: lo que pesa es la ruptura (grado 1: 1d8 o 1d6; grado 2: 2d6; grado 3: 3d6; con área, menos).
const dadosDe = s => s.area ? (s.g >= 2 ? [2, 4] : [1, 6]) : s.g === 1 ? [1, s.tipo === 'attack' ? 8 : 6] : s.g === 2 ? [2, 6] : [3, 6];
const T = (s, r) => ({ ...s, ...r, dados: dadosDe(s), fin: fin[r.estados.at(-1)], limite: 'Ablanda: pega poco a propósito. Lo de D&D es el golpe; esto abre el camino.' });

export const tecnicasRuptura = [
  T({ id: 'forma-agua-lluvia-ablanda', nombre: 'Lluvia que ablanda', rama: 'forma', nat: 'agua', g: 1, tipo: 'save', salv: 'con', alcance: 18, area: 3, formaArea: 'esfera', dano: 'cold', texto: 'Una lluvia pesada y helada cae sobre un círculo de 3 m: empapa, pesa y mete el frío en los huesos. Quien falla queda con Grieta. Mojado, el rayo lo atraviesa entero.' }, FI),
  T({ id: 'forma-fuego-descascara', nombre: 'Fuego que descascara', rama: 'forma', nat: 'fuego', g: 2, tipo: 'attack', alcance: 9, dano: 'fire', texto: 'Una llama lenta y estrecha que no busca quemar: busca las juntas de la coraza y las ablanda. Si impacta, Brecha.' }, BR),
  T({ id: 'forma-tierra-golpe-cantero', nombre: 'Golpe de cantero', rama: 'forma', nat: 'tierra', g: 1, tipo: 'attack', alcance: 1.5, dano: 'bludgeoning', texto: 'La mano se cubre de piedra justo al tocar y golpea como un cincel donde la coraza ya cedió. Si impacta, Brecha.' }, BR),
  T({ id: 'forma-viento-filo-correas', nombre: 'Filo para las correas', rama: 'forma', nat: 'viento', g: 1, tipo: 'attack', alcance: 9, dano: 'slashing', texto: 'Un filo de aire fino como un cabello corta correas, juntas y costuras. Si impacta, Brecha.' }, BR),
  T({ id: 'forma-rayo-espasmo', nombre: 'Espasmo', rama: 'forma', nat: 'rayo', g: 2, tipo: 'save', salv: 'con', alcance: 9, dano: 'lightning', texto: 'El rayo entra por los nervios y el cuerpo deja de obedecer del todo. Si falla, Grieta.' }, FI),
  T({ id: 'cuerpo-juntura', nombre: 'Puño en la juntura', rama: 'cuerpo', g: 1, tipo: 'attack', alcance: 1.5, dano: 'bludgeoning', texto: 'Un golpe corto al codo, a la rodilla o a la unión de dos placas. Si impacta, Brecha.' }, BR),
  T({ id: 'cuerpo-rodilla-aliento', nombre: 'Rodilla al aliento', rama: 'cuerpo', g: 2, tipo: 'save', salv: 'con', alcance: 1.5, dano: 'bludgeoning', texto: 'La rodilla entra bajo las costillas y le saca el aire. Si falla, Grieta: sin aire, nada resiste igual.' }, FI),
  T({ id: 'hilo-correas', nombre: 'Hilos en las correas', rama: 'hilo', g: 1, tipo: 'save', salv: 'dex', alcance: 9, dano: 'slashing', texto: 'Hilos tensos se cuelan entre las placas y tiran. Si falla, Brecha.' }, BR),
  T({ id: 'hilo-red-cortes', nombre: 'Red de cortes finos', rama: 'hilo', g: 2, tipo: 'save', salv: 'dex', alcance: 9, area: 3, formaArea: 'esfera', dano: 'slashing', texto: 'Una red de filos finos se cierra sobre un círculo de 3 m. Quien falla queda con Brecha.' }, BR),
  T({ id: 'sello-marca-grieta', nombre: 'Marca de la grieta', rama: 'sello', g: 1, tipo: 'save', salv: 'wis', alcance: 18, dano: 'force', texto: 'Trazas un sello pequeño sobre una criatura que ves: marca dónde cede. Si falla, Grieta.' }, FI),
  T({ id: 'sello-destempla', nombre: 'Sello que destempla', rama: 'sello', g: 3, tipo: 'save', salv: 'con', alcance: 18, dano: 'force', texto: 'Un sello que deshace por un instante lo que mantiene dura a una criatura: su coraza, su voluntad o su piel. Si falla, queda Quebrado.' }, QU),
  T({ id: 'velo-duda', nombre: 'Susurro de duda', rama: 'velo', g: 1, tipo: 'save', salv: 'wis', alcance: 18, dano: 'psychic', texto: 'Una voz que solo oye ella le dice que va a perder. Si falla, Grieta.' }, FI),
  T({ id: 'velo-espejo-miedo', nombre: 'Espejo del miedo', rama: 'velo', g: 2, tipo: 'save', salv: 'wis', alcance: 18, dano: 'psychic', texto: 'Le muestras, por un instante, cómo muere. Si falla, queda Asustada de ti y con Grieta.' }, { ...FI, estados: ['frightened', 'ecosGrieta'] }),
  T({ id: 'pulso-contrario', nombre: 'Pulso contrario', rama: 'pulso', g: 1, tipo: 'attack', alcance: 1.5, dano: 'necrotic', texto: 'Tocas y empujas su pulso a destiempo: el cuerpo se desacompasa. Si impacta, Grieta.' }, FI),
  T({ id: 'pulso-latido-roto', nombre: 'Latido roto', rama: 'pulso', g: 3, tipo: 'save', salv: 'con', alcance: 1.5, dano: 'necrotic', texto: 'Le cortas el latido un instante. Lo que lo sostenía se afloja todo junto. Si falla, queda Quebrado.' }, QU),
  T({ id: 'umbral-flanco', nombre: 'Paso al flanco', rama: 'umbral', g: 1, tipo: 'attack', alcance: 1.5, dano: 'force', texto: 'Abres un umbral corto, apareces en su flanco y golpeas donde no se cubre. Si impacta, Brecha.' }, BR),
  T({ id: 'umbral-puerta-guardia', nombre: 'Puerta en la guardia', rama: 'umbral', g: 2, tipo: 'save', salv: 'dex', alcance: 18, dano: 'force', texto: 'Abres una puerta del tamaño de una mano justo en su guardia. Si falla, Brecha.' }, BR),
  T({ id: 'rastro-pulso-blanco', nombre: 'Leer el pulso del blanco', rama: 'rastro', g: 1, tipo: 'save', salv: 'wis', alcance: 18, dano: 'psychic', texto: 'Sigues su Verbe hasta donde flaquea y se lo haces sentir. Si falla, Grieta.' }, FI),
  T({ id: 'rastro-tiro-juntura', nombre: 'Tiro a la juntura', rama: 'rastro', g: 2, tipo: 'attack', alcance: 36, dano: 'piercing', texto: 'Lees por dónde respira la coraza y le mandas ahí un dardo de Verbe. Si impacta, Brecha.' }, BR),
  T({ id: 'pacto-mordida-manada', nombre: 'Mordida de la manada', rama: 'pacto', g: 1, tipo: 'attack', alcance: 1.5, dano: 'piercing', texto: 'Tu aliado del pacto muerde donde tú señalas: la pata, la correa, la juntura. Si impacta, Brecha.' }, BR),
  T({ id: 'pacto-aullido', nombre: 'Aullido que quiebra', rama: 'pacto', g: 2, tipo: 'save', salv: 'wis', alcance: 9, area: 3, formaArea: 'esfera', dano: 'thunder', texto: 'Tu pacto aúlla contigo y el sonido sacude a todo lo que hay en un círculo de 3 m. Quien falla queda con Grieta.' }, FI),
  T({ id: 'quietud-toque-vacio', nombre: 'Toque en el vacío', rama: 'quietud', g: 1, tipo: 'attack', alcance: 1.5, dano: 'force', texto: 'Un toque quieto que encuentra el hueco entre una respiración y la otra. Si impacta, Grieta.' }, FI),
  T({ id: 'quietud-respiracion-ajena', nombre: 'Respiración ajena', rama: 'quietud', g: 3, tipo: 'save', salv: 'con', alcance: 1.5, dano: 'force', texto: 'Le robas el ritmo de la respiración: por un momento, su cuerpo no sabe defenderse. Si falla, queda Quebrado.' }, QU),
  T({ id: 'sangre-corroe', nombre: 'Sangre que corroe', rama: 'sangre', g: 2, tipo: 'save', salv: 'con', alcance: 9, dano: 'acid', req: 'una herencia', texto: 'Tu sangre, despierta, se vuelve agria al tocar el aire y le come la coraza. Si falla, Brecha.' }, BR)
];

const R = (rama, rango = 1) => ({ nivel: 1, ramas: { [rama]: rango }, dotes: [], tecnicas: [], dm: false });
const AUTO = 'Automática: el módulo la aplica al poner el estado, al tirar o al aplicar el daño.';
export const dotesRuptura = [
  { id: 'muerde-elemento', nombre: 'Elemento que muerde', rama: 'forma', texto: 'Los estados de tu naturaleza ablandan: Ardiendo, Helado, Embarrado o Desequilibrado que pones dejan además una Brecha; Empapado o Cargado, una Grieta.', requisitos: R('forma') },
  { id: 'golpe-al-quiebre', nombre: 'Golpe al quiebre', rama: 'cuerpo', texto: 'Tus ataques cuerpo a cuerpo contra una criatura con Brecha hacen 1d6 de daño contundente extra (2d6 desde nivel 11). D&D pega más donde el Verbe abrió.', requisitos: R('cuerpo') },
  { id: 'filo-que-abre', nombre: 'Filo que abre', rama: 'hilo', texto: 'Las Brechas que pones restan 3 a la CA en vez de 2.', requisitos: R('hilo') },
  { id: 'sello-de-la-grieta', nombre: 'Sello de la grieta', rama: 'sello', texto: 'Las Grietas que pones restan 3 a las salvaciones en vez de 2.', requisitos: R('sello') },
  { id: 'miedo-que-agrieta', nombre: 'Miedo que agrieta', rama: 'velo', texto: 'Una criatura Asustada o Hechizada que recibe daño tuyo queda además con Grieta.', requisitos: R('velo') },
  { id: 'latido-que-rompe', nombre: 'Latido que rompe', rama: 'pulso', texto: 'El Quebrado que pones dura un turno más (hasta el final de su segundo turno).', requisitos: R('pulso', 2) },
  { id: 'paso-por-la-herida', nombre: 'Paso por la herida', rama: 'umbral', texto: 'Tus ataques contra una criatura con 2 o más Brechas tienen ventaja.', requisitos: R('umbral') },
  { id: 'ver-la-grieta', nombre: 'Ver la grieta', rama: 'mirada', texto: 'Con un ojo abierto, tus ataques no cuentan la Coraza del blanco: ves dónde no la tiene.', requisitos: R('mirada') },
  { id: 'huella-abierta', nombre: 'Huella abierta', rama: 'rastro', texto: 'Las Brechas y Grietas que pones duran 10 minutos: todo el combate y lo que sigue.', requisitos: R('rastro') },
  { id: 'mordida-que-rompe', nombre: 'Mordida que rompe', rama: 'pacto', texto: 'Cuando dejas a una criatura Derribada o Agarrada (con una acción, una técnica o tu pacto), queda además con una Brecha.', requisitos: R('pacto') },
  { id: 'golpe-en-el-vacio', nombre: 'Golpe en el vacío', rama: 'quietud', texto: 'Tus ataques contra una criatura Quebrada hacen 1d8 de daño de fuerza extra (2d8 desde nivel 11).', requisitos: R('quietud') },
  { id: 'sangre-que-hiende', nombre: 'Sangre que hiende', rama: 'sangre', texto: 'Cuando una sinergia tuya deja Quebrado a una criatura (rayo sobre mojado, un golpe sobre el hielo…), queda además con una Brecha y una Grieta.', requisitos: R('sangre') },
  { id: 'peso-del-huesped', nombre: 'Peso del huésped', rama: 'vasija', texto: 'Tus técnicas pesadas, al hacer daño, dejan además dos Brechas.', requisitos: R('vasija') },
  { id: 'cadena-de-ruptura', nombre: 'Cadena de ruptura', rama: null, texto: 'Cuando pones la tercera Brecha o la tercera Grieta a una criatura, queda además Quebrada.', requisitos: { nivel: 7, ramas: {}, dotes: [], tecnicas: [], dm: false }, req: 'nivel 7' },
  { id: 'rompeguardias', nombre: 'Rompeguardias', rama: null, texto: 'Una vez por turno puedes usar «Romper la guardia» o «Buscar la grieta» como acción adicional.', requisitos: { nivel: 3, ramas: {}, dotes: [], tecnicas: [], dm: false }, req: 'nivel 3', manual: true }
].map(d => ({ id: d.id, nombre: d.nombre, texto: d.texto, trazos: d.rama ? 2 : 3, req: d.req ?? `rama ${d.rama[0].toUpperCase()}${d.rama.slice(1)}${d.requisitos.ramas[d.rama] > 1 ? ' (Experto)' : ''}`, cat: 'ruptura', mejora: [],
  requisitos: d.requisitos, automatizacion: d.manual ? 'Beneficio de mesa: el DM confirma la acción adicional.' : AUTO }));
