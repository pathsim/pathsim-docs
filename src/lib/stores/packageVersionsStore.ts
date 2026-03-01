/**
 * Package Versions Store
 * Tracks which packages and versions should be used for Pyodide execution.
 * Set by example pages, read by NotebookCell for initPyodide().
 */

import { writable } from 'svelte/store';
import type { PackageVersions, PyodidePackageInfo } from '$lib/pyodide/types';

export interface PackageExecutionConfig {
	packages: PyodidePackageInfo[];
	versions: PackageVersions;
}

function createPackageVersionsStore() {
	const { subscribe, set, update } = writable<PackageExecutionConfig>({
		packages: [],
		versions: {}
	});

	return {
		subscribe,
		/**
		 * Set full execution config (packages + versions)
		 */
		set: (config: PackageExecutionConfig) => set(config),
		/**
		 * Clear all package config (reverts to defaults)
		 */
		clear: () => set({ packages: [], versions: {} })
	};
}

export const packageVersionsStore = createPackageVersionsStore();
