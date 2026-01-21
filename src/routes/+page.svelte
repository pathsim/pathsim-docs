<script lang="ts">
	import { goto } from '$app/navigation';
	import Icon from '$lib/components/common/Icon.svelte';
	import Tooltip, { tooltip } from '$lib/components/common/Tooltip.svelte';
	import { packages, nav } from '$lib/config/packages';
	import { search, type SearchResult } from '$lib/utils/search';
	import { searchTarget } from '$lib/stores/searchNavigation';

	let searchQuery = $state('');
	let searchResults = $derived(search(searchQuery, 8));
	let showResults = $derived(searchQuery.length > 0);

	function handleSearchKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && searchQuery) {
			searchQuery = '';
			event.stopPropagation();
		}
	}

	function handleResultClick(result: SearchResult) {
		searchQuery = '';
		searchTarget.set({
			name: result.name,
			type: result.type,
			parentClass: result.parentClass
		});
		goto(result.path);
	}

	function getTypeIcon(type: SearchResult['type']): string {
		switch (type) {
			case 'module': return 'package';
			case 'class': return 'box';
			case 'function': return 'zap';
			case 'method': return 'code';
		}
	}
</script>

<svelte:head>
	<title>PathSim Documentation</title>
	<meta name="description" content="Documentation for PathSim - A Python framework for simulating dynamical systems" />
</svelte:head>

<Tooltip />

<div class="page-wrapper">
	<main>
		<header class="hero">
			<img src="/pathsim_logo.png" alt="PathSim" class="hero-logo" />
			<p class="tagline">Documentation for the PathSim ecosystem</p>
			<p class="description">
				API reference, tutorials, and examples for PathSim and its domain-specific toolboxes.
			</p>
			<div class="hero-search">
				<div class="search-box">
					<Icon name="search" size={16} />
					<input
						type="text"
						placeholder="Search the API..."
						bind:value={searchQuery}
						onkeydown={handleSearchKeydown}
					/>
					{#if searchQuery}
						<button class="clear-btn" onclick={() => (searchQuery = '')}>
							<Icon name="x" size={14} />
						</button>
					{/if}
				</div>
				{#if showResults}
					<div class="search-results">
						{#if searchResults.length > 0}
							{#each searchResults as result}
								<button class="search-result" onclick={() => handleResultClick(result)}>
									<Icon name={getTypeIcon(result.type)} size={14} />
									<div class="result-text">
										<span class="result-name">{result.name}</span>
										<span class="result-context">{result.parentClass || result.moduleName.split('.').pop()}</span>
									</div>
								</button>
							{/each}
						{:else}
							<div class="no-results">No results found</div>
						{/if}
					</div>
				{/if}
			</div>
			<div class="hero-actions">
				<a href={nav.home} class="action-card">
					<Icon name="home" size={20} />
					<span class="action-label">Home</span>
				</a>
				<a href={packages.pathsim.docs} class="action-card">
					<Icon name="zap" size={20} />
					<span class="action-label">Get Started</span>
				</a>
				<a href={nav.tryOnline} class="action-card">
					<Icon name="play" size={20} />
					<span class="action-label">Try Online</span>
				</a>
				<a href={nav.github} class="action-card">
					<Icon name="github" size={20} />
					<span class="action-label">GitHub</span>
				</a>
				<a href={nav.sponsor} class="action-card">
					<Icon name="heart" size={20} />
					<span class="action-label">Sponsor</span>
				</a>
			</div>
		</header>
	</main>

	<div class="separator"></div>

	<main>
		<section class="packages">
		<h2>Packages</h2>
		<div class="package-grid">
			<div class="package-card">
				<div class="panel-header">
					<span>{packages.pathsim.shortName}</span>
					<div class="header-actions">
						<a href={packages.pathsim.api} class="icon-btn" use:tooltip={'API'}>
							<Icon name="braces" size={14} />
						</a>
						<a href={packages.pathsim.docs} class="icon-btn" use:tooltip={'Docs'}>
							<Icon name="book" size={14} />
						</a>
						<a href={packages.pathsim.pypi} class="icon-btn" use:tooltip={'PyPI'}>
							<Icon name="package" size={14} />
						</a>
						<a href={packages.pathsim.examples} class="icon-btn" use:tooltip={'Examples'}>
							<Icon name="play" size={14} />
						</a>
						<a href={packages.pathsim.github} class="icon-btn" use:tooltip={'GitHub'}>
							<Icon name="github" size={14} />
						</a>
					</div>
				</div>
				<a href={packages.pathsim.docs} class="package-body">
					<img src={packages.pathsim.logo} alt={packages.pathsim.name} />
				</a>
			</div>
			<div class="package-card">
				<div class="panel-header">
					<span>{packages.chem.shortName}</span>
					<div class="header-actions">
						<a href={packages.chem.api} class="icon-btn" use:tooltip={'API'}>
							<Icon name="braces" size={14} />
						</a>
						<a href={packages.chem.docs} class="icon-btn" use:tooltip={'Docs'}>
							<Icon name="book" size={14} />
						</a>
						<a href={packages.chem.pypi} class="icon-btn" use:tooltip={'PyPI'}>
							<Icon name="package" size={14} />
						</a>
						<a href={packages.chem.examples} class="icon-btn" use:tooltip={'Examples'}>
							<Icon name="play" size={14} />
						</a>
						<a href={packages.chem.github} class="icon-btn" use:tooltip={'GitHub'}>
							<Icon name="github" size={14} />
						</a>
					</div>
				</div>
				<a href={packages.chem.docs} class="package-body">
					<img src={packages.chem.logo} alt={packages.chem.name} />
				</a>
			</div>
			<div class="package-card">
				<div class="panel-header">
					<span>{packages.vehicle.shortName}</span>
					<div class="header-actions">
						<a href={packages.vehicle.api} class="icon-btn" use:tooltip={'API'}>
							<Icon name="braces" size={14} />
						</a>
						<a href={packages.vehicle.docs} class="icon-btn" use:tooltip={'Docs'}>
							<Icon name="book" size={14} />
						</a>
						<a href={packages.vehicle.pypi} class="icon-btn" use:tooltip={'PyPI'}>
							<Icon name="package" size={14} />
						</a>
						<a href={packages.vehicle.examples} class="icon-btn" use:tooltip={'Examples'}>
							<Icon name="play" size={14} />
						</a>
						<a href={packages.vehicle.github} class="icon-btn" use:tooltip={'GitHub'}>
							<Icon name="github" size={14} />
						</a>
					</div>
				</div>
				<a href={packages.vehicle.docs} class="package-body">
					<img src={packages.vehicle.logo} alt={packages.vehicle.name} />
				</a>
			</div>
		</div>
		</section>
	</main>
</div>

<style>
	.page-wrapper {
		flex: 1;
		overflow-x: hidden;
		overflow-y: auto;
	}

	main {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 var(--space-lg);
	}

	.hero {
		text-align: center;
		padding: var(--space-2xl) 0;
	}

	.hero-logo {
		height: 140px;
		width: auto;
		margin-bottom: var(--space-lg);
	}

	.tagline {
		font-size: var(--font-lg);
		font-weight: 600;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.5px;
		margin-bottom: var(--space-md);
	}

	.description {
		font-size: var(--font-base);
		color: var(--text-muted);
		margin-bottom: var(--space-2xl);
	}

	.hero-search {
		position: relative;
		max-width: 400px;
		margin: 0 auto var(--space-xl);
	}

	.search-box {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		padding: var(--space-md) var(--space-lg);
		background: var(--surface-raised);
		border: 1px solid var(--border);
		border-radius: 9999px;
		color: var(--text-muted);
	}

	.search-box:focus-within {
		border-color: var(--accent);
		box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent) 25%, transparent);
	}

	.search-box input {
		flex: 1;
		background: transparent;
		border: none;
		box-shadow: none;
		font-size: var(--font-base);
		color: var(--text);
		outline: none;
	}

	.search-box input::placeholder {
		color: var(--text-muted);
	}

	.search-box .clear-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		background: none;
		border: none;
		color: var(--text-muted);
		padding: 2px;
		cursor: pointer;
	}

	.search-box .clear-btn:hover {
		color: var(--text);
	}

	.search-results {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		margin-top: var(--space-sm);
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		max-height: 400px;
		overflow-y: auto;
		z-index: 100;
		padding: var(--space-sm) 0;
	}

	button.search-result {
		display: flex;
		align-items: flex-start;
		justify-content: flex-start;
		gap: var(--space-sm);
		padding: var(--space-sm) var(--space-md);
		background: none;
		border: none;
		text-align: left;
		cursor: pointer;
		color: var(--text-muted);
		transition: all var(--transition-fast);
		width: 100%;
	}

	button.search-result:hover {
		color: var(--text);
		background: var(--surface-hover);
	}

	.search-result :global(svg) {
		flex-shrink: 0;
		margin-top: 2px;
	}

	.result-text {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
	}

	.result-name {
		font-size: var(--font-base);
	}

	.result-context {
		font-size: var(--font-base);
	}

	.no-results {
		padding: var(--space-lg);
		text-align: center;
		color: var(--text-muted);
		font-size: var(--font-base);
	}

	.hero-actions {
		display: flex;
		justify-content: center;
		gap: var(--space-xs);
	}

	section {
		padding: var(--space-xl) 0;
	}

	h2 {
		font-size: var(--font-base);
		font-weight: 600;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.5px;
		margin-bottom: var(--space-lg);
	}

	.package-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: var(--space-lg);
	}

	@media (max-width: 900px) {
		.package-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (max-width: 600px) {
		.package-grid {
			grid-template-columns: 1fr;
		}
	}

	.package-card {
		border-radius: var(--radius-lg);
		border: 1px solid var(--border);
		overflow: hidden;
		transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
	}

	.package-card:hover {
		border-color: var(--accent);
		box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent) 25%, transparent);
	}

	.header-actions {
		display: flex;
		gap: var(--space-xs);
	}

	.package-body {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-xl);
		background: var(--surface);
		text-decoration: none;
	}

	.package-body img {
		height: 100px;
		width: auto;
		object-fit: contain;
	}
</style>
