# Compatibilidad con PF2e: diseño del adaptador (tarea 5.2b)

*Escrito el 4-nov-2026 sobre la versión 3.11.0, a partir del inventario de `docs/PF2E_ACOPLAMIENTO.md` (5.2a) y de las respuestas del autor del 3-nov-2026. El 4-nov-2026 el autor aprobó las propuestas A a H, con los matices de E, F y G (al final). Con eso se puede empezar 5.2c.*

## Lo que decidió el autor

| Tema | Decisión |
|---|---|
| Agotamiento de la casa y deuda de Verbe | Fatigado y Drenado de PF2e. |
| Descanso corto y Dados de Golpe | Tratar heridas y Reenfocar. El sistema se adapta para que **recuperarse lleve más tiempo de lo normal**: la campaña hace más difícil la muerte definitiva a cambio de alargar mucho las recuperaciones. |
| Heridas | Moribundo y Herido de PF2e, más las reglas de la casa encima (Malherido, Herida No Tratada, Secuela). |
| Moneda Antigua | Puntos de Héroe de PF2e. |
| Técnicas | Acciones con coste en Verbe. |
| Módulos | Un solo módulo para los dos sistemas. |
| Licencias | El contenido de PF2e (ORC) que se importe del mundo del autor queda en su mundo. Nunca se sube al repositorio público. |

## La capa del sistema

Una carpeta `scripts/sistema/` con tres archivos:

- `index.js` elige la implementación según `game.system.id` y exporta un solo objeto, `sistema`.
- `dnd5e.js` mueve ahí lo que hoy está repartido por `main.js`, `verbe.js` y los demás. Se comporta igual que ahora.
- `pf2e.js` es la implementación nueva (5.2d).

El resto del módulo deja de leer `system.*`, `CONFIG.DND5E` o los hooks `dnd5e.*` directamente. Todo pasa por `sistema`. `scripts/compat.js`, que ya separa Foundry 13 y 14 y dnd5e 5 y 6, se integra en `dnd5e.js`.

### Funciones

| Grupo | Función | Qué devuelve o hace | dnd5e | PF2e |
|---|---|---|---|---|
| **Ficha** | `pg(actor)` | `{ valor, max, temp }` | `system.attributes.hp` | `system.attributes.hp` (sin `sp`) |
| | `curar(actor, n, origen)` / `danar(actor, n, tipo, origen)` | Aplica y devuelve lo aplicado | `applyDamage` | `actor.applyDamage` con el `DamageRoll` de PF2e |
| | `velocidad(actor)` / `fijarVelocidad(cambios)` | Metros a pie y otros movimientos | `movement.speeds` (6) o `movement` (5) | `system.attributes.speed` |
| | `ca(actor)` | Número | `attributes.ac.value` | `attributes.ac.value` |
| | `resistencias(actor)` | `{ resiste, vulnerable, inmune }` con claves de Ecos | `traits.dr/dv/di` | `attributes.resistances/weaknesses/immunities` |
| | `nivel(actor)` | Nivel o VD | `details.level` / `details.cr` | `details.level.value` |
| **Cambios** | `cambiosDeEfecto(lista)` | Traduce los 117 cambios del catálogo (CA, movimiento, ataque cuerpo a cuerpo, resistencias) | Efecto activo con `type` o `mode` | Reglas de objeto: `FlatModifier`, `BaseSpeed`, `Resistance` |
| **Tiradas** | `tirarHabilidad(actor, clave, op)` | Mensaje de chat | `rollSkill` | `actor.skills[clave].roll()` |
| | `tirarSalvacion(actor, clave, op)` | Mensaje de chat | `rollSavingThrow` | `actor.saves[clave].roll()` |
| | `leerTirada(mensaje)` | `{ tipo, habilidad, caracteristica, natural, grado }` | `infoTirada` de `compat.js` | `flags.pf2e.context` (`type`, `outcome`) |
| | `gradoDeExito(total, cd, natural)` | `critico`, `exito`, `fallo`, `falloCritico` | Solo éxito o fallo (el crítico sale del 20 natural) | Las cuatro, con el ±10 de PF2e |
| **Técnicas** | `datosTecnica(meta)` | El objeto del sistema para la ficha | `feat` con una actividad (`datosItem`) | `action` con rasgos, coste en acciones y reglas |
| | `alUsarTecnica(fn)` | Engancha el gasto de Verbe y el choque | `dnd5e.postUseActivity` | `preCreateChatMessage` con el `context` de PF2e |
| **Descansos** | `alDescansar(tipo, fn)` | `"corto"` o `"largo"` | `preShortRest`, `restCompleted`… | `"corto"`: Tratar heridas o Reenfocar; `"largo"`: `restForTheNight` |
| **Estados** | `aplicarEstado(actor, id, valor)` / `quitarEstado(actor, id)` | | `ActiveEffect` con `statuses` | Objeto `condition` con valor, o efecto propio de Ecos |
| | `alCrearEstado(fn)` | Para la pregunta antes de poner un estado | `preCreateActiveEffect` | `preCreateItem` |
| **Áreas** | `areaDeTecnica(meta)` | `{ forma, metros }` | Región de dnd5e 6 | Estallido, cono, emanación o línea, en pies |
| **Recursos de la casa** | `agotamiento(actor)` / `sumarAgotamiento(actor, n)` | Nivel de la casa (0 a 6) | `attributes.exhaustion` | Fatigado y Drenado (ver abajo) |
| | `moneda(actor)` / `gastarMoneda(actor)` | Monedas Antiguas | `currency.soul` | Puntos de Héroe |
| | `muerte(actor)` | `{ moribundo, herido, exitos, fallos }` | Salvaciones de muerte | Moribundo y Herido |

**Lo que no pasa por la capa** porque ya es de Ecos: la reserva de Verbe (`flags.ecos-frontera`), los Trazos, el catálogo, las etapas, el choque, la Mesa Ecos, el calendario, el azar y los diarios.

## Cómo queda cada regla en PF2e

### Agotamiento y deuda de Verbe

PF2e no tiene niveles de agotamiento. La capa los traduce así:

| Agotamiento de la casa | En PF2e |
|---|---|
| 1 | Fatigado |
| 2 a 5 | Fatigado y Drenado 1 a 4 |
| 6 | La muerte de la casa, igual que en dnd5e |

- Lo que hoy da 1 nivel de Agotamiento sigue dando 1 nivel: el Despertar, el Esfuerzo Excesivo, una salvación fallida por deuda de Verbe.
- ✅ **Propuesta A (aprobada).** Fatigado se quita como en PF2e, con una noche entera de descanso. Drenado baja 1 por noche **solo en un Santuario**; fuera de él no baja.

### Descanso corto: Tratar heridas y Reenfocar

El «rato» de la casa pasa a ser una actividad de exploración de 10 minutos:

- **Tratar heridas** (Medicina) recupera PG como en PF2e. Es lo que en dnd5e hacían los Dados de Golpe.
- **Reenfocar** recupera Verbe con el mismo presupuesto breve compartido de hoy («Respiro» y «Aliento»), que sigue siendo menor que el del descanso largo.
- La regla 3.5 («el corto solo gasta Dados de Golpe») desaparece: en PF2e no hay Dados de Golpe.

Para que recuperarse lleve más tiempo:

- ✅ **Propuesta B (aprobada).** La inmunidad de Tratar heridas sube de 1 hora a **8 horas**: una cura por persona en cada tramo de viaje.
- ✅ **Propuesta C (aprobada).** «Descansar por la noche» fuera de un Santuario cura la **mitad** de lo normal (mod. de CON × nivel ÷ 2). Dentro, lo normal. Coincide con el Verbe, que ya recupera la mitad en el Santuario y un cuarto a la intemperie.

### Heridas: Moribundo, Herido y las reglas de la casa

- Caer a 0 PG usa Moribundo y Herido de PF2e. El aviso «Acechado por la Muerte» de Ecos se dispara al entrar en Moribundo.
- **Malherido**, **Herida No Tratada** y **Secuela** siguen siendo efectos de Ecos con sus mismos textos. Pasan a ser efectos de PF2e con reglas de objeto: el −1 a pruebas o a CA se convierte en `FlatModifier`.
- La magia que cura heridas y el reposo de heridas funcionan igual, leyendo la curación de PF2e.

Para que la muerte definitiva sea más difícil y la recuperación más larga:

- ✅ **Propuesta D (aprobada).** Se muere en **Moribundo 5** en vez de 4 (el Condenado de PF2e sigue restando).
- ✅ **Propuesta E (aprobada).** Herido no baja con Tratar heridas. Solo baja con una noche entera en un Santuario, de 1 en 1.

### Moneda Antigua: Puntos de Héroe

- Repetir una tirada con una Moneda Antigua pasa a ser gastar un Punto de Héroe. El aviso del 1 natural sigue saliendo, ahora para cualquier fallo crítico.
- La recuperación heroica de PF2e (gastar todos los Puntos de Héroe para no morir) queda activa: encaja con una muerte definitiva más difícil.
- ✅ **Propuesta F (aprobada).** PF2e limita los Puntos de Héroe a 3. Claudia tiene 8 Monedas. Opciones: subir el máximo con una regla de objeto para quien lleva monedas, o guardar las de más como objeto de tesoro «Moneda Antigua» y convertirlas cuando gaste una.
- ✅ **Propuesta G (aprobada).** Los mercaderes que aceptan Monedas Antiguas cobran en Puntos de Héroe.

### Técnicas: acciones con coste en Verbe

Cada técnica se vuelve un objeto `action` de PF2e:

- **Coste en acciones**, según la activación de hoy:

  | dnd5e | PF2e |
  |---|---|
  | Acción | ◆◆ (dos acciones) |
  | Acción adicional | ◆ (una acción) |
  | Reacción | ⤾ (reacción) |
  | Sin acción | ◇ (libre) |
  | 1 minuto o más | Actividad de exploración |

- **Rasgos:** `ecos-verbe`, la rama, la naturaleza y `concentrate` o `manipulate` según pida Concentración o Gestos.
- **Ataque:** tirada contra la CA con el modificador de Control del Verbe. En PF2e es una habilidad de Saber propia, «Saber del Verbe», que Ecos crea al despertar.
- **Salvación:** las de «mitad con éxito» son salvaciones básicas (crítico nada, éxito mitad, fallo entero, fallo crítico doble). Las de estado son no básicas: el fallo crítico alarga o empeora el estado.
- **CD:** 10 + el modificador de Saber del Verbe.
- **Coste:** se paga en Verbe como hoy, con la misma vista previa, el mismo límite de técnicas por turno y la misma deuda.
- ✅ **Propuesta H (aprobada).** En 5.2d los dados de daño y curación quedan iguales que en dnd5e. Se reajustan después de la prueba en «Esperanza Oculta» (5.2e), porque en PF2e los personajes tienen más PG desde el nivel 1.

### Estados

- Los estados de dnd5e que tienen par en PF2e se aplican con su objeto `condition`. Ejemplos: Derribado → Prone; Apresado → Restrained; Asustado → Frightened 1.
- Los propios del Verbe (Empapado, Ardiendo, Canalizando, Desequilibrado, Embarrado…) son efectos de Ecos con reglas de objeto.
- La pregunta antes de poner un estado cuelga de `preCreateItem`.

### Áreas

- Esfera → estallido.
- Cono → cono.
- Cubo o cilindro → emanación o estallido, según el centro.
- Línea → línea.

Las medidas se pasan de metros a pies con `convertirMedida`, como hoy.

### midi-qol

No existe en PF2e. Lo que hoy cuelga de sus hooks pasa al chat de PF2e: ataque, daño y salvación ya se resuelven desde la tarjeta. En dnd5e 6, midi-qol sigue fuera hasta que publique soporte, y Ecos ya funciona sin él (3.10).

## Un solo módulo

- **`module.json`:** `relationships.systems` declara dnd5e (mínimo 5.2.5) y pf2e (mínimo 7, verificado 8.6.1).
- **Arranque:** cada archivo que hoy registra hooks de dnd5e los registra a través de `sistema`. Si el sistema no es ninguno de los dos, Ecos avisa y no carga las capas de combate.
- **Catálogo:** `data/verbe.txt` es el mismo para los dos sistemas. `datosTecnica` lo traduce al cargar.
- **Contenido de PF2e:** los conjuros convertidos (4.2d) van al compendio `world.ecos-conjuros-pf2e` del mundo del autor. Las herramientas de `tools/pf2e/` leen la instalación local y escriben fuera del repositorio.

## Pruebas

- Cada función de la capa tiene una prueba con dobles de dnd5e y de PF2e (`tests/sistema-dnd5e.test.mjs` y `tests/sistema-pf2e.test.mjs`).
- Las 296 pruebas de hoy siguen pasando después de cada archivo que se mueva en 5.2c.
- La prueba en Foundry de 5.2e se hace en un mundo PF2e de prueba («Esperanza Oculta» o uno nuevo) con un personaje despertado.

## Avance de 5.2c

| Fecha | Versión | Qué |
|---|---|---|
| 4-nov-2026 | 3.19 | La capa existe: `scripts/sistema/index.js`, `dnd5e.js` y un `pf2e.js` con las lecturas puras (PG, nivel, CA, velocidad, resistencias, salvaciones, CD de característica, Monedas = Puntos de Héroe, Agotamiento = Fatigado + Drenado, los cuatro grados de éxito). Lo que falta en PF2e avisa con un error que nombra la tarea. Primeros archivos que pasan por la capa: `mercader.js` y `combate-tactico.js`. Pruebas en `tests/sistema.test.mjs`. |
| 4-nov-2026 | 3.20 | `verbe.js` pasa por la capa en todo lo que lee o escribe de la ficha: PG, Agotamiento, Monedas, nivel y VD, competencia, modificadores, CA, velocidad, la característica de conjuros, el Control del Verbe, las salvaciones y las pruebas, curar y dañar. En `main.js`, los bloques de heridas (Muerte, cambios de PG, repetir la salvación de muerte) y de descansos (descanso largo, intemperie, heridas sin tratar, Medicina, ventana de Dados de Golpe). La capa suma `RUTAS` para los ganchos (en PF2e el Agotamiento no tiene ruta: son estados), `datosPg`, `datosCaFija`, `control` y `datosControl`, `curar`, `danar`, `agotamientoMax` y `totalHabilidad`. Una prueba exige que las dos capas tengan las mismas funciones. |
| 5-nov-2026 | 3.21 | El resto de `main.js`: Estabilizar y despertar, el Eco, la página «Estado de los PJ», los Oficios (PG, Agotamiento, pruebas de habilidad y de característica), las Monedas Antiguas en las tiradas, el Eco del Vorrh, los Golpes que cuentan, la noche sin dormir y el gancho `preUpdateActor` (daño escrito a mano y tope de Malherido). La capa suma `tirarCaracteristica`. |

**Lo que sigue en dnd5e a propósito** (se resuelve en 5.2d, porque en PF2e no es una lectura sino otra mecánica):
- Las claves de los efectos activos (`system.attributes.movement.walk`, `system.traits.dr.value`, `system.bonuses.*`…): en PF2e son reglas de objeto.
- Los datos de los objetos de técnica (`data.system.activities`, alcance, plantilla, duración): es `datosTecnica`.
- La habilidad `cvb` en `CONFIG.DND5E.skills` y su lugar en la hoja: en PF2e, «Saber del Verbe».
- Las salvaciones de muerte (`attributes.death`, `rollDeathSave`), los Dados de Golpe (`attributes.hd`) y las Secuelas sobre puntuaciones de característica: PF2e tiene Moribundo y no tiene Dados de Golpe ni puntuaciones.
- El estado «muerto» con su icono grande y las monedas de oro en los bolsos.
- `totalHabilidad` en PF2e: las habilidades no calzan una a una (Perspicacia, Historia, Investigación…). Hace falta decidir el mapa.
- En `main.js`: el gancho `dnd5e.preApplyDamage` (golpe brutal y daño masivo) y las salvaciones de muerte; la elección de prueba de los Oficios con herramientas (`rollToolCheck`); los perfiles de PNJ y biografías que se escriben con datos de dnd5e; las migraciones de datos viejos; la moneda de Item Piles.

Siguiente: `relics.js`, `verbe-effects.js`, `verbe-plantillas.js` y `mesa-*.js`.

## Orden de trabajo y estimación

| Paso | Qué | Sesiones cortas |
|---|---|---|
| 5.2c | Escribir `sistema/dnd5e.js` y mover a él, archivo por archivo, sin cambiar el comportamiento: primero `verbe.js` y luego `main.js`, `relics.js`, `verbe-effects.js`, `verbe-plantillas.js`, `mesa-*.js` | 6 a 8 |
| 5.2d | `sistema/pf2e.js`, por áreas: ficha, tiradas, técnicas, descansos, estados, recursos de la casa | 9 a 14 |
| 5.2e | Prueba en un mundo PF2e y ajuste de cifras (Propuesta H) | 3 a 4 |

## Respuestas del autor (4-nov-2026)

| | Propuesta | Respuesta |
|---|---|---|
| A | Drenado baja 1 por noche solo en un Santuario | Sí. |
| B | La inmunidad de Tratar heridas sube a 8 horas | Sí. |
| C | Fuera de un Santuario, la noche cura la mitad | Sí. |
| D | Se muere en Moribundo 5 | Sí. |
| E | Herido solo baja con una noche en un Santuario | Sí, **salvo que intervenga Verbe médico (rama Pulso, «Médico del Verbe») o magia de alto nivel**, que también lo bajan. |
| F | Monedas de más de 3 | **Se guardan como objeto** «Moneda Antigua». Además, todo lo raro o fuerte del mundo debe poder cambiarse por Monedas: Trazos en el panel del Verbe y el mercader extraño (ver abajo). Esto se hace ya en dnd5e (3.12). |
| G | Los mercaderes cobran en Puntos de Héroe | **Solo el mercader extraño**, el que tiene un rastro de Verbe. El resto cobra en dinero. |
| H | Los dados quedan iguales hasta la prueba | Sí. Además, el 20 y el 1 dan efectos al azar en ataques, pruebas y salvaciones, para todos por igual (3.12). Desde 3.14 el crítico de cada sistema queda intacto (pedido del autor: no matar mecánicas): en dnd5e el 20 duplica los dados de daño, y en PF2e los efectos se enganchan al éxito crítico y al fallo crítico sin quitar el daño doble ni los grados de éxito. |

**El mercader extraño.** Solo él acepta Monedas Antiguas. Puede sentir el Verbe y anda recuperando reliquias para llevárselas y sacarles provecho; eso cambiará el mundo más adelante. Los jugadores no lo saben: él siempre dice que sabe qué hacer con ellas. Su tienda tiene un surtido al azar de unos 15 objetos raros o fuertes que el DM vuelve a sortear con un botón en cada visita.

## Acciones de cualquiera en PF2e (3.12)

En dnd5e, Ecos las pone en cada hoja. En PF2e casi todas ya existen como acciones básicas o de habilidad, y el adaptador usa las del sistema. Las que no existen se crean como acciones de Ecos con el mismo texto.

| Ecos | PF2e |
|---|---|
| Presa | Grapple |
| Empujón: derribar | Trip |
| Empujón: apartar | Shove |
| Lanzar a quien sujetas | — (acción propia de Ecos) |
| Abrirse paso | — (acción propia de Ecos) |
| Escapar o forzar | Escape / Force Open |
| Zancadilla | Trip |
| Desarmar | Disarm |
| Esquivar | — (acción propia de Ecos) |
| Ponerse a cubierto | Take Cover |
| Voltereta | Tumble Through |
| Birlar | Steal / Palm an Object |
| Polvo en los ojos | — (acción propia de Ecos) |
| Apuntar | — (acción propia de Ecos) |
| Interponerse | — (acción propia de Ecos) |
| Esconderse | Hide / Sneak |
| Aguantar | — (acción propia de Ecos) |
| Sacudirse | — (acción propia de Ecos) |
| Resistir | — (acción propia de Ecos) |
| Evaluar al enemigo | Recall Knowledge |
| Planear | — (acción propia de Ecos) |
| Aprovechar el terreno | — (acción propia de Ecos) |
| Buscar | Seek |
| Leer al rival | — (acción propia de Ecos) |
| Ayudar | Aid |
| Serenarse | — (acción propia de Ecos) |
| Fintar | Feint |
| Intimidar | Demoralize |
| Provocar | — (acción propia de Ecos) |
| Distraer | Create a Diversion |
| Arengar | — (acción propia de Ecos) |
| Parlamentar | — (acción propia de Ecos) |

El estado Desprevenido del combate táctico (3.13) es el *off-guard* de PF2e, y Rodear es su *flanking*. En PF2e se usan los del sistema; las otras ocho reglas tácticas se adaptan con 5.2d.
