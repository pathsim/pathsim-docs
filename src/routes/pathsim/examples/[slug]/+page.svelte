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

<div class="prose">
	<nav class="notebook-nav">
		<a href="/{data.packageId}/examples" class="nav-link">
			<Icon name="arrow-left" size={16} />
			<span>Examples</span>
		</a>
		{#if !data.meta.executable}
			<span class="badge warning">View Only</span>
		{/if}
	</nav>

	<Notebook notebook={data.notebook} {basePath} showStaticOutputs={true} />

	<footer class="notebook-footer">
		<a href="/{data.packageId}/examples" class="nav-link">
			<Icon name="arrow-left" size={16} />
			<span>Back to Examples</span>
		</a>
		<div class="notebook-tags">
			{#each data.meta.tags as tag}
				<span class="notebook-tag">{tag}</span>
			{/each}
		</div>
	</footer>
</div>

<style>
	.notebook-nav {
		display: flex;
		align-items: center;
		gap: var(--space-md);
		margin-bottom: var(--space-xl);
		padding-bottom: var(--space-md);
		border-bottom: 1px solid var(--border);
	}

	.nav-link {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
		color: var(--text-muted);
		text-decoration: none;
		font-size: var(--font-sm);
		transition: color var(--transition-fast);
	}

	.nav-link:hover {
		color: var(--accent);
		text-decoration: none;
	}

	.notebook-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
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
