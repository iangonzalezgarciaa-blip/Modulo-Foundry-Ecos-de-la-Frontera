import { readFileSync, writeFileSync } from 'node:fs';
import { gzipSync, gunzipSync } from 'node:zlib';
const key = Buffer.from('ecos-frontera');
export function decodeCatalog(text) {
  const b = Buffer.from(text.trim(), 'base64');
  for (let i = 0; i < b.length; i++) b[i] ^= key[i % key.length] ^ (i & 255);
  return JSON.parse(gunzipSync(b).toString('utf8'));
}
export function encodeCatalog(data) {
  const b = gzipSync(Buffer.from(JSON.stringify(data)), { level: 9 });
  for (let i = 0; i < b.length; i++) b[i] ^= key[i % key.length] ^ (i & 255);
  return b.toString('base64') + '\n';
}
export const catalogPath = new URL('../data/verbe.txt', import.meta.url);
export const readCatalog = () => decodeCatalog(readFileSync(catalogPath, 'utf8'));
export const writeCatalog = data => writeFileSync(catalogPath, encodeCatalog(data));

export function validateCatalog(D) {
  const errors = [], ids = new Set(), ramas = new Set(D.ramas.map(r => r.id));
  for (const t of D.tecnicas) {
    if (!t.id || ids.has(t.id)) errors.push(`Identificador duplicado o vacío: ${t.id}`);
    ids.add(t.id);
    const meta = t.item?.flags?.['ecos-frontera']?.verbe;
    if (meta?.id !== t.id || meta?.g !== t.g || t.item?.system?.level !== t.g) errors.push(`${t.id}: metadatos desincronizados`);
    if (!ramas.has(t.rama) || !Number.isInteger(t.g) || t.g < 0 || t.g > 11) errors.push(`${t.id}: rama o grado inválidos`);
    if (!Number.isInteger(t.trazos) || t.trazos < 0) errors.push(`${t.id}: coste de aprendizaje inválido`);
    const activities = Object.values(t.item?.system?.activities ?? {});
    if (!activities.length) errors.push(`${t.id}: sin actividad`);
    if(meta?.shinobi){
      const acceso=meta.acceso??{};
      for(const[campo,lista,clave]of [['tradicion',D.tradicionesShinobi,'id'],['hito',D.hitosShinobi,'id'],['herencia',D.linajes,'req'],['artefacto',D.artefactosShinobi,'id'],['bestia',D.bestiasShinobi,'id']])
        if(acceso[campo]&&!lista?.some(x=>x[clave]===acceso[campo]))errors.push(`${t.id}: requisito inexistente ${campo}`);
      if(acceso.ojo&&!D.miradas.some(m=>m.id===acceso.ojo.id&&m.etapas.length>=acceso.ojo.etapa))errors.push(`${t.id}: ojo o etapa inexistentes`);
      if(t.previa&&!D.tecnicas.some(x=>x.id===t.previa))errors.push(`${t.id}: previa inexistente`);
      if(!['inst','round','minute','hour','day'].includes(t.item.system.duration.units))errors.push(`${t.id}: unidad de duración inválida`);
      if(!t.origen?.nombre||(!D.identidad&&(!Number.isInteger(t.origen.pagina)||t.origen.pagina<7||t.origen.pagina>44)))errors.push(`${t.id}: referencia inválida`);
    }
    for (const a of activities) {
      if (a.consumption?.spellSlot) errors.push(`${t.id}: consume espacios de conjuro`);
      const parte = a.healing ?? a.damage?.parts?.[0];
      const sube = String(meta?.sube ?? '').match(/^\+(\d+)d(\d+)$/);
      if (sube && parte?.number && !parte.custom?.enabled && Number(sube[2]) === parte.denomination
        && (parte.scaling?.mode !== 'whole' || parte.scaling?.number !== Number(sube[1]))) errors.push(`${t.id}: escalado contradice su descripción`);
      for (const ef of a.effects ?? []) if (!t.item.effects?.some(e => e._id === ef._id)) errors.push(`${t.id}: referencia a efecto inexistente`);
    }
  }
  const dotes = new Set();
  for (const d of D.dotes) {
    if (!d.id || dotes.has(d.id)) errors.push(`Dote duplicada: ${d.id}`);
    dotes.add(d.id);
    if (!Number.isInteger(d.trazos) || d.trazos < 0) errors.push(`${d.id}: coste de dote inválido`);
    for(const id of [...(d.requisitos?.dotes??[]),...(d.requisitos?.algunaDote??[])])if(!D.dotes.some(x=>x.id===id))errors.push(`${d.id}: dote previa inexistente ${id}`);
    for(const id of d.requisitos?.tecnicas??[])if(!D.tecnicas.some(x=>x.id===id))errors.push(`${d.id}: técnica previa inexistente ${id}`);
    if(d.requisitos?.nivel&&!Number.isInteger(d.requisitos.nivel)||d.requisitos?.nivel>20)errors.push(`${d.id}: nivel mínimo inválido`);
    if(d.poder&&(!Number.isSafeInteger(d.poder.costo)||d.poder.costo<0))errors.push(`${d.id}: coste de activación inválido`);
  }
  for (let g = 0; g <= 11; g++) if (!Number.isSafeInteger(D.costo[g]) || D.costo[g] < 0) errors.push(`Coste inválido de grado ${g}`);
  return errors;
}
