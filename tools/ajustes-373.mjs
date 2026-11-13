/**
 * 3.73 · Estilos de combate automáticos (respuestas del autor, 13-nov-2026: las reacciones de los estilos gastan la
 * Reacción Verbe; los números se aplican solos y las reacciones con aviso). Idempotente; va al final de catalog:expand.
 * Reescribe la nota «Automatización» de las 24 dotes de estilo con lo que hace ahora scripts/estilos-auto.js.
 */
import { readCatalog, writeCatalog, validateCatalog } from './catalog.mjs';
const D = readCatalog();
const AUTO = {
  'estilo-forma': 'Recordatorio en el chat al atacar con Forma: Foundry no calcula la cobertura ni el alcance largo, así que los ajusta el DM.',
  'estilo-forma-2': 'Automática: una vez por turno, el daño de tu técnica de Forma suma tu modificador de Verbe y el chat lo dice (el «Deshacer» de la resolución lo devuelve).',
  'estilo-velo': 'Automática: si falla la salvación, el objetivo recibe «La duda que queda» (−1d4 a su próxima salvación; se va sola al tirarla), con «Deshacer».',
  'estilo-velo-2': 'Reacción Verbe: pídesela al DM cuando el objetivo supere la salvación repetida.',
  'estilo-cuerpo': 'Recordatorio en el chat al atacar con Cuerpo.',
  'estilo-cuerpo-2': 'Automática: una vez por turno, los dados de daño de tu técnica de Cuerpo se tiran dos veces y queda el mayor.',
  'estilo-mirada': 'Reacción Verbe con aviso (3.75): si te impactan con la Mirada abierta, te llega «Usar»; el atacante repite el d20 y se queda con el menor, y si así falla, el golpe se anula.',
  'estilo-mirada-2': 'Automática: con la Mirada abierta tienes «Ojo que anticipa» (+ competencia a la iniciativa). La Sorpresa la decide el DM.',
  'estilo-sello': 'Recordatorio: el DM duplica los PG y suma +2 a la CA de tus barreras.',
  'estilo-sello-2': 'Automática: si falla la salvación, el objetivo recibe «Sello que corta» (sin reacciones hasta su siguiente turno), con «Deshacer».',
  'estilo-pacto': 'Recordatorio en el chat al atacar: el DM da la ventaja si tu criatura del Pacto está al lado del objetivo.',
  'estilo-pacto-2': 'Recordatorio: el DM suma los PG al llamar a la criatura.',
  'estilo-pulso': 'Automática: tu curación de Pulso suma 2 + el grado de la técnica.',
  'estilo-pulso-2': 'Automática: una vez por turno, el daño de tu técnica de Pulso suma tu modificador de Verbe.',
  'estilo-hilo': 'Automática: +2 al daño de tus técnicas de Hilo y de las armas arrojadizas que lanzas.',
  'estilo-hilo-2': 'Recordatorio en el chat al atacar: la cobertura y el alcance largo los ajusta el DM.',
  'estilo-quietud': 'Recordatorio: si impactas con un ataque de oportunidad, el DM baja su velocidad a 0.',
  'estilo-quietud-2': 'Reacción Verbe con aviso (3.75): si una criatura a 1,5 m te falla un ataque cuerpo a cuerpo, te llega «Usar» y la atacas con tu arma cuerpo a cuerpo equipada.',
  'estilo-rastro': 'Automática: en tu hoja aparece «Presa marcada» (acción adicional, 1 Verbe, concentración). Una vez por turno, +1d6 al daño contra la presa; «Deshacer» devuelve el Verbe y quita la marca.',
  'estilo-rastro-2': 'Automática: tus ataques contra tu presa marcada son críticos con 19 o 20.',
  'estilo-umbral': 'Automática: al usar una técnica de Umbral recibes «Paso que golpea»; tu siguiente ataque del turno tiene ventaja y el efecto se va.',
  'estilo-umbral-2': 'Reacción Verbe y 2 Verbe, con aviso (3.75): si impactan a un aliado a 9 m o menos, te llega «Usar»; os cambiáis de lugar y el golpe te alcanza a ti, con «Deshacer».',
  'estilo-vasija': 'Automática: transformado (manto o avatar) tienes «Furia de la bestia»: +2 al daño cuerpo a cuerpo y ventaja en pruebas y salvaciones de Fuerza.',
  'estilo-vasija-2': 'Automática: una vez por Descanso Largo, si estás transformado, quedas a 1 PG en vez de caer a 0, con «Deshacer».'
};
let cambiadas = 0;
for (const [id, auto] of Object.entries(AUTO)) {
  const d = D.dotes.find(x => x.id === id); if (!d) throw Error(`Falta la dote ${id}`);
  const texto = String(d.texto).replace(/puedes usar tu reacción/g, 'puedes usar tu Reacción Verbe');
  const automatizacion = `${auto}${d.dnd ? ` Equivale a «${d.dnd}» de D&D.` : ''}`;
  if (d.texto !== texto || d.automatizacion !== automatizacion) cambiadas++;
  Object.assign(d, { texto, automatizacion });
}
D.ajustes373 = { estilos: Object.keys(AUTO).length };
const errores = validateCatalog(D); if (errores.length) throw Error(errores.join('\n'));
writeCatalog(D);
console.log(`3.73: ${Object.keys(AUTO).length} estilos de combate con su automatización (${cambiadas} cambiadas ahora).`);
