#!/usr/bin/env python3
"""
PathSim Multi-Version API Extractor

Extracts API documentation for multiple versions of PathSim packages by checking out
historical git tags and running the extraction script.

Version strategy:
- Historical versions: Only vX.Y.0 tags (first patch of each minor version)
- Latest version: Always the actual most recent tag (e.g., v0.16.4)

Smart extraction mode (default):
- Only extracts missing vX.Y.0 versions from cache
- Always re-extracts the latest version (actual latest tag)
- Respects minimum supported version per package

Usage:
    python scripts/extract-versions.py              # Smart extract (missing + latest)
    python scripts/extract-versions.py --all        # Force extract all vX.Y.0 versions + latest
    python scripts/extract-versions.py --package pathsim  # Single package
    python scripts/extract-versions.py --dry-run   # Preview without extraction
"""

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path
from typing import Any

SCRIPT_DIR = Path(__file__).parent
ROOT_DIR = SCRIPT_DIR.parent.parent
STATIC_DIR = SCRIPT_DIR.parent / "static"
VERSIONS_DIR = STATIC_DIR / "api" / "versions"

# Package repository paths
PACKAGE_REPOS = {
    "pathsim": ROOT_DIR / "pathsim",
    "chem": ROOT_DIR / "pathsim-chem",
    "vehicle": ROOT_DIR / "pathsim-vehicle",
}

# Package names in git repos
PACKAGE_GIT_NAMES = {
    "pathsim": "pathsim",
    "chem": "pathsim-chem",
    "vehicle": "pathsim-vehicle",
}

# Minimum supported versions per package
# Only versions >= this will be extracted and documented
MIN_SUPPORTED_VERSIONS = {
    "pathsim": "0.5",      # First stable API
    "chem": "0.1",         # Initial release
    "vehicle": "0.1",      # Initial release
}


def get_git_tags(repo_path: Path) -> list[str]:
    """Get all git tags matching vX.Y.Z pattern."""
    try:
        result = subprocess.run(
            ["git", "tag", "-l", "v*.*.*"],
            cwd=repo_path,
            capture_output=True,
            text=True,
            check=True,
        )
        tags = result.stdout.strip().split("\n")
        return [t for t in tags if t and re.match(r"^v\d+\.\d+\.\d+$", t)]
    except subprocess.CalledProcessError:
        return []


def parse_version(tag: str) -> tuple[int, int, int]:
    """Parse version tag into (major, minor, patch) tuple."""
    match = re.match(r"^v(\d+)\.(\d+)\.(\d+)$", tag)
    if not match:
        return (0, 0, 0)
    return (int(match.group(1)), int(match.group(2)), int(match.group(3)))


def get_minor_version(tag: str) -> str:
    """Extract minor version string from tag (e.g., 'v0.16.4' -> '0.16')."""
    major, minor, _ = parse_version(tag)
    return f"{major}.{minor}"


def parse_minor_version(version: str) -> tuple[int, int]:
    """Parse minor version string into (major, minor) tuple."""
    match = re.match(r"^(\d+)\.(\d+)$", version)
    if not match:
        return (0, 0)
    return (int(match.group(1)), int(match.group(2)))


def version_gte(version: str, min_version: str) -> bool:
    """Check if version >= min_version."""
    return parse_minor_version(version) >= parse_minor_version(min_version)


def get_cached_versions(package_id: str) -> set[str]:
    """Get set of already cached version tags for a package."""
    package_dir = VERSIONS_DIR / package_id
    if not package_dir.exists():
        return set()

    cached = set()
    for f in package_dir.glob("v*.json"):
        # Match full version tags like v0.16.0.json or v0.16.4.json
        match = re.match(r"^(v\d+\.\d+\.\d+)\.json$", f.name)
        if match:
            cached.add(match.group(1))
    return cached


def get_minor_zero_tags(tags: list[str]) -> dict[str, str]:
    """Get vX.Y.0 tags for each minor version (for historical caching)."""
    versions: dict[str, str] = {}

    for tag in tags:
        major, minor, patch = parse_version(tag)
        if patch == 0:  # Only vX.Y.0 tags
            minor_str = f"{major}.{minor}"
            versions[minor_str] = tag

    return versions


def get_latest_tag(tags: list[str]) -> tuple[str, str] | None:
    """Get the actual latest tag (highest version number)."""
    if not tags:
        return None

    latest_tag = max(tags, key=parse_version)
    minor = get_minor_version(latest_tag)
    return (minor, latest_tag)


def git_checkout(repo_path: Path, ref: str) -> bool:
    """Checkout a specific git ref."""
    try:
        subprocess.run(
            ["git", "checkout", ref],
            cwd=repo_path,
            capture_output=True,
            check=True,
        )
        return True
    except subprocess.CalledProcessError as e:
        print(f"  Error checking out {ref}: {e.stderr.decode() if e.stderr else str(e)}")
        return False


def git_checkout_branch(repo_path: Path, branch: str = "main") -> bool:
    """Return to a branch (main or master)."""
    for b in [branch, "master", "main"]:
        try:
            subprocess.run(
                ["git", "checkout", b],
                cwd=repo_path,
                capture_output=True,
                check=True,
            )
            return True
        except subprocess.CalledProcessError:
            continue
    return False


def run_extraction(package_id: str, version: str, versions_dir: Path) -> bool:
    """Run the extraction script for a specific version."""
    try:
        subprocess.run(
            [
                sys.executable,
                str(SCRIPT_DIR / "extract-api.py"),
                "--package", package_id,
                "--version", version,
                "--versions-dir", str(versions_dir),
                "--no-index",
            ],
            check=True,
        )
        return True
    except subprocess.CalledProcessError as e:
        print(f"  Error extracting {package_id} v{version}: {e}")
        return False


def extract_package_versions(
    package_id: str,
    extract_all: bool = False,
    dry_run: bool = False,
) -> list[dict[str, str]]:
    """Extract versions for a single package.

    Version strategy:
    - Historical versions: Only vX.Y.0 tags (first patch of each minor)
    - Latest version: Always the actual most recent tag (e.g., v0.16.4)

    Smart mode (default): Only extracts missing historical versions + always re-extracts latest.
    All mode: Extracts all vX.Y.0 versions from minimum supported version + latest.
    """
    repo_path = PACKAGE_REPOS.get(package_id)
    if not repo_path or not repo_path.exists():
        print(f"  Repository not found: {repo_path}")
        return []

    print(f"\n{'='*40}")
    print(f"Processing {package_id}")
    print(f"{'='*40}")

    # Get minimum supported version
    min_version = MIN_SUPPORTED_VERSIONS.get(package_id, "0.1")
    print(f"  Minimum supported version: {min_version}")

    # Get all tags
    all_tags = get_git_tags(repo_path)
    if not all_tags:
        print(f"  No version tags found in {repo_path}")
        return []

    print(f"  Found {len(all_tags)} tags")

    # Get vX.Y.0 tags for historical versions
    minor_zero_versions = get_minor_zero_tags(all_tags)

    # Filter to supported versions only
    supported_historical = {
        v: tag for v, tag in minor_zero_versions.items()
        if version_gte(v, min_version)
    }

    # Get the actual latest tag (could be vX.Y.Z where Z > 0)
    latest_info = get_latest_tag(all_tags)
    if not latest_info:
        print(f"  No valid tags found")
        return []

    latest_minor, latest_tag = latest_info
    print(f"  Latest tag: {latest_tag} (minor: {latest_minor})")
    print(f"  Historical vX.Y.0 versions: {sorted(supported_historical.keys(), key=parse_minor_version, reverse=True)}")

    # Determine which versions to extract
    # Now using full tags (e.g., v0.16.0, v0.16.4) not just minor versions
    cached = get_cached_versions(package_id)

    # Build extraction list: all vX.Y.0 tags + latest patch if different
    versions_to_extract = []  # List of (tag, is_latest) tuples

    if extract_all:
        # Extract all vX.Y.0 versions
        for minor_version, tag in sorted(supported_historical.items(), key=lambda x: parse_minor_version(x[0]), reverse=True):
            versions_to_extract.append((tag, False))
        # Add latest if it's a patch release (not .0)
        if latest_tag not in [t for t, _ in versions_to_extract]:
            versions_to_extract.append((latest_tag, True))
        print(f"  Mode: Extract ALL ({len(versions_to_extract)} versions)")
    else:
        # Smart mode: only missing .0 versions + always re-extract latest
        for minor_version, tag in sorted(supported_historical.items(), key=lambda x: parse_minor_version(x[0]), reverse=True):
            if tag not in cached:
                versions_to_extract.append((tag, False))

        # Always add latest (will be re-extracted)
        # Mark as latest so we know to always extract it
        versions_to_extract.append((latest_tag, True))

        missing_count = len([t for t, is_latest in versions_to_extract if not is_latest])
        print(f"  Mode: Smart extraction")
        print(f"    Cached: {len(cached)} tags")
        print(f"    Missing .0 releases: {missing_count}")
        print(f"    Latest ({latest_tag}): will {'re-' if latest_tag in cached else ''}extract")
        print(f"    Total to extract: {len(versions_to_extract)} versions")

    extracted = []
    output_dir = VERSIONS_DIR / package_id
    output_dir.mkdir(parents=True, exist_ok=True)

    for tag, is_latest in versions_to_extract:
        is_cached = tag in cached
        status = "LATEST" if is_latest else ("NEW" if not is_cached else "cached")
        # Extract version string from tag (e.g., "v0.16.4" -> "0.16.4")
        version_str = tag[1:] if tag.startswith('v') else tag

        print(f"\n  {tag} [{status}]")

        if dry_run:
            print(f"    Would extract to: {output_dir / f'{tag}.json'}")
            extracted.append({
                "tag": tag,
                "released": "",
                "latest": is_latest,
            })
            continue

        # Checkout the tag
        if not git_checkout(repo_path, tag):
            continue

        # Run extraction - pass full version string (e.g., "0.16.4")
        if run_extraction(package_id, version_str, VERSIONS_DIR):
            extracted.append({
                "tag": tag,
                "released": get_tag_date(repo_path, tag),
                "latest": is_latest,
            })
            print(f"    ✓ Extracted successfully")
        else:
            print(f"    ✗ Extraction failed")

    # Return to main branch
    if not dry_run:
        git_checkout_branch(repo_path)

    return extracted


def get_tag_date(repo_path: Path, tag: str) -> str:
    """Get the date a tag was created."""
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


def main():
    parser = argparse.ArgumentParser(
        description="Extract API documentation for multiple package versions",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Minimum supported versions:
  pathsim: %(pathsim)s
  chem:    %(chem)s
  vehicle: %(vehicle)s

Version strategy:
  - Historical: Only vX.Y.0 tags (first patch of each minor)
  - Latest: Actual most recent tag (e.g., v0.16.4)

By default, uses smart extraction:
  - Only extracts missing vX.Y.0 versions from cache
  - Always re-extracts the latest version
  - Respects minimum supported versions
        """ % MIN_SUPPORTED_VERSIONS
    )
    parser.add_argument(
        "--package", "-p",
        choices=list(PACKAGE_REPOS.keys()),
        help="Extract single package (default: all)"
    )
    parser.add_argument(
        "--all", "-a",
        action="store_true",
        dest="extract_all",
        help="Force extract all vX.Y.0 versions + latest (ignore cache)"
    )
    parser.add_argument(
        "--dry-run", "-n",
        action="store_true",
        help="Preview extraction without actually extracting"
    )
    args = parser.parse_args()

    print("PathSim Multi-Version API Extractor")
    print("=" * 40)
    if args.extract_all:
        print("Mode: EXTRACT ALL (ignoring cache)")
    else:
        print("Mode: SMART (missing + latest only)")

    packages = [args.package] if args.package else list(PACKAGE_REPOS.keys())
    all_results = {}

    for pkg_id in packages:
        results = extract_package_versions(
            pkg_id,
            extract_all=args.extract_all,
            dry_run=args.dry_run,
        )
        if results:
            all_results[pkg_id] = results

    print("\n" + "=" * 40)
    print("Summary")
    print("=" * 40)
    for pkg_id, versions in all_results.items():
        print(f"  {pkg_id}: {len(versions)} versions extracted")

    if not args.dry_run:
        print(f"\nOutput directory: {VERSIONS_DIR}")
        print("Run generate-manifests.py to create manifest files")


if __name__ == "__main__":
    main()
