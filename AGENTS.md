# Instrucciones del autor para este repositorio

## Cierre de cada versión

Por instrucción expresa del autor: **cada versión terminada debe tener un GitHub Release**, no solo un commit o un ZIP dentro del repositorio.

- Mantener la misma versión en `module.json` y `package.json`.
- Registrar sus cambios en `CHANGELOG.md`.
- Ejecutar las pruebas, la validación y el empaquetado antes de publicarla.
- Publicar el tag `vX.Y.Z` con sus notas, el ZIP instalable `ecos-frontera-X.Y.Z.zip` y `module.json` como archivos adjuntos del Release.
- Mantener `manifest` en la dirección estable del último Release y `download` en el ZIP de la versión concreta.
- Verificar que el Release esté publicado y que incluya ambos archivos; entregar su enlace al autor.
- En modo privado, adjuntar también `Ecos-Actualizar.ps1` y comprobar sus pruebas en Windows antes de publicar.
- No sobrescribir los archivos de una versión ya publicada: usar una versión nueva para cambios posteriores.

El flujo `.github/workflows/release.yml` automatiza la publicación al cambiar la versión en `main`. También puede ejecutarse manualmente desde GitHub Actions. No declarar terminado un Release si el flujo falló o quedó pendiente.

Esta regla aplica a las versiones del módulo; los cambios de documentación o de herramientas sin cambio de versión no requieren crear versiones nuevas.

## Visibilidad y actualizaciones

El 3-nov-2026 el autor hizo público el repositorio y pidió usar el actualizador nativo de Foundry (versión 3.9.1). **No cambiar la visibilidad del repositorio sin una orden nueva y explícita del autor**, en ningún sentido.

`package.json` declara `ecosUpdateMode: public`:
- `module.json` anuncia `manifest` en la dirección estable del último Release y `download` en el ZIP de su versión.
- El flujo de publicación lo comprueba.
- Foundry instala y actualiza desde ahí, sin descargas manuales.

El actualizador privado de Windows (`tools/windows/`) queda retirado: se conserva el código y sus pruebas, pero los Releases ya no lo adjuntan. No incrustar tokens en el módulo, en URLs ni en ninguna configuración.

Con el repositorio público, cualquiera puede leer `docs/` y decodificar el catálogo. Avisar al autor antes de añadir al repositorio secretos de campaña nuevos; los que solo deban ver él y su mesa van en los diarios de su mundo.
