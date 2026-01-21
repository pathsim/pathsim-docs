import { apiData, type APIPackage, type APIModule, type APIClass, type APIFunction, type APIMethod } from '$lib/api/generated';

export type SearchResultType = 'module' | 'class' | 'function' | 'method';

export interface SearchResult {
	type: SearchResultType;
	name: string;
	description: string;
	path: string;
	packageId: string;
	moduleName: string;
	parentClass?: string;
}

interface SearchIndex {
	results: SearchResult[];
	built: boolean;
}

// Cached search index
let searchIndex: SearchIndex = { results: [], built: false };

/**
 * Build the search index from all API data
 */
function buildSearchIndex(): SearchResult[] {
	const results: SearchResult[] = [];

	for (const [packageId, pkg] of Object.entries(apiData)) {
		const basePath = `/${packageId}/api`;

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
					if (method.name.startsWith('_') && method.name !== '__init__') continue;
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
 * Search the API index
 */
export function search(query: string, limit: number = 20): SearchResult[] {
	if (!query.trim()) return [];

	const index = getSearchIndex();
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
				// Module contains term
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
			}

			// Boost classes and functions over methods
			if (result.type === 'class') score *= 1.2;
			if (result.type === 'function') score *= 1.1;

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
	}
}
