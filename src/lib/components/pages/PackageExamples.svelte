<script lang="ts">
	import { onMount } from 'svelte';
	import Icon from '$lib/components/common/Icon.svelte';
	import Tooltip from '$lib/components/common/Tooltip.svelte';
	import { packages, type PackageId } from '$lib/config/packages';
	import {
		loadManifest,
		groupByCategory,
		type NotebookManifest,
		type NotebookMeta,
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
						<span class="notebook-title">{notebook.title}</span>
						{#if !notebook.executable}
							<span class="badge warning">View Only</span>
						{/if}
					</div>
					<div class="panel-body notebook-body">
						<p class="notebook-description">{notebook.description}</p>
						<div class="notebook-footer">
							<div class="notebook-tags">
								{#each notebook.tags.slice(0, 3) as tag}
									<span class="notebook-tag">{tag}</span>
								{/each}
							</div>
							<Icon name="arrow-right" size={16} />
						</div>
					</div>
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
	/* Loading state - extends global loading-centered */
	.loading-centered {
		gap: var(--space-md);
	}

	.loading-centered :global(svg) {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
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

	/* Notebook tile content */
	.notebook-title {
		font-weight: 500;
		color: var(--text);
		text-transform: none;
		letter-spacing: normal;
		font-size: var(--font-sm);
	}

	.notebook-body {
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	.notebook-description {
		flex: 1;
		margin: 0;
		font-size: var(--font-sm);
		color: var(--text-muted);
		line-height: 1.5;
		display: -webkit-box;
		line-clamp: 2;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.notebook-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-top: var(--space-md);
		padding-top: var(--space-md);
		border-top: 1px solid var(--border);
	}

	.notebook-tags {
		display: flex;
		gap: var(--space-xs);
		flex-wrap: wrap;
	}

	.notebook-tag {
		padding: 2px var(--space-sm);
		font-size: var(--font-xs);
		color: var(--text-disabled);
		background: var(--surface-raised);
		border-radius: var(--radius-sm);
	}

	.notebook-footer :global(svg) {
		color: var(--text-disabled);
		transition: all var(--transition-fast);
	}

	.link-tile:hover .notebook-footer :global(svg) {
		color: var(--accent);
		transform: translateX(4px);
	}
</style>
