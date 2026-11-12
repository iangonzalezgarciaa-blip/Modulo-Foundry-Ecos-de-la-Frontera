import test,{beforeEach} from 'node:test';
import assert from 'node:assert/strict';
import {MockActor,MockItem,resetEnvironment,collection,put} from './helpers/foundry.mjs';
import {readCatalog} from '../tools/catalog.mjs';
import {intencionesTecnica,recomendarTecnicas,relacionadas} from '../scripts/mesa-intenciones.js';
import {auditarNpc,estimarEncuentro,mediaFormula,PLANTILLAS_NPC} from '../scripts/mesa-encuentros.js';
import {diagnosticoMesa,anotarIncidencia,registrarPrueba,PRUEBAS_REALES} from '../scripts/mesa-diagnostico.js';
import {adoptarMemoria,cuadernoMemoria} from '../scripts/mesa-memoria.js';
import {prepararRecibo,registrarPaso,marcarMesa,corregirGasto,reciboHTML} from '../scripts/mesa-resolucion.js';
import {actoresPresentes} from '../scripts/mesa-actores.js';
import {caducarReliquias} from '../scripts/relics.js';
import * as V from '../scripts/verbe.js';
const MOD='ecos-frontera',D=readCatalog();
beforeEach(()=>{resetEnvironment();V.usarDatos(D,'activo');game.journal=collection();game.messages=new Map();game.system={id:'dnd5e',version:'5.2.5'};game.version='13.350';game.modules.set(MOD,{active:true,version:'3.4.0',api:{verbe:{datos:()=>D,corregirGastoSimple:V.corregirGastoSimple}}});
 globalThis.fromUuid=async u=>game.actors.find(a=>a.uuid===u);
});
function mensaje(r){const m={id:crypto.randomUUID(),isOwner:true,flags:{[MOD]:{resolucion:r}}};m.getFlag=(mod,k)=>m.flags[mod]?.[k];m.setFlag=async(mod,k,v)=>{put(m,`flags.${mod}.${k}`,v);};game.messages.set(m.id,m);return m;}
function t(id){return D.tecnicas.find(t=>t.id===id);}
test('las intenciones reconocen cuidados, transporte y oficio sin convertir una utilidad en ataque',()=>{
 assert.ok(intencionesTecnica(t('vida-pulso-venda-sujeta')).includes('curar'));assert.ok(intencionesTecnica(t('vida-umbral-puente-bultos')).includes('viajar'));
 assert.ok(intencionesTecnica(t('vida-hilo-costura-remiendo')).includes('oficio'));assert.equal(intencionesTecnica(t('vida-hilo-costura-remiendo')).includes('atacar'),false);
});
test('las sugerencias priorizan lo aprendido y conservan motivo de bloqueo y coste individual',()=>{
 const datos=[t('vida-umbral-puente-bultos'),t('vida-umbral-bolsillo-mensajero')];const r=recomendarTecnicas(datos,'viajar',{conocidas:[datos[0].id],requisito:()=>({ok:false,motivo:'Falta rango'}),costo:()=>3});
 assert.equal(r[0].id,datos[0].id);assert.equal(r[0].aprendida,true);assert.equal(r[1].motivo,'Falta rango');assert.equal(r[1].costo,3);
});
test('las fuentes relacionadas usan solo el conjunto de entradas proporcionado',()=>{
 const e={nombre:'Carta de Ilarva',uuid:'c',texto:'Carta'};const r=relacionadas([e,{nombre:'Viaje de Ilarva',uuid:'v',texto:'Registro'},{nombre:'Otro',uuid:'o',texto:'Nada'}],e);assert.equal(r.length,1);assert.equal(r[0].uuid,'v');
});
test('fórmulas de daño se calculan sin ejecutar código ni ocultar variables desconocidas',()=>{
 assert.equal(mediaFormula('2d6 + 3'),10);assert.equal(mediaFormula('1d8 + @mod',{mod:4}),8.5);assert.equal(mediaFormula('1d8 + @mod'),null);assert.equal(mediaFormula('1d8 + @mod',{mod:null}),null);assert.equal(mediaFormula('alert(1)'),null);assert.equal(mediaFormula('1d6 * 100'),null);
});
test('la revisión de un NPC detecta Multiataque, áreas, magia, control y resistencias',()=>{
 const a=new MockActor();a.type='npc';a.system.traits={dr:{value:new Set(['fire'])}};
 a.items.push(new MockItem({name:'Multiataque',type:'feat',system:{description:{value:'Realiza varios ataques.'},activities:{a:{name:'Aliento',type:'save',target:{template:{type:'cone'}},damage:{parts:[{number:3,denomination:6,bonus:''}]},effects:[{_id:'x'}]}}}},a));
 a.items.push(new MockItem({name:'Conjuro',type:'spell',system:{}},a));const r=auditarNpc(a);assert.equal(r.maximoIndividual,10.5);for(const tipo of ['multiataque','area','control','dr','magia','verbe'])assert.ok(r.alertas.some(x=>x.tipo===tipo),tipo);
});
test('presión de encuentro muestra hipótesis, respeta cero daño y admite NPC de VD superior a 20',()=>{
 const p=new MockActor(5);p.system.attributes.hp.max=40;p.system.attributes.ac.value=15;const n=new MockActor();n.type='npc';n.system.details.cr=30;n.system.attributes.hp.max=400;
 const r=estimarEncuentro([p],[{actor:n,cantidad:2,danoRonda:0,blancos:1}]);assert.equal(r.valido,true);assert.equal(r.presion,0);assert.equal(r.unidades,2);assert.match(r.aviso,/No es el cálculo oficial/);
 assert.equal(estimarEncuentro([],[{actor:n}]).valido,false);assert.equal(Object.keys(PLANTILLAS_NPC).length,17);
});
test('una actividad importada fuerte no queda escondida por la rutina de Ecos',()=>{
 const a=new MockActor();a.type='npc';a.flags[MOD].npcPerfil={danoMedio:10};a.items.push(new MockItem({name:'Impacto mayor',type:'feat',system:{activities:{a:{name:'Impacto',type:'damage',damage:{parts:[{number:8,denomination:6,bonus:''}]}}}}},a));
 const r=auditarNpc(a);assert.equal(r.danoRonda,28);assert.ok(r.alertas.some(x=>x.tipo==='potencia-importada'));
});
test('el daño base de arma no se presenta como un total fiable sin sus opciones nativas',()=>{
 const a=new MockActor();a.type='npc';a.items.push(new MockItem({name:'Espada',type:'weapon',system:{damage:{base:{number:1,denomination:8}},activities:{a:{name:'Filo',type:'attack',damage:{includeBase:true,parts:[]}}}}},a));
 const r=auditarNpc(a);assert.equal(r.acciones[0].media,null);assert.equal(r.incertidumbre,true);assert.ok(r.alertas.some(x=>x.tipo==='arma-base'));
});
test('el daño ya ajustado a salvaciones no vuelve a multiplicarse por probabilidad de ataque',()=>{
 const p=new MockActor(5);p.system.attributes.hp.max=40;p.system.attributes.ac.value=20;const n=new MockActor();n.type='npc';n.system.attributes.hp.max=50;
 const r=estimarEncuentro([p],[{actor:n,cantidad:1,modo:'ajustado',danoRonda:10,blancos:1}]);assert.equal(r.presion,10);assert.equal(r.detalles[0].impacto,1);
 assert.equal(estimarEncuentro([p],[{actor:n,modo:'ajustado'}]).valido,false);
});
test('informe técnico omite actores, diarios, rutas y credenciales aunque existan en el mundo',()=>{
 const a=new MockActor();a.name='SECRETO_DEL_PERSONAJE';game.journal=collection([{name:'SECRETO_DIARIO'}]);anotarIncidencia('mesa:revision');
 const r=diagnosticoMesa(),s=JSON.stringify(r);assert.doesNotMatch(s,/SECRETO_DEL_PERSONAJE|SECRETO_DIARIO/);assert.equal(r.core,'13.350');assert.ok(r.incidencias.some(x=>x.codigo==='mesa:revision'));
});
test('un jugador no registra pruebas privadas ni adopta lore',async()=>{
 game.user=game.users.get('player');assert.equal(await registrarPrueba('creacion','correcto','nota'),false);assert.equal(await adoptarMemoria('rama:forma','adoptado'),false);assert.equal(await cuadernoMemoria(),null);assert.equal(PRUEBAS_REALES.length,80);
});
test('174 entradas de memoria mantienen el panteón y distinguen propuestas de referencia',()=>{
 const es=D.memoriaNimerios?.entradas;assert.equal(es?.length,174);assert.equal(es.filter(e=>e.tipo==='Panteón').length,22);assert.equal(es.filter(e=>e.tipo==='Reliquias').length,78);
 assert.equal(es.find(e=>e.id==='deidad:maethra').estado,'referencia');assert.match(es.find(e=>e.id==='deidad:maethra').dm,/mayor/);assert.equal(es.find(e=>e.id==='bestia:shukaku').nombre,'Dunavar');
});
test('un recibo registra pasos sin duplicarlos y no vuelve a aplicar daño o efectos',async()=>{
 const a=new MockActor(),item=new MockItem({name:'Técnica'},a),v={nonce:'nonce',grado:1,costo:2,antes:5,despues:3};
 const m=mensaje(prepararRecibo(a,item,v,V.estado(a),{id:'t'}));await Promise.all([registrarPaso({itemCardId:m.id},'defensas','Defensas','Uno'),registrarPaso({itemCardId:m.id},'defensas','Defensas','Dos')]);
 assert.equal(m.getFlag(MOD,'resolucion').pasos.filter(p=>p.id==='defensas').length,1);assert.equal(a.system.attributes.hp.value,100);assert.equal(a.effects.length,0);
 await marcarMesa(m,'Revisado');assert.equal(m.getFlag(MOD,'resolucion').manualResuelto,true);assert.match(reciboHTML(m.getFlag(MOD,'resolucion')),/Revisado/);
});
test('la corrección restaura solo Verbe y bloquea repetición o un uso posterior',async()=>{
 const a=new MockActor(3,{valor:20,nats:['fuego'],rangos:{forma:1}}),item=new MockItem(V.datosItem(a,t('fuego-aliento')),a);a.items.push(item);
 const act={actor:a,item},usage={},updates={};assert.notEqual(V.alConsumir(act,usage,{},updates),false);await a.update(updates.actor);await V._prueba.despuesDeUsar(act,usage);
 const r=V.estado(a).ultimoRecibo,m=mensaje(r),hp=a.system.attributes.hp.value;
 assert.equal((await corregirGasto(m)).ok,true);assert.equal(V.estado(a).valor,20);assert.equal(a.system.attributes.hp.value,hp);assert.equal((await corregirGasto(m)).ok,false);
 const u2={},up2={};V.alConsumir(act,u2,{},up2);await a.update(up2.actor);await V._prueba.despuesDeUsar(act,u2);V.estado(a).valor--;
 assert.equal((await V.corregirGastoSimple(a,V.estado(a).ultimoRecibo)).ok,false);
});
test('poderes complejos y jugadores no pueden usar la corrección automática',async()=>{
 const a=new MockActor();const m=mensaje(prepararRecibo(a,{id:'i'},{nonce:'n',grado:6,antes:9,despues:1,costo:8},V.estado(a),{id:'t'}));assert.equal((await corregirGasto(m)).ok,false);
 game.user=game.users.get('player');assert.equal((await corregirGasto(m)).ok,false);
});
test('dos tokens no vinculados de un mismo actor reciben claves de panel diferentes',()=>{
 const a={id:'igual',uuid:'Scene.escena.Token.uno.Actor.igual'},b={id:'igual',uuid:'Scene.escena.Token.dos.Actor.igual'};assert.notEqual(V.clavePanelVerbe(a),V.clavePanelVerbe(b));
});
function diariosSimulados(){
 const doc=d=>({...d,id:crypto.randomUUID(),getFlag(m,k){return this.flags?.[m]?.[k];},async setFlag(m,k,v){put(this,`flags.${m}.${k}`,v);},async update(c){for(const[k,v]of Object.entries(c))put(this,k,v);return this;}});
 globalThis.JournalEntry={create:async data=>{const j=doc(data);j.pages=collection((data.pages??[]).map(doc));j.createEmbeddedDocuments=async(_tipo,ds)=>{const ps=ds.map(doc);j.pages.push(...ps);return ps;};game.journal.push(j);return j;}};
}
test('el cuaderno de identidad preserva texto personalizado y repara permisos privados',async()=>{
 diariosSimulados();const j=await cuadernoMemoria();assert.equal(j.pages.length,174);const pagina=j.pages[0];pagina.text.content='<p>Mi canon propio.</p>';pagina.ownership.player=3;
 await cuadernoMemoria();assert.equal(j.pages.length,174);assert.equal(pagina.text.content,'<p>Mi canon propio.</p>');assert.equal(pagina.ownership.player,0);
 await adoptarMemoria('rama:forma','adoptado');assert.equal(j.getFlag(MOD,'memoriaEstado')['rama:forma'].estado,'adoptado');assert.equal(await adoptarMemoria('deidad:maethra','descartado'),false);
});
test('el registro de pruebas reales empieza pendiente y guarda resultados solo en el diario privado',async()=>{
 diariosSimulados();assert.equal(await registrarPrueba('creacion','correcto','Probado con otra sesión'),true);const j=game.journal.find(j=>j.getFlag(MOD,'pruebasMesa'));
 assert.equal(j.ownership.default,0);assert.equal(j.getFlag(MOD,'resultadoPruebas').creacion.estado,'correcto');assert.equal(j.getFlag(MOD,'resultadoPruebas').area,undefined);
});
test('la guía revisada crea una página nueva y conserva las anotaciones de las páginas existentes',async()=>{
 diariosSimulados();CONST.DOCUMENT_OWNERSHIP_LEVELS={NONE:0,OBSERVER:2};CONST.JOURNAL_ENTRY_PAGE_FORMATS={HTML:1};
 const j=await JournalEntry.create({name:'Reglas de la casa',flags:{},pages:[{name:'Guía antigua',text:{content:'Notas del autor en la guía antigua'},flags:{[MOD]:{verbe:{guia:1}}}}]});
 await V.asegurarGuia();assert.equal(j.pages.length,3,'guía antigua, guía revisada y compendio (3.11)');assert.equal(j.pages[0].text.content,'Notas del autor en la guía antigua');
 const nueva=j.pages[1];nueva.text.content+='<p>Mi explicación personal.</p>';await V.asegurarGuia();assert.equal(j.pages.length,3);assert.match(nueva.text.content,/Mi explicación personal/);assert.doesNotMatch(nueva.text.content,/tiene tres <b>etapas/);
 const compendio=j.pages[2];assert.equal(compendio.name,'11 · Compendio del Verbe');assert.match(compendio.text.content,/Compendio del Verbe/);assert.equal(compendio.ownership.default,0);
 compendio.text.content+='<p>Nota del DM.</p>';await V.asegurarGuia();assert.match(compendio.text.content,/Nota del DM/,'no pisa un compendio editado');
 const dm=game.journal.find(x=>x.getFlag(MOD,'compendioDM'));assert.ok(dm,'diario del DM creado');assert.equal(dm.ownership.default,0);assert.equal(dm.pages.length,1);assert.match(dm.pages[0].text.content,/solo DM/);
});
test('el vencimiento de una reliquia alcanza la instancia no vinculada sin cambiar al actor base',async()=>{
 const base=new MockActor(),instancia=new MockActor();base.id=instancia.id='misma-base';base.uuid='Actor.base';instancia.uuid='Scene.escena.Token.uno.Actor.base';game.actors=collection([base]);
 game.combats=collection([{combatants:collection([{actor:instancia}])}]);await instancia.createEmbeddedDocuments('ActiveEffect',[{name:'Reliquia temporal',flags:{[MOD]:{reliquiaEfecto:{hasta:10}}}}]);
 assert.equal(actoresPresentes().length,2);game.time.worldTime=11;await caducarReliquias();assert.equal(instancia.effects.length,0);assert.equal(base.effects.length,0);
});
