import test,{beforeEach} from 'node:test';
import assert from 'node:assert/strict';
import {MockActor,MockItem,MockEffect,resetEnvironment,notices} from './helpers/foundry.mjs';
import {readCatalog,validateCatalog} from '../tools/catalog.mjs';
import {NIVEL_GRADO,maximoPorNivel,limiteEscalado,limiteDadosExtra,cuotasPoder,permisoCuota,permisoTurno,validarConcentraciones,pisoCosto} from '../scripts/verbe-progression.js';
import * as V from '../scripts/verbe.js';
import {accesoShinobi} from '../scripts/verbe-shinobi.js';
const D=readCatalog(),tec=id=>D.tecnicas.find(t=>t.id===id),dote=id=>D.dotes.find(d=>d.id===id);
const senda=(rama,n=4)=>Array.from({length:n},(_,i)=>`senda-${rama}-${i+1}`);
const todas=D.ramas.flatMap(r=>senda(r.id));
beforeEach(()=>{resetEnvironment();V.usarDatos(D,'activo');});
const actor=(nivel=20,patch={})=>new MockActor(nivel,{progresionVersion:1,shinobiVersion:1,valor:150,principal:'forma',rangos:Object.fromEntries(D.ramas.map(r=>[r.id,5])),dotes:[...todas,'ascension-mitica','ascension-trascendente'],hitosShinobi:['prueba-mitica','prueba-trascendente'],...patch});
const agregar=(a,id)=>{const i=new MockItem(V.datosItem(a,tec(id)),a);a.items.push(i);return i;};
async function usar(a,id,scaling=0){const item=a.items.find(i=>i.getFlag('ecos-frontera','verbe')?.id===id)??agregar(a,id),activity={actor:a,item},usage={scaling},updates={};if(V.alConsumir(activity,usage,{},updates)===false)return false;await a.update(updates.actor);await V._prueba.despuesDeUsar(activity,usage);return usage.ecosVerbe;}
async function poder(a,id){const item=a.items.find(i=>i.getFlag('ecos-frontera','verbe')?.dote===id),activity={actor:a,item},usage={},updates={};assert.ok(item,id);if(V.alConsumir(activity,usage,{},updates)===false)return false;await a.update(updates.actor);await V._prueba.despuesDeUsar(activity,usage);return true;}
test('dotes: 219 base más las de clones, cuatro pasos para cada rama y requisitos sin ciclos ni referencias rotas',()=>{
  assert.equal(D.dotes.length,219+(D.clones?.dotes??0)+(D.ruptura?.dotes??0)+(D.legados?.dotes??0)+(D.reglas334?.dotes??0)+(D.ajustes362?.dotes??0));assert.equal(D.dotes.filter(d=>d.evolucion).length,64);assert.deepEqual(validateCatalog(D),[]);
  const visitar=(id,camino=[])=>{assert.ok(!camino.includes(id),id);for(const p of dote(id).requisitos?.dotes??[])visitar(p,[...camino,id]);};
  for(const d of D.dotes)visitar(d.id);for(const r of D.ramas)for(const id of senda(r.id))assert.ok(dote(id));
});
test('los grados fuertes llegan exactamente en las etapas 11,16,18,19,20',()=>{
  for(let g=1;g<=11;g++){assert.equal(maximoPorNivel(NIVEL_GRADO[g]),g);if(NIVEL_GRADO[g]>1)assert.ok(maximoPorNivel(NIVEL_GRADO[g]-1)<g);}
  assert.equal(V.gradoMax(actor(15)),7);assert.equal(V.gradoMax(actor(16)),8);assert.equal(V.gradoMax(actor(17)),8);assert.equal(V.gradoMax(actor(18)),9);
});
test('una senda exige sus anteriores, el nivel y el rango; no se compra por solo tener Trazos',async()=>{
  const a=actor(11,{dotes:[],rangos:{forma:3}});assert.equal(V.cumpleReqDote(a,dote('senda-forma-3')).ok,false);
  for(const id of senda('forma',3))assert.equal(await V.comprarDote(a,id),true,id);
  assert.equal(V.estado(a).gastados,9);assert.equal(V.cumpleReqDote(a,dote('senda-forma-4')).ok,false);
});
test('un rango sin senda no permite aprender un poder mayor; sí puede conservar uno legado',async()=>{
  const a=actor(20,{dotes:[]}),t=tec('forma-ultima');assert.equal(V.requisitos(a,t).ok,false);agregar(a,t.id);
  assert.equal(await usar(a,t.id),false);V.estado(a).poderesLegados=[t.id];assert.ok(await usar(a,t.id));
});
test('regalar una técnica no omite su nivel ni le concede ascensiones',async()=>{
  const a=actor(5,{dotes:[]});assert.equal(await V.aprender(a,tec('forma-ultima'),{gratis:true}),true);
  assert.equal(await usar(a,'forma-ultima'),false);assert.equal(V.estado(a).valor,150);
});
test('ascensiones exigen Leyenda y un hito real del DM; un jugador no puede aprobarse ese hito',async()=>{
  const a=actor(19,{dotes:senda('forma'),hitosShinobi:[]});assert.equal(V.cumpleReqDote(a,dote('ascension-mitica')).ok,false);
  game.user=game.users.get('player');assert.equal(await V.concederShinobi(a,'hito','prueba-mitica'),false);
  game.user=game.users.get('gm');assert.equal(await V.concederShinobi(a,'hito','prueba-mitica'),true);assert.equal(await V.comprarDote(a,'ascension-mitica'),true);
});
test('devolver una dote previa desactiva los beneficios y el acceso de sus descendientes',async()=>{
  const a=actor(20,{dotes:senda('forma')});assert.ok(V.efectosDotes(a).some(e=>e.accesoMayor==='forma'));
  V.estado(a).dotes=V.estado(a).dotes.filter(id=>id!=='senda-forma-1');
  assert.ok(!V.efectosDotes(a).some(e=>e.accesoMayor==='forma'));assert.equal(V.requisitos(a,tec('fuego-sol')).ok,false);
});
test('los usos altos se comparten aunque se cambie de técnica, rama o variante',async()=>{
  const a=actor(11);assert.ok(await usar(a,'forma-lanza'));assert.ok(await usar(a,'agua-cascada'));
  assert.equal(V.estado(a).cuotasPoder.mayores,2);assert.equal(await usar(a,'rayo-cadena'),false);
  await V.alDescansar(a,{}, {type:'short'});assert.equal(await usar(a,'rayo-cadena'),false);
  await V.alDescansar(a,{}, {type:'long'});assert.ok(await usar(a,'rayo-cadena'));
});
test('una sola culminación de grado 11 en total; los modos y remates comparten las culminaciones',async()=>{
  const a=actor();assert.ok(await usar(a,'forma-ultima'));assert.equal(await usar(a,'cuerpo-sin-techo'),false);
  assert.equal(V.estado(a).cuotasPoder.culminaciones,1);assert.equal(V.estado(a).cuotasPoder.trascendentes,1);
});
test('las cuotas son finitas y varias Leyendas no multiplican el uso adicional',()=>{
  for(let n=1;n<=20;n++){const q=cuotasPoder(n,todas);assert.ok(q.mayores<=5&&q.culminaciones<=3&&q.trascendentes<=1);}
  assert.deepEqual(cuotasPoder(20,senda('forma')),cuotasPoder(20,todas));
});
test('elevar una técnica exige dados de escalado, nivel, rango y un máximo de tres grados adicionales',()=>{
  assert.equal(limiteEscalado({g:1,sube:'+1d6'},{nivel:20,rangoMax:11}),4);
  assert.equal(limiteEscalado({g:1,sube:'+1d6'},{nivel:20,rangoMax:11,profundo:2}),6);
  assert.equal(limiteEscalado({g:1,sube:null},{nivel:20,rangoMax:11}),1);
  assert.equal(limiteEscalado({g:11,sube:'+1d6'},{nivel:1,rangoMax:11}),1);
  const a=actor(20,{dotes:[]});assert.equal(V.gradoUsable(a,tec('forma-esfera').item.flags['ecos-frontera'].verbe),5);
});
test('elevar hacia grado 6 sin la senda se bloquea en vista y consumo',async()=>{
  const a=actor(11,{dotes:[]}),t=tec('fuego-gran-soplo');agregar(a,t.id);
  assert.equal(V.previsualizarUso(a,t.item.flags['ecos-frontera'].verbe,6).ok,false);assert.equal(await usar(a,t.id,3),false);
});
test('ni múltiples descuentos ni el clima bajan los poderes altos a un punto de Verbe',()=>{
  const a=actor(20,{dotes:[...todas,'raiz-de-rama','maestria-control','control-fino','combinacion-preparada'],maestria:'forma',cultivos:{'fuego-sol':{nivel:3,mejoras:['verbe','verbe','verbe']}}});
  game.modules.set('ecos-frontera',{api:{climaVerbe:()=>({favor:['fuego']})}});
  for(let g=1;g<=11;g++)assert.ok(V.costoUso(a,{id:'fuego-sol',rama:'forma',sec:'combo',nat:'fuego',g},g)>=pisoCosto(g,D.costo));
});
test('todos los bonos de dados se limitan y los de curación múltiple se reparten',()=>{
  const a=actor(20,{afinidad:{fuego:3},dotes:[...todas,'forma-afilada','control-fino','manos-tibias','senda-pulso-2'],cultivos:{'fuego-aliento':{nivel:3,mejoras:['dado','dado','dado']}}});
  const m=tec('fuego-aliento').item.flags['ecos-frontera'].verbe;assert.ok(V.dadosExtraBrutos(a,m)>V.dadosExtra(a,m));assert.equal(V.dadosExtra(a,m),limiteDadosExtra(1));
  const t=tec('pulso-curacion-red'),data=V.datosItem(a,t),act=Object.values(data.system.activities)[0];assert.match(act.healing.bonus,/floor\(\(@prof\) \/ 6\)/);
});
test('los rituales no se convierten en una acción al conservar un cultivo antiguo de rapidez',()=>{
  const t=tec('pacto-reanimacion'),a=actor(20,{cultivos:{[t.id]:{nivel:1,mejoras:['rapida']}}});
  assert.deepEqual(V.datosItem(a,t).system.activation,t.item.system.activation);
});
test('los aumentos de alcance y área tienen máximos conjuntos',()=>{
  const t=tec('fuego-gran-soplo'),a=actor(20,{dotes:['alcance-largo','area-ancha'],cultivos:{[t.id]:{nivel:2,mejoras:['area','area']}}}),data=V.datosItem(a,t);
  const f=data.system.target.template.units==='ft'?1/0.3:1;
  assert.ok(data.system.target.template.size<=t.item.system.target.template.size*f*2+0.01);
});
test('Dos hilos permite dos concentraciones con una menor y bloquea dos altas o una tercera',()=>{
  assert.equal(validarConcentraciones({existentes:[{id:'a',grado:7}],grado:6,nivel:16,doble:true}).ok,false);
  assert.equal(validarConcentraciones({existentes:[{id:'a',grado:7}],grado:3,nivel:16,doble:true}).ok,true);
  assert.equal(validarConcentraciones({existentes:[{id:'a',grado:7}],grado:5,nivel:17,doble:true}).ok,true);
  assert.equal(validarConcentraciones({existentes:[{id:'a',grado:1},{id:'b',grado:2}],grado:1,nivel:20,doble:true}).ok,false);
});
test('el consumo nativo rechaza una concentración incompatible y conserva la reserva',async()=>{
  const a=actor(16,{dotes:[...todas,'dos-hilos'],tradiciones:['sabio-sapo']});const it=new MockItem({type:'spell',system:{level:7}},a);a.items.push(it);
  a.effects.push(new MockEffect({statuses:['concentrating'],flags:{dnd5e:{item:{id:it.id}}}},a));
  assert.equal(await usar(a,'quietud-modo-sapo'),false);assert.equal(V.estado(a).valor,150);assert.match(notices.at(-1).msg,/Dos hilos/);
});
test('el efecto propio se liga a la concentración de su técnica y no a otra anterior',async()=>{
  const a=actor(),it=agregar(a,'quietud-modo-sapo');
  const vieja=new MockEffect({statuses:['concentrating'],flags:{dnd5e:{item:{id:'otra'}}}},a),nueva=new MockEffect({statuses:['concentrating'],flags:{dnd5e:{item:{id:it.id}}}},a);
  a.effects.push(vieja,nueva);await V._prueba.despuesDeUsar({item:it,actor:a},{ecosVerbe:{nonce:'prueba',despues:10,grado:5}});
  assert.equal(a.effects.find(e=>e.getFlag('ecos-frontera','verbe')?.modo==='sabio').getFlag('ecos-frontera','verbe').deConcentracion,nueva.id);
});
test('las dotes activables pagan una vez, no aceptan deuda y duran lo anunciado',async()=>{
  const a=actor(20,{dotes:['guardia-concentrada','concentracion-hierro'],valor:8});await V._prueba.asegurarRasgos(a);
  const it=a.items.find(i=>i.getFlag('ecos-frontera','verbe')?.dote==='guardia-concentrada'),act=Object.values(it.system.activities)[0];
  assert.equal(act.activation.override,true);assert.equal(act.activation.type,'bonus');assert.equal(act.target.affects.type,'self');
  assert.ok(await poder(a,'guardia-concentrada'));assert.equal(V.estado(a).valor,6);assert.ok(a.effects.some(e=>e.duration.seconds===18));
  assert.equal(await poder(a,'guardia-concentrada'),false);await V.alDescansar(a,{}, {type:'short'});assert.equal(await poder(a,'guardia-concentrada'),false);
  await V.alDescansar(a,{}, {type:'long'});V.estado(a).valor=-1;assert.equal(await poder(a,'guardia-concentrada'),false);
});
test('Renovación del centenar exige dieciséis puntos y los consume sin devolverlos',async()=>{
  const a=actor(16,{valor:50,reservaSellada:15,dotes:[...todas,'control-fino']});
  assert.equal(await usar(a,'pulso-renovacion-centenar'),false);assert.equal(V.estado(a).valor,50);
  V.estado(a).reservaSellada=16;const uso=await usar(a,'pulso-renovacion-centenar');assert.ok(uso);
  assert.equal(V.estado(a).reservaSellada,0);assert.equal(V.estado(a).valor,50-uso.costo);
});
test('Corona requiere realmente el avatar y el modo compuesto conserva sus claves de energía',()=>{
  const m=tec('quietud-brazos-corona').item.flags['ecos-frontera'].verbe;
  assert.equal(accesoShinobi(m,{estado:{},herencia:'Savia en las venas',modos:['sabio']},true).ok,false);
  assert.equal(accesoShinobi(m,{estado:{},herencia:'Savia en las venas',modos:['sabio','mil-brazos']},true).ok,true);
  assert.ok(tec('vasija-modo-combinado').item.effects.some(e=>e.flags['ecos-frontera'].verbe.modosConcedidos.includes('sabio')));
});
test('recuperación activable paga deuda a 2:1 y comparte el presupuesto breve',async()=>{
  const a=actor(11,{dotes:['ultima-gota','segundo-aliento'],valor:-5});await V._prueba.asegurarRasgos(a);
  assert.ok(await poder(a,'ultima-gota'));assert.equal(V.estado(a).valor,-4);assert.equal(V.estado(a).recResto,1);
  assert.ok(await poder(a,'segundo-aliento'));assert.equal(V.estado(a).valor,-2);assert.equal(V.estado(a).recCortos,6);
});
test('refrescar dotes conserva sus usos nativos y no duplica rasgos',async()=>{
  const a=actor(20,{dotes:['segundo-aliento']});await V._prueba.asegurarRasgos(a);const it=a.items.find(i=>i.getFlag('ecos-frontera','verbe')?.dote==='segundo-aliento');it.system.uses.spent=1;
  it.flags['ecos-frontera'].verbe.firma='vieja';await V._prueba.asegurarRasgos(a);
  assert.equal(a.items.filter(i=>i.getFlag('ecos-frontera','verbe')?.dote==='segundo-aliento').length,1);assert.equal(it.system.uses.spent,1);
});
test('refrescar migra requisitos nuevos aunque solo cambien metadatos del catálogo',async()=>{
  const a=actor(),it=agregar(a,'forma-esfera'),copia=structuredClone(D);
  copia.tecnicas.find(t=>t.id==='forma-esfera').item.flags['ecos-frontera'].verbe.acceso={hito:'campo-preparado'};
  V.usarDatos(copia,'activo');await V.refrescar(a);
  assert.equal(it.getFlag('ecos-frontera','verbe').acceso.hito,'campo-preparado');assert.equal(await usar(a,'forma-esfera'),false);
});
test('reorientar un cultivo requiere DM y conserva exactamente el gasto y su registro',async()=>{
  const a=actor(11,{dotes:[],gastados:3,cultivos:{'forma-esfera':{nivel:1,mejoras:['dado']}},compras:[{id:'c',tipo:'cultivo',datos:{tecId:'forma-esfera',nivel:1,mejora:'dado'},trazos:3}]});agregar(a,'forma-esfera');
  game.user=game.users.get('player');assert.equal(await V.reorientarCultivo(a,'forma-esfera','gestos'),false);
  game.user=game.users.get('gm');assert.equal(await V.reorientarCultivo(a,'forma-esfera','gestos'),true);
  assert.equal(V.estado(a).gastados,3);assert.equal(V.estado(a).compras[0].datos.mejora,'gestos');assert.deepEqual(V.estado(a).cultivos['forma-esfera'].mejoras,['gestos']);
});
test('la migración conserva compras y descuenta los usos ya gastados de las cuotas nuevas',async()=>{
  const a=actor(20,{progresionVersion:0,dotes:[],gastados:40,usosAltos:{'forma-ultima':true}});agregar(a,'forma-ultima');
  await V._prueba.asegurarRasgos(a);assert.equal(V.estado(a).gastados,40);assert.deepEqual(V.estado(a).poderesLegados,['forma-ultima']);assert.equal(V.estado(a).cuotasPoder.trascendentes,1);
});
test('el límite por turno permite dos técnicas, una alta y la acción separada de las réplicas',()=>{
  let e={};const uno=permisoTurno(6,{combate:'c',estado:e});assert.ok(uno.ok);e=uno.cambios;
  assert.equal(permisoTurno(7,{combate:'c',estado:e}).ok,false);
  const dos=permisoTurno(2,{combate:'c',estado:e});assert.ok(dos.ok);
  assert.equal(permisoTurno(1,{combate:'c',estado:dos.cambios}).ok,false);
  assert.equal(permisoTurno(1,{combate:'c',estado:dos.cambios,reaccion:true}).ok,true);
  assert.equal(permisoTurno(2,{combate:'c',estado:dos.cambios,replica:true}).ok,true);
});
test('una tercera técnica del turno se rechaza sin cobrar y el turno siguiente recupera las acciones',async()=>{
  const a=actor();game.combat={started:true,id:'c'};assert.ok(await usar(a,'fuego-aliento'));assert.ok(await usar(a,'forma-esfera'));
  const antes=V.estado(a).valor;assert.equal(await usar(a,'rayo-arco'),false);assert.equal(V.estado(a).valor,antes);
  await V._prueba.inicioDeTurno({combatant:{actor:a}});assert.ok(await usar(a,'rayo-arco'));
});

test('repartirse cuesta: +1 Trazo por rango desde la tercera rama y +2 desde la quinta', () => {
  const a = new MockActor(10, { principal: 'forma', ordenRamas: ['forma', 'cuerpo', 'velo', 'pulso', 'hilo'], rangos: { forma: 1, cuerpo: 1, velo: 1, pulso: 1, hilo: 1 } });
  const base = n => D.rangos[n].trazos;
  assert.equal(V.costoRango(a, 'forma', 2), base(2) - 1);
  assert.equal(V.costoRango(a, 'cuerpo', 2), base(2));
  assert.equal(V.costoRango(a, 'velo', 2), base(2) + 1);
  assert.equal(V.costoRango(a, 'pulso', 2), base(2) + 1);
  assert.equal(V.costoRango(a, 'hilo', 2), base(2) + 2);
  assert.equal(V.costoRango(a, 'sello', 1), base(1) + 2); // una rama nueva va al final: sexta
  assert.deepEqual([0, 1, 2, 3, 4, 7].map(V.recargoRama), [0, 0, 1, 1, 2, 2]);
});
