<script lang="ts">
	import { Notebook } from '$lib/components/notebook';
	import Tooltip from '$lib/components/common/Tooltip.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let basePath = $derived(`/notebooks/${data.packageId}`);
</script>

<svelte:head>
	<title>{data.meta.title} - PathSim Examples</title>
	<meta name="description" content={data.meta.description} />
</svelte:head>

<Tooltip />

<div class="notebook-page">
	{#if !data.meta.executable}
		<div class="notebook-notice">
			<span class="badge warning">View Only</span>
		</div>
	{/if}

	<Notebook notebook={data.notebook} {basePath} showStaticOutputs={true} />

	{#if data.meta.tags.length > 0}
		<footer class="notebook-footer">
			<div class="notebook-tags">
				{#each data.meta.tags as tag}
					<span class="notebook-tag">{tag}</span>
				{/each}
			</div>
		</footer>
	{/if}
</div>

<style>
	.notebook-page {
		max-width: var(--content-max-width);
	}

	.notebook-notice {
		margin-bottom: var(--space-lg);
	}

	.notebook-footer {
		margin-top: var(--space-xl);
		padding-top: var(--space-lg);
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
</style>
