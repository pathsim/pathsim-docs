/**
 * Shared debounced search hook for PathSim Documentation
 * Consolidates duplicate search logic from Sidebar and home page
 */

import { search, hybridSearch, type SearchResult } from '$lib/utils/search';
import { SEARCH_DEBOUNCE_MS } from '$lib/config/timing';

export interface SearchOptions {
	/** Maximum number of results to return */
	limit?: number;
	/** Debounce delay in milliseconds */
	delay?: number;
}

export interface SearchState {
	query: string;
	results: SearchResult[];
	isSearching: boolean;
}

/**
 * Creates a debounced search state with hybrid search
 * Returns reactive state that can be used in Svelte components
 */
export function createDebouncedSearch(options: SearchOptions = {}) {
	const { limit = 15, delay = SEARCH_DEBOUNCE_MS } = options;

	let searchQuery = $state('');
	let debouncedQuery = $state('');
	let searchResults = $state<SearchResult[]>([]);
	let isSearching = $state(false);
	let showResults = $derived(searchQuery.length > 0);

	// Debounce search query
	$effect(() => {
		const query = searchQuery;
		const timeout = setTimeout(() => {
			debouncedQuery = query;
		}, delay);
		return () => clearTimeout(timeout);
	});

	// Run hybrid search when debounced query changes
	$effect(() => {
		const query = debouncedQuery;
		if (!query) {
			searchResults = [];
			isSearching = false;
			return;
		}

		let cancelled = false;

		hybridSearch(query, limit, () => {
			if (!cancelled) isSearching = true;
		}).then((result) => {
			if (!cancelled) {
				searchResults = result.results;
				isSearching = false;
			}
		}).catch(() => {
			if (!cancelled) {
				searchResults = search(query, limit);
				isSearching = false;
			}
		});

		return () => {
			cancelled = true;
		};
	});

	return {
		get query() { return searchQuery; },
		set query(value: string) { searchQuery = value; },
		get results() { return searchResults; },
		get isSearching() { return isSearching; },
		get showResults() { return showResults; },
		clear() { searchQuery = ''; }
	};
}
