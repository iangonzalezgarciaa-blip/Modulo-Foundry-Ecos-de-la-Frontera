/** Jerarquía del canon y crecimiento de su sangre. Sin dependencias de Foundry. */
export const NIVELES_DIVINOS = [1, 5, 11, 16, 18, 20];
const TOPES_FUERZA = { rastro: 1, debil: 5, media: 11, plena: 20 };
const PESOS = { rastro: .25, debil: .5, media: .75, plena: 1 };
export function donDivino(linaje, fuerza, nivel) {
  const activo = linaje?.jerarquia === 'primordial' && !!TOPES_FUERZA[fuerza];
  if (!activo) return { etapa: 0, reserva: 0, ac: 0, despertarAC: 0, resistencias: [] };
  const n = Math.min(Math.max(1, Number(nivel) || 1), TOPES_FUERZA[fuerza]);
  const i = NIVELES_DIVINOS.findLastIndex(v => v <= n), madre = linaje.id === 'maethra';
  return { etapa: NIVELES_DIVINOS[i],
    reserva: (madre ? [.35,.5,.65,.8,.9,1] : [.1,.12,.15,.18,.2,.25])[i] * PESOS[fuerza],
    ac: madre ? (n >= 11 ? 2 : n >= 5 ? 1 : 0) : (n >= 11 ? 1 : 0),
    despertarAC: madre ? (n >= 18 ? 2 : n >= 11 ? 1 : 0) : 0,
    resistencias: madre && n >= 16 ? ['necrotic','poison'] : [] };
}
/** Estos requisitos también rigen para técnicas ya aprendidas. */
export function accesoDivino(meta, { linaje, fuerza, nivel, rangoSangre = 0 } = {}) {
  const a = meta.acceso ?? {};
  if (a.linaje && a.linaje !== linaje) return { ok:false, motivo:'Esta técnica pertenece a otro linaje.' };
  if (a.fuerzas && !a.fuerzas.includes(fuerza)) return { ok:false, motivo:'Esta culminación exige sangre plena.' };
  if (meta.divina && nivel < (meta.obtencion?.nivel ?? 1)) return { ok:false, motivo:`Pide nivel ${meta.obtencion.nivel}.` };
  if (meta.sec === 'sangre' && a.herencia && (fuerza === 'ninguna' || !TOPES_FUERZA[fuerza])) return { ok:false, motivo:'No tiene sangre activa.' };
  const tope = { rastro:1, debil:3, media:5, plena:9 }[fuerza] ?? 0;
  if (meta.sec === 'sangre' && a.herencia && rangoSangre < 5 && meta.g > tope) return { ok:false, motivo:`Su sangre llega hasta el grado ${tope}.` };
  return { ok:true };
}

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function notaPanteonHTML(D) {
  const nombres = {primordial:'Primigenio',menor:'Menor',sueno:'Sueño divinizado',ajeno:'Ajeno al panteón'};
  return `<h1>Panteón · revisión pendiente del lore (3.2)</h1>
  <p><b>Solo DM.</b> Esta nota separa el canon de los manuales y las reglas nuevas aprobadas por el autor. No sustituye los diarios existentes.</p>
  <h2>Canon conservado</h2><p>Los seis Primeros son Maethra, Ignis, Orun, Thalos, Nerys y Ashka. Maethra es la mayor; duerme bajo la Fisura. Nerys y Ashka fueron cosechadas y Orun quedó fragmentado: una sangre o un eco no resucita al dios. Los dioses menores y los sueños con fieles no son otros Primeros. Ozhar es ajeno y no se ofrece como linaje jugable.</p>
  <table><thead><tr><th>Dios</th><th>Jerarquía</th><th>Dominios y relación</th><th>Estado</th></tr></thead><tbody>${D.panteon.map(d=>`<tr><td>${esc(d.nombre)}</td><td>${nombres[d.jerarquia]}</td><td>${esc(d.texto)}</td><td>${d.propuesto?'Ampliación propuesta':'Canon de Nimerios'}</td></tr>`).join('')}</tbody></table>
  <h2>Reglas nuevas de sangre</h2><p>Todos los Primeros añaden reserva y defensas progresivas. Maethra tiene el mayor techo: con sangre plena, del 35% al 100% de reserva base adicional; los otros Primeros, del 10% al 25%. Se calcula sobre la tabla de nivel más el modificador, antes de dotes y multiplicadores. No entrega Verbe al asignar o subir de nivel. Sus hitos de crecimiento son 1, 5, 11, 16, 18 y 20. Rastro limita los dones nuevos a etapa 1 y 25% de intensidad; débil a etapa 5 y 50%; media a etapa 11 y 75%. El don Mítico supera el tope ordinario de grado, pero no convierte una sangre diluida en plena.</p>
  <p>Maethra añade +1 CA pasiva desde etapa 5 y +2 desde 11; los demás Primeros +1 desde 11. En su Despertar, Maethra suma +1 CA adicional desde 11 y +2 desde 18; desde 16 añade resistencia al veneno y necrótico durante ese Despertar. Las técnicas se compran con Trazos, respetan ramas, nivel, sendas, cuotas y Concentración. Las culminaciones divinas exigen sangre plena y el hito correspondiente. «Eco de los Primeros» y «Memoria de la Madre» los concede el DM en su pestaña de hitos.</p>
  <p>Se conserva la protección de portador frente a muerte por daño masivo que ya gestiona la campaña. No se añade otra vida gratuita. Ningún poder despierta a Maethra, altera Pilares, resucita dioses ni evita el Pacto del Velo automáticamente. Toda recuperación breve mantiene su presupuesto compartido, inferior al largo.</p>
  <h2>Pendiente: editar los lore journals internamente</h2><ol><li><b>Mundo 1 · Dioses y planos:</b> incorporar jerarquía, completar Nerys y Ashka, y añadir a Seyra y Dhoren, dioses menores jóvenes (canon desde 3.11).</li><li><b>Mundo 10 · El Verbe por dentro:</b> añadir las herencias nuevas, el crecimiento primigenio, las técnicas y los dos hitos. Separar claramente sangre, Mirada, tradición y culto.</li><li><b>Tramas · Los portadores y sus dones:</b> enlazar la progresión de Maethra con Eco → Paso → Voz → Señorío sin adelantar revelaciones ni resolver el final de la campaña.</li><li>Conservar páginas escritas y permisos de los diarios. Revisar las versiones para jugadores antes de revelar nombres verdaderos.</li></ol>
  <p>Fuentes: Compendio Universal del Director, pp. 8–25, 90–92 y 129–132. Las técnicas y cifras 3.2 son adaptación nueva de mesa, no reglas extraídas literalmente de esos PDF. Puedes editar esta nota: el módulo no reemplazará su texto.</p>`;
}

/** Un diario separado, privado y creado una sola vez; nunca sobreescribe notas del DM. */
export async function asegurarNotaPanteon(D) {
  if (!globalThis.game?.user?.isGM || !D?.panteon || !globalThis.JournalEntry) return null;
  let diario = game.journal?.find(j=>j.getFlag('ecos-frontera','panteonDM'));
  if (!diario) diario = await JournalEntry.create({name:'Ecos · Panteón y sangre divina (solo DM)',ownership:{default:0},
    flags:{'ecos-frontera':{panteonDM:1}},pages:[]});
  // Repara permisos si alguna importación heredó acceso de jugadores; conserva el contenido.
  const ownership = {default:0};
  for (const u of game.users) if (!u.isGM) ownership[u.id]=0;
  if (Object.entries(ownership).some(([k,v])=>(diario.ownership?.[k]??0)!==v)) await diario.update({ownership},{diff:false,recursive:false});
  let pagina = diario.pages.find(p=>p.getFlag('ecos-frontera','panteonRevision')===2);
  if (!pagina) [pagina] = await diario.createEmbeddedDocuments('JournalEntryPage',[{name:'Pendiente · actualizar panteón en los diarios de lore',type:'text',ownership,
    text:{content:notaPanteonHTML(D),format:1},flags:{'ecos-frontera':{panteonRevision:2}}}]);
  // También cierra cualquier permiso explícito de la página sin tocar sus ediciones.
  if (Object.entries(ownership).some(([k,v])=>(pagina.ownership?.[k]??0)!==v)) await pagina.update({ownership},{diff:false,recursive:false});
  return {diario,pagina};
}
