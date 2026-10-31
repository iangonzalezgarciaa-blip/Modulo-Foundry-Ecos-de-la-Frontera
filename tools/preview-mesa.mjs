/** Vista de revisión con HTML real y actores ficticios. No simula la ejecución de Foundry. */
import fs from 'node:fs';
import {MockActor,resetEnvironment,collection} from '../tests/helpers/foundry.mjs';
import {MesaEcos} from '../scripts/mesa.js';
import {perfilNpc,buscarEntradas} from '../scripts/mesa-core.js';
import {readCatalog} from './catalog.mjs';
resetEnvironment();game.journal=collection();game.items=collection();game.packs=collection();game.i18n={localize:s=>s};
CONFIG.DND5E.abilities={str:{label:'Fuerza'},dex:{label:'Destreza'},con:{label:'Constitución'},int:{label:'Inteligencia'},wis:{label:'Sabiduría'},cha:{label:'Carisma'}};
CONFIG.DND5E.skills={prc:{label:'Percepción'},ath:{label:'Atletismo'},sur:{label:'Supervivencia'}};
const D=readCatalog();game.modules.set('ecos-frontera',{api:{verbe:{datos:()=>D,estado:a=>a.getFlag('ecos-frontera','verbe'),maxVerbe:()=>26}}});
game.modules.set('plutonium',{active:true});
const a=new MockActor(3,{valor:18});a.id='demo-pj';a.uuid='Actor.demo-pj';a.name='Ari del Vado';a.hasPlayerOwner=true;a.system.attributes.hp={value:18,max:24};a.system.skills.prc={passive:13};
const npc=new MockActor(2);npc.type='npc';npc.id='demo-npc';npc.uuid='Actor.demo-npc';npc.name='Vigilante del paso';npc.system.attributes.hp={value:24,max:40};npc.system.attributes.ac.value=13;
const p=new MesaEcos({actor:a});const vistas={turno:'Mi turno',crear:'Crear personaje',buscar:'Buscar información',azar:'Dados 1 y 20',dm:'Dirección',npc:'Taller de NPC'},html={};
for(const id of Object.keys(vistas)){
 p.pestana=id;if(id==='npc')p.plan={base:npc.id,copiar:true,curar:false,perfil:perfilNpc({nombre:'Guardián del vado gris',vd:3,rol:'guardian',entorno:'Arcegris',motivacion:'Mantener abierto el paso',vinculo:'Protege la caravana de una antigua deuda'})};
 if(id==='buscar'){p.consulta='campamento';p.resultados=buscarEntradas(D.tecnicas.filter(t=>t.vida).map(t=>({nombre:t.n,texto:t.texto,tipo:'Técnica · '+t.rama,catalogo:t.id})),'campamento');p.resumenBusqueda='Resultados de ejemplo. Cada uno enlaza su fuente en Foundry.';}
 html[id]=await p._renderHTML();
}
const css=fs.readFileSync(new URL('../styles/ecos.css',import.meta.url),'utf8');
const doc=`<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Mesa Ecos · revisión 3.3</title><style>body{margin:0;background:#2c3037;font-family:system-ui,sans-serif;padding:18px}*{box-sizing:border-box}button,select{cursor:pointer}[hidden]{display:none!important}.preview-nota{color:#eee;text-align:center;font-size:13px;margin:0 0 14px}.ecos-mesa{height:calc(100vh - 70px);max-width:1040px;margin:auto;background:#eeeadf;border-radius:10px;overflow:hidden}.em-contenido{background:#eeeadf}${css}</style><p class="preview-nota">Vista de revisión · personajes ficticios · cambia de pestaña para revisar el HTML real. Las acciones se ejecutan dentro de Foundry.</p>${Object.entries(html).map(([id,s])=>`<div class="ecos-mesa" data-vista="${id}" ${id!=='turno'?'hidden':''}>${s}</div>`).join('')}<script>document.addEventListener('click',e=>{const b=e.target.closest('[data-em]');if(!b)return;e.preventDefault();if(b.dataset.em==='tab'){for(const v of document.querySelectorAll('[data-vista]'))v.hidden=v.dataset.vista!==b.dataset.id;}else{const p=document.querySelector('.preview-nota');p.textContent='Acción de demostración. Abre Mesa Ecos dentro de Foundry para usar esta función.';}});document.addEventListener('submit',e=>e.preventDefault());</script></html>`;
fs.writeFileSync(new URL('../docs/preview/mesa.html',import.meta.url),doc);console.log('Vista de Mesa Ecos: seis pestañas reales, ejemplo de búsqueda y vista previa de NPC.');
