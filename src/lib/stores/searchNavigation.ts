import { writable } from 'svelte/store';

export interface SearchTarget {
	name: string;
	type: 'module' | 'class' | 'function' | 'method';
	parentClass?: string;
}

// Store for the target element to expand and scroll to after search navigation
export const searchTarget = writable<SearchTarget | null>(null);

// Clear the target after it's been handled
export function clearSearchTarget() {
	searchTarget.set(null);
}
