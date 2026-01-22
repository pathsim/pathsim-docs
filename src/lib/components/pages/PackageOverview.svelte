<script lang="ts">
	import { onMount } from 'svelte';
	import { base } from '$app/paths';
	import Icon from '$lib/components/common/Icon.svelte';
	import Tooltip, { tooltip } from '$lib/components/common/Tooltip.svelte';
	import NotebookCell from '$lib/components/common/NotebookCell.svelte';
	import { packages, type PackageId } from '$lib/config/packages';
	import { copyToClipboard } from '$lib/utils/clipboard';
	import { versionStore } from '$lib/stores/versionStore';
	import { getPackageManifest, type PackageManifest } from '$lib/api/versions';

	interface Props {
		packageId: PackageId;
	}

	let { packageId }: Props = $props();

	let pkg = $derived(packages[packageId]);
	let featureCols = $derived(pkg.features.length > 4 ? 'cols-3' : 'cols-2');

	// Track copy state for each install option
	let copiedStates = $state<Record<string, boolean>>({});

	// Version state
	let manifest = $state<PackageManifest | null>(null);
	let selectedTag = $state<string | null>(null);
	let apiAvailable = $state(false);
	let examplesAvailable = $state(false);
	let loading = $state(true);

	function handleCopy(command: string, name: string) {
		copyToClipboard(
			command,
			() => (copiedStates[name] = true),
			() => (copiedStates[name] = false)
		);
	}

	// Load manifest and check availability
	onMount(async () => {
		try {
			// Load package manifest
			manifest = await getPackageManifest(packageId, fetch);

			// Get stored version or use latest
			const storedVersion = versionStore.getVersionSync(packageId);
			selectedTag = storedVersion || manifest.latestTag;

			// Check availability for the selected version
			await checkAvailability(selectedTag);
		} catch (e) {
			console.warn(`Failed to load manifest for ${packageId}:`, e);
		} finally {
			loading = false;
		}
	});

	async function checkAvailability(tag: string) {
		// Check if API docs exist for this version
		try {
			const apiResponse = await fetch(`${base}/${packageId}/${tag}/api.json`, { method: 'HEAD' });
			apiAvailable = apiResponse.ok;
		} catch {
			apiAvailable = false;
		}

		// Check if examples exist for this version
		try {
			const manifestResponse = await fetch(`${base}/${packageId}/${tag}/manifest.json`);
			if (manifestResponse.ok) {
				const versionManifest = await manifestResponse.json();
				examplesAvailable = versionManifest.notebooks && versionManifest.notebooks.length > 0;
			} else {
				examplesAvailable = false;
			}
		} catch {
			examplesAvailable = false;
		}
	}

	// Build versioned paths
	let apiPath = $derived(selectedTag ? `${base}/${packageId}/${selectedTag}/api` : `${base}/${pkg.api}`);
	let examplesPath = $derived(selectedTag ? `${base}/${packageId}/${selectedTag}/examples` : pkg.examples ? `${base}/${pkg.examples}` : null);
</script>

<svelte:head>
	<title>{pkg.name}</title>
	<meta name="description" content="{pkg.name} - {pkg.description}" />
</svelte:head>

<Tooltip />

<div class="hero">
	<img src="{base}/{pkg.logo}" alt={pkg.name} class="hero-logo" />
	<p class="description">{pkg.description}</p>
	<div class="hero-actions">
		{#if loading}
			<span class="loading-actions">
				<Icon name="loader" size={16} />
			</span>
		{:else}
			{#if apiAvailable}
				<a href={apiPath} class="action-card">
					<Icon name="braces" size={20} />
					<span class="action-label">API</span>
				</a>
			{/if}
			{#if examplesAvailable && examplesPath}
				<a href={examplesPath} class="action-card">
					<Icon name="play" size={20} />
					<span class="action-label">Examples</span>
				</a>
			{/if}
		{/if}
		<a href={pkg.github} class="action-card">
			<Icon name="github" size={20} />
			<span class="action-label">GitHub</span>
		</a>
		{#if pkg.pypi}
			<a href={pkg.pypi} class="action-card">
				<Icon name="package" size={20} />
				<span class="action-label">PyPI</span>
			</a>
		{/if}
	</div>
</div>

{#if pkg.features.length > 0}
	<h2 id="key-features">Key Features</h2>

	<div class="tile-grid {featureCols}">
		{#each pkg.features as feature}
			<div class="tile elevated">
				<div class="panel-header">{feature.title}</div>
				<div class="panel-body tile-body">{feature.description}</div>
			</div>
		{/each}
	</div>
{/if}

{#if pkg.installation.length > 0}
	<h2 id="installation">Installation</h2>

	<div class="install-grid">
		{#each pkg.installation as option}
			<button class="install-card elevated" onclick={() => handleCopy(option.command, option.name)}>
				<div class="panel-header">
					<span>{option.name}</span>
					<div class="header-actions">
						<span class="icon-btn" class:copied={copiedStates[option.name]} use:tooltip={copiedStates[option.name] ? 'Copied!' : 'Copy'}>
							<Icon name={copiedStates[option.name] ? 'check' : 'copy'} size={14} />
						</span>
					</div>
				</div>
				<div class="install-body">
					<code>{option.command}</code>
				</div>
			</button>
		{/each}
	</div>
{/if}

{#if pkg.quickstart}
	<h2 id="quick-start">Quick Start</h2>

	<p class="quickstart-description">{pkg.quickstart.description}</p>

	<NotebookCell
		id="quickstart"
		code={pkg.quickstart.code}
		title={pkg.quickstart.title || 'Python'}
		editable={true}
	/>
{/if}

<div class="page-bottom-spacer"></div>

<style>
	.quickstart-description {
		color: var(--text-muted);
	}

	.page-bottom-spacer {
		height: var(--space-2xl);
	}

	.loading-actions {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-md);
		color: var(--text-muted);
	}

	.loading-actions :global(svg) {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}
</style>
