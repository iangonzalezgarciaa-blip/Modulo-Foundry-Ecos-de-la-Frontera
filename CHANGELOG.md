# Historial de cambios

## 3.27.2 — 2026-11-10

- **La 3.27 entra al repositorio.** La 3.27.0 y la 3.27.1 se hicieron e instalaron directo en el Foundry del autor, sin pasar por aquí ni por un Release. Esta versión trae ese mismo código al repositorio, con su Release, para que el actualizador de Foundry siga funcionando y el trabajo siguiente parta de ella. La 3.27.1 instalada apuntaba su descarga al ZIP de la 3.26.1; ahora apunta al suyo.
- Pruebas puestas al día con lo que la 3.27 cambió a propósito (todo en pies, el pase del DM también con lo que él mueve, aprender por días, 54 pruebas de mesa) y pruebas nuevas para sus reglas: pies, plan de estudio y práctica diaria, naturaleza por dado, reserva y recuperación con Constitución, acción y reacción Verbe, artes de familia y dos estudios a la vez de la misma técnica (no cobra dos veces).
- Un nombre de la campaña que había quedado en un texto del código ahora se dice por su papel («la sangre de la Barrera»).

## 3.27.1 / 3.27.0 — 2026-11-10 (hechas fuera del repositorio)

Pedidos del autor, tal como llegaron instalados:
- **Todo en pies.** Lo que se lee (panel, alcances, fichas, chat del módulo) va en pies: 1,5 m = 5 ft. Las cuentas internas siguen en metros. Una migración pasa las escenas en metros a 5 ft por casilla y apaga las unidades métricas de dnd5e.
- **Quitar plantillas.** En Foundry 14 las plantillas son regiones: un botón del DM en la barra de Tokens (y en el Menú del DM) lista las de la escena y quita las marcadas.
- **El pase del DM, más amplio.** Por defecto pregunta por toda acción con objetivo (armas, conjuros, técnicas y acciones de cualquiera). Ajuste nuevo «El pase del DM · cuando el DM mueve a alguien»: siempre, solo PNJ contra PNJ, o no. La tirada que sigue a un pase no vuelve a preguntar.
- **Artes de familia por nacimiento.** Las seis familias (Atadura de sombra, Crecer, Cambio de mente, Colonia de insectos, Manada de colmillos y Tinta viva) ya no piden «un maestro»: piden la familia, que solo se tiene por nacimiento. El DM la da por historia o con 🎲.
- **El 🎲 del DM** al despertar y en Naturalezas y linaje (linaje, familia, fuerza, rama). Las sangres de guion no salen al azar.
- **Aprender por días** (ajuste «Verbe · aprender por días»): pagar los Trazos empieza el estudio; después, un día bueno por vez con Control del Verbe CD 10 + grado, hasta grado + 1 días. El DM puede dar una técnica por aprendida o poner a una ficha a aprender al instante.
- **Naturaleza por dado:** la primera (1d5) y la segunda (1d4) las puede tirar el jugador.
- **Reserva con Constitución:** suma el modificador de CON por nivel, y el Descanso Largo recupera un cuarto más CON por cada 4 niveles.
- **Acción y reacción Verbe:** una de cada una por turno, aparte de las de D&D, con su estado en el panel y en el rastreador de combate.
- **Técnicas de golpe** con el arma que elijas, y tablas de azar distintas para pruebas sociales y de saber.

## 3.26.1 — 2026-11-10

- Corrección del texto de la ventana de la sangre, comprobada en el mundo del autor: el linaje del ojo de vidrio decía «Este linaje no abre una herencia de Sangre por sí solo», cuando desde 3.26.0 su sangre también sostiene ante el daño masivo. Ahora lo dice, con lo que no hace (no desgasta la Barrera, no suma al Reloj, no tiene Eco). La herencia de la Barrera ya no cita un diario que ahora cuenta otra cosa.

## 3.26.0 — 2026-11-10

- **El diario de cada sangre** (pedido del autor). Al elegir un linaje o un ojo en el panel del Verbe (al despertar a alguien o en la pestaña DM), el DM ve una ventana con el resumen de esa sangre y el botón «Abrir su diario», que lo lleva a la página del mundo que la cuenta entera. Las páginas se reconocen por una marca (`flags.ecos-frontera.linaje`), no por el nombre; la portada lleva `_indice`. Junto a «Guardar» del linaje hay un botón «Su diario». Sin lore ni nombres en el código: el texto sale del catálogo cifrado y de los diarios del DM.
- **Dos sangres sostienen ante el daño masivo.** La del linaje de la Barrera, como desde 3.12 (y suma al Reloj, con Eco), y desde ahora la del linaje del ojo de vidrio, que no toca la Barrera: ni Reloj ni Eco. Un portador que todavía no despertó el Verbe puede llevar la marca `portadorSangre` («ala» o «barrera»); el diálogo de Despertar propone el linaje que corresponde.
- **El pase del DM** (pedido del autor). Cuando un jugador usa una acción del módulo (las «Acciones de …» de cualquiera y las técnicas del Verbe) sobre otra criatura, primero le llega solo al DM la pregunta «¿Esta acción le afecta a esta criatura?», con una casilla por objetivo y una nota opcional. Con el pase, la acción sigue normal sobre las aprobadas; sin pase, no se gasta nada y el jugador recibe la respuesta en privado. Ajuste «El pase del DM»: acciones del módulo (por defecto), toda acción con objetivo, o nunca.
- **Aprender conjuros.** En el libro de conjuros de la hoja hay un botón «Aprender conjuros», además de la lupa por nivel, que abre el buscador con la lista de clase (conjuros de D&D y de PF2e ya convertidos) y suma lo elegido. Para los jugadores, la página «15 · Conjuros: cómo sumarlos a tu hoja» en Reglas de la casa.
- **PF2e en pausa** por decisión del autor: de PF2e solo quedan los conjuros convertidos para D&D. El adaptador (5.2c en adelante) y el traspaso del lore al mundo PF2e se detienen.

## 3.25.0 — 2026-11-10

- Música de YouTube, a pedido del autor: cada uno controla el recuadro del reproductor en su equipo. Se mueve arrastrando su barra; cambia de tamaño arrastrando la esquina de abajo a la derecha, o con los botones − y + (un 25 % por clic); con doble clic en la barra pasa de chico a grande y vuelve; ⟲ lo devuelve abajo a la izquierda en tamaño chico. Recuerda dónde lo dejaste al recargar, no se sale de la ventana y el video nunca queda menor que 200 × 200, el mínimo que pide YouTube (por eso no se puede ocultar del todo: para no oírlo está «Silenciar»).

## 3.24.0 — 2026-11-10

- Corrección: después de la migración a dnd5e 6, 93 tokens en 12 escenas y 21 fichas quedaron con el nombre de token «Non-Player Character» o «Player Character» (entre ellos el de Claudia y muchos de «Valle de Arcegris DM»), aunque las fichas tenían su nombre. Al cargar el mundo, el DM los pasa al nombre público de su ficha (sin VD ni secretos) y recibe un aviso privado con cuántos cambió. Solo se tocan los nombres que son exactamente esa etiqueta: los que el DM puso a mano quedan como están. Para que no vuelva a pasar, un token nuevo con el nombre genérico toma el de su ficha, y si renombras una ficha cuyo token tiene el nombre genérico, el token sigue al nombre nuevo.

## 3.23.0 — 2026-11-05

- Textos más claros, a pedido de la mesa: la **Secuela** dice que son puntos de Fuerza, Destreza o Constitución (no PG), que vuelven de a 1 por cada día de tratamiento con éxito en un Santuario sin combate ni trabajo pesado, y que no es lo mismo que Malherido. Los **3 fallos** de muerte dicen qué se pierde. La guía «Lo que cualquiera puede intentar» y los rasgos de acciones de las hojas explican que, cuando tú haces la acción, **el objetivo** tira contra **tu** CD, con un ejemplo. Los rasgos de las hojas se actualizan solos.
- Preparación para PF2e (tarea 5.2c, quinto paso): los 33 ganchos de dnd5e del módulo se registran con nombres de Ecos a través de la capa del sistema (`sistema.gancho`). En dnd5e son los mismos ganchos, con los mismos argumentos; en PF2e todavía no existen y se saltan con un aviso en la consola, sin romper la carga del módulo.

## 3.22.0 — 2026-11-05

- Preparación para PF2e (tarea 5.2c, cuarto paso): la Mesa Ecos (resumen del personaje, tabla de Control de la sesión y tiradas pedidas), el azar (PG temporales y velocidad), las reliquias y el daño del combate táctico leen y escriben la ficha a través de la capa del sistema. Con esto, las lecturas y escrituras simples de la ficha ya pasan todas por la capa. En la mesa no cambia nada; el movimiento del resumen de la Mesa se lee igual en dnd5e 5 y 6. La capa suma los PG temporales y la Percepción pasiva.

## 3.21.0 — 2026-11-05

- Preparación para PF2e (tarea 5.2c, tercer paso): el resto de `main.js` lee y escribe la ficha a través de la capa del sistema. Entran Estabilizar y despertar, el Eco, la página «Estado de los PJ», los Oficios, las Monedas Antiguas en las tiradas, el Eco del Vorrh, los Golpes que cuentan, la noche sin dormir y el tope de Malherido al curar. En la mesa no cambia nada. La capa suma la prueba de característica.

## 3.20.0 — 2026-11-04

- Corrección: el botón «Cambiar Monedas» del panel del Verbe pedía 2 Monedas Antiguas y decía «2 Monedas = 1 Trazo», un resto de antes de la 3.17. Ahora sigue la regla vigente: aparece con 1 Moneda y dice «1 Moneda Antigua = 1 Trazo (hasta 2 Trazos por nivel)».
- Preparación para PF2e (tarea 5.2c, segundo paso): `verbe.js` y los bloques de heridas y descansos de `main.js` leen y escriben la ficha a través de la capa del sistema: PG, Agotamiento, Monedas, nivel, competencia, CA, velocidad, Control del Verbe, salvaciones y pruebas. En la mesa no cambia nada más. La capa suma rutas para los ganchos, datos de PG, de CA fija y de Control, curar y dañar, y el total de una habilidad. En PF2e, lo que aún no está hecho avisa nombrando la tarea 5.2d.

## 3.19.0 — 2026-11-04

- Preparación para PF2e (tarea 5.2c, primer paso): nueva capa del sistema en `scripts/sistema/` que separa lo que es de dnd5e. Ya pasan por ella el mercader extraño y el combate táctico. En la mesa no cambia nada. La parte de PF2e trae las lecturas de la ficha con las decisiones del autor (Monedas = Puntos de Héroe, Agotamiento = Fatigado + Drenado, cuatro grados de éxito); el resto llega con 5.2d.

## 3.18.0 — 2026-11-04

- Biblioteca de conjuros de PF2e (tarea 4.2e): el diario de «Listas de conjuros de PF2e (Ecos)» trae una página por nivel con los conjuros por escuela y nombre, su enlace, su tipo, las clases que lo tienen y su rareza. El mundo la crea solo al cargar.
- Mundo del autor (por el puente, no en el repositorio): la página «Reglas de la casa · 3 · Monedas Antiguas» queda al día con el mercader extraño y el cambio por Trazos; borrador «Mundo 4 · 7 · Los pueblos en PF2e».

## 3.17.0 — 2026-11-04

- Corrección: el botón «Cambiar Monedas» del panel del Verbe (3.12) cobraba 2 Monedas Antiguas por Trazo y llevaba su propia cuenta, distinta de la regla de la guía del Verbe. Ahora sigue la guía: 1 Moneda = 1 Trazo, como mucho 2 en cada nivel, con la misma cuenta que el panel.

## 3.16.0 — 2026-11-04

- Resonancia del Verbe, como la pidió el autor: con una naturaleza descubierta, los conjuros normales de ese elemento se potencian. Además del +1 al ataque y a la CD, una curación afín cura 1 PG más por dado. Las curaciones son de Agua (o de la rama Pulso), y los conjuros de PF2e sin daño toman la naturaleza de su elemento (fuego, agua, frío, aire, tierra, metal, madera, electricidad) antes que la de su escuela. El daño sigue como en el Manual.
- Conjuros de PF2e: el conversor guarda sus rasgos; el mundo los vuelve a importar solo al cargar.

## 3.15.0 — 2026-11-04

- Conjuros de PF2e en el mundo (tarea 4.2d): los 1.386 conjuros únicos de PF2e, convertidos a dnd5e con las reglas de 4.2c, entran solos (si está el archivo convertido en tu carpeta de datos) al compendio «Conjuros de PF2e (Ecos)» al cargar el mundo, en carpetas por nivel. Cada uno trae su actividad (ataque, salvación, daño, curación o utilidad), su escalado a niveles superiores, el texto en castellano sin enlaces de PF2e, su fuente y su licencia. El conversor (tools/pf2e/convertir_conjuros.py) corre en tu PC y el texto de Paizo no entra al repositorio. Listas de clase y el glosario «Cómo leer los conjuros de PF2e» en «Listas de conjuros de PF2e (Ecos)». Detalle en docs/CONVERSION_PF2E.md.
- La lupa: en el libro de conjuros de cada hoja, cada nivel trae una lupa que abre el buscador de dnd5e con tu lista de clase y los niveles que puedes lanzar, con D&D y PF2e juntos. Los conjuros elegidos entran a tu hoja. El mago sigue el Manual: 6 de nivel 1 al empezar y 2 por nivel, gratis; el resto se copia al libro por 50 po y 2 horas por nivel (los raros de PF2e cuestan más) y el oro se descuenta solo. Las demás clases los añaden sin coste y preparan los que su clase diga.
- Resonancia del Verbe (aprobada por el autor): dote gratis al despertar el Verbe. +1 al ataque y +1 a la CD de los conjuros normales afines a tu naturaleza o a una rama en la que tengas rango. Tablas en docs/MAGIA_ESTANDAR.md.
- Mesa → Control: botón «Importar conjuros de PF2e».
- Diagnóstico: un caso real nuevo (41 en total).

## 3.14.0 — 2026-11-04

- D&D primero (pedido del autor: «respetar D&D base… que sean complementarias; odio matar mecánicas»). Nada de Ecos quita ni cambia una regla del Manual; lo que ya existe en D&D o en PF2e se resuelve como allí y lo de Ecos se suma. Detalle en docs/COMBATE_TACTICO.md, «D&D primero».
- El 20: vuelve el crítico del Manual. Un 20 natural en un ataque tira los dados de daño dos veces y además saca su efecto de la tabla del d20. El mundo se cambia solo una vez al actualizar; la regla de 3.12 queda como ajuste apagado.
- Acciones de cualquiera: cada una dice si es regla base del Manual o de Ecos.
  - Las del Manual se resuelven igual que en el Manual: Presa, Empujón, Escapar, Esquivar, Esconderse, Buscar, Ayudar, Estudiar (Evaluar al enemigo) e Influir (Parlamentar). Empujón vuelve a apartar 1,5 m; Buscar usa las pericias del Manual; Parlamentar usa la CD de Influir (15 o la Inteligencia del blanco, la mayor).
  - Las de Ecos usan tu pericia: CD 8 + el bono de la pericia, con competencia, Pericia doble y bonos de clase. Fintar y Distraer con Engaño, Intimidar y Provocar con Intimidación, Leer al rival con Perspicacia, Birlar con Juego de manos, Zancadilla y Voltereta con Acrobacias, Desarmar con Atletismo o Acrobacias y Abrirse paso con Atletismo.
  - Ponerse a cubierto ya no repite la cobertura del Manual, que sigue siendo gratis: la sube un paso, de media a tres cuartos.
  - Tu clase manda: si tiene algo parecido (Defensa paciente, Apuntar con firmeza, Protección, las maniobras del Maestro de batalla), lo de la clase sigue igual.
  - Las hojas reciben los rasgos nuevos solas al cargar el mundo.
- Combate táctico: si la mesa usa el flanqueo opcional de la Guía del DM (midi-qol), manda ese y Rodear no suma.
- PF2e: se usan las acciones y el crítico del sistema; Ecos solo añade lo que PF2e no tiene.
- Diagnóstico: un caso real nuevo (40 en total).

## 3.13.0 — 2026-11-04

- Combate táctico: diez reglas de la casa para todos los PJ y PNJ, con condiciones cerradas y un resultado fijo. Se encienden y apagan todas a la vez o una a una en Mesa Ecos → Control. Regla escrita para todos en «Reglas de la casa · 14 · Combate táctico» y detalle en docs/COMBATE_TACTICO.md.
  - Desprevenido: un solo estado, +2 a todo ataque contra quien lo tenga, sin acumularse. Lo ponen Fintar y Leer al rival (ya no bajan la CA).
  - Rodear: con un aliado justo en el lado opuesto del blanco, tu ataque cuerpo a cuerpo es contra un Desprevenido.
  - El engaño elige el golpe: si fallan tu Distraer o tu Fintar por 5 o más, tu siguiente 20 contra ellos elige el efecto en vez de sortearlo.
  - Plan maestro: con 20 o más en Planear, al empezar el combate eliges a un aliado que actúa primero.
  - Moral de los PNJ: si cae su líder o la mitad de su bando, salvan Sabiduría CD 10 o quedan Desmoralizados (huyen o se rinden). El módulo tira y avisa al DM.
  - Secuaces: el PNJ marcado cae con cualquier daño.
  - Técnicas combinadas: dos aliados con técnicas del Verbe de naturalezas que combinan, en turnos seguidos, sobre el mismo blanco: 2d6 más del tipo de la combinación y sus estados.
  - Interponerse: reacción nueva en «Acciones de Destreza» para proteger a un aliado a 1,5 m.
  - Terreno vivo: el DM nombra regiones de la escena «Terreno vivo: lámpara», «…: aceite», «…: cornisa»; Aprovechar el terreno las descubre y se usan con un botón.
  - Evaluar automático: Evaluar al enemigo con un blanco marcado le susurra al jugador lo que ganó, en un orden fijo.
- Bandos: cada token es de un bando. Sin más, sale de su disposición (amistoso, neutral, hostil). Para tres o más bandos, el DM crea bandos con nombre y los asigna a los tokens seleccionados; también marca líderes, secuaces y criaturas únicas.
- Diarios ordenados: los diarios del DM que crea Ecos y estaban sueltos pasan a «Mesa, tramas y personajes [DM]», numerados a continuación de los que hay. No toca los que ya están en una carpeta ni renombra los que renombraste. «sequencerDatabase» va a «Módulos (no tocar)».
- PF2e: borrador de los dioses del panteón como deidades de PF2e en el mundo del autor (diario del DM, no en el repositorio).
- Diagnóstico: un caso real nuevo (39 en total).

## 3.12.0 — 2026-11-04

- Acciones de cualquiera: todas las hojas reciben «Golpe sin armas» y seis rasgos, «Acciones de Fuerza» a «de Carisma», con 31 acciones que cualquiera puede intentar dentro y fuera del combate. Entre ellas: Presa, Empujón, Zancadilla, Desarmar, Esquivar, Ponerse a cubierto, Voltereta, Birlar, Polvo en los ojos, Apuntar, Esconderse, Aguantar, Sacudirse, Evaluar al enemigo, Planear, Aprovechar el terreno, Buscar, Leer al rival, Ayudar, Fintar, Intimidar, Provocar, Distraer, Arengar y Parlamentar. Las CD salen de la característica de quien actúa (8 + modificador + competencia). Si la clase trae un golpe sin armas mejor (monje, pugilista), manda el de la clase. Llegan a los PJ al cargar el mundo, a toda hoja nueva o importada y a los PNJ al entrar en escena o en combate; la Mesa tiene un botón para todas a la vez. Regla escrita para todos en «Reglas de la casa · 12 · Lo que cualquiera puede intentar».
- El 20 y el 1: un 20 natural ya no duplica el daño (ajuste del mundo, encendido). A cambio, el 20 y el 1 sacan efectos que importan, al azar, en ataques, salvaciones y pruebas, para PJ y PNJ por igual. Ejemplos con un 20: derribar, desarmar, abrir una herida, romper la guardia. Con un 1: caer, perder el arma, darle la espalda. Cada 20 de ataque cuenta. Los estados, los cambios de CA y velocidad y los PG temporales se aplican solos al aprobarlos, en quien tiró o en su blanco. Regla escrita en «13 · El 20 y el 1».
- Técnicas con arma: las que atacan como un arma (Cuerpo, Hilo) preguntan «¿Con qué atacas?» y enlazan el arma: el ataque usa su característica y su bono mágico, y la técnica la recuerda. Las técnicas con Gestos piden manos libres (una, o dos si lo dicen) y ofrecen guardar el arma; Conjurador de guerra lo evita. Las que piden un turno de preparación se preparan primero.
- Choque: solo chocan las técnicas que cuestan Verbe. Una de coste 0 es demasiado débil para chocar y tampoco abre el choque.
- Monedas Antiguas: en el panel del Verbe se cambian por Trazos (2 por 1, hasta 2 Trazos por nivel). El mercader extraño es el único que acepta Monedas. El DM sortea en la Mesa un surtido de 15 objetos raros o fuertes (reliquias y objetos mágicos de los compendios), cada jugador compra desde la tarjeta del chat, y el mercader también compra lo raro que le traigan. Las reliquias las paga enteras; lo demás, a mitad.
- La sangre que responde es ahora la Sangre Antigua de Maethra: con ese linaje, el daño masivo no mata y al caer a 0 PG el DM recibe el aviso del Eco. Se retira el botón «Sangre que responde (secreto)»; las hojas que ya lo tenían siguen protegidas hasta que el DM les dé el linaje.
- Nombres de tu mundo: un ajuste cambia los nombres del módulo por los de tu mesa sin tocar el repositorio (por ejemplo, «Lethria=Gracefeel»).
- PF2e: las ocho propuestas del adaptador quedan aprobadas con los matices del autor, y cada acción de cualquiera tiene su equivalente en PF2e (docs/PF2E_ADAPTADOR.md). Propuestas para combates más tácticos y plan para llevar el lore a PF2e en docs/COMBATE_TACTICO.md.
- README nuevo, pensado para quien no programa: qué trae, qué necesitas, cómo instalar y qué descargas. El manual completo pasa a docs/MANUAL.md.
- Diagnóstico: un caso real nuevo (38 en total).

## 3.11.0 — 2026-11-04

- Compendios del Verbe en los diarios (tareas 4.5b–d): «11 · Compendio del Verbe» en las reglas de la casa, con las 13 ramas, los rangos, las naturalezas y sus combinaciones y las 222 dotes por categoría, sin secretos de campaña; lo ven el DM y los dueños de un personaje despertado, igual que la guía. Y un diario aparte «Ecos · Compendio del Verbe (solo DM)» con Miradas y su origen, pactos, escuelas, lo que abre cada tradición, hito, bestia y artefacto, las dotes que concede el DM y el recuento de técnicas por rama y grado. Se crean solos al cargar el mundo y no se pisan si los editas. Inventario de diarios y permisos en docs/DIARIOS_INVENTARIO.md (4.5a).
- Panteón (tarea 4.4): Seyra y Dhoren pasan a canon como dioses menores jóvenes; sus herencias ya no dicen «propuesta». Los diarios del mundo del autor se completaron por el puente de Foundry (no van en el repositorio).
- Corrección: desde 3.3, algunos textos que decían «Sangre Antigua» mostraban el nombre de una técnica de Maethra («Pide: Jardín del Primer Sueño» en Raíces que agarran y Bosque de un día, el Despertar y un don legendario), y la herencia de Maethra perdía su rasgo y su Despertar en el panel. Vuelven a decir «Sangre Antigua».
- Corrección: «de los sendas del firmamento» pasa a «de las sendas del firmamento» en los nombres y textos donde salía.
- Compatibilidad: con dnd5e 6, adv-reminder 5.1.2 daba un error en cada prueba de habilidad porque busca una función que dnd5e movió de sitio. Ecos le devuelve un alias y el error desaparece (probado en Foundry 14).
- Probado en Foundry 14 con el mundo abierto: los filtros, las favoritas y el paso a paso de Mis técnicas; los estados del Verbe en la lista de estados; la lectura de las tiradas de dnd5e 6 para la tabla del d20 y la Moneda Antigua; las tiradas ocultas al DM.
- PF2e: diseño del adaptador con las decisiones del autor y ocho propuestas para aprobar en docs/PF2E_ADAPTADOR.md (tarea 5.2b). Las herramientas de conversión de conjuros pasan a tools/pf2e/ y se usan sobre la instalación local.
- Limpieza: fuera el actualizador de Windows, sus pruebas y el modo privado de publicación; en releases/ solo queda el ZIP de la versión actual.
- Diagnóstico: un caso real nuevo para los compendios (37 en total).

## 3.10.0 — 2026-11-03

- Foundry 14 y dnd5e 6: revisado con el mundo abierto (14.370 y 6.0.6). Ecos lee los mensajes nuevos del chat de dnd5e 6 (tipo y datos propios) y los viejos. Vuelven a funcionar la tabla del d20, la Moneda Antigua en salvaciones de muerte (ya no se ofrece dos veces), la magia que cura heridas sobre los objetivos de la tarjeta y la retirada de objetivos protegidos tras un choque. Las tiradas ocultas de PNJ usan el modo de mensaje nuevo. Efectos, borrados de claves y modos de tirada sin avisos de obsolescencia. Detalle en docs/COMPATIBILIDAD_14.md.
- Estados del Verbe (Empapado, Ardiendo, Desequilibrado, Embarrado, Cargado, Canalizando, Helado) registrados donde dnd5e 6 los busca: vuelven a verse en el HUD del token. Desequilibrado y Embarrado dan su desventaja nativa de dnd5e aunque midi-qol esté apagado.
- Taller de NPC: con dnd5e 6 escribe la CA fija y la velocidad en sus campos nuevos.
- Correcciones: la Mesa Ecos daba un error al abrirse por primera vez; el editor de técnicas del DM no abría.
- Mis técnicas, más interactivo: filtros por tipo (Ataque, Salvación, Curación, Apoyo, Defensa, Cargadas, Favoritas) con su cuenta, estrella para fijar favoritas arriba y en cada técnica las cifras de tu ficha (bono de ataque o CD y característica, daño o curación) y un «Así se resuelve, paso a paso» con lo que pagas, quién tira, qué pasa si impacta o falla, los estados que deja con su explicación, la duración y la concentración. También en Aprender.
- Música: botón «Repetir» para que la canción vuelva a empezar para todos al terminar.
- module.json: verificado con Foundry 14 y dnd5e 6.0.6 (sigue funcionando con Foundry 13 y dnd5e 5.2.5).
- Diagnóstico: tres casos reales nuevos (36 en total).

## 3.9.1 — 2026-11-03

- Actualización nativa de Foundry: el repositorio pasa a público por decisión del autor y `module.json` anuncia el manifiesto estable (`releases/latest/download/module.json`) y el ZIP de cada versión. Foundry avisa y actualiza el módulo solo, desde Módulos → Buscar actualizaciones. El actualizador de Windows (`Ecos-Actualizar.ps1` y su BAT) queda retirado: los Releases ya no lo adjuntan; las copias instaladas se detienen con su BAT («Detener»).
- Sin cambios de reglas ni de catálogo.

## 3.9.0 — 2026-11-03

- Música de YouTube en la mesa: en Mesa Ecos → Control el DM pega un enlace y suena para todos a la vez, en el mismo segundo (quien entra tarde empieza donde va). Reproducir, pausa, seguir, siguiente, detener y una cola de hasta 50 que avanza sola. Cada jugador elige su volumen en los ajustes del módulo y puede silenciarlo solo para él. Usa el reproductor oficial incrustado de YouTube, visible abajo a la izquierda; no descarga audio. Informe de módulos parecidos en docs/MUSICA_YOUTUBE.md (tareas 5.1a–c).
- PF2e: inventario de todo lo atado a dnd5e y midi-qol (fichas, tiradas, actividades, descansos, estados, plantillas, módulos), con estimación de 18 a 26 sesiones, propuesta de capa de sistema y siete decisiones para el autor en docs/PF2E_ACOPLAMIENTO.md (tarea 5.2a). El adaptador espera su aprobación (5.2b).
- Diagnóstico: un caso real nuevo para la música (33 en total).

## 3.8.0 — 2026-11-03

- Magia estándar en el choque: un conjuro ofensivo de D&D se puede interceptar con una técnica. Su potencia es el nivel del espacio y su naturaleza sale del tipo de daño (fuego → Fuego, frío → Agua, relámpago → Rayo, trueno y cortes → Viento, ácido y golpes → Tierra) o de la escuela. Mapa y borrador de lore para aprobar en docs/MAGIA_ESTANDAR.md (tareas 4.1b y 4.1c; 4.1a espera aprobación).
- 20 formas sin elemento (Forma, grados 0 a 5) para quien no tiene naturaleza: proyectiles, filos, escudos, impulsos, redes, muros y estallidos de Verbe. Catálogo: 912 técnicas (tarea 4.3).
- Taller de NPC: 10 plantillas nuevas para Arcegris, la frontera y el bosque (mercader, contrabandista, recaudador imperial, cazador de recompensas, voz de una capilla, desertor, salteador, portador escondido, resonante del bosque y vigía de la Barrera); 17 en total (tareas 4.6a y 4.6b).
- Iconos claros para técnicas y dotes (por naturaleza, tipo de daño, reacción, curación o rama; las dotes por categoría), solo con iconos del sistema dnd5e. Las técnicas con icono propio lo conservan. Guía en docs/ICONOS.md (tareas 4.7a–d).
- Hechizos de PF2e: reglas de conversión en docs/CONVERSION_PF2E.md y macro para exportarlos desde el mundo PF2e (tools/macros/exportar-hechizos-pf2e.js); el filtro y los lotes esperan ese archivo (tareas 4.2a y 4.2c).

## 3.7.0 — 2026-11-03

- Choque en cualquier rama: toda técnica ofensiva puede chocar (Cuerpo, Velo, Umbral, Hilo, mentales…), no solo Forma o elementales. Con ventaja elemental sigue la regla de potencia (+2 grados). Sin ventaja elemental, deciden los dados: Control del Verbe + grado de cada técnica. Regla y ejemplos en docs/CHOQUE_4.md; la Ayuda rápida lo explica (tareas 3.1a y 3.1b).
- La ventana de defensa ofrece cualquier reacción defensiva que sepas (su disparador es recibir un ataque, un golpe, daño o una técnica contra ti), no solo las siete de la lista fija. Las que no tienen automatización se pagan, gastan la reacción y la tarjeta dice qué hacen para que el DM las resuelva (tarea 3.1c).
- 18 contratécnicas originales sin elemento, dos por rama (Cuerpo, Hilo, Velo, Sello, Rastro, Umbral, Quietud, Vasija y Pacto), grados 1 a 4: una reacción defensiva que da CA contra ese ataque (aparece en la ventana de defensa y su bono se aplica solo) y una técnica ofensiva para interceptar en un choque. Catálogo: 879 técnicas (tareas 3.2a–c).
- Técnicas cargadas y el estado «Canalizando»: se canalizan desde el panel (pagas al empezar), cada turno suma carga y desde la mínima se liberan sin volver a pagar con dados, ataque o CD de más. Mientras: velocidad 0, sin reacciones ni choques. Se pierde la carga con daño y una salvación de Constitución fallada (CD 10 o la mitad del daño, la mayor), al quedar incapacitado o con «Dejar de canalizar». 16 técnicas existentes pasan a cargadas (esferas, estrellas, descargas de rayo) y hay 11 nuevas: una por naturaleza de Forma, una por rama que no tenía y una de herencia. Catálogo: 890 técnicas. Auditoría en docs/AUDITORIA_CARGADAS.md (tareas 3.3 y 3.4a–c).
- Clones del Verbe: al usar una técnica de clones se pregunta cuántas copias y cuánto Verbe le das a cada una (o ninguna). El DM crea fichas «Clon de…» con 1 PG (tierra, arena y madera con lo que dice su técnica) y el Verbe que les diste, con tus técnicas, y sus tokens junto a ti. A 0 PG el clon se deshace y su Verbe se pierde; si lo disipas, te vuelve lo que le quede. Al desaparecer, el DM aprueba la tarjeta de recuerdos (lo que hizo, sin experiencia). Nuevas: «Clon de sombra» (rara, grado 5), «Legión de sombras» (rara, grado 8) y la cadena de dotes Clones económicos → Clones múltiples → Legión. Los cuerpos elementales duplicados pasan a este sistema; «Réplica sólida» y «Doble perfecto» siguen como réplicas. Diseño en docs/CLONES.md (tareas 3.5a–e). Catálogo: 892 técnicas y 222 dotes.
- Corrección: las técnicas de Cuerpo (y cualquier golpe de 1,5 m) no tiraban nada porque midi-qol compara el alcance sin convertir metros a pies: un golpe de 1,5 m quedaba «fuera de alcance» contra un objetivo al lado. En un mundo en pies, el alcance y las plantillas de las técnicas pasan a pies en la ficha (1,5 m = 5 pies, 18 m = 60 pies), y al cargar el mundo el DM rearma las fichas despiertas, también los tokens no vinculados.
- Enemigos sin nombres a la vista: barras y nombres de los PNJ solo para su dueño (prototipos y tokens), Health Estimate dice «Alguien» y su letra es más chica (11). Se aplica una vez al cargar el mundo y se puede repetir desde Diagnóstico.
- Diagnóstico: cuatro casos reales nuevos de 3.7 (32 en total).
- Ventanas para que el jugador sepa qué pasa: si una técnica no se puede usar, además del aviso sale una ventana con el motivo. Al usar una técnica que no tira dados (refuerzos de Cuerpo, utilidades), una ventana dice qué quedó activo y que se suma a lo que haga mientras dure.

## 3.6.0 — 2026-11-03

- Etapas del Verbe: nadie lo usa solo. Aprendiz (1 rama, grado 1), Practicante (2 ramas, grado 3), Iniciado (4 ramas, grado 6) y Pleno (sin límite). El DM abre la siguiente etapa cuando el personaje encuentra por rol quién le enseñe (Herramientas del DM → Etapa del Verbe), con registro de quién. Las fichas anteriores quedan en Pleno: no cambia nada para ellas (tarea 2.1).
- Naturaleza oculta: al despertar, el DM elige si la primera naturaleza es secreta (la fija él), la elige el jugador al descubrirla o se sabe desde el principio. Las técnicas elementales no se ven ni se compran hasta descubrirla entrenando: desde nivel 5 (o 3 con Entrenado en Forma) y en etapa Practicante; 3 días, Control del Verbe CD 12 y 2 Trazos si la supera. La segunda: 5 días, CD 14 y 3 Trazos, desde nivel 5. «Probar» ya no descubre gratis. El DM puede revelarla ya o dar por terminados los días (tareas 2.1a–c).
- Técnica nueva «Cambiar naturaleza del Verbe» (Forma, grado 2, nivel 5): 3 Trazos; usarla pide 7 días y Control CD 15 para cambiar una naturaleza por otra. Catálogo: 861 técnicas.
- Repartirse cuesta más: +1 Trazo por rango desde la tercera rama y +2 desde la quinta (tarea 2.4).
- Reserva de Verbe por dados: al despertar, el DM elige tirar o usar el promedio. Con dados, cada nivel suma 1d10 (niveles 1–4), 1d10+4 (5–10), 1d12 (11–16) o 2d10+1 (17–20), sin mínimo; la media queda cerca de la tabla (unos 166 al nivel 20) pero dos personajes salen distintos. El DM tira al despertar y en cada subida, y el resultado sale en el chat con registro. Las fichas anteriores siguen con la tabla; si el DM las pasa a dados, lo que ya tenían queda fijo. La sangre divina sigue calculando sobre la tabla (tareas 2.2a–c).
- Oponentes impredecibles: Mesa Ecos → Diagnóstico revisa y oculta las barras de vida de los PNJ (prototipos y tokens ya puestos), deja sus fichas en «Limitado» y oculta la CA del objetivo en los ataques si dnd5e lo permite; los PNJ nuevos nacen con la barra oculta. Taller de NPC: «Verbe variable» mueve PG, CA, daño y reserva dentro de un margen (10 %–25 % según sus rangos). «Leer el Verbe de los marcados» con técnicas de Rastro da tramos (llena, a medias, baja; más débil o más fuerte; herido o a punto de caer), nunca cifras; «Ver todo el Verbe» ya no dice cuánto le queda exacto. Guía en docs/OPONENTES_IMPREDECIBLES.md (tareas 2.3a–c).
- Curación y heridas (auditoría en docs/AUDITORIA_CURACION.md): el botón Curar suma +1 por rango de Pulso desde Experto y aplica la ventaja de Médico del Verbe, que su texto prometía y no se aplicaba. Superar la CD por 5 o más cuenta dos días de tratamiento. Con el ajuste «Heridas graves piden reposo» (encendido), la magia que cura heridas cuenta como el tratamiento del día con dos días de avance, y no avanza si ese día hubo combate, viaje forzado o trabajo pesado, en vez de borrar un nivel de Herida No Tratada al instante (tareas 2.6a y 2.6b).
- Diagnóstico: cinco casos reales nuevos de 3.6 (28 en total).
- Una sola sangre por personaje: sangre, familia y herencia son lo mismo. Una Mirada heredada es su sangre (una Mirada sin linaje queda registrada como tal); un ojo trasplantado y un Pacto no cuentan. El panel no deja dar una segunda sangre y avisa al DM, una vez, de las fichas que ya tenían dos, sin cambiar nada (tarea 2.5a).
- Bloque «Sangre de…» en el Inicio del panel del Verbe, solo para el DM: qué sangre tiene (o si es secreta), qué técnicas familiares puede aprender ya y qué las bloquea, con botones a «Mundo 10 · El Verbe por dentro», «Reglas ocultas de la Sangre» y «Manual del DM del módulo». Botón «Activar técnicas familiares» para cuando la descubre por rol, con nota y registro (tareas 2.5b y 2.5c).

## 3.5.0 — 2026-11-03

- Validador de técnicas (`npm run validate:techniques` y Diagnóstico de Mesa Ecos, solo DM): áreas sin plantilla, plantillas sin tamaño, daño o salvación que recaen en quien la usa, y técnicas sin acción, alcance o duración. Revisa catálogo, técnicas del mundo y propias de cada ficha (tarea 1.1).
- 79 técnicas corregidas: «Aliento de brasa» y las demás áreas con origen en ti ya no te alcanzan ni te eligen como objetivo; las áreas descritas sin plantilla la tienen; los «tu próximo golpe suma…» son ahora un efecto sobre ti que se gasta en el siguiente impacto (con los dados de más por rango, afinidad y grado de lanzamiento); los golpes a varios objetivos eligen criaturas. Las plantillas en metros se convierten a pies cuando la escena mide en pies (1,5 m = 5 pies). Sin probar en Foundry real (tarea 1.2).
- Descanso Corto: ya no devuelve Dados de Golpe, solo deja gastarlos para curarse (se recuperan con el Largo). Los ajustes guardados se corrigen una vez; el DM puede volver a subirlo en «Descansos y Dados de Golpe». La ventana para gastar suma «Gastar hasta el tope» (el dado más grande primero, hasta el tope del descanso o los PG llenos) y avisa cuánto curó o si Malherido no deja subir.
- Naturaleza de nacimiento (la primera que despertó): sus técnicas e infusiones cuestan 1 Verbe menos, mínimo 1. Explicado en la Ayuda.
- Defensas contra ataques de PNJ: fuera de combate la reacción ya no queda «gastada» para siempre (la marca de midi-qol no caducaba sin turnos), así que Sustitución se vuelve a ofrecer. Si conoces una defensa pero no puedes usarla (sin Verbe, sin reacción, Agotamiento 4), el chat te dice por qué y cuánto costaría, con el extra por ser un ataque más grande. En las fichas, un área con origen en ti dice «desde ti» en vez de «sobre ti».
- Editor del DM (Mesa Ecos → Dirección → «Editar técnicas», o Taller del DM): borrar técnicas del mundo (solo del catálogo, o también de las fichas que la saben) y técnicas propias de cada ficha; cada publicación pasa por el validador (tareas 1.3 y 1.4a).
- Cambiar el catálogo del módulo: nombre, texto, coste, Trazos, nivel, tiempo, alcance, área y dados de cualquier técnica, y nombre, texto y Trazos de cualquier dote. Se guarda solo la diferencia en el mundo (sobrevive a actualizar o reinstalar), las fichas que la saben se rearman solas y «Restaurar original» la deshace. Reliquias y hechizos se abren en el editor de dnd5e (tareas 1.4b y 1.4c).
- Ventaja o desventaja en cada ataque: siempre se abre la ventana de dnd5e para elegir Normal, Ventaja o Desventaja, aunque midi-qol tire rápido; si el sistema la detecta, la ventana lo dice y pregunta si la usas. La ve quien controla al atacante. Ajuste «Preguntar ventaja en cada ataque» (tarea 1.5).
- Preguntar antes de aplicar estados: cuando un ataque, salvación o técnica va a poner un estado en otra criatura, quien ataca ve «¿Aplicar…?» con lo que provoca y elige a quién; con varios objetivos se pregunta una vez. Si ataca un PNJ, el jugador que defiende recibe el aviso; si el jugador no responde, decide el DM. Ajuste «Preguntar antes de aplicar estados» (tarea 1.6).
- Pausa para la Moneda Antigua: después de tirar y antes de aplicar el resultado, un PJ que falla un ataque o una salvación (o saca un 1) puede gastar una para repetir; queda en la tarjeta y en el recibo. Ajuste «Pausa para la Moneda Antigua»: al fallar, solo con un 1 o nunca (tarea 1.7).
- Devolver Verbe (solo DM): en Dirección y en cada tarjeta de técnica, una cantidad a mano con motivo; no pasa del máximo, queda en la tarjeta, en el historial de la ficha y en «Últimas devoluciones» (tarea 1.8).
- Diagnóstico: ocho casos reales nuevos de 3.5 para probar en Foundry (23 en total). Nada de esta versión está probado todavía en Foundry real.

## 3.4.1 — 2026-11-01

- Botón «Verbe» en la barra izquierda (grupo Tokens): lista rápida de técnicas aprendidas para usarlas sin abrir la hoja. Sin probar en Foundry real.

- Documentación: `docs/MAPA_CODIGO.md` con archivo, función y línea de cada tema del código (tarea 0.1; sin cambio de versión).

## 3.4.0 — 2026-10-31

- Creación verificada por estructura, nivel, elecciones duplicadas, valores base, PG, recursos y avances nativos consultables. El DM confirma los apartados manuales y decide activar Ecos; el Verbe conserva su concesión independiente. La aprobación detecta cambios posteriores de construcción.
- Intenciones de juego con requisitos y costes propios, hasta ocho sugerencias y apertura del Verbe filtrado. La búsqueda relaciona fuentes por coincidencias dentro del conjunto permitido y acotado; no inventa vínculos de canon ni revela fuentes privadas.
- Recibos sobre la tarjeta nativa: gasto confirmado, defensas, choques y revisión de mesa. Corrección exclusiva del Verbe de usos simples, por el GM principal, condicionada al último uso y reserva sin cambios. No revierte daño, efectos, movimiento o acciones; recursos complejos requieren revisión manual.
- Revisión de capacidades de NPC: actividades legibles, fórmulas, Multiataque, áreas, control, magia, resistencias, inmunidades y acciones extraordinarias. Siete plantillas narrativas y calculadora de presión con grupo, cantidades, rutina, ataque y blancos de área. Conserva las acciones importadas y muestra límites del cálculo.
- Memoria de Nimerios: 174 entradas para adoptar o editar en un cuaderno privado, con referencias del panteón conservadas, vínculos del catálogo y relatos nuevos propuestos. Las páginas existentes no se sobrescriben. Los relatos de reliquia actualizan solo explicaciones generadas reconocidas, sin reiniciar estado.
- Diagnóstico de versiones y capacidades; informe técnico sin nombres, diarios, rutas o credenciales. Quince casos reales inicialmente pendientes, con registro de resultados y notas en un diario privado. El informe del DM incluye estados de casos, sin sus notas.
- Claves de panel por UUID para separar tokens no vinculados; vencimiento y migración de reliquias alcanzan instancias presentes en combate o escena.
- 96 secuencias de tres encuentros/tareas en niveles 1, 5, 11, 16, 18 y 20, cuatro planes y cuatro linajes, con compras y consumo reales del adaptador. Se mantiene la potencia estructurada de las 778 técnicas previas. Las victorias y la experiencia de juego quedan para las pruebas reales del autor.
- Vistas HTML ampliadas con las diez pestañas de Mesa Ecos y un recibo de ejemplo. Regresiones para creación, permisos, propuestas, diagnóstico, recursos, recibos y actores sintéticos.


## 3.3.0 — 2026-10-31

- Identidad de Nimerios para nombres visibles, alias y referencias de técnicas, entidades y reliquias. Conserva identificadores, vínculos, compras, autorizaciones y cargas. Las reliquias y artefactos entregados migran nombres generados conocidos y conservan personalizaciones del DM. Nueva página privada para revisar el panteón sin reemplazar el lore escrito.
- 82 técnicas originales de vida cotidiana y rol: Umbral +16, Rastro +14, Pulso +12, Quietud +12, Vasija +8, Velo/Mirada/Pacto/Hilo +4 cada una, Cuerpo/Sello +2 cada una. Grados 0–3, tiempos y límites explícitos. Total: 860 técnicas, 219 dotes y 78 reliquias.
- Tablas de 1 y 20 natural: 64 filas, cuatro contextos, escala de nivel, primer d20 válido por criatura y turno, frecuencia de diez minutos fuera de combate y aprobación del GM principal. Conserva resultados normales y visibilidad de tiradas. CA y velocidad tienen efectos temporales sin acumulación; otras consecuencias se resuelven en mesa. Excluye muerte, iniciativa, Concentración y Control de choques.
- Mesa Ecos con interfaz de pergamino, seis tareas, desplazamiento y acceso desde ficha, Ajustes o Ctrl + M. Lista personal del turno, ocho accesos, recursos, estados, tiradas nativas y recordatorios de ficha.
- Creación guiada con permisos de actor y reparto estándar sin repeticiones. Abre la API pública de Plutonium en los modos reales de clase, especie, trasfondo y equipo, dirigida a la ficha. No modifica fuentes, ajustes ni funciones de suscripción.
- Buscador local con fuentes: filtra permisos de diarios, páginas, actores, objetos y compendios; el DM consulta repertorio y reliquias completos. Dirección muestra el grupo, abre un cuaderno privado y permite revisar efectos de Ecos.
- Taller de NPC: base importada o creación sin base, roles, motivación, vínculo, vista previa, copia privada por defecto, proporción de vida, conversión de unidades, rutina ofensiva alternativa y reversión de la última adaptación. Conserva acciones importadas; sus capacidades especiales requieren revisión del DM.
- Regresiones nuevas para identidad, permisos, búsqueda, Plutonium, NPC, d20, visibilidad y frecuencia. Las 778 técnicas anteriores conservan su huella individual de potencia. Vistas HTML reales con datos ficticios; pendiente la comprobación funcional dentro del Foundry instalado.

# Cambios

## 3.2.1 — Lectura guiada para la primera partida

- Las 778 técnicas tienen bloques «Qué hace», «Cómo se usa» y «Qué cuesta» en su ficha de la hoja. El panel separa aprendizaje y uso, explica quién tira, amplía abreviaturas y conserva el efecto completo y sus límites en un desplegable. Las referencias divinas dejan de mostrar páginas inexistentes y no revelan el nombre de la deidad al jugador desde la referencia.
- Ayuda rápida organizada por situaciones: primera escena, botones bloqueados, ataque o salvación, acciones, choques, deuda, descansos, mejoras, sendas, reliquias y heridas. Glosario y ejemplo concreto para distinguir nivel, grado, rango, Maestro y Maestría. Los choques se explican en cinco pasos.
- El panel muestra usos altos restantes en lugar de una fracción ambigua y aparta esa información cuando el personaje aún no dispone de ellos. Aclara que una mejora sugerida no está comprada, que las tiradas ya incluyen sus bonificaciones y que el aviso de bloqueo muestra el primer requisito pendiente.
- Cultivo e infusión explicados por separado, con el precio completo en cada opción y un aviso cuando no quedan mejoras compatibles. La consulta de sangre Plena muestra el crecimiento en una tabla por nivel. Las dotes ya presentes en la hoja reciben su explicación actualizada conservando los usos gastados.
- Las 78 reliquias separan preparación, carga, familia, uso mayor, permiso ritual y procedencia. El catálogo del DM guía la entrega y la búsqueda abre los grupos con resultados. Las descripciones generadas conocidas se actualizan en compendio y copias; las personalizaciones del DM, permisos, efectos y cargas se conservan.
- Aclaradas las utilidades que requieren resolución de mesa y el presupuesto breve de Marea interior. Sustitución refleja conserva su renovación por Corto; no se presenta como una renovación de todos los poderes. La recuperación nocturna de la ayuda contempla los multiplicadores y dotes reales del personaje.
- 178 pruebas Node y auditoría de 31.120 fichas de técnica. Las pruebas de actualización textual comprueban que no se repongan cargas ni permisos y que se conserven notas personalizadas.
- Auditoría de texto reproducible y huella de reglas comparada con 3.2.0: costes, niveles, requisitos, actividades, efectos y linajes estructurados conservados. Continúa pendiente la comprobación visual y funcional dentro del Foundry instalado.

## 3.2.0 — Sangre divina, choques y reliquias

- Sangres de seis dioses primigenios por encima de los menores: reserva y defensas progresivas, atenuadas por la fuerza de sangre. Maethra es la mayor y tiene el techo más alto, siete técnicas nuevas propias y culminaciones con sangre plena e hitos del DM. Asignar o subir un linaje no rellena su energía.
- Se completa el panteón con Nerys, Ashka, Gracefeel y el Cazador Sin Rostro; Seyra y Dhoren son dos dioses menores nuevos, marcados como propuesta. 22 entradas, seis herencias nuevas y 24 técnicas divinas: 778 técnicas y 219 dotes en total. Los niveles, sendas, cuotas y descansos siguen vigentes.
- Nota privada del panteón dentro del módulo con pendientes concretos para Mundo 1, Mundo 10 y las tramas de portadores. No reemplaza las páginas de lore ni las notas editadas por el DM. Los pasivos existentes se actualizan al subir de nivel o cambiar de sangre.
- Choque automático al dirigir una técnica ofensiva elemental o de Forma a otra hoja despierta; basta una marca en una dirección. Primero se ofrecen Sustitución y defensas, luego una contratécnica elegida por el defensor. El choque es independiente de la reacción y de la acción ordinaria; paga Verbe, conserva requisitos y usos, y no concede otro ataque. Cada defensor protege solo a sí mismo frente a un área. Ayuda rápida explica el disparador y toda la secuencia.
- Integración con midi-qol para retirar objetivos protegidos antes del daño; el flujo nativo pausa la continuación mientras se resuelve el enfrentamiento. Sin midi, el daño y las condiciones que requieran aplicación manual se resuelven siguiendo la tarjeta. Control de duplicados, respuesta tardía y validación de consumo de la contratécnica.
- 78 perfiles de reliquias: 51 entradas de serie/componentes/dispositivos de Made in Abyss, 11 perfiles del videojuego y 16 originales de Nimerios. Fuentes y procedencia separadas; reglas d20 nuevas, grados desconocidos conservados y funciones poco documentadas identificadas. Reg y Aubade son dossiers, no equipo. No se promete exhaustividad de variantes del videojuego o futuras publicaciones.
- Compendio mundial y diario privados de reliquias, añadidos sin reemplazar ediciones del DM. Entrega y autorización desde la pestaña DM. Nivel mínimo, equipo, sintonía, cargos nativos, familia compartida y un uso de reliquia mayor por Largo; rituales con permiso de un solo uso. Un corto no renueva esos usos; los consumibles no se recargan.

- Validación de 176 pruebas Node, auditoría de 31.120 fichas en niveles 1–20 y paquete reproducible. La ejecución real en Foundry con los módulos de campaña sigue pendiente. Se mantiene la publicación privada y el actualizador de Windows con avisos.
- La consulta «Linajes y fuerzas antes de asignar» tiene altura limitada y desplazamiento vertical propio, también accesible con teclado.
- La ventana de Despertar se puede redimensionar, se limita al tamaño de la pantalla y permite recorrer el formulario sin perder los botones de confirmación.

## 3.1.0 — Dotes, sendas y escalas de obtención

- 64 dotes nuevas: 219 en total y 754 técnicas conservadas. Cuatro pasos por cada una de las trece ramas: Disciplina (nivel 3), Especialista (7), Maestría (11) y Leyenda (18), con beneficios propios. Doce mejoras generales incluyen ascensiones, cultivo, réplicas, depósito y acciones defensivas o curativas.
- Grado 6 desde nivel 11 y Maestría de su senda; grado 8 desde 16; grado 9 desde 18 y Leyenda; grado 10 desde 19 y Ascensión mítica; grado 11 desde 20 y Ascensión trascendente. Las ascensiones necesitan pruebas de historia del DM. Once caminos concretos enlazan formas y técnicas fuertes con sus etapas anteriores.
- Escalado numérico limitado a base +3, ampliable hasta +5 con especialización; respeta nivel, rango y senda. Dados extra limitados por grado, CD adicional máxima +2 y bonos de curación múltiple repartidos. Los descuentos conservan un mínimo del 50 % del coste en grados 1–5 y del 70 % en 6–11.
- Usos compartidos de poderes mayores y culminaciones además del uso individual por técnica; solo una técnica de grado 11 por largo. Máximo dos técnicas de acción/AA y una de grado 6 o más por turno. Reacciones y formación de réplicas mantienen sus límites separados. No se conceden acciones adicionales por estos topes.
- Actividades propias y usos diarios para las Maestrías, nuevas dotes activables y varias recuperaciones antiguas. Segundo aliento, Última gota, Beber del aire y Reserva de guerra consumen el presupuesto breve; los cortos no renuevan usos diarios. Respirar el mundo también respeta ese presupuesto.
- Dos hilos comprueba la segunda Concentración y los efectos propios se ligan a la técnica correcta. El cultivo de rapidez no convierte rituales en acciones. Se limitan aumentos conjuntos de alcance y área, y se sincroniza la duración de efectos propios cuando corresponde.
- Reparados los modos compuestos y el requisito de avatar de Corona. Renovación del centenar consume todo su depósito, mínimo 16 Verbe, sin devolverlo a la reserva ordinaria. Los requisitos de dotes antiguas quedan declarados y sus beneficios registrados se desactivan cuando dejan de cumplirse.
- Migración sin cobros retrospectivos: se conservan compras y técnicas altas anteriores como legadas; respetan nivel y cupos actuales. Los usos ya gastados se contabilizan. El DM puede reorientar el último cultivo registrado sin nuevo cargo. Devolver dotes no habilita un atajo para los poderes nuevos.
- Auditoría reproducible de las 754 técnicas en niveles 1–20, con perfiles normal y de tensión: 30.160 fichas. Pruebas de reglas, migraciones y actividad nativa simulada; publicación condicionada a Windows, validación y paquete. La comprobación en una partida real de Foundry sigue pendiente. Se mantiene el repositorio privado y el BAT con avisos.

## 3.0.0 — Repertorio shinobi y avisos de actualización

- 754 técnicas: se conservan las 401 anteriores y se añaden 353 adaptaciones del estudio Naruto/Shippuden, 327 fuera de Forma. Nuevas ramas Umbral y Vasija; más genjutsu, taijutsu, sellado, marionetas, medicina, rastreo, senjutsu, ojos, contratos y huéspedes. Referencia original buscable, página, requisitos, límites y alcance de automatización por ficha.
- Accesos separados para tradiciones, herencias, ojos/etapas, hitos, bestias/vínculos, modos y reliquias. El DM concede accesos, 17 objetos excepcionales y permisos rituales de un solo uso desde su pestaña. No se regalan todos los poderes de un ojo o bestia por conceder el acceso.
- Réplicas físicas con energía dividida realmente y acción conjunta; depósito real del Sello del centenar; familias de usos, desgaste/sacrificio ocular persistentes y transferencias de energía sin duplicación. Efectos propios de transformación y regeneración conectados a actividades y curación nativa.
- Ocho Cerrojos: el séptimo deja de ser fatal y la Puerta de la Muerte pasa al octavo. Migración de quienes conocían el antiguo séptimo, conservando compras y Trazos. Tormenta usa Agua + Rayo; se conservan combinaciones previamente concedidas y el lore de Nimerios.
- Reparadas reacciones, mitad en salvación, el estado erróneo de Cambio de mente y las descripciones contradictorias de clones. Unidades válidas de duración en cultivo y límite a la regeneración repetida de Verbe.
- El BAT instala un notificador silencioso: globo de Windows solo después de instalar una versión nueva, con última versión y fecha consultables en Estado. Para habilitarlo en una instalación anterior, descargar el BAT nuevo y pulsar Activar una vez; no requiere repetir la configuración ni el acceso de GitHub.
- Pruebas del repertorio, migración, energía, requisitos, permisos, interfaz y actualizador en Windows; catálogo reproducible y paquete privado. Sacrificios, rituales, NPC invocados, marcas y posición conservan resolución del DM. Pendiente comprobación en Foundry con los módulos de campaña.

## 2.10.0 — Taller del DM y progresión clara

- Cambiar verde por pergamino, gris y carbón; corregir las tarjetas de elementos con altura automática y distribución adaptable.
- Explicar linajes y fuerzas antes de asignarlos, incluyendo herencia, Despertar, naturalezas, tope de grado y recargos.
- Cerrar naturalezas ajenas al conocer dos, elegir la tercera por dote y abrir combinaciones compatibles con todas sus técnicas y requisitos. Conservar dones del DM y del linaje.
- Ofrecer entrenamiento compatible con la actividad, precios por potencia y topes; añadir duración, contacto, componentes y dos opciones específicas para Sustitución. Conservar compras anteriores.
- Añadir taller exclusivo del DM: publicación universal sin cobrar ni enseñar al actor seleccionado; curación, estados, requisitos, geometría, materiales, escalado, edición, duplicado y retirada.
- Limitar la recuperación acumulada de cortos: DG hasta la mitad de un largo; Verbe compartido entre Respiro, Aliento e intemperie, con ampliación por Sueño reparador siempre inferior al largo. Solo el largo renueva estos presupuestos y poderes diarios.
- Conservar Trazos; resolver el hueco de grado 8 en Maestro sin adelantar sus dones. Documentar construcciones reales en niveles 1, 5, 11, 16, 18 y 20.
- Incluir el BAT y el arranque silencioso de 2.9.3; mantener privados repositorio y Releases.
- Validar regresiones con documentos simulados, Windows, catálogo, informes, vista previa HTML y empaquetado. La comprobación visual en la mesa sigue siendo necesaria. Detalle: `docs/REVISION_2.10.md`.

## 2.9.3 — Control de actualizaciones y arranque silencioso

- Adjuntar `Ecos-Autoactualizacion.bat`: activar, detener y consultar la tarea desde un menú, sin borrar módulo, sesión ni respaldos.
- Al activar, corregir también las tareas de 2.9.2: usar un lanzador sin consola para impedir las ventanas periódicas de PowerShell. Recrear la tarea si fue quitada con `-Remove`.
- Detener pausa las comprobaciones futuras; una instalación ya iniciada termina para conservar la integridad de los archivos.
- El instalador nuevo usa el mismo arranque silencioso. Comprobar ambos en Windows PowerShell 5.1 con datos ficticios.
- Esta entrega solo cambia el ayudante de Windows; la revisión de interfaz, creación, naturalezas y descansos sigue en desarrollo.

## 2.9.2 — Actualizaciones privadas en Windows

- Mantener privados el repositorio y los Releases por decisión expresa del autor.
- Añadir un actualizador de configuración inicial única con GitHub CLI y una tarea del usuario cada cinco minutos.
- Consultar versiones estables terminadas, comprobar SHA-256, identificador, versión y rutas del ZIP; posponer si se detecta Foundry abierto.
- Respaldar el módulo anterior y las bases de datos de mundos antes de intercambiar carpetas; restaurar el módulo anterior si falla el intercambio.
- Adjuntar el instalador al Release privado y verificarlo en Windows PowerShell antes de publicar.
- Retirar enlaces nativos sin autenticación: la actualización privada se realiza por el ayudante local, no por un enlace público.
- Mantener interfaz, técnicas, dotes y mecánicas de 2.9.1.

## 2.9.1 — Preparación de instalación por manifiesto

- Añadir `url`, `manifest` estable y `download` ligado a la versión del módulo.
- Adjuntar `module.json` y el ZIP antes de publicar cada Release.
- Validar que el manifiesto apunte al paquete de su propia versión; conservar archivos ya publicados.
- Documentar la instalación por URL y el bloqueo de acceso del repositorio privado. No cambia la visibilidad del repositorio.
- Conservar la interfaz, las mecánicas y los personajes de 2.9.0. Los commits de trabajo no son el canal de actualización.

## 2.9.0 — Interfaz para aprender jugando

- Inicio por pasos: elemento, especialidad, primera técnica y acceso al repertorio. El progreso se deduce del personaje existente; también reconoce técnicas regaladas.
- Recursos separados con explicaciones: Verbe para actuar, Trazos para aprender.
- Mis técnicas con efecto, acción, alcance, coste actual, energía restante, bloqueos y acceso al uso nativo de dnd5e. No se descuenta energía desde un cálculo paralelo de interfaz.
- Las defensas reactivas explican su disparador y la integración con midi-qol; no se ejecutan como utilidades anticipadas desde el botón de uso.
- Sugerencias iniciales que respetan requisitos, naturaleza, Trazos y visibilidad. No compran ni eligen por el jugador.
- Aprender muestra gasto de Trazos y coste por uso por separado. Filtros adicionales plegados, búsqueda y saldo después de comprar.
- Mejoras agrupadas en Especialidades, Dotes, Entrenar e Inventar. Requisitos y falta de Trazos visibles; dones y detalles extensos plegados.
- Ayuda rápida con respuestas breves sobre uso, recursos, turnos, descanso, heridas, sobreesfuerzo y resolución del DM.
- Avisos por estado, diseño adaptable al ancho del panel, tema claro/oscuro, foco de teclado y estados expresados con texto además de color.
- Vista previa independiente con datos ficticios y pruebas de interfaz/uso. Se conserva el catálogo y la progresión de 2.8.

## 2.8.0 — Base de mantenimiento del Verbe

- Separación de reglas puras, efectos y medicina del adaptador de Foundry. Sin técnicas ni dotes nuevas.
- Gasto coherente en técnicas, reacciones y Cerrojos: incapacidad, Agotamiento 4, límite negativo y sobreesfuerzo.
- Recuperación de deuda a 2:1 en descansos, monedas y Dados de Golpe, conservando el crédito impar.
- Compras serializadas por actor en cada cliente; protección frente a doble clic y activaciones simultáneas. Compensación si falla guardar aprendizaje, defensa o Cerrojo.
- Revalidación de requisitos al aprobar. Los pedidos fallidos se conservan; se limitan duplicados, tamaño y acciones del protocolo del Verbe.
- Escalado limitado por rama y nivel. Un uso alto por técnica y Descanso Largo, también al elevar técnicas bajas.
- Palma que cierra escala +2d8 correctamente y enlaza con el tratamiento diario. Enlaces de Pulso con HNT y estabilización mediante confirmación del DM.
- Los 22 objetos de grado 10/11 conservan su nivel real. Refresco en el mismo documento, preservando identificadores y usos gastados.
- Cuerpo templado automático; desventajas de Desequilibrado/Embarrado; reacción de Cargado y ventaja metálica separadas; Helado convierte unidades e inmoviliza con efecto propio; agua/tierra apagan Ardiendo.
- Cerrojos contados entre Descansos Largos. La actualización de un Cerrojo conserva el efecto y no provoca su cierre.
- Choques con +2 grados por ventaja elemental; modo clásico disponible en ajustes.
- Creador con presupuesto verificable, límites de geometría/estados/daño sostenido, excepciones justificadas del DM. Oro y entrenamiento señalados expresamente como resolución en mesa.
- Pruebas locales, validación del catálogo completo, informes reproducibles, flujo de GitHub Actions y ZIP determinista.

La migración no borra compras ni técnicas propias del mundo. Reinicia una vez el contador antiguo de Cerrojos, el crédito de recuperación y el indicador de reacción. Los PDF originales se conservan; las decisiones nuevas están en `docs/BASE_ESTABLE_2.8.md` y en la guía generada del módulo.

## 2.7.5 — Referencia importada

Archivo original del autor, preservado en el commit `1219db85892189ca61656893e035ba8c40791094`. Auditoría inicial añadida después, sin alterar entonces el módulo.
