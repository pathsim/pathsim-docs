<script lang="ts">
	import Tooltip from '$lib/components/common/Tooltip.svelte';
	import { packages, type PackageId } from '$lib/config/packages';

	interface Props {
		packageId: PackageId;
	}

	let { packageId }: Props = $props();

	let pkg = $derived(packages[packageId]);
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

<div class="tile-grid cols-2">
	{#each pkg.apiModules as module}
		<div class="tile">
			<div class="panel-header">{module.name}</div>
			<div class="panel-body tile-body">{module.description}</div>
		</div>
	{/each}
</div>

<div class="tile placeholder-tile">
	<div class="panel-body tile-body">API documentation will be auto-generated from source code.</div>
</div>
