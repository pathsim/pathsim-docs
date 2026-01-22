/**
 * Types and utilities for notebook manifests.
 *
 * For loading data, prefer using functions from loader.ts directly
 * for full versioning support. Functions here are kept for backwards
 * compatibility and use latest version by default.
 */

import { getPackageManifest } from '$lib/api/versions';
import { getVersionManifest, getNotebook as loaderGetNotebook, type VersionManifest } from './loader';

export interface NotebookMeta {
	/** URL-friendly identifier */
	slug: string;
	/** Display title (from first H1) */
	title: string;
	/** Short description (from first paragraph) */
	description: string;
	/** Category ID for grouping */
	category: string;
	/** Filename (e.g., "pendulum.ipynb") */
	file: string;
	/** Tags for filtering/search */
	tags: string[];
	/** Whether notebook can run in Pyodide */
	executable: boolean;
}

export interface Category {
	/** Unique identifier */
	id: string;
	/** Display title */
	title: string;
	/** Sort order */
	order: number;
}

export interface NotebookManifest {
	/** Package identifier */
	package: string;
	/** Version tag (added for new structure) */
	tag?: string;
	/** All notebooks in this package */
	notebooks: NotebookMeta[];
	/** Category definitions */
	categories: Category[];
}

/**
 * Load manifest for a package (latest version).
 * For versioned loading, use getVersionManifest from loader.ts
 */
export async function loadManifest(
	packageId: string,
	_basePath: string = '',
	customFetch: typeof globalThis.fetch = fetch
): Promise<NotebookManifest> {
	// Get package manifest to find latest tag
	const pkgManifest = await getPackageManifest(packageId, customFetch);
	const latestTag = pkgManifest.latestTag;

	// Load version manifest (notebook list)
	const versionManifest = await getVersionManifest(packageId, latestTag, customFetch);

	return versionManifest;
}

/**
 * Load a notebook JSON file (latest version).
 * For versioned loading, use getNotebook from loader.ts
 */
export async function loadNotebook(
	packageId: string,
	filename: string,
	_basePath: string = '',
	customFetch: typeof globalThis.fetch = fetch
): Promise<unknown> {
	// Get package manifest to find latest tag
	const pkgManifest = await getPackageManifest(packageId, customFetch);
	const latestTag = pkgManifest.latestTag;

	// Load notebook from versioned path
	return loaderGetNotebook(packageId, latestTag, filename, customFetch);
}

/**
 * Group notebooks by category.
 */
export function groupByCategory(
	notebooks: NotebookMeta[],
	categories: Category[]
): Map<Category, NotebookMeta[]> {
	const categoryMap = new Map<string, Category>();
	for (const cat of categories) {
		categoryMap.set(cat.id, cat);
	}

	const groups = new Map<Category, NotebookMeta[]>();

	for (const notebook of notebooks) {
		const category = categoryMap.get(notebook.category);
		if (category) {
			const existing = groups.get(category) || [];
			existing.push(notebook);
			groups.set(category, existing);
		}
	}

	// Sort by category order
	return new Map([...groups.entries()].sort((a, b) => a[0].order - b[0].order));
}
