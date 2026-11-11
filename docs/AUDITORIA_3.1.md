# Auditoría de catálogo y escalado · 3.1

Revisión automática de **936 técnicas y 237 dotes**: 37440 fichas preparadas y 37440 actividades, con veinte niveles y dos perfiles. Requisitos referenciados, costes, cotas de dados, elevación, JSON e importaciones se validan junto a las pruebas de integración.

**Alcance:** el perfil normal usa el rango permitido por nivel, sin dotes; el perfil de tensión entrega todas las dotes y nueve mejoras simultáneas por técnica, una combinación de cultivo deliberadamente superior a la legal. Sirve para comprobar que incluso datos antiguos excesivos respetan los topes. No es una construcción comprable ni una simulación de combate. La tabla usa técnicas cuyo grado cabe por nivel, aunque otros requisitos de sangre, historia, senda o contrato puedan impedir usarlas.

La media muestra solo dados de daño o curación, sin impacto, salvaciones, blancos de área, bonos planos o resistencias. Para grado 0 incorpora la progresión nativa de dnd5e a niveles 5, 11 y 17; no duplica esa progresión en los datos del objeto.

| Nivel | Perfil | Mayor media de dados | Técnica de referencia | Mínimo de coste entre grados 6–11 |
|---:|---|---:|---|---:|
| 1 | Normal | 18.0 | agua-ola | 8 |
| 1 | Tensión | 26.0 | rayo-arco | 7 |
| 5 | Normal | 38.5 | hilo-decapitadora | 8 |
| 5 | Tensión | 55.0 | hilo-decapitadora | 7 |
| 11 | Normal | 71.5 | quietud-esfera-sabia-mayor | 8 |
| 11 | Tensión | 93.5 | cuerpo-peso-extremo | 7 |
| 16 | Normal | 82.5 | vasija-esfera-bestia | 8 |
| 16 | Tensión | 99.0 | cuerpo-bombardeo-mariposa | 7 |
| 18 | Normal | 88.0 | vasija-esfera-bestia | 8 |
| 18 | Tensión | 104.5 | vasija-esfera-bestia | 7 |
| 19 | Normal | 121.0 | rayo-lanza-trueno | 8 |
| 19 | Tensión | 132.0 | rayo-lanza-trueno | 7 |
| 20 | Normal | 132.0 | cuerpo-noche-ultima | 8 |
| 20 | Tensión | 143.0 | cuerpo-noche-ultima | 7 |

## Cambios tras la auditoría

- **Obtención:** sendas en cuatro etapas para las trece ramas. Maestría permite nuevos aprendizajes de grado 6–8; Leyenda, grado 9; ascensiones de historia, grado 10–11. Los requisitos también se vuelven a comprobar al usar los poderes nuevos: devolver las dotes después de aprender no permite conservar su acceso.

- **Escalado:** base +3 como máximo, +1 con Escalado profundo y +1 en Forma con Forma precisa. Solo técnicas con escalado numérico. No se añaden facultades, área, blancos o efectos por elevar. El máximo sigue sujeto a nivel, rango y senda.

- **Bonificaciones:** como máximo `mínimo(6, grado base + 1)` dados adicionales; grado 0, uno. CD adicional de cultivo/dotes registrada por el adaptador, máximo +2. Las dotes que solo mejoran CD no mejoran ataques. Los bonos de curación múltiples se dividen entre sus receptores.

- **Costes:** mínimo de la mitad del coste tabulado, redondeado arriba, en grado 1–5; del 70 % en 6–11. Técnica de reserva mantiene su excepción diaria a grado base. No hay reserva gratuita para grados altos.

- **Recursos:** cupos compartidos y una sola técnica de grado 11 por largo. Se mantienen además los usos individuales y de familia. La recuperación de dotes, respiración y pausas consume el presupuesto breve; un corto no renueva esos poderes diarios.

- **Acciones:** máximo dos técnicas con acción/AA y una de grado 6 o más por turno. Las reacciones y la única acción de formación de réplicas conservan su control separado. Esto pone un techo común a combinaciones de dotes, sin otorgar por sí solo acciones adicionales.

- **Concentración:** Dos hilos permite dos, con al menos una de grado ≤3 hasta nivel 16 y ≤5 después. No admite dos modos altos simultáneos ni una tercera Concentración. Los efectos propios se ligan a la concentración de su técnica, no a otra anterior.

- **Rituales:** el cultivo de rapidez no los convierte en acciones; la duración de efectos propios se sincroniza con la técnica cuando corresponde. Alcance máximo entrenado: triple del base y hasta 1500 m; área, doble del tamaño base.

- **Formas compuestas:** Mil brazos y el modo combinado conservan las claves de modo que necesitan sus continuaciones, sin acumular automáticamente todos los bonos de la forma anterior. Corona exige el avatar de Mil brazos activo. Renovación del centenar consume su depósito, de al menos 16 Verbe; no permite regenerar con un único punto y recuperar a la vez toda la batería.

## Cupos por Descanso Largo

| Nivel | Mayores 6–8 | Culminaciones 9–11 | Grado 11 dentro de las culminaciones |
|---:|---:|---:|---:|
| 1 | 0 | 0 | 0 |
| 5 | 0 | 0 | 0 |
| 11 | 2 | 0 | 0 |
| 13 | 3 | 0 | 0 |
| 16 | 4 | 0 | 0 |
| 18 | 4 | 2 | 0 |
| 19 | 4 | 2 | 0 |
| 20 | 4 | 3 | 1 |

Una Leyenda activa añade un uso de mayores; varias Leyendas no acumulan ese extra. Abrir Cerrojos conserva sus propios costes de PG y Agotamiento y no concede una técnica o acción adicional.

## Personajes existentes y límites prácticos

La migración conserva compras y técnicas altas ya conocidas como legadas, sin cobrarles retrospectivamente una senda. Siguen sujetas al nivel y los nuevos cupos; los usos altos gastados antes de actualizar se incorporan al contador. Los nuevos aprendizajes y elevaciones altas necesitan sus accesos. Deshacer una técnica o rehacer el personaje elimina su excepción legada cuando ya no conserva el objeto. No se reponen recursos por actualizar, rearmar o devolver una dote.

El DM puede reorientar el último cultivo registrado de una técnica sin nuevo cargo, conservando nivel y Trazos. Ayuda a adaptar inversiones antiguas que ahora alcanzan un tope. Las dotes con resolución de mesa se identifican; no se afirma automatización de cada frase del catálogo.

Las comprobaciones numéricas y las pruebas simuladas no prueban igualdad entre todas las clases, daño real de una campaña, interacciones de midi-qol/DAE ni legibilidad visual dentro del Foundry instalado. Hace falta observar partidas de distintos niveles.

Fuente técnica de contraste: [dnd5e 5.2.5](https://github.com/foundryvtt/dnd5e/tree/release-5.2.5), modelos de dotes, actividades, escalado y Concentración.
