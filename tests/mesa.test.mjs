import test,{beforeEach} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {MockActor,MockItem,collection,resetEnvironment,get} from './helpers/foundry.mjs';
import {buscarEntradas,claveTurno,perfilNpc,cambiosNpc,pasosPersonaje} from '../scripts/mesa-core.js';
import {abrirPlutonium,entradasCampana,guardarNpc,deshacerNpc,MesaEcos,crearPersonaje} from '../scripts/mesa.js';
import {usarDatosReliquias} from '../scripts/relics.js';
import {decodeCatalog,readCatalog} from '../tools/catalog.mjs';
const MOD='ecos-frontera';
beforeEach(()=>{resetEnvironment();game.journal=collection();game.items=collection();game.packs=collection();game.i18n={localize:s=>s};
 CONFIG.DND5E.abilities=Object.fromEntries(['str','dex','con','int','wis','cha'].map(k=>[k,{label:k}]));
 const D=readCatalog();game.modules.set(MOD,{api:{verbe:{datos:()=>D,estado:a=>a.getFlag(MOD,'verbe'),maxVerbe:()=>100}}});
 usarDatosReliquias(decodeCatalog(fs.readFileSync(new URL('../data/reliquias.txt',import.meta.url),'utf8')));
});
test('la búsqueda ignora tildes, exige todas las palabras, prioriza nombres y trata HTML como texto',()=>{
 const datos=[{nombre:'Curación del Vado',texto:'Una medicina pequeña.'},{nombre:'Otro',texto:'Ayuda a la curación en el vado.<script>secreto malo</script>'}];
 const r=buscarEntradas(datos,'curacion vado');assert.equal(r.length,2);assert.equal(r[0].nombre,'Curación del Vado');assert.doesNotMatch(r[1].extracto,/script|secreto/);
 assert.equal(buscarEntradas(datos,'curacion imposible').length,0);assert.equal(buscarEntradas(datos,'').length,0);
});
test('la reacción persiste en turnos ajenos y el recordatorio se renueva al iniciar el propio',()=>{
 const c={id:'c',started:true,round:2,turn:0,turns:[{actorId:'a'},{actorId:'b'},{actorId:'c'}]};
 assert.equal(claveTurno('b',c),'c:1');c.turn=1;assert.equal(claveTurno('b',c),'c:2');c.turn=2;assert.equal(claveTurno('b',c),'c:2');c.round=3;c.turn=0;assert.equal(claveTurno('b',c),'c:2');
});
test('búsqueda de jugador excluye diarios privados, páginas sin permiso, actores limitados y compendios ocultos',async()=>{
 game.user=game.users.get('player');const doc=(nombre,permitido,texto,uuid)=>({name:nombre,uuid,system:{description:{value:texto}},testUserPermission:()=>permitido});
 const pagina={...doc('Página visible',true,'pista del puente','JournalEntry.j.JournalEntryPage.p'),text:{content:'pista del puente'}};
 const oculta={...doc('Revelación privada',false,'secreto oculto','privada'),text:{content:'secreto oculto'}};
 game.journal=collection([{...doc('Guía común',true,'','j'),pages:collection([pagina,oculta])},{...doc('DM secreto',false,'','dm'),pages:collection([pagina])}]);
 game.items=collection([doc('Objeto público',true,'pista cotidiana','i'),doc('Artefacto secreto',false,'spoiler','x')]);
 game.actors=collection([{...doc('Actor limitado',false,'','a'),system:{details:{biography:{value:'secreto vital'}}},items:collection()}]);
 let leidos=0;game.packs=collection([{visible:false,testUserPermission:()=>true,getIndex:async()=>{leidos++;return [];}},{visible:true,testUserPermission:()=>false,getIndex:async()=>{leidos++;return [];}}]);
 const {entradas}=await entradasCampana({compendios:true});const texto=JSON.stringify(entradas);assert.match(texto,/pista del puente/);assert.doesNotMatch(texto,/secreto|spoiler|Revelación|Artefacto/);assert.equal(leidos,0);
 assert.equal(entradas.some(e=>e.tipo.startsWith('Técnica')),false);assert.equal(entradas.some(e=>e.tipo.startsWith('Reliquia')),false);
});
test('el DM busca en las 860 técnicas y 78 reliquias con su fuente, sin inventar respuestas',async()=>{
 const {entradas}=await entradasCampana();assert.equal(entradas.filter(e=>e.tipo.startsWith('Técnica')).length,860);assert.equal(entradas.filter(e=>e.tipo.startsWith('Reliquia')).length,78);
 const r=buscarEntradas(entradas,'baliza campamento');assert.ok(r.some(e=>e.catalogo==='vida-umbral-baliza-campamento'));
});
test('el adaptador abre modos reales de Plutonium y apunta a la ficha elegida',async()=>{
 const a=new MockActor();const llamadas=[];game.modules.set('plutonium',{active:true,api:{importer:{pOpen:async d=>llamadas.push(d)}}});
 assert.equal(await abrirPlutonium(a,'class'),true);assert.deepEqual(llamadas[0],{actor:a,modeId:'classes-subclasses'});
 await abrirPlutonium(a,'race');assert.equal(llamadas[1].modeId,'races-and-subraces');await abrirPlutonium(null,'creature');assert.deepEqual(llamadas[2],{actor:null,modeId:'creatures'});
});
test('sin Plutonium o con un importador que rechaza acceso el asistente informa y conserva la ficha',async()=>{
 const a=new MockActor();assert.equal(await abrirPlutonium(a,'class'),false);
 const antes=JSON.stringify(a.system);game.modules.set('plutonium',{active:true,api:{importer:{pOpen:async()=>{throw Error('permiso');}}}});
 const warn=console.error;console.error=()=>{};try{assert.equal(await abrirPlutonium(a,'class'),false);}finally{console.error=warn;}assert.equal(JSON.stringify(a.system),antes);
});
test('un jugador no puede usar el importador de criaturas ni editar una ficha ajena',async()=>{
 const a=new MockActor();a.isOwner=false;game.user=game.users.get('player');let llamadas=0;game.modules.set('plutonium',{active:true,api:{importer:{pOpen:async()=>llamadas++}}});
 assert.equal(await abrirPlutonium(a,'class'),false);assert.equal(await abrirPlutonium(null,'creature'),false);assert.equal(llamadas,0);
 assert.equal(await guardarNpc(null,perfilNpc()),null);
});
test('los perfiles limitan entradas y escalan con rol sin prometer desafío certificado',()=>{
 for(const vd of [0,.125,.25,.5,1,5,11,16,20])for(const rol of ['guardian','hostigador','tirador','místico','apoyo','civil']){
  const p=perfilNpc({vd,rol,nombre:'Nara'});assert.ok(p.pg>=1);assert.ok(p.ca>=10&&p.ca<=21);assert.ok(p.ataques<=3);assert.ok(p.dados>=1);assert.match(p.aviso,/orientativo/);
 }assert.throws(()=>perfilNpc({vd:99}));assert.throws(()=>perfilNpc({vd:'x'}));assert.throws(()=>perfilNpc({rol:'desconocido'}));assert.throws(()=>perfilNpc({nombre:' '}));
 assert.ok(perfilNpc({vd:5}).pg<perfilNpc({vd:11}).pg);
});
test('reciclar conserva la proporción de vida, respeta pies y no modifica acciones importadas',()=>{
 const a=new MockActor();a.type='npc';Object.assign(a.system.attributes.hp,{value:20,max:40});a.system.attributes.movement.units='ft';const p=perfilNpc({vd:3,rol:'hostigador'}),c=cambiosNpc(a,p);
 assert.equal(c['system.attributes.hp.value'],Math.round(p.pg/2));assert.equal(c['system.attributes.movement.walk'],40);assert.equal(c['system.attributes.ac.calc'],'flat');assert.equal(c.items,undefined);
 assert.equal(cambiosNpc(a,p,{curar:true})['system.attributes.hp.value'],p.pg);
});
test('actualizar un NPC permite deshacer los campos modificados sin tocar rasgos importados',async()=>{
 const a=new MockActor();a.type='npc';Object.assign(a.system.attributes.hp,{max:80,value:40});a.system.attributes.ac.calc='natural';a.system.attributes.ac.flat=13;a.system.details.cr=2;
 const importado=new MockItem({name:'Acción importada',type:'feat',system:{description:{value:'Nota propia'},uses:{spent:1}}},a);a.items.push(importado);
 const antes=Object.fromEntries(['name','system.details.cr','system.attributes.hp.max','system.attributes.hp.value','system.attributes.ac.calc','system.attributes.ac.flat','system.attributes.movement.walk'].map(k=>[k,get(a,k)]));
 await guardarNpc(a,perfilNpc({vd:5,nombre:'Guardián reciclado'}),{copiar:false});assert.equal(a.name,'Guardián reciclado');assert.equal(a.items.length,2);assert.equal(a.items[0],importado);assert.equal(importado.system.uses.spent,1);
 assert.equal(await deshacerNpc(a),true);for(const[k,v]of Object.entries(antes))assert.equal(get(a,k),v,k);assert.equal(a.items.length,1);assert.equal(a.items[0].system.description.value,'Nota propia');
});
test('adaptaciones repetidas no duplican actividades y al deshacer se conserva una nota de la rutina anterior',async()=>{
 const a=new MockActor();a.type='npc';a.system.attributes.hp={max:40,value:20};
 await guardarNpc(a,perfilNpc({vd:2}),{copiar:false});const rutina=a.items.find(i=>i.getFlag(MOD,'rutinaNpc'));
 rutina.system.description.value+='<p>Nota de combate propia.</p>';
 await guardarNpc(a,perfilNpc({vd:5,nombre:'Variante mejorada'}),{copiar:false});assert.equal(a.items.length,1);
 const keys=Object.keys(rutina.system.activities);assert.equal(keys.length,1);assert.equal(keys[0].length,16);
 await deshacerNpc(a);assert.match(rutina.system.description.value,/Nota de combate propia/);assert.equal(a.getFlag(MOD,'npcPerfil').anterior,undefined);
});
test('una actualización rechazada no deja cambios parciales en los campos del NPC',async()=>{
 const a=new MockActor();a.type='npc';a.system.attributes.hp={max:40,value:20};a.system.attributes.ac.calc='natural';a.system.attributes.ac.flat=12;a.system.details.cr=2;
 a.failNextUpdate=true;await assert.rejects(()=>guardarNpc(a,perfilNpc({nombre:'Cambio fallido',vd:5}),{copiar:false}));assert.equal(a.name,'Actor local');assert.equal(a.system.attributes.hp.max,40);assert.equal(a.items.length,0);
});
test('deshacer una adaptación no restaura PG ni borra notas añadidas después de usar el NPC',async()=>{
 const a=new MockActor();a.type='npc';a.system.attributes.hp={max:40,value:20};
 await guardarNpc(a,perfilNpc({nombre:'Guardián',vd:3}),{copiar:false});const antes=a.system.attributes.hp.value;a.system.attributes.hp.value--;
 assert.equal(await deshacerNpc(a),false);assert.equal(a.system.attributes.hp.value,antes-1);
 a.system.attributes.hp.value=antes;const i=a.items.find(i=>i.getFlag(MOD,'rutinaNpc'));i.system.description.value+='<p>Nota posterior.</p>';
 assert.equal(await deshacerNpc(a),false);assert.match(i.system.description.value,/Nota posterior/);
});
test('crear variante deja el original intacto y el actor nuevo privado',async()=>{
 const a=new MockActor();a.type='npc';a.system.attributes.hp={max:80,value:40};a.name='Original';
 a.toObject=()=>({name:a.name,type:'npc',ownership:{default:3},system:structuredClone(a.system),items:[],prototypeToken:{actorLink:true,name:a.name}});
 Actor.create=async d=>{const n=new MockActor();n.type=d.type;n.name=d.name;n.system=d.system;n.ownership=d.ownership;n.prototypeToken=d.prototypeToken;return n;};
 const n=await guardarNpc(a,perfilNpc({nombre:'Variante'}),{copiar:true});assert.notEqual(n,a);assert.equal(a.name,'Original');assert.equal(a.system.attributes.hp.max,80);assert.deepEqual(n.ownership,{default:0});assert.equal(n.prototypeToken.actorLink,false);
});
test('el asistente de creación reconoce avances existentes sin duplicarlos',()=>{
 const a=new MockActor();a.items.push(new MockItem({name:'Clase importada',type:'class'},a));assert.equal(pasosPersonaje(a).find(p=>p.id==='class').hecho,true);assert.equal(pasosPersonaje(a).find(p=>p.id==='race').hecho,false);
});
test('crear personaje comprueba el permiso de creación y no concede derechos generales',async()=>{
 game.user=game.users.get('player');Actor.canUserCreate=()=>false;assert.equal(await crearPersonaje('Nara'),null);
 Actor.canUserCreate=()=>true;let d;Actor.create=async data=>{d=data;return data;};await crearPersonaje('Nara');assert.deepEqual(d.ownership,{default:0,player:3});assert.equal(d.type,'character');
});
test('los seis paneles generan HTML con instrucciones y solo el DM ve sus herramientas',async()=>{
 const a=new MockActor(3);a.system.attributes.hp.max=100;a.hasPlayerOwner=true;
 const p=new MesaEcos({actor:a});for(const pestana of ['turno','crear','buscar','azar','dm','npc']){p.pestana=pestana;const html=await p._renderHTML();assert.ok(html.includes('em-contenido'));assert.doesNotMatch(html,/\bundefined\b|\bNaN\b/);}
 game.user=game.users.get('player');p.pestana='dm';let html=await p._renderHTML();assert.doesNotMatch(html,/Cuaderno privado|Taller de NPC|Control de la sesión/);p.pestana='turno';html=await p._renderHTML();assert.match(html,/Mi lista del turno/);
});
