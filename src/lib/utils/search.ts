/**
 * Search functionality using pre-built search index.
 * Index is generated at build time by scripts/build-indexes.py
 */

import searchIndex from '$lib/api/generated/search-index.json';

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

// Type assertion for imported JSON
const index = searchIndex as SearchResult[];

/**
 * Search the pre-built index
 */
export function search(query: string, limit: number = 20): SearchResult[] {
	if (!query.trim()) return [];

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

			// Boost by type (pages highest, then classes, examples, functions)
			if (result.type === 'page') score *= 1.5;
			if (result.type === 'class') score *= 1.2;
			if (result.type === 'example') score *= 1.15;
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
		case 'page': return 'Page';
		case 'module': return 'Module';
		case 'class': return 'Class';
		case 'function': return 'Function';
		case 'method': return 'Method';
		case 'example': return 'Example';
	}
}
