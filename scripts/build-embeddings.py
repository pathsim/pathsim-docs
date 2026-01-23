#!/usr/bin/env python3
"""
Generate semantic search embeddings for all existing versions.

This script generates embeddings-index.json files from existing search-index.json
files. It's incremental by default - only regenerates if search index is newer.

Usage:
    python scripts/build-embeddings.py              # Incremental build
    python scripts/build-embeddings.py --force      # Force regenerate all
    python scripts/build-embeddings.py -p pathsim   # Single package
    python scripts/build-embeddings.py --dry-run    # Preview only
"""

import argparse
import sys
from pathlib import Path

# Add scripts directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from lib.config import PACKAGES, STATIC_DIR
from lib.embeddings import generate_version_embeddings, should_regenerate_embeddings


def main():
    parser = argparse.ArgumentParser(
        description="Generate semantic search embeddings",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python scripts/build-embeddings.py                 # Build missing/outdated
  python scripts/build-embeddings.py --force         # Rebuild everything
  python scripts/build-embeddings.py -p pathsim      # Single package
  python scripts/build-embeddings.py --dry-run       # Preview only
        """
    )
    parser.add_argument(
        "--package", "-p",
        choices=list(PACKAGES.keys()),
        help="Build single package (default: all)"
    )
    parser.add_argument(
        "--force", "-f",
        action="store_true",
        help="Force regenerate all embeddings"
    )
    parser.add_argument(
        "--dry-run", "-n",
        action="store_true",
        help="Preview without generating"
    )

    args = parser.parse_args()

    print("Semantic Search Embeddings Generator")
    print("=" * 50)

    if args.force:
        print("Mode: FORCE REBUILD")
    else:
        print("Mode: INCREMENTAL (outdated only)")

    if args.dry_run:
        print("Dry run: No files will be written")

    # Determine packages to process
    packages = [args.package] if args.package else list(PACKAGES.keys())

    total_generated = 0
    total_skipped = 0

    for pkg_id in packages:
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
            needs_update = args.force or should_regenerate_embeddings(version_dir)

            if not needs_update:
                print(f"  {tag}: up to date (skipped)")
                total_skipped += 1
                continue

            if args.dry_run:
                print(f"  {tag}: would generate embeddings")
                total_generated += 1
                continue

            print(f"  {tag}:")
            try:
                generated = generate_version_embeddings(version_dir, force=args.force)
                if generated:
                    total_generated += 1
                else:
                    total_skipped += 1
            except Exception as e:
                print(f"    Error: {e}")

    print(f"\n{'=' * 50}")
    print(f"Generated: {total_generated}, Skipped: {total_skipped}")


if __name__ == "__main__":
    main()
