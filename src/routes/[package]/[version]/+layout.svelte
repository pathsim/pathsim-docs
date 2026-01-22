<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { LayoutData } from './$types';
	import { get } from 'svelte/store';
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

	// Update version store when page data changes
	$effect(() => {
		versionStore.setVersion(data.packageId, data.resolvedTag);
	});

	// Initialize search and crossref indexes for ALL packages
	// Only re-runs when URL changes (packageId or resolvedTag)
	$effect(() => {
		// Depend on URL data
		const currentPackageId = data.packageId;
		const currentTag = data.resolvedTag;

		// Read store imperatively (no reactive dependency)
		const versions = get(versionStore);

		loadAllPackageIndexes(currentPackageId, currentTag, versions);
	});

	async function loadAllPackageIndexes(
		currentPackageId: PackageId,
		currentTag: string,
		versions: Partial<Record<PackageId, string>>
	) {
		const packages: Array<{ packageId: PackageId; tag: string }> = [];

		for (const pkgId of packageOrder) {
			if (pkgId === currentPackageId) {
				// Current package uses the resolved tag from URL
				packages.push({ packageId: pkgId, tag: currentTag });
			} else {
				// Other packages: use stored version or fetch latest
				let tag = versions[pkgId];
				if (!tag) {
					try {
						const manifest = await getPackageManifest(pkgId, fetch);
						tag = manifest.latestTag;
					} catch {
						// Package might not have a manifest yet, skip it
						continue;
					}
				}
				packages.push({ packageId: pkgId, tag });
			}
		}

		// Initialize search and crossref with all packages
		await Promise.all([
			initializeSearch(packages),
			initializeCrossref(packages)
		]);
	}
</script>

{@render children()}
