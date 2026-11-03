# Conversión de hechizos de PF2e a dnd5e (3.8, tareas 4.2a–e)

Estado: reglas escritas (4.2c) y macro de exportación lista (4.2a). **Falta que el autor ejecute la macro** en «Esperanza Oculta» y entregue `hechizos-pf2e.json`: sin ese archivo no se pueden hacer el filtro (4.2b), los lotes (4.2d) ni la biblioteca (4.2e).

## 4.2a · Exportar

`tools/macros/exportar-hechizos-pf2e.js`: pégala como macro de script en el mundo PF2e y ejecútala como DM. Lee el compendio `pf2e.spells-srd` y descarga `hechizos-pf2e.json` (nombre, rango, tradiciones, rasgos, rareza, acciones, alcance, área, objetivo, salvación, duración, daño, intensificación, fuente, licencia y texto). No cambia nada del mundo.

## 4.2c · Reglas

| PF2e | dnd5e |
|---|---|
| 1 acción | Acción adicional |
| 2 acciones | Acción |
| 3 acciones | Acción (y el DM puede pedir Concentración si es sostenido) |
| Reacción | Reacción (con el disparador del texto) |
| 1 minuto o más | El mismo tiempo (ritual si lo es) |
| Rango 1–10 | Nivel = mitad del rango hacia arriba (1–2 → 1, 3–4 → 2, 5–6 → 3, 7–8 → 4, 9 → 5, 10 → 6). Truco → nivel 0 |
| Intensificado (+1) / (+2) | A niveles superiores: el mismo aumento cada nivel de espacio equivalente |
| Salvación básica | Mitad del daño si salva |
| Fortaleza / Reflejos / Voluntad | CON / DES / SAB |
| CA (ataque de conjuro) | Ataque de conjuro |
| Cuatro grados de éxito | Fallo crítico = efecto de fallo con un estado extra solo si el texto lo pide; se resuelve como éxito/fallo de dnd5e |
| Estados con valor (asustado 2, debilitado 1) | El estado de dnd5e equivalente, con su duración; el valor se vuelve desventaja o −2 según el texto |
| Rasgo de daño (fuego, frío, electricidad, sónico, vitalidad, vacío, espíritu) | fuego, frío, relámpago, trueno, radiante, necrótico, fuerza |
| Rareza (común, poco común, raro, único) | Se tratan igual (D11); solo cambia el coste para aprenderlo: común 1×, poco común 1,5×, raro 2×, único 3× |

Redundancia (4.2b): se descarta un hechizo si ya existe en `dnd5e.spells`, `dnd5e.spells24`, Chris's Premades o MISC con el mismo nombre en inglés o el mismo efecto principal (por ejemplo Bola de fuego).

Destino (4.2d): compendio del mundo `world.ecos-conjuros-pf2e`, por lotes de unos 10, registrados en `docs/CONVERSION_PF2E_LOTES.md`.

## Licencia (a confirmar antes de subir texto convertido)

Por lo que se encuentra en la web, el material Remaster de Paizo (Player Core, GM Core…) se publica bajo la licencia ORC y el anterior al Remaster bajo la OGL; el campo `licencia` de la exportación lo dice hechizo por hechizo. El repositorio es privado, pero aun así conviene quedarse con lo que diga ese campo y citar la fuente en cada hechizo convertido. Fuentes: [Wargamer · core rulebooks remaster ORC](https://www.wargamer.com/pathfinder/core-rulebooks-remaster-orc), [Paizo · foro sobre el Remaster](https://paizo.com/threads/rzs8dx1e).
