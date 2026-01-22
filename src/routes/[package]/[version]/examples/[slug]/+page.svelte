<script lang="ts">
	import { base } from '$app/paths';
	import { Notebook } from '$lib/components/notebook';
	import Tooltip from '$lib/components/common/Tooltip.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Base path for the version content
	let versionBasePath = $derived(`${base}/${data.packageId}/${data.tag}`);

	// Base path for figures: /{package}/{tag}/figures/
	let figuresBasePath = $derived(`${versionBasePath}/figures`);
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
