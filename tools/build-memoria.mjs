/** Relatos de Nimerios propuestos para adopción del autor; no retcon ni poderes nuevos. */
import fs from 'node:fs';
import {readCatalog,writeCatalog,decodeCatalog,encodeCatalog} from './catalog.mjs';
import {intencionesTecnica} from '../scripts/mesa-intenciones.js';
import {huellaTexto,escTexto} from '../scripts/verbe-reading.js';
const D=readCatalog(),url=new URL('../data/reliquias.txt',import.meta.url),R=decodeCatalog(fs.readFileSync(url,'utf8'));
const escuelas={
 forma:['Los Talleres del Cauce','Los primeros formadores aprendieron a construir figuras útiles para cruzar, transportar y proteger. Cada forma enseña a reconocer cuánto sostén necesita una obra y cuándo debe deshacerse.'],
 velo:['La Casa de los Relatos Dobles','Artistas, mediadores y guardianes de rutas desarrollaron un lenguaje de imágenes compartidas. Su disputa más antigua trata sobre el consentimiento: una ilusión puede enseñar o imponer una versión del mundo.'],
 cuerpo:['Los Patios del Aliento','Sus maestros conservan secuencias de trabajo, rescate y combate. Consideran que una hazaña que destruye a su practicante debe recordarse con su coste, no celebrarse como entrenamiento ordinario.'],
 mirada:['Los Archivos de la Vigilia','Las facultades de percepción se enseñan mediante diarios de observación y contrastes entre testigos. Ver un flujo no equivale a conocer su historia, y registrar una técnica no concede su herencia.'],
 sello:['Las Casas del Umbral Escrito','Los selladores surgieron alrededor de almacenes, acuerdos y refugios. Un signo necesita responsable, soporte y propósito; un cierre sin registro puede convertirse en una deuda para generaciones posteriores.'],
 pacto:['Los Círculos de Reciprocidad','Cada contrato comienza con una necesidad compartida y una obligación concreta. Las entidades conservan intereses propios: su ayuda no las convierte en herramientas sin voluntad.'],
 pulso:['Las Manos del Camino','Curadores de poblados y caravanas reúnen historias de pacientes para aprender sin repetir daños. Enseñan a distinguir alivio, estabilización y curación, y a contar también el material y tiempo que exige un cuidado.'],
 hilo:['Las Cooperativas de la Hebra','Tejedores, constructores y operadores de mecanismos comparten técnicas de tensión y reparto de cargas. Su enseñanza central es reconocer qué sostiene cada hilo antes de cortarlo o exigirle más.'],
 quietud:['Los Hogares de la Pausa','La Quietud se transmite en huertos, guardias y talleres tanto como en santuarios. Sus prácticas ayudan a coordinar atención y entorno; no sustituyen sueño, alimento o recuperación.'],
 rastro:['Los Cuadernos del Horizonte','Guías y observadores comparan huellas con estaciones, relatos y cambios del terreno. Una pista indica una posibilidad; sus mejores maestros anotan también lo que todavía ignoran.'],
 sangre:['Los Custodios de la Herencia','Las comunidades registran dones, obligaciones y despertares sin confundir parentesco con mérito o obediencia. Los relatos de los Primeros requieren prudencia y no autorizan a resolver sus destinos por una técnica.'],
 umbral:['Los Medidores del Paso','Esta tradición creció al transportar heridos y suministros por caminos difíciles. Cada traslado conserva un origen, un destino y un límite: abrir un paso también exige saber cómo regresar.'],
 vasija:['Las Mesas del Vínculo','Huéspedes y entidades acordaron espacios donde hablar sin exhibir poder. Sus relatos tratan de memoria compartida, desacuerdos y confianza ganada; un manto no borra la voluntad de ninguno.']
};
const entradas=[];const poner=(id,tipo,nombre,publico,dm,estado='propuesta',relaciones=[])=>entradas.push({id,tipo,nombre,publico,dm,estado,relaciones});
for(const r of D.ramas){const [escuela,relato]=escuelas[r.id];poner('rama:'+r.id,'Ramas',r.nombre,`${escuela}. ${relato}`,'Propuesta de tradición para campañas en cualquier región de Nimerios. El autor decide nombres locales, miembros y relación con sus diarios.',undefined,[]);}
for(const t of D.tecnicas)t.intenciones=intencionesTecnica(t);
const temperamentos=[
 ['shukaku','Dunavar','paciencia y territorio','recuperar un refugio perdido','Promete seguridad si se respeta el lugar que considera hogar. Confunde con facilidad protección y encierro.'],
 ['matatabi','Velisca','curiosidad y memoria de los hogares','preservar una historia antes de que desaparezca','Se interesa por objetos cotidianos y por las voces de quienes los usaron. Exige que el huésped escuche antes de quemar.'],
 ['isobu','Torvaneo','reserva y lealtad lenta','mantener una promesa hecha en una costa olvidada','Guarda silencios deliberados. Su confianza se gana regresando cuando sería más fácil abandonar.'],
 ['son-goku','Brontaro','orgullo y creación','enseñar una obra que sobreviva a su fuerza','Valora manos capaces de construir después del combate. Rechaza que su poder se use como demostración vacía.'],
 ['kokuo','Auralmo','disciplina y libertad','recorrer una ruta que nunca pudo terminar','Negocia límites claros antes de compartir impulso. Teme que un pacto se transforme en una jaula.'],
 ['saiken','Nebruso','humor y adaptación','recuperar una memoria dispersa','Prueba pequeñas soluciones antes de recurrir a una descarga. Sus bromas esconden miedo a perder su identidad.'],
 ['chomei','Luminara','asombro y comunidad','reunir voces separadas por un conflicto','Celebra la coordinación y el regreso de los ausentes. Desconfía de quien confunde obediencia con acuerdo.'],
 ['gyuki','Marebravo','franqueza y responsabilidad','reparar una deuda contraída por otro huésped','Acepta el desacuerdo declarado. Castiga narrativamente el engaño del pacto, sin imponer penalizaciones mecánicas nuevas.'],
 ['kurama','Aurenox','independencia y memoria de agravios','decidir por primera vez qué merece proteger','No entrega confianza por parentesco. Un vínculo cooperativo surge de decisiones repetidas que respetan ambas voluntades.'],
 ['juubi','Velkarion','extrañeza y fragmentación','comprender si sus recuerdos pertenecen a una sola entidad','No es una mejora automática de los otros vínculos. Su presencia exige una trama propia y autorizaciones de historia.'],
 ['sora','Eco residual','identidad incompleta','distinguir una voz propia de recuerdos prestados','El huésped recibe impresiones parciales. Ningún residuo concede por sí solo una entidad completa o sus facultades.']
];
for(const[id,nombre,caracter,objetivo,gancho]of temperamentos)poner('bestia:'+id,'Entidades vinculadas',nombre,`Se le atribuyen ${caracter}. Su deseo conocido es ${objetivo}.`,gancho,undefined,['rama:vasija','rama:pacto']);
for(const d of D.panteon)poner('deidad:'+d.id,'Panteón',d.nombre,`Clasificación de campaña: ${d.jerarquia}. ${d.propuesto?'Entrada propuesta para revisión del autor.':'Entrada del panteón de la campaña.'}`,d.texto??'Consulta los diarios de lore del autor antes de revelar su historia.',d.propuesto?'propuesta':'referencia',['rama:sangre']);
const ramasDe=(campo,id)=>{const mapa=new Map();for(const t of D.tecnicas)if(t.acceso?.[campo]===id)mapa.set(t.rama,(mapa.get(t.rama)??0)+1);return [...mapa].sort((a,b)=>b[1]-a[1]).slice(0,3).map(([r])=>'rama:'+r);};
for(const t of D.tradicionesShinobi)poner('tradicion:'+t.id,'Tradiciones',t.nombre,`Una escuela de ${t.nombre.toLowerCase()} conserva sus enseñanzas mediante cuadernos de práctica y acuerdos entre aprendices. Su uso cotidiano se considera parte del aprendizaje.`,`Elige una comunidad que necesite esta tradición, una persona que la enseñe y una obligación que permita aprenderla. La concesión del DM y sus requisitos mecánicos se conservan.`,undefined,ramasDe('tradicion',t.id));
for(const a of D.artefactosShinobi)poner('artefacto:'+a.id,'Artefactos del Verbe',a.nombre,`${a.nombre} aparece en relatos de una custodia transmitida entre viajeros. Cada portador añade al registro una decisión que tomó al negarse a usarlo.`,`Propuesta: sus custodios buscan recuperar una página del registro. La voluntad, adquisición y conservación pertenecen a la historia; el objeto conserva exactamente sus requisitos y técnicas.`,undefined,ramasDe('artefacto',a.id));
const lugares=['un taller abandonado al cambiar una ruta','un refugio que sobrevivió a una crecida','un archivo rescatado de una galería hundida','un puerto cuyo nombre cambió con sus habitantes','un observatorio que dejó de recibir aprendices','una posta donde se reunían comunidades rivales','un almacén mantenido por generaciones de cuidadores','una expedición que regresó sin su cartógrafo'];
const memorias=['un registro de reparaciones hecho por manos diferentes','una marca de inventario anterior a su nombre actual','una instrucción de uso deliberadamente incompleta','una dedicatoria que no nombra a su destinatario','un croquis de una ruta que sigue existiendo','una canción que describe su cuidado','un contrato que diferencia propiedad y custodia','una lista de personas a las que ayudó','una advertencia acerca de su límite'];
for(let i=0;i<R.reliquias.length;i++){
 const r=R.reliquias[i],publico=`La tradición de ${r.nombre} sitúa su hallazgo en ${lugares[i%lugares.length]}. Conserva ${memorias[Math.floor(i/lugares.length)%memorias.length]}.`,dm=`Propuesta de historia: una comunidad necesita recuperar el registro o decidir quién debe custodiar ${r.nombre}. Su utilidad conserva las cifras, usos y permisos de la ficha; el relato no concede poderes adicionales.`;
 r.relatoNimerios={publico,dm,estado:'propuesta'};poner('reliquia:'+r.id,'Reliquias',r.nombre,publico,dm,undefined,['rama:rastro','rama:sello']);
 r.item.system.description.value=r.item.system.description.value.replace(/<details(?: data-ecos-relato)?><summary>Relato de Nimerios · propuesta<\/summary>[\s\S]*?<\/details>/g,'');
 r.item.system.description.value+=`<details data-ecos-relato><summary>Relato de Nimerios · propuesta</summary><p>${escTexto(publico)}</p><p>El autor decide cómo encaja en su campaña. Este relato no modifica los efectos de la ficha.</p></details>`;
 const m=r.item.flags['ecos-frontera'].reliquia;m.textoVersion=4;m.textoHuella=huellaTexto(r.item.system.description.value);
}
D.memoriaNimerios={version:1,entradas};R.version=4;
writeCatalog(D);fs.writeFileSync(url,encodeCatalog(R));
fs.writeFileSync(new URL('../docs/MEMORIA_NIMERIOS_3.4.md',import.meta.url),'# Memoria de Nimerios · 3.4\n\nLas entradas de referencia conservan el panteón existente. Los relatos nuevos son propuestas del autor para adoptar, editar o descartar desde el cuaderno privado; no reemplazan lore escrito ni añaden poder. Las comunidades y rutas se pueden situar en cualquier región de Nimerios.\n\n'+entradas.map(e=>`## ${e.nombre} · ${e.tipo}\n\nEstado: ${e.estado}.\n\n${e.publico}\n\nPara el DM: ${e.dm}\n`).join('\n')+'\n');
console.log(`Memoria de Nimerios: ${entradas.length} entradas, ${D.tecnicas.length} técnicas clasificadas por intención, 78 relatos de reliquia.`);
