/**
 * Resonancia del Verbe (3.15, aprobada por el autor; curación en 3.16). Dote gratis al despertar el Verbe. Un conjuro
 * normal (de D&D o de PF2e) afín a quien lo lanza se potencia: +1 al ataque y +1 a la CD; si cura, +1 PG por dado.
 * No vale para técnicas del Verbe ni pergaminos, y no se suma dos veces. El daño queda como en el Manual.
 *
 * Afín por naturaleza: la del conjuro es una de tus naturalezas descubiertas. La da su primer tipo de daño (mapa de
 * 4.1b); si cura, Agua; si no, su rasgo de elemento de PF2e; si no, su escuela. Afín por rama: tienes rango 1 o más en
 * la rama de su escuela, o en Pulso si cura.
 */
import { DANO_A_NATURALEZA, ESCUELA_A_NATURALEZA } from "./verbe-clash.js";
import { sistema } from "./sistema/index.js";

const MOD = "ecos-frontera";
export const RAMA_DE_ESCUELA = { evo: "forma", ill: "velo", enc: "velo", abj: "sello", div: "rastro", con: "umbral", nec: "pulso", trs: "cuerpo" };
export const NOMBRE_DOTE = "Resonancia del Verbe";
const lista = x => x?.values instanceof Function ? Array.from(x.values()) : x?.contents ? Array.from(x.contents) : Array.isArray(x) ? x : x && typeof x === "object" ? Object.values(x) : [];

/** ¿El conjuro cura? (una actividad de curación). */
export function curaConjuro(item) {
  return lista(item?.system?.activities).some(a => a?.type === "heal");
}
/** ¿Es un conjuro normal? Un objeto de tipo conjuro que no es técnica del Verbe. */
export const esConjuroNormal = item => item?.type === "spell" && !item?.flags?.[MOD]?.verbe?.id;
/** Las ramas que le tocan a un conjuro: la de su escuela y, si cura, Pulso. */
export function ramasConjuro(item) {
  const r = new Set();
  const e = RAMA_DE_ESCUELA[item?.system?.school];
  if (e) r.add(e);
  if (curaConjuro(item)) r.add("pulso");
  return r;
}
/** Rasgos de elemento de PF2e (los trae el conversor) a naturalezas del Verbe. */
export const RASGO_A_NATURALEZA = { fire: "fuego", water: "agua", cold: "agua", air: "viento", sonic: "viento", earth: "tierra", metal: "tierra", wood: "tierra", electricity: "rayo" };
/** La naturaleza de un conjuro para la Resonancia: daño, curación (Agua), rasgo de elemento de PF2e o escuela. */
export function naturalezaResonancia(item) {
  for (const a of lista(item?.system?.activities)) for (const p of a?.damage?.parts ?? []) for (const t of Array.from(p?.types ?? [])) if (DANO_A_NATURALEZA[t]) return DANO_A_NATURALEZA[t];
  if (curaConjuro(item)) return "agua";
  for (const r of item?.flags?.[MOD]?.pf2e?.rasgos ?? []) if (RASGO_A_NATURALEZA[r]) return RASGO_A_NATURALEZA[r];
  return ESCUELA_A_NATURALEZA[item?.system?.school] ?? null;
}
/** Cuántos dados hay en las partes de una tirada («2d8», «@mod», «1d4 + 2» → 3). */
export function dadosEn(partes) {
  let n = 0;
  for (const p of partes ?? []) for (const m of String(p).matchAll(/(\d*)d\d+/g)) n += Number(m[1] || 1);
  return n;
}
/** ¿Es afín? `nats` (naturalezas descubiertas) y `ramas` (con rango 1 o más) son las del personaje. */
export function esAfin(item, { nats = new Set(), ramas = new Set() } = {}) {
  if (!esConjuroNormal(item)) return false;
  const n = naturalezaResonancia(item);
  if (n && nats.has(n)) return true;
  for (const r of ramasConjuro(item)) if (ramas.has(r)) return true;
  return false;
}
/** El objeto de la dote para la hoja. */
export function datosDote() {
  return { name: NOMBRE_DOTE, type: "feat", img: "icons/svg/aura.svg",
    system: { description: { value: `<p>Dote gratis al despertar el Verbe. Cuando lanzas un conjuro normal (de D&amp;D o de PF2e, no una técnica del Verbe ni un pergamino) que es <strong>afín</strong> a ti, se potencia: su tirada de ataque recibe +1 y su CD sube 1, y si cura, cura 1 PG más por cada dado. El daño queda como en el Manual. No se suma dos veces, aunque sea afín por las dos vías.</p>
<p><strong>Afín por naturaleza:</strong> la naturaleza del conjuro es una de tus naturalezas descubiertas. La da su primer tipo de daño (fuego → Fuego; frío → Agua; relámpago → Rayo; trueno, perforante o cortante → Viento; ácido o contundente → Tierra). Si cura, es Agua. Si no hace daño de esos tipos, su elemento de PF2e (fuego, agua, frío, aire, tierra, metal, madera, electricidad) o su escuela (Evocación → Fuego; Conjuración y Abjuración → Tierra; Transmutación → Agua).</p>
<p><strong>Afín por rama:</strong> tienes rango 1 o más en la rama de su escuela: Evocación → Forma; Ilusión y Encantamiento → Velo; Abjuración → Sello; Adivinación → Rastro; Conjuración → Umbral; Nigromancia y los conjuros que curan → Pulso; Transmutación → Cuerpo.</p>`, chat: "" },
      type: { value: "feat", subtype: "" }, identifier: "ecos-resonancia-verbe", source: { custom: "Ecos · Verbe" } },
    flags: { [MOD]: { resonancia: true } } };
}

/* ---------- Foundry ---------- */
let V = null; // verbe.js, cargado en init (las pruebas no lo cargan).
const tieneDote = actor => lista(actor?.items).some(i => i?.flags?.[MOD]?.resonancia);
function perfil(actor) {
  if (!V || !tieneDote(actor)) return null;
  const e = V.estado(actor);
  if (!e?.despierto) return null;
  const ramas = new Set(Object.entries(e.rangos ?? {}).filter(([, n]) => Number(n) >= 1).map(([r]) => r));
  let nats = new Set();
  try { nats = V.natsDe(actor); } catch { /* el catálogo aún no cargó */ }
  return { nats, ramas };
}
/** +1 si el conjuro es afín para quien lo tiene. */
export function bonoResonancia(item) {
  try { const p = perfil(item?.actor); return p && esAfin(item, p) ? 1 : 0; } catch { return 0; }
}
async function asegurarDote(actor) {
  if (!game.user?.isGM || (game.users?.activeGM && !game.users.activeGM.isSelf)) return;
  if (!V?.estado(actor)?.despierto || tieneDote(actor)) return;
  await actor.createEmbeddedDocuments("Item", [datosDote()]);
}

if (globalThis.Hooks) {
  Hooks.once("init", () => {
    import("./verbe.js").then(m => { V = m; }).catch(err => console.error(`${MOD} | resonancia`, err));
  });
  Hooks.once("ready", async () => {
    // La CD se calcula al preparar la actividad: se le suma el +1 ahí, y se ve en la hoja y en la tarjeta.
    const C = CONFIG.DND5E?.activityTypes?.save?.documentClass;
    if (C && !C.prototype.ecosResonancia) {
      const orig = C.prototype.prepareFinalData;
      C.prototype.prepareFinalData = function (...args) {
        const r = orig.apply(this, args);
        try {
          if (this.isSpell && this.save?.dc && Number.isFinite(this.save.dc.value) && bonoResonancia(this.item)) {
            this.save.dc.value += 1;
            this.labels.save = game.i18n.format("DND5E.SaveDC", { dc: this.save.dc.value, ability: CONFIG.DND5E.abilities[this.ability]?.label ?? "" });
          }
        } catch { /* sin bono */ }
        return r;
      };
      C.prototype.ecosResonancia = true;
    }
    for (const a of game.actors ?? []) {
      if (!V?.estado(a)?.despierto) continue;
      await asegurarDote(a).catch(err => console.error(`${MOD} | resonancia`, err));
      a.reset?.();
    }
  });
  sistema.gancho("antesDeAtacar", config => {
    const act = config?.subject;
    if (!act?.item || !bonoResonancia(act.item)) return;
    for (const r of config.rolls ?? []) { r.parts ??= []; if (!r.parts.includes("@ecosResonancia")) { r.parts.push("@ecosResonancia"); r.data ??= {}; r.data.ecosResonancia = 1; } }
  });
  // Curación afín: +1 PG por dado (también a niveles superiores, porque cuenta los dados de la tirada).
  sistema.gancho("antesDelDano", config => {
    const act = config?.subject;
    if (act?.type !== "heal" || !act.item || !bonoResonancia(act.item)) return;
    for (const r of config.rolls ?? []) {
      const n = dadosEn(r.parts);
      if (!n || (r.parts ?? []).includes("@ecosResonanciaCura")) continue;
      r.parts.push("@ecosResonanciaCura"); r.data ??= {}; r.data.ecosResonanciaCura = n;
    }
  });
  Hooks.on("updateActor", (actor, cambios) => {
    if (foundry.utils.hasProperty(cambios, `flags.${MOD}.verbe.despierto`) && cambios.flags[MOD].verbe.despierto) asegurarDote(actor).catch(err => console.error(`${MOD} | resonancia`, err));
  });
}
