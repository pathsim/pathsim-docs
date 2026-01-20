<script lang="ts">
	import Tooltip from '$lib/components/common/Tooltip.svelte';
	import { packages, type PackageId } from '$lib/config/packages';
	import { apiData, type APIModule } from '$lib/api/generated';
	import { ModuleDoc } from '$lib/components/api';

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

	// Group modules by top-level (e.g., pathsim.blocks vs pathsim)
	let moduleGroups = $derived.by(() => {
		const groups: Record<string, APIModule[]> = {};
		for (const mod of modules) {
			const parts = mod.name.split('.');
			const groupKey = parts.length > 1 ? parts.slice(0, 2).join('.') : mod.name;
			if (!groups[groupKey]) {
				groups[groupKey] = [];
			}
			groups[groupKey].push(mod);
		}
		return groups;
	});

	// Get selected module from URL hash
	let selectedModule = $state<string | null>(null);

	function scrollToModule(moduleName: string) {
		const id = moduleName.replace(/\./g, '-');
		const element = document.getElementById(id);
		if (element) {
			element.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}
	}
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
	<!-- Module navigation -->
	<nav class="module-nav">
		{#each Object.entries(moduleGroups) as [groupName, groupModules]}
			<button
				class="module-nav-item"
				class:active={selectedModule === groupName}
				onclick={() => scrollToModule(groupName)}
			>
				<code>{groupName}</code>
				{#if groupModules[0]}
					<span class="module-stats">
						{groupModules[0].classes.length} classes
					</span>
				{/if}
			</button>
		{/each}
	</nav>

	<!-- Module documentation -->
	<div class="api-content">
		{#each modules as module}
			<ModuleDoc {module} />
		{/each}
	</div>
{/if}

<style>
	.module-nav {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-sm);
		margin-bottom: var(--space-xl);
	}

	.module-nav-item {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 2px;
		padding: var(--space-sm) var(--space-md);
		background: var(--surface-raised);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.module-nav-item:hover {
		border-color: var(--accent);
		background: var(--surface-hover);
	}

	.module-nav-item.active {
		border-color: var(--accent);
		background: var(--accent-bg);
	}

	.module-nav-item code {
		font-size: var(--font-sm);
		background: none;
		border: none;
		padding: 0;
		color: var(--text);
	}

	.module-stats {
		font-size: var(--font-xs);
		color: var(--text-muted);
	}

	.api-content {
		margin-top: var(--space-xl);
	}
</style>
