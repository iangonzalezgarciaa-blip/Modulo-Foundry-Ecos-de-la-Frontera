/**
 * 3.64 · Auditoría de dotes pedida por el autor (12-nov-2026): «las que sean realmente dones se quedan; las que
 * parezcan técnicas o entrenamientos van a otra categoría, dotes entrenadas, que piden entrenamiento (horas o días);
 * con un 20 se aprenden al instante». Marca cada dote con `tipo` («don» o «entrenada») y deja el informe en docs/.
 * Idempotente; va al final de catalog:expand. El DM puede cambiar cualquiera a mano en el panel (botón ↔).
 */
import fs from 'node:fs';
import { readCatalog, writeCatalog, validateCatalog } from './catalog.mjs';
import { tipoDote, planDote, textoPlan } from '../scripts/verbe-entreno.js';
const D = readCatalog();
let dones = 0, entrenadas = 0;
for (const d of D.dotes) {
  delete d.tipo;
  d.tipo = tipoDote(d);
  if (d.tipo === 'don') dones++; else entrenadas++;
}
// Guardia de Verbe (pedido del autor): además de +1 a la CA, +1 a todas las salvaciones hasta tu próximo turno.
const g = D.tecnicas.find(t => t.id === 'forma-pura-guardia');
if (g) {
  const viejo = 'hasta tu próximo turno: +1 a la CA.', nuevo = 'hasta tu próximo turno: +1 a la CA y +1 a todas tus tiradas de salvación.';
  g.texto = String(g.texto).replace(viejo, nuevo); if (g.e) g.e = String(g.e).replace(viejo, nuevo);
  const ef = g.item.effects?.[0];
  if (ef) {
    if (!ef.changes.some(c => c.key === 'system.bonuses.abilities.save')) ef.changes.push({ key: 'system.bonuses.abilities.save', mode: 2, value: '+1' });
    ef.description = String(ef.description).replace(viejo, nuevo);
  }
  g.item.system.description.value = String(g.item.system.description.value).replace('hasta tu próximo turno: +1 a la Clase de Armadura.', 'hasta tu próximo turno: +1 a la Clase de Armadura y +1 a todas tus tiradas de salvación.');
  g.cambios = [...new Set([...(g.cambios ?? []), '3.64: Guardia de Verbe suma +1 a todas las salvaciones (pedido del autor)'])];
}
D.ajustes364 = { dones, entrenadas, guardia: !!g };
const errores = validateCatalog(D); if (errores.length) throw Error(errores.join('\n'));
writeCatalog(D);
const cats = new Map((D.categoriasDote ?? []).map(c => [c.id, c.nombre]));
const fila = d => `| ${d.nombre} | ${cats.get(d.cat) ?? d.cat} | ${d.trazos} | ${d.tipo === 'don' ? 'Don' : `Entrenada · ${textoPlan(planDote(d.trazos))} · CD ${planDote(d.trazos).cd}`} |`;
const legados = D.dotes.filter(d => String(d.cat).startsWith('legado-'));
const resto = D.dotes.filter(d => !String(d.cat).startsWith('legado-'));
const md = `# Dotes: dones y dotes entrenadas · 3.64

Regla del autor (12-nov-2026): las dotes que son **dones** (de nacimiento, de la sangre, de la naturaleza o concedidos por el DM) se tienen al comprarlas; las que son **técnicas o entrenamientos** pasan a **dotes entrenadas**: después de pagar los Trazos se entrenan en bloques de horas o en días, con una tirada por bloque (Control del Verbe, Sabiduría por instinto o, con guía, la característica que elija). Un 20 natural la aprende al instante; un 1 pierde un bloque.

**${dones} dones · ${entrenadas} entrenadas** (de ${D.dotes.length}). Los ${legados.length} dones de los legados de sangre no se listan uno a uno: todos son dones.

## Tiempo de entrenamiento según los Trazos

| Trazos | Entrenamiento | CD |
|---:|---|---:|
${[1, 2, 3, 4, 5, 6].map(t => `| ${t}${t === 6 ? '+' : ''} | ${textoPlan(planDote(t))} | ${planDote(t).cd} |`).join('\n')}

## Todas las dotes (sin los legados)

| Dote | Categoría | Trazos | Tipo |
|---|---|---:|---|
${resto.sort((a, b) => (a.tipo === b.tipo ? 0 : a.tipo === 'don' ? -1 : 1) || String(a.cat).localeCompare(String(b.cat)) || a.nombre.localeCompare(b.nombre, 'es')).map(fila).join('\n')}
`;
fs.writeFileSync(new URL('../docs/DOTES_DONES_Y_ENTRENADAS.md', import.meta.url), md);
console.log(`3.64: ${dones} dones y ${entrenadas} dotes entrenadas.`);
