/** Formulario del catálogo del DM: independiente de nivel, cartera y ramas de un personaje. */
export const FORMULARIO_UNIVERSAL = {
  nombre: "", rama: "forma", nat: "", grado: 1, tiempo: "A", alcance: "18", areaTipo: "ninguna", areaTam: 3,
  duracion: "inst.", conc: false, voz: false, gestos: true, tirada: "ataque", mitad: false, tipoActividad: "normal",
  dadosN: 2, dadosD: 6, bono: 0, escaladoDados: 1, tipoDano: "fuerza", estados: 0, estadosElegidos: [],
  efecto: "", disparador: "", usa: "verbe", trazos: 2, costoBase: "", nivelMin: 1, previa: "", req: "",
  blancos: 1, duracionValor: "", duracionUnidad: "minute", material: "", materialCosto: 0, materialConsumido: false,
  persistente: false, excepcionDM: false, motivoExcepcion: ""
};
const enteroEntre = (n, a, b) => Number.isInteger(Number(n)) && Number(n) >= a && Number(n) <= b;
export function validarUniversal(f, { ramas, naturalezas, estados, propuesta, validarBalance }) {
  const errores = [];
  if (typeof f.nombre !== "string" || !f.nombre.trim() || f.nombre.length > 100) errores.push("Nombre: de 1 a 100 caracteres.");
  if (typeof f.efecto !== "string" || !f.efecto.trim() || f.efecto.length > 4000) errores.push("Describe qué hace, hasta 4000 caracteres.");
  if (!ramas.includes(f.rama) || (f.nat && !naturalezas.includes(f.nat))) errores.push("Rama o naturaleza no válida.");
  if (!enteroEntre(f.grado,0,11) || !enteroEntre(f.dadosN,0,100) || ![4,6,8,10,12].includes(Number(f.dadosD))) errores.push("Grado o dados no válidos.");
  if (!["A","AA","R","1 min","10 min"].includes(f.tiempo) || !["inst.","1 asalto","1 min","10 min","1 h"].includes(f.duracion)) errores.push("Tiempo o duración no válidos.");
  if (!["yo","toque"].includes(f.alcance) && (!Number.isFinite(Number(f.alcance)) || Number(f.alcance) <= 0 || Number(f.alcance)>1500)) errores.push("Alcance: hasta 1500 m.");
  if (!["ninguna","cono","esfera","cubo","línea","cilindro"].includes(f.areaTipo) || (f.areaTipo!=="ninguna" && (!Number.isFinite(Number(f.areaTam)) || Number(f.areaTam)<=0 || Number(f.areaTam)>180))) errores.push("Área no válida.");
  if (!["ninguna","ataque","FUE","DES","CON","INT","SAB","CAR"].includes(f.tirada) || !["normal","healing"].includes(f.tipoActividad)) errores.push("Tipo de actividad o tirada no válido.");
  if (!["verbe","fisica","str","dex","con","int","wis","cha"].includes(f.usa)) errores.push("Característica no válida.");
  if (!enteroEntre(f.bono,-20,100) || !enteroEntre(f.escaladoDados,0,10) || !enteroEntre(f.trazos,0,100)
    || !enteroEntre(f.blancos,1,100) || !enteroEntre(f.nivelMin,1,20)) errores.push("Bonificación, escalado, Trazos, blancos o nivel no válidos.");
  if (f.costoBase !== "" && !enteroEntre(f.costoBase,Number(f.grado)>0?1:0,100)) errores.push("Coste de Verbe: entero de 1 a 100 (0 solo en grado 0); vacío usa la tabla.");
  if (f.duracionValor !== "" && (!enteroEntre(f.duracionValor,1,1440) || !["round","minute","hour"].includes(f.duracionUnidad))) errores.push("Duración personalizada no válida.");
  if (!Array.isArray(f.estadosElegidos) || f.estadosElegidos.length>3 || f.estadosElegidos.some(s=>!estados.includes(s))) errores.push("Elige hasta tres estados registrados.");
  if (!enteroEntre(f.estados,0,3)) errores.push("Número de estados no válido.");
  for (const k of ["disparador","material","previa","req","motivoExcepcion"]) if (typeof f[k]!=="string" || f[k].length>500) errores.push(`${k}: hasta 500 caracteres.`);
  if (!Number.isFinite(Number(f.materialCosto)) || Number(f.materialCosto)<0 || Number(f.materialCosto)>100000) errores.push("Coste de material no válido.");
  if (f.tiempo === "R" && !String(f.disparador).trim()) errores.push("Una reacción necesita un disparador concreto.");
  if (f.tipoActividad === "healing" && f.tirada !== "ninguna") errores.push("La actividad de curación usa tirada Ninguna.");
  const balance = validarBalance(f,{propuesta,maxGrado:11});
  const excede = [...balance.errores];
  const media = Number(f.dadosN) * (Number(f.dadosD)+1)/2 + Number(f.bono);
  const blancos = f.areaTipo === "ninguna" ? Number(f.blancos) : 1;
  if (Number(f.dadosN)>0 && media * blancos > propuesta.n*(propuesta.d+1)/2 + 0.5) excede.push("Daño/curación con bono y blancos supera el presupuesto de referencia.");
  if (Number(f.escaladoDados)>1) excede.push("El escalado de más de un dado por grado exige revisión del DM.");
  if (f.estadosElegidos?.length && Number(f.dadosN)===0) excede.push("El control sin daño necesita una excepción que indique duración, salvaciones y límites.");
  if (excede.length && (!f.excepcionDM || !String(f.motivoExcepcion ?? "").trim())) errores.push("El presupuesto requiere una excepción del DM con motivo.");
  return { ok: !errores.length, errores: [...new Set(errores)], excede, propuesta };
}
