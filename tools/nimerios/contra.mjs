/** Contratécnicas no elementales (tareas 3.2a–c): por rama, una reacción defensiva y una técnica para interceptar en un choque. */
const R = (ca, extra = '') => ({ t: 'R', tipo: 'buff', alcance: 0, duracion: 6, conc: false, cambios: [['system.attributes.ac.bonus', 2, `+${ca}`]], fin: `Dura hasta que se resuelve ese ataque.${extra}` });
export const contra = [
  // Cuerpo
  { id: 'cuerpo-palma-desvia', nombre: 'Palma que desvía', rama: 'cuerpo', g: 1, ...R(3), disparador: 'Cuando un ataque que ves te va a alcanzar', texto: 'Cuando un golpe o un proyectil que ves te va a alcanzar, lo apartas con la palma cargada de Verbe: +3 a la CA contra ese ataque.' },
  { id: 'cuerpo-patada-quiebre', nombre: 'Patada que quiebra', rama: 'cuerpo', g: 2, t: 'A', tipo: 'attack', alcance: 1.5, dano: 'bludgeoning', texto: 'Una patada con el Verbe concentrado en el empeine. Sirve para interceptar una técnica en un choque: sin ventaja elemental, decide tu Control más su grado.' },
  // Hilo
  { id: 'hilo-red-parada', nombre: 'Red de parada', rama: 'hilo', g: 1, ...R(2), disparador: 'Cuando un ataque que ves te va a alcanzar', texto: 'Tensas una red de hilos delante de ti en el último instante: +2 a la CA contra ese ataque.' },
  { id: 'hilo-cuchillas-suspendidas', nombre: 'Cuchillas suspendidas', rama: 'hilo', g: 3, t: 'A', tipo: 'attack', alcance: 18, dano: 'slashing', texto: 'Hojas colgadas de hilos invisibles caen sobre un objetivo que ves. Sirve para interceptar una técnica en un choque.' },
  // Velo
  { id: 'velo-reflejo-falso', nombre: 'Reflejo falso', rama: 'velo', g: 1, ...R(2), disparador: 'Cuando un ataque que ves te va a alcanzar', texto: 'Dejas una imagen de ti medio paso a un lado y el golpe duda: +2 a la CA contra ese ataque.' },
  { id: 'velo-punzada-mente', nombre: 'Punzada en la mente', rama: 'velo', g: 2, t: 'A', tipo: 'save', salv: 'wis', alcance: 18, dano: 'psychic', mitad: true, texto: 'Clavas una imagen dolorosa en la mente de una criatura que ves: salvación de Sabiduría, mitad si la supera. Sirve para interceptar una técnica en un choque.' },
  // Sello
  { id: 'sello-parada', nombre: 'Sello de parada', rama: 'sello', g: 2, ...R(4), disparador: 'Cuando un ataque o una técnica que ves te va a alcanzar', texto: 'Trazas un sello en el aire con dos dedos y el golpe choca contra él: +4 a la CA contra ese ataque.' },
  { id: 'sello-lanza', nombre: 'Lanza de sello', rama: 'sello', g: 3, t: 'A', tipo: 'attack', alcance: 18, dano: 'force', texto: 'Condensas un sello en una lanza de luz y la arrojas. Sirve para interceptar una técnica en un choque.' },
  // Rastro
  { id: 'rastro-paso-medido', nombre: 'Paso medido', rama: 'rastro', g: 1, ...R(2), disparador: 'Cuando un ataque que ves te va a alcanzar', texto: 'Lees el Verbe del golpe antes de que salga y das el paso justo: +2 a la CA contra ese ataque.' },
  { id: 'rastro-golpe-grieta', nombre: 'Golpe en la grieta', rama: 'rastro', g: 2, t: 'A', tipo: 'attack', alcance: 1.5, dano: 'force', texto: 'Golpeas donde el Verbe del otro está más fino. Sirve para interceptar una técnica en un choque.' },
  // Umbral
  { id: 'umbral-paso-corto', nombre: 'Paso de umbral', rama: 'umbral', g: 2, ...R(5), disparador: 'Cuando un ataque que ves te va a alcanzar', texto: 'Cruzas un umbral de un paso y reapareces a un lado del golpe: +5 a la CA contra ese ataque.' },
  { id: 'umbral-desgarro', nombre: 'Desgarro del umbral', rama: 'umbral', g: 4, t: 'A', tipo: 'save', salv: 'con', alcance: 18, dano: 'force', mitad: true, texto: 'Abres y cierras un umbral sobre una criatura que ves: salvación de Constitución, mitad si la supera. Sirve para interceptar una técnica en un choque.' },
  // Quietud
  { id: 'quietud-raiz-firme', nombre: 'Raíz firme', rama: 'quietud', g: 1, ...R(2), disparador: 'Cuando un ataque que ves te va a alcanzar', texto: 'Te anclas al suelo con la energía del entorno y aguantas: +2 a la CA contra ese ataque.' },
  { id: 'quietud-peso-entorno', nombre: 'Peso del entorno', rama: 'quietud', g: 3, t: 'A', tipo: 'save', salv: 'str', alcance: 18, dano: 'bludgeoning', mitad: true, texto: 'Haces caer sobre una criatura el peso del lugar: salvación de Fuerza, mitad si la supera. Sirve para interceptar una técnica en un choque.' },
  // Vasija
  { id: 'vasija-piel-huesped', nombre: 'Piel del huésped', rama: 'vasija', g: 2, ...R(3), disparador: 'Cuando un ataque que ves te va a alcanzar', texto: 'Tu huésped endurece tu piel un instante: +3 a la CA contra ese ataque.' },
  { id: 'vasija-zarpazo', nombre: 'Zarpazo del huésped', rama: 'vasija', g: 3, t: 'A', tipo: 'attack', alcance: 1.5, dano: 'slashing', texto: 'Tu huésped asoma por tu brazo y desgarra. Sirve para interceptar una técnica en un choque.' },
  // Pacto
  { id: 'pacto-guardian', nombre: 'Guardián del pacto', rama: 'pacto', g: 1, ...R(2), disparador: 'Cuando un ataque que ves te va a alcanzar', texto: 'Tu aliado del pacto se cruza un instante delante de ti: +2 a la CA contra ese ataque.' },
  { id: 'pacto-embestida', nombre: 'Embestida del aliado', rama: 'pacto', g: 3, t: 'A', tipo: 'attack', alcance: 9, dano: 'bludgeoning', texto: 'Tu aliado del pacto embiste a una criatura que ves. Sirve para interceptar una técnica en un choque.' }
];
