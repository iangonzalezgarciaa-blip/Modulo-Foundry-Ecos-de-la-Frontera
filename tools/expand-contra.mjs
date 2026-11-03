/** Contratécnicas no elementales (3.2): 18 técnicas originales, 2 por rama. Idempotente. */
import { readCatalog, writeCatalog, validateCatalog } from './catalog.mjs';
import { construirShinobi } from './build-shinobi.mjs';
import { NIVEL_GRADO, etapaGrado } from '../scripts/verbe-progression.js';
import { contra } from './nimerios/contra.mjs';
const D = readCatalog();
for (const s of contra) {
  const t = construirShinobi({ ...s, gestos: true, origen: 'Contratécnicas de Nimerios', fuente: 'Creación original de la campaña.',
    limite: s.tipo === 'buff' ? 'Una vez por ataque; gasta tu reacción. No se acumula con otra reacción defensiva contra el mismo ataque.' : 'En un choque, gana el total mayor (sin ventaja elemental, Control del Verbe más el grado). Fuera del choque es un ataque normal.',
    manual: s.tipo === 'buff' ? 'Con midi-qol aparece en la ventana de defensa cuando te van a impactar; el bono se aplica solo a ese ataque.' : 'Ataque o salvación y dados nativos; en la ventana de choque aparece como contratécnica.' }, D);
  const m = t.item.flags['ecos-frontera'].verbe;
  delete m.shinobi; m.contra = true; t.contra = true;
  t.alias = [s.nombre]; t.origen = { obra: 'Nimerios', nombre: 'Contratécnicas', referencia: 'Creación original.' };
  t.item.system.source = { custom: 'Ecos · Contratécnicas', book: 'Nimerios' };
  t.nivelMin = NIVEL_GRADO[s.g]; t.obtencion = { nivel: t.nivelMin, etapa: etapaGrado(s.g), rama: s.rama }; m.obtencion = t.obtencion;
  for (const e of t.item.effects ?? []) e.flags['ecos-frontera'].verbe.especialDefensa = true, (e.flags.dae ??= {}).specialDuration = ['isAttacked'];
  const i = D.tecnicas.findIndex(x => x.id === t.id);
  if (i < 0) D.tecnicas.push(t); else D.tecnicas[i] = t;
}
D.contra = { version: 1, nuevas: D.tecnicas.filter(x => x.contra).length };
const errores = validateCatalog(D); if (errores.length) throw Error(errores.join('\n'));
writeCatalog(D);
console.log(`Contratécnicas: ${D.contra.nuevas}; total ${D.tecnicas.length}.`);
