# MetroFly: cambios y verificación

Revisión de escritorio del 19 de septiembre de 2026. Se conservó React, TypeScript, Vite, MapLibre, Recharts y la arquitectura de plan determinista por semilla. No se añadió backend, cuarta ruta ni despliegue.

## Verificación ejecutada

- `npm run typecheck`: correcto.
- `npm test`: siete grupos correctos, cero fallos.
- `npm run build`: correcto; persiste la advertencia de tamaño del chunk de MapLibre (~1,04 MB minificado, ~283 kB gzip). Se carga de forma diferida.
- App servida localmente en `http://127.0.0.1:5174/`, respuesta HTTP 200.
- Navegador de escritorio a 1440 × 1000: mapa, reloj, mosca, log, emociones y Male CNS inspeccionados visualmente. No se trabajó ni se validó móvil.
- Sin errores de consola durante las corridas inspeccionadas.
- Sin espacios al final de línea ni marcadores de conflicto en `src/` y `tests/`.
- No hay repositorio Git en esta carpeta, por lo que no se puede emitir un `git diff --check`. No se hicieron commits.

## Corridas completas observadas en el navegador

| Ruta | Semilla | Llegada | Total | Espera | Transporte | A pie / conexiones |
| --- | ---: | --- | ---: | ---: | ---: | ---: |
| 5 de Mayo | 4242 | 19:21 | 141 min | 11 min | 115 min | 15 min |
| E665 | 4242 | 19:16 | 136 min | 42 min | 79 min | 15 min |
| Pirata, C978 + M en intercambio | 42 | 18:43 | 103 min | 23 min | 65 min | 15 min |
| Pirata, nueva simulación C978 + M | 90666 | 18:46 | 106 min | 18 min | 73 min | 15 min |

Estos son resultados sintéticos de semillas concretas, no duraciones reales observadas ni pronósticos.

En 5 de Mayo: salida 17:00, espera inicial desde 17:03 hasta 17:08, bus hasta 17:34, conexión al Metro hasta 17:39, Metro hasta 17:47, caminata hasta 17:51, espera de M675 hasta 17:57. El último bus duró 81 minutos, hasta las 19:18; acceso al campus hasta 19:21. El gran retraso quedó en el tramo correcto.

En Pirata: abordaje a las 17:15, 38 minutos en el primer bus, llegada a Cincuentenario a las 17:53. Cruce hasta 17:58, C978 a las 18:04, bajada en el intercambio a las 18:27, conexión y espera de M hasta 18:35; llegada a UTP a las 18:43.

## Controles comprobados

- Pausa: el reloj quedó fijo y la mosca y el grafo quedaron congelados. Cambiar de velocidad durante la pausa no avanzó el viaje.
- Lento, normal y rápido: selección visible y razón de reproducción actualizada a 2 s, 1 s y 0,5 s por minuto simulado.
- Reanudar: continúa desde el minuto conservado.
- Reiniciar: reloj a 17:00, log inicial, emociones iniciales y misma semilla.
- Replay completo de 5 de Mayo: repitió exactamente 19:21 / 141 minutos. Comparación siguió mostrando una única corrida de ese plan.
- Final: no navega automáticamente. El resultado queda junto a todos los instrumentos.
- Ver resumen y regresar: recuperó el simulador terminado, sin reiniciarlo.
- Nueva simulación desde Pirata: cambió la semilla 42 a 90666, volvió a 17:00 y permitió pausa inmediata. La variante se vuelve a resolver desde la definición canónica de la ruta, no desde los segmentos ya resueltos.
- Esa nueva corrida también se completó. La comparación mostró E665 4242, Pirata 42 y Pirata 90666, con tiempos y continuación correctos. Se regresó al último resultado y al simulador terminado.

## Cobertura automatizada

1. Mil semillas de 5 de Mayo: espera 0–7 con sesgo bajo, primer bus 20–30, conexión + Metro hasta 15, caminata corta, espera M675 hasta 10 y variabilidad concentrada en el último bus.
2. Repetición por semilla, espera cero y balance exacto de minutos.
3. Límites de las seis emociones y progresión narrativa del cuello de botella.
4. Mil semillas de Pirata y ausencia de duración observada atribuida a E665.
5. Tres continuaciones de Pirata alcanzables con 300 semillas consecutivas; segmentos, transferencias y geometrías diferentes.
6. Reducer de reproducción: pausa, velocidad, reinicio y estado final estable.
7. Anclas geográficas distintas, continuidad entre tramos e interpolación de principio a fin.

## Archivos de implementación modificados en las dos rondas

### Escenario, rutas y motor

- `src/data/routes.ts`: duraciones, nombres de líneas y secuencias.
- `src/data/continuations.ts` (nuevo): variantes M / C978 del recorrido Pirata.
- `src/data/geo.ts`: anclas y corredores editables, con extremos derivados de las anclas.
- `src/data/scenarios.ts`: contexto neutral y tres velocidades.
- `src/data/events.ts`: eventos y copy, incluida la continuación oportunista.
- `src/data/neural.ts`: posiciones y categorías del pequeño grafo demo.
- `src/simulation/engine.ts`: retrasos por segmento, esperas cero, variantes reproducibles y resultados.
- `src/simulation/mood.ts`: presión narrativa por tramo y evento.
- `src/simulation/random.ts`: normalización de semillas.
- `src/simulation/playback.ts` (nuevo): estado de reproducción separado del plan.
- `src/types/transit.ts`: rangos, ubicaciones, cuello de botella y continuación.
- `src/types/simulation.ts`: eventos y resultado con continuación.
- `src/utils/routeGeometry.ts` (nuevo): movimiento sobre la polilínea.

### Interfaz

- `src/App.tsx`: final sin navegación automática, nueva semilla, comparación sin duplicar replay.
- `src/components/SimulationScreen.tsx`: reproducción, etapas y resultado persistente.
- `src/components/PlaybackControls.tsx` (nuevo): pausa, reanudar, reinicio y velocidades.
- `src/components/CompletionSummary.tsx` (nuevo): llegada persistente y acciones explícitas.
- `src/components/MapPanel.tsx`: trazado del plan resuelto, marcador, resize y revisión del estado final.
- `src/components/FlyAvatar.tsx`: SVG original de la primera ronda; pausa y final en la segunda.
- `src/components/FlyPanel.tsx`: texto coherente con pausa, viaje y llegada.
- `src/components/NeuralPanel.tsx`: composición por categorías, ventana de eventos y disclaimer.
- `src/components/EventLog.tsx`: lectura y desplazamiento interno sin mover toda la página.
- `src/components/StatusPanel.tsx`: reloj y ubicación/tramo actual.
- `src/components/MoodBars.tsx` y `src/components/MoodHistory.tsx`: español, seis emociones y legibilidad.
- `src/components/Landing.tsx`: escenario neutral.
- `src/components/RouteSelection.tsx`: descripciones y conexiones de las tres rutas.
- `src/components/ResultScreen.tsx`: volver al simulador terminado y copy más sobrio.
- `src/components/ComparisonScreen.tsx`: traducción y etiqueta de continuación.
- `src/styles.css`: paleta azul y refinamientos de escritorio, controles y final.
- `index.html`: idioma, título y color de tema.

### Pruebas y documentación

- `package.json`: comando de pruebas, sin nuevas dependencias.
- `tests/run.mjs` y `tests/simulation.test.ts` (nuevos): ejecución y regresiones.
- `README.md`: parámetros, arquitectura conservada, fuentes geográficas y límites.
- `PRODUCT.md` (nuevo): restricciones del producto proporcionadas por el autor; se documentaron al aplicar las guías de refinamiento de interfaz.
- `VERIFICATION.md` (este archivo): evidencia y lista de cambios.

La compilación también regenera `dist/`. No se modificaron las observaciones de campo, que siguen vacías.

## Límites importantes

- Las capturas geográficas mencionadas no estaban en el adjunto recibido: se trabajó con la descripción escrita y cartografía abierta. No hay screenshots de Google Maps dentro de la app.
- Happy Copy CE-I, el intercambio, ciertos vértices y los cruces/accesos peatonales son aproximaciones editables, no instrucciones de navegación.
- El origen se corrigió al entorno Dream Plaza. Se distinguen la Zona Paga y el Metro 5 de Mayo, la estación Iglesia del Carmen y Crowne Plaza-R, y la parada de UTP y el acceso al campus.
- Los resultados se conservan durante la sesión, no después de recargar la página.
- La mosca se rediseñó desde cero en la primera ronda. En la segunda se conservó esa ilustración y se refinó su relación con los estados.
- Male CNS sigue siendo una visualización ilustrativa de once nodos: no es el conectoma completo y no representa emociones.
