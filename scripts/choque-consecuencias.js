/**
 * 3.29 · Lo que deja un choque de técnicas (pedido del autor). Dos técnicas que se encuentran sueltan su fuerza:
 *  - Explosión: con grados que suman 3 o más, estalla en el punto del impacto (el defensor). Radio de 5 ft por cada 3
 *    grados sumados (hasta 30 ft); daño de la naturaleza que gana (o de fuerza), mitad con salvación de DES.
 *  - Terreno: el lugar queda marcado como «Terreno vivo» (brasas, charco, escombros, polvo, chispas) y cualquiera puede
 *    usarlo con «Aprovechar el terreno»: el choque crea oportunidades tácticas.
 *  - Contragolpe: quien pierde por mucho se lleva el rebote (daño de fuerza y Desequilibrado); por muchísimo, la mano
 *    revienta (Mano rota: sin Gestos hasta un Descanso Largo o curación mágica). Dos técnicas enormes empatadas se
 *    devuelven el golpe las dos.
 * Lo puro se prueba sin Foundry.
 */
import { sistema } from "./sistema/index.js";

const MOD = "ecos-frontera";
export const MANO_ROTA = "ecosManoRota";
export const IMPETU = "ecosImpetu";
/** 3.34: quien gana un choque sale con ímpetu; quien lo pierde, con la guardia abierta. */
export const ESTADO_IMPETU = { [IMPETU]: { name: "Ímpetu del choque", img: "systems/dnd5e/icons/svg/statuses/dodging.svg", dura: 6,
  changes: [{ key: "system.bonuses.mwak.attack", mode: 2, value: "+2" }, { key: "system.bonuses.rwak.attack", mode: 2, value: "+2" }, { key: "system.bonuses.msak.attack", mode: 2, value: "+2" }, { key: "system.bonuses.rsak.attack", mode: 2, value: "+2" }],
  texto: "Ganó el choque de técnicas: +2 a sus tiradas de ataque hasta el final de su próximo turno." } };
export const ESTADO_MANO_ROTA = { [MANO_ROTA]: { name: "Mano rota", img: "systems/dnd5e/icons/svg/statuses/bleeding.svg", dura: 0,
  texto: "El choque le reventó la mano: no puede hacer Gestos (técnicas con sellos) ni usar esa mano hasta un Descanso Largo o una curación mágica de 3.er nivel o más." } };
const TIPO_NAT = { fuego: "fire", agua: "cold", viento: "slashing", tierra: "bludgeoning", rayo: "lightning" };
/** El terreno que deja cada naturaleza: el nombre «Terreno vivo: …» lo reconoce «Aprovechar el terreno». */
export const TERRENO_CHOQUE = {
  fuego: { nombre: "Terreno vivo: brasas del choque", texto: "Brasas y llamas sueltas: arrojar a alguien dentro (Aprovechar el terreno) lo quema y lo deja Ardiendo." },
  agua: { nombre: "Terreno vivo: charco del choque", texto: "Un charco ancho: quien entra queda Empapado (y el rayo lo atraviesa)." },
  tierra: { nombre: "Terreno vivo: escombros del choque", texto: "Suelo levantado y piedras: terreno difícil; se pueden derrumbar sobre alguien." },
  viento: { nombre: "Terreno vivo: polvo del choque", texto: "Una nube de polvo y astillas: se puede levantar para cegar." },
  rayo: { nombre: "Terreno vivo: chispas del choque", texto: "El suelo y el metal quedan cargados: quien queda dentro recibe la descarga y queda Cargado." },
  nada: { nombre: "Terreno vivo: cráter del choque", texto: "Un cráter de escombros: terreno difícil; se puede derrumbar sobre alguien." }
};

/**
 * Lo que deja un choque. Puro.
 * @param {{ga:number, gb:number, gana:number, natA:string|null, natB:string|null, ciclo:number}} c
 *   `gana`: 1 gana A (atacante), −1 gana B (defensor), 0 empate. `ciclo`: 1 si el elemento de A vence al de B, −1 al revés.
 */
export function consecuenciasChoque({ ga, gb, gana, natA = null, natB = null, ciclo = 0 }) {
  const a = Math.max(0, Number(ga) || 0), b = Math.max(0, Number(gb) || 0), suma = a + b;
  const natGana = gana > 0 ? natA : gana < 0 ? natB : (natA || natB);
  const out = { explosion: null, terreno: null, contragolpe: null, ganador: null, perdedor: null };
  // 3.34: quien gana sale con Ímpetu (+2 a atacar); quien pierde, con Brecha (−2 a la CA). El empate no deja nada.
  if (gana) { out.ganador = { quien: gana > 0 ? "A" : "B", estado: IMPETU }; out.perdedor = { quien: gana > 0 ? "B" : "A", estado: "ecosBrecha" }; }
  if (suma >= 3) {
    out.explosion = { radioPies: Math.min(30, 5 * Math.ceil(suma / 3)), dados: `${Math.max(1, Math.floor(suma / 2))}d6`, tipo: TIPO_NAT[natGana] ?? "force", cd: 10 + Math.max(a, b) };
    out.terreno = { ...(TERRENO_CHOQUE[natGana] ?? TERRENO_CHOQUE.nada), radioPies: out.explosion.radioPies };
  }
  const potA = a + (ciclo > 0 ? 2 : 0), potB = b + (ciclo < 0 ? 2 : 0), margen = Math.abs(potA - potB);
  if (gana && margen >= 3) out.contragolpe = { quien: gana > 0 ? "B" : "A", dados: `${margen}d6`, mano: margen >= 5 };
  else if (!gana && suma >= 8) out.contragolpe = { quien: "ambos", dados: `${Math.floor(suma / 4)}d6`, mano: suma >= 12 };
  return out;
}
/** El texto para la mesa. Puro. */
export function textoConsecuencias(c, nombres = { A: "la atacante", B: "la defensora" }) {
  const L = [];
  if (c.explosion) L.push(`<b>Explosión</b> en el punto del choque: ${c.explosion.radioPies} ft de radio, ${c.explosion.dados} de ${c.explosion.tipo}; salvación de DES CD ${c.explosion.cd} para la mitad.`);
  if (c.terreno) L.push(`<b>El lugar queda marcado</b>: ${c.terreno.texto}`);
  if (c.ganador) L.push(`<b>${c.ganador.quien === "A" ? nombres.A : nombres.B}</b> gana el choque: <b>Ímpetu</b> (+2 a sus ataques hasta el final de su próximo turno). <b>${c.perdedor.quien === "A" ? nombres.A : nombres.B}</b> queda con la guardia abierta: <b>Brecha</b> (−2 a la CA).`);
  if (c.contragolpe) {
    const quien = c.contragolpe.quien === "ambos" ? "las dos manos" : `la mano de ${c.contragolpe.quien === "A" ? nombres.A : nombres.B}`;
    L.push(`<b>Contragolpe</b>: la fuerza rebota en ${quien}: ${c.contragolpe.dados} de fuerza y Desequilibrado.${c.contragolpe.mano ? " <b>La mano revienta</b>: Mano rota." : ""}`);
  }
  return L;
}

/* ---------------- Foundry ---------------- */
const leer = (k, def) => { try { return game.settings.get(MOD, k); } catch { return def; } };
const tokenDe = actor => actor?.getActiveTokens?.()[0] ?? null;
const salv = (actor, ab) => Number(actor?.system?.abilities?.[ab]?.save?.value ?? actor?.system?.abilities?.[ab]?.save ?? 0) || 0;

/** Aplica lo que deja el choque. Solo el DM (si no, se lo pide). */
export async function consecuenciasDelChoque(A, B, gana, ciclo = 0) {
  if (!leer("choqueConsecuencias", true)) return;
  const c = consecuenciasChoque({ ga: A?.g, gb: B?.g, gana, natA: A?.nat, natB: B?.nat, ciclo });
  if (!c.explosion && !c.contragolpe && !c.ganador) return;
  if (!game.user.isGM) {
    game.socket.emit(`module.${MOD}`, { choqueCons: true, A: { uuid: A?.actor?.uuid, nombre: A?.nombre }, B: { uuid: B?.actor?.uuid, nombre: B?.nombre }, c });
    return;
  }
  return aplicar(A?.actor, B?.actor, c, { A: A?.nombre, B: B?.nombre });
}

async function aplicar(actorA, actorB, c, nombres) {
  const filas = textoConsecuencias(c, nombres);
  const centro = tokenDe(actorB) ?? tokenDe(actorA);
  if (c.explosion && centro && canvas?.scene) {
    const px = canvas.grid.size / (canvas.scene.grid.distance || 5) * c.explosion.radioPies * (canvas.scene.grid.units === "m" ? 0.3 : 1);
    const dentro = canvas.tokens.placeables.filter(t => t.actor && Math.hypot(t.center.x - centro.center.x, t.center.y - centro.center.y) <= px + 1);
    const tirada = await new Roll(c.explosion.dados).evaluate();
    const res = [];
    for (const t of dentro) {
      const r = await new Roll("1d20 + @s", { s: salv(t.actor, "dex") }).evaluate();
      const ok = r.total >= c.explosion.cd, dano = ok ? Math.floor(tirada.total / 2) : tirada.total;
      await sistema.danar(t.actor, dano, c.explosion.tipo);
      res.push(`${foundry.utils.escapeHTML?.(t.name) ?? t.name}: DES ${r.total} — ${ok ? "mitad" : "entero"} (${dano})`);
    }
    filas.push(`Daño de la explosión ${tirada.total}. ${res.join(" · ") || "No había nadie más cerca."}`);
    try {
      await canvas.scene.createEmbeddedDocuments("Region", [{ name: c.terreno.nombre, color: "#b5651d",
        shapes: [{ type: "circle", x: centro.center.x, y: centro.center.y, radius: px }], flags: { [MOD]: { choque: true } } }]);
    } catch (err) { filas.push("(No pude dibujar la región: márcala a mano con ese nombre para usarla.)"); console.warn(`${MOD} | región del choque`, err); }
  }
  if (c.contragolpe) {
    const quienes = c.contragolpe.quien === "ambos" ? [actorA, actorB] : [c.contragolpe.quien === "A" ? actorA : actorB];
    for (const a of quienes.filter(Boolean)) {
      const r = await new Roll(c.contragolpe.dados).evaluate();
      await sistema.danar(a, r.total, "force");
      await a.toggleStatusEffect?.("desequilibrado", { active: true });
      if (c.contragolpe.mano) await a.toggleStatusEffect?.(MANO_ROTA, { active: true });
      filas.push(`${foundry.utils.escapeHTML?.(a.name) ?? a.name} recibe ${r.total} de fuerza por el contragolpe.`);
    }
  }
  if (c.ganador) {
    const de = q => (q === "A" ? actorA : actorB);
    await de(c.ganador.quien)?.toggleStatusEffect?.(c.ganador.estado, { active: true }).catch(() => null);
    await de(c.perdedor.quien)?.toggleStatusEffect?.(c.perdedor.estado, { active: true }).catch(() => null);
  }
  await ChatMessage.create({ speaker: { alias: "Choque de técnicas" }, flags: { [MOD]: { choqueConsecuencias: true } },
    content: `<section class="ecos-choque-consecuencias"><h3>Lo que deja el choque</h3>${filas.map(f => `<p>${f}</p>`).join("")}</section>` });
}

if (globalThis.Hooks) {
  Hooks.once("init", () => {
    try {
      game.settings.register(MOD, "choqueConsecuencias", { name: "Lo que deja un choque de técnicas", hint: "Explosión en el punto del choque, el terreno marcado para «Aprovechar el terreno» y el contragolpe a quien pierde por mucho (la mano puede reventar).",
        scope: "world", config: true, type: Boolean, default: true });
    } catch { /* ya */ }
  });
  Hooks.once("ready", () => {
    game.socket.on(`module.${MOD}`, async d => {
      if (!d?.choqueCons || !game.user.isGM || game.users.activeGM?.isSelf === false) return;
      const a = d.A?.uuid ? await fromUuid(d.A.uuid) : null, b = d.B?.uuid ? await fromUuid(d.B.uuid) : null;
      aplicar(a, b, d.c, { A: d.A?.nombre, B: d.B?.nombre }).catch(err => console.error(`${MOD} | choque`, err));
    });
  });
}
