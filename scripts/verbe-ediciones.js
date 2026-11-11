import { aPiesTexto } from "./verbe-327.js";
/**
 * Ediciones del DM sobre el catálogo base (tarea 1.4b y 1.4c).
 * Solo se guardan las diferencias en un ajuste del mundo: una actualización del módulo trae el catálogo nuevo
 * y las ediciones se vuelven a aplicar encima. «Restaurar original» borra la diferencia.
 * No depende de Foundry: lo usan el adaptador y las pruebas.
 */
const MOD = "ecos-frontera", F = "verbe";
const TIEMPOS = { A: "action", AA: "bonus", R: "reaction" };

/** Campos que el DM puede cambiar en una técnica del catálogo: [clave, etiqueta, tipo, mínimo, máximo]. */
export const CAMPOS_TECNICA = [
  ["n", "Nombre", "texto"],
  ["texto", "Qué hace (texto de reglas)", "area"],
  ["costo", "Coste de Verbe a su grado", "entero", 0, 100],
  ["trazos", "Trazos para aprenderla", "entero", 0, 100],
  ["nivelMin", "Nivel mínimo", "entero", 1, 20],
  ["tiempo", "Tiempo de uso", "tiempo"],
  ["alcance", "Alcance en metros (en la mesa se ve en pies: 1,5 m = 5 ft)", "numero", 0, 1500],
  ["areaTam", "Tamaño del área en metros (3 m = 10 ft)", "numero", 0, 180],
  ["dadosN", "Dados de daño o curación", "entero", 0, 100],
  ["dadosD", "Caras del dado", "dado"]
];
/** Campos editables de una dote. */
export const CAMPOS_DOTE = [
  ["nombre", "Nombre", "texto"],
  ["texto", "Qué hace", "area"],
  ["trazos", "Trazos para comprarla", "entero", 0, 100]
];

const actividad = tec => Object.values(tec?.item?.system?.activities ?? {})[0] ?? null;
const parteDados = tec => { const a = actividad(tec); return a?.healing ?? a?.damage?.parts?.[0] ?? null; };
const metros = v => String(Math.round(Number(v) * 10) / 10).replace(".", ",");

/** Los valores actuales de los campos editables de una técnica. */
export function leerCamposTecnica(tec) {
  const sys = tec?.item?.system ?? {}, p = parteDados(tec);
  const tiempo = Object.entries(TIEMPOS).find(([, v]) => v === sys.activation?.type)?.[0] ?? "";
  return {
    n: tec?.n ?? "", texto: tec?.texto ?? "", costo: Number(tec?.item?.flags?.[MOD]?.[F]?.costoBase ?? tec?.costo) || 0,
    trazos: Number(tec?.trazos) || 0, nivelMin: Number(tec?.nivelMin) || 1, tiempo,
    alcance: sys.range?.units === "m" || sys.range?.units === "ft" ? Number(sys.range.value) || 0 : "",
    areaTam: sys.target?.template?.type ? Number(sys.target.template.size) || 0 : "",
    dadosN: p ? Number(p.number) || 0 : "", dadosD: p ? Number(p.denomination) || 0 : ""
  };
}
export function leerCamposDote(d) {
  return { nombre: d?.nombre ?? "", texto: d?.texto ?? "", trazos: Number(d?.trazos) || 0 };
}

/** Limpia y valida lo que llega del formulario. Solo quedan los campos que cambian frente al original. */
export function diferencias(campos, original, propuesto) {
  const errores = [], cambios = {};
  for (const [k, etiqueta, tipo, min, max] of campos) {
    if (!(k in (propuesto ?? {}))) continue;
    let v = propuesto[k];
    if (v === "" || v === null || v === undefined) continue;
    if (tipo === "texto" || tipo === "area") {
      v = String(v).trim();
      const tope = tipo === "texto" ? 100 : 4000;
      if (!v || v.length > tope) { errores.push(`${etiqueta}: de 1 a ${tope} caracteres.`); continue; }
    } else if (tipo === "tiempo") {
      if (!TIEMPOS[v]) { errores.push(`${etiqueta}: Acción, Acción adicional o Reacción.`); continue; }
    } else if (tipo === "dado") {
      v = Number(v);
      if (![4, 6, 8, 10, 12].includes(v)) { errores.push(`${etiqueta}: d4, d6, d8, d10 o d12.`); continue; }
    } else {
      v = Number(v);
      if (!Number.isFinite(v) || v < min || v > max || (tipo === "entero" && !Number.isInteger(v))) { errores.push(`${etiqueta}: ${tipo === "entero" ? "entero " : ""}de ${min} a ${max}.`); continue; }
    }
    if (String(v) !== String(original?.[k] ?? "")) cambios[k] = v;
  }
  return { ok: !errores.length, errores, cambios };
}

/** Aplica las diferencias a una copia de la técnica. No toca el original. */
export function aplicarEdicionTecnica(tec, cambios = {}) {
  const t = structuredClone(tec);
  const sys = t.item.system, meta = (t.item.flags ??= {})[MOD] ??= {};
  const m = meta[F] ??= {};
  const campos = Object.keys(cambios);
  if (!campos.length) return t;
  if ("n" in cambios) { t.n = cambios.n; t.item.name = cambios.n; for (const a of Object.values(sys.activities ?? {})) if (a.name) a.name = cambios.n; }
  if ("texto" in cambios) {
    t.texto = cambios.texto;
    const html = String(sys.description?.value ?? "");
    const p = `<p>${String(cambios.texto).replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c])}</p>`;
    sys.description.value = /<h3>Qué hace<\/h3><p>[\s\S]*?<\/p>/.test(html) ? html.replace(/(<h3>Qué hace<\/h3>)<p>[\s\S]*?<\/p>/, `$1${p}`) : p + html;
  }
  if ("costo" in cambios) { t.costo = cambios.costo; m.costoBase = cambios.costo; }
  if ("trazos" in cambios) t.trazos = cambios.trazos;
  if ("nivelMin" in cambios) { t.nivelMin = cambios.nivelMin; if (t.obtencion) t.obtencion = { ...t.obtencion, nivel: cambios.nivelMin }; if (m.obtencion) m.obtencion = { ...m.obtencion, nivel: cambios.nivelMin }; }
  if ("tiempo" in cambios) { t.t = cambios.tiempo; sys.activation = { ...(sys.activation ?? {}), type: TIEMPOS[cambios.tiempo], value: 1 }; }
  if ("alcance" in cambios) {
    sys.range = { ...(sys.range ?? {}), units: cambios.alcance > 0 ? "m" : "self", value: cambios.alcance > 0 ? cambios.alcance : null };
    t.alc = cambios.alcance > 0 ? aPiesTexto(`${metros(cambios.alcance)} m`) : "yo";
  }
  if ("areaTam" in cambios && sys.target?.template?.type) {
    sys.target.template.size = cambios.areaTam;
    if (t.area) t.area = t.area.replace(/\d+(?:[,.]\d+)?\s*(?:m|ft)\b/, aPiesTexto(`${metros(cambios.areaTam)} m`));
  }
  const p = parteDados(t);
  if (p && ("dadosN" in cambios || "dadosD" in cambios)) {
    if ("dadosN" in cambios) p.number = cambios.dadosN;
    if ("dadosD" in cambios) p.denomination = cambios.dadosD;
    if (t.dmg) t.dmg = t.dmg.replace(/^\d+d\d+/, `${p.number}d${p.denomination}`);
  }
  const nota = `<p class="ev-nota"><b>Ajustada por el DM</b> (${campos.length} cambio${campos.length === 1 ? "" : "s"}). «Restaurar original» en el Taller del DM la devuelve a la versión del módulo.</p>`;
  sys.description.value = String(sys.description.value ?? "").replace(/<p class="ev-nota"><b>Ajustada por el DM<\/b>[\s\S]*?<\/p>/, "") + nota;
  t.editadaDM = { campos };
  return t;
}
export function aplicarEdicionDote(d, cambios = {}) {
  const n = structuredClone(d);
  if ("nombre" in cambios) n.nombre = cambios.nombre;
  if ("texto" in cambios) { n.texto = cambios.texto; if ("textoJ" in n) n.textoJ = cambios.texto; }
  if ("trazos" in cambios) n.trazos = cambios.trazos;
  if (Object.keys(cambios).length) n.editadaDM = { campos: Object.keys(cambios) };
  return n;
}

/** Recalcula el catálogo con las ediciones del mundo. `base` son las listas originales del módulo. */
export function catalogoConEdiciones(base, ediciones = {}) {
  const et = ediciones?.tecnicas ?? {}, ed = ediciones?.dotes ?? {};
  return {
    tecnicas: base.tecnicas.map(t => et[t.id] && Object.keys(et[t.id]).length ? aplicarEdicionTecnica(t, et[t.id]) : t),
    dotes: base.dotes.map(d => ed[d.id] && Object.keys(ed[d.id]).length ? aplicarEdicionDote(d, ed[d.id]) : d)
  };
}
