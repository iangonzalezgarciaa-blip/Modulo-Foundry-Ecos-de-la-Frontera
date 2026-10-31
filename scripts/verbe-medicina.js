/** Puente explícito entre técnicas registradas y heridas de la campaña. */
export function tipoCuracionVerbe(item) {
  const declarada = item?.getFlag?.("ecos-frontera", "verbe")?.curacionCasa ?? item?.flags?.["ecos-frontera"]?.verbe?.curacionCasa;
  if (["piedad","pulsoTratamiento","sanar","masa"].includes(declarada)) return declarada;
  const id = item?.getFlag?.("ecos-frontera", "verbe")?.id ?? item?.flags?.["ecos-frontera"]?.verbe?.id;
  return ({ "pulso-sostener": "piedad", "pulso-cerrar": "pulsoTratamiento",
    "pulso-restaurar": "sanar", "pulso-muchos": "masa", "pulso-rehacer": "sanar",
    "pulso-cierra-todo": "masa" })[id] ?? null;
}

/** Palma suma un tratamiento; nunca elimina directamente un nivel de HNT.
 * Las reglas de interrupción, Santuario y tres días siguen perteneciendo a supervivencia.
 */
export async function tratarHeridaConPulso(actor, { leerCura, nivel, aplicar, sanador, santuario }) {
  if (leerCura(actor)?.exito) return false;
  const cd = 10 + nivel(actor);
  await aplicar(actor, { sanador, total: cd, cd, santuario, magico: true });
  return true;
}
