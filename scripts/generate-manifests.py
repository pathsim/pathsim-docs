#!/usr/bin/env python3
"""
PathSim API Version Manifest Generator

Generates manifest.json files for each package by scanning the versioned API JSON files.

Usage:
    python scripts/generate-manifests.py              # Generate all manifests
    python scripts/generate-manifests.py --package pathsim  # Single package
    python scripts/generate-manifests.py --dry-run   # Preview without writing
"""

import argparse
import json
import re
import subprocess
from pathlib import Path
from typing import Any

SCRIPT_DIR = Path(__file__).parent
ROOT_DIR = SCRIPT_DIR.parent.parent
STATIC_DIR = SCRIPT_DIR.parent / "static"
VERSIONS_DIR = STATIC_DIR / "api" / "versions"

# Package repository paths (for getting tag dates)
PACKAGE_REPOS = {
    "pathsim": ROOT_DIR / "pathsim",
    "chem": ROOT_DIR / "pathsim-chem",
    "vehicle": ROOT_DIR / "pathsim-vehicle",
}


def parse_version(version: str) -> tuple[int, int, int]:
    """Parse version string into (major, minor, patch) tuple."""
    match = re.match(r"^(\d+)\.(\d+)\.(\d+)$", version)
    if not match:
        return (0, 0, 0)
    return (int(match.group(1)), int(match.group(2)), int(match.group(3)))


def get_version_files(package_dir: Path) -> list[str]:
    """Get all version JSON files in a package directory."""
    if not package_dir.exists():
        return []

    tags = []
    for f in package_dir.glob("v*.json"):
        # Extract full tag from filename (e.g., "v0.16.4.json" -> "v0.16.4")
        match = re.match(r"^(v\d+\.\d+\.\d+)\.json$", f.name)
        if match:
            tags.append(match.group(1))

    return tags


def get_tag_for_version(repo_path: Path, version: str) -> str:
    """Find the latest patch tag for a minor version."""
    if not repo_path.exists():
        return f"v{version}.0"

    try:
        result = subprocess.run(
            ["git", "tag", "-l", f"v{version}.*"],
            cwd=repo_path,
            capture_output=True,
            text=True,
            check=True,
        )
        tags = result.stdout.strip().split("\n")
        tags = [t for t in tags if t and re.match(rf"^v{re.escape(version)}\.\d+$", t)]

        if not tags:
            return f"v{version}.0"

        # Sort by patch version and return the latest
        def patch_num(tag: str) -> int:
            match = re.search(r"\.(\d+)$", tag)
            return int(match.group(1)) if match else 0

        return max(tags, key=patch_num)
    except subprocess.CalledProcessError:
        return f"v{version}.0"


def get_tag_date(repo_path: Path, tag: str) -> str:
    """Get the date a tag was created."""
    if not repo_path.exists():
        return ""

    try:
        result = subprocess.run(
            ["git", "log", "-1", "--format=%ci", tag],
            cwd=repo_path,
            capture_output=True,
            text=True,
            check=True,
        )
        # Format: "2025-01-15 10:30:00 +0100" -> "2025-01-15"
        date_str = result.stdout.strip()
        return date_str.split()[0] if date_str else ""
    except subprocess.CalledProcessError:
        return ""


def generate_manifest(package_id: str, dry_run: bool = False) -> dict[str, Any] | None:
    """Generate manifest for a single package."""
    package_dir = VERSIONS_DIR / package_id
    tags = get_version_files(package_dir)

    if not tags:
        print(f"  No version files found in {package_dir}")
        return None

    # Sort tags by version (newest first)
    def tag_to_version(tag: str) -> tuple[int, int, int]:
        version_str = tag[1:] if tag.startswith('v') else tag
        return parse_version(version_str)

    sorted_tags = sorted(tags, key=tag_to_version, reverse=True)
    latest_tag = sorted_tags[0]

    print(f"  Found {len(tags)} versions: {sorted_tags}")
    print(f"  Latest: {latest_tag}")

    # Build version info list
    repo_path = PACKAGE_REPOS.get(package_id)
    version_infos = []

    for tag in sorted_tags:
        released = get_tag_date(repo_path, tag) if repo_path else ""

        version_infos.append({
            "tag": tag,
            "released": released,
        })

    manifest = {
        "package": package_id,
        "latestTag": latest_tag,
        "versions": version_infos,
    }

    if dry_run:
        print(f"  Would write manifest:")
        print(json.dumps(manifest, indent=2))
    else:
        manifest_path = package_dir / "manifest.json"
        with open(manifest_path, "w", encoding="utf-8") as f:
            json.dump(manifest, f, indent=2, ensure_ascii=False)
        print(f"  Written: {manifest_path}")

    return manifest


def main():
    parser = argparse.ArgumentParser(
        description="Generate manifest.json files for versioned API documentation",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "--package", "-p",
        choices=list(PACKAGE_REPOS.keys()),
        help="Generate manifest for single package (default: all)"
    )
    parser.add_argument(
        "--dry-run", "-n",
        action="store_true",
        help="Preview manifest without writing"
    )
    args = parser.parse_args()

    print("PathSim API Version Manifest Generator")
    print("=" * 40)

    packages = [args.package] if args.package else list(PACKAGE_REPOS.keys())

    for pkg_id in packages:
        print(f"\nGenerating manifest for {pkg_id}:")
        generate_manifest(pkg_id, dry_run=args.dry_run)

    print("\nDone!")


if __name__ == "__main__":
    main()
