/**
 * Version store - persists selected version per package in localStorage.
 *
 * Key: 'pathsim-docs-versions'
 * Value: { pathsim: "v0.16.4", chem: "v0.14.0", ... }
 */
import { writable, get } from 'svelte/store';
import type { PackageId } from '$lib/config/packages';

const STORAGE_KEY = 'pathsim-docs-versions';

export type VersionMap = Partial<Record<PackageId, string>>;

// Create the writable store
const createVersionStore = () => {
	const { subscribe, set, update } = writable<VersionMap>({});

	return {
		subscribe,

		/**
		 * Initialize the store from localStorage (call on app mount)
		 */
		initialize() {
			if (typeof window === 'undefined') return;

			try {
				const stored = localStorage.getItem(STORAGE_KEY);
				if (stored) {
					const parsed = JSON.parse(stored) as VersionMap;
					set(parsed);
				}
			} catch {
				// Invalid JSON or storage error, start fresh
				set({});
			}
		},

		/**
		 * Set the version for a specific package (only updates if changed)
		 */
		setVersion(packageId: PackageId, tag: string) {
			update((versions) => {
				// Skip update if version is already the same
				if (versions[packageId] === tag) {
					return versions;
				}
				const updated = { ...versions, [packageId]: tag };
				this.persist(updated);
				return updated;
			});
		},

		/**
		 * Get the version for a specific package
		 */
		getVersion(packageId: PackageId): string | undefined {
			return get(this)[packageId];
		},

		/**
		 * Get the version synchronously (for server-side or initial load)
		 */
		getVersionSync(packageId: PackageId): string | undefined {
			if (typeof window === 'undefined') return undefined;

			try {
				const stored = localStorage.getItem(STORAGE_KEY);
				if (stored) {
					const parsed = JSON.parse(stored) as VersionMap;
					return parsed[packageId];
				}
			} catch {
				// Ignore errors
			}
			return undefined;
		},

		/**
		 * Persist to localStorage
		 */
		persist(versions: VersionMap) {
			if (typeof window === 'undefined') return;

			try {
				localStorage.setItem(STORAGE_KEY, JSON.stringify(versions));
			} catch {
				// Storage full or disabled, ignore
			}
		},

		/**
		 * Clear all stored versions
		 */
		clear() {
			set({});
			if (typeof window !== 'undefined') {
				localStorage.removeItem(STORAGE_KEY);
			}
		}
	};
};

export const versionStore = createVersionStore();
