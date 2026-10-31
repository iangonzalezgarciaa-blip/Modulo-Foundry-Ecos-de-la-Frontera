import test,{beforeEach} from 'node:test';
import assert from 'node:assert/strict';
import {MockActor,MockItem,resetEnvironment} from './helpers/foundry.mjs';
import {auditarPersonaje,aprobarPersonaje} from '../scripts/mesa-creacion.js';
const MOD='ecos-frontera';beforeEach(resetEnvironment);
function personaje(){
 const a=new MockActor(3);a.system.attributes.hp={max:24,value:20};for(const s of Object.values(a.system.abilities))s.value=10;
 for(const[type,name,system]of [['class','Guardián',{levels:3,identifier:'guardian'}],['race','Caminante',{}],['background','Viajero',{}],['equipment','Mochila',{}]])a.items.push(new MockItem({type,name,system},a));
 a.flags[MOD].caracteristicasRevisadas=true;return a;
}
test('la revisión bloquea una ficha incompleta y señala clase, elecciones y valores base',()=>{
 const a=new MockActor(1),r=auditarPersonaje(a);assert.equal(r.lista,false);assert.ok(r.filas.find(f=>f.id==='clase').estado==='error');assert.ok(r.filas.find(f=>f.id==='atributos').estado==='error');
});
test('clase y nivel deben coincidir; una especie o trasfondo duplicado no pasa como completo',()=>{
 const a=personaje();assert.equal(auditarPersonaje(a).lista,true);a.system.details.level=5;assert.equal(auditarPersonaje(a).filas.find(f=>f.id==='clase').estado,'error');
 a.system.details.level=3;a.items.push(new MockItem({type:'race',name:'Otra especie',system:{}},a));assert.equal(auditarPersonaje(a).filas.find(f=>f.id==='race').estado,'error');
});
test('multiclase diferente es válida y la repetición de una misma clase se detecta',()=>{
 const a=personaje();a.items[0].system.levels=2;a.items.push(new MockItem({type:'class',name:'Erudito',system:{levels:1,identifier:'erudito'}},a));assert.equal(auditarPersonaje(a).lista,true);
 a.items[1].type='class';a.items[1].system={levels:1,identifier:'guardian'};assert.equal(auditarPersonaje(a).filas.find(f=>f.id==='duplicadas').estado,'error');
});
test('se consulta configuredForLevel nativo y solo se exige un avance del nivel alcanzado',()=>{
 const a=personaje();a.items[0].system.advancement=[{id:'pendiente',levels:[2],type:'Trait',title:'Competencia',configuredForLevel:()=>false},{id:'futuro',levels:[4],configuredForLevel:()=>false}];
 const r=auditarPersonaje(a);assert.equal(r.filas.filter(f=>f.id.startsWith('avance-')).length,1);assert.equal(r.lista,false);
 a.items[0].system.advancement[0].configuredForLevel=()=>true;assert.equal(auditarPersonaje(a).lista,true);
});
test('un avance de formato desconocido queda para revisión y no se inventa una elección',()=>{
 const a=personaje();a.items[0].system.advancement=[{id:'externo',levels:[1],type:'Trait',value:{}}];const r=auditarPersonaje(a);assert.equal(r.filas.find(f=>f.id==='avances').estado,'revisar');assert.equal(r.lista,true);
});
test('aprobar requiere DM y confirmación; activar Ecos no despierta el Verbe',async()=>{
 const a=personaje();a.flags[MOD].verbe.despierto=false;game.user=game.users.get('player');assert.equal((await aprobarPersonaje(a,{revisado:true})).ok,false);
 game.user=game.users.get('gm');assert.equal((await aprobarPersonaje(a,{})).ok,false);assert.equal((await aprobarPersonaje(a,{revisado:true,activarEcos:true})).ok,true);
 assert.equal(a.getFlag(MOD,'pj'),true);assert.equal(a.getFlag(MOD,'verbe').despierto,false);assert.equal(auditarPersonaje(a).filas.find(f=>f.id==='aprobacion').estado,'ok');
});
test('la aprobación se invalida al cambiar la construcción, no al gastar vida',async()=>{
 const a=personaje();await aprobarPersonaje(a,{revisado:true});a.system.attributes.hp.value=10;assert.equal(auditarPersonaje(a).filas.find(f=>f.id==='aprobacion').estado,'ok');
 a.items.push(new MockItem({type:'consumable',name:'Una compra posterior',system:{}},a));a.items.push(new MockItem({type:'spell',name:'Técnica aprendida',system:{}},a));a.flags[MOD].verbe.despierto=false;
 assert.equal(auditarPersonaje(a).filas.find(f=>f.id==='aprobacion').estado,'ok');
 a.items[0].system.levels=4;a.system.details.level=4;assert.equal(auditarPersonaje(a).filas.find(f=>f.id==='aprobacion').estado,'revisar');
});
test('cambiar una competencia base pide revisión y reordenar un conjunto de idiomas no la invalida',async()=>{
 const a=personaje();a.system.skills.prc={value:0};a.system.traits={languages:{value:new Set(['comun','ilvarn'])}};await aprobarPersonaje(a,{revisado:true});
 a.system.traits.languages.value=new Set(['ilvarn','comun']);assert.equal(auditarPersonaje(a).filas.find(f=>f.id==='aprobacion').estado,'ok');
 a.system.skills.prc.value=1;assert.equal(auditarPersonaje(a).filas.find(f=>f.id==='aprobacion').estado,'revisar');
});
test('recursos negativos o superiores al máximo se detectan antes de aprobar',()=>{
 const a=personaje();a.system.spells={spell1:{max:4,value:5}};assert.equal(auditarPersonaje(a).filas.find(f=>f.id==='recursos').estado,'error');a.system.spells.spell1.value=3;assert.equal(auditarPersonaje(a).lista,true);
});
