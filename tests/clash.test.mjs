import test,{beforeEach} from 'node:test';
import assert from 'node:assert/strict';
import {readCatalog} from '../tools/catalog.mjs';
import {tecnicaChocable} from '../scripts/verbe-clash.js';
import {MockActor,MockItem,resetEnvironment} from './helpers/foundry.mjs';
import * as V from '../scripts/verbe.js';
const D=readCatalog();
beforeEach(()=>{resetEnvironment();game.users.get('player').active=false;V.usarDatos(D,'activo');});
function agregar(a,id){const t=D.tecnicas.find(t=>t.id===id),i=new MockItem(V.datosItem(a,t),a);a.items.push(i);return i;}
const actor=()=>new MockActor(11,{valor:100,nats:['fuego','agua','viento'],principal:'forma',rangos:{forma:3}});
function flujo(a,b,id='fuego-aliento') {const item=agregar(a,id);return {actor:a,item,activity:Object.values(item.system.activities)[0],targets:new Set([{actor:b,name:b.name}])};}
test('marcar una hoja despierta basta; curación, utilidad y actores dormidos no son choques',async()=>{
  const a=actor(),b=actor();const wf=flujo(a,b);assert.equal(tecnicaChocable(wf.item,wf.activity),true);
  assert.equal(tecnicaChocable(agregar(b,'forma-andar')),false);assert.equal(tecnicaChocable(agregar(b,'pulso-cerrar')),false);
  V.estado(b).despierto=false;let preguntas=0;foundry.applications.api.DialogV2.wait=async()=>{preguntas++;return 'recibir';};
  await V._prueba.choqueAutomatico(wf);assert.equal(preguntas,0);
});
test('la contratécnica paga sin usar reacción ni la cuota de acciones ordinarias',async()=>{
  const a=actor();agregar(a,'fuego-aliento');game.combat={started:true,id:'combate'};
  Object.assign(V.estado(a),{reaccionUsada:true,turnoTecnicas:{combate:'combate',usos:2,altas:1}});
  assert.ok(V._prueba.opcionesChoque(a).length);const antes=V.estado(a).valor;
  const r=await V._prueba.pagarContraTecnica(a,'fuego-aliento',1);assert.ok(r);assert.equal(V.estado(a).valor,antes-r.costo);
  assert.equal(V.estado(a).reaccionUsada,true);assert.equal(V.estado(a).turnoTecnicas.usos,2);
});
test('se ofrece una sola vez por workflow aunque varios hooks coincidan y el empate protege solo al defensor',async()=>{
  const a=actor(),b=actor(),c=actor();agregar(b,'fuego-aliento');const wf=flujo(a,b);wf.targets.add({actor:c});
  let preguntas=0;foundry.applications.api.DialogV2.wait=async cfg=>{preguntas++;return cfg.window.title.includes(b.name)&&preguntas===1?'fuego-aliento|1':'recibir';};
  await Promise.all([V._prueba.choqueAutomatico(wf),V._prueba.choqueAutomatico(wf)]);
  assert.equal(preguntas,2);assert.equal(wf.targets.size,1);assert.equal([...wf.targets][0].actor,c);
});
test('recibir, técnica inexistente y grado manipulado no gastan energía ni cancelan el ataque',async()=>{
  const a=actor(),b=actor();agregar(b,'fuego-aliento');const antes=V.estado(b).valor;
  for(const eleccion of ['recibir','no-existe|1','fuego-aliento|11']){
    foundry.applications.api.DialogV2.wait=async()=>eleccion;const wf=flujo(a,b);await V._prueba.choqueAutomatico(wf);assert.equal(wf.targets.size,1);
  }assert.equal(V.estado(b).valor,antes);
});
test('Sustitución se resuelve primero y evita tanto el choque como el daño contra ese token',async()=>{
  const a=actor(),b=actor();agregar(b,'forma-sustitucion');agregar(b,'fuego-aliento');const wf=flujo(a,b);wf.attackRoll={total:99,isCritical:false};
  const pasos=[];foundry.applications.api.DialogV2.wait=async cfg=>{pasos.push(cfg.window.title);return 'forma-sustitucion';};
  await V._prueba.enfrentamientoAutomatico(wf);assert.equal(wf.targets.size,0);assert.equal(pasos.length,1);assert.match(pasos[0],/defiendes/);
});
test('flujo nativo pausa su continuación y conserva el coste ya pagado cuando el choque anula',async()=>{
  const a=actor(),b=actor();agregar(b,'fuego-aliento');const wf=flujo(a,b);game.user.targets=wf.targets;
  let continuaciones=0;const ac={...wf.activity,item:wf.item,actor:a,_triggerSubsequentActions:async()=>continuaciones++};
  foundry.applications.api.DialogV2.wait=async()=> 'fuego-aliento|1';
  await V._prueba.choqueNativo(ac,{},{});assert.equal(continuaciones,0);
});
test('Ayuda rápida explica disparador, reacción, coste y orden sin mostrar controles del DM',async()=>{
  game.user=game.users.get('player');const a=actor(),p=new V.PanelVerbe(a);p.pestana='guia';const html=await p._renderHTML();
  assert.match(html,/¿Cómo chocan dos técnicas/);assert.match(html,/Basta una marca/);assert.match(html,/aunque ya haya gastado su reacción/);assert.doesNotMatch(html,/panteonDM/);
});
