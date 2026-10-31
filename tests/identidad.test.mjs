import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {readCatalog,decodeCatalog} from '../tools/catalog.mjs';
import {potenciaTecnica} from '../tools/nimerios/potencia.mjs';
const D=readCatalog(),R=decodeCatalog(fs.readFileSync(new URL('../data/reliquias.txt',import.meta.url),'utf8'));
test('las 778 técnicas anteriores conservan sus reglas estructuradas e identificadores',()=>{
 const anterior=JSON.parse(fs.readFileSync(new URL('../tools/nimerios/potencia-3.2.1.json',import.meta.url)));
 assert.equal(Object.keys(anterior).length,778);
 for(const[id,huella]of Object.entries(anterior)){const t=D.tecnicas.find(t=>t.id===id);assert.ok(t,id);assert.equal(potenciaTecnica(t),huella,id);}
});
test('82 utilidades originales refuerzan primero las ramas más pequeñas sin daño o curación gratuitos',()=>{
 assert.equal(D.vida.nuevas,82);const nuevas=D.tecnicas.filter(t=>t.vida);assert.equal(nuevas.length,82);
 assert.equal(nuevas.filter(t=>t.rama==='forma').length,0);assert.equal(D.vida.ramas.umbral,16);assert.equal(D.vida.ramas.rastro,14);
 for(const t of nuevas){assert.ok(t.g<=3);assert.equal(t.item.system.level,t.g);assert.equal(t.nivelMin,[1,1,3,5][t.g]);
  for(const a of Object.values(t.item.system.activities)){assert.equal(a.type,'utility');assert.equal(a.damage,undefined);assert.equal(a.healing,undefined);assert.equal(a.consumption.spellSlot,false);}
  assert.match(t.automatizacion,/No modifica/);assert.match(t.texto,/herramientas, materiales, descansos/);
 }
});
test('nombres y textos visibles no contienen nombres de series y las claves guardadas se conservan',()=>{
 const prohibido=/Naruto|Shippuden|Made in Abyss|Sharingan|Byakugan|Rinnegan|Mangek|Susanoo|Kurama|Bondrewd|Gracefeel|Gruum|\bLyza\b|\bReg\b/i;
 for(const t of D.tecnicas){assert.doesNotMatch(t.n+' '+t.alias.join(' ')+' '+t.texto+' '+t.item.system.description.value,prohibido,t.id);assert.deepEqual(t.alias,[t.n]);}
 for(const r of R.reliquias)assert.doesNotMatch(r.nombre+' '+r.texto+' '+r.item.system.description.value,prohibido,r.id);
 assert.equal(D.bestiasShinobi.find(b=>b.id==='kurama').nombre,'Aurenox · nueve colas');
 assert.equal(D.linajes.find(l=>l.id==='gracefeel').nombre,'Lethria');assert.ok(R.reliquias.find(r=>r.id==='mia-lyza-s-letter'));
});
