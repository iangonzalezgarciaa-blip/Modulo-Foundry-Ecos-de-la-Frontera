/** Lectura guiada. Solo presenta datos; no altera costes, tiradas ni efectos. */
import {donDivino,NIVELES_DIVINOS} from './verbe-divinity.js';
export const escTexto=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ABREV={AA:'acción adicional',PG:'puntos de vida',CA:'Clase de Armadura',CD:'dificultad',FUE:'Fuerza',DES:'Destreza',CON:'Constitución',INT:'Inteligencia',SAB:'Sabiduría',CAR:'Carisma',VD:'valor de desafío'};
export function textoClaro(texto){
 return String(texto??'').replace(/\b(FUE|DES|CON|INT|SAB|CAR),\s*(mitad|nada):/g,(_,car,resultado)=>`El objetivo hace una salvación de ${ABREV[car]}. Si la supera, recibe ${resultado==='mitad'?'la mitad del daño':'ningún daño'}:`)
  .replace(/\b(AA|PG|CA|CD|FUE|DES|CON|INT|SAB|CAR|VD)\b/g,m=>ABREV[m])
  .replace(/\bmod\.(?=\s|$)/g,'modificador indicado en la ficha').replace(/\bprof\.(?=\s|$)/g,'bonificador de competencia')
  .replace(/salva (Fuerza|Destreza|Constitución|Inteligencia|Sabiduría|Carisma) dificultad (\d+) o /g,'hace una salvación de $1 contra dificultad $2; si falla, ')
  .replace(/salva (Fuerza|Destreza|Constitución|Inteligencia|Sabiduría|Carisma) o /g,'hace una salvación de $1; si falla, ');
}
export function avanceTexto(texto,max=170){
 const claro=textoClaro(texto);if(claro.length<=max)return claro;
 const partes=claro.split(/(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÑ])/u);
 if(partes[0].length<=max)return partes[0];
 const corto=claro.slice(0,max+1);return corto.slice(0,corto.lastIndexOf(' '))+'…';
}
/** Mantiene todas las condiciones; los límites y el final tienen su propio rótulo. */
export function efectoHTML(texto){
 const partes=textoClaro(texto).split(/\s+(?=(?:Límites|Final|Sube):)/);
 return partes.map(p=>{const m=p.match(/^(Límites|Final|Sube):\s*(.*)$/s);return m?`<p><b>${{Límites:'Límites del efecto',Final:'Cuándo termina',Sube:'Al usar un grado mayor'}[m[1]]}:</b> ${escTexto(m[2])}</p>`:`<p>${escTexto(p)}</p>`;}).join('');
}
export const CAR_NOMBRE={str:'Fuerza',dex:'Destreza',con:'Constitución',int:'Inteligencia',wis:'Sabiduría',cha:'Carisma'};
export function tiempoTexto(t){return ({A:'Acción',AA:'Acción adicional',R:'Reacción','1 min':'1 minuto','10 min':'10 minutos','1 h':'1 hora','8 h':'8 horas'})[t]??t??'Consulta el tiempo en la ficha';}
export function duracionTexto(t){
 const s=t.item?.system??{},d=s.duration,unidades={round:['asalto','asaltos'],minute:['minuto','minutos'],hour:['hora','horas'],day:['día','días']};
 if(d?.units==='inst')return 'Instantánea';
 const u=unidades[d?.units],base=u&&d.value>0?`${d.value} ${u[Number(d.value)===1?0:1]}`:String(t.dur??'Consulta el efecto').replace(/^C /,'Concentración: ');
 return (s.properties??[]).includes('concentration')?`${base}; requiere Concentración`:base;
}
export function resolucionTexto(t){
 const actos=Object.values(t.item?.system?.activities??{}),a=actos[0];if(actos.length>1)return 'Elige en la ficha cuál de sus actividades vas a usar.';
 if(a?.type==='attack')return 'Tú tiras un ataque contra la Clase de Armadura del objetivo. Acertar permite resolver el daño y el efecto.';
 if(a?.type==='save'){const ab=a.save?.ability,lista=typeof ab==='string'?[ab]:Array.from(ab??[]);return `El objetivo hace una salvación de ${lista.map(c=>CAR_NOMBRE[c]??c).join(' o ')||'la característica indicada'} contra la dificultad de la ficha.${a.damage?.parts?.length?(a.damage.onSave==='half'?' Si tiene éxito, recibe la mitad del daño.':' Si tiene éxito, no recibe ese daño.'):' La descripción explica qué ocurre con éxito o fallo.'}`;}
 if(a?.type==='heal')return 'Tira la curación de la ficha. Las heridas y otros estados pueden limitar los puntos de vida que recupera el objetivo.';
 if(a?.type==='damage')return 'Tira los dados de daño de la ficha. Revisa las condiciones del efecto antes de aplicarlo.';
 return 'Sigue el efecto escrito. Esta actividad muestra una tarjeta; el DM resuelve lo que no se aplique automáticamente.';
}
export function referenciaHTML(t,{dm=false}={}){
 const o=t.origen;if(!o)return '';
 // Un nombre divino no se revela al dueño de la técnica por leer una referencia.
 if(t.divina&&!dm)return '<p class="ev-nota">Adaptación de reglas de Nimerios. El origen de esta sangre se descubre en la historia.</p>';
 const pagina=Number.isInteger(o.pagina)?` · estudio, p. ${o.pagina}`:o.referencia?` · ${o.referencia}`:'';
 return `<p class="ev-nota">Referencia: ${escTexto(o.nombre)}${o.obra?` · ${escTexto(o.obra)}`:''}${escTexto(pagina)}. Las cifras son la adaptación de esta campaña.</p>`;
}
export function fichaLecturaHTML(t){
 const m=t.item?.flags?.['ecos-frontera']?.verbe??{};
 return `<div class="ev-lectura"><h3>Qué hace</h3>${efectoHTML(t.textoJ??t.texto)}<h3>Cómo se usa</h3><dl class="ev-lectura-datos"><div><dt>Tiempo</dt><dd>${escTexto(tiempoTexto(t.t))}</dd></div><div><dt>Alcance</dt><dd>${escTexto(({yo:'Sobre ti',toque:'Al tocar al objetivo'})[t.alc]??t.alc??'Consulta el efecto')}</dd></div><div><dt>Duración</dt><dd>${escTexto(duracionTexto(t))}</dd></div></dl><p>${escTexto(resolucionTexto(t))}</p><h3>Qué cuesta</h3><p><b>Aprender:</b> ${t.incl?"Se recibe con su etapa de Mirada; no se compra por separado.":`${t.trazos} Trazos una sola vez.`} <b>Usar:</b> el panel muestra el coste de Verbe ajustado a tu personaje y al grado elegido. Elegir «Aprender» no activa la técnica.</p>${t.g>=6?'<p>Esta técnica tiene un uso por Descanso Largo y también consume un uso del grupo de poderes altos que le corresponde. Un corto no lo devuelve.</p>':''}${m.familiaUso?'<p>Comparte un uso por Descanso Largo con las variantes de su misma familia.</p>':''}${m.ritual?'<p><b>Ritual:</b> resuelve los preparativos y pide al DM permiso para esta activación. El descanso no devuelve ese permiso.</p>':''}<details><summary>Datos de referencia y mejoras</summary><p>Grado ${t.g}. ${t.sube?`${t.sube==='truco'?'Sus dados aumentan en los niveles 5, 11 y 17.':`Al elegir un grado mayor añade ${escTexto(t.sube)} por grado adicional; el panel limita qué grados puedes elegir.`}`:'Elevar el grado no añade un escalado de dados si la ficha no lo indica.'} Los dados que añaden tus mejoras se calculan en la actividad; no los sumes otra vez por leer el texto base.</p>${(t.prog??[]).map(p=>`<p>${escTexto(textoClaro(p))}</p>`).join('')}${referenciaHTML(t)}</details></div>`;
}
export const GLOSARIO=[
 ['Verbe','Energía para usar técnicas. El número izquierdo es lo que tienes; el derecho es tu máximo.'],
 ['Trazos','Puntos para comprar técnicas y mejoras permanentes. Gastarlos no consume Verbe.'],
 ['Nivel','Tu nivel de personaje. Establece el techo general de potencia.'],
 ['Rama y rango','Una rama es una especialidad, como Forma. Su rango, como Entrenado o Experto, indica cuánto dominas esa especialidad.'],
 ['Grado','Potencia de una técnica. No es tu nivel de personaje ni el rango de una rama.'],
 ['Dote y don','Una dote es una mejora que compras o recibes. Un don de rama es un beneficio que ganas al alcanzar cierto rango.'],
 ['CD y CA','CD es la dificultad de una salvación. CA es la Clase de Armadura contra la que se compara un ataque. Por regla general, igualar esa cifra permite superar la dificultad o acertar; siguen contando las condiciones del efecto.'],
 ['PG y dados','PG son puntos de vida. «3d6» significa tirar tres dados de seis caras y sumar sus resultados.'],
 ['Modificador y competencia','Bonificadores que proceden de las características y el entrenamiento de tu hoja. La actividad prepara los que correspondan; no los añadas de nuevo si ya aparecen en la tirada.'],
 ['Turno y asalto','Tu turno es el momento en que actúas. Un asalto reúne los turnos de todos los participantes del combate.'],
 ['Concentración','Debes mantener el efecto. Si pierdes Concentración, termina. La ficha indica si la necesita.'],
 ['Hito y permiso','Un hito reconoce un logro de la historia que concede el DM. Un permiso ritual autoriza una sola activación; no es un uso diario que vuelva por descansar.']
];
export const glosarioHTML=()=>`<dl class="ev-glosario">${GLOSARIO.map(([t,d])=>`<div><dt>${escTexto(t)}</dt><dd>${escTexto(d)}</dd></div>`).join('')}</dl>`;
export function tablaSangreHTML(l){return `<details><summary>Ver crecimiento por nivel con sangre Plena</summary><p>Las cifras siguientes son añadidos del potencial primigenio. La reserva se calcula sobre la tabla de nivel más el modificador, antes de dotes y multiplicadores. No rellena energía al asignarlo.</p><table><thead><tr><th>Nivel alcanzado</th><th>Reserva adicional</th><th>Defensa permanente</th><th>Añadido al Despertar</th></tr></thead><tbody>${NIVELES_DIVINOS.map(n=>{const d=donDivino(l,'plena',n);return `<tr><td>${n}</td><td>+${Math.round(d.reserva*100)} % de la base</td><td>+${d.ac} a la Clase de Armadura</td><td>+${d.despertarAC} a la Clase de Armadura${d.resistencias.length?'; resistencia al veneno y necrótico':''}</td></tr>`;}).join('')}</tbody></table><p>El Despertar conserva también los beneficios propios que se describen debajo. Una fuerza menor reduce la intensidad y limita el crecimiento; consulta su explicación antes de asignarla.</p></details>`;}
/** Huella de comparación para respetar textos que el DM haya personalizado. No es una firma de seguridad. */
export function huellaTexto(s){let h=2166136261;for(const c of String(s??'')){h^=c.codePointAt(0);h=Math.imul(h,16777619);}return `${String(s??'').length}:${(h>>>0).toString(16)}`;}
