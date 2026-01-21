#!/usr/bin/env python3
"""
Notebook preparation script for pathsim-docs.

Copies notebooks from source repositories to static folder,
extracts metadata, and generates a manifest.json file.
"""

import json
import os
import re
import shutil
from pathlib import Path
from typing import Optional

# Configuration
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
PATHSIM_ROOT = PROJECT_ROOT.parent / "pathsim"

# Source and output directories
SOURCES = {
    "pathsim": {
        "notebooks": PATHSIM_ROOT / "docs" / "source" / "examples",
        "figures": PATHSIM_ROOT / "docs" / "source" / "examples" / "figures",
    }
}

OUTPUT_DIR = PROJECT_ROOT / "static" / "notebooks"

# Category mappings based on notebook content/names
CATEGORY_MAPPINGS = {
    # Getting Started
    "harmonic_oscillator": ("getting-started", ["ode", "basics"]),
    "pendulum": ("getting-started", ["ode", "adaptive", "physics"]),
    "vanderpol": ("getting-started", ["ode", "nonlinear"]),
    "linear_feedback": ("getting-started", ["ode", "feedback"]),

    # Control Systems
    "pid_controller": ("control", ["pid", "feedback"]),
    "cascade_controller": ("control", ["cascade", "feedback"]),
    "dcmotor_control": ("control", ["motor", "pid"]),
    "kalman_filter": ("control", ["estimation", "filter"]),
    "thermostat": ("control", ["hybrid", "events"]),
    "abs_braking": ("control", ["hybrid", "events", "automotive"]),

    # Mechanics
    "bouncing_ball": ("mechanics", ["events", "hybrid"]),
    "bouncing_pendulum": ("mechanics", ["events", "collision"]),
    "switched_bouncing_ball": ("mechanics", ["events", "hybrid"]),
    "stick_slip": ("mechanics", ["friction", "hybrid"]),
    "elastic_pendulum": ("mechanics", ["ode", "physics"]),
    "billards": ("mechanics", ["events", "collision"]),
    "coupled_oscillators": ("mechanics", ["ode", "physics"]),

    # Electronics
    "diode_circuit": ("electronics", ["nonlinear", "circuit"]),
    "noisy_amplifier": ("electronics", ["noise", "circuit"]),
    "delta_sigma_adc": ("electronics", ["adc", "mixed-signal"]),
    "sar_adc": ("electronics", ["adc", "mixed-signal"]),

    # Signal Processing
    "spectrum_analysis": ("signal-processing", ["fft", "frequency"]),
    "fmcw_radar": ("signal-processing", ["radar", "frequency"]),
    "transfer_function": ("signal-processing", ["frequency", "bode"]),
    "rf_network_oneport": ("signal-processing", ["rf", "network"]),

    # Chemical
    "chemical_reactor": ("chemical", ["cstr", "reaction"]),

    # Advanced
    "algebraic_loop": ("advanced", ["algebraic", "solver"]),
    "nested_subsystems": ("advanced", ["hierarchy", "subsystem"]),
    "lorenz_attractor": ("advanced", ["chaos", "ode"]),
    "poincare_maps": ("advanced", ["chaos", "analysis"]),

    # FMU Integration (non-executable in Pyodide)
    "fmu_cosimulation": ("fmu", ["fmu", "cosim"]),
    "fmu_model_exchange_bouncing_ball": ("fmu", ["fmu", "model-exchange"]),
    "fmu_model_exchange_vanderpol": ("fmu", ["fmu", "model-exchange"]),
}

# Non-executable notebooks (require dependencies not in Pyodide)
NON_EXECUTABLE = {
    "fmu_cosimulation",
    "fmu_model_exchange_bouncing_ball",
    "fmu_model_exchange_vanderpol",
    "rf_network_oneport",  # requires scikit-rf
}

# Category definitions
CATEGORIES = [
    {"id": "getting-started", "title": "Getting Started", "order": 1},
    {"id": "control", "title": "Control Systems", "order": 2},
    {"id": "mechanics", "title": "Mechanics", "order": 3},
    {"id": "electronics", "title": "Electronics", "order": 4},
    {"id": "signal-processing", "title": "Signal Processing", "order": 5},
    {"id": "chemical", "title": "Chemical Engineering", "order": 6},
    {"id": "advanced", "title": "Advanced Topics", "order": 7},
    {"id": "fmu", "title": "FMU Integration", "order": 8},
]


def extract_title(notebook: dict) -> str:
    """Extract title from first markdown cell (H1 heading)."""
    for cell in notebook.get("cells", []):
        if cell.get("cell_type") == "markdown":
            source = cell.get("source", [])
            if isinstance(source, list):
                source = "".join(source)

            # Look for H1 heading
            match = re.search(r"^#\s+(.+?)(?:\n|$)", source, re.MULTILINE)
            if match:
                return match.group(1).strip()

    return "Untitled"


def extract_description(notebook: dict) -> str:
    """Extract description from first paragraph after title."""
    found_title = False

    for cell in notebook.get("cells", []):
        if cell.get("cell_type") == "markdown":
            source = cell.get("source", [])
            if isinstance(source, list):
                source = "".join(source)

            # Skip cells that are just the title
            if re.match(r"^#\s+.+\s*$", source.strip()):
                found_title = True
                continue

            # After title, look for first non-empty paragraph
            if found_title or not re.search(r"^#\s+", source):
                # Remove markdown formatting
                text = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", source)  # Links
                text = re.sub(r"`[^`]+`", "", text)  # Inline code
                text = re.sub(r"\*\*([^*]+)\*\*", r"\1", text)  # Bold
                text = re.sub(r"\*([^*]+)\*", r"\1", text)  # Italic
                text = re.sub(r"^\s*#+\s+.+$", "", text, flags=re.MULTILINE)  # Headers
                text = re.sub(r"\$[^$]+\$", "", text)  # Math

                # Get first sentence/paragraph
                lines = [l.strip() for l in text.split("\n") if l.strip()]
                if lines:
                    desc = lines[0]
                    # Truncate if too long
                    if len(desc) > 200:
                        desc = desc[:197] + "..."
                    return desc

    return "Example notebook"


def slugify(name: str) -> str:
    """Convert filename to URL-friendly slug."""
    return name.lower().replace("_", "-").replace(" ", "-")


def process_notebook(
    notebook_path: Path,
    output_dir: Path,
    package: str
) -> Optional[dict]:
    """Process a single notebook and return its metadata."""
    try:
        with open(notebook_path, "r", encoding="utf-8") as f:
            notebook = json.load(f)
    except (json.JSONDecodeError, UnicodeDecodeError) as e:
        print(f"  Warning: Could not parse {notebook_path.name}: {e}")
        return None

    stem = notebook_path.stem
    slug = slugify(stem)

    # Extract metadata
    title = extract_title(notebook)
    description = extract_description(notebook)

    # Get category and tags from mapping, or use defaults
    category, tags = CATEGORY_MAPPINGS.get(stem, ("advanced", []))

    # Check if executable
    executable = stem not in NON_EXECUTABLE

    # Copy notebook to output
    output_path = output_dir / notebook_path.name
    shutil.copy2(notebook_path, output_path)

    return {
        "slug": slug,
        "title": title,
        "description": description,
        "category": category,
        "file": notebook_path.name,
        "tags": tags,
        "executable": executable,
    }


def copy_figures(source_dir: Path, output_dir: Path):
    """Copy all figures from source to output directory."""
    if not source_dir.exists():
        return

    figures_out = output_dir / "figures"
    figures_out.mkdir(parents=True, exist_ok=True)

    # Copy all image files
    for ext in ["*.png", "*.jpg", "*.jpeg", "*.svg", "*.gif"]:
        for fig in source_dir.glob(ext):
            shutil.copy2(fig, figures_out / fig.name)

    # Also copy from subdirectories (like figures_g)
    for subdir in source_dir.iterdir():
        if subdir.is_dir():
            subdir_out = figures_out / subdir.name
            subdir_out.mkdir(parents=True, exist_ok=True)
            for ext in ["*.png", "*.jpg", "*.jpeg", "*.svg", "*.gif"]:
                for fig in subdir.glob(ext):
                    shutil.copy2(fig, subdir_out / fig.name)


def main():
    """Main entry point."""
    print("Preparing notebooks for pathsim-docs...")

    for package, paths in SOURCES.items():
        print(f"\nProcessing {package}...")

        notebooks_dir = paths["notebooks"]
        figures_dir = paths["figures"]

        if not notebooks_dir.exists():
            print(f"  Warning: Source directory not found: {notebooks_dir}")
            continue

        # Create output directory
        pkg_output = OUTPUT_DIR / package
        pkg_output.mkdir(parents=True, exist_ok=True)

        # Process all notebooks
        notebooks = []
        for nb_path in sorted(notebooks_dir.glob("*.ipynb")):
            print(f"  Processing {nb_path.name}...")
            meta = process_notebook(nb_path, pkg_output, package)
            if meta:
                notebooks.append(meta)

        # Copy figures
        print(f"  Copying figures...")
        copy_figures(figures_dir, pkg_output)

        # Sort notebooks by category order, then by title
        category_order = {c["id"]: c["order"] for c in CATEGORIES}
        notebooks.sort(key=lambda n: (category_order.get(n["category"], 99), n["title"]))

        # Generate manifest
        manifest = {
            "package": package,
            "notebooks": notebooks,
            "categories": CATEGORIES,
        }

        manifest_path = pkg_output / "manifest.json"
        with open(manifest_path, "w", encoding="utf-8") as f:
            json.dump(manifest, f, indent=2)

        print(f"  Generated manifest with {len(notebooks)} notebooks")

    print("\nDone!")


if __name__ == "__main__":
    main()
