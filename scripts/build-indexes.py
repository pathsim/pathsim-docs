#!/usr/bin/env python3
"""
Build search and crossref indexes from API data and notebook manifests.

This script generates pre-built indexes at build time, eliminating
the need for runtime index construction in the browser.

Outputs:
  - src/lib/api/generated/search-index.json
  - src/lib/api/generated/crossref-index.json
"""

import json
from pathlib import Path
from typing import Any

# Paths relative to script location
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
API_DIR = PROJECT_ROOT / "src" / "lib" / "api" / "generated"
NOTEBOOKS_DIR = PROJECT_ROOT / "static" / "notebooks"

# Package configuration (mirrors src/lib/config/packages.ts)
PACKAGES = {
    "pathsim": {
        "name": "PathSim",
        "description": "Block-diagram based simulation framework for dynamical systems"
    },
    "chem": {
        "name": "PathSim-Chem",
        "description": "Chemical reaction network simulation"
    },
    "vehicle": {
        "name": "PathSim-Vehicle",
        "description": "Vehicle dynamics simulation"
    }
}

PACKAGE_ORDER = ["pathsim", "chem", "vehicle"]


def load_api_data() -> dict[str, Any]:
    """Load all API JSON files."""
    api_data = {}
    for pkg_id in PACKAGE_ORDER:
        json_path = API_DIR / f"{pkg_id}.json"
        if json_path.exists():
            with open(json_path, "r", encoding="utf-8") as f:
                api_data[pkg_id] = json.load(f)
    return api_data


def load_notebook_manifests() -> dict[str, list[dict]]:
    """Load all notebook manifests."""
    manifests = {}
    for pkg_id in PACKAGE_ORDER:
        manifest_path = NOTEBOOKS_DIR / pkg_id / "manifest.json"
        if manifest_path.exists():
            with open(manifest_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                manifests[pkg_id] = data.get("notebooks", [])
    return manifests


def build_search_index(api_data: dict, manifests: dict) -> list[dict]:
    """Build the search index from API data and notebook manifests."""
    results = []

    # Track which packages have examples
    packages_with_examples = set(pkg_id for pkg_id, notebooks in manifests.items() if notebooks)

    # 1. Add page-level results
    for pkg_id in PACKAGE_ORDER:
        pkg = PACKAGES.get(pkg_id, {})
        pkg_name = pkg.get("name", pkg_id)
        pkg_desc = pkg.get("description", "")

        # Overview page
        results.append({
            "type": "page",
            "name": pkg_name,
            "description": pkg_desc,
            "path": pkg_id,
            "packageId": pkg_id,
            "moduleName": ""
        })

        # API page
        results.append({
            "type": "page",
            "name": f"{pkg_name} API",
            "description": f"API reference for {pkg_name}",
            "path": f"{pkg_id}/api",
            "packageId": pkg_id,
            "moduleName": ""
        })

        # Examples page (only if package has examples)
        if pkg_id in packages_with_examples:
            results.append({
                "type": "page",
                "name": f"{pkg_name} Examples",
                "description": f"Example notebooks for {pkg_name}",
                "path": f"{pkg_id}/examples",
                "packageId": pkg_id,
                "moduleName": ""
            })

    # 2. Add API items (modules, classes, methods, functions)
    for pkg_id, pkg_data in api_data.items():
        base_path = f"{pkg_id}/api"
        modules = pkg_data.get("modules", {})

        for module_name, module in modules.items():
            # Module
            results.append({
                "type": "module",
                "name": module_name,
                "description": module.get("description", ""),
                "path": f"{base_path}#{module_name}",
                "packageId": pkg_id,
                "moduleName": module_name
            })

            # Classes
            for cls in module.get("classes", []):
                results.append({
                    "type": "class",
                    "name": cls["name"],
                    "description": cls.get("description", ""),
                    "path": f"{base_path}#{cls['name']}",
                    "packageId": pkg_id,
                    "moduleName": module_name
                })

                # Methods
                for method in cls.get("methods", []):
                    results.append({
                        "type": "method",
                        "name": method["name"],
                        "description": method.get("description", ""),
                        "path": f"{base_path}#{method['name']}",
                        "packageId": pkg_id,
                        "moduleName": module_name,
                        "parentClass": cls["name"]
                    })

            # Functions
            for func in module.get("functions", []):
                results.append({
                    "type": "function",
                    "name": func["name"],
                    "description": func.get("description", ""),
                    "path": f"{base_path}#{func['name']}",
                    "packageId": pkg_id,
                    "moduleName": module_name
                })

    # 3. Add examples from notebook manifests
    for pkg_id, notebooks in manifests.items():
        for notebook in notebooks:
            results.append({
                "type": "example",
                "name": notebook.get("title", ""),
                "description": notebook.get("description", ""),
                "path": f"{pkg_id}/examples/{notebook.get('slug', '')}",
                "packageId": pkg_id,
                "moduleName": notebook.get("category", ""),
                "tags": notebook.get("tags", [])
            })

    return results


def build_crossref_index(api_data: dict) -> dict[str, dict]:
    """Build the crossref index mapping names to targets."""
    index = {}

    for pkg_id, pkg_data in api_data.items():
        api_path = f"{pkg_id}/api"
        modules = pkg_data.get("modules", {})

        for module_name, module in modules.items():
            # Module
            module_target = {
                "name": module_name,
                "type": "module",
                "packageId": pkg_id,
                "moduleName": module_name,
                "path": f"{api_path}#{module_name.replace('.', '-')}"
            }
            index[module_name] = module_target

            # Classes
            for cls in module.get("classes", []):
                class_target = {
                    "name": cls["name"],
                    "type": "class",
                    "packageId": pkg_id,
                    "moduleName": module_name,
                    "path": f"{api_path}#{cls['name']}"
                }

                # Index by multiple keys for flexible lookup
                full_module_path = f"{module_name}.{cls['name']}"
                index[cls["name"]] = class_target  # Just class name
                index[full_module_path] = class_target  # Full path
                index[f"{pkg_id}.{cls['name']}"] = class_target  # package.ClassName

                # Methods
                for method in cls.get("methods", []):
                    method_target = {
                        "name": method["name"],
                        "type": "method",
                        "packageId": pkg_id,
                        "moduleName": module_name,
                        "parentClass": cls["name"],
                        "path": f"{api_path}#{method['name']}"
                    }
                    # Index by ClassName.method_name
                    index[f"{cls['name']}.{method['name']}"] = method_target

            # Functions
            for func in module.get("functions", []):
                func_target = {
                    "name": func["name"],
                    "type": "function",
                    "packageId": pkg_id,
                    "moduleName": module_name,
                    "path": f"{api_path}#{func['name']}"
                }
                full_module_path = f"{module_name}.{func['name']}"
                index[func["name"]] = func_target
                index[full_module_path] = func_target

    return index


def write_json(data: Any, path: Path) -> None:
    """Write data as JSON."""
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"  Written: {path}")


def main():
    print("Building search and crossref indexes")
    print("=" * 40)

    # Load source data
    print("\nLoading API data...")
    api_data = load_api_data()
    print(f"  Loaded {len(api_data)} package(s)")

    print("\nLoading notebook manifests...")
    manifests = load_notebook_manifests()
    total_notebooks = sum(len(n) for n in manifests.values())
    print(f"  Loaded {total_notebooks} notebook(s) from {len(manifests)} package(s)")

    # Build indexes
    print("\nBuilding search index...")
    search_index = build_search_index(api_data, manifests)
    print(f"  Generated {len(search_index)} search entries")

    print("\nBuilding crossref index...")
    crossref_index = build_crossref_index(api_data)
    print(f"  Generated {len(crossref_index)} crossref entries")

    # Write outputs
    print("\nWriting indexes...")
    write_json(search_index, API_DIR / "search-index.json")
    write_json(crossref_index, API_DIR / "crossref-index.json")

    print("\nDone!")


if __name__ == "__main__":
    main()
