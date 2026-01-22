"""
Git utilities for the pathsim-docs build system.
"""

import re
import subprocess
from pathlib import Path


def get_tags(repo_path: Path) -> list[str]:
    """Get all git tags matching vX.Y.Z pattern, sorted by version."""
    if not repo_path.exists():
        return []

    try:
        result = subprocess.run(
            ["git", "tag", "-l", "v*.*.*"],
            cwd=repo_path,
            capture_output=True,
            text=True,
            check=True,
        )
        tags = result.stdout.strip().split("\n")
        tags = [t for t in tags if t and re.match(r"^v\d+\.\d+\.\d+$", t)]
        return sorted(tags, key=parse_version, reverse=True)
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


def get_latest_tag(tags: list[str]) -> str | None:
    """Get the latest tag (highest version number)."""
    if not tags:
        return None
    return max(tags, key=parse_version)


def get_minor_zero_tags(tags: list[str], min_version: str = "0.0") -> list[str]:
    """Get vX.Y.0 tags (first patch of each minor version) that meet minimum."""
    result = []
    seen_minors = set()

    for tag in tags:
        major, minor, patch = parse_version(tag)
        if patch != 0:
            continue

        minor_str = f"{major}.{minor}"
        if minor_str in seen_minors:
            continue

        if not version_gte(minor_str, min_version):
            continue

        seen_minors.add(minor_str)
        result.append(tag)

    return sorted(result, key=parse_version, reverse=True)


def checkout(repo_path: Path, ref: str) -> bool:
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
        print(f"    Error checking out {ref}: {e.stderr.decode() if e.stderr else str(e)}")
        return False


def checkout_main(repo_path: Path) -> bool:
    """Return to main/master branch."""
    for branch in ["main", "master"]:
        try:
            subprocess.run(
                ["git", "checkout", branch],
                cwd=repo_path,
                capture_output=True,
                check=True,
            )
            return True
        except subprocess.CalledProcessError:
            continue
    return False


def get_tag_date(repo_path: Path, tag: str) -> str:
    """Get the date a tag was created (YYYY-MM-DD)."""
    try:
        result = subprocess.run(
            ["git", "log", "-1", "--format=%ci", tag],
            cwd=repo_path,
            capture_output=True,
            text=True,
            check=True,
        )
        date_str = result.stdout.strip()
        return date_str.split()[0] if date_str else ""
    except subprocess.CalledProcessError:
        return ""
