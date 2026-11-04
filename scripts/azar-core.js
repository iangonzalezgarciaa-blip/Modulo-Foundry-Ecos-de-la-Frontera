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
// 3.12 (pedido del autor): el 20 natural ya no duplica el daño; a cambio, el 20 y el 1 traen consecuencias que se notan,
// lógicas para un éxito o un fracaso tremendos. Cada fila es una alternativa, nunca una acumulación con las otras siete.
// [nombre, texto, tipo de efecto automático, valor, sobre quién]. Tipos: ca (±{bono}), paso (±1,5 m por punto),
// estado (un estado de dnd5e), pgTemp (PG temporales = competencia). «objetivo»: se aplica al blanco de la tirada.
const adversos={
 ataque:[
 ['Pierdes el equilibrio','Quedas Derribado.','estado','prone'],
 ['Se te escapa el arma','Lo que usabas cae a 1,5 m de ti. Recogerlo es tu interacción con un objeto. Una técnica sin arma te deja la mano entumecida: tu próximo ataque con ella recibe −{bono}.'],
 ['Guardia abierta','Hasta el inicio de tu próximo turno tu CA baja {bono}.','ca',-1],
 ['Golpe al aliado','Si hay un aliado a 1,5 m del objetivo, salva Destreza contra 10 + tu bono de ataque o recibe la mitad del daño que habrías hecho.'],
 ['Te tuerces','En tu próximo turno tu velocidad baja 3 m, como mínimo a 1,5 m.','paso',-2],
 ['Le das la espalda','El objetivo puede usar su reacción ahora para hacerte un ataque cuerpo a cuerpo, si te alcanza.'],
 ['Arma trabada','Tu próximo ataque con esa arma o técnica tiene desventaja.'],
 ['Te delatas','Si estabas escondido, todos saben dónde estás. Si no, el enemigo más cercano tiene ventaja en su próximo ataque contra ti.']
 ],
 salvacion:[
 ['Te dura más','El efecto que fallaste dura un asalto más.'],
 ['Al suelo','Además, quedas Derribado.','estado','prone'],
 ['Sueltas lo que tienes','Se te cae lo que sostienes en una mano (tú eliges cuál).'],
 ['Sin reacción','Pierdes tu reacción hasta el inicio de tu próximo turno.'],
 ['Guardia rota','Hasta el inicio de tu próximo turno tu CA baja {bono}.','ca',-1],
 ['Pánico','Quedas Asustado de la fuente del efecto hasta el final de tu próximo turno.','estado','frightened'],
 ['Tambaleo','En tu próximo turno tu velocidad baja 3 m, como mínimo a 1,5 m.','paso',-2],
 ['Marcado','Tu próxima salvación antes del final de tu siguiente turno tiene desventaja.']
 ],
 habilidad:[
 ['Te enredas','Quedas Derribado.','estado','prone'],
 ['Herramienta perdida','Lo que usabas cae a 3 m. Si era frágil, se daña: el DM dice si aún sirve.'],
 ['Llamas la atención','El enemigo más cercano te elige: su próximo ataque contra ti tiene ventaja.'],
 ['Te lastimas','Recibes {temporal} de daño contundente: un mal golpe, un tirón, una caída.'],
 ['Mala lectura','El DM te da un dato equivocado pero creíble sobre lo que intentabas.'],
 ['Guardia distraída','Hasta el inicio de tu próximo turno tu CA baja {bono}.','ca',-1],
 ['Sin poder repetir','No puedes volver a intentar lo mismo hasta el final de tu próximo turno.'],
 ['Arrastras a otro','Un aliado que te ayudaba o estaba a 1,5 m tiene desventaja en su próxima tirada.']
 ],
 escena:[
 ['El doble de tiempo','Tardas el doble de lo normal.'],
 ['Se rompe','La herramienta o el material se daña: hay que repararlo o reponerlo antes de volver a usarlo.'],
 ['Te ven','Alguien que no debía te ve o te oye.'],
 ['Mala impresión','Quien te vio se lleva una mala imagen: −1 al Prestigio con su gente, o hoy no te ayuda.'],
 ['Pista falsa','El DM te da un dato equivocado pero creíble.'],
 ['Te lastimas','Recibes {temporal} de daño: un corte, un golpe, una torcedura.'],
 ['Sin segunda vez','No puedes volver a intentarlo hasta mañana o hasta cambiar de método.'],
 ['Haces ruido','Llamas la atención de algo cercano: el DM decide si trae una complicación.']
 ]
};
const favorables={
 ataque:[
 ['Lo derribas','El impacto lo tira al suelo: queda Derribado.','estado','prone','objetivo'],
 ['Lo desarmas','Lo que sostiene en una mano sale volando 3 m en la dirección que elijas.'],
 ['Lo dejas sin aire','Pierde su reacción hasta el inicio de su próximo turno.'],
 ['Herida abierta','Queda Sangrando: al inicio de cada uno de sus turnos recibe {temporal} de daño, hasta que alguien use una acción para cortarlo (Medicina CD 10) o reciba curación.','estado','bleeding','objetivo'],
 ['Guardia rota','Hasta el inicio de tu próximo turno, los ataques de tus aliados contra él tienen ventaja.'],
 ['Lo empujas','Lo apartas 3 m de ti en línea recta. Si choca contra algo sólido, recibe {temporal} de daño contundente.'],
 ['Golpe preciso','Un dado del daño de este golpe cuenta con su valor máximo.'],
 ['Te creces','Ganas {temporal} PG temporales y tu próximo ataque antes del final de tu siguiente turno recibe +{bono}.','pgTemp',1]
 ],
 salvacion:[
 ['Te sacudes','Además, terminas un estado que ya tuvieras: Asustado, Hechizado, Cegado, Ensordecido o Envenenado.'],
 ['Contraataque','Si quien te forzó la salvación está a 1,5 m, puedes usar tu reacción para atacarlo ahora.'],
 ['Esquiva perfecta','Te mueves 3 m sin provocar ataques de oportunidad.'],
 ['Aguante','Ganas {temporal} PG temporales.','pgTemp',1],
 ['Lo lees','Hasta el inicio de tu próximo turno tu CA aumenta {bono}.','ca',1],
 ['Ánimo','Un aliado que te vea suma +{bono} a su próxima tirada antes del final de tu siguiente turno.'],
 ['Se lo devuelves','Quien lo lanzó tiene desventaja en su próxima tirada de ataque.'],
 ['Te creces','Tu próxima salvación en este combate tiene ventaja.']
 ],
 habilidad:[
 ['Sin gastar nada','No consumes la herramienta, la munición ni el material; si tardaba más de una acción, tardas la mitad.'],
 ['Ves algo más','El DM te dice algo útil del enemigo o del lugar que no habías preguntado.'],
 ['Ventaja ganada','Tu próxima tirada contra el mismo objetivo o sobre la misma tarea tiene ventaja.'],
 ['Por dos','Tu éxito también vale para un aliado que intentaba lo mismo.'],
 ['Paso libre','En tu próximo turno tu velocidad aumenta 3 m.','paso',2],
 ['Guardia alta','Hasta el inicio de tu próximo turno tu CA aumenta {bono}.','ca',1],
 ['Te ven hacerlo','Los enemigos dudan: el más cercano tiene desventaja en su próximo ataque.'],
 ['Aliento','Ganas {temporal} PG temporales.','pgTemp',1]
 ],
 escena:[
 ['La mitad de tiempo','Tardas la mitad de lo normal.'],
 ['Algo más','Además, encuentras algo que no buscabas: una pista, un objeto o un dato (el DM decide qué).'],
 ['Buena fama','Quien te vio te recuerda: +1 al Prestigio con su gente o un favor pequeño.'],
 ['Sin gastar','No consumes el material ni la herramienta.'],
 ['Contagias','Un aliado que te vio tiene ventaja en su próxima prueba para lo mismo.'],
 ['Atajo','Encuentras un método, un camino o un contacto: tu próxima prueba igual recibe +{bono}.'],
 ['Impresionas','Alguien importante presente cambia su actitud hacia ti un paso a mejor.'],
 ['Lo sabías','Recuerdas algo de tu vida que te sirve aquí: el DM te da un dato ligado a tu trasfondo.']
 ]
};
export function tablaAzar(contexto,natural,nivel=1){
 const e=escalaAzar(nivel),tabla=(natural===1?adversos:natural===20?favorables:null)?.[contexto];if(!tabla)return [];
 const valor=(tipo,v)=>tipo==='ca'?v*e.bono:tipo==='paso'?v*e.metros:tipo==='pgTemp'?v*e.temporal:v;
 return tabla.map(([nombre,texto,tipo,v,quien],i)=>({indice:i+1,nombre,texto:texto.replaceAll('{bono}',e.bono).replaceAll('{temporal}',e.temporal),contexto,natural,nivel:e.nivel,
  ...(tipo?{efecto:{tipo,valor:valor(tipo,v),...(quien?{quien}:{})}}:{})}));
}
export const REGLA_AZAR='Desde 3.12, un 20 natural en un ataque ya no duplica el daño: sigue impactando siempre y, a cambio, saca un efecto al azar de la tabla de golpes tremendos. Un 1 natural saca uno de pifia. Lo mismo en salvaciones y pruebas, para todos por igual, PJ y PNJ: el 1 o el 20 conserva el éxito o fracaso normal y añade su consecuencia. En combate cuenta cada 20 de ataque; lo demás (los 1 y las salvaciones o pruebas) solo si es el primer d20 de esa criatura en el turno, para no castigar los ataques extra y para que un área cuente una vez. Fuera de combate, una propuesta por criatura cada diez minutos de juego. Se excluyen muerte, iniciativa, Concentración y las tiradas de Control de un choque. El DM aprueba cada propuesta: los cambios de CA, velocidad, estados y PG temporales se aplican solos (al que tiró o a su blanco); lo demás lo narra la mesa. Los efectos no se acumulan entre sí y los de un turno vencen al terminar el siguiente turno propio.';

/** Para la página de reglas: la tabla sin nivel, con B (1 a 3 según el nivel) y C (tu competencia). */
export function tablaAzarGuia(contexto,natural){
 const tabla=(natural===1?adversos:natural===20?favorables:null)?.[contexto]??[];
 return tabla.map(([nombre,texto,tipo,v,quien],i)=>({indice:i+1,nombre,texto:texto.replaceAll('{bono}','B').replaceAll('{temporal}','C'),auto:!!tipo,objetivo:quien==='objetivo'}));
}
