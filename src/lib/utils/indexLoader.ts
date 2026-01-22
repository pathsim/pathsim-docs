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

// Cache for loaded indexes
const searchIndexCache = new Map<string, SearchResult[]>();
const crossrefIndexCache = new Map<string, Record<string, CrossRefTarget>>();

/**
 * Get cache key for a package/version combo
 */
function getCacheKey(packageId: string, tag: string): string {
	return `${packageId}/${tag}`;
}

/**
 * Load search index for a specific package version
 */
export async function loadSearchIndex(
	packageId: string,
	tag: string,
	customFetch: typeof globalThis.fetch = fetch
): Promise<SearchResult[]> {
	const cacheKey = getCacheKey(packageId, tag);

	// Return cached if available
	if (searchIndexCache.has(cacheKey)) {
		return searchIndexCache.get(cacheKey)!;
	}

	try {
		const url = `${base}/${packageId}/${tag}/search-index.json`;
		const response = await customFetch(url);

		if (!response.ok) {
			console.warn(`Failed to load search index for ${packageId} ${tag}: ${response.status}`);
			return [];
		}

		const data = (await response.json()) as SearchResult[];
		searchIndexCache.set(cacheKey, data);
		return data;
	} catch (e) {
		console.warn(`Error loading search index for ${packageId} ${tag}:`, e);
		return [];
	}
}

/**
 * Load crossref index for a specific package version
 */
export async function loadCrossrefIndex(
	packageId: string,
	tag: string,
	customFetch: typeof globalThis.fetch = fetch
): Promise<Record<string, CrossRefTarget>> {
	const cacheKey = getCacheKey(packageId, tag);

	// Return cached if available
	if (crossrefIndexCache.has(cacheKey)) {
		return crossrefIndexCache.get(cacheKey)!;
	}

	try {
		const url = `${base}/${packageId}/${tag}/crossref-index.json`;
		const response = await customFetch(url);

		if (!response.ok) {
			console.warn(`Failed to load crossref index for ${packageId} ${tag}: ${response.status}`);
			return {};
		}

		const data = (await response.json()) as Record<string, CrossRefTarget>;
		crossrefIndexCache.set(cacheKey, data);
		return data;
	} catch (e) {
		console.warn(`Error loading crossref index for ${packageId} ${tag}:`, e);
		return {};
	}
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
	searchIndexCache.clear();
	crossrefIndexCache.clear();
}

/**
 * Clear cached indexes for a specific package
 */
export function clearPackageIndexCache(packageId: string): void {
	for (const key of searchIndexCache.keys()) {
		if (key.startsWith(`${packageId}/`)) {
			searchIndexCache.delete(key);
		}
	}
	for (const key of crossrefIndexCache.keys()) {
		if (key.startsWith(`${packageId}/`)) {
			crossrefIndexCache.delete(key);
		}
	}
}
