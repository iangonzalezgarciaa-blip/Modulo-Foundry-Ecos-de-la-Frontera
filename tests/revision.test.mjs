import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { MockActor, MockItem, resetEnvironment, events, settings } from './helpers/foundry.mjs';
import { readCatalog } from '../tools/catalog.mjs';
import { presupuestoCorto, recuperacionDGLarga, ajustarRecuperacionDG } from '../scripts/rest-core.js';
import { opcionesCultivo } from '../scripts/verbe-training.js';
import { FORMULARIO_UNIVERSAL } from '../scripts/verbe-authoring.js';
import * as V from '../scripts/verbe.js';
const D = readCatalog(), tec = id => D.tecnicas.find(t=>t.id===id);
beforeEach(()=>{resetEnvironment();V.usarDatos(D,'activo');});
const aprenderGratis = async (a,id)=>{await V.aprender(a,tec(id),{gratis:true});return a.items.find(i=>i.getFlag('ecos-frontera','verbe')?.id===id);};
const formulario = patch=>({...FORMULARIO_UNIVERSAL,nombre:'Hilo de prueba',efecto:'Una técnica de prueba con resolución concreta.',dadosN:0,tirada:'ninguna',...patch});

test('ni un corto ni una cadena de cortos regenera más dados que un largo, en todos los niveles y ajustes',()=>{
  for(let n=1;n<=20;n++)for(const modo of ['cuarto','mitad','todos']) {
    const largo=recuperacionDGLarga(n,modo);let usados=0;
    for(let i=0;i<30;i++) usados=presupuestoCorto(largo,usados,2).usado;
    assert.ok(usados < largo,`${n}/${modo}`);
    assert.equal(usados,Math.floor(largo/2));
  }
  assert.equal(presupuestoCorto(recuperacionDGLarga(1),0,2).cantidad,0);
});
test('Respiro, Aliento e intemperie comparten un presupuesto persistente menor que el largo',async()=>{
  for(const level of [1,5,11,16,18,20]) for(const dotes of [[],['respiro','innato-aliento-2'],['sueno-reparador','hijo-santuario']]) {
    const a=new MockActor(level,{valor:0,dotes});const largo=V.recuperacionLargaVerbe(a);
    for(let i=0;i<15;i++)await V.alDescansar(a,{}, {type:'short',ecos:{intemperie:true}});
    await V.alDescansar(a,{}, {type:'short'});
    assert.ok(V.estado(a).valor < largo,`${level}/${dotes}`);
    assert.equal(V.estado(a).recCortos,V.presupuestoBreveVerbe(a).limite);
    const antes=V.estado(a).valor;
    await V.alDescansar(a,{}, {type:'long'});
    assert.equal(V.estado(a).recCortos,0);
    assert.equal(V.estado(a).valor,Math.min(V.maxVerbe(a),antes+largo));
  }
});
test('un corto no renueva usos altos, Cerrojos ni poderes diarios',async()=>{
  const a=new MockActor(11,{valor:0,reservaUsada:true,despertarLibre:true,usosAltos:{x:true},cerrojosHoy:{veces:2}});
  await V.alDescansar(a,{}, {type:'short'});
  assert.equal(V.estado(a).usosAltos.x,true);assert.equal(V.estado(a).reservaUsada,true);
  assert.equal(V.estado(a).cerrojosHoy.veces,2);assert.equal(V.estado(a).despertarLibre,true);
});
test('Aliento solo recupera al gastar realmente un dado y no rebasa el presupuesto compartido',async()=>{
  const a=new MockActor(1,{valor:0,dotes:['innato-aliento-2']});
  const hooks=events.get('dnd5e.rollHitDieV2');
  const preview={subject:a,updates:{actor:{},class:{}}};for(const fn of hooks)fn([],preview);
  assert.equal(preview.updates.actor['flags.ecos-frontera.verbe.valor'],undefined);
  for(let i=0;i<4;i++){
    const datos={subject:a,updates:{actor:{},class:{'system.hd.spent':i+1}}};
    for(const fn of hooks)fn([],datos);await a.update(datos.updates.actor);
  }
  assert.equal(V.estado(a).valor,V.presupuestoBreveVerbe(a).limite);
});
test('al cerrar dos elementos no se prueba otro; la tercera elegida reabre solo ese elemento',async()=>{
  const a=new MockActor(11,{nats:['fuego','agua'],dotes:['tercera-naturaleza']});
  const viento=D.tecnicas.find(t=>t.nat==='viento' && t.g===1);
  assert.equal(V.naturalezaVisible(a,viento),false);assert.equal(V.requisitos(a,viento).ok,false);
  assert.equal(await V.probarNaturaleza(a,viento),false);
  assert.equal(await V.elegirNaturalezaAdicional(a,'tercera','viento'),true);
  assert.equal(V.naturalezaVisible(a,viento),true);
  assert.equal(await V.elegirNaturalezaAdicional(a,'tercera','tierra'),false);
  assert.deepEqual([...V.natsDe(a)].sort(),['agua','fuego','viento']);
});
test('combinación exige dote y pareja conocida y muestra todas sus técnicas',async()=>{
  const a=new MockActor(11,{nats:['fuego','agua'],rangos:{forma:3}});
  assert.equal(await V.elegirNaturalezaAdicional(a,'combo','vapor'),false);
  V.estado(a).dotes=['naturaleza-combinada'];
  assert.equal(await V.elegirNaturalezaAdicional(a,'combo','magma'),false);
  assert.equal(await V.elegirNaturalezaAdicional(a,'combo','vapor'),true);
  assert.equal(await V.elegirNaturalezaAdicional(a,'combo','ceniza'),false);
  const p=new V.PanelVerbe(a);p.pestana='tienda';const html=await p._renderHTML();
  for(const t of D.tecnicas.filter(t=>t.nat==='vapor'))assert.ok(html.includes(`data-id="${t.id}"`),t.id);
});
test('las naturalezas de linaje adicionales no se eliminan ni se sustituyen',()=>{
  const a=new MockActor(11,{linaje:'ignis',fuerza:'plena',nats:['agua']});
  assert.deepEqual([...V.natsDe(a)].sort(),['agua','fuego','tierra','viento']);
});
test('Sustitución no vende dados o CD y sí distancia y reducción del recargo, con costes efectivos',async()=>{
  const a=new MockActor(5,{valor:34});await aprenderGratis(a,'forma-sustitucion');
  const opts=opcionesCultivo(tec('forma-sustitucion'),{},2);
  assert.equal(opts.find(o=>o.id==='dado').ok,false);assert.equal(opts.find(o=>o.id==='cd').ok,false);
  assert.equal(await V.cultivar(a,'forma-sustitucion','dado'),false);
  await V.cultivar(a,'forma-sustitucion','sust-distancia');
  assert.equal(V.estado(a).gastados,1);
  assert.match(V.defensasDisponibles(a,{grado:5})[0].aviso,/4,?\.?5 m/);
  const antes=V.defensasDisponibles(a,{grado:5})[0].costo;
  await V.cultivar(a,'forma-sustitucion','sust-control');
  assert.equal(V.estado(a).gastados,4); // 1 + (segundo nivel 2 + recargo 1)
  assert.equal(V.defensasDisponibles(a,{grado:5})[0].costo,antes-1);
});
test('la mejora válida se refleja en la actividad y no permite exceder sus topes',async()=>{
  const a=new MockActor(11);await aprenderGratis(a,'fuego-aliento');
  const base=V.datosItem(a,tec('fuego-aliento'));
  await V.cultivar(a,'fuego-aliento','dado');
  assert.equal(V.estado(a).gastados,2);
  const nuevo=V.datosItem(a,tec('fuego-aliento'));
  assert.equal(Object.values(nuevo.system.activities)[0].damage.parts[0].number,Object.values(base.system.activities)[0].damage.parts[0].number+1);
});
test('publicar una técnica universal no requiere actor, no cobra ni enseña y respeta sus requisitos',async()=>{
  const a=new MockActor(1,{gastados:0,rangos:{forma:0}});
  const t=await V.publicarTecnicaUniversal(formulario({nivelMin:5,nombre:'Técnica universal'}));
  assert.ok(t.id.startsWith('dm-'));assert.equal(settings.get('capaVExtra').length,1);
  assert.equal(a.items.length,0);assert.equal(V.estado(a).gastados,0);
  assert.equal(V.requisitos(a,t).ok,false);
  game.user=game.users.get('player');assert.equal(V.tecnicaPorId(t.id).n,t.n);
  const p=new V.PanelVerbe(a);p.pestana='tienda';p.filtro.solo=false;
  assert.ok((await p._renderHTML()).includes(t.n));
  assert.equal(await V.publicarTecnicaUniversal(formulario()),false);
  assert.equal(await V.retirarTecnicaUniversal(t.id),false);
});
test('el editor guarda curación, escalado, componentes, duración y conserva el documento al editar',async()=>{
  const t=await V.publicarTecnicaUniversal(formulario({nombre:'Pulso de prueba',rama:'pulso',tipoActividad:'healing',dadosN:1,dadosD:6,bono:2,
    duracionValor:2,duracionUnidad:'round',costoBase:3,material:'Venda de lino',materialConsumido:true,escaladoDados:2,usa:'int',excepcionDM:true,motivoExcepcion:'Curación de prueba con escalado revisado por el DM'}));
  assert.ok(t);const a=new MockActor(5,{rangos:{pulso:2},abiertas:['pulso']});
  await V.aprender(a,t,{gratis:true});const i=a.items[0],id=i.id;
  assert.equal(Object.values(i.system.activities)[0].healing.scaling.number,2);
  assert.equal(i.system.materials.value,'Venda de lino');assert.equal(i.system.duration.units,'round');
  assert.equal(i.system.ability,'int');assert.equal(V.costoUso(a,i.getFlag('ecos-frontera','verbe'),2),4);
  const aid=Object.values(i.system.activities)[0]._id;
  await V.publicarTecnicaUniversal({...t.definicionUniversal,nombre:'Pulso editado'},t.id);
  assert.equal(a.items.length,1);assert.equal(a.items[0].id,id);assert.equal(a.items[0].name,'Pulso editado');
  assert.equal(Object.values(a.items[0].system.activities)[0]._id,aid);
  await V.retirarTecnicaUniversal(t.id);assert.equal(a.items.length,1);assert.equal(V.requisitos(new MockActor(5),V.tecnicaPorId(t.id)).ok,false);
});
test('publicación rechaza datos malformados y exige motivo para excepciones de balance',async()=>{
  assert.equal(await V.publicarTecnicaUniversal(formulario({grado:99,excepcionDM:true,motivoExcepcion:'No permite datos inválidos'})),false);
  assert.equal(await V.publicarTecnicaUniversal(formulario({dadosN:100,tirada:'ataque'})),false);
  assert.equal(await V.publicarTecnicaUniversal(formulario({tiempo:'R',disparador:''})),false);
  assert.equal(settings.get('capaVExtra').length,0);
});
test('la ayuda de sangre es visible al DM y el taller se cierra al jugador',async()=>{
  const a=new MockActor(5,{linaje:'ignis',fuerza:'debil'}),p=new V.PanelVerbe(a);p.pestana='dm';
  const html=await p._renderHTML();assert.match(html,/data-desc="linaje"/);assert.match(html,/Cada subida de rango/);assert.match(html,/Taller del DM/);
  const ed=new V.EditorCatalogoVerbe();assert.match(await ed._renderHTML(),/Estados aplicables/);
  game.user=game.users.get('player');assert.doesNotMatch(await ed._renderHTML(),/data-action="guardar"/);
  assert.equal(V.describir('linaje','ignis',a),'');
});

test('el resultado nativo de un corto conserva curación ya tirada y registra solo los dados repuestos',()=>{
  const a=new MockActor(5);a.type='npc';a.system.attributes.hd={spent:4};
  a.flags['ecos-frontera'].dgRecCortos=1;
  const r={updateData:{'system.attributes.hp.value':80,'system.attributes.hd.spent':0},updateItems:[],deltas:{hitPoints:8,hitDice:-1},dhd:-1};
  ajustarRecuperacionDG(a,r,{largo:false,limiteRec:1});
  assert.equal(r.updateData['system.attributes.hp.value'],undefined);assert.equal(r.dhp,8);
  assert.equal(r.updateData['system.attributes.hd.spent'],3);assert.equal(r.updateData['flags.ecos-frontera.dgRecCortos'],2);
  assert.equal(r.dhd,0);
  const largo={updateData:{'system.attributes.hp.value':100},deltas:{hitPoints:100,hitDice:4}};
  ajustarRecuperacionDG(a,largo,{largo:true,limiteRec:3,maxHitDice:99});
  assert.equal(largo.updateData['system.attributes.hd.spent'],1);assert.equal(largo.dhp,0);
  assert.equal(largo.updateData['flags.ecos-frontera.dgRecCortos'],0);
});
test('los dados de clases múltiples conservan otras recargas del resultado nativo',()=>{
  const a=new MockActor(5);a.system.attributes.hd={classes:[{id:'guerrero'}],createHitDiceUpdates:({maxHitDice},r)=>{r.deltas.hitDice=maxHitDice;r.updateItems.push({_id:'guerrero','system.hd.spent':2});}};
  const r={updateItems:[{_id:'guerrero','system.hd.spent':0,'system.uses.spent':0},{_id:'objeto','system.uses.spent':0}],deltas:{hitPoints:0,hitDice:0}};
  ajustarRecuperacionDG(a,r,{largo:true,limiteRec:3,maxHitDice:1});
  assert.equal(r.dhd,1);assert.equal(r.updateItems.find(i=>i._id==='guerrero')['system.hd.spent'],2);
  assert.equal(r.updateItems.find(i=>i._id==='guerrero')['system.uses.spent'],0);assert.equal(r.updateItems.length,2);
});
test('descansar con Verbe lleno no desperdicia el presupuesto de recuperación breve',async()=>{
  const a=new MockActor(5,{dotes:['respiro'],valor:34});
  await V.alDescansar(a,{}, {type:'short'});assert.equal(V.estado(a).recCortos,0);assert.equal(V.estado(a).respiroUsado,false);
});
test('incluso una herencia con recuperación multiplicada mantiene al corto por debajo del largo',()=>{
  for(const lin of D.linajes)for(const dotes of [[],['sueno-reparador','hijo-santuario']]){
    const a=new MockActor(11,{linaje:lin.id,fuerza:'plena',valor:0,dotes});
    assert.ok(V.presupuestoBreveVerbe(a).limite < Math.min(V.maxVerbe(a),V.recuperacionLargaVerbe(a)));
  }
});
test('los niveles de la escala elegida alcanzan los grados 1, 3, 6, 8, 9 y 11 sin saltar el nivel',()=>{
  for(const [level,grado] of [[1,1],[5,3],[11,6],[16,8],[18,9],[20,11]]){
    const rank=D.rangos.findLastIndex(r=>r.nivel<=level),a=new MockActor(level,{rangos:{forma:rank}});
    assert.equal(V.gradoUsable(a,{rama:'forma',g:0}),grado);
  }
});

test('retirar una dote revierte su elección y conserva combinaciones regaladas por el DM',async()=>{
  const a=new MockActor(13,{nats:['fuego','agua'],dotes:['tercera-naturaleza','naturaleza-combinada','elemento-complejo'],combos:['magma']});
  await V.elegirNaturalezaAdicional(a,'tercera','viento');await V.elegirNaturalezaAdicional(a,'combo','vapor');
  await V.ajustar(a,'dote','elemento-complejo');assert.deepEqual([...V.combosDe(a)],['magma']);
  await V.ajustar(a,'dote','tercera-naturaleza');assert.deepEqual([...V.natsDe(a)].sort(),['agua','fuego']);
});
test('una técnica universal combinada exige la combinación incluso fuera de Forma',async()=>{
  const t=await V.publicarTecnicaUniversal(formulario({rama:'velo',nat:'vapor'}));
  const a=new MockActor(11,{rangos:{velo:3},nats:['fuego','agua']});
  assert.equal(V.requisitos(a,t).ok,false);V.estado(a).combos=['vapor'];assert.equal(V.requisitos(a,t).ok,true);
});
