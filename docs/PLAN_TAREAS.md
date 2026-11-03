# Ecos de la Frontera · Programa de tareas

*Plan del 1 de noviembre de 2026, preparado para Ian (autor del módulo). Está escrito para que cualquier IA o persona lo retome sin más contexto.*

## 0. Cómo usar este documento

- Haz las fases en orden (0 a 5). Cada tarea cabe en una sesión corta. Revisa su campo **Dep.**: si depende de otra tarea, esa debe estar hecha.

- No hace falta leer la conversación original. Todo lo necesario está en las secciones 1 a 3 y en la propia tarea.

- Al terminar una tarea, marca \[x\] y anota la versión. Conviene guardar este archivo en el repo como docs/PLAN_TAREAS.md para que el estado quede a la vista.

- Tamaños: **S** = menos de una sesión, **M** = una sesión. Lo grande ya viene partido en a, b, c.

- Lo marcado **(a verificar)** no se comprobó. Compruébalo antes de usarlo. Si el código real contradice este documento, manda el código: anótalo en «Decisiones abiertas» (al final) y sigue.

- No hagas nada fuera de la tarea que tienes delante. No cambies la visibilidad del repositorio.

## 1. Contexto del proyecto

- **Módulo:** «Ecos de la frontera · Reglas de la casa», id ecos-frontera, v3.4.0 (31-oct-2026), para Foundry VTT v13 y dnd5e 5.2.5 o superior. Repo: https://github.com/iangonzalezgarciaa-blip/Modulo-Foundry-Ecos-de-la-Frontera (rama main; público por ahora).

- **Mundo de uso:** «Fantasy and Agony» (D&D 5e). Existe otro mundo, «Esperanza Oculta», de Pathfinder 2e, para una campaña futura. Módulos presentes en el mundo: midi-qol, Chris's Premades, Plutonium, Active Auras, JB2A, entre otros.

- **Qué es el Verbe:** sistema de poder propio de la campaña (inspirado en anime shinobi). Se gasta como maná: la **reserva de Verbe**. Las **técnicas** se compran con **Trazos** (puntos de progreso: 4 por nivel). Cada técnica tiene **grado** 0 a 11 (como el nivel de un conjuro). Se agrupan en **ramas**: Forma, Velo, Cuerpo, Mirada, Sello, Pacto, Pulso, Hilo, Quietud, Rastro, Sangre, Umbral, Vasija. Cada rama tiene **rango** (Novato, Entrenado, Experto, Maestro, Legendario, Mítico) que limita el grado. La **naturaleza** es el elemento del personaje (Fuego, Agua, Viento, Tierra, Rayo y combinadas). El **Control del Verbe** es una habilidad de Sabiduría. Un **choque** es el enfrentamiento de dos técnicas. **Sustitución** es una defensa que gasta reacción. Los **Ocho Cerrojos** son un estado de la rama Cuerpo. **Mesa Ecos** es la herramienta del DM dentro del módulo.

- **Reglas escritas para jugadores:** en el mundo, diario «Reglas de la casa», página «10 · El Verbe · guía revisada». También README.md y docs/ del repo.

- **Datos actuales (v3.4.0):** 860 técnicas, 219 dotes, 78 reliquias, 178 pruebas Node.

### Mapa de código (verificado el 1-nov-2026)

| Tema                                                                | Dónde                                                                                                                                                                    |
|---------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Lógica principal del Verbe: panel, compras, choques, texto de ayuda | scripts/verbe.js (~3.900 líneas)                                                                                                                                         |
| Choques                                                             | scripts/verbe-clash.js (17 líneas) y scripts/verbe.js (función enfrentamientoAutomatico, enganchada a midi-qol.preCheckHits, preCheckSaves y preDamageRoll, ~línea 3819) |
| «Probar» naturaleza (hoy gratis)                                    | scripts/verbe.js ~línea 1476                                                                                                                                             |
| Coste de rangos (+1 Trazo desde la tercera rama)                    | scripts/verbe.js ~línea 309                                                                                                                                              |
| Plantillas de área                                                  | scripts/verbe.js (buscar template, ~líneas 684, 1675, 3529)                                                                                                              |
| Efectos y estados (incluye el estado «Cargado» del Rayo)            | scripts/verbe-effects.js                                                                                                                                                 |
| Progresión, entrenamiento, medicina, descansos                      | verbe-progression.js, verbe-training.js, verbe-medicina.js, rest-core.js                                                                                                 |
| Mesa Ecos (herramienta del DM), diagnóstico, NPC, recibos           | scripts/mesa\*.js y scripts/main.js (~10.000 líneas: no leer entero, usar grep)                                                                                          |
| Resultados 1 y 20 naturales                                         | scripts/azar\*.js                                                                                                                                                        |
| Catálogo de técnicas                                                | data/verbe.txt (parece codificado; **no editar a mano**; se genera con tools/\*.mjs, ver tarea 0.3)                                                                      |
| Pruebas y auditorías                                                | tests/\*.test.mjs y tools/\*.mjs                                                                                                                                         |

### Reglas del repositorio (de AGENTS.md)

- Cada versión terminada exige: misma versión en module.json y package.json, entrada en CHANGELOG.md, pruebas y empaquetado ejecutados, y un **GitHub Release** (tag vX.Y.Z, ZIP ecos-frontera-X.Y.Z.zip y module.json). No sobrescribir versiones ya publicadas. El flujo .github/workflows/release.yml publica al cambiar la versión en main.

- package.json declara ecosUpdateMode: private (actualizador local con GitHub CLI). No incrustar tokens en el módulo.

- Comandos: npm test (node --test), npm run check, npm run catalog:audit, npm run balance, npm run audit:text, npm run audit:balance, npm run package.

- El repo documenta que la comprobación dentro de un Foundry real sigue pendiente. No afirmes «probado en Foundry» si no lo probaste.

## 2. Decisiones del autor (obligatorias, no reabrir)

- **D1 · Naturalezas ocultas.** La naturaleza primaria **y** la secundaria quedan ocultas. Descubrirlas cuesta Trazos y pasa por entrenamiento: prueba de dados y días correctos. El DM decide caso a caso si el descubrimiento es secreto o lo elige el jugador, pero siempre debe existir la opción secreta. No se desbloquean técnicas elementales hasta completarlo. Quien no quiera naturaleza elemental necesita formas **no elementales**.

- **D2 · Clones.** Deben existir clones de sombra y elementales, con mejoras y dotes. Son **caros**. Al disiparse, el usuario recibe los **recuerdos, experiencias sensoriales y aprendizajes** del clon (**no XP**). Con dotes se abaratan hasta el nivel del Tajū Kage Bunshin de Naruto.

- **D3 · Reserva por dados.** El máximo de Verbe por nivel se gana con dados desde que se despierta, como los PG. Debe quedar cerca de la tabla actual (167 al nivel 20) pero con variación. **Sin mínimo garantizado**: si a alguien no le alcanza, lo compensa con dotes o con Trazos que dé el DM por rol. Meta de diseño: los oponentes deben ser **impredecibles**. Nadie debe deducir PG o CA desde el VD, salvo con dotes de lectura del Verbe o información dada por rol.

- **D4 · Costes.** Cuantas más ramas tenga un personaje, más caro es avanzar en las demás (incremental). Evita que alguien lo gaste todo en ser bueno en todo.

- **D5 · Sangre = familia = herencia.** Son lo mismo. Solo **una** por nacimiento. Si el personaje ignora su legado, es secreto y el DM lo decide al crear el personaje o al despertar el Verbe. Un botón activa las técnicas familiares cuando se descubren por rol. La pestaña de Verbe de la hoja muestra al DM, con claridad, qué puede aprender el jugador. Debe servir a un DM novato y enviarlo a los diarios. Supuesto a confirmar: una Mirada heredada cuenta dentro de esa única sangre; el Pacto sigue aparte (se gana en la historia).

- **D6 · Control en dados.** Aplica a **todos** los ataques del mundo (integración completa con midi-qol), no solo a las técnicas del módulo. Siempre preguntar: normal, ventaja o desventaja; si se detecta ventaja o desventaja, avisar y preguntar si la usa. Al meter estados (prone, stunned, Ardiendo, Empapado…), preguntar si lo aplica. Cuando ataca un NPC, la pregunta le llega al **jugador que defiende**. Debe haber margen para usar recursos (por ejemplo una «soul coin») que cambien el resultado.

- **D7 · Pathfinder 2e, dos proyectos.** (A) Traer los hechizos de PF2e a esta campaña D&D. (B) Dejar el módulo compatible con PF2e para la campaña de «Esperanza Oculta».

- **D8 · Edición dentro de Foundry.** Eliminar «Getsuga Tenshō» (técnica creada por el autor, no está en el repo). El DM debe poder **editar directamente en Foundry** cualquier técnica, hechizo o característica del módulo, sin ir al código. Los errores de configuración no deben llegar a la mesa (ejemplo: «Aliento de brasa» dañó al propio lanzador y no dejó colocar el cono).

- **D9 · Devolver Verbe gastado.** Botón **solo para el DM**.

- **D10 · Técnicas cargadas.** Más potentes, pero dejan al usuario vulnerable y estático. Criterio libre del implementador, con al menos 1 o 2 por forma, herencia y rama. Nombre del estado: «Canalizando» (no «Cargado», que ya usa el Rayo).

- **D11 · Biblioteca PF2e.** La **mayor cantidad posible**, sin redundar con lo que ya hay en D&D (ejemplo: bola de fuego ya existe). Única, rara, poco común o común: se tratan igual, salvo en el coste.

- **D12 · Repositorio.** Público por ahora. No cambiar su visibilidad sin orden expresa del autor.

## 3. Protocolo de cada tarea

1.  git clone https://github.com/iangonzalezgarciaa-blip/Modulo-Foundry-Ecos-de-la-Frontera y leer AGENTS.md.

2.  Ejecutar npm test y anotar el estado de partida.

3.  Hacer **solo** la tarea. Para saber dónde tocar, usar grep; no leer archivos enteros.

4.  Añadir o actualizar pruebas en tests/. Si cambia una regla, actualizar también el texto de ayuda del panel (está dentro de verbe.js) y los docs/.

5.  Ejecutar npm test y npm run check. Si falla algo que ya fallaba antes, anótalo; no lo ocultes.

6.  Añadir una línea al CHANGELOG.md bajo la versión en curso. Solo las tareas marcadas **R** publican versión.

7.  Marcar la tarea \[x\]. No tocar datos del mundo salvo en tareas con «Mundo».

8.  Tareas «Mundo»: se hacen dentro de Foundry (con un conector de Foundry si lo hay, o con macros que ejecuta el autor desde el juego).

## Fase 0 · Preparación

- [x] **0.1 · Mapa de código** (hecha en v3.4.1: docs/MAPA_CODIGO.md) (S · Dep.: —). Crear docs/MAPA_CODIGO.md: para cada tema de la tabla de la sección 1 indicar archivo, funciones y líneas reales (con grep). Añadir dónde está la tabla de reserva de Verbe por nivel (el número 167 no aparece en scripts/, hay que buscarla), dónde se definen los estados y dónde se aplican las técnicas. Listo cuando cada fila tiene función y línea.

- [x] **0.2 · Línea base** (hecha: docs/LINEA_BASE_3.4.md) (S · Dep.: —). Ejecutar npm test, npm run check, npm run catalog:audit y npm run balance. Guardar la salida resumida en docs/LINEA_BASE_3.4.md (cuántas pasan, cuáles fallan). Listo cuando hay un punto de partida para comparar.

- [x] **0.3 · Cómo se edita el catálogo** (hecha: docs/CATALOGO_COMO_EDITAR.md) (S · Dep.: —). data/verbe.txt parece codificado. Leer tools/catalog.mjs, tools/expand-\*.mjs, tools/evolve-catalog.mjs y el script catalog:expand de package.json. Documentar en docs/CATALOGO_COMO_EDITAR.md: cómo añadir una técnica, cómo modificarla y cómo regenerar el archivo. Desbloquea todas las tareas que crean o cambian técnicas.

## Fase 1 · Correcciones y control del jugador (publica v3.5.0)

- [x] **1.1 · Validador de técnicas mal configuradas** (hecha: scripts/verbe-validate.js, tools/validate-techniques.mjs, sección en Diagnóstico) (M · Dep.: 0.3). Crear tools/validate-techniques.mjs y una vista en el Diagnóstico de Mesa Ecos (scripts/mesa-diagnostico.js). Reglas mínimas: texto o ficha que habla de cono, línea, esfera, cubo, cilindro o área pero sin plantilla (target.template.type) es un error; técnica de daño con objetivo «uno mismo» sin ser autodaño intencional es un aviso; sin acción, alcance o duración es un aviso. Salida: informe con id de técnica y problema. Antes, revisar si tools/audit-catalog.mjs ya cubre parte. Listo cuando el informe corre sobre las 860 técnicas y hay pruebas.

- [x] **1.2 · Arreglar «Aliento de brasa» y lo que marque el validador** (hecha: tools/repair-plantillas.mjs, 79 técnicas, 0 errores y 0 avisos; conversión m→pies en escena) (M · Dep.: 1.1). Que el cono se pueda colocar y que el daño no recaiga en el lanzador. Corregir las demás técnicas señaladas (si son muchas, partir por rama). Listo cuando el validador devuelve 0 errores de plantilla.

- [ ] **1.3 · Eliminar «Getsuga Tenshō»** (preparada en 3.5.0: está en el ajuste capaVExtra, id propia-cK45Tfiv, y en ninguna ficha de personaje; el autor la borra en Mesa Ecos → Dirección → Editar técnicas → Técnicas adicionales → Borrar) (S · Dep.: —). Tarea de Mundo. No está en el repo: vive en el ajuste del mundo capaVExtra o en las técnicas propias de algún actor (ver docs/AUDITORIA_MECANICAS.md, línea ~46). Buscar «getsuga» en actores y en ese ajuste (a verificar el nombre exacto del ajuste) y borrarla con confirmación del autor. Listo cuando ya no aparece en ninguna ficha ni en el catálogo del mundo.

- [x] **1.4a · Editor del DM: técnicas propias** (hecha: Taller del DM ampliado, botón en Dirección) (M · Dep.: 1.1). Botón «Editar técnicas» en Mesa Ecos, solo DM, reutilizando «Inventar una técnica» (scripts/verbe-authoring.js) para listar, abrir y editar técnicas propias o extra. Campos: nombre, rama, grado, coste de Verbe, acción, alcance, área, duración, daño, salvación y texto. Al guardar corre el validador. Listo cuando el DM edita y guarda una técnica sin tocar código.

- [x] **1.4b · Editor del DM: capa de ediciones sobre el catálogo base** (hecha: ajuste capaVEdiciones, scripts/verbe-ediciones.js) (M · Dep.: 1.4a). Permitir cambiar cualquier técnica del catálogo base guardando solo las diferencias en el mundo (revisar cómo funciona capaVExtra), sin tocar los archivos del módulo, para que las actualizaciones no las borren. Botón «Restaurar original». Listo cuando una edición sobrevive a reinstalar el módulo.

- [x] **1.4c · Editor del DM: dotes, reliquias y hechizos** (hecha: dotes en la capa de ediciones; reliquias y hechizos con su editor nativo) (M · Dep.: 1.4b). Lo mismo para las 219 dotes y las 78 reliquias (compendio world.ecos-reliquias). Para hechizos, enlazar al editor nativo de ítems de dnd5e.

- [x] **1.5 · Preguntar ventaja o desventaja** (hecha en código: scripts/mesa-control.js; prueba real pendiente, caso «ventaja35») (M · Dep.: 0.1). Ámbito: todos los ataques del mundo. Primero revisar si las opciones propias de midi-qol (tirada rápida o preguntar) lo logran; solo si no alcanzan, programar un diálogo en un hook de midi-qol (ya se usan midi-qol.preCheckHits en main.js ~2173 y verbe.js ~3819; verificar el nombre del hook de la tirada de ataque en la versión instalada). Comportamiento: siempre preguntar normal, ventaja o desventaja; si el sistema detecta ventaja o desventaja, avisar y preguntar «¿la usas?». La pregunta va a quien controla al atacante. Ajuste de mundo para activarlo o apagarlo. Listo cuando se prueba con un ataque de jugador y otro de NPC.

- [x] **1.6 · Preguntar al aplicar estados** (hecha en código: scripts/mesa-control.js; prueba real pendiente, caso «estados35») (M · Dep.: 1.5). Cuando un ataque, salvación o técnica va a aplicar un estado (prone, stunned, Ardiendo, Empapado…), mostrar al atacante «¿Aplicar \[estado\]? \[qué provoca\]» con Sí o No. Si ataca un NPC, el aviso llega también al jugador que defiende. Listo cuando ningún estado se aplica sin pregunta (con ajuste para apagarlo).

- [x] **1.7 · Pausa para cambiar un resultado** (hecha: Moneda Antigua al fallar; ajuste pausaMoneda; caso «moneda35») (M · Dep.: 1.5). Después de tirar y antes de aplicar el efecto, abrir una pausa para que el jugador gaste un recurso que cambie el resultado. El autor mencionó una «soul coin»; probablemente sea la Moneda Antigua del módulo (confirmar en «Decisiones abiertas»). Listo cuando se puede gastar un recurso en esa pausa y queda en el recibo.

- [x] **1.8 · Botón devolver Verbe (solo DM)** (hecha: Dirección y tarjeta, con registro) (S · Dep.: —). Desde v3.4.0 existe una corrección parcial (scripts/mesa-resolucion.js: solo usos simples, solo GM principal, solo el último uso). Auditar su alcance, ponerla visible en Mesa Ecos y en el recibo del chat, y permitir una cantidad manual con registro para recursos complejos. Listo cuando el DM devuelve Verbe desde un botón visible, con registro.

- [x] **1.9 · R · Publicar v3.5.0** (publicada el 3-nov-2026: Release v3.5.0 con ZIP, module.json y actualizador) (S · Dep.: 1.1 a 1.8). Versión, CHANGELOG, pruebas, empaquetado y GitHub Release según AGENTS.md.

## Fase 2 · Reglas núcleo (publica v3.6.0)

- [x] **2.1a · Naturaleza oculta: estado** (hecha: natModo, oc1; las elementales no se ven ni se compran hasta descubrirla) (M · Dep.: 0.1). Guardar la naturaleza primaria y la secundaria como dato oculto (flags) que el jugador no ve ni usa hasta descubrirla. Mientras tanto, las técnicas elementales quedan bloqueadas. Listo cuando un personaje con naturaleza oculta no ve ni compra técnicas elementales.

- [x] **2.1b · Naturaleza oculta: descubrimiento pagado** (hecha: scripts/verbe-etapas.js; primera 3 días, CD 12, 2 Trazos; segunda 5 días, CD 14, 3 Trazos; técnica «Cambiar naturaleza del Verbe» 3 Trazos, 7 días, CD 15; etapas del Verbe con botón del DM) (M · Dep.: 2.1a). Cambiar «Probar» (verbe.js ~1476, hoy gratis): ahora paga Trazos y exige entrenamiento con prueba de dados (Control del Verbe, CD a definir y documentar) y días (usar el sistema de verbe-training.js). Resultado: descubre o no. Listo cuando el flujo completo funciona y tiene pruebas.

- [x] **2.1c · Naturaleza oculta: control del DM** (hecha: Herramientas del DM → Naturaleza secreta y Etapa del Verbe) (S · Dep.: 2.1b). Panel para que el DM fije la naturaleza en secreto, la revele, o deje elegir al jugador, caso a caso. Listo cuando el DM puede ocultar, revelar y cambiar el modo por personaje.

- [ ] **2.2a · Reserva por dados: modelo** (M · Dep.: 0.1). Diseñar la tirada de Verbe por nivel desde el despertar, como los PG: dado por nivel con promedio cercano al incremento de la tabla actual y SIN mínimo (D3). Ubicar la tabla actual (tarea 0.1). Guardar las tiradas por actor. Opción por personaje: tirar o usar promedio (decide el DM). Documentar la fórmula. Listo cuando una simulación en tools/balance.mjs da totales cercanos a la tabla en promedio.

- [ ] **2.2b · Reserva por dados: tirada al despertar y al subir de nivel** (M · Dep.: 2.2a). Interfaz y flujo: tirar al despertar y en cada nivel, con el resultado visible al DM y registro. Respetar las reglas de Sangre que calculan porcentajes sobre la tabla de nivel (ver diario «Ecos · Panteón y sangre divina (solo DM)»).

- [ ] **2.2c · Reserva por dados: migración** (S · Dep.: 2.2b). Los personajes existentes conservan su reserva actual como valor fijo. Pruebas de no regresión.

- [ ] **2.3a · Oponentes impredecibles: ocultar datos exactos** (M · Dep.: —). Revisar qué ven los jugadores de un enemigo (barra de PG, CA, ficha) y qué ajustes de Foundry o midi-qol lo ocultan (a verificar). Aplicar los ajustes y documentarlos. Listo cuando un jugador no puede leer PG ni CA exactos de un enemigo.

- [ ] **2.3b · Oponentes impredecibles: variación en NPC con Verbe** (M · Dep.: 2.2a). En el Taller de NPC (scripts/mesa\*.js) añadir una opción «Verbe variable»: PG, CA, daño y reserva con variación acotada según rangos y ramas del NPC. Listo cuando dos NPC iguales salen distintos dentro de límites.

- [ ] **2.3c · Oponentes impredecibles: lectura del Verbe por tramos** (S · Dep.: 2.3a). Revisar lo que ya dan Rastro (por ejemplo «Rastro fino») y las dotes informativas. Hacer que revelen información por tramos (lleno, a medias, poco; rango aproximado) y no cifras exactas. Documentar para el DM.

- [x] **2.4 · Costes incrementales por rama** (hecha: RECARGO_RAMAS +1 desde la 3.ª, +2 desde la 5.ª) (S · Dep.: —). Hoy: +1 Trazo por rango desde la tercera rama (verbe.js ~309; textos en ~2487, ~3040 y ~3060). Nuevo: el coste extra crece con cada rama adicional (propuesta: +1 desde la tercera, +2 desde la quinta; dejar la fórmula en una constante). Opcional: aplicarlo también al aprender técnicas de ramas no principales. Actualizar tablas y ayuda, y probar. Listo cuando el panel muestra el coste correcto con 1, 3 y 5 ramas.

- [ ] **2.5a · Sangre única: unificar** (M · Dep.: 0.1). Unificar nombres y datos: sangre, familia y herencia son lo mismo (D5). Una sola por personaje. Revisar verbe-divinity.js y la rama Sangre; validar y migrar. Listo cuando no se pueden tener dos linajes.

- [ ] **2.5b · Sangre única: panel del DM** (M · Dep.: 2.5a). En la pestaña Verbe de la hoja, un bloque **visible solo para el DM** que diga en lenguaje simple: qué linaje tiene el personaje (o «secreto»), qué puede aprender ahora y qué sigue bloqueado, con frases como «este jugador puede comenzar a aprender técnicas de sangre, reliquias o legado». Con enlaces a los diarios del mundo («Mundo 10 · El Verbe por dentro», «Reglas ocultas de la Sangre» dentro de «2 · Tramas y secretos», y «Manual del DM del módulo»). Listo cuando un DM nuevo entiende el estado sin leer reglas.

- [ ] **2.5c · Sangre única: botón de activación** (S · Dep.: 2.5a). Botón del DM «Activar técnicas familiares» para cuando el jugador las descubra por rol. Si el legado es desconocido, queda oculto hasta entonces. Listo cuando el botón cambia el estado y deja registro.

- [ ] **2.6a · Curación y heridas: auditoría** (S · Dep.: —). Revisar cómo se enlazan las dotes de medicina (verbe-medicina.js, 19 líneas; «Médico del Verbe», «Cirujano del Verbe», técnicas de Pulso) con las heridas de la casa («Herida No Tratada»; diario «Reglas de la casa», página «1 · Santuarios, descanso y heridas»; rest-core.js). Entregar docs/AUDITORIA_CURACION.md con los huecos.

- [ ] **2.6b · Curación y heridas: cambios** (M · Dep.: 2.6a). Que la prueba de Medicina sea valiosa y que el Verbe médico pese (bonos o ventaja según la rama Pulso). Que las heridas graves exijan reposo en cama por días aunque haya curación mágica. Listo cuando el flujo está implementado y probado.

- [ ] **2.7 · R · Publicar v3.6.0** (S · Dep.: 2.1 a 2.6).

## Fase 3 · Combate (publica v3.7.0)

- [ ] **3.1a · Choque en cualquier rama: regla escrita** (M · Dep.: 0.1). Hoy el choque solo acepta técnicas ofensivas «elementales o de Forma» (diario «10 · El Verbe · guía revisada»; código en verbe-clash.js y verbe.js). Regla nueva: cualquier técnica ofensiva (Cuerpo, Velo, Umbral, mentales, Hilo, etc.) puede chocar. Resolución: se compara la potencia; si hay ventaja elemental, suma 2 grados (regla actual); si **no** hay ventaja elemental, se decide con un dado (Control del Verbe de ambos). Escribirla primero en docs/CHOQUE_4.md con ejemplos (patada contra Rayo, teletransporte contra Fuego, mental contra física).

- [ ] **3.1b · Choque en cualquier rama: código** (M · Dep.: 3.1a). Implementarla en verbe-clash.js y enfrentamientoAutomatico. Actualizar tests/clash.test.mjs y la explicación de cinco pasos del panel.

- [ ] **3.1c · Reacciones: romper el monopolio de Sustitución** (S · Dep.: 3.1b). La ventana de defensa debe ofrecer cualquier reacción o contratécnica válida del personaje, no solo Sustitución (hoy también hay Cortina de agua, Escudo de piedra, Paso falso y Leer el golpe). Listo cuando la lista se arma desde el catálogo por etiqueta de reacción.

- [ ] **3.2a · Contratécnicas no elementales: Cuerpo e Hilo** (M · Dep.: 0.3, 3.1b). Crear técnicas de reacción o choque con el proceso de 0.3: patadas, golpes, armas suspendidas. Mínimo 2 por rama, grados 0 a 5, con costes.

- [ ] **3.2b · Contratécnicas no elementales: Velo, Sello y Rastro** (M · Dep.: 3.2a). Mentales, barreras y lectura del golpe. Mismos mínimos.

- [ ] **3.2c · Contratécnicas no elementales: Umbral, Quietud, Vasija y Pacto** (M · Dep.: 3.2a). Teletransporte, entorno, bestias. Mismos mínimos.

- [ ] **3.3 · Estado «Canalizando» y regla de técnicas cargadas** (M · Dep.: 0.1). Definir en verbe-effects.js el estado «Canalizando»: el usuario no puede reaccionar ni chocar y queda estático (velocidad 0) mientras prepara. La preparación dura 2 o más turnos y cada turno sube potencia, fiabilidad, precisión o coste. Se interrumpe por daño (salvación de CON, CD 10 o la mitad del daño, la mayor), por incapacitación o por movimiento forzado. Explicarlo en la ficha de cada técnica y en la ayuda del panel. Listo cuando una técnica de prueba carga, se interrumpe y se libera. Nota: «Cargado» ya lo usa el Rayo; no reutilizar ese nombre.

- [ ] **3.4a · Auditar candidatas a cargadas** (S · Dep.: 3.3). Listar las técnicas existentes que deberían ser cargadas (Rasengan y Chidori, ver docs/REPERTORIO_SHINOBI.json, y otras de gran potencia). Informe en docs/AUDITORIA_CARGADAS.md.

- [ ] **3.4b · Convertir las existentes en cargadas** (M · Dep.: 3.4a).

- [ ] **3.4c · Crear 1 o 2 cargadas nuevas por forma, herencia y rama** (M, en dos lotes · Dep.: 3.4b).

- [ ] **3.5a · Clones: diseño** (S · Dep.: 3.3). Escribir docs/CLONES.md. Ya existen clones como técnicas: Forma «forma-clon-agua», «forma-clon-tierra», «forma-clon-madera», «forma-clon-rayo», «forma-clon-cuervos» (grados 3 a 5), Hilo «Kami Bunshin» (g3) y Pacto «Mushi Bunshin» (g3); ver docs/REPERTORIO_SHINOBI.json. Diseñar el coste alto (propuesta: el clon se lleva una parte de la reserva y de los PG del usuario, además del Verbe de la técnica), duración, límites y cómo se disipa.

- [ ] **3.5b · Clones: crear el clon** (M · Dep.: 3.5a). Mecánica de aparición y coste.

- [ ] **3.5c · Clones: recuerdos al disiparse** (M · Dep.: 3.5b). D2: sin XP. Al disiparse se genera una «tarjeta de recuerdos» para el usuario con lo que el clon vio, oyó, sintió y aprendió; el DM la redacta o aprueba. Propuesta, no decidida: el entrenamiento hecho por el clon acredita días de entrenamiento con un tope diario.

- [ ] **3.5d · Clones: dotes de abaratamiento y clones masivos** (M · Dep.: 3.5c). Cadena de dotes que baja el coste hasta el nivel del Tajū Kage Bunshin.

- [ ] **3.5e · Clones: adaptar los existentes** (S · Dep.: 3.5b). Mover las técnicas actuales al nuevo sistema o retirarlas.

- [ ] **3.6 · R · Publicar v3.7.0** (S · Dep.: 3.1 a 3.5).

## Fase 4 · Contenido (publica v3.8.0)

- [ ] **4.1a · Magia estándar: lore** (M · Dep.: —). Tarea de Mundo. Escribir, para aprobación del autor, por qué la magia de D&D es de aprendizaje común en este mundo y cómo convive con el Verbe. Propuesta: ampliar el diario «Mundo 6 · Magia y misterios», página «1 · Cómo funciona la magia».

- [ ] **4.1b · Magia estándar: mapa de elementos** (S · Dep.: 4.1a). Tabla «escuela o tipo de daño de D&D → naturaleza del Verbe» en docs/MAGIA_ESTANDAR.md. Aprobación del autor.

- [ ] **4.1c · Magia estándar: entra al choque** (M · Dep.: 3.1b, 4.1b). Los conjuros participan en el choque con potencia igual al nivel del espacio y el elemento del mapa.

- [ ] **4.2a · Hechizos PF2e: exportar** (S · Dep.: —). Tarea de Mundo, en «Esperanza Oculta». Macro que exporta los hechizos del sistema PF2e (compendio pf2e.spells-srd, a verificar) a JSON: nombre, rango, tradiciones, rasgos, lanzamiento, alcance, área, objetivo, salvación, duración, texto y rareza. La ejecuta el autor y entrega el archivo.

- [ ] **4.2b · Hechizos PF2e: filtro de redundancia** (M · Dep.: 4.2a). Comparar por nombre y efecto contra los compendios del mundo D&D (dnd5e.spells, dnd5e.spells24, Chris's Premades Spells, MISC Spells). Salida: lista de «únicos» a convertir y lista de «redundantes» con motivo.

- [ ] **4.2c · Hechizos PF2e: reglas de conversión** (S · Dep.: —). Escribir docs/CONVERSION_PF2E.md: acciones de PF2e (1, 2 y 3 acciones, reacción) a acción, acción adicional, reacción o 1 minuto; rango a nivel de conjuro (truco = nivel 0); intensificar a niveles superiores; CD y salvaciones; condiciones; rasgos a tipos de daño; rareza a coste (D11). Licencia: PF2e Remaster usa ORC y el material anterior OGL (a verificar); como el repo es público, comprobarlo antes de subir texto convertido.

- [ ] **4.2d · Hechizos PF2e: conversión por lotes** (S por lote · Dep.: 4.2b, 4.2c). Crear lotes de ~10 ítems de conjuro dnd5e (con actividades) en un compendio de mundo nuevo (propuesta: world.ecos-conjuros-pf2e). Registrar cada lote en docs/CONVERSION_PF2E_LOTES.md. Repetir hasta agotar los «únicos».

- [ ] **4.2e · Hechizos PF2e: biblioteca** (S · Dep.: 4.2d). Diario índice por escuela, nivel y tipo.

- [ ] **4.3 · Formas no elementales** (M · Dep.: 0.3, 2.1a). Crear 20 a 30 técnicas de Forma sin elemento (proyectiles, armas de Verbe, escudos, impulsos), grados 0 a 5, para quien no tenga naturaleza elemental.

- [ ] **4.4a · Lore del panteón: «Mundo 1 · Dioses y planos»** (M · Dep.: —). Tarea de Mundo. Fuente: diario «Ecos · Panteón y sangre divina (solo DM)», página «Pendiente · actualizar panteón…», y docs/PANTEON_3.2.md. Incorporar jerarquía, completar Nerys y Ashka y, si el autor lo decide, Seyra y Dhoren. Conservar las páginas escritas y los permisos.

- [ ] **4.4b · Lore del panteón: «Mundo 10 · El Verbe por dentro»** (M · Dep.: 4.4a). Añadir herencias nuevas, crecimiento primigenio, técnicas y los dos hitos. Separar sangre, Mirada, tradición y culto.

- [ ] **4.4c · Lore del panteón: «Tramas · Los portadores y sus dones»** (S · Dep.: 4.4a). Enlazar la progresión de Maethra (Eco, Paso, Voz, Señorío) sin adelantar revelaciones. Revisar las versiones para jugadores antes de revelar nombres verdaderos.

- [ ] **4.5a · Diarios y compendios: inventario y permisos** (S · Dep.: —). Tarea de Mundo. Informe de qué diarios existen, qué ven los jugadores y qué falta por rama, dote, reliquia y naturaleza.

- [ ] **4.5b · Diarios para jugadores** (M · Dep.: 4.5a). Ampliar, sin secretos, el compendio de cada cosa.

- [ ] **4.5c · Diarios solo para el DM** (M · Dep.: 4.5a). Lo mismo, con notas de uso y secretos.

- [ ] **4.5d · Aplicar permisos** (S · Dep.: 4.5b, 4.5c). Los permisos se cambian desde la interfaz de Foundry o con una macro; un conector de Foundry puede no poder hacerlo (a verificar).

- [ ] **4.6a · Plantillas de NPC: inventario** (S · Dep.: —). Hoy hay 7 plantillas narrativas en el Taller de NPC y 23 plantillas de combate en el diario «4 · Plantillas de combate». Listar huecos según el ambiente de la campaña (Arcegris, la frontera, el Vorrh).

- [ ] **4.6b · Plantillas de NPC: crear ~10 nuevas** (M · Dep.: 4.6a).

- [ ] **4.7a · Iconos: estrategia** (S · Dep.: 0.3). Mapa «rama + elemento → icono». Fuentes permitidas: iconos del núcleo de Foundry, del sistema dnd5e y los 14 SVG de icons/. Fuentes externas solo con licencia libre, registrando la atribución en docs/CREDITOS_ICONOS.md (por ejemplo game-icons.net, que a mi entender exige atribución CC BY 3.0: a verificar).

- [ ] **4.7b · Iconos de técnicas** (M, por lotes de ramas · Dep.: 4.7a). Aplicar vía el proceso de 0.3.

- [ ] **4.7c · Iconos de dotes** (M · Dep.: 4.7a).

- [ ] **4.7d · Iconos de reliquias** (S · Dep.: 4.7a).

- [ ] **4.8 · R · Publicar v3.8.0** (S · Dep.: 4.1 a 4.7).

## Fase 5 · Proyectos grandes (publica v4.0.0)

- [ ] **5.1a · Música de YouTube: investigación** (S · Dep.: —). Buscar módulos existentes que reproduzcan YouTube sincronizado en Foundry (a verificar que existan). Límites: usar solo el reproductor oficial incrustado; no extraer ni descargar audio (contraviene los términos de YouTube). Entregar un informe con recomendación.

- [ ] **5.1b · Música de YouTube: prototipo** (M · Dep.: 5.1a). Panel del DM: pegar enlace, reproducir, pausar y volumen; cada jugador lo oye en su cliente, sincronizado por socket.

- [ ] **5.1c · Música de YouTube: cola y ajustes** (S · Dep.: 5.1b).

- [ ] **5.2a · Compatibilidad PF2e: inventario de acoplamiento** (M · Dep.: 0.1). Hoy el repo no menciona Pathfinder en absoluto (verificado). Listar todo lo atado a dnd5e: campos system.\*, actividades, uso de midi-qol, descansos. Punto de partida: grep -n "dnd5e\\system\\\\midi-qol" scripts/\*.js. Entregar docs/PF2E_ACOPLAMIENTO.md con una estimación del esfuerzo.

- [ ] **5.2b · Compatibilidad PF2e: diseño del adaptador** (M · Dep.: 5.2a). Interfaz común para tiradas, recursos, descansos, actividades, estados y plantillas. **Pausa:** el autor aprueba el diseño antes de seguir.

- [ ] **5.2c · Compatibilidad PF2e: refactor del lado dnd5e** (M, repetir por archivo · Dep.: 5.2b). Mover lo específico de dnd5e detrás del adaptador sin cambiar el comportamiento; las pruebas deben seguir en verde.

- [ ] **5.2d · Compatibilidad PF2e: adaptador PF2e** (M, repetir por área · Dep.: 5.2c). Reserva de Verbe como recurso propio, técnicas como acciones o hechizos de PF2e, estados y tiradas.

- [ ] **5.2e · Compatibilidad PF2e: prueba en «Esperanza Oculta»** (S · Dep.: 5.2d). Tarea de Mundo.

- [ ] **5.3 · R · Publicar v4.0.0** (S · Dep.: 5.1 y 5.2).

## Decisiones abiertas

Respuestas del autor del 3 de noviembre de 2026 (ya no están abiertas):

1.  «Soul coin» = la **Moneda Antigua** del módulo (`system.currency.soul`; se unificaron en la v1.x). (1.7)

2.  **Sí:** una Mirada heredada es la única sangre del personaje. El Pacto va aparte (se gana en la historia). Un ojo trasplantado no cuenta como sangre. (2.5a)

3.  **Clones:** al usar la técnica se pregunta cuánto Verbe se le transfiere y cuántas copias se crean (muy opcional). Cada copia aparece como una ficha nueva «clon de <nombre>» en el campo, con **1 PG** y el Verbe transferido; puede usar técnicas. Si la destruyen, ese Verbe se pierde. Clones sólidos: se pueden infundir con una naturaleza; el de sombras es Verbe puro (técnica rara, como el pergamino prohibido). (3.5)

4.  Estados cuando ataca un NPC: se mantiene el supuesto (decide el DM; el jugador que defiende recibe aviso y puede usar reacciones o recursos). (1.6)

5.  Seyra y Dhoren: **pendiente**, preguntar al llegar a 4.4a.

6.  Licencias de PF2e: **pendiente**, comprobar en 4.2c.

7.  **Naturaleza:** se descubre como en la serie, desde un nivel equivalente a *chunin* (nivel 5) o a un *genin* muy entrenado (nivel 3 con rango Entrenado en Forma). «3 Trazos, 7 días, CD 15» es el precio de una técnica aparte: **Cambiar naturaleza del Verbe**. Además, el Verbe se aprende **por etapas**: nadie lo usa al empezar, y si conocen a un maestro o a un aprendiz por rol, el DM pulsa un botón que les abre la siguiente etapa y más ramas. Debe quedar muy claro para el DM. (2.1)

8.  **Ramas:** +1 Trazo por rango desde la 3.ª rama y +2 desde la 5.ª. (2.4)

## Registro de progreso

| Fecha | Tarea | IA o persona | Resultado | Versión |
|-------|-------|--------------|-----------|---------|
| 3-nov-2026 | 0.2, 0.3 | Claude | Línea base y guía del catálogo; decisiones 1–4, 7 y 8 respondidas | 3.4.1 (sin versión nueva) |
| 3-nov-2026 | 1.1, 1.2 | Claude | Validador (860 técnicas, 0 errores, 0 avisos tras corregir 79) y plantillas convertidas a la escena | Sin publicar (3.5.0) |
| 3-nov-2026 | 1.3–1.8 y pendientes de 2.7 | Claude | Editor del DM y capa de ediciones; ventaja, estados, moneda, devolver Verbe; descanso corto, naturaleza −1, defensas fuera de combate. Getsuga localizada (la borra el autor) | Sin publicar (3.5.0) |
| 3-nov-2026 | 1.9 | Claude | Release v3.5.0 publicado por el flujo (ZIP, module.json, Ecos-Actualizar.ps1, .bat) | 3.5.0 |
