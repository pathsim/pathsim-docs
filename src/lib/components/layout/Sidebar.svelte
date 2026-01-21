<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import Icon from '$lib/components/common/Icon.svelte';
	import { getSidebarItems, type PackageId } from '$lib/config/packages';
	import { apiModulesStore } from '$lib/stores/apiContext';
	import { ApiToc } from '$lib/components/api';
	import ExamplesToc from '$lib/components/examples/ExamplesToc.svelte';
	import { search, type SearchResult } from '$lib/utils/search';
	import { searchTarget } from '$lib/stores/searchNavigation';
	import { exampleGroupsStore } from '$lib/stores/examplesContext';

	interface Props {
		packageId: PackageId;
	}

	let { packageId }: Props = $props();

	let items = $derived(getSidebarItems(packageId));
	let searchQuery = $state('');
	let searchResults = $derived(search(searchQuery, 15));
	let showResults = $derived(searchQuery.length > 0);

	// Check if we're on an API page or examples listing page
	let isApiPage = $derived($page.url.pathname.endsWith('/api'));
	let isExamplesListPage = $derived($page.url.pathname.endsWith('/examples'));

	function isActive(path: string): boolean {
		return $page.url.pathname === path;
	}

	function handleSearchKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && searchQuery) {
			searchQuery = '';
			event.stopPropagation();
		}
	}

	function handleResultClick(result: SearchResult) {
		searchQuery = '';
		// Set the target element to expand/scroll to
		searchTarget.set({
			name: result.name,
			type: result.type,
			parentClass: result.parentClass
		});
		goto(result.path);
	}

	function handleTocNavigate(id: string) {
		// Could track navigation for analytics or other purposes
	}

	function getTypeIcon(type: SearchResult['type']): string {
		switch (type) {
			case 'module': return 'package';
			case 'class': return 'box';
			case 'function': return 'zap';
			case 'method': return 'code';
			case 'example': return 'play';
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
				class="search-input"
				onkeydown={handleSearchKeydown}
			/>
			{#if searchQuery}
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
								<span class="result-context">{result.parentClass || result.moduleName.split('.').pop()}</span>
							</div>
						</button>
					{/each}
				{:else}
					<div class="no-results">No results found</div>
				{/if}
			</nav>
		{:else}
			<nav class="sidebar-nav">
				{#each items as item}
					<a href={item.path} class="sidebar-item" class:active={isActive(item.path)}>
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
		<div class="sidebar-scrollable">
			<ApiToc modules={$apiModulesStore} onNavigate={handleTocNavigate} />
		</div>
	{:else if !showResults && isExamplesListPage && $exampleGroupsStore.length > 0}
		<div class="sidebar-scrollable">
			<ExamplesToc groups={$exampleGroupsStore} {packageId} />
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

	.search-container {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		height: var(--header-height);
		padding: 0 var(--space-md);
		border-bottom: 1px solid var(--border);
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
