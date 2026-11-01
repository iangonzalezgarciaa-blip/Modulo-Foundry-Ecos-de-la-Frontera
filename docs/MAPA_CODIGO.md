# Mapa de código · Ecos de la frontera v3.4.0

Verificado con `grep` el 1-nov-2026 sobre la rama `main` (módulo v3.4.0). Los números de línea cambian con cada edición: antes de usarlos, vuelve a buscar el nombre de la función con `grep -n "nombre" scripts/*.js`.

Estado de partida: `npm test` → 238 pruebas, 238 pasan, 0 fallan.

## 1. Mapa por tema

| Tema | Archivo | Función / símbolo | Línea |
|---|---|---|---|
| Carga del catálogo cifrado (`D`) | scripts/verbe.js | `cargarDatos` (lee `data/verbe.txt`); variable `D` | 137 · 105 |
| Registro de ajustes del mundo | scripts/verbe.js | `Hooks.once("init")`; ajuste `capaVExtra` | 3739 · 3747 |
| Arranque (lectura de datos) | scripts/verbe.js | `Hooks.once("ready")` | 3774 |
| Panel del Verbe: texto de ayuda | scripts/verbe.js | bloque de preguntas y tablas de ayuda (reserva, rangos, naturalezas) | ~2480–2520, ~2942 |
| Usar una técnica (gasto de Verbe) | scripts/verbe.js | `usarTecnica` | 610 |
| Armar el ítem de la técnica | scripts/verbe.js | `datosItem` | 637 |
| Tras usar la actividad | scripts/verbe.js | `despuesDeUsar`; enganche `dnd5e.postUseActivity` | 1134 · 3807 |
| Compra de técnicas / requisitos | scripts/verbe.js | `tecnicaPorId` y siguientes (sección «Técnicas: requisitos, compra y armado») | 319 |
| Puede aprender (devuelve `probar`) | scripts/verbe.js | `requisitos(actor, tec)` | 453 (comentario en 450) |
| **Coste de rangos** (+1 Trazo desde la tercera rama) | scripts/verbe.js | `costoRango` (la línea del +1 es `if (e.principal !== rama && orden >= 2 …) c += 1`) | 304 (el +1 en 311) |
| Orden de ramas por personaje | scripts/verbe.js | `ordenRama` | 298 |
| **«Probar» naturaleza (hoy gratis)** | scripts/verbe.js | `probarNaturaleza` → `probarNaturalezaInterno` | 1477 · 1478 |
| Cultivo de técnicas | scripts/verbe.js | `cultivar` → `cultivarInterno` | 1493 · 1494 |
| Inventar técnica (formulario, plantilla de área) | scripts/verbe.js | construcción con `target.template` (`tplTipo`) | 1675 |
| Editor de técnicas extra (lectura de plantilla al editar) | scripts/verbe.js | `areaTipo` / `areaTam` | 1871 |
| Guardar / retirar técnicas del mundo | scripts/verbe.js | `game.settings.set(MOD, AJ.extra, …)` | 1702 · 1705 · 1845 · 1857 |
| Creación de técnicas (validación universal) | scripts/verbe-authoring.js | `validarUniversal` | 11 |
| Plantillas de área al lanzar | scripts/verbe.js | escalado de `target.template.size` | 684–693 |
| Defensa contra áreas | scripts/verbe.js | `defenderArea` (comprueba `target.template.type`) | 3525 (3529) |
| **Choques: lógica** | scripts/verbe.js | `opcionesChoque`, `pagarContraTecnica`, `elegirContraTecnica`, `choqueAutomatico`, `enfrentamientoAutomatico`, `choqueNativo`, `limpiarDefensas` | 3547, 3558, 3573, 3584, 3603, 3610, 3638 |
| Choques: enganche a midi-qol | scripts/verbe.js | `midi-qol.preCheckHits`, `preCheckSaves`, `preDamageRoll`, `RollComplete` | 3819 · 3820 · 3821 · 3822 |
| Choques: qué técnicas pueden chocar, texto de ayuda | scripts/verbe-clash.js | `tecnicaChocable`, `AYUDA_CHOQUE`, `PASOS_CHOQUE` (17 líneas) | 2 · 10 · 11 |
| Defensas y desventaja | scripts/verbe.js | `aplicarDesventaja`, `defenderAtaque` | 3489 · 3506 |
| Otro enganche a `midi-qol.preCheckHits` (¡no es del Verbe!) | scripts/main.js | `Hooks.on("midi-qol.preCheckHits")` | 2173 |
| Tiradas de ataque y salvación (dnd5e nativo) | scripts/verbe.js | `dnd5e.preRollAttackV2`, `dnd5e.preRollSavingThrowV2`, `dnd5e.postRollAttack` | 3886 · 3887 · 3888 |
| Daño antes de tirar | scripts/verbe.js | `dnd5e.preRollDamageV2` → `antesDelDano` | 3817 · 1196 |
| Configuración de ventaja/desventaja por estados | scripts/verbe-effects.js | `modificarD20`, `configurarAtaque`, `configurarSalvacion` | 14 · 36 · 54 |
| Resultados 1 y 20 naturales | scripts/azar-core.js, scripts/azar.js | `dadoNatural`, `tablaAzar` · `proponerAzar`, `resolverAzar` | 3 · 97 · 13 · 38 |
| Descansos y Dados de Golpe | scripts/rest-core.js; scripts/verbe.js | `recuperacionDGLarga`, `ajustarRecuperacionDG` · `dnd5e.restCompleted`, `preRollHitDieV2`, `rollHitDieV2` | 3 · 18 · 3823 · 3824 · 3834 |
| Medicina | scripts/verbe-medicina.js | `tipoCuracionVerbe`, `tratarHeridaConPulso` | 2 · 14 |
| Progresión (grados por nivel, cuotas, requisitos de dote) | scripts/verbe-progression.js | `NIVEL_GRADO`, `cuotasPoder`, `permisoCuota`, `permisoTurno`, `requisitoDote` | 3 · 26 · 30 · 38 · 45 |
| Entrenamiento / cultivo (mejoras) | scripts/verbe-training.js | `MEJORAS`, `opcionesCultivo`, `aplicarCultivoUtilidad` | 2 · 10 · 31 |
| Recuperación de reserva (cálculo puro) | scripts/verbe-core.js | `recuperarReserva` | 11 |
| Mesa Ecos (ventana del DM) | scripts/mesa.js | clase `MesaEcos`, `abrirMesa`, `guardarNpc`, `crearPersonaje` | 113 · 260 · 66 · 108 |
| Mesa: diagnóstico | scripts/mesa-diagnostico.js | `diagnosticoMesa`, `registrarPrueba`, `exportarDiagnostico` | 20 · 41 · 46 |
| Mesa: vistas (pestaña de diagnóstico) | scripts/mesa-vistas.js | uso de `diagnosticoMesa` | 35 |
| Mesa: recibos de técnica | scripts/mesa-resolucion.js | `prepararRecibo`, `confirmarRecibo`, `reciboHTML` | 7 · 19 · 38 |
| Reliquias | scripts/relics.js | `cargar` y funciones del DM | 21–123 |
| Calendario | scripts/calendario.js | (254 líneas) | — |
| Panel de estados (UI) | scripts/main.js | `PANEL_ESTADOS` | 4334 |
| Avisos de estado en la hoja | scripts/verbe-ui.js | aviso «Sin reacción mientras estés Cargado» | 54 |

## 2. Datos que pidió la tarea

### Tabla de reserva de Verbe por nivel (el «167»)

No está en `scripts/`: vive **cifrada** en `data/verbe.txt`, clave `verbeMax`. Se decodifica con `readCatalog()` de `tools/catalog.mjs`.

```
nivel: 1:5  2:8  3:18  4:22  5:34  6:40  7:48  8:55  9:72  10:80
       11:92 12:92 13:104 14:104 15:118 16:118 17:134 18:143 19:154 20:167
```

Dónde se usa (las tres son lecturas de `D.verbeMax[nivel]`):

- `maxVerbe(actor)` — scripts/verbe.js:252 (tabla + modificador de la característica + dotes + herencia + don divino). **Es el punto único a tocar para la tarea de reserva por dados (D3).**
- Cálculo del don divino — scripts/verbe.js:2397.
- Tabla de ayuda del panel — scripts/verbe.js:2483 (muestra niveles 1, 2, 3, 5, 7, 9, 11, 13, 15, 17, 20).
- `limiteNegativo` — scripts/verbe.js:265 deriva de `maxVerbe`.

### Dónde se definen los estados

- **Estados de naturaleza** (`empapado`, `ardiendo`, `desequilibrado`, `embarrado`, `cargado`): objeto `ESTADOS`, scripts/verbe.js:66 (`cargado` en la línea 79).
- Mapa naturaleza → estado: `ESTADO_NAT`, scripts/verbe.js:88.
- Crear el efecto activo: `efectoEstado`, scripts/verbe.js:628.
- Estados que se pueden añadir a técnicas propias: `estadosEditor`, scripts/verbe.js:1791 (une `ESTADOS` con `CONFIG.statusEffects`).
- Revisión de estados activos: `revisarEstados`, scripts/verbe-effects.js:90.
- **«Canalizando» (D10) no existe todavía**: `grep -n Canalizando scripts/*.js` no da resultados. «Cargado» sí existe y es del Rayo.

### Dónde se aplican las técnicas

1. El jugador usa el ítem; dnd5e dispara `dnd5e.activityConsumption` (scripts/verbe.js:3803), que cobra el Verbe.
2. `usarTecnica` (610) es la ruta del panel; `datosItem` (637) arma el ítem con plantilla, efectos y estado elemental (704).
3. `dnd5e.postUseActivity` (3807) llama a `despuesDeUsar` (1134).
4. Con midi-qol activo, `preCheckHits` / `preCheckSaves` / `preDamageRoll` (3819–3821) abren las defensas y el choque.
5. `RollComplete` (3822) limpia las defensas.

### Catálogo (resumen)

`data/verbe.txt` → 860 técnicas, 219 dotes (más 78 reliquias en `data/reliquias.txt`). Claves del catálogo decodificado: `version, costo, verbeMax, gradoMax, ramas, rangos, naturalezas, combos, ciclo, tecnicas, dotes, innatos, textoFuerte, categoriasDote, defensas, miradas, pactos, herencias, cerrojos, dones, escuelas, afinidad, estados, cultivo, mejoras, equipo, presupuesto, linajes, tradicionesShinobi, hitosShinobi, bestiasShinobi, shinobi, artefactosShinobi, progresion, panteon, divinidad, lectura, vida, identidad, etiquetas, memoriaNimerios`. Cómo editarlo es la tarea 0.3.

## 3. Diferencias con el programa de tareas

- `costoRango`: el programa decía «~línea 309»; la función empieza en 304 y el `+1` está en 311 (309 es el comentario).
- «Probar» naturaleza: confirmado en 1476–1478.
- Choques: `verbe-clash.js` tiene 17 líneas y solo contiene `tecnicaChocable` y textos; la lógica real está en `verbe.js` 3547–3638.
- Existe un **segundo** enganche a `midi-qol.preCheckHits` en `scripts/main.js:2173`, no mencionado en el programa. Revísalo en la tarea 1.5 (ventaja/desventaja) para no duplicar preguntas.
- «getsuga» no aparece en `scripts/`, `docs/` salvo la mención en `docs/AUDITORIA_MECANICAS.md:46`, como dice el programa (tarea 1.3).
