# Ecos de la frontera (v3.14.0)

**Ecos de la frontera** es un módulo para **Foundry VTT** que añade a tus partidas de **Dungeons & Dragons 5e** y **Pathfinder 2 ed** las reglas de la casa de la campaña del mismo nombre. Está en español.

No hace falta saber programar para usarlo. Se instala desde Foundry, como cualquier otro módulo, y se actualiza solo.

## Qué trae

- **Supervivencia con peso.** Morir de verdad cuesta, pero recuperarse también: santuarios, descansos que no lo curan todo, heridas que hay que tratar y secuelas.
- **El Verbe.** Un sistema de poderes propio con más de 900 técnicas, dotes, ramas, naturalezas (fuego, agua, viento, tierra, rayo) y linajes. Cada jugador lo maneja desde un panel con filtros, favoritas y un «así se resuelve, paso a paso» con los números de su ficha.
- **Lo que cualquiera puede intentar.** Todas las hojas traen Golpe sin armas y acciones para las seis características:
  - Fuerza: Presa, Empujón.
  - Destreza: Zancadilla, Desarmar, Esquivar, Esconderse, Interponerse.
  - Constitución: Aguantar, Sacudirse.
  - Inteligencia: Evaluar al enemigo, Planear.
  - Sabiduría: Buscar, Leer al rival.
  - Carisma: Fintar, Intimidar, Distraer, Arengar.

  Las dificultades salen de tus propias estadísticas.
- **El 20 y el 1.** El 20 natural sigue siendo el crítico de D&D, y además el 20 y el 1 traen consecuencias con sabor en ataques, salvaciones y pruebas, para todos por igual.
- **Combate táctico.** Diez reglas que premian el engaño, el plan, rodear al enemigo y conocerlo: Desprevenido, Rodear, Plan maestro, moral de los PNJ, secuaces, técnicas combinadas, Interponerse, terreno que se usa y Evaluar que te dice lo que ganaste. Valen para todos, con bandos para peleas de tres o más grupos, y el Director las enciende o apaga en la Mesa.
- **Trabajo y economía.** Oficios por horas, encargos, prestigio, un mercadillo con tiendas y la Moneda Antigua (que también se cambia por Trazos o en el mercader extraño).
- **Mesa Ecos.** Herramientas del Director de Juego en una sola ventana: estado del grupo, tablas, taller de PNJ, diagnóstico y música de YouTube sincronizada para todos.
- **Diarios.** Guías para los jugadores y compendios para el Director, que el módulo crea y mantiene al día. Lo que es secreto solo lo ve el Director.

## Qué necesitas

| | |
|---|---|
| Foundry VTT | versión 13 o 14 |
| Sistema | D&D 5e (dnd5e) 5.2.5 o más nuevo, probado con 6.0.6 |
| Recomendados, no obligatorios | Item Piles y su complemento para D&D 5e (para las tiendas), Sequencer y JB2A (efectos visuales), Dice So Nice (dados 3D) |

## Instalar

1. Abre Foundry y, en la pantalla de inicio, entra en **Módulos complementarios → Instalar módulo**.
2. Abajo, en **URL del manifiesto**, pega esta dirección y pulsa **Instalar**:

   ```
   https://github.com/iangonzalezgarciaa-blip/Modulo-Foundry-Ecos-de-la-Frontera/releases/latest/download/module.json
   ```

3. Entra en tu mundo como Director de Juego. Ve a **Configuración → Gestionar módulos**, activa **Ecos de la frontera** y guarda.
4. Recarga la página. La primera vez, el módulo prepara el mundo: crea sus diarios y pone las acciones en las hojas.

**Para actualizar:** en la pantalla de inicio, **Módulos complementarios → Buscar actualizaciones**. Foundry avisa cuando hay una versión nueva.

**Si prefieres descargarlo a mano:** cada versión está en [Releases](https://github.com/iangonzalezgarciaa-blip/Modulo-Foundry-Ecos-de-la-Frontera/releases). El archivo `ecos-frontera-X.Y.Z.zip` es el módulo completo; se descomprime en la carpeta `Data/modules` de Foundry.

## Primeros pasos

- **Mesa Ecos:** pulsa **Ctrl + M**, o el botón Ecos en la ficha, o búscala en Ajustes del módulo. Ahí está casi todo.
- **Cada hoja enciende lo suyo:** con el botón **Ecos** arriba de cada ficha eliges qué reglas usa ese personaje (supervivencia, descansos, Verbe). Una hoja nueva nace con todo apagado, salvo las acciones de cualquiera.
- **El Verbe:** el Director lo despierta en la ficha de cada personaje y elige su linaje. Desde ahí el jugador tiene su panel.
- **Reglas para todos:** en el diario «Reglas de la casa» están, en lenguaje de mesa, todas las reglas nuevas, incluidas «12 · Lo que cualquiera puede intentar» y «13 · El 20 y el 1».
- **Ajustes:** cada regla grande se puede apagar en **Configuración → Ajustes del módulo → Ecos de la frontera**.

## Qué descargas y qué no hace

- El módulo son archivos de código, estilos, iconos y datos. No instala programas ni pide contraseñas.
- No envía nada de tu mundo a ningún sitio. La única conexión externa es el reproductor de YouTube, y solo cuando el Director pone música.
- Los catálogos (técnicas, reliquias, contenido de la campaña) van empaquetados para que los jugadores no lean secretos por accidente. No es un candado: el repositorio es público.

## Para saber más

- [Manual completo](docs/MANUAL.md): todas las reglas, ajustes, macros y datos, con detalle.
- [Historial de cambios](CHANGELOG.md): qué trae cada versión.
- [Compatibilidad con Foundry 14 y dnd5e 6](docs/COMPATIBILIDAD_14.md), con el estado de otros módulos.
- ¿Algo no funciona? Abre un aviso en [Issues](https://github.com/iangonzalezgarciaa-blip/Modulo-Foundry-Ecos-de-la-Frontera/issues) y cuenta qué hiciste y qué viste. En Mesa Ecos → Diagnóstico hay pruebas guiadas que ayudan a encontrarlo.
