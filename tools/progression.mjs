/** Construcciones reproducibles: se compran con las funciones reales, no con costes duplicados. */
import fs from 'node:fs';
import { MockActor, resetEnvironment } from '../tests/helpers/foundry.mjs';
import { readCatalog } from './catalog.mjs';
import * as V from '../scripts/verbe.js';
const D=readCatalog();
const metas={1:'Aprendiz de academia',5:'Operador de campo',11:'Maestro de élite',16:'Fundador de una tradición',18:'Señor de una era',20:'Escala trascendente'};
const lines=['# Calibración de la progresión 3.1','',
  'Los títulos de Nimerios son objetivos de escala de la campaña; no son rangos oficiales de D&D. Los Trazos compran amplitud y especialización. El nivel, los grados, las acciones, las dotes y los dones de historia determinan qué se puede hacer realmente.','',
  '**Decisión:** conservar `4 × nivel + 4` Trazos. Ya permite especialización fuerte sin comprarlo todo. A nivel 1 es un presupuesto holgado para un estudiante: las técnicas de grado 0–1 y el acceso a una primera naturaleza contienen su potencia, pero puede tener más recursos que un principiante de la serie. Para recrear a un alumno muy verde, el DM debe limitar lo enseñado en la historia; subir o bajar toda la moneda no reproduce por sí solo a un personaje concreto.','',
  '**Escalas de obtención:** grado 6 desde nivel 11 y Maestría de su senda; grado 8 desde 16; grado 9 desde 18 y Leyenda; grado 10 desde 19 y Ascensión mítica; grado 11 desde 20 y Ascensión trascendente. Las dos ascensiones exigen pruebas de historia concedidas por el DM. Los rangos y el aprendizaje siguen teniendo costes separados.', '',
  'Construcción de control: Forma principal gratis en Entrenado, Fuego, sin linaje, regalos, Monedas ni Trazos extra. Compra el rango máximo permitido; afinidad Entrenada desde 5/Maestra desde 11; competencia en Control y pericia desde 5. Después compra la técnica de Fuego más alta que permite su nivel, junto con sus técnicas previas. A nivel 20 elige Forma última como firma trascendente en vez de comprar también toda la cadena elemental superior; su senda y ascensiones se pagan con los mismos Trazos, sin regalos. Se asume un maestro disponible cuando el requisito narrativo lo exige. No es una búsqueda de la construcción óptima ni una simulación de combate.','',
  '| Nivel | Referencia de campaña | Trazos totales | Grado permitido | Rango | Rangos + afinidad + Control + senda | Repertorio de prueba | Gastado total | Libres |',
  '|---:|---|---:|---:|---|---:|---|---:|---:|'];
for(const level of [1,5,11,16,18,20]) {
  resetEnvironment();V.usarDatos(D,'activo');
  const a=new MockActor(level,{nats:['fuego'],principal:'forma',rangos:{forma:1},ordenRamas:['forma']});
  const rank=D.rangos.findLastIndex(r=>r.nivel<=level);
  while(V.rangoDe(a,'forma')<rank)await V.subirRango(a,'forma');
  if(level>=5)await V.subirAfinidad(a,'fuego',{aprobado:true});
  if(level>=11)await V.subirAfinidad(a,'fuego',{aprobado:true});
  await V.comprarControl(a);if(level>=5)await V.comprarControl(a);
  for(let i=1;i<=4;i++)if(level>=[3,7,11,18][i-1])await V.comprarDote(a,`senda-forma-${i}`);
  if(level>=19){await V.concederShinobi(a,'hito','prueba-mitica');await V.comprarDote(a,'ascension-mitica');}
  if(level>=20){await V.concederShinobi(a,'hito','prueba-trascendente');await V.comprarDote(a,'ascension-trascendente');}
  const herramientas=V.trazos(a).gastados,nombres=[];
  const aprenderCamino=async(t,visitadas=new Set())=>{
    if(!t || V.conoce(a,t.id))return;
    if(visitadas.has(t.id))throw Error('Requisito circular');visitadas.add(t.id);
    const previa=D.tecnicas.find(p=>p.n===t.req);if(previa)await aprenderCamino(previa,visitadas);
    if(await V.aprender(a,t,{aprobado:true,instantaneo:true})!==true)throw Error(`No se pudo comprar ${t.id}`);
    nombres.push(`${t.n} (${t.g})`);
  };
  const tope=V.gradoUsable(a,{rama:'forma',g:0});
  const objetivo=D.tecnicas.filter(t=>t.rama==='forma'&&t.nat==='fuego'&&t.g<=tope).sort((a,b)=>b.g-a.g)[0];
  if(level===20)await aprenderCamino(D.tecnicas.find(t=>t.n==='Forma última'));
  else await aprenderCamino(objetivo);
  const presupuesto=V.trazos(a);
  lines.push(`| ${level} | ${metas[level]} | ${presupuesto.total} | ${V.gradoUsable(a,{rama:'forma',g:0})} | ${D.rangos[rank].nombre} | ${herramientas} | ${nombres.join(', ')} | ${presupuesto.gastados} | ${presupuesto.libres} |`);
}
lines.push('','## Qué concluye y qué queda por medir','',
  '- El nivel 5 puede concentrarse en grado 3; el 11 en 6; el 16 en 8; el 18 en 9; el 20 en 11. No todas las naturalezas tienen una técnica en todos los grados. Poder acceder a un grado no significa recibir gratis una técnica de ese grado.',
  '- A nivel 20, llevar la principal de Entrenado a Mítico cuesta 22 Trazos; otra rama desde Novato a Mítico cuesta 27 antes de recargos de tercera rama o sangre. Dos afinidades Maestras cuestan 12, competencia y pericia en Control 5. Eso consume 66 de los 84 antes del repertorio, las dotes y el cultivo: hay decisiones reales.',
  '- Una técnica ofensiva de bajo grado puede ganar dados por rango, afinidad y cultivo. El nuevo cultivo cobra más por dados, CD, rapidez y ahorro de energía, y limita repeticiones; no debe compararse solo el daño base de una técnica nueva con una antigua muy entrenada.',
  '- Grados 6 o más siguen limitados a una oportunidad por técnica y largo. Cortos no los renuevan. Ahora también consumen un presupuesto compartido: cambiar de técnica o rama no lo renueva.',
  '- Emular a Madara, Naruto o Sasuke requiere decidir qué dones de sangre, transformaciones, capacidades oculares y recursos excepcionales existen en Nimerios. No están garantizados por tener 76 u 84 Trazos. No se han añadido poderes nuevos de historia para forzar esa equivalencia.',
  '- Esta revisión verifica costes y accesos. El balance de daño, curación, control y economía de acciones con clases y módulos de la mesa necesita observación en Foundry. No se declara balance perfecto del catálogo.','');
fs.writeFileSync(new URL('../docs/PROGRESION_3.1.md',import.meta.url),lines.join('\n'));
console.log('Calibración de niveles 1, 5, 11, 16, 18 y 20 generada con compras reales.');
