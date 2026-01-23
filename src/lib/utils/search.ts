/**
 * Search functionality using dynamically loaded search indexes.
 *
 * Indexes are loaded per-version from static/{package}/{tag}/search-index.json
 *
 * Supports hybrid search: keyword search with automatic semantic fallback
 * when fewer than 3 results are found.
 */

import { writable, get } from 'svelte/store';
import type { PackageId } from '$lib/config/packages';
import { loadMergedSearchIndex, loadMergedEmbeddings, type MergedEmbeddings } from './indexLoader';

// Scoring weights for search relevance
const SCORE_EXACT_MATCH = 100;
const SCORE_PREFIX_MATCH = 50;
const SCORE_CONTAINS = 30;
const SCORE_MODULE_CONTAINS = 15;
const SCORE_DESCRIPTION = 10;
const SCORE_PARENT_CLASS = 20;
const SCORE_TAGS = 25;

// Type boost multipliers
const BOOST_PAGE = 1.5;
const BOOST_CLASS = 1.2;
const BOOST_EXAMPLE = 1.15;
const BOOST_FUNCTION = 1.1;

// Semantic search thresholds
const SEMANTIC_FALLBACK_THRESHOLD = 3; // Trigger semantic if fewer results
const SEMANTIC_SIMILARITY_THRESHOLD = 0.3; // Minimum cosine similarity
const RRF_K = 60; // RRF constant

export type SearchResultType = 'page' | 'module' | 'class' | 'function' | 'method' | 'example';

export interface SearchResult {
	type: SearchResultType;
	name: string;
	description: string;
	path: string;
	packageId: string;
	moduleName: string;
	parentClass?: string;
	tags?: string[];
}

export type SearchMode = 'keyword' | 'hybrid';

export interface HybridSearchResult {
	results: SearchResult[];
	mode: SearchMode;
}

// Store for the active search index (exported for reactive subscriptions)
export const searchIndexStore = writable<SearchResult[]>([]);

// Track initialization state and current version
let initialized = false;
let initPromise: Promise<void> | null = null;
let currentVersionKey: string | null = null;
let currentPackages: Array<{ packageId: PackageId; tag: string }> = [];

// Embeddings cache for hybrid search
let embeddingsPromise: Promise<MergedEmbeddings | null> | null = null;
let embeddingsData: MergedEmbeddings | null = null;

/**
 * Initialize search with indexes for specific package versions.
 * Call this when entering a versioned context.
 * Re-initializes if the version changes.
 */
export async function initializeSearch(
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
		embeddingsPromise = null;
		embeddingsData = null;
	}

	// Avoid duplicate initialization for same request
	if (initPromise) {
		return initPromise;
	}

	initPromise = (async () => {
		const merged = await loadMergedSearchIndex(packages, customFetch);
		searchIndexStore.set(merged);
		initialized = true;
		currentVersionKey = versionKey;
		currentPackages = packages;
	})();

	await initPromise;
	initPromise = null;
}

/**
 * Check if search is initialized
 */
export function isSearchInitialized(): boolean {
	return initialized;
}

/**
 * Get the current search index
 */
export function getSearchIndex(): SearchResult[] {
	return get(searchIndexStore);
}

/**
 * Keyword search the loaded index (synchronous, fast)
 */
export function search(query: string, limit: number = 20): SearchResult[] {
	if (!query.trim()) return [];

	const index = get(searchIndexStore);
	if (index.length === 0) return [];

	const lowerQuery = query.toLowerCase();
	const terms = lowerQuery.split(/\s+/).filter(Boolean);

	// Score and filter results
	const scored = index
		.map((result) => {
			let score = 0;
			const lowerName = result.name.toLowerCase();
			const lowerDesc = result.description.toLowerCase();
			const lowerModule = result.moduleName.toLowerCase();

			for (const term of terms) {
				// Exact name match (highest priority)
				if (lowerName === term) {
					score += SCORE_EXACT_MATCH;
				}
				// Name starts with term
				else if (lowerName.startsWith(term)) {
					score += SCORE_PREFIX_MATCH;
				}
				// Name contains term
				else if (lowerName.includes(term)) {
					score += SCORE_CONTAINS;
				}
				// Module/category contains term
				else if (lowerModule.includes(term)) {
					score += SCORE_MODULE_CONTAINS;
				}
				// Description contains term
				else if (lowerDesc.includes(term)) {
					score += SCORE_DESCRIPTION;
				}
				// Parent class contains term
				else if (result.parentClass?.toLowerCase().includes(term)) {
					score += SCORE_PARENT_CLASS;
				}
				// Tags contain term (for examples)
				else if (result.tags?.some((tag) => tag.toLowerCase().includes(term))) {
					score += SCORE_TAGS;
				}
			}

			// Boost by type (pages highest, then classes, examples, functions)
			if (result.type === 'page') score *= BOOST_PAGE;
			if (result.type === 'class') score *= BOOST_CLASS;
			if (result.type === 'example') score *= BOOST_EXAMPLE;
			if (result.type === 'function') score *= BOOST_FUNCTION;

			return { result, score };
		})
		.filter(({ score }) => score > 0)
		.sort((a, b) => b.score - a.score)
		.slice(0, limit)
		.map(({ result }) => result);

	return scored;
}

/**
 * Hybrid search with automatic semantic fallback.
 *
 * Runs keyword search first. If fewer than 3 results, triggers semantic search
 * and merges using Reciprocal Rank Fusion (RRF).
 *
 * @param query - Search query
 * @param limit - Maximum results to return
 * @param onSemanticStart - Callback when semantic search starts loading
 * @returns Promise with results and mode indicator
 */
export async function hybridSearch(
	query: string,
	limit: number = 20,
	onSemanticStart?: () => void
): Promise<HybridSearchResult> {
	if (!query.trim()) {
		return { results: [], mode: 'keyword' };
	}

	// 1. Run fast keyword search
	const keywordResults = search(query, limit);

	// 2. Check if semantic search is needed
	if (keywordResults.length >= SEMANTIC_FALLBACK_THRESHOLD) {
		return { results: keywordResults, mode: 'keyword' };
	}

	// 3. Signal semantic loading start
	onSemanticStart?.();

	// 4. Load semantic search dependencies
	try {
		const [embeddings, model] = await Promise.all([
			loadEmbeddings(),
			loadSemanticModel()
		]);

		if (!embeddings || !model) {
			// Fall back to keyword if semantic unavailable
			return { results: keywordResults, mode: 'keyword' };
		}

		// 5. Run semantic search
		const semanticResults = await runSemanticSearch(query, embeddings, model, limit);

		// 6. Merge results using RRF
		const merged = mergeWithRRF(keywordResults, semanticResults, limit);

		return { results: merged, mode: 'hybrid' };
	} catch (e) {
		console.warn('Semantic search failed, using keyword only:', e);
		return { results: keywordResults, mode: 'keyword' };
	}
}

/**
 * Load embeddings for current packages (lazy, cached)
 */
async function loadEmbeddings(): Promise<MergedEmbeddings | null> {
	if (embeddingsData) {
		return embeddingsData;
	}

	if (!embeddingsPromise) {
		embeddingsPromise = loadMergedEmbeddings(currentPackages);
	}

	embeddingsData = await embeddingsPromise;
	return embeddingsData;
}

/**
 * Load semantic model (lazy)
 */
async function loadSemanticModel() {
	try {
		const { embedQuery } = await import('$lib/semantic/model');
		return { embedQuery };
	} catch (e) {
		console.warn('Failed to load semantic model:', e);
		return null;
	}
}

/**
 * Run semantic search using embeddings
 */
async function runSemanticSearch(
	query: string,
	embeddings: MergedEmbeddings,
	model: { embedQuery: (text: string) => Promise<Float32Array> },
	limit: number
): Promise<SearchResult[]> {
	const { computeSimilarities, topK } = await import('$lib/semantic/similarity');

	// Embed the query
	const queryEmbedding = await model.embedQuery(query);

	// Compute similarities
	const similarities = computeSimilarities(
		queryEmbedding,
		embeddings.embeddings,
		embeddings.dim,
		embeddings.totalCount
	);

	// Get top results above threshold
	const topResults = topK(similarities, limit, SEMANTIC_SIMILARITY_THRESHOLD);

	// Map back to search results
	const index = get(searchIndexStore);
	const results: SearchResult[] = [];

	for (const { index: globalIdx } of topResults) {
		const { localIndex } = embeddings.indexMap[globalIdx];
		const result = index[localIndex];
		if (result) {
			results.push(result);
		}
	}

	return results;
}

/**
 * Merge keyword and semantic results using Reciprocal Rank Fusion.
 *
 * RRF(d) = Σ 1 / (k + rank(d))
 */
function mergeWithRRF(
	keywordResults: SearchResult[],
	semanticResults: SearchResult[],
	limit: number
): SearchResult[] {
	const scores = new Map<string, { score: number; result: SearchResult }>();

	// Helper to get unique key for result
	const getKey = (r: SearchResult) => `${r.packageId}:${r.path}`;

	// Add keyword results with RRF scores
	keywordResults.forEach((result, rank) => {
		const key = getKey(result);
		const rrfScore = 1 / (RRF_K + rank + 1);
		scores.set(key, { score: rrfScore, result });
	});

	// Add semantic results with RRF scores
	semanticResults.forEach((result, rank) => {
		const key = getKey(result);
		const rrfScore = 1 / (RRF_K + rank + 1);

		const existing = scores.get(key);
		if (existing) {
			// Add scores for items in both lists
			existing.score += rrfScore;
		} else {
			scores.set(key, { score: rrfScore, result });
		}
	});

	// Sort by combined score and return top results
	return Array.from(scores.values())
		.sort((a, b) => b.score - a.score)
		.slice(0, limit)
		.map(({ result }) => result);
}

/**
 * Get display label for result type
 */
export function getTypeLabel(type: SearchResultType): string {
	switch (type) {
		case 'page':
			return 'Page';
		case 'module':
			return 'Module';
		case 'class':
			return 'Class';
		case 'function':
			return 'Function';
		case 'method':
			return 'Method';
		case 'example':
			return 'Example';
	}
}

/**
 * Reset search state (for testing or cleanup)
 */
export function resetSearch(): void {
	searchIndexStore.set([]);
	initialized = false;
	initPromise = null;
	currentVersionKey = null;
	currentPackages = [];
	embeddingsPromise = null;
	embeddingsData = null;
}
