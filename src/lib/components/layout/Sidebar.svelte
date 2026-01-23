<script lang="ts">
	import { onMount } from 'svelte';
	import { base } from '$app/paths';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import Icon from '$lib/components/common/Icon.svelte';
	import VersionSelector from './VersionSelector.svelte';
	import { getSidebarItems, type PackageId } from '$lib/config/packages';
	import { apiModulesStore } from '$lib/stores/apiContext';
	import { ApiToc } from '$lib/components/api';
	import ExamplesToc from '$lib/components/examples/ExamplesToc.svelte';
	import { search, hybridSearch, type SearchResult } from '$lib/utils/search';
	import { searchTarget } from '$lib/stores/searchNavigation';
	import { exampleGroupsStore } from '$lib/stores/examplesContext';
	import type { PackageManifest } from '$lib/api/versions';
	import { versionHasExamples } from '$lib/api/versions';

	interface Props {
		packageId: PackageId;
		manifest?: PackageManifest;
		currentTag?: string;
	}

	let { packageId, manifest, currentTag }: Props = $props();

	// Check if current version has examples
	let hasExamples = $derived(
		manifest && currentTag ? versionHasExamples(currentTag, manifest) : false
	);

	// Filter sidebar items based on examples availability
	let items = $derived(
		getSidebarItems(packageId, currentTag).filter(
			(item) => item.title !== 'Examples' || hasExamples
		)
	);
	let searchQuery = $state('');
	let debouncedQuery = $state('');
	let searchResults = $state<SearchResult[]>([]);
	let isSearching = $state(false);
	let showResults = $derived(searchQuery.length > 0);

	// Debounce search query (150ms delay)
	$effect(() => {
		const query = searchQuery;
		const timeout = setTimeout(() => {
			debouncedQuery = query;
		}, 150);
		return () => clearTimeout(timeout);
	});

	// Run hybrid search when debounced query changes
	$effect(() => {
		const query = debouncedQuery;
		if (!query) {
			searchResults = [];
			isSearching = false;
			return;
		}

		// Track if this search is still relevant
		let cancelled = false;

		// Run hybrid search with semantic fallback
		hybridSearch(query, 15, () => {
			// Callback when semantic search starts
			if (!cancelled) {
				isSearching = true;
			}
		}).then((result) => {
			if (!cancelled) {
				searchResults = result.results;
				isSearching = false;
			}
		}).catch(() => {
			if (!cancelled) {
				// Fallback to keyword search on error
				searchResults = search(query, 15);
				isSearching = false;
			}
		});

		return () => {
			cancelled = true;
		};
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

	// Check if we're on an API page or examples page
	let isApiPage = $derived($page.url.pathname.includes('/api'));
	let isExamplesPage = $derived($page.url.pathname.includes('/examples'));
	let isVersionedPage = $derived(isApiPage || isExamplesPage);

	// Check if we're on an overview page (no /api or /examples in path)
	let isOverviewPage = $derived(!isApiPage && !$page.url.pathname.includes('/examples'));

	function isActive(path: string): boolean {
		return $page.url.pathname === `${base}/${path}`;
	}

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
		// Set the target element to expand/scroll to
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
			case 'page':
				return 'file';
			case 'module':
				return 'package';
			case 'class':
				return 'box';
			case 'function':
				return 'zap';
			case 'method':
				return 'code';
			case 'example':
				return 'play';
		}
	}

</script>

<aside class="sidebar">
	<div class="sidebar-fixed">
		<div class="search-container">
			<span class="search-icon"><Icon name="search" size={14} /></span>
			<input
				type="text"
				placeholder="Search docs..."
				bind:value={searchQuery}
				bind:this={searchInput}
				class="search-input"
				onkeydown={handleSearchKeydown}
			/>
			{#if isSearching}
				<span class="search-spinner"></span>
			{:else if searchQuery}
				<button class="clear-btn" onclick={() => (searchQuery = '')}>
					<Icon name="x" size={12} />
				</button>
			{/if}
		</div>

		{#if showResults}
			<nav class="sidebar-nav search-results">
				{#if searchResults.length > 0}
					{#each searchResults as result}
						<button class="search-result" onclick={() => handleResultClick(result)}>
							<Icon name={getTypeIcon(result.type)} size={14} />
							<div class="result-text">
								<span class="result-name">{result.name}</span>
								<span class="result-context"
									>{result.parentClass || result.moduleName.split('.').pop()}</span
								>
							</div>
						</button>
					{/each}
				{:else}
					<div class="no-results">No results found</div>
				{/if}
			</nav>
		{:else}
			<!-- Version selector - show whenever manifest is available -->
			{#if manifest && currentTag}
				<VersionSelector {packageId} {manifest} {currentTag} />
			{/if}

			<nav class="sidebar-nav">
				{#each items as item}
					<a href="{base}/{item.path}" class="sidebar-item" class:active={isActive(item.path)}>
						{#if item.icon}
							<Icon name={item.icon} size={14} />
						{/if}
						<span>{item.title}</span>
					</a>
				{/each}
			</nav>
		{/if}

	</div>

	{#if !showResults && isApiPage && $apiModulesStore.length > 0}
		<div class="sidebar-scrollable with-separator">
			<ApiToc modules={$apiModulesStore} />
		</div>
	{:else if !showResults && isExamplesPage && $exampleGroupsStore.length > 0}
		<div class="sidebar-scrollable with-separator">
			<ExamplesToc groups={$exampleGroupsStore} {packageId} currentTag={currentTag} />
		</div>
	{/if}
</aside>

<style>
	.sidebar {
		width: var(--sidebar-width);
		flex-shrink: 0;
		display: flex;
		flex-direction: column;
		background: var(--surface);
		border-right: 1px solid var(--border);
	}

	.sidebar-fixed {
		flex-shrink: 0;
	}

	.sidebar-scrollable {
		flex: 1;
		overflow-y: auto;
		min-height: 0;
	}

	.sidebar-scrollable.with-separator {
		border-top: 1px solid var(--border);
	}

	.search-container {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		height: var(--header-height);
		padding: 0 var(--space-md);
		border-bottom: 1px solid var(--border);
		transition:
			border-color var(--transition-fast),
			box-shadow var(--transition-fast);
	}

	.search-container:focus-within {
		box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--accent) 25%, transparent);
	}

	.search-icon {
		color: var(--text-muted);
		flex-shrink: 0;
	}

	.search-input {
		flex: 1;
		background: transparent;
		border: none;
		border-radius: 0;
		font-size: var(--font-base);
		color: var(--text);
		outline: none;
		box-shadow: none;
		padding: 0;
	}

	.search-input::placeholder {
		color: var(--text-muted);
	}

	.clear-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		background: none;
		border: none;
		color: var(--text-muted);
		padding: 2px;
		cursor: pointer;
	}

	.clear-btn:hover {
		color: var(--text);
	}

	.search-spinner {
		width: 14px;
		height: 14px;
		border: 2px solid var(--border);
		border-top-color: var(--accent);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
		flex-shrink: 0;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.search-results {
		overflow-y: auto;
		max-height: calc(100vh - var(--header-height) - var(--header-height));
	}

	button.search-result {
		display: flex;
		align-items: flex-start;
		justify-content: flex-start;
		gap: var(--space-sm);
		padding: var(--space-sm);
		background: none;
		border: none;
		border-radius: var(--radius-sm);
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

	.sidebar-nav {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
		padding: var(--space-md);
	}

	.sidebar-item {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		padding: var(--space-sm) var(--space-md);
		font-size: var(--font-base);
		font-weight: 500;
		color: var(--text-muted);
		text-transform: uppercase;
		text-decoration: none;
		border-radius: var(--radius-sm);
		transition: all var(--transition-fast);
	}

	.sidebar-item:hover {
		color: var(--text);
		background: var(--surface-hover);
		text-decoration: none;
	}

	.sidebar-item.active {
		color: var(--accent);
		background: var(--accent-bg);
	}

	.sidebar-item :global(svg) {
		flex-shrink: 0;
	}
</style>
