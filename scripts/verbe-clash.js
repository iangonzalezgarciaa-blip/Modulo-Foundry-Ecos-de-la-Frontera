/** Una técnica enfrentada necesita una manifestación ofensiva, no basta marcar un token. */
export function tecnicaChocable(item, actividad = null) {
  const m=item?.getFlag?.('ecos-frontera','verbe') ?? item?.flags?.['ecos-frontera']?.verbe;
  // 3.7: cualquier rama ofensiva choca (Cuerpo, Velo, Umbral, Hilo, mentales…), no solo Forma o elementales.
  if(!m?.id || m.ritual || m.dividirVerbe) return false;
  if(!['action','bonus'].includes(item.system?.activation?.type))return false;
  if(item.effects?.some(e=>(e.getFlag?.('ecos-frontera','verbe')??e.flags?.['ecos-frontera']?.verbe)?.aplicarUsuario))return false;
  const acts=actividad?[actividad]:item.system?.activities?.values?[...item.system.activities.values()]:Object.values(item.system?.activities??{});
  return acts.some(a=>['attack','save','damage'].includes(a.type) && a.damage?.parts?.some(p=>!Array.from(p.types??[]).includes('healing')));
}
export const AYUDA_CHOQUE = 'Marca como objetivo el token de otra hoja con el Verbe despierto y usa una técnica ofensiva de cualquier rama. Basta una marca en una dirección; no hace falta que ambos se marquen. Primero se ofrecen Sustitución y las defensas de reacción disponibles. Si el ataque sigue, se abre automáticamente la ventana de choque al defensor, aunque ya haya gastado su reacción. Elige una técnica ofensiva aprendida y su grado: paga su Verbe y conserva los límites de nivel, sangre, hitos y usos diarios. El choque no gasta reacción ni tu acción normal y no concede otro ataque: intercepta ese lanzamiento contra ti. El elemento favorable suma 2 grados; vence la potencia mayor y, si empatan, se tira Control contra Control. En empate se anulan ambas. Si gana tu contratécnica, te protege de ese lanzamiento; si gana la atacante, resuelve su ataque o salvación normal. En un área cada defensor protege solo a sí mismo. Puedes recibir la técnica sin enfrentarla; sin una técnica válida no se inventa un contraataque. Las defensas mantienen sus requisitos y costes. Con midi-qol se retiran los objetivos protegidos antes del daño; sin midi se detiene la continuación automática si todos están protegidos y la tarjeta informa los objetivos restantes para la resolución nativa.';
export const PASOS_CHOQUE=[
 ['Se dirige una técnica contra ti','Otro personaje con el Verbe despierto marca tu token y usa una técnica ofensiva de cualquier rama. Basta una marca en una dirección; no hace falta que ambos se marquen.'],
 ['Primero puedes defenderte','Se ofrecen Sustitución y las defensas disponibles. Conservan su coste, su reacción y sus condiciones. Si la defensa evita el ataque, ya no necesitas un choque contra él.'],
 ['Después eliges si enfrentas la técnica','Si la amenaza sigue, aparece la ventana de choque, aunque ya haya gastado su reacción el defensor. Elige una técnica ofensiva que conozcas y el grado permitido. Puedes elegir «Recibir la técnica». Sin una técnica válida no se inventa un contraataque.'],
 ['Se paga y se compara la potencia','Tu contratécnica paga Verbe y sus usos limitados. El choque no gasta tu reacción ni tu acción normal. Si una naturaleza vence a la otra, la favorable suma 2 grados de potencia y gana el grado mayor (si empatan, Control del Verbe). Sin ventaja elemental (una patada contra un rayo, dos técnicas sin elemento), deciden los dados: cada uno tira Control del Verbe y suma el grado de su técnica. El DM puede haber elegido la regla clásica del ciclo elemental.'],
 ['Se resuelve ese lanzamiento','Si gana tu contratécnica, te protege de ese lanzamiento. Si empatan también en Control, ambas se anulan contra ti. Si gana la atacante, sigue su ataque o salvación normal. En un área proteges solo a tu personaje. Ganar el choque no te da otro ataque.']
];
/**
 * 3.7 (tarea 3.1c): una reacción del catálogo sirve de defensa si su disparador es recibir un ataque, un golpe,
 * daño o una técnica contra ti. La lista de defensas se arma con esta etiqueta, no con una lista fija.
 */
const DISPARA_DEFENSA = /(ataque|impact|golpe|te alcanc|alcance|recibes daño|recibir un golpe|descarga|contra ti|te va a)/i;
export function reaccionDefensiva(t) {
  const sys = t?.item?.system;
  if (!sys || sys.activation?.type !== 'reaction') return false;
  const m = t.item.flags?.['ecos-frontera']?.verbe ?? {};
  if (m.ritual) return false;
  return DISPARA_DEFENSA.test(`${sys.activation?.condition ?? ''} ${t.texto ?? ''}`.slice(0, 400));
}
