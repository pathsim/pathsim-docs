#!/usr/bin/env python3
"""
Execute notebooks in parallel to generate outputs.

This script runs all executable notebooks and saves them with their outputs,
which can then be displayed as default results in the documentation.

Caching: Stores the executed tag in .executed-tag file. Skips execution
if the current tag matches the cached tag.
"""

import json
import subprocess
import sys
from concurrent.futures import ProcessPoolExecutor, as_completed
from pathlib import Path

# Configuration
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
NOTEBOOKS_DIR = PROJECT_ROOT / "static" / "notebooks"

# Package to repo mapping
PACKAGE_REPOS = {
    "pathsim": PROJECT_ROOT.parent / "pathsim",
    "chem": PROJECT_ROOT.parent / "pathsim-chem",
    "vehicle": PROJECT_ROOT.parent / "pathsim-vehicle",
}

# Maximum parallel workers (adjust based on CI resources)
MAX_WORKERS = 4

# Timeout per notebook in seconds
TIMEOUT = 300  # 5 minutes


def get_latest_tag(repo_path: Path) -> str | None:
    """Get the latest git tag from a repository."""
    if not repo_path.exists():
        return None
    try:
        result = subprocess.run(
            ["git", "-C", str(repo_path), "describe", "--tags", "--abbrev=0"],
            capture_output=True,
            text=True
        )
        if result.returncode == 0:
            return result.stdout.strip()
    except Exception:
        pass
    return None


def get_cached_tag(package_dir: Path) -> str | None:
    """Get the cached executed tag for a package."""
    tag_file = package_dir / ".executed-tag"
    if tag_file.exists():
        return tag_file.read_text().strip()
    return None


def save_cached_tag(package_dir: Path, tag: str):
    """Save the executed tag for a package."""
    tag_file = package_dir / ".executed-tag"
    tag_file.write_text(tag)


def execute_notebook(notebook_path: Path) -> tuple[str, bool, str]:
    """
    Execute a single notebook and save it with outputs.

    Returns: (notebook_name, success, message)
    """
    name = notebook_path.name

    try:
        # Use nbconvert to execute in place
        result = subprocess.run(
            [
                sys.executable, "-m", "nbconvert",
                "--to", "notebook",
                "--execute",
                "--inplace",
                "--ExecutePreprocessor.timeout=" + str(TIMEOUT),
                str(notebook_path)
            ],
            capture_output=True,
            text=True,
            timeout=TIMEOUT + 30  # Extra buffer for subprocess overhead
        )

        if result.returncode == 0:
            return (name, True, "OK")
        else:
            # Extract error message
            error = result.stderr.strip().split('\n')[-1] if result.stderr else "Unknown error"
            return (name, False, error[:100])

    except subprocess.TimeoutExpired:
        return (name, False, "Timeout")
    except Exception as e:
        return (name, False, str(e)[:100])


def get_executable_notebooks(package_dir: Path) -> list[Path]:
    """Get all executable notebooks for a package."""
    notebooks = []

    manifest_path = package_dir / "manifest.json"
    if not manifest_path.exists():
        return notebooks

    with open(manifest_path) as f:
        manifest = json.load(f)

    for nb_meta in manifest.get("notebooks", []):
        if nb_meta.get("executable", True):
            nb_path = package_dir / nb_meta["file"]
            if nb_path.exists():
                notebooks.append(nb_path)

    return notebooks


def process_package(package: str, package_dir: Path) -> tuple[int, int]:
    """Process a single package. Returns (succeeded, failed) counts."""
    repo_path = PACKAGE_REPOS.get(package)
    current_tag = get_latest_tag(repo_path) if repo_path else None
    cached_tag = get_cached_tag(package_dir)

    print(f"\n{package}: current_tag={current_tag}, cached_tag={cached_tag}")

    # Check if we can skip
    if current_tag and cached_tag and current_tag == cached_tag:
        print(f"  ✓ Skipping - already executed for {current_tag}")
        return (0, 0)

    notebooks = get_executable_notebooks(package_dir)
    if not notebooks:
        print(f"  No executable notebooks found")
        return (0, 0)

    print(f"  Executing {len(notebooks)} notebooks...")

    # Execute in parallel
    results = []
    with ProcessPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = {executor.submit(execute_notebook, nb): nb for nb in notebooks}

        for future in as_completed(futures):
            name, success, message = future.result()
            status = "✓" if success else "✗"
            print(f"    {status} {name}: {message}")
            results.append((name, success, message))

    succeeded = sum(1 for _, s, _ in results if s)
    failed = sum(1 for _, s, _ in results if not s)

    # Save the tag if we executed successfully
    if current_tag and succeeded > 0:
        save_cached_tag(package_dir, current_tag)
        print(f"  Saved executed tag: {current_tag}")

    return (succeeded, failed)


def main():
    print("Executing notebooks to generate outputs...")

    total_succeeded = 0
    total_failed = 0

    for package_dir in NOTEBOOKS_DIR.iterdir():
        if not package_dir.is_dir():
            continue

        package = package_dir.name
        succeeded, failed = process_package(package, package_dir)
        total_succeeded += succeeded
        total_failed += failed

    print(f"\nTotal: {total_succeeded} succeeded, {total_failed} failed")

    # Always succeed - some notebooks may legitimately fail
    return 0


if __name__ == "__main__":
    sys.exit(main())
