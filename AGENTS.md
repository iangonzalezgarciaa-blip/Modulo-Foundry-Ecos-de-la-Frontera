# Instrucciones del autor para este repositorio

## Cierre de cada versión

Por instrucción expresa del autor: **cada versión terminada debe tener un GitHub Release**, no solo un commit o un ZIP dentro del repositorio.

- Mantener la misma versión en `module.json` y `package.json`.
- Registrar sus cambios en `CHANGELOG.md`.
- Ejecutar las pruebas, la validación y el empaquetado antes de publicarla.
- Publicar el tag `vX.Y.Z` con sus notas y el ZIP instalable `ecos-frontera-X.Y.Z.zip` como archivo adjunto del Release.
- Verificar que el Release esté publicado y que incluya el ZIP; entregar su enlace al autor.
- No sobrescribir los archivos de una versión ya publicada: usar una versión nueva para cambios posteriores.

El flujo `.github/workflows/release.yml` automatiza la publicación al cambiar la versión en `main`. También puede ejecutarse manualmente desde GitHub Actions. No declarar terminado un Release si el flujo falló o quedó pendiente.

Esta regla aplica a las versiones del módulo; los cambios de documentación o de herramientas sin cambio de versión no requieren crear versiones nuevas.
