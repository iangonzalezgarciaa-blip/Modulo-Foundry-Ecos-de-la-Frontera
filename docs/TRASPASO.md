# Traspaso · cómo seguir sin Claude (13-nov-2026, versión 3.80.0)

Guía para Ian y para cualquier IA que le ayude. Úsala como contexto: pégale este archivo al empezar.

## Estado
- Última versión publicada: **3.80.0** (Release en GitHub con ZIP y module.json). Prueba en el mundo (3.79): 450/450 técnicas con requisito, estilos de combate bien, mesa 12/13 (el fallo era de la prueba).
- Falta comprobar en Foundry: reliquias con efecto (icono nuevo) y la mesa con la prueba corta (archivos `autoprueba-req-ids.json` y `autoprueba-mesa.mjs` en `Data/ecos-tmp/`, botón 3).

## Reglas del proyecto (no romper)
- Todo en español. La regla madre es D&D 5e; solo crafting, venenos y pociones son importados.
- Toda automatización lleva cerca un botón **Deshacer** y otro **A mano**, y avisa en el chat qué hizo.
- Nunca nombrar la serie de origen en nombres visibles; los secretos de campaña van en diarios del mundo, no en el repo (es público).
- Lo oculto se muestra como «no tienes manera de saber». El DM siempre elige el linaje.
- Nada de contenido de Paizo/PF2e en el repo. PF2e está en pausa.
- Nunca guardar contraseñas ni tokens en el módulo, URLs o configuración.
- Preguntar antes de cambiar una regla.

## Flujo para publicar una versión
1. Editar en `scripts/` (lógica), `tools/` (generadores del catálogo), `tests/` (pruebas con `node --test`).
2. Si tocas `tools/` que generan datos: `npm run catalog:expand`. Si cambian los datos de reglas, `npm run audit:text` fallará: revisa y actualiza `reglasActuales` en `tools/text-baseline.json` con la huella nueva (`huellaReglas` de `tools/text-audit.mjs`).
3. Subir versión: `module.json` (version, download con la nueva etiqueta), `package.json`, `CHANGELOG.md` arriba, y `versionActual` en `tools/text-baseline.json`.
4. Generar todo **antes** de confirmar: `npm run docs:catalog && npm run balance && npm run ui:preview && npm run audit:text && npm run audit:balance`.
5. `git rm releases/<zip viejo>` (solo queda el ZIP actual), `npm run package`, `npm test` (debe dar 0 fallos), `npm run check`.
6. Confirmar y empujar a `main`. GitHub Actions publica la Release. Si «Publicar Release» no corre o falla tras arreglar, lanzarlo a mano en Actions (workflow `release.yml`).
7. En Foundry: actualizar el módulo, cerrar y abrir el mundo, probar.

## Cola pendiente (orden sugerido)
1. Auditar duraciones de estados en combate (algunos no se quitan al pasar los turnos).
2. Auditar que ninguna mecánica nuestra anule rasgos de clase; si choca, que la nuestra se sume.
3. Sorprendido: botón en el HUD de cada token para poner/quitar (ya existe en la barra del DM, `scripts/sorpresa.js`).
4. Reglas en español para consulta en «Reglas de la casa»: el índice (página 0) solo lista 1–9; añadir derroche/Control, estilos, resolución automática, crafting/alquimia.
5. Traducir lo que queda en inglés (Pugilista de Claudia, habilidades de Odonata, compendios). Texto de terceros: nombre + resumen propio, no traducción completa.
6. Recetas y gestor de proyectos de crafting del Verbe.
7. Gestor de mapas y muros, animaciones, estilos de ficha (definir alcance antes).
8. **Despertar · nivel (pedido 13-nov):** al despertar, cuando pregunta el nivel/etapa, ofrecer calcularlo **por CR si es un PNJ** o **por nivel si es un jugador** (el diálogo está en `dialogoDespertar` de `scripts/verbe.js`; para PNJ hay escala de CR en `scripts/subir-pnj.js`).
9. **Naturaleza de elemento como requisito (pedido 13-nov):** las dotes y técnicas de un elemento piden tener desbloqueada al menos la **primera naturaleza de ese elemento**. Si el DM la dio desde el inicio (al despertar), cuenta como desbloqueada. Revisar requisitos en el catálogo (`tools/ajustes-*.mjs` → `npm run catalog:expand`) y la comprobación de requisitos en `scripts/verbe.js`; añadir prueba en `tests/`.
10. Automatizar proyectos para cuando no haya IA; traducir/animar técnicas importadas de D&D/PF2e (evaluar tamaño).

## Proyecto cerrado
Cerrado el 13-nov-2026 hasta nueva apertura. Al volver: «retoma desde TRASPASO.md».

## Dónde está cada cosa
- Verbe (técnicas, dotes, panel): `scripts/verbe.js`, `verbe-entreno.js` (derroche y ejercicio de control), `verbe-reading.js`.
- Resolución automática y Deshacer: `resolucion-auto.js`, `defensa-pedida.js`, `deshacer.js`.
- Confirmar estados y ventaja: `mesa-control.js`. Estilos de combate: `estilos-auto.js`.
- Reliquias: `relics.js`, `reliquias-almacen.js`; datos cifrados en `data/reliquias.txt` (se generan con `tools/build-relics.mjs`).
- Menú de acciones y tarjetas: `accion-estandar.js`, `panel-acciones.js`. Cola de pedidos: `docs/COLA_PEDIDOS.md`.
