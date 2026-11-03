import test, {beforeEach} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {readCatalog,validateCatalog} from '../tools/catalog.mjs';
import {accesoShinobi,dividirReserva,depositoReserva} from '../scripts/verbe-shinobi.js';
import {MockActor,MockItem,resetEnvironment} from './helpers/foundry.mjs';
import * as V from '../scripts/verbe.js';
const D=readCatalog(), tec=id=>D.tecnicas.find(t=>t.id===id);
beforeEach(()=>{resetEnvironment();V.usarDatos(D,'activo');});
const actor=(patch={})=>new MockActor(20,{valor:80,principal:'umbral',rangos:Object.fromEntries(D.ramas.map(r=>[r.id,5])),...patch});
const agregar=(a,id)=>{const it=new MockItem(V.datosItem(a,tec(id)),a);a.items.push(it);return it;};
async function usar(a,id,extra={}){
  const it=a.items.find(i=>i.getFlag('ecos-frontera','verbe')?.id===id)??agregar(a,id),activity={item:it,actor:a},usage={...extra},updates={};
  if(V.alConsumir(activity,usage,{},updates)===false)return false;
  await a.update(updates.actor);await V._prueba.despuesDeUsar(activity,usage);return usage.ecosVerbe;
}
test('repertorio: conserva 401, añade 353 y más del 90% queda fuera de Forma',()=>{
  const nuevos=D.tecnicas.filter(t=>t.item.flags['ecos-frontera'].verbe.shinobi);
  assert.equal(D.tecnicas.length,754+(D.divinidad?.nuevas??0)+(D.vida?.nuevas??0)+(D.entrenamiento?.nuevas??0)+(D.contra?.nuevas??0));assert.equal(nuevos.length,353);
  assert.ok(nuevos.filter(t=>t.rama!=='forma').length/nuevos.length>.9);
  assert.deepEqual(validateCatalog(D),[]);
});
test('referencias, requisitos, dados, grados y unidades nativas son coherentes en toda la expansión',()=>{
  const nativos=new Set();
  for(const t of D.tecnicas.filter(t=>t.item.flags['ecos-frontera'].verbe.shinobi)){
    const m=t.item.flags['ecos-frontera'].verbe,a=m.acceso;
    assert.equal(t.origen.obra,"Nimerios",t.id);assert.ok(t.alias.includes(t.origen.nombre));
    for(const [campo,lista,clave]of [['tradicion',D.tradicionesShinobi,'id'],['hito',D.hitosShinobi,'id'],['herencia',D.linajes,'req'],['artefacto',D.artefactosShinobi,'id'],['bestia',D.bestiasShinobi,'id']])
      if(a[campo])assert.ok(lista.some(x=>x[clave]===a[campo]),`${t.id}: ${campo}`);
    if(a.ojo)assert.ok(D.miradas.some(x=>x.id===a.ojo.id&&x.etapas.length>=a.ojo.etapa),t.id);
    if(t.previa)assert.ok(tec(t.previa),t.id);
    assert.ok(['inst','round','minute','hour','day'].includes(t.item.system.duration.units),t.id);
    for(const x of Object.values(t.item.system.activities)){
      assert.match(x._id,/^[a-f0-9]{16}$/);assert.ok(!nativos.has(x._id),t.id);nativos.add(x._id);
      if(x.save)assert.ok(x.save.ability.every(a=>['str','dex','con','int','wis','cha'].includes(a)),t.id);
      for(const p of [x.healing,...(x.damage?.parts??[])].filter(Boolean)){assert.ok(Number.isInteger(p.number)&&p.number>0,t.id);assert.ok([4,6,8,10,12].includes(p.denomination),t.id);}
    }
    if(t.g>=6)assert.equal(t.item.system.uses.max,'1',t.id);
  }
});
test('no hay ciclos entre técnicas previas',()=>{
  const visitar=(id,camino=[])=>{assert.ok(!camino.includes(id),camino.join(' > '));const t=tec(id);if(t?.previa)visitar(t.previa,[...camino,id]);};
  for(const t of D.tecnicas)visitar(t.id);
});
test('aprender no exige activar el ojo; usar sí exige ojo y etapa efectivos',()=>{
  const m={acceso:{ojo:{id:'aster',etapa:4}}},c={estado:{miradas:{aster:4}}};
  assert.equal(accesoShinobi(m,c).ok,true);assert.equal(accesoShinobi(m,c,true).ok,false);
  assert.equal(accesoShinobi(m,{...c,ojosAbiertos:['aster']},true).ok,true);
  assert.equal(accesoShinobi(m,{estado:{miradas:{aster:3}},ojosAbiertos:['aster']}).ok,false);
});
test('abrir los nuevos ojos no exige tenerlos ya abiertos',async()=>{
  for(const id of ['orbe','carmesi','brasa']){
    const a=actor({miradas:{[id]:1},linaje:id,fuerza:'plena'});
    assert.ok(await usar(a,`mirada-${id}-abrir`),id);
    assert.ok(a.effects.some(e=>e.getFlag('ecos-frontera','verbe')?.ojo===id),id);
  }
});
test('tradición, herencia, hito y huésped son requisitos distintos',()=>{
  assert.equal(accesoShinobi({acceso:{tradicion:'sombra'}},{estado:{tradiciones:['sombra']}}).ok,true);
  assert.equal(accesoShinobi({acceso:{herencia:'Hueso vivo'}},{estado:{tradiciones:['sombra']}}).ok,false);
  assert.equal(accesoShinobi({acceso:{hito:'seis-caminos'}},{estado:{}}).ok,false);
  assert.equal(accesoShinobi({acceso:{bestia:'kurama',vinculo:3}},{estado:{vasija:{bestia:'kurama',vinculo:2}}}).ok,false);
});
test('un artefacto o modo se comprueba también al usar una técnica aprendida',()=>{
  const m={acceso:{artefacto:'totsuka',modo:'susanoo'}};
  assert.equal(accesoShinobi(m,{estado:{}},false).ok,true);
  assert.equal(accesoShinobi(m,{estado:{},artefactos:['totsuka']},true).ok,false);
  assert.equal(accesoShinobi(m,{estado:{},artefactos:['totsuka'],modos:['susanoo']},true).ok,true);
});
test('el desgaste y el sacrificio ocular persisten; la etapa eterna solo evita desgaste nuevo',()=>{
  const m={acceso:{ojo:{id:'aster',etapa:4}},desgasteOjo:'aster'},c={estado:{miradas:{aster:4},desgasteOcular:{aster:6}},ojosAbiertos:['aster']};
  assert.equal(accesoShinobi(m,c,true).ok,false);c.estado.miradas.aster=5;assert.equal(accesoShinobi(m,c,true).ok,true);
  c.estado.ojosSacrificados={aster:2};assert.equal(accesoShinobi(m,c,true).ok,false);
});
test('dividir clones conserva exactamente la energía después del coste y no crea deuda',()=>{
  for(let v=0;v<100;v++)for(let n=1;n<7;n++){
    const r=dividirReserva(v,4,n);assert.equal(r.original+r.comprometido,Math.max(0,v-4));assert.ok(r.porCuerpo>=0);
  }
  assert.equal(dividirReserva(-5,2,3).comprometido,0);
});
test('los clones reservan un saldo real separado y no pueden crear otra formación desde él',async()=>{
  const a=actor({valor:30});const r=await usar(a,'forma-replica-solida');assert.ok(r);
  const e=V.estado(a);assert.equal(e.valor+e.reservaReplicas,30-r.costo);assert.ok(e.reservaReplicas>0);
  assert.equal(await usar(a,'forma-replica-solida',{ecosReplica:true}),false);
  assert.match(tec('forma-replica-solida').texto,/grado 0–2/);assert.doesNotMatch(tec('forma-replica-solida').texto,/No usa técnicas/);
});
test('todas las copias comparten una acción de técnica y gastan solo el saldo dividido',async()=>{
  const a=actor({valor:30});await usar(a,'forma-replica-solida');const antes=V.estado(a).valor,pool=V.estado(a).reservaReplicas;
  game.combat={started:true};const uso=await usar(a,'fuego-aliento',{ecosReplica:true});assert.ok(uso);
  assert.equal(V.estado(a).valor,antes);assert.equal(V.estado(a).reservaReplicas,pool-uso.costo);
  assert.equal(await usar(a,'fuego-aliento',{ecosReplica:true}),false);
  await V._prueba.inicioDeTurno({combatant:{actor:a}});assert.ok(await usar(a,'fuego-aliento',{ecosReplica:true}));
});
test('disipar la formación borra su saldo; una formación vieja no borra la actual',async()=>{
  const a=actor();await usar(a,'forma-replica-solida');const fx=a.effects.find(x=>x.getFlag('ecos-frontera','verbe')?.replicas);
  await V._prueba.alQuitarEfecto({parent:a,getFlag:()=>({replicas:true,nonce:'viejo'})},{});assert.ok(V.estado(a).reservaReplicas>0);
  await V._prueba.alQuitarEfecto(fx,{});assert.equal(V.estado(a).reservaReplicas,0);
});
test('un clon no genera reservas mediante utilidad ni usa técnicas de grado alto',async()=>{
  const a=actor();await usar(a,'forma-replica-solida');
  assert.equal(await usar(a,'forma-andar',{ecosReplica:true}),false);
  assert.equal(await usar(a,'forma-esfera-mayor',{ecosReplica:true}),false);
});
test('depósitos: solo enteros positivos existentes, máximo dos por nivel',()=>{
  assert.deepEqual(depositoReserva({valor:20,almacenado:2,cantidad:8,nivel:5}),{ok:true,valor:12,almacenado:10});
  for(const cantidad of [-1,0,1.5,21,Infinity])assert.equal(depositoReserva({valor:20,almacenado:0,cantidad,nivel:5}).ok,false);
});
test('almacenar descuenta al original y exige aprender el sello',async()=>{
  const a=actor({valor:20});assert.equal(await V.almacenarVerbe(a,5),false);agregar(a,'pulso-centenar-sello');
  assert.equal(await V.almacenarVerbe(a,5),true);assert.equal(V.estado(a).valor,15);assert.equal(V.estado(a).reservaSellada,5);
});
test('retirar una tradición impide usar su técnica ya aprendida',async()=>{
  const t=D.tecnicas.find(t=>t.item.flags['ecos-frontera'].verbe.acceso?.tradicion==='sombra');
  const a=actor();assert.equal(await usar(a,t.id),false);
  V.estado(a).tradiciones=['sombra'];assert.ok(await usar(a,t.id));
  V.estado(a).tradiciones=[];assert.equal(await usar(a,t.id),false);
});
test('un permiso ritual sirve una vez y un descanso largo no vuelve a autorizarlo',async()=>{
  const t=tec('pulso-regeneracion-colectiva');
  assert.ok(t);const a=actor({tradiciones:['medicina-avanzada']});agregar(a,t.id);
  assert.equal(await usar(a,t.id),false);assert.equal(await V.concederShinobi(a,'ritual',t.id),true);
  assert.ok(await usar(a,t.id));assert.equal(V.estado(a).permisosRituales[t.id],false);
  await V.alDescansar(a,{}, {type:'long'});assert.equal(await usar(a,t.id),false);
});
test('la familia de usos se repone solo en descanso largo',async()=>{
  const a=actor({usosFamilia:{'avatar-ocular':true}});
  await V.alDescansar(a,{}, {type:'short'});assert.equal(V.estado(a).usosFamilia['avatar-ocular'],true);
  await V.alDescansar(a,{}, {type:'long'});assert.equal(V.estado(a).usosFamilia['avatar-ocular'],false);
});
test('un jugador no se concede tradiciones, hitos, bestias, permisos o reliquias',async()=>{
  const a=actor();game.user=game.users.get('player');
  for(const [c,v]of [['tradicion','sombra'],['hito',D.hitosShinobi[0].id],['vasija','kurama'],['ritual','x'],['ocular','aster']])assert.equal(await V.concederShinobi(a,c,v),false);
  assert.equal(await V.concederArtefacto(a,'samehada'),false);assert.equal(a.items.length,0);
});
test('transferir descuenta del origen y paga la deuda del receptor a 2:1',async()=>{
  const a=actor({valor:12}),b=actor({valor:-4});assert.equal(await V.transferirVerbe(a,b,6),true);
  assert.equal(V.estado(a).valor,6);assert.equal(V.estado(b).valor,-1);
  assert.equal(await V.transferirVerbe(a,b,7),false);
});
test('transferencia fallida compensa al donante y no duplica energía',async()=>{
  const a=actor({valor:12}),b=actor({valor:0});b.failNextUpdate=true;
  await assert.rejects(V.transferirVerbe(a,b,4));assert.equal(V.estado(a).valor,12);assert.equal(V.estado(b).valor,0);
});
test('una transferencia no pisa el gasto de una actividad nativa pendiente',async()=>{
  const a=actor({valor:12}),b=actor({valor:0}),it=agregar(a,'fuego-aliento'),usage={},updates={};
  assert.notEqual(V.alConsumir({item:it,actor:a},usage,{},updates),false);
  assert.equal(await V.transferirVerbe(a,b,4),false);assert.equal(V.estado(a).valor,12);assert.equal(V.estado(b).valor,0);
  await a.update(updates.actor);await V._prueba.despuesDeUsar({item:it,actor:a},usage);assert.equal(V.estado(a).valor,12-usage.ecosVerbe.costo);
});
test('transferencias opuestas concurrentes no pierden cambios ni se bloquean',async()=>{
  const a=actor({valor:12}),b=actor({valor:12});
  await Promise.all([V.transferirVerbe(a,b,4),V.transferirVerbe(b,a,3)]);
  assert.equal(V.estado(a).valor,11);assert.equal(V.estado(b).valor,13);
});
test('la reliquia se concede una vez y no enseña gratis sus técnicas',async()=>{
  const a=actor();assert.equal(await V.concederArtefacto(a,'samehada'),true);assert.equal(await V.concederArtefacto(a,'samehada'),false);
  assert.equal(a.items.length,1);assert.equal(a.items[0].system.equipped,true);assert.equal(a.items[0].getFlag('ecos-frontera','verbe').id,undefined);
});
test('migrar la antigua puerta fatal conserva gasto y compra y ocurre solo una vez',async()=>{
  const a=actor({cerrojos:7,gastados:38,compras:[{id:'fatal',tipo:'cerrojo',datos:{n:7},trazos:11}]});
  await V._prueba.asegurarRasgos(a);assert.equal(V.estado(a).cerrojos,8);assert.equal(V.estado(a).gastados,38);assert.equal(V.estado(a).compras[0].datos.n,8);
  const n=a.updates.length;await V._prueba.asegurarRasgos(a);assert.equal(a.updates.length,n);
});
test('el séptimo nuevo no mata; el octavo informa el precio fatal al DM',async()=>{
  const a=actor();const e=n=>({parent:a,getFlag:()=>({cerrojo:n})});
  await V._prueba.alQuitarEfecto(e(7),{});assert.equal(a.system.attributes.hp.value,100);assert.equal(a.system.attributes.exhaustion,3);
  await V._prueba.alQuitarEfecto(e(8),{});assert.equal(a.system.attributes.hp.value,0);
});
test('Tormenta pide Agua y Rayo; las naturalezas de sangre no se ocultan tras dos elementos',()=>{
  assert.deepEqual(D.combos.tormenta.de,['agua','rayo']);const a=actor({nats:['fuego','agua']});
  const sangre=D.tecnicas.find(t=>t.nat?.startsWith('sangre:'));assert.ok(sangre);assert.equal(V.naturalezaVisible(a,sangre),true);
});
test('los paneles de huésped, ojos, depósito y clones se renderizan y separan permisos',async()=>{
  const a=actor({linaje:'aster',fuerza:'plena',miradas:{aster:4},vasija:{bestia:'kurama',vinculo:3},reservaReplicas:12});
  agregar(a,'fuego-aliento');agregar(a,'pulso-centenar-sello');
  await a.createEmbeddedDocuments('ActiveEffect',[{flags:{'ecos-frontera':{verbe:{replicas:true}}}}]);
  const p=new V.PanelVerbe(a);p.pestana='dm';let html=await p._renderHTML();assert.match(html,/shinobiTradicion/);assert.match(html,/shinobiBestia/);assert.match(html,/shinobiRitual/);
  game.user=game.users.get('player');p.pestana='jugar';html=await p._renderHTML();assert.match(html,/Usar desde réplica/);assert.match(html,/12 Verbe/);assert.doesNotMatch(html,/shinobiDM/);
  p.pestana='ramas';html=await p._renderHTML();assert.match(html,/Sello del centenar/);assert.match(html,/Aurenox/);
});
test('la ficha explica requisitos estructurados aunque ya se cumplan',async()=>{
  const a=actor({linaje:'aster',fuerza:'plena',miradas:{aster:4}}),p=new V.PanelVerbe(a);let config;
  foundry.applications.api.DialogV2.wait=c=>{config=c;return Promise.resolve();};
  V.PanelVerbe.DEFAULT_OPTIONS.actions.ficha.call(p,{preventDefault(){}},{dataset:{id:'mirada-aster-luna'}});
  assert.match(config.content,/etapa 4/);assert.match(config.content,/abrir para usar/);assert.match(config.content,/Luna de la pesadilla/);
});
test('las copias embebidas del notificador son idénticas al archivo fuente',()=>{
  const normal=s=>s.replaceAll('\r\n','\n').trim();const source=normal(fs.readFileSync(new URL('../tools/windows/Ecos-Notificar.ps1',import.meta.url),'utf8'));
  for(const f of ['Ecos-Actualizar.ps1','Ecos-Autoactualizacion.bat']){
    const s=normal(fs.readFileSync(new URL('../tools/windows/'+f,import.meta.url),'utf8'));
    const embedded=s.match(/\$wrapper = @'\n([\s\S]*?)\n'@/);assert.ok(embedded,f);assert.equal(normal(embedded[1]),source,f);
  }
});
