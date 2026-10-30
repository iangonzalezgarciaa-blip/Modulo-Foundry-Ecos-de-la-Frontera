# Cambios

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
