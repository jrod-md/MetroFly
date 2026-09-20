# MetroFly

> **The emotional model is narrative and is not a neuroscientific inference.**

MetroFly is a small, complete web simulation about one specific Panama City commute: leave work in Costa del Este at 17:00 and reach the Universidad Tecnológica de Panamá before the 18:00 class. The visual protagonist is a male *Drosophila melanogaster* with roughly 166,000 neurons and no special authority over rush-hour traffic.

The user chooses a transport strategy once. The trip runs through a pauseable, three-speed clock, a moving map marker, timed segments, commute events, a dry narrative mood layer, and a separate connectome-inspired neural activity display.

## The three routes

1. **5 de Mayo** — Costa del Este bus (S447, S487, S662, or S669), 5 de Mayo, Metro to Iglesia del Carmen, walk, then Metrobus toward UTP. A real trip using this strategy took approximately two hours.
2. **E665** — E665 to Cincuentenario, cross/connect, then Metrobus to UTP. The route is known to exist but has never been personally observed by the project author; its wait and reliability are deliberately treated as unknown assumptions.
3. **Pirata / Diablo Rojo** — informal bus to Cincuentenario, cross/connect, then Metrobus to UTP. The initial real-world reference is approximately ninety minutes.

## Recalibración del recorrido / septiembre de 2026

El escenario público es: «Trabajo en Costa del Este, salgo a las 17:00 y debo llegar a la UTP antes de las 18:00». La interfaz usa español con humor seco puntual en inglés. La revisión visual se concentra en escritorio: azul marino, azul profundo y cian, con ámbar para el retraso. No se ha validado ni rediseñado la vista móvil en esta revisión.

La ruta 5 de Mayo ahora concentra el cuello de botella en Ricardo J. Alfaro:

| Etapa | Duración configurada |
| --- | --- |
| Salida del trabajo a la parada | 2–4 min |
| Espera S447 / S487 / S662 / S669 | 0–7 min, sesgo hacia valores bajos |
| Bus a 5 de Mayo | 20–30 min |
| Bajar al Metro + Metro a Iglesia del Carmen | 2–6 min de conexión + 8–9 min de Metro; 10–15 min en total |
| Caminata a Crowne Plaza-R | 3–5 min |
| Espera del M675 | 2–10 min |
| M675 a Universidad Tecnológica-R | 42–78 min base; 90 % de probabilidad de sumar 5–15 min de tranque |
| Parada → acceso UTP | 2–4 min |

Estos rangos y probabilidades son parámetros narrativos informados por el relato del autor. La experiencia de dos horas es una referencia, no un resultado fijo ni una media medida. Pirata conserva la referencia de 90 minutos y usa una zona aproximada de abordaje informal, sin representar una parada oficial. E665 conserva duración observada desconocida.

`durationRange`, cuando existe, prevalece sobre `baseMinutes` y `variabilityMinutes`. Solo se añaden retrasos explícitos en `segment.delay`; se eliminaron las penalizaciones globales. La espera inicial puede ser cero. Una espera que empieza no provoca el mismo cambio de ánimo que una espera prolongada. El modelo mantiene decimales internamente y redondea solo para mostrar resultados. `bottleneck` aumenta progresivamente la tensión narrativa del tramo final.

Se cuentan dos cambios de transporte en 5 de Mayo (bus → Metro → bus) y uno en E665. Pirata tiene uno o dos, según la continuación. Los minutos de conexión se agrupan con «A pie / conexiones» para que espera + transporte + a pie coincidan con el total.

La mosca se redibujó desde cero en SVG original: vista dorsal, seis patas articuladas, alas con nervaduras, ojos facetados, halterios y abdomen segmentado. Conserva seis estados: idle, waiting, moving, alarmed, defeated y relieved. No utiliza imágenes externas.

`npm test` verifica 1.000 seeds de 5 de Mayo, 1.000 de Pirata, los límites temporales, el cuello de botella final, la repetibilidad, las transiciones de espera cero, el balance de minutos y la progresión narrativa. Son comprobaciones del simulador, no observaciones de tránsito.


## Segunda ronda: reproducción, geografía y continuaciones

### Controles y final

- **Lento:** 2.000 ms por minuto simulado. **Normal:** 1.000 ms. **Rápido:** 500 ms.
- Pausar cancela el temporizador. Cambiar de velocidad no cambia la semilla, el plan ni el minuto actual. Se programa el próximo minuto completo al reanudar o cambiar de velocidad.
- Reiniciar / reproducir de nuevo vuelve al minuto cero del **mismo plan**, conserva la velocidad y limpia los instrumentos derivados del tiempo.
- Nueva simulación genera una **semilla distinta** y vuelve a resolver la continuación de Pirata.
- Llegar a UTP no cambia de pantalla: aparece un resultado persistente encima de los instrumentos. El mapa queda completo, la mosca se detiene, y registro y gráficas siguen disponibles.
- Ver resumen y comparar son acciones explícitas. Desde el resumen se puede regresar al simulador terminado. Reproducir el mismo plan no duplica el registro de comparación.
- Esta persistencia es visual y de sesión: recargar la página todavía borra las corridas, como en la arquitectura original.

### Pirata y C978

El primer bus dura 35–45 minutos (aproximadamente 40). La salida a pie y la espera informal se suman: llegar a Cincuentenario cerca de las 18:00 es posible. Después del cruce por el Metro se resuelve una de tres continuaciones por semilla:

1. Bus M hacia Universidad Tecnológica-R y acceso a UTP.
2. C978 hasta el intercambio de Ricardo J. Alfaro; conexión, nueva espera y bus M hasta UTP.
3. C978 hasta Torres de Milan-I, junto al Va y Ven; cruce por puente elevado y caminata al campus.

Las ponderaciones 50/25/25 de `src/data/continuations.ts` son **decisiones del escenario, no frecuencias observadas**. Cada opción genera segmentos, tiempos, eventos y geometría propios. La referencia personal continúa siendo ~90 minutos; no se fuerza cada resultado a ese valor. El evento de continuación produce una variación moderada de confusión y ansiedad narrativas.

### Geografía editable y límites

`src/data/geo.ts` tiene tres niveles: **LOCATIONS** (anclas), **CORRIDORS** (vértices intermedios con comentarios de calles/paradas) y **SEGMENT_VIA** (asociación al identificador de cada tramo). Los extremos se toman automáticamente de las anclas. `getSegmentGeometry` resuelve también las dos alternativas C978; `getRouteGeometry` dibuja el plan realmente seleccionado. El marcador recorre la polilínea y no salta en línea recta entre terminales.

Se distinguen Zona Paga Puerta 02 y Metro 5 de Mayo; Iglesia del Carmen y Crowne Plaza-R; Cincuentenario y su conexión; Universidad Tecnológica-R y el acceso al campus. El punto UTP es una aproximación del acceso hacia Secretaría General, **no una localización topográfica certificada del edificio**.

Referencias utilizadas:

- [OpenStreetMap](https://www.openstreetmap.org/copyright): Dream Plaza (way 1274346442), Zona Paga puerta 02 (node 13120449184), Metro Iglesia del Carmen (node 3050596999), Crowne Plaza (node 3578419889), Universidad Tecnológica-R (node 5864000054), Torres de Milan-I (node 12773146841) y paradas del corredor M675. Datos consultados mediante Overpass.
- [Metro de Panamá, estaciones georreferenciadas L2](https://www.datosabiertos.gob.pa/dataset/fd03d036-94bb-4353-970e-9467e05073c3/resource/f4fc54a6-1ce0-452e-8481-83b9a2a25165/download/estaciones_georeferencia-l2.pdf): Cincuentenario.
- [OSRM, servicio de rutas sobre OpenStreetMap](https://project-osrm.org/docs/v5.24.0/api/#route-service): contraste de la geometría vial. **No se importaron duraciones de carro.**
- Secuencias de calles y paradas aportadas por el autor. El adjunto de esta ronda contenía texto, no las capturas mencionadas. No se incrustan ni redistribuyen capturas de Google Maps.

Happy Copy CE-I, el intercambio, algunos vértices de Roosevelt, las entradas del Metro y los cruces peatonales siguen siendo aproximados. Los trazados no verifican sentidos de circulación, operación autorizada de cada línea ni seguridad/acceso peatonal. No son instrucciones de navegación. Las referencias de 9,1 km / 5,2 km no se usan como distancias verificadas ni para calcular tiempos.

### Mosca y Male CNS

Se conserva la nueva ilustración SVG original de la primera ronda; **en esta segunda ronda no se rediseñó desde cero**. La pausa congela sus animaciones y ajusta el texto. El final muestra una pose detenida y no dice que el viaje continúa.

Male CNS conserva once nodos y catorce conexiones sintéticas como fallback explícito. La nueva fase de integración está documentada abajo: la actividad ahora se propaga por conexiones dirigidas, la pausa conserva el minuto y el final conserva la última actividad. No consume el modelo de emociones ni afirma mediciones biológicas.

### Pruebas

`npm test` incluye siete grupos: calibración 5 de Mayo, repetibilidad y balance temporal, emociones narrativas, Pirata/E665, tres variantes Pirata, reproducción y continuidad geográfica. Se muestrean 1.000 semillas de 5 de Mayo y 1.000 de Pirata, además de 300 semillas consecutivas para las continuaciones. La prueba de geografía comprueba anclas, continuidad y límites numéricos; no sustituye una revisión GIS.

Último muestreo del modelo: 5 de Mayo media 125,17 min (93–159), espera inicial media 2,31 min, M675 final media 69,29 min. Pirata media 98,40 min. **Son salidas sintéticas del simulador, no datos de tránsito medidos.**

## Observations and assumptions

The project keeps these categories separate:

- The approximate two-hour 5 de Mayo trip and ninety-minute Pirata trip are limited personal observations supplied in the brief.
- The existence—but lack of personal sighting—of E665 is a narrative fact supplied in the brief. Its actual wait time is not claimed to be known.
- Segment durations, variability, event probability, delay size, mood rules, map polylines, and coordinates are configurable MVP assumptions. They are not a transit forecast or GIS-grade route model.
- The application does not fabricate field observations. `src/data/observations.ts` intentionally exports an empty collection.

## Fly Mood Model

Hope, Anxiety, Confusion, Regret, Relief, and Resignation are a storytelling system. Straightforward rules react to waiting, traffic, successful arrivals, missed transfers, and the 18:00 deadline. They create a readable dramatic arc and a chart; they do not claim to measure or infer a fly's real emotional state.

**The emotional model is narrative and is not a neuroscientific inference.**

## Male CNS Activity

El panel carga un JSON estático verificado de `male-cns:v1.0` si existe; si falta o es inválido, muestra **DEMO GRAPH** y explica por qué. **Esta entrega no incluye una extracción real: falta `NEUPRINT_TOKEN`; hay 0 neuronas y 0 conexiones reales exportadas.** El fallback mantiene 11 nodos y 14 conexiones sintéticas.

El extractor de desarrollo utiliza `neuprint-python`, descubre el esquema, selecciona caminos dirigidos pequeños y verifica cada identidad, conexión y peso antes de escribir el JSON. El frontend nunca recibe credenciales. La UI distingue conectividad de actividad simplificada y permite inspeccionar nodos, anotaciones y pesos. Fly Mood sigue siendo independiente.

Fuente prevista: **MaleCNS v1.0, HHMI Janelia FlyEM Project, CC-BY-4.0**. Consulta [metodología, fuentes oficiales, regeneración y limitaciones](MALECNS.md). El recorrido R1–R6 hacia DNg13 es la referencia por investigar, no una extracción que ya hayamos verificado.

## Run locally

Requirements: Node.js 20.19+ or 22.12+ and npm.

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:5173`. The map uses OpenStreetMap raster tiles and therefore needs a network connection to display its basemap; the simulation itself is entirely local.

Production verification:

```bash
npm test
npm run typecheck
npm run build
npm run preview
```

## Architecture

```text
src/
├── components/       Screens and focused visual instruments
├── data/             Routes, scenario settings, events, geography, neural demo, observations
├── simulation/       Seeded RNG, plan generation, state derivation, narrative mood rules
├── types/            Transit, simulation, and neural contracts
├── utils/            Clock and duration formatting
├── App.tsx            Small screen-state coordinator and session results
└── styles.css         Responsive lab-instrument visual system
```

The simulation creates a complete deterministic plan from the selected route and optional seed. UI state is then derived from the elapsed simulated minute. Run results remain only in React memory for the current browser session; there is no backend or persistence.

Key editing points:

- `src/data/routes.ts`: segment base duration, variability, route descriptions, evidence notes.
- `src/data/scenarios.ts`: departure, deadline, and real-time playback rate.
- `src/data/events.ts`: event language and bounded delay ranges.
- `src/simulation/mood.ts`: narrative mood rules.
- `src/data/geo.ts`: approximate points and polylines.
- `src/data/observations.ts`: future real observations using the documented schema.
- `src/data/neural.ts`: replaceable demo graph.

## Static deployment

`npm run build` creates a static `dist/` directory. It can be deployed to any static host. There are no runtime secrets, API keys, databases, or server functions.

## Roadmap for v0.2

- Add real, timestamped observations to `observations.ts` and show sample size beside every route estimate.
- Calibrate wait and segment distributions without erasing the distinction between observation and assumption.
- Continue reviewing the named road anchors and pedestrian paths with the author.
- Run the authenticated MaleCNS extraction, review actual endpoint annotations and circuit selection, and validate the real JSON in the UI. The pipeline and explicit fallback are implemented; live extraction remains pending credentials.
- Persist completed simulations locally and export a run as JSON/CSV.
- Extend the existing simulation regression tests as real observations inform future calibration.

## Scientific and practical limits

MetroFly is a narrative simulator, not a travel-time service, biological model, or transport recommendation engine. It does not use live transit data. It does not predict bus arrivals. Its mood model is fictional, and its neural activity panel is a visual abstraction.
