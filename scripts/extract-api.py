#!/usr/bin/env python3
"""
PathSim API Documentation Extractor

Uses griffe to extract API documentation from PathSim packages and outputs
structured JSON with rendered HTML docstrings for the documentation site.

Usage:
    python scripts/extract-api.py              # Extract all packages
    python scripts/extract-api.py --package pathsim  # Single package
    python scripts/extract-api.py --dry-run    # Preview without writing
"""

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any

# Add parent packages to path for imports
SCRIPT_DIR = Path(__file__).parent
ROOT_DIR = SCRIPT_DIR.parent.parent

# Package source paths
PACKAGE_PATHS = {
    "pathsim": ROOT_DIR / "pathsim" / "src",
    "pathsim_chem": ROOT_DIR / "pathsim-chem" / "src",
    "pathsim_vehicle": ROOT_DIR / "pathsim-vehicle" / "src",
}

try:
    import griffe
    from griffe import GriffeLoader
except ImportError:
    print("Error: griffe not installed. Run: pip install griffe")
    sys.exit(1)

# Optional docutils for RST to HTML conversion
try:
    from docutils.core import publish_parts
    HAS_DOCUTILS = True
except ImportError:
    HAS_DOCUTILS = False
    print("Warning: docutils not installed, docstrings will use markdown fallback")


# =============================================================================
# Configuration
# =============================================================================

CONFIG = {
    "pathsim": {
        "package": "pathsim",
        "display_name": "PathSim",
        "source_path": PACKAGE_PATHS["pathsim"],
        "modules": [
            "pathsim",
            "pathsim.blocks",
            "pathsim.solvers",
            "pathsim.events",
            "pathsim.optim",
            "pathsim.utils",
        ],
        "skip_private": True,
        "skip_modules": ["pathsim._constants", "pathsim._version"],
    },
    "chem": {
        "package": "pathsim_chem",
        "display_name": "PathSim-Chem",
        "source_path": PACKAGE_PATHS["pathsim_chem"],
        "modules": [
            "pathsim_chem",
        ],
        "skip_private": True,
        "skip_modules": ["pathsim_chem._version"],
    },
    "vehicle": {
        "package": "pathsim_vehicle",
        "display_name": "PathSim-Vehicle",
        "source_path": PACKAGE_PATHS["pathsim_vehicle"],
        "modules": [
            "pathsim_vehicle",
        ],
        "skip_private": True,
        "skip_modules": ["pathsim_vehicle._version"],
    },
}


# =============================================================================
# RST to HTML Conversion
# =============================================================================

def rst_to_html(rst_text: str) -> str:
    """Convert RST docstring to HTML with math support."""
    if not rst_text:
        return ""

    if not HAS_DOCUTILS:
        return markdown_fallback(rst_text)

    try:
        # Pre-process: convert NumPy-style sections to RST
        processed = preprocess_numpy_docstring(rst_text)

        parts = publish_parts(
            processed,
            writer_name="html",
            settings_overrides={
                "report_level": 5,
                "halt_level": 5,
                "initial_header_level": 4,
                "math_output": "MathJax",
                "syntax_highlight": "short",
            }
        )
        html = parts["body"]
        html = postprocess_math(html)
        return html
    except Exception as e:
        return markdown_fallback(rst_text)


def preprocess_numpy_docstring(docstring: str) -> str:
    """Convert NumPy-style docstring sections to RST."""
    sections = [
        "Parameters", "Returns", "Yields", "Raises", "Warns",
        "Attributes", "Methods", "See Also", "Notes", "References",
        "Examples", "Other Parameters"
    ]

    result = docstring
    for section in sections:
        pattern = rf'^({section})\s*\n-+\s*\n'
        replacement = rf'**{section}**\n\n'
        result = re.sub(pattern, replacement, result, flags=re.MULTILINE)

    return result


def postprocess_math(html: str) -> str:
    """Post-process math markup - MathJax output uses .math class which is already KaTeX-compatible."""
    # MathJax output format: <div class="math">\LaTeX content\</div>
    # This is already compatible with KaTeX rendering, no changes needed
    return html


def markdown_fallback(text: str) -> str:
    """Basic markdown-style conversion as fallback."""
    if not text:
        return ""

    text = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    text = re.sub(r'```(\w*)\n(.*?)\n```', r'<pre><code class="language-\1">\2</code></pre>', text, flags=re.DOTALL)
    text = re.sub(r'``(.*?)``', r'<code>\1</code>', text)
    text = re.sub(r'`(.*?)`', r'<code>\1</code>', text)

    paragraphs = text.split('\n\n')
    text = '\n'.join(f'<p>{p.strip()}</p>' for p in paragraphs if p.strip())

    return text


# =============================================================================
# Extraction Utilities
# =============================================================================

def extract_source_code(obj: griffe.Object) -> str | None:
    """Extract source code for a griffe object."""
    try:
        # Get file path and line numbers
        filepath = obj.filepath
        lineno = obj.lineno
        endlineno = obj.endlineno

        if not filepath or not lineno or not endlineno:
            return None

        # Read the source file
        with open(filepath, 'r', encoding='utf-8') as f:
            lines = f.readlines()

        # Extract the relevant lines (1-indexed to 0-indexed)
        source_lines = lines[lineno - 1:endlineno]
        source = ''.join(source_lines)

        # Dedent if needed (remove common leading whitespace)
        if source:
            import textwrap
            source = textwrap.dedent(source)

        return source.rstrip() if source else None
    except Exception:
        return None


def extract_first_line(docstring: str | None) -> str:
    """Extract first line/sentence as brief description."""
    if not docstring:
        return ""

    lines = docstring.strip().split("\n")
    first_line = ""
    for line in lines:
        stripped = line.strip()
        if stripped:
            first_line = stripped
            break

    if ". " in first_line and len(first_line) > 100:
        first_line = first_line.split(". ")[0] + "."

    return first_line


def should_skip(name: str, skip_private: bool) -> bool:
    """Check if a name should be skipped."""
    if skip_private and name.startswith("_") and not name.startswith("__"):
        return True
    if name in ("__init__", "__new__", "__del__"):
        return False
    if name.startswith("__") and name.endswith("__"):
        return True
    return False


def is_defined_in_module(member: griffe.Object, module_path: str, all_modules: list[str]) -> bool:
    """Check if a member should be documented in this module.

    Returns True if:
    - The member is defined directly in this module, OR
    - The member is defined in a submodule that's not in our extraction list, OR
    - The member is imported from outside and we're documenting the public API

    Returns False if the member is imported from another module we're explicitly extracting.
    """
    try:
        # Get the canonical path where the object is defined
        if hasattr(member, 'canonical_path'):
            canonical = str(member.canonical_path)
            # Get the parent module path (e.g., "pathsim.blocks.integrator" from "pathsim.blocks.integrator.Integrator")
            source_module = canonical.rsplit('.', 1)[0] if '.' in canonical else canonical

            # If defined directly in this module, include it
            if source_module == module_path:
                return True

            # If the source module is a submodule of current module, include it
            # (the submodules aren't in our extraction list, so document here)
            if source_module.startswith(module_path + "."):
                # Only skip if we're explicitly extracting that submodule
                if source_module in all_modules:
                    return False
                return True

            # Imported from a different module tree entirely
            # Skip if that module is in our extraction list (will be documented there)
            if source_module in all_modules:
                return False

            # Check if source is a submodule of something we're extracting
            for mod in all_modules:
                if mod != module_path and source_module.startswith(mod + "."):
                    return False  # Will be documented under that module

            return True  # External import or not in our extraction list

        return True  # If we can't determine, include it
    except Exception:
        return True  # If we can't determine, include it


def get_signature_str(obj: griffe.Object) -> str | None:
    """Get function/method signature as string."""
    try:
        if not hasattr(obj, "parameters"):
            return None

        params = []
        for param in obj.parameters:
            if param.name == "self":
                continue
            param_str = param.name
            if param.annotation:
                param_str += f": {param.annotation}"
            if param.default is not None and str(param.default) != "":
                default_str = str(param.default)
                if len(default_str) > 50:
                    default_str = default_str[:47] + "..."
                param_str += f" = {default_str}"
            params.append(param_str)

        return f"({', '.join(params)})"
    except Exception:
        return None


def extract_parameters_list(obj: griffe.Object, docstring: str = "") -> list[dict]:
    """Extract function/method parameters."""
    try:
        if not hasattr(obj, "parameters"):
            return []

        params = []
        for param in obj.parameters:
            if param.name == "self":
                continue

            param_info = {
                "name": param.name,
                "type": str(param.annotation) if param.annotation else None,
                "default": str(param.default) if param.default is not None and str(param.default) != "" else None,
                "description": extract_param_description(docstring, param.name),
            }
            params.append(param_info)

        return params
    except Exception:
        return []


def extract_param_description(docstring: str, param_name: str) -> str:
    """Extract parameter description from docstring."""
    if not docstring:
        return ""

    # NumPy style
    pattern = rf'{param_name}\s*:\s*[^\n]*\n\s+(.+?)(?=\n\s*\w+\s*:|\n\n|$)'
    match = re.search(pattern, docstring, re.DOTALL)
    if match:
        desc = match.group(1).strip()
        desc = re.sub(r'\s+', ' ', desc)
        return desc

    # Google style
    pattern = rf'{param_name}:\s*(.+?)(?=\n\s*\w+:|\n\n|$)'
    match = re.search(pattern, docstring, re.DOTALL)
    if match:
        desc = match.group(1).strip()
        desc = re.sub(r'\s+', ' ', desc)
        return desc

    return ""


# =============================================================================
# Main Extraction
# =============================================================================

class APIExtractor:
    """Extract API documentation using griffe."""

    def __init__(self, config: dict):
        self.config = config
        source_path = config["source_path"]

        # Initialize loader - disable inspection to avoid import errors
        self.loader = GriffeLoader(
            search_paths=[str(source_path)] if source_path.exists() else None,
            docstring_parser="numpy",
            allow_inspection=False,  # Don't try to import modules
        )

    def extract(self) -> dict:
        """Extract API documentation for configured package."""
        package_name = self.config["package"]
        source_path = self.config["source_path"]

        if not source_path.exists():
            print(f"  Warning: Source path not found: {source_path}")
            return self._empty_result()

        result = {
            "package": package_name,
            "display_name": self.config["display_name"],
            "modules": {},
        }

        # Load package - this may fail on some modules, that's OK
        try:
            package = self.loader.load(package_name)
        except Exception as e:
            print(f"  Error loading {package_name}: {e}")
            # Try to load individual modules as files
            return self._extract_from_files(result)

        # Extract each configured module
        for module_path in self.config["modules"]:
            if module_path in self.config.get("skip_modules", []):
                continue

            try:
                module_data = self._extract_module(package, module_path)
                if module_data:
                    result["modules"][module_path] = module_data
                    print(f"    Extracted: {module_path}")
            except Exception as e:
                print(f"    Warning: Failed to extract {module_path}: {e}")
                # Try fallback to file-based extraction
                fallback = self._extract_module_from_file(module_path)
                if fallback:
                    result["modules"][module_path] = fallback
                    print(f"    Extracted (fallback): {module_path}")

        return result

    def _extract_from_files(self, result: dict) -> dict:
        """Fallback: extract from individual files."""
        source_path = self.config["source_path"]
        package_name = self.config["package"]

        for module_path in self.config["modules"]:
            if module_path in self.config.get("skip_modules", []):
                continue

            fallback = self._extract_module_from_file(module_path)
            if fallback:
                result["modules"][module_path] = fallback
                print(f"    Extracted (file): {module_path}")

        return result

    def _extract_module_from_file(self, module_path: str) -> dict | None:
        """Extract module by loading its file directly."""
        source_path = self.config["source_path"]
        package_name = self.config["package"]

        # Convert module path to file path
        parts = module_path.split(".")
        rel_path = Path(*parts)

        # Try both package and module paths
        candidates = [
            source_path / rel_path / "__init__.py",
            source_path / f"{rel_path}.py",
        ]

        file_path = None
        for candidate in candidates:
            if candidate.exists():
                file_path = candidate
                break

        if not file_path:
            return None

        try:
            # Create a fresh loader for this file
            loader = GriffeLoader(
                search_paths=[str(source_path)],
                docstring_parser="numpy",
                allow_inspection=False,
            )
            module = loader.load(str(file_path))
            return self._extract_module_obj(module, module_path)
        except Exception as e:
            return None

    def _empty_result(self) -> dict:
        """Return empty result structure."""
        return {
            "package": self.config["package"],
            "display_name": self.config["display_name"],
            "modules": {},
        }

    def _extract_module(self, package: griffe.Object, module_path: str) -> dict | None:
        """Extract a single module from loaded package."""
        parts = module_path.split(".")
        obj = package

        for part in parts[1:]:
            if not hasattr(obj, "members") or part not in obj.members:
                return None
            obj = obj.members[part]

        return self._extract_module_obj(obj, module_path)

    def _extract_module_obj(self, obj: griffe.Object, module_path: str) -> dict | None:
        """Extract module data from griffe object."""
        docstring = obj.docstring.value if obj.docstring else ""

        module_data = {
            "name": module_path,
            "description": extract_first_line(docstring),
            "docstring_html": rst_to_html(docstring),
            "classes": [],
            "functions": [],
            "submodules": [],
        }

        skip_private = self.config.get("skip_private", True)
        all_modules = self.config.get("modules", [])

        if not hasattr(obj, "members"):
            return module_data

        for name, member in obj.members.items():
            if should_skip(name, skip_private):
                continue

            try:
                if member.is_module:
                    full_name = f"{module_path}.{name}"
                    if full_name not in self.config.get("skip_modules", []):
                        module_data["submodules"].append(name)

                elif member.is_class:
                    # Skip classes that are just imported from modules we're also extracting
                    if not is_defined_in_module(member, module_path, all_modules):
                        continue
                    class_data = self._extract_class(member)
                    if class_data:
                        module_data["classes"].append(class_data)

                elif member.is_function:
                    # Skip functions that are just imported from modules we're also extracting
                    if not is_defined_in_module(member, module_path, all_modules):
                        continue
                    func_data = self._extract_function(member)
                    if func_data:
                        module_data["functions"].append(func_data)
            except Exception:
                continue

        return module_data

    def _extract_class(self, cls: griffe.Class) -> dict | None:
        """Extract class documentation."""
        try:
            docstring = cls.docstring.value if cls.docstring else ""

            class_data = {
                "name": cls.name,
                "description": extract_first_line(docstring),
                "docstring_html": rst_to_html(docstring),
                "source": extract_source_code(cls),
                "bases": [],
                "methods": [],
                "attributes": [],
                "parameters": [],
            }

            # Extract bases safely
            try:
                if cls.bases:
                    class_data["bases"] = [str(base) for base in cls.bases]
            except Exception:
                pass

            skip_private = self.config.get("skip_private", True)

            # Extract __init__ parameters
            try:
                if hasattr(cls, "members") and "__init__" in cls.members:
                    init = cls.members["__init__"]
                    init_doc = init.docstring.value if init.docstring else docstring
                    class_data["parameters"] = extract_parameters_list(init, init_doc)
            except Exception:
                pass

            # Extract methods and attributes
            if hasattr(cls, "members"):
                for name, member in cls.members.items():
                    if should_skip(name, skip_private):
                        continue

                    try:
                        if member.is_function:
                            method_data = self._extract_method(member)
                            if method_data:
                                class_data["methods"].append(method_data)
                        elif member.is_attribute:
                            attr_data = self._extract_attribute(member)
                            if attr_data:
                                class_data["attributes"].append(attr_data)
                    except Exception:
                        continue

            return class_data
        except Exception:
            return None

    def _extract_function(self, func: griffe.Function) -> dict | None:
        """Extract function documentation."""
        try:
            docstring = func.docstring.value if func.docstring else ""

            return {
                "name": func.name,
                "description": extract_first_line(docstring),
                "docstring_html": rst_to_html(docstring),
                "source": extract_source_code(func),
                "signature": get_signature_str(func),
                "parameters": extract_parameters_list(func, docstring),
                "returns": str(func.returns) if hasattr(func, "returns") and func.returns else None,
            }
        except Exception:
            return None

    def _extract_method(self, method: griffe.Function) -> dict | None:
        """Extract method documentation."""
        try:
            docstring = method.docstring.value if method.docstring else ""

            method_type = "method"
            try:
                for decorator in method.decorators:
                    dec_str = str(decorator.value)
                    if "classmethod" in dec_str:
                        method_type = "classmethod"
                    elif "staticmethod" in dec_str:
                        method_type = "staticmethod"
                    elif "property" in dec_str:
                        method_type = "property"
            except Exception:
                pass

            return {
                "name": method.name,
                "description": extract_first_line(docstring),
                "docstring_html": rst_to_html(docstring),
                "source": extract_source_code(method),
                "signature": get_signature_str(method),
                "parameters": extract_parameters_list(method, docstring),
                "returns": str(method.returns) if hasattr(method, "returns") and method.returns else None,
                "method_type": method_type,
            }
        except Exception:
            return None

    def _extract_attribute(self, attr: griffe.Attribute) -> dict | None:
        """Extract attribute documentation."""
        try:
            docstring = attr.docstring.value if attr.docstring else ""

            return {
                "name": attr.name,
                "description": extract_first_line(docstring),
                "type": str(attr.annotation) if hasattr(attr, "annotation") and attr.annotation else None,
                "value": str(attr.value) if hasattr(attr, "value") and attr.value else None,
            }
        except Exception:
            return None


# =============================================================================
# Output Generation
# =============================================================================

def write_json_output(data: dict, output_path: Path) -> None:
    """Write extracted data as JSON."""
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"  Written: {output_path}")


def write_typescript_index(packages: list[str], output_dir: Path) -> None:
    """Write TypeScript index file for importing API data."""
    lines = [
        "// Auto-generated by scripts/extract-api.py - DO NOT EDIT",
        "// Re-run 'npm run extract' to update",
        "",
    ]

    for pkg in packages:
        lines.append(f"import {pkg}Data from './{pkg}.json';")

    lines.extend([
        "",
        "export interface APIParameter {",
        "  name: string;",
        "  type: string | null;",
        "  default: string | null;",
        "  description: string;",
        "}",
        "",
        "export interface APIAttribute {",
        "  name: string;",
        "  description: string;",
        "  type: string | null;",
        "  value: string | null;",
        "}",
        "",
        "export interface APIMethod {",
        "  name: string;",
        "  description: string;",
        "  docstring_html: string;",
        "  source: string | null;",
        "  signature: string | null;",
        "  parameters: APIParameter[];",
        "  returns: string | null;",
        "  method_type: 'method' | 'classmethod' | 'staticmethod' | 'property';",
        "}",
        "",
        "export interface APIClass {",
        "  name: string;",
        "  description: string;",
        "  docstring_html: string;",
        "  source: string | null;",
        "  bases: string[];",
        "  methods: APIMethod[];",
        "  attributes: APIAttribute[];",
        "  parameters: APIParameter[];",
        "}",
        "",
        "export interface APIFunction {",
        "  name: string;",
        "  description: string;",
        "  docstring_html: string;",
        "  source: string | null;",
        "  signature: string | null;",
        "  parameters: APIParameter[];",
        "  returns: string | null;",
        "}",
        "",
        "export interface APIModule {",
        "  name: string;",
        "  description: string;",
        "  docstring_html: string;",
        "  classes: APIClass[];",
        "  functions: APIFunction[];",
        "  submodules: string[];",
        "}",
        "",
        "export interface APIPackage {",
        "  package: string;",
        "  display_name: string;",
        "  modules: Record<string, APIModule>;",
        "}",
        "",
        "export const apiData: Record<string, APIPackage> = {",
    ])

    for pkg in packages:
        lines.append(f"  {pkg}: {pkg}Data as APIPackage,")

    lines.extend([
        "};",
        "",
        "export default apiData;",
        "",
    ])

    output_path = output_dir / "index.ts"
    with open(output_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

    print(f"  Written: {output_path}")


# =============================================================================
# Main
# =============================================================================

def main():
    parser = argparse.ArgumentParser(
        description="Extract PathSim API documentation using griffe",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "--package", "-p",
        choices=list(CONFIG.keys()),
        help="Extract single package (default: all)"
    )
    parser.add_argument(
        "--dry-run", "-n",
        action="store_true",
        help="Preview extraction without writing files"
    )
    parser.add_argument(
        "--output", "-o",
        type=Path,
        default=SCRIPT_DIR.parent / "src" / "lib" / "api" / "generated",
        help="Output directory (default: src/lib/api/generated)"
    )
    args = parser.parse_args()

    print("PathSim API Documentation Extractor")
    print("=" * 40)

    if args.package:
        packages_to_extract = [args.package]
    else:
        packages_to_extract = list(CONFIG.keys())

    extracted_packages = []

    for pkg_id in packages_to_extract:
        config = CONFIG[pkg_id]
        print(f"\nExtracting: {config['display_name']}")

        extractor = APIExtractor(config)
        data = extractor.extract()

        if data["modules"]:
            extracted_packages.append(pkg_id)

            if not args.dry_run:
                output_path = args.output / f"{pkg_id}.json"
                write_json_output(data, output_path)
            else:
                print(f"  Would write: {args.output / f'{pkg_id}.json'}")
                print(f"  Modules: {list(data['modules'].keys())}")
                # Show some stats
                total_classes = sum(len(m.get("classes", [])) for m in data["modules"].values())
                total_functions = sum(len(m.get("functions", [])) for m in data["modules"].values())
                print(f"  Classes: {total_classes}, Functions: {total_functions}")

    # Write TypeScript index
    if extracted_packages and not args.dry_run:
        write_typescript_index(extracted_packages, args.output)

    print(f"\nDone! Extracted {len(extracted_packages)} package(s)")


if __name__ == "__main__":
    main()
