# Conversión de hechizos de PF2e a dnd5e (3.8, tareas 4.2a–e)

Estado (4-nov-2026): 4.2a a 4.2e hechas.

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

## 4.2d · Conversión (hecha, 3.15)

En vez de 140 lotes a mano, un conversor aplica las reglas de 4.2c a los 1.386 de una vez, y el módulo los lleva al compendio. Registro por nivel en `docs/CONVERSION_PF2E_LOTES.md`.

| Qué | Dónde |
|---|---|
| Conversor | `tools/pf2e/convertir_conjuros.py`. Se ejecuta en `Data/ecos-pf2e/` con `python convertir_conjuros.py <carpeta del pack de hechizos de PF2e>` (el pack da los iconos). |
| Resultado | `Data/ecos-pf2e/conjuros-dnd5e.json` en tu PC (no en el repositorio: lleva texto de Paizo). |
| Importador | `scripts/conjuros.js`. Al cargar el mundo, el DM lleva el archivo al compendio `world.ecos-conjuros-pf2e` («Conjuros de PF2e (Ecos)») si cambió; la Mesa tiene el botón «Importar conjuros de PF2e». |
| Listas de clase | Compendio `world.ecos-listas-pf2e`: una página de lista de dnd5e por clase, registrada en el buscador de dnd5e, y el glosario «Cómo leer los conjuros de PF2e». |

**Qué hace el conversor con cada hechizo:**

- Nombre en castellano con el inglés entre paréntesis («Explosión ácida (Acidic Burst)»), para buscar en los dos idiomas.
- Nivel, tiempo de lanzamiento, alcance, área, objetivo y duración con las tablas de 4.2c. «Concentrar» y «manipular» pasan a componentes verbal y somático; «sostenido», a Concentración.
- Una actividad de dnd5e: ataque de conjuro si el hechizo ataca; salvación (CON, DES o SAB, con la mitad si es básica) si pide salvación; daño o curación si solo hace eso; y utilidad para el resto. El daño se tira con los dados del hechizo; el persistente queda en el texto.
- **Potenciado a niveles superiores:** como un nivel de espacio equivale a dos rangos, «Potenciado (+1)» suma el doble por nivel; «(+2)», lo mismo por nivel; «(+3)» o «(+4)», cada dos niveles. En los trucos, igual por cada salto de dnd5e (niveles 5, 11 y 17).
- Escuela: la del rasgo si el hechizo es anterior al Remaster; si no, la que dicen sus rasgos (ilusión, mental, teletransporte, polimorfia, detección, vacío, curación…). Sin pistas: Evocación si hace daño, Transmutación si no.
- Texto en castellano sin los enlaces de PF2e: daños, pruebas, plantillas y acciones pasan a texto de D&D («salvación de Destreza (la mitad si la supera)», «3d6 de daño de veneno»). Fortaleza, Reflejos y Voluntad pasan a Constitución, Destreza y Sabiduría.
- **Grados de éxito:** si supera, lo de Éxito; si falla, lo de Fallo; con un 20 natural, lo de Éxito crítico, y con un 1 natural, lo de Fallo crítico. Así la regla de D&D manda (dos resultados) y los críticos de PF2e se enganchan al 20 y al 1, como el resto de Ecos.
- Cada conjuro cita su fuente, su licencia (ORC u OGL), sus tradiciones y su rareza, y una nota que explica la conversión.
- Listas de clase por tradición: arcana → mago y hechicero; ocultista → bardo y brujo; divina → clérigo y paladín; primigenia → druida y explorador.

**Resultado:** 102 trucos y 405, 377, 272, 144, 53 y 33 conjuros de nivel 1 a 6.

## 4.2e · Biblioteca (hecha, 3.18)

En el compendio «Listas de conjuros de PF2e (Ecos)», el diario trae una página **Biblioteca** por nivel (Trucos a Nivel 6). Cada una lista los conjuros por escuela y nombre, con enlace al conjuro, su tipo (ataque, salvación, daño, curación o utilidad), las clases que lo tienen en su lista y su rareza, y arriba cuántos hay de cada escuela. La escribe el importador; al actualizar el módulo, el mundo la crea solo al cargar.

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
