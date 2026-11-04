/**
 * La capa del sistema (5.2c): un solo objeto, `sistema`, que responde con la implementación del sistema del mundo.
 * Se elige en cada llamada (game.system ya existe cuando se usa), y fuera de Foundry, en las pruebas, es la de dnd5e.
 */
import * as dnd5e from "./dnd5e.js";
import * as pf2e from "./pf2e.js";

export const IMPLEMENTACIONES = { dnd5e, pf2e };
export const elegir = (idSistema = globalThis.game?.system?.id) => IMPLEMENTACIONES[idSistema] ?? dnd5e;
export const sistema = new Proxy({}, { get: (_, clave) => elegir()[clave] });
