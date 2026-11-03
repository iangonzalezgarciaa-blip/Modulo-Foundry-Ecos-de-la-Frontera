# Actualizaciones con el actualizador de Foundry

Desde la versión 3.9.1, el repositorio y sus Releases son públicos (decisión del autor del 3-nov-2026). Foundry instala y actualiza el módulo con su propio actualizador. No hace falta GitHub CLI, ni tareas de Windows, ni descargar ZIPs.

## Instalar (o pasar desde una versión anterior)

1. Cierra el mundo y vuelve a la pantalla de inicio de Foundry.
2. Ve a **Módulos → Instalar módulo**.
3. Pega este manifiesto abajo, en «URL del manifiesto», y pulsa **Instalar**:

```text
https://github.com/iangonzalezgarciaa-blip/Modulo-Foundry-Ecos-de-la-Frontera/releases/latest/download/module.json
```

Si ya tenías el módulo instalado con el actualizador anterior y Foundry dice que ya está instalado:

1. Desinstálalo desde Módulos.
2. Vuelve a instalarlo con el manifiesto.

Las fichas, los diarios y los ajustes no se pierden: el módulo no trae compendios y todo eso vive en el mundo. Hay una alternativa: copia el `module.json` del último Release encima del instalado y luego usa «Buscar actualizaciones».

## A partir de ahí

- En la pantalla de inicio, **Módulos → Buscar actualizaciones** muestra si hay una versión nueva. Para instalarla, pulsa «Actualizar» en Ecos o «Actualizar todo».
- El manifiesto apunta siempre al último Release terminado. Cada versión trae su ZIP propio y no se sobrescribe.
- Foundry no actualiza un módulo mientras el mundo está abierto. Actualiza desde la pantalla de inicio y luego abre el mundo.
- Antes de una versión grande, conviene un respaldo del mundo con la herramienta de respaldos que trae Foundry en la pantalla de inicio.

## Retirar el actualizador de Windows (versiones 2.9.2 a 3.9.0)

El actualizador anterior (`Ecos-Actualizar.ps1` con su tarea de Windows) ya no hace falta. Los Releases ya no lo traen. Para detenerlo:

1. Abre **Ecos-Autoactualizacion.bat**, el que descargaste antes, con doble clic.
2. Elige **2. Detener**.

Si prefieres quitar la tarea del todo, en PowerShell:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "$env:LOCALAPPDATA\Ecos-Frontera-Actualizador\Ecos-Actualizar.ps1" -Remove
```

Ninguna de las dos opciones toca el módulo ni sus respaldos. Los respaldos quedan en `%LOCALAPPDATA%\FoundryVTT\Backups\Ecos-Frontera`; puedes borrarlos cuando quieras.

Si se queda activo no rompe nada: solo instala versiones más nuevas que la instalada. Pero así habría dos actualizadores para lo mismo.

## Para el desarrollo

- `package.json` declara `ecosUpdateMode: public`.
- `module.json` lleva `manifest` (la dirección estable del último Release) y `download` (el ZIP de su versión).
- El flujo de publicación rechaza un manifiesto cuya descarga no apunte al ZIP de esa versión.
- El código del actualizador de Windows sigue en `tools/windows/` con sus pruebas, por si se vuelve al modo privado. Volver al modo privado exige una orden del autor.
