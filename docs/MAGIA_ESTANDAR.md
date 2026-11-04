# Magia estándar y el Verbe (3.8, tareas 4.1a–c)

## 4.1a · Lore (aprobado y escrito)

El autor lo aprobó el 3-nov-2026 con un pedido: que la magia y el Verbe tengan el mismo origen. La magia moldea la realidad, el Verbe usa la energía interna y ninguno existe sin el otro. La versión final está en el diario «Mundo 6 · Magia y misterios», página «1 · Cómo funciona la magia», sección nueva «La magia y el Verbe» al final. No se tocó lo ya escrito.

**Resumen.** Las dos nacen del sueño de Maethra:

- La magia toma el sueño que corre por fuera (las líneas bajo la tierra) y moldea la realidad.
- El Verbe toma el sueño de dentro de cada cosa viva y lo usa como energía.

Ninguna existe sin la otra:

- un conjuro necesita una mente viva que sueña con su propio Verbe aunque esté dormido;
- el Verbe se llena del sueño de fuera: un cuerpo que no sueña no tiene Verbe.

Casi nadie lo sabe; los fareros lo sospechan. En combate chocan igual (regla del 4.1c).

No añade reglas nuevas: la recuperación de Verbe y el cristal mudo siguen como estaban.

## 4.1b · Mapa de elementos

Un conjuro toma la naturaleza de su **primer tipo de daño**; si su daño no dice nada, la de su **escuela**.

| Tipo de daño | Naturaleza |
|---|---|
| Fuego | Fuego |
| Frío | Agua |
| Relámpago | Rayo |
| Trueno | Viento |
| Ácido | Tierra |
| Contundente | Tierra |
| Perforante, cortante | Viento |
| Fuerza, psíquico, radiante, necrótico, veneno | Sin naturaleza |

| Escuela (sin tipo útil) | Naturaleza |
|---|---|
| Evocación | Fuego |
| Conjuración, abjuración | Tierra |
| Transmutación | Agua |
| Ilusión, encantamiento, adivinación, nigromancia | Sin naturaleza |

## 4.1c · El conjuro entra al choque

Si alguien con el Verbe despierto recibe un conjuro ofensivo (ataque o salvación con daño, lanzado con acción o acción adicional), puede interceptarlo con una técnica igual que contra otra técnica. La potencia del conjuro es el **nivel del espacio** con que se lanzó (un truco cuenta como 0). Se resuelve con la regla de siempre: con ventaja elemental, +2 grados; sin ella, Control del Verbe más el grado de cada lado (quien lanza el conjuro sin Verbe tira 1d20). Ganar protege solo al que se defiende.

El mapa vive en `scripts/verbe-clash.js` (`DANO_A_NATURALEZA`, `ESCUELA_A_NATURALEZA`). Pendiente de aprobación del autor.

## Resonancia del Verbe (3.15, aprobada por el autor)

Dote gratis al despertar el Verbe (los que ya despertaron la reciben al cargar el mundo). Cuando lanzas un conjuro normal de D&D o de PF2e que es **afín** a ti, su tirada de ataque recibe +1 y su CD sube 1. No vale para técnicas del Verbe ni para pergaminos, y no se suma dos veces: como mucho +1.

- **Afín por naturaleza:** la naturaleza del conjuro, según el mapa de 4.1b, es una de las tuyas (la de nacimiento, la descubierta, las de tu herencia y las extra).
- **Afín por rama:** tienes rango 1 o más en la rama de su escuela.

| Escuela | Rama |
|---|---|
| Evocación | Forma |
| Ilusión, Encantamiento | Velo |
| Abjuración | Sello |
| Adivinación | Rastro |
| Conjuración | Umbral |
| Nigromancia (y cualquier conjuro que cure) | Pulso |
| Transmutación | Cuerpo |

El código está en `scripts/resonancia.js`: la CD se suma al preparar la actividad (se ve en la hoja y en la tarjeta) y el ataque, en la tirada. El DM puede quitar la dote de una hoja para quitar el bono.
