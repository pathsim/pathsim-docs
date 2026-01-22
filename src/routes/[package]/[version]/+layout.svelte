<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { LayoutData } from './$types';
	import { initializeSearch } from '$lib/utils/search';
	import { initializeCrossref } from '$lib/utils/crossref';
	import { versionStore } from '$lib/stores/versionStore';
	import { packageOrder, type PackageId } from '$lib/config/packages';
	import { getPackageManifest } from '$lib/api/versions';

	interface Props {
		data: LayoutData;
		children: Snippet;
	}

	let { data, children }: Props = $props();

	// Subscribe to version store for reactivity
	let storedVersions = $derived($versionStore);

	// Initialize search and crossref indexes for ALL packages
	// Re-runs when URL version or any stored version changes
	$effect(() => {
		// Update version store when entering a versioned page
		versionStore.setVersion(data.packageId, data.resolvedTag);

		// Track if this effect instance is still current (for race condition handling)
		let cancelled = false;

		// Use storedVersions to establish reactive dependency
		loadAllPackageIndexes(storedVersions, () => cancelled);

		// Cleanup: mark as cancelled if effect re-runs before completion
		return () => {
			cancelled = true;
		};
	});

	async function loadAllPackageIndexes(versions: typeof storedVersions, isCancelled: () => boolean) {
		const packages: Array<{ packageId: PackageId; tag: string }> = [];

		for (const pkgId of packageOrder) {
			// Check if cancelled before each async operation
			if (isCancelled()) return;

			if (pkgId === data.packageId) {
				// Current package uses the resolved tag from URL
				packages.push({ packageId: pkgId, tag: data.resolvedTag });
			} else {
				// Other packages: use stored version or fetch latest
				let tag = versions[pkgId];
				if (!tag) {
					try {
						const manifest = await getPackageManifest(pkgId, fetch);
						if (isCancelled()) return;
						tag = manifest.latestTag;
					} catch {
						// Package might not have a manifest yet, skip it
						continue;
					}
				}
				packages.push({ packageId: pkgId, tag });
			}
		}

		// Check before final initialization
		if (isCancelled()) return;

		// Initialize search and crossref with all packages
		await Promise.all([
			initializeSearch(packages),
			initializeCrossref(packages)
		]);
	}
</script>

{@render children()}
