/** Mejoras con efecto verificable en los datos de la técnica, no por su nombre. */
export const MEJORAS = {
  dado: "+1 dado de daño o curación", verbe: "1 Verbe menos por uso", cd: "+1 al ataque o a la CD",
  area: "Área o alcance ×1,5", rapida: "Reducir tiempo de activación", duracion: "+50 % de duración (máximo +1 minuto)",
  contacto: "Usar a 3 m en vez de contacto", silenciosa: "Sin componente verbal", gestos: "Sin componente gestual",
  "sust-distancia": "Sustitución: objeto 1,5 m más lejos", "sust-control": "Sustitución: −1 al recargo total"
};
const TOPES = { dado: 3, verbe: 2, cd: 2, area: 2, rapida: 1, duracion: 1, contacto: 1, silenciosa: 1, gestos: 1, "sust-distancia": 2, "sust-control": 1, infusion: 1 };
const RECARGO = { dado: 1, verbe: 1, cd: 1, rapida: 2, silenciosa: 2, gestos: 2, "sust-control": 1, infusion: 2 };
export function opcionesCultivo(tec, cultivo = {}, costoUso = Infinity, {dados=0,tope=Infinity,minimo=1,cdUsada=0}={}) {
  const sys = tec.item?.system ?? {}, actos = Object.values(sys.activities ?? {}), mejoras = cultivo.mejoras ?? [];
  const dado = actos.some(a => (a.damage?.parts ?? (a.healing ? [a.healing] : [])).some(p => p.number > 0 && !p.custom?.enabled));
  const dano = actos.some(a => !a.healing && a.damage?.parts?.some(p => p.number > 0));
  const compatible = {
    dado:dado&&dados<tope, verbe: tec.g > 0 && costoUso > minimo, cd: cdUsada<2&&actos.some(a => ["attack", "save"].includes(a.type)),
    area: Number(sys.target?.template?.size) > 0 || (sys.range?.units === "m" && Number(sys.range.value) > 0),
    rapida: !tec.item?.flags?.['ecos-frontera']?.verbe?.ritual && tec.t !== "R" && ((sys.activation?.type==='action'&&tec.g<=5)||(['minute','hour'].includes(sys.activation?.type)&&Number(sys.activation.value)>1)),
    duracion: ["round", "minute", "hour"].includes(sys.duration?.units) && Number(sys.duration?.value) > 0,
    contacto: sys.range?.units === "touch" && tec.t !== "R",
    silenciosa: (sys.properties ?? []).includes("vocal"), gestos: (sys.properties ?? []).includes("somatic"),
    "sust-distancia": tec.id === "forma-sustitucion", "sust-control": tec.id === "forma-sustitucion",
    infusion: dano && ["pura", "cuerpo", "hilo", "quietud", "velo"].includes(tec.sec)
  };
  return [...Object.keys(MEJORAS), "infusion"].map(id => {
    const cuenta = mejoras.filter(m => m === id).length, tope = TOPES[id];
    const motivo = !compatible[id] ? "Su forma o efecto no utiliza esta mejora." : cuenta >= tope ? `Límite de ${tope} mejora${tope > 1 ? "s" : ""} alcanzado.` : "";
    return { id, nombre: MEJORAS[id] ?? "Infusión fija", ok: !motivo, motivo, tope,
      costo: cultivo.pendiente > 0 ? 0 : (Number(cultivo.nivel) || 0) + 1 + (RECARGO[id] || 0) };
  });
}
export function aplicarCultivoUtilidad(data, mejoras) {
  if (mejoras.includes("contacto")) Object.assign(data.system.range, { units: "m", value: 3 });
  const quitar = new Set([...(mejoras.includes("silenciosa") ? ["vocal"] : []), ...(mejoras.includes("gestos") ? ["somatic"] : [])]);
  data.system.properties = (data.system.properties ?? []).filter(p => !quitar.has(p));
  if (mejoras.includes("duracion")) {
    const d = data.system.duration, unidad = ({ round: 6, minute: 60, hour: 3600 })[d?.units];
    if (unidad && d.value > 0) { d.value = (Number(d.value) * unidad + Math.min(60, Math.ceil(Number(d.value) * unidad / 2))) / 60; d.units = "minute"; }
  }
  return data;
}
