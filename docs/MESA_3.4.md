# Preparación de mesa · 3.4.0

Abre **Mesa Ecos** desde la ficha, Ajustes o **Ctrl + M**. Esta versión prepara la campaña para que el autor comience sus pruebas reales. Las comprobaciones de código y las simulaciones no marcan como superado ningún caso dentro de Foundry.

## Para crear un personaje

En **Crear personaje**, importa clase, especie, trasfondo y equipo una vez cada uno. Termina los diálogos de avance de Plutonium o del sistema y pulsa **Revisar progreso**.

La comprobación detecta niveles de clase incompatibles con el nivel de ficha, clases o elecciones de origen repetidas, valores base inválidos, PG incoherentes, recursos fuera de su máximo y avances nativos pendientes. Cuando una integración no permite comprobar una elección, el panel la señala para revisión.

El DM confirma competencias, equipo, aumentos de origen y avances. Elige explícitamente si activa **Ecos**, que controla las reglas de PJ como heridas y descansos. Eso **no despierta el Verbe**: el linaje, la fuerza y el despertar se conceden en su panel aparte. La aprobación guarda una huella de la configuración y pide revisión cuando cambian sus elecciones. Gastar PG no invalida por sí solo la aprobación.

El asistente ayuda a comprobar la construcción; no sustituye los diálogos nativos ni certifica todas las excepciones de reglas, multiclase o contenido propio.

## Para encontrar qué hacer

**Qué quiero hacer** propone hasta ocho técnicas para proteger, cuidar, controlar, investigar, viajar, conversar, trabajar, explorar o atacar. Prioriza lo aprendido y los requisitos cumplidos. Muestra grado, coste de uso para la ficha, Trazos de aprendizaje y motivo de bloqueo. El botón abre el Verbe filtrado por esa técnica; no compra ni activa nada por su cuenta.

**Buscar información** conserva el filtro de permisos. Para los primeros resultados puede sugerir fuentes con nombres o temas coincidentes, dentro de un conjunto acotado para evitar cargar todo el mundo repetidamente. Las coincidencias ayudan a investigar: no prueban relaciones de canon ni inventan respuestas. Un jugador solo abre documentos que pueda observar.

## Para resolver una técnica

El **recibo de resolución** acompaña la tarjeta nativa. Indica grado, Verbe anterior y posterior, gasto confirmado y pasos de defensa o choque que el flujo haya registrado. Con Midi-QOL puede añadir el cierre de sus tiradas; nunca vuelve a aplicar daño por escribir el recibo.

Las consecuencias que no puede comprobar quedan visibles como pendientes. El DM puede registrar que revisó estados, posiciones y demás resultados de mesa, con una nota. Registrar esa revisión no cambia automáticamente las fichas.

El GM principal dispone de **Corregir solo gasto de Verbe** para un uso simple verificable: debe ser el último uso del actor y su reserva debe seguir como la dejó la actividad. No restaura daño, efectos, posiciones, acciones o reacciones. Un poder alto, deuda, réplica, ritual o recurso especial bloquea esa corrección automática y necesita revisión manual. Después de corregir un recibo no puede corregirse otra vez.

Las ventanas del Verbe se identifican por la instancia completa del actor para separar tokens no vinculados. El vencimiento de efectos de reliquia incluye instancias presentes en combate o escena, además de los actores del mundo.

## Para preparar NPC y encuentros

El **Taller de NPC** añade siete plantillas narrativas: habitante/oficio, guardián, explorador, investigador del Verbe, cuidador, jefe de formación y huésped de entidad. Proponen rol y motivación sin conceder poderes, técnicas o acciones gratuitas.

La revisión muestra actividades legibles y media de daño por blanco cuando puede calcularla. Señala Multiataque, áreas, efectos de control, magia, resistencias, inmunidades, usos limitados, acciones extraordinarias y Verbe despierto. Una fórmula dinámica desconocida queda sin cálculo fiable. Los ataques importados permanecen intactos; la rutina de Ecos sigue siendo una alternativa para la acción completa.

En **Encuentros**, selecciona personajes con propiedad de jugador y añade NPC con cantidad. Puedes corregir daño de rutina por ronda, ataque y blancos de área. El panel expone los PG máximos del grupo, la CA media y la hipótesis de impacto. Para salvaciones u otros casos usa daño esperado ya ajustado: no vuelve a multiplicarlo por probabilidad de ataque. El índice expresa daño esperado por ronda como fracción de los PG del grupo.

Ese índice es una herramienta de Nimerios, no el cálculo oficial de dificultad ni una garantía de victoria. No incluye críticos, curación, cobertura, resistencias, control, choques o recursos diarios. Revisa las capacidades señaladas antes de decidir la dificultad real. El panel no modifica ni coloca actores o tokens.

## Para consolidar el mundo

**Identidad de Nimerios** reúne 174 entradas: 13 ramas, 33 tradiciones, 11 entidades vinculadas, 22 entradas del panteón, 17 artefactos y 78 reliquias. Las referencias del panteón conservan su contenido y jerarquía; los relatos nuevos son propuestas.

Puedes adoptar, descartar o abrir cada propuesta en un cuaderno privado editable. Las páginas existentes no se reemplazan. La adopción se registra en ese cuaderno y no reescribe por sí sola los libros de lore, los PDF o la información pública. Los vínculos entre ramas, tradiciones y artefactos se apoyan en los requisitos del catálogo. Las comunidades y rutas se pueden situar en cualquier región de Nimerios.

Las reliquias incorporan un relato propuesto a su explicación generada. Solo se actualizan descripciones reconocidas; las notas personalizadas se conservan junto a cargas, equipo y autorizaciones.

## Para empezar tus pruebas reales

Ve a **Diagnóstico y pruebas**. Comprueba versión de Foundry, sistema e integraciones; descarga el informe técnico si necesitas registrar un problema. Omite nombres, diarios, rutas y credenciales; el DM puede incluir estados de casos, sin sus notas privadas.

El recorrido contiene quince casos, inicialmente pendientes. Guarda cada resultado en el cuaderno privado después de probarlo. Usa copias o un mundo con respaldo y una sesión de DM separada de la del jugador.

Consulta [el recorrido completo](PRUEBAS_REALES_3.4.md), [los 96 ensayos de recursos](ENSAYO_SESIONES_3.4.md), [las propuestas de identidad](MEMORIA_NIMERIOS_3.4.md) y [la auditoría textual](AUDITORIA_TEXTUAL_3.4.0.md).

## Referencias de integración

La revisión de avances utiliza `configuredForLevel` cuando lo ofrece [Advancement de dnd5e 5.2.5](https://github.com/foundryvtt/dnd5e/blob/release-5.2.5/module/documents/advancement/advancement.mjs). Las tarjetas y consumos siguen las actividades nativas de ese sistema. La importación usa la API pública ya presente de [Plutonium para Foundry 13](https://github.com/TheGiddyLimit/plutonium-next/blob/master/module-foundry13.json). Los documentos y compendios conservan los [permisos de Foundry 13](https://foundryvtt.com/api/v13/classes/foundry.documents.collections.CompendiumCollection.html).
