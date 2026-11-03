# Línea base · 3.4.1 (tarea 0.2)

Punto de partida medido el 3 de noviembre de 2026 sobre `main` (commit `b5aa144`), con Node 22. Sirve para comparar cada tarea siguiente: si algo de esta lista empeora, hay que explicarlo.

| Comando | Resultado |
|---|---|
| `npm test` | 238 pruebas, 238 pasan, 0 fallan, 0 omitidas (≈4 s). |
| `npm run check` | Sintaxis, JSON, importaciones y catálogo válidos: 860 técnicas, 219 dotes. |
| `npm run catalog:audit` | 0 errores de validación. 389 técnicas de utilidad sin efecto automático (resolución de mesa, no es un fallo). |
| `npm run balance` | Escenarios de balance y calibración de niveles 1, 5, 11, 16, 18 y 20 generados con compras reales; 96 secuencias comprobadas. |
| `npm run catalog:expand` | Idempotente: no cambia `data/verbe.txt` ni `data/reliquias.txt` (lo exige el flujo de Release). |

## Técnicas por rama

| Rama | Técnicas |
|---|---|
| Forma | 173 |
| Velo | 53 |
| Cuerpo | 66 |
| Mirada | 59 |
| Sello | 71 |
| Pacto | 57 |
| Pulso | 50 |
| Hilo | 66 |
| Quietud | 50 |
| Rastro | 50 |
| Sangre | 85 |
| Umbral | 33 |
| Vasija | 47 |
| **Total** | **860** |

## Fallos conocidos de partida

Ninguno. Lo único sin comprobar es lo de siempre: el funcionamiento dentro del Foundry instalado del autor.
