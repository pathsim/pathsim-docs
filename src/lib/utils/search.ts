/**
 * Search functionality using pre-built search index.
 * Index is generated at build time by scripts/build-indexes.py
 */

import searchIndex from '$lib/api/generated/search-index.json';

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
				else if (result.tags?.some(tag => tag.toLowerCase().includes(term))) {
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
