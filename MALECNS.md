# MaleCNS: conectividad real, actividad simplificada

## Estado de esta entrega

Se conserva el artefacto del commit `b859058`: **95 neuronas y 253 conexiones dirigidas de `male-cns:v1.0`**, en `src/data/generated/malecns_visual_motor.json`. Sus metadatos registran verificación de identidades, aristas y pesos por el extractor. El reset no altera el JSON ni repite consultas autenticadas a neuPrint.

La UI muestra solo `FlyBrain`: un punto por neurona y el conteo con actividad simulada ≥0,1. El orden de los puntos es un listado, no anatomía ni topología. No hay inspector, timeline ni escena 3D. Un archivo ausente o inválido activa el fallback explícito de 11 nodos y 14 conexiones sintéticas. Las pruebas offline validan estructura y ejecución, no vuelven a certificar la existencia de neuronas en Janelia.

## Fuentes y selección del circuito

- [HHMI Janelia: Male CNS](https://www.janelia.org/node/70079) presenta un recorrido visual desde R1–R6 hacia DNg13. Esto es una referencia para investigar, no prueba de que esas cadenas sean etiquetas exactas del esquema.
- [Descargas oficiales MaleCNS](https://male-cns.janelia.org/download/) documentan `neuprint-python`, el servidor `https://neuprint.janelia.org` y el dataset `male-cns:v1.0`.
- [Licencia CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Atribución: MaleCNS v1.0, HHMI Janelia FlyEM Project. MetroFly selecciona y transforma una parte del grafo y añade actividad ilustrativa; no implica respaldo de Janelia.
- [API oficial de neuprint-python](https://connectome-neuprint.github.io/neuprint-python/docs/client.html). Se fija `neuprint-python==0.6.3` en las dependencias de desarrollo del extractor.

No se asume que DNg13 sea el nombre exacto del tipo consultable ni que todos los nodos intermedios tengan una clase disponible. `--inspect` consulta `fetch_neuron_keys()` y busca anotaciones candidatas con R1–R6/DNg13 en `type` e `instance`. Esa búsqueda devuelve pistas, no una clasificación científica. Seleccionar los extremos requiere revisar las anotaciones reales en neuPrint. Se aceptan etiquetas exactas o body IDs explícitos; no hay extremos predeterminados inventados.

## Regenerar, solo durante desarrollo

Desde la raíz del proyecto, con Python instalado:

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r scripts/requirements-malecns.txt
```

Configura `NEUPRINT_TOKEN` únicamente en el entorno del proceso local. No lo pegues en el chat, código, comandos guardados ni variables `VITE_*`. Ejemplo PowerShell con entrada oculta y sin persistir el secreto:

```powershell
$neuralSecret = Read-Host 'neuPrint token' -AsSecureString
$neuralPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($neuralSecret)
try {
  $env:NEUPRINT_TOKEN = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($neuralPointer)
} finally {
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($neuralPointer)
}
.\.venv\Scripts\python.exe scripts/extract_malecns.py --inspect
```

El archivo `.env.example` documenta la variable; el script **no carga `.env` automáticamente**. `.env`, `.env.*`, `.venv` y cachés de Python están ignorados. React no accede al token ni consulta neuPrint.

Después de inspeccionar el esquema, reemplaza los marcadores siguientes por etiquetas exactas verificadas (no son nombres de neuronas):

```powershell
.\.venv\Scripts\python.exe scripts/extract_malecns.py --source-type "TIPO_VISUAL_VERIFICADO" --target-type "TIPO_DESCENDENTE_VERIFICADO"
```

Repite `--source-type` para los tipos visuales seleccionados. Alternativamente, usa `--source-id` y `--target-id` repetidos con IDs reales. El extractor comprueba que cada criterio solicitado exista, pero no puede determinar si la elección humana tiene sentido científico.

```powershell
Remove-Item Env:NEUPRINT_TOKEN
npm test
npm run typecheck
npm run build
npm run dev
```

Para reemplazar una extracción previa hace falta `--overwrite`. Una consulta fallida no reemplaza el archivo existente. El JSON solo se escribe después de verificarlo y serializarlo sin NaN; el reemplazo se realiza desde un archivo temporal hermano. Es necesario reconstruir la app desplegada para incorporar un nuevo JSON.

## Metodología exacta del extractor

1. Verificar acceso a `male-cns:v1.0`; descubrir claves de `Neuron` disponibles.
2. Resolver los extremos por igualdad de `type` o body ID. Muestrear de forma determinista por tipo e ID, alternando tipos: hasta 12 fuentes y 2 destinos por defecto.
3. Consultar caminos dirigidos `ConnectsTo` más cortos, hasta 8 saltos, con peso mínimo de 5 sinapsis por conexión. Hasta 8 caminos por pareja. Son límites configurables; se rechazan más de 48 parejas o 10 saltos. Consultas de caminos todavía pueden resultar costosas para el servidor; si fallan, reducir extremos/saltos y revisar la selección, no descargar todo el conectoma.
4. Ordenar los caminos obtenidos por longitud e IDs. Conservar caminos completos que intersecten el componente elegido, hasta 150 nodos por defecto (máximo 200). No cortar caminos ni inventar enlaces entre componentes. El límite del servidor puede elegir distintas alternativas entre caminos de igual longitud; se guardan los caminos concretos y consultas para auditoría. Esto NO es un muestreo representativo estadístico del circuito completo.
5. Recuperar las conexiones dirigidas inducidas entre esos nodos, con el mismo umbral. Mantener el esqueleto de caminos y añadir las de mayor peso hasta 1.000 aristas por defecto (máximo 1.500). Se rechaza un límite menor que el esqueleto necesario.
6. Conservar `ConnectsTo.weight` sin redondeo ni suma de ROIs, evitando doble conteo. No se calcula un peso biológico a partir de actividad.
7. Volver a consultar todas las identidades/anotaciones y conexiones retenidas. Comparar cada par dirigido y peso con la segunda respuesta del servidor. Si difieren o falta un nodo, abortar.
8. Exportar metadata, filtros, consultas exactas, caminos, conteos, campos disponibles, timestamp y SHA-256 del contenido de nodos/aristas. El hash identifica el contenido; **no es una firma de Janelia**.

Si el recorrido conectado queda por debajo de 50 nodos, se informa y se conserva su tamaño real. Nunca se rellena con neuronas inventadas. Los conteos definitivos estarán en `metadata.nodeCount` y `metadata.edgeCount` después de la extracción autenticada.

## Datos originales frente a decisiones de MetroFly

| Campo / valor | Procedencia |
| --- | --- |
| `bodyId` | Identificador de `Neuron` en neuPrint |
| `type`, `instance`, `side` | Propiedad exacta cuando existe; `null` si no está disponible |
| `annotations` | Subconjunto disponible de type, instance, side, class, subclass, superclass, hemilineage, status, statusLabel, sin renombrar |
| `source`, `target`, `weight` | Extremos de `ConnectsTo` y peso bruto del dataset; IDs serializados como cadenas |
| `id` | Conversión del body ID a cadena para la UI |
| `category`, `categoryBasis` | Rol de visualización elegido por MetroFly: fuentes visuales, destinos descendentes, intermediarias. NO clase biológica |
| Posición y brillo en el widget | Índice en el listado y actividad simulada; no anatomía |
| Actividad, estímulos y dinámica | Modelo de visualización de MetroFly, sin mediciones biológicas |

La validación TypeScript comprueba estructura, procedencia declarada, conteos, IDs seguros/únicos, extremos existentes, pares únicos y pesos enteros positivos. **No autentica científicamente un archivo editado a mano**. La verificación contra neuPrint pertenece al extractor; el JSON generado debe tratarse como un artefacto revisado.

## Propagación y eventos

Configuración centralizada en `src/neural/activity.ts`. Cada minuto simulado calcula todos los nodos simultáneamente a partir del estado anterior:

```text
incoming_i = sum(activity_j * raw_weight_ji) / sum(raw_weight_ji)
next_i = clamp(0.002 + 0.55 * current_i + 0.35 * incoming_i + stimulus_i, 0, 1)
```

Basal inicial 0,02. Nodos sin entradas usan basal como entrada. Decaimiento + propagación = 0,90; sin estímulos el sistema retorna a basal. Normalizar por la suma de entradas evita que muchos contactos saturen automáticamente un nodo. Todas las aristas se tratan como influencias positivas; no se modelan neurotransmisores, inhibición, potenciales ni tiempo biológico. Las lecturas por categoría son medias de los nodos, multiplicadas por 100.

| Evento existente | Entrada ilustrativa |
| --- | --- |
| `BUS_ARRIVED`, `METRO_ARRIVED`, `BUS_WRONG_ROUTE` | Pulso visual 0,60 |
| `WALKING` | Pulso motor 0,45 |
| `TRANSFER_STARTED`, `CONTINUATION_SELECTED` | Visual 0,60 + motor 0,45 |
| `HEAVY_TRAFFIC` | Visual 0,22 cada dos minutos durante seis minutos |
| `STILL_WAITING`, demás eventos | Sin pulso adicional; propagación residual hacia basal |

Los pulsos coincidentes se combinan por máximo, no por suma. Si no hay nodos de rol motor, el estímulo motor se aplica a los destinos de rol descendente; es una decisión de visualización, no una afirmación de fisiología. No se inventan eventos `BOARDING` o `VEHICLE_APPROACHING` inexistentes en el simulador.

La historia neural se deriva exclusivamente de grafo, eventos y duración. No recibe `MoodState`. Pausar conserva exactamente el minuto; reiniciar reproduce la misma historia; al finalizar se conserva la actividad del último minuto, sin un salto artificial a basal. La ruta y la semilla no cambian.

## Validación y límites

- `npm run typecheck` y `npm run build`: pasan. Advertencia de tamaño de chunk de MapLibre existente, no un error.
- `npm test`: 14 pruebas, incluidas las 13 previas y una comprobación del artefacto real de 95/253 en las tres rutas. Propagación dirigida, normalización, decaimiento, rechazo de datos inválidos, fallback e independencia del ánimo siguen cubiertos.
- `python -m unittest discover -s scripts -p 'test_*.py' -v`: 3 pruebas offline del extractor, incluyendo rechazo de un peso modificado en la segunda lectura. Los IDs de prueba son ficticios, nunca exportados como datos reales.
- Este reset no ejecuta `--inspect` ni consulta neuPrint: conserva la extracción y su verificación registrada en el baseline. No se afirma una revalidación en vivo del dataset.
- Ninguna de estas pruebas demuestra fidelidad electrofisiológica, reproducción de conducta ni inferencia emocional. El panel no explica científicamente el estado de ánimo de la mosca.

Rutas, calibración, geografía y Fly Mood permanecen sin cambios. No se añadió backend, ML, 3D ni trabajo móvil.
