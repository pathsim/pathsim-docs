#!/usr/bin/env python3
"""
Rebuild manifest.json files with updated metadata (e.g., thumbnails).
Does not re-execute notebooks - just re-extracts metadata from existing notebooks.
"""

import json
from pathlib import Path

from lib.notebooks import (
    _extract_title,
    _extract_description,
    _extract_thumbnail,
    _slugify,
    generate_version_manifest,
)
from lib.config import CATEGORY_MAPPINGS, NON_EXECUTABLE


def rebuild_manifest(version_dir: Path) -> bool:
    """Rebuild manifest.json for a version directory."""
    notebooks_dir = version_dir / "notebooks"
    manifest_path = version_dir / "manifest.json"

    if not notebooks_dir.exists() or not manifest_path.exists():
        return False

    # Load existing manifest to get package and tag
    with open(manifest_path, "r", encoding="utf-8") as f:
        existing = json.load(f)

    package_id = existing.get("package", version_dir.parent.name)
    tag = existing.get("tag", version_dir.name)

    print(f"  Rebuilding {package_id}/{tag}...")

    # Re-extract metadata from all notebooks
    notebooks = []
    for nb_path in sorted(notebooks_dir.glob("*.ipynb")):
        try:
            with open(nb_path, "r", encoding="utf-8") as f:
                notebook = json.load(f)

            stem = nb_path.stem
            slug = _slugify(stem)

            # Extract metadata
            title = _extract_title(notebook)
            description = _extract_description(notebook)
            thumbnail_path = _extract_thumbnail(notebook)

            # Get category and tags from mapping
            category, tags = CATEGORY_MAPPINGS.get(stem, ("advanced", []))

            # Check if executable
            executable = stem not in NON_EXECUTABLE

            # Process thumbnail path
            thumbnail = None
            if thumbnail_path:
                path_parts = Path(thumbnail_path.replace("\\", "/"))
                parts = path_parts.parts
                if "figures" in parts:
                    fig_idx = parts.index("figures")
                    thumbnail = "/".join(parts[fig_idx + 1:])
                else:
                    thumbnail = path_parts.name

            meta = {
                "slug": slug,
                "file": nb_path.name,
                "title": title,
                "description": description,
                "category": category,
                "tags": tags,
                "executable": executable,
            }

            if thumbnail:
                meta["thumbnail"] = thumbnail
                print(f"    {nb_path.name}: thumbnail = {thumbnail}")

            notebooks.append(meta)

        except Exception as e:
            print(f"    Warning: Failed to process {nb_path.name}: {e}")

    # Generate and save new manifest
    manifest = generate_version_manifest(package_id, tag, notebooks)
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)

    return True


def main():
    static_dir = Path(__file__).parent.parent / "static"

    print("Rebuilding manifests...")

    # Find all package directories
    for package_dir in static_dir.iterdir():
        if not package_dir.is_dir():
            continue

        # Skip non-package directories
        if package_dir.name.startswith("."):
            continue

        print(f"\nPackage: {package_dir.name}")

        # Find all version directories
        for version_dir in package_dir.iterdir():
            if not version_dir.is_dir():
                continue
            if not version_dir.name.startswith("v"):
                continue

            rebuild_manifest(version_dir)

    print("\nDone!")


if __name__ == "__main__":
    main()
