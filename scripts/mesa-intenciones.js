import {normalizar,textoPlano,buscarEntradas} from './mesa-core.js';
export const INTENCIONES={proteger:'Proteger a alguien',curar:'Atender y curar',controlar:'Frenar una amenaza',investigar:'Investigar y obtener información',viajar:'Moverse y transportar',social:'Hablar, negociar e interpretar',oficio:'Trabajar y organizar',explorar:'Explorar y preparar un refugio',atacar:'Dañar a un adversario'};
const patrones={
 proteger:/prote[gct]|defen|cobertura|armadura|resisten|resguardo|barrera|resc[aá]t|escud/,
 curar:/cura|recupera.*(?:pg|vida)|medicina|venda|paciente|tratamiento|herida|estabiliz/,
 controlar:/apresad|aturdid|asustad|cegad|incapac|paraliz|dificil|sujeta|inmov|hechiz|silencio/,
 investigar:/inform|percib|detect|revela|reconoc|recuerda|percepcion|historia|investigacion|diagnost|registro|lectura/,
 viajar:/traslad|transport|carga|teleport|teletrans|volar|vuela|pasarela|camino|ruta|baliza|regresa|cuerda|vehicul/,
 social:/conversa|mensaje|palabras|voz|negocia|persuasi|interpretacion|engano|acuerdo|relato|cancion|cuento/,
 oficio:/oficio|herramienta|taller|cocina|sastr|carpinter|costura|inventario|almacen|orden|repar|receta|escriba/,
 explorar:/supervivencia|campamento|refugio|vigila|rastro|huella|rueda|agua corriente|viento|orient|brujula|tiempo meteor/,
 atacar:/dano|impacto|ataque|cortante|perforante|contundente/
};
export function intencionesTecnica(t){
 const texto=normalizar((t.n??t.nombre??'')+' '+(t.textoJ??t.texto??'')),tags=new Set();
 const acts=Object.values(t.item?.system?.activities??{});
 for(const [id,p]of Object.entries(patrones))if(p.test(texto))tags.add(id);
 if(acts.some(a=>a.type==='heal'))tags.add('curar');if(acts.some(a=>a.damage?.parts?.length))tags.add('atacar');
 if(t.vida)tags.delete('atacar');
 return [...tags];
}
export function recomendarTecnicas(tecnicas,intencion,{conocidas=[],requisito=()=>({ok:true}),costo=t=>t.costo,limite=12}={}){
 if(!Object.hasOwn(INTENCIONES,intencion))return [];
 return tecnicas.filter(t=>intencionesTecnica(t).includes(intencion)).map(t=>{
  const sabe=conocidas.includes(t.id),permiso=requisito(t),precio=Number(costo(t));
  return {id:t.id,nombre:t.n,grado:t.g,rama:t.rama,texto:t.textoJ??t.texto,aprendida:sabe,disponible:permiso.ok,motivo:permiso.motivo??'',costo:Number.isFinite(precio)?precio:null,trazos:t.trazos,
   puntos:(sabe?1000:permiso.ok?500:0)+(t.vida&&intencion!=='atacar'?60:0)-t.g*3-(Number.isFinite(precio)?precio:0)};
 }).sort((a,b)=>b.puntos-a.puntos||a.nombre.localeCompare(b.nombre,'es')).slice(0,limite);
}
export function relacionadas(entradas,e,limite=4){
 const palabras=normalizar(e.nombre).split(/[^a-z0-9]+/).filter(p=>p.length>3&&!['tecnica','nimerios','verbe','campana','diario','mundo','nombre','reglas'].includes(p));
 const otras=entradas.filter(x=>x!==e&&(e.uuid?x.uuid!==e.uuid:x.catalogo!==e.catalogo));
 return otras.map(r=>{const nombre=normalizar(r.nombre),plano=textoPlano(r.texto),texto=r.textoBusquedaNormalizada??normalizar(plano);
  const coincidencias=palabras.slice(0,5).filter(p=>nombre.includes(p)||texto.includes(p));if(!coincidencias.length)return null;
  const puntos=coincidencias.reduce((n,p)=>n+(nombre.includes(p)?8:1),0),pos=Math.max(0,texto.indexOf(coincidencias[0])-60);
  return {...r,puntos,extracto:(pos?'…':'')+plano.slice(pos,pos+240)};
 }).filter(Boolean).sort((a,b)=>b.puntos-a.puntos||a.nombre.localeCompare(b.nombre,'es')).slice(0,limite);
}
export function referenciasTexto(texto){return [...new Set([...String(texto??'').matchAll(/@UUID\[([^\]]+)\]/g)].map(m=>m[1]).filter(u=>/^(Actor|Item|JournalEntry|Compendium)\.[A-Za-z0-9._-]+$/.test(u)))].slice(0,20);}
