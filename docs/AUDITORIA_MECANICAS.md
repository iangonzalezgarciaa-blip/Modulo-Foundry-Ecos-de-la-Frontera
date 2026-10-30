# Auditoría inicial de las mecánicas de Ecos de la Frontera

Fecha: 30 de octubre de 2026. Documento para el autor y el DM.

**Estado actualizado:** esta auditoría conserva los hallazgos de la importación 2.7.5 como referencia histórica. Las reparaciones, decisiones y límites actuales están en [BASE_ESTABLE_2.8.md](BASE_ESTABLE_2.8.md); la [cobertura completa](COBERTURA_CATALOGO.md) y los [escenarios de balance](ESCENARIOS_BALANCE.md) acompañan al código 2.8. Las frases siguientes sobre «sin cambios» describen la revisión inicial, no la versión reparada.

Base examinada: módulo **2.7.5**, importado sin modificar sus 26 archivos, commit [`1219db8`](https://github.com/iangonzalezgarciaa-blip/Modulo-Foundry-Ecos-de-la-Frontera/commit/1219db85892189ca61656893e035ba8c40791094).

La prioridad es hacer coincidir las reglas escritas, los cálculos y lo que ocurre en Foundry. Después se puede equilibrar el sistema con datos de partidas. Cambiar daños antes de corregir una defensa o un estado que no se aplica produciría conclusiones engañosas.

Esta revisión documenta el núcleo del Verbe y sus conexiones con heridas, descansos, clases y economía. Incluye inventario de todo el catálogo, lectura dirigida del código y doce comprobaciones locales. No constituye una evaluación individual completa de las 401 técnicas, ni una prueba de integración en una partida real con todos los módulos. Los archivos de juego conservan su comportamiento original; este documento no implementa los cambios propuestos.

## 1. Fuentes y autoridad

| Fuente | Uso en la revisión |
|---|---|
| [Atlas y manual del jugador](https://chatgpt.com/library?file_id=libfile_db0304daf9e881918776f3226f75a0d2&account_id=personal), pp. 13–17 y 26–33 | Intención de supervivencia, recuperación, ramas, grados, estados y progresión |
| [Compendio universal del DM](https://chatgpt.com/library?file_id=libfile_5e3f2ba998c4819197b445c2fea423ca&account_id=personal), pp. 2–3 y 129–132 | Alcance mundial, procedencia y concesión narrativa de herencias, Miradas y Pactos |
| [Libro completo de Ecos, DM](https://chatgpt.com/library?file_id=libfile_d1b58affadf48191b12f08c91206f16d&account_id=personal), pp. 395–399 | Contraste de la transcripción de reglas del Verbe con el manual general |
| [Estudio de Naruto y Shippuden](https://chatgpt.com/library?file_id=libfile_4c2bf60012388191b61b98b3200aaa0a&account_id=personal), pp. 7–12 | Forma, naturaleza, control, sustitución, clones y diferencia entre dificultad y potencia |
| `scripts/verbe.js`, `scripts/main.js`, datos de `data/verbe.txt`, `module.json` y README | Comportamiento implementado, contenido del catálogo e integración |

Los PDF expresan reglas y contexto; el código permite comprobar cómo se ejecutan. Una discrepancia debe resolverse según la decisión del autor. La inspiración de Naruto no reemplaza el canon de Nimerios. Las reglas del mundo deben poder funcionar en cualquier región: el Mercadillo de Arcegris y sus PNJ son contenido local.

## 2. Qué contiene realmente el sistema

El catálogo base tiene **401 técnicas, 155 dotes, 11 ramas, 5 naturalezas simples, 11 combinaciones, 7 Miradas, 6 Pactos y 7 Cerrojos**. Los datos distinguen además 15 registros de linaje y 9 entradas de herencias; esas categorías no deben contarse como equivalentes.

| Rama | Técnicas |
|---|---:|
| Forma | 147 |
| Velo | 35 |
| Cuerpo | 27 |
| Mirada | 22 |
| Sello | 32 |
| Pacto | 26 |
| Pulso | 25 |
| Hilo | 22 |
| Quietud | 19 |
| Rastro | 19 |
| Sangre | 27 |
| **Total** | **401** |

No encontré identificadores duplicados de técnicas ni discrepancias entre el identificador del registro y el de su objeto. El nombre «Brasa» aparece dos veces, en contextos distintos; los identificadores permiten distinguirlo.

Las técnicas añadidas desde el panel pueden guardarse en el ajuste del mundo `capaVExtra` o en las técnicas propias del actor. Esos datos no forman parte de esta carpeta de módulo. Por ejemplo, «getsuga tensho», vista antes en la campaña, no está en los 401 registros del archivo importado. El repositorio conserva el módulo; no sustituye una copia del mundo con personajes y ajustes.

## 3. Progresión y recursos

La reserva es la tabla por nivel más el modificador elegido y los aumentos correspondientes. El grado máximo sigue la progresión 1/3/5/.../17 y añade grado 10 en nivel 19 y grado 11 en nivel 20. Los Trazos base son `4 × nivel + 4`: ocho al nivel 1 y 84 al nivel 20, antes de hitos y monedas.

| Grado | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Verbe base | 0 | 2 | 3 | 5 | 6 | 7 | 9 | 10 | 11 | 13 | 15 | 18 |

Las ramas limitan el aprendizaje; rango, afinidad, cultivo y algunas dotes añaden potencia a lo aprendido. La rama principal adelanta sus dones un rango. Esto es una decisión escrita del sistema, no un fallo: un personaje Entrenado en su principal ya alcanza el primer don mediante `rangoDon`.

El Verbe se agrega a la clase de D&D. Por ello deben medirse las combinaciones de técnicas con Ataque adicional, conjuros, rasgos de clase y reacciones. El número de Trazos no basta para estimar el poder de un personaje.

Dos sensibilidades numéricas merecen pruebas:

- El clima favorable reduce una técnica de grado 1 de 2 a 1 Verbe: reduce su coste a la mitad. En grado 11, bajar de 18 a 17 supone aproximadamente un 5,6 %. La influencia relativa del clima es mucho mayor al principio.
- Un aumento de área de ×1,5, cuando el tamaño es una dimensión lineal, puede multiplicar la superficie aproximadamente por 2,25. Repetirlo tres veces puede llevarla a unas 11,39 veces la original. El número real de blancos depende de geometría, obstáculos y posiciones; no es automáticamente once veces más daño.

## 4. Hallazgos reproducidos y discrepancias concretas

### A. Requisitos de naturaleza incompletos — prioridad alta

`cumpleReqDote` reconoce varios requisitos mediante expresiones regulares, pero no comprueba `naturaleza Fuego` y sus equivalentes. En una prueba con un actor que solo tenía Agua, «Corazón de fuego» devolvió `{ok: true, pideDM: false}`. El mismo validador se usa al mostrar y comprar dotes.

Referencia: `scripts/verbe.js`, `cumpleReqDote`, desde la línea 875.

Propuesta: requisitos estructurados y un único validador para catálogo, compras, aprobación y ajustes. Conservar una vía explícita de excepción del DM, con registro de la excepción.

### B. Gasto negativo distinto según la vía de uso — prioridad alta

El uso ordinario de una actividad impide gastar en negativo con Agotamiento 4. La lista de defensas y `abrirCerrojo` comprueban el límite negativo, pero no aplican esa misma restricción. La prueba ofreció Sustitución con Agotamiento 4 y cero Verbe, mientras el uso ordinario equivalente estaba bloqueado. Otra prueba abrió el primer Cerrojo y dejó el Verbe en −2 con Agotamiento 4.

Además, `abrirCerrojo` descuenta el recurso directamente y no llama a la tirada de sobreesfuerzo usada por técnicas y defensas. Esto permite caminos mecánicos distintos para un mismo concepto.

Referencias: `alConsumir`, línea 655; `abrirCerrojo`, línea 1236; `defensasDisponibles`, línea 2421.

Propuesta: centralizar autorización de uso, cálculo del coste, límite negativo, sobreesfuerzo y consecuencias. Acordar expresamente cualquier excepción de los Cerrojos.

### C. «Cargado» no bloquea las defensas del propio Verbe — prioridad alta

La descripción de Cargado impide las reacciones. Sin embargo, `defensasDisponibles` excluye determinados estados incapacitantes y no incluye Cargado. La prueba con ese estado siguió ofreciendo Sustitución. El efecto Cargado tampoco introduce cambios equivalentes en su definición.

Referencias: definición `ESTADOS`, línea 33, y `defensasDisponibles`, línea 2421.

Propuesta: comprobar la disponibilidad de reacción desde una misma función para técnicas, defensas y efectos de naturaleza. Hay que probar también los ataques con metal y la retirada del estado tras consumir su beneficio.

### D. «Palma que cierra» anuncia un escalado sin configurarlo — prioridad alta

Su texto promete `+2d8` por grado adicional. La actividad de curación tiene `scaling.mode` vacío y `scaling.number` nulo. La función `datosItem` mantiene esos campos. Otras curaciones del catálogo sí contienen escalado configurado.

La discrepancia está demostrada en los datos y en el objeto reconstruido localmente. Falta confirmar el resultado final del lanzamiento dentro de Foundry.

Referencias: registro `pulso-cerrar` de `data/verbe.txt`; `datosItem`, desde la línea 398.

Propuesta: configurar el escalado y comprobar que pagar grado 2 produce la curación correspondiente. Verificar por separado el tratamiento de Malherido y Herida No Tratada: `main.js` detecta magia curativa principalmente por nombres e identificadores y no incluye expresamente Palma que cierra en esa tabla.

### E. Recuperación de deuda con redondeo favorable — prioridad media

La regla dice que lo negativo cuesta el doble. En `alDescansar`, el bucle reduce dos puntos de recuperación mientras queda cualquier cantidad positiva. Con una reserva máxima de 5, una noche a la intemperie aporta un punto de recuperación; la prueba pasó de −2 a −1. Se pagó un punto por recuperar uno de deuda.

Referencia: `alDescansar`, líneas 779–785.

Propuesta: definir el redondeo y, si procede, guardar un resto de recuperación. Un recurso indivisible no debería otorgar más recuperación que la prevista sin que sea una regla deliberada.

### F. Monedas y Dados de Golpe no usan la misma regla de deuda — decisión pendiente

Una moneda que aporta cuatro puntos llevó al actor de −5 a −1. El gasto de moneda suma directamente y no aplica el coste doble de la recuperación negativa. Respiro, regeneraciones y el hook de Dados de Golpe también usan sumas directas.

Referencias: `gastarMoneda`, línea 1005; `alDescansar`, línea 761; `inicioDeTurno`, línea 1318; hook `dnd5e.rollHitDieV2`, línea 2763.

Esto puede ser una excepción deseada, pero los manuales no la delimitan. Debe decidirse si las monedas pagan deuda a razón 1:1 o 2:1 y aplicar la misma política a las demás fuentes, salvo excepciones documentadas.

### G. Los Cerrojos cuentan días de calendario, no descansos largos — prioridad media

El manual define la repetición entre Descansos Largos. El código cuenta usos con `floor(worldTime / 86400)` y `alDescansar` no reinicia ese contador. La prueba hizo un Descanso Largo y abrió de nuevo en la misma fecha: el contador quedó en dos.

Consecuencias: una segunda activación puede conservar la penalización después de descansar, o perderla al cruzar medianoche sin haber descansado.

Referencias: `abrirCerrojo`, líneas 1256–1259; `alQuitarEfecto`, líneas 1297–1299.

Propuesta: usar un contador de ciclos de descanso. El cambio de día del calendario debe mantenerse independiente si hace falta para otros sistemas.

### H. El creador propone un presupuesto, pero no lo hace cumplir — prioridad alta de diseño

`presupuesto` calcula una sugerencia. `tecnicaNueva` admite los valores introducidos sin contrastarlos con esa sugerencia, el tamaño máximo o el alcance permitido por grado. La prueba local construyó grado 1 con 20d12 y esfera de 90 m. No se añadió esa técnica al juego: solo se examinó el objeto generado en memoria.

El DM conserva la aprobación de pedidos de jugadores; por tanto, esto no demuestra que un jugador consiga automáticamente dicha técnica. Sí demuestra que la herramienta no detecta ni explica que excede su propio presupuesto.

Además, la cantidad de estados del formulario afecta a la sugerencia, pero la naturaleza añade sus estados automáticamente. Es posible calcular con cero estados y recibir Ardiendo de todos modos. La duración, concentración y componentes tampoco intervienen en la función de presupuesto actual.

Referencias: `presupuesto`, línea 1042; `tecnicaNueva`, línea 1066; `dialogoCrear`, línea 1133.

Propuesta: presupuesto con desglose de daño, alcance, geometría, acciones, estados y duración. Permitir al DM rebasarlo con una excepción explícita. Validar de nuevo al aprobar, no solo al abrir el formulario.

### I. El límite de grado alto depende del grado base — decisión pendiente

`datosItem` asigna el uso por Descanso Largo cuando `tec.g >= 6`. Una técnica de grado base 1 elevada hasta grado 6 conserva usos ilimitados del objeto y solo consume Verbe. La prueba mostró este comportamiento con Aliento de brasa en nivel 11.

Referencia: `datosItem`, líneas 405–408; `tecnicaNueva`, campo `system.uses`.

Hay que decidir si el límite significa «cada técnica aprendida de grado 6+» o «cada lanzamiento a grado 6+». También si ese límite es por técnica, por grado o por personaje. La redacción actual permite interpretaciones distintas; no conviene cambiarla silenciosamente.

### J. Dones y estados tienen cobertura automática desigual — prioridad alta

Hay reglas que aparecen en la guía o descripción y requieren arbitraje manual. Ejemplos: Forma precisa y la selección de aliados exentos; Cuerpo templado y sus bonos condicionados; Réplica y la redirección de ataques; Estado de Quietud y sus pruebas periódicas. Los registros de algunas de estas técnicas son actividades de utilidad sin efectos asociados.

La prueba de las funciones de generación no produjo el efecto de Cuerpo templado para una rama principal Entrenada. Esto no equivale a haber probado toda interacción posible de terceros; identifica que la cobertura no está en esa ruta del módulo.

Empapado sí introduce resistencia y vulnerabilidad. Ardiendo tiene un procesamiento al inicio del turno de combate. Embarrado incluye la reducción de caminar, pero su desventaja a DES no aparece en esos cambios. Desequilibrado y Cargado tienen texto sin los cambios necesarios para todas sus consecuencias. Debe existir una matriz que distinga **automático**, **semiautomático** y **manual**.

Referencias: `ESTADOS`; `datosItem`; `asegurarAEDotes`, línea 611; `despuesDeUsar`, línea 684; `inicioDeTurno`; registros de cada técnica.

### K. Oro y entrenamiento del creador se anuncian, sin cobro ni demora en esa función

`crearAprobada` incorpora la técnica y llama a `aprender`, que carga los Trazos. El oro y los días se escriben en el mensaje de chat. En esa ruta no se descuenta moneda corriente ni se espera al final de un entrenamiento. El cultivo también aplica su mejora y comunica los días, en vez de programar su finalización.

Esto corrige una impresión de la inspección visual inicial: el formulario menciona costes en oro y tiempo, pero mencionarlos no implica que los esté gestionando.

Referencias: `crearAprobada`, línea 1123; `aprender`, línea 502; `cultivar`, línea 973.

Propuesta: decidir si son requisitos manuales del DM o un sistema de proyectos con pago, fecha de inicio, progreso y entrega. La interfaz debe decir cuál de las dos cosas ocurre.

## 5. Decisiones de equilibrio que conviene resolver

### Choques elementales

`resolverChoque` consulta el ciclo antes que el grado. La prueba de Fuego grado 0 contra Viento grado 11 dio la victoria a Fuego. Es coherente con la regla escrita actual; es una decisión de diseño, no un error de implementación.

El estudio de Naruto distingue naturaleza, forma, potencia y control y advierte que las ventajas generales no garantizan victoria. Una alternativa para estudiar sería que la ventaja elemental aportara un bono al choque, una diferencia efectiva de grados o mitigación parcial, con un límite frente a diferencias enormes. El tamaño del bono requiere pruebas; este documento no lo fija como canon.

### Acciones, reacciones y cuerpos adicionales

Sustitución requiere comprobar objeto, distancia y una reacción disponible. Un simple fallo garantizado por coste bajo puede desplazar a las otras defensas. Debe medirse con varias agresiones por asalto, áreas, ataques mayores y condiciones incapacitantes.

Los clones físicos y las invocaciones añaden acciones al bando. Su coste no debe evaluarse solo por daño: también ofrecen Ayudar, posiciones, exploración y absorción de ataques. Debe aclararse quién concentra, quién da órdenes, qué recursos comparte cada copia y qué ocurre al desaparecer. Es especialmente importante al combinarse con personajes que ya poseen muchas acciones ofensivas por su clase.

### Control y estados

Cobrar lo mismo por «un estado» no distingue Derribado de Paralizado, ni una aplicación inmediata de varias rondas con salvación repetida. El precio debe reflejar acciones que niega, duración esperada, repetición de salvaciones, ruptura al recibir daño e inmunidades pertinentes.

### Identidad de las técnicas

Conviene conservar la separación del estudio entre transformar forma, transformar naturaleza y dominar el control. El grado no debería convertirse exclusivamente en una escala de dados. Réplica ilusoria, clon físico y clon elemental pueden ser técnicas diferentes por sus funciones, riesgos y economía de acciones. Las artes aprendidas por escuela tampoco deben convertirse automáticamente en herencias biológicas.

## 6. Aspectos técnicos que condicionan las mecánicas

- El README conserva un título v2.0.0 y describe reglas antiguas por carpeta, mientras el módulo declara 2.7.5 y contiene activación por hoja. Hay que actualizar documentación técnica sin sustituir el canon narrativo.
- El diálogo de choques conserva un campo manual con `max="9"`, aunque el sistema alcanza grado 11. La elección de una técnica existente puede leer su grado base; la entrada manual necesita ponerse al día.
- Los efectos numéricos de movimiento deben comprobarse en hojas configuradas en metros y pies. Hay conversiones explícitas para algunos bonos, pero otros valores están escritos directamente en los datos.
- Debe probarse la compatibilidad de grados 10 y 11 con el modelo de objetos y las hojas de dnd5e 5.2.5. El análisis de sintaxis no valida ese modelo.
- Los datos del catálogo están comprimidos y ofuscados; la clave y el descifrador se distribuyen con el módulo. Esto sirve para dificultar una lectura casual, no para garantizar secreto frente a quien tiene los archivos. Los nombres camuflados de los PDF deben seguir protegiéndose en la interfaz y los secretos que deban ser inaccesibles necesitan otra separación.
- Las peticiones recibidas por socket deben validar remitente, permiso sobre el actor, esquema y operación. `manejar` comprueba qué cliente es GM, pero en sus ramas de petición y reloj no se ve una comprobación equivalente del remitente. No se enviaron peticiones de prueba a la campaña.
- Compras y refrescos realizan varias operaciones separadas. Hay que probar doble clic, dos clientes, interrupciones y rechazo de permisos antes de declarar robusta una transacción.

## 7. Prioridad de trabajo propuesta

| Orden | Trabajo | Criterio para darlo por terminado |
|---|---|---|
| 1 | Unificar permisos de uso, gasto, deuda, sobreesfuerzo y reacciones | Una misma situación da el mismo resultado por cualquier ruta, salvo excepción documentada |
| 2 | Corregir requisitos y los desacuerdos claros entre texto y datos | Las compras exigen lo escrito; pagar escalado produce el efecto anunciado |
| 3 | Completar o señalar automatizaciones de estados y dones | Cada entrada informa qué aplica sola y qué debe resolver el DM |
| 4 | Resolver límites altos, choques, clones y concentración | Reglas inequívocas con ejemplos y contraejemplos |
| 5 | Hacer medible la creación y el cultivo | Presupuesto explicado; oro y días gestionados o marcados como manuales |
| 6 | Simular combinaciones y probarlas en mesa | Resultados por nivel, rol, tipo de combate y ritmo de descansos |
| 7 | Revisar el catálogo y actualizar manuales | Cada cambio mecánico tiene versión, justificación y texto coherente |

Las primeras correcciones pueden preservar casi todos los números actuales. La revisión numérica debe apoyarse en un motor que ya aplique correctamente los estados y costes.

## 8. Comprobaciones realizadas y límites

La importación se verificó por SHA de objeto Git para los **26 archivos**: los bytes coinciden con el RAR. Los tres JSON y los cuatro JavaScript pasan sus comprobaciones de formato o sintaxis. Las siguientes comprobaciones ejecutaron funciones reales de `verbe.js` con actores y servicios simulados, fuera de Foundry:

| Caso | Observación |
|---|---|
| Recuperación impar en negativo | Un punto de recuperación redujo en uno la deuda |
| Moneda en negativo | Cuatro puntos nominales redujeron en cuatro la deuda |
| Agotamiento 4 y defensa | Se ofreció la defensa que el uso ordinario bloqueaba |
| Cargado y defensa | Se ofreció Sustitución pese a la prohibición escrita de reacciones |
| Dote de Fuego en usuario de Agua | El validador devolvió aprobación sin pedir DM |
| Escalado de Palma que cierra | Se mantuvo sin configurar |
| Técnica baja elevada a grado 6 | No recibió contador de un uso por descanso en su objeto |
| Creación muy superior al presupuesto | El constructor mantuvo daño y área introducidos |
| Cerrojo con Agotamiento 4 | Abrió y descontó Verbe en negativo |
| Cerrojo tras descanso en la misma fecha | Conservó el uso anterior en su contador |
| Fuego 0 frente a Viento 11 | Ganó Fuego por el ciclo |
| Generación de dones | La ruta examinada no generó Cuerpo templado; requiere completar la matriz de cobertura |

Estas pruebas reproducen cálculos y objetos generados. No demuestran que todas las interacciones con Foundry, midi-qol, DAE o las hojas se comporten igual en todos los clientes. Falta una batería de integración con propietario y GM separados, concentraciones, daño real, reacciones, curación, unidades y descansos.

Para estudiar equilibrio propongo niveles 1, 3, 5, 11, 17 y 20; usuario puro de una rama y usuario repartido; personajes marciales y lanzadores; uno o varios combates antes de descansar; Santuario e intemperie; blanco único, grupos y enemigos resistentes al control. Deben medirse acciones útiles, daño y curación efectivos, reacciones negadas, recurso neto y carga de arbitraje del DM. Una cifra aislada de daño máximo no representa esas diferencias.

## 9. Estado al cerrar esta revisión

El módulo original está versionado en GitHub y esta auditoría deja una base para el trabajo siguiente. No se ha añadido todavía la técnica de prueba de Fuego ni se han alterado las mecánicas. El paso con mayor rendimiento es corregir las discrepancias verificadas y establecer una matriz de automatización; después se podrá afinar el catálogo conservando la identidad de Nimerios.
