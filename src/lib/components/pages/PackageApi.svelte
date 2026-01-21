<script lang="ts">
	import { onDestroy } from 'svelte';
	import { base } from '$app/paths';
	import Tooltip from '$lib/components/common/Tooltip.svelte';
	import { packages, type PackageId } from '$lib/config/packages';
	import { apiData as staticApiData, type APIPackage, type APIModule } from '$lib/api/generated';
	import { ModuleDoc, VersionSelector } from '$lib/components/api';
	import { apiModulesStore } from '$lib/stores/apiContext';
	import type { PackageManifest } from '$lib/api/versions';

	interface Props {
		packageId: PackageId;
		// Optional versioned props - if not provided, uses static data (backward compat)
		version?: string;
		manifest?: PackageManifest;
		apiData?: APIPackage;
	}

	let { packageId, version, manifest, apiData }: Props = $props();

	let pkg = $derived(packages[packageId]);

	// Map packageId to API data key
	const apiKeyMap: Record<PackageId, string> = {
		pathsim: 'pathsim',
		chem: 'chem',
		vehicle: 'vehicle'
	};

	// Use provided apiData or fall back to static data
	let apiKey = $derived(apiKeyMap[packageId]);
	let apiPackage = $derived(apiData ?? staticApiData[apiKey]);
	let modules = $derived(apiPackage ? Object.values(apiPackage.modules) as APIModule[] : []);

	// Whether we're in versioned mode
	let hasVersioning = $derived(!!manifest && !!version);

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
	<title>API Reference{version ? ` v${version}` : ''} - {pkg.name}</title>
	<meta name="description" content="{pkg.name} API reference documentation" />
</svelte:head>

<Tooltip />

<div class="api-page">
	{#if hasVersioning && manifest}
		<VersionSelector {packageId} currentVersion={version!} {manifest} />
	{/if}

	<div class="hero">
		<img src="{base}/{pkg.logo}" alt={pkg.name} class="hero-logo" />
		<p class="description">Click any class or function to expand its documentation. Use the sidebar to navigate between modules.</p>
	</div>

	<div class="separator"></div>

	{#if modules.length === 0}
		<div class="tile placeholder-tile">
			<div class="panel-body tile-body">
				No API documentation available yet. Run <code>npm run extract</code> to generate.
			</div>
		</div>
	{:else}
		<div class="api-content">
			{#each modules as module}
				<ModuleDoc {module} />
			{/each}
		</div>
	{/if}
</div>

<style>
	.api-page {
		position: relative;
	}

	.api-content {
		margin-top: var(--space-xl);
		padding-bottom: var(--space-2xl);
	}
</style>
