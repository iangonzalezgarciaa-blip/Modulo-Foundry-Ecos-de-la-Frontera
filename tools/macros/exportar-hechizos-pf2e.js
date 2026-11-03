// Macro para el mundo PF2e «Esperanza Oculta» (tarea 4.2a). La ejecuta el DM desde la barra de macros.
// Exporta los hechizos del compendio del sistema a un JSON que se descarga en tu equipo. No cambia nada del mundo.
(async () => {
  const pack = game.packs.get("pf2e.spells-srd") ?? game.packs.find(p => p.documentName === "Item" && p.metadata.packageName === "pf2e" && /spell/i.test(p.metadata.name));
  if (!pack) return ui.notifications.error("No encuentro el compendio de hechizos de PF2e (pf2e.spells-srd).");
  ui.notifications.info(`Leyendo ${pack.index.size} hechizos de ${pack.metadata.label}…`);
  const docs = await pack.getDocuments();
  const txt = h => String(h ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const filas = docs.map(d => {
    const s = d.system ?? {};
    return {
      id: d.id, uuid: d.uuid, nombre: d.name, rango: s.level?.value ?? null, truco: (s.traits?.value ?? []).includes("cantrip"),
      tradiciones: s.traits?.traditions ?? [], rasgos: s.traits?.value ?? [], rareza: s.traits?.rarity ?? "common",
      acciones: s.time?.value ?? null, alcance: s.range?.value ?? null, area: s.area ?? null, objetivo: s.target?.value ?? null,
      salvacion: s.defense?.save?.statistic ?? null, basica: !!s.defense?.save?.basic, defensa: s.defense?.passive?.statistic ?? null,
      duracion: s.duration?.value ?? null, sostenido: !!s.duration?.sustained, dano: s.damage ?? null, intensificar: s.heightening ?? null,
      fuente: s.publication?.title ?? s.source?.value ?? null, licencia: s.publication?.license ?? null, remaster: !!s.publication?.remaster,
      texto: txt(s.description?.value)
    };
  });
  const blob = JSON.stringify({ version: 1, sistema: game.system.version, total: filas.length, hechizos: filas }, null, 1);
  saveDataToFile(blob, "application/json", "hechizos-pf2e.json");
  ui.notifications.info(`Listo: ${filas.length} hechizos en hechizos-pf2e.json. Mándame ese archivo.`);
})();
