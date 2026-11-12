import {ASPECTO} from './relics-aspecto.mjs';
/** Nombres documentados + adaptación propia de mesa. No copia reglas de otros suplementos. */
const wiki='https://madeinabyss.fandom.com/wiki/';
// nombre original, traducción de mesa, grado de la obra (no grado de técnica), nivel recomendado,
// efecto de Nimerios. Todas las cifras son nuevas y no se presentan como canon de la serie.
const serie=[
 ['Scaled Umbrella','Sombrilla de escamas','4',1,'Durante una hora protege de lluvia ordinaria a quien la sostiene. No detiene daño ni sustituye un refugio.',{duracion:3600}],
 ['Sun Sphere','Esfera solar','4',1,'Emite luz brillante 6 m y tenue otros 6 m durante una hora. Un uso diario; no daña ni permite cultivar energía.',{duracion:3600}],
 ['Fog Weave','Tejido de niebla','3',3,'Durante diez minutos permite observar corrientes de aire sobre 3 m de tela. Ventaja en una prueba de Supervivencia para elegir una ruta; no revela toda trampa o peligro.',{duracion:600}],
 ['Gentle Knock','Toque gentil','3',5,'Un minuto de concentración ofrece +2 en una prueba de herramientas de ladrón con competencia. Requiere acceso físico a la cerradura; no abre sellos mágicos ni puertas automáticamente.'],
 ['Mermaid Burp','Eructo de sirena','3',3,'La variante respirable suministra aire para una criatura durante diez minutos. Identifica primero el gas. No neutraliza venenos, presión ni la maldición del Abismo.',{duracion:600}],
 ['Princess Bosom','Seno de princesa','3',1,'Material blando de estudio y trueque. Como adaptación, amortigua una muestra frágil del tamaño de una mano durante el transporte. No concede curación ni protección corporal.'],
 ['Far Caress','Caricia lejana','2',9,'Un tentáculo a 9 m hace ataque de Verbe: 3d8 contundente. Si impacta puedes intentar agarrar con Atletismo contra la defensa normal del objetivo; sin agarre automático.',{tipo:'attack',dados:[3,8],dano:'bludgeoning',alcance:9}],
 ['Forgetter','Custodia olvidada','2',7,'Un contenedor para una criatura voluntaria o inerte de tamaño Mediano. Aporta cobertura total mientras está cerrado, pero no invulnerabilidad, estasis ni descanso gratuito. El DM fija sus PG y escape antes de usarlo.'],
 ['Gold Shaker','Recolector de polvo','2',5,'Recoge polvo ya presente en una superficie de 3 m durante diez minutos. Separa una muestra para analizarla. No crea oro, minerales ni dinero y no desintegra equipo.',{duracion:600}],
 ['Tomorrow Signal','Señal del mañana','2',5,'Tras diez minutos al aire libre, informa la tendencia meteorológica local de las próximas 24 horas. No predice acciones, encuentros ni cambios sobrenaturales.'],
 ['White Whistle','Silbato blanco','2',11,'Activa una reliquia compatible y sintonizada cuando el DM valida su resonancia. No manda sobre todo artefacto ni da rangos, niveles, almas o técnicas gratis.',{ritual:true}],
 ['Mythographer','Mitógrafo','2/3',7,'Registra una escena de un minuto con imagen, sonido y olor. Reproduce solo lo que estuvo presente; una clave puede esconder otra grabación que prepare el DM. No es una cámara omnisciente.'],
 ['Blaze Reap','Segador ígneo','1',11,'Un golpe de pico a 1,5 m inflige 6d8 fuego con ataque de Verbe. Un disparo diario. Después revisa su carcasa: una avería de historia no se repara por descansar.',{tipo:'attack',dados:[6,8],dano:'fire',alcance:1.5}],
 ['Curse-Warding Box','Caja contra la maldición','1',16,'Ritual de reanimación temporal de un cuerpo, una escena, con autorización de un solo uso. No devuelve el alma, elimina la muerte, evita heridas o cura la maldición. El DM acuerda la consecuencia antes de consumirlo.',{ritual:true,mayor:true}],
 ['Ghost Seek','Vista de lo imperceptible','1',11,'Durante un minuto percibes rastros de luz normalmente invisible hasta 9 m. Ventaja en una prueba de Percepción para rastros ópticos; no ve almas, a través de muros ni todo secreto.',{duracion:60}],
 ['Grim Reaper','Segador de hierro','1',11,'Las tijeras hacen un ataque a 1,5 m: 6d8 cortante. Contra un objeto mundano desatendido ignoran resistencia al cortante, no su inmunidad ni la condición de artefacto.',{tipo:'attack',dados:[6,8],dano:'slashing',alcance:1.5}],
 ['Nil Fount','Fuente de la nada','1',9,'En un minuto produce hasta 20 litros de agua potable. Un uso por Descanso Largo, sin vender producción ilimitada. No crea presión ofensiva ni agua dentro de cuerpos.'],
 ['Third Works','Terceras manos','1',11,'Durante un minuto dos brazos auxiliares sostienen herramientas u objetos ligeros: +2 a una prueba de oficio apropiada. No dan ataques, acciones, componentes simultáneos o escudos adicionales.',{duracion:60}],
 ['Thousand-Men Pins','Aguja de los mil hombres','1',11,'Tras implantación supervisada, al activarla durante un minuto sumas +3 al daño de ataques de arma cuerpo a cuerpo y +2 a Atletismo. No se acumula con otras agujas ni aumenta la característica sin límite. La implantación y su retirada pertenecen a la historia.',{tipo:'buff',duracion:60,ae:[['system.bonuses.mwak.damage',2,'3'],['system.skills.ath.bonuses.check',2,'2']],familia:'musculo-antiguo'}],
 ['Deep Sea Lion','Licor de las profundidades eternas','especial',18,'Un ritual consume una dosis irreemplazable y permite aplazar envejecimiento natural por un periodo que fija el DM. No concede inmortalidad, resurrección ni Descansos Largos. La botella no se rellena por descansar.',{ritual:true,mayor:true,consumible:true}],
 ['Star Thread','Hilo estelar','especial',18,'Diez metros de hilo sostienen hasta una tonelada por diez minutos. El hilo no se rompe por tensión ordinaria, pero los anclajes sí pueden ceder. No corta seres, ata automáticamente ni crea puentes infinitos.',{duracion:600,mayor:true}],
 ['Unheard Bell','Campana inaudible','especial',20,'Interludio temporal ritual: el DM pausa una escena durante un asalto para que el grupo decida una retirada o preparación. Nadie inflige daño ni gana turnos, recuperaciones o lanzamientos durante la pausa. No reescribe hechos ya resueltos.',{ritual:true,mayor:true}],
 ['Zoaholic','Zoaholic','especial',20,'Ritual de conciencia compartida con un receptáculo consentido y preparado por el DM. Una sola perspectiva activa y un único presupuesto de acciones y recursos. No duplica almas, inventario o vidas. Riesgo de fragmentación acordado antes del uso.',{ritual:true,mayor:true}],
 ['Altar of the Absolute Boundary','Altar de la frontera absoluta','desconocido',16,'Instalación fija: transporta un grupo por una ruta preparada entre dos puntos de la misma región, con su llave o silbato compatible. No es equipo portátil, no evita la carga del ascenso ni abre cualquier plano.',{ritual:true,instalacion:true,mayor:true}],
 ['Apsenti','Máscara del reflejo','desconocido',9,'Imita el aspecto de una criatura de tu tamaño vista durante un minuto. No copia memoria, estadísticas, sangre ni técnicas. Investigación o Percepción contra tu CD de Verbe revela inconsistencias.',{duracion:600}],
 ['Canopy Unto Dawn','Dosel hasta el alba','desconocido',16,'Durante un minuto la armadura aporta +2 CA y resistencia al necrótico. No incorpora gratis las armas ni reliquias de Bondrewd; se obtienen por separado.',{tipo:'buff',duracion:60,ae:[['system.attributes.ac.bonus',2,'2'],['system.traits.dr.value',2,'necrotic']],familia:'armadura-antigua',mayor:true}],
 ['Cold Fantoccini','Máscara de los muertos','desconocido',16,'Durante una escena anima un cuerpo autorizado como títere sin alma. Comparte tus acciones y recursos, no genera turno propio ni restaura al fallecido. Perfil, oposición y fin los fija el DM.',{ritual:true,mayor:true}],
 ['Cradle of Desire','Cuna del deseo','desconocido',20,'Catalizador de un deseo de historia con transformación y precio definidos antes de usarlo. No es un conjuro de Deseo gratuito ni permite solicitar cualquier resultado. El DM registra alcance, pérdida y cierre en un ritual de un solo uso.',{ritual:true,mayor:true,consumible:true}],
 ['Crumple Pot','Cuenco plegable','desconocido',5,'Adaptación de utilidad: despliega una tina para una criatura durante una hora. Requiere agua y espacio reales; no crea un refugio extradimensional ni descanso automático.',{duracion:3600,incierta:true}],
 ['Gangway','Pasarela luminosa','desconocido',16,'Rayo dirigido a 36 m: ataque de Verbe, 8d8 radiante. Reflejos y blancos deben estar identificados; no ignora cobertura total ni se multiplica por cada superficie.',{tipo:'attack',dados:[8,8],dano:'radiant',alcance:36,mayor:true}],
 ['Gorebag','Bolsa de cabezas','desconocido',9,'Almacena una muestra biológica durante 24 horas sin corrupción ordinaria. No captura almas, crea cuerpos o permite resurrección; posesión y uso se resuelven en mesa.'],
 ['Hard Scrub','Piedra de lavado','desconocido',5,'Una dosis limpia un objeto o una criatura voluntaria durante diez minutos y retira olores ordinarios. No cura veneno, enfermedad, maldiciones o Agotamiento. La dosis se consume.',{consumible:true}],
 ['Immutable Letter','Carta inmutable','desconocido',16,'Escribe una afirmación que pueda verificarse a partir de información que conoce su escritor. El DM valida contradicciones; no obliga al mundo a responder preguntas desconocidas. Puede anclar un recuerdo de historia, sin romper todo efecto mental.',{ritual:true}],
 ["Lyza's Letter",'Carta de Lyza','desconocido',5,'Soporte extremadamente resistente para un mensaje. Conserva las palabras que ya tiene, pero no autentifica autoría, convierte rumores en verdad ni dicta el destino de la campaña.'],
 ['Muscle Dress','Arcilla de carne','desconocido',11,'Durante un minuto adapta un vendaje a una herida y concede 2d8 PG temporales a un voluntario. No restaura miembros, cura heridas persistentes ni crea carne comestible.',{incierta:true}],
 ['Popple Gun','Cañón Popple','desconocido',16,'Descarga a 18 m: ataque de Verbe, 8d8 de fuerza. No destruye todo material ni concede ataques adicionales. La recarga usa el único cargo diario.',{tipo:'attack',dados:[8,8],dano:'force',mayor:true}],
 ['Double Pop Blaster','Doble cañón de exploración','desconocido',16,'Perfil de mesa para la entrada denominada Double Pop Blaster: un objetivo a 18 m, ataque, 8d8 fuerza. La doble boca no da dos ataques ni dos usos; no se identifica como alias confirmado del Popple Gun.',{tipo:'attack',dados:[8,8],dano:'force',mayor:true,incierta:true}],
 ['Ripe Thing','Semillero de cabezas','desconocido',18,'Objeto de investigación de crecimiento orgánico. Un ritual permite estudiar una muestra preparada y obtener una pista que el DM conozca. No genera seres, almas, clones ni resurrecciones gratuitas.',{ritual:true,mayor:true}],
 ['Rock Top','Peonza pétrea','desconocido',3,'Al girarla flota y sostiene un objeto de hasta 1 kg a 30 cm del suelo durante diez minutos. No transporta criaturas, permite volar o produce energía.',{duracion:600}],
 ['Shaker','Aguijón del ascenso','desconocido',11,'Ataque a 18 m, 4d8 perforante. El objetivo que falle CON CD 15 queda Envenenado hasta el fin de su siguiente turno; criaturas inmunes lo siguen siendo. La maldición de la serie se adapta como este efecto limitado, no como muerte automática.',{tipo:'attack',dados:[4,8],dano:'piercing'}],
 ['Shiny Swarm','Capucha de las emociones','desconocido',11,'Una criatura a 9 m salva SAB CD 16 o ve atenuado un enfado durante un asalto. Cualquier daño termina el efecto; no cambia lealtad, memoria ni obliga a obedecer. Se resuelve en mesa.'],
 ['Sparagmos','Luz que deshace','desconocido',18,'Un blanco a 18 m salva DES CD 18: 12d8 de fuerza, mitad con éxito. No ignora inmunidades ni elimina cuerpos, almas o artefactos automáticamente.',{tipo:'save',dados:[12,8],dano:'force',salv:'dex',cd:18,mayor:true}],
 ['Star Compass','Brújula estelar','desconocido',3,'Apunta a una resonancia profunda que el DM haya fijado al identificarla. No indica todas las rutas seguras, tesoros o secretos y puede dejar de ser útil cerca del origen.'],
 ['Wonder Wordless','Mordaza sabrosa','desconocido',3,'Una criatura voluntaria puede usarla para reducir ruidos de su respiración durante diez minutos. No alimenta indefinidamente, asfixia, silencia un área ni anula componentes de un enemigo sin resolver un agarre.'],
 ['Feather Mask','Máscara de plumas','desconocido',7,'Propuesta de mesa para un nombre del catálogo: durante diez minutos imita el canto de un ave que hayas oído. No permite hablar con todas las aves ni controla criaturas.',{incierta:true}],
 ['Insect Eye','Ojo de insecto','desconocido',7,'Propuesta de mesa para un nombre del catálogo: una vez, +2 a una prueba de Percepción visual de objetos pequeños durante un minuto. No otorga la Mirada de Ikkra.',{incierta:true}],
 ['Life-reverberating Stone','Piedra que resuena con la vida','2',11,'Componente singular para un silbato vinculado a su destinatario. El DM registra origen, voluntad y talla; no se fabrica a partir de cualquier muerte ni concede usos de todas las reliquias.',{ritual:true}],
 ['Curse Steel','Acero de maldición','desconocido',11,'Componente: permite preparar un único proyectil Shaker si el DM aprueba su fabricación. No añade un segundo efecto acumulado al arma ni replica toda la maldición del Abismo.',{ritual:true}],
 ['Stairway of Light','Escalera de luz','desconocido',16,'Componente de investigación para una Pasarela luminosa. Su presencia no entrega automáticamente el arma; requiere montaje y la capacidad del objeto final.',{ritual:true}],
 ['Incinerator','Incinerador de un aubade','no oficial',20,'Perfil de adaptación, separado de Reg como personaje: una línea de 18 m por 1,5 m, DES CD 19, 16d8 fuerza y mitad con éxito. Después queda sin uso hasta un Descanso Largo y un reacondicionamiento narrativo. No borra leyes del mundo ni consume almas.',{tipo:'save',dados:[16,8],dano:'force',salv:'dex',cd:19,linea:true,mayor:true,ritual:true}],
 ['Cartridges','Cartucho de carga','dispositivo',18,'Dispositivo de historia asociado a Bondrewd. Se registra como evidencia o conflicto de campaña. No proporciona inmunidad al ascenso ni receta automática para fabricar víctimas; su capacidad requiere decisión y consecuencias del DM.',{ritual:true,mayor:true}]
];
const hechos={
 'Gentle Knock':'Herramienta controlada mentalmente; su manejo fino exige destreza y práctica.',
 'Mermaid Burp':'Produce gas; no todas las variantes contienen aire respirable.',
 'Princess Bosom':'Objeto blando; su uso original no está aclarado.',
 'Forgetter':'Contenedor resistente cuyas capacidades completas no están especificadas.',
 'Gold Shaker':'Recoge polvo. No es una fuente documentada de oro infinito.',
 'Mythographer':'Conserva registros sensoriales; hay variantes de grado 2 y 3.',
 'Immutable Letter':'Soporte que no admite mentiras y puede anclar recuerdos perdidos.',
 'Gorebag':'Recipiente asociado al almacenamiento de cabezas.',
 'Hard Scrub':'Producto de limpieza derivado de reliquias.',
 'Thousand-Men Pins':'Implantes que potencian la fuerza; no hay una cifra de d20 canónica.',
 'Ripe Thing':'Su nombre describe un semillero de cabezas; alcance escasamente explicado.',
 'Rock Top':'Piedra que flota y cambia de forma al girar.',
 'Shiny Swarm':'Capucha vinculada a la manipulación de emociones.',
 'Muscle Dress':'Material descrito como arcilla de carne.',
 'Apsenti':'Máscara de copia; alcance detallado poco documentado.',
 'Cold Fantoccini':'Máscara relacionada con el control de muertos.',
 'Wonder Wordless':'Mordaza descrita como sabrosa; no tiene reglas d20 publicadas.',
 'Deep Sea Lion':'Licor relacionado con la prolongación de la vida.',
 'Ghost Seek':'Gafas para percibir luz normalmente invisible.',
 'Nil Fount':'Recipiente productor de agua.',
 'Altar of the Absolute Boundary':'Instalación de tránsito vinculada a un silbato o piedra compatible.',
 'Blaze Reap':'Pico explosivo de Lyza, cuya carcasa puede deteriorarse.',
 'Incinerator':'Arma integrada en Reg; no convierte a Reg en un objeto equipable.'
};
export const reliquiasSerie=serie.map(([original,nombre,grado,nivel,texto,extra={}])=>({id:'mia-'+original.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/-$/,''),original,nombre,grado,nivel,texto,origen:'serie',canon:hechos[original]??'Entrada identificada en los índices consultados; las cifras y el perfil de uso de esta ficha son una propuesta de mesa.',fuentes:[wiki+encodeURIComponent(original.replaceAll(' ','_')),wiki+'Artifacts'],...extra}));

const juegos=[['Fruitful Orb','Orbe fructífero','Una vez por largo, durante un minuto, +2 a Atletismo. No cura enfermedades ni concede inmortalidad.'],['Relic Material','Material de reliquia','Componente de un proyecto aprobado por el DM; no se convierte automáticamente en arma o dinero.'],...['Hats','Gloves','Garbs','Pants','Shoes','Guns','Bows','Pickaxes','Hatchets'].map((n,i)=>['Relic '+n,['Sombrero','Guantes','Atuendo','Pantalones','Calzado','Arma de fuego','Arco','Pico','Hacha'][i]+' de reliquia','Familia del videojuego, no un ejemplar único del manga. Perfil de mesa: +2 a una prueba de oficio o exploración coherente, una vez por largo, con aprobación del DM. No añade acciones ni dispara un arma sin su perfil de combate.'])];
export const reliquiasJuego=juegos.map(([original,nombre,texto])=>({id:'juego-'+original.toLowerCase().replaceAll(' ','-'),original,nombre,grado:'familia de videojuego',nivel:5,texto,origen:'juego',canon:'Entrada de Binary Star Falling into Darkness; las familias no representan cada variante del juego.',fuentes:['https://www.spike-chunsoft.co.jp/pages/miabyss/top.html',wiki+original.replaceAll(' ','_')]}));

const propias=[
 ['farol-ilvarn','Farol del sendero perdido',3,'Tras un minuto ilumina una marca Ilvarn examinada a 3 m. No abre la puerta ni revela el origen de una sangre.'],
 ['aguja-cendra','Aguja del pan compartido',5,'Repara un equipo de cocina y preserva seis raciones ya existentes por 24 horas. No produce alimento ni sustituye comer.'],
 ['carrete-ashka','Carrete de la última brisa',7,'Envía un mensaje de veinte palabras a una persona conocida a 1 km, con aire continuo entre ambos. No cruza planos ni confirma que fue recibido.'],
 ['cuenco-thalos','Cuenco de la marea cautiva',9,'Al tocar agua existente, permite respirar bajo ella diez minutos a un voluntario. No otorga velocidad de nado o inmunidad a presión.'],
 ['martillo-varro','Martillo del puente exacto',7,'En diez minutos identifica un defecto visible en una estructura de 6 m. +2 a una prueba de oficio para repararlo, con materiales reales.'],
 ['balanza-moneta','Balanza de la deuda visible',9,'Compara una pieza con otra muestra auténtica y revela diferencia de peso o metal. No detecta mentiras, deudas secretas ni Monedas Antiguas.'],
 ['aguja-ennia','Aguja de las dos orillas',11,'Un vivo que tocas recupera 4d8 PG. No cura heridas persistentes, Agotamiento, muerte o enfermedad.',{tipo:'heal',dados:[4,8],alcance:1.5}],
 ['mascara-nocta','Máscara del sueño quieto',9,'Diez minutos de reposo atenúan una pesadilla mundana de un voluntario. No cuenta como descanso ni recupera PG, Verbe o poderes diarios.'],
 ['lente-orun','Lente del norte que falta',11,'Durante un minuto revela rumbo y hora aproximada aun bajo tierra. No predice el futuro ni devuelve estrellas cosechadas.'],
 ['clavo-bastio','Clavo del puesto abandonado',11,'Durante un minuto, +2 CA mientras permanezcas en tu espacio. Moverse termina el efecto; el DM confirma la posición.',{tipo:'buff',duracion:60,ae:[['system.attributes.ac.bonus',2,'2']],familia:'armadura-antigua'}],
 ['campana-nerys','Campana de la aurora rota',16,'Un cono de 6 m, CON CD 17: 8d8 frío, mitad con éxito. No obliga a cumplir juramentos ni devuelve a Nerys.',{tipo:'save',dados:[8,8],dano:'cold',salv:'con',cd:17,cono:true,mayor:true}],
 ['semilla-maethra','Semilla del primer refugio',18,'Durante un minuto, un portador voluntario gana resistencia al fuego y al frío. No despierta a Maethra ni repara un Pilar.',{tipo:'buff',duracion:60,ae:[['system.traits.dr.value',2,'fire'],['system.traits.dr.value',2,'cold']],mayor:true}],
 ['llave-seyra','Llave de los nudos abiertos',7,'Una cuerda ordinaria examinada se desata en un minuto. No rompe agarres de criaturas ni sellos o pactos.'],
 ['dintel-dhoren','Dintel de bolsillo',9,'Durante diez minutos marca un paso de 1,5 m de ancho. Suena una vez si algo lo cruza, sin identificarlo ni impedir el paso.'],
 ['piedra-gracefeel','Piedra de la despedida serena',11,'Una conversación de hasta un minuto con un eco cercano, dispuesto y reconocido por el DM. Sin respuestas obligatorias ni resurrección.',{ritual:true}],
 ['espejo-ignis','Espejo de la ley encendida',18,'Un objetivo a 18 m salva DES CD 18: 10d8 fuego, mitad con éxito. No devuelve otra técnica gratis ni ignora inmunidades.',{tipo:'save',dados:[10,8],dano:'fire',salv:'dex',cd:18,mayor:true}]
];
export const reliquiasPropias=propias.map(([id,nombre,nivel,texto,extra={}])=>({id:'nimerios-'+id,original:null,nombre,nivel,texto,grado:'creación de Nimerios',origen:'propia',canon:'Creación original para esta campaña; no pertenece a Made in Abyss ni es canon previo del panteón.',fuentes:[],...extra}));
export const dossiers=[{id:'aubade',nombre:'Aubade',texto:'Clasificación no oficial, no un grado de técnica ni una pieza que otorgue facultades universales.'},{id:'reg',nombre:'Reg y la silueta humanoide',texto:'Seres y figuras de la narración, no objetos equipables. El perfil del Incinerador se ofrece por separado como adaptación bajo control del DM.'}];
// 3.46: aspecto, qué es y el hito propio de cada pieza.
export default [...reliquiasSerie,...reliquiasJuego,...reliquiasPropias].map(r=>({...r,...(ASPECTO[r.id]??{})}));
