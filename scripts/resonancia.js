/**
 * Resonancia del Verbe (3.15, aprobada por el autor). Dote gratis al despertar el Verbe: +1 al ataque y +1 a la CD de
 * un conjuro normal (de D&D o de PF2e) que sea afín a quien lo lanza. No vale para técnicas del Verbe ni pergaminos, y
 * no se suma dos veces: como mucho +1.
 *
 * Afín por naturaleza: la del conjuro según el mapa de 4.1b (primer tipo de daño; si no hay, la escuela) es una de las
 * tuyas. Afín por rama: la rama de su escuela (o Pulso si cura) es una en la que tienes rango 1 o más.
 */
import { naturalezaConjuro } from "./verbe-clash.js";

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
/** ¿Es afín? `nats` y `ramas` son las del personaje (ramas con rango 1 o más). */
export function esAfin(item, { nats = new Set(), ramas = new Set() } = {}) {
  if (!esConjuroNormal(item)) return false;
  const n = naturalezaConjuro(item);
  if (n && nats.has(n)) return true;
  for (const r of ramasConjuro(item)) if (ramas.has(r)) return true;
  return false;
}
/** El objeto de la dote para la hoja. */
export function datosDote() {
  return { name: NOMBRE_DOTE, type: "feat", img: "icons/svg/aura.svg",
    system: { description: { value: `<p>Dote gratis al despertar el Verbe. Cuando lanzas un conjuro normal (de D&amp;D o de PF2e, no una técnica del Verbe ni un pergamino) que es <strong>afín</strong> a ti, su tirada de ataque recibe +1 y su CD sube 1. Como mucho +1, aunque sea afín por las dos vías.</p>
<p><strong>Afín por naturaleza:</strong> la naturaleza del conjuro es una de las tuyas. La da su primer tipo de daño (fuego → Fuego; frío → Agua; relámpago → Rayo; trueno, perforante o cortante → Viento; ácido o contundente → Tierra) o, si no hace daño de esos tipos, su escuela (Evocación → Fuego; Conjuración y Abjuración → Tierra; Transmutación → Agua).</p>
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
  Hooks.on("dnd5e.preRollAttackV2", config => {
    const act = config?.subject;
    if (!act?.item || !bonoResonancia(act.item)) return;
    for (const r of config.rolls ?? []) { r.parts ??= []; if (!r.parts.includes("@ecosResonancia")) { r.parts.push("@ecosResonancia"); r.data ??= {}; r.data.ecosResonancia = 1; } }
  });
  Hooks.on("updateActor", (actor, cambios) => {
    if (foundry.utils.hasProperty(cambios, `flags.${MOD}.verbe.despierto`) && cambios.flags[MOD].verbe.despierto) asegurarDote(actor).catch(err => console.error(`${MOD} | resonancia`, err));
  });
}
