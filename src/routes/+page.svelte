<script lang="ts">
	import { onMount } from 'svelte';
	import { base } from '$app/paths';
	import { goto } from '$app/navigation';
	import Icon from '$lib/components/common/Icon.svelte';
	import Tooltip, { tooltip } from '$lib/components/common/Tooltip.svelte';
	import { packages, packageOrder, nav } from '$lib/config/packages';
	import { search, searchIndexStore, type SearchResult } from '$lib/utils/search';
	import { searchTarget } from '$lib/stores/searchNavigation';

	let searchQuery = $state('');
	let debouncedQuery = $state('');
	// Subscribe to store for reactivity, then compute search results
	let searchIndex = $derived($searchIndexStore);
	let searchResults = $derived.by(() => {
		// Depend on searchIndex to trigger re-computation when index loads
		searchIndex;
		return search(debouncedQuery, 8);
	});
	let showResults = $derived(searchQuery.length > 0);

	// Debounce search query (150ms delay)
	$effect(() => {
		const query = searchQuery;
		const timeout = setTimeout(() => {
			debouncedQuery = query;
		}, 150);
		return () => clearTimeout(timeout);
	});
	let searchInput = $state<HTMLInputElement | null>(null);

	function handleGlobalKeydown(event: KeyboardEvent) {
		if ((event.ctrlKey || event.metaKey) && event.key === 'f') {
			event.preventDefault();
			searchInput?.focus();
		}
	}

	onMount(() => {
		window.addEventListener('keydown', handleGlobalKeydown);
		return () => {
			window.removeEventListener('keydown', handleGlobalKeydown);
		};
	});

	function handleSearchKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			if (searchQuery) {
				searchQuery = '';
			} else {
				searchInput?.blur();
			}
			event.stopPropagation();
		}
	}

	function handleResultClick(result: SearchResult) {
		searchQuery = '';
		searchTarget.set({
			name: result.name,
			type: result.type,
			parentClass: result.parentClass,
			source: 'search'
		});
		goto(`${base}/${result.path}`);
	}

	function getTypeIcon(type: SearchResult['type']): string {
		switch (type) {
			case 'page': return 'file';
			case 'module': return 'package';
			case 'class': return 'box';
			case 'function': return 'zap';
			case 'method': return 'code';
			case 'example': return 'play';
		}
	}
</script>

<svelte:head>
	<title>PathSim Docs</title>
	<meta name="description" content="Documentation for PathSim - A Python framework for simulating dynamical systems" />
</svelte:head>

<Tooltip />

<div class="page-wrapper">
	<main>
		<header class="hero">
			<img src="{base}/pathsim_logo.png" alt="PathSim" class="hero-logo" />
			<p class="tagline">Documentation for the PathSim ecosystem</p>
			<p class="description">
				API reference, tutorials, and examples for PathSim and its domain-specific toolboxes.
			</p>
			<div class="hero-search">
				<div class="search-box elevated">
					<Icon name="search" size={16} />
					<input
						type="text"
						placeholder="Search the API..."
						bind:value={searchQuery}
						bind:this={searchInput}
						onkeydown={handleSearchKeydown}
					/>
					{#if searchQuery}
						<button class="clear-btn" onclick={() => (searchQuery = '')}>
							<Icon name="x" size={14} />
						</button>
					{/if}
				</div>
			</div>
			<div class="hero-actions">
				<a href={nav.home} class="action-card">
					<Icon name="home" size={20} />
					<span class="action-label">Home</span>
				</a>
				<a href="{base}/{packages.pathsim.docs}" class="action-card">
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

	{#if showResults}
		<main>
			<section class="search-results-section">
				<h2>Search Results</h2>
				{#if searchResults.length > 0}
					<div class="results-grid">
						{#each searchResults as result}
							<button class="result-card elevated" onclick={() => handleResultClick(result)}>
								<div class="result-icon">
									<Icon name={getTypeIcon(result.type)} size={16} />
								</div>
								<div class="result-content">
									<span class="result-name">{result.name}</span>
									<span class="result-context">{result.parentClass || result.moduleName}</span>
								</div>
							</button>
						{/each}
					</div>
				{:else}
					<div class="no-results">No results found for "{searchQuery}"</div>
				{/if}
			</section>
		</main>
		<div class="separator"></div>
	{/if}

	<main>
		<section class="packages">
		<h2>Packages</h2>
		<div class="package-grid">
			{#each packageOrder as pkgId}
				{@const pkg = packages[pkgId]}
				<div class="package-card elevated">
					<div class="panel-header">
						<span>{pkg.shortName}</span>
						<div class="header-actions">
							<a href="{base}/{pkg.api}" class="icon-btn" use:tooltip={'API'}>
								<Icon name="braces" size={14} />
							</a>
							<a href="{base}/{pkg.docs}" class="icon-btn" use:tooltip={'Docs'}>
								<Icon name="book" size={14} />
							</a>
							{#if pkg.pypi}
								<a href={pkg.pypi} class="icon-btn" use:tooltip={'PyPI'}>
									<Icon name="package" size={14} />
								</a>
							{/if}
							{#if pkg.examples}
								<a href="{base}/{pkg.examples}" class="icon-btn" use:tooltip={'Examples'}>
									<Icon name="play" size={14} />
								</a>
							{/if}
							<a href={pkg.github} class="icon-btn" use:tooltip={'GitHub'}>
								<Icon name="github" size={14} />
							</a>
						</div>
					</div>
					<a href="{base}/{pkg.docs}" class="package-body">
						<img src="{base}/{pkg.logo}" alt={pkg.name} />
					</a>
				</div>
			{/each}
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
		padding: var(--space-sm) var(--space-md);
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

	/* Search Results Section */
	.search-results-section {
		padding: var(--space-xl) 0;
	}

	.results-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: var(--space-md);
	}

	@media (max-width: 1024px) {
		.results-grid {
			grid-template-columns: repeat(3, 1fr);
		}
	}

	@media (max-width: 768px) {
		.results-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (max-width: 480px) {
		.results-grid {
			grid-template-columns: 1fr;
		}
	}

	.result-card {
		display: flex;
		align-items: center;
		gap: var(--space-md);
		padding: var(--space-md) var(--space-lg);
		background: var(--surface-raised);
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		cursor: pointer;
		text-align: left;
		transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
	}

	.result-card:hover {
		border-color: var(--accent);
		box-shadow: var(--shadow-md), 0 0 0 2px color-mix(in srgb, var(--accent) 25%, transparent);
	}

	.result-icon {
		color: var(--text-muted);
		flex-shrink: 0;
	}

	.result-content {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.result-name {
		font-size: var(--font-base);
		font-weight: 600;
		color: var(--text);
	}

	.result-context {
		font-size: var(--font-base);
		color: var(--text-muted);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.no-results {
		padding: var(--space-xl);
		text-align: center;
		color: var(--text-muted);
		font-size: var(--font-base);
		background: var(--surface-raised);
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
	}

	.hero-actions {
		display: flex;
		justify-content: center;
		flex-wrap: wrap;
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

		main {
			padding: 0 var(--space-md);
		}

		.hero {
			padding: var(--space-xl) 0;
		}

		.hero-logo {
			height: 100px;
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
