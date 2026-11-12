/**
 * 3.32 · Qué significa cada estado, para quien no sabe nada de D&D (pedido del autor): al pasar el ratón por un estado
 * (en el panel de estados de la derecha y en el HUD del token) sale qué le pasa a esa criatura y qué puede hacer la mesa
 * para aprovecharlo o quitárselo. Puro: solo textos; el Agotamiento dice su castigo según su nivel.
 */
export const ESTADOS_EXPLICADOS = {
  prone: { n: "Derribado", que: "Está en el suelo. Sus ataques tienen desventaja. Los ataques cuerpo a cuerpo contra él (a 5 ft) tienen ventaja; los de lejos, desventaja.",
    hacer: "Pegarle de cerca. Para levantarse gasta la mitad de su movimiento; si no se levanta, solo puede arrastrarse." },
  grappled: { n: "Agarrado", que: "Su velocidad es 0: no puede moverse por su cuenta. Tiene desventaja al atacar a cualquiera que no sea quien lo agarra. Quien lo agarra puede arrastrarlo.",
    hacer: "Para soltarse: su acción, prueba de Atletismo o Acrobacias contra la CD de quien lo agarra." },
  restrained: { n: "Apresado", que: "Velocidad 0. Desventaja en sus ataques y en salvaciones de Destreza. Los ataques contra él tienen ventaja.",
    hacer: "Atacarlo ahora: todo le pega más fácil." },
  stunned: { n: "Aturdido", que: "No puede actuar ni reaccionar, no se mueve y apenas habla. Falla las salvaciones de Fuerza y Destreza. Los ataques contra él tienen ventaja.",
    hacer: "Es el mejor momento para golpear fuerte." },
  paralyzed: { n: "Paralizado", que: "No puede moverse ni actuar. Falla Fuerza y Destreza. Los ataques contra él tienen ventaja y, de cerca (5 ft), cada golpe es crítico.",
    hacer: "Pegarle cuerpo a cuerpo: cada impacto es crítico." },
  unconscious: { n: "Inconsciente", que: "No sabe lo que pasa: cae al suelo, suelta lo que tenga, no actúa ni se mueve. Falla Fuerza y Destreza. Los ataques tienen ventaja y de cerca son críticos.",
    hacer: "Si es un aliado: curarlo o estabilizarlo. Si es un enemigo: rematarlo o atarlo." },
  incapacitated: { n: "Incapacitado", que: "No puede hacer acciones, acciones adicionales ni reacciones.", hacer: "No responde a nada este turno: aprovecha para moverte cerca sin miedo a su reacción." },
  frightened: { n: "Asustado", que: "Tiene desventaja en sus ataques y pruebas mientras vea lo que lo asusta, y no puede acercarse a eso por su cuenta.",
    hacer: "Quédate entre él y lo que teme: no se te acercará." },
  charmed: { n: "Hechizado", que: "No puede atacar a quien lo hechizó ni hacerle daño. Quien lo hechizó tiene ventaja para convencerlo.", hacer: "Si es un aliado, no le pidas que ataque a quien lo hechizó." },
  blinded: { n: "Cegado", que: "No ve: falla lo que pide ver, sus ataques tienen desventaja y los ataques contra él, ventaja.", hacer: "Atacarlo: no te ve venir." },
  deafened: { n: "Ensordecido", que: "No oye: falla lo que pide oír y no escucha órdenes ni avisos.", hacer: "No sirve gritarle: hay que hacerle señas." },
  poisoned: { n: "Envenenado", que: "Desventaja en sus ataques y en sus pruebas de característica.", hacer: "Pelea peor: buen momento para presionarlo." },
  petrified: { n: "Petrificado", que: "Convertido en piedra: no se mueve, no actúa, no envejece. Resiste todo el daño y falla Fuerza y Destreza.", hacer: "Hace falta magia para devolverlo." },
  invisible: { n: "Invisible", que: "No se le ve sin magia o sentidos especiales. Sus ataques tienen ventaja y los ataques contra él, desventaja (si sabes dónde está).",
    hacer: "Harina, pintura, agua o un área: lo que lo marque. O adivinar la casilla." },
  exhaustion: { n: "Agotamiento", que: "", hacer: "Se quita 1 nivel por Descanso Largo en un Santuario (no si tiene una Herida No Tratada). A 6 niveles, muere." },
  bloodied: { n: "Ensangrentado", que: "Tiene la mitad de sus PG o menos. Por sí solo no da castigo, pero se nota: sangra, jadea, tambalea. Algunas técnicas, dotes y criaturas hacen más cosas contra quien está Ensangrentado (o se vuelven más peligrosas cuando lo están).",
    hacer: "Si es un enemigo, está a mitad de camino: concentrar los golpes. Si es un aliado, pensar en retirarlo o curarlo." },
  dead: { n: "Muerto", que: "Murió. Solo una magia muy grande lo devuelve.", hacer: "" },
  concentrating: { n: "Concentrándose", que: "Mantiene un conjuro o técnica de concentración. Si recibe daño, salva Constitución (CD 10 o la mitad del daño, lo que sea más) o lo pierde.",
    hacer: "Pegarle a quien se concentra corta su efecto." },
  dodging: { n: "Esquivando", que: "Usó la acción Esquivar: hasta su próximo turno los ataques contra él tienen desventaja (si los ve) y tiene ventaja en salvaciones de Destreza.", hacer: "Mejor atacar a otro o usar algo que no sea un ataque." },
  hiding: { n: "Escondido", que: "No saben dónde está. Su primer ataque tiene ventaja y se revela al atacar o hacer ruido.", hacer: "Buscar (Percepción) para encontrarlo." },
  surprised: { n: "Sorprendido", que: "No lo vio venir: tira la iniciativa con desventaja, no puede reaccionar (ni D&D, ni Verbe, ni choques, ni ataques de oportunidad) y los ataques contra él tienen ventaja, hasta el final de su primer turno.", hacer: "Se va solo al terminar su primer turno." },
  bleeding: { n: "Sangrando", que: "Pierde PG al empezar su turno hasta que alguien lo trate (Medicina) o lo curen.", hacer: "Medicina CD 10 o cualquier curación lo detiene." },
  burning: { n: "Ardiendo", que: "Está en llamas: recibe daño de fuego al empezar su turno hasta que lo apague (una acción) o lo apaguen.", hacer: "Agua o revolcarse en el suelo." },
  flying: { n: "Volando", que: "Está en el aire. Si queda Derribado o su velocidad baja a 0, cae.", hacer: "Derribarlo lo hace caer (daño de caída)." },
  silenced: { n: "Silenciado", que: "No puede hablar ni hacer sonidos: no lanza conjuros ni técnicas con voz.", hacer: "" },
  sleeping: { n: "Dormido", que: "Duerme: inconsciente hasta que lo despierten (un golpe, o una acción de otro para sacudirlo).", hacer: "" },
  stable: { n: "Estable", que: "Está a 0 PG pero ya no se muere: no tira salvaciones de muerte. Despierta solo con el tiempo o curándolo.", hacer: "Curarlo lo pone de pie." },
  marked: { n: "Marcado", que: "Alguien lo marcó con un conjuro o una técnica: suele recibir daño extra de esa persona.", hacer: "" },
  cursed: { n: "Maldito", que: "Lleva una maldición: lee la tarjeta o la ficha para ver qué le hace.", hacer: "Quitar maldición o lo que diga la historia." },
  diseased: { n: "Enfermo", que: "Lleva una enfermedad: su efecto depende de cuál sea.", hacer: "Medicina, reposo o magia." },
  encumbered: { n: "Cargado", que: "Lleva demasiado peso: se mueve más lento.", hacer: "Soltar algo." },
  transformed: { n: "Transformado", que: "Tiene otra forma: usa las estadísticas de esa forma.", hacer: "" }
};
/** El castigo del Agotamiento en la campaña (−1 por nivel a d20 y −5 ft por nivel; a 6, muerte). */
export function textoAgotamiento(nivel, { porD20 = 1, porPies = 5, max = 6 } = {}) {
  const n = Math.max(0, Number(nivel) || 0);
  if (!n) return "Sin Agotamiento.";
  return `Nivel ${n} de ${max}: −${n * porD20} a todas sus tiradas d20 (ataques, salvaciones y pruebas) y −${n * porPies} ft de velocidad.${n >= max - 1 ? " Un nivel más y muere." : ""}`;
}
/** Explicación completa de un estado por su id. Null si no lo conoce. */
export function explicarEstado(id, { agotamiento = 0 } = {}) {
  const e = ESTADOS_EXPLICADOS[id];
  if (!e) return null;
  const que = id === "exhaustion" ? textoAgotamiento(agotamiento) : e.que;
  return `${e.n}: ${que}${e.hacer ? ` · Qué hacer: ${e.hacer}` : ""}`;
}
/** Para un efecto: la explicación de sus estados conocidos, o null para dejar la suya. */
export function explicarEfecto(statuses = [], ctx = {}) {
  const t = [...statuses].map(s => explicarEstado(s, ctx)).filter(Boolean);
  return t.length ? t.join(" · ") : null;
}
