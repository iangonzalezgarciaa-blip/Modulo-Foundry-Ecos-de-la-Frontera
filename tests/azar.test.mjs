import test,{beforeEach} from 'node:test';
import assert from 'node:assert/strict';
import {MockActor,collection,resetEnvironment,settings,messages,put} from './helpers/foundry.mjs';
import {dadoNatural,tablaAzar,escalaAzar} from '../scripts/azar-core.js';
import {contextoMensaje,proponerAzar,resolverAzar,caducarAzar} from '../scripts/azar.js';
const MOD='ecos-frontera',r=n=>({dice:[{faces:20,results:[{result:n,active:true}]}]});
beforeEach(()=>{resetEnvironment();settings.set('azarActivo',true);game.journal=collection();
 ChatMessage.getSpeakerActor=s=>game.actors.get(s.actor);globalThis.fromUuid=async uuid=>game.actors.find(a=>a.uuid===uuid);
});
function mensaje(a,n=1,tipo='attack',extra={}){const m={id:crypto.randomUUID(),speaker:{actor:a.id},author:game.user,rolls:[r(n)],flags:{dnd5e:{roll:{type:tipo}}},...extra};
 m.getFlag=(mod,k)=>m.flags?.[mod]?.[k];m.setFlag=async(mod,k,v)=>{put(m,`flags.${mod}.${k}`,v);};return m;
}
function combate(a){game.combat={id:'c',round:1,turn:0,started:true,combatant:{actor:a},combatants:collection([{actor:a}])};return game.combat;}
test('solo cuenta el resultado natural activo tras ventaja y repeticiones',()=>{
 const x=r(1);x.dice[0].results.push({result:20,active:false,discarded:true});assert.equal(dadoNatural(x),1);
 x.dice[0].results[0].active=false;x.dice[0].results[1]={result:20,active:true};assert.equal(dadoNatural(x),20);
 assert.equal(dadoNatural({dice:[{faces:6,results:[{result:1}]}]}),null);x.dice[0].results.push({result:3,active:true});assert.equal(dadoNatural(x),null);
});
test('64 filas y escala acotada para todos los niveles; los efectos automáticos son CA, paso, estado o PG temporales',()=>{
 for(let n=1;n<=20;n++){assert.ok(escalaAzar(n).bono<=3);for(const c of ['ataque','salvacion','habilidad','escena'])for(const d of [1,20]){
  const tabla=tablaAzar(c,d,n);assert.equal(tabla.length,8);assert.ok(tabla.every(t=>!/\{bono\}|\{temporal\}/.test(t.texto)));
  for(const t of tabla)if(t.efecto){assert.ok(['ca','paso','estado','pgTemp'].includes(t.efecto.tipo));if(t.efecto.quien)assert.equal(t.efecto.quien,'objetivo');}
 }}assert.deepEqual(tablaAzar('ataque',19),[]);
 assert.equal(tablaAzar('ataque',20,20).find(t=>t.nombre==='Lo derribas').efecto.valor,'prone');
 assert.equal(tablaAzar('ataque',20,20).find(t=>t.nombre==='Te creces').efecto.valor,6);
});
test('3.12: cada 20 de ataque cuenta en combate, aunque no sea el primer d20 del turno; el 1 tardío no',async()=>{
 const a=new MockActor(5);combate(a);assert.equal(await proponerAzar(mensaje(a,11)),false);
 assert.equal(await proponerAzar(mensaje(a,1)),false);assert.ok(await proponerAzar(mensaje(a,20)));assert.equal(messages.length,1);
});
test('3.14: el 20 natural duplica el daño como en el Manual; la regla vieja de 3.12 solo si el DM la enciende',async()=>{
 const {quitarCriticoDano}=await import('../scripts/azar.js');
 settings.delete?.('criticoSinDoble');assert.equal(quitarCriticoDano({isCritical:true}).isCritical,true);
 settings.set('criticoSinDoble',false);assert.equal(quitarCriticoDano({isCritical:true}).isCritical,true);
 settings.set('criticoSinDoble',true);
 const c=quitarCriticoDano({isCritical:true,rolls:[{options:{isCritical:true}},{}]});
 assert.equal(c.isCritical,false);assert.equal(c.critical.allow,false);assert.ok(c.rolls.every(r=>r.options.isCritical===false));
 settings.set('criticoSinDoble',false);
});
test('3.12: aprobar un derribo lo pone en el blanco de la tirada y los PG temporales en quien tiró',async()=>{
 const a=new MockActor(20),b=new MockActor(20);game.actors=collection([a,b]);combate(a);
 const puestos=[];b.toggleStatusEffect=async(id,o)=>{puestos.push([id,o.active]);};
 const m=mensaje(a,20);const fila=tablaAzar('ataque',20,20).findIndex(t=>t.nombre==='Lo derribas')+1;
 m.flags[MOD]={azar:{actorUuid:a.uuid,contexto:'ataque',natural:20,indice:fila,nivel:20,estado:'pendiente',combate:'c',turno:'c:1:0',objetivo:b.uuid}};
 assert.ok(await resolverAzar(m,true));assert.deepEqual(puestos,[['prone',true]]);
 const m2=mensaje(a,20);const f2=tablaAzar('ataque',20,20).findIndex(t=>t.nombre==='Te creces')+1;a.system.attributes.hp.temp=0;
 m2.flags[MOD]={azar:{actorUuid:a.uuid,contexto:'ataque',natural:20,indice:f2,nivel:20,estado:'pendiente',combate:'c',turno:'c:1:0'}};
 assert.ok(await resolverAzar(m2,true));assert.equal(a.system.attributes.hp.temp,6);
});
test('fuera de combate las salvaciones usan consecuencias de escena; muerte, Control y Concentración se excluyen',()=>{
 const a=new MockActor();assert.equal(contextoMensaje(mensaje(a,1,'save'),false),'escena');
 for(const tipo of ['death','concentration','initiative'])assert.equal(contextoMensaje(mensaje(a,1,tipo),true),null);
 const m=mensaje(a,1,'skill');m.flags.dnd5e.roll.skillId='cvb';assert.equal(contextoMensaje(m,true),null);
 m.flags.dnd5e.roll.skillId='prc';m.flags[MOD]={azarExcluir:true};assert.equal(contextoMensaje(m,true),null);
});
test('el primer d20 no extremo bloquea un contratiempo de multiataque posterior en ese turno',async()=>{
 const a=new MockActor(5);combate(a);assert.equal(await proponerAzar(mensaje(a,11)),false);assert.equal(await proponerAzar(mensaje(a,1)),false);assert.equal(messages.length,0);
 game.combat.turn=1;assert.ok(await proponerAzar(mensaje(a,20)));assert.equal(messages.length,1);
});
test('varias tiradas simultáneas solo generan una propuesta y conservan el secreto del mensaje',async()=>{
 const a=new MockActor();combate(a);const ms=[mensaje(a,1,'save',{blind:true,whisper:['gm']}),mensaje(a,20,'save')];
 await Promise.all(ms.map(proponerAzar));assert.equal(messages.length,1);assert.equal(messages[0].blind,true);assert.deepEqual(messages[0].whisper,['gm']);
 assert.equal(a.effects.length,0);
});
test('un jugador no genera propuestas como GM ni puede aprobarlas; un autor sin propiedad no usa un NPC ajeno',async()=>{
 const a=new MockActor(),m=mensaje(a);combate(a);game.user=game.users.get('player');assert.equal(await proponerAzar(m),false);
 assert.equal(await resolverAzar(m,true),false);game.user=game.users.get('gm');m.author={id:'intruso',isGM:false};assert.equal(await proponerAzar(m),false);
});
test('la frecuencia fuera de combate se mide en diez minutos de juego por actor',async()=>{
 const a=new MockActor();assert.ok(await proponerAzar(mensaje(a,1,'skill')));game.time.worldTime=599;assert.equal(await proponerAzar(mensaje(a,20,'skill')),false);
 game.time.worldTime=600;assert.ok(await proponerAzar(mensaje(a,20,'skill')));assert.equal(messages.length,2);
});
test('aprobar una propuesta de CA crea un efecto una sola vez y no modifica vida ni Verbe',async()=>{
 const a=new MockActor(20);combate(a);const m=mensaje(a);m.flags[MOD]={azar:{actorUuid:a.uuid,contexto:'ataque',natural:1,indice:tablaAzar('ataque',1,20).findIndex(t=>t.nombre==='Guardia abierta')+1,nivel:20,estado:'pendiente',combate:'c',turno:'c:1:0'}};
 await Promise.all([resolverAzar(m,true),resolverAzar(m,true)]);assert.equal(a.effects.length,1);assert.equal(a.effects[0].changes[0].value,'-3');assert.equal(a.system.attributes.hp.value,100);assert.equal(a.getFlag(MOD,'verbe').valor,5);
 assert.equal(await resolverAzar(m,true),false);
});
test('aprobar después de cambiar el turno no aplica consecuencias antiguas',async()=>{
 const a=new MockActor();combate(a);const m=mensaje(a);m.flags[MOD]={azar:{actorUuid:a.uuid,contexto:'ataque',natural:1,indice:1,nivel:1,estado:'pendiente',combate:'c',turno:'c:1:-1'}};
 assert.equal(await resolverAzar(m,true),false);assert.equal(a.effects.length,0);assert.equal(m.getFlag(MOD,'azar').estado,'vencido');
});
test('la CA vence al inicio del próximo turno propio y los efectos se retiran al acabar el combate',async()=>{
 const a=new MockActor();const c=combate(a);await a.createEmbeddedDocuments('ActiveEffect',[{name:'CA',flags:{[MOD]:{azar:{combate:'c',turno:'c:1:0',tipo:'ca'}}}}]);
 c.turn=1;c.combatant={actor:{uuid:'otro'}};await caducarAzar(c);assert.equal(a.effects.length,1);c.round=2;c.turn=0;c.combatant={actor:a};await caducarAzar(c);assert.equal(a.effects.length,0);
 await a.createEmbeddedDocuments('ActiveEffect',[{name:'Paso',flags:{[MOD]:{azar:{combate:'c',turno:'c:2:0',tipo:'paso'}}}}]);await caducarAzar(c,true);assert.equal(a.effects.length,0);
});
test('3.12: la regla escrita del 20 y el 1 trae las ocho tablas sin restos de plantilla',async()=>{
 const {guiaD20HTML}=await import('../scripts/azar.js');const h=guiaD20HTML();
 for(const c of ['ataque','salvacion','habilidad','escena'])for(const n of [1,20])for(const f of tablaAzar(c,n,1))assert.ok(h.includes(f.nombre),f.nombre);
 assert.doesNotMatch(h,/\{bono\}|\{temporal\}|undefined/);assert.match(h,/crítico del Manual/);assert.match(h,/tira los dados de daño dos veces/);
});
