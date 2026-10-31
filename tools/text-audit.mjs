import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {readCatalog,decodeCatalog} from './catalog.mjs';
const ordenar=x=>Array.isArray(x)?x.map(ordenar):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,ordenar(x[k])])):x;
function itemReglas(item){
 const i=structuredClone(item);delete i.system.description;
 for(const e of i.effects??[])delete e.description;
 const r=i.flags?.['ecos-frontera']?.reliquia;if(r){delete r.textoHuella;delete r.textoVersion;}
 return i;
}
export function huellaReglas(D,R){
 const contenido={tecnicas:D.tecnicas.map(t=>({id:t.id,g:t.g,rama:t.rama,sec:t.sec,nat:t.nat,trazos:t.trazos,costo:t.costo,nivelMin:t.nivelMin,previa:t.previa,req:t.req,obtencion:t.obtencion,item:itemReglas(t.item)})),dotes:D.dotes.map(d=>{const n=structuredClone(d);for(const k of ['texto','textoJ','mejora','automatizacion'])delete n[k];return n;}),linajes:D.linajes,costos:D.costo,gradoMax:D.gradoMax,reliquias:R.reliquias.map(r=>itemReglas(r.item))};
 return createHash('sha256').update(JSON.stringify(ordenar(contenido))).digest('hex');
}
export function auditarTextos(){
 const D=readCatalog(),R=decodeCatalog(fs.readFileSync(new URL('../data/reliquias.txt',import.meta.url),'utf8')),base=JSON.parse(fs.readFileSync(new URL('./text-baseline.json',import.meta.url),'utf8'));
 if(huellaReglas(D,R)!==base.reglas)throw Error('Esta revisión textual cambió datos de reglas: hay que revisar la diferencia antes de publicarla.');
 const problemas=[];for(const t of D.tecnicas){const html=t.item.system.description.value;if(!html.includes('Qué hace')||!html.includes('Cómo se usa')||!html.includes('Qué cuesta'))problemas.push(t.id+': falta estructura');if(/\bundefined\b|\bNaN\b/.test(html))problemas.push(t.id+': referencia incompleta');}
 for(const r of R.reliquias)if(!r.item.system.description.value.includes('Para poder usarla'))problemas.push(r.id+': falta acceso explicado');
 if(problemas.length)throw Error(problemas.join('\n'));
 const informe=`# Auditoría de lectura · 3.2.1\n\n## Alcance comprobado\n\n- ${D.tecnicas.length} técnicas con bloques «Qué hace», «Cómo se usa» y «Qué cuesta».\n- ${D.dotes.length} dotes presentadas como mejoras permanentes, con compra y activación separadas.\n- ${R.reliquias.length} reliquias con requisitos, cargo, límite compartido y permiso ritual visibles por separado.\n- Ayuda por tareas, glosario, ejemplo de grado/nivel/rango y choque explicado por pasos.\n- Referencias divinas sin páginas inexistentes y sin mostrar su nombre verdadero al jugador desde la referencia.\n\n## Equilibrio\n\nLa huella de reglas coincide con 3.2.0: costes, datos de actividades, efectos, requisitos, niveles, linajes y poderes no cambian. SHA-256: \`${base.reglas}\`. Esta comprobación compara datos estructurados; no demuestra por sí sola que todas las interpretaciones narrativas sean inequívocas.\n\n## Aclaraciones importantes\n\n- «Maestro» es un rango de rama; «Maestría» es una dote de senda. Subir uno no compra la otra.\n- El aviso de bloqueo muestra el primer requisito pendiente, no una lista exhaustiva.\n- La recuperación de un Largo en Santuario y una noche a la intemperie se explica por separado y muestra su resultado real en la ayuda del personaje.\n- Sustitución refleja sigue siendo una excepción que se renueva en un Corto; los poderes diarios y grados altos no se renuevan por ello.\n- Las bonificaciones ya calculadas en las tiradas no se suman otra vez desde el texto base.\n- Las utilidades de mesa no se presentan como efectos automáticos ni las sugerencias de mejora como facultades ya compradas.\n\n## Conservación\n\nLas fichas propias de reliquias se actualizan solo si su descripción coincide con una versión generada conocida. Las ediciones del DM se conservan. La actualización textual no reemplaza efectos, equipo, autorizaciones, cargas o permisos de una copia. Los diarios antiguos se conservan.\n\n## Límites\n\nLa revisión estática y las pruebas automatizadas no sustituyen observar una primera sesión con jugadores nuevos ni probar las integraciones dentro de Foundry. La vista previa usa HTML real del panel y personajes ficticios.\n`;
 fs.writeFileSync(new URL('../docs/AUDITORIA_TEXTUAL_3.2.1.md',import.meta.url),informe);console.log(`${D.tecnicas.length} técnicas y ${R.reliquias.length} reliquias con lectura guiada; huella de reglas conservada.`);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)auditarTextos();
