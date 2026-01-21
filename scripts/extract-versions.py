#!/usr/bin/env python3
"""
PathSim Multi-Version API Extractor

Extracts API documentation for multiple versions of PathSim packages by checking out
historical git tags and running the extraction script.

Usage:
    python scripts/extract-versions.py              # Extract all versions
    python scripts/extract-versions.py --package pathsim  # Single package
    python scripts/extract-versions.py --limit 3   # Only latest 3 minor versions
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


def group_by_minor_version(tags: list[str]) -> dict[str, str]:
    """Group tags by minor version, keeping the latest patch for each."""
    versions: dict[str, tuple[str, tuple[int, int, int]]] = {}

    for tag in tags:
        minor = get_minor_version(tag)
        version_tuple = parse_version(tag)

        if minor not in versions or version_tuple > versions[minor][1]:
            versions[minor] = (tag, version_tuple)

    # Return dict of minor_version -> tag
    return {minor: tag for minor, (tag, _) in versions.items()}


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
    limit: int | None = None,
    dry_run: bool = False,
) -> list[dict[str, str]]:
    """Extract all versions for a single package."""
    repo_path = PACKAGE_REPOS.get(package_id)
    if not repo_path or not repo_path.exists():
        print(f"  Repository not found: {repo_path}")
        return []

    print(f"\n{'='*40}")
    print(f"Processing {package_id}")
    print(f"{'='*40}")

    # Get all tags
    all_tags = get_git_tags(repo_path)
    if not all_tags:
        print(f"  No version tags found in {repo_path}")
        return []

    print(f"  Found {len(all_tags)} tags")

    # Group by minor version
    minor_versions = group_by_minor_version(all_tags)
    print(f"  {len(minor_versions)} minor versions: {sorted(minor_versions.keys(), reverse=True)}")

    # Sort by version (newest first)
    sorted_versions = sorted(
        minor_versions.items(),
        key=lambda x: parse_version(x[1]),
        reverse=True,
    )

    # Apply limit
    if limit:
        sorted_versions = sorted_versions[:limit]
        print(f"  Limited to {limit} versions")

    extracted = []
    output_dir = VERSIONS_DIR / package_id
    output_dir.mkdir(parents=True, exist_ok=True)

    for minor_version, tag in sorted_versions:
        print(f"\n  Version {minor_version} (tag: {tag})")

        if dry_run:
            print(f"    Would extract to: {output_dir / f'v{minor_version}.json'}")
            extracted.append({
                "version": minor_version,
                "tag": tag,
                "released": "",  # Would need git log for this
            })
            continue

        # Checkout the tag
        if not git_checkout(repo_path, tag):
            continue

        # Run extraction
        if run_extraction(package_id, minor_version, VERSIONS_DIR):
            extracted.append({
                "version": minor_version,
                "tag": tag,
                "released": get_tag_date(repo_path, tag),
            })
            print(f"    Extracted successfully")
        else:
            print(f"    Extraction failed")

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
    )
    parser.add_argument(
        "--package", "-p",
        choices=list(PACKAGE_REPOS.keys()),
        help="Extract single package (default: all)"
    )
    parser.add_argument(
        "--limit", "-l",
        type=int,
        help="Maximum number of minor versions to extract per package"
    )
    parser.add_argument(
        "--dry-run", "-n",
        action="store_true",
        help="Preview extraction without actually extracting"
    )
    args = parser.parse_args()

    print("PathSim Multi-Version API Extractor")
    print("=" * 40)

    packages = [args.package] if args.package else list(PACKAGE_REPOS.keys())
    all_results = {}

    for pkg_id in packages:
        results = extract_package_versions(
            pkg_id,
            limit=args.limit,
            dry_run=args.dry_run,
        )
        if results:
            all_results[pkg_id] = results

    print("\n" + "=" * 40)
    print("Summary")
    print("=" * 40)
    for pkg_id, versions in all_results.items():
        print(f"  {pkg_id}: {len(versions)} versions")

    if not args.dry_run:
        print(f"\nOutput directory: {VERSIONS_DIR}")
        print("Run generate-manifests.py to create manifest files")


if __name__ == "__main__":
    main()
