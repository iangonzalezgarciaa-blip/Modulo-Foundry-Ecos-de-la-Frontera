# Interfaz 2.9: aprender desde el panel

El objetivo es que un jugador pueda empezar y resolver sus primeras acciones sin estudiar el reglamento. Las excepciones siguen disponibles como referencia; la interfaz explica la decisión que toca tomar ahora.

## Recorrido del jugador

| Sección | Qué encuentra | Qué puede hacer |
|---|---|---|
| Inicio | Siguiente paso según su personaje; elemento, especialidad y primeras sugerencias; avisos de estado. | Elegir con confirmación, aprender una primera técnica o abrir el repertorio. |
| Mis técnicas | Cartas con efecto, acción, alcance, grado, coste actual y energía que quedaría. | Abrir el uso de dnd5e o ver los detalles de una reacción. |
| Aprender | Precio en Trazos separado del gasto de Verbe; saldo de Trazos después de comprar; motivos de bloqueo. | Aprender, solicitar permiso al DM, explorar otra naturaleza o buscar opciones futuras. |
| Mejorar | Especialidades, Dotes, Entrenar técnicas e Inventar. | Elegir cómo crecer, viendo costes y requisitos; consultar los dones cuando interesen. |
| Ayuda rápida | Preguntas concretas sobre uso, recursos, acciones, heridas, descanso y dudas habituales. | Resolver una duda puntual y continuar jugando. |

Verbe y Trazos permanecen separados en la cabecera. Las recomendaciones son opciones válidas, no una build obligatoria. No conceden poderes ni gastan puntos automáticamente. Conocer una técnica regalada también completa el inicio.

## Usar sin duplicar costes

El botón de una técnica normal usa la actividad del objeto aprendido mediante `Activity.use()` de dnd5e 5.2.5. Abre el flujo habitual de configuración, tirada, tarjeta y consumo. Si el objeto tiene varias actividades, abre su ficha para elegir; no ejecuta una arbitrariamente. El panel evita abrir dos usos simultáneos desde sus botones y mantiene las comprobaciones de propiedad, estado y recursos.

La vista del coste utiliza `costoUso`, el límite negativo, los usos altos y los requisitos de reacción del núcleo existente. Incluye mejoras, infusión, clima y el recargo contra un objetivo más fuerte cuando corresponde. Cambiar objetivo, clima o grado puede cambiar el coste: el consumo real vuelve a comprobarlo al confirmar. La cifra visible corresponde al grado base en el contexto actual, no a cualquier grado elegido después.

Sustitución y las demás entradas del catálogo de defensas se presentan como reacciones: el botón explica cómo se ofrecen al recibir el ataque. No cobra una utilidad antes del disparador ni promete resolver por sí solo la posición del objeto, los críticos o el resultado del ataque. Sin midi-qol se acuerda la resolución con el DM.

## Claridad y visibilidad

- Una elección inicial por paso, con estilos de elemento/especialidad descritos en tarjetas.
- Primera compra con efecto y ambos costes visibles. No recomienda técnicas de otra naturaleza, del DM ni sujetas a un permiso narrativo.
- Lo que puede usarse en negativo lleva aviso de sobreesfuerzo y saldo. Los bloqueos muestran el motivo.
- Cargado, Malherido, Herida No Tratada, incapacidad y Agotamiento alto añaden ayuda contextual.
- La ficha personal, los dones completos y los filtros avanzados se despliegan cuando hacen falta.
- Navegación mediante botones con foco visible; indicadores de página y paso; recursos con nombre accesible; estados identificables por texto además de color.
- Diseño por ancho del panel, con distribución compacta para ventanas pequeñas. Tema claro/oscuro y reducción de movimiento.
- La vista del jugador conserva las restricciones del catálogo y no muestra el panel de administración. El DM mantiene sus propias herramientas plegadas.

No se modifica el catálogo ni se migra el progreso por esta actualización. El mundo conserva sus actores, compras y técnicas propias. La migración de reglas 2.8 sigue funcionando para quienes aún vienen de versiones anteriores.

## Vista previa y validación

`npm run ui:preview` genera [preview/interfaz.html](preview/interfaz.html) usando el HTML de la clase real del panel, sus estilos y personajes ficticios. Descargar el archivo y abrirlo en un navegador. Permite recorrer primeras elecciones, navegar secciones, consultar fichas, cambiar al tema oscuro y ver deuda/estados. Los botones de gasto o tirada muestran una explicación: esta demostración no se conecta a Foundry ni escribe personajes. La tipografía de iconos se aproxima sin descargar recursos externos.

Las regresiones automáticas comprueban pasos iniciales, sugerencias válidas, secretos del DM, saldo de energía, bloqueos, escape de texto, renderizado de secciones y delegación al uso nativo. Se mantienen las pruebas mecánicas de 2.8. La vista HTML no sustituye una sesión real: hay que revisar tamaños, foco, tema y la apertura de actividades dentro de Foundry v13 con dnd5e 5.2.5. No se ha certificado aquí el comportamiento visual dentro de Foundry.

## Instalación

Con Foundry cerrado y el mundo respaldado, reemplazar `Data/modules/ecos-frontera` por la carpeta del ZIP 2.9.0. Recargar el mundo como DM. Cada jugador abre **Verbe** desde su hoja y comienza en Inicio. No debe volver a elegir si el personaje ya tiene naturaleza y especialidad; el panel reconoce lo que existe.
