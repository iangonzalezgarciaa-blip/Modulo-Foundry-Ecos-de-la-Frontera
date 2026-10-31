import fs from 'node:fs';
import {readCatalog,writeCatalog,validateCatalog} from './catalog.mjs';
import {construirShinobi} from './build-shinobi.mjs';
import {panteon,linajesNuevos,tecnicasDivinas} from './divinity-catalog.mjs';
import {NIVEL_GRADO,etapaGrado} from '../scripts/verbe-progression.js';
import {notaPanteonHTML} from '../scripts/verbe-divinity.js';
const D=readCatalog(); D.panteon=panteon;
for(const l of linajesNuevos){
  const dios=panteon.find(d=>d.id===l.id), {texto,forma,...datos}=l;
  const nuevo={...datos,nombre:dios.nombre,real:dios.nombre,herencia:l.req,divina:true};
  const i=D.linajes.findIndex(x=>x.id===l.id);if(i<0)D.linajes.push(nuevo);else D.linajes[i]=nuevo;
  const her={nombre:l.req,sangre:l.id,rasgo:texto,despertar:forma};
  const h=D.herencias.findIndex(x=>x.nombre===l.req);if(h<0)D.herencias.push(her);else D.herencias[h]=her;
}
for(const l of D.linajes){const dios=panteon.find(d=>d.id===l.id);if(dios){l.jerarquia=dios.jerarquia;l.propuesto=dios.propuesto;}}
for(const h of [{id:'eco-de-los-primeros',nombre:'Eco de los Primeros · sangre divina'},{id:'memoria-de-la-madre',nombre:'Memoria de la Madre · sangre divina'}])if(!D.hitosShinobi.some(x=>x.id===h.id))D.hitosShinobi.push({...h,abreSangre:false});
for(const s of tecnicasDivinas){
  const l=D.linajes.find(l=>l.id===s.linaje), dios=panteon.find(d=>d.id===s.linaje);
  const acceso={linaje:l.id,herencia:l.req,...(s.g>=6?{hito:l.id==='maethra'&&s.g>=8?'memoria-de-la-madre':'eco-de-los-primeros'}:{}),...(s.g>=9?{fuerzas:['plena']}:{})};
  const t=construirShinobi({...s,id:'divino-'+s.id,rama:'sangre',rara:true,acceso,grupoModo:'forma-divina',origen:`${l.alias} · adaptación Nimerios 3.2`,fuente:'Creación de mesa 3.2; dominios del Compendio Universal del Director, pp. 8–25 y 129–132. No procede del estudio de Naruto.'},D);
  const m=t.item.flags['ecos-frontera'].verbe;delete m.shinobi;m.divina=true;
  t.divina=true;t.req=l.req;m.req=l.req;
  t.origen={obra:'Nimerios · reglas nuevas 3.2',nombre:dios.nombre,referencia:'Compendio DM, pp. 8–25 y 129–132; dominios, no cifras',propuesto:dios.propuesto};
  t.alias=[l.alias];t.nivelMin=NIVEL_GRADO[t.g];t.obtencion={nivel:t.nivelMin,etapa:etapaGrado(t.g),rama:t.rama};m.obtencion=t.obtencion;if(t.previa)m.previa=t.previa;
  t.item.system.source={custom:'Ecos · Sangre divina 3.2',book:'Nimerios · adaptación de mesa'};
  const i=D.tecnicas.findIndex(x=>x.id===t.id);if(i<0)D.tecnicas.push(t);else D.tecnicas[i]=t;
}
// Las herencias originales también se verifican al usar, aunque la ficha sea antigua.
for(const t of D.tecnicas){const l=D.linajes.find(l=>l.req===t.req&&l.req);if(l){const m=t.item.flags['ecos-frontera'].verbe;m.acceso={...m.acceso,herencia:l.req};}}
D.divinidad={version:1,nuevas:tecnicasDivinas.length,primeros:panteon.filter(d=>d.jerarquia==='primordial').map(d=>d.id)};
const errores=validateCatalog(D);if(errores.length)throw Error(errores.join('\n'));writeCatalog(D);
const obtencionURL=new URL('../docs/DOTES_Y_OBTENCION.json',import.meta.url),obtencion=JSON.parse(fs.readFileSync(obtencionURL));obtencion.tecnicas=D.tecnicas.length;fs.writeFileSync(obtencionURL,JSON.stringify(obtencion,null,2)+'\n');
fs.writeFileSync(new URL('../docs/PANTEON_3.2.md',import.meta.url),'# Panteón y sangre divina · 3.2\n\nNota privada incorporada a los diarios del módulo. No reemplaza el canon previo ni las ediciones del DM.\n\n'+notaPanteonHTML(D)+'\n\n## Técnicas nuevas\n\n| Técnica | Linaje | Grado | Nivel | Hito |\n|---|---|---:|---:|---|\n'+D.tecnicas.filter(t=>t.divina).map(t=>`| ${t.n} | ${t.origen.nombre} | ${t.g} | ${t.nivelMin} | ${t.acceso.hito??'—'} |`).join('\n')+'\n');
console.log(JSON.stringify({dioses:panteon.length,primeros:D.divinidad.primeros.length,linajesNuevos:linajesNuevos.length,tecnicasNuevas:tecnicasDivinas.length,total:D.tecnicas.length}));
