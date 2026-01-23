# Semantic Search Implementation Plan

Progressive enhancement: keyword search first, automatic semantic fallback when results are poor.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        BUILD TIME                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  api.json ──┬──► search-index.json ──► embeddings-index.json    │
│             │                              (lazy, incremental)   │
│  manifest.json                                                   │
│                                                                  │
│  Embedding model: all-MiniLM-L6-v2 (sentence-transformers)      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        RUNTIME                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  User types query                                                │
│       │                                                          │
│       ▼                                                          │
│  ┌─────────────────┐                                            │
│  │ Keyword Search  │ ◄── instant, no model load                 │
│  └────────┬────────┘                                            │
│           │                                                      │
│           ▼                                                      │
│  ┌─────────────────────────────────────┐                        │
│  │ Results < 3 OR score < threshold?   │                        │
│  └────────┬────────────────────────────┘                        │
│           │ yes                                                  │
│           ▼                                                      │
│  ┌─────────────────┐                                            │
│  │ Show "Searching │ ◄── loading indicator                      │
│  │ smarter..."     │                                            │
│  └────────┬────────┘                                            │
│           │                                                      │
│           ▼                                                      │
│  ┌─────────────────┐     ┌─────────────────┐                    │
│  │ Load Model      │ ──► │ Load Embeddings │ (lazy, cached)     │
│  │ (once, ~25MB)   │     │ (per version)   │                    │
│  └────────┬────────┘     └────────┬────────┘                    │
│           │                       │                              │
│           └───────────┬───────────┘                              │
│                       ▼                                          │
│  ┌─────────────────────────────────────┐                        │
│  │ Embed query → Cosine similarity     │                        │
│  └────────┬────────────────────────────┘                        │
│           │                                                      │
│           ▼                                                      │
│  ┌─────────────────┐                                            │
│  │ Merge & rank    │ ◄── combine keyword + semantic scores      │
│  └────────┬────────┘                                            │
│           │                                                      │
│           ▼                                                      │
│     Display results                                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## File Structure

```
scripts/
  lib/
    embeddings.py           # NEW: embedding generation utilities
  build.py                  # extended: call embedding generation
  build-embeddings.py       # NEW: standalone embedding regeneration

src/lib/
  search/                   # NEW: reorganized search module
    index.ts                # re-export, backward compat
    keyword.ts              # current search logic (extracted)
    semantic.ts             # NEW: semantic search logic
    hybrid.ts               # NEW: orchestration layer
    types.ts                # shared types

  utils/
    indexLoader.ts          # extended: load embeddings-index.json

  semantic/                 # NEW: isolated, tree-shakeable
    model.ts                # lazy transformers.js loading
    similarity.ts           # cosine similarity, vector ops

  components/
    SearchDialog.svelte     # extended: loading states
```

## Implementation Phases

### Phase 1: Build-time Embedding Generation

**Files:**
- `scripts/lib/embeddings.py`
- `scripts/build.py` (extend)
- `scripts/build-embeddings.py`

**Tasks:**
1. Create `embeddings.py` with functions:
   - `generate_embeddings(search_items: list) -> dict`
   - `load_model()` - lazy load sentence-transformers
   - `save_embeddings_index(embeddings, output_path)`

2. Extend `generate_version_indexes()` in `build.py`:
   - After writing search-index.json, generate embeddings
   - Skip if embeddings-index.json exists and search-index.json unchanged
   - Use file hash for change detection

3. Create `build-embeddings.py` for standalone regeneration:
   - Iterate existing versions
   - Regenerate embeddings from search-index.json
   - Support `--force` flag

**Incremental build logic:**
```python
def should_regenerate_embeddings(version_dir: Path) -> bool:
    search_index = version_dir / "search-index.json"
    embeddings_index = version_dir / "embeddings-index.json"

    if not embeddings_index.exists():
        return True

    # Compare modification times
    if search_index.stat().st_mtime > embeddings_index.stat().st_mtime:
        return True

    return False
```

**Embeddings index format:**
```json
{
  "model": "all-MiniLM-L6-v2",
  "dim": 384,
  "count": 500,
  "embeddings": "<base64 encoded Float32Array>"
}
```

### Phase 2: Client-side Semantic Module

**Files:**
- `src/lib/semantic/model.ts`
- `src/lib/semantic/similarity.ts`

**Tasks:**
1. Create `model.ts`:
   - Lazy load transformers.js
   - Load all-MiniLM-L6-v2 model
   - Cache model instance
   - Expose `embedQuery(text: string): Promise<Float32Array>`

2. Create `similarity.ts`:
   - `cosineSimilarity(a: Float32Array, b: Float32Array): number`
   - `rankBySimilarity(query: Float32Array, embeddings: Float32Array[], topK: number)`
   - Efficient batch operations

**Model loading pattern:**
```typescript
let modelPromise: Promise<Pipeline> | null = null;

export async function getModel(): Promise<Pipeline> {
  if (!modelPromise) {
    modelPromise = (async () => {
      const { pipeline } = await import('@xenova/transformers');
      return await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    })();
  }
  return modelPromise;
}

export async function embedQuery(text: string): Promise<Float32Array> {
  const model = await getModel();
  const result = await model(text, { pooling: 'mean', normalize: true });
  return result.data;
}
```

### Phase 3: Hybrid Search Orchestration

**Files:**
- `src/lib/search/keyword.ts` (extract from current search.ts)
- `src/lib/search/semantic.ts`
- `src/lib/search/hybrid.ts`
- `src/lib/utils/indexLoader.ts` (extend)

**Tasks:**
1. Extract keyword search to `keyword.ts` (no changes to logic)

2. Extend `indexLoader.ts`:
   - Add `loadEmbeddingsIndex(packageId, tag)`
   - Add `loadMergedEmbeddingsIndex(packages)`
   - Parse base64 → Float32Array

3. Create `semantic.ts`:
   - `semanticSearch(query, embeddings, searchItems, limit)`
   - Returns scored results

4. Create `hybrid.ts`:
   ```typescript
   export async function search(
     query: string,
     options: SearchOptions
   ): Promise<SearchState> {
     // 1. Run keyword search (instant)
     const keywordResults = keywordSearch(query);

     // 2. Check if semantic needed
     const needsSemantic =
       keywordResults.length < 3 ||
       keywordResults[0]?.score < SEMANTIC_THRESHOLD;

     if (!needsSemantic) {
       return { results: keywordResults, mode: 'keyword' };
     }

     // 3. Signal loading state
     options.onSemanticStart?.();

     // 4. Load model + embeddings (parallel)
     const [model, embeddings] = await Promise.all([
       getModel(),
       loadEmbeddings(options.packages)
     ]);

     // 5. Run semantic search
     const semanticResults = await semanticSearch(query, embeddings);

     // 6. Merge results
     const merged = mergeResults(keywordResults, semanticResults);

     return { results: merged, mode: 'hybrid' };
   }
   ```

### Phase 4: UI Integration

**Files:**
- `src/lib/components/SearchDialog.svelte` (or equivalent)
- `src/app.css` (loading styles)

**Tasks:**
1. Add loading state to search UI:
   ```svelte
   {#if searchState === 'semantic-loading'}
     <div class="search-loading">
       <Spinner size={14} />
       <span>Searching smarter...</span>
     </div>
   {/if}
   ```

2. Show search mode indicator:
   ```svelte
   {#if results.mode === 'hybrid'}
     <div class="search-mode-badge">AI-enhanced</div>
   {/if}
   ```

3. Graceful degradation:
   - If model fails to load, fall back to keyword only
   - Show subtle error, don't break search

## Incremental Build Strategy

**Current behavior (preserved):**
- `--all` flag rebuilds everything
- Smart mode only builds missing versions
- Cleanup of old non-.0 versions

**Extended for embeddings:**
```
Version exists?
    │
    ├── No → Build API + notebooks + indexes + embeddings
    │
    └── Yes → Check what needs update:
              │
              ├── search-index.json newer than embeddings-index.json?
              │   └── Yes → Regenerate embeddings only
              │
              └── No embeddings-index.json?
                  └── Generate embeddings
```

**Standalone embedding regeneration:**
```bash
# Regenerate embeddings for all existing versions
python scripts/build-embeddings.py

# Force regenerate for specific package
python scripts/build-embeddings.py -p pathsim --force

# Dry run
python scripts/build-embeddings.py --dry-run
```

## Dependencies

**Python (build-time):**
```
sentence-transformers>=2.2.0
numpy
```

**JavaScript (runtime):**
```
@xenova/transformers  # transformers.js
```

## Performance Targets

| Metric | Target |
|--------|--------|
| Keyword search | <10ms |
| Model load (first time) | <3s on fast connection |
| Model load (cached) | <500ms |
| Embeddings load per version | <200ms |
| Semantic search (after load) | <50ms |
| Embedding generation (build) | ~1s per 100 items |

## Rollout Plan

1. **Phase 1**: Build-time only, no runtime changes
   - Can be tested/verified independently
   - No user-facing changes

2. **Phase 2**: Client module, feature-flagged
   - Add but don't enable by default
   - Test in dev

3. **Phase 3-4**: Full integration
   - Enable progressive enhancement
   - Monitor performance

## Open Questions

1. **Model choice**: all-MiniLM-L6-v2 vs newer alternatives?
   - Could use gte-small for better quality
   - Or quantized models for smaller size

2. **Threshold tuning**: When to trigger semantic search?
   - Results < 3? Score < X?
   - Query length > N words?

3. **Result merging**: How to combine keyword + semantic scores?
   - Weighted average?
   - RRF (Reciprocal Rank Fusion)?
