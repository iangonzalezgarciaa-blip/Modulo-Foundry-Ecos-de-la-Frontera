/** Recorre todo el catálogo en niveles 1–20. No sustituye las tiradas ni el motor de Foundry. */
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {readCatalog,validateCatalog} from './catalog.mjs';
import {MockActor,resetEnvironment} from '../tests/helpers/foundry.mjs';
import {limiteDadosExtra,pisoCosto,maximoPorNivel,cuotasPoder} from '../scripts/verbe-progression.js';
import * as V from '../scripts/verbe.js';
const D=readCatalog(),filas=[],chequeos={fichas:0,actividades:0};
assert.deepEqual(validateCatalog(D),[]);
for(let nivel=1;nivel<=20;nivel++)for(const cargado of [false,true]){
 resetEnvironment();V.usarDatos(D,'activo');
 const rango=D.rangos.findLastIndex(r=>r.nivel<=nivel),a=new MockActor(nivel,{progresionVersion:1,principal:'forma',nats:['fuego','agua'],rangos:Object.fromEntries(D.ramas.map(r=>[r.id,rango])),dotes:cargado?D.dotes.map(d=>d.id):[],afinidad:{fuego:3,agua:3},hitosShinobi:D.hitosShinobi.map(h=>h.id),miradas:{aster:5},linaje:'ignis',fuerza:'plena'});
 let peor={media:0,id:'—'},minCosto=Infinity;
 for(const t of D.tecnicas){
  const m=t.item.flags['ecos-frontera'].verbe;
  if(cargado)V.estado(a).cultivos[t.id]={nivel:3,mejoras:['dado','dado','dado','verbe','verbe','cd','cd','area','area']};
  const data=V.datosItem(a,t),extra=V.dadosExtra(a,m),costo=V.costoUso(a,m,t.g),tope=V.gradoUsable(a,m);
  assert.ok(extra<=limiteDadosExtra(t.g)&&extra>=0,t.id);assert.ok(Number.isSafeInteger(costo)&&costo>=pisoCosto(t.g,D.costo),t.id);
  assert.ok(tope<=maximoPorNivel(nivel),t.id);if(/^\+\d+d\d+$/.test(m.sube??''))assert.ok(tope<=t.g+5,t.id);
  let media=0;
  for(const ac of Object.values(data.system.activities)){
   chequeos.actividades++;
   for(const p of [ac.healing,...(ac.damage?.parts??[])].filter(Boolean)){
    if(p.custom?.enabled)assert.ok(typeof p.custom.formula==='string'&&p.custom.formula.length>0&&!p.custom.formula.includes('NaN'),t.id);
    else{assert.ok(Number.isFinite(p.number)&&p.number>=0,t.id);const n=p.number+(t.g===0?Math.floor((nivel+1)/6)*(Number(p.scaling?.number)||0):0);media+=n*(p.denomination+1)/2;}
   }
  }
  if(t.g<=maximoPorNivel(nivel)&&media>peor.media)peor={media,id:t.id};
  if(t.g>=6)minCosto=Math.min(minCosto,costo);
  chequeos.fichas++;
 }
 filas.push({nivel,cargado,peor,minCosto});
}
const out=['# Auditoría de catálogo y escalado · 3.1','',
 `Revisión automática de **${D.tecnicas.length} técnicas y ${D.dotes.length} dotes**: ${chequeos.fichas} fichas preparadas y ${chequeos.actividades} actividades, con veinte niveles y dos perfiles. Requisitos referenciados, costes, cotas de dados, elevación, JSON e importaciones se validan junto a las pruebas de integración.`, '',
 '**Alcance:** el perfil normal usa el rango permitido por nivel, sin dotes; el perfil de tensión entrega todas las dotes y nueve mejoras simultáneas por técnica, una combinación de cultivo deliberadamente superior a la legal. Sirve para comprobar que incluso datos antiguos excesivos respetan los topes. No es una construcción comprable ni una simulación de combate. La tabla usa técnicas cuyo grado cabe por nivel, aunque otros requisitos de sangre, historia, senda o contrato puedan impedir usarlas.','',
 'La media muestra solo dados de daño o curación, sin impacto, salvaciones, blancos de área, bonos planos o resistencias. Para grado 0 incorpora la progresión nativa de dnd5e a niveles 5, 11 y 17; no duplica esa progresión en los datos del objeto.','',
 '| Nivel | Perfil | Mayor media de dados | Técnica de referencia | Mínimo de coste entre grados 6–11 |','|---:|---|---:|---|---:|',
 ...filas.filter(f=>[1,5,11,16,18,19,20].includes(f.nivel)).map(f=>`| ${f.nivel} | ${f.cargado?'Tensión':'Normal'} | ${f.peor.media.toFixed(1)} | ${f.peor.id} | ${f.minCosto} |`),'',
 '## Cambios tras la auditoría','',
 '- **Obtención:** sendas en cuatro etapas para las trece ramas. Maestría permite nuevos aprendizajes de grado 6–8; Leyenda, grado 9; ascensiones de historia, grado 10–11. Los requisitos también se vuelven a comprobar al usar los poderes nuevos: devolver las dotes después de aprender no permite conservar su acceso.','',
 '- **Escalado:** base +3 como máximo, +1 con Escalado profundo y +1 en Forma con Forma precisa. Solo técnicas con escalado numérico. No se añaden facultades, área, blancos o efectos por elevar. El máximo sigue sujeto a nivel, rango y senda.','',
 '- **Bonificaciones:** como máximo `mínimo(6, grado base + 1)` dados adicionales; grado 0, uno. CD adicional de cultivo/dotes registrada por el adaptador, máximo +2. Las dotes que solo mejoran CD no mejoran ataques. Los bonos de curación múltiples se dividen entre sus receptores.','',
 '- **Costes:** mínimo de la mitad del coste tabulado, redondeado arriba, en grado 1–5; del 70 % en 6–11. Técnica de reserva mantiene su excepción diaria a grado base. No hay reserva gratuita para grados altos.','',
 '- **Recursos:** cupos compartidos y una sola técnica de grado 11 por largo. Se mantienen además los usos individuales y de familia. La recuperación de dotes, respiración y pausas consume el presupuesto breve; un corto no renueva esos poderes diarios.','',
 '- **Acciones:** máximo dos técnicas con acción/AA y una de grado 6 o más por turno. Las reacciones y la única acción de formación de réplicas conservan su control separado. Esto pone un techo común a combinaciones de dotes, sin otorgar por sí solo acciones adicionales.','',
 '- **Concentración:** Dos hilos permite dos, con al menos una de grado ≤3 hasta nivel 16 y ≤5 después. No admite dos modos altos simultáneos ni una tercera Concentración. Los efectos propios se ligan a la concentración de su técnica, no a otra anterior.','',
 '- **Rituales:** el cultivo de rapidez no los convierte en acciones; la duración de efectos propios se sincroniza con la técnica cuando corresponde. Alcance máximo entrenado: triple del base y hasta 1500 m; área, doble del tamaño base.','',
 '- **Formas compuestas:** Mil brazos y el modo combinado conservan las claves de modo que necesitan sus continuaciones, sin acumular automáticamente todos los bonos de la forma anterior. Corona exige el avatar de Mil brazos activo. Renovación del centenar consume su depósito, de al menos 16 Verbe; no permite regenerar con un único punto y recuperar a la vez toda la batería.','',
 '## Cupos por Descanso Largo','',
 '| Nivel | Mayores 6–8 | Culminaciones 9–11 | Grado 11 dentro de las culminaciones |','|---:|---:|---:|---:|',
 ...[1,5,11,13,16,18,19,20].map(n=>{const q=cuotasPoder(n);return `| ${n} | ${q.mayores} | ${q.culminaciones} | ${q.trascendentes} |`;}),'',
 'Una Leyenda activa añade un uso de mayores; varias Leyendas no acumulan ese extra. Abrir Cerrojos conserva sus propios costes de PG y Agotamiento y no concede una técnica o acción adicional.','',
 '## Personajes existentes y límites prácticos','',
 'La migración conserva compras y técnicas altas ya conocidas como legadas, sin cobrarles retrospectivamente una senda. Siguen sujetas al nivel y los nuevos cupos; los usos altos gastados antes de actualizar se incorporan al contador. Los nuevos aprendizajes y elevaciones altas necesitan sus accesos. Deshacer una técnica o rehacer el personaje elimina su excepción legada cuando ya no conserva el objeto. No se reponen recursos por actualizar, rearmar o devolver una dote.','',
 'El DM puede reorientar el último cultivo registrado de una técnica sin nuevo cargo, conservando nivel y Trazos. Ayuda a adaptar inversiones antiguas que ahora alcanzan un tope. Las dotes con resolución de mesa se identifican; no se afirma automatización de cada frase del catálogo.','',
 'Las comprobaciones numéricas y las pruebas simuladas no prueban igualdad entre todas las clases, daño real de una campaña, interacciones de midi-qol/DAE ni legibilidad visual dentro del Foundry instalado. Hace falta observar partidas de distintos niveles.','',
 'Fuente técnica de contraste: [dnd5e 5.2.5](https://github.com/foundryvtt/dnd5e/tree/release-5.2.5), modelos de dotes, actividades, escalado y Concentración.',''];
fs.writeFileSync(new URL('../docs/AUDITORIA_3.1.md',import.meta.url),out.join('\n'));
console.log(JSON.stringify(chequeos));
