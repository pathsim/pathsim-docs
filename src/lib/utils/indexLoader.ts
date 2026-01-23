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
import { decodeEmbeddings } from '$lib/semantic/similarity';

/**
 * Embeddings index structure as stored in embeddings-index.json
 */
export interface EmbeddingsIndex {
	model: string;
	dim: number;
	count: number;
	embeddings: string; // Base64 encoded Float32Array
}

/**
 * Decoded embeddings ready for similarity computation
 */
export interface DecodedEmbeddings {
	model: string;
	dim: number;
	count: number;
	embeddings: Float32Array;
}

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

// Embeddings loader with decoding
const embeddingsCache = new Map<string, DecodedEmbeddings | null>();

async function loadEmbeddingsForVersion(
	packageId: string,
	tag: string,
	customFetch: typeof globalThis.fetch = fetch
): Promise<DecodedEmbeddings | null> {
	const cacheKey = `${packageId}/${tag}`;

	if (embeddingsCache.has(cacheKey)) {
		return embeddingsCache.get(cacheKey)!;
	}

	try {
		const url = `${base}/${packageId}/${tag}/embeddings-index.json`;
		const response = await customFetch(url);

		if (!response.ok) {
			embeddingsCache.set(cacheKey, null);
			return null;
		}

		const data = (await response.json()) as EmbeddingsIndex;

		// Decode base64 to Float32Array
		const decoded: DecodedEmbeddings = {
			model: data.model,
			dim: data.dim,
			count: data.count,
			embeddings: decodeEmbeddings(data.embeddings)
		};

		embeddingsCache.set(cacheKey, decoded);
		return decoded;
	} catch (e) {
		console.warn(`Error loading embeddings for ${packageId} ${tag}:`, e);
		embeddingsCache.set(cacheKey, null);
		return null;
	}
}

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
 * Load embeddings for a specific package version
 */
export async function loadEmbeddingsIndex(
	packageId: string,
	tag: string,
	customFetch: typeof globalThis.fetch = fetch
): Promise<DecodedEmbeddings | null> {
	return loadEmbeddingsForVersion(packageId, tag, customFetch);
}

/**
 * Merged embeddings result for multi-package search
 */
export interface MergedEmbeddings {
	dim: number;
	totalCount: number;
	embeddings: Float32Array;
	/** Maps global index to { packageIndex, localIndex } for result lookup */
	indexMap: Array<{ packageIndex: number; localIndex: number }>;
}

/**
 * Load and merge embeddings for multiple packages/versions.
 * Returns null if no embeddings are available.
 */
export async function loadMergedEmbeddings(
	packages: Array<{ packageId: PackageId; tag: string }>,
	customFetch: typeof globalThis.fetch = fetch
): Promise<MergedEmbeddings | null> {
	const results = await Promise.all(
		packages.map(({ packageId, tag }) => loadEmbeddingsForVersion(packageId, tag, customFetch))
	);

	// Filter out nulls and get valid embeddings
	const validResults: Array<{ index: number; embeddings: DecodedEmbeddings }> = [];
	for (let i = 0; i < results.length; i++) {
		const result = results[i];
		if (result !== null) {
			validResults.push({ index: i, embeddings: result });
		}
	}

	if (validResults.length === 0) {
		return null;
	}

	// All embeddings must have same dimension
	const dim = validResults[0].embeddings.dim;
	const totalCount = validResults.reduce((sum, r) => sum + r.embeddings.count, 0);

	// Merge embeddings into single array
	const merged = new Float32Array(totalCount * dim);
	const indexMap: MergedEmbeddings['indexMap'] = [];

	let offset = 0;
	for (const { index: packageIndex, embeddings } of validResults) {
		merged.set(embeddings.embeddings, offset * dim);

		// Build index map for result lookup
		for (let i = 0; i < embeddings.count; i++) {
			indexMap.push({ packageIndex, localIndex: i });
		}

		offset += embeddings.count;
	}

	return {
		dim,
		totalCount,
		embeddings: merged,
		indexMap
	};
}

/**
 * Clear all cached indexes
 */
export function clearIndexCache(): void {
	searchLoader.cache.clear();
	crossrefLoader.cache.clear();
	embeddingsCache.clear();
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
	for (const key of embeddingsCache.keys()) {
		if (key.startsWith(`${packageId}/`)) {
			embeddingsCache.delete(key);
		}
	}
}
