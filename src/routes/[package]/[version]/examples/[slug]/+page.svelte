<script lang="ts">
	import { onDestroy } from 'svelte';
	import { base } from '$app/paths';
	import { Notebook } from '$lib/components/notebook';
	import NotebookControls from '$lib/components/notebook/NotebookControls.svelte';
	import Tooltip from '$lib/components/common/Tooltip.svelte';
	import { packageVersionsStore } from '$lib/stores/packageVersionsStore';
	import { exampleGroupsStore } from '$lib/stores/examplesContext';
	import { groupByCategory } from '$lib/notebook/manifest';
	import { packages } from '$lib/config/packages';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Base path for the version content
	let versionBasePath = $derived(`${base}/${data.packageId}/${data.tag}`);

	// Base path for figures: /{package}/{tag}/figures/
	let figuresBasePath = $derived(`${versionBasePath}/figures`);

	// Set package versions for Pyodide execution
	// Convert tag (e.g., 'v0.16.4') to version number (e.g., '0.16.4')
	$effect(() => {
		const versionNumber = data.tag.replace(/^v/, '');
		const pkg = packages[data.packageId];
		// Use the pip package name from installation config, or fall back to package id
		const pipName = pkg.installation.find((i) => i.name.toLowerCase() === 'pip')?.command.split(' ').pop() || data.packageId;
		packageVersionsStore.set({ [pipName]: versionNumber });

		// Also track slug to re-run effect when example changes
		const _slug = data.meta.slug;

		return async () => {
			// Terminate Pyodide when leaving/changing example
			// This ensures clean state and correct package versions
			try {
				const { terminate } = await import('$lib/pyodide');
				terminate();
			} catch {
				// Ignore if not loaded
			}
			packageVersionsStore.clear();
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
