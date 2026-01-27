/**
 * Cross-reference system for linking class/function names in docstrings.
 *
 * Indexes are loaded per-version from static/{package}/{tag}/crossref-index.json
 */

import { writable, get } from 'svelte/store';
import type { PackageId } from '$lib/config/packages';
import { loadMergedCrossrefIndex } from './indexLoader';

export interface CrossRefTarget {
	name: string;
	type: 'class' | 'function' | 'method' | 'module';
	packageId: string;
	moduleName: string;
	parentClass?: string;
	path: string;
}

// Store for the active crossref index
const crossrefIndexStore = writable<Map<string, CrossRefTarget>>(new Map());

// Export store for reactive subscriptions
export { crossrefIndexStore };

// Track initialization state and current version
let initialized = false;
let initPromise: Promise<void> | null = null;
let currentVersionKey: string | null = null;

/**
 * Initialize crossref with indexes for specific package versions.
 * Call this when entering a versioned context.
 * Re-initializes if the version changes.
 */
export async function initializeCrossref(
	packages: Array<{ packageId: PackageId; tag: string }>,
	customFetch: typeof globalThis.fetch = fetch
): Promise<void> {
	// Create a key for the current version combination
	const versionKey = packages.map((p) => `${p.packageId}:${p.tag}`).join(',');

	// Skip if already initialized for this exact version
	if (initialized && currentVersionKey === versionKey) {
		return;
	}

	// If initializing for a different version, reset first
	if (currentVersionKey !== versionKey) {
		initialized = false;
		initPromise = null;
	}

	// Avoid duplicate initialization for same request
	if (initPromise) {
		return initPromise;
	}

	initPromise = (async () => {
		const merged = await loadMergedCrossrefIndex(packages, customFetch);
		crossrefIndexStore.set(merged);
		initialized = true;
		currentVersionKey = versionKey;
	})();

	await initPromise;
	initPromise = null;
}

/**
 * Check if crossref is initialized
 */
export function isCrossrefInitialized(): boolean {
	return initialized;
}

/**
 * Look up a reference and return the target if found
 */
export function lookupRef(name: string): CrossRefTarget | undefined {
	const index = get(crossrefIndexStore);
	return index.get(name);
}

/**
 * Get the full crossref index (for debugging or advanced use)
 */
export function getCrossRefIndex(): Map<string, CrossRefTarget> {
	return get(crossrefIndexStore);
}

/**
 * Process HTML docstring to add cross-reference links
 *
 * Handles:
 * - RST role syntax: :class:`ClassName`, :func:`function_name`, :meth:`method_name`
 * - Docutils literal code: ``ClassName`` (<tt class="docutils literal">)
 * - Plain backtick code: `ClassName`, `function_name`
 * - Title tag references from docutils: <cite>ClassName</cite>
 * - Single-quoted class names in text: 'ClassName'
 */
export function processCrossRefs(
	html: string,
	basePath: string = '',
	currentPackageId?: string
): string {
	const index = get(crossrefIndexStore);

	// Helper to build full URL: basePath (deployment prefix) + / + path
	// Handles edge cases with trailing/leading slashes
	const fullPath = (path: string) => {
		const base = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;
		return `${base}/${path}`;
	};

	// 1. Handle RST role syntax: :class:`Name`, :func:`Name`, :meth:`Name`, :mod:`Name`
	// These often get converted to various forms by docutils
	html = html.replace(/<code class="xref[^"]*">([^<]+)<\/code>/g, (match, name) => {
		const target = index.get(name.trim());
		if (target) {
			return `<a href="${fullPath(target.path)}" class="crossref crossref-${target.type}">${name}</a>`;
		}
		return match;
	});

	// 2. Handle <cite> elements (docutils converts backticks to cite)
	html = html.replace(/<cite>([^<]+)<\/cite>/g, (match, name) => {
		const trimmed = name.trim();
		const target = index.get(trimmed);
		if (target) {
			return `<a href="${fullPath(target.path)}" class="crossref crossref-${target.type}">${name}</a>`;
		}
		return match;
	});

	// 3. Handle docutils literal inline code: <tt class="docutils literal">Name</tt>
	html = html.replace(/<tt class="docutils literal">([A-Z][a-zA-Z0-9_]*)<\/tt>/g, (match, name) => {
		const target = index.get(name);
		if (target && target.type === 'class') {
			return `<a href="${fullPath(target.path)}" class="crossref crossref-${target.type}">${name}</a>`;
		}
		return match;
	});

	// 4. Handle inline code that matches known classes/functions
	// Be careful not to match code inside pre blocks or already-processed links
	html = html.replace(/<code>([A-Z][a-zA-Z0-9_]*)<\/code>/g, (match, name) => {
		// Skip if it looks like it's already part of a link
		const target = index.get(name);
		if (target && target.type === 'class') {
			return `<a href="${fullPath(target.path)}" class="crossref crossref-class"><code>${name}</code></a>`;
		}
		return match;
	});

	// 5. Handle title attribute references (docutils)
	html = html.replace(
		/<span class="[^"]*" title="([^"]+)">([^<]+)<\/span>/g,
		(match, title, text) => {
			const target = index.get(title) || index.get(text);
			if (target) {
				return `<a href="${fullPath(target.path)}" class="crossref crossref-${target.type}">${text}</a>`;
			}
			return match;
		}
	);

	// 6. Handle single-quoted class names in plain text: 'ClassName'
	// Only match PascalCase names (likely class names)
	html = html.replace(/'([A-Z][a-zA-Z0-9_]*)'/g, (match, name) => {
		const target = index.get(name);
		if (target && target.type === 'class') {
			return `<a href="${fullPath(target.path)}" class="crossref crossref-class">'${name}'</a>`;
		}
		return match;
	});

	return html;
}

/**
 * Reset crossref state (for testing or cleanup)
 */
export function resetCrossref(): void {
	crossrefIndexStore.set(new Map());
	initialized = false;
	initPromise = null;
}
