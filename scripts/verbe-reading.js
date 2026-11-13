/** Lectura guiada. Solo presenta datos; no altera costes, tiradas ni efectos. */
import {donDivino,NIVELES_DIVINOS} from './verbe-divinity.js';
export const escTexto=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ABREV={AA:'acción adicional',PG:'puntos de vida',CA:'Clase de Armadura',CD:'dificultad',FUE:'Fuerza',DES:'Destreza',CON:'Constitución',INT:'Inteligencia',SAB:'Sabiduría',CAR:'Carisma',VD:'valor de desafío'};
const CARS='FUE|DES|CON|INT|SAB|CAR';
export function textoClaro(texto){
 return String(texto??'').replace(/\b(FUE|DES|CON|INT|SAB|CAR),\s*(mitad|nada):/g,(_,car,resultado)=>`El objetivo hace una salvación de ${ABREV[car]}. Si la supera, recibe ${resultado==='mitad'?'la mitad del daño':'ningún daño'}:`)
  // 3.67: las abreviaturas sueltas se leían ambiguas («SAB. Si falla…»): se dice quién tira y qué.
  .replace(new RegExp(`(^|[.;]\\s+)(${CARS}), si falla:`,'g'),(_,a,car)=>`${a}El objetivo hace una salvación de ${ABREV[car]}; si falla:`)
  .replace(new RegExp(`(^|[.;]\\s+)(${CARS})([.:])(?=\\s)`,'g'),(_,a,car,p)=>`${a}El objetivo hace una salvación de ${ABREV[car]}${p}`)
  .replace(new RegExp(`\\b(haces|hace|tú haces)\\s+(${CARS})\\s+CD\\s+(\\d+)`,'g'),(_,v,car,cd)=>`${v==='hace'?'hace':'haces'} una salvación de ${ABREV[car]} contra dificultad ${cd}`)
  .replace(new RegExp(`\\b(hace|haces|hacen)\\s+(${CARS})\\s+o\\b`,'g'),(_,v,car)=>`${v} una salvación de ${ABREV[car]} o`)
  .replace(new RegExp(`\\b(${CARS})\\s+CD\\s+(\\d+)`,'g'),(_,car,cd)=>`salvación de ${ABREV[car]} contra dificultad ${cd}`)
  .replace(new RegExp(`:\\s+(${CARS})\\s+o queda`,'g'),(_,car)=>`: salvación de ${ABREV[car]} o queda`)
  .replace(/^Ataque:\s/,'Tirada de ataque: ')
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
const ROTULOS={Límites:'Límites del efecto',Final:'Cuándo termina',Sube:'Al usar un grado mayor',Ablanda:'Lo que deja','En combate':'En combate','Fuera de combate':'Fuera de combate',Herramienta:'Herramienta'};
export function efectoHTML(texto){
 const partes=textoClaro(texto).split(/\s+(?=(?:Límites|Final|Sube|Ablanda|En combate|Fuera de combate|Herramienta):)/);
 return partes.map(p=>{const m=p.match(/^(Límites|Final|Sube|Ablanda|En combate|Fuera de combate|Herramienta):\s*(.*)$/s);return m?`<p><b>${ROTULOS[m[1]]}:</b> ${escTexto(m[2])}</p>`:`<p>${escTexto(p)}</p>`;}).join('');
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
/* ---------- 3.67 · «Qué es» y «Aspecto» (pedido del autor: Qué es / Aspecto / Qué hace / efectos al final) ---------- */
export const RAMA_NOMBRE={forma:'Forma',velo:'Velo',cuerpo:'Cuerpo',mirada:'Mirada',sello:'Sello',pacto:'Pacto',pulso:'Pulso',hilo:'Hilo',quietud:'Quietud',rastro:'Rastro',sangre:'Sangre',umbral:'Umbral',vasija:'Vasija'};
const ASPECTO_RAMA={
 forma:'El Verbe sale del cuerpo y toma forma visible: se condensa entre las manos o frente a la boca y se suelta de golpe.',
 velo:'Fuera no se ve nada: solo quien lo sufre percibe la ilusión. Quien ve el Verbe nota un temblor tenue en el aire, como el calor sobre un camino.',
 cuerpo:'El Verbe corre bajo la piel: las venas brillan un instante, el cuerpo humea y los golpes dejan una estela.',
 mirada:'Los ojos cambian: el iris se tiñe del color de tu Verbe y la pupila dibuja su marca mientras dura.',
 sello:'Trazos de tinta o de luz que se escriben en el aire, en el papel o en la piel, y se apagan al cumplirse.',
 pacto:'Un círculo de invocación se abre con humo y una marca de sangre; lo que llamas llega con su propia presencia.',
 pulso:'Una luz cálida y tenue en las manos; quien la recibe siente que el latido se le acompasa.',
 hilo:'Hilos finos que solo brillan al tensarse; tus herramientas zumban y se mueven como si tuvieran vida.',
 quietud:'Nada se mueve en ti; alrededor, el polvo se asienta, el aire pesa y lo vivo responde: hojas, piedra o agua acompañan el gesto.',
 rastro:'Los sentidos se afinan: la pupila se dilata, la respiración se vuelve lenta y medida, y el mundo se llena de huellas.',
 sangre:'Lo que corre por tus venas asoma: tu linaje deja su color y su forma en el Verbe.',
 umbral:'El espacio se pliega: un remolino, una puerta o un parpadeo donde el aire se dobla sobre sí mismo.',
 vasija:'Lo que llevas dentro asoma: un manto de Verbe con la forma de la bestia o del depósito que guardas.'
};
const ASPECTO_NAT={fuego:'Llamas anaranjadas y un calor que se nota a varios metros.',agua:'Agua que brota de la nada, fría y pesada.',viento:'Ráfagas que silban y cortan el aire.',tierra:'Piedra y polvo que se alzan del suelo.',rayo:'Chispas azules, olor a tormenta y un chasquido seco.',escarcha:'Escarcha que cruje y vaho blanco.',magma:'Roca fundida que brilla roja y humea.',vapor:'Vapor ardiente que silba.',ceniza:'Ceniza gris que flota y quema la garganta.',tormenta:'Nubes bajas, viento y relámpagos a la vez.',hierro:'Limaduras y filos de metal que obedecen.',corriente:'Agua cargada que chisporrotea.',destello:'Luz blanca que ciega por un instante.',arena:'Arena que corre como un río.',madera:'Madera viva que brota, cruje y se retuerce.',raiz:'Raíces que rompen el suelo.'};
const ASPECTO_DANO={fire:'Llamas y calor.',cold:'Frío y escarcha.',lightning:'Chispas y un chasquido seco.',thunder:'Un estampido que retumba.',acid:'Un líquido que humea y corroe.',poison:'Un vapor verdoso de olor amargo.',force:'Un golpe de Verbe puro, translúcido, que deforma el aire.',psychic:'Nada visible: el dolor está dentro de la cabeza.',necrotic:'Una sombra fría que apaga el color de lo que toca.',radiant:'Luz dorada que quema.',piercing:'Puntas y filos finos.',slashing:'Filos que cortan el aire.',bludgeoning:'Un impacto sordo y pesado.'};
const tiposDano=t=>Object.values(t.item?.system?.activities??{}).flatMap(a=>(a.damage?.parts??[]).flatMap(p=>Array.from(p.types??[])));
/** Para qué sirve una técnica (ataque, control, defensa…). Puro. */
export function funcionTecnica(t){
 const s=t.item?.system??{},acts=Object.values(s.activities??{});
 if(t.contra&&!t.sinChoque)return 'contratécnica';
 if(s.activation?.type==='reaction')return 'defensa';
 if(acts.some(a=>a.type==='heal')||/^cura/i.test(String(t.dmg??'')))return 'curación';
 if(acts.some(a=>a.type!=='heal'&&a.damage?.parts?.length))return acts.some(a=>a.type==='attack')?'ataque':'ataque con salvación';
 if(acts.some(a=>a.type==='save')||t.tir&&t.tir!=='ataque')return 'control';
 if(/te mueves|teletransport|\bvuelas\b|vuelo \d|vuelves a él/i.test(String(t.texto??'')))return 'movimiento';
 if(t.alc==='yo'&&s.duration?.units&&s.duration.units!=='inst')return 'refuerzo';
 return 'utilidad';
}
const FRASE_FUNCION={contratécnica:'una contratécnica: sirve para enfrentar otra técnica',defensa:'una defensa: se usa como reacción cuando algo te va a alcanzar',curación:'una curación',ataque:'un ataque: tiras contra la Clase de Armadura del objetivo',
 'ataque con salvación':'un ataque que el objetivo intenta evitar o resistir con una salvación',control:'un control: no busca el daño, sino dejar al objetivo en un estado o atarlo a una condición',movimiento:'un movimiento',refuerzo:'un refuerzo sobre ti',utilidad:'una utilidad: resuelve algo fuera de la pelea o la prepara'};
/** «Qué es»: una línea con rama, grado y función. Puro. */
export function queEsTexto(t){
 const rama=RAMA_NOMBRE[t.rama]??t.rama??'Verbe',f=funcionTecnica(t);
 const extra=[t.sinChoque?'No choca: no intercepta técnicas ni se la intercepta.':'',t.nivelMin?`Se aprende desde nivel ${t.nivelMin}.`:''].filter(Boolean).join(' ');
 return `Técnica de ${rama} de grado ${t.g}: ${FRASE_FUNCION[f]}.${extra?` ${extra}`:''}`;
}
const ASPECTO_FUNCION={ataque:'Va directa contra el objetivo: el golpe se ve llegar.','ataque con salvación':'Cae sobre el objetivo o la zona y obliga a apartarse a tiempo.',control:'Atrapa al objetivo y no lo suelta mientras dura.','curación':'Deja una calidez que cierra la piel.',defensa:'Se interpone delante de ti un instante.',refuerzo:'Se queda en tu cuerpo como un brillo leve mientras dura.',movimiento:'Te mueve y deja un rastro breve en el aire.',utilidad:'Apenas se nota: un temblor del aire y nada más.','contratécnica':'Choca contra el Verbe ajeno y lo deshace en chispas.'};
/** La forma del área en la escena (esfera = radio, como en D&D). Puro. */
export function formaArea(area){
 const m=String(area??'').match(/^(semiesfera|esfera|cono|línea|cubo|cilindro|muro|cuadrado|aura)\s+(.+)$/);if(!m)return null;
 const med=m[2].trim();
 return ({esfera:`Estalla en un círculo de ${med} de radio.`,semiesfera:`Se cierra como una cúpula de ${med}.`,cono:`Sale en abanico desde ti hasta ${med}.`,'línea':`Corre en línea recta: ${med}.`,cubo:`Llena un cubo de ${med} de lado.`,cilindro:`Se alza como una columna de ${med}.`,muro:`Se levanta como un muro de ${med}.`,cuadrado:`Cubre un cuadrado de ${med}.`,aura:`Te rodea como un aura de ${med}.`})[m[1]]??null;
}
/** Por dónde va cuando no tiene área. Puro. */
export function formaAlcance(alc,fn=''){
 if(alc==='yo')return ['ataque','ataque con salvación','control'].includes(fn)?'Sale de tu propio cuerpo, a quemarropa.':'Nace y se queda en tu cuerpo.';
 if(alc==='toque')return 'Pasa de tu mano al objetivo por contacto.';
 if(alc==='vista')return 'Llega hasta donde alcanza tu vista.';
 if(/^[\d.,]+\s*k?m$/.test(alc))return `Viaja hasta ${alc} de ti.`;
 return null;
}
/** «Aspecto»: cómo se ve al usarla (el de la ficha si lo tiene; si no, el de su rama y su elemento). Puro. */
export function aspectoTexto(t){
 if(t.aspecto)return t.aspecto;
 const partes=[ASPECTO_RAMA[t.rama]??'El Verbe se nota en el aire como una presión tibia.'];
 const nat=String(t.nat??'').split(':')[0];
 if(ASPECTO_NAT[nat])partes.push(ASPECTO_NAT[nat]);
 else{const d=tiposDano(t).find(x=>ASPECTO_DANO[x]);if(d&&t.rama!=='velo')partes.push(ASPECTO_DANO[d]);}
 // 3.74 (pedido del autor: «Aspecto propio por técnica»): su forma en la escena, lo que hace a la vista y su nombre.
 const fn=funcionTecnica(t),area=formaArea(t.area),forma=area??formaAlcance(String(t.alc??''),fn);if(forma)partes.push(forma);
 const f=ASPECTO_FUNCION[fn];if(f&&!(area&&['refuerzo','utilidad'].includes(fn)))partes.push(f);
 if(t.n)partes.push(`Se la reconoce por lo que dice su nombre: «${t.n}».`);
 const c=String(t.comp??'');
 if(/G/.test(c))partes.push(/V/.test(c)?'Se forma con sellos de manos y una palabra en voz alta.':'Se forma con sellos de manos.');
 else if(/V/.test(c))partes.push('Se dice en voz alta.');
 return partes.join(' ');
}
const DANO_ES={fire:'fuego',cold:'frío',lightning:'relámpago',thunder:'trueno',acid:'ácido',poison:'veneno',force:'fuerza',psychic:'psíquico',necrotic:'necrótico',radiant:'radiante',piercing:'perforante',slashing:'cortante',bludgeoning:'contundente'};
/** Filas de «Cómo se usa» con la tirada, el área y el daño o la curación (los efectos de mesa, al final). Puro. */
export function datosMesaHTML(t){
 const filas=[];
 if(t.area)filas.push(['Área',t.area]);
 if(t.tir)filas.push(['Tirada',t.tir==='ataque'?`Ataque${t.veces>1?` (${t.veces} ataques)`:''}`:`Salvación de ${textoClaro(t.tir)}${t.dmg&&t.mitad?', mitad del daño si la supera':''}`]);
 if(t.dmg){const d=String(t.dmg),cura=/^cura/i.test(d),tipo=!cura&&!/[a-záéíóú]{4,}/i.test(d.replace(/\d+d\d+/g,''))?[...new Set(tiposDano(t).map(x=>DANO_ES[x]).filter(Boolean))].join(' o '):'';
  filas.push([cura?'Curación':'Daño',`${cura?d.replace(/^cura\s*/i,''):d}${tipo?` ${tipo}`:''}`.replace(/\bmod\b/,'modificador')]);}
 return filas.map(([k,v])=>`<div><dt>${escTexto(k)}</dt><dd>${escTexto(v)}</dd></div>`).join('');
}
export function fichaLecturaHTML(t){
 const m=t.item?.flags?.['ecos-frontera']?.verbe??{};
 return `<div class="ev-lectura"><h3>Qué es</h3><p>${escTexto(queEsTexto(t))}</p><h3>Aspecto</h3><p>${escTexto(aspectoTexto(t))}</p><h3>Qué hace</h3>${efectoHTML(t.textoJ??t.texto)}<h3>Cómo se usa</h3><dl class="ev-lectura-datos"><div><dt>Tiempo</dt><dd>${escTexto(tiempoTexto(t.t))}</dd></div><div><dt>Alcance</dt><dd>${escTexto(({yo:'Sobre ti',toque:'Al tocar al objetivo'})[t.alc]??t.alc??'Consulta el efecto')}</dd></div><div><dt>Duración</dt><dd>${escTexto(duracionTexto(t))}</dd></div>${datosMesaHTML(t)}</dl><p>${escTexto(resolucionTexto(t))}</p><h3>Qué cuesta</h3><p><b>Aprender:</b> ${t.incl?"Se recibe con su etapa de Mirada; no se compra por separado.":`${t.trazos} Trazo${Number(t.trazos)===1?"":"s"} una sola vez.`} <b>Usar:</b> el panel muestra el coste de Verbe ajustado a tu personaje y al grado elegido. Elegir «Aprender» no activa la técnica.</p>${t.g>=6?'<p>Esta técnica tiene un uso por Descanso Largo y también consume un uso del grupo de poderes altos que le corresponde. Un corto no lo devuelve.</p>':''}${m.familiaUso?'<p>Comparte un uso por Descanso Largo con las variantes de su misma familia.</p>':''}${m.ritual?'<p><b>Ritual:</b> resuelve los preparativos y pide al DM permiso para esta activación. El descanso no devuelve ese permiso.</p>':''}<details><summary>Datos de referencia y mejoras</summary><p>Grado ${t.g}. ${t.sube?`${t.sube==='truco'?'Sus dados aumentan en los niveles 5, 11 y 17.':`Al elegir un grado mayor añade ${escTexto(t.sube)} por grado adicional; el panel limita qué grados puedes elegir.`}`:'Elevar el grado no añade un escalado de dados si la ficha no lo indica.'} Los dados que añaden tus mejoras se calculan en la actividad; no los sumes otra vez por leer el texto base.</p>${(t.prog??[]).map(p=>`<p>${escTexto(textoClaro(p))}</p>`).join('')}${referenciaHTML(t)}</details></div>`;
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
