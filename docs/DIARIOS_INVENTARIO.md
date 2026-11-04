# Diarios del mundo: inventario y permisos (tarea 4.5)

*Revisión del 4 de noviembre de 2026 en el mundo del autor, abierto en Foundry 14.370 con Ecos 3.10.0, desde un usuario DM. Se leyeron los 56 diarios con sus permisos por jugador y por página. En el mundo hay cuatro jugadores; aquí no se nombran.*

## Qué ven los jugadores

Diez diarios son visibles para al menos un jugador:

| Diario | Carpeta | Quién lo ve | Páginas |
|---|---|---|---|
| Reglas de la casa | Reglas de campaña | Todos (observador) | 12, de ellas 2 ocultas |
| El año en Arcegris | Reglas de campaña | Todos | 1 |
| Crónica de los jugadores | Crónica y cuadernos | Todos | 3 |
| Cuaderno de Claudia | Crónica y cuadernos | Solo su jugador | 1 |
| La historia de Claudia | Crónica y cuadernos | Solo su jugador | 1 |
| Cuaderno de Odonata | Crónica y cuadernos | Solo su jugador | 1 |
| Sobre las tierras del Vado | Libros encontrados | Todos | 1 |
| Fragmentos de la era antigua | Libros encontrados | Todos | 1 |
| CPR - Descriptions | Módulos (no tocar) | Todos | 201 |
| sequencerDatabase | (raíz) | Todos (dueño) | 0 |

Las dos páginas ocultas de «Reglas de la casa» son las guías del Verbe:

- «10 · El Verbe · guía revisada» es la que mantiene el módulo.
- «10 · El Verbe» es una copia antigua (sin revisión).

Las dos solo las ven el DM y los dueños de un personaje despertado. Hoy ningún jugador cumple eso.

**Búsqueda de fugas.** Se revisaron todas las páginas visibles para jugadores, salvo CPR y sequencerDatabase, que son datos de módulos. Ninguna:

- nombra a los dioses del panteón ni el lore secreto;
- enlaza a un diario del DM;
- dice «solo DM».

## Lo que solo ve el DM

46 diarios, todos sin permiso para jugadores:

| Carpeta | Diarios |
|---|---|
| Mundo de Nimerios [DM] | 11 (Mundo 0 a Mundo 10) |
| Biblioteca de Nimerios [DM] | 26 libros del mundo, con su índice |
| Mesa, tramas y personajes [DM] | 6 (Mesa de hoy, Guía del DM, Tramas y secretos, Personajes, Plantillas de combate, Cartas y documentos) |
| Sin carpeta, creados por Ecos | 3 (Archivo de reliquias, Panteón y sangre divina, Cuaderno privado de sesión) |

## Qué faltaba, por tipo

| Tipo | Jugadores, antes de 3.11 | DM, antes de 3.11 | En 3.11 |
|---|---|---|---|
| **Ramas** (13) | La guía describe 10. Faltan Sangre, Umbral y Vasija. | Mundo 10 explica las de linaje. | «11 · Compendio del Verbe» trae las 13. |
| **Naturalezas** (5 y sus combinaciones) | La guía explica las cinco, pero no la tabla de combinaciones. | Mundo 10 · 0, con la naturaleza secreta. | El compendio trae las combinaciones; el del DM explica la naturaleza secreta. |
| **Dotes** (222) | Un resumen en la guía; la lista completa solo está en el panel. | Nada aparte. | El compendio trae las 222, por categoría y con lo que piden. El del DM separa las 8 que concede el DM. |
| **Reliquias** (78) | Ninguna lista, a propósito: cada reliquia se explica en su propia ficha cuando aparece. Una lista adelantaría hallazgos. | «Ecos · Archivo de reliquias (solo DM)», completo. | Sin cambios. |
| **Herencias, Miradas, pactos, tradiciones, bestias, artefactos** | Nada, a propósito: se descubren jugando. | Mundo 10 · 0 y 1 (herencias, actualizadas en 4.4). Faltaban Miradas con su origen, pactos, escuelas y lo que abre cada tradición, hito, bestia y artefacto. | «Ecos · Compendio del Verbe (solo DM)» lo trae todo, con cuántas técnicas abre cada cosa y el recuento por rama y grado. |

## Cómo lo resuelve 3.11 (4.5b, 4.5c y 4.5d)

El módulo crea dos documentos nuevos al cargar el mundo, y los pone al día mientras nadie los edite (como la guía):

1. **«11 · Compendio del Verbe»**, en «Reglas de la casa», para jugadores. Trae ramas, rangos, naturalezas y combinaciones, y todas las dotes. No incluye nada que el panel no enseñe ya a quien despertó. Una prueba comprueba que no nombra dioses, linajes, Miradas con su origen, tradiciones, bestias ni artefactos.
2. **«Ecos · Compendio del Verbe (solo DM)»**, un diario aparte. Trae Miradas, pactos, escuelas, lo que concede el DM, las dotes que pide el DM y el recuento de técnicas.

**Permisos (4.5d):**

- El compendio de jugadores sigue la regla de la guía: lo ven el DM y los dueños de un personaje despertado. Se actualiza solo cuando alguien despierta.
- El diario del DM queda sin permiso para ningún jugador. Si alguien se lo da, Ecos lo vuelve a cerrar al cargar.
- El conector de Foundry no puede cambiar permisos. Por eso los pone el código del módulo, que corre como DM.

Generador: `scripts/verbe-compendio.js`, con pruebas en `tests/compendio.test.mjs`.

## Para que decida el autor

- **Borrar «10 · El Verbe»**, la copia antigua y oculta de la guía. La que vale es «10 · El Verbe · guía revisada».
- **CPR - Descriptions** (201 páginas visibles para todos) viene de Chris Premades, que está desactivado. Se puede borrar o cerrar a los jugadores.
- **Nombres:** los diarios de lore llaman Gracefeel a la Llama Serena y Cazador Sin Rostro al cazador. El panel y la nota del panteón usan Lethria y Namar Sin Rostro. Conviene elegir uno.
