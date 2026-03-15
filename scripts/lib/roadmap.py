"""
Fetch roadmap issues from GitHub for each package.

Writes static/{package}/roadmap.json with open issues labeled 'roadmap'.
"""

import json
import os
from datetime import datetime, timezone
from pathlib import Path

import requests

from .config import PACKAGES, STATIC_DIR


def fetch_roadmap_issues(github_repo: str) -> list[dict]:
    """
    Fetch open issues with the 'roadmap' label from a GitHub repo.

    Args:
        github_repo: GitHub repo in "owner/name" format.

    Returns:
        List of issue dicts with relevant fields.
    """
    token = os.environ.get("GITHUB_TOKEN", "")
    headers = {"Authorization": f"token {token}"} if token else {}

    url = f"https://api.github.com/repos/{github_repo}/issues"
    params = {
        "state": "open",
        "labels": "roadmap",
        "sort": "created",
        "direction": "desc",
        "per_page": 100,
    }

    response = requests.get(url, headers=headers, params=params, timeout=30)
    response.raise_for_status()
    raw_issues = response.json()

    issues = []
    for issue in raw_issues:
        # Skip pull requests
        if "pull_request" in issue:
            continue

        body = (issue.get("body") or "").strip()

        labels = [
            label["name"]
            for label in issue.get("labels", [])
            if label["name"] != "roadmap"
        ]

        issues.append({
            "number": issue["number"],
            "title": issue["title"],
            "body": body,
            "labels": labels,
            "url": issue["html_url"],
            "created": issue["created_at"],
        })

    return issues


def build_roadmap(package_id: str, dry_run: bool = False) -> bool:
    """
    Fetch and write roadmap.json for a single package.

    Returns True if roadmap items were found.
    """
    pkg_config = PACKAGES.get(package_id)
    if not pkg_config:
        print(f"  Unknown package: {package_id}")
        return False

    github_repo = pkg_config.get("github_repo")
    if not github_repo:
        print(f"  No github_repo configured for {package_id}")
        return False

    output_dir = STATIC_DIR / package_id
    output_path = output_dir / "roadmap.json"

    try:
        issues = fetch_roadmap_issues(github_repo)
    except Exception as e:
        print(f"  Failed to fetch roadmap for {package_id}: {e}")
        return False

    if dry_run:
        print(f"  Would write {len(issues)} roadmap items to {output_path}")
        return len(issues) > 0

    output_dir.mkdir(parents=True, exist_ok=True)

    roadmap = {
        "package": package_id,
        "repo": github_repo,
        "updated": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "issues": issues,
    }

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(roadmap, f, indent=2, ensure_ascii=False)

    print(f"  {len(issues)} roadmap items")

    # Remove roadmap.json if empty (so hasRoadmap stays false)
    if not issues:
        output_path.unlink(missing_ok=True)

    return len(issues) > 0


def build_all_roadmaps(dry_run: bool = False) -> None:
    """Fetch roadmaps for all configured packages."""
    print("\nFetching roadmap issues")
    print("=" * 50)
    for package_id in PACKAGES:
        print(f"  {PACKAGES[package_id]['display_name']}:")
        build_roadmap(package_id, dry_run)
