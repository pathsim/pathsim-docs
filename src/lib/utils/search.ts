import { apiData, type APIPackage, type APIModule, type APIClass, type APIFunction, type APIMethod } from '$lib/api/generated';
import type { NotebookManifest } from '$lib/notebook/manifest';

export type SearchResultType = 'module' | 'class' | 'function' | 'method' | 'example';

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

interface SearchIndex {
	results: SearchResult[];
	built: boolean;
}

// Cached search index
let searchIndex: SearchIndex = { results: [], built: false };

// Cache for loaded manifests
let manifestsLoaded = false;
let exampleResults: SearchResult[] = [];

/**
 * Build the search index from all API data
 */
function buildSearchIndex(): SearchResult[] {
	const results: SearchResult[] = [];

	for (const [packageId, pkg] of Object.entries(apiData)) {
		const basePath = `${packageId}/api`;

		for (const [moduleName, module] of Object.entries(pkg.modules)) {
			// Add module
			results.push({
				type: 'module',
				name: moduleName,
				description: module.description || '',
				path: `${basePath}#${moduleName}`,
				packageId,
				moduleName
			});

			// Add classes
			for (const cls of module.classes) {
				results.push({
					type: 'class',
					name: cls.name,
					description: cls.description || '',
					path: `${basePath}#${cls.name}`,
					packageId,
					moduleName
				});

				// Add methods
				for (const method of cls.methods) {
					results.push({
						type: 'method',
						name: method.name,
						description: method.description || '',
						path: `${basePath}#${method.name}`,
						packageId,
						moduleName,
						parentClass: cls.name
					});
				}
			}

			// Add functions
			for (const func of module.functions) {
				results.push({
					type: 'function',
					name: func.name,
					description: func.description || '',
					path: `${basePath}#${func.name}`,
					packageId,
					moduleName
				});
			}
		}
	}

	return results;
}

// Base path for fetching, set via initExamplesSearch
let basePath = '';

/**
 * Load example manifests and build example search results
 */
async function loadExampleManifests(): Promise<SearchResult[]> {
	if (manifestsLoaded) return exampleResults;

	const results: SearchResult[] = [];
	const packageIds = ['pathsim', 'chem', 'vehicle'];

	for (const packageId of packageIds) {
		try {
			const response = await fetch(`${basePath}/notebooks/${packageId}/manifest.json`);
			if (!response.ok) continue;

			const manifest: NotebookManifest = await response.json();

			for (const notebook of manifest.notebooks) {
				results.push({
					type: 'example',
					name: notebook.title,
					description: notebook.description || '',
					path: `${packageId}/examples/${notebook.slug}`,
					packageId,
					moduleName: notebook.category,
					tags: notebook.tags
				});
			}
		} catch {
			// Manifest doesn't exist for this package
		}
	}

	exampleResults = results;
	manifestsLoaded = true;
	return results;
}

/**
 * Get or build the search index
 */
function getSearchIndex(): SearchResult[] {
	if (!searchIndex.built) {
		searchIndex.results = buildSearchIndex();
		searchIndex.built = true;
	}
	return searchIndex.results;
}

/**
 * Initialize examples in the search index (call once on app load)
 */
export async function initExamplesSearch(base: string = ''): Promise<void> {
	basePath = base;
	await loadExampleManifests();
}

/**
 * Search the API and examples index
 */
export function search(query: string, limit: number = 20): SearchResult[] {
	if (!query.trim()) return [];

	// Combine API results with cached example results
	const index = [...getSearchIndex(), ...exampleResults];
	const lowerQuery = query.toLowerCase();
	const terms = lowerQuery.split(/\s+/).filter(Boolean);

	// Score and filter results
	const scored = index
		.map(result => {
			let score = 0;
			const lowerName = result.name.toLowerCase();
			const lowerDesc = result.description.toLowerCase();
			const lowerModule = result.moduleName.toLowerCase();

			for (const term of terms) {
				// Exact name match (highest priority)
				if (lowerName === term) {
					score += 100;
				}
				// Name starts with term
				else if (lowerName.startsWith(term)) {
					score += 50;
				}
				// Name contains term
				else if (lowerName.includes(term)) {
					score += 30;
				}
				// Module/category contains term
				else if (lowerModule.includes(term)) {
					score += 15;
				}
				// Description contains term
				else if (lowerDesc.includes(term)) {
					score += 10;
				}
				// Parent class contains term
				else if (result.parentClass?.toLowerCase().includes(term)) {
					score += 20;
				}
				// Tags contain term (for examples)
				else if (result.tags?.some(tag => tag.toLowerCase().includes(term))) {
					score += 25;
				}
			}

			// Boost classes and functions over methods
			if (result.type === 'class') score *= 1.2;
			if (result.type === 'function') score *= 1.1;
			if (result.type === 'example') score *= 1.15;

			return { result, score };
		})
		.filter(({ score }) => score > 0)
		.sort((a, b) => b.score - a.score)
		.slice(0, limit)
		.map(({ result }) => result);

	return scored;
}

/**
 * Get display label for result type
 */
export function getTypeLabel(type: SearchResultType): string {
	switch (type) {
		case 'module': return 'Module';
		case 'class': return 'Class';
		case 'function': return 'Function';
		case 'method': return 'Method';
		case 'example': return 'Example';
	}
}
