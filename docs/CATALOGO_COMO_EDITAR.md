# Cómo se edita el catálogo del Verbe (tarea 0.3)

## Qué es `data/verbe.txt`

Es el catálogo entero (técnicas, dotes, ramas, linajes, costes, reservas…) en JSON, comprimido con gzip, mezclado con XOR (`ecos-frontera`) y en base64. **No se edita a mano.** Se lee y se escribe solo con `tools/catalog.mjs`:

```js
import { readCatalog, writeCatalog, validateCatalog } from './catalog.mjs';
const D = readCatalog();          // objeto JS
// … cambios …
const errores = validateCatalog(D); if (errores.length) throw Error(errores.join('\n'));
writeCatalog(D);
```

`data/reliquias.txt` usa el mismo formato (`decodeCatalog` / `encodeCatalog`).

## La cadena `npm run catalog:expand`

El archivo es acumulativo: cada script lee el catálogo, **inserta o reemplaza por `id`** y lo vuelve a escribir. Por eso la cadena es idempotente y el flujo de Release la vuelve a correr y exige que `data/` y `docs/` no cambien (`git diff --exit-code`). Orden actual:

1. `expand-shinobi.mjs` · ramas Umbral y Vasija, tradiciones, hitos, herencias y 353 técnicas desde `tools/shinobi/*.mjs`.
2. `evolve-catalog.mjs` · tabla grado/nivel, sendas, dotes nuevas (`tools/shinobi/feats.mjs`), requisitos declarados.
3. `expand-divinity.mjs` · panteón, linajes divinos y sus técnicas (`tools/divinity-catalog.mjs`).
4. `expand-vida.mjs` · utilidades de vida cotidiana (`tools/nimerios/vida.mjs`).
5. `clarify-catalog.mjs` · textos corregidos y la ficha de lectura guiada de las 860 técnicas.
6. `build-relics.mjs` · `data/reliquias.txt`.
7. `originalizar.mjs` · nombres de Nimerios (identidad de campaña) sin cambiar ids.
8. `build-memoria.mjs` · memoria de campaña.

Las técnicas anteriores a 3.0 no tienen fuente fuera del propio catálogo: su única fuente es `data/verbe.txt`.

## Añadir técnicas

1. Escribe sus especificaciones en un módulo nuevo de datos (como `tools/nimerios/vida.mjs` o `tools/shinobi/*.mjs`). Cada técnica se construye con `construirShinobi(spec, D)` de `tools/build-shinobi.mjs`: `id`, `nombre`, `rama`, `g`, `tipo` (`attack`, `save`, `control`, `damage`, `heal`, `buff`, `summon`, `utility`, `ritual`), `t` (tiempo), `alcance`, `area` y `formaArea`, `salv`, `dano`, `estados`, `texto`, `previa`, `acceso`…
2. Crea `tools/expand-<tema>.mjs` que haga *upsert* por `id`, valide y escriba (copia el patrón de `expand-vida.mjs`).
3. Añádelo a `catalog:expand` en `package.json` **antes** de `clarify-catalog.mjs` (para que reciba la ficha de lectura) y de `originalizar.mjs`.
4. `npm run catalog:expand` dos veces: la segunda no debe cambiar nada.

## Modificar técnicas existentes

- **Solo texto:** añade su `id` al mapa `textos` de `clarify-catalog.mjs`.
- **Reglas (daño, plantilla, alcance, coste…):** un script de reparación idempotente que busque por `id` y fije el valor (patrón de `repair-catalog.mjs`), metido en la cadena. Fija valores, no sumes: así repetirlo no acumula.
- Mantén sincronizados `t.g`, `t.item.system.level` y `t.item.flags['ecos-frontera'].verbe.g` (el validador lo exige).

## Después de cualquier cambio de reglas

- `npm test`, `npm run check`, `npm run catalog:audit`.
- La huella de reglas (`tools/text-audit.mjs`) cambiará: revisa reglas y pruebas, y solo entonces pon en `tools/text-baseline.json` `versionActual` = versión nueva y `reglasActuales` = la huella nueva.
- Regenera los documentos que el flujo compara: `npm run docs:catalog`, `npm run balance`, `npm run ui:preview`, `npm run audit:text`, `npm run audit:balance`, y súbelos.

## Ediciones del DM desde Foundry

Las técnicas propias del DM y las ediciones sobre el catálogo base no tocan estos archivos: viven en el mundo (ajuste `capaVExtra` y la capa de ediciones de la tarea 1.4b), para que reinstalar el módulo no las borre.
