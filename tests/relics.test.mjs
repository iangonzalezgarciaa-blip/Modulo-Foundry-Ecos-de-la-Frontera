import test,{beforeEach} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {decodeCatalog} from '../tools/catalog.mjs';
import {MockActor,MockItem,collection,resetEnvironment} from './helpers/foundry.mjs';
import * as R from '../scripts/relics.js';
import {huellaTexto} from '../scripts/verbe-reading.js';
const D=decodeCatalog(fs.readFileSync(new URL('../data/reliquias.txt',import.meta.url),'utf8'));
beforeEach(()=>{resetEnvironment();R.usarDatosReliquias(D);});
const ficha=id=>D.reliquias.find(r=>r.id===id);
function equipar(a,id){const d=structuredClone(ficha(id).item);d.flags['ecos-frontera'].reliquia.autorizada=true;d.system.equipped=true;d.system.attuned=true;const i=new MockItem(d,a);a.items.push(i);return i;}
test('78 perfiles documentados, de juego y propios, con actividades y cargos nativos sin grados falsos',()=>{
 assert.equal(D.reliquias.length,78);assert.equal(D.reliquias.filter(r=>r.origen==='propia').length,16);
 const ids=new Set();for(const r of D.reliquias){assert.ok(!ids.has(r.item._id));ids.add(r.item._id);assert.equal(r.item.type,'equipment');
  assert.equal(r.item.system.level,undefined);assert.equal(r.item.system.activation,undefined);
  for(const a of Object.values(r.item.system.activities)){assert.equal(a.activation.override,true);assert.equal(a.target.override,true);assert.equal(a.consumption.spellSlot,false);assert.equal(a.consumption.targets[0].type,'itemUses');assert.equal(a.consumption.scaling.allowed,false);}
  assert.ok(!r.item.flags['ecos-frontera'].verbe);assert.equal(r.item.flags['ecos-frontera'].reliquia.autorizada,false);
 }
 assert.ok(D.reliquias.some(r=>r.original==='Immutable Letter'));assert.ok(D.reliquias.some(r=>r.original==="Lyza's Letter"));
 assert.equal(D.reliquias.some(r=>r.original==='Reg'),false);assert.match(ficha('mia-gold-shaker').texto,/No crea oro/);
});
test('autorizar, equipar, sintonizar y nivel son condiciones efectivas',()=>{
 const a=new MockActor(1),i=equipar(a,'mia-sparagmos');assert.equal(R.permisoReliquia(a,i).ok,false);
 a.system.details.level=20;assert.equal(R.permisoReliquia(a,i).ok,true);
 i.system.attuned=false;assert.equal(R.permisoReliquia(a,i).ok,false);i.system.attuned=true;
 i.system.equipped=false;assert.equal(R.permisoReliquia(a,i).ok,false);i.system.equipped=true;
 i.flags['ecos-frontera'].reliquia.autorizada=false;assert.equal(R.permisoReliquia(a,i).ok,false);
});
test('no permite desmarcar consumo para eludir el cargo del ejemplar',()=>{
 const a=new MockActor(20),i=equipar(a,'mia-deep-sea-lion');i.flags['ecos-frontera'].reliquia.permisoRitual=true;
 assert.equal(R.permisoReliquia(a,i,{consume:false}).ok,false);assert.equal(R.permisoReliquia(a,i,{consume:{resources:[]}}).ok,false);
 assert.equal(R.permisoReliquia(a,i,{consume:{resources:[0]}}).ok,true);
});
test('el uso compartido impide alternar copias y no se renueva en un corto',async()=>{
 const a=new MockActor(20),i=equipar(a,'mia-sparagmos'),j=equipar(a,'mia-gangway'),config={},updates={};
 assert.notEqual(R.consumirReliquia({actor:a,item:i},config,updates),false);await a.update(updates.actor);await R.despuesReliquia({actor:a,item:i},config);
 assert.equal(R.permisoReliquia(a,j).ok,false);await R.descansarReliquias(a,{type:'short'});assert.equal(R.permisoReliquia(a,j).ok,false);
 await R.descansarReliquias(a,{type:'long'});assert.equal(R.permisoReliquia(a,j).ok,true);assert.equal(a.getFlag('ecos-frontera','verbe').valor,5);
});
test('ritual requiere permiso, lo consume y un largo no lo vuelve a conceder',async()=>{
 const a=new MockActor(20),i=equipar(a,'mia-unheard-bell');assert.equal(R.permisoReliquia(a,i).ok,false);
 await R.autorizarReliquia(i,{ritual:true});const config={},updates={};assert.notEqual(R.consumirReliquia({actor:a,item:i},config,updates),false);
 await a.update(updates.actor);await R.despuesReliquia({actor:a,item:i},config);await R.descansarReliquias(a,{type:'long'});
 assert.equal(i.getFlag('ecos-frontera','reliquia').permisoRitual,false);assert.equal(R.permisoReliquia(a,i).ok,false);
});
test('consumibles sin recuperación y efectos propios sin acumulación de copias',async()=>{
 assert.deepEqual(ficha('mia-hard-scrub').item.system.uses.recovery,[]);
 const a=new MockActor(20),i=equipar(a,'mia-thousand-men-pins');const act={actor:a,item:i};
 for(let n=0;n<2;n++){const config={ecosReliquia:{id:'prueba'}};await R.despuesReliquia(act,config);}
 assert.equal(a.effects.length,1);game.time.worldTime=61;await R.caducarReliquias();assert.equal(a.effects.length,0);
});
test('entregar una copia respeta ediciones y gastos existentes; un jugador no autoriza ni entrega',async()=>{
 const a=new MockActor(20);assert.equal(await R.darReliquia(a,'mia-blaze-reap'),true);const i=a.items[0];i.name='Mi pico';i.system.uses.spent=1;
 assert.equal(await R.darReliquia(a,'mia-blaze-reap'),false);assert.equal(a.items.length,1);assert.equal(i.name,'Mi pico');assert.equal(i.system.uses.spent,1);
 game.user=game.users.get('player');assert.equal(await R.darReliquia(a,'mia-sun-sphere'),false);assert.equal(await R.autorizarReliquia(i),false);
 assert.equal(await new R.CatalogoReliquias(a)._renderHTML(),'<p>Solo DM.</p>');
});
test('compendio privado añade faltantes sin sustituir documentos del DM',async()=>{
 const index=new Map(D.reliquias.map(r=>[r.item._id,{name:'Editado'}]));const pack={index,locked:true,collection:'world.ecos-reliquias',config:[],async configure(c){this.config.push(c);},async getIndex(){return index;}};
 game.packs=new Map([['world.ecos-reliquias',pack]]);let creados=0;
 globalThis.Item={createDocuments:async docs=>{creados+=docs.length;}};
 await R.asegurarCompendioReliquias();assert.equal(creados,0);assert.equal(index.values().next().value.name,'Editado');
 assert.deepEqual(pack.config[0].ownership,{PLAYER:'NONE',TRUSTED:'NONE',ASSISTANT:'NONE',GAMEMASTER:'OWNER'});
 game.user=game.users.get('player');assert.equal(await R.asegurarCompendioReliquias(),null);
});
test('dos activaciones simultáneas no preparan un doble gasto',()=>{
 const a=new MockActor(20),i=equipar(a,'mia-gentle-knock');assert.notEqual(R.consumirReliquia({actor:a,item:i},{},{}),false);
 assert.equal(R.consumirReliquia({actor:a,item:i},{},{}),false);
});
test('actualizar una explicación conocida conserva cargas, permisos, equipo y efectos de la copia',async()=>{
 const a=new MockActor(20),i=equipar(a,'mia-unheard-bell'),m=i.getFlag('ecos-frontera','reliquia');
 i.system.description.value='Explicación antigua generada';m.textoHuella=huellaTexto(i.system.description.value);m.textoVersion=1;m.permisoRitual=false;i.system.uses.spent=1;
 const antes=structuredClone({uses:i.system.uses,autorizada:m.autorizada,permiso:m.permisoRitual,equipped:i.system.equipped,attuned:i.system.attuned,effects:i.effects});
 const cambio=R.cambiosTextoReliquia(i);assert.ok(cambio);await i.update(cambio);
 assert.deepEqual({uses:i.system.uses,autorizada:m.autorizada,permiso:m.permisoRitual,equipped:i.system.equipped,attuned:i.system.attuned,effects:i.effects},antes);
 assert.equal(i.system.description.value,ficha('mia-unheard-bell').item.system.description.value);
 assert.equal(R.cambiosTextoReliquia(i),null);
});
test('una nota personalizada del DM no se sustituye por el texto nuevo del catálogo',()=>{
 const a=new MockActor(20),i=equipar(a,'mia-sun-sphere');
 i.getFlag('ecos-frontera','reliquia').textoHuella=huellaTexto(i.system.description.value);
 i.system.description.value+='<p>Nota privada de mi campaña y condiciones propias.</p>';
 assert.equal(R.cambiosTextoReliquia(i),null);
 game.user=game.users.get('player');return R.actualizarTextosReliquias().then(n=>assert.equal(n,0));
});
