<script lang="ts">
	import Icon from '$lib/components/common/Icon.svelte';
	import Tooltip, { tooltip } from '$lib/components/common/Tooltip.svelte';
	import CodeBlock from '$lib/components/common/CodeBlock.svelte';
	import { packages, type PackageId } from '$lib/config/packages';
	import { copyToClipboard } from '$lib/utils/clipboard';

	interface Props {
		packageId: PackageId;
	}

	let { packageId }: Props = $props();

	let pkg = $derived(packages[packageId]);
	let featureCols = $derived(pkg.features.length > 4 ? 'cols-3' : 'cols-2');

	// Track copy state for each install option
	let copiedStates = $state<Record<string, boolean>>({});

	function handleCopy(command: string, name: string) {
		copyToClipboard(
			command,
			() => (copiedStates[name] = true),
			() => (copiedStates[name] = false)
		);
	}
</script>

<svelte:head>
	<title>{pkg.name} Documentation</title>
	<meta name="description" content="{pkg.name} - {pkg.description}" />
</svelte:head>

<Tooltip />

<div class="hero">
	<img src={pkg.logo} alt={pkg.name} class="hero-logo" />
	<p class="description">{pkg.description}</p>
	<div class="hero-actions">
		<a href={pkg.api} class="action-card">
			<Icon name="braces" size={20} />
			<span class="action-label">API</span>
		</a>
		<a href={pkg.examples} class="action-card">
			<Icon name="play" size={20} />
			<span class="action-label">Examples</span>
		</a>
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

<h2 id="key-features">Key Features</h2>

<div class="tile-grid {featureCols}">
	{#each pkg.features as feature}
		<div class="tile">
			<div class="panel-header">{feature.title}</div>
			<div class="panel-body tile-body">{feature.description}</div>
		</div>
	{/each}
</div>

{#if pkg.installation.length > 0}
	<h2 id="installation">Installation</h2>

	<div class="install-grid">
		{#each pkg.installation as option}
			<button class="install-card" onclick={() => handleCopy(option.command, option.name)}>
				<div class="panel-header">
					<span>{option.name}</span>
					<div class="header-actions">
						<span class="icon-btn" use:tooltip={copiedStates[option.name] ? 'Copied!' : 'Copy'}>
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

	<p>{pkg.quickstart.description}</p>

	<CodeBlock code={pkg.quickstart.code} title={pkg.quickstart.title || 'Example'} />
{/if}

