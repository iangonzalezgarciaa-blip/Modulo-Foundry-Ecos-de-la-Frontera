# Foundry 14 y dnd5e 6 (versión 3.10.0)

*Revisión del 3 de noviembre de 2026, hecha con el mundo «Fantasy and Agony» abierto en Foundry 14.370 y dnd5e 6.0.6, desde el usuario «Ian Navegador». Ecos se probó al cargar el mundo y con un personaje de prueba («Prueba Ecos v14», en la carpeta «Ecos · Pruebas v14 (borrar)»).*

## Qué cambió y cómo lo resuelve Ecos

### Foundry 14

| Cambio | Qué le pasaba a Ecos | En 3.10.0 |
|---|---|---|
| Ya no existen las plantillas medidas: ahora son regiones de la escena. | dnd5e 6 coloca las áreas como regiones y convierte metros y pies por su cuenta. El ajuste de unidades de Ecos (1.2) ya no hace falta, pero sigue sirviendo con dnd5e 5. | Sin cambios. |
| Los efectos activos usan `type` (texto) en vez de `mode` (número). Los cambios pasan a `system.changes`. | Foundry convierte los efectos viejos al crearlos. Dos sitios avisaban de que esa forma de escribirlos está obsoleta (secuelas y Malherido). | Esos sitios escriben el formato nuevo. |
| `CONST.DICE_ROLL_MODES` y el ajuste `core.rollMode` dan paso a `core.messageMode` («public», «gm», «blind», «self»). | Las tiradas ocultas de PNJ dejaron de funcionar, porque `core.rollMode` ahora devuelve vacío. La Moneda Antigua y las tablas privadas avisaban de obsolescencia. | Usan el modo de mensaje nuevo, y en Foundry 13 el viejo. |
| Borrar una clave con «-=» está obsoleto; en su lugar va `_del`. | Funcionaba, pero avisaba. | Doce sitios usan `_del` en Foundry 14. |
| El gancho `renderChatMessage` está obsoleto y se elimina en Foundry 15. | Ecos lo escuchaba además de `renderChatMessageHTML`. | Solo escucha `renderChatMessageHTML`. |
| `bringToFront` falla si la ventana todavía no terminó de dibujarse. | Abrir la Mesa Ecos daba un error en la consola. | La ventana se trae al frente cuando ya está dibujada. |
| Las colecciones de documentos no tienen `flatMap`. | El editor de técnicas del DM no abría. El fallo venía de antes de Foundry 14. | Corregido. El autor lo usó en su mundo para borrar Getsuga. |

### dnd5e 6

| Cambio | Qué le pasaba a Ecos | En 3.10.0 |
|---|---|---|
| Los mensajes del chat tienen tipo (`attack`, `check`, `save`, `damage`, `usage`…) y datos propios. Antes se usaban `flags.dnd5e.roll`, `flags.dnd5e.targets` y `flags.dnd5e.use.consumed`. | La tabla del d20 no se disparaba nunca. La Moneda Antigua no distinguía una salvación de muerte, así que la ofrecía dos veces. La magia que cura heridas no veía los objetivos de la tarjeta. Al chocar no se quitaban de la tarjeta los objetivos protegidos. | Ecos lee los dos formatos (`scripts/compat.js`). |
| `CONFIG.statusEffects` se rehace en `i18nInit` a partir de `CONFIG.DND5E.statusEffects`. | Los estados del Verbe (Empapado, Ardiendo, Canalizando…) desaparecían de la lista de estados. Los efectos se seguían creando, pero no se veían en el HUD del token. | Se registran en `CONFIG.DND5E.statusEffects`. |
| La velocidad pasa a `movement.speeds.walk` y la CA fija a `ac.override`. | Los efectos funcionan, porque dnd5e redirige las claves viejas. El taller de NPC escribía las claves viejas. | El taller escribe las nuevas con dnd5e 6. Además, Desequilibrado y Embarrado dan su desventaja nativa sin necesitar midi-qol. |
| Los ataques de dnd5e 6 tiran solos al usar la actividad. | Las técnicas de Cuerpo tiran. Antes de la tirada sale la ventana Normal / Ventaja / Desventaja de Ecos. | Probado: funciona. |

## Módulos del mundo

Revisados con el mundo abierto. Ninguno de los activos declara un máximo por debajo de Foundry 14.

### Desactivados

- **midi-qol 14.0.20:** declara soporte hasta dnd5e 5.9, así que con dnd5e 6 Foundry lo deja fuera. Ecos usa el flujo nativo de dnd5e.
  - **Probado en tu mundo:** el gasto de Verbe, el límite de técnicas por turno y la ventana de ventaja antes del ataque.
  - **Hecho para el flujo nativo, sin probar todavía en Foundry 14:** el choque cuando el ataque es una técnica, la pregunta antes de poner estados y la Moneda Antigua.

  **Lo que se pierde sin midi:**
  - La ventana de defensa ante un ataque con arma o conjuro (con una técnica sí sale).
  - La cuenta automática de reacciones.

  Cuando midi-qol publique soporte para dnd5e 6, vuelve a activarlo.
- **midi-item-showcase-community:** depende de midi-qol.

### Activos pero no verificados para Foundry 14 o dnd5e 6

Pueden funcionar, pero conviene vigilarlos:

| Módulo | Riesgo |
|---|---|
| adv-reminder 5.1.2 (verificado con dnd5e 5.2.5) | Daba un error en cada prueba de habilidad: llama a `dnd5e.dataModels.shared.MovementField.getTravelPaceMode`, que dnd5e 6 movió a `dnd5e.dataModels.actor.TravelField`. Desde 3.11, Ecos añade el alias al arrancar y el error desaparece (probado). El resto de sus recordatorios no se revisó: si una ventana de tirada falla, desactívalo primero. |
| dnd5e-content-manager 1.6.0 (dnd5e 5.3) | Compendios: bajo riesgo. |
| simple-weather 2.2.2 (Foundry 13) | Ecos traduce su tarjeta del clima. Si deja de salir el clima, revisa sus actualizaciones. |
| token-attacher, wall-height, image-hover, alchemist-import (Foundry 13), routinglib (Foundry 11) | Sin relación con Ecos. |

### Retirado por su autor

- **Levels 7.0.3:** sus funciones pasaron al núcleo de Foundry 14 como Scene Levels. Muestra la ventana «Levels - Migration».
  1. Sigue esa migración.
  2. Luego desactiva Levels.
  3. Revisa si Wall Height sigue haciendo falta.

### Sin versión para Foundry 14 en tu instalación

- **Seasons & Stars 0.26.0:** declara un máximo de Foundry 13. Sin él:
  - Ecos sigue llevando el día de campaña y avisa cada mañana;
  - no se ve el calendario de Arcegris en la pantalla.

  Revisa si hay versión nueva. Pasar el calendario al calendario propio de Foundry 14 queda pendiente, porque hay que probar la conversión de fechas con tu reloj del mundo.

## Prueba en vivo del 4 de noviembre (3.10.0, antes de publicar 3.11)

Hecha con el mundo abierto desde «Ian Navegador», sobre el personaje de prueba:

| Qué | Resultado |
|---|---|
| Mis técnicas: filtros por tipo | Las cuentas coinciden (7 en total: 2 de ataque, 1 de salvación, 1 de curación, 2 de apoyo, 1 cargada). Filtrar por Ataque deja solo esas dos. |
| Favoritas | La estrella sube la técnica arriba, aparece el filtro «★ Favoritas 1» y sigue marcada al cerrar y reabrir el panel. |
| Paso a paso | Muestra el bono de ataque o la CD con la característica, el daño o la curación de la ficha, el coste en Verbe y los estados que deja. |
| Estados del Verbe | Están en la lista de estados de Foundry (Empapado, Ardiendo, Canalizando, Desequilibrado y Embarrado, entre otros). |
| Tiradas de dnd5e 6 | Una prueba de Atletismo se lee como habilidad: en combate propone la tabla del d20 de habilidad y fuera de él, la de escena. |
| Tiradas ocultas | Una tirada con el modo «gm» llega susurrada a los DM. |
| adv-reminder | Sin el alias, error en cada prueba de habilidad; con el alias de 3.11, ninguno. |

Sin probar todavía: la música (necesita reproducir un video para todos) y colocar la región de una técnica de área.

## Pruebas

En Mesa Ecos → Diagnóstico hay tres casos nuevos: «compat310», «panel310» y «repetir310». En la carpeta «Ecos · Pruebas v14 (borrar)» está el personaje de prueba, una copia de Antonio despertada con siete técnicas. Puedes borrar la carpeta cuando termines.
