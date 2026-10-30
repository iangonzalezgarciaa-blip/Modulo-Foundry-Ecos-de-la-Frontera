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

## Privacidad y actualizaciones

El autor ha rechazado expresamente publicar su trabajo mientras esté en desarrollo. **Mantener privados el repositorio, los Releases y cualquier copia o distribución.** No proponer hacer público el proyecto otra vez ni cambiar su visibilidad. Incluso al terminarlo, cualquier publicación pública requiere una autorización nueva y explícita.

El autor quiere una configuración inicial y actualizaciones posteriores automáticas. En Windows se usa el actualizador privado local con GitHub CLI. Las nuevas versiones terminadas se publican como Releases privados y el actualizador las instala cuando no detecta Foundry abierto. No incrustar tokens en el módulo, en URLs ni en el archivo de configuración del actualizador.

`package.json` declara `ecosUpdateMode: private`. En este modo el manifiesto no debe anunciar enlaces nativos que Foundry no pueda descargar sin autenticación. No afirmar que la tarea está instalada en el PC del autor hasta comprobarlo allí.
