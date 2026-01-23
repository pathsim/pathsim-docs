"""
Embedding generation utilities for semantic search.

Generates vector embeddings from search index entries using sentence-transformers.
Embeddings are stored per-version alongside search-index.json.
"""

import json
import base64
import struct
from pathlib import Path
from typing import Any

# Lazy load sentence-transformers to avoid import overhead when not needed
_model = None
_model_name = "intfloat/e5-small-v2"


def get_model():
    """Lazy load the embedding model."""
    global _model
    if _model is None:
        try:
            from sentence_transformers import SentenceTransformer
            print(f"    Loading embedding model: {_model_name}")
            _model = SentenceTransformer(_model_name)
        except ImportError:
            raise ImportError(
                "sentence-transformers not installed. "
                "Run: pip install sentence-transformers"
            )
    return _model


def create_embedding_text(item: dict) -> str:
    """
    Create text to embed from a search index item.

    E5 models expect "query: " or "passage: " prefix.
    For indexing, we use "passage: " prefix.
    """
    parts = []

    # Name is most important
    name = item.get("name", "")
    if name:
        parts.append(name)

    # Add parent context for methods
    parent = item.get("parentClass")
    if parent:
        parts.append(f"in {parent}")

    # Module context
    module = item.get("moduleName", "")
    if module:
        parts.append(f"from {module}")

    # Description
    desc = item.get("description", "")
    if desc:
        parts.append(desc)

    # Tags for examples
    tags = item.get("tags", [])
    if tags:
        parts.append(" ".join(tags))

    text = " ".join(parts)

    # E5 models need passage prefix for documents
    return f"passage: {text}"


def generate_embeddings(search_items: list[dict]) -> dict[str, Any]:
    """
    Generate embeddings for search index items.

    Returns dict with:
        - model: model name
        - dim: embedding dimension
        - count: number of embeddings
        - embeddings: base64-encoded Float32Array
    """
    if not search_items:
        return {
            "model": _model_name,
            "dim": 384,
            "count": 0,
            "embeddings": ""
        }

    model = get_model()

    # Create texts to embed
    texts = [create_embedding_text(item) for item in search_items]

    # Generate embeddings
    print(f"    Generating embeddings for {len(texts)} items...")
    embeddings = model.encode(
        texts,
        normalize_embeddings=True,
        show_progress_bar=False
    )

    # Get dimensions
    dim = embeddings.shape[1]

    # Flatten to 1D array and convert to bytes
    flat = embeddings.flatten().astype('float32')
    raw_bytes = flat.tobytes()

    # Base64 encode for JSON storage
    encoded = base64.b64encode(raw_bytes).decode('ascii')

    return {
        "model": _model_name,
        "dim": dim,
        "count": len(search_items),
        "embeddings": encoded
    }


def save_embeddings_index(embeddings_data: dict, output_path: Path) -> None:
    """Save embeddings index to JSON file."""
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(embeddings_data, f, ensure_ascii=False)


def load_embeddings_index(input_path: Path) -> dict | None:
    """Load embeddings index from JSON file."""
    if not input_path.exists():
        return None

    with open(input_path, "r", encoding="utf-8") as f:
        return json.load(f)


def should_regenerate_embeddings(version_dir: Path) -> bool:
    """
    Check if embeddings need regeneration.

    Regenerate if:
    - embeddings-index.json doesn't exist
    - search-index.json is newer than embeddings-index.json
    """
    search_index = version_dir / "search-index.json"
    embeddings_index = version_dir / "embeddings-index.json"

    if not search_index.exists():
        return False  # No search index, nothing to embed

    if not embeddings_index.exists():
        return True  # No embeddings yet

    # Compare modification times
    search_mtime = search_index.stat().st_mtime
    embeddings_mtime = embeddings_index.stat().st_mtime

    return search_mtime > embeddings_mtime


def generate_version_embeddings(version_dir: Path, force: bool = False) -> bool:
    """
    Generate embeddings for a version directory.

    Args:
        version_dir: Path to version directory (e.g., static/pathsim/v0.16.0)
        force: Force regeneration even if up to date

    Returns:
        True if embeddings were generated, False if skipped
    """
    search_index_path = version_dir / "search-index.json"
    embeddings_index_path = version_dir / "embeddings-index.json"

    if not search_index_path.exists():
        return False

    if not force and not should_regenerate_embeddings(version_dir):
        return False

    # Load search index
    with open(search_index_path, "r", encoding="utf-8") as f:
        search_items = json.load(f)

    # Generate embeddings
    embeddings_data = generate_embeddings(search_items)

    # Save
    save_embeddings_index(embeddings_data, embeddings_index_path)

    print(f"      {embeddings_data['count']} embeddings ({embeddings_data['dim']}d)")

    return True
