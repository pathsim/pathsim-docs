<p align="center">
  <img src="https://raw.githubusercontent.com/pathsim/pathsim-docs/master/static/pathsim_logo.png" width="300" alt="PathSim Logo" />
</p>

------------

# PathSim Docs - Unified Documentation Site

A unified documentation site for the PathSim ecosystem, featuring API references, interactive examples, and versioned documentation for PathSim, PathSim-Chem, and PathSim-Vehicle. Built with SvelteKit and hosted at [docs.pathsim.org](https://docs.pathsim.org).

## Tech Stack

- [SvelteKit 2](https://kit.svelte.dev/) with Svelte 5 runes
- [Griffe](https://mkdocstrings.github.io/griffe/) for Python API extraction
- [Pyodide](https://pyodide.org/) for interactive notebook execution
- [CodeMirror 6](https://codemirror.net/) for code highlighting
- [KaTeX](https://katex.org/) for math rendering
- [Marked](https://marked.js.org/) for Markdown processing

## Getting Started

```bash
npm install
npm run dev
```

For production:

```bash
npm run extract:all  # Extract API docs and build indexes
npm run build
npm run preview
```

## Project Structure

```
src/
├── lib/
│   ├── api/               # API data system
│   │   ├── generated/     # Auto-generated from Python packages
│   │   │   ├── pathsim.json
│   │   │   ├── search-index.json
│   │   │   ├── crossref-index.json
│   │   │   └── index.ts   # TypeScript types
│   │   └── versions.ts    # Version loading utilities
│   ├── components/
│   │   ├── api/           # API documentation components
│   │   │   ├── ModuleDoc.svelte
│   │   │   ├── ClassDoc.svelte
│   │   │   ├── FunctionDoc.svelte
│   │   │   ├── DocstringRenderer.svelte
│   │   │   ├── TypeRef.svelte
│   │   │   └── VersionSelector.svelte
│   │   ├── common/        # Shared UI components
│   │   │   ├── Icon.svelte
│   │   │   ├── Tooltip.svelte
│   │   │   ├── CodeBlock.svelte
│   │   │   ├── MarkdownRenderer.svelte
│   │   │   ├── RstRenderer.svelte
│   │   │   └── ScrollToTop.svelte
│   │   ├── layout/        # Page layout
│   │   │   ├── Header.svelte
│   │   │   ├── Sidebar.svelte
│   │   │   ├── MobileDrawer.svelte
│   │   │   └── DocLayout.svelte
│   │   ├── notebook/      # Jupyter notebook rendering
│   │   │   ├── Notebook.svelte
│   │   │   ├── CodeCell.svelte
│   │   │   ├── MarkdownCell.svelte
│   │   │   └── CellOutput.svelte
│   │   └── pages/         # Full page components
│   │       ├── PackageOverview.svelte
│   │       ├── PackageApi.svelte
│   │       └── PackageExamples.svelte
│   ├── config/            # Centralized configuration
│   │   ├── packages.ts    # Package metadata, links, features
│   │   ├── pyodide.ts     # Python runtime config
│   │   └── cdn.ts         # External resource URLs
│   ├── notebook/          # Notebook parsing
│   │   ├── types.ts
│   │   ├── parser.ts
│   │   └── manifest.ts
│   ├── pyodide/           # Python execution (Web Worker)
│   ├── stores/            # Svelte stores
│   │   ├── apiContext.ts
│   │   ├── examplesContext.ts
│   │   ├── notebookStore.ts
│   │   ├── pyodideStore.ts
│   │   └── searchNavigation.ts
│   └── utils/
│       ├── search.ts      # Pre-built search index
│       ├── crossref.ts    # Cross-reference linking
│       ├── codemirror.ts  # Editor setup
│       └── clipboard.ts
├── routes/
│   ├── +page.svelte       # Home (search, package cards)
│   ├── +layout.svelte     # Root layout
│   └── [package]/         # Dynamic package routes
│       ├── +page.svelte   # Package overview
│       ├── api/
│       │   └── [[version]]/  # Versioned API docs
│       └── examples/
│           └── [slug]/    # Individual notebooks
└── app.css                # Global design system

scripts/
├── extract-api.py         # API extraction using Griffe
├── build-indexes.py       # Search and crossref index generation
├── extract-versions.py    # Historical version extraction
├── prepare-notebooks.py   # Notebook processing
└── generate-manifests.py  # Version manifest generation

static/
├── api/versions/          # Versioned API JSON files
│   ├── pathsim/
│   ├── chem/
│   └── vehicle/
└── notebooks/             # Jupyter notebooks
    ├── pathsim/
    ├── chem/
    └── vehicle/
```

---

## Architecture Overview

### Data Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ Python Packages │────>│ extract-api.py  │────>│ API JSON Files  │
│ (pathsim, etc.) │     │ (Griffe)        │     │ (generated/)    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                                                        v
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ Search/Crossref │<────│ build-indexes.py│<────│ + Notebook      │
│ Indexes (JSON)  │     │                 │     │   Manifests     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### URL Scheme

| URL | Page |
|-----|------|
| `/` | Home with search and package cards |
| `/pathsim` | PathSim overview (features, installation) |
| `/pathsim/api` | API reference (latest version) |
| `/pathsim/api/0.16` | API reference (specific version) |
| `/pathsim/examples` | Example notebooks gallery |
| `/pathsim/examples/harmonic-oscillator` | Specific notebook |
| `/chem`, `/vehicle` | Other packages (same structure) |

### Key Abstractions

| Layer | Purpose | Key Files |
|-------|---------|-----------|
| **API Extraction** | Python → JSON documentation | `extract-api.py` |
| **Index Building** | Pre-built search/crossref | `build-indexes.py` |
| **Search** | Multi-term scoring algorithm | `search.ts` |
| **Cross-refs** | Link resolution in docstrings | `crossref.ts`, `TypeRef.svelte` |
| **Version Loader** | Fetch versioned API data | `versions.ts` |
| **Notebook Parser** | .ipynb → renderable cells | `parser.ts` |
| **Pyodide Worker** | Execute Python in browser | `pyodide/worker.ts` |

---

## API Extraction

API documentation is extracted from Python packages using [Griffe](https://mkdocstrings.github.io/griffe/).

### How It Works

1. **Source**: Reads Python source code from cloned repositories
2. **Parsing**: Griffe extracts modules, classes, functions, docstrings
3. **Conversion**: RST docstrings → HTML (via docutils)
4. **Output**: JSON files with structured API data

### Running Extraction

```bash
# Extract latest API for all packages
npm run extract

# Or with specific package
python scripts/extract-api.py --package pathsim
```

### Output Format

```json
{
  "package": "pathsim",
  "display_name": "PathSim",
  "modules": {
    "pathsim.blocks.integrator": {
      "name": "pathsim.blocks.integrator",
      "description": "Integrator block for ODE systems",
      "classes": [{
        "name": "Integrator",
        "description": "...",
        "bases": ["pathsim.blocks._block.Block"],
        "methods": [...],
        "parameters": [...]
      }],
      "functions": [...]
    }
  }
}
```

---

## Search System

Search uses pre-built indexes generated at build time, eliminating runtime index construction.

### Index Generation

```bash
npm run build:indexes  # Generates search-index.json and crossref-index.json
```

### Search Features

- **Multi-term queries**: Each term scored independently
- **Scoring hierarchy**: Exact match (100) > prefix (50) > contains (30) > description (10)
- **Type boosting**: Pages 1.5x, classes 1.2x, examples 1.15x
- **Keyboard shortcut**: Ctrl+F focuses search bar

### Indexed Items

| Type | Source | Example |
|------|--------|---------|
| `page` | Package config | "PathSim API" |
| `module` | API JSON | "pathsim.blocks.integrator" |
| `class` | API JSON | "Integrator" |
| `method` | API JSON | "__init__" |
| `function` | API JSON | "create_solver" |
| `example` | Notebook manifest | "Harmonic Oscillator" |

---

## Cross-Reference System

Automatically links class/function names in docstrings to their API documentation.

### Supported Patterns

```rst
:class:`Integrator`       # RST role syntax
`Integrator`              # Backtick code
'Integrator'              # Single-quoted names
```

### Lookup Keys

Each class is indexed by multiple keys for flexible lookup:

```
Integrator                           # Class name only
pathsim.blocks.integrator.Integrator # Full module path
pathsim.Integrator                   # Package.ClassName
```

### Path Assembly

Paths are stored without leading slash and joined at runtime:

```typescript
// Stored: "pathsim/api#Integrator"
// Runtime: base + "/" + path → "/pathsim-docs/pathsim/api#Integrator"
```

---

## Versioned Documentation

Each package maintains historical API versions.

### Version Extraction

```bash
python scripts/extract-versions.py
```

The script:
1. Lists git tags from each package repository
2. Filters to supported versions (configurable minimum)
3. Smart mode: only extracts missing versions + always re-extracts latest
4. Outputs to `static/api/versions/{package}/v{X.Y}.json`

### Version Manifest

```json
{
  "package": "pathsim",
  "versions": ["0.16", "0.15", "0.14"],
  "latest": "0.16"
}
```

---

## Interactive Notebooks

Jupyter notebooks run in the browser via Pyodide.

### Notebook Processing

```bash
python scripts/prepare-notebooks.py
```

1. Discovers notebooks from source repositories
2. Extracts metadata (title, description, category, tags)
3. Copies to `static/notebooks/{package}/`
4. Generates `manifest.json` for each package

### Execution

- Pyodide runs in a Web Worker (non-blocking)
- Packages installed via micropip at runtime
- Cell outputs rendered: text, images, HTML, errors
- Math support via KaTeX

---

## Configuration

### Package Configuration (`src/lib/config/packages.ts`)

Central source of truth for all package metadata:

```typescript
export const packages = {
  pathsim: {
    name: 'PathSim',
    description: 'Block-diagram simulation framework',
    logo: '/pathsim_logo.png',
    links: { docs: '...', api: '...', github: '...' },
    features: [...],
    installation: { pip: '...', conda: '...' },
    quickstart: '...'
  }
};
```

### Pyodide Configuration (`src/lib/config/pyodide.ts`)

```typescript
export const pyodideConfig = {
  version: '0.26.2',
  packages: ['numpy', 'scipy', 'micropip'],
  pythonPackages: ['pathsim', 'matplotlib'],
  timeout: { init: 120000, cell: 60000 }
};
```

---

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run check` | TypeScript/Svelte type checking |
| `npm run extract` | Extract API from Python packages |
| `npm run build:indexes` | Generate search/crossref indexes |
| `npm run extract:all` | Extract + build indexes (full pipeline) |

---

## Design System

Global styles in `app.css` with CSS custom properties:

### Colors

| Variable | Dark | Light |
|----------|------|-------|
| `--surface` | #08080c | #f0f0f4 |
| `--surface-raised` | #1c1c26 | #ffffff |
| `--text` | #f0f0f5 | #1a1a1f |
| `--accent` | #0070c0 | #0070c0 |

### Typography

- **UI Font**: Inter
- **Code Font**: JetBrains Mono
- **Sizes**: 12px (base), 14px (md), 16px (lg)

### Components

- `.panel`, `.tile`, `.card` - Container styles
- `.elevated` - Subtle shadow effect
- `.crossref` - Cross-reference link styling

---

## Deployment

GitHub Pages deployment via GitHub Actions.

### Workflow

1. Clone PathSim repositories
2. Extract latest API (`extract-api.py`)
3. Extract versioned APIs (`extract-versions.py`)
4. Generate manifests (`generate-manifests.py`)
5. Prepare notebooks (`prepare-notebooks.py`)
6. Build search/crossref indexes (`build-indexes.py`)
7. Build SvelteKit (`npm run build`)
8. Deploy to GitHub Pages

### Environment Variables

- `BASE_PATH`: URL base path (e.g., `/pathsim-docs`)

---

## License

MIT
