/**
 * 3.64 · Plan de estudios del sensei (pedido del autor, 12-nov-2026): «un plan de estudios que el sensei debe enseñarles
 * en orden para convertirlos a futuro en maestros del Verbe, paso a paso, con lo mecánico, de regla y estadístico; el
 * relato lo pongo yo». Página 19 de «Reglas de la casa» y, en el panel del Verbe, «Cómo subir de etapa».
 * Las pruebas para subir de etapa son una guía: la etapa la sigue abriendo el DM con «Abrir la siguiente etapa».
 */
const MOD = "ecos-frontera";
/** Qué pide cada paso de etapa (guía para el DM). Puro. */
export const SUBIR_ETAPA = {
  1: { a: "Practicante", nivel: 3, cd: 13, tiempo: "una semana de entrenamiento con su maestro", pide: ["un maestro (Practicante o más) que le enseñe", "3 técnicas aprendidas (o 2 y una dote entrenada)", "nivel 3"] },
  2: { a: "Iniciado", nivel: 7, cd: 15, tiempo: "un mes de entrenamiento con un maestro Iniciado o Pleno", pide: ["nivel 7", "su naturaleza descubierta", "rango Entrenado en dos ramas", "un hito de historia que lo cambie"] },
  3: { a: "Pleno", nivel: 13, cd: 18, tiempo: "tres meses con un maestro Pleno, o un hito enorme", pide: ["nivel 13", "rango Experto en una rama", "una dote de senda (Disciplina) en su rama principal", "un maestro Pleno o un hito enorme"] }
};
/** El texto de «cómo subir» para una etapa. Puro. */
export function comoSubirHTML(etapa, esc = s => s) {
  const s = SUBIR_ETAPA[Number(etapa)];
  if (!s) return Number(etapa) >= 4 ? "<p><b>Pleno:</b> ya no hay techo de etapa. Lo que sigue son las sendas (Disciplina → Especialista → Maestría → Leyenda) y, para enseñar, la dote <b>Maestro del Verbe</b>.</p>" : "<p>Su Verbe todavía no despertó: lo despierta un maestro (el DM, con «Despertar»).</p>";
  return `<p><b>Para llegar a ${esc(s.a)}:</b> ${s.pide.map(esc).join(", ")}; después, ${esc(s.tiempo)} y una prueba de <b>Control del Verbe CD ${s.cd}</b> (un intento por semana de entrenamiento). Si la supera, el DM le abre la etapa con «Abrir la siguiente etapa».</p>`;
}
const fila = (paso, que, regla, cuanto) => `<tr><td><b>${paso}</b></td><td>${que}</td><td>${regla}</td><td>${cuanto}</td></tr>`;
const tabla = filas => `<table><thead><tr><th>Paso</th><th>Qué enseña el sensei</th><th>Regla (lo que se hace en la hoja)</th><th>Coste y tiempo</th></tr></thead><tbody>${filas.join("")}</tbody></table>`;
/** La página del plan de estudios. Puro. */
export function planSenseiHTML() {
  return `<section class="mcp-journal"><h1>Plan de estudios del sensei</h1>
<p><em>Lo que un maestro del Verbe enseña, en orden, para llevar a un alumno desde el despertar hasta poder enseñar él mismo. Tú pones el relato; aquí está lo mecánico: qué botón, cuántos Trazos, cuántos días, qué tirada.</em></p>
<h2>Cómo leer este plan</h2><ul>
<li><b>Trazos</b>: se ganan 4 por nivel (y al despertar, 4 × nivel + 4). Con «Entrenando → Entrenar o meditar» se ganan hasta 2 más por nivel (5 días buenos; 4 con un compañero; 3 con el sensei).</li>
<li><b>Verbe</b>: lo que gasta cada uso. Desde 3.64 cada uso suma el <b>dado de control</b> de su etapa: Aprendiz +1d4, Practicante +1d3, Iniciado +1d2, Pleno +1d2−1. Subir de etapa es, también, aprender a no desperdiciar.</li>
<li><b>Aprender una técnica</b>: pagar sus Trazos y estudiarla días (Control del Verbe CD 10 + grado; tantos días buenos como su grado + 1).</li>
<li><b>Dotes entrenadas</b>: pagar sus Trazos y entrenarlas horas o días (una tirada por bloque; un 20 natural la da al instante). Los <b>dones</b> (de nacimiento o de sangre) no se entrenan.</li>
<li><b>Etapa</b>: la abre el DM («Abrir la siguiente etapa») cuando el alumno supera la prueba de su paso.</li></ul>
<h2>Fase 0 · El despertar (Dormido → Aprendiz)</h2>
${tabla([
  fila("0.1", "Sentir el propio Verbe: respirar, escuchar el pulso.", "DM: «Despertar» en el panel del Verbe. Elige característica, etapa Aprendiz y modo de naturaleza (por dado).", "Gratis. Recibe 4 × nivel + 4 Trazos."),
  fila("0.2", "Los dones con los que nació.", "Mejorar → Dotes → <b>Dones</b> (Sentido del Verbe, Cuerpo despierto, Aliento del Verbe… son de 0 Trazos).", "0 Trazos: se tienen al comprarlos.")
])}
<h2>Fase 1 · Aprendiz (primer mes)</h2>
${tabla([
  fila("1.1", "La primera técnica: algo simple de su rama (un golpe reforzado, una guardia, una luz).", "Aprender técnicas → una de grado 0 de su rama principal (por ejemplo Guardia de Verbe: +1 CA y +1 a las salvaciones hasta su próximo turno).", "1 Trazo · 1 día bueno (CD 10)."),
  fila("1.2", "Otra técnica de grado 0 y una de grado 1.", "Aprender técnicas → grado 0 y 1 de la misma rama.", "1–2 Trazos cada una · 1 o 2 días buenos (CD 10–11)."),
  fila("1.3", "Ejercicio diario: meditar.", "Entrenando → Entrenar o meditar (Sabiduría CD 15), con el sensei marcado.", "Un día por intento; 3 días buenos = 1 Trazo."),
  fila("1.4", "Control: no derrochar.", "Mejorar → Dotes entrenadas → <b>Práctica de Control</b> (+1 a Control del Verbe).", "2 Trazos · 4 h (CD 12)."),
  fila("Prueba", "Paso a Practicante.", "Pide maestro, 3 técnicas y nivel 3. Una semana de entrenamiento y Control del Verbe CD 13.", "Si la supera: DM → «Abrir la siguiente etapa».")
])}
<h2>Fase 2 · Practicante (meses 2 a 6)</h2>
${tabla([
  fila("2.1", "Su elemento.", "Mejorar → Tus elementos → descubrir la naturaleza (desde nivel 5, o 3 con Entrenado en Forma): tira su dado.", "2 Trazos · 3 días · Control CD 12."),
  fila("2.2", "Subir su rama principal.", "Mejorar → Especialidades → rango <b>Entrenado</b> en la rama principal.", "1 Trazo (rango)."),
  fila("2.3", "Una segunda rama que complemente la primera.", "Mejorar → Especialidades → abrir la segunda rama (hasta dos en Practicante).", "Trazos del rango."),
  fila("2.4", "Mantener y romper.", "Dotes entrenadas: <b>Control sereno</b> (ventaja para mantener o romper un Velo) y <b>Concentración de hierro</b>.", "2 Trazos cada una · 4 h (CD 12)."),
  fila("2.5", "Técnicas de grado 2 y 3 de su elemento.", "Aprender técnicas → grado 2–3.", "2–3 Trazos · 3–4 días buenos (CD 12–13)."),
  fila("2.6", "Su estilo: cómo pelea su rama y para qué sirve fuera de la pelea.", "Mejorar → Dotes entrenadas → <b>Estilos de rama</b>: el Estilo de su rama y su Oficio (piden rango Entrenado).", "2 Trazos cada una · 4 h (CD 12)."),
  fila("Prueba", "Paso a Iniciado.", "Nivel 7, naturaleza descubierta, Entrenado en dos ramas y un hito de historia. Un mes y Control CD 15.", "DM → «Abrir la siguiente etapa».")
])}
<h2>Fase 3 · Iniciado (el primer año)</h2>
${tabla([
  fila("3.1", "El golpe concentrado y el pulso.", "Dote entrenada <b>Control fino del Verbe</b> (abre la rama Pulso).", "3 Trazos · 8 h (CD 13)."),
  fila("3.2", "Hacer suya una técnica.", "Mejorar → Entrenar técnicas: Pulida → Dominada → Propia.", "1, 2 y 3 Trazos y días según el grado."),
  fila("3.3", "Chocar técnicas.", "Dotes entrenadas <b>Choque perfecto</b> y <b>Leer el flujo</b>.", "2 Trazos cada una · 4 h (CD 12)."),
  fila("3.4", "Experto en su rama.", "Mejorar → Especialidades → rango <b>Experto</b> (nivel 5+).", "3 Trazos."),
  fila("3.5", "La senda de su rama.", "Dote entrenada <b>Disciplina de [su rama]</b> (primer paso de la senda).", "2 Trazos · 4 h (CD 12)."),
  fila("3.6", "El estilo mayor.", "Estilos de rama → el segundo paso de su Estilo (pide el Estilo, nivel 5 y rango Experto).", "3 Trazos · 2 bloques de 4 h (CD 13)."),
  fila("Prueba", "Paso a Pleno.", "Nivel 13, Experto en una rama, Disciplina de su rama y un maestro Pleno (o un hito enorme). Tres meses y Control CD 18.", "DM → «Abrir la siguiente etapa».")
])}
<h2>Fase 4 · Pleno: de alumno a maestro</h2>
${tabla([
  fila("4.1", "La maestría.", "Sendas: Especialista (nivel 7) → Maestría (nivel 11: grado 6–8) → Leyenda (nivel 18).", "3, 4 y 5 Trazos · días (CD 13–15)."),
  fila("4.2", "Enseñar.", "Dote entrenada <b>Maestro del Verbe</b>: puede abrirle la siguiente etapa a quien entrene con él una semana.", "6 Trazos · 4 días buenos (CD 16)."),
  fila("4.3", "Despertar a otros.", "Dote entrenada <b>Despertador</b>: ritual de un día y 1 Moneda Antigua.", "6 Trazos · 4 días buenos (CD 16)."),
  fila("4.4", "Lo mítico.", "Ascensión mítica y trascendente (dones que concede el DM tras su prueba de historia).", "4 y 5 Trazos.")
])}
<h2>Para el DM</h2><ul>
<li>El sensei marca el ritmo: un alumno con maestro gana Trazos antes (3 días buenos) y puede tirar con la característica que el maestro le enseñe (en lugar de Control o Sabiduría).</li>
<li>Las pruebas de paso son una guía: si la historia lo pide antes, abre la etapa igual.</li>
<li>Todo lo automático tiene «Deshacer» o «Dejar»; y tú puedes dar por aprendida cualquier técnica o dote desde «Entrenando».</li></ul></section>`;
}
if (globalThis.Hooks) Hooks.once("ready", () => {
  if (!game.user.isGM || (game.users.activeGM && !game.users.activeGM.isSelf)) return;
  setTimeout(() => import("./acciones-comunes.js").then(m => m.paginaReglas("guiaSensei", "19 · Plan de estudios del sensei", planSenseiHTML())).catch(err => console.error(`${MOD} | plan del sensei`, err)), 4000);
});
