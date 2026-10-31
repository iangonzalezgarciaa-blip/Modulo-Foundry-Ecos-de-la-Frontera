/** Secuencias de recursos de tres encuentros. Usa compras, consumo, choques y descansos reales del adaptador. */
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {MockActor,resetEnvironment} from '../tests/helpers/foundry.mjs';
import {readCatalog} from './catalog.mjs';
import * as V from '../scripts/verbe.js';
const D=readCatalog(),resultados=[];
const porId=id=>D.tecnicas.find(t=>t.id===id);
async function comprarCamino(a,t,vistos=new Set()){
 if(!t||V.conoce(a,t.id))return true;if(vistos.has(t.id))return false;vistos.add(t.id);
 const previa=t.previa?porId(t.previa):D.tecnicas.find(p=>p.n===t.req);
 if(previa&&!await comprarCamino(a,previa,vistos))return false;
 return await V.aprender(a,t,{aprobado:true})===true;
}
async function preparar(nivel,linaje){
 resetEnvironment();V.usarDatos(D,'activo');
 const a=new MockActor(nivel,{progresionVersion:1,shinobiVersion:1,nats:['fuego'],principal:'forma',rangos:{forma:1},ordenRamas:['forma'],linaje:linaje==='ninguna'?null:linaje,fuerza:linaje==='ninguna'?'ninguna':'plena'});
 a.system.abilities.wis.mod=3;
 const rango=D.rangos.findLastIndex(r=>r.nivel<=nivel);while(V.rangoDe(a,'forma')<rango){const antes=V.rangoDe(a,'forma');await V.subirRango(a,'forma');assert.equal(V.rangoDe(a,'forma'),antes+1);}
 if(nivel>=5)await V.subirAfinidad(a,'fuego',{aprobado:true});if(nivel>=11)await V.subirAfinidad(a,'fuego',{aprobado:true});
 await V.comprarControl(a);if(nivel>=5)await V.comprarControl(a);
 for(let i=1;i<=4;i++)if(nivel>=[3,7,11,18][i-1])await V.comprarDote(a,`senda-forma-${i}`);
 for(const[n,id,hito]of [[19,'ascension-mitica','prueba-mitica'],[20,'ascension-trascendente','prueba-trascendente']])if(nivel>=n){await V.concederShinobi(a,'hito',hito);await V.comprarDote(a,id);}
 for(const id of ['fuego-aliento','forma-sustitucion','vida-rastro-lupa-taller'])assert.equal(await comprarCamino(a,porId(id)),true,id);
 if(nivel>=5)await V.comprarDote(a,'respiro');
 const opciones=D.tecnicas.filter(t=>t.rama==='forma'&&t.nat==='fuego'&&!t.soloDM&&Object.values(t.item.system.activities).some(x=>x.damage?.parts?.length)).sort((a,b)=>b.g-a.g||a.id.localeCompare(b.id));
 let alta=porId('fuego-aliento');for(const t of opciones)if(V.requisitos(a,t).ok&&await comprarCamino(a,t)){alta=t;break;}
 assert.ok(V.trazos(a).gastados<=V.trazos(a).total);
 V.estado(a).valor=V.maxVerbe(a);return {a,alta};
}
async function usar(a,t){
 const item=a.items.find(i=>i.getFlag('ecos-frontera','verbe')?.id===t.id);if(!item)return null;
 const m=item.getFlag('ecos-frontera','verbe');if(V.costoUso(a,m,m.g)>V.estado(a).valor)return null;
 const activity={actor:a,item},uso={},updates={};if(V.alConsumir(activity,uso,{},updates)===false)return null;
 await a.update(updates.actor);await V._prueba.despuesDeUsar(activity,uso);
 const partes=Object.values(item.system.activities)[0].damage?.parts??[];
 return {grado:uso.ecosVerbe.grado,costo:uso.ecosVerbe.costo,media:partes.reduce((n,p)=>n+(p.number||0)*((p.denomination||0)+1)/2,0)};
}
for(const nivel of [1,5,11,16,18,20])for(const estilo of ['ofensiva','mixta','defensiva','utilidad'])for(const linaje of ['ninguna','varro','ignis','maethra']){
 const {a,alta}=await preparar(nivel,linaje),inicio=V.estado(a).valor,libres=V.trazos(a).libres;
 const row={nivel,estilo,linaje,inicio,libres,tecnicaAlta:alta.n,encuentros:[],acciones:0,contratecnicas:0,sustituciones:0,mediaDados:0,gasto:0,corto:0};
 for(let encuentro=1;encuentro<=3;encuentro++){
  game.combat={id:'ensayo',started:estilo!=='utilidad',round:1,turn:0,combatant:{actor:a}};
  for(let ronda=1;ronda<=3;ronda++){
   game.combat.round=ronda;await V._prueba.inicioDeTurno(game.combat);
   if(estilo==='utilidad'){const u=await usar(a,porId('vida-rastro-lupa-taller'));if(u){row.acciones++;row.gasto+=u.costo;}continue;}
   if(estilo!=='defensiva'){
    const elegida=estilo==='ofensiva'?alta:porId('fuego-aliento');let u=await usar(a,elegida);if(!u&&elegida.g>1)u=await usar(a,porId('fuego-aliento'));
    if(u){row.acciones++;row.gasto+=u.costo;row.mediaDados+=u.media;}
   }
   if(estilo==='defensiva'){const u=await usar(a,porId('forma-sustitucion'));if(u){row.sustituciones++;row.gasto+=u.costo;}}
   if(estilo==='defensiva'||estilo==='mixta')for(let amenaza=0;amenaza<(estilo==='defensiva'?2:1);amenaza++){
    const base=porId('fuego-aliento');if(V.costoUso(a,base,base.g)>V.estado(a).valor)break;
    const u=await V._prueba.pagarContraTecnica(a,base.id,base.g);if(u){row.contratecnicas++;row.gasto+=u.costo;}
   }
   assert.ok(V.estado(a).valor>=0,'La secuencia excluye deuda voluntaria.');
  }
  row.encuentros.push(V.estado(a).valor);
  if(encuentro===1){const antes=V.estado(a).valor;await V.alDescansar(a,{}, {type:'short'});row.corto=V.estado(a).valor-antes;}
 }
 const antesLargo=V.estado(a).valor;await V.alDescansar(a,{}, {type:'long'});row.largo=V.estado(a).valor-antesLargo;
 assert.ok(row.corto<V.recuperacionLargaVerbe(a));assert.ok(V.estado(a).valor<=V.maxVerbe(a));assert.ok(V.trazos(a).gastados<=V.trazos(a).total);
 resultados.push(row);
}
const informe=['# Ensayo de secuencias de recursos · 3.4','',
 'Se compran rangos, afinidad, Control, sendas, técnicas y Respiro con las funciones reales y el presupuesto de Trazos. No se conceden dotes gratuitas. Tres encuentros de tres rondas; en utilidad son tres escenas de tres tareas de un minuto, fuera de combate. Hay un Corto después del primer encuentro y un Largo final en Santuario. Se excluye deuda voluntaria.',
 '', 'Ofensiva intenta el poder de fuego más alto que pudo comprar y usa Aliento de respaldo cuando corresponde. Mixta paga un ataque básico y una contratécnica por ronda. Defensiva intenta una Sustitución y hasta dos contratécnicas frente a amenazas individuales aptas. Las amenazas se consideran individuales, visibles y aptas, con sustituto válido y sin sobrecoste por superar el grado máximo del defensor. Las utilidades se usan de forma consecutiva, sin acumular Concentraciones. La tabla cuenta costes, no defensas ganadas: un choque todavía compara potencia y Control. Utilidad emplea Lupa del taller.',
 '', 'Las medias de dados no incluyen impacto, salvaciones, mitigación, objetivos múltiples, curación, terreno o acciones de otros personajes. Este ensayo mide economía de recursos y acceso; las victorias y la experiencia de combate se validan en la mesa real. No se afirma que un personaje pueda sostener todas las amenazas del modelo.',
 '', '| Nivel | Plan | Linaje | Reserva | Verbe tras E1/E2/E3 | Corto | Acciones/tareas | Contratécnicas | Sustituciones | Media de dados ofensivos | Largo final |', '|---:|---|---|---:|---|---:|---:|---:|---:|---:|---:|'];
for(const r of resultados)informe.push(`| ${r.nivel} | ${r.estilo} | ${r.linaje} | ${r.inicio} | ${r.encuentros.join(' / ')} | +${r.corto} | ${r.acciones} | ${r.contratecnicas} | ${r.sustituciones} | ${r.mediaDados.toFixed(1)} | +${r.largo} |`);
informe.push('','## Para la prueba del autor','','- Repite una escena con varios enemigos: los choques independientes de reacción también consumen reserva y pueden desplazar el uso ofensivo.','- Registra control, caídas, daño recibido, curaciones y duración real; no reduzcas su valor a los dados.','- Prueba tres encuentros sin Santuario y con recursos diarios altos ya gastados.','- Comprueba por separado Maethra y otras fuerzas de sangre: sus reservas y facultades modifican la duración, no conceden acciones nuevas.','- El generador de encuentros muestra las hipótesis utilizadas y permite corregir daño de rutina, ataque y blancos de área. No certifica el VD de capacidades importadas.','');
fs.writeFileSync(new URL('../docs/ENSAYO_SESIONES_3.4.md',import.meta.url),informe.join('\n'));
fs.writeFileSync(new URL('../docs/ENSAYO_SESIONES_3.4.json',import.meta.url),JSON.stringify(resultados,null,2)+'\n');
console.log(`Secuencias comprobadas: ${resultados.length} perfiles en niveles 1, 5, 11, 16, 18 y 20.`);
