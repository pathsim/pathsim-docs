<script lang="ts">
	import { Notebook } from '$lib/components/notebook';
	import Icon from '$lib/components/common/Icon.svelte';
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
	<nav class="breadcrumb">
		<a href="/{data.packageId}/examples">
			<Icon name="arrow-left" size={16} />
			<span>Examples</span>
		</a>
		{#if !data.meta.executable}
			<span class="badge view-only">View Only</span>
		{/if}
	</nav>

	<Notebook notebook={data.notebook} {basePath} showStaticOutputs={true} />

	<footer class="notebook-footer">
		<a href="/{data.packageId}/examples" class="back-link">
			<Icon name="arrow-left" size={16} />
			<span>Back to Examples</span>
		</a>
		<div class="tags">
			{#each data.meta.tags as tag}
				<span class="tag">{tag}</span>
			{/each}
		</div>
	</footer>
</div>

<style>
	.notebook-page {
		max-width: var(--content-max-width);
		margin: 0 auto;
	}

	.breadcrumb {
		display: flex;
		align-items: center;
		gap: var(--space-md);
		margin-bottom: var(--space-xl);
		padding-bottom: var(--space-md);
		border-bottom: 1px solid var(--border);
	}

	.breadcrumb a {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
		color: var(--text-muted);
		text-decoration: none;
		font-size: var(--font-sm);
		transition: color var(--transition-fast);
	}

	.breadcrumb a:hover {
		color: var(--accent);
	}

	.badge {
		padding: var(--space-xs) var(--space-sm);
		font-size: var(--font-xs);
		font-weight: 500;
		border-radius: var(--radius-sm);
	}

	.badge.view-only {
		background: var(--warning-bg);
		color: var(--warning);
	}

	.notebook-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-top: var(--space-xl);
		padding-top: var(--space-lg);
		border-top: 1px solid var(--border);
	}

	.back-link {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
		color: var(--text-muted);
		text-decoration: none;
		font-size: var(--font-sm);
		transition: color var(--transition-fast);
	}

	.back-link:hover {
		color: var(--accent);
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
</style>
