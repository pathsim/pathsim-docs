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
</script>

{#if isValidPackage}
	<DocLayout {packageId}>
		{@render children()}
	</DocLayout>
{:else}
	{@render children()}
{/if}
