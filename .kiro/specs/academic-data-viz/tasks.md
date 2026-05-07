# Implementation Plan: academic-data-viz

## Overview

Implementación en tres capas desacopladas: (1) Data Pipeline en Python/Colab que genera artefactos JSON con gráficos en Base64 y los sube a Google Drive; (2) Netlify Function en Node.js que actúa como proxy autenticado hacia Drive; (3) SPA en React + Vite con 4 pestañas, caché en memoria y renderizado de gráficos y notas.

## Tasks

- [x] 1. Configurar estructura del proyecto y archivos base
  - Crear `netlify.toml` con configuración de build (`base = "."`, `publish = "dist"`, `functions = "netlify/functions"`)
  - Crear `package.json` raíz con scripts de Vite (`dev`, `build`, `preview`) y dependencias de frontend (`react`, `react-dom`, `vite`, `@vitejs/plugin-react`)
  - Crear `vite.config.js` con el plugin de React
  - Crear `netlify/functions/` y `src/` con la estructura de carpetas definida en el diseño
  - Crear `src/constants.js` con los nombres de los 4 datasets y sus IDs
  - Crear `.gitignore` que excluya `node_modules/`, `dist/`, `.env`, y cualquier archivo `*.json` de credenciales
  - _Requirements: 5.4, 6.1_

- [x] 2. Implementar la Netlify Function `get-dataset`
  - [x] 2.1 Crear `netlify/functions/get-dataset.js` con manejo de preflight OPTIONS
    - Responder HTTP 200 con cabeceras CORS a cualquier request `OPTIONS`
    - Incluir cabeceras `Access-Control-Allow-Origin: *`, `Access-Control-Allow-Methods: GET, OPTIONS`, `Access-Control-Allow-Headers: Content-Type` en **todas** las respuestas
    - _Requirements: 2.1, 2.5_

  - [x] 2.2 Implementar validación del parámetro `id`
    - Parsear `event.queryStringParameters.id`
    - Retornar HTTP 400 con `{ "error": "Invalid id parameter. Must be an integer between 1 and 4." }` si `id` no es entero entre 1 y 4
    - _Requirements: 2.6_

  - [x] 2.3 Escribir property test para validación de `id` (Property 5)
    - **Property 5: Cualquier id inválido produce HTTP 400 con body JSON**
    - Usar `fast-check` para generar strings, floats, negativos, enteros > 4, null y ausencia del parámetro
    - Verificar que todos producen HTTP 400 y body con campo `error`
    - Incluir comentario: `// Feature: academic-data-viz, Property 5`
    - **Validates: Requirements 2.6**

  - [x] 2.4 Implementar autenticación con Google Drive API
    - Parsear `GOOGLE_SERVICE_ACCOUNT_JSON` desde `process.env`
    - Construir cliente autenticado con `google-auth-library` usando JWT de Service Account
    - Retornar HTTP 500 con `{ "error": "Internal server error." }` si el parseo o la autenticación fallan (sin exponer credenciales ni stack traces)
    - _Requirements: 2.2, 2.8, 2.9, 5.1_

  - [x] 2.5 Implementar descarga del artefacto desde Google Drive
    - Listar archivos en `GOOGLE_DRIVE_FOLDER_ID` con nombre `artifact_{id}.json` usando `googleapis`
    - Retornar HTTP 404 con `{ "error": "Artifact not found for dataset id N." }` si no existe
    - Descargar contenido del archivo y retornar HTTP 200 con el JSON del artefacto
    - _Requirements: 2.3, 2.4, 2.7_

  - [x] 2.6 Escribir property test para respuesta correcta con id válido (Property 4)
    - **Property 4: La Netlify Function devuelve el artefacto correcto para cualquier id válido**
    - Usar `fast-check` para generar ids 1–4 con artefactos mock en Drive (mock de `googleapis`)
    - Verificar HTTP 200, `Content-Type: application/json`, y `body.dataset_id === id`
    - Incluir comentario: `// Feature: academic-data-viz, Property 4`
    - **Validates: Requirements 2.3, 2.4**

  - [x] 2.7 Escribir property test para cabeceras CORS en todas las respuestas (Property 6)
    - **Property 6: Las cabeceras CORS están presentes en todas las respuestas**
    - Usar `fast-check` para generar requests válidos e inválidos
    - Verificar que `Access-Control-Allow-Origin` y `Access-Control-Allow-Methods` están presentes en todas las respuestas
    - Incluir comentario: `// Feature: academic-data-viz, Property 6`
    - **Validates: Requirements 2.5**

  - [x] 2.8 Escribir tests unitarios para la Netlify Function
    - `id` ausente → HTTP 400
    - Archivo no encontrado → HTTP 404
    - Fallo de autenticación → HTTP 500 sin credenciales en body
    - Preflight OPTIONS → HTTP 200 con cabeceras CORS
    - _Requirements: 2.5, 2.6, 2.7, 2.8_

- [x] 3. Checkpoint — Netlify Function
  - Asegurar que todos los tests de la función pasan. Consultar al usuario si surgen dudas.

- [x] 4. Implementar el custom hook `useDataset` y la caché en memoria
  - [x] 4.1 Crear `src/hooks/useDataset.js`
    - Implementar firma `const { data, loading, error } = useDataset(id, cache, setCache)`
    - Si `cache.has(id)` → retornar datos cacheados sin fetch
    - Si no → hacer `fetch` a `/.netlify/functions/get-dataset?id={id}`, actualizar `loading` y `error`
    - Al recibir respuesta exitosa, llamar `setCache` para almacenar el artefacto en el `Map`
    - Manejar errores de red y respuestas HTTP != 200 actualizando `error`
    - _Requirements: 3.3, 3.4, 3.6, 3.7_

  - [x] 4.2 Escribir property test para caché — fetch exactamente una vez por tab (Property 8)
    - **Property 8: El fetch se realiza exactamente una vez por tab por sesión**
    - Usar `fast-check` para generar secuencias de navegación entre tabs (1–4) con repeticiones
    - Mockear `fetch` y verificar que el número de llamadas para cada `id` es exactamente 1
    - Incluir comentario: `// Feature: academic-data-viz, Property 8`
    - **Validates: Requirements 3.3, 3.7**

  - [x] 4.3 Escribir property test para manejo de errores HTTP (Property 9)
    - **Property 9: Cualquier error HTTP produce mensaje de error sin interrumpir la navegación**
    - Usar `fast-check` para generar códigos HTTP de error (400, 404, 500, etc.)
    - Verificar que el hook expone `error != null` y `data === null` para cualquier código != 200
    - Incluir comentario: `// Feature: academic-data-viz, Property 9`
    - **Validates: Requirements 3.6**

- [x] 5. Implementar componentes de UI del Frontend
  - [x] 5.1 Crear `src/components/LoadingSpinner.jsx` y `src/components/ErrorMessage.jsx`
    - `LoadingSpinner`: elemento visible con `aria-label` descriptivo mientras `loading === true`
    - `ErrorMessage`: recibe prop `message` y lo renderiza en el área de contenido de la tab activa
    - _Requirements: 3.4, 3.6_

  - [x] 5.2 Crear `src/components/ChartDisplay.jsx`
    - Recibe prop `charts: Chart[]`
    - Si `charts` está vacío → renderizar mensaje "No hay gráficos disponibles para este dataset"
    - Para cada chart → renderizar `<img src={\`data:${chart.type};base64,${chart.data}\`} alt={chart.title} style={{ maxWidth: '100%' }} />`
    - _Requirements: 4.1, 4.3, 4.4_

  - [x] 5.3 Crear `src/components/NotesDisplay.jsx`
    - Recibe prop `notes: string`
    - Si `notes` está vacío o es null → renderizar mensaje "No hay notas disponibles para este dataset"
    - Renderizar el texto de notas como contenido formateado
    - _Requirements: 4.2, 4.5_

  - [x] 5.4 Crear `src/components/TabContent.jsx`
    - Recibe props `data`, `loading`, `error`
    - Si `loading` → renderizar `<LoadingSpinner />`
    - Si `error` → renderizar `<ErrorMessage message={error} />`
    - Si `data` → renderizar `<ChartDisplay charts={data.charts} />` y `<NotesDisplay notes={data.notes} />`
    - _Requirements: 3.4, 3.5, 3.6_

  - [x] 5.5 Crear `src/components/TabBar.jsx`
    - Renderizar exactamente 4 botones/tabs con los nombres de datasets desde `constants.js`
    - Resaltar visualmente la tab activa
    - Llamar `onTabChange(id)` al hacer clic en una tab
    - _Requirements: 3.1, 3.2_

  - [x] 5.6 Escribir property test para visibilidad de tabs (Property 7)
    - **Property 7: Solo la tab activa muestra su contenido**
    - Usar `fast-check` + React Testing Library para generar selecciones de tab (1–4)
    - Verificar que el contenido de la tab activa es visible y el de las demás está oculto
    - Incluir comentario: `// Feature: academic-data-viz, Property 7`
    - **Validates: Requirements 3.2**

  - [x] 5.7 Escribir property test para renderizado completo de artefactos (Property 10)
    - **Property 10: El renderizado de artefactos es completo y fiel**
    - Usar `fast-check` + React Testing Library para generar artefactos con N charts y notas aleatorias
    - Verificar que se renderizan exactamente N elementos `<img>` con `src` en Base64 y que las notas aparecen
    - Incluir comentario: `// Feature: academic-data-viz, Property 10`
    - **Validates: Requirements 3.5, 4.1, 4.2**

  - [x] 5.8 Escribir tests unitarios para componentes de UI
    - `TabBar` renderiza exactamente 4 tabs con nombres correctos
    - `LoadingSpinner` es visible cuando `loading === true`
    - `ChartDisplay` con `charts=[]` → mensaje informativo
    - `NotesDisplay` con `notes=""` → mensaje informativo
    - _Requirements: 3.1, 3.4, 4.4, 4.5_

- [-] 6. Implementar `App.jsx` y conectar todos los componentes
  - Crear `src/App.jsx` con estado `activeTab` (useState, inicial = 1) y `cache` (useState, inicial = `new Map()`)
  - Instanciar `useDataset(activeTab, cache, setCache)` para obtener `{ data, loading, error }`
  - Renderizar `<TabBar>` pasando `activeTab` y `onTabChange={setActiveTab}`
  - Renderizar `<TabContent>` pasando `data`, `loading`, `error`
  - Crear `src/main.jsx` como punto de entrada que monta `<App />` en el DOM
  - Crear `index.html` con el div raíz y el script de entrada de Vite
  - _Requirements: 3.1, 3.2, 3.3, 3.7_

- [~] 7. Checkpoint — Frontend completo
  - Asegurar que todos los tests del frontend pasan. Consultar al usuario si surgen dudas.

- [~] 8. Implementar el Data Pipeline en Python (Colab Notebook)
  - [~] 8.1 Crear `pipeline/pipeline.ipynb` con celda de autenticación
    - Cargar credenciales de Service Account desde `google.colab.userdata` (nunca en texto plano)
    - Construir cliente autenticado con `google-api-python-client` y `google-auth`
    - Capturar excepciones de autenticación, imprimir mensaje descriptivo y llamar `sys.exit(1)`
    - _Requirements: 1.1, 1.5, 5.3_

  - [~] 8.2 Implementar generación de gráficos y construcción del artefacto JSON
    - Procesar el dataset con `pandas`
    - Generar gráficos con `matplotlib` o `plotly` y exportarlos como Base64 (sin prefijo `data:`)
    - Construir el dict del artefacto con campos `dataset_id`, `title`, `generated_at`, `notes`, `charts`
    - Capturar excepciones de generación de gráficos y registrar el chart fallido
    - _Requirements: 1.2, 1.7_

  - [~] 8.3 Escribir property test para campos requeridos del artefacto (Property 1)
    - **Property 1: El artefacto generado contiene todos los campos requeridos**
    - Usar `Hypothesis` para generar datasets con distintos contenidos, tamaños y tipos de datos
    - Verificar que el artefacto resultante contiene `dataset_id`, `title`, `generated_at`, `notes`, `charts`
    - Incluir comentario: `# Feature: academic-data-viz, Property 1`
    - **Validates: Requirements 1.2**

  - [~] 8.4 Escribir property test para validez de Base64 en charts (Property 2)
    - **Property 2: Los charts se exportan como Base64 válido**
    - Usar `Hypothesis` para generar gráficos con distintos datos
    - Verificar que el campo `data` de cada chart se puede decodificar con `base64.b64decode` sin error
    - Incluir comentario: `# Feature: academic-data-viz, Property 2`
    - **Validates: Requirements 1.7**

  - [~] 8.5 Implementar subida/sobrescritura del artefacto a Google Drive
    - Buscar archivo `artifact_{id}.json` en `GOOGLE_DRIVE_FOLDER_ID`
    - Si existe → actualizar (sobrescribir) usando `files().update()`
    - Si no existe → crear usando `files().create()`
    - Capturar excepciones de subida, imprimir código de error de Drive API y llamar `sys.exit(1)`
    - _Requirements: 1.3, 1.4, 1.6_

  - [~] 8.6 Escribir property test para idempotencia de subida (Property 3)
    - **Property 3: La subida es idempotente — no genera duplicados**
    - Usar `Hypothesis` para generar artefactos con/sin archivo previo en Drive (mock de Drive API)
    - Verificar que tras la ejecución existe exactamente un archivo `artifact_{id}.json` en la carpeta
    - Incluir comentario: `# Feature: academic-data-viz, Property 3`
    - **Validates: Requirements 1.4**

  - [~] 8.7 Escribir tests unitarios para el Data Pipeline
    - Fallo de autenticación → excepción con mensaje descriptivo
    - Fallo de upload → excepción con código de error de Drive API
    - Dataset vacío → error antes de generar artefacto
    - _Requirements: 1.5, 1.6_

- [~] 9. Crear documentación de configuración y variables de entorno
  - Crear `README.md` en la raíz del proyecto con instrucciones de despliegue en Netlify
  - Documentar las Environment_Variables requeridas: `GOOGLE_SERVICE_ACCOUNT_JSON` y `GOOGLE_DRIVE_FOLDER_ID`
  - Incluir instrucciones para configurar la Service Account en Google Colab usando `google.colab.userdata`
  - Verificar que el README solo referencia nombres de variables, sin valores de credenciales
  - _Requirements: 2.10, 5.4_

- [~] 10. Checkpoint final — Integración y verificación
  - Asegurar que todos los tests (pipeline, función, frontend) pasan.
  - Verificar que no hay credenciales en ningún archivo del repositorio.
  - Verificar que los elementos `<img>` tienen `max-width: 100%`.
  - Consultar al usuario si surgen dudas antes de considerar la implementación completa.

## Notes

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido.
- Cada tarea referencia requerimientos específicos para trazabilidad.
- Los checkpoints garantizan validación incremental entre capas.
- Los property tests usan `Hypothesis` (Python) y `fast-check` (Node.js/React) con mínimo 100 iteraciones.
- Los tests unitarios complementan los property tests con casos específicos y condiciones de error.
- El pipeline (tarea 8) puede implementarse en paralelo con el frontend (tareas 4–7) una vez que la función serverless (tarea 2) esté lista.
