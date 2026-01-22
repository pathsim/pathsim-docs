/**
 * Package Versions Store
 * Tracks which package versions should be used for Pyodide execution.
 * Set by example pages, read by NotebookCell for initPyodide().
 */

import { writable } from 'svelte/store';
import type { PackageVersions } from '$lib/pyodide/types';

function createPackageVersionsStore() {
	const { subscribe, set, update } = writable<PackageVersions>({});

	return {
		subscribe,
		/**
		 * Set package versions for Pyodide execution
		 * @param versions Package versions (e.g., { pathsim: '0.16.4' })
		 */
		set: (versions: PackageVersions) => set(versions),
		/**
		 * Set a single package version
		 */
		setPackage: (packageName: string, version: string) =>
			update((v) => ({ ...v, [packageName]: version })),
		/**
		 * Clear all package versions (reverts to latest)
		 */
		clear: () => set({})
	};
}

export const packageVersionsStore = createPackageVersionsStore();
