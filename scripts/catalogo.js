/**
 * Ecos de la frontera · Catálogo del Mercadillo de Arcegris.
 *
 * Precios en cobres (c). 10 c = 1 plata · 100 c = 1 oro.
 * Regla de precios del valle: el manual (PHB 2024) dividido entre 10, y además
 *   - metal ×1,2 (el hierro llega por la Ruta Occidental),
 *   - madera y cuero del valle ×0,8,
 *   - lujos importados ×1,5 (llegan con la caravana de Oswin).
 * Comida, bebida y servicios: los del Libro II · 6.
 *
 * Campos de cada artículo:
 *   id    identificador único (no cambiar: el módulo lo usa para reponer)
 *   n     nombre
 *   src   id del objeto en el compendio dnd5e.equipment24 (si no hay, se crea a medida)
 *   t     tipo de objeto a medida (loot, consumable, equipment, tool, weapon)
 *   ct    subtipo de consumible (food, potion, trinket…)
 *   p     precio en cobres
 *   s     existencias que repone · r cada cuántos días (0 = no se repone solo)
 *   cat   sección de la tienda
 *   serv  servicio: se paga y no entra al inventario
 *   ic    ícono preferido · kw palabras para buscar un ícono si ese no existe
 *   d     descripción
 *   herr  herramienta de calidad: { oficios: [...], bono } suma a la prueba de esos oficios
 *   enc   por encargo: días que tarda (se paga al pedirlo y llega solo)
 *   srv   efecto del servicio: "afilar" (arregla herramienta mellada), "reparar" (arregla rota),
 *         "noche" (alojamiento: con bono, +bono a la prueba de trabajo del día siguiente)
 *   temp  estación en la que hay (primavera, verano, otono, invierno)
 *   peso  peso en libras (objetos a medida)
 */

export const MONEDA = { c: 1, p: 10, o: 100 };

/* No hay costo de vida automático: cada PJ compra su cama y su comida en las tiendas.
   Las noches de El Último Roble (srv: "noche") dejan una marca para el día siguiente: bono al trabajo. */
const NOCHE = "<p>Se paga por adelantado. Esta noche duermes aquí; el efecto vale para el día siguiente (después de tu Descanso Largo).</p>";

export const TIENDAS = [
  /* ---------------------------------------------------------------- */
  {
    id: "martillo", nombre: "Herrería Martillo Gris", patron: "martillo",
    dueno: "Marta Drekken", npc: ["Marta"],
    lugar: "Dentro del viejo fuerte, junto a la plaza",
    horario: [[7, 19]],
    compra: ["weapon", "equipment", "tool"],
    img: "icons/tools/smithing/anvil.webp", kw: ["anvil", "hammer"],
    descripcion: "<p>La forja grande de la familia. Aquí manda <b>Marta Drekken</b>: armaduras, armas pesadas, las piezas de la guardia y todo lo que se hace por encargo. Lo de todos los días (cuchillos, hachas, clavos) se lo dejó a sus hijos, que tienen cada uno su yunque y se pelean los clientes en el mismo patio.</p><p><i>El hierro llega por la Ruta Occidental: todo lo de metal cuesta un poco más que en las ciudades. Las piezas grandes se hacen por encargo.</i></p>",
    saludos: ["Marta se limpia las manos en el delantal: «¿Qué se te rompió esta vez?»", "Marta mira tus manos antes que tu cara: «Eso no lo arregla un yunque de patio. Pasa.»", "«Si es un cuchillo, ve con mis hijos. Si es algo que te tiene que salvar la vida, quédate.»"],
    items: [
      { id: "mg-martguerra", n: "Martillo de guerra", src: "phbwepWarhammer0", p: 180, s: 1, r: 14, cat: "Armas pesadas" },
      { id: "mg-lucero", n: "Lucero del alba", src: "phbwepMorningsta", p: 180, s: 1, r: 14, cat: "Armas pesadas" },
      { id: "mg-granhacha", n: "Gran hacha", src: "phbwepGreataxe00", p: 360, s: 1, r: 21, cat: "Armas pesadas" },
      { id: "mg-alabarda", n: "Alabarda", src: "phbwepHalberd000", p: 240, s: 1, r: 21, cat: "Armas pesadas" },
      { id: "mg-pica", n: "Pica", src: "phbwepPike000000", p: 60, s: 1, r: 21, cat: "Armas pesadas" },
      { id: "mg-enc-mandoble", n: "Encargar: Mandoble", src: "phbwepGreatsword", p: 600, enc: 10, serv: true, cat: "Por encargo", d: "<p>Marta tarda unos 10 días en forjar una buena hoja larga. Se paga al encargarla y te la entregan en mano.</p>" },
      { id: "mg-escudo", n: "Escudo reforzado", src: "phbarmShield0000", p: 120, s: 2, r: 14, cat: "Armaduras" },
      { id: "mg-camisote", n: "Camisote de mallas", src: "phbarmChainShirt", p: 600, s: 1, r: 21, cat: "Armaduras" },
      { id: "mg-anillas", n: "Cota de anillas", src: "phbarmRingMail00", p: 360, s: 1, r: 21, cat: "Armaduras" },
      { id: "mg-mallas", n: "Cota de mallas", src: "phbarmChainMail0", p: 900, s: 1, r: 30, cat: "Armaduras", d: "<p>Una de repuesto de la guardia. Si se vende, la próxima tarda un mes.</p>" },
      { id: "mg-enc-escamas", n: "Encargar: Cota de escamas", src: "phbarmScaleMail0", p: 600, enc: 10, serv: true, cat: "Por encargo" },
      { id: "mg-enc-bandas", n: "Encargar: Armadura de bandas", src: "phbarmSplintArmo", p: 2400, enc: 21, serv: true, cat: "Por encargo" },
      { id: "mg-enc-coraza", n: "Encargar: Coraza", src: "phbarmBreastplat", p: 4800, enc: 30, serv: true, cat: "Por encargo" },
      { id: "mg-enc-media", n: "Encargar: Media armadura", src: "phbarmHalfPlateA", p: 9000, enc: 45, serv: true, cat: "Por encargo" },
      { id: "mg-enc-placas", n: "Encargar: Armadura de placas", src: "phbarmPlateArmor", p: 18000, enc: 60, serv: true, cat: "Por encargo", d: "<p>Marta nunca ha hecho una. Tendría que pedir acero imperial y trabajar dos meses solo en eso.</p>" },
      { id: "mg-cadena", n: "Cadena (10 ft)", src: "phbagChain000000", p: 60, s: 2, r: 14, cat: "Ferretería pesada" },
      { id: "mg-grilletes", n: "Grilletes", src: "phbagManacles000", p: 24, s: 2, r: 14, cat: "Ferretería pesada" },
      { id: "mg-cerradura", n: "Cerradura", src: "phbagLock0000000", p: 120, s: 1, r: 21, cat: "Ferretería pesada" },
      { id: "mg-herraduras", n: "Herraduras (juego de 4)", t: "loot", p: 8, s: 10, r: 7, cat: "Ferretería pesada", ic: "icons/commodities/metal/clasp-steel-braid.webp", kw: ["horseshoe"], peso: 4 },
      { id: "mg-armadura", n: "Arreglar una armadura", t: "loot", p: 20, serv: true, cat: "Servicios", ic: "icons/equipment/chest/breastplate-banded-steel.webp", kw: ["breastplate"], d: "<p>Anillas nuevas, correas cosidas, abolladuras fuera. Medio día de trabajo.</p>" },
      { id: "mg-herrar", n: "Herrar un caballo", t: "loot", p: 10, serv: true, cat: "Servicios", ic: "icons/commodities/metal/clasp-steel-braid.webp", kw: ["horseshoe"] }
    ]
  },
  /* ---------------------------------------------------------------- */
  {
    id: "kunno", nombre: "El yunque de Kunno", patron: "martillo",
    dueno: "Kunno Drekken", npc: ["Kunno"],
    lugar: "Patio de la herrería Martillo Gris, el yunque de la entrada",
    horario: [[6, 20]],
    compra: ["weapon", "tool"],
    img: "icons/tools/smithing/hammer-sledge-steel-grey.webp", kw: ["hammer", "anvil"],
    descripcion: "<p><b>Kunno Drekken</b> abre antes que nadie y cierra después que todos. Lo suyo es lo de todos los días: cuchillos, hachas, herramientas y clavos, hecho rápido, sólido y <b>más barato que en la forja de su hermana</b>. No es fino, pero aguanta. Tiene más de todo y no hace esperar.</p><p><i>Kunno y Sera se pelean los clientes del mismo patio. Él gana en precio; ella, en calidad.</i></p>",
    saludos: ["Kunno deja el martillo: «¿Sera te pidió cuánto por eso? Yo te lo dejo en menos.»", "«Rápido y bien. Lo fino es para los que tienen tiempo.»", "Kunno sonríe demasiado: «Esto lo hice yo. Entero. Mira el filo.»"],
    items: [
      { id: "kd-daga", n: "Daga", src: "phbwepDagger0000", p: 20, s: 8, r: 5, cat: "Armas" },
      { id: "kd-hachamano", n: "Hacha de mano", src: "phbwepHandaxe000", p: 50, s: 6, r: 5, cat: "Armas" },
      { id: "kd-martillo", n: "Martillo ligero", src: "phbwepLightHamme", p: 20, s: 4, r: 5, cat: "Armas" },
      { id: "kd-maza", n: "Maza", src: "phbwepMace000000", p: 50, s: 3, r: 7, cat: "Armas" },
      { id: "kd-hoz", n: "Hoz", src: "phbwepSickle0000", p: 10, s: 6, r: 5, cat: "Armas" },
      { id: "kd-lanza", n: "Lanza", src: "phbwepSpear00000", p: 8, s: 8, r: 5, cat: "Armas" },
      { id: "kd-jabalina", n: "Jabalina", src: "phbwepJavelin000", p: 5, s: 10, r: 5, cat: "Armas" },
      { id: "kd-espcorta", n: "Espada corta", src: "phbwepShortsword", p: 100, s: 2, r: 10, cat: "Armas" },
      { id: "kd-hachabat", n: "Hacha de batalla", src: "phbwepBattleaxe0", p: 100, s: 3, r: 10, cat: "Armas" },
      { id: "kd-picoguerra", n: "Pico de guerra", src: "phbwepWarPick000", p: 50, s: 2, r: 10, cat: "Armas" },
      { id: "kd-mangual", n: "Mangual", src: "phbwepFlail00000", p: 100, s: 2, r: 10, cat: "Armas" },
      { id: "kd-pala", n: "Pala", src: "phbagShovel00000", p: 20, s: 4, r: 5, cat: "Herramientas y ferretería" },
      { id: "kd-palanca", n: "Palanca", src: "phbagCrowbar0000", p: 20, s: 3, r: 5, cat: "Herramientas y ferretería" },
      { id: "kd-clavos", n: "Clavos de hierro (10)", src: "phbagSpikesIron0", p: 10, s: 8, r: 5, cat: "Herramientas y ferretería" },
      { id: "kd-olla", n: "Olla de hierro", src: "phbagPotIron0000", p: 20, s: 3, r: 7, cat: "Herramientas y ferretería" },
      { id: "kd-trampa", n: "Trampa de caza", src: "phbagHuntingTrap", p: 50, s: 3, r: 7, cat: "Herramientas y ferretería" },
      { id: "kd-abrojos", n: "Abrojos", src: "phbagCaltrops000", p: 10, s: 3, r: 7, cat: "Herramientas y ferretería" },
      { id: "kd-garfio", n: "Garfio de escalada", src: "phbagGrapplingHo", p: 20, s: 2, r: 7, cat: "Herramientas y ferretería" },
      { id: "kd-albanil", n: "Herramientas de albañil", src: "phbtulMasonsTool", p: 100, s: 1, r: 14, cat: "Herramientas y ferretería" },
      { id: "kd-afilar", n: "Afilar un arma o herramienta", t: "loot", p: 2, serv: true, srv: "afilar", cat: "Servicios", ic: "icons/skills/trades/smithing-anvil-silver-red.webp", kw: ["whetstone", "sharpen", "anvil"], d: "<p>Kunno pasa la piedra rápido y cobra menos que nadie. <b>Arregla una herramienta mellada</b> de tus oficios.</p>" },
      { id: "kd-reparar", n: "Reparar una herramienta rota", t: "loot", p: 6, serv: true, srv: "reparar", cat: "Servicios", ic: "icons/skills/trades/smithing-anvil-silver-red.webp", kw: ["anvil", "hammer"], d: "<p>Mango nuevo y remaches nuevos, al momento. <b>Arregla una herramienta rota</b> (o mellada) de tus oficios.</p>" }
    ]
  },
  /* ---------------------------------------------------------------- */
  {
    id: "sera", nombre: "La forja de Sera", patron: "martillo",
    dueno: "Sera Drekken", npc: ["Sera"],
    lugar: "Galpón del carbón, detrás de la herrería Martillo Gris",
    horario: [[8, 17]],
    compra: ["weapon", "tool"],
    img: "icons/tools/smithing/tongs-steel-grey.webp", kw: ["tongs", "anvil"],
    descripcion: "<p><b>Sera Drekken</b> trabaja en el galpón del carbón, con la puerta entornada y sin prisa. Hace menos piezas y las cobra más caras, pero cada una sale templada dos veces y afilada a mano. Sus <b>herramientas de calidad</b> dan un bono al trabajo; las de su hermano, no.</p><p><i>Kunno y Sera se pelean los clientes del mismo patio. Ella gana en calidad; él, en precio.</i></p>",
    saludos: ["Sera no levanta la vista del temple: «La de mi hermano se mella en un mes. Esta no.»", "«Esto cuesta más porque dura más. Haz la cuenta.»", "Sera golpea el yunque una vez, suave: «¿Qué necesitas de verdad?»"],
    items: [
      { id: "sd-daga", n: "Daga equilibrada", src: "phbwepDagger0000", p: 30, s: 3, r: 10, cat: "Armas finas", d: "<p>Templada dos veces, mango envuelto en cuero.</p>" },
      { id: "sd-espcorta", n: "Espada corta de buen acero", src: "phbwepShortsword", p: 140, s: 1, r: 14, cat: "Armas finas" },
      { id: "sd-esplarga", n: "Espada larga", src: "phbwepLongsword0", p: 200, s: 1, r: 14, cat: "Armas finas" },
      { id: "sd-cimitarra", n: "Cimitarra", src: "phbwepScimitar00", p: 300, s: 1, r: 21, cat: "Armas finas" },
      { id: "sd-enc-estoque", n: "Encargar: Estoque", src: "phbwepRapier0000", p: 360, enc: 14, serv: true, cat: "Por encargo", d: "<p>Acero fino que Sera pide a Castrum Ignis. Unos 14 días.</p>" },
      { id: "sd-hacha-lenador", n: "Hacha de leñador de buen acero", src: "phbwepBattleaxe0", p: 160, s: 2, r: 14, cat: "Herramientas de calidad", herr: { oficios: ["tala"], bono: 1 }, d: "<p>Filo templado por Sera y mango de fresno. <b>+1 a las jornadas de Tala.</b> También sirve como hacha de batalla.</p>" },
      { id: "sd-tenazas", n: "Martillo y tenazas de los Drekken", src: "phbtulSmithsTool", p: 420, s: 1, r: 21, cat: "Herramientas de calidad", herr: { oficios: ["herreria"], bono: 1 }, d: "<p>Herramientas de herrero hechas por quien sabe. <b>+1 a las jornadas de Herrería.</b></p>" },
      { id: "sd-cuchillo", n: "Cuchillo de desollar de buen acero", src: "phbwepDagger0000", p: 45, s: 2, r: 14, cat: "Herramientas de calidad", herr: { oficios: ["caza"], bono: 1 }, d: "<p>Hoja curva y fina. <b>+1 a las jornadas de Caza.</b> También es una daga.</p>" },
      { id: "sd-hoz-buena", n: "Hoz de buen acero", src: "phbwepSickle0000", p: 35, s: 2, r: 14, cat: "Herramientas de calidad", herr: { oficios: ["recoleccion"], bono: 1 }, d: "<p>Corta limpio sin arrancar la raíz. <b>+1 a las jornadas de Recolección.</b></p>" },
      { id: "sd-sierra", n: "Hoja de sierra de acero templado", t: "tool", p: 120, s: 1, r: 21, cat: "Herramientas de calidad", herr: { oficios: ["serreria"], bono: 1 }, ic: "icons/tools/hand/saw-steel-grey.webp", kw: ["saw"], peso: 3, d: "<p>Dientes afilados uno por uno. <b>+1 a las jornadas de Serrería.</b></p>" },
      { id: "sd-herrero", n: "Herramientas de herrero", src: "phbtulSmithsTool", p: 260, s: 1, r: 21, cat: "Herramientas" },
      { id: "sd-afilar", n: "Afilado fino", t: "loot", p: 4, serv: true, srv: "afilar", cat: "Servicios", ic: "icons/skills/trades/smithing-anvil-silver-red.webp", kw: ["whetstone", "sharpen"], d: "<p>Sera afila a mano y te devuelve el filo mejor de como vino. <b>Arregla una herramienta mellada</b> de tus oficios.</p>" },
      { id: "sd-reparar", n: "Reparación cuidadosa", t: "loot", p: 10, serv: true, srv: "reparar", cat: "Servicios", ic: "icons/skills/trades/smithing-anvil-silver-red.webp", kw: ["anvil"], d: "<p>Remaches nuevos, mango de fresno y un temple. <b>Arregla una herramienta rota</b> (o mellada) de tus oficios.</p>" },
      { id: "sd-grabar", n: "Grabar un nombre o una marca en una hoja", t: "loot", p: 5, serv: true, cat: "Servicios", ic: "icons/skills/trades/smithing-anvil-silver-red.webp", kw: ["anvil"] }
    ]
  },
  /* ---------------------------------------------------------------- */
  {
    id: "panaderia", nombre: "Panadería de Hessa", patron: "hessa",
    dueno: "Hessa Brin (Pip hace los recados)", npc: ["Hessa"],
    lugar: "Junto al horno comunal",
    horario: [[6, 13]],
    compra: [],
    img: "icons/consumables/food/bread-loaf-round-white.webp", kw: ["bread", "loaf"],
    descripcion: "<p>El mejor pan del valle y el único horno comunal. <b>Hessa Brin</b> amasa desde antes del alba; <b>Pip</b> reparte por las casas.</p><p><i>El centeno se acaba antes del mediodía. Siempre. Hessa no fía: no es personal, es política. Si llegas con el horno encendido y apuro, la respuesta es no a todo: vuelve en media hora.</i></p>",
    saludos: ["Hessa no levanta la vista de la masa: «Lo que ves es lo que hay.»", "Pip te sonríe con harina hasta en las cejas.", "Hessa cuenta las monedas dos veces antes de darte el pan."],
    items: [
      { id: "hb-reb-centeno", n: "Rebanada de centeno", t: "consumable", ct: "food", p: 1, s: 12, r: 1, cat: "Pan", ic: "icons/consumables/food/bread-loaf-sliced-brown.webp", kw: ["bread", "slice"], d: "<p>Solo por la mañana.</p>" },
      { id: "hb-hog-centeno", n: "Hogaza de centeno", t: "consumable", ct: "food", p: 2, s: 6, r: 1, cat: "Pan", ic: "icons/consumables/food/bread-loaf-round-brown.webp", kw: ["bread", "loaf"] },
      { id: "hb-reb-trigo", n: "Rebanada de trigo", t: "consumable", ct: "food", p: 1, s: 12, r: 1, cat: "Pan", ic: "icons/consumables/food/bread-loaf-sliced-white.webp", kw: ["bread", "slice"] },
      { id: "hb-hog-trigo", n: "Hogaza de trigo", t: "consumable", ct: "food", p: 2, s: 8, r: 1, cat: "Pan", ic: "icons/consumables/food/bread-loaf-round-white.webp", kw: ["bread", "loaf"] },
      { id: "hb-cebada", n: "Pan de cebada", t: "consumable", ct: "food", p: 2, s: 4, r: 7, cat: "Pan", ic: "icons/consumables/food/bread-loaf-boule-rustic-brown.webp", kw: ["bread"], d: "<p>Solo los días de mercado.</p>" },
      { id: "hb-avena", n: "Bollo de avena", t: "consumable", ct: "food", p: 1, s: 10, r: 1, cat: "Bollería", ic: "icons/consumables/food/bread-roll-brown.webp", kw: ["roll", "bun", "bread"] },
      { id: "hb-grasa", n: "Bollo con grasa de cerdo", t: "consumable", ct: "food", p: 2, s: 6, r: 1, cat: "Bollería", ic: "icons/consumables/food/bread-roll-brown.webp", kw: ["roll", "bun"] },
      { id: "hb-viaje", n: "Panecillo de viaje", t: "consumable", ct: "food", p: 1, s: 12, r: 1, cat: "Bollería", ic: "icons/consumables/food/bread-roll-brown.webp", kw: ["roll", "bread"], d: "<p>Aguanta tres días sin ponerse duro. Lo compra quien sale al bosque o a la ruta.</p>" },
      { id: "hb-racion", n: "Ración de viaje (1 día)", src: "phbagRations0000", p: 5, s: 10, r: 1, cat: "Para el camino", d: "<p>Pan duro, queso, cecina y una manzana envueltos en tela. Un día de comida fuera del pueblo.</p>" },
      { id: "hb-miel", n: "Bollo con miel del valle", t: "consumable", ct: "food", p: 3, s: 4, r: 1, temp: "verano", cat: "De temporada", ic: "icons/consumables/food/bread-roll-brown.webp", kw: ["honey", "roll"] },
      { id: "hb-galletas", n: "Galletas de avena y miel (3)", t: "consumable", ct: "food", p: 2, s: 6, r: 1, temp: "verano", cat: "De temporada", ic: "icons/consumables/food/cookie-chocolate-chip.webp", kw: ["cookie", "biscuit"] },
      { id: "hb-tarta", n: "Tarta rústica de frutos del bosque", t: "consumable", ct: "food", p: 5, s: 2, r: 1, temp: "otono", cat: "De temporada", ic: "icons/consumables/food/pie-berry-red.webp", kw: ["pie", "tart"] },
      { id: "hb-especiado", n: "Pan especiado de invierno", t: "consumable", ct: "food", p: 3, s: 4, r: 1, temp: "invierno", cat: "De temporada", ic: "icons/consumables/food/bread-loaf-round-brown.webp", kw: ["bread"] },
      { id: "hb-alm-ligero", n: "Almuerzo ligero", t: "loot", p: 2, serv: true, cat: "Almuerzos", ic: "icons/consumables/food/soup-broth-bowl-wooden-yellow.webp", kw: ["soup", "bowl"] },
      { id: "hb-alm-normal", n: "Almuerzo normal", t: "loot", p: 3, serv: true, cat: "Almuerzos", ic: "icons/consumables/food/bowl-stew-brown.webp", kw: ["stew", "bowl"] },
      { id: "hb-alm-lenador", n: "Almuerzo de leñador", t: "loot", p: 4, serv: true, cat: "Almuerzos", ic: "icons/consumables/food/short-ribs-cooked-meat-brown.webp", kw: ["meat"] },
      { id: "hb-horno", n: "Usar el horno comunal (una hornada)", t: "loot", p: 2, serv: true, cat: "Horno comunal", ic: "icons/consumables/food/bread-loaf-round-white.webp", kw: ["bread"] },
      { id: "hb-hornear", n: "Hornear masa ajena", t: "loot", p: 1, serv: true, cat: "Horno comunal", ic: "icons/consumables/food/bread-loaf-round-white.webp", kw: ["bread"] },
      { id: "hb-calentar", n: "Calentar comida traída", t: "loot", p: 1, serv: true, cat: "Horno comunal", ic: "icons/consumables/food/bowl-stew-brown.webp", kw: ["stew"] }
    ]
  },
  /* ---------------------------------------------------------------- */
  {
    id: "roble", nombre: "El Último Roble", patron: "posada",
    dueno: "Garrick (con Morris, Mona y Finn)", npc: ["Garrick"],
    lugar: "La posada, frente a la plaza",
    horario: [[6, 24]],
    compra: [],
    img: "icons/containers/kitchenware/stein-empty.webp", kw: ["stein", "mug"],
    descripcion: "<p>Dos plantas y semisótano, ocho mesas, chimenea central y mapas viejos en las paredes; en la viga del techo hay un mapa tallado. <b>Garrick</b> no trata a nadie distinto: precios justos para todos. <b>Mona</b> cocina, <b>Finn</b> sirve y carga barriles, <b>Morris</b> lleva las cuentas.</p><p><i>El baño caliente funciona con un aparato mágico, el único del pueblo junto al de la embajada. Nadie ha preguntado con suficiente insistencia de dónde lo sacó Garrick.</i></p>",
    saludos: ["Finn deja la jarra sobre la mesa sin derramar una gota.", "Mona asoma desde la cocina: «¿Con carne o sin carne?»", "Garrick asiente desde la barra. Te está midiendo, como a todos."],
    items: [
      { id: "ur-cerveza", n: "Cerveza ligera", t: "loot", p: 1, serv: true, cat: "Bebida", ic: "icons/consumables/drinks/beer-stein-wooden-metal-brown.webp", kw: ["beer", "stein"] },
      { id: "ur-sidra", n: "Sidra del valle", t: "loot", p: 2, serv: true, cat: "Bebida", ic: "icons/consumables/drinks/tea-jug-gourd-brown.webp", kw: ["cider", "jug"] },
      { id: "ur-fuerte", n: "Cerveza fuerte", t: "loot", p: 4, serv: true, cat: "Bebida", ic: "icons/consumables/drinks/beer-stein-wooden-metal-brown.webp", kw: ["beer"] },
      { id: "ur-licor", n: "Licor importado", t: "loot", p: 12, serv: true, cat: "Bebida", ic: "icons/consumables/drinks/alcohol-jar-spirits-gray.webp", kw: ["spirits", "wine"] },
      { id: "ur-ronda", n: "Una ronda para toda la sala", t: "loot", p: 15, serv: true, cat: "Bebida", ic: "icons/consumables/drinks/beer-stein-wooden-metal-brown.webp", kw: ["beer"], d: "<p>Cerveza ligera para todos los que estén. Hace amigos rápido.</p>" },
      { id: "ur-odre-vino", n: "Odre de vino para el camino", t: "consumable", ct: "food", p: 8, s: 4, r: 7, cat: "Para llevar", ic: "icons/consumables/drinks/wine-amphora-clay-pink.webp", kw: ["wine", "waterskin"] },
      { id: "ur-fuego", n: "Noche junto al fuego común", t: "loot", p: 3, serv: true, srv: "noche", bono: 0, cat: "Alojamiento", ic: "icons/sundries/survival/bedroll-grey.webp", kw: ["fire", "campfire"], d: `<p>Una manta en el suelo, cerca de la chimenea. Se duerme mal, pero se duerme.</p>${NOCHE}` },
      { id: "ur-camastro", n: "Camastro compartido", t: "loot", p: 5, serv: true, srv: "noche", bono: 0, cat: "Alojamiento", ic: "icons/sundries/survival/bedroll-grey.webp", kw: ["bedroll", "bed"], d: `<p>La habitación de seis camas de arriba. Ronquidos incluidos.</p>${NOCHE}` },
      { id: "ur-hab-sencilla", n: "Habitación sencilla", t: "loot", p: 10, serv: true, srv: "noche", bono: 1, cat: "Alojamiento", ic: "icons/sundries/survival/bedroll-grey.webp", kw: ["bed"], d: `<p>Una cama para ti solo y una puerta que cierra. <b>Bien descansado: +1 al trabajo de mañana.</b></p>${NOCHE}` },
      { id: "ur-hab-privada", n: "Habitación privada cómoda", t: "loot", p: 18, serv: true, srv: "noche", bono: 1, cat: "Alojamiento", ic: "icons/sundries/survival/bedroll-grey.webp", kw: ["bed"], d: `<p>Cama ancha, manta de lana y agua para lavarse. <b>Bien descansado: +1 al trabajo de mañana.</b></p>${NOCHE}` },
      { id: "ur-hab-mejor", n: "La mejor habitación", t: "loot", p: 30, serv: true, srv: "noche", bono: 2, cat: "Alojamiento", ic: "icons/sundries/survival/bedroll-grey.webp", kw: ["bed"], d: `<p>Chimenea propia, ventana a la plaza y desayuno en la cama. <b>Como nuevo: +2 al trabajo de mañana.</b></p>${NOCHE}` },
      { id: "ur-sopa", n: "Pan y sopa aguada", t: "loot", p: 1, serv: true, cat: "Comida", ic: "icons/consumables/food/soup-broth-bowl-wooden-yellow.webp", kw: ["soup"] },
      { id: "ur-estofado", n: "Estofado simple", t: "loot", p: 2, serv: true, cat: "Comida", ic: "icons/consumables/food/bowl-stew-brown.webp", kw: ["stew"] },
      { id: "ur-estofado-carne", n: "Estofado con carne", t: "loot", p: 4, serv: true, cat: "Comida", ic: "icons/consumables/food/bowl-stew-brown.webp", kw: ["stew"] },
      { id: "ur-cena", n: "Cena abundante de leñador", t: "loot", p: 6, serv: true, cat: "Comida", ic: "icons/consumables/food/short-ribs-cooked-meat-brown.webp", kw: ["meat"] },
      { id: "ur-banquete", n: "Banquete especial", t: "loot", p: 10, serv: true, cat: "Comida", ic: "icons/consumables/food/cooked-drumstick-chicken-turkey-brown.webp", kw: ["chicken", "meat"] },
      { id: "ur-bano", n: "Baño caliente", t: "loot", p: 3, serv: true, cat: "Servicios", ic: "icons/containers/misc/bucket-steel.webp", kw: ["bucket", "tub"], d: "<p>El agua sale caliente de un aparato que nadie entiende.</p>" },
      { id: "ur-lavado", n: "Lavado de ropa", t: "loot", p: 4, serv: true, cat: "Servicios", ic: "icons/commodities/cloth/cloth-roll-worn-blue.webp", kw: ["cloth"] },
      { id: "ur-remiendo", n: "Remiendo de ropa", t: "loot", p: 5, serv: true, cat: "Servicios", ic: "icons/commodities/cloth/thread-spindle-white-needle.webp", kw: ["needle", "thread"] },
      { id: "ur-afilar", n: "Afilar una herramienta", t: "loot", p: 3, serv: true, srv: "afilar", cat: "Servicios", ic: "icons/skills/trades/smithing-anvil-silver-red.webp", kw: ["whetstone"], d: "<p>Garrick tiene piedra de afilar para los leñadores. <b>Arregla una herramienta mellada.</b></p>" },
      { id: "ur-reparar", n: "Reparar una herramienta", t: "loot", p: 8, serv: true, srv: "reparar", cat: "Servicios", ic: "icons/skills/trades/smithing-anvil-silver-red.webp", kw: ["hammer"], d: "<p><b>Arregla una herramienta rota</b> (o mellada).</p>" },
      { id: "ur-recado", n: "Mandar a Finn con un recado", t: "loot", p: 2, serv: true, cat: "Servicios", ic: "icons/sundries/scrolls/scroll-rolled-white.webp", kw: ["scroll", "letter"], d: "<p>Un mensaje dentro del pueblo, entregado antes de una hora.</p>" },
      { id: "ur-rumores", n: "Invitar a Garrick a un trago (rumores)", t: "loot", p: 4, serv: true, cat: "Servicios", ic: "icons/consumables/drinks/alcohol-jar-spirits-gray.webp", kw: ["spirits"], d: "<p>Garrick escucha más de lo que habla. Por un trago, a veces cuenta algo. (El DM decide qué.)</p>" }
    ]
  },
  /* ---------------------------------------------------------------- */
  {
    id: "irma", nombre: "Puesto de Irma Salt", patron: null,
    dueno: "Irma Salt", npc: ["Irma"],
    lugar: "La plaza del mercado (el único puesto fijo)",
    horario: [[8, 18]],
    compra: ["loot", "container", "equipment", "consumable", "tool", "weapon"],
    img: "icons/containers/bags/pack-canvas-white-brown.webp", kw: ["pack", "bag"],
    descripcion: "<p>El único puesto que no se desarma al acabar el mercado semanal. <b>Irma Salt</b> vende de todo un poco: lo que trae la caravana de Oswin y lo que le dejan en consignación los vecinos. También compra lo que traigas, si cree que lo puede revender.</p><p><i>Lo importado llega con la caravana de Oswin cada seis semanas: cuando se acaba, se acaba.</i></p>",
    saludos: ["Irma ya está calculando cuánto le vas a dejar.", "«Esto llegó con Oswin. No vuelve hasta dentro de un mes y medio», dice Irma.", "Irma anota la venta en una libreta llena de cruces y números."],
    items: [
      { id: "is-mochila", n: "Mochila", src: "phbagBackpack000", p: 16, s: 4, r: 14, cat: "Equipo de viaje" },
      { id: "is-saco", n: "Saco", src: "phbagSack0000000", p: 1, s: 10, r: 7, cat: "Equipo de viaje" },
      { id: "is-bolsa", n: "Bolsa", src: "phbagPouch000000", p: 4, s: 6, r: 7, cat: "Equipo de viaje" },
      { id: "is-odre", n: "Odre", src: "phbagWaterskin00", p: 2, s: 6, r: 7, cat: "Equipo de viaje" },
      { id: "is-petate", n: "Petate", src: "phbagBedroll0000", p: 8, s: 4, r: 7, cat: "Equipo de viaje" },
      { id: "is-manta", n: "Manta", src: "phbagBlanket0000", p: 4, s: 6, r: 7, cat: "Equipo de viaje" },
      { id: "is-tienda", n: "Tienda de campaña", src: "phbagTent0000000", p: 16, s: 2, r: 14, cat: "Equipo de viaje" },
      { id: "is-cuerda", n: "Cuerda de cáñamo (50 ft)", src: "phbagRope0000000", p: 8, s: 6, r: 7, cat: "Equipo de viaje" },
      { id: "is-yesquero", n: "Yesquero", src: "phbagTinderbox00", p: 5, s: 6, r: 7, cat: "Equipo de viaje" },
      { id: "is-antorcha", n: "Antorcha", src: "phbagTorch000000", p: 1, s: 20, r: 7, cat: "Luz" },
      { id: "is-vela", n: "Vela", src: "phbagCandle00000", p: 1, s: 20, r: 7, cat: "Luz" },
      { id: "is-aceite", n: "Aceite (frasco)", src: "phbagOil00000000", p: 1, s: 10, r: 7, cat: "Luz" },
      { id: "is-lampara", n: "Lámpara", src: "phbagLamp0000000", p: 5, s: 2, r: 14, cat: "Luz" },
      { id: "is-farol", n: "Farol de capucha", src: "phbagLanternHood", p: 60, s: 1, r: 42, cat: "Luz" },
      { id: "is-farol-sordo", n: "Linterna sorda", src: "phbagLanternBull", p: 150, s: 1, r: 42, cat: "Importado (caravana)" },
      { id: "is-racion", n: "Ración de viaje (1 día)", src: "phbagRations0000", p: 5, s: 10, r: 7, cat: "Equipo de viaje" },
      { id: "is-ropa-viaje", n: "Ropa de viaje", src: "phbagClothesTrav", p: 16, s: 3, r: 14, cat: "Ropa" },
      { id: "is-cesta", n: "Cesta", src: "phbagBasket00000", p: 3, s: 4, r: 7, cat: "Recipientes" },
      { id: "is-cubo", n: "Cubo", src: "phbagBucket00000", p: 1, s: 4, r: 7, cat: "Recipientes" },
      { id: "is-jarra", n: "Jarra de barro", src: "phbagJug00000000", p: 1, s: 4, r: 7, cat: "Recipientes" },
      { id: "is-frasco", n: "Frasco", src: "phbagFlask000000", p: 1, s: 6, r: 7, cat: "Recipientes" },
      { id: "is-botella", n: "Botella de vidrio", src: "phbagBottleGlass", p: 30, s: 2, r: 42, cat: "Importado (caravana)" },
      { id: "is-vial", n: "Vial", src: "phbagVial0000000", p: 15, s: 3, r: 42, cat: "Importado (caravana)" },
      { id: "is-papel", n: "Papel (hoja)", src: "phbagPaper000000", p: 3, s: 10, r: 42, cat: "Importado (caravana)" },
      { id: "is-pergamino", n: "Pergamino (hoja)", src: "phbagParchment00", p: 1, s: 10, r: 14, cat: "Escritura" },
      { id: "is-pluma", n: "Pluma de escribir", src: "phbagInkPen00000", p: 1, s: 6, r: 14, cat: "Escritura" },
      { id: "is-tinta", n: "Tinta (frasco)", src: "phbagInk00000000", p: 150, s: 1, r: 42, cat: "Importado (caravana)" },
      { id: "is-espejo", n: "Espejo de acero", src: "phbagMirror00000", p: 75, s: 1, r: 42, cat: "Importado (caravana)" },
      { id: "is-perfume", n: "Perfume", src: "phbagPerfume0000", p: 75, s: 1, r: 42, cat: "Importado (caravana)" },
      { id: "is-ropa-fina", n: "Ropa fina", src: "phbagClothesFine", p: 225, s: 1, r: 42, cat: "Importado (caravana)" },
      { id: "is-catalejo", n: "Catalejo", src: "phbagSpyglass100", p: 15000, s: 0, r: 0, cat: "Importado (caravana)", d: "<p>Irma dice que Oswin podría conseguir uno. Cuesta lo que una casa.</p>" },
      { id: "is-pocion", n: "Poción de curación", src: "phbagPotionofHea", p: 750, s: 1, r: 42, cat: "Importado (caravana)", d: "<p>Una sola botella por caravana, si hay suerte. En el valle casi nadie ha visto una.</p>" },
      { id: "is-dados", n: "Dados de hueso", src: "phbgstDice000000", p: 1, s: 4, r: 14, cat: "Juegos" },
      { id: "is-naipes", n: "Baraja de naipes", src: "phbgstPlayingcar", p: 5, s: 2, r: 14, cat: "Juegos" },
      { id: "is-silbato", n: "Silbato", src: "phbagSignalWhist", p: 1, s: 4, r: 14, cat: "Varios" },
      { id: "is-campanilla", n: "Campanilla", src: "phbagBell0000000", p: 10, s: 2, r: 14, cat: "Varios" },
      { id: "is-bolas", n: "Bolas de rodamiento (bolsa)", src: "phbagBallBearing", p: 10, s: 1, r: 42, cat: "Varios" },
      { id: "is-jabon", n: "Pastilla de jabón", t: "loot", p: 1, s: 8, r: 7, cat: "Varios", ic: "icons/sundries/misc/soap-white.webp", kw: ["soap"] },
      { id: "is-tiza", n: "Trozo de tiza", t: "loot", p: 1, s: 8, r: 14, cat: "Varios", ic: "icons/commodities/stone/rock-chunk-pumice-white.webp", kw: ["chalk"] }
    ]
  },
  /* ---------------------------------------------------------------- */
  {
    id: "kurt", nombre: "Taller de Kurt", patron: "kurt",
    dueno: "Kurt el carpintero y Dessa", npc: ["Kurt", "Dessa"],
    lugar: "Al lado del patio del fuerte",
    horario: [[7, 18]],
    compra: ["weapon", "equipment", "tool", "container", "loot"],
    img: "icons/tools/hand/saw-steel-grey.webp", kw: ["saw", "hammer"],
    descripcion: "<p>Huele a resina y a serrín. <b>Kurt</b> construyó o reparó la mitad del pueblo; <b>Dessa</b> lleva los encargos y no se le escapa un clavo. La madera del valle es buena y barata: lo de madera aquí cuesta menos que en las ciudades.</p>",
    saludos: ["Kurt sopla el serrín de la pieza y te la da: «Derecha como un pino.»", "Dessa apunta tu nombre en la tabla de encargos.", "Kurt golpea la madera con los nudillos: suena bien."],
    items: [
      { id: "kt-garrote", n: "Garrote", src: "phbwepClub000000", p: 1, s: 4, r: 7, cat: "Armas de madera" },
      { id: "kt-baston", n: "Bastón", src: "phbwepQuartersta", p: 2, s: 4, r: 7, cat: "Armas de madera" },
      { id: "kt-gran-garrote", n: "Gran garrote", src: "phbwepGreatclub0", p: 2, s: 2, r: 7, cat: "Armas de madera" },
      { id: "kt-escudo", n: "Escudo de madera", src: "phbarmShield0000", p: 80, s: 2, r: 14, cat: "Armas de madera", d: "<p>Tablas de roble con borde de cuero.</p>" },
      { id: "kt-baston-arcano", n: "Bastón tallado (foco)", src: "phbdfcWoodenstaf", p: 40, s: 1, r: 14, cat: "Armas de madera", d: "<p>Fresno del valle, tallado a mano. Sirve de foco druídico o arcano.</p>" },
      { id: "kt-carpintero", n: "Herramientas de carpintero", src: "phbtulCarpenters", p: 80, s: 2, r: 14, cat: "Herramientas" },
      { id: "kt-tallador", n: "Herramientas de tallador", src: "phbtulWoodcarver", p: 10, s: 2, r: 14, cat: "Herramientas" },
      { id: "kt-sierra", n: "Sierra de dientes finos de Kurt", src: "phbtulCarpenters", p: 140, s: 1, r: 21, cat: "Herramientas de calidad", herr: { oficios: ["serreria", "carpinteria"], bono: 1 }, d: "<p>Kurt la afiló y la ajustó él mismo. <b>+1 a las jornadas de Serrería y Carpintería.</b></p>" },
      { id: "kt-escalera", n: "Escalera (10 ft)", src: "phbagLadder00000", p: 1, s: 2, r: 7, cat: "Madera" },
      { id: "kt-pertiga", n: "Pértiga (10 ft)", src: "phbagPole0000000", p: 1, s: 4, r: 7, cat: "Madera" },
      { id: "kt-barril", n: "Barril", src: "phbagBarrel00000", p: 16, s: 2, r: 14, cat: "Madera" },
      { id: "kt-cofre", n: "Cofre", src: "phbagChest000000", p: 40, s: 1, r: 14, cat: "Madera" },
      { id: "kt-estuche", n: "Estuche para mapas o pergaminos", src: "phbagCaseMaporSc", p: 8, s: 2, r: 14, cat: "Madera" },
      { id: "kt-polea", n: "Polea y aparejo", src: "phbagBlockandTac", p: 10, s: 1, r: 14, cat: "Madera" },
      { id: "kt-ariete", n: "Ariete portátil", src: "phbagRamPortable", p: 32, s: 0, r: 0, cat: "Madera", d: "<p>Se hace por encargo, en tres días. Pídelo al DM.</p>" },
      { id: "kt-reparar", n: "Reparar una herramienta de madera", t: "loot", p: 6, serv: true, srv: "reparar", cat: "Servicios", ic: "icons/tools/hand/saw-steel-grey.webp", kw: ["saw"], d: "<p>Mango, cabo o caja nuevos. <b>Arregla una herramienta rota</b> (o mellada).</p>" },
      { id: "kt-mueble", n: "Encargar un mueble sencillo", t: "loot", p: 30, serv: true, cat: "Servicios", ic: "icons/containers/chest/chest-simple-box-brown.webp", kw: ["chest"], d: "<p>Una mesa, una cama, un arcón. Una semana de trabajo.</p>" }
    ]
  },
  /* ---------------------------------------------------------------- */
  {
    id: "lena", nombre: "Telar de Lena", patron: "lena",
    dueno: "Lena la tejedora", npc: ["Lena"],
    lugar: "Casa de Lena, dentro del pueblo",
    horario: [[8, 18]],
    compra: ["equipment", "loot"],
    img: "icons/commodities/cloth/cloth-bolt-gold-orange.webp", kw: ["cloth", "bolt"],
    descripcion: "<p>Telares, ovillos y estanterías de libros: <b>Lena</b> teje el paño del valle y guarda, junto a la capilla, los únicos libros del pueblo. Hace ropa a medida, remienda y presta libros a quien los cuida.</p>",
    saludos: ["Lena te mide con una cuerda con nudos, sin preguntar.", "«Esto abriga más de lo que parece», dice Lena.", "Lena vuelve a su telar antes de que termines de pagar."],
    items: [
      { id: "ln-ropa-comun", n: "Ropa común", t: "equipment", p: 5, s: 4, r: 7, cat: "Ropa", ic: "icons/equipment/chest/shirt-collared-brown.webp", kw: ["shirt"], peso: 3, d: "<p>Camisa, calzas y sayo de lana del valle.</p>" },
      { id: "ln-ropa-viaje", n: "Ropa de viaje", src: "phbagClothesTrav", p: 16, s: 3, r: 7, cat: "Ropa" },
      { id: "ln-tunica", n: "Túnica", src: "phbagRobe0000000", p: 8, s: 3, r: 7, cat: "Ropa" },
      { id: "ln-capa", n: "Capa de lana gruesa", t: "equipment", p: 12, s: 3, r: 7, cat: "Ropa", ic: "icons/equipment/back/cloak-heavy-fur-blue.webp", kw: ["cloak"], peso: 3, d: "<p>Abriga de verdad. En invierno, en el bosque, se nota.</p>" },
      { id: "ln-disfraz", n: "Disfraz", src: "phbagCostume0000", p: 40, s: 1, r: 14, cat: "Ropa" },
      { id: "ln-enc-fina", n: "Encargar: Ropa fina", src: "phbagClothesFine", p: 150, enc: 7, serv: true, cat: "Por encargo", d: "<p>Paño fino teñido y cosido a tu medida. Una semana.</p>" },
      { id: "ln-tejedor", n: "Herramientas de tejedor", src: "phbtulWeaversToo", p: 8, s: 2, r: 14, cat: "Herramientas" },
      { id: "ln-telar", n: "Lanzadera y peines de Lena", src: "phbtulWeaversToo", p: 60, s: 1, r: 21, cat: "Herramientas de calidad", herr: { oficios: ["tejeduria"], bono: 1 }, d: "<p>Herramientas gastadas por años de buen uso. <b>+1 a las jornadas de Tejeduría.</b></p>" },
      { id: "ln-hilo", n: "Hilo y agujas", t: "loot", p: 2, s: 6, r: 7, cat: "Mercería", ic: "icons/commodities/cloth/thread-spindle-white-needle.webp", kw: ["needle", "thread"] },
      { id: "ln-pano", n: "Paño de lana (7 ft)", t: "loot", p: 6, s: 6, r: 7, cat: "Mercería", ic: "icons/commodities/cloth/cloth-roll-worn-blue.webp", kw: ["cloth"], peso: 2 },
      { id: "ln-cuerda", n: "Cordel (rollo)", src: "phbagString00000", p: 1, s: 6, r: 7, cat: "Mercería" },
      { id: "ln-libro", n: "Libro copiado a mano", src: "phbagBook0000000", p: 250, s: 1, r: 42, cat: "Libros", d: "<p>Lena tiene unos pocos para vender. La mayoría solo los presta (ver la biblioteca de Alwen Marr).</p>" },
      { id: "ln-prestamo", n: "Préstamo de un libro (una semana)", t: "loot", p: 2, serv: true, cat: "Libros", ic: "icons/sundries/books/book-black-grey.webp", kw: ["book"], d: "<p>Se devuelve limpio y entero, o se paga.</p>" },
      { id: "ln-remiendo", n: "Remendar o ajustar ropa", t: "loot", p: 3, serv: true, cat: "Servicios", ic: "icons/commodities/cloth/thread-spindle-white-needle.webp", kw: ["needle"] }
    ]
  },
  /* ---------------------------------------------------------------- */
  {
    id: "nessa", nombre: "Clínica de Nessa", patron: "nessa",
    dueno: "Nessa (con Lena)", npc: ["Nessa"],
    lugar: "Dentro del pueblo; aquí se recuperan Claudia y Odonata",
    horario: [[0, 24]],
    compra: ["consumable", "loot"],
    img: "icons/tools/laboratory/mortar-pestle-stone-grey.webp", kw: ["mortar", "herb"],
    descripcion: "<p>La única «médica» del pueblo. <b>Nessa</b> no usa magia: hierbas, hilo, agua hervida y paciencia. La puerta nunca está cerrada del todo: si es urgente, golpea.</p><p><i>El tratamiento de heridas (2 c por día) lo cobra solo el módulo después de cada Descanso Largo.</i></p>",
    saludos: ["Nessa te mira las manos antes que la cara.", "«Hervido, siempre hervido», murmura Nessa mientras envuelve las vendas.", "Nessa te pone la mano en la frente sin pedir permiso."],
    items: [
      { id: "ns-kit", n: "Kit de sanador", src: "phbagHealersKit0", p: 50, s: 3, r: 7, cat: "Curación" },
      { id: "ns-vendas", n: "Vendas limpias (rollo)", t: "consumable", ct: "trinket", p: 1, s: 10, r: 1, cat: "Curación", ic: "icons/commodities/cloth/cloth-roll-worn-blue.webp", kw: ["bandage", "cloth"], d: "<p>Lino hervido y seco al sol.</p>" },
      { id: "ns-unguento", n: "Ungüento de caléndula", t: "consumable", ct: "potion", p: 3, s: 6, r: 3, cat: "Remedios", ic: "icons/consumables/potions/bottle-round-corked-yellow.webp", kw: ["salve", "jar", "potion"], d: "<p>Para cortes y quemaduras: limpia y calma. No cura PG, pero el DM puede dar ventaja a una prueba de Medicina con él.</p>" },
      { id: "ns-infusion", n: "Infusión para la fiebre", t: "consumable", ct: "potion", p: 2, s: 6, r: 3, cat: "Remedios", ic: "icons/consumables/drinks/tea-jug-gourd-brown.webp", kw: ["tea"], d: "<p>Sauce, menta y miel. Ayuda contra fiebres leves (lo decide el DM).</p>" },
      { id: "ns-antidoto", n: "Antídoto de Nessa", src: "phbagAntitoxin00", p: 60, s: 2, r: 7, cat: "Remedios", d: "<p>Amargo como la bilis. Funciona como una antitoxina.</p>" },
      { id: "ns-herbolario", n: "Útiles de herborista", src: "phbtulHerbalismK", p: 40, s: 1, r: 14, cat: "Herramientas" },
      { id: "ns-morteros", n: "Morteros y cedazos de Nessa", src: "phbtulHerbalismK", p: 80, s: 1, r: 21, cat: "Herramientas de calidad", herr: { oficios: ["herboristeria", "sanacion"], bono: 1 }, d: "<p>Morteros de piedra y cedazos finos. <b>+1 a las jornadas de Herboristería y Asistente de sanación.</b></p>" },
      { id: "ns-consulta", n: "Consulta", t: "loot", p: 2, serv: true, cat: "Servicios", ic: "icons/tools/laboratory/mortar-pestle-stone-grey.webp", kw: ["mortar"], d: "<p>Nessa te revisa y te dice la verdad, aunque no te guste.</p>" },
      { id: "ns-coser", n: "Coser una herida", t: "loot", p: 3, serv: true, cat: "Servicios", ic: "icons/commodities/cloth/thread-spindle-white-needle.webp", kw: ["needle"], d: "<p>Hilo, aguja y un trago para aguantar.</p>" }
    ]
  },
  /* ---------------------------------------------------------------- */
  {
    id: "corvin", nombre: "Curtiduría de Corvin", patron: null,
    dueno: "Corvin el curtidor", npc: ["Corvin"],
    lugar: "Extremo sur del valle, donde el viento se lleva el olor",
    horario: [[6, 16]],
    compra: ["loot", "equipment"],
    img: "icons/commodities/leather/leather-buckle-steel-tan.webp", kw: ["leather"],
    descripcion: "<p>El olor llega antes que el edificio. <b>Corvin</b> curte las pieles de los cazadores del gremio y de los hermanos Wend, y hace con ellas lo que el valle necesita: armaduras, botas, correas y odres. El cuero del valle es bueno y barato.</p>",
    saludos: ["Corvin se seca las manos manchadas de tanino.", "«Esto aguanta tres inviernos», dice Corvin, y golpea el cuero.", "Corvin huele a corteza de roble y a cosas que mejor no preguntar."],
    items: [
      { id: "cv-cuero", n: "Armadura de cuero", src: "phbarmLeatherArm", p: 80, s: 2, r: 14, cat: "Armaduras" },
      { id: "cv-acolchada", n: "Armadura acolchada", src: "phbarmPaddedArmo", p: 40, s: 2, r: 14, cat: "Armaduras" },
      { id: "cv-pieles", n: "Armadura de pieles", src: "phbarmHideArmor0", p: 80, s: 2, r: 14, cat: "Armaduras" },
      { id: "cv-tachonado", n: "Cuero tachonado", src: "phbarmStuddedLea", p: 400, s: 1, r: 21, cat: "Armaduras", d: "<p>Los remaches los pone Marta Drekken.</p>" },
      { id: "cv-botas", n: "Botas de cuero", t: "equipment", p: 8, s: 4, r: 7, cat: "Cuero", ic: "icons/equipment/feet/boots-collared-leather-brown.webp", kw: ["boots"], peso: 2 },
      { id: "cv-cinturon", n: "Cinturón de cuero", t: "equipment", p: 2, s: 6, r: 7, cat: "Cuero", ic: "icons/equipment/waist/belt-buckle-square-leather-brown.webp", kw: ["belt"], peso: 0.5 },
      { id: "cv-guantes", n: "Guantes de trabajo", t: "equipment", p: 3, s: 6, r: 7, cat: "Cuero", ic: "icons/equipment/hand/glove-simple-leather-green.webp", kw: ["glove"], peso: 0.5 },
      { id: "cv-mochila", n: "Mochila de cuero", src: "phbagBackpack000", p: 14, s: 2, r: 14, cat: "Cuero" },
      { id: "cv-odre", n: "Odre", src: "phbagWaterskin00", p: 2, s: 6, r: 7, cat: "Cuero" },
      { id: "cv-carcaj", n: "Carcaj", src: "phbagQuiver00000", p: 8, s: 3, r: 14, cat: "Cuero" },
      { id: "cv-bolsa", n: "Bolsa de cinturón", src: "phbagPouch000000", p: 3, s: 6, r: 7, cat: "Cuero" },
      { id: "cv-honda", n: "Honda", src: "phbwepSling00000", p: 1, s: 4, r: 7, cat: "Cuero" },
      { id: "cv-latigo", n: "Látigo", src: "phbwepWhip000000", p: 16, s: 1, r: 14, cat: "Cuero" },
      { id: "cv-curtidor", n: "Herramientas de curtidor", src: "phbtulLeatherwor", p: 40, s: 1, r: 14, cat: "Herramientas" },
      { id: "cv-zapatero", n: "Herramientas de zapatero", src: "phbtulCobblersTo", p: 40, s: 1, r: 14, cat: "Herramientas" },
      { id: "cv-reparar", n: "Remendar una armadura de cuero", t: "loot", p: 6, serv: true, cat: "Servicios", ic: "icons/commodities/leather/leather-buckle-steel-tan.webp", kw: ["leather"] }
    ]
  },
  /* ---------------------------------------------------------------- */
  {
    id: "gremio", nombre: "Gremio de cazadores", patron: "gremio",
    dueno: "Petra Vane (con Thomas Reed desaparecido, el gremio no tiene jefe)", npc: ["Petra"],
    lugar: "Junto a la puerta este",
    horario: [[5, 9], [17, 21]],
    compra: ["loot", "weapon", "consumable"],
    img: "icons/weapons/bows/shortbow-recurve.webp", kw: ["bow"],
    descripcion: "<p>Una cabaña con cornamentas en la puerta. <b>Petra Vane</b> atiende antes de salir al monte y al volver; al mediodía no hay nadie. Compra pieles y carne, vende lo que un cazador necesita y alquila a quien conoce el valle.</p><p><i>Desde hace 18 meses los animales evitan el noreste. Nadie sabe por qué.</i></p>",
    saludos: ["Petra prueba la cuerda del arco antes de dártelo.", "«No vayas al noreste», te dice Petra sin que preguntes.", "Petra cuenta las flechas en voz baja."],
    items: [
      { id: "gc-arco-corto", n: "Arco corto", src: "phbwepShortbow00", p: 200, s: 2, r: 14, cat: "Armas" },
      { id: "gc-arco-largo", n: "Arco largo", src: "phbwepLongbow000", p: 400, s: 1, r: 21, cat: "Armas" },
      { id: "gc-flechas", n: "Flechas (20)", src: "phbamoArrows0000", p: 10, s: 6, r: 7, cat: "Armas" },
      { id: "gc-jabalina", n: "Jabalina", src: "phbwepJavelin000", p: 6, s: 4, r: 7, cat: "Armas" },
      { id: "gc-lanza", n: "Lanza de caza", src: "phbwepSpear00000", p: 10, s: 3, r: 7, cat: "Armas" },
      { id: "gc-red", n: "Red", src: "phbagNet00000000", p: 8, s: 2, r: 14, cat: "Trampas" },
      { id: "gc-trampa", n: "Trampa de caza", src: "phbagHuntingTrap", p: 60, s: 2, r: 14, cat: "Trampas" },
      { id: "gc-lazos", n: "Lazos de alambre (5)", t: "loot", p: 3, s: 6, r: 7, cat: "Trampas", ic: "icons/tools/fasteners/wire-coil.webp", kw: ["wire", "rope"], peso: 0.5 },
      { id: "gc-arco-petra", n: "Arco de Petra (bien templado)", src: "phbwepShortbow00", p: 300, s: 1, r: 30, cat: "Herramientas de calidad", herr: { oficios: ["caza"], bono: 1 }, d: "<p>Tejo curado tres años. <b>+1 a las jornadas de Caza.</b> También es un arco corto.</p>" },
      { id: "gc-cecina", n: "Cecina (1 día)", t: "consumable", ct: "food", p: 3, s: 8, r: 3, cat: "Para el monte", ic: "icons/consumables/food/short-ribs-cooked-meat-brown.webp", kw: ["meat", "jerky"] },
      { id: "gc-silbato", n: "Silbato de señales", src: "phbagSignalWhist", p: 1, s: 4, r: 7, cat: "Para el monte" },
      { id: "gc-guia", n: "Guía del gremio (medio día)", t: "loot", p: 8, serv: true, cat: "Servicios", ic: "icons/tools/navigation/map-simple-tan.webp", kw: ["map", "compass"], d: "<p>Un cazador te acompaña medio día por el valle. Conoce los atajos y lo que hay que evitar.</p>" },
      { id: "gc-despiece", n: "Despiezar y curar una presa", t: "loot", p: 2, serv: true, cat: "Servicios", ic: "icons/commodities/bones/hooves-cloven-brown.webp", kw: ["hooves"] }
    ]
  },
  /* ---------------------------------------------------------------- */
  {
    id: "capilla", nombre: "Capilla de la Llama Serena", patron: "capilla",
    dueno: "La hermana Elira (con Devo, Lira y Kael Horton)", npc: ["Elira"],
    lugar: "Dentro del pueblo, junto al campanario y el cementerio",
    horario: [[6, 21]],
    compra: [],
    img: "icons/sundries/lights/candle-unlit-white.webp", kw: ["candle"],
    descripcion: "<p>Piedra blanca, una llama que nunca se apaga y bancos gastados. La <b>hermana Elira</b> atiende a quien entra sin preguntar de dónde viene. Aquí está el otro fondo de libros del pueblo.</p><p><i>Los donativos no tienen precio fijo; estos son los habituales.</i></p>",
    saludos: ["La hermana Elira enciende una vela por ti.", "Devo barre en silencio mientras pagas.", "«Que la llama te guarde», dice Elira, y lo dice en serio."],
    items: [
      { id: "cp-vela", n: "Vela votiva", src: "phbagCandle00000", p: 1, s: 20, r: 7, cat: "Ofrendas" },
      { id: "cp-agua", n: "Agua bendita (frasco)", src: "phbagHolyWater00", p: 250, s: 2, r: 30, cat: "Objetos sagrados", d: "<p>Bendecida a la luz de la llama. Escasa.</p>" },
      { id: "cp-amuleto", n: "Amuleto de la Llama", src: "phbhsyAmuletworn", p: 40, s: 3, r: 14, cat: "Objetos sagrados" },
      { id: "cp-emblema", n: "Emblema de la Llama", src: "phbhsyEmblemborn", p: 40, s: 2, r: 14, cat: "Objetos sagrados" },
      { id: "cp-relicario", n: "Relicario", src: "phbhsyReliquaryh", p: 40, s: 1, r: 14, cat: "Objetos sagrados" },
      { id: "cp-bendicion", n: "Bendición", t: "loot", p: 1, serv: true, cat: "Servicios", ic: "icons/sundries/lights/candle-unlit-white.webp", kw: ["candle"] },
      { id: "cp-misa", n: "Rezo por los difuntos", t: "loot", p: 5, serv: true, cat: "Servicios", ic: "icons/sundries/lights/candle-unlit-white.webp", kw: ["candle"] },
      { id: "cp-funeral", n: "Funeral y sepultura", t: "loot", p: 20, serv: true, cat: "Servicios", ic: "icons/sundries/lights/candle-unlit-white.webp", kw: ["candle"] },
      { id: "cp-limosna", n: "Limosna para los pobres", t: "loot", p: 1, serv: true, cat: "Servicios", ic: "icons/containers/bags/coinpouch-simple-tan.webp", kw: ["coin"] },
      { id: "cp-lectura", n: "Leer en la capilla (un día)", t: "loot", p: 1, serv: true, cat: "Servicios", ic: "icons/sundries/books/book-black-grey.webp", kw: ["book"], d: "<p>Los libros no salen de la capilla.</p>" }
    ]
  },
  /* ---------------------------------------------------------------- */
  {
    id: "miria", nombre: "Gabinete de Miria", patron: "miria",
    dueno: "Miria Henner", npc: ["Miria"],
    lugar: "Su casa, llena de instrumentos",
    horario: [[10, 17]],
    compra: ["loot", "consumable", "equipment"],
    img: "icons/tools/laboratory/flask-round-blue.webp", kw: ["flask", "vial"],
    descripcion: "<p>Instrumentos de bronce que zumban, frascos etiquetados con letra diminuta y papeles por todas partes. <b>Miria</b> atiende solo por la tarde y solo si no está midiendo algo. Vende lo que un estudioso de lo arcano necesita y compra rarezas.</p>",
    saludos: ["Miria no deja de mirar la aguja de un instrumento mientras te cobra.", "«No toques eso», dice Miria, sin girarse.", "Miria anota algo en su cuaderno al verte entrar."],
    items: [
      { id: "mi-bolsa", n: "Bolsa de componentes", src: "phbagComponentPo", p: 250, s: 1, r: 30, cat: "Arcano" },
      { id: "mi-cristal", n: "Cristal (foco arcano)", src: "phbafcCrystal000", p: 100, s: 1, r: 30, cat: "Arcano" },
      { id: "mi-orbe", n: "Orbe (foco arcano)", src: "phbafcOrb0000000", p: 200, s: 1, r: 42, cat: "Arcano" },
      { id: "mi-varita", n: "Varita (foco arcano)", src: "phbafcWand000000", p: 100, s: 1, r: 30, cat: "Arcano" },
      { id: "mi-vara", n: "Vara (foco arcano)", src: "phbafcRod0000000", p: 100, s: 1, r: 30, cat: "Arcano" },
      { id: "mi-acido", n: "Ácido (vial)", src: "phbagAcid0000000", p: 250, s: 1, r: 14, cat: "Alquimia" },
      { id: "mi-fuego", n: "Fuego de alquimista", src: "phbagAlchemistsF", p: 500, s: 1, r: 21, cat: "Alquimia" },
      { id: "mi-alquimista", n: "Suministros de alquimista", src: "phbtulAlchemists", p: 500, s: 1, r: 42, cat: "Herramientas" },
      { id: "mi-caligrafia", n: "Útiles de caligrafía", src: "phbtulCalligraph", p: 100, s: 1, r: 30, cat: "Herramientas" },
      { id: "mi-lupa", n: "Lupa", src: "phbagMagnifyingG", p: 1500, s: 0, r: 0, cat: "Instrumentos", d: "<p>Miria tiene una. No la vende. Quizá Oswin consiga otra.</p>" },
      { id: "mi-tinta", n: "Tinta (frasco)", src: "phbagInk00000000", p: 120, s: 2, r: 30, cat: "Escritura" },
      { id: "mi-papel", n: "Papel (hoja)", src: "phbagPaper000000", p: 3, s: 10, r: 30, cat: "Escritura" },
      { id: "mi-pergamino", n: "Pergamino (hoja)", src: "phbagParchment00", p: 1, s: 10, r: 14, cat: "Escritura" },
      { id: "mi-truco", n: "Pergamino de truco", src: "phbagCantripScro", p: 300, s: 1, r: 42, cat: "Pergaminos", d: "<p>Miria copia uno al mes, si tiene tiempo. Pregunta al DM qué truco hay.</p>" },
      { id: "mi-lentes", n: "Lentes y compás de Miria", t: "loot", p: 150, s: 1, r: 42, cat: "Herramientas de calidad", herr: { oficios: ["arcano", "alquimia", "escriba"], bono: 1 }, ic: "icons/tools/navigation/compass-brass-blue-red.webp", kw: ["compass", "lens"], peso: 1, d: "<p>Instrumentos finos de medición. <b>+1 a las jornadas de Trabajo arcano, Alquimia y Escriba.</b></p>" },
      { id: "mi-identificar", n: "Estudiar un objeto extraño", t: "loot", p: 10, serv: true, cat: "Servicios", ic: "icons/tools/laboratory/flask-round-blue.webp", kw: ["flask"], d: "<p>Miria lo mira un día entero y te cuenta lo que entiende (lo decide el DM).</p>" }
    ]
  },
  /* ---------------------------------------------------------------- */
  {
    id: "establo", nombre: "Establo y carretería de Hilde", patron: null,
    dueno: "Hilde Brask", npc: [],
    lugar: "Las viejas caballerizas del fuerte, junto a la puerta oeste",
    horario: [[6, 20]],
    compra: ["equipment", "loot"],
    img: "icons/environment/settlement/stable.webp", kw: ["stable", "horse", "saddle"],
    descripcion: "<p>Huele a heno y a cuero mojado. <b>Hilde Brask</b> alquila mulas y carros, guarda animales y herra caballos con las herraduras de Marta. Su marido, Ivo, era guardia: murió con los árboles hace dos días. Hilde abrió igual. \"Los animales comen todos los días\", dice.</p><p><i>Para los viajes largos, ella sabe cuándo sale Dunno y te consigue un asiento en su carro.</i></p>",
    saludos: ["Hilde no deja de cepillar a la mula: «¿Para cuántos días?»", "«Esta muerde. Esa no. Elige.»", "Hilde tiene los ojos rojos y la voz firme: «Pagas por adelantado. Sin excepciones.»"],
    items: [
      { id: "es-mula-dia", n: "Alquilar una mula (un día)", t: "loot", p: 5, serv: true, cat: "Alquiler", ic: "icons/environment/creatures/horse-brown.webp", kw: ["horse", "mule"], d: "<p>Carga hasta 210 kg a paso lento. Si no vuelve, la pagas (80 c).</p>" },
      { id: "es-caballo-dia", n: "Alquilar un caballo de tiro (un día)", t: "loot", p: 8, serv: true, cat: "Alquiler", ic: "icons/environment/creatures/horse-brown.webp", kw: ["horse"] },
      { id: "es-carro-dia", n: "Alquilar un carro con mula (un día)", t: "loot", p: 15, serv: true, cat: "Alquiler", ic: "icons/environment/settlement/wagon.webp", kw: ["wagon", "cart"] },
      { id: "es-asiento", n: "Asiento en el carro de Dunno a Castrum Ignis (3 días)", t: "loot", p: 30, serv: true, cat: "Viajes", ic: "icons/environment/settlement/wagon.webp", kw: ["wagon", "cart"], d: "<p>Sale cuando Dunno tiene carga. Incluye pan y sopa por el camino. La escolta corre por tu cuenta.</p>" },
      { id: "es-guardar", n: "Guardar un animal (una noche, con heno)", t: "loot", p: 2, serv: true, cat: "Cuadra", ic: "icons/environment/settlement/stable.webp", kw: ["stable", "hay"] },
      { id: "es-herrar", n: "Herrar una mula o un caballo", t: "loot", p: 10, serv: true, cat: "Cuadra", ic: "icons/commodities/metal/clasp-steel-braid.webp", kw: ["horseshoe"] },
      { id: "es-comprar-mula", n: "Comprar una mula", t: "loot", p: 80, serv: true, cat: "Animales", ic: "icons/environment/creatures/horse-brown.webp", kw: ["horse", "mule"], d: "<p>Una mula sana y terca. El DM te da su ficha (Mula del compendio).</p>" },
      { id: "es-comprar-poni", n: "Comprar un poni", t: "loot", p: 30, serv: true, cat: "Animales", ic: "icons/environment/creatures/horse-brown.webp", kw: ["horse", "pony"], d: "<p>Bueno para halflings y gnomos. El DM te da su ficha.</p>" },
      { id: "es-silla", n: "Silla de montar", t: "equipment", p: 12, s: 2, r: 21, cat: "Arreos", ic: "icons/equipment/back/saddle-leather-brown.webp", kw: ["saddle"], peso: 25 },
      { id: "es-alforjas", n: "Alforjas", t: "equipment", p: 4, s: 3, r: 14, cat: "Arreos", ic: "icons/containers/bags/saddlebag-leather-brown.webp", kw: ["saddlebag", "bag"], peso: 8 },
      { id: "es-pienso", n: "Pienso (un día)", t: "consumable", ct: "food", p: 1, s: 20, r: 3, cat: "Arreos", ic: "icons/consumables/food/grain-wheat-yellow.webp", kw: ["grain", "wheat"], peso: 10 },
      { id: "es-cuerda", n: "Cuerda de cáñamo (50 ft)", src: "phbagRope0000000", p: 8, s: 4, r: 7, cat: "Arreos" }
    ]
  },
  /* ---------------------------------------------------------------- */
  {
    id: "barberia", nombre: "Barbería y sacamuelas de Tibbald", patron: null,
    dueno: "Tibbald Crane", npc: [],
    lugar: "Bajo los soportales de la plaza",
    horario: [[8, 18]],
    compra: [],
    img: "icons/tools/cooking/knife-cleaver-steel-grey.webp", kw: ["razor", "scissors", "knife"],
    descripcion: "<p>Una silla alta, una palangana, un espejo de acero y una vitrina con frascos que nadie sabe para qué sirven. <b>Tibbald Crane</b> corta pelo, afeita, saca muelas y cose heridas pequeñas. Sobre todo, habla: es el mejor sitio del pueblo para enterarse de lo que pasa.</p><p><i>Lo que se dice en la silla de Tibbald, al día siguiente lo sabe la plaza.</i></p>",
    saludos: ["Tibbald afila la navaja en una tira de cuero: «Siéntate, siéntate. ¿Supiste lo de…?»", "«Abre la boca. Mmm. Esa muela tiene los días contados.»", "Tibbald baja la voz aunque no haya nadie: «Te lo cuento, pero no fui yo.»"],
    items: [
      { id: "ba-corte", n: "Corte de pelo", t: "loot", p: 1, serv: true, cat: "Arreglo", ic: "icons/tools/cooking/knife-cleaver-steel-grey.webp", kw: ["razor", "scissors"] },
      { id: "ba-afeitado", n: "Afeitado con navaja", t: "loot", p: 1, serv: true, cat: "Arreglo", ic: "icons/tools/cooking/knife-cleaver-steel-grey.webp", kw: ["razor"] },
      { id: "ba-completo", n: "Corte, afeitado y toalla caliente", t: "loot", p: 2, serv: true, cat: "Arreglo", ic: "icons/tools/cooking/knife-cleaver-steel-grey.webp", kw: ["razor"] },
      { id: "ba-muela", n: "Sacar una muela", t: "loot", p: 3, serv: true, cat: "Curas", ic: "icons/commodities/bones/tooth-white.webp", kw: ["tooth", "fang"], d: "<p>Duele. Después duele menos.</p>" },
      { id: "ba-coser", n: "Coser una herida pequeña", t: "loot", p: 5, serv: true, cat: "Curas", ic: "icons/sundries/survival/bandage-white.webp", kw: ["bandage"], d: "<p>Recuperas 1d4 PG. No sirve para una Herida No Tratada: para eso, Nessa.</p>" },
      { id: "ba-sangria", n: "Sangría \"para equilibrar los humores\"", t: "loot", p: 2, serv: true, cat: "Curas", ic: "icons/consumables/potions/bottle-round-corked-red.webp", kw: ["blood", "bottle"], d: "<p>Tibbald jura que funciona. Nessa jura que no.</p>" },
      { id: "ba-rumores", n: "Escuchar las novedades de la semana", t: "loot", p: 1, serv: true, cat: "Rumores", ic: "icons/sundries/scrolls/scroll-bound-brown-tan.webp", kw: ["scroll"], d: "<p>Mientras te afeita, Tibbald te cuenta un rumor (el DM elige uno, verdadero o no).</p>" },
      { id: "ba-tonico", n: "Tónico capilar de Tibbald", t: "consumable", ct: "potion", p: 4, s: 4, r: 14, cat: "Vitrina", ic: "icons/consumables/potions/bottle-round-corked-green.webp", kw: ["bottle", "potion"], d: "<p>Huele a menta y a vinagre. No hace nada, pero el pelo brilla.</p>" },
      { id: "ba-unguento", n: "Ungüento para ampollas", t: "consumable", ct: "potion", p: 3, s: 4, r: 14, cat: "Vitrina", ic: "icons/consumables/potions/bottle-round-corked-yellow.webp", kw: ["salve", "bottle"] },
      { id: "ba-navaja", n: "Navaja de afeitar", t: "loot", p: 5, s: 2, r: 21, cat: "Vitrina", ic: "icons/weapons/daggers/dagger-straight-thin-steel.webp", kw: ["dagger", "knife"], peso: 0.5 },
      { id: "ba-peine", n: "Peine de hueso", t: "loot", p: 1, s: 5, r: 14, cat: "Vitrina", ic: "icons/commodities/bones/bone-simple-white.webp", kw: ["bone", "comb"] },
      { id: "ba-jabon", n: "Jabón", t: "consumable", ct: "trinket", p: 1, s: 6, r: 7, cat: "Vitrina", ic: "icons/sundries/misc/soap-brick-white.webp", kw: ["soap"] },
      { id: "ba-espejo", n: "Espejo de acero", src: "phbagMirror00000", p: 50, s: 1, r: 30, cat: "Vitrina" }
    ]
  },
  /* ---------------------------------------------------------------- */
  {
    id: "ahumadero", nombre: "Ahumadero del río", patron: null,
    dueno: "Brida Tarn y su hijo Corrie", npc: [],
    lugar: "En la orilla, debajo del molino grande de Piet",
    horario: [[5, 12]],
    compra: ["loot"],
    img: "icons/consumables/meat/fish-whole-blue.webp", kw: ["fish"],
    descripcion: "<p>Una caseta de tablas negras de hollín, con el humo de aliso saliendo por todas las rendijas. <b>Brida Tarn</b>, viuda, ahúma truchas y anguilas desde antes del amanecer; su hijo <b>Corrie</b> revisa las nasas del río. Abre solo por la mañana: lo que no se vende se sala.</p><p><i>Compra tu pesca o tu caza y te la ahúma para el camino.</i></p>",
    saludos: ["Brida se seca las manos en el delantal, sin sonreír: «Fresco de esta mañana.»", "Corrie te mira con curiosidad: «¿Usted es la que pelea?»", "«El humo cura todo menos la pena», dice Brida, y te envuelve el pescado."],
    items: [
      { id: "ah-trucha", n: "Trucha fresca", t: "consumable", ct: "food", p: 1, s: 10, r: 1, cat: "Del río", ic: "icons/consumables/meat/fish-whole-blue.webp", kw: ["fish"], peso: 1 },
      { id: "ah-lucio", n: "Lucio ahumado", t: "consumable", ct: "food", p: 2, s: 6, r: 2, cat: "Ahumados", ic: "icons/consumables/meat/fish-whole-brown.webp", kw: ["fish"], peso: 1 },
      { id: "ah-anguila", n: "Anguila ahumada", t: "consumable", ct: "food", p: 3, s: 4, r: 3, cat: "Ahumados", ic: "icons/consumables/meat/fish-whole-brown.webp", kw: ["fish", "eel"], peso: 1 },
      { id: "ah-salmon", n: "Salmón del río alto", t: "consumable", ct: "food", p: 4, s: 2, r: 10, cat: "Ahumados", ic: "icons/consumables/meat/fish-whole-red.webp", kw: ["fish"], peso: 2, d: "<p>Lo traen los hermanos Wend cada diez días. Brida no dice de dónde sale ni quién lo pesca.</p>" },
      { id: "ah-raciones", n: "Raciones de pescado salado (un día)", src: "phbagRations0000", p: 4, s: 10, r: 3, cat: "Para el camino" },
      { id: "ah-caldo", n: "Caldo de pescado caliente", t: "loot", p: 1, serv: true, cat: "Para el camino", ic: "icons/consumables/food/bowl-stew-brown.webp", kw: ["bowl", "stew", "soup"] },
      { id: "ah-cebo", n: "Lombrices para cebo", t: "consumable", ct: "trinket", p: 1, s: 10, r: 2, cat: "Pesca", ic: "icons/commodities/biological/worm-pink.webp", kw: ["worm"] },
      { id: "ah-sedal", n: "Sedal y anzuelos", t: "tool", p: 10, s: 3, r: 14, cat: "Pesca", ic: "icons/tools/fishing/hook-barbed-steel.webp", kw: ["hook", "fishing"], peso: 4 },
      { id: "ah-red", n: "Red", src: "phbagNet00000000", p: 10, s: 2, r: 14, cat: "Pesca" },
      { id: "ah-ahumar", n: "Ahumar tu pesca o tu caza", t: "loot", p: 2, serv: true, cat: "Servicios", ic: "icons/magic/fire/flame-burning-campfire-orange.webp", kw: ["campfire", "fire"], d: "<p>Trae la pieza a la mañana y la tienes al mediodía: dura una semana sin pudrirse.</p>" },
      { id: "ah-enc-arenque", n: "Encargar: barril de arenques de la costa", t: "loot", p: 40, enc: 12, serv: true, cat: "Por encargo", ic: "icons/containers/barrels/barrel-open-brown-red.webp", kw: ["barrel"], d: "<p>Llega con la caravana de Oswin. Veinte días de comida salada para un grupo.</p>" }
    ]
  },
  /* ---------------------------------------------------------------- */
  {
    id: "escribania", nombre: "Escribanía de Alwen Marr", patron: null,
    dueno: "Alwen Marr", npc: [],
    lugar: "Una casita entre la capilla y la torre de Orlan",
    horario: [[9, 16]],
    compra: ["loot"],
    img: "icons/sundries/books/book-worn-brown-grey.webp", kw: ["book", "scroll", "quill"],
    descripcion: "<p>Papeles hasta el techo, olor a cola de pescado y a cera. <b>Alwen Marr</b>, el escriba del pueblo, escribe cartas para quien no sabe, lee documentos, copia mapas y vende los dos libros que escribió sobre el valle. También compra papeles viejos, mapas y libros: \"todo papel cuenta algo\".</p>",
    saludos: ["Alwen se sube las gafas: «¿Carta, copia o pregunta?»", "«No toques esa pila. Está ordenada, aunque no lo parezca.»", "Alwen sopla la tinta: «Esto lo sabía Orlan. Pero Orlan no lo cuenta. Yo sí, si pagas.»"],
    items: [
      { id: "eb-carta", n: "Escribir una carta (dictada)", t: "loot", p: 2, serv: true, cat: "Servicios", ic: "icons/sundries/documents/document-sealed-brown-red.webp", kw: ["letter", "document"] },
      { id: "eb-leer", n: "Leer un documento en voz alta", t: "loot", p: 1, serv: true, cat: "Servicios", ic: "icons/sundries/documents/document-symbol-eye.webp", kw: ["document"] },
      { id: "eb-copia", n: "Copiar un documento", t: "loot", p: 5, serv: true, cat: "Servicios", ic: "icons/sundries/documents/document-writing-pen-gray.webp", kw: ["document", "pen"] },
      { id: "eb-contrato", n: "Redactar y atestiguar un contrato", t: "loot", p: 5, serv: true, cat: "Servicios", ic: "icons/sundries/documents/document-sealed-brown-red.webp", kw: ["document", "seal"] },
      { id: "eb-traducir", n: "Intentar traducir un texto antiguo", t: "loot", p: 20, serv: true, cat: "Servicios", ic: "icons/sundries/scrolls/scroll-runed-brown-purple.webp", kw: ["scroll", "rune"], d: "<p>Alwen tarda 1d4 días y acierta a medias (el DM decide qué entiende). Con letra Ilvarn se pone nervioso.</p>" },
      { id: "eb-archivo", n: "Consultar el archivo de Alwen", t: "loot", p: 3, serv: true, cat: "Servicios", ic: "icons/sundries/books/book-stack.webp", kw: ["book"], d: "<p>Una pregunta sobre el pasado del valle (familias, fechas, el fuerte, los fundadores). El DM decide qué encuentra Alwen.</p>" },
      { id: "eb-libro1", n: "Libro: Sobre las tierras del Vado", src: "phbagBook0000000", p: 50, s: 1, r: 30, cat: "Libros", d: "<p>Volumen I de Alwen Marr. Diario de Foundry \"Sobre las tierras del valle\".</p>" },
      { id: "eb-libro2", n: "Libro: Fragmentos de la era antigua", src: "phbagBook0000000", p: 60, s: 1, r: 30, cat: "Libros", d: "<p>Volumen II de Alwen Marr. Diario de Foundry \"Fragmentos de la era Oscura\".</p>" },
      { id: "eb-mapa", n: "Copia del mapa del valle", src: "phbagMap00000000", p: 15, s: 2, r: 14, cat: "Mapas", d: "<p>El valle con el río, el vado, las granjas y las parcelas de tala. Lo que hay más allá del bosque está en blanco.</p>" },
      { id: "eb-pergamino", n: "Pergamino (hoja)", src: "phbagParchment00", p: 1, s: 20, r: 14, cat: "Escritura" },
      { id: "eb-papel", n: "Papel (hoja)", src: "phbagPaper000000", p: 3, s: 10, r: 21, cat: "Escritura" },
      { id: "eb-pluma", n: "Pluma", src: "phbagInkPen00000", p: 1, s: 6, r: 14, cat: "Escritura" },
      { id: "eb-tinta", n: "Tinta (frasco)", src: "phbagInk00000000", p: 110, s: 1, r: 30, cat: "Escritura" },
      { id: "eb-estuche", n: "Estuche para mapas", src: "phbagCaseMaporSc", p: 8, s: 2, r: 21, cat: "Escritura" },
      { id: "eb-lacre", n: "Lacre y sello", t: "loot", p: 3, s: 4, r: 21, cat: "Escritura", ic: "icons/sundries/documents/document-sealed-brown-red.webp", kw: ["seal", "wax"] }
    ]
  },
  /* ---------------------------------------------------------------- */
  {
    id: "cereria", nombre: "Cerería de Yselde", patron: null,
    dueno: "Yselde Morrow", npc: [],
    lugar: "Casita de colmenas al sur de la plaza",
    horario: [[7, 17]],
    compra: ["loot"],
    img: "icons/sundries/lights/candle-unlit-tan.webp", kw: ["candle", "honey"],
    descripcion: "<p>Doce colmenas de paja en el patio y un olor dulce que se pega a la ropa. <b>Yselde Morrow</b> hace las velas de la capilla, la miel de medio pueblo y un hidromiel que Garrick compra por barriles. Sus abejas están raras desde hace un año y medio: ella dice que \"escuchan algo\".</p>",
    saludos: ["Yselde sonríe con las manos llenas de cera: «Huele, huele. Esa es de tomillo.»", "«Cuidado con la colmena del rincón: está de mal humor desde el martes.»", "Yselde aparta una abeja de tu hombro sin miedo: «No te va a picar. Te está mirando.»"],
    items: [
      { id: "ce-vela", n: "Vela de sebo", src: "phbagCandle00000", p: 1, s: 30, r: 3, cat: "Luz" },
      { id: "ce-vela-cera", n: "Vela de cera de abeja", t: "consumable", ct: "trinket", p: 2, s: 20, r: 5, cat: "Luz", ic: "icons/sundries/lights/candle-lit-yellow.webp", kw: ["candle"], d: "<p>Dura el doble que una de sebo (2 horas) y no humea.</p>" },
      { id: "ce-vigilia", n: "Velas de vigilia (paquete de 10)", t: "consumable", ct: "trinket", p: 8, s: 4, r: 7, cat: "Luz", ic: "icons/sundries/lights/candle-unlit-tan.webp", kw: ["candle"] },
      { id: "ce-votiva", n: "Vela votiva para la capilla", t: "consumable", ct: "trinket", p: 1, s: 20, r: 3, cat: "Luz", ic: "icons/sundries/lights/candle-lit-yellow.webp", kw: ["candle"], d: "<p>Se enciende en la capilla por un viaje, un muerto o un deseo.</p>" },
      { id: "ce-antorcha", n: "Antorcha", src: "phbagTorch000000", p: 1, s: 10, r: 5, cat: "Luz" },
      { id: "ce-miel", n: "Tarro de miel", t: "consumable", ct: "food", p: 3, s: 8, r: 7, cat: "Colmena", ic: "icons/consumables/food/honey-jar-yellow.webp", kw: ["honey", "jar"], peso: 1 },
      { id: "ce-panal", n: "Panal", t: "consumable", ct: "food", p: 2, s: 6, r: 7, cat: "Colmena", ic: "icons/consumables/food/honeycomb-yellow.webp", kw: ["honey", "comb"] },
      { id: "ce-hidromiel", n: "Jarra de hidromiel", t: "consumable", ct: "food", p: 4, s: 6, r: 7, cat: "Colmena", ic: "icons/consumables/drinks/alcohol-jug-spirits-brown.webp", kw: ["jug", "mead"] },
      { id: "ce-propoleo", n: "Ungüento de propóleo", t: "consumable", ct: "potion", p: 5, s: 4, r: 14, cat: "Colmena", ic: "icons/consumables/potions/bottle-round-corked-yellow.webp", kw: ["salve", "bottle"], d: "<p>Se unta en un corte. Al terminar un Descanso Corto, recuperas 1 PG extra. Nessa lo aprueba.</p>" },
      { id: "ce-jabon", n: "Jabón de miel", t: "consumable", ct: "trinket", p: 2, s: 6, r: 7, cat: "Colmena", ic: "icons/sundries/misc/soap-brick-white.webp", kw: ["soap"] },
      { id: "ce-cera", n: "Bloque de cera", t: "loot", p: 2, s: 6, r: 7, cat: "Colmena", ic: "icons/commodities/materials/wax-yellow.webp", kw: ["wax"], peso: 1, d: "<p>Para sellar frascos, encerar una cuerda o tapar los oídos.</p>" }
    ]
  },
  /* ---------------------------------------------------------------- */
  {
    id: "huerta", nombre: "Huerta de los Cole", patron: null,
    dueno: "Duna Cole", npc: ["Duna"],
    lugar: "Granja de los Cole, en las terrazas del sur (y un puesto en la plaza los días de mercado)",
    horario: [[6, 14]],
    compra: [],
    img: "icons/consumables/vegetable/cabbage-green.webp", kw: ["cabbage", "apple", "egg"],
    descripcion: "<p>Lo que da la tierra buena del sur: huevos, leche, queso, hortalizas y fruta. <b>Duna Cole</b> lo vende todo con prisa y sin regatear, porque tiene veinte cosas más que hacer antes del mediodía.</p>",
    saludos: ["Duna cuenta con los dedos: «Huevos, queso, coles. ¿Algo más? Rápido.»", "«Lo del norte no lo vendo. Esa tierra no está bien este año.»", "Duna te pone una manzana de más en la bolsa: «Para el camino.»"],
    items: [
      { id: "hu-huevos", n: "Huevos (media docena)", t: "consumable", ct: "food", p: 1, s: 12, r: 1, cat: "Granja", ic: "icons/consumables/eggs/egg-white.webp", kw: ["egg"] },
      { id: "hu-leche", n: "Jarra de leche", t: "consumable", ct: "food", p: 1, s: 8, r: 1, cat: "Granja", ic: "icons/consumables/drinks/milk-jug-white.webp", kw: ["milk", "jug"] },
      { id: "hu-queso", n: "Queso de cabra", t: "consumable", ct: "food", p: 3, s: 6, r: 3, cat: "Granja", ic: "icons/consumables/food/cheese-wedge-yellow.webp", kw: ["cheese"], peso: 1 },
      { id: "hu-mantequilla", n: "Mantequilla", t: "consumable", ct: "food", p: 2, s: 6, r: 3, cat: "Granja", ic: "icons/consumables/food/butter-block-yellow.webp", kw: ["butter", "cheese"] },
      { id: "hu-gallina", n: "Gallina viva", t: "loot", p: 5, s: 4, r: 7, cat: "Granja", ic: "icons/creatures/birds/chicken-hen-white.webp", kw: ["chicken", "bird"], peso: 3 },
      { id: "hu-coles", n: "Coles y nabos (manojo)", t: "consumable", ct: "food", p: 1, s: 10, r: 2, cat: "Huerta", ic: "icons/consumables/vegetable/cabbage-green.webp", kw: ["cabbage", "turnip"] },
      { id: "hu-manzanas", n: "Bolsa de manzanas", t: "consumable", ct: "food", p: 1, s: 10, r: 3, cat: "Huerta", ic: "icons/consumables/fruit/apple-red.webp", kw: ["apple"], temp: "otono" },
      { id: "hu-fresas", n: "Cesta de fresas", t: "consumable", ct: "food", p: 2, s: 6, r: 2, cat: "Huerta", ic: "icons/consumables/fruit/strawberry-red.webp", kw: ["strawberry", "berry"], temp: "verano" },
      { id: "hu-calabaza", n: "Calabaza", t: "consumable", ct: "food", p: 2, s: 6, r: 5, cat: "Huerta", ic: "icons/consumables/vegetable/pumpkin-orange.webp", kw: ["pumpkin"], temp: "otono" },
      { id: "hu-grano", n: "Saco de grano", t: "loot", p: 5, s: 6, r: 7, cat: "Para la casa", ic: "icons/consumables/food/grain-wheat-yellow.webp", kw: ["grain", "wheat"], peso: 20 },
      { id: "hu-semillas", n: "Semillas de siembra", t: "loot", p: 2, s: 6, r: 14, cat: "Para la casa", ic: "icons/consumables/plants/seeds-brown.webp", kw: ["seed"] }
    ]
  },
  /* ---------------------------------------------------------------- */
  /* Mercado negro: oculto hasta que el DM lo revela. Cobra en Soul coins (sc). */
  {
    id: "cambista", nombre: "La barcaza del Cambista (mercado negro)", patron: null, oculta: true,
    dueno: "Silas Quorn, el Cambista", npc: ["Cambista"],
    lugar: "Una barcaza negra amarrada en el remanso tibio, bajo el campo norte. Solo de noche, y no todas las noches",
    horario: [[21, 4]],
    compra: ["loot", "weapon", "equipment"],
    img: "icons/containers/bags/coinpouch-leather-grey.webp", kw: ["coin", "pouch", "lantern"],
    descripcion: "<p>Una barcaza baja y negra, sin bandera, con un farol de vidrio azul que no da calor. Bajo el toldo hay cajas que no deberían existir en un pueblo de frontera. <b>Silas Quorn</b> no acepta cobre por lo que importa: pide <b>Soul coins</b>, y las sopesa en la mano como si escuchara algo.</p><p><i>Compra lo que traigas a la mitad de su precio, sin preguntar de dónde salió.</i></p>",
    saludos: ["Silas no levanta la vista del farol: «Llegas tarde. O temprano. Nunca sé con ustedes.»", "«Cobre, no. Eso que llevas en el bolsillo y que zumba… eso sí.»", "El Cambista hace girar una Soul coin entre los dedos: «¿La oyes? Yo sí. Por eso pago bien.»"],
    items: [
      // Para el que pelea con los puños
      { id: "cm-vendas", n: "Vendas del Último Aliento", t: "equipment", sc: 3, s: 1, r: 0, cat: "Para los puños", rar: "uncommon", sint: true, ic: "icons/equipment/hand/glove-simple-leather-green.webp", kw: ["glove", "wrap"],
        sys: { "type.value": "trinket" },
        efectos: [{ name: "Vendas del Último Aliento", changes: [{ key: "system.bonuses.mwak.attack", mode: 2, value: "+1" }, { key: "system.bonuses.mwak.damage", mode: 2, value: "+1" }] }],
        d: "<p>Tiras de cuero verde, duras como escama: cuero de dragón joven, de un contrato que alguien no cobró. Requiere sintonía. Mientras las llevas, <b>+1 a las tiradas de ataque y de daño de tus golpes sin armas</b> (y de cualquier ataque cuerpo a cuerpo con arma).</p>" },
      { id: "cm-nudilleras", n: "Nudilleras de cristal mudo", t: "equipment", sc: 4, s: 1, r: 0, cat: "Para los puños", rar: "rare", ic: "icons/equipment/hand/gauntlet-armored-steel-grey.webp", kw: ["gauntlet", "glove"],
        sys: { "type.value": "trinket" },
        d: "<p>Cuatro anillos de piedra negra unidos por una barra, tallados con una técnica que no es humana. Cuando aciertas un <b>golpe sin armas</b> a una criatura que se concentra en un conjuro de nivel 1 o menor, la concentración se rompe sin salvación. Una vez por Descanso Largo, al acertar, puedes apagar hasta el amanecer un objeto mágico menor que lleve el objetivo.</p><p><b>Precio:</b> mientras las llevas puestas, los conjuros de curación no te afectan. La piedra calla también lo bueno.</p>" },
      { id: "cm-faja", n: "Faja del campeón de foso", t: "equipment", sc: 3, s: 1, r: 0, cat: "Para los puños", rar: "uncommon", sint: true, ic: "icons/equipment/waist/belt-thick-gemmed-steel-grey.webp", kw: ["belt"],
        sys: { "type.value": "trinket" },
        d: "<p>Faja de cuero con tachuelas, ganada (dice él) en los fosos de apuestas de Castrum Ignis. Requiere sintonía. Una vez por turno, cuando aciertas un golpe sin armas a una criatura que te golpeó desde tu último turno, <b>+1d4 al daño</b>. Ventaja en las pruebas de Atletismo para agarrar o empujar.</p>" },
      { id: "cm-protector", n: "Protector de hueso de jabalí", t: "equipment", sc: 2, s: 1, r: 0, cat: "Para los puños", rar: "uncommon", ic: "icons/equipment/neck/collar-carved-bone-teeth-ring.webp", kw: ["tooth", "bone"],
        sys: { "type.value": "trinket" },
        d: "<p>Protector bucal tallado en colmillo. Ventaja en las salvaciones contra quedar <b>aturdido</b>. Una vez por Descanso Largo, cuando un golpe te dejaría a 0 PG, puedes usar tu reacción para reducir ese daño en 1d10 + tu modificador de Constitución.</p>" },
      { id: "cm-licor", n: "Licor de valor del foso", t: "consumable", ct: "potion", sc: 1, s: 3, r: 7, cat: "Para los puños", ic: "icons/consumables/potions/potion-flask-corked-orange.webp", kw: ["flask", "bottle"],
        d: "<p>Aguardiente con algo más. Un trago (acción adicional): recuperas <b>1 punto de Moxie</b> (u otro recurso de tu clase que vuelva con un Descanso Corto) y tienes ventaja en tu próxima prueba de Intimidación o Persuasión antes de 1 minuto. Un segundo trago el mismo día: salvación de CON CD 12 o envenenado 1 hora.</p>" },
      // Para el que trabaja en la sombra
      { id: "cm-guantes4", n: "Guantes de los cuatro brazos", t: "equipment", sc: 3, s: 1, r: 0, cat: "Para la sombra", rar: "uncommon", sint: true, ic: "icons/equipment/hand/glove-cuffed-leather-purple.webp", kw: ["glove"],
        sys: { "type.value": "trinket" },
        d: "<p>Dos pares de guantes cosidos para manos que no son humanas. Requiere sintonía. Si tienes brazos secundarios, mientras los llevas esos brazos pueden <b>usar herramientas de ladrón y hacer pruebas de Juego de manos</b>, y tienes ventaja en Juego de manos cuando usas los cuatro brazos a la vez.</p>" },
      { id: "cm-ganzuas", n: "Ganzúas de hueso de cambiante", t: "tool", src: "phbtulThievesToo", sc: 2, s: 1, r: 0, cat: "Para la sombra", rar: "uncommon",
        efectos: [{ name: "Ganzúas de hueso de cambiante", changes: [{ key: "system.tools.thief.bonuses.check", mode: 2, value: "+2" }] }],
        d: "<p>Ganzúas blancas que se doblan solas para encajar en la cerradura. <b>+2 a las pruebas con herramientas de ladrón</b> mientras las llevas.</p>" },
      { id: "cm-daga", n: "Daga de la calle del Vado", t: "weapon", src: "phbwepDagger0000", sc: 3, s: 1, r: 0, cat: "Para la sombra", rar: "uncommon",
        sys: { magicalBonus: 1, properties: ["fin", "lgt", "thr", "mgc"] },
        d: "<p><b>Daga +1.</b> La hoja tiene grabado un nudo de barquero. Quien la forjó no quería que se perdiera en el agua: si cae al río, flota.</p>" },
      { id: "cm-ceniza", n: "Ceniza dulce (sobre)", t: "consumable", ct: "poison", sc: 1, s: 4, r: 7, cat: "Para la sombra", ic: "icons/consumables/potions/vial-cork-green.webp", kw: ["vial", "poison"],
        d: "<p>Polvo gris que adormece. Acción: lánzalo a una criatura a 10 ft o menos. Salvación de CON CD 12 o queda <b>envenenada</b> 1 minuto; si falla por 5 o más, además se <b>duerme</b> (despierta si recibe daño o alguien usa una acción para sacudirla). <i>Es el mismo polvo que usan en la cantera.</i></p>" },
      { id: "cm-balas", n: "Balas de cristal mudo (5)", t: "consumable", ct: "ammo", sc: 2, s: 2, r: 14, cat: "Para la sombra", ic: "icons/containers/ammunition/bullets-belt.webp", kw: ["bullet"],
        d: "<p>Munición de pistola tallada en piedra negra. Un impacto rompe la concentración del objetivo en un conjuro de nivel 1 o menor y apaga la luz mágica que lleve encima.</p>" },
      { id: "cm-guantes", n: "Guantes del ladrón", src: "dmgGlovesOfThiev", sc: 2, s: 1, r: 0, cat: "Para la sombra" },
      { id: "cm-botas", n: "Botas élficas", src: "dmgBootsOfElvenk", sc: 3, s: 1, r: 0, cat: "Para la sombra" },
      { id: "cm-capa", n: "Capa élfica", src: "dmgCloakOfElvenk", sc: 4, s: 1, r: 0, cat: "Para la sombra" },
      { id: "cm-polvo", n: "Polvo de desaparición", src: "dmgDustOfDisappe", sc: 2, s: 1, r: 0, cat: "Para la sombra" },
      { id: "cm-gafas", n: "Gafas nocturnas", src: "dmgGogglesOfNigh", sc: 2, s: 1, r: 0, cat: "Para la sombra" },
      { id: "cm-cuerda", n: "Cuerda trepadora", src: "dmgRopeOfClimbin", sc: 2, s: 1, r: 0, cat: "Para la sombra" },
      // Lo que no se vende en ningún mercado
      { id: "cm-anillo-saltos", n: "Anillo de saltar", src: "dmgRingOfJumping", sc: 2, s: 1, r: 0, cat: "Rarezas" },
      { id: "cm-suerte", n: "Piedra de la suerte", src: "dmgStoneOfGoodLu", sc: 6, s: 1, r: 0, cat: "Rarezas" },
      { id: "cm-curacion", n: "Poción de curación mayor", src: "dmgGreaterPotion", sc: 1, s: 2, r: 14, cat: "Rarezas" },
      { id: "cm-heroismo", n: "Poción de heroísmo", src: "dmgPotionOfHeroi", sc: 2, s: 1, r: 14, cat: "Rarezas" },
      { id: "cm-invisibilidad", n: "Poción de invisibilidad", src: "dmgPotionOfInvis", sc: 3, s: 1, r: 0, cat: "Rarezas" },
      { id: "cm-llave", n: "Llave de bronce con espiral", t: "loot", sc: 4, s: 1, r: 0, cat: "Rarezas", ic: "icons/equipment/neck/amulet-carved-stone-spiral-blue.webp", kw: ["key"],
        d: "<p>Una llave pesada, verde de óxido, con una espiral en el ojo. Vibra cuando la acercas a agua tibia. El Cambista dice que abre «algo que está bajo el agua, cerca de aquí». No dice cómo la consiguió.</p>" },
      { id: "cm-salvoconducto", n: "Encargar: salvoconducto falso", t: "loot", sc: 2, s: 1, r: 14, enc: 5, cat: "Servicios", ic: "icons/containers/bags/case-scroll-leather-tan.webp", kw: ["scroll"],
        d: "<p>Un salvoconducto imperial con sello y firma creíbles, al nombre que digas. Pasa cualquier control del camino; no pasa a Zaraki si lo mira dos veces.</p>" },
      { id: "cm-secreto", n: "Un secreto del valle", t: "loot", sc: 1, serv: true, srv: "secreto", cat: "Servicios", ic: "icons/sundries/misc/lantern-iron-black.webp", kw: ["lantern"],
        d: "<p>Silas se inclina y te cuenta algo que no sabe nadie más en el pueblo. Nunca miente. Nunca dice cómo lo sabe.</p>" }
    ]
  }
];
