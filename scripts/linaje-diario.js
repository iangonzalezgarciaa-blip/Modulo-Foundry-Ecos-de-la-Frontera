/**
 * El diario de cada sangre (3.26). Cuando el DM elige un linaje o un ojo en el panel del Verbe, se abre una ventana
 * que resume esa sangre y lo lleva a la página del diario del mundo que la cuenta entera: el dios, cómo llegó a la
 * sangre y lo que le dejó a su línea. Las páginas viven en el mundo (no en el módulo) y se reconocen por la marca
 * `flags["ecos-frontera"].linaje = <id del linaje>`; la portada lleva `linaje = "_indice"`.
 * Aquí no hay nombres de dioses ni lore: el texto sale del catálogo cifrado y de los diarios del DM.
 */
const MOD = "ecos-frontera";
export const INDICE = "_indice";

/** La primera página marcada con ese linaje. Puro: recibe páginas con {flags} y devuelve la primera que coincide. */
export function buscarPaginaLinaje(paginas, id) {
  if (!id) return null;
  for (const p of paginas ?? []) if (p?.flags?.[MOD]?.linaje === id) return p;
  return null;
}

/** El linaje que hay detrás de una elección del panel: un linaje directo, o el linaje del ojo elegido. Puro. */
export function linajeDeEleccion(campo, valor, D) {
  if (!valor || valor === "ninguno") return null;
  if (campo === "linaje") return D?.linajes?.find(l => l.id === valor)?.id ?? null;
  if (campo === "mirada") return D?.miradas?.find(m => m.id === valor)?.linaje ?? null;
  return null;
}

function todasLasPaginas() {
  const out = [];
  for (const j of game.journal ?? []) for (const p of j.pages ?? []) out.push(p);
  return out;
}
export const paginaDeLinaje = id => buscarPaginaLinaje(todasLasPaginas(), id);

const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

async function abrirPagina(p) {
  if (!p) return;
  const j = p.parent;
  await j.sheet.render(true, { pageId: p.id });
}

/**
 * La ventana. `resumen` es el HTML que ya arma el panel (describir("linaje", …)); `pasos`, una lista opcional de
 * cómo dárselo. Solo el DM la ve. Si ya está abierta, se cierra y se abre con la sangre nueva.
 */
export async function ventanaLinaje(id, { D, resumen = "", pasos = [], actor = null } = {}) {
  if (!game.user.isGM || !id) return;
  const l = D?.linajes?.find(x => x.id === id);
  if (!l) return;
  const pagina = paginaDeLinaje(id), indice = paginaDeLinaje(INDICE);
  const ojos = (D?.miradas ?? []).filter(m => m.linaje === id).map(m => m.nombre);
  const { DialogV2 } = foundry.applications.api;
  const previa = foundry.applications.instances?.get?.("ecos-linaje-diario");
  if (previa) await previa.close({ animate: false });
  const titulo = `${l.alias ?? l.nombre}${l.real && l.real !== (l.alias ?? l.nombre) ? ` · ${l.real}` : ""}`;
  const html = `<div class="ecos-linaje-diario">
    ${actor ? `<p class="ecos-nota">Para <b>${esc(actor.name)}</b>.</p>` : ""}
    ${resumen}
    ${ojos.length ? `<p><b>Ojo de esta sangre:</b> ${ojos.map(esc).join(", ")}.</p>` : ""}
    ${pasos.length ? `<details open><summary>Cómo dárselo</summary><ol>${pasos.map(x => `<li>${x}</li>`).join("")}</ol></details>` : ""}
    <p>${pagina ? `Su diario: <b>${esc(pagina.parent?.name)} · ${esc(pagina.name)}</b>. Cuenta el dios, cómo llegó a la sangre y todo lo que le dejó a su línea.`
      : "Este linaje todavía no tiene una página en los diarios del mundo (busca la marca del linaje en «Las sangres de los dioses»)."}</p>
  </div>`;
  const botones = [];
  if (pagina) botones.push({ action: "diario", label: "Abrir su diario", icon: "fa-solid fa-book-open", default: true, callback: () => abrirPagina(pagina) });
  else if (indice) botones.push({ action: "indice", label: "Abrir el índice de las sangres", icon: "fa-solid fa-book", callback: () => abrirPagina(indice) });
  botones.push({ action: "cerrar", label: "Cerrar", icon: "fa-solid fa-xmark", default: !pagina });
  return DialogV2.wait({
    id: "ecos-linaje-diario",
    window: { title: `Sangre · ${titulo}`, icon: "fa-solid fa-dna", resizable: true },
    position: { width: 560, height: "auto" },
    content: html, buttons: botones, rejectClose: false
  });
}

/** Los pasos para darle a alguien un ojo como sangre (no como trasplante). */
export function pasosOjo(nombreLinaje, nombreOjo) {
  return [
    `En «Naturalezas y linaje», elige <b>${esc(nombreLinaje)}</b> y la fuerza (Plena para un portador de campaña). Marca «el jugador lo sabe» solo cuando lo descubra. Pulsa <b>Guardar</b>.`,
    `En «Ramas, ojos, pactos y escuela», elige <b>${esc(nombreOjo)}</b>, la etapa que corresponda y <b>no</b> marques «trasplantado». Pulsa <b>Despertar o subir</b>.`,
    "Si tenía otra sangre, el panel no deja poner una segunda: cambia primero el linaje y después despierta el ojo."
  ];
}
