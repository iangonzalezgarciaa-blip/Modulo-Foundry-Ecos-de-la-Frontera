/**
 * 3.67 · Auditoría de técnicas pedida por el autor (lista del 12-nov-2026). Idempotente; va al final de catalog:expand.
 *  - Textos: fuera las frases de relleno («Afecta solo al objetivo…», «Lo de D&D es el golpe…»); las fichas dicen
 *    Qué es / Aspecto / Qué hace / Cómo se usa (los efectos de mesa al final). Eso lo hace `fichaLecturaHTML`.
 *  - Sello: no choca (ni intercepta ni se la intercepta). Las que no hacen daño se sostienen solas (sin Concentración)
 *    y las de utilidad duran y cargan más. Las alarmas, 8 h.
 *  - Velo: cada técnica dice qué hace en combate y fuera de él.
 *  - Quietud: reforzada (estilo de aguante y contraataque; utilidad de sentir, calmar y recuperar Verbe).
 *  - Hilo: cada técnica dice qué herramienta shinobi usa y qué gana con ella.
 *  - Cada rama declara su estilo de combate y su utilidad.
 */
import { readCatalog, writeCatalog, validateCatalog } from './catalog.mjs';
import { fichaLecturaHTML } from '../scripts/verbe-reading.js';
const D = readCatalog();
const VERSION = '3.67';
const activas = D.tecnicas.filter(t => !t.retirada);
const tec = id => D.tecnicas.find(t => t.id === id);
const tocadas = new Map();
const marcar = (t, motivo) => { if (!t) return; (tocadas.get(t) ?? tocadas.set(t, new Set()).get(t)).add(motivo); };
const meta = t => ((t.item.flags ??= {})['ecos-frontera'] ??= {}).verbe ??= {};
/** Añade una frase al final del texto si todavía no está. */
const anadir = (t, frase) => { if (!String(t.texto).includes(frase)) { t.texto = `${String(t.texto).trim()} ${frase}`; return true; } return false; };
/** Pone la cola rotulada (`re` la reconoce) al final del texto: la reemplaza si ya estaba. */
const cola = (t, re, frase) => { const antes = String(t.texto); const base = antes.replace(re, '').trim(); t.texto = `${base} ${frase}`; return t.texto !== antes; };
const reemplazar = (t, a, b) => { const antes = t.texto; t.texto = String(t.texto).replace(a, b); if (t.e) t.e = String(t.e).replace(a, b); return antes !== t.texto; };

/* ---------- 1. Frases de relleno ---------- */
const RELLENO = [
  [/\s*Límites: Afecta solo al objetivo o área indicados; no ignora cobertura total, inmunidades ni requisitos de la técnica\./g, ''],
  [/Límites: Una ventaja del mismo tipo no se acumula con otra ventaja\. No sustituye competencias, herramientas, materiales, descansos ni decisiones del DM\. Las tareas conservan su tiempo y consecuencias normales\./g,
    'Límites: no sustituye herramientas, materiales, descansos ni decisiones del DM.'],
  [/Límites: Ablanda: pega poco a propósito\. Lo de D&D es el golpe; esto abre el camino\./g, 'Pega poco a propósito: lo que importa es la debilidad que deja.'],
  [/Límites: No se acumula con otra transformación de su mismo grupo\. No concede turnos, descansos ni reservas adicionales\./g, 'Límites: no se acumula con otra transformación de su grupo.'],
  [/ No crea luz útil, documentos auténticos ni mensajes secretos automáticos\./g, ''],
  [/ No tapa la visión, produce luz útil ni distrae en combate por regla propia\./g, '']
];
let rellenos = 0;
for (const t of activas) {
  for (const [a, b] of RELLENO) {
    for (const k of ['texto', 'textoJ', 'e']) {
      if (typeof t[k] !== 'string') continue;
      const n = t[k].replace(a, b).replace(/\s{2,}/g, ' ').trim();
      if (n !== t[k]) { t[k] = n; if (k === 'texto') { rellenos++; marcar(t, `${VERSION}: fuera las frases de relleno del texto`); } }
    }
  }
}

/* ---------- 2. Sello ---------- */
const sinC = t => {
  const s = t.item.system;
  if (!(s.properties ?? []).includes('concentration')) return false;
  s.properties = s.properties.filter(p => p !== 'concentration');
  t.dur = String(t.dur ?? '').replace(/^C /, '');
  if (t.uso) t.uso = t.uso.replace(/· C /, '· ');
  if (t.usoL) t.usoL = t.usoL.replace(/dura: Concentración, /, 'dura: ');
  return true;
};
const conDanoEscrito = t => /\d+d\d+/.test(String(t.texto)) || /concentra/i.test(String(t.texto));
let sellosSolos = 0;
for (const t of activas.filter(x => x.rama === 'sello')) {
  t.sinChoque = true; meta(t).sinChoque = true; marcar(t, `${VERSION}: Sello no choca`);
  if (reemplazar(t, /\s*Sirve para interceptar una técnica en un choque\./, '')) marcar(t, `${VERSION}: Sello no choca`);
  if (reemplazar(t, /\s*Límites: En un choque, gana el total mayor \(sin ventaja elemental, Control del Verbe más el grado\)\. Fuera del choque es un ataque normal\./, '')) marcar(t, `${VERSION}: Sello no choca`);
  const dana = Object.values(t.item.system.activities ?? {}).some(a => a.type !== 'heal' && a.damage?.parts?.length) || t.dmg;
  if (!dana && !conDanoEscrito(t) && sinC(t)) {
    reemplazar(t, /mientras mantengas el flujo/g, 'mientras dure');
    sellosSolos++; marcar(t, `${VERSION}: los sellos se sostienen solos (sin Concentración)`);
  }
}
const SELLO = {
  'sello-guardar': [[/de hasta 5 kg/, 'de hasta 25 kg']],
  'sello-marca': [[/hasta 1,5 km\./, 'hasta 15 km.'], [/Tienes tantas como tu competencia\./, 'Tienes tantas como tu competencia + 1.']],
  'sello-bodega': [[/hasta 100 kg/, 'hasta 250 kg'], [/Sacarlas es una acción\./, 'Sacarlas es una acción adicional.']],
  'sello-barrera-menor': [[/CA 15, 25 PG/, 'CA 15, 30 PG']]
};
for (const [id, cambios] of Object.entries(SELLO)) {
  const t = tec(id); if (!t) continue;
  for (const [a, b] of cambios) if (reemplazar(t, a, b)) marcar(t, `${VERSION}: Sello de utilidad reforzado`);
}
// Las alarmas: 8 h, y la marca se queda en el intruso.
const alarma = tec('sello-alarma');
if (alarma && anadir(alarma, 'Además, el sello se pega al intruso durante 8 h: sabes en qué dirección y a qué distancia está, como con una Marca menor.')) marcar(alarma, `${VERSION}: alarma de 8 h que marca al intruso`);
const despensa = tec('vida-sello-sello-despensa');
if (despensa && reemplazar(despensa, /Al inspeccionarlo sabes si se abrió desde entonces\./, 'Si se abre, lo notas como un pinchazo aunque estés lejos (hasta 1,5 km), y al inspeccionarlo sabes cuándo.')) marcar(despensa, `${VERSION}: alarma de 8 h`);
// Duraciones largas: cierre, círculo de guarda y marca de vuelta pasan de 24 h a 7 días.
for (const id of ['sello-cierre', 'sello-circulo', 'sello-vuelta']) {
  const t = tec(id); if (!t) continue;
  const d = t.item.system.duration;
  if (d?.units === 'hour' && Number(d.value) === 24) {
    t.item.system.duration = { ...d, units: 'day', value: 7 };
    t.dur = '7 días';
    if (t.uso) t.uso = t.uso.replace('· 24 h ·', '· 7 días ·');
    if (t.usoL) t.usoL = t.usoL.replace('dura: 24 h', 'dura: 7 días');
    marcar(t, `${VERSION}: Sello de utilidad dura 7 días`);
  }
}

/* ---------- 3. Velo: dentro y fuera de combate ---------- */
const F = 'Fuera de combate: ', C = 'En combate: ';
const VELO = {
  'velo-susurro': C + 'una imagen quieta (un cajón, un muro bajo) te sirve para Esconderte detrás aunque no haya otra cobertura, hasta que alguien la descubra.',
  'velo-punzada': F + 'puedes no hacer daño: un dolor de cabeza repentino le da desventaja en su próxima prueba de Percepción o de Perspicacia en el minuto siguiente.',
  'velo-romper': F + 'con 1 minuto tocando un objeto, una persona o un lugar, notas si tiene un Velo encima y, si lo tiene, haces la prueba para quitarlo.',
  'velo-miedo': F + 'si falla, tienes ventaja en Intimidación contra ella durante 10 minutos, y un animal o un vigía abandona su puesto si puede.',
  'velo-parpados': F + 'un vigía o un centinela que falla se duerme sin darse cuenta; al despertar no sabe que fue un Velo.',
  'velo-imagen': C + 'te sirve para Esconderte detrás de la imagen y tapa la línea de visión de quien no la descubrió; quien la cree real gasta su acción en revisarla o la rodea.',
  'velo-amigo': C + 'Hechizado no puede atacarte: úsala sobre el más peligroso antes de que empiece la pelea. ' + F + 'ventaja en las pruebas de Carisma con ella mientras dure.',
  'velo-ojos': F + 'un vigía que falla no ve quién pasa; al terminar cree que fue un mareo.',
  'velo-cadenas': F + 'lo dejas quieto para interrogarlo o para pasar a su lado; después no recuerda bien qué le pasó.',
  'velo-no-estar': C + 'el primer ataque o la primera técnica desde la invisibilidad tiene ventaja (y termina el efecto). ' + F + 'pasar guardias, seguir a alguien, entrar donde no te dejan.',
  'velo-pesadilla': F + 'si falla, huye y no vuelve a ese lugar durante 1 hora: sirve para vaciar una sala o espantar a un testigo.',
  'velo-escenario': C + 'un muro, un fuego o un foso falsos: quien no lo descubre lo trata como real (no cruza el muro, rodea el fuego). ' + F + 'un campamento, un carro o una persona que habla: engaña a guardias y distrae a una multitud.',
  'velo-patron': F + 'un grupo que lo ve queda absorto: pasas, robas o hablas con otro sin que lo note.',
  'velo-perseguidor': F + 'puedes no hacer daño: si falla, te dice sin querer qué es lo que más teme, y tienes ventaja en Intimidación contra ella durante 1 hora.',
  'velo-revuelta': F + 'una multitud o unos guardias confundidos discuten entre sí: ventaja en Sigilo y en Juego de manos cerca de ellos mientras dure.',
  'velo-mano': F + 'le das una orden detallada (abrir una puerta, entregar una carta); al terminar, si falla otra salvación de Sabiduría, no recuerda haberla cumplido.',
  'velo-habitacion': F + 'para ella un minuto dura un día: al salir, ventaja en Intimidación o en Persuasión con ella, o cree que pasó un día entero.',
  'velo-paso-falso': F + 'durante 1 minuto tu imagen va medio paso corrida: ventaja en Juego de manos y en Sigilo para pasar al lado de quien te mira.',
  'velo-dolor': F + 'puedes no hacer daño: cree que se torció el tobillo y su velocidad baja a la mitad durante 10 minutos (no te persigue).',
  'velo-devolver': F + 'si alguien te pone un Velo para engañarte, notas quién fue y desde dónde, aunque no lo veas.',
  'velo-espejos': F + 'en una multitud o en un pasillo, quien falla sigue a una copia tuya en otra dirección durante 1 minuto.',
  'velo-noche': F + 'quien falla y no está en peligro sigue durmiendo de verdad hasta 8 horas si nadie lo despierta.',
  'familia-mente-leer': C + 'sabes qué piensa hacer en su próximo turno: tienes ventaja en tu primera tirada contra ella (o en tu salvación contra lo que haga) antes de que termine tu siguiente turno.',
  'familia-mente-saltar': F + 'su cuerpo te lleva donde no podrías entrar: hablas con su voz y ves con sus ojos; al salir no recuerda lo que hizo.',
  'velo-ruido': C + 'un ruido a la espalda de un enemigo: hace Sabiduría (Perspicacia) contra tu CD; si falla, el próximo ataque contra él antes de tu siguiente turno tiene ventaja. Una vez por criatura y combate. ' + F + 'pasos en otro pasillo, una voz conocida o un cristal que se rompe atraen a un guardia.',
  'velo-cansancio': F + 'si falla, se cansa de verdad: quiere sentarse o irse a dormir, y tienes ventaja en Persuasión para que deje su puesto.',
  'velo-sin-rostro': C + 'quien te busca en una multitud o entre tus aliados tiene desventaja en Percepción para encontrarte; nadie podrá señalarte después.',
  'velo-tiempo-lento': F + 'no nota cuánto tiempo pasó mientras dure: ideal para robar, para alargar una conversación o para llegar antes que él.',
  'velo-herida': F + 'puedes no hacer daño: cree estar herido de gravedad y, si falla, se rinde o pide ayuda.',
  'velo-hacia-dentro': F + 'un grupo que falla empieza a desconfiar entre sí: discuten, se separan o se delatan.',
  'velo-ciudad': C + 'el lugar falso esconde salidas, trampas y posiciones: tus aliados empiezan escondidos, y quien entra sin descubrirla tira la iniciativa con desventaja.',
  'velo-reino': F + 'puedes no hacer daño: todos los de la zona comparten el mismo sueño, un lugar seguro para hablar sin que nadie de fuera lo oiga.',
  'familia-voz-mente': C + 'una vez por asalto, puedes usar la acción Ayudar sobre un aliado conectado a cualquier distancia, y el enemigo no oye vuestros planes.',
  'velo-mundo-entero': F + 'puedes no hacer daño: todos viven el mundo que muestras; sirve para enseñar, convencer o interrogar (ventaja en Persuasión e Intimidación con ellos durante 1 hora).',
  'velo-sueno-sin-fin': C + 'quien falla cae Inconsciente al momento: la pelea termina para él. ' + F + 'sirve para retener a alguien sin cadenas o para hacerle creer lo que soñó.',
  'velo-lugar-falso': C + 'una salida que no está, un pasillo más largo: quien no lo descubre cuenta esa zona como terreno difícil.',
  'velo-doble-escenario': C + 'quien descubre la primera capa cree haber visto la verdad: tiene desventaja en la prueba para descubrir la segunda.',
  'velo-estacas-sonadas': F + 'lo dejas clavado en el sitio mientras hablas o huyes; nadie más ve las estacas.',
  'velo-cuervos-sonados': F + 'un vigilante que falla te pierde de vista: ventaja en Sigilo contra él durante 1 minuto.',
  'velo-flauta-cautiva': F + 'con la melodía, hasta tres oyentes se quedan quietos escuchando mientras sigas tocando.',
  'velo-coro-sabio': F + 'quienes fallan creen pasar horas en el escenario: sirve para retenerlos o interrogarlos.',
  'velo-almeja-espejismo': F + 'la niebla esconde un campamento o una ruta: quien busca a tus aliados tiene desventaja en Percepción para encontrarlos.',
  'velo-salir-flujo': F + 'tocando a alguien, notas si está bajo un Velo o Hechizado y, si conoces a quien lo hizo, sabes que fue él.',
  'velo-desorden-mental': F + 'en lugar de atacar, hace un gesto que tú eliges: soltar algo, empujar una puerta o tropezar.',
  'velo-enlace-grupo': C + 'una vez por asalto, cada aliado conectado puede usar la acción Ayudar sobre otro aliado conectado a cualquier distancia.',
  'velo-transmision-mente': C + 'si avisas a un aliado antes de que lo ataquen, no puede quedar Sorprendido.',
  'velo-retorno-mente': C + 'vuelves a tu cuerpo antes de que lo dañen, con una acción adicional. ' + F + 'terminas una exploración mental cuando quieras.',
  'velo-sueno-corporeo': F + 'puedes no hacer daño: la pesadilla se siente real y las víctimas creen lo que vieron hasta que superen una salvación de Sabiduría.',
  'velo-luna-infinita': C + 'no es para una pelea: se prepara antes, en la historia. ' + F + 'un sueño de escala enorme que el DM define contigo.',
  'vida-velo-cartel-luminoso': C + 'veinte palabras en una pared o en el suelo: das un aviso a tus aliados sin hablar.',
  'vida-velo-ensayo-escena': C + 'si ensayasteis un plan con las figuras antes de la pelea, los aliados que lo vieron tienen ventaja en la iniciativa de ese combate.',
  'vida-velo-vestuario-borrador': C + 'un color o una marca sobre la ropa de tus aliados: los distingues entre réplicas, disfraces o Velos durante 10 minutos.',
  'vida-velo-cuento-lampara': C + 'la silueta se mueve donde quieras: una criatura que no te ve tiene desventaja en su próxima prueba de Percepción para encontrarte.',
  'velo-reflejo-falso': F + 'dejas tu reflejo quieto un instante donde estabas: quien te vigila cree que no te moviste (ventaja en Sigilo para alejarte una vez).',
  'velo-punzada-mente': F + 'puedes no hacer daño: una imagen que distrae; desventaja en su próxima prueba de Percepción o de Perspicacia en el minuto siguiente.',
  'velo-pesadilla-lenta': F + 'puedes no hacer daño: la pesadilla se queda; si falla, no recupera Dados de Golpe en su próximo Descanso Largo.',
  'velo-duda': F + 'puedes no hacer daño: la duda se queda; desventaja en su próxima prueba de Carisma o de Perspicacia contra ti en la hora siguiente.',
  'velo-espejo-miedo': F + 'puedes no hacer daño: si falla, te tiene miedo durante 1 hora y tienes ventaja en Intimidación contra ella.',
  'velo-escape': F + 'tu imagen se queda sentada o de pie donde estabas durante 1 minuto mientras te alejas.'
};
let veloDobles = 0;
for (const [id, frase] of Object.entries(VELO)) {
  const t = tec(id); if (!t || t.retirada) continue;
  if (cola(t, /\s*(?:En combate|Fuera de combate): .*$/s, frase)) veloDobles++;
  marcar(t, `${VERSION}: Velo con uso dentro y fuera de combate`);
}
const sinDoble = activas.filter(t => t.rama === 'velo' && !/(En combate|Fuera de combate):/.test(t.texto)).map(t => t.id);

/* ---------- 4. Quietud reforzada ---------- */
const QUIETUD = {
  'quietud-respirar': [[/recuperas 2 × tu competencia\./, 'recuperas 2 × tu competencia + tu modificador de Sabiduría.']],
  'quietud-dar': [[/recupera 2 × tu competencia\./, 'recupera 2 × tu competencia + tu modificador de Sabiduría.']],
  'quietud-quieto': [[/Mientras no te mueves, ventaja en Sigilo, y quien te busca por tu Verbe tiene desventaja\./, 'Mientras no te mueves: ventaja en Sigilo, +1 a la CA, y quien te busca por tu Verbe tiene desventaja. Termina cuando te mueves.']],
  'quietud-calma': [[/suma 1d4 a una prueba de característica antes de que termine\./, 'suma 1d4 a una prueba de característica o a una tirada de salvación antes de que termine.']],
  'quietud-golpe': [[/el mundo golpea contigo\.(?! Si es Grande)/, 'el mundo golpea contigo. Si es Grande o menor, además lo empujas 1,5 m.']],
  'quietud-raiz': [[/y tienes ventaja en las salvaciones de FUE\./, 'tienes ventaja en las salvaciones de FUE y tus ataques de oportunidad tienen ventaja: quien entra o sale de tu alcance lo paga.']],
  'quietud-estado': [[/\+2 a Fuerza, Destreza y Constitución \(hasta 22\),(?! \+1 a la CA)/, '+2 a Fuerza, Destreza y Constitución (hasta 22), +1 a la CA,'], [/Cada minuto, SAB CD 10 \+ los minutos que llevas/, 'Cada minuto después del primero, SAB CD 10 + los minutos que llevas']],
  'quietud-tierra': [[/recuperan 1d8 PG al inicio de cada turno/, 'recuperan 2d6 PG al inicio de cada uno de sus turnos']],
  'quietud-puno-mundo': [[/si impacta, empuja 3 m\./, 'si impacta, empuja 4,5 m y, si es Grande o menor, queda Derribado.']],
  'quietud-raiz-firme': [[/\+2 a la CA contra ese ataque\./, '+2 a la CA contra ese ataque, y ese ataque no te mueve ni te derriba.']],
  'quietud-escuchar': [[/Sientes los pasos y el peso de lo que se mueve a 18 m sobre la tierra\./, 'Sientes los pasos y el peso de lo que se mueve a 18 m sobre la tierra, aunque no lo veas: no te sorprende quien camina.']]
};
let quietud = 0;
for (const [id, cambios] of Object.entries(QUIETUD)) {
  const t = tec(id); if (!t) continue;
  for (const [a, b] of cambios) if (reemplazar(t, a, b)) { quietud++; marcar(t, `${VERSION}: Quietud reforzada`); }
}
// Sin Concentración: la raíz, sentir lo vivo, sentirlo todo y caminar sin peso se sostienen solos.
for (const id of ['quietud-raiz', 'quietud-vivo', 'quietud-sentirlo-todo', 'quietud-sin-peso']) { const t = tec(id); if (t && sinC(t)) marcar(t, `${VERSION}: Quietud sin Concentración`); }
// Escuchar la tierra: 10 minutos.
const esc = tec('quietud-escuchar');
if (esc && esc.item.system.duration?.units === 'minute' && Number(esc.item.system.duration.value) === 1) {
  esc.item.system.duration.value = 10; esc.dur = '10 min';
  if (esc.uso) esc.uso = esc.uso.replace('· 1 min ·', '· 10 min ·'); if (esc.usoL) esc.usoL = esc.usoL.replace('dura: 1 min', 'dura: 10 min');
  marcar(esc, `${VERSION}: Quietud reforzada`);
}
// El mundo cura: con una acción, no con un minuto.
const cura = tec('quietud-mundo-cura');
if (cura && cura.t === '1 min') {
  cura.t = 'A'; cura.item.system.activation = { type: 'action', value: 1, condition: '' };
  if (cura.uso) cura.uso = cura.uso.replace(/^1 min ·/, 'A ·'); if (cura.usoL) cura.usoL = cura.usoL.replace(/^1 minuto ·/, 'Acción ·');
  marcar(cura, `${VERSION}: Quietud reforzada (cura con una acción)`);
}

/* ---------- 5. Hilo: herramientas shinobi ---------- */
const HERRAMIENTA_TEXTO = {
  arrojadiza: 'Herramienta: un kunai, estrellas arrojadizas o agujas (Objetos del Verbe). Usas el arma real: si es mágica, suma su bonificador al ataque y al daño, y al terminar la recuperas.',
  agujas: 'Herramienta: Agujas (20). Gastas 10 por uso y recuperas la mitad; sin agujas no se puede usar.',
  hilo: 'Herramienta: Hilo de Verbe (rollo de 15 m). Con el rollo, llega 3 m más lejos y la CD para soltarse sube 1. Sin él funciona igual, con hilo de tu propio Verbe.',
  pergamino: 'Herramienta: un Pergamino de armas lleno. Se vacía al usarlo; llenarlo pide una hora y veinte armas.',
  marioneta: 'Herramienta: una Marioneta (o Marioneta de guerra) y Hilo de Verbe. Sus mejoras (Blindaje, Muelles, Depósito, Ojos de vidrio) se aplican.',
  sellos: 'Herramienta: Sellos de papel. Gastas uno por uso.',
  arma: 'Herramienta: un arma que lleves (kunai, espada, abanico). Si es mágica, suma su bonificador al ataque y al daño.',
  reliquia: 'Herramienta: su reliquia. Sin ella no se puede usar.',
  tinta: 'Herramienta: Tinta de Verbe y papel. Gastas un uso del frasco.'
};
const HILO = {
  'hilo-vuelve': 'arrojadiza', 'hilo-hilo': 'hilo', 'hilo-agujas': 'agujas', 'hilo-ata': 'hilo', 'hilo-marioneta': 'marioneta', 'hilo-telarana': 'hilo', 'hilo-tres': 'arrojadiza',
  'hilo-suspendida': 'arma', 'hilo-lluvia': 'pergamino', 'hilo-guerra': 'marioneta', 'hilo-jaula': 'hilo', 'hilo-viva': 'hilo', 'hilo-mil': 'pergamino', 'hilo-dardo': 'arrojadiza',
  'hilo-trampa': 'hilo', 'hilo-abanico': 'arrojadiza', 'hilo-cubre': 'marioneta', 'hilo-en-el-otro': 'hilo', 'hilo-espiral': 'hilo', 'hilo-cien-armas': 'pergamino', 'hilo-red-cielo': 'hilo',
  'hilo-ultimo-titiritero': 'hilo', 'hilo-cuervo': 'marioneta', 'hilo-hormiga': 'marioneta', 'hilo-salamandra': 'marioneta', 'hilo-caja-negra': 'marioneta', 'hilo-diez-marionetas': 'marioneta',
  'hilo-cien-marionetas': 'marioneta', 'hilo-marioneta-humana': 'marioneta', 'hilo-tercer-herrero': 'reliquia', 'hilo-cuerpo-artificial': 'marioneta', 'hilo-recubrir-viento': 'arma',
  'hilo-pergaminos-gemelos': 'pergamino', 'hilo-agujas-sombra': 'arrojadiza', 'hilo-hilos-sombra': 'hilo', 'hilo-costura-sombra': 'hilo', 'hilo-dibujos-escuadra': 'tinta',
  'hilo-samehada-beber': 'reliquia', 'hilo-samehada-fusion': 'reliquia', 'hilo-decapitadora': 'reliquia', 'hilo-espada-gemela': 'reliquia', 'hilo-colmillos-rayo': 'reliquia',
  'hilo-espada-explosiva': 'sellos', 'hilo-aguja-cose': 'reliquia', 'hilo-rompedefensas': 'reliquia', 'hilo-kusanagi': 'reliquia', 'hilo-gunbai': 'reliquia', 'hilo-basho-fuego': 'reliquia',
  'hilo-totsuka': 'reliquia', 'hilo-yata': 'reliquia', 'hilo-papel-danza': 'sellos', 'hilo-papel-replica': 'sellos', 'hilo-papel-oceano': 'sellos', 'hilo-esferas-orbitales': 'hilo',
  'hilo-agujas-rayo': 'agujas', 'hilo-raiga': 'reliquia', 'hilo-cuerpo-prestado': 'hilo', 'hilo-cuerda-relampago': 'hilo', 'hilo-rayo-bestia': 'arma', 'hilo-rayo-pantera': 'arma',
  'hilo-viento-red': 'arma', 'hilo-madera-coloso': 'hilo', 'vida-hilo-costura-remiendo': 'hilo', 'vida-hilo-tendedero-sutil': 'hilo', 'vida-hilo-dedo-campanero': 'hilo',
  'hilo-red-parada': 'hilo', 'hilo-cuchillas-suspendidas': 'arrojadiza', 'hilo-correas': 'hilo', 'hilo-red-cortes': 'hilo', 'hilo-escape': 'hilo'
};
let hilo = 0;
for (const [id, clave] of Object.entries(HILO)) {
  const t = tec(id); if (!t || t.retirada) continue;
  meta(t).herramienta = clave; t.herramienta = clave;
  // Lo que ya decía la ficha sobre su herramienta queda dentro de la línea nueva.
  reemplazar(t, /\s*Pide diez agujas\./, ''); reemplazar(t, /\s*Pide un pergamino de armas\./, '');
  if (cola(t, /\s*Herramienta: .*$/s, HERRAMIENTA_TEXTO[clave])) hilo++;
  marcar(t, `${VERSION}: Hilo ligado a su herramienta shinobi`);
}
const hiloSin = activas.filter(t => t.rama === 'hilo' && !t.herramienta).map(t => t.id);
// El kunai entra en los Objetos del Verbe (es la daga de D&D, arrojadiza).
if (!D.equipo.some(e => /^Kunai/.test(e.objeto))) D.equipo.splice(D.equipo.findIndex(e => /^Estrellas/.test(e.objeto)) + 1, 0,
  { objeto: 'Kunai (5)', para: 'Arma sencilla, sutil, ligera y arrojadiza (como una daga): 1d4 perforante, alcance 6/18 m. Lleva una anilla para atarle Hilo de Verbe.', precio: '2 o', origen: 'Cualquier herrero.' });

/* ---------- 6. Cada rama: estilo de combate y utilidad ---------- */
const ESTILO = {
  forma: ['golpes a distancia y áreas del elemento; choca técnicas', 'mover agua, tierra o aire, encender, apagar, abrir paso'],
  velo: ['quitar enemigos de la pelea: miedo, sueño, ceguera, confusión', 'infiltrarse, engañar, interrogar, esconder al grupo'],
  cuerpo: ['cuerpo a cuerpo: golpes, velocidad y aguante, casi todo con acción adicional', 'saltar, trepar, cargar, correr, resistir'],
  mirada: ['leer al rival: anticipar, copiar, ver lo invisible', 'ver el Verbe, descubrir Velos y mentiras, rastrear'],
  sello: ['controlar el campo: barreras, trabas, anclas y sellos que cortan el Verbe; no choca', 'cerrar, guardar, avisar, marcar y volver: sellos que se sostienen solos'],
  pacto: ['pelear junto a lo que invocas', 'mensajeros, monturas y exploradores'],
  pulso: ['curar en la pelea y dañar por dentro', 'tratar heridas, venenos y enfermedades'],
  hilo: ['armas que vuelan, hilos que atan y marionetas que pelean: cada técnica usa su herramienta (Objetos del Verbe)', 'trampas, cuerdas, recoger objetos, reparar'],
  quietud: ['aguante y contraataque: no te mueven, castigas a quien entra en tu alcance y golpeas con el peso del mundo', 'sentir lo vivo, calmar, recuperar Verbe del mundo'],
  rastro: ['encontrar al enemigo escondido y atacar donde duele', 'rastrear, sentir el Verbe a distancia, medir al rival'],
  sangre: ['lo que da tu linaje', 'lo que da tu linaje'],
  umbral: ['moverse por el campo: aparecer, cambiar de sitio, apartar', 'viajar, marcar caminos, abrir puertas'],
  vasija: ['transformarse y pelear con la fuerza de la bestia', 'lo que la bestia sabe y siente']
};
for (const r of D.ramas) {
  const e = ESTILO[r.id]; if (!e) continue;
  r.estilo = { combate: e[0], utilidad: e[1] };
  const frase = ` En combate: ${e[0]}. Fuera de combate: ${e[1]}.`;
  if (r.id !== 'sangre' && !String(r.jugador).includes(' En combate: ')) r.jugador = `${r.jugador}${frase}`;
}
const jug = id => D.ramas.find(r => r.id === id);
if (jug('sello') && !jug('sello').jugador.includes('Los sellos no chocan')) jug('sello').jugador = jug('sello').jugador.replace('Casi todo pide Gestos', 'Los sellos no chocan y se sostienen solos (sin Concentración). Casi todo pide Gestos');

/* ---------- 7. Fichas: Qué es / Aspecto / Qué hace / Cómo se usa ---------- */
// Se rehace la lectura de todas (la plantilla cambió) y se conserva lo que otras reglas añadieron detrás (p. ej. «Pesada»).
const CIERRE = '</details></div>';
let fichas = 0;
for (const t of D.tecnicas) {
  const html = String(t.item?.system?.description?.value ?? '');
  if (!html.startsWith('<div class="ev-lectura">')) continue;
  const i = html.indexOf(CIERRE); if (i < 0) continue;
  const nuevo = fichaLecturaHTML(t) + html.slice(i + CIERRE.length);
  if (nuevo !== html) { t.item.system.description.value = nuevo; fichas++; }
}
for (const [t, motivos] of tocadas) t.cambios = [...new Set([...(t.cambios ?? []), ...motivos])];
// El resumen se cuenta sobre el estado final, para que repetir el script no lo cambie.
const con = txt => D.tecnicas.filter(t => t.cambios?.some(c => c.startsWith(`${VERSION}:`) && c.includes(txt))).length;
D.ajustes367 = { tecnicas: con(''), relleno: con('relleno'), sellosSolos: con('sostienen solos'), velo: con('Velo con uso'), quietud: con('Quietud'), hilo: con('Hilo ligado'),
  sinDoble, hiloSin, sinChoque: D.tecnicas.filter(t => t.sinChoque).length };
const errores = validateCatalog(D); if (errores.length) throw Error(errores.join('\n'));
writeCatalog(D);
console.log(`3.67: ${tocadas.size} técnicas ajustadas (relleno ${rellenos}, sellos solos ${sellosSolos}, Velo ${veloDobles}, Quietud ${quietud}, Hilo ${hilo}); ${fichas} fichas rehechas.${sinDoble.length ? ` Velo sin doble uso: ${sinDoble.join(', ')}.` : ''}${hiloSin.length ? ` Hilo sin herramienta: ${hiloSin.join(', ')}.` : ''}`);
