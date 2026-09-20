# MetroFly / The 6 PM Class

Puse una mosca a hacer mi viaje de Costa del Este a la UTP. Sale del trabajo a las
17:00. La clase empieza a las 18:00. Tú eliges la ruta; Panamá decide el resto.

MetroFly es una simulación narrativa de transporte público, no una predicción de
tránsito ni un modelo de conducta animal. MF-01, una *Drosophila melanogaster*, es
el protagonista. El humor está en el viaje, no en acumular instrumentos científicos.

## Ejecutar

Node.js 20.19+ o 22.12+ y npm:

```sh
npm install
npm run dev
```

Usa la dirección local que muestra Vite. El mapa MapLibre usa teselas de
OpenStreetMap y necesita conexión; los planes, el reloj y los datos MaleCNS son
locales. No hay backend, cuenta, base de datos, telemetría ni llamadas a neuPrint
desde el navegador. Las corridas se guardan solo en memoria durante la sesión.

## La experiencia

1. Elige 5 de Mayo, E665 o Pirata / Diablo Rojo. Una semilla permite repetir el viaje.
2. Observa el mapa, el reloj y la mosca. La pantalla principal cabe en un viewport
   de escritorio (objetivos: 1366×768, 1600×900 y 1920×1080).
3. Pausa, reanuda o cambia el ritmo: lento = 2 s/min, normal = 1 s/min, rápido = 0,5 s/min.
   Reiniciar reproduce el mismo plan y conserva la velocidad.
4. Un evento actual cuenta la historia. El registro completo se abre a petición y
   tiene scroll interno; no empuja el mapa ni alarga la página.
5. Al llegar, el mapa y MF-01 se detienen. El final muestra llegada/retraso y cuatro
   cifras: total, espera, transporte y caminatas/conexiones. Se puede revisar el
   resultado, probar otra semilla, elegir otra ruta o comparar corridas.

El ánimo visible se limita a esperanza, sufrimiento y arrepentimiento. Los seis
estados internos del modelo narrativo anterior se conservan para compatibilidad
y comparación; no se muestran series temporales ni seis gráficas. **El ánimo es
ficción narrativa, no una inferencia neurocientífica.**

## Tres rutas, mismos parámetros

### 5 de Mayo

Costa del Este → S447 / S487 / S662 / S669 → Zona Paga 5 de Mayo → Metro →
Iglesia del Carmen → Crowne Plaza-R → M675 / Ricardo J. Alfaro → UTP.

| Tramo | Rango configurado |
| --- | --- |
| Salida hacia la parada | 2–4 min |
| Primera espera | 0–7 min, sesgo hacia valores bajos |
| Primer bus | 20–30 min |
| Conexión + Metro | 10–15 min en total |
| Caminata a Crowne Plaza-R | 3–5 min |
| Espera M675 | 2–10 min |
| M675 hacia UTP | 42–78 min base; 90 % de probabilidad de sumar 5–15 min |
| Acceso al campus | 2–4 min |

El gran cuello de botella es el bus final, no la espera inicial. La referencia
personal de aproximadamente dos horas no es una media medida ni un resultado fijo.

### E665

Costa del Este → E665 → Cincuentenario → cruce/conexión → Ricardo J. Alfaro → UTP.
“Allegedly real. Personally observed: never. Confidence: questionable.” Sus tiempos
son supuestos; no existe una duración observada que MetroFly pueda afirmar.

### Pirata / Diablo Rojo

Abordaje informal en Costa del Este → unos 40 minutos de bus a Cincuentenario →
cruce → continuación hacia UTP. La semilla elige entre bus M, C978 con transferencia
anterior o C978 a Torres de Milan-I con puente/caminata al campus. No hay un árbol
de decisiones adicional en la UI. Las ponderaciones 50/25/25 son supuestos del
escenario, no frecuencias observadas. La referencia personal total es ~90 minutos.

La simulación mantiene esperas cero, balance temporal, variabilidad y eventos
deterministas. Ninguna ruta usa tiempos de carro para simular buses. No hay Uber.

## Mapa y mosca

Se conservan las anclas y corredores de `src/data/geo.ts`, incluidos los tramos
Metro, Crowne Plaza-R y las alternativas C978. El marcador recorre la polilínea.
El origen está en tierra, en la zona de trabajo de Costa del Este. Las paradas,
cruces y el acceso a UTP son aproximaciones editables, no navegación certificada.

Referencias geográficas del trabajo previo: [OpenStreetMap](https://www.openstreetmap.org/copyright),
[estaciones de Línea 2 del Metro](https://www.datosabiertos.gob.pa/dataset/fd03d036-94bb-4353-970e-9467e05073c3/resource/f4fc54a6-1ce0-452e-8481-83b9a2a25165/download/estaciones_georeferencia-l2.pdf)
y [OSRM](https://project-osrm.org/docs/v5.24.0/api/#route-service) para contrastar geometría vial,
sin importar duraciones de automóvil. Este reset no repite una revisión GIS.

La mosca reutiliza la ilustración SVG original existente (alas con nervaduras,
seis patas, ojos facetados y abdomen segmentado). No fue redibujada en este reset.
Conserva idle, waiting, moving, alarmed, defeated y relieved; pausa y final detienen
sus animaciones. Respeta movimiento reducido y no depende de imágenes externas.

## MaleCNS: morfología real, actividad simulada

El grafo real conservado contiene **95 neuronas y 253 conexiones dirigidas de
`male-cns:v1.0`**. Esta entrega añade `malecns_skeletons.json`: **95/95
centerline skeletons oficiales**, con 384,842 puntos fuente y 71,301 puntos de
render. Las líneas del widget y del informe opcional son morfología real; no son
un diagrama de conexiones.

La extracción se hace solo durante desarrollo con `neuprint-python` y el cliente
oficial de neuPrint (`Client.fetch_skeleton(..., format='pandas')`). El navegador
carga un JSON estático, sin token ni llamadas a neuPrint. Una simplificación RDP
por cadenas no ramificadas conserva raíces, bifurcaciones y hojas; después se
aplica una única caja y escala global a toda la población, por lo que se mantienen
las relaciones espaciales entre neuronas.

`FlyBrainSkeleton` usa Canvas 2D y una proyección ortográfica con ajuste automático
al rectángulo. El informe puede rotar lentamente la cámara; el widget compacto,
la pausa y `prefers-reduced-motion: reduce` la dejan inmóvil. Naranja = entrada
visual, crema = intermediarias y cian = salida descendente/motora. La actividad
existente de MetroFly ajusta opacidad, grosor y un brillo discreto: no es una
grabación de un cerebro real y no determina el ánimo ficticio.

Fuente: HHMI Janelia FlyEM, CC-BY-4.0. [Metodología y límites](MALECNS.md).
Si el asset de morfología no carga, la simulación continúa e informa el fallback;
no se fabrican esqueletos. La conectividad permanece sin alteración.

## Arquitectura

React, TypeScript, Vite y MapLibre siguen siendo la arquitectura. El motor, las
rutas, las continuaciones y la geografía no se reescribieron. No hay Three.js,
WebGL, backend, cuenta, base de datos ni dashboard neuronal: el informe científico
aparece solamente después del resultado.

La UI usa grafito, texto marfil, cian moderado, coral para retraso y ámbar para MF-01.
Sans-serif para lectura; mono para reloj, semilla e identificadores. No se ha
diseñado ni validado móvil. La vista principal presupone un escritorio ≥1100 px.

## Comprobaciones

```sh
npm run typecheck
npm test
npm run build
```

Las 16 pruebas cubren 1.000 semillas de 5 de Mayo y 1.000 de Pirata, continuaciones,
repetibilidad, balance temporal, reproducción, geografía, fallback y propagación
neural. Incluyen una comprobación del artefacto 95/253 en las tres rutas, validación
del asset de skeletons, rechazo de parents inválidos, color semántico y reducción
de movimiento. Las 6 pruebas Python validan extracción/conectividad y simplificación
de skeletons.
No equivalen a datos de tránsito ni a validación biológica.

Verificación manual del reset (20 de septiembre de 2026): las tres rutas se
completaron en el navegador con semilla 42. Resultados sintéticos:

| Ruta | Llegada | Total | Espera | Transporte | A pie / conexiones |
| --- | --- | --- | --- | --- | --- |
| 5 de Mayo | 18:55 | 115 min | 6 min | 95 min | 14 min |
| E665 | 19:16 | 136 min | 49 min | 67 min | 20 min |
| Pirata (C978 + intercambio + M) | 18:43 | 103 min | 23 min | 65 min | 15 min |

Se comprobaron mapas con teselas, avance del marcador, reloj, pausa y animaciones
congeladas, reanudación, selección de velocidad, reinicio a 17:00 con la misma
semilla, intento nuevo con otra semilla, registro, resultado y comparación.
Las capturas y medidas DOM confirmaron `scrollWidth/scrollHeight` iguales al
viewport en 1366×768, 1600×900 y 1920×1080, sin scroll de página en la simulación.
No se observaron errores de consola en las pestañas probadas. No es una auditoría
de accesibilidad ni una prueba de todos los navegadores.

MapLibre se carga aparte. Vite puede advertir que su chunk supera 500 kB; no es
un error de compilación. `npm run build` produce la aplicación estática en `dist/`.

Puntos de edición: `src/components/SimulationScreen.tsx` (escena), `src/styles.css`
(sistema visual), `src/data/routes.ts` (tiempos), `src/data/continuations.ts`
(Pirata), `src/data/geo.ts` (geografía), `src/data/events.ts` (narrativa) y
`src/neural/activity.ts` (visualización ilustrativa). No añadir instrumentos para
explicar algo que el viaje y la mosca ya cuentan.
