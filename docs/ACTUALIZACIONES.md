# Instalación una vez y actualizaciones desde Foundry

Desde 2.9.1, los Releases incluyen el ZIP y `module.json`. El manifiesto usa una URL estable para consultar la última versión y una descarga fijada a su propio Release. Así una versión no instala el código inacabado de `main`.

URL preparada:

```text
https://github.com/iangonzalezgarciaa-blip/Modulo-Foundry-Ecos-de-la-Frontera/releases/latest/download/module.json
```

## Estado de acceso

El repositorio es privado. El acceso autorizado de ChatGPT y la sesión del navegador del autor no proporcionan autenticación al servidor de Foundry. Por tanto, la URL preparada **no es todavía una URL de instalación nativa utilizable sin credenciales**. No se debe pegar un enlace Raw temporal con token ni guardar tokens en el módulo.

Para usar la instalación estándar, el manifiesto y el ZIP necesitan alojamiento accesible para Foundry: por ejemplo, una distribución pública autorizada que contenga solo los archivos del módulo. Crear esa distribución o volver público el repositorio requiere decisión expresa del autor; esta versión no publica contenido fuera del repositorio privado.

## Cuando la distribución sea accesible

1. Respaldar el mundo y conservar la carpeta anterior del módulo.
2. Instalar el módulo desde Configuración → Módulos → Instalar módulo → URL de manifiesto, usando la URL final de distribución.
3. Para actualizaciones posteriores, salir del mundo y usar Actualizar/Actualizar todos desde la configuración de Foundry. Ya no se extraen ZIPs a mano.
4. Si el módulo ya recibió manualmente el paquete con los enlaces definitivos, la reinstalación inicial no es necesaria: Foundry puede consultar su manifiesto al buscar actualizaciones.

Foundry inicia la comprobación cuando el usuario pulsa Actualizar. La configuración nativa no instala cada commit ni actualiza una partida abierta en cuanto GitHub cambia. Si se quisiera actualización totalmente desatendida, haría falta un mecanismo externo distinto; el autor ha elegido la vía de manifiesto.

## Publicación del autor

Al completar una versión, sincronizar `module.json`, `package.json`, las notas y el ZIP. El flujo de Release valida y adjunta el ZIP y el manifiesto antes de publicarlo. Una versión publicada es inmutable: las correcciones se publican con otro número.

Referencias: [actualización de paquetes en Foundry](https://foundryvtt.com/article/package-management/) e [instalación y gestión de módulos](https://foundryvtt.com/article/modules/).
