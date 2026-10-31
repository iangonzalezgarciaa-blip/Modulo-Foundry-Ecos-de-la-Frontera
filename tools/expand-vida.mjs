import {readCatalog,writeCatalog,validateCatalog} from './catalog.mjs';
import {construirShinobi} from './build-shinobi.mjs';
import {NIVEL_GRADO,etapaGrado} from '../scripts/verbe-progression.js';
import {vida} from './nimerios/vida.mjs';
const D=readCatalog();let nuevas=0;
for(const[rama,lista]of Object.entries(vida))for(const[id,nombre,g,alcance,duracion,texto]of lista){
 const t=construirShinobi({id:'vida-'+rama+'-'+id,nombre,rama,g,t:g===0?'A':'1 min',tipo:'utility',alcance,duracion,conc:duracion>0&&duracion<=600,gestos:true,texto,origen:'Oficios y caminos de Nimerios',fuente:'Creación original de la campaña.',limite:'Una ventaja del mismo tipo no se acumula con otra ventaja. No sustituye competencias, herramientas, materiales, descansos ni decisiones del DM. Las tareas conservan su tiempo y consecuencias normales.',manual:'Utilidad de mesa: acuerda la tarea, paga la técnica y realiza la prueba cuando el DM la pida. No modifica inventarios, escenarios o tiradas automáticamente.'},D);
 const m=t.item.flags['ecos-frontera'].verbe;delete m.shinobi;m.vida=true;t.vida=true;t.alias=[nombre];t.origen={obra:'Nimerios',nombre:'Oficios y caminos',referencia:'Creación original.'};t.nivelMin=NIVEL_GRADO[g];t.obtencion={nivel:t.nivelMin,etapa:etapaGrado(g),rama};m.obtencion=t.obtencion;
 t.item.system.source={custom:'Ecos · Oficios y caminos',book:'Nimerios'};
 const i=D.tecnicas.findIndex(x=>x.id===t.id);if(i<0)D.tecnicas.push(t);else D.tecnicas[i]=t;nuevas++;
}
D.vida={version:1,nuevas,ramas:Object.fromEntries(Object.entries(vida).map(([r,l])=>[r,l.length]))};
const errores=validateCatalog(D);if(errores.length)throw Error(errores.join('\n'));writeCatalog(D);console.log(`Oficios y caminos: ${nuevas} técnicas originales; total ${D.tecnicas.length}.`);
