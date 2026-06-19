import re
import os

filepath = 'd:/Github/Taller2web/pipeline/ntrarogyaseva_base_taller_.py'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Reemplazar plt.show() con add_chart(plt.gcf())
content = content.replace("plt.show()", "add_chart(plt.gcf())")

# 2. Inyectar el bloque de setup justo después de los imports
setup_code = """
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

import base64
import io
import json
import os
from datetime import datetime, timezone

def fig_to_base64(fig) -> str:
    buf = io.BytesIO()
    fig.savefig(buf, format='png', bbox_inches='tight', dpi=120)
    buf.seek(0)
    encoded = base64.b64encode(buf.read()).decode('utf-8')
    plt.close(fig)
    return encoded

charts = []
chart_counter = 1

def add_chart(fig):
    global chart_counter
    try:
        chart_id = f"chart_{chart_counter:02d}"
        title = f"Chart {chart_counter}"
        if fig._suptitle:
            title = fig._suptitle.get_text()
        elif fig.axes and fig.axes[0].get_title():
            title = fig.axes[0].get_title()
            
        charts.append({'id': chart_id, 'title': title,
                       'type': 'image/png', 'data': fig_to_base64(fig)})
        print(f'  [OK] {chart_id}')
        chart_counter += 1
    except Exception as e:
        print(f'  [WARN] No se pudo generar chart: {e}')
"""

content = content.replace("import matplotlib.pyplot as plt", setup_code, 1)

# 3. Al final, añadir código para exportar JSON
export_code = """
# Exportacion a JSON
DATASET_ID = 2
DATASET_TITLE = 'NTR Arogya Seva'
ARTIFACT_FILENAME = f'artifact_{DATASET_ID}.json'

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(BASE_DIR, '..', 'public', 'datasets')

artifact = {
    'dataset_id': DATASET_ID,
    'title': DATASET_TITLE,
    'generated_at': datetime.now(timezone.utc).isoformat(),
    'notes': "Análisis de pacientes que recibieron cirugías/procedimientos médicos cubiertos por el seguro público de India.",
    'charts': charts,
}

os.makedirs(OUTPUT_DIR, exist_ok=True)
output_path = os.path.join(OUTPUT_DIR, ARTIFACT_FILENAME)
with open(output_path, 'w', encoding='utf-8') as f:
    f.write(json.dumps(artifact, ensure_ascii=False))
print(f'\\n✅ Pipeline completado exitosamente.')
print(f'   Archivo guardado en: {output_path}')
"""

content += "\n" + export_code

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Rewritten successfully")
