/**
 * Dynamic index loading utilities for versioned search and crossref.
 *
 * Indexes are loaded per-version from:
 * - /{package}/{tag}/search-index.json
 * - /{package}/{tag}/crossref-index.json
 */

import { base } from '$app/paths';
import type { SearchResult } from './search';
import type { CrossRefTarget } from './crossref';
import type { PackageId } from '$lib/config/packages';

/**
 * Create a cached index loader for a specific index type.
 * Reduces duplication between search and crossref loaders.
 */
function createCachedLoader<T>(
	indexName: string,
	emptyValue: T
): {
	load: (
		packageId: string,
		tag: string,
		customFetch: typeof globalThis.fetch
	) => Promise<T>;
	cache: Map<string, T>;
} {
	const cache = new Map<string, T>();

	async function load(
		packageId: string,
		tag: string,
		customFetch: typeof globalThis.fetch = fetch
	): Promise<T> {
		const cacheKey = `${packageId}/${tag}`;

		// Return cached if available
		if (cache.has(cacheKey)) {
			return cache.get(cacheKey)!;
		}

		try {
			const url = `${base}/${packageId}/${tag}/${indexName}.json`;
			const response = await customFetch(url);

			if (!response.ok) {
				console.warn(`Failed to load ${indexName} for ${packageId} ${tag}: ${response.status}`);
				return emptyValue;
			}

			const data = (await response.json()) as T;
			cache.set(cacheKey, data);
			return data;
		} catch (e) {
			console.warn(`Error loading ${indexName} for ${packageId} ${tag}:`, e);
			return emptyValue;
		}
	}

	return { load, cache };
}

// Create cached loaders for each index type
const searchLoader = createCachedLoader<SearchResult[]>('search-index', []);
const crossrefLoader = createCachedLoader<Record<string, CrossRefTarget>>('crossref-index', {});

/**
 * Load search index for a specific package version
 */
export async function loadSearchIndex(
	packageId: string,
	tag: string,
	customFetch: typeof globalThis.fetch = fetch
): Promise<SearchResult[]> {
	return searchLoader.load(packageId, tag, customFetch);
}

/**
 * Load crossref index for a specific package version
 */
export async function loadCrossrefIndex(
	packageId: string,
	tag: string,
	customFetch: typeof globalThis.fetch = fetch
): Promise<Record<string, CrossRefTarget>> {
	return crossrefLoader.load(packageId, tag, customFetch);
}

/**
 * Load and merge indexes for multiple packages/versions
 */
export async function loadMergedSearchIndex(
	packages: Array<{ packageId: PackageId; tag: string }>,
	customFetch: typeof globalThis.fetch = fetch
): Promise<SearchResult[]> {
	const results = await Promise.all(
		packages.map(({ packageId, tag }) => loadSearchIndex(packageId, tag, customFetch))
	);

	return results.flat();
}

/**
 * Load and merge crossref indexes for multiple packages/versions
 */
export async function loadMergedCrossrefIndex(
	packages: Array<{ packageId: PackageId; tag: string }>,
	customFetch: typeof globalThis.fetch = fetch
): Promise<Map<string, CrossRefTarget>> {
	const results = await Promise.all(
		packages.map(({ packageId, tag }) => loadCrossrefIndex(packageId, tag, customFetch))
	);

	const merged = new Map<string, CrossRefTarget>();
	for (const result of results) {
		for (const [key, value] of Object.entries(result)) {
			merged.set(key, value);
		}
	}

	return merged;
}

/**
 * Clear all cached indexes
 */
export function clearIndexCache(): void {
	searchLoader.cache.clear();
	crossrefLoader.cache.clear();
}

/**
 * Clear cached indexes for a specific package
 */
export function clearPackageIndexCache(packageId: string): void {
	for (const key of searchLoader.cache.keys()) {
		if (key.startsWith(`${packageId}/`)) {
			searchLoader.cache.delete(key);
		}
	}
	for (const key of crossrefLoader.cache.keys()) {
		if (key.startsWith(`${packageId}/`)) {
			crossrefLoader.cache.delete(key);
		}
	}
}
