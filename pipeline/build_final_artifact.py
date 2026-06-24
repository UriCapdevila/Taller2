import argparse
import base64
import io
import json
import os
import re
import warnings
from datetime import datetime, timezone
from pathlib import Path

os.environ.setdefault("MPLCONFIGDIR", str(Path(__file__).with_name(".matplotlib-cache")))

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt


DATASET_ID = 2
DATASET_TITLE = "NTR Arogya Seva"


WINDOWS_1252_BYTES = {
    "\u20ac": 0x80,
    "\u201a": 0x82,
    "\u0192": 0x83,
    "\u201e": 0x84,
    "\u2026": 0x85,
    "\u2020": 0x86,
    "\u2021": 0x87,
    "\u02c6": 0x88,
    "\u2030": 0x89,
    "\u0160": 0x8A,
    "\u2039": 0x8B,
    "\u0152": 0x8C,
    "\u017d": 0x8E,
    "\u2018": 0x91,
    "\u2019": 0x92,
    "\u201c": 0x93,
    "\u201d": 0x94,
    "\u2022": 0x95,
    "\u2013": 0x96,
    "\u2014": 0x97,
    "\u02dc": 0x98,
    "\u2122": 0x99,
    "\u0161": 0x9A,
    "\u203a": 0x9B,
    "\u0153": 0x9C,
    "\u017e": 0x9E,
    "\u0178": 0x9F,
}


def repair_mojibake(value: str) -> str:
    if not isinstance(value, str) or not re.search(r"(?:\u00c3.|\u00c2.|\u00e2.)", value):
        return value

    try:
        byte_values = []
        for char in value:
            code = ord(char)
            if code <= 0xFF:
                byte_values.append(code)
            elif char in WINDOWS_1252_BYTES:
                byte_values.append(WINDOWS_1252_BYTES[char])
            else:
                return value
        return bytes(byte_values).decode("utf-8")
    except UnicodeError:
        return value


def clean_notebook_source(source: str, csv_path: Path) -> str:
    source = source.replace('pd.read_csv("/content/ntrarogyaseva.csv")', f'pd.read_csv(r"{csv_path}")')
    source = source.replace("pd.read_csv('/content/ntrarogyaseva.csv')", f'pd.read_csv(r"{csv_path}")')
    source = source.replace('open("/content/ntrarogyaseva.csv"', f'open(r"{csv_path}"')
    source = source.replace("open('/content/ntrarogyaseva.csv'", f'open(r"{csv_path}"')
    return source


def extract_markdown_blocks(source: str):
    blocks = []
    for match in re.finditer(r'"""([\s\S]*?)"""', source):
        text = repair_mojibake(match.group(1).strip())
        if text:
            blocks.append({"start": match.start(), "end": match.end(), "text": text})
    return blocks


def extract_intro_and_conclusion(blocks):
    intro = ""
    conclusion = ""

    if blocks:
        first = blocks[0]["text"]
        intro = first.split("# Dataset", 1)[1].strip() if "# Dataset" in first else first
        intro = re.sub(r"^.*?Original file is located at\s+\S+", "", intro, flags=re.S).strip()

    for block in blocks:
        marker = "# CONCLUSIONES"
        if marker in block["text"]:
            before, after = block["text"].split(marker, 1)
            block["text"] = before.strip()
            analysis_only = after.split("# PARTE 3 - MODELO PREDICTIVO", 1)[0].strip()
            conclusion = f"## Conclusiones\n\n{analysis_only}"
            break

    return intro, conclusion


def split_conclusion_sections(conclusion: str):
    sections = []
    current_title = "Conclusiones"
    current_lines = []

    def flush_section():
        body = "\n".join(current_lines).strip()
        if body:
            sections.append(
                {
                    "id": f"conclusion_{len(sections) + 1:02d}",
                    "title": current_title.strip().rstrip("."),
                    "body": body,
                }
            )

    for raw_line in conclusion.splitlines():
        line = raw_line.strip()
        heading = re.match(r"^##\s+(.+)$", line)
        bold_heading = re.match(r"^\*\*(.+?)\.\*\*\s*(.*)$", line)

        if heading:
            flush_section()
            current_title = heading.group(1)
            current_lines = []
            continue

        if bold_heading:
            flush_section()
            current_title = bold_heading.group(1)
            current_lines = [bold_heading.group(2)] if bold_heading.group(2) else []
            continue

        current_lines.append(raw_line)

    flush_section()
    return sections


def chart_descriptions_by_order(source: str, blocks):
    figure_markers = sorted(
        match.start()
        for match in re.finditer(r"(?:plt\.figure|plt\.subplots|fig,\s*ax\s*=|fig,\s*axes\s*=)", source)
    )
    descriptions = {}

    for block in blocks:
        text = block["text"].strip()
        if not text or text.startswith("#") or text.startswith("## Tabla"):
            continue

        previous_figures = [pos for pos in figure_markers if pos < block["start"]]
        if previous_figures:
            descriptions.setdefault(len(previous_figures), text)

    return descriptions


def normalize_title(value: str) -> str:
    value = repair_mojibake(value)
    value = re.sub(r"\s+", " ", value).strip().lower()
    return value


def chart_descriptions_by_title(source: str, blocks):
    title_events = []
    title_pattern = re.compile(
        r"(?:plt|ax|ax1|ax2)\.(?:title|set_title|suptitle)\(\s*([\"'])(.*?)\1",
        re.S,
    )

    for match in title_pattern.finditer(source):
        title_events.append({"start": match.start(), "title": normalize_title(match.group(2))})

    descriptions = {}
    for block in blocks:
        text = block["text"].strip()
        if not text or text.startswith("#") or text.startswith("## Tabla"):
            continue

        previous_titles = [event for event in title_events if event["start"] < block["start"]]
        if previous_titles:
            descriptions.setdefault(previous_titles[-1]["title"], text)

    return descriptions


def figure_title(fig, fallback: str) -> str:
    if fig._suptitle and fig._suptitle.get_text().strip():
        return fig._suptitle.get_text().strip()

    for axis in fig.axes:
        title = axis.get_title().strip()
        if title:
            return title

    return fallback


def fig_to_base64(fig) -> str:
    buffer = io.BytesIO()
    fig.savefig(buffer, format="png", bbox_inches="tight", dpi=120)
    buffer.seek(0)
    return base64.b64encode(buffer.read()).decode("utf-8")


def build_artifact(notebook_source: Path, csv_path: Path, output_path: Path):
    raw_source = notebook_source.read_text(encoding="utf-8")
    blocks = extract_markdown_blocks(raw_source)
    intro, conclusion = extract_intro_and_conclusion(blocks)
    descriptions = chart_descriptions_by_order(raw_source, blocks)
    descriptions_by_title = chart_descriptions_by_title(raw_source, blocks)
    source = clean_notebook_source(raw_source, csv_path)

    namespace = {"__name__": "__main__", "__file__": str(notebook_source)}

    def noop_show(*_args, **_kwargs):
        return None

    original_show = plt.show
    plt.show = noop_show
    try:
        with warnings.catch_warnings():
            warnings.filterwarnings("ignore", message="Passing `palette` without assigning `hue`.*")
            warnings.filterwarnings("ignore", message="More than 20 figures have been opened.*")
            exec(compile(source, str(notebook_source), "exec"), namespace)
    finally:
        plt.show = original_show

    charts = []
    for index, number in enumerate(sorted(plt.get_fignums()), start=1):
        fig = plt.figure(number)
        title = repair_mojibake(figure_title(fig, f"Gr\u00e1fico {index}"))
        description = descriptions_by_title.get(normalize_title(title), "")
        charts.append(
            {
                "id": f"chart_{index:02d}",
                "title": title,
                "type": "image/png",
                "data": fig_to_base64(fig),
                "description": description,
            }
        )
        plt.close(fig)

    artifact = {
        "dataset_id": DATASET_ID,
        "title": DATASET_TITLE,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "intro": intro,
        "notes": "An\u00e1lisis de pacientes que recibieron cirug\u00edas/procedimientos m\u00e9dicos cubiertos por el seguro p\u00fablico de India.",
        "conclusion": conclusion,
        "conclusion_sections": split_conclusion_sections(conclusion),
        "charts": charts,
    }

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(artifact, ensure_ascii=False), encoding="utf-8")
    return artifact


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", default=str(Path(__file__).with_name("ntrarogyaseva_base_taller_.py")))
    parser.add_argument("--csv", default=str(Path(__file__).with_name("ntrarogyaseva.csv")))
    parser.add_argument(
        "--output",
        default=str(Path(__file__).parents[1] / "public" / "datasets" / "artifact_2.json"),
    )
    args = parser.parse_args()

    artifact = build_artifact(Path(args.source), Path(args.csv), Path(args.output))
    print(f"Artifact generado: {args.output}")
    print(f"Graficos capturados: {len(artifact['charts'])}")


if __name__ == "__main__":
    main()
