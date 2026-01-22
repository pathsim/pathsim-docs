#!/usr/bin/env python3
"""
Regenerate search and crossref indexes for all existing versions.

This script is a utility to regenerate per-version indexes without
rebuilding API docs or notebooks. Useful after updating index generation logic.

Indexes are generated per-version in: static/{package}/{tag}/
  - search-index.json
  - crossref-index.json
"""

import json
import sys
from pathlib import Path

# Add scripts directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from build import generate_version_indexes
from lib.config import PACKAGES, STATIC_DIR


def main():
    print("Regenerating per-version indexes")
    print("=" * 40)

    total_versions = 0

    for pkg_id in PACKAGES.keys():
        pkg_dir = STATIC_DIR / pkg_id

        if not pkg_dir.exists():
            print(f"\n{pkg_id}: No static directory found")
            continue

        # Find all version directories
        version_dirs = [
            d for d in pkg_dir.iterdir()
            if d.is_dir() and d.name.startswith("v")
        ]

        if not version_dirs:
            print(f"\n{pkg_id}: No versions found")
            continue

        print(f"\n{pkg_id}: {len(version_dirs)} version(s)")

        for version_dir in sorted(version_dirs, key=lambda d: d.name):
            tag = version_dir.name
            print(f"  {tag}:")
            generate_version_indexes(pkg_id, tag, version_dir)
            total_versions += 1

    print(f"\n{'=' * 40}")
    print(f"Regenerated indexes for {total_versions} version(s)")


if __name__ == "__main__":
    main()
