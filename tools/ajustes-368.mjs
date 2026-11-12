/**
 * 3.68 · Estilos de rama (lista del autor, 12-nov-2026: «cada rama excelente en un estilo de combate y en utilidad»;
 * «más dotes que se ramifiquen con requisitos»). Idempotente; va al final de catalog:expand.
 * Cada rama (salvo Sangre, que da su linaje) gana un árbol corto de dotes entrenadas:
 *   Estilo (Entrenado) → Estilo mayor (Experto, nivel 5, pide el Estilo)   ·   Oficio (Entrenado), la rama fuera de combate.
 * Todo copia algo que ya existe en D&D (dotes, estilos de combate y rasgos de clase): se dice cuál en `dnd`.
 */
import { readCatalog, writeCatalog, validateCatalog } from './catalog.mjs';
const D = readCatalog();
const CAT = { id: 'estilos', nombre: 'Estilos de rama', texto: 'en qué pelea y en qué sirve cada rama: un estilo de combate en dos pasos y un oficio para fuera de la pelea' };
if (!D.categoriasDote.some(c => c.id === CAT.id)) D.categoriasDote.splice(D.categoriasDote.findIndex(c => c.id === 'sendas'), 0, CAT);
const MESA = 'Beneficio de mesa: lo aplicas al usar tus técnicas de la rama; el DM lo confirma.';
const competencia = (sk, nombre) => ({ ae: [[`system.skills.${sk}.value`, 4, '1']], auto: `Automática: competencia en ${nombre} en tu hoja (si ya la tenías, no cambia).` });
/** [rama, nombre de la rama, [estilo], [estilo mayor], [oficio]]; cada uno: [id, nombre, texto, dnd, extra]. */
const ARBOL = [
  ['forma', 'Forma',
    ['estilo-forma', 'Forma certera', 'Tus técnicas de Forma con tirada de ataque ignoran la cobertura media y la de tres cuartos, y atacar a largo alcance con ellas no te da desventaja.', 'Francotirador de conjuros'],
    ['estilo-forma-2', 'Forma que estalla', 'Una vez por turno, cuando una técnica de Forma hace daño, sumas tu modificador de Verbe a una de sus tiradas de daño.', 'Evocación potenciada'],
    ['oficio-forma', 'Elemento en la mano', 'Con una acción y sin gastar Verbe, mueves tu elemento a pequeña escala: enciendes o apagas una llama, mueves un cubo de agua o de tierra suelta, levantas una brisa o haces saltar una chispa. Nada de esto hace daño.', 'Trucos de moldear elementos']],
  ['velo', 'Velo',
    ['estilo-velo', 'La duda que queda', 'Una vez por turno, cuando una criatura falla una salvación contra tu técnica de Velo, resta 1d4 a su próxima salvación antes del final de tu siguiente turno.', 'Astilla mental'],
    ['estilo-velo-2', 'Velo que no suelta', 'Cuando una criatura supera la salvación repetida de un Velo tuyo, puedes usar tu reacción para que la repita (una vez por Velo).', 'Encantamiento dividido / hechizo persistente'],
    ['oficio-velo', 'Rostro prestado', 'Con una acción y 1 Verbe, cambias tu aspecto (ropa, cara, voz, altura hasta 30 cm) durante 1 hora. Investigación contra tu CD lo descubre.', 'Disfrazarse']],
  ['cuerpo', 'Cuerpo',
    ['estilo-cuerpo', 'Golpe y paso', 'Después de golpear a una criatura con una técnica de Cuerpo, puedes moverte hasta 3 m sin provocar su ataque de oportunidad en ese turno.', 'Móvil'],
    ['estilo-cuerpo-2', 'Golpe salvaje', 'Una vez por turno, cuando una técnica de Cuerpo hace daño, tiras sus dados de daño dos veces y te quedas con el resultado mayor.', 'Atacante salvaje'],
    ['oficio-cuerpo', 'Cuerpo de atleta', 'Competencia en Atletismo. Levantarte cuesta solo 1,5 m de movimiento, trepar no te cuesta movimiento de más y saltas con carrera tras moverte solo 1,5 m.', 'Atleta', competencia('ath', 'Atletismo')]],
  ['mirada', 'Mirada',
    ['estilo-mirada', 'Leer el golpe', 'Con tu Mirada abierta, cuando una criatura que ves te ataca, puedes usar tu reacción para imponerle desventaja en ese ataque.', 'Destello protector'],
    ['estilo-mirada-2', 'Ojo que anticipa', 'Con tu Mirada abierta no puedes quedar Sorprendido y sumas tu competencia a la iniciativa.', 'Alerta'],
    ['oficio-mirada', 'Ver lo oculto', 'Con tu Mirada abierta, ventaja en Investigación y en Perspicacia para descubrir Velos, disfraces y mentiras.', 'Ver la invisibilidad (en pequeño)']],
  ['sello', 'Sello',
    ['estilo-sello', 'Barrera atenta', 'Tus barreras, planos y muros de Sello tienen el doble de PG y +2 a su CA.', 'Guardia arcana'],
    ['estilo-sello-2', 'Sello que corta', 'Cuando una criatura falla una salvación contra tu técnica de Sello, no puede usar reacciones hasta el inicio de su siguiente turno.', 'Golpe aturdidor (en pequeño)'],
    ['oficio-sello', 'Inscriptor', 'Tus sellos de utilidad (Guardar, Marca menor, Sello de cierre, Sello que avisa, Bodega) puedes hacerlos como ritual: tardas 10 minutos más y no gastas Verbe.', 'Lanzamiento ritual']],
  ['pacto', 'Pacto',
    ['estilo-pacto', 'Codo a codo', 'Tienes ventaja en tus ataques contra una criatura si una criatura de tu Pacto que no esté Incapacitada está a 1,5 m de ella.', 'Tácticas de manada'],
    ['estilo-pacto-2', 'Llamada firme', 'Las criaturas que llamas con tu Pacto tienen tantos PG máximos de más como el doble de tu nivel.', 'Invocador poderoso'],
    ['oficio-pacto', 'Mensajero del pacto', 'Con 1 minuto y 1 Verbe, llamas a una criatura Diminuta de tu Pacto que lleva un mensaje de hasta 25 palabras a un lugar que conoces, a 40 km por día.', 'Mensajero animal']],
  ['pulso', 'Pulso',
    ['estilo-pulso', 'Manos que cierran', 'Cuando curas con una técnica de Pulso, el objetivo recupera además 2 + el grado de la técnica.', 'Discípulo de la vida'],
    ['estilo-pulso-2', 'Pulso que hiere', 'Una vez por turno, cuando una técnica de Pulso hace daño, sumas tu modificador de Verbe a esa tirada.', 'Lanzamiento potente'],
    ['oficio-pulso', 'Sanador', 'Competencia en Medicina. Con una acción y un uso de un kit de sanador, una criatura gasta uno de sus Dados de Golpe y recupera lo que saque más tu competencia (una vez por criatura y Descanso Corto).', 'Sanador', competencia('med', 'Medicina')]],
  ['hilo', 'Hilo',
    ['estilo-hilo', 'Mano de lanzador', 'Sacas un arma arrojadiza como parte del ataque, y tus ataques con armas arrojadizas (y las técnicas de Hilo que las usan) hacen +2 al daño.', 'Estilo de armas arrojadizas'],
    ['estilo-hilo-2', 'Puntería del hilo', 'Tus armas arrojadizas y técnicas de Hilo ignoran la cobertura media y la de tres cuartos, y atacar a largo alcance no te da desventaja.', 'Tirador experto'],
    ['oficio-hilo', 'Mecánico de marionetas', 'Competencia con herramientas de manitas. Reparar o mejorar una marioneta te cuesta la mitad de tiempo y de oro, y tus trampas de hilo suben 2 su CD.', 'Competencia con herramientas']],
  ['quietud', 'Quietud',
    ['estilo-quietud', 'Centinela del mundo', 'Cuando impactas con un ataque de oportunidad, la velocidad de la criatura baja a 0 el resto del turno. Destrabarse no evita tus ataques de oportunidad.', 'Centinela'],
    ['estilo-quietud-2', 'Contragolpe', 'Cuando una criatura a 1,5 m te ataca cuerpo a cuerpo y falla, puedes usar tu reacción para hacerle un ataque cuerpo a cuerpo.', 'Réplica'],
    ['oficio-quietud', 'Lengua de lo salvaje', 'Competencia en Naturaleza. Con 1 Verbe, durante 10 minutos entiendes a las bestias y a las plantas y te hacen entender lo que saben de su alrededor.', 'Hablar con los animales', competencia('nat', 'Naturaleza')]],
  ['rastro', 'Rastro',
    ['estilo-rastro', 'Presa marcada', 'Con una acción adicional y 1 Verbe, marcas a una criatura que ves durante 1 hora (Concentración): una vez por turno, tus ataques contra ella hacen +1d6 de daño, y tienes ventaja en Percepción y Supervivencia para encontrarla.', 'Marca del cazador'],
    ['estilo-rastro-2', 'El punto débil', 'Contra una criatura que marcaste con Presa marcada, tus ataques son críticos con 19 o 20.', 'Crítico mejorado'],
    ['oficio-rastro', 'Rastreador', 'Competencia en Supervivencia. Rastreas a paso normal y sabes cuántas criaturas pasaron, de qué tamaño y hace cuánto.', 'Explorador nato', competencia('sur', 'Supervivencia')]],
  ['umbral', 'Umbral',
    ['estilo-umbral', 'Paso que golpea', 'Después de moverte con una técnica de Umbral, tu siguiente ataque antes del final del turno tiene ventaja.', 'Paso brumoso (Hada)'],
    ['estilo-umbral-2', 'Cambio de lugar', 'Cuando un ataque va a impactar a un aliado que ves a 9 m o menos, puedes usar tu reacción y 2 Verbe para cambiarte de lugar con él: el ataque te apunta a ti.', 'Protección / Intercambio'],
    ['oficio-umbral', 'Viajero de umbrales', 'Viajando por caminos que ya marcaste, tu grupo avanza el doble. Una vez por día, con 1 minuto y 3 Verbe, abres un paso a una marca tuya a 1,5 km o menos que cruzáis hasta seis.', 'Paso dimensional (ritual)']],
  ['vasija', 'Vasija',
    ['estilo-vasija', 'Furia de la bestia', 'Mientras estás transformado, tus ataques cuerpo a cuerpo hacen +2 al daño y tienes ventaja en las pruebas y salvaciones de Fuerza.', 'Furia'],
    ['estilo-vasija-2', 'Aguante de la bestia', 'Una vez por Descanso Largo, cuando caes a 0 PG estando transformado y no mueres, quedas a 1 PG.', 'Aguante implacable'],
    ['oficio-vasija', 'Sentidos de la bestia', 'Ventaja en Percepción con el olfato y el oído, y ves en la oscuridad a 18 m como si hubiera poca luz.', 'Visión en la oscuridad / Olfato agudo']]
];
let nuevas = 0;
const poner = d => { const i = D.dotes.findIndex(x => x.id === d.id); if (i < 0) { D.dotes.push(d); nuevas++; } else D.dotes[i] = { ...D.dotes[i], ...d }; };
for (const [rama, nombre, est, may, ofi] of ARBOL) {
  const base = { cat: CAT.id, mejora: [], tipo: 'entrenada', ramaEstilo: rama };
  const [i1, n1, t1, d1, x1] = est, [i2, n2, t2, d2, x2] = may, [i3, n3, t3, d3, x3] = ofi;
  poner({ ...base, id: i1, nombre: n1, texto: `${t1} Estilo de combate de ${nombre}.`, trazos: 2, req: `rama ${nombre}, Entrenado`, dnd: d1,
    requisitos: { nivel: 1, ramas: { [rama]: 1 }, dotes: [], tecnicas: [], dm: false }, automatizacion: `${x1?.auto ?? MESA} Equivale a «${d1}» de D&D.`, ...(x1?.ae ? { efecto: { ae: x1.ae } } : {}) });
  poner({ ...base, id: i2, nombre: n2, texto: `${t2} Segundo paso del estilo de ${nombre}.`, trazos: 3, req: `${n1}; nivel 5; rama ${nombre}, Experto`, dnd: d2,
    requisitos: { nivel: 5, ramas: { [rama]: 2 }, dotes: [i1], tecnicas: [], dm: false }, automatizacion: `${x2?.auto ?? MESA} Equivale a «${d2}» de D&D.`, ...(x2?.ae ? { efecto: { ae: x2.ae } } : {}) });
  poner({ ...base, id: i3, nombre: n3, texto: `${t3} Oficio de ${nombre} (fuera de combate).`, trazos: 2, req: `rama ${nombre}, Entrenado`, dnd: d3,
    requisitos: { nivel: 1, ramas: { [rama]: 1 }, dotes: [], tecnicas: [], dm: false }, automatizacion: `${x3?.auto ?? MESA} Equivale a «${d3}» de D&D.`, ...(x3?.ae ? { efecto: { ae: x3.ae } } : {}) });
}
D.ajustes368 = { dotes: ARBOL.length * 3, ramas: ARBOL.map(a => a[0]) };
const errores = validateCatalog(D); if (errores.length) throw Error(errores.join('\n'));
writeCatalog(D);
console.log(`3.68: ${ARBOL.length * 3} dotes de estilo (${nuevas} nuevas ahora) en ${ARBOL.length} ramas.`);
