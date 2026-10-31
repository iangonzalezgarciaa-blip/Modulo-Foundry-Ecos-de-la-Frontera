# Revisión 2.10: interfaz, creación y descansos

## Usarlo en la mesa

- **Inicio:** tarjetas de elementos con altura automática, texto ajustable y distribución de una, dos o tres columnas. La paleta clara usa pergamino, carbón y gris; la oscura, gris y acentos de pergamino.
- **Verbe → DM → Naturalezas y linaje:** al cambiar Linaje o Fuerza aparece su explicación antes de guardar: herencia, naturalezas, reserva, recuperación, Despertar, tope de grado y recargo de Sangre. El diálogo inicial incluye una guía desplegable. El contenido del linaje sigue reservado al DM cuando el jugador no lo conoce.
- **Mejorar → Especialidades → Tus elementos:** después de descubrir dos naturalezas, Aprender cierra las otras. Tercera naturaleza habilita una elección adicional desde nivel 7 y con maestro; se abre solo ese elemento. Naturaleza combinada, desde nivel 9 y con maestro, permite elegir una mezcla de dos naturalezas conocidas. Elemento complejo abre una segunda mezcla desde 13. Las combinaciones muestran todas sus técnicas y los requisitos aún pendientes.
- **Taller del DM:** disponible en el Menú del DM y en Verbe → DM. Publicar no exige un actor preparado, no cobra sus Trazos ni le enseña la técnica: la incorpora al catálogo de todos, donde cada personaje cumple requisitos y paga aprendizaje. Se puede editar, duplicar, retirar y republicar; retirar no elimina lo ya aprendido.
- **Windows:** el BAT del Release permite activar, detener y consultar la actualización. Activar corrige el lanzamiento de la tarea de 2.9.2, incluso si se retiró con `-Remove`. No requiere reinstalar el módulo. Véase [ACTUALIZACIONES.md](ACTUALIZACIONES.md).

## Entrenamiento

Las mejoras se ofrecen por la actividad real: daño o curación con dados, ataque/salvación, alcance, duración, componentes y activación. No se cobra por un dado en una utilidad sin dados ni por una CD en Sustitución. Se conserva el historial de compras anterior; el DM puede devolver una mejora antigua sin efecto en «Deshacer compras» y entrenar una opción adecuada.

| Mejora | Coste: nivel nuevo de cultivo + | Tope nuevo por técnica |
|---|---:|---:|
| Dado de daño/curación | 1 | 3 |
| −1 Verbe (mínimo 1) | 1 | 2 |
| +1 ataque/CD | 1 | 2 |
| Área/alcance ×1,5 | 0 | 2 |
| Activación más rápida | 2 | 1 |
| +50 % duración, máximo +1 minuto | 0 | 1 |
| Toque pasa a 3 m | 0 | 1 |
| Sin componente verbal / gestual | 2 | 1 cada una |
| Infusión fija | 2 | 1 |
| Sustitución: objeto +1,5 m | 0 | 2 |
| Sustitución: −1 al recargo total | 1 | 1 |

El nivel nuevo cuesta 1, 2 o 3; el selector muestra la suma final. Sustitución mantiene la reacción, el objeto y sus restricciones: el entrenamiento permite 4,5/6 m, mientras la dote Lejana conserva sus 9 m. Control reduce un punto del recargo total, no un punto por cada grado ni el coste base; el recargo nunca es negativo. Los puntos ya gastados no se recalculan retroactivamente. La mejora gratis que concede una evolución conserva su gratuidad y respeta compatibilidad y topes.

## Descansos

Se compara recuperación real, incluyendo deuda, multiplicadores de linaje y dotes. El presupuesto persiste en el actor: no se renueva al cerrar el panel, cambiar de cliente o repetir una pausa.

| Recurso | Cortos entre largos | Largo |
|---|---|---|
| Dados de Golpe, hojas con descansos de la casa | Comparten hasta la mitad, hacia abajo, de lo que devuelve un largo. Cada pausa propone los valores configurados, limitados por el saldo. | Devuelve la cantidad configurada y renueva el presupuesto corto. |
| Verbe | Respiro, Aliento y noches a la intemperie comparten hasta la mitad de la recuperación larga. Sueño reparador amplía el presupuesto hasta dos tercios, siempre menor que la recuperación larga y que una reserva completa. | Aplica la recuperación larga con dotes/linaje y renueva el presupuesto breve. |
| Poderes diarios, usos de grado 6+, Cerrojos | No se renuevan. | Se renuevan. |
| PG | No hay curación gratuita por descansar; gastar DG sigue curando. | Misma regla de la casa. |

Ejemplo de DG con ajuste «mitad del nivel»: nivel 1, largo 1 y presupuesto corto 0; nivel 5, largo 3 y presupuesto corto 1; nivel 20, largo 10 y presupuesto corto 5. Aunque el selector antiguo proponga 2 en Santuario, no se supera el presupuesto. Todavía pueden gastarse los dados que ya estaban disponibles.

**Efecto en expediciones:** a la intemperie el descanso cuenta como corto en esta campaña y consume el mismo saldo breve. Encadenar noches fuera no sustituye al Santuario para regenerar indefinidamente los recursos del módulo. Es una regla más restrictiva que la versión anterior, aplicada expresamente para cerrar el bucle de recuperación. Malherido, heridas y tratamiento mantienen sus condiciones; no se altera el descanso nativo de las clases para inventar una equivalencia entre todos sus rasgos.

## Personalización universal

El taller incluye rama, naturaleza simple o combinada, grado 0–11, Trazos, requisito de nivel/técnica previa, requisito narrativo, coste base de Verbe, característica, curación/ataque/salvación/utilidad, dados, bono, escalado, blancos, área, alcance, duración, Concentración, componentes, material y estados registrados. Una reacción exige disparador. El coste base personalizado escala por la diferencia de la tabla de grados; los modificadores personales siguen aplicándose.

El presupuesto incluye bonos y blancos. Escalados de varios dados, control sin daño o propuestas que excedan la referencia requieren una excepción expresa del DM con motivo. Esto ayuda a revisar; no mide por sí solo la fuerza de todo efecto narrativo. La actividad guarda campos nativos; el texto libre, las repeticiones especiales, consumo de materiales del inventario y finales narrativos requieren resolución de mesa. No se ejecuta código arbitrario escrito en una técnica.

Las publicaciones se guardan en el mundo de Foundry, no se suben automáticamente a GitHub. Los respaldos del actualizador incluyen datos de los mundos. Editar conserva el identificador de la técnica, sus objetos aprendidos y los usos gastados. La retirada conserva el repertorio existente.

## Progresión y validación

Se mantienen 8/24/48/68/76/84 Trazos en niveles 1/5/11/16/18/20. Maestro llega hasta grado 8, con el límite adicional del nivel; resuelve el hueco anterior del nivel 15–16. El informe [PROGRESION_2.10.md](PROGRESION_2.10.md) usa compras reales y explica los límites de la comparación con Naruto.

Regresiones con documentos simulados: descansos encadenados, resultados nativos de DG, herencias, deuda, poderes diarios, naturaleza adicional, mezclas y catálogo completo, entrenamiento, publicación/edición/retirada y permisos. Windows PowerShell 5.1 comprueba el instalador, el BAT, su arranque mediante WScript y el respaldo/intercambio usando archivos ficticios. Sintaxis, importaciones, catálogo, generación de informes, vista previa HTML y ZIP determinista se validan en CI.

No se ha probado visualmente esta versión dentro del Foundry del autor ni con todos los módulos de su mesa. La vista previa usa HTML real y actores ficticios; no es una prueba de partida ni una certificación de balance perfecto.
