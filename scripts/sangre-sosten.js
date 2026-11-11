/**
 * Qué sangre sostiene a un PJ ante el daño masivo (3.26). Desde 3.12 la que sostiene es la del linaje de la Barrera
 * (con la sangre activa); desde 3.26 también el linaje del ojo de vidrio, a pedido del autor, pero ese no toca la
 * Barrera: no suma al Reloj ni dispara el Eco. Sin linaje del Verbe vale la marca vieja de portador.
 * Devuelve "barrera", "ala" o null. Puro.
 */
export const LINAJE_BARRERA = "maethra", LINAJE_ALA = "ikkra";
/** La marca `portadorSangre` ("barrera" o "ala") dice qué sangre tiene un portador que todavía no despertó el Verbe. */
export const MARCAS_SANGRE = { barrera: LINAJE_BARRERA, ala: LINAJE_ALA };
export function sostenDeSangre(verbe, marcaPortador = false, marcaSangre = null) {
  if (verbe?.linaje) {
    if (!verbe.fuerza || verbe.fuerza === "ninguna") return null;
    if (verbe.linaje === LINAJE_BARRERA) return "barrera";
    if (verbe.linaje === LINAJE_ALA) return "ala";
    return null;
  }
  if (marcaPortador !== true) return null;
  return MARCAS_SANGRE[marcaSangre] ? marcaSangre : "barrera";
}
/** El linaje que el diálogo de Despertar propone para un portador marcado. Puro. */
export const linajePortador = (marcaSangre, porDefecto) => MARCAS_SANGRE[marcaSangre] ?? porDefecto;
