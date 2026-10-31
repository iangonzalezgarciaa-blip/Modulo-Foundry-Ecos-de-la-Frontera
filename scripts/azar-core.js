/** Complicaciones y oportunidades: consecuencias pequeñas, temporales y separadas del éxito normal. */
export const CONTEXTOS_AZAR={ataque:'Ataque',salvacion:'Salvación',habilidad:'Prueba en combate',escena:'Prueba fuera de combate'};
export function dadoNatural(roll){
 const die=roll?.dice?.find(d=>d.faces===20);if(!die)return null;
 const activos=(die.results??[]).filter(r=>r.active!==false&&!r.discarded&&!r.rerolled);
 return activos.length===1&&Number.isInteger(activos[0].result)?activos[0].result:null;
}
export function escalaAzar(nivel){
 const n=Math.max(1,Math.min(20,Math.trunc(Number(nivel)||1))),competencia=2+Math.floor((n-1)/4);
 return {nivel:n,bono:Math.min(3,Math.ceil(competencia/2)),temporal:competencia,metros:1.5};
}
// Cada fila es una alternativa, nunca una acumulación con las otras siete.
const adversos={
 ataque:[
 ['Guardia abierta','Hasta el inicio de tu próximo turno, tu CA baja {bono}.','ca',-1],
 ['Paso inseguro','En tu próximo turno tu velocidad de caminar baja 1,5 m, como mínimo a 1,5 m.','paso',-1],
 ['Ruido del impacto','Tu intento produce un ruido claramente audible. El DM decide quién puede oírlo; no crea enemigos.'],
 ['Agarre incómodo','Antes de tu próximo ataque debes recolocar el arma o tus manos usando tu interacción gratuita con objeto. Si no puedes, el DM permite soltar un objeto; nunca destruye equipo.'],
 ['Lectura del adversario','El objetivo entiende tu intención inmediata. La siguiente prueba tuya de Engaño contra él antes del final de tu próximo turno recibe −{bono}.'],
 ['Retroceso breve','Puedes elegir permanecer en tu espacio o retroceder 1,5 m a un espacio seguro, visible y sin peligro. El DM resuelve el movimiento normal y posibles ataques de oportunidad; nunca obliga a caer.'],
 ['Molestia pasajera','La próxima prueba de habilidad de Fuerza o Destreza que hagas antes del final de tu siguiente turno recibe −{bono}. No afecta ataques ni salvaciones.'],
 ['Tensión revelada','El DM describe una apertura o señal de cansancio. Un enemigo que pueda verla sabe que esa maniobra te costó esfuerzo; no obtiene un ataque, acción o daño gratis.']
 ],
 salvacion:[
 ['Equilibrio precario','En tu próximo turno tu velocidad de caminar baja 1,5 m, como mínimo a 1,5 m.','paso',-1],
 ['Defensa forzada','Hasta el inicio de tu próximo turno, tu CA baja {bono}. No añade daño al efecto que originó la salvación.','ca',-1],
 ['Atención dividida','Tu próxima prueba de Percepción antes del final de tu siguiente turno recibe −{bono}.'],
 ['Señal evidente','Tu reacción al peligro es visible o audible para quien pueda percibirte. No revela criaturas ocultas por sí sola ni altera el resultado de la salvación.'],
 ['Gesto incómodo','Tu próxima prueba de Acrobacias o Atletismo antes del final de tu siguiente turno recibe −{bono}.'],
 ['Respiración entrecortada','Hablas con dificultad hasta el inicio de tu siguiente turno. Puedes comunicar frases cortas y lanzar conjuros con normalidad; no añade Silencio o Incapacitado.'],
 ['Rastro del peligro','Queda en ti una señal no dañina del efecto hasta que la limpies durante un minuto. No impone estados ni nuevas tiradas.'],
 ['Posición comprometida','El DM señala una cobertura o apoyo que debes volver a evaluar. No pierde su protección hasta que las reglas normales o un cambio real del escenario lo indiquen.']
 ],
 habilidad:[
 ['Apoyo inestable','En tu próximo turno tu velocidad de caminar baja 1,5 m, como mínimo a 1,5 m.','paso',-1],
 ['Herramienta desplazada','La herramienta que usas queda a tu alcance en un apoyo seguro si lo hay. Recuperarla usa tu interacción normal; no se pierde ni se rompe.'],
 ['Detalle anunciado','Alguien que pueda percibirte nota qué tarea intentabas hacer. No conoce información que no pudiera percibir.'],
 ['Preparación incompleta','La siguiente prueba de habilidad para esa misma tarea, antes del final de tu próximo turno, recibe −{bono}. No afecta ataques o salvaciones.'],
 ['Pequeño retraso','La tarea necesita un detalle adicional que puedes completar con una interacción normal o durante el minuto siguiente. No consume otra acción de combate.'],
 ['Señal confusa','Un aliado que te vea pide aclaración de tu intención. Puedes responder normalmente; no le quita acciones ni altera su siguiente tirada.'],
 ['Guardia distraída','Hasta el inicio de tu próximo turno tu CA baja {bono}.','ca',-1],
 ['Rastro de actividad','Dejas una señal de tu trabajo que el DM describe. No produce daño, recursos gastados ni una alarma automática.']
 ],
 escena:[
 ['Tiempo extra','La tarea tarda hasta un minuto adicional o un 10 % de su duración normal, el menor de ambos. No rompe por sí solo un plazo importante.'],
 ['Limpieza necesaria','Queda suciedad o desorden pequeño. Un minuto y medios ordinarios bastan para corregirlo; no destruye materiales ni contamina alimentos.'],
 ['Pregunta incómoda','Una persona presente puede pedir una aclaración. Responder o negarte sigue siendo tu decisión; no impone hostilidad ni confesiones.'],
 ['Huella del intento','Dejas una señal perceptible de la tarea. Detectarla requiere las condiciones y pruebas normales.'],
 ['Medida repetida','Antes de repetir exactamente esta tarea necesitas un minuto para revisar el procedimiento. No habilita repetir una prueba que el DM considera definitiva.'],
 ['Dato incompleto','El DM ofrece una pista parcial que ya podrías percibir y señala qué falta comprobar. No transforma un fracaso en éxito ni fabrica información falsa obligatoria.'],
 ['Pequeña distracción','Tu próxima prueba de habilidad sobre esta misma tarea en los siguientes diez minutos recibe −{bono}. No afecta ataques o salvaciones.'],
 ['Bulto mal colocado','Un objeto propio usado en la tarea queda en un lugar seguro que puedas recuperar. No desaparece, se rompe ni se entrega a un enemigo.']
 ]
};
const favorables={
 ataque:[
 ['Guardia firme','Hasta el inicio de tu próximo turno tu CA aumenta {bono}.','ca',1],
 ['Paso decidido','En tu próximo turno tu velocidad de caminar aumenta 1,5 m. No concede movimiento inmediato ni evita ataques de oportunidad.','paso',1],
 ['Lectura del terreno','El DM señala una cobertura o apoyo que ya puedas percibir. Aprovecharlo sigue requiriendo movimiento y acciones normales.'],
 ['Maniobra clara','Un aliado que te vea entiende tu intención inmediata. No obtiene acciones, daño o ventaja automática.'],
 ['Pulso firme','Tu siguiente prueba de habilidad para mantener el equilibrio antes del final de tu próximo turno recibe +{bono}.'],
 ['Rastro del adversario','Reconoces un detalle de equipo o estilo que el objetivo haya mostrado. No revela estadísticas, resistencias o secretos no observables.'],
 ['Control del espacio','Puedes dar una indicación breve a un aliado que te oiga. El DM ofrece una opción de posición segura visible, sin mover tokens automáticamente.'],
 ['Ánimo sereno','Puedes describir un gesto de seguridad sin coste adicional. El próximo chequeo de Interpretación o Persuasión sobre este enfrentamiento dentro de diez minutos recibe +{bono}.']
 ],
 salvacion:[
 ['Defensa medida','Hasta el inicio de tu próximo turno tu CA aumenta {bono}.','ca',1],
 ['Pie seguro','En tu próximo turno tu velocidad de caminar aumenta 1,5 m. No concede desplazamiento inmediato.','paso',1],
 ['Comprender el peligro','El DM describe una señal del peligro que acabas de percibir. No revela estadísticas ni elimina efectos ya aplicados.'],
 ['Aviso oportuno','Puedes advertir de viva voz a un aliado que te oiga. No cambia una salvación ya tirada ni concede ventaja automática.'],
 ['Control recuperado','Tu próxima prueba de Acrobacias o Atletismo antes del final de tu siguiente turno recibe +{bono}.'],
 ['Atención despierta','Tu próxima prueba de Percepción antes del final de tu siguiente turno recibe +{bono}.'],
 ['Ruta advertida','Reconoces un paso seguro visible que el DM señala. Recorrerlo usa tu movimiento normal.'],
 ['Serenidad compartida','Un aliado que te perciba entiende una señal de calma. No elimina miedo, encantamiento, Concentración ni otros estados.']
 ],
 habilidad:[
 ['Trabajo bien dispuesto','Tu siguiente prueba de habilidad sobre la misma tarea antes del final de tu próximo turno recibe +{bono}.'],
 ['Herramienta a mano','Dejas una herramienta propia a tu alcance. Usarla conserva su coste normal de interacción y acción.'],
 ['Pista visible','El DM señala un detalle de la tarea que puedas percibir ahora. No concede éxito ni información secreta automática.'],
 ['Guardia cuidadosa','Hasta el inicio de tu próximo turno tu CA aumenta {bono}.','ca',1],
 ['Ayuda comprensible','Explicas en una frase cómo podría ayudar un aliado. La acción Ayudar conserva todos sus requisitos.'],
 ['Paso preparado','En tu próximo turno tu velocidad de caminar aumenta 1,5 m.','paso',1],
 ['Claridad de intención','El objetivo de una conversación entiende tu propuesta. Su opinión y voluntad siguen siendo propias.'],
 ['Procedimiento recordado','Recuerdas una preparación útil ya conocida para esta tarea. Aplicarla conserva su tiempo, materiales y pruebas normales.']
 ],
 escena:[
 ['Tiempo aprovechado','Si la tarea tiene éxito, ahorras hasta un minuto o un 10 % de su duración normal, el menor. No reduce tiempos de descanso, fabricación o aprendizaje reglados.'],
 ['Orden ejemplar','Terminas con herramientas y materiales propios ordenados. No crea objetos ni ahorra componentes consumidos por las reglas.'],
 ['Detalle útil','El DM ofrece un detalle adicional perceptible de la tarea. No obliga a revelar un secreto ni una solución completa.'],
 ['Buena disposición','Una persona que ya esté dispuesta a escucharte aprecia tu cuidado. No queda Hechizada ni acepta demandas automáticamente.'],
 ['Preparación acertada','La próxima prueba de habilidad sobre esta misma tarea dentro de diez minutos recibe +{bono}.'],
 ['Explicación clara','Puedes explicar a un compañero lo que realmente has aprendido. Comprenderlo no concede competencias, idiomas ni acceso a técnicas.'],
 ['Recuerdo preciso','Recuerdas un dato de la escena que hayas percibido; el DM lo confirma o indica qué falta comprobar.'],
 ['Camino despejado','Reconoces una comodidad o acceso ordinario ya visible que facilita organizar la siguiente tarea. No crea recursos, tesoros o rutas secretas.']
 ]
};
export function tablaAzar(contexto,natural,nivel=1){
 const e=escalaAzar(nivel),tabla=(natural===1?adversos:natural===20?favorables:null)?.[contexto];if(!tabla)return [];
 return tabla.map(([nombre,texto,tipo,signo],i)=>({indice:i+1,nombre,texto:texto.replaceAll('{bono}',e.bono),contexto,natural,nivel:e.nivel,
  ...(tipo?{efecto:{tipo,valor:tipo==='ca'?signo*e.bono:signo*e.metros}}:{})}));
}
export const REGLA_AZAR='Se usa el primer d20 válido de cada criatura en cada turno global de combate. Un área con varias tiradas de la misma criatura cuenta una vez. Fuera de combate solo se propone un resultado por criatura cada diez minutos de juego, para tareas significativas que valida el DM. El 1 o el 20 de una habilidad o salvación conserva el éxito o fracaso normal de la prueba. Los ataques conservan su crítico normal, sin daño crítico adicional de esta tabla. Se excluyen muerte, iniciativa, Concentración y tiradas de Control de un choque. Los efectos no se acumulan, no quitan turnos, destruyen equipo ni causan daño o recuperaciones de recursos. El DM puede descartar una propuesta que no encaje. Los efectos de un turno vencen al terminar el siguiente turno propio y se retiran al acabar el combate; el texto de CA puede indicar un final anterior.';
