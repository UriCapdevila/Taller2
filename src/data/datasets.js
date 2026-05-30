export const localDatasets = [
  {
    "id": 1,
    "title": "Edades",
    "chartPath": "/assets/charts/1_edades.png",
    "markdownText": "### Distribución de Edades\n\nLa mayoría de los pacientes está concentrada entre los 40 y 65 años, mientras que hay menos pacientes jóvenes y muy pocos mayores de 80. También aparece un grupo pequeño de pacientes de edad muy baja (0-5 años), probablemente asociado a pediatría.\n\nEl sistema de salud es utilizado principalmente por adultos y adultos mayores, asumimos por las enfermedades complejas o cirugías que son más frecuentes en edades medias y avanzadas."
  },
  {
    "id": 2,
    "title": "Sexo",
    "chartPath": "/assets/charts/2_sexo.png",
    "markdownText": "### Distribución por Sexo\n\nSe observa que los pacientes masculinos son más que los femeninos (incluso en niños). Esto puede indicar menor acceso de las mujeres al sistema, o que los hombres tienen mayor prevalencia de las enfermedades cubiertas.\n\n> **Nota sobre limpieza de datos:** Se corrigieron problemas de estandarización (MALE/Male, espacios extra) para consolidar las categorías."
  },
  {
    "id": 3,
    "title": "Categorías Médicas",
    "chartPath": "/assets/charts/3_categorias.png",
    "markdownText": "### Categorías médicas más frecuentes\n\nLas categorías más frecuentes en el sistema público son:\n1. Nefrología\n2. Cirugía cardíaca/cardiotorácica\n3. Pediatría\n4. Neurología\n5. Cardiología\n6. Politrauma"
  },
  {
    "id": 4,
    "title": "Hospitales",
    "chartPath": "/assets/charts/4_hospital.png",
    "markdownText": "### Distribución por Tipo de Hospital\n\n- **G**: Hospitales del Gobierno (Públicos)\n- **C**: Corporativos / Privados\n\nSe observa la distribución de atenciones entre el sistema estrictamente gubernamental y los prestadores privados."
  },
  {
    "id": 5,
    "title": "Mortalidad",
    "chartPath": "/assets/charts/5_mortalidad.png",
    "markdownText": "### Mortalidad General del Programa\n\nEl gráfico muestra una diferencia enorme entre pacientes que fallecieron y los que no. La mortalidad es muy baja respecto al total de casos.\n\nLa mayoría de los procedimientos tuvieron resultados favorables; también hay que considerar que algunas intervenciones son tratamientos programados y no necesariamente casos críticos."
  },
  {
    "id": 6,
    "title": "Montos Cobrados",
    "chartPath": "/assets/charts/6_montos.png",
    "markdownText": "### Distribución de Montos Cobrados\n\nEste gráfico muestra una distribución claramente asimétrica hacia la derecha.\n\nLa mayoría de los tratamientos tienen montos relativamente bajos o medios, hay pocos casos extremadamente caros. Esto puede ser porque el sistema concentra muchos tratamientos de costo moderado. Probablemente las cirugías complejas (oncología, cardíacas, nefrología, etc) expliquen ciertos montos extremos."
  },
  {
    "id": 7,
    "title": "Castas",
    "chartPath": "/assets/charts/7_castas.png",
    "markdownText": "### Distribución por Casta Social\n\nEl sistema está diseñado para ayudar a personas que sufrieron discriminación histórica en la India.\n\n* **BC (Backward Classes)**: Clases Atrás en el Desarrollo.\n* **OC (Open Category)**: Categoría General (alta).\n* **Minorities**: Minorías religiosas.\n* **SC (Scheduled Castes)**: Castas Protegidas históricamente discriminadas.\n* **ST (Scheduled Tribes)**: Tribus indígenas originarias."
  },
  {
    "id": 8,
    "title": "Edad vs Casta",
    "chartPath": "/assets/charts/8_edad_casta.png",
    "markdownText": "### Edad Promedio según Casta (Boxplot)\n\nLas castas **SC y ST** tienden a tener pacientes más jóvenes en promedio. Esto puede interpretarse de dos formas:\n- Tienen una estructura etaria más joven (comunidades rurales con alta natalidad).\n- Acceden al sistema con enfermedades más graves a edades más tempranas por menor prevención.\n\n**OC (casta alta)** tiende a tener pacientes de mayor edad, lo que refleja que acceden a atención preventiva y llegan al sistema más tarde, cuando ya son adultos mayores."
  },
  {
    "id": 9,
    "title": "Mort. x Casta",
    "chartPath": "/assets/charts/9_mortalidad_casta.png",
    "markdownText": "### Tasa de Mortalidad por Casta\n\nAnalizando los casos, *Others* tiene un 2,44% de mortalidad, con el segundo número de pacientes más bajo, lo que requeriría estudiar sus condiciones de vida u origen.\n\nEl resto de las castas fluctúan entre 1.8% y 2.1%. Esto nos da indicios de equidad o desigualdad en el desenlace final tras los procedimientos cubiertos."
  }
];
