# Base de mantenimiento 2.8: reglas, reparación y límites

Fecha: 30 de octubre de 2026. Alcance: módulo Ecos de la frontera, Foundry v13, dnd5e 5.2.5. Versión preparada para comprobar en una copia del mundo; no ejecutada todavía dentro de Foundry.

## Objetivo y criterio

La base debe cobrar lo que anuncia, impedir compras inválidas, conservar personajes al actualizar y distinguir reglas calculadas de decisiones del DM. Se conserva el contenido de Nimerios, el contexto local de Arcegris, la concesión narrativa de linajes/Miradas/Pactos y el catálogo de 401 técnicas y 155 dotes. Naruto aporta inspiración, sin sustituir el canon propio.

Se aplicó una revisión dirigida de las rutas con mayor impacto: recursos, progreso, creación, aprobaciones, estados, descansos, heridas y cambios de documentos. Todo el catálogo pasa validación estructural y generación de datos en seis niveles. Esto no equivale a haber jugado y equilibrado individualmente 401 poderes: el control, las invocaciones y los beneficios narrativos necesitan datos de mesa.

## Decisiones de reglas implementadas

| Tema | Regla de 2.8 | Motivo |
|---|---|---|
| Deuda | Todas las fuentes pagan 2 puntos de recuperación por punto negativo. Un impar se guarda. Al salir de deuda, el sobrante recupera 1:1. | Evitar ventajas por dividir recuperaciones o elegir otra fuente. |
| Sobreesfuerzo | Misma comprobación para técnica, defensa y Cerrojo. Con Agotamiento 4 no se entra ni se sigue gastando en negativo; se respeta el límite del actor. | Impedir que una ruta esquive el coste de otra. |
| Grado de uso | Elevar exige nivel y rango de rama. Una concesión histórica conserva su grado base. | Separar acceso excepcional de dominio para elevar. |
| Uso alto | Una oportunidad a grado efectivo 6 o más por técnica y Descanso Largo. Se puede seguir usando la versión baja. | Cerrar la repetición ilimitada mediante técnicas de grado base bajo. |
| Choques | La ventaja elemental suma 2 grados de potencia; empate, Control. Ajuste clásico disponible. | Permitir que una diferencia grande de potencia importe. Es un cambio de balance respecto del PDF. |
| Combinaciones | La afinidad aplicable es la menor de sus componentes. | No obtener duración/dados de una combinación entrenando solo un componente. |
| Cerrojos | Reapertura contada entre Descansos Largos, incluido el primero; actualizar la apertura no dispara cierre. | Hacer coincidir el contador con el coste escrito. |
| Creación | Daño, velocidad, área, alcance, estados naturales y persistencia forman el presupuesto. Un exceso pide excepción del DM con motivo registrado. | La propuesta del menú pasa a tener consecuencias verificables. |
| Tiempo y oro | El panel cobra Trazos; DM resuelve oro, materiales y entrenamiento antes de aprobar/confirmar. | No anunciar cobros o avance de tiempo que el código no ejecuta. |

El daño repetido declarado en una creación reduce su presupuesto y requiere concentración/duración por defecto. El creador no programa por sí mismo pulsos de daño, nuevas salvaciones ni comportamientos descritos en texto. La excepción permite un poder deliberadamente extraordinario; no permite datos malformados ni saltar requisitos de rama, nivel o naturaleza.

## Resultado frente a la auditoría inicial

| Hallazgo | Estado de 2.8 |
|---|---|
| A. Requisitos elementales | Comprobados en compra y aprobación; también Mirada, trasplante, herencia, Cerrojo y combinaciones. |
| B. Gasto negativo desigual | Regla común y regresiones de técnicas, defensas y Cerrojos. |
| C. Cargado y defensas | Reacción bloqueada en la lista y al usar; la ventaja metálica se consume por separado. |
| D. Palma y escalado | +2d8 configurado y validado contra sus metadatos; conectado con tratamiento diario. |
| E/F. Redondeo y fuentes de recuperación | Función única, crédito impar persistente y comprobación de pagos divididos. |
| G. Días de Cerrojos | Contador reiniciado por Descanso Largo, no por medianoche. |
| H. Creador | Validación al enviar y al aprobar, límites y excepciones registradas. |
| I. Grado alto por grado base | Límite por grado efectivo; marcas de uso alto reiniciadas por descanso. |
| J. Dones y estados | Cuerpo templado y estados prioritarios completados; cobertura restante inventariada, sin declarar automatización total. |
| K. Oro y entrenamiento | Resolución manual explícita en creador/guía/documentación. No hay calendario de investigación automatizado. |

Otros fallos encontrados durante las regresiones: una notificación devolvía un valor verdadero y convertía un rechazo en una aprobación aparente; se borraba el pedido. Ahora las operaciones devuelven éxito explícito. Se evitan duplicados por doble clic y pisadas entre compras en el mismo cliente. Se elimina el objeto o efecto recién creado si falla guardar su coste. Los objetos de grado 10/11 ya no están comprimidos al nivel 9.

## Integridad y arquitectura

| Archivo | Responsabilidad |
|---|---|
| `scripts/verbe-core.js` | Cálculo puro, colas por clave, gasto, deuda, choques, presupuesto y validación. |
| `scripts/verbe-effects.js` | Adaptación a tiradas, metal, hielo y estados. |
| `scripts/verbe-medicina.js` | Identificación de técnicas de Pulso y delegación al tratamiento existente. |
| `scripts/verbe.js` | Documentos de Foundry, compras, migración, interfaz, aprobaciones y combate. |
| `scripts/main.js` | Reglas de campaña, supervivencia y enlace curativo; se conserva la estructura de oficios/economía. |
| `tools/` | Catálogo, validación, reparación puntual, informes y empaquetado. |
| `tests/` | Reglas y operaciones reales con documentos simulados, incluidos errores de escritura. |

El refresco actualiza cada objeto existente y conserva su identificador y usos gastados. No modifica técnicas externas ajenas al catálogo/propias registradas. Las compras se serializan por actor en cada cliente. La reserva de un lanzamiento evita otro gasto local hasta recibir la actualización o agotar 30 segundos. **Esto no es una transacción distribuida entre dos navegadores que editan el mismo actor a la vez.** Conviene un propietario operativo por actor; GM y jugador no deben comprar simultáneamente en dos clientes.

El protocolo del Verbe limita acciones remotas y vuelve a validar propiedad/requisitos al aprobar. Los sockets ordinarios de Foundry no aportan aquí una identidad criptográfica del remitente: estas comprobaciones no convierten clientes modificados en un entorno no confiable seguro. El protocolo histórico de supervivencia/oficios y las APIs de otros módulos no se reescribieron. La codificación gzip/XOR del contenido tampoco protege secretos frente a quien descarga el módulo.

## Pulso y supervivencia

Palma que cierra propone al DM el tratamiento diario con éxito; se invoca el mismo tratamiento de la campaña. No elimina directamente HNT: avanza un día si hubo reposo, respeta combate/trabajo pesado, trata Malherido y no suma dos días por lanzamientos repetidos. En Santuario mantiene las reglas existentes de recuperación de Secuelas. Un intento de Medicina fallido puede ser sustituido por el tratamiento mágico exitoso.

Restaurar, Aliento para muchos, Rehacer y Mano que cierra todo enlazan con la confirmación existente para bajar HNT. Mano que sostiene enlaza con estabilización. Los objetivos se obtienen de tokens marcados/tarjeta: el lanzador debe marcar pacientes. La tirada y aplicación de PG siguen el flujo normal de dnd5e. Hay que comprobar en Foundry el orden con el tope de Malherido: la confirmación de heridas y el flujo nativo de curación son asíncronos. Cirugía, regeneración por turnos, resurrección y trasplantes continúan siendo adjudicación del DM.

## Cobertura de combate

Desequilibrado marca desventaja en la siguiente tirada de ataque y después se consume. Embarrado afecta DES. Cargado impide las reacciones del Verbe; su primera ventaja metálica exige arma metálica, blanco que lleve metal y un único objetivo. El material debe estar declarado o marcado: el DM dispone de `api.verbe.marcarMetal(itemOActor, true|false)`. Un material desconocido no concede ventaja automática. El efecto de Cargado permanece al gastar esa ventaja.

Helado convierte −3 m a −10 pies en hojas en pies. Si la velocidad llega a cero, el módulo crea su propio efecto de apresamiento y retira únicamente ese efecto al recuperarse. Empapado/Embarrado apagan Ardiendo. Los estados temporales vencidos se limpian al inicio de turno; no se borran pasivos permanentes por esa ruta.

Las defensas automáticas dependen de midi-qol; ubicación/tamaño del objeto de Sustitución requieren validación en mesa. La implementación existente de fallo utiliza un efecto de CA, que no garantiza anular un 20 natural en todas las versiones de midi. Críticos, áreas, caducidad DAE y concentración necesitan prueba real. El coste/reacción están reforzados, pero no se presenta esa integración como certificada.

Inventario completo: [COBERTURA_CATALOGO.md](COBERTURA_CATALOGO.md). Un efecto o una actividad presentes no demuestran que toda la descripción esté automatizada. Las 202 técnicas de utilidad sin efectos son candidatas a resolución en mesa, no 202 errores confirmados.

## Verificación reproducible

```sh
npm test
npm run check
npm run docs:catalog
npm run balance
npm run package
```

Las **55 pruebas locales** verifican recuperación divisible, simetría de choques, compras/activaciones simultáneas locales, requisitos, rechazos, reversión de operaciones fallidas, usos altos, refresco, migración, estados y enlaces de medicina. El catálogo completo genera datos/costes válidos en niveles 1, 3, 5, 11, 17 y 20. El ZIP incluye solo ejecución y README, con rutas e integridad CRC comprobadas y contenido determinista.

Se contrastaron contratos nativos en el código oficial de [dnd5e 5.2.5](https://github.com/foundryvtt/dnd5e/tree/release-5.2.5): [consumo de actividades](https://github.com/foundryvtt/dnd5e/blob/release-5.2.5/module/documents/activity/mixin.mjs), [diálogo de uso](https://github.com/foundryvtt/dnd5e/blob/release-5.2.5/module/applications/activity/activity-usage-dialog.mjs), [modelo de conjuro](https://github.com/foundryvtt/dnd5e/blob/release-5.2.5/module/data/item/spell.mjs) y [tiradas de actor](https://github.com/foundryvtt/dnd5e/blob/release-5.2.5/module/documents/actor/actor.mjs). El consumo es síncrono; `scaling.max` cuenta el valor de interfaz, que es incremento + 1; el nivel de conjuro admite valores mayores de 9. No se añadieron parches innecesarios sobre esos contratos.

## Actualización de la campaña

1. Con Foundry cerrado, hacer copia del mundo y conservar la carpeta anterior del módulo.
2. Descargar `releases/ecos-frontera-2.8.0.zip` del repositorio e instalar su carpeta `ecos-frontera` en `Data/modules/`, reemplazando la anterior.
3. Abrir primero una copia del mundo como DM. Comprobar versión 2.8.0, ajuste Capa V y, si se desea conservarlo, modo de choque clásico.
4. La migración se aplica a actores despiertos: conserva deuda, Trazos gastados, compras, técnicas propias e identificadores. Inicializa crédito impar/reacción y reinicia una vez el contador antiguo de Cerrojos. Actualiza las técnicas existentes sin reiniciar usos. Después es idempotente.
5. Con GM y propietario separados, comprobar compra doble, lanzamiento elevado, descanso, moneda, Dado de Golpe, estados, tratamiento, crítico, área y concentración. El personaje de prueba debe conservar PG, usos, inventario y progresión salvo los gastos elegidos.

Los datos del mundo no están en el repositorio: actores, técnicas creadas en ajustes y pedidos se guardan en Foundry. No instalar la copia vieja sobre un mundo migrado como método de reversión; restaurar juntos el respaldo del mundo y el módulo correspondiente.

## Orden para seguir expandiendo

1. Cerrar la prueba real de Foundry/midi/DAE y corregir cualquier diferencia de orden o vencimiento.
2. Medir los [escenarios de balance](ESCENARIOS_BALANCE.md) en mesa; prestar atención al clima de grado 1, acumulación de dados y Verbe añadido a las clases de D&D.
3. Definir una regla común para economía de acciones de clones, invocaciones y títeres antes de añadir variantes.
4. Completar automatización por familia, con casos de prueba y ficha de resolución manual; luego ampliar catálogo.

Esta versión resuelve discrepancias reproducibles y crea controles de mantenimiento. El nombre «base estable» describe el objetivo del trabajo; su estabilidad en la campaña depende de completar la validación real indicada.
