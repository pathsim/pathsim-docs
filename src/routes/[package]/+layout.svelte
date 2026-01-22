<script lang="ts">
	import { DocLayout } from '$lib/components/layout';
	import { page } from '$app/stores';
	import { packages, type PackageId } from '$lib/config/packages';
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();

	// Get packageId from route params, validate it exists
	let packageId = $derived($page.params.package as PackageId);
	let isValidPackage = $derived(packageId in packages);

	// Get version data from page.data (set by [version]/+layout.ts if on versioned page)
	let manifest = $derived($page.data.manifest);
	let currentTag = $derived($page.data.resolvedTag);
</script>

{#if isValidPackage}
	<DocLayout {packageId} {manifest} {currentTag}>
		{@render children()}
	</DocLayout>
{:else}
	{@render children()}
{/if}
