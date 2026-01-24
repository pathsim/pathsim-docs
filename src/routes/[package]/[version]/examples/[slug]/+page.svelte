<script lang="ts">
	import { onDestroy } from 'svelte';
	import { base } from '$app/paths';
	import { Notebook } from '$lib/components/notebook';
	import NotebookControls from '$lib/components/notebook/NotebookControls.svelte';
	import Tooltip from '$lib/components/common/Tooltip.svelte';
	import { packageVersionsStore } from '$lib/stores/packageVersionsStore';
	import { exampleGroupsStore } from '$lib/stores/examplesContext';
	import { notebookStore } from '$lib/stores/notebookStore';
	import { groupByCategory } from '$lib/notebook/manifest';
	import { packages } from '$lib/config/packages';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Base path for the version content
	let versionBasePath = $derived(`${base}/${data.packageId}/${data.tag}`);

	// Base path for figures: /{package}/{tag}/figures/
	let figuresBasePath = $derived(`${versionBasePath}/figures`);

	// Set package versions for Pyodide execution
	// Pyodide will lazily reinitialize on next execution if version changed
	$effect(() => {
		const versionNumber = data.tag.replace(/^v/, '');
		const pkg = packages[data.packageId];
		const pipName = pkg.installation.find((i) => i.name.toLowerCase() === 'pip')?.command.split(' ').pop() || data.packageId;
		packageVersionsStore.set({ [pipName]: versionNumber });

		return () => {
			packageVersionsStore.clear();
		};
	});

	// Reset Pyodide namespace when example changes (but don't terminate)
	$effect(() => {
		const slug = data.meta.slug;

		// Reset namespace and notebook state when switching examples
		return async () => {
			try {
				const { reset } = await import('$lib/pyodide');
				await reset();
			} catch {
				// Ignore if Pyodide not loaded
			}
			notebookStore.resetAllCells();
		};
	});

	// Populate examples store for sidebar TOC
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
		}
	});

	onDestroy(() => {
		exampleGroupsStore.set([]);
	});
</script>

<svelte:head>
	<title>{data.meta.title} - Example</title>
	<meta name="description" content={data.meta.description} />
</svelte:head>

<Tooltip />

<div class="notebook-page">
	{#if !data.meta.executable}
		<div class="notebook-notice">
			<span class="badge warning">View Only</span>
		</div>
	{:else}
		<NotebookControls />
	{/if}

	<Notebook
		notebook={data.notebook}
		basePath={versionBasePath}
		precomputedOutputs={data.outputs}
		{figuresBasePath}
		showStaticOutputs={true}
	/>
</div>

<style>
	.notebook-page {
		max-width: var(--content-max-width);
		min-width: 0;
		padding-bottom: var(--space-4xl);
	}

	.notebook-notice {
		margin-bottom: var(--space-lg);
	}
</style>
