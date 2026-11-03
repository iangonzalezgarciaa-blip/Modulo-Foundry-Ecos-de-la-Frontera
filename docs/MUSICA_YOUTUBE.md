# Música de YouTube en la mesa (tareas 5.1a, 5.1b y 5.1c)

*Informe del 3 de noviembre de 2026. Prototipo incluido en 3.9.0, sin probar todavía dentro de Foundry.*

## Lo que se pidió

El DM pega un enlace de YouTube y todos lo oyen a la vez, cada uno en su equipo y con su volumen. Límites fijados por el plan:

- Solo el reproductor oficial incrustado de YouTube.
- Nada de extraer ni descargar el audio, porque contraviene los términos de YouTube.

## Módulos que ya existen

Revisados en el registro de paquetes de Foundry el 3-nov-2026. Ninguno se instaló ni se probó en «Esperanza Oculta».

| Módulo | Qué hace | Foundry | Última versión | Sincroniza |
|---|---|---|---|---|
| [Foundry Tube](https://foundryvtt.com/packages/foundry-tube) | Reproductor compacto con listas, presets y bucle; búsqueda sin clave de API. | 13 (solo 13) | 1.4.1, hace unos 8 meses | Sí: reproducir, pausa, saltos y bucle. |
| [Youtube Player Widget](https://foundryvtt.com/packages/fvtt-youtube-player) (TheRipper93) | Widget sobre la lista de jugadores, con listas sencillas; el video queda visible «para cumplir los términos de YouTube». | 11 a 14 | 4.0.1, hace unas 10 semanas | Sí. |
| [Bardic Inspiration](https://foundryvtt.com/packages/bardic-inspiration) | Reproductor con controles de DJ, cola y corrección de desfase. | 12 a 13 | 1.0.3, hace más de un año | Sí, con corrección de desfase. |
| [Playlist Plus](https://foundryvtt.com/packages/playlist-plus) | Rehace el reproductor de Foundry (pestañas, cola, fundidos, atenuación) y admite pistas de YouTube incrustadas. | 13 y 14 | 1.1.3, hace un mes | Sí; antes de añadir una pista comprueba que todos la puedan oír. |
| [EAR](https://github.com/SweetyHake/EAR) | Proyecto en GitHub, no figura en el registro. | Sin verificar | Sin verificar | Sin verificar |
| [Imp Theater](https://foundryvtt.com/packages/imp-theater) | Salas de video compartido. | Sin verificar | Sin verificar | Sin verificar |

Ninguna página dice expresamente que use el reproductor oficial incrustado. El widget de TheRipper93 es el único que menciona los términos de YouTube.

## Recomendación

**Opción elegida: un reproductor propio, pequeño, dentro del módulo** (ya en 3.9.0). Motivos:

- No añade una dependencia más a un mundo que ya carga muchos módulos.
- Usa la [API oficial del reproductor incrustado de YouTube](https://developers.google.com/youtube/iframe_api_reference): el video se ve (200 × 200, el mínimo que piden), no se descarga nada y YouTube sirve sus anuncios si los hay.
- Se maneja desde la Mesa Ecos, como el resto de herramientas del DM.

**Si se prefiere un módulo ajeno:**

- Para listas grandes y fundidos, Playlist Plus, que es el más activo y admite v14.
- Si solo hace falta un widget, Youtube Player Widget.

Cualquiera de los dos convive con el nuestro: basta con no usar dos a la vez.

## Cómo funciona (5.1b y 5.1c)

**Dónde se maneja.** En Mesa Ecos, pestaña Control (solo el DM), sección «Música de YouTube».

**Botones:**

- Reproducir (con el enlace pegado)
- Añadir a la cola
- Pausa
- Seguir
- Siguiente
- Detener

**Formatos de enlace aceptados:**

- `watch?v=…`
- `youtu.be/…`
- `shorts/…`
- `embed/…`
- el id suelto

**La cola.** Admite hasta 50 enlaces. Cuando un video termina, el DM activo pasa al siguiente solo.

**Cómo se sincroniza:**

- El estado (video, momento de inicio, pausa, cola) vive en un ajuste del mundo que solo escribe el DM.
- Cada cliente reacciona al cambio con el hook `updateSetting`.
- Calcula el segundo exacto con el reloj: `(ahora − inicio)`, o el segundo guardado si está en pausa.
- Por eso un jugador que entra tarde empieza en el mismo punto que los demás.

**El reproductor de cada jugador:**

- Aparece abajo a la izquierda con el título «♪ Música de la mesa».
- El botón «Silenciar» lo apaga solo en su equipo.
- El volumen está en los ajustes del módulo («Volumen de la música de YouTube», de 0 a 100) y es propio de cada equipo.

**Archivo:** `scripts/mesa-musica.js`.

## Límites conocidos

**Reproducción automática.** El navegador puede bloquear el sonido de un video si el jugador todavía no hizo clic en la página. En Foundry casi siempre ya lo hizo (al entrar), pero si alguien no oye nada, basta con que pulse el video una vez.

**Videos con la inserción desactivada.** Hay videos que su dueño no deja incrustar. Esos muestran un error en el reproductor. No hay forma legítima de saltarlo: hay que elegir otro.

**Desfase.** Puede haber uno o dos segundos de desfase entre equipos con relojes distintos. No se corrige continuamente: cada orden del DM vuelve a alinear a todos.

**Foundry con red cerrada.** Hace falta que cada cliente llegue a `youtube.com`.

## Pendiente de probar en «Esperanza Oculta»

1. El DM pega un enlace y pulsa Reproducir. Un jugador lo oye y ve el recuadro.
2. Pausa y Seguir: los dos se paran y siguen en el mismo punto.
3. Un jugador recarga la página a mitad del video: retoma en el mismo punto.
4. Añadir dos enlaces a la cola y dejar terminar el primero: suena el segundo solo.
5. Volumen y «Silenciar» del jugador no cambian lo que oyen los demás.
