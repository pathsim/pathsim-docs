<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { LayoutData } from './$types';
	import { initializeSearch } from '$lib/utils/search';
	import { initializeCrossref } from '$lib/utils/crossref';
	import { versionStore } from '$lib/stores/versionStore';

	interface Props {
		data: LayoutData;
		children: Snippet;
	}

	let { data, children }: Props = $props();

	// Initialize search and crossref indexes when version changes
	$effect(() => {
		// Update version store when entering a versioned page
		versionStore.setVersion(data.packageId, data.resolvedTag);

		// Initialize search and crossref with this version
		Promise.all([
			initializeSearch([{ packageId: data.packageId, tag: data.resolvedTag }]),
			initializeCrossref([{ packageId: data.packageId, tag: data.resolvedTag }])
		]);
	});
</script>

{@render children()}
