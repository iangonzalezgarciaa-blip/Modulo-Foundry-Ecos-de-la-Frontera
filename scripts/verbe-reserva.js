/**
 * Reserva de Verbe por dados (tarea 2.2, decisión D3 del autor). Reglas puras, sin Foundry.
 *
 * El máximo de Verbe crece con dados desde que se despierta, como los PG, sin mínimo garantizado.
 * Los dados por tramo de nivel tienen un promedio cercano a la tabla fija (167 al nivel 20):
 *   niveles 1–4: 1d10 (5,5) · 5–10: 1d10+4 (9,5) · 11–16: 1d12 (6,5) · 17–20: 2d10+1 (12).
 * Modos por personaje (decide el DM):
 *   «promedio»: la tabla fija de siempre (las fichas de antes de 3.6 quedan así: conservan su reserva).
 *   «dados»: cada nivel tira su dado. Si una ficha pasa de «promedio» a «dados», los niveles que ya tenía
 *   quedan fijos con el valor de la tabla y solo tira los siguientes.
 * La característica del Verbe se suma una vez, como siempre. Las reglas de Sangre que calculan
 * porcentajes sobre la tabla de nivel siguen usando la tabla.
 */
export const DADOS_VERBE = [
  { desde: 1, hasta: 4, formula: "1d10", n: 1, d: 10, bono: 0 },
  { desde: 5, hasta: 10, formula: "1d10 + 4", n: 1, d: 10, bono: 4 },
  { desde: 11, hasta: 16, formula: "1d12", n: 1, d: 12, bono: 0 },
  { desde: 17, hasta: 20, formula: "2d10 + 1", n: 2, d: 10, bono: 1 }
];
export const dadoNivel = nivel => DADOS_VERBE.find(t => nivel >= t.desde && nivel <= t.hasta) ?? DADOS_VERBE.at(-1);
export const promedioNivel = nivel => { const t = dadoNivel(nivel); return t.n * (t.d + 1) / 2 + t.bono; };
export const modoReserva = e => (e?.dadosVerbe?.modo === "dados" ? "dados" : "promedio");

/** Reserva base (sin característica, dotes ni sangre) al nivel `n`. `tabla` es D.verbeMax. */
export function reservaBase(e, n, tabla) {
  const fija = k => Number(tabla?.[k] ?? tabla?.[String(k)]) || 0;
  if (modoReserva(e) !== "dados") return fija(n);
  const dv = e.dadosVerbe, desde = Math.min(n, Math.max(0, Number(dv.fijoHasta) || 0));
  let total = desde ? fija(desde) : 0;
  for (let k = desde + 1; k <= n; k++) total += Number(dv.tiradas?.[k]) || 0;
  return total;
}
/** Niveles que todavía no tiraron (de fijoHasta+1 a n). */
export function nivelesSinTirar(e, n) {
  if (modoReserva(e) !== "dados") return [];
  const dv = e.dadosVerbe, out = [];
  for (let k = (Number(dv.fijoHasta) || 0) + 1; k <= n; k++) if (!Number.isFinite(Number(dv.tiradas?.[k])) || dv.tiradas?.[k] === undefined) out.push(k);
  return out;
}
/** Una tirada con un generador dado (para pruebas y simulación): suma de dados + bono. */
export function tirarNivel(nivel, azar = Math.random) {
  const t = dadoNivel(nivel);
  let s = t.bono;
  for (let i = 0; i < t.n; i++) s += 1 + Math.floor(azar() * t.d);
  return s;
}
/** Simulación para el balance: media, p10 y p90 de la reserva base a cada nivel. */
export function simularReserva(veces = 4000, azar = Math.random) {
  const res = [];
  const totales = Array.from({ length: 21 }, () => []);
  for (let v = 0; v < veces; v++) { let s = 0; for (let n = 1; n <= 20; n++) { s += tirarNivel(n, azar); totales[n].push(s); } }
  for (let n = 1; n <= 20; n++) {
    const xs = totales[n].sort((a, b) => a - b), media = xs.reduce((a, b) => a + b, 0) / xs.length;
    res.push({ nivel: n, media, p10: xs[Math.floor(xs.length * 0.1)], p90: xs[Math.floor(xs.length * 0.9)], esperado: [...Array(n)].reduce((a, _, i) => a + promedioNivel(i + 1), 0) });
  }
  return res;
}
