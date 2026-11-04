# Conversión de hechizos de PF2e a dnd5e (3.8, tareas 4.2a–e)

Estado (3-nov-2026): 4.2a, 4.2b y 4.2c hechas. Faltan los lotes (4.2d) y la biblioteca (4.2e).

## 4.2a · Exportar (hecha)

En tu PC no hay ningún mundo PF2e: el único mundo es «Fantasy and Agony». Por eso la exportación lee directamente del disco:

- el compendio de hechizos del sistema PF2e instalado (8.6.1, carpeta `Data/systems/pf2e/packs/spells`);
- la traducción de `pf2e-es`, para el nombre y el texto en castellano.

No hace falta abrir un mundo PF2e.

| Qué | Dónde |
|---|---|
| Herramienta | `tools/pf2e/exportar_hechizos.py` (más `tools/pf2e/leveldb.py`, que lee los compendios de Foundry). Se ejecuta en tu PC con `python exportar_hechizos.py`. |
| Resultado | `Data/ecos-pf2e/hechizos-pf2e.json` en tu PC: 2.017 hechizos. |

**Campos del resultado:**

- nombre, en inglés y en castellano;
- rango, tradiciones, rasgos y rareza;
- acciones, alcance, área y objetivo;
- salvación, duración, daño e intensificación;
- fuente y licencia;
- texto, en inglés y en castellano.

**Licencias:** 1.486 hechizos son ORC (Remaster) y 531 son OGL.

## 4.2b · Filtro de redundancia (hecho)

| Qué | Dónde |
|---|---|
| Herramienta | `tools/pf2e/filtrar_redundantes.py`. Compara con los compendios `dnd5e.spells` y `dnd5e.spells24` del disco (342 conjuros). |
| Resultado | `Data/ecos-pf2e/filtro-pf2e.json` en tu PC. |

**Redundantes: 631.**

| Motivo | Cantidad |
|---|---|
| Hechizos de foco: son de clase y no van a una lista de conjuros | 499 |
| Mismo nombre que un conjuro de dnd5e | 109 |
| Mismo efecto con otro nombre (Force Barrage → Magic Missile, Heal → Cure Wounds…) | 23 |

**Únicos a convertir: 1.386.**

| Rango | Truco | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Hechizos | 102 | 181 | 224 | 200 | 177 | 166 | 106 | 79 | 65 | 53 | 33 |

Por rareza: 826 comunes, 382 poco comunes, 168 raros y 10 únicos.

Chris's Premades y MISC Spells no se compararon: no están instalados en el mundo actual.

**Siguiente paso (4.2d).** Convertir por lotes de unos 10 en el compendio del mundo `world.ecos-conjuros-pf2e`, empezando por los trucos y el rango 1. Se hace desde Foundry con el mundo abierto, leyendo `filtro-pf2e.json` desde tu carpeta de datos. Al ritmo de un lote por tanda son unos 140 lotes: conviene priorizar por tradición o por lo que vayan a usar tus jugadores.

## 4.2c · Reglas

| PF2e | dnd5e |
|---|---|
| 1 acción | Acción adicional |
| 2 acciones | Acción |
| 3 acciones | Acción (y el DM puede pedir Concentración si es sostenido) |
| Reacción | Reacción (con el disparador del texto) |
| 1 minuto o más | El mismo tiempo (ritual si lo es) |
| Rango 1–10 | Nivel = mitad del rango hacia arriba (1–2 → 1, 3–4 → 2, 5–6 → 3, 7–8 → 4, 9 → 5, 10 → 6). Truco → nivel 0 |
| Intensificado (+1) / (+2) | A niveles superiores: el mismo aumento cada nivel de espacio equivalente |
| Salvación básica | Mitad del daño si salva |
| Fortaleza / Reflejos / Voluntad | CON / DES / SAB |
| CA (ataque de conjuro) | Ataque de conjuro |
| Cuatro grados de éxito | Fallo crítico = efecto de fallo con un estado extra solo si el texto lo pide; se resuelve como éxito/fallo de dnd5e |
| Estados con valor (asustado 2, debilitado 1) | El estado de dnd5e equivalente, con su duración; el valor se vuelve desventaja o −2 según el texto |
| Rasgo de daño (fuego, frío, electricidad, sónico, vitalidad, vacío, espíritu) | fuego, frío, relámpago, trueno, radiante, necrótico, fuerza |
| Rareza (común, poco común, raro, único) | Se tratan igual (D11); solo cambia el coste para aprenderlo: común 1×, poco común 1,5×, raro 2×, único 3× |

Redundancia (4.2b): se descarta un hechizo si ya existe en `dnd5e.spells`, `dnd5e.spells24`, Chris's Premades o MISC con el mismo nombre en inglés o el mismo efecto principal (por ejemplo Bola de fuego).

Destino (4.2d): compendio del mundo `world.ecos-conjuros-pf2e`, por lotes de unos 10, registrados en `docs/CONVERSION_PF2E_LOTES.md`.

## Licencia

Por lo que se encuentra en la web, el material Remaster de Paizo (Player Core, GM Core…) se publica bajo la licencia ORC y el anterior al Remaster bajo la OGL; el campo `licencia` de la exportación lo dice hechizo por hechizo. El repositorio es público: ni la exportación ni los hechizos convertidos se suben a él. Quedan en tu PC y en el compendio de tu mundo, y cada hechizo convertido cita su fuente y licencia. Fuentes: [Wargamer · core rulebooks remaster ORC](https://www.wargamer.com/pathfinder/core-rulebooks-remaster-orc), [Paizo · foro sobre el Remaster](https://paizo.com/threads/rzs8dx1e).
