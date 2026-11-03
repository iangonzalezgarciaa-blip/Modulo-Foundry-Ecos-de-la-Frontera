import {avanceTexto,efectoHTML,textoClaro} from "./verbe-reading.js";

/** Presentación del panel. Sin escrituras ni dependencias de Foundry. */
export const escapar = s => String(s ?? "").replace(/[&<>"']/g, c => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
})[c]);

export function pasoInicial({ naturalezas = [], principal, tecnicas = 0, natOculta = false } = {}) {
  // Con la naturaleza oculta no se elige al empezar: se descubre entrenando.
  if (!naturalezas.length && !natOculta) return 1;
  if (!principal) return 2;
  return tecnicas > 0 ? 4 : 3;
}

export const ROLES_RAMA = {
  umbral: ["door-open", "Marcas y espacio-tiempo", "Prepara anclas y mueve a tus aliados entre posiciones."],
  vasija: ["dragon", "Huéspedes y bestias", "Coopera con una entidad vinculada y controla sus manifestaciones."],
  forma: ["wand-magic-sparkles", "Ataques y elementos", "Dale forma a tu energía y úsala a distancia."],
  cuerpo: ["hand-fist", "Combate cercano", "Refuerza tu cuerpo, tus golpes y tu movimiento."],
  velo: ["masks-theater", "Engaño e ilusiones", "Confunde, distrae y cambia lo que otros perciben."],
  sello: ["draw-polygon", "Protección y control", "Prepara marcas, barreras y restricciones."],
  hilo: ["bezier-curve", "Herramientas y precisión", "Maneja hilos y mecanismos con tu energía."],
  quietud: ["leaf", "Calma y entorno", "Trabaja con la energía del mundo que te rodea."],
  rastro: ["compass", "Exploración y sentidos", "Encuentra señales y percibe lo que otros pasan por alto."]
};

export function progresoHTML(paso) {
  return `<ol class="ev-progreso" aria-label="Primeros pasos">${["Elige elemento", "Elige especialidad", "Aprende una técnica", "Listo para jugar"].map((s, i) =>
    `<li class="${i + 1 < paso ? "hecho" : i + 1 === paso ? "actual" : ""}" ${i + 1 === paso ? 'aria-current="step"' : ""}><span aria-hidden="true">${i + 1 < paso ? "✓" : i + 1}</span>${s}</li>`).join("")}</ol>`;
}

export function estadoUsoHTML({ ok, motivo, despues, costo }) {
  if (!ok) return `<p class="ev-disponibilidad bloqueada"><i class="fa-solid fa-lock" aria-hidden="true"></i> ${escapar(textoClaro(motivo))}</p>`;
  if (despues < 0) return `<p class="ev-disponibilidad riesgo"><i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i> Sobreesfuerzo: quedarías en ${despues}. Exige salvación de Constitución.</p>`;
  return `<p class="ev-disponibilidad"><i class="fa-solid fa-circle-check" aria-hidden="true"></i> ${costo === 0 ? "Sin gasto de energía" : `Te quedarían ${despues} de Verbe`} al usar el grado base.</p>`;
}

export function tarjetaHTML(t) {
  const id = escapar(t.id);
  return `<article class="ev-tecnica ${t.riesgo ? "riesgo" : ""}">
    <div class="ev-tec-top"><span class="ev-etiqueta">Grado ${t.grado}</span><span class="ev-etiqueta suave">${escapar(t.rama)}</span>${t.naturaleza ? `<span class="ev-etiqueta suave">${escapar(t.naturaleza)}</span>` : ""}</div>
    <h3>${escapar(t.nombre)}</h3>${t.referencia ? `<small class="ev-referencia">${escapar(t.referencia)}</small>` : ""}<p class="ev-texto-tecnica">${escapar(avanceTexto(t.texto))}</p><details class="ev-efecto-completo"><summary>Leer el efecto completo y sus límites</summary>${efectoHTML(t.texto)}</details>${t.resolucion?`<p class="ev-nota"><b>Quién tira:</b> ${escapar(t.resolucion)}</p>`:""}
    <div class="ev-tec-datos"><span><i class="fa-regular fa-clock" aria-hidden="true"></i> ${escapar(t.tiempo)}</span><span><i class="fa-solid fa-crosshairs" aria-hidden="true"></i> ${escapar(t.alcance)}</span>${t.area ? `<span>${escapar(t.area)}</span>` : ""}</div>
    <div class="ev-costes"><span><b>${t.costo}</b> Verbe <small>por uso base</small></span>${t.trazos != null ? `<span><b>${t.trazos}</b> Trazos <small>para aprender</small></span>` : ""}</div>
    ${t.estado ?? ""}${t.nota ? `<p class="ev-nota">${escapar(t.nota)}</p>` : ""}
    <footer>${t.accionesExtra ?? ""}<button type="button" class="ev-principal" data-action="${escapar(t.accion)}" data-id="${id}" ${t.bloqueada ? "disabled" : ""}>${escapar(t.boton)}</button><button type="button" data-action="ficha" data-id="${id}">Ver detalles</button></footer>
  </article>`;
}

export function avisosJugadorHTML(actor) {
  const s = actor?.statuses ?? new Set();
  const avisos = [];
  if (s.has("acechado")) avisos.push(["No puedes actuar", "Estás a 0 puntos de vida y Acechado por la Muerte. Puedes hablar y arrastrarte; pide ayuda. El módulo gestiona tus salvaciones al comenzar el turno."]);
  else if (["incapacitated", "paralyzed", "stunned", "unconscious", "petrified", "dead"].some(k => s.has(k))) avisos.push(["Un estado te impide actuar", "Resuelve ese estado con el DM antes de usar técnicas."]);
  if (s.has("cargado")) avisos.push(["Sin reacción mientras estés Cargado", "Tus técnicas de reacción y tus defensas quedan bloqueadas."]);
  if (s.has("malherido")) avisos.push(["Malherido: necesitas cuidados", "La curación tiene un tope mientras sigas Malherido. Pide tratamiento; recuperar puntos de vida no elimina por sí solo la herida."]);
  if (s.has("heridant")) avisos.push(["Herida No Tratada", "Busca un sanador y reposo. El tratamiento diario y el descanso importan aunque tengas puntos de vida."]);
  const agotamiento = Number(actor?.system?.attributes?.exhaustion) || 0;
  if (agotamiento >= 4) avisos.push([`Agotamiento ${agotamiento}`, "No puedes gastar Verbe en negativo. Todavía puedes usar una técnica si tienes energía suficiente y tu estado te permite actuar."]);
  return avisos.length ? `<aside class="ev-avisos" aria-label="Tu estado">${avisos.map(([t, d]) => `<div role="status"><b><i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i> ${t}</b><p>${d}</p></div>`).join("")}</aside>` : "";
}
