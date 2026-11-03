/** Formas no elementales (4.3): para quien todavía no tiene naturaleza, o no la quiere. Grados 0 a 5. */
const B = (ca, dur = 60) => ({ tipo: 'buff', t: 'AA', alcance: 0, duracion: dur, cambios: [['system.attributes.ac.bonus', 2, `+${ca}`]] });
export const formaPura = [
  { id: 'forma-pura-chispa', nombre: 'Chispa de Verbe', g: 0, tipo: 'attack', alcance: 18, dano: 'force', texto: 'Disparas un punto de Verbe condensado contra una criatura que ves.' },
  { id: 'forma-pura-empujon', nombre: 'Empujón de Verbe', g: 0, tipo: 'save', salv: 'str', alcance: 3, dano: 'force', texto: 'Una onda corta de Verbe empuja a una criatura cercana: salvación de Fuerza.' },
  { id: 'forma-pura-guardia', nombre: 'Guardia de Verbe', g: 0, ...B(1, 6), texto: 'Cubres tu cuerpo con una capa fina de Verbe hasta tu próximo turno: +1 a la CA.' },
  { id: 'forma-pura-dardo', nombre: 'Dardo de Verbe', g: 1, tipo: 'attack', alcance: 36, dano: 'force', texto: 'Un dardo de Verbe puro, rápido y largo.' },
  { id: 'forma-pura-filo', nombre: 'Filo de Verbe', g: 1, tipo: 'attack', alcance: 1.5, dano: 'force', texto: 'Das forma de hoja a tu Verbe y cortas a una criatura a tu lado.' },
  { id: 'forma-pura-escudo', nombre: 'Escudo de Verbe', g: 1, ...B(2), texto: 'Un escudo de Verbe flota delante de ti durante un minuto: +2 a la CA.' },
  { id: 'forma-pura-impulso', nombre: 'Impulso', g: 1, tipo: 'buff', t: 'AA', alcance: 0, duracion: 6, cambios: [['system.attributes.movement.walk', 2, '+6']], texto: 'Sueltas Verbe bajo los pies y sales disparado: +6 m de velocidad este turno.' },
  { id: 'forma-pura-red', nombre: 'Red de Verbe', g: 1, tipo: 'save', salv: 'dex', alcance: 9, dano: 'force', estados: ['restrained'], texto: 'Lanzas una red de Verbe sobre una criatura: salvación de Destreza o queda Apresada.' },
  { id: 'forma-pura-lluvia', nombre: 'Lluvia de agujas', g: 2, tipo: 'save', salv: 'dex', alcance: 18, area: 3, formaArea: 'cubo', dano: 'piercing', mitad: true, texto: 'Llueven agujas de Verbe en un cubo de 3 m: salvación de Destreza, mitad si la supera.' },
  { id: 'forma-pura-lanza', nombre: 'Lanza de Verbe', g: 2, tipo: 'attack', alcance: 36, dano: 'force', texto: 'Una lanza de Verbe sólido que atraviesa la armadura ligera.' },
  { id: 'forma-pura-martillo', nombre: 'Martillo de Verbe', g: 2, tipo: 'attack', alcance: 1.5, dano: 'bludgeoning', estados: ['prone'], texto: 'Un martillo de Verbe que, si impacta, puede tirar al suelo a quien golpea.' },
  { id: 'forma-pura-muro', nombre: 'Muro de Verbe', g: 2, tipo: 'utility', t: 'A', alcance: 18, duracion: 60, conc: true, texto: 'Levantas un muro translúcido de Verbe de 6 m de largo y 3 m de alto que bloquea el paso y los proyectiles. Tiene CA 12 y 10 PG por cada 1,5 m.' },
  { id: 'forma-pura-orbes', nombre: 'Orbes guía', g: 3, tipo: 'attack', alcance: 36, dano: 'force', blancos: 3, texto: 'Tres orbes de Verbe buscan hasta tres objetivos que ves, uno cada uno.' },
  { id: 'forma-pura-estallido', nombre: 'Estallido de Verbe', g: 3, tipo: 'save', salv: 'con', alcance: 0, area: 4.5, formaArea: 'esfera', dano: 'force', mitad: true, texto: 'El Verbe estalla desde ti en una esfera de 4,5 m que no te alcanza: salvación de Constitución, mitad si la supera.' },
  { id: 'forma-pura-coraza', nombre: 'Coraza de Verbe', g: 3, ...B(3), texto: 'Una coraza de Verbe te cubre un minuto: +3 a la CA.' },
  { id: 'forma-pura-salto', nombre: 'Salto de Verbe', g: 3, tipo: 'utility', t: 'AA', alcance: 9, duracion: 0, texto: 'Te impulsas con el Verbe hasta un punto que ves a 9 m o menos; no provocas ataques de oportunidad.' },
  { id: 'forma-pura-cadena', nombre: 'Cadena de Verbe', g: 4, tipo: 'save', salv: 'str', alcance: 18, dano: 'force', estados: ['restrained'], texto: 'Una cadena de Verbe atrapa a una criatura: salvación de Fuerza o queda Apresada y recibe el daño.' },
  { id: 'forma-pura-ariete', nombre: 'Ariete de Verbe', g: 4, tipo: 'save', salv: 'str', alcance: 0, area: 9, formaArea: 'línea', dano: 'force', mitad: true, estados: ['prone'], texto: 'Una columna de Verbe sale de ti en línea de 9 m: salvación de Fuerza o cae Derribado.' },
  { id: 'forma-pura-baluarte', nombre: 'Baluarte', g: 5, tipo: 'buff', t: 'A', alcance: 0, duracion: 60, conc: true, cambios: [['system.attributes.ac.bonus', 2, '+4'], ['system.traits.dr.value', 2, 'force']], texto: 'Te rodeas de un baluarte de Verbe un minuto (Concentración): +4 a la CA y resistencia al daño de fuerza.' },
  { id: 'forma-pura-cometa', nombre: 'Cometa de Verbe', g: 5, tipo: 'save', salv: 'dex', alcance: 36, area: 6, formaArea: 'esfera', dano: 'force', mitad: true, texto: 'Condensas un cometa de Verbe y lo dejas caer en una esfera de 6 m: salvación de Destreza, mitad si la supera.' }
];
