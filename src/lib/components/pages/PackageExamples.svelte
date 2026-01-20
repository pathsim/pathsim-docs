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
	<title>Examples - {pkg.name}</title>
	<meta name="description" content="{pkg.name} example notebooks" />
</svelte:head>

<Tooltip />

<div class="hero">
	<img src={pkg.logo} alt={pkg.name} class="hero-logo" />
	<p class="description">Interactive example notebooks for {pkg.name}.</p>
</div>

{#each pkg.examplesSections as section}
	<h2 id={section.title.toLowerCase().replace(/\s+/g, '-')}>{section.title}</h2>

	<div class="tile-grid cols-3">
		{#each section.items as example}
			<div class="tile">
				<div class="panel-header">{example.title}</div>
				<div class="panel-body tile-body">{example.description}</div>
			</div>
		{/each}
	</div>
{/each}

<div class="tile placeholder-tile">
	<div class="panel-body tile-body">Example notebooks will be loaded from the repository.</div>
</div>
