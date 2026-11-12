# Dotes, especies y objetos de PF2e a D&D (3.52)

Pedido del autor (12-nov-2026): traer de PF2e lo **nuevo** (lo que D&D ya tiene no), **nivelado y adaptado a D&D**.

| Qué | Cuánto | Notas |
|---|---:|---|
| Dotes menores | 2 874 | Generales (32), de habilidad (227), de ascendencia (1 613) y de clase (1 002). Sin arquetipos ni dedicaciones. Las de clase solo de las clases con equivalente en D&D: Bárbaro, Bardo, Campeón → Paladín, Clérigo, Druida, Guerrero, Monje, Explorador, Pícaro, Hechicero, Mago, Bruja → Brujo. |
| Especies | 45 | Las de D&D (Aasimar, Dracónido, Enano, Elfo, Gnomo, Goliat, Mediano, Humano, Orco, Tiflin) se omiten. |
| Herencias | 334 | De cada especie y versátiles. |
| Objetos | 5 723 | Venenos por etapas, alquímicos, pociones y elixires, consumibles, armas, armaduras y escudos, equipo y objetos mágicos, tesoros y contenedores. Se omiten 190 que D&D ya tiene. |

**Nivelación** (`tools/pf2e/convertir_dotes.py`): salvaciones (Reflejos → Destreza, Fortaleza → Constitución, Voluntad → Sabiduría), rangos de competencia (entrenado → competente; experto → pericia; maestro → pericia y nivel 7; legendario → pericia y nivel 15), habilidades (Sociedad → Historia, Ocultismo → Arcanos, Diplomacia → Persuasión, Latrocinio → Juego de manos), estados, acciones (1 acción → Acción adicional; 2 o 3 → Acción), frecuencias (por día → Descanso Largo; por hora o 10 minutos → Descanso Corto), puntos de foco (usos por Descanso Corto), bonificadores sin tipo, «Alzar un escudo», resistencias y debilidades de PF2e explicadas, grados de éxito. Objetos: armas con propiedades y maestrías de D&D (ágil → ligera, sutil, alcance, arrojadiza, a dos manos o versátil), armaduras con CA de D&D, precios ×10 (PF2e usa patrón de plata), CD de consumibles 11 + la mitad del nivel, venenos con sus etapas en flags para la mecánica de 3.55.

**Dónde viven**: los archivos convertidos están en `Data/ecos-pf2e/` del PC del autor y en tres compendios del mundo («Dotes de PF2e (Ecos)», «Especies y herencias de PF2e (Ecos)», «Objetos de PF2e (Ecos)»). El texto es de Paizo (ORC u OGL, citado en cada documento): **no** está en este repositorio.

## Dotes menores por nivel (3.53)

`scripts/dotes-nivel.js`. Pestaña **Dotes** en las hojas de PJ (registrada en la hoja de personaje de dnd5e) con un hueco en cada nivel sin Mejora de característica:

| Nivel | 2 | 3 | 5 | 6 | 7 | 9 | 10 | 11 | 13 | 14 | 15 | 17 | 18 | 20 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Hueco | Clase | General | Ascendencia | Clase | Habilidad | Ascendencia | Clase | General | Ascendencia | Clase | Habilidad | Ascendencia | Clase | Habilidad |

- **Elegibles**: dotes de esa categoría (el hueco general admite también de habilidad), de nivel ≤ al del hueco; las de clase, de una clase del PJ y de nivel ≤ a sus niveles en ella; las de ascendencia, de su especie (las de D&D se mapean: Elfo → elf, Tiflin y Aasimar → nefilim, Dracónido → sangre de dragón, Goliat → nacido de los gigantes, Semielfo → humano/elfo/aiuvarin…) o de su herencia versátil. Requisitos comprobados: competencia/pericia, característica, dotes previas; lo demás «Lo confirma el DM». Poco comunes y raras, con permiso (ajuste del mundo).
- **Sin dotes de PF2e** para su clase o su especie: ese hueco admite generales o de habilidad (o el DM elige de dónde salen).
- **Herencia** (nivel 1): especies de PF2e, o la que el DM habilite.
- **Revertir**: × del hueco, «Deshacer» del chat, ajuste «Dotes menores por nivel» del mundo. **A mano (DM)**: «Sin filtros», «Asignar una dote a mano», clase/ascendencia/herencia para las dotes de cada PJ.
- **Aviso** al subir de nivel con botón a la pestaña. PNJ: Rasgos → «Sumar dotes de PF2e».
