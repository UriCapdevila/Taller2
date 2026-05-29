export const localDatasets = [
  {
    id: 1,
    title: "Dataset 1: Análisis de Frecuencias",
    chartPath: "/assets/charts/dataset1.png",
    codeSnippet: `import pandas as pd
import matplotlib.pyplot as plt

df = pd.read_csv('data1.csv')
df.plot(kind='bar', x='Category', y='Frequency')
plt.title('Análisis de Frecuencias')
plt.savefig('dataset1.png')`,
    markdownText: `### Resumen del Dataset 1
Este dataset muestra el **análisis de frecuencias** de las distintas categorías de estudio.

*   Categoría A presenta la mayor frecuencia.
*   Categoría B muestra un declive comparado con estudios anteriores.
*   [Enlace a la fuente original](https://example.com)
    `
  },
  {
    id: 2,
    title: "Dataset 2: Tendencias Temporales",
    chartPath: "/assets/charts/dataset2.png",
    codeSnippet: `import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt

df = pd.read_csv('data2.csv')
sns.lineplot(data=df, x='Year', y='Value')
plt.title('Tendencias Temporales')
plt.savefig('dataset2.png')`,
    markdownText: `### Resumen del Dataset 2
Aquí podemos observar las **tendencias temporales** a lo largo de la última década.

**Puntos clave:**
1.  Pico máximo en 2021.
2.  Estabilización en 2023.
    `
  },
  {
    id: 3,
    title: "Dataset 3: Distribución Demográfica",
    chartPath: "/assets/charts/dataset3.png",
    codeSnippet: `import pandas as pd
import matplotlib.pyplot as plt

df = pd.read_csv('data3.csv')
plt.pie(df['Population'], labels=df['Region'], autopct='%1.1f%%')
plt.title('Distribución Demográfica')
plt.savefig('dataset3.png')`,
    markdownText: `### Resumen del Dataset 3
Este gráfico ilustra la **distribución demográfica** segmentada por regiones.

> Nota importante: Los datos de la región Norte están incompletos para el año base.
    `
  },
  {
    id: 4,
    title: "Dataset 4: Correlación de Variables",
    chartPath: "/assets/charts/dataset4.png",
    codeSnippet: `import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt

df = pd.read_csv('data4.csv')
sns.scatterplot(data=df, x='VariableX', y='VariableY')
plt.title('Correlación de Variables')
plt.savefig('dataset4.png')`,
    markdownText: `### Resumen del Dataset 4
Evaluación de la correlación entre **Variable X** y **Variable Y**.

El *coeficiente de Pearson* calculado es de **0.85**, lo que indica una fuerte correlación positiva.
    `
  }
];
