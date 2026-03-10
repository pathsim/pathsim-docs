#!/usr/bin/env python3
"""
Generate llms.txt and llms-full.txt for the PathSim documentation site.

These files make the documentation discoverable by AI agents.

Usage:
    python scripts/build-llms-txt.py
"""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from lib.config import PACKAGES, STATIC_DIR, CATEGORIES

BASE_URL = "https://docs.pathsim.org"

DESCRIPTION = (
    "PathSim is a Python framework for simulating dynamical systems using "
    "block diagrams. It supports continuous-time, discrete-time, and hybrid "
    "systems with 18+ numerical solvers, hierarchical subsystems, event "
    "handling, and MIMO connections."
)


def load_package_manifest(package_id: str) -> dict | None:
    path = STATIC_DIR / package_id / "manifest.json"
    if not path.exists():
        return None
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def load_version_data(package_id: str, tag: str) -> tuple[dict | None, dict | None]:
    version_dir = STATIC_DIR / package_id / tag
    api_data = None
    manifest = None

    api_path = version_dir / "api.json"
    if api_path.exists():
        with open(api_path, "r", encoding="utf-8") as f:
            api_data = json.load(f)

    manifest_path = version_dir / "manifest.json"
    if manifest_path.exists():
        with open(manifest_path, "r", encoding="utf-8") as f:
            manifest = json.load(f)

    return api_data, manifest


def generate_llms_txt() -> str:
    """Generate the lightweight llms.txt index."""
    lines = []
    lines.append("# PathSim Documentation")
    lines.append("")
    lines.append(f"> {DESCRIPTION}")
    lines.append("")

    for package_id, pkg_config in PACKAGES.items():
        pkg_manifest = load_package_manifest(package_id)
        if not pkg_manifest:
            continue

        latest = pkg_manifest["latestTag"]
        display_name = pkg_config["display_name"]

        api_data, manifest = load_version_data(package_id, latest)

        lines.append(f"## {display_name} ({latest})")
        lines.append("")

        # API overview
        if api_data:
            api_url = f"{BASE_URL}/{package_id}/{latest}/api"
            lines.append(f"- [{display_name} API Reference]({api_url}): Full API documentation")

            modules = api_data.get("modules", {})
            for module_name, module in modules.items():
                desc = module.get("description", "")
                anchor = module_name.replace(".", "-")
                entry = f"- [{module_name}]({api_url}#{anchor})"
                if desc:
                    entry += f": {desc}"
                lines.append(entry)

                for cls in module.get("classes", []):
                    cls_desc = cls.get("description", "")
                    cls_entry = f"  - [{cls['name']}]({api_url}#{cls['name']})"
                    if cls_desc:
                        cls_entry += f": {cls_desc}"
                    lines.append(cls_entry)

            lines.append("")

        # Examples
        if manifest:
            notebooks = manifest.get("notebooks", [])
            if notebooks:
                lines.append(f"### Examples")
                lines.append("")
                for nb in notebooks:
                    slug = nb.get("slug", "")
                    title = nb.get("title", slug)
                    desc = nb.get("description", "")
                    url = f"{BASE_URL}/{package_id}/{latest}/examples/{slug}"
                    entry = f"- [{title}]({url})"
                    if desc:
                        entry += f": {desc}"
                    lines.append(entry)
                lines.append("")

    # Links
    lines.append("## Links")
    lines.append("")
    lines.append("- [PathSim Homepage](https://pathsim.org): Project homepage")
    lines.append("- [PathView Editor](https://view.pathsim.org): Browser-based visual block diagram editor")
    lines.append("- [GitHub](https://github.com/pathsim): Source code repositories")
    lines.append("- [PyPI](https://pypi.org/project/pathsim): Python package")
    lines.append("- [JOSS Paper](https://doi.org/10.21105/joss.07484): Published paper")
    lines.append("")

    return "\n".join(lines)


def generate_llms_full_txt() -> str:
    """Generate llms-full.txt with complete API documentation content."""
    lines = []
    lines.append("# PathSim Documentation (Full)")
    lines.append("")
    lines.append(f"> {DESCRIPTION}")
    lines.append("")

    for package_id, pkg_config in PACKAGES.items():
        pkg_manifest = load_package_manifest(package_id)
        if not pkg_manifest:
            continue

        latest = pkg_manifest["latestTag"]
        display_name = pkg_config["display_name"]

        api_data, manifest = load_version_data(package_id, latest)

        lines.append(f"## {display_name} ({latest})")
        lines.append("")

        # Full API content
        if api_data:
            modules = api_data.get("modules", {})
            for module_name, module in modules.items():
                lines.append(f"### {module_name}")
                lines.append("")

                desc = module.get("description", "")
                if desc:
                    lines.append(desc)
                    lines.append("")

                for cls in module.get("classes", []):
                    cls_name = cls["name"]
                    cls_desc = cls.get("description", "")
                    bases = cls.get("bases", [])

                    base_str = f"({', '.join(bases)})" if bases else ""
                    lines.append(f"#### class {cls_name}{base_str}")
                    lines.append("")

                    if cls_desc:
                        lines.append(cls_desc)
                        lines.append("")

                    # Attributes
                    for attr in cls.get("attributes", []):
                        attr_name = attr.get("name", "")
                        attr_type = attr.get("type", "")
                        attr_desc = attr.get("description", "")
                        if attr_name.startswith("_"):
                            continue
                        type_str = f": {attr_type}" if attr_type else ""
                        entry = f"- `{attr_name}{type_str}`"
                        if attr_desc:
                            entry += f" — {attr_desc}"
                        lines.append(entry)

                    if cls.get("attributes"):
                        lines.append("")

                    # Methods
                    for method in cls.get("methods", []):
                        method_name = method.get("name", "")
                        if method_name.startswith("_") and method_name != "__init__":
                            continue
                        sig = method.get("signature", "()")
                        method_desc = method.get("description", "")
                        lines.append(f"**{cls_name}.{method_name}**`{sig}`")
                        if method_desc:
                            lines.append(f": {method_desc}")
                        lines.append("")

                for func in module.get("functions", []):
                    func_name = func.get("name", "")
                    sig = func.get("signature", "()")
                    func_desc = func.get("description", "")
                    lines.append(f"#### {func_name}`{sig}`")
                    if func_desc:
                        lines.append(func_desc)
                    lines.append("")

        # Examples with descriptions
        if manifest:
            notebooks = manifest.get("notebooks", [])
            if notebooks:
                lines.append(f"### Examples")
                lines.append("")
                for nb in notebooks:
                    slug = nb.get("slug", "")
                    title = nb.get("title", slug)
                    desc = nb.get("description", "")
                    tags = nb.get("tags", [])
                    category = nb.get("category", "")
                    url = f"{BASE_URL}/{package_id}/{latest}/examples/{slug}"

                    lines.append(f"#### [{title}]({url})")
                    if desc:
                        lines.append(desc)
                    if tags:
                        lines.append(f"Tags: {', '.join(tags)}")
                    lines.append("")

    # Links
    lines.append("## Links")
    lines.append("")
    lines.append("- [PathSim Homepage](https://pathsim.org): Project homepage")
    lines.append("- [PathView Editor](https://view.pathsim.org): Browser-based visual block diagram editor")
    lines.append("- [GitHub](https://github.com/pathsim): Source code repositories")
    lines.append("- [PyPI](https://pypi.org/project/pathsim): Python package")
    lines.append("- [JOSS Paper](https://doi.org/10.21105/joss.07484): Published paper")
    lines.append("")

    return "\n".join(lines)


def main():
    output_dir = STATIC_DIR

    llms_txt = generate_llms_txt()
    llms_path = output_dir / "llms.txt"
    with open(llms_path, "w", encoding="utf-8") as f:
        f.write(llms_txt)
    print(f"Generated {llms_path} ({len(llms_txt)} bytes)")

    llms_full_txt = generate_llms_full_txt()
    llms_full_path = output_dir / "llms-full.txt"
    with open(llms_full_path, "w", encoding="utf-8") as f:
        f.write(llms_full_txt)
    print(f"Generated {llms_full_path} ({len(llms_full_txt)} bytes)")


if __name__ == "__main__":
    main()
