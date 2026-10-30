# Actualizaciones privadas: una configuración inicial en Windows

El repositorio y sus Releases permanecen privados. Se ha descartado la distribución pública. Para evitar descargar ZIPs en cada versión, el actualizador usa el acceso de tu cuenta a GitHub en tu propio PC; Foundry por sí solo no reutiliza la sesión de ChatGPT o del navegador.

## Configurarlo una vez

1. Entra al último Release privado con tu cuenta de GitHub y descarga **Ecos-Actualizar.ps1**. No necesitas desinstalar el módulo.
2. Abre Windows PowerShell y ejecuta, si el archivo está en Descargas:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "$env:USERPROFILE\Downloads\Ecos-Actualizar.ps1" -Install
```

3. El instalador busca GitHub CLI y, si falta, intenta instalarlo mediante WinGet. Abre el inicio de sesión de GitHub si todavía no hay una cuenta autorizada. Usa la cuenta que tiene acceso a este repositorio.
4. Indica la carpeta de datos de usuario de Foundry. Si es la predeterminada, pulsa Enter para usar `%LOCALAPPDATA%\FoundryVTT`. Se debe seleccionar la carpeta que contiene `Data`, no la del ejecutable.
5. El instalador registra una tarea del usuario y comprueba la última versión. Si detecta Foundry abierto, lo deja para después. Cierra Foundry para que pueda aplicar la actualización.

`ExecutionPolicy Bypass` afecta a ese proceso; el instalador no cambia globalmente la política de PowerShell. La sesión se gestiona mediante GitHub CLI. El archivo de configuración propio solo guarda la ruta de datos, la ruta del programa GitHub CLI y el nombre de la tarea; no contiene tokens ni contraseñas.

## A partir de ahí

- La tarea consulta Releases privados estables cada **5 minutos** y al iniciar sesión en Windows.
- Cada versión terminada que publiquemos se podrá instalar sin otra descarga manual ni pulsar Actualizar en Foundry.
- Si se detecta Foundry abierto, se pospone; si se abre durante la descarga o el respaldo, se vuelve a posponer. No se cierran procesos del usuario.
- Solo instala versiones superiores a la local. No instala commits de trabajo sin un Release terminado ni baja de versión por sí solo.
- Comprueba SHA-256, identificador, versión, archivos declarados y rutas del paquete antes de tocar el módulo instalado.
- Conserva un respaldo del módulo anterior y de `world.json` y las carpetas `data` de los mundos. No duplica las bibliotecas de imágenes o mapas de cada mundo.
- Al abrir Foundry después de una actualización, se cargará la versión nueva. No sustituye el código de una partida que ya está abierta.

La detección incluye la aplicación de escritorio con nombre Foundry y servidores Node identificados como Foundry o con `--dataPath`. Una instalación con un lanzador personalizado que oculte esos datos requiere adaptar la detección antes de confiar en la tarea. Las pruebas de Windows usan archivos ficticios y no equivalen a haber instalado la tarea ni iniciado sesión en el PC del autor.

## Activar o detener con doble clic

Descarga **Ecos-Autoactualizacion.bat** desde el Release privado y guárdalo donde quieras. Ábrelo con doble clic y elige Activar, Detener o Estado. Usa la configuración que ya instalaste; no solicita la ruta de Foundry ni una autenticación nueva. No necesita ejecutarse como administrador.

**Activar corrige también las ventanas de la versión 2.9.2**: cambia únicamente la tarea de Ecos de tu usuario para arrancar mediante `wscript.exe` en segundo plano. Si antes usaste `-Remove`, vuelve a crear la tarea con su configuración conservada. No es necesario reinstalar el módulo ni repetir el instalador para usar este BAT.

Detener deshabilita las comprobaciones futuras. Una actualización en curso termina; no se mata un proceso en mitad de un respaldo o de sustituir la carpeta. Al activar se hace una primera comprobación y se retoma el intervalo de cinco minutos y el inicio de sesión. Foundry abierto sigue posponiendo las instalaciones.

También admite comandos: `Ecos-Autoactualizacion.bat activar`, `Ecos-Autoactualizacion.bat detener` y `Ecos-Autoactualizacion.bat estado`. La consola del menú se abre solo cuando tú ejecutas el BAT; las comprobaciones periódicas usan el lanzador sin consola.

## Revisar, comprobar o desactivar

Archivos del ayudante y registro de actividad:

```text
%LOCALAPPDATA%\Ecos-Frontera-Actualizador\
```

Comprobar ahora:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "$env:LOCALAPPDATA\Ecos-Frontera-Actualizador\Ecos-Actualizar.ps1" -Check
```

Desactivar la tarea, conservando el módulo y todos sus respaldos:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "$env:LOCALAPPDATA\Ecos-Frontera-Actualizador\Ecos-Actualizar.ps1" -Remove
```

Los respaldos quedan dentro de la carpeta de datos de usuario, en `Backups\Ecos-Frontera`. No se borran automáticamente. Si una migración de un mundo requiriera volver atrás, cerrar Foundry y restaurar juntos el módulo anterior y los datos correspondientes del mundo; el ayudante no revierte mundos automáticamente.

## Para el desarrollo

Las versiones se siguen publicando como Releases privados con ZIP, manifiesto e instalador. El modo privado no anuncia `manifest`/`download` como enlaces de actualización nativa sin autenticación. Ningún paso cambia la visibilidad del repositorio.

Fuentes: [GitHub CLI en Windows](https://github.com/cli/cli/blob/trunk/docs/install_windows.md), [autenticación](https://cli.github.com/manual/gh_auth_login), [descarga de Releases](https://cli.github.com/manual/gh_release_download) y [tareas repetidas de Windows](https://learn.microsoft.com/en-us/windows/win32/taskschd/taskschedulerschema-repetition-triggerbasetype-element).
