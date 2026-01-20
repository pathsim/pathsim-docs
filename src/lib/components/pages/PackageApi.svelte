<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import Tooltip from '$lib/components/common/Tooltip.svelte';
	import { packages, type PackageId } from '$lib/config/packages';
	import { apiData, type APIModule } from '$lib/api/generated';
	import { ModuleDoc } from '$lib/components/api';
	import { apiModulesStore } from '$lib/stores/apiContext';

	interface Props {
		packageId: PackageId;
	}

	let { packageId }: Props = $props();

	let pkg = $derived(packages[packageId]);

	// Map packageId to API data key
	const apiKeyMap: Record<PackageId, string> = {
		pathsim: 'pathsim',
		chem: 'chem',
		vehicle: 'vehicle'
	};

	let apiKey = $derived(apiKeyMap[packageId]);
	let apiPackage = $derived(apiData[apiKey]);
	let modules = $derived(apiPackage ? Object.values(apiPackage.modules) : []);

	// Update the store with modules for the sidebar TOC
	$effect(() => {
		apiModulesStore.set(modules);
	});

	// Clear the store when component unmounts
	onDestroy(() => {
		apiModulesStore.set([]);
	});
</script>

<svelte:head>
	<title>API Reference - {pkg.name}</title>
	<meta name="description" content="{pkg.name} API reference documentation" />
</svelte:head>

<Tooltip />

<div class="hero">
	<img src={pkg.logo} alt={pkg.name} class="hero-logo" />
	<p class="description">Complete API documentation for {pkg.name}.</p>
</div>

<h2 id="modules">Modules</h2>

{#if modules.length === 0}
	<div class="tile placeholder-tile">
		<div class="panel-body tile-body">
			No API documentation available yet. Run <code>npm run extract</code> to generate.
		</div>
	</div>
{:else}
	<!-- Module documentation -->
	<div class="api-content">
		{#each modules as module}
			<ModuleDoc {module} />
		{/each}
	</div>
{/if}

<style>
	.api-content {
		margin-top: var(--space-xl);
	}
</style>
