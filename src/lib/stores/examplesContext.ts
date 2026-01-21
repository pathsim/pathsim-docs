import { writable } from 'svelte/store';
import type { Category, NotebookMeta } from '$lib/notebook/manifest';

export interface GroupedExamples {
	category: Category;
	notebooks: NotebookMeta[];
}

/**
 * Store for grouped examples to be displayed in the sidebar TOC
 * Set by PackageExamples when manifest is loaded
 */
export const exampleGroupsStore = writable<GroupedExamples[]>([]);
