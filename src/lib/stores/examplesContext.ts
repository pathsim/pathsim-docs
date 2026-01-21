import { writable } from 'svelte/store';
import type { Category } from '$lib/notebook/manifest';

/**
 * Store for example categories to be displayed in the sidebar TOC
 * Set by PackageExamples when manifest is loaded
 */
export const exampleCategoriesStore = writable<Category[]>([]);
