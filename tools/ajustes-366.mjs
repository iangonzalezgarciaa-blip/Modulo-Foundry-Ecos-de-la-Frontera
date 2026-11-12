/**
 * 3.66 · Ajustes del catálogo pedidos por el autor (12-nov-2026). Idempotente; va al final de catalog:expand.
 *  - Ley del Verbe: «todas las técnicas son místicas». Las utilidades que solo repiten una acción mundana (lavarse las
 *    manos, recordar una receta, hacer un nudo…) se retiran del aprendizaje nuevo. Quien ya las sabe las conserva.
 *  - Papel que estalla: pegar el sello es tu interacción con un objeto (o una acción); detonarlo es una acción adicional a
 *    36 m (120 ft), y ahí se paga el Verbe.
 *  - Romper el Velo pasa a ser «Liberar el Velo»: una reacción Verbe contra la CD de quien lo hizo.
 */
import { readCatalog, writeCatalog, validateCatalog } from './catalog.mjs';
import { fichaLecturaHTML } from '../scripts/verbe-reading.js';
const D = readCatalog();
const MUNDANAS = ['umbral-maleta-ordenada', 'umbral-mesa-desplegada', 'umbral-senda-porteador', 'rastro-mapa-olores', 'rastro-cuenta-pasos', 'rastro-agua-vecina',
  'rastro-eco-caverna', 'rastro-lectura-viento', 'rastro-catalogo-hojas', 'rastro-rumbo-caravana', 'pulso-lectura-cansancio', 'pulso-venda-sujeta', 'pulso-pulso-testigo',
  'pulso-guardia-camilla', 'pulso-higiene-manos', 'pulso-voz-rescate', 'pulso-pausa-muscular', 'pulso-rutina-cuidados', 'pulso-ficha-paciente', 'quietud-ritmo-taller',
  'quietud-silencio-lectura', 'quietud-vigilia-compartida', 'quietud-respirar-polvo', 'quietud-memoria-receta', 'quietud-pausa-del-acuerdo', 'quietud-ritmo-remo',
  'quietud-despedida-sosiego', 'mirada-lectura-costura', 'mirada-escala-pintor', 'hilo-nudo-porteador', 'cuerpo-palma-estibador', 'cuerpo-paso-danzante'].map(x => `vida-${x}`);
let retiradas = 0;
for (const id of MUNDANAS) {
  const t = D.tecnicas.find(x => x.id === id); if (!t) continue;
  t.retirada = true; retiradas++;
  t.cambios = [...new Set([...(t.cambios ?? []), '3.66: retirada del aprendizaje nuevo (ley del autor: toda técnica es mística)'])];
}
const regenerar = t => { t.item.system.description.value = fichaLecturaHTML(t); };
// Papel que estalla
const pe = D.tecnicas.find(x => x.id === 'sello-estalla');
if (pe) {
  const TXT = 'Pegas un sello de papel con tu interacción con un objeto del turno (o con una acción si ya la usaste): queda listo 24 h. Estalla cuando lo tocan o cuando tú quieras: acción adicional, a 36 m (120 ft). El Verbe se paga al detonarlo.';
  Object.assign(pe, { t: 'AA', e: TXT, uso: 'AA · 36 m · esfera 3 m · 24 h · G', usoL: 'Acción adicional (detonar) · a 36 m · esfera 3 m · dura: 24 h · con gestos' });
  pe.texto = String(pe.texto).replace(/Pegas un sello de papel: estalla cuando lo tocan o cuando tú quieras \(AA, a 36 m\)\./, TXT);
  pe.item.system.activation = { type: 'bonus', value: 1, condition: 'Detonar un sello ya pegado' };
  pe.item.system.range = { units: 'm', value: 36, special: '' };
  for (const a of Object.values(pe.item.system.activities ?? {})) a.name = 'Detonar el sello';
  regenerar(pe);
  pe.cambios = [...new Set([...(pe.cambios ?? []), '3.66: pegar es una interacción; detonar es una acción adicional a 36 m (pedido del autor)'])];
}
// Liberar el Velo
const lv = D.tecnicas.find(x => x.id === 'velo-romper');
if (lv) {
  const TXT = 'Reacción Verbe: cuando un efecto del Velo te afecta (o al empezar tu turno, si ya estás bajo uno), haces una prueba de Control contra la CD de quien lo hizo; si la superas, termina sobre ti. Con una acción, lo haces sobre una criatura que tocas. Es lo primero que enseña cualquier maestro de Velo.';
  Object.assign(lv, { n: 'Liberar el Velo', t: 'R', e: TXT, uso: 'R · yo · inst. · —', usoL: 'Reacción Verbe · sobre ti · dura: instantánea · sin gestos ni voz' });
  lv.alias = [lv.n];
  lv.texto = TXT;
  lv.item.name = lv.n;
  lv.item.system.activation = { type: 'reaction', value: 1, condition: 'Cuando un efecto del Velo te afecta' };
  for (const a of Object.values(lv.item.system.activities ?? {})) a.name = lv.n;
  if (lv.origen) lv.origen.nombre = lv.n;
  regenerar(lv);
  lv.cambios = [...new Set([...(lv.cambios ?? []), '3.66: Romper el Velo pasa a ser Liberar el Velo, una reacción Verbe (pedido del autor)'])];
}
D.ajustes366 = { retiradas, papel: !!pe, liberar: !!lv };
const errores = validateCatalog(D); if (errores.length) throw Error(errores.join('\n'));
writeCatalog(D);
console.log(`3.66: ${retiradas} técnicas mundanas retiradas; Papel que estalla y Liberar el Velo ajustadas.`);
