"""
Notebook utilities for copying and metadata extraction.
"""

import json
import re
import shutil
from pathlib import Path
from typing import Any

from .config import CATEGORY_MAPPINGS, CATEGORIES, NON_EXECUTABLE


def copy_notebooks(source_dir: Path, target_dir: Path) -> list[dict]:
    """
    Copy notebooks from source to target directory and extract metadata.

    Returns list of notebook metadata dictionaries.
    """
    if not source_dir.exists():
        return []

    notebooks_dir = target_dir / "notebooks"
    notebooks_dir.mkdir(parents=True, exist_ok=True)

    notebooks = []

    for nb_path in sorted(source_dir.glob("*.ipynb")):
        try:
            meta = _process_notebook(nb_path, notebooks_dir)
            if meta:
                notebooks.append(meta)
        except Exception as e:
            print(f"    Warning: Failed to process {nb_path.name}: {e}")

    # Copy mplstyle file if it exists (notebooks reference ../pathsim_docs.mplstyle)
    mplstyle_source = source_dir.parent / "pathsim_docs.mplstyle"
    if mplstyle_source.exists():
        shutil.copy2(mplstyle_source, target_dir / "pathsim_docs.mplstyle")

    return notebooks


def copy_figures(source_dir: Path, target_dir: Path):
    """Copy figures from source to target figures directory."""
    if not source_dir.exists():
        return

    figures_dir = target_dir / "figures"
    figures_dir.mkdir(parents=True, exist_ok=True)

    # Copy all image files
    for ext in ["*.png", "*.jpg", "*.jpeg", "*.svg", "*.gif"]:
        for fig in source_dir.glob(ext):
            shutil.copy2(fig, figures_dir / fig.name)

    # Also copy from subdirectories (like figures_g)
    for subdir in source_dir.iterdir():
        if subdir.is_dir():
            subdir_out = figures_dir / subdir.name
            subdir_out.mkdir(parents=True, exist_ok=True)
            for ext in ["*.png", "*.jpg", "*.jpeg", "*.svg", "*.gif"]:
                for fig in subdir.glob(ext):
                    shutil.copy2(fig, subdir_out / fig.name)


def _process_notebook(nb_path: Path, output_dir: Path) -> dict | None:
    """Process a single notebook: copy and extract metadata."""
    try:
        with open(nb_path, "r", encoding="utf-8") as f:
            notebook = json.load(f)
    except (json.JSONDecodeError, UnicodeDecodeError) as e:
        print(f"    Warning: Could not parse {nb_path.name}: {e}")
        return None

    stem = nb_path.stem
    slug = _slugify(stem)

    # Extract metadata
    title = _extract_title(notebook)
    description = _extract_description(notebook)

    # Get category and tags from mapping
    category, tags = CATEGORY_MAPPINGS.get(stem, ("advanced", []))

    # Check if executable
    executable = stem not in NON_EXECUTABLE

    # Copy notebook (without outputs - clean copy)
    clean_notebook = _strip_outputs(notebook)
    output_path = output_dir / nb_path.name
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(clean_notebook, f, indent=1, ensure_ascii=False)

    return {
        "slug": slug,
        "file": nb_path.name,
        "title": title,
        "description": description,
        "category": category,
        "tags": tags,
        "executable": executable,
    }


def _strip_outputs(notebook: dict) -> dict:
    """Remove outputs from notebook cells (keep source only)."""
    clean = dict(notebook)
    clean["cells"] = []

    for cell in notebook.get("cells", []):
        clean_cell = dict(cell)
        if cell.get("cell_type") == "code":
            clean_cell["outputs"] = []
            clean_cell["execution_count"] = None
        clean["cells"].append(clean_cell)

    return clean


def _slugify(name: str) -> str:
    """Convert filename to URL-friendly slug."""
    return name.lower().replace("_", "-").replace(" ", "-")


def _extract_title(notebook: dict) -> str:
    """Extract title from first markdown cell (H1 heading)."""
    for cell in notebook.get("cells", []):
        if cell.get("cell_type") == "markdown":
            source = cell.get("source", [])
            if isinstance(source, list):
                source = "".join(source)

            match = re.search(r"^#\s+(.+?)(?:\n|$)", source, re.MULTILINE)
            if match:
                return match.group(1).strip()

    return "Untitled"


def _extract_description(notebook: dict) -> str:
    """Extract description from first paragraph after title."""
    found_title = False

    for cell in notebook.get("cells", []):
        if cell.get("cell_type") == "markdown":
            source = cell.get("source", [])
            if isinstance(source, list):
                source = "".join(source)

            if re.match(r"^#\s+.+\s*$", source.strip()):
                found_title = True
                continue

            if found_title or not re.search(r"^#\s+", source):
                # Remove markdown formatting
                text = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", source)
                text = re.sub(r"`[^`]+`", "", text)
                text = re.sub(r"\*\*([^*]+)\*\*", r"\1", text)
                text = re.sub(r"\*([^*]+)\*", r"\1", text)
                text = re.sub(r"^\s*#+\s+.+$", "", text, flags=re.MULTILINE)
                text = re.sub(r"\$[^$]+\$", "", text)

                lines = [l.strip() for l in text.split("\n") if l.strip()]
                if lines:
                    desc = lines[0]
                    if len(desc) > 200:
                        desc = desc[:197] + "..."
                    return desc

    return "Example notebook"


def generate_version_manifest(
    package_id: str,
    tag: str,
    notebooks: list[dict],
) -> dict[str, Any]:
    """Generate the version-specific manifest."""
    # Sort notebooks by category order, then by title
    category_order = {c["id"]: c["order"] for c in CATEGORIES}
    sorted_notebooks = sorted(
        notebooks,
        key=lambda n: (category_order.get(n["category"], 99), n["title"])
    )

    return {
        "package": package_id,
        "tag": tag,
        "notebooks": sorted_notebooks,
        "categories": CATEGORIES,
    }
