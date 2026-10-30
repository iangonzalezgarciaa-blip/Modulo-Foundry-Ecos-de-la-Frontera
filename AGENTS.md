# Instrucciones del autor para este repositorio

## Cierre de cada versión

Por instrucción expresa del autor: **cada versión terminada debe tener un GitHub Release**, no solo un commit o un ZIP dentro del repositorio.

- Mantener la misma versión en `module.json` y `package.json`.
- Registrar sus cambios en `CHANGELOG.md`.
- Ejecutar las pruebas, la validación y el empaquetado antes de publicarla.
- Publicar el tag `vX.Y.Z` con sus notas, el ZIP instalable `ecos-frontera-X.Y.Z.zip` y `module.json` como archivos adjuntos del Release.
- Mantener `manifest` en la dirección estable del último Release y `download` en el ZIP de la versión concreta.
- Verificar que el Release esté publicado y que incluya ambos archivos; entregar su enlace al autor.
- No sobrescribir los archivos de una versión ya publicada: usar una versión nueva para cambios posteriores.

El flujo `.github/workflows/release.yml` automatiza la publicación al cambiar la versión en `main`. También puede ejecutarse manualmente desde GitHub Actions. No declarar terminado un Release si el flujo falló o quedó pendiente.

Esta regla aplica a las versiones del módulo; los cambios de documentación o de herramientas sin cambio de versión no requieren crear versiones nuevas.

## Instalación desde Foundry

El autor prefiere instalar por URL de manifiesto una sola vez y actualizar después desde Foundry. Las actualizaciones deben apuntar a Releases terminados, no al contenido de commits sin publicar.

El repositorio es privado. No cambiar su visibilidad ni publicar una copia pública sin autorización explícita del autor. No afirmar que la instalación nativa funciona mientras Foundry no pueda descargar manifiesto y ZIP sin la sesión personal de GitHub del autor. No incrustar tokens en el módulo ni en sus URLs.
