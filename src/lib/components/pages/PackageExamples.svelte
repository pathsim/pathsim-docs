<script lang="ts">
	import { onMount } from 'svelte';
	import Icon from '$lib/components/common/Icon.svelte';
	import Tooltip from '$lib/components/common/Tooltip.svelte';
	import { packages, type PackageId } from '$lib/config/packages';
	import {
		loadManifest,
		groupByCategory,
		type NotebookManifest,
		type Category
	} from '$lib/notebook/manifest';

	interface Props {
		packageId: PackageId;
	}

	let { packageId }: Props = $props();

	let pkg = $derived(packages[packageId]);

	// State
	let manifest = $state<NotebookManifest | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);

	// Grouped notebooks
	let groupedNotebooks = $derived.by(() => {
		if (!manifest) return new Map<Category, NotebookMeta[]>();
		return groupByCategory(manifest.notebooks, manifest.categories);
	});

	onMount(async () => {
		try {
			manifest = await loadManifest(packageId);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load examples';
		} finally {
			loading = false;
		}
	});
</script>

<svelte:head>
	<title>Examples - {pkg.name}</title>
	<meta name="description" content="{pkg.name} example notebooks" />
</svelte:head>

<Tooltip />

<div class="hero">
	<img src={pkg.logo} alt={pkg.name} class="hero-logo" />
	<p class="description">Interactive example notebooks for {pkg.name}.</p>
</div>

{#if loading}
	<div class="loading-centered">
		<Icon name="loader" size={24} />
		<span>Loading examples...</span>
	</div>
{:else if error}
	<div class="error-state">
		<Icon name="triangle-alert" size={24} />
		<span>{error}</span>
	</div>
{:else if manifest}
	{#each [...groupedNotebooks] as [category, notebooks]}
		<h2 id={category.id}>{category.title}</h2>

		<div class="tile-grid cols-3">
			{#each notebooks as notebook}
				<a href="/{packageId}/examples/{notebook.slug}" class="tile link-tile">
					<div class="panel-header">
						<span>{notebook.title}</span>
						{#if !notebook.executable}
							<span class="badge warning">View Only</span>
						{/if}
					</div>
					<div class="panel-body tile-body">{notebook.description}</div>
				</a>
			{/each}
		</div>
	{/each}

	{#if manifest.notebooks.length === 0}
		<div class="tile placeholder-tile">
			<div class="panel-body tile-body">No examples available yet.</div>
		</div>
	{/if}
{/if}

<style>
	/* Loading state */
	.loading-centered {
		gap: var(--space-md);
	}

	.loading-centered :global(svg) {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}

	/* Error state */
	.error-state {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-md);
		padding: var(--space-xl);
		color: var(--error);
	}
</style>
