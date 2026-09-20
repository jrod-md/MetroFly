# MetroFly

MetroFly es un experimento web que convierte mi recorrido de Costa del Este a la Universidad Tecnológica de Panamá en una simulación.

La premisa es simple: salgo del trabajo a las 17:00 y la clase empieza a las 18:00. En lugar de simularme a mí, puse a MF-01, una mosca, a hacer el viaje.

El usuario elige una ruta y la simulación determina qué ocurre durante el trayecto: esperas, tráfico, conexiones, retrasos y llegada.

Parte del cerebro de MF-01 se representa utilizando morfología y conectividad neuronal reales del dataset MaleCNS de HHMI Janelia.

**Demo:** https://metrofly.pages.dev

## Cómo funciona

MetroFly tiene tres recorridos inspirados en opciones reales de transporte entre Costa del Este y la UTP:

- 5 de Mayo
- E665
- Pirata / Diablo Rojo

Cada ejecución utiliza una semilla determinista. La misma ruta con la misma semilla produce el mismo viaje, lo que permite repetir y comparar simulaciones.

Durante el recorrido se muestran el progreso sobre el mapa, eventos del viaje, tiempo restante hasta las 18:00 y un estado narrativo compuesto por esperanza, sufrimiento y arrepentimiento.

Estos valores forman parte de la simulación y no representan mediciones biológicas.

## MaleCNS

La capa científica utiliza datos de **MaleCNS v1.0**, publicado por **HHMI Janelia FlyEM**.

El subconjunto utilizado por MetroFly contiene:

- 95 neuronas
- 253 conexiones dirigidas
- 95 centerline skeletons
- 384,842 puntos originales de morfología
- 71,301 puntos simplificados para render

Las morfologías se renderizan directamente en Canvas 2D y pueden inspeccionarse individualmente al finalizar una simulación.

La separación entre datos reales y simulación es intencional:

```text
Morfología real.
Conectividad real.
Actividad simulada.
```

MetroFly no intenta reproducir cómo una mosca real experimentaría el transporte público de Panamá. La identidad neuronal, la morfología y la conectividad provienen de MaleCNS; la actividad, los eventos del viaje y el estado narrativo son generados por MetroFly.

Más detalles sobre los datos y su procesamiento están documentados en [`MALECNS.md`](./MALECNS.md).

## Stack

```text
React
TypeScript
Vite
MapLibre GL JS
OpenStreetMap
Canvas 2D
GitHub Actions
Cloudflare Pages
```

No hay backend ni base de datos. La aplicación funciona completamente en el cliente y utiliza datos científicos generados previamente y versionados con el proyecto.

## Arquitectura

```text
src/
├── components/        UI, mapa, simulación y visualización neuronal
├── data/              rutas, eventos y datos generados
├── neural/            grafo, actividad y lógica de visualización
├── simulation/        motor determinista del viaje
└── i18n.tsx           localización ES / EN

scripts/
├── extracción de datos MaleCNS
└── generación de skeletons

tests/
└── simulación, reproducción, MaleCNS, geometría e i18n
```

Los scripts científicos se utilizan únicamente para regenerar los datasets. El deployment no requiere Python, NeuPrint ni credenciales externas.

## Desarrollo local

Requiere Node.js `>=22.12.0`.

```bash
git clone <repo-url>
cd MetroFly
npm ci
npm run dev
```

Build de producción:

```bash
npm run build
```

El resultado se genera en:

```text
dist/
```

## Validación

Antes de cada deployment ejecuto:

```bash
npm run typecheck
npm test
npm run build
git diff --check
```

Actualmente la suite contiene **19 pruebas** que cubren, entre otras cosas, determinismo por semilla, rutas, eventos, reproducción, geometría, datos MaleCNS e internacionalización.

GitHub Actions ejecuta automáticamente estas validaciones en `push` y `pull_request`.

## Idiomas

La interfaz está disponible en español e inglés.

Español es el idioma inicial y la selección se conserva localmente en el navegador.

```text
ES | EN
```

Los identificadores científicos, códigos de transporte y nombres propios se mantienen sin traducir.

## Deployment

MetroFly está desplegado como sitio estático en Cloudflare Pages.

```text
Build command: npm run build
Output: dist
```

Producción no requiere variables de entorno.

`NEUPRINT_TOKEN` se utiliza únicamente de forma local para regenerar datos científicos y nunca forma parte del frontend ni del build de producción.

## Nota sobre el mapa

Las rutas se muestran sobre MapLibre y OpenStreetMap como una representación aproximada del recorrido utilizado por la simulación.

No es una aplicación de navegación ni una fuente oficial de rutas de transporte público.

## Estado

MetroFly nació como un experimento pequeño sobre algo bastante cotidiano: intentar salir de Costa del Este a las 17:00 y llegar a una clase en la UTP a las 18:00.

La parte interesante es poner a una mosca a hacerlo.

La parte innecesariamente seria es usar un conectoma real para acompañarla.
