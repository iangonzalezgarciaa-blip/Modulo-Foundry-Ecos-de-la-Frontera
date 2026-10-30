/** Vista sin Foundry: HTML real del panel, personajes ficticios y navegación de demostración. */
import fs from 'node:fs';
import { MockActor, MockItem, resetEnvironment } from '../tests/helpers/foundry.mjs';
import { readCatalog } from './catalog.mjs';
import * as V from '../scripts/verbe.js';
const D = readCatalog(), paginas = {}, fichas = {};
const nombres = { inicio: 'Primer despertar', rama: 'Elegir especialidad', aprender: 'Primera técnica', jugar: 'Listo para jugar', riesgo: 'Deuda y estados' };
for (const vista of Object.keys(nombres)) {
  resetEnvironment(); V.usarDatos(D, 'activo'); game.user = game.users.get('player');
  const a = new MockActor(3, { valor: vista === 'riesgo' ? 0 : 18, nats: vista === 'inicio' ? [] : ['fuego'],
    principal: ['inicio','rama'].includes(vista) ? null : 'forma' });
  a.id = 'vista-jugador'; a.name = 'Ari · viajero del valle'; a.system.abilities.wis.mod = 3; a.system.currency.soul = 0;
  if (['jugar','riesgo'].includes(vista)) for (const id of ['fuego-aliento','forma-sustitucion','fuego-luz','forma-andar']) {
    const t = D.tecnicas.find(t => t.id === id); if (t) a.items.push(new MockItem(V.datosItem(a, t), a));
  }
  if (vista === 'riesgo') { a.system.attributes.exhaustion = 4; a.statuses.add('malherido'); a.statuses.add('cargado'); }
  const p = new V.PanelVerbe(a); paginas[vista] = {};
  for (const tab of vista === 'jugar' ? ['resumen','jugar','tienda','ramas','dotes','cultivo','crear','guia'] : vista === 'riesgo' ? ['resumen','jugar'] : ['resumen']) {
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
const html = `<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>El Verbe · Interfaz 2.9</title><style>
*{box-sizing:border-box}body{margin:0;background:#e3e7e0;font:14px/1.45 system-ui,sans-serif;color:#24312f}button,select,input{font:inherit}button,summary{cursor:pointer}button{padding:7px 11px}button:disabled{cursor:not-allowed} .barra-demo{max-width:980px;margin:20px auto 12px;padding:0 14px;display:flex;align-items:center;gap:12px;flex-wrap:wrap}.barra-demo small{color:#52645f}.barra-demo label{display:flex;gap:7px;align-items:center}.barra-demo select{padding:6px} .ecos-verbe-panel{width:min(940px,calc(100% - 28px));height:790px;margin:0 auto 25px;border:1px solid #aebbb0;border-radius:12px;overflow:hidden;box-shadow:0 12px 36px #23372b19}.window-header{background:#243e35;color:#fff;display:flex;justify-content:space-between;padding:10px 16px;font-size:12px}.window-content{height:calc(100% - 38px);display:flex;flex-direction:column}.ecos-verbe-cuerpo{overflow:auto;flex:1}table{width:100%}details>summary{user-select:none}.fa-solid,.fa-regular{display:inline-block;min-width:1em;font-style:normal}.fa-solid:before,.fa-regular:before{content:'◇'}.fa-bolt:before{content:'ϟ'}.fa-house:before{content:'⌂'}.fa-book-open:before{content:'▤'}.fa-droplet:before{content:'◒'}.fa-crosshairs:before{content:'⊕'}.fa-clock:before{content:'◷'}.fa-circle-check:before{content:'✓'}.fa-lock:before{content:'⊘'}.fa-triangle-exclamation:before{content:'⚠'}#aviso{position:fixed;bottom:15px;left:50%;transform:translateX(-50%);background:#243e35;color:white;padding:12px 18px;border-radius:8px;max-width:90%;box-shadow:0 5px 25px #0003}#aviso:empty{display:none}dialog{max-width:min(800px,95vw);max-height:85vh;overflow:auto;background:#fffef9;border:1px solid #9fb3a4;border-radius:12px;padding:20px}dialog::backdrop{background:#16281fa0}dialog h2{font:25px Georgia,serif}dialog footer{text-align:right;margin-top:15px}
${css}</style><body><div class="barra-demo"><b>El Verbe · Vista previa 2.9</b><label>Personaje <select id="escenario">${Object.entries(nombres).map(([k,n])=>`<option value="${k}">${n}</option>`).join('')}</select></label><label><input type="checkbox" id="oscuro"> Tema oscuro</label><small>Datos ficticios. No guarda cambios ni tira dados.</small></div><main class="ecos-verbe-panel"><div class="window-header"><span>ECOS DE LA FRONTERA</span><span>EL VERBE</span></div><div class="window-content" id="panel"></div></main><div id="aviso" role="status"></div><dialog id="ficha"><h2 id="titulo-ficha"></h2><div id="contenido-ficha"></div><footer><button id="cerrar-ficha">Cerrar</button></footer></dialog><script type="application/json" id="datos">${datos}</script><script>
const datos=JSON.parse(document.getElementById('datos').textContent),panel=document.getElementById('panel');let escena='inicio',pagina='resumen',temporizador;const buscador=document.getElementById('escenario');
function aviso(t){clearTimeout(temporizador);document.getElementById('aviso').textContent=t;temporizador=setTimeout(()=>document.getElementById('aviso').textContent='',4500)}
function render(){panel.innerHTML=(datos.paginas[escena][pagina]??datos.paginas.jugar[pagina]);buscador.value=escena}
buscador.onchange=()=>{escena=buscador.value;pagina='resumen';render()};document.getElementById('oscuro').onchange=e=>document.body.classList.toggle('theme-dark',e.target.checked);document.getElementById('cerrar-ficha').onclick=()=>document.getElementById('ficha').close();
panel.addEventListener('click',e=>{const b=e.target.closest('[data-action]');if(!b||b.disabled)return;const action=b.dataset.action;if(action==='pestana'){e.preventDefault();pagina=b.dataset.p;render()}else if(action==='ficha'){e.preventDefault();const f=datos.fichas.jugar[b.dataset.id];if(f){document.getElementById('titulo-ficha').textContent=f.title;document.getElementById('contenido-ficha').innerHTML=f.html;document.getElementById('ficha').showModal()}}else if(action==='elegir'){escena=b.dataset.campo==='nat'?'rama':'aprender';pagina='resumen';render();aviso('Demostración del siguiente paso. En Foundry se confirma tu elección antes de guardarla.')}else if(action==='aprender'){aviso('En Foundry este botón aprende la técnica y cobra sus Trazos. Esta vista no modifica personajes.')}else if(action==='usar'){aviso('En Foundry se abre la actividad de tu técnica para elegir grado y confirmar su uso.')}else if(action==='limpiarFiltros'){render()}else{aviso('Esta acción se resuelve dentro de Foundry.')}});
panel.addEventListener('change',e=>{if(e.target.type==='search'){const texto=e.target.value.toLocaleLowerCase();panel.querySelectorAll('.ev-tecnica,details.ecos-verbe-tec').forEach(c=>c.hidden=!c.textContent.toLocaleLowerCase().includes(texto))}else if(e.target.matches('[data-filtro],[data-filtro-dote],[data-filtro-uso]'))aviso('La versión instalada aplica todos los filtros; esta vista muestra el HTML de cada sección.')});render();
</script></body></html>`;
const dest = new URL('../docs/preview/interfaz.html', import.meta.url); fs.mkdirSync(new URL('.', dest), { recursive: true });fs.writeFileSync(dest,html);
console.log('Vista previa generada con HTML real del panel: docs/preview/interfaz.html');
