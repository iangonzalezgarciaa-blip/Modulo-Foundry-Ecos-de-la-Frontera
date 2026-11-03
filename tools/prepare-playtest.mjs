import fs from 'node:fs';
import {PRUEBAS_REALES} from '../scripts/mesa-diagnostico.js';
const version=JSON.parse(fs.readFileSync(new URL('../package.json',import.meta.url),'utf8')).version;
const texto=`# Preparar la primera prueba real · ${version}

Abre **Mesa Ecos → Diagnóstico y pruebas**. El módulo muestra versiones, integraciones disponibles y avisos. El informe técnico se descarga sin nombres, diarios, rutas locales o credenciales. El DM puede guardar cada resultado en un cuaderno privado; las notas no se incluyen en el informe técnico.

## Antes de empezar

1. Actualiza el módulo desde Foundry (Configuración → Módulos → Buscar actualizaciones) antes de abrir el mundo de prueba. Conviene un respaldo del mundo.
2. Reabre un mundo de prueba o utiliza copias de fichas. Comprueba la versión del módulo en Diagnóstico.
3. Conecta un DM y un jugador. Usa dos navegadores o sesiones separadas para comprobar permisos.
4. Revisa que estén activos los módulos que quieras probar, incluidos Plutonium y Midi-QOL cuando corresponda. La base de integración es Foundry 13 con dnd5e 5.2.5. En un mundo nuevo, para probar el Verbe entre DM y jugador, pon Capa V en Activo y recarga ambos clientes; Prueba solo lo habilita al DM.
5. Registra lo observado. No marques un caso correcto si solo leíste el texto o ejecutaste pruebas de código.

## Orden sugerido

${PRUEBAS_REALES.map((p,i)=>`### ${i+1}. ${p.titulo}\n\n${p.pasos}\n\nResultado inicial: **Pendiente**. Registra Correcto, Fallo o No aplica en el panel.\n`).join('\n')}

## Qué registrar si algo falla

- Caso y pasos exactos, qué esperabas y qué ocurrió.
- Si actuaba el DM o un jugador; si el token era vinculado o no vinculado.
- Recursos antes y después, objetivos y orden de las defensas.
- Versión de los módulos del informe técnico. Si hay un mensaje de error, anótalo en tu cuaderno privado.

## Qué queda automatizado y qué debes confirmar

- **Creación:** la revisión comprueba estructura, duplicados, valores y avances nativos consultables. El DM confirma competencias, origen y equipo. Activar Ecos no despierta el Verbe.
- **Resolución:** el recibo acompaña la tarjeta nativa. Registra coste, defensas y choques que el flujo haya confirmado. Midi-QOL puede añadir el cierre de sus tiradas; el registro no vuelve a aplicar daño.
- **Corrección:** el GM principal puede restaurar solo Verbe de un uso simple si conserva su recibo, es el último uso y la reserva no cambió. No deshace daño, estados, movimiento, acciones o reacciones. Poderes altos, deuda y recursos especiales requieren revisión manual.
- **NPC:** las acciones importadas permanecen. La revisión señala Multiataque, áreas, control, magia y resistencias; las fórmulas que no puede resolver se muestran como pendientes.
- **Encuentros:** el índice de presión expresa hipótesis visibles. Ajusta daño de rutina, ataque y blancos de área. No es el cálculo oficial de dificultad ni promete una victoria.
- **Identidad:** las referencias del panteón se conservan; los relatos nuevos son propuestas. Puedes adoptarlos y editar sus páginas privadas sin que el módulo reemplace lo escrito.

## Validaciones anteriores a tu prueba

Se ejecutan regresiones con documentos simulados, comparación de potencia de las 778 técnicas previas, revisión de las 860 técnicas en veinte niveles y dos perfiles, y 96 secuencias de recursos con compras y consumo reales del adaptador. Estas comprobaciones no sustituyen este recorrido en Foundry.
`;
fs.writeFileSync(new URL('../docs/PRUEBAS_REALES_3.4.md',import.meta.url),texto);
console.log(`Guía preparada: ${PRUEBAS_REALES.length} casos reales pendientes.`);
