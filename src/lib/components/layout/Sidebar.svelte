<script lang="ts">
	import { page } from '$app/stores';
	import Icon from '$lib/components/common/Icon.svelte';
	import { getSidebarItems, type PackageId } from '$lib/config/packages';

	interface Props {
		packageId: PackageId;
	}

	let { packageId }: Props = $props();

	let items = $derived(getSidebarItems(packageId));
	let searchQuery = $state('');

	function isActive(path: string): boolean {
		return $page.url.pathname === path;
	}

	function handleSearchKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && searchQuery) {
			searchQuery = '';
			event.stopPropagation();
		}
	}
</script>

<aside class="sidebar">
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
</aside>

<style>
	.sidebar {
		width: var(--sidebar-width);
		flex-shrink: 0;
		align-self: stretch;
		display: flex;
		flex-direction: column;
		background: var(--surface);
		border-right: 1px solid var(--border);
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
		font-size: var(--font-sm);
		color: var(--text-muted);
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
