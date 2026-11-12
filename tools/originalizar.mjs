/** Último paso del catálogo: identidad de campaña sin cambiar claves guardadas en las hojas. */
import fs from 'node:fs';
import {readCatalog,writeCatalog,decodeCatalog,encodeCatalog,validateCatalog} from './catalog.mjs';
import {reemplazar,nombresReliquias} from './nimerios/nombres.mjs';
import {fichaLecturaHTML,huellaTexto} from '../scripts/verbe-reading.js';
const D=readCatalog(),compat=JSON.parse(fs.readFileSync(new URL('./nimerios/compatibilidad-3.2.1.json',import.meta.url),'utf8'));
const extra={};
// 3.11: las técnicas de sangre llevan como alias el nombre visible de su linaje («Sangre Antigua», «Sangre de aurora»…).
// Ese alias no es un nombre ajeno que traducir: si entra en el mapa, cualquier texto que diga «Sangre Antigua» pasa a
// llamarse como la última técnica de Maethra. Pasaba desde 3.3 («Pide: Jardín del Primer Sueño»).
const deLinaje=new Set(D.linajes.flatMap(l=>[l.alias,l.req,l.herencia]).filter(Boolean));
for(const t of D.tecnicas)for(const a of t.alias??[])if(a&&a!==t.n&&a.length>3&&!deLinaje.has(a))extra[a]=reemplazar(t.n);
// Repara lo que ese error ya dejó escrito en el catálogo, fuera de la propia técnica.
const tecJardin=D.tecnicas.find(t=>t.id==='divino-madre-jardin'),JARDIN=tecJardin?.n??'Jardín del Primer Sueño';
function repararJardin(o){
 if(!o||typeof o!=='object'||o===tecJardin)return;
 for(const [k,v]of Object.entries(o)){
  if(typeof v==='string'&&v.includes(JARDIN))o[k]=v.replaceAll(JARDIN,'Sangre Antigua');
  else if(v&&typeof v==='object')repararJardin(v);
 }
}
repararJardin(D);
// Los requisitos y los identificadores siguen siendo los mismos. No se altera ninguna regla.
const tecnicos=new Set(['id','_id','identifier','previa','key','value','modo','grupoModo','modosConcedidos','familiaUso','artefacto','bestia','hito','tradicion','herencia','req','pacto','linaje','rango','car','type','reference']);
function recorrer(o){
 if(!o||typeof o!=='object')return;
 for(const [k,v]of Object.entries(o)){
  if(['acceso','flags','changes','origen','alias'].includes(k))continue;
  if(typeof v==='string'&&!tecnicos.has(k))o[k]=reemplazar(v,extra);
  else if(v&&typeof v==='object')recorrer(v);
 }
}
recorrer(D);
for(const t of D.tecnicas){
 t.n=reemplazar(t.n);t.item.name=t.n;t.alias=[t.n];
 if(t.origen)t.origen={obra:'Nimerios',nombre:t.n,referencia:t.divina?'Dominios de la campaña; cifras de mesa':'Archivo del Verbe; reglas de la campaña'};
 t.item.system.source={custom:'Ecos · Archivo del Verbe',book:'Nimerios'};
 t.item.system.description.value=fichaLecturaHTML(t);
 for(const a of Object.values(t.item.system.activities??{}))a.name=t.n;
 for(const ef of t.item.effects??[]){ef.name=t.n;if(ef.description)ef.description=reemplazar(ef.description,extra);}
}
// Nombres propios de entidades; solo cambian etiquetas, nunca sus ID ni permisos.
for(const l of D.linajes){l.nombre=reemplazar(l.nombre);l.real=reemplazar(l.real);}
for(const x of D.bestiasShinobi??[])x.nombre=reemplazar(x.nombre);
for(const x of D.artefactosShinobi??[]){x.nombre=reemplazar(x.nombre);x.texto='Reliquia excepcional del Archivo del Verbe de Nimerios. Su adquisición, voluntad y conservación pertenecen a la historia. Sus acciones especiales exigen aprender sus técnicas y pagar sus costes.';}
D.identidad={version:1,compatibilidad:compat.tecnicas,artefactos:compat.artefactos};
D.etiquetas=Object.fromEntries([...(D.tradicionesShinobi??[]),...(D.hitosShinobi??[]),...(D.artefactosShinobi??[]),...(D.bestiasShinobi??[]),...D.miradas].map(x=>[x.id,x.nombre]));
Object.assign(D.etiquetas,{susanoo:'Custodio del Firmamento',sabio:'Armonía natural',kurama:'Aurenox',juubi:'Velkarion'});
// La referencia ya pertenece al archivo de campaña; no debe exigir una página de una obra ajena.
const err=validateCatalog(D);if(err.length)throw Error(err.join('\n'));writeCatalog(D);
const url=new URL('../data/reliquias.txt',import.meta.url),R=decodeCatalog(fs.readFileSync(url,'utf8'));
R.version=3;R.alcance='Archivo de reliquias de Nimerios. Los nombres, la historia de uso y las reglas visibles pertenecen a esta campaña. Los códigos internos conservan la compatibilidad con copias entregadas.';
R.compatibilidad=compat.reliquias;
for(let i=0;i<R.reliquias.length;i++){
 const r=R.reliquias[i],anterior=r.nombre;r.nombre=i<nombresReliquias.length?nombresReliquias[i]:reemplazar(r.nombre);
 r.original=null;r.canon='Reliquia del Archivo de las Profundidades de Nimerios. Su hallazgo, origen concreto y consecuencias los determina el DM.';r.fuentes=[];
 r.texto=reemplazar(r.texto).replaceAll(anterior,r.nombre).replaceAll('Shaker','Cápsula del Estrépito').replaceAll('Reg como personaje','un Vigía como personaje').replaceAll('Incinerador','Rayo del Vigía Sepultado')
  .replace('Familia del videojuego, no un ejemplar único del manga. Perfil de mesa: ','Familia de equipo de las capas: cada pieza es distinta. ');
 r.grado=String(r.grado??'').replace('familia de videojuego','familia de equipo');
 r.item.name=r.nombre;r.item.system.source={custom:'Ecos · Archivo de las Profundidades',book:'Nimerios'};
 let html=r.item.system.description.value;html=html.replace(/<p><b>(?:Made in Abyss|Videojuego)[\s\S]*?<\/p>/,'<p><b>Archivo de las Profundidades · Nimerios</b></p>').replace(/<h3>(?:Fuentes|Referencia)[\s\S]*$/,'');
 // Reconstruye el texto visible sin aliases, enlaces o clasificaciones ajenas.
 const uso=html.match(/<h3>Para poder usarla<\/h3>([\s\S]*?)(?=<h3>|$)/)?.[1]??'';
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 r.item.system.description.value=`<div class="ev-lectura"><h2>${esc(r.nombre)}</h2><p>Archivo de las Profundidades · Nimerios</p><h3>Qué hace</h3><p>${esc(r.texto)}</p><h3>Para poder usarla</h3>${reemplazar(uso)}<h3>Cargas y resolución</h3><p>Una carga por ejemplar y un uso de su familia por Descanso Largo. Las reliquias mayores comparten además un uso mayor por Largo. Los consumibles no se recargan. Los rituales requieren permiso del DM para cada activación. Las utilidades narrativas se resuelven en mesa; una tarjeta no altera el escenario automáticamente.</p></div>`;
 for(const a of Object.values(r.item.system.activities??{}))a.name=r.nombre;
 for(const e of r.item.effects??[]){e.name=r.nombre;e.description=reemplazar(e.description??'');}
 const m=r.item.flags['ecos-frontera'].reliquia;m.textoVersion=3;m.textoHuella=huellaTexto(r.item.system.description.value);
}
R.dossiers=[{id:'aubade',nombre:'Vigías de las Profundidades',texto:'Entidades singulares de la Falla. Su naturaleza y voluntad pertenecen a la historia; no son equipo de acceso universal.'},{id:'reg',nombre:'El Vigía Sepultado',texto:'Perfil narrativo para un autómata singular. Sus dispositivos se autorizan por separado; poseer una pieza no entrega todas sus facultades.'}];
fs.writeFileSync(url,encodeCatalog(R));
fs.writeFileSync(new URL('../docs/IDENTIDAD_NIMERIOS_3.3.md',import.meta.url),'# Identidad de Nimerios · 3.3\n\nLos nombres visibles, alias de búsqueda y referencias de las técnicas y reliquias usan el vocabulario de la campaña. Lethria sustituye al antiguo nombre de la guardiana de las despedidas; Namar Sin Rostro es el nombre del cazador sin rostro. El panteón conserva sus jerarquías. Los identificadores históricos se conservan exclusivamente para que las hojas mantengan compras, vínculos y autorizaciones.\n\n## Bestias vinculadas\n\n'+D.bestiasShinobi.map(b=>'- '+b.nombre).join('\n')+'\n\n## Reliquias\n\n'+R.reliquias.map(r=>'- '+r.nombre).join('\n')+'\n');
console.log(`Identidad de Nimerios aplicada: ${D.tecnicas.length} técnicas y ${R.reliquias.length} reliquias; ID conservados.`);
