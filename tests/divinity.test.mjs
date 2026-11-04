import test,{beforeEach} from 'node:test';
import assert from 'node:assert/strict';
import {readCatalog,validateCatalog} from '../tools/catalog.mjs';
import {donDivino,accesoDivino,asegurarNotaPanteon} from '../scripts/verbe-divinity.js';
import {MockActor,MockItem,resetEnvironment,collection} from './helpers/foundry.mjs';
import * as V from '../scripts/verbe.js';
const D=readCatalog(),l=id=>D.linajes.find(l=>l.id===id),t=id=>D.tecnicas.find(t=>t.id===id);
beforeEach(()=>{resetEnvironment();V.usarDatos(D,'activo');delete globalThis.JournalEntry;});
test('seis Primeros, Maethra mayor y Seyra y Dhoren ya en el canon',()=>{
  assert.deepEqual(D.panteon.filter(d=>d.jerarquia==='primordial').map(d=>d.id).sort(),['ashka','ignis','maethra','nerys','orun','thalos']);
  assert.equal(D.panteon.filter(d=>d.propuesto).length,0);assert.ok(['seyra','dhoren'].every(id=>D.panteon.find(d=>d.id===id)?.jerarquia==='menor'));
  assert.ok(D.linajes.filter(l=>['seyra','dhoren'].includes(l.id)).every(l=>!/propuest|pendiente/i.test(l.texto)));
  assert.equal(D.linajes.some(l=>l.id==='ozhar'),false);assert.deepEqual(validateCatalog(D),[]);
  assert.equal(D.tecnicas.filter(t=>t.divina).length,24);
});
test('cada etapa de Maethra supera el potencial añadido de otros Primeros y las fuerzas se atenúan',()=>{
  for(let n=1;n<=20;n++)for(const f of ['rastro','debil','media','plena']){
    const m=donDivino(l('maethra'),f,n),i=donDivino(l('ignis'),f,n);assert.ok(m.reserva>i.reserva);
    assert.ok(m.reserva<=1&&m.ac<=2&&m.despertarAC<=2);
    assert.equal(donDivino(l('varro'),f,n).reserva,0);
  }
  assert.equal(donDivino(l('maethra'),'media',20).etapa,11);assert.equal(donDivino(l('maethra'),'ninguna',20).reserva,0);
  assert.equal(donDivino(l('maethra'),'plena',20).reserva,1);
});
test('reserva nueva no rellena energía, no multiplica dotes y conserva identidad de Thalos',()=>{
  const a=new MockActor(20,{linaje:'maethra',fuerza:'plena',valor:3});
  assert.equal(V.maxVerbe(a),334);assert.equal(V.estado(a).valor,3);
  V.estado(a).dotes=['reserva-profunda'];assert.equal(V.maxVerbe(a),354);
  V.estado(a).dotes=[];V.estado(a).linaje='thalos';assert.equal(V.maxVerbe(a),291);
  V.estado(a).fuerza='ninguna';assert.equal(V.maxVerbe(a),167);
});
test('los pasivos existentes se actualizan al subir, diluir o cambiar de sangre sin duplicarse',async()=>{
  const a=new MockActor(5,{linaje:'maethra',fuerza:'plena',reglasVersion:2,shinobiVersion:1,progresionVersion:1});
  await V._prueba.asegurarRasgos(a);let fx=a.effects.find(e=>e.getFlag('ecos-frontera','verbe')?.herencia);const id=fx.id;
  assert.equal(fx.changes[0].value,'1');a.system.details.level=11;await V._prueba.asegurarRasgos(a);
  fx=a.effects.find(e=>e.getFlag('ecos-frontera','verbe')?.herencia);assert.equal(fx.id,id);assert.equal(fx.changes[0].value,'2');
  V.estado(a).fuerza='rastro';await V._prueba.asegurarRasgos(a);assert.equal(a.effects.some(e=>e.getFlag('ecos-frontera','verbe')?.herencia),false);
});
test('el Despertar de Maethra respeta etapas y no altera Pilares ni concede vidas',async()=>{
  const a=new MockActor(18,{linaje:'maethra',fuerza:'plena'});await V._prueba.ponerDespertar(a);
  const fx=a.effects[0];assert.equal(fx.changes.find(c=>c.key==='system.attributes.ac.bonus').value,'+ 4');
  assert.equal(fx.changes.filter(c=>c.key==='system.traits.dr.value').length,2);
  V.estado(a).fuerza='media';await V._prueba.ponerDespertar(a);assert.equal(a.effects.length,1);assert.equal(a.effects[0].changes.filter(c=>c.key==='system.traits.dr.value').length,0);
});
test('linaje, fuerza plena y nivel se comprueban también al usar y el Mítico no falsifica sangre plena',()=>{
  const m=t('divino-madre-jardin').item.flags['ecos-frontera'].verbe;
  assert.equal(accesoDivino(m,{linaje:'maethra',fuerza:'media',nivel:20,rangoSangre:5}).ok,false);
  assert.equal(accesoDivino(m,{linaje:'maethra',fuerza:'plena',nivel:19,rangoSangre:5}).ok,false);
  assert.equal(accesoDivino(m,{linaje:'ignis',fuerza:'plena',nivel:20,rangoSangre:5}).ok,false);
  assert.equal(accesoDivino(m,{linaje:'maethra',fuerza:'plena',nivel:20,rangoSangre:5}).ok,true);
});
test('una herencia retirada bloquea una técnica antigua ya aprendida',()=>{
  const a=new MockActor(20,{linaje:'ignis',fuerza:'plena',rangos:{sangre:5}}),it=new MockItem(V.datosItem(a,t('sangre-eco')),a);a.items.push(it);
  assert.equal(V.alConsumir({item:it,actor:a},{},{},{}),false);
});
test('el diario del panteón es privado, idempotente y conserva texto editado por el DM',async()=>{
  game.journal=collection();let creados=0;
  globalThis.JournalEntry={create:async data=>{
    creados++;const j={...data,pages:collection(),getFlag(m,k){return this.flags[m][k];},async update(d){Object.assign(this,d);},async createEmbeddedDocuments(type,docs){return docs.map(d=>{const p={...d,getFlag(m,k){return this.flags[m][k];},async update(u){Object.assign(this,u);}};this.pages.push(p);return p;});}};
    game.journal.push(j);return j;
  }};
  const a=await asegurarNotaPanteon(D);assert.equal(creados,1);assert.equal(a.diario.ownership.default,0);
  a.pagina.text.content='Mi versión del panteón';a.pagina.ownership.player=3;a.diario.ownership.player=3;
  const b=await asegurarNotaPanteon(D);assert.equal(creados,1);assert.equal(b.diario.pages.length,1);assert.equal(b.pagina.text.content,'Mi versión del panteón');
  assert.equal(b.diario.ownership.player,0);assert.equal(b.pagina.ownership.player,0);
  game.user=game.users.get('player');assert.equal(await asegurarNotaPanteon(D),null);
});
test('las reservas primigenias mantienen el presupuesto breve por debajo del Largo en todos los niveles',()=>{
 for(const linaje of D.divinidad.primeros)for(const fuerza of ['rastro','debil','media','plena'])for(let n=1;n<=20;n++){
  const a=new MockActor(n,{linaje,fuerza,dotes:['sueno-reparador']});
  const largo=Math.min(V.maxVerbe(a),V.recuperacionLargaVerbe(a)),breve=V.presupuestoBreveVerbe(a);
  assert.ok(breve.limite<largo || largo===0,`${linaje}/${fuerza}/${n}`);
 }
});
