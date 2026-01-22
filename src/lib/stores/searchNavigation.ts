import { writable } from 'svelte/store';

export type NavigationSource = 'search' | 'crossref' | 'toc' | 'url';

export interface SearchTarget {
	name: string;
	type: 'page' | 'module' | 'class' | 'function' | 'method' | 'example';
	parentClass?: string;
	source?: NavigationSource;
}

// Store for the target element to expand and scroll to after navigation
export const searchTarget = writable<SearchTarget | null>(null);

// Clear the target after it's been handled
export function clearSearchTarget() {
	searchTarget.set(null);
}
