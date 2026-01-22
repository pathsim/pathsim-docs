"""
Notebook execution utilities.

Executes notebooks and captures outputs (stdout, stderr, figures) separately.
"""

import base64
import json
import subprocess
import sys
import time
from concurrent.futures import ProcessPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from .config import MAX_WORKERS, NOTEBOOK_TIMEOUT


def execute_notebooks(
    version_dir: Path,
    notebooks: list[dict],
    parallel: bool = True,
) -> dict[str, dict]:
    """
    Execute all notebooks and save outputs/figures.

    Args:
        version_dir: The version directory (e.g., static/pathsim/v0.16.4/)
        notebooks: List of notebook metadata dicts
        parallel: Whether to execute in parallel

    Returns:
        Dict mapping notebook name to execution result
    """
    notebooks_dir = version_dir / "notebooks"
    outputs_dir = version_dir / "outputs"
    figures_dir = version_dir / "figures"

    outputs_dir.mkdir(parents=True, exist_ok=True)
    figures_dir.mkdir(parents=True, exist_ok=True)

    # Filter to executable notebooks only
    executable = [nb for nb in notebooks if nb.get("executable", True)]

    if not executable:
        return {}

    results = {}

    if parallel and len(executable) > 1:
        with ProcessPoolExecutor(max_workers=MAX_WORKERS) as executor:
            futures = {
                executor.submit(
                    _execute_single_notebook,
                    notebooks_dir / nb["file"],
                    outputs_dir,
                    figures_dir,
                ): nb
                for nb in executable
            }

            for future in as_completed(futures):
                nb = futures[future]
                name = Path(nb["file"]).stem
                try:
                    result = future.result()
                    status = "OK" if result.get("success") else "FAILED"
                    print(f"      {status}: {nb['file']}")
                    results[name] = result
                except Exception as e:
                    print(f"      ERROR: {nb['file']}: {e}")
                    results[name] = {"success": False, "error": str(e), "cells": {}}
    else:
        for nb in executable:
            name = Path(nb["file"]).stem
            try:
                result = _execute_single_notebook(
                    notebooks_dir / nb["file"],
                    outputs_dir,
                    figures_dir,
                )
                status = "OK" if result.get("success") else "FAILED"
                print(f"      {status}: {nb['file']}")
                results[name] = result
            except Exception as e:
                print(f"      ERROR: {nb['file']}: {e}")
                results[name] = {"success": False, "error": str(e), "cells": {}}

    return results


def _execute_single_notebook(
    notebook_path: Path,
    outputs_dir: Path,
    figures_dir: Path,
) -> dict[str, Any]:
    """
    Execute a single notebook and capture outputs.

    Returns dict with execution results.
    """
    name = notebook_path.stem
    start_time = time.time()

    try:
        with open(notebook_path, "r", encoding="utf-8") as f:
            notebook = json.load(f)
    except Exception as e:
        return {"success": False, "error": f"Failed to read notebook: {e}", "cells": {}}

    # Execute using nbconvert (simpler than manual kernel management)
    result = _execute_with_nbconvert(notebook_path)

    if not result["success"]:
        # Save partial results
        output_data = {
            "cells": {},
            "executedAt": datetime.now(timezone.utc).isoformat(),
            "duration": int((time.time() - start_time) * 1000),
            "success": False,
            "error": result.get("error", "Unknown error"),
        }
        _save_output(outputs_dir / f"{name}.json", output_data)
        return output_data

    # Parse the executed notebook and extract outputs
    try:
        with open(result["output_path"], "r", encoding="utf-8") as f:
            executed_nb = json.load(f)
    except Exception as e:
        return {"success": False, "error": f"Failed to read executed notebook: {e}", "cells": {}}

    # Extract outputs from each cell
    cells_output = {}
    figure_count = 0

    for i, cell in enumerate(executed_nb.get("cells", [])):
        if cell.get("cell_type") != "code":
            continue

        cell_output = {
            "stdout": None,
            "stderr": None,
            "figures": [],
        }

        for output in cell.get("outputs", []):
            output_type = output.get("output_type")

            if output_type == "stream":
                stream_name = output.get("name", "stdout")
                text = "".join(output.get("text", []))
                if stream_name == "stderr":
                    cell_output["stderr"] = (cell_output["stderr"] or "") + text
                else:
                    cell_output["stdout"] = (cell_output["stdout"] or "") + text

            elif output_type in ("display_data", "execute_result"):
                data = output.get("data", {})

                # Extract images
                for mime_type in ["image/png", "image/jpeg", "image/svg+xml"]:
                    if mime_type in data:
                        ext = {
                            "image/png": "png",
                            "image/jpeg": "jpg",
                            "image/svg+xml": "svg",
                        }[mime_type]

                        figure_name = f"{name}_{figure_count}.{ext}"
                        figure_path = figures_dir / figure_name

                        # Decode and save
                        img_data = data[mime_type]
                        if mime_type == "image/svg+xml":
                            if isinstance(img_data, list):
                                img_data = "".join(img_data)
                            figure_path.write_text(img_data, encoding="utf-8")
                        else:
                            if isinstance(img_data, list):
                                img_data = "".join(img_data)
                            figure_path.write_bytes(base64.b64decode(img_data))

                        cell_output["figures"].append(figure_name)
                        figure_count += 1
                        break  # Only save first image format

        # Only include cell if it has output
        if cell_output["stdout"] or cell_output["stderr"] or cell_output["figures"]:
            cells_output[str(i)] = cell_output

    # Clean up temporary executed notebook
    if result.get("output_path"):
        try:
            result["output_path"].unlink()
        except Exception:
            pass

    duration = int((time.time() - start_time) * 1000)

    output_data = {
        "cells": cells_output,
        "executedAt": datetime.now(timezone.utc).isoformat(),
        "duration": duration,
        "success": True,
    }

    _save_output(outputs_dir / f"{name}.json", output_data)

    return output_data


def _execute_with_nbconvert(notebook_path: Path) -> dict[str, Any]:
    """Execute notebook using nbconvert."""
    output_path = notebook_path.with_suffix(".executed.ipynb")

    try:
        result = subprocess.run(
            [
                sys.executable, "-m", "nbconvert",
                "--to", "notebook",
                "--execute",
                "--output", str(output_path.name),
                "--ExecutePreprocessor.timeout=" + str(NOTEBOOK_TIMEOUT),
                "--ExecutePreprocessor.kernel_name=python3",
                str(notebook_path),
            ],
            cwd=notebook_path.parent,
            capture_output=True,
            text=True,
            timeout=NOTEBOOK_TIMEOUT + 60,
        )

        if result.returncode == 0:
            return {"success": True, "output_path": output_path}
        else:
            error = result.stderr.strip().split('\n')[-1] if result.stderr else "Unknown error"
            return {"success": False, "error": error[:200]}

    except subprocess.TimeoutExpired:
        return {"success": False, "error": "Timeout"}
    except Exception as e:
        return {"success": False, "error": str(e)[:200]}


def _save_output(path: Path, data: dict):
    """Save output data as JSON."""
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
