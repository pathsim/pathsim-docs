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
	<div class="loading">
		<Icon name="loader" size={24} />
		<span>Loading examples...</span>
	</div>
{:else if error}
	<div class="error">
		<Icon name="triangle-alert" size={24} />
		<span>{error}</span>
	</div>
{:else if manifest}
	{#each [...groupedNotebooks] as [category, notebooks]}
		<h2 id={category.id}>{category.title}</h2>

		<div class="notebook-grid">
			{#each notebooks as notebook}
				<a
					href="/{packageId}/examples/{notebook.slug}"
					class="notebook-card"
					class:view-only={!notebook.executable}
				>
					<div class="card-header">
						<span class="card-title">{notebook.title}</span>
						{#if !notebook.executable}
							<span class="badge view-only-badge">View Only</span>
						{/if}
					</div>
					<p class="card-description">{notebook.description}</p>
					<div class="card-footer">
						<div class="tags">
							{#each notebook.tags.slice(0, 3) as tag}
								<span class="tag">{tag}</span>
							{/each}
						</div>
						<Icon name="arrow-right" size={16} />
					</div>
				</a>
			{/each}
		</div>
	{/each}

	{#if manifest.notebooks.length === 0}
		<div class="empty">
			<p>No examples available yet.</p>
		</div>
	{/if}
{/if}

<style>
	.loading,
	.error {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-md);
		padding: var(--space-xl);
		color: var(--text-muted);
	}

	.loading :global(svg) {
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

	.error {
		color: var(--error);
	}

	.notebook-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: var(--space-lg);
		margin-bottom: var(--space-xl);
	}

	.notebook-card {
		display: flex;
		flex-direction: column;
		padding: var(--space-lg);
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		text-decoration: none;
		color: inherit;
		transition: all var(--transition-fast);
	}

	.notebook-card:hover {
		border-color: var(--accent);
		box-shadow: 0 4px 12px var(--shadow);
		transform: translateY(-2px);
	}

	.notebook-card.view-only {
		opacity: 0.85;
	}

	.card-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--space-sm);
		margin-bottom: var(--space-sm);
	}

	.card-title {
		font-weight: 600;
		font-size: var(--font-md);
		color: var(--text);
	}

	.badge {
		padding: var(--space-xs) var(--space-sm);
		font-size: var(--font-xs);
		font-weight: 500;
		border-radius: var(--radius-sm);
		white-space: nowrap;
	}

	.view-only-badge {
		background: var(--warning-bg);
		color: var(--warning);
	}

	.card-description {
		flex: 1;
		margin: 0;
		font-size: var(--font-sm);
		color: var(--text-muted);
		line-height: 1.5;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.card-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-top: var(--space-md);
		padding-top: var(--space-md);
		border-top: 1px solid var(--border);
	}

	.tags {
		display: flex;
		gap: var(--space-xs);
		flex-wrap: wrap;
	}

	.tag {
		padding: 2px var(--space-sm);
		font-size: var(--font-xs);
		color: var(--text-disabled);
		background: var(--surface-raised);
		border-radius: var(--radius-sm);
	}

	.card-footer :global(svg) {
		color: var(--text-disabled);
		transition: all var(--transition-fast);
	}

	.notebook-card:hover .card-footer :global(svg) {
		color: var(--accent);
		transform: translateX(4px);
	}

	.empty {
		text-align: center;
		padding: var(--space-xl);
		color: var(--text-muted);
	}

	/* Responsive */
	@media (max-width: 600px) {
		.notebook-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
