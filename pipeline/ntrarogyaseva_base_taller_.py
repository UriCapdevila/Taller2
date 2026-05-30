import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np
import json
import os

sns.set_theme(style="whitegrid")
plt.rcParams["figure.figsize"] = (8, 5)

# Asegurar que existan los directorios
os.makedirs('../public/assets/charts', exist_ok=True)
os.makedirs('../src/data', exist_ok=True)

print("Cargando CSV (esto puede tomar unos segundos)...")
df = pd.read_csv("ntrarogyaseva.csv")
datasets = []

print("Generando Gráfico 1: Edades...")
plt.figure(figsize=(8, 5))
sns.histplot(df["AGE"], bins=30, kde=True, color="steelblue")
plt.title("Distribución de Edades de los Pacientes")
plt.xlabel("Edad")
plt.ylabel("Cantidad de pacientes")
plt.tight_layout()
plt.savefig('../public/assets/charts/1_edades.png', dpi=150)
plt.close()

datasets.append({
    "id": 1,
    "title": "Edades",
    "chartPath": "/assets/charts/1_edades.png",
    "markdownText": "### Distribución de Edades\n\nLa mayoría de los pacientes está concentrada entre los 40 y 65 años, mientras que hay menos pacientes jóvenes y muy pocos mayores de 80. También aparece un grupo pequeño de pacientes de edad muy baja (0-5 años), probablemente asociado a pediatría.\n\nEl sistema de salud es utilizado principalmente por adultos y adultos mayores, asumimos por las enfermedades complejas o cirugías que son más frecuentes en edades medias y avanzadas."
})

df["SEX_clean"] = df["SEX"].str.strip().str.lower()
mapeo_sexo = {
    "male":           "Male",
    "female":         "Female",
    "male(child)":    "Male (Child)",
    "female(child)":  "Female (Child)"
}
df["SEX_clean"] = df["SEX_clean"].map(mapeo_sexo)

print("Generando Gráfico 2: Sexo...")
fig, ax = plt.subplots(figsize=(8, 5))
valores = df["SEX_clean"].value_counts()
colores = ["steelblue", "salmon", "skyblue", "lightcoral"]
bars = ax.bar(valores.index, valores.values, color=colores, edgecolor="white")
total = valores.sum()
for bar, val in zip(bars, valores.values):
    ax.text(bar.get_x() + bar.get_width() / 2, bar.get_height() + 1500, f"{val:,}\n({val/total*100:.1f}%)", ha="center", va="bottom", fontsize=9)
ax.set_title("Distribución de Pacientes por Sexo")
ax.set_xlabel("Sexo")
ax.set_ylabel("Cantidad de pacientes")
ax.set_ylim(0, valores.max() * 1.18)
plt.xticks(rotation=15)
plt.tight_layout()
plt.savefig('../public/assets/charts/2_sexo.png', dpi=150)
plt.close()

datasets.append({
    "id": 2,
    "title": "Sexo",
    "chartPath": "/assets/charts/2_sexo.png",
    "markdownText": "### Distribución por Sexo\n\nSe observa que los pacientes masculinos son más que los femeninos (incluso en niños). Esto puede indicar menor acceso de las mujeres al sistema, o que los hombres tienen mayor prevalencia de las enfermedades cubiertas.\n\n> **Nota sobre limpieza de datos:** Se corrigieron problemas de estandarización (MALE/Male, espacios extra) para consolidar las categorías."
})

print("Generando Gráfico 3: Categorías...")
plt.figure(figsize=(10, 5))
df["CATEGORY_NAME"].value_counts().head(10).plot(kind="barh", color="teal")
plt.title("Categorías médicas más frecuentes ")
plt.xlabel("Casos")
plt.ylabel("Categoría médica")
plt.gca().invert_yaxis()
plt.tight_layout()
plt.savefig('../public/assets/charts/3_categorias.png', dpi=150)
plt.close()

datasets.append({
    "id": 3,
    "title": "Categorías Médicas",
    "chartPath": "/assets/charts/3_categorias.png",
    "markdownText": "### Categorías médicas más frecuentes\n\nLas categorías más frecuentes en el sistema público son:\n1. Nefrología\n2. Cirugía cardíaca/cardiotorácica\n3. Pediatría\n4. Neurología\n5. Cardiología\n6. Politrauma"
})

print("Generando Gráfico 4: Hospitales...")
plt.figure(figsize=(6, 4))
df["HOSP_TYPE"].value_counts().plot(kind="bar", color=["steelblue", "salmon"])
plt.title("Tipo de Hospital")
plt.xlabel("Tipo")
plt.ylabel("Cantidad")
plt.xticks(rotation=0)
plt.tight_layout()
plt.savefig('../public/assets/charts/4_hospital.png', dpi=150)
plt.close()

datasets.append({
    "id": 4,
    "title": "Hospitales",
    "chartPath": "/assets/charts/4_hospital.png",
    "markdownText": "### Distribución por Tipo de Hospital\n\n- **G**: Hospitales del Gobierno (Públicos)\n- **C**: Corporativos / Privados\n\nSe observa la distribución de atenciones entre el sistema estrictamente gubernamental y los prestadores privados."
})

print("Generando Gráfico 5: Mortalidad...")
plt.figure(figsize=(5, 4))
df["Mortality Y / N"].value_counts().plot(kind="bar", color=["green", "red"])
plt.title("Mortalidad de los pacientes")
plt.xlabel("¿Falleció?")
plt.ylabel("Cantidad")
plt.xticks(rotation=0)
plt.tight_layout()
plt.savefig('../public/assets/charts/5_mortalidad.png', dpi=150)
plt.close()

datasets.append({
    "id": 5,
    "title": "Mortalidad",
    "chartPath": "/assets/charts/5_mortalidad.png",
    "markdownText": "### Mortalidad General del Programa\n\nEl gráfico muestra una diferencia enorme entre pacientes que fallecieron y los que no. La mortalidad es muy baja respecto al total de casos.\n\nLa mayoría de los procedimientos tuvieron resultados favorables; también hay que considerar que algunas intervenciones son tratamientos programados y no necesariamente casos críticos."
})

print("Generando Gráfico 6: Montos...")
plt.figure(figsize=(10, 4))
sns.histplot(df["CLAIM_AMOUNT"], bins=40, kde=True, color="darkorange")
plt.title("Distribución del Monto Cobrado")
plt.xlabel("Monto (Rupias)")
plt.ylabel("Frecuencia")
plt.tight_layout()
plt.savefig('../public/assets/charts/6_montos.png', dpi=150)
plt.close()

datasets.append({
    "id": 6,
    "title": "Montos Cobrados",
    "chartPath": "/assets/charts/6_montos.png",
    "markdownText": "### Distribución de Montos Cobrados\n\nEste gráfico muestra una distribución claramente asimétrica hacia la derecha.\n\nLa mayoría de los tratamientos tienen montos relativamente bajos o medios, hay pocos casos extremadamente caros. Esto puede ser porque el sistema concentra muchos tratamientos de costo moderado. Probablemente las cirugías complejas (oncología, cardíacas, nefrología, etc) expliquen ciertos montos extremos."
})

print("Generando Gráfico 7: Castas...")
fig, ax = plt.subplots(figsize=(10, 5))
datos = df["CASTE_NAME"].value_counts()
total = datos.sum()
bars = ax.barh(datos.index[::-1], datos.values[::-1], color="teal", edgecolor="white")
for bar, val in zip(bars, datos.values[::-1]):
    ax.text(bar.get_width() + 500, bar.get_y() + bar.get_height() / 2, f"{val:,}  ({val/total*100:.1f}%)", va="center", fontsize=9)
ax.set_title("Distribución de Pacientes por Casta")
ax.set_xlabel("Cantidad de casos")
ax.set_ylabel("Casta")
ax.set_xlim(0, datos.max() * 1.22)
plt.tight_layout()
plt.savefig('../public/assets/charts/7_castas.png', dpi=150)
plt.close()

datasets.append({
    "id": 7,
    "title": "Castas",
    "chartPath": "/assets/charts/7_castas.png",
    "markdownText": "### Distribución por Casta Social\n\nEl sistema está diseñado para ayudar a personas que sufrieron discriminación histórica en la India.\n\n* **BC (Backward Classes)**: Clases Atrás en el Desarrollo.\n* **OC (Open Category)**: Categoría General (alta).\n* **Minorities**: Minorías religiosas.\n* **SC (Scheduled Castes)**: Castas Protegidas históricamente discriminadas.\n* **ST (Scheduled Tribes)**: Tribus indígenas originarias."
})

print("Generando Gráfico 8: Edad vs Casta...")
plt.figure(figsize=(10, 5))
orden_castas = ["BC", "OC", "SC", "Minorities", "ST", "Others"]
sns.boxplot(data=df, x="CASTE_NAME", y="AGE", order=orden_castas, palette="Set2")
plt.title("Distribución de Edad según Casta")
plt.xlabel("Casta")
plt.ylabel("Edad")
plt.tight_layout()
plt.savefig('../public/assets/charts/8_edad_casta.png', dpi=150)
plt.close()

datasets.append({
    "id": 8,
    "title": "Edad vs Casta",
    "chartPath": "/assets/charts/8_edad_casta.png",
    "markdownText": "### Edad Promedio según Casta (Boxplot)\n\nLas castas **SC y ST** tienden a tener pacientes más jóvenes en promedio. Esto puede interpretarse de dos formas:\n- Tienen una estructura etaria más joven (comunidades rurales con alta natalidad).\n- Acceden al sistema con enfermedades más graves a edades más tempranas por menor prevención.\n\n**OC (casta alta)** tiende a tener pacientes de mayor edad, lo que refleja que acceden a atención preventiva y llegan al sistema más tarde, cuando ya son adultos mayores."
})

print("Generando Gráfico 9: Mortalidad x Casta...")
mortalidad_casta = (df.groupby("CASTE_NAME")["Mortality Y / N"]
                      .value_counts(normalize=True)
                      .unstack(fill_value=0) * 100)
orden = ["BC", "OC", "SC", "Minorities", "ST", "Others"]

fig, ax1 = plt.subplots(1, 1, figsize=(8, 5))
valores_mort = mortalidad_casta["YES"].reindex(orden)
bars1 = ax1.bar(orden, valores_mort, color="#c94444", edgecolor="white", width=0.6)
ax1.set_title("Tasa de Mortalidad por Casta (%)", fontsize=13)
ax1.set_ylabel("% de pacientes fallecidos")
for bar, val in zip(bars1, valores_mort):
    ax1.text(bar.get_x() + bar.get_width() / 2, val + 0.03, f"{val:.2f}%", ha="center", va="bottom", fontsize=10)
plt.tight_layout()
plt.savefig('../public/assets/charts/9_mortalidad_casta.png', dpi=150)
plt.close()

datasets.append({
    "id": 9,
    "title": "Mort. x Casta",
    "chartPath": "/assets/charts/9_mortalidad_casta.png",
    "markdownText": "### Tasa de Mortalidad por Casta\n\nAnalizando los casos, *Others* tiene un 2,44% de mortalidad, con el segundo número de pacientes más bajo, lo que requeriría estudiar sus condiciones de vida u origen.\n\nEl resto de las castas fluctúan entre 1.8% y 2.1%. Esto nos da indicios de equidad o desigualdad en el desenlace final tras los procedimientos cubiertos."
})

print("Guardando datasets.js...")
json_str = json.dumps(datasets, indent=2, ensure_ascii=False)
js_content = f"export const localDatasets = {json_str};\n"

with open('../src/data/datasets.js', 'w', encoding='utf-8') as f:
    f.write(js_content)

print("✅ Pipeline finalizado con éxito.")