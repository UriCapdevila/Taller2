
# %% [markdown]
# # Dataset 1 — Patient Segmentation
# Pipeline que reproduce el análisis del notebook original, exporta cada gráfico
# en Base64 y sube `artifact_1.json` a Google Drive.
#
# **Antes de ejecutar en Colab:**
# 1. Sube `patient_segmentation_dataset.csv` a `/content/`
# 2. Panel izquierdo → 🔑 Secrets → agrega:
#    - `GOOGLE_SERVICE_ACCOUNT_JSON` → contenido completo del JSON de tu Service Account
#    - `GOOGLE_DRIVE_FOLDER_ID`       → ID de la carpeta de Drive destino

# %% — Celda 1: Instalar dependencias
# !pip install --quiet google-api-python-client google-auth

# %% — Celda 2: Imports
import sys
import json
import base64
import io
from datetime import datetime, timezone

import pandas as pd
import numpy as np
import matplotlib
matplotlib.use('Agg')  # backend sin GUI, necesario para exportar a bytes en Colab
import matplotlib.pyplot as plt
import matplotlib.ticker as mticker
import seaborn as sns

from google.colab import userdata
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload
from google.oauth2 import service_account

print('Imports OK')

# %% — Celda 3: Configuración
DATASET_ID        = 1
DATASET_TITLE     = 'Patient Segmentation Dataset'
ARTIFACT_FILENAME = f'artifact_{DATASET_ID}.json'
DATASET_PATH      = '/content/patient_segmentation_dataset.csv'
DRIVE_SCOPES      = ['https://www.googleapis.com/auth/drive']
print(f'Artefacto destino: {ARTIFACT_FILENAME}')

# %% — Celda 4: Autenticación con Google Drive
def build_drive_service():
    try:
        sa_json = userdata.get('GOOGLE_SERVICE_ACCOUNT_JSON')
    except Exception as e:
        print(f'[ERROR] No se pudo leer GOOGLE_SERVICE_ACCOUNT_JSON desde Secrets: {e}')
        sys.exit(1)
    try:
        sa_info = json.loads(sa_json)
        creds   = service_account.Credentials.from_service_account_info(
                      sa_info, scopes=DRIVE_SCOPES)
        svc     = build('drive', 'v3', credentials=creds)
        print('[OK] Autenticación con Google Drive exitosa.')
        return svc
    except Exception as e:
        print(f'[ERROR] Fallo al construir cliente Drive: {e}')
        sys.exit(1)

drive_service = build_drive_service()

# %% — Celda 5: Carga y validación del dataset
try:
    df = pd.read_csv(DATASET_PATH, parse_dates=['Last_Visit_Date'])
    if df.empty:
        print('[ERROR] El dataset está vacío.')
        sys.exit(1)
    print(f'[OK] Dataset cargado: {len(df)} filas, {len(df.columns)} columnas.')
    print(f'\nValores nulos por columna:\n{df.isnull().sum()}')
except FileNotFoundError:
    print(f'[ERROR] Archivo no encontrado: {DATASET_PATH}')
    sys.exit(1)
except Exception as e:
    print(f'[ERROR] Fallo al cargar dataset: {e}')
    sys.exit(1)

# %% — Celda 6: Preprocesamiento
df['tiene_condicion'] = df['Primary_Condition'].notna()

def classify_bmi(bmi):
    if bmi < 18.5: return 'Bajo peso'
    elif bmi < 25: return 'Normal'
    elif bmi < 30: return 'Sobrepeso'
    elif bmi < 35: return 'Obesidad I'
    elif bmi < 40: return 'Obesidad II'
    else:          return 'Obesidad III'

df['BMI_Category'] = df['BMI'].apply(classify_bmi)
df['Age_Group']    = pd.cut(df['Age'], bins=[0, 30, 45, 60, 75, 100],
                             labels=['<30', '30-44', '45-59', '60-74', '75+'])

bmi_order  = ['Bajo peso', 'Normal', 'Sobrepeso', 'Obesidad I', 'Obesidad II', 'Obesidad III']
bmi_colors = ['#74ADD1', '#4DAC26', '#FEE08B', '#F46D43', '#D73027', '#A50026']
age_palette = sns.color_palette('coolwarm', 5)

# Orden para gráfico de visitas por condición (calculado antes de usarlo)
cond_visit_order = (df.groupby('Primary_Condition')['Annual_Visits']
                      .mean().sort_values(ascending=False).index)

print('[OK] Preprocesamiento completado.')

# %% — Celda 7: Utilidad fig → Base64 + lista de charts
def fig_to_base64(fig) -> str:
    """Exporta figura matplotlib a Base64 PNG (sin prefijo data URI)."""
    buf = io.BytesIO()
    fig.savefig(buf, format='png', bbox_inches='tight', dpi=120)
    buf.seek(0)
    encoded = base64.b64encode(buf.read()).decode('utf-8')
    plt.close(fig)
    return encoded

charts = []

def add_chart(chart_id: str, title: str, fig):
    try:
        charts.append({'id': chart_id, 'title': title,
                       'type': 'image/png', 'data': fig_to_base64(fig)})
        print(f'  [OK] {chart_id}')
    except Exception as e:
        print(f'  [WARN] No se pudo generar {chart_id}: {e}')

print('[INFO] Iniciando generación de gráficos...')

# %% — Celda 8: Sección 1 — Perfil de los pacientes

# --- Chart 01: Distribución de Edad ---
fig = plt.figure(figsize=(6, 5), facecolor='#F8F9FA')
ax  = fig.add_subplot()
ax.grid(True, linestyle='-', alpha=0.2, color='gray')
ax.hist(df['Age'], bins=20, color='#2C7BB6', edgecolor='white', linewidth=0.8)
ax.axvline(df['Age'].mean(),   color='#D7191C', linestyle='--', linewidth=1.5,
           label=f'Media: {df["Age"].mean():.1f} años')
ax.axvline(df['Age'].median(), color='orange',  linestyle='--', linewidth=1.5,
           label=f'Mediana: {df["Age"].median():.1f} años')
ax.set_title('Distribución de Edad')
ax.set_xlabel('Edad (años)')
ax.set_ylabel('Cantidad de pacientes')
ax.legend(fontsize=9)
add_chart('chart_01_age_dist', 'Distribución de Edad', fig)

# --- Chart 02: Distribución de Género ---
fig = plt.figure(figsize=(6, 5), facecolor='#F8F9FA')
ax  = fig.add_subplot()
gender_counts = df['Gender'].value_counts()
wedges, texts, autotexts = ax.pie(
    gender_counts, labels=gender_counts.index, autopct='%1.1f%%',
    colors=['#2C7BB6', '#E8A838'], startangle=90, pctdistance=0.75,
    wedgeprops={'edgecolor': 'white', 'linewidth': 2})
for at in autotexts:
    at.set_fontsize(11)
    at.set_fontweight('bold')
ax.set_title('Distribución de Género')
add_chart('chart_02_gender_dist', 'Distribución de Género', fig)

# %% — Celda 9: Sección 2 — Estado de salud

# --- Chart 03: Frecuencia de Condiciones Primarias ---
fig, ax = plt.subplots(figsize=(8, 5), facecolor='#F8F9FA')
ax.grid(True, linestyle='-', alpha=0.1, color='gray')
cond_counts  = df['Primary_Condition'].value_counts()
colors_cond  = sns.color_palette('Set2', len(cond_counts))
bars = ax.barh(cond_counts.index[::-1], cond_counts.values[::-1], color=colors_cond[::-1])
ax.set_title('Frecuencia por Condición Primaria')
ax.set_xlabel('Número de pacientes')
for bar, val in zip(bars, cond_counts.values[::-1]):
    ax.text(bar.get_width() + 2, bar.get_y() + bar.get_height() / 2,
            f'{val} ({val/len(df)*100:.1f}%)', va='center', fontsize=9)
add_chart('chart_03_primary_condition', 'Frecuencia por Condición Primaria', fig)

# --- Chart 04: Edad por Condición Primaria ---
fig, ax = plt.subplots(figsize=(8, 5), facecolor='#F8F9FA')
ax.grid(True, linestyle='-', alpha=0.2, color='gray')
sns.boxplot(data=df.dropna(subset=['Primary_Condition']),
            x='Primary_Condition', y='Age', palette='Set2', ax=ax,
            flierprops={'marker': 'o', 'markersize': 3, 'alpha': 0.4})
ax.set_title('Distribución de Edad por Condición Primaria')
ax.set_xlabel('')
ax.set_ylabel('Edad')
ax.tick_params(axis='x', rotation=20)
add_chart('chart_04_age_by_condition', 'Distribución de Edad por Condición Primaria', fig)

# --- Chart 05: Condiciones Crónicas ---
fig, ax = plt.subplots(figsize=(8, 5), facecolor='#F8F9FA')
ax.grid(True, linestyle='-', alpha=0.1, color='gray')
chronic_counts = df['Num_Chronic_Conditions'].value_counts().sort_index()
ax.bar(chronic_counts.index, chronic_counts.values,
       color=sns.color_palette('YlOrRd', len(chronic_counts)),
       edgecolor='white', linewidth=1)
ax.set_title('Distribución de cantidad de Condiciones Crónicas')
ax.set_xlabel('Número de condiciones crónicas')
ax.set_ylabel('Cantidad de pacientes')
ax.set_xticks(chronic_counts.index)
for i, val in zip(chronic_counts.index, chronic_counts.values):
    ax.text(i, val + 5, str(val), ha='center', fontsize=10, fontweight='bold')
add_chart('chart_05_chronic_conditions', 'Distribución de Condiciones Crónicas', fig)

# --- Chart 06: Pacientes por Categoría BMI ---
fig, ax = plt.subplots(figsize=(8, 5), facecolor='#F8F9FA')
ax.grid(True, linestyle='-', alpha=0.2, color='gray')
bmi_cat_counts = df['BMI_Category'].value_counts().reindex(bmi_order)
bars = ax.bar(bmi_cat_counts.index, bmi_cat_counts.values,
              color=bmi_colors, edgecolor='white', linewidth=1.5)
ax.set_title('Pacientes por Categoría de BMI (OMS)')
ax.set_xlabel('Categoría')
ax.set_ylabel('Cantidad')
ax.tick_params(axis='x', rotation=30)
for bar, val in zip(bars, bmi_cat_counts.values):
    ax.text(bar.get_x() + bar.get_width() / 2, bar.get_height() + 3,
            f'{val}\n({val/len(df)*100:.1f}%)', ha='center', fontsize=9, fontweight='bold')
obeso_pct = (df['BMI'] >= 30).sum() / len(df) * 100
print(f'\n{obeso_pct:.1f}% de los pacientes tienen obesidad (BMI ≥ 30)')
add_chart('chart_06_bmi_categories', 'Pacientes por Categoría de BMI (OMS)', fig)

# %% — Celda 10: Sección 3 — Uso del sistema de salud

# --- Chart 07: Visitas Anuales ---
fig, ax = plt.subplots(figsize=(8, 5), facecolor='#F8F9FA')
ax.grid(True, linestyle='-', alpha=0.2, color='gray')
visit_counts = df['Annual_Visits'].value_counts().sort_index()
ax.bar(visit_counts.index, visit_counts.values, color='#2C7BB6', edgecolor='white')
ax.axvline(df['Annual_Visits'].mean(), color='#D7191C', linestyle='--',
           label=f'Media: {df["Annual_Visits"].mean():.1f}')
ax.set_title('Distribución de Visitas Anuales')
ax.set_xlabel('Visitas por año')
ax.set_ylabel('Pacientes')
ax.legend()
for i, val in zip(visit_counts.index, visit_counts.values):
    ax.text(i, val + 1, str(val), ha='center', fontsize=9, fontweight='bold')
add_chart('chart_07_annual_visits', 'Distribución de Visitas Anuales', fig)

# --- Chart 08: Facturación Promedio ---
fig, ax = plt.subplots(figsize=(8, 5), facecolor='#F8F9FA')
ax.grid(True, linestyle='-', alpha=0.2, color='gray')
ax.hist(df['Avg_Billing_Amount'], bins=30, color='#5AAB61', edgecolor='white')
ax.axvline(df['Avg_Billing_Amount'].median(), color='#D7191C', linestyle='--',
           label=f'Mediana: ${df["Avg_Billing_Amount"].median():,.0f}')
ax.set_title('Distribución del Monto de Facturación Promedio')
ax.set_xlabel('Monto promedio ($)')
ax.set_ylabel('Pacientes')
ax.legend()
ax.xaxis.set_major_formatter(mticker.FuncFormatter(lambda x, _: f'${x:,.0f}'))
add_chart('chart_08_billing_dist', 'Distribución del Monto de Facturación Promedio', fig)

# --- Chart 09: Tipo de Seguro (pie) ---
fig, ax = plt.subplots(figsize=(8, 5), facecolor='#F8F9FA')
ins_counts = df['Insurance_Type'].value_counts()
ins_colors = sns.color_palette('Set1', len(ins_counts))
wedges, texts, autotexts = ax.pie(
    ins_counts, labels=ins_counts.index, autopct='%1.1f%%',
    colors=ins_colors, startangle=140,
    wedgeprops={'edgecolor': 'white', 'linewidth': 2})
ax.set_title('Tipo de Seguro Médico')
add_chart('chart_09_insurance_type', 'Tipo de Seguro Médico', fig)

# --- Chart 10: Tasa de Cuidado Preventivo por Seguro ---
fig, ax = plt.subplots(figsize=(8, 5), facecolor='#F8F9FA')
ax.grid(True, linestyle='-', alpha=0.2, color='gray')
prev_by_ins = (df.groupby('Insurance_Type')['Preventive_Care_Flag']
                 .mean().sort_values(ascending=False) * 100)
colors = sns.color_palette('Set1', len(prev_by_ins))
bars = ax.bar(prev_by_ins.index, prev_by_ins.values, color=colors, edgecolor='white')
ax.set_title('Tasa de Cuidado Preventivo por Tipo de Seguro')
ax.set_xlabel('Tipo de Seguro')
ax.set_ylabel('% con cuidado preventivo')
ax.set_ylim(0, 70)
for bar, val in zip(bars, prev_by_ins.values):
    ax.text(bar.get_x() + bar.get_width() / 2, bar.get_height() + 1,
            f'{val:.1f}%', ha='center', fontsize=10, fontweight='bold')
add_chart('chart_10_preventive_care', 'Tasa de Cuidado Preventivo por Tipo de Seguro', fig)

# --- Chart 11: Días desde Última Visita ---
fig, ax = plt.subplots(figsize=(8, 5), facecolor='#F8F9FA')
ax.grid(True, linestyle='-', alpha=0.2, color='gray')
ax.hist(df['Days_Since_Last_Visit'], bins=25, color='#8E6DBF', edgecolor='white')
ax.axvline(df['Days_Since_Last_Visit'].median(), color='#D7191C', linestyle='--',
           label=f'Mediana: {df["Days_Since_Last_Visit"].median():.0f} días')
ax.set_title('Días Transcurridos desde la Última Visita')
ax.set_xlabel('Días')
ax.set_ylabel('Pacientes')
ax.legend()
add_chart('chart_11_days_since_visit', 'Días desde la Última Visita', fig)

# --- Chart 12: Facturación por Tipo de Seguro (boxplot) ---
fig, ax = plt.subplots(figsize=(8, 5), facecolor='#F8F9FA')
ax.grid(True, linestyle='-', alpha=0.2, color='gray')
ins_order = (df.groupby('Insurance_Type')['Avg_Billing_Amount']
               .median().sort_values(ascending=False).index)
sns.boxplot(data=df, x='Insurance_Type', y='Avg_Billing_Amount', hue='Insurance_Type',
            order=ins_order, palette='Set1', ax=ax,
            flierprops={'marker': 'o', 'markersize': 3, 'alpha': 0.4})
ax.set_title('Monto de Facturación promedio por Tipo de Seguro', fontsize=14, fontweight='bold')
ax.set_xlabel('Tipo de Seguro')
ax.set_ylabel('Facturación promedio ($)')
ax.yaxis.set_major_formatter(mticker.FuncFormatter(lambda x, _: f'${x:,.0f}'))
add_chart('chart_12_billing_by_insurance', 'Facturación por Tipo de Seguro', fig)
print('\nEstadísticas de facturación por tipo de seguro:')
print(df.groupby('Insurance_Type')['Avg_Billing_Amount'].agg(['median','mean','std']).round(2))

# %% — Celda 11: Sección 4 — Relaciones entre variables

# --- Chart 13: Correlación entre variables numéricas ---
fig, ax = plt.subplots(figsize=(7, 5), facecolor='#F8F9FA')
sns.heatmap(
    df[['Age', 'BMI', 'Num_Chronic_Conditions', 'Annual_Visits', 'Avg_Billing_Amount']].corr(),
    annot=True, cmap='coolwarm', ax=ax)
ax.set_title('Correlación entre variables numéricas')
add_chart('chart_13_correlation_heatmap', 'Correlación entre Variables Numéricas', fig)

# --- Chart 14: Media de Visitas por Condición ---
fig, ax = plt.subplots(figsize=(8, 5), facecolor='#F8F9FA')
ax.grid(True, linestyle='-', alpha=0.2, color='gray')
mean_visits = (df.groupby('Primary_Condition')['Annual_Visits']
                 .agg(['mean', 'sem']).reindex(cond_visit_order))
colors = sns.color_palette('Set2', len(mean_visits))
bars = ax.barh(mean_visits.index[::-1], mean_visits['mean'][::-1],
               xerr=mean_visits['sem'][::-1] * 1.96, color=colors[::-1],
               capsize=4, error_kw={'linewidth': 1.5})
ax.set_title('Media de Visitas por Condición')
ax.set_xlabel('Visitas anuales promedio')
for bar, val in zip(bars, mean_visits['mean'][::-1]):
    ax.text(bar.get_width() + 0.05, bar.get_y() + bar.get_height() / 2,
            f'{val:.2f}', va='center', fontsize=9)
add_chart('chart_14_visits_by_condition', 'Media de Visitas por Condición', fig)
print('\nMedia de visitas anuales por condición primaria:')
print(df.groupby('Primary_Condition')['Annual_Visits']
        .agg(['mean','median','count']).sort_values('mean', ascending=False).round(2))

# --- Chart 15: Condiciones Crónicas por Grupo Etario ---
fig, ax = plt.subplots(figsize=(8, 5), facecolor='#F8F9FA')
ax.grid(True, linestyle='-', alpha=0.2, color='gray')
sns.boxplot(data=df, x='Age_Group', y='Num_Chronic_Conditions', hue='Age_Group',
            legend=False, palette=age_palette,
            order=['<30', '30-44', '45-59', '60-74', '75+'], ax=ax)
ax.set_title('Condiciones Crónicas por Grupo Etario')
ax.set_xlabel('Grupo de edad')
ax.set_ylabel('N° de condiciones crónicas')
add_chart('chart_15_chronic_by_age', 'Condiciones Crónicas por Grupo Etario', fig)

# --- Chart 16: Visitas Anuales por Grupo Etario (violin) ---
fig, ax = plt.subplots(figsize=(8, 5), facecolor='#F8F9FA')
ax.grid(True, linestyle='-', alpha=0.2, color='gray')
sns.violinplot(data=df, x='Age_Group', y='Annual_Visits',
               palette=age_palette, ax=ax, inner='quartile',
               order=['<30', '30-44', '45-59', '60-74', '75+'],
               hue='Age_Group', legend=False)
ax.set_title('Visitas Anuales por Grupo Etario')
ax.set_xlabel('Grupo de edad')
ax.set_ylabel('Visitas anuales')
add_chart('chart_16_visits_by_age', 'Visitas Anuales por Grupo Etario', fig)
print('\nMedia por grupo etario:')
print(df.groupby('Age_Group', observed=True)[['Num_Chronic_Conditions','Annual_Visits']].mean().round(2))

# --- Chart 17: BMI por Condición Primaria ---
fig, ax = plt.subplots(figsize=(8, 5), facecolor='#F8F9FA')
ax.grid(True, linestyle='-', alpha=0.2, color='gray')
bmi_cond_order = df.groupby('Primary_Condition')['BMI'].median().sort_values(ascending=False).index
sns.boxplot(data=df, x='Primary_Condition', y='BMI',
            order=bmi_cond_order, palette='RdYlGn_r', ax=ax,
            flierprops={'marker': 'o', 'markersize': 3, 'alpha': 0.4})
for thresh, label, color in zip([18.5, 25, 30],
                                  ['Bajo peso', 'Sobrepeso', 'Obesidad'],
                                  ['#74ADD1', '#FEE08B', '#D73027']):
    ax.axhline(thresh, color=color, linestyle='--', linewidth=1.2, alpha=0.8,
               label=f'{label} (BMI={thresh})')
ax.set_title('BMI por Condición Primaria (con umbrales OMS)', fontsize=14, fontweight='bold')
ax.set_xlabel('Condición Primaria')
ax.set_ylabel('BMI')
ax.tick_params(axis='x', rotation=40)
ax.legend(loc='upper right', fontsize=9)
add_chart('chart_17_bmi_by_condition', 'BMI por Condición Primaria (umbrales OMS)', fig)
print('\nBMI mediano por condición:')
print(df.groupby('Primary_Condition')['BMI'].agg(['median','mean'])
        .sort_values('median', ascending=False).round(2))

# --- Chart 18: Facturación por N° de Condiciones Crónicas ---
fig, ax = plt.subplots(figsize=(8, 5), facecolor='#F8F9FA')
ax.grid(True, linestyle='-', alpha=0.2, color='gray')
chronic_billing = df.groupby('Num_Chronic_Conditions')['Avg_Billing_Amount'].agg(['mean', 'sem'])
ax.bar(chronic_billing.index, chronic_billing['mean'],
       yerr=chronic_billing['sem'] * 1.96,
       color=sns.color_palette('YlOrRd', len(chronic_billing)),
       capsize=5, edgecolor='white')
ax.set_title('Facturación promedio por N° de Condiciones Crónicas')
ax.set_xlabel('N° de condiciones crónicas')
ax.set_ylabel('Facturación promedio ($)')
ax.yaxis.set_major_formatter(mticker.FuncFormatter(lambda x, _: f'${x:,.0f}'))
ax.set_xticks(chronic_billing.index)
add_chart('chart_18_billing_by_chronic', 'Facturación por N° de Condiciones Crónicas', fig)

# --- Chart 19: Heatmap Seguro × Condiciones Crónicas ---
fig, ax = plt.subplots(figsize=(8, 5), facecolor='#F8F9FA')
pivot = df.pivot_table(values='Avg_Billing_Amount', index='Insurance_Type',
                        columns='Num_Chronic_Conditions', aggfunc='mean')
sns.heatmap(pivot, annot=True, fmt='.0f', cmap='YlOrRd', ax=ax,
            linewidths=0.5, cbar_kws={'label': 'Facturación media ($)'})
ax.set_title('Heatmap: Facturación media\n(Seguro × N° Condiciones Crónicas)')
ax.set_xlabel('N° de condiciones crónicas')
ax.set_ylabel('Tipo de seguro')
add_chart('chart_19_billing_heatmap', 'Heatmap Facturación: Seguro × Condiciones Crónicas', fig)

print(f'\n[INFO] Total de charts generados: {len(charts)}')

# %% — Celda 12: Notas analíticas
notes = """## Patient Segmentation Dataset — Análisis Exploratorio

### 1. Perfil de los pacientes
- La distribución de edad es aproximadamente normal entre los 18 y 80 años, con **media y mediana cercanas a los 51 años**, representando ampliamente a la población adulta.
- El balance de género es **equitativo** entre los pacientes del dataset.

### 2. Estado de salud
- Los **495 valores nulos** en `Primary_Condition` representan pacientes sin condición primaria registrada: pacientes sanos o de atención puntual.
- Las condiciones más frecuentes son **Hipertensión, Obesidad, Ansiedad y Artritis**.
- Todas las condiciones presentan una **edad mínima de 40 años**.
- La mayoría de los pacientes presenta **una sola condición crónica** (1,074 casos); 431 pacientes tienen 2 o 3 condiciones, requiriendo atención de mayor complejidad.
- Un porcentaje significativo de pacientes presenta **BMI en zona de obesidad (BMI ≥ 30)**, consistente con la alta prevalencia de condiciones metabólicas y cardiovasculares.

### 3. Uso del sistema de salud
- Las visitas anuales muestran distribución heterogénea, sugiriendo **segmentos distintos de necesidad**.
- La facturación presenta **alta variabilidad** con cola derecha pronunciada: un subgrupo pequeño genera costos desproporcionadamente altos.
- Los pacientes con **Self-Pay** tienen la menor tasa de cuidado preventivo, consistente con barreras económicas. **Medicare lidera con 48.6%**, posiblemente por pruebas de detección preventivas incluidas en la cobertura.
- El **50% de los pacientes lleva más de 183 días sin visita**, indicando una posible brecha en el seguimiento continuo.
- **Medicare** presenta la mediana y promedio de facturación más altos ($4,086 y $4,458), posiblemente por tratamientos de mayor complejidad.
- **Self-Pay** muestra los montos más bajos ($2,692 de mediana).
- Se identificaron **valores atípicos en Medicaid y Private**, indicando casos clínicos de costos excepcionalmente elevados.

### 4. Relaciones entre variables
- **Age y Num_Chronic_Conditions (r=0.8)**: La relación más fuerte del dataset. A mayor edad, más condiciones crónicas acumuladas.
- **Num_Chronic_Conditions y Avg_Billing_Amount (r=0.43)**: A más condiciones, más facturación.
- **Age y Annual_Visits (r=0.37)**: Los pacientes mayores visitan más al médico.
- **BMI y resto de variables (r≈0.03)**: El BMI no correlaciona con ninguna variable, posiblemente por características del dataset.
- Condiciones como **Asma, Depresión y Obesidad** generan la mayor presión sobre el sistema de atención médica.
- A pesar de que condiciones como diabetes e hipertensión tienen al BMI como factor de riesgo, los boxplots muestran **medianas muy similares entre todas las condiciones** (aprox. 30).
"""

# %% — Celda 13: Construcción del artefacto JSON
artifact = {
    'dataset_id':   DATASET_ID,
    'title':        DATASET_TITLE,
    'generated_at': datetime.now(timezone.utc).isoformat(),
    'notes':        notes,
    'charts':       charts,
}

artifact_bytes = json.dumps(artifact, ensure_ascii=False).encode('utf-8')
print(f'[INFO] Artefacto construido.')
print(f'       Charts incluidos : {len(charts)}')
print(f'       Tamaño estimado  : {len(artifact_bytes) / 1024:.1f} KB')

# %% — Celda 14: Subida / sobrescritura en Google Drive
def get_folder_id() -> str:
    try:
        folder_id = userdata.get('GOOGLE_DRIVE_FOLDER_ID')
        if not folder_id:
            raise ValueError('GOOGLE_DRIVE_FOLDER_ID está vacío.')
        return folder_id
    except Exception as e:
        print(f'[ERROR] No se pudo leer GOOGLE_DRIVE_FOLDER_ID desde Secrets: {e}')
        sys.exit(1)

def upload_artifact(service, folder_id: str, filename: str, content: bytes):
    """Sube o sobrescribe el artefacto JSON en Google Drive (sin duplicados)."""
    media = MediaIoBaseUpload(io.BytesIO(content), mimetype='application/json', resumable=False)

    # Buscar archivo existente con el mismo nombre en la carpeta
    try:
        query   = f"name='{filename}' and '{folder_id}' in parents and trashed=false"
        results = service.files().list(q=query, fields='files(id, name)', spaces='drive').execute()
        existing = results.get('files', [])
    except Exception as e:
        print(f'[ERROR] Fallo al buscar archivo en Drive: {e}')
        sys.exit(1)

    try:
        if existing:
            file_id = existing[0]['id']
            service.files().update(fileId=file_id, media_body=media).execute()
            print(f'[OK] Artefacto actualizado (sobrescrito): {filename}  (id={file_id})')
        else:
            file_metadata = {'name': filename, 'parents': [folder_id], 'mimeType': 'application/json'}
            created = service.files().create(body=file_metadata, media_body=media, fields='id').execute()
            print(f'[OK] Artefacto creado: {filename}  (id={created["id"]})')
    except Exception as e:
        print(f'[ERROR] Fallo al subir el artefacto a Drive: {e}')
        sys.exit(1)

folder_id = get_folder_id()
upload_artifact(drive_service, folder_id, ARTIFACT_FILENAME, artifact_bytes)
print('\n✅ Pipeline completado exitosamente.')
print(f'   Archivo en Drive: {ARTIFACT_FILENAME}')
print(f'   Carpeta ID      : {folder_id}')
