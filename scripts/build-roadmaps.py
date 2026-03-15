#!/usr/bin/env python3
"""
Fetch roadmap issues from GitHub and rebuild package manifests.

Standalone script for CI scheduled runs — only updates roadmap.json
and package manifests without rebuilding API docs or notebooks.

Usage:
    python scripts/build-roadmaps.py
    python scripts/build-roadmaps.py --package pathsim
    python scripts/build-roadmaps.py --dry-run
"""

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from lib.config import PACKAGES, STATIC_DIR
from lib.roadmap import build_roadmap
from lib.git import get_tag_date, parse_version


def rebuild_package_manifest(package_id: str) -> None:
    """Regenerate package manifest with updated hasRoadmap flag."""
    output_dir = STATIC_DIR / package_id
    manifest_path = output_dir / "manifest.json"

    if not manifest_path.exists():
        return

    with open(manifest_path, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    # Update hasRoadmap flag
    roadmap_path = output_dir / "roadmap.json"
    has_roadmap = False
    if roadmap_path.exists():
        try:
            with open(roadmap_path, "r", encoding="utf-8") as f:
                roadmap_data = json.load(f)
                has_roadmap = len(roadmap_data.get("issues", [])) > 0
        except Exception:
            pass

    manifest["hasRoadmap"] = has_roadmap

    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)

    print(f"  Updated manifest: hasRoadmap={has_roadmap}")


def main():
    parser = argparse.ArgumentParser(description="Fetch roadmap issues from GitHub")
    parser.add_argument(
        "--package", "-p",
        choices=list(PACKAGES.keys()),
        help="Single package (default: all)",
    )
    parser.add_argument(
        "--dry-run", "-n",
        action="store_true",
        help="Preview without writing",
    )
    args = parser.parse_args()

    packages = [args.package] if args.package else list(PACKAGES.keys())

    print("PathSim Roadmap Builder")
    print("=" * 50)
    if args.dry_run:
        print("DRY RUN")

    for pkg_id in packages:
        display = PACKAGES[pkg_id]["display_name"]
        print(f"\n{display}:")
        build_roadmap(pkg_id, args.dry_run)
        if not args.dry_run:
            rebuild_package_manifest(pkg_id)

    print(f"\nDone.")


if __name__ == "__main__":
    main()
