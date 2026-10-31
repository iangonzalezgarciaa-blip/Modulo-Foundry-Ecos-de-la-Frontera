# Mesa de campaña · 3.3.0

Abre **Mesa Ecos** en la cabecera de una ficha, pulsa **Ctrl + M**, o entra en Ajustes → Mesa de campaña de Ecos. Elige arriba la ficha que quieres utilizar. Encontrarás seis tareas; Dirección y Taller de NPC solo aparecen para el DM.

| Quiero… | Pestaña | Qué hago |
|---|---|---|
| Jugar mi turno | Mi turno | Reviso PG, CA y estados; abro mis accesos frecuentes y tiro desde el sistema. |
| Crear un personaje | Crear personaje | Creo una ficha, importo una elección cada vez y reviso los avances. |
| Encontrar una regla o pista | Buscar información | Escribo las palabras; leo el extracto y abro su fuente. |
| Entender mi 1 o 20 | Dados 1 y 20 | Consulto la tabla; el DM aprueba o descarta la propuesta del chat. |
| Preparar la sesión | Dirección | Reviso el grupo, abro el cuaderno privado y reviso efectos de Ecos. |
| Reutilizar un NPC | Taller de NPC | Elijo base y rol, preparo la vista previa y guardo una copia. |

## Qué cambia en los nombres

Las técnicas, entidades y reliquias del catálogo utilizan nombres de Nimerios, también en sus alias de búsqueda y referencias. Algunos ejemplos: **Aurenox**, **Dunavar**, **Velkarion**, **Custodio del Firmamento**, **Llamador de Piedra Clara**, **Carta de Ilarva** y **Pasarela de las Auroras**. La guardiana de las despedidas se llama **Lethria** y el cazador sin rostro, **Namar Sin Rostro**. Maethra conserva su jerarquía y poder.

Los códigos internos históricos se conservan para que las hojas mantengan compras, vínculos, permisos y usos gastados. Las reliquias y artefactos ya entregados reciben el nombre nuevo si conservan el nombre generado reconocido. Las descripciones de reliquias solo se sustituyen cuando su huella coincide con una versión conocida. Un nombre o nota personalizados se conservan. Los diarios antiguos escritos por el DM no se reemplazan: la nota privada del panteón incorpora una página nueva para revisar el lore.

## Un 1 o un 20, en cuatro pasos

1. Tira un ataque, salvación, habilidad, característica o herramienta desde dnd5e.
2. Si el d20 natural válido es 1 o 20, el módulo propone una fila de 1d8 de la tabla correspondiente. Con ventaja o desventaja cuenta el dado que se conserva, incluidas repeticiones.
3. El GM principal aprueba o descarta la propuesta. No cambia retroactivamente éxito, fallo o daño de la tirada.
4. Si hay CA o velocidad, se crea un efecto breve. Las modificaciones a una prueba concreta y las consecuencias narrativas se aplican en mesa tal como indica el texto.

En combate cuenta **el primer d20 válido de cada criatura en cada turno global**, aunque ese dado no sea extremo. Los ataques adicionales no acumulan oportunidades de sufrir un contratiempo. Fuera de combate solo se propone una consecuencia por criatura cada diez minutos de juego; el DM valida que la tarea tenga relevancia. Las salvaciones y ataques fuera de combate utilizan las consecuencias de escena. No se incluyen iniciativa, muerte, Concentración o Control de choques.

Hay **64 filas**, con cuatro contextos: ataque, salvación, habilidad en combate y escena. La escala breve es ±1 en niveles 1–4, ±2 en 5–12 y ±3 en 13–20. El cambio de velocidad es 1,5 m. La CA vence al empezar el siguiente turno propio; la velocidad, al terminarlo. Terminar el combate retira esos efectos. Una consecuencia nueva sustituye al efecto anterior de estas tablas. Ninguna fila destruye equipo, quita una acción, causa daño o repone PG, Verbe o recursos diarios. El crítico de ataque sigue siendo el del sistema.

El ajuste **Contratiempos y oportunidades del d20** permite activar o apagar la función. Las propuestas de tiradas ocultas conservan sus destinatarios y visibilidad. Una macro que no genere metadatos de tirada dnd5e no dispara esta función automáticamente. El DM puede resolver la tabla desde la pestaña de consulta en esos casos. El GM principal debe estar conectado para observar las tiradas; no se reconstruyen tiradas anteriores al conectarse.

## 82 técnicas para vivir en el mundo

Las utilidades nuevas son de grado 0–3. Salvo las pequeñas utilidades de grado 0, requieren un minuto de preparación. Mantienen las competencias, herramientas, materiales y tiempos normales de cada tarea. Una ventaja no se suma a otra ventaja. No conceden alimento infinito, fabricación acelerada, producción gratuita, recuperación de recursos o turnos nuevos.

| Rama | Antes | Nuevas | Total |
|---|---:|---:|---:|
| Umbral | 17 | 16 | 33 |
| Rastro | 36 | 14 | 50 |
| Pulso | 38 | 12 | 50 |
| Quietud | 38 | 12 | 50 |
| Vasija | 39 | 8 | 47 |
| Velo | 49 | 4 | 53 |
| Mirada | 55 | 4 | 59 |
| Pacto | 53 | 4 | 57 |
| Hilo | 62 | 4 | 66 |
| Cuerpo | 64 | 2 | 66 |
| Sello | 69 | 2 | 71 |

Por ejemplo: Baliza del campamento, Bolsillo mensajero, Guardia de la camilla, Memoria de la receta, Catálogo de las hojas, Costura del remiendo y Sello de la despensa. Forma mantiene sus 173 técnicas y Sangre sus 85. El total es **860 técnicas**, junto a **219 dotes y 78 reliquias**.

## Creación con Plutonium

El asistente abre el importador público de Plutonium dirigido a la ficha elegida. La integración se revisó en el código distribuido oficialmente para Foundry 13, versión 2.18.3.v13. La selección de fuentes, permisos y avances la sigue resolviendo Plutonium. No se modifican su configuración ni suscripciones.

Elige clase, especie, trasfondo y equipo una vez cada uno. Completa los diálogos que abra el importador y pulsa **Revisar progreso**. Si ya importaste una elección, aparece marcada. El reparto estándar permite asignar 15, 14, 13, 12, 10 y 8 sin repetirlos: úsalo antes de aplicar mejoras de origen, o revísalas con el DM después. El módulo no reconstruye automáticamente esos aumentos. El DM marca la revisión final y concede el Verbe según la campaña.

Si tu usuario no puede crear actores, el DM puede crear la ficha y darte propiedad. Si falta Plutonium, su API cambia o su configuración impide importar, el asistente lo informa y puedes continuar con los compendios o su importador nativo.

## Taller de NPC

1. Importa una criatura con Plutonium o elige un NPC existente.
2. Indica nombre, valor de desafío orientativo, rol, entorno, motivación y vínculo.
3. Prepara la vista previa. Se muestran PG, CA, velocidad y una rutina alternativa de ataque.
4. Guarda una copia privada, que es la opción inicial. También puedes actualizar la base, con reversión de su última adaptación.

Se conserva la proporción actual de vida, salvo que marques poner PG al máximo. Las unidades se convierten entre metros y pies. Las acciones importadas permanecen intactas. La rutina nueva es una **alternativa para una acción completa**, no se suma a Multiataque u otra rutina. Pulsa su ataque una vez por cada ataque permitido: no lanza una multiacción automática. Revisa magia, resistencias, control, áreas, técnicas y recursos especiales antes del encuentro. Este perfil orienta la preparación; no certifica un valor de desafío exacto ni actualiza tokens ya colocados.

## Consulta y privacidad

La búsqueda es local y devuelve fragmentos con su fuente. No es un servicio externo de IA. Consulta diarios y páginas legibles, biografías de actores observables y objetos con permiso; el DM añade todo el repertorio y las reliquias. Opcionalmente busca nombres de hasta cuarenta compendios visibles y observables. No descarga todos sus documentos para buscar contenido completo. Todas las palabras deben aparecer; las tildes y mayúsculas no importan.

El cuaderno de Dirección es un diario privado, con propiedad por defecto desactivada y sin acceso para jugadores. Un recordatorio guardado en una ficha se puede leer por quienes tengan acceso a esa ficha. Las fichas nuevas de NPC son privadas por defecto; revisa sus permisos antes de compartirlas.

## Verificación

Pruebas con documentos simulados, comparación de potencia de las 778 técnicas previas, simulación de cada técnica a veinte niveles en dos perfiles y validación de sintaxis, catálogos y HTML. Las vistas `docs/preview/interfaz.html` y `docs/preview/mesa.html` usan HTML real y personajes ficticios. Falta comprobar los recorridos de juego dentro del Foundry instalado con sus módulos concretos.

Referencias de integración: [código público de dnd5e 5.2.5](https://github.com/foundryvtt/dnd5e/tree/release-5.2.5), [CompendiumCollection de Foundry 13](https://foundryvtt.com/api/v13/classes/foundry.documents.collections.CompendiumCollection.html), [distribución oficial de Plutonium para Foundry 13](https://github.com/TheGiddyLimit/plutonium-next/blob/master/module-foundry13.json) y [funciones del importador](https://5e.tools/plutonium.html).
