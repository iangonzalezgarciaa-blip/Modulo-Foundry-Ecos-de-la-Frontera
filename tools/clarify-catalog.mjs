import {readCatalog,writeCatalog,validateCatalog} from './catalog.mjs';
import {fichaLecturaHTML} from '../scripts/verbe-reading.js';
const D=readCatalog();
const textos={
 'fuego-aliento':'Las criaturas alcanzadas hacen una salvación de Destreza. Si fallan, reciben 3d6 de fuego; si tienen éxito, reciben la mitad. Prende los materiales inflamables que alcanza. Al elegir un grado mayor, añade 1d6 por cada grado adicional.',
 'forma-sustitucion':'Cuando ves un ataque con tirada que va a impactarte, puedes cambiarte por un objeto de tu tamaño o menor que esté a 3 m o menos. El ataque golpea al objeto y falla contra ti. Coste base: 2 Verbe; añade 2 por cada grado que el ataque supere tu grado máximo. El grado del ataque es el de la técnica o conjuro; para armas o criaturas se usa la mitad del nivel o valor de desafío, redondeada hacia arriba. Necesitas un objeto válido y ver el ataque. No sirve contra áreas ni salvaciones, salvo lo que permita la dote Sustitución amplia. El DM confirma el objeto y la nueva posición.',
 'pulso-cerrar':'El objetivo recupera una cantidad de puntos de vida igual a 2d8 más el modificador indicado en la ficha. Además cuenta como un tratamiento diario exitoso: deja tratado el estado Malherido y suma el día de tratamiento a la Herida No Tratada. Repetir la técnica no suma varios días de tratamiento en un mismo día ni elimina directamente un nivel de herida. Al elegir un grado mayor, añade 2d8 de curación por cada grado adicional.',
 'sangre-thalos-marea':'Una vez por Descanso Corto, recuperas 1d6 + tu bonificador de competencia de Verbe. Esta recuperación respeta el máximo de reserva, paga la deuda al doble y consume el presupuesto breve compartido. Si ese presupuesto se agotó, no recuperas más. El DM resuelve y registra esta utilidad; mostrar la tarjeta no rellena la reserva por sí solo.'
};
for(const t of D.tecnicas){
 if(textos[t.id])t.texto=textos[t.id];
 if(t.divina){const lin=D.linajes.find(l=>l.id===t.acceso?.linaje);if(lin)t.textoJ=t.texto.replaceAll(lin.real,lin.id==='maethra'?'la Madre':'la deidad de este linaje');}
 t.item.system.description.value=fichaLecturaHTML(t);
}
D.lectura={version:1,tecnicas:D.tecnicas.length};
const errores=validateCatalog(D);if(errores.length)throw Error(errores.join('\n'));writeCatalog(D);
console.log(`Lectura guiada aplicada a ${D.tecnicas.length} técnicas.`);
