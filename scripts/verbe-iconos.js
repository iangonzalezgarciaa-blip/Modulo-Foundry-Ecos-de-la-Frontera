/**
 * Iconos de técnicas, dotes y reliquias (tareas 4.7a–d). Solo iconos del sistema dnd5e (verificados en la instalación):
 * no hace falta atribución externa. Se aplican al armar la ficha; las técnicas que ya traen un icono propio lo conservan.
 */
const S = "systems/dnd5e/icons/svg/";
const POR_NAT = { fuego: "damage/fire", agua: "damage/cold", viento: "damage/thunder", tierra: "damage/bludgeoning", rayo: "damage/lightning",
  magma: "damage/fire", vapor: "damage/fire", ceniza: "damage/fire", escarcha: "damage/cold", tormenta: "damage/lightning", corriente: "damage/lightning",
  madera: "damage/piercing", raiz: "damage/piercing", arena: "damage/bludgeoning", hierro: "damage/piercing", destello: "damage/radiant" };
const POR_RAMA = { forma: "damage/force", cuerpo: "abilities/strength", velo: "schools/illusion", mirada: "schools/divination", rastro: "abilities/wisdom",
  sello: "schools/abjuration", pacto: "activity/summon", pulso: "damage/healing", hilo: "abilities/dexterity", quietud: "abilities/wisdom",
  umbral: "schools/conjuration", vasija: "activity/transform", sangre: "statuses/bloodied" };
const POR_DANO = { fire: "damage/fire", cold: "damage/cold", lightning: "damage/lightning", thunder: "damage/thunder", acid: "damage/acid", poison: "damage/poison",
  psychic: "damage/psychic", radiant: "damage/radiant", necrotic: "damage/necrotic", force: "damage/force", bludgeoning: "damage/bludgeoning", piercing: "damage/piercing", slashing: "damage/slashing" };
export const POR_CATEGORIA = { innatos: "items/feature", reserva: "spell-slot", control: "abilities/wisdom", naturaleza: "damage/force", tecnicas: "items/spell",
  combate: "items/weapon", defensa: "checked-shield", mente: "abilities/intelligence", ramas: "subclass", artes: "damage/healing", sendas: "scale-value", culminacion: "ability-score-improvement" };
/** Los iconos genéricos que se pueden cambiar por uno más claro. */
export const esGenerico = img => !img || /\/svg\/schools\/|\/svg\/items\/(feature|spell)\.svg$/.test(img);
export function iconoTecnica(t) {
  const sys = t?.system ?? t?.item?.system, meta = (t?.flags ?? t?.item?.flags)?.["ecos-frontera"]?.verbe ?? {};
  const acts = Object.values(sys?.activities ?? {});
  if (sys?.activation?.type === "reaction") return `${S}checked-shield.svg`;
  if (acts.some(a => a.type === "heal")) return `${S}damage/healing.svg`;
  const nat = meta.infusion || meta.nat;
  if (nat && POR_NAT[nat]) return `${S}${POR_NAT[nat]}.svg`;
  const tipo = acts.flatMap(a => a.damage?.parts ?? []).flatMap(p => Array.from(p.types ?? [])).find(x => POR_DANO[x]);
  if (tipo) return `${S}${POR_DANO[tipo]}.svg`;
  return POR_RAMA[meta.rama] ? `${S}${POR_RAMA[meta.rama]}.svg` : null;
}
export const iconoDote = d => `${S}${POR_CATEGORIA[d?.cat] ?? "items/feature"}.svg`;
