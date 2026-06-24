"""Train mortality models and export a static storytelling artifact."""

from __future__ import annotations

import argparse
import base64
import io
import json
import math
import os
from datetime import datetime, timezone
from pathlib import Path

os.environ.setdefault("MPLCONFIGDIR", str(Path(__file__).with_name(".matplotlib-cache")))

import joblib
import matplotlib
import numpy as np
import pandas as pd

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.calibration import calibration_curve
from sklearn.compose import ColumnTransformer
from sklearn.dummy import DummyClassifier
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    average_precision_score,
    balanced_accuracy_score,
    brier_score_loss,
    confusion_matrix,
    f1_score,
    fbeta_score,
    precision_recall_curve,
    precision_score,
    recall_score,
    roc_auc_score,
    roc_curve,
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler


RANDOM_STATE = 42
TARGET = "Mortality Y / N"
GENERAL_ID = "general"
CASTE_ID = "caste_bc_oc"
AGE_LABELS = ["0-17", "18-34", "35-49", "50-64", "65+"]
CATEGORICAL_BASE = [
    "AGE_GROUP",
    "SEX_CLEAN",
    "CATEGORY_NAME",
    "HOSP_TYPE",
    "DISTRICT_NAME",
    "HOSP_DISTRICT",
    "SRC_REGISTRATION",
]
NUMERIC_FEATURES = ["LOG_PREAUTH_AMT"]
EXCLUDED_FEATURES = [
    "Mortality Y / N (variable objetivo)",
    "MORTALITY_DATE",
    "DISCHARGE_DATE",
    "CLAIM_DATE",
    "CLAIM_AMOUNT",
    "SURGERY_DATE",
    "HOSP_NAME",
    "SURGERY",
    "SURGERY_CODE",
    "CATEGORY_CODE",
    "VILLAGE",
    "MANDAL_NAME",
    "PREAUTH_DATE",
    "ID / indice de fila",
]


def clean_sex(value: object) -> str:
    text = str(value).strip().lower()
    if "female" in text:
        return "Female"
    if "male" in text:
        return "Male"
    return "Other"


def prepare_model_frame(df: pd.DataFrame, include_caste: bool = False) -> tuple[pd.DataFrame, pd.Series]:
    frame = pd.DataFrame(index=df.index)
    age = pd.to_numeric(df["AGE"], errors="coerce")
    frame["AGE_GROUP"] = pd.cut(
        age,
        bins=[-np.inf, 17, 34, 49, 64, np.inf],
        labels=AGE_LABELS,
    ).astype("object")
    frame["SEX_CLEAN"] = df["SEX"].map(clean_sex)

    for column in CATEGORICAL_BASE[2:]:
        frame[column] = df[column].astype("object")

    if include_caste:
        frame["CASTE_NAME"] = df["CASTE_NAME"].astype("object")

    preauth_amount = pd.to_numeric(df["PREAUTH_AMT"], errors="coerce").clip(lower=0)
    frame["LOG_PREAUTH_AMT"] = np.log1p(preauth_amount)
    target = df[TARGET].astype(str).str.strip().str.upper().eq("YES").astype("int8")
    return frame, target


def stratified_split(
    features: pd.DataFrame,
    target: pd.Series,
) -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, pd.Series, pd.Series, pd.Series]:
    x_train, x_temp, y_train, y_temp = train_test_split(
        features,
        target,
        test_size=0.30,
        stratify=target,
        random_state=RANDOM_STATE,
    )
    x_validation, x_test, y_validation, y_test = train_test_split(
        x_temp,
        y_temp,
        test_size=0.50,
        stratify=y_temp,
        random_state=RANDOM_STATE,
    )
    return x_train, x_validation, x_test, y_train, y_validation, y_test


def build_pipeline(categorical_features: list[str]) -> Pipeline:
    categorical = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="most_frequent")),
            (
                "encoder",
                OneHotEncoder(handle_unknown="ignore", drop="first", sparse_output=True),
            ),
        ]
    )
    numeric = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler()),
        ]
    )
    preprocessor = ColumnTransformer(
        transformers=[
            ("categorical", categorical, categorical_features),
            ("numeric", numeric, NUMERIC_FEATURES),
        ]
    )
    classifier = LogisticRegression(
        l1_ratio=0,
        C=1.0,
        solver="saga",
        max_iter=2000,
        random_state=RANDOM_STATE,
    )
    return Pipeline(steps=[("preprocessor", preprocessor), ("classifier", classifier)])


def select_f2_threshold(y_true: pd.Series, probabilities: np.ndarray) -> tuple[float, float]:
    precision, recall, thresholds = precision_recall_curve(y_true, probabilities)
    if len(thresholds) == 0:
        return 0.5, 0.0
    denominator = (4 * precision[:-1]) + recall[:-1]
    f2_scores = np.divide(
        5 * precision[:-1] * recall[:-1],
        denominator,
        out=np.zeros_like(denominator),
        where=denominator != 0,
    )
    best_index = int(np.nanargmax(f2_scores))
    return float(thresholds[best_index]), float(f2_scores[best_index])


def metric_payload(y_true: pd.Series, probabilities: np.ndarray, threshold: float) -> dict:
    predictions = (probabilities >= threshold).astype(int)
    tn, fp, fn, tp = confusion_matrix(y_true, predictions, labels=[0, 1]).ravel()
    specificity = tn / (tn + fp) if (tn + fp) else 0.0
    fraction_positive, mean_predicted = calibration_curve(
        y_true,
        probabilities,
        n_bins=10,
        strategy="quantile",
    )
    return {
        "threshold": round(float(threshold), 6),
        "pr_auc": round(float(average_precision_score(y_true, probabilities)), 6),
        "roc_auc": round(float(roc_auc_score(y_true, probabilities)), 6),
        "precision": round(float(precision_score(y_true, predictions, zero_division=0)), 6),
        "recall": round(float(recall_score(y_true, predictions, zero_division=0)), 6),
        "f1": round(float(f1_score(y_true, predictions, zero_division=0)), 6),
        "f2": round(float(fbeta_score(y_true, predictions, beta=2, zero_division=0)), 6),
        "specificity": round(float(specificity), 6),
        "balanced_accuracy": round(float(balanced_accuracy_score(y_true, predictions)), 6),
        "brier_score": round(float(brier_score_loss(y_true, probabilities)), 6),
        "confusion_matrix": {"tn": int(tn), "fp": int(fp), "fn": int(fn), "tp": int(tp)},
        "calibration": {
            "mean_predicted": [round(float(value), 6) for value in mean_predicted],
            "fraction_positive": [round(float(value), 6) for value in fraction_positive],
        },
    }


def clean_feature_name(name: str) -> str:
    return (
        name.replace("categorical__", "")
        .replace("numeric__", "")
        .replace("_", " ")
    )


def coefficient_payload(pipeline: Pipeline, limit: int = 14) -> tuple[list[dict], list[dict]]:
    feature_names = pipeline.named_steps["preprocessor"].get_feature_names_out()
    coefficients = pipeline.named_steps["classifier"].coef_[0]
    rows = [
        {
            "feature": clean_feature_name(str(feature)),
            "raw_feature": str(feature),
            "coefficient": round(float(coefficient), 6),
            "odds_ratio": round(float(math.exp(np.clip(coefficient, -20, 20))), 6),
            "direction": "higher" if coefficient >= 0 else "lower",
        }
        for feature, coefficient in zip(feature_names, coefficients, strict=True)
    ]
    ranked = sorted(rows, key=lambda row: abs(row["coefficient"]), reverse=True)
    return rows, ranked[:limit]


def model_summary(
    model_id: str,
    title: str,
    source_df: pd.DataFrame,
    include_caste: bool,
) -> tuple[dict, Pipeline, dict]:
    features, target = prepare_model_frame(source_df, include_caste=include_caste)
    categorical_features = CATEGORICAL_BASE + (["CASTE_NAME"] if include_caste else [])
    split = stratified_split(features, target)
    x_train, x_validation, x_test, y_train, y_validation, y_test = split

    pipeline = build_pipeline(categorical_features)
    pipeline.fit(x_train, y_train)
    validation_probabilities = pipeline.predict_proba(x_validation)[:, 1]
    threshold, validation_f2 = select_f2_threshold(y_validation, validation_probabilities)
    test_probabilities = pipeline.predict_proba(x_test)[:, 1]
    metrics = metric_payload(y_test, test_probabilities, threshold)

    dummy = DummyClassifier(strategy="prior")
    dummy.fit(np.zeros((len(y_train), 1)), y_train)
    dummy_probabilities = dummy.predict_proba(np.zeros((len(y_test), 1)))[:, 1]
    dummy_metrics = metric_payload(y_test, dummy_probabilities, 0.5)
    all_coefficients, top_coefficients = coefficient_payload(pipeline)

    summary = {
        "id": model_id,
        "title": title,
        "cohort": {
            "records": int(len(source_df)),
            "deaths": int(target.sum()),
            "prevalence": round(float(target.mean()), 6),
            "train_records": int(len(x_train)),
            "validation_records": int(len(x_validation)),
            "test_records": int(len(x_test)),
        },
        "features": categorical_features + NUMERIC_FEATURES,
        "validation_f2": round(validation_f2, 6),
        "metrics": metrics,
        "dummy_metrics": dummy_metrics,
        "top_coefficients": top_coefficients,
    }

    group_payload = {}
    if include_caste:
        for caste in ["BC", "OC"]:
            mask = source_df.loc[x_test.index, "CASTE_NAME"].eq(caste).to_numpy()
            caste_target = y_test.to_numpy()[mask]
            caste_probabilities = test_probabilities[mask]
            group_payload[caste] = {
                "records": int(mask.sum()),
                "deaths": int(caste_target.sum()),
                "prevalence": round(float(caste_target.mean()), 6),
                "metrics": metric_payload(caste_target, caste_probabilities, threshold),
            }
        summary["group_metrics"] = group_payload
        caste_coefficient = next(
            (row for row in all_coefficients if "CASTE NAME OC" in row["feature"]),
            None,
        )
        summary["caste_coefficient"] = caste_coefficient

    curves = {
        "y_test": y_test.to_numpy(),
        "probabilities": test_probabilities,
    }
    return summary, pipeline, curves


def figure_to_base64(fig: plt.Figure) -> str:
    buffer = io.BytesIO()
    fig.savefig(buffer, format="png", dpi=130, bbox_inches="tight", facecolor="white")
    plt.close(fig)
    return base64.b64encode(buffer.getvalue()).decode("ascii")


def chart_payload(chart_id: str, title: str, description: str, fig: plt.Figure) -> dict:
    return {
        "id": chart_id,
        "title": title,
        "description": description,
        "type": "image/png",
        "data": figure_to_base64(fig),
    }


def plot_class_balance(general: dict, caste: dict) -> plt.Figure:
    labels = ["General", "BC", "OC"]
    values = [
        general["cohort"]["prevalence"] * 100,
        caste["group_metrics"]["BC"]["prevalence"] * 100,
        caste["group_metrics"]["OC"]["prevalence"] * 100,
    ]
    fig, ax = plt.subplots(figsize=(8.2, 5.2))
    bars = ax.bar(labels, values, color=["#2458d6", "#e4614f", "#38a689"])
    ax.set_ylabel("Mortalidad observada (%)")
    ax.set_title("Un desenlace poco frecuente")
    ax.set_ylim(0, max(values) * 1.35)
    ax.spines[["top", "right"]].set_visible(False)
    for bar, value in zip(bars, values, strict=True):
        ax.text(bar.get_x() + bar.get_width() / 2, value + 0.04, f"{value:.2f}%", ha="center", fontweight="bold")
    fig.tight_layout()
    return fig


def plot_curves(results: dict[str, dict], curve_type: str) -> plt.Figure:
    fig, ax = plt.subplots(figsize=(8.2, 5.4))
    colors = {GENERAL_ID: "#2458d6", CASTE_ID: "#e4614f"}
    for model_id, payload in results.items():
        y_true = payload["curves"]["y_test"]
        probabilities = payload["curves"]["probabilities"]
        if curve_type == "pr":
            precision, recall, _ = precision_recall_curve(y_true, probabilities)
            score = average_precision_score(y_true, probabilities)
            ax.plot(recall, precision, color=colors[model_id], linewidth=2.4, label=f"{payload['summary']['title']} (AP={score:.3f})")
            ax.axhline(y_true.mean(), color="#87909d", linestyle="--", label=f"Base={y_true.mean():.3f}")
            ax.set_xlabel("Recall / sensibilidad")
            ax.set_ylabel("Precision")
            ax.set_title("Curva Precision-Recall")
        else:
            false_positive, true_positive, _ = roc_curve(y_true, probabilities)
            score = roc_auc_score(y_true, probabilities)
            ax.plot(false_positive, true_positive, color=colors[model_id], linewidth=2.4, label=f"{payload['summary']['title']} (AUC={score:.3f})")
            ax.plot([0, 1], [0, 1], color="#87909d", linestyle="--", label="Azar")
            ax.set_xlabel("Tasa de falsos positivos")
            ax.set_ylabel("Recall / sensibilidad")
            ax.set_title("Curva ROC")
    ax.spines[["top", "right"]].set_visible(False)
    ax.legend(frameon=False, fontsize=9)
    fig.tight_layout()
    return fig


def plot_confusion(summary: dict) -> plt.Figure:
    matrix = summary["metrics"]["confusion_matrix"]
    values = np.array([[matrix["tn"], matrix["fp"]], [matrix["fn"], matrix["tp"]]])
    fig, ax = plt.subplots(figsize=(6.4, 5.4))
    sns.heatmap(values, annot=True, fmt=",", cmap="Blues", cbar=False, ax=ax)
    ax.set_xticklabels(["Predice no", "Predice si"])
    ax.set_yticklabels(["Real no", "Real si"], rotation=0)
    ax.set_title(f"Matriz de confusión: {summary['title']}")
    fig.tight_layout()
    return fig


def plot_coefficients(summary: dict) -> plt.Figure:
    rows = list(reversed(summary["top_coefficients"][:12]))
    labels = [row["feature"] for row in rows]
    values = [row["coefficient"] for row in rows]
    colors = ["#e4614f" if value > 0 else "#38a689" for value in values]
    fig, ax = plt.subplots(figsize=(9, 6.2))
    ax.barh(labels, values, color=colors)
    ax.axvline(0, color="#172033", linewidth=0.8)
    ax.set_xlabel("Coeficiente logístico")
    ax.set_title(f"Variables con mayor peso: {summary['title']}")
    ax.spines[["top", "right"]].set_visible(False)
    fig.tight_layout()
    return fig


def plot_group_metrics(caste_summary: dict) -> plt.Figure:
    metrics = ["recall", "precision", "specificity"]
    labels = ["Sensibilidad", "Precisión", "Especificidad"]
    bc = [caste_summary["group_metrics"]["BC"]["metrics"][metric] for metric in metrics]
    oc = [caste_summary["group_metrics"]["OC"]["metrics"][metric] for metric in metrics]
    x = np.arange(len(metrics))
    fig, ax = plt.subplots(figsize=(8.4, 5.4))
    width = 0.34
    ax.bar(x - width / 2, bc, width, label="BC", color="#e4614f")
    ax.bar(x + width / 2, oc, width, label="OC", color="#38a689")
    ax.set_xticks(x, labels)
    ax.set_ylim(0, 1)
    ax.set_ylabel("Proporción")
    ax.set_title("Desempeño del mismo modelo por casta")
    ax.legend(frameon=False)
    ax.spines[["top", "right"]].set_visible(False)
    fig.tight_layout()
    return fig


def build_charts(results: dict[str, dict]) -> list[dict]:
    general = results[GENERAL_ID]["summary"]
    caste = results[CASTE_ID]["summary"]
    return [
        chart_payload("class_balance", "Distribución de la variable objetivo", "La mortalidad representa cerca del 2% de los episodios; por eso la exactitud aislada no es una métrica suficiente.", plot_class_balance(general, caste)),
        chart_payload("precision_recall", "Curvas Precision-Recall", "La curva Precision-Recall es la referencia principal ante un desenlace infrecuente.", plot_curves(results, "pr")),
        chart_payload("roc", "Curvas ROC", "La curva ROC resume la capacidad de ordenar episodios de mayor y menor riesgo a traves de todos los umbrales.", plot_curves(results, "roc")),
        chart_payload("confusion_general", "Matriz de confusión del modelo general", "El umbral se eligió en validación para priorizar sensibilidad mediante F2.", plot_confusion(general)),
        chart_payload("coefficients_general", "Variables principales del modelo general", "Los coeficientes describen asociaciones predictivas ajustadas; no demuestran causalidad.", plot_coefficients(general)),
        chart_payload("confusion_caste", "Matriz de confusión del modelo BC/OC", "El segundo modelo usa una única regla para ambas castas y permite una comparación consistente.", plot_confusion(caste)),
        chart_payload("coefficients_caste", "Variables principales del modelo BC/OC", "La casta se incorpora solo con fines comparativos y de auditoría académica.", plot_coefficients(caste)),
        chart_payload("group_metrics", "Métricas separadas para BC y OC", "Comparar sensibilidad, precisión y especificidad permite detectar diferencias de desempeño entre grupos.", plot_group_metrics(caste)),
    ]


def build_sections(results: dict[str, dict]) -> list[dict]:
    general = results[GENERAL_ID]["summary"]
    caste = results[CASTE_ID]["summary"]
    gm = general["metrics"]
    cm = caste["metrics"]
    prevalence = f"{general['cohort']['prevalence'] * 100:.2f}".replace(".", ",")
    general_recall = f"{gm['recall'] * 100:.1f}".replace(".", ",")
    general_precision = f"{gm['precision'] * 100:.1f}".replace(".", ",")
    caste_recall = f"{cm['recall'] * 100:.1f}".replace(".", ",")
    caste_records = f"{caste['cohort']['records']:,}".replace(",", ".")
    return [
        {
            "id": "model-cover",
            "kind": "cover",
            "kicker": "Modelo predictivo",
            "title": "De describir el pasado a estimar el riesgo.",
            "lead": "Dos regresiones logísticas estudian la mortalidad desde una perspectiva general y otra enfocada en BC y OC.",
            "body": "El modelo se entrena localmente y el sitio presenta resultados estáticos. No realiza diagnósticos ni predicciones clínicas en producción.",
            "visual_id": None,
        },
        {
            "id": "model-target",
            "kind": "chart",
            "kicker": "01 / El problema",
            "title": "Encontrar una señal dentro de un evento infrecuente.",
            "lead": f"Solo el {prevalence}% de los episodios registra mortalidad.",
            "body": "Una predicción constante de supervivencia parecería exacta, pero no detectaría ningún fallecimiento. Por eso se priorizan sensibilidad y PR-AUC.",
            "visual_id": "class_balance",
        },
        {
            "id": "model-method",
            "kind": "chart",
            "kicker": "02 / Elección",
            "title": "Regresión logística: explicable, eficiente y auditable.",
            "lead": "El modelo entrega un score de riesgo y coeficientes que permiten rastrear el peso de cada variable.",
            "body": "Se utiliza regularización L2 y un umbral seleccionado exclusivamente en validación para maximizar F2.",
            "visual_id": "precision_recall",
        },
        {
            "id": "model-data",
            "kind": "method",
            "kicker": "03 / Datos",
            "title": "Solo información disponible antes del desenlace.",
            "lead": "Edad, sexo, categoría médica, hospital, geografía, monto preautorizado y fuente de registro.",
            "body": "Se excluyen mortalidad, alta, reclamo, monto reclamado e identificadores. La cirugía y el hospital exactos también se omiten para reducir sobreajuste.",
            "visual_id": None,
        },
        {
            "id": "model-general-results",
            "kind": "chart",
            "kicker": "04 / Modelo general",
            "title": "Una estimación común para toda la población.",
            "lead": f"En test alcanza recall {general_recall}%, precisión {general_precision}% y PR-AUC {gm['pr_auc']:.3f}.",
            "body": "La matriz muestra el costo concreto de priorizar sensibilidad: más episodios se marcan para revisión, a cambio de reducir falsos negativos.",
            "visual_id": "confusion_general",
        },
        {
            "id": "model-general-factors",
            "kind": "chart",
            "kicker": "05 / Interpretación",
            "title": "Qué variables sostienen la predicción general.",
            "lead": "Los coeficientes positivos elevan el score; los negativos lo reducen respecto de su categoría de referencia.",
            "body": "Estas relaciones son predictivas y ajustadas por el resto de variables, pero no deben interpretarse como causas de mortalidad.",
            "visual_id": "coefficients_general",
        },
        {
            "id": "model-caste-results",
            "kind": "chart",
            "kicker": "06 / BC y OC",
            "title": "La misma regla aplicada a las dos castas estudiadas.",
            "lead": f"El subconjunto BC/OC contiene {caste_records} episodios y obtiene recall {caste_recall}%.",
            "body": "Se incorpora la casta como variable para medir su asociación ajustada y auditar diferencias, nunca para justificar decisiones de acceso.",
            "visual_id": "confusion_caste",
        },
        {
            "id": "model-group-audit",
            "kind": "chart",
            "kicker": "07 / Auditoría",
            "title": "Un resultado global puede ocultar errores diferentes.",
            "lead": "Las métricas se calculan por separado para BC y OC sobre el mismo conjunto de reglas.",
            "body": "La comparación de falsos negativos, sensibilidad y precisión permite verificar si el modelo funciona de forma desigual entre grupos.",
            "visual_id": "group_metrics",
        },
        {
            "id": "model-discrimination",
            "kind": "chart",
            "kicker": "08 / Comparación",
            "title": "Dos cohortes, una misma prueba de discriminación.",
            "lead": "Las curvas ROC comparan la capacidad de ordenar riesgos sin depender de un único umbral.",
            "body": "La PR-AUC sigue siendo la métrica principal porque refleja mejor el desempeño sobre la clase minoritaria.",
            "visual_id": "roc",
        },
        {
            "id": "model-conclusion",
            "kind": "conclusion",
            "kicker": "09 / Alcance",
            "title": "Un instrumento académico para orientar preguntas, no decisiones clínicas.",
            "lead": "El modelo identifica perfiles asociados con mayor riesgo y expone dónde comete errores.",
            "body": "No establece causalidad, no reemplaza evaluación médica y no debe utilizarse para asignar o restringir cobertura. Su valor está en convertir el análisis descriptivo en una hipótesis predictiva reproducible.",
            "visual_id": "coefficients_caste",
        },
    ]


def train_models(csv_path: Path, output_path: Path, models_dir: Path) -> dict:
    sns.set_theme(style="whitegrid", font_scale=1.0)
    df = pd.read_csv(csv_path, low_memory=False)
    caste_df = df[df["CASTE_NAME"].isin(["BC", "OC"])].copy()

    results: dict[str, dict] = {}
    for model_id, title, cohort, include_caste in [
        (GENERAL_ID, "Modelo general", df, False),
        (CASTE_ID, "Modelo comparativo BC/OC", caste_df, True),
    ]:
        summary, pipeline, curves = model_summary(model_id, title, cohort, include_caste)
        results[model_id] = {"summary": summary, "pipeline": pipeline, "curves": curves}

    models_dir.mkdir(parents=True, exist_ok=True)
    joblib.dump(results[GENERAL_ID]["pipeline"], models_dir / "mortality_general.joblib", compress=3)
    joblib.dump(results[CASTE_ID]["pipeline"], models_dir / "mortality_bc_oc.joblib", compress=3)

    charts = build_charts(results)
    artifact = {
        "schema_version": 1,
        "dataset_id": 2,
        "title": "Modelo predictivo de mortalidad",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "model_type": "Regresión logística regularizada L2",
        "objective": "Estimar riesgo de mortalidad con información disponible en la preautorización.",
        "prediction_moment": "Preautorización del episodio",
        "methodology": {
            "split": "70% entrenamiento, 15% validacion, 15% test; estratificado; random_state=42",
            "threshold_selection": "Maximo F2 en validacion para priorizar sensibilidad",
            "features": CATEGORICAL_BASE + NUMERIC_FEATURES,
            "caste_model_extra_feature": "CASTE_NAME",
            "excluded_features": EXCLUDED_FEATURES,
        },
        "models": {
            GENERAL_ID: results[GENERAL_ID]["summary"],
            CASTE_ID: results[CASTE_ID]["summary"],
        },
        "charts": charts,
        "sections": build_sections(results),
        "limitations": [
            "Modelo academico y no validado clinicamente.",
            "Las asociaciones predictivas no demuestran causalidad.",
            "La division aleatoria no evalua cambios temporales futuros.",
            "El score depende de la calidad y representatividad del registro administrativo.",
            "CASTE_NAME se utiliza solo para comparacion y auditoria de equidad.",
        ],
        "expected_outcomes": [
            "Identificar perfiles asociados con mayor mortalidad.",
            "Cuantificar falsos negativos y sensibilidad del modelo.",
            "Comparar el desempeno predictivo entre BC y OC bajo una misma regla.",
        ],
    }
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(artifact, ensure_ascii=False), encoding="utf-8")
    return artifact


def main() -> None:
    root = Path(__file__).parents[1]
    parser = argparse.ArgumentParser()
    parser.add_argument("--csv", default=str(Path(__file__).with_name("ntrarogyaseva.csv")))
    parser.add_argument("--output", default=str(root / "public" / "datasets" / "model_2.json"))
    parser.add_argument("--models-dir", default=str(Path(__file__).with_name("models")))
    args = parser.parse_args()

    artifact = train_models(Path(args.csv), Path(args.output), Path(args.models_dir))
    for model in artifact["models"].values():
        metrics = model["metrics"]
        print(
            f"{model['title']}: n={model['cohort']['records']:,}, "
            f"PR-AUC={metrics['pr_auc']:.4f}, recall={metrics['recall']:.4f}, "
            f"precision={metrics['precision']:.4f}"
        )
    print(f"Artefacto generado: {args.output}")


if __name__ == "__main__":
    main()
