# Auditoría de curación y heridas (3.6, tarea 2.6a)

Qué hay, cómo se enlaza y qué faltaba. Fuentes: `scripts/main.js` (heridas de la casa, botón Curar, magia que cura), `scripts/verbe-medicina.js` (puente con las técnicas), `scripts/rest-core.js` (descansos) y el diario «Reglas de la casa», página «1 · Santuarios, descanso y heridas».

## Cómo funciona

| Pieza | Qué hace |
|---|---|
| Herida No Tratada (HNT, niveles 1–6) | Se gana al volver de 0 PG. Cada nivel se cierra con **3 días tratados** (un tratamiento con éxito por día). Si ese día hubo combate, viaje forzado o trabajo pesado, el día no avanza. Mientras haya HNT, el Agotamiento no baja. |
| Malherido | Tope de curación (los PG no suben del tope). Tratado: sube hasta el 75 %. Se va tras 3 Descansos Largos. |
| Botón «Curar» | Prueba de Medicina contra CD 10 + nivel de HNT, una vez por día y herido. A uno mismo, con desventaja. Kit de sanador obligatorio sin competencia. 1 natural: la herida se infecta. |
| Noche sin tratar | Salvación de Constitución: si falla, +1 Agotamiento. En Santuario, −2 a la CD. |
| Magia que cura heridas | Restauración menor, Sanar, Sanación en masa, Imposición de manos, Keoghtom y las técnicas de Pulso enlazadas: antes cerraban **un nivel de HNT al instante** y trataban Malherido. |
| Palma que cierra (Pulso) | Cuenta como el tratamiento mágico del día (CD automática) y trata Malherido. |
| Dotes de medicina | Médico del Verbe: +2 a Medicina y, según su texto, ventaja con el botón Curar. Médico de oficio: +1 dado a las curas de Pulso y −1 Verbe en Sacar el veneno y Restaurar. Cirujano del Verbe: cirugía en 10 minutos y 1 punto de Secuela por Descanso Largo (resolución de mesa). Disciplina de Pulso: +1 a Medicina. |

## Huecos encontrados

1. **La ventaja de «Médico del Verbe» no se aplicaba**: el texto la promete en el botón Curar, pero la tirada no la pedía. Corregido.
2. **El rango en Pulso no pesaba en Medicina.** Un Maestro de Pulso trataba igual que un novato con la misma Sabiduría. Ahora suma +1 por rango desde Experto (Experto +1, Maestro +2, Legendario +3, Mítico +4).
3. **Medicina valía poco frente a la magia:** un conjuro de nivel bajo borraba un nivel de HNT entero, el trabajo de tres días de un médico. Ahora una cura excelente (5 o más sobre la CD) cuenta dos días, y la magia cuenta como el tratamiento del día con dos días (ajuste «Heridas graves piden reposo»).
4. **Las heridas graves no pedían reposo con magia:** cerrar un nivel con magia ignoraba el combate o el viaje de ese día. Ahora la magia respeta la misma condición que el médico: si ese día hubo combate, viaje forzado o trabajo pesado, no avanza.
5. **Cirujano del Verbe** y la devolución de Secuela siguen siendo de mesa (sin botón propio). Pendiente si el autor lo quiere automatizar.
6. **Médico de oficio** se aplica en el coste y los dados de las técnicas de Pulso, pero no toca el tratamiento de heridas. Es lo que dice su texto: no es un hueco.

## Lo que cambia en 3.6 (tarea 2.6b)

- Botón Curar: el Verbe médico pesa (+rango de Pulso, ventaja de Médico del Verbe; a uno mismo, la ventaja anula la desventaja).
- Superar la CD por 5 o más: dos días de tratamiento.
- Magia curativa con el ajuste «Heridas graves piden reposo» (encendido por defecto): cuenta como el tratamiento del día y avanza dos días, sin borrar un nivel de golpe. Apagado vuelve a lo de antes.

Sin probar en Foundry real: probarlo con el caso «curacion36» del Diagnóstico.
