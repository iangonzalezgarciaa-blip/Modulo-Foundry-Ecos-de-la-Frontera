/** Construcciones reproducibles: se compran con las funciones reales, no con costes duplicados. */
import fs from 'node:fs';
import { MockActor, resetEnvironment } from '../tests/helpers/foundry.mjs';
import { readCatalog } from './catalog.mjs';
import * as V from '../scripts/verbe.js';
const D=readCatalog();
const metas={1:'Estudiante de academia',5:'Chunin',11:'Jonin de élite',16:'Sannin',18:'Madara (referencia de campaña)',20:'Escala de Seis Caminos'};
const lines=['# Calibración de la progresión 2.10','',
  'Las referencias a Naruto son objetivos de escala elegidos por el autor para esta campaña; no son equivalencias oficiales entre un rango de la serie y un nivel de D&D. Los Trazos compran amplitud y especialización. El nivel, los grados, las acciones, las dotes y los dones de historia determinan qué se puede hacer realmente.','',
  '**Decisión:** conservar `4 × nivel + 4` Trazos. Ya permite especialización fuerte sin comprarlo todo. A nivel 1 es un presupuesto holgado para un estudiante: las técnicas de grado 0–1 y el acceso a una primera naturaleza contienen su potencia, pero puede tener más recursos que un principiante de la serie. Para recrear a un alumno muy verde, el DM debe limitar lo enseñado en la historia; subir o bajar toda la moneda no reproduce por sí solo a un personaje concreto.','',
  '**Corrección del atasco de grados:** Maestro permite hasta grado 8 (antes 7), siempre sujeto al nivel: grado 6 al 11, 7 al 13, 8 al 15. No cambia sus dones, su precio ni su nivel mínimo. Legendario sigue desde 17 para grado 9, y Mítico desde 19 para 10–11; el grado 11 sigue exigiendo nivel 20. Esto permite que el nivel 16 acceda realmente a grado 8.','',
  'Construcción de control: Forma principal gratis en Entrenado, Fuego, sin linaje, regalos, Monedas ni Trazos extra. Compra el rango máximo permitido; afinidad Entrenada desde 5/Maestra desde 11; competencia en Control y pericia desde 5. Después compra la técnica de Fuego más alta que permite su nivel, junto con sus técnicas previas. A nivel 20 añade Forma última. Se asume un maestro disponible cuando el requisito narrativo lo exige. No es una búsqueda de la construcción óptima ni una simulación de combate.','',
  '| Nivel | Referencia de campaña | Trazos totales | Grado permitido | Rango | Rangos + afinidad + Control | Repertorio de prueba | Gastado total | Libres |',
  '|---:|---|---:|---:|---|---:|---|---:|---:|'];
for(const level of [1,5,11,16,18,20]) {
  resetEnvironment();V.usarDatos(D,'activo');
  const a=new MockActor(level,{nats:['fuego'],principal:'forma',rangos:{forma:1},ordenRamas:['forma']});
  const rank=D.rangos.findLastIndex(r=>r.nivel<=level);
  while(V.rangoDe(a,'forma')<rank)await V.subirRango(a,'forma');
  if(level>=5)await V.subirAfinidad(a,'fuego',{aprobado:true});
  if(level>=11)await V.subirAfinidad(a,'fuego',{aprobado:true});
  await V.comprarControl(a);if(level>=5)await V.comprarControl(a);
  const herramientas=V.trazos(a).gastados,nombres=[];
  const aprenderCamino=async(t,visitadas=new Set())=>{
    if(!t || V.conoce(a,t.id))return;
    if(visitadas.has(t.id))throw Error('Requisito circular');visitadas.add(t.id);
    const previa=D.tecnicas.find(p=>p.n===t.req);if(previa)await aprenderCamino(previa,visitadas);
    if(await V.aprender(a,t,{aprobado:true})!==true)throw Error(`No se pudo comprar ${t.id}`);
    nombres.push(`${t.n} (${t.g})`);
  };
  const tope=V.gradoUsable(a,{rama:'forma',g:0});
  const objetivo=D.tecnicas.filter(t=>t.rama==='forma'&&t.nat==='fuego'&&t.g<=tope).sort((a,b)=>b.g-a.g)[0];
  await aprenderCamino(objetivo);
  if(level===20)await aprenderCamino(D.tecnicas.find(t=>t.n==='Forma última'));
  const presupuesto=V.trazos(a);
  lines.push(`| ${level} | ${metas[level]} | ${presupuesto.total} | ${V.gradoUsable(a,{rama:'forma',g:0})} | ${D.rangos[rank].nombre} | ${herramientas} | ${nombres.join(', ')} | ${presupuesto.gastados} | ${presupuesto.libres} |`);
}
lines.push('','## Qué concluye y qué queda por medir','',
  '- El nivel 5 puede concentrarse en grado 3; el 11 en 6; el 16 en 8; el 18 en 9; el 20 en 11. No todas las naturalezas tienen una técnica en todos los grados. Poder acceder a un grado no significa recibir gratis una técnica de ese grado.',
  '- A nivel 20, llevar la principal de Entrenado a Mítico cuesta 22 Trazos; otra rama desde Novato a Mítico cuesta 27 antes de recargos de tercera rama o sangre. Dos afinidades Maestras cuestan 12, competencia y pericia en Control 5. Eso consume 66 de los 84 antes del repertorio, las dotes y el cultivo: hay decisiones reales.',
  '- Una técnica ofensiva de bajo grado puede ganar dados por rango, afinidad y cultivo. El nuevo cultivo cobra más por dados, CD, rapidez y ahorro de energía, y limita repeticiones; no debe compararse solo el daño base de una técnica nueva con una antigua muy entrenada.',
  '- Grados 6 o más siguen limitados a una oportunidad por técnica y largo. Cortos no los renuevan. El DM debe evitar una colección excesiva de técnicas altas equivalentes que convierta ese límite individual en muchos usos del mismo efecto.',
  '- Emular a Madara, Naruto o Sasuke requiere decidir qué dones de sangre, transformaciones, capacidades oculares y recursos excepcionales existen en Nimerios. No están garantizados por tener 76 u 84 Trazos. No se han añadido poderes nuevos de historia para forzar esa equivalencia.',
  '- Esta revisión verifica costes y accesos. El balance de daño, curación, control y economía de acciones con clases y módulos de la mesa necesita observación en Foundry. No se declara balance perfecto del catálogo.','');
fs.writeFileSync(new URL('../docs/PROGRESION_2.10.md',import.meta.url),lines.join('\n'));
console.log('Calibración de niveles 1, 5, 11, 16, 18 y 20 generada con compras reales.');
