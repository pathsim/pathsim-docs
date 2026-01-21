<script lang="ts">
	import { base } from '$app/paths';
	import { Notebook } from '$lib/components/notebook';
	import Tooltip from '$lib/components/common/Tooltip.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let basePath = $derived(`${base}/notebooks/${data.packageId}`);
</script>

<svelte:head>
	<title>PathSim - {data.meta.title}</title>
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
</div>

<style>
	.notebook-page {
		max-width: var(--content-max-width);
		min-width: 0;
	}

	.notebook-notice {
		margin-bottom: var(--space-lg);
	}
</style>
