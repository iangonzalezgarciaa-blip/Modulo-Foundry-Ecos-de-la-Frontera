# Historial de cambios

## Sin publicar

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
