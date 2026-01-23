<script lang="ts">
	import { onDestroy } from 'svelte';
	import { base } from '$app/paths';
	import { goto } from '$app/navigation';
	import Icon from '$lib/components/common/Icon.svelte';
	import Tooltip from '$lib/components/common/Tooltip.svelte';
	import { packages, type PackageId } from '$lib/config/packages';
	import { groupByCategory, type NotebookMeta, type Category } from '$lib/notebook/manifest';
	import { exampleGroupsStore } from '$lib/stores/examplesContext';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let pkg = $derived(packages[data.packageId]);

	// Grouped notebooks from the version manifest
	let groupedNotebooks = $derived.by(() => {
		if (!data.versionManifest) return new Map<Category, NotebookMeta[]>();
		return groupByCategory(data.versionManifest.notebooks, data.versionManifest.categories);
	});

	// Reactively update store for sidebar TOC when data changes (including version changes)
	$effect(() => {
		if (data.versionManifest) {
			const grouped = groupByCategory(
				data.versionManifest.notebooks,
				data.versionManifest.categories
			);
			const groups = [...grouped.entries()].map(([category, notebooks]) => ({
				category,
				notebooks
			}));
			exampleGroupsStore.set(groups);
		} else {
			exampleGroupsStore.set([]);
		}
	});

	onDestroy(() => {
		exampleGroupsStore.set([]);
	});

	function navigateToExample(slug: string) {
		goto(`${base}/${data.packageId}/${data.resolvedTag}/examples/${slug}`);
	}

	function getThumbnailUrl(thumbnail: string): string {
		return `${base}/${data.packageId}/${data.resolvedTag}/figures/${thumbnail}`;
	}
</script>

<svelte:head>
	<title>{pkg.name} - Examples ({data.resolvedTag})</title>
	<meta name="description" content="{pkg.name} example notebooks" />
</svelte:head>

<Tooltip />

<div class="hero">
	<img src="{base}/{pkg.logo}" alt={pkg.name} class="hero-logo" />
	<p class="description">Interactive example notebooks for {pkg.name}.</p>
</div>

{#if data.versionManifest && data.versionManifest.notebooks.length > 0}
	{#each [...groupedNotebooks] as [category, notebooks]}
		<h2 id={category.id}>{category.title}</h2>

		<div class="tile-grid cols-3">
			{#each notebooks as notebook}
				<div
					class="tile example-tile elevated"
					onclick={() => navigateToExample(notebook.slug)}
					onkeydown={(e) => e.key === 'Enter' && navigateToExample(notebook.slug)}
					role="button"
					tabindex="0"
				>
					<div class="panel-header">{notebook.title}</div>
					{#if notebook.thumbnail}
						<div class="panel-body tile-body thumbnail-body">
							<img src={getThumbnailUrl(notebook.thumbnail)} alt={notebook.title} />
						</div>
					{:else}
						<div class="panel-body tile-body">{notebook.description}</div>
					{/if}
				</div>
			{/each}
		</div>
	{/each}
{:else}
	<div class="tile placeholder-tile">
		<div class="panel-body tile-body">No examples available for this version.</div>
	</div>
{/if}

<div class="page-bottom-spacer"></div>

<style>
	.page-bottom-spacer {
		height: var(--space-2xl);
	}

	/* Example tile - clickable */
	.example-tile {
		cursor: pointer;
	}

	/* Thumbnail image in tile body */
	.thumbnail-body {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-sm);
	}

	.thumbnail-body img {
		max-width: 100%;
		max-height: 150px;
		width: auto;
		height: auto;
		object-fit: contain;
	}
</style>
