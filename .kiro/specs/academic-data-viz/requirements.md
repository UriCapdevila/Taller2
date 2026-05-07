# Requirements Document

## Introduction

Aplicación web académica de tipo SPA (Single Page Application) para visualizar análisis de datos de 4 datasets distintos. La arquitectura es moderna y desacoplada: un pipeline de datos en Google Colab (Python) genera artefactos JSON/gráficos y los sube a Google Drive; una capa serverless en Netlify Functions actúa como API intermediaria que protege las credenciales y elimina problemas de CORS; y un frontend en React (Vite) presenta los datos en una interfaz de 4 pestañas. El costo operativo es cero, sin dependencias de servicios de pago.

---

## Glossary

- **SPA**: Single Page Application — aplicación web que carga una sola página HTML y actualiza el contenido dinámicamente sin recargar el navegador.
- **Data_Pipeline**: Script de Python ejecutado en Google Colab que procesa un dataset, genera notas analíticas y gráficos, y exporta los resultados como artefactos JSON o HTML/Base64.
- **Artifact**: Archivo JSON (o HTML con gráficos embebidos en Base64) producido por el Data_Pipeline y almacenado en Google Drive para un dataset específico.
- **Drive_API**: API de Google Drive utilizada por la Netlify Function para autenticarse y descargar Artifacts.
- **Netlify_Function**: Función serverless Node.js desplegada en Netlify que actúa como endpoint de API, conectándose a Drive_API y sirviendo Artifacts al Frontend.
- **Frontend**: Aplicación React (empaquetada con Vite) que renderiza la interfaz de usuario con 4 pestañas y consume la Netlify_Function.
- **Tab**: Pestaña de la interfaz de usuario del Frontend, cada una asociada a un dataset específico (Dataset 1, Dataset 2, Dataset 3, Dataset 4).
- **Dataset**: Conjunto de datos académicos identificado por un ID numérico (1–4).
- **Chart**: Visualización gráfica generada a partir de los datos de un Dataset, embebida en el Artifact.
- **Service_Account**: Cuenta de servicio de Google con credenciales JSON usada por el Data_Pipeline y la Netlify_Function para autenticarse con Drive_API sin intervención del usuario.
- **Environment_Variable**: Variable de configuración definida en el panel de Netlify que almacena valores sensibles (tokens, IDs) sin exponerlos en el código fuente.

---

## Requirements

### Requirement 1: Pipeline de Datos en Google Colab

**User Story:** Como científico de datos, quiero ejecutar un script de Python en Google Colab que procese un dataset y suba los resultados a Google Drive, para que los datos analizados estén disponibles para la aplicación web sin infraestructura de servidor propia.

#### Acceptance Criteria

1. THE Data_Pipeline SHALL autenticarse con Drive_API usando una Service_Account antes de realizar cualquier operación de escritura.
2. WHEN el Data_Pipeline procesa un Dataset, THE Data_Pipeline SHALL generar un Artifact en formato JSON que contenga las notas analíticas y los datos de los Charts.
3. WHEN el Data_Pipeline genera un Artifact, THE Data_Pipeline SHALL subir el Artifact a una carpeta específica y predefinida en Google Drive, identificada por un folder ID configurable.
4. WHEN ya existe un Artifact previo para el mismo Dataset en Google Drive, THE Data_Pipeline SHALL sobrescribir el archivo existente en lugar de crear un duplicado.
5. IF la autenticación con Drive_API falla, THEN THE Data_Pipeline SHALL mostrar un mensaje de error descriptivo que indique la causa del fallo y detener la ejecución.
6. IF la subida del Artifact a Google Drive falla, THEN THE Data_Pipeline SHALL mostrar un mensaje de error descriptivo con el código de error de Drive_API y detener la ejecución.
7. THE Data_Pipeline SHALL exportar los Charts como datos embebidos en Base64 dentro del Artifact JSON, de modo que el Frontend pueda renderizarlos sin dependencias externas adicionales.

---

### Requirement 2: Endpoint Serverless en Netlify Functions

**User Story:** Como desarrollador, quiero un endpoint serverless en Netlify que actúe como intermediario entre el Frontend y Google Drive, para proteger las credenciales de acceso y evitar problemas de CORS en el navegador.

#### Acceptance Criteria

1. THE Netlify_Function SHALL exponer un endpoint HTTP en la ruta `/.netlify/functions/get-dataset` que acepte el parámetro de consulta `id` con valores enteros del 1 al 4.
2. WHEN el Frontend realiza una petición GET a `/.netlify/functions/get-dataset?id={n}`, THE Netlify_Function SHALL autenticarse con Drive_API usando credenciales almacenadas en Environment_Variables.
3. WHEN la autenticación con Drive_API es exitosa, THE Netlify_Function SHALL descargar el Artifact correspondiente al Dataset identificado por el parámetro `id`.
4. WHEN el Artifact es descargado correctamente, THE Netlify_Function SHALL devolver el contenido del Artifact al Frontend con código HTTP 200 y cabecera `Content-Type: application/json`.
5. THE Netlify_Function SHALL incluir las cabeceras CORS necesarias en todas las respuestas para permitir peticiones desde el dominio del Frontend desplegado en Netlify.
6. IF el parámetro `id` recibido no es un entero entre 1 y 4, THEN THE Netlify_Function SHALL devolver una respuesta con código HTTP 400 y un mensaje de error en formato JSON.
7. IF el Artifact solicitado no existe en Google Drive, THEN THE Netlify_Function SHALL devolver una respuesta con código HTTP 404 y un mensaje de error en formato JSON.
8. IF la autenticación con Drive_API falla dentro de la Netlify_Function, THEN THE Netlify_Function SHALL devolver una respuesta con código HTTP 500 y un mensaje de error en formato JSON sin exponer las credenciales.
9. THE Netlify_Function SHALL leer las credenciales de Drive_API exclusivamente desde Environment_Variables, nunca desde archivos incluidos en el repositorio de código.
10. THE Netlify_Function SHALL documentar en un archivo README las Environment_Variables requeridas: el JSON de la Service_Account y el ID de la carpeta de Google Drive.

---

### Requirement 3: Interfaz de Usuario con 4 Pestañas

**User Story:** Como usuario académico, quiero una interfaz web con 4 pestañas que me permita navegar entre los análisis de los distintos datasets, para explorar los resultados de forma organizada e intuitiva.

#### Acceptance Criteria

1. THE Frontend SHALL renderizar una barra de navegación con exactamente 4 Tabs, cada una etiquetada con el nombre del Dataset correspondiente.
2. WHEN el usuario selecciona una Tab, THE Frontend SHALL mostrar el contenido del Dataset asociado a esa Tab y ocultar el contenido de las demás Tabs.
3. WHEN el usuario selecciona una Tab por primera vez, THE Frontend SHALL realizar una petición GET a la Netlify_Function con el parámetro `id` correspondiente al Dataset de esa Tab.
4. WHILE una petición a la Netlify_Function está en curso, THE Frontend SHALL mostrar un indicador de carga visible en el área de contenido de la Tab activa.
5. WHEN la Netlify_Function devuelve un Artifact con código HTTP 200, THE Frontend SHALL renderizar los Charts y las notas analíticas contenidos en el Artifact.
6. IF la Netlify_Function devuelve un código HTTP distinto de 200, THEN THE Frontend SHALL mostrar un mensaje de error descriptivo en el área de contenido de la Tab activa sin interrumpir la navegación entre Tabs.
7. THE Frontend SHALL almacenar en memoria el Artifact de cada Tab ya cargada, de modo que al volver a una Tab previamente visitada no se realice una nueva petición a la Netlify_Function durante la misma sesión.
8. THE Frontend SHALL ser responsivo y renderizar correctamente en dispositivos con ancho de pantalla mínimo de 320px y máximo de 1920px.

---

### Requirement 4: Renderizado de Gráficos y Notas Analíticas

**User Story:** Como usuario académico, quiero ver los gráficos y las notas del análisis de cada dataset dentro de la aplicación, para interpretar los resultados sin necesidad de descargar archivos externos.

#### Acceptance Criteria

1. WHEN el Frontend recibe un Artifact, THE Frontend SHALL renderizar cada Chart embebido en Base64 como una imagen visible dentro del área de contenido de la Tab activa.
2. WHEN el Frontend recibe un Artifact, THE Frontend SHALL renderizar las notas analíticas del Dataset como texto formateado dentro del área de contenido de la Tab activa.
3. THE Frontend SHALL renderizar los Charts con un ancho máximo del 100% del contenedor padre para garantizar que no desborden el área de visualización en ningún tamaño de pantalla.
4. IF un Artifact no contiene Charts, THEN THE Frontend SHALL mostrar un mensaje informativo indicando que no hay gráficos disponibles para ese Dataset.
5. IF un Artifact no contiene notas analíticas, THEN THE Frontend SHALL mostrar un mensaje informativo indicando que no hay notas disponibles para ese Dataset.

---

### Requirement 5: Seguridad y Gestión de Credenciales

**User Story:** Como administrador del sistema, quiero que las credenciales de acceso a Google Drive nunca estén expuestas en el código fuente ni en el navegador del usuario, para proteger el acceso a los datos académicos.

#### Acceptance Criteria

1. THE Netlify_Function SHALL acceder a las credenciales de la Service_Account exclusivamente a través de Environment_Variables definidas en el panel de configuración de Netlify.
2. THE Frontend SHALL comunicarse con Google Drive únicamente a través de la Netlify_Function, nunca realizando peticiones directas a Drive_API desde el navegador.
3. THE Data_Pipeline SHALL almacenar las credenciales de la Service_Account en el entorno seguro de Google Colab (usando `google.colab.userdata` o montando Google Drive con autenticación OAuth), nunca en texto plano dentro del notebook compartido públicamente.
4. IF un repositorio de código del proyecto es inspeccionado, THEN el repositorio SHALL contener únicamente referencias a nombres de Environment_Variables, sin valores de credenciales embebidos.

---

### Requirement 6: Despliegue y Configuración Cero-Costo

**User Story:** Como desarrollador, quiero que toda la infraestructura de la aplicación opere sin costo monetario, para mantener el proyecto viable a largo plazo sin presupuesto dedicado.

#### Acceptance Criteria

1. THE Frontend SHALL ser desplegado en la plataforma Netlify usando el plan gratuito, sin requerir servicios de pago de terceros.
2. THE Netlify_Function SHALL operar dentro de los límites del plan gratuito de Netlify (125.000 invocaciones/mes y 100 horas de ejecución/mes).
3. THE Data_Pipeline SHALL ejecutarse en Google Colab usando el plan gratuito, sin requerir instancias de cómputo de pago.
4. THE Data_Pipeline SHALL almacenar los Artifacts en Google Drive usando el plan gratuito (15 GB de almacenamiento), sin requerir Google Workspace de pago.
5. WHERE el tamaño total de los Artifacts de los 4 Datasets supere 100 MB, THE Data_Pipeline SHALL comprimir los datos o reducir la resolución de los Charts embebidos para mantener el tamaño total por debajo de 100 MB.
```
