/** Técnicas originales: problemas de viaje, cuidados, conversación y oficios. */
export const vida = {
 umbral:[
 ['bolsillo-mensajero','Bolsillo mensajero',1,3,0,'Tras un minuto de preparación trasladas un objeto suelto de hasta 1 kg entre tus manos y un recipiente abierto que ves. No atraviesa paredes, cerraduras, criaturas ni objetos que alguien lleva puestos.'],
 ['maleta-ordenada','Maleta ordenada',1,1.5,600,'Señalas un recipiente propio y recuerdas la posición de hasta veinte objetos que has guardado allí durante diez minutos. Encontrarlos sigue usando la interacción normal; no reduce peso ni volumen.'],
 ['puente-bultos','Puente de bultos',2,6,60,'Durante un minuto un paso visible de hasta 6 m permite arrastrar por suelo firme una carga de hasta 50 kg como si tuviera ruedas. No levanta criaturas ni salva precipicios; requiere una mano y tu acción cada turno.'],
 ['regreso-herramienta','Regreso de la herramienta',1,6,0,'Una herramienta propia desatendida, visible y de hasta 2 kg regresa a tu mano por un camino despejado. No desarma, no ataca y no activa mecanismos.'],
 ['baliza-campamento','Baliza del campamento',1,1.5,28800,'Marcas una piedra durante un minuto. Durante ocho horas conoces su dirección aproximada dentro de 1 km y en el mismo plano. No revela distancia exacta, amenazas ni rutas transitables. Solo una baliza propia activa.'],
 ['sillon-rescate','Sillón del rescate',2,3,60,'Acercas hasta 3 m a un aliado voluntario y consciente por un trayecto libre sobre suelo estable. Necesita que lo veas; no atraviesa paredes, no teletransporta y no saca de agarres ni evita ataques de oportunidad por sí solo.'],
 ['mesa-desplegada','Mesa desplegada',1,1.5,3600,'Pliegas o despliegas en un minuto un mueble propio articulado de hasta 20 kg. Debe caber físicamente y conserva su peso. No repara ni crea piezas.'],
 ['senda-porteador','Senda del porteador',2,1.5,3600,'Durante una hora señalas apoyos seguros para una carga en una ruta ya explorada de hasta 100 m. Un portador obtiene ventaja en una prueba para moverla sin dañarla. No aumenta capacidad de carga ni sustituye conocer la ruta.'],
 ['paso-tendido','Paso del tendido',2,6,60,'Guías el extremo de una cuerda propia por una ruta visible de 6 m para tenderla alrededor de un apoyo. Debes asegurar el nudo; conserva su resistencia y no se ancla al aire.'],
 ['ventana-reparto','Ventana del reparto',3,18,0,'En un minuto intercambias dos paquetes propios visibles de hasta 5 kg cada uno, ambos sobre superficies firmes a 18 m o menos. No intercambia seres vivos, objetos equipados ni recipientes cerrados que no te pertenezcan.'],
 ['marca-inventario','Marca del inventario',1,1.5,28800,'Marcas hasta diez bultos propios al contarlos. Durante ocho horas reconoces cuál falta cuando vuelves a revisar el conjunto. No localiza al ladrón ni revela el contenido.'],
 ['umbral-evacuacion','Umbral de evacuación',3,9,60,'Durante un minuto iluminas una salida real que ya hayas recorrido, hasta 9 m de ti. Los aliados que la ven entienden tu señal de retirada. No abre puertas, elimina obstáculos ni concede movimiento adicional.'],
 ['bandeja-distante','Bandeja distante',1,3,60,'Sostienes durante un minuto una bandeja de hasta 2 kg a 3 m. Debes usar tu acción para moverla 1,5 m por una ruta libre; no puede atacar, activar objetos mágicos ni cargar criaturas.'],
 ['junta-carpintero','Junta del carpintero',2,1.5,600,'Durante diez minutos mantienes alineadas dos piezas ordinarias que tocas para pegarlas o clavarlas. Ventaja en una prueba de carpintería con herramientas y materiales. No crea una unión permanente por sí misma.'],
 ['caja-seca','Caja seca',1,1.5,3600,'Durante una hora proteges del goteo ordinario el interior de una caja propia de hasta 30 litros y cerrada. No vuelve estanca una caja sumergida ni protege del daño.'],
 ['correo-vado','Correo del vado',3,12,0,'Tras un minuto pasas una carta propia a una mano voluntaria que ves a 12 m por una ruta libre. Solo transporta papel de hasta 100 g; no atraviesa barreras ni sustituye teletransporte de criaturas.']
 ],
 rastro:[
 ['mapa-olores','Mapa de los olores',1,6,60,'Distingues durante un minuto si dos muestras ordinarias tienen el mismo olor dominante. No identifica una persona de forma infalible ni descubre venenos o magia.'],
 ['huella-carreta','Huella de la carreta',1,3,600,'Durante diez minutos resaltas las marcas de ruedas ya visibles. Obtienes ventaja en una prueba de Supervivencia para seguirlas. Lluvia, suelo y antigüedad siguen limitando la pista.'],
 ['cuenta-pasos','Cuenta de los pasos',0,0,3600,'Durante una hora recuerdas hasta mil pasos propios y los cambios de dirección que decides registrar. No da un mapa perfecto ni detecta desplazamientos que no percibas.'],
 ['lectura-polvo','Lectura del polvo',1,1.5,60,'Una superficie de hasta 1 m² muestra por un minuto qué zonas conservan polvo sin remover. Ayuda a describir manipulación reciente; no da fechas exactas, identidad ni pruebas de culpabilidad.'],
 ['agua-vecina','Agua vecina',2,18,60,'Con un minuto de escucha detectas la dirección de agua corriente audible a 18 m. La piedra gruesa o el ruido pueden impedirlo. No crea agua ni confirma que sea potable.'],
 ['ficha-ruta','Ficha de la ruta',1,1.5,86400,'Grabas en una ficha propia hasta cinco señales y giros que hayas recorrido. Se borran al cabo de un día. Un lector debe conocer tus signos; no revela caminos ocultos.'],
 ['lupa-taller','Lupa del taller',1,1.5,600,'Durante diez minutos haces visibles pequeñas grietas superficiales de un objeto no mágico de hasta 1 m. Ventaja en una prueba de Investigación para revisarlo. No detecta su interior, maldiciones o trampas automáticamente.'],
 ['eco-caverna','Eco de la caverna',2,12,0,'Emites un sonido audible y distingues si un paso visible de hasta 12 m desemboca en un espacio mucho mayor. No cuenta enemigos ni atraviesa puertas cerradas. Puede delatarte.'],
 ['lectura-viento','Lectura del viento',1,6,600,'Durante diez minutos sigues la dirección local del aire con una cinta propia. Ventaja en una prueba para ventilar humo ordinario o elegir dónde encender un fuego. No predice el clima.'],
 ['registro-voz','Registro de la voz',2,3,3600,'Un voluntario deja una frase de hasta veinte palabras en una ficha propia. Durante una hora puedes reproducirla una vez con su voz audible. No permite órdenes mágicas, suplantar identidad sin prueba ni fabricar un testimonio.'],
 ['catalogo-hojas','Catálogo de las hojas',1,1.5,600,'Durante diez minutos comparas una planta con una muestra que ya conozcas. Ventaja en una prueba de Naturaleza para clasificarlas. No identifica automáticamente propiedades curativas ni vuelve seguro ingerirlas.'],
 ['rumbo-caravana','Rumbo de la caravana',2,0,3600,'Durante una hora recuerdas el último rumbo seguido por tu grupo mientras permanezcas consciente. Ventaja en una prueba de Supervivencia para volver sobre tus pasos. No funciona tras un traslado desconocido.'],
 ['tinta-rastreadora','Tinta rastreadora',2,1.5,3600,'Marcas un objeto propio con tinta disponible. Durante una hora reconoces su marca a simple vista aunque se moje. No la ves a distancia ni a través de otros objetos.'],
 ['archivo-simbolos','Archivo de símbolos',3,1.5,3600,'En un minuto copias fielmente hasta una página de signos visibles en papel propio. Conserva formas, no traducción, efectos mágicos ni facultades de un pergamino. No copia libros enteros de un uso.']
 ],
 pulso:[
 ['manos-serenas','Manos serenas',1,1.5,600,'Un voluntario que tocas controla un temblor ordinario durante diez minutos. Ventaja en una prueba de Medicina u oficio de precisión acordada al usarla. No cura veneno, enfermedades, heridas o estados.'],
 ['lectura-cansancio','Lectura del cansancio',1,1.5,60,'Con un minuto de examen de un voluntario distingues hambre, sed o fatiga mundana evidentes. No diagnostica venenos ocultos ni reduce Agotamiento. El DM indica cuándo hace falta Medicina.'],
 ['compresa-templada','Compresa templada',1,1.5,600,'Una tela limpia que tocas conserva una temperatura cómoda durante diez minutos. Alivia molestias ordinarias; no cura PG, quemaduras, estados ni protege del frío extremo.'],
 ['venda-sujeta','Venda sujeta',1,1.5,600,'Mantienes una venda ordinaria en su sitio durante diez minutos. Ventaja en una prueba de Medicina para vendar usando material apropiado. No estabiliza automáticamente ni sustituye tratamientos diarios.'],
 ['pulso-testigo','Pulso testigo',0,1.5,0,'Al tocar a una criatura voluntaria o inmóvil percibes respiración o pulso ordinarios si existen. La ausencia no distingue muerte, magia o anatomías extrañas; no revela PG ni intenciones.'],
 ['guardia-camilla','Guardia de la camilla',2,1.5,3600,'Durante una hora acompasas el transporte de una criatura voluntaria en una camilla real. El grupo obtiene ventaja en una prueba para transportarla sin agravar una lesión por el camino. No recupera PG ni reduce heridas.'],
 ['higiene-manos','Higiene de las manos',1,0,600,'Limpias tus manos de suciedad ordinaria usando agua disponible y las mantienes limpias diez minutos mientras no toques suciedad nueva. No esteriliza instrumental ni neutraliza venenos o enfermedades.'],
 ['voz-rescate','Voz del rescate',1,3,60,'Guías durante un minuto la respiración de un aliado consciente dispuesto a escucharte. Ventaja en una prueba de Medicina para atender una crisis de angustia mundana. No elimina Asustado, Hechizado ni control mágico.'],
 ['asiento-dolor','Asiento del dolor',2,1.5,600,'Un voluntario que tocas tolera mejor un procedimiento médico durante diez minutos. Ventaja en una prueba de Medicina para realizarlo. No anestesia por completo, no ignora daño ni permite actuar a 0 PG.'],
 ['pausa-muscular','Pausa muscular',1,1.5,60,'Un voluntario dedica un minuto contigo a relajar un calambre mundano. Puede reanudar una tarea cotidiana; no elimina niveles de Agotamiento, estados o penalizadores mecánicos.'],
 ['rutina-cuidados','Rutina de los cuidados',2,1.5,3600,'Durante una hora recuerdas los cuidados acordados para un paciente voluntario. Ventaja en una prueba de Medicina con útiles adecuados para cumplir el tratamiento. Sigue contando como máximo un tratamiento diario.'],
 ['ficha-paciente','Ficha del paciente',1,1.5,86400,'En papel disponible registras síntomas que un voluntario haya descrito y observaciones que realmente hayas obtenido. Dura un día. No revela información nueva ni sustituye un diagnóstico.']
 ],
 quietud:[
 ['sueno-amable','Sueño amable',1,1.5,3600,'Durante una hora un voluntario dormido oye atenuados los ruidos ordinarios de tu campamento. No duerme por obligación, no queda sordo a una alarma clara y no obtiene beneficios de descanso antes de tiempo.'],
 ['fogata-paciente','Fogata paciente',1,3,3600,'Durante una hora una llama ordinaria pequeña que ya exista resiste brisas suaves. Sigue gastando combustible y oxígeno; lluvia, vientos fuertes y falta de combustible la apagan.'],
 ['ritmo-taller','Ritmo del taller',1,0,3600,'Durante una hora recuerdas el orden de una tarea que ya sabes realizar. Ventaja en una prueba de oficio con herramientas. No aumenta horas trabajadas, producción o prestigio por sí sola.'],
 ['silencio-lectura','Silencio de lectura',1,1.5,600,'Durante diez minutos un lector voluntario conserva el renglón y el punto donde interrumpió su lectura. No acelera aprendizaje, descifra lenguas ni protege de efectos mentales.'],
 ['mesa-serena','Mesa serena',2,3,600,'Hasta cuatro voluntarios se concentran en una conversación durante diez minutos. Ventaja en una prueba de Perspicacia para entender una emoción expresada. No detecta mentiras ni obliga a hablar.'],
 ['vigilia-compartida','Vigilia compartida',2,3,3600,'Dos centinelas voluntarios acuerdan una señal audible y una ruta de observación durante una hora. Ventaja en una prueba de Percepción de uno con ayuda real del otro. No elimina sueño o Agotamiento.'],
 ['respirar-polvo','Respirar entre el polvo',1,0,600,'Durante diez minutos coordinas una mascarilla real para evitar inhalar polvo ordinario en tareas suaves. No concede inmunidad, aire respirable, resistencia a veneno ni protección contra gases.'],
 ['memoria-receta','Memoria de la receta',1,0,3600,'Durante una hora recuerdas una receta conocida y sus pasos. Ventaja en una prueba de cocina usando ingredientes y herramientas. No crea comida ni multiplica raciones.'],
 ['pausa-del-acuerdo','Pausa del acuerdo',2,3,60,'En una conversación consentida, hasta cuatro personas disponen de un minuto para repetir lo que entendieron del trato. Ventaja en una prueba para redactarlo con claridad. No impone un juramento mágico ni convence a hostiles.'],
 ['ritmo-remo','Ritmo del remo',2,6,3600,'Durante una hora una tripulación voluntaria coordina sus remos oyéndote. Ventaja en una prueba de vehículos acuáticos. No aumenta velocidad, capacidad de carga o resistencia al clima por sí misma.'],
 ['despedida-sosiego','Despedida en sosiego',1,3,600,'Durante diez minutos sostienes una ceremonia voluntaria de duelo. Ayuda a expresar una despedida; no habla con muertos, altera recuerdos ni elimina estados o consecuencias de historia.'],
 ['taza-paciente','Taza paciente',0,1.5,600,'Una bebida no mágica conserva su temperatura inicial, si es cómoda al tacto, durante diez minutos. No hierve, congela, purifica ni cambia su composición.']
 ],
 vasija:[
 ['saludo-huesped','Saludo del huésped',1,0,60,'Con un minuto de calma preguntas a tu entidad vinculada qué sensación desea compartir. El DM expresa una impresión si coopera. No lee mentes ajenas ni obliga al vínculo a revelar secretos.'],
 ['olfato-hogar','Olfato del hogar',1,0,600,'Durante diez minutos tu huésped cooperativo te ayuda a reconocer el olor de un lugar donde hayas descansado. Ventaja en una prueba de Supervivencia para reconocerlo. No localiza lugares desconocidos.'],
 ['manto-intemperie','Manto de la intemperie',2,0,3600,'Durante una hora tu manto atenúa frío o calor ordinarios cómodos para tu huésped. No da resistencias, inmunidad climática ni beneficios de descanso seguro.'],
 ['voz-visitante','Voz del visitante',1,0,60,'Durante un minuto tu huésped cooperativo presta un timbre propio a tu voz. Es audible y reconocible como extraño; no imita a terceros ni concede ventaja social automática.'],
 ['paso-compasado','Paso compasado',2,0,600,'Durante diez minutos coordinas con tu huésped una tarea de equilibrio cotidiana. Ventaja en una prueba de Acrobacias para cruzar una pasarela estable. No concede velocidad, vuelo ni inmunidad a caídas.'],
 ['memoria-vinculo','Memoria del vínculo',2,0,60,'Durante un minuto repasas con tu entidad una vivencia que ambos compartisteis. Ventaja en una prueba de Historia para recordarla. No revela el pasado secreto de la entidad.'],
 ['cancion-refugio','Canción del refugio',1,3,600,'Tu entidad coopera en una canción audible de diez minutos para un público dispuesto. Ventaja en una prueba de Interpretación; no encanta, duerme ni provoca miedo mecánico.'],
 ['garra-taller','Garra del taller',2,0,600,'Durante diez minutos manifiestas una uña roma para sujetar una pieza ligera mientras trabajas. Equivale a una pinza simple, no a una mano adicional; no ataca ni permite usar dos herramientas a la vez.']
 ],
 velo:[
 ['cartel-luminoso','Cartel luminoso',1,3,600,'Proyectas hasta veinte palabras que conoces sobre una superficie visible durante diez minutos. Es una imagen plana claramente ilusoria; no crea luz útil, documentos auténticos ni mensajes secretos automáticos.'],
 ['ensayo-escena','Ensayo de la escena',1,3,600,'Durante diez minutos muestras figuras esquemáticas para ensayar una escena conocida. Ventaja en una prueba de Interpretación al preparar la actuación. No crea criaturas ni reproduce información que no conozcas.'],
 ['vestuario-borrador','Vestuario en borrador',1,1.5,600,'Un voluntario ve una propuesta ilusoria de color y corte sobre su ropa durante diez minutos. No cambia materiales, silueta, protección o identidad; al tocarla se reconoce la ilusión.'],
 ['cuento-lampara','Cuento de la lámpara',0,3,60,'Durante un minuto proyectas una silueta animada del tamaño de una mano para acompañar un relato. No tapa la visión, produce luz útil ni distrae en combate por regla propia.']
 ],
 mirada:[
 ['lectura-costura','Lectura de la costura',1,1.5,600,'Durante diez minutos observas hilos y uniones visibles de una prenda ordinaria. Ventaja en una prueba de sastrería para repararla con materiales. No detecta encantamientos ni revela lo que oculta.'],
 ['margen-escriba','Margen del escriba',1,1.5,3600,'Durante una hora conservas en la vista líneas guía sobre una página propia. Ventaja en una prueba de caligrafía. No copia firmas auténticas sin prueba ni activa escrituras mágicas.'],
 ['luz-lector','Luz del lector',0,0,600,'Durante diez minutos distingues mejor letras bajo luz tenue a 30 cm. No permite ver en oscuridad total, a través de objetos ni leer idiomas desconocidos.'],
 ['escala-pintor','Escala del pintor',1,3,600,'Durante diez minutos comparas proporciones y colores de un modelo visible. Ventaja en una prueba de pintura. No registra escenas pasadas ni crea mapas perfectos.']
 ],
 pacto:[
 ['recado-del-patio','Recado del patio',1,9,60,'Tu criatura de pacto cooperativa transporta un papel de hasta 100 g a un lugar visible a 9 m usando su movimiento normal. Comparte órdenes y acciones de la formación; no crea otra invocación.'],
 ['guardia-del-huerto','Guardia del huerto',2,18,3600,'Durante una hora tu formación de pacto ya presente vigila un huerto visible y da una señal audible al ver animales ordinarios. No identifica hostiles ni concede acciones o percepciones infalibles.'],
 ['taller-companero','Taller compañero',1,1.5,600,'Durante diez minutos una criatura de tu pacto ya presente y capaz puede sujetar materiales. Ventaja en una prueba de oficio con ayuda efectiva. No crea herramientas, mano de obra independiente o producción adicional.'],
 ['ronda-del-campamento','Ronda del campamento',2,18,600,'Tu pacto presente recorre durante diez minutos una ruta visible de hasta 18 m con sus sentidos normales. Informa lo que percibe según su capacidad; no atraviesa obstáculos, crea turnos ni actúa como explorador infalible.']
 ],
 hilo:[
 ['costura-remiendo','Costura del remiendo',1,1.5,600,'Durante diez minutos guías aguja e hilo propios para reparar una rotura de hasta 20 cm. Ventaja en una prueba de sastrería; requiere materiales y no restaura propiedades mágicas.'],
 ['nudo-porteador','Nudo del porteador',1,1.5,60,'Durante un minuto mantienes una cuerda tensa mientras haces un nudo normal. Ventaja en una prueba de oficio para asegurar carga. No aumenta resistencia, ata enemigos ni sustituye un anclaje.'],
 ['tendedero-sutil','Tendedero sutil',1,3,3600,'Tiendes entre dos apoyos visibles un hilo propio durante una hora. Soporta ropa húmeda de hasta 5 kg. No sujeta criaturas, bloquea ataques ni se vuelve invisible.'],
 ['dedo-campanero','Dedo del campanero',1,6,60,'Durante un minuto un hilo visible propio permite tocar una campana ligera a 6 m usando una mano. No dispara armas, manipula cerraduras ni activa objetos mágicos.']
 ],
 cuerpo:[
 ['palma-estibador','Palma del estibador',1,0,600,'Durante diez minutos coordinas el agarre de una carga al alcance normal. Ventaja en una prueba de Atletismo para moverla junto a ayudantes reales. No aumenta capacidad máxima ni da daño adicional.'],
 ['paso-danzante','Paso del danzante',1,0,600,'Durante diez minutos controlas tus pasos al ensayar una danza conocida. Ventaja en una prueba de Interpretación para bailarla. No concede desplazamiento, esquiva o acciones en combate.']
 ],
 sello:[
 ['sello-despensa','Sello de la despensa',1,1.5,28800,'Marcas el cierre de un recipiente propio por ocho horas. Al inspeccionarlo sabes si se abrió desde entonces. No impide abrirlo, conserva alimentos ni identifica al responsable.'],
 ['etiqueta-almacen','Etiqueta del almacén',0,1.5,86400,'Escribes en una etiqueta propia hasta veinte palabras que solo brillan suavemente al tocarlas. Dura un día; no crea idioma secreto, luz útil, documentos oficiales ni espacio adicional.']
 ]
};
