/** Vista de revisión con HTML real y actores ficticios. No simula la ejecución de Foundry. */
import fs from 'node:fs';
import {MockActor,MockItem,resetEnvironment,collection} from '../tests/helpers/foundry.mjs';
import {MesaEcos} from '../scripts/mesa.js';
import {perfilNpc,buscarEntradas} from '../scripts/mesa-core.js';
import {readCatalog} from './catalog.mjs';
import {reciboHTML} from '../scripts/mesa-resolucion.js';
import * as V from '../scripts/verbe.js';
resetEnvironment();game.journal=collection();game.items=collection();game.packs=collection();game.i18n={localize:s=>s};
CONFIG.DND5E.abilities={str:{label:'Fuerza'},dex:{label:'Destreza'},con:{label:'Constitución'},int:{label:'Inteligencia'},wis:{label:'Sabiduría'},cha:{label:'Carisma'}};
CONFIG.DND5E.skills={prc:{label:'Percepción'},ath:{label:'Atletismo'},sur:{label:'Supervivencia'}};
const D=readCatalog();V.usarDatos(D,'activo');game.version='13.350';game.system={id:'dnd5e',version:'5.2.5'};
game.modules.set('ecos-frontera',{active:true,version:'3.4.0',api:{verbe:{datos:()=>D,estado:a=>a.getFlag('ecos-frontera','verbe'),maxVerbe:()=>26,ofertasActor:V.ofertasActor,requisitos:V.requisitos,costoUso:V.costoUso}}});
game.modules.set('plutonium',{active:true,api:{importer:{pOpen:async()=>{}}}});
const a=new MockActor(3,{valor:18});a.id='demo-pj';a.uuid='Actor.demo-pj';a.name='Ari del Vado';a.hasPlayerOwner=true;a.system.attributes.hp={value:18,max:24};a.system.skills.prc={passive:13};
const npc=new MockActor(2);npc.type='npc';npc.id='demo-npc';npc.uuid='Actor.demo-npc';npc.name='Vigilante del paso';npc.system.attributes.hp={value:24,max:40};npc.system.attributes.ac.value=13;
for(const s of Object.values(a.system.abilities))s.value=10;
for(const [i,type,name,system]of [[1,'class','Viajero',{levels:3,identifier:'viajero'}],[2,'race','Habitante del valle',{}],[3,'background','Guía de caminos',{}],[4,'equipment','Mochila de viaje',{}]])a.items.push(new MockItem({_id:String(i).padStart(16,'0'),type,name,system},a));
npc.items.push(new MockItem({_id:'0000000000000020',type:'feat',name:'Multiataque del vigilante',system:{description:{value:'Realiza dos ataques.'},activities:{golpe:{name:'Golpe',type:'attack',damage:{parts:[{number:2,denomination:6,bonus:'3'}]}}}}},npc));
const p=new MesaEcos({actor:a});p.enemigosEncuentro=[{actor:npc,cantidad:2,danoRonda:20,ataque:5,blancos:1}];
const vistas={turno:'Mi turno',intenciones:'Qué quiero hacer',crear:'Crear personaje',buscar:'Buscar información',azar:'Dados 1 y 20',dm:'Dirección',npc:'Taller de NPC',encuentros:'Encuentros',diagnostico:'Diagnóstico y pruebas',memoria:'Identidad de Nimerios'},html={};
for(const id of Object.keys(vistas)){
 p.pestana=id;if(id==='npc')p.plan={base:npc.id,copiar:true,curar:false,perfil:perfilNpc({nombre:'Guardián del vado gris',vd:3,rol:'guardian',entorno:'Arcegris',motivacion:'Mantener abierto el paso',vinculo:'Protege la caravana de una antigua deuda'})};
 if(id==='buscar'){p.consulta='campamento';p.resultados=buscarEntradas(D.tecnicas.filter(t=>t.vida).map(t=>({nombre:t.n,texto:t.texto,tipo:'Técnica · '+t.rama,catalogo:t.id})),'campamento');p.resumenBusqueda='Resultados de ejemplo. Cada uno enlaza su fuente en Foundry.';}
 html[id]=await p._renderHTML();
}
const css=fs.readFileSync(new URL('../styles/ecos.css',import.meta.url),'utf8');
html.recibo='<div class="em-marco"><main class="em-contenido">'+reciboHTML({grado:1,costo:2,antes:18,despues:16,nonce:'ejemplo',pasos:[{id:'coste',titulo:'Verbe pagado',detalle:'18 → 16. Coste confirmado: 2 Verbe.'},{id:'defensas',titulo:'Defensas previas resueltas',detalle:'El objetivo mantiene una amenaza válida.'},{id:'choque',titulo:'Choque de técnicas',detalle:'La contratécnica paga su coste e intercepta este lanzamiento contra el defensor.'}],pendiente:'Comprueba los estados y posiciones. Este ejemplo no ejecuta una tirada.'})+'</main></div>';
const doc=`<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Mesa Ecos · revisión 3.4</title><style>body{margin:0;background:#2c3037;font-family:system-ui,sans-serif;padding:18px}*{box-sizing:border-box}button,select{cursor:pointer}[hidden]{display:none!important}.preview-nota{color:#eee;text-align:center;font-size:13px;margin:0 0 14px}.ecos-mesa{height:calc(100vh - 70px);max-width:1040px;margin:auto;background:#eeeadf;border-radius:10px;overflow:hidden}.em-contenido{background:#eeeadf}${css}</style><p class="preview-nota">Vista de revisión · personajes ficticios · cambia de pestaña para revisar el HTML real. Las acciones se ejecutan dentro de Foundry.</p><label class="preview-nota">Vista de revisión <select data-preview-vista>${Object.keys(html).map(id=>`<option value="${id}">${vistas[id]??'Recibo de resolución'}</option>`).join('')}</select></label>${Object.entries(html).map(([id,s])=>`<div class="ecos-mesa" data-vista="${id}" ${id!=='turno'?'hidden':''}>${s}</div>`).join('')}<script>document.addEventListener('change',e=>{if(e.target.matches('[data-preview-vista]'))for(const v of document.querySelectorAll('[data-vista]'))v.hidden=v.dataset.vista!==e.target.value;});document.addEventListener('click',e=>{const b=e.target.closest('[data-em]');if(!b)return;e.preventDefault();if(b.dataset.em==='tab'){for(const v of document.querySelectorAll('[data-vista]'))v.hidden=v.dataset.vista!==b.dataset.id;}else{const p=document.querySelector('.preview-nota');p.textContent='Acción de demostración. Abre Mesa Ecos dentro de Foundry para usar esta función.';}});document.addEventListener('submit',e=>e.preventDefault());</script></html>`;
fs.writeFileSync(new URL('../docs/preview/mesa.html',import.meta.url),doc);console.log('Vista de Mesa Ecos: diez pestañas reales y recibo, con búsqueda, revisión y encuentros de ejemplo.');
