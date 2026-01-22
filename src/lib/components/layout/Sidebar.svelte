<script lang="ts">
	import { onMount } from 'svelte';
	import { base } from '$app/paths';
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
	import type { PackageManifest } from '$lib/api/versions';
	import { isLatestTag, versionHasExamples } from '$lib/api/versions';

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
	let searchResults = $derived(search(searchQuery, 15));
	let showResults = $derived(searchQuery.length > 0);
	let searchInput = $state<HTMLInputElement | null>(null);
	let versionDropdownOpen = $state(false);
	let versionDropdownRef = $state<HTMLDivElement | null>(null);

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
			parentClass: result.parentClass
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

	// Version selector
	function toggleVersionDropdown() {
		versionDropdownOpen = !versionDropdownOpen;
	}

	async function selectVersion(tag: string) {
		versionDropdownOpen = false;

		// Update stored version preference
		const { versionStore } = await import('$lib/stores/versionStore');
		versionStore.setVersion(packageId, tag);

		// Check if the new version has examples
		const newVersionHasExamples = manifest ? versionHasExamples(tag, manifest) : false;

		// Preserve current hash if it exists
		const hash = typeof window !== 'undefined' ? window.location.hash : '';

		// Get current page type (api or examples or overview)
		const pathname = $page.url.pathname;

		if (pathname.includes('/examples')) {
			// On examples page - check if new version has examples
			if (newVersionHasExamples) {
				if (pathname.includes('/examples/')) {
					// We're on a specific example page
					const match = pathname.match(/\/examples\/(.+)$/);
					const subPath = match ? `/${match[1]}` : '';
					goto(`${base}/${packageId}/${tag}/examples${subPath}${hash}`, { invalidateAll: true });
				} else {
					goto(`${base}/${packageId}/${tag}/examples${hash}`, { invalidateAll: true });
				}
			} else {
				// New version has no examples - go to overview
				goto(`${base}/${packageId}`, { invalidateAll: true });
			}
		} else if (pathname.includes('/api')) {
			goto(`${base}/${packageId}/${tag}/api${hash}`, { invalidateAll: true });
		} else {
			// On overview page - reload to pick up new version
			const { invalidateAll } = await import('$app/navigation');
			await invalidateAll();
		}
	}

	function handleVersionClickOutside(event: MouseEvent) {
		if (versionDropdownRef && !versionDropdownRef.contains(event.target as Node)) {
			versionDropdownOpen = false;
		}
	}

	function handleVersionKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			versionDropdownOpen = false;
		}
	}

	$effect(() => {
		if (versionDropdownOpen) {
			document.addEventListener('click', handleVersionClickOutside);
			document.addEventListener('keydown', handleVersionKeydown);
		}
		return () => {
			document.removeEventListener('click', handleVersionClickOutside);
			document.removeEventListener('keydown', handleVersionKeydown);
		};
	});
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
				<div class="version-selector-container" bind:this={versionDropdownRef}>
					<button
						class="version-selector-trigger"
						onclick={toggleVersionDropdown}
						aria-expanded={versionDropdownOpen}
					>
						<span class="version-text">{currentTag}</span>
						<Icon name="chevron-down" size={10} />
					</button>

					{#if versionDropdownOpen}
						<div class="version-dropdown">
							{#each manifest.versions as v}
								{@const isSelected = v.tag === currentTag}
								{@const isLatest = isLatestTag(v.tag, manifest)}
								<button
									class="version-item"
									class:selected={isSelected}
									onclick={() => selectVersion(v.tag)}
								>
									<span class="version-tag">{v.tag}</span>
									{#if isLatest}
										<span class="latest-badge">latest</span>
									{/if}
								</button>
							{/each}
						</div>
					{/if}
				</div>
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

	/* Version selector */
	.version-selector-container {
		position: relative;
		padding: var(--space-sm) var(--space-md);
		border-bottom: 1px solid var(--border);
	}

	.version-selector-trigger {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		width: 100%;
		padding: var(--space-xs) var(--space-sm);
		background: var(--surface-raised);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		color: var(--text-muted);
		font-family: var(--font-mono);
		font-size: var(--font-base);
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.version-selector-trigger:hover {
		color: var(--text);
		border-color: var(--border-hover);
	}

	.version-text {
		flex: 1;
		text-align: left;
	}

	.version-dropdown {
		position: absolute;
		top: 100%;
		left: var(--space-md);
		right: var(--space-md);
		margin-top: var(--space-xs);
		background: var(--surface-raised);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-md);
		overflow: hidden;
		z-index: var(--z-dropdown);
		max-height: 300px;
		overflow-y: auto;
	}

	.version-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-sm);
		width: 100%;
		padding: var(--space-xs) var(--space-md);
		background: transparent;
		border: none;
		border-radius: 0;
		color: var(--text-muted);
		font-family: var(--font-mono);
		font-size: var(--font-base);
		text-align: left;
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.version-item:hover {
		background: var(--surface-hover);
		color: var(--text);
	}

	.version-item.selected {
		color: var(--accent);
	}

	.latest-badge {
		font-size: 10px;
		color: var(--text-disabled);
		text-transform: uppercase;
		letter-spacing: 0.5px;
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
