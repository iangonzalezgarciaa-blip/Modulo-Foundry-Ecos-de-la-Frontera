/** Vista sin Foundry: HTML real del panel, personajes ficticios y navegación de demostración. */
import fs from 'node:fs';
import { MockActor, MockItem, resetEnvironment } from '../tests/helpers/foundry.mjs';
import { readCatalog, decodeCatalog } from './catalog.mjs';
import { CatalogoReliquias, usarDatosReliquias } from '../scripts/relics.js';
import * as V from '../scripts/verbe.js';
const D = readCatalog(), paginas = {}, fichas = {};
const version=JSON.parse(fs.readFileSync(new URL('../package.json',import.meta.url),'utf8')).version;
const nombres = { reliquias: 'Compendio de reliquias (DM)', divina: 'Sangre Antigua · nivel 20', shinobi: 'Huésped, ojos y réplicas', umbral: 'Especialista de Umbral', inicio: 'Primer despertar', rama: 'Elegir especialidad', aprender: 'Primera técnica', jugar: 'Listo para jugar', riesgo: 'Deuda y estados', dm: 'Asignar linaje (DM)', taller: 'Taller universal (DM)' };
for (const vista of Object.keys(nombres)) {
  resetEnvironment(); V.usarDatos(D, 'activo'); game.user = game.users.get(['dm','taller','shinobi','reliquias','divina'].includes(vista) ? 'gm' : 'player');
  const a = new MockActor(3, { valor: vista === 'riesgo' ? 0 : 18, nats: vista === 'inicio' ? [] : ['fuego'],
    principal: ['inicio','rama'].includes(vista) ? null : 'forma' });
  a.id = 'vista-jugador'; a.name = 'Ari · viajero del valle'; a.system.abilities.wis.mod = 3; a.system.currency.soul = 0;
  if (['jugar','riesgo'].includes(vista)) for (const id of ['fuego-aliento','forma-sustitucion','fuego-luz','forma-andar']) {
    const t = D.tecnicas.find(t => t.id === id); if (t) a.items.push(new MockItem(V.datosItem(a, t), a));
  }
  if (['shinobi','umbral'].includes(vista)) {
    a.system.details.level=20; Object.assign(V.estado(a),{valor:48,principal:vista==='umbral'?'umbral':'vasija',rangos:Object.fromEntries(D.ramas.map(r=>[r.id,5])),linaje:'aster',fuerza:'plena',miradas:{aster:4},tradiciones:['sombra','marioneta','sellado','sapo'],vasija:{bestia:'kurama',vinculo:3},reservaReplicas:12});
    for(const id of ['forma-replica-solida','fuego-aliento','umbral-raijin','mirada-aster-costillas','vasija-manto-rojo']) {const t=D.tecnicas.find(t=>t.id===id);if(t)a.items.push(new MockItem(V.datosItem(a,t),a));}
    await a.createEmbeddedDocuments('ActiveEffect',[{name:'Formación de réplicas',flags:{'ecos-frontera':{verbe:{replicas:true}}}}]);
  }
  if (vista === 'riesgo') { a.system.attributes.exhaustion = 4; a.statuses.add('malherido'); a.statuses.add('cargado'); }
  const p = new V.PanelVerbe(a); paginas[vista] = {};
  if(vista==='reliquias'){usarDatosReliquias(decodeCatalog(fs.readFileSync(new URL('../data/reliquias.txt',import.meta.url),'utf8')));paginas[vista].resumen=await new CatalogoReliquias(a)._renderHTML();continue;}
  if(vista==='divina'){a.system.details.level=20;Object.assign(V.estado(a),{linaje:'maethra',fuerza:'plena',linajeVisible:true,principal:'sangre',rangos:{sangre:5}});p.pestana='resumen';paginas[vista].resumen=await p._renderHTML();continue;}
  if (vista === 'taller') { paginas[vista].resumen = await new V.EditorCatalogoVerbe()._renderHTML(); continue; }
  if (vista === 'dm') { V.estado(a).linaje='ignis';V.estado(a).fuerza='media';p.pestana='dm';paginas[vista].resumen=await p._renderHTML();continue; }
  for (const tab of vista === 'shinobi' ? ['resumen','jugar','ramas','dm'] : vista === 'umbral' ? ['resumen','ramas'] : vista === 'jugar' ? ['resumen','jugar','tienda','ramas','dotes','cultivo','crear','guia'] : vista === 'riesgo' ? ['resumen','jugar'] : ['resumen']) {
    p.pestana = tab; paginas[vista][tab] = await p._renderHTML();
  }
  if (vista !== 'jugar') continue;
  foundry.applications.api.DialogV2.wait = config => { fichas[vista] ??= {}; fichas[vista][fichas.id] = { title: config.window.title, html: config.content }; return Promise.resolve(); };
  const ids = new Set([...Object.values(paginas[vista]).join('').matchAll(/data-id="([^"]+)"/g)].map(m => m[1]));
  for (const id of ids) if (V.tecnicaPorId(id, a)) {
    fichas.id = id;
    V.PanelVerbe.DEFAULT_OPTIONS.actions.ficha.call(p, { preventDefault() {} }, { dataset: { id } });
  }
}
delete fichas.id;
const css = fs.readFileSync(new URL('../styles/ecos.css', import.meta.url), 'utf8');
const datos = JSON.stringify({ paginas, fichas }).replaceAll('<', '\\u003c');
const html = `<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>El Verbe · Interfaz ${version}</title><style>
*{box-sizing:border-box}body{margin:0;background:#e9e3d7;font:14px/1.45 system-ui,sans-serif;color:#292724}button,select,input{font:inherit}button,summary{cursor:pointer}button{padding:7px 11px}button:disabled{cursor:not-allowed} .barra-demo{max-width:980px;margin:20px auto 12px;padding:0 14px;display:flex;align-items:center;gap:12px;flex-wrap:wrap}.barra-demo small{color:#655d50}.barra-demo label{display:flex;gap:7px;align-items:center}.barra-demo select{padding:6px} .ecos-verbe-panel{width:min(940px,calc(100% - 28px));height:790px;margin:0 auto 25px;border:1px solid #cec4ae;border-radius:12px;overflow:hidden;box-shadow:0 12px 36px #23372b19}.window-header{background:#302e29;color:#fff;display:flex;justify-content:space-between;padding:10px 16px;font-size:12px}.window-content{height:calc(100% - 38px);display:flex;flex-direction:column}.ecos-verbe-cuerpo{overflow:auto;flex:1}table{width:100%}details>summary{user-select:none}.fa-solid,.fa-regular{display:inline-block;min-width:1em;font-style:normal}.fa-solid:before,.fa-regular:before{content:'◇'}.fa-bolt:before{content:'ϟ'}.fa-house:before{content:'⌂'}.fa-book-open:before{content:'▤'}.fa-droplet:before{content:'◒'}.fa-crosshairs:before{content:'⊕'}.fa-clock:before{content:'◷'}.fa-circle-check:before{content:'✓'}.fa-lock:before{content:'⊘'}.fa-triangle-exclamation:before{content:'⚠'}#aviso{position:fixed;bottom:15px;left:50%;transform:translateX(-50%);background:#302e29;color:white;padding:12px 18px;border-radius:8px;max-width:90%;box-shadow:0 5px 25px #0003}#aviso:empty{display:none}dialog{max-width:min(800px,95vw);max-height:85vh;overflow:auto;background:#fffcf4;border:1px solid #9fb3a4;border-radius:12px;padding:20px}dialog::backdrop{background:#16281fa0}dialog h2{font:25px Georgia,serif}dialog footer{text-align:right;margin-top:15px}
${css}</style><body><div class="barra-demo"><b>El Verbe · Vista previa ${version}</b><label>Personaje <select id="escenario">${Object.entries(nombres).map(([k,n])=>`<option value="${k}">${n}</option>`).join('')}</select></label><label><input type="checkbox" id="oscuro"> Tema oscuro</label><small>Datos ficticios. No guarda cambios ni tira dados.</small></div><main class="ecos-verbe-panel"><div class="window-header"><span>ECOS DE LA FRONTERA</span><span>EL VERBE</span></div><div class="window-content" id="panel"></div></main><div id="aviso" role="status"></div><dialog id="ficha"><h2 id="titulo-ficha"></h2><div id="contenido-ficha"></div><footer><button id="cerrar-ficha">Cerrar</button></footer></dialog><script type="application/json" id="datos">${datos}</script><script>
const datos=JSON.parse(document.getElementById('datos').textContent),panel=document.getElementById('panel');let escena='inicio',pagina='resumen',temporizador;const buscador=document.getElementById('escenario');
function aviso(t){clearTimeout(temporizador);document.getElementById('aviso').textContent=t;temporizador=setTimeout(()=>document.getElementById('aviso').textContent='',4500)}
function render(){document.querySelector('main').classList.toggle('ecos-editor-catalogo',escena==='taller');panel.innerHTML=(datos.paginas[escena][pagina]??datos.paginas.jugar[pagina]);buscador.value=escena}
buscador.onchange=()=>{escena=buscador.value;pagina='resumen';render()};document.getElementById('oscuro').onchange=e=>document.body.classList.toggle('theme-dark',e.target.checked);document.getElementById('cerrar-ficha').onclick=()=>document.getElementById('ficha').close();
panel.addEventListener('click',e=>{const b=e.target.closest('[data-action]');if(!b||b.disabled)return;const action=b.dataset.action;if(action==='pestana'){e.preventDefault();pagina=b.dataset.p;render()}else if(action==='ficha'){e.preventDefault();const f=datos.fichas.jugar[b.dataset.id];if(f){document.getElementById('titulo-ficha').textContent=f.title;document.getElementById('contenido-ficha').innerHTML=f.html;document.getElementById('ficha').showModal()}}else if(action==='elegir'){escena=b.dataset.campo==='nat'?'rama':'aprender';pagina='resumen';render();aviso('Demostración del siguiente paso. En Foundry se confirma tu elección antes de guardarla.')}else if(action==='aprender'){aviso('En Foundry este botón aprende la técnica y cobra sus Trazos. Esta vista no modifica personajes.')}else if(action==='usar'){aviso('En Foundry se abre la actividad de tu técnica para elegir grado y confirmar su uso.')}else if(action==='limpiarFiltros'){render()}else{aviso('Esta acción se resuelve dentro de Foundry.')}});
panel.addEventListener('change',e=>{if(e.target.type==='search'){const texto=e.target.value.toLocaleLowerCase();panel.querySelectorAll('.ev-tecnica,details.ecos-verbe-tec').forEach(c=>c.hidden=!c.textContent.toLocaleLowerCase().includes(texto))}else if(e.target.matches('[data-filtro],[data-filtro-dote],[data-filtro-uso]'))aviso('La versión instalada aplica todos los filtros; esta vista muestra el HTML de cada sección.')});render();
</script></body></html>`;
const dest = new URL('../docs/preview/interfaz.html', import.meta.url); fs.mkdirSync(new URL('.', dest), { recursive: true });fs.writeFileSync(dest,html);
console.log('Vista previa generada con HTML real del panel: docs/preview/interfaz.html');
