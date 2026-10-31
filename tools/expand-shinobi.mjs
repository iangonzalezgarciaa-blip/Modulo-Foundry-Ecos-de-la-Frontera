/** Expansión reproducible. Conserva identificadores del catálogo y separa técnica, linaje y artefacto. */
import fs from 'node:fs';
import arts from './shinobi/arts.mjs';
import crafts from './shinobi/crafts.mjs';
import eyesBlood from './shinobi/eyes-blood.mjs';
import thresholds from './shinobi/threshold-hosts.mjs';
import addenda from './shinobi/addenda.mjs';
import elements from './shinobi/elements.mjs';
import { construirShinobi } from './build-shinobi.mjs';
import { readCatalog,writeCatalog,validateCatalog } from './catalog.mjs';
const D=readCatalog(), reparaciones=[];
const nuevoRama=(id,nombre,escuela,usa,jugador)=>{if(!D.ramas.some(r=>r.id===id))D.ramas.push({id,nombre,escuela,usa,lead:jugador,jugador});};
nuevoRama('umbral','Umbral','vum','verbe','Espacio-tiempo: marcas, traslado e intercambio. Una marca y un destino seguro importan tanto como la energía. No crea copias ni dominios infinitos.');
nuevoRama('vasija','Vasija','vva','verbe','Técnicas del huésped de una bestia. El DM concede entidad y vínculo; las transformaciones comparten tu vida, reserva y acciones.');
D.combos.tormenta.de=['agua','rayo'];
D.tradicionesShinobi=[
 ['rayo-negro','Rayo negro'],['cuervo','Cuervos del contrato','Cuervos del contrato'],['sombra','Atadura de sombra'],['mente','Cambio de mente'],['expansion','Expansión corporal'],['enjambre','Colonia de insectos','Enjambre simbiótico'],['colmillo','Manada de colmillos','Manada de colmillos'],['marioneta','Marionetismo'],['tinta','Tinta viva'],['papel','Arte del papel'],['arcilla','Escultura explosiva'],['sonido','Genjutsu sonoro'],['arena','Control de arena'],['magnetismo','Magnetismo'],['sellado','Fórmulas de sellado'],['barrera','Formaciones de barrera'],['medicina-avanzada','Medicina avanzada'],['alma','Artes del alma'],['sensor','Sensor especializado'],['sabio-sapo','Maestría sabia de los sapos','Sapos sabios'],['sabio-serpiente','Maestría sabia de las serpientes','Serpientes sabias'],['invocacion-inversa','Invocación inversa','Contrato de retorno'],
 ...['sapo','serpiente','babosa','perro','mono','halcon','tortuga','comadreja','salamandra','almeja','abeja'].map(id=>[id,`Contrato: ${id}`,`Contrato de ${id}`])
].map(([id,nombre,pacto])=>({id,nombre,...(pacto?{pacto}:{})}));
for(const t of D.tradicionesShinobi)if(t.pacto&&!D.pactos.some(p=>p.linaje===t.pacto))D.pactos.push({linaje:t.pacto,tamano:"Variable",mov:"Según técnica",dano:"Según técnica",rasgo:"Contrato o simbiosis de historia. Una formación comparte acciones y no crea reservas."});
const hitos=[...new Set([...arts,...crafts,...eyesBlood,...thresholds,...addenda,...elements].map(t=>t.acceso?.hito).filter(Boolean))];
D.hitosShinobi=hitos.map(id=>({id,nombre:id.replaceAll('-',' '),abreSangre:['corazones-vinculados','ritual-jashin','transferencia-corporal','cuerpo-esporas','division-corporal','meteorito','organismo-acuatico'].includes(id)}));
D.bestiasShinobi=[['shukaku','Shukaku · una cola'],['matatabi','Matatabi · dos colas'],['isobu','Isobu · tres colas'],['son-goku','Son Gokū · cuatro colas'],['kokuo','Kokuō · cinco colas'],['saiken','Saiken · seis colas'],['chomei','Chōmei · siete colas'],['gyuki','Gyūki · ocho colas'],['kurama','Kurama · nueve colas'],['juubi','Jūbi · receptáculo mayor'],['sora','Pseudohuésped residual (anime)']].map(([id,nombre])=>({id,nombre}));
const herencias=[['fluyente','Cuerpo fluyente','Hidratación corporal; rayo especialmente peligroso.'],['mutable','Cuerpo mutable','Anatomía alterada por energía natural; requiere equilibrio y conlleva inestabilidad.'],['gemela','Gemelos de la misma carne','Dos cuerpos compatibles pueden integrarse sin crear turnos extra.'],['humo','Humo vivo','Transformación en humo, vulnerable a dispersión; exclusivo del anime.'],['detonacion','Detonación','Energía explosiva sin composición elemental canónica confirmada.'],['calorseco','Calor seco','Facultad de quemadura y deshidratación; no equivale a Ceniza de campaña.'],['magnetica','Magnetismo','Control de material preparado; no se impone una combinación de elementos no confirmada.'],['cristal','Cristal vivo','Cristalización y construcciones; exclusivo del anime.'],['onirica','Sueño corpóreo','Ilusiones hereditarias excepcionalmente peligrosas; exclusivo del anime.']];
for(const[id,req,rasgo]of herencias){if(!D.linajes.some(l=>l.id===id))D.linajes.push({id,nombre:`Linaje ${req.toLowerCase()}`,alias:req,real:req,req,herencia:req,shinobi:true});if(!D.herencias.some(h=>h.nombre===req))D.herencias.push({nombre:req,sangre:id,rasgo,despertar:'Su despertar concreto lo concede el DM; tener el linaje no enseña todas sus técnicas.'});}
const aster=D.miradas.find(m=>m.id==='aster');
if(aster.etapas.length===3){aster.etapas.push('Ojo del dolor despierto (Mangekyō): permite aprender facultades oculares excepcionales. Cada uso marcado suma desgaste hasta obtener la etapa eterna.','Ojo eterno: las facultades marcadas dejan de generar desgaste nuevo. No concede por sí solo Seis Caminos ni todas las técnicas de otro usuario.');aster.trazos.push(8,10);aster.niveles=[1,1,1,11,17];}
for(const[id,nombre,etapas,trazos,niveles]of[
 ['orbe','Ojo de los seis senderos',['Ver flujos y atraer o repeler.','Acceso al aprendizaje de los seis senderos.','Gravedad mayor y dones espaciales con sus hitos.'],[5,8,12],[11,15,19]],
 ['carmesi','Ojo carmesí',['Percepción de sangre y flujo.','Ilusión y control de sangre expuesta.'],[3,5],[5,11]],
 ['brasa','Ojo de la brasa oculta',['Percepción vital y firmas señuelo.'],[3],[5]]]){
 if(!D.miradas.some(m=>m.id===id))D.miradas.push({id,nombre,real:nombre,linaje:id,etapas,trazos,niveles});
 if(!D.linajes.some(l=>l.id===id))D.linajes.push({id,nombre,alias:`Linaje del ${nombre.toLowerCase()}`,mirada:id,real:nombre,shinobi:true});
}
// Ocho puertas: el antiguo séptimo era la puerta fatal. La migración conserva a quien ya la conocía.
if(D.cerrojos.length===7){D.cerrojos[6]={n:7,nombre:'La conmoción',grado:9,da:'+4d6 al daño y crítico con 18 a 20; requiere un cuerpo capaz de soportarlo.',pg:16,cierre:'3 Agotamiento'};D.cerrojos.push({n:8,nombre:'La muerte',grado:11,da:'+4d6 adicionales al daño; no caes por daño ordinario mientras dure. No es inmunidad a efectos letales.',pg:0,cierre:'El usuario original muere al terminar salvo una intervención excepcional del DM.'});}
for(const r of D.ramas)for(const k of ['lead','jugador'])if(r[k])r[k]=r[k].replaceAll('Siete Cerrojos','Ocho Cerrojos');
const artefactos = {samehada:'Samehada',kubikiribocho:'Kubikiribōchō',hiramekarei:'Hiramekarei',kiba:'Kiba',shibuki:'Shibuki',nuibari:'Nuibari',kabutowari:'Kabutowari',kusanagi:'Kusanagi',gunbai:'Gunbai',bashosen:'Bashōsen',totsuka:'Espada de Totsuka',yata:'Espejo de Yata',benihisago:'Benihisago',kokinjo:'Kōkinjō',shichiseiken:'Shichiseiken',kohaku:'Kohaku no Jōhei','marioneta-kazekage':'Marioneta del Tercer Kazekage'};
D.artefactosShinobi=Object.entries(artefactos).map(([id,nombre])=>({id,nombre,texto:'Artefacto excepcional del estudio, pp. 24, 32–33. Su adquisición, voluntad y conservación pertenecen a la historia. Sus acciones especiales exigen aprender las técnicas de la reliquia y pagar sus costes.'}));
const definiciones=[...arts,...crafts,...eyesBlood,...thresholds,...addenda,...elements];
const ids=new Set();for(const s of definiciones){if(ids.has(s.id))throw Error(`Duplicada ${s.id}`);ids.add(s.id);}
for(const s of definiciones){
 if(s.id==='cuerpo-mariposa')s.modo='mariposa';
 if(s.id==='cuerpo-sombra-danzante')s.cambios=[['flags.ecos-frontera.verbe.saltoSinCarrera',4,'1']];
 if(s.id==='pulso-regeneracion-prevista'){s.tipo='heal';s.dados=[3,8];}
 if(s.id.startsWith('sangre-papel-')){s.id=s.id.replace('sangre-','hilo-');s.rama='hilo';}
 const t=construirShinobi(s,D), i=D.tecnicas.findIndex(x=>x.id===t.id);
 if(i>=0 && !D.tecnicas[i].item.flags['ecos-frontera'].verbe.shinobi)throw Error(`No se sustituye una técnica anterior: ${t.id}`);
 if(i>=0)D.tecnicas[i]=t;else D.tecnicas.push(t);
}
// Referencias a técnicas que ya existían: no se infla el catálogo con duplicados de nombre.
const existentes={
 'forma-transformacion':['Henge no Jutsu',9], 'forma-sustitucion':['Kawarimi no Jutsu',9], 'forma-replica':['Bunshin no Jutsu',9], 'forma-replica-solida':['Kage Bunshin no Jutsu',9], 'forma-replicas':['Kasumi Jūsha',9], 'forma-doble':['Tajū Kage Bunshin no Jutsu',9],
 'forma-andar':['Kinobori no Waza',9], 'forma-esfera':['Rasengan',10], 'forma-esfera-mayor':['Ōdama Rasengan',10], 'cuerpo-cien-pasos':['Shunshin no Jutsu',9],
 'velo-miedo':['Narakumi no Jutsu',19], 'velo-cadenas':['Jubaku Satsu',19], 'velo-noche':['Nehan Shōja no Jutsu',19], 'velo-ojos':['Kokuangyō no Jutsu',19], 'velo-devolver':['Kyō Tenchi-ten',19], 'velo-romper':['Genjutsu Kai',20],
 'familia-mente-saltar':['Shintenshin',26], 'familia-sombra-imita':['Kagemane no Jutsu',26], 'familia-sombra-aprieta':['Kage Kubi Shibari',26], 'familia-crecer':['Baika no Jutsu',27], 'familia-gigante':['Chō Baika',27],
 'familia-colmillo-doble':['Jūjin Bunshin',27], 'familia-enjambre-escudo':['Mushi Kame',27], 'familia-enjambre-nube':['Kikaichū',27], 'familia-tinta-dibujo':['Chōjū Giga',43],
 'pulso-cerrar':['Shōsen Jutsu',34], 'pulso-filo':['Chakura no Mesu',34], 'pulso-sacar-veneno':['Saikan Chūshutsu',34], 'pulso-cien':['Fuerza de Sakura y Tsunade',21],
 'pacto-invocar':['Kuchiyose no Jutsu',32], 'quietud-estado':['Senjutsu',7], 'sangre-varro-bosque':['Sawarabi no Mai',18], 'sangre-ignis-cubo':['Genkai Hakuri no Jutsu',18],
 'mirada-aster-copiar':['Sharingan',23], 'mirada-ikkra-abrir':['Byakugan',23], 'rayo-cuerpo':['Raiton no Yoroi',14], 'rayo-cielo':['Kirin',14],
 'fuego-gran-soplo':['Gōkakyū no Jutsu',11], 'fuego-brasas':['Hōsenka no Jutsu',11], 'fuego-fauces':['Gōryūka no Jutsu',11], 'fuego-humo-negro':['Haisekishō',11],
 'agua-fauces-rio':['Suiryūdan no Jutsu',12], 'agua-cascada':['Daibakufu no Jutsu',12], 'agua-cortina':['Suijinheki',12], 'agua-prision':['Suirō no Jutsu',12], 'agua-niebla':['Kirigakure no Jutsu',12],
 'tierra-muro-barro':['Doryūheki',13], 'tierra-cienaga':['Yomi Numa',13], 'tierra-coraza':['Domu',13], 'viento-muro':['Daitoppa',15], 'viento-tajo':['Kazekiri no Jutsu',15],
 'escarcha-espejos':['Makyō Hyōshō',17], 'madera-muro':['Mokujōheki',17], 'madera-casa':['Jukai Kōtan: construcción',17], 'arena-ataud':['Sabaku Kyū',43], 'arena-ola':['Ryūsa Bakuryū',43]
};
for(const[id,[nombre,pagina]]of Object.entries(existentes)){const t=D.tecnicas.find(t=>t.id===id);if(!t)continue;t.alias=[...new Set([...(t.alias??[]),nombre])];t.origen??={obra:'manga/anime',nombre,pagina};}
for(const t of D.tecnicas){
 const meta=t.item.flags['ecos-frontera'].verbe;
 if(t.t==='R'&&t.item.system.activation.type!=='reaction'){t.item.system.activation.type='reaction';t.item.system.activation.value=1;reparaciones.push(`${t.id}: reacción nativa`);}
 for(const a of Object.values(t.item.system.activities)){
  if(a.type==='save'&&a.damage&&t.mitad&&a.damage.onSave!=='half'){a.damage.onSave='half';reparaciones.push(`${t.id}: mitad en salvación`);}
 }
 if(t.id==='familia-mente-saltar'){
  for(const a of Object.values(t.item.system.activities))a.effects=[];t.item.effects=[];
  const nota=' El fallo de la técnica puede aturdir al usuario, no a la víctima: el DM resuelve ese coste. La víctima salva al final de sus turnos y al recibir daño; no obtiene turnos ni reservas nuevos.';
  if(!t.texto.includes('no a la víctima')){t.texto+=nota;t.item.system.description.value+=`<p>${nota}</p>`;}
  reparaciones.push(`${t.id}: retirar Aturdido de la víctima equivocada`);
 }
 if(['forma-replica-solida','forma-doble'].includes(t.id)){
  meta.dividirVerbe=true;meta.copias=t.id==='forma-doble'?3:1;
  t.texto=`Creas ${meta.copias===1?'una réplica física de 1 PG':'hasta tres réplicas físicas de 1 PG (limitadas por tu competencia)'} con tu CA. Tras pagar, la energía positiva restante se divide de verdad entre original y copias. Todas las copias comparten un saldo separado y una acción ofensiva conjunta por turno: un ataque con arma, Ayudar o una técnica de grado 0–2 pagada con ese saldo mediante «Usar desde réplica». Su reacción es la del original. No recuperan recursos descansando, no duplican equipo, depósitos, hitos, Trazos o usos diarios. Al disiparse se pierde el saldo restante y recuperas lo que vieron; esos recuerdos no conceden progreso adicional. La formación requiere representación y movimiento en mesa; la tarjeta no crea tokens. No aumenta el número de copias al elevar el grado.`;
  t.item.system.description.value=`<p>${t.texto}</p><p>Conserva el alcance y la duración de su ficha. Al perder Concentración también termina la formación, si la técnica la exige.</p>`;
  t.sube=null;meta.sube=null;
  reparaciones.push(`${t.id}: división real de energía y límite conjunto de acciones`);
 }
}
D.shinobi={version:1,nuevas:definiciones.length,base:401,estudio:'Enciclopedia_de_Jutsus_Naruto_y_Shippuden_Ilustrada.pdf',paginas:47,reparaciones:[...new Set([...(D.shinobi?.reparaciones??[]),...reparaciones])]};
D.version=Math.max(7,Number(D.version)||0);
const errores=validateCatalog(D);if(errores.length)throw Error(errores.join('\n'));writeCatalog(D);
fs.writeFileSync(new URL('../docs/REPERTORIO_SHINOBI.json',import.meta.url),JSON.stringify({base:401,total:D.tecnicas.length,nuevas:definiciones.length,ramas:D.ramas.map(r=>({id:r.id,nombre:r.nombre,total:D.tecnicas.filter(t=>t.rama===r.id).length,nuevas:definiciones.filter(t=>t.rama===r.id).length})),reparaciones:D.shinobi.reparaciones,tecnicas:definiciones.map(t=>({id:t.id,referencia:t.origen,pagina:t.pagina,rama:t.rama,grado:t.g}))},null,2)+'\n');
const informe=[
 '# Repertorio shinobi · 3.0.0','',
 `El catálogo reúne **${D.tecnicas.length} técnicas y ${D.dotes.filter(d=>!d.evolucion).length} dotes**. Conserva las 401 técnicas anteriores y añade ${definiciones.length}; ${definiciones.filter(t=>t.rama!=='forma').length} incorporaciones pertenecen a otras ramas. Los identificadores anteriores, personajes, monedas y Trazos se conservan.`, '',
 '| Rama | Anteriores | Nuevas | Total |','|---|---:|---:|---:|',
 ...D.ramas.map(r=>{const total=D.tecnicas.filter(t=>t.rama===r.id).length,nuevas=definiciones.filter(t=>t.rama===r.id).length;return `| ${r.nombre} | ${total-nuevas} | ${nuevas} | ${total} |`;}),'',
 '## Cómo usarlo sin leer un reglamento','',
 'En **Aprender**, busca por el nombre de campaña o por el nombre del estudio, por ejemplo Rasengan, Hiraishin, Susanoo, Chibaku Tensei o Edo Tensei. Abre la ficha para ver qué hace, qué pide, cuánto cuesta, cómo termina y qué debe resolver el DM. Los nombres de Nimerios se conservan; la referencia identifica la inspiración. Los grados 0–11 son la adaptación de esta campaña, no los rangos E–S de la serie.','',
 'El DM concede **tradiciones, hitos, bestia y vínculo, reliquias y permisos rituales** desde su pestaña del panel. Conceder un acceso no enseña todas sus técnicas ni da rangos gratis: se aprenden normalmente con Trazos. Una tradición de contrato también registra el pacto correspondiente. Retirar una tradición o cambiar de huésped impide utilizar las técnicas que la requieren. Las facultades oculares adicionales exigen aprendizaje; solo las aperturas y los dones antiguos marcados como incluidos se entregan con la etapa.','',
 '**Umbral** reúne marcas, traslado, intercambio y técnicas dimensionales. **Vasija** reúne mantos, transformaciones, energía de bestias y poderes de huéspedes. La primera puede ser especialidad inicial; la segunda necesita una entidad vinculada o el hito excepcional pertinente. Disponer de una marca, un cuerpo, una dimensión o un artefacto sigue siendo un requisito de historia.','',
 '## Reglas conectadas al código','',
 '- **Réplicas físicas:** después del coste se reparte la energía positiva restante; no se paga su creación con deuda. Original y formación tienen saldos distintos. Todas las copias comparten una acción ofensiva por turno; «Usar desde réplica» paga desde su saldo y admite técnicas de grado 0–2. Armas, Ayudar, movimiento y posiciones se representan en mesa. La reacción es la del original. No copian depósitos, inventario, Trazos, usos diarios o descansos; el saldo restante se pierde al disiparlas. No se crean tokens.','',
 '- **Sello del centenar:** en Mejorar se almacena energía positiva propia, hasta dos puntos por nivel. No crea energía al depositar. Liberarlo vacía el depósito y recupera energía con los límites de reserva y deuda de la campaña. No elimina heridas ni repone el depósito por descansar.','',
 '- **Transformaciones:** los efectos propios se aplican al usuario; los modos del mismo grupo se sustituyen. Los estados ligados a Concentración desaparecen con ella. Los movimientos convierten metros a pies cuando lo necesita la hoja. La regeneración marcada cura al comienzo del turno mediante dnd5e y conserva los límites de supervivencia. Concentración, permisos y condiciones especiales deben confirmarse en la mesa.','',
 '- **Ojos:** se comprueban ojo, etapa y apertura. Mangekyō usa un marcador de desgaste persistente: seis usos marcados bloquean esas facultades hasta intervención del DM o etapa eterna; es una calibración de mesa, no un número canónico. La etapa eterna evita desgaste nuevo. Sacrificar los dos ojos bloquea sus técnicas hasta que el DM resuelva una restauración o trasplante. Un descanso no borra esas consecuencias.','',
 '- **Rituales y sacrificios:** el DM verifica componentes, participantes, oposición y consecuencias antes de autorizar un solo uso. Se consume el permiso al activar. Los grados altos conservan un uso por descanso largo; las familias limitadas comparten ese uso entre variantes. No se ejecuta una resurrección o sacrificio irreversible automáticamente.','',
 '- **Transferencias:** el DM mueve únicamente energía positiva que existe en el donante. Se descuenta del origen, se respeta el máximo del receptor y la deuda se paga a 2:1. Absorber exige resolver contacto, salvación y oposición antes de transferir. No absorbe automáticamente toda técnica que impacte.','',
 '## Reparaciones y migración','',
 '- Tormenta usa **Agua + Rayo**. Se conservan las combinaciones ya concedidas; las combinaciones propias de Nimerios continúan en el catálogo. No se inventa una composición elemental confirmada para Explosión, Magnetismo o Cristal.','',
 '- Hay **ocho Cerrojos**. El séptimo es la conmoción; el octavo es la puerta fatal y pide confirmación explícita antes de abrirla. Al terminar deja el cuerpo a 0 PG y pide al DM registrar la muerte o una intervención excepcional de historia. No automatiza muerte permanente.','',
 '- Quien conocía el antiguo séptimo fatal pasa a conocer el octavo, sin cobro. Su registro de compra pasa a la octava para conservar la devolución de Trazos. La migración ocurre una sola vez. Las compras de otros personajes se conservan.','',
 '- Cambio de mente deja de aplicar al objetivo el Aturdido que corresponde al fallo del usuario. Se sincronizan reacciones y mitad del daño con las actividades nativas. Las antiguas réplicas reciben reglas coherentes y reparto real; su número ya no aumenta gratuitamente al elevar el grado.','',
 '- El cultivo usa unidades de duración válidas de dnd5e. La regeneración de Verbe de un despertar consume el presupuesto limitado de recuperación breve; no permite energía infinita por turnos o descansos cortos. Se mantiene la progresión de Trazos de 2.10.','',
 '## Alcance del estudio y de la automatización','',
 'Fuente principal: **Enciclopedia de Jutsus Naruto y Shippuden Ilustrada**, 47 páginas, junto al Atlas y manuales de Nimerios. Cada incorporación registra origen y página en su ficha y en REPERTORIO_SHINOBI.json. El estudio agrupa variantes y no es una transcripción exhaustiva verificada de los 720 episodios. Esta versión tampoco afirma contener cada variante de toda la franquicia. Los poderes exclusivos o ampliados por el anime se identifican en sus referencias. Tenseigan aparece en el estudio como contexto de The Last; no se inventa un árbol completo de facultades no documentadas allí. No se incorpora un catálogo de Boruto ni de videojuegos.','',
 'Los hiden son tradiciones enseñadas, no herencia biológica por defecto. Ojos, cuerpos modificados, sangre, contratos y reliquias tienen requisitos separados. Los rituales narrativos conservan una ficha útil y límites de mesa en lugar de prometer una automatización que no existe.','',
 'Las actividades nativas proporcionan ataques, salvaciones, daño o curación cuando corresponde; los efectos contienen sus cambios declarados. El DM confirma repeticiones de salvación, posiciones, cobertura, destrucción de escenarios, marcas, información, sacrificios y perfiles de aliados invocados. No se crean ejércitos, NPC, tokens, escenarios, turnos independientes ni material vendible ilimitado automáticamente. Las 17 reliquias se entregan como equipo identificado: sus capacidades se aprenden y pagan aparte; no sustituyen por sí solas toda la ficha de un arma.','',
 'Se requiere comprobación en **Foundry v13 y dnd5e 5.2.5** con los módulos de la campaña. Las pruebas locales y las de Windows cubren reglas, migraciones, presentación generada, estructura y actualizador; no equivalen a una partida real ni a instalación en el PC del autor.','',
 '## Fuentes primarias de contraste','',
 '- [Siete puertas y Puerta de la Muerte](https://naruto-official.com/en/news/01_1355).','- [Tobirama: clones, marcas y reanimación](https://naruto-official.com/en/news/01_1694).','- [Agua, Rayo y Tormenta](https://naruto-official.com/en/news/01_2400).','- [dnd5e 5.2.5](https://github.com/foundryvtt/dnd5e/tree/release-5.2.5).','',
 '## Actualización privada','',
 'El Release incluye el módulo y el BAT con aviso de Windows tras una instalación nueva. Para activar los avisos de una instalación anterior, descarga **Ecos-Autoactualizacion.bat** y elige **Activar** una vez. Las comprobaciones sin cambios son silenciosas. Estado conserva la última versión instalada y su fecha, incluso si Windows silencia el globo. El repositorio y el Release siguen privados.',''
];
fs.writeFileSync(new URL('../docs/REPERTORIO_3.0.md',import.meta.url),informe.join('\n'));
console.log(JSON.stringify({total:D.tecnicas.length,nuevas:definiciones.length,ramas:D.ramas.length,reparaciones:reparaciones.length}));
