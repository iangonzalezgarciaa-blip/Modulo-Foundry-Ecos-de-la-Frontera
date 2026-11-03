# Compatibilidad con PF2e: inventario de acoplamiento (tarea 5.2a)

*Hecho el 3-nov-2026 sobre la versión 3.9.0. Los conteos salen de búsquedas en `scripts/*.js` y del catálogo decodificado. Sirve de base para el diseño del adaptador (5.2b), que necesita la aprobación del autor antes de seguir.*

## Resumen

Hoy el módulo solo arranca con dnd5e: `module.json` declara el sistema `dnd5e` (mínimo 5.2.5). Son 18 455 líneas en 40 archivos.

**Lo que ya no depende del sistema**

- **El catálogo del Verbe** (912 técnicas, 222 dotes, 78 reliquias). Guarda técnicas en abstracto: coste, rama, grado, dados, tipo de actividad, alcance. Solo se vuelven objetos de dnd5e al crear la ficha (`datosItem`, en `verbe.js`).
- **La reserva de Verbe**, que vive en `flags.ecos-frontera`.
- **Las reglas puras:** etapas, reserva por dados, lectura, canalizar, clones, choque, progresión, shinobi y divinidad.
- **La Mesa Ecos** (interfaz, memoria de Nimerios, música), el calendario y el azar.
- En total, 19 archivos (1 270 líneas) no tocan ni dnd5e ni midi-qol.

**Lo que está atado a dnd5e** se reparte en ocho áreas, sobre todo dentro de los dos archivos grandes:

| Archivo | Líneas con código | Tocan dnd5e o midi-qol |
|---|---|---|
| `main.js` | 9 513 | 316 |
| `verbe.js` | 4 592 | 212 |

Son pocas líneas, pero están repartidas por casi todas las funciones de combate, descanso y curación.

**Estimación total.** Entre 18 y 26 sesiones cortas:

- refactor del lado dnd5e (5.2c): 6 a 8;
- adaptador PF2e (5.2d): 9 a 14;
- prueba en «Esperanza Oculta» (5.2e): 3 a 4.

Varias reglas de la casa no tienen equivalente directo en PF2e. Antes del código hacen falta decisiones del autor; están al final.

## Las ocho áreas

### 1. Datos de la ficha (`system.*`)

| Campo de dnd5e | Usos | Para qué | En PF2e |
|---|---|---|---|
| `system.attributes.hp` | 88 | Daño, curación, heridas, umbrales, clones con 1 PG | `system.attributes.hp` existe, con otra estructura (temp, sp). Se adapta. |
| `system.attributes.exhaustion` | 34 | Agotamiento de la casa, deuda de Verbe | No existe: hay estados con valor (Fatigado, Drenado, Condenado). **Decisión.** |
| `system.attributes.death` | 11 | Salvaciones de muerte, Malherido | PF2e usa Moribundo y Herido. **Decisión.** |
| `system.attributes.hd` y `hd.spent` | 11 | Dados de Golpe, «Gastar hasta el tope», curación | No existen. **Decisión.** |
| `system.attributes.movement` | 15 | Canalizando (velocidad 0), formas | `system.attributes.speed`, con otras claves. |
| `system.attributes.ac` | 12 | CA de efectos y defensas | `system.attributes.ac`, que se calcula distinto. |
| `system.currency.soul` | 10 | Moneda Antigua (denominación propia) | Las monedas son objetos de tesoro. Lo más parecido son los Puntos de Héroe. **Decisión.** |
| `system.skills.cvb` | 8 | Habilidad Control del Verbe | Las habilidades propias de PF2e son «Lore». Se puede usar un Lore o un modificador propio. |
| `system.traits.dr/dv/di/ci` | 11 | Resistencias e inmunidades de técnicas y formas | `system.attributes.resistances/weaknesses/immunities`, con otro formato. |
| `system.bonuses.mwak` | 8 | Bonos de ataque cuerpo a cuerpo | En PF2e van como reglas de objeto (FlatModifier). |
| `system.details.cr`, `biography` | 9 | Taller de NPC y diarios | `system.details.level`, `publication`… |

El catálogo trae 117 cambios de efecto activo sobre campos de dnd5e:

- `attributes.ac`: 48
- `movement`: 27
- `bonuses.mwak`: 25
- `traits.dr`: 16
- `traits.dv`: 1

En PF2e no se aplican tal cual: hay que traducirlos a reglas de objeto (`system.rules`).

### 2. Tiradas

- **Tiradas que se piden:**
  - `rollSkill`: 7
  - `rollSavingThrow`: 7
  - `rollAbilityCheck`: 2
  - `rollToolCheck`: 1
  - `rollDeathSave`: 2
  - `rollHitDie`: 2
  - `applyDamage`: 2
- **Hooks que se escuchan:**
  - `dnd5e.preRollV2`
  - `preRollAttackV2`
  - `preRollDamageV2`
  - `preRollSavingThrowV2`
  - `postRollAttack`
  - `rollDeathSave`
  - `preRollHitDieV2` y `rollHitDieV2`
  - `preApplyDamage`
- **PF2e:**
  - Las tiradas se piden con `actor.skills[x].roll()`, `actor.saves[x].roll()` y el contexto de `Check`.
  - El grado de éxito tiene cuatro niveles (crítico, éxito, fallo, fallo crítico), no dos.
  - Las tablas del d20 de la casa tienen que leer ese grado.

### 3. Actividades (dnd5e 4 y 5)

Cada técnica se vuelve un objeto «feat» con una actividad:

| Tipo de actividad | Técnicas |
|---|---|
| utilidad | 509 |
| salvación | 286 |
| ataque | 100 |
| curación | 15 |
| daño | 2 |

**Hooks:** `dnd5e.postUseActivity` (5), `activityConsumption` (2) y `preCreateActivityTemplate` (1).

**Archivos:**

- `datosItem` y el gasto de Verbe, en `verbe.js`;
- `relics.js`;
- `verbe-effects.js`;
- `verbe-iconos.js`;
- `verbe-plantillas.js`.

**En PF2e.** No hay actividades. Una técnica sería:

- una acción (`action`) con rasgos y coste en acciones (1, 2, 3, reacción, libre);
- o un hechizo de «foco» con su tirada de ataque de hechizo o su salvación básica.

Es la pieza más grande del adaptador.

### 4. Descansos

**Lo que se usa:**

- `shortRest` y `longRest` (2 cada uno);
- los hooks `preShortRest`, `preLongRest`, `restCompleted` (4) y `preRestCompleted`;
- `renderShortRestDialog` y `renderLongRestDialog`;
- la regla 3.5 («el descanso corto solo gasta Dados de Golpe»);
- la recuperación de Verbe;
- el reposo de heridas.

**En PF2e:**

- Solo existe «Descansar por la noche» (`actor.restForTheNight`).
- Lo del rato corto son actividades de 10 minutos (Tratar heridas, Reenfocar).
- El descanso corto de la casa no tiene a qué engancharse. **Decisión.**

### 5. Estados

- **Lo que se usa:**
  - `CONFIG.DND5E.conditionTypes`: 8
  - los estados propios de Ecos: Canalizando, Cargado y los de técnicas
  - la pregunta antes de aplicar un estado (`preCreateActiveEffect`, en `mesa-control.js`)
- **En PF2e:**
  - Los estados son objetos `condition`, con valor (Asustado 2, Lento 1) y su propia lógica de duración.
  - Los estados propios de Ecos tendrían que ser «efectos» de PF2e.
  - La pregunta al jugador cambia de hook: `preCreateItem` en vez de `preCreateActiveEffect`.

### 6. Plantillas y medidas

**Lo que se usa:**

- `system.target.template` (4);
- `convertirMedida` y `plantillaEnEscena` (`verbe-plantillas.js`);
- la corrección 3.7 de metros a pies para midi-qol.

**En PF2e:** las áreas son estallido, cono, emanación y línea, siempre en pies y con otra herramienta de plantillas. La conversión de medidas sirve tal cual, pero el tipo de área hay que traducirlo.

### 7. midi-qol

- **Lo que se usa:**
  - los hooks `midi-qol.preCheckHits` (2), `RollComplete` (2), `preDamageRoll` y `preCheckSaves`;
  - su ajuste `ConfigSettings` (detalles ocultos, en `mesa-oponentes.js`);
  - la forzada de pregunta de ataque;
  - la Moneda Antigua.
- **Archivos:** `main.js` (33), `verbe.js` (22), `mesa-control.js`, `mesa-oponentes.js`, `mesa-diagnostico.js`, `mesa-resolucion.js`, `verbe-clash.js` y `catalogo.js`.
- **En PF2e:**
  - midi-qol no existe.
  - El sistema ya resuelve ataque, daño y salvación desde la tarjeta del chat, y aplica el daño con un botón.
  - Hay que quitar la dependencia, no traducirla.
  - Todo lo que hoy cuelga de los hooks de midi tiene que colgar del chat de PF2e: `preCreateChatMessage` con el `context` de PF2e.

### 8. Módulos recomendados

| Módulo | Para qué | En PF2e |
|---|---|---|
| item-piles + itempilesdnd5e | Mercadillo de Arcegris | Item Piles funciona en PF2e con su propio puente (`itempilespf2e`). Hay que revisar los precios. |
| monks-tokenbar | Salvaciones pedidas, XP por enemigos | Funciona en PF2e. Revisar la XP, que en PF2e va por nivel y no por VD. |
| plutonium | Importación en la creación guiada y el taller | Solo dnd5e. En PF2e se apaga esa opción. |
| sequencer, seasons-and-stars | VFX y calendario | No dependen del sistema. |

## Lo que no cambia

**El catálogo y sus herramientas.** `data/verbe.txt`, la cadena `catalog:expand` y las huellas de potencia siguen igual.

**Las reglas puras:**

- `verbe-core.js`
- `verbe-reserva.js`
- `verbe-etapas.js`
- `verbe-lectura.js`
- `verbe-canalizar.js`
- `verbe-clones.js`
- `verbe-progression.js`
- `verbe-shinobi.js`
- `verbe-divinity.js`
- `verbe-medicina.js`
- `azar-core.js`

**La Mesa Ecos:**

- `mesa-vistas.js`
- `mesa-memoria.js`
- `mesa-creacion.js`
- `mesa-musica.js`

**Otros:** el calendario, los diarios y los permisos de secretos.

**Las pruebas** de esas reglas, 285 en total, no cambian.

## Propuesta de orden para 5.2b

Una capa `scripts/sistema/` con dos implementaciones, `dnd5e.js` y `pf2e.js`. Las elige `game.system.id` al arrancar.

**Las funciones de la capa:**

| Grupo | Funciones |
|---|---|
| Ficha | `pg(actor)`, `curar(actor, n)`, `danar(actor, n, tipo)`, `velocidad(actor)`, `ca(actor)`, `resistencias(actor)` |
| Tiradas | `tirarHabilidad(actor, clave, opciones)`, `tirarSalvacion(...)`, `gradoDeExito(tirada, cd)` |
| Técnicas | `datosTecnica(meta)`, que devuelve el objeto del sistema; `alUsarTecnica(callback)` |
| Descansos | `alDescansar(tipo, callback)` |
| Estados | `aplicarEstado(actor, id, valor)`, `quitarEstado(...)`, `alCrearEstado(callback)` |
| Plantillas | `areaDeTecnica(meta)` |
| Recursos de la casa | `agotamiento`, `moneda`, `dadosDeGolpe`. En PF2e devuelven lo que el autor decida, o `null` si la regla se apaga. |

**El orden de trabajo:**

1. Escribir la capa con la implementación dnd5e.
2. Mover el código a la capa archivo por archivo, sin cambiar el comportamiento (5.2c). Las pruebas siguen en verde y se suma una prueba por función de la capa.
3. Escribir la implementación PF2e (5.2d).

## Decisiones del autor necesarias antes de 5.2b

1. **Agotamiento de la casa y deuda de Verbe.** ¿Se traducen a Fatigado y Drenado de PF2e, a un contador propio de Ecos, o se apagan?
2. **Heridas, Malherido y salvaciones de muerte.** ¿Se usa Moribundo y Herido de PF2e tal cual, o se mantiene la regla de la casa encima?
3. **Dados de Golpe y descanso corto.** PF2e no tiene ninguno de los dos. ¿Se reemplazan por Tratar heridas y Reenfocar (10 minutos), o se crea un «rato de respiro» propio de Ecos?
4. **Moneda Antigua.** ¿Pasa a ser Puntos de Héroe (PF2e los trae de serie), o sigue siendo una moneda de tesoro propia?
5. **Técnicas como acciones o como hechizos de foco.** Las acciones encajan mejor con el coste en Verbe; los hechizos de foco traen ya ataque y salvación de hechizo. Hay un borrador en `docs/CONVERSION_PF2E.md`.
6. **Licencias.** El contenido de PF2e remasterizado está bajo la licencia ORC. Lo que se importe del mundo PF2e del autor queda en su mundo y no se publica en el módulo.
7. **¿Un solo módulo para los dos sistemas,** o un segundo módulo «Ecos PF2e» que reutilice el catálogo? Un solo módulo es más cómodo de mantener; dos módulos aíslan mejor los fallos.
