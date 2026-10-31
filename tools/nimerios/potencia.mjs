import {createHash} from 'node:crypto';
const limpiar=o=>Array.isArray(o)?o.map(limpiar):o&&typeof o==='object'?Object.fromEntries(Object.keys(o).sort().filter(k=>!['name','description','source','chatFlavor','condition'].includes(k)).map(k=>[k,limpiar(o[k])])):o;
export function potenciaTecnica(t){
 return createHash('sha256').update(JSON.stringify(limpiar({id:t.id,g:t.g,rama:t.rama,nat:t.nat,sec:t.sec,trazos:t.trazos,costo:t.costo,req:t.req,previa:t.previa,nivelMin:t.nivelMin,obtencion:t.obtencion,item:t.item}))).digest('hex');
}
