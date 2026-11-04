/**
 * Nombres propios de cada mundo (3.12). El módulo público usa sus nombres (p. ej. «Lethria»); el DM puede cambiarlos
 * para su mesa sin tocar el repositorio: «Lethria=Gracefeel; Namar Sin Rostro=Cazador Sin Rostro».
 * Se aplica a lo que muestra el panel (linajes, Miradas, panteón, herencias y Memoria). Requiere recargar.
 */
const MOD = "ecos-frontera";

/** «A=B; C=D» (o una por línea) → [["A","B"], ["C","D"]], los más largos primero. */
export function leerNombres(texto) {
  return String(texto ?? "").split(/[;\n]/).map(x => x.split("=").map(s => s.trim())).filter(p => p.length === 2 && p[0] && p[1])
    .sort((a, b) => b[0].length - a[0].length);
}

/** Cambia los nombres en las partes visibles del catálogo. Devuelve cuántos textos tocó. */
export function aplicarNombresMundo(D, texto) {
  const pares = leerNombres(texto);
  if (!D || !pares.length) return 0;
  let n = 0;
  const cambiar = obj => {
    if (!obj || typeof obj !== "object") return;
    for (const [k, v] of Object.entries(obj)) {
      if (k === "id" || k === "linaje") continue;
      if (typeof v === "string") { let s = v; for (const [a, b] of pares) s = s.split(a).join(b); if (s !== v) { obj[k] = s; n++; } }
      else if (v && typeof v === "object") cambiar(v);
    }
  };
  for (const parte of [D.linajes, D.miradas, D.panteon, D.herencias, D.memoriaNimerios?.entradas]) cambiar(parte);
  return n;
}

export const nombresDelMundo = () => { try { return game.settings.get(MOD, "nombresMundo") ?? ""; } catch { return ""; } };

if (globalThis.Hooks) Hooks.once("init", () => {
  try {
    game.settings.register(MOD, "nombresMundo", { name: "Nombres propios de tu mundo", hint: "Cambia nombres del módulo por los de tu mesa, solo en este mundo. Formato: Lethria=Gracefeel; Namar Sin Rostro=Cazador Sin Rostro. Recarga después de cambiarlo.",
      scope: "world", config: true, type: String, default: "", requiresReload: true });
  } catch { /* ya */ }
});
