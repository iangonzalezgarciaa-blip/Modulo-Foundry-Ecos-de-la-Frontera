import fs from 'node:fs';
import {readCatalog,writeCatalog,validateCatalog} from './catalog.mjs';
import crearDotes from './shinobi/feats.mjs';
import {NIVEL_GRADO,etapaGrado} from '../scripts/verbe-progression.js';
const D=readCatalog();
for(let n=1;n<=20;n++)D.gradoMax[n]=NIVEL_GRADO.findLastIndex(v=>v<=n);
D.rangos.find(r=>r.id==='legendario').nivel=18;
for(const c of [{id:'sendas',nombre:'Sendas de especialización',texto:'Disciplina → Especialista → Maestría → Leyenda; cada paso tiene un beneficio y requisitos propios.'},{id:'culminacion',nombre:'Ascensión y perfeccionamiento',texto:'Herramientas de especialización y acceso a poderes excepcionales.'}])if(!D.categoriasDote.some(x=>x.id===c.id))D.categoriasDote.push(c);
for(const h of [{id:'prueba-mitica',nombre:'Prueba de ascensión mítica',abreSangre:false},{id:'prueba-trascendente',nombre:'Prueba de ascensión trascendente',abreSangre:false}])if(!D.hitosShinobi.some(x=>x.id===h.id))D.hitosShinobi.push(h);
for(const d of crearDotes(D)){const i=D.dotes.findIndex(x=>x.id===d.id);if(i<0)D.dotes.push(d);else D.dotes[i]=d;}
const pisosDote={'corazon-fuego':9,'estado-hondo':9,'sellos-mente':7,'firma-oculta':5,'piel-naturaleza':5,'choque-perfecto':3,'control-a-ciegas':7,'infusion-sostenida':9};
for(const[id,nivel]of Object.entries(pisosDote)){const d=D.dotes.find(d=>d.id===id);if(!Object.hasOwn(d,'reqBase'))d.reqBase=d.req;const base=String(d.reqBase??'').replace(/(?:;\s*)?nivel \d+/g,'').trim();d.req=`${base?base+'; ':''}nivel ${nivel}`;}
// Los requisitos escritos de las dotes antiguas también quedan declarados y auditables.
for(const d of D.dotes.filter(d=>!d.evolucion)){
 const req=d.req??'',r={nivel:Number(req.match(/nivel (\d+)/)?.[1])||1,ramas:{},dotes:[],tecnicas:[]};
 for(const m of req.matchAll(/rama ([A-Za-zÁÉÍÓÚáéíóúñ]+)(?:, (Entrenado|Experto|Maestro|Legendario|Mítico))?/g)){const rama=D.ramas.find(x=>x.nombre.toLowerCase()===m[1].toLowerCase());if(rama)r.ramas[rama.id]=m[2]?D.rangos.findIndex(x=>x.nombre===m[2]):1;}
 for(const parte of req.split(/[;,]/).map(x=>x.trim().toLowerCase())){
  const anterior=D.dotes.find(x=>x.id!==d.id&&x.nombre.toLowerCase()===parte);if(anterior)r.dotes.push(anterior.id);
  const tec=D.tecnicas.find(x=>x.n.toLowerCase()===parte);if(tec)r.tecnicas.push(tec.id);
 }
 const alias={'Control fino':'control-fino','Maestría del Control':'maestria-control','Naturaleza combinada':'naturaleza-combinada','Sustitución':'forma-sustitucion','Andar por muros':'forma-andar'};
 for(const [palabra,id]of Object.entries(alias))if(req.includes(palabra))(id.startsWith('forma-')?r.tecnicas:r.dotes).push(id);
 r.naturaleza=req.match(/naturaleza (Fuego|Agua|Viento|Tierra|Rayo)/i)?.[1]?.toLowerCase();
 if(/dos naturalezas/.test(req))r.minNaturalezas=2;
 if(/una herencia/.test(req))r.herencia=true;
 if(/sangre plena o media/.test(req))r.fuerzas=['plena','media'];
 if(/Mirada trasplantada/.test(req))r.trasplante=true;
 if(/una Mirada/.test(req))r.ojo=1;
 if(/sabe un cerrojo/.test(req))r.cerrojo=1;
 if(/una técnica Propia/.test(req))r.propia=true;
 if(/afinidad Entrenada/.test(req))r.afinidad=2;
 r.dotes=[...new Set(r.dotes)];r.tecnicas=[...new Set(r.tecnicas)];r.dm=/un maestro|cuatro brazos|trasplantada|escuela|arte de familia/.test(req);
 d.requisitos=r;d.automatizacion=d.efecto?'Beneficios registrados; confirma en mesa las condiciones descritas.':'Beneficio de mesa salvo integración específica indicada en el panel.';
}
const modificar=(id,texto,poder)=>{const d=D.dotes.find(d=>d.id===id);d.texto=texto;if(poder)d.poder=poder;};
modificar('segundo-aliento','Una vez por Descanso Largo, como AA recuperas 1d6 + la mitad de tu nivel de Verbe. Consume el presupuesto breve compartido; una pausa corta no renueva este uso.',{costo:0,recupera:'1d6 + floor(@details.level / 2)',breve:true});
modificar('beber-aire','Una vez por Descanso Largo, con un minuto de calma recuperas 1d8 + tu modificador de SAB de Verbe. Consume el presupuesto breve compartido y no elimina la deuda.',{costo:0,tiempo:'minute',recupera:'1d8 + @abilities.wis.mod',breve:true});
modificar('ultima-gota','Una vez por Descanso Largo, con tu Verbe a 0 o menos y mientras puedas actuar, como AA recuperas 1d4 + tu modificador de Verbe. Consume el presupuesto breve; la deuda cuesta el doble.',{costo:0,recupera:'1d4 + @mod',breve:true,soloVacio:true});
modificar('reserva-de-guerra','Una vez por Descanso Largo, dentro de un combate y con menos de la mitad de tu Verbe, como AA recuperas tu competencia. Consume el presupuesto breve; iniciar combates nuevos no renueva el uso.',{costo:0,recupera:'@prof',breve:true,combate:true,mitad:true});
modificar('respirar-mundo','En un modo sabio o de Quietud activo recuperas 1 Verbe al comienzo del turno. Consume el presupuesto breve compartido; al agotarlo deja de recuperar y no paga deuda a una tasa distinta.');
modificar('remate','Una vez por turno, cuando dejas a un enemigo real a 0 PG con una técnica, recuperas 1 Verbe, hasta 2 × competencia por Descanso Largo y dentro del presupuesto breve. No cuentan aliados, clones, invocaciones o criaturas indefensas preparadas como recurso; lo confirma el DM.');
modificar('dos-hilos','Mantienes hasta dos Concentraciones. Hasta nivel 16, al menos una debe ser de grado 3 o menor; desde nivel 17, de grado 5 o menor. Conservan salvaciones y acciones normales. Sin Dos hilos el Verbe no concede una segunda Concentración.');
modificar('sellos-rapidos','Una vez por Descanso Largo, una técnica de grado 1–5 que usa una acción puede usarse como AA. No acelera rituales, técnicas de grado 6 o más ni permite ignorar las acciones de las otras técnicas. Se confirma en mesa.');
modificar('manos-rapidas','Sellos rápidos puede usarse dos veces por Descanso Largo. Conserva sus límites de grado y activación; los cortos no lo renuevan. Resolución de mesa.');
modificar('rafaga','Una vez por Descanso Largo puedes usar dos técnicas de grado 1–3 con una acción, pagando ambas y respetando sus requisitos, Concentración y usos compartidos. Después, CON CD 12 o 1 Agotamiento. No se combina con otras fuentes de acciones o lanzamientos adicionales de dotes en ese turno; se resuelve en mesa.');
modificar('doble-reflejo','Una vez por Descanso Largo, una segunda reacción en la ronda solo para una defensa del Verbe. No concede otra Sustitución gratuita ni otro uso diario de esa defensa; se resuelve y registra con el DM.');
for(const d of D.dotes.filter(d=>d.poder))d.automatizacion='Actividad nativa, coste, uso diario y efecto registrados. La recuperación consume el presupuesto breve cuando lo indica.';
const caminos=[
 ['mirada-aster-costillas','mirada-aster-guerrero','mirada-aster-armadura','mirada-aster-perfecto','mirada-aster-indra'],
 ['mirada-orbe-atraer','mirada-orbe-repeler','mirada-orbe-luna'],['mirada-orbe-receptores','mirada-orbe-seis-cuerpos'],
 ['sangre-arcilla-c1','sangre-arcilla-c2','sangre-arcilla-c3','sangre-arcilla-c4','sangre-arcilla-cero'],
 ['pacto-rashomon','pacto-tres-rashomon','pacto-cinco-rashomon'],['vasija-manto-uno','vasija-manto-dos','vasija-avatar','vasija-bomba'],
 ['vasija-kurama-chakra','vasija-kurama-amigo'],['pulso-centenar-sello','pulso-centenar-liberar','pulso-renovacion-centenar'],
 ['quietud-mil-brazos','quietud-brazos-corona'],['umbral-formula','umbral-raijin','umbral-raijin-largo'],['umbral-grieta-planos','umbral-cambio-dimension']
];
for(const camino of caminos)for(let i=1;i<camino.length;i++){const t=D.tecnicas.find(t=>t.id===camino[i]),p=D.tecnicas.find(t=>t.id===camino[i-1]);if(!t||!p)throw Error('Camino sin técnica: '+camino[i]);t.previa=p.id;}
for(const t of D.tecnicas){
 const m=t.item.flags['ecos-frontera'].verbe;
 t.nivelMin=Math.max(Number(t.nivelMin)||1,NIVEL_GRADO[t.g]);
 t.obtencion={nivel:t.nivelMin,etapa:etapaGrado(t.g),rama:t.rama};m.obtencion=t.obtencion;
 // Las previas escritas se fijan por ID; los demás requisitos narrativos se conservan.
 const previa=D.tecnicas.find(p=>p.n===t.req&&p.id!==t.id);if(!t.previa&&previa)t.previa=previa.id;
 if(t.previa)m.previa=t.previa;
 const blancos=Number(t.item.system.target?.affects?.count)||1;
 if(blancos>1&&!t.item.system.target?.template?.size)m.divisorDados=Math.max(Number(m.divisorDados)||1,blancos);
 if(['hour','day'].includes(t.item.system.activation?.type))m.ritual=true;
}
// Los estados avanzados conservan su requisito de modo, sin apilar todas las bonificaciones del anterior.
const brazos=D.tecnicas.find(t=>t.id==='quietud-mil-brazos');
for(const ef of brazos.item.effects){const f=ef.flags['ecos-frontera'].verbe;f.modo='mil-brazos';f.modosConcedidos=['sabio','mil-brazos'];}
D.tecnicas.find(t=>t.id==='quietud-brazos-corona').item.flags['ecos-frontera'].verbe.acceso.modos=['sabio','mil-brazos'];
const combinado=D.tecnicas.find(t=>t.id==='vasija-modo-combinado');
for(const ef of combinado.item.effects){const f=ef.flags['ecos-frontera'].verbe;f.modosConcedidos=['sabio','manto'];ef.changes=[{key:'system.attributes.movement.fly',mode:4,value:'12'},{key:'system.attributes.ac.bonus',mode:2,value:'2'},{key:'system.bonuses.mwak.damage',mode:2,value:'1d6[force]'}];}
const centenar=D.tecnicas.find(t=>t.id==='pulso-renovacion-centenar'),cm=centenar.item.flags['ecos-frontera'].verbe;cm.reservaMin=16;cm.consumirReserva=true;
const notaCentenar=' Consume todo el depósito (mínimo 16 Verbe) para sostener la regeneración; no devuelve ese depósito a tu reserva de uso.';
if(!centenar.texto.includes('mínimo 16 Verbe')){centenar.texto+=notaCentenar;centenar.item.system.description.value+=`<p>${notaCentenar}</p>`;}
D.progresion={version:1,dotesBase:155,dotesNuevas:64,pasos:[{nivel:1,nombre:'Academia',grado:1},{nivel:5,nombre:'Chunin',grado:3},{nivel:11,nombre:'Jonin de élite',grado:6},{nivel:16,nombre:'Sannin',grado:8},{nivel:18,nombre:'Leyenda',grado:9},{nivel:19,nombre:'Mítico',grado:10},{nivel:20,nombre:'Trascendente',grado:11}]};
const errores=validateCatalog(D);if(errores.length)throw Error(errores.join('\n'));writeCatalog(D);
fs.writeFileSync(new URL('../docs/DOTES_Y_OBTENCION.json',import.meta.url),JSON.stringify({tecnicas:D.tecnicas.length,dotes:D.dotes.length,nuevas:64,dotesDetalle:D.dotes.map(d=>({id:d.id,nombre:d.nombre,trazos:d.trazos,requisitos:d.requisitos,automatizacion:d.automatizacion})),caminos,pasos:D.progresion.pasos},null,2)+'\n');
console.log(JSON.stringify({tecnicas:D.tecnicas.length,dotes:D.dotes.length,nuevas:64,caminos:caminos.length}));
