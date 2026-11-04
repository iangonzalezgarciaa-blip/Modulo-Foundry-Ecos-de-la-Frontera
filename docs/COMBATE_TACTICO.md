# Combate táctico (versión 3.13)

*Reglas de la casa para que el combate premie el engaño, el plan, moverse bien y conocer al enemigo. El autor aprobó las diez el 4-nov-2026 con dos condiciones: cada regla con condiciones cerradas y un resultado concreto, y todo bajo un interruptor global que vale para todos los PJ y PNJ, con bandos para cuando hay tres o más grupos.*

*Desde 3.14 manda una tercera condición del autor: **primero D&D**. Nada de esto quita ni cambia una regla del Manual; lo que ya existe en D&D o en PF2e se resuelve como allí, y lo de Ecos se suma (ver «D&D primero», al final).*

Los jugadores tienen la misma regla escrita en el mundo, en **Reglas de la casa · 14 · Combate táctico**. La página se crea sola al cargar el mundo y no se pisa si el DM la edita.

## Encender y apagar

En **Mesa Ecos → Control → Combate táctico**:

- **Encendido** apaga o enciende todo a la vez.
- Debajo hay una casilla por regla. Una regla apagada no hace nada, aunque el resto siga encendido.
- Por defecto, todo encendido.

Las acciones de las hojas (Fintar, Leer al rival, Interponerse, Planear, Evaluar al enemigo, Aprovechar el terreno) siguen en las hojas aunque el combate táctico esté apagado. Lo que se apaga es lo que el módulo hace solo con ellas.

## Bandos

Cada token pertenece a un bando. «Aliado» quiere decir del mismo bando, y «enemigo», de cualquier otro.

| Disposición del token | Bando por defecto |
|---|---|
| Amistoso | Aliados |
| Neutral | Neutrales |
| Hostil | Enemigos |
| Secreto | Secretos |

**Tres o más bandos** (por ejemplo, el grupo contra unos bandidos contra la guardia):

1. En la Mesa, escribe el nombre en **Nuevo bando** y pulsa **Crear bando**.
2. Selecciona en la escena los tokens de ese bando.
3. Elige el bando en la lista y pulsa **Asignar a los seleccionados**.

Un bando asignado manda sobre la disposición. Para devolver un token a su bando por disposición, asígnale Aliados, Enemigos o Neutrales.

Con los mismos tokens seleccionados, tres botones más:

- **Marcar o quitar líder**: para la moral.
- **Marcar o quitar secuaz**: para los secuaces.
- **Marcar o quitar «única»**: Evaluar contra ella cuesta 5 más.

## Las diez reglas

| # | Regla | Cuándo, exactamente | Qué pasa | Lo hace el módulo |
|---|---|---|---|---|
| 1 | **Desprevenido** | La criatura tiene el estado Desprevenido. Lo ponen Fintar (hasta el final del turno de quien fintó) y Leer al rival (hasta el final del siguiente turno de quien leyó), si falla la salvación. | Todo ataque contra ella suma +2. No se acumula: dos fuentes siguen siendo +2. | Suma el +2 en la tirada de ataque, con la etiqueta «Desprevenido». |
| 2 | **Rodear** | Atacas cuerpo a cuerpo a una criatura a 1,5 m de ti. Un aliado tuyo, consciente y no incapacitado, también está a 1,5 m de ella. La línea entre el centro de tu casilla y el de la suya cruza su espacio por lados opuestos o por esquinas opuestas. | Está Desprevenida contra ese ataque: +2. No se suma al Desprevenido de Fintar. Si la mesa usa el flanqueo opcional de la Guía del DM (ventaja, en midi-qol), manda ese y Rodear no suma (3.14). | Lo mide en la escena al atacar con un blanco marcado. |
| 3 | **El engaño elige el golpe** | Fallas la salvación de Distraer o de Fintar por 5 o más: tu total es la CD − 5 o menos. | Si quien te engañó saca un 20 natural en un ataque contra ti antes del final de su siguiente turno, no se sortea el efecto del 20: lo elige él entre los ocho. | La tarjeta del 20 muestra ocho botones «Elegir» en vez del sorteo. |
| 4 | **Plan maestro** | Sacas 20 o más en Planear (Investigación), y el combate empieza en la hora siguiente. | Al empezar el combate eliges a un aliado de tu bando. Su iniciativa pasa a ser la más alta + 1, así que actúa primero. El plan se gasta. | Al empezar el combate abre el diálogo a quien planeó y cambia la iniciativa. |
| 5 | **Moral de los PNJ** | En un combate, un bando de PNJ pierde a su líder (marcado por el DM), o cae a 0 PG la mitad de los que empezaron. Cada motivo cuenta una vez por combate. | Cada PNJ de ese bando que sigue en pie salva Sabiduría CD 10. Si falla, queda **Desmoralizado**: en su turno usa Correr para alejarse de sus enemigos por la ruta más segura. Si no puede alejarse, se rinde: suelta lo que tiene en las manos y no ataca. Dura hasta el final del combate, o hasta que un aliado use una acción para Arengarlo. No afecta a no muertos, constructos, cienos ni a quien es inmune a Asustado. | Tira las salvaciones, pone el estado y le susurra el resultado al DM. El DM mueve a los que huyen. |
| 6 | **Secuaces** | El DM marcó al PNJ como secuaz. | Cualquier daño lo deja a 0 PG. Si supera una salvación contra un efecto que hace la mitad, no recibe nada. | Lo aplica al recibir daño. |
| 7 | **Técnicas combinadas** | Dos criaturas distintas del mismo bando dañan a la misma criatura con técnicas del Verbe de naturaleza Fuego, Agua, Viento, Tierra o Rayo. La segunda llega en el turno justo siguiente al de la primera. Sus naturalezas forman combinación. | La criatura recibe además 2d6 del tipo de la combinación y sus estados (tabla de abajo). | Lo detecta al aplicar el daño de la segunda técnica. |
| 8 | **Interponerse** | Reacción. Una criatura que ves ataca a un aliado a 1,5 m de ti. No estás Incapacitado ni Agarrado, y tu velocidad no es 0. | El aliado tiene +2 a la CA contra ese ataque (estado Protegido, hasta el final de ese turno). Si aun así impacta, el daño lo recibes tú en vez de él. | Es una acción de la hoja («Acciones de Destreza»). Marca al aliado como blanco y úsala: le pone Protegido. Si el ataque impacta, el DM te aplica el daño a ti. |
| 9 | **Terreno vivo** | El DM dibujó en la escena una región llamada «Terreno vivo: …». Sacas 12 o más en Aprovechar el terreno. | Te dice qué hay a 9 m o menos. Usarlo cuesta tu acción. Quien está dentro salva contra 8 + tu INT + tu competencia, y si falla recibe lo que diga el elemento (tabla de abajo). | Revela las regiones en el chat con un botón «Usarlo» y resuelve las salvaciones, el daño y los estados. |
| 10 | **Evaluar automático** | Usas Evaluar al enemigo con un blanco marcado. | La CD es 10 + su VD, con +5 si tiene acciones legendarias o el DM la marcó como única. Si la superas, recibes en privado un dato, y uno más por cada 5 que pases. El orden es: su salvación más débil, sus resistencias e inmunidades, lo que le hace más daño, su salvación más fuerte y su CA. | Te susurra los datos. Lo que no ganaste no aparece. |

### Combinaciones (regla 7)

| Naturalezas | Combinación | Daño extra | Estados |
|---|---|---|---|
| Fuego + Agua | Vapor | 2d6 fuego | Ardiendo |
| Fuego + Viento | Ceniza | 2d6 fuego | Ardiendo |
| Fuego + Tierra | Magma | 2d6 fuego | Ardiendo y Embarrado |
| Fuego + Rayo | Destello | 2d6 radiante | Cargado |
| Agua + Viento | Escarcha | 2d6 frío | Helado |
| Agua + Tierra | Raíz | 2d6 perforante | Embarrado |
| Agua + Rayo | Tormenta | 2d6 relámpago | Desequilibrado y Cargado |
| Viento + Tierra | Arena | 2d6 contundente | Embarrado |
| Tierra + Rayo | Hierro | 2d6 perforante | Cargado |
| Viento + Rayo | No combinan | — | — |

### Terreno vivo (regla 9)

El nombre de la región decide qué es. Por ejemplo, «Terreno vivo: lámpara del techo» o «Terreno vivo: barril de aceite».

| Si el nombre dice | Es | Salvación | Si falla |
|---|---|---|---|
| lámpara, candelabro, antorcha, brasero | Lámpara o fuego | DES | 2d6 fuego y Ardiendo |
| aceite, grasa, hielo, barro | Suelo resbaladizo | DES | Derribado |
| cornisa, borde, precipicio, barandilla | Borde | FUE | Cae: 2d6 contundente y Derribado abajo |
| escombro, techo, viga, estantería, derrumbe | Derrumbe | DES | 3d6 contundente y Apresado |
| cuerda, red, cadena, telar | Cuerdas | DES | Apresado |
| humo, polvo, harina, ceniza | Humo o polvo | CON | Cegado hasta el final de su próximo turno |
| agua, charco, río, cubo | Agua | Ninguna | Empapado |
| cualquier otra cosa | Lo que diga el DM | — | Lo describe el DM |

## D&D primero (3.14)

El autor: «lo que más me interesa es respetar D&D base; si hay alguna técnica que sea igual que en D&D o Pathfinder 2e, que sean complementarias. Odio matar mecánicas». Así queda:

**El 20.** Vuelve el crítico del Manual: el 20 natural en un ataque tira los dados de daño dos veces, y además saca su efecto de la tabla del d20. El 1 en un ataque sigue fallando siempre. En salvaciones y pruebas, el 1 y el 20 no cambian el éxito ni el fracaso; solo añaden una consecuencia. La regla de 3.12 (sin daño doble) queda como ajuste apagado.

**Las acciones de cualquiera.** Cada fila de «12 · Lo que cualquiera puede intentar» dice si es regla base del Manual o de Ecos.

| Acción | Origen | CD o tirada |
|---|---|---|
| Presa, Empujón (derribar y apartar) | Manual (Golpe sin armas) | 8 + FUE + competencia, como en el Manual. Empujón aparta 1,5 m, como en el Manual. |
| Escapar o forzar | Manual | Atletismo o Acrobacias contra la CD de la presa. |
| Esquivar, Esconderse, Buscar, Ayudar | Manual | Como en el Manual (Esconderse: Sigilo CD 15; Buscar: Percepción, Perspicacia, Medicina o Supervivencia). |
| Evaluar al enemigo | Manual (Estudiar) | Ecos añade la CD (10 + VD) y qué te dice. |
| Parlamentar | Manual (Influir) | CD 15 o su Inteligencia, la mayor. Ecos añade que, si lo logras, duda un turno. |
| Fintar, Distraer | Ecos | 8 + tu Engaño. |
| Intimidar, Provocar | Ecos | 8 + tu Intimidación. |
| Leer al rival | Ecos | 8 + tu Perspicacia. |
| Birlar | Ecos | 8 + tu Juego de manos. |
| Zancadilla, Voltereta | Ecos | 8 + tus Acrobacias. |
| Desarmar | Ecos | 8 + tu Atletismo o tus Acrobacias, el mejor. |
| Abrirse paso | Ecos | 8 + tu Atletismo. |
| Lanzar a quien sujetas, Polvo en los ojos | Ecos | 8 + FUE o DES + competencia. |
| Ponerse a cubierto | Ecos | Sube un paso la cobertura que ya tienes por estar detrás de algo (media → tres cuartos). No la repite: la cobertura del Manual sigue siendo gratis. |
| Apuntar, Interponerse, Aguantar, Sacudirse, Resistir, Planear, Aprovechar el terreno, Serenarse, Arengar | Ecos | Se suman al Manual. |

Con la pericia, cuentan la competencia, la Pericia doble (bardo, pícaro) y los bonos de clase: un pícaro experto finta mejor que un guerrero con el mismo Carisma.

**Tu clase manda.** Si la clase ya tiene algo parecido, lo de la clase sigue igual y suele ser mejor. Cuesta la misma acción, así que no se suman en el mismo turno:

| De la clase | Se parece a |
|---|---|
| Golpe sin armas del monje o del pugilista | Golpe sin armas (se usa el de la clase) |
| Defensa paciente (monje) | Esquivar |
| Apuntar con firmeza (pícaro) | Apuntar |
| Estilo Protección o Intercepción | Interponerse |
| Maniobras del Maestro de batalla (Amago, Derribo, Desarme, Provocación, Amenaza, Arenga) | Fintar, Zancadilla, Desarmar, Provocar, Intimidar, Arengar |
| Inspiración bárdica | Planear |

**Rodear y el flanqueo.** Si la mesa usa el flanqueo opcional de la Guía del DM (en midi-qol), manda ese y Rodear no suma.

**En PF2e.** Se usan las acciones del sistema (Grapple, Trip, Shove, Disarm, Feint, Demoralize, Create a Diversion, Hide, Sneak, Seek, Aid, Take Cover, Tumble Through, Recall Knowledge, Steal, Escape, Force Open) y su crítico con daño doble y grados de éxito. Ecos solo añade las que PF2e no tiene. Desprevenido es su *off-guard* y Rodear su *flanking*.

## Ordenar los diarios

Al cargar el mundo, el módulo junta los diarios del DM que crea él y que estén sueltos: panteón, compendio del Verbe, archivo de reliquias, memoria de Nimerios, cuaderno de sesión y pruebas de mesa. Los manda a la carpeta **Mesa, tramas y personajes [DM]**, numerados a continuación de los que ya tiene. Si esa carpeta no existe, crea **Ecos (solo DM)**.

- Solo renombra los que aún tienen el nombre de fábrica («Ecos · …»). Si renombraste uno, conserva tu nombre.
- Nunca mueve un diario que ya está en una carpeta.
- «sequencerDatabase» va a **Módulos (no tocar)**, si esa carpeta existe.
- No cambia los permisos.

## El lore en PF2e

Un mundo de Foundry funciona con un solo sistema, así que el mundo PF2e será un mundo aparte con el mismo lore.

| Paso | Estado |
|---|---|
| Dioses: cada dios del panteón como deidad de PF2e (edictos, anatemas, atributo, fuente divina, santificación, habilidad, arma, dominios) | Borrador escrito en el mundo del autor, en **Mundo 1 · 27 · Los dioses en PF2e (borrador)**, solo DM. No va en el repositorio porque mezcla secretos de campaña. Espera la revisión del autor. |
| Diarios: todos los del mundo, con carpetas, enlaces y permisos, en el compendio de un módulo local, solo en el PC del autor | Hecho el módulo `Data/modules/ecos-lore-nimerios` (no está en el repositorio). En Fantasy and Agony, «Exportar lore» en la barra de Diarios; en el mundo PF2e, «Importar lore». |
| Pueblos como ascendencias y herencias de PF2e | Pendiente. |
| Reglas de la casa con cifras de PF2e | Con el adaptador (5.2d). |
| Conjuros de PF2e al compendio `world.ecos-conjuros-pf2e` | Hecho en 3.15 (4.2d). |
